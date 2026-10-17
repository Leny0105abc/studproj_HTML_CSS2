import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import {
    Worker,
    isMainThread,
    parentPort,
    workerData,
} from 'node:worker_threads';
import assert from 'node:assert/strict';
import { createCppEngine } from '../resources/js/cpp-engine.js';

if (isMainThread) {
    const server = createServer(async (req, res) => {
        try {
            const path = req.url.split('?')[0];
            if (
                !/^\/(bin\/(clang\.wasm\.gz|lld\.wasm\.gz|memfs\.wasm\.gz|sysroot\.tar\.gz)|runtime-manifest\.v1\.json)$/.test(
                    path,
                )
            )
                throw Error();
            res.end(await readFile('public/cpp-runtime' + path));
        } catch {
            res.writeHead(404).end();
        }
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const baseUrl = `http://127.0.0.1:${server.address().port}/`;
    async function job(mode) {
        const worker = new Worker(new URL(import.meta.url), {
            workerData: { baseUrl, mode },
        });
        let timer;
        return new Promise((resolve, reject) => {
            const deadline = (ms) => {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    worker.terminate();
                    if (mode === 'timeout') resolve();
                    else reject(Error('Runtime deadline exceeded'));
                }, ms);
            };
            deadline(60000);
            worker.on('message', (message) => {
                if (message.phase)
                    deadline(message.phase === 'running' ? 5000 : 30000);
                else if (message.done) {
                    clearTimeout(timer);
                    worker.terminate();
                    resolve();
                } else console.log(message);
            });
            worker.on('error', (error) => {
                clearTimeout(timer);
                reject(error);
            });
            worker.on('exit', (code) => {
                if (code !== 0 && mode !== 'timeout') {
                    clearTimeout(timer);
                    reject(Error('Worker exited ' + code));
                }
            });
        });
    }
    try {
        await job('curriculum');
        await job('security');
        await job('timeout');
        console.log(
            'PASS: 30 examples, sample inputs, exceptions, isolated files, compile diagnostics, memory/output/file limits, and 5-second termination.',
        );
    } finally {
        server.close();
    }
} else {
    const engine = await createCppEngine(workerData.baseUrl, (phase) =>
        parentPort.postMessage({ phase }),
    );
    const normalized = (value) => String(value).replace(/\s+/g, ' ').trim();
    const build = async (code) => {
        const result = await engine.compile(code);
        assert.deepEqual(result.errors, []);
        return result.artifact;
    };
    if (workerData.mode === 'curriculum') {
        const lessons = JSON.parse(
            await readFile('database/data/cpp-course.json', 'utf8'),
        );
        for (const [index, lesson] of lessons.entries()) {
            const artifact = await build(lesson.example_cpp);
            for (const test of lesson.validation_rules.cpp.test_cases) {
                const result = await engine.execute(artifact, test.input);
                assert.equal(result.exitCode, 0, lesson.title);
                assert.equal(
                    normalized(result.stdout),
                    normalized(test.expected),
                    lesson.title,
                );
            }
            parentPort.postMessage(`PASS ${index + 1}: ${lesson.title}`);
        }
    } else if (workerData.mode === 'timeout') {
        await engine.execute(
            await build('int main(){volatile int x=0;while(true){x=1;}}'),
        );
        throw Error('Infinite loop unexpectedly returned');
    } else {
        const bad = await engine.compile('int main(){ broken syntax }');
        assert.ok(bad.errors.length);
        assert.equal(bad.artifact, null);
        const isolated = await build(
            '#include <fstream>\n#include <iostream>\n#include <cstdlib>\nint main(){ std::ifstream env(".env");std::ifstream project("/app/.env");std::ofstream file("demo.txt");file<<42;file.close();std::ifstream check("demo.txt");int n=0;check>>n;std::cout<<env.good()<<" "<<project.good()<<" "<<(getenv("DB_PASSWORD")==nullptr)<<" "<<n;}',
        );
        assert.equal((await engine.execute(isolated)).stdout, '0 0 1 42');
        const clean = await build(
            '#include <fstream>\n#include <iostream>\nint main(){std::ifstream file("demo.txt");std::cout<<file.good();}',
        );
        assert.equal((await engine.execute(clean)).stdout, '0');
        const memory = await build(
            '#include <iostream>\nint main(){std::cout<<(__builtin_wasm_memory_grow(0,2048)==static_cast<size_t>(-1));}',
        );
        assert.equal((await engine.execute(memory)).stdout, '1');
        const noisy = await build(
            '#include <iostream>\nint main(){for(int i=0;i<100000;++i)std::cout<<"0123456789";}',
        );
        await assert.rejects(() => engine.execute(noisy), /Output exceeded/);
        const files = await build(
            '#include <fstream>\n#include <string>\nint main(){std::ofstream f("huge.txt");std::string s(65536,\'x\');for(int i=0;i<100;i++)f<<s;}',
        );
        await assert.rejects(() => engine.execute(files), /1 MiB/);
        const sparse = await build(
            '#include <fstream>\nint main(){std::ofstream file("sparse.txt");file.seekp(1073741824);file<<"x";}',
        );
        await assert.rejects(() => engine.execute(sparse), /1 MiB/);
        parentPort.postMessage(
            'PASS: compile errors, temporary FS, absent secrets, 64 MiB memory ceiling, bounded output and files',
        );
    }
    engine.dispose();
    parentPort.postMessage({ done: true });
}

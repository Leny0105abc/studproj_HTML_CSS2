import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";
import assert from "node:assert/strict";
import { createCppEngine } from "../resources/js/cpp-engine.js";

if (isMainThread) {
    const result = spawnSync(
        "php",
        [
            "scripts/export-programming-examples.php",
            ...(process.argv.includes("--edges") ? ["--edges"] : []),
        ],
        { encoding: "utf8", shell: process.platform === "win32", maxBuffer: 8 * 1024 * 1024 },
    );
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const lessons = JSON.parse(result.stdout);
    const server = createServer(async (req, res) => {
        try {
            const path = req.url.split("?")[0];
            if (
                !/^\/(bin\/(clang\.wasm\.gz|lld\.wasm\.gz|memfs\.wasm\.gz|sysroot\.tar\.gz)|runtime-manifest\.v1\.json)$/.test(
                    path,
                )
            )
                throw Error("Unknown asset");
            res.end(await readFile("public/cpp-runtime" + path));
        } catch {
            res.writeHead(404).end();
        }
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const worker = new Worker(new URL(import.meta.url), {
        workerData: { baseUrl: `http://127.0.0.1:${server.address().port}/`, lessons },
    });
    let timer;
    const deadline = (ms) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            worker.terminate();
            server.close();
            console.error("C++ fixture deadline exceeded.");
            process.exitCode = 1;
        }, ms);
    };
    deadline(120000);
    worker.on("message", (message) => {
        if (message.phase) deadline(message.phase === "running" ? 10000 : 120000);
        else if (message.done) {
            clearTimeout(timer);
            worker.terminate();
            server.close();
        } else console.log(message);
    });
    worker.on("error", (e) => {
        clearTimeout(timer);
        server.close();
        console.error(e);
        process.exitCode = 1;
    });
} else {
    const engine = await createCppEngine(workerData.baseUrl, (phase) =>
        parentPort.postMessage({ phase }),
    );
    for (const lesson of workerData.lessons) {
        const compiled = await engine.compile(lesson.programs.cpp.code);
        assert.deepEqual(compiled.errors, [], `C++ lesson ${lesson.number}`);
        for (const test of lesson.tests) {
            let result;
            try {
                result = await engine.execute(compiled.artifact, test.input);
            } catch (e) {
                if (test.error) continue;
                throw e;
            }
            if (test.error)
                assert.notEqual(result.exitCode, 0, `${lesson.number}: expected rejection`);
            else {
                assert.equal(result.exitCode, 0, `${lesson.number}: ${result.stderr}`);
                assert.equal(
                    result.stdout.replace(/\r\n/g, "\n"),
                    test.expected,
                    `${lesson.number}: ${test.name}`,
                );
            }
        }
        parentPort.postMessage(
            `PASS ${lesson.number}: C++17 compiled; expected success/error cases matched.`,
        );
    }
    parentPort.postMessage(
        `PASS: ${workerData.lessons.length} generated C++17 programs and their success/error cases using the existing WASM engine.`,
    );
    parentPort.postMessage({ done: true });
}

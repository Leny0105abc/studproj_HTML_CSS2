import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Worker } from 'node:worker_threads';

// This test executes the built browser worker in a restricted JS context, with PHP
// confined to WebAssembly. It never evaluates PHP through the host interpreter.
const root = new URL('../', import.meta.url);
const source = await readFile(
    new URL('public/php-runtime/worker.js', root),
    'utf8',
);
const wasm = await readFile(new URL('public/php-runtime/php.wasm', root));
const curriculum = JSON.parse(
    await readFile(new URL('database/data/php-course.json', root), 'utf8'),
);
const wrapper = `
const {parentPort} = require('node:worker_threads');
const {createContext, runInContext} = require('node:vm');
const {webcrypto} = require('node:crypto');
const context = createContext({
    console, WebAssembly, TextEncoder, TextDecoder, ReadableStream, WritableStream, TransformStream,
    URL, Blob, File, Response, Request, Headers, AbortController, EventTarget, Event, CustomEvent, performance, crypto:webcrypto,
    setTimeout, clearTimeout, setInterval, clearInterval, queueMicrotask,
    btoa, atob, location:{href:'blob:isolated-php-test'},
    importScripts:()=>{throw new Error('Imports disabled');},
    WorkerGlobalScope:{[Symbol.hasInstance]:()=>true},
    postMessage:(message)=>parentPort.postMessage(message),
}, {codeGeneration:{strings:false, wasm:true}});
context.self = context;
parentPort.on('message', ({source, payload}) => {
    runInContext(source, context);
    context.onmessage({data:payload});
});
`;
async function run(code, input = '', rules = {}) {
    const worker = new Worker(wrapper, { eval: true });
    return await new Promise((resolve, reject) => {
        let timer = setTimeout(() => {
            void worker.terminate();
            reject(new Error('Runtime initialization timeout'));
        }, 30000);
        const cleanup = () => {
            clearTimeout(timer);
            void worker.terminate();
        };
        worker.on('message', (result) => {
            if (result.type === 'running') {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    cleanup();
                    resolve({ output: '', error: 'Execution timeout' });
                }, 8000);
            } else if (result.type === 'done') {
                cleanup();
                resolve(result);
            }
        });
        worker.on('error', (error) => {
            cleanup();
            reject(error);
        });
        worker.postMessage({
            source,
            payload: {
                code,
                input,
                rules,
                wasm: wasm.buffer.slice(
                    wasm.byteOffset,
                    wasm.byteOffset + wasm.byteLength,
                ),
            },
        });
    });
}
const normalized = (value) => value.replace(/\s+/g, ' ').trim();
for (const lesson of curriculum) {
    const result = await run(
        lesson.example_php,
        '',
        lesson.validation_rules.php,
    );
    assert.equal(result.error, '', `${lesson.title}: ${result.error}`);
    assert.equal(
        normalized(result.output),
        normalized(lesson.expected_result),
        lesson.title,
    );
    assert.deepEqual(result.issues, [], `${lesson.title}: practice checks`);
}
console.log('All 30 authored PHP examples and practice checks passed.');
const request = await run(
    '<?php echo $_POST["name"];',
    '{"post":{"name":"Maria"}}',
);
assert.equal(request.output, 'Maria');
const isolated = await run(
    '<?php echo (int) file_exists("/.env") . "|" . (int) file_exists("/workspace/secret.txt") . "|" . count($_COOKIE);',
);
assert.match(isolated.output, /open_basedir restriction/);
assert.ok(isolated.output.endsWith('0|0|0'));
await run('<?php file_put_contents("/workspace/secret.txt", "temporary");');
assert.equal(
    (await run('<?php echo (int) file_exists("/workspace/secret.txt");'))
        .output,
    '0',
);
const capabilities = await run(
    '<?php foreach (["exec","shell_exec","proc_open","curl_exec","fsockopen","post_message_to_js"] as $name) { echo (int) function_exists($name); }',
);
assert.equal(capabilities.output, '000000');
const memory = await run('<?php $data = str_repeat("x", 100 * 1024 * 1024);');
assert.match(memory.output + memory.error, /memory|allocat/i);
const hardMemory = await run(
    '<?php ini_set("memory_limit", "-1"); $data = str_repeat("x", 300 * 1024 * 1024);',
);
assert.match(
    hardMemory.output + hardMemory.error,
    /memory|allocat|abort|unreachable/i,
);
const excess = await run(
    '<?php for ($i=0; $i<10000; $i++) echo str_repeat("x", 1024);',
);
assert.match(excess.error, /64 KiB/);
const timeout = await run('<?php while (true) {}');
assert.match(timeout.output + timeout.error, /timeout|execution time/i);
const tests = await run(
    '<?php function twice($number) { return $number*2; }',
    '',
    {
        required_functions: ['twice'],
        required_constructs: ['T_FUNCTION'],
        test_cases: [{ function: 'twice', arguments: [3], expected: 6 }],
    },
);
assert.deepEqual(tests.issues, []);
const failure = await run(
    '<?php function twice($number) { return $number; }',
    '',
    { test_cases: [{ function: 'twice', arguments: [3], expected: 6 }] },
);
assert.match(failure.issues.join(' '), /failed/);
console.log(
    'Request data, fresh filesystem, absent cookies/secrets, blocked capabilities, memory ceilings, output limit, timeout, and return-value checks passed.',
);

import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { rolldown } from 'rolldown';
const output = 'public/sql-runtime';
await mkdir(output, { recursive: true });
// Set an actual maximum on the WASM memory, rather than trusting mutable PRAGMAs.
const source = await readFile('node_modules/sql.js/dist/sql-wasm-debug.wasm');
const read = (c) => {
    let v = 0,
        s = 0,
        b;
    do {
        b = source[c.p++];
        v |= (b & 127) << s;
        s += 7;
    } while (b & 128);
    return v >>> 0;
};
const leb = (v) => {
    const a = [];
    do {
        const b = v & 127;
        v >>>= 7;
        a.push(b | (v ? 128 : 0));
    } while (v);
    return a;
};
const parts = [source.subarray(0, 8)],
    cursor = { p: 8 };
let capped = false;
while (cursor.p < source.length) {
    const id = source[cursor.p++],
        size = read(cursor),
        start = cursor.p;
    cursor.p += size;
    let body = source.subarray(start, cursor.p);
    if (id === 5) {
        const c = { p: start },
            count = read(c),
            flags = read(c),
            initial = read(c),
            maximum = flags & 1 ? read(c) : 65536;
        if (count !== 1 || flags & 6 || initial > 1024)
            throw Error('Unexpected SQLite memory layout.');
        body = Buffer.from([
            ...leb(1),
            ...leb(1),
            ...leb(initial),
            ...leb(Math.min(maximum, 1024)),
        ]);
        capped = true;
    }
    parts.push(Buffer.from([id, ...leb(body.length)]), body);
}
if (!capped) throw Error('SQLite memory was not capped.');
const wasm = Buffer.concat(parts);
if (!WebAssembly.validate(wasm)) throw Error('Invalid capped SQLite runtime.');
await writeFile(output + '/sql-wasm.wasm', wasm);
const loader = await readFile(
    'node_modules/sql.js/dist/sql-wasm-debug.js',
    'utf8',
);
if (loader.split('return Module;').length !== 2)
    throw Error('Unexpected sql.js loader layout.');
const adapted = loader.replace(
    'return Module;',
    'Module.codelabVirtualFiles = { FS, MEMFS }; return Module;',
);
// Keep a private copy for the verification script; public worker bundles the same adapter.
await mkdir('storage/app/private/sql-runtime', { recursive: true });
await writeFile('storage/app/private/sql-runtime/loader.cjs', adapted);
const bundle = await rolldown({
    input: 'resources/js/sql-worker.js',
    platform: 'browser',
    plugins: [
        {
            name: 'sqlite-browser-loader',
            resolveId(id) {
                if (id === 'codelab-sqlite') return '\0sqlite-loader.cjs';
            },
            load(id) {
                if (id === '\0sqlite-loader.cjs') return adapted;
            },
        },
    ],
});
await bundle.write({ file: output + '/worker.js', format: 'iife' });
await bundle.close();
await copyFile('node_modules/sql.js/LICENSE', output + '/LICENSE.txt');
const sha = (b) => createHash('sha256').update(b).digest('hex');
await writeFile(
    output + '/version.json',
    JSON.stringify({
        sqlJs: '1.14.2',
        wasm: sha(wasm),
        worker: sha(await readFile(output + '/worker.js')),
        memoryBytes: 67108864,
    }),
);
console.log('SQLite browser runtime built (64 MiB WASM ceiling).');

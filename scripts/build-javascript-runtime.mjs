import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { rolldown } from 'rolldown';
const output = 'public/javascript-runtime';
await mkdir(output, { recursive: true });
const dom = await rolldown({
    input: 'resources/js/javascript-dom-entry.js',
    platform: 'browser',
});
await dom.write({
    file: output + '/dom.js',
    format: 'iife',
    name: 'CodelabDOM',
});
await dom.close();
const source = await readFile(
    'node_modules/@jitl/quickjs-wasmfile-release-sync/dist/emscripten-module.wasm',
);
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
    c = { p: 8 };
let capped = false;
while (c.p < source.length) {
    const id = source[c.p++],
        size = read(c),
        start = c.p;
    c.p += size;
    let body = source.subarray(start, c.p);
    if (id === 5) {
        const m = { p: start },
            count = read(m),
            flags = read(m),
            initial = read(m),
            max = flags & 1 ? read(m) : 65536;
        if (count !== 1 || flags & 6 || initial > 2048)
            throw Error('Unexpected QuickJS memory layout');
        body = Buffer.from([
            ...leb(1),
            ...leb(1),
            ...leb(initial),
            ...leb(Math.min(max, 2048)),
        ]);
        capped = true;
    }
    parts.push(Buffer.from([id, ...leb(body.length)]), body);
}
if (
    !capped &&
    WebAssembly.Module.imports(new WebAssembly.Module(source)).filter(
        (x) => x.kind === 'memory',
    ).length !== 1
)
    throw Error('Expected one imported QuickJS memory');
const wasm = Buffer.concat(parts);
if (!WebAssembly.validate(wasm)) throw Error('Invalid WASM');
await writeFile(output + '/quickjs.wasm', wasm);
const worker = await rolldown({
    input: 'resources/js/javascript-worker.js',
    platform: 'browser',
    transform: { define: { 'import.meta.url': 'self.location.href' } },
});
await worker.write({
    file: output + '/worker.js',
    format: 'iife',
    codeSplitting: false,
});
await worker.close();
await copyFile(
    'node_modules/quickjs-emscripten/LICENSE',
    output + '/QUICKJS-LICENSE.txt',
);
await copyFile(
    'node_modules/linkedom/LICENSE',
    output + '/LINKEDOM-LICENSE.txt',
);
const sha = (b) => createHash('sha256').update(b).digest('hex');
await writeFile(
    output + '/version.json',
    JSON.stringify({
        quickjs: '0.32.0',
        linkedom: '0.18.13',
        wasm: sha(wasm),
        worker: sha(await readFile(output + '/worker.js')),
        dom: sha(await readFile(output + '/dom.js')),
    }),
);
console.log(
    'Isolated JavaScript runtime built: 32 MiB guest heap, 128 MiB WASM ceiling.',
);

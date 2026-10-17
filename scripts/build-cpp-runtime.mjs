import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gunzipSync, gzipSync } from 'node:zlib';
import { rolldown } from 'rolldown';

const output = 'public/cpp-runtime';
await mkdir(output + '/bin', { recursive: true });
const sha = (b) => createHash('sha256').update(b).digest('hex');
const receipt =
    '063bc1b56582b9923e08ac9b89e58789618d851763f01530b3ff20b9e5df0ca3';
const cache = 'storage/app/private/cpp-toolchain/wasi-sysroot-33.tar.gz';
await mkdir('storage/app/private/cpp-toolchain', { recursive: true });
let sdk;
try {
    sdk = await readFile(cache);
} catch {
    console.log('Downloading pinned official WASI SDK 33 exception libraries…');
    const response = await fetch(
        'https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-33/wasi-sysroot-33.0%2Bm.tar.gz',
    );
    if (!response.ok) throw new Error('Cannot download WASI SDK sysroot');
    sdk = Buffer.from(await response.arrayBuffer());
    await writeFile(cache, sdk);
}
if (sha(sdk) !== receipt) throw new Error('WASI SDK integrity mismatch');
function entries(buffer) {
    const rows = [];
    let longName = '';
    for (let p = 0; p + 512 <= buffer.length;) {
        const header = buffer.subarray(p, p + 512),
            name = header.subarray(0, 100).toString().split('\0')[0],
            size = parseInt(header.subarray(124, 136).toString(), 8) || 0;
        if (!name) break;
        const body = buffer.subarray(p + 512, p + 512 + size);
        const prefix = header.subarray(345, 500).toString().split('\0')[0];
        if (header[156] === 76) longName = body.toString().split('\0')[0];
        else {
            rows.push({
                name: longName || (prefix ? prefix + '/' + name : name),
                header: Buffer.from(header),
                body,
            });
            longName = '';
        }
        p += 512 + Math.ceil(size / 512) * 512;
    }
    return rows;
}
function tar(rows) {
    const parts = [];
    for (const row of rows) {
        const header = Buffer.from(row.header);
        header.fill(0, 0, 100);
        header.fill(0, 345, 500);
        if (row.name.length > 100) {
            const split = row.name.lastIndexOf('/');
            header.write(row.name.slice(0, split), 345, 155);
            header.write(row.name.slice(split + 1), 0, 100);
        } else header.write(row.name, 0, 100);
        header.fill(32, 148, 156);
        let sum = 0;
        for (const byte of header) sum += byte;
        header.write(sum.toString(8).padStart(6, '0') + '\0 ', 148, 8);
        parts.push(
            header,
            row.body,
            Buffer.alloc((512 - (row.body.length % 512)) % 512),
        );
    }
    parts.push(Buffer.alloc(1024));
    return Buffer.concat(parts);
}
const pkg = 'node_modules/@live-codes/clang-wasm';
const original = entries(
    gunzipSync(await readFile(pkg + '/assets/bin/sysroot.tar.gz')),
);
const replacement = new Map();
for (const row of entries(gunzipSync(sdk))) {
    const path = row.name.replace(/^wasi-sysroot-33\.0\+m\//, '');
    if (
        /^lib\/wasm32-wasi\/eh\/(libc\+\+\.a|libc\+\+abi\.a|libunwind\.a)$/.test(
            path,
        )
    )
        replacement.set(path.replace('/eh/', '/'), {
            ...row,
            name: path.replace('/eh/', '/'),
        });
    if (path.startsWith('include/wasm32-wasi/eh/c++/v1/') && row.body.length) {
        const name = path.replace(
            'include/wasm32-wasi/eh/c++/v1/',
            'include/c++/v1/',
        );
        replacement.set(name, { ...row, name });
    }
}
if (!replacement.has('lib/wasm32-wasi/libunwind.a'))
    throw new Error('Missing exception support');
const merged = [
    ...original.filter((row) => !replacement.has(row.name)),
    ...replacement.values(),
];
const directories = new Map();
for (const row of merged) {
    const parts = row.name.split('/');
    for (let i = 1; i < parts.length; i++) {
        const name = parts.slice(0, i).join('/');
        if (!name || directories.has(name)) continue;
        const header = Buffer.from(row.header);
        header[156] = 53;
        header.fill(0, 124, 136);
        header.write('00000000000', 124);
        header.fill(0, 157, 257);
        directories.set(name, { name, header, body: Buffer.alloc(0) });
    }
}
const sysroot = tar(
    [...directories.values()]
        .sort((a, b) => a.name.split('/').length - b.name.split('/').length)
        .concat(merged.filter((row) => row.header[156] !== 53)),
);
await writeFile(output + '/bin/sysroot.tar.gz', gzipSync(sysroot));
function capMemory(source, pages) {
    function read(cursor) {
        let v = 0,
            shift = 0,
            b;
        do {
            b = source[cursor.p++];
            v |= (b & 127) << shift;
            shift += 7;
        } while (b & 128);
        return v >>> 0;
    }
    function leb(v) {
        const bytes = [];
        do {
            const b = v & 127;
            v >>>= 7;
            bytes.push(b | (v ? 128 : 0));
        } while (v);
        return bytes;
    }
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
            const m = { p: start },
                count = read(m),
                flags = read(m),
                initial = read(m),
                maximum = flags & 1 ? read(m) : 65536;
            if (count !== 1 || flags & 6 || initial > pages)
                throw Error('Unsupported compiler memory layout');
            body = Buffer.from([
                ...leb(1),
                ...leb(1),
                ...leb(initial),
                ...leb(Math.min(maximum, pages)),
            ]);
            capped = true;
        }
        parts.push(Buffer.from([id, ...leb(body.length)]), body);
    }
    if (!capped) throw Error('Compiler memory was not capped');
    const result = Buffer.concat(parts);
    if (!WebAssembly.validate(result)) throw Error('Invalid compiler binary');
    return result;
}
for (const file of ['clang.wasm.gz', 'lld.wasm.gz', 'memfs.wasm.gz'])
    await writeFile(
        output + '/bin/' + file,
        gzipSync(
            capMemory(
                gunzipSync(await readFile(pkg + '/assets/bin/' + file)),
                4096,
            ),
        ),
    );
const manifest = JSON.parse(
    await readFile(pkg + '/assets/runtime-manifest.v1.json', 'utf8'),
);
for (const [name, file] of [
    ['clang', 'clang.wasm.gz'],
    ['lld', 'lld.wasm.gz'],
    ['memfs', 'memfs.wasm.gz'],
    ['sysroot', 'sysroot.tar.gz'],
]) {
    manifest.compiler[name].asset =
        'bin/' + file + '?v=' + sha(await readFile(output + '/bin/' + file));
}
await writeFile(output + '/runtime-manifest.v1.json', JSON.stringify(manifest));
const bundle = await rolldown({
    input: 'resources/js/cpp-worker.js',
    platform: 'browser',
});
await bundle.write({
    file: output + '/worker.js',
    format: 'iife',
    codeSplitting: false,
});
await bundle.close();
const files = [
    'worker.js',
    'runtime-manifest.v1.json',
    'bin/clang.wasm.gz',
    'bin/lld.wasm.gz',
    'bin/memfs.wasm.gz',
    'bin/sysroot.tar.gz',
];
const hashes = {};
for (const file of files)
    hashes[file] = sha(await readFile(output + '/' + file));
await writeFile(output + '/version.json', JSON.stringify(hashes));
await copyFile(pkg + '/LICENSE', output + '/LICENSE.txt');
await copyFile(
    'node_modules/@noble/hashes/LICENSE',
    output + '/HASHES-LICENSE.txt',
);
await writeFile(
    output + '/NOTICE.txt',
    (await readFile(pkg + '/THIRD-PARTY-NOTICES.md', 'utf8')) +
        '\nCodeLab uses Clang 22.1.8, WASI SDK 33 exception libraries (LLVM Apache-2.0 with LLVM exception), and C++17. Compiler WASM memories are capped at 256 MiB by scripts/build-cpp-runtime.mjs. SHA-256 fallback: @noble/hashes 2.0.1 (MIT).\nOfficial sysroot SHA256: ' +
        receipt +
        '\nSource: https://github.com/WebAssembly/wasi-sdk/releases/tag/wasi-sdk-33\n',
);
console.log('Built isolated C++17 compiler assets with exception support.');

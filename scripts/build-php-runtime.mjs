import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { rolldown } from 'rolldown';

const root = new URL('../', import.meta.url);
const output = new URL('public/php-runtime/', root);
await mkdir(output, { recursive: true });

// Set a hard maximum on the binary's memory, independent of student ini_set().
// Re-encode only the standard WebAssembly memory section; all other sections are untouched.
const source = new Uint8Array(
    await readFile(
        new URL(
            'node_modules/@php-wasm/web-8-4/asyncify/8_4_25/php_8_4.wasm',
            root,
        ),
    ),
);
function readLeb(bytes, cursor) {
    let value = 0,
        shift = 0,
        byte;
    do {
        byte = bytes[cursor.offset++];
        value |= (byte & 127) << shift;
        shift += 7;
    } while (byte & 128);
    return value >>> 0;
}
function leb(value) {
    const result = [];
    do {
        const byte = value & 127;
        value >>>= 7;
        result.push(byte | (value ? 128 : 0));
    } while (value);
    return result;
}
const sections = [source.subarray(0, 8)];
const cursor = { offset: 8 };
let capped = false;
while (cursor.offset < source.length) {
    const id = source[cursor.offset++];
    const size = readLeb(source, cursor);
    let body = source.subarray(cursor.offset, cursor.offset + size);
    cursor.offset += size;
    if (id === 5) {
        const memory = { offset: 0 };
        const count = readLeb(body, memory);
        if (count !== 1)
            throw new Error(
                'Review new runtime memory layout before upgrading',
            );
        const flags = readLeb(body, memory);
        const initial = readLeb(body, memory);
        const previousMax = flags & 1 ? readLeb(body, memory) : 65536;
        if (flags & 6 || initial > 4096)
            throw new Error('Unsupported PHP memory layout');
        body = Uint8Array.from([
            ...leb(1),
            ...leb(1),
            ...leb(initial),
            ...leb(Math.min(previousMax, 4096)),
        ]);
        capped = true;
    }
    sections.push(Uint8Array.from([id, ...leb(body.length)]), body);
}
if (!capped) throw new Error('PHP runtime memory was not capped');
const cappedBinary = Buffer.concat(sections);
if (!WebAssembly.validate(cappedBinary))
    throw new Error('Invalid capped PHP binary');
await writeFile(new URL('php.wasm', output), cappedBinary);

const bundle = await rolldown({
    input: fileURLToPath(new URL('resources/js/php-worker.ts', root)),
    platform: 'browser',
    plugins: [
        {
            name: 'isolated-php-loader',
            resolveId(id) {
                if (id === 'codelab-php-loader')
                    return fileURLToPath(
                        new URL(
                            'node_modules/@php-wasm/web-8-4/asyncify/php_8_4.js',
                            root,
                        ),
                    );
            },
            transform(code, id) {
                if (id.replaceAll('\\', '/').endsWith('/asyncify/php_8_4.js')) {
                    // Runtime bytes arrive over a private channel; no loader network requests.
                    return code.replace(
                        /const dependencyFilename = new URL\([^\n]+\)/,
                        "const dependencyFilename = 'php.wasm'",
                    );
                }
            },
        },
    ],
});
await bundle.write({
    file: fileURLToPath(new URL('worker.js', output)),
    format: 'iife',
    codeSplitting: false,
});
await bundle.close();
await writeFile(
    new URL('version.json', output),
    JSON.stringify({
        worker: createHash('sha256')
            .update(await readFile(new URL('worker.js', output)))
            .digest('hex'),
        wasm: createHash('sha256').update(cappedBinary).digest('hex'),
    }),
);
await writeFile(
    new URL('LICENSE.txt', output),
    await readFile(new URL('node_modules/@php-wasm/universal/LICENSE', root)),
);
await writeFile(
    new URL('NOTICE.txt', output),
    'PHP.wasm by the WordPress Playground contributors, GPL-2.0-or-later.\nSource: https://github.com/WordPress/wordpress-playground\nPackages: @php-wasm/universal and @php-wasm/web-8-4 3.1.57.\nCodeLab modifies the PHP binary memory maximum to 256 MiB; scripts/build-php-runtime.mjs contains the reproducible modification.\n',
);
console.log('PHP 8.4 runtime built: hard 256 MiB WASM memory ceiling.');

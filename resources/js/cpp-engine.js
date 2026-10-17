import {
    createToolchain,
    compilerDiagnostics,
} from '@live-codes/clang-wasm/toolchain';
import { createBrowserWasiHost } from '@wasm-idle/llvm-core/clang';
import { WASI } from '@bjorn3/browser_wasi_shim';
import { sha256 } from '@noble/hashes/sha2.js';

globalThis.SharedArrayBuffer ??= class SharedArrayBuffer {};
// An opaque sandbox deliberately has no secure origin. Supply SHA-256 for the
// compiler's content fingerprints without granting it the application's origin.
if (!globalThis.crypto?.subtle) {
    Object.defineProperty(globalThis.crypto, 'subtle', {
        value: {
            async digest(algorithm, bytes) {
                if (algorithm !== 'SHA-256')
                    throw new Error('Unsupported digest');
                return sha256(
                    bytes instanceof ArrayBuffer
                        ? new Uint8Array(bytes)
                        : bytes,
                ).buffer;
            },
        },
    });
}
export async function createCppEngine(baseUrl, phase = () => {}) {
    const toolchain = await createToolchain(baseUrl ? { baseUrl } : {});
    const runtime = toolchain.runtime;
    await runtime.getModule(runtime.assetUrls.lld);
    // Fixed linker policy: exception-capable libraries and a hard 64 MiB guest memory ceiling.
    runtime.link = async function (objects, wasm) {
        await this.ensureCppSysroot();
        const lld = await this.getModule(this.assetUrls.lld);
        return this.run(
            lld,
            true,
            'wasm-ld',
            '-z',
            'stack-size=1048576',
            '--max-memory=67108864',
            '-Llib/wasm32-wasi',
            'lib/wasm32-wasi/crt1.o',
            ...(Array.isArray(objects) ? objects : [objects]),
            '-lc++',
            '-lc++abi',
            '-lunwind',
            '-lc',
            '-lm',
            `-L${this.compilerConfig.compilerRuntimeLibDir}`,
            '-lclang_rt.builtins-wasm32',
            '-o',
            wasm,
        );
    };
    return {
        async compile(code) {
            if (typeof code !== 'string' || code.length > 200000)
                throw new Error('Source exceeds 200,000 characters.');
            phase('compiling');
            const result = await toolchain.captureCompilerOutput(() =>
                runtime.compileArtifact(code, {
                    language: 'CPP',
                    fileName: 'main.cpp',
                    cppVersion: '17',
                    opt: '0',
                    compileArgs: [
                        '-std=c++17',
                        '-Wall',
                        '-fcxx-exceptions',
                        '-fexceptions',
                        '-exception-model=wasm',
                        '-target-feature',
                        '+exception-handling',
                        '-mllvm',
                        '-wasm-enable-eh',
                        '-mllvm',
                        '-wasm-use-legacy-eh=false',
                    ],
                }),
            );
            if (result.error)
                return {
                    errors: compilerDiagnostics(result.raw).concat(
                        String(result.error.message),
                    ),
                    artifact: null,
                };
            return { artifact: result.result, errors: [] };
        },
        async execute(artifact, input = '') {
            if (input.length > 20000)
                throw new Error('Input exceeds 20,000 characters.');
            phase('running');
            let limitFailure = null;
            const fail = (message) => {
                limitFailure = message;
                throw new Error(message);
            };
            let sent = false,
                stdout = '',
                stderr = '',
                bytes = 0;
            const capture = (kind) => (chunk) => {
                bytes += new TextEncoder().encode(chunk).length;
                if (bytes > 65536) fail('Output exceeded 64 KiB.');
                if (kind === 'out') stdout += chunk;
                else stderr += chunk;
            };
            const host = createBrowserWasiHost({
                env: {},
                stdin: () => {
                    if (sent) return null;
                    sent = true;
                    return input;
                },
                stdout: capture('out'),
                stderr: capture('err'),
            });
            const wasi = new WASI(host.args, host.envEntries, host.fds, {
                debug: false,
            });
            // Virtual filesystem data lives in JavaScript; bound file growth independently of guest memory.
            let writes = 0,
                fileBytes = 0,
                allocatedFileBytes = 0n,
                operations = 0,
                guestMemory;
            const imports = { ...wasi.wasiImport };
            for (const name of [
                'fd_write',
                'fd_pwrite',
                'fd_filestat_set_size',
                'fd_allocate',
            ]) {
                const original = imports[name];
                imports[name] = (...args) => {
                    const descriptor = host.fds[args[0]];
                    let requestedSize = 0n;
                    if (
                        name === 'fd_filestat_set_size' ||
                        name === 'fd_allocate'
                    ) {
                        requestedSize =
                            name === 'fd_allocate'
                                ? BigInt(args[1]) + BigInt(args[2])
                                : BigInt(args[1]);
                        if (requestedSize > 1048576n)
                            fail('Virtual file exceeds 1 MiB.');
                    }
                    if (name === 'fd_write' || name === 'fd_pwrite') {
                        writes++;
                        if (writes > 10000)
                            fail('Too many output/file writes.');
                        const view = new DataView(guestMemory.buffer);
                        let length = 0;
                        for (let i = 0; i < args[2]; i++) {
                            const size = view.getUint32(
                                args[1] + i * 8 + 4,
                                true,
                            );
                            length += size;
                            fileBytes += size;
                            if (fileBytes > 1048576)
                                fail(
                                    'Total output and virtual file writes exceeded 1 MiB.',
                                );
                        }
                        if (descriptor?.file)
                            requestedSize =
                                (name === 'fd_pwrite'
                                    ? BigInt(args[3])
                                    : descriptor.file_pos) + BigInt(length);
                    }
                    if (descriptor?.file) {
                        const growth =
                            requestedSize > descriptor.file.size
                                ? requestedSize - descriptor.file.size
                                : 0n;
                        if (
                            requestedSize > 1048576n ||
                            allocatedFileBytes + growth > 1048576n
                        )
                            fail('Virtual file storage exceeded 1 MiB.');
                        allocatedFileBytes += growth;
                    }
                    return original(...args);
                };
            }
            for (const name of ['path_open', 'path_create_directory']) {
                const original = imports[name];
                imports[name] = (...args) => {
                    if (++operations > 128)
                        fail('Too many virtual filesystem operations.');
                    return original(...args);
                };
            }
            const instance = await WebAssembly.instantiate(
                artifact.wasm ?? (await WebAssembly.compile(artifact.bytes)),
                { wasi_snapshot_preview1: imports, wasi_unstable: imports },
            );
            guestMemory = instance.exports.memory;
            // Nothing outside this synthetic WASI host is imported: no native FS, processes, network, or secrets.
            let exitCode;
            try {
                exitCode = wasi.start(instance);
            } catch (error) {
                if (limitFailure) throw new Error(limitFailure);
                throw error;
            }
            return { stdout, stderr, exitCode };
        },
        dispose: () => toolchain.dispose(),
    };
}

(() => {
    'use strict';
    const base = new URL('/cpp-runtime-assets/', document.currentScript.src);
    let port,
        worker,
        timer,
        blobUrl,
        sourcePromise,
        generation = 0;
    const finish = (result) => {
        generation++;
        clearTimeout(timer);
        worker?.terminate();
        worker = null;
        if (blobUrl) URL.revokeObjectURL(blobUrl);
        blobUrl = null;
        port?.postMessage(result);
    };
    const deadline = (ms, message) => {
        clearTimeout(timer);
        timer = setTimeout(
            () => finish({ type: 'done', runtimeErrors: message, issues: [] }),
            ms,
        );
    };
    window.addEventListener('message', (event) => {
        if (
            event.source !== parent ||
            event.data !== 'codelab-cpp-connect' ||
            !event.ports[0]
        )
            return;
        port?.close();
        port = event.ports[0];
        port.onmessage = async ({ data }) => {
            if (data.type === 'stop') {
                finish({ type: 'done', output: 'Run stopped.', issues: [] });
                return;
            }
            if (data.type !== 'run' || worker) return;
            const current = ++generation;
            deadline(90000, 'Compiler loading timed out. Try again.');
            try {
                sourcePromise ??= fetch(new URL('version.json', base), {
                    credentials: 'omit',
                    cache: 'no-store',
                }).then(async (response) => {
                    if (!response.ok)
                        throw new Error(
                            'C++ runtime unavailable. Run npm run build.',
                        );
                    const manifest = await response.json();
                    const hash = manifest['worker.js'];
                    if (!/^[a-f0-9]{64}$/.test(hash))
                        throw new Error('Invalid runtime manifest');
                    const asset = await fetch(
                        new URL('worker.js?v=' + hash, base),
                        { credentials: 'omit' },
                    );
                    if (!asset.ok)
                        throw new Error('Compiler worker unavailable');
                    return asset.text();
                });
                const source = await sourcePromise;
                if (current !== generation) return;
                blobUrl = URL.createObjectURL(
                    new Blob([source], { type: 'text/javascript' }),
                );
                worker = new Worker(blobUrl);
                worker.onmessage = ({ data: result }) => {
                    if (result.type === 'compiling') {
                        deadline(
                            30000,
                            'Compilation exceeded 30 seconds. Simplify your program.',
                        );
                        port.postMessage(result);
                    } else if (result.type === 'running') {
                        deadline(
                            5000,
                            'Execution exceeded 5 seconds. Check for an infinite loop.',
                        );
                        port.postMessage(result);
                    } else if (result.type === 'done') finish(result);
                };
                worker.onerror = () =>
                    finish({
                        type: 'done',
                        runtimeErrors:
                            'C++ runtime failed. Refresh and try again.',
                        issues: [],
                    });
                worker.postMessage({
                    baseUrl: base.href,
                    code: String(data.code ?? '').slice(0, 200000),
                    input: String(data.input ?? '').slice(0, 20000),
                    rules: data.rules,
                });
            } catch (error) {
                sourcePromise = null;
                finish({
                    type: 'done',
                    runtimeErrors: String(error),
                    issues: [],
                });
            }
        };
        port.postMessage({ type: 'ready' });
    });
})();

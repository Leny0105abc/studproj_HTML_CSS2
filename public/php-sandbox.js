(() => {
    'use strict';
    const base = new URL('/php-runtime-assets/', document.currentScript.src);
    let port, worker, timer, workerUrl;
    let assets, generation = 0;
    const finish = (message) => {
        generation++;
        clearTimeout(timer);
        worker?.terminate();
        worker = null;
        if (workerUrl) URL.revokeObjectURL(workerUrl);
        workerUrl = null;
        port?.postMessage(message);
    };
    window.addEventListener('message', (event) => {
        if (event.source !== parent || event.data !== 'codelab-php-connect' || !event.ports[0]) return;
        port?.close();
        port = event.ports[0];
        port.onmessage = async ({ data }) => {
            if (data.type === 'stop') { finish({ type: 'done', output: 'Run stopped.', issues: [] }); return; }
            if (data.type !== 'run' || worker) return;
            const runGeneration = ++generation;
            timer = setTimeout(() => finish({ type: 'done', error: 'Runtime loading timed out. Check your connection and try again.', issues: [] }), 30000);
            try {
                assets ??= (async () => {
                    const versionResponse = await fetch(new URL('version.json', base), { credentials: 'omit', cache: 'no-store' });
                    if (!versionResponse.ok) throw new Error('PHP runtime is unavailable. Run npm run build.');
                    const version = await versionResponse.json();
                    if (!/^[a-f0-9]{64}$/.test(version.worker) || !/^[a-f0-9]{64}$/.test(version.wasm)) throw new Error('Invalid PHP runtime manifest.');
                    return Promise.all([
                        fetch(new URL('worker.js?v=' + version.worker, base), { credentials: 'omit' }).then((response) => { if (!response.ok) throw new Error('PHP runtime is unavailable. Run npm run build.'); return response.text(); }),
                        fetch(new URL('php.wasm?v=' + version.wasm, base), { credentials: 'omit' }).then((response) => { if (!response.ok) throw new Error('PHP binary is unavailable. Run npm run build.'); return response.arrayBuffer(); }),
                    ]);
                })();
                const [source, wasm] = await assets;
                if (runGeneration !== generation) return;
                workerUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
                worker = new Worker(workerUrl);
                worker.onmessage = ({ data: result }) => {
                    if (result.type === 'running') {
                        clearTimeout(timer);
                        timer = setTimeout(() => finish({ type: 'done', error: 'Execution exceeded 8 seconds. Check for an infinite loop.', issues: [] }), 8000);
                        port.postMessage(result);
                    } else if (result.type === 'done') finish(result);
                };
                worker.onerror = () => finish({ type: 'done', error: 'PHP runtime failed. Refresh and try again.', issues: [] });
                worker.postMessage({ code: String(data.code ?? '').slice(0, 200000), input: String(data.input ?? '').slice(0, 20000), rules: data.rules, wasm });
            } catch (error) { assets = null; finish({ type: 'done', error: String(error), issues: [] }); }
        };
        port.postMessage({ type: 'ready' });
    });
})();

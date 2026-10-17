(() => {
    let port,
        worker,
        timer,
        url,
        generation = 0;
    const stop = () => {
        generation++;
        clearTimeout(timer);
        worker?.terminate();
        worker = null;
        if (url) URL.revokeObjectURL(url);
        url = null;
    };
    addEventListener('message', (event) => {
        if (
            event.source !== parent ||
            port ||
            event.data?.type !== 'sql-connect' ||
            !event.ports[0]
        )
            return;
        port = event.ports[0];
        port.onmessage = async ({ data }) => {
            stop();
            if (data.type === 'stop') return;
            if (data.type !== 'run') return;
            const current = generation;
            timer = setTimeout(() => {
                stop();
                port.postMessage({
                    type: 'error',
                    message: 'SQLite runtime loading timed out. Try Run again.',
                });
            }, 20000);
            try {
                const version = await fetch(
                    '/sql-runtime-assets/version.json',
                    { credentials: 'omit' },
                ).then((r) => r.json());
                const source = await fetch(
                    '/sql-runtime-assets/worker.js?v=' + version.worker,
                    { credentials: 'omit' },
                ).then((r) => {
                    if (!r.ok) throw Error('Cannot load SQLite worker.');
                    return r.text();
                });
                if (current !== generation) return;
                url = URL.createObjectURL(
                    new Blob([source], { type: 'text/javascript' }),
                );
                worker = new Worker(url);
                worker.onmessage = ({ data: message }) => {
                    if (current !== generation) return;
                    if (message.type === 'ready') {
                        clearTimeout(timer);
                        timer = setTimeout(() => {
                            stop();
                            port.postMessage({
                                type: 'error',
                                message:
                                    'Query stopped after 5 seconds. Reduce the query size or recursion.',
                            });
                        }, 5000);
                    } else {
                        stop();
                        port.postMessage(message);
                    }
                };
                worker.onerror = () => {
                    stop();
                    port.postMessage({
                        type: 'error',
                        message: 'SQLite worker failed. Try a smaller query.',
                    });
                };
                worker.postMessage({
                    ...data,
                    wasmUrl: new URL(
                        '/sql-runtime-assets/sql-wasm.wasm?v=' + version.wasm,
                        location.href,
                    ).href,
                });
            } catch (error) {
                if (current !== generation) return;
                stop();
                port.postMessage({
                    type: 'error',
                    message: String(error.message).slice(0, 2000),
                });
            }
        };
        port.postMessage({ type: 'connected' });
    });
})();

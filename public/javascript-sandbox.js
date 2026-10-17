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
    const fail = (message) => {
        stop();
        port.postMessage({ type: 'error', message });
    };
    const timeout = (ms, message) => {
        clearTimeout(timer);
        timer = setTimeout(() => fail(message), ms);
    };
    addEventListener('message', (event) => {
        if (
            event.source !== parent ||
            port ||
            event.data?.type !== 'javascript-connect' ||
            !event.ports[0]
        )
            return;
        port = event.ports[0];
        port.onmessage = async ({ data }) => {
            if (data.type === 'stop') {
                stop();
                return;
            }
            if (data.type === 'event' && worker) {
                timeout(2500, 'Event handler timed out. Run again.');
                worker.postMessage(data);
                return;
            }
            if (data.type !== 'run') return;
            stop();
            const current = generation;
            timeout(20000, 'Runtime loading timed out. Try Run again.');
            try {
                const version = await fetch(
                    '/javascript-runtime-assets/version.json',
                    { credentials: 'omit' },
                ).then((r) => r.json());
                const source = await fetch(
                    '/javascript-runtime-assets/worker.js?v=' + version.worker,
                    { credentials: 'omit' },
                ).then((r) => {
                    if (!r.ok) throw Error('Cannot load JavaScript worker.');
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
                        timeout(
                            5000,
                            'JavaScript stopped after 5 seconds. Reduce loops or recursion.',
                        );
                        return;
                    }
                    if (message.type === 'error') {
                        fail(message.message);
                        return;
                    }
                    if (message.type === 'result') {
                        timeout(600000, 'Practice session expired. Run again.');
                        port.postMessage(message);
                    }
                };
                worker.onerror = () =>
                    fail('JavaScript worker failed. Try a smaller program.');
                worker.postMessage({
                    ...data,
                    wasmUrl: new URL(
                        '/javascript-runtime-assets/quickjs.wasm?v=' +
                            version.wasm,
                        location.href,
                    ).href,
                    domUrl: new URL(
                        '/javascript-runtime-assets/dom.js?v=' + version.dom,
                        location.href,
                    ).href,
                });
            } catch (error) {
                if (current === generation)
                    fail(String(error.message).slice(0, 2000));
            }
        };
        port.postMessage({ type: 'connected' });
    });
})();

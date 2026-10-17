import {
    newQuickJSWASMModuleFromVariant,
    newVariant,
} from 'quickjs-emscripten-core';
import RELEASE_SYNC from '@jitl/quickjs-wasmfile-release-sync';
import { createJavascriptEngine } from './javascript-engine.js';
let engine;
self.onmessage = async ({ data }) => {
    try {
        if (data.type === 'run') {
            const [wasm, dom] = await Promise.all([
                fetch(data.wasmUrl, { credentials: 'omit' }).then((r) => {
                    if (!r.ok) throw Error('Cannot load JavaScript runtime.');
                    return r.arrayBuffer();
                }),
                fetch(data.domUrl, { credentials: 'omit' }).then((r) => {
                    if (!r.ok) throw Error('Cannot load practice DOM.');
                    return r.text();
                }),
            ]);
            const QuickJS = await newQuickJSWASMModuleFromVariant(
                newVariant(RELEASE_SYNC, {
                    wasmBinary: wasm,
                    wasmLocation: data.wasmUrl,
                    wasmMemory: new WebAssembly.Memory({
                        initial: 256,
                        maximum: 2048,
                    }),
                }),
            );
            self.fetch = self.XMLHttpRequest = self.WebSocket = undefined;
            self.postMessage({ type: 'ready' });
            engine = createJavascriptEngine(QuickJS, dom, data);
            self.postMessage({ type: 'result', value: engine.snapshot() });
        } else if (data.type === 'event' && engine) {
            self.postMessage({
                type: 'result',
                value: engine.event(data.event),
            });
        }
    } catch (error) {
        try {
            engine?.dispose();
        } catch {
            /* The controller terminates failed workers. */
        }
        engine = null;
        self.postMessage({
            type: 'error',
            message: String(error.message ?? error).slice(0, 2000),
        });
    }
};

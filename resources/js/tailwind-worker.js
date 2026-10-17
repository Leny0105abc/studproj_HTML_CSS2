import { compileTailwind } from './tailwind-compiler.js';
self.onmessage = async ({ data }) => {
    try {
        self.postMessage({ id: data.id, css: await compileTailwind(data) });
    } catch (error) {
        self.postMessage({
            id: data.id,
            error: String(error.message).slice(0, 2000),
        });
    }
};

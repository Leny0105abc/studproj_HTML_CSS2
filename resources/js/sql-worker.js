import initSqlJs from 'codelab-sqlite';
import { executeSql } from './sql-engine.js';
import { limitVirtualFiles } from './sql-files.js';
self.onmessage = async ({ data }) => {
    try {
        const response = await fetch(data.wasmUrl, { credentials: 'omit' });
        if (!response.ok) throw Error('Cannot load the SQLite runtime.');
        const SQL = await initSqlJs({
            wasmBinary: new Uint8Array(await response.arrayBuffer()),
        });
        limitVirtualFiles(SQL);
        // All loading ends before student statements execute.
        self.fetch = self.XMLHttpRequest = self.WebSocket = undefined;
        self.postMessage({ type: 'ready' });
        self.postMessage({
            type: 'result',
            value: executeSql(SQL, data.code, data.seed, data.input),
        });
    } catch (error) {
        self.postMessage({
            type: 'error',
            message: String(error.message ?? error).slice(0, 2000),
        });
    }
};

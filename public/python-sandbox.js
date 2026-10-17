// Loaded in an opaque-origin iframe (allow-scripts, deliberately no allow-same-origin).
// Only a private MessagePort communicates with the application. Code never receives it.
(() => {
    let port;
    let worker;
    let timer;
    let blobUrl;
    const finish = (message) => {
        clearTimeout(timer);
        worker?.terminate();
        worker = null;
        if (blobUrl) URL.revokeObjectURL(blobUrl);
        port?.postMessage(message);
    };
    const workerMain = async () => {
        importScripts(
            'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js',
        );
        self.onmessage = async ({ data }) => {
            let output = '';
            const write = (line) => {
                output += line + '\n';
                if (output.length > 20000)
                    throw new Error(
                        'Output limit reached (20,000 characters).',
                    );
            };
            try {
                const py = await loadPyodide({
                    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/',
                    stdout: write,
                    stderr: write,
                });
                if (/\b(import sqlite3|from sqlite3)\b/.test(data.code))
                    await py.loadPackage('sqlite3');
                const lines = data.input.replace(/\r\n/g, '\n').split('\n');
                if (data.input === '') lines.length = 0;
                py.setStdin({
                    stdin: () => (lines.length ? lines.shift() : null),
                });
                py.globals.set('_source', data.code);
                py.globals.set('_rules_json', JSON.stringify(data.rules ?? {}));
                // Parse an AST for formative requirements, rather than matching comments or strings.
                const checks = JSON.parse(
                    py.runPython(`
import ast, json
_tree = ast.parse(_source)
_rules = json.loads(_rules_json)
_functions = {node.name for node in ast.walk(_tree) if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))}
_variables = {node.id for node in ast.walk(_tree) if isinstance(node, ast.Name) and isinstance(node.ctx, ast.Store)}
_issues = ["Define function: " + name for name in _rules.get("required_functions", []) if name not in _functions]
_issues += ["Assign variable: " + name for name in _rules.get("required_variables", []) if name not in _variables]
json.dumps(_issues)
`),
                );
                self.postMessage({ type: 'running' });
                await py.runPythonAsync(data.code);
                // Formative tests only. Teacher review is the authoritative assessment.
                for (const test of data.rules?.test_cases ?? []) {
                    const fn = py.globals.get(test.function);
                    if (typeof fn !== 'function') {
                        checks.push(`Missing function: ${test.function}`);
                        continue;
                    }
                    try {
                        const argumentsProxy = py.toPy(test.arguments ?? []);
                        const args = argumentsProxy.toJs({ depth: 1 });
                        const result = fn(...args);
                        const actual = result?.toJs ? result.toJs() : result;
                        if (
                            JSON.stringify(actual) !==
                            JSON.stringify(test.expected)
                        )
                            checks.push(
                                `Test failed for ${test.function}: expected ${JSON.stringify(test.expected)}.`,
                            );
                        result?.destroy?.();
                        for (const argument of args) argument?.destroy?.();
                        argumentsProxy.destroy();
                    } finally {
                        fn.destroy?.();
                    }
                }
                if (typeof data.rules?.expected_output === 'string') {
                    const normalize = (value) =>
                        value.trim().split(/\s+/).join(' ');
                    if (
                        normalize(output) !==
                        normalize(data.rules.expected_output)
                    )
                        checks.push('Output differs from the expected result.');
                }
                self.postMessage({ type: 'done', output, issues: checks });
            } catch (error) {
                self.postMessage({
                    type: 'done',
                    output: output.slice(0, 20000),
                    error: String(error),
                    issues: [],
                });
            }
        };
    };
    window.addEventListener('message', (event) => {
        if (
            event.source !== parent ||
            event.data !== 'codelab-python-connect' ||
            port ||
            !event.ports[0]
        )
            return;
        port = event.ports[0];
        port.onmessage = ({ data }) => {
            if (data.type === 'stop') {
                finish({
                    type: 'done',
                    output: '',
                    error: 'Execution stopped.',
                    issues: [],
                });
                return;
            }
            if (
                data.type !== 'run' ||
                typeof data.code !== 'string' ||
                data.code.length > 200000 ||
                typeof data.input !== 'string' ||
                data.input.length > 20000
            )
                return;
            if (worker)
                finish({
                    type: 'done',
                    error: 'Previous run stopped.',
                    output: '',
                    issues: [],
                });
            blobUrl = URL.createObjectURL(
                new Blob(
                    [
                        `(${workerMain.toString()})().catch(error => self.postMessage({type:'done',output:'',error:String(error),issues:[]}));`,
                    ],
                    { type: 'text/javascript' },
                ),
            );
            worker = new Worker(blobUrl);
            let executionStarted = false;
            worker.onerror = (event) =>
                finish({
                    type: 'done',
                    output: '',
                    error: `Python could not load: ${event.message || 'Check your connection and retry.'}`,
                    issues: [],
                });
            worker.onmessage = ({ data: message }) => {
                if (message.type === 'running') {
                    if (executionStarted) return;
                    executionStarted = true;
                    clearTimeout(timer);
                    timer = setTimeout(
                        () =>
                            finish({
                                type: 'done',
                                output: '',
                                error: 'Execution exceeded 12 seconds. Check your loops.',
                                issues: [],
                            }),
                        12000,
                    );
                    port.postMessage(message);
                } else if (message.type === 'done') finish(message);
            };
            timer = setTimeout(
                () =>
                    finish({
                        type: 'done',
                        output: '',
                        error: 'Python loading timed out. Check your internet connection.',
                        issues: [],
                    }),
                60000,
            );
            worker.postMessage(data);
        };
        port.postMessage({ type: 'ready' });
    });
})();

import { createCppEngine } from './cpp-engine.js';

self.onmessage = async ({ data }) => {
    try {
        const engine = await createCppEngine(data.baseUrl, (phase) =>
            self.postMessage({ type: phase }),
        );
        const built = await engine.compile(data.code);
        if (built.errors.length) {
            self.postMessage({
                type: 'done',
                compilerErrors: built.errors,
                output: '',
                issues: [],
            });
            return;
        }
        // All assets are loaded. Student execution cannot make runtime network requests.
        globalThis.fetch = () =>
            Promise.reject(new Error('Network disabled during execution.'));
        globalThis.WebSocket = undefined;
        globalThis.XMLHttpRequest = undefined;
        const result = await engine.execute(built.artifact, data.input);
        const issues = [];
        if (result.exitCode !== 0)
            issues.push(`Program exited with status ${result.exitCode}.`);
        if (data.rules?.test_cases?.length) {
            const normalized = (value) =>
                String(value).replace(/\s+/g, ' ').trim();
            for (const [index, test] of data.rules.test_cases
                .slice(0, 10)
                .entries()) {
                const checked = await engine.execute(
                    built.artifact,
                    String(test.input ?? ''),
                );
                if (
                    checked.exitCode !== 0 ||
                    normalized(checked.stdout) !== normalized(test.expected)
                )
                    issues.push(
                        `Practice test ${index + 1} differs from the example output. Teacher review still checks your activity requirements.`,
                    );
            }
        }
        self.postMessage({
            type: 'done',
            output: result.stdout,
            runtimeErrors: result.stderr,
            exitCode: result.exitCode,
            compilerErrors: [],
            issues,
        });
        engine.dispose();
    } catch (error) {
        self.postMessage({
            type: 'done',
            runtimeErrors: String(error?.message ?? error),
            output: '',
            issues: [],
        });
    }
};

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

export type CppRules = { test_cases?: { input: string; expected: string }[] };
export default function CppEditor({
    code,
    onChange,
    starter,
    input,
    onInput,
    rules,
    readOnly = false,
    onSave,
}: {
    code: string;
    onChange: (value: string) => void;
    starter: string;
    input: string;
    onInput: (value: string) => void;
    rules?: CppRules;
    readOnly?: boolean;
    onSave?: () => void;
}) {
    const frame = useRef<HTMLIFrameElement>(null),
        port = useRef<MessagePort | null>(null);
    const [ready, setReady] = useState(false),
        [busy, setBusy] = useState(false),
        [output, setOutput] = useState('Run your program to see its output.'),
        [compiler, setCompiler] = useState(''),
        [runtime, setRuntime] = useState(''),
        [checkExamples, setCheckExamples] = useState(false),
        [issues, setIssues] = useState<string[]>([]);
    useEffect(
        () => () => {
            port.current?.postMessage({ type: 'stop' });
            port.current?.close();
        },
        [],
    );
    const connect = () => {
        port.current?.close();
        const channel = new MessageChannel();
        port.current = channel.port1;
        channel.port1.onmessage = ({ data }) => {
            if (data.type === 'ready') setReady(true);
            if (data.type === 'compiling') setOutput('Compiling C++17…');
            if (data.type === 'running') setOutput('Running…');
            if (data.type === 'done') {
                setBusy(false);
                setOutput(String(data.output ?? '').slice(0, 65536));
                setCompiler(
                    (data.compilerErrors ?? []).slice(0, 30).join('\n'),
                );
                setRuntime(String(data.runtimeErrors ?? '').slice(0, 65536));
                setIssues(
                    Array.isArray(data.issues)
                        ? data.issues.slice(0, 20).map(String)
                        : [],
                );
            }
        };
        frame.current?.contentWindow?.postMessage('codelab-cpp-connect', '*', [
            channel.port2,
        ]);
    };
    const run = () => {
        setBusy(true);
        setCompiler('');
        setRuntime('');
        setIssues([]);
        setOutput(
            'Loading isolated compiler… First run downloads about 30 MB.',
        );
        port.current?.postMessage({
            type: 'run',
            code,
            input,
            rules: checkExamples ? rules : undefined,
        });
    };
    return (
        <section className="space-y-4 rounded-2xl border bg-white p-4">
            <iframe
                ref={frame}
                src="/cpp-sandbox.html"
                sandbox="allow-scripts"
                title="Isolated C++ compiler"
                className="hidden"
                onLoad={connect}
            />
            <label htmlFor="cpp-code" className="font-bold">
                CODE · C++17 · main.cpp
            </label>
            <textarea
                id="cpp-code"
                value={code}
                onChange={(event) => onChange(event.target.value)}
                readOnly={readOnly}
                maxLength={200000}
                spellCheck={false}
                className="code-surface min-h-80 w-full rounded-xl p-4 font-mono text-sm"
            />
            <div className="flex flex-wrap gap-2">
                <Button onClick={run} disabled={!ready || busy}>
                    Run
                </Button>
                <Button
                    variant="outline"
                    onClick={() => port.current?.postMessage({ type: 'stop' })}
                    disabled={!busy}
                >
                    Stop
                </Button>
                <Button
                    variant="outline"
                    disabled={readOnly || busy}
                    onClick={() => onChange(starter)}
                >
                    Reset
                </Button>
                <Button
                    variant="outline"
                    disabled={readOnly || busy}
                    onClick={() => onChange('')}
                >
                    Clear
                </Button>
                <Button
                    variant="outline"
                    onClick={() => {
                        void navigator.clipboard
                            .writeText(code)
                            .catch(() =>
                                setRuntime(
                                    'Select the source and copy it manually.',
                                ),
                            );
                    }}
                >
                    Copy Code
                </Button>
                {onSave && (
                    <Button
                        variant="outline"
                        disabled={readOnly || busy}
                        onClick={onSave}
                    >
                        Save Code
                    </Button>
                )}
            </div>
            <label htmlFor="cpp-input" className="block font-bold">
                Program Input (cin / stdin)
            </label>
            {rules?.test_cases?.length ? (
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={checkExamples}
                        onChange={(event) =>
                            setCheckExamples(event.target.checked)
                        }
                        disabled={busy}
                    />
                    Check against example samples (use with the lesson example)
                </label>
            ) : null}
            <p className="text-sm text-muted-foreground">
                Enter all inputs before Run, using spaces or separate lines as
                your program expects. Files are temporary within each Run.
                Compilation: 30 seconds; execution: 5 seconds; program memory:
                64 MiB.
            </p>
            <textarea
                id="cpp-input"
                value={input}
                onChange={(event) => onInput(event.target.value)}
                maxLength={20000}
                className="min-h-24 w-full rounded-xl border p-3 font-mono"
            />
            <h2 className="font-bold">Program Output</h2>
            <pre
                aria-live="polite"
                className="code-surface max-h-96 min-h-32 overflow-auto rounded-xl p-4 text-sm whitespace-pre-wrap"
            >
                {output}
            </pre>
            {compiler && (
                <div role="alert">
                    <h3 className="font-bold">Compilation Errors</h3>
                    <pre className="overflow-auto whitespace-pre-wrap text-rose-700">
                        {compiler}
                    </pre>
                </div>
            )}
            {runtime && (
                <div role="alert">
                    <h3 className="font-bold">Runtime Messages</h3>
                    <pre className="overflow-auto whitespace-pre-wrap text-rose-700">
                        {runtime}
                    </pre>
                </div>
            )}
            {!!issues.length && (
                <ul className="list-disc pl-5 text-sm">
                    {issues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                    ))}
                </ul>
            )}
            <p className="text-sm text-muted-foreground">
                Practice checks compare behavior on sample inputs. Completion
                requires your activity, quiz, and teacher review.
            </p>
        </section>
    );
}

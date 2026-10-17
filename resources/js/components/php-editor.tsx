import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

export type PhpRules = {
    required_functions?: string[];
    required_constructs?: string[];
    expected_output?: string;
    test_cases?: {
        function: string;
        arguments: unknown[];
        expected: unknown;
    }[];
};
export default function PhpEditor({
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
    rules?: PhpRules;
    readOnly?: boolean;
    onSave?: () => void;
}) {
    const frame = useRef<HTMLIFrameElement>(null);
    const port = useRef<MessagePort | null>(null);
    const [ready, setReady] = useState(false);
    const [busy, setBusy] = useState(false);
    const [output, setOutput] = useState('Run your program to see its output.');
    const [issues, setIssues] = useState<string[]>([]);
    const [preview, setPreview] = useState(false);
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
            if (data.type === 'running') setOutput('Running…');
            if (data.type === 'done') {
                setBusy(false);
                setOutput(
                    String(data.output ?? '').slice(0, 20000) +
                        (data.error
                            ? `\n${String(data.error).slice(0, 5000)}`
                            : ''),
                );
                setIssues(
                    Array.isArray(data.issues)
                        ? data.issues.slice(0, 30).map(String)
                        : [],
                );
            }
        };
        frame.current?.contentWindow?.postMessage('codelab-php-connect', '*', [
            channel.port2,
        ]);
    };
    const run = () => {
        setBusy(true);
        setIssues([]);
        setOutput('Loading isolated PHP 8.4…');
        port.current?.postMessage({ type: 'run', code, input, rules });
    };
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(code);
        } catch {
            setOutput('Copy failed. Select the code and copy it manually.');
        }
    };
    return (
        <section className="space-y-4 rounded-2xl border bg-white p-4">
            <iframe
                ref={frame}
                src="/php-sandbox.html"
                sandbox="allow-scripts"
                title="Isolated PHP runtime"
                className="hidden"
                onLoad={connect}
            />
            <label htmlFor="php-code" className="font-bold">
                CODE · PHP
            </label>
            <textarea
                id="php-code"
                value={code}
                onChange={(event) => onChange(event.target.value)}
                readOnly={readOnly}
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
                <Button variant="outline" onClick={() => void copy()}>
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
            <label htmlFor="php-input" className="block font-bold">
                Request Data (JSON)
            </label>
            <p className="text-sm text-muted-foreground">
                JSON: {'{"post":{"name":"Maria"}}'}. Optional get, cookie, and
                session fields. Files and the PDO SQLite teaching database are
                temporary within each run.
            </p>
            <textarea
                id="php-input"
                value={input}
                onChange={(event) => onInput(event.target.value)}
                maxLength={20000}
                className="min-h-24 w-full rounded-xl border p-3 font-mono"
            />
            <h2 className="font-bold">OUTPUT</h2>
            <label className="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={preview}
                    onChange={(event) => setPreview(event.target.checked)}
                />
                Show HTML preview
            </label>
            <pre
                aria-live="polite"
                className="code-surface max-h-96 min-h-32 overflow-auto rounded-xl p-4 text-sm whitespace-pre-wrap"
            >
                {output}
            </pre>
            {preview && (
                <iframe
                    title="PHP HTML output"
                    sandbox=""
                    srcDoc={
                        '<meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; style-src &#39;unsafe-inline&#39;; form-action &#39;none&#39;; base-uri &#39;none&#39;">' +
                        output
                    }
                    className="min-h-48 w-full rounded border bg-white"
                />
            )}
            {issues.length > 0 && (
                <ul className="space-y-1 text-sm text-rose-700">
                    {issues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                    ))}
                </ul>
            )}
            <p className="text-xs text-muted-foreground">
                PHP runs in a temporary browser sandbox: no server files,
                application cookies, processes, or networking. PDO uses a fresh
                SQLite teaching database; MySQL projects need a separate
                educational environment. Run checks provide practice feedback.
                Your teacher reviews submitted solutions for completion.
            </p>
        </section>
    );
}

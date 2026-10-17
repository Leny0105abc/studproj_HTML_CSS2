import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

export type SqlRules = {
    expected_results?: { columns: string[]; values: unknown[][] }[];
};
type Result = {
    results: {
        columns: string[];
        values: (string | number | null)[][];
        truncated: boolean;
    }[];
    objects: { type: string; name: string; sql: string }[];
    statements: number;
};
type Props = {
    code: string;
    onChange: (code: string) => void;
    starter: string;
    seed?: string;
    input: string;
    onInput: (input: string) => void;
    rules?: SqlRules;
    readOnly?: boolean;
    onSave?: () => void;
};

export default function SqlEditor({
    code,
    onChange,
    starter,
    seed = '',
    input,
    onInput,
    rules,
    readOnly,
    onSave,
}: Props) {
    const id = useId();
    const frame = useRef<HTMLIFrameElement>(null);
    const port = useRef<MessagePort | null>(null);
    const [connected, setConnected] = useState(false);
    const [running, setRunning] = useState(false);
    const [output, setOutput] = useState<Result | null>(null);
    const [error, setError] = useState('');
    const [checkExample, setCheckExample] = useState(false);
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
            if (data.type === 'connected') setConnected(true);
            else if (data.type === 'result') {
                setOutput(data.value);
                setRunning(false);
            } else if (data.type === 'error') {
                setError(data.message);
                setRunning(false);
            }
        };
        frame.current?.contentWindow?.postMessage(
            { type: 'sql-connect' },
            '*',
            [channel.port2],
        );
    };
    const run = () => {
        setError('');
        setOutput(null);
        setRunning(true);
        port.current?.postMessage({ type: 'run', code, seed, input });
    };
    return (
        <div className="space-y-4">
            <iframe
                ref={frame}
                src="/sql-sandbox.html"
                sandbox="allow-scripts"
                title="Isolated SQLite runner"
                className="hidden"
                onLoad={connect}
            />
            <p className="text-sm">
                SQLite lab · Every Run starts a fresh practice database. Keep
                creation, inserts, and queries together in one script. Saved
                work contains your SQL and parameters.
            </p>
            <label htmlFor={id} className="block font-semibold">
                SQL script · queries.sql
            </label>
            <textarea
                id={id}
                value={code}
                onChange={(e) => onChange(e.target.value)}
                readOnly={readOnly}
                spellCheck={false}
                maxLength={200000}
                className="min-h-72 w-full rounded-lg border bg-slate-950 p-4 font-mono text-sm text-slate-100"
            />
            <label htmlFor={id + '-parameters'} className="block font-semibold">
                Named parameters (JSON, optional)
            </label>
            <textarea
                id={id + '-parameters'}
                value={input}
                onChange={(e) => onInput(e.target.value)}
                readOnly={readOnly}
                spellCheck={false}
                maxLength={20000}
                placeholder={'{":id": 1}'}
                className="min-h-20 w-full rounded-lg border p-3 font-mono text-sm"
            />
            <div className="flex flex-wrap gap-2">
                <Button
                    onClick={run}
                    disabled={!connected || running || !code.trim()}
                >
                    {running ? 'Running…' : 'Run SQL'}
                </Button>
                <Button
                    variant="outline"
                    disabled={!running}
                    onClick={() => {
                        port.current?.postMessage({ type: 'stop' });
                        setRunning(false);
                        setError('Run stopped.');
                    }}
                >
                    Stop
                </Button>
                <Button
                    variant="outline"
                    disabled={readOnly || running}
                    onClick={() => onChange(starter)}
                >
                    Reset script
                </Button>
                <Button
                    variant="outline"
                    disabled={readOnly || running}
                    onClick={() => onChange('')}
                >
                    Clear script
                </Button>
                <Button
                    variant="outline"
                    onClick={() => void navigator.clipboard.writeText(code)}
                >
                    Copy SQL
                </Button>
                {onSave && (
                    <Button disabled={readOnly || running} onClick={onSave}>
                        Save SQL
                    </Button>
                )}
            </div>
            {rules?.expected_results && (
                <label className="flex gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={checkExample}
                        onChange={(e) => setCheckExample(e.target.checked)}
                    />
                    Compare with example results (practice only)
                </label>
            )}
            <section
                aria-live="polite"
                className="space-y-3 rounded-lg border p-4"
            >
                <h3 className="font-bold">Query results</h3>
                {error && (
                    <p role="alert" className="text-red-700">
                        {error}
                    </p>
                )}
                {!output && !error && (
                    <p>
                        {running
                            ? 'Running your script…'
                            : 'Run SQL to see result tables and the practice schema.'}
                    </p>
                )}
                {output && (
                    <>
                        <p>
                            {output.statements} statements executed.{' '}
                            {output.results.length} result tables.
                        </p>
                        {checkExample && rules?.expected_results && (
                            <p>
                                {JSON.stringify(
                                    output.results.map(
                                        ({ columns, values }) => ({
                                            columns,
                                            values,
                                        }),
                                    ),
                                ) === JSON.stringify(rules.expected_results)
                                    ? 'Example results match.'
                                    : 'Results differ from the example. Review the query and ordering.'}{' '}
                                This does not award completion.
                            </p>
                        )}
                        {output.results.map((result, i) => (
                            <div key={i} className="overflow-x-auto">
                                <p className="mb-2 font-semibold">
                                    Result {i + 1} · {result.values.length} rows
                                    {result.truncated
                                        ? ' (first 200 shown)'
                                        : ''}
                                </p>
                                <table className="w-full border-collapse text-left text-sm">
                                    <caption className="sr-only">
                                        Query result {i + 1}
                                    </caption>
                                    <thead>
                                        <tr>
                                            {result.columns.map((column, c) => (
                                                <th
                                                    key={c}
                                                    scope="col"
                                                    className="border p-2"
                                                >
                                                    {column}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.values.map((row, r) => (
                                            <tr key={r}>
                                                {row.map((value, c) => (
                                                    <td
                                                        key={c}
                                                        className="border p-2 whitespace-pre-wrap"
                                                    >
                                                        {value === null
                                                            ? 'NULL'
                                                            : String(value)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                        <details>
                            <summary className="cursor-pointer font-semibold">
                                Practice schema ({output.objects.length}{' '}
                                objects)
                            </summary>
                            {output.objects.map((object) => (
                                <pre
                                    key={object.type + object.name}
                                    className="mt-2 overflow-x-auto rounded bg-slate-100 p-3 text-xs whitespace-pre-wrap"
                                >
                                    {object.type}: {object.name}
                                    {'\n'}
                                    {object.sql}
                                </pre>
                            ))}
                        </details>
                    </>
                )}
            </section>
            <p className="text-xs text-slate-600">
                Limits: 5 seconds of execution, 64 MiB WebAssembly memory, 100
                statements, 200 displayed rows per result, 64 KiB total result
                text. SQLite syntax errors are shown here; completion requires
                the quiz and teacher approval.
            </p>
        </div>
    );
}

import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
export type JavascriptRules = {
    expected_output?: string;
    sample_input?: string;
    module?: boolean;
    modules?: Record<string, string>;
    fixtures?: Record<string, unknown>;
    bootstrapPreview?: boolean;
    tailwindPreview?: boolean;
    dom_checks?: { selector: string; description: string }[];
};
type Props = {
    code: string;
    html: string;
    css: string;
    input: string;
    onChange: (v: string) => void;
    onHtml: (v: string) => void;
    onCss: (v: string) => void;
    onInput: (v: string) => void;
    starter: string;
    starterHtml?: string;
    starterCss?: string;
    rules?: JavascriptRules;
    readOnly?: boolean;
    onSave?: () => void;
    bootstrapVersion?: string;
    tailwindVersion?: string;
};
export default function JavascriptEditor({
    code,
    html,
    css,
    input,
    onChange,
    onHtml,
    onCss,
    onInput,
    starter,
    starterHtml = '',
    starterCss = '',
    rules,
    readOnly,
    onSave,
    bootstrapVersion,
    tailwindVersion,
}: Props) {
    const id = useId(),
        frame = useRef<HTMLIFrameElement>(null),
        preview = useRef<HTMLIFrameElement>(null),
        port = useRef<MessagePort | null>(null),
        viewPort = useRef<MessagePort | null>(null);
    const [ready, setReady] = useState(false),
        [running, setRunning] = useState(false),
        [output, setOutput] = useState('Run JavaScript to see console output.'),
        [error, setError] = useState(''),
        [compare, setCompare] = useState(false),
        [rendered, setRendered] = useState(false);
    const [domChecks, setDomChecks] = useState<
        { description: string; passed: boolean }[]
    >([]);
    const isStyledPreview = Boolean(bootstrapVersion || tailwindVersion);
    const runSource = useRef('');
    const [width, setWidth] = useState('100%');
    useEffect(
        () => () => {
            port.current?.postMessage({ type: 'stop' });
            port.current?.close();
            viewPort.current?.close();
        },
        [],
    );
    const connect = () => {
        port.current?.close();
        const channel = new MessageChannel();
        port.current = channel.port1;
        channel.port1.onmessage = ({ data }) => {
            if (data.type === 'connected') setReady(true);
            else if (data.type === 'result') {
                setRunning(false);
                setOutput(data.value.output || '(No console output)');
                setRendered(true);
                setDomChecks(data.value.domChecks ?? []);
                viewPort.current?.postMessage({
                    html: data.value.html,
                    css: data.value.css,
                    bootstrapCommands: data.value.bootstrapCommands,
                    source: runSource.current,
                });
            } else if (data.type === 'error') {
                setRunning(false);
                setRendered(false);
                setOutput((current) =>
                    current === 'Running…'
                        ? 'Run ended with an error.'
                        : current,
                );
                setError(data.message);
            }
        };
        frame.current?.contentWindow?.postMessage(
            { type: 'javascript-connect' },
            '*',
            [channel.port2],
        );
    };
    const connectPreview = () => {
        viewPort.current?.close();
        const channel = new MessageChannel();
        viewPort.current = channel.port1;
        channel.port1.onmessage = ({ data }) => {
            if (data.type === 'preview-error') {
                setError(data.message);
                return;
            }
            if (data.type === 'preview-ready') return;
            port.current?.postMessage({ type: 'event', event: data });
        };
        preview.current?.contentWindow?.postMessage(
            {
                type: tailwindVersion
                    ? 'tailwind-preview-connect'
                    : bootstrapVersion
                      ? 'bootstrap-preview-connect'
                      : 'javascript-preview-connect',
            },
            '*',
            [channel.port2],
        );
    };
    const run = () => {
        runSource.current = html + '\n' + code;
        setError('');
        setOutput('Running…');
        setRunning(true);
        setRendered(false);
        viewPort.current?.postMessage({ html: '', css: '' });
        port.current?.postMessage({
            type: 'run',
            code,
            html,
            css,
            input,
            rules: {
                ...rules,
                ...(bootstrapVersion ? { bootstrapPreview: true } : {}),
                ...(tailwindVersion ? { tailwindPreview: true } : {}),
            },
        });
    };
    return (
        <section className="space-y-4 rounded-xl border p-4">
            <iframe
                ref={frame}
                src="/javascript-sandbox.html"
                sandbox="allow-scripts"
                title="Isolated JavaScript interpreter"
                className="hidden"
                onLoad={connect}
            />
            <p className="text-sm">
                {bootstrapVersion && (
                    <span className="block font-semibold">
                        Bootstrap {bootstrapVersion} · local CSS and trusted
                        bundle preloaded. Student JavaScript uses the isolated
                        interpreter and a limited component bridge.
                    </span>
                )}
                {tailwindVersion && (
                    <span className="block font-semibold">
                        Tailwind CSS {tailwindVersion} · local isolated practice
                        compiler. HTML utilities and custom @theme/@apply CSS
                        are compiled on Run. No CDN or production browser helper
                        is required.
                    </span>
                )}
                Isolated JavaScript lab · Practice DOM, timers, storage, and
                mock APIs run inside the lab. Each Run starts fresh.
            </p>
            <label htmlFor={id} className="block font-semibold">
                JavaScript · main.js
            </label>
            <textarea
                id={id}
                value={code}
                readOnly={readOnly}
                onChange={(e) => onChange(e.target.value)}
                spellCheck={false}
                maxLength={100000}
                className="min-h-72 w-full rounded-lg bg-slate-950 p-3 font-mono text-sm text-slate-100"
            />
            <details open={isStyledPreview ? true : undefined}>
                <summary className="cursor-pointer font-semibold">
                    HTML and CSS workspace
                </summary>
                <label
                    htmlFor={id + '-html'}
                    className="mt-3 block font-semibold"
                >
                    HTML · index.html
                </label>
                <textarea
                    id={id + '-html'}
                    value={html}
                    readOnly={readOnly}
                    onChange={(e) => onHtml(e.target.value)}
                    spellCheck={false}
                    maxLength={100000}
                    className="min-h-40 w-full rounded-lg border p-3 font-mono text-sm"
                />
                <label htmlFor={id + '-css'} className="block font-semibold">
                    CSS · styles.css
                </label>
                <textarea
                    id={id + '-css'}
                    value={css}
                    readOnly={readOnly}
                    onChange={(e) => onCss(e.target.value)}
                    spellCheck={false}
                    maxLength={50000}
                    className="min-h-28 w-full rounded-lg border p-3 font-mono text-sm"
                />
            </details>
            <label htmlFor={id + '-input'} className="block font-semibold">
                Lab inputs (JSON: prompts, local modules, mock API fixtures)
            </label>
            <textarea
                id={id + '-input'}
                value={input}
                readOnly={readOnly}
                onChange={(e) => onInput(e.target.value)}
                placeholder={'{"prompts": ["Maria", "90"]}'}
                spellCheck={false}
                maxLength={20000}
                className="min-h-20 w-full rounded-lg border p-3 font-mono text-sm"
            />
            <div className="flex flex-wrap gap-2">
                <Button
                    onClick={run}
                    disabled={
                        !ready ||
                        running ||
                        !(isStyledPreview ? html.trim() : code.trim())
                    }
                >
                    {isStyledPreview ? 'Run' : 'Run JavaScript'}
                </Button>
                <Button
                    variant="outline"
                    disabled={!rendered && !running}
                    onClick={() => {
                        port.current?.postMessage({ type: 'stop' });
                        setRunning(false);
                        setRendered(false);
                        setOutput('Run stopped.');
                    }}
                >
                    Stop
                </Button>
                <Button
                    variant="outline"
                    disabled={readOnly || running}
                    onClick={() => {
                        onChange(starter);
                        onHtml(starterHtml);
                        onCss(starterCss);
                    }}
                >
                    Reset workspace
                </Button>
                <Button
                    variant="outline"
                    disabled={readOnly || running}
                    onClick={() => {
                        onChange('');
                        if (isStyledPreview) {
                            onHtml('');
                            onCss('');
                        }
                    }}
                >
                    {isStyledPreview ? 'Clear workspace' : 'Clear JavaScript'}
                </Button>
                <Button
                    variant="outline"
                    onClick={() =>
                        void navigator.clipboard
                            .writeText(code)
                            .catch(() =>
                                setError(
                                    'Copy failed. Select and copy manually.',
                                ),
                            )
                    }
                >
                    Copy JavaScript
                </Button>
                {onSave && (
                    <Button onClick={onSave} disabled={readOnly || running}>
                        Save workspace
                    </Button>
                )}
                {isStyledPreview && (
                    <>
                        <Button
                            variant="outline"
                            onClick={() =>
                                void navigator.clipboard
                                    .writeText(html)
                                    .catch(() =>
                                        setError(
                                            'Select HTML and copy manually.',
                                        ),
                                    )
                            }
                        >
                            Copy HTML
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() =>
                                void navigator.clipboard
                                    .writeText(css)
                                    .catch(() =>
                                        setError(
                                            'Select CSS and copy manually.',
                                        ),
                                    )
                            }
                        >
                            Copy CSS
                        </Button>
                    </>
                )}
            </div>
            {rules?.expected_output && (
                <label className="flex gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={compare}
                        onChange={(e) => setCompare(e.target.checked)}
                    />
                    Compare example console output (practice only)
                </label>
            )}
            <section aria-live="polite">
                <h3 className="font-bold">Console output</h3>
                {error && (
                    <p role="alert" className="text-red-700">
                        {error}
                    </p>
                )}
                <pre className="mt-2 max-h-72 overflow-auto rounded bg-slate-950 p-3 text-sm whitespace-pre-wrap text-slate-100">
                    {output}
                </pre>
                {compare && rules?.expected_output && (
                    <p>
                        {output.trim() === rules.expected_output.trim()
                            ? 'Example output matches.'
                            : 'Output differs from the example.'}{' '}
                        Completion requires teacher approval and the quiz.
                    </p>
                )}
            </section>
            <h3 className="font-bold">Interactive practice preview</h3>
            {isStyledPreview && domChecks.length > 0 && (
                <ul aria-label="Rendered DOM practice checks">
                    {domChecks.map((check, index) => (
                        <li key={index}>
                            {check.passed ? '✓' : 'Review:'} {check.description}{' '}
                            · practice only
                        </li>
                    ))}
                </ul>
            )}
            {isStyledPreview && (
                <div
                    className="flex flex-wrap gap-2"
                    aria-label="Responsive preview widths"
                >
                    {[
                        ['Mobile', '375px'],
                        ['Tablet', '768px'],
                        ['Desktop', '1280px'],
                        ['Full Width', '100%'],
                    ].map(([label, value]) => (
                        <Button
                            key={value}
                            variant={width === value ? 'default' : 'outline'}
                            aria-pressed={width === value}
                            onClick={() => setWidth(value)}
                        >
                            {label}
                        </Button>
                    ))}
                    <p className="w-full text-sm">
                        Widths are test viewports, not exact device models.
                        Scroll horizontally if a larger viewport does not fit.
                    </p>
                </div>
            )}
            <div className="overflow-auto">
                <iframe
                    ref={preview}
                    src={
                        tailwindVersion
                            ? '/tailwind-preview.html'
                            : bootstrapVersion
                              ? '/bootstrap-preview.html'
                              : '/javascript-preview.html'
                    }
                    sandbox={
                        isStyledPreview
                            ? 'allow-scripts allow-forms'
                            : 'allow-scripts'
                    }
                    title={
                        tailwindVersion
                            ? 'Tailwind responsive preview'
                            : bootstrapVersion
                              ? 'Bootstrap responsive preview'
                              : 'JavaScript interactive preview'
                    }
                    className="h-80 w-full rounded-lg border bg-white"
                    onLoad={connectPreview}
                    style={
                        isStyledPreview
                            ? {
                                  width,
                                  minWidth: width,
                                  boxSizing:
                                      width === '100%'
                                          ? 'border-box'
                                          : 'content-box',
                              }
                            : undefined
                    }
                />
            </div>
            <p className="text-xs text-slate-600">
                No live network, application cookies, host files, or persistent
                storage. Prompt/alert use lab inputs and console messages.
                Timers advance in virtual time. Common DOM methods and events
                are supported; layout-dependent browser APIs are outside this
                practice model.
                {bootstrapVersion &&
                    ' Bootstrap data attributes use real Bootstrap plugins. The bridge supports component show/hide/toggle/dispose; arbitrary plugin internals, synchronous DOM measurements and native browser APIs require your own development environment.'}
            </p>
        </section>
    );
}

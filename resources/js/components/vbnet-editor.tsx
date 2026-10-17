import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

export type VbnetRules = { test_cases?: { input: string; expected: string }[] };
export default function VbnetEditor({
    code,
    onChange,
    starter,
    input,
    onInput,
    lessonId,
    available = false,
    mode = 'console',
    readOnly = false,
    onSave,
}: {
    code: string;
    onChange: (value: string) => void;
    starter: string;
    input: string;
    onInput: (value: string) => void;
    lessonId?: number;
    available?: boolean;
    mode?: string;
    rules?: VbnetRules;
    readOnly?: boolean;
    onSave?: () => void;
}) {
    const request = useRef<AbortController | null>(null);
    const [busy, setBusy] = useState(false);
    const [output, setOutput] = useState(
        mode === 'winforms'
            ? 'Build and test desktop source in Visual Studio on Windows.'
            : available
              ? 'Ready to run in the configured isolated service.'
              : 'A verified isolated .NET service is required for online Run. You can save and submit source now.',
    );
    const [compiler, setCompiler] = useState('');
    const [runtime, setRuntime] = useState('');
    useEffect(() => () => request.current?.abort(), []);
    const run = async () => {
        if (!lessonId || !available || mode === 'winforms') return;
        const controller = new AbortController();
        request.current = controller;
        setBusy(true);
        setCompiler('');
        setRuntime('');
        setOutput('Contacting isolated VB.NET service…');
        const timeout = window.setTimeout(() => controller.abort(), 40000);
        try {
            const response = await fetch(`/code-lab/${lessonId}/vbnet/run`, {
                method: 'POST',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(
                        document.cookie
                            .split('; ')
                            .find((value) => value.startsWith('XSRF-TOKEN='))
                            ?.slice(11) ?? '',
                    ),
                },
                body: JSON.stringify({ code, input }),
            });
            const data = await response.json();
            if (!response.ok)
                throw new Error(data.message ?? 'VB.NET service unavailable.');
            setOutput(data.output ?? '');
            setCompiler(data.compilation_output ?? '');
            setRuntime(data.runtime_errors ?? '');
        } catch (error) {
            setOutput('');
            setRuntime(
                controller.signal.aborted
                    ? 'Request stopped. The sandbox still enforces its execution deadline.'
                    : String(error),
            );
        } finally {
            clearTimeout(timeout);
            request.current = null;
            setBusy(false);
        }
    };
    return (
        <section className="space-y-4 rounded-2xl border bg-white p-4">
            <p className="rounded-lg bg-amber-50 p-3 text-sm">
                {mode === 'winforms'
                    ? 'Desktop lesson: follow the Visual Studio Form Design guide. Windows Forms does not run in this browser.'
                    : !available
                      ? 'Online compiler unavailable. Use a supported .NET SDK in your own development environment; Run becomes available only after a verified isolated service is connected.'
                      : 'Console runs execute in the configured isolated service.'}
            </p>
            <label htmlFor="vbnet-code" className="font-bold">
                VB.NET CODE · Program.vb
            </label>
            <textarea
                id="vbnet-code"
                value={code}
                onChange={(event) => onChange(event.target.value)}
                readOnly={readOnly}
                maxLength={200000}
                spellCheck={false}
                className="code-surface min-h-80 w-full rounded-xl p-4 font-mono text-sm"
            />
            <div className="flex flex-wrap gap-2">
                <Button
                    onClick={() => void run()}
                    disabled={
                        busy || !lessonId || !available || mode === 'winforms'
                    }
                >
                    Run
                </Button>
                <Button
                    variant="outline"
                    onClick={() => request.current?.abort()}
                    disabled={!busy}
                >
                    Stop
                </Button>
                <Button
                    variant="outline"
                    onClick={() => onChange(starter)}
                    disabled={readOnly || busy}
                >
                    Reset
                </Button>
                <Button
                    variant="outline"
                    onClick={() => onChange('')}
                    disabled={readOnly || busy}
                >
                    Clear
                </Button>
                <Button
                    variant="outline"
                    onClick={() =>
                        void navigator.clipboard
                            .writeText(code)
                            .catch(() =>
                                setRuntime(
                                    'Select the code and copy it manually.',
                                ),
                            )
                    }
                >
                    Copy Code
                </Button>
                {onSave && (
                    <Button
                        variant="outline"
                        onClick={onSave}
                        disabled={readOnly || busy}
                    >
                        Save Code
                    </Button>
                )}
            </div>
            <p className="text-sm text-muted-foreground">
                {mode === 'winforms'
                    ? 'Submit your form, event handler, and service source with project links and actual desktop test evidence. Build and test using Visual Studio on Windows.'
                    : 'Console programs use Module Program and Sub Main(). Supply Console.ReadLine values one per line. Files and any practice SQLite database must remain in a disposable workspace.'}
            </p>
            {!lessonId && (
                <p className="text-sm">
                    Run the saved source in the student lesson workspace. This
                    review shows the immutable submission snapshot.
                </p>
            )}
            {mode !== 'winforms' && (
                <>
                    <label htmlFor="vbnet-input" className="block font-bold">
                        Program Input (Console.ReadLine / stdin)
                    </label>
                    <textarea
                        id="vbnet-input"
                        value={input}
                        onChange={(event) => onInput(event.target.value)}
                        maxLength={20000}
                        className="min-h-24 w-full rounded-xl border p-3 font-mono"
                    />
                    <h2 className="font-bold">Runtime Output</h2>
                    <pre
                        aria-live="polite"
                        className="code-surface max-h-96 min-h-32 overflow-auto rounded-xl p-4 text-sm whitespace-pre-wrap"
                    >
                        {output}
                    </pre>
                </>
            )}
            {compiler && (
                <div role="alert">
                    <h3 className="font-bold">Compilation Output</h3>
                    <pre className="overflow-auto whitespace-pre-wrap text-rose-700">
                        {compiler}
                    </pre>
                </div>
            )}
            {runtime && (
                <div role="alert">
                    <h3 className="font-bold">Runtime Errors</h3>
                    <pre className="overflow-auto whitespace-pre-wrap text-rose-700">
                        {runtime}
                    </pre>
                </div>
            )}
            <p className="text-sm text-muted-foreground">
                Compilation and output help you practice. Course completion
                requires the quiz and teacher approval.
            </p>
        </section>
    );
}

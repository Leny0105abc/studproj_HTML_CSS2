import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

export type JavaRules = { test_cases?: { input: string; expected: string }[] };
export default function JavaEditor({
    code,
    onChange,
    starter,
    input,
    onInput,
    lessonId,
    readOnly = false,
    onSave,
}: {
    code: string;
    onChange: (value: string) => void;
    starter: string;
    input: string;
    onInput: (value: string) => void;
    lessonId?: number;
    rules?: JavaRules;
    readOnly?: boolean;
    onSave?: () => void;
}) {
    const request = useRef<AbortController | null>(null);
    const [busy, setBusy] = useState(false);
    const [output, setOutput] = useState(
        'Run your Java program to see its output.',
    );
    const [compiler, setCompiler] = useState('');
    const [runtime, setRuntime] = useState('');
    useEffect(() => () => request.current?.abort(), []);
    const run = async () => {
        if (!lessonId) return;
        const controller = new AbortController();
        request.current = controller;
        setBusy(true);
        setCompiler('');
        setRuntime('');
        setOutput('Contacting isolated Java service…');
        const timeout = window.setTimeout(() => controller.abort(), 40000);
        try {
            const response = await fetch(`/code-lab/${lessonId}/java/run`, {
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
                throw new Error(data.message ?? 'Java service unavailable.');
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
            <label htmlFor="java-code" className="font-bold">
                CODE · Java 17 · Main.java
            </label>
            <textarea
                id="java-code"
                value={code}
                onChange={(event) => onChange(event.target.value)}
                readOnly={readOnly}
                maxLength={200000}
                spellCheck={false}
                className="code-surface min-h-80 w-full rounded-xl p-4 font-mono text-sm"
            />
            <div className="flex flex-wrap gap-2">
                <Button onClick={() => void run()} disabled={busy || !lessonId}>
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
                Use public class Main with public static void main(String[]
                args). Enter all Scanner input before Run. Files and the
                educational JDBC database belong to one disposable run.
            </p>
            {!lessonId && (
                <p className="text-sm">
                    Run the saved source in the student lesson workspace. This
                    review shows the immutable submission snapshot.
                </p>
            )}
            <label htmlFor="java-input" className="block font-bold">
                Program Input (Scanner / stdin)
            </label>
            <textarea
                id="java-input"
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

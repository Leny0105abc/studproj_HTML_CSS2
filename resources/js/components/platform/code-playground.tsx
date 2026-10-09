import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { localLessonImages } from '@/lib/lesson-assets';

function javascriptDocument(source: string): string {
    // The worker belongs to an opaque sandboxed frame, never the app origin.
    // A strict frame CSP blocks network access; a timer terminates loops.
    const encoded = JSON.stringify(source).replaceAll('<', '\\u003c');
    return (
        '<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; script-src &#39;unsafe-inline&#39; blob:; worker-src blob:; connect-src &#39;none&#39;; style-src &#39;unsafe-inline&#39;"><style>body{font:14px monospace;padding:16px}pre{white-space:pre-wrap}</style></head><body><pre id="output"></pre><script>' +
        'const output=document.getElementById("output"); const source=' +
        encoded +
        ';' +
        'const prefix="console.log=(...args)=>postMessage({text:args.map(v=>typeof v===\\"string\\"?v:JSON.stringify(v)).join(\\" \\")});console.error=console.log;console.warn=console.log;";' +
        'const code=prefix+"try{"+source+"\\n;postMessage({done:true});}catch(e){postMessage({text:String(e),done:true});}";' +
        'const url=URL.createObjectURL(new Blob([code],{type:"text/javascript"}));const worker=new Worker(url);' +
        'const timer=setTimeout(()=>{worker.terminate();output.textContent+="\\nExecution stopped after 2 seconds.";URL.revokeObjectURL(url)},2000);' +
        'worker.onmessage=e=>{if(e.data.text)output.textContent+=e.data.text+"\\n";if(e.data.done){clearTimeout(timer);worker.terminate();URL.revokeObjectURL(url)}};' +
        'worker.onerror=e=>{output.textContent=String(e.message);clearTimeout(timer);worker.terminate();URL.revokeObjectURL(url)};' +
        '<\/script></body></html>'
    );
}

export default function CodePlayground({
    editorType,
    provider,
    source,
    onChange,
    readOnly = false,
}: {
    editorType: string;
    provider: string;
    source: string;
    onChange: (source: string) => void;
    readOnly?: boolean;
}) {
    const [output, setOutput] = useState('');
    const runnable =
        provider === 'browser' && ['html', 'javascript'].includes(editorType);
    const run = () =>
        setOutput(
            editorType === 'html'
                ? localLessonImages(source)
                : javascriptDocument(source),
        );
    return (
        <section className="overflow-hidden rounded-2xl border">
            <header className="flex items-center justify-between border-b bg-slate-950 p-4 text-white">
                <h2 className="font-semibold">
                    {editorType === 'none'
                        ? 'Reflection workspace'
                        : editorType.toUpperCase() + ' workspace'}
                </h2>
                {runnable && (
                    <Button size="sm" onClick={run}>
                        <Play className="size-4" />
                        Run
                    </Button>
                )}
            </header>
            <div className="grid lg:grid-cols-2">
                <div>
                    <label className="sr-only" htmlFor="source-editor">
                        Source code
                    </label>
                    <textarea
                        id="source-editor"
                        value={source}
                        onChange={(e) => onChange(e.target.value)}
                        readOnly={readOnly}
                        spellCheck={false}
                        className="code-surface min-h-[360px] w-full resize-y p-4 font-mono text-sm"
                    />
                </div>
                <div className="min-w-0 border-t lg:border-t-0 lg:border-l">
                    {runnable ? (
                        <iframe
                            title="Sandboxed code output"
                            sandbox={
                                editorType === 'javascript'
                                    ? 'allow-scripts'
                                    : ''
                            }
                            srcDoc={
                                output ||
                                '<p>Choose Run to preview your code.</p>'
                            }
                            className="h-[360px] w-full bg-white"
                        />
                    ) : (
                        <div className="p-6 text-sm leading-7 text-muted-foreground">
                            {editorType === 'scratch'
                                ? 'Use the block-building activity and project instructions provided by your teacher. A Scratch environment can be connected later.'
                                : editorType === 'none'
                                  ? 'Write a reflection or answer, then save your work.'
                                  : 'The secure runner for this course is not connected yet. You can write, save and submit code for teacher review.'}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

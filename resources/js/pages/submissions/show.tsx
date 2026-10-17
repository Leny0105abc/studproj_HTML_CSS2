import { FlowDiagram, type FlowGraph } from '@/components/programming-flowchart';
import { Form, Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import WordpressEvidence, {
    type WordpressDetails,
} from '@/components/wordpress-evidence';
import PythonEditor from '@/components/python-editor';
import PhpEditor from '@/components/php-editor';
import JavascriptEditor from '@/components/javascript-editor';
import SqlEditor from '@/components/sql-editor';
import AppsScriptEditor from '@/components/apps-script-editor';
import VbaEditor from '@/components/vba-editor';
import CsharpEditor from '@/components/csharp-editor';
import VbnetEditor from '@/components/vbnet-editor';
import JavaEditor from '@/components/java-editor';
import CppEditor from '@/components/cpp-editor';
import ScratchProject from '@/components/scratch-project';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

type Feedback = { id: number; comment: string; created_at: string };
type Submission = WordpressDetails & {
    programming_workspace?: { graph: FlowGraph; codes: Record<string, string>; analysis: string; algorithm: string; pseudocode: string; test_notes: string; documentation?: string; input: string } | null;
    id: number;
    version: number;
    status: string;
    html_code: string;
    js_code?: string;
    python_code?: string | null;
    php_code?: string | null;
    sql_code?: string | null;
    apps_script_code?: string | null;
    apps_script_project_url?: string | null;
    apps_script_notes?: string | null;
    vba_code?: string | null;
    vba_workbook_url?: string | null;
    vba_notes?: string | null;
    csharp_code?: string | null;
    csharp_project_url?: string | null;
    csharp_notes?: string | null;
    vbnet_code?: string | null;
    vbnet_project_url?: string | null;
    vbnet_notes?: string | null;
    java_code?: string | null;
    cpp_code?: string | null;
    program_input?: string;
    scratch_project_url?: string | null;
    scratch_notes?: string | null;
    rubric_scores?: Record<string, number> | null;
    css_code: string;
    extra_files?: Record<string, string>;
    submitted_at: string;
    user: { name: string; username: string };
    lesson?: {
        number: number;
        title: string;
        course?: { editor_type: string };
        starter_javascript?: string;
        validation_rules?: {
            javascript?: import('@/components/javascript-editor').JavascriptRules;
        };
        csharp_mode?: string;
        csharp_project_guide?: string;
        vbnet_mode?: string;
        vbnet_form_guide?: string;
        sql_seed?: string | null;
        rubric?: Record<string, number> | null;
    };
    case_study?: { number: number; title: string };
    feedback: Feedback[];
};
export default function SubmissionReview({
    submission,
    versions,
    quizTotal = 5,
    quizRequired,
    quizScore,
    canComplete,
    bootstrapVersion,
    tailwindVersion,
}: {
    submission: Submission;
    versions: {
        id: number;
        version: number;
        status: string;
        submitted_at: string;
    }[];
    quizTotal?: number;
    quizRequired: boolean;
    quizScore: number | null;
    canComplete: boolean;
    bootstrapVersion: string;
    tailwindVersion: string;
}) {
    const isWordpress = submission.lesson?.course?.editor_type === 'wordpress';
    const isJavascript = [
        'javascript',
        'html-css-bootstrap',
        'html-tailwind',
    ].includes(submission.lesson?.course?.editor_type ?? '');
    const [file, setFile] = useState(
        submission.csharp_code != null
            ? 'Program.cs'
            : submission.apps_script_code != null
              ? 'Code.gs'
              : submission.vba_code != null
                ? 'Module.bas'
                : submission.vbnet_code != null
                  ? 'Program.vb'
                  : isJavascript
                    ? 'main.js'
                    : submission.scratch_project_url
                      ? 'Project details'
                      : submission.sql_code != null
                        ? 'queries.sql'
                        : submission.java_code != null
                          ? 'Main.java'
                          : submission.cpp_code != null
                            ? 'main.cpp'
                            : submission.php_code != null
                              ? 'main.php'
                              : submission.python_code !== null &&
                                  submission.python_code !== undefined
                                ? 'main.py'
                                : 'index.html',
    );
    const [programInput, setProgramInput] = useState(
        submission.program_input ?? '',
    );
    const errors = usePage().props.errors as Record<string, string>;
    const files =
        submission.csharp_code != null
            ? ['Program.cs']
            : submission.apps_script_code != null
              ? ['Code.gs']
              : submission.vba_code != null
                ? ['Module.bas']
                : submission.vbnet_code != null
                  ? ['Program.vb']
                  : isJavascript
                    ? ['main.js', 'index.html', 'styles.css']
                    : submission.scratch_project_url
                      ? ['Project details']
                      : submission.sql_code != null
                        ? ['queries.sql']
                        : submission.java_code != null
                          ? ['Main.java']
                          : submission.cpp_code != null
                            ? ['main.cpp']
                            : submission.php_code != null
                              ? ['main.php']
                              : submission.python_code !== null &&
                                  submission.python_code !== undefined
                                ? ['main.py']
                                : [
                                      'index.html',
                                      ...Object.keys(
                                          submission.extra_files ?? {},
                                      ),
                                      'styles.css',
                                  ];
    const selectedHtml =
        file === 'index.html' || file === 'styles.css'
            ? submission.html_code
            : (submission.extra_files?.[file] ?? '');
    const srcDoc = useMemo(() => {
        const style = `<style>${submission.css_code ?? ''}</style>`;
        const html = selectedHtml ?? '';
        if (/<\/head\s*>/i.test(html))
            return html.replace(/<\/head\s*>/i, `${style}</head>`);
        return `<!doctype html><html><head>${style}</head><body>${html}</body></html>`;
    }, [selectedHtml, submission.css_code]);
    return (
        <>
            <Head title={`Review ${submission.user.name}`} />
            <main className="soft-grid min-h-full p-4 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-7xl space-y-6">
                    <Button asChild variant="ghost">
                        <Link href="/submissions">
                            <ArrowLeft /> Back to queue
                        </Link>
                    </Button>
                    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                        <div>
                            <Badge className="capitalize">
                                {submission.status.replace('_', ' ')}
                            </Badge>
                            <h1 className="mt-3 text-3xl font-bold">
                                {submission.lesson
                                    ? `Lesson ${submission.lesson.number}: ${submission.lesson.title}`
                                    : `Case Study ${submission.case_study?.number}: ${submission.case_study?.title}`}
                            </h1>
                            <p className="mt-2 text-muted-foreground">
                                {submission.user.name} · @
                                {submission.user.username} · Version{' '}
                                {submission.version}
                            </p>
                        </div>
                        <select
                            value={submission.id}
                            onChange={(e) =>
                                (location.href = `/submissions/${e.target.value}`)
                            }
                            className="h-10 rounded-md border bg-white px-3 text-sm"
                        >
                            {versions.map((v) => (
                                <option key={v.id} value={v.id}>
                                    Version {v.version} · {v.status}
                                </option>
                            ))}
                        </select>
                    </header>
                    {submission.programming_workspace && <section className="space-y-4 rounded-xl border bg-card p-5"><h2 className="text-xl font-bold">Programming plan, flowchart, and three implementations</h2><FlowDiagram graph={submission.programming_workspace.graph} onSelect={() => {}} /><div className="grid gap-4 lg:grid-cols-3">{Object.entries(submission.programming_workspace.codes).map(([language, code]) => <section key={language}><h3 className="font-bold capitalize">{language}</h3><pre className="max-h-96 overflow-auto rounded border bg-muted p-3 text-xs">{code}</pre></section>)}</div>{(['analysis', 'algorithm', 'pseudocode', 'test_notes', 'documentation', 'input'] as const).map((field) => <section key={field}><h3 className="font-semibold capitalize">{field.replace('_', ' ')}</h3><pre className="max-h-80 overflow-auto rounded bg-muted p-3 text-sm whitespace-pre-wrap">{submission.programming_workspace?.[field]}</pre></section>)}</section>}
                    <div
                        className={`grid gap-6 ${isWordpress ? 'xl:grid-cols-[1fr_340px]' : 'xl:grid-cols-[1fr_1fr_340px]'}`}
                    >
                        {isWordpress ? (
                            <WordpressEvidence details={submission} />
                        ) : (
                            <>
                                <Card className="overflow-hidden">
                                    <div className="flex overflow-x-auto border-b bg-slate-950">
                                        {files.map((name) => (
                                            <button
                                                key={name}
                                                onClick={() => setFile(name)}
                                                className={`shrink-0 px-4 py-3 text-xs ${file === name ? 'border-b-2 border-amber-400 text-white' : 'text-slate-400'}`}
                                            >
                                                {name}
                                            </button>
                                        ))}
                                    </div>
                                    <pre className="code-surface min-h-[520px] overflow-auto p-5 text-sm leading-6">
                                        <code>
                                            {submission.scratch_project_url
                                                ? `${submission.scratch_project_url}\n\n${submission.scratch_notes ?? ''}`
                                                : file === 'Program.cs'
                                                  ? submission.csharp_code
                                                  : file === 'Code.gs'
                                                    ? submission.apps_script_code
                                                    : file === 'Module.bas'
                                                      ? submission.vba_code
                                                      : file === 'Program.vb'
                                                        ? submission.vbnet_code
                                                        : file === 'main.js'
                                                          ? submission.js_code
                                                          : file ===
                                                              'queries.sql'
                                                            ? submission.sql_code
                                                            : file ===
                                                                'Main.java'
                                                              ? submission.java_code
                                                              : file ===
                                                                  'main.cpp'
                                                                ? submission.cpp_code
                                                                : file ===
                                                                    'main.php'
                                                                  ? submission.php_code
                                                                  : file ===
                                                                      'main.py'
                                                                    ? submission.python_code
                                                                    : file ===
                                                                        'styles.css'
                                                                      ? submission.css_code
                                                                      : selectedHtml}
                                        </code>
                                    </pre>
                                </Card>
                                <Card className="overflow-hidden">
                                    <CardHeader>
                                        <CardTitle>
                                            {submission.scratch_project_url
                                                ? 'Scratch project review'
                                                : 'Rendered output'}
                                        </CardTitle>
                                    </CardHeader>
                                    <>
                                        {submission.apps_script_code != null ? (
                                            <div className="space-y-4 p-4">
                                                <AppsScriptEditor
                                                    code={
                                                        submission.apps_script_code
                                                    }
                                                    starter={
                                                        submission.apps_script_code
                                                    }
                                                    onChange={() => {}}
                                                    readOnly
                                                />
                                                {submission.apps_script_project_url && (
                                                    <a
                                                        href={
                                                            submission.apps_script_project_url
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="underline"
                                                    >
                                                        Open submitted Google
                                                        project link
                                                    </a>
                                                )}
                                                <h3 className="font-bold">
                                                    Submitted Google evidence /
                                                    testing notes
                                                </h3>
                                                <p className="whitespace-pre-wrap">
                                                    {submission.apps_script_notes ||
                                                        'No additional notes.'}
                                                </p>
                                                <p>
                                                    CodeLab shows immutable
                                                    source and evidence. Use the
                                                    appropriate authorized
                                                    teacher account to review
                                                    restricted Google resources;
                                                    no Google service is
                                                    executed here.
                                                </p>
                                            </div>
                                        ) : submission.vba_code != null ? (
                                            <div className="space-y-4 p-4">
                                                <VbaEditor
                                                    code={submission.vba_code}
                                                    starter={
                                                        submission.vba_code
                                                    }
                                                    onChange={() => {}}
                                                    readOnly
                                                />
                                                {submission.vba_workbook_url && (
                                                    <a
                                                        href={
                                                            submission.vba_workbook_url
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="underline"
                                                    >
                                                        Open submitted
                                                        workbook/project link
                                                    </a>
                                                )}
                                                <h3 className="font-bold">
                                                    Submitted desktop evidence
                                                    and testing notes
                                                </h3>
                                                <p className="whitespace-pre-wrap">
                                                    {submission.vba_notes ||
                                                        'No additional notes.'}
                                                </p>
                                                <p>
                                                    Submitted macros are source
                                                    text. CodeLab does not open
                                                    or run linked workbooks;
                                                    review untrusted files under
                                                    your Excel policy.
                                                </p>
                                            </div>
                                        ) : submission.csharp_code != null ? (
                                            <div className="space-y-4 p-4">
                                                <CsharpEditor
                                                    code={
                                                        submission.csharp_code
                                                    }
                                                    starter={
                                                        submission.csharp_code
                                                    }
                                                    onChange={() => {}}
                                                    input={programInput}
                                                    onInput={setProgramInput}
                                                    mode={
                                                        submission.lesson
                                                            ?.csharp_mode
                                                    }
                                                    readOnly
                                                />
                                                {submission.csharp_project_url && (
                                                    <a
                                                        href={
                                                            submission.csharp_project_url
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="underline"
                                                    >
                                                        Open submitted project
                                                    </a>
                                                )}
                                                <h3 className="font-bold">
                                                    Submitted evidence / testing
                                                    notes
                                                </h3>
                                                <p className="whitespace-pre-wrap">
                                                    {submission.csharp_notes ||
                                                        'No additional notes.'}
                                                </p>
                                                {submission.lesson
                                                    ?.csharp_project_guide && (
                                                    <details>
                                                        <summary>
                                                            C# project /
                                                            environment guide
                                                        </summary>
                                                        <pre className="whitespace-pre-wrap">
                                                            {
                                                                submission
                                                                    .lesson
                                                                    .csharp_project_guide
                                                            }
                                                        </pre>
                                                    </details>
                                                )}
                                            </div>
                                        ) : submission.vbnet_code != null ? (
                                            <div className="space-y-4 p-4">
                                                <VbnetEditor
                                                    code={submission.vbnet_code}
                                                    starter={
                                                        submission.vbnet_code
                                                    }
                                                    onChange={() => {}}
                                                    input={programInput}
                                                    onInput={setProgramInput}
                                                    mode={
                                                        submission.lesson
                                                            ?.vbnet_mode
                                                    }
                                                    readOnly
                                                />
                                                {submission.vbnet_project_url && (
                                                    <a
                                                        href={
                                                            submission.vbnet_project_url
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="underline"
                                                    >
                                                        Open submitted project
                                                    </a>
                                                )}
                                                <h3 className="font-bold">
                                                    Submitted evidence / testing
                                                    notes
                                                </h3>
                                                <p className="whitespace-pre-wrap">
                                                    {submission.vbnet_notes ||
                                                        'No additional notes.'}
                                                </p>
                                                {submission.lesson
                                                    ?.vbnet_form_guide && (
                                                    <details>
                                                        <summary>
                                                            Windows Forms design
                                                            guide
                                                        </summary>
                                                        <pre className="whitespace-pre-wrap">
                                                            {
                                                                submission
                                                                    .lesson
                                                                    .vbnet_form_guide
                                                            }
                                                        </pre>
                                                    </details>
                                                )}
                                            </div>
                                        ) : isJavascript ? (
                                            <div className="p-4">
                                                <JavascriptEditor
                                                    tailwindVersion={
                                                        submission.lesson
                                                            ?.course
                                                            ?.editor_type ===
                                                        'html-tailwind'
                                                            ? tailwindVersion
                                                            : undefined
                                                    }
                                                    bootstrapVersion={
                                                        submission.lesson
                                                            ?.course
                                                            ?.editor_type ===
                                                        'html-css-bootstrap'
                                                            ? bootstrapVersion
                                                            : undefined
                                                    }
                                                    code={
                                                        submission.js_code ?? ''
                                                    }
                                                    html={submission.html_code}
                                                    css={
                                                        submission.css_code ??
                                                        ''
                                                    }
                                                    input={programInput}
                                                    onChange={() => {}}
                                                    onHtml={() => {}}
                                                    onCss={() => {}}
                                                    onInput={setProgramInput}
                                                    starter={
                                                        submission.js_code ?? ''
                                                    }
                                                    rules={
                                                        submission.lesson
                                                            ?.validation_rules
                                                            ?.javascript
                                                    }
                                                    readOnly
                                                />
                                            </div>
                                        ) : submission.scratch_project_url ? (
                                            <ScratchProject
                                                url={
                                                    submission.scratch_project_url
                                                }
                                                notes={submission.scratch_notes}
                                            />
                                        ) : submission.sql_code != null ? (
                                            <div className="p-4">
                                                <SqlEditor
                                                    code={submission.sql_code}
                                                    starter={
                                                        submission.sql_code
                                                    }
                                                    seed={
                                                        submission.lesson
                                                            ?.sql_seed ?? ''
                                                    }
                                                    onChange={() => {}}
                                                    input={programInput}
                                                    onInput={setProgramInput}
                                                    readOnly
                                                />
                                            </div>
                                        ) : submission.java_code != null ? (
                                            <div className="p-4">
                                                <JavaEditor
                                                    code={submission.java_code}
                                                    onChange={() => {}}
                                                    starter={
                                                        submission.java_code
                                                    }
                                                    input={programInput}
                                                    onInput={setProgramInput}
                                                    readOnly
                                                />
                                            </div>
                                        ) : submission.cpp_code != null ? (
                                            <div className="p-4">
                                                <CppEditor
                                                    code={submission.cpp_code}
                                                    onChange={() => {}}
                                                    starter={
                                                        submission.cpp_code
                                                    }
                                                    input={programInput}
                                                    onInput={setProgramInput}
                                                    readOnly
                                                />
                                            </div>
                                        ) : submission.php_code != null ? (
                                            <div className="p-4">
                                                <p className="mb-3 text-sm">
                                                    Review the PHP source,
                                                    requirements, and security
                                                    practices. Practice output
                                                    does not award completion.
                                                </p>
                                                <PhpEditor
                                                    code={submission.php_code}
                                                    onChange={() => {}}
                                                    starter={
                                                        submission.php_code
                                                    }
                                                    input={programInput}
                                                    onInput={setProgramInput}
                                                    readOnly
                                                />
                                            </div>
                                        ) : submission.python_code !== null &&
                                          submission.python_code !==
                                              undefined ? (
                                            <div className="space-y-3 p-5">
                                                <p>
                                                    Review this Python source
                                                    and its requirements before
                                                    approval. Browser practice
                                                    results do not award
                                                    completion.
                                                </p>
                                                <PythonEditor
                                                    code={
                                                        submission.python_code
                                                    }
                                                    onChange={() => {}}
                                                    starter={
                                                        submission.python_code
                                                    }
                                                    input={programInput}
                                                    onInput={setProgramInput}
                                                    readOnly
                                                />
                                            </div>
                                        ) : (
                                            <iframe
                                                sandbox=""
                                                title="Submitted output"
                                                srcDoc={srcDoc}
                                                className="min-h-[520px] w-full border-t bg-white"
                                            />
                                        )}
                                    </>
                                </Card>
                            </>
                        )}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Teacher review</CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        Mark completed to unlock the next lesson
                                        for this student. Feedback is optional
                                        when approving, but required when
                                        requesting a revision.
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    {quizRequired && (
                                        <p className="mb-3 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-900">
                                            Quiz:{' '}
                                            {quizScore === null
                                                ? 'not taken'
                                                : `${quizScore}/${quizTotal}`}
                                            . The student must pass the quiz and
                                            submit the activity before this
                                            lesson can be completed.
                                        </p>
                                    )}
                                    {errors?.status && (
                                        <p
                                            role="alert"
                                            className="mb-3 text-sm text-rose-700"
                                        >
                                            {errors.status}
                                        </p>
                                    )}
                                    <Form
                                        action={`/submissions/${submission.id}/review`}
                                        method="post"
                                        className="space-y-4"
                                    >
                                        {(submission.csharp_code != null ||
                                            submission.apps_script_code !=
                                                null ||
                                            submission.vba_code != null ||
                                            submission.vbnet_code != null ||
                                            isJavascript ||
                                            submission.scratch_project_url ||
                                            submission.sql_code != null ||
                                            submission.java_code != null ||
                                            submission.cpp_code != null ||
                                            submission.php_code != null) &&
                                            submission.lesson?.rubric && (
                                                <fieldset className="space-y-3">
                                                    <legend className="font-semibold">
                                                        Project rubric · points
                                                        earned
                                                    </legend>
                                                    {Object.entries(
                                                        submission.lesson
                                                            .rubric,
                                                    ).map(([name, maximum]) => (
                                                        <label
                                                            className="block"
                                                            key={name}
                                                        >
                                                            {name} · maximum{' '}
                                                            {maximum}
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max={maximum}
                                                                step="0.5"
                                                                name={`rubric_scores[${name}]`}
                                                                defaultValue={
                                                                    submission
                                                                        .rubric_scores?.[
                                                                        name
                                                                    ] ?? ''
                                                                }
                                                                className="mt-1 block w-full rounded border p-2"
                                                            />
                                                        </label>
                                                    ))}
                                                    {errors.rubric_scores && (
                                                        <p role="alert">
                                                            {
                                                                errors.rubric_scores
                                                            }
                                                        </p>
                                                    )}
                                                    {submission.rubric_scores && (
                                                        <p>
                                                            Grade:{' '}
                                                            {Object.values(
                                                                submission.rubric_scores,
                                                            ).reduce(
                                                                (sum, value) =>
                                                                    sum +
                                                                    Number(
                                                                        value,
                                                                    ),
                                                                0,
                                                            )}
                                                            /100
                                                        </p>
                                                    )}
                                                </fieldset>
                                            )}
                                        <div>
                                            <Label htmlFor="comment">
                                                Feedback
                                            </Label>
                                            <textarea
                                                id="comment"
                                                name="comment"
                                                placeholder="Optional for completion; explain changes needed for a revision…"
                                                className="mt-2 min-h-36 w-full rounded-xl border p-3 text-sm"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Button
                                                name="status"
                                                value="completed"
                                                disabled={!canComplete}
                                                className="bg-emerald-600 hover:bg-emerald-500"
                                            >
                                                <CheckCircle2 /> Mark completed
                                            </Button>
                                            <Button
                                                name="status"
                                                value="needs_revision"
                                                variant="outline"
                                            >
                                                <RotateCcw /> Needs revision
                                            </Button>
                                        </div>
                                    </Form>
                                </CardContent>
                            </Card>
                            {submission.feedback.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Feedback history</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {submission.feedback.map((item) => (
                                            <div
                                                key={item.id}
                                                className="rounded-xl bg-slate-50 p-3 text-sm"
                                            >
                                                <p>{item.comment}</p>
                                                <p className="mt-2 text-xs text-muted-foreground">
                                                    {new Date(
                                                        item.created_at,
                                                    ).toLocaleString()}
                                                </p>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
SubmissionReview.layout = {
    breadcrumbs: [
        { title: 'Submissions', href: '/submissions' },
        { title: 'Review', href: '#' },
    ],
};

import { Head, Link, router, usePoll } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import CsharpEditor, { type CsharpRules } from '@/components/csharp-editor';
import LessonTeacherReview, {
    type TeacherReview,
} from '@/components/lesson-teacher-review';
import { Button } from '@/components/ui/button';

type Lesson = {
    id: number;
    title: string;
    level: string;
    position: number;
    module_number: number;
    module_total: number;
    course: { slug: string };
    objectives: string[];
    introduction: string;
    explanation: string;
    syntax: string;
    example_csharp: string;
    starter_csharp: string;
    csharp_mode: string;
    csharp_project_guide: string;
    guided_practice: string;
    activity: string;
    expected_result: string;
    important_notes: string;
    security_note: string;
    debugging_tip: string;
    challenge: string;
    completion_requirements: string;
    rubric?: Record<string, number>;
    quiz: { question: string; choices: string[] }[];
    validation_rules?: { csharp: CsharpRules };
};
type Props = {
    csharpExecutionAvailable: boolean;
    lesson: Lesson;
    workspace: {
        csharp_code: string;
        csharp_project_url: string;
        csharp_notes: string;
        program_input: string;
        version: number;
        status: string;
        is_read_only: boolean;
        quiz_score?: number;
        quiz_passed_at?: string;
    };
    previousLesson?: { id: number; title: string };
    nextLesson?: { id: number; title: string; unlocked: boolean };
    feedback: TeacherReview | null;
};
const headers = () => ({
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-XSRF-TOKEN': decodeURIComponent(
        document.cookie
            .split('; ')
            .find((value) => value.startsWith('XSRF-TOKEN='))
            ?.slice(11) ?? '',
    ),
});

function CsharpLesson({
    lesson,
    workspace,
    previousLesson,
    nextLesson,
    feedback,
    csharpExecutionAvailable,
}: Props) {
    const [code, setCode] = useState(
        workspace.csharp_code ?? lesson.starter_csharp ?? '',
    );
    const [projectUrl, setProjectUrl] = useState(
        workspace.csharp_project_url ?? '',
    );
    const [notes, setNotes] = useState(workspace.csharp_notes ?? '');
    const [tab, setTab] = useState('lesson');
    const [input, setInput] = useState(workspace.program_input ?? '');
    const [version, setVersion] = useState(workspace.version);
    const [busy, setBusy] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [quizResult, setQuizResult] = useState<{
        score: number;
        feedback: { correct: boolean; explanation: string }[];
    } | null>(null);
    usePoll(15000, { only: ['workspace', 'nextLesson', 'feedback'] });
    const save = async () => {
        const response = await fetch(`/code-lab/${lesson.id}/save`, {
            method: 'PUT',
            headers: headers(),
            body: JSON.stringify({
                html_code: code,
                program_input: input,
                csharp_project_url: projectUrl,
                csharp_notes: notes,
                version,
            }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message ?? 'Save failed');
        setVersion(data.version);
        setDirty(false);
        return data.version as number;
    };
    const action = async (submit = false) => {
        if (workspace.is_read_only || busy) return;
        setBusy(true);
        try {
            const savedVersion = await save();
            if (submit) {
                const response = await fetch(`/code-lab/${lesson.id}/submit`, {
                    method: 'POST',
                    headers: headers(),
                    body: JSON.stringify({
                        html_code: code,
                        program_input: input,
                        csharp_project_url: projectUrl,
                        csharp_notes: notes,
                        version: savedVersion,
                    }),
                });
                const data = await response.json();
                if (!response.ok)
                    throw new Error(data.message ?? 'Submission failed');
                toast.success(data.message);
                router.reload({
                    only: ['workspace', 'nextLesson', 'feedback'],
                });
            } else toast.success('C# code saved.');
        } catch (error) {
            toast.error(String(error));
        } finally {
            setBusy(false);
        }
    };
    const quiz = async () => {
        setBusy(true);
        try {
            const response = await fetch(`/code-lab/${lesson.id}/quiz`, {
                method: 'POST',
                headers: headers(),
                body: JSON.stringify({
                    answers: lesson.quiz.map((_, index) => answers[index]),
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message ?? 'Quiz failed');
            setQuizResult(data);
            toast.success(
                data.passed
                    ? 'Quiz passed. Teacher approval is required to complete the activity.'
                    : data.message,
            );
            router.reload({ only: ['workspace', 'nextLesson', 'feedback'] });
        } catch (error) {
            toast.error(String(error));
        } finally {
            setBusy(false);
        }
    };
    return (
        <>
            <Head title={lesson.title} />
            <main className="soft-grid space-y-6 p-4 sm:p-6">
                <Link
                    href={`/courses/${lesson.course.slug}`}
                    className="text-indigo-700"
                >
                    ← C# Programming
                </Link>
                <header>
                    <p className="text-sm font-semibold">
                        {lesson.level} · Lesson {lesson.module_number} of{' '}
                        {lesson.module_total} ·{' '}
                        {workspace.status.replaceAll('_', ' ')}
                    </p>
                    <h1 className="mt-2 text-3xl font-bold">{lesson.title}</h1>
                    <p className="mt-2">{lesson.introduction}</p>
                </header>
                {!csharpExecutionAvailable && (
                    <p
                        role="status"
                        className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
                    >
                        C# execution is awaiting the isolated sandbox
                        connection. Lessons, code saving, quizzes, and
                        submissions are available.
                    </p>
                )}
                {lesson.csharp_mode === 'external' && (
                    <nav
                        aria-label="Desktop / Web lesson sections"
                        className="flex flex-wrap gap-2"
                    >
                        {[
                            ['lesson', 'Lesson'],
                            ['design', 'Project Guide'],
                            ['code', 'Code'],
                            ['activity', 'Activity'],
                            ['project', 'Project'],
                            ['quiz', 'Quiz'],
                        ].map(([value, label]) => (
                            <Button
                                key={value}
                                variant={tab === value ? 'default' : 'outline'}
                                aria-pressed={tab === value}
                                onClick={() => setTab(value)}
                            >
                                {label}
                            </Button>
                        ))}
                    </nav>
                )}
                {lesson.csharp_mode === 'external' && tab === 'design' && (
                    <section className="rounded-xl border bg-white p-5">
                        <h2 className="font-bold">
                            Project · development environment guide
                        </h2>
                        <p>
                            This is a design/build guide, not an executable
                            browser form or a designer.
                        </p>
                        <pre className="mt-4 overflow-auto whitespace-pre-wrap">
                            {lesson.csharp_project_guide}
                        </pre>
                    </section>
                )}
                <div className="grid gap-6 xl:grid-cols-2">
                    <article
                        hidden={
                            lesson.csharp_mode === 'external' &&
                            !['lesson', 'activity', 'project'].includes(tab)
                        }
                        className="space-y-5 rounded-2xl border bg-white p-5"
                    >
                        <h2 className="font-bold">Learning Objectives</h2>
                        <ul className="list-disc space-y-1 pl-5">
                            {lesson.objectives.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                        <h2 className="font-bold">
                            Key Concepts & Explanation
                        </h2>
                        <p className="leading-7 whitespace-pre-line">
                            {lesson.explanation}
                        </p>
                        <h2 className="font-bold">Syntax</h2>
                        <pre className="code-surface overflow-auto rounded-xl p-4">
                            {lesson.syntax}
                        </pre>
                        <h2 className="font-bold">
                            Code Example / Try It Yourself
                        </h2>
                        <pre className="code-surface overflow-auto rounded-xl p-4">
                            {lesson.example_csharp}
                        </pre>
                        <Button
                            variant="outline"
                            disabled={workspace.is_read_only || busy}
                            onClick={() => {
                                setCode(lesson.example_csharp);
                                setDirty(true);
                            }}
                        >
                            Try example in editor
                        </Button>
                        <h2 className="font-bold">Guided Practice</h2>
                        <details className="rounded-lg border p-3">
                            <summary className="cursor-pointer font-semibold">
                                Development environment and dependencies
                            </summary>
                            <p className="mt-3 whitespace-pre-wrap">
                                {lesson.csharp_project_guide}
                            </p>
                        </details>
                        {(lesson.validation_rules?.csharp.test_cases ?? []).map(
                            (sample, index) => (
                                <details
                                    key={index}
                                    className="rounded-lg border p-3"
                                >
                                    <summary className="cursor-pointer font-semibold">
                                        Sample input and expected output{' '}
                                        {index + 1}
                                    </summary>
                                    <p className="mt-3 font-semibold">
                                        Input (one value per line)
                                    </p>
                                    <pre className="whitespace-pre-wrap">
                                        {sample.input || '(no input)'}
                                    </pre>
                                    <p className="mt-3 font-semibold">
                                        Expected output · instructional
                                    </p>
                                    <pre className="whitespace-pre-wrap">
                                        {sample.expected}
                                    </pre>
                                </details>
                            ),
                        )}
                        <p className="whitespace-pre-line">
                            {lesson.guided_practice}
                        </p>
                        <h2 className="font-bold">Independent Activity</h2>
                        <p className="whitespace-pre-line">{lesson.activity}</p>
                        <h2 className="font-bold">
                            Expected Output / Requirements
                        </h2>
                        <pre className="rounded-xl bg-indigo-50 p-4 whitespace-pre-wrap">
                            {lesson.expected_result}
                        </pre>
                        {lesson.rubric && (
                            <>
                                <h2 className="font-bold">
                                    Project Rubric · 100%
                                </h2>
                                <ul>
                                    {Object.entries(lesson.rubric).map(
                                        ([name, weight]) => (
                                            <li key={name}>
                                                {name.replaceAll('_', ' ')}:{' '}
                                                {weight}%
                                            </li>
                                        ),
                                    )}
                                </ul>
                            </>
                        )}
                        <h2 className="font-bold">Common Errors</h2>
                        <p className="whitespace-pre-line">
                            {lesson.important_notes}
                        </p>
                        <h2 className="font-bold">Debugging Tip</h2>
                        <p className="whitespace-pre-line">
                            {lesson.debugging_tip}
                        </p>
                        <h2 className="font-bold">Security Note</h2>
                        <p className="whitespace-pre-line">
                            {lesson.security_note}
                        </p>
                        <h2 className="font-bold">Summary & Challenge</h2>
                        <p className="whitespace-pre-line">
                            {lesson.challenge}
                        </p>
                        <p className="font-semibold">
                            {lesson.completion_requirements}
                        </p>
                    </article>
                    <div
                        hidden={
                            lesson.csharp_mode === 'external' &&
                            !['lesson', 'code', 'project', 'quiz'].includes(tab)
                        }
                        className="space-y-5"
                    >
                        <CsharpEditor
                            code={code}
                            onChange={(value) => {
                                setCode(value);
                                setDirty(true);
                            }}
                            starter={lesson.starter_csharp}
                            input={input}
                            onInput={(value) => {
                                setInput(value);
                                setDirty(true);
                            }}
                            lessonId={lesson.id}
                            available={csharpExecutionAvailable}
                            mode={lesson.csharp_mode}
                            rules={lesson.validation_rules?.csharp}
                            readOnly={workspace.is_read_only || busy}
                            onSave={() => void action()}
                        />
                        <section className="space-y-2 rounded-xl border bg-white p-4">
                            <h2 className="font-bold">Project evidence</h2>
                            <p className="text-sm">
                                Paste source above. Optionally add a
                                repository/project link and screenshot links,
                                file names, build steps, or test results below.
                                Do not include credentials or real student
                                records. ZIP uploads are not supported.
                            </p>
                            <label
                                htmlFor="csharp-project-link"
                                className="block font-semibold"
                            >
                                Repository / project URL (optional)
                            </label>
                            <input
                                id="csharp-project-link"
                                type="url"
                                maxLength={2048}
                                value={projectUrl}
                                readOnly={workspace.is_read_only || busy}
                                onChange={(e) => {
                                    setProjectUrl(e.target.value);
                                    setDirty(true);
                                }}
                                className="w-full rounded border p-2"
                            />
                            <label
                                htmlFor="csharp-evidence-notes"
                                className="block font-semibold"
                            >
                                Evidence and testing notes
                            </label>
                            <textarea
                                id="csharp-evidence-notes"
                                maxLength={20000}
                                value={notes}
                                readOnly={workspace.is_read_only || busy}
                                onChange={(e) => {
                                    setNotes(e.target.value);
                                    setDirty(true);
                                }}
                                className="min-h-28 w-full rounded border p-2"
                            />
                        </section>
                        <p aria-live="polite">
                            {dirty ? 'Unsaved changes' : 'Code saved'} · Version{' '}
                            {version}
                        </p>
                        <Button
                            disabled={
                                workspace.is_read_only || busy || !code.trim()
                            }
                            onClick={() => void action(true)}
                        >
                            {busy ? 'Saving…' : 'Submit activity / project'}
                        </Button>
                        <LessonTeacherReview review={feedback} />
                        <section
                            hidden={
                                lesson.csharp_mode === 'external' &&
                                tab !== 'quiz' &&
                                tab !== 'lesson'
                            }
                            className="space-y-4 rounded-2xl border bg-white p-5"
                        >
                            <h2 className="font-bold">
                                Quick Check · 5 questions
                            </h2>
                            <p>
                                Pass with 4/5. Latest score:{' '}
                                {workspace.quiz_score ?? 'Not taken'}.
                            </p>
                            {lesson.quiz.map((question, index) => (
                                <fieldset
                                    disabled={workspace.is_read_only || busy}
                                    key={index}
                                >
                                    <legend className="font-semibold">
                                        {index + 1}. {question.question}
                                    </legend>
                                    {question.choices.map(
                                        (choice, choiceIndex) => (
                                            <label
                                                key={choiceIndex}
                                                className="mt-2 flex gap-2"
                                            >
                                                <input
                                                    type="radio"
                                                    name={`q-${index}`}
                                                    checked={
                                                        answers[index] ===
                                                        choiceIndex
                                                    }
                                                    onChange={() =>
                                                        setAnswers(
                                                            (current) => ({
                                                                ...current,
                                                                [index]:
                                                                    choiceIndex,
                                                            }),
                                                        )
                                                    }
                                                />
                                                {choice}
                                            </label>
                                        ),
                                    )}
                                    {quizResult && (
                                        <p className="mt-2 text-sm">
                                            {quizResult.feedback[index].correct
                                                ? 'Correct. '
                                                : 'Review: '}
                                            {
                                                quizResult.feedback[index]
                                                    .explanation
                                            }
                                        </p>
                                    )}
                                </fieldset>
                            ))}
                            <Button
                                disabled={
                                    workspace.is_read_only ||
                                    busy ||
                                    lesson.quiz.some(
                                        (_, index) =>
                                            answers[index] === undefined,
                                    )
                                }
                                onClick={() => void quiz()}
                            >
                                Submit quiz
                            </Button>
                        </section>
                    </div>
                </div>
                <nav className="flex justify-between gap-4">
                    {previousLesson && (
                        <Link href={`/code-lab/${previousLesson.id}`}>
                            ← {previousLesson.title}
                        </Link>
                    )}
                    {nextLesson &&
                        (nextLesson.unlocked ? (
                            <Link href={`/code-lab/${nextLesson.id}`}>
                                {nextLesson.title} →
                            </Link>
                        ) : (
                            <span>
                                Complete this lesson to unlock{' '}
                                {nextLesson.title}
                            </span>
                        ))}
                </nav>
            </main>
        </>
    );
}
export default function CsharpLab(props: Props) {
    return <CsharpLesson key={props.lesson.id} {...props} />;
}

CsharpLab.layout = {
    breadcrumbs: [
        { title: 'Courses', href: '/courses' },
        { title: 'C# Lab', href: '#' },
    ],
};

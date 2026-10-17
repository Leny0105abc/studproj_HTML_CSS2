import { Head, Link, router, usePoll } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import TailwindEditor, {
    type JavascriptRules,
} from '@/components/tailwind-editor';
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
    example_javascript: string;
    starter_javascript: string;
    starter_html: string;
    starter_css: string;
    example_html: string;
    example_css: string;
    guided_practice: string;
    activity: string;
    expected_result: string;
    important_notes: string;
    security_note: string;
    accessibility_tip: string;
    responsive_tip: string;
    debugging_tip: string;
    challenge: string;
    completion_requirements: string;
    rubric?: Record<string, number>;
    quiz: { question: string; choices: string[] }[];
    validation_rules?: {
        javascript: JavascriptRules;
        tailwind?: {
            dom_checks?: { selector: string; description: string }[];
        };
    };
};
type Props = {
    tailwindVersion: string;
    lesson: Lesson;
    workspace: {
        js_code: string;
        html_code: string;
        css_code: string;
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

function TailwindLesson({
    lesson,
    workspace,
    previousLesson,
    nextLesson,
    feedback,
    tailwindVersion,
}: Props) {
    const [code, setCode] = useState(
        workspace.js_code ?? lesson.starter_javascript ?? '',
    );
    const [html, setHtml] = useState(
        workspace.html_code ?? lesson.starter_html ?? '',
    );
    const [css, setCss] = useState(
        workspace.css_code ?? lesson.starter_css ?? '',
    );
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
                html_code: html,
                css_code: css,
                js_code: code,
                program_input: input,
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
                        html_code: html,
                        css_code: css,
                        js_code: code,
                        program_input: input,
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
            } else toast.success('Tailwind workspace saved.');
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
            <main className="soft-grid max-w-full min-w-0 space-y-6 p-4 sm:p-6">
                <Link
                    href={`/courses/${lesson.course.slug}`}
                    className="text-indigo-700"
                >
                    ← Tailwind
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
                <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
                    <article className="min-w-0 space-y-5 rounded-2xl border bg-white p-5">
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
                        <h2 className="font-bold">
                            Tailwind Classes and Concepts
                        </h2>
                        <pre className="code-surface overflow-auto rounded-xl p-4">
                            {lesson.syntax}
                        </pre>
                        <h2 className="font-bold">
                            Code Example / Try It Yourself
                        </h2>
                        <details open>
                            <summary className="font-semibold">
                                HTML example
                            </summary>
                            <pre className="code-surface max-h-96 overflow-auto rounded-xl p-4 text-sm">
                                {lesson.example_html}
                            </pre>
                        </details>
                        {lesson.example_css && (
                            <details>
                                <summary className="font-semibold">
                                    Custom CSS example
                                </summary>
                                <pre className="code-surface overflow-auto rounded-xl p-4 text-sm">
                                    {lesson.example_css}
                                </pre>
                            </details>
                        )}
                        <h3 className="font-semibold">JavaScript example</h3>
                        <pre className="code-surface overflow-auto rounded-xl p-4">
                            {lesson.example_javascript}
                        </pre>
                        <Button
                            variant="outline"
                            disabled={workspace.is_read_only || busy}
                            onClick={() => {
                                setCode(lesson.example_javascript);
                                setHtml(
                                    lesson.example_html ??
                                        lesson.starter_html ??
                                        '',
                                );
                                setCss(
                                    lesson.example_css ??
                                        lesson.starter_css ??
                                        '',
                                );
                                setInput(
                                    lesson.validation_rules?.javascript
                                        ?.sample_input ?? '',
                                );
                                setDirty(true);
                            }}
                        >
                            Try example in editor
                        </Button>
                        <h2 className="font-bold">Guided Practice</h2>
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
                        <h2 className="font-bold">Accessibility Tip</h2>
                        <p>{lesson.accessibility_tip}</p>
                        <h2 className="font-bold">Responsive Design Tip</h2>
                        <p>{lesson.responsive_tip}</p>
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
                    <div className="min-w-0 space-y-5">
                        <TailwindEditor
                            tailwindVersion={tailwindVersion}
                            html={html}
                            css={css}
                            onHtml={(value) => {
                                setHtml(value);
                                setDirty(true);
                            }}
                            onCss={(value) => {
                                setCss(value);
                                setDirty(true);
                            }}
                            starterHtml={lesson.starter_html}
                            starterCss={lesson.starter_css}
                            code={code}
                            onChange={(value) => {
                                setCode(value);
                                setDirty(true);
                            }}
                            starter={lesson.starter_javascript ?? ''}
                            input={input}
                            onInput={(value) => {
                                setInput(value);
                                setDirty(true);
                            }}
                            rules={{
                                ...lesson.validation_rules?.javascript,
                                dom_checks:
                                    lesson.validation_rules?.tailwind
                                        ?.dom_checks,
                            }}
                            readOnly={workspace.is_read_only || busy}
                            onSave={() => void action()}
                        />
                        <p aria-live="polite">
                            {dirty ? 'Unsaved changes' : 'Code saved'} · Version{' '}
                            {version}
                        </p>
                        <Button
                            disabled={
                                workspace.is_read_only || busy || !html.trim()
                            }
                            onClick={() => void action(true)}
                        >
                            {busy ? 'Saving…' : 'Submit activity / project'}
                        </Button>
                        <LessonTeacherReview review={feedback} />
                        <section className="space-y-4 rounded-2xl border bg-white p-5">
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
export default function TailwindLab(props: Props) {
    return <TailwindLesson key={props.lesson.id} {...props} />;
}

TailwindLab.layout = {
    breadcrumbs: [
        { title: 'Courses', href: '/courses' },
        { title: 'Tailwind Lab', href: '#' },
    ],
};

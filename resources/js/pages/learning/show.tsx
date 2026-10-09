import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import CodePlayground from '@/components/platform/code-playground';
import LessonContent from '@/components/platform/lesson-content';
import { Button } from '@/components/ui/button';
import type { Course } from '@/types/platform';

type Quiz = {
    key: number;
    type: string;
    question: string;
    choices: { key: number; value: string }[];
};
type Props = {
    lesson: {
        id: number;
        title: string;
        objectives: string[];
        introduction: string;
        explanation: string;
        lesson_content?: string;
        example_code?: string;
        guided_practice?: string;
        activity?: string;
        reflection?: string;
        quiz?: Quiz[];
        passing_score: number;
    };
    course: Course;
    workspace: {
        source_code?: string;
        version: number;
        status: string;
        quiz_attempts: number;
    };
    readOnly: boolean;
    feedback?: { feedback: { comment: string; teacher?: { name: string } }[] };
    nextLesson?: { id: number; title: string } | null;
    activities: {
        id: number;
        title: string;
        instructions: string;
        responses: { status: string; feedback?: string }[];
    }[];
};
export default function Learning({
    lesson,
    course,
    workspace,
    readOnly,
    feedback,
    nextLesson,
    activities,
}: Props) {
    const [source, setSource] = useState(workspace.source_code ?? '');
    const [version, setVersion] = useState(workspace.version);
    const [saving, setSaving] = useState(false);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [result, setResult] = useState<{
        percent: number;
        passed: boolean;
        feedback: { correct: boolean; explanation: string }[];
    } | null>(null);
    const [quizBusy, setQuizBusy] = useState(false);
    const headers = () => ({
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-CSRF-TOKEN':
            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                ?.content ?? '',
    });
    const save = async () => {
        setSaving(true);
        try {
            const response = await fetch('/learn/' + lesson.id + '/save', {
                method: 'PUT',
                headers: headers(),
                body: JSON.stringify({ source_code: source, version }),
            });
            const data = await response.json();
            if (!response.ok)
                throw new Error(data.message ?? 'Unable to save.');
            setVersion(data.version);
            toast.success('Work saved');
            return true;
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Unable to save. Check your connection.',
            );
            return false;
        } finally {
            setSaving(false);
        }
    };
    const submit = async () => {
        if (await save())
            router.post(
                '/learn/' + lesson.id + '/submit',
                { source_code: source, version: version + 1 },
                { preserveScroll: true },
            );
    };
    const quiz = async (e: React.FormEvent) => {
        e.preventDefault();
        setQuizBusy(true);
        try {
            const response = await fetch('/learn/' + lesson.id + '/quiz', {
                method: 'POST',
                headers: headers(),
                body: JSON.stringify({ answers }),
            });
            const data = await response.json();
            if (!response.ok)
                throw new Error(data.message ?? 'Unable to submit the quiz.');
            setResult(data);
            router.reload({ only: ['workspace'] });
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Quiz could not connect.',
            );
        } finally {
            setQuizBusy(false);
        }
    };
    return (
        <>
            <Head title={lesson.title} />
            <main className="mx-auto max-w-6xl space-y-7 p-5 sm:p-8">
                <header>
                    <Link
                        className="text-sm text-indigo-600"
                        href={'/courses/' + course.slug}
                    >
                        ← {course.name}
                    </Link>
                    <h1 className="mt-3 text-3xl font-bold">{lesson.title}</h1>
                    <p className="mt-2 text-sm text-muted-foreground capitalize">
                        {workspace.status.replaceAll('_', ' ')}
                    </p>
                </header>
                {readOnly && (
                    <p className="rounded-xl bg-emerald-50 p-4 text-emerald-900">
                        Your teacher confirmed this work complete. You can still
                        run your saved code.
                    </p>
                )}
                <div className="grid gap-7 lg:grid-cols-[1fr_320px]">
                    <article className="space-y-6">
                        <section>
                            <h2 className="text-xl font-bold">
                                Learning objectives
                            </h2>
                            <ul className="mt-3 list-disc space-y-2 pl-5">
                                {lesson.objectives.map((o, i) => (
                                    <li key={i}>{o}</li>
                                ))}
                            </ul>
                        </section>
                        {[
                            ['Introduction', lesson.introduction],
                            ['Discussion', lesson.explanation],
                            ['Lesson content', lesson.lesson_content],
                            ['Practice', lesson.guided_practice],
                            ['Activity', lesson.activity],
                            ['Reflection / summary', lesson.reflection],
                        ]
                            .filter(([, content]) => content)
                            .map(([title, content]) => (
                                <section key={title}>
                                    <h2 className="mb-3 text-xl font-bold">
                                        {title}
                                    </h2>
                                    <LessonContent content={content ?? ''} />
                                </section>
                            ))}
                        {lesson.example_code && (
                            <section>
                                <h2 className="mb-3 text-xl font-bold">
                                    Code example
                                </h2>
                                <pre className="overflow-x-auto rounded-xl bg-slate-950 p-5 text-sm text-slate-100">
                                    <code>{lesson.example_code}</code>
                                </pre>
                            </section>
                        )}
                    </article>
                    <aside className="space-y-4 rounded-2xl border p-5">
                        <h2 className="font-bold">Course navigation</h2>
                        <Link
                            className="block text-sm text-indigo-600"
                            href={'/courses/' + course.slug}
                        >
                            View modules and lessons
                        </Link>
                        {nextLesson && (
                            <Link
                                href={'/learn/' + nextLesson.id}
                                className="block text-sm text-indigo-600"
                            >
                                Next: {nextLesson.title}
                            </Link>
                        )}
                        {feedback?.feedback.map((f, i) => (
                            <div
                                key={i}
                                className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-900"
                            >
                                <p className="font-semibold">
                                    {f.teacher?.name ?? 'Teacher feedback'}
                                </p>
                                <p className="mt-2 whitespace-pre-wrap">
                                    {f.comment}
                                </p>
                            </div>
                        ))}
                    </aside>
                </div>
                <CodePlayground
                    editorType={course.editor_type}
                    provider={course.execution_provider ?? 'none'}
                    source={source}
                    onChange={setSource}
                    readOnly={readOnly}
                />
                {!readOnly && (
                    <div className="flex flex-wrap gap-3">
                        <Button
                            variant="outline"
                            disabled={saving}
                            onClick={() => void save()}
                        >
                            {saving ? 'Saving…' : 'Save work'}
                        </Button>
                        {course.editor_type !== 'none' && (
                            <Button
                                disabled={saving}
                                onClick={() => void submit()}
                            >
                                Submit for review
                            </Button>
                        )}
                        {course.editor_type === 'none' && (
                            <Button
                                onClick={() =>
                                    router.post(
                                        '/learn/' + lesson.id + '/complete',
                                    )
                                }
                            >
                                Complete lesson
                            </Button>
                        )}
                    </div>
                )}
                {activities.length > 0 && (
                    <section>
                        <h2 className="mb-4 text-xl font-bold">
                            Practice activities
                        </h2>
                        <div className="space-y-4">
                            {activities.map((a) => (
                                <article
                                    key={a.id}
                                    className="rounded-xl border p-5"
                                >
                                    <h3 className="font-semibold">{a.title}</h3>
                                    <p className="mt-2 text-sm leading-7 whitespace-pre-wrap">
                                        {a.instructions}
                                    </p>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        {a.responses[0]?.feedback ??
                                            a.responses[0]?.status ??
                                            'Not submitted'}
                                    </p>
                                    <Link
                                        href="/activities"
                                        className="mt-3 inline-block text-sm text-indigo-600"
                                    >
                                        Open activities →
                                    </Link>
                                </article>
                            ))}
                        </div>
                    </section>
                )}
                {Boolean(lesson.quiz?.length) && (
                    <section className="rounded-2xl border p-6">
                        <h2 className="text-xl font-bold">Quiz</h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Passing score: {lesson.passing_score}% · Attempts
                            used: {workspace.quiz_attempts}
                        </p>
                        <form
                            onSubmit={(e) => void quiz(e)}
                            className="mt-6 space-y-6"
                        >
                            {lesson.quiz?.map((q) => (
                                <fieldset key={q.key} disabled={readOnly}>
                                    <legend className="mb-3 font-medium">
                                        {q.question}
                                    </legend>
                                    {q.choices.length ? (
                                        q.choices.map((c) => (
                                            <label
                                                key={c.key}
                                                className="mb-2 flex items-center gap-3 text-sm"
                                            >
                                                <input
                                                    type="radio"
                                                    required
                                                    name={'question-' + q.key}
                                                    value={c.key}
                                                    checked={
                                                        answers[q.key] ===
                                                        String(c.key)
                                                    }
                                                    onChange={(e) =>
                                                        setAnswers((a) => ({
                                                            ...a,
                                                            [q.key]:
                                                                e.target.value,
                                                        }))
                                                    }
                                                />
                                                {c.value}
                                            </label>
                                        ))
                                    ) : (
                                        <input
                                            aria-label={
                                                'Answer to ' + q.question
                                            }
                                            required
                                            className="w-full rounded-lg border p-3"
                                            value={answers[q.key] ?? ''}
                                            onChange={(e) =>
                                                setAnswers((a) => ({
                                                    ...a,
                                                    [q.key]: e.target.value,
                                                }))
                                            }
                                        />
                                    )}
                                </fieldset>
                            ))}
                            <Button
                                type="submit"
                                disabled={readOnly || quizBusy}
                            >
                                {quizBusy ? 'Checking…' : 'Submit quiz'}
                            </Button>
                        </form>
                        {result && (
                            <div
                                role="status"
                                className="mt-5 rounded-xl bg-indigo-50 p-4 text-indigo-950"
                            >
                                <p className="font-bold">
                                    {result.percent}% ·{' '}
                                    {result.passed
                                        ? 'Quiz passed'
                                        : 'Keep practicing'}
                                </p>
                                {result.feedback.map((f, i) => (
                                    <p key={i} className="mt-2 text-sm">
                                        {f.correct ? 'Correct' : 'Review'}:{' '}
                                        {f.explanation}
                                    </p>
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </main>
        </>
    );
}

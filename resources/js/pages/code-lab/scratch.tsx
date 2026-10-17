import { Head, Link, router, usePoll } from '@inertiajs/react';
import { useState } from 'react';
import LessonTeacherReview, {
    type TeacherReview,
} from '@/components/lesson-teacher-review';
import ScratchBlocks, { type BlockExample } from '@/components/scratch-blocks';
import ScratchProject from '@/components/scratch-project';
import { Button } from '@/components/ui/button';

type Lesson = {
    id: number;
    title: string;
    level: string;
    module_number: number;
    module_total: number;
    objectives: string[];
    introduction: string;
    explanation: string;
    guided_practice: string;
    activity: string;
    expected_result: string;
    important_notes: string;
    challenge: string;
    completion_requirements: string;
    block_examples: BlockExample[] | null;
    rubric: Record<string, number> | null;
    quiz: { question: string; choices: string[] }[];
};
type Props = {
    lesson: Lesson;
    workspace: {
        scratch_project_url: string;
        scratch_notes: string;
        version: number;
        status: string;
        is_read_only: boolean;
        quiz_score?: number;
    };
    previousLesson?: { id: number; title: string };
    nextLesson?: { id: number; title: string; unlocked: boolean };
    feedback:
        | (TeacherReview & { rubric_scores?: Record<string, number> })
        | null;
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
function ScratchLesson({
    lesson,
    workspace,
    previousLesson,
    nextLesson,
    feedback,
}: Props) {
    const [tab, setTab] = useState('Lesson');
    const [url, setUrl] = useState(workspace.scratch_project_url);
    const [notes, setNotes] = useState(workspace.scratch_notes);
    const [version, setVersion] = useState(workspace.version);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [quizFeedback, setQuizFeedback] = useState<
        { correct: boolean; explanation: string }[]
    >([]);
    usePoll(15000, { only: ['workspace', 'nextLesson', 'feedback'] });
    const request = async (path: string, method: string, body: unknown) => {
        const response = await fetch(path, {
            method,
            headers: headers(),
            body: JSON.stringify(body),
        });
        const result = await response.json();
        if (!response.ok)
            throw new Error(
                Object.values(result.errors ?? {})
                    .flat()
                    .join(' ') ||
                    result.message ||
                    'Unable to save.',
            );
        return result;
    };
    const persist = async (submit: boolean) => {
        setBusy(true);
        setMessage('');
        try {
            const result = await request(
                `/code-lab/${lesson.id}/scratch`,
                submit ? 'POST' : 'PUT',
                { version, scratch_project_url: url, scratch_notes: notes },
            );
            setVersion(result.version);
            setMessage(result.message);
            router.reload({ only: ['workspace', 'nextLesson', 'feedback'] });
        } catch (error) {
            setMessage(
                error instanceof Error ? error.message : 'Unable to save.',
            );
        } finally {
            setBusy(false);
        }
    };
    const quiz = async () => {
        setBusy(true);
        try {
            const result = await request(
                `/code-lab/${lesson.id}/quiz`,
                'POST',
                { answers: lesson.quiz.map((_, index) => answers[index]) },
            );
            setQuizFeedback(result.feedback);
            setMessage(result.message);
            router.reload({ only: ['workspace', 'nextLesson', 'feedback'] });
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : 'Quiz could not be saved.',
            );
        } finally {
            setBusy(false);
        }
    };
    const disabled = workspace.is_read_only || busy;
    return (
        <>
            <Head title={lesson.title} />
            <main className="mx-auto max-w-6xl space-y-6 p-5 sm:p-8">
                <Link href="/courses/scratch-programming">
                    ← Scratch Programming
                </Link>
                <header className="space-y-2">
                    <p className="text-sm font-semibold text-orange-800 uppercase">
                        {lesson.level} · Lesson {lesson.module_number} of{' '}
                        {lesson.module_total}
                    </p>
                    <h1 className="text-3xl font-bold">{lesson.title}</h1>
                    <p>
                        Visual programming ·{' '}
                        {workspace.status.replaceAll('_', ' ')}
                    </p>
                </header>
                <nav
                    aria-label="Lesson sections"
                    className="flex flex-wrap gap-2"
                >
                    {['Lesson', 'Blocks', 'Activity', 'Project', 'Quiz'].map(
                        (item) => (
                            <Button
                                key={item}
                                variant={tab === item ? 'default' : 'outline'}
                                aria-pressed={tab === item}
                                onClick={() => setTab(item)}
                            >
                                {item}
                            </Button>
                        ),
                    )}
                </nav>
                <p aria-live="polite" className="whitespace-pre-wrap">
                    {message}
                </p>
                {tab === 'Lesson' && (
                    <article className="space-y-5 rounded-2xl border bg-white p-6">
                        <h2 className="text-xl font-semibold">
                            Learning Objectives
                        </h2>
                        <ul className="list-disc space-y-2 pl-6">
                            {lesson.objectives.map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                        <h2 className="font-bold">Introduction</h2>
                        <p className="whitespace-pre-line">
                            {lesson.introduction}
                        </p>
                        <h2 className="font-bold">
                            Key Concepts & Block Explanation
                        </h2>
                        <p className="leading-7 whitespace-pre-line">
                            {lesson.explanation}
                        </p>
                        <h2 className="font-bold">Common Mistakes</h2>
                        <p className="whitespace-pre-line">
                            {lesson.important_notes}
                        </p>
                        <h2 className="font-bold">Summary</h2>
                        <p>{lesson.challenge}</p>
                    </article>
                )}
                {tab === 'Blocks' && (
                    <ScratchBlocks examples={lesson.block_examples ?? []} />
                )}
                {tab === 'Activity' && (
                    <section className="space-y-5 rounded-xl border p-6">
                        <h2 className="text-xl font-semibold">
                            Guided Activity / Try It Yourself
                        </h2>
                        <p>{lesson.guided_practice}</p>
                        <h2 className="font-bold">Independent Activity</h2>
                        <p className="leading-7 whitespace-pre-line">
                            {lesson.activity}
                        </p>
                        <h2 className="font-bold">
                            Expected Behavior / Testing Checklist
                        </h2>
                        <p className="whitespace-pre-line">
                            {lesson.expected_result}
                        </p>
                        {lesson.rubric && (
                            <>
                                <h2 className="font-bold">
                                    Project Rubric · 100 points
                                </h2>
                                <ul>
                                    {Object.entries(lesson.rubric).map(
                                        ([name, weight]) => (
                                            <li key={name}>
                                                {name}: {weight} points
                                            </li>
                                        ),
                                    )}
                                </ul>
                            </>
                        )}
                        <p>{lesson.completion_requirements}</p>
                    </section>
                )}
                {tab === 'Project' && (
                    <div className="space-y-5">
                        <section className="space-y-4 rounded-2xl border bg-orange-50 p-6">
                            <h2 className="text-xl font-semibold">
                                Build in Scratch
                            </h2>
                            <p>
                                Launch the official visual editor in a separate
                                tab. CodeLab provides lessons, block diagrams,
                                saved project links, quizzes, and review. An
                                embedded editor and project-file uploads are not
                                enabled.
                            </p>
                            <Button asChild>
                                <a
                                    href="https://scratch.mit.edu/projects/editor/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    referrerPolicy="no-referrer"
                                >
                                    Launch Scratch Workspace ↗
                                </a>
                            </Button>
                            <p>
                                Save your work in Scratch. To submit a link,
                                share the project there when your account allows
                                it and copy its project-page URL. If sharing is
                                unavailable, ask your teacher for an alternative
                                review arrangement. CodeLab does not provide
                                Scratch accounts or cloud storage.
                            </p>
                        </section>
                        <section className="space-y-4 rounded-xl border p-6">
                            <label className="block font-semibold">
                                Scratch project URL
                                <input
                                    type="url"
                                    disabled={disabled}
                                    value={url}
                                    onChange={(event) =>
                                        setUrl(event.target.value)
                                    }
                                    placeholder="https://scratch.mit.edu/projects/123456789/"
                                    className="mt-2 block w-full rounded border p-3"
                                />
                            </label>
                            <label className="block font-semibold">
                                Project notes & testing results
                                <textarea
                                    disabled={disabled}
                                    value={notes}
                                    onChange={(event) =>
                                        setNotes(event.target.value)
                                    }
                                    placeholder="Describe the sprites, blocks, expected behavior, tests, results, and any improvements."
                                    className="mt-2 block min-h-40 w-full rounded border p-3"
                                />
                            </label>
                            <div className="flex flex-wrap gap-3">
                                <Button
                                    disabled={disabled}
                                    variant="outline"
                                    onClick={() => void persist(false)}
                                >
                                    Save project details
                                </Button>
                                <Button
                                    disabled={
                                        disabled ||
                                        !url.trim() ||
                                        notes.trim().length < 20
                                    }
                                    onClick={() => void persist(true)}
                                >
                                    Submit for teacher review
                                </Button>
                            </div>
                            <p>
                                Saved version {version}.{' '}
                                {workspace.is_read_only
                                    ? 'Teacher-approved work is read-only.'
                                    : 'A quiz pass alone does not complete this lesson.'}
                            </p>
                        </section>
                        <ScratchProject
                            url={workspace.scratch_project_url}
                            notes={workspace.scratch_notes}
                        />
                        <LessonTeacherReview review={feedback} />
                        {feedback?.rubric_scores && (
                            <p>
                                Project grade:{' '}
                                {Object.values(feedback.rubric_scores).reduce(
                                    (sum, value) => sum + value,
                                    0,
                                )}
                                /100
                            </p>
                        )}
                    </div>
                )}
                {tab === 'Quiz' && (
                    <section className="space-y-5 rounded-xl border p-6">
                        <h2 className="text-xl font-semibold">
                            Quick Check · 5 questions
                        </h2>
                        <p>
                            Pass with at least 4/5. Latest score:{' '}
                            {workspace.quiz_score ?? 'Not taken'}.
                        </p>
                        {lesson.quiz.map((item, index) => (
                            <fieldset
                                disabled={disabled}
                                key={index}
                                className="space-y-2"
                            >
                                <legend className="font-semibold">
                                    {index + 1}. {item.question}
                                </legend>
                                {item.choices.map((choice, at) => (
                                    <label key={at} className="flex gap-3">
                                        <input
                                            type="radio"
                                            name={`q${index}`}
                                            checked={answers[index] === at}
                                            onChange={() =>
                                                setAnswers((current) => ({
                                                    ...current,
                                                    [index]: at,
                                                }))
                                            }
                                        />
                                        {choice}
                                    </label>
                                ))}
                                {quizFeedback[index] && (
                                    <p>
                                        {quizFeedback[index].correct
                                            ? 'Correct. '
                                            : 'Review: '}
                                        {quizFeedback[index].explanation}
                                    </p>
                                )}
                            </fieldset>
                        ))}
                        <Button
                            disabled={
                                disabled ||
                                lesson.quiz.some(
                                    (_, index) => answers[index] === undefined,
                                )
                            }
                            onClick={() => void quiz()}
                        >
                            Submit quiz
                        </Button>
                    </section>
                )}
                <nav
                    className="flex flex-wrap justify-between gap-4"
                    aria-label="Lesson navigation"
                >
                    {previousLesson && (
                        <Link href={`/lessons/${previousLesson.id}/preview`}>
                            ← {previousLesson.title}
                        </Link>
                    )}
                    {nextLesson && (
                        <Link
                            href={
                                nextLesson.unlocked
                                    ? `/code-lab/${nextLesson.id}`
                                    : `/lessons/${nextLesson.id}/preview`
                            }
                        >
                            {nextLesson.unlocked
                                ? 'Next lesson'
                                : 'Preview next lesson'}
                            : {nextLesson.title} →
                        </Link>
                    )}
                </nav>
            </main>
        </>
    );
}
export default function ScratchLab(props: Props) {
    return <ScratchLesson key={props.lesson.id} {...props} />;
}

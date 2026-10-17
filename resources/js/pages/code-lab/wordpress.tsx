import { Head, Link, router } from '@inertiajs/react';
import { useRef, useState } from 'react';
import LessonTeacherReview, {
    type TeacherReview,
} from '@/components/lesson-teacher-review';
import WordpressEvidence, {
    type WordpressDetails,
    type EvidenceFile,
} from '@/components/wordpress-evidence';
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
    wordpress_setup: string;
    wordpress_steps: string;
    site_structure: string;
    visual_guide: string;
    activity: string;
    guided_practice: string;
    expected_result: string;
    important_notes: string;
    debugging_tip: string;
    security_note: string;
    accessibility_tip: string;
    responsive_tip: string;
    maintenance_tip: string;
    submission_instructions: string;
    completion_requirements: string;
    challenge: string;
    rubric: Record<string, number> | null;
    quiz: { question: string; choices: string[] }[];
};
type Props = {
    lesson: Lesson;
    workspace: WordpressDetails & {
        version: number;
        status: string;
        is_read_only: boolean;
        quiz_score?: number;
    };
    previousLesson?: { id: number; title: string };
    nextLesson?: { id: number; title: string; unlocked: boolean };
    feedback: TeacherReview | null;
};
const sections = [
    'Lesson',
    'Steps',
    'Site Structure',
    'Activity',
    'Expected Result',
    'Submission',
    'Quiz',
];
function WordpressLesson({
    lesson,
    workspace,
    previousLesson,
    nextLesson,
    feedback,
}: Props) {
    const [tab, setTab] = useState('Lesson');
    const [details, setDetails] = useState({
        wordpress_practice_url: workspace.wordpress_practice_url ?? '',
        wordpress_project_url: workspace.wordpress_project_url ?? '',
        wordpress_environment: workspace.wordpress_environment ?? '',
        wordpress_notes: workspace.wordpress_notes ?? '',
    });
    const [evidence, setEvidence] = useState<EvidenceFile[]>(
        workspace.wordpress_evidence ?? [],
    );
    const [uploads, setUploads] = useState<File[]>([]);
    const fileInput = useRef<HTMLInputElement>(null);
    const [version, setVersion] = useState(workspace.version),
        [busy, setBusy] = useState(false),
        [message, setMessage] = useState('');
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [quizFeedback, setQuizFeedback] = useState<
        { correct: boolean; explanation: string }[]
    >([]);
    const disabled = busy || workspace.is_read_only;
    const request = async (path: string, body: FormData | string) => {
        const response = await fetch(path, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                ...(typeof body === 'string'
                    ? { 'Content-Type': 'application/json' }
                    : {}),
                'X-XSRF-TOKEN': decodeURIComponent(
                    document.cookie
                        .split('; ')
                        .find((c) => c.startsWith('XSRF-TOKEN='))
                        ?.slice(11) ?? '',
                ),
            },
            body,
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
            const data = new FormData();
            data.set('version', String(version));
            for (const [field, value] of Object.entries(details))
                data.set(field, value);
            // Encode the empty collection explicitly for multipart parsing.
            data.set(
                'evidence_ids',
                JSON.stringify(evidence.map((file) => file.id)),
            );
            uploads.forEach((file) => data.append('files[]', file));
            const result = await request(
                `/code-lab/${lesson.id}/wordpress/${submit ? 'submit' : 'save'}`,
                data,
            );
            setVersion(result.version);
            setEvidence(result.evidence);
            setUploads([]);
            if (fileInput.current) fileInput.current.value = '';
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
        setMessage('');
        try {
            const result = await request(
                `/code-lab/${lesson.id}/quiz`,
                JSON.stringify({
                    answers: lesson.quiz.map((_, i) => answers[i]),
                }),
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
    const text = (heading: string, value: string) => (
        <section className="space-y-2" key={heading}>
            <h2 className="text-xl font-semibold">{heading}</h2>
            <p className="leading-7 whitespace-pre-wrap">{value}</p>
        </section>
    );
    return (
        <>
            <Head title={lesson.title} />
            <main className="mx-auto max-w-5xl space-y-6 p-5 sm:p-8">
                <Link href="/courses/wordpress">← WordPress</Link>
                <header className="space-y-2">
                    <p className="font-semibold">
                        College · {lesson.level} · Lesson {lesson.module_number}{' '}
                        of {lesson.module_total}
                    </p>
                    <h1 className="text-3xl font-bold">{lesson.title}</h1>
                    <p>
                        WordPress practical lesson ·{' '}
                        {workspace.status.replaceAll('_', ' ')}
                    </p>
                </header>
                <p className="rounded-xl border bg-amber-50 p-4">
                    Use your authorized WordPress practice site. CodeLab
                    provides instructions, quizzes and evidence review. No
                    WordPress installation or Run button is provided here. Never
                    submit passwords or private student information.
                </p>
                <nav
                    aria-label="Lesson sections"
                    className="flex flex-wrap gap-2"
                >
                    {sections.map((item) => (
                        <Button
                            key={item}
                            variant={tab === item ? 'default' : 'outline'}
                            aria-pressed={tab === item}
                            onClick={() => setTab(item)}
                        >
                            {item}
                        </Button>
                    ))}
                </nav>
                <p role="status" className="whitespace-pre-wrap">
                    {message}
                </p>
                <article className="space-y-6 rounded-xl border bg-white p-5">
                    {tab === 'Lesson' && (
                        <>
                            <h2 className="text-xl font-semibold">
                                Learning objectives
                            </h2>
                            <ul className="list-disc space-y-2 pl-5">
                                {lesson.objectives.map((o) => (
                                    <li key={o}>{o}</li>
                                ))}
                            </ul>
                            {text('Introduction', lesson.introduction)}
                            {text('Key concepts', lesson.explanation)}
                            {text('WordPress setup', lesson.wordpress_setup)}
                            {text('Common errors', lesson.important_notes)}
                            {text('Troubleshooting', lesson.debugging_tip)}
                            {text('Security', lesson.security_note)}
                            {text('Accessibility', lesson.accessibility_tip)}
                            {text('Maintenance', lesson.maintenance_tip)}
                            {text('Summary and next lesson', lesson.challenge)}
                            <section className="space-y-2">
                                <h2 className="text-xl font-semibold">
                                    Official references
                                </h2>
                                <ul className="space-y-2 underline">
                                    <li>
                                        <a
                                            href="https://wordpress.org/about/requirements/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Current WordPress hosting
                                            requirements
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="https://wordpress.org/documentation/article/site-editor/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Site Editor and block themes
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="https://wordpress.org/documentation/article/roles-and-capabilities/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            WordPress roles and capabilities
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="https://developer.wordpress.org/advanced-administration/security/backup/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            WordPress backups
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="https://woocommerce.com/document/managing-orders/testing-orders/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            WooCommerce test orders
                                        </a>
                                    </li>
                                </ul>
                            </section>
                        </>
                    )}
                    {tab === 'Steps' && (
                        <>
                            {text(
                                'Step-by-step procedure',
                                lesson.wordpress_steps,
                            )}
                            {text('Visual guide', lesson.visual_guide)}
                        </>
                    )}
                    {tab === 'Site Structure' &&
                        text(
                            'Site structure and content model',
                            lesson.site_structure,
                        )}
                    {tab === 'Activity' && (
                        <>
                            {text('Guided practice', lesson.guided_practice)}
                            {text(
                                'Independent activity / Try it yourself',
                                lesson.activity,
                            )}
                            {text(
                                'Responsive checklist',
                                lesson.responsive_tip,
                            )}
                            {text(
                                'Completion requirements',
                                lesson.completion_requirements,
                            )}
                        </>
                    )}
                    {tab === 'Expected Result' && (
                        <>
                            {text('Expected result', lesson.expected_result)}
                            {lesson.rubric && (
                                <>
                                    <h2 className="text-xl font-semibold">
                                        Project rubric · 100 points
                                    </h2>
                                    <ul>
                                        {Object.entries(lesson.rubric).map(
                                            ([name, points]) => (
                                                <li key={name}>
                                                    {name} — {points}%
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                </>
                            )}
                        </>
                    )}
                    {tab === 'Submission' && (
                        <>
                            {text(
                                'Submission instructions',
                                lesson.submission_instructions,
                            )}
                            {(
                                [
                                    'wordpress_practice_url',
                                    'wordpress_project_url',
                                    'wordpress_environment',
                                    'wordpress_notes',
                                ] as const
                            ).map((field) => (
                                <label className="block space-y-2" key={field}>
                                    <span className="font-semibold">
                                        {
                                            {
                                                wordpress_practice_url:
                                                    'Practice Site URL',
                                                wordpress_project_url:
                                                    'Project URL',
                                                wordpress_environment:
                                                    'Environment description (version, theme, authorized access; no passwords)',
                                                wordpress_notes:
                                                    'Report and test results',
                                            }[field]
                                        }
                                    </span>
                                    {field.endsWith('_url') ? (
                                        <input
                                            type="url"
                                            className="w-full rounded border p-3"
                                            maxLength={2048}
                                            value={details[field]}
                                            disabled={disabled}
                                            onChange={(e) =>
                                                setDetails({
                                                    ...details,
                                                    [field]: e.target.value,
                                                })
                                            }
                                        />
                                    ) : (
                                        <textarea
                                            className="min-h-28 w-full rounded border p-3"
                                            maxLength={
                                                field === 'wordpress_notes'
                                                    ? 20000
                                                    : 2000
                                            }
                                            value={details[field]}
                                            disabled={disabled}
                                            onChange={(e) =>
                                                setDetails({
                                                    ...details,
                                                    [field]: e.target.value,
                                                })
                                            }
                                        />
                                    )}
                                </label>
                            ))}
                            <label className="block space-y-2">
                                <span className="font-semibold">
                                    Upload screenshots / PDF documentation
                                </span>
                                <input
                                    ref={fileInput}
                                    type="file"
                                    multiple
                                    accept="image/png,image/jpeg,image/webp,application/pdf"
                                    disabled={disabled}
                                    onChange={(e) =>
                                        setUploads(
                                            Array.from(e.target.files ?? []),
                                        )
                                    }
                                />
                            </label>
                            <p>
                                Maximum six files per version, 8 MiB each.
                                Redact secrets and personal data. A localhost
                                URL is not reachable from your teacher’s
                                computer; include evidence instead.
                            </p>
                            <ul className="space-y-2">
                                {evidence.map((file) => (
                                    <li key={file.id}>
                                        <a
                                            className="underline"
                                            href={`/wordpress-evidence/${file.id}`}
                                        >
                                            {file.name}
                                        </a>{' '}
                                        <Button
                                            variant="outline"
                                            disabled={disabled}
                                            onClick={() =>
                                                setEvidence(
                                                    evidence.filter(
                                                        (item) =>
                                                            item.id !== file.id,
                                                    ),
                                                )
                                            }
                                        >
                                            Remove from next version
                                        </Button>
                                    </li>
                                ))}
                                {uploads.map((file, i) => (
                                    <li key={`${file.name}-${i}`}>
                                        Pending: {file.name}
                                    </li>
                                ))}
                            </ul>
                            <div className="flex flex-wrap gap-3">
                                <Button
                                    disabled={disabled}
                                    onClick={() => persist(false)}
                                >
                                    Save practice work
                                </Button>
                                <Button
                                    disabled={disabled}
                                    onClick={() => persist(true)}
                                >
                                    Submit practical evidence
                                </Button>
                                <Button
                                    variant="outline"
                                    disabled={busy}
                                    onClick={() =>
                                        router.reload({
                                            only: [
                                                'workspace',
                                                'nextLesson',
                                                'feedback',
                                            ],
                                        })
                                    }
                                >
                                    Refresh review status
                                </Button>
                                <Button
                                    variant="outline"
                                    disabled={busy}
                                    onClick={() => window.location.reload()}
                                >
                                    Reload saved work (discard unsaved edits)
                                </Button>
                            </div>
                            <p>
                                Workspace version {version}. Saving and
                                submitting preserve earlier submitted versions.
                            </p>
                        </>
                    )}
                    {tab === 'Quiz' && (
                        <>
                            <h2 className="text-xl font-semibold">
                                Quick Check · pass 4 of 5
                            </h2>
                            {lesson.quiz.map((q, i) => (
                                <fieldset
                                    key={q.question}
                                    className="space-y-2 rounded border p-4"
                                >
                                    <legend className="font-semibold">
                                        {i + 1}. {q.question}
                                    </legend>
                                    {q.choices.map((choice, j) => (
                                        <label
                                            className="flex gap-2"
                                            key={choice}
                                        >
                                            <input
                                                type="radio"
                                                name={`question-${i}`}
                                                checked={answers[i] === j}
                                                disabled={disabled}
                                                onChange={() =>
                                                    setAnswers({
                                                        ...answers,
                                                        [i]: j,
                                                    })
                                                }
                                            />
                                            {choice}
                                        </label>
                                    ))}
                                    {quizFeedback[i] && (
                                        <p>
                                            {quizFeedback[i].correct
                                                ? 'Correct'
                                                : 'Review'}
                                            : {quizFeedback[i].explanation}
                                        </p>
                                    )}
                                </fieldset>
                            ))}
                            <Button
                                disabled={
                                    disabled ||
                                    Object.keys(answers).length !==
                                        lesson.quiz.length
                                }
                                onClick={quiz}
                            >
                                Submit quiz
                            </Button>
                            <p>
                                Latest score:{' '}
                                {workspace.quiz_score ?? 'Not taken'} / 5
                            </p>
                        </>
                    )}
                </article>
                <LessonTeacherReview review={feedback} />
                {workspace.is_read_only && (
                    <WordpressEvidence details={workspace} />
                )}
                <footer className="flex flex-wrap justify-between gap-4">
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
                                ? 'Next'
                                : 'Preview locked lesson'}
                            : {nextLesson.title} →
                        </Link>
                    )}
                </footer>
            </main>
        </>
    );
}
export default function WordpressPage(props: Props) {
    return <WordpressLesson key={props.lesson.id} {...props} />;
}

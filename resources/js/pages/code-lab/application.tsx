import { Head, Link, router } from '@inertiajs/react';
import { useState, useRef } from 'react';
import LessonDemonstration, {
    type Demonstration,
} from '@/components/lesson-demonstration';
import DemonstrationManager from '@/components/demonstration-manager';
import ApplicationEvidence, {
    type ApplicationWorkspace,
} from '@/components/application-evidence';
import { Button } from '@/components/ui/button';
type Content = {
    application?: string;
    topics?: string[];
    why?: string;
    terms?: string[];
    commands?: string[];
    steps?: string[];
    try_it?: string;
    exercise?: {
        title: string;
        filename: string;
        sample: string;
        tasks: string[];
    };
    common_mistakes?: string[];
    troubleshooting?: string[];
    quick_review?: string[];
    identify_command?: string;
    scenario?: string;
    predict_result?: string;
    independent?: string;
    summary?: string;
    mastery?: string[];
    submission?: string;
    allowed_uploads: string[];
    edition_note?: string;
    sources?: { title: string; url: string }[];
    brief?: string;
    deliverables?: string[];
};
type Subject = {
    id: number;
    title: string;
    level?: string;
    course_id: number;
    application_content: Content;
    objectives?: string[];
    introduction?: string;
    expected_result?: string;
    scenario?: string;
    rubric?: Record<string, number>;
    quiz?: { question: string; choices: string[] }[];
};
type Props = {
    audienceLabel: string;
    subject: Subject;
    isCase: boolean;
    isTeacher: boolean;
    workspace: ApplicationWorkspace;
    version: number;
    status: string;
    demonstrations: Demonstration[];
    nextLesson?: { id: number; title: string; unlocked: boolean };
    caseStudies: { id: number; title: string; unlocked: boolean }[];
    latestSubmission?: {
        status: string;
        reviewed_at?: string | null;
        rubric_scores?: Record<string, number>;
        feedback: { id: number; comment: string }[];
    };
};
const masteryLabels = [
    'I can identify the tool and locate it.',
    'I can explain its purpose.',
    'I can apply it independently.',
    'I can recognize and correct a mistake.',
];
const List = ({ items }: { items?: string[] }) => (
    <ul className="list-disc space-y-2 pl-6">
        {items?.map((item, index) => (
            <li key={index}>{item}</li>
        ))}
    </ul>
);
export default function ApplicationLesson({
    subject,
    isCase,
    isTeacher,
    workspace: initial,
    version: initialVersion,
    status: initialStatus,
    demonstrations,
    nextLesson,
    caseStudies,
    latestSubmission,
    audienceLabel,
}: Props) {
    const c = subject.application_content;
    const [workspace, setWorkspace] = useState(initial),
        [version, setVersion] = useState(initialVersion),
        [status, setStatus] = useState(initialStatus),
        [notes, setNotes] = useState(initial.notes ?? ''),
        [mastery, setMastery] = useState(
            initial.mastery ?? [false, false, false, false],
        ),
        [uploads, setUploads] = useState<File[]>([]),
        [message, setMessage] = useState(''),
        [busy, setBusy] = useState(false),
        [answers, setAnswers] = useState<Record<number, number>>({}),
        [quizFeedback, setQuizFeedback] = useState<
            { correct: boolean; explanation: string }[]
        >([]);
    const fileInput = useRef<HTMLInputElement>(null);
    const root = `/${isCase ? 'application-case-studies' : 'application-lessons'}/${subject.id}`;
    const readOnly =
        isTeacher ||
        (Boolean(latestSubmission?.reviewed_at) &&
            latestSubmission?.status === 'completed' &&
            status === 'completed');
    const request = async (url: string, body: FormData | object) => {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                ...(body instanceof FormData
                    ? {}
                    : { 'Content-Type': 'application/json' }),
                'X-XSRF-TOKEN': decodeURIComponent(
                    document.cookie
                        .split('; ')
                        .find((s) => s.startsWith('XSRF-TOKEN='))
                        ?.slice(11) ?? '',
                ),
            },
            body: body instanceof FormData ? body : JSON.stringify(body),
        });
        const data = await response.json();
        if (!response.ok)
            throw Error(
                Object.values(data.errors ?? {})
                    .flat()
                    .join(' ') ||
                    data.message ||
                    'Request failed.',
            );
        return data;
    };
    const viewed = async (id?: number) => {
        try {
            await request(`${root}/viewed`, id ? { demonstration_id: id } : {});
            setWorkspace((old) => ({
                ...old,
                ...(id
                    ? {
                          demonstrations_viewed: [
                              ...(old.demonstrations_viewed ?? []),
                              id,
                          ],
                      }
                    : { content_viewed: true }),
            }));
            setMessage('Learning checkpoint recorded.');
        } catch (e) {
            setMessage((e as Error).message);
        }
    };
    const save = async (submit: boolean) => {
        setBusy(true);
        try {
            const data = new FormData();
            data.set('version', String(version));
            data.set('submit', submit ? '1' : '0');
            data.set('notes', notes);
            data.set(
                'evidence_ids',
                JSON.stringify((workspace.files ?? []).map((f) => f.id)),
            );
            data.set('mastery', JSON.stringify(mastery));
            uploads.forEach((file) => data.append('files[]', file));
            const result = await request(`${root}/save`, data);
            setWorkspace(result.workspace);
            setVersion(result.version);
            setStatus(result.status);
            setMessage(result.message);
            setUploads([]);
            if (fileInput.current) fileInput.current.value = '';
            if (result.status === 'completed') router.reload();
        } catch (e) {
            setMessage((e as Error).message);
        } finally {
            setBusy(false);
        }
    };
    return (
        <>
            <Head title={subject.title} />
            <main className="soft-grid min-h-full p-4 sm:p-6">
                <div className="mx-auto max-w-5xl space-y-6">
                    <header className="space-y-3 rounded-2xl bg-indigo-950 p-6 text-white">
                        <Link className="underline" href="/courses">
                            ← Courses
                        </Link>
                        <p className="text-sm">
                            {c.application ?? 'Microsoft Word'} Application ·{' '}
                            {audienceLabel} ·{' '}
                            {subject.level ?? 'Major case study'}
                        </p>
                        <h1 className="text-3xl font-bold">{subject.title}</h1>
                        <p>
                            {status.replaceAll('_', ' ')} ·{' '}
                            {isCase ? 'Case study' : 'Practical exercise'} ·{' '}
                            {isTeacher
                                ? 'Teacher preview'
                                : `Work in ${c.application ?? 'Microsoft Word'} and submit evidence here.`}
                        </p>
                    </header>
                    {isTeacher && !isCase && (
                        <>
                            <Button asChild>
                                <Link href={`/lessons/${subject.id}/edit`}>
                                    Edit lesson content and Quick Check
                                </Link>
                            </Button>
                            <DemonstrationManager
                                lessonId={subject.id}
                                demonstrations={demonstrations}
                            />
                        </>
                    )}
                    {isTeacher && isCase && (
                        <details className="rounded-xl border bg-white p-5">
                            <summary className="cursor-pointer font-bold">
                                Edit case study
                            </summary>
                            <form
                                className="mt-4 space-y-3"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const data = new FormData(e.currentTarget);
                                    try {
                                        router.put(
                                            root,
                                            {
                                                title: String(
                                                    data.get('title'),
                                                ),
                                                scenario: String(
                                                    data.get('scenario'),
                                                ),
                                                application_content: JSON.parse(
                                                    String(data.get('content')),
                                                ),
                                                rubric: JSON.parse(
                                                    String(data.get('rubric')),
                                                ),
                                            },
                                            {
                                                onError: (errors) =>
                                                    setMessage(
                                                        Object.values(
                                                            errors,
                                                        ).join(' '),
                                                    ),
                                            },
                                        );
                                    } catch {
                                        setMessage(
                                            'Enter valid case content and rubric JSON.',
                                        );
                                    }
                                }}
                            >
                                <label className="block">
                                    Title
                                    <input
                                        className="w-full rounded border p-2"
                                        name="title"
                                        defaultValue={subject.title}
                                    />
                                </label>
                                <label className="block">
                                    Scenario
                                    <textarea
                                        className="w-full rounded border p-2"
                                        name="scenario"
                                        defaultValue={subject.scenario}
                                    />
                                </label>
                                <label className="block">
                                    Case content
                                    <textarea
                                        className="min-h-48 w-full rounded border p-2 font-mono text-sm"
                                        name="content"
                                        defaultValue={JSON.stringify(
                                            c,
                                            null,
                                            2,
                                        )}
                                    />
                                </label>
                                <label className="block">
                                    Rubric
                                    <textarea
                                        className="min-h-36 w-full rounded border p-2 font-mono text-sm"
                                        name="rubric"
                                        defaultValue={JSON.stringify(
                                            subject.rubric,
                                            null,
                                            2,
                                        )}
                                    />
                                </label>
                                <Button>Save case study</Button>
                            </form>
                        </details>
                    )}
                    <section className="space-y-4 rounded-xl border bg-white p-5">
                        <h2 className="text-xl font-bold">
                            1. What You Will Learn
                        </h2>
                        <List items={subject.objectives} />
                        <p>{subject.introduction}</p>
                        <p>{c.edition_note ?? c.brief}</p>
                        <h2 className="text-xl font-bold">
                            2. Why This Skill Is Useful
                        </h2>
                        <p>{c.why ?? c.brief}</p>
                        <h2 className="text-xl font-bold">
                            3. Important Terms
                        </h2>
                        <List items={c.terms} />
                        <h2 className="text-xl font-bold">
                            4. Tool / Command Introduction
                        </h2>
                        <List items={c.topics ?? c.deliverables} />
                        <details>
                            <summary className="cursor-pointer font-semibold">
                                Commands and functions
                            </summary>
                            <List items={c.commands} />
                        </details>
                    </section>
                    <section className="space-y-4 rounded-xl border bg-white p-5">
                        <h2 className="text-xl font-bold">
                            5. Step-by-Step Demonstration
                        </h2>
                        <ol className="list-decimal space-y-3 pl-6">
                            {(c.steps ?? c.deliverables)?.map((step, i) => (
                                <li key={i}>{step}</li>
                            ))}
                        </ol>
                    </section>
                    {!isCase && (
                        <section className="space-y-4">
                            <h2 className="text-xl font-bold">
                                6. Visual / Animated Demonstrations
                            </h2>
                            <p>
                                These guided illustrations explain commands.
                                Complete the practical task in{' '}
                                {c.application ?? 'Microsoft Word'}.
                            </p>
                            {demonstrations.map((d) => (
                                <LessonDemonstration
                                    key={d.id}
                                    demo={d}
                                    application={c.application}
                                    viewed={
                                        isTeacher ||
                                        (
                                            workspace.demonstrations_viewed ??
                                            []
                                        ).includes(d.id)
                                    }
                                    onViewed={() => void viewed(d.id)}
                                />
                            ))}
                        </section>
                    )}
                    <section className="space-y-4 rounded-xl border bg-white p-5">
                        <h2 className="text-xl font-bold">
                            7. Guided Practice
                        </h2>
                        <p>
                            Use a disposable practice copy. Follow each command
                            above, describe the visible change, and compare the
                            before and after states. Save and reopen your
                            practice file before continuing.
                        </p>
                        <h2 className="text-xl font-bold">
                            8. Try It Yourself
                        </h2>
                        <p>
                            {c.try_it ??
                                'Build the requested package independently; check each deliverable before uploading.'}
                        </p>
                        <h2 className="text-xl font-bold">
                            9. Practical {isCase ? 'Case Study' : 'Exercise'} —{' '}
                            {c.exercise?.title ?? subject.title}
                        </h2>
                        {c.exercise && (
                            <>
                                <p>
                                    Save as{' '}
                                    <strong>{c.exercise.filename}</strong>.
                                </p>
                                <pre className="overflow-auto rounded border bg-slate-50 p-4 whitespace-pre-wrap">
                                    {c.exercise.sample}
                                </pre>
                            </>
                        )}
                        <List items={c.exercise?.tasks ?? c.deliverables} />
                        {subject.expected_result && (
                            <>
                                <h3 className="font-bold">Expected output</h3>
                                <p className="whitespace-pre-wrap">
                                    {subject.expected_result}
                                </p>
                            </>
                        )}
                        {subject.rubric && (
                            <>
                                <h3 className="font-bold">
                                    Case study rubric · 100 points
                                </h3>
                                <List
                                    items={Object.entries(subject.rubric).map(
                                        ([name, value]) =>
                                            `${name} — ${value}%`,
                                    )}
                                />
                                <p>
                                    Ask your teacher how each category applies
                                    to this level’s deliverables; do not invent
                                    evidence of advanced features you have not
                                    learned.
                                </p>
                            </>
                        )}
                    </section>
                    <section className="space-y-4 rounded-xl border bg-white p-5">
                        <h2 className="text-xl font-bold">
                            10. Common Mistakes
                        </h2>
                        <List
                            items={
                                c.common_mistakes ?? [
                                    'Submitting an empty file or the wrong version.',
                                    'Using real personal information in practice records.',
                                ]
                            }
                        />
                        <h2 className="text-xl font-bold">
                            11. Troubleshooting
                        </h2>
                        <List
                            items={
                                c.troubleshooting ?? [
                                    'Reopen every submitted file and compare it with the deliverables.',
                                    'If a feature is unavailable, document the approved alternative and tell your teacher.',
                                ]
                            }
                        />
                        <h2 className="text-xl font-bold">
                            12. Quick Knowledge Check
                        </h2>
                        <List items={c.quick_review} />
                        {!isCase && (
                            <>
                                <h3 className="font-bold">
                                    Identify the command
                                </h3>
                                <p>{c.identify_command}</p>
                                <h3 className="font-bold">
                                    What would you do?
                                </h3>
                                <p>{c.scenario}</p>
                                {c.predict_result && (
                                    <>
                                        <h3 className="font-bold">
                                            Predict the result
                                        </h3>
                                        <p>{c.predict_result}</p>
                                    </>
                                )}
                                {subject.quiz?.map((q, i) => (
                                    <fieldset
                                        key={i}
                                        className="space-y-2 rounded border p-3"
                                    >
                                        <legend className="font-semibold">
                                            {i + 1}. {q.question}
                                        </legend>
                                        {q.choices.map((choice, j) => (
                                            <label key={j} className="block">
                                                <input
                                                    className="mr-2"
                                                    type="radio"
                                                    name={`question-${i}`}
                                                    disabled={isTeacher}
                                                    checked={answers[i] === j}
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
                                                    ? 'Correct.'
                                                    : 'Review this answer.'}{' '}
                                                {quizFeedback[i].explanation}
                                            </p>
                                        )}
                                    </fieldset>
                                ))}
                                <Button
                                    disabled={
                                        isTeacher ||
                                        busy ||
                                        Object.keys(answers).length !== 5
                                    }
                                    onClick={async () => {
                                        setBusy(true);
                                        try {
                                            const result = await request(
                                                `/code-lab/${subject.id}/quiz`,
                                                {
                                                    answers: Array.from(
                                                        { length: 5 },
                                                        (_, i) => answers[i],
                                                    ),
                                                },
                                            );
                                            setQuizFeedback(result.feedback);
                                            setMessage(
                                                `${result.score}/5. ${result.message}`,
                                            );
                                            router.reload({
                                                only: ['status', 'nextLesson'],
                                            });
                                        } catch (e) {
                                            setMessage((e as Error).message);
                                        } finally {
                                            setBusy(false);
                                        }
                                    }}
                                >
                                    Submit Quick Check · pass 4/5
                                </Button>
                            </>
                        )}
                    </section>
                    <section className="space-y-4 rounded-xl border bg-white p-5">
                        <h2 className="text-xl font-bold">
                            13. Lesson Summary
                        </h2>
                        <p>{c.summary ?? c.brief}</p>
                        <h2 className="text-xl font-bold">14. Mastery Check</h2>
                        <p>
                            <strong>Try it without help:</strong>{' '}
                            {c.independent ??
                                'Produce the complete package without step-by-step assistance, then inspect each document.'}
                        </p>
                        {(c.mastery ?? masteryLabels).map((label, i) => (
                            <label className="block" key={i}>
                                <input
                                    className="mr-2"
                                    type="checkbox"
                                    checked={Boolean(mastery[i])}
                                    disabled={readOnly}
                                    onChange={(e) =>
                                        setMastery(
                                            mastery.map((old, j) =>
                                                i === j
                                                    ? e.target.checked
                                                    : old,
                                            ),
                                        )
                                    }
                                />
                                {label}
                            </label>
                        ))}
                        <Button
                            variant="outline"
                            disabled={
                                isTeacher || busy || workspace.content_viewed
                            }
                            onClick={() => void viewed()}
                        >
                            {workspace.content_viewed
                                ? 'Required content read'
                                : 'I have read the required content'}
                        </Button>
                        <p>
                            Completion checkpoints are learner acknowledgements;
                            opening a page alone does not complete the activity.
                        </p>
                    </section>
                    <section className="space-y-4 rounded-xl border bg-white p-5">
                        <h2 className="text-xl font-bold">15. Submission</h2>
                        <p>
                            {c.submission ??
                                'Upload every requested deliverable with a reflection on accuracy, accessibility and testing.'}
                        </p>
                        <p>
                            Allowed:{' '}
                            {c.allowed_uploads.map((e) => `.${e}`).join(', ')}.
                            Up to 8 files, 10 MB each. Uploaded macros are never
                            executed by CodeLab. Keep Office security
                            protections enabled.
                        </p>
                        <label className="block font-semibold">
                            Reflection and verification notes
                            <textarea
                                className="mt-2 min-h-36 w-full rounded border p-3 font-normal"
                                value={notes}
                                disabled={readOnly}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </label>
                        <label className="block">
                            Attach practice files
                            <input
                                ref={fileInput}
                                className="mt-2 block max-w-full"
                                type="file"
                                multiple
                                accept={c.allowed_uploads
                                    .map((e) => `.${e}`)
                                    .join(',')}
                                disabled={readOnly}
                                onChange={(e) =>
                                    setUploads(Array.from(e.target.files ?? []))
                                }
                            />
                        </label>
                        <div className="flex flex-wrap gap-3">
                            <Button
                                variant="outline"
                                disabled={readOnly || busy}
                                onClick={() => void save(false)}
                            >
                                Save draft
                            </Button>
                            <Button
                                disabled={readOnly || busy}
                                onClick={() => void save(true)}
                            >
                                Submit {isCase ? 'case study' : 'exercise'}
                            </Button>
                        </div>
                        {status === 'completed' && (
                            <p className="font-semibold text-emerald-800">
                                Great work. You are ready for the next lesson.
                            </p>
                        )}
                        <ApplicationEvidence workspace={workspace} />
                        {latestSubmission?.reviewed_at &&
                            latestSubmission.rubric_scores && (
                                <p className="font-bold">
                                    Teacher score:{' '}
                                    {Object.values(
                                        latestSubmission.rubric_scores,
                                    ).reduce((sum, value) => sum + value, 0)}
                                    /100
                                </p>
                            )}
                        {!readOnly &&
                            (workspace.files ?? []).map((file) => (
                                <Button
                                    key={file.id}
                                    variant="outline"
                                    onClick={() =>
                                        setWorkspace((old) => ({
                                            ...old,
                                            files: (old.files ?? []).filter(
                                                (item) => item.id !== file.id,
                                            ),
                                        }))
                                    }
                                >
                                    Remove {file.name} from this draft
                                </Button>
                            ))}
                        {latestSubmission?.feedback.map((f) => (
                            <p className="rounded border p-3" key={f.id}>
                                Teacher feedback: {f.comment}
                            </p>
                        ))}
                    </section>
                    <p
                        className="sticky bottom-2 rounded-xl border bg-indigo-50 p-4 shadow-sm"
                        role="status"
                        aria-live="polite"
                    >
                        {busy
                            ? 'Saving…'
                            : message ||
                              `Read, practice in ${c.application ?? 'Microsoft Word'}, verify, and submit your saved file.`}
                    </p>
                    <section className="space-y-3 rounded-xl border bg-white p-5">
                        <h2 className="text-xl font-bold">16. Next Lesson</h2>
                        {nextLesson &&
                            (nextLesson.unlocked ? (
                                <Link
                                    className="block font-semibold underline"
                                    href={`/code-lab/${nextLesson.id}`}
                                >
                                    {nextLesson.title} →
                                </Link>
                            ) : (
                                <p>
                                    🔒 {nextLesson.title} — finish this lesson’s
                                    checkpoints to unlock.
                                </p>
                            ))}
                        <h3 className="font-bold">Module case studies</h3>
                        {caseStudies.map((item) =>
                            item.unlocked ? (
                                <Link
                                    className="block underline"
                                    key={item.id}
                                    href={`/application-case-studies/${item.id}`}
                                >
                                    {item.title}
                                </Link>
                            ) : (
                                <p key={item.id}>
                                    🔒 {item.title} — complete its five module
                                    lessons.
                                </p>
                            ),
                        )}
                        {c.sources?.map((source) => (
                            <a
                                className="block text-sm underline"
                                key={source.url}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {source.title}
                            </a>
                        ))}
                    </section>
                </div>
            </main>
        </>
    );
}
ApplicationLesson.layout = {
    breadcrumbs: [{ title: 'Courses', href: '/courses' }],
};

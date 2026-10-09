import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Pagination from '@/components/platform/pagination';
import type { Pagination as Page } from '@/types/platform';

type Response = {
    id: number;
    answer?: string;
    file_path?: string;
    status: string;
    score?: number;
    feedback?: string;
    student?: { name: string };
};
type Activity = {
    locked?: boolean;
    id: number;
    title: string;
    instructions: string;
    points: number;
    lesson: { title: string };
    responses: Response[];
};
function ActivityItem({
    activity,
    isManager,
}: {
    activity: Activity;
    isManager: boolean;
}) {
    const [answer, setAnswer] = useState(activity.responses[0]?.answer ?? '');
    const [file, setFile] = useState<File | null>(null);
    const [busy, setBusy] = useState(false);
    return (
        <article className="space-y-4 rounded-2xl border p-6">
            <header>
                <p className="text-xs text-muted-foreground">
                    {activity.lesson.title}
                </p>
                <h2 className="mt-2 text-xl font-bold">{activity.title}</h2>
                <p className="mt-2 text-sm leading-7 whitespace-pre-wrap">
                    {activity.instructions}
                </p>
            </header>
            {activity.locked ? (
                <p className="text-sm text-muted-foreground">
                    Locked until the lesson is available.
                </p>
            ) : isManager ? (
                activity.responses.map((response) => (
                    <Review
                        key={response.id}
                        response={response}
                        points={activity.points}
                    />
                ))
            ) : (
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        setBusy(true);
                        router.post(
                            '/activities/' + activity.id + '/submit',
                            { answer, file },
                            {
                                forceFormData: true,
                                preserveScroll: true,
                                onFinish: () => setBusy(false),
                            },
                        );
                    }}
                    className="space-y-3"
                >
                    <label className="block text-sm">
                        Your answer
                        <textarea
                            className="mt-2 block w-full rounded-lg border p-3"
                            rows={5}
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            disabled={
                                activity.responses[0]?.status === 'completed'
                            }
                        />
                    </label>
                    <label className="block text-sm">
                        Optional file (PDF, text, ZIP or image; up to 5 MB)
                        <input
                            type="file"
                            accept=".pdf,.txt,.zip,.png,.jpg,.jpeg"
                            className="mt-2 block w-full text-sm"
                            onChange={(e) =>
                                setFile(e.target.files?.[0] ?? null)
                            }
                        />
                    </label>
                    <Button
                        type="submit"
                        disabled={
                            busy ||
                            activity.responses[0]?.status === 'completed'
                        }
                    >
                        {busy ? 'Submitting…' : 'Submit activity'}
                    </Button>
                    {activity.responses[0] && (
                        <p className="text-sm text-muted-foreground">
                            {activity.responses[0].status} ·{' '}
                            {activity.responses[0].feedback}
                        </p>
                    )}
                </form>
            )}
        </article>
    );
}
function Review({ response, points }: { response: Response; points: number }) {
    const [score, setScore] = useState(response.score ?? 0);
    const [feedback, setFeedback] = useState(response.feedback ?? '');
    return (
        <div className="space-y-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
            <p className="font-medium">
                {response.student?.name} · {response.status}
            </p>
            <pre className="text-sm whitespace-pre-wrap">{response.answer}</pre>
            {response.file_path && (
                <a
                    className="text-sm text-indigo-600"
                    href={'/activity-files/' + response.id}
                >
                    Download attachment
                </a>
            )}
            <label className="block text-sm">
                Score (out of {points})
                <input
                    className="ml-3 w-20 rounded border p-2"
                    type="number"
                    min={0}
                    max={points}
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                />
            </label>
            <label className="block text-sm">
                Feedback
                <textarea
                    className="mt-2 block w-full rounded-lg border p-2"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                />
            </label>
            <div className="flex gap-2">
                <Button
                    size="sm"
                    onClick={() =>
                        router.post(
                            '/activity-responses/' + response.id + '/review',
                            { status: 'completed', score, feedback },
                            { preserveScroll: true },
                        )
                    }
                >
                    Complete
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                        router.post(
                            '/activity-responses/' + response.id + '/review',
                            { status: 'needs_revision', score, feedback },
                            { preserveScroll: true },
                        )
                    }
                >
                    Request revision
                </Button>
            </div>
        </div>
    );
}
export default function Activities({
    activities,
    isManager,
}: {
    activities: Page<Activity>;
    isManager: boolean;
}) {
    return (
        <>
            <Head title="Activities" />
            <main className="space-y-6 p-5 sm:p-8">
                <header>
                    <h1 className="text-3xl font-bold">Activities</h1>
                    <p className="mt-2 text-muted-foreground">
                        {isManager
                            ? 'Review submitted answers and provide feedback.'
                            : 'Practice what you learned. Your teacher will review your answers.'}
                    </p>
                </header>
                {activities.data.map((activity) => (
                    <ActivityItem
                        key={activity.id}
                        activity={activity}
                        isManager={isManager}
                    />
                ))}
                {!activities.data.length && (
                    <p className="rounded-xl border p-6 text-muted-foreground">
                        No additional activities have been published. Course
                        lessons still contain their original coding activities.
                    </p>
                )}
                <Pagination links={activities.links} />
            </main>
        </>
    );
}

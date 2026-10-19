import { Form, Head, Link } from '@inertiajs/react';
import ApplicationEvidence, {
    type ApplicationWorkspace,
} from '@/components/application-evidence';
import { Button } from '@/components/ui/button';
type Submission = {
    id: number;
    version: number;
    status: string;
    user: { name: string };
    application_workspace: ApplicationWorkspace;
    lesson?: { title: string };
    case_study?: { title: string; rubric: Record<string, number> };
    rubric_scores?: Record<string, number>;
    feedback: { id: number; comment: string }[];
};
export default function ApplicationReview({
    submission,
}: {
    submission: Submission;
}) {
    return (
        <>
            <Head title="Document review" />
            <main className="mx-auto max-w-4xl space-y-5 p-5">
                <Link className="underline" href="/submissions">
                    ← Submissions
                </Link>
                <h1 className="text-3xl font-bold">
                    {submission.lesson?.title ?? submission.case_study?.title}
                </h1>
                <p>
                    {submission.user.name} · Version {submission.version} ·{' '}
                    {submission.status}
                </p>
                <ApplicationEvidence
                    workspace={submission.application_workspace}
                />
                <Form
                    className="space-y-4 rounded-xl border bg-white p-5"
                    action={`/submissions/${submission.id}/review`}
                    method="post"
                >
                    {({ errors }) => (
                        <>
                            <h2 className="text-xl font-bold">
                                Teacher review
                            </h2>
                            {submission.lesson && (
                                <label className="block">
                                    Exercise score / 100 (optional)
                                    <input
                                        type="number"
                                        name="exercise_score"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        className="ml-3 rounded border p-2"
                                        defaultValue={
                                            submission.rubric_scores?.[
                                                'Practical Exercise'
                                            ] ?? ''
                                        }
                                    />
                                </label>
                            )}
                            {Object.entries(
                                submission.case_study?.rubric ?? {},
                            ).map(([name, max]) => (
                                <label className="block" key={name}>
                                    {name} / {max}
                                    <input
                                        className="ml-3 rounded border p-2"
                                        type="number"
                                        min="0"
                                        max={max}
                                        step="1"
                                        name={`rubric_scores[${name}]`}
                                        defaultValue={
                                            submission.rubric_scores?.[name] ??
                                            0
                                        }
                                    />
                                </label>
                            ))}
                            <label className="block">
                                Decision
                                <select
                                    className="ml-3 rounded border p-2"
                                    name="status"
                                >
                                    <option value="completed">Completed</option>
                                    <option value="needs_revision">
                                        Needs revision
                                    </option>
                                </select>
                            </label>
                            <label className="block">
                                Feedback
                                <textarea
                                    className="mt-2 min-h-32 w-full rounded border p-3"
                                    name="comment"
                                />
                            </label>
                            <p className="text-red-700">
                                {Object.values(errors).join(' ')}
                            </p>
                            <Button>Save review</Button>
                        </>
                    )}
                </Form>
                {submission.feedback.map((f) => (
                    <p key={f.id}>{f.comment}</p>
                ))}
            </main>
        </>
    );
}
ApplicationReview.layout = {
    breadcrumbs: [{ title: 'Submissions', href: '/submissions' }],
};

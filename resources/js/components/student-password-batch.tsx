import { Download, KeyRound } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type SelectedStudent = { id: number; name: string; username: string };
type Batch = {
    credentials: (SelectedStudent & { password: string })[];
    download_url: string;
    expires_at: string;
};

const csrf = () =>
    decodeURIComponent(
        document.cookie
            .split('; ')
            .find((value) => value.startsWith('XSRF-TOKEN='))
            ?.slice(11) ?? '',
    );
async function responseError(response: Response): Promise<Error> {
    const body = await response.json().catch(() => ({}));
    return new Error(
        Object.values(body.errors ?? {})
            .flat()
            .join(' ') ||
            body.message ||
            'The request failed. Refresh the page and try again.',
    );
}

export default function StudentPasswordBatch({
    selected,
    onClear,
    onBusyChange,
}: {
    selected: SelectedStudent[];
    onClear: () => void;
    onBusyChange: (busy: boolean) => void;
}) {
    const [batch, setBatch] = useState<Batch | null>(null);
    const [generating, setGenerating] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const generate = async () => {
        setGenerating(true);
        onBusyChange(true);
        setError('');
        setMessage('');
        try {
            const response = await fetch('/students/password-batches', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': csrf(),
                },
                body: JSON.stringify({
                    student_ids: selected.map((student) => student.id),
                }),
            });
            if (!response.ok) throw await responseError(response);
            const result: Batch = await response.json();
            setBatch(result);
            setMessage(
                `Generated temporary passwords for ${result.credentials.length} selected students. All unselected accounts were left unchanged.`,
            );
            onClear();
        } catch (error) {
            setError((error as Error).message);
        } finally {
            setGenerating(false);
            onBusyChange(false);
        }
    };
    const download = async () => {
        if (!batch) return;
        setDownloading(true);
        setError('');
        try {
            const response = await fetch(batch.download_url, {
                headers: { Accept: 'application/json' },
            });
            if (!response.ok) throw await responseError(response);
            if (
                !response.headers
                    .get('content-type')
                    ?.includes('application/pdf')
            )
                throw new Error('The PDF could not be created. Try again.');
            const url = URL.createObjectURL(await response.blob());
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = 'student-passwords.pdf';
            anchor.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (error) {
            setError((error as Error).message);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Generate temporary passwords</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    Check students in the list below, then generate a
                    six-character temporary password for each selected student.
                    Their current passwords will be replaced and they will be
                    signed out. They must choose a new password after signing
                    in.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                    <strong>{selected.length} selected</strong>
                    <Button
                        type="button"
                        onClick={generate}
                        disabled={!selected.length || generating}
                    >
                        <KeyRound />
                        {generating
                            ? 'Generating…'
                            : `Generate temporary passwords (${selected.length})`}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClear}
                        disabled={!selected.length || generating}
                    >
                        Clear selection
                    </Button>
                </div>
                {selected.length > 0 && (
                    <details>
                        <summary className="cursor-pointer text-sm font-semibold">
                            Review selected students
                        </summary>
                        <ul className="mt-2 list-disc pl-6 text-sm">
                            {selected.map((student) => (
                                <li key={student.id}>
                                    {student.name} (@{student.username})
                                </li>
                            ))}
                        </ul>
                    </details>
                )}
                <p className="text-xs text-muted-foreground">
                    Select up to 100 students. Selection stays checked when
                    searching or changing pages. Select all applies only to the
                    current page.
                </p>
                {error && (
                    <p
                        role="alert"
                        className="text-sm text-red-600 dark:text-red-400"
                    >
                        {error}
                    </p>
                )}
                {message && (
                    <p role="status" className="text-sm font-semibold">
                        {message}
                    </p>
                )}
                {batch && (
                    <section
                        className="space-y-3 border-t pt-4"
                        aria-label="Generated student password list"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h3 className="font-semibold">
                                Generated password list (
                                {batch.credentials.length})
                            </h3>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={download}
                                disabled={downloading || generating}
                            >
                                <Download />
                                {downloading
                                    ? 'Preparing PDF…'
                                    : 'Download PDF'}
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Download within 30 minutes and before leaving this
                            page. Share each login privately with its student.
                            This list contains the most recently generated batch
                            only.
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="p-3">Name</th>
                                        <th className="p-3">Username</th>
                                        <th className="p-3">Password</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {batch.credentials.map((student) => (
                                        <tr
                                            key={student.id}
                                            className="border-b last:border-0"
                                        >
                                            <td className="p-3">
                                                {student.name}
                                            </td>
                                            <td className="p-3">
                                                {student.username}
                                            </td>
                                            <td className="p-3">
                                                <code className="font-semibold">
                                                    {student.password}
                                                </code>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
            </CardContent>
        </Card>
    );
}

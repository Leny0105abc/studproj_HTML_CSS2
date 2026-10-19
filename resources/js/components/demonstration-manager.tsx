import { router } from '@inertiajs/react';
import { useState } from 'react';
import type { Demonstration } from '@/components/lesson-demonstration';
import { Button } from '@/components/ui/button';
export default function DemonstrationManager({
    lessonId,
    demonstrations,
}: {
    lessonId: number;
    demonstrations: Demonstration[];
}) {
    const [selected, setSelected] = useState('new');
    const demo = demonstrations.find((d) => String(d.id) === selected);
    const [message, setMessage] = useState('');
    return (
        <details className="rounded-xl border bg-white p-5">
            <summary className="cursor-pointer text-lg font-bold">
                Manage demonstrations
            </summary>
            <label className="mt-3 block">
                Choose demonstration
                <select
                    className="block w-full rounded border p-2"
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                >
                    <option value="new">Add demonstration</option>
                    {demonstrations.map((d) => (
                        <option key={d.id} value={d.id}>
                            {d.title} ({d.status})
                        </option>
                    ))}
                </select>
            </label>
            <form
                key={selected}
                className="mt-4 space-y-3"
                onSubmit={(event) => {
                    event.preventDefault();
                    const data = new FormData(event.currentTarget);
                    router.post(
                        `/application-lessons/${lessonId}/demonstrations/${demo?.id ?? ''}`,
                        data,
                        {
                            preserveScroll: true,
                            onSuccess: () =>
                                setMessage(
                                    'Demonstration saved. Refresh the preview to inspect it.',
                                ),
                            onError: (errors) =>
                                setMessage(Object.values(errors).join(' ')),
                        },
                    );
                }}
            >
                <label className="block">
                    Title
                    <input
                        className="block w-full rounded border p-2"
                        name="title"
                        defaultValue={demo?.title}
                        required
                    />
                </label>
                <label className="block">
                    Description
                    <textarea
                        className="block w-full rounded border p-2"
                        name="description"
                        defaultValue={demo?.description}
                        required
                    />
                </label>
                <label className="block">
                    Media type
                    <select
                        className="block rounded border p-2"
                        name="media_type"
                        defaultValue={demo?.media_type ?? 'interactive_demo'}
                    >
                        <option value="interactive_demo">
                            Guided simulation
                        </option>
                        <option value="step_sequence">
                            Numbered step sequence
                        </option>
                        <option value="video">Video</option>
                        <option value="animated_image">Animated image</option>
                    </select>
                </label>
                <label className="block">
                    Upload or replace media (optional)
                    <input
                        type="file"
                        name="media"
                        accept=".mp4,.webm,.gif,.webp,.png,.jpg,.jpeg"
                    />
                </label>
                <p className="text-sm">
                    Keep existing media by leaving the file empty. Maximum 20
                    MB. Include equivalent instructions and transcript.
                </p>
                <label className="block">
                    Numbered steps and simulation frames (JSON)
                    <textarea
                        className="min-h-48 w-full rounded border p-2 font-mono text-sm"
                        name="steps"
                        required
                        defaultValue={JSON.stringify(
                            demo?.steps ?? [
                                {
                                    caption: 'Before: inspect the document.',
                                    command: 'Document area',
                                    effect: 'normal',
                                },
                                {
                                    caption:
                                        'Apply the command and inspect the result.',
                                    command: 'Home > Font > Bold',
                                    effect: 'bold',
                                },
                            ],
                            null,
                            2,
                        )}
                    />
                </label>
                <label className="block">
                    Transcript
                    <textarea
                        className="block w-full rounded border p-2"
                        name="transcript"
                        defaultValue={demo?.transcript}
                    />
                </label>
                <label className="block">
                    Display order
                    <input
                        className="ml-3 rounded border p-2"
                        type="number"
                        name="display_order"
                        min="1"
                        max="100"
                        defaultValue={
                            demo?.display_order ?? demonstrations.length + 1
                        }
                    />
                </label>
                <label className="block">
                    Required
                    <select
                        className="ml-3 rounded border p-2"
                        name="is_required"
                        defaultValue={demo?.is_required === false ? '0' : '1'}
                    >
                        <option value="1">Required</option>
                        <option value="0">Optional</option>
                    </select>
                </label>
                <label className="block">
                    Status
                    <select
                        className="ml-3 rounded border p-2"
                        name="status"
                        defaultValue={demo?.status ?? 'published'}
                    >
                        <option value="published">Published</option>
                        <option value="draft">Draft / hidden</option>
                    </select>
                </label>
                <Button type="submit">Save demonstration</Button>
                <p role="status">{message}</p>
            </form>
        </details>
    );
}

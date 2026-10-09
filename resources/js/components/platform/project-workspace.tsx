import { Head, Link, router } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import CodePlayground from '@/components/platform/code-playground';
import { Button } from '@/components/ui/button';
import type { Course } from '@/types/platform';

export default function ProjectWorkspace({
    project,
    workspace,
}: {
    project: {
        id: number;
        title: string;
        scenario: string;
        instructions: string;
        requirements: string[];
        course: Course;
    };
    workspace: { html_code: string; version: number };
}) {
    const [source, setSource] = useState(workspace.html_code ?? '');
    const version = useRef(workspace.version);
    const [busy, setBusy] = useState(false);
    const save = async () => {
        setBusy(true);
        try {
            const response = await fetch(
                '/case-studies/' + project.id + '/save',
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN':
                            document.querySelector<HTMLMetaElement>(
                                'meta[name="csrf-token"]',
                            )?.content ?? '',
                    },
                    body: JSON.stringify({
                        html_code: source,
                        css_code: '',
                        version: version.current,
                    }),
                },
            );
            const data = await response.json();
            if (!response.ok)
                throw new Error(data.message ?? 'Unable to save.');
            version.current = data.version;
            toast.success('Project saved');
            return true;
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Unable to save. Check your connection.',
            );
            return false;
        } finally {
            setBusy(false);
        }
    };
    return (
        <>
            <Head title={project.title} />
            <main className="mx-auto max-w-6xl space-y-6 p-5 sm:p-8">
                <Link
                    className="text-sm text-indigo-600"
                    href={'/courses/' + project.course.slug}
                >
                    ← {project.course.name}
                </Link>
                <h1 className="text-3xl font-bold">{project.title}</h1>
                <p className="leading-7">{project.scenario}</p>
                <p className="text-sm leading-7 whitespace-pre-wrap">
                    {project.instructions}
                </p>
                <ul className="list-disc pl-5">
                    {project.requirements.map((r, i) => (
                        <li key={i}>{r}</li>
                    ))}
                </ul>
                <CodePlayground
                    editorType={project.course.editor_type}
                    provider={project.course.execution_provider ?? 'none'}
                    source={source}
                    onChange={setSource}
                />
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() => void save()}
                    >
                        Save
                    </Button>
                    <Button
                        disabled={busy}
                        onClick={async () => {
                            if (await save())
                                router.post(
                                    '/case-studies/' + project.id + '/submit',
                                    {
                                        html_code: source,
                                        css_code: '',
                                        version: version.current,
                                    },
                                );
                        }}
                    >
                        Submit project
                    </Button>
                </div>
            </main>
        </>
    );
}

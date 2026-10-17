import { Button } from '@/components/ui/button';

export function safeScratchUrl(url?: string | null) {
    return url &&
        /^https:\/\/scratch\.mit\.edu\/projects\/[1-9][0-9]{0,19}\/?$/.test(url)
        ? url
        : null;
}
export default function ScratchProject({
    url,
    notes,
}: {
    url?: string | null;
    notes?: string | null;
}) {
    const safeUrl = safeScratchUrl(url);
    return (
        <section className="space-y-4 rounded-xl border p-5">
            <h2 className="text-xl font-semibold">Scratch project</h2>
            {safeUrl ? (
                <Button asChild>
                    <a
                        href={safeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        referrerPolicy="no-referrer"
                    >
                        Open Scratch Project ↗
                    </a>
                </Button>
            ) : (
                <p>No project link saved yet.</p>
            )}
            <p className="whitespace-pre-wrap">
                {notes || 'No project notes yet.'}
            </p>
            <p className="text-sm text-muted-foreground">
                Projects open on Scratch. Review their blocks and behavior
                there. A project link can change after submission; it is not an
                immutable project-file snapshot.
            </p>
        </section>
    );
}

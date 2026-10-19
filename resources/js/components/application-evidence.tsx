export type DocumentFile = {
    id: string;
    name: string;
    mime: string;
    size: number;
};
export type ApplicationWorkspace = {
    notes?: string;
    files?: DocumentFile[];
    mastery?: boolean[];
    content_viewed?: boolean;
    demonstrations_viewed?: number[];
};
export default function ApplicationEvidence({
    workspace,
}: {
    workspace: ApplicationWorkspace;
}) {
    return (
        <section className="space-y-4 rounded-xl border bg-white p-5">
            <h2 className="text-xl font-bold">Document submission</h2>
            <p className="whitespace-pre-wrap">{workspace.notes}</p>
            <ul className="space-y-3">
                {(workspace.files ?? []).map((file) => (
                    <li key={file.id}>
                        <a
                            className="font-semibold break-all underline"
                            href={`/application-evidence/${file.id}`}
                        >
                            {file.name}
                        </a>{' '}
                        · {Math.ceil(file.size / 1024)} KiB
                    </li>
                ))}
            </ul>
            <p>
                Files are private downloads. CodeLab does not execute Office
                macros or verify document formatting automatically. Review only
                trusted practice documents; keep Office security protections
                enabled.
            </p>
        </section>
    );
}

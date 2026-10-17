export type EvidenceFile = {
    id: string;
    name: string;
    mime: string;
    size: number;
};
export type WordpressDetails = {
    wordpress_practice_url?: string | null;
    wordpress_project_url?: string | null;
    wordpress_environment?: string | null;
    wordpress_notes?: string | null;
    wordpress_evidence?: EvidenceFile[] | null;
};
export default function WordpressEvidence({
    details,
}: {
    details: WordpressDetails;
}) {
    return (
        <section className="space-y-4 rounded-xl border bg-white p-5">
            <h2 className="text-xl font-semibold">
                WordPress practical evidence
            </h2>
            <p>
                Work was performed in an external authorized WordPress
                environment. CodeLab does not provision or inspect that site
                automatically. Review links and evidence without requesting
                credentials.
            </p>
            {(['wordpress_practice_url', 'wordpress_project_url'] as const).map(
                (field) =>
                    details[field] ? (
                        <p key={field} className="break-all">
                            <strong>
                                {field === 'wordpress_practice_url'
                                    ? 'Practice site'
                                    : 'Project'}
                                :{' '}
                            </strong>
                            <a
                                className="underline"
                                href={details[field]!}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {details[field]}
                            </a>
                        </p>
                    ) : null,
            )}
            <h3 className="font-semibold">Environment description</h3>
            <p className="whitespace-pre-wrap">
                {details.wordpress_environment || 'Not provided'}
            </p>
            <h3 className="font-semibold">Report and test results</h3>
            <p className="whitespace-pre-wrap">
                {details.wordpress_notes || 'Not provided'}
            </p>
            <h3 className="font-semibold">
                Private screenshots / PDF documentation
            </h3>
            <ul className="space-y-2">
                {(details.wordpress_evidence ?? []).map((file) => (
                    <li key={file.id}>
                        <a
                            className="underline"
                            href={`/wordpress-evidence/${file.id}`}
                        >
                            {file.name}
                        </a>{' '}
                        · {Math.ceil(file.size / 1024)} KiB
                    </li>
                ))}
            </ul>
        </section>
    );
}

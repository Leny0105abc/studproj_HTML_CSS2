import { Link } from '@inertiajs/react';

export default function Pagination({
    links,
}: {
    links: { url: string | null; label: string; active: boolean }[];
}) {
    return (
        <nav aria-label="Pagination" className="mt-6 flex flex-wrap gap-2">
            {links.map((link, index) =>
                link.url ? (
                    <Link
                        key={index}
                        href={link.url}
                        className={
                            'rounded-lg border px-3 py-2 text-sm ' +
                            (link.active
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white dark:bg-slate-900')
                        }
                    >
                        {link.label.replace(/&laquo;|&raquo;/g, '').trim()}
                    </Link>
                ) : (
                    <span
                        key={index}
                        className="rounded-lg border px-3 py-2 text-sm text-muted-foreground"
                    >
                        {link.label.replace(/&laquo;|&raquo;/g, '').trim()}
                    </span>
                ),
            )}
        </nav>
    );
}

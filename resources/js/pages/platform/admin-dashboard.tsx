import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

export default function AdminDashboard({
    stats,
    programs,
    audit,
}: {
    stats: Record<string, number>;
    programs: { name: string; students: number; courses: number }[];
    audit: {
        id: number;
        event: string;
        user: { name: string };
        occurred_at: string;
    }[];
}) {
    return (
        <>
            <Head title="CodeLab administration" />
            <main className="space-y-7 p-5 sm:p-8">
                <header className="rounded-3xl bg-slate-950 p-7 text-white">
                    <p className="text-sm text-indigo-200">
                        CodeLab administration
                    </p>
                    <h1 className="mt-2 text-3xl font-bold">
                        Build the next learning path.
                    </h1>
                    <p className="mt-3 text-slate-300">
                        Manage programs, courses, content and student access in
                        one platform.
                    </p>
                    <div className="mt-5 flex gap-3">
                        <Button asChild>
                            <Link href="/admin/courses">Manage courses</Link>
                        </Button>
                        <Button asChild variant="secondary">
                            <Link href="/admin/lessons">Manage lessons</Link>
                        </Button>
                    </div>
                </header>
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {Object.entries(stats).map(([name, value]) => (
                        <article key={name} className="rounded-2xl border p-5">
                            <p className="text-sm text-muted-foreground">
                                {name}
                            </p>
                            <p className="mt-2 text-3xl font-bold">{value}</p>
                        </article>
                    ))}
                </section>
                <section className="grid gap-5 md:grid-cols-2">
                    {programs.map((p) => (
                        <article
                            key={p.name}
                            className="rounded-2xl border p-6"
                        >
                            <h2 className="text-xl font-bold">{p.name}</h2>
                            <p className="mt-3 text-muted-foreground">
                                {p.students} students · {p.courses} courses
                            </p>
                        </article>
                    ))}
                </section>
                <section className="rounded-2xl border p-6">
                    <div className="mb-4 flex justify-between">
                        <h2 className="text-xl font-bold">
                            Recent administration activity
                        </h2>
                        <Link
                            className="text-sm text-indigo-600"
                            href="/admin/audit-log"
                        >
                            Audit log →
                        </Link>
                    </div>
                    <ul className="divide-y">
                        {audit.map((row) => (
                            <li key={row.id} className="py-3 text-sm">
                                <strong>{row.user?.name}</strong> ·{' '}
                                {row.event.replaceAll('_', ' ')}
                                <span className="ml-2 text-muted-foreground">
                                    {new Date(row.occurred_at).toLocaleString()}
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>
            </main>
        </>
    );
}

import { Head, Link, usePage } from '@inertiajs/react';
import CourseCard from '@/components/platform/course-card';
import { Button } from '@/components/ui/button';
import type { CourseCard as CourseData } from '@/types/platform';

type Review = {
    id: number;
    lesson?: { title: string } | null;
    comment?: string | null;
    status: string;
};
export default function StudentDashboard({
    courses = [],
    program,
    reviews = [],
}: {
    courses?: CourseData[];
    program?: string;
    reviews?: Review[];
}) {
    const { auth } = usePage().props;
    const active = courses.filter((c) => c.status === 'published');
    const completed = active.reduce((sum, c) => sum + c.completed, 0);
    const next = active.find((c) => c.nextLesson);
    return (
        <>
            <Head title="Learning dashboard" />
            <main className="space-y-7 p-5 sm:p-8">
                <header className="rounded-3xl bg-gradient-to-br from-indigo-700 to-slate-950 p-7 text-white">
                    <p className="text-sm text-indigo-200">
                        {program ?? 'Your learning program'}
                    </p>
                    <h1 className="mt-3 text-3xl font-bold">
                        Welcome, {auth.user.name}.
                    </h1>
                    <p className="mt-3 text-indigo-100">
                        Learn. Code. Practice. Build. Your next step starts
                        here.
                    </p>
                    <Button
                        asChild
                        className="mt-6 bg-white text-indigo-800 hover:bg-indigo-50"
                    >
                        <Link
                            href={
                                next ? '/courses/' + next.slug : '/my-courses'
                            }
                        >
                            {next
                                ? 'Continue: ' + next.nextLesson?.title
                                : 'Explore my courses'}
                        </Link>
                    </Button>
                </header>
                <section className="grid gap-4 sm:grid-cols-3">
                    {[
                        ['Available courses', active.length],
                        ['Completed lessons', completed],
                        [
                            'Completed courses',
                            active.filter(
                                (c) => c.total > 0 && c.completed === c.total,
                            ).length,
                        ],
                    ].map(([title, value]) => (
                        <article
                            key={String(title)}
                            className="rounded-2xl border bg-white p-5 dark:bg-slate-900"
                        >
                            <p className="text-sm text-muted-foreground">
                                {title}
                            </p>
                            <p className="mt-2 text-3xl font-bold">{value}</p>
                        </article>
                    ))}
                </section>
                <section>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-bold">My courses</h2>
                        <Link
                            href="/my-courses"
                            className="text-sm text-indigo-600"
                        >
                            View all →
                        </Link>
                    </div>
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {courses.map((course) => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>
                </section>
                {reviews.length > 0 && (
                    <section className="rounded-2xl border p-5">
                        <h2 className="mb-4 text-xl font-bold">
                            Teacher feedback
                        </h2>
                        <ul className="space-y-4">
                            {reviews.map((review) => (
                                <li key={review.id}>
                                    <p className="font-medium">
                                        {review.lesson?.title}
                                    </p>
                                    <p className="text-sm text-muted-foreground capitalize">
                                        {review.status.replaceAll('_', ' ')} ·{' '}
                                        {review.comment ??
                                            'Open your lesson to read the teacher feedback.'}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </main>
        </>
    );
}

import { Head, Link, router } from '@inertiajs/react';
import { BookOpen, Search } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Pagination from '@/components/platform/pagination';
import type { Course, Program, Pagination as Page } from '@/types/platform';

export default function Courses({
    courses,
    programs,
    program,
    search = '',
}: {
    courses: Page<Course>;
    programs: Program[];
    program?: Program | null;
    search?: string;
}) {
    const [query, setQuery] = useState(search);
    const path = program ? '/programs/' + program.slug : '/courses';
    return (
        <>
            <Head
                title={program ? program.name + ' Program' : 'Explore courses'}
            />
            <main className="mx-auto max-w-6xl space-y-8 p-5 sm:p-8">
                <header>
                    <p className="text-sm font-semibold tracking-widest text-indigo-600 uppercase">
                        CodeLab · Learn. Code. Practice. Build.
                    </p>
                    <h1 className="mt-3 text-3xl font-bold">
                        {program
                            ? program.name + ' Program'
                            : 'Explore courses'}
                    </h1>
                    <p className="mt-3 text-muted-foreground">
                        {program?.description ??
                            'Find a clear learning path for your education level.'}
                    </p>
                </header>
                <nav aria-label="Programs" className="flex flex-wrap gap-2">
                    <Button asChild variant={!program ? 'default' : 'outline'}>
                        <Link href="/courses">All available courses</Link>
                    </Button>
                    {programs.map((p) => (
                        <Button
                            key={p.id}
                            asChild
                            variant={
                                program?.id === p.id ? 'default' : 'outline'
                            }
                        >
                            <Link href={'/programs/' + p.slug}>{p.name}</Link>
                        </Button>
                    ))}
                </nav>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        router.get(
                            path,
                            { search: query },
                            { preserveState: true },
                        );
                    }}
                    className="flex max-w-lg gap-2"
                >
                    <label className="sr-only" htmlFor="course-search">
                        Search courses
                    </label>
                    <input
                        id="course-search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search courses"
                        className="min-w-0 flex-1 rounded-lg border px-3 py-2"
                    />
                    <Button type="submit">
                        <Search className="size-4" />
                        <span className="sr-only">Search</span>
                    </Button>
                </form>
                <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {courses.data.map((course) => (
                        <article
                            key={course.id}
                            className="flex flex-col rounded-2xl border bg-white p-6 shadow-sm dark:bg-slate-900"
                        >
                            <BookOpen className="mb-5 size-8 text-indigo-600" />
                            <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                {course.education_levels
                                    ?.map((l) => l.name)
                                    .join(' · ')}
                            </p>
                            <h2 className="mt-2 text-xl font-bold">
                                {course.name}
                            </h2>
                            <p className="my-3 flex-1 text-sm leading-6 text-muted-foreground">
                                {course.short_description}
                            </p>
                            <div className="mb-5 flex gap-2">
                                <Badge variant="secondary">
                                    {course.difficulty}
                                </Badge>
                                <Badge variant="outline">
                                    {course.status === 'published'
                                        ? course.lessons_count + ' lessons'
                                        : 'Coming soon'}
                                </Badge>
                            </div>
                            {course.status === 'published' ? (
                                <Button asChild variant="outline">
                                    <Link href={'/courses/' + course.slug}>
                                        View course
                                    </Link>
                                </Button>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Course content is being prepared.
                                </p>
                            )}
                        </article>
                    ))}
                </section>
                {!courses.data.length && (
                    <p className="rounded-xl border p-8 text-muted-foreground">
                        No courses match this search. More courses are being
                        prepared for this program.
                    </p>
                )}
                <Pagination links={courses.links} />
            </main>
        </>
    );
}

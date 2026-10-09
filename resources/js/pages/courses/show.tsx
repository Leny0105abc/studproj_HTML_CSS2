import { Head, Link } from '@inertiajs/react';
import { CheckCircle2, Lock, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Course } from '@/types/platform';

type Lesson = {
    id: number;
    title: string;
    module_id: number | null;
    status: string;
    unlocked: boolean;
    url: string;
    estimated_minutes?: number;
};
export default function CourseShow({
    course,
    lessons,
    completed,
    projects,
    canManage,
}: {
    course: Course;
    lessons: Lesson[];
    completed: number;
    projects: { id: number; title: string; scenario: string }[];
    canManage: boolean;
}) {
    const next = lessons.find((l) => l.status !== 'completed' && l.unlocked);
    const groups = [
        ...(course.levels ?? []).filter((l) => l.status === 'published'),
        ...(lessons.some((l) => !l.module_id)
            ? [{ id: 0, name: 'Lessons', status: 'published' }]
            : []),
    ];
    return (
        <>
            <Head title={course.name} />
            <main className="mx-auto max-w-5xl space-y-7 p-5 sm:p-8">
                <Link href="/my-courses" className="text-sm text-indigo-600">
                    ← My courses
                </Link>
                <header className="rounded-3xl bg-slate-950 p-7 text-white">
                    <p className="text-sm text-indigo-200">
                        {course.education_levels
                            ?.map((l) => l.name)
                            .join(' · ')}
                    </p>
                    <h1 className="mt-2 text-3xl font-bold">{course.name}</h1>
                    <p className="mt-3 max-w-2xl leading-7 text-slate-300">
                        {course.description || course.short_description}
                    </p>
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                        <Badge>{course.difficulty}</Badge>
                        <span className="text-sm">
                            {completed} of {lessons.length} lessons completed
                        </span>
                        {next && !canManage && (
                            <Button asChild>
                                <Link href={next.url}>Continue learning</Link>
                            </Button>
                        )}
                        {canManage && (
                            <Button asChild variant="secondary">
                                <Link href="/admin/lessons">
                                    Manage lessons
                                </Link>
                            </Button>
                        )}
                    </div>
                </header>
                {groups.map((module) => (
                    <section
                        key={module.id}
                        className="overflow-hidden rounded-2xl border"
                    >
                        <h2 className="border-b bg-slate-50 px-5 py-4 font-bold dark:bg-slate-900">
                            {module.name}
                        </h2>
                        <ul className="divide-y">
                            {lessons
                                .filter((l) => (l.module_id ?? 0) === module.id)
                                .map((lesson) => (
                                    <li
                                        key={lesson.id}
                                        className="flex items-center justify-between gap-4 p-5"
                                    >
                                        <div className="flex items-center gap-3">
                                            {lesson.status === 'completed' ? (
                                                <CheckCircle2 className="size-5 text-emerald-600" />
                                            ) : lesson.unlocked ? (
                                                <PlayCircle className="size-5 text-indigo-600" />
                                            ) : (
                                                <Lock className="size-5 text-muted-foreground" />
                                            )}
                                            <div>
                                                <p className="font-medium">
                                                    {lesson.title}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground capitalize">
                                                    {lesson.status.replaceAll(
                                                        '_',
                                                        ' ',
                                                    )}
                                                    {lesson.estimated_minutes
                                                        ? ' · ' +
                                                          lesson.estimated_minutes +
                                                          ' min'
                                                        : ''}
                                                </p>
                                            </div>
                                        </div>
                                        {lesson.unlocked && (
                                            <Button
                                                asChild
                                                size="sm"
                                                variant="outline"
                                            >
                                                <Link href={lesson.url}>
                                                    Open
                                                </Link>
                                            </Button>
                                        )}
                                    </li>
                                ))}
                        </ul>
                        {!lessons.some(
                            (l) => (l.module_id ?? 0) === module.id,
                        ) && (
                            <p className="p-5 text-sm text-muted-foreground">
                                Lessons are being prepared.
                            </p>
                        )}
                    </section>
                ))}
                {projects.length > 0 && (
                    <section>
                        <h2 className="mb-4 text-xl font-bold">
                            Course projects
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {projects.map((project) => (
                                <article
                                    key={project.id}
                                    className="rounded-xl border p-5"
                                >
                                    <h3 className="font-semibold">
                                        {project.title}
                                    </h3>
                                    <p className="my-3 text-sm text-muted-foreground">
                                        {project.scenario}
                                    </p>
                                    <Link
                                        className="text-sm text-indigo-600"
                                        href={
                                            canManage
                                                ? '/admin/projects?search=' +
                                                  encodeURIComponent(
                                                      project.title,
                                                  )
                                                : '/case-studies/' + project.id
                                        }
                                    >
                                        View project →
                                    </Link>
                                </article>
                            ))}
                        </div>
                    </section>
                )}
                {!lessons.length && (
                    <p className="rounded-xl border p-6 text-muted-foreground">
                        This course has no published lessons yet.
                    </p>
                )}
            </main>
        </>
    );
}

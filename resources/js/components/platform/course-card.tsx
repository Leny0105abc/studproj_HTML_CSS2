import { Link } from '@inertiajs/react';
import { BookOpen, ArrowRight } from 'lucide-react';
import type { CourseCard as CourseCardType } from '@/types/platform';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function CourseCard({ course }: { course: CourseCardType }) {
    const published = course.status === 'published';
    return (
        <article className="flex flex-col rounded-2xl border bg-white p-6 shadow-sm dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
                <span className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                    <BookOpen className="size-6" />
                </span>
                <Badge variant="secondary">
                    {published ? course.difficulty : 'Coming soon'}
                </Badge>
            </div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {course.programs.join(' · ')}
            </p>
            <h3 className="mt-2 text-xl font-bold">{course.name}</h3>
            <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">
                {course.short_description}
            </p>
            {published && (
                <div className="my-5">
                    <div className="mb-2 flex justify-between text-sm">
                        <span>
                            {course.completed} of {course.total} lessons
                        </span>
                        <strong>{course.progress}%</strong>
                    </div>
                    <div
                        role="progressbar"
                        aria-label={course.name + ' progress'}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={course.progress}
                        className="h-2 overflow-hidden rounded-full bg-slate-100"
                    >
                        <div
                            className="h-full rounded-full bg-indigo-600"
                            style={{ width: course.progress + '%' }}
                        />
                    </div>
                </div>
            )}
            {published ? (
                <Button asChild variant="outline" className="mt-3">
                    <Link href={'/courses/' + course.slug}>
                        {course.completed > 0
                            ? 'Continue learning'
                            : 'Explore course'}
                        <ArrowRight className="size-4" />
                    </Link>
                </Button>
            ) : (
                <p className="mt-5 text-sm text-muted-foreground">
                    Your teacher will announce when this course opens.
                </p>
            )}
        </article>
    );
}

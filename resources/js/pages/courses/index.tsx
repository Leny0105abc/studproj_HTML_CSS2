import { Head, Link } from '@inertiajs/react';
import { BookOpen, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
type Course = {
    id: number;
    is_shared: boolean;
    audience_label: string;
    slug: string;
    name: string;
    language: string;
    difficulty: string;
    category?: string | null;
    recommended_prerequisites?: string | null;
    description: string;
    is_published: boolean;
    education_level: { name: string };
    total: number;
    completed: number;
};
export default function Courses({
    courses,
    isTeacher,
    isCollegeStudent = false,
}: {
    courses: Course[];
    isTeacher: boolean;
    isCollegeStudent?: boolean;
}) {
    return (
        <>
            <Head title="Courses" />
            <main className="soft-grid space-y-6 p-6">
                <h1 className="text-3xl font-bold">CodeLab Courses</h1>
                {(isCollegeStudent ? ['College'] : ['High School', 'College', 'Shared courses']).map((level) => (
                    <section key={level} className="space-y-4">
                        <h2 className="text-xl font-bold">
                            {level.toUpperCase()}
                        </h2>
                        <div className="grid gap-5 md:grid-cols-2">
                            {courses
                                .filter(
                                    (course) =>
                                        isCollegeStudent || (course.is_shared ? "Shared courses" : course.education_level.name) === level,
                                )
                                .map((course) => (
                                    <article
                                        key={course.id}
                                        className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm"
                                    >
                                        {course.language === 'Python' ? (
                                            <Terminal aria-hidden="true" />
                                        ) : (
                                            <BookOpen aria-hidden="true" />
                                        )}
                                        <h3 className="text-2xl font-bold">
                                            {course.name}
                                        </h3>
                                        <p>
                                            {course.audience_label} Program ·{' '}
                                            {course.difficulty}
                                            {!course.is_published &&
                                                ' · Unpublished'}
                                        </p>
                                        {course.category && (
                                            <p>{course.category}</p>
                                        )}
                                        {course.recommended_prerequisites && (
                                            <p className="text-sm">
                                                Recommended:{' '}
                                                {
                                                    course.recommended_prerequisites
                                                }
                                            </p>
                                        )}
                                        <p className="text-muted-foreground">
                                            {course.description}
                                        </p>
                                        <p>
                                            {course.total} Lessons · Overall:{' '}
                                            {Math.round(
                                                (course.completed /
                                                    Math.max(course.total, 1)) *
                                                    100,
                                            )}
                                            %
                                        </p>
                                        <progress
                                            aria-label={`${course.name} progress`}
                                            value={course.completed}
                                            max={Math.max(course.total, 1)}
                                            className="h-2 w-full"
                                        />
                                        <Button asChild>
                                            <Link
                                                href={`/courses/${course.slug}`}
                                            >
                                                {isTeacher
                                                    ? 'Manage Course'
                                                    : course.completed
                                                      ? 'Continue Learning'
                                                      : 'Start Course'}
                                            </Link>
                                        </Button>
                                    </article>
                                ))}
                        </div>
                    </section>
                ))}
            </main>
        </>
    );
}
Courses.layout = { breadcrumbs: [{ title: 'Courses', href: '/courses' }] };

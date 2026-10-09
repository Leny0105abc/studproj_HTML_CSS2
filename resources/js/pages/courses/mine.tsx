import { Head } from '@inertiajs/react';
import CourseCard from '@/components/platform/course-card';
import type { CourseCard as CourseData } from '@/types/platform';

export default function MyCourses({ courses }: { courses: CourseData[] }) {
    return (
        <>
            <Head title="My courses" />
            <main className="space-y-7 p-5 sm:p-8">
                <header>
                    <h1 className="text-3xl font-bold">My courses</h1>
                    <p className="mt-2 text-muted-foreground">
                        Your program courses and any courses assigned by your
                        teacher.
                    </p>
                </header>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {courses.map((course) => (
                        <CourseCard key={course.id} course={course} />
                    ))}
                </div>
                {!courses.length && (
                    <p>
                        Your program's courses are being prepared. Ask your
                        teacher about course access.
                    </p>
                )}
            </main>
        </>
    );
}

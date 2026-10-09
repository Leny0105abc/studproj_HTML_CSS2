import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Pagination from '@/components/platform/pagination';
import type { Pagination as Page } from '@/types/platform';

type Row = {
    student: string;
    program: string;
    course: string;
    completed: number;
    total: number;
    progress: number;
    quiz_average: number | null;
    status: string;
};
export default function Reports({
    records,
    courses,
    programs,
    filters,
}: {
    records: Page<Row>;
    courses: { id: number; name: string }[];
    programs: { id: number; name: string }[];
    filters: Record<string, string>;
}) {
    const [values, setValues] = useState(filters);
    const field = (key: string, value: string) =>
        setValues((v) => ({ ...v, [key]: value }));
    return (
        <>
            <Head title="Course progress reports" />
            <main className="space-y-6 p-5 sm:p-8">
                <h1 className="text-3xl font-bold">Course progress reports</h1>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        router.get('/admin/progress', values);
                    }}
                    className="grid gap-3 sm:grid-cols-3"
                >
                    <label className="text-sm">
                        Course
                        <select
                            className="mt-1 block w-full rounded-lg border p-2"
                            value={values.course ?? ''}
                            onChange={(e) => field('course', e.target.value)}
                        >
                            <option value="">All courses</option>
                            {courses.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="text-sm">
                        Program
                        <select
                            className="mt-1 block w-full rounded-lg border p-2"
                            value={values.program ?? ''}
                            onChange={(e) => field('program', e.target.value)}
                        >
                            <option value="">All programs</option>
                            {programs.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="text-sm">
                        Enrollment status
                        <select
                            className="mt-1 block w-full rounded-lg border p-2"
                            value={values.status ?? ''}
                            onChange={(e) => field('status', e.target.value)}
                        >
                            <option value="">All statuses</option>
                            {['active', 'completed', 'suspended'].map((s) => (
                                <option key={s}>{s}</option>
                            ))}
                        </select>
                    </label>
                    <label className="text-sm">
                        Student
                        <input
                            className="mt-1 block w-full rounded-lg border p-2"
                            value={values.search ?? ''}
                            onChange={(e) => field('search', e.target.value)}
                        />
                    </label>
                    <label className="text-sm">
                        Enrolled from
                        <input
                            type="date"
                            className="mt-1 block w-full rounded-lg border p-2"
                            value={values.from ?? ''}
                            onChange={(e) => field('from', e.target.value)}
                        />
                    </label>
                    <label className="text-sm">
                        Enrolled to
                        <input
                            type="date"
                            className="mt-1 block w-full rounded-lg border p-2"
                            value={values.to ?? ''}
                            onChange={(e) => field('to', e.target.value)}
                        />
                    </label>
                    <Button type="submit">Apply filters</Button>
                </form>
                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full min-w-[750px] text-left text-sm">
                        <thead>
                            <tr>
                                {[
                                    'Student',
                                    'Program',
                                    'Course',
                                    'Completed',
                                    'Progress',
                                    'Quiz average',
                                    'Status',
                                ].map((c) => (
                                    <th key={c} className="border-b p-3">
                                        {c}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {records.data.map((row, i) => (
                                <tr key={i} className="border-b">
                                    <td className="p-3">{row.student}</td>
                                    <td>{row.program}</td>
                                    <td>{row.course}</td>
                                    <td>
                                        {row.completed}/{row.total}
                                    </td>
                                    <td>{row.progress}%</td>
                                    <td>
                                        {row.quiz_average === null
                                            ? '—'
                                            : row.quiz_average + '%'}
                                    </td>
                                    <td>{row.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination links={records.links} />
            </main>
        </>
    );
}

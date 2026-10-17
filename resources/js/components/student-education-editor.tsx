import { Form } from '@inertiajs/react';
import StudentAcademicFields from '@/components/student-academic-fields';
import type { AcademicData, EducationLevel } from '@/components/student-academic-fields';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function StudentEducationEditor({ student, levels }: { student: AcademicData & { id: number; has_academic_history: boolean }; levels: EducationLevel[] }) {
    return <Card><CardHeader><CardTitle>Education and class</CardTitle></CardHeader><CardContent>
        <Form action={`/students/${student.id}/education`} method="put" className="grid gap-4 sm:grid-cols-2">{({ processing, errors }) => <>
            <StudentAcademicFields levels={levels} initial={student} />
            {student.has_academic_history && <label className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 sm:col-span-2"><input className="mt-1" type="checkbox" name="confirm_level_change" value="1" /><span>This student has enrollments, progress or submissions. I understand that changing education level changes course access. Existing learning records and enrollments will be preserved for review.</span></label>}
            {Object.keys(errors).length > 0 && <div role="alert" className="space-y-1 text-sm text-red-700 sm:col-span-2">{Object.entries(errors).map(([key, value]) => <p key={key}>{value}</p>)}</div>}
            <Button className="sm:col-span-2" disabled={processing}>{processing ? 'Saving…' : 'Save education and class'}</Button>
        </>}</Form>
    </CardContent></Card>;
}

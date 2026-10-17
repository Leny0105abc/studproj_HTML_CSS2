import { useId, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type EducationLevel = { id: number; name: string; slug: string };
export type AcademicData = { education_level_id?: number | null; grade_level?: string | null; section?: string | null; program?: string | null };

export default function StudentAcademicFields({ levels, initial = {} }: { levels: EducationLevel[]; initial?: AcademicData }) {
    const id = useId();
    const [level, setLevel] = useState(String(initial.education_level_id ?? ''));
    const college = levels.find(item => String(item.id) === level)?.slug === 'college';
    return <>
        <div className="space-y-2 sm:col-span-2"><Label htmlFor={`${id}-education`}>Education Level *</Label><select id={`${id}-education`} name="education_level_id" required value={level} onChange={e => setLevel(e.target.value)} className="h-10 w-full rounded-md border bg-background px-3"><option value="">Select Education Level</option>{levels.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
        <div className="space-y-2"><Label htmlFor={`${id}-grade`}>{college ? 'Year Level' : 'Grade Level'} *</Label><Input key={level} id={`${id}-grade`} name="grade_level" defaultValue={String(initial.education_level_id ?? '') === level ? initial.grade_level ?? '' : ''} placeholder={college ? 'e.g. 1st Year' : 'e.g. Grade 11'} required maxLength={30} /></div>
        {college && <div className="space-y-2"><Label htmlFor={`${id}-program`}>Program (optional)</Label><Input id={`${id}-program`} name="program" defaultValue={initial.program ?? ''} placeholder="e.g. BSIT" maxLength={100} /></div>}
        <div className="space-y-2"><Label htmlFor={`${id}-section`}>Section *</Label><Input id={`${id}-section`} name="section" defaultValue={initial.section ?? ''} required maxLength={50} /></div>
    </>;
}

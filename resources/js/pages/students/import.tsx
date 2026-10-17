import { Head, Link, router, useForm } from '@inertiajs/react';
import { Download, Upload, X } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Row = { number: number; educationLevel: string; name: string; username: string; class: string; email: string; status: string; state: string; errors: string[] };
type Credential = { name: string; username: string; password: string };
type Props = {
    maxFileKb: number; maxRows: number; educationLevels: { id: number; name: string }[];
    token?: string; rows?: Row[]; summary?: { total: number; ready: number; duplicates: number; invalid: number };
    complete?: boolean; imported?: number; credentials?: Credential[];
};

export default function ImportStudents({ maxFileKb, maxRows, educationLevels, token, rows, summary, complete = false, imported = 0, credentials = [] }: Props) {
    const form = useForm<{ file: File | null; education_level_id: string }>({ file: null, education_level_id: '' });
    const [confirming, setConfirming] = useState(false);
    const [confirmError, setConfirmError] = useState('');
    const [dragging, setDragging] = useState(false);
    const [showCredentials, setShowCredentials] = useState(true);
    const [copyText, setCopyText] = useState('');
    const copyCredentials = async () => {
        const text = credentials.map(c => `${c.name}\nUsername: ${c.username}\nTemporary password: ${c.password}`).join('\n\n');
        try {
            if (!navigator.clipboard) { setCopyText(text); return; }
            await navigator.clipboard.writeText(text);
        } catch { setCopyText(text); }
    };
    const step = complete ? 4 : confirming ? 3 : token ? 2 : 1;
    const upload = (event: FormEvent) => {
        event.preventDefault();
        form.post('/students/import/preview', { forceFormData: true });
    };
    const confirm = () => {
        if (confirming) return;
        setConfirmError('');
        router.post(`/students/import/${token}`, {}, {
            onStart: () => setConfirming(true), onFinish: () => setConfirming(false),
            onError: errors => setConfirmError(errors.import ?? 'Import could not be completed. Please try again.'),
        });
    };
    return <><Head title="Import Students" /><main className="soft-grid min-h-full p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><Badge variant="outline">Teacher tools</Badge><h1 className="mt-3 text-3xl font-bold">{complete ? 'Import Complete' : 'Import Students'}</h1><p className="mt-2 text-muted-foreground">Upload a CSV or Excel file to create multiple student accounts.</p></div>
            <Button asChild variant="outline"><Link href="/students">View Students</Link></Button>
        </header>
        <ol aria-label="Import steps" className="flex flex-wrap gap-3 text-sm">{['Upload', 'Preview', 'Import', 'Complete'].map((label, i) => <li key={label} aria-current={step === i + 1 ? 'step' : undefined} className={`rounded-full border px-4 py-2 ${step === i + 1 ? 'bg-indigo-600 text-white' : 'bg-white'}`}>{i + 1}. {label}</li>)}</ol>
        {!token && <Card><CardHeader><CardTitle>1. Download a template and upload your students</CardTitle></CardHeader><CardContent className="space-y-6">
            <Button asChild variant="outline"><a href="/students/import/template"><Download /> Download Student Import Template</a></Button>
            <p className="text-sm text-muted-foreground">Replace the example row with your students. Use the first worksheet only. Accepted formats: CSV, XLSX. Maximum {(maxFileKb / 1024).toFixed(1)} MB and {maxRows} students. Grade and section are required. Leave passwords blank to generate temporary passwords.</p>
            <form onSubmit={upload} className="space-y-4">
                <p className="text-sm">Every row must contain education_level: High School or College. Blank or unknown values are invalid. Use grade_level for the grade or college year; program is optional for College.</p>
                <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); if (!form.processing) form.setData('file', e.dataTransfer.files[0] ?? null); }} className={`rounded-xl border-2 border-dashed p-6 ${dragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300'}`}>
                    <Label htmlFor="student-file" className="mb-3 block">Drag and drop a file here, or choose a file</Label>
                    <Input id="student-file" type="file" accept=".csv,.xlsx" disabled={form.processing} onChange={e => form.setData('file', e.target.files?.[0] ?? null)} />
                    {form.data.file && <div className="mt-3 flex flex-wrap items-center gap-3 text-sm"><span>{form.data.file.name} · {(form.data.file.size / 1024).toFixed(1)} KB · {form.data.file.name.split('.').pop()?.toUpperCase()}</span><Button type="button" size="sm" variant="outline" disabled={form.processing} onClick={() => { form.setData('file', null); const input = document.getElementById('student-file') as HTMLInputElement; input.value = ''; }}><X /> Remove file</Button></div>}
                </div>
                {form.errors.file && <p role="alert" className="text-sm text-red-700">{form.errors.file}</p>}
                <Button type="submit" disabled={!form.data.file || form.processing}><Upload />{form.processing ? 'Processing file…' : 'Upload and preview'}</Button>
            </form>
        </CardContent></Card>}
        {token && summary && <>
            <Card><CardHeader><CardTitle>{complete ? `${imported} students imported successfully.` : '2. Review and validate'}</CardTitle></CardHeader><CardContent className="space-y-4">
                <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">{[['Total rows', summary.total], [complete ? 'Imported' : 'Ready to import', complete ? imported : summary.ready], ['Duplicates skipped', summary.duplicates], ['Invalid rows', summary.invalid]].map(([label, value]) => <div key={label}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="text-2xl font-bold">{value}</dd></div>)}</dl>
                <p className="text-sm text-muted-foreground">Only valid rows are imported. Existing accounts are never overwritten. To resolve errors, correct your source file and upload it again. Duplicates are checked again when you confirm.</p>
                {confirmError && <p role="alert" className="text-sm text-red-700">{confirmError}</p>}
                <div className="flex flex-wrap gap-3">{!complete && <Button disabled={summary.ready === 0 || confirming} onClick={confirm}>{confirming ? 'Importing students…' : `Import ${summary.ready} Students`}</Button>}<Button asChild variant="outline"><Link href="/students/import">{complete ? 'Import Another File' : 'Replace file / fix errors'}</Link></Button>{summary.duplicates + summary.invalid > 0 && <Button asChild variant="outline"><a href={`/students/import/${token}/errors`}><Download /> Download Error Report</a></Button>}</div>
            </CardContent></Card>
            {complete && credentials.length > 0 && showCredentials && <Card><CardHeader><CardTitle>Temporary credentials — shown once</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm">Copy these credentials before leaving or refreshing this page. Students must change their password after first login.</p><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Student</th><th className="p-2">Username</th><th className="p-2">Temporary password</th></tr></thead><tbody>{credentials.map(credential => <tr key={credential.username} className="border-t"><td className="p-2">{credential.name}</td><td className="p-2"><code>{credential.username}</code></td><td className="p-2"><code>{credential.password}</code></td></tr>)}</tbody></table></div><div className="flex gap-3"><Button variant="outline" onClick={copyCredentials}>Copy credentials</Button><Button variant="outline" onClick={() => setShowCredentials(false)}>Hide credentials</Button></div>{copyText && <div className="space-y-2"><Label htmlFor="credential-copy">Select this text and press Ctrl+C, or use the Copy action on your device</Label><textarea id="credential-copy" className="min-h-40 w-full rounded-md border p-3 font-mono text-sm" readOnly value={copyText} onFocus={event => event.currentTarget.select()} /></div>}</CardContent></Card>}
            <Card><CardHeader><CardTitle>{complete ? 'Import results' : 'Student preview'}</CardTitle></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead><tr className="border-b">{['File row', 'Student Name', 'Username', 'Education Level', 'Class', 'Email', 'Status', 'Validation'].map(label => <th key={label} className="p-3">{label}</th>)}</tr></thead><tbody>{rows?.map(row => <tr key={row.number} className="border-b"><td className="p-3">{row.number}</td><td className="p-3">{row.name}</td><td className="p-3">{row.username}</td><td className="p-3">{row.educationLevel}</td><td className="p-3">{row.class}</td><td className="p-3">{row.email || 'Generated from username'}</td><td className="p-3">{row.status}</td><td className="max-w-xs p-3"><Badge variant={row.state === 'Ready' ? 'default' : 'secondary'}>{complete && row.state === 'Ready' ? 'Imported' : row.state}</Badge>{row.errors.map(error => <p key={error} className="mt-1 text-red-700">{error}</p>)}</td></tr>)}</tbody></table></CardContent></Card>
        </>}
    </div></main></>;
}

ImportStudents.layout = { breadcrumbs: [{ title: 'Students', href: '/students' }, { title: 'Import Students', href: '/students/import' }] };

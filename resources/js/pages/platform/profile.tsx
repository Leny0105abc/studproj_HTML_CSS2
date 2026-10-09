import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

type Profile = {
    first_name?: string;
    last_name?: string;
    grade_level?: string;
    section?: string;
    school?: string;
    academic_program?: string;
};
export default function LearningProfile({
    profile,
    program,
    pictureUrl,
}: {
    profile: Profile;
    program?: {
        name: string;
        grade_options?: string[];
        program_options?: string[];
    } | null;
    pictureUrl?: string | null;
}) {
    const [data, setData] = useState<Record<string, string>>({
        ...profile,
    } as Record<string, string>);
    const [picture, setPicture] = useState<File | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [busy, setBusy] = useState(false);
    return (
        <>
            <Head title="Learning profile" />
            <main className="mx-auto max-w-3xl space-y-6 p-5 sm:p-8">
                <header>
                    <h1 className="text-3xl font-bold">Learning profile</h1>
                    <p className="mt-3 text-muted-foreground">
                        Program: {program?.name ?? 'High School'}. Ask your
                        administrator to change your education level or course
                        access.
                    </p>
                </header>
                {pictureUrl && (
                    <img
                        src={pictureUrl}
                        alt="Your profile picture"
                        className="size-24 rounded-full object-cover"
                    />
                )}
                <form
                    className="space-y-5"
                    onSubmit={(e) => {
                        e.preventDefault();
                        setBusy(true);
                        router.post(
                            '/learning-profile',
                            { ...data, picture },
                            {
                                forceFormData: true,
                                onError: (e) => setErrors(e),
                                onFinish: () => setBusy(false),
                            },
                        );
                    }}
                >
                    {[
                        'first_name',
                        'last_name',
                        'grade_level',
                        'section',
                        'school',
                        'academic_program',
                    ].map((key) => (
                        <label
                            key={key}
                            className="block text-sm font-medium capitalize"
                        >
                            {key.replaceAll('_', ' ')}
                            <input
                                list={
                                    key === 'grade_level'
                                        ? 'grades'
                                        : key === 'academic_program'
                                          ? 'academic-programs'
                                          : undefined
                                }
                                className="mt-2 block w-full rounded-lg border p-3"
                                value={data[key] ?? ''}
                                onChange={(e) =>
                                    setData((d) => ({
                                        ...d,
                                        [key]: e.target.value,
                                    }))
                                }
                            />
                            {errors[key] && (
                                <span
                                    role="alert"
                                    className="mt-1 block text-red-600"
                                >
                                    {errors[key]}
                                </span>
                            )}
                        </label>
                    ))}
                    <datalist id="grades">
                        {program?.grade_options?.map((grade) => (
                            <option key={grade}>{grade}</option>
                        ))}
                    </datalist>
                    <datalist id="academic-programs">
                        {program?.program_options?.map((p) => (
                            <option key={p}>{p}</option>
                        ))}
                    </datalist>
                    <label className="block text-sm">
                        Profile picture (JPEG, PNG or WebP; up to 2 MB)
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="mt-2 block"
                            onChange={(e) =>
                                setPicture(e.target.files?.[0] ?? null)
                            }
                        />
                        {errors.picture && (
                            <span role="alert" className="text-red-600">
                                {errors.picture}
                            </span>
                        )}
                    </label>
                    <Button type="submit" disabled={busy}>
                        {busy ? 'Saving…' : 'Save profile'}
                    </Button>
                </form>
            </main>
        </>
    );
}

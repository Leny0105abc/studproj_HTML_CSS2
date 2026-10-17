import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
export type CourseInfo = {
    id: number;
    name: string;
    slug: string;
    description: string;
    difficulty: string;
    is_published: boolean;
    sequential_gating: boolean;
    category?: string | null;
    recommended_prerequisites?: string | null;
    education_level: { name: string };
};
export type ModuleInfo = {
    id: number;
    name: string;
    position: number;
    assessment: { question: string; choices: string[] }[];
};
export type StudentInfo = {
    id: number;
    name: string;
    education_level_id: number | null;
};

function ModuleSettings({
    module,
    slug,
}: {
    module: ModuleInfo;
    slug: string;
}) {
    const [assessment, setAssessment] = useState(
        JSON.stringify(module.assessment, null, 2),
    );
    const [error, setError] = useState('');
    return (
        <details className="rounded border p-3">
            <summary className="cursor-pointer">
                Edit {module.name} assessment
            </summary>
            <label className="mt-3 block">
                Questions JSON
                <textarea
                    value={assessment}
                    onChange={(event) => setAssessment(event.target.value)}
                    className="mt-1 min-h-48 w-full rounded border p-3 font-mono text-sm"
                />
            </label>
            <p className="text-sm">
                Each question needs question, four choices, answer index (0–3),
                and explanation.
            </p>
            {error && <p role="alert">{error}</p>}
            <Button
                variant="outline"
                onClick={() => {
                    try {
                        const questions = JSON.parse(assessment);
                        router.put(`/courses/${slug}/modules/${module.id}`, {
                            name: module.name,
                            position: module.position,
                            assessment: questions,
                        });
                        setError('');
                    } catch {
                        setError('Enter valid JSON.');
                    }
                }}
            >
                Save assessment
            </Button>
        </details>
    );
}
export default function CourseManagement({
    course,
    modules,
    students,
    educationLevels,
}: {
    course: CourseInfo;
    modules: ModuleInfo[];
    students: StudentInfo[];
    educationLevels: { id: number; name: string }[];
}) {
    const [name, setName] = useState(course.name);
    const [description, setDescription] = useState(course.description);
    const [published, setPublished] = useState(course.is_published);
    const [gating, setGating] = useState(course.sequential_gating);
    const [category, setCategory] = useState(course.category ?? '');
    const [recommended, setRecommended] = useState(
        course.recommended_prerequisites ?? '',
    );
    const [student, setStudent] = useState('');
    return (
        <details className="rounded-xl border bg-white p-4">
            <summary className="cursor-pointer font-bold">
                Manage course, levels, and student access
            </summary>
            <div className="mt-4 space-y-4">
                <label className="block">
                    Course name
                    <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="mt-1 block w-full rounded border p-2"
                    />
                </label>
                <label className="block">
                    Description
                    <textarea
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        className="mt-1 block w-full rounded border p-2"
                    />
                </label>
                <label className="block">
                    Category
                    <input
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        maxLength={150}
                        className="block w-full rounded border p-2"
                    />
                </label>
                <label className="block">
                    Recommended prerequisites (advisory)
                    <textarea
                        value={recommended}
                        onChange={(e) => setRecommended(e.target.value)}
                        maxLength={2000}
                        className="block w-full rounded border p-2"
                    />
                </label>
                <label className="flex gap-2">
                    <input
                        type="checkbox"
                        checked={published}
                        onChange={(event) => setPublished(event.target.checked)}
                    />
                    Published
                </label>
                <label className="flex gap-2">
                    <input
                        type="checkbox"
                        checked={gating}
                        onChange={(event) => setGating(event.target.checked)}
                    />
                    Require sequential lesson completion
                </label>
                <Button
                    onClick={() =>
                        router.put(`/courses/${course.slug}`, {
                            name,
                            description,
                            is_published: published,
                            sequential_gating: gating,
                            category,
                            recommended_prerequisites: recommended,
                        })
                    }
                >
                    Save course
                </Button>
                <div className="flex flex-wrap gap-2">
                    {modules.map((module) => (
                        <Button
                            key={module.id}
                            variant="outline"
                            onClick={() => {
                                const position = window.prompt(
                                    `Position for ${module.name} (1–3)`,
                                    String(module.position),
                                );
                                if (position)
                                    router.put(
                                        `/courses/${course.slug}/modules/${module.id}`,
                                        {
                                            name: module.name,
                                            position: Number(position),
                                        },
                                    );
                            }}
                        >
                            Reorder {module.name}
                        </Button>
                    ))}
                </div>
                {modules.map((module) => (
                    <ModuleSettings
                        key={module.id}
                        module={module}
                        slug={course.slug}
                    />
                ))}
                <label className="block">
                    Student
                    <select
                        value={student}
                        onChange={(event) => setStudent(event.target.value)}
                        className="ml-2 rounded border p-2"
                    >
                        <option value="">Choose student</option>
                        {students.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.name}
                            </option>
                        ))}
                    </select>
                </label>
                <Button
                    disabled={!student}
                    onClick={() =>
                        router.post(`/courses/${course.slug}/assign`, {
                            user_id: Number(student),
                        })
                    }
                >
                    Assign this course
                </Button>
                <Button asChild disabled={!student} variant="outline"><Link href={student ? `/students/${student}` : "/students"}>Review student education and class</Link></Button>
            </div>
        </details>
    );
}

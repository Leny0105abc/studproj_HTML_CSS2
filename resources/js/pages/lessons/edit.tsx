import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
type EditableLesson = {
    id: number;
    title: string;
    level: string;
    position: number;
    is_published: boolean;
    is_project: boolean;
    prerequisite_id: number | null;
    objectives: string[];
    quiz: unknown;
    rubric: unknown;
    validation_rules: unknown;
    [key: string]: unknown;
};
const fields = [
    'wordpress_setup',
    'wordpress_steps',
    'site_structure',
    'visual_guide',
    'maintenance_tip',
    'submission_instructions',
    'introduction',
    'explanation',
    'syntax',
    'example_python',
    'starter_python',
    'example_php',
    'starter_php',
    'starter_apps_script',
    'example_apps_script',
    'workspace_setup',
    'form_setup',
    'sheet_setup',
    'authorization_note',
    'quota_note',
    'starter_vba',
    'example_vba',
    'excel_setup',
    'worksheet_layout',
    'userform_guide',
    'accessibility_tip',
    'responsive_tip',
    'starter_csharp',
    'example_csharp',
    'csharp_mode',
    'csharp_project_guide',
    'starter_vbnet',
    'example_vbnet',
    'vbnet_mode',
    'vbnet_form_guide',
    'starter_javascript',
    'example_javascript',
    'starter_sql',
    'example_sql',
    'sql_seed',
    'dialect_note',
    'starter_java',
    'example_java',
    'starter_cpp',
    'example_cpp',
    'debugging_tip',
    'security_note',
    'example_html',
    'starter_html',
    'example_css',
    'starter_css',
    'guided_practice',
    'activity',
    'expected_result',
    'important_notes',
    'challenge',
];
export default function EditLesson({
    lesson,
    prerequisites,
    levels,
}: {
    lesson: EditableLesson;
    prerequisites: { id: number; title: string }[];
    levels: string[];
}) {
    const [data, setData] = useState(lesson);
    const [objectives, setObjectives] = useState(lesson.objectives.join('\n'));
    const [json, setJson] = useState({
        programming_content: JSON.stringify(lesson.programming_content ?? null, null, 2),
        quiz: JSON.stringify(lesson.quiz ?? [], null, 2),
        rubric: JSON.stringify(lesson.rubric ?? null, null, 2),
        validation_rules: JSON.stringify(
            lesson.validation_rules ?? null,
            null,
            2,
        ),
        block_examples: JSON.stringify(lesson.block_examples ?? [], null, 2),
    });
    const [error, setError] = useState('');
    const errors = usePage().props.errors;
    const save = () => {
        try {
            const body = {
                title: data.title,
                level: data.level,
                position: data.position,
                is_published: data.is_published,
                is_project: data.is_project,
                prerequisite_id: data.prerequisite_id,
                objectives: objectives.split('\n').filter(Boolean),
                programming_content: JSON.parse(json.programming_content),
                quiz: JSON.parse(json.quiz),
                rubric: JSON.parse(json.rubric),
                validation_rules: JSON.parse(json.validation_rules),
                block_examples: JSON.parse(json.block_examples),
            };
            const text = Object.fromEntries(
                fields.map((field) => [field, data[field] ?? '']),
            );
            router.put(`/lessons/${lesson.id}`, {
                ...body,
                ...text,
            } as Parameters<typeof router.put>[1]);
            setError('');
        } catch {
            setError(
                'Quiz, rubric, and validation settings must be valid JSON.',
            );
        }
    };
    return (
        <>
            <Head title={`Edit ${lesson.title}`} />
            <main className="mx-auto max-w-4xl space-y-5 p-6">
                <h1 className="text-3xl font-bold">Edit lesson</h1>
                {Object.entries(errors).map(([key, value]) => (
                    <p key={key} role="alert" className="text-rose-700">
                        {key}: {String(value)}
                    </p>
                ))}
                {error && <p role="alert">{error}</p>}
                <label className="block">
                    Title
                    <input
                        className="block w-full rounded border p-2"
                        value={data.title}
                        onChange={(event) =>
                            setData({ ...data, title: event.target.value })
                        }
                    />
                </label>
                <label className="block">
                    Level
                    <select
                        value={data.level}
                        onChange={(event) =>
                            setData({ ...data, level: event.target.value })
                        }
                        className="ml-2 rounded border p-2"
                    >
                        {levels.map((level) => (
                            <option key={level}>{level}</option>
                        ))}
                    </select>
                </label>
                <label className="block">
                    Course position
                    <input
                        type="number"
                        min={1}
                        value={data.position}
                        onChange={(event) =>
                            setData({
                                ...data,
                                position: Number(event.target.value),
                            })
                        }
                        className="ml-2 rounded border p-2"
                    />
                </label>
                <label className="flex gap-2">
                    <input
                        type="checkbox"
                        checked={data.is_published}
                        onChange={(event) =>
                            setData({
                                ...data,
                                is_published: event.target.checked,
                            })
                        }
                    />
                    Published
                </label>
                <label className="flex gap-2">
                    <input
                        type="checkbox"
                        checked={data.is_project}
                        onChange={(event) =>
                            setData({
                                ...data,
                                is_project: event.target.checked,
                            })
                        }
                    />
                    Project
                </label>
                <label className="block">
                    Prerequisite
                    <select
                        value={data.prerequisite_id ?? ''}
                        onChange={(event) =>
                            setData({
                                ...data,
                                prerequisite_id: event.target.value
                                    ? Number(event.target.value)
                                    : null,
                            })
                        }
                        className="ml-2 rounded border p-2"
                    >
                        <option value="">
                            Previous published lesson (when gating is enabled)
                        </option>
                        {prerequisites.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.title}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="block">
                    Objectives · one per line
                    <textarea
                        value={objectives}
                        onChange={(event) => setObjectives(event.target.value)}
                        className="block min-h-28 w-full rounded border p-3"
                    />
                </label>
                {fields.map((field) => (
                    <label key={field} className="block capitalize">
                        {field.replaceAll('_', ' ')}
                        <textarea
                            value={
                                typeof data[field] === 'string'
                                    ? (data[field] as string)
                                    : ''
                            }
                            onChange={(event) =>
                                setData({
                                    ...data,
                                    [field]: event.target.value,
                                })
                            }
                            className="block min-h-28 w-full rounded border p-3"
                        />
                    </label>
                ))}
                <p className="text-sm">
                    Quiz JSON: five objects with question, four choices, answer
                    index (0–3), and explanation. Python validation rules:
                    python.required_functions, required_variables,
                    expected_output, and test_cases (function, arguments,
                    expected). Rubric JSON maps category names to percentages.
                </p>
                <p>
                    Scratch block examples: an array of diagrams with name,
                    sprite, and blocks. Each block has category and text.
                    Supported categories: Motion, Looks, Sound, Events, Control,
                    Sensing, Operators, Variables, Lists, My Blocks.
                </p>
                {(
                    [
                        'quiz',
                        'rubric',
                        'validation_rules',
                        'block_examples',
                    ] as const
                ).map((field) => (
                    <label key={field} className="block capitalize">
                        {field.replaceAll('_', ' ')} JSON
                        <textarea
                            value={json[field]}
                            onChange={(event) =>
                                setJson({
                                    ...json,
                                    [field]: event.target.value,
                                })
                            }
                            className="block min-h-48 w-full rounded border p-3 font-mono text-sm"
                        />
                    </label>
                ))}
                <div className="flex gap-3">
                    <Button onClick={save}>Save lesson</Button>
                    <Button
                        variant="outline"
                        onClick={() => router.delete(`/lessons/${lesson.id}`)}
                    >
                        Archive lesson
                    </Button>
                </div>
            </main>
        </>
    );
}
EditLesson.layout = {
    breadcrumbs: [
        { title: 'Courses', href: '/courses' },
        { title: 'Edit Lesson', href: '#' },
    ],
};

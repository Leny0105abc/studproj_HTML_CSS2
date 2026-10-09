import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import StudentCredentials from '@/components/student-credentials';
import Pagination from '@/components/platform/pagination';
import ContentEditor from '@/components/platform/content-editor';
import QuizEditor from '@/components/platform/quiz-editor';
import type { Question } from '@/components/platform/quiz-editor';
import type { Pagination as Page } from '@/types/platform';

type Value =
    | string
    | number
    | boolean
    | null
    | Value[]
    | { [key: string]: Value };
type Row = { id: number; [key: string]: Value };
type Option = { id: number; name?: string; title?: string; course_id?: number };
type Props = {
    resource: string;
    label: string;
    records: Page<Row>;
    rules: Record<string, string>;
    options: Record<string, Option[]>;
    isAdmin: boolean;
    search?: string;
};
const labels = (key: string) =>
    key.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function Manage({
    resource,
    label,
    records,
    rules,
    options,
    isAdmin,
    search = '',
}: Props) {
    const [record, setRecord] = useState<Row | null>(null);
    const [data, setData] = useState<Record<string, Value>>({});
    const [open, setOpen] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [query, setQuery] = useState(search);
    const [rubric, setRubric] = useState('{}');
    const set = (key: string, value: Value) =>
        setData((previous) => ({ ...previous, [key]: value }));
    const edit = (row: Row | null) => {
        const values: Record<string, Value> = {};
        Object.entries(rules).forEach(([key, rule]) => {
            values[key] =
                row?.[key] ??
                (rule.includes('boolean')
                    ? false
                    : rule.includes('array')
                      ? []
                      : rule.includes('integer')
                        ? key === 'passing_score'
                            ? 80
                            : key === 'points'
                              ? 10
                              : key === 'position'
                                ? 1
                                : rule.includes('nullable')
                                  ? null
                                  : 0
                        : (rule
                              .match(/(?:^|\|)in:([^|]+)/)?.[1]
                              .split(',')[0] ?? ''));
        });
        if (resource === 'courses' && row) {
            values.education_level_ids = (
                (row.education_levels as { id: number }[]) ?? []
            ).map((v) => v.id);
            values.teacher_ids = ((row.teachers as { id: number }[]) ?? []).map(
                (v) => v.id,
            );
        }
        if (resource === 'teachers' && row) {
            values.course_ids = (
                (row.taught_courses as { id: number }[]) ?? []
            ).map((v) => v.id);
        }
        setRubric(
            JSON.stringify(row?.rubric ?? { Requirements: 100 }, null, 2),
        );
        setRecord(row);
        setData(values);
        setErrors({});
        setOpen(true);
    };
    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        const payload = { ...data };
        if (resource === 'projects') {
            try {
                payload.rubric = JSON.parse(rubric) as Value;
            } catch {
                setErrors({
                    rubric: 'Use a valid JSON object for the rubric.',
                });
                return;
            }
        }
        setSaving(true);
        const opts = {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
            onError: (e: Record<string, string>) => setErrors(e),
            onFinish: () => setSaving(false),
        };
        if (record) {
            router.put('/admin/' + resource + '/' + record.id, payload, opts);
        } else {
            router.post('/admin/' + resource, payload, opts);
        }
    };
    const choicesFor = (key: string): Option[] | undefined => {
        if (key === 'course_id' || key === 'course_ids') return options.courses;
        if (key === 'education_level_id' || key === 'education_level_ids')
            return options.programs;
        if (key === 'student_id') return options.students;
        if (key === 'teacher_ids') return options.teachers;
        if (key === 'course_level_id')
            return options.modules.filter(
                (m) =>
                    !data.course_id || m.course_id === Number(data.course_id),
            );
        if (key === 'lesson_id' || key === 'prerequisite_id')
            return options.lessons.filter(
                (l) =>
                    key === 'lesson_id' ||
                    !data.course_id ||
                    l.course_id === Number(data.course_id),
            );
        return undefined;
    };
    return (
        <>
            <Head title={label + ' · Administration'} />
            <StudentCredentials />
            <main className="space-y-6 p-5 sm:p-8">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-sm text-indigo-600">
                            CodeLab management
                        </p>
                        <h1 className="mt-2 text-3xl font-bold">{label}</h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Create and publish content. Archiving preserves
                            student work.
                        </p>
                    </div>
                    {(isAdmin || resource !== 'courses') && (
                        <Button onClick={() => edit(null)}>
                            Create {label.replace(/s$/, '').toLowerCase()}
                        </Button>
                    )}
                </header>
                <nav aria-label="Management" className="flex flex-wrap gap-2">
                    {[
                        'education-levels',
                        'courses',
                        'modules',
                        'lessons',
                        'activities',
                        'projects',
                        'students',
                        'teachers',
                        'enrollments',
                        'announcements',
                        'achievements',
                    ]
                        .filter(
                            (r) =>
                                isAdmin ||
                                ![
                                    'education-levels',
                                    'students',
                                    'teachers',
                                    'announcements',
                                    'achievements',
                                ].includes(r),
                        )
                        .map((r) => (
                            <Link
                                key={r}
                                href={'/admin/' + r}
                                className={
                                    'rounded-lg border px-3 py-2 text-sm capitalize ' +
                                    (resource === r
                                        ? 'bg-indigo-600 text-white'
                                        : '')
                                }
                            >
                                {r.replaceAll('-', ' ')}
                            </Link>
                        ))}
                </nav>
                <form
                    className="flex max-w-lg gap-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        router.get('/admin/' + resource, { search: query });
                    }}
                >
                    <label className="sr-only" htmlFor="management-search">
                        Search {label}
                    </label>
                    <input
                        id="management-search"
                        className="min-w-0 flex-1 rounded-lg border p-2"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={'Search ' + label.toLowerCase()}
                    />
                    <Button type="submit" variant="outline">
                        Search
                    </Button>
                </form>
                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full min-w-[600px] text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-900">
                            <tr>
                                <th className="p-4">Name / title</th>
                                <th>Status</th>
                                <th>Course / order</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.data.map((row) => (
                                <tr key={row.id} className="border-t">
                                    <td className="p-4 font-medium">
                                        {String(
                                            row.name ??
                                                row.title ??
                                                'Enrollment #' + row.id,
                                        )}
                                    </td>
                                    <td className="capitalize">
                                        {String(
                                            row.status ??
                                                (row.is_published
                                                    ? 'Published'
                                                    : 'Draft'),
                                        )}
                                    </td>
                                    <td>
                                        {options.courses.find(
                                            (c) => c.id === row.course_id,
                                        )?.name ?? '—'}{' '}
                                        {row.position != null
                                            ? ' · ' + row.position
                                            : ''}
                                    </td>
                                    <td className="space-x-2 p-4 text-right">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => edit(row)}
                                        >
                                            Edit
                                        </Button>
                                        {resource === 'lessons' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    router.post(
                                                        '/admin/lessons/' +
                                                            row.id +
                                                            '/duplicate',
                                                    )
                                                }
                                            >
                                                Duplicate
                                            </Button>
                                        )}
                                        {(isAdmin ||
                                            resource !== 'courses') && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    if (
                                                        window.confirm(
                                                            'Archive this item? Existing student work will be preserved.',
                                                        )
                                                    )
                                                        router.delete(
                                                            '/admin/' +
                                                                resource +
                                                                '/' +
                                                                row.id,
                                                            {
                                                                preserveScroll: true,
                                                            },
                                                        );
                                                }}
                                            >
                                                Archive
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!records.data.length && (
                        <p className="p-6 text-muted-foreground">
                            No items yet.
                        </p>
                    )}
                </div>
                <Pagination links={records.links} />
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>
                                {record ? 'Edit' : 'Create'} · {label}
                            </DialogTitle>
                            <DialogDescription>
                                Choose a course and module before entering
                                lesson content. Save as a draft until it is
                                ready.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submit} className="space-y-5">
                            {Object.entries(rules)
                                .filter(
                                    ([key]) =>
                                        isAdmin ||
                                        ![
                                            'teacher_ids',
                                            'education_level_ids',
                                        ].includes(key),
                                )
                                .map(([key, rule]) => {
                                    const values = choicesFor(key);
                                    const choices = rule
                                        .match(/(?:^|\|)in:([^|]+)/)?.[1]
                                        .split(',');
                                    const required =
                                        rule.startsWith('required');
                                    const inputClass =
                                        'mt-1 block w-full rounded-lg border bg-transparent p-2 text-sm';
                                    return (
                                        <div key={key}>
                                            <label
                                                className="block text-sm font-medium"
                                                htmlFor={'field-' + key}
                                            >
                                                {labels(key)}
                                                {required ? ' *' : ''}
                                            </label>
                                            {key === 'quiz' ? (
                                                <QuizEditor
                                                    value={
                                                        (data[
                                                            key
                                                        ] as unknown as Question[]) ??
                                                        []
                                                    }
                                                    onChange={(questions) =>
                                                        set(
                                                            key,
                                                            questions as unknown as Value,
                                                        )
                                                    }
                                                />
                                            ) : key === 'lesson_content' ? (
                                                <ContentEditor
                                                    id={'field-' + key}
                                                    value={String(
                                                        data[key] ?? '',
                                                    )}
                                                    onChange={(value) =>
                                                        set(key, value)
                                                    }
                                                />
                                            ) : key === 'rubric' ? (
                                                <textarea
                                                    id={'field-' + key}
                                                    className={inputClass}
                                                    rows={5}
                                                    value={rubric}
                                                    onChange={(e) =>
                                                        setRubric(
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            ) : values ? (
                                                <select
                                                    id={'field-' + key}
                                                    multiple={rule.includes(
                                                        'array',
                                                    )}
                                                    className={inputClass}
                                                    value={
                                                        rule.includes('array')
                                                            ? (
                                                                  (data[
                                                                      key
                                                                  ] as number[]) ??
                                                                  []
                                                              ).map(String)
                                                            : String(
                                                                  data[key] ??
                                                                      '',
                                                              )
                                                    }
                                                    onChange={(e) =>
                                                        set(
                                                            key,
                                                            rule.includes(
                                                                'array',
                                                            )
                                                                ? Array.from(
                                                                      e.target
                                                                          .selectedOptions,
                                                                  ).map((o) =>
                                                                      Number(
                                                                          o.value,
                                                                      ),
                                                                  )
                                                                : e.target.value
                                                                  ? Number(
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                  : null,
                                                        )
                                                    }
                                                >
                                                    {!rule.includes(
                                                        'array',
                                                    ) && (
                                                        <option value="">
                                                            Choose{' '}
                                                            {labels(
                                                                key,
                                                            ).toLowerCase()}
                                                        </option>
                                                    )}
                                                    {values.map((v) => (
                                                        <option
                                                            key={v.id}
                                                            value={v.id}
                                                        >
                                                            {v.name ?? v.title}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : rule.includes('boolean') ? (
                                                <input
                                                    id={'field-' + key}
                                                    type="checkbox"
                                                    className="mt-2 size-4"
                                                    checked={Boolean(data[key])}
                                                    onChange={(e) =>
                                                        set(
                                                            key,
                                                            e.target.checked,
                                                        )
                                                    }
                                                />
                                            ) : choices ? (
                                                <select
                                                    id={'field-' + key}
                                                    className={inputClass}
                                                    value={String(
                                                        data[key] ?? '',
                                                    )}
                                                    onChange={(e) =>
                                                        set(key, e.target.value)
                                                    }
                                                >
                                                    {choices.map((choice) => (
                                                        <option
                                                            key={choice}
                                                            value={choice}
                                                        >
                                                            {choice.replaceAll(
                                                                '_',
                                                                ' ',
                                                            )}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : rule.includes('array') ? (
                                                <textarea
                                                    id={'field-' + key}
                                                    className={inputClass}
                                                    rows={4}
                                                    value={
                                                        Array.isArray(data[key])
                                                            ? (
                                                                  data[
                                                                      key
                                                                  ] as string[]
                                                              ).join('\n')
                                                            : ''
                                                    }
                                                    onChange={(e) =>
                                                        set(
                                                            key,
                                                            e.target.value
                                                                ? e.target.value.split(
                                                                      '\n',
                                                                  )
                                                                : [],
                                                        )
                                                    }
                                                    placeholder="One item per line"
                                                />
                                            ) : /description|introduction|explanation|content|instructions|practice|activity|result|requirements|reflection|html|css|code/.test(
                                                  key,
                                              ) ? (
                                                <textarea
                                                    id={'field-' + key}
                                                    className={inputClass}
                                                    rows={5}
                                                    value={String(
                                                        data[key] ?? '',
                                                    )}
                                                    onChange={(e) =>
                                                        set(key, e.target.value)
                                                    }
                                                />
                                            ) : (
                                                <input
                                                    id={'field-' + key}
                                                    type={
                                                        rule.includes('integer')
                                                            ? 'number'
                                                            : key === 'due_date'
                                                              ? 'datetime-local'
                                                              : 'text'
                                                    }
                                                    className={inputClass}
                                                    value={String(
                                                        data[key] ?? '',
                                                    )}
                                                    onChange={(e) =>
                                                        set(
                                                            key,
                                                            rule.includes(
                                                                'integer',
                                                            )
                                                                ? e.target
                                                                      .value ===
                                                                  ''
                                                                    ? null
                                                                    : Number(
                                                                          e
                                                                              .target
                                                                              .value,
                                                                      )
                                                                : e.target
                                                                      .value,
                                                        )
                                                    }
                                                />
                                            )}
                                            {errors[key] && (
                                                <p
                                                    role="alert"
                                                    className="mt-1 text-sm text-red-600"
                                                >
                                                    {errors[key]}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            {Object.keys(errors).length > 0 && (
                                <div
                                    role="alert"
                                    className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
                                >
                                    {Object.entries(errors).map(
                                        ([key, value]) => (
                                            <p key={key}>
                                                {labels(key)}: {value}
                                            </p>
                                        ),
                                    )}
                                </div>
                            )}
                            <Button type="submit" disabled={saving}>
                                {saving ? 'Saving…' : 'Save changes'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </main>
        </>
    );
}

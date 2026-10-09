import { Button } from '@/components/ui/button';

export type Question = {
    type?: string;
    question: string;
    choices?: string[];
    answer: string | number;
    explanation?: string;
};
export default function QuizEditor({
    value,
    onChange,
}: {
    value: Question[];
    onChange: (questions: Question[]) => void;
}) {
    const update = (index: number, changes: Partial<Question>) =>
        onChange(value.map((q, i) => (i === index ? { ...q, ...changes } : q)));
    return (
        <div className="space-y-4">
            {value.map((q, index) => (
                <fieldset
                    key={index}
                    className="space-y-3 rounded-xl border p-4"
                >
                    <legend className="px-2 text-sm font-semibold">
                        Question {index + 1}
                    </legend>
                    <label className="block text-sm">
                        Question type
                        <select
                            className="mt-1 block w-full rounded-lg border p-2"
                            value={q.type ?? 'multiple_choice'}
                            onChange={(e) =>
                                update(index, {
                                    type: e.target.value,
                                    choices: [
                                        'multiple_choice',
                                        'true_false',
                                        'code_output',
                                    ].includes(e.target.value)
                                        ? ['Choice 1', 'Choice 2']
                                        : undefined,
                                    answer: [
                                        'multiple_choice',
                                        'true_false',
                                        'code_output',
                                    ].includes(e.target.value)
                                        ? 0
                                        : '',
                                })
                            }
                        >
                            {[
                                'multiple_choice',
                                'true_false',
                                'identification',
                                'short_answer',
                                'code_output',
                                'code_completion',
                            ].map((t) => (
                                <option key={t} value={t}>
                                    {t.replaceAll('_', ' ')}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="block text-sm">
                        Question
                        <textarea
                            className="mt-1 block w-full rounded-lg border p-2"
                            value={q.question}
                            onChange={(e) =>
                                update(index, { question: e.target.value })
                            }
                        />
                    </label>
                    {q.choices && (
                        <label className="block text-sm">
                            Choices (one per line)
                            <textarea
                                className="mt-1 block w-full rounded-lg border p-2"
                                value={q.choices.join('\n')}
                                onChange={(e) =>
                                    update(index, {
                                        choices: e.target.value.split('\n'),
                                    })
                                }
                            />
                        </label>
                    )}
                    <label className="block text-sm">
                        Correct answer
                        {q.choices ? (
                            <select
                                className="mt-1 block w-full rounded-lg border p-2"
                                value={q.answer}
                                onChange={(e) =>
                                    update(index, {
                                        answer: Number(e.target.value),
                                    })
                                }
                            >
                                {q.choices.map((choice, key) => (
                                    <option key={key} value={key}>
                                        {choice}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                className="mt-1 block w-full rounded-lg border p-2"
                                value={q.answer}
                                onChange={(e) =>
                                    update(index, { answer: e.target.value })
                                }
                            />
                        )}
                    </label>
                    <label className="block text-sm">
                        Feedback / explanation
                        <textarea
                            className="mt-1 block w-full rounded-lg border p-2"
                            value={q.explanation ?? ''}
                            onChange={(e) =>
                                update(index, { explanation: e.target.value })
                            }
                        />
                    </label>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            onChange(value.filter((_, i) => i !== index))
                        }
                    >
                        Remove question
                    </Button>
                </fieldset>
            ))}
            <Button
                type="button"
                variant="outline"
                onClick={() =>
                    onChange([
                        ...value,
                        {
                            type: 'multiple_choice',
                            question: '',
                            choices: ['Choice 1', 'Choice 2'],
                            answer: 0,
                            explanation: '',
                        },
                    ])
                }
            >
                Add question
            </Button>
        </div>
    );
}

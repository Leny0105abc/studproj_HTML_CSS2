import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { ModuleInfo } from '@/components/course-management';
export default function ModuleAssessment({
    module,
    slug,
    unlocked,
    result,
}: {
    module: ModuleInfo;
    slug: string;
    unlocked: boolean;
    result?: { score: number; total: number };
}) {
    const [answers, setAnswers] = useState<Record<number, number>>({});
    if (!module.assessment.length) return null;
    return (
        <details className="mt-4 rounded-xl border bg-white p-4">
            <summary className="cursor-pointer font-bold">
                {module.name.toUpperCase()} Assessment ·{' '}
                {module.assessment.length} questions{' '}
                {result && `· Latest: ${result.score}/${result.total}`}
            </summary>
            {!unlocked ? (
                <p className="mt-3">
                    Complete every lesson and project in this module first.
                </p>
            ) : (
                <div className="mt-4 space-y-4">
                    {module.assessment.map((question, index) => (
                        <fieldset key={index}>
                            <legend className="font-semibold">
                                {index + 1}. {question.question}
                            </legend>
                            {question.choices.map((choice, i) => (
                                <label key={i} className="mt-2 flex gap-2">
                                    <input
                                        type="radio"
                                        name={`assessment-${module.id}-${index}`}
                                        checked={answers[index] === i}
                                        onChange={() =>
                                            setAnswers((current) => ({
                                                ...current,
                                                [index]: i,
                                            }))
                                        }
                                    />
                                    {choice}
                                </label>
                            ))}
                        </fieldset>
                    ))}
                    <Button
                        disabled={module.assessment.some(
                            (_, index) => answers[index] === undefined,
                        )}
                        onClick={() =>
                            router.post(
                                `/courses/${slug}/modules/${module.id}/assessment`,
                                {
                                    answers: module.assessment.map(
                                        (_, index) => answers[index],
                                    ),
                                },
                            )
                        }
                    >
                        Submit assessment
                    </Button>
                </div>
            )}
        </details>
    );
}

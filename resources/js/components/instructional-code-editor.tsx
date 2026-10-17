import { useState } from 'react';
import { Button } from '@/components/ui/button';

export type InstructionalSourceProps = {
    code: string;
    onChange: (value: string) => void;
    starter: string;
    readOnly?: boolean;
    onSave?: () => void;
};
export default function InstructionalCodeEditor({
    code,
    onChange,
    starter,
    readOnly = false,
    onSave,
    id,
    label,
    environment,
    instructions,
    footnote,
}: {
    id: string;
    label: string;
    environment: string;
    instructions: string;
    footnote: string;
} & InstructionalSourceProps) {
    const [copyMessage, setCopyMessage] = useState('');
    return (
        <section className="space-y-4 rounded-2xl border bg-white p-4">
            <p className="rounded-lg bg-amber-50 p-3 text-sm">
                <strong>{environment}</strong> {instructions}
            </p>
            <label htmlFor={id} className="block font-bold">
                {label}
            </label>
            <textarea
                id={id}
                value={code}
                onChange={(event) => onChange(event.target.value)}
                readOnly={readOnly}
                maxLength={200000}
                spellCheck={false}
                className="code-surface min-h-80 w-full rounded-xl p-4 font-mono text-sm"
            />
            <div className="flex flex-wrap gap-2">
                <Button
                    variant="outline"
                    onClick={() =>
                        void navigator.clipboard
                            .writeText(code)
                            .then(() => setCopyMessage('Source copied.'))
                            .catch(() =>
                                setCopyMessage(
                                    'Select the source and copy it manually.',
                                ),
                            )
                    }
                >
                    Copy Code
                </Button>
                <Button
                    variant="outline"
                    onClick={() => onChange(starter)}
                    disabled={readOnly}
                >
                    Reset
                </Button>
                <Button
                    variant="outline"
                    onClick={() => onChange('')}
                    disabled={readOnly}
                >
                    Clear
                </Button>
                {onSave && (
                    <Button onClick={onSave} disabled={readOnly}>
                        Save Code
                    </Button>
                )}
            </div>
            <p aria-live="polite" className="text-sm">
                {copyMessage}
            </p>
            <p className="text-sm text-muted-foreground">
                {footnote} Teacher approval and a passed quiz are required.
            </p>
        </section>
    );
}

import { useRef } from 'react';
import { Button } from '@/components/ui/button';

export default function ContentEditor({
    id,
    value,
    onChange,
}: {
    id: string;
    value: string;
    onChange: (value: string) => void;
}) {
    const field = useRef<HTMLTextAreaElement>(null);
    const insert = (text: string) => {
        const position = field.current?.selectionStart ?? value.length;
        onChange(value.slice(0, position) + text + value.slice(position));
        field.current?.focus();
    };
    return (
        <div className="rounded-xl border">
            <div className="flex flex-wrap gap-1 border-b p-2">
                {[
                    ['Heading', '\n## Heading\n'],
                    ['List', '\n- First item\n- Second item\n'],
                    ['Code block', '\n~~~\nYour code here\n~~~\n'],
                    ['Callout', '\n> Teacher note\n'],
                    ['Link', '\n[Link title](https://example.com)\n'],
                    [
                        'Table',
                        '\n| Column | Column |\n| --- | --- |\n| Value | Value |\n',
                    ],
                ].map(([label, text]) => (
                    <Button
                        key={label}
                        size="sm"
                        type="button"
                        variant="ghost"
                        onClick={() => insert(text)}
                    >
                        {label}
                    </Button>
                ))}
            </div>
            <textarea
                id={id}
                ref={field}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={10}
                className="block w-full border-0 bg-transparent p-3 text-sm"
            />
            <p className="px-3 pb-3 text-xs text-muted-foreground">
                Use headings, lists, code blocks, callouts and links. Content is
                rendered as safe text; HTML examples belong in the example
                editor.
            </p>
        </div>
    );
}

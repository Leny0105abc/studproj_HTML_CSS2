import { Fragment } from 'react';

function inline(text: string) {
    return text
        .split(/(\[[^\]]+\]\((?:https?:\/\/|\/)[^\s)]+\)|`[^`]+`)/g)
        .map((part, key) => {
            const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
            if (link)
                return (
                    <a
                        key={key}
                        href={link[2]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 underline"
                    >
                        {link[1]}
                    </a>
                );
            if (part.startsWith('`') && part.endsWith('`'))
                return (
                    <code
                        key={key}
                        className="rounded bg-slate-100 px-1 dark:bg-slate-800"
                    >
                        {part.slice(1, -1)}
                    </code>
                );
            return <Fragment key={key}>{part}</Fragment>;
        });
}

export default function LessonContent({ content }: { content: string }) {
    const blocks = content.split(/\n\s*\n/);
    return (
        <div className="space-y-4 text-sm leading-7">
            {blocks.map((block, key) => {
                if (/^(~~~|```)/.test(block.trim()))
                    return (
                        <pre
                            key={key}
                            className="overflow-auto rounded-xl bg-slate-950 p-4 text-slate-100"
                        >
                            <code>
                                {block
                                    .replace(/^(~~~|```)[^\n]*\n/, '')
                                    .replace(/\n(~~~|```)$/, '')}
                            </code>
                        </pre>
                    );
                if (block.startsWith('## '))
                    return (
                        <h3 key={key} className="text-lg font-bold">
                            {inline(block.slice(3))}
                        </h3>
                    );
                if (block.startsWith('# '))
                    return (
                        <h2 key={key} className="text-xl font-bold">
                            {inline(block.slice(2))}
                        </h2>
                    );
                if (block.startsWith('> '))
                    return (
                        <blockquote
                            key={key}
                            className="border-l-4 border-indigo-400 bg-indigo-50 p-4 text-indigo-950"
                        >
                            {inline(block.replace(/^> /gm, ''))}
                        </blockquote>
                    );
                if (block.split('\n').every((line) => line.startsWith('- ')))
                    return (
                        <ul key={key} className="list-disc space-y-2 pl-5">
                            {block.split('\n').map((line, index) => (
                                <li key={index}>{inline(line.slice(2))}</li>
                            ))}
                        </ul>
                    );
                if (block.startsWith('|') && block.includes('| ---')) {
                    const rows = block
                        .split('\n')
                        .filter((line) => !/^\|\s*[-:]/.test(line))
                        .map((line) =>
                            line
                                .split('|')
                                .slice(1, -1)
                                .map((c) => c.trim()),
                        );
                    return (
                        <div key={key} className="overflow-x-auto">
                            <table className="min-w-full border">
                                <thead>
                                    <tr>
                                        {rows[0].map((cell, i) => (
                                            <th
                                                key={i}
                                                className="border p-2 text-left"
                                            >
                                                {inline(cell)}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.slice(1).map((row, i) => (
                                        <tr key={i}>
                                            {row.map((cell, j) => (
                                                <td
                                                    key={j}
                                                    className="border p-2"
                                                >
                                                    {inline(cell)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                }
                return (
                    <p key={key} className="whitespace-pre-wrap">
                        {inline(block)}
                    </p>
                );
            })}
        </div>
    );
}

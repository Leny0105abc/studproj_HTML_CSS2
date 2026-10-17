export type BlockExample = {
    name: string;
    sprite: string;
    blocks: { category: string; text: string }[];
};
const colors: Record<string, string> = {
    Motion: 'bg-blue-600',
    Looks: 'bg-violet-600',
    Sound: 'bg-fuchsia-700',
    Events: 'bg-amber-700',
    Control: 'bg-orange-700',
    Sensing: 'bg-cyan-700',
    Operators: 'bg-green-700',
    Variables: 'bg-orange-800',
    Lists: 'bg-red-700',
    'My Blocks': 'bg-rose-700',
};
export default function ScratchBlocks({
    examples,
}: {
    examples: BlockExample[];
}) {
    return (
        <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
                Illustrated instructions for assembling blocks in Scratch. These
                diagrams do not execute a project.
            </p>
            {examples.map((example, index) => (
                <section
                    key={index}
                    className="space-y-3 rounded-xl border bg-slate-50 p-5"
                >
                    <h3 className="font-semibold">
                        {example.name} · {example.sprite}
                    </h3>
                    <ol className="space-y-1">
                        {example.blocks.map((block, at) => (
                            <li
                                key={at}
                                className={`w-fit max-w-full rounded-lg border-b-4 border-black/20 px-4 py-2 text-white shadow-sm ${colors[block.category] ?? 'bg-slate-700'}`}
                            >
                                <span className="mr-3 text-xs font-bold uppercase">
                                    {block.category}
                                </span>
                                <span className="whitespace-pre-wrap">
                                    {block.text}
                                </span>
                            </li>
                        ))}
                    </ol>
                </section>
            ))}
        </div>
    );
}

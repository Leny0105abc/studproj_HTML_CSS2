import { useEffect, useState, useRef, type CSSProperties } from 'react';
import { Button } from '@/components/ui/button';
export type DemoStep = {
    caption: string;
    command: string;
    effect?: string;
    text?: string;
};
export type Demonstration = {
    id: number;
    key?: string;
    title: string;
    description: string;
    media_type: string;
    transcript?: string;
    steps: DemoStep[];
    display_order: number;
    is_required: boolean;
    status: string;
};
const sample =
    'Our school learning activities encourage careful practice. Use Word commands to communicate clearly. Each learner checks the result and saves the document.';
function frameStyle(effect: string): CSSProperties {
    return {
        fontWeight: effect === 'bold' ? 700 : 400,
        fontStyle: ['italic', 'underline'].includes(effect)
            ? 'italic'
            : 'normal',
        textDecoration: effect === 'underline' ? 'underline' : 'none',
        fontFamily: effect === 'font' ? 'Georgia, serif' : 'Arial, sans-serif',
        fontSize: effect === 'font' ? 24 : 15,
        color: effect === 'color' ? '#1d4ed8' : '#172554',
        backgroundColor: ['selected', 'highlight'].includes(effect)
            ? effect === 'selected'
                ? '#bfdbfe'
                : '#fef08a'
            : 'transparent',
        textAlign: ['left', 'center', 'right', 'justify'].includes(effect)
            ? (effect as CSSProperties['textAlign'])
            : 'left',
        lineHeight: effect === 'spacing' ? 1.5 : 1.1,
        textIndent:
            effect === 'first-indent'
                ? '1.27cm'
                : effect === 'hanging-indent'
                  ? '-1.27cm'
                  : 0,
        paddingLeft:
            effect === 'hanging-indent'
                ? '1.27cm'
                : effect === 'margins'
                  ? '2rem'
                  : 0,
        paddingRight: effect === 'margins' ? '2rem' : 0,
        border: effect === 'border' ? '2px solid #475569' : 'none',
        padding: effect === 'border' ? '0.75rem' : undefined,
        columnCount: effect === 'columns' ? 2 : 1,
    };
}
export default function LessonDemonstration({
    demo,
    viewed,
    onViewed,
    application = 'Microsoft Word',
}: {
    demo: Demonstration;
    viewed: boolean;
    onViewed: () => void;
    application?: string;
}) {
    const [step, setStep] = useState(0),
        [playing, setPlaying] = useState(false),
        [reduced, setReduced] = useState(false),
        [ended, setEnded] = useState(false);
    const video = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        const media = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => {
            setReduced(media.matches);
            if (media.matches) setPlaying(false);
        };
        update();
        media.addEventListener('change', update);
        return () => media.removeEventListener('change', update);
    }, []);
    useEffect(() => {
        if (!playing || reduced) return;
        const timer = window.setTimeout(() => {
            if (step >= demo.steps.length - 1) setPlaying(false);
            else setStep(step + 1);
        }, 1800);
        return () => window.clearTimeout(timer);
    }, [playing, reduced, step, demo.steps.length]);
    const current = demo.steps[step] ?? demo.steps[0];
    const effect = current?.effect ?? 'normal';
    const isCharacter = [
        'select',
        'bold',
        'italic-underline',
        'font-size',
        'font-color',
        'highlight',
        'copy-paste',
        'clear',
    ].includes(demo.key ?? '');
    return (
        <section
            className="min-w-0 space-y-4 rounded-xl border bg-white p-4"
            aria-label={demo.title}
        >
            <h3 className="text-lg font-bold">
                {demo.title}{' '}
                {demo.is_required && (
                    <span className="text-sm font-normal">· Required</span>
                )}
            </h3>
            <p>{demo.description}</p>
            {demo.media_type === 'video' ? (
                <video
                    ref={video}
                    className="w-full"
                    controls
                    preload="metadata"
                    onEnded={() => setEnded(true)}
                    src={`/demonstrations/${demo.id}/media`}
                    aria-label={demo.title}
                />
            ) : demo.media_type === 'animated_image' ? (
                <>
                    <p>
                        Use the numbered transcript below as the static,
                        reduced-motion alternative.
                    </p>
                    {!reduced && playing ? (
                        <img
                            className="max-h-80 max-w-full object-contain"
                            src={`/demonstrations/${demo.id}/media`}
                            alt={demo.description}
                        />
                    ) : (
                        <p>
                            Animation paused. Read the numbered steps, or choose
                            Play.
                        </p>
                    )}
                </>
            ) : application === 'Microsoft Excel' ? (
                <div className="min-w-0 overflow-hidden rounded-lg border border-emerald-700 bg-emerald-50">
                    <p className="bg-emerald-900 p-3 text-sm font-semibold text-white">
                        Excel guided example · Step {step + 1}
                    </p>
                    <p
                        className="border-b bg-white p-3 text-sm break-words"
                        aria-live="polite"
                    >
                        <strong>Command:</strong> {current?.command}
                    </p>
                    <div
                        className="overflow-x-auto p-3"
                        tabIndex={0}
                        aria-label="Worked worksheet example, scroll horizontally if needed"
                    >
                        <table className="w-full border-collapse bg-white text-left text-sm">
                            <caption className="pb-2 text-left font-semibold">
                                Worked example · Follow the steps in Excel
                            </caption>
                            <tbody>
                                {(current?.text ?? '')
                                    .split('\n')
                                    .map((line, row) => (
                                        <tr key={row}>
                                            <th
                                                scope="row"
                                                className="border bg-emerald-100 p-2"
                                            >
                                                {row + 1}
                                            </th>
                                            {line
                                                .split('|')
                                                .map((cell, col) => (
                                                    <td
                                                        className="min-w-24 border p-2 whitespace-pre-wrap"
                                                        key={col}
                                                    >
                                                        {cell.trim()}
                                                    </td>
                                                ))}
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="p-3 text-sm">
                        This is a worksheet illustration. Values shown are
                        worked examples; CodeLab does not evaluate formulas or
                        run macros.
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg border bg-slate-100">
                    <p className="bg-indigo-950 px-3 py-2 text-sm font-semibold text-white">
                        Practice Simulation · Microsoft Word-style demonstration
                    </p>
                    <div className="flex flex-wrap gap-2 border-b bg-white p-3 text-sm">
                        <span>File</span>
                        <strong>Home</strong>
                        <span>Insert</span>
                        <span>Layout</span>
                        <span>References</span>
                    </div>
                    <div className="border-b bg-indigo-50 p-3">
                        <span className="text-xs font-bold uppercase">
                            Command highlighted
                        </span>
                        <p
                            className="font-semibold break-words"
                            aria-live="polite"
                        >
                            ↳ {current?.command}
                        </p>
                    </div>
                    <div
                        className={`m-3 space-y-4 rounded bg-white p-4 shadow-sm ${effect === 'landscape' ? 'min-h-32' : 'min-h-52'}`}
                    >
                        <p className="text-xs font-bold text-slate-500 uppercase">
                            Before
                        </p>
                        <p
                            className="border-b pb-3 text-sm"
                            style={
                                demo.key === 'clear'
                                    ? {
                                          fontWeight: 700,
                                          color: '#1d4ed8',
                                          backgroundColor: '#fef08a',
                                      }
                                    : undefined
                            }
                        >
                            {sample}
                        </p>
                        <p className="text-xs font-bold text-slate-500 uppercase">
                            Step {step + 1} result
                        </p>
                        {effect === 'table' ? (
                            <table className="w-full border-collapse text-sm">
                                <tbody>
                                    <tr>
                                        <th className="border bg-indigo-100 p-2">
                                            Student
                                        </th>
                                        <th className="border bg-indigo-100 p-2">
                                            Section
                                        </th>
                                    </tr>
                                    <tr>
                                        <td className="border p-2">
                                            Example learner
                                        </td>
                                        <td className="border p-2">Grade 11</td>
                                    </tr>
                                </tbody>
                            </table>
                        ) : effect === 'bullets' || effect === 'numbering' ? (
                            <div className="space-y-2">
                                {['Notebook', 'Ballpen', 'School ID'].map(
                                    (item, index) => (
                                        <p key={item}>
                                            {effect === 'bullets'
                                                ? '•'
                                                : `${index + 1}.`}{' '}
                                            {item}
                                        </p>
                                    ),
                                )}
                            </div>
                        ) : (
                            <p
                                className="max-w-xl break-words whitespace-pre-wrap motion-safe:transition-all motion-safe:duration-300"
                                style={
                                    isCharacter ? undefined : frameStyle(effect)
                                }
                            >
                                {isCharacter ? (
                                    <>
                                        <span style={frameStyle(effect)}>
                                            Our school
                                        </span>
                                        {sample.slice('Our school'.length)}
                                    </>
                                ) : (
                                    (current?.text ?? sample)
                                )}
                                {effect === 'copy'
                                    ? `\n\n${isCharacter ? 'Our school' : sample}`
                                    : ''}
                                {effect === 'picture'
                                    ? '\n▧ [Proportionally resized picture; text remains readable]'
                                    : ''}
                                {effect === 'field'
                                    ? '\n[Automatically updated field / page number]'
                                    : ''}
                            </p>
                        )}
                    </div>
                </div>
            )}
            <p
                role="status"
                className="rounded border-l-4 border-indigo-500 bg-indigo-50 p-3"
            >
                <strong>Step {step + 1}:</strong> {current?.caption}
            </p>
            {reduced && (
                <p>
                    Reduced motion: animation is paused. Use Next step and the
                    numbered instructions.
                </p>
            )}
            <div className="flex flex-wrap gap-2">
                <Button
                    type="button"
                    variant="outline"
                    disabled={reduced || demo.media_type === 'video'}
                    onClick={() => {
                        if (step === demo.steps.length - 1) setStep(0);
                        setPlaying(!playing);
                    }}
                >
                    {playing ? 'Pause' : 'Play'}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                        setStep(0);
                        setPlaying(false);
                        setEnded(false);
                        if (video.current) {
                            video.current.pause();
                            video.current.currentTime = 0;
                        }
                    }}
                >
                    Replay
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    disabled={step === 0}
                    onClick={() => {
                        setPlaying(false);
                        setStep(step - 1);
                    }}
                >
                    Previous step
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    disabled={step === demo.steps.length - 1}
                    onClick={() => {
                        setPlaying(false);
                        setStep(step + 1);
                    }}
                >
                    Next step
                </Button>
            </div>
            <ol className="list-decimal space-y-2 pl-6">
                {demo.steps.map((item, index) => (
                    <li key={index}>
                        <strong>{item.command}:</strong> {item.caption}
                    </li>
                ))}
            </ol>
            {demo.transcript && (
                <details>
                    <summary className="cursor-pointer font-semibold">
                        Text transcript
                    </summary>
                    <p className="whitespace-pre-wrap">{demo.transcript}</p>
                </details>
            )}
            <Button
                type="button"
                disabled={
                    viewed ||
                    (demo.media_type === 'video'
                        ? !ended
                        : step < demo.steps.length - 1)
                }
                onClick={onViewed}
            >
                {viewed ? 'Demonstration viewed' : 'I viewed the demonstration'}
            </Button>
        </section>
    );
}

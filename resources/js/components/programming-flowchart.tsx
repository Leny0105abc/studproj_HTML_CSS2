import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export type Expression = {
    kind: string;
    type?: string;
    value?: string | number | boolean;
    name?: string;
    op?: string;
    left?: Expression;
    right?: Expression;
    array?: Expression;
    index?: Expression;
    items?: Expression[];
    args?: Expression[];
};
export type FlowNode = {
    kind: string;
    label: string;
    name?: string;
    type?: string;
    value?: Expression;
    index?: Expression;
    prompt?: string;
    update?: boolean;
    condition?: Expression;
    then?: string[];
    else?: string[];
    body?: string[];
    counter?: string;
    from?: Expression;
    to?: Expression;
    step?: number;
    cases?: { value: Expression; body: string[] }[];
    default?: string[];
};
export type FlowFunction = {
    name: string;
    params: { name: string; type: string }[];
    returns: string;
    body: string[];
};
export type FlowGraph = {
    version: number;
    start: string;
    end: string;
    body: string[];
    nodes: Record<string, FlowNode>;
    functions: FlowFunction[];
};
const lit = (value = 0): Expression => ({ kind: "literal", type: "int", value });
const ref = (): Expression => ({ kind: "ref", name: "number" });
const condition = (): Expression => ({ kind: "binary", op: ">", left: ref(), right: lit() });
const types = ["int", "real", "bool", "string", "int[]", "real[]", "string[]"];
const fieldClass = "w-full rounded border bg-background p-2 text-sm";
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function ExpressionField({
    label,
    value,
    onChange,
    disabled,
    depth = 0,
}: {
    label: string;
    value: Expression;
    onChange: (e: Expression) => void;
    disabled: boolean;
    depth?: number;
}) {
    if (depth > 12) return <p>Use the structured JSON editor for deeper expressions.</p>;
    const child = (key: "left" | "right" | "array" | "index", initial = lit()) => (
        <ExpressionField
            label={key}
            value={value[key] ?? initial}
            onChange={(e) => onChange({ ...value, [key]: e })}
            disabled={disabled}
            depth={depth + 1}
        />
    );
    return (
        <fieldset disabled={disabled} className="space-y-2 rounded border p-2">
            <legend className="px-1 text-sm font-semibold">{label}</legend>
            <label className="block text-xs">
                Expression kind
                <select
                    className={fieldClass}
                    value={value.kind}
                    onChange={(e) => {
                        const kind = e.target.value;
                        onChange(
                            kind === "literal"
                                ? lit()
                                : kind === "ref"
                                  ? ref()
                                  : kind === "binary"
                                    ? condition()
                                    : kind === "array"
                                      ? { kind, type: "int[]", items: [] }
                                      : kind === "call"
                                        ? { kind, name: "helper", args: [] }
                                        : {
                                              kind,
                                              array: { kind: "ref", name: "values" },
                                              ...(kind === "index" ? { index: lit() } : {}),
                                          },
                        );
                    }}
                >
                    {["literal", "ref", "binary", "array", "index", "length", "call"].map((k) => (
                        <option key={k}>{k}</option>
                    ))}
                </select>
            </label>
            {value.kind === "literal" && (
                <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs">
                        Literal type
                        <select
                            className={fieldClass}
                            value={value.type}
                            onChange={(e) =>
                                onChange({
                                    ...value,
                                    type: e.target.value,
                                    value:
                                        e.target.value === "string"
                                            ? ""
                                            : e.target.value === "bool"
                                              ? false
                                              : 0,
                                })
                            }
                        >
                            {types
                                .filter((t) => !t.endsWith("[]"))
                                .map((t) => (
                                    <option key={t}>{t}</option>
                                ))}
                        </select>
                    </label>
                    <label className="text-xs">
                        Literal value
                        <input
                            className={fieldClass}
                            value={String(value.value ?? "")}
                            type={["int", "real"].includes(value.type ?? "") ? "number" : "text"}
                            step={value.type === "real" ? "any" : 1}
                            onChange={(e) =>
                                onChange({
                                    ...value,
                                    value:
                                        value.type === "bool"
                                            ? e.target.value === "true"
                                            : value.type === "string"
                                              ? e.target.value
                                              : Number(e.target.value),
                                })
                            }
                        />
                    </label>
                </div>
            )}
            {["ref", "call"].includes(value.kind) && (
                <label className="block text-xs">
                    {value.kind === "call" ? "Function name" : "Variable name"}
                    <input
                        className={fieldClass}
                        value={value.name ?? ""}
                        onChange={(e) => onChange({ ...value, name: e.target.value })}
                    />
                </label>
            )}
            {value.kind === "binary" && (
                <>
                    <label className="block text-xs">
                        Operator
                        <select
                            className={fieldClass}
                            value={value.op}
                            onChange={(e) => onChange({ ...value, op: e.target.value })}
                        >
                            {[
                                "+",
                                "-",
                                "*",
                                "/",
                                "%",
                                "<",
                                "<=",
                                ">",
                                ">=",
                                "==",
                                "!=",
                                "and",
                                "or",
                            ].map((op) => (
                                <option key={op}>{op}</option>
                            ))}
                        </select>
                    </label>
                    <div className="space-y-2 border-l-2 pl-2">
                        {child("left")}
                        {child("right")}
                    </div>
                </>
            )}
            {["index", "length"].includes(value.kind) && (
                <>
                    {child("array", ref())}
                    {value.kind === "index" && child("index")}
                </>
            )}
            {["array", "call"].includes(value.kind) && (
                <>
                    {value.kind === "array" && (
                        <label className="block text-xs">
                            Collection type
                            <select
                                className={fieldClass}
                                value={value.type}
                                onChange={(e) => onChange({ ...value, type: e.target.value })}
                            >
                                {types
                                    .filter((t) => t.endsWith("[]"))
                                    .map((t) => (
                                        <option key={t}>{t}</option>
                                    ))}
                            </select>
                        </label>
                    )}
                    {(value.kind === "array" ? value.items : value.args)?.map((item, i) => (
                        <div key={i}>
                            <ExpressionField
                                label={`Item / argument ${i}`}
                                value={item}
                                disabled={disabled}
                                depth={depth + 1}
                                onChange={(e) => {
                                    const key = value.kind === "array" ? "items" : "args";
                                    const list = [...(value[key] ?? [])];
                                    list[i] = e;
                                    onChange({ ...value, [key]: list });
                                }}
                            />
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                    const key = value.kind === "array" ? "items" : "args";
                                    onChange({
                                        ...value,
                                        [key]: value[key]?.filter((_, j) => i !== j),
                                    });
                                }}
                            >
                                Remove item
                            </Button>
                        </div>
                    ))}
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            const key = value.kind === "array" ? "items" : "args";
                            onChange({ ...value, [key]: [...(value[key] ?? []), lit()] });
                        }}
                    >
                        Add item / argument
                    </Button>
                </>
            )}
        </fieldset>
    );
}

type Box = { id: string; x: number; y: number; kind: string; label: string };
type Edge = { points: number[][]; label?: string };
function expressionText(e: Expression | undefined, depth = 0): string {
    if (!e || depth > 30) return "?";
    const text = (child: Expression | undefined) => expressionText(child, depth + 1);
    if (e.kind === "literal") return JSON.stringify(e.value) ?? "?";
    if (e.kind === "ref") return e.name ?? "?";
    if (e.kind === "binary") return `(${text(e.left)} ${e.op} ${text(e.right)})`;
    if (e.kind === "length") return `length(${text(e.array)})`;
    if (e.kind === "index") return `${text(e.array)}[${text(e.index)}]`;
    if (e.kind === "array") return `[${e.items?.map(text).join(", ")}]`;
    if (e.kind === "call") return `${e.name}(${e.args?.map(text).join(", ")})`;
    return "?";
}

function nodeLabel(n: FlowNode): string {
    // Expand authoring defaults into the actual algorithm. A deliberate custom label
    // remains presentation-only; generation still uses the typed configuration.
    const generic =
        !n.label ||
        n.label === n.kind ||
        [
            "Display result",
            "Condition?",
            "Return result",
            "While condition is true",
            "Repeat, then test",
            `Initialize ${n.name}`,
            `Update ${n.name}`,
            `Update ${n.name} element`,
            `For ${n.counter} (end excluded)`,
        ].includes(n.label);
    if (!generic) return n.label;
    if (["declare", "assign"].includes(n.kind)) return `${n.name} = ${expressionText(n.value)}`;
    if (n.kind === "output") return `Output ${expressionText(n.value)}`;
    if (n.kind === "return") return `Return ${expressionText(n.value)}`;
    if (n.kind === "array_set")
        return `${n.name}[${expressionText(n.index)}] = ${expressionText(n.value)}`;
    if (n.kind === "if") return `${expressionText(n.condition)}?`;
    if (n.kind === "while") return `While ${expressionText(n.condition)}`;
    if (n.kind === "do") return "Repeat body";
    if (n.kind === "for")
        return `${n.counter}: ${expressionText(n.from)} ..< ${expressionText(n.to)}; step ${n.step}`;
    return n.label || n.kind;
}
function drawGraph(graph: FlowGraph) {
    const boxes: Box[] = [];
    const edges: Edge[] = [];
    let budget = 2000;
    let pendingReturns: { x: number; y: number }[] = [];
    const put = (id: string, x: number, y: number, kind: string, label: string) =>
        boxes.push({ id, x, y, kind, label });
    const edge = (points: number[][], label?: string) => edges.push({ points, label });
    const width = (ids: string[], visited = new Set<string>()): number =>
        Math.max(
            240,
            ...ids.map((id) => {
                if (visited.has(id)) return 240;
                visited.add(id);
                const n = graph.nodes[id];
                if (!n) return 240;
                if (n.kind === "if")
                    return width(n.then ?? [], visited) + width(n.else ?? [], visited) + 80;
                if (n.kind === "select")
                    return (
                        (n.cases ?? []).reduce((w, c) => w + width(c.body, visited) + 30, 0) +
                        width(n.default ?? [], visited)
                    );
                return n.body ? width(n.body, visited) + 160 : 240;
            }),
        );
    const walk = (ids: string[], x: number, top: number, visited: Set<string>): number => {
        let y = top;
        for (const id of ids) {
            if (--budget < 0) return y;
            const n = graph.nodes[id];
            if (!n || visited.has(id)) {
                put(id, x, y, "error", "Invalid connection");
                y += 100;
                continue;
            }
            visited.add(id);
            put(id, x, y, n.kind, nodeLabel(n));
            if (n.kind === "if" || n.kind === "select") {
                const branches =
                    n.kind === "if"
                        ? [
                              { ids: n.then ?? [], label: "True" },
                              { ids: n.else ?? [], label: "False" },
                          ]
                        : [
                              ...(n.cases ?? []).map((c) => ({
                                  ids: c.body,
                                  label: String(c.value.value),
                              })),
                              { ids: n.default ?? [], label: "Default" },
                          ];
                const widths = branches.map((b) => width(b.ids));
                const total = widths.reduce((a, b) => a + b + 30, -30);
                let left = x - total / 2;
                const ends = branches.map((b, i) => {
                    const bx = left + widths[i] / 2;
                    left += widths[i] + 30;
                    edge(
                        [
                            [x, y + 40],
                            [x, y + 70],
                            [bx, y + 70],
                            [bx, y + 100],
                        ],
                        b.label,
                    );
                    return {
                        x: bx,
                        bottom: walk(b.ids, bx, y + 140, new Set(visited)),
                        returns: graph.nodes[b.ids.at(-1) ?? ""]?.kind === "return",
                    };
                });
                const join = Math.max(...ends.map((e) => e.bottom)) + 10;
                for (const end of ends)
                    if (!end.returns)
                        edge([
                            [end.x, end.bottom - 40],
                            [end.x, join],
                            [x, join],
                        ]);
                put(`${id}_join`, x, join, "connector", "Join");
                edge([
                    [x, join + 8],
                    [x, join + 60],
                ]);
                y = join + 100;
            } else if (["while", "for", "do"].includes(n.kind)) {
                const bw = width(n.body ?? []);
                const begin = y;
                if (n.kind === "do") {
                    edge([
                        [x, y + 40],
                        [x, y + 100],
                    ]);
                    const end = walk(n.body ?? [], x, y + 140, new Set(visited));
                    put(`${id}_test`, x, end, "if", `${expressionText(n.condition)}?`);
                    edge([
                        [x, end - 40],
                        [x, end - 38],
                    ]);
                    edge(
                        [
                            [x - 90, end],
                            [x - bw / 2 - 30, end],
                            [x - bw / 2 - 30, begin + 70],
                            [x, begin + 70],
                        ],
                        "True",
                    );
                    edge(
                        [
                            [x, end + 40],
                            [x, end + 100],
                        ],
                        "False",
                    );
                    y = end + 140;
                } else {
                    edge(
                        [
                            [x, y + 40],
                            [x, y + 100],
                        ],
                        "True",
                    );
                    const end = walk(n.body ?? [], x, y + 140, new Set(visited));
                    edge(
                        [
                            [x, end - 40],
                            [x - bw / 2 - 40, end - 40],
                            [x - bw / 2 - 40, begin],
                            [x - 95, begin],
                        ],
                        "Repeat",
                    );
                    edge(
                        [
                            [x + 95, begin],
                            [x + bw / 2 + 45, begin],
                            [x + bw / 2 + 45, end + 15],
                            [x, end + 15],
                            [x, end + 60],
                        ],
                        "False",
                    );
                    y = end + 100;
                }
            } else if (n.kind === "return") {
                pendingReturns.push({ x, y });
                y += 140;
            } else {
                edge([
                    [x, y + (n.kind === "connector" ? 8 : 35)],
                    [x, y + 100],
                ]);
                y += 140;
            }
        }
        return y;
    };
    let x = width(graph.body) / 2 + 90;
    put("start", x, 60, "terminator", "Start");
    edge([
        [x, 95],
        [x, 160],
    ]);
    const bottom = walk(graph.body, x, 200, new Set());
    put("end", x, bottom, "terminator", "End");
    let height = bottom + 90;
    for (const f of graph.functions) {
        pendingReturns = [];
        x = Math.max(x, width(f.body) / 2 + 90);
        put(`fn_${f.name}`, x, height + 40, "terminator", `Function ${f.name}`);
        edge([
            [x, height + 75],
            [x, height + 140],
        ]);
        const end = walk(f.body, x, height + 180, new Set());
        put(`return_${f.name}`, x, end, "terminator", "Return to caller");
        for (const ret of pendingReturns) {
            if (ret.x === x && ret.y === end - 140)
                edge([
                    [ret.x, ret.y + 35],
                    [x, end - 35],
                ]);
            else
                edge(
                    [
                        [ret.x - 95, ret.y],
                        [40, ret.y],
                        [40, end],
                        [x - 95, end],
                    ],
                    "Return",
                );
        }
        height = end + 100;
    }
    const allX = [
        ...boxes.map((b) => b.x + 160),
        ...edges.flatMap((e) => e.points.map((p) => p[0] + 30)),
    ];
    return { boxes, edges, width: Math.max(500, ...allX), height: Math.max(500, height) };
}

export function FlowDiagram({
    graph,
    selected,
    onSelect,
    onDropNode,
}: {
    graph: FlowGraph;
    selected?: string;
    onSelect: (id: string) => void;
    onDropNode?: (kind: string) => void;
}) {
    const [zoom, setZoom] = useState(0.8);
    const [exportError, setExportError] = useState("");
    const svg = useRef<SVGSVGElement>(null);
    const scroller = useRef<HTMLDivElement>(null);
    const pan = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
    const drawing = useMemo(() => drawGraph(graph), [graph]);
    const download = async (png: boolean) => {
        if (!svg.current) return;
        setExportError("");
        const xml = new XMLSerializer().serializeToString(svg.current);
        const blob = new Blob([xml], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        let imageUrl: string | undefined;
        const a = document.createElement("a");
        a.download = png ? "flowchart.png" : "flowchart.svg";
        try {
            if (png) {
                const canvas = document.createElement("canvas");
                const scale = Math.min(1, 8000 / drawing.height, 4000 / drawing.width);
                canvas.width = drawing.width * scale;
                canvas.height = drawing.height * scale;
                const ctx = canvas.getContext("2d");
                if (!ctx) throw new Error("Canvas unavailable");
                ctx.fillStyle = "#fff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.scale(scale, scale);
                // Paint the same layout directly. This avoids SVG-image loading and keeps
                // the download inside the original click gesture in embedded browsers.
                for (const edge of drawing.edges) {
                    ctx.strokeStyle = "#64748b";
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    edge.points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
                    ctx.stroke();
                    const end = edge.points.at(-1)!;
                    const previous = edge.points.at(-2)!;
                    const angle = Math.atan2(end[1] - previous[1], end[0] - previous[0]);
                    ctx.fillStyle = "#64748b";
                    ctx.beginPath();
                    ctx.moveTo(end[0], end[1]);
                    ctx.lineTo(
                        end[0] - 9 * Math.cos(angle - Math.PI / 6),
                        end[1] - 9 * Math.sin(angle - Math.PI / 6),
                    );
                    ctx.lineTo(
                        end[0] - 9 * Math.cos(angle + Math.PI / 6),
                        end[1] - 9 * Math.sin(angle + Math.PI / 6),
                    );
                    ctx.closePath();
                    ctx.fill();
                    if (edge.label) {
                        ctx.font = "12px sans-serif";
                        ctx.textAlign = "left";
                        ctx.fillText(
                            edge.label,
                            (edge.points[0][0] + edge.points[1][0]) / 2 + 8,
                            (edge.points[0][1] + edge.points[1][1]) / 2 - 8,
                        );
                    }
                }
                for (const box of drawing.boxes) {
                    const { x, y, kind, id } = box;
                    const isCall = graph.nodes[id]?.value?.kind === "call";
                    ctx.fillStyle =
                        selected === id
                            ? "#ddd6fe"
                            : ["input", "output"].includes(kind)
                              ? "#e0f2fe"
                              : ["if", "select", "for", "while"].includes(kind)
                                ? "#fef3c7"
                                : "#ffffff";
                    ctx.strokeStyle = selected === id ? "#6d28d9" : "#64748b";
                    ctx.lineWidth = selected === id ? 3 : 1.5;
                    ctx.beginPath();
                    if (kind === "connector") ctx.arc(x, y, 8, 0, Math.PI * 2);
                    else if (["if", "select", "while", "for"].includes(kind)) {
                        ctx.moveTo(x, y - 40);
                        ctx.lineTo(x + 95, y);
                        ctx.lineTo(x, y + 40);
                        ctx.lineTo(x - 95, y);
                        ctx.closePath();
                    } else if (["input", "output"].includes(kind) && !isCall) {
                        ctx.moveTo(x - 80, y - 35);
                        ctx.lineTo(x + 100, y - 35);
                        ctx.lineTo(x + 80, y + 35);
                        ctx.lineTo(x - 100, y + 35);
                        ctx.closePath();
                    } else ctx.roundRect(x - 95, y - 35, 190, 70, kind === "terminator" ? 35 : 4);
                    ctx.fill();
                    ctx.stroke();
                    if (isCall) {
                        ctx.beginPath();
                        ctx.moveTo(x - 75, y - 30);
                        ctx.lineTo(x - 75, y + 30);
                        ctx.moveTo(x + 75, y - 30);
                        ctx.lineTo(x + 75, y + 30);
                        ctx.stroke();
                    }
                    if (kind !== "connector") {
                        ctx.textAlign = "center";
                        ctx.fillStyle = "#0f172a";
                        ctx.font = "12px sans-serif";
                        ctx.fillText(box.label.slice(0, 26), x, y - 13);
                        ctx.fillText(box.label.slice(26, 52), x, y + 2);
                        ctx.fillStyle = "#475569";
                        ctx.font = "10px sans-serif";
                        ctx.fillText(`${kind} · ${id}`, x, y + 17);
                    }
                }
                const encoded = atob(canvas.toDataURL("image/png").split(",")[1]);
                const imageBlob = new Blob(
                    [Uint8Array.from(encoded, (char) => char.charCodeAt(0))],
                    { type: "image/png" },
                );
                imageUrl = URL.createObjectURL(imageBlob);
                a.href = imageUrl;
            } else a.href = url;
            document.body.appendChild(a);
            a.click();
        } catch (error) {
            setExportError(`Export failed: ${String(error)}. Try SVG export.`);
        } finally {
            a.remove();
            window.setTimeout(() => {
                URL.revokeObjectURL(url);
                if (imageUrl) URL.revokeObjectURL(imageUrl);
            }, 1000);
        }
    };
    return (
        <section className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                <h2 className="mr-auto font-bold">One flowchart</h2>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))}
                    aria-label="Zoom out"
                >
                    −
                </Button>
                <span>{Math.round(zoom * 100)}%</span>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
                    aria-label="Zoom in"
                >
                    +
                </Button>
                <Button size="sm" variant="outline" onClick={() => void download(false)}>
                    SVG
                </Button>
                <Button size="sm" variant="outline" onClick={() => void download(true)}>
                    PNG
                </Button>
            </div>
            {exportError && (
                <p role="alert" className="text-sm text-red-700">
                    {exportError}
                </p>
            )}
            <p className="text-xs text-muted-foreground">
                Select a symbol to inspect its configuration and equivalent code. Drag the
                background to pan; scroll to explore. Drop a palette symbol here to add it to Main.
            </p>
            <div
                ref={scroller}
                className="h-[640px] overflow-auto rounded-xl border bg-slate-50"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault();
                    const kind = e.dataTransfer.getData("codelab-node");
                    if (kind) onDropNode?.(kind);
                }}
                onPointerDown={(e) => {
                    if ((e.target as Element).closest("[data-node]")) return;
                    pan.current = {
                        x: e.clientX,
                        y: e.clientY,
                        left: e.currentTarget.scrollLeft,
                        top: e.currentTarget.scrollTop,
                    };
                    e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                    if (!pan.current) return;
                    e.currentTarget.scrollLeft = pan.current.left - e.clientX + pan.current.x;
                    e.currentTarget.scrollTop = pan.current.top - e.clientY + pan.current.y;
                }}
                onPointerUp={() => {
                    pan.current = null;
                }}
            >
                <svg
                    ref={svg}
                    xmlns="http://www.w3.org/2000/svg"
                    width={drawing.width}
                    height={drawing.height}
                    viewBox={`0 0 ${drawing.width} ${drawing.height}`}
                    style={{ width: drawing.width * zoom, height: drawing.height * zoom }}
                    role="group"
                    aria-label="Structured algorithm flowchart"
                >
                    <defs>
                        <marker
                            id="cl-arrow"
                            viewBox="0 0 10 10"
                            refX="9"
                            refY="5"
                            markerWidth="7"
                            markerHeight="7"
                            orient="auto-start-reverse"
                        >
                            <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
                        </marker>
                    </defs>
                    {drawing.edges.map((edge, i) => (
                        <g key={i}>
                            <polyline
                                points={edge.points.map((p) => p.join(",")).join(" ")}
                                fill="none"
                                stroke="#64748b"
                                strokeWidth="2"
                                markerEnd="url(#cl-arrow)"
                            />
                            {edge.label && (
                                <text
                                    x={(edge.points[0][0] + edge.points[1][0]) / 2 + 8}
                                    y={(edge.points[0][1] + edge.points[1][1]) / 2 - 8}
                                    fontSize="12"
                                    fontFamily="sans-serif"
                                    fill="#475569"
                                >
                                    {edge.label}
                                </text>
                            )}
                        </g>
                    ))}
                    {drawing.boxes.map((box) => {
                        const { x, y, kind, id } = box;
                        const isCall = graph.nodes[id]?.value?.kind === "call";
                        const fill =
                            selected === id
                                ? "#ddd6fe"
                                : ["input", "output"].includes(kind)
                                  ? "#e0f2fe"
                                  : ["if", "select", "for", "while"].includes(kind)
                                    ? "#fef3c7"
                                    : "#ffffff";
                        const common = {
                            fill,
                            stroke: selected === id ? "#6d28d9" : "#64748b",
                            strokeWidth: selected === id ? 3 : 1.5,
                        };
                        return (
                            <g
                                key={id}
                                data-node={id}
                                tabIndex={0}
                                role="button"
                                aria-label={`${kind}: ${box.label}`}
                                onClick={() =>
                                    onSelect(
                                        id.endsWith("_test") || id.endsWith("_join")
                                            ? id.slice(0, -5)
                                            : id,
                                    )
                                }
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        onSelect(
                                            id.endsWith("_test") || id.endsWith("_join")
                                                ? id.slice(0, -5)
                                                : id,
                                        );
                                    }
                                }}
                                style={{ cursor: "pointer" }}
                            >
                                <title>{box.label}</title>
                                {kind === "connector" ? (
                                    <circle cx={x} cy={y} r="8" {...common} />
                                ) : ["if", "select", "while", "for"].includes(kind) ? (
                                    <polygon
                                        points={`${x},${y - 40} ${x + 95},${y} ${x},${y + 40} ${x - 95},${y}`}
                                        {...common}
                                    />
                                ) : ["input", "output"].includes(kind) && !isCall ? (
                                    <polygon
                                        points={`${x - 80},${y - 35} ${x + 100},${y - 35} ${x + 80},${y + 35} ${x - 100},${y + 35}`}
                                        {...common}
                                    />
                                ) : (
                                    <rect
                                        x={x - 95}
                                        y={y - 35}
                                        width="190"
                                        height="70"
                                        rx={kind === "terminator" ? 35 : 4}
                                        {...common}
                                    />
                                )}
                                {isCall && (
                                    <>
                                        <line
                                            x1={x - 75}
                                            y1={y - 30}
                                            x2={x - 75}
                                            y2={y + 30}
                                            stroke="#64748b"
                                        />
                                        <line
                                            x1={x + 75}
                                            y1={y - 30}
                                            x2={x + 75}
                                            y2={y + 30}
                                            stroke="#64748b"
                                        />
                                    </>
                                )}
                                {kind !== "connector" && (
                                    <text
                                        x={x}
                                        y={y - 13}
                                        textAnchor="middle"
                                        fontSize="12"
                                        fontFamily="sans-serif"
                                        fill="#0f172a"
                                    >
                                        <tspan x={x}>{box.label.slice(0, 26)}</tspan>
                                        <tspan x={x} dy="15">
                                            {box.label.slice(26, 52)}
                                        </tspan>
                                        <tspan x={x} dy="15" fontSize="10" fill="#475569">
                                            {kind} · {id}
                                        </tspan>
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>
        </section>
    );
}

function blocks(
    graph: FlowGraph,
): { name: string; ids: string[]; apply: (ids: string[]) => void }[] {
    const result = [
        {
            name: "Main",
            ids: graph.body,
            apply: (ids: string[]) => {
                graph.body = ids;
            },
        },
    ];
    for (const f of graph.functions)
        result.push({
            name: `Function ${f.name}`,
            ids: f.body,
            apply: (ids) => {
                f.body = ids;
            },
        });
    for (const [id, n] of Object.entries(graph.nodes)) {
        for (const key of ["then", "else", "body", "default"] as const)
            if (n[key])
                result.push({
                    name: `${id}.${key}`,
                    ids: n[key],
                    apply: (ids) => {
                        n[key] = ids;
                    },
                });
        n.cases?.forEach((c, i) =>
            result.push({
                name: `${id}.case${i}`,
                ids: c.body,
                apply: (ids) => {
                    c.body = ids;
                },
            }),
        );
    }
    return result;
}

const defaults = (kind: string): FlowNode => ({
    kind,
    label: kind,
    ...(kind === "input"
        ? { name: "number", type: "int", prompt: "", update: false }
        : kind === "declare"
          ? { name: "total", type: "int", value: lit() }
          : kind === "assign"
            ? { name: "total", value: ref() }
            : kind === "array_set"
              ? { name: "values", index: lit(), value: lit() }
              : ["output", "return"].includes(kind)
                ? { value: ref() }
                : kind === "if"
                  ? { condition: condition(), then: [], else: [] }
                  : kind === "for"
                    ? { counter: "i", from: lit(), to: lit(5), step: 1, body: [] }
                    : ["while", "do"].includes(kind)
                      ? { condition: condition(), body: [] }
                      : kind === "select"
                        ? { value: ref(), cases: [{ value: lit(1), body: [] }], default: [] }
                        : {}),
});

export default function ProgrammingFlowchart({
    graph,
    onChange,
    selected,
    onSelect,
    disabled,
}: {
    graph: FlowGraph;
    onChange: (graph: FlowGraph) => void;
    selected?: string;
    onSelect: (id: string) => void;
    disabled: boolean;
}) {
    const [target, setTarget] = useState("Main");
    const [position, setPosition] = useState(0);
    const [json, setJson] = useState("");
    const [error, setError] = useState("");
    const [fnName, setFnName] = useState("helper");
    const [fnType, setFnType] = useState("real");
    const [params, setParams] = useState("[]");
    const node = selected ? graph.nodes[selected] : undefined;
    const update = (patch: Partial<FlowNode>) => {
        if (!selected || disabled) return;
        onChange({
            ...graph,
            nodes: { ...graph.nodes, [selected]: { ...graph.nodes[selected], ...patch } },
        });
    };
    const add = (kind: string) => {
        if (disabled) return;
        const next = clone(graph);
        const id = `node_${Date.now().toString(36)}`;
        next.nodes[id] = defaults(kind);
        const block = blocks(next).find((b) => b.name === target) ?? blocks(next)[0];
        block.ids.push(id);
        onChange(next);
        onSelect(id);
    };
    const connect = (remove = false) => {
        if (!selected || disabled) return;
        const next = clone(graph);
        for (const b of blocks(next)) b.apply(b.ids.filter((id) => id !== selected));
        if (remove) {
            delete next.nodes[selected];
        } else {
            const b = blocks(next).find((b) => b.name === target);
            if (!b) return;
            const ids = [...b.ids];
            ids.splice(Math.max(0, Math.min(position, ids.length)), 0, selected);
            b.apply(ids);
        }
        onChange(next);
    };
    return (
        <div className="space-y-4">
            <FlowDiagram graph={graph} selected={selected} onSelect={onSelect} onDropNode={add} />
            <fieldset disabled={disabled} className="space-y-3 rounded-xl border p-4">
                <legend className="font-semibold">Visual builder</legend>
                <div className="flex flex-wrap gap-2">
                    {[
                        "input",
                        "declare",
                        "assign",
                        "output",
                        "if",
                        "select",
                        "while",
                        "for",
                        "do",
                        "array_set",
                        "return",
                        "connector",
                    ].map((kind) => (
                        <button
                            key={kind}
                            type="button"
                            draggable={!disabled}
                            onDragStart={(e) => e.dataTransfer.setData("codelab-node", kind)}
                            onClick={() => add(kind)}
                            className="rounded border bg-background px-2 py-1 text-sm disabled:opacity-50"
                        >
                            + {kind}
                        </button>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground">
                    Start and End are fixed. Ordered block members define connections. Branches
                    rejoin and loops return to their test; arbitrary jumps are rejected.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                    <label className="text-xs">
                        Destination block
                        <select
                            className={fieldClass}
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                        >
                            {blocks(graph).map((b) => (
                                <option key={b.name}>{b.name}</option>
                            ))}
                        </select>
                    </label>
                    <label className="text-xs">
                        Insert at position (zero based)
                        <input
                            type="number"
                            min="0"
                            className={fieldClass}
                            value={position}
                            onChange={(e) => setPosition(Number(e.target.value))}
                        />
                    </label>
                </div>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={!node || disabled}
                        onClick={() => connect()}
                    >
                        Connect selected node
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={!node || disabled}
                        onClick={() => connect(true)}
                    >
                        Delete selected node
                    </Button>
                </div>
                {node && (
                    <div className="space-y-3 border-t pt-3">
                        <h3 className="font-semibold">
                            {selected} · {node.kind}
                        </h3>
                        <label className="block text-xs">
                            Presentation label
                            <input
                                className={fieldClass}
                                value={node.label}
                                onChange={(e) => update({ label: e.target.value })}
                            />
                        </label>
                        {node.name !== undefined && (
                            <label className="block text-xs">
                                Typed variable name
                                <input
                                    className={fieldClass}
                                    value={node.name}
                                    onChange={(e) => update({ name: e.target.value })}
                                />
                            </label>
                        )}
                        {node.type && (
                            <label className="block text-xs">
                                Variable type
                                <select
                                    className={fieldClass}
                                    value={node.type}
                                    onChange={(e) => update({ type: e.target.value })}
                                >
                                    {types.map((t) => (
                                        <option key={t}>{t}</option>
                                    ))}
                                </select>
                            </label>
                        )}
                        {node.kind === "input" && (
                            <>
                                <label className="block text-xs">
                                    Input prompt
                                    <input
                                        className={fieldClass}
                                        value={node.prompt ?? ""}
                                        onChange={(e) => update({ prompt: e.target.value })}
                                    />
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={node.update ?? false}
                                        onChange={(e) => update({ update: e.target.checked })}
                                    />
                                    Update an already declared variable
                                </label>
                            </>
                        )}
                        {node.value && (
                            <ExpressionField
                                label="Value expression"
                                value={node.value}
                                disabled={disabled}
                                onChange={(value) => update({ value })}
                            />
                        )}
                        {node.index && (
                            <ExpressionField
                                label="Array index (int)"
                                value={node.index}
                                disabled={disabled}
                                onChange={(index) => update({ index })}
                            />
                        )}
                        {node.condition && (
                            <ExpressionField
                                label="Condition (bool)"
                                value={node.condition}
                                disabled={disabled}
                                onChange={(condition) => update({ condition })}
                            />
                        )}
                        {node.kind === "for" && (
                            <>
                                <label className="block text-xs">
                                    Loop counter
                                    <input
                                        className={fieldClass}
                                        value={node.counter}
                                        onChange={(e) => update({ counter: e.target.value })}
                                    />
                                </label>
                                <ExpressionField
                                    label="From (int, included)"
                                    value={node.from ?? lit()}
                                    onChange={(from) => update({ from })}
                                    disabled={disabled}
                                />
                                <ExpressionField
                                    label="To (int, excluded)"
                                    value={node.to ?? lit()}
                                    onChange={(to) => update({ to })}
                                    disabled={disabled}
                                />
                                <label className="block text-xs">
                                    Nonzero integer step
                                    <input
                                        className={fieldClass}
                                        type="number"
                                        value={node.step}
                                        onChange={(e) => update({ step: Number(e.target.value) })}
                                    />
                                </label>
                            </>
                        )}
                        {node.kind === "select" && (
                            <>
                                {node.cases?.map((c, i) => (
                                    <ExpressionField
                                        key={i}
                                        label={`Case ${i} literal`}
                                        value={c.value}
                                        disabled={disabled}
                                        onChange={(value) =>
                                            update({
                                                cases: node.cases?.map((entry, j) =>
                                                    j === i ? { ...entry, value } : entry,
                                                ),
                                            })
                                        }
                                    />
                                ))}
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                        update({
                                            cases: [
                                                ...(node.cases ?? []),
                                                {
                                                    value: lit((node.cases?.length ?? 0) + 1),
                                                    body: [],
                                                },
                                            ],
                                        })
                                    }
                                >
                                    Add selection case
                                </Button>
                            </>
                        )}
                    </div>
                )}
            </fieldset>
            <details className="rounded-xl border p-4">
                <summary className="cursor-pointer font-semibold">
                    Functions and structured graph import
                </summary>
                <fieldset disabled={disabled} className="mt-3 space-y-3">
                    <p className="text-sm">
                        Create a helper, then add nodes to its function block and finish with a
                        return node. Helpers may call earlier helpers. Array parameters are copied.
                    </p>
                    <label className="block text-xs">
                        Function name
                        <input
                            className={fieldClass}
                            value={fnName}
                            onChange={(e) => setFnName(e.target.value)}
                        />
                    </label>
                    <label className="block text-xs">
                        Return type
                        <select
                            className={fieldClass}
                            value={fnType}
                            onChange={(e) => setFnType(e.target.value)}
                        >
                            {types
                                .filter((t) => !t.endsWith("[]"))
                                .map((t) => (
                                    <option key={t}>{t}</option>
                                ))}
                        </select>
                    </label>
                    <label className="block text-xs">
                        Parameters as typed JSON (e.g. [
                        {JSON.stringify({ name: "x", type: "real" })}])
                        <textarea
                            className={`${fieldClass} font-mono`}
                            value={params}
                            onChange={(e) => setParams(e.target.value)}
                        />
                    </label>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            try {
                                const parsed = JSON.parse(params) as FlowFunction["params"];
                                if (!Array.isArray(parsed))
                                    throw new Error("Parameters must be an array.");
                                onChange({
                                    ...graph,
                                    functions: [
                                        ...graph.functions,
                                        { name: fnName, params: parsed, returns: fnType, body: [] },
                                    ],
                                });
                                setError("");
                            } catch (e) {
                                setError(String(e));
                            }
                        }}
                    >
                        Add function
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setJson(JSON.stringify(graph, null, 2))}
                    >
                        Load graph into JSON editor
                    </Button>
                    <label className="block text-xs">
                        Structured graph JSON
                        <textarea
                            className={`${fieldClass} min-h-48 font-mono`}
                            value={json}
                            onChange={(e) => setJson(e.target.value)}
                        />
                    </label>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            try {
                                const parsed = JSON.parse(json) as FlowGraph;
                                if (
                                    parsed.version !== 1 ||
                                    !parsed.nodes ||
                                    !Array.isArray(parsed.body) ||
                                    !Array.isArray(parsed.functions) ||
                                    Object.keys(parsed.nodes).length > 500
                                )
                                    throw new Error(
                                        "Expected a version 1 graph with nodes, body, and functions.",
                                    );
                                onChange(parsed);
                                setError("");
                            } catch (e) {
                                setError(String(e));
                            }
                        }}
                    >
                        Import graph
                    </Button>
                    {error && (
                        <p role="alert" className="text-red-700">
                            {error}
                        </p>
                    )}
                </fieldset>
            </details>
        </div>
    );
}

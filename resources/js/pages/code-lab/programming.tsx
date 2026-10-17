import { Head, Link, router } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import ProgrammingFlowchart, { type FlowGraph } from "@/components/programming-flowchart";
import PythonEditor from "@/components/python-editor";
import CppEditor from "@/components/cpp-editor";
import JavaEditor from "@/components/java-editor";
import LessonTeacherReview, { type TeacherReview } from "@/components/lesson-teacher-review";
import { Button } from "@/components/ui/button";

type Language = "python" | "cpp" | "java";
type Programs = Record<Language, { code: string; nodes: (string | null)[] }>;
type Work = {
    graph: FlowGraph;
    codes: Record<Language, string>;
    input: string;
    analysis: string;
    algorithm: string;
    pseudocode: string;
    test_notes: string;
    documentation?: string;
    mode: "learn" | "guided" | "challenge";
};
type Content = {
    number: number;
    title: string;
    topics: string[];
    prerequisites: string;
    duration: number;
    problem: string;
    inputs: string;
    process: string;
    outputs: string;
    discussion: string;
    graph: FlowGraph;
    plan: { algorithm: string[]; pseudocode: string };
    code_explanation: string;
    tests: { name: string; input: string; expected: string }[];
    exercises: Record<string, string[]>;
};
type Props = {
    initialPrograms: Programs;
    lesson: {
        id: number;
        title: string;
        level: string;
        course: { slug: string };
        objectives: string[];
        programming_content: Content;
        starter_python: string;
        starter_cpp: string;
        starter_java: string;
        quiz: { question: string; choices: string[] }[];
        rubric?: Record<string, number>;
    };
    workspace: {
        programming_workspace?: Work;
        version: number;
        quiz_score?: number;
        status: string;
        quiz_passed_at?: string;
    };
    readOnly: boolean;
    javaExecutionAvailable: boolean;
    feedback: TeacherReview | null;
    previousLesson?: { id: number; title: string };
    nextLesson?: { id: number; title: string; unlocked: boolean };
};
const languages: Language[] = ["python", "cpp", "java"];
const names = { python: "Python", cpp: "C++", java: "Java" };
const headers = () => ({
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-XSRF-TOKEN": decodeURIComponent(
        document.cookie
            .split("; ")
            .find((s) => s.startsWith("XSRF-TOKEN="))
            ?.slice(11) ?? "",
    ),
});
const fieldClass = "min-h-28 w-full rounded-xl border bg-background p-3 text-sm";

function ProgrammingLesson({
    lesson,
    initialPrograms,
    workspace,
    readOnly,
    javaExecutionAvailable,
    feedback,
    previousLesson,
    nextLesson,
}: Props) {
    const content = lesson.programming_content;
    const [work, setWork] = useState<Work>(
        () =>
            workspace.programming_workspace ?? {
                graph: content.graph,
                codes: {
                    python: lesson.starter_python,
                    cpp: lesson.starter_cpp,
                    java: lesson.starter_java,
                },
                input: content.tests[0].input,
                analysis: "",
                algorithm: "",
                pseudocode: "",
                test_notes: "",
                mode: "learn",
            },
    );
    const [language, setLanguage] = useState<Language>("python");
    const [compare, setCompare] = useState(false);
    const [selected, setSelected] = useState<string>();
    const [programs, setPrograms] = useState<Programs | undefined>(initialPrograms);
    const [generatedGraph, setGeneratedGraph] = useState(JSON.stringify(content.graph));
    const [version, setVersion] = useState(workspace.version);
    const [busy, setBusy] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [past, setPast] = useState<FlowGraph[]>([]);
    const [future, setFuture] = useState<FlowGraph[]>([]);
    const [issues, setIssues] = useState("");
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [quizResult, setQuizResult] = useState<{
        score: number;
        feedback: { correct: boolean; explanation: string }[];
    }>();
    const [hint, setHint] = useState(0);
    const mounted = useRef(true);
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);
    useEffect(() => {
        const warn = (event: BeforeUnloadEvent) => {
            if (dirty) event.preventDefault();
        };
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [dirty]);
    const change = (patch: Partial<Work>) => {
        if (readOnly || busy) return;
        setWork((w) => ({ ...w, ...patch }));
        setDirty(true);
    };
    const graphChange = (graph: FlowGraph) => {
        setPast((p) => [...p.slice(-39), work.graph]);
        setFuture([]);
        change({ graph });
    };
    const undo = () => {
        const graph = past.at(-1);
        if (!graph) return;
        setFuture((f) => [...f, work.graph]);
        setPast((p) => p.slice(0, -1));
        change({ graph });
    };
    const redo = () => {
        const graph = future.at(-1);
        if (!graph) return;
        setPast((p) => [...p, work.graph]);
        setFuture((f) => f.slice(0, -1));
        change({ graph });
    };
    const generate = async () => {
        setBusy(true);
        setIssues("");
        try {
            const response = await fetch(`/code-lab/${lesson.id}/programming/generate`, {
                method: "POST",
                headers: headers(),
                body: JSON.stringify({ graph: work.graph }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message ?? "Validation failed.");
            if (!mounted.current) return;
            setPrograms(data.programs);
            setGeneratedGraph(JSON.stringify(work.graph));
            if (!readOnly) {
                setWork((w) => ({
                    ...w,
                    codes: Object.fromEntries(
                        languages.map((l) => [l, data.programs[l].code]),
                    ) as Work["codes"],
                }));
                setDirty(true);
            }
            toast.success(
                "Structured graph validated. Three source programs generated; run each to verify its behavior.",
            );
        } catch (e) {
            if (mounted.current) setIssues(String(e));
        } finally {
            if (mounted.current) setBusy(false);
        }
    };
    const save = async (submit = false) => {
        if (readOnly || busy) return;
        setBusy(true);
        setIssues("");
        try {
            const response = await fetch(
                `/code-lab/${lesson.id}/programming/${submit ? "submit" : "save"}`,
                {
                    method: submit ? "POST" : "PUT",
                    headers: headers(),
                    body: JSON.stringify({ version, workspace: work }),
                },
            );
            const data = await response.json();
            if (!response.ok)
                throw new Error(
                    Object.values(data.errors ?? {})
                        .flat()
                        .join(" ") ||
                        data.message ||
                        "Save failed.",
                );
            if (!mounted.current) return;
            setVersion(data.version);
            setDirty(false);
            toast.success(data.message);
            if (submit)
                router.reload({ only: ["workspace", "feedback", "nextLesson", "readOnly"] });
        } catch (e) {
            if (mounted.current) setIssues(String(e));
        } finally {
            if (mounted.current) setBusy(false);
        }
    };
    const quiz = async () => {
        setBusy(true);
        try {
            const response = await fetch(`/code-lab/${lesson.id}/quiz`, {
                method: "POST",
                headers: headers(),
                body: JSON.stringify({ answers: lesson.quiz.map((_, i) => answers[i]) }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message ?? "Quiz failed.");
            if (!mounted.current) return;
            setQuizResult(data);
            toast(
                data.passed
                    ? "Quiz passed. Teacher approval is required to complete the lesson."
                    : data.message,
            );
            router.reload({ only: ["workspace", "feedback", "nextLesson", "readOnly"] });
        } catch (e) {
            toast.error(String(e));
        } finally {
            if (mounted.current) setBusy(false);
        }
    };
    const setCode = (lang: Language, code: string) =>
        change({ codes: { ...work.codes, [lang]: code } });
    const sourceMatches = generatedGraph === JSON.stringify(work.graph);
    const renderEditor = (lang: Language) => {
        const props = {
            code: work.codes[lang],
            onChange: (code: string) => setCode(lang, code),
            starter: programs?.[lang].code ?? lesson[`starter_${lang}`],
            input: work.input,
            onInput: (input: string) => change({ input }),
            readOnly: readOnly || busy,
            onSave: () => void save(),
        };
        return (
            <div key={lang} className="min-w-0 space-y-3">
                <h3 className="font-bold">{names[lang]}</h3>
                {lang === "python" ? (
                    <PythonEditor {...props} />
                ) : lang === "cpp" ? (
                    <CppEditor {...props} rules={{ test_cases: content.tests }} />
                ) : (
                    <>
                        <p className="text-sm text-muted-foreground">
                            {javaExecutionAvailable
                                ? "Uses the existing isolated Java execution service."
                                : "Java execution is unavailable. The source remains available to compile as Main.java in a supported environment."}
                        </p>
                        <JavaEditor
                            {...props}
                            lessonId={javaExecutionAvailable ? lesson.id : undefined}
                        />
                    </>
                )}
            </div>
        );
    };
    return (
        <>
            <Head title={lesson.title} />
            <main className="soft-grid space-y-6 p-4 sm:p-6">
                <Link href={`/courses/${lesson.course.slug}`} className="text-sm">
                    ← Introduction to Programming
                </Link>
                <header className="space-y-3">
                    <p className="text-sm font-semibold text-indigo-700">
                        {lesson.level} · Lesson {content.number} of 30 · {content.duration} minutes
                    </p>
                    <h1 className="text-2xl font-bold sm:text-3xl">{lesson.title}</h1>
                    <p className="text-sm text-muted-foreground">
                        Problem → Algorithm → Pseudocode → Flowchart → Python / C++ / Java → Run →
                        Compare → Debug
                    </p>
                    <p className="text-sm">Prerequisites: {content.prerequisites}</p>
                    <ul className="list-disc space-y-1 pl-5 text-sm">
                        {lesson.objectives.map((o) => (
                            <li key={o}>{o}</li>
                        ))}
                    </ul>
                </header>
                <LessonTeacherReview review={feedback} />
                <nav aria-label="Learning mode" className="flex flex-wrap gap-2">
                    {(["learn", "guided", "challenge"] as const).map((mode) => (
                        <Button
                            key={mode}
                            variant={work.mode === mode ? "default" : "outline"}
                            disabled={readOnly || busy}
                            onClick={() => change({ mode })}
                        >
                            {mode === "learn"
                                ? "1 · Learn"
                                : mode === "guided"
                                  ? "2 · Guided practice"
                                  : "3 · Independent challenge"}
                        </Button>
                    ))}
                </nav>
                <article className="space-y-4 rounded-2xl border bg-card p-5">
                    <h2 className="text-xl font-bold">Understand the logic</h2>
                    <p className="text-sm font-medium">{content.topics.join(" · ")}</p>
                    <div className="space-y-3 leading-relaxed">
                        {content.discussion.split("\n\n").map((p) => (
                            <p key={p}>{p}</p>
                        ))}
                    </div>
                    <h3 className="font-bold">Problem analysis</h3>
                    <p>{content.problem}</p>
                    <dl className="grid gap-3 md:grid-cols-3">
                        {[
                            ["Input", content.inputs],
                            ["Process", content.process],
                            ["Output", content.outputs],
                        ].map(([name, text]) => (
                            <div key={name} className="rounded-xl bg-muted p-3">
                                <dt className="font-semibold">{name}</dt>
                                <dd className="mt-1 text-sm">{text}</dd>
                            </div>
                        ))}
                    </dl>
                    {work.mode === "learn" && (
                        <div className="grid gap-4 lg:grid-cols-2">
                            <section>
                                <h3 className="mb-2 font-bold">Numbered algorithm</h3>
                                <pre className="max-h-96 overflow-auto rounded-xl bg-muted p-3 text-sm whitespace-pre-wrap">
                                    {content.plan.algorithm.join("\n")}
                                </pre>
                            </section>
                            <section>
                                <h3 className="mb-2 font-bold">Pseudocode</h3>
                                <pre className="max-h-96 overflow-auto rounded-xl bg-muted p-3 text-sm">
                                    {content.plan.pseudocode}
                                </pre>
                            </section>
                        </div>
                    )}
                    {work.mode === "guided" && (
                        <section className="space-y-3 rounded-xl bg-indigo-50 p-4 text-indigo-950">
                            <h3 className="font-bold">Build the plan in stages</h3>
                            <p>
                                Begin with the input and initialization nodes. Complete your
                                algorithm and pseudocode before revealing each next hint.
                            </p>
                            {content.exercises.guided.slice(0, hint).map((text) => (
                                <p key={text}>{text}</p>
                            ))}
                            <Button
                                variant="outline"
                                disabled={hint >= 3}
                                onClick={() => setHint((h) => h + 1)}
                            >
                                Reveal next hint ({hint}/3)
                            </Button>
                            <Button
                                variant="outline"
                                disabled={readOnly || busy}
                                onClick={() => {
                                    const next = JSON.parse(
                                        JSON.stringify(content.graph),
                                    ) as FlowGraph;
                                    const last = next.body.pop();
                                    if (last) delete next.nodes[last];
                                    graphChange(next);
                                    change({
                                        codes: { python: "", cpp: "", java: "" },
                                        algorithm: "1. Identify inputs.\n2. ...",
                                        pseudocode: "START\nINPUT ...\n...\nEND",
                                    });
                                }}
                            >
                                Load partial chart (omit final step)
                            </Button>
                        </section>
                    )}
                    {work.mode === "challenge" && (
                        <section className="space-y-3">
                            <p>
                                Prepare your own analysis, algorithm, pseudocode, chart, three
                                implementations, and test evidence. For lessons 28–29, inspect the
                                given chart first and explain its behavior or faults before
                                generating source.
                            </p>
                            <Button
                                variant="outline"
                                disabled={readOnly || busy}
                                onClick={() => {
                                    graphChange(
                                        [28, 29].includes(content.number)
                                            ? content.graph
                                            : {
                                                  version: 1,
                                                  start: "start",
                                                  end: "end",
                                                  nodes: {},
                                                  body: [],
                                                  functions: [],
                                              },
                                    );
                                    change({
                                        codes: { python: "", cpp: "", java: "" },
                                        analysis: "",
                                        algorithm: "",
                                        pseudocode: "",
                                        test_notes: "",
                                    });
                                    setPrograms(undefined);
                                }}
                            >
                                Start independent workspace
                            </Button>
                        </section>
                    )}
                </article>
                <section className="space-y-4 rounded-2xl border bg-card p-5">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="mr-auto text-xl font-bold">Flowchart-to-Code Workspace</h2>
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={readOnly || busy || !past.length}
                            onClick={undo}
                        >
                            Undo
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={readOnly || busy || !future.length}
                            onClick={redo}
                        >
                            Redo
                        </Button>
                        <Button disabled={busy} onClick={() => void generate()}>
                            Validate & generate 3 languages
                        </Button>
                        <Button
                            variant="outline"
                            disabled={busy || readOnly}
                            onClick={() => {
                                graphChange(content.graph);
                                change({
                                    codes: {
                                        python: lesson.starter_python,
                                        cpp: lesson.starter_cpp,
                                        java: lesson.starter_java,
                                    },
                                });
                            }}
                        >
                            Restore worked example
                        </Button>
                    </div>
                    {issues && (
                        <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-800">
                            {issues}
                        </p>
                    )}
                    <div className="grid items-start gap-6 xl:grid-cols-2">
                        <ProgrammingFlowchart
                            graph={work.graph}
                            onChange={graphChange}
                            selected={selected}
                            onSelect={setSelected}
                            disabled={busy || readOnly}
                        />
                        <section className="min-w-0 space-y-4">
                            <div
                                className="flex flex-wrap gap-2"
                                role="group"
                                aria-label="Programming language"
                            >
                                {languages.map((lang) => (
                                    <Button
                                        key={lang}
                                        variant={language === lang ? "default" : "outline"}
                                        aria-pressed={language === lang}
                                        onClick={() => setLanguage(lang)}
                                    >
                                        {names[lang]}
                                    </Button>
                                ))}
                                <Button variant="outline" onClick={() => setCompare((c) => !c)}>
                                    {compare ? "Single editor" : "Compare side by side"}
                                </Button>
                            </div>
                            <p className="text-sm">{content.code_explanation}</p>
                            {programs && sourceMatches && (
                                <section className="space-y-2 rounded-xl border p-3">
                                    <h3 className="font-semibold">
                                        Flowchart statements · {names[language]}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Select a statement to trace its node. The complete editable
                                        program, including input and arithmetic helpers, is below.
                                    </p>
                                    <pre className="max-h-72 overflow-auto rounded bg-slate-950 p-3 text-xs text-slate-100">
                                        {programs[language].code
                                            .split("\n")
                                            .map((line, i) =>
                                                programs[language].nodes[i] ? (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        className={`block min-w-full text-left whitespace-pre ${selected === programs[language].nodes[i] ? "bg-indigo-700 text-white" : "hover:bg-slate-800"}`}
                                                        onClick={() =>
                                                            setSelected(
                                                                programs[language].nodes[i] ??
                                                                    undefined,
                                                            )
                                                        }
                                                    >{`${i + 1}: ${line}`}</button>
                                                ) : null,
                                            )}
                                    </pre>
                                </section>
                            )}
                            {selected && (
                                <section className="space-y-2 rounded-xl border bg-indigo-50 p-3 text-indigo-950">
                                    <h3 className="font-semibold">
                                        Equivalent statements · {selected}
                                    </h3>
                                    {!programs || !sourceMatches ? (
                                        <p className="text-sm">
                                            Validate and generate this chart to refresh its source
                                            mapping.
                                        </p>
                                    ) : (
                                        languages.map((lang) => {
                                            const lines = programs[lang].code
                                                .split("\n")
                                                .map((text, i) => ({
                                                    text,
                                                    number: i + 1,
                                                    node: programs[lang].nodes[i],
                                                }))
                                                .filter((line) => line.node === selected);
                                            return (
                                                <div key={lang}>
                                                    <h4 className="text-sm font-semibold">
                                                        {names[lang]}
                                                    </h4>
                                                    <pre className="overflow-auto rounded bg-white p-2 text-xs">
                                                        {lines
                                                            .map(
                                                                (line) =>
                                                                    `${line.number}: ${line.text}`,
                                                            )
                                                            .join("\n") ||
                                                            "Start, End, and synthetic joins do not require a source statement."}
                                                    </pre>
                                                    {work.codes[lang] !== programs[lang].code && (
                                                        <p className="text-xs">
                                                            This mapping refers to generated source;
                                                            the editor contains manual changes.
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </section>
                            )}
                            {!compare && renderEditor(language)}
                        </section>
                    </div>
                    {compare && (
                        <div className="grid gap-4 2xl:grid-cols-3">
                            {languages.map(renderEditor)}
                        </div>
                    )}
                    <section className="space-y-3">
                        <h3 className="font-bold">Expected output and test cases</h3>
                        <p className="text-sm text-muted-foreground">
                            These are specified expectations. Actual output and errors appear only
                            after running a program in its editor. Input uses one value per line.
                            Compare each language using the same test input.
                        </p>
                        <div className="grid gap-3 md:grid-cols-2">
                            {content.tests.map((test, i) => (
                                <div key={i} className="space-y-2 rounded-xl border p-3">
                                    <h4 className="font-semibold">
                                        Test {i + 1}: {test.name}
                                    </h4>
                                    <p className="text-xs">Input</p>
                                    <pre className="rounded bg-muted p-2 text-sm whitespace-pre-wrap">
                                        {test.input || "(none)"}
                                    </pre>
                                    <p className="text-xs">Expected output</p>
                                    <pre className="rounded bg-muted p-2 text-sm whitespace-pre-wrap">
                                        {test.expected || "(no output)"}
                                    </pre>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={readOnly || busy}
                                        onClick={() => change({ input: test.input })}
                                    >
                                        Use test {i + 1} input
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </section>
                </section>
                <section className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-2">
                    <h2 className="text-xl font-bold md:col-span-2">Your solution and evidence</h2>
                    {(
                        [
                            "analysis",
                            "algorithm",
                            "pseudocode",
                            "test_notes",
                            "documentation",
                        ] as const
                    ).map((field) => (
                        <label key={field} className="space-y-2">
                            <span className="block font-semibold capitalize">
                                {field.replace("_", " ")}
                            </span>
                            <textarea
                                className={`${fieldClass} ${field === "pseudocode" ? "font-mono" : ""}`}
                                readOnly={readOnly || busy}
                                value={work[field] ?? ""}
                                maxLength={20000}
                                onChange={(e) => change({ [field]: e.target.value })}
                                placeholder={
                                    field === "test_notes"
                                        ? "Record language, input, expected output, actual output, errors, corrections, and any unavailable runner. Include program documentation for projects."
                                        : `Write your ${field}.`
                                }
                            />
                        </label>
                    ))}
                    <div className="flex flex-wrap items-center gap-3 md:col-span-2">
                        <Button disabled={readOnly || busy} onClick={() => void save()}>
                            Save workspace
                        </Button>
                        <Button
                            variant="outline"
                            disabled={readOnly || busy}
                            onClick={() => void save(true)}
                        >
                            Submit for teacher review
                        </Button>
                        <p aria-live="polite" className="text-sm">
                            {dirty ? "Unsaved changes" : "Saved"} · Version {version} ·{" "}
                            {workspace.status.replaceAll("_", " ")}
                        </p>
                    </div>
                    {lesson.rubric && (
                        <p className="text-sm md:col-span-2">
                            Project rubric:{" "}
                            {Object.entries(lesson.rubric)
                                .map(([name, weight]) => `${name.replaceAll("_", " ")} ${weight}%`)
                                .join(" · ")}
                        </p>
                    )}
                </section>
                <section className="space-y-3 rounded-2xl border bg-card p-5">
                    <h2 className="text-xl font-bold">Practice exercises</h2>
                    {Object.entries(content.exercises).map(([group, exercises]) => (
                        <details key={group} className="rounded-xl border p-3">
                            <summary className="cursor-pointer font-semibold capitalize">
                                {group} · {exercises.length} activities
                            </summary>
                            <ol className="mt-3 list-decimal space-y-3 pl-5">
                                {exercises.map((text) => (
                                    <li key={text} className="text-sm">
                                        {text}
                                    </li>
                                ))}
                            </ol>
                        </details>
                    ))}
                </section>
                <section className="space-y-5 rounded-2xl border bg-card p-5">
                    <h2 className="text-xl font-bold">Knowledge check · 10 questions</h2>
                    <p>
                        Pass with 8/10. Latest score: {workspace.quiz_score ?? "Not taken"}.
                        Questions and answer positions are shuffled; answers are scored on the
                        server.
                    </p>
                    {lesson.quiz.map((question, i) => (
                        <fieldset key={i} disabled={readOnly || busy} className="space-y-2">
                            <legend className="font-semibold">
                                {i + 1}. {question.question}
                            </legend>
                            {question.choices.map((choice, j) => (
                                <label key={j} className="flex gap-2 text-sm">
                                    <input
                                        type="radio"
                                        name={`quiz-${i}`}
                                        checked={answers[i] === j}
                                        onChange={() => setAnswers((a) => ({ ...a, [i]: j }))}
                                    />
                                    <span className="whitespace-pre-wrap">{choice}</span>
                                </label>
                            ))}
                            {quizResult && (
                                <p className="rounded bg-muted p-2 text-sm">
                                    {quizResult.feedback[i].correct ? "Correct. " : "Review: "}
                                    {quizResult.feedback[i].explanation}
                                </p>
                            )}
                        </fieldset>
                    ))}
                    <Button
                        disabled={
                            readOnly || busy || lesson.quiz.some((_, i) => answers[i] === undefined)
                        }
                        onClick={() => void quiz()}
                    >
                        Submit quiz
                    </Button>
                    {quizResult && <p aria-live="polite">Score: {quizResult.score}/10</p>}
                </section>
                <nav className="flex flex-wrap justify-between gap-3">
                    {previousLesson && (
                        <Link href={`/code-lab/${previousLesson.id}`}>
                            ← {previousLesson.title}
                        </Link>
                    )}
                    {nextLesson &&
                        (nextLesson.unlocked ? (
                            <Link href={`/code-lab/${nextLesson.id}`}>{nextLesson.title} →</Link>
                        ) : (
                            <span className="text-sm text-muted-foreground">
                                Submit, pass the quiz, and receive teacher approval to unlock{" "}
                                {nextLesson.title}.
                            </span>
                        ))}
                </nav>
            </main>
        </>
    );
}

export default function ProgrammingLab(props: Props) {
    return <ProgrammingLesson key={props.lesson.id} {...props} />;
}
ProgrammingLab.layout = {
    breadcrumbs: [
        { title: "Courses", href: "/courses" },
        { title: "Programming Logic Lab", href: "#" },
    ],
};

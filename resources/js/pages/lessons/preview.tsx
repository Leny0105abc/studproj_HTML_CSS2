import { FlowDiagram, type FlowGraph } from '@/components/programming-flowchart';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import ScratchBlocks, { type BlockExample } from '@/components/scratch-blocks';

type PreviewLesson = {
    programming_content?: { graph: FlowGraph; tests: { input: string; expected: string }[]; exercises: Record<string, string[]>; prerequisites: string; duration: number };
    id: number;
    title: string;
    objectives: string[];
    introduction: string;
    explanation: string;
    wordpress_setup?: string;
    wordpress_steps?: string;
    site_structure?: string;
    visual_guide?: string;
    maintenance_tip?: string;
    submission_instructions?: string;
    syntax?: string;
    example_python?: string;
    example_php?: string;
    example_apps_script?: string;
    workspace_setup?: string;
    form_setup?: string;
    sheet_setup?: string;
    authorization_note?: string;
    quota_note?: string;
    example_vba?: string;
    excel_setup?: string;
    worksheet_layout?: string;
    userform_guide?: string;
    accessibility_tip?: string;
    responsive_tip?: string;
    example_csharp?: string;
    csharp_project_guide?: string;
    example_vbnet?: string;
    vbnet_form_guide?: string;
    example_javascript?: string;
    example_sql?: string;
    dialect_note?: string;
    example_java?: string;
    example_cpp?: string;
    debugging_tip?: string;
    security_note?: string;
    example_html?: string;
    example_css?: string;
    guided_practice?: string;
    activity?: string;
    expected_result?: string;
    important_notes?: string;
    challenge?: string;
    rubric?: Record<string, number>;
    block_examples?: BlockExample[] | null;
};

export default function LessonPreview({
    lesson,
    unlocked,
    courseUrl,
}: {
    lesson: PreviewLesson;
    unlocked: boolean;
    courseUrl: string;
}) {
    const sections = [
        ['Introduction', lesson.introduction],
        ['WordPress Setup', lesson.wordpress_setup],
        ['WordPress Procedure', lesson.wordpress_steps],
        ['Site Structure', lesson.site_structure],
        ['Visual Guide', lesson.visual_guide],
        ['Maintenance', lesson.maintenance_tip],
        ['Submission Instructions', lesson.submission_instructions],
        ['Key Concepts & Explanation', lesson.explanation],
        ['Syntax', lesson.syntax],
        ['Python Example', lesson.example_python],
        ['PHP Example', lesson.example_php],
        ['Google Apps Script Setup', lesson.workspace_setup],
        ['Google Form Setup', lesson.form_setup],
        ['Google Sheet Setup', lesson.sheet_setup],
        ['Apps Script Example', lesson.example_apps_script],
        ['Authorization Note', lesson.authorization_note],
        ['Quota Note', lesson.quota_note],
        ['Excel Setup (Desktop Required)', lesson.excel_setup],
        ['Worksheet Layout / Sample Data', lesson.worksheet_layout],
        ['VBA Example', lesson.example_vba],
        ['UserForm Design Guide (Excel Desktop)', lesson.userform_guide],
        ['Accessibility Tip', lesson.accessibility_tip],
        ['Responsive Design Tip', lesson.responsive_tip],
        ['C# Example', lesson.example_csharp],
        ['C# Project / Environment Guide', lesson.csharp_project_guide],
        ['VB.NET Example', lesson.example_vbnet],
        ['Windows Forms Design Guide (Visual Studio)', lesson.vbnet_form_guide],
        ['JavaScript Example', lesson.example_javascript],
        ['SQL Dialect', lesson.dialect_note],
        ['SQL Example', lesson.example_sql],
        ['Java Example', lesson.example_java],
        ['C++ Example', lesson.example_cpp],
        ['Debugging Tip', lesson.debugging_tip],
        ['Security Note', lesson.security_note],
        ['HTML Example', lesson.example_html],
        ['CSS Example', lesson.example_css],
        ['Guided Practice', lesson.guided_practice],
        ['Activity', lesson.activity],
        ['Expected Result', lesson.expected_result],
        ['Common Errors & Notes', lesson.important_notes],
        ['Summary & Challenge', lesson.challenge],
    ];
    return (
        <>
            <Head title={`${lesson.title} · Preview`} />
            <main className="mx-auto max-w-4xl space-y-6 p-6">
                <Link href={courseUrl}>← Back to lessons</Link>
                <h1 className="text-3xl font-bold">{lesson.title}</h1>
                {lesson.programming_content && <section className="space-y-4 rounded-xl border p-4"><p>{lesson.programming_content.duration} minutes · {lesson.programming_content.prerequisites}</p><FlowDiagram graph={lesson.programming_content.graph} onSelect={() => {}} />{lesson.programming_content.tests.map((test, i) => <div key={i}><h2 className="font-semibold">Test {i + 1}</h2><pre className="whitespace-pre-wrap">Input: {test.input}Expected output: {test.expected || "(no output)"}</pre></div>)}{Object.entries(lesson.programming_content.exercises).map(([group, items]) => <section key={group}><h2 className="font-semibold capitalize">{group}</h2><ol className="list-decimal space-y-2 pl-5">{items.map((item) => <li key={item}>{item}</li>)}</ol></section>)}</section>}
                <div className="space-y-3 rounded-xl border bg-muted p-4">
                    <p>
                        {unlocked
                            ? 'You can start this lesson’s activity.'
                            : 'You can read this lesson now. Complete the previous lesson to unlock its coding activity and quiz.'}
                    </p>
                    {unlocked && (
                        <Button asChild>
                            <Link href={`/code-lab/${lesson.id}`}>
                                Start lesson
                            </Link>
                        </Button>
                    )}
                </div>
                <section>
                    <h2 className="text-xl font-semibold">
                        Learning Objectives
                    </h2>
                    <ul className="mt-3 list-disc space-y-2 pl-6">
                        {lesson.objectives.map((objective, index) => (
                            <li key={index}>{objective}</li>
                        ))}
                    </ul>
                </section>
                {sections
                    .filter(([, content]) => content)
                    .map(([title, content]) => (
                        <section
                            key={title}
                            className="space-y-3 rounded-xl border p-5"
                        >
                            <h2 className="text-xl font-semibold">{title}</h2>
                            <p className="overflow-auto leading-7 whitespace-pre-wrap">
                                {content}
                            </p>
                        </section>
                    ))}
                {lesson.block_examples && (
                    <ScratchBlocks examples={lesson.block_examples} />
                )}
                {lesson.rubric && (
                    <section>
                        <h2 className="text-xl font-semibold">
                            Project Rubric
                        </h2>
                        <ul className="mt-3 space-y-2">
                            {Object.entries(lesson.rubric).map(
                                ([name, weight]) => (
                                    <li key={name}>
                                        {name}: {weight}%
                                    </li>
                                ),
                            )}
                        </ul>
                    </section>
                )}
                <Link href={courseUrl}>← Back to lessons</Link>
            </main>
        </>
    );
}

<?php

namespace App\Http\Controllers;

use App\Models\CaseStudy;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\EducationLevel;
use App\Models\Lesson;
use App\Models\User;
use App\Services\CourseAccess;
use App\Services\ProgrammingFlowchart;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class LessonController extends Controller
{
    public function preview(Request $request, Lesson $lesson): Response
    {
        if ($lesson->isApplication() && $request->user()->role === 'teacher') {
            return app(ApplicationWorkspaceController::class)->lesson($request, $lesson);
        }
        abort_unless(CourseAccess::lessons($request->user())->where('id', $lesson->id)->exists(), 403);

        return Inertia::render('lessons/preview', [
            'lesson' => $lesson->only('programming_content', 'wordpress_setup', 'wordpress_steps', 'site_structure', 'visual_guide', 'maintenance_tip', 'submission_instructions', 'id', 'title', 'objectives', 'introduction', 'explanation', 'syntax', 'example_apps_script', 'workspace_setup', 'form_setup', 'sheet_setup', 'authorization_note', 'quota_note', 'example_vba', 'excel_setup', 'worksheet_layout', 'userform_guide', 'example_csharp', 'csharp_mode', 'csharp_project_guide', 'example_vbnet', 'vbnet_mode', 'vbnet_form_guide', 'accessibility_tip', 'responsive_tip', 'example_javascript', 'example_sql', 'sql_seed', 'dialect_note', 'example_java', 'example_cpp', 'debugging_tip', 'example_php', 'security_note', 'example_python', 'example_html', 'example_css', 'block_examples', 'guided_practice', 'activity', 'expected_result', 'important_notes', 'challenge', 'rubric'),
            'unlocked' => CourseAccess::unlocked($request->user(), $lesson),
            'courseUrl' => $lesson->course ? route('courses.show', $lesson->course->slug) : route('lessons.index'),
        ]);
    }

    public function index(Request $request, ?Course $course = null): Response|RedirectResponse
    {
        if (! $course && $request->user()->role === 'student') {
            $availableCourses = Course::all()->filter(fn ($item) => $item->accessibleTo($request->user()));
            if (! $availableCourses->contains('slug', 'html-css')) {
                $availableCourse = $availableCourses->first();

                return $availableCourse
                    ? redirect()->route('courses.show', $availableCourse->slug)
                    : redirect()->route('courses.index');
            }
        }
        $progress = $request->user()->role === 'student'
            ? $request->user()->lessonProgress()->get()->keyBy('lesson_id')
            : collect();
        $completedPrevious = true;

        $query = CourseAccess::lessons($request->user());
        if ($course) {
            $query->where('course_id', $course->id);
            if ($request->user()->role === 'teacher') {
                $query = Lesson::where('course_id', $course->id)->orderBy('position');
            }
        } else {
            $query->where(fn ($q) => $q->whereNull('course_id')->orWhereHas('course', fn ($c) => $c->where('slug', 'html-css')));
        }
        $lessons = $query->get()->map(function (Lesson $lesson) use ($request, $progress, &$completedPrevious) {
            $itemProgress = $progress->get($lesson->id);
            $unlocked = CourseAccess::unlocked($request->user(), $lesson);
            $status = $itemProgress?->status ?? ($unlocked ? 'not_started' : 'locked');
            if ($request->user()->role === 'student') {
                $completedPrevious = $status === 'completed';
            }

            return [
                'id' => $lesson->id, 'number' => $lesson->number, 'title' => $lesson->title,
                'level' => $lesson->level, 'status' => $status, 'unlocked' => $unlocked,
                'autoComplete' => $lesson->auto_complete, 'published' => $lesson->is_published,
                'position' => $lesson->position, 'isProject' => $lesson->is_project,
                'exerciseTitle' => $lesson->isApplication() ? ($lesson->application_content['exercise']['title'] ?? null) : null,
                'exerciseStatus' => $lesson->isApplication() ? ($itemProgress?->activity_passed_at ? 'Submitted' : 'Not Submitted') : null,
            ];
        });

        $levels = $course ? $course->modules->pluck('name') : collect(['Basic', 'Moderate', 'Advanced']);
        $levelProgress = $levels->mapWithKeys(fn ($level) => [
            $level => [
                'completed' => $lessons->where('level', $level)->where('status', 'completed')->count(),
                'total' => $lessons->where('level', $level)->count(),
            ],
        ]);

        return Inertia::render('lessons/index', [
            'applicationStats' => in_array($course?->editor_type, ['office-word', 'office-excel'], true) ? ['exercisesCompleted' => $request->user()->lessonProgress()->whereHas('lesson', fn ($q) => $q->where('course_id', $course->id))->whereNotNull('activity_passed_at')->count(), 'caseStudiesCompleted' => \DB::table('case_study_progress')->where('user_id', $request->user()->id)->where('status', 'completed')->whereIn('case_study_id', CaseStudy::where('course_id', $course->id)->pluck('id'))->count()] : null,
            'applicationCases' => in_array($course?->editor_type, ['office-word', 'office-excel'], true) ? CaseStudy::where('course_id', $course->id)->where('is_published', true)->orderBy('number')->get()->map(fn ($c) => ['id' => $c->id, 'title' => $c->title, 'level' => $c->module?->name, 'unlocked' => ApplicationWorkspaceController::caseUnlocked($request->user(), $c), 'status' => \DB::table('case_study_progress')->where('case_study_id', $c->id)->where('user_id', $request->user()->id)->value('status') ?? 'not_started']) : [],
            'lessons' => $lessons, 'levelProgress' => $levelProgress,
            'isTeacher' => $request->user()->role === 'teacher',
            'course' => $course?->load('educationLevel'),
            'modules' => $course?->modules->map(fn ($m) => ['id' => $m->id, 'name' => $m->name, 'position' => $m->position, 'assessment' => $request->user()->role === 'teacher' ? ($m->assessment ?? []) : collect($m->assessment ?? [])->map(fn ($q) => Arr::only($q, ['question', 'choices']))]) ?? [],
            'assessmentResults' => $course ? CourseEnrollment::where('course_id', $course->id)->where('user_id', $request->user()->id)->first()?->assessment_results : null,
            'students' => $request->user()->role === 'teacher' ? User::where('role', 'student')->get(['id', 'name', 'education_level_id'])->filter(fn ($student) => ! $course || $course->compatibleWith($student))->values() : [],
            'educationLevels' => EducationLevel::all(['id', 'name']),
            'levels' => $levels->values(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:150', 'level' => 'required|string',
            'activity' => 'required|string', 'objectives' => 'required|array|min:1',
            'course_id' => 'nullable|exists:courses,id',
        ]);
        $number = Lesson::max('number') + 1;
        $course = isset($data['course_id']) ? Course::findOrFail($data['course_id']) : Course::where('slug', 'html-css')->first();
        abort_unless($course?->modules()->where('name', $data['level'])->exists(), 422, 'Choose a module in this course.');
        $wordpress = $course?->editor_type === 'wordpress';
        $python = $course?->editor_type === 'python';
        $scratch = $course?->editor_type === 'scratch';
        $php = $course?->editor_type === 'php';
        $cpp = $course?->editor_type === 'cpp';
        $java = $course?->editor_type === 'java';
        $sql = $course?->editor_type === 'sql';
        $javascript = in_array($course?->editor_type, ['javascript', 'html-css-bootstrap', 'html-tailwind'], true);
        $appsScript = $course?->editor_type === 'google-apps-script';
        $vba = $course?->editor_type === 'vba';
        $csharp = $course?->editor_type === 'csharp';
        $vbnet = $course?->editor_type === 'vbnet';
        Lesson::create($data + [
            'number' => $number, 'position' => Lesson::where('course_id', $course?->id)->max('position') + 1, 'slug' => \Str::slug($data['title']).'-'.$number,
            'course_id' => $course?->id, 'course_module_id' => $course?->modules()->where('name', $data['level'])->first()?->id,
            'introduction' => $data['activity'], 'explanation' => $data['activity'], 'guided_practice' => $data['activity'],
            'expected_result' => $wordpress ? 'An authorized practice WordPress website with documented evidence; no WordPress execution in CodeLab.' : ($csharp ? 'A C# program and documented test evidence that meet the activity requirements.' : ($appsScript ? 'Documented results from the student authorized Google Apps Script environment.' : ($vba ? 'A macro-enabled Excel practice workbook and documented desktop test evidence.' : ($vbnet ? 'A VB.NET program and documented test evidence that meet the activity requirements.' : ($sql ? 'A SQLite script and query results that meet the activity requirements.' : ($cpp ? 'A C++ program that meets the activity requirements.' : ($php ? 'A PHP program that meets the activity requirements.' : ($scratch ? 'A Scratch project that meets the activity requirements.' : ($python ? 'A Python program that meets the activity requirements.' : 'A working webpage that meets the activity requirements.'))))))))),
            'is_published' => ! $wordpress && ! $python && ! $scratch && ! $php && ! $cpp && ! $java && ! $sql && ! $javascript && ! $csharp && ! $vbnet && ! $vba && ! $appsScript,
            'starter_apps_script' => $appsScript ? "function studentActivity() {\n  // Write original source for your authorized Google Apps Script project.\n}\n" : null,
            'workspace_setup' => $appsScript ? 'Google Apps Script editor required; review requested permissions and use only authorized practice resources.' : null,
            'starter_vba' => $vba ? "Option Explicit\n\nPublic Sub StudentActivity()\n    ' Write your original Excel VBA solution here.\nEnd Sub\n" : null,
            'excel_setup' => $vba ? 'Microsoft Excel desktop required. Save a practice .xlsm workbook; review trusted code without weakening global macro security.' : null,
            'csharp_mode' => $csharp ? 'console' : null,
            'starter_csharp' => $csharp ? "using System;\nclass Program { static void Main() { /* Write your solution. */ } }\n" : null,
            'vbnet_mode' => 'console',
            'starter_vbnet' => $vbnet ? "Option Explicit On\nOption Strict On\nModule Program\n    Sub Main()\n        ' Write your solution.\n    End Sub\nEnd Module\n" : null,
            'starter_javascript' => $javascript ? "// Write your JavaScript solution.\n" : null,
            'starter_html' => $javascript ? '<main><h1>JavaScript lab</h1><div id="output"></div></main>' : null,
            'starter_sql' => $sql ? "-- Write a complete SQLite script here.\n" : null,
            'sql_seed' => $sql ? '' : null,
            'dialect_note' => $sql ? 'SQLite browser lab; CREATE DATABASE, stored procedures, and database roles require other DBMSs.' : null,
            'starter_java' => $java ? "public class Main {\n    public static void main(String[] args) {\n        // Write your solution here.\n    }\n}\n" : null,
            'starter_cpp' => $cpp ? "#include <iostream>\nint main() {\n    // Write your solution here.\n    return 0;\n}\n" : null,
            'starter_php' => $php ? "<?php\n// Write your solution below.\n" : null,
            'starter_python' => $python ? '# Write your solution below.' : null,
            'completion_requirements' => 'Save and submit a working solution for teacher review.',
        ]);

        return back()->with('success', 'Lesson created.');
    }

    public function destroy(Lesson $lesson)
    {
        $lesson->update(['is_published' => false]);

        return back()->with('success', 'Lesson archived.');
    }

    public function edit(Lesson $lesson): Response
    {
        return Inertia::render('lessons/edit', ['lesson' => $lesson, 'levels' => $lesson->course?->modules()->pluck('name') ?? ['Basic', 'Moderate', 'Advanced'], 'prerequisites' => Lesson::where('course_id', $lesson->course_id)->where('id', '!=', $lesson->id)->get(['id', 'title', 'position'])]);
    }

    public function update(Request $request, Lesson $lesson)
    {
        if ($lesson->isProgramming() && $request->isJson()) {
            $raw = json_decode($request->getContent(), true);
            if (is_array($raw) && is_array($raw['programming_content'] ?? null)) {
                $request->merge(['programming_content' => $raw['programming_content']]);
            }
        }
        $data = $request->validate([
            'application_content' => $lesson->isApplication() ? 'sometimes|required|array|max:30' : 'sometimes|nullable|array|max:30',
            'title' => 'required|string|max:150', 'level' => ['required', Rule::in($lesson->course?->modules()->pluck('name')->all() ?? ['Basic', 'Moderate', 'Advanced'])], 'position' => 'required|integer|min:1|max:65000',
            'is_published' => 'required|boolean', 'is_project' => 'required|boolean', 'objectives' => 'required|array|min:2|max:4', 'objectives.*' => 'required|string|max:300',
            'introduction' => 'required|string', 'explanation' => 'required|string', 'syntax' => 'nullable|string', 'guided_practice' => 'required|string', 'activity' => 'required|string', 'expected_result' => 'required|string', 'important_notes' => 'nullable|string', 'challenge' => 'nullable|string',
            'starter_python' => 'nullable|string|max:200000', 'example_python' => 'nullable|string|max:200000', 'starter_html' => 'nullable|string', 'example_html' => 'nullable|string', 'starter_css' => 'nullable|string', 'example_css' => 'nullable|string',
            'starter_apps_script' => 'nullable|string|max:200000', 'example_apps_script' => 'nullable|string|max:200000', 'workspace_setup' => 'nullable|string|max:50000', 'form_setup' => 'nullable|string|max:50000', 'sheet_setup' => 'nullable|string|max:50000', 'authorization_note' => 'nullable|string|max:50000', 'quota_note' => 'nullable|string|max:50000',
            'starter_vba' => 'nullable|string|max:200000', 'example_vba' => 'nullable|string|max:200000', 'excel_setup' => 'nullable|string|max:50000', 'worksheet_layout' => 'nullable|string|max:50000', 'userform_guide' => 'nullable|string|max:50000',
            'wordpress_setup' => 'nullable|string|max:50000', 'wordpress_steps' => 'nullable|string|max:50000', 'site_structure' => 'nullable|string|max:50000', 'visual_guide' => 'nullable|string|max:50000', 'maintenance_tip' => 'nullable|string|max:50000', 'submission_instructions' => 'nullable|string|max:50000',
            'accessibility_tip' => 'nullable|string|max:50000', 'responsive_tip' => 'nullable|string|max:50000',
            'starter_csharp' => 'nullable|string|max:200000', 'example_csharp' => 'nullable|string|max:200000', 'csharp_mode' => 'sometimes|nullable|in:console,external', 'csharp_project_guide' => 'nullable|string|max:50000',
            'starter_vbnet' => 'nullable|string|max:200000', 'example_vbnet' => 'nullable|string|max:200000', 'vbnet_mode' => 'sometimes|in:console,winforms', 'vbnet_form_guide' => 'nullable|string|max:50000',
            'starter_javascript' => 'nullable|string|max:100000', 'example_javascript' => 'nullable|string|max:100000',
            'starter_sql' => 'nullable|string|max:200000', 'example_sql' => 'nullable|string|max:200000', 'sql_seed' => 'nullable|string|max:200000', 'dialect_note' => 'nullable|string|max:10000',
            'starter_java' => 'nullable|string|max:200000', 'example_java' => 'nullable|string|max:200000',
            'starter_cpp' => 'nullable|string|max:200000', 'example_cpp' => 'nullable|string|max:200000', 'debugging_tip' => 'nullable|string|max:10000',
            'starter_php' => 'nullable|string|max:200000', 'example_php' => 'nullable|string|max:200000', 'security_note' => 'nullable|string|max:10000',
            'rubric' => 'nullable|array', 'rubric.*' => 'integer|min:0|max:100', 'validation_rules' => 'nullable|array',
            'block_examples' => 'nullable|array|max:10', 'block_examples.*.name' => 'required|string|max:150', 'block_examples.*.sprite' => 'required|string|max:150', 'block_examples.*.blocks' => 'required|array|max:150',
            'block_examples.*.blocks.*.category' => ['required', Rule::in(['Motion', 'Looks', 'Sound', 'Events', 'Control', 'Sensing', 'Operators', 'Variables', 'Lists', 'My Blocks'])],
            'block_examples.*.blocks.*.text' => 'required|string|max:500',
            'quiz' => 'nullable|array|size:'.($lesson->isProgramming() ? 10 : 5), 'programming_content' => 'sometimes|nullable|array', 'quiz.*.question' => 'required|string', 'quiz.*.choices' => 'required|array|size:4', 'quiz.*.choices.*' => 'required|string', 'quiz.*.answer' => 'required|integer|between:0,3', 'quiz.*.explanation' => 'required|string',
            'prerequisite_id' => ['nullable', 'integer', Rule::exists('lessons', 'id')->where(fn ($q) => $q->where('course_id', $lesson->course_id)->where('position', '<', $request->integer('position'))->where('id', '!=', $lesson->id))],
        ]);
        $data['course_module_id'] = $lesson->course?->modules()->where('name', $data['level'])->first()?->id;
        if ($lesson->isProgramming()) {
            $content = $request->validate([
                'programming_content' => 'required|array', 'programming_content.graph' => 'required|array',
                'programming_content.discussion' => 'required|string', 'programming_content.number' => 'required|integer|between:1,30',
                'programming_content.duration' => 'required|integer|min:1', 'programming_content.prerequisites' => 'required|string',
                'programming_content.topics' => 'required|array', 'programming_content.topics.*' => 'required|string',
                'programming_content.problem' => 'required|string', 'programming_content.inputs' => 'required|string', 'programming_content.process' => 'required|string', 'programming_content.outputs' => 'required|string',
                'programming_content.code_explanation' => 'required|string', 'programming_content.tests' => 'required|array|min:2',
                'programming_content.tests.*.input' => 'present|nullable|string', 'programming_content.tests.*.expected' => 'present|nullable|string',
                'programming_content.tests.*.name' => 'required|string', 'programming_content.quiz' => 'prohibited',
                'programming_content.exercises.guided' => 'required|array|size:3', 'programming_content.exercises.independent' => 'required|array|size:3',
                'programming_content.exercises.debugging' => 'required|array|size:2', 'programming_content.exercises.conversion' => 'required|array|size:2',
                'programming_content.exercises.*.*' => 'required|string',
            ])['programming_content'];
            try {
                $converter = app(ProgrammingFlowchart::class);
                $programs = $converter->generate($content['graph']);
                $content['plan'] = $converter->plan($content['graph']);
            } catch (\InvalidArgumentException|\TypeError $error) {
                throw ValidationException::withMessages(['programming_content' => $error instanceof \TypeError ? 'Malformed graph.' : $error->getMessage()]);
            }
            if ($content['discussion'] !== ($lesson->programming_content['discussion'] ?? null)) {
                $data['explanation'] = $content['discussion'];
            } else {
                $content['discussion'] = $data['explanation'];
            }
            if ($content['graph'] !== ($lesson->programming_content['graph'] ?? null)) {
                foreach (['python', 'cpp', 'java'] as $language) {
                    $data['starter_'.$language] = $data['example_'.$language] = $programs[$language]['code'];
                }
            }
            $data['programming_content'] = $content;
        }
        if ($lesson->isApplication() && array_key_exists('application_content', $data)) {
            $request->validate(['application_content.allowed_uploads' => 'required|array|min:1|max:5', 'application_content.allowed_uploads.*' => 'required|in:docx,dotx,docm,pdf,xlsx,xlsm', 'application_content.exercise' => 'required|array', 'application_content.exercise.title' => 'required|string|max:200', 'application_content.exercise.filename' => 'required|string|max:200', 'application_content.exercise.sample' => 'required|string|max:20000', 'application_content.exercise.tasks' => 'required|array|min:1|max:20', 'application_content.exercise.tasks.*' => 'required|string|max:2000', 'application_content.mastery' => 'required|array|size:4', 'application_content.mastery.*' => 'required|string|max:300', 'application_content.steps' => 'required|array|min:2|max:30', 'application_content.steps.*' => 'required|string|max:3000', 'application_content.sources' => 'nullable|array|max:10', 'application_content.sources.*.url' => 'required|url:https|max:2048', 'application_content.sources.*.title' => 'required|string|max:200']);
        }
        $lesson->update($data);

        return back()->with('success', 'Lesson saved.');
    }
}

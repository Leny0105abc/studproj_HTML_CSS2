<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\CourseEnrollment;
use App\Models\Lesson;
use App\Models\StudentLessonProgress;
use App\Models\Submission;
use App\Services\CourseAccess;
use App\Services\CsharpSandbox;
use App\Services\JavaSandbox;
use App\Services\LessonCodeValidator;
use App\Services\VbnetSandbox;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CodeLabController extends Controller
{
    private function teacherCompleted(int $userId, int $lessonId): bool
    {
        $submission = Submission::where('user_id', $userId)->where('lesson_id', $lessonId)
            ->latest('version')->first(['status', 'reviewed_at', 'reviewed_by']);

        return $submission?->status === 'completed' && $submission->reviewed_at !== null && $submission->reviewed_by !== null;
    }

    private function ensureEditable(Request $request, Lesson $lesson): void
    {
        abort_if($this->teacherCompleted($request->user()->id, $lesson->id), 403,
            'Your teacher confirmed this lesson completed. The activity is now read-only.');
    }

    private function ensureUnlocked(Request $request, Lesson $lesson): void
    {
        abort_unless(CourseAccess::unlocked($request->user(), $lesson), 403, 'This lesson is unavailable or its prerequisite is incomplete.');
    }

    public function show(Request $request, Lesson $lesson, LessonCodeValidator $validator): Response
    {
        if ($lesson->isProgramming()) {
            return app(ProgrammingWorkspaceController::class)->show($request, $lesson);
        }
        $this->ensureUnlocked($request, $lesson);
        if ($lesson->course_id) {
            $enrollment = CourseEnrollment::firstOrCreate(['user_id' => $request->user()->id, 'course_id' => $lesson->course_id]);
            if (! $enrollment->started_at) {
                $enrollment->update(['started_at' => now()]);
                $this->log($request->user()->id, 'course_started', $lesson, ['course_id' => $lesson->course_id]);
            }
        }
        $initialCode = match (true) {
            $lesson->isGoogleAppsScript() => $lesson->starter_apps_script,
            $lesson->isVba() => $lesson->starter_vba,
            $lesson->isCsharp() => $lesson->starter_csharp,
            $lesson->isVbnet() => $lesson->starter_vbnet,
            $lesson->isSql() => $lesson->starter_sql,
            $lesson->isJava() => $lesson->starter_java,
            $lesson->isCpp() => $lesson->starter_cpp,
            $lesson->isPhp() => $lesson->starter_php,
            $lesson->isPython() => $lesson->starter_python,
            default => $lesson->starter_html,
        };
        $progress = StudentLessonProgress::firstOrCreate(
            ['user_id' => $request->user()->id, 'lesson_id' => $lesson->id],
            ['status' => 'in_progress', 'html_code' => $initialCode, 'apps_script_code' => $lesson->starter_apps_script, 'vba_code' => $lesson->starter_vba, 'csharp_code' => $lesson->isCsharp() ? $lesson->starter_csharp : null, 'vbnet_code' => $lesson->starter_vbnet, 'sql_code' => $lesson->starter_sql, 'java_code' => $lesson->starter_java, 'cpp_code' => $lesson->starter_cpp, 'php_code' => $lesson->starter_php, 'python_code' => $lesson->starter_python, 'css_code' => $lesson->starter_css, 'js_code' => $lesson->isWebWorkspace() ? $lesson->starter_javascript : null, 'started_at' => now()]
        )->refresh();
        if ($progress->wasRecentlyCreated) {
            $this->log($request->user()->id, 'lesson_started', $lesson);
            if ($lesson->course_module_id && ! StudentLessonProgress::where('user_id', $request->user()->id)->where('lesson_id', '!=', $lesson->id)->whereHas('lesson', fn ($q) => $q->where('course_module_id', $lesson->course_module_id))->exists()) {
                $this->log($request->user()->id, 'module_started', $lesson, ['module_id' => $lesson->course_module_id]);
            }
        }
        if ($progress->status === 'not_started') {
            $progress->update(['status' => 'in_progress', 'started_at' => now()]);
        }
        if (! $request->header('X-Inertia-Partial-Data')) {
            $this->log($request->user()->id, 'lesson_accessed', $lesson, ['title' => $lesson->title]);
        }
        $lessonData = $lesson->toArray();
        $moduleLessons = Lesson::where('course_id', $lesson->course_id)->where('level', $lesson->level)->where('is_published', true)->orderBy('position')->pluck('id');
        $lessonData['module_number'] = $moduleLessons->search($lesson->id) + 1;
        $lessonData['module_total'] = $moduleLessons->count();
        $lessonData['quiz'] = collect($lesson->quiz ?? [])->map(fn (array $question) => [
            'question' => $question['question'], 'choices' => $question['choices'],
        ])->all();
        $previousLesson = Lesson::where('course_id', $lesson->course_id)->where('position', '<', $lesson->position)
            ->where('is_published', true)->orderByDesc('position')->first();
        $nextLesson = Lesson::where('course_id', $lesson->course_id)->where('position', '>', $lesson->position)
            ->where('is_published', true)->orderBy('position')->first();
        $nextProgress = $nextLesson ? StudentLessonProgress::where('user_id', $request->user()->id)
            ->where('lesson_id', $nextLesson->id)->first() : null;

        $workspace = $progress->only('html_code', 'css_code', 'js_code', 'extra_files', 'status', 'version', 'last_saved_at', 'quiz_score', 'quiz_answers', 'quiz_passed_at', 'activity_passed_at');
        $workspace['html_code'] = $validator->normalizeLegacyHtml($lesson, $workspace['html_code'] ?? '');
        if ($lesson->isWebWorkspace()) {
            $workspace['html_code'] = $progress->html_code ?? $lesson->starter_html ?? '';
            $workspace['css_code'] = $progress->css_code ?? $lesson->starter_css ?? '';
            $workspace['js_code'] = $progress->js_code ?? $lesson->starter_javascript ?? '';
        }
        $workspace['is_read_only'] = $this->teacherCompleted($request->user()->id, $lesson->id);
        $workspace['python_code'] = $progress->python_code ?? $progress->html_code;
        $workspace['apps_script_code'] = $progress->apps_script_code ?? $progress->html_code ?? $lesson->starter_apps_script ?? '';
        $workspace['apps_script_project_url'] = $progress->apps_script_project_url ?? '';
        $workspace['apps_script_notes'] = $progress->apps_script_notes ?? '';
        $workspace['vba_code'] = $progress->vba_code ?? $progress->html_code ?? $lesson->starter_vba ?? '';
        $workspace['vba_workbook_url'] = $progress->vba_workbook_url ?? '';
        $workspace['vba_notes'] = $progress->vba_notes ?? '';
        $workspace['csharp_code'] = $progress->csharp_code ?? $progress->html_code ?? $lesson->starter_csharp ?? '';
        $workspace['csharp_project_url'] = $progress->csharp_project_url ?? '';
        $workspace['csharp_notes'] = $progress->csharp_notes ?? '';
        $workspace['vbnet_code'] = $progress->vbnet_code ?? $progress->html_code ?? $lesson->starter_vbnet;
        $workspace['vbnet_project_url'] = $progress->vbnet_project_url ?? '';
        $workspace['vbnet_notes'] = $progress->vbnet_notes ?? '';
        $workspace['sql_code'] = $progress->sql_code ?? $progress->html_code;
        $workspace['java_code'] = $progress->java_code ?? $progress->html_code;
        $workspace['cpp_code'] = $progress->cpp_code ?? $progress->html_code;
        $workspace['php_code'] = $progress->php_code ?? $progress->html_code;
        $workspace['program_input'] = $progress->program_input ?? '';
        $workspace['scratch_project_url'] = $progress->scratch_project_url ?? '';
        $workspace['scratch_notes'] = $progress->scratch_notes ?? '';
        if ($lesson->isWordpress()) {
            foreach (['wordpress_practice_url', 'wordpress_project_url', 'wordpress_environment', 'wordpress_notes'] as $field) {
                $workspace[$field] = $progress->$field ?? '';
            }
            $workspace['wordpress_evidence'] = $progress->wordpress_evidence ?? [];
        }

        return Inertia::render(match (true) {
            $lesson->isWordpress() => 'code-lab/wordpress',
            $lesson->isGoogleAppsScript() => 'code-lab/google-apps-script',
            $lesson->isVba() => 'code-lab/vba',
            $lesson->isCsharp() => 'code-lab/csharp',
            $lesson->isVbnet() => 'code-lab/vbnet',
            $lesson->isTailwind() => 'code-lab/tailwind',
            $lesson->isBootstrap() => 'code-lab/bootstrap',
            $lesson->isJavascript() => 'code-lab/javascript',
            $lesson->isSql() => 'code-lab/sql',
            $lesson->isJava() => 'code-lab/java',
            $lesson->isCpp() => 'code-lab/cpp',
            $lesson->isPhp() => 'code-lab/php',
            $lesson->isScratch() => 'code-lab/scratch',
            $lesson->isPython() => 'code-lab/python',
            default => 'code-lab/show',
        }, [
            'lesson' => $lessonData,
            'workspace' => $workspace,
            'previousLesson' => $previousLesson?->only('id', 'number', 'title'),
            'nextLesson' => $nextLesson ? [
                'id' => $nextLesson->id, 'number' => $nextLesson->number, 'title' => $nextLesson->title,
                'unlocked' => CourseAccess::unlocked($request->user(), $nextLesson),
            ] : null,
            'feedback' => Submission::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)
                ->with('feedback.teacher:id,name')->latest('version')->first(),
            'bootstrapVersion' => config('bootstrap.version'),
            'tailwindVersion' => config('tailwind.version'),
            'aiConfigured' => filled(config('services.openai.key')),
            'csharpExecutionAvailable' => CsharpSandbox::available(),
            'vbnetExecutionAvailable' => VbnetSandbox::available(),
            'javaExecutionAvailable' => JavaSandbox::available(),
            'javaSharedTestService' => config('java.provider') === 'judge0-public-test' && JavaSandbox::available(),
        ]);
    }

    public function save(Request $request, Lesson $lesson, LessonCodeValidator $validator)
    {
        abort_if($lesson->isProgramming(), 422, 'Use the structured programming workspace endpoint.');
        abort_if($lesson->isScratch() || $lesson->isWordpress(), 422, 'Use the Scratch project workspace to save this lesson.');
        $this->ensureUnlocked($request, $lesson);
        $this->ensureEditable($request, $lesson);
        $data = $this->validatedCode($request, true, $lesson);
        $data['html_code'] = $validator->normalizeLegacyHtml($lesson, $data['html_code']);

        $progress = DB::transaction(function () use ($request, $lesson, $data) {
            $progress = StudentLessonProgress::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)->lockForUpdate()->firstOrFail();
            $this->ensureEditable($request, $lesson);
            if ($progress->version !== (int) $data['version']) {
                throw ValidationException::withMessages(['version' => 'A newer save exists. Refresh before saving again.']);
            }
            $css = ! $lesson->isWebWorkspace() && $lesson->level !== 'Advanced' ? '' : ($data['css_code'] ?? '');
            $extraFiles = $lesson->number === 15 ? ($data['extra_files'] ?? []) : [];
            $changed = ($lesson->isCsharp() && (($progress->csharp_project_url ?? '') !== ($data['csharp_project_url'] ?? '') || ($progress->csharp_notes ?? '') !== ($data['csharp_notes'] ?? ''))) || ($lesson->isGoogleAppsScript() && (($progress->apps_script_project_url ?? '') !== ($data['apps_script_project_url'] ?? '') || ($progress->apps_script_notes ?? '') !== ($data['apps_script_notes'] ?? ''))) || ($lesson->isVba() && (($progress->vba_workbook_url ?? '') !== ($data['vba_workbook_url'] ?? '') || ($progress->vba_notes ?? '') !== ($data['vba_notes'] ?? ''))) || ($lesson->isVbnet() && (($progress->vbnet_project_url ?? '') !== ($data['vbnet_project_url'] ?? '') || ($progress->vbnet_notes ?? '') !== ($data['vbnet_notes'] ?? ''))) || ($lesson->isWebWorkspace() && ($progress->js_code ?? '') !== ($data['js_code'] ?? '')) || (($lesson->isPython() || $lesson->isPhp() || $lesson->isCpp() || $lesson->isJava() || $lesson->isSql() || $lesson->isWebWorkspace() || $lesson->isCsharp() || $lesson->isVbnet() || $lesson->isVba() || $lesson->isGoogleAppsScript()) && ($progress->program_input ?? '') !== ($data['program_input'] ?? '')) || $progress->html_code !== $data['html_code'] || $progress->css_code !== $css || ($progress->extra_files ?? []) !== $extraFiles;
            if ($changed && $progress->status !== 'completed') {
                Submission::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)
                    ->whereIn('status', ['submitted', 'quiz_pending'])->update(['status' => 'superseded']);
            }
            $progress->update([
                'apps_script_code' => $lesson->isGoogleAppsScript() ? $data['html_code'] : $progress->apps_script_code,
                'apps_script_project_url' => $lesson->isGoogleAppsScript() ? ($data['apps_script_project_url'] ?? '') : $progress->apps_script_project_url,
                'apps_script_notes' => $lesson->isGoogleAppsScript() ? ($data['apps_script_notes'] ?? '') : $progress->apps_script_notes,
                'vba_code' => $lesson->isVba() ? $data['html_code'] : $progress->vba_code,
                'vba_workbook_url' => $lesson->isVba() ? ($data['vba_workbook_url'] ?? '') : $progress->vba_workbook_url,
                'vba_notes' => $lesson->isVba() ? ($data['vba_notes'] ?? '') : $progress->vba_notes,
                'csharp_code' => $lesson->isCsharp() ? $data['html_code'] : $progress->csharp_code,
                'vbnet_code' => $lesson->isVbnet() ? $data['html_code'] : $progress->vbnet_code,
                'csharp_project_url' => $lesson->isCsharp() ? ($data['csharp_project_url'] ?? '') : $progress->csharp_project_url,
                'vbnet_project_url' => $lesson->isVbnet() ? ($data['vbnet_project_url'] ?? '') : $progress->vbnet_project_url,
                'csharp_notes' => $lesson->isCsharp() ? ($data['csharp_notes'] ?? '') : $progress->csharp_notes,
                'vbnet_notes' => $lesson->isVbnet() ? ($data['vbnet_notes'] ?? '') : $progress->vbnet_notes,
                'sql_code' => $lesson->isSql() ? $data['html_code'] : $progress->sql_code,
                'java_code' => $lesson->isJava() ? $data['html_code'] : $progress->java_code,
                'cpp_code' => $lesson->isCpp() ? $data['html_code'] : $progress->cpp_code,
                'php_code' => $lesson->isPhp() ? $data['html_code'] : $progress->php_code,
                'python_code' => $lesson->isPython() ? $data['html_code'] : $progress->python_code,
                'program_input' => $data['program_input'] ?? '',
                'html_code' => $data['html_code'], 'css_code' => $css, 'js_code' => $data['js_code'] ?? '',
                'extra_files' => $extraFiles,
                'version' => $progress->version + 1, 'last_saved_at' => now(),
                'status' => $changed && $progress->status !== 'completed' ? 'in_progress' : ($progress->status === 'not_started' ? 'in_progress' : $progress->status),
                'activity_passed_at' => $changed && $progress->status !== 'completed' ? null : $progress->activity_passed_at,
            ]);

            return $progress->fresh();
        });
        $this->log($request->user()->id, 'code_saved', $lesson, ['version' => $progress->version]);

        return response()->json(['version' => $progress->version, 'last_saved_at' => $progress->last_saved_at?->toIso8601String()]);
    }

    public function check(Request $request, Lesson $lesson, LessonCodeValidator $validator)
    {
        abort_if($lesson->isProgramming(), 422, 'Use the structured programming workspace endpoint.');
        abort_if($lesson->isScratch() || $lesson->isWordpress(), 422, 'Scratch projects require teacher review.');
        $this->ensureUnlocked($request, $lesson);
        $this->ensureEditable($request, $lesson);
        $data = $this->validatedCode($request, false, $lesson);
        $data['html_code'] = $validator->normalizeLegacyHtml($lesson, $data['html_code']);
        $errors = $validator->check($lesson, $lesson->isJavascript() ? ($data['js_code'] ?? '') : $data['html_code'], ! $lesson->isWebWorkspace() && $lesson->level !== 'Advanced' ? '' : ($data['css_code'] ?? ''), $data['extra_files'] ?? []);

        return response()->json(['passed' => count($errors) === 0, 'issues' => $errors]);
    }

    public function submit(Request $request, Lesson $lesson, LessonCodeValidator $validator)
    {
        abort_if($lesson->isProgramming(), 422, 'Use the structured programming workspace endpoint.');
        abort_if($lesson->isScratch() || $lesson->isWordpress(), 422, 'Use the Scratch project workspace to submit this lesson.');
        $this->ensureUnlocked($request, $lesson);
        $this->ensureEditable($request, $lesson);
        $data = $this->validatedCode($request, true, $lesson);
        $data['html_code'] = $validator->normalizeLegacyHtml($lesson, $data['html_code']);
        $css = ! $lesson->isWebWorkspace() && $lesson->level !== 'Advanced' ? '' : ($data['css_code'] ?? '');
        $errors = $validator->check($lesson, $lesson->isJavascript() ? ($data['js_code'] ?? '') : $data['html_code'], $css, $data['extra_files'] ?? []);
        if ($errors) {
            return response()->json(['message' => 'Your activity needs a few changes.', 'issues' => $errors], 422);
        }

        $submission = DB::transaction(function () use ($request, $lesson, $data, $css) {
            $progress = StudentLessonProgress::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)->lockForUpdate()->firstOrFail();
            $this->ensureEditable($request, $lesson);
            if ($progress->version !== (int) $data['version']) {
                throw ValidationException::withMessages(['version' => 'Please save or refresh your latest work before submitting.']);
            }
            $version = Submission::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)->max('version') + 1;
            $status = $progress->status === 'completed' || $lesson->auto_complete || ($lesson->quiz && $progress->quiz_passed_at)
                ? 'completed' : ($lesson->quiz ? 'quiz_pending' : 'submitted');
            if ($lesson->isPython() || $lesson->isPhp() || $lesson->isCpp() || $lesson->isJava() || $lesson->isSql() || $lesson->isWebWorkspace() || $lesson->isCsharp() || $lesson->isVbnet() || $lesson->isVba() || $lesson->isGoogleAppsScript()) {
                $status = 'submitted';
            }
            Submission::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)
                ->whereIn('status', ['submitted', 'quiz_pending'])->update(['status' => 'superseded']);
            $submission = Submission::create([
                'apps_script_code' => $lesson->isGoogleAppsScript() ? $data['html_code'] : null,
                'apps_script_project_url' => $lesson->isGoogleAppsScript() ? ($data['apps_script_project_url'] ?? '') : null,
                'apps_script_notes' => $lesson->isGoogleAppsScript() ? ($data['apps_script_notes'] ?? '') : null,
                'vba_code' => $lesson->isVba() ? $data['html_code'] : null,
                'vba_workbook_url' => $lesson->isVba() ? ($data['vba_workbook_url'] ?? '') : null,
                'vba_notes' => $lesson->isVba() ? ($data['vba_notes'] ?? '') : null,
                'csharp_code' => $lesson->isCsharp() ? $data['html_code'] : null,
                'vbnet_code' => $lesson->isVbnet() ? $data['html_code'] : null,
                'csharp_project_url' => $lesson->isCsharp() ? ($data['csharp_project_url'] ?? '') : null,
                'vbnet_project_url' => $lesson->isVbnet() ? ($data['vbnet_project_url'] ?? '') : null,
                'csharp_notes' => $lesson->isCsharp() ? ($data['csharp_notes'] ?? '') : null,
                'vbnet_notes' => $lesson->isVbnet() ? ($data['vbnet_notes'] ?? '') : null,
                'sql_code' => $lesson->isSql() ? $data['html_code'] : null,
                'java_code' => $lesson->isJava() ? $data['html_code'] : null,
                'cpp_code' => $lesson->isCpp() ? $data['html_code'] : null,
                'php_code' => $lesson->isPhp() ? $data['html_code'] : null,
                'python_code' => $lesson->isPython() ? $data['html_code'] : null, 'program_input' => $data['program_input'] ?? '',
                'user_id' => $request->user()->id, 'lesson_id' => $lesson->id, 'version' => $version, 'status' => $status,
                'html_code' => $data['html_code'], 'css_code' => $css, 'js_code' => $data['js_code'] ?? '',
                'extra_files' => $lesson->number === 15 ? ($data['extra_files'] ?? []) : [], 'submitted_at' => now(),
            ]);
            $progress->update([
                'apps_script_code' => $lesson->isGoogleAppsScript() ? $data['html_code'] : $progress->apps_script_code,
                'apps_script_project_url' => $lesson->isGoogleAppsScript() ? ($data['apps_script_project_url'] ?? '') : $progress->apps_script_project_url,
                'apps_script_notes' => $lesson->isGoogleAppsScript() ? ($data['apps_script_notes'] ?? '') : $progress->apps_script_notes,
                'vba_code' => $lesson->isVba() ? $data['html_code'] : $progress->vba_code,
                'vba_workbook_url' => $lesson->isVba() ? ($data['vba_workbook_url'] ?? '') : $progress->vba_workbook_url,
                'vba_notes' => $lesson->isVba() ? ($data['vba_notes'] ?? '') : $progress->vba_notes,
                'csharp_code' => $lesson->isCsharp() ? $data['html_code'] : $progress->csharp_code,
                'vbnet_code' => $lesson->isVbnet() ? $data['html_code'] : $progress->vbnet_code,
                'csharp_project_url' => $lesson->isCsharp() ? ($data['csharp_project_url'] ?? '') : $progress->csharp_project_url,
                'vbnet_project_url' => $lesson->isVbnet() ? ($data['vbnet_project_url'] ?? '') : $progress->vbnet_project_url,
                'csharp_notes' => $lesson->isCsharp() ? ($data['csharp_notes'] ?? '') : $progress->csharp_notes,
                'vbnet_notes' => $lesson->isVbnet() ? ($data['vbnet_notes'] ?? '') : $progress->vbnet_notes,
                'sql_code' => $lesson->isSql() ? $data['html_code'] : $progress->sql_code,
                'java_code' => $lesson->isJava() ? $data['html_code'] : $progress->java_code,
                'cpp_code' => $lesson->isCpp() ? $data['html_code'] : $progress->cpp_code,
                'php_code' => $lesson->isPhp() ? $data['html_code'] : $progress->php_code,
                'python_code' => $lesson->isPython() ? $data['html_code'] : $progress->python_code, 'program_input' => $data['program_input'] ?? '',
                'status' => $status,
                'html_code' => $data['html_code'],
                'css_code' => $css, 'js_code' => $data['js_code'] ?? '',
                'extra_files' => $lesson->number === 15 ? ($data['extra_files'] ?? []) : [],
                'last_saved_at' => now(),
                'submitted_at' => now(),
                'activity_passed_at' => now(),
                'completed_at' => $status === 'completed' ? ($progress->completed_at ?? now()) : null,
            ]);

            return $submission;
        });
        $this->log($request->user()->id, ($lesson->isPhp() || $lesson->isCpp() || $lesson->isJava() || $lesson->isSql() || $lesson->isWebWorkspace() || $lesson->isCsharp() || $lesson->isVbnet() || $lesson->isVba() || $lesson->isGoogleAppsScript()) && $lesson->is_project ? 'project_submitted' : 'activity_submitted', $lesson, ['submission_id' => $submission->id]);

        return response()->json(['status' => $submission->status, 'message' => ($lesson->isPython() || $lesson->isPhp() || $lesson->isCpp() || $lesson->isJava() || $lesson->isSql() || $lesson->isWebWorkspace() || $lesson->isCsharp() || $lesson->isVbnet() || $lesson->isVba() || $lesson->isGoogleAppsScript()) ? 'Activity submitted for teacher review. Pass the quiz and receive teacher approval to complete this lesson.' : ($submission->status === 'completed' ? 'Activity and quiz complete. Next lesson unlocked!' : ($lesson->quiz ? 'Coding activity passed. Complete the quiz to unlock the next lesson.' : 'Activity submitted for review.'))]);
    }

    public function quiz(Request $request, Lesson $lesson)
    {
        $this->ensureUnlocked($request, $lesson);
        $this->ensureEditable($request, $lesson);
        $questions = $lesson->quiz ?? [];
        $count = $lesson->isProgramming() ? 10 : 5;
        abort_unless(count($questions) === $count, 404);
        $data = $request->validate(['answers' => 'required|array|list|size:'.$count, 'answers.*' => 'required|integer|between:0,3']);
        $quizOrder = $lesson->isProgramming() ? $request->session()->get('programming_quiz.'.$lesson->id) : null;
        if ($lesson->isProgramming()) {
            abort_unless(is_array($quizOrder) && count($quizOrder) === 10, 422, 'Open the lesson before taking its quiz.');
            $questions = array_map(function ($entry) use ($questions) {
                $q = $questions[$entry['question']];
                $q['answer'] = array_search($q['answer'], $entry['choices'], true);
                return $q;
            }, $quizOrder);
        }
        $threshold = (int) ceil($count * 0.8);
        $score = 0;
        $feedback = [];
        foreach ($questions as $index => $question) {
            $correct = (int) $question['answer'];
            $isCorrect = (int) $data['answers'][$index] === $correct;
            $score += (int) $isCorrect;
            $feedback[] = [
                'correct' => $isCorrect,
                'correctAnswer' => $correct,
                'explanation' => $question['explanation'],
            ];
        }
        $progress = DB::transaction(function () use ($request, $lesson, $data, $score, $threshold) {
            $progress = StudentLessonProgress::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)->lockForUpdate()->firstOrFail();
            $this->ensureEditable($request, $lesson);
            $passed = $score >= $threshold || (bool) $progress->quiz_passed_at;
            $complete = $passed && ($progress->activity_passed_at || $progress->status === 'completed');
            if ($lesson->requiresTeacherReview()) {
                $complete = $passed && $this->teacherCompleted($request->user()->id, $lesson->id);
            }
            $progress->update([
                'quiz_answers' => $data['answers'], 'quiz_score' => $score,
                'quiz_passed_at' => $passed ? ($progress->quiz_passed_at ?? now()) : null,
                'status' => $complete ? 'completed' : $progress->status,
                'completed_at' => $complete ? ($progress->completed_at ?? now()) : $progress->completed_at,
            ]);
            if ($complete) {
                Submission::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)
                    ->whereIn('status', ['submitted', 'quiz_pending'])->update(['status' => 'completed']);
            }

            return $progress->fresh();
        });
        $this->log($request->user()->id, 'quiz_submitted', $lesson, ['score' => $score, 'passed' => $score >= $threshold]);

        return response()->json([
            'score' => $score, 'passed' => $score >= $threshold, 'completed' => $progress->status === 'completed',
            'feedback' => $feedback,
            'message' => $score >= $threshold ? ($progress->status === 'completed' ? 'Lesson completed! Next lesson unlocked.' : ($lesson->isWordpress() ? 'Quiz passed! Submit practical evidence and wait for teacher review.' : 'Quiz passed! Submit your coding activity to finish.')) : "Score at least {$threshold} out of {$count} to pass. Review the explanations and try again.",
        ]);
    }

    private function validatedCode(Request $request, bool $requireVersion = true, ?Lesson $lesson = null): array
    {
        if (($lesson?->isJava() || $lesson?->isSql() || $lesson?->isWebWorkspace() || $lesson?->isCsharp() || $lesson?->isVbnet() || $lesson?->isVba() || $lesson?->isGoogleAppsScript()) && $request->isJson()) {
            // Restore only code/input from JSON after Laravel's global trimming.
            // They still pass the same validation and size limits below.
            $raw = json_decode($request->getContent(), true);
            if (is_array($raw)) {
                $request->merge(Arr::only($raw, $lesson->isGoogleAppsScript() ? ['html_code', 'apps_script_notes'] : ($lesson->isVba() ? ['html_code', 'vba_notes'] : ($lesson->isWebWorkspace() ? ['html_code', 'css_code', 'js_code', 'program_input'] : ($lesson->isCsharp() ? ['html_code', 'program_input', 'csharp_notes'] : ($lesson->isVbnet() ? ['html_code', 'program_input', 'vbnet_notes'] : ['html_code', 'program_input']))))));
            }
        }
        $rules = [
            'html_code' => 'required|string|max:200000', 'css_code' => 'nullable|string|max:200000',
            'js_code' => 'nullable|string|max:100000',
            'program_input' => 'nullable|string|max:20000',
            'extra_files' => 'sometimes|array',
            'extra_files.*' => 'string|max:200000',
        ];
        if ($requireVersion) {
            $rules['version'] = 'required|integer|min:1';
        }

        if ($lesson?->isCsharp()) {
            $rules['csharp_project_url'] = ['nullable', 'url:http,https', 'max:2048', function ($attribute, $value, $fail) {
                if (parse_url($value, PHP_URL_USER) || parse_url($value, PHP_URL_PASS)) {
                    $fail('Project links must not contain credentials.');
                }
            }];
            $rules['csharp_notes'] = 'nullable|string|max:20000';
        }
        if ($lesson?->isVbnet()) {
            $rules['vbnet_project_url'] = ['nullable', 'url:http,https', 'max:2048', function ($attribute, $value, $fail) {
                if (parse_url($value, PHP_URL_USER) || parse_url($value, PHP_URL_PASS)) {
                    $fail('Project links must not contain credentials.');
                }
            }];
            $rules['vbnet_notes'] = 'nullable|string|max:20000';
        }
        if ($lesson?->isVba()) {
            $rules['vba_workbook_url'] = ['nullable', 'url:http,https', 'max:2048', function ($attribute, $value, $fail) {
                if (parse_url($value, PHP_URL_USER) || parse_url($value, PHP_URL_PASS)) {
                    $fail('Workbook links must not contain credentials.');
                }
            }];
            $rules['vba_notes'] = 'nullable|string|max:20000';
        }
        if ($lesson?->isGoogleAppsScript()) {
            $rules['apps_script_project_url'] = ['nullable', 'url:http,https', 'max:2048', function ($attribute, $value, $fail) {
                if (parse_url($value, PHP_URL_USER) || parse_url($value, PHP_URL_PASS)) {
                    $fail('Project links must not contain credentials.');
                }
            }];
            $rules['apps_script_notes'] = 'nullable|string|max:20000';
        }
        $data = $request->validate($rules);
        if (array_diff(array_keys($data['extra_files'] ?? []), ['about.html', 'gallery.html', 'contact.html'])) {
            throw ValidationException::withMessages(['extra_files' => 'Only about.html, gallery.html, and contact.html are supported.']);
        }

        return $data;
    }

    private function log(int $userId, string $event, Lesson $lesson, array $metadata = []): void
    {
        ActivityLog::create(['user_id' => $userId, 'event' => $event, 'subject_type' => Lesson::class, 'subject_id' => $lesson->id, 'metadata' => $metadata, 'occurred_at' => now()]);
    }
}

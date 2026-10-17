<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Lesson;
use App\Models\StudentLessonProgress;
use App\Models\Submission;
use App\Models\TeacherFeedback;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SubmissionController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Submission::with(['user:id,name,username,grade_level,section', 'lesson:id,number,title,level', 'caseStudy:id,number,title'])
            ->orderByRaw("CASE WHEN status = 'submitted' THEN 0 ELSE 1 END")
            ->latest('submitted_at');
        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        return Inertia::render('submissions/index', [
            'submissions' => $query->paginate(20),
            'awaitingReview' => Submission::where('status', 'submitted')->count(),
            'filters' => $request->only('status'),
        ]);
    }

    public function show(Submission $submission): Response
    {
        $progress = $submission->lesson_id ? StudentLessonProgress::where('user_id', $submission->user_id)
            ->where('lesson_id', $submission->lesson_id)->first() : null;
        $quizRequired = count($submission->lesson?->quiz ?? []) >= 5;

        return Inertia::render('submissions/show', [
            'submission' => $submission->load(['user', 'lesson.course', 'caseStudy', 'feedback']),
            'quizRequired' => $quizRequired,
            'bootstrapVersion' => config('bootstrap.version'),
            'tailwindVersion' => config('tailwind.version'),
            'quizScore' => $progress?->quiz_score,
            'quizTotal' => count($submission->lesson?->quiz ?? []),
            'canComplete' => ! $quizRequired || ($progress?->quiz_passed_at && $progress?->activity_passed_at) || $progress?->status === 'completed',
            'versions' => Submission::where('user_id', $submission->user_id)
                ->when($submission->lesson_id, fn ($q) => $q->where('lesson_id', $submission->lesson_id))
                ->when($submission->case_study_id, fn ($q) => $q->where('case_study_id', $submission->case_study_id))
                ->orderByDesc('version')->get(['id', 'version', 'status', 'submitted_at']),
        ]);
    }

    public function review(Request $request, Submission $submission)
    {
        $data = $request->validate([
            'status' => 'required|in:completed,needs_revision',
            'comment' => 'required_if:status,needs_revision|nullable|string|max:5000',
            'rubric_scores' => 'nullable|array',
            'rubric_scores.*' => 'required|numeric|min:0|max:100',
        ]);
        if (($submission->lesson?->isProgramming() || $submission->lesson?->isWordpress() || $submission->lesson?->isScratch() || $submission->lesson?->isPhp() || $submission->lesson?->isCpp() || $submission->lesson?->isJava() || $submission->lesson?->isSql() || $submission->lesson?->isWebWorkspace() || $submission->lesson?->isCsharp() || $submission->lesson?->isVbnet() || $submission->lesson?->isVba() || $submission->lesson?->isGoogleAppsScript()) && $submission->lesson->is_project && $data['status'] === 'completed') {
            $scores = $data['rubric_scores'] ?? [];
            $rubric = $submission->lesson->rubric ?? [];
            if (! $rubric || array_diff(array_keys($rubric), array_keys($scores)) || array_diff(array_keys($scores), array_keys($rubric))) {
                throw ValidationException::withMessages(['rubric_scores' => 'Grade every project rubric category before approving.']);
            }
            foreach ($rubric as $name => $maximum) {
                if ($scores[$name] > $maximum) {
                    throw ValidationException::withMessages(['rubric_scores' => "{$name} must not exceed {$maximum} points."]);
                }
            }
        }
        $data['comment'] = filled($data['comment'] ?? null) ? $data['comment'] : 'Good work. Activity completed.';
        if ($data['status'] === 'completed' && $submission->lesson?->quiz) {
            $progress = StudentLessonProgress::where('user_id', $submission->user_id)->where('lesson_id', $submission->lesson_id)->first();
            if ($progress?->status !== 'completed' && (! $progress?->activity_passed_at || ! $progress?->quiz_passed_at)) {
                throw ValidationException::withMessages(['status' => 'The student must submit the practical activity and pass the lesson quiz before this lesson can be completed.']);
            }
        }
        DB::transaction(function () use ($request, $submission, $data) {
            if ($submission->lesson_id) {
                $progress = StudentLessonProgress::where('user_id', $submission->user_id)->where('lesson_id', $submission->lesson_id)
                    ->lockForUpdate()->first();
                if ($submission->lesson?->requiresTeacherReview()) {
                    $latest = Submission::where('user_id', $submission->user_id)->where('lesson_id', $submission->lesson_id)->latest('version')->first();
                    $edited = $submission->lesson->isCsharp()
                        ? $progress?->csharp_code !== $submission->csharp_code || $progress?->program_input !== $submission->program_input || ($progress?->csharp_project_url ?? '') !== ($submission->csharp_project_url ?? '') || ($progress?->csharp_notes ?? '') !== ($submission->csharp_notes ?? '')
                        : ($submission->lesson->isGoogleAppsScript()
                        ? $progress?->apps_script_code !== $submission->apps_script_code || ($progress?->apps_script_project_url ?? '') !== ($submission->apps_script_project_url ?? '') || ($progress?->apps_script_notes ?? '') !== ($submission->apps_script_notes ?? '')
                        : ($submission->lesson->isVba()
                        ? $progress?->vba_code !== $submission->vba_code || ($progress?->vba_workbook_url ?? '') !== ($submission->vba_workbook_url ?? '') || ($progress?->vba_notes ?? '') !== ($submission->vba_notes ?? '')
                        : ($submission->lesson->isVbnet()
                        ? $progress?->vbnet_code !== $submission->vbnet_code || $progress?->program_input !== $submission->program_input || ($progress?->vbnet_project_url ?? '') !== ($submission->vbnet_project_url ?? '') || ($progress?->vbnet_notes ?? '') !== ($submission->vbnet_notes ?? '')
                        : ($submission->lesson->isWebWorkspace()
                        ? $progress?->js_code !== $submission->js_code || $progress?->html_code !== $submission->html_code || $progress?->css_code !== $submission->css_code || $progress?->program_input !== $submission->program_input
                        : ($submission->lesson->isSql()
                        ? $progress?->sql_code !== $submission->sql_code || $progress?->program_input !== $submission->program_input
                        : ($submission->lesson->isJava()
                        ? $progress?->java_code !== $submission->java_code || $progress?->program_input !== $submission->program_input
                        : ($submission->lesson->isCpp()
                        ? $progress?->cpp_code !== $submission->cpp_code || $progress?->program_input !== $submission->program_input
                        : ($submission->lesson->isPhp()
                        ? $progress?->php_code !== $submission->php_code || $progress?->program_input !== $submission->program_input
                        : ($submission->lesson->isScratch()
                        ? $progress?->scratch_project_url !== $submission->scratch_project_url || $progress?->scratch_notes !== $submission->scratch_notes
                        : $progress?->python_code !== $submission->python_code)))))))));
                    if ($submission->lesson->isProgramming()) {
                        $edited = $progress?->programming_workspace !== $submission->programming_workspace;
                    }
                    if ($submission->lesson->isWordpress()) {
                        $edited = false;
                        foreach (['wordpress_practice_url', 'wordpress_project_url', 'wordpress_environment', 'wordpress_notes', 'wordpress_evidence'] as $field) {
                            if ($progress?->$field !== $submission->$field) {
                                $edited = true;
                            }
                        }
                    }
                    if ($latest?->id !== $submission->id || $submission->fresh()->status === 'superseded' || $edited) {
                        throw ValidationException::withMessages(['status' => 'Review the latest submission. This version has been superseded or edited.']);
                    }
                }
            }
            $previousStatus = $submission->status;
            $submission->update(['status' => $data['status'], 'reviewed_at' => now(), 'reviewed_by' => $request->user()->id]);
            if (($submission->lesson?->isProgramming() || $submission->lesson?->isWordpress() || $submission->lesson?->isPhp() || $submission->lesson?->isCpp() || $submission->lesson?->isJava() || $submission->lesson?->isSql() || $submission->lesson?->isWebWorkspace() || $submission->lesson?->isCsharp() || $submission->lesson?->isVbnet() || $submission->lesson?->isVba() || $submission->lesson?->isGoogleAppsScript()) && $data['status'] === 'completed' && $previousStatus !== 'completed') {
                ActivityLog::create(['user_id' => $submission->user_id, 'event' => 'lesson_completed', 'subject_type' => Lesson::class, 'subject_id' => $submission->lesson_id, 'metadata' => ['course_id' => $submission->lesson->course_id, 'module_id' => $submission->lesson->course_module_id], 'occurred_at' => now()]);
            }
            if (($submission->lesson?->isProgramming() || $submission->lesson?->isWordpress() || $submission->lesson?->isScratch() || $submission->lesson?->isPhp() || $submission->lesson?->isCpp() || $submission->lesson?->isJava() || $submission->lesson?->isSql() || $submission->lesson?->isWebWorkspace() || $submission->lesson?->isCsharp() || $submission->lesson?->isVbnet() || $submission->lesson?->isVba() || $submission->lesson?->isGoogleAppsScript()) && $submission->lesson->is_project && $data['status'] === 'completed') {
                $submission->update(['rubric_scores' => array_map('floatval', $data['rubric_scores'])]);
                ActivityLog::create(['user_id' => $submission->user_id, 'event' => 'project_graded', 'subject_type' => Submission::class, 'subject_id' => $submission->id, 'metadata' => ['score' => array_sum($data['rubric_scores'])], 'occurred_at' => now()]);
            }
            TeacherFeedback::create(['submission_id' => $submission->id, 'teacher_id' => $request->user()->id, 'comment' => $data['comment']]);
            if ($submission->lesson_id) {
                StudentLessonProgress::where('user_id', $submission->user_id)->where('lesson_id', $submission->lesson_id)->update([
                    'status' => $data['status'], 'completed_at' => $data['status'] === 'completed' ? now() : null,
                ]);
            }
            if ($submission->case_study_id) {
                DB::table('case_study_progress')->where('user_id', $submission->user_id)->where('case_study_id', $submission->case_study_id)->update([
                    'status' => $data['status'], 'completed_at' => $data['status'] === 'completed' ? now() : null, 'updated_at' => now(),
                ]);
            }
            ActivityLog::create(['user_id' => $submission->user_id, 'event' => $data['status'] === 'completed' ? 'activity_completed' : 'revision_requested', 'subject_type' => Submission::class, 'subject_id' => $submission->id, 'metadata' => ['comment' => $data['comment']], 'occurred_at' => now()]);
        });

        return back()->with('success', 'Review saved and the student has been notified.');
    }
}

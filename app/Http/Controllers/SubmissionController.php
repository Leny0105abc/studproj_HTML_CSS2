<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\StudentLessonProgress;
use App\Models\Submission;
use App\Models\TeacherFeedback;
use App\Services\CourseAccess;
use App\Services\CourseProgress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SubmissionController extends Controller
{
    public function index(Request $request): Response
    {
        $ids = app(CourseAccess::class)->visible($request->user())->pluck('id');
        $query = Submission::with(['user:id,name,username,grade_level,section', 'lesson:id,number,title,level', 'caseStudy:id,number,title'])
            ->orderByRaw("CASE WHEN status = 'submitted' THEN 0 ELSE 1 END")
            ->latest('submitted_at');
        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }
        if ($request->user()->role === 'teacher') {
            $query->where(fn ($q) => $q->whereHas('lesson', fn ($l) => $l->whereIn('course_id', $ids)->orWhereNull('course_id'))
                ->orWhereHas('caseStudy', fn ($c) => $c->whereIn('course_id', $ids)->orWhereNull('course_id')));
        }

        return Inertia::render('submissions/index', [
            'submissions' => $query->paginate(20),
            'awaitingReview' => Submission::where('status', 'submitted')->when($request->user()->role === 'teacher', fn ($q) => $q
                ->where(fn ($s) => $s->whereHas('lesson', fn ($l) => $l->whereIn('course_id', $ids)->orWhereNull('course_id'))
                    ->orWhereHas('caseStudy', fn ($c) => $c->whereIn('course_id', $ids)->orWhereNull('course_id'))))->count(),
            'filters' => $request->only('status'),
        ]);
    }

    public function show(Submission $submission): Response
    {
        $course = $submission->lesson?->course ?? $submission->caseStudy?->course;
        if ($course) {
            Gate::authorize('update', $course);
        }
        $progress = $submission->lesson_id ? StudentLessonProgress::where('user_id', $submission->user_id)
            ->where('lesson_id', $submission->lesson_id)->first() : null;
        $quizRequired = count($submission->lesson?->quiz ?? []) > 0;

        return Inertia::render('submissions/show', [
            'submission' => $submission->load(['user', 'lesson.course', 'caseStudy.course', 'feedback']),
            'quizRequired' => $quizRequired,
            'quizScore' => $progress?->quiz_score,
            'quizTotal' => count($submission->lesson?->quiz ?? []),
            'canComplete' => ! $quizRequired || ($progress?->quiz_passed_at && (! $submission->lesson?->usesLegacyLab() || $progress?->activity_passed_at)) || $progress?->status === 'completed',
            'versions' => Submission::where('user_id', $submission->user_id)
                ->when($submission->lesson_id, fn ($q) => $q->where('lesson_id', $submission->lesson_id))
                ->when($submission->case_study_id, fn ($q) => $q->where('case_study_id', $submission->case_study_id))
                ->orderByDesc('version')->get(['id', 'version', 'status', 'submitted_at']),
        ]);
    }

    public function review(Request $request, Submission $submission)
    {
        $course = $submission->lesson?->course ?? $submission->caseStudy?->course;
        if ($course) {
            Gate::authorize('update', $course);
        }
        $data = $request->validate([
            'status' => 'required|in:completed,needs_revision',
            'comment' => 'required_if:status,needs_revision|nullable|string|max:5000',
        ]);
        $data['comment'] = filled($data['comment'] ?? null) ? $data['comment'] : 'Good work. Activity completed.';
        if ($data['status'] === 'completed' && $submission->lesson?->quiz) {
            $progress = StudentLessonProgress::where('user_id', $submission->user_id)->where('lesson_id', $submission->lesson_id)->first();
            if ($progress?->status !== 'completed' && (($submission->lesson->usesLegacyLab() && ! $progress?->activity_passed_at) || ! $progress?->quiz_passed_at)) {
                throw ValidationException::withMessages(['status' => $submission->lesson->usesLegacyLab()
                    ? 'The student must pass both the coding activity and the 5-question quiz before this lesson can be completed.'
                    : 'The student must pass the lesson quiz before this lesson can be completed.']);
            }
        }
        DB::transaction(function () use ($request, $submission, $data) {
            if ($submission->lesson_id) {
                StudentLessonProgress::where('user_id', $submission->user_id)->where('lesson_id', $submission->lesson_id)
                    ->lockForUpdate()->first();
            }
            $submission->update(['status' => $data['status'], 'reviewed_at' => now(), 'reviewed_by' => $request->user()->id]);
            TeacherFeedback::create(['submission_id' => $submission->id, 'teacher_id' => $request->user()->id, 'comment' => $data['comment']]);
            if ($submission->lesson_id) {
                StudentLessonProgress::where('user_id', $submission->user_id)->where('lesson_id', $submission->lesson_id)->update([
                    'status' => $data['status'], 'completed_at' => $data['status'] === 'completed' ? now() : null,
                    'activity_passed_at' => $data['status'] === 'completed' ? now() : null,
                ]);
            }
            if ($submission->case_study_id) {
                DB::table('case_study_progress')->where('user_id', $submission->user_id)->where('case_study_id', $submission->case_study_id)->update([
                    'status' => $data['status'], 'completed_at' => $data['status'] === 'completed' ? now() : null, 'updated_at' => now(),
                ]);
            }
            ActivityLog::create(['user_id' => $submission->user_id, 'event' => $data['status'] === 'completed' ? 'activity_completed' : 'revision_requested', 'subject_type' => Submission::class, 'subject_id' => $submission->id, 'metadata' => ['comment' => $data['comment']], 'occurred_at' => now()]);
        });

        if ($course) {
            app(CourseProgress::class)->sync($submission->user, $course);
        }

        return back()->with('success', 'Review saved and the student has been notified.');
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\ActivityResponse;
use App\Models\Lesson;
use App\Models\StudentLessonProgress;
use App\Models\Submission;
use App\Services\CourseAccess;
use App\Services\CourseProgress;
use App\Services\LessonAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class LearningController extends Controller
{
    private function access(Request $request, Lesson $lesson): void
    {
        app(LessonAccess::class)->authorize($request->user(), $lesson);
        abort_if($lesson->usesLegacyLab(), 404);
        app(CourseAccess::class)->enroll($request->user(), $lesson->course);
    }

    private function editable(Request $request, Lesson $lesson): void
    {
        abort_if(Submission::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)
            ->where('status', 'completed')->whereNotNull('reviewed_at')->exists(), 403, 'Your teacher confirmed this work complete.');
    }

    public function show(Request $request, Lesson $lesson)
    {
        $this->access($request, $lesson);
        $progress = StudentLessonProgress::firstOrCreate(['user_id' => $request->user()->id, 'lesson_id' => $lesson->id], [
            'status' => 'in_progress', 'source_code' => $lesson->starter_code, 'started_at' => now(),
        ]);
        $progress->update(['last_accessed_at' => now()]);
        $data = $lesson->toArray();
        $data['quiz'] = collect($lesson->quiz ?? [])->map(function ($q, $index) use ($lesson) {
            $choices = collect($q['choices'] ?? [])->map(fn ($value, $key) => ['key' => $key, 'value' => $value]);

            return ['key' => $index, 'type' => $q['type'] ?? 'multiple_choice', 'question' => $q['question'],
                'choices' => ($lesson->shuffle_choices ? $choices->shuffle() : $choices)->values()];
        });
        if ($lesson->shuffle_questions) {
            $data['quiz'] = $data['quiz']->shuffle();
        }
        $data['quiz'] = $data['quiz']->values();
        $feedback = Submission::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)
            ->with('feedback.teacher:id,name')->latest('version')->first();

        return Inertia::render('learning/show', [
            'lesson' => $data, 'course' => $lesson->course,
            'workspace' => $progress, 'readOnly' => $feedback?->status === 'completed' && $feedback?->reviewed_at !== null,
            'feedback' => $feedback,
            'activities' => $lesson->activities()->where('status', 'published')->with(['responses' => fn ($q) => $q->where('student_id', $request->user()->id)])->get(),
            'nextLesson' => $lesson->course->lessons()->where('is_published', true)->where('position', '>', $lesson->position)->first(['id', 'title']),
        ]);
    }

    public function save(Request $request, Lesson $lesson)
    {
        $this->access($request, $lesson);
        $this->editable($request, $lesson);
        $data = $request->validate(['source_code' => 'nullable|string|max:200000', 'version' => 'required|integer|min:1']);
        $progress = DB::transaction(function () use ($request, $lesson, $data) {
            $progress = StudentLessonProgress::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)->lockForUpdate()->firstOrFail();
            if ($progress->version !== (int) $data['version']) {
                throw ValidationException::withMessages(['version' => 'A newer save exists. Refresh before saving.']);
            }
            $progress->update(['source_code' => $data['source_code'] ?? '', 'version' => $progress->version + 1, 'last_saved_at' => now()]);

            return $progress;
        });

        return response()->json(['version' => $progress->version]);
    }

    public function submit(Request $request, Lesson $lesson)
    {
        $this->access($request, $lesson);
        $this->editable($request, $lesson);
        $data = $request->validate(['source_code' => 'required|string|max:200000', 'version' => 'required|integer|min:1']);
        DB::transaction(function () use ($request, $lesson, $data) {
            $progress = StudentLessonProgress::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)->lockForUpdate()->firstOrFail();
            if ($progress->version !== (int) $data['version']) {
                throw ValidationException::withMessages(['version' => 'Save the latest version before submitting.']);
            }
            $version = (Submission::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)->max('version') ?? 0) + 1;
            Submission::create(['user_id' => $request->user()->id, 'lesson_id' => $lesson->id, 'version' => $version,
                'html_code' => '', 'source_code' => $data['source_code'], 'status' => 'submitted', 'submitted_at' => now()]);
            $progress->update(['source_code' => $data['source_code'], 'status' => 'submitted', 'submitted_at' => now()]);
            ActivityLog::create(['user_id' => $request->user()->id, 'event' => 'lesson_submitted', 'subject_type' => Lesson::class,
                'subject_id' => $lesson->id, 'occurred_at' => now(), 'ip_address' => $request->ip()]);
        });

        return back()->with('success', 'Submitted for teacher review.');
    }

    public function complete(Request $request, Lesson $lesson)
    {
        $this->access($request, $lesson);
        abort_unless($lesson->course->editor_type === 'none', 403);
        $progress = StudentLessonProgress::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)->firstOrFail();
        abort_if($lesson->quiz && ! $progress->quiz_passed_at, 422, 'Pass the quiz first.');
        $activities = $lesson->activities()->where('status', 'published')->pluck('id');
        abort_if(ActivityResponse::where('student_id', $request->user()->id)->whereIn('activity_id', $activities)->where('status', 'completed')->count() < $activities->count(), 422, 'Complete the activities first.');
        $progress->update(['status' => 'completed', 'completed_at' => now()]);
        app(CourseProgress::class)->sync($request->user(), $lesson->course);

        return back()->with('success', 'Lesson completed.');
    }

    public function quiz(Request $request, Lesson $lesson)
    {
        $this->access($request, $lesson);
        $this->editable($request, $lesson);
        $questions = $lesson->quiz ?? [];
        abort_unless(count($questions), 404);
        $data = $request->validate(['answers' => 'required|array|size:'.count($questions), 'answers.*' => 'required|max:2000']);
        $result = DB::transaction(function () use ($request, $lesson, $questions, $data) {
            $progress = StudentLessonProgress::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)->lockForUpdate()->firstOrFail();
            abort_if($lesson->attempt_limit && $progress->quiz_attempts >= $lesson->attempt_limit, 422, 'Quiz attempt limit reached. Ask your teacher for help.');
            $score = 0;
            $feedback = [];
            foreach ($questions as $key => $question) {
                $answer = $data['answers'][$key] ?? '';
                abort_unless(is_scalar($answer), 422);
                $correct = mb_strtolower(trim((string) $answer)) === mb_strtolower(trim((string) $question['answer']));
                $score += (int) $correct;
                $feedback[] = ['correct' => $correct, 'explanation' => $question['explanation'] ?? ''];
            }
            $percent = (int) round($score / count($questions) * 100);
            $progress->update(['quiz_score' => $score, 'quiz_answers' => $data['answers'],
                'quiz_attempts' => $progress->quiz_attempts + 1, 'quiz_passed_at' => $percent >= $lesson->passing_score ? now() : $progress->quiz_passed_at]);

            return ['score' => $score, 'total' => count($questions), 'percent' => $percent, 'passed' => $percent >= $lesson->passing_score, 'feedback' => $feedback];
        });

        return response()->json($result);
    }
}

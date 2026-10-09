<?php

namespace App\Services;

use App\Models\Lesson;
use App\Models\StudentLessonProgress;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

class LessonAccess
{
    public function available(User $user, Lesson $lesson): bool
    {
        if (! $lesson->is_published || $user->status !== 'active') {
            return false;
        }
        if ($lesson->course_level_id && $lesson->courseLevel?->status !== 'published') {
            return false;
        }
        if ($lesson->course && ! app(CourseAccess::class)->canAccess($user, $lesson->course)) {
            return false;
        }
        if ($user->role !== 'student') {
            return ! $lesson->course || Gate::forUser($user)->allows('update', $lesson->course);
        }
        $current = StudentLessonProgress::where('user_id', $user->id)->where('lesson_id', $lesson->id)->first();
        if ($current?->is_manually_unlocked) {
            return true;
        }
        $rule = $lesson->course?->progression_rule ?? 'completion';
        if ($rule === 'none') {
            return true;
        }
        if ($rule === 'teacher_unlock') {
            return false;
        }
        $previous = $lesson->prerequisite_id ? Lesson::find($lesson->prerequisite_id) :
            Lesson::where('course_id', $lesson->course_id)->where('position', '<', $lesson->position)
                ->where('is_published', true)->orderByDesc('position')->first();
        if (! $previous) {
            return true;
        }
        $progress = StudentLessonProgress::where('user_id', $user->id)->where('lesson_id', $previous->id)->first();

        return match ($rule) {
            'activity' => (bool) $progress?->activity_passed_at,
            'quiz' => (bool) $progress?->quiz_passed_at,
            default => $progress?->status === 'completed',
        };
    }

    public function authorize(User $user, Lesson $lesson): void
    {
        abort_unless($this->available($user, $lesson), 403, 'This lesson is unavailable or locked. Check your course access or complete the prerequisite.');
    }
}

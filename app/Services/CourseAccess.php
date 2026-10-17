<?php

namespace App\Services;

use App\Models\Course;
use App\Models\Lesson;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class CourseAccess
{
    public static function lessons(User $user): Builder
    {
        $courses = Course::all()->filter(fn ($course) => $course->accessibleTo($user));
        $ids = $courses->pluck('id');

        return Lesson::where('is_published', true)->where(function ($q) use ($ids, $courses, $user) {
            $q->whereIn('course_id', $ids);
            if ($user->role === 'teacher' || $courses->contains('slug', 'html-css')) {
                $q->orWhereNull('course_id');
            }
        })->orderBy('course_id')->orderBy('position');
    }

    public static function unlocked(User $user, Lesson $lesson): bool
    {
        if ($user->role === 'teacher') {
            return true;
        }
        if (! $lesson->is_published || ($lesson->course && ! $lesson->course->accessibleTo($user))) {
            return false;
        }
        if (! $lesson->course_id && ! self::lessons($user)->where('id', $lesson->id)->exists()) {
            return false;
        }
        if ($lesson->course && ! $lesson->course->sequential_gating) {
            return true;
        }
        $progress = $user->lessonProgress()->where('lesson_id', $lesson->id)->first();
        if ($progress?->is_manually_unlocked) {
            return true;
        }
        $previous = $lesson->prerequisite_id ? Lesson::find($lesson->prerequisite_id) : Lesson::where('course_id', $lesson->course_id)->where('is_published', true)->where('position', '<', $lesson->position)->orderByDesc('position')->first();

        return ! $previous || $user->lessonProgress()->where('lesson_id', $previous->id)->where('status', 'completed')->exists();
    }
}

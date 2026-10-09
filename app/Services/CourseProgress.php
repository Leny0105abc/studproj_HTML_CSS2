<?php

namespace App\Services;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\User;
use Illuminate\Support\Collection;

class CourseProgress
{
    public function cards(User $user): Collection
    {
        $courses = app(CourseAccess::class)->visible($user)->with(['educationLevels', 'levels', 'lessons' => fn ($q) => $q->where('is_published', true)])
            ->orderBy('display_order')->get();
        $progress = $user->lessonProgress()->get()->keyBy('lesson_id');

        return $courses->map(function (Course $course) use ($progress) {
            $lessons = $course->lessons->filter(fn ($lesson) => ! $lesson->course_level_id || $course->levels->firstWhere('id', $lesson->course_level_id)?->status === 'published');
            $completed = $lessons->filter(fn ($lesson) => $progress->get($lesson->id)?->status === 'completed')->count();
            $next = $lessons->first(fn ($lesson) => $progress->get($lesson->id)?->status !== 'completed');

            return $course->only('id', 'name', 'slug', 'short_description', 'difficulty', 'status', 'editor_type') + [
                'programs' => $course->educationLevels->pluck('name'), 'total' => $lessons->count(), 'completed' => $completed,
                'progress' => $lessons->count() ? (int) round($completed / $lessons->count() * 100) : 0,
                'nextLesson' => $course->status === 'published' && $next ? ['id' => $next->id, 'title' => $next->title] : null,
            ];
        });
    }

    public function sync(User $user, Course $course): void
    {
        $lessons = $course->lessons()->where('is_published', true)
            ->where(fn ($q) => $q->whereNull('course_level_id')->orWhereHas('courseLevel', fn ($l) => $l->where('status', 'published')))->pluck('id');
        $complete = $lessons->isNotEmpty() && $user->lessonProgress()->whereIn('lesson_id', $lessons)->where('status', 'completed')->count() === $lessons->count();
        $enrollment = CourseEnrollment::where('student_id', $user->id)->where('course_id', $course->id)->whereIn('status', ['active', 'completed'])->first();
        $enrollment?->update(['status' => $complete ? 'completed' : 'active', 'completed_at' => $complete ? ($enrollment->completed_at ?? now()) : null]);
    }
}

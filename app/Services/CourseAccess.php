<?php

namespace App\Services;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\EducationLevel;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class CourseAccess
{
    public function levelId(User $user): ?int
    {
        return $user->education_level_id ?? EducationLevel::where('slug', 'high-school')->value('id');
    }

    public function visible(User $user): Builder
    {
        if ($user->role === 'admin') {
            return Course::query();
        }
        if ($user->role === 'teacher') {
            return Course::whereHas('teachers', fn ($t) => $t->whereKey($user->id));
        }

        return Course::where(function ($q) use ($user) {
            $q->whereHas('educationLevels', fn ($l) => $l->whereKey($this->levelId($user))->where('status', 'published'))
                ->orWhereHas('enrollments', fn ($e) => $e->where('student_id', $user->id)->whereIn('status', ['active', 'completed']));
        })->whereDoesntHave('enrollments', fn ($e) => $e->where('student_id', $user->id)->where('status', 'suspended'))
            ->where('status', '!=', 'archived');
    }

    public function canAccess(User $user, Course $course): bool
    {
        if ($user->status !== 'active') {
            return false;
        }
        if (in_array($user->role, ['admin', 'teacher'])) {
            return Gate::forUser($user)->allows('update', $course);
        }

        return $course->status === 'published' && $this->visible($user)->whereKey($course->id)->exists();
    }

    public function students(User $manager): Builder
    {
        $query = User::where('role', 'student');
        if ($manager->role === 'admin') {
            return $query;
        }
        $courses = $this->visible($manager)->pluck('id');
        $levels = DB::table('course_education_level')->whereIn('course_id', $courses)->pluck('education_level_id');
        $school = EducationLevel::where('slug', 'high-school')->value('id');

        return $query->where(function ($q) use ($courses, $levels, $school) {
            $q->whereHas('enrollments', fn ($e) => $e->whereIn('course_id', $courses))
                ->orWhereIn('education_level_id', $levels);
            if ($levels->contains($school)) {
                $q->orWhereNull('education_level_id');
            }
        });
    }

    public function enroll(User $user, Course $course): void
    {
        if ($user->role === 'student') {
            CourseEnrollment::firstOrCreate(['student_id' => $user->id, 'course_id' => $course->id], [
                'status' => 'active', 'enrolled_at' => now(),
            ]);
        }
    }
}

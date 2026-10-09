<?php

namespace App\Policies;

use App\Models\Course;
use App\Models\User;
use App\Services\CourseAccess;

class CoursePolicy
{
    public function view(User $user, Course $course): bool
    {
        return app(CourseAccess::class)->canAccess($user, $course);
    }

    public function create(User $user): bool
    {
        return $user->status === 'active' && $user->role === 'admin';
    }

    public function update(User $user, Course $course): bool
    {
        return $user->status === 'active' && ($user->role === 'admin' || ($user->role === 'teacher' &&
            $course->teachers()->whereKey($user->id)->exists()));
    }

    public function delete(User $user, Course $course): bool
    {
        return $this->create($user);
    }
}

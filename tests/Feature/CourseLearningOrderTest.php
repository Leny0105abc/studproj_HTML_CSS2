<?php

use App\Models\Course;
use App\Models\EducationLevel;
use App\Models\User;
use Database\Seeders\IntroductionProgrammingCourseSeeder;
use Database\Seeders\PythonCourseSeeder;
use Inertia\Testing\AssertableInertia as Assert;

test('college students and teachers receive introduction to programming before language courses', function () {
    $this->withoutVite();
    $this->seed(PythonCourseSeeder::class);
    $this->seed(IntroductionProgrammingCourseSeeder::class);

    foreach (['student', 'teacher'] as $role) {
        $user = User::factory()->create([
            'role' => $role,
            'education_level_id' => $role === 'student' ? EducationLevel::where('slug', 'college')->value('id') : null,
        ]);

        $this->actingAs($user)->get('/courses')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('courses/index')
            ->where('isTeacher', $role === 'teacher')
            ->where('isCollegeStudent', $role === 'student')
            ->where('courses.0.slug', 'introduction-to-programming'));

        if ($role === 'student') {
            $this->get('/dashboard')->assertOk()->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->where('courses.0.slug', 'introduction-to-programming'));
        }
    }

    $school = User::factory()->create(['education_level_id' => EducationLevel::where('slug', 'high-school')->value('id')]);
    expect(Course::inLearningOrder($school)->pluck('id')->all())->toBe(Course::orderBy('id')->pluck('id')->all());
});

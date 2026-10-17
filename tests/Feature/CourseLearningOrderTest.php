<?php

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\EducationLevel;
use App\Models\StudentLessonProgress;
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

test('college only migration preserves work and rejects school access even with an old enrollment', function () {
    $this->withoutVite();
    $this->seed(IntroductionProgrammingCourseSeeder::class);
    $schoolId = EducationLevel::where('slug', 'high-school')->value('id');
    $collegeId = EducationLevel::where('slug', 'college')->value('id');
    $course = Course::where('slug', 'introduction-to-programming')->firstOrFail();
    $school = User::factory()->create(['education_level_id' => $schoolId]);
    $teacher = User::factory()->create(['role' => 'teacher']);
    $lesson = $course->lessons()->firstOrFail();
    $course->update(['education_level_id' => $schoolId]);
    $course->educationLevels()->sync([$schoolId, $collegeId]);
    $enrollment = CourseEnrollment::create(['course_id' => $course->id, 'user_id' => $school->id]);
    $progress = StudentLessonProgress::create(['lesson_id' => $lesson->id, 'user_id' => $school->id, 'status' => 'in_progress']);

    $migration = require database_path('migrations/2026_10_17_000002_limit_introduction_programming_to_college.php');
    $migration->up();
    $this->seed(IntroductionProgrammingCourseSeeder::class);
    expect($course->fresh()->education_level_id)->toBe($collegeId)
        ->and($course->fresh()->is_shared)->toBeFalse()
        ->and($course->fresh()->audience_label)->toBe('College')
        ->and($enrollment->fresh())->not->toBeNull()
        ->and($progress->fresh()->status)->toBe('in_progress');

    $this->actingAs($school)->get('/courses')->assertInertia(fn (Assert $page) => $page
        ->where('courses', fn ($courses) => ! collect($courses)->contains('slug', 'introduction-to-programming')));
    $this->get('/courses/'.$course->slug)->assertForbidden();
    $this->get('/code-lab/'.$lesson->id)->assertForbidden();
    $this->get('/lessons/'.$lesson->id.'/preview')->assertForbidden();
    $this->postJson('/code-lab/'.$lesson->id.'/quiz', ['answers' => []])->assertForbidden();
    $this->actingAs($teacher)->post('/courses/'.$course->slug.'/assign', ['user_id' => $school->id])->assertSessionHasErrors('user_id');
    $this->get('/courses/'.$course->slug)->assertOk();
});

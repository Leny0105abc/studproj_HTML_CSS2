<?php

use App\Models\Course;
use App\Models\EducationLevel;
use App\Models\User;
use Database\Seeders\BootstrapCourseSeeder;
use Inertia\Testing\AssertableInertia as Assert;

test('bootstrap recommendations are advisory and teacher editable without changing enrollment rules', function () {
    $this->seed(BootstrapCourseSeeder::class);
    $course = Course::where('slug', 'bootstrap')->firstOrFail();
    $student = User::factory()->create(['role' => 'student', 'education_level_id' => EducationLevel::where('slug', 'college')->value('id')]);
    $this->actingAs($student)->get('/courses/bootstrap')->assertInertia(fn (Assert $p) => $p->where('course.category', 'Web Development / Front-End')->where('course.recommended_prerequisites', $course->recommended_prerequisites)->etc());
    $teacher = User::factory()->create(['role' => 'teacher']);
    $this->actingAs($teacher)->put('/courses/bootstrap', ['name' => $course->name, 'description' => $course->description, 'is_published' => true, 'sequential_gating' => false, 'category' => 'Practice Front-End', 'recommended_prerequisites' => 'Teacher-selected HTML preparation'])->assertSessionHasNoErrors();
    expect($course->fresh()->recommended_prerequisites)->toBe('Teacher-selected HTML preparation');
    $second = $course->lessons()->skip(1)->firstOrFail();
    $this->actingAs($student)->get("/code-lab/{$second->id}")->assertOk();
    $this->put('/courses/bootstrap', ['name' => 'Unauthorized'])->assertForbidden();
    $first = $course->lessons()->firstOrFail();
    $this->actingAs($teacher)->put("/lessons/{$first->id}", array_replace($first->toArray(), ['accessibility_tip' => 'Test labels and keyboard focus.', 'responsive_tip' => 'Check narrow layouts.']))->assertSessionHasNoErrors();
    expect($first->fresh()->accessibility_tip)->toBe('Test labels and keyboard focus.');
});

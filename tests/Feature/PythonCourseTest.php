<?php

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\EducationLevel;
use App\Models\Lesson;
use App\Models\StudentLessonProgress;
use App\Models\Submission;
use App\Models\User;
use Database\Seeders\CurriculumSeeder;
use Database\Seeders\PythonCourseSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(CurriculumSeeder::class);
    $this->seed(PythonCourseSeeder::class);
});

function collegeStudent(): User
{
    return User::factory()->create(['role' => 'student', 'education_level_id' => EducationLevel::where('slug', 'college')->value('id')]);
}

test('lessons navigation opens an accessible course for each education level', function () {
    $school = User::factory()->create(['role' => 'student', 'education_level_id' => EducationLevel::where('slug', 'high-school')->value('id')]);
    $this->actingAs($school)->get('/lessons')->assertInertia(fn (Assert $page) => $page->has('lessons', 15)->where('modules', [])->etc());
    $teacher = User::factory()->create(['role' => 'teacher']);
    $this->actingAs($teacher)->get('/lessons')->assertInertia(fn (Assert $page) => $page->has('lessons', 15)->where('modules', [])->etc());
    $college = collegeStudent();
    $this->actingAs($college)->get('/lessons')->assertRedirect('/courses/python-programming');
    $this->get('/courses/python-programming')->assertInertia(fn (Assert $page) => $page->has('lessons', 30)->etc());
    Course::where('slug', 'python-programming')->update(['is_published' => false]);
    $this->get('/lessons')->assertRedirect('/courses');
});

test('students can preview locked lessons without starting progress or unlocking activities', function () {
    $student = collegeStudent();
    $course = Course::where('slug', 'python-programming')->firstOrFail();
    $lesson = $course->lessons()->skip(1)->firstOrFail();
    $this->actingAs($student)->get("/lessons/{$lesson->id}/preview")
        ->assertInertia(fn (Assert $page) => $page->component('lessons/preview')->where('unlocked', false)->where('lesson.title', $lesson->title)->missing('lesson.quiz')->etc());
    expect($student->lessonProgress()->count())->toBe(0);
    expect(CourseEnrollment::where('user_id', $student->id)->count())->toBe(0);
    $this->get("/code-lab/{$lesson->id}")->assertForbidden();
    $this->putJson("/code-lab/{$lesson->id}/save", ['html_code' => 'print(1)', 'version' => 1])->assertForbidden();
    $first = $course->lessons()->firstOrFail();
    $this->get("/lessons/{$first->id}/preview")->assertInertia(fn (Assert $page) => $page->where('unlocked', true)->etc());
    expect($student->lessonProgress()->count())->toBe(0);
    $school = User::factory()->create(['role' => 'student']);
    $this->actingAs($school)->get("/lessons/{$lesson->id}/preview")->assertForbidden();
    $lesson->update(['is_published' => false]);
    $this->actingAs($student)->get("/lessons/{$lesson->id}/preview")->assertForbidden();
});

test('python seeding preserves html lessons progress accounts and teacher edits', function () {
    $html = Lesson::where('number', 1)->firstOrFail();
    $student = User::factory()->create();
    $saved = StudentLessonProgress::create(['user_id' => $student->id, 'lesson_id' => $html->id, 'html_code' => '<p>Saved</p>', 'status' => 'completed']);
    $course = Course::where('slug', 'python-programming')->firstOrFail();
    $python = $course->lessons()->first();
    $python->update(['title' => 'Teacher edited introduction']);
    $this->seed(PythonCourseSeeder::class);
    expect(Lesson::count())->toBe(45);
    expect($html->fresh()->title)->toBe($html->title);
    expect($saved->fresh()->html_code)->toBe('<p>Saved</p>');
    expect($python->fresh()->title)->toBe('Teacher edited introduction');
    expect($course->lessons->pluck('position')->all())->toBe(range(1, 30));
    expect($course->lessons->groupBy('level')->map->count()->all())->toBe(['Basic' => 10, 'Moderate' => 10, 'Advanced' => 10]);
    expect($course->modules)->toHaveCount(3);
    foreach ($course->modules as $module) {
        expect($module->assessment)->toHaveCount(20);
    }
    foreach ($course->lessons as $lesson) {
        expect($lesson->quiz)->toHaveCount(5);
        foreach ($lesson->quiz as $question) {
            expect($question['choices'])->toHaveCount(4);
        }
        expect($lesson->objectives)->toHaveCount(3);
    }
});

test('college access assignment publication and independent course gating are enforced', function () {
    $school = User::factory()->create(['role' => 'student']);
    $college = collegeStudent();
    $course = Course::where('slug', 'python-programming')->firstOrFail();
    $first = $course->lessons()->first();
    $second = $course->lessons()->skip(1)->first();
    $this->actingAs($school)->get('/courses')->assertInertia(fn (Assert $page) => $page->has('courses', 1)->where('courses.0.slug', 'html-css')->etc());
    $this->get('/courses/python-programming')->assertForbidden();
    $this->get("/code-lab/{$first->id}")->assertForbidden();
    $this->actingAs($college)->get('/courses/python-programming')->assertInertia(fn (Assert $page) => $page->has('lessons', 30)->missing('modules.0.assessment.0.answer')->etc());
    $this->get("/code-lab/{$first->id}")->assertInertia(fn (Assert $page) => $page->component('code-lab/python')->missing('lesson.quiz.0.answer')->etc());
    $this->get("/code-lab/{$second->id}")->assertForbidden();
    CourseEnrollment::create(['user_id' => $school->id, 'course_id' => $course->id]);
    // An existing enrollment is retained but no longer bypasses level authorization.
    $this->actingAs($school)->get("/code-lab/{$first->id}")->assertForbidden();
    $this->assertDatabaseHas('course_enrollments', ['user_id' => $school->id, 'course_id' => $course->id]);
    $course->update(['sequential_gating' => false]);
    $this->actingAs($college)->get("/code-lab/{$second->id}")->assertOk();
    $course->update(['is_published' => false]);
    $this->get("/code-lab/{$first->id}")->assertForbidden();
    $this->putJson("/code-lab/{$first->id}/save", ['html_code' => 'print(1)', 'version' => 1])->assertForbidden();
});

test('python saves submissions quizzes and teacher approvals use existing progress', function () {
    $student = collegeStudent();
    $teacher = User::factory()->create(['role' => 'teacher']);
    $course = Course::where('slug', 'python-programming')->firstOrFail();
    $lesson = $course->lessons()->first();
    $this->actingAs($student)->get("/code-lab/{$lesson->id}")->assertOk();
    $this->putJson("/code-lab/{$lesson->id}/save", ['html_code' => 'print("Maria")', 'program_input' => "Maria\n18", 'version' => 1])->assertOk()->assertJsonPath('version', 2);
    $this->putJson("/code-lab/{$lesson->id}/save", ['html_code' => 'print(2)', 'version' => 1])->assertUnprocessable();
    $this->postJson("/code-lab/{$lesson->id}/submit", ['html_code' => 'print("Maria")', 'program_input' => "Maria\n18", 'version' => 2])->assertOk()->assertJsonPath('status', 'submitted');
    $this->postJson("/code-lab/{$lesson->id}/quiz", ['answers' => collect($lesson->quiz)->pluck('answer')->all()])->assertOk()->assertJsonPath('completed', false);
    $progress = $student->lessonProgress()->first();
    expect($progress->python_code)->toBe('print("Maria")');
    expect($progress->program_input)->toBe("Maria\n18");
    expect($progress->status)->toBe('submitted');
    $submission = Submission::where('lesson_id', $lesson->id)->first();
    expect($submission->python_code)->toBe('print("Maria")');
    $this->actingAs($teacher)->post("/submissions/{$submission->id}/review", ['status' => 'completed'])->assertRedirect();
    expect($progress->fresh()->status)->toBe('completed');
    $next = $course->lessons()->skip(1)->first();
    $this->actingAs($student)->get("/code-lab/{$next->id}")->assertOk();
    $this->putJson("/code-lab/{$lesson->id}/save", ['html_code' => 'print(2)', 'version' => 2])->assertForbidden();
    $this->get('/dashboard')->assertInertia(fn (Assert $page) => $page->where('summary.completed', 1)->where('summary.remaining', 29)->where('courses.0.modules.Basic.completed', 1)->etc());
});

test('teachers can manage python content and students cannot', function () {
    $teacher = User::factory()->create(['role' => 'teacher']);
    $student = collegeStudent();
    $course = Course::where('slug', 'python-programming')->firstOrFail();
    $lesson = $course->lessons()->first();
    $this->actingAs($student)->put("/courses/{$course->slug}", [])->assertForbidden();
    $this->actingAs($teacher)->get("/lessons/{$lesson->id}/edit")->assertOk();
    $data = $lesson->only('title', 'level', 'position', 'is_published', 'is_project', 'objectives', 'introduction', 'explanation', 'guided_practice', 'activity', 'expected_result', 'quiz');
    $data['title'] = 'Updated Python';
    $data['starter_python'] = 'print("Start")';
    $this->put("/lessons/{$lesson->id}", $data)->assertRedirect();
    expect($lesson->fresh()->title)->toBe('Updated Python');
    expect($lesson->fresh()->starter_python)->toBe('print("Start")');
    $this->put("/courses/{$course->slug}", ['name' => $course->name, 'description' => $course->description, 'is_published' => true, 'sequential_gating' => false])->assertRedirect();
    expect($course->fresh()->sequential_gating)->toBeFalse();
});

test('module assessment is gated and scores are stored without revealing answer keys', function () {
    $student = collegeStudent();
    $course = Course::where('slug', 'python-programming')->firstOrFail();
    $module = $course->modules()->first();
    $answers = collect($module->assessment)->pluck('answer')->all();
    $this->actingAs($student)->post("/courses/{$course->slug}/modules/{$module->id}/assessment", ['answers' => $answers])->assertForbidden();
    foreach ($course->lessons()->where('course_module_id', $module->id)->get() as $lesson) {
        StudentLessonProgress::create(['user_id' => $student->id, 'lesson_id' => $lesson->id, 'status' => 'completed']);
    }
    $this->post("/courses/{$course->slug}/modules/{$module->id}/assessment", ['answers' => $answers])->assertRedirect();
    expect(CourseEnrollment::where('user_id', $student->id)->first()->assessment_results[$module->id]['score'])->toBe(20);
});

test('python teacher approval rejects stale source and requires a passed quiz', function () {
    $student = collegeStudent();
    $teacher = User::factory()->create(['role' => 'teacher']);
    $lesson = Course::where('slug', 'python-programming')->firstOrFail()->lessons()->first();
    $this->actingAs($student)->get("/code-lab/{$lesson->id}");
    $this->postJson("/code-lab/{$lesson->id}/submit", ['html_code' => 'print("Maria")', 'version' => 1])->assertOk();
    $submission = Submission::where('lesson_id', $lesson->id)->first();
    $this->actingAs($teacher)->postJson("/submissions/{$submission->id}/review", ['status' => 'completed'])->assertUnprocessable();
    $this->actingAs($student)->postJson("/code-lab/{$lesson->id}/quiz", ['answers' => collect($lesson->quiz)->pluck('answer')->all()])->assertOk();
    $this->putJson("/code-lab/{$lesson->id}/save", ['html_code' => 'print("Edited")', 'version' => 1])->assertOk();
    $this->actingAs($teacher)->postJson("/submissions/{$submission->id}/review", ['status' => 'completed'])->assertUnprocessable();
    expect($student->lessonProgress()->first()->status)->toBe('in_progress');
});

test('archived lessons can be managed and module reordering remains consistent', function () {
    $teacher = User::factory()->create(['role' => 'teacher']);
    $course = Course::where('slug', 'python-programming')->firstOrFail();
    $lesson = $course->lessons()->first();
    $lesson->update(['is_published' => false]);
    $this->actingAs($teacher)->get('/courses/python-programming')->assertInertia(fn (Assert $page) => $page->has('lessons', 30)->where('lessons.0.published', false)->has('modules.0.assessment.0.answer')->etc());
    $advanced = $course->modules()->where('name', 'Advanced')->first();
    $this->put("/courses/{$course->slug}/modules/{$advanced->id}", ['name' => 'Advanced', 'position' => 1])->assertRedirect();
    expect($course->modules()->pluck('name')->all())->toBe(['Advanced', 'Basic', 'Moderate']);
    expect($course->modules()->pluck('position')->all())->toBe([1, 2, 3]);
});

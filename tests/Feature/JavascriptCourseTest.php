<?php

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\EducationLevel;
use App\Models\Lesson;
use App\Models\StudentLessonProgress;
use App\Models\Submission;
use App\Models\User;
use Database\Seeders\CppCourseSeeder;
use Database\Seeders\CurriculumSeeder;
use Database\Seeders\JavaCourseSeeder;
use Database\Seeders\JavascriptCourseSeeder;
use Database\Seeders\PhpCourseSeeder;
use Database\Seeders\PythonCourseSeeder;
use Database\Seeders\ScratchCourseSeeder;
use Database\Seeders\SqlCourseSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    foreach ([CurriculumSeeder::class, PythonCourseSeeder::class, ScratchCourseSeeder::class, PhpCourseSeeder::class, CppCourseSeeder::class, JavaCourseSeeder::class, SqlCourseSeeder::class] as $seeder) {
        $this->seed($seeder);
    }
});

function javascriptStudent(): User
{
    return User::factory()->create(['role' => 'student', 'education_level_id' => EducationLevel::where('slug', 'college')->value('id')]);
}

test('javascript has eighteen complete lessons and preserves existing courses including a high-school javascript course', function () {
    $basic = Course::create(['slug' => 'basic-javascript', 'name' => 'Basic JavaScript', 'description' => 'Existing high-school course', 'difficulty' => 'Basic', 'language' => 'JavaScript', 'execution_provider' => 'browser-javascript-sandbox', 'education_level_id' => EducationLevel::where('slug', 'high-school')->value('id'), 'editor_type' => 'javascript', 'is_published' => true]);
    $oldLessons = Lesson::orderBy('id')->get()->toArray();
    $oldCourses = Course::orderBy('id')->get()->toArray();
    $student = javascriptStudent();
    $progress = StudentLessonProgress::create(['user_id' => $student->id, 'lesson_id' => Lesson::first()->id, 'html_code' => '<p>Preserve me</p>', 'status' => 'completed']);
    $this->seed(JavascriptCourseSeeder::class);
    $course = Course::where('slug', 'javascript-programming')->firstOrFail();
    $first = $course->lessons()->firstOrFail();
    $first->update(['starter_javascript' => '// Teacher edit']);
    $this->seed(JavascriptCourseSeeder::class);
    expect(Lesson::where('course_id', '!=', $course->id)->orderBy('id')->get()->toArray())->toBe($oldLessons);
    expect(Course::where('id', '!=', $course->id)->orderBy('id')->get()->toArray())->toBe($oldCourses);
    expect($progress->fresh()->html_code)->toBe('<p>Preserve me</p>');
    expect($basic->fresh()->name)->toBe('Basic JavaScript');
    expect($first->fresh()->starter_javascript)->toBe('// Teacher edit');
    expect($course->editor_type)->toBe('javascript');
    expect($course->execution_provider)->toBe('browser-javascript-sandbox');
    expect($course->educationLevel->slug)->toBe('college');
    expect($course->modules->pluck('name')->all())->toBe(['Beginner', 'Intermediate', 'Advanced']);
    expect($course->lessons->pluck('position')->all())->toBe(range(1, 18));
    expect($course->lessons->groupBy('level')->map->count()->all())->toBe(['Beginner' => 6, 'Intermediate' => 6, 'Advanced' => 6]);
    expect($course->lessons->where('is_project', true))->toHaveCount(3);
    foreach ($course->modules as $module) {
        expect($module->assessment)->toHaveCount(12);
    }
    foreach ($course->lessons as $lesson) {
        expect($lesson->example_javascript)->not->toBeEmpty();
        expect($lesson->explanation)->not->toBeEmpty();
        expect($lesson->security_note)->not->toBeEmpty();
        expect($lesson->requiresTeacherReview())->toBeTrue();
        expect($lesson->quiz)->toHaveCount(5);
        foreach ($lesson->quiz as $question) {
            expect(array_unique($question['choices']))->toHaveCount(4);
        }
        if ($lesson->is_project) {
            expect(array_sum($lesson->rubric))->toBe(100);
        }
    }
});

test('javascript access gating previews and catalogue counts use the shared college rules', function () {
    $this->seed(JavascriptCourseSeeder::class);
    $student = javascriptStudent();
    $school = User::factory()->create(['role' => 'student', 'education_level_id' => EducationLevel::where('slug', 'high-school')->value('id')]);
    $course = Course::where('slug', 'javascript-programming')->firstOrFail();
    $first = $course->lessons()->firstOrFail();
    $second = $course->lessons()->skip(1)->firstOrFail();
    $this->actingAs($student)->get('/courses')->assertInertia(fn (Assert $p) => $p->has('courses', 6)->etc());
    $this->get('/dashboard')->assertInertia(fn (Assert $p) => $p->has('courses', 6)->where('summary.remaining', 168)->etc());
    $this->get('/courses/javascript-programming')->assertInertia(fn (Assert $p) => $p->has('lessons', 18)->where('levelProgress.Beginner.total', 6)->missing('modules.0.assessment.0.answer')->etc());
    $this->get("/code-lab/{$first->id}")->assertInertia(fn (Assert $p) => $p->component('code-lab/javascript')->where('workspace.js_code', $first->starter_javascript)->where('lesson.module_total', 6)->missing('lesson.quiz.0.answer')->etc());
    $this->get("/code-lab/{$second->id}")->assertForbidden();
    $this->get("/lessons/{$second->id}/preview")->assertInertia(fn (Assert $p) => $p->where('unlocked', false)->has('lesson.example_javascript')->etc());
    $this->actingAs($school)->get('/courses/javascript-programming')->assertForbidden();
    CourseEnrollment::create(['user_id' => $school->id, 'course_id' => $course->id]);
    // Enrollment is retained; education compatibility remains mandatory.
    $this->get("/code-lab/{$first->id}")->assertForbidden();
    $this->assertDatabaseHas('course_enrollments', ['user_id' => $school->id, 'course_id' => $course->id]);
    $this->actingAs($student);
    $course->update(['sequential_gating' => false]);
    $this->get("/code-lab/{$second->id}")->assertOk();
    $course->update(['is_published' => false]);
    $this->get("/code-lab/{$first->id}")->assertForbidden();
});

test('javascript saves all files and inputs and requires current quiz and teacher rubric approval', function () {
    $this->seed(JavascriptCourseSeeder::class);
    $student = javascriptStudent();
    $teacher = User::factory()->create(['role' => 'teacher']);
    $course = Course::where('slug', 'javascript-programming')->firstOrFail();
    $lesson = $course->lessons()->where('is_project', true)->firstOrFail();
    StudentLessonProgress::create(['user_id' => $student->id, 'lesson_id' => $lesson->id, 'status' => 'not_started', 'is_manually_unlocked' => true]);
    $this->actingAs($student)->get("/code-lab/{$lesson->id}")->assertOk();
    $payload = ['version' => 1, 'html_code' => "  {$lesson->example_html}\n", 'css_code' => "  body { color: blue; }\n", 'js_code' => "  {$lesson->example_javascript}\n", 'program_input' => "  {\"prompts\":[]}\n"];
    $this->putJson("/code-lab/{$lesson->id}/save", $payload)->assertOk()->assertJsonPath('version', 2);
    $progress = StudentLessonProgress::where('user_id', $student->id)->where('lesson_id', $lesson->id)->firstOrFail();
    expect($progress->js_code)->toBe($payload['js_code']);
    expect($progress->html_code)->toBe($payload['html_code']);
    expect($progress->css_code)->toBe($payload['css_code']);
    expect($progress->program_input)->toBe($payload['program_input']);
    $this->putJson("/code-lab/{$lesson->id}/save", $payload)->assertUnprocessable();
    $this->postJson("/code-lab/{$lesson->id}/submit", array_replace($payload, ['version' => 2]))->assertOk()->assertJsonPath('status', 'submitted');
    $submission = Submission::where('lesson_id', $lesson->id)->firstOrFail();
    expect($submission->js_code)->toBe($payload['js_code']);
    $this->actingAs($teacher)->get("/submissions/{$submission->id}")->assertInertia(fn (Assert $p) => $p->where('submission.lesson.course.editor_type', 'javascript')->etc());
    $this->post("/submissions/{$submission->id}/review", ['status' => 'completed', 'rubric_scores' => $lesson->rubric])->assertSessionHasErrors('status');
    $this->actingAs($student)->postJson("/code-lab/{$lesson->id}/quiz", ['answers' => array_column($lesson->quiz, 'answer')])->assertOk()->assertJsonPath('completed', false);
    $this->actingAs($teacher)->post("/submissions/{$submission->id}/review", ['status' => 'completed'])->assertSessionHasErrors('rubric_scores');
    $this->actingAs($student)->putJson("/code-lab/{$lesson->id}/save", array_replace($payload, ['version' => 2, 'css_code' => 'body { color: green; }']))->assertOk();
    $this->actingAs($teacher)->post("/submissions/{$submission->id}/review", ['status' => 'completed', 'rubric_scores' => $lesson->rubric])->assertSessionHasErrors('status');
    $this->actingAs($student)->postJson("/code-lab/{$lesson->id}/submit", array_replace($payload, ['version' => 3]))->assertOk();
    $latest = Submission::where('lesson_id', $lesson->id)->latest('version')->firstOrFail();
    $this->actingAs($teacher)->post("/submissions/{$latest->id}/review", ['status' => 'completed', 'rubric_scores' => $lesson->rubric])->assertSessionHasNoErrors();
    expect($progress->fresh()->status)->toBe('completed');
    $this->actingAs($student)->putJson("/code-lab/{$lesson->id}/save", array_replace($payload, ['version' => 4]))->assertForbidden();
    $next = $course->lessons()->where('position', $lesson->position + 1)->firstOrFail();
    $this->get("/code-lab/{$next->id}")->assertOk();
});

test('javascript admin content drafts and assessments retain the existing management workflow', function () {
    $this->seed(JavascriptCourseSeeder::class);
    $teacher = User::factory()->create(['role' => 'teacher']);
    $student = javascriptStudent();
    $course = Course::where('slug', 'javascript-programming')->firstOrFail();
    $lesson = $course->lessons()->firstOrFail();
    $module = $course->modules()->firstOrFail();
    $this->actingAs($teacher)->put("/lessons/{$lesson->id}", array_replace($lesson->toArray(), ['starter_javascript' => 'console.log("Edited");']))->assertSessionHasNoErrors();
    expect($lesson->fresh()->starter_javascript)->toBe('console.log("Edited");');
    $this->post('/lessons', ['title' => 'JavaScript draft', 'level' => 'Advanced', 'activity' => 'Write a module.', 'objectives' => ['Use a module'], 'course_id' => $course->id])->assertSessionHasNoErrors();
    expect(Lesson::where('title', 'JavaScript draft')->firstOrFail()->is_published)->toBeFalse();
    $this->actingAs($student)->put("/lessons/{$lesson->id}", $lesson->toArray())->assertForbidden();
    foreach ($course->lessons()->where('course_module_id', $module->id)->where('is_published', true)->get() as $item) {
        StudentLessonProgress::create(['user_id' => $student->id, 'lesson_id' => $item->id, 'status' => 'completed']);
    }
    $this->postJson("/courses/javascript-programming/modules/{$module->id}/assessment", ['answers' => array_column($module->assessment, 'answer')])->assertSessionHasNoErrors();
    expect(CourseEnrollment::where('user_id', $student->id)->where('course_id', $course->id)->firstOrFail()->assessment_results[$module->id]['passed'])->toBeTrue();
});

test('javascript submissions are stored as source without executing on the Laravel server', function () {
    $this->seed(JavascriptCourseSeeder::class);
    $student = javascriptStudent();
    $lesson = Course::where('slug', 'javascript-programming')->firstOrFail()->lessons()->firstOrFail();
    $count = User::count();
    $this->actingAs($student)->get("/code-lab/{$lesson->id}")->assertOk();
    $this->postJson("/code-lab/{$lesson->id}/submit", ['version' => 1, 'html_code' => '<main>Test</main>', 'js_code' => 'while(true) {}'])->assertOk()->assertJsonPath('status', 'submitted');
    expect(User::count())->toBe($count);
    expect(Submission::where('user_id', $student->id)->firstOrFail()->js_code)->toBe('while(true) {}');
    $this->get('/javascript-runtime-assets/.env')->assertNotFound();
    $this->post('/javascript-runtime-assets/worker.js')->assertStatus(405);
});

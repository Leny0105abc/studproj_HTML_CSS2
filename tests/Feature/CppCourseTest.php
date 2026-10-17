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
use Database\Seeders\PhpCourseSeeder;
use Database\Seeders\PythonCourseSeeder;
use Database\Seeders\ScratchCourseSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(CurriculumSeeder::class);
    $this->seed(PythonCourseSeeder::class);
    $this->seed(ScratchCourseSeeder::class);
    $this->seed(PhpCourseSeeder::class);
});

function cppStudent(): User
{
    return User::factory()->create(['role' => 'student', 'education_level_id' => EducationLevel::where('slug', 'college')->value('id')]);
}

test('cpp curriculum is complete idempotent and preserves all earlier courses and work', function () {
    $before = Lesson::orderBy('id')->get()->toArray();
    $student = cppStudent();
    $progress = StudentLessonProgress::create(['user_id' => $student->id, 'lesson_id' => Lesson::first()->id, 'html_code' => '<p>Preserve</p>', 'status' => 'completed']);
    $this->seed(CppCourseSeeder::class);
    $course = Course::where('slug', 'cpp-programming')->firstOrFail();
    $first = $course->lessons()->firstOrFail();
    $first->update(['starter_cpp' => 'int main() { return 0; } // Teacher edit']);
    $this->seed(CppCourseSeeder::class);
    expect(Lesson::where('course_id', '!=', $course->id)->orderBy('id')->get()->toArray())->toBe($before);
    expect($progress->fresh()->html_code)->toBe('<p>Preserve</p>');
    expect($student->fresh()->username)->toBe($student->username);
    expect($first->fresh()->starter_cpp)->toBe('int main() { return 0; } // Teacher edit');
    expect($course->editor_type)->toBe('cpp');
    expect($course->execution_provider)->toBe('browser-wasm');
    expect($course->is_published)->toBeTrue();
    expect($course->modules->pluck('name')->all())->toBe(['Beginner', 'Intermediate', 'Advanced']);
    expect($course->lessons->pluck('position')->all())->toBe(range(1, 30));
    expect($course->lessons->groupBy('level')->map->count()->all())->toBe(['Beginner' => 10, 'Intermediate' => 10, 'Advanced' => 10]);
    expect($course->lessons->where('is_project', true))->toHaveCount(3);
    foreach ($course->modules as $module) {
        expect($module->assessment)->toHaveCount(20);
    }
    foreach ($course->lessons as $lesson) {
        expect($lesson->objectives)->toHaveCount(3);
        expect($lesson->example_cpp)->toStartWith('#include');
        expect($lesson->security_note)->not->toBeEmpty();
        expect($lesson->quiz)->toHaveCount(5);
        expect($lesson->requiresTeacherReview())->toBeTrue();
        foreach ($lesson->quiz as $question) {
            expect($question['choices'])->toHaveCount(4);
            expect(array_unique($question['choices']))->toHaveCount(4);
            expect($question['choices'][$question['answer']])->toBeString();
        }
        if ($lesson->is_project) {
            expect(array_sum($lesson->rubric))->toBe(100);
        }
    }
});

test('cpp access preview gating dashboard and publication are enforced on the server', function () {
    $this->seed(CppCourseSeeder::class);
    $college = cppStudent();
    $school = User::factory()->create(['role' => 'student', 'education_level_id' => EducationLevel::where('slug', 'high-school')->value('id')]);
    $course = Course::where('slug', 'cpp-programming')->firstOrFail();
    $first = $course->lessons()->firstOrFail();
    $second = $course->lessons()->skip(1)->firstOrFail();
    $this->actingAs($college)->get('/courses')->assertInertia(fn (Assert $p) => $p->has('courses', 3)->etc());
    $this->get('/courses/cpp-programming')->assertInertia(fn (Assert $p) => $p->has('lessons', 30)->where('levelProgress.Beginner.total', 10)->where('levels', ['Beginner', 'Intermediate', 'Advanced'])->missing('modules.0.assessment.0.answer')->etc());
    $this->get('/dashboard')->assertInertia(fn (Assert $p) => $p->has('courses', 3)->where('summary.remaining', 90)->etc());
    $this->get("/code-lab/{$first->id}")->assertInertia(fn (Assert $p) => $p->component('code-lab/cpp')->missing('lesson.quiz.0.answer')->where('workspace.cpp_code', $first->starter_cpp)->etc());
    $this->assertDatabaseHas('course_enrollments', ['user_id' => $college->id, 'course_id' => $course->id]);
    $this->get("/code-lab/{$second->id}")->assertForbidden();
    $this->get("/lessons/{$second->id}/preview")->assertInertia(fn (Assert $p) => $p->where('unlocked', false)->has('lesson.example_cpp')->etc());
    $this->actingAs($school)->get('/courses/cpp-programming')->assertForbidden();
    $this->postJson("/code-lab/{$first->id}/submit", ['version' => 1, 'html_code' => 'int main() { return 0; }'])->assertForbidden();
    CourseEnrollment::create(['course_id' => $course->id, 'user_id' => $school->id]);
    // Enrollment is retained; education compatibility remains mandatory.
    $this->get("/code-lab/{$first->id}")->assertForbidden();
    $this->assertDatabaseHas('course_enrollments', ['user_id' => $school->id, 'course_id' => $course->id]);
    $this->actingAs($college);
    $course->update(['sequential_gating' => false]);
    $this->get("/code-lab/{$second->id}")->assertOk();
    $course->update(['is_published' => false]);
    $this->get("/code-lab/{$first->id}")->assertForbidden();
});

test('cpp saves submissions quizzes stale reviews and project grading use the existing workflow', function () {
    $this->seed(CppCourseSeeder::class);
    $student = cppStudent();
    $teacher = User::factory()->create(['role' => 'teacher']);
    $course = Course::where('slug', 'cpp-programming')->firstOrFail();
    $lesson = $course->lessons()->where('is_project', true)->firstOrFail();
    StudentLessonProgress::create(['user_id' => $student->id, 'lesson_id' => $lesson->id, 'status' => 'not_started', 'is_manually_unlocked' => true]);
    $this->actingAs($student)->get("/code-lab/{$lesson->id}")->assertOk();
    $payload = ['version' => 1, 'html_code' => $lesson->example_cpp, 'program_input' => "Maria Santos\n80 85 90 95 100\n"];
    $this->putJson("/code-lab/{$lesson->id}/save", $payload)->assertOk()->assertJsonPath('version', 2);
    $this->putJson("/code-lab/{$lesson->id}/save", $payload)->assertUnprocessable();
    $this->postJson("/code-lab/{$lesson->id}/submit", array_replace($payload, ['version' => 2]))->assertOk()->assertJsonPath('status', 'submitted');
    $submission = Submission::where('lesson_id', $lesson->id)->firstOrFail();
    expect($submission->cpp_code)->toBe(trim($lesson->example_cpp));
    $this->actingAs($teacher)->post("/submissions/{$submission->id}/review", ['status' => 'completed', 'rubric_scores' => $lesson->rubric])->assertSessionHasErrors('status');
    $this->actingAs($student)->postJson("/code-lab/{$lesson->id}/quiz", ['answers' => collect($lesson->quiz)->pluck('answer')->all()])->assertOk()->assertJsonPath('completed', false);
    $this->actingAs($teacher)->post("/submissions/{$submission->id}/review", ['status' => 'completed'])->assertSessionHasErrors('rubric_scores');
    $tooHigh = $lesson->rubric;
    $tooHigh['functionality'] = 31;
    $this->post("/submissions/{$submission->id}/review", ['status' => 'completed', 'rubric_scores' => $tooHigh])->assertSessionHasErrors('rubric_scores');
    // Changing only standard input invalidates the snapshot too.
    $this->actingAs($student)->putJson("/code-lab/{$lesson->id}/save", array_replace($payload, ['version' => 2, 'program_input' => "Jose\n75 75 75 75 75\n"]))->assertOk();
    $this->actingAs($teacher)->post("/submissions/{$submission->id}/review", ['status' => 'completed', 'rubric_scores' => $lesson->rubric])->assertSessionHasErrors('status');
    $this->actingAs($student)->postJson("/code-lab/{$lesson->id}/submit", array_replace($payload, ['version' => 3]))->assertOk();
    $latest = Submission::where('lesson_id', $lesson->id)->latest('version')->firstOrFail();
    $this->actingAs($teacher)->post("/submissions/{$latest->id}/review", ['status' => 'completed', 'rubric_scores' => $lesson->rubric])->assertRedirect()->assertSessionHasNoErrors();
    expect((float) array_sum($latest->fresh()->rubric_scores))->toBe(100.0);
    expect($student->lessonProgress()->first()->status)->toBe('completed');
    $next = $course->lessons()->where('position', 11)->firstOrFail();
    $this->actingAs($student)->get("/code-lab/{$next->id}")->assertOk();
    $this->putJson("/code-lab/{$lesson->id}/save", array_replace($payload, ['version' => 3]))->assertForbidden();
    $this->assertDatabaseHas('activity_logs', ['user_id' => $student->id, 'event' => 'project_submitted']);
    $this->assertDatabaseHas('activity_logs', ['user_id' => $student->id, 'event' => 'project_graded']);
});

test('cpp admin can edit content create drafts manage assessments and students cannot', function () {
    $this->seed(CppCourseSeeder::class);
    $teacher = User::factory()->create(['role' => 'teacher']);
    $student = cppStudent();
    $course = Course::where('slug', 'cpp-programming')->firstOrFail();
    $lesson = $course->lessons()->firstOrFail();
    $module = $course->modules()->firstOrFail();
    $this->actingAs($teacher)->get("/lessons/{$lesson->id}/edit")->assertInertia(fn (Assert $p) => $p->has('lesson.starter_cpp')->where('levels', ['Beginner', 'Intermediate', 'Advanced'])->etc());
    $this->put("/lessons/{$lesson->id}", array_replace($lesson->toArray(), ['starter_cpp' => 'int main() { return 0; } // Edited', 'security_note' => 'Validate input and bounds.', 'debugging_tip' => 'Read the first compiler diagnostic.']))->assertSessionHasNoErrors();
    expect($lesson->fresh()->starter_cpp)->toBe('int main() { return 0; } // Edited');
    $this->put("/courses/cpp-programming/modules/{$module->id}", ['name' => 'Beginner', 'position' => 1, 'assessment' => $module->assessment])->assertSessionHasNoErrors();
    $this->post('/lessons', ['title' => 'C++ draft', 'level' => 'Beginner', 'activity' => 'Write C++.', 'objectives' => ['Create a program', 'Test its output'], 'course_id' => $course->id])->assertSessionHasNoErrors();
    $draft = Lesson::where('title', 'C++ draft')->firstOrFail();
    expect($draft->is_published)->toBeFalse();
    expect($draft->starter_cpp)->toStartWith('#include');
    $this->actingAs($student)->put("/lessons/{$lesson->id}", $lesson->toArray())->assertForbidden();
    $this->get("/code-lab/{$draft->id}")->assertForbidden();
    foreach ($course->lessons()->where('course_module_id', $module->id)->where('is_published', true)->get() as $item) {
        StudentLessonProgress::create(['user_id' => $student->id, 'lesson_id' => $item->id, 'status' => 'completed']);
    }
    $this->postJson("/courses/cpp-programming/modules/{$module->id}/assessment", ['answers' => collect($module->assessment)->pluck('answer')->all()])->assertRedirect()->assertSessionHasNoErrors();
    expect(CourseEnrollment::where('user_id', $student->id)->where('course_id', $course->id)->firstOrFail()->assessment_results[$module->id]['passed'])->toBeTrue();
});

test('cpp runtime endpoints expose only fixed public assets and never execute submitted code on the server', function () {
    $this->get('/cpp-runtime-assets/.env')->assertNotFound();
    $this->get('/cpp-runtime-assets/main.cpp')->assertNotFound();
    $this->post('/cpp-runtime-assets/worker.js', ['code' => 'int main() { return 1; }'])->assertStatus(405);
    $this->seed(CppCourseSeeder::class);
    $student = cppStudent();
    $lesson = Course::where('slug', 'cpp-programming')->firstOrFail()->lessons()->firstOrFail();
    $this->actingAs($student)->get("/code-lab/{$lesson->id}")->assertOk();
    $code = '#include <stdexcept>'."\n".'int main() { throw std::runtime_error("Server must never execute this"); }';
    $this->postJson("/code-lab/{$lesson->id}/check", ['html_code' => $code])->assertOk();
    $this->postJson("/code-lab/{$lesson->id}/submit", ['html_code' => $code, 'version' => 1])->assertOk()->assertJsonPath('status', 'submitted');
});

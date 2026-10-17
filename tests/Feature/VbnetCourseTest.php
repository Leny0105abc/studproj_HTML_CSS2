<?php

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\EducationLevel;
use App\Models\Lesson;
use App\Models\StudentLessonProgress;
use App\Models\Submission;
use App\Models\User;
use Database\Seeders\VbnetCourseSeeder;
use Inertia\Testing\AssertableInertia as Assert;

function vbnetStudent(): User
{
    return User::factory()->create(['role' => 'student', 'education_level_id' => EducationLevel::where('slug', 'college')->value('id')]);
}

test('vbnet preserves all existing curriculum and progress and supplies three complete six lesson modules', function () {
    foreach (['Curriculum', 'PythonCourse', 'ScratchCourse', 'PhpCourse', 'CppCourse', 'JavaCourse', 'SqlCourse', 'JavascriptCourse'] as $name) {
        $this->seed('Database\\Seeders\\'.$name.'Seeder');
    }
    $oldCourses = Course::orderBy('id')->get()->toArray();
    $oldLessons = Lesson::orderBy('id')->get()->toArray();
    expect($oldLessons)->toHaveCount(213);
    $student = vbnetStudent();
    $progress = StudentLessonProgress::create(['user_id' => $student->id, 'lesson_id' => Lesson::first()->id, 'html_code' => '<p>Preserve existing work</p>', 'status' => 'completed']);
    $this->seed(VbnetCourseSeeder::class);
    $course = Course::where('slug', 'visual-basic-dotnet')->firstOrFail();
    $first = $course->lessons()->firstOrFail();
    $first->update(['starter_vbnet' => "' Teacher edit"]);
    $this->seed(VbnetCourseSeeder::class);
    expect(Course::where('id', '!=', $course->id)->orderBy('id')->get()->toArray())->toBe($oldCourses);
    expect(Lesson::where('course_id', '!=', $course->id)->orderBy('id')->get()->toArray())->toBe($oldLessons);
    expect($progress->fresh()->html_code)->toBe('<p>Preserve existing work</p>');
    expect($first->fresh()->starter_vbnet)->toBe("' Teacher edit");
    expect($course->educationLevel->slug)->toBe('college');
    expect($course->editor_type)->toBe('vbnet');
    expect($course->modules->pluck('name')->all())->toBe(['Beginner', 'Intermediate', 'Advanced']);
    expect($course->lessons->pluck('position')->all())->toBe(range(1, 18));
    expect($course->lessons->groupBy('level')->map->count()->all())->toBe(['Beginner' => 6, 'Intermediate' => 6, 'Advanced' => 6]);
    expect($course->lessons->where('vbnet_mode', 'console'))->toHaveCount(13);
    expect($course->lessons->where('vbnet_mode', 'winforms'))->toHaveCount(5);
    expect($course->lessons->where('is_project', true))->toHaveCount(3);
    foreach ($course->modules as $module) {
        expect($module->assessment)->toHaveCount(18);
    }
    foreach ($course->lessons as $lesson) {
        expect(count($lesson->objectives))->toBeGreaterThanOrEqual(2)->toBeLessThanOrEqual(4);
        foreach (['introduction', 'explanation', 'example_vbnet', 'guided_practice', 'activity', 'expected_result', 'security_note', 'debugging_tip', 'completion_requirements'] as $field) {
            expect($lesson->$field)->not->toBeEmpty();
        }
        expect($lesson->quiz)->toHaveCount(5);
        expect($lesson->requiresTeacherReview())->toBeTrue();
        if ($lesson->vbnet_mode === 'winforms') {
            expect($lesson->vbnet_form_guide)->not->toBeEmpty();
        }
        if ($lesson->is_project) {
            expect(array_sum($lesson->rubric))->toBe(100);
        }
    }
    $this->actingAs($student)->get('/dashboard')->assertInertia(fn (Assert $p) => $p->has('courses', 7)->etc());
});

test('vbnet locked previews expose study material without granting access or quiz answers', function () {
    $this->seed(VbnetCourseSeeder::class);
    $course = Course::where('slug', 'visual-basic-dotnet')->firstOrFail();
    $student = vbnetStudent();
    $first = $course->lessons()->firstOrFail();
    $desktop = $course->lessons()->where('vbnet_mode', 'winforms')->firstOrFail();
    $this->actingAs($student)->get('/courses/visual-basic-dotnet')->assertInertia(fn (Assert $p) => $p->has('lessons', 18)->where('levelProgress.Beginner.total', 6)->missing('modules.0.assessment.0.answer')->etc());
    $this->get("/lessons/{$desktop->id}/preview")->assertInertia(fn (Assert $p) => $p->where('unlocked', false)->has('lesson.vbnet_form_guide')->has('lesson.example_vbnet')->etc());
    expect(StudentLessonProgress::count())->toBe(0);
    $this->get("/code-lab/{$desktop->id}")->assertForbidden();
    $this->get("/code-lab/{$first->id}")->assertInertia(fn (Assert $p) => $p->component('code-lab/vbnet')->where('vbnetExecutionAvailable', false)->where('workspace.vbnet_code', $first->starter_vbnet)->missing('lesson.quiz.0.answer')->etc());
    $school = User::factory()->create(['role' => 'student', 'education_level_id' => EducationLevel::firstOrCreate(['slug' => 'high-school'], ['name' => 'High School'])->id]);
    $this->actingAs($school)->get('/courses/visual-basic-dotnet')->assertForbidden();
    CourseEnrollment::create(['user_id' => $school->id, 'course_id' => $course->id]);
    // Enrollment is retained; education compatibility remains mandatory.
    $this->get("/code-lab/{$first->id}")->assertForbidden();
    $this->assertDatabaseHas('course_enrollments', ['user_id' => $school->id, 'course_id' => $course->id]);
    $this->actingAs($student);
    $course->update(['is_published' => false]);
    $this->get("/code-lab/{$first->id}")->assertForbidden();
});

test('vbnet source input and evidence remain immutable in submissions and current teacher grading unlocks the next lesson', function () {
    $this->seed(VbnetCourseSeeder::class);
    $course = Course::where('slug', 'visual-basic-dotnet')->firstOrFail();
    $lesson = $course->lessons()->where('is_project', true)->firstOrFail();
    $student = vbnetStudent();
    $teacher = User::factory()->create(['role' => 'teacher']);
    $progress = StudentLessonProgress::create(['user_id' => $student->id, 'lesson_id' => $lesson->id, 'status' => 'not_started', 'is_manually_unlocked' => true]);
    $this->actingAs($student)->get("/code-lab/{$lesson->id}")->assertOk();
    $payload = ['version' => 1, 'html_code' => "  {$lesson->example_vbnet}\n", 'program_input' => "  Maria\n3\n95\n88\n91\n", 'vbnet_project_url' => 'https://example.org/student/project', 'vbnet_notes' => "  Screenshot link: https://example.org/evidence\nTested boundary inputs.\n"];
    $this->putJson("/code-lab/{$lesson->id}/save", $payload)->assertOk()->assertJsonPath('version', 2);
    expect($progress->fresh()->vbnet_code)->toBe($payload['html_code']);
    expect($progress->fresh()->program_input)->toBe($payload['program_input']);
    expect($progress->fresh()->vbnet_notes)->toBe($payload['vbnet_notes']);
    $this->putJson("/code-lab/{$lesson->id}/save", $payload)->assertUnprocessable();
    $this->postJson("/code-lab/{$lesson->id}/submit", array_replace($payload, ['version' => 2]))->assertOk()->assertJsonPath('status', 'submitted');
    $submission = Submission::where('lesson_id', $lesson->id)->firstOrFail();
    expect($submission->vbnet_code)->toBe($payload['html_code']);
    expect($submission->vbnet_project_url)->toBe($payload['vbnet_project_url']);
    $this->actingAs($teacher)->get("/submissions/{$submission->id}")->assertInertia(fn (Assert $p) => $p->where('submission.vbnet_notes', $payload['vbnet_notes'])->where('submission.lesson.course.editor_type', 'vbnet')->etc());
    $this->post("/submissions/{$submission->id}/review", ['status' => 'completed', 'rubric_scores' => $lesson->rubric])->assertSessionHasErrors('status');
    $this->actingAs($student)->postJson("/code-lab/{$lesson->id}/quiz", ['answers' => array_column($lesson->quiz, 'answer')])->assertOk()->assertJsonPath('completed', false);
    $this->actingAs($teacher)->post("/submissions/{$submission->id}/review", ['status' => 'completed'])->assertSessionHasErrors('rubric_scores');
    $changed = array_replace($payload, ['version' => 2, 'vbnet_notes' => 'Updated evidence only']);
    $this->actingAs($student)->putJson("/code-lab/{$lesson->id}/save", $changed)->assertOk();
    expect($submission->fresh()->vbnet_notes)->toBe($payload['vbnet_notes']);
    $this->actingAs($teacher)->post("/submissions/{$submission->id}/review", ['status' => 'completed', 'rubric_scores' => $lesson->rubric])->assertSessionHasErrors('status');
    $this->actingAs($student)->postJson("/code-lab/{$lesson->id}/submit", array_replace($changed, ['version' => 3]))->assertOk();
    $latest = Submission::where('lesson_id', $lesson->id)->latest('version')->firstOrFail();
    $this->actingAs($teacher)->post("/submissions/{$latest->id}/review", ['status' => 'completed', 'rubric_scores' => $lesson->rubric])->assertSessionHasNoErrors();
    expect($progress->fresh()->status)->toBe('completed');
    $this->actingAs($student)->putJson("/code-lab/{$lesson->id}/save", array_replace($changed, ['version' => 4]))->assertForbidden();
    $next = $course->lessons()->where('position', $lesson->position + 1)->firstOrFail();
    $this->get("/code-lab/{$next->id}")->assertOk();
});

test('vbnet management and module assessment reuse the shared teacher workflow', function () {
    $this->seed(VbnetCourseSeeder::class);
    $course = Course::where('slug', 'visual-basic-dotnet')->firstOrFail();
    $lesson = $course->lessons()->firstOrFail();
    $teacher = User::factory()->create(['role' => 'teacher']);
    $student = vbnetStudent();
    $this->actingAs($teacher)->put("/lessons/{$lesson->id}", array_replace($lesson->toArray(), ['starter_vbnet' => "' Teacher source", 'vbnet_mode' => 'winforms', 'vbnet_form_guide' => 'Use Visual Studio. Add a Button named btnSave.']))->assertSessionHasNoErrors();
    expect($lesson->fresh()->vbnet_mode)->toBe('winforms');
    expect($lesson->fresh()->vbnet_form_guide)->toContain('btnSave');
    $this->post('/lessons', ['title' => 'VB.NET draft', 'level' => 'Advanced', 'activity' => 'Design a form.', 'objectives' => ['Use events'], 'course_id' => $course->id])->assertSessionHasNoErrors();
    $draft = Lesson::where('title', 'VB.NET draft')->firstOrFail();
    expect($draft->is_published)->toBeFalse();
    expect($draft->starter_vbnet)->toContain('Option Strict On');
    $module = $course->modules()->firstOrFail();
    foreach ($course->lessons()->where('course_module_id', $module->id)->where('is_published', true)->get() as $item) {
        StudentLessonProgress::create(['user_id' => $student->id, 'lesson_id' => $item->id, 'status' => 'completed']);
    }
    $this->actingAs($student)->postJson("/courses/visual-basic-dotnet/modules/{$module->id}/assessment", ['answers' => array_column($module->assessment, 'answer')])->assertRedirect();
    expect(CourseEnrollment::where('user_id', $student->id)->firstOrFail()->assessment_results[$module->id]['passed'])->toBeTrue();
    $this->put("/lessons/{$lesson->id}", $lesson->toArray())->assertForbidden();
});

test('vbnet validates project links and stores dangerous source as text without executing it', function () {
    $this->seed(VbnetCourseSeeder::class);
    $lesson = Course::where('slug', 'visual-basic-dotnet')->firstOrFail()->lessons()->firstOrFail();
    $student = vbnetStudent();
    $this->actingAs($student)->get("/code-lab/{$lesson->id}")->assertOk();
    foreach (['file:///C:/Windows', 'javascript:alert(1)', 'https://user:password@example.org/project'] as $url) {
        $this->putJson("/code-lab/{$lesson->id}/save", ['version' => 1, 'html_code' => 'Module Program', 'vbnet_project_url' => $url])->assertUnprocessable();
    }
    $source = "Module Program\n Sub Main()\n Shell(\"whoami\")\n End Sub\nEnd Module";
    $this->postJson("/code-lab/{$lesson->id}/submit", ['version' => 1, 'html_code' => $source, 'vbnet_notes' => '<script>alert(1)</script>'])->assertOk()->assertJsonPath('status', 'submitted');
    expect(Submission::where('user_id', $student->id)->firstOrFail()->vbnet_code)->toBe($source);
});

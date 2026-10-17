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
use Database\Seeders\ScratchCourseSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(CurriculumSeeder::class);
    $this->seed(PythonCourseSeeder::class);
});

function scratchStudent(): User
{
    return User::factory()->create(['role' => 'student', 'education_level_id' => EducationLevel::where('slug', 'high-school')->value('id')]);
}

test('scratch seeding is idempotent and preserves both existing courses accounts and progress', function () {
    $before = Lesson::orderBy('id')->get()->toArray();
    $student = scratchStudent();
    $saved = StudentLessonProgress::create(['user_id' => $student->id, 'lesson_id' => Lesson::first()->id, 'html_code' => '<p>Keep</p>', 'status' => 'completed']);
    $this->seed(ScratchCourseSeeder::class);
    $course = Course::where('slug', 'scratch-programming')->firstOrFail();
    $first = $course->lessons()->firstOrFail();
    $first->update(['title' => 'Teacher introduction']);
    $this->seed(ScratchCourseSeeder::class);
    expect(Lesson::where('course_id', '!=', $course->id)->orderBy('id')->get()->toArray())->toBe($before);
    expect($student->fresh()->username)->toBe($student->username);
    expect($saved->fresh()->html_code)->toBe('<p>Keep</p>');
    expect($first->fresh()->title)->toBe('Teacher introduction');
    expect($course->editor_type)->toBe('scratch');
    expect($course->modules->pluck('name')->all())->toBe(['Beginner', 'Intermediate', 'Advanced']);
    expect($course->lessons->pluck('position')->all())->toBe(range(1, 30));
    expect($course->lessons->groupBy('level')->map->count()->all())->toBe(['Beginner' => 10, 'Intermediate' => 10, 'Advanced' => 10]);
    expect($course->lessons->where('is_project', true))->toHaveCount(3);
    foreach ($course->modules as $module) {
        expect($module->assessment)->toHaveCount(20);
    }
    foreach ($course->lessons as $lesson) {
        expect($lesson->objectives)->toHaveCount(3);
        expect($lesson->block_examples)->not->toBeEmpty();
        expect($lesson->quiz)->toHaveCount(5);
        foreach ($lesson->quiz as $question) {
            expect($question['choices'])->toHaveCount(4);
            expect(count(array_unique($question['choices'])))->toBe(4);
            expect($question['choices'][$question['answer']])->toBeString();
        }
        if ($lesson->is_project) {
            expect(array_sum($lesson->rubric))->toBe(100);
        }
    }
});

test('scratch access previews gating module labels and dashboard use shared course architecture', function () {
    $this->seed(ScratchCourseSeeder::class);
    $school = scratchStudent();
    $college = User::factory()->create(['role' => 'student', 'education_level_id' => EducationLevel::where('slug', 'college')->value('id')]);
    $course = Course::where('slug', 'scratch-programming')->firstOrFail();
    $first = $course->lessons()->firstOrFail();
    $second = $course->lessons()->skip(1)->firstOrFail();
    $this->actingAs($school)->get('/courses')->assertInertia(fn (Assert $p) => $p->has('courses', 2)->etc());
    $this->get('/courses/scratch-programming')->assertInertia(fn (Assert $p) => $p->has('lessons', 30)->where('levels', ['Beginner', 'Intermediate', 'Advanced'])->where('levelProgress.Beginner.total', 10)->missing('modules.0.assessment.0.answer')->etc());
    $this->get('/dashboard')->assertInertia(fn (Assert $p) => $p->has('courses', 2)->where('courses.1.modules.Beginner.total', 10)->where('summary.remaining', 45)->etc());
    $this->get("/code-lab/{$first->id}")->assertInertia(fn (Assert $p) => $p->component('code-lab/scratch')->missing('lesson.quiz.0.answer')->where('workspace.scratch_project_url', '')->etc());
    $this->get("/code-lab/{$second->id}")->assertForbidden();
    $this->get("/lessons/{$second->id}/preview")->assertInertia(fn (Assert $p) => $p->where('unlocked', false)->has('lesson.block_examples', 1)->etc());
    $this->actingAs($college)->get('/courses/scratch-programming')->assertForbidden();
    $this->putJson("/code-lab/{$first->id}/scratch", ['version' => 1])->assertForbidden();
    CourseEnrollment::create(['course_id' => $course->id, 'user_id' => $college->id]);
    // Enrollment is retained; education compatibility remains mandatory.
    $this->get("/code-lab/{$first->id}")->assertForbidden();
    $this->assertDatabaseHas('course_enrollments', ['user_id' => $college->id, 'course_id' => $course->id]);
    $this->actingAs($school);
    $course->update(['sequential_gating' => false]);
    $this->get("/code-lab/{$second->id}")->assertOk();
    $course->update(['is_published' => false]);
    $this->get("/code-lab/{$first->id}")->assertForbidden();
});

test('scratch submission is validated versioned reviewed and graded without html auto completion', function () {
    $this->seed(ScratchCourseSeeder::class);
    $student = scratchStudent();
    $teacher = User::factory()->create(['role' => 'teacher']);
    $course = Course::where('slug', 'scratch-programming')->firstOrFail();
    $lesson = $course->lessons()->where('is_project', true)->firstOrFail();
    StudentLessonProgress::create(['user_id' => $student->id, 'lesson_id' => $lesson->id, 'status' => 'not_started', 'is_manually_unlocked' => true]);
    $this->actingAs($student)->get("/code-lab/{$lesson->id}")->assertOk();
    $payload = ['version' => 1, 'scratch_project_url' => 'https://scratch.mit.edu/projects/123456789/', 'scratch_notes' => 'Tested player movement, catching, missed objects, game over and restart.'];
    foreach (['javascript:alert(1)', 'https://scratch.mit.edu.evil.test/projects/123/', 'https://example.test/projects/1/', 'https://scratch.mit.edu/projects/1/?x=1'] as $url) {
        $this->putJson("/code-lab/{$lesson->id}/scratch", array_replace($payload, ['scratch_project_url' => $url]))->assertUnprocessable();
    }
    $this->putJson("/code-lab/{$lesson->id}/save", ['version' => 1, 'html_code' => '<p>Bypass</p>'])->assertUnprocessable();
    $this->postJson("/code-lab/{$lesson->id}/submit", ['version' => 1, 'html_code' => '<p>Bypass</p>'])->assertUnprocessable();
    $this->putJson("/code-lab/{$lesson->id}/scratch", $payload)->assertOk()->assertJsonPath('version', 2);
    $this->putJson("/code-lab/{$lesson->id}/scratch", $payload)->assertUnprocessable();
    $this->postJson("/code-lab/{$lesson->id}/scratch", array_replace($payload, ['version' => 2]))->assertOk()->assertJsonPath('status', 'submitted')->assertJsonPath('version', 3);
    $submission = Submission::where('lesson_id', $lesson->id)->firstOrFail();
    $this->actingAs($teacher)->post("/submissions/{$submission->id}/review", ['status' => 'completed', 'rubric_scores' => $lesson->rubric])->assertSessionHasErrors('status');
    $this->actingAs($student)->postJson("/code-lab/{$lesson->id}/quiz", ['answers' => collect($lesson->quiz)->pluck('answer')->all()])->assertOk()->assertJsonPath('completed', false);
    $this->actingAs($teacher)->get("/submissions/{$submission->id}")->assertInertia(fn (Assert $p) => $p->where('canComplete', true)->where('submission.scratch_project_url', $payload['scratch_project_url'])->etc());
    $this->post("/submissions/{$submission->id}/review", ['status' => 'completed'])->assertSessionHasErrors('rubric_scores');
    $tooHigh = $lesson->rubric;
    $tooHigh['Program Functionality'] = 31;
    $this->post("/submissions/{$submission->id}/review", ['status' => 'completed', 'rubric_scores' => $tooHigh])->assertSessionHasErrors('rubric_scores');
    $this->post("/submissions/{$submission->id}/review", ['status' => 'needs_revision', 'comment' => 'Add a reliable restart.'])->assertRedirect();
    $this->actingAs($student)->postJson("/code-lab/{$lesson->id}/scratch", array_replace($payload, ['version' => 3, 'scratch_notes' => 'Fixed restart and tested the full game again, including catching and missing objects.']))->assertOk();
    $latest = Submission::where('lesson_id', $lesson->id)->latest('version')->firstOrFail();
    $this->actingAs($teacher)->post("/submissions/{$submission->id}/review", ['status' => 'completed', 'rubric_scores' => $lesson->rubric])->assertSessionHasErrors('status');
    $this->post("/submissions/{$latest->id}/review", ['status' => 'completed', 'rubric_scores' => $lesson->rubric])->assertRedirect()->assertSessionHasNoErrors();
    expect((float) array_sum($latest->fresh()->rubric_scores))->toBe(100.0);
    expect($student->lessonProgress()->first()->status)->toBe('completed');
    $next = $course->lessons()->where('position', 11)->firstOrFail();
    $this->actingAs($student)->get("/code-lab/{$next->id}")->assertOk();
    $this->putJson("/code-lab/{$lesson->id}/scratch", array_replace($payload, ['version' => 4]))->assertForbidden();
});

test('teacher can manage scratch blocks modules drafts and assessments', function () {
    $this->seed(ScratchCourseSeeder::class);
    $teacher = User::factory()->create(['role' => 'teacher']);
    $student = scratchStudent();
    $course = Course::where('slug', 'scratch-programming')->firstOrFail();
    $lesson = $course->lessons()->firstOrFail();
    $module = $course->modules()->firstOrFail();
    $this->actingAs($teacher)->get("/lessons/{$lesson->id}/edit")->assertInertia(fn (Assert $p) => $p->where('levels', ['Beginner', 'Intermediate', 'Advanced'])->has('lesson.block_examples', 1)->etc());
    $this->put("/lessons/{$lesson->id}", $lesson->toArray())->assertSessionHasNoErrors();
    $this->put("/courses/scratch-programming/modules/{$module->id}", ['name' => 'Beginner', 'position' => 1, 'assessment' => $module->assessment])->assertSessionHasNoErrors();
    $this->post('/lessons', ['title' => 'New Scratch activity', 'level' => 'Intermediate', 'activity' => 'Build an animation', 'objectives' => ['Create an animation'], 'course_id' => $course->id])->assertRedirect();
    expect(Lesson::where('title', 'New Scratch activity')->first()->is_published)->toBeFalse();
    $answers = collect($module->assessment)->pluck('answer')->all();
    $this->actingAs($student)->post('/courses/scratch-programming/modules/'.$module->id.'/assessment', ['answers' => $answers])->assertForbidden();
    foreach ($course->lessons()->where('course_module_id', $module->id)->get() as $item) {
        StudentLessonProgress::create(['user_id' => $student->id, 'lesson_id' => $item->id, 'status' => 'completed']);
    }
    $this->post('/courses/scratch-programming/modules/'.$module->id.'/assessment', ['answers' => $answers])->assertRedirect();
    expect(CourseEnrollment::where('user_id', $student->id)->first()->assessment_results[$module->id]['score'])->toBe(20);
});

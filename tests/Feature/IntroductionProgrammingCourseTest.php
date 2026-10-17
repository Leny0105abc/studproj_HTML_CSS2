<?php

use App\Models\Course;
use App\Models\EducationLevel;
use App\Models\Lesson;
use App\Models\StudentLessonProgress;
use App\Models\Submission;
use App\Models\User;
use Database\Seeders\CurriculumSeeder;
use Database\Seeders\IntroductionProgrammingCourseSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(CurriculumSeeder::class);
    $this->seed(IntroductionProgrammingCourseSeeder::class);
});

function programmingStudent(): User
{
    return User::factory()->create(['role' => 'student', 'education_level_id' => EducationLevel::where('slug', 'college')->value('id')]);
}

function programmingWork(Lesson $lesson): array
{
    return ['graph' => $lesson->programming_content['graph'], 'codes' => ['python' => $lesson->example_python, 'cpp' => $lesson->example_cpp, 'java' => $lesson->example_java], 'input' => $lesson->programming_content['tests'][0]['input'], 'analysis' => 'Identify the stated inputs, transformation, and outputs.', 'algorithm' => implode("\n", $lesson->programming_content['plan']['algorithm']), 'pseudocode' => $lesson->programming_content['plan']['pseudocode'], 'test_notes' => 'Compare available runner results; document unavailable languages for teacher review.', 'mode' => 'learn'];
}

test('course content is complete and reruns preserve courses work and teacher edits', function () {
    $course = Course::where('editor_type', 'programming')->firstOrFail();
    $before = Lesson::where('course_id', '!=', $course->id)->get()->toArray();
    $first = $course->lessons()->firstOrFail();
    $id = $first->id;
    $first->update(['title' => 'Teacher custom title']);
    $this->seed(IntroductionProgrammingCourseSeeder::class);
    expect($course->lessons)->toHaveCount(30);
    expect($course->modules->pluck('name')->all())->toBe(['Beginner', 'Intermediate', 'Advanced']);
    expect($course->lessons->groupBy('level')->map->count()->all())->toBe(['Beginner' => 10, 'Intermediate' => 10, 'Advanced' => 10]);
    expect(Lesson::where('course_id', '!=', $course->id)->get()->toArray())->toBe($before);
    expect(Lesson::find($id)->title)->toBe('Teacher custom title');
    foreach ($course->lessons as $lesson) {
        $content = $lesson->programming_content;
        expect($lesson->quiz)->toHaveCount(10);
        expect($content['tests'])->toHaveCount(2);
        expect($content)->not->toHaveKey('quiz');
        expect(strlen($content['discussion']))->toBeGreaterThan(500);
        foreach (['guided' => 3, 'independent' => 3, 'debugging' => 2, 'conversion' => 2] as $group => $count) {
            expect($content['exercises'][$group])->toHaveCount($count);
        }
        foreach ($lesson->quiz as $q) {
            expect($q['choices'])->toHaveCount(4);
            expect(array_unique($q['choices']))->toHaveCount(4);
            expect($q['explanation'])->not->toBeEmpty();
        }
        expect($lesson->requiresTeacherReview())->toBeTrue();
    }
});

test('existing introduction course is revised without duplicate IDs or records', function () {
    $course = Course::where('editor_type', 'programming')->firstOrFail();
    $course->update(['slug' => 'intro-custom', 'editor_type' => 'html']);
    $lesson = $course->lessons()->first();
    $lesson->update(['programming_content' => null]);
    $student = programmingStudent();
    $progress = StudentLessonProgress::create(['user_id' => $student->id, 'lesson_id' => $lesson->id, 'status' => 'in_progress', 'html_code' => 'preserve earlier work']);
    $this->seed(IntroductionProgrammingCourseSeeder::class);
    expect(Course::where('name', 'Introduction to Programming')->count())->toBe(1);
    expect($lesson->fresh()->id)->toBe($lesson->id);
    expect($progress->fresh()->html_code)->toBe('preserve earlier work');
});

test('access gating safe generation and quiz secrecy are enforced', function () {
    $student = programmingStudent();
    $course = Course::where('editor_type', 'programming')->first();
    $first = $course->lessons()->first();
    $second = $course->lessons()->skip(1)->first();
    $this->actingAs($student)->get('/courses/'.$course->slug)->assertOk();
    $this->get('/code-lab/'.$first->id)->assertInertia(fn (Assert $p) => $p->component('code-lab/programming')->has('lesson.quiz', 10)->missing('lesson.quiz.0.answer')->missing('lesson.programming_content.quiz')->etc());
    $this->get('/code-lab/'.$second->id)->assertForbidden();
    $this->postJson('/code-lab/'.$first->id.'/programming/generate', ['graph' => $first->programming_content['graph']])->assertOk()->assertJsonStructure(['programs' => ['python' => ['code', 'nodes'], 'cpp', 'java']]);
    $bad = $first->programming_content['graph'];
    $bad['body'][] = 'missing';
    $this->postJson('/code-lab/'.$first->id.'/programming/generate', ['graph' => $bad])->assertUnprocessable();
    $this->postJson('/code-lab/'.$first->id.'/submit', ['html_code' => 'bypass', 'version' => 1])->assertUnprocessable();
    $this->postJson('/code-lab/'.$first->id.'/java/run', ['code' => 'public class Main {}'])->assertStatus(503);
    $outsider = User::factory()->create(['role' => 'student', 'education_level_id' => null]);
    $this->actingAs($outsider)->postJson('/code-lab/'.$first->id.'/programming/generate', ['graph' => $first->programming_content['graph']])->assertForbidden();
});

test('workspace resume optimistic versions randomized quiz and teacher review share existing records', function () {
    $student = programmingStudent();
    $teacher = User::factory()->create(['role' => 'teacher']);
    $lesson = Course::where('editor_type', 'programming')->first()->lessons()->first();
    $this->actingAs($student)->get('/code-lab/'.$lesson->id)->assertOk();
    $work = programmingWork($lesson);
    $url = '/code-lab/'.$lesson->id;
    $this->putJson($url.'/programming/save', ['version' => 1, 'workspace' => $work])->assertOk()->assertJsonPath('version', 2);
    $this->putJson($url.'/programming/save', ['version' => 1, 'workspace' => $work])->assertUnprocessable();
    $this->get($url)->assertInertia(fn (Assert $p) => $p->where('workspace.programming_workspace.codes.cpp', $work['codes']['cpp'])->etc());
    $this->postJson($url.'/programming/submit', ['version' => 2, 'workspace' => $work])->assertOk();
    $submission = Submission::where('lesson_id', $lesson->id)->firstOrFail();
    expect($submission->programming_workspace)->toBe($work);
    $this->actingAs($teacher)->post('/submissions/'.$submission->id.'/review', ['status' => 'completed'])->assertSessionHasErrors('status');
    $this->actingAs($student)->get($url)->assertOk();
    $order = session('programming_quiz.'.$lesson->id);
    expect(array_unique(array_column($order, 'question')))->toHaveCount(10);
    foreach ($order as $entry) {
        expect(array_unique($entry['choices']))->toHaveCount(4);
    }
    $answers = array_map(fn ($entry) => array_search($lesson->quiz[$entry['question']]['answer'], $entry['choices']), $order);
    $this->postJson($url.'/quiz', ['answers' => $answers])->assertOk()->assertJsonPath('score', 10)->assertJsonPath('completed', false);
    expect($student->lessonProgress()->first()->quiz_score)->toBe(10);
    // Editing any evidence invalidates the submitted snapshot.
    $work['test_notes'] .= ' Updated evidence.';
    $this->putJson($url.'/programming/save', ['version' => 3, 'workspace' => $work])->assertOk();
    $this->actingAs($teacher)->post('/submissions/'.$submission->id.'/review', ['status' => 'completed'])->assertSessionHasErrors('status');
    $this->actingAs($student)->postJson($url.'/programming/submit', ['version' => 4, 'workspace' => $work])->assertOk();
    $latest = Submission::where('lesson_id', $lesson->id)->latest('version')->first();
    $this->actingAs($teacher)->get('/submissions/'.$latest->id)->assertOk();
    $this->post('/submissions/'.$latest->id.'/review', ['status' => 'completed'])->assertSessionHasNoErrors();
    expect($student->lessonProgress()->first()->status)->toBe('completed');
    $this->actingAs($student)->putJson($url.'/programming/save', ['version' => 5, 'workspace' => $work])->assertForbidden();
    $next = $lesson->course->lessons()->where('position', 2)->first();
    $this->get('/code-lab/'.$next->id)->assertOk();
});

test('incomplete submissions are rejected but unfinished graphs can be saved', function () {
    $student = programmingStudent();
    $lesson = Course::where('editor_type', 'programming')->first()->lessons()->first();
    $this->actingAs($student)->get('/code-lab/'.$lesson->id);
    $work = programmingWork($lesson);
    $work['analysis'] = '';
    $this->postJson('/code-lab/'.$lesson->id.'/programming/submit', ['version' => 1, 'workspace' => $work])->assertUnprocessable();
    $work['graph']['end'] = '';
    $this->putJson('/code-lab/'.$lesson->id.'/programming/save', ['version' => 1, 'workspace' => $work])->assertOk();
    expect(Submission::count())->toBe(0);
});

test('the course is available to both target education groups and project approval requires rubric and documentation', function () {
    $school = User::factory()->create(['role' => 'student', 'education_level_id' => EducationLevel::where('slug', 'high-school')->value('id')]);
    $course = Course::where('editor_type', 'programming')->first();
    $this->actingAs($school)->get('/courses/'.$course->slug)->assertOk();
    $lesson = $course->lessons()->where('position', 30)->first();
    StudentLessonProgress::create(['user_id' => $school->id, 'lesson_id' => $lesson->id, 'status' => 'in_progress', 'is_manually_unlocked' => true]);
    $this->get('/code-lab/'.$lesson->id)->assertOk();
    $work = programmingWork($lesson);
    $url = '/code-lab/'.$lesson->id;
    $this->postJson($url.'/programming/submit', ['version' => 1, 'workspace' => $work])->assertUnprocessable();
    $work['documentation'] = 'Fixed capacity: two students. Menu: 1 search, 2 update, 3 report, 0 exit. Data is in memory; updates use zero-based indices.';
    $this->postJson($url.'/programming/submit', ['version' => 1, 'workspace' => $work])->assertOk();
    $order = session('programming_quiz.'.$lesson->id);
    $this->postJson($url.'/quiz', ['answers' => array_map(fn ($e) => array_search($lesson->quiz[$e['question']]['answer'], $e['choices']), $order)])->assertOk();
    $submission = Submission::where('lesson_id', $lesson->id)->first();
    $teacher = User::factory()->create(['role' => 'teacher']);
    $this->actingAs($teacher)->post('/submissions/'.$submission->id.'/review', ['status' => 'completed'])->assertSessionHasErrors('rubric_scores');
    $this->post('/submissions/'.$submission->id.'/review', ['status' => 'completed', 'rubric_scores' => $lesson->rubric])->assertSessionHasNoErrors();
    expect($submission->fresh()->rubric_scores)->not->toBeNull();
});

test('teachers edit the ten-question lesson and invalid graph edits do not reach students', function () {
    $teacher = User::factory()->create(['role' => 'teacher']);
    $lesson = Course::where('editor_type', 'programming')->first()->lessons()->first();
    $this->actingAs($teacher)->get('/lessons/'.$lesson->id.'/edit')->assertOk();
    $data = $lesson->toArray();
    $data['programming_content']['discussion'] .= ' Teacher explanation.';
    $this->put('/lessons/'.$lesson->id, $data)->assertSessionHasNoErrors();
    expect($lesson->fresh()->explanation)->toEndWith('Teacher explanation.');
    $data['programming_content']['graph']['body'][] = 'missing';
    $this->put('/lessons/'.$lesson->id, $data)->assertSessionHasErrors('programming_content');
    expect($lesson->fresh()->programming_content['graph']['body'])->not->toContain('missing');
});

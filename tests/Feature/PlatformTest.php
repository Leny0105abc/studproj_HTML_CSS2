<?php

use App\Models\Activity;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\EducationLevel;
use App\Models\Lesson;
use App\Models\StudentLessonProgress;
use App\Models\Submission;
use App\Models\User;
use Database\Seeders\CurriculumSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(CurriculumSeeder::class);
});

function platformCourse(string $slug = 'python-programming'): Course
{
    $course = Course::where('slug', $slug)->firstOrFail();
    $course->update(['status' => 'published']);
    $course->levels()->update(['status' => 'published']);

    return $course->refresh();
}

function platformLesson(Course $course, int $position = 1, array $extra = []): Lesson
{
    $number = Lesson::max('number') + 1;

    return Lesson::create($extra + [
        'course_id' => $course->id, 'course_level_id' => $course->levels()->first()->id,
        'number' => $number, 'position' => $position, 'level' => 'Basic', 'slug' => 'sample-'.$number,
        'title' => 'Sample lesson '.$position, 'objectives' => ['Understand a concept'], 'introduction' => 'Introduction',
        'explanation' => 'Discussion', 'guided_practice' => 'Practice', 'activity' => 'Write a solution',
        'expected_result' => 'Working code', 'completion_requirements' => 'Teacher review', 'starter_code' => 'print("Hello")',
        'is_published' => true,
    ]);
}

test('only the existing HTML CSS course is published after migration', function () {
    expect(Course::count())->toBe(15);
    expect(Course::where('status', 'published')->pluck('slug')->all())->toBe(['html-css']);
    expect(Lesson::whereNull('course_id')->count())->toBe(0);
    $this->get('/courses')->assertInertia(fn (Assert $page) => $page->has('courses.data', 1)->where('courses.data.0.slug', 'html-css')->etc());
    $this->get('/programs/college')->assertOk();
});

test('admin dashboard loads audit relations and students cannot change their role or program from a profile update', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $this->actingAs($admin)->get('/admin')->assertOk();
    $student = User::factory()->create(['education_level_id' => EducationLevel::where('slug', 'high-school')->value('id')]);
    $this->actingAs($student)->post('/learning-profile', ['school' => 'Test school', 'role' => 'admin',
        'education_level_id' => EducationLevel::where('slug', 'college')->value('id')])->assertRedirect();
    expect($student->fresh()->role)->toBe('student');
    expect($student->fresh()->educationLevel->slug)->toBe('high-school');
    expect($student->fresh()->school)->toBe('Test school');
});

test('the activities page hides instructions for prerequisite locked lessons and rejects their submissions', function () {
    $student = User::factory()->create(['education_level_id' => EducationLevel::where('slug', 'college')->value('id')]);
    $course = platformCourse();
    platformLesson($course, 1);
    $lesson = platformLesson($course, 2);
    $activity = Activity::create(['lesson_id' => $lesson->id, 'title' => 'Locked exercise', 'instructions' => 'Private exercise instructions',
        'activity_type' => 'written', 'points' => 10, 'status' => 'published', 'display_order' => 1]);
    $this->actingAs($student)->get('/activities')->assertInertia(fn (Assert $page) => $page
        ->where('activities.data.0.locked', true)->where('activities.data.0.instructions', 'Complete the prerequisite lesson to open this activity.')->etc());
    $this->post('/activities/'.$activity->id.'/submit', ['answer' => 'Attempt'])->assertForbidden();
});

test('college students see their program and may receive an explicit cross-program enrollment', function () {
    $student = User::factory()->create(['education_level_id' => EducationLevel::where('slug', 'college')->value('id')]);
    $python = platformCourse();
    $this->actingAs($student)->get('/my-courses')->assertInertia(fn (Assert $page) => $page->has('courses', 11)->etc());
    $this->get('/courses/html-css')->assertForbidden();
    CourseEnrollment::create(['student_id' => $student->id, 'course_id' => Course::where('slug', 'html-css')->value('id'), 'status' => 'active']);
    $this->get('/courses/html-css')->assertOk();
    $this->get('/courses/'.$python->slug)->assertOk();
});

test('suspended enrollment overrides program defaults and draft courses reject direct lesson URLs', function () {
    $student = User::factory()->create();
    $html = Course::where('slug', 'html-css')->firstOrFail();
    CourseEnrollment::create(['student_id' => $student->id, 'course_id' => $html->id, 'status' => 'suspended']);
    $this->actingAs($student)->get('/code-lab/'.Lesson::where('number', 1)->value('id'))->assertForbidden();
    $draft = Course::where('slug', 'python-programming')->firstOrFail();
    $lesson = platformLesson($draft);
    CourseEnrollment::create(['student_id' => $student->id, 'course_id' => $draft->id, 'status' => 'active']);
    $this->get('/learn/'.$lesson->id)->assertForbidden();
});

test('lesson prerequisites are isolated to each course and forged module URLs are rejected', function () {
    $course = platformCourse();
    $student = User::factory()->create(['education_level_id' => EducationLevel::where('slug', 'college')->value('id')]);
    $first = platformLesson($course);
    $second = platformLesson($course, 2);
    $this->actingAs($student)->get('/learn/'.$first->id)->assertOk();
    $this->get('/learn/'.$second->id)->assertForbidden();
    StudentLessonProgress::where('user_id', $student->id)->where('lesson_id', $first->id)->update(['status' => 'completed']);
    $this->get('/learn/'.$second->id)->assertOk();
    $this->get('/courses/html-css/basic/'.$first->slug)->assertNotFound();
    expect(Lesson::where('number', 1)->first()->course_id)->not->toBe($course->id);
});

test('course progression can allow unrestricted lessons or require a teacher unlock', function () {
    $course = platformCourse();
    $student = User::factory()->create(['education_level_id' => EducationLevel::where('slug', 'college')->value('id')]);
    $lesson = platformLesson($course, 2);
    platformLesson($course, 1);
    $course->update(['progression_rule' => 'none']);
    $this->actingAs($student)->get('/learn/'.$lesson->id)->assertOk();
    $course->update(['progression_rule' => 'teacher_unlock']);
    $this->get('/learn/'.$lesson->id)->assertForbidden();
    StudentLessonProgress::where('user_id', $student->id)->where('lesson_id', $lesson->id)->update(['is_manually_unlocked' => true]);
    $this->get('/learn/'.$lesson->id)->assertOk();
});

test('a generic coding lesson saves versions and submits source without running it on the server', function () {
    $course = platformCourse();
    $student = User::factory()->create(['education_level_id' => EducationLevel::where('slug', 'college')->value('id')]);
    $lesson = platformLesson($course);
    $this->actingAs($student)->get('/learn/'.$lesson->id)->assertOk();
    $code = 'import os; print("This is saved text, never executed")';
    $this->putJson('/learn/'.$lesson->id.'/save', ['source_code' => $code, 'version' => 1])->assertOk()->assertJsonPath('version', 2);
    $this->putJson('/learn/'.$lesson->id.'/save', ['source_code' => 'old', 'version' => 1])->assertUnprocessable();
    $this->post('/learn/'.$lesson->id.'/submit', ['source_code' => $code, 'version' => 2])->assertRedirect();
    expect(Submission::where('lesson_id', $lesson->id)->value('source_code'))->toBe($code);
});

test('flexible quizzes hide answers enforce attempts and allow teacher reviewed completion', function () {
    $course = platformCourse();
    $teacher = User::factory()->create(['role' => 'teacher']);
    $course->teachers()->attach($teacher->id);
    $student = User::factory()->create(['education_level_id' => EducationLevel::where('slug', 'college')->value('id')]);
    $lesson = platformLesson($course, 1, ['passing_score' => 100, 'attempt_limit' => 1, 'quiz' => [
        ['type' => 'short_answer', 'question' => 'Which function prints?', 'answer' => 'print', 'explanation' => 'Use print.'],
        ['type' => 'multiple_choice', 'question' => 'Which is a number?', 'choices' => ['3', 'hello'], 'answer' => 0],
    ]]);
    $this->actingAs($student)->get('/learn/'.$lesson->id)->assertInertia(fn (Assert $page) => $page->missing('lesson.quiz.0.answer')->etc());
    $this->postJson('/learn/'.$lesson->id.'/quiz', ['answers' => ['PRINT', '0']])->assertOk()->assertJsonPath('passed', true);
    $this->postJson('/learn/'.$lesson->id.'/quiz', ['answers' => ['print', '0']])->assertUnprocessable();
    $this->post('/learn/'.$lesson->id.'/submit', ['source_code' => 'print(3)', 'version' => 1])->assertRedirect();
    $submission = Submission::where('lesson_id', $lesson->id)->firstOrFail();
    $this->actingAs($teacher)->post('/submissions/'.$submission->id.'/review', ['status' => 'completed'])->assertRedirect();
    expect(CourseEnrollment::where('student_id', $student->id)->where('course_id', $course->id)->value('status'))->toBe('completed');
    $this->actingAs($student)->putJson('/learn/'.$lesson->id.'/save', ['source_code' => 'changed', 'version' => 1])->assertForbidden();
});

test('students cannot enter management or create courses and disabled accounts cannot browse private pages', function () {
    $student = User::factory()->create();
    $this->actingAs($student)->get('/admin/courses')->assertForbidden();
    $this->post('/admin/courses', ['name' => 'Injected'])->assertForbidden();
    $student->update(['status' => 'disabled']);
    $this->get('/dashboard')->assertForbidden();
});

test('admin may create a database driven course and attach it to multiple programs', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $this->actingAs($admin)->post('/admin/courses', [
        'name' => 'Future course', 'slug' => 'future-course', 'difficulty' => 'Beginner', 'status' => 'draft',
        'display_order' => 20, 'editor_type' => 'none', 'execution_provider' => 'none', 'progression_rule' => 'completion',
        'education_level_ids' => EducationLevel::pluck('id')->all(), 'teacher_ids' => [],
    ])->assertRedirect()->assertSessionHasNoErrors();
    expect(Course::where('slug', 'future-course')->firstOrFail()->educationLevels()->count())->toBe(2);
    $this->get('/admin/progress')->assertOk();
    $this->get('/admin/education-levels')->assertOk();
});

test('lesson management validates course module ownership and does not copy progress when duplicating', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $course = platformCourse();
    $lesson = platformLesson($course);
    $student = User::factory()->create();
    StudentLessonProgress::create(['user_id' => $student->id, 'lesson_id' => $lesson->id, 'source_code' => 'saved']);
    $this->actingAs($admin)->post('/admin/lessons/'.$lesson->id.'/duplicate')->assertRedirect();
    $copy = Lesson::latest('id')->firstOrFail();
    expect($copy->id)->not->toBe($lesson->id);
    expect($copy->is_published)->toBeFalse();
    expect($copy->progress()->count())->toBe(0);
    $data = $lesson->toArray();
    $data['passing_score'] = 80;
    $data['course_level_id'] = Course::where('slug', 'html-css')->first()->levels()->first()->id;
    $this->put('/admin/lessons/'.$lesson->id, $data)->assertSessionHasErrors('course_level_id');
});

test('teachers only manage assigned courses and cannot alter unassigned content', function () {
    $teacher = User::factory()->create(['role' => 'teacher']);
    $course = platformCourse();
    $lesson = platformLesson($course);
    $this->actingAs($teacher)->delete('/admin/lessons/'.$lesson->id)->assertForbidden();
    $this->get('/admin/courses')->assertInertia(fn (Assert $page) => $page->has('records.data', 1)->etc());
    $course->teachers()->attach($teacher->id);
    $this->delete('/admin/lessons/'.$lesson->id)->assertRedirect();
    expect($lesson->refresh()->is_published)->toBeFalse();
    expect(Lesson::where('number', 1)->first()->is_published)->toBeTrue();
});

test('activity uploads are private and unrelated students cannot download them', function () {
    Storage::fake('local');
    $course = platformCourse();
    $lesson = platformLesson($course);
    $student = User::factory()->create(['education_level_id' => EducationLevel::where('slug', 'college')->value('id')]);
    $other = User::factory()->create();
    $activity = Activity::create(['lesson_id' => $lesson->id, 'title' => 'Explain', 'instructions' => 'Explain your code', 'status' => 'published']);
    $this->actingAs($student)->post('/activities/'.$activity->id.'/submit', ['answer' => 'My answer', 'file' => UploadedFile::fake()->create('answer.txt', 1, 'text/plain')])->assertRedirect();
    $response = $activity->responses()->firstOrFail();
    $this->get('/activity-files/'.$response->id)->assertOk();
    $this->actingAs($other)->get('/activity-files/'.$response->id)->assertForbidden();
    $this->post('/activities/'.$activity->id.'/submit', ['answer' => 'forged'])->assertForbidden();
});

test('migration preserves original lesson ids saved work quizzes accounts and submissions', function () {
    $originalConnection = DB::getDefaultConnection();
    config(['database.connections.preservation' => ['driver' => 'sqlite', 'database' => ':memory:', 'foreign_key_constraints' => true]]);
    DB::setDefaultConnection('preservation');
    try {
        foreach (glob(database_path('migrations/*.php')) as $path) {
            if (basename($path) !== '2026_10_09_000001_add_programs_and_courses.php') {
                (require $path)->up();
            }
        }
        $student = User::factory()->create();
        $teacher = User::create(['name' => 'Existing teacher', 'username' => 'existing.teacher', 'email' => 'teacher@example.test', 'password' => 'password', 'role' => 'teacher', 'status' => 'active']);
        $lesson = Lesson::create(['number' => 1, 'position' => 1, 'level' => 'Basic', 'slug' => 'existing-lesson',
            'title' => 'Existing lesson', 'objectives' => ['Learn'], 'introduction' => 'Original', 'explanation' => 'Original discussion',
            'guided_practice' => 'Original practice', 'activity' => 'Original activity', 'expected_result' => 'Original result',
            'completion_requirements' => 'Original requirements', 'quiz' => [['question' => 'Original question', 'choices' => ['A', 'B'], 'answer' => 0]]]);
        $progress = StudentLessonProgress::create(['user_id' => $student->id, 'lesson_id' => $lesson->id,
            'html_code' => '<h1>My saved work</h1>', 'version' => 7, 'status' => 'completed', 'quiz_score' => 5, 'completed_at' => now()]);
        $submission = Submission::create(['user_id' => $student->id, 'lesson_id' => $lesson->id, 'html_code' => '<h1>My saved work</h1>',
            'version' => 2, 'status' => 'completed', 'submitted_at' => now()]);
        $password = $student->password;
        $original = $lesson->only('id', 'title', 'example_html', 'quiz', 'starter_html');
        $migration = require database_path('migrations/2026_10_09_000001_add_programs_and_courses.php');
        $migration->up();
        expect($lesson->fresh()->only(array_keys($original)))->toBe($original);
        expect($student->fresh()->password)->toBe($password);
        expect($progress->fresh()->html_code)->toBe('<h1>My saved work</h1>');
        expect($progress->fresh()->version)->toBe(7);
        expect($progress->fresh()->quiz_score)->toBe(5);
        expect($submission->fresh()->version)->toBe(2);
        expect(CourseEnrollment::where('student_id', $student->id)->count())->toBe(1);
        expect($teacher->fresh()->taughtCourses()->count())->toBe(1);
        $migration->down();
        expect($progress->fresh()->html_code)->toBe('<h1>My saved work</h1>');
        expect($submission->fresh()->version)->toBe(2);
    } finally {
        DB::disconnect('preservation');
        DB::setDefaultConnection($originalConnection);
    }
});

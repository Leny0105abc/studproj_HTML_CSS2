<?php

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\EducationLevel;
use App\Models\Lesson;
use App\Models\StudentLessonProgress;
use App\Models\Submission;
use App\Models\User;
use App\Services\StudentAccountService;
use Database\Seeders\CurriculumSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->withoutVite();
    $this->teacher = User::factory()->create(['role' => 'teacher']);
    $this->school = EducationLevel::where('slug', 'high-school')->firstOrFail();
    $this->college = EducationLevel::where('slug', 'college')->firstOrFail();
});

test('manual creation requires explicit education and never invents a classification', function () {
    $this->actingAs($this->teacher)->post('/students', ['first_name' => 'New', 'last_name' => 'Example', 'grade_level' => 'Grade 11', 'section' => 'A'])->assertSessionHasErrors('education_level_id');
    $this->assertDatabaseMissing('users', ['username' => 'new.example']);
    expect(fn () => app(StudentAccountService::class)->create(['first_name' => 'New', 'last_name' => 'Example', 'grade_level' => 'Grade 11', 'section' => 'A']))->toThrow(ValidationException::class);
});

test('explicit school and college selections survive authentication without inference', function () {
    foreach ([[$this->school, 'Grade 11', 'school'], [$this->college, '1st Year', 'college']] as [$level, $grade, $first]) {
        $this->actingAs($this->teacher)->post('/students', ['first_name' => $first, 'last_name' => 'Example', 'grade_level' => $grade, 'section' => 'A', 'education_level_id' => $level->id, 'program' => $first === 'college' ? 'BSIT' : null])->assertSessionHasNoErrors()->assertSessionHas('credentials.education_level', $level->name);
        $password = session('credentials.password');
        $user = User::where('username', $first.'.example')->firstOrFail();
        auth()->logout();
        $this->post('/login', ['username' => $user->username, 'password' => $password])->assertRedirect('/dashboard');
        expect($user->fresh()->education_level_id)->toBe($level->id);
    }
});

test('grade and year must agree with the explicit education selection', function () {
    $this->actingAs($this->teacher);
    foreach ([[$this->college->id, 'Grade 11'], [$this->school->id, '1st Year']] as [$level, $grade]) {
        $this->post('/students', ['first_name' => 'Wrong', 'last_name' => 'Example', 'grade_level' => $grade, 'section' => 'A', 'education_level_id' => $level])->assertSessionHasErrors('grade_level');
    }
    $other = EducationLevel::create(['slug' => 'other', 'name' => 'Other']);
    $this->post('/students', ['first_name' => 'Wrong', 'last_name' => 'Example', 'grade_level' => 'Grade 11', 'section' => 'A', 'education_level_id' => $other->id])->assertSessionHasErrors('education_level_id');
});

test('legacy students remain unclassified and cannot use enrollment to bypass course restrictions', function () {
    $this->seed(CurriculumSeeder::class);
    $student = User::factory()->create(['education_level_id' => null]);
    $course = Course::where('slug', 'html-css')->firstOrFail();
    CourseEnrollment::create(['user_id' => $student->id, 'course_id' => $course->id]);
    $this->actingAs($student)->get('/courses')->assertInertia(fn (Assert $page) => $page->has('courses', 0));
    $this->get('/courses/html-css')->assertForbidden();
    $this->get('/lessons/'.$course->lessons()->firstOrFail()->id.'/preview')->assertForbidden();
    $this->get('/dashboard')->assertInertia(fn (Assert $page) => $page->where('summary.level', 'Education Level Not Assigned'));
    expect($student->fresh()->education_level_id)->toBeNull();
    $this->actingAs($this->teacher)->get('/students')->assertInertia(fn (Assert $page) => $page->where('students.data.0.educationLevel', 'Education Level Not Assigned'));
    $this->get('/students/'.$student->id)->assertInertia(fn (Assert $page) => $page->where('student.education_level', 'Education Level Not Assigned')->where('summary.currentLesson', 'Education Level Not Assigned'));
    $this->get('/students/education-review')->assertInertia(fn (Assert $page) => $page->has('unclassified', 1)->has('mismatches', 1));
});

test('course lists direct URLs lessons quizzes and assignments enforce level compatibility', function () {
    $this->seed(CurriculumSeeder::class);
    $schoolCourse = Course::where('slug', 'html-css')->firstOrFail();
    $collegeCourse = Course::create(['name' => 'College Only', 'description' => 'College fixture', 'slug' => 'college-only', 'education_level_id' => $this->college->id, 'is_published' => true]);
    $shared = Course::create(['name' => 'Both', 'description' => 'Shared fixture', 'slug' => 'both', 'education_level_id' => $this->college->id, 'is_published' => true]);
    $shared->educationLevels()->sync([$this->school->id, $this->college->id]);
    $school = User::factory()->create(['education_level_id' => $this->school->id]);
    $college = User::factory()->create(['education_level_id' => $this->college->id]);
    CourseEnrollment::create(['user_id' => $college->id, 'course_id' => $schoolCourse->id]);
    foreach ([[$school, $collegeCourse], [$college, $schoolCourse]] as [$student, $denied]) {
        expect($shared->accessibleTo($student))->toBeTrue()->and($denied->accessibleTo($student))->toBeFalse();
        $this->actingAs($student)->get('/courses/'.$denied->slug)->assertForbidden();
        $this->get('/courses')->assertInertia(fn (Assert $page) => $page->has('courses', 2)->etc());
    }
    $lesson = $schoolCourse->lessons()->firstOrFail();
    $this->actingAs($college)->get('/code-lab/'.$lesson->id)->assertForbidden();
    $this->postJson('/code-lab/'.$lesson->id.'/quiz', ['answers' => []])->assertForbidden();
    $this->actingAs($this->teacher)->post('/courses/college-only/assign', ['user_id' => $school->id])->assertSessionHasErrors('user_id');
    $this->get('/courses/html-css')->assertOk();
    $this->get('/students/education-review')->assertInertia(fn (Assert $page) => $page->has('mismatches', 1));
    $this->assertDatabaseHas('course_enrollments', ['user_id' => $college->id, 'course_id' => $schoolCourse->id]);
    $this->actingAs($school)->get('/students/education-review')->assertForbidden();
});

test('education edits require acknowledgement and preserve credentials and learning data', function () {
    $this->seed(CurriculumSeeder::class);
    $student = User::factory()->create(['education_level_id' => $this->school->id]);
    $lesson = Lesson::firstOrFail();
    $enrollment = CourseEnrollment::create(['user_id' => $student->id, 'course_id' => $lesson->course_id]);
    $progress = StudentLessonProgress::create(['user_id' => $student->id, 'lesson_id' => $lesson->id, 'status' => 'completed']);
    $submission = Submission::create(['user_id' => $student->id, 'lesson_id' => $lesson->id, 'version' => 1, 'html_code' => '<h1>Keep this</h1>', 'submitted_at' => now()]);
    $snapshots = [$enrollment->fresh()->getRawOriginal(), $progress->fresh()->getRawOriginal(), $submission->fresh()->getRawOriginal(), $student->password];
    $data = ['education_level_id' => $this->college->id, 'grade_level' => '1st Year', 'section' => 'A', 'program' => 'BSIT'];
    $this->actingAs($this->teacher)->put('/students/'.$student->id.'/education', $data)->assertSessionHasErrors('confirm_level_change');
    $this->put('/students/'.$student->id.'/education', $data + ['confirm_level_change' => true])->assertSessionHasNoErrors();
    expect($student->fresh()->education_level_id)->toBe($this->college->id)->and($student->fresh()->program)->toBe('BSIT');
    expect([$enrollment->fresh()->getRawOriginal(), $progress->fresh()->getRawOriginal(), $submission->fresh()->getRawOriginal(), $student->fresh()->password])->toBe($snapshots);
    $this->actingAs($student)->put('/students/'.$student->id.'/education', $data)->assertForbidden();
});

test('mixed imports require per-row education and reject missing invalid or conflicting values', function () {
    $csv = "name,username,education_level,grade_level,program,section\nSchool,school.import,HIGH SCHOOL,Grade 11,,A\nCollege,college.import,college,1st Year,BSIT,A\nMissing,missing.import,,Grade 11,,A\nInvalid,invalid.import,university,1st Year,,A\nConflict,conflict.import,College,Grade 11,,A";
    $this->actingAs($this->teacher);
    $response = $this->post('/students/import/preview', ['file' => UploadedFile::fake()->createWithContent('students.csv', $csv)])->assertSessionHasNoErrors();
    $url = $response->headers->get('Location');
    $this->get($url)->assertInertia(fn (Assert $page) => $page->where('summary.ready', 2)->where('summary.invalid', 3)->where('rows.0.educationLevel', 'High School')->where('rows.1.educationLevel', 'College'));
    $this->post($url)->assertSessionHasNoErrors();
    expect(User::where('username', 'school.import')->firstOrFail()->education_level_id)->toBe($this->school->id)
        ->and(User::where('username', 'college.import')->firstOrFail()->education_level_id)->toBe($this->college->id);
    $this->assertDatabaseMissing('users', ['username' => 'missing.import']);
    $this->post('/students/import/preview', ['file' => UploadedFile::fake()->createWithContent('students.csv', "name,username,grade_level,section\nNo Level,no.level,Grade 11,A")])->assertSessionHasErrors('file');
});

<?php

use App\Models\ActivityLog;
use App\Models\CaseStudy;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\EducationLevel;
use App\Models\LearningEvidence;
use App\Models\Lesson;
use App\Models\LessonDemonstration;
use App\Models\StudentLessonProgress;
use App\Models\Submission;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\MicrosoftWordCourseSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->withoutVite();
    Storage::fake('local');
    $this->seed(MicrosoftWordCourseSeeder::class);
    $this->course = Course::where('slug', 'microsoft-word-application')->firstOrFail();
    $this->student = User::factory()->create(['education_level_id' => EducationLevel::where('slug', 'high-school')->value('id')]);
    $this->teacher = User::factory()->create(['role' => 'teacher']);
    $this->lesson = $this->course->lessons()->firstOrFail();
});

test('adding Word never blocks HTML case studies or overwrites legacy seed identities', function () {
    $this->seed(DatabaseSeeder::class);
    expect(CaseStudy::where('course_id', $this->course->id)->count())->toBe(3)->and(CaseStudy::whereNull('course_id')->count())->toBe(5);
    $html = Course::where('slug', 'html-css')->firstOrFail();
    foreach ($html->lessons as $lesson) {
        StudentLessonProgress::create(['user_id' => $this->student->id, 'lesson_id' => $lesson->id, 'status' => 'completed']);
    }
    $this->actingAs($this->student)->get('/case-studies')->assertInertia(fn (Assert $page) => $page->where('lessonsComplete', true)->has('caseStudies', 8)->where('caseStudies.0.unlocked', true));
    $this->get('/case-studies/'.CaseStudy::whereNull('course_id')->orderBy('number')->first()->id)->assertOk();
    expect($this->student->lessonProgress()->whereHas('lesson', fn ($q) => $q->where('course_id', $this->course->id))->count())->toBe(0);
});
function wordFile(string $extension = 'docx'): UploadedFile
{
    $path = tempnam(sys_get_temp_dir(), 'word-evidence-');
    $zip = new ZipArchive;
    $zip->open($path, ZipArchive::OVERWRITE);
    $types = ['docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml', 'dotx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml', 'docm' => 'application/vnd.ms-word.document.macroEnabled.main+xml', 'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml'];
    $zip->addFromString('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="'.$types[$extension].'"/></Types>');
    $zip->addFromString($extension === 'xlsx' ? 'xl/workbook.xml' : 'word/document.xml', '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Practice document</w:t></w:r></w:p></w:body></w:document>');
    if ($extension === 'docm') {
        $zip->addFromString('word/vbaProject.bin', 'INERT TEST BYTES; NEVER EXECUTE');
    }
    $zip->close();
    $bytes = file_get_contents($path);
    unlink($path);

    return UploadedFile::fake()->createWithContent('exercise.'.$extension, $bytes);
}
function wordCheckpoints($test, Lesson $lesson): void
{
    $test->get('/code-lab/'.$lesson->id)->assertOk();
    $test->postJson('/application-lessons/'.$lesson->id.'/viewed')->assertOk();
    foreach ($lesson->demonstrations as $demo) {
        $test->postJson('/application-lessons/'.$lesson->id.'/viewed', ['demonstration_id' => $demo->id])->assertOk();
    }
}
function wordSubmission(int $version = 1, array $extra = []): array
{
    return $extra + ['version' => $version, 'submit' => true, 'notes' => 'I reopened the saved document and checked each requirement.', 'evidence_ids' => [], 'mastery' => [true, true, true, true], 'files' => [wordFile()]];
}

test('Word curriculum is high school only with exact structure and idempotent authored material', function () {
    expect($this->course->educationLevel->slug)->toBe('high-school')->and($this->course->modules()->count())->toBe(3)->and($this->course->lessons()->count())->toBe(15);
    foreach ($this->course->modules as $module) {
        expect($this->course->lessons()->where('course_module_id', $module->id)->count())->toBe(5)->and(CaseStudy::where('course_module_id', $module->id)->count())->toBe(1);
    }
    foreach ($this->course->lessons as $lesson) {
        expect($lesson->application_content['exercise']['tasks'])->not->toBeEmpty()->and($lesson->quiz)->toHaveCount(5)->and($lesson->demonstrations)->not->toBeEmpty();
    }
    expect($this->course->lessons()->where('position', 2)->first()->demonstrations)->toHaveCount(8)->and($this->course->lessons()->where('position', 3)->first()->demonstrations)->toHaveCount(7);
    $counts = [Course::count(), Lesson::count(), CaseStudy::count(), LessonDemonstration::count()];
    $this->lesson->update(['title' => 'Teacher edited title']);
    $this->seed(MicrosoftWordCourseSeeder::class);
    expect([Course::count(), Lesson::count(), CaseStudy::count(), LessonDemonstration::count()])->toBe($counts)->and($this->lesson->fresh()->title)->toBe('Teacher edited title');
});
test('course access is enforced for lesson quiz file and assignment URLs', function () {
    $college = User::factory()->create(['education_level_id' => EducationLevel::firstOrCreate(['slug' => 'college'], ['name' => 'College'])->id]);
    $this->actingAs($college)->get('/courses/'.$this->course->slug)->assertForbidden();
    $this->get('/code-lab/'.$this->lesson->id)->assertForbidden();
    $this->postJson('/code-lab/'.$this->lesson->id.'/quiz', ['answers' => [0, 0, 0, 0, 0]])->assertForbidden();
    $this->get('/application-lessons/'.$this->lesson->id)->assertForbidden();
    $this->actingAs($this->teacher)->post('/courses/'.$this->course->slug.'/assign', ['user_id' => $college->id])->assertSessionHasErrors('user_id');
    $this->actingAs($this->student)->get('/courses/'.$this->course->slug)->assertOk()->assertInertia(fn (Assert $page) => $page->has('applicationCases', 3)->where('applicationCases.0.unlocked', false));
});
test('opening a lesson starts progress but never marks it complete or leaks quiz answers', function () {
    $this->actingAs($this->student)->get('/dashboard')->assertInertia(fn (Assert $page) => $page->where('nextLesson.number', 1)->where('nextLesson.title', $this->lesson->title));
    $this->actingAs($this->student)->get('/code-lab/'.$this->lesson->id)->assertInertia(fn (Assert $page) => $page->component('code-lab/application')->missing('subject.quiz.0.answer')->where('status', 'in_progress')->has('demonstrations', 1));
    expect($this->student->lessonProgress()->first()->status)->toBe('in_progress')->and(CourseEnrollment::where('user_id', $this->student->id)->first()->started_at)->not->toBeNull();
    $this->get('/code-lab/'.$this->course->lessons()->where('position', 2)->value('id'))->assertForbidden();
});
test('normal mastery requires content demos quiz and a submitted document before unlocking', function () {
    $this->actingAs($this->student)->get('/code-lab/'.$this->lesson->id)->assertOk();
    $this->post('/application-lessons/'.$this->lesson->id.'/save', wordSubmission(), ['Accept' => 'application/json'])->assertUnprocessable();
    wordCheckpoints($this, $this->lesson);
    $result = $this->post('/application-lessons/'.$this->lesson->id.'/save', wordSubmission(), ['Accept' => 'application/json'])->assertOk()->assertJsonPath('status', 'submitted');
    expect($this->student->lessonProgress()->first()->status)->toBe('submitted');
    $this->postJson('/code-lab/'.$this->lesson->id.'/quiz', ['answers' => array_column($this->lesson->quiz, 'answer')])->assertOk()->assertJsonPath('score', 5);
    expect($this->student->lessonProgress()->first()->status)->toBe('completed')->and(Submission::where('lesson_id', $this->lesson->id)->first()->application_workspace['files'])->toHaveCount(1);
    $this->get('/code-lab/'.$this->course->lessons()->where('position', 2)->value('id'))->assertOk();
    expect(ActivityLog::where('event', 'demonstration_viewed')->exists())->toBeTrue();
});
test('quiz alone and generic HTML submission cannot bypass document mastery', function () {
    $this->actingAs($this->student);
    wordCheckpoints($this, $this->lesson);
    $this->postJson('/code-lab/'.$this->lesson->id.'/quiz', ['answers' => array_column($this->lesson->quiz, 'answer')])->assertOk();
    expect($this->student->lessonProgress()->first()->status)->toBe('in_progress');
    $this->postJson('/code-lab/'.$this->lesson->id.'/submit', ['html_code' => 'bypass', 'version' => 1])->assertStatus(422);
    $this->post('/application-lessons/'.$this->lesson->id.'/save', wordSubmission(1, ['mastery' => [true, true, true, false]]), ['Accept' => 'application/json'])->assertUnprocessable();
    $this->post('/application-lessons/'.$this->lesson->id.'/save', wordSubmission(), ['Accept' => 'application/json'])->assertOk()->assertJsonPath('status', 'completed');
});
test('private Office uploads reject executable names malformed packages and unauthorized downloads', function () {
    $this->actingAs($this->student);
    wordCheckpoints($this, $this->lesson);
    foreach ([UploadedFile::fake()->createWithContent('fake.docx', '<?php echo 1;'), UploadedFile::fake()->createWithContent('run.exe', 'MZ')] as $file) {
        $this->post('/application-lessons/'.$this->lesson->id.'/save', wordSubmission(1, ['files' => [$file]]), ['Accept' => 'application/json'])->assertUnprocessable();
    }
    $result = $this->post('/application-lessons/'.$this->lesson->id.'/save', wordSubmission(), ['Accept' => 'application/json'])->assertOk();
    $file = LearningEvidence::firstOrFail();
    Storage::disk('local')->assertExists($file->path);
    $this->get('/application-evidence/'.$file->id)->assertOk()->assertHeader('Content-Type', 'application/octet-stream');
    $other = User::factory()->create();
    $this->actingAs($other)->get('/application-evidence/'.$file->id)->assertForbidden();
    $this->actingAs($this->teacher)->get('/application-evidence/'.$file->id)->assertOk();
    $this->actingAs($other)->get('/code-lab/'.$this->lesson->id);
    $this->post('/application-lessons/'.$this->lesson->id.'/save', wordSubmission(1, ['files' => [], 'evidence_ids' => [$file->id]]), ['Accept' => 'application/json'])->assertUnprocessable();
});
test('stale saves and edited submissions cannot silently overwrite a newer draft', function () {
    $this->actingAs($this->student);
    wordCheckpoints($this, $this->lesson);
    $this->post('/application-lessons/'.$this->lesson->id.'/save', wordSubmission(), ['Accept' => 'application/json'])->assertOk();
    $submission = Submission::where('lesson_id', $this->lesson->id)->firstOrFail();
    $this->post('/application-lessons/'.$this->lesson->id.'/save', wordSubmission(), ['Accept' => 'application/json'])->assertUnprocessable();
    $this->post('/application-lessons/'.$this->lesson->id.'/save', wordSubmission(2, ['submit' => false, 'files' => []]), ['Accept' => 'application/json'])->assertOk();
    $this->actingAs($this->teacher)->post('/submissions/'.$submission->id.'/review', ['status' => 'completed'])->assertUnprocessable();
});
test('case studies unlock after their own five lessons and reuse grading and immutable document snapshots', function () {
    $case = CaseStudy::where('course_id', $this->course->id)->orderBy('number')->firstOrFail();
    $this->actingAs($this->student)->get('/application-case-studies/'.$case->id)->assertForbidden();
    foreach ($this->course->lessons()->where('course_module_id', $case->course_module_id)->get() as $lesson) {
        StudentLessonProgress::create(['user_id' => $this->student->id, 'lesson_id' => $lesson->id, 'status' => 'completed']);
    }
    $this->get('/application-case-studies/'.$case->id)->assertOk();
    $this->postJson('/application-case-studies/'.$case->id.'/viewed')->assertOk();
    $this->post('/application-case-studies/'.$case->id.'/save', wordSubmission(), ['Accept' => 'application/json'])->assertOk()->assertJsonPath('status', 'submitted');
    $submission = Submission::where('case_study_id', $case->id)->firstOrFail();
    $this->actingAs($this->teacher)->get('/submissions/'.$submission->id)->assertInertia(fn (Assert $page) => $page->component('submissions/application')->has('submission.application_workspace.files', 1));
    $this->post('/submissions/'.$submission->id.'/review', ['status' => 'completed'])->assertSessionHasErrors('rubric_scores');
    $this->post('/submissions/'.$submission->id.'/review', ['status' => 'completed', 'rubric_scores' => $case->rubric])->assertSessionHasNoErrors();
    expect(DB::table('case_study_progress')->where('case_study_id', $case->id)->value('status'))->toBe('completed')->and($submission->fresh()->rubric_scores)->toBe($case->rubric);
});
test('teachers can add edit reorder draft demonstrations and preview without creating learner progress', function () {
    $this->actingAs($this->teacher)->get('/application-lessons/'.$this->lesson->id)->assertInertia(fn (Assert $page) => $page->where('isTeacher', true));
    expect(StudentLessonProgress::count())->toBe(0);
    $demo = ['title' => 'Teacher Bold Demonstration', 'description' => 'Select text, click Bold, inspect the result.', 'media_type' => 'interactive_demo', 'steps' => [['caption' => 'Select the title', 'command' => 'Select', 'effect' => 'selected'], ['caption' => 'Inspect thicker title text', 'command' => 'Bold', 'effect' => 'bold']], 'display_order' => 2, 'is_required' => false, 'status' => 'draft'];
    $this->post('/application-lessons/'.$this->lesson->id.'/demonstrations', $demo)->assertRedirect()->assertSessionHasNoErrors();
    $record = LessonDemonstration::where('title', 'Teacher Bold Demonstration')->where('lesson_id', $this->lesson->id)->firstOrFail();
    $this->post('/application-lessons/'.$this->lesson->id.'/demonstrations/'.$record->id, array_merge($demo, ['display_order' => 1, 'status' => 'published']))->assertSessionHasNoErrors();
    expect($record->fresh()->display_order)->toBe(1)->and($record->fresh()->status)->toBe('published');
    $this->actingAs($this->student)->post('/application-lessons/'.$this->lesson->id.'/demonstrations', $demo)->assertForbidden();
    $manual = $this->course->lessons()->where('position', 3)->firstOrFail();
    StudentLessonProgress::create(['user_id' => $this->student->id, 'lesson_id' => $manual->id, 'is_manually_unlocked' => true, 'status' => 'not_started']);
    $this->actingAs($this->student)->get('/code-lab/'.$manual->id)->assertOk()->assertInertia(fn (Assert $page) => $page->where('isTeacher', false)->where('status', 'in_progress'));
    expect(CourseEnrollment::where('user_id', $this->student->id)->first()->started_at)->not->toBeNull();
});
test('macro documents are stored as inert evidence without execution', function () {
    $lesson = $this->course->lessons()->where('position', 15)->firstOrFail();
    $this->course->update(['sequential_gating' => false]);
    $this->actingAs($this->student);
    wordCheckpoints($this, $lesson);
    $this->post('/application-lessons/'.$lesson->id.'/save', wordSubmission(1, ['files' => [wordFile('docm')]]), ['Accept' => 'application/json'])->assertOk();
    $file = LearningEvidence::firstOrFail();
    expect(Storage::disk('local')->get($file->path))->toContain('INERT TEST BYTES; NEVER EXECUTE');
    $this->get('/application-evidence/'.$file->id)->assertOk()->assertHeader('X-Content-Type-Options', 'nosniff');
});

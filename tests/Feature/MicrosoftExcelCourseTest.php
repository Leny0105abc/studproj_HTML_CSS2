<?php

use App\Models\ActivityLog;
use App\Models\CaseStudy;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\EducationLevel;
use App\Models\LearningEvidence;
use App\Models\StudentLessonProgress;
use App\Models\Submission;
use App\Models\User;
use Database\Seeders\MicrosoftExcelCourseSeeder;
use Database\Seeders\MicrosoftWordCourseSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->withoutVite();
    Storage::fake('local');
    $this->seed(MicrosoftWordCourseSeeder::class);
    $this->seed(MicrosoftExcelCourseSeeder::class);
    $this->excel = Course::where('slug', 'microsoft-excel-application')->firstOrFail();
    $this->learner = User::factory()->create(['education_level_id' => $this->excel->education_level_id]);
    $this->instructor = User::factory()->create(['role' => 'teacher']);
    $this->firstExcel = $this->excel->lessons()->firstOrFail();
});

function excelWorkbook(string $extension = 'xlsx', bool $disguisedMacro = false, bool $unsafePath = false): UploadedFile
{
    $path = tempnam(sys_get_temp_dir(), 'excel-evidence-');
    $zip = new ZipArchive;
    $zip->open($path, ZipArchive::OVERWRITE);
    $type = $extension === 'xlsm' ? 'application/vnd.ms-excel.sheet.macroEnabled.main+xml' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml';
    $zip->addFromString('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/xl/workbook.xml" ContentType="'.$type.'"/></Types>');
    $zip->addFromString('xl/workbook.xml', '<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheets><sheet name="Student Info" sheetId="1"/></sheets></workbook>');
    if ($extension === 'xlsm' || $disguisedMacro) {
        $zip->addFromString('xl/vbaProject.bin', 'INERT MACRO TEST BYTES; NEVER EXECUTE OR READ AS VBA');
    }
    if ($unsafePath) {
        $zip->addFromString('../unsafe.txt', 'invalid package entry');
    }
    $zip->close();
    $bytes = file_get_contents($path);
    unlink($path);

    return UploadedFile::fake()->createWithContent('practice.'.$extension, $bytes);
}
function excelCheckpoints($test, $lesson): void
{
    $test->get('/code-lab/'.$lesson->id)->assertOk();
    $test->postJson('/application-lessons/'.$lesson->id.'/viewed')->assertOk();
    foreach ($lesson->demonstrations as $demo) {
        $test->postJson('/application-lessons/'.$lesson->id.'/viewed', ['demonstration_id' => $demo->id])->assertOk();
    }
}
function excelPayload(array $overrides = []): array
{
    return $overrides + ['version' => 1, 'submit' => true, 'notes' => 'I reopened my workbook and checked formulas, values and readable headings.', 'evidence_ids' => [], 'mastery' => [true, true, true, true], 'files' => [excelWorkbook()]];
}

test('Excel has the complete exact curriculum and reseeding preserves Word and existing student records', function () {
    $word = Course::where('slug', 'microsoft-word-application')->firstOrFail();
    $wordBefore = $word->lessons->toArray();
    $this->actingAs($this->learner)->get('/code-lab/'.$this->firstExcel->id)->assertOk();
    $progressBefore = StudentLessonProgress::first()->toArray();
    $ids = $this->excel->lessons->pluck('id')->all();
    $this->seed(MicrosoftExcelCourseSeeder::class);
    expect($this->excel->educationLevel->slug)->toBe('high-school')
        ->and($this->excel->is_published)->toBeTrue()
        ->and($this->excel->editor_type)->toBe('office-excel')
        ->and($this->excel->modules->pluck('name')->all())->toBe(['Beginner', 'Intermediate', 'Advanced'])
        ->and($this->excel->lessons()->pluck('id')->all())->toBe($ids)
        ->and($this->excel->lessons)->toHaveCount(15)
        ->and($word->fresh()->lessons->toArray())->toBe($wordBefore)
        ->and(StudentLessonProgress::first()->toArray())->toBe($progressBefore);
    foreach ($this->excel->modules as $module) {
        expect($this->excel->lessons()->where('course_module_id', $module->id)->count())->toBe(5)
            ->and(CaseStudy::where('course_module_id', $module->id)->count())->toBe(1);
    }
    foreach ($this->excel->lessons as $index => $lesson) {
        expect($lesson->position)->toBe($index + 1)->and($lesson->application_content['exercise']['tasks'])->not->toBeEmpty()
            ->and($lesson->quiz)->toHaveCount(5)->and($lesson->demonstrations)->toHaveCount(1)
            ->and($lesson->isApplication())->toBeTrue();
    }
    expect($this->excel->lessons->last()->title)->toBe('Introduction to Excel Automation and Macros');
    $this->get('/code-lab/'.$word->lessons->first()->id)->assertInertia(fn (Assert $page) => $page->component('code-lab/application')->where('subject.application_content.application', 'Microsoft Word'));
});

test('High School sees Excel and College is denied every workbook route until explicitly shared', function () {
    $collegeLevel = EducationLevel::firstOrCreate(['slug' => 'college'], ['name' => 'College']);
    $college = User::factory()->create(['education_level_id' => $collegeLevel->id]);
    $this->actingAs($this->learner)->get('/courses')->assertInertia(fn (Assert $page) => $page->where('courses', fn ($courses) => collect($courses)->contains('slug', 'microsoft-excel-application')));
    $this->actingAs($college)->get('/courses')->assertInertia(fn (Assert $page) => $page->where('courses', fn ($courses) => ! collect($courses)->contains('slug', 'microsoft-excel-application')));
    foreach (['/courses/microsoft-excel-application', '/code-lab/'.$this->firstExcel->id, '/application-lessons/'.$this->firstExcel->id] as $url) {
        $this->get($url)->assertForbidden();
    }
    $this->postJson('/application-lessons/'.$this->firstExcel->id.'/viewed')->assertForbidden();
    $this->post('/application-lessons/'.$this->firstExcel->id.'/save', excelPayload(), ['Accept' => 'application/json'])->assertForbidden();
    $this->postJson('/code-lab/'.$this->firstExcel->id.'/quiz', ['answers' => [0, 0, 0, 0, 0]])->assertForbidden();
    $case = CaseStudy::where('course_id', $this->excel->id)->firstOrFail();
    $this->get('/application-case-studies/'.$case->id)->assertForbidden();
    $this->excel->educationLevels()->attach($collegeLevel);
    $this->get('/courses/microsoft-excel-application')->assertOk();
});

test('workbook submission quiz gating teacher score feedback and private evidence complete the Excel exercise flow', function () {
    $next = $this->excel->lessons()->where('position', 2)->firstOrFail();
    $this->actingAs($this->learner);
    $this->get('/code-lab/'.$next->id)->assertForbidden();
    excelCheckpoints($this, $this->firstExcel);
    $this->post('/application-lessons/'.$this->firstExcel->id.'/save', excelPayload(['mastery' => [true, true, true, false]]), ['Accept' => 'application/json'])->assertUnprocessable();
    $this->post('/application-lessons/'.$this->firstExcel->id.'/save', excelPayload(), ['Accept' => 'application/json'])->assertOk()->assertJsonPath('status', 'submitted');
    $this->get('/code-lab/'.$next->id)->assertForbidden();
    $this->postJson('/code-lab/'.$this->firstExcel->id.'/quiz', ['answers' => array_column($this->firstExcel->quiz, 'answer')])->assertOk()->assertJsonPath('score', 5);
    $this->get('/code-lab/'.$next->id)->assertOk();
    $evidence = LearningEvidence::firstOrFail();
    Storage::disk('local')->assertExists($evidence->path);
    $this->get('/application-evidence/'.$evidence->id)->assertOk()->assertHeader('Content-Type', 'application/octet-stream');
    $submission = Submission::where('lesson_id', $this->firstExcel->id)->firstOrFail();
    $this->actingAs($this->instructor)->post('/submissions/'.$submission->id.'/review', ['status' => 'completed', 'exercise_score' => 95, 'comment' => 'Good work. Recheck your input labels.'])->assertSessionHasNoErrors();
    expect($submission->fresh()->rubric_scores['Practical Exercise'])->toEqual(95)
        ->and($submission->feedback()->first()->comment)->toContain('Good work')
        ->and(CourseEnrollment::where('user_id', $this->learner->id)->first()->started_at)->not->toBeNull()
        ->and(ActivityLog::where('event', 'exercise_graded')->exists())->toBeTrue();
    $this->actingAs($this->learner)->get('/code-lab/'.$this->firstExcel->id)->assertInertia(fn (Assert $page) => $page->where('latestSubmission.rubric_scores.Practical Exercise', 95));
    $other = User::factory()->create(['education_level_id' => $this->learner->education_level_id]);
    $this->actingAs($other)->get('/application-evidence/'.$evidence->id)->assertForbidden();
    $this->get('/code-lab/'.$this->firstExcel->id)->assertOk();
    $this->post('/application-lessons/'.$this->firstExcel->id.'/save', excelPayload(['files' => [], 'evidence_ids' => [$evidence->id]]), ['Accept' => 'application/json'])->assertUnprocessable();
});

test('Excel rejects disguised executables macro content in xlsx invalid packages and traversal entries', function () {
    $this->actingAs($this->learner);
    excelCheckpoints($this, $this->firstExcel);
    foreach ([UploadedFile::fake()->createWithContent('run.exe', 'MZ'), UploadedFile::fake()->createWithContent('fake.xlsx', '<?php echo 1;'), excelWorkbook('xlsx', true), excelWorkbook('xlsx', false, true), excelWorkbook('xlsm')] as $file) {
        $this->post('/application-lessons/'.$this->firstExcel->id.'/save', excelPayload(['files' => [$file]]), ['Accept' => 'application/json'])->assertUnprocessable();
    }
    expect(LearningEvidence::count())->toBe(0)->and(Submission::count())->toBe(0);
});

test('xlsm macro evidence is retained byte for byte and downloaded as inert content', function () {
    $this->excel->update(['sequential_gating' => false]);
    $lesson = $this->excel->lessons()->where('position', 15)->firstOrFail();
    $file = excelWorkbook('xlsm');
    $hash = hash_file('sha256', $file->getRealPath());
    $this->actingAs($this->learner);
    excelCheckpoints($this, $lesson);
    $this->post('/application-lessons/'.$lesson->id.'/save', excelPayload(['files' => [$file]]), ['Accept' => 'application/json'])->assertOk();
    $evidence = LearningEvidence::firstOrFail();
    expect(hash('sha256', Storage::disk('local')->get($evidence->path)))->toBe($hash);
    $this->get('/application-evidence/'.$evidence->id)->assertOk()->assertHeader('Content-Type', 'application/octet-stream')->assertHeader('X-Content-Type-Options', 'nosniff');
});

test('each Excel case unlocks after its own five lessons and supports the eight-category rubric', function ($modulePosition) {
    $module = $this->excel->modules()->where('position', $modulePosition)->firstOrFail();
    $case = CaseStudy::where('course_module_id', $module->id)->firstOrFail();
    $this->actingAs($this->learner)->get('/application-case-studies/'.$case->id)->assertForbidden();
    foreach ($this->excel->lessons()->where('course_module_id', $module->id)->get() as $lesson) {
        StudentLessonProgress::create(['user_id' => $this->learner->id, 'lesson_id' => $lesson->id, 'status' => 'completed']);
    }
    $this->get('/application-case-studies/'.$case->id)->assertOk();
    $this->postJson('/application-case-studies/'.$case->id.'/viewed')->assertOk();
    $this->post('/application-case-studies/'.$case->id.'/save', excelPayload(), ['Accept' => 'application/json'])->assertOk()->assertJsonPath('status', 'submitted');
    $submission = Submission::where('case_study_id', $case->id)->firstOrFail();
    expect($case->rubric)->toHaveCount(8)->and(array_sum($case->rubric))->toBe(100);
    $this->actingAs($this->instructor)->get('/submissions/'.$submission->id)->assertInertia(fn (Assert $page) => $page->component('submissions/application'));
    $this->post('/submissions/'.$submission->id.'/review', ['status' => 'completed'])->assertSessionHasErrors('rubric_scores');
    $this->post('/submissions/'.$submission->id.'/review', ['status' => 'completed', 'rubric_scores' => $case->rubric, 'comment' => 'Workbook checked and summary verified.'])->assertSessionHasNoErrors();
    expect(DB::table('case_study_progress')->where('case_study_id', $case->id)->value('status'))->toBe('completed');
})->with([1, 2, 3]);

test('teachers can edit Excel content modules media and the eight-category case rubric and control gates', function () {
    $this->actingAs($this->instructor)->get('/application-lessons/'.$this->firstExcel->id)->assertOk()->assertInertia(fn (Assert $page) => $page->where('isTeacher', true)->where('subject.application_content.application', 'Microsoft Excel'));
    expect(StudentLessonProgress::count())->toBe(0);
    $lessonData = $this->firstExcel->toArray();
    $lessonData['title'] = 'Excel Introduction for Our Class';
    $this->put('/lessons/'.$this->firstExcel->id, $lessonData)->assertSessionHasNoErrors();
    expect($this->firstExcel->fresh()->title)->toBe('Excel Introduction for Our Class');
    $case = CaseStudy::where('course_id', $this->excel->id)->firstOrFail();
    $this->put('/application-case-studies/'.$case->id, ['title' => $case->title, 'scenario' => $case->scenario, 'application_content' => $case->application_content, 'rubric' => $case->rubric])->assertSessionHasNoErrors();
    $demo = $this->firstExcel->demonstrations->first();
    $this->post('/application-lessons/'.$this->firstExcel->id.'/demonstrations/'.$demo->id, array_merge($demo->toArray(), ['description' => 'Our class workbook walkthrough.']))->assertSessionHasNoErrors();
    expect($demo->fresh()->description)->toBe('Our class workbook walkthrough.');
    $this->put('/courses/'.$this->excel->slug, ['name' => $this->excel->name, 'description' => $this->excel->description, 'is_published' => true, 'sequential_gating' => false])->assertSessionHasNoErrors();
    $last = $this->excel->lessons()->where('position', 15)->firstOrFail();
    $this->actingAs($this->learner)->get('/code-lab/'.$last->id)->assertOk();
    $this->get('/application-case-studies/'.$case->id)->assertOk();
});

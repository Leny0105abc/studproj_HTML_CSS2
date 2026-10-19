<?php

use App\Models\CourseEnrollment;
use App\Models\EducationLevel;
use App\Models\Lesson;
use App\Models\StudentLessonProgress;
use App\Models\Submission;
use App\Models\User;
use App\Services\StudentAccountService;
use Database\Seeders\CurriculumSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

function importCsv(string $contents, string $name = 'students.csv'): UploadedFile
{
    return UploadedFile::fake()->createWithContent($name, $contents);
}

function importPreview($test, string $contents, array $extra = []): string
{
    // Existing fixtures now explicitly state the required education level.
    $input = fopen('php://temp', 'w+');
    fwrite($input, $contents);
    rewind($input);
    $headers = fgetcsv($input, null, ',', '"', '');
    $hasLevel = in_array('education_level', $headers, true);
    if (! $hasLevel) {
        $output = fopen('php://temp', 'w+');
        fputcsv($output, [...$headers, 'education_level'], escape: '');
        $level = isset($extra['education_level_id']) ? EducationLevel::findOrFail($extra['education_level_id'])->name : 'High School';
        while (($values = fgetcsv($input, null, ',', '"', '')) !== false) {
            if (! array_filter($values, fn ($v) => trim((string) $v) !== '')) {
                continue;
            }
            fputcsv($output, [...$values, $level], escape: '');
        }
        rewind($output);
        $contents = stream_get_contents($output);
        fclose($output);
    }
    fclose($input);
    $response = $test->post('/students/import/preview', ['file' => importCsv($contents)] + $extra)->assertSessionHasNoErrors();

    return $response->headers->get('Location');
}

function importSheetFile(Spreadsheet $book): UploadedFile
{
    $path = tempnam(sys_get_temp_dir(), 'student-import-test');
    try {
        (new Xlsx($book))->save($path);

        return UploadedFile::fake()->createWithContent('students.xlsx', file_get_contents($path));
    } finally {
        unlink($path);
        $book->disconnectWorksheets();
    }
}

beforeEach(function () {
    $this->withoutVite();
    $this->teacher = User::factory()->create(['role' => 'teacher']);
});

test('only teachers may open import and access every import endpoint', function () {
    $this->get('/students/import')->assertRedirect('/login');
    $student = User::factory()->create(['role' => 'student', 'must_change_password' => false]);
    $this->actingAs($student);
    foreach (['/students/import', '/students/import/template', '/students/import/'.Str::uuid(), '/students/import/'.Str::uuid().'/errors'] as $url) {
        $this->get($url)->assertForbidden();
    }
    $this->post('/students/import/preview')->assertForbidden();
    $this->post('/students/import/'.Str::uuid())->assertForbidden();
    $this->actingAs($this->teacher)->get('/students/import')->assertOk()->assertInertia(fn (Assert $page) => $page->component('students/import'));
});

test('template is a real xlsx workbook and can be uploaded for preview', function () {
    $this->actingAs($this->teacher);
    $template = $this->get('/students/import/template')->assertOk()->assertDownload('student_import_template.xlsx')->streamedContent();
    $this->post('/students/import/preview', ['file' => UploadedFile::fake()->createWithContent('students.xlsx', $template)])->assertSessionHasNoErrors()->assertRedirect();
    expect(User::where('username', 'alex.example')->exists())->toBeFalse();
});

test('csv preview handles aliases BOM quoted commas blank rows and never exposes passwords', function () {
    $this->actingAs($this->teacher);
    $url = importPreview($this, "\xEF\xBB\xBFStudent Name,Username,Grade Level,Section,Email,Password,Status,role\n\n\"Example, Alex\", ALEX.EXAMPLE ,Grade 11,Sample,,PreviewSecret123!,active,teacher\n,,,,,,,\n");
    $response = $this->get($url)->assertOk()->assertInertia(fn (Assert $page) => $page
        ->where('summary.total', 1)->where('summary.ready', 1)->where('rows.0.name', 'Example, Alex')
        ->where('rows.0.username', 'alex.example')->missing('rows.0.password')->where('credentials', []));
    expect($response->getContent())->not->toContain('PreviewSecret123!');
    expect(User::count())->toBe(1);
});

test('valid csv rows import with hashed passwords class mapping and no fabricated enrollment or progress', function () {
    $this->actingAs($this->teacher);
    $level = EducationLevel::where('slug', 'college')->firstOrFail();
    $url = importPreview($this, "first_name,middle_name,last_name,username,grade_level,section,email,password,status,role\nAlex,Lee,Example,alex.example,Year 1,A,alex@example.test,StudentTemp123!,active,teacher\nSam,,Example,sam.example,Year 1,B,,,disabled,admin", ['education_level_id' => $level->id]);
    $this->post($url)->assertRedirect($url);
    $student = User::where('username', 'alex.example')->firstOrFail();
    expect($student->name)->toBe('Alex Lee Example')->and($student->role)->toBe('student')
        ->and($student->education_level_id)->toBe($level->id)->and($student->section)->toBe('A')
        ->and($student->grade_level)->toBe('Year 1')->and($student->must_change_password)->toBeTrue()
        ->and(Hash::check('StudentTemp123!', $student->password))->toBeTrue()
        ->and($student->lessonProgress()->count())->toBe(0)->and($student->submissions()->count())->toBe(0);
    $this->assertDatabaseCount('course_enrollments', 0);
    $sam = User::where('username', 'sam.example')->firstOrFail();
    expect($sam->email)->toBe('sam.example@student.local')->and($sam->status)->toBe('disabled');
    $this->get($url)->assertInertia(fn (Assert $page) => $page->where('complete', true)->where('imported', 2)->has('credentials', 2));
    $this->get($url)->assertInertia(fn (Assert $page) => $page->where('credentials', []));
    $this->post($url)->assertRedirect($url);
    expect(User::where('role', 'student')->count())->toBe(2);
    $this->get('/students?search=alex.example')->assertInertia(fn (Assert $page) => $page->component('students/index')->has('students.data', 1)->where('students.data.0.username', 'alex.example')->where('students.data.0.progress', 0));
});

test('imports accept six character passwords generate six when blank and reject shorter passwords', function () {
    $this->actingAs($this->teacher);
    $url = importPreview($this, "name,username,grade_level,section,password\nSimple Student,simple.six,10,A,flower\nGenerated Student,generated.six,10,A,\nShort Student,short.five,10,A,short\n");
    $this->get($url)->assertInertia(fn (Assert $page) => $page->where('summary.ready', 2)->where('summary.invalid', 1));
    $this->post($url)->assertSessionHasNoErrors();
    expect(Hash::check('flower', User::where('username', 'simple.six')->firstOrFail()->password))->toBeTrue();
    $this->assertDatabaseMissing('users', ['username' => 'short.five']);
    $this->get($url)->assertInertia(fn (Assert $page) => $page->where('credentials', function ($credentials) {
        $generated = collect($credentials)->firstWhere('username', 'generated.six');

        return preg_match('/^[abcdefghjkmnpqrstuvwxyz23456789]{6}$/', $generated['password']) === 1
            && Hash::check($generated['password'], User::where('username', 'generated.six')->firstOrFail()->password);
    }));
});

test('duplicates including case and generated email collisions are skipped and existing records stay unchanged', function () {
    $existing = User::factory()->create(['username' => 'existing', 'email' => 'taken@example.test']);
    $snapshot = $existing->fresh()->getRawOriginal();
    $this->actingAs($this->teacher);
    $url = importPreview($this, "name,username,grade_level,section,email\nExisting,EXISTING,11,A,\nEmail,email.duplicate,11,A,TAKEN@example.test\nReady,ready,11,A,\nRepeated,READY,11,A,\nGenerated,other,11,A,ready@student.local\n");
    $this->get($url)->assertInertia(fn (Assert $page) => $page->where('summary.ready', 1)->where('summary.duplicates', 4));
    $this->post($url)->assertSessionHasNoErrors();
    expect($existing->fresh()->getRawOriginal())->toBe($snapshot)->and(User::where('username', 'ready')->exists())->toBeTrue();
});

test('invalid rows are excluded with clear errors and report is safe for spreadsheet apps', function () {
    $this->actingAs($this->teacher);
    $url = importPreview($this, "name,username,grade_level,section,email,password,status\n=HYPERLINK(1),bad user,11,,bad-email,short,inactive\n,missing.name,11,A,,,active\nGood,good,11,A,,,active");
    $this->get($url)->assertInertia(fn (Assert $page) => $page->where('summary.invalid', 2)->where('summary.ready', 1)->where('rows.0.state', 'Invalid'));
    $csv = $this->get($url.'/errors')->assertDownload('student_import_errors.csv')->streamedContent();
    expect($csv)->toContain("'=HYPERLINK(1)")->not->toContain('short')->not->toContain('password,status');
    $this->post($url);
    expect(User::where('role', 'student')->pluck('username')->all())->toBe(['good']);
});

test('headers file size extension MIME encoding and row limits are validated', function () {
    $this->actingAs($this->teacher);
    foreach (["name,grade_level,section\nAlex,11,A", "name,username,section\nAlex,alex,A", "name,username,grade_level\nAlex,alex,11", "username,grade_level,section\nalex,11,A", "name,username,Username,grade_level,section\nAlex,a,b,11,A"] as $contents) {
        $this->post('/students/import/preview', ['file' => importCsv($contents)])->assertSessionHasErrors('file');
    }
    $this->post('/students/import/preview', ['file' => importCsv('invalid', 'students.php')])->assertSessionHasErrors('file');
    $this->post('/students/import/preview', ['file' => UploadedFile::fake()->image('students.csv')])->assertSessionHasErrors('file');
    $this->post('/students/import/preview', ['file' => UploadedFile::fake()->create('students.csv', 5121, 'text/csv')])->assertSessionHasErrors('file');
    config(['student-import.max_rows' => 1]);
    $this->post('/students/import/preview', ['file' => importCsv("name,username,grade_level,section\nAlex,alex,11,A\nSam,sam,11,A")])->assertSessionHasErrors('file');
});

test('xlsx uses raw values and rejects formulas macros and expanded archive limits', function () {
    $this->actingAs($this->teacher);
    $book = new Spreadsheet;
    $book->getActiveSheet()->fromArray([['name', 'username', 'grade_level', 'section', 'education_level'], ['Alex Example', 'alex', '11', 'A', 'High School']]);
    $this->post('/students/import/preview', ['file' => importSheetFile($book)])->assertSessionHasNoErrors()->assertRedirect();
    $book = new Spreadsheet;
    $book->getActiveSheet()->fromArray([['name', 'username', 'grade_level', 'section'], ['=1+1', 'alex', '11', 'A']]);
    $this->post('/students/import/preview', ['file' => importSheetFile($book)])->assertSessionHasErrors('file');
    $book = new Spreadsheet;
    $book->getActiveSheet()->fromArray([['name', 'username', 'grade_level', 'section'], ['Alex', 'alex', '11', 'A']]);
    $macroFile = importSheetFile($book);
    $macroPath = tempnam(sys_get_temp_dir(), 'student-import-macro');
    file_put_contents($macroPath, file_get_contents($macroFile->getRealPath()));
    $zip = new ZipArchive;
    $zip->open($macroPath);
    $zip->addFromString('xl/vbaProject.bin', 'untrusted macro placeholder');
    $zip->close();
    $macroUpload = UploadedFile::fake()->createWithContent('students.xlsx', file_get_contents($macroPath));
    unlink($macroPath);
    $this->post('/students/import/preview', ['file' => $macroUpload])->assertSessionHasErrors('file');
    $book = new Spreadsheet;
    $book->getActiveSheet()->fromArray([['name', 'username', 'grade_level', 'section'], ['Alex', 'alex', '11', 'A']]);
    config(['student-import.max_expanded_bytes' => 10]);
    $this->post('/students/import/preview', ['file' => importSheetFile($book)])->assertSessionHasErrors('file');
});

test('tokens require ownership expire and final confirmation revalidates new duplicates', function () {
    $this->actingAs($this->teacher);
    $url = importPreview($this, "name,username,grade_level,section\nAlex,alex,11,A");
    $otherTeacher = User::factory()->create(['role' => 'teacher']);
    $this->actingAs($otherTeacher)->get($url)->assertForbidden();
    $this->get($url.'/errors')->assertForbidden();
    $this->post($url)->assertForbidden();
    $this->actingAs($this->teacher);
    User::factory()->create(['username' => 'alex']);
    $this->post($url)->assertSessionHasNoErrors();
    $this->get($url)->assertInertia(fn (Assert $page) => $page->where('imported', 0)->where('summary.duplicates', 1));
    $expired = importPreview($this, "name,username,grade_level,section\nSam,sam,11,A");
    $this->travel(61)->minutes();
    $this->get($expired)->assertStatus(410);
});

test('unexpected account failure rolls back the entire batch without exposing passwords', function () {
    $this->actingAs($this->teacher);
    $url = importPreview($this, "name,username,grade_level,section\nAlex,alex,11,A\nSam,sam,11,A");
    $actual = new StudentAccountService;
    $calls = 0;
    $this->mock(StudentAccountService::class, function ($mock) use ($actual, &$calls) {
        $mock->shouldReceive('create')->twice()->andReturnUsing(function ($data) use ($actual, &$calls) {
            if (++$calls === 2) {
                throw new RuntimeException('Sensitive exception');
            }

            return $actual->create($data);
        });
    });
    $this->post($url)->assertSessionHasErrors('import');
    expect(User::where('role', 'student')->count())->toBe(0);
});

test('manual Add Student still uses original generated credentials and class behavior', function () {
    $this->actingAs($this->teacher)->from('/students')->post('/students', ['first_name' => 'Manual', 'last_name' => 'Example', 'grade_level' => 'Grade 11', 'section' => 'Ruby', 'education_level_id' => EducationLevel::where('slug', 'high-school')->value('id')])->assertRedirect('/students')->assertSessionHas('credentials.username', 'manual.example');
    $user = User::where('username', 'manual.example')->firstOrFail();
    expect($user->role)->toBe('student')->and($user->must_change_password)->toBeTrue()->and($user->education_level_id)->toBe(EducationLevel::where('slug', 'high-school')->value('id'))->and($user->section)->toBe('Ruby');
    $this->assertDatabaseCount('course_enrollments', 0);
});

test('split name rows require both names while combined names remain supported', function () {
    $this->actingAs($this->teacher);
    $url = importPreview($this, "first_name,last_name,username,grade_level,section\nAlex,,alex,11,A\n,Example,sam,11,A\nAlex,Example,valid.name,11,A");
    $this->get($url)->assertInertia(fn (Assert $page) => $page->where('summary.ready', 1)->where('summary.invalid', 2));
});

test('optional LRN follows existing identity uniqueness without colliding on blank values', function () {
    User::factory()->create(['lrn' => '001234']);
    $this->actingAs($this->teacher);
    $url = importPreview($this, "name,username,grade_level,section,lrn\nExisting ID,existing.id,11,A,001234\nFirst ID,first.id,11,A,005678\nRepeated ID,repeated.id,11,A,005678\nBlank One,blank.one,11,A,\nBlank Two,blank.two,11,A,");
    $this->get($url)->assertInertia(fn (Assert $page) => $page->where('summary.ready', 3)->where('summary.duplicates', 2));
    $this->post($url)->assertSessionHasNoErrors();
    expect(User::where('username', 'first.id')->firstOrFail()->lrn)->toBe('005678')
        ->and(User::where('username', 'blank.one')->firstOrFail()->lrn)->toBeNull()
        ->and(User::where('username', 'blank.two')->firstOrFail()->lrn)->toBeNull();
});

test('import preserves existing enrollment progress submissions and credentials', function () {
    $this->seed(CurriculumSeeder::class);
    $student = User::factory()->create(['username' => 'existing.student']);
    $lesson = Lesson::firstOrFail();
    CourseEnrollment::create(['user_id' => $student->id, 'course_id' => $lesson->course_id]);
    StudentLessonProgress::create(['user_id' => $student->id, 'lesson_id' => $lesson->id, 'status' => 'completed']);
    Submission::create(['user_id' => $student->id, 'lesson_id' => $lesson->id, 'version' => 1, 'html_code' => '<h1>Keep my work</h1>', 'submitted_at' => now()]);
    $snapshot = [];
    foreach (['users', 'course_enrollments', 'student_lesson_progress', 'submissions'] as $table) {
        $snapshot[$table] = DB::table($table)->orderBy('id')->get()->toJson();
    }
    $this->actingAs($this->teacher);
    $url = importPreview($this, "name,username,grade_level,section\nDuplicate,existing.student,11,A\nNew Student,new.student,11,A");
    $this->post($url)->assertSessionHasNoErrors();
    foreach ($snapshot as $table => $data) {
        $query = DB::table($table)->orderBy('id');
        if ($table === 'users') {
            $query->where('username', '!=', 'new.student');
        }
        expect($query->get()->toJson())->toBe($data);
    }
});

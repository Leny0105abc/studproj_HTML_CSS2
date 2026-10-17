<?php

use App\Models\Course;
use App\Models\EducationLevel;
use App\Models\StudentLessonProgress;
use App\Models\User;
use Database\Seeders\CsharpCourseSeeder;
use Illuminate\Http\Client\Request as ClientRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    $this->seed(CsharpCourseSeeder::class);
    config(['csharp.enabled' => false, 'csharp.verified' => false, 'csharp.version' => '10.0']);
    Http::preventStrayRequests();
    $this->csLesson = Course::where('slug', 'csharp-programming')->firstOrFail()->lessons()->firstOrFail();
    $this->csStudent = User::factory()->create(['role' => 'student', 'education_level_id' => EducationLevel::where('slug', 'college')->value('id')]);
    $this->csPayload = ['code' => "  {$this->csLesson->example_csharp}\n", 'input' => "  Student\n19\n"];
});

test('csharp runner remains unavailable until a service is explicitly verified without modifying progress', function () {
    Http::fake();
    $this->actingAs($this->csStudent)->postJson("/code-lab/{$this->csLesson->id}/csharp/run", $this->csPayload)->assertStatus(503)->assertJsonPath('message', 'C# execution is unavailable. Connect a verified isolated .NET service. You can still read lessons, save source, and submit work.');
    config(['csharp.enabled' => true, 'csharp.url' => 'https://dotnet-sandbox.example/run', 'csharp.token' => 'private-test-token']);
    $this->postJson("/code-lab/{$this->csLesson->id}/csharp/run", $this->csPayload)->assertStatus(503);
    Http::assertNothingSent();
    expect(StudentLessonProgress::count())->toBe(0);
});

test('csharp execution enforces education gating source limits and desktop mode before sending code', function () {
    Http::fake();
    $school = User::factory()->create(['role' => 'student', 'education_level_id' => EducationLevel::firstOrCreate(['slug' => 'high-school'], ['name' => 'High School'])->id]);
    $this->actingAs($school)->postJson("/code-lab/{$this->csLesson->id}/csharp/run", $this->csPayload)->assertForbidden();
    $locked = $this->csLesson->course->lessons()->skip(1)->firstOrFail();
    $this->actingAs($this->csStudent)->postJson("/code-lab/{$locked->id}/csharp/run", $this->csPayload)->assertForbidden();
    $this->postJson("/code-lab/{$this->csLesson->id}/csharp/run", ['code' => str_repeat('a', 200001)])->assertUnprocessable();
    $this->postJson("/code-lab/{$this->csLesson->id}/csharp/run", ['code' => 'class Program {}', 'input' => str_repeat('x', 20001)])->assertUnprocessable();
    $this->postJson("/code-lab/{$this->csLesson->id}/csharp/run", ['code' => ''])->assertUnprocessable();
    $desktop = $this->csLesson->course->lessons()->where('csharp_mode', 'external')->firstOrFail();
    StudentLessonProgress::create(['user_id' => $this->csStudent->id, 'lesson_id' => $desktop->id, 'status' => 'not_started', 'is_manually_unlocked' => true]);
    $this->postJson("/code-lab/{$desktop->id}/csharp/run", $this->csPayload)->assertUnprocessable();
    Http::assertNothingSent();
});

test('csharp adapter sends exact source stdin isolation limits and practice database contract without returning secrets', function () {
    config(['csharp.enabled' => true, 'csharp.verified' => true, 'csharp.url' => 'https://dotnet-sandbox.example/run', 'csharp.token' => 'private-test-token']);
    Http::fake(['dotnet-sandbox.example/run' => Http::response(['output' => 'Student', 'compilation_output' => '', 'runtime_errors' => '', 'secret' => 'do-not-return'])]);
    $this->actingAs($this->csStudent)->postJson("/code-lab/{$this->csLesson->id}/csharp/run", $this->csPayload)->assertOk()->assertExactJson(['output' => 'Student', 'compilation_output' => '', 'runtime_errors' => '']);
    Http::assertSent(fn (ClientRequest $r) => $r->hasHeader('Authorization', 'Bearer private-test-token')
        && $r['source'] === $this->csPayload['code'] && $r['stdin'] === $this->csPayload['input']
        && $r['filename'] === 'Program.cs' && $r['version'] === '10.0' && $r['project_type'] === 'console'
        && $r['limits']['network'] === false && $r['limits']['filesystem'] === 'workspace-only'
        && $r['limits']['run_seconds'] === 5 && $r['limits']['memory_mib'] === 256 && $r['limits']['cleanup'] === true
        && $r['libraries'] === ['Microsoft.Data.Sqlite'] && $r['database'] === 'disposable-sqlite-workspace');
    expect(StudentLessonProgress::count())->toBe(0);
});

test('csharp endpoints reject insecure urls credentials redirects and unsupported versions', function () {
    config(['csharp.enabled' => true, 'csharp.verified' => true, 'csharp.token' => 'private-test-token']);
    Http::fake();
    $this->actingAs($this->csStudent);
    foreach (['http://dotnet-sandbox.example/run', 'https://user:secret@dotnet-sandbox.example/run', 'https://dotnet-sandbox.example/run?token=secret', 'https://dotnet-sandbox.example/run#fragment'] as $url) {
        config(['csharp.url' => $url]);
        $this->postJson("/code-lab/{$this->csLesson->id}/csharp/run", $this->csPayload)->assertStatus(503)->assertDontSee('private-test-token');
    }
    config(['csharp.url' => 'https://dotnet-sandbox.example/run', 'csharp.version' => '2.0']);
    $this->postJson("/code-lab/{$this->csLesson->id}/csharp/run", $this->csPayload)->assertStatus(503);
    Http::assertNothingSent();
    config(['csharp.version' => '10.0']);
    Http::fake(['dotnet-sandbox.example/run' => Http::response('', 302, ['Location' => 'http://127.0.0.1/internal'])]);
    $this->postJson("/code-lab/{$this->csLesson->id}/csharp/run", $this->csPayload)->assertStatus(503);
    Http::assertSentCount(1);
});

test('csharp bounds provider responses and rejects invalid types without exposing private diagnostics', function () {
    config(['csharp.enabled' => true, 'csharp.verified' => true, 'csharp.url' => 'https://dotnet-sandbox.example/run', 'csharp.token' => 'private-test-token']);
    $this->actingAs($this->csStudent);
    Http::fake(['dotnet-sandbox.example/run' => Http::sequence()
        ->push(['output' => [], 'compilation_output' => '', 'runtime_errors' => ''])
        ->push(['wrong' => 'private-test-token'])
        ->push(['output' => str_repeat('x', 270000), 'compilation_output' => '', 'runtime_errors' => ''])
        ->push(['output' => str_repeat('x', 70000), 'compilation_output' => '', 'runtime_errors' => ''])
        ->push('private-test-token internal diagnostics', 500)]);
    for ($i = 0; $i < 3; $i++) {
        $this->postJson("/code-lab/{$this->csLesson->id}/csharp/run", $this->csPayload)->assertStatus(503)->assertDontSee('private-test-token');
    }
    $response = $this->postJson("/code-lab/{$this->csLesson->id}/csharp/run", $this->csPayload)->assertOk();
    expect(strlen($response->json('output')))->toBe(65536);
    $this->postJson("/code-lab/{$this->csLesson->id}/csharp/run", $this->csPayload)->assertStatus(503)->assertDontSee('private-test-token');
});

test('csharp serializes runs for each student and transport failures remain generic', function () {
    $lock = Cache::lock('csharp-run:'.$this->csStudent->id, 40);
    $lock->get();
    try {
        $this->actingAs($this->csStudent)->postJson("/code-lab/{$this->csLesson->id}/csharp/run", $this->csPayload)->assertStatus(429);
    } finally {
        $lock->release();
    }
    config(['csharp.enabled' => true, 'csharp.verified' => true, 'csharp.url' => 'https://dotnet-sandbox.example/run', 'csharp.token' => 'private-test-token']);
    Http::fake(['dotnet-sandbox.example/run' => Http::failedConnection()]);
    $this->postJson("/code-lab/{$this->csLesson->id}/csharp/run", $this->csPayload)->assertStatus(503)->assertDontSee('private-test-token');
});

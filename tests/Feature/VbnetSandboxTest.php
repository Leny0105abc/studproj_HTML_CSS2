<?php

use App\Models\Course;
use App\Models\EducationLevel;
use App\Models\StudentLessonProgress;
use App\Models\User;
use Database\Seeders\VbnetCourseSeeder;
use Illuminate\Http\Client\Request as ClientRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    $this->seed(VbnetCourseSeeder::class);
    config(['vbnet.enabled' => false, 'vbnet.verified' => false, 'vbnet.version' => '10.0']);
    Http::preventStrayRequests();
    $this->vbLesson = Course::where('slug', 'visual-basic-dotnet')->firstOrFail()->lessons()->firstOrFail();
    $this->vbStudent = User::factory()->create(['role' => 'student', 'education_level_id' => EducationLevel::where('slug', 'college')->value('id')]);
    $this->vbPayload = ['code' => "  {$this->vbLesson->example_vbnet}\n", 'input' => "  Student\n19\n"];
});

test('vbnet runner remains unavailable until a service is explicitly verified without modifying progress', function () {
    Http::fake();
    $this->actingAs($this->vbStudent)->postJson("/code-lab/{$this->vbLesson->id}/vbnet/run", $this->vbPayload)->assertStatus(503)->assertJsonPath('message', 'VB.NET execution is unavailable. Connect a verified isolated .NET service. You can still read lessons, save source, and submit work.');
    config(['vbnet.enabled' => true, 'vbnet.url' => 'https://dotnet-sandbox.example/run', 'vbnet.token' => 'private-test-token']);
    $this->postJson("/code-lab/{$this->vbLesson->id}/vbnet/run", $this->vbPayload)->assertStatus(503);
    Http::assertNothingSent();
    expect(StudentLessonProgress::count())->toBe(0);
});

test('vbnet execution enforces education gating source limits and desktop mode before sending code', function () {
    Http::fake();
    $school = User::factory()->create(['role' => 'student', 'education_level_id' => EducationLevel::firstOrCreate(['slug' => 'high-school'], ['name' => 'High School'])->id]);
    $this->actingAs($school)->postJson("/code-lab/{$this->vbLesson->id}/vbnet/run", $this->vbPayload)->assertForbidden();
    $locked = $this->vbLesson->course->lessons()->skip(1)->firstOrFail();
    $this->actingAs($this->vbStudent)->postJson("/code-lab/{$locked->id}/vbnet/run", $this->vbPayload)->assertForbidden();
    $this->postJson("/code-lab/{$this->vbLesson->id}/vbnet/run", ['code' => str_repeat('a', 200001)])->assertUnprocessable();
    $this->postJson("/code-lab/{$this->vbLesson->id}/vbnet/run", ['code' => 'Module Program', 'input' => str_repeat('x', 20001)])->assertUnprocessable();
    $this->postJson("/code-lab/{$this->vbLesson->id}/vbnet/run", ['code' => ''])->assertUnprocessable();
    $desktop = $this->vbLesson->course->lessons()->where('vbnet_mode', 'winforms')->firstOrFail();
    StudentLessonProgress::create(['user_id' => $this->vbStudent->id, 'lesson_id' => $desktop->id, 'status' => 'not_started', 'is_manually_unlocked' => true]);
    $this->postJson("/code-lab/{$desktop->id}/vbnet/run", $this->vbPayload)->assertUnprocessable();
    Http::assertNothingSent();
});

test('vbnet adapter sends exact source stdin isolation limits and practice database contract without returning secrets', function () {
    config(['vbnet.enabled' => true, 'vbnet.verified' => true, 'vbnet.url' => 'https://dotnet-sandbox.example/run', 'vbnet.token' => 'private-test-token']);
    Http::fake(['dotnet-sandbox.example/run' => Http::response(['output' => 'Student', 'compilation_output' => '', 'runtime_errors' => '', 'secret' => 'do-not-return'])]);
    $this->actingAs($this->vbStudent)->postJson("/code-lab/{$this->vbLesson->id}/vbnet/run", $this->vbPayload)->assertOk()->assertExactJson(['output' => 'Student', 'compilation_output' => '', 'runtime_errors' => '']);
    Http::assertSent(fn (ClientRequest $r) => $r->hasHeader('Authorization', 'Bearer private-test-token')
        && $r['source'] === $this->vbPayload['code'] && $r['stdin'] === $this->vbPayload['input']
        && $r['filename'] === 'Program.vb' && $r['version'] === '10.0' && $r['project_type'] === 'console'
        && $r['limits']['network'] === false && $r['limits']['filesystem'] === 'workspace-only'
        && $r['limits']['run_seconds'] === 5 && $r['limits']['memory_mib'] === 256 && $r['limits']['cleanup'] === true
        && $r['libraries'] === ['Microsoft.Data.Sqlite'] && $r['database'] === 'disposable-sqlite-workspace');
    expect(StudentLessonProgress::count())->toBe(0);
});

test('vbnet endpoints reject insecure urls credentials redirects and unsupported versions', function () {
    config(['vbnet.enabled' => true, 'vbnet.verified' => true, 'vbnet.token' => 'private-test-token']);
    Http::fake();
    $this->actingAs($this->vbStudent);
    foreach (['http://dotnet-sandbox.example/run', 'https://user:secret@dotnet-sandbox.example/run', 'https://dotnet-sandbox.example/run?token=secret', 'https://dotnet-sandbox.example/run#fragment'] as $url) {
        config(['vbnet.url' => $url]);
        $this->postJson("/code-lab/{$this->vbLesson->id}/vbnet/run", $this->vbPayload)->assertStatus(503)->assertDontSee('private-test-token');
    }
    config(['vbnet.url' => 'https://dotnet-sandbox.example/run', 'vbnet.version' => '2.0']);
    $this->postJson("/code-lab/{$this->vbLesson->id}/vbnet/run", $this->vbPayload)->assertStatus(503);
    Http::assertNothingSent();
    config(['vbnet.version' => '10.0']);
    Http::fake(['dotnet-sandbox.example/run' => Http::response('', 302, ['Location' => 'http://127.0.0.1/internal'])]);
    $this->postJson("/code-lab/{$this->vbLesson->id}/vbnet/run", $this->vbPayload)->assertStatus(503);
    Http::assertSentCount(1);
});

test('vbnet bounds provider responses and rejects invalid types without exposing private diagnostics', function () {
    config(['vbnet.enabled' => true, 'vbnet.verified' => true, 'vbnet.url' => 'https://dotnet-sandbox.example/run', 'vbnet.token' => 'private-test-token']);
    $this->actingAs($this->vbStudent);
    Http::fake(['dotnet-sandbox.example/run' => Http::sequence()
        ->push(['output' => [], 'compilation_output' => '', 'runtime_errors' => ''])
        ->push(['wrong' => 'private-test-token'])
        ->push(['output' => str_repeat('x', 270000), 'compilation_output' => '', 'runtime_errors' => ''])
        ->push(['output' => str_repeat('x', 70000), 'compilation_output' => '', 'runtime_errors' => ''])
        ->push('private-test-token internal diagnostics', 500)]);
    for ($i = 0; $i < 3; $i++) {
        $this->postJson("/code-lab/{$this->vbLesson->id}/vbnet/run", $this->vbPayload)->assertStatus(503)->assertDontSee('private-test-token');
    }
    $response = $this->postJson("/code-lab/{$this->vbLesson->id}/vbnet/run", $this->vbPayload)->assertOk();
    expect(strlen($response->json('output')))->toBe(65536);
    $this->postJson("/code-lab/{$this->vbLesson->id}/vbnet/run", $this->vbPayload)->assertStatus(503)->assertDontSee('private-test-token');
});

test('vbnet serializes runs for each student and transport failures remain generic', function () {
    $lock = Cache::lock('vbnet-run:'.$this->vbStudent->id, 40);
    $lock->get();
    try {
        $this->actingAs($this->vbStudent)->postJson("/code-lab/{$this->vbLesson->id}/vbnet/run", $this->vbPayload)->assertStatus(429);
    } finally {
        $lock->release();
    }
    config(['vbnet.enabled' => true, 'vbnet.verified' => true, 'vbnet.url' => 'https://dotnet-sandbox.example/run', 'vbnet.token' => 'private-test-token']);
    Http::fake(['dotnet-sandbox.example/run' => Http::failedConnection()]);
    $this->postJson("/code-lab/{$this->vbLesson->id}/vbnet/run", $this->vbPayload)->assertStatus(503)->assertDontSee('private-test-token');
});

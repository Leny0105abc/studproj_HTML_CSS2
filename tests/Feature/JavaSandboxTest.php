<?php

use App\Models\Course;
use App\Models\EducationLevel;
use App\Models\StudentLessonProgress;
use App\Models\User;
use Database\Seeders\JavaCourseSeeder;
use Illuminate\Http\Client\Request as ClientRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    $this->seed(JavaCourseSeeder::class);
    config(['java.enabled' => false, 'java.provider' => 'generic']);
    Http::preventStrayRequests();
    $this->javaLesson = Course::where('slug', 'java-programming')->firstOrFail()->lessons()->firstOrFail();
    $this->javaStudent = User::factory()->create(['role' => 'student', 'education_level_id' => EducationLevel::where('slug', 'college')->value('id')]);
    $this->javaPayload = ['code' => $this->javaLesson->example_java, 'input' => "Maria Santos\n19\n95.5\n"];
});

test('java execution fails closed when its service is not connected without modifying progress', function () {
    Http::fake();
    $this->actingAs($this->javaStudent)->postJson("/code-lab/{$this->javaLesson->id}/java/run", $this->javaPayload)
        ->assertStatus(503)->assertJsonPath('message', 'Java execution is not available yet. The isolated sandbox service needs to be connected. You can still read lessons, save code, and submit work.');
    Http::assertNothingSent();
    expect(StudentLessonProgress::count())->toBe(0);
});

test('java run enforces access gating source limits and language before contacting a provider', function () {
    Http::fake();
    $school = User::factory()->create(['role' => 'student', 'education_level_id' => EducationLevel::firstOrCreate(['slug' => 'high-school'], ['name' => 'High School'])->id]);
    $this->actingAs($school)->postJson("/code-lab/{$this->javaLesson->id}/java/run", $this->javaPayload)->assertForbidden();
    $second = $this->javaLesson->course->lessons()->skip(1)->firstOrFail();
    $this->actingAs($this->javaStudent)->postJson("/code-lab/{$second->id}/java/run", $this->javaPayload)->assertForbidden();
    $this->postJson("/code-lab/{$this->javaLesson->id}/java/run", ['code' => str_repeat('a', 200001)])->assertUnprocessable();
    $this->postJson("/code-lab/{$this->javaLesson->id}/java/run", ['code' => 'public class Main {}', 'input' => str_repeat('x', 20001)])->assertUnprocessable();
    $this->postJson("/code-lab/{$this->javaLesson->id}/java/run", ['code' => ''])->assertUnprocessable();
    Http::assertNothingSent();
});

test('java adapter transmits source stdin and limits server-side and never exposes provider secrets', function () {
    config(['java.enabled' => true, 'java.url' => 'https://java-sandbox.example/run', 'java.token' => 'private-test-service-token']);
    Http::fake(['java-sandbox.example/run' => Http::response(['output' => 'Maria Santos', 'compilation_output' => '', 'runtime_errors' => '', 'secret' => 'must-not-return'])]);
    $this->actingAs($this->javaStudent)->postJson("/code-lab/{$this->javaLesson->id}/java/run", $this->javaPayload)
        ->assertOk()->assertExactJson(['output' => 'Maria Santos', 'compilation_output' => '', 'runtime_errors' => '']);
    Http::assertSent(fn (ClientRequest $request) => $request->url() === 'https://java-sandbox.example/run'
        && $request->hasHeader('Authorization', 'Bearer private-test-service-token')
        && $request['source'] === $this->javaPayload['code'] && $request['stdin'] === $this->javaPayload['input']
        && $request['filename'] === 'Main.java' && $request['version'] === '17'
        && $request['limits']['threads'] === 64 && $request['limits']['network'] === false
        && $request['limits']['run_seconds'] === 5 && $request['libraries'] === ['h2', 'gson']);
    expect(StudentLessonProgress::count())->toBe(0);
});

test('java adapter rejects insecure endpoints invalid responses and oversized output', function () {
    config(['java.enabled' => true, 'java.url' => 'http://java-sandbox.example/run', 'java.token' => 'test-secret']);
    Http::fake();
    $this->actingAs($this->javaStudent)->postJson("/code-lab/{$this->javaLesson->id}/java/run", $this->javaPayload)->assertStatus(503);
    Http::assertNothingSent();
    config(['java.url' => 'https://java-sandbox.example/run']);
    Http::fake(['java-sandbox.example/run' => Http::response(['wrong' => 'test-secret'])]);
    $this->postJson("/code-lab/{$this->javaLesson->id}/java/run", $this->javaPayload)->assertStatus(503)->assertDontSee('test-secret');
    Http::fake(['java-sandbox.example/run' => Http::response(['output' => str_repeat('x', 270000), 'compilation_output' => '', 'runtime_errors' => ''])]);
    $this->postJson("/code-lab/{$this->javaLesson->id}/java/run", $this->javaPayload)->assertStatus(503);
});

test('java concurrent requests are bounded and provider failures do not leak credentials', function () {
    $lock = Cache::lock('java-run:'.$this->javaStudent->id, 40);
    $lock->get();
    $this->actingAs($this->javaStudent)->postJson("/code-lab/{$this->javaLesson->id}/java/run", $this->javaPayload)->assertStatus(429);
    $lock->release();
    config(['java.enabled' => true, 'java.url' => 'https://java-sandbox.example/run', 'java.token' => 'private-test-token']);
    Http::fake(['java-sandbox.example/run' => Http::response('private-test-token internal diagnostics', 500)]);
    $this->postJson("/code-lab/{$this->javaLesson->id}/java/run", $this->javaPayload)->assertStatus(503)->assertDontSee('private-test-token');
});

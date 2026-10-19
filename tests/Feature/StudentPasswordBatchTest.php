<?php

use App\Http\Controllers\StudentPasswordBatchController;
use App\Models\Lesson;
use App\Models\StudentLessonProgress;
use App\Models\User;
use Database\Seeders\CurriculumSeeder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

beforeEach(function () {
    $this->withoutVite();
    $this->withCredentials();
    $this->teacher = User::factory()->create(['role' => 'teacher']);
    $this->selected = User::factory()->create(['name' => 'Ana Peña', 'username' => 'ana.pena', 'must_change_password' => false]);
    $this->untouched = User::factory()->create(['username' => 'not.selected', 'must_change_password' => false]);
});

test('only explicitly selected students receive new six character passwords and learning records stay unchanged', function () {
    $this->seed(CurriculumSeeder::class);
    $progress = StudentLessonProgress::create(['user_id' => $this->selected->id, 'lesson_id' => Lesson::firstOrFail()->id, 'status' => 'completed', 'completed_at' => now()]);
    $progressBefore = $progress->fresh()->getRawOriginal();
    $otherBefore = $this->untouched->fresh()->getRawOriginal();
    $teacherBefore = $this->teacher->fresh()->getRawOriginal();
    $oldPassword = $this->selected->password;
    $second = User::factory()->create(['name' => 'José Niño', 'must_change_password' => false]);
    $response = $this->actingAs($this->teacher)->postJson('/students/password-batches', ['student_ids' => [$this->selected->id, $second->id]])->assertCreated()->assertHeader('Cache-Control', 'no-store, private')->assertJsonCount(2, 'credentials');
    $this->withCookie(config('session.cookie'), $response->getCookie(config('session.cookie'))->getValue());
    foreach ($response->json('credentials') as $row) {
        expect($row['password'])->toMatch('/^[abcdefghjkmnpqrstuvwxyz23456789]{6}$/');
        $user = User::findOrFail($row['id']);
        expect(Hash::check($row['password'], $user->password))->toBeTrue()->and($user->must_change_password)->toBeTrue();
    }
    expect($this->selected->fresh()->password)->not->toBe($oldPassword)
        ->and($this->untouched->fresh()->getRawOriginal())->toBe($otherBefore)
        ->and($this->teacher->fresh()->getRawOriginal())->toBe($teacherBefore)
        ->and($progress->fresh()->getRawOriginal())->toBe($progressBefore);
    preg_match('~/password-batches/([^/]+)/pdf~', $response->json('download_url'), $matches);
    $ciphertext = Cache::get(StudentPasswordBatchController::CACHE_PREFIX.$matches[1]);
    expect($ciphertext)->toBeString()->not->toContain('"password"');
    $snapshot = json_decode(Crypt::decryptString($ciphertext), true);
    expect($snapshot['rows'])->toHaveCount(2)->and($snapshot['teacher_id'])->toBe($this->teacher->id);
    $this->getJson($response->json('download_url'))->assertOk()->assertHeader('Content-Type', 'application/pdf')->assertHeader('Cache-Control', 'no-store, private')->assertHeader('Content-Disposition', 'attachment; filename="student-passwords.pdf"')->assertSee('%PDF-', escape: false);
});

test('an empty oversized duplicate nonstudent or missing selection changes nobody', function () {
    $before = $this->selected->fresh()->getRawOriginal();
    $this->actingAs($this->teacher);
    foreach ([[], [$this->selected->id, $this->teacher->id], [$this->selected->id, $this->selected->id], [$this->selected->id, 999999], array_fill(0, 101, $this->selected->id)] as $ids) {
        $this->postJson('/students/password-batches', ['student_ids' => $ids])->assertUnprocessable();
        expect($this->selected->fresh()->getRawOriginal())->toBe($before);
    }
});

test('students and anonymous visitors cannot generate or download password lists and other teachers cannot download a batch', function () {
    $this->postJson('/students/password-batches', ['student_ids' => [$this->selected->id]])->assertUnauthorized();
    $this->actingAs($this->selected)->postJson('/students/password-batches', ['student_ids' => [$this->untouched->id]])->assertForbidden();
    $result = $this->actingAs($this->teacher)->postJson('/students/password-batches', ['student_ids' => [$this->selected->id]])->assertCreated();
    $this->withCookie(config('session.cookie'), $result->getCookie(config('session.cookie'))->getValue());
    $this->actingAs($this->selected)->getJson($result->json('download_url'))->assertForbidden();
    $otherTeacher = User::factory()->create(['role' => 'teacher']);
    $this->actingAs($otherTeacher)->getJson($result->json('download_url'))->assertForbidden();
});

test('download expires and cannot be retrieved after the teacher session changes', function () {
    $result = $this->actingAs($this->teacher)->postJson('/students/password-batches', ['student_ids' => [$this->selected->id]])->assertCreated();
    $this->withCookie(config('session.cookie'), $result->getCookie(config('session.cookie'))->getValue());
    $this->withCookie(config('session.cookie'), Str::random(40));
    $this->getJson($result->json('download_url'))->assertForbidden();
    $result = $this->postJson('/students/password-batches', ['student_ids' => [$this->selected->id]])->assertCreated();
    $this->withCookie(config('session.cookie'), $result->getCookie(config('session.cookie'))->getValue());
    $this->travel(31)->minutes();
    $this->getJson($result->json('download_url'))->assertGone();
});

test('a stale password list cannot be downloaded after a student password changes', function () {
    $result = $this->actingAs($this->teacher)->postJson('/students/password-batches', ['student_ids' => [$this->selected->id]])->assertCreated();
    $this->withCookie(config('session.cookie'), $result->getCookie(config('session.cookie'))->getValue());
    $this->selected->update(['password' => 'newone']);
    $this->getJson($result->json('download_url'))->assertStatus(409);
});

test('only selected student sessions are revoked while teacher and unselected sessions stay intact', function () {
    config(['session.driver' => 'database']);
    foreach ([$this->teacher, $this->selected, $this->untouched] as $user) {
        DB::table('sessions')->insert(['id' => 'batch-existing-'.$user->id, 'user_id' => $user->id, 'payload' => base64_encode(serialize([])), 'last_activity' => time()]);
    }
    $result = $this->actingAs($this->teacher)->postJson('/students/password-batches', ['student_ids' => [$this->selected->id]])->assertCreated();
    $this->withCookie(config('session.cookie'), $result->getCookie(config('session.cookie'))->getValue());
    $this->assertDatabaseMissing('sessions', ['id' => 'batch-existing-'.$this->selected->id]);
    $this->assertDatabaseHas('sessions', ['id' => 'batch-existing-'.$this->untouched->id]);
    $this->assertDatabaseHas('sessions', ['id' => 'batch-existing-'.$this->teacher->id]);
});

test('password changes roll back when the private export cannot be retained', function () {
    $before = $this->selected->fresh()->getRawOriginal();
    Cache::shouldReceive('put')->once()->andReturn(false);
    Cache::shouldReceive('forget')->once()->andReturn(true);
    $this->actingAs($this->teacher)->postJson('/students/password-batches', ['student_ids' => [$this->selected->id]])->assertStatus(500);
    expect($this->selected->fresh()->getRawOriginal())->toBe($before);
});

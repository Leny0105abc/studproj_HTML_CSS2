<?php

use App\Models\User;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;

beforeEach(function () {
    // Exercise real CSRF validation, which Laravel normally skips in tests.
    $this->app->bind(PreventRequestForgery::class, fn ($app) => new class($app, $app['encrypter']) extends PreventRequestForgery
    {
        protected function runningUnitTests()
        {
            return false;
        }
    });
});

test('expired inertia logout opens a fresh login page instead of an error dialog', function () {
    $this->withSession(['_token' => 'fresh-session-token'])
        ->withHeaders(['X-Inertia' => 'true'])
        ->post('/logout', ['_token' => 'expired-session-token'])
        ->assertStatus(409)
        ->assertHeader('X-Inertia-Location', route('login'));
    $this->assertGuest();
});

test('expired ordinary logout redirects to login', function () {
    $this->withSession(['_token' => 'fresh-session-token'])
        ->post('/logout', ['_token' => 'expired-session-token'])
        ->assertStatus(303)->assertRedirect(route('login'));
});

test('active logout still requires a valid csrf token', function () {
    $user = User::factory()->create();
    $this->actingAs($user)->withSession(['_token' => 'correct-token'])
        ->post('/logout', ['_token' => 'wrong-token'])->assertStatus(419);
    $this->assertAuthenticatedAs($user);
    $this->post('/logout', ['_token' => 'correct-token'])->assertRedirect(route('login'));
    $this->assertGuest();
});

test('expired login and other writes keep csrf protection', function () {
    $this->withSession(['_token' => 'correct-token'])
        ->post('/login', ['username' => 'teacher', 'password' => 'unused', '_token' => 'wrong-token'])->assertStatus(419);
    $teacher = User::factory()->create(['role' => 'teacher']);
    $this->actingAs($teacher)->post('/students', ['_token' => 'wrong-token'])->assertStatus(419);
});

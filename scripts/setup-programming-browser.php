<?php

use App\Models\Course;
use App\Models\EducationLevel;
use App\Models\User;
use Database\Seeders\CurriculumSeeder;
use Database\Seeders\IntroductionProgrammingCourseSeeder;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;

// Disposable, separate local UI database; no changes to existing accounts or student records.
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (config('database.default') !== 'sqlite' || ! str_ends_with(config('database.connections.sqlite.database'), 'programming-browser.sqlite')) {
    throw new RuntimeException('Use only the dedicated programming-browser.sqlite database.');
}
Artisan::call('migrate', ['--force' => true]);
Artisan::call('db:seed', ['--class' => CurriculumSeeder::class, '--force' => true]);
Artisan::call('db:seed', ['--class' => IntroductionProgrammingCourseSeeder::class, '--force' => true]);
$college = EducationLevel::where('slug', 'college')->firstOrFail();
foreach (['student', 'teacher'] as $role) {
    User::firstOrCreate(['username' => 'programming.'.$role], ['name' => 'Programming Test '.ucfirst($role), 'email' => 'programming.'.$role.'@example.test', 'password' => 'ProgrammingTest2026!', 'role' => $role, 'status' => 'active', 'email_verified_at' => now(), 'must_change_password' => false, 'education_level_id' => $college->id]);
}
$course = Course::where('editor_type', 'programming')->firstOrFail();
$course->update(['sequential_gating' => false]);
echo 'Isolated UI fixtures ready: '.$course->lessons()->first()->id.PHP_EOL;

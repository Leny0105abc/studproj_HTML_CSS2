<?php

use App\Models\EducationLevel;
use App\Models\User;
use Database\Seeders\CppCourseSeeder;
use Database\Seeders\CurriculumSeeder;
use Database\Seeders\JavaCourseSeeder;
use Database\Seeders\PhpCourseSeeder;
use Database\Seeders\PythonCourseSeeder;
use Database\Seeders\ScratchCourseSeeder;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;

// Isolated UI verification database. Never run against the normal application database.
require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (config('database.default') !== 'sqlite' || ! str_ends_with(config('database.connections.sqlite.database'), 'python-browser.sqlite')) {
    throw new RuntimeException('Use the dedicated python-browser.sqlite database.');
}
Artisan::call('migrate', ['--force' => true]);
Artisan::call('db:seed', ['--class' => CurriculumSeeder::class, '--force' => true]);
Artisan::call('db:seed', ['--class' => PythonCourseSeeder::class, '--force' => true]);
Artisan::call('db:seed', ['--class' => ScratchCourseSeeder::class, '--force' => true]);
Artisan::call('db:seed', ['--class' => PhpCourseSeeder::class, '--force' => true]);
Artisan::call('db:seed', ['--class' => CppCourseSeeder::class, '--force' => true]);
Artisan::call('db:seed', ['--class' => JavaCourseSeeder::class, '--force' => true]);
foreach ([
    ['browser.teacher', 'Test Teacher', 'teacher', 'college'],
    ['browser.student', 'Browser Student', 'student', 'college'],
    ['highschool.student', 'High School Test Student', 'student', 'high-school'],
    ['college.student', 'College Test Student', 'student', 'college'],
] as [$username, $name, $role, $level]) {
    $educationLevel = EducationLevel::where('slug', $level)->firstOrFail();
    User::updateOrCreate(['username' => $username], ['name' => $name, 'email' => $username.'@example.test', 'password' => 'BrowserTest2026!', 'role' => $role, 'status' => 'active', 'email_verified_at' => now(), 'must_change_password' => false, 'education_level_id' => $educationLevel->id]);
}
echo 'Isolated browser fixtures ready.'.PHP_EOL;

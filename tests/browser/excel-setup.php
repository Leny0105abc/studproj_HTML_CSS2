<?php

use App\Models\Course;
use App\Models\StudentLessonProgress;
use App\Models\User;
use Database\Seeders\MicrosoftExcelCourseSeeder;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (config('database.default') !== 'sqlite' || ! str_ends_with(config('database.connections.sqlite.database'), 'excel-browser.sqlite')) {
    throw new RuntimeException('Use only the dedicated Excel browser fixture database.');
}
Artisan::call('migrate', ['--force' => true]);
Artisan::call('db:seed', ['--class' => MicrosoftExcelCourseSeeder::class, '--force' => true]);
$course = Course::where('slug', 'microsoft-excel-application')->firstOrFail();
foreach (['student', 'teacher'] as $role) {
    User::firstOrCreate(['username' => 'excel.'.$role], ['name' => 'Excel Preview '.ucfirst($role), 'email' => 'excel.'.$role.'@example.test', 'password' => 'ExcelBrowserTest2026!', 'role' => $role, 'status' => 'active', 'must_change_password' => false, 'email_verified_at' => now(), 'education_level_id' => $course->education_level_id]);
}
$student = User::where('username', 'excel.student')->firstOrFail();
$lookup = $course->lessons()->where('position', 8)->firstOrFail();
StudentLessonProgress::firstOrCreate(['user_id' => $student->id, 'lesson_id' => $lookup->id], ['status' => 'not_started', 'is_manually_unlocked' => true]);
echo 'Disposable Excel browser fixture ready. Existing local student accounts unchanged.'.PHP_EOL;

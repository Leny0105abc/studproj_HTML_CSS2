<?php

use App\Models\Course;
use App\Models\EducationLevel;
use App\Models\StudentLessonProgress;
use App\Models\User;
use Database\Seeders\MicrosoftWordCourseSeeder;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (config('database.default') !== 'sqlite' || ! str_ends_with(config('database.connections.sqlite.database'), 'word-browser.sqlite')) {
    throw new RuntimeException('Use only the dedicated Word browser fixture database.');
}
Artisan::call('migrate', ['--force' => true]);
Artisan::call('db:seed', ['--class' => MicrosoftWordCourseSeeder::class, '--force' => true]);
$school = EducationLevel::where('slug', 'high-school')->firstOrFail();
foreach (['student', 'teacher'] as $role) {
    User::firstOrCreate(['username' => 'word.'.$role], ['name' => 'Word Preview '.ucfirst($role), 'email' => 'word.'.$role.'@example.test', 'password' => 'WordBrowserTest2026!', 'role' => $role, 'status' => 'active', 'must_change_password' => false, 'email_verified_at' => now(), 'education_level_id' => $school->id]);
}
$student = User::where('username', 'word.student')->firstOrFail();
$course = Course::where('slug', 'microsoft-word-application')->firstOrFail();
foreach ($course->lessons()->whereIn('position', [2, 3])->get() as $lesson) {
    StudentLessonProgress::firstOrCreate(['user_id' => $student->id, 'lesson_id' => $lesson->id], ['status' => 'in_progress', 'is_manually_unlocked' => true, 'started_at' => now()]);
}
echo 'Disposable Word browser fixture ready. Local production students unchanged.'.PHP_EOL;

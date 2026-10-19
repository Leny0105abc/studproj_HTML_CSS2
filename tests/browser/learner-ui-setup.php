<?php

use App\Models\Course;
use App\Models\EducationLevel;
use App\Models\StudentLessonProgress;
use App\Models\User;
use Database\Seeders\CurriculumSeeder;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (config('database.default') !== 'sqlite' || ! str_ends_with(config('database.connections.sqlite.database'), 'learner-ui.sqlite')) {
    throw new RuntimeException('Use only the dedicated learner-ui.sqlite browser fixture.');
}
Artisan::call('migrate', ['--force' => true]);
Artisan::call('db:seed', ['--class' => CurriculumSeeder::class, '--force' => true]);
$school = EducationLevel::firstOrCreate(['slug' => 'high-school'], ['name' => 'High School']);
$course = Course::where('slug', 'html-css')->firstOrFail();
$student = User::firstOrCreate(['username' => 'learner.preview'], ['name' => 'Learner Preview', 'email' => 'learner.preview@example.test', 'password' => 'PreviewOnly2026!', 'role' => 'student', 'status' => 'active', 'must_change_password' => false, 'email_verified_at' => now(), 'education_level_id' => $school->id]);
$first = $course->lessons()->firstOrFail();
StudentLessonProgress::firstOrCreate(['user_id' => $student->id, 'lesson_id' => $first->id], ['status' => 'completed', 'completed_at' => now()]);
echo 'Isolated learner preview ready; existing students unchanged.'.PHP_EOL;

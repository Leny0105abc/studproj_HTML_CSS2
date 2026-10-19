<?php

use App\Models\EducationLevel;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (config('database.default') !== 'sqlite' || ! str_ends_with(config('database.connections.sqlite.database'), 'password-batch-ui.sqlite')) {
    throw new RuntimeException('Use only the dedicated password-batch-ui.sqlite fixture.');
}
Artisan::call('migrate', ['--force' => true]);
$school = EducationLevel::firstOrCreate(['slug' => 'high-school'], ['name' => 'High School']);
User::firstOrCreate(['username' => 'batch.teacher'], ['name' => 'Batch Preview Teacher', 'email' => 'batch.teacher@example.test', 'password' => 'BatchPreview2026!', 'role' => 'teacher', 'status' => 'active', 'must_change_password' => false, 'email_verified_at' => now()]);
for ($i = 1; $i <= 24; $i++) {
    $number = str_pad((string) $i, 2, '0', STR_PAD_LEFT);
    User::firstOrCreate(['username' => 'batch.student.'.$number], ['name' => 'Batch Preview Student '.$number, 'last_name' => 'Student '.$number, 'email' => 'batch.student.'.$number.'@example.test', 'password' => 'PreviewOriginal2026!', 'role' => 'student', 'status' => 'active', 'must_change_password' => false, 'education_level_id' => $school->id, 'grade_level' => '10', 'section' => 'Preview', 'email_verified_at' => now()]);
}
echo 'Isolated password-batch preview ready. Existing accounts unchanged.'.PHP_EOL;

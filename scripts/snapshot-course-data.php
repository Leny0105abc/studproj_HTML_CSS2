<?php

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Creates an encrypted local safety snapshot without printing account data.
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
$tables = ['users', 'lessons', 'student_lesson_progress', 'submissions', 'teacher_feedback', 'case_studies', 'case_study_progress', 'activity_logs'];
foreach (['education_levels', 'courses', 'course_modules', 'course_enrollments'] as $table) {
    if (Schema::hasTable($table)) {
        $tables[] = $table;
    }
}
$snapshot = DB::transaction(function () use ($tables) {
    $snapshot = [];
    foreach ($tables as $table) {
        $snapshot[$table] = ['columns' => Schema::getColumnListing($table), 'rows' => DB::table($table)->orderBy('id')->get()->map(fn ($row) => (array) $row)->all()];
    }

    return $snapshot;
});
$directory = storage_path('app/private/course-backups');
if (! is_dir($directory)) {
    mkdir($directory, 0700, true);
}
$label = in_array($argv[1] ?? '', ['scratch', 'php', 'cpp', 'java', 'sql', 'javascript', 'vbnet', 'vba', 'apps-script', 'csharp', 'bootstrap', 'wordpress', 'tailwind', 'programming', 'education'], true) ? $argv[1] : 'python';
$path = $directory.'/before-'.$label.'-'.date('Ymd-His').'.encrypted';
file_put_contents($path, Crypt::encryptString(json_encode($snapshot, JSON_THROW_ON_ERROR)));
echo 'Encrypted snapshot: '.$path.PHP_EOL;
foreach ($snapshot as $table => $data) {
    echo $table.': '.count($data['rows']).' existing records'.PHP_EOL;
}

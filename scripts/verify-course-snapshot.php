<?php

use App\Models\Course;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
$label = in_array($argv[1] ?? '', ['scratch', 'php', 'cpp', 'java', 'sql', 'javascript', 'vbnet', 'vba', 'apps-script', 'csharp', 'bootstrap', 'wordpress', 'tailwind', 'programming', 'education'], true) ? $argv[1] : 'python';
$files = glob(storage_path('app/private/course-backups/before-'.$label.'-*.encrypted'));
sort($files);
$path = end($files);
if (! $path) {
    throw new RuntimeException('No safety snapshot found.');
}
$snapshot = json_decode(Crypt::decryptString(file_get_contents($path)), true, flags: JSON_THROW_ON_ERROR);
foreach ($snapshot as $table => $data) {
    $ids = array_column($data['rows'], 'id');
    $current = DB::table($table)->whereIn('id', $ids)->orderBy('id')->get($data['columns'])->map(fn ($row) => (array) $row)->all();
    if ($current !== $data['rows']) {
        throw new RuntimeException('Existing data changed in '.$table);
    }
    echo $table.': original data preserved ('.count($ids).' records)'.PHP_EOL;
}
$course = Course::where('slug', 'python-programming')->firstOrFail();
echo 'Python: '.$course->modules()->count().' modules, '.$course->lessons()->count().' lessons'.PHP_EOL;
if ($scratch = Course::where('slug', 'scratch-programming')->first()) {
    echo 'Scratch: '.$scratch->modules()->count().' modules, '.$scratch->lessons()->count().' lessons'.PHP_EOL;
}
foreach (['php-programming', 'cpp-programming', 'java-programming', 'sql-programming', 'javascript-programming', 'visual-basic-dotnet', 'excel-vba-application', 'google-apps-script', 'csharp-programming', 'bootstrap', 'wordpress', 'tailwind-css'] as $slug) {
    if ($course = Course::where('slug', $slug)->first()) {
        echo $course->name.': course '.$course->id.', '.$course->modules()->count().' modules, '.$course->lessons()->count().' lessons'.PHP_EOL;
    }
}
if ($label === 'programming') {
    $course = Course::where('editor_type', 'programming')->firstOrFail();
    echo $course->name.': '.$course->modules()->count().' modules, '.$course->lessons()->count().' lessons'.PHP_EOL;
    echo 'Java execution service: '.(\App\Services\JavaSandbox::available() ? 'available' : 'unavailable; source generation remains available').PHP_EOL;
}

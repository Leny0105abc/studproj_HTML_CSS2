<?php

// Fake records only: validates Unicode, long names and repeated headers over multiple pages.
use App\Services\StudentCredentialPdf;
use Illuminate\Contracts\Console\Kernel;

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
$rows = [];
for ($i = 1; $i <= 52; $i++) {
    $rows[] = ['name' => $i === 1 ? 'María José Peñaflor-Niño' : ($i === 2 ? 'Alexandra Gabriela Victoria de los Santos Mendoza - Long Name Example' : 'Practice Learner '.str_pad((string) $i, 2, '0', STR_PAD_LEFT)), 'username' => 'practice.learner.'.str_pad((string) $i, 2, '0', STR_PAD_LEFT), 'password' => 'abc234'];
}
$path = storage_path('framework/testing/student-passwords-preview.pdf');
file_put_contents($path, app(StudentCredentialPdf::class)->render($rows, '2026-10-19T12:00:00+08:00'));
echo 'Fake-record PDF preview saved for layout verification.'.PHP_EOL;

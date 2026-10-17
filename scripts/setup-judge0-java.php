<?php

use App\Services\Judge0JavaSandbox;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (! extension_loaded('zip')) {
    throw new RuntimeException('The Java testing adapter requires PHP ZipArchive.');
}
$directory = storage_path('app/private/java-provider');
if (! is_dir($directory)) {
    mkdir($directory, 0700, true);
}
foreach ([
    'h2.jar' => ['https://repo.maven.apache.org/maven2/com/h2database/h2/2.4.240/h2-2.4.240.jar', Judge0JavaSandbox::H2_HASH],
    'gson.jar' => ['https://repo.maven.apache.org/maven2/com/google/code/gson/gson/2.13.2/gson-2.13.2.jar', Judge0JavaSandbox::GSON_HASH],
] as $file => [$url, $hash]) {
    $target = $directory.'/'.$file;
    if (is_file($target) && hash_file('sha256', $target) === $hash) {
        echo $file.': verified'.PHP_EOL;

        continue;
    }
    $temporary = $target.'.'.Str::uuid().'.tmp';
    try {
        Http::withOptions(['sink' => $temporary, 'allow_redirects' => false])->connectTimeout(5)->timeout(30)->get($url)->throw();
        if (hash_file('sha256', $temporary) !== $hash) {
            throw new RuntimeException($file.' checksum mismatch.');
        }
        chmod($temporary, 0600);
        rename($temporary, $target);
        echo $file.': downloaded and verified'.PHP_EOL;
    } finally {
        if (is_file($temporary)) {
            unlink($temporary);
        }
    }
}

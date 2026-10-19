<?php

// Read-only startup checks. Never migrate, seed, change credentials or print secrets.
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

try {
    require __DIR__.'/../vendor/autoload.php';
    $app = require __DIR__.'/../bootstrap/app.php';
    $app->make(Kernel::class)->bootstrap();
    if (! config('app.key')) {
        throw new RuntimeException('APP_KEY is missing. Finish the existing Laravel installation first.');
    }
    foreach (['storage/framework/sessions', 'storage/framework/views', 'storage/logs', 'bootstrap/cache'] as $directory) {
        if (! is_dir(base_path($directory)) || ! is_writable(base_path($directory))) {
            throw new RuntimeException('The server needs write access to '.$directory.'.');
        }
    }
    try {
        DB::connection()->getPdo();
        $repository = $app['migration.repository'];
        if (! $repository->repositoryExists()) {
            throw new RuntimeException('Database tables are not installed.');
        }
        $files = $app['migrator']->getMigrationFiles(database_path('migrations'));
        if (array_diff(array_keys($files), $repository->getRan())) {
            throw new RuntimeException('Pending migrations: run php artisan migrate before starting LAN mode.');
        }
    } catch (RuntimeException $exception) {
        if (str_starts_with($exception->getMessage(), 'Pending migrations:') || $exception->getMessage() === 'Database tables are not installed.') {
            throw $exception;
        }
        throw new RuntimeException('Database connection failed. Start the configured database service (for example in Herd) and check the local database settings.');
    } catch (Throwable) {
        throw new RuntimeException('Database connection failed. Start the configured database service and check the local database settings.');
    }
    $manifest = json_decode(file_get_contents(public_path('build/manifest.json')), true, flags: JSON_THROW_ON_ERROR);
    foreach ($manifest as $entry) {
        foreach (array_merge(isset($entry['file']) ? [$entry['file']] : [], $entry['css'] ?? [], $entry['assets'] ?? []) as $asset) {
            if (! is_file(public_path('build/'.$asset))) {
                throw new RuntimeException('A built frontend asset is missing. Run npm run build, then start again.');
            }
        }
    }
    echo 'Application, database and built frontend checks passed.'.PHP_EOL;
    exit(0);
} catch (Throwable $exception) {
    // Only authored readiness messages may reach the launcher. Never dump framework exceptions.
    $message = get_class($exception) === RuntimeException::class ? $exception->getMessage() : 'Laravel could not initialize. Check storage/logs/laravel.log and finish installation before starting LAN mode.';
    fwrite(STDERR, $message.PHP_EOL);
    exit(1);
}

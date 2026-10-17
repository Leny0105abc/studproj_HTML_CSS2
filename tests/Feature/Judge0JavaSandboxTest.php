<?php

use App\Services\JavaSandbox;
use App\Services\Judge0JavaSandbox;
use Illuminate\Http\Client\Request as ClientRequest;
use Illuminate\Support\Facades\Http;

test('public Java service can never be enabled for production or the normal database', function () {
    config(['java.enabled' => true, 'java.provider' => 'judge0-public-test']);
    // PHPUnit's environment is testing, so even a forged fixture path is refused.
    config(['database.connections.sqlite.database' => storage_path('framework/testing/python-browser.sqlite')]);
    expect(JavaSandbox::available())->toBeFalse();
    Http::fake();
    expect(fn () => app(JavaSandbox::class)->run('public class Main {}', ''))->toThrow(RuntimeException::class);
    Http::assertNothingSent();
    $original = app()->environment();
    try {
        app()->instance('env', 'local');
        config(['database.default' => 'mysql']);
        expect(JavaSandbox::available())->toBeFalse();
        config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => ':memory:']);
        expect(JavaSandbox::available())->toBeFalse();
        config(['database.connections.sqlite.database' => storage_path('framework/testing/python-browser.sqlite')]);
        expect(JavaSandbox::available())->toBeTrue();
    } finally {
        app()->instance('env', $original);
    }
});

test('Judge0 receives only curated files resource limits and the exact source and stdin', function () {
    Http::preventStrayRequests();
    $token = '00000000-0000-0000-0000-000000000001';
    Http::fake([
        'ce.judge0.com/submissions?*' => Http::response(['token' => $token], 201),
        'ce.judge0.com/submissions/'.$token.'?*' => Http::response([
            'status' => ['id' => 3, 'description' => 'Accepted'],
            'stdout' => base64_encode("Hello, Java!\n"), 'stderr' => base64_encode("WARNING: A command line option has enabled the Security Manager\nWARNING: The Security Manager is deprecated and will be removed in a future release\n"), 'compile_output' => null,
        ]),
    ]);
    $source = "public class Main { public static void main(String[] args) { System.out.println(\"Hello, Java!\"); } }\n";
    $result = app(Judge0JavaSandbox::class)->run($source, "\nMaria Santos\n19\n\n");
    expect($result)->toBe(['output' => "Hello, Java!\n", 'compilation_output' => '', 'runtime_errors' => '']);
    Http::assertSent(fn (ClientRequest $r) => $r->method() === 'POST'
        && $r['language_id'] === 89 && $r['memory_limit'] === 524288
        && $r['max_processes_and_or_threads'] === 64 && $r['enable_network'] === false
        && $r['enable_per_process_and_thread_time_limit'] === false
        && base64_decode($r['stdin']) === "\nMaria Santos\n19\n\n"
        && $r['max_file_size'] === 64 && $r['cpu_time_limit'] === 5);
    $post = Http::recorded(fn (ClientRequest $r) => $r->method() === 'POST')->first()[0];
    $path = tempnam(storage_path('framework/testing'), 'java-archive-');
    try {
        file_put_contents($path, base64_decode($post['additional_files']));
        $zip = new ZipArchive;
        expect($zip->open($path))->toBeTrue();
        expect($zip->getFromName('Main.java'))->toBe($source);
        expect($zip->numFiles)->toBe(7);
        expect($zip->getFromName('run.sh'))->toContain('-Djava.security.manager=codelab.Guard');
        expect($zip->getFromName('compile.sh'))->toContain('-proc:none');
        expect($zip->getFromName('.env'))->toBeFalse();
        $zip->close();
    } finally {
        if (is_file($path)) {
            unlink($path);
        }
    }
});

test('Judge0 failures produce compilation and runtime diagnostics without arbitrary response fields', function () {
    $token = '00000000-0000-0000-0000-000000000002';
    $compiling = true;
    Http::fake(function (ClientRequest $request) use ($token, &$compiling) {
        if ($request->method() === 'POST') {
            return Http::response(['token' => $token], 201);
        }
        if ($compiling) {
            return Http::response([
                'status' => ['id' => 6, 'description' => 'Compilation Error'], 'stdout' => null, 'stderr' => null,
                'compile_output' => base64_encode('Main.java:1: error: missing semicolon'), 'secret' => 'not-returned',
            ]);
        }

        return Http::response(['status' => ['id' => 5, 'description' => 'Time Limit Exceeded'], 'stdout' => null, 'stderr' => null, 'compile_output' => null]);
    });
    $result = app(Judge0JavaSandbox::class)->run('public class Main {}', '');
    expect($result['compilation_output'])->toContain('missing semicolon');
    expect(array_keys($result))->toBe(['output', 'compilation_output', 'runtime_errors']);
    $compiling = false;
    expect(app(Judge0JavaSandbox::class)->run('public class Main {}', '')['runtime_errors'])->toBe('Time Limit Exceeded');
});

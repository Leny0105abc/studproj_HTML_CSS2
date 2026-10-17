<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class JavaSandbox
{
    public static function available(): bool
    {
        if (! config('java.enabled')) {
            return false;
        }
        if (config('java.provider') === 'judge0-public-test') {
            // Public shared service is confined to the dedicated local test DB.
            $fixture = realpath(storage_path('framework/testing/python-browser.sqlite'));

            return app()->environment('local') && config('database.default') === 'sqlite' && $fixture !== false
                && realpath((string) config('database.connections.sqlite.database')) === $fixture;
        }

        return filled(config('java.url')) && filled(config('java.token'));
    }

    public function run(string $source, string $input): array
    {
        // Fail closed. There is deliberately no local compiler/process fallback.
        if (! self::available()) {
            throw new \RuntimeException('Java execution is not available yet. The isolated sandbox service needs to be connected. You can still read lessons, save code, and submit work.');
        }
        if (config('java.provider') === 'judge0-public-test') {
            return app(Judge0JavaSandbox::class)->run($source, $input);
        }
        $url = (string) config('java.url');
        if (parse_url($url, PHP_URL_SCHEME) !== 'https' || parse_url($url, PHP_URL_USER) || parse_url($url, PHP_URL_PASS)) {
            throw new \RuntimeException('Java sandbox configuration requires a secure HTTPS endpoint.');
        }
        $response = Http::withToken(config('java.token'))->acceptJson()
            ->withOptions(['allow_redirects' => false, 'stream' => true, 'read_timeout' => 35])->connectTimeout(3)->timeout(35)
            ->post($url, [
                'language' => 'java', 'version' => '17', 'filename' => 'Main.java',
                'source' => $source, 'stdin' => $input,
                'limits' => ['compile_seconds' => 15, 'run_seconds' => 5, 'cpu_seconds' => 5,
                    'memory_mib' => 512, 'processes' => 64, 'threads' => 64,
                    'output_bytes' => 65536, 'workspace_mib' => 16, 'network' => false],
                'libraries' => ['h2', 'gson'],
            ]);
        $stream = $response->toPsrResponse()->getBody();
        $payload = '';
        while (! $stream->eof() && strlen($payload) <= 262144) {
            $chunk = $stream->read(min(16384, 262145 - strlen($payload)));
            $payload .= $chunk;
            if ($chunk === '') {
                break;
            }
        }
        if (! $response->successful() || strlen($payload) > 262144 || ! $stream->eof()) {
            throw new \RuntimeException('The isolated Java service is unavailable or returned an invalid response. Try again later.');
        }
        $data = json_decode($payload, true);
        if (! is_array($data) || ! is_string($data['output'] ?? null) ||
            ! is_string($data['compilation_output'] ?? null) || ! is_string($data['runtime_errors'] ?? null)) {
            throw new \RuntimeException('The Java sandbox response did not match the configured adapter.');
        }

        return collect($data)->only(['output', 'compilation_output', 'runtime_errors'])
            ->map(fn (string $value) => mb_strcut($value, 0, 65536, 'UTF-8'))->all();
    }
}

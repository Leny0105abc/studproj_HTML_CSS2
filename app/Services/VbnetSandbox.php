<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class VbnetSandbox
{
    public static function available(): bool
    {
        $url = (string) config('vbnet.url');

        return config('vbnet.enabled') && config('vbnet.verified') && filled(config('vbnet.token'))
            && in_array(config('vbnet.version'), ['8.0', '10.0'], true)
            && parse_url($url, PHP_URL_SCHEME) === 'https' && filled(parse_url($url, PHP_URL_HOST))
            && ! parse_url($url, PHP_URL_USER) && ! parse_url($url, PHP_URL_PASS)
            && ! parse_url($url, PHP_URL_QUERY) && ! parse_url($url, PHP_URL_FRAGMENT);
    }

    public function run(string $source, string $input): array
    {
        if (! self::available()) {
            throw new \RuntimeException('VB.NET execution is unavailable. Connect a verified isolated .NET service. You can still read lessons, save source, and submit work.');
        }
        $response = Http::withToken(config('vbnet.token'))->acceptJson()
            ->withOptions(['allow_redirects' => false, 'stream' => true, 'read_timeout' => 35])->connectTimeout(3)->timeout(35)
            ->post(config('vbnet.url'), [
                'language' => 'vbnet', 'version' => config('vbnet.version'), 'filename' => 'Program.vb',
                'source' => $source, 'stdin' => $input, 'project_type' => 'console',
                'limits' => ['compile_seconds' => 15, 'run_seconds' => 5, 'cpu_seconds' => 5,
                    'memory_mib' => 256, 'processes' => 32, 'output_bytes' => 65536,
                    'workspace_mib' => 16, 'network' => false, 'filesystem' => 'workspace-only', 'cleanup' => true],
                'libraries' => ['Microsoft.Data.Sqlite'], 'database' => 'disposable-sqlite-workspace',
            ]);
        $stream = $response->toPsrResponse()->getBody();
        $payload = '';
        try {
            while (! $stream->eof() && strlen($payload) <= 262144) {
                $chunk = $stream->read(min(16384, 262145 - strlen($payload)));
                $payload .= $chunk;
                if ($chunk === '') {
                    break;
                }
            }
            if (! $response->successful() || strlen($payload) > 262144 || ! $stream->eof()) {
                throw new \RuntimeException('The isolated VB.NET service returned an invalid response.');
            }
        } finally {
            $stream->close();
        }
        $data = json_decode($payload, true);
        foreach (['output', 'compilation_output', 'runtime_errors'] as $field) {
            if (! is_array($data) || ! is_string($data[$field] ?? null)) {
                throw new \RuntimeException('The VB.NET service response did not match its adapter.');
            }
        }

        return collect($data)->only(['output', 'compilation_output', 'runtime_errors'])
            ->map(fn (string $value) => mb_strcut($value, 0, 65536, 'UTF-8'))->all();
    }
}

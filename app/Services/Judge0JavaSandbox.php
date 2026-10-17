<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class Judge0JavaSandbox
{
    private const URL = 'https://ce.judge0.com';

    public const H2_HASH = '29b70e427cc1c40cdc376283adbb0cc62853073797bb5fe5761f81fe73d57ce0';

    public const GSON_HASH = 'dd0ce1b55a3ed2080cb70f9c655850cda86c206862310009dcb5e5c95265a5e0';

    public function run(string $source, string $input): array
    {
        $deadline = microtime(true) + 28;
        $submitted = $this->request('/submissions?base64_encoded=true&wait=false', [
            'language_id' => 89, 'additional_files' => $this->archive($source), 'stdin' => base64_encode($input),
            'cpu_time_limit' => 5, 'cpu_extra_time' => 0, 'wall_time_limit' => 6,
            'memory_limit' => 524288, 'max_processes_and_or_threads' => 64,
            'enable_per_process_and_thread_time_limit' => false, 'enable_per_process_and_thread_memory_limit' => false,
            'max_file_size' => 64, 'enable_network' => false, 'number_of_runs' => 1,
        ]);
        $token = $submitted['token'] ?? null;
        if (! is_string($token) || ! preg_match('/^[a-f0-9-]{36}$/', $token)) {
            throw new \RuntimeException('Java service did not return a valid job identifier.');
        }
        do {
            usleep(1250000);
            $result = $this->request('/submissions/'.$token.'?base64_encoded=true&fields=stdout,stderr,compile_output,status,message');
            $status = $result['status']['id'] ?? null;
            if (is_int($status) && $status > 2) {
                $output = $this->decode($result['stdout'] ?? null);
                $compiler = $this->decode($result['compile_output'] ?? null);
                $runtime = $this->decode($result['stderr'] ?? null);
                // These are fixed JDK warnings about our internal Java 17 guard.
                $runtime = preg_replace('/^WARNING: (?:A command line option has enabled the Security Manager|The Security Manager is deprecated and will be removed in a future release)\R/m', '', $runtime) ?? $runtime;
                if ($status !== 3 && $status !== 6) {
                    $runtime = trim($runtime."\n".($result['status']['description'] ?? 'Java execution failed.'));
                }

                return ['output' => mb_strcut($output, 0, 65536, 'UTF-8'), 'compilation_output' => mb_strcut($compiler, 0, 65536, 'UTF-8'), 'runtime_errors' => mb_strcut($runtime, 0, 65536, 'UTF-8')];
            }
        } while (microtime(true) < $deadline);
        throw new \RuntimeException('The shared Java service queue timed out. Try again later.');
    }

    private function request(string $path, ?array $payload = null): array
    {
        $client = Http::acceptJson()->withOptions(['allow_redirects' => false, 'stream' => true, 'read_timeout' => 8])->connectTimeout(3)->timeout(8);
        $response = $payload === null ? $client->get(self::URL.$path) : $client->post(self::URL.$path, $payload);
        $stream = $response->toPsrResponse()->getBody();
        $body = '';
        while (! $stream->eof() && strlen($body) <= 262144) {
            $chunk = $stream->read(min(16384, 262145 - strlen($body)));
            $body .= $chunk;
            if ($chunk === '') {
                break;
            }
        }
        $data = json_decode($body, true);
        if (! $response->successful() || strlen($body) > 262144 || ! $stream->eof() || ! is_array($data)) {
            Log::warning('Judge0 response rejected', ['status' => $response->status(), 'bytes' => strlen($body), 'complete' => $stream->eof(), 'json' => is_array($data)]);
            throw new \RuntimeException('The shared Java sandbox is unavailable. Try again later.');
        }

        return $data;
    }

    private function decode(mixed $value): string
    {
        if ($value === null) {
            return '';
        }
        if (! is_string($value) || strlen($value) > 100000) {
            throw new \RuntimeException('Invalid Java output.');
        }
        $decoded = base64_decode($value, true);
        if ($decoded === false) {
            throw new \RuntimeException('Invalid Java output encoding.');
        }

        return $decoded;
    }

    private function archive(string $source): string
    {
        $directory = storage_path('app/private/java-provider');
        foreach (['h2.jar' => self::H2_HASH, 'gson.jar' => self::GSON_HASH] as $file => $hash) {
            if (! is_file($directory.'/'.$file) || hash_file('sha256', $directory.'/'.$file) !== $hash) {
                throw new \RuntimeException('Java educational libraries are missing or failed integrity checks.');
            }
        }
        $path = $directory.'/'.Str::uuid().'.zip';
        $zip = new \ZipArchive;
        try {
            $handle = fopen($path, 'x');
            if (! $handle) {
                throw new \RuntimeException('Cannot prepare Java sandbox package.');
            }
            fclose($handle);
            chmod($path, 0600);
            if ($zip->open($path, \ZipArchive::OVERWRITE) !== true) {
                throw new \RuntimeException('Cannot prepare Java sandbox package.');
            }
            $zip->addFromString('Main.java', $source);
            foreach (['Guard.java', 'sandbox.policy', 'compile.sh', 'run.sh'] as $file) {
                $zip->addFile(resource_path('java-sandbox/'.$file), $file);
            }
            $zip->addFile($directory.'/h2.jar', 'h2.jar');
            $zip->addFile($directory.'/gson.jar', 'gson.jar');
            $zip->close();

            return base64_encode(file_get_contents($path));
        } finally {
            if (is_file($path)) {
                unlink($path);
            }
        }
    }
}

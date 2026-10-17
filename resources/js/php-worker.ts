import { PHP, loadPHPRuntime, setPhpIniEntries } from '@php-wasm/universal';
// The build script resolves a pinned Asyncify loader without network/process adapters.
// @ts-expect-error The generated upstream loader has no TypeScript declarations.
import * as loader from 'codelab-php-loader';

type Rules = {
    expected_output?: string;
    required_functions?: string[];
    required_constructs?: string[];
    test_cases?: {
        function: string;
        arguments: unknown[];
        expected: unknown;
    }[];
};
const LIMIT = 65536;
const decoder = new TextDecoder();
async function bounded(stream: ReadableStream<Uint8Array>) {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > LIMIT)
            throw new Error('Output exceeded 64 KiB. Reduce your output.');
        chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
    }
    return decoder.decode(bytes);
}
const b64 = (value: unknown) =>
    btoa(unescape(encodeURIComponent(JSON.stringify(value))));
const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();
// One worker handles one run and is destroyed by the frame afterward.
self.onmessage = async ({ data }) => {
    try {
        const deny = () => {
            throw new Error('Networking is disabled in the PHP lab.');
        };
        Object.defineProperty(globalThis, 'fetch', {
            value: deny,
            writable: false,
        });
        Object.defineProperty(globalThis, 'WebSocket', {
            value: deny,
            writable: false,
        });
        Object.defineProperty(globalThis, 'XMLHttpRequest', {
            value: deny,
            writable: false,
        });
        const php = new PHP(
            await loadPHPRuntime(loader, { wasmBinary: data.wasm }),
        );
        await setPhpIniEntries(php, {
            memory_limit: '64M',
            max_execution_time: '5',
            display_errors: '1',
            log_errors: '0',
            allow_url_fopen: '0',
            allow_url_include: '0',
            open_basedir: '/workspace:/tmp:/internal',
            disable_functions:
                'exec,shell_exec,system,passthru,proc_open,popen,pcntl_exec,mail,fsockopen,pfsockopen,stream_socket_client,socket_create,curl_exec,curl_multi_exec,dl,putenv,phpinfo,post_message_to_js,js_eval,js_async_eval',
        });
        php.mkdirTree('/workspace');
        php.writeFile(
            '/workspace/main.php',
            String(data.code).slice(0, 200000),
        );
        const request = data.input.trim() ? JSON.parse(data.input) : {};
        if (
            typeof request !== 'object' ||
            request === null ||
            Array.isArray(request)
        )
            throw new Error('Request Data must be a JSON object.');
        const rules: Rules = data.rules ?? {};
        const tests = (rules.test_cases ?? []).slice(0, 20);
        const harness = `<?php
chdir('/workspace');
$request = json_decode(base64_decode('${b64(request)}'), true, 32, JSON_THROW_ON_ERROR);
$_GET = is_array($request['get'] ?? null) ? $request['get'] : [];
$_POST = is_array($request['post'] ?? null) ? $request['post'] : [];
$_COOKIE = is_array($request['cookie'] ?? null) ? $request['cookie'] : [];
$_REQUEST = array_merge($_GET, $_POST);
$_SERVER['REQUEST_METHOD'] = array_key_exists('post', $request) ? 'POST' : 'GET';
$_SERVER['SERVER_NAME'] = 'student-lab.invalid';
$_SERVER['REQUEST_URI'] = '/main.php';
$_FILES = [];
if (isset($request['session']) && is_array($request['session'])) { session_start(); $_SESSION = $request['session']; }
$db = new PDO('sqlite:/workspace/student-lab.sqlite');
$db->exec('CREATE TABLE students (id INTEGER PRIMARY KEY, student_number TEXT UNIQUE, first_name TEXT, last_name TEXT, course TEXT, year_level INTEGER, email TEXT)');
$db->exec("INSERT INTO students VALUES (1,'2026-001','Maria','Santos','BSIT',1,'maria@example.test'),(2,'2026-002','Jose','Reyes','BSCS',2,'jose@example.test')");
unset($db, $request);
require '/workspace/main.php';
$rules = json_decode(base64_decode('${b64({ ...rules, test_cases: tests })}'), true, 32, JSON_THROW_ON_ERROR);
$issues = [];
foreach ($rules['required_functions'] ?? [] as $function) { if (!function_exists($function)) $issues[] = 'Define function: ' . $function; }
$tokens = array_map(fn ($token) => is_array($token) ? token_name($token[0]) : $token, token_get_all(file_get_contents('/workspace/main.php')));
foreach ($rules['required_constructs'] ?? [] as $token) { if (!in_array($token, $tokens, true) && !($token === 'T_ARRAY' && in_array('[', $tokens, true))) $issues[] = 'Practice this PHP construct: ' . $token; }
foreach ($rules['test_cases'] ?? [] as $test) {
    if (!preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $test['function']) || !function_exists($test['function'])) { $issues[] = 'Missing test function: ' . $test['function']; continue; }
    try { $actual = ($test['function'])(...$test['arguments']); if (is_numeric($actual) && is_numeric($test['expected']) ? abs($actual - $test['expected']) > 0.000001 : $actual !== $test['expected']) $issues[] = 'Return-value test failed: ' . $test['function']; }
    catch (Throwable $error) { $issues[] = 'Function test error: ' . $test['function']; }
}
file_put_contents('/workspace/checks.json', json_encode($issues));
`;
        php.writeFile('/workspace/run.php', harness);
        self.postMessage({ type: 'running' });
        const response = await php.runStream({
            scriptPath: '/workspace/run.php',
        });
        const [output, error, exitCode] = await Promise.all([
            bounded(response.stdout),
            bounded(response.stderr),
            response.exitCode,
        ]);
        const issues: string[] = php.fileExists('/workspace/checks.json')
            ? JSON.parse(php.readFileAsText('/workspace/checks.json'))
            : ['Practice checks did not finish. Review any PHP errors.'];
        if (
            rules.expected_output !== undefined &&
            normalize(output) !== normalize(rules.expected_output)
        )
            issues.push(
                'Output differs from the sample expected output (whitespace is ignored).',
            );
        self.postMessage({ type: 'done', output, error, issues, exitCode });
    } catch (error) {
        self.postMessage({
            type: 'done',
            output: '',
            error: String(error).slice(0, 5000),
            issues: [],
        });
    }
};

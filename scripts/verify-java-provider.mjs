import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

// Run only after the provider's isolation guarantees and adapter are verified.
// Never launches Java on the Laravel server or the local host.
const url = process.env.JAVA_SANDBOX_URL;
const token = process.env.JAVA_SANDBOX_TOKEN;
if (
    process.env.JAVA_SANDBOX_ENABLED !== 'true' ||
    !url ||
    !token ||
    new URL(url).protocol !== 'https:'
) {
    throw new Error(
        'An approved HTTPS Java service and server-side credential are required. No tests were sent.',
    );
}
const normalize = (value) => value.replace(/\s+/g, ' ').trim();
async function run(source, stdin = '') {
    const response = await fetch(url, {
        method: 'POST',
        redirect: 'error',
        signal: AbortSignal.timeout(35000),
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            language: 'java',
            version: '17',
            filename: 'Main.java',
            source,
            stdin,
            limits: {
                compile_seconds: 15,
                run_seconds: 5,
                cpu_seconds: 5,
                memory_mib: 512,
                processes: 64,
                threads: 64,
                output_bytes: 65536,
                workspace_mib: 16,
                network: false,
            },
            libraries: ['h2', 'gson'],
        }),
    });
    assert(response.ok, 'Provider did not accept the verification request');
    const result = await response.json();
    assert.equal(typeof result.output, 'string');
    assert.equal(typeof result.compilation_output, 'string');
    assert.equal(typeof result.runtime_errors, 'string');
    assert(
        Buffer.byteLength(result.output) <= 65536,
        'Output limit not enforced',
    );
    return result;
}
const contents = JSON.parse(
    readFileSync('database/data/java-course.json', 'utf8'),
);
for (const [index, lesson] of contents.entries()) {
    const sample = lesson.validation_rules.java.test_cases[0];
    const result = await run(lesson.example_java, sample.input);
    assert.equal(result.runtime_errors, '', `${lesson.title}: runtime error`);
    assert.equal(
        normalize(result.output),
        normalize(sample.expected),
        `${lesson.title}: example output mismatch`,
    );
    console.log(`PASS ${index + 1}: ${lesson.title}`);
}
const main = (body) =>
    `public class Main { public static void main(String[] args) throws Exception { ${body} } }`;
const invalid = await run('public class Main { missing syntax }');
assert(
    invalid.compilation_output.length > 0,
    'Missing compilation diagnostics',
);
const failure = await run(
    main('throw new IllegalStateException("example runtime failure");'),
);
assert(
    failure.runtime_errors.includes('example runtime failure'),
    'Missing runtime diagnostics',
);
const input = await run(
    'import java.util.*; ' +
        main(
            'Scanner s=new Scanner(System.in); System.out.println(s.nextLine()+"|"+s.nextInt()+"|"+s.nextDouble());',
        ),
    'Maria Santos\n19\n95.5\n',
);
assert.equal(normalize(input.output), 'Maria Santos|19|95.5');
const file = await run(
    main(
        'java.nio.file.Files.writeString(java.nio.file.Path.of("isolated.txt"),"42"); System.out.println(java.nio.file.Files.readString(java.nio.file.Path.of("isolated.txt")));',
    ),
);
assert.equal(normalize(file.output), '42');
const fresh = await run(
    main(
        'System.out.println(java.nio.file.Files.exists(java.nio.file.Path.of("isolated.txt"))); System.out.println(java.nio.file.Files.exists(java.nio.file.Path.of(".env"))); System.out.println(System.getenv("DB_PASSWORD") == null);',
    ),
);
assert.equal(
    normalize(fresh.output),
    'false false true',
    'Workspace or secrets are not isolated',
);
for (const [label, source] of [
    ['execution timeout', main('while(true) {}')],
    [
        'memory exhaustion',
        'import java.util.*; ' +
            main(
                'List<byte[]> data=new ArrayList<>(); while(true) data.add(new byte[1048576]);',
            ),
    ],
    [
        'thread exhaustion',
        main(
            'for(int i=0;i<10000;i++) new Thread(()->{try {Thread.sleep(60000);}catch(InterruptedException e){Thread.currentThread().interrupt();}}).start();',
        ),
    ],
    [
        'output exhaustion',
        main('while(true) System.out.println("01234567890123456789");'),
    ],
    [
        'workspace exhaustion',
        main(
            'try(var out=new java.io.FileOutputStream("large.dat")){ byte[] b=new byte[1048576]; for(int i=0;i<1000;i++)out.write(b); }',
        ),
    ],
]) {
    const result = await run(source);
    assert(
        result.runtime_errors.length > 0,
        `Provider did not report ${label}`,
    );
    console.log(`PASS ${label}`);
}
const denied = await run(
    main(
        'try { new ProcessBuilder("sh","-c","echo forbidden").start(); System.out.println("FAIL shell access"); } catch(SecurityException e) { System.out.println("Denied"); }',
    ),
);
assert.equal(
    normalize(denied.output),
    'Denied',
    'Shell execution must explicitly be denied',
);
const network = await run(
    main(
        'try(var socket=new java.net.Socket("example.com",80)){System.out.println("FAIL network");}',
    ),
);
assert(
    !network.output.includes('FAIL') && network.runtime_errors.length > 0,
    'Networking must be restricted',
);
console.log(
    'Java examples and provider isolation probes passed. Inspect provider CPU/cgroup/process configuration separately.',
);

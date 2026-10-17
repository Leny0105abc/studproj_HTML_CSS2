import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, basename } from "node:path";

// Only committed, authored fixtures are executed locally. Student code always uses existing sandboxes.
const exported = spawnSync(
    "php",
    [
        "scripts/export-programming-examples.php",
        ...(process.argv.includes("--edges") ? ["--edges"] : []),
    ],
    { encoding: "utf8", shell: process.platform === "win32", maxBuffer: 8 * 1024 * 1024 },
);
assert.equal(exported.status, 0, exported.stderr || exported.stdout);
const lessons = JSON.parse(exported.stdout);
const python = process.env.PROGRAMMING_TEST_PYTHON;
const javaHome = process.env.PROGRAMMING_TEST_JAVA_HOME;
assert(
    python && javaHome,
    "Set PROGRAMMING_TEST_PYTHON and PROGRAMMING_TEST_JAVA_HOME to trusted installed runtimes.",
);
const java = join(javaHome, "bin", "java.exe");
const javac = join(javaHome, "bin", "javac.exe");
const normalize = (s) => s.replace(/\r\n/g, "\n");
const temp = mkdtempSync(join(tmpdir(), "codelab-programming-"));
let assertions = 0;
try {
    for (const lesson of lessons) {
        const py = join(temp, "main.py");
        const source = join(temp, "Main.java");
        writeFileSync(py, lesson.programs.python.code);
        writeFileSync(source, lesson.programs.java.code);
        const compile = spawnSync(javac, ["--release", "17", source], {
            encoding: "utf8",
            timeout: 30000,
            maxBuffer: 1024 * 1024,
        });
        assert.equal(compile.status, 0, `Java compilation ${lesson.number}: ${compile.stderr}`);
        const syntax = spawnSync(python, ["-m", "py_compile", py], {
            encoding: "utf8",
            timeout: 10000,
        });
        assert.equal(syntax.status, 0, `Python syntax ${lesson.number}: ${syntax.stderr}`);
        for (const test of lesson.tests) {
            for (const [language, exe, args] of [
                ["Python", python, [py]],
                ["Java", java, ["-Xmx64m", "-cp", temp, "Main"]],
            ]) {
                const result = spawnSync(exe, args, {
                    input: test.input,
                    encoding: "utf8",
                    timeout: 5000,
                    maxBuffer: 100000,
                });
                if (test.error) {
                    assert.notEqual(
                        result.status,
                        0,
                        `${language} ${lesson.number}: expected rejection`,
                    );
                    assert(!result.error, "Execution must reject, not time out.");
                } else {
                    assert.equal(
                        result.status,
                        0,
                        `${language} lesson ${lesson.number}: ${result.stderr}`,
                    );
                    assert.equal(
                        normalize(result.stdout),
                        test.expected,
                        `${language} lesson ${lesson.number}, ${test.name}`,
                    );
                }
                assertions++;
            }
        }
        for (const language of ["python", "cpp", "java"]) {
            assert.equal(
                lesson.programs[language].code.trimEnd().split("\n").length,
                lesson.programs[language].nodes.length,
            );
            assert(lesson.programs[language].nodes.some(Boolean));
        }
        console.log(
            `PASS ${lesson.number}: Python syntax, Java 17 compilation, and expected success/error cases.`,
        );
    }
    console.log(
        `PASS: ${lessons.length} authored examples; ${assertions} Python/Java executions; deterministic source maps.`,
    );
} finally {
    const resolvedTemp = realpathSync(temp);
    assert.equal(
        dirname(resolvedTemp),
        realpathSync(tmpdir()),
        "Refuse cleanup outside the intended temporary directory.",
    );
    assert(
        basename(resolvedTemp).startsWith("codelab-programming-"),
        "Refuse cleanup of an unrelated directory.",
    );
    rmSync(resolvedTemp, { recursive: true, force: true });
}

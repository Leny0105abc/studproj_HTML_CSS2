# Java sandbox follow-up — 12 October 2026

**Java Run now works on the dedicated local test site through Judge0.** All 30 authored lesson examples, including the three projects, have executed successfully. No Java compiler or student program runs on Laravel or on this Windows computer.

Test: [Java Programming](http://127.0.0.1:8017/courses/java-programming). College student `college.student`, password `BrowserTest2026!`. These credentials belong only to the fictional browser-test database.

## Service selected and scope

The Computer Use plugin helps operate apps; it is not itself a Java hosting service. We inspected the available environment and selected [Judge0's HTTP API](https://ce.judge0.com/), which currently exposes Java 17 and sandboxed multi-file programs. A live Java 17 probe executed successfully, and a separate memory probe was killed at the requested 64 MiB limit.

The connected endpoint is the public shared test service, **not a private production deployment**. It is enabled only in the running local test server's process environment:

```text
APP_ENV=local
DB_CONNECTION=sqlite
DB_DATABASE=<workspace>/storage/framework/testing/python-browser.sqlite
JAVA_SANDBOX_ENABLED=true
JAVA_SANDBOX_PROVIDER=judge0-public-test
```

Code verifies the exact fixture database's resolved path and local environment. This mode refuses production, MySQL, other SQLite databases, and PHPUnit's testing environment. The normal `.env`, accounts, and database were not changed to enable remote execution. The generic authenticated service adapter remains available for a later production provider.

The lesson prominently explains that code is sent to Judge0 and that users must use fictional data and omit personal information/secrets. No account, subscription, payment, API key, Docker installation, WSL installation, or Windows security setting was created or changed.

## Execution flow

1. The existing authenticated, access-checked, throttled Java endpoint accepts Main.java source and stdin.
2. Laravel packages only that source, trusted Java guard/policy/scripts, and checksum-pinned H2/Gson libraries into a private temporary ZIP. It does not execute the source.
3. The ZIP is sent by HTTPS to Judge0's isolated multi-file runner. No app credentials, database connection settings, session cookies, user profile, or arbitrary workspace files are included.
4. A fixed script compiles the guard into a separate jar and compiles Main.java with Java 17, annotation processors disabled, and curated classpath libraries.
5. The JVM starts with the guard already installed, before student class initialization. Output, compilation diagnostics, and runtime errors return through the server adapter.
6. The app discards its temporary ZIP immediately. Judge0 jobs use separate temporary workspaces; a fresh-file probe confirmed no file reuse between runs.

Only Main.java and pre-supplied stdin are student-controlled. Helper/nested classes are supported. Uploaded jars, custom scripts, arbitrary compiler flags, callback URLs, and arbitrary service endpoints are not accepted by the test adapter.

## JDBC and JSON

H2 2.4.240 provides real JDBC in-memory educational databases. Both the standalone JDBC lesson and the advanced Student Information System executed successfully with PreparedStatement, related student/grade tables, transactions, and reports. The intermediate file project also completed its save/load round trip.

Gson 2.13.2 supplies JSON parsing and serialization. The JSON lesson executed successfully with a simulated API response. External network requests remain blocked.

Pinned SHA-256 receipts:

```text
h2.jar   29b70e427cc1c40cdc376283adbb0cc62853073797bb5fe5761f81fe73d57ce0
gson.jar dd0ce1b55a3ed2080cb70f9c655850cda86c206862310009dcb5e5c95265a5e0
```

Downloads come from Maven Central and are verified again before packaging. Jars stay in `storage/app/private/java-provider`; they are not public assets. Upstream license resources remain inside the original jars.

## Safeguards and tested limits

| Control | Implementation / evidence |
|---|---|
| Compile deadline | Fixed outer 15-second timeout with one-second forced-kill grace; annotation processing disabled |
| Runtime deadline | Fixed five-second JVM timeout, one-second forced-kill grace; Judge0 six-second wall limit and five-second total CPU limit |
| Memory | 512 MiB requested for the isolated job; JVM heap 96 MiB, metaspace 64 MiB, code cache 32 MiB; live memory exhaustion terminated |
| Processes/threads | 64 combined at the isolate layer; live thread exhaustion terminated; student child-process creation denied |
| Output/files | 64 KiB per output/file at the isolate layer; output and large-file probes terminated |
| Workspace growth | Initial regular files at most 8 MiB; at most 128 cumulative writable paths, each capped at 64 KiB, bounding regular-file contents to 16 MiB; file-count probe rejected further creation |
| App/other files | Only job files and the remote JDK distribution are readable; application-file probe denied |
| Credentials | Environment access denied; credential probe denied |
| Networking | Provider network flag false plus Java guard denial; socket probe denied |
| Shell/native code | ProcessBuilder/exec and native library loading denied |
| Runtime protection | Guard jar first on classpath; guard, source, policy, scripts, libraries, and compiled classes read-only; disabling the guard or modifying its policy was denied |
| App authorization | Existing authentication, student role, education/enrollment, publication and gating checks; six requests/minute and one active user request |
| Transport | HTTPS, no redirects, fixed endpoint, bounded response reads/fields; source and input whitespace retained |

The guard uses Java 17's deprecated SecurityManager **only as defense in depth inside Judge0's OS sandbox**. It is not taught as a recommended application API and is not a substitute for OS isolation. Do not migrate this package to a newer JDK without replacing/revalidating that guard.

These are observed example/probe results and configured limits, not a formal security audit or proof against every possible JVM/provider exploit. The shared runtime advertises JDK 17.0.6; production requires a maintained, appropriately patched runtime and controlled service configuration.

## Verification

- **30/30 authored examples passed** against the live service, including full names/stdin, files, collections, streams, multithreading, JDBC, JSON, and all projects.
- **16/16 live probes passed**: compiler/runtime diagnostics, Scanner input, fresh files, app files, environment, shell/processes, networking, guard disablement, guard file changes, timeout, heap exhaustion, thread exhaustion, output size, file size, and file count.
- `php artisan test --compact`: **105 passed, 2 existing skipped, 3,991 assertions**, no failures. Existing course tests were retained.
- TypeScript, frontend build, scoped React checks, Pint, and diff checks passed.
- Browser verification on the College test account confirmed Run displays `Hello, Java!` and Save Code records version 2. Screenshot: `docs/java-lab-preview.png`.
- The encrypted snapshot comparison still confirms preservation of the original five courses, 135 lessons, accounts, progress, submissions, feedback, and other existing records.

Evidence: `storage/framework/testing/judge0-java-live-results.log` contains all 30 example passes; `judge0-java-security-results.log` contains all 16 probe passes. The first full run encountered a transport issue while reading a chunked response; bounded complete reads were fixed and the security probes passed afterward. Test verification retries transient provider failures up to three times; normal student POST submissions are not automatically duplicated.

## Files added or changed in this follow-up

Added:

- `app/Services/Judge0JavaSandbox.php`
- `resources/java-sandbox/Guard.java`, `sandbox.policy`, `compile.sh`, `run.sh`
- `scripts/setup-judge0-java.php`, `verify-judge0-java.php`, `serve-java-test.ps1`
- `tests/Feature/Judge0JavaSandboxTest.php`
- This report and the working `docs/java-lab-preview.png` screenshot.

Changed:

- `app/Services/JavaSandbox.php`: explicit provider selection, strict fixture/environment boundary, complete bounded response reads.
- `config/java.php`, `.env.example`: provider configuration.
- `app/Http/Controllers/CodeLabController.php`, `resources/js/pages/code-lab/java.tsx`: accurate runtime availability and shared-service notice.
- `tests/Feature/JavaSandboxTest.php`: explicit generic-provider setup, retaining its existing checks.

No schema migration, reseeding, production data update, account reset, or production deployment was needed in this follow-up.

## Reproduce locally

With the existing fixture database and built frontend:

```powershell
php scripts/setup-judge0-java.php
./scripts/serve-java-test.ps1
```

Live authored-example/probe verification:

```powershell
php scripts/verify-judge0-java.php
# Probes alone, after an example run:
php scripts/verify-judge0-java.php --probes-only
```

Run setup before PHPUnit tests that verify the real ZIP structure, since these tests require the pinned local libraries. Setup reuses already verified downloads. No JDK is installed on this computer.

## Remaining production work

The shared service is for fictional local tests. It can queue, rate-limit, or become unavailable, and its source retention and service-level guarantees are not controlled by this app. Only the local fixture database can use this mode. Student code and stdin are transmitted to that third party; do not enter real student details, credentials, or private project code.

For actual students/Hostinger deployment, provision or select a private/authenticated service with current Java patches, verified retention and cleanup, the required libraries and policy, strict resource controls, and suitable capacity. Configure the existing authenticated adapter for its API and rerun the same examples/security probes. This production connection remains incomplete; no paid service or subscription was purchased.

Other limits: one Main.java, no desktop GUI, input supplied before Run, temporary files/JDBC data, restricted reflective/native access, and no automatic remote-job cancellation on Stop. Stop aborts the browser request; the worker's own deadline remains enforced. Teacher approval continues to control formal lesson completion.

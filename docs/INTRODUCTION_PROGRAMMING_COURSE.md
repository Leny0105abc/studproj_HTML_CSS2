# Introduction to Programming

This course extends the existing Laravel/Inertia CodeLab application. It uses the existing accounts, course catalog, education levels, enrollment, lesson prerequisites, progress, submission versions, teacher feedback, project rubrics, and reports.

## Course and learning flow

The course is **Introduction to Programming**, normally at `/courses/introduction-to-programming`. An existing course with that exact name or slug is reused, retaining its identity. Both High School and College learners can access the published course. Teachers can also assign it through existing course management.

There are 30 lessons: Beginner 1–10, Intermediate 11–20, Advanced 21–30. Each contains objectives, prerequisites, duration, discussions, an IPO analysis, a numbered plan, pseudocode, a structured visual flowchart, complete Python/C++17/Java17 source, a code explanation, two specified output tests, three guided activities, three independent activities, two debugging activities, two conversion activities, and ten explained quiz questions. Projects occupy lessons 10, 20, and 30. The final project's worked console scope is two in-memory student records, with search, updates, validation, reports, and an exit menu; learners extend the capacity in practice.

Students move through Problem → Algorithm → Pseudocode → Flowchart → three implementations → Run → Compare → Debug. Learn displays the worked plan. Guided Practice offers progressive hints and a partially prepared chart. Independent Challenge starts a fresh solution; interpretation/debugging lessons retain their supplied chart. Activities contain specific additional problems, including coffee preparation, simple interest, area/temperature/salary calculations, grade policies, menus, patterns, functions, searching, and sorting.

The graph remains visible when changing languages. Selecting a symbol shows equivalent source statements in all three languages. A compact source view highlights the selected node, while the complete program is editable in the existing language editor. There is also a side-by-side comparison mode. Expected results are labeled separately from actual runner results. Students must rerun after changing source or input.

## Structured conversion

`app/Services/ProgrammingFlowchart.php` validates and lowers the structured graph to typed expressions and statements, then emits deterministic source and a line-to-node source map. `ProgrammingExamples.php` authors the 30 reference graphs using that same model. Labels never become executable expressions.

Graph version 1 has `start: "start"`, `end: "end"`, an ordered `body` of node IDs, a `nodes` dictionary, and a `functions` list. Ordered block membership is the connection model. `if` owns `then` and `else`; `select` owns literal-valued `cases` and `default`; loops own `body`. Structured exits rejoin, and loop edges return to their test. Arbitrary graph jumps, shared block ownership, and unstructured cycles are rejected.

Supported statements:

| Node kind | Configuration |
| --- | --- |
| `input` | `name`, `type`, `prompt`, optional `update` for rereading an existing variable |
| `declare` | `name`, `type`, typed `value` expression |
| `assign` | Declared `name` and typed `value` |
| `output` | Scalar `value` expression |
| `if` | Boolean `condition`, `then`, `else` blocks |
| `select` | Integer/string `value`, unique literal cases, default block |
| `while` | Boolean condition and pre-test body |
| `for` | Fresh local counter, integer from/to, nonzero constant integer step; exclusive stop |
| `do` | Body followed by a Boolean continuation test |
| `array_set` | Array variable, integer index, matching element value |
| `return` | Typed result in a function block |
| `connector` | Structured join/annotation |

Expressions are `literal`, `ref`, `binary`, `array`, `index`, `length`, and `call`. Types are `int`, `real`, `bool`, `string`, `int[]`, `real[]`, and `string[]`. Functions have named typed parameters, scalar return types, and separate body blocks. Function-call expressions can initialize variables, appear in arithmetic, or be displayed. Function symbols use the predefined-process notation.

Validation detects missing Start/End markers, missing references, disconnected nodes, duplicate ownership, unsupported control flow, undefined variables, incompatible types, absent/non-Boolean conditions, unknown/recursive/forward function references, wrong argument counts, duplicate cases, unreachable returns, zero literal divisors, and statically known invalid array indices. It limits graphs to 500 nodes, 30 functions, 16 parameters, block depth 20, and expression depth 30. Runtime helpers check dynamic array bounds and zero divisors. General termination is not claimed to be decidable.

## Editing and persistence

The visual builder supports adding symbols by click or palette drag/drop, editing labels and typed expressions, configuring branches and loops, adding functions and array operations, and explicitly connecting/reordering a selected node into a destination block. It supports 40 graph undo states, redo, scroll/pointer pan, zoom, and SVG/PNG export. PNG dimensions are capped for browser memory. Structured JSON import permits advanced graph editing. The editor automatically lays out structured charts; arbitrary hand-routed/free-form graphs are outside this model.

Save persists incomplete but well-shaped graphs, all three editable sources, standard input, mode, analysis, algorithm, pseudocode, test notes, and documentation in the existing progress row. Empty drafts, indentation, leading spaces, and blank input lines survive request middleware. Optimistic versions reject stale saves. Submit additionally requires a valid graph, three nonempty sources, the written solution, and test notes. The final capstone also requires documentation. Teacher review displays the complete graph, three sources, plan, input, tests, and documentation from an immutable submission snapshot. Editing a saved workspace supersedes pending snapshots.

Questions and choices are shuffled on the server per lesson/session. Correct answers remain server-side until feedback is returned for an attempt. The server scores ten answers, requires 8/10, and saves the result in existing progress fields. Generation and test notes do not automatically award completion: quiz passage and teacher approval are required. Projects also require rubric scores. Existing five-question courses retain their five-question quizzes and 4/5 threshold. Teacher/student score displays use each lesson's denominator.

## Semantics and explicit limits

- Integers use checked signed 32-bit arithmetic in all three languages. Overflow is an error rather than Python silently accepting a larger integer or C++ overflowing.
- Real arithmetic uses finite binary64 values. `/` always means real division; `%` accepts integers and produces a nonnegative remainder with an absolute divisor. Division by zero is an error.
- Real display uses a shared six-place, half-away-from-zero scaling policy, normalizes rounded negative zero, and accepts output magnitude up to `1e9`. Larger decimal outputs report a clear runtime error. This avoids language formatter tie-rounding differences. The complete programs include the small helpers that enforce these policies.
- Input is one value per line. Numeric input is strictly parsed; text preserves internal/leading/trailing spaces. Configured literals, prompts, and labels use ASCII text, newline, or tab. Integer counts and other problem-specific domains are stated in each lesson; not every domain is automatically enforced unless the worked graph includes validation.
- Arrays are homogeneous and zero based. Negative indices are rejected, including in Python. Arrays have fixed logical length; element updates are supported, whole-array reassignment/resizing is rejected. Arguments are copied for consistent value-style function behavior. Direct source editing can explore other native behavior.
- Helpers must refer only to earlier helper definitions and end with a return covering all paths. Conditional early returns are supported; returns inside loops, recursion, forward calls, array returns, and void procedures are outside this converter. Void/None are explained in the function lesson and can be practiced in the normal editors.
- Python constants are a convention rather than a `const` keyword. Python has no native do-while: generated post-test logic uses `while True` and `break`. Python match-case is discussed with its 3.10 requirement; selection is emitted using portable if/elif/else logic.

## Execution and security

No student source is executed by the generator, persistence controller, or a local PHP subprocess. Python and C++ reuse the existing opaque-origin iframe/worker runners, private MessageChannels, input/source limits, deadlines, and output limits. C++ uses the existing WASI runtime with virtual filesystem and 64 MiB guest-memory ceiling, and no guest network imports. Python uses the existing Pyodide runtime with a 12-second execution deadline and 20,000-character output limit. Its CSP restricts runtime downloads/network destinations to the existing versioned Pyodide CDN. It needs that runtime download on first use; strict offline availability and a new explicit Python guest-memory ceiling were not added here. Browser process memory remains controlled by the browser.

Java reuses `JavaRunController` and `JavaSandbox`. The adapter requests Java 17, compilation/run/CPU limits, 512 MiB memory, process/thread/output/workspace limits, and disabled networking. The administrator must connect and independently verify the isolated provider; Laravel requests are not proof of provider isolation. When unavailable, the UI reports it and retains complete `Main.java` source. The application's execution configuration is not changed or enabled by this course.

Trusted committed test fixtures can be compiled locally by the verification scripts. Those scripts accept no student submissions. Java verification uses `javac --release 17` from an installed JDK; this is separate from the student's isolated service.

## Installation and authoring

The local installation was backed up using the existing encrypted course snapshot facility, then only this additive migration and targeted seeder were applied. Before/after checks verified all original table rows against their original columns.

For another existing installation, use:

```powershell
node scripts/author-programming-course.mjs
php scripts/snapshot-course-data.php programming
php artisan migrate --path=database/migrations/2026_10_16_000001_add_programming_workspace.php --force
php artisan db:seed --class=IntroductionProgrammingCourseSeeder --force
php scripts/verify-course-snapshot.php programming
npm run build
```

Do not run a database reset or the development account seeder. The course seeder does not change accounts, enrollments, existing student work, or other courses. Rerunning it preserves existing `programming_content` and teacher edits. For deliberate content revisions, use the existing lesson editor's `programming_content` JSON field and ten-question quiz editor. Graph edits are validated before publishing, regenerate their plan, and update example sources when the graph changes. Existing progress and submission identities remain intact.

## Verification commands

```powershell
php vendor/pestphp/pest/bin/pest --colors=never
npm run types:check
npm run build

# Trusted installed runtimes; set these to the paths on the verification machine.
$env:PROGRAMMING_TEST_PYTHON = 'absolute path to python.exe'
$env:PROGRAMMING_TEST_JAVA_HOME = 'absolute path to a JDK'
node scripts/verify-programming-examples.mjs
node scripts/verify-programming-examples.mjs --edges
node scripts/verify-programming-cpp.mjs
node scripts/verify-programming-cpp.mjs --edges
```

The curriculum suite compiles/syntax-checks 30 programs per language and executes the two specified cases per lesson: 180 exact-output comparisons. Ten additional structured fixtures test 23 success/error cases per language: descending ranges, empty arrays, copy semantics, real/integer promotion, Boolean/text equality, preserved whitespace, decimal rounding, malformed/missing input, checked overflow, dynamic zero divisors, bounds, and connector-only blocks. The PHP suite also checks graph validation, deterministic mappings, target education access, course idempotency, legacy-record preservation, draft saves, optimistic locking, randomized quiz scoring, server-side answer secrecy, submissions, stale teacher reviews, project documentation/rubrics, and teacher content edits.

Browser checks use `scripts/setup-programming-browser.php` only with a separate `storage/framework/testing/programming-browser.sqlite` database. That fixture creates disposable student/teacher accounts in the separate database and never changes existing users. Browser verification includes actual Python output, node/source mapping, save/reload, quiz scoring, and submission. The full existing PHP suite supplies the regression check for the other courses and workflows. Provider availability, the limits above, and any skipped tests must remain explicit in delivery notes.

Verified results: **190 PHP tests passed, 2 existing registration tests skipped, 10,182 assertions**. Self-registration is disabled because teachers create student accounts. The 180 curriculum executions and 69 additional success/error executions passed across Python, C++17, and Java17-compatible source. The production build and TypeScript checks passed. Browser Python and C++ each produced the actual expected sum `5`; the shuffled quiz scored `10/10`, and saves survived reload. The local Java execution service remains unavailable. Existing rows were verified unchanged for all 339 prior lessons, 15 prior courses, and all original account/progress/submission/feedback records.

Browser checks also confirmed structured node label edits/connections, undo/redo, three simultaneous language editors with the chart retained, actual SVG and PNG downloads, and 390px mobile / 1440px desktop layouts without page-wide overflow. PNG export paints the shared chart geometry directly onto a bounded canvas, avoiding asynchronous SVG-image loading in embedded browsers.

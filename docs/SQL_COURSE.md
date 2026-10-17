# SQL / Database Programming

Implemented on 12 October 2026 in the existing Laravel CodeLab application.

## Course and curriculum

Published College course `sql-programming`, editor `sql`, provider `browser-wasm-sqlite`. It uses the existing course, module, enrollment, progress, quiz, submission, teacher-review, administration, dashboard, and report systems.

Three modules contain exactly ten lessons each (positions 1–30, global lesson numbers 166–195). Every lesson has objectives, explanation, syntax, a runnable example, independent activity, expected example results, dialect/security notes, debugging guidance, a challenge, and five multiple-choice questions. There are 150 lesson questions, a 20-question assessment per module, and three projects with rubrics totaling 100 points.

The latest attachment ends at Advanced Lesson 3. Advanced Lessons 4–10 follow the user's complete earlier outline.

| Module | Lessons in order |
| --- | --- |
| Beginner | Introduction to Databases and SQL; Creating Databases and Tables; SQL Data Types; Inserting Data; Retrieving Data with SELECT; Filtering Records; Sorting and Limiting Results; Updating and Deleting Records; Basic Aggregate Functions; Student Database project |
| Intermediate | Constraints; Relationships Between Tables; JOINs; GROUP BY and HAVING; String and Numeric Functions; Date and Time Queries; Subqueries; Views; Indexes and Query Performance Basics; School Enrollment Database project |
| Advanced | Advanced JOINs and Set Operations; Advanced Subqueries and Common Table Expressions; Window Functions; Stored Procedures and Functions; Triggers; Transactions; Database Normalization; Database Security; Query Optimization and Execution Plans; Student Information Database System project |

The examples use fictional school records. Project examples include their complete schema and sample inserts; activities require original work, reports, integrity checks, and documented tests. JSON curriculum: `database/data/sql-course.json`. Reproducible authoring script: `scripts/author-sql-course.mjs`.

## Practice database and isolation

Student SQL never reaches Laravel's application database. There is no server SQL execution endpoint and no application credential is included in the runtime. Laravel stores source and optional parameter JSON as text. The browser creates a sandboxed iframe with `allow-scripts` and without `allow-same-origin`; communication uses a private MessageChannel. Each Run starts a fresh Web Worker and an in-memory SQLite database using pinned `sql.js` 1.14.2. The worker is destroyed on completion, error, Stop, or timeout.

The worker loads only fixed public runtime assets without cookies, then disables its network APIs before evaluating SQL. SQL is passed to SQLite's parser, never evaluated as JavaScript. No JavaScript user-defined function, host filesystem mount, extension loader, or network bridge is registered. Attached SQLite files can exist only inside the worker's temporary Emscripten memory filesystem. Browser CSP limits loading to the public assets and blob workers.

Limits include:

- 20 seconds to load the runtime; 5 seconds to execute the script.
- Hard 64 MiB WebAssembly memory maximum encoded in the generated binary.
- 200,000 characters each for student script and trusted lesson seed; 20,000 characters for parameter JSON.
- At most 100 statements, 20 result tables, 30 columns, and 200 displayed rows per result. Additional rows are labeled as truncated.
- 1,000 characters per displayed cell and 64 KiB total result/schema text; blobs are represented by their size.
- 4 MiB per virtual file, 16 MiB cumulative virtual-file growth, 128 tracked file nodes, and 20,000 virtual-file writes. These filesystem hooks are independent of mutable SQL PRAGMAs. The WASM memory limit is not a claim that the browser worker's entire JavaScript heap is 64 MiB.

The runtime uses the SQLite parser for scripts, including semicolons inside strings and trigger bodies. Integers outside JavaScript's safe integer range are displayed as exact decimal strings. Unsafe integer JSON parameters are rejected; use text when an exact large identifier is needed.

## Student and teacher workflow

Students can inspect all published lesson previews. The first lesson is available; later labs remain locked until the preceding lesson is completed, subject to the existing enrollment and manual-unlock controls. College students see SQL automatically. High-school students need an explicit assignment to access this College course.

Run shows result tables and a schema inspector. Reset, Clear, Copy, and Save operate on SQL source. Every Run resets the database; students must keep setup, inserts, transactions, and queries in one script. Save persists SQL and named parameters, not database contents. Optional example comparison provides practice feedback only.

Use named values such as `SELECT * FROM students WHERE id=:id;` with JSON `{":id":2}`. Values are bound through SQLite's statement API, not concatenated. Parameters cannot stand in for table names or arbitrary SQL fragments.

Submitting stores an immutable, versioned SQL/input snapshot. Passing the quiz (4/5) and receiving teacher approval of the current submitted version are both required for completion. Editing source or parameter JSON invalidates a pending snapshot. Projects require all rubric categories to be graded within their limits. Completed activities become read-only and unlock the next lesson. Teacher review includes SQL source, practice execution, versions, feedback, and the existing grading interface. Teachers can edit SQL examples, starters, seeds, dialect notes, quizzes, rubrics, and assessments; newly created SQL lessons begin unpublished.

## SQLite differences

Runnable examples use real SQLite. This is not a MySQL or PostgreSQL server emulator.

- SQLite opens a database rather than executing `CREATE DATABASE`.
- Its type affinity does not enforce VARCHAR lengths, CHAR padding, or DECIMAL precision like strict server DBMS declarations. The course explains constraints and integer cents.
- Dates use ISO text and SQLite `date`, `strftime`, and `julianday`; current timestamps are UTC. Fixed reference dates make examples reproducible.
- SQLite views are read-only by default; INSTEAD OF triggers are a separate technique.
- Modern bundled SQLite supports RIGHT/FULL joins, set operations, CTEs, windows, transactions, indexes, and SQLite triggers. Older/other DBMS versions differ.
- SQL stored procedures/functions and database users/roles with GRANT/REVOKE are unsupported. Lessons teach labeled server-specific concepts and runnable SQLite view/CTE or bound-query alternatives. These features are not simulated or presented as successful SQLite execution.
- Transactions demonstrate rollback/atomic operations inside one script. This single-worker in-memory lab does not demonstrate multi-user isolation or durable storage between Runs.

Primary references: [sql.js API](https://sql.js.org/documentation/), [SQLite data types](https://www.sqlite.org/datatype3.html), [window functions](https://www.sqlite.org/windowfunctions.html), [date functions](https://www.sqlite.org/lang_datefunc.html), [CREATE TRIGGER](https://www.sqlite.org/lang_createtrigger.html), and [EXPLAIN QUERY PLAN](https://www.sqlite.org/eqp.html).

## Data preservation and setup

Before migration, an encrypted snapshot was saved as `storage/app/private/course-backups/before-sql-20261012-024803.encrypted`. The additive migration adds nullable SQL fields. Only `SqlCourseSeeder` was run; existing account seeders were not rerun. The SQL seeder uses `firstOrCreate` and preserves later teacher edits.

The normal MySQL database and dedicated browser-test SQLite database both now contain the SQL course. Existing six courses and 165 lessons were preserved byte-for-byte on their original columns, along with all four users, five progress records, four submissions, two feedback records, five case studies, and 67 activity logs. The catalogue now contains seven courses and 195 lessons. College has five courses / 150 lessons; High School has two courses / 45 lessons.

For another installation, build assets and apply the SQL migration before seeding the course:

```powershell
npm ci
npm run build
php artisan migrate --force
php artisan db:seed --class=SqlCourseSeeder --force
```

Generated runtime files are under `public/sql-runtime` and regenerated by build, build:ssr, and predev. Deploy the generated assets along with the sandbox HTML/JS and Laravel build output. No Docker, external SQL service, database account, or paid provider is required for this browser lab.

## Verification

- Full Laravel suite: **111 passed, 2 skipped, 4,900 assertions** (113 total). Result: `storage/framework/testing/sql-all-test-results.json`.
- SQL feature coverage: complete/idempotent curriculum, preservation, College/High School access, publication and gating, locked previews, versioned saves, source/input whitespace preservation, student isolation, immutable submissions, quiz/teacher completion, stale-review rejection, project grading, teacher edits/drafts, module assessments, manual unlocking, and fixed runtime routes. A SQL string containing `DROP TABLE users` is saved/submitted as text while the application users remain intact.
- Real generated SQLite runtime: all 30 examples match their stored expected results. Additional checks cover bound values/injection-looking strings, FK/CHECK/UNIQUE failures, unsupported syntax, absent host file/extension functions, proper trigger/string parsing, fresh databases, result limits, virtual-file limits, exact large integers, WASM ceiling, and terminating an unbounded query worker. Result: `storage/framework/testing/sql-runtime-results.log`.
- TypeScript check and production build passed.
- Browser verification: College course catalogue, first lesson, actual SELECT results, real named-parameter lookup, Save/reload persistence, and the five-second query timeout. The browser fixture was used without passing quizzes or approving real work.

Repeat the runtime check with `node scripts/verify-sql-runtime.mjs` after building SQL assets. Repeat the normal-data preservation check with `php scripts/verify-course-snapshot.php sql`.

## Test access

Running test site: [SQL course](http://127.0.0.1:8017/courses/sql-programming), [first SQL lab](http://127.0.0.1:8017/code-lab/166).

Existing fictional browser-test accounts (passwords were not reset):

| Role | Username | Password |
| --- | --- | --- |
| College student | `college.student` | `BrowserTest2026!` |
| High-school student | `highschool.student` | `BrowserTest2026!` |
| Teacher/admin | `browser.teacher` | `BrowserTest2026!` |

These accounts belong to the dedicated test database, not the normal MySQL installation. The test server uses `storage/framework/testing/python-browser.sqlite`; its existing Java test-provider settings are preserved. Normal Herd site: [SQL course](http://studproj_html_css.test/courses/sql-programming), using existing normal-site accounts.

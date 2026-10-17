# PHP Programming implementation report

PHP Programming is integrated into the existing College program. HTML/CSS, Python, Scratch, authentication, students, and previous progress are preserved. No separate application or course-management system was created.

Local test course: <http://127.0.0.1:8017/courses/php-programming>. The dedicated SQLite browser fixture accepts `college.student` / `BrowserTest2026!` and teacher `browser.teacher` / `BrowserTest2026!`. These credentials apply only to that local test database. Existing application credentials were not changed. A High School student needs teacher assignment to access PHP.

## 1. Files created

- `database/migrations/2026_10_11_000003_add_php_workspace_fields.php`
- `database/seeders/PhpCourseSeeder.php`
- `database/data/php-course.json`
- `scripts/create-php-curriculum.mjs`
- `scripts/build-php-runtime.mjs`
- `scripts/verify-php-runtime.mjs`
- `resources/js/php-worker.ts`
- `resources/js/components/php-editor.tsx`
- `resources/js/pages/code-lab/php.tsx`
- `public/php-sandbox.html` and `public/php-sandbox.js`
- `tests/Feature/PhpCourseTest.php`
- This report and `docs/php-lab-preview.png`.

Generated artifacts in `public/php-runtime/` are excluded from Git and regenerated during `npm run build`, `npm run build:ssr`, or before `npm run dev`: worker bundle, capped WASM binary, content-hash manifest, license, and attribution notice. Deploy these generated assets with the rest of the public directory.

## 2. Files modified

- `app/Models/Lesson.php`: PHP identification and teacher-review requirement.
- `app/Http/Controllers/CodeLabController.php`: PHP page, starter/draft/source snapshots, shared saving/submission/version checks and project logging.
- `app/Http/Controllers/LessonController.php`: PHP previews, draft creation, editable examples/starters/security notes.
- `app/Http/Controllers/SubmissionController.php`: stale PHP snapshot protection, project rubric grading and completion logging.
- `app/Services/LessonCodeValidator.php`: preserve PHP source; never execute it on Laravel; require teacher assessment rather than trusting browser results.
- `resources/js/pages/lessons/edit.tsx`, `lessons/preview.tsx`, and `submissions/show.tsx`: PHP content and secure review runner.
- `routes/web.php`: tightly scoped public runtime asset responses with CORS for the opaque iframe.
- `package.json`, `package-lock.json`, and `.gitignore`: pinned PHP runtime dependencies and reproducible builds.
- `scripts/snapshot-course-data.php`, `scripts/verify-course-snapshot.php`: PHP safety snapshot label.
- `tests/browser/setup.php`: PHP included in future isolated fixture initialization.

The existing shared course access service, course/module management, enrollment model, student dashboard, teacher dashboard, progress reports, manual unlocks, and module-assessment component work with PHP without a second implementation.

## 3. Database changes

Additive, nullable fields only:

- Lessons: `starter_php`, `example_php`, `security_note`.
- Student lesson progress and submissions: `php_code`.

The existing `program_input` field stores controlled request JSON. The existing transport field `html_code` also holds the source for compatibility with shared lab endpoints. Progress and submissions have dedicated PHP source columns. No existing row was reset or deleted. Normal migration and the single PHP seeder were used, never `migrate:fresh` or the account-resetting development seeder.

Encrypted pre-change snapshot: `storage/app/private/course-backups/before-php-20261011-110538.encrypted`. Verification confirmed the exact original values of 4 users, 75 lessons, 5 progress records, 4 submissions, 2 feedback records, 5 case studies, 67 activity logs, 3 courses, and 9 modules, plus existing enrollment/education records.

## 4. Course record

| Field | Value |
|---|---|
| Education | College |
| Name | PHP Programming |
| Slug | php-programming |
| Difficulty | Beginner to Advanced |
| Language | PHP |
| Editor | php |
| Provider | browser-wasm |
| Published | Yes |
| Sequential gating | Enabled by default |

The seeder uses `firstOrCreate` with stable course/module/lesson identifiers. Re-running it does not duplicate records or overwrite teacher edits.

## 5. Modules

Beginner, Intermediate, and Advanced each contain exactly 10 lessons. Each has a 20-question assessment selected from its ten lesson quizzes. Assessments use the existing module-completion requirement, persisted enrollment results, and 80% passing threshold.

## 6. Thirty lesson records

| # | Beginner | Intermediate | Advanced |
|---|---|---|---|
| 1 | Introduction to PHP | Working with HTML Forms | Object-Oriented PHP |
| 2 | Variables and Constants | Superglobals | Inheritance and Polymorphism |
| 3 | PHP Data Types | String Manipulation | Encapsulation, Interfaces, and Traits |
| 4 | Operators | Advanced Array Operations | Advanced Database Programming with PDO |
| 5 | Input and Output | File Handling | Authentication and Authorization |
| 6 | Conditional Statements | Sessions and Cookies | File Uploads |
| 7 | Loops | Date and Time | JSON and APIs |
| 8 | Arrays | Error Handling and Validation | MVC and Application Structure |
| 9 | Functions | Introduction to MySQL with PHP | PHP Security and Best Practices |
| 10 | Beginner Project — Student Grade Calculator | Intermediate Project — Student Record Management System | Advanced Project — PHP Web Application |

Every lesson has three measurable objectives, introduction/concepts, syntax, runnable example, starter, guided practice, independent activity, common error, security note, expected sample output, five four-choice questions with explanations, summary/challenge, and next-lesson navigation. The three projects include requirements, milestones, examples or schema guidance, testing/submission instructions, and 100-point rubrics. Beginner uses calculation accuracy instead of the database category because database work comes later.

## 7. PHP coding lab

The editor supports Run, Stop, Reset, Clear, Copy, Save, text output, an optional sandboxed HTML preview, and controlled JSON request data. Example:

```json
{"post":{"name":"Maria"},"get":{"course":"BSIT"},"session":{"name":"Maria"},"cookie":{"theme":"light"}}
```

Each Run creates a fresh worker, virtual filesystem, and teaching database. GET/POST/cookie/session data is simulated; the lab never imports the application’s actual cookies or secrets. Output headers do not affect the CodeLab page. Example and starter fields are editable through the existing lesson editor.

Practice checks support normalized expected output, token-based PHP language constructs, function existence, and return-value test cases. The Functions lesson includes three return-value tests. These checks provide formative feedback; an edited browser can forge its results, so they never award authoritative completion. Teachers review the source and project rubric.

## 8. PHP/MySQL sandbox approach

PDO SQLite is available inside the WASM runtime. Each Run creates `/workspace/student-lab.sqlite` with only two fictional students and the requested student fields. Students can practice SELECT, prepared parameters, CRUD, constraints, transactions, and fetch modes. Changes vanish at the end of the run, including after timeout or failure.

Lessons teach the MySQL DSN and configuration concepts using placeholders and distinguish SQLite from MySQL. No CodeLab database connection or credential is sent to the browser. Full multi-page MySQL projects require a separate teacher-provisioned educational environment; this lab runs their individual PHP/SQL components.

## 9. Student dashboard integration

College students automatically see PHP beside Python through existing education-level rules. The shared course card shows description, overall progress, module progress, and the learning action. The course page presents all 30 lessons with local lesson numbers 1–10 in each module. Students can read locked lessons through the existing preview; the coding activity and quiz remain gated.

High School students do not automatically see or access PHP. Explicit course assignment/enrollment enables cross-level access. The same rules are enforced on course, preview, lab, save, submit, and quiz endpoints.

## 10. Admin integration

Teachers use existing controls to edit course settings, publish/unpublish, disable gating, assign students, edit/reorder modules and assessments, create draft PHP lessons, edit starters/examples/security notes/content/quizzes/rubrics/validation rules, choose prerequisites, manually unlock lessons, inspect student progress, review versioned submissions, request revisions, and grade project categories. PHP source can be run in the same isolated review editor.

Project approval requires every rubric category, scores within category maxima, the submitted activity, and a passed quiz. A stale source or changed request input cannot be approved. Scores are stored in the existing submission rubric field.

## 11. Progress integration

Existing enrollment, lesson progress, version locking, feedback, and course-scoped navigation are reused. Starting a PHP lesson records course/module/lesson starts as appropriate. Saving records draft versions; submitting records activities or projects. Quizzes persist scores. Teacher approval records lesson/activity completion and unlocks the next lesson. Project grading records total rubric points. Completed teacher-approved work is read-only.

## 12. Security protections

- PHP student source is never passed to the Hostinger/Laravel PHP interpreter or any host process function.
- Opaque `sandbox="allow-scripts"` iframe, private MessageChannel, and a fresh dedicated worker per run.
- No host filesystem mount, browser storage bridge, production configuration, application credentials, process adapter, or network adapter.
- Worker fetch, WebSocket, and XMLHttpRequest are disabled. PHP URL wrappers, process/network functions, dynamic extension loading, environment mutation, and PHP-to-JS messaging are disabled.
- PHP allocation limit 64 MiB; hard WASM linear-memory ceiling 256 MiB, tested even after `ini_set('memory_limit', '-1')`.
- 8-second execution deadline with worker termination, 30-second initialization deadline, bounded code/request sizes, and 64 KiB output cap per stream. This bounds CPU work by wall-clock termination; it is not a server CPU quota.
- Virtual filesystem only, bounded by the runtime’s memory; `open_basedir` further confines PHP paths. New runs receive fresh state.
- HTML preview uses an iframe without script/form permissions and CSP blocking network and forms.
- Server authorization, CSRF middleware, version checks, unpublished/gated access checks, authoritative quiz scoring and teacher grading remain active.
- Runtime files are allowlisted by name. Cross-origin responses contain only public runtime assets, without credentialed CORS. Content hashes prevent stale bundle/binary combinations after rebuilds.

The runtime uses pinned `@php-wasm/universal` and `@php-wasm/web-8-4` version 3.1.57 from WordPress Playground. The lower-level loader avoids host adapters. See the [official PHP.wasm package documentation](https://developer.wordpress.org/playground/developers/architecture/php-wasm-packages/) and [source repository](https://github.com/WordPress/wordpress-playground). GPL-2.0-or-later notices/license are included in generated assets. The build script reproducibly modifies only the binary memory maximum and bundles the worker wrapper.

## 13. Test results

- `php artisan test`: **88 passed, 2 existing skipped, 2,413 assertions**.
- PHP feature tests: **5 passed, 728 assertions**; exercise curriculum/idempotence/data preservation, server access, gating/preview/dashboard, draft editing, assessment persistence, versioned source/request snapshots, stale review rejection, quiz/teacher completion, rubric bounds, and non-executing endpoints.
- `node scripts/verify-php-runtime.mjs`: all **30 examples and practice checks passed**. Additional checks passed for controlled input, fresh files, absent secrets/cookies, disabled process/network/JS-message functions, PHP allocation limit, hard WASM memory cap, output limit, infinite-loop timeout, and positive/negative function tests. This executes PHP only inside the same WASM worker in a restricted JavaScript test context.
- Browser verification: course navigation, PHP workspace, Hello PHP output, controlled POST input, two-record PDO teaching database, and infinite-loop termination.
- TypeScript, production build, scoped frontend lint/format, PHP formatting, and whitespace checks passed.
- Encrypted snapshot comparison confirmed original application rows are unchanged.

## 14. Limitations and setup

- The browser lab handles one PHP entry script per run. Multi-page routing, persistent sessions, actual HTTP uploads, outbound APIs, and a full MySQL server are deliberately not supplied. Those project features are taught, specified, and teacher-reviewed; a separate educational environment is needed to test the complete deployed projects.
- Sessions/cookies are simulated through Request Data and do not persist automatically across Run. `filter_var()` is used for simulated fields; `filter_input()` is explained for real SAPI requests.
- Live APIs and uploads are replaced by controlled samples. Do not connect this lab to production databases or add a host execution fallback.
- Runtime checks are practice feedback, not secure automatic grading. Source plus project evidence in comments/optional educational repository link is submitted for teacher review; no project ZIP upload workflow was added.
- Browser resource limits isolate student execution from the application server; browser processes have their own overhead beyond WASM linear memory. Runtime initialization or low-memory devices can fail gracefully.
- Build requires the pinned npm dependencies and bundled WASM artifacts. Existing unrelated npm audit findings in development tooling were not changed as part of this course integration.
- No Hostinger deployment was performed. To deploy with existing release procedures: back up data, run the additive migration and `PhpCourseSeeder`, build assets, deploy `public/php-runtime`, and run the existing tests. Do not rerun a seeder that resets production accounts.

```sh
npm ci
npm run build
php artisan migrate --force
php artisan db:seed --class=PhpCourseSeeder --force
php artisan test
node scripts/verify-php-runtime.mjs
```

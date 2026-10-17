# Java Programming integration report

**12 October update:** Java execution is now connected and verified for the dedicated local test database through Judge0. See [the current sandbox report](JAVA_SANDBOX.md) for 30 successful examples, live safety probes, setup, and production limitations. The report below records the initial 11 October implementation and its then-pending runtime status.

Date: 11 October 2026. Existing Laravel/Inertia CodeLab application.

**Status: the College course, lessons, workspace, administration, and shared learning workflows are implemented. Live Java execution is pending the existing sandbox service details requested from the user. This is not yet a completed Java runtime deployment.**

Test course: [Java Programming](http://127.0.0.1:8017/courses/java-programming). The test server uses its existing separate SQLite database. College student: `college.student`; teacher: `browser.teacher`; password for both test fixtures: `BrowserTest2026!`. Existing normal application accounts and passwords were preserved.

## 1. Files created

- `database/migrations/2026_10_11_000005_add_java_workspace_fields.php`
- `database/seeders/JavaCourseSeeder.php`
- `database/data/java-course.json`
- `scripts/create-java-curriculum.mjs`
- `scripts/java-project-examples.mjs`
- `scripts/verify-java-provider.mjs`
- `app/Http/Controllers/JavaRunController.php`
- `app/Services/JavaSandbox.php`
- `config/java.php`
- `resources/js/pages/code-lab/java.tsx`
- `resources/js/components/java-editor.tsx`
- `tests/Feature/JavaCourseTest.php`
- `tests/Feature/JavaSandboxTest.php`
- This report and `docs/java-lab-preview.png`.

## 2. Files modified

- `app/Models/Lesson.php`: Java identification and teacher-review behavior.
- `app/Http/Controllers/CodeLabController.php`: Java page, starter source, progress source, immutable submission snapshots, project events, and precise JSON source/stdin preservation.
- `app/Http/Controllers/LessonController.php`: Java preview fields, editable examples/starters, and unpublished Java drafts.
- `app/Http/Controllers/SubmissionController.php`: Java project rubrics, source/input snapshot comparison, completion and grading events.
- `app/Services/LessonCodeValidator.php`: Java submits for teacher review without local compilation.
- `bootstrap/app.php`: preserve whitespace for the Java run endpoint.
- `routes/web.php`: authenticated, student-only Java run endpoint with request throttling.
- `.env.example`: disabled-by-default Java service configuration.
- `resources/js/pages/lessons/edit.tsx`, `preview.tsx`: editable Java source and visible locked previews.
- `resources/js/pages/submissions/show.tsx`: immutable `Main.java` source review and Java project grading.
- `tests/browser/setup.php`: include Java in the existing guarded test fixtures.
- `scripts/snapshot-course-data.php`, `verify-course-snapshot.php`: Java snapshot labels and verification.

The shared dashboard, course pages, enrollment, module assessments, and course administration already support course records. They needed no separate Java management system.

## 3. Database changes

An additive migration adds nullable `starter_java` and `example_java` to `lessons`, and nullable `java_code` to `student_lesson_progress` and `submissions`. Existing `program_input`, `debugging_tip`, quizzes, activity fields, rubrics, and shared course tables are reused. No tables were replaced, truncated, or rebuilt.

Migration and Java-only seeding were applied to the normal MySQL application database and the existing dedicated browser-test SQLite database. The main account seeder was not run.

Before seeding, an encrypted normal-database snapshot was created at `storage/app/private/course-backups/before-java-20261011-125658.encrypted`. Verification confirmed exact preservation of the original columns and records: 4 users, 135 lessons, 5 progress records, 4 submissions, 2 feedback records, 5 case studies, 67 activity logs, 2 education levels, 5 courses, 15 modules, and the existing empty case-study progress/enrollment sets.

## 4. Java course record

Normal application course ID: **6**. Name: **Java Programming**. Slug: `java-programming`. Education: **College**. Difficulty: **Beginner to Advanced**. Language: **Java**. Editor: `java`. Provider identifier: `isolated-java-service`. Course status: **Published**; sequential gating enabled by default.

`JavaCourseSeeder` uses transactions and `firstOrCreate` for course, modules, and lesson slugs. Repeated seeding creates no duplicates and preserves teacher content edits. The seeder does not update other courses or reset progress.

## 5. Modules created

| Module | Position | Lessons | Assessment |
|---|---:|---:|---:|
| Beginner | 1 | 10 | 20 questions |
| Intermediate | 2 | 10 | 20 questions |
| Advanced | 3 | 10 | 20 questions |

Assessments combine concepts, output interpretation, mistakes, and lesson-specific scenarios. Existing module assessment access and score handling are reused.

## 6. Thirty lesson records

Normal application lesson numbers/IDs are 136–165, with Java course positions 1–30. Module navigation displays local lesson numbers 1–10.

| Position | Module | Title |
|---:|---|---|
| 1 | Beginner | Introduction to Java |
| 2 | Beginner | Variables and Constants |
| 3 | Beginner | Data Types |
| 4 | Beginner | Input and Output |
| 5 | Beginner | Operators |
| 6 | Beginner | Conditional Statements |
| 7 | Beginner | Loops |
| 8 | Beginner | Arrays |
| 9 | Beginner | Methods |
| 10 | Beginner | Beginner Project — Student Grade Calculator |
| 11 | Intermediate | Strings and String Methods |
| 12 | Intermediate | ArrayList |
| 13 | Intermediate | Classes and Objects |
| 14 | Intermediate | Constructors and Encapsulation |
| 15 | Intermediate | Inheritance |
| 16 | Intermediate | Polymorphism and Abstraction |
| 17 | Intermediate | Exception Handling |
| 18 | Intermediate | File Handling |
| 19 | Intermediate | Collections and Generics Basics |
| 20 | Intermediate | Intermediate Project — Student Record Management System |
| 21 | Advanced | Advanced Object-Oriented Programming |
| 22 | Advanced | Interfaces and Abstract Classes |
| 23 | Advanced | Advanced Collections Framework |
| 24 | Advanced | Generics |
| 25 | Advanced | Lambda Expressions and Streams |
| 26 | Advanced | Multithreading |
| 27 | Advanced | Database Programming with JDBC |
| 28 | Advanced | JSON and APIs |
| 29 | Advanced | Application Architecture and Best Practices |
| 30 | Advanced | Advanced Project — Java Student Information System |

Lessons contain 3–4 measurable objectives, introductions, concepts/explanations, source syntax/examples, guided exercises, independent activities, common errors, debugging tips, five quick-check questions, summaries, and the next lesson. All authored content lives in the database. Beginner examples avoid advanced exception declarations unless an operation requires them.

Projects include development milestones, sample input/output, test checklists, submission instructions, and rubrics totaling 100: functionality 30, Java concepts 20, object-oriented design 15, data management 10, validation/error handling 10, organization 10, tests/documentation 5. Evaluate design at the module's level; beginner work does not require inheritance or advanced patterns.

## 7. Java coding lab

The editor presents `Main.java` and Java 17, source editing, Program Input, Run/Stop/Reset/Clear/Copy/Save, and separate runtime output, compilation output, and runtime errors. Source and input changes participate in the existing optimistic save/version checks. Teacher-approved work becomes read-only.

Use `public class Main` with `public static void main(String[] args)`. Helper/nested classes demonstrate OOP and layers in the single source file. Multi-file package/build-tool projects are discussed but not yet implemented by this editor.

Browser verification confirmed that the first Java lesson loads, Try Example populates source, Save Code persists it through reload, quiz controls appear, and the next lesson remains gated. The course page shows all 30 lessons with locked previews.

## 8. Compiler/runtime sandbox integration

**Pending live provider connection.** The user selected an existing Java sandbox service and will provide its name, API documentation, and endpoint. No service details or credential were available during implementation.

The server-side HTTP adapter is isolated in `JavaSandbox`. Configuration is `JAVA_SANDBOX_ENABLED=false`, `JAVA_SANDBOX_URL`, and `JAVA_SANDBOX_TOKEN`. Credentials stay on the Laravel server and are never included in page props. The current adapter defines a provisional contract; it must be adapted to the actual provider before enabling execution.

The app fails closed with HTTP 503 and a visible explanation until configured. There is **no** local Java, javac, shell, Docker, process, or unrestricted execution fallback in Laravel. Do not enable the flag merely because a URL is present: verify the provider's isolation guarantees and its API first.

Provisional HTTPS POST request:

```json
{
  "language": "java",
  "version": "17",
  "filename": "Main.java",
  "source": "public class Main { ... }",
  "stdin": "Maria Santos\n19\n95.5\n",
  "limits": {
    "compile_seconds": 15,
    "run_seconds": 5,
    "cpu_seconds": 5,
    "memory_mib": 512,
    "processes": 64,
    "threads": 64,
    "output_bytes": 65536,
    "workspace_mib": 16,
    "network": false
  },
  "libraries": ["h2", "gson"]
}
```

Expected normalized response:

```json
{"output":"Hello, Java!\n","compilation_output":"","runtime_errors":""}
```

Resource values in a request are **not proof of enforcement**. The execution provider must actually enforce them independently of student code, isolate the filesystem and processes, deny shell/network access and production credentials, and dispose of each workspace. No resource-limit, JVM, or host-isolation claim has yet been verified against a live service.

## 9. Scanner/stdin handling

Program Input is sent as stdin and stored with saved source and immutable submission snapshots. Java source and stdin preserve leading/trailing whitespace and blank lines rather than being changed by Laravel string trimming. An HTTP adapter test verifies transmission of full names and multiline numeric input. Live Scanner/JVM testing is pending the provider connection.

All input is supplied before Run; interactive input after launch is not implemented. Source is limited to 200,000 characters and input to 20,000 characters.

## 10. JDBC sandbox/database implementation

The curriculum uses JDBC with H2 embedded in-memory databases, `PreparedStatement` parameter binding, `ResultSet`, transactions, and try-with-resources. The JDBC example creates its own educational table. The advanced project creates related student/grade tables, implements transactional add/edit, lookup/list/delete, averages and reports, and separates repository/service/UI responsibilities.

These are authored exercises awaiting an H2-capable Java service. No database server was provisioned and no live JDBC execution was verified. The service must supply an approved H2 driver on its classpath. `jdbc:h2:mem:...` describes disposable in-process educational persistence; data does not survive a new Run. No production MySQL credentials are used in lesson source or Java requests. See [H2's in-memory database documentation](https://h2database.com/html/features.html#in_memory_databases).

The JSON/API example requires Gson on the classpath and parses a simulated response. It does not make external network requests or contain API keys. Java 17 itself does not supply Gson.

## 11. Student dashboard integration

The existing shared course cards and module progress show Java for College students. The College student test has four College courses: Python, PHP, C++, and Java, with 120 combined lessons. High School students do not automatically receive Java. Assignment through the existing enrollment system grants access, and authorization is enforced server-side.

The normal full catalog now has six courses and 165 lessons; the original 135 lesson records are preserved.

## 12. Admin integration

Existing teacher/Admin flows manage publishing, education level, enrollments, gating, modules, ordering, prerequisites, manual unlocking, lesson content, examples, starter source, quiz/rubric definitions, submissions, and project grading. Creating a Java lesson creates an unpublished draft with a Java starter. Students cannot use these management routes.

Submission review shows the immutable `Main.java` snapshot, input, quiz eligibility, feedback, and project rubric. Run is unavailable in the teacher snapshot panel; the panel explicitly explains this. A teacher execution flow can be added after the real service contract is known.

## 13. Progress-tracking integration

Course/module/lesson starts and lesson access use existing enrollment/progress records and activity logs. Saving tracks versions. Java activity submissions require teacher review. Passing the five-question quiz requires at least 4/5 and alone does not complete a Java lesson. Approving the latest matching submission after the quiz completes the lesson and unlocks the next one.

Changing source or input invalidates pending submission review. Superseded or edited snapshots cannot be approved. Projects emit `project_submitted` and `project_graded`; Java teacher completion emits `lesson_completed`. Existing reports and module assessments use these shared records.

## 14. Security protections implemented

- Authentication, role checks, course access, publication, and prerequisite checks on Java requests.
- Six run requests per minute per authenticated client; one active run per user through a 40-second shared cache lock.
- Source/input validation; fixed language/version/filename; administrator-controlled provider URL.
- HTTPS required; redirects disabled; server-only bearer token; three-second connection timeout and bounded provider request/read time.
- Provider response read bounded to 256 KiB; permitted output fields individually limited to 64 KiB; unexpected fields stripped.
- Generic errors avoid exposing credentials, raw upstream bodies, and internal network diagnostics.
- Browser Stop aborts the request; it does not claim to kill a remote job. The provider must terminate jobs on its own deadline.
- No Java execution on Laravel, no production DB credentials in Java exercises, and no automatic completion based on client-reported output.

**Provider-level isolation, CPU/memory/thread/process/output enforcement, shell/network denial, and temporary workspace cleanup remain unverified.** These must be checked before enabling execution. Application-layer limits cannot substitute for an isolated runtime.

## 15. Test results

`php artisan test --compact`: **102 passed, 2 existing skipped; 3,974 assertions; no failures**. Result: `storage/framework/testing/java-all-test-results.json`.

Java-specific tests: **9 passed, 833 assertions**. They cover curriculum/idempotence, earlier course preservation, College/High School access, locked previews, enrollment, publication/gating, save versions, immutable source/stdin snapshots, quiz/teacher review, stale reviews, rubric scoring, admin editing/drafts, module assessments, disabled execution, mocked HTTP forwarding, credential redaction, invalid/oversized provider responses, and concurrency limits.

`npm run build`, final `vp build`, `npm run types:check`, scoped React/JS checks, Pint, and `git diff --check` passed. Existing PHP runtime build warnings remained unchanged.

Browser checks confirmed course/lesson rendering, saving through reload, and the clear unavailable-service error. No live JVM compilation, runtime, Scanner, JDBC, file isolation, memory, CPU, thread, process, or timeout tests were performed. HTTP tests use fakes and do not prove provider isolation.

`scripts/verify-java-provider.mjs` prepares live checks for all 30 examples, Scanner input, compile/runtime errors, fresh files, absent application credentials, output/memory/thread/workspace exhaustion, shell/network denial, and infinite-loop termination. It refuses to send requests without an enabled HTTPS provider and credential. It has not been run. Provider configuration and administrative resource enforcement must also be inspected.

## 16. Remaining work and limitations

Required next input: the user's existing Java sandbox service name, API documentation URL, and endpoint. Keep credentials out of chat; configure them server-side. After receiving details, adapt the HTTP contract, verify Java 17 and the required H2/Gson libraries, inspect resource/isolation settings, run the live example/security checks, and enable execution only when these pass.

Until then, the course, reading, previews, saving, quizzes, submissions, progress, and admin management are available, but **Run cannot compile or execute Java**. The task's secure execution and JDBC runtime requirements remain incomplete.

Other current limits: one `Main.java`, pre-supplied input, no desktop GUI, no externally networked API exercises, disposable files/databases, no hidden-test grading or multi-file package uploads. Sample expected-output cases are stored for future behavioral validation. Formal completion uses teacher review; no exact-source matching is used for Java correctness.

No production deployment, destructive database action, account reset, Git commit, or PR was performed.

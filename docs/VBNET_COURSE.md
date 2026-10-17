# Visual Basic .NET course handover

The existing CodeLab platform now includes the published College course **Visual Basic .NET** (`visual-basic-dotnet`, editor `vbnet`), with **Beginner 6 + Intermediate 6 + Advanced 6 = 18 lessons**. No separate Laravel application was created. Existing courses and account seeders were preserved.

## 1. Files created

| Purpose | Files |
| --- | --- |
| Database and curriculum | `database/migrations/2026_10_12_000003_add_vbnet_course_fields.php`, `database/seeders/VbnetCourseSeeder.php`, `database/data/vbnet-course.json` |
| Runner integration | `config/vbnet.php`, `app/Services/VbnetSandbox.php`, `app/Http/Controllers/VbnetRunController.php` |
| Student editor | `resources/js/components/vbnet-editor.tsx`, `resources/js/pages/code-lab/vbnet.tsx` |
| Authoring and trusted content checks | `scripts/author-vbnet-course.mjs`, `scripts/setup-vbnet-validation.ps1`, `scripts/verify-vbnet-curriculum.mjs` |
| Tests and documentation | `tests/Feature/VbnetCourseTest.php`, `tests/Feature/VbnetSandboxTest.php`, this report, `docs/vbnet-lab-preview.png`, `docs/vbnet-form-guide.png` |

## 2. Files modified

`app/Models/Lesson.php`, `app/Services/LessonCodeValidator.php`, `app/Http/Controllers/CodeLabController.php`, `app/Http/Controllers/SubmissionController.php`, `app/Http/Controllers/LessonController.php`, and `routes/web.php` integrate the shared access, editor, save, submit, review, preview, and teacher-edit workflow.

`resources/js/pages/lessons/edit.tsx`, `resources/js/pages/lessons/preview.tsx`, and `resources/js/pages/submissions/show.tsx` add VB.NET content fields, desktop guides, and submitted source/evidence review. `.env.example` documents default-disabled service settings; the actual `.env` was not changed. The existing snapshot and preservation scripts now accept the `vbnet` label.

## 3. Database changes and preservation

The additive migration adds nullable lesson starter/example/form-guide fields, a `console`/`winforms` lesson mode, and nullable source/project-URL/evidence-note fields on progress and submissions. Existing columns and records are retained.

Before migration an encrypted snapshot was saved at `storage/app/private/course-backups/before-vbnet-20261012-043521.encrypted`. The preservation verifier confirmed identical original-column data for all **213 lessons, 8 courses, 24 modules, 4 users, 5 progress records, 4 submissions, 2 feedback records, 5 case studies, 67 activity logs**, and the other existing enrollment/case-study-progress records. The catalogue now contains **9 courses and 231 lessons**. Normal MySQL and the separate browser-test SQLite fixture were migrated and seeded with only `VbnetCourseSeeder`; no accounts or passwords were reset.

## 4–6. Course, modules, and lesson records

| Level | Ordered lessons |
| --- | --- |
| Beginner | Introduction to Visual Basic .NET; Variables, Constants, and Data Types; Input, Output, and Operators; Conditional Statements and Loops; Arrays and Procedures; Student Grade Calculator project |
| Intermediate | Strings and Collections; Windows Forms Fundamentals; Event-Driven Programming and Validation; Object-Oriented Programming Basics; Exception and File Handling; Student Record Management System project |
| Advanced | Inheritance, Polymorphism, and Interfaces; Advanced Collections and LINQ; Database Programming with ADO.NET; Multi-Form Applications and Application Architecture; Advanced Error Handling, Security, and Best Practices; VB.NET Student Information System project |

All 18 published lessons contain objectives, explanation/syntax/examples, lesson-specific guided practice and common errors, an original activity, expected results, debugging/security guidance, a summary/challenge, and completion requirements. There are **90 lesson quiz questions** and **18 questions per module assessment**. All three project rubrics sum to 100%; the Beginner rubric uses procedures, arrays, and console I/O rather than requiring later OOP/UI concepts. Re-seeding preserves teacher edits and rejects a conflicting course slug instead of overwriting it.

## 7. VB.NET code lab

The editor supports source, `Console.ReadLine` input, Run/Stop, Reset, Clear, Copy, Save, and activity/project submission. It can display stdout, compilation diagnostics, and runtime errors from the adapter. Source/input/evidence whitespace is preserved, optimistic versions reject stale saves, and completed work becomes read-only.

**Online Run is unavailable in the current installation.** The computer has .NET 8 runtime components but no SDK or verified isolated .NET service. Run is visibly disabled. Laravel never invokes the downloaded compiler or a native student-code process. Reading, saving, quizzes, and teacher-reviewed submissions work now.

## 8. Windows Forms lessons

Five desktop-mode lessons provide Lesson, Form Design, Code, Activity, Project, and Quiz sections. Design guides specify control names/properties, schematic layouts, required events, Visual Studio build steps, validation, and real screenshot/test evidence. They distinguish programmatically created reference forms from designer-generated controls to prevent duplicate declarations.

Build desktop work in Visual Studio on Windows using a supported SDK, preferably .NET 10 LTS. The browser neither executes Windows Forms nor presents a fake drag-and-drop designer. Desktop mode is also rejected by the server run endpoint, even if console execution is enabled later. Runtime support reference: [Microsoft .NET support policy](https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core).

## 9. Project submissions

Students submit versioned source and optional HTTP(S) repository/project links plus evidence/testing notes, including screenshot links, build instructions, and multi-file project locations. Teachers see immutable source/evidence snapshots and grade the applicable rubric after the quiz. A source, input, URL, or evidence change invalidates approval of an older submission.

**ZIP and image uploads are not added.** Links and notes use the existing submission workflow. The advanced project includes a compiled authentication/repository reference core and explicit milestones for students to build their own forms, CRUD, reports, account setup, persistence, and permission checks; it is not represented as an already completed desktop application.

## 10. ADO.NET practice database

The runnable authored example uses `Microsoft.Data.Sqlite` with a disposable **in-memory SQLite database**, parameterized INSERT/SELECT/UPDATE/DELETE, and nested `Using` scopes for disposal. Desktop work uses a separate local practice database and fictional records. No Laravel connection string, account token, or production database is provided to exercises. Provider differences are explained rather than treating SQLite and SQL Server as identical. Reference: [Microsoft SQLite parameters](https://learn.microsoft.com/en-us/dotnet/standard/data/sqlite/parameters).

## 11–13. Dashboard, administration, and progress

College now has **7 courses / 186 lessons**; High School retains **2 / 45**, and College VB.NET requires explicit assignment for a High School student. Existing course/enrollment/dashboard/report queries discover the new course without a parallel system.

Teachers can edit VB.NET source, mode, and guides, create unpublished drafts, review activities/projects, apply rubrics, and use the existing assessments/manual unlock tools. Students can view locked lesson previews, including source and form guides, while the actual workspace remains gated. Completion requires a passed quiz and teacher approval of the current version; project approval also requires rubric scores. Shared logs, navigation, read-only completion, and next-lesson unlock remain in use.

## 14. Execution security

The adapter requires all of: enabled flag, verified flag, HTTPS URL without embedded credentials/query/fragment, server-only token, and an accepted runtime version. Both flags default to false. Requests enforce authentication, course access, lesson gating, console mode, source/input limits, throttling, and one concurrent run per student. Provider redirects are disabled; timeouts and response/output limits apply; only stdout/compilation/runtime text is returned, with private diagnostics omitted on transport failures. Project links reject credentials and non-HTTP(S) schemes; source/evidence is rendered as text.

Before enabling a real provider, independently verify its isolation: disposable VM/container per run, no host mounts or secrets, no external/internal network, filesystem limited to the workspace, enforced CPU/wall-time/memory/process/output/disk limits, termination and cleanup, and disposable SQLite only. The adapter sends this resource contract but **the external provider must actually enforce it**. Setting `VBNET_SANDBOX_VERIFIED=true` alone is not an isolation test. No real provider is connected or claimed to be verified.

Environment template:

```dotenv
VBNET_SANDBOX_ENABLED=false
VBNET_SANDBOX_VERIFIED=false
VBNET_SANDBOX_URL=
VBNET_SANDBOX_TOKEN=
VBNET_SANDBOX_VERSION=10.0
```

The private HTTPS service contract receives `language`, `version`, `filename`, `source`, `stdin`, `project_type`, `limits`, `libraries`, and `database`; it returns three strings: `output`, `compilation_output`, `runtime_errors`. Generic public compiler endpoints are not silently treated as compatible or safe.

## 15. Verification

- Full `php artisan test`: **127 passed, 2 skipped, 5,633 assertions** across 129 tests. Existing tests were retained. Result: `storage/framework/testing/vbnet-all-test-results.json`.
- Eleven new feature tests cover preservation/idempotence, all level counts/content, College access/assignment/publication/gating, locked previews, source/input/evidence saves, stale versions, immutable submissions, quiz/rubric/current-version approval, read-only completion/next unlock, teacher editing/drafts, assessments, project URLs, unavailable/unverified services, desktop rejection, HTTP payload/limits, unsafe endpoints, redirects, response limits/types, locks, and private-error handling.
- **All 18 authored examples compiled; 13 console examples ran and matched expected output**, including private file handling and in-memory SQLite. Five desktop examples were compile-only. This was trusted curriculum verification, not student execution or a Windows GUI test. Microsoft NuGet compiler/reference packages were pinned and SHA-512 checked in `storage/app/private/vbnet-validation`; nothing was globally installed. Log: `storage/framework/testing/vbnet-curriculum-results.log`.
- Browser checks confirmed all three six-lesson levels, the student editor with disabled Run, saving/reloading source/evidence, and the actual Form Design guide. Temporary desktop fixture access was restored to locked; no quiz or teacher approval was performed in the browser fixture.
- TypeScript, targeted frontend lint/PHP formatting, and the production build passed. The build retains existing nonfatal optional-font/SQLite browser-bundle warnings.

Repeat trusted example checks with `node scripts/verify-vbnet-curriculum.mjs`; set up its private Microsoft packages with `powershell -NoProfile -File scripts/setup-vbnet-validation.ps1` if needed. Never wire these scripts into a student endpoint.

For another installation, build existing frontend assets, run `php artisan migrate --force`, then `php artisan db:seed --class=VbnetCourseSeeder --force`. Do not run account seeders to add the course.

## 16. Limits and test access

Remaining limits are explicit: no connected online .NET executor, no browser WinForms designer/execution, no automated desktop GUI test, and no ZIP/image upload. Student-authored desktop applications require a supported Windows development environment and teacher review. Existing course runners were not replaced.

The [free/local sandbox investigation](VBNET_LOCAL_SANDBOX.md) records the public API check and this laptop's readiness. Firmware virtualization must be enabled before the proposed WSL 2 setup; no service has been installed or verified.

[VB.NET course](http://127.0.0.1:8017/courses/visual-basic-dotnet) · [First lesson](http://127.0.0.1:8017/code-lab/214) · [Locked Windows Forms preview](http://127.0.0.1:8017/lessons/221/preview).

Dedicated local browser-test accounts: College student `college.student`, teacher `browser.teacher`; password for both `BrowserTest2026!`. These accounts belong to the separate `storage/framework/testing/python-browser.sqlite` fixture. The normal Herd site is [Visual Basic .NET](http://studproj_html_css.test/courses/visual-basic-dotnet), using its existing accounts.

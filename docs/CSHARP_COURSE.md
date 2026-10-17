# C# Programming course handover

The existing CodeLab platform now includes the published College course **C# Programming** with **18 lessons: six each in Beginner, Intermediate, and Advanced**. It reuses authentication, enrollment, navigation, progress, quizzes, submissions, teacher grading, reports, and course management. Online Run remains disabled until a separately verified isolated compiler service is connected.

## 1. Files created

| Purpose | Files |
| --- | --- |
| Additive schema | `database/migrations/2026_10_13_000001_add_csharp_course_fields.php` |
| Course/content | `database/seeders/CsharpCourseSeeder.php`, `database/data/csharp-course.json` |
| Editor/page | `resources/js/components/csharp-editor.tsx`, `resources/js/pages/code-lab/csharp.tsx` |
| Runner adapter | `app/Services/CsharpSandbox.php`, `app/Http/Controllers/CsharpRunController.php`, `config/csharp.php` |
| Authoring/validation | `scripts/author-csharp-course.mjs`, `scripts/verify-csharp-curriculum.mjs` |
| Regression tests | `tests/Feature/CsharpCourseTest.php`, `tests/Feature/CsharpSandboxTest.php` |
| Handover/proof | This report, `docs/csharp-lab-preview.png` |

## 2. Files modified

`app/Models/Lesson.php`, `app/Services/LessonCodeValidator.php`, and the shared `CodeLabController`, `LessonController`, and `SubmissionController` integrate C# into existing save/submit/access/grading workflows. `routes/web.php` adds the authenticated, throttled runner endpoint. `.env.example` documents disabled configuration defaults; the actual `.env` was not changed.

`resources/js/pages/lessons/edit.tsx`, `resources/js/pages/lessons/preview.tsx`, and `resources/js/pages/submissions/show.tsx` expose C# curriculum fields, locked study previews, and immutable submission evidence. Snapshot/verification scripts accept the `csharp` label. Dashboard, enrollment, reports, prerequisites, course management, and manual unlocking reuse the existing shared infrastructure.

## 3. Database changes and preservation

Nullable lesson fields: `starter_csharp`, `example_csharp`, `csharp_mode`, and `csharp_project_guide`. Progress and submissions gain nullable `csharp_code`, `csharp_project_url`, and `csharp_notes`. Existing `program_input`, expected results, quiz, assessment, rubric and progress fields are reused.

The encrypted pre-change snapshot is `storage/app/private/course-backups/before-csharp-20261012-214616.encrypted` (the filename reflects the host clock). Preservation verification confirms identical original-column values for **11 previous courses, 33 modules, 267 lessons, 4 users, 5 progress records, 4 submissions, 2 feedback records, 5 case studies, 67 activity logs**, and original education/enrollment/case-progress records. Normal MySQL now contains **12 courses, 36 modules and 285 lessons**. The separate local browser SQLite fixture also received the additive migration and only this course seeder. Account passwords were not reset.

## 4. Course record

Name **C# Programming**, language/short label **C#**, slug `csharp-programming`, College education level, difficulty Beginner to Advanced, editor `csharp`, provider `isolated-dotnet-service`, published and sequential by default. The seeder uses `firstOrCreate` for stable course/module/lesson identities, avoids duplicate records and preserves teacher-edited content on repeat runs. No separate application or management system was created.

## 5. Three modules

Beginner, Intermediate, and Advanced each contain six ordered lessons and an **18-question module assessment**. All lessons have five Quick Check questions, yielding **90 lesson quiz questions**. Each sixth lesson is a project with a **100-point rubric** using the requested weights.

## 6. Eighteen lessons

| Module | Ordered lessons |
| --- | --- |
| Beginner | Introduction to C# and .NET; Variables, Constants, and Data Types; Input, Output, and Operators; Conditional Statements and Loops; Arrays and Methods; Student Grade Calculator project |
| Intermediate | Strings and Collections; Classes, Objects, and Constructors; Encapsulation and Inheritance; Polymorphism, Abstract Classes, and Interfaces; Exception and File Handling; Student Record Management System project |
| Advanced | Advanced Collections and LINQ; Generics, Delegates, and Events; Asynchronous Programming; Database Programming with ADO.NET / EF Core Concepts; Application Architecture, Security, and Best Practices; C# Student Information System project |

Every lesson contains measurable objectives, concepts, source, explanation, starter code, guided practice, independent work, expected results, errors/debugging/security notes, a summary/challenge and completion requirements. Projects include milestones, input/schema guidance, testing checklists, rubric and submission instructions. Beginner examples use explicit `Program` and `Main`; async entry points appear when needed later.

## 7. C# code lab

The `Program.cs` editor supports source editing, Reset, Clear, Copy and Save. Source/evidence/input persist through reloads and preserve whitespace. Run/Stop and compiler/runtime-output panels use the configured service only; Run is disabled with a clear explanation when unavailable. Sample input/expected output are labeled instructional, and development/dependency guides can be expanded. The advanced complete-project lesson is `external` mode and cannot run as a one-shot console lab.

Submissions contain original source, optional HTTP(S) repository/project URL, notes and program input. Teacher review displays the exact `Program.cs` snapshot and rubric. ZIP uploads are not supported; use restricted project links and sanitized build/screenshots/test evidence. Credential-bearing stdin must never be saved for the authentication project.

## 8. Execution-provider implementation

The new C# adapter follows the existing VB.NET provider architecture while retaining independent configuration. It sends `language=csharp`, `filename=Program.cs`, source, stdin, console project type, provisioned SQLite-library requirements and an isolation contract to a private HTTPS endpoint. It never invokes a compiler or shell to run student code on Laravel.

Configuration: `CSHARP_SANDBOX_ENABLED`, `CSHARP_SANDBOX_VERIFIED`, `CSHARP_SANDBOX_URL`, `CSHARP_SANDBOX_TOKEN`, and `CSHARP_SANDBOX_VERSION`. Defaults are disabled/unverified, with preferred version `10.0`. .NET 10 is a supported LTS release according to [Microsoft's support policy](https://dotnet.microsoft.com/en-us/platform/support/policy). This does not claim .NET 10 is installed locally or that a provider exists.

Before enabling, the operator must independently verify the service: supported patched SDK and packages, network disabled, host secrets absent, per-job filesystem and database isolation, time/CPU/memory/process/output/storage limits, cleanup even after kill, authentication, no redirects, concurrent-user separation and abuse/rate controls. Test valid stdin/output, compiler and runtime errors, infinite loops, process spawning, memory/output/file exhaustion, traversal/host/environment access and network attempts. `VERIFIED=true` is an operator attestation, not automatic proof. The previously deferred .NET sandbox setup remains deferred.

## 9. Program input

The existing `program_input` field supplies stdin as text, preserving leading spaces and newlines. Values for `Console.ReadLine()` are entered one per line. Source is bounded at 200,000 characters; stdin and evidence notes at 20,000; optional URL at 2,048. Mocked adapter tests confirm exact source/stdin transport. Actual live stdin behavior requires the isolated service.

## 10. Compiler/runtime error handling

The adapter accepts only string `output`, `compilation_output` and `runtime_errors`, trims each to 65,536 bytes and bounds the complete provider response. Non-success/malformed/oversized responses fail generically; transport messages do not reveal private tokens/diagnostics. The client aborts long requests; the service itself must enforce execution deadlines. Errors and timeout requests do not award completion or change saved progress.

## 11. File isolation

The provider contract requests a disposable workspace, 16 MiB storage, workspace-only filesystem, cleanup and no network, with compilation/runtime/CPU/memory/process/output bounds. Those limits require enforcement by the actual remote OS/container supervisor; a relative filename or PHP payload is not isolation. File lessons explain bounded reads, fixed practice names, validated imports, resource disposal and cleanup after forced termination. Laravel never opens a student's submitted project files.

## 12. Database isolation

The ADO.NET example uses `Data Source=:memory:` and parameterized values on a separate SQLite connection. The full project uses a learner-owned `practice-sis.sqlite`, never CodeLab MySQL. The remote contract requires a disposable SQLite workspace with `Microsoft.Data.Sqlite` pre-provisioned; student runs must not receive package-restore network access. EF Core is taught as an ORM extension with DbContext/DbSet/SaveChanges concepts; the baseline code uses ADO.NET. SQLite's provider async methods execute synchronously, so lessons do not claim nonblocking database I/O. [Microsoft.Data.Sqlite async limitations](https://learn.microsoft.com/en-us/dotnet/standard/data/sqlite/async).

## 13. Dashboard integration

Shared College catalogue/dashboard filtering includes C# automatically. College now has **10 courses/240 lessons**, while High School remains **2 courses/45 lessons**. Education-level, publication, explicit enrollment and teacher assignment checks remain server-side; intentional cross-level assignment uses existing enrollment rules.

## 14. Admin integration

Existing management supports course publication, gating configuration, modules, ordering, lesson fields, starter/example source, expected results, sample test cases, activities, quiz/assessment questions, projects, progress and grading. C# drafts start unpublished with a console scaffold. Nullable C# fields are accepted for older courses so existing lesson editing continues to work.

## 15. Progress integration

Existing started/enrollment/module/activity/quiz/project events and versioned progress are reused. A quiz pass plus teacher approval of the current submission completes a lesson; projects also require rubric scores. Source, stdin or evidence edits supersede pending work; an old snapshot cannot approve new work. Approved source is read-only. Locked lessons remain available to read as previews, without quiz answer keys; existing manual unlock and configurable gating still apply.

## 16. Security protections

Source is stored as text, never executed by save/submit/check. The authenticated runner enforces course access, published prerequisites, console mode, size limits, a per-user run lock and route throttling before contacting the configured provider. HTTPS configuration rejects URL credentials, query/fragment tokens and redirects; provider credentials stay server-side. Teacher review remains authoritative rather than trusting browser output.

Curriculum teaches TryParse/domain validation, empty-sequence guards, generic collections, disposal, cancellation, parameterized SQL, minimal configuration and least privilege. The advanced reference uses salted PBKDF2 and constant-time comparison for a fictional private practice login; real projects need a supported reviewed identity/password-hashing policy, durable rate limits and role checks in protected services. The foundation is explicitly not production identity software, and environment variables are not described as a universal secret vault.

## 17. Test results

- Full `php artisan test --compact`: **150 tests, 148 passed, 2 skipped, 6,941 assertions**. Existing tests were retained.
- Eleven added C# course/provider tests cover content/idempotency and preservation; dashboard/access/enrollment/publication/gating; immutable source/stdin/evidence; stale/current approval, quizzes and rubric; teacher drafts/editing/assessments; invalid links; disabled/unverified runner; exact mocked request contract; malformed/oversized responses; locks, redirects and generic transport errors.
- All **18 authored references compiled** with Microsoft's Roslyn compiler against the installed .NET 8 compatibility assemblies; SQLite examples compile with the separate NuGet reference. This validates reference syntax/types, not .NET 10 deployment or runtime isolation. No reference or student programs were executed by this check. The downloaded validation tools are local ignored artifacts under `storage/framework/testing/csharp-validation`, not application dependencies or an online compiler.
- Curriculum structure, lesson order, objective/quiz counts, distinct choices/answer indices, project rubrics and key database/security source requirements passed.
- Production build, TypeScript check, project-native `vp check` formatting/lint, PHP format/syntax checks and `git diff --check` passed. Existing nonfatal runtime/font build warnings remain.
- Browser confirmed all three levels/18 lessons, disabled Run, source/stdin/evidence save/reload persistence, and clear dependency/expected-result guidance. Test source/input/notes were restored to the starter afterward.
- Normal MySQL preservation verification passed. Logs are `storage/framework/testing/csharp-all-test-results.json`, `csharp-build-results.log` and `csharp-curriculum-results.log`.

## 18. Remaining limitations and testing links

No secure .NET/C# service is currently provisioned or verified. Actual online compilation, runtime output, timeout/abuse resistance, filesystem/database isolation and .NET 10 compatibility must be tested on that service before enabling Run. The current .NET runtime is not an SDK; the separate reference compiler check does not create a student runner. Automated output/method/class tests are prepared through lesson test-case metadata but do not currently grade C# automatically. Teacher review and actual learner test evidence are required.

File/database persistence across one-shot runs is not promised. The advanced reference is a console foundation; its documented architecture/reporting/role-management/async extensions are student project requirements. Desktop and ASP.NET Core applications need their own suitable external development environment. CodeLab does not host those projects or silently provision credentials.

Normal Herd course: [C# Programming](http://studproj_html_css.test/courses/csharp-programming). Local browser fixture: [C# Programming](http://127.0.0.1:8017/courses/csharp-programming), [login](http://127.0.0.1:8017/login). Local fixture student `college.student`, teacher `browser.teacher`; both use `BrowserTest2026!`. These are local testing credentials, not production logins.

Changes remain local. No GitHub push or Hostinger deployment was performed.

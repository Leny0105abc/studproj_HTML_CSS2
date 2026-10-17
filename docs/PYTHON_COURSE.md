# Python Programming implementation report

Implemented in the existing Laravel/Inertia CodeLab application on October 11, 2026. The course is available at `/courses/python-programming` after signing in. No separate application was created and nothing was deployed to Hostinger.

## 1. Files modified

- `app/Http/Controllers/AiTutorController.php` — enforce course access before sending lesson context to a configured tutor.
- `app/Http/Controllers/CodeLabController.php` — course-scoped access/navigation; Python saving/submission; teacher-required completion; course/module/lesson start events; module numbering.
- `app/Http/Controllers/DashboardController.php` — accessible course cards and student-specific progress totals.
- `app/Http/Controllers/LessonController.php` — course-specific listings and teacher lesson editing; draft Python lesson creation.
- `app/Http/Controllers/ReportController.php` — student-specific progress denominators.
- `app/Http/Controllers/StudentController.php` — education-level input, accessible lessons, course-scoped gating and progress.
- `app/Http/Controllers/SubmissionController.php` — prevent approval of superseded or edited Python submissions.
- `app/Models/Lesson.php` — shared course relation and project/rubric casts.
- `app/Services/LessonCodeValidator.php` — preserve Python text and bypass HTML DOM validation for Python.
- `database/seeders/CurriculumSeeder.php` — associate the existing HTML curriculum with its shared course/modules; retain original lesson IDs and numbering.
- `resources/js/components/app-sidebar.tsx` — Courses navigation.
- `resources/js/pages/dashboard.tsx` — course cards and per-module progress.
- `resources/js/pages/lessons/index.tsx` — reuse lesson cards for courses, dynamic counts, course administration, and assessments.
- `resources/js/pages/submissions/show.tsx` — Python source review and browser execution through the reusable Python editor.
- `routes/web.php` — additive course, assignment, education-level, assessment, and lesson-management routes.

## 2. Files created

- `app/Http/Controllers/CourseController.php`
- `app/Models/Course.php`
- `app/Models/CourseEnrollment.php`
- `app/Models/CourseModule.php`
- `app/Models/EducationLevel.php`
- `app/Services/CourseAccess.php`
- `database/migrations/2026_10_11_000001_add_shared_courses.php`
- `database/seeders/PythonCourseSeeder.php`
- `database/data/python-course.json`
- `public/python-sandbox.html`
- `public/python-sandbox.js`
- `resources/js/components/course-management.tsx`
- `resources/js/components/module-assessment.tsx`
- `resources/js/components/python-editor.tsx`
- `resources/js/pages/code-lab/python.tsx`
- `resources/js/pages/courses/index.tsx`
- `resources/js/pages/lessons/edit.tsx`
- `scripts/create-python-curriculum.mjs`
- `scripts/snapshot-course-data.php`
- `scripts/verify-course-snapshot.php`
- `tests/Feature/PythonCourseTest.php`
- `tests/browser/python-runner.html`
- `tests/browser/router.php`
- `tests/browser/setup.php`
- `docs/PYTHON_COURSE.md`
- `docs/python-lab-preview.png`

The pre-existing untracked `others/` directory was not changed. Generated Vite assets and local safety/test databases are not source changes.

## 3. Database changes

Inspection found a single global lesson sequence and no existing education-level/course/module/enrollment tables. Added shared `education_levels`, `courses`, `course_modules`, and `course_enrollments` tables rather than Python-only duplicates.

Added nullable course/module references, a prerequisite, Python example/starter fields, project flag, and rubric to the existing `lessons` table. Added Python source and program input to the existing progress and submission tables. Existing progress, quiz, feedback, authentication, and submission records remain in their original tables.

The migration associated existing students with High School and existing lessons with the HTML & CSS course and their existing Basic/Moderate/Advanced levels. Legacy unique lesson numbers remain intact; Python reserves numbers above 15 and displays lesson numbering within each module.

Applied locally:

```powershell
php scripts/snapshot-course-data.php
php artisan migrate --force
php artisan db:seed --class=PythonCourseSeeder --force
php scripts/verify-course-snapshot.php
```

An encrypted safety snapshot exists under `storage/app/private/course-backups/`. Keep the original application key to decrypt it. It contains original columns/rows from affected learning tables and accounts; it is a data safety snapshot, not a full disaster-recovery backup of the server.

Snapshot verification confirmed exact preservation of all pre-existing columns and values: 4 users, 15 lessons, 5 lesson-progress records, 4 submissions, 2 feedback records, 5 case studies, 0 case-study progress records, and 67 activity logs. Added course metadata is intentionally new.

## 4. Records created

- Education levels: High School and College.
- Shared course wrapper: HTML & CSS with its existing three levels and 15 existing lessons.
- Published College course: Python Programming, slug `python-programming`, language Python, editor `python`, provider `pyodide`, difficulty Beginner to Advanced.
- Python modules: Basic, Moderate, Advanced, in order.
- Python lessons: 10 per module, 30 total, covering the requested progression.
- Each lesson: 3 measurable objectives, explanation, syntax reference, runnable example, starter scaffold, guided practice, activity, expected requirements/output, common errors, summary, and 5 quiz questions.
- Projects: Student Grade Calculator; Student Record Management System; Python Student Information System. Each includes milestones, requirements, sample output, submission guidance, and a 100% rubric (40/25/15/10/10).
- Each module assessment: 20 questions, covering all ten lessons by selecting two checks per lesson.

The Python seeder uses stable slugs and `firstOrCreate` inside a transaction. Rerunning it creates missing records without duplicating courses/lessons or replacing teacher edits. Authored source changes are intentionally not forced over existing database content; use teacher management to edit a seeded course.

## 5. Coding runner

Pyodide 0.27.7 runs in a fresh Web Worker inside an iframe with `sandbox="allow-scripts"` and no `allow-same-origin`. A private MessagePort connects the parent UI and sandbox. The classic worker is required for the verified opaque-origin browser configuration.

The editor provides Run, Stop, Reset, Clear, Copy Code, Save Code, Program Input, and Output. Newline-separated input is consumed by `input()`; exhausted input produces EOFError. Runtime loading has a 60-second timeout, execution has a 12-second timeout, and output is capped at 20,000 characters. Each run starts with a new virtual filesystem and database environment.

SQLite is loaded when used. Files and custom modules live in the browser virtual filesystem. API lessons use simulated JSON responses. No Python interpreter or student-code execution process runs on Laravel or Hostinger. The implementation follows the official [Pyodide stream APIs](https://pyodide.org/en/0.27.7/usage/api/js-api.html) and [package-loading guidance](https://pyodide.org/en/0.27.7/usage/loading-packages.html).

Formative validation parses Python ASTs for required functions/variables, supports output comparison with normalized whitespace, and runs configured function test cases. The grade-calculator project includes two function checks. Teacher review remains authoritative; browser results are never accepted as proof of completion.

## 6. Administrative changes

The application's existing administrative role is `teacher`; no replacement authentication or new admin role was introduced.

From Courses → Manage Course, teachers can edit descriptions/names, publish/unpublish, configure sequential gating, reorder modules, edit assessment JSON, assign a course, and set a student's education level. Reordering modules aligns lesson ordering and rejects conflicts with explicit prerequisites. Existing individual manual unlocks remain supported.

Lesson editing includes title, level, course position, publication, project flag, objectives, explanations, examples, starters, activities, expected output, common errors, quizzes, formative validation settings, rubrics, and prerequisites. Archived lessons remain available to teachers for republishing. Newly created Python lessons start as drafts so incomplete material is not automatically exposed.

Python submissions appear in the existing review queue. Teachers can read and run submitted source through the same sandbox, approve it, or request revisions. A passed quiz is required before approval when a quiz is configured. Superseded or edited source cannot be approved as the current work.

## 7. Student dashboard and access

Students see accessible course cards, overall progress, and Basic/Moderate/Advanced progress. College students can access Python through their education level. High School students do not automatically see or directly access Python; a teacher can explicitly assign it. Unpublished courses and lessons are blocked on the server, including save, submit, and quiz routes.

Starting a lesson creates/starts enrollment and reuses existing lesson progress. Existing users retain High School access. Changing education level does not erase prior work or explicitly enrolled courses.

## 8. Progress tracking

Existing lesson status, start/save/submission/completion times, optimistic save version, quiz score, and quiz/activity timestamps are reused. Added enrollment start time and module-assessment results. Course/module/lesson starts also use existing activity logs. Project completion is the existing completion status on lessons marked as projects.

Each course has an independent prerequisite sequence. Course/module totals, student reports, and dashboard progress use the student's accessible lessons. Python completion requires submission, passing the quiz, and teacher approval; client-side execution cannot unlock another lesson. Teacher-approved work remains read-only.

## 9. Security considerations

- No PHP `exec`, `shell_exec`, `system`, or `passthru` was introduced to execute student Python.
- Opaque iframe origin isolates application cookies, DOM, and credentials from Python's JavaScript bridge.
- Content Security Policy restricts runtime scripts/connections to the pinned Pyodide distribution, permits only blob workers, and denies forms and other resource types.
- Browser testing confirmed student Python could not fetch the authenticated application dashboard.
- Workers are terminated on completion, failure, Stop, and timeout. Repeated worker messages cannot reset the execution timeout.
- Server authorization protects all learning operations independently of visible UI locks.
- Quiz answer keys are withheld from student lesson/course payloads. Teachers receive keys for editing; quiz feedback is returned after submission.
- Save version checks and stale-submission review checks protect current work.
- Educational SQLite/files never access the application's production database or server filesystem.

## 10. Verification

- `php artisan test`: 79 tests; 77 passed; 2 existing tests skipped; 954 assertions. No tests were deleted.
- TypeScript: `npm run types:check` passed.
- Vite production build: `npm run build` passed.
- Laravel Pint checks passed.
- Format/lint checks for changed frontend files passed. A full-repository check initially reported existing formatting issues in unrelated files; those files were not reformatted.
- `git diff --check` passed.
- Browser: all 30 authored Python examples executed successfully, including custom modules and SQLite.
- Browser: print, multiline input, loops, virtual text files, SQLite, AST/function test cases, the infinite-loop timeout, and application-network blocking verified.
- Integrated UI in an isolated SQLite database: College dashboard, 30 ordered lessons, module progress, locked navigation, editor execution, saved code across reload, activity submission, and saved 5/5 quiz score verified.
- Feature tests: idempotence, preserved HTML content, teacher edits, College/High School assignment rules, publication checks, independent gating, version conflicts, saves, submissions, quizzes, teacher approval, stale-review rejection, archived-content management, module reordering, and assessment scoring.
- The normal local MySQL database was migrated and seeded, with original data verified against the encrypted snapshot. Browser fixtures used a separate `storage/framework/testing/python-browser.sqlite` database and did not create accounts or progress in the normal application database.

## 11. Remaining limitations and deployment

- The pinned runtime is downloaded from jsDelivr; dependable fully offline operation requires a separately provisioned local Pyodide distribution and corresponding sandbox CSP changes. First-run loading can be noticeable.
- Run files and SQLite data are temporary. Demonstrate saving/reading in a single run; persistent student code and progress are saved by Laravel. Virtual file export/import and persistence across runs are not implemented.
- API exercises are simulated. General external network requests and API credentials are not exposed.
- Input is supplied before running, rather than through a live terminal prompt.
- One Python source editor is provided. Custom modules can be written as virtual files by the program; a separate multi-file authoring UI is not included.
- Python completion uses teacher review. Fully automatic trusted grading would require an isolated execution service; accepting browser-reported success would be insecure.
- Rubrics are displayed in lesson content; the existing feedback/approval workflow is used rather than introducing a separate numeric grading system.
- Structured quiz/rubric/validation/assessment editing currently uses JSON in the teacher UI.
- Module assessments reuse lesson questions and record a score/pass result; they are not additional prerequisites for the next module.
- Changes are installed locally, not deployed to Hostinger. To install elsewhere, back up the database, deploy these source/public assets, run the additive migration and only `PythonCourseSeeder`, and build the frontend. Do not run `migrate:fresh` or the development `DatabaseSeeder` against existing student data.

The screenshot `python-lab-preview.png` shows the integrated lesson editor using disposable browser-test accounts.

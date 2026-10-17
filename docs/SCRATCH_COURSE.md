# Scratch Programming implementation report

Added to the existing Laravel/Inertia CodeLab on October 11, 2026. Test course: `http://127.0.0.1:8017/courses/scratch-programming`. Sign in with `highschool.student` / `BrowserTest2026!` on the isolated test site. Teacher review uses `browser.teacher` / `BrowserTest2026!`. The normal local application also has the course; its existing accounts and passwords were preserved. Nothing was deployed to Hostinger.

## 1. Files created

- `app/Http/Controllers/ScratchWorkspaceController.php`
- `database/migrations/2026_10_11_000002_add_scratch_workspace_fields.php`
- `database/seeders/ScratchCourseSeeder.php`
- `database/data/scratch-course.json`
- `scripts/create-scratch-curriculum.mjs`
- `resources/js/components/scratch-blocks.tsx`
- `resources/js/components/scratch-project.tsx`
- `resources/js/pages/code-lab/scratch.tsx`
- `tests/Feature/ScratchCourseTest.php`
- `docs/SCRATCH_COURSE.md`
- `docs/scratch-workspace.png`

## 2. Files modified for Scratch

- `app/Http/Controllers/CodeLabController.php`: dispatch Scratch workspace, share course/lesson starts and quizzes, prevent HTML submission bypasses, require teacher approval for completion.
- `app/Http/Controllers/CourseController.php`: validate module edits against the course's own names/count.
- `app/Http/Controllers/DashboardController.php`: dynamic course-module progress and correct Scratch lesson numbering; teacher module totals across courses.
- `app/Http/Controllers/LessonController.php`: dynamic module labels, Scratch drafts, structured block editing, and block content in previews.
- `app/Http/Controllers/StudentController.php`: teacher student-detail module totals include Scratch.
- `app/Http/Controllers/SubmissionController.php`: current-version review checks for Scratch and bounded project rubric scoring.
- `app/Models/Lesson.php`: Scratch identification, shared teacher-review requirement, block JSON cast.
- `app/Models/Submission.php`: rubric-score JSON cast.
- `routes/web.php`: additive Scratch save/submit endpoints under existing student authorization.
- `resources/js/pages/dashboard.tsx`: teacher module totals.
- `resources/js/pages/students/show.tsx`: course/module totals instead of fixed five-lesson denominators.
- `resources/js/pages/lessons/index.tsx`: course-specific module labels and lesson creation options.
- `resources/js/pages/lessons/edit.tsx`: block JSON and course-specific module choices.
- `resources/js/pages/lessons/preview.tsx`: visual Scratch block sequences.
- `resources/js/pages/submissions/show.tsx`: Scratch link/notes review and project grading fields.
- `scripts/snapshot-course-data.php`, `scripts/verify-course-snapshot.php`: support Scratch-labelled encrypted snapshots and shared course/enrollment tables.
- `tests/browser/setup.php`: seed Scratch when initializing the isolated fixture database.

Existing work from the Python integration and prior lesson-page fixes remains in place. The pre-existing untracked `others/` directory was not changed.

## 3. Database changes and preservation

No new course-management or progress tables were introduced. The additive migration adds:

- `lessons.block_examples`: nullable JSON of named diagrams, sprite labels, and category/text block instructions.
- `student_lesson_progress.scratch_project_url`, `scratch_notes`: saved project details.
- `submissions.scratch_project_url`, `scratch_notes`: versioned review details.
- `submissions.rubric_scores`: nullable JSON of earned rubric points.

Applied to the local normal database and the separate browser fixture database. Only `ScratchCourseSeeder` was run; no account or development database seeder was run against the normal database.

```powershell
php scripts/snapshot-course-data.php scratch
php artisan migrate --force
php artisan db:seed --class=ScratchCourseSeeder --force
php scripts/verify-course-snapshot.php scratch
```

Encrypted snapshot: `storage/app/private/course-backups/before-scratch-20261011-100704.encrypted`. This is a learning/account data safety snapshot, not a full server backup; retain the application key to decrypt it.

Snapshot verification confirmed the exact pre-existing values in all snapshotted columns: 4 users; 45 HTML/Python lessons; 5 progress records; 4 submissions; 2 feedback records; 5 case studies; 0 case-study progress records; 67 activity logs; 2 education levels; 2 courses; 6 modules; 0 course enrollments. Newly added Scratch rows and nullable fields are intentionally new.

## 4. Course record

Published High School course, Scratch Programming, slug `scratch-programming`, difficulty Beginner to Advanced, language Visual / Block-Based Programming, editor `scratch`, integration provider `scratch-link`. Uses the existing High School education-level row.

High School students see HTML & CSS and Scratch. College students see Python; Scratch access requires explicit enrollment/assignment. Server access checks apply to course pages, previews, workspaces, saves, submissions, quizzes, and assessments.

The seeder uses stable slugs and `firstOrCreate` inside a transaction. Rerunning creates missing records without duplicating courses or lessons and preserves teacher edits. Regenerating authored JSON does not force content changes into an already seeded database; use teacher editing for subsequent changes.

## 5. Modules, lessons, activities, and assessments

Three ordered modules: Beginner, Intermediate, Advanced. Each contains ten lessons in the requested order, for thirty total. Legacy global lesson numbers remain unique; local Scratch numbering is 1–10 within each module.

Every lesson includes three measurable objectives, concepts, explanations, a structured visual block sequence, guided practice, an independent activity, expected behavior, specific testing guidance, mistakes, summary/challenge, and five multiple-choice questions. Questions include concept identification, behavior prediction, debugging, block category identification, and practical test selection. Total: 150 lesson questions.

Each module has a 20-question assessment using two conceptual/practical checks from each lesson. Results use existing enrollment assessment storage. Students must complete the module before taking its assessment; assessments are not extra prerequisites for the next module.

Projects: Catching Game; Maze Adventure Game; Complete Scratch Game. Each includes required features, a planning worksheet, development milestones, sample block design, testing checklist, and submission instructions. Rubric: Functionality 30; Concepts 25; Creativity/Design 15; Logic/Problem Solving 15; Organization 10; Testing/Debugging 5.

## 6. Scratch-specific UI

The lesson workspace offers Lesson, Blocks, Activity, Project, and Quiz sections. Color-coded, category-labelled block diagrams render database content as illustrative instructions, rather than showing Python or an HTML Run/Output editor. Diagrams are explicitly labelled as non-executing instructional representations; the screenshot is of the actual CodeLab UI.

Project opens the [official Scratch editor](https://scratch.mit.edu/projects/editor/) in another tab and explains what CodeLab saves. No third-party GUI scripts, fabricated screenshots, or unofficial embedded execution provider were installed.

Locked lessons retain readable previews. Reading a preview does not create progress or unlock activities. The sidebar Lessons route still opens the existing HTML path for High School; Courses contains both High School course cards and provides Scratch's learning path.

## 7. Submission and grading

Students save a project-page URL and notes, or save notes alone as a draft. Submitting requires an exact HTTPS Scratch project URL and at least 20 characters of notes; explain sprites, blocks, tests, and results. URL format is restricted to `https://scratch.mit.edu/projects/<numeric-id>/`. A trailing slash is normalized. This validates the link format, not ownership, existence, sharing status, or project correctness.

The shared progress version protects concurrent saves. Editing details supersedes pending submissions. Submission snapshots contain the URL and notes and appear in the existing teacher queue. They do not snapshot the externally hosted project's file contents.

Teachers open the project on Scratch, inspect behavior and blocks, and approve or request revisions using existing feedback. Approval requires a passed quiz and submitted activity. Scratch projects additionally require a score for every rubric category, bounded by its maximum points; the total and a project-graded event are stored. Normal lesson approval uses existing feedback/status without numeric grading.

Only the latest matching submission can be reviewed; edited/superseded versions are rejected. Teacher-approved work is read-only. Students see feedback and any project grade in the Project section.

## 8. Progress integration

Course/module/lesson starts reuse enrollments, progress, and activity logs. Draft saves, activity/project submissions, quiz scores, teacher completion, and project grades reuse shared tables. Course cards show overall and Beginner/Intermediate/Advanced progress. Teacher dashboards and student details show actual course-module totals.

Sequential gating remains server-enforced. Teacher course settings can disable it, and existing individual manual unlocks work. Passing a Scratch quiz or submitting a link cannot automatically award completion; teacher approval unlocks the following lesson.

## 9. Admin integration

Uses the existing `teacher` role and management UI. Teachers can publish/unpublish the course, configure gating, assign cross-level access, manage module order/assessment JSON, create draft Scratch lessons, edit lesson content/positions/prerequisites/quizzes/rubrics, and review/grade submissions.

Block examples use a JSON array of objects with `name`, `sprite`, and `blocks`; every block has `category` and `text`. Categories are Motion, Looks, Sound, Events, Control, Sensing, Operators, Variables, Lists, and My Blocks. Requests validate categories, lengths, and diagram sizes. Data is stored in lessons, not hard-coded in a template.

## 10. Security

- Scratch code never executes on Laravel, Hostinger, or the CodeLab origin.
- Links are HTTPS on the exact Scratch domain with numeric project paths; alternate hosts, JavaScript URLs, query payloads, and spoofed domains are rejected.
- Laravel does not fetch submitted URLs; no server-side URL request or unrestricted embedded content is introduced.
- External links use `noopener noreferrer` and no-referrer policy; rendered notes/block text are escaped React text.
- Existing authentication, roles, CSRF, course access, publication checks, gating, and save versions protect operations.
- The existing HTML save/check/submit routes cannot be used to bypass Scratch's project workflow.
- Rubric scores are validated against the lesson's categories and maxima; obsolete submissions cannot complete current work.
- File uploads are disabled for Scratch. No `.sb3` files or screenshots are accepted or served by these endpoints.
- Cloud-variable availability depends on Scratch account/device capabilities, and CodeLab supplies no cloud storage. See the [official Scratch cloud-variable guidance](https://mitscratch.freshdesk.com/en/support/solutions/articles/4000156901-how-can-i-make-a-cloud-variable-).

## 11. Verification

- `php artisan test`: 85 total, 83 passed, 2 existing skipped, 1,685 assertions. No original tests were removed or relaxed.
- TypeScript check and Vite production build passed.
- Laravel Pint and changed-frontend formatting/lint checks passed.
- `git diff --check` passed.
- Feature tests cover all thirty lessons, module counts/order, five-question quizzes, idempotence, retained teacher edits and existing course data, High School/College access, assignments, publication, gating/previews, dashboard totals, draft creation, block editing, assessments, URL validation, HTML bypass rejection, version conflicts, revision/resubmission, stale review rejection, rubric bounds, teacher grading/completion, and read-only approved work.
- Browser on the isolated test database: Scratch course with ten lessons per module; correct Beginner/Intermediate labels; lesson workspace and colored blocks; project draft saving and persistence after reload; five-question quiz saving 5/5 while the next activity remains locked.
- Existing normal database records verified against the encrypted snapshot after migration/seeding.

## 12. Placeholders, limitations, and deployment

- The editor integration is an explicit launch/link workflow. Embedded Scratch GUI/VM execution, drag-and-drop editing inside CodeLab, and automatic block/project validation require future integration. The current diagrams are teaching aids, not an emulator.
- `.sb3` uploads, screenshot uploads, immutable project-file snapshots, and local project execution are not implemented. A future upload feature needs private storage, ZIP/project validation, bounded compressed and expanded sizes, and controlled downloads.
- Students need an accessible shared project link for the current submission workflow. Scratch sharing and cloud features depend on its platform/account capabilities; teachers must arrange an alternative review outside this workflow when a student cannot share. CodeLab does not create Scratch accounts or publish projects.
- Project URLs may change their content or become unavailable. Teachers must inspect the currently visible project; local version protection covers submitted link/notes, not external project edits.
- Saving in CodeLab does not save the live Scratch editor or guarantee cloud persistence. Students must save in Scratch or download their project there.
- Module assessments reuse lesson questions; editing one question bank does not automatically rewrite the other.
- Structured content editing uses JSON. Assessment scores record a pass result but do not gate the next module.
- Installed locally; not deployed to Hostinger. Back up the target database, deploy/build the source, run `php artisan migrate --force`, then only `php artisan db:seed --class=ScratchCourseSeeder --force`. Do not run `migrate:fresh` or the development `DatabaseSeeder` on existing student data.

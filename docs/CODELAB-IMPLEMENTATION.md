# CodeLab implementation report

## 1. Inspection and implementation approach

The inspected installation uses Laravel **13.33.0** from the lockfile (Composer constraint `^13.17`), PHP 8.3+, Fortify, Inertia, React 19, TypeScript and Tailwind CSS. Authentication uses usernames, hashed passwords, temporary account passwords, required password changes, rate-limited login and the existing account/session and two-factor settings. Roles were teacher and student; this release adds admin without replacing authentication.

Existing tables included users, sessions, passkeys, lessons, case studies, student lesson progress, case-study progress, submissions, teacher feedback, activity logs, cache and queue tables. Lessons used global numbers, Basic/Moderate/Advanced groups, ordered prerequisites, structured instructional text, HTML/CSS examples, starters, coding checks and five-question JSON quizzes. Progress stored each student's HTML/CSS, save version, activity/quiz passing state, manual unlock and completion. Submissions retained versioned work and teacher reviews. The frontend used a multi-file HTML/CSS editor, autosave, sandboxed iframe output and existing components. Teachers could create/manage accounts, unlock lessons, review submissions and export reports.

The baseline suite contained 72 tests: 70 passed and two skipped. Main risks were global lesson numbering and progress totals, legacy teacher-wide permissions, quiz assumptions fixed to five questions, seeders overwriting customized content, and untrusted execution for new languages. The implementation adds associations first, centralizes access/progress, retains the existing HTML workspace, then adds reusable management and learning UI. Development used an isolated checkout and SQLite database; the original installation and production database were not migrated.

## 2. Summary of changes

CodeLab now has database-driven High School and College programs, courses shared across programs, ordered modules, teacher assignments, explicit enrollments and course-specific progression. The migration seeds 15 initial courses: four High School courses and eleven College courses. Future courses can be created in the admin interface. Existing HTML/CSS is the only published course; other languages are drafts with Basic/Intermediate/Advanced modules ready for content. The original HTML module name Moderate is retained.

## 3. Migration

`database/migrations/2026_10_09_000001_add_programs_and_courses.php` adds:

- `education_levels`, `courses`, `course_education_level`, `course_teacher`, `course_levels` and `course_enrollments`.
- `activities`, `activity_responses`, `announcements`, `achievements` and `achievement_user`.
- Program/school/academic-program/picture fields on users; course/module/prerequisite/content/source/quiz configuration on lessons; source code/access time/attempts on progress; source code on submissions; course/difficulty/points/due date on case studies; IP address on activity logs.
- Foreign keys, uniqueness and lookup indexes for course/module/enrollment associations.

The migration backfills associations rather than copying lessons or recreating accounts. It retains IDs, content, passwords, progress, saves, quiz results, submissions and feedback. Upgrade and rollback preservation are tested against the actual old schema. Rollback disables SQLite foreign-key checks while rebuilding legacy tables to prevent cascaded deletion of old progress. New platform data still requires backups for recovery. See [upgrade instructions](CODELAB-UPGRADE.md).

## 4. Models

New models are `EducationLevel`, `Course`, `CourseLevel`, `CourseEnrollment`, `Activity`, `ActivityResponse`, `Announcement` and `Achievement`. `User`, `Lesson`, `CaseStudy` and `ActivityLog` gain relationships and explicit allowed fields. Existing progress, submission and feedback models continue to be used. HTML/CSS detection is centralized in `Lesson::usesLegacyLab()` rather than copied throughout new lesson pages.

## 5. Routes

- Public: `/`, `/courses`, `/programs/{slug}`.
- Learning: `/my-courses`, `/courses/{slug}`, `/courses/{course}/{module}/{lesson}`, `/learn/{lesson}` and save/submit/complete/quiz actions; `/activities`; `/learning-profile`.
- Management: `/admin`, `/admin/{resource}`, `/admin/lessons/{id}/duplicate`, `/admin/progress`, `/admin/audit-log`, activity review and authorized private file download.
- Resources: education-levels, courses, modules, lessons, activities, projects, enrollments, students, teachers, announcements and achievements.
- All original lesson, code-lab, case-study, students, submissions, reports and account-settings endpoints are retained. Old HTML lesson URLs still work.

## 6. Controllers, policies and services

New controllers: `CourseController`, `ManagementController`, `LearningController`, `ActivityController`, `LearnerProfileController`, `PlatformDashboardController` and `PlatformReportController`.

Updated controllers: `DashboardController`, `LessonController`, `CodeLabController`, `CaseStudyController`, `CaseStudyLabController`, `StudentController`, `SubmissionController`, `ReportController` and `AiTutorController`. They preserve legacy handlers while checking course access and supporting the new structures.

`CoursePolicy`, platform-admin/manage-student gates, `CourseAccess`, `LessonAccess` and `CourseProgress` enforce program visibility, explicit enrollment, suspension, assigned-teacher management, module publishing, per-course prerequisites and completion. Progression can require completion, activity, quiz, teacher unlock or no gate. The `codelab:admin` command promotes an existing active teacher. The existing password-change middleware now also covers generated teacher credentials.

The resource schema in `config/platform.php` supplies whitelisted management fields and validation. It is a fixed resource registry, not an arbitrary model/table endpoint. HTML course routing/editor configuration is protected. Moving lessons with progress to another course or altering their recorded quizzes is rejected; duplication creates a draft without progress. Archive actions preserve records. The globally unique legacy lesson number is retained for compatibility; `position` is the course-specific order.

## 7. UI changes

The public landing page introduces CodeLab, both programs, featured courses and the learning workflow. Catalog and program pages include search and pagination. The student dashboard shows eligible courses, progress, completion totals, a continue action and teacher feedback. Course pages group available/current/completed/locked lessons by module. Students have activities, projects and an editable learning profile; administrators have a program dashboard, reusable resource forms, rich content/quiz editing, enrollment management, course progress filters and audit history.

Reusable components include CourseCard, Pagination, ContentEditor, LessonContent, QuizEditor, CodePlayground and ProjectWorkspace. The existing layout, authentication UI, badges, buttons, cards and legacy HTML/CSS editor remain in use. New lesson content supports objectives, explanations, examples, source practice, flexible quizzes, reflection and next-lesson navigation. Written/file activities support scores, feedback and revisions. Generic code and projects support source saving and teacher review without server execution.

## 8. Preserved features and security

Preserved: original accounts and authentication, HTML/CSS lesson bodies and IDs, code/run/output, original coding checks and 4/5 quizzes, saved work and versions, multi-file final lesson, projects/case studies, teacher feedback, progress, manual unlocks, submission history, CSV/print reports, optional AI tutor and LAN setup.

Server authorization applies to reading, saving, assessment, review and private downloads. Students cannot change roles/program access through profile fields; teachers cannot manage unassigned courses. Draft/archived content and suspended enrollments block learner access. Mass assignment is restricted; validation, CSRF, hashed credentials and existing authentication throttling remain in place. Uploaded files use private storage, type/size checks and authenticated download. CSV values that begin with spreadsheet formula characters are escaped.

Lesson Markdown renders through React without trusting raw HTML. HTML output uses an iframe without scripts. JavaScript uses an opaque sandbox iframe and a Blob worker with a restrictive content-security policy, no network requests and a two-second cutoff. No arbitrary student PHP, SQL, Java, Python or system command runs on the host. Unimplemented providers display an unavailable state. Browser JavaScript is a teaching runtime; it is not a server sandbox or a guarantee against browser resource exhaustion.

## 9. Verification

Checks run in the isolated checkout: full Pest suite (**85 passed, two skipped; 753 assertions**), TypeScript check, production frontend build, Pint and whitespace/diff checks. Added platform tests cover migration/backfill/rollback data preservation, program-specific visibility, cross-program enrollment, suspension/drafts, independent course prerequisites, configurable gates, source ownership/versioning, quiz limits, teacher review, multi-program creation, module validation, lesson duplication, teacher assignment, private uploads, profile privilege injection and locked activity access.

Browser checks exercised the landing page at a narrow viewport, student dashboard/course navigation, JavaScript lesson console, infinite-loop termination, source save and administrator course creation. The preview uses only a separate SQLite database and synthetic demonstration data. See the pull request validation section for the final suite counts. Automated database checks ran on SQLite; rehearse upgrade/rollback on the actual production database engine before release.

## 10. Remaining improvements

- Integrate audited Pyodide/SQL or external isolated runners as appropriate; the provider fields are prepared but no provider credentials/runtime are wired up.
- Integrate Scratch's block editor for interactive block projects.
- Achievements and announcements have management/schema foundations. Automatic awards, certificates and more complete student feeds are future enhancements.
- Add richer assessment analytics, exports for new course-specific reports and configurable automated graders. Existing CSV/print reports remain available.
- Rehearse production upgrade with a backup copy, verify customized HTML/CSS exercises and conduct lab concurrency/load testing. No production deployment is included in this change.

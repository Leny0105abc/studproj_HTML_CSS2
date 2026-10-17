# Explicit student education levels

Teachers now choose **High School** or **College** when creating a student. The choice is stored in the existing `users.education_level_id`; grade/year and program do not determine classification. Open [Students](http://studproj_html_css.test/students) or [Education review](http://studproj_html_css.test/students/education-review).

## Root cause, established before implementation

The current application stores students as `users` with `role=student`. It already has an `education_levels` table, a nullable foreign key on users and a primary education-level foreign key on courses. There is no separate student/profile/class/program system in this application's schema. Grade and section are text columns on users.

Three independent behaviors caused the inconsistent appearance:

1. `StudentController::store()` accepted a nullable education level, while the Add Student modal had no education-level input. The shared account service accepted omission too. New manual accounts could therefore be unclassified.
2. `StudentImportController` accepted a blank batch-level selection. Its default option deliberately matched manual creation, also producing null rather than an explicit classification.
3. `Course::accessibleTo()` gave null-level students an HTML/CSS fallback and allowed enrollment to override course-level restrictions. A historical migration (`2026_10_11_000001_add_shared_courses.php`) assigned then-existing students to High School. Separately created college test accounts had explicit College IDs. These records consequently produced different course catalogues without a clear choice in Add Student.

There was no grade/year inference or database default silently setting new accounts to College. The nullable database column had no College default. Some accounts were explicitly College, older records were explicitly High School, and subsequent manual/import accounts could have no assigned level. The original migration is retained as historical evidence; it was not rerun or rewritten to reclassify existing data.

## Authoritative field and account creation

`StudentEducation` supplies common server-side academic validation. `StudentAccountService::create()` independently enforces it so normal callers cannot bypass the requirement. The controller and importer both use that service. Validation accepts only the IDs whose slugs are `high-school` or `college`.

The Add Student modal has a required visible Education Level selector, starting at **Select Education Level**. High School shows Grade Level and Section. College shows Year Level, optional Program and Section. Program is optional because no prior College workflow required it and there is no programs table to reuse. The supporting grade/year remains in the existing `grade_level` column; `program` is a new nullable user column. There is no duplicate profile or class architecture.

Grades accept 7–12 or Grade 7–Grade 12. College years accept Year 1–Year 6, 1st Year–6th Year and equivalent written ordinal forms. Crossed values such as College / Grade 11 fail validation. High School cannot retain college-program data through this workflow. Names, generated usernames, password hashing, temporary-password generation and first-login password change behavior are reused. No default enrollment or fabricated progress is added.

Successful creation displays the chosen education level with the existing one-time credentials. Safe operational logs record actor ID, student ID and education-level ID, with the logger timestamp; passwords are never logged.

## Editing, list and profile

The Students list now displays an Education Level badge and any college program. An Education review action links to unresolved legacy classifications and incompatible enrollments.

Student details display the level, grade/year, program and section. The **Education and class** form edits the existing fields. If the selected level changes and the student has any enrollment, progress or submission, the server requires acknowledgement of the course-access warning. The update locks the student record in a transaction and preserves usernames, passwords, enrollments, progress, submissions and feedback. Restoring a compatible level restores access to the student's retained work.

The previous course-management shortcut now opens the student profile for a complete, validated academic edit rather than updating only a level while retaining a conflicting grade. Its existing `/students/{student}/education` endpoint delegates to the same validated controller action. Teacher-only authorization remains.

## Import

Download a new template from [Import Students](http://studproj_html_css.test/students/import). Each row must include `education_level`. A batch selector cannot supply an omitted value. Mixed High School and College rows are supported in one file.

Controlled case-insensitive values are High School, high school, high-school, College and college. Leading/trailing spaces are trimmed; unrelated values are rejected. Missing headers reject the file. Blank/unknown row values and inconsistent grade/year combinations make the row invalid. Preview shows the education level beside each student. Optional `program` and existing optional `lrn` are retained. The existing preview, duplicate detection, transaction, one-time credentials, error-report, role enforcement and encrypted temporary-data protections continue to apply.

Current template columns: first_name, middle_name, last_name, username, education_level, grade_level, program, section, email, password, status, lrn. A single name column can still replace the name parts. Old templates need the required education_level column before upload.

## Course and resource authorization

`Course::compatibleWith()` requires a valid student level matching either the existing course primary level or an explicit entry in `course_education_levels`. This new table stores additional/shared audiences alongside the existing course architecture. The migration records the already-established High School and College audience of Introduction to Programming; its idempotent seeder maintains that association for fresh installations. The course's original primary level and every existing course row remain unchanged. Shared courses are labelled High School & College and grouped separately in the catalogue.

`Course::accessibleTo()` now requires publication and compatibility for students. Enrollment cannot bypass compatibility. Teachers retain their existing unrestricted course-management access, including unpublished material. The application currently has no separately authorized admin role; no new role or privilege expansion was introduced.

The existing `CourseAccess` entry point carries this policy into lessons, previews, activities, quizzes, projects and language workspaces. The assign-course endpoint rejects incompatible or unclassified students, and its student picker offers compatible students. HTML/CSS case studies now require compatibility with the HTML/CSS course. Private WordPress evidence downloads require both ownership and current lesson/course access; teacher access to historical evidence is retained. Existing teacher-only submission and reporting routes retain their permissions.

Unclassified legacy accounts can still log in, but receive no level-specific courses or resources. Their dashboard/list/profile identify **Education Level Not Assigned** rather than assuming a level. Existing enrollments never override this safe state.

## Existing-data results

An encrypted snapshot was taken with `php scripts/snapshot-course-data.php education` before migration. `php scripts/verify-course-snapshot.php education` compared every original column and row afterward and confirmed preservation of:

| Data | Original records preserved |
|---|---:|
| Users, including credentials and existing classifications | 9 |
| Lessons | 372 |
| Student lesson progress | 6 |
| Submissions | 4 |
| Teacher feedback | 2 |
| Case studies | 5 |
| Case study progress | 0 |
| Activity logs | 71 |
| Education levels | 2 |
| Courses | 16 |
| Course modules | 48 |
| Course enrollments | 1 |

The eight existing student accounts include five classified students and three requiring manual assignment. None was automatically reclassified. The review page lists them with their existing academic details. Their teacher should choose the authoritative level and verify their grade/year there.

One retained enrollment requires review: an unclassified student enrolled in HTML & CSS. The student currently has no education level. The enrollment is preserved, access is restricted until a compatible level is explicitly assigned, and the issue appears in Cross-Level Enrollment Review. This is not evidence that the student belongs to College or High School.

Browser sign-in verification subsequently updates the teacher's last-login timestamp through the existing authentication flow; it does not change student credentials or records. No demonstration students were added to the normal database for browser checks.

## Files and migration

Created:

- `app/Services/StudentEducation.php`
- `database/migrations/2026_10_17_000001_explicit_student_education.php`
- `database/seeders/EducationLevelSeeder.php`
- `resources/js/components/student-academic-fields.tsx`
- `resources/js/components/student-education-editor.tsx`
- `resources/js/pages/students/education-review.tsx`
- `tests/Feature/StudentEducationTest.php`
- This report and browser screenshots.

Modified:

- StudentController, StudentImportController and StudentAccountService: explicit validation, shared creation, validated academic editing and review.
- StudentImportService: mandatory per-row classification and preview fields.
- User and EducationLevel models: relationships; Course model: compatible audience and shared labels.
- CourseController, LessonController, DashboardController: compatible assignment, listing, access and labels.
- CaseStudyController, CaseStudyLabController and WordpressWorkspaceController: course-compatible resources.
- Students index/show/import pages and CourseManagement/Courses pages: visible levels, conditional fields, previews and shared-course presentation.
- `routes/web.php`: teacher-only `GET /students/education-review`, placed before dynamic student resource routes.
- DatabaseSeeder: idempotent level seeding, explicit High School development fixture and preservation of any existing `mia.student` record. The full development account seeder was not run on the existing database.
- IntroductionProgrammingCourseSeeder: preserve the established shared audience with `syncWithoutDetaching`.
- UserFactory: explicit High School test-fixture classification; deliberately unclassified tests specify null.
- Snapshot scripts: recognize the education backup label.
- StudentImportTest: fixtures explicitly provide their level while retaining its validation and preservation checks.
- Course regression tests: cross-level enrollment now asserts denied access **and retained enrollment**, then uses a compatible student for subsequent gating/publication checks. The unclassified programming outsider fixture explicitly specifies null. No tests were deleted or disabled.

The additive migration was applied locally using its explicit path. Existing users.education_level_id remains nullable for legacy records; new-account validation requires selection. The existing level rows were reused with an idempotent seeder. No application replacement, database reset, bulk student update or remote deployment was performed.

## Verification and remaining limits

New tests cover required manual selection, persistence through login, grade/level conflicts, service enforcement, unclassified visibility, course and lesson/quiz URL protection, shared audiences, authorized teacher access, incompatible assignment, mixed imports, invalid/missing import levels, warning acknowledgement, edit authorization, and preservation of credentials/enrollments/progress/submissions.

Production assets and TypeScript checks passed. Full suite: **215 passed, 2 existing registration tests skipped, 10,555 assertions** across 217 tests. Test results are recorded in `storage/framework/testing/education-all-results.log` and the focused education/import logs. The suite uses in-memory SQLite rather than the normal MySQL database. Browser checks inspect the normal list, required selector, conditional college fields and review report; profile edits and mixed import confirmation are exercised in isolated feature tests.

The three unresolved legacy classifications intentionally require a teacher decision. Existing classified test accounts without grade/section are preserved; saving an academic edit requires completing those fields. College program is free text and optional. Course audience data can be extended through the existing primary level and explicit shared-audience relation; this task does not add a separate audience-management interface or invent an administrator role. Old cached import previews without per-row education values must be uploaded again.

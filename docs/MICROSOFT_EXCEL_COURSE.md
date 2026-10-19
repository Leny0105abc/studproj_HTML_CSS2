# Microsoft Excel Application — local implementation

Local course: http://studproj_html_css.test/courses/microsoft-excel-application

Sign in using an existing High School student or teacher account. College students are denied by default. Deployment is a separate step from committing and pushing this implementation.

## 1. Existing architecture

The Laravel/Inertia/React application already uses Course → CourseModule → Lesson, primary education levels plus the `course_education_levels` pivot, CourseAccess authorization, course enrollments, lesson/case progress, versioned submissions, teacher feedback and activity logs. The Microsoft Word work added a generic application workspace, private LearningEvidence, editable LessonDemonstration records and JSON instructional content. Excel reuses those facilities. Excel VBA Application remains a separate College programming course.

## 2. Files created

- `database/seeders/MicrosoftExcelCourseSeeder.php`
- `database/data/excel-course.json`
- `scripts/author-excel-course.mjs`
- `tests/Feature/MicrosoftExcelCourseTest.php`
- `tests/browser/excel-setup.php`
- `tests/browser/create-excel-workbook.php`
- This report.

## 3. Files extended for Excel

- `app/Models/Lesson.php`, `app/Models/CaseStudy.php`: recognize `office-excel` alongside `office-word`.
- `app/Services/OfficeUpload.php`: recognize XLSM packages and reject macros disguised as XLSX.
- `app/Http/Controllers/ApplicationWorkspaceController.php`: actual audience label, module/exercise events, configurable case gating.
- `app/Http/Controllers/LessonController.php`: Excel counts, exercise labels/statuses, permitted XLSM editor configuration.
- `app/Http/Controllers/LessonDemonstrationController.php`: XLSM configuration and flexible case rubric categories.
- `app/Http/Controllers/SubmissionController.php`: optional numeric exercise grade using existing rubric score storage and exercise grading event.
- `resources/js/components/lesson-demonstration.tsx`: Excel worksheet illustrations using the existing playback/transcript controls.
- `resources/js/pages/code-lab/application.tsx`: application/audience labels, introductions, command details, predicted results, expected output and teacher scores.
- `resources/js/pages/submissions/application.tsx`: optional exercise score out of 100.
- `resources/js/pages/courses/index.tsx`, `resources/js/pages/lessons/index.tsx`: Excel course summary and practical-exercise statuses.
- `scripts/snapshot-course-data.php`, `scripts/verify-course-snapshot.php`: Excel preservation checkpoint label.

These include the shared Word application workspace files. Unrelated local files are excluded from the implementation.

## 4. Database changes

No additional Excel tables or migrations were needed. The existing generic application migration supplies `application_content`, `application_workspace`, private evidence and lesson demonstrations. Excel added one course, three modules, fifteen lessons, fifteen demonstrations and three case studies. Each lesson's existing activity field and JSON exercise object represent its single primary exercise; there is no duplicate exercise table.

The Excel seeder uses updateOrCreate with stable course/position/demo/case identities and stable global lesson/case numbers. Rerunning explicitly updates the authored Excel curriculum without duplicates or changes to student progress/submissions. An intentional reseed replaces Excel teacher content edits with the authored defaults; export customizations before reseeding. The main DatabaseSeeder retains its original fresh-install behavior.

Explicit local initialization:

```powershell
php artisan migrate
php artisan db:seed --class=MicrosoftExcelCourseSeeder
```

## 5. Course identity

Published `Microsoft Excel Application`, slug `microsoft-excel-application`, editor `office-excel`, language `Microsoft Excel`, category `Computer Applications / Productivity Software`, difficulty `Beginner to Advanced`. This is the general application course, separate from Excel VBA Application.

## 6. Education-level mapping

The primary audience is High School. Existing server-side CourseAccess protects course pages, lesson workspaces, quizzes, submissions, cases and downloads. College cannot see/open the course by default. The existing shared-level relationship can grant College access later. Teacher access and existing authentication remain in place; no account passwords were changed.

## 7–10. Modules and fifteen lessons

| Module | Lessons, in order |
| --- | --- |
| Beginner | Introduction to Microsoft Excel; Entering, Editing, and Formatting Data; Basic Formulas and Operators; Basic Excel Functions; Tables, Sorting, Filtering, and Basic Charts |
| Intermediate | Logical Functions; Advanced Functions and Text Functions; Lookup Functions; Data Validation and Conditional Formatting; Advanced Charts and Page Setup |
| Advanced | Advanced Formulas and Absolute References; PivotTables and PivotCharts; Dashboards and Data Visualization; Workbook Protection, Collaboration, and Error Checking; Introduction to Excel Automation and Macros |

Each module has exactly five lessons, five practical exercises and one major case. Every lesson contains objectives, introduction/usefulness, terms, tools/functions, numbered steps, guided practice, an independent task, its practical exercise/sample/expected result, common errors, troubleshooting, review/tool-identification/prediction prompts, five scored Quick Check questions, summary, four mastery acknowledgements, upload instructions and next-lesson navigation.

## 11. Fifteen practical exercises

1. My First Excel Workbook
2. Student Subject List
3. Simple Grade Calculator
4. Class Score Summary
5. Student Performance Chart
6. Automatic Pass/Fail Report
7. Student Data Cleaning
8. Student Information Lookup
9. Attendance Monitoring Sheet
10. Monthly Performance Report
11. Weighted Grade Calculator
12. Class Performance PivotTable
13. Student Performance Dashboard
14. Protected Grade Template
15. Simple Formatting Macro

## 12. Three major case studies

- Beginner: Student Grade Monitoring Workbook.
- Intermediate: Student Attendance and Performance Monitoring System.
- Advanced: Student Academic Monitoring Dashboard.

All use the existing CaseStudy/submission/progress/feedback system. The editable rubric has eight categories: organization 15, formulas/functions 20, formatting 10, validation/error control 10, visualization 15, analysis/summary 15, usability 10 and completeness 5, totaling 100. Teacher review requires all applicable case categories and enforces each maximum.

## 13. Workbook submissions

Every primary exercise and case accepts a private XLSX upload. The macro introduction and advanced case also permit XLSM. The macro lesson permits an XLSX/manual alternative with an honest reflection when school policy blocks macro execution. CSV and executable files are not enabled. Existing version conflicts, immutable submission snapshots, ownership checks, stale-review rejection and teacher downloads are reused. Teachers can assign an optional practical-exercise score out of 100 and provide feedback.

## 14. File and macro handling

Up to eight files, 10 MB per file. Validation checks extension, ZIP readability, expected workbook part, declared Office content type, maximum 5,000 entries, 50 MB expanded-size ceiling and unsafe entry paths. XLSX rejects VBA parts and macro content types. Files are never extracted, evaluated or executed. VBA bytes are not inspected or run; XLSM is stored as untrusted evidence. Private download responses force attachment/octet-stream, `nosniff`, no-store and a restrictive content security policy. Package checks are not malware scanning; teachers should keep Office protections enabled and review trusted practice work only.

## 15. Quick Checks

Seventy-five authored multiple-choice questions across fifteen lessons, scored server-side. Answer keys are omitted from student props. Four out of five passes a lesson check. Score/answers and passing checkpoint use existing progress fields. Predicted-result and independent-practice prompts supplement the scored check.

## 16. Gating

All lesson titles remain visible. Sequential exercise access uses existing CourseAccess prerequisites, course gating setting and teacher manual unlocks. A module case requires its own five published lessons completed; turning off course sequential gating also disables the module case gate. Normal lesson progression requires reading/demo acknowledgements, all four mastery checks, a real workbook submission with reflection and a passing quiz. Teacher grading is available without imposing a normal lesson waiting period.

## 17. Progress tracking

Existing enrollment starts and per-lesson/module/course completion counts are reused. Existing activity timestamps record submission and quiz checkpoints. Events include course/module/lesson/exercise starts, content/demo acknowledgement, exercise submission, quiz completion, lesson completion and teacher grading. Course pages show exercises submitted and cases graded complete. Feedback and numeric scores appear in the application workspace.

## 18. Teacher management

Existing course publish/gating settings, module ordering, lesson editing/reordering, manual unlocks and student reports apply. Application JSON contains exercises, formulas, examples, expected outputs and Quick Checks. Existing demonstration management allows teacher steps/transcripts, ordering, draft/published state, required flags and private media uploads. The case editor accepts eight rubric categories and validates a total of 100. The platform's existing teacher role provides management; no new parallel Admin role was created.

## 19. Dashboard

The High School dashboard automatically lists Excel with Beginner/Intermediate/Advanced progress and Start/Continue Course links. Excel workspaces expose workbook activities and uploads rather than programming compiler/console controls. Card/page summaries show 15 lessons, 15 exercises and 3 cases. Lists label the primary exercise and submission state.

## 20. Tests added and browser evidence

Nine new feature scenarios (including one parameterized across three modules) cover exact curriculum, idempotency, Word preservation, High School/College authorization, full lesson submit/quiz/unlock flow, ownership/private downloads, teacher score/feedback, rejected malformed/disguised workbooks, inert XLSM storage, all three case gates/rubrics and teacher editing/gating.

An isolated SQLite browser fixture on port 8032 verified the High School dashboard, all fifteen course lessons, worksheet step controls, required acknowledgements, 5/5 Quick Check, a genuine synthetic XLSX uploaded through the file picker and completion unlocking lesson two. The default narrow browser viewport had no horizontal page overflow (397 px content, 412 px viewport). Production local accounts and progress were not used for these tests.

Screenshots: `storage/framework/testing/excel-course-preview.png`, `storage/framework/testing/excel-guided-example.png`. Test fixture credentials exist only in the disposable browser database.

## 21. Verification results

Final full suite: **239 tests, 237 passed, 2 existing registration skips, 11,079 assertions**. TypeScript, the production build and `git diff --check` passed. Results are recorded in `storage/framework/testing/excel-all-tests.log`; TypeScript and production build logs: `excel-types.log`, `excel-build.log`. The initial full run overlapped the asset rebuild and hit a transient missing-font manifest file; the Java feature passed separately and the final full suite passed after the build completed, without weakening tests.

The encrypted `before-excel-20261017-071601.encrypted` checkpoint and `excel-preservation.log` confirm all original rows/columns preserved: 7 users, 387 lessons, 6 lesson progress records, 4 submissions, 2 feedback records, 8 cases, 70 activity logs, 2 education levels, 17 courses, 51 modules and 1 enrollment. There were no original case-progress rows.

## 22. Limits and media

The course teaches actual Excel use in the student's authorized installation. CodeLab neither installs/licenses Excel nor verifies spreadsheet formulas, formatting or PivotTables automatically. Fifteen working guided step sequences and worksheet examples are provided; recorded screenshots/videos can be uploaded through teacher management, and no fake media URLs were added. Recorded Microsoft UI videos are not included. Keyboard-operated step controls and transcripts provide static alternatives; reduced-motion logic is reused, but no OS-level reduced-motion setting was toggled during this browser check.

Version-sensitive guidance follows [Microsoft XLOOKUP documentation](https://support.microsoft.com/en-us/excel/functions/xlookup-function), [worksheet protection guidance](https://support.microsoft.com/en-us/excel/protect-a-worksheet) and [browser/desktop differences](https://support.microsoft.com/en-us/excel/differences-between-using-a-workbook-in-the-browser-and-in-excel). Sheet protection is not a privacy guarantee. Macro instructions never ask learners to disable protections or trust unknown files.

All implementation and database work remains local. No GitHub push or Hostinger deployment was performed.

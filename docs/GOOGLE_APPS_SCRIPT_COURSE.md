# Google Apps Script course handover

CodeLab now includes the published College course **Google Apps Script**, with **Beginner, Intermediate, and Advanced modules containing six lessons each: 18 total**. CodeLab provides instruction, source editing, quizzes, progress, and teacher review. Students execute Google services in their own authorized Apps Script projects.

## 1. Files created

- `database/migrations/2026_10_12_000005_add_apps_script_course_fields.php`
- `database/seeders/GoogleAppsScriptCourseSeeder.php`
- `database/data/apps-script-course.json`
- `resources/js/components/instructional-code-editor.tsx`
- `resources/js/components/apps-script-editor.tsx`
- `resources/js/pages/code-lab/google-apps-script.tsx`
- `scripts/author-apps-script-course.mjs`
- `scripts/verify-apps-script-curriculum.mjs`
- `tests/Feature/GoogleAppsScriptCourseTest.php`
- This report and `docs/apps-script-lab-preview.png`, `docs/apps-script-permissions.png`, `docs/apps-script-setup.png`.

## 2. Files modified

`app/Models/Lesson.php`, `app/Services/LessonCodeValidator.php`, and the `CodeLabController`, `LessonController`, and `SubmissionController` integrate Apps Script into shared access, save, submission, grading, and progress handling.

`resources/js/pages/lessons/edit.tsx`, `resources/js/pages/lessons/preview.tsx`, and `resources/js/pages/submissions/show.tsx` expose setup fields, previews, and immutable source/evidence snapshots. `vba-editor.tsx` now uses the shared instructional editor. The snapshot/verification scripts support the `apps-script` label. Existing course and dashboard infrastructure is reused.

## 3. Database changes

Additive nullable lesson fields: `starter_apps_script`, `example_apps_script`, `workspace_setup`, `form_setup`, `sheet_setup`, `authorization_note`, and `quota_note`. Progress and submission records gain nullable `apps_script_code`, `apps_script_project_url`, and `apps_script_notes`.

Encrypted pre-change snapshot: `storage/app/private/course-backups/before-apps-script-20261012-132823.encrypted`. Preservation verification confirms identical original-column values for the previous **10 courses, 30 modules, 249 lessons, 4 users, 5 progress records, 4 submissions, 2 feedback records, 5 case studies, and 67 activity logs**, plus original education/enrollment/case-study-progress records. The normal catalogue now contains **11 courses, 33 modules, and 267 lessons**. Only the additive migration and this course seeder were applied; normal accounts were not reset.

## 4. Course

Published College course: `google-apps-script`; language `Google Apps Script / JavaScript`; editor `google-apps-script`; provider `instructional-google-workspace`. The seeder is idempotent and preserves existing teacher edits.

## 5. Modules

Beginner, Intermediate, and Advanced each contain six ordered lessons and an **18-question module assessment**. Each lesson has five quiz questions, giving **90 lesson questions**. Each module ends with a project and a rubric totaling 100 points.

## 6. Eighteen lessons

| Level | Ordered lessons |
| --- | --- |
| Beginner | Introduction to Google Apps Script; Creating and Accessing Google Forms; Form Items and Question Types; Variables, Conditions, and Loops; Form Responses; Automated Student Registration Form project |
| Intermediate | Google Forms and Google Sheets Integration; Triggers and Form Submission Events; Form Validation; Automatic Emails and Notifications; Dynamic Forms and Question Generation; Online Quiz and Registration System project |
| Advanced | Automated Quiz Generation; Advanced Response Processing; Working with Multiple Google Workspace Services; File Uploads, Drive, and Document Generation; Security, Authorization, and Best Practices; Google Forms Student Assessment System project |

Every lesson includes objectives, explanation, source, setup, guided practice, activity, expected result, errors/debugging guidance, security/authorization/quota notes, and a quiz.

## 7. Lesson/editor implementation

The `Code.gs` editor supports editing, copying, resetting, clearing, and saving source. Lesson navigation exposes Lesson, Workspace Setup, Permissions & Quotas, Code, Activity, Project, and Quiz sections. Expected results are explicitly instructional. There is no Apps Script Run endpoint, OAuth connection, embedded Google execution, or privileged service emulation.

## 8. Google Forms lessons

Examples cover unpublished practice Forms, existing Forms by configured ID, text/paragraph/multiple-choice/checkbox/list/date/time/scale items, required fields, validation, confirmation messages, response reading, quiz points and feedback, and validated dynamic question banks. Correct-answer flags stay attached when choices are shuffled. Practice setup uses fictional records and student-owned resources. File-upload questions are configured manually in the Forms UI when supported by the account; no invented Apps Script file-upload builder is supplied. [FormApp reference](https://developers.google.com/apps-script/reference/forms/form-app), [multiple-choice quiz API](https://developers.google.com/apps-script/reference/forms/multiple-choice-item).

## 9. Google Sheets lessons

Form destinations, configured response-sheet names, exact header mapping, batched array reads/writes, derived summaries, and preservation of raw responses are taught. Formula-leading user text is written as literal text. Advanced processing distinguishes pending grading from zero scores, calculates percentages/status, and identifies duplicate student IDs without silently discarding their records.

## 10. Triggers and authorization

Installable Forms triggers use `e.response`; spreadsheet form-submit events have a different shape (`e.namedValues`, `e.values`, `e.range`). Owned trigger installation/removal checks the handler, source, and event to prevent duplicates or removing unrelated triggers. Handlers use locks with `finally` release and processing IDs. Guidance explains execution as the trigger creator and why script-created responses normally do not fire submission triggers. [Installable triggers](https://developers.google.com/apps-script/guides/triggers/installable), [event objects](https://developers.google.com/apps-script/guides/triggers/events).

Students review required scopes and their account's permissions; authorization warnings are never bypassed. Quota notes link to Google's current documentation rather than claiming fixed permanent limits. [Current quotas](https://developers.google.com/apps-script/guides/services/quotas).

## 11. Project submissions

Students submit original source, an optional restricted teacher-accessible project URL, and notes containing Form/Sheet/screenshots/report/testing links. URLs are HTTP(S), length-limited, and reject embedded credentials. Source and notes preserve whitespace. Submission snapshots retain their exact version; later edits cannot receive approval from an outdated submission. Teacher review displays `Code.gs`, evidence, feedback, and project rubric. Direct file upload is not part of this workflow, and CodeLab does not fetch submitted URLs.

## 12. Student dashboard

The course appears in the College catalogue and dashboard through the existing publication/education-level/enrollment filters. College now contains nine courses and 222 lessons; High School remains two courses and 45 lessons. Cross-level and teacher-assignment restrictions remain enforced.

## 13. Admin integration

Existing teacher/admin lesson management supports all seven new curriculum fields, published visibility, module assessments, drafts, and course content. Newly created Apps Script drafts use a non-executing source scaffold and remain unpublished. Teacher review uses existing assignment and role checks.

## 14. Progress tracking

The shared save/version/submit/quiz/approval workflow is retained. A passed lesson quiz and teacher approval of the current work unlock the next lesson; project completion also requires rubric grading. Locked published lessons remain readable as previews with setup/source guidance, without exposing quiz answer keys. Approved work is read-only until the existing workflow permits changes.

## 15. Security protections

CodeLab stores submitted scripts as text and does not execute Google service calls or solicit Google permissions. Backend limits are 200,000 characters for source, 20,000 for evidence notes, and 2,048 for the optional URL. Configuration uses placeholders and Script Properties; lessons explicitly explain that Properties are not a universal secret vault. Examples avoid production IDs/secrets, public Drive sharing, bulk mail, and real private student data.

Email examples are dry-run by default and require deliberate configuration for one approved test recipient, with remaining-quota checks. Production mail workflows require outbox/idempotency handling. Drive/Docs/PDF guidance requires owner-controlled restricted folders and checks inherited permissions. No real Google resources, OAuth grants, triggers, sharing changes, or emails were created during implementation.

## 16. Test results

- Full `php artisan test --compact`: **139 tests, 137 passed, 2 skipped, 6,512 assertions**; no existing tests removed or weakened.
- Apps Script feature tests: **5 passed, 458 assertions**, including content/idempotency/preservation, access, saving, submissions, current-version approval, quizzes/gating, teacher editing, invalid URLs, and no remote execution.
- `npm run types:check`, targeted ESLint, production build, PHP syntax/format checks, and `git diff --check` passed. Existing nonfatal font/runtime build warnings remain.
- Curriculum verifier passed: syntax parsing for all 18 examples; isolated pure-helper checks for question banks, validation, shuffle correctness, literal spreadsheet text, and placeholder matching; lesson/quiz/rubric structure checks. This does not verify live Google APIs.
- Browser check on the separate local SQLite fixture confirmed all three six-lesson modules, locked previews, the instructional editor, absence of a Run button, source/evidence save and reload persistence, and setup/permission panels. Starter source and blank notes were restored afterward.
- Normal MySQL preservation verification passed.

Logs are under `storage/framework/testing/apps-script-*`. These tests do not use actual Google credentials or send email.

## 17. Remaining limitations and testing links

Actual Google authorization and execution must be tested by students/teachers in their own permitted Google account. Account/domain policies may restrict Forms publishing/responders/file uploads, Drive permissions, mail, or service quotas. Final projects provide foundations and explicit extension requirements; students must implement and demonstrate their own complete workflows. Native per-respondent random question-bank selection is not claimed.

Normal Herd site: [CodeLab course](http://studproj_html_css.test/courses/google-apps-script). Separate local browser fixture: [Google Apps Script course](http://127.0.0.1:8017/courses/google-apps-script), [login](http://127.0.0.1:8017/login). Fixture student: `college.student`; teacher: `browser.teacher`; password for both: `BrowserTest2026!`. These credentials belong to the local fixture, not production accounts.

Changes remain local; this task does not deploy to Hostinger or push to GitHub. The previously deferred .NET sandbox remains deferred.

# Excel VBA Application course handover

The existing CodeLab platform now includes **Excel VBA Application**, a published **College** course (`excel-vba-application`, language **VBA for Microsoft Excel**, editor `vba`, provider `instructional-excel-desktop`). It has **three modules with exactly six lessons each: 18 total**. VBA execution belongs to Microsoft Excel desktop; CodeLab supplies instruction, source editing, and teacher-reviewed submissions.

## 1. Files created

| Purpose | Files |
| --- | --- |
| Additive schema | `database/migrations/2026_10_12_000004_add_vba_course_fields.php` |
| Course/content | `database/seeders/VbaCourseSeeder.php`, `database/data/vba-course.json` |
| Source/editor page | `resources/js/components/vba-editor.tsx`, `resources/js/pages/code-lab/vba.tsx` |
| Authoring/content checks | `scripts/author-vba-course.mjs`, `scripts/verify-vba-curriculum.mjs` |
| Regression tests | `tests/Feature/VbaCourseTest.php` |
| Handover/proof | This report, `docs/vba-lab-preview.png`, `docs/vba-workbook-setup.png`, `docs/vba-userform-preview.png` |

## 2. Files modified

`app/Models/Lesson.php`, `app/Services/LessonCodeValidator.php`, `app/Http/Controllers/CodeLabController.php`, `app/Http/Controllers/SubmissionController.php`, and `app/Http/Controllers/LessonController.php` integrate VBA through the shared course/access/progress/save/submit/quiz/review workflow.

`resources/js/pages/lessons/edit.tsx`, `resources/js/pages/lessons/preview.tsx`, and `resources/js/pages/submissions/show.tsx` add teacher editing, locked previews, source snapshots, and workbook evidence review. `scripts/snapshot-course-data.php` and `scripts/verify-course-snapshot.php` accept the `vba` label and report the additional course. No new macro run route or external execution service was added. Actual `.env` settings, account seeders, and the deferred .NET sandbox setup were not changed.

## 3. Database changes and preservation

The migration adds nullable lesson fields `starter_vba`, `example_vba`, `excel_setup`, `worksheet_layout`, and `userform_guide`. Progress and submissions gain nullable `vba_code`, `vba_workbook_url`, and `vba_notes`. Existing columns and rows are retained.

Before migration, an encrypted snapshot was created at `storage/app/private/course-backups/before-vba-20261012-123825.encrypted`. Verification confirms the original-column values remain identical for **9 courses, 27 modules, 231 lessons, 4 users, 5 progress records, 4 submissions, 2 feedback records, 5 case studies, 67 activity logs**, and the other original enrollment/case-study-progress records. The normal MySQL catalogue now has **10 courses, 30 modules, and 249 lessons**. Only the additive migration and `VbaCourseSeeder` were applied to normal MySQL and the separate browser-test SQLite fixture; accounts/passwords were not re-seeded or reset.

## 4–6. Course, modules, and lesson records

| Level | Ordered lessons |
| --- | --- |
| Beginner | Introduction to Excel VBA; Variables, Constants, and Data Types; Working with Cells and Ranges; Conditional Statements and Loops; Subs, Functions, and Basic Automation; Automated Student Grade Sheet project |
| Intermediate | Advanced Range and Worksheet Manipulation; Events in Excel VBA; UserForms and Controls; Arrays and Collections; Error Handling and Validation; Student Record Management Workbook project |
| Advanced | Advanced UserForms and Application Design; Advanced Excel Automation; Working with Files and External Data; Database Concepts with VBA; Performance, Security, and Best Practices; Excel VBA Student Information System project |

Each lesson has objectives, setup, explanation/syntax/source, worksheet layout/sample data, guided practice, original activity, expected desktop results, common errors, debugging/security notes, summary/challenge, and completion requirements. There are **90 lesson quiz questions**, **18 questions per module assessment**, and **three 100-point project rubrics**. The Beginner rubric uses worksheet experience rather than requiring UserForms before they are taught. Re-seeding does not duplicate records or overwrite teacher edits; a conflicting course slug is rejected for manual resolution.

## 7. VBA lesson/editor implementation

The lesson page provides Lesson, Workbook Setup, UserForm Guide, Code, Activity, Project, and Quiz sections. Its VBA textarea supports Copy, Reset, Clear, and Save. It displays **Microsoft Excel Desktop Required** and an **Expected Excel Result · instructional** panel. There is **no Run button**, fake worksheet execution, simulated VBA terminal, or server macro process.

Saving preserves source/evidence whitespace and uses optimistic versions. Teacher approval is required for all VBA activities. Quiz completion alone never awards desktop correctness. Excel for the web cannot create/run/edit VBA macros; use a supported desktop environment. [Microsoft guidance](https://support.microsoft.com/en-us/excel/work-with-vba-macros-in-excel-for-the-web).

## 8. Workbook-layout implementation

Workbook Setup names the `.xlsm` file, exact sheets, column letters/headers, fictional sample rows, scratch/output ranges, procedure locations, and applicable platform/provider requirements. Layouts are database-driven text specifications, not an emulated spreadsheet.

The grade project uses Grades A:G (ID/name/three grades/average/status), with J1/J2 for highest/lowest valid averages. Sample averages are Maria 91.33 PASSED and Joel 67.67 FAILED. The student workbook uses Students/Lists/Dashboard with explicit student/date/grade columns. Import examples stage data separately before merging; ADO examples use DatabaseResults and an independent practice `.accdb` schema.

## 9. UserForm lesson implementation

UserForm guides specify named labels, textboxes, comboboxes, listbox/search/project controls, Captions, fixed-list styles, layout, tab order, event handlers, expected behavior, and VBE module locations. Students build and test the actual form in Excel desktop and submit real evidence.

Form modules are distinguished from standard modules, worksheet events from ThisWorkbook events. Workbook navigation/login examples explicitly label **demo navigation**, reject password entry, and do not claim authenticated access. An actual secure application requires an independently trusted credential/authorization provider; passwords in worksheet cells, hard-coded passwords, or workbook protection are not taught as production security.

## 10. Starter workbook/file support

The inspected platform had no generic workbook attachment/upload feature. Therefore **no downloadable `.xlsm` starter files or starter-workbook upload UI were added**. Students receive complete setup/layout/sample-data instructions and starter source, then create the practice workbook in Excel. Teachers can edit all these fields in existing lesson management. The reference data/forms/procedures support the learning activities; projects require students to complete their own full workbook and tests.

## 11. Workbook submission security and ADO practice

Students submit versioned source, an optional HTTP(S) `.xlsm` workbook/project link, and evidence/testing/documentation notes with screenshot or exported-report links. Teachers review immutable source/link/note snapshots through the existing submission page. Changing source, workbook URL, or notes invalidates approval of a prior submission; projects also require all rubric categories.

**Direct `.xlsm`, screenshot, PDF, and ZIP uploads are not enabled.** There is no application workbook storage, auto-opening, macro extraction/execution, or link fetching. Links reject non-HTTP(S) schemes, excessive length, and embedded credentials; source/notes render as text. Review external workbooks as untrusted under the applicable Excel policy, rather than globally enabling macros.

ADO uses late-bound Windows ADODB plus a compatible installed ACE OLE DB provider and a teacher-created **separate local practice Access database**. Parameters are appended in positional SQL order, connections/recordsets are closed on success/error, and no platform connection string or production credentials are supplied. Missing provider/platform support requires a documented design exercise, not a connection to CodeLab tables. Reference: [ADO CreateParameter](https://learn.microsoft.com/en-us/office/client-developer/access/desktop-database-reference/createparameter-method-ado).

## 12–14. Dashboard, administration, and progress

College now has **8 courses / 204 lessons**; High School retains **2 / 45**. College access, explicit cross-level assignment, publication, enrollment, reports, and dashboard counts remain server-enforced through existing queries.

Teachers edit course metadata, module assessments, VBA examples, Excel setup, worksheet layouts, UserForm guides, activities/quizzes/rubrics, publication, order, and prerequisites through existing management. New VBA drafts are unpublished. Sequential progression remains configurable, and manual unlock is available through the existing tools.

Course/module/lesson starts, source saves, quizzes, activity/project submissions, approval/grading, completion, read-only approved work, and next-lesson access use shared progress and activity logs. Locked previews expose study material and desktop guides without opening the gated workspace or revealing quiz answers.

## 15. Test results

- Full Laravel suite: **132 passed, 2 skipped; 6,054 assertions** (134 tests). Result: `storage/framework/testing/vba-all-test-results.json`. Existing tests were retained.
- Five new feature tests cover nine-course/231-lesson preservation and idempotence, all module/content counts, College dashboard/access/assignment/publication/gating, locked guide previews, source/evidence whitespace/versioning, immutable submissions, stale-evidence rejection, quiz/rubric/current-version approval, read-only completion/next unlock, teacher editing/drafts, assessments, workbook URL rejection, storing dangerous VBA as text, and the absence of a VBA run endpoint.
- Static curriculum checks pass for all 18 sources: worksheet references match documented layouts, quiz choices/answers are valid, procedure boundaries balance, project weights total 100, sample grade arithmetic is independently correct, settings cleanup/ADO parameters are present, and login simulation is labeled honestly. Log: `storage/framework/testing/vba-curriculum-results.log`. **This is not an Excel compiler or macro execution test.**
- Browser checks verify the 18-lesson course, desktop-required editor with no Run button, Workbook Setup, UserForm instructions in a locked preview, and saving/reloading/restoring test evidence. No browser quiz or teacher approval was performed.
- TypeScript, targeted frontend lint/PHP formatting, production build, and original-data preservation checks pass. Existing nonfatal optional-font/SQLite browser-bundle warnings remain unchanged.

Repeat content checks with `node scripts/verify-vba-curriculum.mjs`; repeat preservation verification with `php scripts/verify-course-snapshot.php vba`.

For another installation:

```powershell
npm run build
php artisan migrate --force
php artisan db:seed --class=VbaCourseSeeder --force
```

Do not run account seeders to add this course.

## 16. Limitations and test access

Microsoft Excel desktop, applicable macro policy, and any ADO provider/practice database must be supplied by the learning environment. No macros were compiled/executed in Excel during implementation. Actual UserForm behavior, workbook persistence, PDF export, provider compatibility, and full project applications must be tested there. Direct workbook uploads and downloadable starter workbooks remain unsupported; workbook links/source/evidence are the implemented submission approach. The final projects are original student deliverables built from reference components and milestones.

[Excel VBA course](http://127.0.0.1:8017/courses/excel-vba-application) · [First lesson](http://127.0.0.1:8017/code-lab/232) · [UserForms locked preview](http://127.0.0.1:8017/lessons/240/preview).

Existing fictional browser-test accounts: College student `college.student`, teacher `browser.teacher`; password for both `BrowserTest2026!`. They belong to the separate `storage/framework/testing/python-browser.sqlite` fixture. Normal Herd URL: [Excel VBA Application](http://studproj_html_css.test/courses/excel-vba-application), with its existing accounts. No GitHub push or Hostinger deployment was performed.

# Microsoft Word Application — local implementation

## Scope and existing architecture

This extends the existing Laravel 13 / Inertia / React CodeLab application. Course → CourseModule → Lesson, `education_levels`, course audience checks, `student_lesson_progress`, `course_enrollments`, `submissions`, `teacher_feedback`, `case_study_progress`, activity logs, reports and teacher lesson editing are reused. Existing WordPress evidence uploads supplied the pattern for private file storage, owner checks, immutable submission snapshots and optimistic save versions; Word documents use a generic learning-evidence structure rather than WordPress-specific columns.

There was no generic lesson-media table and the original case-study path assumed HTML/CSS. The additive migration introduces generic demonstrations and document evidence, and adds nullable course/module associations to case studies. Existing unassociated HTML/CSS cases remain on their original workflow. No replacement app or executable Word clone is created.

## Course and curriculum

Local URL: <http://studproj_html_css.test/courses/microsoft-word-application>.

- Published **Microsoft Word Application**, slug `microsoft-word-application`.
- Initial audience **High School**; College students are denied server-side, including direct lesson, quiz, case-study and evidence access. Teachers retain management access. Existing education-level compatibility also controls assignment.
- Category: **Computer Applications / Productivity Software**. Application: Microsoft Word. Type: Application Software / Productivity.
- Exactly three modules: Beginner, Intermediate, Advanced.
- Exactly five lessons and five practical exercises per module: **15 lessons / 15 exercises** total.
- Exactly one major case study per module: **3 cases** total, separate from the 15 lessons.
- The idempotent seeder creates missing records and preserves existing lesson identities, teacher revisions, demonstration edits, student records and previously configured course settings.

| Level | Lessons / exercises | Major case study |
|---|---|---|
| Beginner | Introduction / first document; character formatting / announcement; paragraph formatting / routine; page layout / newsletter; objects and tables / information sheet | School Project Cover and Report |
| Intermediate | Advanced tables / grade report; styles / education report; references / mini research paper; Mail Merge / recognition letters; forms / registration form | School Event Documentation Package |
| Advanced | Templates / research template; references / academic report; conditional Mail Merge / certificates; review and security / reviewed report; automation / formatting macro or policy-approved alternative | Complete School Administrative Document System |

Each database-authored lesson includes objectives, usefulness, terminology, command introduction, numbered demonstration, guided practice, independent task, one practical exercise, common mistakes, troubleshooting, review questions, command-identification question, scenario, five scored Quick Check questions, summary, four mastery acknowledgements, submission instructions and next-lesson navigation. Sample text, filenames and requirements follow the supplied syllabus. Practice uses fictitious personal data. Lesson content is JSON in the database, not hard-coded instructional text in templates.

## Demonstrations and accessibility

**35 guided demonstrations** are seeded as Word-style instructional illustrations:

- Character Formatting: all **8** requested demonstrations — selection, Bold, Italic/Underline, font/size, font color, highlight, copy/paste and clear formatting.
- Paragraph Formatting: all **7** — alignment, 1.5 spacing, first-line indent, hanging indent, bullets, numbering, borders/shading.
- Page setup: orientation, margins, page numbers and columns.
- Objects: picture insertion/resize, wrapping, table creation, merging and table style.
- Remaining lessons each have a numbered guided workflow.

Frames show a labeled command, before state, current result and caption, alongside the complete numbered steps and transcript. Play, Pause, Replay, Previous and Next controls are keyboard-accessible. No audio autoplays. `prefers-reduced-motion` disables automatic playback and preserves static steps. Simulations are explicitly labeled **Practice Simulation** and do not create or edit an actual Word file.

Teachers can add/edit title, description, transcript, steps/frames, required/optional state, publication and display order, and upload or replace video/image media. Media is private and authenticated. Draft demonstrations are visible only to teachers. Uploaded videos use native controls and a replay reset; animated images can be hidden/paused in favor of their equivalent text. No fake video URLs are seeded.

## Practical submissions, completion and grading

Students work in an authorized Microsoft Word installation. CodeLab stores the saved document and reflection rather than pretending to execute Microsoft Word. Windows desktop command locations are described; edition differences and unavailable web/mobile features are explained.

Opening a lesson creates `in_progress`, enrollment start and activity events only. Normal completion requires:

1. Explicit acknowledgement of required content.
2. Acknowledgement of every required published demonstration after its last frame (or video end in the UI).
3. Five-question server-scored Quick Check passed at **4/5**.
4. Four mastery self-checks, a reflection of at least 20 characters, and a submitted practical document.

Opening a page or saving a draft never completes it. Quiz and submission may occur in either order. Checkpoints are learner attestations; CodeLab cannot prove visual attention or inspect actual formatting quality automatically. Successful completion unlocks the next lesson without waiting for teacher grading. Teachers may subsequently review and request revision through the existing submission workflow. Teacher-approved work is read-only. Stale saves and reviews of edited or superseded snapshots are rejected.

Case studies unlock only after the **five published lessons in their own module** are complete. Later modules do not depend on prior case-study grading. Cases reuse the existing progress/submission/feedback tables, require evidence and mastery acknowledgement, and receive teacher grading against the supplied seven-category, 100-point rubric. The teacher preview provides a case content/rubric editor. In the Beginner case, the teacher should explain how the common rubric categories apply to level-appropriate work rather than demanding advanced features not yet taught.

## File handling

Allowed extensions are lesson-specific subsets of `.docx`, `.dotx`, `.docm`, `.pdf`, `.xlsx`. Limits: eight files, 10 MB per file, 5,000 ZIP entries and 50 MB expanded Office-package size. Extension, package content type, required Word/Excel parts, traversal names and PDF signature are checked without extracting or executing the package. Macro-bearing files are accepted only where relevant and stored inertly. CodeLab never executes uploaded macros. Office security is never disabled; a documented nonmacro alternative is provided when school policy blocks recording.

Files live on the private local disk. Downloads require ownership and current course access, or teacher authorization, and use attachment delivery with `nosniff` and restrictive headers. Evidence IDs must belong to the same learner and activity. Replaced drafts retain prior files referenced by immutable submissions. There is no automatic malware scanner or guarantee that Office attachments are harmless; only trusted practice files should be opened in an appropriately protected client.

## Progress and administration

The course card/page shows 15 lessons, 15 practical exercises, three major cases and interactive demonstrations. Existing overall and per-level lesson progress is retained; Word course pages additionally show exercises submitted and cases graded complete. Case cards show module, lock state and submission/grade status. Activity events cover course/lesson/case starts, content/demo acknowledgements, Quick Check, exercise/case submission, lesson completion and case grading. Existing student reports consume the same lesson-progress records.

Teacher lesson editing includes `application_content` and the existing quiz editor. Teacher previews link to the same complete lesson renderer and do not create learner progress. Existing gating configuration and manual lesson unlocks are reused. Publication and student-level checks apply on the server.

## Files and database changes

Created:

- `database/migrations/2026_10_18_000001_add_application_learning.php`
- `database/seeders/MicrosoftWordCourseSeeder.php`, `database/data/word-course.json`, `scripts/author-word-course.mjs`
- `app/Models/LessonDemonstration.php`, `app/Models/LearningEvidence.php`, `app/Services/OfficeUpload.php`
- `app/Http/Controllers/ApplicationWorkspaceController.php`, `LessonDemonstrationController.php`
- `resources/js/components/lesson-demonstration.tsx`, `demonstration-manager.tsx`, `application-evidence.tsx`
- `resources/js/pages/code-lab/application.tsx`, `resources/js/pages/submissions/application.tsx`
- `tests/Feature/MicrosoftWordCourseTest.php`, `tests/browser/word-setup.php`, `tests/browser/create-word-document.php`, this report.

Modified: Lesson/CaseStudy/progress/submission models and controllers; generic CodeLab entry-point dispatch and bypass protection; existing dashboard and course/lesson/case list pages; teacher lesson editor; routes; encrypted snapshot tools.

Schema additions are nullable application content/workspace JSON on existing records, nullable case course/module foreign keys, `lesson_demonstrations`, and `learning_evidence`. Existing rows and identities are preserved. The local migration and explicit course seeder were run after an encrypted backup. The full development account seeder was **not** run against existing users.

## Verification

Focused tests cover exact curriculum/module/exercise/case/demo counts, idempotence and authored-edit preservation, High School/College authorization, assignment, no completion on open, no leaked quiz answers, sequential unlocks, both quiz/submission orders, mastery requirements, generic HTML bypass protection, malformed/executable upload rejection, owner-bound evidence, private downloads, stale versions, immutable snapshots, module case gating and grading, teacher demo management, and inert macro storage.

Original-data snapshot verification passed for **7 users, 372 lessons, 5 lesson-progress records, 4 submissions, 2 feedback records, 5 case studies, 67 activity records, 16 courses and 48 modules**, plus all original education-level/enrollment rows. Automated tests use in-memory SQLite. Browser checks use a separate `word-browser.sqlite` fixture on a dedicated local port and do not alter normal student passwords or progress. Current test/build/browser results are recorded in `storage/framework/testing/word-*`.

Full PHP suite: **228 passed, 2 existing registration tests skipped, 10,830 assertions** across 230 tests. TypeScript checking passed. Run `php artisan db:seed --class=MicrosoftWordCourseSeeder` after the additive migration on a fresh installation; the original development DatabaseSeeder retains its original 15-lesson/5-case contract.

This task is **local only**. Hostinger and the GitHub deployment were not updated.

Final browser checks passed in the isolated fixture: High School overview, 1440px desktop and 390px mobile without page-wide overflow, character demonstration Play/Pause/Replay/Next, stored viewed acknowledgement, a 5/5 Quick Check, a real synthetic .docx upload, completion/next-lesson link, and teacher demonstration editing. Reduced-motion handling is implemented and code-reviewed; no operating-system preference was changed. Production frontend build and TypeScript checking passed. After the final curriculum-frame refinement, all 11 Word-focused tests passed (213 assertions). No external MP4/GIF recordings were supplied; the seeded demonstrations are working guided UI frames, with optional private media replacement in the teacher editor.

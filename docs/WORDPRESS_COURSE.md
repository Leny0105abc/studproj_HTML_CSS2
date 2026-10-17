# WordPress College course implementation

Added to the existing Laravel CodeLab application. No separate WordPress application or provisioning service was created. Changes remain local; no GitHub push, Hostinger deployment, real WordPress installation or payment transaction was performed.

## 1. Files created

- `database/migrations/2026_10_13_000003_add_wordpress_course_fields.php`
- `database/seeders/WordpressCourseSeeder.php`
- `database/data/wordpress-course.json`
- `scripts/author-wordpress-course.mjs`
- `app/Models/WordpressEvidence.php`
- `app/Http/Controllers/WordpressWorkspaceController.php`
- `resources/js/pages/code-lab/wordpress.tsx`
- `resources/js/components/wordpress-evidence.tsx`
- `tests/Feature/WordpressCourseTest.php`
- This report and the WordPress browser proof images.

## 2. Files modified

`Lesson`, `StudentLessonProgress` and `Submission` models; `CodeLabController`, `LessonController` and `SubmissionController`; existing routes; existing lesson edit/preview and teacher submission review pages; safety snapshot and verification scripts. Existing course/category/prerequisite/dashboard/enrollment/module-assessment components were reused.

Temporary integration/inspection scripts were used during implementation and removed afterward. Existing uncommitted changes from earlier courses were retained.

## 3. Database changes

Six nullable instructional text fields on lessons: WordPress setup, procedures, site structure, visual guide, maintenance tip and submission instructions. Five nullable fields on both progress and submission records: practice URL, project URL, environment description, notes and evidence metadata. A private evidence registry records UUID, owner, lesson, internal storage path, safe filename, MIME type and size. Paths are hidden from serialized model output.

Only the new migration and WordPress seeder were applied to normal MySQL and the dedicated browser SQLite fixture. No database reset or broad curriculum reseed occurred in normal data. The prechange encrypted backup is `storage/app/private/course-backups/before-wordpress-20261013-050053.encrypted`.

Preservation verification compared every original row and original column: 13 courses, 39 modules, 303 lessons, four users, five progress records, four submissions, two feedback records, five case studies, 67 activity logs and both education levels remained unchanged. Existing enrollment and case-study progress tables were preserved. Normal catalogue now contains **14 courses, 42 modules and 321 lessons**. College has **12 courses / 276 lessons**; High School remains **2 courses / 45 lessons**.

## 4. Course created

**WordPress**, slug `wordpress`, College, category **Web Development / CMS**, difficulty Beginner to Advanced, published, editor type `wordpress`, execution provider `external-authorized-site`. No WordPress course existed before this task. Seeder uses idempotent first-or-create operations and checks course/lesson slug conflicts. Repeated runs preserve teacher-edited content and student record identities; nothing is destructively replaced or archived.

## 5. Three modules

Beginner, Intermediate and Advanced, ordered 1–3. Each has six lessons and an 18-question assessment drawn from its six lessons' topic-specific checks. Existing assessment submission, enrollment results and teacher editing are reused.

## 6. Eighteen lessons

| Module | Lessons in order |
|---|---|
| Beginner | Introduction to WordPress; Installing and Setting Up WordPress; Creating Pages, Posts, and Media; Using the Block Editor; Themes, Menus, and Basic Customization; Personal or School Website project |
| Intermediate | Plugins and WordPress Features; Forms and User Interaction; Users, Roles, and Content Management; SEO and Content Optimization; Backup, Security, and Maintenance; School or Organization Website project |
| Advanced | Advanced Site Design and Full Site Editing; Custom Post Types, Fields, and Dynamic Content; WooCommerce and Online Services; Performance and Optimization; Advanced Security, Deployment, and Best Practices; WordPress Student Information / School Portal project |

Positions 1–18, normal global lesson numbers 304–321. Each has three measurable objectives, explanation, setup, procedure, site/workflow structure, visual-guide placeholder, guided/independent work, expected outcome, common errors, troubleshooting, security/accessibility/responsive/maintenance guidance, summary/next lesson, submission instructions and five quick-check questions. Answer positions rotate. Projects include requirements, milestones, test guidance and the requested 100-point rubric: 20/15/15/15/10/10/10/5.

## 7. WordPress lesson mode

Tabs: Lesson, Steps, Site Structure, Activity, Expected Result, Submission and Quiz. No programming Run button or fake WordPress dashboard. Existing CodeLab start/navigation logic renders this mode according to the course editor type. Published locked lessons remain readable through the shared preview route, including procedures and evidence instructions without quiz answer keys.

Block/classic theme differences and changing UI terminology are taught explicitly. Current requirements, roles, backups, Site Editor and store testing were checked against primary references and linked in the lesson page: [requirements](https://wordpress.org/about/requirements/), [Site Editor](https://wordpress.org/documentation/article/site-editor/), [roles](https://wordpress.org/documentation/article/roles-and-capabilities/), [backups](https://developer.wordpress.org/advanced-administration/security/backup/), [WooCommerce testing](https://woocommerce.com/document/managing-orders/testing-orders/). No volatile version number or arbitrary commercial plugin is required by the course.

## 8. Practical activities

Work occurs in an authorized local WordPress installation, protected staging website, school instance or approved host. Students record site/environment details and actual results. Content covers school configuration, posts/pages/media, block composition, theme-specific navigation, plugin comparisons, inquiry forms, editorial roles, SEO, backup/recovery, full-site editing, structured directories, test-only commerce, measured optimization and authorized deployment planning. Advanced security includes reversible plugin/theme conflict diagnosis with backup, staging, logs and recovery.

Projects require fictional content and verifiable testing. A visual login mockup is not accepted as proof of WordPress authentication; restricted-resource access needs actual authorized role tests. SEO has no ranking guarantee. Form confirmation, entry storage and mail delivery are separate outcomes. Practice commerce uses isolated test methods; test orders may affect email, stock and analytics.

## 9. URL and project submissions

Store a practice URL, optional project URL, credential-free environment description and report. Submitting requires environment/notes plus a project URL **or** screenshot/PDF evidence, allowing localhost and restricted sites without password sharing. HTTP/HTTPS only; reject embedded credentials, recognizable secrets/access/reset tokens, including encoded forms. CodeLab does not fetch, crawl or execute submitted URLs. External review links use separate tabs with `noopener noreferrer`.

Saves/submissions lock the shared progress record, check workspace version and increment it. Immutable submitted snapshots retain URLs, notes and evidence metadata. Edits supersede pending work and invalidate practical submission status. Teachers cannot approve an outdated/edited snapshot. Completed work is read-only. No credential fields exist; common password request keys are prohibited. Students must redact sensitive content themselves; arbitrary text/PDF/image content cannot be guaranteed secret-free automatically.

## 10. Screenshot and file submissions

New private upload handling is necessary because existing project links/code-file fields did not provide general screenshot/PDF storage. Reuses the existing progress/submission/review flow rather than a separate grading system. Accept PNG/JPEG/WebP and PDF only, validate extension/MIME/file size, maximum six files per version and 8 MiB each. The hosting PHP/web-server request/upload ceilings may impose lower limits and must be configured appropriately before deployment.

Files use generated paths on the existing private local disk. Downloads require authentication and either student ownership or teacher role; UUID routing prevents path selection. Files are served as downloads with private/no-store, nosniff and a restrictive sandbox CSP. Evidence references must belong to the student and same lesson. Removing a file from later work does not delete it from earlier submitted snapshots. Failed uploads/transactions clean up newly written files. ZIP, executable code, SVG, backup archives and XML content exports are not accepted; safe export concepts can be documented instead.

## 11. HTML/CSS prerequisite

Editable advisory course text recommends HTML/CSS; optional advanced background includes PHP, SQL/database concepts and Bootstrap/responsive design. No permanent prerequisite enrollment lock, new prerequisite system or cross-level access grant. Existing management can replace/remove recommendations.

## 12. Student dashboard

Shared College catalogue/dashboard and course progress include WordPress automatically through existing publication/access rules. High School students need explicit existing enrollment/assignment for cross-level access. Course page displays 18 lessons, category/recommendations and six-lesson progress groups. No hardcoded new dashboard totals were added.

## 13. Admin integration

Existing teacher management is the app's administrative surface. It edits course/category/recommendations/publication/gating, modules/assessments, lesson order/prerequisites, objectives, procedures, visual-guide descriptions, site structure, expected outcomes, practical work, quizzes and rubrics. New WordPress drafts remain unpublished. Archive behavior remains nondestructive. Progress/submission queue, feedback and project grading are reused.

## 14. Progress tracking

Shared course/module/lesson start events, enrollment, workspace saves, activity/project submission, quiz score, teacher completion and project grading. Quiz pass requires at least 4/5; practical submission plus current teacher approval completes a lesson. Simply entering a URL, saving evidence, previewing or passing the quiz cannot automatically complete it. Sequential gating remains configurable, and manual unlock remains available through existing management.

## 15. Security

Existing authenticated/verified role middleware and CSRF remain. Writes are student-only, restricted to a WordPress lesson accessible/unlocked for that user and rate-limited. Private downloads check ownership/teacher authorization. Submitted links are never fetched server-side. Bounded text/files, UUID references, safe paths/names, private downloads, snapshot/version checks and protected reviewed work are enforced.

Lessons consistently require authorized staging, backups, least privilege, strong private credentials, trusted maintained extensions, HTTPS and recovery planning. They prohibit core/third-party plugin edits and real payment/private academic data in exercises. No protections or credentials in Laravel/Hostinger were changed. The school portal is an educational CMS project, not a claim that WordPress alone automatically provides a secure full academic-record system.

## 16. Verification

Full Laravel suite: **163 tests, 161 passed, two skipped, 7,555 assertions** on the complete integration. Existing tests were retained. Seven new feature tests cover all previous courses/data, idempotency, content/modules, enrollment/access/dashboard/gating/readable previews, quiz/teacher completion, immutable versions, rubric grading, editable management, URL/password validation, programming-endpoint bypass, private image/PDF uploads, ownership and file retention. After tightening encoded-token/reset-key rejection, the targeted suite passed again: **seven tests / 300 assertions**. Results are recorded in `storage/framework/testing/wordpress-feature-results.log` and `wordpress-all-results.log`.

Production build, TypeScript and project-native TSX lint/format checks passed. PHP formatting and syntax checks passed. Existing nonfatal build warnings remain. `git diff --check` passed apart from a pre-existing CRLF notice. Normal database preservation verification passed.

Browser: course shows all three six-lesson modules; lesson renders instructional mode and real procedures; private screenshot, practice URL, environment and notes save and survive reload in the dedicated SQLite fixture. The smoke-test workspace was then cleared for student testing. No real site, credentials or completed WordPress practical work were claimed. Proof images: [lesson procedures](wordpress-lesson-preview.png), [course](wordpress-course-preview.png).

## 17. Remaining limits and local testing

No automatic WordPress provisioning, installation, live-site inspection or code execution. Students/teachers supply the authorized practice environment. Visual guides are editable written placeholders/diagrams; no fabricated dashboard screenshots. Approved theme/plugin features vary. Protected/local URLs need screenshot/report evidence and cannot be reached automatically from a teacher's remote computer. Optional PHP/CSS code execution, full XML/ZIP exports, antivirus scanning, storage quotas/retention automation and thumbnail previews were not introduced. Uploaded evidence is downloaded for review; it is not rendered as active HTML.

Normal Herd course: [WordPress](http://studproj_html_css.test/courses/wordpress). Dedicated fixture: [WordPress course](http://127.0.0.1:8017/courses/wordpress), [login](http://127.0.0.1:8017/login). Existing local test accounts: student `college.student`, teacher `browser.teacher`, password `BrowserTest2026!`. These are CodeLab local testing accounts, not WordPress or production credentials. Normal accounts were not reset. The deferred .NET sandbox remains deferred.

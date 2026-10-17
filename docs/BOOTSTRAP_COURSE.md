# Bootstrap course handover

The existing CodeLab application now has a published College **Bootstrap** course with **18 lessons: six each in Beginner, Intermediate and Advanced**. Bootstrap remains separate from HTML/CSS and JavaScript. The course reuses enrollment, progress, quizzes, project review, management and the existing isolated JavaScript interpreter.

## 1. Files created

`database/migrations/2026_10_13_000002_add_bootstrap_course_metadata.php`, `database/seeders/BootstrapCourseSeeder.php`, `database/data/bootstrap-course.json`, `resources/bootstrap/config.json`, `config/bootstrap.php`, `resources/js/components/bootstrap-editor.tsx`, `resources/js/pages/code-lab/bootstrap.tsx`, `public/bootstrap-preview.html`, `public/bootstrap-preview.js`, `scripts/author-bootstrap-course.mjs`, `scripts/build-bootstrap-assets.mjs`, `scripts/verify-bootstrap-runtime.mjs`, `tests/Feature/BootstrapCourseTest.php`, `tests/Feature/BootstrapMetadataTest.php`, this report, and browser proof images.

The build produces local CSS, the bundle with Popper, version metadata and the MIT license under `public/bootstrap-assets`.

## 2. Files modified

Shared `Lesson`, `CodeLabController`, `LessonController`, `SubmissionController`, `CourseController`, and `LessonCodeValidator` integrate the course without another management system. Course management, catalogue, lesson index/editor/preview and submission-review TSX files display/edit the new metadata and support Bootstrap workspaces.

`javascript-editor.tsx` adds optional Bootstrap preview/viewport controls; `javascript-engine.js` adds the limited component-command bridge, full-document handling, select-value support and practice DOM checks. Existing JavaScript mode remains supported. `package.json`/lock pin the dependency and add the asset build step. Snapshot scripts support the `bootstrap` label. The actual `.env`, normal account passwords and deferred .NET sandbox were not changed.

## 3. Database changes

Additive nullable course fields: `category`, `recommended_prerequisites`. Additive nullable lesson fields: `accessibility_tip`, `responsive_tip`. Existing HTML/CSS/JavaScript source, expected results, validation metadata, quiz/rubric and progress/submission fields are reused.

Encrypted backup: `storage/app/private/course-backups/before-bootstrap-20261012-222142.encrypted` (filename uses the host clock). Verification confirms identical original-column values for **12 previous courses, 36 modules, 285 lessons, 4 users, 5 progress records, 4 submissions, 2 feedback records, 5 case studies and 67 activity logs**, plus the original education/enrollment/case-progress records. The normal catalogue now contains **13 courses, 39 modules and 303 lessons**. The separate browser-test SQLite fixture received only the additive migration and Bootstrap course seeder; accounts were not reset.

## 4. Course

Published College course, name **Bootstrap**, slug `bootstrap`, category **Web Development / Front-End**, difficulty **Beginner to Advanced**, language **Bootstrap**, editor `html-css-bootstrap`, provider `browser-bootstrap-sandbox`. The idempotent seeder preserves stable identities and existing teacher edits and rejects a conflicting slug/editor rather than overwriting another course.

## 5. Modules

Beginner, Intermediate and Advanced each have exactly six ordered lessons and an **18-question assessment**. Every lesson has five Quick Check questions: **90 lesson questions**. Three projects have the requested **100-point rubrics**.

## 6. Lessons

| Module | Ordered lessons |
| --- | --- |
| Beginner | Introduction to Bootstrap; Containers, Grid, and Responsive Layout; Typography, Colors, and Spacing; Buttons, Images, and Tables; Forms and Basic Components; Responsive Student Profile Page project |
| Intermediate | Navigation Components; Advanced Grid and Flexbox Utilities; Cards, List Groups, and Content Layout; Modals, Offcanvas, Collapse, and Accordion; Form Validation and Interactive Components; Student Registration Dashboard project |
| Advanced | Bootstrap Customization; Advanced Responsive Design; Bootstrap with JavaScript; Bootstrap with Dynamic Data; Performance, Accessibility, and Best Practices; Bootstrap Student Information System UI project |

Each lesson provides measurable objectives, concepts/classes, HTML/CSS/JS examples and starters, guided/independent practice, expected results, debugging, accessibility/responsive/security tips, quiz and completion requirements. Projects include view/component requirements, milestones, testing and submission guidance. UI projects are explicitly fictional front-end applications with in-memory changes and mock login feedback.

## 7. Version/configuration

**Bootstrap 5.3.8**, pinned in npm and centrally described in `resources/bootstrap/config.json`, also read by Laravel config. The build fails if the installed version disagrees. Bootstrap 5 logical spacing and `data-bs-*` conventions are used; no Bootstrap 4/jQuery dependency is introduced. [Official Bootstrap 5.3.8 release](https://blog.getbootstrap.com/2025/08/25/bootstrap-5-3-8/).

## 8. Dependency loading

The preview preloads local Bootstrap CSS and the trusted JavaScript bundle, including Popper. It needs no CDN during lessons. The introduction teaches pinned CDN/SRI setup for a separate external page; CodeLab strips student links/script tags and continues using its local dependencies. Tooltips/popovers receive controlled initialization. The Bootstrap build step is included in production/dev asset preparation.

## 9. HTML/CSS/JS workspace reuse

The existing editor/interpreter provides all three editable files, Run, Stop, Reset, Clear, Save, copying and console output. HTML and CSS are available at every Bootstrap level. Source snapshots preserve all three files and input whitespace, with version checks and immutable teacher review. Teacher submission previews also receive the Bootstrap version. DOM practice checks examine the guest DOM rather than searching source comments; they do not award completion or enforce one exact solution.

## 10. Responsive preview

Mobile, Tablet, Desktop and Full Width controls change the preview viewport. Nominal widths are 375, 768 and 1280 pixels and are test approximations, not device models. Wider frames can scroll horizontally inside the lab. Frame sizing uses a content box so its border does not accidentally reduce the tablet viewport below the `md` breakpoint. Browser measurement confirmed the sample grid changes from one mobile column to two tablet columns and three desktop columns.

## 11. Preview and sandbox

Student JavaScript remains inside bounded QuickJS in a worker; it is not evaluated as native JavaScript in the Laravel page or preview. Only trusted Bootstrap plugins and the preview controller execute natively in an iframe with scripts and form-interaction permission and no same-origin permission. Bootstrap form events/native validation are permitted, while the trusted controller cancels submission and CSP `form-action 'none'` blocks actual form destinations. Other JavaScript previews retain their previous sandbox flags. A parent-bound MessageChannel carries bounded rendered markup, events and allowlisted component commands. Submitted scripts, embedded frames/objects, external dependency tags, inline handlers and dangerous plugin HTML/template/config overrides are removed.

The iframe has a restrictive CSP, no live API networking or form submission, no parent/session access, and bounded markup/node/output sizes. The bridge supports show/hide/toggle/dispose for selected components, limited safe options and selected lifecycle events. Renderer updates preserve appropriate component/focus state; value-only updates synchronize fields without replacing actively edited controls. Option text remains a valid implicit select value through repeated guest snapshots. Existing interpreter time, memory, stack, output and DOM bounds remain in place. These are practice checks; formal approval remains server-side teacher review.

## 12. Prerequisites

HTML/CSS fundamentals and basic JavaScript before advanced interactions are **editable advisory text** on the course/card. They neither grant access to the High School HTML/CSS course nor create permanent enrollment restrictions. Teachers can replace/remove recommendations. Existing lesson prerequisite/gating/manual-unlock mechanisms remain available; a new duplicate course-prerequisite system was not added.

## 13. Dashboard

The shared College catalogue and dashboard include Bootstrap through existing access/publication rules. College now has **11 courses and 258 lessons**; High School remains **2 courses and 45 lessons**. Cross-level access requires existing intentional enrollment/assignment rather than being granted by prerequisite recommendations.

## 14. Admin management

Existing management covers course name/description/publication/gating, category/recommendations, module order/assessments, lesson order/prerequisites, HTML/CSS/JS starters/examples, expected results, accessibility/responsive tips, activities, quizzes, projects, progress and grading. Bootstrap drafts reuse the web-workspace scaffold and remain unpublished. Nullable metadata preserves editing of older courses.

## 15. Progress

Existing course/module/lesson start events, saved versions, activity submission, quiz scores, completion, project submission and rubric grading are reused. Edits supersede pending snapshots; outdated work cannot approve a changed submission. Sequential gating is configurable and manual unlock remains available. Locked published lessons are readable previews without quiz answer keys. Preview success never completes a lesson by itself.

## 16. Accessibility

Examples use semantic landmarks, viewport metadata, heading hierarchy, labels, meaningful buttons, table captions/header scopes, image alt text, live feedback, named modal/offcanvas structures and close controls. Activities require keyboard/focus, contrast, touch, reading-order and responsive tests. Validation styling is clearly distinguished from actual validation, and client checks from required real server checks. The course explains the accessibility limits of custom validation and does not certify arbitrary student pages automatically.

## 17. Tests

- Full Laravel suite: **156 tests, 154 passed, 2 skipped, 7,257 assertions**. Existing tests were retained.
- Six new feature tests cover course/content/idempotency/preservation, College access/enrollment/publication/gating, source snapshots and current approval/rubrics, management/assessments, source-only submissions and editable advisory metadata.
- All 18 Bootstrap examples passed isolated runtime checks, including guest DOM structure, unique IDs/labels, Bootstrap 5 markup, quiz/rubric structure, component commands/lifecycle events, search/empty states and unavailable host globals.
- The existing JavaScript runtime regression checks passed all 18 JavaScript examples and events/forms, mock APIs, timers/modules/storage and CPU/stack/heap/output/DOM limits.
- Production build, TypeScript, project-native formatting/lint, PHP formatting and `git diff --check` passed. Existing nonfatal font/runtime build warnings remain.
- Browser checks confirmed local CSS, responsive grid sizing, modal/offcanvas/accordion/collapse and mobile navbar behavior, programmatic modal opening/closing with guest lifecycle feedback, validation, toast, tooltip and popover behavior. The Advanced project successfully added a fictional student through its modal form: totals changed from three to four and the in-memory success toast appeared. Both Bootstrap and existing JavaScript runtime regressions passed again after correcting implicit select values. Normal MySQL preservation checks passed.

Logs are under `storage/framework/testing/bootstrap-*`. Browser exercises use fictional local fixture data and do not modify normal student work.

Proof images: [course catalogue](bootstrap-course-preview.png), [native Bootstrap components](bootstrap-components.png).

## 18. Limits and local testing

The interpreter uses a practice DOM rather than full native browser APIs. Arbitrary Bootstrap internals/options, synchronous layout measurements and full external APIs require the learner's own development environment. Sass/Utility API customization is taught as an external build process; Sass is not compiled in the browser editor. API exercises use mocks. Login feedback is UI-only, and CRUD changes reset on Run; secure authentication, authorization, durable storage and server validation require a real backend.

Normal Herd course: [Bootstrap](http://studproj_html_css.test/courses/bootstrap). Local fixture: [Bootstrap course](http://127.0.0.1:8017/courses/bootstrap), [login](http://127.0.0.1:8017/login). Student `college.student`; teacher `browser.teacher`; both use `BrowserTest2026!`. These are local testing accounts, not production credentials.

Changes remain local. No GitHub push or Hostinger deployment was performed. The deferred .NET sandbox remains deferred.

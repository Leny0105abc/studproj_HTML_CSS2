# Tailwind CSS College course

Integrated into the existing Laravel CodeLab application. No replacement application, separate course-management system, deployment, GitHub push or credential reset. The deferred .NET sandbox remains deferred.

## 1. Files created

- `database/seeders/TailwindCourseSeeder.php` and `database/data/tailwind-course.json`
- `scripts/author-tailwind-course.mjs`, `scripts/build-tailwind-runtime.mjs`, `scripts/verify-tailwind-runtime.mjs`
- `resources/tailwind/config.json`, `resources/tailwind/base.generated.json`, `config/tailwind.php`
- `resources/js/tailwind-compiler.js`, `resources/js/tailwind-worker.js`
- `public/tailwind-preview.html`, `public/tailwind-preview.js`, generated `public/tailwind-runtime/` compiler/version/license assets
- `resources/js/components/tailwind-editor.tsx`, `resources/js/pages/code-lab/tailwind.tsx`
- `tests/Feature/TailwindCourseTest.php`, this report and browser proof images

Temporary integration and introduction-finalization scripts were removed after use.

## 2. Files modified

`Lesson` model; existing `CodeLabController`, `LessonController` and `SubmissionController`; routes; shared JavaScript editor/interpreter; teacher submission review; package build/dev scripts; safety snapshot and verification scripts. Existing course/category/prerequisite, dashboard, enrollment, progress, grading and lesson-management pages were reused.

## 3. Database changes and preservation

**No new migration or schema changes.** Reuses existing course metadata, HTML/CSS/JS examples/starters, tips, quizzes, rubrics, saved sources, immutable submission snapshots and review fields. Only the Tailwind seeder was applied to normal MySQL and the dedicated browser SQLite fixture. No broad curriculum reseed or database reset occurred.

Prechange encrypted backup: `storage/app/private/course-backups/before-tailwind-20261013-121323.encrypted`. Preservation verification compares every original row and original column: **14 courses, 42 modules, 321 lessons**, four users, five progress records, four submissions, two feedback records, five case studies, 67 activity logs and both education levels unchanged. Existing enrollment/case-study progress records remain intact. Prior uncommitted work is preserved.

Normal catalogue now contains **15 courses, 45 modules, 339 lessons**. College: **13 courses / 294 lessons**. High School: **two courses / 45 lessons**. React and TypeScript were not found as existing courses; none were created or merged by this task.

## 4. Course created

**Tailwind CSS**, slug `tailwind-css`, College, category **Web Development / Front-End**, published, difficulty Beginner to Advanced, technology Tailwind CSS, editor `html-tailwind`, execution provider `browser-tailwind-sandbox`. No Tailwind course existed beforehand. Idempotent first-or-create seeding preserves teacher edits and progress identities. Conflicting course slugs fail rather than overwrite a different course. No existing lessons were deleted or archived.

## 5. Three modules

Beginner, Intermediate and Advanced, ordered 1–3. Six lessons each; each module has an 18-question assessment using the shared assessment management/results flow.

## 6. Eighteen lesson records

Positions 1–18, global numbers **322–339**.

| Level | Lessons in order |
|---|---|
| Beginner | Introduction to Tailwind CSS; Spacing, Sizing, Colors, and Typography; Flexbox and Basic Layout; Grid and Responsive Design; Buttons, Cards, Images, and Forms; Responsive Student Profile Page project |
| Intermediate | Responsive Utilities and State Variants; Advanced Flexbox and Grid; Navigation and Reusable UI Patterns; Forms, Validation, and Interactive Styling; Transitions, Transforms, and Animation; Student Registration Dashboard project |
| Advanced | Tailwind Configuration and Customization; Component Extraction and Design Systems; Dark Mode and Advanced Variants; Tailwind with JavaScript / React; Performance, Accessibility, and Best Practices; Tailwind Student Information System UI project |

Each lesson has three or four measurable objectives, introduction/concepts, utility/class explanations, complete HTML/CSS/JS examples, starters, guided practice, independent activity, expected results, common errors, debugging/security/accessibility/responsive tips, summary/next lesson and completion requirements. Five quick checks each, **90 total**, with rotated answer positions. Three projects carry the requested **25/20/15/10/10/10/5/5** rubric totaling 100. Project activities include required regions/views, milestones, organization guidance and responsive/accessibility/testing/submission requirements.

## 7. Version and configuration

Detected and reused **Tailwind CSS 4.3.3**, already installed with `@tailwindcss/vite` in the existing Vite/React build. No new Tailwind version/dependency was installed. Central preview configuration is `resources/tailwind/config.json`, read by Laravel and the compiler. Runtime build verifies it matches the installed package, resolves that package's default CSS and includes its license. The course generator reads the same version.

Teaches v4 CSS-first `@theme`, named tokens and intentional extensions rather than forcing obsolete v3 config-file patterns. Introduction explicitly distinguishes provided CodeLab setup, external Vite setup and development-only Play CDN. Primary references checked: [Vite installation](https://tailwindcss.com/docs/installation/using-vite), [Play CDN](https://tailwindcss.com/docs/installation/play-cdn), [theme variables](https://tailwindcss.com/docs/theme), [class detection](https://tailwindcss.com/docs/detecting-classes-in-source-files), [dark mode](https://tailwindcss.com/docs/dark-mode).

## 8. Lesson loading and sandbox

The preview automatically compiles utilities using a **local trusted Tailwind compiler in a worker inside the opaque preview iframe**. No CDN, second version, parent app stylesheet or Bootstrap bundle is injected into Tailwind previews. The runtime is rebuilt by the existing build/build:ssr/predev scripts; students do not repeat setup boilerplate.

Compile candidates include complete HTML/JavaScript tokens and rendered classes, including `data-[state=ready]` and explicit conditional mappings. Supports ordinary custom CSS, inline `@theme`, selective `@apply` and custom variants. Does not load filesystem configs, external imports, plugins or source files; unsupported directives produce a clear error. Input/candidate/output limits and a ten-second worker timeout apply. Generation IDs ignore stale replies and worker-loading is deduplicated.

Student JavaScript remains in the existing bounded QuickJS worker, not evaluated in the native page. Preview has scripts/forms interaction permission without same-origin permission; CSP blocks actual form submission, embedded frames/objects and arbitrary network assets. Trusted code sanitizes markup, strips scripts/handlers/dependency tags/styles from HTML and bridges native events through a parent-bound MessageChannel. Forms can dispatch practice submit events but cannot send a real request. Links may navigate to an existing fragment inside the preview; external/document navigation is cancelled. The only native fetches load allowlisted public compiler/version assets without credentials. No host files, parent DOM, authentication/session cookies, tokens, CodeLab storage or production APIs are granted to learner source.

## 9. HTML/CSS/JS lab reuse

Reuses shared editor, console, isolated interpreter, Run/Stop/Reset/Clear/Save/Copy, all three files, input fixtures, source version checks and teacher review. Tailwind mode opens HTML/CSS controls, permits HTML-only Run, clears all three files and renders the Tailwind preview. Existing JavaScript and Bootstrap modes retain their own behavior/dependencies.

Teacher submission previews receive Tailwind version configuration. DOM practice checks inspect the guest DOM, not source comments, and do not award completion or require one exact class sequence. Responsive/native visual checks supplement them. Existing file snapshots preserve source whitespace and remain immutable after submission.

## 10. Responsive preview

Mobile **375px**, Tablet **768px**, Desktop **1280px**, Full Width. Fixed-width content-box sizing preserves intended CSS breakpoint width; wider frames scroll horizontally within the lab. Full Width uses border-box sizing to fit its container without a border-induced scrollbar. These are test widths, not exact device models. Native measurement confirmed one mobile column, two tablet columns and three desktop columns. Tailwind page uses explicit shrinkable grid columns/items so long source lines cannot enlarge Full Width: final preview and editor container both measured about **331px** on a 397px page. Flex/sidebar/menu examples use mobile-first layouts and appropriate overflow.

## 11. Dark mode

Default preview variant: `@custom-variant dark (&:where(.dark, .dark *));`. A manual toggle changes `.dark` only on the guest theme wrapper and updates `aria-pressed`. Backgrounds/text/borders/cards/inputs/navigation have theme variants. Isolated practice storage demonstrates theme persistence concepts but resets on Run; it does not change CodeLab preferences. Course explains the alternative default system-preference strategy and external production persistence.

Native verification confirmed light/dark computed colors and working manual toggle. ARIA/data state classes also generated real green-state color and a four-pixel ring.

## 12. JavaScript and React

Vanilla JavaScript examples implement menus, view switches, validation feedback, explicit status maps and fictional in-memory CRUD/search/filter/sort/pagination. Student names use safe text insertion. Utilities alone are not presented as behavior, authentication or persistence. Form success is explicitly client-only; real applications need server validation/access control.

Advanced lesson includes optional React props/state/component source with complete `className` mappings and safe text rendering. It is intended for an external configured React project; this QuickJS lab does **not** pretend to execute JSX or provision a React build. Arbitrary `bg-${color}-500` construction is discouraged.

## 13. Prerequisites

Editable advisory HTML/CSS recommendation; basic JavaScript for advanced interaction; optional React fundamentals. No permanent hardcoded prerequisite restriction or cross-level access grant. Teachers can replace/remove recommendations using existing course management. HTML/CSS, Bootstrap, JavaScript, WordPress and Tailwind remain separate courses.

## 14. Student dashboard

Shared College catalogue/dashboard includes Tailwind under existing access/publication rules. Course page displays category/recommendations, 18 lessons and six-lesson progress groups. High School access still needs explicit existing enrollment/assignment. No new hardcoded dashboard totals or enrollment system.

## 15. Admin integration

Existing teacher management edits course metadata/publication/gating, modules/assessments, lesson order/prerequisites, HTML/CSS/JS examples/starters, expected results, tips, activities, quizzes and rubric. Tailwind drafts reuse the web-workspace scaffold and remain unpublished. Existing student progress, submission queue, feedback and grading remain in place.

## 16. Progress tracking

Reuses course/module/lesson start events, enrollment, versioned saves, activity/project submission, quiz scores, teacher completion and project grading. Default sequential gating, configurable disable and manual unlock remain. Locked published lessons have readable previews without answer keys. Passing a quiz or running the preview cannot automatically complete the activity; approval requires the latest unchanged submitted work and a passed 4/5 quiz. Project rubric grading is required, and approved work is read-only.

## 17. Accessibility

Semantic HTML, headings, table captions/header scopes, permitted images with alternatives, labeled forms, live feedback, meaningful controls, visible focus and readable contrast. Examples include group focus, native invalid/checked state styling, responsive menus and reduced-motion variants.

Trusted Tailwind preview helpers support focus entry/trapping and return for visible semantic modal dialogs. Escape travels to guest handlers; templates implement close behavior. If a row opener disappears, a surviving list control or search/focusable fallback remains available. Native tests confirmed focus entry, Shift-Tab wrapping, Escape closure, opener return and real modal form submission. Full ARIA tab widgets are distinguished from simpler disclosure buttons; utility styles alone do not certify accessibility.

## 18. Verification

- Full Laravel suite against finished assets: **168 tests, 166 passed, two skipped, 7,857 assertions**. Existing tests retained. Five new course feature tests cover preservation/idempotency/content/modules, access/enrollment/dashboard/gating/previews, all-file saves/current immutable submission/quiz/rubric approval, admin drafts/assessments and source-only server handling.
- All 18 Tailwind examples compile and execute in the isolated model; tests check structure, unique IDs/labels, quizzes/rubrics, breakpoints/group/peer/reduced-motion output, custom tokens, attribute variants, dark/status changes, modal/mock registration, empty results and unavailable host globals. External imports/plugins are rejected.
- Existing JavaScript runtime suite passed all 18 examples and event/form/API/storage/timer/module/isolation/resource checks. Bootstrap runtime/curriculum/component checks passed.
- Production build completed; TypeScript, project-native lint/format, PHP formatting/syntax and diff checks passed. Existing nonfatal runtime/font build warnings remain. An initial full run collided with generated asset rebuilding; it was rerun successfully after the build completed.
- Native browser checks: actual utility styling, 1/2/3-column grid, HTML-only Run, hover/group focus/peer invalid-valid/checked styles, manual dark mode, mobile menu and ARIA/data ring; final project modal focus/keyboard handling and fictional add/edit/delete/empty-search states. Adding a fictional student changed count three to four; edit changed grade to 89; confirmed deletion returned count to three. No actual student record was modified.
- Normal MySQL preservation verified separately. Browser tests use only the dedicated SQLite fixture and unsaved example overrides; introductory work was restored afterward.

Logs: `storage/framework/testing/tailwind-*`. Proof: [introductory lab](tailwind-lab-preview.png), [in-memory project](tailwind-project-preview.png), [course](tailwind-course-preview.png).

## 19. Remaining limits and testing links

The practice DOM is not a full browser API implementation. Native layout reads, full React/JSX execution, arbitrary filesystem configuration/plugins/imports and external live APIs require an authorized development project. Plain user CSS is limited to 50,000 characters in preview; candidates and generated CSS are bounded. The native compiler has timeout/input/output limits, rather than a separate hard heap ceiling like QuickJS.

Manual dark mode is preconfigured; system-theme detection is explained for external projects. Storage, login and CRUD are fictional/in-memory and reset on Run. The course does not claim real authentication, permanent records, email delivery or a full production student system. Production sites should use the normal static Tailwind build, not this learning compiler. Visual accessibility checks remain teacher/student responsibilities.

Normal Herd: [Tailwind CSS](http://studproj_html_css.test/courses/tailwind-css). Dedicated local fixture: [course](http://127.0.0.1:8017/courses/tailwind-css), [login](http://127.0.0.1:8017/login). Existing local testing accounts: student `college.student`; teacher `browser.teacher`; password `BrowserTest2026!`. These are CodeLab testing credentials, not production accounts. Changes remain local.

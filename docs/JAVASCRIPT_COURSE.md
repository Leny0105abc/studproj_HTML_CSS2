# JavaScript Programming

Added to the existing Laravel CodeLab platform on 12 October 2026.

## Course structure

Published **College** course, slug `javascript-programming`, editor `javascript`, provider `browser-javascript-sandbox`. It remains a separate course from any High School Basic JavaScript course. The seeder does not update other courses and rejects a conflicting slug belonging to a different education level or editor.

There are **18 lessons: six Beginner, six Intermediate, and six Advanced**. Each has objectives, explanation, example code, an activity, expected example console output, debugging/security notes, a challenge, and a five-question quiz. There are 90 lesson questions, 12 assessment questions per module, and three projects with 100-point rubrics.

The attachment ends during the Beginner project. The user explicitly authorized a standard Intermediate/Advanced syllabus.

| Beginner | Intermediate | Advanced |
| --- | --- | --- |
| Introduction, Variables, and Data Types | Objects, JSON, and Destructuring | Modern JavaScript Modules and Classes |
| Input, Output, and Operators | Array Methods and Callbacks | Asynchronous JavaScript |
| Conditional Statements | DOM Selection and Manipulation | Fetch, APIs, and Reliable Data Loading |
| Loops and Arrays | Events, Forms, and Validation | Browser Storage and JavaScript Security |
| Functions | Scope, Closures, and Error Handling | Testing, Debugging, and Performance |
| Student Grade Calculator project | Interactive Student Records project | Student Information Frontend project |

Beginner follows the supplied six-lesson outline, including strict/coercing equality, type conversion, bounded loops, grade validation, arrays, reusable functions, and the grade calculator. Intermediate develops records, DOM rendering, forms, events, closures, and errors. Advanced introduces local modules/classes, promises/async-await, API error states, storage/security, tests, and an integrated frontend.

Project rubrics: functionality 30; JavaScript concepts 25; input validation 15; interface/accessibility 10; readability 10; testing 10. Activities specify requirements, development steps, sample behavior, and edge-case testing. All records are fictional.

Curriculum is stored in `database/data/javascript-course.json`; `scripts/author-javascript-course.mjs` reproduces it and executes each example before writing the JSON. `JavascriptCourseSeeder` uses `firstOrCreate`, preserving later teacher edits.

## Shared platform workflow

The course reuses Course → Module → Lesson, enrollment, education-level access, locked lesson previews, sequential gating, manual unlocks, quizzes, versioned saves/submissions, teacher review, assessments, dashboard, reports, and administration.

College students see the course automatically. High-school students require explicit assignment to this College course. The first lab is available immediately; later lessons are visible for preview and unlock through the existing completion rules.

The workspace has JavaScript, HTML, CSS, and Lab inputs. HTML/CSS/JS and input whitespace are preserved in versioned saves. Source uses the existing `html_code`, `css_code`, `js_code`, and `program_input` fields; only two nullable lesson columns (`starter_javascript`, `example_javascript`) were added.

Submitting captures all files and inputs. Editing any of them invalidates the pending snapshot. Passing the quiz with at least 4/5 and obtaining teacher approval of the current submission are both required; a successful Run or matching output never awards completion. Projects require all rubric categories. Teacher-approved work becomes read-only and unlocks the next lesson. Teacher review includes all three files and practice execution. Teachers can edit content/examples/starters/quizzes/rubrics/assessments and create unpublished JavaScript drafts.

## Isolated browser lab

Student code executes in a QuickJS interpreter compiled to WebAssembly inside a dedicated browser worker. It is not evaluated in the CodeLab page, PHP, or Node server. The VM exposes only educational APIs; it has no host `process`, `require`, worker `postMessage`, WebAssembly interface, application cookies, or real storage/filesystem/network access. A Function-constructor escape stays inside the VM.

The interpreter controller and preview use opaque sandbox iframes (`allow-scripts`, without `allow-same-origin`) with strict CSP and private MessageChannels. Only fixed public runtime assets are CORS-enabled. The worker loads these assets without cookies; the VM has no network bridge. No server JavaScript execution endpoint was added.

Pinned dependencies: QuickJS Emscripten 0.32.0 and LinkeDOM 0.18.13. The practice DOM library itself executes inside the interpreter, so its objects do not expose host objects. Rendering passes bounded HTML to an isolated preview. Active elements and event-handler attributes are removed in a detached template before attachment; navigation/form submission and remote resources are blocked. Preview input/click/change/submit events are forwarded back to the practice DOM. Student names should still use `textContent` in their own programs.

Run starts a fresh worker/context. Stop and all errors terminate it; interactive sessions expire after ten minutes. Fatal guest stack/allocation faults can also cause a native cleanup assertion under stress. The implementation retains the original guest diagnostic and discards the entire failed worker rather than reusing that instance.

### Practice API differences

This is an educational browser model, not a complete native browser environment:

- Common selectors, element creation, text, attributes/classes/styles, and basic DOM events are supported. Layout measurement, canvas, navigation, native file access, and other browser-specific APIs are outside the model.
- `prompt()` consumes strings from the Lab inputs `prompts` array and returns null when exhausted. `alert()` prints a labeled console message instead of opening a dialog.
- Timers advance in virtual time, with bounded jobs. Examples demonstrate callback/microtask ordering, not real elapsed delays.
- `fetch()` reads supplied mock fixtures only. It never contacts a real endpoint. Fixtures support HTTP status, `ok`, and JSON/text responses for success/error/empty-state exercises.
- `localStorage` and `sessionStorage` use the same temporary practice map, reset on Run. Lessons explain the different lifetimes and risks of real browser storage.
- Modules are restricted to supplied local `.js` text. No remote or host filesystem module loading is permitted.

Example Lab inputs:

```json
{
  "prompts": ["12", "4", "/"],
  "modules": {
    "./math.js": "export const double = value => value * 2;"
  },
  "fixtures": {
    "/api/students": {
      "status": 200,
      "data": [{"id": 1, "name": "Ana", "grade": 88}]
    }
  }
}
```

Try example loads the lesson's code, HTML, CSS, and sample inputs together. Saving preserves source and input definitions, not the running DOM or practice storage.

### Resource limits

- 32 MiB interpreter heap and 512 KiB interpreter stack.
- Actual WebAssembly memory supplied with a 128 MiB maximum; verification confirms the interpreter uses that same Memory object.
- Interrupt deadlines: two seconds for initial student execution, one second for an event/snapshot. Independent controller deadlines: 20 seconds loading, five seconds initial execution, 2.5 seconds for events.
- 100,000 JavaScript characters, 100,000 HTML characters, 50,000 CSS characters, 20,000 input characters.
- 64 KiB console output including newline bytes, 64 KiB rendered HTML, and 500 preview elements.
- At most ten supplied local modules, 100 prompt strings, 100 queued timers, 100 timer steps, 200 pending jobs per drain, and bounded temporary storage.

## Preservation and installation

Encrypted pre-change snapshot: `storage/app/private/course-backups/before-javascript-20261012-032722.encrypted`.

Migration and course-only seeding were applied to the normal MySQL database and the dedicated browser-test SQLite database. Existing account seeders were not rerun and passwords were not reset. The preservation verifier confirms all original seven courses, 195 lessons, four users, five progress records, four submissions, two feedback records, five case studies, and 67 activity logs remain identical on their original columns.

The normal catalogue now has eight courses / 213 lessons. College has six courses / 168 lessons; High School retains two courses / 45 lessons. A regression test also creates a hypothetical pre-existing High School Basic JavaScript course and verifies its record is unchanged by seeding College JavaScript.

For another installation:

```powershell
npm ci
npm run build
php artisan migrate --force
php artisan db:seed --class=JavascriptCourseSeeder --force
```

Build, build:ssr, and predev generate `public/javascript-runtime`. Deploy these assets, the interpreter/preview HTML and JS, and Laravel build output. No external JavaScript service, Docker, or production execution credentials are required.

## Verification

- Full Laravel suite: **116 passed, 2 skipped; 5,200 assertions** (118 tests). `storage/framework/testing/javascript-all-test-results.json`.
- Five JavaScript feature tests cover complete/idempotent curriculum, preservation/separation, College access/assignment/publication, 6-lesson counts, gating/previews, whitespace-preserving three-file saves, stale versions, snapshots, quiz/teacher/rubric completion, read-only approval, admin edits/drafts, assessments, and storing an infinite loop as text without server execution.
- Real interpreter verification: all 18 examples match stored console expectations; additional checks cover module loading, mock fetch, virtual storage/timers, form events, no host globals, constructor escape attempts, CPU/stack/heap/WASM limits, and console/DOM bounds. `storage/framework/testing/javascript-runtime-results.log`.
- Browser verification confirms all three six-lesson modules, first-lesson console/DOM output, and a live form input/button event updating both preview and console. Saves/reloads preserve the restored original example. No quizzes or teacher approvals were performed in the browser fixture.
- TypeScript and production build checks passed. Targeted lint and PHP formatting were checked.

Repeat runtime verification with `node scripts/verify-javascript-runtime.mjs` after building. Repeat normal-data verification with `php scripts/verify-course-snapshot.php javascript`.

Primary dependency references: [QuickJS Emscripten](https://github.com/justjake/quickjs-emscripten) and [LinkeDOM](https://github.com/WebReflection/linkedom).

## Test access

[JavaScript course](http://127.0.0.1:8017/courses/javascript-programming) · [First JavaScript lab](http://127.0.0.1:8017/code-lab/196).

| Existing test role | Username | Password |
| --- | --- | --- |
| College student | `college.student` | `BrowserTest2026!` |
| Teacher/admin | `browser.teacher` | `BrowserTest2026!` |
| High-school student | `highschool.student` | `BrowserTest2026!` |

These are fictional accounts in the dedicated browser-test database, `storage/framework/testing/python-browser.sqlite`. High-school access to College JavaScript still requires assignment. Normal Herd site: [JavaScript course](http://studproj_html_css.test/courses/javascript-programming), using its existing accounts.

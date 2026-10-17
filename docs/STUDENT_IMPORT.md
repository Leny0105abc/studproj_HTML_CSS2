# Import Students

Open [Students](http://studproj_html_css.test/students) as a teacher and choose **Import students**, beside the existing **Add student** button. Direct entry: [Import Students](http://studproj_html_css.test/students/import).

## Teacher workflow

1. Download `student_import_template.xlsx`. Replace the fictitious example on the first worksheet with student records. The second worksheet explains the format.
2. Fill the required education_level column in every row with High School or College. Mixed levels may be uploaded together; there is no batch default.
3. Select or drag in a UTF-8 CSV or XLSX file. Review Ready, Duplicate and Invalid rows and their counts. Uploading does not create accounts.
4. Correct problems in the source file and upload again, or confirm importing only ready rows. Existing usernames/emails are always skipped; there is no overwrite option.
5. Read the import summary. Copy the temporary credentials before leaving or refreshing. Use Download Error Report for skipped/invalid rows, View Students, or Import Another File.

## Implementation report

### Files created

- `app/Http/Controllers/StudentImportController.php`: template, upload, preview, confirmation, result and error report.
- `app/Services/StudentImportService.php`: bounded CSV/XLSX parsing, controlled header aliases, validation, duplicate detection, safe preview data and counts.
- `config/student-import.php`: upload/row/cell/archive limits and preview lifetime.
- `resources/js/pages/students/import.tsx`: upload, drag/drop, preview, error states, confirmation, summary and one-time credentials.
- `tests/Feature/StudentImportTest.php`: authorization, uploads, validation, duplicates, account creation, transaction rollback and manual-account regression coverage.
- `docs/STUDENT_IMPORT.md` and `docs/student-import-preview.jpg`: report and browser evidence.

### Files modified

- `resources/js/pages/students/index.tsx`: action area only; Import students added beside Add student.
- `app/Services/StudentAccountService.php`: shared `create()` operation, retaining generated usernames/passwords and student-account defaults.
- `app/Http/Controllers/StudentController.php`: manual Add Student delegates account creation to the shared service.
- `routes/web.php`: six import routes, before the dynamic student resource route, inside existing authenticated, verified, active-teacher authorization.
- `composer.json`, `composer.lock`: PhpSpreadsheet dependency and four new supporting packages; existing dependencies were not upgraded.
- `.env.example`: configurable import file and row limits. The actual `.env` was not edited.

### Routes

| Method | URL | Purpose |
|---|---|---|
| GET | `/students/import` | Upload form |
| GET | `/students/import/template` | XLSX template |
| POST | `/students/import/preview` | Validate upload and prepare preview |
| GET | `/students/import/{token}` | Owner's preview or result |
| POST | `/students/import/{token}` | Confirm ready rows |
| GET | `/students/import/{token}/errors` | CSV error report |

### Spreadsheet package and template

No spreadsheet dependency was present. Added `phpoffice/phpspreadsheet` **5.10.0**, with a `^5.10` Composer constraint. It reads the first XLSX worksheet as values and never requests calculated values. The implementation follows the package's [reading guidance](https://phpspreadsheet.readthedocs.io/en/latest/topics/reading-files/), rejects formula cells, and bounds ZIP expansion before parsing. XLS and macro-enabled formats are not accepted.

The XLSX template has `first_name`, `middle_name`, `last_name`, `username`, `education_level`, `grade_level`, `program`, `section`, `email`, `password`, `status`, and optional `lrn`, plus an Instructions worksheet. A `name` / `Student Name` / `student_name` column can replace the separate name fields. This reuses existing nullable name-part fields; there is no schema migration.

### Validation and duplicates

- Required headers: username, education_level, grade_level, section; also name or both first_name and last_name. Duplicate recognized headers are rejected. Unrecognized columns are ignored, including role.
- Required row values: combined name, username, education_level, grade_level and section. High School requires a grade in 7–12; College requires a year in 1–6. The level is never inferred from the grade. Existing length limits apply: name 255, name parts 80, grade 30, section 50, username 100 and email 255 characters.
- Usernames are trimmed/lowercased and permit ASCII letters, digits, dot, underscore and hyphen, starting with a letter or digit. Database and within-file username/email checks are case-insensitive.
- Emails are optional, validated when supplied, and unique. A blank email uses the current `username@student.local` convention; generated-email collisions are also checked.
- Optional provided passwords must have 8–128 characters. Blank passwords use the existing secure 12-character generator. Status defaults to active and accepts the existing active, disabled and archived values.
- A missing grade/section is invalid. There is no separate class table: those fields remain text, matching Add Student. Unknown grade/section labels are not rejected as missing class relationships because no such relationship exists.
- Blank records are ignored. CSV supports UTF-8 BOM, quoted fields and embedded commas. Malformed/unsupported files, missing headers, oversized cells and invalid UTF-8 fail before preview.
- Duplicate accounts are skipped, never updated. Invalid rows cannot reserve usernames and block later valid rows. Only Ready rows are imported. Validation repeats at confirmation to detect intervening account creation.
- Optional LRN identifiers reuse the existing unique field (maximum 30 characters), with database and within-file duplicate detection. Blank LRNs remain null. Format identifiers as text in Excel to preserve leading zeroes.

### Password, enrollment and progress handling

Both entry points now call `StudentAccountService::create()`. It always assigns role student, hashes the supplied/generated password, verifies the username-based account, and sets `must_change_password=true`, exactly as the previous manual flow did. Usernames, credentials and existing accounts are never reset by this feature. No email is sent.

Existing manual creation has no automatic enrollment/profile/progress initialization. Import follows that behavior: no enrollments, copied progress, completions or submissions are invented. Each explicitly supplied row education level determines course visibility through the current access system. Enrollment does not bypass education-level compatibility.

### Authorization, temporary data and transactions

Only the application's existing authorized active-teacher role can use the feature. No admin role or permission expansion was invented. Students cannot open, preview, confirm or download import resources. CSRF/session protections remain and mutation routes are throttled to ten requests per minute.

Each random preview token belongs to the uploading teacher and expires after 60 minutes. Preview data, including supplied passwords, is encrypted with the application key in private Laravel file cache. The source upload is not copied to permanent storage. Confirmation replaces preview rows with an encrypted password-free result. Credentials are encrypted in a one-time session flash and removed when the result is first served. Result responses and downloads use no-store headers. Copy credentials while visible; password reset remains available through the existing teacher workflow if they are lost.

Confirmation uses an exclusive token lock and a database transaction for the whole eligible batch. Repeated confirmation of a completed token returns its result rather than creating accounts again. A database/account-creation exception rolls back all new accounts in the batch and returns a generic explanation without logging exception text or student data. Operational logs contain uploader ID and row counts only. Concurrent uniqueness conflicts roll back the batch; upload again to refresh validation.

Error CSVs contain only row number, student name, username and errors. Formula-like prefixes are escaped for spreadsheet applications. Passwords are absent from previews, error downloads, normal student lists, audit logs and completed cached results.

There is no permanent import-history table. Results and error reports are available to their owner for the temporary cache lifetime. Expired cache entries follow Laravel's private file-cache expiration/cleanup behavior.

### Limits and remaining scope

Defaults: 5 MB upload, 100 student rows, 20 columns, 4,096 bytes per cell, 1,000 XLSX ZIP entries and 20 MB total expanded workbook contents. Configure `STUDENT_IMPORT_MAX_FILE_KB` / `STUDENT_IMPORT_MAX_ROWS` to change batch limits; PHP/web-server upload and request time limits also apply. Use smaller batches rather than increasing the synchronous limit without reviewing server capacity.

CSV/XLSX only; only the first worksheet is imported. There is no browser cell editor, account-overwrite mode, automatic class creation, email delivery, persistent import history or background-job import. Correct source files and upload again. Existing Students pagination/search, account views, course assignment and grading are retained.

### Verification

Automated results are recorded in `storage/framework/testing/student-import-all-results.log`: **204 passed, 2 existing registration tests skipped, 10,395 assertions** across 206 tests. The 14 import tests also passed independently with 213 assertions. These original import results predate the explicit education-level enhancement; see [Student education levels](STUDENT_EDUCATION_LEVELS.md) for current validation and full regression results. The tests use a separate in-memory SQLite database, not the normal application's MySQL data. Browser checks use the normal site for existing teacher sign-in, the new Students action, a fictitious mixed-row preview and error-report download. Desktop (1440px) and mobile (390px) previews had no page-wide horizontal overflow. No preview accounts were committed to the normal database; its five existing student accounts remain.

The live authenticated template endpoint was additionally verified over HTTP: status 200, attachment `student_import_template.xlsx`, 8,211 bytes. Opening that downloaded workbook confirmed Students and Instructions worksheets and all ten headers. The in-app browser's download-event API did not report XLSX downloads, so the HTTP response and actual workbook were checked directly.

TypeScript checking, production build and targeted PHP formatting checks passed. Composer validation passed and Composer reported no known vulnerability advisories in the resolved dependencies. The existing WASM build emits its previous optional-font/direct-eval/Node-import warnings; the build completes.

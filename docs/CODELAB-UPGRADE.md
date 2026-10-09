# CodeLab installation and upgrade

This expansion belongs to `Leny0105abc/studproj_HTML_CSS2`. The original repository and hosted HTML/CSS application remain separate. Review and test this release before deploying it to an existing school installation.

## Upgrade an existing installation

1. Back up the database with your database provider's export tool and copy persistent `storage/app` files. Verify the backup can be restored in a separate database. Keep the current `.env` and `APP_KEY`: existing accounts, encryption, mail and database settings must survive the upgrade.
2. Test the upgrade against a copy of that database first. Record counts of users, lessons, progress, submissions and feedback before and after. Test an existing student login, saved HTML/CSS, a completed lesson, a pending submission and a teacher review.
3. Install this release's PHP dependencies and build its assets. Use PHP 8.3+ and the project's supported Node runtime.

   ```sh
   composer install --no-dev --optimize-autoloader
   npm ci
   npm run build
   ```

4. During the scheduled release window, put the application in maintenance mode and apply the additive migration:

   ```sh
   php artisan down
   php artisan migrate --force
   php artisan optimize:clear
   php artisan codelab:admin EXISTING_TEACHER_USERNAME
   php artisan up
   ```

   Replace the username with your existing active teacher's username. This command promotes that account to administrator and preserves its password. Other existing teachers keep their teacher role and receive the existing HTML/CSS assignment. Never run `migrate:fresh`, `migrate:refresh` or the full development seeder on an existing school database.

5. Optionally set `APP_NAME="CodeLab"` and rebuild assets to update the browser title. Keep the real production `APP_URL`, database connection and existing `APP_KEY`. Use `APP_ENV=production`, `APP_DEBUG=false` and the host's HTTPS/session configuration.
6. Sign in as the administrator and open `/admin`. Review program associations and existing accounts before publishing new content. New course placeholders remain drafts; only the existing HTML/CSS course is published by the upgrade.

The new migration associates existing lesson and project IDs with HTML & CSS, puts existing students in High School with HTML/CSS enrollment, and assigns existing teachers to that course. Existing lesson bodies, passwords, scores, saved code, submission versions and completion records are retained. No curriculum seeder is required for this upgrade. `CurriculumSeeder` is intended for a fresh development database and can overwrite existing lesson text.

Schema rollback removes the new platform structures, including newly created courses and their associations. It cannot recover new platform data after removal. Keep a full backup, restore the previous application release together with the appropriate database backup when reverting a deployed release, and rehearse this on a separate database first.

## Fresh development installation

```sh
composer install
copy .env.example .env
php artisan key:generate
npm ci
php artisan migrate --seed
php artisan codelab:admin teacher
npm run build
php artisan serve --host=127.0.0.1 --port=8000
```

These seeders create demonstration accounts and the original HTML/CSS curriculum. The `teacher` password is taken from `DEV_TEACHER_PASSWORD`; the generated student password is printed by the seeder. Use demonstration credentials only in development. `codelab:admin` deliberately requires an existing active teacher; it does not create a hidden default administrator.

## Add a course from the administrator interface

1. Open `/admin/courses`. Create a draft course, choose its program(s), difficulty, editor and progression rule, and assign teachers.
2. Open `/admin/modules` and create ordered modules for that course. Draft modules hide their lessons from learners.
3. Open `/admin/lessons`. Add objectives, content, examples, practice instructions, optional reflection, starter code and a quiz. The content editor supports simple Markdown, code blocks, lists, links, tables and callouts. Raw HTML is not interpreted as trusted lesson markup.
4. Add assessments through `/admin/activities` and projects through `/admin/projects`. Teachers review submitted activity answers and code in Activities and the existing Submissions queue.
5. Publish ready modules and lessons, then publish the course. Test it with a student account in the intended program. Draft courses are shown as Coming soon to eligible students; their lessons cannot be opened.
6. Use `/admin/enrollments` for cross-program assignments or suspension. An explicit suspended enrollment overrides program access. Ordinary eligible students are enrolled when they open a published course.

Legacy HTML/CSS retains its established editor, coding checks and five-question quiz (four choices per question; passing score 4/5). New courses support flexible quizzes, attempt limits, optional shuffle and passing percentages. Quizzes with recorded progress cannot be edited in place; duplicate the lesson to preserve old results. Archiving retains student records and work.

## Execution providers

| Editor | Current behavior |
| --- | --- |
| HTML/CSS | Existing sandboxed browser preview, no scripts |
| JavaScript + browser | Isolated iframe and worker console, network disabled, two-second execution cutoff |
| Python, SQL, Java, PHP, VB.NET, C/C++ | Source editing, saving and teacher review; execution unavailable until a secure provider is integrated |
| Scratch | Block-based activity guidance; embedded Scratch integration remains future work |
| None | Reading, practice and assessment without a code runner |

Choosing `pyodide`, `sql_sandbox` or `sandbox_api` records the intended provider; it does not install or connect a runtime. New language courses can be created without source changes, but supporting a new execution environment requires an audited integration. Student code is never executed on the Laravel host.

## Offline computer lab

The earlier [LAN setup](LAN.md) and Windows startup script are retained. Install dependencies and build assets before disconnecting from the internet. Run the PHP application and database on the lab server, and have clients open the server's LAN address. Browser HTML/CSS and JavaScript exercises work locally; AI tutoring and future external execution services require connectivity. Use Apache/Nginx or an equivalent supported PHP server for whole-class sessions and test with the expected number of students. The PHP development server is for local verification.

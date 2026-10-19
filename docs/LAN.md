# CodeLab on the computer-lab network

## One-click Windows start and stop

Double-click **START_CODELAB_LAN.cmd** in the project folder on the server computer.
It detects the active Wi-Fi/Ethernet IPv4 address, checks Laravel, the existing
database and built frontend, starts the server, and opens the login page. Give
students the **client URL printed in the server window**. All clients use that
same address in a browser on the same lab network. Do not give clients `localhost`,
`127.0.0.1`, or the server's Herd `.test` hostname.

The first start may show a Windows administrator approval prompt. This configures
one named firewall rule for this PHP executable, TCP port, local IPv4 address and
its directly attached IPv4 subnet. It works with the current Windows network
profile without changing that profile or disabling the firewall. No router port
forwarding is configured. School IT may need to approve lab connections.

Use your **existing student and teacher accounts**. Nothing is reseeded or reset.
Keep the server PC awake and connected. Press **Enter** in the server window to
stop, or double-click **STOP_CODELAB_LAN.cmd**. If a window was forcibly closed,
the stop file also stops a remaining server. Starting again detects an existing
instance rather than launching a duplicate. The stop file validates the saved
process identity; it does not stop Herd or unrelated PHP apps.

An IP can change after reconnecting to Wi-Fi; stop and restart to display the new
address. A DHCP reservation keeps it stable. Multiple adapters are ranked by active
physical/default-gateway interfaces; use `-ServerIP` to select another.

The launchers start this installed application; they are not standalone installers.
Herd/PHP, the configured database service, dependencies and built assets must exist
on the server. Student PCs need only a browser. Startup makes no `.env`, database,
account, migration, seeding, GitHub or hosting changes.

One PC runs PHP, this project, and its database. Every student opens the server's
LAN address in a browser. Lessons, logins, coding checks, quizzes, autosaves,
submissions, teacher feedback, and reports work without an internet connection.
The server must stay powered on and connected; students still need the local
network. This is not an offline copy on each student PC.

## Prepare the server once

Install PHP 8.3+, Composer, Node.js, and the project's dependencies while internet
is available. Follow the README installation instructions. Keep the database on
the server; clients do not need PHP, Node.js, or database access. This existing
installation keeps using its current database and accounts.

Build the frontend once (and again after frontend updates):

```powershell
npm run build
```

The build includes JavaScript, CSS, and fonts locally. Runtime does not require
npm or Vite. Stop `composer run dev` / `npm run dev` before starting LAN mode. If
`public/hot` remains after stopping Vite, remove only that file and rebuild.
The launcher refuses to run while that file exists, so clients cannot accidentally
receive localhost Vite URLs.

Use a DHCP reservation or a static address for the server. Use the actual Ethernet
or Wi-Fi address on the lab network, not the Herd `.test` name or `localhost`.
Change the seeded teacher password before students use the server. Back up the
database and uploaded files regularly. Do not rerun the full database seeder on
an existing lab database: it can reset development accounts.

## Try LAN access on Windows

From the project folder:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-lan.ps1
```

The launcher prints the student URL and automatically prefers an active physical
adapter with a default gateway. To choose another address or port explicitly:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-lan.ps1 -ServerIP 192.168.1.10 -Port 8000
```

Replace the example IP with the server's address. Clients then open
`http://192.168.1.10:8000`. Press Enter in the terminal to stop, or use the stop file.
This launches PHP's built-in server for a connectivity trial. On Windows it
handles one request at a time, so use the web-server setup below for a full class.

The launcher uses process-only settings: debug output off, host-only sessions for
HTTP, offline mode on, email logged locally, and the LAN address as APP_URL. It
bypasses cached configuration without changing `.env` or clearing shared caches.
It also disables Inertia SSR and private Java/.NET code-runner services for this
process, so it does not depend on development services at localhost. It does not
install dependencies, migrate, seed, or reset student records. Normal app requests
continue to save sessions, learning progress and submissions in the existing database.
PHP upload limits are set to 24 MB per file and 96 MB per request; the application's
smaller per-activity limits still apply. This accommodates Office workbooks and
teacher demonstration media without changing the installed PHP configuration.

Use username/password login over this HTTP LAN address. Passkey authentication
requires a browser-trusted HTTPS origin; it is not provided by this launcher.

Optional switches:

```powershell
# Read-only preflight; do not start a server or request firewall approval.
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-lan.ps1 -CheckOnly

# When school IT already manages firewall access; skip automatic rule setup.
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-lan.ps1 -NoFirewall

# Optional unattended start without opening the browser; use the stop file later.
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-lan.ps1 -Background -NoBrowser
```

Startup/HTTP logs are under `storage/logs/lan-server.stdout.log` and
`storage/logs/lan-server.stderr.log`. Runtime PID/address metadata stays private
under `storage/app/private/lan`. The process is verified by PID, creation time,
project path and listening command before the stop file terminates it.

If Windows Firewall blocks access, run this once in **Administrator PowerShell**
on the server for a trusted lab network configured as Private:

```powershell
New-NetFirewallRule -DisplayName "CodeLab LAN 8000" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8000 -Profile Private -RemoteAddress LocalSubnet
```

Use the selected port if different. No router port forwarding is needed.
School IT may need to permit connections between lab clients and the server.

## Regular whole-class hosting

Use Apache or Nginx with PHP on the server, listening on the lab interface. Point
its document root at this project's **public** directory and route missing paths
to `public/index.php`. Never serve the project root, which contains `.env` and
database credentials. Apache must enable rewriting and honor `public/.htaccess`.
Refer to Laravel's deployment configuration:
https://laravel.com/framework/docs/deployment

On a dedicated lab installation, configure `.env` for the chosen address/port:

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=http://192.168.1.10:8000
SESSION_DOMAIN=null
SESSION_SECURE_COOKIE=false
LAB_OFFLINE=true
MAIL_MAILER=log
```

Leave `ASSET_URL` unset. Keep the existing APP_KEY and database settings. Use
MySQL or PostgreSQL locally for a busy lab; do not expose the database port to
students. Run `php artisan config:cache` after configuration changes. The launcher
is not needed when Apache/Nginx serves the app. Use HTTPS and secure session
cookies if school IT provides a local certificate trusted by all clients.

## What still needs external resources

- AI tutoring is disabled in offline mode even if an API key exists.
- Email delivery is disabled; teachers can reset student credentials locally.
- The password breach lookup is skipped in offline mode; the six-character minimum and
  confirmation checks remain active.
- Built-in `placehold.co` sample images render as a locally served lesson image,
  including previews of older lessons and drafts. Saved source is preserved.
- External website links, student-added remote assets, and example media files
  such as `music.mp3` / `video.mp4` need actual accessible files. Add teacher-owned
  media under `public/media` and use paths such as `/media/music.mp3` in activities.

## Verify from a client PC

1. Open the printed URL and sign in as a student.
2. Open a lesson, run code, save, answer the quiz, and submit.
3. Sign in as the teacher on another PC and check that the submission appears.
4. Disconnect the internet uplink while keeping the lab network connected, then
   reload and repeat. Verify the local image in an image lesson too.

If access fails, try the same LAN URL on the server first. Then check the address,
firewall, web-server port, and Wi-Fi client isolation or VLAN rules. A `.test`
hostname will not resolve on other PCs without additional local DNS setup.

## Launcher verification

The current Windows installation passed automatic address/PHP/database/asset
readiness checks, start detection, duplicate-start detection, and stop checks.
`node tests/lan-smoke.mjs http://SERVER-IP:8000` checks real HTTP responses through
the LAN address: login HTML, same-origin assets, HTTP session cookies, valid CSRF
reaching database authentication, protected redirects and denial of private paths.
The offline/authentication feature tests also pass. A second client PC and the
administrator firewall prompt cannot be validated by the host-only smoke check;
use the client checklist above before a class session.

PHP documents its [built-in server](https://www.php.net/manual/en/features.commandline.webserver.php)
as a single-threaded development/demo server, with no worker processes on Windows.
For simultaneous classroom load, use the Apache/Nginx setup above. The launcher
does not expose the app to the public internet or implement HTTPS.

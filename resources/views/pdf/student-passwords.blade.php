<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Student login details</title>
    <style>
        @page { margin: 38px 42px 50px; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 10px; color: #172033; line-height: 1.5; }
        h1 { margin: 4px 0 6px; font-size: 23px; color: #172554; }
        .brand { color: #4338ca; font-size: 11px; font-weight: bold; letter-spacing: 1px; }
        .meta { margin: 0 0 14px; color: #536074; }
        .note { padding: 12px 14px; margin-bottom: 18px; background: #f1f5f9; border-left: 3px solid #4338ca; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        thead { display: table-header-group; }
        th { color: #fff; background: #1e293b; text-align: left; padding: 11px 10px; }
        td { padding: 10px; border-bottom: 1px solid #dbe2eb; vertical-align: top; overflow-wrap: break-word; word-wrap: break-word; }
        tr { page-break-inside: avoid; }
        tbody tr:nth-child(even) { background: #f8fafc; }
        .password { font-family: 'DejaVu Sans Mono', monospace; font-size: 12px; letter-spacing: 1px; }
    </style>
</head>
<body>
    <div class="brand">CODELAB ACADEMY</div>
    <h1>Student login details</h1>
    <p class="meta">Generated {{ $generatedAt }} &nbsp; | &nbsp; {{ count($credentials) }} selected {{ count($credentials) === 1 ? 'student' : 'students' }}</p>
    <div class="note">These are newly generated temporary passwords. Students must choose a new password after signing in. Share each login only with its student. Keep this list private.</div>
    <table>
        <thead><tr><th style="width: 42%">Name</th><th style="width: 35%">Username</th><th style="width: 23%">Password</th></tr></thead>
        <tbody>
        @foreach ($credentials as $credential)
            <tr><td>{{ $credential['name'] }}</td><td>{{ $credential['username'] }}</td><td class="password">{{ $credential['password'] }}</td></tr>
        @endforeach
        </tbody>
    </table>
</body>
</html>

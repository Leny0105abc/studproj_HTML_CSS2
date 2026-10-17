$ErrorActionPreference = 'Stop'
$previewRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$previewDatabase = Join-Path $previewRoot 'storage\framework\testing\programming-browser.sqlite'
$previewPhp = Join-Path $env:USERPROFILE '.config\herd\bin\php84\php.exe'
$previewPublic = Join-Path $previewRoot 'public'
$previewRouter = Join-Path $previewRoot 'vendor\laravel\framework\src\Illuminate\Foundation\resources\server.php'
$previewLogs = Join-Path $previewRoot 'storage\logs'

if (-not (Test-Path -LiteralPath $previewDatabase)) {
    throw 'The separate programming test database is missing. Existing application data was not changed.'
}
if (-not (Test-Path -LiteralPath $previewPhp)) {
    throw 'The configured Herd PHP executable is missing.'
}
if (Get-NetTCPConnection -State Listen -LocalPort 8028 -ErrorAction SilentlyContinue) {
    Write-Output 'Port 8028 is already listening. Open http://127.0.0.1:8028/login'
    exit 0
}

# Only this child process receives the test configuration. Do not edit .env or reset data.
$env:DB_CONNECTION = 'sqlite'
$env:DB_DATABASE = $previewDatabase
$env:DB_URL = ''
$env:APP_URL = 'http://127.0.0.1:8028'
$env:JAVA_SANDBOX_ENABLED = 'false'
$env:LARAVEL_SERVER_PUBLIC_PATH = $previewPublic
$previewProcess = Start-Process -FilePath $previewPhp -ArgumentList @(
    '-S', '127.0.0.1:8028', '-t', ('"' + $previewPublic + '"'), ('"' + $previewRouter + '"')
) -WorkingDirectory $previewPublic -WindowStyle Hidden -RedirectStandardOutput (Join-Path $previewLogs 'programming-preview.stdout.log') -RedirectStandardError (Join-Path $previewLogs 'programming-preview.stderr.log') -PassThru
$previewProcess.Id | Set-Content -LiteralPath (Join-Path $previewLogs 'programming-preview.pid')
Write-Output "CodeLab test server started in background (PID $($previewProcess.Id)): http://127.0.0.1:8028/login"

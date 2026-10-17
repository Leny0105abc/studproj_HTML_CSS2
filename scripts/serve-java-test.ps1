# Local, fictional browser fixtures only. No normal database/account changes.
$javaWorkspaceRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $javaWorkspaceRoot
$javaFixturePath = Join-Path $javaWorkspaceRoot 'storage/framework/testing/python-browser.sqlite'
if (-not (Test-Path -LiteralPath $javaFixturePath)) { throw 'Create the dedicated browser fixture database first.' }
$env:APP_ENV = 'local'
$env:DB_CONNECTION = 'sqlite'
$env:DB_DATABASE = $javaFixturePath
$env:SESSION_DRIVER = 'file'
$env:JAVA_SANDBOX_ENABLED = 'true'
$env:JAVA_SANDBOX_PROVIDER = 'judge0-public-test'
php artisan serve --host=127.0.0.1 --port=8017 --no-reload

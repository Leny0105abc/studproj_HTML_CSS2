param(
    [ValidateRange(1024, 65535)][int]$Port = 8000,
    [string]$ServerIP,
    [switch]$NoBrowser,
    [switch]$NoFirewall,
    [switch]$CheckOnly,
    [switch]$Background,
    [switch]$Stop
)
$ErrorActionPreference = 'Stop'
$projectPath = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$publicPath = Join-Path $projectPath 'public'
$routerPath = Join-Path $projectPath 'vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php'
$stateDirectory = Join-Path $projectPath 'storage/app/private/lan'
$statePath = Join-Path $stateDirectory 'server.json'

function Get-CodeLabServer {
    if (-not (Test-Path -LiteralPath $statePath)) { return $null }
    try {
        $saved = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
        $running = Get-Process -Id $saved.pid -ErrorAction Stop
        $details = Get-CimInstance Win32_Process -Filter "ProcessId = $($running.Id)"
        if ($saved.project -eq $projectPath -and $running.StartTime.ToUniversalTime().Ticks.ToString() -eq $saved.started -and $details.CommandLine.Contains($routerPath) -and $details.CommandLine.Contains("$($saved.address):$($saved.port)")) {
            return @{ Process = $running; State = $saved }
        }
    } catch { }
    return $null
}
function Stop-CodeLabServer {
    $server = Get-CodeLabServer
    if ($server) {
        Stop-Process -Id $server.Process.Id -ErrorAction Stop
        Write-Host 'CodeLab LAN server stopped. Saved student work is retained.'
    } else { Write-Host 'No running CodeLab LAN server was found.' }
    if (Test-Path -LiteralPath $statePath) { Remove-Item -LiteralPath $statePath }
}
if ($Stop) { Stop-CodeLabServer; exit 0 }
foreach ($required in @('.env', 'vendor/autoload.php', 'public/build/manifest.json')) {
    if (-not (Test-Path -LiteralPath (Join-Path $projectPath $required))) { throw "Missing $required. Complete the existing installation and npm run build first." }
}
if (Test-Path -LiteralPath (Join-Path $publicPath 'hot')) { throw 'Vite development mode is active (public/hot exists). Stop npm run dev / composer run dev, then remove that stale marker if necessary and run npm run build.' }
$phpCommand = Get-Command php -ErrorAction SilentlyContinue
if (-not $phpCommand) {
    $herdPhp = Join-Path $env:USERPROFILE '.config/herd/bin/php.bat'
    if (Test-Path -LiteralPath $herdPhp) { $phpCommand = Get-Item -LiteralPath $herdPhp }
}
if (-not $phpCommand) { throw 'PHP 8.3+ is required. Start/install Laravel Herd or add PHP to PATH.' }
$phpSource = if ($phpCommand.Source) { $phpCommand.Source } else { $phpCommand.FullName }
$phpPath = (& $phpSource -r 'echo PHP_BINARY;') | Select-Object -Last 1
if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $phpPath -PathType Leaf)) { throw 'Could not resolve the installed PHP executable.' }
$addresses = @(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.AddressState -eq 'Preferred' })
if ($ServerIP) {
    if ($ServerIP -notin $addresses.IPAddress) { throw 'ServerIP must be an active IPv4 address assigned to this computer.' }
} else {
    $gateways = @(Get-NetRoute -DestinationPrefix '0.0.0.0/0' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty InterfaceIndex)
    $physical = @(Get-NetAdapter -Physical -ErrorAction SilentlyContinue | Where-Object Status -eq 'Up' | Select-Object -ExpandProperty ifIndex)
    $chosen = $addresses | Sort-Object @{Expression = { if ($_.InterfaceIndex -in $physical -and $_.InterfaceIndex -in $gateways) { 0 } elseif ($_.InterfaceIndex -in $physical) { 1 } elseif ($_.InterfaceIndex -in $gateways) { 2 } else { 3 } }}, @{Expression = { $_.InterfaceIndex }}, IPAddress | Select-Object -First 1
    if (-not $chosen) { throw 'No active LAN address found. Connect the server PC to Wi-Fi or Ethernet and start again.' }
    $ServerIP = $chosen.IPAddress
}
$url = "http://${ServerIP}:$Port"
$existing = Get-CodeLabServer
if ($existing -and -not $CheckOnly) {
    Write-Host "CodeLab is already running: $($existing.State.url)/login"
    Write-Host 'Use STOP_CODELAB_LAN.cmd before starting on another address or port.'
    if (-not $NoBrowser) { Start-Process "$($existing.State.url)/login" }
    exit 0
}
# Process-only overrides: the normal Herd/Hostinger .env and cached settings stay intact.
$overrides = @{
    APP_ENV = 'production'; APP_DEBUG = 'false'; APP_URL = $url
    APP_CONFIG_CACHE = Join-Path $projectPath ('storage/framework/lan-config-' + [guid]::NewGuid().ToString() + '.php')
    SESSION_DOMAIN = 'null'; SESSION_SECURE_COOKIE = 'false'; SESSION_SAME_SITE = 'lax'; SESSION_COOKIE = "codelab_lan_${Port}_session"
    LAB_OFFLINE = 'true'; ASSET_URL = 'null'; MAIL_MAILER = 'log'; INERTIA_SSR_ENABLED = 'false'
    JAVA_SANDBOX_ENABLED = 'false'; CSHARP_SANDBOX_ENABLED = 'false'; VBNET_SANDBOX_ENABLED = 'false'
}
$previous = @{}
$worker = $null
$keepRunning = $false
$startupLock = $null
Push-Location $projectPath
try {
    foreach ($name in $overrides.Keys) {
        $previous[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
        [Environment]::SetEnvironmentVariable($name, $overrides[$name], 'Process')
    }
    & $phpPath (Join-Path $PSScriptRoot 'lan-check.php')
    if ($LASTEXITCODE -ne 0) { throw 'LAN startup checks failed. See the message above; no database changes were made.' }
    Write-Host "LAN address: $url/login"
    if ($CheckOnly) { Write-Host 'Readiness check only. No server or firewall changes made.'; exit 0 }
    New-Item -ItemType Directory -Path $stateDirectory -Force | Out-Null
    try { $startupLock = [IO.File]::Open((Join-Path $stateDirectory 'startup.lock'), 'OpenOrCreate', 'ReadWrite', 'None') }
    catch { throw 'Another launcher is starting CodeLab. Wait a few seconds and try again.' }
    if (Get-CodeLabServer) { throw 'CodeLab was just started in another window. Run the launcher again to open it.' }
    $listener = New-Object Net.Sockets.TcpListener([Net.IPAddress]::Parse($ServerIP), $Port)
    try { $listener.Start() } catch { throw "Port $Port is already in use. Start with -Port 8001, or close the other server." } finally { $listener.Stop() }
    if (-not $NoFirewall) {
        $ruleName = 'CodeLab-LAN-' + $Port + '-' + $ServerIP.Replace('.', '-')
        $rule = Get-NetFirewallRule -Name $ruleName -ErrorAction SilentlyContinue | Where-Object { $_.Enabled -eq 'True' -and $_.Action -eq 'Allow' }
        if ($rule) {
            $applicationRule = $rule | Get-NetFirewallApplicationFilter
            if ($applicationRule.Program -ine $phpPath) { $rule = $null }
        }
        if (-not $rule) {
            Write-Host 'Windows may request administrator approval once to allow this PHP server from the local subnet only.'
            $firewallScript = Join-Path $PSScriptRoot 'configure-lan-firewall.ps1'
            try {
                $firewall = Start-Process -FilePath 'powershell.exe' -Verb RunAs -WindowStyle Hidden -Wait -PassThru -ArgumentList @('-NoLogo', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ('"' + $firewallScript + '"'), '-Port', $Port, '-ServerIP', $ServerIP, '-PhpPath', ('"' + $phpPath + '"'))
                if ($firewall.ExitCode -ne 0) { throw 'Firewall setup did not finish.' }
            } catch { throw 'LAN firewall setup was not approved or school policy blocked it. Ask IT to allow this PHP executable/port from the lab subnet. Use the documented -NoFirewall option when IT already manages access.' }
        }
    }
    $outputLog = Join-Path $projectPath 'storage/logs/lan-server.stdout.log'
    $errorLog = Join-Path $projectPath 'storage/logs/lan-server.stderr.log'
    $worker = Start-Process -FilePath $phpPath -WorkingDirectory $publicPath -WindowStyle Hidden -PassThru -RedirectStandardOutput $outputLog -RedirectStandardError $errorLog -ArgumentList @('-d', 'display_errors=0', '-d', 'upload_max_filesize=24M', '-d', 'post_max_size=96M', '-S', "${ServerIP}:$Port", '-t', ('"' + $publicPath + '"'), ('"' + $routerPath + '"'))
    $ready = $false
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        if ($worker.HasExited) { break }
        try {
            $request = [Net.HttpWebRequest]::Create("$url/up")
            $request.Proxy = $null; $request.Timeout = 1500
            $response = $request.GetResponse()
            $ready = [int]$response.StatusCode -eq 200
            $response.Close()
            if ($ready) { break }
        } catch { Start-Sleep -Milliseconds 250 }
    }
    if (-not $ready) { throw 'The server did not become ready. Check storage/logs/lan-server.stderr.log and storage/logs/laravel.log.' }
    @{ project = $projectPath; pid = $worker.Id; started = $worker.StartTime.ToUniversalTime().Ticks.ToString(); address = $ServerIP; port = $Port; url = $url } | ConvertTo-Json | Set-Content -LiteralPath $statePath -Encoding UTF8
    $startupLock.Dispose(); $startupLock = $null
    Write-Host ''
    Write-Host 'CODELAB ACADEMY - LAN SERVER IS READY' -ForegroundColor Green
    Write-Host "Clients on the same network open: $url/login" -ForegroundColor Cyan
    Write-Host 'Use existing student and teacher accounts. Keep this PC awake and connected.'
    Write-Host 'PHP/Node/database software is needed only on the server, not student PCs.'
    Write-Host 'This Windows launcher handles one request at a time; see docs/LAN.md for full-class hosting.'
    Write-Host 'External AI, email delivery and private code-runner services are disabled in LAN mode.'
    if (-not $NoBrowser) { Start-Process "$url/login" }
    if ($Background) {
        $keepRunning = $true
        Write-Host 'Background mode. Double-click STOP_CODELAB_LAN.cmd to stop.'
    } else {
        Write-Host 'Press Enter in this window to stop. STOP_CODELAB_LAN.cmd also stops the server.'
        Read-Host | Out-Null
    }
} finally {
    if ($startupLock) { $startupLock.Dispose() }
    if ($worker -and -not $keepRunning) {
        if (-not $worker.HasExited) { Stop-Process -Id $worker.Id -ErrorAction SilentlyContinue }
        $registered = Get-CodeLabServer
        if (-not $registered -and (Test-Path -LiteralPath $statePath)) { Remove-Item -LiteralPath $statePath }
    }
    foreach ($name in $previous.Keys) { [Environment]::SetEnvironmentVariable($name, $previous[$name], 'Process') }
    Pop-Location
}

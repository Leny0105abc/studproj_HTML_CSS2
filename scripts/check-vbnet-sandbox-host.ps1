[CmdletBinding()]
param()

# Read-only readiness check. Does not install software, enable Windows features,
# accept agreements, reboot, execute student code, or change CodeLab settings.
$ErrorActionPreference = 'Stop'
$cpuReadiness = Get-CimInstance Win32_Processor | Select-Object -First 1
$systemReadiness = Get-CimInstance Win32_ComputerSystem
$osReadiness = Get-CimInstance Win32_OperatingSystem
$dockerCommand = Get-Command docker -ErrorAction SilentlyContinue
$dockerLocations = @(
    'C:\Program Files\Docker\Docker\resources\bin\docker.exe',
    (Join-Path $env:LOCALAPPDATA 'Programs\DockerDesktop\resources\bin\docker.exe')
)
$dockerInstalled = $null -ne $dockerCommand -or @($dockerLocations | Where-Object { Test-Path -LiteralPath $_ }).Count -gt 0
$wslInstalled = $false
$wslVersionText = ''
try {
    $wslVersionText = (& wsl.exe --version 2>&1 | Out-String).Replace([string][char]0, '').Trim()
    $wslInstalled = $LASTEXITCODE -eq 0
} catch {
    $wslVersionText = 'WSL version unavailable.'
}
$virtualizationAvailable = [bool]$systemReadiness.HypervisorPresent -or [bool]$cpuReadiness.VirtualizationFirmwareEnabled
$blockers = @()
if (-not $virtualizationAvailable) { $blockers += 'Enable firmware virtualization on the computer before installing a WSL 2 sandbox.' }
if (-not $wslInstalled) { $blockers += 'WSL 2 is not installed; installation can require administrator approval and a restart.' }
if (-not $dockerInstalled) { $blockers += 'Docker is not installed on Windows. Docker Engine inside WSL is another option; this check does not inspect that engine.' }

[pscustomobject]@{
    CheckedAt = (Get-Date).ToString('o')
    Computer = "$($systemReadiness.Manufacturer) $($systemReadiness.Model)"
    OperatingSystem = $osReadiness.Caption
    WindowsBuild = $osReadiness.BuildNumber
    MemoryGiB = [math]::Round($systemReadiness.TotalPhysicalMemory / 1GB, 1)
    HardwareSupportsVirtualization = [bool]$cpuReadiness.VMMonitorModeExtensions
    FirmwareVirtualizationEnabled = [bool]$cpuReadiness.VirtualizationFirmwareEnabled
    HypervisorPresent = [bool]$systemReadiness.HypervisorPresent
    WslInstalled = $wslInstalled
    WslVersion = $wslVersionText
    WindowsDockerInstalled = $dockerInstalled
    PrerequisiteBlockers = $blockers
    SandboxVerified = $false
    NextStep = 'After prerequisites, create an isolated .NET 10 console service and verify it before enabling CodeLab Run. Readiness alone does not establish isolation.'
} | ConvertTo-Json -Depth 4

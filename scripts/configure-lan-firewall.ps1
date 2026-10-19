param(
    [Parameter(Mandatory = $true)][ValidateRange(1024, 65535)][int]$Port,
    [Parameter(Mandatory = $true)][string]$ServerIP,
    [Parameter(Mandatory = $true)][string]$PhpPath
)
$ErrorActionPreference = 'Stop'
try {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { throw 'Administrator approval is needed for the LAN firewall rule.' }
    $address = Get-NetIPAddress -AddressFamily IPv4 -IPAddress $ServerIP -ErrorAction Stop | Select-Object -First 1
    if ($ServerIP -like '127.*' -or $ServerIP -like '169.254.*' -or $address.AddressState -ne 'Preferred') { throw 'Choose an active LAN IPv4 address.' }
    if (-not (Test-Path -LiteralPath $PhpPath -PathType Leaf) -or [IO.Path]::GetFileName($PhpPath) -ne 'php.exe') { throw 'A PHP executable is required.' }
    $bytes = [Net.IPAddress]::Parse($ServerIP).GetAddressBytes()
    $network = for ($i = 0; $i -lt 4; $i++) {
        $bits = [Math]::Min(8, [Math]::Max(0, $address.PrefixLength - 8 * $i))
        $mask = 256 - [Math]::Pow(2, 8 - $bits)
        [int]$bytes[$i] -band [int]$mask
    }
    $subnet = ($network -join '.') + '/' + $address.PrefixLength
    $name = 'CodeLab-LAN-' + $Port + '-' + $ServerIP.Replace('.', '-')
    Get-NetFirewallRule -Name $name -ErrorAction SilentlyContinue | Remove-NetFirewallRule
    New-NetFirewallRule -Name $name -DisplayName "CodeLab LAN $ServerIP port $Port" -Description 'CodeLab PHP server: selected LAN address and directly attached IPv4 subnet only.' -Direction Inbound -Action Allow -Protocol TCP -LocalPort $Port -LocalAddress $ServerIP -RemoteAddress $subnet -Program $PhpPath -Profile Any -EdgeTraversalPolicy Block | Out-Null
    exit 0
} catch { Write-Error $_; exit 1 }

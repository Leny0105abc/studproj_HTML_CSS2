# Downloads Microsoft compiler/reference packages for verifying authored examples.
# This is never invoked by Laravel or student requests and is not a student runner.
$ErrorActionPreference = 'Stop'
$validationRoot = Join-Path (Get-Location) 'storage/app/private/vbnet-validation'
New-Item -ItemType Directory -Force -Path $validationRoot | Out-Null
Add-Type -AssemblyName System.IO.Compression.FileSystem
$packages = @(
    @('microsoft.net.compilers.toolset', '4.11.0'),
    @('microsoft.netcore.app.ref', '8.0.19'),
    @('microsoft.windowsdesktop.app.ref', '8.0.19'),
    @('microsoft.data.sqlite.core', '8.0.19'),
    @('sqlitepclraw.core', '2.1.6'),
    @('sqlitepclraw.bundle_e_sqlite3', '2.1.6'),
    @('sqlitepclraw.provider.e_sqlite3', '2.1.6'),
    @('sqlitepclraw.lib.e_sqlite3', '2.1.6')
)
foreach ($package in $packages) {
    $packageName = $package[0]; $packageVersion = $package[1]
    $targetDirectory = Join-Path $validationRoot "$packageName-$packageVersion"
    if (Test-Path (Join-Path $targetDirectory '.complete')) { continue }
    $packageFile = Join-Path $validationRoot "$packageName.$packageVersion.nupkg"
    if (!(Test-Path $packageFile)) {
        Invoke-WebRequest -Uri "https://api.nuget.org/v3-flatcontainer/$packageName/$packageVersion/$packageName.$packageVersion.nupkg" -OutFile $packageFile
    }
    # NuGet registration content hash verifies the downloaded archive before extraction.
    $registration = Invoke-RestMethod -Uri "https://api.nuget.org/v3/registration5-semver1/$packageName/$packageVersion.json"
    if (!([string]$registration.catalogEntry).StartsWith('https://api.nuget.org/v3/catalog0/')) { throw 'Unexpected NuGet catalogue URL' }
    $catalogue = Invoke-RestMethod -Uri $registration.catalogEntry
    if ($catalogue.packageHashAlgorithm -ne 'SHA512') { throw 'Unexpected NuGet hash algorithm' }
    $receipt = [string]$catalogue.packageHash
    $sha = [System.Security.Cryptography.SHA512]::Create()
    try { $actual = [Convert]::ToBase64String($sha.ComputeHash([IO.File]::ReadAllBytes($packageFile))) } finally { $sha.Dispose() }
    if ($actual -ne $receipt.Trim()) { throw "Integrity mismatch: $packageName" }
    New-Item -ItemType Directory -Force -Path $targetDirectory | Out-Null
    $archive = [IO.Compression.ZipFile]::OpenRead($packageFile)
    try {
        $allowedRoot = [IO.Path]::GetFullPath($targetDirectory) + [IO.Path]::DirectorySeparatorChar
        foreach ($entry in $archive.Entries) {
            $destination = [IO.Path]::GetFullPath((Join-Path $targetDirectory $entry.FullName))
            if (!$destination.StartsWith($allowedRoot, [StringComparison]::OrdinalIgnoreCase)) { throw 'Archive path escapes package directory' }
            if (!$entry.Name) { New-Item -ItemType Directory -Force -Path $destination | Out-Null; continue }
            New-Item -ItemType Directory -Force -Path (Split-Path $destination -Parent) | Out-Null
            [IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $destination, $true)
        }
    } finally { $archive.Dispose() }
    Set-Content -LiteralPath (Join-Path $targetDirectory '.complete') -Value $actual
    Write-Output "Verified Microsoft/NuGet package: $packageName $packageVersion"
}

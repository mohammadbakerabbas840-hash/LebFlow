$ErrorActionPreference = 'Stop'
$runtime = Join-Path $PSScriptRoot '../.runtime/qdrant'
$binary = Join-Path $runtime 'qdrant.exe'
if (!(Test-Path -LiteralPath $binary)) { throw 'Install the official Qdrant Windows release into .runtime/qdrant first. See SECURITY.md.' }
$env:QDRANT__SERVICE__HOST = '127.0.0.1'
$env:QDRANT__TELEMETRY_DISABLED = 'true'
Start-Process -FilePath $binary -WorkingDirectory $runtime -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtime 'stdout.log') -RedirectStandardError (Join-Path $runtime 'stderr.log')
Write-Output 'Qdrant started on loopback port 6333. This development runtime is not a public server.'

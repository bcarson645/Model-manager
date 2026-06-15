# Stop dev servers on Model Manager port, clean cache, start fresh
$ErrorActionPreference = "SilentlyContinue"
$port = 3010
$projectRoot = Join-Path $PSScriptRoot ".."

# Kill any node process listening on our port
$connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
foreach ($conn in $connections) {
    $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Host "Stopping $($proc.ProcessName) on port $port (PID $($proc.Id))..."
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
}

Start-Sleep -Seconds 2

Set-Location $projectRoot
npm run clean
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Cache cleanup incomplete - close other terminals and retry"
}

npm run dev

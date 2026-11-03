param([ValidateRange(1024,65535)][int]$Port = 8000)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path -LiteralPath "$projectRoot/dist/index.html")) { throw 'Missing build. Run scripts\setup.cmd first.' }
if (-not (Test-Path -LiteralPath "$projectRoot/backend/.venv/Scripts/python.exe")) { throw 'Missing virtualenv. Run scripts\setup.cmd first.' }
$previousServe = $env:SOC_SERVE_FRONTEND
Push-Location "$projectRoot/backend"
try {
    $env:SOC_SERVE_FRONTEND = '1'
    Write-Host "SOC Mini Lab: http://127.0.0.1:$Port (Ctrl+C to stop)"
    & ./.venv/Scripts/python.exe -m uvicorn app.main:app --host 127.0.0.1 --port $Port
    if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne -1073741510) { throw 'Server exited with an error. Check port availability.' }
} finally {
    $env:SOC_SERVE_FRONTEND = $previousServe
    Pop-Location
}

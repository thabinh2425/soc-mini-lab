$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location $projectRoot
try {
    & npm.cmd run test
    if ($LASTEXITCODE -ne 0) { throw 'Frontend tests failed.' }
    & npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw 'Build failed.' }
    Push-Location backend
    try {
        & ./.venv/Scripts/python.exe -m pytest -q
        if ($LASTEXITCODE -ne 0) { throw 'Backend tests failed.' }
    } finally { Pop-Location }
    & node scripts/smoke.mjs
    if ($LASTEXITCODE -ne 0) { throw 'HTTP integration checks failed.' }
    Write-Host 'All release checks passed.'
} finally { Pop-Location }

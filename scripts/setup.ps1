param([switch]$SkipBuild)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location $projectRoot
try {
    & node -e "const [major, minor] = process.versions.node.split('.').map(Number); if (!((major === 20 && minor >= 11) || major === 22 || major >= 24)) process.exit(1)"
    if ($LASTEXITCODE -ne 0) { throw 'Use Node.js 20.11+, 22.x, or 24+.' }
    & python -c "import sys; assert sys.version_info[:2] == (3,12), 'Use Python 3.12'"
    if ($LASTEXITCODE -ne 0) { throw 'Python 3.12 must be available as python.' }
    if (-not (Test-Path -LiteralPath 'backend/.venv/Scripts/python.exe')) {
        & python -m venv backend/.venv
        if ($LASTEXITCODE -ne 0) { throw 'Could not create virtualenv.' }
    }
    & ./backend/.venv/Scripts/python.exe -m pip install -r backend/requirements.lock.txt
    if ($LASTEXITCODE -ne 0) { throw 'Python dependency installation failed.' }
    & ./backend/.venv/Scripts/python.exe -m pip check
    if ($LASTEXITCODE -ne 0) { throw 'Python dependency verification failed.' }
    & npm.cmd ci
    if ($LASTEXITCODE -ne 0) { throw 'npm ci failed.' }
    if (-not $SkipBuild) {
        & npm.cmd run build
        if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed.' }
    }
    Write-Host 'Setup complete. Run scripts\start.cmd for the local production app.'
} finally { Pop-Location }

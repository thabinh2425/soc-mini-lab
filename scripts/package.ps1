$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path -LiteralPath "$projectRoot/dist/index.html")) { throw 'Run scripts\check.cmd before packaging.' }
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$releaseDir = Join-Path $projectRoot 'release'
New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null
$archivePath = Join-Path $releaseDir ("soc-mini-lab-" + (Get-Date -Format 'yyyyMMdd-HHmmss') + ".zip")
$include = @('dist','src','scripts','backend/app','backend/migrations','backend/tests','docs',
    'backend/requirements.txt','backend/requirements.lock.txt','backend/pytest.ini',
    'README.md','MILESTONES.md','package.json','package-lock.json','index.html',
    'vite.config.ts','vitest.config.ts','tsconfig.json','tsconfig.app.json','tsconfig.node.json',
    'tailwind.config.js','postcss.config.js','.env.example','backend/.env.example','.gitignore')
$stream = [IO.File]::Open($archivePath, [IO.FileMode]::CreateNew)
$zip = New-Object IO.Compression.ZipArchive($stream, [IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($relative in $include) {
        $entryPath = Join-Path $projectRoot $relative
        if (-not (Test-Path -LiteralPath $entryPath)) { throw "Missing package entry: $relative" }
        $files = if (Test-Path -LiteralPath $entryPath -PathType Container) {
            Get-ChildItem -LiteralPath $entryPath -Recurse -File | Where-Object { $_.FullName -notmatch '[\\/]__pycache__[\\/]|\.pyc$' }
        } else { Get-Item -LiteralPath $entryPath }
        foreach ($file in $files) {
            $name = $file.FullName.Substring($projectRoot.Length + 1).Replace('\','/')
            [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $name) | Out-Null
        }
    }
} finally { $zip.Dispose(); $stream.Dispose() }
Write-Host "Package created: $archivePath"

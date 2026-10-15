$ErrorActionPreference = 'Stop'
Write-Host '==========================================================' -ForegroundColor Cyan
Write-Host ' FaceTrace AI - Full-Stack Application Launch (Port 3000) ' -ForegroundColor Cyan
Write-Host '==========================================================' -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw 'Node.js is not installed or not in PATH. Install a current LTS release, then reopen VS Code.'
}

$nodeVersion = (& node -p "process.versions.node").Trim()
Write-Host "Node.js $nodeVersion detected." -ForegroundColor Green

if (-not (Test-Path 'node_modules')) {
  Write-Host 'Installing dependencies...' -ForegroundColor Yellow
  npm install
  if ($LASTEXITCODE -ne 0) { throw 'npm install failed. Read the dependency error above.' }
}

Write-Host 'Running automated verification suite...' -ForegroundColor Yellow
npm test
if ($LASTEXITCODE -ne 0) { throw 'Tests failed. Fix the reported test errors before starting the app.' }

Write-Host 'Launching FaceTrace AI at http://localhost:3000 ...' -ForegroundColor Green
npm run dev

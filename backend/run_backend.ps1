# FaceTrace AI - Python FastAPI + OpenCV Backend Launch (Windows PowerShell)
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " FaceTrace AI - Python FastAPI Backend Launch (Port 8000) " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Check Python
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Error "Python 3.10+ is not found. Please install Python and ensure python is in your PATH."
    Exit 1
}

# Create virtual environment if absent
if (-not (Test-Path "backend\.venv")) {
    Write-Host "Creating Python virtual environment in backend\.venv..." -ForegroundColor Yellow
    python -m venv backend\.venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& "backend\.venv\Scripts\Activate.ps1"

# Install requirements
Write-Host "Installing Python dependencies (FastAPI, OpenCV, Pillow)..." -ForegroundColor Yellow
pip install -r backend\requirements.txt

# Start FastAPI server
Write-Host "Starting FastAPI on http://localhost:8000 with interactive docs at http://localhost:8000/docs ..." -ForegroundColor Green
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

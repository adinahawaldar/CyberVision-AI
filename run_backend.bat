@echo off
title CyberVision-AI Vision Backend
color 0A

echo ======================================================================
echo           CYBERVISION-AI  //  AI SURVEILLANCE BACKEND NODE
echo ======================================================================
echo.
echo [*] Checking Python environment...
python --version
if %errorlevel% neq 0 (
    echo [!] ERROR: Python is not installed or not in system PATH.
    pause
    exit /b 1
)

echo [*] Starting CyberVision-AI FastAPI Engine on http://localhost:8000 ...
echo [*] Interactive API Docs: http://localhost:8000/docs
echo [*] Multi-camera live streams & YOLOv8 detection active.
echo.
echo Press Ctrl+C at any time to gracefully stop the server.
echo ======================================================================
echo.

python backend/run_backend.py

pause

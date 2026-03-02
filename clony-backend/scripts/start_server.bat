@echo off
cd /d "%~dp0"
echo Starting Clony Backend Server...
.\.venv\Scripts\python.exe -m uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload
pause

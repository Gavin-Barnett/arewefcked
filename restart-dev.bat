@echo off
setlocal

cd /d "%~dp0"

echo Restarting Are we Fcked?
echo.
for /f "tokens=5" %%P in ('netstat -ano ^| findstr LISTENING ^| findstr :3000') do (
  echo Stopping process %%P using port 3000...
  taskkill /PID %%P /F >nul 2>nul
)

echo.
call "%~dp0run-dev.bat"

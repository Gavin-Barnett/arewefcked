@echo off
setlocal

cd /d "%~dp0"

echo Starting Are we Fcked?
echo.
echo Once Next.js finishes booting, open:
echo http://localhost:3000
echo.
echo For a stable local preview without dev asset issues, run:
echo run-site.bat
echo.

if not exist "node_modules" (
  echo Installing dependencies first...
  call npm.cmd install
  if errorlevel 1 exit /b %errorlevel%
  echo.
)

call npm.cmd run dev

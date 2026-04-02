@echo off
setlocal

cd /d "%~dp0"

echo Starting Are we Fcked? in stable preview mode
echo.
echo Once Next.js finishes booting, open:
echo http://localhost:3000
echo.

if not exist "node_modules" (
  echo Installing dependencies first...
  call npm.cmd install
  if errorlevel 1 exit /b %errorlevel%
  echo.
)

echo Building the app...
call npm.cmd run build
if errorlevel 1 exit /b %errorlevel%

echo.
echo Launching production server...
call npm.cmd run start

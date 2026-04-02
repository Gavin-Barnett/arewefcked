@echo off
setlocal EnableExtensions
cd /d "%~dp0"

for /f "usebackq delims=" %%S in (`powershell -NoProfile -Command "$bytes = New-Object byte[] 48; [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes); [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+','-').Replace('/','_')"`) do set "CRON_SECRET=%%S"

if not defined CRON_SECRET (
  echo Failed to generate CRON_SECRET.
  exit /b 1
)

powershell -NoProfile -Command ^
  "$path = Join-Path (Get-Location) '.env';" ^
  "$line = 'CRON_SECRET=\"' + $env:CRON_SECRET + '\"';" ^
  "if (Test-Path $path) {" ^
  "  $content = Get-Content -Raw $path;" ^
  "  if ($content -match '(?m)^CRON_SECRET=') { $content = [regex]::Replace($content, '(?m)^CRON_SECRET=.*$', $line) }" ^
  "  else { if ($content.Length -gt 0 -and -not $content.EndsWith([Environment]::NewLine)) { $content += [Environment]::NewLine }; $content += $line + [Environment]::NewLine }" ^
  "} else { $content = $line + [Environment]::NewLine }" ^
  "[System.IO.File]::WriteAllText($path, $content, (New-Object System.Text.UTF8Encoding($false)))"

echo.
echo CRON_SECRET generated and written to .env
echo.
echo Value:
echo %CRON_SECRET%
echo.
echo Next steps:
echo 1. Copy the value above.
echo 2. In Vercel, open your project ^> Settings ^> Environment Variables.
echo 3. Add CRON_SECRET with that exact value for Production, Preview, and Development.
echo 4. Redeploy after saving the env var.
echo 5. Keep the same value locally in .env if you want to test /api/cron/score-recompute.
echo.
pause
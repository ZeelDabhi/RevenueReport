@echo off
setlocal

title Revenue Report Auto Start

echo ==========================================
echo Revenue Report - Auto Start
echo ==========================================
echo.

echo Checking Backend on port 5000...

powershell -NoProfile -Command ^
"$connection = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue; if ($connection) { exit 0 } else { exit 1 }"

if errorlevel 1 (
    echo Backend is not running. Starting Backend...
    start "Revenue Backend" /min cmd /k "cd /d D:\RevenueReport\backend && npx.cmd tsx src/server.ts"
) else (
    echo Backend already running.
)

echo.

echo Checking Frontend on port 5173...

powershell -NoProfile -Command ^
"$connection = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue; if ($connection) { exit 0 } else { exit 1 }"

if errorlevel 1 (
    echo Frontend is not running. Starting Frontend...
    start "Revenue Frontend" /min cmd /k "cd /d D:\RevenueReport\frontend && npm.cmd run dev"
) else (
    echo Frontend already running.
)

echo.

echo Waiting for services...

timeout /t 5 /nobreak >nul

echo Opening Revenue Report...

start "" "http://127.0.0.1:5173/"

exit
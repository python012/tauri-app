@echo off
setlocal EnableDelayedExpansion

REM Ensure the script runs from the project root directory.
cd /d "%~dp0"

echo [INFO] Script started: %~nx0
echo [INFO] Working directory: %CD%

set "CARGO_BIN=%USERPROFILE%\.cargo\bin"
echo [INFO] Expected Cargo bin: %CARGO_BIN%

REM Prepend Cargo bin to PATH only when cargo.exe exists and PATH doesn't already include it.
if exist "%CARGO_BIN%\cargo.exe" (
  echo [INFO] Found cargo.exe in user profile.
  echo(!PATH!| find /I "%CARGO_BIN%" >nul
  if errorlevel 1 (
    set "PATH=%CARGO_BIN%;%PATH%"
    echo [INFO] PATH updated for current session.
  ) else (
    echo [INFO] PATH already contains Cargo bin.
  )
)
if not exist "%CARGO_BIN%\cargo.exe" (
  echo [WARN] cargo.exe not found at %CARGO_BIN%.
)

echo [INFO] Checking cargo availability...
cargo --version >nul 2>&1
if errorlevel 1 (
  echo [ERROR] cargo not found. Please install Rust or add %USERPROFILE%\.cargo\bin to PATH.
  echo         Quick fix in this terminal:
  echo         set PATH=%USERPROFILE%\.cargo\bin;%%PATH%%
  exit /b 1
)
for /f "delims=" %%i in ('cargo --version') do echo [INFO] %%i

echo [INFO] Checking npm availability...
call npm --version >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm not found. Please install Node.js and reopen CMD.
  exit /b 1
)
for /f "delims=" %%i in ('cmd /d /c npm --version 2^>nul') do echo [INFO] npm %%i

if /I "%~1"=="--check" (
  echo [OK] Environment check passed. cargo and npm are available.
  exit /b 0
)

echo [INFO] Starting Tauri dev...
call npm run tauri dev

if errorlevel 1 (
  echo [ERROR] npm run tauri dev failed with exit code %errorlevel%.
  exit /b %errorlevel%
)

echo [OK] npm run tauri dev exited successfully.

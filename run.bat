@echo off
setlocal
echo ==========================================
echo    AuraSplit - Launching...
echo ==========================================
echo.

:: Check if .venv exists
if not exist ".venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment not found. Please run install.bat first.
    pause
    exit /b
)

echo [1/2] Starting Backend Server...
start "AuraSplit Backend" cmd /c "call .venv\Scripts\activate && python backend/main.py"

echo [2/2] Starting Frontend UI...
cd frontend
:: We use call to prevent the batch from exiting after npm
call npm run dev

pause

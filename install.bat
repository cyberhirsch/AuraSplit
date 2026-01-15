@echo off
setlocal
echo ==========================================
echo    AuraSplit - Installation Wizard
echo ==========================================
echo.

:: Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH.
    pause
    exit /b
)

:: Check for Node
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js/npm is not installed or not in PATH.
    pause
    exit /b
)

echo [1/3] Creating Python Virtual Environment...
python -m venv .venv

echo [2/3] Installing Backend Dependencies...
call .venv\Scripts\activate
pip install -r backend/requirements.txt

echo [3/3] Installing Frontend Dependencies...
cd frontend
call npm install
cd ..

echo.
echo ==========================================
echo    Installation Complete!
echo    Use run.bat to start the application.
echo ==========================================
echo.
pause

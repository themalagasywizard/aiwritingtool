@echo off
echo Starting AIStoryCraft Development Server...
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: npm is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Set environment variables for Netlify development
set NETLIFY_DEV=true
set NODE_ENV=development
set NETLIFY_LOCAL=true
set NETLIFY_FUNCTIONS_TIMEOUT=120
set AWS_LAMBDA_FUNCTION_TIMEOUT=120
set LAMBDA_TASK_ROOT=%~dp0
set LAMBDA_RUNTIME_DIR=%~dp0

:: Change to the project directory
cd /d "%~dp0"

:: Check if node_modules exists, if not run npm install
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo Error: Failed to install dependencies
        echo Please check your internet connection and try again
        echo.
        pause
        exit /b 1
    )
)

:: Check if netlify-cli is installed and install specific version if needed
call npx netlify -v >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing netlify-cli...
    call npm install netlify-cli@latest --save-dev
    if %ERRORLEVEL% NEQ 0 (
        echo Error: Failed to install netlify-cli
        echo Please check your internet connection and try again
        echo.
        pause
        exit /b 1
    )
)

cls
echo ================================
echo    AIStoryCraft Dev Server
echo ================================
echo.
echo Function Timeout: 120 seconds
echo Port: 8888
echo Functions: Enabled
echo Environment: Development
echo.
echo Press Ctrl+C to stop the server
echo.

:: Start the Netlify dev server
call npx netlify dev --port 8888

:: If the server exits with an error, show the error
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Error: Server stopped unexpectedly
    echo Please check the error message above
    echo.
    pause
    exit /b 1
)

:: If the server exits normally
echo.
echo Server stopped. Press any key to exit...
pause >nul 
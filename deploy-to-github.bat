@echo off
echo ================================
echo    AIStoryCraft GitHub Deploy
echo ================================
echo.

REM Check for API keys in config.js
echo Checking for hardcoded API keys...
findstr /C:"process.env.HF_API_KEY || '" functions\config.js > nul
if %ERRORLEVEL% EQU 0 (
    echo WARNING: Found potential hardcoded API key in functions\config.js
    echo Please remove any hardcoded API keys before pushing to GitHub.
    echo.
    pause
    exit /b 1
)

findstr /C:"process.env.DEEPSEEK_API_KEY || '" functions\config.js > nul
if %ERRORLEVEL% EQU 0 (
    echo WARNING: Found potential hardcoded DEEPSEEK API key in functions\config.js
    echo Please remove any hardcoded API keys before pushing to GitHub.
    echo.
    pause
    exit /b 1
)

REM Check for .env file (shouldn't be committed)
if exist .env (
    echo WARNING: .env file detected. This file should not be committed to GitHub.
    echo Please ensure .env is in your .gitignore file.
    echo.
    pause
)

REM Check that .gitignore includes proper entries
echo Checking .gitignore file...
findstr /C:".env" .gitignore > nul
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: .gitignore may not be properly configured to ignore .env files.
    echo Please add ".env" to your .gitignore file.
    echo.
    pause
)

echo All security checks passed!
echo.

REM Proceed with GitHub push
echo Ready to push to GitHub deepseek branch.
echo.
echo The following steps will be executed:
echo 1. git add .
echo 2. git commit -m "Updated AIStoryCraft with environment variable support"
echo 3. git push origin deepseek
echo.

set /p PROCEED=Do you want to proceed? (Y/N): 

if /i "%PROCEED%" NEQ "Y" (
    echo Operation cancelled.
    echo.
    pause
    exit /b 0
)

echo.
echo Adding files to git...
git add .

echo.
echo Committing changes...
git commit -m "Updated AIStoryCraft with environment variable support"

echo.
echo Pushing to deepseek branch...
git push origin deepseek

echo.
echo Process completed! Check above for any errors.
echo.
pause 
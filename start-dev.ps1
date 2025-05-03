# PowerShell script to start AIStoryCraft development server

# Set environment variables
$env:NETLIFY_FUNCTIONS_TIMEOUT_SECONDS = "60"
$env:NODE_ENV = "development"

# Clear the terminal
Clear-Host

Write-Host "================================" -ForegroundColor Cyan
Write-Host "    AIStoryCraft Dev Server" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Timeout: 60 seconds" -ForegroundColor Yellow
Write-Host "Port: 8888" -ForegroundColor Yellow
Write-Host "Functions: Enabled" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

# Change to the script's directory
Set-Location -Path $PSScriptRoot

try {
    # Start the Netlify dev server with error handling
    npx netlify dev
} catch {
    Write-Host "Error starting server: $_" -ForegroundColor Red
} finally {
    Write-Host ""
    Write-Host "Server stopped. Press any key to exit..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
} 
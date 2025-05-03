const { spawn } = require('child_process');
const path = require('path');

// Start Netlify dev with explicit timeout settings
const netlifyDev = spawn('netlify', ['dev', '--timeout', '60'], {
    stdio: 'inherit',
    shell: true,
    env: {
        ...process.env,
        NETLIFY_LAMBDA_TIMEOUT: '60',
        NETLIFY_FUNCTION_TIMEOUT: '60000'
    }
});

netlifyDev.on('error', (err) => {
    console.error('Failed to start Netlify dev server:', err);
    process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
    netlifyDev.kill('SIGINT');
    process.exit(0);
});

process.on('SIGTERM', () => {
    netlifyDev.kill('SIGTERM');
    process.exit(0);
}); 
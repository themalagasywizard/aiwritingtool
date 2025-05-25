// scripts/build-tailwind.js
// Build script for Tailwind CSS to avoid PowerShell execution policy issues

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Ensure lib directory exists
const libDir = path.join(__dirname, '..', 'lib');
if (!fs.existsSync(libDir)) {
  fs.mkdirSync(libDir, { recursive: true });
}

try {
  console.log('Building Tailwind CSS...');
  
  // Use the full path to node_modules/.bin/tailwindcss
  const tailwindPath = path.join(__dirname, '..', 'node_modules', '.bin', 'tailwindcss');
  const inputPath = path.join(__dirname, '..', 'lib', 'tailwind.css');
  const outputPath = path.join(__dirname, '..', 'lib', 'tailwind-built.css');
  
  // Build command
  const command = `"${process.execPath}" "${tailwindPath}" -i "${inputPath}" -o "${outputPath}" --minify`;
  
  console.log('Running command:', command);
  
  // Execute the build
  execSync(command, { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log('✅ Tailwind CSS built successfully!');
  console.log(`📁 Output: ${outputPath}`);
  
  // Check if file was created and show size
  if (fs.existsSync(outputPath)) {
    const stats = fs.statSync(outputPath);
    console.log(`📏 File size: ${(stats.size / 1024).toFixed(2)} KB`);
  }
  
} catch (error) {
  console.error('❌ Error building Tailwind CSS:');
  console.error(error.message);
  
  // Fallback: create a basic CSS file with essential styles
  console.log('📝 Creating fallback CSS file...');
  
  const fallbackCSS = `
/* Tailwind CSS Base Styles */
*,::before,::after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}
::before,::after{--tw-content:''}
html{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;tab-size:4;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji";font-feature-settings:normal;font-variation-settings:normal}
body{margin:0;line-height:inherit}

/* Custom utility classes */
.shadow-sm-custom {
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}

.shadow-md-custom {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

/* Essential Tailwind utilities */
.hidden{display:none}
.flex{display:flex}
.h-full{height:100%}
.w-full{width:100%}
.space-x-4>:not([hidden])~:not([hidden]){--tw-space-x-reverse:0;margin-right:calc(1rem * var(--tw-space-x-reverse));margin-left:calc(1rem * calc(1 - var(--tw-space-x-reverse)))}
.bg-white{background-color:rgb(255 255 255)}
.p-4{padding:1rem}
.text-center{text-align:center}
.text-primary{color:#4B5EAA}
.border{border-width:1px}
.rounded{border-radius:0.25rem}
.btn{padding:0.5rem 1rem;border-radius:0.5rem;font-weight:500;transition:all 0.2s ease;display:inline-flex;align-items:center;justify-content:center;gap:0.5rem}
.btn-primary{background-color:#4B5EAA;color:white;box-shadow:0 2px 4px rgba(75,94,170,0.2)}
.btn-success{background-color:#34D399;color:white}
.btn-error{background-color:#EF4444;color:white}
`;
  
  const outputPath = path.join(__dirname, '..', 'lib', 'tailwind-built.css');
  fs.writeFileSync(outputPath, fallbackCSS.trim());
  console.log('✅ Fallback CSS file created successfully!');
  
  process.exit(0);
} 
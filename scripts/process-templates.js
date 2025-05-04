const fs = require('fs');
const path = require('path');

// Function to process template strings
function processTemplate(content) {
    return content.replace(/<%=\s*process\.env\.(\w+)\s*%>/g, (match, envVar) => {
        return process.env[envVar] || '';
    });
}

// Function to process HTML files
function processHtmlFiles(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            processHtmlFiles(filePath);
        } else if (file.endsWith('.html')) {
            console.log(`Processing ${filePath}`);
            const content = fs.readFileSync(filePath, 'utf8');
            const processed = processTemplate(content);
            fs.writeFileSync(filePath, processed);
        }
    });
}

// Process all HTML files in auth directory
const authDir = path.join(__dirname, '..', 'auth');
processHtmlFiles(authDir);

console.log('Template processing complete'); 
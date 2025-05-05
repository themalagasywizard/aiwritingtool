const fs = require('fs');
const path = require('path');

// Function to process HTML files and inject environment variables
function processTemplates() {
    const files = [
        'index.html',
        'auth/auth.html',
        'context.html'
    ];

    files.forEach(file => {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Replace environment variables
            content = content.replace(/<%= process.env.SUPABASE_URL %>/g, process.env.SUPABASE_URL || '');
            content = content.replace(/<%= process.env.SUPABASE_ANON_KEY %>/g, process.env.SUPABASE_ANON_KEY || '');
            
            fs.writeFileSync(filePath, content);
            console.log(`Processed ${file}`);
        } else {
            console.warn(`File not found: ${file}`);
        }
    });
}

// Run if called directly
if (require.main === module) {
    processTemplates();
}

module.exports = processTemplates; 
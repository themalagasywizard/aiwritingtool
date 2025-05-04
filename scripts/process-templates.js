const fs = require('fs');
const path = require('path');

// Function to process HTML files and inject environment variables
function processTemplates() {
    const files = ['index.html', 'auth/auth.html', 'auth/callback.html'];
    const envVars = {
        SUPABASE_URL: process.env.SUPABASE_URL || '',
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || ''
    };

    files.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        
        try {
            if (fs.existsSync(filePath)) {
                let content = fs.readFileSync(filePath, 'utf8');
                
                // Replace environment variables
                Object.entries(envVars).forEach(([key, value]) => {
                    const regex = new RegExp(`<%= process.env.${key} %>`, 'g');
                    content = content.replace(regex, value);
                });
                
                fs.writeFileSync(filePath, content);
                console.log(`Processed ${file} successfully`);
            } else {
                console.warn(`File not found: ${file}`);
            }
        } catch (error) {
            console.error(`Error processing ${file}:`, error);
        }
    });
}

// Run the template processing
processTemplates(); 
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Function to process HTML files and inject environment variables
function processTemplates() {
    const files = ['index.html', 'auth/auth.html', 'auth/callback.html', 'app.html'];
    
    files.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        
        try {
            if (fs.existsSync(filePath)) {
                let content = fs.readFileSync(filePath, 'utf8');
                
                // Replace template variables with actual environment variables
                content = content.replace(/<%= process\.env\.SUPABASE_URL %>/g, process.env.SUPABASE_URL || '');
                content = content.replace(/<%= process\.env\.SUPABASE_ANON_KEY %>/g, process.env.SUPABASE_ANON_KEY || '');
                
                // Update window.ENV script if it exists
                if (content.includes('window.ENV')) {
                    const envScript = `
    <script>
        window.ENV = {
            SUPABASE_URL: '${process.env.SUPABASE_URL || ''}',
            SUPABASE_ANON_KEY: '${process.env.SUPABASE_ANON_KEY || ''}'
        };
    </script>`;
                    
                    // Replace existing window.ENV script or insert after head tag
                    if (content.includes('window.ENV')) {
                        const regex = /<script>[\s\S]*?window\.ENV[\s\S]*?<\/script>/;
                        content = content.replace(regex, envScript);
                    } else {
                        content = content.replace(/<head>/, '<head>' + envScript);
                    }
                }
                
                // Update meta tags
                content = content.replace(/<meta name="supabase-url" content=".*?">/g, 
                    `<meta name="supabase-url" content="${process.env.SUPABASE_URL || ''}">`);
                content = content.replace(/<meta name="supabase-anon-key" content=".*?">/g, 
                    `<meta name="supabase-anon-key" content="${process.env.SUPABASE_ANON_KEY || ''}">`);
                
                fs.writeFileSync(filePath, content);
                console.log(`Processed ${file}`);
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
const fs = require('fs');
const path = require('path');

// Function to process HTML files and inject environment variables
function processTemplates() {
    const files = ['index.html', 'auth/auth.html', 'auth/callback.html'];
    
    files.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        
        try {
            if (fs.existsSync(filePath)) {
                let content = fs.readFileSync(filePath, 'utf8');
                
                // Create a script tag with environment variables
                const envScript = `
                    <script>
                        window.ENV = {
                            SUPABASE_URL: '${process.env.SUPABASE_URL || ''}',
                            SUPABASE_ANON_KEY: '${process.env.SUPABASE_ANON_KEY || ''}'
                        };
                    </script>
                `;
                
                // Insert the script tag after the opening head tag
                content = content.replace('<head>', '<head>' + envScript);
                
                // Replace template variables in meta tags
                content = content.replace(
                    /<meta name="supabase-url" content="<%= process\.env\.SUPABASE_URL %>">/,
                    `<meta name="supabase-url" content="${process.env.SUPABASE_URL || ''}">`
                );
                
                content = content.replace(
                    /<meta name="supabase-anon-key" content="<%= process\.env\.SUPABASE_ANON_KEY %>">/,
                    `<meta name="supabase-anon-key" content="${process.env.SUPABASE_ANON_KEY || ''}">`
                );
                
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
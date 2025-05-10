const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Function to process HTML files and inject environment variables
function processTemplates() {
    const files = ['index.html', 'auth/auth.html', 'auth/callback.html', 'context.html', 'app.html'];
    
    // Get environment variables with fallbacks
    const supabaseUrl = process.env.SUPABASE_URL || 'https://tadqfmqlqlahoknivhds.supabase.co';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZHFmbXFscWxhaG9rbml2aGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzMTY0MTAsImV4cCI6MjA2MTg5MjQxMH0.6afLHxoHlX3U3JzsqX6d61mpmiu3bICkbHgb1XDY7V0';
    
    files.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        
        try {
            if (fs.existsSync(filePath)) {
                let content = fs.readFileSync(filePath, 'utf8');
                
                // Create a script tag with environment variables
                const envScript = `
                    <script>
                        window.ENV = {
                            SUPABASE_URL: '${supabaseUrl}',
                            SUPABASE_ANON_KEY: '${supabaseKey}'
                        };
                    </script>
                `;
                
                // Insert the script tag after the opening head tag
                content = content.replace('<head>', '<head>' + envScript);
                
                // Replace template variables in meta tags
                content = content.replace(
                    /<meta name="supabase-url" content="[^"]*">/,
                    `<meta name="supabase-url" content="${supabaseUrl}">`
                );
                
                content = content.replace(
                    /<meta name="supabase-anon-key" content="[^"]*">/,
                    `<meta name="supabase-anon-key" content="${supabaseKey}">`
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
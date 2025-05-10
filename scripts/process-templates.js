const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Function to process a single HTML file
function processTemplate(filePath) {
    try {
        // Read the file content
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Replace environment variables in meta tags
        content = content.replace(
            /<meta name="supabase-url" content=".*?">/,
            `<meta name="supabase-url" content="${process.env.SUPABASE_URL}">`
        );
        content = content.replace(
            /<meta name="supabase-anon-key" content=".*?">/,
            `<meta name="supabase-anon-key" content="${process.env.SUPABASE_ANON_KEY}">`
        );
        
        // Add window.ENV object and Supabase script for client-side access
        const envScript = `
    <!-- Supabase Client -->
    <script src="https://unpkg.com/@supabase/supabase-js@2.39.3/dist/umd/supabase.min.js"></script>
    <script>
        window.ENV = {
            SUPABASE_URL: "${process.env.SUPABASE_URL}",
            SUPABASE_ANON_KEY: "${process.env.SUPABASE_ANON_KEY}"
        };
    </script>`;
        
        // Insert the ENV script before the first <script> tag
        content = content.replace(
            /<script/,
            `${envScript}\n    <script`
        );
        
        // Write the processed content back to the file
        fs.writeFileSync(filePath, content);
        console.log(`Processed ${filePath}`);
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error);
    }
}

// Process all HTML files
const htmlFiles = [
    'index.html',
    'editor.html',
    'auth/auth.html',
    'auth/callback.html',
    'context.html'
];

htmlFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
        processTemplate(filePath);
    } else {
        console.warn(`File not found: ${filePath}`);
    }
}); 
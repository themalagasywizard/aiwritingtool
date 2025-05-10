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
    <!-- Supabase Client Pre-load -->
    <script>
        window.ENV = {
            SUPABASE_URL: "${process.env.SUPABASE_URL}",
            SUPABASE_ANON_KEY: "${process.env.SUPABASE_ANON_KEY}"
        };
    </script>
    <!-- Primary Supabase Script -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/dist/umd/supabase.min.js" 
        integrity="sha256-XS4owtQ8KtK2s4oJDtWgtxTehbDHwQYj4QSzUoIUMXk=" 
        crossorigin="anonymous"></script>
    <!-- Fallback script if primary fails -->
    <script>
        // Check if Supabase loaded correctly
        if (typeof supabase === 'undefined') {
            console.warn('Primary Supabase script failed to load, trying fallback...');
            const fallbackScript = document.createElement('script');
            fallbackScript.src = 'https://unpkg.com/@supabase/supabase-js@2.39.3/dist/umd/supabase.min.js';
            fallbackScript.crossOrigin = 'anonymous';
            fallbackScript.onerror = function() {
                console.error('Both Supabase scripts failed to load. Authentication may not work properly.');
            };
            document.head.appendChild(fallbackScript);
        }
    </script>`;
        
        // Insert the ENV script at the end of the head
        content = content.replace(
            '</head>',
            `${envScript}\n</head>`
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
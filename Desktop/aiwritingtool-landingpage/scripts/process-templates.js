const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Function to process HTML files and inject environment variables
function processTemplates() {
    const files = [
        'index.html', 
        'auth/auth.html', 
        'auth/callback.html', 
        'app.html', 
        'profile.html',
        'context.html',
        'waitlist.html'
    ];
    
    // Load shared components
    const sharedHeadPath = path.join(__dirname, '..', 'lib', 'shared-head.html');
    let sharedHead = '';
    
    if (fs.existsSync(sharedHeadPath)) {
        sharedHead = fs.readFileSync(sharedHeadPath, 'utf8');
        // Process environment variables in shared head
        sharedHead = sharedHead.replace(/<%= process\.env\.SUPABASE_URL %>/g, process.env.SUPABASE_URL || '');
        sharedHead = sharedHead.replace(/<%= process\.env\.SUPABASE_ANON_KEY %>/g, process.env.SUPABASE_ANON_KEY || '');
    }
    
    files.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        
        try {
            if (fs.existsSync(filePath)) {
                let content = fs.readFileSync(filePath, 'utf8');
                
                // Replace template variables with actual environment variables
                content = content.replace(/<%= process\.env\.SUPABASE_URL %>/g, process.env.SUPABASE_URL || '');
                content = content.replace(/<%= process\.env\.SUPABASE_ANON_KEY %>/g, process.env.SUPABASE_ANON_KEY || '');
                
                // Replace shared head includes
                if (content.includes('<!-- Include shared head -->')) {
                    content = content.replace(/<!-- Include shared head -->/g, sharedHead);
                }
                
                // Update window.ENV script if it exists
                if (content.includes('window.ENV')) {
                    const envScript = `
    <script>
        window.ENV = {
            SUPABASE_URL: '${process.env.SUPABASE_URL || ''}',
            SUPABASE_ANON_KEY: '${process.env.SUPABASE_ANON_KEY || ''}'
        };
    </script>`;
                    
                    // Replace existing window.ENV script
                    const regex = /<script>[\s\S]*?window\.ENV[\s\S]*?<\/script>/;
                    if (regex.test(content)) {
                        content = content.replace(regex, envScript);
                    }
                }
                
                // Update meta tags
                content = content.replace(/<meta name="supabase-url" content=".*?">/g, 
                    `<meta name="supabase-url" content="${process.env.SUPABASE_URL || ''}">`);
                content = content.replace(/<meta name="supabase-anon-key" content=".*?">/g, 
                    `<meta name="supabase-anon-key" content="${process.env.SUPABASE_ANON_KEY || ''}">`);
                
                fs.writeFileSync(filePath, content);
                console.log(`✅ Processed ${file}`);
            } else {
                console.warn(`⚠️  File not found: ${file}`);
            }
        } catch (error) {
            console.error(`❌ Error processing ${file}:`, error);
        }
    });
    
    console.log('\n🎉 Template processing completed!');
    console.log('📁 Shared components available:');
    console.log('   - lib/shared-config.js');
    console.log('   - lib/shared-head.html');
    console.log('   - lib/supabase-client.js');
}

// Run the template processing
processTemplates(); 
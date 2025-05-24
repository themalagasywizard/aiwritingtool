// lib/shared-config.js
// Shared configuration for Tailwind CSS and other common settings

// Tailwind CSS Configuration
window.SHARED_TAILWIND_CONFIG = {
    theme: {
        extend: {
            colors: {
                primary: '#4B5EAA',
                primaryLight: '#E6E9F0',
                secondary: '#6B7280',
                accent: '#F472B6',
                background: '#F9FAFB',
                textPrimary: '#1F2937',
                textSecondary: '#9CA3AF',
                success: '#34D399',
                error: '#EF4444',
                warning: '#FBBF24',
                location: '#4CAF50',
                event: '#EF4444',
                character: '#4B5EAA',
                // Additional colors for index.html
                indigo: {
                    50: '#EEF2FF',
                    100: '#E0E7FF',
                    500: '#6366F1',
                    600: '#4F46E5',
                    700: '#4338CA'
                }
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' }
                }
            },
            animation: {
                fadeIn: 'fadeIn 0.5s ease-out'
            }
        }
    }
};

// Common CSS Variables
window.SHARED_CSS_VARS = `
    :root {
        --primary: #4B5EAA;
        --primary-light: #E6E9F0;
        --secondary: #6B7280;
        --accent: #F472B6;
        --background: #F9FAFB;
        --text-primary: #1F2937;
        --text-secondary: #9CA3AF;
        --success: #34D399;
        --error: #EF4444;
        --warning: #FBBF24;
        --location: #4CAF50;
        --event: #EF4444;
        --character: #4B5EAA;
    }

    body {
        font-family: 'Inter', sans-serif;
        background-color: var(--background);
        color: var(--text-primary);
    }
`;

// Initialize Tailwind with shared config
if (typeof tailwind !== 'undefined') {
    tailwind.config = window.SHARED_TAILWIND_CONFIG;
}

// Apply shared CSS variables
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = window.SHARED_CSS_VARS;
    document.head.appendChild(style);
}

// Environment configuration helper
window.getEnvConfig = function() {
    return {
        SUPABASE_URL: window.ENV?.SUPABASE_URL || '',
        SUPABASE_ANON_KEY: window.ENV?.SUPABASE_ANON_KEY || ''
    };
};

// Common external library URLs
window.EXTERNAL_LIBS = {
    TAILWIND_CSS: 'https://cdn.tailwindcss.com',
    FONT_AWESOME: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    GOOGLE_FONTS: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Merriweather:wght@400;700&display=swap',
    FRAPPE_GANTT_JS: 'https://cdn.jsdelivr.net/npm/frappe-gantt@0.6.1/dist/frappe-gantt.min.js',
    FRAPPE_GANTT_CSS: 'https://cdn.jsdelivr.net/npm/frappe-gantt@0.6.1/dist/frappe-gantt.min.css'
}; 
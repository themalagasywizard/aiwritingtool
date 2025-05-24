// lib/theme-controller.js
// Shadcn-style dark mode implementation with proper state management

class ThemeController {
    constructor() {
        this.storageKey = 'theme-preference';
        this.init();
    }

    init() {
        // Check for saved theme preference or default to 'light'
        const savedTheme = localStorage.getItem(this.storageKey);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        const theme = savedTheme || (prefersDark ? 'dark' : 'light');
        this.setTheme(theme);

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(this.storageKey)) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    setTheme(theme) {
        const root = document.documentElement;
        const isDark = theme === 'dark';

        // Apply theme class to root element
        root.classList.toggle('dark', isDark);
        
        // Store preference
        localStorage.setItem(this.storageKey, theme);

        // Update CSS custom properties for dark mode
        if (isDark) {
            root.style.setProperty('--background', '#020817');
            root.style.setProperty('--foreground', '#f8fafc');
            root.style.setProperty('--card', '#0f172a');
            root.style.setProperty('--card-foreground', '#f8fafc');
            root.style.setProperty('--popover', '#0f172a');
            root.style.setProperty('--popover-foreground', '#f8fafc');
            root.style.setProperty('--primary', '#f8fafc');
            root.style.setProperty('--primary-foreground', '#0f172a');
            root.style.setProperty('--secondary', '#1e293b');
            root.style.setProperty('--secondary-foreground', '#f8fafc');
            root.style.setProperty('--muted', '#1e293b');
            root.style.setProperty('--muted-foreground', '#94a3b8');
            root.style.setProperty('--accent', '#1e293b');
            root.style.setProperty('--accent-foreground', '#f8fafc');
            root.style.setProperty('--destructive', '#dc2626');
            root.style.setProperty('--destructive-foreground', '#f8fafc');
            root.style.setProperty('--border', '#334155');
            root.style.setProperty('--input', '#334155');
            root.style.setProperty('--ring', '#94a3b8');
            
            // App-specific dark mode colors
            root.style.setProperty('--primary-light', '#1e293b');
            root.style.setProperty('--text-primary', '#f8fafc');
            root.style.setProperty('--text-secondary', '#94a3b8');
            root.style.setProperty('--bg-white', '#0f172a');
            root.style.setProperty('--bg-gray-50', '#1e293b');
            root.style.setProperty('--bg-gray-100', '#334155');
            root.style.setProperty('--border-gray-200', '#334155');
            root.style.setProperty('--border-gray-300', '#475569');
        } else {
            // Light mode (reset to defaults)
            root.style.setProperty('--background', '#ffffff');
            root.style.setProperty('--foreground', '#020817');
            root.style.setProperty('--card', '#ffffff');
            root.style.setProperty('--card-foreground', '#020817');
            root.style.setProperty('--popover', '#ffffff');
            root.style.setProperty('--popover-foreground', '#020817');
            root.style.setProperty('--primary', '#4B5EAA');
            root.style.setProperty('--primary-foreground', '#f8fafc');
            root.style.setProperty('--secondary', '#f1f5f9');
            root.style.setProperty('--secondary-foreground', '#0f172a');
            root.style.setProperty('--muted', '#f1f5f9');
            root.style.setProperty('--muted-foreground', '#64748b');
            root.style.setProperty('--accent', '#f1f5f9');
            root.style.setProperty('--accent-foreground', '#0f172a');
            root.style.setProperty('--destructive', '#dc2626');
            root.style.setProperty('--destructive-foreground', '#f8fafc');
            root.style.setProperty('--border', '#e2e8f0');
            root.style.setProperty('--input', '#e2e8f0');
            root.style.setProperty('--ring', '#94a3b8');
            
            // App-specific light mode colors
            root.style.setProperty('--primary-light', '#E6E9F0');
            root.style.setProperty('--text-primary', '#1F2937');
            root.style.setProperty('--text-secondary', '#9CA3AF');
            root.style.setProperty('--bg-white', '#ffffff');
            root.style.setProperty('--bg-gray-50', '#f9fafb');
            root.style.setProperty('--bg-gray-100', '#f3f4f6');
            root.style.setProperty('--border-gray-200', '#e5e7eb');
            root.style.setProperty('--border-gray-300', '#d1d5db');
        }

        // Emit custom event for components to react to theme changes
        window.dispatchEvent(new CustomEvent('theme-changed', { 
            detail: { theme, isDark } 
        }));
    }

    toggle() {
        const currentTheme = localStorage.getItem(this.storageKey) || 
                           (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        return newTheme;
    }

    getTheme() {
        return localStorage.getItem(this.storageKey) || 
               (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }

    isDark() {
        return this.getTheme() === 'dark';
    }
}

// Initialize theme controller
window.themeController = new ThemeController();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeController;
} 
// lib/theme-toggle.js
// Reusable theme toggle component

function createThemeToggle(options = {}) {
    const {
        containerSelector = null,
        position = 'fixed',
        className = '',
        showLabel = false
    } = options;

    // Create the toggle button HTML
    const toggleHTML = `
        <button class="theme-toggle ${className}" 
                title="Toggle theme" 
                aria-label="Toggle between light and dark mode">
            <svg class="sun-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg class="moon-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            ${showLabel ? `<span class="ml-2 text-sm">${window.themeController?.isDark() ? 'Light mode' : 'Dark mode'}</span>` : ''}
        </button>
    `;

    // Create container element
    const container = document.createElement('div');
    
    if (position === 'fixed') {
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 50;
        `;
    }
    
    container.innerHTML = toggleHTML;
    const button = container.querySelector('.theme-toggle');

    // Add click handler
    button.addEventListener('click', () => {
        if (window.themeController) {
            const newTheme = window.themeController.toggle();
            
            // Update label if shown
            if (showLabel) {
                const label = button.querySelector('span');
                if (label) {
                    label.textContent = newTheme === 'dark' ? 'Light mode' : 'Dark mode';
                }
            }
            
            // Add visual feedback
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                button.style.transform = 'scale(1)';
            }, 150);
        }
    });

    // Listen for theme changes from other sources
    window.addEventListener('theme-changed', (e) => {
        if (showLabel) {
            const label = button.querySelector('span');
            if (label) {
                label.textContent = e.detail.isDark ? 'Light mode' : 'Dark mode';
            }
        }
    });

    // Insert into DOM
    if (containerSelector) {
        const targetContainer = document.querySelector(containerSelector);
        if (targetContainer) {
            targetContainer.appendChild(container);
        } else {
            console.warn(`Theme toggle: Container "${containerSelector}" not found`);
            document.body.appendChild(container);
        }
    } else {
        document.body.appendChild(container);
    }

    return {
        element: container,
        button: button,
        destroy: () => container.remove()
    };
}

// Auto-initialize if DOM is ready
function initThemeToggle() {
    // Only auto-initialize if no theme toggle exists and themeController is available
    if (!document.querySelector('.theme-toggle') && window.themeController) {
        createThemeToggle();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeToggle);
} else {
    initThemeToggle();
}

// Export for manual use
window.createThemeToggle = createThemeToggle; 
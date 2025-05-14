/**
 * Combines multiple class names into a single string.
 * This is a lightweight version of the classnames/clsx libraries.
 * 
 * @param {...string} classes - The class names to combine.
 * @returns {string} A string of combined class names with duplicates removed.
 */
function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Check if a string is a Tailwind class
 * This is a simplified version that just checks for common patterns
 * 
 * @param {string} className - The class name to check
 * @returns {boolean} - Whether the class name is likely a Tailwind class
 */
function isTailwindClass(className) {
  // Check for common Tailwind patterns like p-4, text-sm, bg-red-500, etc.
  const patterns = [
    /^[mp][tlrb]?-\d+$/, // margin, padding
    /^(w|h)-(\d+|full|auto|screen)$/, // width, height
    /^(min|max)-(w|h)-(\d+|full|screen)$/, // min/max width/height
    /^(text|bg|border|ring|placeholder|from|to|via|shadow)-/, // colors and variants
    /^(flex|grid|block|inline|hidden)$/, // display
    /^(rounded|border|shadow|ring)/, // borders, shadows, rings
    /^(absolute|relative|fixed|sticky|static)$/, // positioning
    /^(overflow|z|opacity|transition|transform|cursor)-/, // misc utilities
    /^(hover|focus|active|disabled|dark):\w/, // state variants
  ];
  
  return patterns.some(pattern => pattern.test(className));
}

/**
 * Apply a dark mode theme toggle functionality
 * 
 * @param {string} [storageKey='theme'] - Local storage key for theme preference
 */
function setupDarkModeToggle(storageKey = 'theme') {
  // Check for dark mode preference
  const isDarkMode = 
    localStorage.getItem(storageKey) === 'dark' || 
    (!localStorage.getItem(storageKey) && 
     window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  // Set initial mode
  if (isDarkMode) {
    document.documentElement.classList.add('dark');
    console.log('Dark mode enabled on page load');
  } else {
    document.documentElement.classList.remove('dark');
    console.log('Light mode active on page load');
  }
  
  // Create toggle function
  window.toggleDarkMode = function() {
    // Toggle dark class on documentElement
    document.documentElement.classList.toggle('dark');
    
    // If dark mode is now enabled
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    // Update localStorage
    localStorage.setItem(storageKey, isDarkMode ? 'dark' : 'light');
    
    // Update UI elements
    const sunIcon = document.querySelector('#darkModeToggle .fa-sun');
    const moonIcon = document.querySelector('#darkModeToggle .fa-moon');
    
    if (sunIcon && moonIcon) {
      if (isDarkMode) {
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
      } else {
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
      }
    }
    
    // Apply dark mode styles to buttons if we're in dark mode
    if (window.applyDarkModeButtonStyles) {
      window.applyDarkModeButtonStyles();
    }
    
    // Apply dark mode to AI panel elements if available
    if (window.initializeAIPanel) {
      window.initializeAIPanel();
    }
    
    console.log(`Dark mode ${isDarkMode ? 'enabled' : 'disabled'}`);
    
    return isDarkMode;
  };
}

export { cn, isTailwindClass, setupDarkModeToggle }; 
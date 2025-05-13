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
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  // Create toggle function
  window.toggleDarkMode = function() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem(storageKey, isDark ? 'dark' : 'light');
    
    // Dispatch event for components to react to theme change
    document.dispatchEvent(new CustomEvent('themechange', { 
      detail: { theme: isDark ? 'dark' : 'light' }
    }));
    
    return isDark;
  };
}

export { cn, isTailwindClass, setupDarkModeToggle }; 
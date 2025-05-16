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
    
    // Update dark mode switch in dropdown (if present)
    const darkModeSwitch = document.getElementById('darkModeSwitch');
    if (darkModeSwitch) {
      darkModeSwitch.checked = isDarkMode;
    }
    
    // Apply dark mode styles to buttons if we're in dark mode
    if (window.applyDarkModeButtonStyles) {
      window.applyDarkModeButtonStyles();
    }
    
    // Apply dark mode to AI panel elements if available
    if (window.initializeAIPanel) {
      window.initializeAIPanel();
    }
    
    // Apply header and toolbar dark styles on initial load
    const header = document.querySelector('header');
    const toolbar = document.querySelector('.editor-toolbar');
    const editorContent = document.querySelector('#editorContent');
    const projectInfoBox = document.querySelector('.sidebar .bg-white.rounded-lg');
    const contextBox = document.querySelector('#contextList');
    const wordCountContainer = document.querySelector('.flex.items-center.justify-between.bg-white.p-3.rounded-lg.shadow-sm-custom.text-sm');
    
    if (isDarkMode) {
      if (header) header.style.backgroundColor = 'hsl(240, 3.7%, 15.9%)';
      if (toolbar) toolbar.style.backgroundColor = 'hsl(240, 3.7%, 15.9%)';
      if (editorContent) editorContent.style.backgroundColor = 'hsl(240, 3.7%, 15.9%)';
      if (projectInfoBox) projectInfoBox.style.backgroundColor = 'hsl(240, 3.7%, 15.9%)';
      if (contextBox) contextBox.style.backgroundColor = 'hsl(240, 3.7%, 15.9%)';
      if (wordCountContainer) wordCountContainer.style.backgroundColor = 'hsl(240, 3.7%, 15.9%)';
      
      // Apply to all sidebar white background elements
      document.querySelectorAll('.sidebar .bg-white').forEach(el => {
        el.style.backgroundColor = 'hsl(240, 3.7%, 15.9%)';
      });
    } else {
      if (header) header.style.backgroundColor = '';
      if (toolbar) toolbar.style.backgroundColor = '';
      if (editorContent) editorContent.style.backgroundColor = '';
      if (projectInfoBox) projectInfoBox.style.backgroundColor = '';
      if (contextBox) contextBox.style.backgroundColor = '';
      if (wordCountContainer) wordCountContainer.style.backgroundColor = '';
      
      // Reset all sidebar white background elements
      document.querySelectorAll('.sidebar .bg-white').forEach(el => {
        el.style.backgroundColor = '';
      });
    }
    
    console.log(`Dark mode ${isDarkMode ? 'enabled' : 'disabled'}`);
    
    return isDarkMode;
  };
}

export { cn, isTailwindClass, setupDarkModeToggle }; 
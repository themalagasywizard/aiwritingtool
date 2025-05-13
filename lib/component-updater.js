/**
 * This utility helps to add Shadcn/UI data attributes to existing DOM elements
 * without having to manually update every element in the HTML.
 * 
 * Usage: updateComponentsWithShadcn([
 *   { selector: '.btn.btn-primary', component: 'button', variant: 'default' },
 *   { selector: '.btn.btn-secondary', component: 'button', variant: 'secondary' },
 *   { selector: '.form-input', component: 'input' }
 * ]);
 */

/**
 * Adds Shadcn/UI data attributes to DOM elements matching the provided selectors
 * 
 * @param {Array} mappings - Array of objects mapping selectors to Shadcn components
 * @param {string} mappings[].selector - CSS selector to find elements
 * @param {string} mappings[].component - Shadcn component name (button, input, etc.)
 * @param {string} [mappings[].variant] - Component variant (default, ghost, etc.)
 * @param {string} [mappings[].size] - Component size (default, sm, lg, icon)
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.preserveExisting=true] - Whether to preserve existing data-shadcn attributes
 */
export function updateComponentsWithShadcn(mappings, options = {}) {
  const { preserveExisting = true } = options;
  
  mappings.forEach(mapping => {
    const { selector, component, variant, size } = mapping;
    
    document.querySelectorAll(selector).forEach(element => {
      // Skip if element already has data-shadcn attribute and we're preserving existing
      if (preserveExisting && element.hasAttribute('data-shadcn')) {
        return;
      }
      
      // Add component type
      element.setAttribute('data-shadcn', component);
      
      // Add variant if provided
      if (variant) {
        element.setAttribute('data-variant', variant);
      }
      
      // Add size if provided
      if (size) {
        element.setAttribute('data-size', size);
      }
    });
  });
}

/**
 * Runs the component updater when the DOM content is loaded
 * 
 * @param {Array} mappings - Array of mapping objects
 */
export function initializeComponentUpdater(mappings) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      updateComponentsWithShadcn(mappings);
    });
  } else {
    updateComponentsWithShadcn(mappings);
  }
}

// Default mappings based on common Bootstrap-like classes
export const defaultMappings = [
  // Buttons
  { selector: '.btn.btn-primary:not([data-shadcn])', component: 'button', variant: 'default' },
  { selector: '.btn.btn-secondary:not([data-shadcn])', component: 'button', variant: 'secondary' },
  { selector: '.btn.btn-success:not([data-shadcn])', component: 'button', variant: 'success' },
  { selector: '.btn.btn-error:not([data-shadcn])', component: 'button', variant: 'error' },
  { selector: '.btn.btn-outline:not([data-shadcn])', component: 'button', variant: 'outline' },
  { selector: '.btn.btn-ghost:not([data-shadcn])', component: 'button', variant: 'ghost' },
  { selector: '.btn.btn-link:not([data-shadcn])', component: 'button', variant: 'link' },
  { selector: '.btn.btn-sm:not([data-shadcn])', component: 'button', size: 'sm' },
  { selector: '.btn.btn-lg:not([data-shadcn])', component: 'button', size: 'lg' },
  
  // Inputs
  { selector: 'input[type="text"]:not([data-shadcn]), input[type="email"]:not([data-shadcn]), input[type="password"]:not([data-shadcn])', component: 'input' },
  
  // Textareas
  { selector: 'textarea:not([data-shadcn])', component: 'textarea' },
  
  // Cards
  { selector: '.card:not([data-shadcn])', component: 'card' },
  { selector: '.card-header:not([data-shadcn])', component: 'card-header' },
  { selector: '.card-title:not([data-shadcn])', component: 'card-title' },
  { selector: '.card-description:not([data-shadcn])', component: 'card-description' },
  { selector: '.card-content:not([data-shadcn])', component: 'card-content' },
  { selector: '.card-footer:not([data-shadcn])', component: 'card-footer' },
]; 
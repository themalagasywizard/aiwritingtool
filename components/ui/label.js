import { cn } from '../../lib/utils.js';

/**
 * Creates a label element with Shadcn/UI styling
 * 
 * @param {Object} params - The parameters for the label
 * @param {string} [params.htmlFor=''] - The for attribute to associate with an input
 * @param {string} [params.text=''] - The label text content
 * @param {string} [params.className=''] - Additional CSS classes
 * @returns {HTMLLabelElement} The label element
 */
function Label(params = {}) {
  const {
    htmlFor = '',
    text = '',
    className = '',
  } = params;
  
  const label = document.createElement('label');
  label.htmlFor = htmlFor;
  label.className = cn(
    "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
    className
  );
  
  if (text) {
    label.textContent = text;
  }
  
  return label;
}

export { Label }; 
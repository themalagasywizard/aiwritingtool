import { cn } from '../../lib/utils.js';

/**
 * Creates a textarea element with Shadcn/UI styling
 * 
 * @param {Object} params - The parameters for the textarea
 * @param {string} [params.id=''] - The ID attribute
 * @param {string} [params.name=''] - The name attribute
 * @param {string} [params.placeholder=''] - The placeholder text
 * @param {string} [params.value=''] - The initial value
 * @param {boolean} [params.required=false] - Whether the textarea is required
 * @param {boolean} [params.disabled=false] - Whether the textarea is disabled
 * @param {string} [params.className=''] - Additional CSS classes
 * @param {Function} [params.onChange=null] - Change event handler
 * @param {Function} [params.onFocus=null] - Focus event handler
 * @param {Function} [params.onBlur=null] - Blur event handler
 * @param {number} [params.rows=4] - Number of rows
 * @returns {HTMLTextAreaElement} The textarea element
 */
function Textarea(params = {}) {
  const {
    id = '',
    name = '',
    placeholder = '',
    value = '',
    required = false,
    disabled = false,
    className = '',
    onChange = null,
    onFocus = null,
    onBlur = null,
    rows = 4
  } = params;
  
  const textarea = document.createElement('textarea');
  textarea.className = cn(
    "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    className
  );
  
  if (id) textarea.id = id;
  if (name) textarea.name = name;
  if (placeholder) textarea.placeholder = placeholder;
  if (value) textarea.value = value;
  if (required) textarea.required = true;
  if (disabled) textarea.disabled = true;
  if (rows) textarea.rows = rows;
  
  if (onChange) textarea.addEventListener('input', onChange);
  if (onFocus) textarea.addEventListener('focus', onFocus);
  if (onBlur) textarea.addEventListener('blur', onBlur);
  
  return textarea;
}

export { Textarea }; 
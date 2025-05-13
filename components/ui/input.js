import { cn } from '../../lib/utils.js';

/**
 * Creates an input element with Shadcn/UI styling
 * 
 * @param {Object} params - The parameters for the input
 * @param {string} [params.type='text'] - The input type (text, email, password, etc.)
 * @param {string} [params.id=''] - The ID attribute
 * @param {string} [params.name=''] - The name attribute
 * @param {string} [params.placeholder=''] - The placeholder text
 * @param {string} [params.value=''] - The initial value
 * @param {boolean} [params.required=false] - Whether the input is required
 * @param {boolean} [params.disabled=false] - Whether the input is disabled
 * @param {string} [params.className=''] - Additional CSS classes
 * @param {Function} [params.onChange=null] - Change event handler
 * @param {Function} [params.onFocus=null] - Focus event handler
 * @param {Function} [params.onBlur=null] - Blur event handler
 * @returns {HTMLInputElement} The input element
 */
function Input(params = {}) {
  const {
    type = 'text',
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
  } = params;
  
  const input = document.createElement('input');
  input.type = type;
  input.className = cn(
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    className
  );
  
  if (id) input.id = id;
  if (name) input.name = name;
  if (placeholder) input.placeholder = placeholder;
  if (value) input.value = value;
  if (required) input.required = true;
  if (disabled) input.disabled = true;
  
  if (onChange) input.addEventListener('input', onChange);
  if (onFocus) input.addEventListener('focus', onFocus);
  if (onBlur) input.addEventListener('blur', onBlur);
  
  return input;
}

export { Input }; 
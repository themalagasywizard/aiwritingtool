import { cn } from '../../lib/utils.js';

/**
 * Creates a switch toggle component with Shadcn/UI styling
 * 
 * @param {Object} params - The parameters for the switch
 * @param {string} [params.id=''] - The ID attribute
 * @param {string} [params.name=''] - The name attribute
 * @param {boolean} [params.checked=false] - Whether the switch is checked
 * @param {boolean} [params.disabled=false] - Whether the switch is disabled
 * @param {string} [params.className=''] - Additional CSS classes
 * @param {Function} [params.onChange=null] - Change event handler
 * @returns {HTMLDivElement} A div containing the switch element
 */
function Switch(params = {}) {
  const {
    id = '',
    name = '',
    checked = false,
    disabled = false,
    className = '',
    onChange = null,
  } = params;
  
  // Create the main container
  const container = document.createElement('div');
  
  // Create the actual switch input (hidden checkbox)
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = id;
  input.name = name;
  input.checked = checked;
  input.disabled = disabled;
  input.className = 'peer sr-only';
  
  if (onChange) input.addEventListener('change', onChange);
  
  // Create the visual switch
  const switchTrack = document.createElement('div');
  switchTrack.className = cn(
    "peer h-5 w-9 rounded-full bg-input ring-offset-background transition-colors",
    "after:absolute after:top-0 after:left-0 after:h-5 after:w-5 after:rounded-full",
    "after:translate-x-0 after:bg-background after:border after:border-input",
    "after:shadow-sm after:ring-0 after:transition-transform",
    "peer-checked:bg-primary peer-checked:after:translate-x-full",
    "peer-focus-visible:outline-none peer-focus-visible:ring-2",
    "peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
    "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
    "relative flex-shrink-0",
    className
  );
  
  // Assemble the switch
  container.appendChild(input);
  container.appendChild(switchTrack);
  container.className = 'relative inline-flex items-center';
  
  return container;
}

export { Switch }; 
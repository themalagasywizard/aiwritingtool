import { cn } from '../../lib/utils.js';

/**
 * Simple class variance authority implementation
 * This is a minimal version that doesn't rely on the npm package
 */
function cva(base, config) {
  return (props = {}) => {
    const { variant, size, className } = props;
    const variants = config.variants || {};
    const defaultVariants = config.defaultVariants || {};
    
    // Start with the base classes
    let classes = [base];
    
    // Add variant classes if specified
    if (variant && variants.variant && variants.variant[variant]) {
      classes.push(variants.variant[variant]);
    } else if (defaultVariants.variant && variants.variant && variants.variant[defaultVariants.variant]) {
      classes.push(variants.variant[defaultVariants.variant]);
    }
    
    // Add size classes if specified
    if (size && variants.size && variants.size[size]) {
      classes.push(variants.size[size]);
    } else if (defaultVariants.size && variants.size && variants.size[defaultVariants.size]) {
      classes.push(variants.size[defaultVariants.size]);
    }
    
    // Add any additional className
    if (className) {
      classes.push(className);
    }
    
    return classes.join(' ');
  };
}

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
        success: "bg-success text-white hover:bg-success/90",
        error: "bg-error text-white hover:bg-error/90",
        monochrome: "bg-black dark:bg-white text-white dark:text-black hover:bg-black/80 dark:hover:bg-white/80 border border-black dark:border-white",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

/**
 * Create a button element with the specified variants
 * 
 * @param {Object} params - The parameters for the button
 * @param {string} [params.variant='default'] - The button variant (default, destructive, etc.)
 * @param {string} [params.size='default'] - The button size (default, sm, lg, icon)
 * @param {string} [params.className=''] - Additional CSS classes
 * @param {boolean} [params.isLoading=false] - Whether the button is in a loading state
 * @param {boolean} [params.isDisabled=false] - Whether the button is disabled
 * @param {Function} [params.onClick=null] - Click handler function
 * @param {string} [params.type='button'] - Button type (button, submit, reset)
 * @param {string} [params.text=''] - Button text content
 * @param {string} [params.id=''] - Button ID attribute
 * @returns {HTMLButtonElement} The button element
 */
function Button(params) {
  const {
    variant = 'default',
    size = 'default',
    className = '',
    isLoading = false,
    isDisabled = false,
    onClick = null,
    type = 'button',
    text = '',
    id = '',
    icon = null,
  } = params;

  const button = document.createElement('button');
  button.className = cn(buttonVariants({ variant, size, className }));
  button.disabled = isDisabled || isLoading;
  button.type = type;
  if (id) button.id = id;
  if (onClick) button.addEventListener('click', onClick);

  if (isLoading) {
    const spinner = document.createElement('span');
    spinner.className = 'mr-2 animate-spin';
    spinner.innerHTML = '<i class="fas fa-spinner"></i>';
    button.appendChild(spinner);
  }

  if (icon) {
    const iconSpan = document.createElement('span');
    iconSpan.className = 'mr-2';
    iconSpan.innerHTML = icon;
    button.appendChild(iconSpan);
  }

  if (text) {
    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    button.appendChild(textSpan);
  }

  return button;
}

export { Button, buttonVariants }; 
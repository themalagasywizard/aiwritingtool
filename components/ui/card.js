import { cn } from '../../lib/utils.js';

/**
 * Creates a card container element
 * 
 * @param {Object} params - The parameters for the card
 * @param {string} [params.className=''] - Additional CSS classes
 * @param {string} [params.id=''] - The ID attribute for the element
 * @returns {HTMLDivElement} The card element
 */
function Card(params = {}) {
  const { className = '', id = '' } = params;
  
  const element = document.createElement('div');
  element.className = cn(
    "rounded-lg border bg-card text-card-foreground shadow-sm",
    className
  );
  if (id) element.id = id;
  
  return element;
}

/**
 * Creates a card header element
 * 
 * @param {Object} params - The parameters for the card header
 * @param {string} [params.className=''] - Additional CSS classes
 * @returns {HTMLDivElement} The card header element
 */
function CardHeader(params = {}) {
  const { className = '' } = params;
  
  const element = document.createElement('div');
  element.className = cn("flex flex-col space-y-1.5 p-6", className);
  
  return element;
}

/**
 * Creates a card title element
 * 
 * @param {Object} params - The parameters for the card title
 * @param {string} [params.className=''] - Additional CSS classes
 * @param {string} [params.text=''] - The text content of the title
 * @returns {HTMLHeadingElement} The card title element
 */
function CardTitle(params = {}) {
  const { className = '', text = '' } = params;
  
  const element = document.createElement('h3');
  element.className = cn(
    "text-2xl font-semibold leading-none tracking-tight",
    className
  );
  element.textContent = text;
  
  return element;
}

/**
 * Creates a card description element
 * 
 * @param {Object} params - The parameters for the card description
 * @param {string} [params.className=''] - Additional CSS classes
 * @param {string} [params.text=''] - The text content of the description
 * @returns {HTMLParagraphElement} The card description element
 */
function CardDescription(params = {}) {
  const { className = '', text = '' } = params;
  
  const element = document.createElement('p');
  element.className = cn("text-sm text-muted-foreground", className);
  element.textContent = text;
  
  return element;
}

/**
 * Creates a card content element
 * 
 * @param {Object} params - The parameters for the card content
 * @param {string} [params.className=''] - Additional CSS classes
 * @returns {HTMLDivElement} The card content element
 */
function CardContent(params = {}) {
  const { className = '' } = params;
  
  const element = document.createElement('div');
  element.className = cn("p-6 pt-0", className);
  
  return element;
}

/**
 * Creates a card footer element
 * 
 * @param {Object} params - The parameters for the card footer
 * @param {string} [params.className=''] - Additional CSS classes
 * @returns {HTMLDivElement} The card footer element
 */
function CardFooter(params = {}) {
  const { className = '' } = params;
  
  const element = document.createElement('div');
  element.className = cn("flex items-center p-6 pt-0", className);
  
  return element;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }; 
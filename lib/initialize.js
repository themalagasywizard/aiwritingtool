import { Button } from '../components/ui/button.js';
import { Input } from '../components/ui/input.js';
import { Textarea } from '../components/ui/textarea.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card.js';
import { initializeComponentUpdater, defaultMappings } from './component-updater.js';

/**
 * Initializes Shadcn/UI components on the page
 * This function is called when the DOM content is loaded
 */
export function initializeShadcnUI() {
  console.log('Initializing Shadcn/UI components...');

  // First, use the component updater to add data-shadcn attributes to elements
  // This will target elements with standard classes like .btn.btn-primary
  initializeComponentUpdater(defaultMappings);

  // Now replace elements that have data-shadcn attributes
  replaceButtons();
  replaceInputs();
  replaceTextareas();
  replaceCards();
}

/**
 * Replace traditional buttons with Shadcn/UI buttons
 */
function replaceButtons() {
  // Target elements with data-shadcn="button" attributes
  document.querySelectorAll('[data-shadcn="button"]').forEach(element => {
    const variant = element.getAttribute('data-variant') || 'default';
    const size = element.getAttribute('data-size') || 'default';
    const isDisabled = element.hasAttribute('disabled');
    const id = element.id;
    const text = element.textContent;
    
    // Get icon if it exists
    let icon = null;
    const iconElement = element.querySelector('i');
    if (iconElement) {
      icon = iconElement.outerHTML;
    }
    
    // Create Shadcn button
    const button = Button({
      variant,
      size,
      isDisabled,
      id,
      text,
      icon,
    });
    
    // Copy event listeners
    const oldElement = element.cloneNode(true);
    const newElement = button;
    
    // Copy click event (simplistic approach - doesn't handle all events)
    if (typeof element.onclick === 'function') {
      newElement.onclick = element.onclick;
    }
    
    // Replace the old element with the new one
    element.parentNode.replaceChild(newElement, element);
  });
}

/**
 * Replace traditional inputs with Shadcn/UI inputs
 */
function replaceInputs() {
  document.querySelectorAll('[data-shadcn="input"]').forEach(element => {
    const type = element.getAttribute('type') || 'text';
    const id = element.id;
    const name = element.getAttribute('name');
    const placeholder = element.getAttribute('placeholder');
    const value = element.value;
    const required = element.hasAttribute('required');
    const disabled = element.hasAttribute('disabled');
    
    // Create Shadcn input
    const input = Input({
      type,
      id,
      name,
      placeholder,
      value,
      required,
      disabled,
    });
    
    // Copy event listeners
    if (typeof element.oninput === 'function') {
      input.oninput = element.oninput;
    }
    
    // Replace the old element with the new one
    element.parentNode.replaceChild(input, element);
  });
}

/**
 * Replace traditional textareas with Shadcn/UI textareas
 */
function replaceTextareas() {
  document.querySelectorAll('[data-shadcn="textarea"]').forEach(element => {
    const id = element.id;
    const name = element.getAttribute('name');
    const placeholder = element.getAttribute('placeholder');
    const value = element.value;
    const required = element.hasAttribute('required');
    const disabled = element.hasAttribute('disabled');
    const rows = element.getAttribute('rows');
    
    // Create Shadcn textarea
    const textarea = Textarea({
      id,
      name,
      placeholder,
      value,
      required,
      disabled,
      rows: rows ? parseInt(rows) : 4,
    });
    
    // Copy event listeners
    if (typeof element.oninput === 'function') {
      textarea.oninput = element.oninput;
    }
    
    // Replace the old element with the new one
    element.parentNode.replaceChild(textarea, element);
  });
}

/**
 * Replace traditional card divs with Shadcn/UI cards
 */
function replaceCards() {
  document.querySelectorAll('[data-shadcn="card"]').forEach(cardElement => {
    // Create the new card structure
    const card = Card({ id: cardElement.id });
    
    // Process card header if it exists
    const headerElement = cardElement.querySelector('[data-shadcn="card-header"]');
    if (headerElement) {
      const cardHeader = CardHeader();
      
      // Process card title if it exists
      const titleElement = headerElement.querySelector('[data-shadcn="card-title"]');
      if (titleElement) {
        const cardTitle = CardTitle({ text: titleElement.textContent });
        cardHeader.appendChild(cardTitle);
      }
      
      // Process card description if it exists
      const descElement = headerElement.querySelector('[data-shadcn="card-description"]');
      if (descElement) {
        const cardDescription = CardDescription({ text: descElement.textContent });
        cardHeader.appendChild(cardDescription);
      }
      
      card.appendChild(cardHeader);
    }
    
    // Process card content if it exists
    const contentElement = cardElement.querySelector('[data-shadcn="card-content"]');
    if (contentElement) {
      const cardContent = CardContent();
      // Move child elements from content element to the new card content
      while (contentElement.firstChild) {
        cardContent.appendChild(contentElement.firstChild);
      }
      card.appendChild(cardContent);
    }
    
    // Process card footer if it exists
    const footerElement = cardElement.querySelector('[data-shadcn="card-footer"]');
    if (footerElement) {
      const cardFooter = CardFooter();
      // Move child elements from footer element to the new card footer
      while (footerElement.firstChild) {
        cardFooter.appendChild(footerElement.firstChild);
      }
      card.appendChild(cardFooter);
    }
    
    // Replace the old element with the new one
    cardElement.parentNode.replaceChild(card, cardElement);
  });
}

// Call initialization on DOM content loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeShadcnUI);
} else {
  // DOM is already loaded, call the function directly
  initializeShadcnUI();
} 
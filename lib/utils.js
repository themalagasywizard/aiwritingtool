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

export { cn }; 
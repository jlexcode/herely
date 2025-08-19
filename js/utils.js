// Utility functions for safe HTML handling and other common operations

/**
 * Safely escape HTML content to prevent XSS attacks
 * @param {string} text - The text to escape
 * @returns {string} - The escaped text
 */
export function escapeHtml(text) {
  if (typeof text !== 'string') {
    return String(text);
  }
  
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Safely set innerHTML with escaped content
 * @param {HTMLElement} element - The element to set content for
 * @param {string} content - The content to set (will be escaped)
 */
export function safeInnerHTML(element, content) {
  if (element && typeof content === 'string') {
    element.innerHTML = escapeHtml(content);
  }
}

/**
 * Validate that a date string is valid
 * @param {string} dateString - The date string to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export function isValidDate(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Safely get a date object, returning null if invalid
 * @param {string} dateString - The date string to parse
 * @returns {Date|null} - The date object or null if invalid
 */
export function safeDateParse(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

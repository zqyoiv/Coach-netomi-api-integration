// Utility functions for the Rexy Chat React app

/**
 * Generate a unique conversation ID
 * @returns {string} Unique conversation ID
 */
export const generateConversationId = () => {
  try {
    if (window.crypto && window.crypto.randomUUID) {
      return `chat-${window.crypto.randomUUID()}`;
    }
    return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  } catch (e) {
    return `chat-${Date.now()}`;
  }
};

/**
 * Sanitize HTML content to prevent XSS
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
export const sanitizeHtml = (str) => {
  if (typeof str !== 'string') {
    str = String(str);
  }
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Sanitize URL to prevent XSS in href attributes
 * @param {string} url - URL to sanitize
 * @returns {string} Sanitized URL or '#'
 */
export const sanitizeUrl = (url) => {
  if (typeof url !== 'string') {
    return '#';
  }
  // Only allow http/https URLs
  if (url.match(/^https?:\/\//)) {
    return sanitizeHtml(url);
  }
  return '#';
};

/**
 * Format timestamp to readable string
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {string} Formatted time string
 */
export const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString();
};

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Check if device is mobile
 * @returns {boolean} True if mobile device
 */
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Get viewport dimensions
 * @returns {Object} Object with width and height
 */
export const getViewportDimensions = () => {
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
};

/**
 * Scroll element to bottom smoothly
 * @param {HTMLElement} element - Element to scroll
 */
export const scrollToBottom = (element) => {
  if (element) {
    element.scrollTo({
      top: element.scrollHeight,
      behavior: 'smooth'
    });
  }
};

import DOMPurify from 'dompurify';

/**
 * HTML Sanitization Configuration for Rexy Chat
 * 
 * This sanitizer is used for bot responses that may contain HTML.
 * It allows only safe tags and attributes while blocking XSS vectors.
 */

/**
 * Sanitize HTML content from bot responses
 * @param {string} html - Raw HTML content from Netomi API
 * @returns {string} - Sanitized HTML safe for rendering
 */
export const sanitizeHtml = (html) => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(html, {
    // Allow only safe HTML tags for bot responses
    ALLOWED_TAGS: [
      'a',      // Links
      'b',      // Bold
      'i',      // Italic
      'em',     // Emphasis
      'strong', // Strong emphasis
      'br',     // Line break
      'p',      // Paragraph
      'span',   // Inline container
      'div',    // Block container
      'ul',     // Unordered list
      'ol',     // Ordered list
      'li',     // List item
      'code',   // Inline code
      'pre',    // Preformatted text
    ],
    
    // Allow only safe attributes
    ALLOWED_ATTR: [
      'href',   // Link URL
      'class',  // CSS classes
      'target', // Link target
      'rel',    // Link relationship
      'title',  // Tooltip text
      'id',     // Element ID
    ],
    
    // Automatically add security attributes to links
    ADD_ATTR: ['target', 'rel'],
    
    // Set secure defaults for links
    HOOK_AFTER_SANITIZE: (node) => {
      // Ensure all external links have security attributes
      if (node.tagName === 'A' && node.hasAttribute('href')) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }
    },
    
    // Block dangerous URL schemes (javascript:, data:, etc.)
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    
    // Additional security options
    KEEP_CONTENT: true,           // Keep text content even if tags are removed
    RETURN_DOM: false,             // Return string, not DOM
    RETURN_DOM_FRAGMENT: false,    // Return string, not fragment
    RETURN_TRUSTED_TYPE: false,    // Return string
    FORCE_BODY: false,             // Don't wrap in <body>
    SANITIZE_DOM: true,            // Sanitize DOM elements
    IN_PLACE: false,               // Create new string
  });
};

/**
 * Check if a string contains HTML tags
 * @param {string} str - String to check
 * @returns {boolean} - True if string appears to contain HTML
 */
export const stringLooksLikeHtml = (str) => {
  if (!str || typeof str !== 'string') {
    return false;
  }
  return /<\s*\w+[^>]*>/i.test(str);
};

/**
 * Sanitize plain text (removes all HTML)
 * @param {string} text - Plain text that should not contain HTML
 * @returns {string} - Text with all HTML stripped
 */
export const sanitizePlainText = (text) => {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],   // No HTML tags allowed
    ALLOWED_ATTR: [],   // No attributes allowed
    KEEP_CONTENT: true, // Keep the text content
  });
};

export default {
  sanitizeHtml,
  stringLooksLikeHtml,
  sanitizePlainText,
};


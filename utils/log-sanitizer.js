/**
 * Log Sanitization Utility
 * 
 * Sanitizes user-controlled values before including them in log messages
 * to prevent log injection attacks.
 * 
 * CWE-134: Use of Externally-Controlled Format String
 * CWE-117: Improper Output Neutralization for Logs
 */

/**
 * Sanitizes a value for safe inclusion in log messages
 * 
 * @param {any} value - The value to sanitize
 * @param {number} maxLength - Maximum length before truncation (default: 100)
 * @returns {string} Sanitized string safe for logging
 */
function sanitizeForLog(value, maxLength = 100) {
  // Handle null/undefined
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  
  // Convert to string
  let str = String(value);
  
  // Remove ANSI escape codes (terminal color codes, cursor movement, etc.)
  // Pattern: \x1B followed by [ and then various control characters
  str = str.replace(/\x1B\[[0-9;]*[mGKHf]/g, '');
  
  // Remove all control characters (0x00-0x1F and 0x7F)
  // This includes: null bytes, newlines, carriage returns, tabs, etc.
  str = str.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Remove Unicode direction override characters (for text direction attacks)
  str = str.replace(/[\u202A-\u202E\u2066-\u2069]/g, '');
  
  // Truncate if too long (prevent log flooding)
  if (str.length > maxLength) {
    return str.substring(0, maxLength) + '...[truncated]';
  }
  
  return str;
}

/**
 * Validates if a conversation ID has a safe format
 * 
 * @param {string} id - The conversation ID to validate
 * @returns {boolean} True if the ID is in a safe format
 */
function isValidConversationId(id) {
  if (typeof id !== 'string') return false;
  
  // Allow: alphanumeric, dash, underscore, and dot
  // Length: 1-200 characters
  return /^[a-zA-Z0-9_.-]{1,200}$/.test(id);
}

/**
 * Validates if a socket ID has a safe format
 * Socket.IO generates IDs in the format: alphanumeric + dash
 * 
 * @param {string} id - The socket ID to validate
 * @returns {boolean} True if the ID is in a safe format
 */
function isValidSocketId(id) {
  if (typeof id !== 'string') return false;
  
  // Socket.IO IDs are typically 20 characters: alphanumeric + dash
  // Example: "Mye2hdgjEoW1K7QNAAAB"
  return /^[a-zA-Z0-9_-]{1,50}$/.test(id);
}

/**
 * Sanitizes an object for logging (recursively sanitizes all string values)
 * 
 * @param {object} obj - The object to sanitize
 * @param {number} maxDepth - Maximum depth for recursive sanitization (default: 3)
 * @returns {object} Sanitized object safe for logging
 */
function sanitizeObjectForLog(obj, maxDepth = 3) {
  if (maxDepth <= 0) return '[max depth reached]';
  
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeForLog(obj);
  }
  
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObjectForLog(item, maxDepth - 1));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObjectForLog(value, maxDepth - 1);
    }
    return sanitized;
  }
  
  return String(obj);
}

export {
  sanitizeForLog,
  isValidConversationId,
  isValidSocketId,
  sanitizeObjectForLog
};


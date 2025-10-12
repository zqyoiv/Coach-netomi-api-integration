/**
 * Server-Side Debug Logger
 * 
 * Centralized logging utility for server-side code.
 * Allows enabling/disabling debug logs via environment variable.
 * 
 * Usage:
 *   import debug from './utils/server-debug.js';
 *   debug.log('Server started');
 *   debug.error('Error occurred:', error);
 * 
 * Enable/Disable:
 *   - Via .env: SERVER_DEBUG=true or SERVER_DEBUG=false
 *   - Via code: debug.enable() or debug.disable()
 */

// Check environment variable (defaults to true for development)
const SERVER_DEBUG = process.env.SERVER_DEBUG !== 'false';

const serverDebug = {
  _enabled: SERVER_DEBUG,

  /**
   * Enable debug logging
   */
  enable() {
    this._enabled = true;
    console.info('✅ Server debug logging ENABLED');
  },

  /**
   * Disable debug logging
   */
  disable() {
    this._enabled = false;
    console.info('⚠️  Server debug logging DISABLED');
  },

  /**
   * Check if debug logging is enabled
   */
  isEnabled() {
    return this._enabled;
  },

  /**
   * Log informational messages
   * @param  {...any} args - Arguments to log
   */
  log(...args) {
    if (this._enabled) {
      console.log(...args);
    }
  },

  /**
   * Log warning messages
   * @param  {...any} args - Arguments to log
   */
  warn(...args) {
    if (this._enabled) {
      console.warn(...args);
    }
  },

  /**
   * Log error messages (always shown, regardless of debug mode)
   * @param  {...any} args - Arguments to log
   */
  error(...args) {
    // Errors are always shown for critical issues
    console.error(...args);
  },

  /**
   * Log informational messages
   * @param  {...any} args - Arguments to log
   */
  info(...args) {
    if (this._enabled) {
      console.info(...args);
    }
  }
};

// Show initial state on module load
if (SERVER_DEBUG) {
  console.info('✅ Server debug logging ENABLED (set SERVER_DEBUG=false in .env to disable)');
} else {
  console.info('⚠️  Server debug logging DISABLED (set SERVER_DEBUG=true in .env to enable)');
}

export default serverDebug;


/**
 * Debug logging utility
 * Set DEBUG_MODE to true to enable console logs, false to disable
 */

// Global debug flag - change this to enable/disable all debug logs
const DEBUG_MODE = true; // Set to false in production

/**
 * Debug logger that respects the DEBUG_MODE flag
 */
class DebugLogger {
  constructor() {
    this.enabled = DEBUG_MODE;
  }

  /**
   * Enable debug logging
   */
  enable() {
    this.enabled = true;
    console.log('%c[DEBUG] Debug logging ENABLED', 'color: green; font-weight: bold');
  }

  /**
   * Disable debug logging
   */
  disable() {
    console.log('%c[DEBUG] Debug logging DISABLED', 'color: red; font-weight: bold');
    this.enabled = false;
  }

  /**
   * Check if debug mode is enabled
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Log a message (only if debug mode is enabled)
   */
  log(...args) {
    if (this.enabled) {
      console.log(...args);
    }
  }

  /**
   * Log a warning (only if debug mode is enabled)
   */
  warn(...args) {
    if (this.enabled) {
      console.warn(...args);
    }
  }

  /**
   * Log an error (always shown, even if debug mode is disabled)
   */
  error(...args) {
    console.error(...args);
  }

  /**
   * Log an info message (only if debug mode is enabled)
   */
  info(...args) {
    if (this.enabled) {
      console.info(...args);
    }
  }

  /**
   * Group logs together (only if debug mode is enabled)
   */
  group(label) {
    if (this.enabled) {
      console.group(label);
    }
  }

  /**
   * End a log group
   */
  groupEnd() {
    if (this.enabled) {
      console.groupEnd();
    }
  }
}

// Create and export a singleton instance
const debug = new DebugLogger();

// Expose to window for easy toggling in browser console
if (typeof window !== 'undefined') {
  window.debugLogger = debug;
  
  if (DEBUG_MODE) {
    console.log(
      '%c[DEBUG] Debug mode is ENABLED. To disable: window.debugLogger.disable()',
      'color: blue; font-weight: bold'
    );
  }
}

export default debug;


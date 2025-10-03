/**
 * Google Tag Manager Event Tracking Manager
 * Centralized GTM event handling for Coach Rexy Chat Application
 * 
 * Implements 5 core events:
 * - message_send: when user attempts to send a message
 * - message_received: when user receives a message from rexy
 * - content_interaction: when user interacts with any content (carousel, images, videos)
 * - error: whenever an error occurs
 * - session_close: when user closes tab or 30 minutes of inactivity
 */

class GTMManager {
    constructor() {
        this.isInitialized = false;
        this.eventQueue = [];
        this.sessionStartTime = Date.now();
        this.lastActivityTime = Date.now();
        this.inactivityTimer = null;
        this.inactivityThreshold = 30 * 60 * 1000; // 30 minutes in milliseconds
        
        this.init();
        this.setupSessionTracking();
        this.setupInactivityTracking();
    }

    /**
     * Initialize GTM Manager
     */
    init() {
        // Wait for dataLayer to be available
        if (typeof dataLayer !== 'undefined') {
            this.isInitialized = true;
            console.log('✅ GTM Manager initialized - dataLayer available');
            
            // Fire datalayer_initialized event first
            this.fireDataLayerInitialized();
            
            this.flushEventQueue();
        } else {
            // Retry initialization after a short delay
            setTimeout(() => this.init(), 100);
        }
    }

    /**
     * Fire datalayer_initialized event with session info
     */
    fireDataLayerInitialized() {
        const sessionId = this.getSessionId();
        const timestamp = new Date().toISOString();
        
        // Ensure dataLayer exists
        window.dataLayer = window.dataLayer || [];
        
        window.dataLayer.push({
            'event': 'datalayer_initialized',
            'event_action': 'page_load',
            'event_label': 'rexy_chat_initialized',
            'store_code': '', // Empty for now - can be populated from URL params
            'qr_code': '', // Empty for now - can be populated from URL params
            'session_timer': timestamp,
            'chat_session_id': sessionId,
            'timestamp': timestamp
        });
        
        console.log('🏷️ GTM Event: datalayer_initialized fired with session:', sessionId);
    }

    /**
     * Get current chat session ID - creates one if it doesn't exist
     */
    getSessionId() {
        let sessionId = sessionStorage.getItem('netomiConversationId');
        
        if (!sessionId) {
            // Generate a new conversation ID if one doesn't exist
            sessionId = this.generateConversationId();
            sessionStorage.setItem('netomiConversationId', sessionId);
            window.netomiConversationId = sessionId; // Also set on window for compatibility
        }
        
        return sessionId;
    }

    /**
     * Generate a new conversation ID
     */
    generateConversationId() {
        if (window.crypto && window.crypto.randomUUID) {
            return `chat-${window.crypto.randomUUID()}`;
        }
        return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }

    /**
     * Send GTM event with error handling and queuing
     */
    sendEvent(eventName, eventData = {}) {
        const gtmData = {
            'event': eventName,
            'timestamp': new Date().toISOString(),
            'chat_session_id': this.getSessionId(),
            'session_duration': Date.now() - this.sessionStartTime,
            ...eventData
        };

        if (this.isInitialized && typeof dataLayer !== 'undefined') {
            try {
                dataLayer.push(gtmData);
                console.log('🏷️ GTM Event:', eventName, gtmData);
            } catch (error) {
                console.error('❌ GTM Event failed:', eventName, error);
            }
        } else {
            // Queue event for later if GTM not ready
            this.eventQueue.push({ eventName, eventData: gtmData });
            console.warn('⏳ GTM not ready, queued event:', eventName);
        }
    }

    /**
     * Flush queued events when GTM becomes available
     */
    flushEventQueue() {
        if (this.eventQueue.length > 0) {
            console.log(`🚀 Flushing ${this.eventQueue.length} queued GTM events`);
            this.eventQueue.forEach(({ eventName, eventData }) => {
                this.sendEvent(eventName, eventData);
            });
            this.eventQueue = [];
        }
    }

    /**
     * Update activity timestamp and reset inactivity timer
     */
    updateActivity() {
        this.lastActivityTime = Date.now();
        this.resetInactivityTimer();
    }

    /**
     * Setup session tracking for tab close and navigation
     */
    setupSessionTracking() {
        // Track tab close, navigation, and page unload
        window.addEventListener('beforeunload', () => {
            this.trackSessionClose('tab_close');
        });

        // Track navigation to different sites
        window.addEventListener('pagehide', () => {
            this.trackSessionClose('navigation');
        });

        // Track visibility change (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                // Don't close session on tab switch, just update activity
                this.updateActivity();
            }
        });
    }

    /**
     * Setup inactivity tracking
     */
    setupInactivityTracking() {
        // Track user activity events
        const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        activityEvents.forEach(event => {
            document.addEventListener(event, () => {
                this.updateActivity();
            }, true);
        });

        // Start inactivity timer
        this.resetInactivityTimer();
    }

    /**
     * Reset the inactivity timer
     */
    resetInactivityTimer() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
        }

        this.inactivityTimer = setTimeout(() => {
            this.trackSessionClose('inactivity');
        }, this.inactivityThreshold);
    }

    // ========================================
    // CORE GTM EVENTS (Only these 5 events)
    // ========================================

    /**
     * 1. MESSAGE_SEND - when user attempts to send a message
     */
    trackMessageSend(messageText, messageType = 'text') {
        this.updateActivity();
        this.sendEvent('message_send', {
            'message_text': '', // Empty string for privacy
            'message_length': messageText.length,
            'message_type': messageType, // 'text', 'sticker', 'image'
            'input_method': 'manual' // could be 'manual', 'quick_reply', etc.
        });
    }

    /**
     * 2. MESSAGE_RECEIVED - when user receives a message from rexy
     */
    trackMessageReceived(messageText, messageType = 'text', hasContent = false) {
        this.updateActivity();
        this.sendEvent('message_received', {
            'message_text': messageText,
            'message_length': messageText.length,
            'message_type': messageType, // 'text', 'html', 'carousel', 'image', 'video'
            'has_interactive_content': hasContent, // true if contains carousel, images, videos
            'response_source': 'netomi'
        });
    }

    /**
     * 3. CONTENT_INTERACTION - when user interacts with any content
     */
    trackContentInteraction(interactionType, contentType, contentDetails = {}) {
        this.updateActivity();
        this.sendEvent('content_interaction', {
            'interaction_type': interactionType, // 'tap', 'expand', 'close', 'play', 'pause', 'ended', 'download', 'scroll'
            'content_type': contentType, // 'carousel', 'image', 'video', 'product_card', 'quick_reply'
            'content_id': contentDetails.id || '',
            'content_title': contentDetails.title || '',
            'content_url': contentDetails.url || '',
            // Video-specific tracking data
            'current_time': contentDetails.current_time || 0, // video playback position in seconds
            'duration': contentDetails.duration || 0, // total video duration in seconds
            'watch_percentage': contentDetails.watch_percentage || 0, // percentage of video watched
            'close_method': contentDetails.close_method || '', // 'button_click', 'overlay_click', etc.
        });
    }

    /**
     * 4. ERROR - whenever an error occurs
     */
    trackError(errorType, errorMessage, errorContext = {}) {
        this.sendEvent('error', {
            'error_type': errorType, // 'network', 'api', 'ui', 'validation', 'connection'
            'error_message': errorMessage,
            'error_code': errorContext.code || '',
            'error_source': errorContext.source || 'application',
            'error_context': JSON.stringify(errorContext),
            'user_agent': navigator.userAgent,
            'page_url': window.location.href
        });
    }

    /**
     * 5. SESSION_CLOSE - when user closes tab/navigates or 30min inactivity
     */
    trackSessionClose(closeReason) {
        const sessionDuration = Date.now() - this.sessionStartTime;
        const inactivityDuration = Date.now() - this.lastActivityTime;
        
        this.sendEvent('session_close', {
            'close_reason': closeReason, // 'tab_close', 'navigation', 'inactivity'
            'session_duration_ms': sessionDuration,
            'session_duration_minutes': Math.round(sessionDuration / 60000),
            'inactivity_duration_ms': inactivityDuration,
            'inactivity_duration_minutes': Math.round(inactivityDuration / 60000),
            'messages_sent': this.getMessagesSentCount(),
            'messages_received': this.getMessagesReceivedCount()
        });

        // Clear the inactivity timer since session is closing
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
        }
    }

    // ========================================
    // HELPER METHODS
    // ========================================

    /**
     * Get count of messages sent in this session (from sessionStorage or counter)
     */
    getMessagesSentCount() {
        return parseInt(sessionStorage.getItem('messagesSent') || '0');
    }

    /**
     * Get count of messages received in this session
     */
    getMessagesReceivedCount() {
        return parseInt(sessionStorage.getItem('messagesReceived') || '0');
    }

    /**
     * Increment message sent counter
     */
    incrementMessagesSent() {
        const count = this.getMessagesSentCount() + 1;
        sessionStorage.setItem('messagesSent', count.toString());
    }

    /**
     * Increment message received counter
     */
    incrementMessagesReceived() {
        const count = this.getMessagesReceivedCount() + 1;
        sessionStorage.setItem('messagesReceived', count.toString());
    }
}

// Create global instance
window.GTMManager = new GTMManager();

// Legacy function for backward compatibility (but only for the 5 core events)
window.sendGTMEvent = function(eventName, eventData = {}) {
    const allowedEvents = ['message_send', 'message_received', 'content_interaction', 'error', 'session_close'];
    if (allowedEvents.includes(eventName)) {
        window.GTMManager.sendEvent(eventName, eventData);
    } else {
        console.warn(`🚫 GTM Event "${eventName}" not allowed. Only these events are supported:`, allowedEvents);
    }
};

console.log('🏷️ GTM Manager loaded with 5 core events: message_send, message_received, content_interaction, error, session_close');
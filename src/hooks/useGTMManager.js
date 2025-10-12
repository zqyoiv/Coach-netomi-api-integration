import { useState, useEffect, useCallback, useRef } from 'react';
import debug from '../utils/debug';

/**
 * Google Tag Manager Event Tracking Hook
 * Centralized GTM event handling for Coach Rexy Chat Application
 * 
 * Implements 5 core events:
 * - message_send: when user attempts to send a message
 * - message_received: when user receives a message from rexy
 * - content_interaction: when user interacts with any content (carousel, images, videos)
 * - error: whenever an error occurs
 * - session_close: when user closes tab or 30 minutes of inactivity
 */

// Initialize dataLayer immediately (matching vanilla JS gtm-manager.js line 54)
// This must happen before any component mounts or events are queued
if (typeof window !== 'undefined') {
  window.dataLayer = window.dataLayer || [];
}

export const useGTMManager = () => {
  // Initialize as true since dataLayer is created at module load (line 18-20)
  const [isInitialized, setIsInitialized] = useState(typeof window !== 'undefined' && typeof window.dataLayer !== 'undefined');
  const eventQueueRef = useRef([]);
  const sessionStartTimeRef = useRef(Date.now());
  const lastActivityTimeRef = useRef(Date.now());
  const inactivityTimerRef = useRef(null);
  const inactivityThreshold = 30 * 60 * 1000; // 30 minutes

  // Generate a new conversation ID
  const generateConversationId = useCallback(() => {
    if (window.crypto && window.crypto.randomUUID) {
      return `chat-${window.crypto.randomUUID()}`;
    }
    return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }, []);

  // Get current chat session ID
  const getSessionId = useCallback(() => {
    let sessionId = sessionStorage.getItem('netomiConversationId');
    
    if (!sessionId) {
      sessionId = generateConversationId();
      sessionStorage.setItem('netomiConversationId', sessionId);
      window.netomiConversationId = sessionId;
    }
    
    return sessionId;
  }, [generateConversationId]);

  // Fire datalayer_initialized event with session info
  const fireDataLayerInitialized = useCallback(() => {
    const sessionId = getSessionId();
    const timestamp = new Date().toISOString();
    
    window.dataLayer = window.dataLayer || [];
    
    window.dataLayer.push({
      'event': 'datalayer_initialized',
      'event_action': 'page_load',
      'event_label': 'rexy_chat_initialized',
      'store_code': '',
      'qr_code': '',
      'session_timer': timestamp,
      'chat_session_id': sessionId,
      'timestamp': timestamp
    });
    
    debug.log('🏷️ GTM Event: datalayer_initialized fired with session:', sessionId);
  }, [getSessionId]);

  // Flush queued events when GTM becomes available
  const flushEventQueue = useCallback(() => {
    if (eventQueueRef.current.length > 0) {
      debug.log(`🚀 Flushing ${eventQueueRef.current.length} queued GTM events`);
      eventQueueRef.current.forEach(({ eventName, eventData }) => {
        if (typeof window.dataLayer !== 'undefined') {
          window.dataLayer.push({
            event: eventName,
            ...eventData
          });
          debug.log('🏷️ GTM Event:', eventName, eventData);
        }
      });
      eventQueueRef.current = [];
    }
  }, []);

  // Send GTM event with error handling and queuing
  const sendEvent = useCallback((eventName, eventData = {}) => {
    const gtmData = {
      'event': eventName,
      'timestamp': new Date().toISOString(),
      'chat_session_id': getSessionId(),
      'session_duration': Date.now() - sessionStartTimeRef.current,
      ...eventData
    };

    // Check if GTM is initialized and dataLayer is available (matching vanilla JS gtm-manager.js line 108)
    if (isInitialized && typeof window.dataLayer !== 'undefined') {
      try {
        window.dataLayer.push(gtmData);
        debug.log('🏷️ GTM Event:', eventName, gtmData);
      } catch (error) {
        debug.error('❌ GTM Event failed:', eventName, error);
      }
    } else {
      // Queue event for later if GTM not ready
      eventQueueRef.current.push({ eventName, eventData: gtmData });
      debug.log('⏳ GTM not ready, queued event:', eventName);
    }
  }, [isInitialized, getSessionId]);

  // Update activity timestamp and reset inactivity timer
  const updateActivity = useCallback(() => {
    lastActivityTimeRef.current = Date.now();
    
    // Reset inactivity timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      trackSessionClose('inactivity');
    }, inactivityThreshold);
  }, [inactivityThreshold]);

  // Helper methods for message counters
  const getMessagesSentCount = useCallback(() => {
    return parseInt(sessionStorage.getItem('messagesSent') || '0');
  }, []);

  const getMessagesReceivedCount = useCallback(() => {
    return parseInt(sessionStorage.getItem('messagesReceived') || '0');
  }, []);

  const incrementMessagesSent = useCallback(() => {
    const count = getMessagesSentCount() + 1;
    sessionStorage.setItem('messagesSent', count.toString());
  }, [getMessagesSentCount]);

  const incrementMessagesReceived = useCallback(() => {
    const count = getMessagesReceivedCount() + 1;
    sessionStorage.setItem('messagesReceived', count.toString());
  }, [getMessagesReceivedCount]);

  // ========================================
  // CORE GTM EVENTS (Only these 5 events)
  // ========================================

  /**
   * 1. MESSAGE_SEND - when user attempts to send a message
   */
  const trackMessageSend = useCallback((messageText, messageType = 'text') => {
    updateActivity();
    sendEvent('message_send', {
      'message_text': '', // Empty string for privacy
      'message_length': messageText.length,
      'message_type': messageType, // 'text', 'sticker', 'image'
      'input_method': 'manual' // could be 'manual', 'quick_reply', etc.
    });
  }, [updateActivity, sendEvent]);

  /**
   * 2. MESSAGE_RECEIVED - when user receives a message from rexy
   */
  const trackMessageReceived = useCallback((messageText, messageType = 'text', hasContent = false) => {
    updateActivity();
    sendEvent('message_received', {
      'message_text': messageText,
      'message_length': messageText.length,
      'message_type': messageType, // 'text', 'html', 'carousel', 'image', 'video'
      'has_interactive_content': hasContent, // true if contains carousel, images, videos
      'response_source': 'netomi'
    });
  }, [updateActivity, sendEvent]);

  /**
   * 3. CONTENT_INTERACTION - when user interacts with any content
   */
  const trackContentInteraction = useCallback((interactionType, contentType, contentDetails = {}) => {
    updateActivity();
    sendEvent('content_interaction', {
      'interaction_type': interactionType, // 'tap', 'expand', 'close', 'play', 'pause', 'ended', 'download', 'scroll', 'display'
      'content_type': contentType, // 'carousel', 'image', 'video', 'product_card', 'quick_reply', 'welcome_gif'
      'content_id': contentDetails.id || '',
      'content_title': contentDetails.title || '',
      'content_url': contentDetails.url || '',
      // Video-specific tracking data
      'current_time': contentDetails.current_time || 0,
      'duration': contentDetails.duration || 0,
      'watch_percentage': contentDetails.watch_percentage || 0,
      'close_method': contentDetails.close_method || '',
    });
  }, [updateActivity, sendEvent]);

  /**
   * 4. ERROR - whenever an error occurs
   */
  const trackError = useCallback((errorType, errorMessage, errorContext = {}) => {
    sendEvent('error', {
      'error_type': errorType, // 'network', 'api', 'ui', 'validation', 'connection', 'media'
      'error_message': errorMessage,
      'error_code': errorContext.code || '',
      'error_source': errorContext.source || 'application',
      'error_context': JSON.stringify(errorContext),
      'user_agent': navigator.userAgent,
      'page_url': window.location.href
    });
  }, [sendEvent]);

  /**
   * 5. SESSION_CLOSE - when user closes tab/navigates or 30min inactivity
   */
  const trackSessionClose = useCallback((closeReason) => {
    const sessionDuration = Date.now() - sessionStartTimeRef.current;
    const inactivityDuration = Date.now() - lastActivityTimeRef.current;
    
    sendEvent('session_close', {
      'close_reason': closeReason, // 'tab_close', 'navigation', 'inactivity'
      'session_duration_ms': sessionDuration,
      'session_duration_minutes': Math.round(sessionDuration / 60000),
      'inactivity_duration_ms': inactivityDuration,
      'inactivity_duration_minutes': Math.round(inactivityDuration / 60000),
      'messages_sent': getMessagesSentCount(),
      'messages_received': getMessagesReceivedCount()
    });

    // Clear the inactivity timer since session is closing
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
  }, [sendEvent, getMessagesSentCount, getMessagesReceivedCount]);

  // Initialize GTM Manager
  useEffect(() => {
    const initGTM = () => {
      // Check for dataLayer as global variable (matching vanilla JS gtm-manager.js line 32)
      if (typeof window.dataLayer !== 'undefined') {
        setIsInitialized(true);
        debug.log('✅ GTM Manager initialized - dataLayer available');
        
        // Fire datalayer_initialized event first
        fireDataLayerInitialized();
        
        // Flush any queued events
        flushEventQueue();
      } else {
        // Retry initialization after a short delay
        setTimeout(initGTM, 100);
      }
    };

    initGTM();
  }, [fireDataLayerInitialized, flushEventQueue]);

  // Setup session tracking
  useEffect(() => {
    const handleBeforeUnload = () => {
      trackSessionClose('tab_close');
    };

    const handlePageHide = () => {
      trackSessionClose('navigation');
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        updateActivity();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [trackSessionClose, updateActivity]);

  // Setup inactivity tracking
  useEffect(() => {
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      updateActivity();
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Start initial inactivity timer
    updateActivity();

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [updateActivity]);

  return {
    isInitialized,
    trackMessageSend,
    trackMessageReceived,
    trackContentInteraction,
    trackError,
    trackSessionClose,
    incrementMessagesSent,
    incrementMessagesReceived,
    getMessagesSentCount,
    getMessagesReceivedCount
  };
};

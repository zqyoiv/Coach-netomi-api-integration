import { useState, useCallback, useEffect } from 'react';

const useGTMManager = () => {
  const [messagesSent, setMessagesSent] = useState(0);
  const [messagesReceived, setMessagesReceived] = useState(0);

  // Initialize GTM
  useEffect(() => {
    // Initialize dataLayer if it doesn't exist
    if (typeof window.dataLayer === 'undefined') {
      window.dataLayer = [];
    }

    // Track page view
    window.dataLayer.push({
      'event': 'page_view',
      'page_title': 'Chat with Rexy - Coach',
      'page_location': window.location.href
    });
  }, []);

  const trackMessageSend = useCallback((message, messageType = 'text') => {
    window.dataLayer.push({
      'event': 'message_send',
      'message_type': messageType,
      'message_length': message.length,
      'timestamp': new Date().toISOString()
    });
  }, []);

  const trackMessageReceived = useCallback((message, messageType = 'text', hasContent = false) => {
    window.dataLayer.push({
      'event': 'message_received',
      'message_type': messageType,
      'message_length': message.length,
      'has_content': hasContent,
      'timestamp': new Date().toISOString()
    });
  }, []);

  const trackContentInteraction = useCallback((interactionType, contentId = null) => {
    window.dataLayer.push({
      'event': 'content_interaction',
      'interaction_type': interactionType,
      'content_id': contentId,
      'timestamp': new Date().toISOString()
    });
  }, []);

  const trackError = useCallback((errorType, errorMessage) => {
    window.dataLayer.push({
      'event': 'error',
      'error_type': errorType,
      'error_message': errorMessage,
      'timestamp': new Date().toISOString()
    });
  }, []);

  const trackSessionClose = useCallback(() => {
    window.dataLayer.push({
      'event': 'session_close',
      'messages_sent': messagesSent,
      'messages_received': messagesReceived,
      'session_duration': Date.now(),
      'timestamp': new Date().toISOString()
    });
  }, [messagesSent, messagesReceived]);

  const incrementMessagesSent = useCallback(() => {
    setMessagesSent(prev => prev + 1);
  }, []);

  const incrementMessagesReceived = useCallback(() => {
    setMessagesReceived(prev => prev + 1);
  }, []);

  // Track session close on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      trackSessionClose();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [trackSessionClose]);

  return {
    trackMessageSend,
    trackMessageReceived,
    trackContentInteraction,
    trackError,
    trackSessionClose,
    incrementMessagesSent,
    incrementMessagesReceived,
    messagesSent,
    messagesReceived
  };
};

export { useGTMManager };

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';

const useNetomiIntegration = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const { socket, ensureConnected, registerWebhookHandler, unregisterWebhookHandler } = useSocket();

  // Generate or retrieve conversation ID
  const getOrCreateConversationId = useCallback(() => {
    try {
      const key = 'netomiConversationId';
      let id = sessionStorage.getItem(key);
      if (id && typeof id === 'string' && id.trim() !== '') {
        return id;
      }
      
      const generateId = () => {
        if (window.crypto && window.crypto.randomUUID) {
          return `chat-${window.crypto.randomUUID()}`;
        }
        return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      };
      
      id = generateId();
      sessionStorage.setItem(key, id);
      return id;
    } catch (e) {
      // Fallback if sessionStorage not available
      return `chat-${Date.now()}`;
    }
  }, []);

  // Extract AI response text from webhook (matching netomi-integration.js)
  const extractAIResponseText = useCallback((webhookResponse) => {
    try {
      if (!webhookResponse) return null;
      
      // Check for attachments (Netomi AI responses)
      if (webhookResponse.attachments && Array.isArray(webhookResponse.attachments)) {
        for (const attachment of webhookResponse.attachments) {
          if (attachment.type === 'ai.msg.domain.responses.core.Text' && 
              attachment.attachment && 
              attachment.attachment.text &&
              attachment.attachment.text.trim() !== '') {
            return attachment.attachment.text;
          }
        }
      }
      
      // Check for message content (fallback)
      if (webhookResponse.message || webhookResponse.messagePayload) {
        const message = webhookResponse.message || webhookResponse.messagePayload;
        if (message.text && message.text.trim() !== '') {
          return message.text;
        }
      }
      
      return null;
    } catch (error) {
      console.error('[Netomi] Error extracting AI text:', error);
      return null;
    }
  }, []);

  // Extract all AI response texts (matching netomi-integration.js)
  const extractAllAIResponseTexts = useCallback((webhookResponse) => {
    try {
      if (!webhookResponse) return [];
      
      const textMessages = [];
      
      if (webhookResponse.attachments && Array.isArray(webhookResponse.attachments)) {
        for (const attachment of webhookResponse.attachments) {
          if (attachment.type === 'ai.msg.domain.responses.core.Text' && 
              attachment.attachment && 
              attachment.attachment.text &&
              attachment.attachment.text.trim() !== '' &&
              attachment.attachment.attachmentResponseType === 'ANSWER_AI_RESPONSE') {
            
            textMessages.push({
              text: attachment.attachment.text,
              timestamp: attachment.attachment.timestamp,
              id: attachment.attachment.id
            });
          }
        }
      }
      
      return textMessages;
    } catch (error) {
      console.error('[Netomi] Error extracting all AI texts:', error);
      return [];
    }
  }, []);

  // Extract image data (matching netomi-integration.js)
  const extractImageData = useCallback((webhookResponse) => {
    try {
      if (!webhookResponse || !webhookResponse.attachments) return null;

      for (const attachment of webhookResponse.attachments) {
        if (attachment.type === 'ai.msg.domain.responses.core.Image' &&
            attachment.attachment &&
            attachment.attachment.largeImageUrl) {
          
          return {
            imageUrl: attachment.attachment.largeImageUrl,
            title: attachment.attachment.title || null,
            timestamp: attachment.attachment.timestamp
          };
        }
      }

      return null;
    } catch (error) {
      console.error('[Netomi] Error extracting image data:', error);
      return null;
    }
  }, []);

  // Extract carousel data (matching netomi-integration.js)
  const extractCarouselData = useCallback((webhookResponse) => {
    try {
      if (!webhookResponse || !webhookResponse.attachments) return null;

      const netomiCarousel = webhookResponse.attachments.find(att =>
        att && att.type === 'ai.msg.domain.responses.core.Carousel' && att.attachment && Array.isArray(att.attachment.elements)
      );
      
      if (netomiCarousel) {
        const att = netomiCarousel.attachment;
        return {
          carouselImageAspectRatio: att.carouselImageAspectRatio,
          elements: att.elements.map(el => ({
            imageUrl: el.imageUrl || el.image_url || null,
            videoUrl: el.videoUrl || null,
            thumbnailUrl: el.thumbnailUrl || null,
            title: el.title || null,
            subtitle: el.subtitle || null,
            description: el.description || null,
            buttons: Array.isArray(el.buttons) ? el.buttons.map(btn => ({
              title: btn.title,
              url: btn.url,
              type: btn.type
            })) : []
          }))
        };
      }

      return null;
    } catch (error) {
      console.error('[Netomi] Error extracting carousel data:', error);
      return null;
    }
  }, []);

  // Test server connection
  const testServerConnection = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/netomi/test-connection');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }
      
      return result;
    } catch (error) {
      console.error('[Netomi] Server connection test failed:', error);
      throw error;
    }
  }, []);

  // Send message to Netomi (matching netomi-integration.js)
  const sendMessage = useCallback(async (message, attachments = []) => {
    const convId = getOrCreateConversationId();
    const userId = "rexy-chat-user";
    
    const messageData = {
      conversationId: convId,
      messagePayload: {
        text: message,
        label: "",
        messageId: crypto.randomUUID(),
        timestamp: Date.now(),
        hideMessage: false
      },
      userDetails: {
        userId: userId
      },
      origin: "rexy-chat",
      eventType: "message",
      additionalAttributes: {
        CUSTOM_ATTRIBUTES: [
          {
            type: "TEXT",
            name: "widget_id",
            value: "",
            scope: "LIFE_TIME"
          },
          {
            type: "TEXT",
            name: "visitor_url",
            value: window.location.href,
            scope: "LIFE_TIME"
          },
          {
            type: "TEXT",
            name: "current_user_agent",
            value: navigator.userAgent,
            scope: "LIFE_TIME"
          },
          {
            type: "TEXT",
            name: "current_device_type",
            value: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? "mobile" : "desktop",
            scope: "LIFE_TIME"
          },
          {
            type: "TEXT",
            name: "current_platform",
            value: navigator.platform,
            scope: "LIFE_TIME"
          }
        ]
      }
    };

    try {
      // Ensure socket is connected before sending message
      await ensureConnected(3000);
      
      const response = await fetch('http://localhost:3001/api/netomi/process-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageData,
          clientSocketId: socket?.id || null
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.ok && result.data) {
        // Handle immediate webhook response if available
        if (result.data.webhookResponse) {
          const webhookResponse = result.data.webhookResponse;
          
          // Extract AI text
          const allTexts = extractAllAIResponseTexts(webhookResponse);
          if (allTexts.length > 0) {
            return {
              text: allTexts[0].text,
              isHtml: false,
              webhookResponse: webhookResponse
            };
          }
          
          // Extract image if available
          const imageData = extractImageData(webhookResponse);
          if (imageData) {
            return {
              text: '',
              isHtml: false,
              imageData: imageData,
              webhookResponse: webhookResponse
            };
          }
          
          // Extract carousel if available
          const carouselData = extractCarouselData(webhookResponse);
          if (carouselData) {
            return {
              text: '',
              isHtml: false,
              carouselData: carouselData,
              webhookResponse: webhookResponse
            };
          }
        }
        
        // Acknowledgment only - webhook will come via Socket.IO
        return {
          text: '',
          isHtml: false,
          isAcknowledgment: true
        };
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('[Netomi] Send message failed:', error);
      throw error;
    }
  }, [getOrCreateConversationId, socket, ensureConnected, extractAllAIResponseTexts, extractImageData, extractCarouselData]);

  // Initialize connection
  useEffect(() => {
    const initializeConnection = async () => {
      try {
        await testServerConnection();
        setIsConnected(true);
        setConversationId(getOrCreateConversationId());
      } catch (error) {
        console.error('[Netomi] Failed to initialize connection:', error);
        setIsConnected(false);
      }
    };

    initializeConnection();
  }, [testServerConnection, getOrCreateConversationId]);

  return {
    isConnected,
    conversationId,
    sendMessage,
    testServerConnection,
    extractAIResponseText,
    extractAllAIResponseTexts,
    extractImageData,
    extractCarouselData,
    registerWebhookHandler,
    unregisterWebhookHandler
  };
};

export { useNetomiIntegration };

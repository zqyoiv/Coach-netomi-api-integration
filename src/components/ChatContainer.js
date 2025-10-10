import React, { useState, useEffect, useRef } from 'react';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import ConnectionErrorOverlay from './ConnectionErrorOverlay';
import { useNetomiIntegration } from '../hooks/useNetomiIntegration';
import { useAnimationManager } from '../hooks/useAnimationManager';
import { useGTMManager } from '../hooks/useGTMManager';
import { useSocket } from '../contexts/SocketContext';
import '../styles/App.css';
import '../styles/Message.css';
import '../styles/ChatInput.css';

const ChatContainer = () => {
  const [messages, setMessages] = useState([]);
  const [showConnectionError, setShowConnectionError] = useState(false);
  const chatMessagesRef = useRef(null);
  
  const netomiIntegration = useNetomiIntegration();
  const animationManager = useAnimationManager();
  const gtmManager = useGTMManager();
  const { connectionError } = useSocket();

  const {
    isThinkingAnimationActive,
    isWatchReelActive,
    isThinkingInChat,
    renderWelcomeAnimation,
    showThinkingAnimationIfNeeded,
    showWatchReelAnimation,
    showThinkingInChat,
    hideThinkingInChat,
    renderThinkingOverlay,
    renderWatchReelOverlay,
    renderThinkingInChat,
    cleanup
  } = animationManager;

  const {
    extractAllAIResponseTexts,
    extractImageData,
    extractCarouselData,
    registerWebhookHandler,
    unregisterWebhookHandler
  } = netomiIntegration;

  useEffect(() => {
    // Check for test disconnect parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('test_disconnect') === 'true') {
      setTimeout(() => {
        setShowConnectionError(true);
      }, 1000);
    }

    // Show welcome GIF first
    showWelcomeGif();
    
    // Add greeting message after 1 second (no quick replies)
    setTimeout(() => {
      addWelcomeMessage();
    }, 1000);
  }, []);

  // Handle socket connection errors
  useEffect(() => {
    setShowConnectionError(connectionError);
  }, [connectionError]);

  // Register webhook handler for real-time updates (matching rexy.js)
  useEffect(() => {
    const handleWebhookUpdate = (webhookResponse) => {
      console.log('[ChatContainer] Processing real-time webhook update:', webhookResponse);
      
      // Hide thinking animation if it's showing
      hideThinkingInChat();
      
      // Extract all AI response texts
      const allTexts = extractAllAIResponseTexts(webhookResponse);
      if (allTexts.length > 0) {
        console.log(`[ChatContainer] Adding ${allTexts.length} AI responses from real-time update`);
        renderMultipleMessages(allTexts, 1200); // 1.2 second delay between messages
      }
      
      // Extract and display image if available
      const imageData = extractImageData(webhookResponse);
      if (imageData) {
        console.log('[ChatContainer] Adding image from real-time update:', imageData.imageUrl);
        addStickerStyleImage(imageData.imageUrl);
      }
      
      // Extract and display carousel if available
      const carouselData = extractCarouselData(webhookResponse);
      if (carouselData) {
        addCarouselMessage(carouselData);
      }
    };

    // Register the webhook handler
    registerWebhookHandler(handleWebhookUpdate);

    // Cleanup on unmount
    return () => {
      unregisterWebhookHandler();
    };
  }, [hideThinkingInChat, extractAllAIResponseTexts, extractImageData, extractCarouselData, registerWebhookHandler, unregisterWebhookHandler]);

  const showWelcomeGif = () => {
    const welcomeMessage = {
      id: 'welcome',
      type: 'bot',
      content: '',
      isWelcome: true,
      timestamp: Date.now()
    };
    setMessages([welcomeMessage]);
  };

  const addWelcomeMessage = () => {
    const welcomeTextMessage = {
      id: 'welcome-text',
      type: 'bot',
      content: "Rawr! Rexy here. Wanna chat Teri? You can ask me anything about the bag!",
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, welcomeTextMessage]);
  };

  const addMessage = (text, isUser = true, options = {}) => {
    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: isUser ? 'user' : 'bot',
      content: text,
      timestamp: Date.now(),
      ...options
    };

    setMessages(prev => [...prev, message]);

    // Track with GTM
    if (isUser) {
      gtmManager.trackMessageSend(text, 'text');
    } else {
      gtmManager.trackMessageReceived(text, 'text', false);
    }

    // Scroll to bottom
    setTimeout(() => {
      if (chatMessagesRef.current) {
        chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleSendMessage = async (messageText, attachments = []) => {
    if (!messageText.trim() && attachments.length === 0) return;

    // Add user message
    addMessage(messageText, true);

    // Show thinking animation in chat
    showThinkingInChat();

    try {
      // Send to Netomi
      const response = await netomiIntegration.sendMessage(messageText, attachments);
      
      // Hide thinking animation in chat
      hideThinkingInChat();

      // Add bot response
      if (response && response.text) {
        addMessage(response.text, false, { isHtml: response.isHtml });
      }

      // Show thinking animation if conditions are met
      showThinkingAnimationIfNeeded(messages.length);

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Hide thinking animation in chat
      hideThinkingInChat();
      
      // Show error message
      addMessage('Sorry, I encountered an error. Please try again.', false);
    }
  };

  // Helper function to render multiple messages sequentially (matching rexy.js)
  const renderMultipleMessages = (textMessages, delay = 1000) => {
    if (!textMessages || textMessages.length === 0) return;
    
    console.log(`[ChatContainer] Rendering ${textMessages.length} messages sequentially`);
    
    textMessages.forEach((messageData, index) => {
      setTimeout(() => {
        console.log(`[ChatContainer] Rendering message ${index + 1}:`, messageData.text);
        addMessage(messageData.text, false, { isHtml: false });
      }, index * delay);
    });
  };

  // Helper function to add sticker-style image (matching rexy.js)
  const addStickerStyleImage = (imageSrc) => {
    const stickerMessage = {
      id: `sticker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'bot',
      content: '',
      isSticker: true,
      imageSrc: imageSrc,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, stickerMessage]);
  };

  // Helper function to add carousel message (matching rexy.js)
  const addCarouselMessage = (carouselData) => {
    const carouselMessage = {
      id: `carousel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'bot',
      content: '',
      isCarousel: true,
      carouselData: carouselData,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, carouselMessage]);
  };

  return (
    <div className="chat-container">
      <ChatHeader />
      
      <ConnectionErrorOverlay 
        show={showConnectionError} 
        onClose={() => setShowConnectionError(false)} 
      />
      
      <ChatMessages 
        ref={chatMessagesRef}
        messages={messages}
        renderWelcomeAnimation={renderWelcomeAnimation}
        renderThinkingInChat={renderThinkingInChat}
        isThinkingInChat={isThinkingInChat}
      />
      
      <ChatInput onSendMessage={handleSendMessage} />
      
      {/* Animation Overlays */}
      {renderThinkingOverlay()}
      {renderWatchReelOverlay()}
    </div>
  );
};

export default ChatContainer;

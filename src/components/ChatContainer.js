import React, { useState, useEffect, useRef } from 'react';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import ConnectionErrorOverlay from './ConnectionErrorOverlay';
import PhotoOverlay from './PhotoOverlay';
import VideoOverlay from './VideoOverlay';
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
  const [photoOverlayImage, setPhotoOverlayImage] = useState(null);
  const [videoOverlayData, setVideoOverlayData] = useState(null);
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

  // Define functions before useEffect to avoid hoisting issues
  const showWelcomeSequence = () => {
    const welcomeGifMessage = {
      id: 'welcome',
      type: 'bot',
      content: '',
      isWelcome: true,
      timestamp: Date.now()
    };
    
    const welcomeTextMessage = {
      id: 'welcome-text',
      type: 'bot',
      content: "Rawr! Rexy here. Wanna chat Teri? You can ask me anything about the bag!",
      timestamp: Date.now()
    };
    
    setMessages([welcomeGifMessage, welcomeTextMessage]);
  };

  useEffect(() => {
    // Check for test disconnect parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('test_disconnect') === 'true') {
      setTimeout(() => {
        setShowConnectionError(true);
      }, 1000);
    }

    // Show complete welcome sequence (GIF + greeting message)
    showWelcomeSequence();
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

  // Handle image click to open photo overlay (matching rexy.js functionality)
  const handleImageClick = (imageSrc) => {
    setPhotoOverlayImage(imageSrc);
  };

  const handleClosePhotoOverlay = () => {
    const overlay = document.getElementById('single-photo-overlay');
    if (overlay) {
      overlay.classList.remove('show');
      setTimeout(() => {
        setPhotoOverlayImage(null);
      }, 300);
    } else {
      setPhotoOverlayImage(null);
    }
  };

  // Handle video click to open video overlay
  const handleVideoClick = (videoUrl, title) => {
    console.log('[ChatContainer] Video clicked:', videoUrl, title);
    setVideoOverlayData({ videoUrl, title });
  };

  const handleCloseVideoOverlay = () => {
    const overlay = document.getElementById('video-overlay');
    if (overlay) {
      overlay.classList.remove('show');
      setTimeout(() => {
        setVideoOverlayData(null);
      }, 300);
    } else {
      setVideoOverlayData(null);
    }
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
        onImageClick={handleImageClick}
        onVideoClick={handleVideoClick}
      />
      
      <ChatInput onSendMessage={handleSendMessage} />
      
      {/* Animation Overlays */}
      {renderThinkingOverlay()}
      {renderWatchReelOverlay()}
      
      {/* Photo Overlay */}
      {photoOverlayImage && (
        <PhotoOverlay 
          imageSrc={photoOverlayImage}
          onClose={handleClosePhotoOverlay}
        />
      )}
      
      {/* Video Overlay */}
      {videoOverlayData && (
        <VideoOverlay 
          videoUrl={videoOverlayData.videoUrl}
          title={videoOverlayData.title}
          onClose={handleCloseVideoOverlay}
        />
      )}
    </div>
  );
};

export default ChatContainer;

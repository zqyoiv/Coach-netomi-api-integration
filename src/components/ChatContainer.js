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
import debug from '../utils/debug';
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
    renderWelcomeAnimation,
    startThinkingAnimation,
    stopThinkingAnimation,
    showWatchReelAnimation,
    renderThinkingOverlay,
    renderWatchReelOverlay,
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
    // Track welcome sequence start with GTM (matching vanilla JS rexy.js lines 1273-1279)
    if (gtmManager.trackContentInteraction) {
      gtmManager.trackContentInteraction('display', 'welcome_gif', {
        title: 'Rexy Welcome Animation',
        id: 'welcome_start'
      });
    }
    
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
    
    // Track welcome sequence complete with GTM (matching vanilla JS rexy.js lines 1288-1296)
    setTimeout(() => {
      if (gtmManager.trackMessageReceived) {
        gtmManager.trackMessageReceived(
          "Rawr! Rexy here. Wanna chat Teri? You can ask me anything about the bag!",
          'text',
          false
        );
        gtmManager.incrementMessagesReceived();
      }
    }, 1000);
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
      debug.log('[ChatContainer] Processing real-time webhook update:', webhookResponse);
      
      // Stop thinking animation when response arrives (matching vanilla JS)
      stopThinkingAnimation();
      
      // Extract all AI response texts
      const allTexts = extractAllAIResponseTexts(webhookResponse);
      if (allTexts.length > 0) {
        debug.log(`[ChatContainer] Adding ${allTexts.length} AI responses from real-time update`);
        renderMultipleMessages(allTexts, 1200); // 1.2 second delay between messages
      }
      
      // Extract and display image if available
      const imageData = extractImageData(webhookResponse);
      if (imageData) {
        debug.log('[ChatContainer] Adding image from real-time update:', imageData.imageUrl);
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
  }, [stopThinkingAnimation, extractAllAIResponseTexts, extractImageData, extractCarouselData, registerWebhookHandler, unregisterWebhookHandler]);


  const addMessage = (text, isUser = true, options = {}) => {
    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: isUser ? 'user' : 'bot',
      content: text,
      timestamp: Date.now(),
      ...options
    };

    setMessages(prev => [...prev, message]);

    // Track with GTM (matching vanilla JS rexy.js lines 69-82)
    if (isUser) {
      if (gtmManager.trackMessageSend) {
        gtmManager.trackMessageSend(text, options.isSticker ? 'sticker' : 'text');
        gtmManager.incrementMessagesSent();
      }
    } else {
      if (gtmManager.trackMessageReceived) {
        const messageType = options.isHtml ? 'html' : 'text';
        const hasContent = options.isHtml || text.includes('carousel') || text.includes('image') || text.includes('video');
        gtmManager.trackMessageReceived(text, messageType, hasContent);
        gtmManager.incrementMessagesReceived();
      }
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

    // Start thinking animation (matching vanilla JS - shows fullscreen overlay after delay)
    startThinkingAnimation();

    try {
      // Send to Netomi
      const response = await netomiIntegration.sendMessage(messageText, attachments);
      
      // DON'T stop animation here - initial response is just acknowledgment
      // Animation will stop when webhook arrives with actual data

      // Add bot response if there's immediate text (though usually there isn't)
      if (response && response.text) {
        addMessage(response.text, false, { isHtml: response.isHtml });
      }

    } catch (error) {
      debug.error('Error sending message:', error);
      
      // Track API error with GTM (matching vanilla JS rexy.js lines 382-388)
      if (gtmManager.trackError) {
        gtmManager.trackError('api', 'Netomi API error', {
          source: 'message_send',
          message: error.message || String(error)
        });
      }
      
      // Stop thinking animation on error
      stopThinkingAnimation();
      
      // Show error message
      addMessage('Sorry, I encountered an error. Please try again.', false);
    }
  };

  // Helper function to render multiple messages sequentially (matching rexy.js)
  const renderMultipleMessages = (textMessages, delay = 1000) => {
    if (!textMessages || textMessages.length === 0) return;
    
    debug.log(`[ChatContainer] Rendering ${textMessages.length} messages sequentially`);
    
    textMessages.forEach((messageData, index) => {
      setTimeout(() => {
        debug.log(`[ChatContainer] Rendering message ${index + 1}:`, messageData.text);
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
  const handleImageClick = (imageSrc, title = 'Image') => {
    // Track image interaction (matching vanilla JS rexy.js lines 610-621)
    if (gtmManager.trackContentInteraction) {
      gtmManager.trackContentInteraction('tap', 'image', {
        title: title,
        url: imageSrc,
        id: 'image_tap_' + Date.now()
      });
    }
    setPhotoOverlayImage(imageSrc);
  };

  const handleClosePhotoOverlay = (imageSrc, closeMethod = 'button_click') => {
    // Track image close interaction (matching vanilla JS rexy.js lines 854-866)
    if (gtmManager.trackContentInteraction && imageSrc) {
      gtmManager.trackContentInteraction('close', 'image', {
        title: 'Image',
        url: imageSrc,
        id: 'image_close_' + Date.now(),
        close_method: closeMethod
      });
    }
    
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

  // Handle video click to open video overlay (matching vanilla JS)
  const handleVideoClick = (videoUrl, title) => {
    debug.log('[ChatContainer] Video clicked:', videoUrl, title);
    
    // Track video tap interaction (matching vanilla JS rexy.js lines 584-595)
    if (gtmManager.trackContentInteraction) {
      gtmManager.trackContentInteraction('tap', 'video', {
        title: title || 'Video',
        url: videoUrl,
        id: 'carousel_video_' + Date.now()
      });
    }
    
    setVideoOverlayData({ videoUrl, title });
    
    // Show watch reel animation when video opens (matching vanilla JS)
    showWatchReelAnimation();
  };

  const handleCloseVideoOverlay = (videoUrl, title, currentTime = 0, duration = 0, closeMethod = 'button_click') => {
    // Track video close interaction (matching vanilla JS rexy.js lines 674-688)
    if (gtmManager.trackContentInteraction && videoUrl) {
      gtmManager.trackContentInteraction('close', 'video', {
        title: title || 'Video',
        url: videoUrl,
        id: 'video_close_' + Date.now(),
        current_time: currentTime,
        duration: duration,
        watch_percentage: duration ? Math.round((currentTime / duration) * 100) : 0,
        close_method: closeMethod
      });
    }
    
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

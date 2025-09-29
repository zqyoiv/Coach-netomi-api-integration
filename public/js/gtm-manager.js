/**
 * Google Tag Manager Event Tracking Manager
 * Centralized GTM event handling for Coach Rexy Chat Application
 */

class GTMManager {
    constructor() {
        this.isInitialized = false;
        this.eventQueue = [];
        this.init();
    }

    /**
     * Initialize GTM Manager
     */
    init() {
        // Wait for dataLayer to be available
        if (typeof dataLayer !== 'undefined') {
            this.isInitialized = true;
            console.log('✅ GTM Manager initialized - dataLayer available');
            this.flushEventQueue();
        } else {
            // Retry initialization after a short delay
            setTimeout(() => this.init(), 100);
        }
    }

    /**
     * Get current chat session ID
     */
    getSessionId() {
        return sessionStorage.getItem('conversationId') || 'unknown';
    }

    /**
     * Send GTM event with error handling and queuing
     */
    sendEvent(eventName, eventData = {}) {
        const gtmData = {
            'event': eventName,
            'timestamp': new Date().toISOString(),
            'chat_session_id': this.getSessionId(),
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
            this.eventQueue.forEach(({ eventName, eventData, isDirect }) => {
                if (isDirect) {
                    // Direct dataLayer push for specific events like datalayer_initialized
                    try {
                        dataLayer.push(eventData);
                        console.log('🏷️ GTM Event (direct):', eventName, eventData);
                    } catch (error) {
                        console.error('❌ GTM Event (direct) failed:', eventName, error);
                    }
                } else {
                    // Regular event through sendEvent method
                    this.sendEvent(eventName, eventData);
                }
            });
            this.eventQueue = [];
        }
    }

    /**
     * Track data layer initialization (custom event from coworker)
     */
    trackDataLayerInitialized(options = {}) {
        const defaultData = {
            'event': 'datalayer_initialized',
            'event_action': options.event_action || '',
            'event_label': options.event_label || '',
            'store_code': options.store_code || '',
            'qr_code': options.qr_code || '',
            'session_timer': options.session_timer || ''
        };

        // Send directly to dataLayer (not through sendEvent to avoid extra fields)
        if (this.isInitialized && typeof dataLayer !== 'undefined') {
            try {
                dataLayer.push(defaultData);
                console.log('🏷️ GTM DataLayer Initialized Event:', defaultData);
            } catch (error) {
                console.error('❌ GTM DataLayer Initialized Event failed:', error);
            }
        } else {
            // Queue for later if GTM not ready
            this.eventQueue.push({ 
                eventName: 'datalayer_initialized_direct', 
                eventData: defaultData,
                isDirect: true 
            });
            console.warn('⏳ GTM not ready, queued datalayer_initialized event');
        }
    }

    /**
     * Track page view completion
     */
    trackPageView() {
        this.sendEvent('page_view_complete', {
            'page_title': document.title,
            'page_url': window.location.href,
            'user_agent': navigator.userAgent,
            'device_type': /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop'
        });
    }

    /**
     * Track chat welcome sequence
     */
    trackWelcomeStarted() {
        this.sendEvent('chat_welcome_started', {
            'welcome_type': 'initial_load'
        });
    }

    trackWelcomeCompleted() {
        this.sendEvent('chat_welcome_completed', {
            'welcome_type': 'initial_load'
        });
    }

    /**
     * Track user messages
     */
    trackUserMessage(messageText, isSticker = false) {
        this.sendEvent('user_message_sent', {
            'message_text': messageText,
            'message_length': messageText.length,
            'is_sticker': isSticker,
            'message_type': isSticker ? 'sticker' : 'text'
        });
    }

    /**
     * Track bot responses
     */
    trackBotResponse(messageText, isHtml = false) {
        this.sendEvent('bot_response_received', {
            'message_text': messageText,
            'message_length': messageText.length,
            'is_html': isHtml,
            'response_type': isHtml ? 'html' : 'text'
        });
    }

    /**
     * Track quick reply selections
     */
    trackQuickReply(replyText) {
        this.sendEvent('quick_reply_selected', {
            'reply_text': replyText,
            'reply_length': replyText.length
        });
    }

    /**
     * Track photo upload events
     */
    trackPhotoUploadStarted(fileCount) {
        this.sendEvent('photo_upload_started', {
            'file_count': fileCount
        });
    }

    trackPhotoFileProcessed(file) {
        this.sendEvent('photo_file_processed', {
            'file_type': file.type,
            'file_size': file.size,
            'file_name': file.name,
            'file_size_mb': Math.round(file.size / 1024 / 1024 * 100) / 100
        });
    }

    /**
     * Track carousel interactions
     */
    trackCarouselDisplayed(itemCount, carouselType = 'product') {
        this.sendEvent('carousel_displayed', {
            'item_count': itemCount,
            'carousel_type': carouselType
        });
    }

    trackCarouselItemClicked(itemIndex, itemTitle, carouselType = 'product') {
        this.sendEvent('carousel_item_clicked', {
            'item_index': itemIndex,
            'item_title': itemTitle,
            'carousel_type': carouselType
        });
    }

    /**
     * Track video interactions
     */
    trackVideoOpened(videoUrl, videoTitle) {
        this.sendEvent('video_opened', {
            'video_url': videoUrl,
            'video_title': videoTitle
        });
    }

    trackVideoClosed(videoUrl, videoTitle) {
        this.sendEvent('video_closed', {
            'video_url': videoUrl,
            'video_title': videoTitle
        });
    }

    /**
     * Track image interactions
     */
    trackImageOpened(imageUrl, imageTitle) {
        this.sendEvent('image_opened', {
            'image_url': imageUrl,
            'image_title': imageTitle
        });
    }

    trackImageClosed(imageUrl, imageTitle) {
        this.sendEvent('image_closed', {
            'image_url': imageUrl,
            'image_title': imageTitle
        });
    }

    /**
     * Track typing indicators
     */
    trackTypingStarted() {
        this.sendEvent('typing_indicator_shown', {});
    }

    trackTypingStopped() {
        this.sendEvent('typing_indicator_hidden', {});
    }

    /**
     * Track connection events
     */
    trackConnectionEstablished() {
        this.sendEvent('connection_established', {});
    }

    trackConnectionError(errorType) {
        this.sendEvent('connection_error', {
            'error_type': errorType
        });
    }

    /**
     * Track Netomi API interactions
     */
    trackNetomiMessageSent(messageLength) {
        this.sendEvent('netomi_message_sent', {
            'message_length': messageLength,
            'api_endpoint': 'process-message'
        });
    }

    trackNetomiResponseReceived(responseSuccess, responseTime) {
        this.sendEvent('netomi_response_received', {
            'response_success': responseSuccess,
            'response_time_ms': responseTime
        });
    }

    /**
     * Track errors
     */
    trackError(errorType, errorMessage, errorContext = {}) {
        this.sendEvent('application_error', {
            'error_type': errorType,
            'error_message': errorMessage,
            'error_context': errorContext
        });
    }

    /**
     * Track custom events
     */
    trackCustomEvent(eventName, eventData = {}) {
        this.sendEvent(`custom_${eventName}`, eventData);
    }
}

// Create global instance
window.GTMManager = new GTMManager();

// Legacy function for backward compatibility
window.sendGTMEvent = function(eventName, eventData = {}) {
    window.GTMManager.sendEvent(eventName, eventData);
};

// Helper function for the custom datalayer_initialized event
window.initializeDataLayer = function(options = {}) {
    if (window.GTMManager) {
        window.GTMManager.trackDataLayerInitialized(options);
    } else {
        console.warn('GTM Manager not available for datalayer_initialized event');
    }
};

console.log('🏷️ GTM Manager loaded and ready');

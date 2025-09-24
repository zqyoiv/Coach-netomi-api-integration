// Netomi Integration Functions
// Handles authentication token generation and API communication

// Note: Authentication tokens are managed server-side only
// Client-side does not need to know about authentication tokens
// Ensure per-tab conversation id (persists across refresh, unique across tabs)
function getOrCreateConversationId() {
    try {
        const key = 'netomiConversationId';
        let id = sessionStorage.getItem(key);
        if (id && typeof id === 'string' && id.trim() !== '') {
            window.netomiConversationId = id;
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
        window.netomiConversationId = id;
        return id;
    } catch (e) {
        // Fallback if sessionStorage not available
        if (window.netomiConversationId) return window.netomiConversationId;
        const fallback = `chat-${Date.now()}`;
        window.netomiConversationId = fallback;
        return fallback;
    }
}

/**
 * Test server connection (tokens are managed server-side)
 * @returns {Promise<Object>} Connection test result
 */
async function testServerConnection() {
    try {
        console.log('[Netomi] Testing server connection...');
        
        const response = await fetch('/api/netomi/test-connection');
        const result = await response.json();
        
        console.log('[Netomi] Server connection test result:', result);
        
        if (!response.ok) {
            throw new Error(result.error || `HTTP ${response.status}`);
        }
        
        // Update debug panel if available
        updateConnectionDisplay(result);
        
        return result;
    } catch (error) {
        console.error('[Netomi] Server connection test failed:', error);
        
        // Update debug panel with error
        updateConnectionDisplay(null, error.message);
        
        throw error;
    }
}

// Client-side token management removed - tokens are handled server-side only

/**
 * Update the debug panel with connection information
 * @param {Object} connectionData - Connection test response data
 * @param {string} error - Error message if connection test failed
 */
function updateConnectionDisplay(connectionData, error) {
    // Update connection section in debug panel
    const tokenSection = document.getElementById('debugTokenSection');
    if (!tokenSection) return;
    
    const tokenDisplay = document.getElementById('debugTokenDisplay');
    const tokenStatus = document.getElementById('debugTokenStatus');
    const tokenExpiry = document.getElementById('debugTokenExpiry');
    
    if (error) {
        if (tokenStatus) {
            tokenStatus.textContent = 'Error';
            tokenStatus.className = 'info-value error';
        }
        if (tokenDisplay) {
            tokenDisplay.textContent = `Error: ${error}`;
            tokenDisplay.className = 'info-value error';
        }
        if (tokenExpiry) {
            tokenExpiry.textContent = 'N/A';
        }
    } else if (connectionData) {
        if (tokenStatus) {
            tokenStatus.textContent = connectionData.success ? 'Connected' : 'Failed';
            tokenStatus.className = connectionData.success ? 'info-value success' : 'info-value error';
        }
        if (tokenDisplay) {
            tokenDisplay.textContent = 'Server-managed';
            tokenDisplay.className = 'info-value';
        }
        if (tokenExpiry) {
            tokenExpiry.textContent = 'Server-managed';
        }
    }
}

/**
 * Send a message to Netomi API (following index.html pattern exactly)
 * @param {string} message - User message
 * @param {Object} options - Additional options (conversationId, etc.)
 * @returns {Promise<Object>} Netomi API response
 */
async function sendToNetomi(message, options = {}) {
    // Tokens are managed server-side, client just sends message data
    
    // Format message data EXACTLY like index.html (copied structure)
    // Persist a single conversationId per tab using sessionStorage
    const conversationId = getOrCreateConversationId();
    const userId = "rexy-chat-user";
    
    const messageData = {
        conversationId: conversationId,
        messagePayload: {
            text: message,
            label: "",
            messageId: options.messageId || self.crypto.randomUUID(),
            timestamp: Date.now(),
            hideMessage: false
        },
        userDetails: {
            userId: userId
        },
        origin: options.origin || "rexy-chat",
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
    
    console.log('[Netomi] Sending message:', message);
    console.log('[Netomi] Using server-managed auth token');
    
    try {
        // Ensure socket is connected so webhook responses can be pushed in real-time
        await ensureSocketConnectedAndAuthenticated(3000);
        const response = await fetch('/api/netomi/process-message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messageData: messageData,
                // Always ack-only; webhook will be received via Socket.IO
                clientSocketId: (window.netomiSocket && window.netomiSocket.id) ? window.netomiSocket.id : null
            })
        });
        
        // Parse JSON safely
        let result;
        try {
            result = await response.json();
        } catch (e) {
            result = { ok: false, error: 'Invalid JSON from server', raw: null };
        }
        
        if (!response.ok) {
            const errMsg = (result && result.error) ? result.error : `HTTP ${response.status}`;
            console.warn('[Netomi] Non-OK response:', errMsg);
            return { ok: false, error: errMsg, status: response.status };
        }
        
        console.log('[Netomi] Ack response received:', result);
        return result;
        
    } catch (error) {
        console.error('[Netomi] Request failed:', error);
        return { ok: false, error: error?.message || String(error) };
    }
}

/**
 * Test Netomi connection via server
 * @returns {Promise<Object>} Test result
 */
async function testNetomiConnection() {
    try {
        const connectionData = await testServerConnection();
        return {
            success: true,
            message: 'Connection successful',
            data: connectionData
        };
    } catch (error) {
        return {
            success: false,
            message: error.message,
            error: error
        };
    }
}

/**
 * Extract AI response text from Netomi webhook response (matching index.html logic)
 * @param {Object} webhookResponse - The webhook response from Netomi
 * @returns {string|null} Extracted AI text or null if not found
 */
function extractAIResponseText(webhookResponse) {
    try {
        if (!webhookResponse) return null;
        
        console.log('[Netomi] Extracting AI text from webhook response:', webhookResponse);
        
        // Check for attachments (Netomi AI responses) - same as index.html
        if (webhookResponse.attachments && Array.isArray(webhookResponse.attachments)) {
            for (const attachment of webhookResponse.attachments) {
                // Look for Text attachments with actual text content
                if (attachment.type === 'ai.msg.domain.responses.core.Text' && 
                    attachment.attachment && 
                    attachment.attachment.text &&
                    attachment.attachment.text.trim() !== '') {
                    
                    console.log('[Netomi] Found AI text:', attachment.attachment.text);
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
        
        console.log('[Netomi] No AI text found in webhook response attachments');
        return null;
    } catch (error) {
        console.error('[Netomi] Error extracting AI text:', error);
        return null;
    }
}

/**
 * Extract all AI response texts from Netomi webhook response
 * @param {Object} webhookResponse - The webhook response from Netomi
 * @returns {Array} Array of text messages (empty array if none found)
 */
function extractAllAIResponseTexts(webhookResponse) {
    try {
        if (!webhookResponse) return [];
        
        console.log('[Netomi] Extracting all AI texts from webhook response:', webhookResponse);
        
        const textMessages = [];
        
        // Check for attachments (Netomi AI responses)
        if (webhookResponse.attachments && Array.isArray(webhookResponse.attachments)) {
            for (const attachment of webhookResponse.attachments) {
                // Look for Text attachments with actual text content and AI response type
                if (attachment.type === 'ai.msg.domain.responses.core.Text' && 
                    attachment.attachment && 
                    attachment.attachment.text &&
                    attachment.attachment.text.trim() !== '' &&
                    attachment.attachment.attachmentResponseType === 'ANSWER_AI_RESPONSE') {
                    
                    console.log('[Netomi] Found AI text:', attachment.attachment.text);
                    textMessages.push({
                        text: attachment.attachment.text,
                        timestamp: attachment.attachment.timestamp,
                        id: attachment.attachment.id
                    });
                }
            }
        }
        
        console.log(`[Netomi] Found ${textMessages.length} AI text messages`);
        return textMessages;
    } catch (error) {
        console.error('[Netomi] Error extracting all AI texts:', error);
        return [];
    }
}

/**
 * Extract image data from Netomi webhook response
 * @param {Object} webhookResponse - The webhook response from Netomi
 * @returns {Object|null} Image data or null if not found
 */
function extractImageData(webhookResponse) {
    try {
        if (!webhookResponse || !webhookResponse.attachments) return null;

        // Look for Image attachments
        for (const attachment of webhookResponse.attachments) {
            if (attachment.type === 'ai.msg.domain.responses.core.Image' &&
                attachment.attachment &&
                attachment.attachment.largeImageUrl) {
                
                console.log('[Netomi] Found image attachment:', attachment.attachment);
                return {
                    imageUrl: attachment.attachment.largeImageUrl,
                    title: attachment.attachment.title || null,
                    timestamp: attachment.attachment.timestamp
                };
            }
        }

        console.log('[Netomi] No image attachment found');
        return null;
    } catch (error) {
        console.error('[Netomi] Error extracting image data:', error);
        return null;
    }
}

/**
 * Extract carousel data from Netomi webhook response
 * @param {Object} webhookResponse - The webhook response from Netomi
 * @returns {Object|null} Carousel data or null if not found
 */
function extractCarouselData(webhookResponse) {
    try {
        if (!webhookResponse || !webhookResponse.attachments) return null;

        // Netomi carousel format
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

        // Fallback: Messenger-style generic template
        const fbTemplate = webhookResponse.attachments.find(att => 
            att.type === 'template' && att.payload && att.payload.template_type === 'generic'
        );
        if (fbTemplate && fbTemplate.payload.elements) {
            return {
                elements: fbTemplate.payload.elements.map(element => ({
                    imageUrl: element.image_url,
                    title: element.title,
                    subtitle: element.subtitle,
                    description: element.subtitle,
                    buttons: element.buttons ? element.buttons.map(btn => ({
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
}

/**
 * Initialize Socket.IO connection for real-time updates
 */
function initializeSocketConnection() {
    // Don't reconnect if already connected
    if (window.netomiSocket && window.netomiSocket.connected) {
        console.log('[Netomi] Socket.IO already connected');
        return;
    }
    
    console.log('[Netomi] Initializing Socket.IO connection...');
    
    // Create Socket.IO connection with resilient options
    window.netomiSocket = io({
        transports: ['websocket'], // prefer WS
        upgrade: false,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000 // connection timeout
    });
    
    window.netomiSocket.on('connect', () => {
        console.log(`[Netomi] Socket.IO connected: ${window.netomiSocket.id}`);
        
        // Send client info (no auth token needed)
        console.log('[Netomi] Sending client info...');
        window.netomiSocket.emit('authenticate', {
            clientInfo: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                page: 'rexy-chat'
            }
        });
    });
    
    window.netomiSocket.on('connected', (data) => {
        console.log('[Netomi] Socket.IO initial connection confirmed:', data);
    });
    
    window.netomiSocket.on('authenticated', (data) => {
        console.log('[Netomi] Socket.IO authenticated:', data);
    });
    
    window.netomiSocket.on('webhook_update', (data, serverAck) => {
        console.log('[Netomi] Received webhook update via Socket.IO:', data);
        
        if (data.message && data.message.data) {
            // Notify the chat interface about the new webhook
            if (window.handleRealtimeWebhookUpdate) {
                window.handleRealtimeWebhookUpdate(data.message.data);
            } else {
                // Queue the event until handler is registered
                if (!Array.isArray(window._pendingWebhookEvents)) {
                    window._pendingWebhookEvents = [];
                }
                window._pendingWebhookEvents.push(data.message.data);
                console.log('[Netomi] Handler not ready; queued webhook. Queue length:', window._pendingWebhookEvents.length);
            }
        }

        // Always acknowledge to server so it won't retry
        try {
            if (typeof serverAck === 'function') {
                serverAck({ ok: true, receivedAt: Date.now(), deliveryId: data && data.deliveryId });
            }
        } catch {}
    });
    
    window.netomiSocket.on('disconnect', (reason) => {
        console.log(`[Netomi] Socket.IO disconnected: ${reason}`);
        // On ping timeout or transport close, try reconnecting
        if (window.netomiSocket && !window.netomiSocket.connected) {
            try { window.netomiSocket.connect(); } catch {}
        }
    });
    
    window.netomiSocket.on('connect_error', (error) => {
        console.error('[Netomi] Socket.IO connection error:', error);
    });
}

// Ensure socket is connected (and authenticate if token exists). Wait briefly if needed.
async function ensureSocketConnectedAndAuthenticated(timeoutMs = 3000) {
    try {
        // Initialize if missing
        if (!window.netomiSocket) {
            initializeSocketConnection();
        }

        // Already connected
        if (window.netomiSocket && window.netomiSocket.connected) {
            // Send client info (no auth token needed)
            window.netomiSocket.emit('authenticate', {
                clientInfo: {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform,
                    page: 'rexy-chat'
                }
            });
            return true;
        }

        // Wait for connection up to timeout
        await new Promise((resolve, reject) => {
            const start = Date.now();
            const onConnect = () => {
                window.netomiSocket.off('connect_error', onError);
                // Send client info (no auth token needed)
                window.netomiSocket.emit('authenticate', {
                    clientInfo: {
                        userAgent: navigator.userAgent,
                        platform: navigator.platform,
                        page: 'rexy-chat'
                    }
                });
                resolve();
            };
            const onError = (err) => {
                if (Date.now() - start >= timeoutMs) {
                    window.netomiSocket.off('connect', onConnect);
                    window.netomiSocket.off('connect_error', onError);
                    reject(err);
                }
            };
            const timer = setTimeout(() => {
                window.netomiSocket.off('connect', onConnect);
                window.netomiSocket.off('connect_error', onError);
                reject(new Error('Socket connect timeout'));
            }, timeoutMs);
            window.netomiSocket.once('connect', () => {
                clearTimeout(timer);
                onConnect();
            });
            window.netomiSocket.on('connect_error', onError);
            // Kick off connection if not started
            if (!window.netomiSocket.connected) {
                try { window.netomiSocket.connect(); } catch {}
            }
        });
        return window.netomiSocket && window.netomiSocket.connected;
    } catch (e) {
        console.warn('[Netomi] ensureSocketConnectedAndAuthenticated failed:', e?.message || e);
        return false;
    }
}

// Export functions for use in other scripts
window.NetomiIntegration = {
    testConnection: testNetomiConnection,
    sendToNetomi,
    getConversationId: getOrCreateConversationId,
    extractAIResponseText,
    extractAllAIResponseTexts,
    extractCarouselData,
    extractImageData,
    initializeSocketConnection
};

console.log('[NetomiIntegration] ✅ Object initialized and available globally');

// Initialize Socket.IO connection IMMEDIATELY when script loads (before DOM ready)
console.log('[Netomi] Initializing Socket.IO connection immediately...');
initializeSocketConnection();

// Auto-test connection when DOM is ready and debug panel is available
document.addEventListener('DOMContentLoaded', function() {
    console.log('[Netomi] DOM loaded, checking for auto-connection test...');
    
    // Wait a bit for debug panel to initialize, then test connection
    setTimeout(() => {
        if (window.RexyGlobalState && window.RexyGlobalState.isNetomiEnabled()) {
            console.log('[Netomi] Auto-testing server connection on page load...');
            testServerConnection().catch(error => {
                console.warn('[Netomi] Auto connection test failed:', error);
            });
        }
    }, 1000);
});

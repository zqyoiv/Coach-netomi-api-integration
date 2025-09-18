// Netomi Integration Functions
// Handles authentication token generation and API communication

// Store tokens in window object for global access
window.netomiAuthToken = null;
window.netomiTokenExpiry = null;

/**
 * Generate a new Netomi authentication token
 * @returns {Promise<Object>} Token response object
 */
async function generateNetomiToken() {
    try {
        console.log('[Netomi] Requesting new authentication token...');
        
        const response = await fetch('/api/netomi/generate-token');
        const result = await response.json();
        
        console.log('[Netomi] Raw server response:', result);
        
        if (!response.ok) {
            throw new Error(result.error || `HTTP ${response.status}`);
        }
        
        if (result.ok && result.data) {
            console.log('[Netomi] Token data structure:', result.data);
            // Store token in window object (same pattern as index.html)
            // Extract token from payload structure like index.html does
            const extractedToken = result.data.payload && result.data.payload.token;
            console.log('[Netomi] Extracted token:', extractedToken);
            window.netomiAuthToken = extractedToken;
            
            // Calculate expiration time if provided (check payload structure)
            if (result.data.payload && result.data.payload.expires_in) {
                window.netomiTokenExpiry = Date.now() + (result.data.payload.expires_in * 1000);
            } else if (result.data.payload && result.data.payload.expiresIn) {
                window.netomiTokenExpiry = Date.now() + (result.data.payload.expiresIn * 1000);
            } else if (result.data.expires_in) {
                window.netomiTokenExpiry = Date.now() + (result.data.expires_in * 1000);
            } else if (result.data.expiresIn) {
                window.netomiTokenExpiry = Date.now() + (result.data.expiresIn * 1000);
            }
            
        console.log('[Netomi] Token stored in window object');
        console.log('[Netomi] Token:', window.netomiAuthToken ? `${window.netomiAuthToken.substring(0, 20)}...` : 'None');
        console.log('[Netomi] Expires at:', window.netomiTokenExpiry ? new Date(window.netomiTokenExpiry).toISOString() : 'Unknown');
        
        // Re-authenticate existing Socket.IO connection with new token
        if (window.netomiSocket && window.netomiSocket.connected) {
            window.netomiSocket.emit('authenticate', {
                authToken: window.netomiAuthToken,
                clientInfo: {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform,
                    page: 'rexy-chat'
                }
            });
        }
        
        // Update debug panel if available
        updateTokenDisplay(result.data);
        
        return result.data.payload || result.data;
        } else {
            throw new Error('Invalid response format from token endpoint');
        }
    } catch (error) {
        console.error('[Netomi] Token generation failed:', error);
        
        // Update debug panel with error
        updateTokenDisplay(null, error.message);
        
        throw error;
    }
}

/**
 * Check if current token is still valid
 * @returns {boolean} True if token is valid and not expired
 */
function isTokenValid() {
    if (!window.netomiAuthToken) return false;
    if (!window.netomiTokenExpiry) return true; // Assume valid if no expiration
    return Date.now() < window.netomiTokenExpiry;
}

/**
 * Get current valid token, generating a new one if needed
 * @returns {Promise<string>} Valid authentication token
 */
async function getValidToken() {
    if (isTokenValid()) {
        console.log('[Netomi] Using existing valid token from window');
        return window.netomiAuthToken;
    }
    
    console.log('[Netomi] Token expired or missing, generating new one...');
    const tokenData = await generateNetomiToken();
    return window.netomiAuthToken; // Return from window after generation
}

/**
 * Update the debug panel with token information
 * @param {Object} tokenData - Token response data
 * @param {string} error - Error message if token generation failed
 */
function updateTokenDisplay(tokenData, error) {
    // Update token section in debug panel
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
    } else if (tokenData) {
        const token = tokenData.token || tokenData.access_token;
        const maskedToken = token ? `${token.substring(0, 12)}...${token.substring(token.length - 8)}` : 'None';
        
        if (tokenStatus) {
            tokenStatus.textContent = 'Active';
            tokenStatus.className = 'info-value success';
        }
        if (tokenDisplay) {
            tokenDisplay.textContent = maskedToken;
            tokenDisplay.className = 'info-value';
        }
        if (tokenExpiry) {
            if (window.netomiTokenExpiry) {
                const expiryDate = new Date(window.netomiTokenExpiry);
                const timeLeft = Math.round((window.netomiTokenExpiry - Date.now()) / 1000 / 60); // minutes
                tokenExpiry.textContent = `${timeLeft}m (${expiryDate.toLocaleTimeString()})`;
            } else {
                tokenExpiry.textContent = 'No expiration';
            }
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
    // Always read token from window (same as index.html pattern)
    const authToken = window.netomiAuthToken;
    if (!authToken) {
        throw new Error('No auth token available. Please generate a token first.');
    }
    
    // Format message data EXACTLY like index.html (copied structure)
    // Persist a single conversationId for the tab lifecycle
    const conversationId = (function ensureConversationId() {
        if (window.netomiConversationId && typeof window.netomiConversationId === 'string') {
            return window.netomiConversationId;
        }
        window.netomiConversationId = `chat-${Date.now()}`;
        return window.netomiConversationId;
    })();
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
    console.log('[Netomi] Using auth token from window.netomiAuthToken');
    
    try {
        // Ensure socket is connected so webhook responses can be pushed in real-time
        await ensureSocketConnectedAndAuthenticated(3000);
        const response = await fetch('/api/netomi/process-message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                authToken: authToken,
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
 * Test Netomi connection by generating a token
 * @returns {Promise<Object>} Test result
 */
async function testNetomiConnection() {
    try {
        const tokenData = await generateNetomiToken();
        return {
            success: true,
            message: 'Connection successful',
            data: tokenData
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
        
        // Authenticate with the server if we have a token
        if (window.netomiAuthToken) {
            console.log('[Netomi] Authenticating with existing token...');
            window.netomiSocket.emit('authenticate', {
                authToken: window.netomiAuthToken,
                clientInfo: {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform,
                    page: 'rexy-chat'
                }
            });
        } else {
            console.log('[Netomi] Connected but no token yet - will authenticate when token is generated');
        }
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
            // Authenticate if token present (best-effort)
            if (window.netomiAuthToken) {
                window.netomiSocket.emit('authenticate', {
                    authToken: window.netomiAuthToken,
                    clientInfo: {
                        userAgent: navigator.userAgent,
                        platform: navigator.platform,
                        page: 'rexy-chat'
                    }
                });
            }
            return true;
        }

        // Wait for connection up to timeout
        await new Promise((resolve, reject) => {
            const start = Date.now();
            const onConnect = () => {
                window.netomiSocket.off('connect_error', onError);
                // Authenticate if token available
                if (window.netomiAuthToken) {
                    window.netomiSocket.emit('authenticate', {
                        authToken: window.netomiAuthToken,
                        clientInfo: {
                            userAgent: navigator.userAgent,
                            platform: navigator.platform,
                            page: 'rexy-chat'
                        }
                    });
                }
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
    generateToken: generateNetomiToken,
    sendToNetomi,
    testConnection: testNetomiConnection,
    getCurrentToken: () => window.netomiAuthToken,
    getTokenExpiry: () => window.netomiTokenExpiry,
    extractAIResponseText,
    extractCarouselData,
    initializeSocketConnection
};

console.log('[NetomiIntegration] ✅ Object initialized and available globally');

// Initialize Socket.IO connection IMMEDIATELY when script loads (before DOM ready)
console.log('[Netomi] Initializing Socket.IO connection immediately...');
initializeSocketConnection();

// Auto-generate token when DOM is ready and debug panel is available
document.addEventListener('DOMContentLoaded', function() {
    console.log('[Netomi] DOM loaded, checking for auto-token generation...');
    
    // Wait a bit for debug panel to initialize, then auto-generate token
    setTimeout(() => {
        if (window.RexyGlobalState && window.RexyGlobalState.isNetomiEnabled()) {
            console.log('[Netomi] Auto-generating token on page load...');
            generateNetomiToken().catch(error => {
                console.warn('[Netomi] Auto token generation failed:', error);
            });
        }
    }, 1000);
});

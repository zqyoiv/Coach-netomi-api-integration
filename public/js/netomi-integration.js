// Netomi Integration Functions
// Handles authentication token generation and API communication

let netomiToken = null;
let tokenExpiresAt = null;

/**
 * Generate a new Netomi authentication token
 * @returns {Promise<Object>} Token response object
 */
async function generateNetomiToken() {
    try {
        console.log('[Netomi] Requesting new authentication token...');
        
        const response = await fetch('/api/netomi/generate-token');
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || `HTTP ${response.status}`);
        }
        
        if (result.ok && result.data) {
            netomiToken = result.data.token || result.data.access_token;
            
            // Calculate expiration time if provided
            if (result.data.expires_in) {
                tokenExpiresAt = Date.now() + (result.data.expires_in * 1000);
            } else if (result.data.expiresIn) {
                tokenExpiresAt = Date.now() + (result.data.expiresIn * 1000);
            }
            
            console.log('[Netomi] Token generated successfully');
            console.log('[Netomi] Token:', netomiToken ? `${netomiToken.substring(0, 20)}...` : 'None');
            console.log('[Netomi] Expires at:', tokenExpiresAt ? new Date(tokenExpiresAt).toISOString() : 'Unknown');
            
            // Update debug panel if available
            updateTokenDisplay(result.data);
            
            return result.data;
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
    if (!netomiToken) return false;
    if (!tokenExpiresAt) return true; // Assume valid if no expiration
    return Date.now() < tokenExpiresAt;
}

/**
 * Get current valid token, generating a new one if needed
 * @returns {Promise<string>} Valid authentication token
 */
async function getValidToken() {
    if (isTokenValid()) {
        console.log('[Netomi] Using existing valid token');
        return netomiToken;
    }
    
    console.log('[Netomi] Token expired or missing, generating new one...');
    const tokenData = await generateNetomiToken();
    return tokenData.token || tokenData.access_token;
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
            if (tokenExpiresAt) {
                const expiryDate = new Date(tokenExpiresAt);
                const timeLeft = Math.round((tokenExpiresAt - Date.now()) / 1000 / 60); // minutes
                tokenExpiry.textContent = `${timeLeft}m (${expiryDate.toLocaleTimeString()})`;
            } else {
                tokenExpiry.textContent = 'No expiration';
            }
        }
    }
}

/**
 * Send a message to Netomi API
 * @param {string} message - User message
 * @param {Object} options - Additional options (conversationId, etc.)
 * @returns {Promise<Object>} Netomi API response
 */
async function sendToNetomi(message, options = {}) {
    try {
        const token = await getValidToken();
        
        const payload = {
            message: message,
            conversationId: options.conversationId || `chat-${Date.now()}`,
            ...options
        };
        
        console.log('[Netomi] Sending message:', message);
        
        const response = await fetch('/api/netomi/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || `HTTP ${response.status}`);
        }
        
        console.log('[Netomi] Response received:', result);
        return result;
        
    } catch (error) {
        console.error('[Netomi] Chat request failed:', error);
        throw error;
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

// Export functions for use in other scripts
window.NetomiIntegration = {
    generateToken: generateNetomiToken,
    getValidToken,
    isTokenValid,
    sendToNetomi,
    testConnection: testNetomiConnection,
    getCurrentToken: () => netomiToken,
    getTokenExpiry: () => tokenExpiresAt
};

// Auto-generate token when Netomi is enabled (if debug panel is available)
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for debug panel to initialize
    setTimeout(() => {
        if (window.isNetomiEnabled && window.isNetomiEnabled()) {
            console.log('[Netomi] Auto-generating token on page load...');
            generateNetomiToken().catch(error => {
                console.warn('[Netomi] Auto token generation failed:', error);
            });
        }
    }, 1000);
});

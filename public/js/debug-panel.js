// Debug Panel Functionality
let isNetomiEnabled = true;
let debugPanelLoaded = false;

// Load debug panel HTML
async function loadDebugPanel() {
    if (debugPanelLoaded) return;
    
    try {
        const response = await fetch('debug-panel.html');
        const html = await response.text();
        
        const container = document.getElementById('debugPanelContainer');
        if (container) {
            container.innerHTML = html;
            debugPanelLoaded = true;
            console.log('[Debug] Panel HTML loaded successfully');
            
            // Initialize event listeners after loading
            initializeDebugPanelEvents();
        }
    } catch (error) {
        console.error('[Debug] Failed to load debug panel HTML:', error);
    }
}

// Initialize debug panel event listeners
function initializeDebugPanelEvents() {
    const debugPanel = document.getElementById('debugPanel');
    const debugClose = document.getElementById('debugClose');
    const netomiToggle = document.getElementById('netomiToggle');
    
    if (!debugPanel || !debugClose || !netomiToggle) {
        console.error('[Debug] Debug panel elements not found after loading');
        return;
    }
    
    // Load saved settings
    const savedNetomiState = localStorage.getItem('netomiEnabled');
    if (savedNetomiState !== null) {
        isNetomiEnabled = savedNetomiState === 'true';
        netomiToggle.checked = isNetomiEnabled;
        updateDebugStatus();
    }
    
    // Close panel
    debugClose.addEventListener('click', function() {
        debugPanel.style.display = 'none';
    });
    
    // Click outside to close
    debugPanel.addEventListener('click', function(e) {
        if (e.target === debugPanel) {
            debugPanel.style.display = 'none';
        }
    });
    
    // Netomi toggle
    netomiToggle.addEventListener('change', function() {
        isNetomiEnabled = this.checked;
        localStorage.setItem('netomiEnabled', isNetomiEnabled.toString());
        updateDebugStatus();
        updateDebugInfo();
        
        // Generate token when enabling Netomi
        if (isNetomiEnabled && window.NetomiIntegration) {
            console.log('[Debug] Netomi enabled, generating token...');
            window.NetomiIntegration.generateToken().catch(error => {
                console.warn('[Debug] Auto token generation failed:', error);
            });
        }
        
        // Show feedback
        const statusText = document.querySelector('.status-text');
        const originalText = statusText.textContent;
        statusText.textContent = 'Updated!';
        setTimeout(() => {
            statusText.textContent = originalText;
        }, 1000);
    });
    
    // Test actions
    const testConnectionBtn = document.getElementById('testNetomiConnection');
    const clearHistoryBtn = document.getElementById('clearChatHistory');
    const resetSettingsBtn = document.getElementById('resetDebugSettings');
    
    if (testConnectionBtn) testConnectionBtn.addEventListener('click', testNetomiConnection);
    if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', clearChatHistory);
    if (resetSettingsBtn) resetSettingsBtn.addEventListener('click', resetDebugSettings);
    
    // Token actions (if buttons exist)
    const generateTokenButton = document.getElementById('generateTokenButton');
    const refreshTokenButton = document.getElementById('refreshTokenButton');
    
    if (generateTokenButton) {
        generateTokenButton.addEventListener('click', generateToken);
    }
    if (refreshTokenButton) {
        refreshTokenButton.addEventListener('click', refreshToken);
    }
}

// Initialize debug panel
document.addEventListener('DOMContentLoaded', function() {
    const debugButton = document.getElementById('debugButton');
    
    if (debugButton) {
        // Debug button click - load panel if needed and show it
        debugButton.addEventListener('click', async function() {
            await loadDebugPanel();
            
            const debugPanel = document.getElementById('debugPanel');
            if (debugPanel) {
                debugPanel.style.display = 'flex';
                updateDebugInfo();
            }
        });
    }
});

function updateDebugStatus() {
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.status-text');
    
    if (isNetomiEnabled) {
        statusIndicator.className = 'status-indicator active';
        statusText.textContent = 'Active';
    } else {
        statusIndicator.className = 'status-indicator inactive';
        statusText.textContent = 'Disabled';
    }
}

function updateDebugInfo() {
    document.getElementById('debugMode').textContent = isNetomiEnabled ? 'Production' : 'Development';
    document.getElementById('debugEndpoint').textContent = isNetomiEnabled ? 'Netomi API' : 'Mock Responses';
    document.getElementById('debugConnectionStatus').textContent = isNetomiEnabled ? 'Connected' : 'Offline';
}

async function testNetomiConnection() {
    const button = document.getElementById('testNetomiConnection');
    const originalText = button.textContent;
    button.textContent = 'Testing...';
    button.disabled = true;
    
    try {
        if (isNetomiEnabled) {
            // Test actual Netomi connection using NetomiIntegration
            if (window.NetomiIntegration) {
                const result = await window.NetomiIntegration.testConnection();
                
                if (result.success) {
                    button.textContent = '✅ Connected';
                    document.getElementById('debugConnectionStatus').textContent = 'Connected';
                } else {
                    button.textContent = '❌ Failed';
                    document.getElementById('debugConnectionStatus').textContent = 'Error';
                    console.error('[Debug] Connection test failed:', result.message);
                }
            } else {
                // Fallback to direct API call
                const response = await fetch('/api/netomi/generate-token');
                const data = await response.json();
                
                if (data.ok) {
                    button.textContent = '✅ Connected';
                    document.getElementById('debugConnectionStatus').textContent = 'Connected';
                } else {
                    button.textContent = '❌ Failed';
                    document.getElementById('debugConnectionStatus').textContent = 'Error';
                }
            }
        } else {
            // Mock test
            button.textContent = '✅ Mock Mode';
            document.getElementById('debugConnectionStatus').textContent = 'Mock';
        }
    } catch (error) {
        button.textContent = '❌ Error';
        document.getElementById('debugConnectionStatus').textContent = 'Error';
        console.error('[Debug] Connection test error:', error);
    }
    
    setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
    }, 2000);
}

function clearChatHistory() {
    if (confirm('Are you sure you want to clear the chat history?')) {
        const chatMessages = document.querySelector('.chat-messages');
        chatMessages.innerHTML = '';
        
        const button = document.getElementById('clearChatHistory');
        const originalText = button.textContent;
        button.textContent = '✅ Cleared';
        setTimeout(() => {
            button.textContent = originalText;
        }, 1000);
    }
}

function resetDebugSettings() {
    if (confirm('Reset all debug settings to default?')) {
        localStorage.removeItem('netomiEnabled');
        isNetomiEnabled = true;
        document.getElementById('netomiToggle').checked = true;
        updateDebugStatus();
        updateDebugInfo();
        
        const button = document.getElementById('resetDebugSettings');
        const originalText = button.textContent;
        button.textContent = '✅ Reset';
        setTimeout(() => {
            button.textContent = originalText;
        }, 1000);
    }
}

async function generateToken() {
    const button = document.getElementById('generateTokenButton');
    if (!button) return;
    
    const originalText = button.textContent;
    button.textContent = 'Generating...';
    button.disabled = true;
    
    try {
        if (window.NetomiIntegration) {
            await window.NetomiIntegration.generateToken();
            button.textContent = '✅ Generated';
        } else {
            throw new Error('NetomiIntegration not available');
        }
    } catch (error) {
        button.textContent = '❌ Failed';
        console.error('[Debug] Token generation failed:', error);
    }
    
    setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
    }, 2000);
}

async function refreshToken() {
    const button = document.getElementById('refreshTokenButton');
    if (!button) return;
    
    const originalText = button.textContent;
    button.textContent = 'Refreshing...';
    button.disabled = true;
    
    try {
        if (window.NetomiIntegration) {
            await window.NetomiIntegration.generateToken(); // Generate new token
            button.textContent = '✅ Refreshed';
        } else {
            throw new Error('NetomiIntegration not available');
        }
    } catch (error) {
        button.textContent = '❌ Failed';
        console.error('[Debug] Token refresh failed:', error);
    }
    
    setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
    }, 2000);
}

// Expose isNetomiEnabled for use in other scripts
window.isNetomiEnabled = () => isNetomiEnabled;

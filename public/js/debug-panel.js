// Debug Panel Functionality
let isNetomiEnabled = true;
let debugPanelLoaded = false;

// Global state management for Rexy integration
window.RexyGlobalState = {
    listeners: [],
    authToken: null,
    is3DEnabled: true,
    
    setNetomiEnabled(enabled) {
        const oldValue = isNetomiEnabled;
        isNetomiEnabled = enabled;
        
        // Save to localStorage
        localStorage.setItem('netomiEnabled', enabled.toString());
        
        // Update debug panel UI
        updateDebugStatus();
        
        // Notify all listeners if value changed
        if (oldValue !== enabled) {
            console.log(`[GlobalState] Netomi integration ${enabled ? 'ENABLED' : 'DISABLED'}`);
            this.listeners.forEach(listener => {
                try {
                    listener(enabled);
                } catch (error) {
                    console.error('[GlobalState] Listener error:', error);
                }
            });
        }
    },
    set3DEnabled(enabled) {
        this.is3DEnabled = enabled;
        try { localStorage.setItem('rexy3DEnabled', enabled ? 'true' : 'false'); } catch {}
        console.log(`[GlobalState] 3D overlay ${enabled ? 'ENABLED' : 'DISABLED'}`);
    },
    is3DOn() {
        return this.is3DEnabled === true;
    },
    
    isNetomiEnabled() {
        return isNetomiEnabled;
    },
    
    setAuthToken(token) {
        this.authToken = token;
        console.log(`[GlobalState] Auth token ${token ? 'stored' : 'cleared'}`);
    },
    
    getAuthToken() {
        return this.authToken;
    },
    
    addListener(callback) {
        this.listeners.push(callback);
        console.log(`[GlobalState] Added listener, total: ${this.listeners.length}`);
    },
    
    initialize() {
        console.log('[GlobalState] Initialized');
        // Load saved state
        const savedState = localStorage.getItem('netomiEnabled');
        if (savedState !== null) {
            isNetomiEnabled = savedState === 'true';
        }
        const saved3D = localStorage.getItem('rexy3DEnabled');
        if (saved3D !== null) {
            this.is3DEnabled = saved3D === 'true';
        }
    }
};

// Initialize global state immediately
window.RexyGlobalState.initialize();
console.log('[DebugPanel] ✅ RexyGlobalState initialized and available globally');

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
    const rexy3DToggle = document.getElementById('rexy3DToggle');
    
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
    const saved3DState = localStorage.getItem('rexy3DEnabled');
    if (rexy3DToggle) {
        rexy3DToggle.checked = saved3DState !== null ? (saved3DState === 'true') : window.RexyGlobalState.is3DOn();
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
        window.RexyGlobalState.setNetomiEnabled(this.checked);
        if (this.checked && window.NetomiIntegration) {
            window.NetomiIntegration.generateToken().catch(() => {});
        }
    });

    if (rexy3DToggle) {
        rexy3DToggle.addEventListener('change', function() {
            window.RexyGlobalState.set3DEnabled(this.checked);
        });
    }
    
    // No other actions; panel is minimal by design now
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

function updateDebugStatus() {}

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

// Animation Manager for Rexy Interface
// Handles all animation logic including 3D overlays and timing

// ===== ANIMATION CONFIGURATION CONSTANTS =====
const ANIMATION_CONFIG = {
    // 3D Thinking Animation Settings
    THINKING_ANIMATION_PROBABILITY: 0.5,           // 50% chance to show animation
    THINKING_ANIMATION_DELAY_MS: 5000,             // 5 seconds delay before showing overlay
    THINKING_OVERLAY_FADE_OUT_MS: 300,             // 300ms fade-out duration
    THINKING_OVERLAY_FADE_IN_MS: 10,               // 10ms fade-in delay
    MINIMUM_CHATS_FOR_ANIMATION: 4,                // Require 3+ user messages before showing animations
    
    // Element IDs and Selectors
    TYPING_INDICATOR_ID: 'typingIndicator',
    THINKING_OVERLAY_ID: 'rexy-3d-overlay',
    
    // Animation Asset Paths
    WELCOME_ANIMATION_PATH: 'image/3d/Rexy_Welcome.gif',
    FALLBACK_STICKER_PATH: 'image/stickers/hi.gif',
    
    // Available Thinking Animations
    THINKING_ANIMATIONS: [
        'Rexy_Thinking',
        'Rexy_Receivephoto', 
        'Rexy_Searching'
    ]
};

class AnimationManager {
    constructor() {
        this.userChatCount = 0;
        this.thinkingAnimationStartTime = null;
        this.thinkingAnimationTimeout = null;
        
        console.log('[AnimationManager] Initialized');
    }

    // ===== Chat Count Management =====
    
    /**
     * Increment user chat count for animation logic
     */
    incrementChatCount() {
        this.userChatCount++;
        console.log(`[AnimationManager] User chat count: ${this.userChatCount}`);
        return this.userChatCount;
    }

    /**
     * Get current chat count
     */
    getChatCount() {
        return this.userChatCount;
    }

    /**
     * Reset chat count
     */
    resetChatCount() {
        this.userChatCount = 0;
        console.log('[AnimationManager] Chat count reset to 0');
    }

    // Walking Rexy animations have been deprecated and removed

    // ===== 3D Thinking Animations =====
    
    /**
     * Randomly select a waiting animation from available options
     * @returns {string} Animation name
     */
    getRandomWaitingAnimation() {
        const animations = ANIMATION_CONFIG.THINKING_ANIMATIONS;
        const randomIndex = Math.floor(Math.random() * animations.length);
        const selectedAnimation = animations[randomIndex];
        console.log(`[AnimationManager] Selected random waiting animation: ${selectedAnimation}`);
        return selectedAnimation;
    }

    /**
     * Start thinking animation logic when typing indicator is added
     * Includes chat count and probability logic
     */
    startThinkingAnimation() {
        // Track start time for response timing
        this.thinkingAnimationStartTime = Date.now();
        
        // Show full-screen 3D thinking overlay after configured delay (3D animations always enabled)
        // Only show 3D animation if user has sent minimum required messages
        if (this.userChatCount >= ANIMATION_CONFIG.MINIMUM_CHATS_FOR_ANIMATION) {
            // Show animation based on configured probability
            const showAnimation = Math.random() < ANIMATION_CONFIG.THINKING_ANIMATION_PROBABILITY;
            console.log(`[AnimationManager] 3D Animation decision: userChatCount=${this.userChatCount}, showAnimation=${showAnimation}`);
            
            if (showAnimation) {
                this.thinkingAnimationTimeout = setTimeout(() => {
                    // Only show if typing indicator still exists (response hasn't arrived yet)
                    if (document.getElementById(ANIMATION_CONFIG.TYPING_INDICATOR_ID)) {
                        this.showThinkingOverlay();
                    }
                }, ANIMATION_CONFIG.THINKING_ANIMATION_DELAY_MS);
            } else {
                console.log(`[AnimationManager] 3D Animation skipped due to ${Math.round(ANIMATION_CONFIG.THINKING_ANIMATION_PROBABILITY * 100)}% probability`);
            }
        } else {
            console.log(`[AnimationManager] 3D Animation skipped - need ${ANIMATION_CONFIG.MINIMUM_CHATS_FOR_ANIMATION}+ chats (current: ${this.userChatCount})`);
        }
    }

    /**
     * Stop thinking animation when response is received
     */
    stopThinkingAnimation() {
        // Clear the thinking animation timeout if response came back quickly
        if (this.thinkingAnimationTimeout) {
            clearTimeout(this.thinkingAnimationTimeout);
            this.thinkingAnimationTimeout = null;
        }
        
        // Calculate response time for debugging
        if (this.thinkingAnimationStartTime) {
            const responseTime = Date.now() - this.thinkingAnimationStartTime;
            console.log(`[AnimationManager] Response received in ${responseTime}ms`);
            this.thinkingAnimationStartTime = null;
        }
        
        // Hide full-screen 3D thinking overlay when typing indicator is removed
        this.hideThinkingOverlay();
    }

    /**
     * Show thinking Rexy animation overlay inside chat area
     * @param {HTMLElement} chatMessages - Chat messages container
     */
    addThinkingRexy(chatMessages) {
        if (document.getElementById('thinking-rexy')) return;
        const animationName = this.getRandomWaitingAnimation();
        const thinking = document.createElement('img');
        thinking.src = `image/3d/${animationName}.gif`;
        thinking.alt = 'Rexy waiting';
        thinking.className = 'thinking-rexy';
        thinking.id = 'thinking-rexy';
        chatMessages.appendChild(thinking);
    }

    /**
     * Remove thinking Rexy animation from chat area
     */
    removeThinkingRexy() {
        const el = document.getElementById('thinking-rexy');
        if (el && el.parentNode) {
            el.parentNode.removeChild(el);
        }
    }

    /**
     * Show full-screen thinking overlay (persistent until explicitly hidden)
     */
    showThinkingOverlay() {
        if (document.getElementById(ANIMATION_CONFIG.THINKING_OVERLAY_ID)) return; // already showing
        const overlay = document.createElement('div');
        overlay.className = 'rexy-3d-overlay';
        overlay.id = ANIMATION_CONFIG.THINKING_OVERLAY_ID;

        // Get random waiting animation
        const animationName = this.getRandomWaitingAnimation();
        
        // Try to use preloaded animation if available
        const cached = window.AssetPreloader && window.AssetPreloader.getAnimation(animationName);
        const gif = document.createElement('img');
        gif.className = 'rexy-3d-gif';
        gif.alt = 'Rexy Waiting';
        gif.src = cached ? cached.src : `image/3d/${animationName}.gif`;
        gif.onerror = () => {
            // If loading fails, remove overlay
            this.hideThinkingOverlay();
        };

        overlay.appendChild(gif);
        document.body.appendChild(overlay);
        // fade-in
        setTimeout(() => overlay.classList.add('show'), ANIMATION_CONFIG.THINKING_OVERLAY_FADE_IN_MS);
    }

    /**
     * Hide full-screen thinking overlay
     */
    hideThinkingOverlay() {
        const overlay = document.getElementById(ANIMATION_CONFIG.THINKING_OVERLAY_ID);
        if (!overlay) return;
        overlay.classList.remove('show');
        setTimeout(() => {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, ANIMATION_CONFIG.THINKING_OVERLAY_FADE_OUT_MS);
    }

    // ===== Welcome Animation =====
    
    /**
     * Show welcome animation
     * @param {HTMLElement} messageContent - Message content container
     */
    showWelcomeAnimation(messageContent) {
        // Try to get cached welcome animation first
        const cachedWelcome = window.AssetPreloader && window.AssetPreloader.getAnimation('Rexy_Welcome');
        
        const welcomeImg = document.createElement('img');
        
        if (cachedWelcome) {
            // Use cached image
            welcomeImg.src = cachedWelcome.src;
            console.log('[AnimationManager] 🚀 Using cached welcome animation');
        } else {
            // Fallback to loading image normally
            welcomeImg.src = ANIMATION_CONFIG.WELCOME_ANIMATION_PATH;
            console.log('[AnimationManager] ⏳ Loading welcome animation from server');
        }
        
        welcomeImg.alt = 'Rexy Welcome';
        welcomeImg.className = 'welcome-gif';
        welcomeImg.onerror = function() {
            // If welcome GIF doesn't exist, fallback to hi sticker
            console.warn('[AnimationManager] Welcome GIF not found, falling back to hi sticker');
            welcomeImg.src = ANIMATION_CONFIG.FALLBACK_STICKER_PATH;
            welcomeImg.className = 'sticker';
        };
        
        messageContent.appendChild(welcomeImg);
    }

    // ===== Utility Methods =====
    
    /**
     * Get animation statistics for debugging
     */
    getStats() {
        return {
            userChatCount: this.userChatCount,
            isThinkingActive: !!this.thinkingAnimationTimeout,
            thinkingStartTime: this.thinkingAnimationStartTime
        };
    }

    /**
     * Force show thinking overlay (for testing)
     */
    forceShowThinkingOverlay() {
        this.showThinkingOverlay();
    }

    /**
     * Force hide thinking overlay (for testing)
     */
    forceHideThinkingOverlay() {
        this.hideThinkingOverlay();
    }
}

// Create global instance
window.AnimationManager = new AnimationManager();

// Export for module use if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimationManager;
}

console.log('[AnimationManager] ✅ Animation Manager loaded and ready');

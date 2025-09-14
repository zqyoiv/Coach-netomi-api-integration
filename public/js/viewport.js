// Mobile Viewport Handler for Dynamic Browser UI
// Handles Safari and Chrome mobile browser bar visibility changes

let viewport = {
    height: 0,
    isInitialized: false
};

function initializeViewport() {
    // Set initial viewport height
    updateViewportHeight();
    
    // Listen for viewport changes
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // iOS Safari specific handling
    if (isiOS()) {
        document.addEventListener('touchstart', handleiOSTouch, { passive: true });
        window.addEventListener('scroll', preventScroll, { passive: false });
    }
    
    viewport.isInitialized = true;
}

function updateViewportHeight() {
    // Get the actual viewport height
    const vh = window.innerHeight;
    const documentHeight = document.documentElement.clientHeight;
    
    // Use the smaller of the two (more accurate for mobile)
    viewport.height = Math.min(vh, documentHeight);
    
    // Set CSS custom property for dynamic viewport height
    document.documentElement.style.setProperty('--vh', `${viewport.height * 0.01}px`);
    
    // Update chat container height directly
    const chatContainer = document.querySelector('.chat-container');
    if (chatContainer) {
        chatContainer.style.height = `${viewport.height}px`;
    }
}

function handleViewportChange() {
    // Debounce rapid resize events
    clearTimeout(viewport.resizeTimer);
    viewport.resizeTimer = setTimeout(() => {
        updateViewportHeight();
        repositionElements();
    }, 100);
}

function handleOrientationChange() {
    // Delay to allow browser to complete orientation change
    setTimeout(() => {
        updateViewportHeight();
        repositionElements();
    }, 500);
}

function repositionElements() {
    const chatContainer = document.querySelector('.chat-container');
    const header = document.querySelector('.chat-header');
    const inputContainer = document.querySelector('.chat-input-container');
    const messagesArea = document.querySelector('.chat-messages');
    
    if (!chatContainer) return;
    
    // Ensure header stays at top
    if (header) {
        header.style.position = 'sticky';
        header.style.top = '0';
        header.style.zIndex = '100';
    }
    
    // Ensure input area stays at bottom
    if (inputContainer) {
        inputContainer.style.position = 'sticky';
        inputContainer.style.bottom = '0';
        inputContainer.style.zIndex = '100';
    }
    
    // Adjust messages area to fill remaining space
    if (messagesArea && header && inputContainer) {
        const headerHeight = header.offsetHeight;
        const inputHeight = inputContainer.offsetHeight;
        const availableHeight = viewport.height - headerHeight - inputHeight;
        
        messagesArea.style.height = `${availableHeight}px`;
        messagesArea.style.maxHeight = `${availableHeight}px`;
    }
}

function handleiOSTouch(e) {
    // Prevent iOS Safari from bouncing when scrolling
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}

function preventScroll(e) {
    // Prevent document scrolling on iOS Safari
    if (e.target === document || e.target === document.body) {
        e.preventDefault();
    }
}

function isiOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function isAndroid() {
    return /Android/.test(navigator.userAgent);
}

function isMobile() {
    return isiOS() || isAndroid() || window.innerWidth <= 768;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeViewport);
} else {
    initializeViewport();
}

// Export for manual initialization if needed
window.ViewportHandler = {
    init: initializeViewport,
    update: updateViewportHeight,
    reposition: repositionElements,
    isMobile: isMobile
};

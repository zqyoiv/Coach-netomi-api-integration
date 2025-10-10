import { useState, useCallback, useRef } from 'react';

const useAnimationManager = () => {
  const [isThinkingAnimationActive, setIsThinkingAnimationActive] = useState(false);
  const [isWatchReelActive, setIsWatchReelActive] = useState(false);
  const [isThinkingInChat, setIsThinkingInChat] = useState(false);
  const thinkingTimeoutRef = useRef(null);
  const watchReelTimeoutRef = useRef(null);

  const ANIMATION_CONFIG = {
    THINKING_ANIMATION_PROBABILITY: 0.5,
    THINKING_ANIMATION_DELAY_MS: 3000,
    THINKING_OVERLAY_FADE_OUT_MS: 300,
    WATCH_REEL_PROBABILITY: 0.2,
    WATCH_REEL_DURATION_MS: 5000,
    WATCH_REEL_FADE_OUT_MS: 300,
    MINIMUM_CHATS_FOR_ANIMATION: 3,
    THINKING_ANIMATIONS: [
      'Rexy_Thinking',
      'Rexy_Receivephoto', 
      'Rexy_Searching'
    ]
  };

  const renderWelcomeAnimation = useCallback(() => {
    return (
      <img 
        src="/image/3d/Rexy_Welcome.gif" 
        alt="Rexy Welcome"
        className="welcome-gif"
      />
    );
  }, []);

  const showThinkingAnimationIfNeeded = useCallback((messageCount) => {
    // Only show animation if we have enough messages
    if (messageCount < ANIMATION_CONFIG.MINIMUM_CHATS_FOR_ANIMATION) {
      return;
    }

    // Random chance to show animation
    if (Math.random() > ANIMATION_CONFIG.THINKING_ANIMATION_PROBABILITY) {
      return;
    }

    // Clear any existing timeout
    if (thinkingTimeoutRef.current) {
      clearTimeout(thinkingTimeoutRef.current);
    }

    // Set delay before showing animation
    thinkingTimeoutRef.current = setTimeout(() => {
      setIsThinkingAnimationActive(true);
      
      // Auto-hide after a random duration
      const duration = 2000 + Math.random() * 3000; // 2-5 seconds
      setTimeout(() => {
        setIsThinkingAnimationActive(false);
      }, duration);
    }, ANIMATION_CONFIG.THINKING_ANIMATION_DELAY_MS);
  }, []);

  const showWatchReelAnimation = useCallback(() => {
    if (Math.random() > ANIMATION_CONFIG.WATCH_REEL_PROBABILITY) {
      return;
    }

    setIsWatchReelActive(true);
    
    // Auto-hide after duration
    watchReelTimeoutRef.current = setTimeout(() => {
      setIsWatchReelActive(false);
    }, ANIMATION_CONFIG.WATCH_REEL_DURATION_MS);
  }, []);

  const showThinkingInChat = useCallback(() => {
    setIsThinkingInChat(true);
  }, []);

  const hideThinkingInChat = useCallback(() => {
    setIsThinkingInChat(false);
  }, []);

  const renderThinkingOverlay = useCallback(() => {
    if (!isThinkingAnimationActive) return null;

    const randomAnimation = ANIMATION_CONFIG.THINKING_ANIMATIONS[
      Math.floor(Math.random() * ANIMATION_CONFIG.THINKING_ANIMATIONS.length)
    ];

    return (
      <div className="rexy-3d-overlay show">
        <img 
          src={`/image/3d/${randomAnimation}.gif`}
          alt="Rexy Thinking"
          className="rexy-3d-gif"
        />
      </div>
    );
  }, [isThinkingAnimationActive]);

  const renderWatchReelOverlay = useCallback(() => {
    if (!isWatchReelActive) return null;

    return (
      <img 
        src="/image/3d/Rexy_Watchreel.gif"
        alt="Rexy Watch Reel"
        className="rexy-watch-reel"
      />
    );
  }, [isWatchReelActive]);

  const renderThinkingInChat = useCallback(() => {
    if (!isThinkingInChat) return null;

    return (
      <img 
        src="/image/3d/Rexy_Thinking.gif"
        alt="Rexy Thinking"
        className="thinking-rexy"
      />
    );
  }, [isThinkingInChat]);

  // Cleanup timeouts on unmount
  const cleanup = useCallback(() => {
    if (thinkingTimeoutRef.current) {
      clearTimeout(thinkingTimeoutRef.current);
    }
    if (watchReelTimeoutRef.current) {
      clearTimeout(watchReelTimeoutRef.current);
    }
  }, []);

  return {
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
  };
};

export { useAnimationManager };

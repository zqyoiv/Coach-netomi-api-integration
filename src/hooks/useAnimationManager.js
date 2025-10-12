import { useState, useCallback, useRef } from 'react';
import debug from '../utils/debug';

const useAnimationManager = () => {
  const [isThinkingAnimationActive, setIsThinkingAnimationActive] = useState(false);
  const [isWatchReelActive, setIsWatchReelActive] = useState(false);
  const [selectedThinkingAnimation, setSelectedThinkingAnimation] = useState(null);
  const userChatCountRef = useRef(0);
  const thinkingTimeoutRef = useRef(null);
  const watchReelTimeoutRef = useRef(null);
  const thinkingStartTimeRef = useRef(null);

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

  // Start thinking animation (matching vanilla JS logic)
  const startThinkingAnimation = useCallback(() => {
    // Track start time for response timing
    thinkingStartTimeRef.current = Date.now();
    
    // Increment user chat count
    userChatCountRef.current += 1;
    
    // Only show 3D animation if user has sent minimum required messages
    if (userChatCountRef.current >= ANIMATION_CONFIG.MINIMUM_CHATS_FOR_ANIMATION) {
      // Show animation based on configured probability
      const showAnimation = Math.random() < ANIMATION_CONFIG.THINKING_ANIMATION_PROBABILITY;
      debug.log(`[AnimationManager] 3D Animation decision: userChatCount=${userChatCountRef.current}, showAnimation=${showAnimation}`);
      
      if (showAnimation) {
        // Clear any existing timeout
        if (thinkingTimeoutRef.current) {
          clearTimeout(thinkingTimeoutRef.current);
        }
        
        // Set delay before showing animation
        thinkingTimeoutRef.current = setTimeout(() => {
          // Pick ONE random animation for this waiting session (matching vanilla JS)
          const randomAnimation = ANIMATION_CONFIG.THINKING_ANIMATIONS[
            Math.floor(Math.random() * ANIMATION_CONFIG.THINKING_ANIMATIONS.length)
          ];
          debug.log(`[AnimationManager] Selected animation for this session: ${randomAnimation}`);
          setSelectedThinkingAnimation(randomAnimation);
          setIsThinkingAnimationActive(true);
        }, ANIMATION_CONFIG.THINKING_ANIMATION_DELAY_MS);
      } else {
        debug.log(`[AnimationManager] 3D Animation skipped due to ${Math.round(ANIMATION_CONFIG.THINKING_ANIMATION_PROBABILITY * 100)}% probability`);
      }
    } else {
      debug.log(`[AnimationManager] 3D Animation skipped - need ${ANIMATION_CONFIG.MINIMUM_CHATS_FOR_ANIMATION}+ chats (current: ${userChatCountRef.current})`);
    }
  }, []);

  // Stop thinking animation when response is received (matching vanilla JS)
  const stopThinkingAnimation = useCallback(() => {
    // Clear the thinking animation timeout if response came back quickly
    if (thinkingTimeoutRef.current) {
      clearTimeout(thinkingTimeoutRef.current);
      thinkingTimeoutRef.current = null;
    }
    
    // Calculate response time for debugging
    if (thinkingStartTimeRef.current) {
      const responseTime = Date.now() - thinkingStartTimeRef.current;
      debug.log(`[AnimationManager] Response received in ${responseTime}ms`);
      thinkingStartTimeRef.current = null;
    }
    
    // Hide fullscreen thinking overlay
    setIsThinkingAnimationActive(false);
    // Clear the selected animation for next session
    setSelectedThinkingAnimation(null);
  }, []);

  const showWatchReelAnimation = useCallback(() => {
    const randomValue = Math.random();
    const showWatchReel = randomValue < ANIMATION_CONFIG.WATCH_REEL_PROBABILITY;
    
    debug.log(`[AnimationManager] Watch reel probability check: ${randomValue} < ${ANIMATION_CONFIG.WATCH_REEL_PROBABILITY} = ${showWatchReel}`);
    
    if (!showWatchReel) {
      debug.log(`[AnimationManager] Watch reel skipped due to ${Math.round(ANIMATION_CONFIG.WATCH_REEL_PROBABILITY * 100)}% probability`);
      return;
    }

    debug.log(`[AnimationManager] Watch reel will show!`);
    setIsWatchReelActive(true);
    
    // Auto-hide after duration
    watchReelTimeoutRef.current = setTimeout(() => {
      debug.log('[AnimationManager] Watch reel fading out after 5 seconds');
      setIsWatchReelActive(false);
    }, ANIMATION_CONFIG.WATCH_REEL_DURATION_MS);
  }, []);

  // Render fullscreen thinking overlay (matching vanilla JS)
  const renderThinkingOverlay = useCallback(() => {
    if (!isThinkingAnimationActive || !selectedThinkingAnimation) return null;

    // Use the ONE selected animation for this entire waiting session
    return (
      <div className="rexy-3d-overlay show">
        <img 
          src={`/image/3d/${selectedThinkingAnimation}.gif`}
          alt="Rexy Thinking"
          className="rexy-3d-gif"
        />
      </div>
    );
  }, [isThinkingAnimationActive, selectedThinkingAnimation]);

  // Render watch reel overlay in bottom right (matching vanilla JS)
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
    renderWelcomeAnimation,
    startThinkingAnimation,
    stopThinkingAnimation,
    showWatchReelAnimation,
    renderThinkingOverlay,
    renderWatchReelOverlay,
    cleanup
  };
};

export { useAnimationManager };

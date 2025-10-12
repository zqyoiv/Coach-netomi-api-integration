import { useState, useEffect, useCallback, useRef } from 'react';
import debug from '../utils/debug';
import RexyWelcome from '../assets/3d/Rexy_Welcome.gif';
import RexyWatchReel from '../assets/3d/Rexy_watchReel.gif';
import RexyCheck from '../assets/3d/Rexy_Check.gif';
import RexyReceivePhoto from '../assets/3d/Rexy_Receivephoto.gif';
import RexySearching from '../assets/3d/Rexy_searching.gif';
import RexyThinking from '../assets/3d/Rexy_Thinking.gif';

/**
 * Asset Preloader Hook for 3D Animations
 * Preloads 3D animation images to ensure instant display when called
 */
export const useAssetPreloader = () => {
  const [isWelcomeReady, setIsWelcomeReady] = useState(false);
  const [isAllReady, setIsAllReady] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const cacheRef = useRef(new Map());

  // Load a single image and return promise
  const loadImage = useCallback((src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        resolve(img);
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      // Start loading
      img.src = src;
    });
  }, []);

  // Initialize preloading
  useEffect(() => {
    const init = async () => {
      // Animation imports (already imported at top)
      const animations = {
        'Rexy_Welcome': RexyWelcome,
        'Rexy_Watchreel': RexyWatchReel,
        'Rexy_Check': RexyCheck,
        'Rexy_Receivephoto': RexyReceivePhoto,
        'Rexy_Searching': RexySearching,
        'Rexy_Thinking': RexyThinking
      };
      
      setTotalCount(Object.keys(animations).length);
      
      try {
        debug.log('🎬 Preloading welcome animation first...');
        // Preload welcome first
        const welcomeImg = await loadImage(RexyWelcome);
        cacheRef.current.set('Rexy_Welcome', welcomeImg);
        setLoadedCount(1);
        debug.log('✅ Welcome animation preloaded!');
        setIsWelcomeReady(true);
        
        debug.log('📦 Preloading other animations...');
        // Preload the rest
        let loaded = 1;
        for (const [name, src] of Object.entries(animations)) {
          if (name === 'Rexy_Welcome') continue; // Already loaded
          try {
            const img = await loadImage(src);
            cacheRef.current.set(name, img);
            loaded++;
            setLoadedCount(loaded);
            debug.log(`📦 Loaded: ${name}`);
          } catch (error) {
            debug.warn(`Failed to preload animation: ${name}`, error);
          }
        }
        
        debug.log('✅ All 3D animations preloaded successfully!');
        setIsAllReady(true);
      } catch (error) {
        debug.warn('⚠️ Some assets failed to preload:', error);
      }
    };

    init();
  }, [loadImage]);

  // Get cached animation
  const getAnimation = useCallback((name) => {
    return cacheRef.current.get(name);
  }, []);

  // Check if animation is cached
  const isAnimationCached = useCallback((name) => {
    return cacheRef.current.has(name);
  }, []);

  // Get cache status
  const getCacheStatus = useCallback(() => {
    return {
      animations: cacheRef.current.size,
      loaded: loadedCount,
      totalAssets: totalCount
    };
  }, [loadedCount, totalCount]);

  return {
    isWelcomeReady,
    isAllReady,
    loadedCount,
    totalCount,
    getAnimation,
    isAnimationCached,
    getCacheStatus
  };
};


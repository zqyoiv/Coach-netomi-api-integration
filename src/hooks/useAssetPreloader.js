import { useState, useEffect, useCallback, useRef } from 'react';

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

  // Preload animation GIFs
  const preloadAnimations = useCallback(async (animationNames) => {
    const promises = animationNames.map(async (name) => {
      try {
        const img = await loadImage(`/image/3d/${name}`);
        cacheRef.current.set(name.replace('.gif', ''), img);
        setLoadedCount(prev => prev + 1);
        console.log(`📦 Loaded: ${name}`);
      } catch (error) {
        console.warn(`Failed to preload animation: ${name}`, error);
      }
    });

    return Promise.allSettled(promises);
  }, [loadImage]);

  // Initialize preloading
  useEffect(() => {
    const init = async () => {
      // Define welcome animation first (highest priority)
      const welcomeAnimation = ['Rexy_Welcome.gif'];
      
      // Define other 3D animations to preload after welcome
      const otherAnimations = [
        'Rexy_Watchreel.gif',
        'Rexy_Check.gif',
        'Rexy_Receivephoto.gif',
        'Rexy_Searching.gif',
        'Rexy_Thinking.gif',
      ];

      // Set total count
      const total = welcomeAnimation.length + otherAnimations.length;
      setTotalCount(total);
      
      try {
        // First, load welcome animation with highest priority
        console.log('🎬 Preloading welcome animation first...');
        await preloadAnimations(welcomeAnimation);
        console.log('✅ Welcome animation preloaded!');
        setIsWelcomeReady(true);
        
        // Then load other animations
        console.log('📦 Preloading other animations...');
        await preloadAnimations(otherAnimations);
        console.log('✅ All 3D animations preloaded successfully!');
        setIsAllReady(true);
      } catch (error) {
        console.warn('⚠️ Some assets failed to preload:', error);
      }
    };

    init();
  }, [preloadAnimations]);

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


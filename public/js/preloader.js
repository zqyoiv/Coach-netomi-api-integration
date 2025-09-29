// Asset Preloader for 3D Animations
// Preloads 3D animation images to ensure instant display when called

class AssetPreloader {
    constructor() {
        this.cache = {
            animations: new Map()
        };
        this.loadedCount = 0;
        this.totalCount = 0;
        this.onProgress = null;
        this.onComplete = null;
    }

    // Initialize preloading
    async init() {        
         // Define 3D animations to preload
         const animations = [
            'Rexy_Check.gif',
            'Rexy_Receivephoto.gif',
            'Rexy_Searching.gif',
            'Rexy_Thinking.gif',
            // 'Rexy_Walk.gif', // Deprecated - walking animation removed
            'Rexy_Watchreel.gif',
            'Rexy_Welcome.gif'
        ];

        // Calculate total assets
        this.totalCount = animations.length;
        
        // Start preloading 3D animations
        const promises = [
            this.preloadAnimations(animations)
        ];

        try {
            await Promise.all(promises);
            console.log('✅ All 3D animations preloaded successfully!');
            if (this.onComplete) this.onComplete();
        } catch (error) {
            console.warn('⚠️ Some assets failed to preload:', error);
        }
    }


    // Preload 3D animation GIFs
    async preloadAnimations(animationNames) {
        const promises = animationNames.map(async (name) => {
            try {
                const img = await this.loadImage(`image/3d/${name}`);
                this.cache.animations.set(name.replace('.gif', ''), img);
                this.onAssetLoaded(`Animation: ${name}`);
            } catch (error) {
                console.warn(`Failed to preload animation: ${name}`, error);
            }
        });

        return Promise.allSettled(promises);
    }


    // Load a single image and return promise
    loadImage(src) {
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
    }

    // Handle individual asset loading
    onAssetLoaded(assetName) {
        this.loadedCount++;
        console.log(`📦 Loaded (${this.loadedCount}/${this.totalCount}): ${assetName}`);
        
        if (this.onProgress) {
            this.onProgress(this.loadedCount, this.totalCount);
        }
    }

    // Get cached animation
    getAnimation(name) {
        return this.cache.animations.get(name);
    }

    // Check if animation is cached
    isAnimationCached(name) {
        return this.cache.animations.has(name);
    }

    // Get cache status
    getCacheStatus() {
        return {
            animations: this.cache.animations.size,
            loaded: this.loadedCount,
            totalAssets: this.totalCount
        };
    }

    // Add progress callback
    setProgressCallback(callback) {
        this.onProgress = callback;
    }

    // Add completion callback
    setCompleteCallback(callback) {
        this.onComplete = callback;
    }
}

// Create global preloader instance
window.AssetPreloader = new AssetPreloader();

// Auto-start preloading when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.AssetPreloader.init();
    });
} else {
    window.AssetPreloader.init();
}

// Asset Preloader for Stickers and 3D Animations
// Preloads all images to ensure instant display when called

class AssetPreloader {
    constructor() {
        this.cache = {
            stickers: new Map(),
            animations: new Map(),
            photos: new Map()
        };
        this.loadedCount = 0;
        this.totalCount = 0;
        this.onProgress = null;
        this.onComplete = null;
    }

    // Initialize preloading
    async init() {        
         // Define all assets to preload
         const assets = {
             stickers: [
                 'drink.gif',
                 'hi.gif',
                 'igotu.gif',
                 'ok.gif',
                 'really.gif'
             ],
             animations: [
                 'Rexy_Check.gif',
                 'Rexy_Receivephoto.gif',
                 'Rexy_Searching.gif',
                 'Rexy_Thinking.gif',
                 'Rexy_Walk.gif',
                 'Rexy_Watchreel.gif'
             ],
            photos: [
                'photo1.png',
                'photo2.png',
                'photo3.png'
            ]
        };

        // Calculate total assets
        this.totalCount = Object.values(assets).reduce((sum, arr) => sum + arr.length, 0);
        
        // Start preloading all asset types
        const promises = [
            this.preloadStickers(assets.stickers),
            this.preloadAnimations(assets.animations),
            this.preloadPhotos(assets.photos)
        ];

        try {
            await Promise.all(promises);
            console.log('✅ All assets preloaded successfully!');
            if (this.onComplete) this.onComplete();
        } catch (error) {
            console.warn('⚠️ Some assets failed to preload:', error);
        }
    }

    // Preload sticker GIFs
    async preloadStickers(stickerNames) {
        const promises = stickerNames.map(async (name) => {
            try {
                const img = await this.loadImage(`image/stickers/${name}`);
                this.cache.stickers.set(name.replace('.gif', ''), img);
                this.onAssetLoaded(`Sticker: ${name}`);
            } catch (error) {
                console.warn(`Failed to preload sticker: ${name}`, error);
            }
        });

        return Promise.allSettled(promises);
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

    // Preload example photos
    async preloadPhotos(photoNames) {
        const promises = photoNames.map(async (name) => {
            try {
                const img = await this.loadImage(`image/example-photo/${name}`);
                this.cache.photos.set(name.replace('.png', ''), img);
                this.onAssetLoaded(`Photo: ${name}`);
            } catch (error) {
                console.warn(`Failed to preload photo: ${name}`, error);
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

    // Get cached sticker
    getSticker(name) {
        return this.cache.stickers.get(name);
    }

    // Get cached animation
    getAnimation(name) {
        return this.cache.animations.get(name);
    }

    // Get cached photo
    getPhoto(name) {
        return this.cache.photos.get(name);
    }

    // Check if asset is cached
    isStickerCached(name) {
        return this.cache.stickers.has(name);
    }

    isAnimationCached(name) {
        return this.cache.animations.has(name);
    }

    isPhotoCached(name) {
        return this.cache.photos.has(name);
    }

    // Get cache status
    getCacheStatus() {
        return {
            stickers: this.cache.stickers.size,
            animations: this.cache.animations.size,
            photos: this.cache.photos.size,
            total: this.cache.stickers.size + this.cache.animations.size + this.cache.photos.size,
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

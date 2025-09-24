// Testing assets functionality for stickers and 3D animations

// Function to check if message is a sticker command
function isStickerCommand(text) {
    return text.startsWith('s-') && text.length > 2;
}

// Function to check if message is a 3D command
function is3DCommand(text) {
    return text.startsWith('3d-') && text.length > 3;
}


// Function to get sticker name from command
function getStickerName(text) {
    return text.substring(2); // Remove 's-' prefix
}

// Function to get 3D animation name from command
function get3DName(text) {
    return text.substring(3); // Remove '3d-' prefix
}

// Function to send sticker message
function sendStickerMessage(stickerName, chatMessages) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    // Try to get cached sticker first
    const cachedSticker = window.AssetPreloader && window.AssetPreloader.getSticker(stickerName);
    
    const stickerImg = document.createElement('img');
    
    if (cachedSticker) {
        // Use cached image
        stickerImg.src = cachedSticker.src;
        console.log(`🚀 Using cached sticker: ${stickerName}`);
    } else {
        // Fallback to loading image normally
        stickerImg.src = `image/stickers/${stickerName}.gif`;
        console.log(`⏳ Loading sticker from server: ${stickerName}`);
    }
    
    stickerImg.alt = stickerName;
    stickerImg.className = 'sticker';
    stickerImg.onerror = function() {
        // If sticker doesn't exist, show error message instead
        messageContent.innerHTML = '';
        const messageBubble = document.createElement('div');
        messageBubble.className = 'message-bubble bot-bubble';
        messageBubble.textContent = `Sorry, I don't have a "${stickerName}" sticker. Available stickers: hi, drink, igotu, ok, really!`;
        messageContent.appendChild(messageBubble);
    };
    messageContent.appendChild(stickerImg);
    
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Function to show 3D overlay animation
function show3DAnimation(animationName) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'rexy-3d-overlay';
    overlay.id = 'rexy-3d-overlay';
    
    // Try to get cached animation first
    const cachedAnimation = window.AssetPreloader && window.AssetPreloader.getAnimation(`Rexy_${animationName.charAt(0).toUpperCase() + animationName.slice(1)}`);
    
    // Create GIF element
    const gif = document.createElement('img');
    
    if (cachedAnimation) {
        // Use cached image
        gif.src = cachedAnimation.src;
        console.log(`🚀 Using cached animation: Rexy_${animationName}`);
    } else {
        // Fallback to loading image normally
        gif.src = `image/3d/Rexy_${animationName.charAt(0).toUpperCase() + animationName.slice(1)}.gif`;
        console.log(`⏳ Loading animation from server: Rexy_${animationName}`);
    }
    
    gif.alt = `Rexy ${animationName}`;
    gif.className = 'rexy-3d-gif';
    gif.onerror = function() {
        // If GIF doesn't exist, show error and remove overlay
        console.error(`3D animation "${animationName}" not found`);
        removeOverlay();
    };
    
    overlay.appendChild(gif);
    document.body.appendChild(overlay);
    
    // Show overlay with fade-in
    setTimeout(() => {
        overlay.classList.add('show');
    }, 10);
    
    // Remove overlay after 5 seconds
    setTimeout(() => {
        removeOverlay();
    }, 5000);
    
    function removeOverlay() {
        const existingOverlay = document.getElementById('rexy-3d-overlay');
        if (existingOverlay) {
            existingOverlay.classList.remove('show');
            setTimeout(() => {
                if (existingOverlay.parentNode) {
                    existingOverlay.parentNode.removeChild(existingOverlay);
                }
            }, 300);
        }
    }
}


// Function to handle test commands (stickers, 3D animations, and photos)
function handleTestCommand(text, chatMessages, addMessage) {
    // Check if it's a photo command
    if (isPhotoCommand(text)) {
        // Add user's photo command as text message
        addMessage(text, true);
        
        // Show photo stack
        setTimeout(() => {
            showPhotoStack(chatMessages);
        }, 500);
        
        return true; // Command was handled
    }
    // Check if it's a video carousel command
    else if (text.trim().toLowerCase() === 'show-video-carousel') {
        // Add user's video carousel command as text message
        addMessage(text, true);
        
        // Show video carousel
        setTimeout(() => {
            testVideoCarousel();
        }, 500);
        
        return true; // Command was handled
    }
    // Check if it's an image carousel command
    else if (text.trim().toLowerCase() === 'show-image-carousel') {
        // Add user's image carousel command as text message
        addMessage(text, true);
        
        // Show image carousel
        setTimeout(() => {
            testImageCarousel();
        }, 500);
        
        return true; // Command was handled
    }
    // Check if it's a test single image command
    else if (text.trim().toLowerCase() === 'show-single-image') {
        // Add user's single image command as text message
        addMessage(text, true);
        
        // Show single image in overlay
        setTimeout(() => {
            if (typeof window.openImageOverlay === 'function') {
                window.openImageOverlay(
                    'https://demo.netomi.com/web/POC/Coach/Thumbnails/FY25_1.1PDP_Jimena_TeriShoulderbag_CV933_TypoCorrect.png',
                    'Coach Teri Shoulder Bag'
                );
            }
        }, 500);
        
        return true; // Command was handled
    }
    // Check if it's a welcome GIF command
    else if (text.trim().toLowerCase() === 'show-welcome') {
        // Add user's welcome command as text message
        addMessage(text, true);
        
        // Show welcome GIF
        setTimeout(() => {
            if (typeof window.showWelcomeGif === 'function') {
                window.showWelcomeGif();
            }
        }, 500);
        
        return true; // Command was handled
    }
    // Check if it's a 3D command
    else if (is3DCommand(text)) {
        const animationName = get3DName(text);
        
        // Add user's 3D command as text message
        addMessage(text, true);
        
        // Show 3D animation
        setTimeout(() => {
            show3DAnimation(animationName);
        }, 500);
        
        return true; // Command was handled
    }
    // Check if it's a sticker command
    else if (isStickerCommand(text)) {
        const stickerName = getStickerName(text);
        
        // Add user's sticker command as text message
        addMessage(text, true);
        
        // Send sticker response
        setTimeout(() => {
            sendStickerMessage(stickerName, chatMessages);
        }, 500);
        
        return true; // Command was handled
    }
    
    return false; // Command was not handled
}

// Function to test video carousel (for development/testing)
function testVideoCarousel() {
    const chatMessages = document.querySelector('.chat-messages');
    if (!chatMessages) {
        console.error('Chat messages container not found');
        return;
    }

    // Create sample video carousel data
    const testCarouselData = {
        carouselImageAspectRatio: "HORIZONTAL",
        elements: [
            {
                title: "--",
                videoUrl: "https://demo.netomi.com/web/POC/Coach/Videos/FY25_1.1PDP_Jimena_TeriShoulderbag_CV933_TypoCorrect.MOV",
                thumbnailUrl: "https://demo.netomi.com/web/POC/Coach/Thumbnails/FY25_1.1PDP_Jimena_TeriShoulderbag_CV933_TypoCorrect.png",
                buttons: []
            },
            {
                title: "--",
                videoUrl: "https://demo.netomi.com/web/POC/Coach/Videos/FY25_11.1PDP_Brandon_Teri_Shoulder_bag_CV933.MOV",
                thumbnailUrl: "https://demo.netomi.com/web/POC/Coach/Thumbnails/FY25_11.1PDP_Brandon_Teri_Shoulder_bag_CV933.png",
                buttons: []
            },
            {
                title: "--",
                videoUrl: "https://demo.netomi.com/web/POC/Coach/Videos/FY25_1.1PDP_Quala_Teri+Family_+CV935+IMBLK+CV934+IMBLK+CW309+IMBLK.mp4",
                thumbnailUrl: "https://demo.netomi.com/web/POC/Coach/Thumbnails/FY25_1.1PDP_Quala_Teri+Family_+CV935+IMBLK+CV934+IMBLK+CW309+IMBLK.png",
                buttons: []
            }
        ]
    };

    // Use the existing addCarouselMessage function if available
    if (typeof window.addCarouselMessage === 'function') {
        window.addCarouselMessage(testCarouselData);
    } else {
        console.error('addCarouselMessage function not found. Video carousel test failed.');
    }
}

// Function to test image carousel (for development/testing)
function testImageCarousel() {
    const chatMessages = document.querySelector('.chat-messages');
    if (!chatMessages) {
        console.error('Chat messages container not found');
        return;
    }

    // Create sample image carousel data (mix of titles to test both cases)
    const testImageCarouselData = {
        carouselImageAspectRatio: "HORIZONTAL",
        elements: [
            {
                title: "Coach Bag Collection",
                imageUrl: "https://demo.netomi.com/web/POC/Coach/Thumbnails/FY25_1.1PDP_Jimena_TeriShoulderbag_CV933_TypoCorrect.png",
                subtitle: "Premium leather shoulder bag",
                buttons: []
            },
            {
                title: "--", // Test clean image-only display
                imageUrl: "https://demo.netomi.com/web/POC/Coach/Thumbnails/FY25_11.1PDP_Brandon_Teri_Shoulder_bag_CV933.png",
                subtitle: "Classic design with modern appeal",
                buttons: []
            },
            {
                title: "",  // Test empty title
                imageUrl: "https://demo.netomi.com/web/POC/Coach/Thumbnails/FY25_1.1PDP_Quala_Teri+Family_+CV935+IMBLK+CV934+IMBLK+CW309+IMBLK.png",
                subtitle: "Versatile everyday companion",
                buttons: []
            }
        ]
    };

    // Use the existing addCarouselMessage function if available
    if (typeof window.addCarouselMessage === 'function') {
        window.addCarouselMessage(testImageCarouselData);
    } else {
        console.error('addCarouselMessage function not found. Image carousel test failed.');
    }
}

// Make test functions globally available for debugging
window.testVideoCarousel = testVideoCarousel;
window.testImageCarousel = testImageCarousel;
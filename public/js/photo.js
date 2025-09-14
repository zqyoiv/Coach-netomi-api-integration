// Photo Gallery Logic

// Function to show photo stack
function showPhotoStack(chatMessages) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    // Create photo stack container
    const photoStack = document.createElement('div');
    photoStack.className = 'photo-stack';
    
    // Create three photos with different rotations
    const photos = [
        { src: 'image/example-photo/photo1.png', rotation: '0deg', zIndex: 3 },
        { src: 'image/example-photo/photo2.png', rotation: '-4.494deg', zIndex: 2 },
        { src: 'image/example-photo/photo3.png', rotation: '3.972deg', zIndex: 1 }
    ];
    
    photos.forEach((photo, index) => {
        // Try to get cached photo first
        const photoName = photo.src.split('/').pop().replace('.png', '');
        const cachedPhoto = window.AssetPreloader && window.AssetPreloader.getPhoto(photoName);
        
        const img = document.createElement('img');
        
        if (cachedPhoto) {
            // Use cached image
            img.src = cachedPhoto.src;
            console.log(`🚀 Using cached photo: ${photoName}`);
        } else {
            // Fallback to loading image normally
            img.src = photo.src;
            console.log(`⏳ Loading photo from server: ${photoName}`);
        }
        
        img.alt = `Photo ${index + 1}`;
        img.className = 'stack-photo';
        img.style.transform = `rotate(${photo.rotation})`;
        img.style.zIndex = photo.zIndex;
        img.onerror = function() {
            console.error(`Photo ${index + 1} not found: ${photo.src}`);
        };
        photoStack.appendChild(img);
    });
    
    // Add click handler to photo stack
    photoStack.addEventListener('click', function(e) {
        e.stopPropagation();
        openPhotoOverlay(photos);
    });
    
    messageContent.appendChild(photoStack);
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Function to open photo overlay (expanded view)
function openPhotoOverlay(photos) {
    // Check if overlay already exists
    let overlay = document.getElementById('photo-overlay');
    
    if (overlay) {
        // If overlay exists, just switch back to expanded view
        showExpandedView(overlay, photos);
    } else {
        // Create new overlay
        overlay = document.createElement('div');
        overlay.className = 'photo-overlay';
        overlay.id = 'photo-overlay';
        
        document.body.appendChild(overlay);
        
        // Show overlay with fade-in
        setTimeout(() => {
            overlay.classList.add('show');
        }, 10);
        
        // Set up expanded view
        showExpandedView(overlay, photos);
    }
}

// Function to show expanded view in overlay
function showExpandedView(overlay, photos) {
    // Clear existing content
    overlay.innerHTML = '';
    overlay.setAttribute('data-view', 'expanded');
    
    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'photo-close-btn';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = function(e) {
        e.stopPropagation();
        closePhotoOverlay(); // Close completely from expanded view
    };
    
    // Create expanded photos container
    const expandedContainer = document.createElement('div');
    expandedContainer.className = 'expanded-photos';
    
    photos.forEach((photo, index) => {
        const img = document.createElement('img');
        img.src = photo.src;
        img.alt = `Photo ${index + 1}`;
        img.className = 'expanded-photo';
        img.onclick = function(e) {
            e.stopPropagation();
            showFullscreenPhoto(photos, index);
        };
        expandedContainer.appendChild(img);
    });
    
    overlay.appendChild(closeBtn);
    overlay.appendChild(expandedContainer);
    
    // Close on overlay click (but not on photo click)
    overlay.onclick = function(e) {
        if (e.target === overlay) {
            closePhotoOverlay();
        }
    };
}

// Function to show fullscreen photo
function showFullscreenPhoto(photos, currentIndex) {
    const overlay = document.getElementById('photo-overlay');
    if (!overlay) return;
    
    // Update view state
    overlay.setAttribute('data-view', 'fullscreen');
    
    // Clear existing content
    overlay.innerHTML = '';
    
    // Create close button (goes back to expanded view from fullscreen)
    const closeBtn = document.createElement('button');
    closeBtn.className = 'photo-close-btn';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = function(e) {
        e.stopPropagation();
        showExpandedView(overlay, photos); // Go back to expanded view
    };
    
    // Create fullscreen photo
    const img = document.createElement('img');
    img.src = photos[currentIndex].src;
    img.alt = `Photo ${currentIndex + 1}`;
    img.className = 'fullscreen-photo';
    img.onclick = function(e) {
        e.stopPropagation();
        // Go back to expanded view
        showExpandedView(overlay, photos);
    };
    
    // Create navigation arrows (if more than one photo)
    if (photos.length > 1) {
        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'photo-nav prev';
        prevBtn.innerHTML = '‹';
        prevBtn.onclick = function(e) {
            e.stopPropagation();
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1;
            showFullscreenPhoto(photos, prevIndex);
        };
        
        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'photo-nav next';
        nextBtn.innerHTML = '›';
        nextBtn.onclick = function(e) {
            e.stopPropagation();
            const nextIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0;
            showFullscreenPhoto(photos, nextIndex);
        };
        
        overlay.appendChild(prevBtn);
        overlay.appendChild(nextBtn);
    }
    
    overlay.appendChild(closeBtn);
    overlay.appendChild(img);
    
    // Update overlay click handler for fullscreen view
    overlay.onclick = function(e) {
        if (e.target === overlay) {
            showExpandedView(overlay, photos); // Go back to expanded view
        }
    };
}

// Function to close photo overlay
function closePhotoOverlay() {
    const overlay = document.getElementById('photo-overlay');
    if (overlay) {
        overlay.classList.remove('show');
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 300);
    }
}

// Function to check if command is a photo command
function isPhotoCommand(text) {
    return text.trim().toLowerCase() === 'show-photos';
}

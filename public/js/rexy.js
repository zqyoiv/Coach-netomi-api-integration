// Chat functionality for Rexy interface
document.addEventListener('DOMContentLoaded', function() {
    const chatInput = document.querySelector('.chat-input');
    const sendButton = document.querySelector('.send-button');
    const chatMessages = document.querySelector('.chat-messages');
    
    // Function to add a message to the chat
    function addMessage(text, isUser = true, isSticker = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (isSticker) {
            // Sticker message
            const stickerImg = document.createElement('img');
            stickerImg.src = 'image/stickers/hi.gif';
            stickerImg.alt = 'Hi';
            stickerImg.className = 'sticker';
            messageContent.appendChild(stickerImg);
        } else if (isUser) {
            // User message - white bubble
            const messageBubble = document.createElement('div');
            messageBubble.className = 'message-bubble user-bubble';
            messageBubble.textContent = text;
            messageContent.appendChild(messageBubble);
        } else {
            // Bot message - black bubble  
            const messageBubble = document.createElement('div');
            messageBubble.className = 'message-bubble bot-bubble';
            messageBubble.textContent = text;
            messageContent.appendChild(messageBubble);
        }
        
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Function to add quick reply options
    function addQuickReplies(options) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content quick-replies-container';
        
        options.forEach(optionText => {
            const optionButton = document.createElement('button');
            optionButton.className = 'quick-reply-option';
            optionButton.textContent = optionText;
            optionButton.onclick = function() {
                handleQuickReply(optionText, this);
            };
            messageContent.appendChild(optionButton);
        });
        
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Function to handle quick reply selection
    function handleQuickReply(text, buttonElement) {
        // Hide walking Rexy when user makes a choice
        hideWalkingRexy();
        
        // Change button appearance to selected state
        buttonElement.className = 'quick-reply-option selected';
        
        // Disable all quick reply buttons
        const allOptions = document.querySelectorAll('.quick-reply-option');
        allOptions.forEach(option => {
            option.disabled = true;
            option.style.pointerEvents = 'none';
        });
        
        // Add user message
        addMessage(text, true);
        
        // Generate bot response based on selection
        setTimeout(() => {
            let response = "";
            if (text.includes("trending online")) {
                response = "Yes! The Teri bag is one of our most popular items right now. It's been trending on social media and loved by fashion influencers worldwide.";
            } else if (text.includes("reviews")) {
                response = "The Teri has amazing reviews! Customers love its versatility, quality craftsmanship, and timeless design. It's rated 4.8/5 stars with over 500+ reviews.";
            } else if (text.includes("style")) {
                response = "The Teri is incredibly versatile! You can wear it as a crossbody for casual days, or carry it as a handbag for more formal occasions. It pairs perfectly with both jeans and dresses.";
            } else {
                response = "Thanks for your question! I'm here to help you with anything about Coach products.";
            }
            addMessage(response, false);
        }, 1000);
    }
    
    // Function to add walking Rexy background
    function addWalkingRexy() {
        const walkingRexy = document.createElement('img');
        walkingRexy.src = 'image/3d/Rexy_Walk.gif';
        walkingRexy.alt = 'Walking Rexy';
        walkingRexy.className = 'walking-rexy';
        walkingRexy.id = 'walking-rexy';
        chatMessages.appendChild(walkingRexy);
    }
    
    // Function to hide walking Rexy
    function hideWalkingRexy() {
        const walkingRexy = document.getElementById('walking-rexy');
        if (walkingRexy) {
            walkingRexy.classList.add('hidden');
            // Remove from DOM after animation
            setTimeout(() => {
                if (walkingRexy.parentNode) {
                    walkingRexy.parentNode.removeChild(walkingRexy);
                }
            }, 500);
        }
    }

    // Initialize chat with welcome message and options
    function initializeChat() {
        // Add walking Rexy immediately
        addWalkingRexy();
        
        // Show sticker, welcome message and options together 1 second after page load
        setTimeout(() => {
            // Add sticker first
            addMessage("", false, true);
            
            // Add welcome message
            addMessage("Rawr! Rexy here. Wanna chat Teri? You can ask me anything about the bag!", false);
            
            // Show all options together immediately after the message
            addQuickReplies([
                "Is this bag trending online?",
                "What are the reviews for the Teri?",
                "How can I style the Teri?"
            ]);
        }, 1000);
    }
    

    // Function to send message
    function sendMessage() {
        const text = chatInput.value.trim();
        
        // Check for test commands first
        if (text && handleTestCommand && handleTestCommand(text, chatMessages, addMessage)) {
            chatInput.value = '';
            chatInput.style.height = 'auto';
            return;
        }
        
        // Send text message if there's text
        if (text) {
            addMessage(text, true);
        }
        
        // Send images if there are any
        if (selectedImages && selectedImages.length > 0) {
            selectedImages.forEach(imageData => {
                addImageMessage(imageData.src, true);
            });
            
            // Clear selected images
            selectedImages = [];
            const container = document.getElementById('imagePreviewContainer');
            if (container) {
                container.innerHTML = '';
                container.style.display = 'none';
                const inputWrapper = container.closest('.input-wrapper');
                const inputContainer = document.querySelector('.chat-input-container');
                if (inputWrapper) {
                    inputWrapper.classList.remove('with-images');
                }
                if (inputContainer) {
                    inputContainer.classList.remove('with-images');
                }
            }
            
            // Add bot response for images
            setTimeout(() => {
                addMessage("I can see your photos! How can I help you with them?", false);
            }, 1000);
        }
        
        // Clear input if there was text or images sent
        if (text || (selectedImages && selectedImages.length > 0)) {
            chatInput.value = '';
            chatInput.style.height = 'auto';
            
            // Simple bot response for text messages (only if no images were sent)
            if (text && (!selectedImages || selectedImages.length === 0)) {
                setTimeout(() => {
                    addMessage("Thanks for your message! How else can I help you with Coach products?", false);
                }, 1000);
            }
        }
    }
    
    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Auto-resize textarea as user types
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 60) + 'px';
    });

// Photo/Camera functionality
let selectedImages = [];

function setupPhotoFunctionality() {
    const addButton = document.getElementById('addButton');
    const popup = document.getElementById('photoOptionsPopup');
    const cameraOption = document.getElementById('cameraOption');
    const photoOption = document.getElementById('photoOption');
    const cameraInput = document.getElementById('cameraInput');
    const photoInput = document.getElementById('photoInput');

    // Add button click handler
    addButton.addEventListener('click', function(e) {
        e.stopPropagation();
        popup.classList.toggle('show');
    });

    // Close popup when clicking outside
    document.addEventListener('click', function(e) {
        if (!popup.contains(e.target) && !addButton.contains(e.target)) {
            popup.classList.remove('show');
        }
    });

    // Camera option click
    cameraOption.addEventListener('click', function() {
        cameraInput.click();
        popup.classList.remove('show');
    });

    // Photo option click
    photoOption.addEventListener('click', function() {
        photoInput.click();
        popup.classList.remove('show');
    });

    // Handle camera input
    cameraInput.addEventListener('change', function(e) {
        handleImageSelection(e.target.files);
        e.target.value = ''; // Reset input
    });

    // Handle photo input
    photoInput.addEventListener('change', function(e) {
        handleImageSelection(e.target.files);
        e.target.value = ''; // Reset input
    });
}

// Handle image selection
function handleImageSelection(files) {
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                addImagePreview(e.target.result, file);
            };
            reader.readAsDataURL(file);
        }
    });
}

// Add image preview to input area
function addImagePreview(imageSrc, file) {
    const container = document.getElementById('imagePreviewContainer');
    const preview = document.createElement('div');
    preview.className = 'image-preview';
    
    const img = document.createElement('img');
    img.src = imageSrc;
    img.alt = 'Selected image';
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.innerHTML = '×';
    removeBtn.onclick = function() {
        const index = selectedImages.findIndex(item => item.file === file);
        if (index > -1) {
            selectedImages.splice(index, 1);
        }
        preview.remove();
        
        // Hide container if no images
        if (selectedImages.length === 0) {
            container.style.display = 'none';
            const inputWrapper = container.closest('.input-wrapper');
            const inputContainer = document.querySelector('.chat-input-container');
            if (inputWrapper) {
                inputWrapper.classList.remove('with-images');
            }
            if (inputContainer) {
                inputContainer.classList.remove('with-images');
            }
        }
    };
    
    preview.appendChild(img);
    preview.appendChild(removeBtn);
    container.appendChild(preview);
    
    // Store image data
    selectedImages.push({
        file: file,
        src: imageSrc,
        element: preview
    });
    
    // Show container and adjust wrapper height
    container.style.display = 'flex';
    const inputWrapper = container.closest('.input-wrapper');
    const inputContainer = document.querySelector('.chat-input-container');
    if (inputWrapper) {
        inputWrapper.classList.add('with-images');
    }
    if (inputContainer) {
        inputContainer.classList.add('with-images');
    }
}

// Add image message to chat
function addImageMessage(imageSrc, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    const messageImg = document.createElement('img');
    messageImg.src = imageSrc;
    messageImg.style.maxWidth = '200px';
    messageImg.style.maxHeight = '200px';
    messageImg.style.borderRadius = '8px';
    messageImg.style.objectFit = 'cover';
    messageImg.style.cursor = 'pointer';
    
    // Add click handler to open in fullscreen
    messageImg.addEventListener('click', function(e) {
        e.stopPropagation();
        openSinglePhotoView(imageSrc);
    });
    
    messageContent.appendChild(messageImg);
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Function to open single photo in fullscreen view
function openSinglePhotoView(imageSrc) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'photo-overlay';
    overlay.id = 'single-photo-overlay';
    
    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'photo-close-btn';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = function(e) {
        e.stopPropagation();
        closeSinglePhotoView();
    };
    
    // Create fullscreen photo
    const img = document.createElement('img');
    img.src = imageSrc;
    img.className = 'fullscreen-photo';
    img.onclick = function(e) {
        e.stopPropagation();
        closeSinglePhotoView();
    };
    
    overlay.appendChild(closeBtn);
    overlay.appendChild(img);
    document.body.appendChild(overlay);
    
    // Show overlay with fade-in
    setTimeout(() => {
        overlay.classList.add('show');
    }, 10);
    
    // Close on overlay click
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeSinglePhotoView();
        }
    });
}

// Function to close single photo view
function closeSinglePhotoView() {
    const overlay = document.getElementById('single-photo-overlay');
    if (overlay) {
        overlay.classList.remove('show');
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 300);
    }
}
    
    // Initialize the chat
    initializeChat();
    
    // Photo/Camera functionality
    setupPhotoFunctionality();
});

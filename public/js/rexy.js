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
    function sendStickerMessage(stickerName) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const stickerImg = document.createElement('img');
        stickerImg.src = `image/stickers/${stickerName}.gif`;
        stickerImg.alt = stickerName;
        stickerImg.className = 'sticker';
        stickerImg.onerror = function() {
            // If sticker doesn't exist, show error message instead
            messageContent.innerHTML = '';
            const messageBubble = document.createElement('div');
            messageBubble.className = 'message-bubble bot-bubble';
            messageBubble.textContent = `Sorry, I don't have a "${stickerName}" sticker. Available stickers: hi, drink, and others!`;
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
        
        // Create GIF element
        const gif = document.createElement('img');
        gif.src = `image/3d/Rexy_${animationName.charAt(0).toUpperCase() + animationName.slice(1)}.gif`;
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

    // Function to send message
    function sendMessage() {
        const text = chatInput.value.trim();
        if (text === '') return;
        
        // Check if it's a 3D command
        if (is3DCommand(text)) {
            const animationName = get3DName(text);
            
            // Add user's 3D command as text message
            addMessage(text, true);
            
            // Clear input
            chatInput.value = '';
            
            // Show 3D animation
            setTimeout(() => {
                show3DAnimation(animationName);
            }, 500);
        }
        // Check if it's a sticker command
        else if (isStickerCommand(text)) {
            const stickerName = getStickerName(text);
            
            // Add user's sticker command as text message
            addMessage(text, true);
            
            // Clear input
            chatInput.value = '';
            
            // Send sticker response
            setTimeout(() => {
                sendStickerMessage(stickerName);
            }, 500);
        } else {
            // Regular message
            addMessage(text, true);
            
            // Clear input
            chatInput.value = '';
            
            // Optional: Add bot response after a delay (for demo purposes)
            setTimeout(() => {
                addMessage("Thanks for your message! How else can I help you with Coach products?", false);
            }, 1000);
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
    
    // Initialize the chat
    initializeChat();
});

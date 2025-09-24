// Chat functionality for Rexy interface
document.addEventListener('DOMContentLoaded', function() {
    console.log('[Rexy] DOM loaded, checking dependencies...');
    console.log('[Rexy] window.RexyGlobalState:', !!window.RexyGlobalState);
    console.log('[Rexy] window.NetomiIntegration:', !!window.NetomiIntegration);
    
    const chatInput = document.querySelector('.chat-input');
    const sendButton = document.querySelector('.send-button');
    const chatMessages = document.querySelector('.chat-messages');
    
    // Wait for dependencies to load if they're not ready yet
    function waitForDependencies() {
        if (!window.RexyGlobalState || !window.NetomiIntegration) {
            console.log('[Rexy] Dependencies not ready, waiting 100ms...');
            setTimeout(waitForDependencies, 100);
            return;
        }
        
        console.log('[Rexy] ✅ All dependencies loaded, initializing...');
        initializeChat();
    }
    
    // Start waiting for dependencies
    waitForDependencies();
    
    function initializeChat() {
        console.log('[Rexy] 🚀 Initializing chat with dependencies loaded');
        
        // Listen for Netomi state changes from debug panel
        if (window.RexyGlobalState) {
            window.RexyGlobalState.addListener(function(netomiEnabled) {
                console.log(`[Rexy] Received state change notification: Netomi ${netomiEnabled ? 'ENABLED' : 'DISABLED'}`);
            });
        }
    
    // Function to add a message to the chat
    function addMessage(text, isUser = true, isSticker = false, options = {}) {
        const isHtml = options && options.isHtml === true;
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
            if (isHtml) {
                messageBubble.innerHTML = text;
                // Post-process special links to source cards
                try { transformSourceLinks(messageBubble); } catch (_) {}
            } else {
                messageBubble.textContent = text;
            }
            messageContent.appendChild(messageBubble);
        }
        
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Heuristic: detect if a string likely contains HTML tags
    function stringLooksLikeHtml(str) {
        if (!str || typeof str !== 'string') return false;
        return /<\s*\w+[^>]*>/i.test(str);
    }

    function transformSourceLinks(containerEl) {
        const anchors = containerEl.querySelectorAll('a.source-link-number');
        anchors.forEach((a) => {
            const href = a.getAttribute('href');
            const number = (a.textContent || '').trim() || '1';

            let label = '';
            let origin = '';
            try {
                const u = new URL(href, window.location.origin);
                origin = u.origin;
                const pathLast = u.pathname.split('/').filter(Boolean).pop() || u.hostname;
                const hash = u.hash ? decodeURIComponent(u.hash.replace(/^#/, '')) : '';
                label = decodeURIComponent(hash ? `${pathLast}#${hash}` : pathLast);
            } catch (e) {
                label = decodeURIComponent((href || '').replace(/^https?:\/\//, ''));
            }

            const wrapper = document.createElement('span');
            wrapper.className = 'source-card';

            const numBadge = document.createElement('span');
            numBadge.className = 'source-number';
            numBadge.textContent = number;

            const link = document.createElement('a');
            link.className = 'source-chip source-link';
            link.href = href || '#';
            link.target = '_blank';
            link.rel = 'noopener noreferrer';

            const icon = document.createElement('img');
            icon.className = 'source-favicon';
            icon.alt = '';
            icon.width = 14;
            icon.height = 14;
            if (origin) {
                icon.src = `${origin}/favicon.ico`;
                icon.onerror = function() { icon.style.display = 'none'; };
            } else {
                icon.style.display = 'none';
            }

            const textSpan = document.createElement('span');
            textSpan.className = 'source-text';
            textSpan.textContent = label || href || '';

            link.appendChild(icon);
            link.appendChild(textSpan);

            wrapper.appendChild(numBadge);
            wrapper.appendChild(link);

            a.replaceWith(wrapper);
        });
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
        
        // Add user message bubble immediately
        addMessage(text, true);

        // If Netomi integration is enabled, send as a process-message like normal input
        const isNetomiEnabled = window.RexyGlobalState && window.RexyGlobalState.isNetomiEnabled();
        if (isNetomiEnabled && window.NetomiIntegration) {
            // Show typing indicator and route to Netomi
            addTypingIndicator();
            window.NetomiIntegration.sendToNetomi(text)
                .then((response) => {
                    // Remove typing indicator handled in message handler
                    if (response && response.ok && response.data && response.data.webhookResponse) {
                        const webhookResponse = response.data.webhookResponse;
                        // Extract all AI response texts
                        const allTexts = window.NetomiIntegration.extractAllAIResponseTexts ? 
                                        window.NetomiIntegration.extractAllAIResponseTexts(webhookResponse) : [];
                        
                        if (allTexts.length > 0) {
                            removeTypingIndicator();
                            renderMultipleMessages(allTexts, 1200); // 1.2 second delay between messages
                        }
                        
                        // Extract and display image if available
                        const imageData = window.NetomiIntegration.extractImageData ? 
                                         window.NetomiIntegration.extractImageData(webhookResponse) : null;
                        
                        if (imageData) {
                            console.log('[Rexy] Adding image from quick reply response:', imageData.imageUrl);
                            addStickerStyleImage(imageData.imageUrl);
                        }
                        
                        const carouselData = window.NetomiIntegration.extractCarouselData ? 
                                           window.NetomiIntegration.extractCarouselData(webhookResponse) : null;
                        if (carouselData) {
                            addCarouselMessage(carouselData);
                        }
                    } else {
                        // removeTypingIndicator();
                        // addMessage("Your message was sent but I'm thinking. Please try again.", false);
                    }
                })
                .catch(() => {
                    removeTypingIndicator();
                    addMessage("I'm having trouble connecting right now. Please try again later.", false);
                });
        } else {
            // Fallback to previous mock logic when Netomi disabled
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
            }, 800);
        }
    }
    
    // Function to add walking Rexy background
    function addWalkingRexy() {
        // Try to get cached animation first
        const cachedWalking = window.AssetPreloader && window.AssetPreloader.getAnimation('Rexy_Walk');
        
        const walkingRexy = document.createElement('img');
        
        if (cachedWalking) {
            // Use cached image
            walkingRexy.src = cachedWalking.src;
            console.log('🚀 Using cached walking animation');
        } else {
            // Fallback to loading image normally
            walkingRexy.src = 'image/3d/Rexy_Walk.gif';
            console.log('⏳ Loading walking animation from server');
        }
        
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
    async function sendMessage() {
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
            
            // Handle text message responses (only if no images were sent)
            if (text && (!selectedImages || selectedImages.length === 0)) {
                // Check if Netomi integration is enabled
                const isNetomiEnabled = window.RexyGlobalState && window.RexyGlobalState.isNetomiEnabled();
                
                console.log(`[Rexy] Netomi integration status: ${isNetomiEnabled ? 'ENABLED' : 'DISABLED'}`);
                
                if (isNetomiEnabled && window.NetomiIntegration) {
                    // Send to Netomi API
                    console.log('[Rexy] Sending message to Netomi API');
                    try {
                        await handleNetomiMessage(text);
                    } catch (error) {
                        console.error('[Rexy] Error sending to Netomi:', error);
                        // Fallback to mock response on error
                        addMessage("I'm having trouble connecting right now. Please try again later.", false);
                    }
                } else {
                    // Use mock response
                    console.log('[Rexy] Using mock response');
                    setTimeout(() => {
                        addMessage("Thanks for your message! How else can I help you with Coach products?", false);
                    }, 1000);
                }
            }
        }
    }
    
    // Handle Netomi message processing
    async function handleNetomiMessage(message) {
        try {
            // Show typing indicator
            addTypingIndicator();
            
            console.log('[Rexy] Sending message to Netomi:', message);
            
            // Send message to Netomi
            // Ensure a persistent conversationId on window before first send
                        if (!window.netomiConversationId) {
                            // Obtain per-tab conversation id from integration helper (sessionStorage-backed)
                            if (window.NetomiIntegration && window.NetomiIntegration.getConversationId) {
                                window.netomiConversationId = window.NetomiIntegration.getConversationId();
                            } else {
                                window.netomiConversationId = `chat-${Date.now()}`;
                            }
                        }
            const response = await window.NetomiIntegration.sendToNetomi(message, { conversationId: window.netomiConversationId });
            
            console.log('[Rexy] Received response from Netomi:', response);
            
            if (response && response.ok && response.data) {
                if (response.data.webhookResponse) {
                    // Webhook response received immediately - process it
                    const webhookResponse = response.data.webhookResponse;
                    
                    console.log('[Rexy] Processing immediate webhook response:', webhookResponse);
                    
                    // Remove typing indicator first
                    removeTypingIndicator();
                    
                    // Extract all AI response texts
                    const allTexts = window.NetomiIntegration.extractAllAIResponseTexts ? 
                                    window.NetomiIntegration.extractAllAIResponseTexts(webhookResponse) : [];
                    
                    if (allTexts.length > 0) {
                        renderMultipleMessages(allTexts, 1200); // 1.2 second delay between messages
                    }
                    
                    // Extract and display image if available
                    const imageData = window.NetomiIntegration.extractImageData ? 
                                     window.NetomiIntegration.extractImageData(webhookResponse) : null;
                    
                    if (imageData) {
                        console.log('[Rexy] Adding image from immediate webhook response:', imageData.imageUrl);
                        addStickerStyleImage(imageData.imageUrl);
                    }
                    
                    // Extract and display carousel if available
                    const carouselData = window.NetomiIntegration.extractCarouselData ? 
                                       window.NetomiIntegration.extractCarouselData(webhookResponse) : null;
                    
                    if (carouselData) {
                        addCarouselMessage(carouselData);
                    }
                    
                    if (allTexts.length === 0 && !imageData && !carouselData) {
                        // console.log('[Rexy] No AI text, image, or carousel found, showing fallback message');
                        //addMessage("I received your message but couldn't generate a response. Please try again.", false);
                    }
                } else {
                    // Acknowledgment only - webhook will come via Socket.IO
                    console.log('[Rexy] Message sent successfully, waiting for webhook response via Socket.IO...');
                    // Keep typing indicator - it will be removed when Socket.IO message arrives
                }
            } else {
                // Handle error case
                removeTypingIndicator();
                const errMsg = response && response.error ? response.error : 'Network or server error';
                console.warn('[Rexy] Netomi response not OK:', errMsg);
                addMessage("I'm having trouble connecting right now. Please try again later.", false);
            }
            
        } catch (error) {
            console.error('[Rexy] Netomi message failed:', error);
            removeTypingIndicator();
            addMessage("I'm having trouble connecting right now. Please try again later.", false);
        }
    }
    
    // Add typing indicator
    function addTypingIndicator() {
        // Remove existing typing indicator if any
        removeTypingIndicator();
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message typing-message';
        messageDiv.id = 'typingIndicator';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const messageBubble = document.createElement('div');
        messageBubble.className = 'message-bubble bot-bubble typing-bubble';
        messageBubble.innerHTML = '<span class="typing-dots"><span>.</span><span>.</span><span>.</span></span>';
        
        messageContent.appendChild(messageBubble);
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);
        
        // Track start time for response timing
        window.thinkingAnimationStartTime = Date.now();
        
        // Show full-screen 3D thinking overlay after 2 seconds delay (guarded by debug flag)
        if (window.RexyGlobalState && window.RexyGlobalState.is3DOn && window.RexyGlobalState.is3DOn()) {
            window.thinkingAnimationTimeout = setTimeout(() => {
                // Only show if typing indicator still exists (response hasn't arrived yet)
                if (document.getElementById('typingIndicator')) {
                    showThinkingOverlay();
                }
            }, 2000);
        }
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Remove typing indicator
    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
        
        // Clear the thinking animation timeout if response came back quickly
        if (window.thinkingAnimationTimeout) {
            clearTimeout(window.thinkingAnimationTimeout);
            window.thinkingAnimationTimeout = null;
        }
        
        // Calculate response time for debugging
        if (window.thinkingAnimationStartTime) {
            const responseTime = Date.now() - window.thinkingAnimationStartTime;
            console.log(`[Rexy] Response received in ${responseTime}ms`);
            window.thinkingAnimationStartTime = null;
        }
        
        // Hide full-screen 3D thinking overlay when typing indicator is removed
        hideThinkingOverlay();
    }

    // Helper function to randomly select a waiting animation
    function getRandomWaitingAnimation() {
        const animations = [
            'Rexy_Thinking',
            'Rexy_Receivephoto', 
            'Rexy_Searching'
        ];
        const randomIndex = Math.floor(Math.random() * animations.length);
        const selectedAnimation = animations[randomIndex];
        console.log(`[Rexy] Selected random waiting animation: ${selectedAnimation}`);
        return selectedAnimation;
    }

    // Helper function to render multiple text messages sequentially
    function renderMultipleMessages(textMessages, delay = 1000) {
        if (!textMessages || textMessages.length === 0) return;
        
        console.log(`[Rexy] Rendering ${textMessages.length} messages sequentially`);
        
        textMessages.forEach((messageData, index) => {
            setTimeout(() => {
                console.log(`[Rexy] Rendering message ${index + 1}:`, messageData.text);
                addMessage(messageData.text, false, false, { isHtml: stringLooksLikeHtml(messageData.text) });
            }, index * delay);
        });
    }

    // Show thinking Rexy animation overlay inside chat area
    function addThinkingRexy() {
        if (document.getElementById('thinking-rexy')) return;
        const animationName = getRandomWaitingAnimation();
        const thinking = document.createElement('img');
        thinking.src = `image/3d/${animationName}.gif`;
        thinking.alt = 'Rexy waiting';
        thinking.className = 'thinking-rexy';
        thinking.id = 'thinking-rexy';
        chatMessages.appendChild(thinking);
    }

    function removeThinkingRexy() {
        const el = document.getElementById('thinking-rexy');
        if (el && el.parentNode) {
            el.parentNode.removeChild(el);
        }
    }

    // Full-screen thinking overlay (persistent until explicitly hidden)
    function showThinkingOverlay() {
        if (document.getElementById('rexy-3d-overlay')) return; // already showing
        const overlay = document.createElement('div');
        overlay.className = 'rexy-3d-overlay';
        overlay.id = 'rexy-3d-overlay';

        // Get random waiting animation
        const animationName = getRandomWaitingAnimation();
        
        // Try to use preloaded animation if available
        const cached = window.AssetPreloader && window.AssetPreloader.getAnimation(animationName);
        const gif = document.createElement('img');
        gif.className = 'rexy-3d-gif';
        gif.alt = 'Rexy Waiting';
        gif.src = cached ? cached.src : `image/3d/${animationName}.gif`;
        gif.onerror = function() {
            // If loading fails, remove overlay
            hideThinkingOverlay();
        };

        overlay.appendChild(gif);
        document.body.appendChild(overlay);
        // fade-in
        setTimeout(() => overlay.classList.add('show'), 10);
    }

    function hideThinkingOverlay() {
        const overlay = document.getElementById('rexy-3d-overlay');
        if (!overlay) return;
        overlay.classList.remove('show');
        setTimeout(() => {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 300);
    }
    
    // Add carousel message
    function addCarouselMessage(carouselData) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const carouselContainer = document.createElement('div');
        carouselContainer.className = 'carousel-container';
        
        const carouselScroller = document.createElement('div');
        carouselScroller.className = 'carousel-scroller';
        
        carouselData.elements.forEach(element => {
            const carouselItem = document.createElement('div');
            carouselItem.className = 'carousel-item';
            
            // Video or Image
            if (element.videoUrl && element.thumbnailUrl) {
                // Add video-only class to carousel item
                carouselItem.classList.add('video-only-item');
                
                // Video thumbnail with play indicator - no content area
                const videoContainer = document.createElement('div');
                videoContainer.className = 'carousel-video-container video-only';
                
                const thumbnail = document.createElement('img');
                thumbnail.src = element.thumbnailUrl;
                thumbnail.alt = element.title || 'Video thumbnail';
                thumbnail.className = 'carousel-image carousel-video-thumbnail';
                
                // Play button overlay
                const playButton = document.createElement('div');
                playButton.className = 'video-play-button';
                playButton.innerHTML = '▶';
                
                videoContainer.appendChild(thumbnail);
                videoContainer.appendChild(playButton);
                
                // Add click handler to open video overlay
                videoContainer.addEventListener('click', function(e) {
                    e.stopPropagation();
                    openVideoOverlay(element.videoUrl, element.title);
                });
                
                carouselItem.appendChild(videoContainer);
                // Skip content area for videos - no text or buttons
            } else if (element.imageUrl) {
                // Regular image - no content area, clean image-only
                carouselItem.classList.add('image-only-item');
                
                const img = document.createElement('img');
                img.src = element.imageUrl;
                img.alt = element.title || 'Product image';
                img.className = 'carousel-image';
                img.style.cursor = 'pointer';
                
                // Add click handler to open image overlay
                img.addEventListener('click', function(e) {
                    e.stopPropagation();
                    openImageOverlay(element.imageUrl, element.title || 'Image');
                });
                
                carouselItem.appendChild(img);
                
                // Skip content area for images - no text or buttons
            }
            carouselScroller.appendChild(carouselItem);
        });
        
        carouselContainer.appendChild(carouselScroller);
        messageContent.appendChild(carouselContainer);
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Video overlay functions
    function openVideoOverlay(videoUrl, title) {
        // Check if overlay already exists
        let overlay = document.getElementById('video-overlay');
        
        if (overlay) {
            // If overlay exists, replace video
            showVideoPlayer(overlay, videoUrl, title);
        } else {
            // Create new overlay
            overlay = document.createElement('div');
            overlay.className = 'video-overlay';
            overlay.id = 'video-overlay';
            
            document.body.appendChild(overlay);
            
            // Show overlay with fade-in
            setTimeout(() => {
                overlay.classList.add('show');
            }, 10);
            
            // Set up video player
            showVideoPlayer(overlay, videoUrl, title);
        }
    }

    function showVideoPlayer(overlay, videoUrl, title) {
        // Clear existing content
        overlay.innerHTML = '';
        
        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'video-close-btn';
        closeBtn.innerHTML = '×';
        closeBtn.onclick = function(e) {
            e.stopPropagation();
            closeVideoOverlay();
        };
        
        // Create video container
        const videoContainer = document.createElement('div');
        videoContainer.className = 'video-player-container';
        
        // Create video element
        const video = document.createElement('video');
        video.className = 'video-player';
        video.src = videoUrl;
        video.controls = true;
        video.autoplay = true;
        video.playsInline = true;
        
        if (title) {
            video.title = title;
        }
        
        // Handle video errors
        video.onerror = function() {
            console.error('Video failed to load:', videoUrl);
            const errorMsg = document.createElement('div');
            errorMsg.className = 'video-error';
            errorMsg.textContent = 'Unable to load video';
            videoContainer.appendChild(errorMsg);
        };
        
        videoContainer.appendChild(video);
        overlay.appendChild(closeBtn);
        overlay.appendChild(videoContainer);
        
        // Close on overlay click (but not on video click)
        overlay.onclick = function(e) {
            if (e.target === overlay) {
                closeVideoOverlay();
            }
        };
        
        // Prevent video click from closing overlay
        video.onclick = function(e) {
            e.stopPropagation();
        };
    }

    function closeVideoOverlay() {
        const overlay = document.getElementById('video-overlay');
        if (overlay) {
            // Pause video before closing
            const video = overlay.querySelector('video');
            if (video) {
                video.pause();
            }
            
            overlay.classList.remove('show');
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 300);
        }
    }

    // Image overlay functions (similar to photo overlay but for single images)
    function openImageOverlay(imageUrl, title) {
        // Check if overlay already exists
        let overlay = document.getElementById('image-overlay');
        
        if (overlay) {
            // If overlay exists, replace image
            showImageViewer(overlay, imageUrl, title);
        } else {
            // Create new overlay
            overlay = document.createElement('div');
            overlay.className = 'photo-overlay'; // Reuse photo overlay styles
            overlay.id = 'image-overlay';
            
            document.body.appendChild(overlay);
            
            // Show overlay with fade-in
            setTimeout(() => {
                overlay.classList.add('show');
            }, 10);
            
            // Set up image viewer
            showImageViewer(overlay, imageUrl, title);
        }
    }

    function showImageViewer(overlay, imageUrl, title) {
        // Clear existing content
        overlay.innerHTML = '';
        overlay.setAttribute('data-view', 'fullscreen');
        
        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'photo-close-btn';
        closeBtn.innerHTML = '×';
        closeBtn.onclick = function(e) {
            e.stopPropagation();
            closeImageOverlay();
        };
        
        // Create fullscreen image
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = title;
        img.className = 'fullscreen-photo'; // Reuse fullscreen photo styles
        img.onclick = function(e) {
            e.stopPropagation();
            // Close on image click
            closeImageOverlay();
        };
        
        // Handle image errors
        img.onerror = function() {
            console.error('Image failed to load:', imageUrl);
            const errorMsg = document.createElement('div');
            errorMsg.className = 'image-error';
            errorMsg.style.color = 'white';
            errorMsg.style.textAlign = 'center';
            errorMsg.style.padding = '20px';
            errorMsg.style.fontSize = '16px';
            errorMsg.textContent = 'Unable to load image';
            overlay.appendChild(errorMsg);
        };
        
        overlay.appendChild(closeBtn);
        overlay.appendChild(img);
        
        // Close on overlay click (but not on image click)
        overlay.onclick = function(e) {
            if (e.target === overlay) {
                closeImageOverlay();
            }
        };
    }

    function closeImageOverlay() {
        const overlay = document.getElementById('image-overlay');
        if (overlay) {
            overlay.classList.remove('show');
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 300);
        }
    }

    // Make video and image functions globally available
    window.openVideoOverlay = openVideoOverlay;
    window.closeVideoOverlay = closeVideoOverlay;
    window.openImageOverlay = openImageOverlay;
    window.closeImageOverlay = closeImageOverlay;
    
    // Make carousel function globally available for testing
    window.addCarouselMessage = addCarouselMessage;
    
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

    // Add sticker-style image message to chat (for webhook images)
    function addStickerStyleImage(imageSrc) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const stickerImg = document.createElement('img');
        stickerImg.src = imageSrc;
        stickerImg.alt = 'Response image';
        stickerImg.className = 'sticker';
        stickerImg.onerror = function() {
            // If image doesn't load, show error message instead
            messageContent.innerHTML = '';
            const messageBubble = document.createElement('div');
            messageBubble.className = 'message-bubble bot-bubble';
            messageBubble.textContent = 'Sorry, I couldn\'t load the image.';
            messageContent.appendChild(messageBubble);
        };
        
        messageContent.appendChild(stickerImg);
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
    
    // Setup real-time webhook updates handler for Socket.IO
    function initializeWebhookStream() {
        console.log('[Rexy] Setting up Socket.IO webhook handler...');
        
        // Register global handler for Socket.IO webhook updates
        window.handleRealtimeWebhookUpdate = function(webhookResponse) {
            console.log('[Rexy] Processing real-time webhook update via Socket.IO:', webhookResponse);
            
            // Remove typing indicator if it's still showing
            removeTypingIndicator();
            
            // Extract all AI response texts
            const allTexts = window.NetomiIntegration.extractAllAIResponseTexts ? 
                            window.NetomiIntegration.extractAllAIResponseTexts(webhookResponse) : [];
            
            if (allTexts.length > 0) {
                console.log(`[Rexy] Adding ${allTexts.length} AI responses from real-time update`);
                renderMultipleMessages(allTexts, 1200); // 1.2 second delay between messages
            }
            
            // Extract and display image if available
            const imageData = window.NetomiIntegration.extractImageData ? 
                             window.NetomiIntegration.extractImageData(webhookResponse) : null;
            
            if (imageData) {
                console.log('[Rexy] Adding image from real-time update:', imageData.imageUrl);
                addStickerStyleImage(imageData.imageUrl);
            }
            
            // Extract and display carousel if available
            const carouselData = window.NetomiIntegration.extractCarouselData ? 
                               window.NetomiIntegration.extractCarouselData(webhookResponse) : null;
            
            if (carouselData) {
                addCarouselMessage(carouselData);
            }
            
            if (allTexts.length === 0 && !imageData && !carouselData) {
                // console.log('[Rexy] No AI text, image, or carousel found in real-time update');
                // addMessage("I received your message but couldn't generate a response. Please try again.", false);
            }
        };
        
        console.log('[Rexy] Socket.IO webhook handler registered');
        // Drain any queued webhook events that arrived before handler registration
        if (Array.isArray(window._pendingWebhookEvents) && window._pendingWebhookEvents.length > 0) {
            console.log(`[Rexy] Draining ${window._pendingWebhookEvents.length} queued webhook events...`);
            const queued = window._pendingWebhookEvents.splice(0, window._pendingWebhookEvents.length);
            queued.forEach((evt) => {
                try { window.handleRealtimeWebhookUpdate(evt); } catch (e) { console.warn('Failed to process queued webhook:', e); }
            });
        }
    }
    
    // Initialize the welcome chat sequence
    setTimeout(() => {
        console.log('[Rexy] Starting initial chat sequence...');
        // Add sticker first
        addMessage("", false, true);
        
        // Add welcome message
        setTimeout(() => {
            addMessage("Rawr! Rexy here. Wanna chat Teri? You can ask me anything about the bag!", false);
        }, 1000);
    }, 500);
    
    // Initialize real-time webhook updates
    initializeWebhookStream();
    
    // Initialize photo functionality
    setupPhotoFunctionality();
    
    } // End of initializeChat function
    
}); // End of DOMContentLoaded

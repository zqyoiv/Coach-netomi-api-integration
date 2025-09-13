// Chat functionality for Rexy interface
document.addEventListener('DOMContentLoaded', function() {
    const chatInput = document.querySelector('.chat-input');
    const sendButton = document.querySelector('.send-button');
    const chatMessages = document.querySelector('.chat-messages');
    
    // Function to add a message to the chat
    function addMessage(text, isUser = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (isUser) {
            // User message - dark bubble
            const messageBubble = document.createElement('div');
            messageBubble.className = 'message-bubble user-bubble';
            messageBubble.textContent = text;
            messageContent.appendChild(messageBubble);
        } else {
            // Bot message - light bubble  
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
    
    // Function to send message
    function sendMessage() {
        const text = chatInput.value.trim();
        if (text === '') return;
        
        // Add user message
        addMessage(text, true);
        
        // Clear input
        chatInput.value = '';
        
        // Optional: Add bot response after a delay (for demo purposes)
        setTimeout(() => {
            addMessage("Thanks for your message! I'm here to help you with Coach products.", false);
        }, 1000);
    }
    
    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});

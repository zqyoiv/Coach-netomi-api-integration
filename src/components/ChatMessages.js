import React, { forwardRef, useEffect } from 'react';
import Message from './Message';

const ChatMessages = forwardRef(({ messages, renderWelcomeAnimation, renderThinkingInChat, isThinkingInChat, onImageClick, onVideoClick }, ref) => {
  useEffect(() => {
    // Scroll to bottom when messages change
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [messages, ref]);

  return (
    <div className="chat-messages" ref={ref}>
        {messages.map((message) => (
          <Message 
            key={message.id} 
            message={message}
            renderWelcomeAnimation={renderWelcomeAnimation}
            renderThinkingInChat={renderThinkingInChat}
            onImageClick={onImageClick}
            onVideoClick={onVideoClick}
          />
        ))}
        {isThinkingInChat && (
          <div className="message bot-message">
            <div className="message-content">
              {renderThinkingInChat()}
            </div>
          </div>
        )}
    </div>
  );
});

ChatMessages.displayName = 'ChatMessages';

export default ChatMessages;

import React from 'react';

const Message = ({ message, renderWelcomeAnimation, onImageClick, onVideoClick }) => {
  const { type, content, isWelcome, isTyping, isHtml, isSticker, imageSrc, isCarousel, carouselData } = message;

  if (isWelcome) {
    return (
      <div className="message bot-message welcome-gif-message">
        <div className="message-content welcome-gif-content">
          {renderWelcomeAnimation()}
        </div>
      </div>
    );
  }

  // Typing indicator (matching vanilla JS rexy.js lines 492-505)
  if (isTyping) {
    return (
      <div className="message bot-message typing-message" id="typingIndicator">
        <div className="message-content">
          <div className="message-bubble bot-bubble typing-bubble">
            <span className="typing-dots">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Sticker (matching vanilla JS rexy.js lines 1132-1158)
  if (isSticker) {
    return (
      <div className="message bot-message">
        <div className="message-content">
          <img 
            src={imageSrc} 
            alt="Response image" 
            className="sticker"
            onError={(e) => {
              // If image doesn't load, show error message instead (matching vanilla JS lines 1143-1150)
              e.target.style.display = 'none';
              const errorDiv = document.createElement('div');
              errorDiv.className = 'message-bubble bot-bubble';
              errorDiv.textContent = 'Sorry, I couldn\'t load the image.';
              e.target.parentNode.appendChild(errorDiv);
            }}
          />
        </div>
      </div>
    );
  }

  if (isCarousel) {
    return (
      <div className="message bot-message full-width-grid-message">
        <div className="message-content full-width-grid-content">
          <div className="carousel-container full-width-grid-container">
            <div className="carousel-scroller">
              {carouselData.elements.map((element, index) => (
                <div key={index} className="carousel-item">
                  {element.videoUrl && element.thumbnailUrl ? (
                    // Video element
                    <div 
                      className="carousel-video-container video-only"
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onVideoClick) {
                          onVideoClick(element.videoUrl, element.title || 'Video');
                        }
                      }}
                    >
                      <img 
                        src={element.thumbnailUrl} 
                        alt={element.title || 'Video thumbnail'} 
                        className="carousel-image carousel-video-thumbnail"
                      />
                      <div className="video-play-button">▶</div>
                    </div>
                  ) : element.imageUrl ? (
                    // Image element
                    <img 
                      src={element.imageUrl} 
                      alt={element.title || 'Product image'} 
                      className="carousel-image"
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onImageClick) {
                          onImageClick(element.imageUrl);
                        }
                      }}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`message ${type}-message`}>
      <div className="message-content">
        {type === 'user' ? (
          <div className="message-bubble user-bubble">
            {content}
          </div>
        ) : (
          <div className="message-bubble bot-bubble">
            {isHtml ? (
              <div dangerouslySetInnerHTML={{ __html: content }} />
            ) : (
              content
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;

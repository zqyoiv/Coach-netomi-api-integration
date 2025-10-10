import React from 'react';

const Message = ({ message, renderWelcomeAnimation, renderThinkingInChat }) => {
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

  if (isTyping) {
    return (
      <div className="message bot-message">
        <div className="message-content">
          {renderThinkingInChat()}
        </div>
      </div>
    );
  }

  if (isSticker) {
    return (
      <div className="message bot-message">
        <div className="message-content">
          <img 
            src={imageSrc} 
            alt="Response image" 
            className="sticker"
            onError={(e) => {
              // If image doesn't load, show error message instead
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
                    <div className="carousel-video-container video-only">
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

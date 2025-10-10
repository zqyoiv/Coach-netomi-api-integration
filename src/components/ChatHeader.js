import React from 'react';

const ChatHeader = () => {
  return (
    <div className="chat-header">
      <div className="header-content">
        <div className="rexy-avatar-container">
          <img 
            src="/image/rexy-icon.png" 
            alt="Rexy" 
            className="rexy-avatar"
          />
        </div>
        
        <div className="header-center">
          <img 
            src="/image/coach/coach-logo.svg" 
            alt="Coach" 
            className="coach-header-logo"
          />
          <img 
            src="/image/coach/shop-with-rexy.png" 
            alt="Shop with Rexy" 
            className="shop-with-rexy-text"
          />
        </div>
        
        <div className="bag-container">
          <img 
            src="/image/coach/teri-logo-s.svg" 
            alt="Bag" 
            className="bag-icon"
          />
          <span className="teri-text">TERI</span>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;

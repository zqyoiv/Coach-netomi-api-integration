import React from 'react';
import RexyIcon from '../assets/rexy-icon.png';
import CoachLogo from '../assets/coach/coach-logo.svg';
import ShopWithRexy from '../assets/coach/shop-with-rexy.png';
import TeriLogo from '../assets/coach/teri-logo-s.svg';

const ChatHeader = () => {
  return (
    <div className="chat-header">
      <div className="header-content">
        <div className="rexy-avatar-container">
          <img 
            src={RexyIcon} 
            alt="Rexy" 
            className="rexy-avatar" 
          />
        </div>
        
        <div className="header-center">
          <img 
            src={CoachLogo} 
            alt="Coach" 
            className="coach-header-logo" 
          />
          <img 
            src={ShopWithRexy} 
            alt="Shop with Rexy" 
            className="shop-with-rexy-text" 
          />
        </div>
        
        <div className="bag-container">
          <img 
            src={TeriLogo} 
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

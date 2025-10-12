import React, { useEffect } from 'react';

const PhotoOverlay = ({ imageSrc, onClose }) => {
  useEffect(() => {
    // Add show class after mount for fade-in animation
    const overlay = document.getElementById('single-photo-overlay');
    if (overlay) {
      setTimeout(() => {
        overlay.classList.add('show');
      }, 10);
    }
  }, []);

  const handleOverlayClick = (e) => {
    if (e.target.className === 'photo-overlay show') {
      // Close with overlay_click method for GTM tracking
      onClose(imageSrc, 'overlay_click');
    }
  };

  const handleCloseClick = (e) => {
    e.stopPropagation();
    // Close with button_click method for GTM tracking
    onClose(imageSrc, 'button_click');
  };

  const handleImageClick = (e) => {
    e.stopPropagation();
    // Close with image_click method for GTM tracking
    onClose(imageSrc, 'image_click');
  };

  return (
    <div 
      className="photo-overlay" 
      id="single-photo-overlay"
      onClick={handleOverlayClick}
    >
      <button 
        className="photo-close-btn" 
        onClick={handleCloseClick}
      >
        ×
      </button>
      <img 
        src={imageSrc} 
        className="fullscreen-photo"
        alt="Fullscreen view"
        onClick={handleImageClick}
      />
    </div>
  );
};

export default PhotoOverlay;


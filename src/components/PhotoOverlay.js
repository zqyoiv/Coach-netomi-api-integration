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
      onClose();
    }
  };

  const handleCloseClick = (e) => {
    e.stopPropagation();
    onClose();
  };

  const handleImageClick = (e) => {
    e.stopPropagation();
    onClose();
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


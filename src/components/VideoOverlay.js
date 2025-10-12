import React, { useEffect, useRef } from 'react';

const VideoOverlay = ({ videoUrl, title, onClose }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    // Add show class after mount for fade-in animation
    const overlay = document.getElementById('video-overlay');
    if (overlay) {
      setTimeout(() => {
        overlay.classList.add('show');
      }, 10);
    }

    // Cleanup video on unmount
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
      }
    };
  }, []);

  const handleOverlayClick = (e) => {
    if (e.target.className === 'photo-overlay show' || e.target.id === 'video-overlay') {
      onClose();
    }
  };

  const handleCloseClick = (e) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <div 
      className="photo-overlay" 
      id="video-overlay"
      data-view="fullscreen"
      onClick={handleOverlayClick}
    >
      <button 
        className="photo-close-btn" 
        onClick={handleCloseClick}
      >
        ×
      </button>
      <video 
        ref={videoRef}
        src={videoUrl}
        className="fullscreen-photo"
        controls
        autoPlay
        playsInline
        style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoOverlay;


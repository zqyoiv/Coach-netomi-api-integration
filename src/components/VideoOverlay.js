import React, { useEffect, useRef } from 'react';
import { useGTMManager } from '../hooks/useGTMManager';
import debug from '../utils/debug';

const VideoOverlay = ({ videoUrl, title, onClose }) => {
  const videoRef = useRef(null);
  const gtmManager = useGTMManager();

  useEffect(() => {
    // Add show class after mount for fade-in animation
    const overlay = document.getElementById('video-overlay');
    if (overlay) {
      setTimeout(() => {
        overlay.classList.add('show');
      }, 10);
    }

    // Add GTM tracking for video events (matching vanilla JS rexy.js lines 723-762)
    const video = videoRef.current;
    if (video) {
      // Track video play event
      const handlePlay = () => {
        if (gtmManager.trackContentInteraction) {
          gtmManager.trackContentInteraction('play', 'video', {
            title: title || 'Video',
            url: videoUrl,
            id: 'video_play_' + Date.now(),
            current_time: video.currentTime,
            duration: video.duration || 0
          });
        }
      };

      // Track video pause event
      const handlePause = () => {
        if (gtmManager.trackContentInteraction) {
          gtmManager.trackContentInteraction('pause', 'video', {
            title: title || 'Video',
            url: videoUrl,
            id: 'video_pause_' + Date.now(),
            current_time: video.currentTime,
            duration: video.duration || 0,
            watch_percentage: video.duration ? Math.round((video.currentTime / video.duration) * 100) : 0
          });
        }
      };

      // Track video ended event
      const handleEnded = () => {
        if (gtmManager.trackContentInteraction) {
          gtmManager.trackContentInteraction('ended', 'video', {
            title: title || 'Video',
            url: videoUrl,
            id: 'video_ended_' + Date.now(),
            current_time: video.currentTime,
            duration: video.duration || 0,
            watch_percentage: 100
          });
        }
      };

      // Track video error
      const handleError = () => {
        debug.error('[VideoOverlay] Video failed to load:', videoUrl);
        if (gtmManager.trackError) {
          gtmManager.trackError('media', 'Video failed to load', {
            source: 'video_overlay',
            url: videoUrl,
            title: title
          });
        }
      };

      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('ended', handleEnded);
      video.addEventListener('error', handleError);

      // Cleanup video and listeners on unmount
      return () => {
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('ended', handleEnded);
        video.removeEventListener('error', handleError);
        video.pause();
        video.src = '';
      };
    }
  }, [videoUrl, title, gtmManager]);

  const getVideoData = () => {
    const video = videoRef.current;
    return {
      currentTime: video ? video.currentTime : 0,
      duration: video ? (video.duration || 0) : 0
    };
  };

  const handleOverlayClick = (e) => {
    if (e.target.className === 'photo-overlay show' || e.target.id === 'video-overlay') {
      const { currentTime, duration } = getVideoData();
      onClose(videoUrl, title, currentTime, duration, 'overlay_click');
    }
  };

  const handleCloseClick = (e) => {
    e.stopPropagation();
    const { currentTime, duration } = getVideoData();
    onClose(videoUrl, title, currentTime, duration, 'button_click');
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


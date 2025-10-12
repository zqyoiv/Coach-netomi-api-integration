import React from 'react';

const PhotoOptionsPopup = ({ show, onCameraClick, onPhotoClick }) => {
  if (!show) return null;

  return (
    <div className="photo-options-popup" id="photoOptionsPopup">
      <button className="photo-option" id="cameraOption" onClick={onCameraClick}>
        <span>Camera</span>
      </button>
      <button className="photo-option" id="photoOption" onClick={onPhotoClick}>
        <span>Photos</span>
      </button>
    </div>
  );
};

export default PhotoOptionsPopup;

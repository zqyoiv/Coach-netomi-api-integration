import React from 'react';

const ImagePreview = ({ images, onRemove }) => {
  if (!images || images.length === 0) return null;

  return (
    <div className="image-preview-container" id="imagePreviewContainer">
      {images.map((image, index) => (
        <div key={index} className="image-preview">
          <img 
            src={URL.createObjectURL(image)} 
            alt={`Preview ${index + 1}`}
          />
          <button 
            className="remove-btn"
            onClick={() => onRemove(index)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default ImagePreview;

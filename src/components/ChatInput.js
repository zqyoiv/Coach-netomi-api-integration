import React, { useState, useRef, useEffect } from 'react';
import PhotoOptionsPopup from './PhotoOptionsPopup';
import ImagePreview from './ImagePreview';

const ChatInput = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [showImagePreview, setShowImagePreview] = useState(false);
  
  const textareaRef = useRef(null);
  const cameraInputRef = useRef(null);
  const photoInputRef = useRef(null);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() || selectedImages.length > 0) {
      onSendMessage(message.trim(), selectedImages);
      setMessage('');
      setSelectedImages([]);
      setShowImagePreview(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAddButtonClick = () => {
    setShowPhotoOptions(!showPhotoOptions);
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
    setShowPhotoOptions(false);
  };

  const handlePhotoClick = () => {
    photoInputRef.current?.click();
    setShowPhotoOptions(false);
  };

  const handleFileChange = (e, type) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setSelectedImages(files);
      setShowImagePreview(true);
    }
  };

  const removeImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    if (newImages.length === 0) {
      setShowImagePreview(false);
    }
  };

  return (
    <div className={`chat-input-container ${showImagePreview ? 'with-images' : ''}`}>
      <div className={`input-wrapper ${showImagePreview ? 'with-images' : ''}`}>
        {showImagePreview && (
          <ImagePreview 
            images={selectedImages} 
            onRemove={removeImage}
          />
        )}
        
        <textarea
          ref={textareaRef}
          className="chat-input"
          placeholder="Ask your Teri questions here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          rows="1"
        />
        
        <div className="button-row">
          <button 
            className="add-button" 
            id="addButton"
            onClick={handleAddButtonClick}
            type="button"
          >
            <img src="/image/ui-icon/add.svg" alt="Add" className="icon" />
          </button>
          
          <button 
            className="send-button" 
            onClick={handleSend}
            type="button"
          >
            <img src="/image/ui-icon/send.svg" alt="Send" className="icon" />
          </button>
        </div>
        
        <PhotoOptionsPopup 
          show={showPhotoOptions}
          onCameraClick={handleCameraClick}
          onPhotoClick={handlePhotoClick}
        />
        
        <input
          ref={cameraInputRef}
          type="file"
          id="cameraInput"
          className="hidden-input"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFileChange(e, 'camera')}
        />
        
        <input
          ref={photoInputRef}
          type="file"
          id="photoInput"
          className="hidden-input"
          accept="image/*"
          multiple
          onChange={(e) => handleFileChange(e, 'photo')}
        />
      </div>
      
      <div className="terms-footer">
        <span>By using this app, you agree to the </span>
        <a href="#" className="terms-link">Terms of Use</a>
      </div>
    </div>
  );
};

export default ChatInput;

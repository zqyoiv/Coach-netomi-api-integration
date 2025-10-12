import React from 'react';

const ConnectionErrorOverlay = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <div className="connection-error-overlay" id="connectionErrorOverlay">
      <div className="error-message-container">
        <p className="error-message">Please reload to chat with rexy again</p>
      </div>
    </div>
  );
};

export default ConnectionErrorOverlay;

import React from 'react';
import './ScreenshotWarning.css';

const ScreenshotWarning = ({ show, screenshotCount, onReload }) => {
  if (!show) return null;

  return (
    <div className="screenshot-warning-overlay">
      <div className="screenshot-warning-modal">
        <div className="warning-icon">⚠️</div>
        <h2>Warning!</h2>
        <p>You have attempted to take a screenshot</p>
        <p className="screenshot-count">Screenshot Attempt: {screenshotCount}</p>
        <p className="warning-message">
          Screenshots are not allowed during this session
        </p>
        <button onClick={onReload} className="reload-page-btn">
          Reload Page
        </button>
        <p className="warning-footer">
          This action has been logged for security purposes
        </p>
      </div>
    </div>
  );
};

export default ScreenshotWarning;

import React from 'react';

export function LoadingOverlay({ message = 'Rebuilding schedule...' }) {
  return (
    <div className="loading-overlay">
      <div style={{ textAlign: 'center' }}>
        <div className="spinner"></div>
        <div className="loading-text">{message}</div>
      </div>
    </div>
  );
}

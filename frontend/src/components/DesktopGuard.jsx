import React, { useState, useEffect } from 'react';

const MIN_WIDTH = 768;

export const DesktopGuard = ({ children }) => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= MIN_WIDTH);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= MIN_WIDTH);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isDesktop) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0E1117',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '500px',
          padding: '40px',
          background: '#161B22',
          borderRadius: '8px',
          border: '1px solid #30363d'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px'
          }}>🖥️</div>
          <h2 style={{
            color: '#E6EDF3',
            fontSize: '24px',
            marginBottom: '16px',
            fontWeight: 600
          }}>
            Desktop Required
          </h2>
          <p style={{
            color: '#8B949E',
            fontSize: '16px',
            lineHeight: '1.5'
          }}>
            FluxNex is optimized for desktop production planning.
            <br /><br />
            Please access from a desktop device (minimum width: 768px).
          </p>
        </div>
      </div>
    );
  }

  return children;
};

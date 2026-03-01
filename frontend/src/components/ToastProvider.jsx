import React, { createContext, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const success = (message) => showToast(message, 'success');
  const error = (message) => showToast(message, 'error');
  const info = (message) => showToast(message, 'info');

  return (
    <ToastContext.Provider value={{ success, error, info }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} onClose={() => {
            setToasts(prev => prev.filter(t => t.id !== toast.id));
          }} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

function Toast({ message, type, onClose }) {
  const icons = {
    success: <CheckCircle2 size={20} style={{ color: '#10b981' }} />,
    error: <AlertCircle size={20} style={{ color: '#ef4444' }} />,
    info: <Info size={20} style={{ color: '#3b82f6' }} />
  };

  return (
    <div className={`toast ${type}`}>
      {icons[type]}
      <span style={{ flex: 1, fontSize: '14px' }}>{message}</span>
      <button 
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex'
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}

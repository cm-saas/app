import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  const token = localStorage.getItem('fluxnex_token');

  // Explicit console logs
  console.log('=== ProtectedRoute Check ===');
  console.log('pathname:', location.pathname);
  console.log('loading:', loading);
  console.log('isAuthenticated:', isAuthenticated);
  console.log('user:', user);
  console.log('token in localStorage:', !!token);
  console.log('===========================');

  // Step 1: If loading, show loading screen
  if (loading) {
    console.log('→ RENDERING: Loading screen (auth check in progress)');
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at top, #0f1521 0%, var(--bg-primary) 50%)',
        color: 'var(--text-primary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid var(--border-default)',
            borderTopColor: 'var(--brand-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Loading...
          </div>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Step 2: If loading is false AND not authenticated, redirect to login
  if (!loading && !isAuthenticated) {
    console.log('→ REDIRECT: Not authenticated, sending to /login');
    return <Navigate to="/login" replace />;
  }

  // Step 3: Otherwise, render protected content
  console.log('→ RENDERING: Protected content (authenticated)');
  return children;
}

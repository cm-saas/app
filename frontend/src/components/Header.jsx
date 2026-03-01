import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Header = () => {
  const location = useLocation();

  return (
    <header className="dark-header">
      <Link to="/" className="logo-link">
        <div className="logo-text">
          FLUX<span className="logo-accent">NEX</span>
        </div>
      </Link>
      
      <nav className="dark-nav">
        <Link 
          to="/" 
          className={`dark-nav-link ${location.pathname === '/' ? 'active' : ''}`}
        >
          Home
        </Link>
        <Link 
          to="/signup" 
          className="btn-primary"
        >
          Start Free Trial
        </Link>
      </nav>
    </header>
  );
};

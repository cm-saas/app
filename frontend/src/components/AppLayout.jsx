import React from 'react';
import { useNavigate, Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Calendar, TrendingUp, AlertTriangle, LogOut, User, Package, ClipboardList } from 'lucide-react';
import '../enterprise.css';

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="enterprise-layout" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside className="enterprise-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">
            FLUX<span className="accent">NEX</span>
          </div>
          <div className="brand-tagline">
            Deterministic Multi-Stage Scheduling<br/>for Modern Manufacturing
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <Link to="/app" className={`nav-link ${location.pathname === '/app' ? 'active' : ''}`}>
            <Activity size={20} />
            <span>Dashboard</span>
          </Link>
          <Link to="/app/orders" className={`nav-link ${location.pathname === '/app/orders' ? 'active' : ''}`}>
            <Calendar size={20} />
            <span>Orders</span>
          </Link>
          <Link to="/app/parts" className={`nav-link ${location.pathname === '/app/parts' ? 'active' : ''}`}>
            <Package size={20} />
            <span>Parts</span>
          </Link>
          <Link to="/app/production" className={`nav-link ${location.pathname === '/app/production' ? 'active' : ''}`}>
            <ClipboardList size={20} />
            <span>Production</span>
          </Link>
          <Link to="/app/capacity" className={`nav-link ${location.pathname === '/app/capacity' ? 'active' : ''}`}>
            <TrendingUp size={20} />
            <span>Capacity</span>
          </Link>
          <Link to="/app/risks" className={`nav-link ${location.pathname === '/app/risks' ? 'active' : ''}`}>
            <AlertTriangle size={20} />
            <span>Risks</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* TopBar */}
        <div className="top-bar">
          <div className="top-bar-left">
            <h1>Production Intelligence</h1>
          </div>
          <div className="top-bar-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {user && (
              <div style={{ 
                fontSize: '13px', 
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <User size={16} />
                <span>{user.full_name || user.email}</span>
              </div>
            )}
            <button className="btn btn-ghost" onClick={handleLogout} title="Logout">
              <LogOut size={18} />
              <span style={{ marginLeft: '6px' }}>Logout</span>
            </button>
          </div>
        </div>

        {/* Page Content - Rendered by child routes */}
        <Outlet />
      </div>
    </div>
  );
}

import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * AppLayout — Persistent layout across all application views.
 * Features an elegant monochrome header with silver accents and role-specific navigation.
 */
const AppLayout = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <NavLink to="/" className="brand" aria-label="MeuLink Home">
            <span className="brand-text">MeuLink</span>
            <span className="brand-badge">Marketplace</span>
          </NavLink>

          <nav className="nav-links" aria-label="Main navigation">
            {isAuthenticated ? (
              <>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
                >
                  Dashboard
                </NavLink>

                {/* Investor-specific routes */}
                {user?.role === 'investor' && (
                  <>
                    <NavLink
                      to="/marketplace"
                      className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
                    >
                      Marketplace
                    </NavLink>
                    <NavLink
                      to="/saved"
                      className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
                    >
                      Saved
                    </NavLink>
                    <NavLink
                      to="/interests/sent"
                      className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
                    >
                      Sent Interests
                    </NavLink>
                  </>
                )}

                {/* Business founder-specific routes */}
                {user?.role === 'business' && (
                  <>
                    <NavLink
                      to="/business/profile"
                      className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
                    >
                      My Profile
                    </NavLink>
                    <NavLink
                      to="/interests/received"
                      className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
                    >
                      Incoming Interests
                    </NavLink>
                  </>
                )}

                <div className="nav-user-section">
                  <div className="nav-user-info">
                    <span className="nav-user-name">{user?.name}</span>
                    <span className="nav-role-badge">
                      {user?.role === 'business' ? 'Founder' : 'Investor'}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handleLogout}
                    aria-label="Log out of account"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
                >
                  Sign In
                </NavLink>
                <NavLink
                  to="/register"
                  className="btn btn-primary btn-sm"
                >
                  Register
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="container main-content">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <div>
            <strong>MeuLink</strong> &mdash; Early-Stage Capital Marketplace
          </div>
          <div>
            <span>Connecting verified founders with strategic capital</span>
          </div>
        </div>
      </footer>
    </>
  );
};

export default AppLayout;

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ApiStatus from '../components/ApiStatus';
import RolesSection from '../components/RolesSection';

/**
 * HomePage — Public landing page.
 * Shows hero CTA that changes based on auth state, API status, and role cards.
 */
const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <section className="hero">
        <div className="container">
          <p className="hero-tagline">Early-Stage Capital Marketplace</p>
          <h1 className="hero-title">Connecting Growing Businesses with Strategic Investors</h1>
          <p className="hero-description">
            MeuLink is a modern marketplace where businesses seeking growth funding can publish
            company profiles, metrics, and pitches, while investors discover high-potential opportunities
            and express investment interest.
          </p>
          <div className="hero-actions">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">
                  Get Started
                </Link>
                <Link to="/login" className="btn btn-outline btn-lg">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
      <ApiStatus />
      <RolesSection />
    </>
  );
};

export default HomePage;

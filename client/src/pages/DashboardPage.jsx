import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardStats } from '../api/apiClient';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import StatusLabel from '../components/StatusLabel';

/**
 * DashboardPage — Role-specific central hub displaying real backend metrics and navigation shortcuts
 */
const DashboardPage = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    const result = await getDashboardStats(token);

    if (result.success) {
      setStats(result.data);
    } else {
      setError(result.error || 'Failed to fetch dashboard statistics');
    }

    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="dashboard-page">
        <LoadingState message="Aggregating your dashboard statistics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <ErrorState
          title="Could not load dashboard metrics"
          message={error}
          onRetry={fetchStats}
        />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Welcome, {user?.name}</h1>
          <p className="dashboard-subtitle">
            {user?.role === 'business'
              ? 'Founders Console — Monitor business profile discoverability and review incoming investor interest.'
              : 'Investors Portal — Explore published companies, track due diligence, and manage investment outreach.'}
          </p>
        </div>

        <div className="dashboard-actions">
          {user?.role === 'business' ? (
            <>
              <Link to="/business/profile" className="btn btn-primary">
                Manage Profile &rarr;
              </Link>
              <Link to="/interests/received" className="btn btn-outline">
                Review Inquiries
              </Link>
            </>
          ) : (
            <>
              <Link to="/marketplace" className="btn btn-primary">
                Browse Marketplace &rarr;
              </Link>
              <Link to="/saved" className="btn btn-outline">
                Saved Watchlist
              </Link>
              <Link to="/interests/sent" className="btn btn-outline">
                Sent Interests
              </Link>
            </>
          )}
        </div>
      </div>

      {user?.role === 'business' && stats?.stats && (
        <BusinessDashboard stats={stats.stats} />
      )}

      {user?.role === 'investor' && stats?.stats && (
        <InvestorDashboard stats={stats.stats} />
      )}
    </div>
  );
};

/**
 * Founder metrics section
 */
const BusinessDashboard = ({ stats }) => {
  return (
    <>
      <div className="stats-section">
        <h2 className="stats-section-title">Business Profile Status</h2>
        <div className="stats-grid">
          <div className="stat-card stat-card-accent">
            <div className="stat-icon">🏢</div>
            <div className="stat-content">
              <span className="stat-label">Profile Setup</span>
              <span className="stat-value">
                {stats.profileExists ? 'Configured' : 'Not Created'}
              </span>
              <Link
                to="/business/profile"
                style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}
              >
                {stats.profileExists ? 'Edit Details &rarr;' : 'Create Profile &rarr;'}
              </Link>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🌐</div>
            <div className="stat-content">
              <span className="stat-label">Marketplace Status</span>
              <div style={{ marginTop: '0.25rem' }}>
                <StatusLabel status={stats.isPublished ? 'published' : 'unpublished'} />
              </div>
              <Link
                to="/business/profile"
                style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}
              >
                Manage Publication &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="stats-section">
        <h2 className="stats-section-title">Investor Inquiries</h2>
        <div className="stats-grid">
          <div className="stat-card stat-card-accent">
            <div className="stat-icon">📨</div>
            <div className="stat-content">
              <span className="stat-label">Total Inquiries</span>
              <span className="stat-value stat-large">
                {stats.interestsReceived?.total ?? 0}
              </span>
              <Link
                to="/interests/received"
                style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}
              >
                View All &rarr;
              </Link>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <span className="stat-label">Pending Review</span>
              <span className="stat-value stat-large">
                {stats.interestsReceived?.pending ?? 0}
              </span>
              <Link
                to="/interests/received"
                style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}
              >
                Review Pending &rarr;
              </Link>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✓</div>
            <div className="stat-content">
              <span className="stat-label">Accepted</span>
              <span className="stat-value stat-large">
                {stats.interestsReceived?.accepted ?? 0}
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✕</div>
            <div className="stat-content">
              <span className="stat-label">Declined</span>
              <span className="stat-value stat-large">
                {stats.interestsReceived?.declined ?? 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * Investor metrics section
 */
const InvestorDashboard = ({ stats }) => {
  return (
    <>
      <div className="stats-section">
        <h2 className="stats-section-title">Marketplace Activity</h2>
        <div className="stats-grid">
          <div className="stat-card stat-card-accent">
            <div className="stat-icon">🏢</div>
            <div className="stat-content">
              <span className="stat-label">Available Listings</span>
              <span className="stat-value stat-large">
                {stats.availableBusinesses ?? 0}
              </span>
              <Link
                to="/marketplace"
                style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}
              >
                Explore Marketplace &rarr;
              </Link>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">★</div>
            <div className="stat-content">
              <span className="stat-label">Saved Watchlist</span>
              <span className="stat-value stat-large">
                {stats.savedBusinesses ?? 0}
              </span>
              <Link
                to="/saved"
                style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}
              >
                View Saved &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="stats-section">
        <h2 className="stats-section-title">Investment Outreach</h2>
        <div className="stats-grid">
          <div className="stat-card stat-card-accent">
            <div className="stat-icon">📤</div>
            <div className="stat-content">
              <span className="stat-label">Total Notes Sent</span>
              <span className="stat-value stat-large">
                {stats.interestsSent?.total ?? 0}
              </span>
              <Link
                to="/interests/sent"
                style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}
              >
                View Sent &rarr;
              </Link>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <span className="stat-label">Awaiting Response</span>
              <span className="stat-value stat-large">
                {stats.interestsSent?.pending ?? 0}
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✓</div>
            <div className="stat-content">
              <span className="stat-label">Accepted Contacts</span>
              <span className="stat-value stat-large">
                {stats.interestsSent?.accepted ?? 0}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Pitch info unlocked
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✕</div>
            <div className="stat-content">
              <span className="stat-label">Declined</span>
              <span className="stat-value stat-large">
                {stats.interestsSent?.declined ?? 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;

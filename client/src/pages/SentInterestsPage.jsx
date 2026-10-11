import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getSentInterests } from '../api/apiClient';
import StatusLabel from '../components/StatusLabel';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

/**
 * SentInterestsPage — Investor interface for tracking outgoing investment notes
 */
const SentInterestsPage = () => {
  const { token } = useAuth();

  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInterests = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    const result = await getSentInterests(token);

    if (result.success && Array.isArray(result.data.data)) {
      setInterests(result.data.data);
    } else {
      setError(result.error || 'Failed to fetch sent interests');
    }

    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchInterests();
  }, [fetchInterests]);

  return (
    <div className="marketplace-page">
      <div className="page-header">
        <h1 className="page-title">Sent Expressions of Interest</h1>
        <p className="page-subtitle">
          Track the status of your notes submitted to business founders.
        </p>
      </div>

      {loading ? (
        <LoadingState message="Loading your sent interest records..." />
      ) : error ? (
        <ErrorState
          title="Could not load expressions of interest"
          message={error}
          onRetry={fetchInterests}
        />
      ) : interests.length === 0 ? (
        <EmptyState
          icon="📤"
          title="No sent interests yet"
          description="Browse the marketplace and submit a note of interest on company profiles to initiate discussion."
          actionLabel="Explore Marketplace"
          actionTo="/marketplace"
        />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Message Sent</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {interests.map((item) => {
                const biz = item.business;
                return (
                  <tr key={item.id}>
                    <td>
                      {biz ? (
                        <div>
                          <strong>{biz.name}</strong>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {[biz.industry, biz.country].filter(Boolean).join(' • ')}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>
                          Company Profile Unavailable
                        </span>
                      )}
                    </td>

                    <td>
                      <div className="interest-message">{item.message}</div>
                    </td>

                    <td>
                      <StatusLabel status={item.status} />
                    </td>

                    <td>
                      <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
                      </span>
                    </td>

                    <td>
                      {biz?.id ? (
                        <Link
                          to={`/businesses/${biz.id}`}
                          className="btn btn-outline btn-sm"
                        >
                          View Details &rarr;
                        </Link>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SentInterestsPage;

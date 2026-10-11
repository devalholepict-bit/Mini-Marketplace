import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getReceivedInterests, updateInterestStatus } from '../api/apiClient';
import StatusLabel from '../components/StatusLabel';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

/**
 * ReceivedInterestsPage — Founder dashboard for managing investor outreach
 */
const ReceivedInterestsPage = () => {
  const { token } = useAuth();

  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const fetchReceived = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    setActionError(null);

    const result = await getReceivedInterests(token);

    if (result.success && Array.isArray(result.data.data)) {
      setInterests(result.data.data);
    } else {
      setError(result.error || 'Failed to fetch incoming interests');
    }

    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchReceived();
  }, [fetchReceived]);

  /**
   * Transition pending interest to 'accepted' or 'declined'
   */
  const handleStatusUpdate = async (interestId, newStatus) => {
    if (!token || actionLoadingId) return;

    setActionLoadingId(interestId);
    setActionError(null);

    const result = await updateInterestStatus(interestId, newStatus, token);

    if (result.success) {
      // Reconcile list state with server response
      setInterests((prev) =>
        prev.map((item) =>
          item.id === interestId ? { ...item, status: newStatus } : item
        )
      );
    } else {
      if (result.status === 409) {
        setActionError(
          'This expression of interest has already been updated and cannot be modified again.'
        );
        // Refresh list to reconcile
        fetchReceived();
      } else {
        setActionError(result.error || 'Failed to update interest status');
      }
    }

    setActionLoadingId(null);
  };

  return (
    <div className="marketplace-page">
      <div className="page-header">
        <h1 className="page-title">Incoming Expressions of Interest</h1>
        <p className="page-subtitle">
          Review investment inquiries from verified investors. Accepting unlocks your confidential
          pitch materials and direct founder contact.
        </p>
      </div>

      {actionError && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          <span>{actionError}</span>
        </div>
      )}

      {loading ? (
        <LoadingState message="Loading incoming interest inquiries..." />
      ) : error ? (
        <ErrorState
          title="Could not load incoming interests"
          message={error}
          onRetry={fetchReceived}
        />
      ) : interests.length === 0 ? (
        <EmptyState
          icon="📥"
          title="No incoming interests yet"
          description="Make sure your company profile is published in the marketplace to receive investment outreach."
          actionLabel="Check Profile Status"
          actionTo="/business/profile"
        />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Investor</th>
                <th>Inquiry Note</th>
                <th>Status</th>
                <th>Received</th>
                <th>Decision</th>
              </tr>
            </thead>
            <tbody>
              {interests.map((item) => {
                const investor = item.investor;
                const isPending = item.status === 'pending';
                const isProcessing = actionLoadingId === item.id;

                return (
                  <tr key={item.id}>
                    <td>
                      <div>
                        <strong>{investor?.name || 'Verified Investor'}</strong>
                        {investor?.email && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {investor.email}
                          </div>
                        )}
                      </div>
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
                      {isPending ? (
                        <div className="table-actions">
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleStatusUpdate(item.id, 'accepted')}
                            disabled={isProcessing}
                          >
                            {isProcessing ? 'Updating...' : 'Accept'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleStatusUpdate(item.id, 'declined')}
                            disabled={isProcessing}
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Decision Finalized
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

export default ReceivedInterestsPage;

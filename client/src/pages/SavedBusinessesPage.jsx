import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSavedBusinesses, removeSavedBusiness } from '../api/apiClient';
import BusinessCard from '../components/BusinessCard';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

/**
 * SavedBusinessesPage — Dedicated bookmark management interface for investors.
 */
const SavedBusinessesPage = () => {
  const { token } = useAuth();

  const [savedBusinesses, setSavedBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const fetchSaved = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    const result = await getSavedBusinesses(token);

    if (result.success && Array.isArray(result.data.data)) {
      setSavedBusinesses(result.data.data);
    } else {
      setError(result.error || 'Failed to load saved businesses');
    }

    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  /**
   * Remove a business from saved list
   */
  const handleRemoveSaved = async (businessId) => {
    if (!token || removingId) return;

    setRemovingId(businessId);
    const result = await removeSavedBusiness(businessId, token);

    if (result.success) {
      setSavedBusinesses((prev) => prev.filter((b) => b.id !== businessId));
    }
    setRemovingId(null);
  };

  return (
    <div className="marketplace-page">
      <div className="page-header">
        <h1 className="page-title">Saved Businesses</h1>
        <p className="page-subtitle">
          Your active diligence list of bookmarked companies.
        </p>
      </div>

      {loading ? (
        <LoadingState message="Loading your saved businesses..." />
      ) : error ? (
        <ErrorState
          title="Could not load saved businesses"
          message={error}
          onRetry={fetchSaved}
        />
      ) : savedBusinesses.length === 0 ? (
        <EmptyState
          icon="★"
          title="No saved businesses yet"
          description="Bookmark promising companies while browsing the marketplace to review them here."
          actionLabel="Explore Marketplace"
          actionTo="/marketplace"
        />
      ) : (
        <>
          <div className="marketplace-meta">
            <span>
              <strong>{savedBusinesses.length}</strong> saved{' '}
              {savedBusinesses.length === 1 ? 'business' : 'businesses'}
            </span>
          </div>

          <div className="business-cards-grid">
            {savedBusinesses.map((biz) => (
              <BusinessCard
                key={biz.id}
                business={biz}
                isSaved={true}
                saveLoading={removingId === biz.id}
                onToggleSave={handleRemoveSaved}
                showBookmark={true}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SavedBusinessesPage;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getBusinesses,
  getSavedBusinesses,
  saveBusiness,
  removeSavedBusiness
} from '../api/apiClient';
import BusinessCard from '../components/BusinessCard';
import BusinessFilters from '../components/BusinessFilters';
import Pagination from '../components/Pagination';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

const INITIAL_FILTERS = {
  q: '',
  industry: '',
  stage: '',
  country: '',
  minFunding: '',
  maxFunding: '',
  sortBy: 'createdAt',
  order: 'desc'
};

/**
 * MarketplacePage — Main discovery interface for investors.
 * Features real server-side search, filtering, pagination, and saved status tracking.
 */
const MarketplacePage = () => {
  const { token } = useAuth();

  const [businesses, setBusinesses] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [savedIds, setSavedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Debounce ref for search queries
  const debounceTimerRef = useRef(null);

  /**
   * Fetch current investor's saved business IDs to reflect bookmark state
   */
  const loadSavedBusinesses = useCallback(async () => {
    if (!token) return;
    const result = await getSavedBusinesses(token);
    if (result.success && Array.isArray(result.data.data)) {
      const ids = new Set(result.data.data.map((b) => b.id));
      setSavedIds(ids);
    }
  }, [token]);

  /**
   * Fetch businesses from the API with current filter and pagination state
   */
  const fetchMarketplace = useCallback(
    async (pageToFetch = 1, currentFilters = filters) => {
      setLoading(true);
      setError(null);

      // Construct clean query params accepted by businessQuerySchema
      const params = {
        page: pageToFetch,
        limit: 12,
        sortBy: currentFilters.sortBy || 'createdAt',
        order: currentFilters.order || 'desc'
      };

      if (currentFilters.q && currentFilters.q.trim()) {
        params.q = currentFilters.q.trim();
      }
      if (currentFilters.industry) {
        params.industry = currentFilters.industry;
      }
      if (currentFilters.stage) {
        params.stage = currentFilters.stage;
      }
      if (currentFilters.country && currentFilters.country.trim()) {
        params.country = currentFilters.country.trim();
      }
      if (currentFilters.minFunding !== '' && !isNaN(Number(currentFilters.minFunding))) {
        params.minFunding = Number(currentFilters.minFunding);
      }
      if (currentFilters.maxFunding !== '' && !isNaN(Number(currentFilters.maxFunding))) {
        params.maxFunding = Number(currentFilters.maxFunding);
      }

      // Check min/max combination
      if (
        params.minFunding !== undefined &&
        params.maxFunding !== undefined &&
        params.minFunding > params.maxFunding
      ) {
        setError('Minimum funding goal cannot be greater than maximum funding goal');
        setLoading(false);
        return;
      }

      const result = await getBusinesses(params, token);

      if (result.success) {
        setBusinesses(result.data.data || []);
        if (result.data.pagination) {
          setPagination(result.data.pagination);
        }
      } else {
        setError(result.error);
      }

      setLoading(false);
    },
    [filters, token]
  );

  // Load saved IDs on initial mount
  useEffect(() => {
    loadSavedBusinesses();
  }, [loadSavedBusinesses]);

  // Fetch businesses when filters change (debounced for text search, immediate for dropdowns)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchMarketplace(1, filters);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [filters, fetchMarketplace]);

  /**
   * Handle pagination click
   */
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchMarketplace(newPage, filters);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  /**
   * Handle filter reset
   */
  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  /**
   * Toggle save/unsave for a business card
   */
  const handleToggleSave = async (businessId) => {
    if (!token || actionLoadingId) return;

    setActionLoadingId(businessId);
    const isCurrentlySaved = savedIds.has(businessId);

    if (isCurrentlySaved) {
      const res = await removeSavedBusiness(businessId, token);
      if (res.success) {
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(businessId);
          return next;
        });
      }
    } else {
      const res = await saveBusiness(businessId, token);
      if (res.success) {
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.add(businessId);
          return next;
        });
      }
    }

    setActionLoadingId(null);
  };

  return (
    <div className="marketplace-page">
      <div className="page-header">
        <h1 className="page-title">Marketplace Discovery</h1>
        <p className="page-subtitle">
          Browse verified growth-stage businesses seeking capital and strategic partnerships.
        </p>
      </div>

      {/* Filter and Search controls */}
      <BusinessFilters
        filters={filters}
        onChange={setFilters}
        onReset={handleResetFilters}
        loading={loading}
      />

      {/* Result metadata banner */}
      <div className="marketplace-meta">
        <span>
          Showing <strong>{businesses.length}</strong> of{' '}
          <strong>{pagination.total}</strong> published businesses
        </span>
      </div>

      {/* Content states */}
      {loading ? (
        <LoadingState message="Discovering businesses matching your criteria..." />
      ) : error ? (
        <ErrorState
          title="Could not load marketplace listings"
          message={error}
          onRetry={() => fetchMarketplace(pagination.page, filters)}
        />
      ) : businesses.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No businesses found"
          description="Try adjusting your keywords, stage, or funding parameters to discover more opportunities."
          actionLabel="Clear Filters"
          onAction={handleResetFilters}
        />
      ) : (
        <>
          <div className="business-cards-grid">
            {businesses.map((biz) => (
              <BusinessCard
                key={biz.id}
                business={biz}
                isSaved={savedIds.has(biz.id)}
                saveLoading={actionLoadingId === biz.id}
                onToggleSave={handleToggleSave}
                showBookmark={true}
              />
            ))}
          </div>

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default MarketplacePage;

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getBusinessById,
  getSavedBusinesses,
  saveBusiness,
  removeSavedBusiness,
  createInterest
} from '../api/apiClient';
import { formatCurrency } from '../components/BusinessCard';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';

/**
 * BusinessDetailPage — Detailed profile view for a business.
 * Supports public inspection, private data reveal (upon server authorization),
 * saving/bookmarking, and expression of investment interest.
 */
const BusinessDetailPage = () => {
  const { id } = useParams();
  const { user, token } = useAuth();

  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Saved state for investor
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Interest expression form state
  const [interestMessage, setInterestMessage] = useState('');
  const [submittingInterest, setSubmittingInterest] = useState(false);
  const [interestSuccess, setInterestSuccess] = useState(null);
  const [interestError, setInterestError] = useState(null);

  /**
   * Fetch business profile by ID
   */
  const loadBusiness = useCallback(async () => {
    if (!id || !token) return;
    setLoading(true);
    setError(null);

    const result = await getBusinessById(id, token);

    if (result.success && result.data.business) {
      setBusiness(result.data.business);
    } else {
      setError(result.error || 'Business profile not found');
    }

    setLoading(false);
  }, [id, token]);

  /**
   * Check if investor has saved this business
   */
  const checkSavedStatus = useCallback(async () => {
    if (!token || user?.role !== 'investor') return;
    const result = await getSavedBusinesses(token);
    if (result.success && Array.isArray(result.data.data)) {
      const saved = result.data.data.some((b) => b.id === id);
      setIsSaved(saved);
    }
  }, [id, token, user?.role]);

  useEffect(() => {
    loadBusiness();
    checkSavedStatus();
  }, [loadBusiness, checkSavedStatus]);

  /**
   * Handle bookmark toggle
   */
  const handleToggleSave = async () => {
    if (!token || saveLoading) return;
    setSaveLoading(true);

    if (isSaved) {
      const res = await removeSavedBusiness(id, token);
      if (res.success) {
        setIsSaved(false);
      }
    } else {
      const res = await saveBusiness(id, token);
      if (res.success) {
        setIsSaved(true);
      }
    }

    setSaveLoading(false);
  };

  /**
   * Submit expression of investment interest
   */
  const handleInterestSubmit = async (e) => {
    e.preventDefault();
    setInterestError(null);
    setInterestSuccess(null);

    const trimmed = interestMessage.trim();
    if (!trimmed) {
      setInterestError('Please provide a message explaining your investment interest');
      return;
    }
    if (trimmed.length > 1000) {
      setInterestError('Message cannot exceed 1000 characters');
      return;
    }

    setSubmittingInterest(true);
    const res = await createInterest({ businessId: id, message: trimmed }, token);
    setSubmittingInterest(false);

    if (res.success) {
      setInterestSuccess(
        'Your expression of interest has been delivered to the founder. You will be notified once reviewed.'
      );
      setInterestMessage('');
    } else {
      if (res.status === 409) {
        setInterestError(
          'You have already submitted an expression of interest for this company.'
        );
      } else {
        setInterestError(res.error || 'Failed to submit expression of interest');
      }
    }
  };

  if (loading) {
    return (
      <div className="business-detail-page">
        <LoadingState message="Loading business profile..." />
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="business-detail-page">
        <Link
          to={user?.role === 'investor' ? '/marketplace' : '/dashboard'}
          className="back-link"
        >
          &larr; {user?.role === 'investor' ? 'Back to Marketplace' : 'Back to Dashboard'}
        </Link>
        <ErrorState
          title="Business Not Found"
          message={error || 'This business profile could not be found or is unpublished.'}
          onRetry={loadBusiness}
        />
      </div>
    );
  }

  const isOwner = user?.role === 'business' && business.owner === user?.id;
  const hasPrivateAccess = Boolean(business.contactEmail || business.privatePitchLink);
  const locationText = [business.city, business.country].filter(Boolean).join(', ');

  return (
    <div className="business-detail-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to={user?.role === 'investor' ? '/marketplace' : '/dashboard'} className="back-link">
          &larr; {user?.role === 'investor' ? 'Back to Marketplace' : 'Back to Dashboard'}
        </Link>

        {isOwner && (
          <Link to="/business/profile" className="btn btn-outline btn-sm">
            ✏️ Edit My Profile
          </Link>
        )}
      </div>

      {isOwner && (
        <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
          <span>
            You are viewing your own business profile as founders and investors see it.
          </span>
        </div>
      )}

      <div className="detail-layout">
        {/* Main Profile Info */}
        <div className="detail-main">
          <div className="detail-header">
            <h1 className="detail-title">{business.name}</h1>
            <p className="detail-tagline">{business.tagline}</p>
          </div>

          {/* Key Metrics Grid */}
          <div className="detail-grid-metrics">
            <div className="meta-row-item">
              <span className="meta-row-label">Funding Target</span>
              <span className="meta-row-val" style={{ fontSize: '1.25rem' }}>
                {formatCurrency(business.fundingGoal)}
              </span>
            </div>
            <div className="meta-row-item">
              <span className="meta-row-label">Company Stage</span>
              <span className="meta-row-val">{business.stage || '—'}</span>
            </div>
            <div className="meta-row-item">
              <span className="meta-row-label">Industry</span>
              <span className="meta-row-val">{business.industry || '—'}</span>
            </div>
            <div className="meta-row-item">
              <span className="meta-row-label">Annual Revenue</span>
              <span className="meta-row-val">{business.revenueRange || '—'}</span>
            </div>
            <div className="meta-row-item">
              <span className="meta-row-label">Headquarters</span>
              <span className="meta-row-val">{locationText || '—'}</span>
            </div>
          </div>

          {/* Comprehensive Description */}
          <section className="detail-section">
            <h2 className="detail-section-title">About the Company</h2>
            <div className="detail-text">{business.description}</div>
          </section>

          {/* Capital Purpose / Allocation */}
          {business.purpose && (
            <section className="detail-section">
              <h2 className="detail-section-title">Use of Capital</h2>
              <div className="detail-text">{business.purpose}</div>
            </section>
          )}

          {/* Authorized Private Details */}
          {hasPrivateAccess && (
            <div className="private-info-box">
              <div className="private-info-header">
                <span>🔐 Authorized Direct Contact & Pitch Materials</span>
              </div>
              <p className="private-info-note">
                These confidential channels are revealed only to the verified owner and approved investors.
              </p>

              {business.contactEmail && (
                <div className="private-field-item">
                  <span className="private-field-label">Direct Founder Email</span>
                  <a
                    href={`mailto:${business.contactEmail}`}
                    className="private-field-val auth-link"
                  >
                    {business.contactEmail}
                  </a>
                </div>
              )}

              {business.privatePitchLink && (
                <div className="private-field-item">
                  <span className="private-field-label">Confidential Pitch Deck / Data Room</span>
                  <a
                    href={business.privatePitchLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="private-field-val auth-link"
                  >
                    {business.privatePitchLink} &rarr;
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Actions (Investor Tools) */}
        <aside className="detail-sidebar">
          {user?.role === 'investor' && (
            <>
              {/* Bookmark Card */}
              <div className="action-card">
                <h3 className="action-card-title">Due Diligence List</h3>
                <p className="action-card-text">
                  Save this profile to your watchlist for fast access and future review.
                </p>
                <button
                  type="button"
                  className={`btn btn-full ${isSaved ? 'btn-dark' : 'btn-outline'}`}
                  onClick={handleToggleSave}
                  disabled={saveLoading}
                >
                  {saveLoading ? 'Updating...' : isSaved ? '★ Bookmarked in Saved' : '☆ Save Business'}
                </button>
              </div>

              {/* Express Interest Card */}
              <div className="action-card">
                <h3 className="action-card-title">Express Investment Interest</h3>
                <p className="action-card-text">
                  Connect directly with the founder by submitting a note of interest. Once accepted,
                  confidential contact details and pitch materials will be unlocked.
                </p>

                {interestSuccess && (
                  <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                    <span>{interestSuccess}</span>
                  </div>
                )}

                {interestError && (
                  <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                    <span>{interestError}</span>
                  </div>
                )}

                {!interestSuccess && (
                  <form onSubmit={handleInterestSubmit}>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label htmlFor="interest-message" className="form-label">
                        Message to Founder
                      </label>
                      <textarea
                        id="interest-message"
                        className="form-textarea"
                        placeholder="Introduce your investment focus, syndicate, or background (max 1000 characters)..."
                        rows={4}
                        value={interestMessage}
                        onChange={(e) => setInterestMessage(e.target.value)}
                        disabled={submittingInterest}
                      />
                      <span className="form-hint">
                        {1000 - interestMessage.length} characters remaining
                      </span>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary btn-full"
                      disabled={submittingInterest || !interestMessage.trim()}
                    >
                      {submittingInterest ? 'Sending Note...' : 'Send Expression of Interest'}
                    </button>
                  </form>
                )}
              </div>
            </>
          )}

          {/* Founder viewing own card */}
          {isOwner && (
            <div className="action-card">
              <h3 className="action-card-title">Profile Management</h3>
              <p className="action-card-text">
                Keep your metrics and pitch information current to attract leading investors.
              </p>
              <Link to="/business/profile" className="btn btn-primary btn-full">
                Open Profile Editor
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default BusinessDetailPage;

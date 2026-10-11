import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMyBusiness, upsertMyBusiness, setPublishStatus } from '../api/apiClient';
import LoadingState from '../components/LoadingState';
import StatusLabel from '../components/StatusLabel';

const EMPTY_FORM = {
  name: '',
  tagline: '',
  description: '',
  industry: '',
  country: '',
  city: '',
  stage: '',
  revenueRange: '',
  fundingGoal: '',
  purpose: '',
  privatePitchLink: '',
  contactEmail: ''
};

/**
 * BusinessProfilePage — Complete profile management & publication console for founders
 */
const BusinessProfilePage = () => {
  const { token, user } = useAuth();

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [profileExists, setProfileExists] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [businessId, setBusinessId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }
  const [publishFeedback, setPublishFeedback] = useState(null);

  /**
   * Fetch owner's current business profile
   */
  const loadProfile = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setFeedback(null);

    const result = await getMyBusiness(token);

    if (result.success && result.data.business) {
      const b = result.data.business;
      setProfileExists(true);
      setIsPublished(Boolean(b.isPublished));
      setBusinessId(b.id);
      setFormData({
        name: b.name || '',
        tagline: b.tagline || '',
        description: b.description || '',
        industry: b.industry || '',
        country: b.country || '',
        city: b.city || '',
        stage: b.stage || '',
        revenueRange: b.revenueRange || '',
        fundingGoal: b.fundingGoal !== undefined ? String(b.fundingGoal) : '',
        purpose: b.purpose || '',
        privatePitchLink: b.privatePitchLink || '',
        contactEmail: b.contactEmail || ''
      });
    } else {
      // 404 indicates profile does not exist yet — initialize with user's email if possible
      setProfileExists(false);
      setIsPublished(false);
      setBusinessId(null);
      setFormData((prev) => ({
        ...prev,
        contactEmail: user?.email || ''
      }));
    }

    setLoading(false);
  }, [token, user?.email]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFeedback(null);
  };

  /**
   * Validate and submit profile updates via PUT /businesses/me
   */
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setFeedback(null);

    // Client-side quick checks
    const fundingNumber = Number(formData.fundingGoal);
    if (!formData.fundingGoal || isNaN(fundingNumber) || fundingNumber <= 0) {
      setFeedback({
        type: 'error',
        message: 'Funding goal must be a valid positive number greater than 0'
      });
      return;
    }

    const payload = {
      name: formData.name.trim(),
      tagline: formData.tagline.trim(),
      description: formData.description.trim(),
      industry: formData.industry.trim(),
      country: formData.country.trim(),
      city: formData.city.trim(),
      stage: formData.stage.trim(),
      revenueRange: formData.revenueRange.trim(),
      fundingGoal: fundingNumber,
      purpose: formData.purpose.trim(),
      privatePitchLink: formData.privatePitchLink ? formData.privatePitchLink.trim() : '',
      contactEmail: formData.contactEmail.trim()
    };

    setSaving(true);
    const result = await upsertMyBusiness(payload, token);
    setSaving(false);

    if (result.success && result.data.business) {
      setProfileExists(true);
      setIsPublished(Boolean(result.data.business.isPublished));
      setBusinessId(result.data.business.id);
      setFeedback({
        type: 'success',
        message: profileExists
          ? 'Business profile updated successfully'
          : 'Business profile created successfully'
      });
    } else {
      setFeedback({
        type: 'error',
        message: result.error || 'Failed to save business profile'
      });
    }
  };

  /**
   * Handle dedicated publication status toggle via PATCH /businesses/me/publish
   */
  const handleTogglePublish = async () => {
    if (!token || publishing) return;
    setPublishFeedback(null);

    const targetStatus = !isPublished;
    setPublishing(true);
    const result = await setPublishStatus(targetStatus, token);
    setPublishing(false);

    if (result.success && result.data.business) {
      setIsPublished(Boolean(result.data.business.isPublished));
      setPublishFeedback({
        type: 'success',
        message: result.data.business.isPublished
          ? 'Profile is now published and visible to marketplace investors.'
          : 'Profile is now unpublished and hidden from discovery.'
      });
    } else {
      setPublishFeedback({
        type: 'error',
        message: result.error || 'Failed to update publication status'
      });
    }
  };

  if (loading) {
    return (
      <div className="marketplace-page">
        <LoadingState message="Loading your business profile..." />
      </div>
    );
  }

  return (
    <div className="marketplace-page">
      <div className="page-header">
        <h1 className="page-title">
          {profileExists ? 'Edit Business Profile' : 'Create Business Profile'}
        </h1>
        <p className="page-subtitle">
          {profileExists
            ? 'Manage your public metrics, pitch deck link, and investor discovery visibility.'
            : 'Fill in your enterprise profile to start connecting with strategic investors.'}
        </p>
      </div>

      <div className="profile-editor-layout">
        {/* Main Profile Form */}
        <div className="editor-card">
          <div className="editor-card-header">
            <h2 className="editor-card-title">Company Profile Details</h2>
            <p className="editor-card-subtitle">
              All public fields will be displayed to investors in the marketplace.
            </p>
          </div>

          {feedback && (
            <div
              className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-error'}`}
              style={{ marginBottom: '1.5rem' }}
            >
              <span>{feedback.message}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="auth-form" noValidate>
            {/* Company Name */}
            <div className="form-group">
              <label htmlFor="biz-name" className="form-label">
                Business Name *
              </label>
              <input
                id="biz-name"
                name="name"
                type="text"
                className="form-input"
                placeholder="e.g. Acme Technologies"
                value={formData.name}
                onChange={handleInputChange}
                required
                disabled={saving}
              />
            </div>

            {/* Tagline */}
            <div className="form-group">
              <label htmlFor="biz-tagline" className="form-label">
                Tagline * (1-line hook)
              </label>
              <input
                id="biz-tagline"
                name="tagline"
                type="text"
                className="form-input"
                placeholder="e.g. Next-generation fraud prevention for cross-border banking"
                value={formData.tagline}
                onChange={handleInputChange}
                required
                disabled={saving}
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="biz-description" className="form-label">
                Company Description *
              </label>
              <textarea
                id="biz-description"
                name="description"
                className="form-textarea"
                rows={5}
                placeholder="Explain your product, traction, business model, and competitive advantage..."
                value={formData.description}
                onChange={handleInputChange}
                required
                disabled={saving}
              />
            </div>

            {/* Two-column layout for classification */}
            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="biz-industry" className="form-label">
                  Industry / Sector *
                </label>
                <input
                  id="biz-industry"
                  name="industry"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Fintech, SaaS, Clean Energy"
                  value={formData.industry}
                  onChange={handleInputChange}
                  required
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label htmlFor="biz-stage" className="form-label">
                  Company Stage *
                </label>
                <input
                  id="biz-stage"
                  name="stage"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Seed, Series A, Profitable"
                  value={formData.stage}
                  onChange={handleInputChange}
                  required
                  disabled={saving}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="biz-country" className="form-label">
                  Country *
                </label>
                <input
                  id="biz-country"
                  name="country"
                  type="text"
                  className="form-input"
                  placeholder="e.g. United States, Brazil"
                  value={formData.country}
                  onChange={handleInputChange}
                  required
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label htmlFor="biz-city" className="form-label">
                  City *
                </label>
                <input
                  id="biz-city"
                  name="city"
                  type="text"
                  className="form-input"
                  placeholder="e.g. San Francisco, São Paulo"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  disabled={saving}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="biz-fundingGoal" className="form-label">
                  Target Funding Goal (USD) *
                </label>
                <input
                  id="biz-fundingGoal"
                  name="fundingGoal"
                  type="number"
                  min="1"
                  step="1"
                  className="form-input"
                  placeholder="e.g. 500000"
                  value={formData.fundingGoal}
                  onChange={handleInputChange}
                  required
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label htmlFor="biz-revenueRange" className="form-label">
                  Revenue Range *
                </label>
                <input
                  id="biz-revenueRange"
                  name="revenueRange"
                  type="text"
                  className="form-input"
                  placeholder="e.g. $100k-$500k ARR, Pre-revenue"
                  value={formData.revenueRange}
                  onChange={handleInputChange}
                  required
                  disabled={saving}
                />
              </div>
            </div>

            {/* Purpose */}
            <div className="form-group">
              <label htmlFor="biz-purpose" className="form-label">
                Use of Proceeds / Funding Purpose *
              </label>
              <textarea
                id="biz-purpose"
                name="purpose"
                className="form-textarea"
                rows={3}
                placeholder="How will this capital be allocated? (e.g. 40% engineering, 30% sales, 30% working capital)"
                value={formData.purpose}
                onChange={handleInputChange}
                required
                disabled={saving}
              />
            </div>

            {/* Confidential Private Fields */}
            <div style={{ marginTop: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                Confidential Materials (Protected)
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                These fields remain strictly hidden from public discovery. They are revealed only to
                verified investors whose expressions of interest you accept.
              </p>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="biz-contactEmail" className="form-label">
                  Direct Contact Email *
                </label>
                <input
                  id="biz-contactEmail"
                  name="contactEmail"
                  type="email"
                  className="form-input"
                  placeholder="founder@company.com"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  required
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label htmlFor="biz-pitch" className="form-label">
                  Private Pitch Link (Optional)
                </label>
                <input
                  id="biz-pitch"
                  name="privatePitchLink"
                  type="url"
                  className="form-input"
                  placeholder="https://docsend.com/view/example or Drive link"
                  value={formData.privatePitchLink}
                  onChange={handleInputChange}
                  disabled={saving}
                />
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={saving}
              >
                {saving
                  ? 'Saving Profile...'
                  : profileExists
                  ? 'Save Profile Changes'
                  : 'Create Business Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar: Publication & Preview Controls */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Publication Card */}
          <div className="publish-panel">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>
              Marketplace Publication
            </h3>

            <div className="publish-status-indicator">
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Current Status
              </span>
              <StatusLabel status={isPublished ? 'published' : 'unpublished'} />
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              {isPublished
                ? 'Your profile is live in the investor marketplace and discoverable through search and sector filters.'
                : 'Your profile is currently private. Publishing will make your public details discoverable to verified investors.'}
            </p>

            {publishFeedback && (
              <div
                className={`alert ${publishFeedback.type === 'success' ? 'alert-success' : 'alert-error'}`}
                style={{ marginBottom: '1rem' }}
              >
                <span>{publishFeedback.message}</span>
              </div>
            )}

            <button
              type="button"
              className={`btn btn-full ${isPublished ? 'btn-outline' : 'btn-primary'}`}
              onClick={handleTogglePublish}
              disabled={publishing || !profileExists}
              title={!profileExists ? 'Please save your profile first' : ''}
            >
              {publishing
                ? 'Updating...'
                : isPublished
                ? 'Unpublish Profile'
                : 'Publish to Marketplace'}
            </button>

            {!profileExists && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                * Save your profile before publishing.
              </p>
            )}
          </div>

          {/* Quick Preview Link */}
          {profileExists && businessId && (
            <div className="action-card">
              <h3 className="action-card-title">Public Preview</h3>
              <p className="action-card-text">
                Inspect how investors see your public business profile.
              </p>
              <Link
                to={`/businesses/${businessId}`}
                className="btn btn-outline btn-full"
              >
                Open Public Preview &rarr;
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default BusinessProfilePage;

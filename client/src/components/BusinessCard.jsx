import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Format currency number as USD string (e.g. $500,000)
 */
export const formatCurrency = (val) => {
  if (typeof val !== 'number' || isNaN(val)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(val);
};

/**
 * BusinessCard — Elegant marketplace business card
 *
 * @param {Object} props
 * @param {Object} props.business - Business public profile data
 * @param {boolean} [props.isSaved] - Whether the business is currently bookmarked
 * @param {boolean} [props.saveLoading] - Whether bookmark operation is in progress
 * @param {Function} [props.onToggleSave] - Handler to toggle bookmark (receives business.id)
 * @param {boolean} [props.showBookmark] - Whether to render the bookmark button (default: true for investors)
 */
const BusinessCard = ({
  business,
  isSaved = false,
  saveLoading = false,
  onToggleSave,
  showBookmark = true
}) => {
  if (!business) return null;

  const {
    id,
    name,
    tagline,
    industry,
    country,
    city,
    stage,
    revenueRange,
    fundingGoal
  } = business;

  const locationText = [city, country].filter(Boolean).join(', ');

  return (
    <article className="business-card">
      <div className="business-card-header">
        <Link to={`/businesses/${id}`} className="business-card-title">
          {name}
        </Link>
        {stage && <span className="status-pill status-pill-pending">{stage}</span>}
      </div>

      <p className="business-card-tagline">{tagline}</p>

      <div className="business-card-meta">
        <div className="meta-row-item">
          <span className="meta-row-label">Industry</span>
          <span className="meta-row-val">{industry || '—'}</span>
        </div>
        <div className="meta-row-item">
          <span className="meta-row-label">Location</span>
          <span className="meta-row-val">{locationText || '—'}</span>
        </div>
        <div className="meta-row-item">
          <span className="meta-row-label">Revenue</span>
          <span className="meta-row-val">{revenueRange || '—'}</span>
        </div>
        <div className="meta-row-item">
          <span className="meta-row-label">Target Funding</span>
          <span className="meta-row-val">{formatCurrency(fundingGoal)}</span>
        </div>
      </div>

      <div className="business-card-footer">
        <Link to={`/businesses/${id}`} className="btn btn-outline btn-sm">
          View Profile &rarr;
        </Link>

        {showBookmark && onToggleSave && (
          <button
            type="button"
            className={`btn-bookmark ${isSaved ? 'btn-bookmark-active' : ''}`}
            onClick={() => onToggleSave(id)}
            disabled={saveLoading}
            title={isSaved ? 'Remove from saved' : 'Save business'}
            aria-label={isSaved ? `Remove ${name} from saved` : `Save ${name}`}
          >
            <span>{isSaved ? '★' : '☆'}</span>
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        )}
      </div>
    </article>
  );
};

export default BusinessCard;

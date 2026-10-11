import React from 'react';

/**
 * Common preset options for filters
 */
const INDUSTRIES = [
  'Fintech',
  'Healthtech',
  'Edtech',
  'SaaS & Enterprise',
  'E-Commerce',
  'Clean Energy',
  'Logistics & Supply Chain',
  'Agtech',
  'Artificial Intelligence',
  'Other'
];

const STAGES = [
  'Idea / Pre-Seed',
  'Seed',
  'Early Stage (Series A)',
  'Growth Stage (Series B+)',
  'Bootstrapped / Profitable'
];

/**
 * BusinessFilters — Search and filtering controls for the investor marketplace
 */
const BusinessFilters = ({
  filters,
  onChange,
  onReset,
  loading = false
}) => {
  const handleInputChange = (field, value) => {
    onChange({
      ...filters,
      [field]: value
    });
  };

  const isMinMaxInvalid =
    filters.minFunding !== '' &&
    filters.maxFunding !== '' &&
    Number(filters.minFunding) > Number(filters.maxFunding);

  return (
    <div className="filter-panel">
      <div className="filter-grid">
        {/* Search Input */}
        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label htmlFor="filter-q" className="form-label">
            Search
          </label>
          <input
            id="filter-q"
            type="text"
            className="form-input"
            placeholder="Search by name, tagline, description..."
            value={filters.q || ''}
            onChange={(e) => handleInputChange('q', e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Industry Filter */}
        <div className="form-group">
          <label htmlFor="filter-industry" className="form-label">
            Industry
          </label>
          <select
            id="filter-industry"
            className="form-select"
            value={filters.industry || ''}
            onChange={(e) => handleInputChange('industry', e.target.value)}
            disabled={loading}
          >
            <option value="">All Industries</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>

        {/* Stage Filter */}
        <div className="form-group">
          <label htmlFor="filter-stage" className="form-label">
            Stage
          </label>
          <select
            id="filter-stage"
            className="form-select"
            value={filters.stage || ''}
            onChange={(e) => handleInputChange('stage', e.target.value)}
            disabled={loading}
          >
            <option value="">All Stages</option>
            {STAGES.map((stg) => (
              <option key={stg} value={stg}>
                {stg}
              </option>
            ))}
          </select>
        </div>

        {/* Country Filter */}
        <div className="form-group">
          <label htmlFor="filter-country" className="form-label">
            Country
          </label>
          <input
            id="filter-country"
            type="text"
            className="form-input"
            placeholder="e.g. United States, Brazil..."
            value={filters.country || ''}
            onChange={(e) => handleInputChange('country', e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Min Funding */}
        <div className="form-group">
          <label htmlFor="filter-min-funding" className="form-label">
            Min Goal ($)
          </label>
          <input
            id="filter-min-funding"
            type="number"
            min="0"
            className="form-input"
            placeholder="Min USD"
            value={filters.minFunding || ''}
            onChange={(e) => handleInputChange('minFunding', e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Max Funding */}
        <div className="form-group">
          <label htmlFor="filter-max-funding" className="form-label">
            Max Goal ($)
          </label>
          <input
            id="filter-max-funding"
            type="number"
            min="0"
            className="form-input"
            placeholder="Max USD"
            value={filters.maxFunding || ''}
            onChange={(e) => handleInputChange('maxFunding', e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Sort By */}
        <div className="form-group">
          <label htmlFor="filter-sort-by" className="form-label">
            Sort By
          </label>
          <select
            id="filter-sort-by"
            className="form-select"
            value={filters.sortBy || 'createdAt'}
            onChange={(e) => handleInputChange('sortBy', e.target.value)}
            disabled={loading}
          >
            <option value="createdAt">Date Listed</option>
            <option value="fundingGoal">Funding Goal</option>
            <option value="name">Company Name</option>
          </select>
        </div>

        {/* Order */}
        <div className="form-group">
          <label htmlFor="filter-order" className="form-label">
            Direction
          </label>
          <select
            id="filter-order"
            className="form-select"
            value={filters.order || 'desc'}
            onChange={(e) => handleInputChange('order', e.target.value)}
            disabled={loading}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        {/* Reset Action */}
        <div className="form-group filter-actions">
          <button
            type="button"
            className="btn btn-secondary btn-full"
            onClick={onReset}
            disabled={loading}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {isMinMaxInvalid && (
        <p style={{ marginTop: '0.75rem', color: '#991B1B', fontSize: '0.8rem' }}>
          * Minimum funding goal cannot exceed maximum funding goal.
        </p>
      )}
    </div>
  );
};

export default BusinessFilters;

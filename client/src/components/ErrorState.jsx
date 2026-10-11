import React from 'react';

/**
 * ErrorState — Error card with message and optional retry callback
 */
const ErrorState = ({ title = 'Something went wrong', message, onRetry }) => {
  return (
    <div className="state-box">
      <div className="state-icon">⚠️</div>
      <h2 className="state-title">{title}</h2>
      <p className="state-description">
        {message || 'An unexpected error occurred while processing your request.'}
      </p>
      {onRetry && (
        <button type="button" className="btn btn-outline" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorState;

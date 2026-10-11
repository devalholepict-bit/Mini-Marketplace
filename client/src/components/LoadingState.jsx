import React from 'react';

/**
 * LoadingState — Minimalist monochrome loading indicator
 */
const LoadingState = ({ message = 'Loading...' }) => {
  return (
    <div className="page-loading" role="status" aria-live="polite">
      <div className="spinner" />
      <p>{message}</p>
    </div>
  );
};

export default LoadingState;

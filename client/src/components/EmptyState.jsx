import React from 'react';
import { Link } from 'react-router-dom';

/**
 * EmptyState — Displays clean empty view with optional action button
 */
const EmptyState = ({
  icon = '◻',
  title = 'No items found',
  description = 'There are no records matching your criteria.',
  actionLabel,
  actionTo,
  onAction
}) => {
  return (
    <div className="state-box">
      <div className="state-icon">{icon}</div>
      <h2 className="state-title">{title}</h2>
      <p className="state-description">{description}</p>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn btn-primary">
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <button type="button" className="btn btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

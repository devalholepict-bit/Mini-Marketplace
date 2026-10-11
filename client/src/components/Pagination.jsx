import React from 'react';

/**
 * Pagination — Previous / Next pagination controls
 */
const Pagination = ({ page = 1, totalPages = 1, total = 0, onPageChange }) => {
  if (totalPages <= 1 && total === 0) return null;

  return (
    <div className="pagination">
      <span>
        Page <strong>{page}</strong> of <strong>{Math.max(totalPages, 1)}</strong>
        {total > 0 && ` (${total} total results)`}
      </span>
      <div className="pagination-controls">
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          &larr; Previous
        </button>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          Next &rarr;
        </button>
      </div>
    </div>
  );
};

export default Pagination;

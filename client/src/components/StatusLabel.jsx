import React from 'react';

/**
 * StatusLabel — Monochrome / silver status indicator pill
 * @param {Object} props
 * @param {'pending' | 'accepted' | 'declined' | 'published' | 'unpublished'} props.status
 */
const StatusLabel = ({ status }) => {
  const normalized = (status || '').toLowerCase();

  let className = 'status-pill';
  let label = status;

  switch (normalized) {
    case 'pending':
      className += ' status-pill-pending';
      label = 'Pending';
      break;
    case 'accepted':
      className += ' status-pill-accepted';
      label = 'Accepted';
      break;
    case 'declined':
      className += ' status-pill-declined';
      label = 'Declined';
      break;
    case 'published':
      className += ' status-pill-published';
      label = 'Published';
      break;
    case 'unpublished':
      className += ' status-pill-unpublished';
      label = 'Unpublished';
      break;
    default:
      className += ' status-pill-pending';
      label = status || 'Unknown';
  }

  return <span className={className}>{label}</span>;
};

export default StatusLabel;

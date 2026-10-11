import React, { useState, useEffect, useCallback } from 'react';
import { checkApiHealth } from '../api/apiClient';

const ApiStatus = () => {
  const [status, setStatus] = useState('checking'); // 'checking' | 'connected' | 'unavailable'
  const [healthData, setHealthData] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);

  const performHealthCheck = useCallback(async () => {
    setStatus('checking');
    setErrorDetails(null);

    const result = await checkApiHealth();

    if (result.success) {
      setStatus('connected');
      setHealthData(result.data);
    } else {
      setStatus('unavailable');
      setErrorDetails(result.error);
    }
  }, []);

  useEffect(() => {
    performHealthCheck();
  }, [performHealthCheck]);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  return (
    <div className="status-card">
      <div className="status-header">
        <div className="status-title">
          <span>Backend API Status</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {status === 'checking' && (
            <span className="badge badge-checking">
              <span className="badge-dot"></span> Checking...
            </span>
          )}
          {status === 'connected' && (
            <span className="badge badge-connected">
              <span className="badge-dot"></span> Connected
            </span>
          )}
          {status === 'unavailable' && (
            <span className="badge badge-unavailable">
              <span className="badge-dot"></span> Unavailable
            </span>
          )}
          <button 
            type="button" 
            className="retry-btn" 
            onClick={performHealthCheck}
            disabled={status === 'checking'}
          >
            {status === 'checking' ? 'Testing...' : 'Check Again'}
          </button>
        </div>
      </div>

      <div className="status-meta">
        <div className="meta-item">
          <span className="meta-label">Configured API Base URL</span>
          <span className="meta-value">{apiUrl}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Target Health Endpoint</span>
          <span className="meta-value">{apiUrl}/health</span>
        </div>
        {status === 'connected' && healthData && (
          <>
            <div className="meta-item">
              <span className="meta-label">Server Response</span>
              <span className="meta-value">{healthData.message}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Database Connection</span>
              <span className="meta-value" style={{ textTransform: 'capitalize' }}>
                {healthData.database || 'Not reported'}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Server Timestamp</span>
              <span className="meta-value">
                {new Date(healthData.timestamp).toLocaleString()}
              </span>
            </div>
          </>
        )}
        {status === 'unavailable' && (
          <div className="meta-item">
            <span className="meta-label">Diagnostic Info</span>
            <span className="meta-value" style={{ color: 'var(--status-error-text)' }}>
              {errorDetails || 'Cannot reach Express server. Run npm run dev:server.'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiStatus;

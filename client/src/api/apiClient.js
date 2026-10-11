import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Checks API server health
 * @returns {Promise<{success: boolean, message: string, timestamp?: string, error?: string}>}
 */
export const checkApiHealth = async () => {
  try {
    const response = await apiClient.get('/health');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'API is unavailable'
    };
  }
};

/**
 * Fetches published businesses for marketplace discovery
 * @param {Object} params - Query params (q, industry, stage, country, minFunding, maxFunding, page, limit, sortBy, order)
 * @param {string} [token] - Optional JWT token for authenticated investor
 */
export const getBusinesses = async (params = {}, token = null) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await apiClient.get('/businesses', { params, headers });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch businesses'
    };
  }
};

/**
 * Fetches single business profile by ID
 * @param {string} id - Business ID
 * @param {string} [token] - Optional JWT token
 */
export const getBusinessById = async (id, token = null) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await apiClient.get(`/businesses/${id}`, { headers });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch business details'
    };
  }
};

export default apiClient;

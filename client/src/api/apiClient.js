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

/**
 * Save a business for the authenticated investor
 * @param {string} businessId - Business ID to save
 * @param {string} [token] - JWT token
 */
export const saveBusiness = async (businessId, token = null) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await apiClient.post(`/investor/saved/${businessId}`, {}, { headers });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to save business'
    };
  }
};

/**
 * Remove a saved business for the authenticated investor
 * @param {string} businessId - Business ID to remove
 * @param {string} [token] - JWT token
 */
export const removeSavedBusiness = async (businessId, token = null) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await apiClient.delete(`/investor/saved/${businessId}`, { headers });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to remove saved business'
    };
  }
};

/**
 * Fetch saved businesses for the authenticated investor
 * @param {string} [token] - JWT token
 */
export const getSavedBusinesses = async (token = null) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await apiClient.get('/investor/saved', { headers });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch saved businesses'
    };
  }
};

/**
 * Create an expression of interest in a business
 * @param {Object} payload - { businessId, message }
 * @param {string} [token] - JWT token
 */
export const createInterest = async ({ businessId, message }, token = null) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await apiClient.post('/interests', { businessId, message }, { headers });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to submit expression of interest'
    };
  }
};

/**
 * Fetch expressions of interest sent by the authenticated investor
 * @param {string} [token] - JWT token
 */
export const getSentInterests = async (token = null) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await apiClient.get('/interests/sent', { headers });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch sent interests'
    };
  }
};

/**
 * Fetch expressions of interest received by the authenticated business owner
 * @param {string} [token] - JWT token
 */
export const getReceivedInterests = async (token = null) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await apiClient.get('/interests/received', { headers });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch received interests'
    };
  }
};

/**
 * Accept or decline an expression of interest
 * @param {string} interestId - Interest ID
 * @param {string} status - 'accepted' or 'declined'
 * @param {string} [token] - JWT token
 */
export const updateInterestStatus = async (interestId, status, token = null) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await apiClient.patch(`/interests/${interestId}/status`, { status }, { headers });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to update interest status'
    };
  }
};

export default apiClient;

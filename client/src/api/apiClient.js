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
 * Register a new user account
 * @param {Object} payload - { name, email, password, role }
 */
export const registerUser = async ({ name, email, password, role }) => {
  try {
    const response = await apiClient.post('/auth/register', { name, email, password, role });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Registration failed'
    };
  }
};

/**
 * Authenticate existing user
 * @param {Object} payload - { email, password }
 */
export const loginUser = async ({ email, password }) => {
  try {
    const response = await apiClient.post('/auth/login', { email, password });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Login failed'
    };
  }
};

/**
 * Get currently authenticated user profile
 * @param {string} token - JWT token
 */
export const getCurrentUser = async (token) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await apiClient.get('/auth/me', { headers });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch user profile'
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
      error: error.response?.data?.message || error.message || 'Failed to fetch business details',
      status: error.response?.status
    };
  }
};

/**
 * Fetches the authenticated business owner's profile
 * @param {string} token - JWT token
 */
export const getMyBusiness = async (token = null) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await apiClient.get('/businesses/me', { headers });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch business profile',
      status: error.response?.status
    };
  }
};

/**
 * Creates or updates the authenticated business owner's profile
 * @param {Object} profileData - Business profile attributes
 * @param {string} token - JWT token
 */
export const upsertMyBusiness = async (profileData, token = null) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await apiClient.put('/businesses/me', profileData, { headers });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to save business profile',
      status: error.response?.status
    };
  }
};

/**
 * Updates publication status of the authenticated business owner's profile
 * @param {boolean} isPublished - Publication flag
 * @param {string} token - JWT token
 */
export const setPublishStatus = async (isPublished, token = null) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await apiClient.patch('/businesses/me/publish', { isPublished }, { headers });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to update publication status',
      status: error.response?.status
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
      error: error.response?.data?.message || error.message || 'Failed to submit expression of interest',
      status: error.response?.status
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
      error: error.response?.data?.message || error.message || 'Failed to fetch sent interests',
      status: error.response?.status
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
      error: error.response?.data?.message || error.message || 'Failed to fetch received interests',
      status: error.response?.status
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
      error: error.response?.data?.message || error.message || 'Failed to update interest status',
      status: error.response?.status
    };
  }
};

/**
 * Fetch role-based dashboard statistics for authenticated user
 * @param {string} [token] - JWT token
 */
export const getDashboardStats = async (token = null) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await apiClient.get('/dashboard/stats', { headers });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch dashboard statistics'
    };
  }
};

export default apiClient;

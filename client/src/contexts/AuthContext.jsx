import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, registerUser, getCurrentUser } from '../api/apiClient';

const AuthContext = createContext(null);

/**
 * Provides authentication state and methods to the entire application.
 * Token is persisted in localStorage; user profile is fetched on mount via GET /auth/me.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => sessionStorage.getItem('meulink_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Restore session on mount: if a token exists in sessionStorage,
   * validate it by calling GET /auth/me.
   */
  useEffect(() => {
    const restoreSession = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      const result = await getCurrentUser(token);

      if (result.success) {
        setUser(result.data.user);
      } else {
        // Token is invalid or expired — clear it
        sessionStorage.removeItem('meulink_token');
        setToken(null);
        setUser(null);
      }

      setLoading(false);
    };

    restoreSession();
  }, [token]);

  /**
   * Login: POST /auth/login, store token and user on success.
   */
  const login = useCallback(async (email, password) => {
    setError(null);
    const result = await loginUser({ email, password });

    if (result.success) {
      const { token: newToken, user: userData } = result.data;
      sessionStorage.setItem('meulink_token', newToken);
      setToken(newToken);
      setUser(userData);
      return { success: true };
    }

    setError(result.error);
    return { success: false, error: result.error };
  }, []);

  /**
   * Register: POST /auth/register, store token and user on success.
   */
  const register = useCallback(async (name, email, password, role) => {
    setError(null);
    const result = await registerUser({ name, email, password, role });

    if (result.success) {
      const { token: newToken, user: userData } = result.data;
      sessionStorage.setItem('meulink_token', newToken);
      setToken(newToken);
      setUser(userData);
      return { success: true };
    }

    setError(result.error);
    return { success: false, error: result.error };
  }, []);

  /**
   * Logout: clear token and user from state and sessionStorage.
   */
  const logout = useCallback(() => {
    sessionStorage.removeItem('meulink_token');
    setToken(null);
    setUser(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to access auth context. Throws if used outside AuthProvider.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

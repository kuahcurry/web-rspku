import { useState, useEffect } from 'react';
import { getUser, getToken, isAuthenticated, logout as logoutUtil, clearAuth } from '../utils/auth';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = () => {
      try {
        if (isAuthenticated()) {
          const userData = getUser();
          setUser(userData);
          setIsAuth(true);
        } else {
          setUser(null);
          setIsAuth(false);
          clearAuth();
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setUser(null);
        setIsAuth(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (userData, token, tokenType, expiresIn) => {
    setUser(userData);
    setIsAuth(true);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('access_token', token);
    localStorage.setItem('token_type', tokenType);
    localStorage.setItem('token_expires_at', Date.now() + (expiresIn * 1000));
  };

  const logout = async () => {
    await logoutUtil();
    setUser(null);
    setIsAuth(false);
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const getAuthToken = () => {
    return getToken();
  };

  return {
    user,
    loading,
    isAuthenticated: isAuth,
    login,
    logout,
    updateUser,
    getAuthToken,
  };
};

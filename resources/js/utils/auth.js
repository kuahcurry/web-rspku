// Authentication utility functions

/**
 * Get the stored JWT token
 */
export const getToken = () => {
  return localStorage.getItem('access_token');
};

/**
 * Get the token type (usually 'bearer')
 */
export const getTokenType = () => {
  return localStorage.getItem('token_type') || 'bearer';
};

/**
 * Get the full authorization header value
 */
export const getAuthHeader = () => {
  const token = getToken();
  const tokenType = getTokenType();
  return token ? `${tokenType} ${token}` : null;
};

/**
 * Get the logged-in user data
 */
export const getUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  const token = getToken();
  const expiresAt = localStorage.getItem('token_expires_at');
  
  if (!token || !expiresAt) {
    return false;
  }
  
  // Check if token is expired
  if (Date.now() > parseInt(expiresAt)) {
    clearAuth();
    return false;
  }
  
  return true;
};

/**
 * Clear all authentication data
 */
export const clearAuth = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('token_type');
  localStorage.removeItem('user');
  localStorage.removeItem('token_expires_at');
};

/**
 * Logout user
 */
export const logout = async () => {
  const token = getToken();
  
  if (token) {
    try {
      // Call logout API to invalidate token on server
      await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': getAuthHeader(),
        },
      });
    } catch (error) {
      console.error('Logout API error:', error);
    }
  }
  
  clearAuth();
};

/**
 * Refresh the JWT token
 */
export const refreshToken = async () => {
  const token = getToken();
  
  if (!token) {
    return false;
  }
  
  try {
    const response = await fetch('/api/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': getAuthHeader(),
      },
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      localStorage.setItem('access_token', data.data.access_token);
      localStorage.setItem('token_type', data.data.token_type);
      localStorage.setItem('token_expires_at', Date.now() + (data.data.expires_in * 1000));
      return true;
    }
    
    clearAuth();
    return false;
  } catch (error) {
    console.error('Token refresh error:', error);
    clearAuth();
    return false;
  }
};

/**
 * Make an authenticated API request
 */
export const authenticatedFetch = async (url, options = {}) => {
  const authHeader = getAuthHeader();
  
  if (!authHeader) {
    throw new Error('Not authenticated');
  }
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': authHeader,
    },
  };
  
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, mergedOptions);
    
    // If unauthorized, try to refresh token once
    if (response.status === 401) {
      const refreshed = await refreshToken();
      
      if (refreshed) {
        // Retry the request with new token
        mergedOptions.headers.Authorization = getAuthHeader();
        return fetch(url, mergedOptions);
      } else {
        // Redirect to login
        window.location.href = '/login';
      }
    }
    
    return response;
  } catch (error) {
    console.error('Authenticated fetch error:', error);
    throw error;
  }
};

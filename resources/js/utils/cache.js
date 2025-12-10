/**
 * Simple cache utility with TTL (Time To Live)
 * Stores data in memory with expiration timestamps
 */

const cache = new Map();

export const cacheConfig = {
  // Cache duration in milliseconds
  TTL: {
    SHORT: 60 * 1000,        // 1 minute - for frequently changing data
    MEDIUM: 5 * 60 * 1000,   // 5 minutes - for semi-static data
    LONG: 15 * 60 * 1000,    // 15 minutes - for rarely changing data
    PROFILE: 30 * 60 * 1000  // 30 minutes - for user profile data
  }
};

/**
 * Get cached data
 * @param {string} key - Cache key
 * @returns {any|null} - Cached data or null if expired/not found
 */
export const getCached = (key) => {
  const cached = cache.get(key);
  
  if (!cached) return null;
  
  // Check if expired
  if (Date.now() > cached.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
};

/**
 * Set cache data with TTL
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttl - Time to live in milliseconds
 */
export const setCache = (key, data, ttl = cacheConfig.TTL.MEDIUM) => {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttl
  });
};

/**
 * Invalidate specific cache key
 * @param {string} key - Cache key to invalidate
 */
export const invalidateCache = (key) => {
  cache.delete(key);
};

/**
 * Invalidate all cache keys matching a pattern
 * @param {string|RegExp} pattern - Pattern to match cache keys
 */
export const invalidateCachePattern = (pattern) => {
  const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
  
  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
    }
  }
};

/**
 * Clear all cache
 */
export const clearCache = () => {
  cache.clear();
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  let valid = 0;
  let expired = 0;
  
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now > value.expiresAt) {
      expired++;
    } else {
      valid++;
    }
  }
  
  return { valid, expired, total: cache.size };
};

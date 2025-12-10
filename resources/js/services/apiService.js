import { authenticatedFetch } from '../utils/auth';
import { getCached, setCache, invalidateCache, cacheConfig } from '../utils/cache';

/**
 * Cached API service wrapper
 * Automatically caches GET requests and provides cache invalidation
 */

/**
 * Fetch with automatic caching
 * @param {string} url - API endpoint
 * @param {object} options - Fetch options
 * @param {number} ttl - Cache TTL (only for GET requests)
 * @returns {Promise<Response>}
 */
export const cachedFetch = async (url, options = {}, ttl = cacheConfig.TTL.MEDIUM) => {
  const method = options.method?.toUpperCase() || 'GET';
  
  // Only cache GET requests
  if (method === 'GET') {
    const cacheKey = `api:${url}`;
    const cached = getCached(cacheKey);
    
    if (cached) {
      // Return cached response
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Fetch and cache
    const response = await authenticatedFetch(url, options);
    
    if (response.ok) {
      const data = await response.clone().json();
      setCache(cacheKey, data, ttl);
    }
    
    return response;
  }
  
  // For non-GET requests, invalidate related cache and fetch
  if (method !== 'GET') {
    // Invalidate cache for this endpoint
    invalidateCache(`api:${url.split('?')[0]}`);
    
    // Invalidate related list endpoints on write operations
    if (url.includes('/riwayat-pendidikan')) {
      invalidateCache('api:/api/riwayat-pendidikan');
    } else if (url.includes('/penugasan')) {
      invalidateCache('api:/api/penugasan');
    } else if (url.includes('/kredensial')) {
      invalidateCache('api:/api/kredensial');
    } else if (url.includes('/status-kewenangan')) {
      invalidateCache('api:/api/status-kewenangan');
    } else if (url.includes('/etik-disiplin')) {
      invalidateCache('api:/api/etik-disiplin');
    } else if (url.includes('/prestasi-penghargaan')) {
      invalidateCache('api:/api/prestasi-penghargaan');
    } else if (url.includes('/dokumen-legalitas')) {
      invalidateCache('api:/api/dokumen-legalitas');
    }
  }
  
  return authenticatedFetch(url, options);
};

/**
 * Fetch all dashboard data with optimized caching
 */
export const fetchDashboardData = async () => {
  const cacheKey = 'dashboard:summary';
  const cached = getCached(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  // Fetch all data in parallel with caching
  const [
    dokumenRes,
    pendidikanRes,
    penugasanRes,
    kredensialRes,
    kewenanganRes,
    etikRes,
    prestasiRes
  ] = await Promise.all([
    cachedFetch('/api/dokumen-legalitas', {}, cacheConfig.TTL.LONG),
    cachedFetch('/api/riwayat-pendidikan', {}, cacheConfig.TTL.LONG),
    cachedFetch('/api/penugasan', {}, cacheConfig.TTL.LONG),
    cachedFetch('/api/kredensial', {}, cacheConfig.TTL.LONG),
    cachedFetch('/api/status-kewenangan', {}, cacheConfig.TTL.LONG),
    cachedFetch('/api/etik-disiplin', {}, cacheConfig.TTL.LONG),
    cachedFetch('/api/prestasi-penghargaan', {}, cacheConfig.TTL.LONG)
  ]);

  const [
    dokumenData,
    pendidikanData,
    penugasanData,
    kredensialData,
    kewenanganData,
    etikData,
    prestasiData
  ] = await Promise.all([
    dokumenRes.json(),
    pendidikanRes.json(),
    penugasanRes.json(),
    kredensialRes.json(),
    kewenanganRes.json(),
    etikRes.json(),
    prestasiRes.json()
  ]);

  const result = {
    dokumen: dokumenData,
    pendidikan: pendidikanData,
    penugasan: penugasanData,
    kredensial: kredensialData,
    kewenangan: kewenanganData,
    etik: etikData,
    prestasi: prestasiData
  };
  
  // Cache the combined result
  setCache(cacheKey, result, cacheConfig.TTL.MEDIUM);
  
  return result;
};

/**
 * Prefetch data for a page (call this before navigation)
 */
export const prefetchPageData = async (page) => {
  const endpoints = {
    pendidikan: '/api/riwayat-pendidikan',
    penugasan: '/api/penugasan',
    kredensial: '/api/kredensial',
    kewenangan: '/api/status-kewenangan',
    etik: '/api/etik-disiplin',
    prestasi: '/api/prestasi-penghargaan',
    dokumen: '/api/dokumen-legalitas'
  };
  
  const endpoint = endpoints[page];
  if (endpoint) {
    // Fetch in background, ignore result (it will be cached)
    cachedFetch(endpoint, {}, cacheConfig.TTL.LONG).catch(() => {});
  }
};

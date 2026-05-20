import api from './api';

export type BackendStatus = 'checking' | 'connected' | 'disconnected';

/**
 * Check if the backend is healthy
 */
export const checkBackendHealth = async (): Promise<BackendStatus> => {
  try {
    const response = await api.get('/public/health');
    if (response.data?.status === 'ok') {
      localStorage.setItem('backendStatus', 'connected');
      return 'connected';
    }
    return 'disconnected';
  } catch (error) {
    console.error('Backend health check failed:', error);
    localStorage.setItem('backendStatus', 'disconnected');
    return 'disconnected';
  }
};

/**
 * Get the cached backend status from localStorage
 */
export const getCachedBackendStatus = (): BackendStatus => {
  const status = localStorage.getItem('backendStatus');
  if (status === 'connected' || status === 'disconnected') {
    return status;
  }
  return 'checking';
};

/**
 * Check if backend is connected (cached or fresh check)
 */
export const isBackendConnected = async (forceCheck = false): Promise<boolean> => {
  if (!forceCheck) {
    const cached = getCachedBackendStatus();
    if (cached === 'connected') return true;
    if (cached === 'disconnected') return false;
  }
  const status = await checkBackendHealth();
  return status === 'connected';
};

/**
 * Check backend health and redirect to login if disconnected (for admin pages)
 */
export const checkBackendHealthWithRedirect = async (router: any): Promise<boolean> => {
  const status = await checkBackendHealth();
  if (status === 'disconnected') {
    router.push('/admin/login');
    return false;
  }
  return true;
};

import { apiRequest } from './apiClient';
import type { DashboardResponse } from '../types/dashboard';
import { cachedGet, cachedSet } from './cache/clientCache';
import { CacheTags, CacheTTL } from './cache/cacheKeys';

export const dashboardService = {
  getDashboard: (opts?: { force?: boolean }) =>
    cachedGet(
      'dashboard',
      () => apiRequest<DashboardResponse>('/api/v1/dashboard', { method: 'GET' }),
      {
        ttlMs: CacheTTL.DASHBOARD,
        tags: [CacheTags.DASHBOARD, CacheTags.USER],
        force: opts?.force,
        store: 'idb',
      }
    ),

  /** Push a known-good dashboard payload into cache (e.g. after local apply). */
  putDashboard: (data: DashboardResponse) =>
    cachedSet('dashboard', data, {
      ttlMs: CacheTTL.DASHBOARD,
      tags: [CacheTags.DASHBOARD, CacheTags.USER],
      store: 'idb',
    }),
};

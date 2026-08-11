import { apiRequest } from './apiClient';
import type { DashboardResponse } from '../types/dashboard';

export const dashboardService = {
  getDashboard: () => apiRequest<DashboardResponse>('/api/v1/dashboard', { method: 'GET' }),
};

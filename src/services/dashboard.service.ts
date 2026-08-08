import { api } from '@/lib/axios';
import type { DashboardSummaryResponse, DashboardSummaryData } from '@/types/dashboard';

export const dashboardService = {
  getSummary: async (): Promise<DashboardSummaryData> => {
    // The Axios interceptors automatically attach the Bearer token.
    // We unwrap response.data to get the standard API envelope, 
    // and then .data again to get the actual payload.
    const response = await api.get<DashboardSummaryResponse>('/dashboard/summary');
    return response.data.data;
  }
};

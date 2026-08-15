import { api } from '@/lib/axios';

export interface DashboardSummary {
  petCount: number;
  appointmentCount: number;
  balance: number;
  vaccinesDueCount: number;
  activeBoardingCount: number;
  activeTrainingCount: number;
  upcomingAppointment?: any;
  vaccinationReminder?: any;
  trainingProgress?: any;
  boardingStatus?: any;
  outstandingInvoice?: any;
  recentPayments: any[];
  recentMessages: any[];
  notifications: any[];
  recentActivity: any[];
  unreadMessageCount: number;
  unreadNotificationCount: number;
}

export const dashboardService = {
  getSummary: async (): Promise<DashboardSummary> => {
    // The Axios interceptors automatically attach the Bearer token.
    const response = await api.get('/portal/dashboard');
    const data = response.data?.data || {};
    const stats = data.statistics || {};

    return {
      petCount: stats.totalPets ?? 0,
      appointmentCount: stats.totalAppointments ?? 0,
      balance: Number(stats.totalOutstandingBalance) || 0,
      vaccinesDueCount: 0,
      activeBoardingCount: 0,
      activeTrainingCount: 0,
      upcomingAppointment: data.upcomingAppointment || undefined,
      vaccinationReminder: undefined,
      trainingProgress: undefined,
      boardingStatus: undefined,
      outstandingInvoice: (data.outstandingInvoices && data.outstandingInvoices.length > 0) ? data.outstandingInvoices[0] : undefined,
      recentPayments: [],
      recentMessages: [],
      notifications: [],
      recentActivity: [],
      unreadMessageCount: 0,
      unreadNotificationCount: 0
    };
  }
};

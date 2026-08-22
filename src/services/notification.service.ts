import { api } from '../lib/axios';

export interface NotificationPreferences {
  appointment_reminders: boolean;
  invoice_alerts: boolean;
  pet_health_updates: boolean;
  marketing_updates: boolean;
}

export const notificationService = {
  getPreferences: async (): Promise<NotificationPreferences> => {
    const { data } = await api.get('/portal/notification-preferences');
    return data.data; // data inside the success wrapper
  },

  updatePreferences: async (preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
    const { data } = await api.put('/portal/notification-preferences', preferences);
    return data.data;
  },
};

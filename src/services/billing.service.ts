import { api } from '@/lib/axios';
import type { Invoice, CreatePaymentPayload, PaymentResponse } from '@/types/billing';

export const billingService = {
  getInvoices: async (): Promise<Invoice[]> => {
    const response = await api.get<{ success: boolean; data: Invoice[] }>('/portal/invoices');
    return response.data.data;
  },

  createPayment: async (payload: CreatePaymentPayload): Promise<PaymentResponse> => {
    const response = await api.post<PaymentResponse>('/portal/payment', payload);
    return response.data;
  }
};

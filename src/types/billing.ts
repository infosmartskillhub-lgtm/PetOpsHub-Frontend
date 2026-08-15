export interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  status: string;
  payment_status: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  outstanding_balance: number;
  currency: string;
}

export interface CreatePaymentPayload {
  invoice_id: string;
  payment_method: string;
  amount: number;
  currency: string;
  transaction_reference: string;
  notes?: string;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  payment_id: string;
  payment_status: string;
  invoice_id: string;
  amount: number;
  currency: string;
  transaction_reference: string;
}

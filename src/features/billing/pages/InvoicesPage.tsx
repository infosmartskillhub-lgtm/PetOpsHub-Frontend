import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingService } from '@/services/billing.service';
import type { Invoice, CreatePaymentPayload } from '@/types/billing';
import { Receipt, DollarSign, AlertCircle, CheckCircle2, CreditCard, X } from 'lucide-react';

export const InvoicesPage = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'All' | 'Outstanding' | 'Paid'>('All');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Manual');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  const { data: invoices, isLoading, isError, refetch } = useQuery({
    queryKey: ['portal-invoices'],
    queryFn: billingService.getInvoices,
  });

  const paymentMutation = useMutation({
    mutationFn: billingService.createPayment,
    onSuccess: (data) => {
      setPaymentSuccessMessage(`Payment of ${data.amount} ${data.currency} successful! (Ref: ${data.transaction_reference})`);
      setPaymentError(null);
      setSelectedInvoice(null);
      queryClient.invalidateQueries({ queryKey: ['portal-invoices'] });
      // Clear success message after 5 seconds
      setTimeout(() => setPaymentSuccessMessage(null), 5000);
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || error.message || 'Payment failed';
      setPaymentError(msg);
    },
  });

  const handleMakePaymentClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.outstanding_balance.toString());
    setPaymentMethod('Manual');
    setPaymentNotes('');
    setPaymentError(null);
    setPaymentSuccessMessage(null);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    
    setPaymentError(null);

    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setPaymentError('Amount must be greater than zero.');
      return;
    }
    if (amountNum > selectedInvoice.outstanding_balance) {
      setPaymentError('Amount cannot exceed outstanding balance.');
      return;
    }

    const payload: CreatePaymentPayload = {
      invoice_id: selectedInvoice.id,
      payment_method: paymentMethod,
      amount: amountNum,
      currency: selectedInvoice.currency,
      transaction_reference: crypto.randomUUID(),
      notes: paymentNotes || undefined,
    };

    paymentMutation.mutate(payload);
  };

  const filteredInvoices = invoices?.filter(inv => {
    if (filter === 'All') return true;
    if (filter === 'Paid') return inv.payment_status === 'Paid';
    if (filter === 'Outstanding') return inv.payment_status !== 'Paid' && inv.outstanding_balance > 0;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-slate-900">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-900 p-8 text-slate-200">
        <div className="mx-auto max-w-5xl rounded-lg border border-red-800 bg-red-900/20 p-6 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h2 className="mb-2 text-xl font-semibold text-red-200">Error Loading Invoices</h2>
          <p className="mb-6 text-slate-400">We could not load your billing information. Please try again.</p>
          <button 
            onClick={() => refetch()}
            className="rounded-lg bg-red-600 px-6 py-2 font-medium text-white transition-colors hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-slate-200">
      <div className="mx-auto max-w-5xl space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Invoices & Payments</h1>
          <p className="mt-2 text-slate-400">View your billing history and make payments for outstanding balances.</p>
        </div>

        {/* Success Message */}
        {paymentSuccessMessage && (
          <div className="flex items-center gap-3 rounded-lg border border-teal-800 bg-teal-900/30 p-4 text-teal-300">
            <CheckCircle2 className="h-5 w-5" />
            <p className="font-medium">{paymentSuccessMessage}</p>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {(['All', 'Outstanding', 'Paid'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Layout with potential side panel */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Main Invoice List */}
          <div className={`space-y-4 ${selectedInvoice ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            {(!filteredInvoices || filteredInvoices.length === 0) ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700/50 bg-slate-800/30 py-16">
                <Receipt className="mb-4 h-12 w-12 text-slate-500" />
                <h3 className="text-lg font-medium text-slate-300">No invoices found</h3>
                <p className="text-sm text-slate-500">There are no {filter.toLowerCase()} invoices to display.</p>
              </div>
            ) : (
              filteredInvoices.map((invoice) => (
                <div key={invoice.id} className="rounded-xl border border-slate-800 bg-slate-800/80 p-5 shadow-sm transition-all hover:border-slate-700">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-white">Invoice #{invoice.invoice_number}</h3>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          invoice.payment_status === 'Paid' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800' :
                          invoice.payment_status === 'Partially Paid' ? 'bg-blue-900/50 text-blue-400 border border-blue-800' :
                          'bg-orange-900/50 text-orange-400 border border-orange-800'
                        }`}>
                          {invoice.payment_status}
                        </span>
                        <span className="inline-flex rounded-full bg-slate-700/50 px-2.5 py-0.5 text-xs font-medium text-slate-300 border border-slate-600">
                          {invoice.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-400">Date: {invoice.invoice_date}</p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-xl font-bold text-white">
                        {invoice.outstanding_balance > 0 ? (
                          <span className="text-orange-400">{invoice.outstanding_balance.toFixed(2)} {invoice.currency} due</span>
                        ) : (
                          <span className="text-emerald-400">Paid in full</span>
                        )}
                      </p>
                      <p className="text-sm text-slate-400">Total: {invoice.total_amount.toFixed(2)} {invoice.currency}</p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-700/50 pt-4 sm:grid-cols-4">
                    <DetailField label="Subtotal" value={`${invoice.subtotal.toFixed(2)} ${invoice.currency}`} />
                    <DetailField label="Tax" value={`${invoice.tax_amount.toFixed(2)} ${invoice.currency}`} />
                    <DetailField label="Discount" value={`-${invoice.discount_amount.toFixed(2)} ${invoice.currency}`} />
                    <DetailField label="Paid" value={`${invoice.paid_amount.toFixed(2)} ${invoice.currency}`} />
                  </div>

                  {/* Payment Action */}
                  {invoice.payment_status !== 'Paid' && invoice.outstanding_balance > 0 && (
                    <div className="mt-5 border-t border-slate-700/50 pt-4 text-right">
                      <button
                        onClick={() => handleMakePaymentClick(invoice)}
                        className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                      >
                        <DollarSign className="h-4 w-4" />
                        Make Payment
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Payment Panel */}
          {selectedInvoice && (
            <div className="lg:col-span-1">
              <div className="sticky top-8 rounded-xl border border-slate-700 bg-slate-800 p-5 shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Make a Payment</h2>
                  <button 
                    onClick={() => setSelectedInvoice(null)}
                    className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mb-6 rounded-lg bg-slate-900/50 p-4 border border-slate-700">
                  <p className="text-sm text-slate-400">Paying Invoice</p>
                  <p className="font-semibold text-slate-200">#{selectedInvoice.invoice_number}</p>
                  <div className="mt-2 flex justify-between">
                    <span className="text-sm text-slate-400">Amount Due:</span>
                    <span className="font-medium text-orange-400">{selectedInvoice.outstanding_balance.toFixed(2)} {selectedInvoice.currency}</span>
                  </div>
                </div>

                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                  {paymentError && (
                    <div className="rounded-md bg-red-900/50 p-3 text-sm text-red-200 border border-red-800">
                      {paymentError}
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      required
                    >
                      <option value="Manual">Manual Processing</option>
                      {/* More methods could be added here if backend supports them */}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Amount ({selectedInvoice.currency})</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={selectedInvoice.outstanding_balance}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Notes (Optional)</label>
                    <textarea
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      placeholder="Add any payment notes..."
                    />
                  </div>

                  <p className="text-xs text-slate-500 italic">
                    Note: This is a direct system payment submission. Transaction references are generated securely.
                  </p>

                  <button
                    type="submit"
                    disabled={paymentMutation.isPending}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {paymentMutation.isPending ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5" />
                        Submit Payment
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

const DetailField = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <p className="text-xs text-slate-500">{label}</p>
    <p className="font-medium text-slate-300">{value}</p>
  </div>
);

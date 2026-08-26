import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';
import { 
  PawPrint, Calendar, DollarSign, Activity, Settings2, 
  Syringe, Home, MessageSquare, FileText
} from 'lucide-react';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: dashboardService.getSummary,
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
      <div className="p-8">
        <div className="rounded-lg bg-red-900/50 p-4 text-red-200 border border-red-800">
          <p className="font-semibold">Error Loading Dashboard</p>
          <p className="text-sm opacity-80">We could not load your dashboard summary. Please try again later.</p>
        </div>
      </div>
    );
  }

  const safeBalance = Number.isFinite(data?.balance) ? Number(data?.balance) : 0;

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-slate-200">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400">Welcome back! Here's an overview of your pet operations.</p>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard title="My Pets" value={data?.petCount ?? 0} icon={PawPrint} color="text-teal-400" />
          <KpiCard title="Appointments" value={data?.appointmentCount ?? 0} icon={Calendar} color="text-blue-400" />
          <KpiCard title="Balance" value={`$${safeBalance.toFixed(2)}`} icon={DollarSign} color="text-green-400" />
          <KpiCard title="Vaccines Due" value={data?.vaccinesDueCount ?? 0} icon={Syringe} color="text-orange-400" />
          <KpiCard title="Active Boarding" value={data?.activeBoardingCount ?? 0} icon={Home} color="text-indigo-400" />
          <KpiCard title="Active Training" value={data?.activeTrainingCount ?? 0} icon={Activity} color="text-pink-400" />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Left Column - Priority Items */}
          <div className="space-y-6 lg:col-span-2">
            {/* Upcoming Appointment */}
            <SectionCard title="Upcoming Appointment">
              <div className="flex h-32 items-center justify-center rounded-lg border border-slate-700/50 bg-slate-800/50 border-dashed">
                <p className="text-slate-400">No upcoming appointments scheduled</p>
              </div>
            </SectionCard>

            {/* Boarding Status */}
            <SectionCard title="Boarding Status">
              <div className="flex h-32 items-center justify-center rounded-lg border border-slate-700/50 bg-slate-800/50 border-dashed">
                <p className="text-slate-400">No active boarding stays</p>
              </div>
            </SectionCard>

            {/* Training Progress */}
            <SectionCard title="Training Progress">
              <div className="flex h-32 items-center justify-center rounded-lg border border-slate-700/50 bg-slate-800/50 border-dashed">
                <p className="text-slate-400">No active training programs</p>
              </div>
            </SectionCard>
          </div>

          {/* Right Column - Secondary Items */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <SectionCard title="Quick Actions">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <ActionButton icon={Calendar} label="Book Appt" onClick={() => navigate('/appointments')} />
                <ActionButton icon={FileText} label="Records" onClick={() => navigate('/medical-records')} />
                <ActionButton icon={FileText} label="Documents" onClick={() => navigate('/documents')} />
                <ActionButton icon={MessageSquare} label="Messages" onClick={() => navigate('/messages')} />
                <ActionButton icon={Settings2} label="Settings" onClick={() => navigate('/settings')} />
              </div>
            </SectionCard>

            {/* Outstanding Invoices */}
            <SectionCard title="Outstanding Invoices">
              {data && safeBalance > 0 ? (
                <div className="flex flex-col justify-between rounded-lg border border-orange-800/50 bg-orange-900/20 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-orange-900/50 p-2 text-orange-400">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-orange-400">
                        Total Due: ${safeBalance.toFixed(2)}
                      </p>
                      {data?.outstandingInvoice && (
                        <p className="text-sm text-slate-400">
                          Includes Invoice #{data.outstandingInvoice.invoice_number}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/invoices')}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500/20 py-2 text-sm font-medium text-orange-400 transition-colors hover:bg-orange-500/30"
                  >
                    View Invoices
                  </button>
                </div>
              ) : (
                <div className="flex flex-col h-24 items-center justify-center rounded-lg border border-slate-700/50 bg-slate-800/50 border-dashed">
                  <p className="text-sm text-slate-400">No pending invoices</p>
                  <button
                    onClick={() => navigate('/invoices')}
                    className="mt-2 text-xs font-medium text-teal-400 hover:underline"
                  >
                    View Billing History
                  </button>
                </div>
              )}
            </SectionCard>

            {/* Recent Messages */}
            <SectionCard title="Recent Messages">
              <div className="flex flex-col h-24 items-center justify-center rounded-lg border border-slate-700/50 bg-slate-800/50 border-dashed">
                <p className="text-sm text-slate-400">View your conversations</p>
                <button
                  onClick={() => navigate('/messages')}
                  className="mt-2 text-xs font-medium text-teal-400 hover:underline"
                >
                  Open Messages
                </button>
              </div>
            </SectionCard>

            {/* Vaccination Reminders */}
            <SectionCard title="Vaccination Reminders">
              <div className="flex h-24 items-center justify-center rounded-lg border border-slate-700/50 bg-slate-800/50 border-dashed">
                <p className="text-sm text-slate-400">All vaccinations up to date</p>
              </div>
            </SectionCard>
          </div>

        </div>
      </div>
    </div>
  );
};

// --- Subcomponents ---

const KpiCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="rounded-xl border border-slate-800 bg-slate-800/80 p-5 shadow-sm transition-all hover:border-slate-700 hover:bg-slate-800">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-slate-400">{title}</p>
      <Icon className={`h-5 w-5 ${color}`} />
    </div>
    <div className="mt-4">
      <h3 className="text-2xl font-bold text-white">{value}</h3>
    </div>
  </div>
);

const SectionCard = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-800/80 p-6 shadow-sm">
    <h2 className="mb-4 text-lg font-semibold text-white">{title}</h2>
    {children}
  </div>
);

const ActionButton = ({ icon: Icon, label, onClick }: any) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-2 rounded-lg bg-slate-700/50 p-4 transition-colors hover:bg-slate-700"
  >
    <Icon className="h-5 w-5 text-teal-400" />
    <span className="text-xs font-medium text-slate-200">{label}</span>
  </button>
);

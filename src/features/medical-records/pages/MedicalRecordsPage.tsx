import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { petService } from '@/services/pet.service';
import { medicalRecordService } from '@/services/medical-record.service';
import type { Pet } from '@/types/pet';
import {
  FileText,
  Calendar,
  AlertCircle,
  ClipboardList,
  ArrowLeft,
  Activity
} from 'lucide-react';

export const MedicalRecordsPage = () => {
  const navigate = useNavigate();
  const [selectedPetId, setSelectedPetId] = useState<string>('');

  // 1. Fetch Client's Pets
  const {
    data: petData,
    isLoading: petsLoading,
    isError: petsError,
  } = useQuery({
    queryKey: ['pets'],
    queryFn: () => petService.getAll({ limit: 100 }),
  });

  const pets: Pet[] = petData?.data ?? [];
  const activePets = pets.filter((p) => p.status === 'Active');

  // Auto-select first pet if none selected
  useEffect(() => {
    if (!selectedPetId && activePets.length > 0) {
      setSelectedPetId(activePets[0].id);
    }
  }, [activePets, selectedPetId]);

  // 2. Fetch Medical Records for selected pet
  const {
    data: records,
    isLoading: recordsLoading,
    isError: recordsError,
  } = useQuery({
    queryKey: ['medical-records', selectedPetId],
    queryFn: () => medicalRecordService.getByPetId(selectedPetId),
    enabled: !!selectedPetId, // Only fetch if a pet is selected
    retry: 2,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 sm:p-8 text-slate-200">
      <div className="mx-auto max-w-5xl space-y-8">
        
        {/* Header & Back Button */}
        <div>
          <button
            onClick={() => navigate('/dashboard')}
            className="mb-4 flex items-center text-sm font-medium text-teal-400 hover:text-teal-300 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <FileText className="h-8 w-8 text-teal-500" />
                Medical Records
              </h1>
              <p className="mt-1 text-slate-400">
                View read-only medical history and clinical notes for your pets.
              </p>
            </div>
            
            {/* Pet Selector */}
            {!petsLoading && !petsError && activePets.length > 0 && (
              <div className="min-w-[200px]">
                <label htmlFor="pet-select" className="sr-only">Select Pet</label>
                <select
                  id="pet-select"
                  value={selectedPetId}
                  onChange={(e) => setSelectedPetId(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-200 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                >
                  <option value="" disabled>Select a pet...</option>
                  {activePets.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.pet_name} ({pet.species})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Pet Loading / Error States */}
        {petsLoading && (
          <div className="flex h-32 items-center justify-center rounded-xl border border-slate-800 bg-slate-800/50">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
          </div>
        )}

        {petsError && (
          <div className="flex items-center gap-3 rounded-lg border border-red-900/50 bg-red-900/20 p-4 text-red-400">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load your pets. Please try refreshing the page.</p>
          </div>
        )}

        {!petsLoading && !petsError && activePets.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-700 bg-slate-800/50 p-12 text-center border-dashed">
            <FileText className="mb-4 h-12 w-12 text-slate-600" />
            <h3 className="text-lg font-medium text-slate-300">No Active Pets</h3>
            <p className="mt-2 text-slate-400">You must have an active pet to view medical records.</p>
          </div>
        )}

        {/* Records Display */}
        {selectedPetId && (
          <div className="space-y-6">
            {recordsLoading && (
              <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800 bg-slate-800/30">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
                  <p className="text-sm text-slate-400">Loading medical records...</p>
                </div>
              </div>
            )}

            {recordsError && (
              <div className="flex items-center gap-3 rounded-lg border border-red-900/50 bg-red-900/20 p-4 text-red-400">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p>Failed to load medical records for this pet. Ensure you have the correct permissions or try again later.</p>
              </div>
            )}

            {!recordsLoading && !recordsError && records && records.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-700 bg-slate-800/30 p-12 text-center border-dashed">
                <ClipboardList className="mb-4 h-12 w-12 text-slate-600" />
                <h3 className="text-lg font-medium text-slate-300">No Medical Records</h3>
                <p className="mt-2 max-w-md text-slate-400 text-sm">
                  There are no medical records available for this pet yet. Records will appear here after a veterinary visit.
                </p>
              </div>
            )}

            {!recordsLoading && !recordsError && records && records.length > 0 && (
              <div className="grid gap-6">
                {records.map((record) => (
                  <div
                    key={record.id}
                    className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800/80 shadow-sm transition-all hover:border-slate-600"
                  >
                    {/* Record Header */}
                    <div className="border-b border-slate-700 bg-slate-800 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/10 text-teal-400">
                          <Activity className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            {record.visit_type} Visit
                          </h3>
                          <div className="flex items-center text-sm text-slate-400 mt-1 gap-1.5">
                            <Calendar className="h-4 w-4" />
                            {formatDate(record.visit_date)}
                            {record.visit_time && ` at ${record.visit_time}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          record.visit_status === 'Completed' ? 'bg-green-500/10 text-green-400' :
                          record.visit_status === 'Cancelled' ? 'bg-red-500/10 text-red-400' :
                          'bg-blue-500/10 text-blue-400'
                        }`}>
                          {record.visit_status}
                        </span>
                      </div>
                    </div>

                    {/* Record Details */}
                    <div className="px-6 py-5 grid gap-6 sm:grid-cols-2">
                      {record.chief_complaint && (
                        <div className="sm:col-span-2">
                          <h4 className="text-sm font-medium text-slate-400 mb-1.5">Chief Complaint / Reason</h4>
                          <p className="text-slate-200 text-sm bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                            {record.chief_complaint}
                          </p>
                        </div>
                      )}

                      {record.history_of_present_illness && (
                        <div className="sm:col-span-2">
                          <h4 className="text-sm font-medium text-slate-400 mb-1.5">History</h4>
                          <p className="text-slate-200 text-sm whitespace-pre-wrap">
                            {record.history_of_present_illness}
                          </p>
                        </div>
                      )}

                      {record.physical_examination && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-400 mb-1.5">Physical Examination</h4>
                          <p className="text-slate-200 text-sm whitespace-pre-wrap">
                            {record.physical_examination}
                          </p>
                        </div>
                      )}

                      {record.diagnosis_summary && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-400 mb-1.5">Diagnosis Summary</h4>
                          <p className="text-slate-200 text-sm whitespace-pre-wrap">
                            {record.diagnosis_summary}
                          </p>
                        </div>
                      )}

                      {record.treatment_summary && (
                        <div className="sm:col-span-2">
                          <h4 className="text-sm font-medium text-slate-400 mb-1.5">Treatment Summary</h4>
                          <p className="text-slate-200 text-sm whitespace-pre-wrap">
                            {record.treatment_summary}
                          </p>
                        </div>
                      )}

                      {record.notes && (
                        <div className="sm:col-span-2">
                          <h4 className="text-sm font-medium text-slate-400 mb-1.5">Clinical Notes</h4>
                          <p className="text-slate-200 text-sm whitespace-pre-wrap">
                            {record.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

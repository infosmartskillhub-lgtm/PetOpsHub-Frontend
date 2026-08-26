import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Syringe, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { petService } from '@/services/pet.service';
import { api } from '@/lib/axios';

interface Vaccination {
  id: string;
  pet_id: string;
  vaccine_name: string;
  date_given: string;
  expiration_date: string;
  status: string;
  veterinarian?: string;
  notes?: string;
}

interface VaccinationResponse {
  success: boolean;
  data: Vaccination[];
}

const vaccinationService = {
  getByPetId: async (petId: string): Promise<Vaccination[]> => {
    const response = await api.get<VaccinationResponse>(`/portal/pets/${petId}/vaccinations`);
    return response.data.data;
  }
};

export const VaccinationsPage = () => {
  const [selectedPetId, setSelectedPetId] = useState<string>('');

  // 1. Fetch Pets
  const { data: petsResponse, isLoading: isLoadingPets } = useQuery({
    queryKey: ['pets'],
    queryFn: () => petService.getAll(),
  });

  const pets = petsResponse?.data || [];

  // Auto-select first pet if none selected
  useEffect(() => {
    if (pets.length > 0 && !selectedPetId) {
      setSelectedPetId(pets[0].id);
    }
  }, [pets, selectedPetId]);

  // 2. Fetch Vaccinations for selected pet
  const { data: vaccinations, isLoading: isLoadingVax, isError } = useQuery({
    queryKey: ['vaccinations', selectedPetId],
    queryFn: () => vaccinationService.getByPetId(selectedPetId),
    enabled: !!selectedPetId,
  });

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'valid': return <CheckCircle2 className="h-4 w-4" />;
      case 'expired': return <AlertCircle className="h-4 w-4" />;
      case 'due soon': return <Clock className="h-4 w-4" />;
      default: return <Syringe className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'valid': return 'bg-green-400/10 text-green-400 border-green-400/20';
      case 'expired': return 'bg-red-400/10 text-red-400 border-red-400/20';
      case 'due soon': return 'bg-orange-400/10 text-orange-400 border-orange-400/20';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  if (isLoadingPets) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Vaccinations</h1>
            <p className="text-slate-400">View immunization records for your pets.</p>
          </div>
          
          {pets.length > 0 && (
            <div className="w-full sm:w-64">
              <select
                value={selectedPetId}
                onChange={(e) => setSelectedPetId(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-sm text-slate-200 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                {pets.map(pet => (
                  <option key={pet.id} value={pet.id}>{pet.pet_name} ({pet.species})</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {pets.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-12 text-center">
            <Syringe className="mx-auto h-12 w-12 text-slate-600" />
            <h3 className="mt-4 text-lg font-medium text-slate-300">No Pets Found</h3>
            <p className="mt-2 text-sm text-slate-500">You don't have any pets registered in your account yet.</p>
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-red-900/50 bg-red-900/20 p-6 text-center text-red-400">
            <AlertCircle className="mx-auto h-8 w-8 mb-2" />
            <p>Error loading vaccination records. Please try again later.</p>
          </div>
        ) : isLoadingVax ? (
          <div className="flex h-48 items-center justify-center rounded-xl border border-slate-800 bg-slate-800/30">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
          </div>
        ) : !vaccinations || vaccinations.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-12 text-center">
            <Syringe className="mx-auto h-12 w-12 text-slate-600" />
            <h3 className="mt-4 text-lg font-medium text-slate-300">No Vaccinations Found</h3>
            <p className="mt-2 text-sm text-slate-500">There are no vaccination records for this pet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-800/50 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-medium">Vaccine</th>
                    <th className="px-6 py-4 font-medium">Date Given</th>
                    <th className="px-6 py-4 font-medium">Expiration</th>
                    <th className="px-6 py-4 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {vaccinations.map((vax) => (
                    <tr key={vax.id} className="transition-colors hover:bg-slate-800/30">
                      <td className="px-6 py-4 font-medium text-slate-200">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-slate-800 p-2">
                            <Syringe className="h-4 w-4 text-teal-400" />
                          </div>
                          {vax.vaccine_name}
                        </div>
                      </td>
                      <td className="px-6 py-4">{new Date(vax.date_given).toLocaleDateString()}</td>
                      <td className="px-6 py-4">{new Date(vax.expiration_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusColor(vax.status)}`}>
                          {getStatusIcon(vax.status)}
                          {vax.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { getClientPetVaccinations, type Vaccination } from '../../lib/dashboard.service';

export default function Vaccinations() {
  const [petId, setPetId] = useState<string>('');
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Example pet selector placeholder for testing purposes
  // In a real integration, this would come from a context or pet list hook
  const availablePets = [
    { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Buddy' }
  ];

  useEffect(() => {
    if (!petId) {
      setVaccinations([]);
      return;
    }

    const fetchVaccinations = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getClientPetVaccinations(petId);
        setVaccinations(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load vaccinations');
      } finally {
        setLoading(false);
      }
    };

    fetchVaccinations();
  }, [petId]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Pet Vaccinations</h1>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Pet</label>
        <select
          className="border rounded p-2 w-full max-w-xs"
          value={petId}
          onChange={(e) => setPetId(e.target.value)}
        >
          <option value="">-- Select a Pet --</option>
          {availablePets.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {loading && <p className="text-gray-500">Loading vaccinations...</p>}

      {error && <p className="text-red-500 bg-red-50 p-3 rounded">{error}</p>}

      {!loading && !error && petId && vaccinations.length === 0 && (
        <p className="text-gray-500 italic">No vaccination records found for this pet.</p>
      )}

      {!loading && !error && vaccinations.length > 0 && (
        <div className="space-y-4">
          {vaccinations.map(v => (
            <div key={v.id} className="border p-4 rounded bg-white shadow-sm">
              <h3 className="font-semibold text-lg">{v.custom_vaccine_name || 'Vaccination'}</h3>
              <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                <div><span className="text-gray-500">Administered:</span> {new Date(v.administration_date).toLocaleDateString()}</div>
                <div><span className="text-gray-500">Next Due:</span> {v.next_due_date ? new Date(v.next_due_date).toLocaleDateString() : 'N/A'}</div>
                <div><span className="text-gray-500">Status:</span> {v.status}</div>
                <div><span className="text-gray-500">Clinic:</span> {v.clinic_name || 'N/A'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

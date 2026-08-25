import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { petService } from '@/services/pet.service';
import type { Pet } from '@/types/pet';
import { getClientPetDocuments, type PetDocument } from '@/lib/dashboard.service';
import { FileText, PawPrint, AlertCircle, File, Search, SearchX } from 'lucide-react';

export const DocumentsPage = () => {
  const [selectedPetId, setSelectedPetId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch active pets for the selector
  const { 
    data: petData, 
    isLoading: petsLoading, 
    isError: petsError 
  } = useQuery({
    queryKey: ['my-pets'],
    queryFn: () => petService.getAll({ limit: 100 }),
  });

  const pets: Pet[] = petData?.data ?? [];
  const activePets = pets.filter((p: Pet) => p.status === 'Active');

  // Auto-select the first active pet
  useEffect(() => {
    if (activePets.length > 0 && !selectedPetId) {
      setSelectedPetId(activePets[0].id);
    }
  }, [activePets, selectedPetId]);

  // Fetch documents for selected pet
  const {
    data: documents,
    isLoading: documentsLoading,
    isError: documentsError,
    refetch
  } = useQuery({
    queryKey: ['documents', selectedPetId],
    queryFn: () => getClientPetDocuments(selectedPetId),
    enabled: !!selectedPetId,
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const filteredDocuments = (documents || []).filter((doc: PetDocument) => {
    const q = searchQuery.toLowerCase();
    return (
      doc.document_title.toLowerCase().includes(q) ||
      doc.document_type.toLowerCase().includes(q) ||
      (doc.description && doc.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-slate-200">
      <div className="mx-auto max-w-5xl space-y-8">
        
        {/* Header & Pet Selector */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <FileText className="h-8 w-8 text-teal-400" />
              Documents
            </h1>
            <p className="mt-2 text-slate-400">
              View important documents and certificates for your pets.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {!petsLoading && !petsError && activePets.length > 0 && (
              <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800 p-2">
                <PawPrint className="h-5 w-5 text-teal-400" />
                <select
                  value={selectedPetId}
                  onChange={(e) => setSelectedPetId(e.target.value)}
                  className="bg-transparent text-sm font-medium text-white outline-none focus:ring-0"
                >
                  {activePets.map((pet: Pet) => (
                    <option key={pet.id} value={pet.id} className="bg-slate-800">
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
            <PawPrint className="mb-4 h-12 w-12 text-slate-600" />
            <h3 className="text-lg font-medium text-slate-300">No Active Pets</h3>
            <p className="mt-2 text-slate-400">You must have an active pet to view documents.</p>
          </div>
        )}

        {/* Search & Documents Display */}
        {selectedPetId && (
          <div className="space-y-6">
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search documents by title, type, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-3 pl-10 pr-4 text-white placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {documentsLoading && (
              <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800 bg-slate-800/30">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
                  <p className="text-sm text-slate-400">Loading documents...</p>
                </div>
              </div>
            )}

            {documentsError && (
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-red-900/50 bg-red-900/20 p-8 text-red-400">
                <AlertCircle className="h-8 w-8 flex-shrink-0" />
                <p>Failed to load documents for this pet.</p>
                <button
                  onClick={() => refetch()}
                  className="mt-2 rounded-md bg-red-900/40 px-4 py-2 text-sm hover:bg-red-900/60 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {!documentsLoading && !documentsError && documents && documents.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-700 bg-slate-800/30 p-12 text-center border-dashed">
                <File className="mb-4 h-12 w-12 text-slate-600" />
                <h3 className="text-lg font-medium text-slate-300">No Documents Found</h3>
                <p className="mt-2 max-w-md text-slate-400 text-sm">
                  There are no documents uploaded for this pet yet.
                </p>
              </div>
            )}

            {!documentsLoading && !documentsError && documents && documents.length > 0 && filteredDocuments.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-700 bg-slate-800/30 p-12 text-center border-dashed">
                <SearchX className="mb-4 h-12 w-12 text-slate-600" />
                <h3 className="text-lg font-medium text-slate-300">No Matches Found</h3>
                <p className="mt-2 max-w-md text-slate-400 text-sm">
                  No documents match your search "{searchQuery}".
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-teal-400 hover:underline text-sm font-medium"
                >
                  Clear Search
                </button>
              </div>
            )}

            {!documentsLoading && !documentsError && filteredDocuments.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredDocuments.map((doc: PetDocument) => (
                  <div
                    key={doc.id}
                    className="flex flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-800/80 shadow-sm transition-all hover:border-teal-500/50"
                  >
                    <div className="flex items-start justify-between border-b border-slate-700 bg-slate-800 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-teal-400 uppercase tracking-wider">{doc.document_type}</p>
                          <h3 className="mt-0.5 font-semibold text-white truncate max-w-[180px]" title={doc.document_title}>
                            {doc.document_title}
                          </h3>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 p-4 space-y-3">
                      {doc.description && (
                        <p className="text-sm text-slate-300 line-clamp-2" title={doc.description}>
                          {doc.description}
                        </p>
                      )}
                      
                      <div className="grid grid-cols-2 gap-3 text-sm text-slate-400">
                        {doc.issue_date && (
                          <div>
                            <span className="block text-xs font-medium text-slate-500">Issued</span>
                            {formatDate(doc.issue_date)}
                          </div>
                        )}
                        {doc.expiry_date && (
                          <div>
                            <span className="block text-xs font-medium text-slate-500">Expires</span>
                            <span className={new Date(doc.expiry_date) < new Date() ? 'text-red-400' : ''}>
                              {formatDate(doc.expiry_date)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs font-medium text-slate-500 bg-slate-900 px-2 py-1 rounded">
                          {formatFileSize(doc.file_size)}
                        </span>
                        
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                          doc.status === 'Active' ? 'bg-green-500/10 text-green-400' :
                          doc.status === 'Expired' ? 'bg-red-500/10 text-red-400' :
                          'bg-slate-500/10 text-slate-400'
                        }`}>
                          {doc.status}
                        </span>
                      </div>
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

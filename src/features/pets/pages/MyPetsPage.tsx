// src/features/pets/pages/MyPetsPage.tsx
// My Pets page — lists all pets for the authenticated client's organisation.
//
// Data flow:
//   useQuery(['pets', search, page]) → petService.getAll({ search, page, limit })
//     → GET /pets (Bearer token injected by Axios interceptor in lib/axios.ts)
//       → { success, data: Pet[], total, page, limit }
//
// Design conventions match DashboardPage.tsx:
//   - bg-slate-900 base, slate-800/80 cards, teal-400/500 accent
//   - Same loading spinner, same error card pattern
//   - lucide-react icons, Tailwind utility classes

import { useState, type FormEvent } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { petService } from '@/services/pet.service';
import type { Pet } from '@/types/pet';
import {
  PawPrint,
  Plus,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_LIMIT = 10;

// ─── Status badge ─────────────────────────────────────────────────────────────
// Colours map directly to PetStatus = 'Active' | 'Inactive' | 'Deceased'
const STATUS_STYLES: Record<string, string> = {
  Active:   'bg-teal-500/15 text-teal-300   border border-teal-500/30',
  Inactive: 'bg-slate-500/15 text-slate-400  border border-slate-500/30',
  Deceased: 'bg-red-500/15   text-red-400    border border-red-500/30',
};

const StatusBadge = ({ status }: { status: string }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status] ?? STATUS_STYLES['Inactive']}`}
  >
    {status}
  </span>
);

// ─── Pet avatar ───────────────────────────────────────────────────────────────
// Shows photo_url when present; falls back to first-letter monogram.
const PetAvatar = ({ pet }: { pet: Pet }) => {
  if (pet.photo_url) {
    return (
      <img
        src={pet.photo_url}
        alt={pet.pet_name}
        className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-slate-700"
      />
    );
  }
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-500/20 ring-2 ring-teal-500/30">
      <span className="text-xl font-bold text-teal-400">
        {pet.pet_name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
};

// ─── Detail field ─────────────────────────────────────────────────────────────
const DetailField = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
    <span className="text-sm text-slate-300">{value}</span>
  </div>
);

// ─── Pet card ─────────────────────────────────────────────────────────────────
const PetCard = ({ pet }: { pet: Pet }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-800/80 p-5 shadow-sm transition-all hover:border-slate-700 hover:bg-slate-800">
    {/* Top row: avatar + name/code + status */}
    <div className="flex items-start gap-4">
      <PetAvatar pet={pet} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-white">{pet.pet_name}</h3>
            <p className="mt-0.5 font-mono text-xs text-slate-500">{pet.pet_code}</p>
          </div>
          <StatusBadge status={pet.status} />
        </div>
      </div>
    </div>

    {/* Detail grid */}
    <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-700/60 pt-4">
      <DetailField label="Species" value={pet.species} />
      <DetailField label="Breed"   value={pet.breed  ?? '—'} />
      <DetailField label="Gender"  value={pet.gender ?? '—'} />
    </div>
  </div>
);

// ─── Create Pet Modal ────────────────────────────────────────────────────────
interface CreatePetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreatePetModal = ({ isOpen, onClose, onSuccess }: CreatePetModalProps) => {
  const [formData, setFormData] = useState({ pet_name: '', species: '' });
  
  const mutation = useMutation({
    mutationFn: petService.create,
    onSuccess: () => {
      onSuccess();
      onClose();
      setFormData({ pet_name: '', species: '' });
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-slate-800 p-6 shadow-xl ring-1 ring-slate-700">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Add New Pet</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {mutation.isError && (
          <div className="mb-4 rounded-lg bg-red-900/30 p-3 text-sm text-red-400 border border-red-800">
            Failed to add pet. Please try again.
          </div>
        )}

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(formData as any);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Pet Name *</label>
            <input
              required
              type="text"
              value={formData.pet_name}
              onChange={(e) => setFormData(p => ({ ...p, pet_name: e.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-200 placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="E.g., Max"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Species *</label>
            <input
              required
              type="text"
              value={formData.species}
              onChange={(e) => setFormData(p => ({ ...p, species: e.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-200 placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="E.g., Dog"
            />
          </div>
          
          <div className="mt-6 flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !formData.pet_name || !formData.species}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {mutation.isPending ? 'Adding...' : 'Add Pet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Page Component ──────────────────────────────────────────────────────
export const MyPetsPage = () => {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['pets', search, page],
    queryFn: () =>
      petService.getAll({
        search: search.trim() || undefined, // omit empty string — backend treats absence differently
        page,
        limit: PAGE_LIMIT,
      }),
  });

  const pets       = data?.data  ?? [];
  const total      = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  // Commit search and reset to page 1
  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-slate-900">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl border border-red-800 bg-red-900/50 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
              <div>
                <p className="font-semibold text-red-200">Failed to load pets</p>
                <p className="mt-1 text-sm text-red-300/80">
                  Could not reach the server. Check your connection and try again.
                </p>
              </div>
            </div>
            <button
              onClick={() => void refetch()}
              className="mt-4 flex items-center gap-2 rounded-lg bg-red-800/60 px-4 py-2 text-sm font-medium text-red-200 transition-colors hover:bg-red-800"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-900 p-8 text-slate-200">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Header ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">My Pets</h1>
            <p className="mt-1 text-slate-400">
              View and manage all pets registered to your account.
            </p>
          </div>
          {/* Add Pet */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-teal-500"
            aria-label="Add Pet"
          >
            <Plus className="h-4 w-4" />
            Add Pet
          </button>
        </div>

        <CreatePetModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => void refetch()}
        />

        {/* Search bar ─────────────────────────────────────────────────────── */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              id="pets-search"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, pet code, or microchip…"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-500"
          >
            Search
          </button>
          {/* Clear button — only visible when a search is committed */}
          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-200"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </form>

        {/* Results summary ─────────────────────────────────────────────────── */}
        {total > 0 && (
          <p className="text-sm text-slate-500">
            Showing{' '}
            <span className="text-slate-300">{pets.length}</span> of{' '}
            <span className="text-slate-300">{total}</span>{' '}
            {total === 1 ? 'pet' : 'pets'}
            {search && (
              <>
                {' '}matching{' '}
                <span className="text-slate-300">"{search}"</span>
              </>
            )}
          </p>
        )}

        {/* Empty state ─────────────────────────────────────────────────────── */}
        {pets.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-800/40 py-20 text-center">
            <PawPrint className="mb-4 h-12 w-12 text-slate-600" />
            <h3 className="text-lg font-semibold text-white">
              {search ? 'No pets found' : 'No pets registered yet'}
            </h3>
            <p className="mt-1 max-w-xs text-sm text-slate-400">
              {search
                ? `No pets matched "${search}". Try adjusting your search.`
                : 'Your registered pets will appear here once added.'}
            </p>
            {search && (
              <button
                onClick={handleClearSearch}
                className="mt-4 text-sm font-medium text-teal-400 transition-colors hover:text-teal-300"
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Pet grid ───────────────────────────────────────────────────────── */}
        {pets.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {pets.map((pet) => (
              <PetCard key={pet.id} pet={pet} />
            ))}
          </div>
        )}

        {/* Pagination ─────────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/60 px-5 py-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <span className="text-sm text-slate-400">
              Page{' '}
              <span className="font-semibold text-white">{page}</span>
              {' '}of{' '}
              <span className="font-semibold text-white">{totalPages}</span>
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Manual refresh ─────────────────────────────────────────────────── */}
        <div className="flex justify-end">
          <button
            onClick={() => void refetch()}
            className="flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-300"
            aria-label="Refresh pet list"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>

      </div>
    </div>
  );
};

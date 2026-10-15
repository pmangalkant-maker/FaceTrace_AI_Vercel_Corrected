import React, { useState, useEffect } from 'react';
import type { Case } from '../types';
import { api } from '../services/api';
import { CaseCard } from '../components/cases/CaseCard';
import { Search, Filter, RotateCcw, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

interface CasesSearchPageProps {
  initialQuery?: string;
  onNavigate: (tab: string, caseId?: string) => void;
}

export const CasesSearchPage: React.FC<CasesSearchPageProps> = ({
  initialQuery = '',
  onNavigate,
}) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  const fetchCases = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getCases({
        q: searchQuery,
        status: statusFilter,
        gender: genderFilter,
        age_min: ageMin || undefined,
        age_max: ageMax || undefined,
        state: stateFilter || undefined,
        city: cityFilter || undefined,
        page,
        limit: 12,
      });

      setCases(res.cases);
      setTotal(res.total);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      setError(err.message || 'Failed to query cases.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [page, statusFilter, genderFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCases();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setGenderFilter('all');
    setAgeMin('');
    setAgeMax('');
    setStateFilter('');
    setCityFilter('');
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Missing-Person Registry Search
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Search verified missing-person bulletins by personal identifiers, location, or case numbers.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by full name, nickname, bulletin #, or circumstances..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 text-white text-xs sm:text-sm font-semibold rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            Apply Search
          </button>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3 py-2 bg-slate-100 text-slate-700 text-xs sm:text-sm font-medium rounded-md hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
            title="Reset all filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </form>

        {/* Status Segmented Control */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-xs">
            {[
              { id: 'all', label: 'All Cases' },
              { id: 'active', label: 'Active Only' },
              { id: 'located', label: 'Located' },
              { id: 'resolved', label: 'Resolved' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 font-medium rounded transition-colors whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Demographic Filters */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <label htmlFor="gender-select" className="text-slate-500 font-medium">Gender:</label>
              <select
                id="gender-select"
                value={genderFilter}
                onChange={(e) => {
                  setGenderFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs focus:ring-1 focus:ring-slate-900"
              >
                <option value="all">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-slate-500 font-medium">Age:</label>
              <input
                type="number"
                placeholder="Min"
                value={ageMin}
                onChange={(e) => setAgeMin(e.target.value)}
                className="w-14 bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
              />
              <span className="text-slate-400">&ndash;</span>
              <input
                type="number"
                placeholder="Max"
                value={ageMax}
                onChange={(e) => setAgeMax(e.target.value)}
                className="w-14 bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Filter by city/state"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-32 bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-200 pb-3">
        <div>
          Showing <strong className="font-semibold text-slate-900 tabular-nums">{cases.length}</strong> of{' '}
          <strong className="font-semibold text-slate-900 tabular-nums">{total}</strong> registered bulletins
        </div>
        <div className="font-mono text-slate-400">
          Page {page} of {totalPages}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Case Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-lg p-4 h-80 animate-pulse">
              <div className="bg-slate-200 aspect-square rounded mb-4"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : cases.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {cases.map((caseItem) => (
            <CaseCard
              key={caseItem.id}
              caseItem={caseItem}
              onClick={() => onNavigate('case-detail', caseItem.id)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-3">
          <Filter className="w-10 h-10 text-slate-400 mx-auto stroke-[1.25]" />
          <h3 className="text-base font-semibold text-slate-900">
            No matching case bulletins found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search criteria, widening the age range, or resetting filters.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-2 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-md hover:bg-slate-800 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 pt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-xs font-mono text-slate-600">
            Page {page} / {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

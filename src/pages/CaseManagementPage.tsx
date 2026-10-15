import React, { useState, useEffect } from 'react';
import type { Case } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  FileEdit,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Save,
  X,
  Eye,
} from 'lucide-react';

interface CaseManagementPageProps {
  onNavigate: (tab: string, caseId?: string) => void;
}

export const CaseManagementPage: React.FC<CaseManagementPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Edit fields
  const [editStatus, setEditStatus] = useState<string>('active');
  const [editCircumstances, setEditCircumstances] = useState('');
  const [editFeatures, setEditFeatures] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchCases = async () => {
    setIsLoading(true);
    try {
      const res = await api.getCases({ limit: 50 });
      setCases(res.cases);
      if (res.cases.length > 0 && !selectedCase) {
        selectForEdit(res.cases[0]);
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to query cases.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const selectForEdit = (c: Case) => {
    setSelectedCase(c);
    setEditStatus(c.status);
    setEditCircumstances(c.circumstances || '');
    setEditFeatures(c.distinguishing_features || '');
    setResolutionNotes('');
    setActionMessage(null);
    setErrorMessage(null);
  };

  const handleSaveUpdates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;

    setIsSaving(true);
    setActionMessage(null);
    setErrorMessage(null);

    try {
      // 1. Update details
      await api.updateCase(selectedCase.id, {
        circumstances: editCircumstances,
        distinguishing_features: editFeatures,
      });

      // 2. If status changed, update status
      if (editStatus !== selectedCase.status) {
        await api.updateCaseStatus(selectedCase.id, editStatus, resolutionNotes || undefined);
      }

      setActionMessage('Case bulletin updated successfully.');
      await fetchCases();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update case.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCase = async () => {
    if (!selectedCase) return;
    if (!confirm(`Are you certain you wish to delete case ${selectedCase.case_number} (${selectedCase.full_name}) per retention policy?`)) {
      return;
    }

    try {
      await api.deleteCase(selectedCase.id);
      setActionMessage('Case record deleted per retention policy.');
      setSelectedCase(null);
      await fetchCases();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete case.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Case Coordinator Management Hub
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Authorized workspace for managing bulletin lifecycle, investigative statuses, and resolution notes.
        </p>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Case Selector Column (4 cols) */}
        <div className="md:col-span-4 bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Registered Bulletins ({cases.length})
          </h2>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {cases.map((c) => (
              <div
                key={c.id}
                onClick={() => selectForEdit(c)}
                className={`p-3 rounded border text-xs cursor-pointer transition-all ${
                  selectedCase?.id === c.id
                    ? 'border-slate-900 bg-slate-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-slate-500 font-mono text-[11px]">
                  <span>{c.case_number}</span>
                  <span className="capitalize font-semibold text-slate-800">{c.status}</span>
                </div>
                <div className="font-bold text-slate-900 mt-1">{c.full_name}</div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">
                  {c.last_seen_city}, {c.last_seen_state} &middot; Missing {c.date_missing}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Editor Workspace Column (8 cols) */}
        <div className="md:col-span-8 bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
          {selectedCase ? (
            <form onSubmit={handleSaveUpdates} className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="text-xs font-mono text-slate-500">{selectedCase.case_number}</div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedCase.full_name}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('case-detail', selectedCase.id)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Public View</span>
                </button>
              </div>

              {/* Status Selector */}
              <div>
                <label htmlFor="edit-status-select" className="block text-xs font-semibold text-slate-900 mb-1">
                  Bulletin Status Lifecycle *
                </label>
                <select
                  id="edit-status-select"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs font-medium text-slate-900"
                >
                  <option value="active">Active (Actively Seeking Public Leads)</option>
                  <option value="located">Located (Individual Safely Accounted For)</option>
                  <option value="resolved">Resolved (Case Investigation Concluded)</option>
                  <option value="suspended">Suspended (Search Operations Paused)</option>
                </select>
              </div>

              {editStatus !== 'active' && (
                <div>
                  <label htmlFor="resolution-notes-input" className="block text-xs font-semibold text-slate-900 mb-1">
                    Outcome / Resolution Notes (Logged to Audit Trail)
                  </label>
                  <input
                    id="resolution-notes-input"
                    type="text"
                    placeholder="e.g. Individual located safely in Portland; family notified."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs"
                  />
                </div>
              )}

              {/* Distinguishing Marks */}
              <div>
                <label htmlFor="edit-features-input" className="block text-xs font-semibold text-slate-900 mb-1">
                  Distinguishing Features & Tattoos
                </label>
                <textarea
                  id="edit-features-input"
                  rows={2}
                  value={editFeatures}
                  onChange={(e) => setEditFeatures(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs"
                />
              </div>

              {/* Circumstances narrative */}
              <div>
                <label htmlFor="edit-circumstances-input" className="block text-xs font-semibold text-slate-900 mb-1">
                  Investigative Circumstances Narrative
                </label>
                <textarea
                  id="edit-circumstances-input"
                  rows={5}
                  value={editCircumstances}
                  onChange={(e) => setEditCircumstances(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                {user && ['admin', 'case_manager'].includes(user.role) && (
                  <button
                    type="button"
                    onClick={handleDeleteCase}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 text-xs font-medium rounded flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Retention Purge</span>
                  </button>
                )}

                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving Changes...' : 'Save Case Updates'}</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="text-center py-16 text-slate-500 text-xs">
              Select a case bulletin on the left to edit information.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import type { Sighting, AuditLogItem, User, DatabaseStats } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Forward,
  Clock,
  UserCheck,
  Database,
  History,
  AlertCircle,
  Eye,
  Camera,
  MapPin,
  RefreshCw,
} from 'lucide-react';

interface AdminDashboardPageProps {
  onNavigate: (tab: string, caseId?: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'moderation' | 'audit' | 'users' | 'system'>('moderation');

  // Moderation state
  const [pendingSightings, setPendingSightings] = useState<Sighting[]>([]);
  const [moderatorNotes, setModeratorNotes] = useState<Record<string, string>>({});
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

  // Audit log state
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');

  // User management state
  const [userList, setUserList] = useState<User[]>([]);

  // System stats state
  const [stats, setStats] = useState<DatabaseStats | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      if (activeTab === 'moderation') {
        const res = await api.getPendingSightings();
        setPendingSightings(res.sightings);
      } else if (activeTab === 'audit') {
        const res = await api.getAuditLogs({ action: actionFilter || undefined, page: auditPage });
        setAuditLogs(res.logs);
        setAuditTotalPages(res.totalPages || 1);
      } else if (activeTab === 'users') {
        const res = await api.getAdminUsers();
        setUserList(res.users);
      } else if (activeTab === 'system') {
        const res = await api.getAdminStats();
        setStats(res.stats);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load administrative data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, auditPage, actionFilter]);

  const handleModerate = async (
    sightingId: string,
    action: 'verified_by_moderator' | 'dismissed' | 'forwarded_to_police'
  ) => {
    setIsProcessingId(sightingId);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const notes = moderatorNotes[sightingId] || '';
      await api.moderateSighting(sightingId, action, notes);
      setStatusMessage(`Sighting marked as ${action.replace(/_/g, ' ')}.`);
      setPendingSightings((prev) => prev.filter((s) => s.id !== sightingId));
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to moderate sighting.');
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleUpdateRole = async (targetUserId: string, newRole: string, isVerified: boolean) => {
    setStatusMessage(null);
    try {
      await api.updateUserRole(targetUserId, newRole, isVerified);
      setStatusMessage('User authorization updated.');
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update user authorization.');
    }
  };

  if (!user || !['admin', 'law_enforcement'].includes(user.role)) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <ShieldCheck className="w-10 h-10 text-red-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-600">
          This portal requires verified administrative or law enforcement credentials.
        </p>
        <button
          onClick={() => onNavigate('signin')}
          className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded hover:bg-slate-800"
        >
          Sign In with Authorized Account
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-slate-800" />
            <span>Role-Protected Administrative Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Moderation & System Governance
          </h1>
        </div>

        <button
          onClick={loadData}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded flex items-center gap-1.5 transition-colors self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('moderation')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'moderation'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Sighting Moderation Queue ({pendingSightings.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'audit'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Tamper-Evident Audit Trail
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          User Authorization & Roles
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'system'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Database Integrity & Storage
        </button>
      </div>

      {/* Tab 1: Moderation Queue */}
      {activeTab === 'moderation' && (
        <div className="space-y-6">
          <div className="text-xs text-slate-600">
            Carefully review incoming community leads before publishing to case bulletins. Sightings can be verified for public display, forwarded directly to detectives as confidential leads, or dismissed.
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded-lg">
              Checking moderation pipeline...
            </div>
          ) : pendingSightings.length > 0 ? (
            <div className="space-y-6">
              {pendingSightings.map((s) => (
                <div
                  key={s.id}
                  className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4"
                >
                  {/* Sighting header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-mono text-slate-500">
                        PENDING SIGHTING #{s.id} &middot; Received {s.created_at}
                      </div>
                      <h3 className="text-base font-bold text-slate-900">
                        Referenced Case: {s.case_full_name} ({s.case_number})
                      </h3>
                      <div className="text-xs text-slate-500 font-mono">
                        Police Case Reference: {s.police_case_number}
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigate('case-detail', s.case_id)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded self-start transition-colors"
                    >
                      View Case Bulletin &rarr;
                    </button>
                  </div>

                  {/* Sighting content grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                    {/* Observed Location & Submitter */}
                    <div className="space-y-3 bg-slate-50 p-4 rounded border border-slate-200">
                      <div>
                        <span className="text-slate-500 block">Sighting Date:</span>
                        <strong className="text-slate-900 font-mono">{s.sighting_date}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Reported Location:</span>
                        <strong className="text-slate-900">
                          {s.city}, {s.state}, {s.country}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Site Details:</span>
                        <span className="text-slate-700">{s.location_notes}</span>
                      </div>
                      <div className="border-t border-slate-200 pt-2">
                        <span className="text-slate-500 block">Submitter Information:</span>
                        <div className="font-semibold text-slate-900">{s.submitter_name}</div>
                        <div className="font-mono text-slate-600">{s.submitter_contact}</div>
                      </div>
                    </div>

                    {/* Sighting Description */}
                    <div className="md:col-span-2 space-y-3">
                      <div>
                        <span className="text-slate-500 font-medium block mb-1">
                          Eyewitness Narrative & Observation:
                        </span>
                        <p className="bg-slate-50 p-3 rounded border border-slate-200 text-slate-800 leading-relaxed">
                          {s.description}
                        </p>
                      </div>

                      {/* Photo evidence if submitted */}
                      {s.photo_url && (
                        <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-2">
                          <div className="flex items-center gap-2 font-medium text-slate-900">
                            <Camera className="w-4 h-4 text-slate-600" />
                            <span>Attached Photo Evidence</span>
                          </div>
                          <div className="flex items-start gap-4">
                            <img
                              src={s.photo_url}
                              alt="Sighting photograph"
                              className="w-24 h-24 object-cover rounded border border-slate-300"
                              referrerPolicy="no-referrer"
                            />
                            {s.photo_analysis && (
                              <div className="text-[11px] font-mono text-slate-600 space-y-1">
                                <div>Resolution: {s.photo_analysis.quality.resolution.width}x{s.photo_analysis.quality.resolution.height}px</div>
                                <div>Sharpness (&nabla;&sup2;): {s.photo_analysis.quality.sharpness.laplacian_variance}</div>
                                <div>Faces detected: {s.photo_analysis.faces.length}</div>
                                <div className="text-emerald-700 font-sans font-medium">EXIF GPS scrubbed</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Moderator Notes input */}
                      <div>
                        <label className="block text-slate-700 font-medium mb-1">
                          Moderator Decision Notes (Recorded in Audit Trail):
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Cross-referenced transit camera logs; confirmed matching attire with detective."
                          value={moderatorNotes[s.id] || ''}
                          onChange={(e) =>
                            setModeratorNotes({ ...moderatorNotes, [s.id]: e.target.value })
                          }
                          className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900"
                        />
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <button
                          onClick={() => handleModerate(s.id, 'verified_by_moderator')}
                          disabled={isProcessingId === s.id}
                          className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verify & Publish to Bulletin</span>
                        </button>

                        <button
                          onClick={() => handleModerate(s.id, 'forwarded_to_police')}
                          disabled={isProcessingId === s.id}
                          className="px-3.5 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          <Forward className="w-3.5 h-3.5" />
                          <span>Forward to Police Privately</span>
                        </button>

                        <button
                          onClick={() => handleModerate(s.id, 'dismissed')}
                          disabled={isProcessingId === s.id}
                          className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 ml-auto"
                        >
                          <XCircle className="w-3.5 h-3.5 text-slate-600" />
                          <span>Dismiss Sighting</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 bg-white border border-slate-200 rounded-lg text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <div className="text-sm font-semibold text-slate-900">
                Moderation Queue is Clear
              </div>
              <p className="text-xs text-slate-500">
                All community sighting leads have been reviewed and processed.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Tamper-Evident Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Cryptographic Activity Log</h2>
              <p className="text-xs text-slate-500">
                Every sensitive data view, case creation, status modification, and moderation action is logged.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Filter by action (e.g. CASE_CREATED)"
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setAuditPage(1);
                }}
                className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Entity</th>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Sanitized IP</th>
                  <th className="py-2.5 px-3">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{log.created_at}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                      {log.entity_type} {log.entity_id ? `(${log.entity_id.substring(0, 12)}...)` : ''}
                    </td>
                    <td className="py-2 px-3 text-slate-700 whitespace-nowrap">
                      {log.user_email || 'anonymous'}
                    </td>
                    <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{log.ip_address}</td>
                    <td className="py-2 px-3 text-slate-500 font-sans text-xs max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {auditTotalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <button
                onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                disabled={auditPage === 1}
                className="px-2.5 py-1 bg-slate-100 rounded disabled:opacity-40"
              >
                Previous
              </button>
              <span className="font-mono text-slate-500">
                Page {auditPage} of {auditTotalPages}
              </span>
              <button
                onClick={() => setAuditPage((p) => Math.min(auditTotalPages, p + 1))}
                disabled={auditPage === auditTotalPages}
                className="px-2.5 py-1 bg-slate-100 rounded disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: User Management */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">User Role Authorization</h2>
            <p className="text-xs text-slate-500">
              Grant coordinator or law-enforcement credentials to verified organizations.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Organization</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Verification</th>
                  <th className="py-2.5 px-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {userList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{u.full_name}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{u.email}</td>
                    <td className="py-2.5 px-3 text-slate-600">{u.organization || 'Independent'}</td>
                    <td className="py-2.5 px-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value, u.is_verified)}
                        className="bg-slate-50 border border-slate-300 rounded px-2 py-0.5 text-xs font-mono"
                      >
                        <option value="public">public</option>
                        <option value="case_manager">case_manager</option>
                        <option value="law_enforcement">law_enforcement</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => handleUpdateRole(u.id, u.role, !u.is_verified)}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium font-mono ${
                          u.is_verified
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {u.is_verified ? 'Verified' : 'Pending Review'}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px] font-mono">
                      ID: {u.id.substring(0, 8)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: System Health & Database Integrity */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <div className="text-xs font-mono uppercase text-slate-500 mb-1">
                Database Engine
              </div>
              <div className="text-lg font-bold text-slate-900 font-mono">
                SQLite 3 / node:sqlite
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Persistent storage at <code>data/facetrace.db</code> with WAL journaling and foreign-key constraint enforcement.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <div className="text-xs font-mono uppercase text-slate-500 mb-1">
                Total Audit Log Records
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {stats ? stats.totalAuditEvents : '--'}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Tamper-evident logs of all intake, access, and moderation events.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <div className="text-xs font-mono uppercase text-slate-500 mb-1">
                Active Sighting Pipeline
              </div>
              <div className="text-2xl font-bold font-mono text-amber-700 tabular-nums">
                {stats ? stats.pendingSightings : '--'} Pending
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {stats ? stats.verifiedSightings : '--'} verified leads attached to bulletins.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-2 text-xs text-slate-700">
            <h3 className="font-bold text-slate-900">Local Development & Migration Path</h3>
            <p className="leading-relaxed">
              This deployment is configured with persistent SQLite storage for seamless development and portable operation. When scaling to enterprise state multi-node clusters, the schema maps 1:1 to PostgreSQL (via Cloud SQL or Supabase) with native JSONB columns for photo analysis and UUID primary keys.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

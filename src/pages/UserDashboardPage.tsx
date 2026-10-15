import React, { useState, useEffect } from 'react';
import type { Case, Sighting } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  User,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Eye,
  PlusCircle,
  ArrowRight,
  Send,
} from 'lucide-react';

interface UserDashboardPageProps {
  onNavigate: (tab: string, caseId?: string) => void;
}

export const UserDashboardPage: React.FC<UserDashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { notifications } = useNotifications();
  const [myCases, setMyCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUserData() {
      if (!user) return;
      setIsLoading(true);
      try {
        const res = await api.getCases({ limit: 50 });
        const userCases = res.cases.filter((c) => c.reporter_user_id === user.id);
        setMyCases(userCases);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    loadUserData();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Sign In Required</h2>
        <p className="text-xs text-slate-600">Please sign in to view your dashboard.</p>
        <button
          onClick={() => onNavigate('signin')}
          className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded hover:bg-slate-800"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile Overview Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg">
            {user.full_name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{user.full_name}</h1>
              <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 uppercase">
                {user.role.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
            {user.organization && (
              <p className="text-xs text-slate-600 mt-1 font-medium">{user.organization}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('report-sighting')}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded transition-colors flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Report Sighting</span>
          </button>
          <button
            onClick={() => onNavigate('submit-case')}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded transition-colors flex items-center gap-1.5"
          >
            <span>Lawful Intake</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: My Submitted Cases */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              My Submitted Case Records ({myCases.length})
            </h2>
            <button
              onClick={() => onNavigate('submit-case')}
              className="text-xs font-semibold text-slate-900 hover:underline"
            >
              + New Intake
            </button>
          </div>

          {isLoading ? (
            <div className="p-8 bg-white border border-slate-200 rounded-lg animate-pulse text-xs text-slate-400 text-center">
              Loading your records...
            </div>
          ) : myCases.length > 0 ? (
            <div className="space-y-3">
              {myCases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => onNavigate('case-detail', c.id)}
                  className="p-4 bg-white border border-slate-200 hover:border-slate-400 rounded-lg transition-all cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                      <span>{c.case_number}</span>
                      <span aria-hidden="true">&middot;</span>
                      <span className="uppercase font-semibold text-amber-700">{c.status}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{c.full_name}</h3>
                    <p className="text-xs text-slate-500">
                      Missing since {c.date_missing} from {c.last_seen_city}, {c.last_seen_state}
                    </p>
                  </div>
                  <div className="text-xs font-medium text-slate-600 flex items-center gap-1">
                    <span>View Record</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 bg-white border border-slate-200 rounded-lg text-center space-y-3">
              <FileText className="w-8 h-8 text-slate-400 mx-auto stroke-[1.25]" />
              <p className="text-xs text-slate-500">
                You have not registered any missing-person cases under this account.
              </p>
              <button
                onClick={() => onNavigate('submit-case')}
                className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded hover:bg-slate-800"
              >
                Submit an Intake Bulletin
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Recent Activity & Notifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Recent Notifications</h2>
            <button
              onClick={() => onNavigate('notifications')}
              className="text-xs font-semibold text-slate-900 hover:underline"
            >
              View All
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            {notifications.length > 0 ? (
              notifications.slice(0, 4).map((n) => (
                <div
                  key={n.id}
                  onClick={() => n.link && onNavigate(n.link.replace('/', ''))}
                  className={`p-2.5 rounded text-xs transition-colors cursor-pointer ${
                    n.is_read ? 'bg-slate-50 hover:bg-slate-100' : 'bg-amber-50/70 border border-amber-200/60'
                  }`}
                >
                  <div className="font-semibold text-slate-900">{n.title}</div>
                  <p className="text-slate-600 text-[11px] mt-0.5 line-clamp-2">{n.message}</p>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">{n.created_at}</div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-6">
                No recent notifications.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

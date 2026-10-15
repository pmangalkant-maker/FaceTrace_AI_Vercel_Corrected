import React, { useEffect, useState } from 'react';
import type { Case, DatabaseStats } from '../types';
import { api } from '../services/api';
import { CaseCard } from '../components/cases/CaseCard';
import {
  Search,
  Shield,
  FileCheck2,
  AlertCircle,
  Eye,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (tab: string, caseId?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [recentCases, setRecentCases] = useState<Case[]>([]);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        setIsLoading(true);
        const [casesRes, statsRes] = await Promise.allSettled([
          api.getCases({ status: 'active', limit: 4 }),
          api.getAdminStats(),
        ]);

        if (casesRes.status === 'fulfilled') {
          setRecentCases(casesRes.value.cases);
        }
        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value.stats);
        }
      } catch (e) {
        console.error('Home load error:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadHomeData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('cases', searchQuery);
  };

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-slate-600 mb-4 bg-slate-100 px-2.5 py-1 rounded">
            <Shield className="w-3.5 h-3.5 text-slate-700" />
            <span>Public-Interest Registry &bull; Lawful Intake &bull; Privacy-Preserving</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 text-balance leading-tight">
            Coordinating missing-person search with verified public intelligence.
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
            FaceTrace AI assists families, case coordinators, and law enforcement by organizing verified missing-person cases, moderating community sightings, and evaluating reference photographic quality without invasive mass biometric surveillance.
          </p>

          {/* Quick Search Bar */}
          <form onSubmit={handleSearchSubmit} className="mt-8 flex flex-col sm:flex-row gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, city, case ref, or police number..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap flex items-center justify-center gap-2"
            >
              <span>Search Registry</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Intake Links */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span>Need immediate action?</span>
            <button
              onClick={() => onNavigate('report-sighting')}
              className="text-slate-900 font-semibold hover:underline"
            >
              Report a Sighting
            </button>
            <span aria-hidden="true">&middot;</span>
            <button
              onClick={() => onNavigate('submit-case')}
              className="text-slate-900 font-semibold hover:underline"
            >
              Submit Official Case Intake
            </button>
            <span aria-hidden="true">&middot;</span>
            <button
              onClick={() => onNavigate('image-analysis')}
              className="text-slate-900 font-semibold hover:underline"
            >
              Inspect Photo Quality
            </button>
          </div>
        </div>
      </section>

      {/* Database Metrics Row (Real counts only) */}
      <section className="bg-slate-100 border-y border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                Total Registered Cases
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                {stats ? stats.totalCases : '--'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Persistent database records</div>
            </div>

            <div>
              <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                Active Missing Cases
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-700 mt-1 tabular-nums">
                {stats ? stats.activeCases : '--'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Under active community review</div>
            </div>

            <div>
              <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                Moderated Sightings
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
                {stats ? stats.verifiedSightings + stats.forwardedSightings : '--'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Verified or forwarded to police</div>
            </div>

            <div>
              <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                Audit Trail Integrity
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                {stats ? stats.totalAuditEvents : '--'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Cryptographic log entries</div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Active Cases Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Active Missing Person Bulletins
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Verified community bulletins authorized by case handlers and law enforcement.
            </p>
          </div>
          <button
            onClick={() => onNavigate('cases')}
            className="text-xs font-semibold text-slate-900 hover:text-slate-700 flex items-center gap-1"
          >
            <span>View All Registry Cases</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-lg p-4 h-80 animate-pulse">
                <div className="bg-slate-200 aspect-square rounded mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : recentCases.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {recentCases.map((c) => (
              <CaseCard
                key={c.id}
                caseItem={c}
                onClick={() => onNavigate('case-detail', c.id)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500 text-sm">
            No active missing person cases currently registered.
          </div>
        )}
      </section>

      {/* Privacy-First Principles & Lawful Authority Architecture */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border border-slate-200 rounded-lg p-6 sm:p-8 bg-white">
          <div className="max-w-2xl mb-8">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500 block mb-1">
              Governance & Architectural Principles
            </span>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Why FaceTrace AI is built privacy-first
            </h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Missing person investigations require sensitive handling. Unlike unregulated facial recognition databases, FaceTrace AI is built upon strict legal compliance, lawful authority verification, and privacy preservation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-800">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">
                Zero Biometric Surveillance Matching
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We do not scrape public CCTV feeds, social media profiles, or private cameras. Our image inspection tools perform technical quality analysis (Laplacian sharpness, brightness, resolution) and candidate face localization without mass 1:N biometric identity matching.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-800">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">
                Lawful Authority Verification
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cases must include an official law enforcement agency and police incident number. Unverified submissions remain in confidential review queues to prevent harassment, fraudulent reporting, or stalking vectors.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-800">
                <Eye className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">
                Human-Moderated Sighting Pipeline
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every community sighting is held in a secure moderation queue. Authorized case coordinators and law enforcement liaisons inspect evidence before publication to protect victim safety and coordinate search efforts responsibly.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

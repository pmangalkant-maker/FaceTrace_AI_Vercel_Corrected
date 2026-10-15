import React, { useState, useEffect } from 'react';
import type { Case, Sighting } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CasePoster } from '../components/cases/CasePoster';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Shield,
  FileText,
  Printer,
  Eye,
  AlertCircle,
  Clock,
  CheckCircle2,
  Lock,
  ChevronRight,
} from 'lucide-react';

interface CaseDetailPageProps {
  caseId: string;
  onNavigate: (tab: string, caseId?: string) => void;
  onBack: () => void;
}

export const CaseDetailPage: React.FC<CaseDetailPageProps> = ({
  caseId,
  onNavigate,
  onBack,
}) => {
  const { user } = useAuth();
  const [caseRecord, setCaseRecord] = useState<Case | null>(null);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPosterMode, setShowPosterMode] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const [caseRes, sightingsRes] = await Promise.all([
          api.getCaseById(caseId),
          api.getCaseSightings(caseId),
        ]);
        setCaseRecord(caseRes.case);
        setSelectedPhoto(caseRes.case.primary_photo_url || null);
        setSightings(sightingsRes.sightings || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load case information.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [caseId]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-4 bg-slate-200 rounded w-24"></div>
        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-200 aspect-square rounded-lg"></div>
          <div className="md:col-span-2 space-y-4">
            <div className="h-6 bg-slate-200 rounded w-3/4"></div>
            <div className="h-20 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !caseRecord) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Case Record Unavailable</h2>
        <p className="text-xs text-slate-600">{error || 'The requested case could not be retrieved.'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded hover:bg-slate-800"
        >
          Return to Registry
        </button>
      </div>
    );
  }

  if (showPosterMode) {
    return <CasePoster caseItem={caseRecord} onBack={() => setShowPosterMode(false)} />;
  }

  const isAuthority = user && ['admin', 'case_manager', 'law_enforcement'].includes(user.role);
  const isOwner = user && user.id === caseRecord.reporter_user_id;
  const canManage = isOwner || isAuthority;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Case Search</span>
        </button>

        <div className="flex items-center gap-2">
          {canManage && (
            <button
              onClick={() => onNavigate('case-management')}
              className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded transition-colors"
            >
              Manage / Update Case
            </button>
          )}
          <button
            onClick={() => setShowPosterMode(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official Poster</span>
          </button>
          <button
            onClick={() => onNavigate('report-sighting', caseRecord.id)}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors"
          >
            Report Sighting
          </button>
        </div>
      </div>

      {/* Case Header Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1">
              <span>CASE BULLETIN: {caseRecord.case_number}</span>
              <span aria-hidden="true">&middot;</span>
              <span className="uppercase font-semibold text-amber-700">{caseRecord.status}</span>
              {caseRecord.is_demo && (
                <>
                  <span aria-hidden="true">&middot;</span>
                  <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                    DEMO RECORD
                  </span>
                </>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {caseRecord.full_name}
            </h1>
            {caseRecord.alias_nickname && (
              <p className="text-xs text-slate-500 mt-0.5">
                Alias / Nickname: &ldquo;{caseRecord.alias_nickname}&rdquo;
              </p>
            )}
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded text-xs space-y-1">
            <div className="text-slate-500 font-medium">Reporting Law Enforcement Agency:</div>
            <div className="font-semibold text-slate-900">{caseRecord.law_enforcement_agency}</div>
            <div className="font-mono text-slate-600">
              Police Case Ref: <strong className="text-slate-900">{caseRecord.police_case_number}</strong>
            </div>
          </div>
        </div>

        {/* Main 2-Column Split: Photos + Core Demographics */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Photo Gallery Column (5 cols) */}
          <div className="md:col-span-5 space-y-3">
            <div className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
              {selectedPhoto ? (
                <img
                  src={selectedPhoto}
                  alt={`Reference portrait of ${caseRecord.full_name}`}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                  Official reference photograph on file
                </div>
              )}
            </div>

            {/* Photo inspector button */}
            {selectedPhoto && (
              <button
                onClick={() => onNavigate('image-analysis')}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded flex items-center justify-center gap-1.5 transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>Inspect in Technical Photo Analyzer</span>
              </button>
            )}

            {/* Additional photos if any */}
            {caseRecord.additional_photos && caseRecord.additional_photos.length > 0 && (
              <div className="flex items-center gap-2 pt-2 overflow-x-auto">
                {caseRecord.primary_photo_url && (
                  <button
                    onClick={() => setSelectedPhoto(caseRecord.primary_photo_url || null)}
                    className={`w-14 h-14 rounded border-2 overflow-hidden shrink-0 ${
                      selectedPhoto === caseRecord.primary_photo_url ? 'border-slate-900' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={caseRecord.primary_photo_url}
                      alt="Primary thumbnail"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                )}
                {caseRecord.additional_photos.map((photo, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedPhoto(photo)}
                    className={`w-14 h-14 rounded border-2 overflow-hidden shrink-0 ${
                      selectedPhoto === photo ? 'border-slate-900' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={photo}
                      alt={`Additional thumbnail ${i + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Demographics & Physical Traits (7 cols) */}
          <div className="md:col-span-7 space-y-6">
            {/* Quick Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">Date Missing</span>
                <strong className="text-slate-900 font-mono text-sm">{caseRecord.date_missing}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Age at Disappearance</span>
                <strong className="text-slate-900 font-mono text-sm">{caseRecord.age_at_disappearance} years</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Current Estimated Age</span>
                <strong className="text-slate-900 font-mono text-sm">
                  {caseRecord.current_estimated_age ? `${caseRecord.current_estimated_age} years` : 'Approx. matching'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Gender</span>
                <strong className="text-slate-900 capitalize">{caseRecord.gender}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Height / Weight</span>
                <strong className="text-slate-900 font-mono">
                  {caseRecord.height_cm ? `${caseRecord.height_cm} cm` : 'Not listed'} / {caseRecord.weight_kg ? `${caseRecord.weight_kg} kg` : 'Not listed'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Hair / Eyes</span>
                <strong className="text-slate-900">
                  {caseRecord.hair_color || 'Unknown'} / {caseRecord.eye_color || 'Unknown'}
                </strong>
              </div>
            </div>

            {/* Last Known Location */}
            <div>
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-500" />
                <span>Last Confirmed Location</span>
              </h3>
              <div className="text-xs text-slate-700 bg-white p-3 border border-slate-200 rounded space-y-1">
                <div>
                  <strong>Area:</strong> {caseRecord.last_seen_city}, {caseRecord.last_seen_state}, {caseRecord.last_seen_country}
                </div>
                {caseRecord.last_seen_location_detail && (
                  <div className="text-slate-600 pt-1 border-t border-slate-100">
                    <strong>Specific Site Details:</strong> {caseRecord.last_seen_location_detail}
                  </div>
                )}
              </div>
            </div>

            {/* Distinguishing Features */}
            {caseRecord.distinguishing_features && (
              <div>
                <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">
                  Distinguishing Marks or Characteristics
                </h3>
                <p className="text-xs text-slate-700 bg-white p-3 border border-slate-200 rounded leading-relaxed">
                  {caseRecord.distinguishing_features}
                </p>
              </div>
            )}

            {/* Circumstances */}
            <div>
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Circumstances of Disappearance</span>
              </h3>
              <p className="text-xs text-slate-700 bg-white p-3 border border-slate-200 rounded leading-relaxed">
                {caseRecord.circumstances}
              </p>
            </div>

            {/* Contact Authorities Box */}
            <div className="bg-slate-900 text-white p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs">
                <div className="font-semibold text-amber-300">Have information about this case?</div>
                <div className="text-slate-300 mt-0.5">
                  Contact {caseRecord.law_enforcement_agency} directly:
                </div>
                <div className="font-mono text-sm font-bold text-white mt-1">
                  {caseRecord.contact_phone_masked} (Police Case #{caseRecord.police_case_number})
                </div>
              </div>
              <button
                onClick={() => onNavigate('report-sighting', caseRecord.id)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded whitespace-nowrap transition-colors"
              >
                Submit Sighting Online
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Verified Sightings Section */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Moderated Sighting Reports ({sightings.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified community observations reviewed by case handlers.
            </p>
          </div>
          <button
            onClick={() => onNavigate('report-sighting', caseRecord.id)}
            className="text-xs font-semibold text-slate-900 hover:underline"
          >
            + Add New Sighting
          </button>
        </div>

        {sightings.length > 0 ? (
          <div className="space-y-3 pt-2">
            {sightings.map((s) => (
              <div
                key={s.id}
                className="p-4 border border-slate-200 rounded-md bg-slate-50 text-xs space-y-2"
              >
                <div className="flex items-center justify-between gap-2 text-slate-500">
                  <span className="font-mono">
                    Observed on <strong className="text-slate-900 font-semibold">{s.sighting_date}</strong> in {s.city}, {s.state}
                  </span>
                  <span className="font-mono text-[11px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    Verified Lead
                  </span>
                </div>
                <div className="text-slate-700">
                  <strong>Location:</strong> {s.location_notes}
                </div>
                <p className="text-slate-700 leading-relaxed bg-white p-2.5 rounded border border-slate-200">
                  {s.description}
                </p>
                {s.moderator_notes && (
                  <div className="text-[11px] text-slate-500 italic border-l-2 border-slate-300 pl-2">
                    Case Handler Note: {s.moderator_notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded">
            No public sightings currently confirmed for this case bulletin.
          </div>
        )}
      </div>
    </div>
  );
};

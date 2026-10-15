import React, { useState, useEffect } from 'react';
import type { Case, ImageAnalysisResult } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  AlertTriangle,
  Upload,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Camera,
  MapPin,
  Calendar,
} from 'lucide-react';

interface ReportSightingPageProps {
  initialCaseId?: string;
  onNavigate: (tab: string, caseId?: string) => void;
}

export const ReportSightingPage: React.FC<ReportSightingPageProps> = ({
  initialCaseId,
  onNavigate,
}) => {
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState(initialCaseId || '');
  const [sightingDate, setSightingDate] = useState(new Date().toISOString().split('T')[0]);
  const [country, setCountry] = useState('United States');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [locationNotes, setLocationNotes] = useState('');
  const [description, setDescription] = useState('');
  const [submitterName, setSubmitterName] = useState(user?.full_name || '');
  const [submitterContact, setSubmitterContact] = useState(user?.email || '');
  const [consentAccuracy, setConsentAccuracy] = useState(false);

  // Photo upload and analysis state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [photoAnalysis, setPhotoAnalysis] = useState<ImageAnalysisResult | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadCases() {
      try {
        const res = await api.getCases({ limit: 50 });
        setCases(res.cases);
        if (!selectedCaseId && res.cases.length > 0) {
          setSelectedCaseId(res.cases[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadCases();
  }, [selectedCaseId]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsAnalyzingPhoto(true);
    setErrorMessage(null);

    try {
      const res = await api.uploadAndAnalyzeImage(file);
      setPhotoUrl(res.url);
      setPhotoAnalysis(res.analysis);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to analyze uploaded photo.');
    } finally {
      setIsAnalyzingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedCaseId) {
      setErrorMessage('Please select the referenced missing-person case.');
      return;
    }

    if (!consentAccuracy) {
      setErrorMessage('You must confirm the good-faith accuracy affirmation.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.reportSighting({
        case_id: selectedCaseId,
        sighting_date: sightingDate,
        country,
        state,
        city,
        location_notes: locationNotes,
        description,
        photo_url: photoUrl || undefined,
        photo_analysis: photoAnalysis || undefined,
        submitter_name: submitterName,
        submitter_contact: submitterContact,
        consent_accuracy: consentAccuracy,
      });

      setSubmitSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit sighting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Sighting Lead Submitted</h2>
        <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
          Thank you for assisting this search effort. Your sighting report has entered the secure moderation queue. An authorized case coordinator will review your information before it is published or escalated to investigating officers.
        </p>
        <div className="pt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('case-detail', selectedCaseId)}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded hover:bg-slate-800"
          >
            Return to Case Page
          </button>
          <button
            onClick={() => {
              setSubmitSuccess(false);
              setDescription('');
              setLocationNotes('');
              setPhotoUrl(null);
              setPhotoAnalysis(null);
            }}
            className="px-4 py-2 bg-slate-100 text-slate-800 text-xs font-medium rounded hover:bg-slate-200"
          >
            Submit Another Report
          </button>
        </div>
      </div>
    );
  }

  const activeCase = cases.find((c) => c.id === selectedCaseId);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Report a Sighting or Lead
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
          Community observations provide vital leads for coordinators. Every sighting is carefully reviewed by lawful authorities prior to publication to protect privacy and avoid false alarms.
        </p>
      </div>

      {/* Emergency Alert Callout */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold block">Active or Immediate Sighting:</strong>
          <span>
            If you are currently observing the missing individual or believe they are in active distress, dial emergency services (911 / 999 / 112) immediately. Do not endanger yourself or the person.
          </span>
        </div>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Sighting Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6 space-y-6 shadow-xs">
        {/* Case Selection */}
        <div>
          <label htmlFor="case-select" className="block text-xs font-semibold text-slate-900 mb-1">
            Referenced Missing Person Case *
          </label>
          <select
            id="case-select"
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-slate-900"
            required
          >
            <option value="">Select a case bulletin...</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.case_number} - {c.full_name} (Missing from {c.last_seen_city}, {c.last_seen_state})
              </option>
            ))}
          </select>

          {activeCase && (
            <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded text-xs flex items-center gap-3">
              <span className="font-mono text-slate-600">{activeCase.case_number}</span>
              <span aria-hidden="true">&middot;</span>
              <span className="font-medium text-slate-900">{activeCase.full_name}</span>
              <span aria-hidden="true">&middot;</span>
              <span className="text-slate-500">Police Ref: {activeCase.police_case_number}</span>
            </div>
          )}
        </div>

        {/* Date and Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="sighting-date-input" className="block text-xs font-semibold text-slate-900 mb-1">
              Date of Sighting *
            </label>
            <input
              id="sighting-date-input"
              type="date"
              value={sightingDate}
              onChange={(e) => setSightingDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs text-slate-900"
              required
            />
          </div>

          <div>
            <label htmlFor="country-input" className="block text-xs font-semibold text-slate-900 mb-1">
              Country *
            </label>
            <input
              id="country-input"
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs text-slate-900"
              required
            />
          </div>

          <div>
            <label htmlFor="state-input" className="block text-xs font-semibold text-slate-900 mb-1">
              State / Province *
            </label>
            <input
              id="state-input"
              type="text"
              placeholder="e.g. WA or Oregon"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs text-slate-900"
              required
            />
          </div>

          <div>
            <label htmlFor="city-input" className="block text-xs font-semibold text-slate-900 mb-1">
              City / Municipality *
            </label>
            <input
              id="city-input"
              type="text"
              placeholder="e.g. Seattle"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs text-slate-900"
              required
            />
          </div>
        </div>

        {/* Location specifics */}
        <div>
          <label htmlFor="location-notes-input" className="block text-xs font-semibold text-slate-900 mb-1">
            Exact Location / Site Details *
          </label>
          <input
            id="location-notes-input"
            type="text"
            placeholder="e.g. Transit center platform 3, grocery storefront near 5th and Main"
            value={locationNotes}
            onChange={(e) => setLocationNotes(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs text-slate-900"
            required
          />
        </div>

        {/* Observation Description */}
        <div>
          <label htmlFor="description-input" className="block text-xs font-semibold text-slate-900 mb-1">
            Description of Observation *
          </label>
          <textarea
            id="description-input"
            rows={4}
            placeholder="Please detail what the individual was wearing, direction of travel, physical condition, any accompanying persons, vehicle descriptions, or notable behaviors..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs text-slate-900"
            required
          />
        </div>

        {/* Optional Sighting Photo Upload with Quality & Face Detection Check */}
        <div className="border border-slate-200 rounded p-4 bg-slate-50 space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="sighting-photo-input" className="block text-xs font-semibold text-slate-900">
              Optional Supporting Sighting Photo
            </label>
            <span className="text-[11px] text-slate-500">EXIF GPS stripped automatically</span>
          </div>

          <div className="flex items-center gap-4">
            <label
              htmlFor="sighting-photo-input"
              className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 rounded text-xs font-medium text-slate-700 cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <Camera className="w-4 h-4 text-slate-500" />
              <span>Choose Photo (JPEG / PNG)</span>
            </label>
            <input
              id="sighting-photo-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              className="hidden"
            />
            {selectedFile && (
              <span className="text-xs text-slate-600 font-mono truncate max-w-xs">
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
              </span>
            )}
          </div>

          {isAnalyzingPhoto && (
            <div className="text-xs text-slate-500 animate-pulse">
              Running Haar-cascade detection and Laplacian blur analysis...
            </div>
          )}

          {photoAnalysis && (
            <div className="mt-2 p-3 bg-white border border-slate-200 rounded text-xs space-y-1.5">
              <div className="flex items-center justify-between font-mono text-[11px] text-slate-600">
                <span>Resolution: {photoAnalysis.quality.resolution.width}x{photoAnalysis.quality.resolution.height}px</span>
                <span>Laplace Sharpness: {photoAnalysis.quality.sharpness.laplacian_variance}</span>
                <span>Faces Detected: {photoAnalysis.faces.length}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Assessment: <strong className="font-medium text-slate-800 capitalize">{photoAnalysis.quality.sharpness.assessment.replace(/_/g, ' ')}</strong> &middot;{' '}
                <span className="text-emerald-700 font-medium">Privacy EXIF scrubbed</span>
              </div>
            </div>
          )}
        </div>

        {/* Submitter Contact Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
          <div>
            <label htmlFor="submitter-name-input" className="block text-xs font-semibold text-slate-900 mb-1">
              Your Full Name *
            </label>
            <input
              id="submitter-name-input"
              type="text"
              value={submitterName}
              onChange={(e) => setSubmitterName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs text-slate-900"
              required
            />
          </div>

          <div>
            <label htmlFor="submitter-contact-input" className="block text-xs font-semibold text-slate-900 mb-1">
              Contact Phone or Email *
            </label>
            <input
              id="submitter-contact-input"
              type="text"
              placeholder="For law enforcement verification"
              value={submitterContact}
              onChange={(e) => setSubmitterContact(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs text-slate-900"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Contact info is never made public; only verified coordinators access this.
            </p>
          </div>
        </div>

        {/* Consent Checkbox */}
        <div className="border-t border-slate-100 pt-4">
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
            <input
              type="checkbox"
              checked={consentAccuracy}
              onChange={(e) => setConsentAccuracy(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              required
            />
            <span>
              I affirm that this sighting report is submitted in good faith based on my personal observation. I understand false reports impede search operations and may be reported to law enforcement.
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <div className="border-t border-slate-100 pt-4 flex items-center justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded transition-colors flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isSubmitting ? 'Submitting to Moderation...' : 'Submit Sighting Report'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

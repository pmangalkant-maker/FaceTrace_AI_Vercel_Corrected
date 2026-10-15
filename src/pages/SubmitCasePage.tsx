import React, { useState } from 'react';
import type { ImageAnalysisResult } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  FileCheck2,
  Shield,
  Upload,
  Camera,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Eye,
} from 'lucide-react';

interface SubmitCasePageProps {
  onNavigate: (tab: string, caseId?: string) => void;
}

export const SubmitCasePage: React.FC<SubmitCasePageProps> = ({ onNavigate }) => {
  const { user, demoLogin } = useAuth();

  // Form state
  const [relationship, setRelationship] = useState('immediate_family');
  const [fullName, setFullName] = useState('');
  const [aliasNickname, setAliasNickname] = useState('');
  const [ageAtDisappearance, setAgeAtDisappearance] = useState('');
  const [gender, setGender] = useState('male');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [eyeColor, setEyeColor] = useState('Brown');
  const [hairColor, setHairColor] = useState('Brown');
  const [distinguishingFeatures, setDistinguishingFeatures] = useState('');

  const [dateMissing, setDateMissing] = useState('');
  const [lastSeenCountry, setLastSeenCountry] = useState('United States');
  const [lastSeenState, setLastSeenState] = useState('');
  const [lastSeenCity, setLastSeenCity] = useState('');
  const [lastSeenDetail, setLastSeenDetail] = useState('');

  const [lawEnforcementAgency, setLawEnforcementAgency] = useState('');
  const [policeCaseNumber, setPoliceCaseNumber] = useState('');
  const [investigatingOfficer, setInvestigatingOfficer] = useState('');
  const [contactPhoneMasked, setContactPhoneMasked] = useState('');
  const [circumstances, setCircumstances] = useState('');

  // Photo upload and analysis
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoAnalysis, setPhotoAnalysis] = useState<ImageAnalysisResult | null>(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);

  // Consent
  const [consentAffirmation, setConsentAffirmation] = useState(false);
  const [lawfulRelationshipAffirmation, setLawfulRelationshipAffirmation] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdCaseId, setCreatedCaseId] = useState<string | null>(null);
  const [createdCaseNumber, setCreatedCaseNumber] = useState<string | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingPhoto(true);
    setErrorMessage(null);
    try {
      const res = await api.uploadAndAnalyzeImage(file);
      setPhotoUrl(res.url);
      setPhotoAnalysis(res.analysis);
    } catch (err: any) {
      setErrorMessage(err.message || 'Image intake check failed.');
    } finally {
      setIsAnalyzingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!user) {
      setErrorMessage('You must be signed in to submit a missing-person case.');
      return;
    }

    if (!consentAffirmation || !lawfulRelationshipAffirmation) {
      setErrorMessage('You must agree to all lawful authority and consent affirmations.');
      return;
    }

    if (!lawEnforcementAgency || !policeCaseNumber) {
      setErrorMessage('Lawful intake requires an official law enforcement agency and police case number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createCase({
        full_name: fullName,
        alias_nickname: aliasNickname || undefined,
        age_at_disappearance: parseInt(ageAtDisappearance, 10),
        gender,
        height_cm: heightCm ? parseInt(heightCm, 10) : undefined,
        weight_kg: weightKg ? parseInt(weightKg, 10) : undefined,
        eye_color: eyeColor,
        hair_color: hairColor,
        distinguishing_features: distinguishingFeatures || undefined,
        date_missing: dateMissing,
        last_seen_city: lastSeenCity,
        last_seen_state: lastSeenState,
        last_seen_country: lastSeenCountry,
        last_seen_location_detail: lastSeenDetail || undefined,
        law_enforcement_agency: lawEnforcementAgency,
        police_case_number: policeCaseNumber,
        investigating_officer: investigatingOfficer || undefined,
        contact_phone_masked: contactPhoneMasked || '(Local Emergency Dispatch)',
        circumstances,
        primary_photo_url: photoUrl || undefined,
        lawful_relationship_affirmation: lawfulRelationshipAffirmation,
        consent_verified: consentAffirmation,
      });

      setCreatedCaseId(res.case_id);
      setCreatedCaseNumber(res.case_number);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit case record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (createdCaseId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Case Intake Registered</h2>
        <div className="font-mono text-sm font-semibold text-slate-700 bg-slate-100 py-1.5 px-3 rounded inline-block">
          Official Bulletin Ref: {createdCaseNumber}
        </div>
        <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
          The case has been securely recorded into the persistent database. Community members can now review the verified bulletin, generate printable posters, and report sightings.
        </p>
        <div className="pt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('case-detail', createdCaseId)}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded hover:bg-slate-800"
          >
            View Registered Bulletin
          </button>
          <button
            onClick={() => onNavigate('case-management')}
            className="px-4 py-2 bg-slate-100 text-slate-800 text-xs font-medium rounded hover:bg-slate-200"
          >
            Coordinator Management Hub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Lawful Missing-Person Case Intake
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
          Submit an official missing-person bulletin to the FaceTrace AI public registry. All entries require verification with official police incident records to preserve investigative integrity.
        </p>
      </div>

      {/* Auth Banner if not signed in */}
      {!user && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-950">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>You must be signed in to submit an official case.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('signin')}
              className="px-3 py-1 bg-amber-900 text-amber-50 rounded hover:bg-amber-800 text-xs font-semibold whitespace-nowrap"
            >
              Sign In
            </button>
            <button
              onClick={() => demoLogin('case_manager')}
              className="px-3 py-1 bg-amber-200 text-amber-900 rounded hover:bg-amber-300 text-xs font-semibold whitespace-nowrap"
            >
              Quick Test as Coordinator
            </button>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 space-y-8 shadow-xs">
        {/* Section 1: Lawful Authority Declaration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <Shield className="w-4 h-4 text-slate-800" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              1. Lawful Authority & Relationship
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label htmlFor="relationship-select" className="block font-semibold text-slate-900 mb-1">
                Your Relationship to Missing Individual *
              </label>
              <select
                id="relationship-select"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs"
              >
                <option value="immediate_family">Immediate Family (Parent/Spouse/Child/Sibling)</option>
                <option value="legal_guardian">Legal Guardian or Conservator</option>
                <option value="case_coordinator">Authorized Case Coordinator (Non-Profit Alliance)</option>
                <option value="law_enforcement">Sworn Law Enforcement Officer</option>
              </select>
            </div>

            <div>
              <label htmlFor="police-agency-input" className="block font-semibold text-slate-900 mb-1">
                Reporting Law Enforcement Agency *
              </label>
              <input
                id="police-agency-input"
                type="text"
                placeholder="e.g. Seattle Police Dept - Missing Persons Unit"
                value={lawEnforcementAgency}
                onChange={(e) => setLawEnforcementAgency(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs"
                required
              />
            </div>

            <div>
              <label htmlFor="police-case-number-input" className="block font-semibold text-slate-900 mb-1">
                Official Police Incident / Case Number *
              </label>
              <input
                id="police-case-number-input"
                type="text"
                placeholder="e.g. SPD-26-884192"
                value={policeCaseNumber}
                onChange={(e) => setPoliceCaseNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs font-mono"
                required
              />
            </div>

            <div>
              <label htmlFor="contact-phone-input" className="block font-semibold text-slate-900 mb-1">
                Public Inquiry / Tip Line Phone *
              </label>
              <input
                id="contact-phone-input"
                type="text"
                placeholder="e.g. (206) 555-0143 or 911"
                value={contactPhoneMasked}
                onChange={(e) => setContactPhoneMasked(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs font-mono"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="investigating-officer-input" className="block font-semibold text-slate-900 mb-1">
                Investigating Detective / Officer Name (Confidential)
              </label>
              <input
                id="investigating-officer-input"
                type="text"
                placeholder="e.g. Detective R. Henderson"
                value={investigatingOfficer}
                onChange={(e) => setInvestigatingOfficer(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs"
              />
              <span className="text-[11px] text-slate-500">
                Officer name is kept confidential to verified case coordinators and not displayed publicly.
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Person Demographics */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <FileCheck2 className="w-4 h-4 text-slate-800" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              2. Missing Person Demographics
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label htmlFor="full-name-input" className="block font-semibold text-slate-900 mb-1">
                Full Legal Name *
              </label>
              <input
                id="full-name-input"
                type="text"
                placeholder="e.g. Alexander Vance"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs"
                required
              />
            </div>

            <div>
              <label htmlFor="alias-nickname-input" className="block font-semibold text-slate-900 mb-1">
                Alias or Nickname
              </label>
              <input
                id="alias-nickname-input"
                type="text"
                placeholder="e.g. Alex"
                value={aliasNickname}
                onChange={(e) => setAliasNickname(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label htmlFor="age-at-disappearance-input" className="block font-semibold text-slate-900 mb-1">
                Age at Disappearance *
              </label>
              <input
                id="age-at-disappearance-input"
                type="number"
                min="0"
                max="120"
                value={ageAtDisappearance}
                onChange={(e) => setAgeAtDisappearance(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs"
                required
              />
            </div>

            <div>
              <label htmlFor="intake-gender-select" className="block font-semibold text-slate-900 mb-1">
                Gender *
              </label>
              <select
                id="intake-gender-select"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="height-cm-input" className="block font-semibold text-slate-900 mb-1">
                Height (cm)
              </label>
              <input
                id="height-cm-input"
                type="number"
                placeholder="e.g. 182"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label htmlFor="weight-kg-input" className="block font-semibold text-slate-900 mb-1">
                Weight (kg)
              </label>
              <input
                id="weight-kg-input"
                type="number"
                placeholder="e.g. 78"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label htmlFor="eye-color-input" className="block font-semibold text-slate-900 mb-1">
                Eye Color
              </label>
              <input
                id="eye-color-input"
                type="text"
                placeholder="e.g. Hazel, Brown, Blue"
                value={eyeColor}
                onChange={(e) => setEyeColor(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label htmlFor="hair-color-input" className="block font-semibold text-slate-900 mb-1">
                Hair Color & Style
              </label>
              <input
                id="hair-color-input"
                type="text"
                placeholder="e.g. Short dark brown"
                value={hairColor}
                onChange={(e) => setHairColor(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs"
              />
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="distinguishing-features-input" className="block font-semibold text-slate-900 mb-1">
                Distinguishing Marks, Scars, Tattoos, or Medical Needs
              </label>
              <input
                id="distinguishing-features-input"
                type="text"
                placeholder="e.g. 2cm scar above left eyebrow; silver ring on left thumb; requires daily asthma medication"
                value={distinguishingFeatures}
                onChange={(e) => setDistinguishingFeatures(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Disappearance Timeline & Location */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              3. Disappearance Timeline & Location
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label htmlFor="disappearance-date-input" className="block font-semibold text-slate-900 mb-1">
                Date Last Seen *
              </label>
              <input
                id="disappearance-date-input"
                type="date"
                value={dateMissing}
                onChange={(e) => setDateMissing(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs"
                required
              />
            </div>

            <div>
              <label htmlFor="disappearance-city-input" className="block font-semibold text-slate-900 mb-1">
                Last Seen City *
              </label>
              <input
                id="disappearance-city-input"
                type="text"
                placeholder="e.g. Seattle"
                value={lastSeenCity}
                onChange={(e) => setLastSeenCity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs"
                required
              />
            </div>

            <div>
              <label htmlFor="disappearance-state-input" className="block font-semibold text-slate-900 mb-1">
                State / Province *
              </label>
              <input
                id="disappearance-state-input"
                type="text"
                placeholder="e.g. WA"
                value={lastSeenState}
                onChange={(e) => setLastSeenState(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs"
                required
              />
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="last-seen-detail-input" className="block font-semibold text-slate-900 mb-1">
                Specific Location Details
              </label>
              <input
                id="last-seen-detail-input"
                type="text"
                placeholder="e.g. 4th Ave and Pike St near transit hub entrance"
                value={lastSeenDetail}
                onChange={(e) => setLastSeenDetail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs"
              />
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="case-circumstances-input" className="block font-semibold text-slate-900 mb-1">
                Circumstances of Disappearance *
              </label>
              <textarea
                id="case-circumstances-input"
                rows={4}
                placeholder="Describe events leading up to disappearance, last known contact, vehicle information, clothing worn, and search operations underway..."
                value={circumstances}
                onChange={(e) => setCircumstances(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 4: Reference Photo Upload & Automated Quality Check */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <Camera className="w-4 h-4 text-slate-800" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              4. Reference Photograph & Quality Assessment
            </h2>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded space-y-3">
            <div className="text-xs text-slate-600 leading-relaxed">
              Upload a clear, front-facing reference photo. Our technical intake pipeline automatically assesses resolution standards, Laplacian focal sharpness, and verifies facial bounding regions (without biometric surveillance indexing).
            </div>

            <div className="flex items-center gap-4">
              <label
                htmlFor="case-photo-input"
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 rounded text-xs font-semibold text-slate-800 cursor-pointer flex items-center gap-2 transition-colors"
              >
                <Upload className="w-4 h-4 text-slate-600" />
                <span>Upload Reference Photo</span>
              </label>
              <input
                id="case-photo-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              {isAnalyzingPhoto && (
                <span className="text-xs text-slate-500 animate-pulse">
                  Analyzing focal plane and Haar candidate regions...
                </span>
              )}
            </div>

            {photoAnalysis && (
              <div className="bg-white border border-slate-200 p-3 rounded text-xs space-y-2">
                <div className="flex items-center justify-between font-mono text-[11px] text-slate-600 border-b border-slate-100 pb-1.5">
                  <span>Dimensions: {photoAnalysis.quality.resolution.width}x{photoAnalysis.quality.resolution.height}px</span>
                  <span>Sharpness: {photoAnalysis.quality.sharpness.laplacian_variance} &nabla;&sup2;</span>
                  <span>Faces: {photoAnalysis.faces.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  {photoAnalysis.quality.intake_compliance.meets_standard ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Intake Quality Standards Satisfied</span>
                    </span>
                  ) : (
                    <span className="text-amber-700 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Warning: Quality Limitations Detected</span>
                    </span>
                  )}
                  <span className="text-slate-400">&middot;</span>
                  <span className="text-slate-500">EXIF GPS scrubbed for privacy</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 5: Mandatory Affirmations */}
        <div className="space-y-3 border-t border-slate-200 pt-4 text-xs">
          <label className="flex items-start gap-2.5 cursor-pointer text-slate-700">
            <input
              type="checkbox"
              checked={lawfulRelationshipAffirmation}
              onChange={(e) => setLawfulRelationshipAffirmation(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              required
            />
            <span>
              I affirm under penalty of perjury that I hold lawful authority or immediate family standing to register this missing-person report, and an official police missing-person report has been filed with the stated agency.
            </span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer text-slate-700">
            <input
              type="checkbox"
              checked={consentAffirmation}
              onChange={(e) => setConsentAffirmation(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              required
            />
            <span>
              I consent to the publication of non-sensitive demographic details for public search coordination, and agree to the FaceTrace AI Privacy Governance & Lawful Intake terms.
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <div className="border-t border-slate-200 pt-6 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            All submitted cases are logged into the cryptographic audit trail.
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !user}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-semibold rounded transition-colors flex items-center gap-2"
          >
            <span>{isSubmitting ? 'Registering Bulletin...' : 'Register Missing-Person Case'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

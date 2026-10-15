import React from 'react';
import { Shield, Lock, FileCheck2, AlertTriangle, Scale, Eye, Trash2 } from 'lucide-react';

export const HelpPrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Privacy Governance, Lawful Authority & Guidance
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
          Comprehensive explanation of our legal intake standards, data subject rights, non-biometric architectural boundaries, and emergency protocols.
        </p>
      </div>

      {/* Emergency Advisory Callout */}
      <div className="bg-amber-950 text-amber-100 border border-amber-800 rounded-lg p-5 text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Immediate Emergency Protocol</span>
        </div>
        <p className="leading-relaxed">
          If you believe a missing individual is in immediate danger or you are witnessing a crime in progress, contact local emergency services immediately:
        </p>
        <div className="font-mono text-amber-200 text-xs py-1">
          United States & Canada: 911 &middot; United Kingdom: 999 &middot; European Union: 112 &middot; Australia: 000
        </div>
        <p className="text-amber-300/80 text-[11px]">
          FaceTrace AI is an informational coordination registry. Submitting an online report does NOT dispatch police or emergency medical services.
        </p>
      </div>

      {/* Core Privacy Architecture Pillars */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
          <Shield className="w-5 h-5 text-slate-800" />
          <span>1. Technical Architecture & Non-Biometric Boundaries</span>
        </h2>

        <div className="prose prose-slate text-xs space-y-3 text-slate-700 leading-relaxed">
          <p>
            <strong>No Biometric Facial Recognition:</strong> FaceTrace AI does not perform automated 1:N facial biometric matching, vector embedding clustering, or facial landmark surveillance against external databases.
          </p>
          <p>
            <strong>Technical Image Analysis Only:</strong> Our photographic inspection tools evaluate discrete mathematical properties of reference images:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600 font-mono text-[11px]">
            <li>Resolution evaluation (&ge; 300&times;300 pixel threshold for intake verification)</li>
            <li>Mean luminance and exposure histograms (detecting under/over-exposure)</li>
            <li>Laplacian variance (&nabla;&sup2; edge filter) assessing focal sharpness and motion blur</li>
            <li>Classical Haar-like feature cascade bounding box localization (face candidate positioning)</li>
          </ul>
          <p>
            <strong>No Data Scraping:</strong> We do not ingest public or private CCTV streams, social media photographs, or scraped commercial databases.
          </p>
        </div>
      </div>

      {/* Lawful Authority Intake Standards */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-slate-800" />
          <span>2. Lawful Authority & Case Verification Protocol</span>
        </h2>

        <div className="text-xs text-slate-700 space-y-3 leading-relaxed">
          <p>
            To prevent misuse, harassment, domestic surveillance, or fraudulent reporting:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-white border border-slate-200 p-4 rounded-lg space-y-1">
              <strong className="text-slate-900 block font-semibold">Police Case Number Requirement</strong>
              <p className="text-slate-600">
                Every case must state the investigating law enforcement agency, contact division, and official police report number. Unverified cases remain restricted to intake queues.
              </p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-lg space-y-1">
              <strong className="text-slate-900 block font-semibold">Legal Standing Affirmation</strong>
              <p className="text-slate-600">
                Reporters must affirm lawful standing: immediate family (parent, child, spouse, sibling), legal guardian, or sworn law enforcement officer.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sighting Moderation Pipeline */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
          <Eye className="w-5 h-5 text-slate-800" />
          <span>3. Sighting Moderation Pipeline</span>
        </h2>

        <div className="text-xs text-slate-700 space-y-3 leading-relaxed">
          <p>
            Community sightings undergo mandatory human moderation. Sighting submissions are NEVER published directly to the public web upon submission:
          </p>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded space-y-2 text-xs">
            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-700">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <strong>Step 1 (Intake):</strong> Community sighting enters encrypted moderation queue. Submitter contact is verified.
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-700">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <strong>Step 2 (Review):</strong> Case coordinators cross-reference location timeline with investigating detective notes.
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <strong>Step 3 (Determination):</strong> Sighting is either verified and published, forwarded directly to detectives, or dismissed as non-matching.
            </div>
          </div>
        </div>
      </div>

      {/* Data Protection, GDPR & Retention */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
          <Scale className="w-5 h-5 text-slate-800" />
          <span>4. Data Subject Rights & Retention Purge Policy</span>
        </h2>

        <div className="text-xs text-slate-700 space-y-3 leading-relaxed">
          <p>
            We strictly observe international privacy standards, including GDPR, CCPA, and CPRA data subject rights:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li>
              <strong>Right of Erasure (&ldquo;Right to be Forgotten&rdquo;):</strong> When an individual is located or a family requests case removal, case managers can trigger an immediate retention purge.
            </li>
            <li>
              <strong>EXIF Sanitization:</strong> All uploaded photos have geographic GPS metadata and camera hardware identifiers automatically removed before storage.
            </li>
            <li>
              <strong>Masked Public Access:</strong> Sensitive fields (detective private lines, internal addresses, medical notes) are restricted to verified lawful coordinators.
            </li>
            <li>
              <strong>Tamper-Evident Audit Logs:</strong> Access to sensitive case data is recorded in persistent, immutable audit logs with anonymized IP addresses.
            </li>
          </ul>
        </div>
      </div>

      {/* Deletion Request Contact */}
      <div className="bg-slate-100 border border-slate-200 rounded-lg p-5 text-xs text-slate-700 space-y-2">
        <h3 className="font-semibold text-slate-900 flex items-center gap-1.5">
          <Trash2 className="w-4 h-4 text-slate-700" />
          <span>Need to submit a formal privacy or retention inquiry?</span>
        </h3>
        <p className="leading-relaxed">
          Case coordinators can update statuses directly in their workspace. For legal custodians, law enforcement agencies, or individuals seeking record correction or deletion, contact our Data Protection Officer at:
        </p>
        <div className="font-mono text-slate-900 font-semibold pt-1">
          compliance@facetrace.org &middot; Reference Police Incident ID & Case Ref
        </div>
      </div>
    </div>
  );
};

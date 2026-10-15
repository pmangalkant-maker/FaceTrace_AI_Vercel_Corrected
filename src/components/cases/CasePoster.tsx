import React from 'react';
import type { Case } from '../../types';
import { Printer, Shield, ArrowLeft } from 'lucide-react';

interface CasePosterProps {
  caseItem: Case;
  onBack: () => void;
}

export const CasePoster: React.FC<CasePosterProps> = ({ caseItem, onBack }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Top action bar (hidden during print) */}
      <div className="no-print flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Case Record</span>
        </button>

        <button
          onClick={handlePrint}
          className="print-include flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-md hover:bg-slate-800 transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF Poster</span>
        </button>
      </div>

      {/* Official Poster Layout */}
      <div className="poster-print-container bg-white border-4 border-red-700 p-8 shadow-sm">
        {/* Banner */}
        <div className="bg-red-700 text-white text-center py-4 mb-6">
          <h1 className="text-3xl font-black uppercase tracking-wider font-mono">
            Missing Person
          </h1>
          <p className="text-xs tracking-widest uppercase font-semibold text-red-100 mt-1">
            Official Law Enforcement Community Bulletin
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mb-6">
          {/* Photo */}
          <div className="border-2 border-slate-900 bg-slate-100 aspect-square overflow-hidden flex items-center justify-center">
            {caseItem.primary_photo_url ? (
              <img
                src={caseItem.primary_photo_url}
                alt={caseItem.full_name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-slate-400 font-mono text-sm">Official photo on file</span>
            )}
          </div>

          {/* Core Demographics */}
          <div className="space-y-4">
            <div>
              <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                Case Bulletin Number: {caseItem.case_number}
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
                {caseItem.full_name}
              </h2>
              {caseItem.alias_nickname && (
                <div className="text-sm text-slate-600">
                  Also known as: &ldquo;{caseItem.alias_nickname}&rdquo;
                </div>
              )}
            </div>

            <div className="border-y border-slate-200 py-3 grid grid-cols-2 gap-y-2 text-xs">
              <div>
                <span className="text-slate-500 block">Date Missing:</span>
                <strong className="text-slate-900 font-mono">{caseItem.date_missing}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Age at Disappearance:</span>
                <strong className="text-slate-900 font-mono">{caseItem.age_at_disappearance} years</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Gender:</span>
                <strong className="text-slate-900 capitalize">{caseItem.gender}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Height / Weight:</span>
                <strong className="text-slate-900 font-mono">
                  {caseItem.height_cm ? `${caseItem.height_cm} cm` : 'Unknown'} / {caseItem.weight_kg ? `${caseItem.weight_kg} kg` : 'Unknown'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Hair / Eyes:</span>
                <strong className="text-slate-900">
                  {caseItem.hair_color || 'Unknown'} / {caseItem.eye_color || 'Unknown'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Last Seen Area:</span>
                <strong className="text-slate-900">
                  {caseItem.last_seen_city}, {caseItem.last_seen_state}
                </strong>
              </div>
            </div>

            {caseItem.distinguishing_features && (
              <div className="text-xs">
                <span className="font-semibold text-slate-900 block mb-1">
                  Distinguishing Marks or Features:
                </span>
                <p className="text-slate-700 bg-slate-50 p-2 border border-slate-200 rounded">
                  {caseItem.distinguishing_features}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Narrative & Circumstances */}
        <div className="mb-6 border-t border-slate-200 pt-4">
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">
            Circumstances of Disappearance
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 border border-slate-200 rounded">
            {caseItem.circumstances}
          </p>
        </div>

        {/* Law Enforcement Contact Box */}
        <div className="bg-slate-900 text-white p-5 rounded text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            <span>Investigating Law Enforcement Authority</span>
          </div>
          <div className="text-base font-bold text-white">
            {caseItem.law_enforcement_agency}
          </div>
          <div className="text-xs text-slate-300 font-mono">
            Police Case Reference: <strong className="text-amber-300">{caseItem.police_case_number}</strong>
          </div>
          <div className="pt-2 text-xs text-slate-300">
            If you have seen this individual or possess relevant information, please contact:
            <div className="text-sm font-bold font-mono text-white mt-0.5">
              {caseItem.contact_phone_masked} or dial local emergency services (911 / 999 / 112)
            </div>
          </div>
        </div>

        {/* Disclaimer Footer */}
        <div className="mt-6 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-500 font-mono">
          Bulletin issued via FaceTrace AI Community Registry &middot; Not intended for automated biometric surveillance &middot; Reference: {caseItem.case_number}
        </div>
      </div>
    </div>
  );
};

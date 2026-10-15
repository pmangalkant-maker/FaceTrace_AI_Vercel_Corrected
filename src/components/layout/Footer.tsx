import React from 'react';

interface FooterProps {
  onNavigate: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-white inline-block"></span>
              <span className="text-sm font-bold text-white tracking-tight">FaceTrace AI</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Public-interest missing-person case registry and photographic intake analysis. Dedicated to lawful, privacy-first coordination with families and authorized agencies.
            </p>
            <p className="text-slate-400 text-[11px]">
              Platform operational status: Persistent SQLite schema active.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Registry & Search
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('cases')}
                  className="hover:text-slate-200 transition-colors text-left"
                >
                  Active Missing Cases
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('report-sighting')}
                  className="hover:text-slate-200 transition-colors text-left"
                >
                  Submit Sighting Report
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('submit-case')}
                  className="hover:text-slate-200 transition-colors text-left"
                >
                  Lawful Intake Intake
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('image-analysis')}
                  className="hover:text-slate-200 transition-colors text-left"
                >
                  Photo Quality Inspector
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Privacy & Protocol
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('help-privacy')}
                  className="hover:text-slate-200 transition-colors text-left"
                >
                  Privacy Governance & Rights
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('help-privacy')}
                  className="hover:text-slate-200 transition-colors text-left"
                >
                  Lawful Authority Checks
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('help-privacy')}
                  className="hover:text-slate-200 transition-colors text-left"
                >
                  Photo Retention & Purge Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('help-privacy')}
                  className="hover:text-slate-200 transition-colors text-left"
                >
                  Non-Biometric Notice
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Emergency Guidance
            </h4>
            <div className="space-y-2 text-slate-400">
              <p className="leading-snug">
                For active endangerment, contact local emergency services immediately:
              </p>
              <div className="font-mono text-slate-300 space-y-1">
                <div>United States / Canada: 911</div>
                <div>United Kingdom: 999</div>
                <div>European Union: 112</div>
              </div>
              <p className="text-[11px] text-slate-400 pt-2">
                FaceTrace AI does not conduct automated surveillance or replace law enforcement dispatch.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div>
            &copy; 2026 FaceTrace AI Public Interest Registry. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('help-privacy')}
              className="hover:text-slate-300"
            >
              Terms of Intake
            </button>
            <span aria-hidden="true">&middot;</span>
            <button
              onClick={() => onNavigate('help-privacy')}
              className="hover:text-slate-300"
            >
              Data Protection
            </button>
            <span aria-hidden="true">&middot;</span>
            <button
              onClick={() => onNavigate('help-privacy')}
              className="hover:text-slate-300"
            >
              Audit Integrity
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

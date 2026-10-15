import React, { useState } from 'react';
import type { Case } from '../../types';
import { Calendar, MapPin, User as UserIcon, ShieldAlert } from 'lucide-react';

interface CaseCardProps {
  caseItem: Case;
  onClick: () => void;
}

export const CaseCard: React.FC<CaseCardProps> = ({ caseItem, onClick }) => {
  const [imgError, setImgError] = useState(false);

  const statusColorMap: Record<string, string> = {
    active: 'text-amber-700 font-semibold',
    located: 'text-emerald-700 font-semibold',
    resolved: 'text-blue-700 font-semibold',
    suspended: 'text-slate-600 font-semibold',
  };

  return (
    <article
      onClick={onClick}
      className="group bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-slate-400 transition-all cursor-pointer flex flex-col h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Photo Container */}
      <div className="relative aspect-square w-full bg-slate-100 overflow-hidden border-b border-slate-100">
        {caseItem.primary_photo_url && !imgError ? (
          <img
            src={caseItem.primary_photo_url}
            alt={`Reference photograph of ${caseItem.full_name}`}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-slate-400 bg-slate-50">
            <UserIcon className="w-12 h-12 stroke-[1.25] text-slate-300 mb-2" />
            <span className="text-xs font-medium text-slate-500">Official photo on file</span>
            <span className="text-[11px] text-slate-400">View record for details</span>
          </div>
        )}

        {/* Demo banner or Privacy Shield if applicable */}
        {caseItem.is_demo && (
          <div className="absolute top-2 left-2 bg-slate-900/90 text-white text-[10px] font-mono tracking-wider px-2 py-0.5 rounded-sm uppercase">
            Synthetic Demo Record
          </div>
        )}

        {caseItem.is_sensitive && (
          <div className="absolute top-2 right-2 bg-amber-900/90 text-amber-100 text-[10px] font-mono px-2 py-0.5 rounded-sm flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-amber-300" />
            <span>Restricted Intake</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Header & Case Reference */}
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <span className="text-xs font-mono text-slate-500">{caseItem.case_number}</span>
            <span className={`text-xs uppercase tracking-wide ${statusColorMap[caseItem.status] || 'text-slate-600'}`}>
              {caseItem.status}
            </span>
          </div>

          <h3 className="text-base font-semibold text-slate-900 group-hover:text-slate-700 transition-colors line-clamp-1">
            {caseItem.full_name}
          </h3>

          {/* Unboxed Metadata Line (Anti-Slop Zero-Pill) */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
            <span>Age: <strong className="font-semibold text-slate-700 tabular-nums">{caseItem.age_at_disappearance}</strong></span>
            <span aria-hidden="true">&middot;</span>
            <span className="capitalize">{caseItem.gender}</span>
            {caseItem.height_cm && (
              <>
                <span aria-hidden="true">&middot;</span>
                <span className="tabular-nums">{caseItem.height_cm} cm</span>
              </>
            )}
          </div>

          {/* Location & Date */}
          <div className="space-y-1 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">
                {caseItem.last_seen_city}, {caseItem.last_seen_state}, {caseItem.last_seen_country}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Missing since <span className="font-medium text-slate-800">{caseItem.date_missing}</span></span>
            </div>
          </div>
        </div>

        {/* Police Agency Note */}
        <div className="mt-4 pt-2 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-500">
          <span className="truncate max-w-[200px]">{caseItem.law_enforcement_agency}</span>
          <span className="font-medium text-slate-800 group-hover:underline">View details &rarr;</span>
        </div>
      </div>
    </article>
  );
};

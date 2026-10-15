import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export const EmergencyBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      role="alert"
      className="bg-amber-950 text-amber-100 border-b border-amber-800/80 px-4 py-2 text-xs transition-colors"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
          <p className="leading-snug">
            <strong className="font-semibold text-amber-300">EMERGENCY ADVISORY:</strong> If someone is in immediate danger or you are witnessing an ongoing incident, contact emergency services directly (911 / 999 / 112 or local police). FaceTrace AI is an informational registry and does not replace emergency dispatch.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-400 hover:text-amber-200 transition-colors p-1 shrink-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          aria-label="Dismiss emergency advisory"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

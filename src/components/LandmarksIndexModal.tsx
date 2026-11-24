import React from 'react';
import { Check, MapPin, Navigation, Trash2, X } from 'lucide-react';
import { LANDMARKS, LandmarkData } from '../data/portfolioData';
import { CustomWaypoint } from '../world/worldLogic';

interface LandmarksIndexModalProps {
  open: boolean;
  discoveredIds: string[];
  customWaypoints: CustomWaypoint[];
  onClose: () => void;
  onTeleportLandmark: (landmark: LandmarkData) => void;
  onTeleportWaypoint: (waypoint: CustomWaypoint) => void;
  onDeleteWaypoint: (id: string) => void;
}

export const LandmarksIndexModal: React.FC<LandmarksIndexModalProps> = ({
  open,
  discoveredIds,
  customWaypoints,
  onClose,
  onTeleportLandmark,
  onTeleportWaypoint,
  onDeleteWaypoint,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(7, 11, 20, 0.78)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="atlas-title"
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] rounded-2xl border border-white/15 shadow-2xl flex flex-col overflow-hidden"
        style={{ backgroundColor: '#0f1724' }}
      >
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between gap-4">
          <div>
            <h2
              id="atlas-title"
              className="text-xl font-bold text-slate-50"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              World Atlas & Fast Travel
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
              {discoveredIds.length} of {LANDMARKS.length} story landmarks discovered
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close World Atlas"
            className="w-9 h-9 rounded-lg border border-white/12 text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {LANDMARKS.map((lm) => {
              const visited = discoveredIds.includes(lm.id);
              return (
                <div
                  key={lm.id}
                  className="rounded-xl border border-white/12 p-4 flex flex-col justify-between gap-3"
                  style={{ backgroundColor: '#152033' }}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                      <span>{lm.era}</span>
                      {visited && (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                          Visited
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1 text-base font-semibold text-slate-50">
                      {lm.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                      {lm.subtitle}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onTeleportLandmark(lm)}
                    className="w-full py-2 px-3 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-medium text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Travel to {lm.zoneName}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {customWaypoints.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Custom Trail Markers ({customWaypoints.length})
              </h3>
              <div className="space-y-2">
                {customWaypoints.map((wp) => (
                  <div
                    key={wp.id}
                    className="rounded-lg border border-white/12 px-4 py-2.5 flex items-center justify-between gap-3"
                    style={{ backgroundColor: '#152033' }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MapPin className="w-4 h-4 shrink-0" style={{ color: wp.color }} aria-hidden="true" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-100 truncate">
                          {wp.label}
                        </div>
                        <div className="text-xs font-mono tabular-nums text-slate-400">
                          x: {Math.round(wp.x)}, z: {Math.round(wp.z)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onTeleportWaypoint(wp)}
                        className="px-2.5 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-xs text-slate-100 cursor-pointer"
                      >
                        Go
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteWaypoint(wp.id)}
                        aria-label={`Delete marker ${wp.label}`}
                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-white/10 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

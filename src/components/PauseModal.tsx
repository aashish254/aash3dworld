import React from 'react';
import { Home, Play, RotateCcw } from 'lucide-react';
import { LANDMARKS } from '../data/portfolioData';

interface PauseModalProps {
  open: boolean;
  discoveredCount: number;
  distanceWalked: number;
  onResume: () => void;
  onResetPosition: () => void;
  onBackToTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  open,
  discoveredCount,
  distanceWalked,
  onResume,
  onResetPosition,
  onBackToTitle,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(7, 11, 20, 0.80)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/15 shadow-2xl p-6"
        style={{ backgroundColor: '#0f1724' }}
      >
        <h2
          id="pause-title"
          className="text-2xl font-bold text-slate-50"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Exploration Paused
        </h2>
        <p className="mt-1 text-sm text-slate-300">
          Your discovered landmarks and custom trail markers are saved locally for offline access.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 p-3.5" style={{ backgroundColor: '#152033' }}>
            <div className="text-xs text-slate-400">Landmarks Visited</div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-amber-400">
              {discoveredCount} / {LANDMARKS.length}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 p-3.5" style={{ backgroundColor: '#152033' }}>
            <div className="text-xs text-slate-400">Distance Explored</div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-slate-50">
              {Math.round(distanceWalked)} m
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-2.5">
          <button
            type="button"
            onClick={onResume}
            className="w-full py-3 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4" aria-hidden="true" />
            <span>Resume Exploration</span>
          </button>

          <button
            type="button"
            onClick={onResetPosition}
            className="w-full py-2.5 px-4 rounded-lg border border-white/15 hover:bg-white/10 text-slate-100 font-medium text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Reset to Courtyard Spawn</span>
          </button>

          <button
            type="button"
            onClick={onBackToTitle}
            className="w-full py-2.5 px-4 rounded-lg border border-white/15 hover:bg-white/10 text-slate-300 font-medium text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>Return to Title Screen</span>
          </button>
        </div>
      </div>
    </div>
  );
};

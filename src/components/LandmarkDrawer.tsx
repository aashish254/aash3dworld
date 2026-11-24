import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Mail,
  Navigation,
  X,
} from 'lucide-react';
import { LANDMARKS, LandmarkData } from '../data/portfolioData';

interface LandmarkDrawerProps {
  landmark: LandmarkData | null;
  onClose: () => void;
  onNavigateTo: (landmark: LandmarkData) => void;
  onSelectLandmark: (landmark: LandmarkData) => void;
  onOpenContact: () => void;
}

export const LandmarkDrawer: React.FC<LandmarkDrawerProps> = ({
  landmark,
  onClose,
  onNavigateTo,
  onSelectLandmark,
  onOpenContact,
}) => {
  if (!landmark) return null;

  const idx = LANDMARKS.findIndex((item) => item.id === landmark.id);
  const prevLm = LANDMARKS[(idx - 1 + LANDMARKS.length) % LANDMARKS.length];
  const nextLm = LANDMARKS[(idx + 1) % LANDMARKS.length];

  return (
    <aside
      aria-label={landmark.title}
      className="fixed inset-x-3 top-16 bottom-4 sm:bottom-28 sm:left-auto sm:right-4 sm:w-[410px] z-30 rounded-2xl border border-slate-300/15 shadow-2xl flex flex-col overflow-hidden"
      style={{ backgroundColor: 'rgba(13, 20, 34, 0.96)' }}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-400/15 flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-amber-300">
            {landmark.zoneName} · {landmark.era}
          </div>
          <h2
            className="mt-1 text-2xl font-bold text-[#eae5da] leading-tight"
            style={{ fontFamily: 'var(--font-display)', textWrap: 'balance' }}
          >
            {landmark.title}
          </h2>
          <p className="mt-1 text-sm text-slate-300">{landmark.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close landmark details"
          className="w-9 h-9 rounded-lg border border-slate-300/15 text-slate-300 hover:text-[#eae5da] hover:bg-slate-200/10 flex items-center justify-center shrink-0 cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
          {landmark.summary}
        </p>

        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
            Key Highlights
          </h3>
          <ul className="space-y-2.5 text-sm text-slate-200">
            {landmark.highlights.map((item) => (
              <li key={item} className="leading-relaxed flex items-start gap-2.5">
                <span className="text-amber-400 font-semibold shrink-0" aria-hidden="true">
                  —
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Technologies & Focus
          </h3>
          <p className="text-xs sm:text-sm font-mono text-slate-300 leading-relaxed">
            {landmark.stack.join(' · ')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => onNavigateTo(landmark)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            <Navigation className="w-4 h-4" aria-hidden="true" />
            <span>Teleport Character Here</span>
          </button>

          {landmark.category === 'contact' ? (
            <button
              type="button"
              onClick={onOpenContact}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-100 font-medium text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap"
            >
              <Mail className="w-4 h-4" aria-hidden="true" />
              <span>Send Recruiter Message</span>
            </button>
          ) : (
            landmark.links.map((lnk) => (
              <a
                key={lnk.label}
                href={lnk.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-300/15 hover:border-amber-400/50 text-slate-100 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap"
              >
                <span>{lnk.label}</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            ))
          )}
        </div>
      </div>

      {/* Footer Prev / Next Landmark */}
      <div className="px-6 py-3.5 border-t border-slate-400/15 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onSelectLandmark(prevLm)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-amber-300 cursor-pointer whitespace-nowrap"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="truncate max-w-[130px]">{prevLm.title}</span>
        </button>

        <span className="text-xs font-mono tabular-nums text-slate-400">
          {idx + 1} / {LANDMARKS.length}
        </span>

        <button
          type="button"
          onClick={() => onSelectLandmark(nextLm)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-amber-300 cursor-pointer whitespace-nowrap"
        >
          <span className="truncate max-w-[130px]">{nextLm.title}</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
};

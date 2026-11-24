import React from 'react';
import { ArrowRight, Compass, MapPin } from 'lucide-react';
import { PORTFOLIO_OWNER } from '../data/portfolioData';

interface TitleOverlayProps {
  onStart: () => void;
  onOpenContact: () => void;
  discoveredCount: number;
  totalLandmarks: number;
}

export const TitleOverlay: React.FC<TitleOverlayProps> = ({
  onStart,
  onOpenContact,
  discoveredCount,
  totalLandmarks,
}) => {
  return (
    <div
      className="fixed inset-0 z-20 flex flex-col justify-between p-6 md:p-12 pointer-events-none"
      style={{
        background:
          'linear-gradient(105deg, rgba(11, 17, 30, 0.88) 0%, rgba(11, 17, 30, 0.56) 44%, rgba(11, 17, 30, 0.12) 100%)',
      }}
    >
      {/* Top subtle attribution line */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs md:text-sm text-slate-300 font-medium">
          <MapPin className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
          <span>{PORTFOLIO_OWNER.location}</span>
          <span aria-hidden="true">·</span>
          <span>{PORTFOLIO_OWNER.education}</span>
        </div>
        {discoveredCount > 0 && (
          <div className="text-xs font-mono tabular-nums text-amber-300">
            Saved Progress: {discoveredCount} / {totalLandmarks} Landmarks
          </div>
        )}
      </div>

      {/* Main Asymmetric Hero Lockup */}
      <div className="max-w-xl my-auto pointer-events-auto">
        {/* Custom inline SVG Himalayan Peak + Pagoda Crest */}
        <svg
          viewBox="0 0 88 52"
          className="w-20 h-12 mb-5"
          aria-hidden="true"
          fill="none"
        >
          <path
            d="M4 46L26 12L40 31L54 14L84 46H4Z"
            fill="#1e293b"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M26 12L32 21L26 19.5L20.5 21L26 12Z" fill="#dcd7cc" />
          <path d="M54 14L60 22.5L54 21L48 22.5L54 14Z" fill="#dcd7cc" />
          <path d="M35 46V35H45V46" fill="#d97706" />
          <path d="M31 35L40 27L49 35H31Z" fill="#f59e0b" />
          <circle cx="40" cy="24" r="2.2" fill="#fde68a" />
        </svg>

        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#eae5da] leading-[1.06]"
          style={{ fontFamily: 'var(--font-display)', textWrap: 'balance' }}
        >
          {PORTFOLIO_OWNER.name}
        </h1>

        <p className="mt-3 text-base sm:text-lg text-slate-200 font-medium">
          {PORTFOLIO_OWNER.role}
        </p>

        <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-md">
          Walk an open 3D landscape bridging Kathmandu&apos;s pagodas and Himalayan trails
          with VIT Vellore in India, local-first AI studios, and open-source systems.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <button
            type="button"
            data-start="true"
            onClick={onStart}
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-semibold text-sm sm:text-base transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 whitespace-nowrap shrink-0 shadow-lg"
          >
            <Compass className="w-4 h-4" aria-hidden="true" />
            <span>Explore World</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onOpenContact}
            className="inline-flex items-center gap-2 px-5 py-3.5 rounded-lg bg-[#182235] hover:bg-[#22304a] text-[#eae5da] border border-slate-300/15 font-medium text-sm sm:text-base transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 whitespace-nowrap shrink-0"
          >
            <span>Recruiter Contact</span>
          </button>
        </div>
      </div>

      {/* Single flat borderless control hint */}
      <div className="text-xs sm:text-sm text-slate-300/90 font-mono tracking-tight">
        WASD / Arrows Move · Shift Sprint · Space Jump · Click or E Inspect Landmarks · Drag Orbit
      </div>
    </div>
  );
};

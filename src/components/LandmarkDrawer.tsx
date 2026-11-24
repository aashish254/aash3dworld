import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Clock,
  ExternalLink,
  FileText,
  Mail,
  Navigation,
  X,
} from 'lucide-react';
import { LANDMARKS, LandmarkData } from '../data/portfolioData';
import {
  AchievementProgressInput,
  VisitHistoryEntry,
  evaluateAchievements,
  getRecentVisitHistory,
} from '../data/achievementsData';
import { Achievements } from './Achievements';

type DrawerTab = 'details' | 'milestones' | 'history';

interface LandmarkDrawerProps {
  landmark: LandmarkData | null;
  progress: AchievementProgressInput;
  visitHistory: VisitHistoryEntry[];
  onClose: () => void;
  onNavigateTo: (landmark: LandmarkData) => void;
  onSelectLandmark: (landmark: LandmarkData) => void;
  onOpenContact: () => void;
}

function formatVisitTime(ts: number): string {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export const LandmarkDrawer: React.FC<LandmarkDrawerProps> = ({
  landmark,
  progress,
  visitHistory,
  onClose,
  onNavigateTo,
  onSelectLandmark,
  onOpenContact,
}) => {
  const [activeTab, setActiveTab] = useState<DrawerTab>('details');

  useEffect(() => {
    setActiveTab('details');
  }, [landmark?.id]);

  if (!landmark) return null;

  const idx = LANDMARKS.findIndex((item) => item.id === landmark.id);
  const prevLm = LANDMARKS[(idx - 1 + LANDMARKS.length) % LANDMARKS.length];
  const nextLm = LANDMARKS[(idx + 1) % LANDMARKS.length];

  const recentVisits = getRecentVisitHistory(visitHistory, 5);
  const evaluatedMilestones = evaluateAchievements(progress);
  const unlockedCount = evaluatedMilestones.filter((m) => m.status.unlocked).length;

  return (
    <aside
      aria-label={landmark.title}
      className="fixed inset-x-3 top-16 bottom-4 sm:bottom-28 sm:left-auto sm:right-4 sm:w-[420px] z-30 rounded-2xl border border-slate-300/15 shadow-2xl flex flex-col overflow-hidden"
      style={{ backgroundColor: 'rgba(13, 20, 34, 0.96)' }}
    >
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-slate-400/15 flex items-start justify-between gap-4">
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
          className="w-10 h-10 rounded-lg border border-slate-300/15 text-slate-300 hover:text-[#eae5da] hover:bg-slate-200/10 flex items-center justify-center shrink-0 cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Tab Navigation */}
      <div
        role="tablist"
        aria-label="Landmark information views"
        className="px-6 py-2 border-b border-slate-400/15 grid grid-cols-3 gap-1.5 bg-[#0a101d]"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'details'}
          onClick={() => setActiveTab('details')}
          className={`h-10 rounded-md text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'details'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-300 hover:text-[#eae5da] hover:bg-slate-200/10'
          }`}
        >
          <FileText className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Details</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'milestones'}
          onClick={() => setActiveTab('milestones')}
          className={`h-10 rounded-md text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer tabular-nums ${
            activeTab === 'milestones'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-300 hover:text-[#eae5da] hover:bg-slate-200/10'
          }`}
        >
          <Award className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Milestones ({unlockedCount})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'history'}
          onClick={() => setActiveTab('history')}
          className={`h-10 rounded-md text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer tabular-nums ${
            activeTab === 'history'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-300 hover:text-[#eae5da] hover:bg-slate-200/10'
          }`}
        >
          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Visit History</span>
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {activeTab === 'details' && (
          <>
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
                Technologies &amp; Focus
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
          </>
        )}

        {activeTab === 'milestones' && (
          <Achievements progress={progress} embedded />
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Last 5 Locations Visited (Chronological)
              </h3>
              <span className="text-xs font-mono tabular-nums text-amber-300">
                {recentVisits.length}/5
              </span>
            </div>

            {recentVisits.length === 0 ? (
              <div className="rounded-lg border border-slate-300/12 bg-[#111a2b] p-4 text-sm text-slate-300">
                No locations recorded yet. Explore landmarks around the valley to build your trail history.
              </div>
            ) : (
              <ol className="space-y-2.5">
                {recentVisits.map((entry, stepIdx) => {
                  const visitedLandmark = LANDMARKS.find((item) => item.id === entry.id);
                  if (!visitedLandmark) return null;
                  const isCurrent = visitedLandmark.id === landmark.id;
                  return (
                    <li
                      key={`${entry.id}-${entry.visitedAt}`}
                      className={`rounded-lg border p-3.5 transition-colors ${
                        isCurrent
                          ? 'border-amber-400/50 bg-amber-500/10 border-l-4 border-l-amber-400'
                          : 'border-slate-300/12 bg-[#111a2b]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
                            <span>#{stepIdx + 1}</span>
                            <span aria-hidden="true">·</span>
                            <span>{formatVisitTime(entry.visitedAt)}</span>
                          </div>
                          <div className="mt-0.5 text-sm font-semibold text-[#eae5da] truncate">
                            {visitedLandmark.title}
                          </div>
                          <div className="text-xs text-slate-400 truncate">
                            {visitedLandmark.zoneName}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onNavigateTo(visitedLandmark)}
                          className="h-9 px-3 rounded-md border border-slate-300/15 hover:border-amber-400/50 text-xs font-medium text-slate-200 hover:text-amber-300 inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Visit</span>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        )}
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

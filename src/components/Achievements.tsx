import React from 'react';
import { Award, Check, Compass, Cpu, Footprints, Landmark, X } from 'lucide-react';
import {
  AchievementDefinition,
  AchievementProgressInput,
  evaluateAchievements,
} from '../data/achievementsData';

interface AchievementsProps {
  progress: AchievementProgressInput;
  embedded?: boolean;
  open?: boolean;
  onClose?: () => void;
}

const CATEGORY_LABELS: Record<AchievementDefinition['category'], string> = {
  exploration: 'Exploration',
  heritage: 'Nepal Heritage',
  engineering: 'Engineering & Research',
  distance: 'Journey Distance',
};

function renderCategoryIcon(category: AchievementDefinition['category'], unlocked: boolean) {
  const cls = `w-4 h-4 shrink-0 ${unlocked ? 'text-amber-300' : 'text-slate-400'}`;
  switch (category) {
    case 'heritage':
      return <Landmark className={cls} aria-hidden="true" />;
    case 'engineering':
      return <Cpu className={cls} aria-hidden="true" />;
    case 'distance':
      return <Footprints className={cls} aria-hidden="true" />;
    case 'exploration':
    default:
      return <Compass className={cls} aria-hidden="true" />;
  }
}

export const AchievementsList: React.FC<{ progress: AchievementProgressInput }> = ({ progress }) => {
  const items = evaluateAchievements(progress);
  const unlockedCount = items.filter((item) => item.status.unlocked).length;
  const distKm = (progress.totalDistanceWalked / 1000).toFixed(2);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-300/15 bg-[#121c30] p-3.5 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-slate-400">Explorer Milestones</div>
          <div className="mt-0.5 text-base font-bold text-[#eae5da] tabular-nums">
            {unlockedCount} / {items.length} Badges Earned
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-medium text-slate-400">Distance Walked</div>
          <div className="mt-0.5 text-sm font-mono font-semibold text-amber-300 tabular-nums">
            {Math.round(progress.totalDistanceWalked)} m ({distKm} km)
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        {items.map(({ definition, status }) => (
          <div
            key={definition.id}
            className={`rounded-lg border p-3.5 transition-colors ${
              status.unlocked
                ? 'border-amber-400/45 bg-amber-500/10 border-l-4 border-l-amber-400'
                : 'border-slate-300/12 bg-[#111a2b]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <div
                  className={`mt-0.5 w-8 h-8 rounded-md flex items-center justify-center shrink-0 border ${
                    status.unlocked
                      ? 'border-amber-400/40 bg-amber-400/15'
                      : 'border-slate-300/12 bg-slate-900/60'
                  }`}
                >
                  {renderCategoryIcon(definition.category, status.unlocked)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[#eae5da]">
                      {definition.title}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      · {CATEGORY_LABELS[definition.category]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-300 leading-relaxed">
                    {definition.description}
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1.5">
                {status.unlocked ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300 whitespace-nowrap">
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    Earned
                  </span>
                ) : (
                  <span className="text-xs font-mono tabular-nums text-slate-400 whitespace-nowrap">
                    {status.progressLabel}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-2.5 h-1.5 w-full rounded-sm bg-slate-900/90 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  status.unlocked ? 'bg-amber-400' : 'bg-sky-400/70'
                }`}
                style={{ width: `${Math.round(status.ratio * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const Achievements: React.FC<AchievementsProps> = ({
  progress,
  embedded = false,
  open = false,
  onClose,
}) => {
  if (embedded) {
    return <AchievementsList progress={progress} />;
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#070b14]/75"
      role="dialog"
      aria-modal="true"
      aria-label="Explorer Achievements"
    >
      <div
        className="w-full max-w-xl max-h-[84vh] rounded-2xl border border-slate-300/15 shadow-2xl flex flex-col overflow-hidden"
        style={{ backgroundColor: 'rgba(13, 20, 34, 0.98)' }}
      >
        <div className="px-6 py-4 border-b border-slate-400/15 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-amber-400" aria-hidden="true" />
            <div>
              <h2
                className="text-lg font-bold text-[#eae5da]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Achievements &amp; Milestones
              </h2>
              <p className="text-xs text-slate-400">
                Track heritage groups, engineering sites &amp; distance traveled
              </p>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close achievements"
              className="w-10 h-10 rounded-lg border border-slate-300/15 text-slate-300 hover:text-[#eae5da] hover:bg-slate-200/10 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AchievementsList progress={progress} />
        </div>
      </div>
    </div>
  );
};

import React, { useRef, useState } from 'react';
import {
  Award,
  Compass,
  Mail,
  Map as MapIcon,
  Pause,
  Volume2,
  VolumeX,
  WifiOff,
  X,
  Sparkles,
} from 'lucide-react';
import { LandmarkData } from '../data/portfolioData';
import { LiveWeatherInfo } from '../services/weatherService';
import { ContextualWorldAction, TimeLightingState, WeatherKind } from '../world/worldLogic';

interface WorldHudProps {
  zoneName: string;
  discoveredCount: number;
  totalLandmarks: number;
  unlockedAchievementsCount: number;
  totalAchievementsCount: number;
  distanceWalked: number;
  timeState: TimeLightingState;
  weatherInfo: LiveWeatherInfo;
  activeWeather: WeatherKind;
  isOffline: boolean;
  soundEnabled: boolean;
  nearestLandmark: LandmarkData | null;
  placementMode: boolean;
  dockCollapsed: boolean;
  showLumbiniPresets?: boolean;
  hasOpenLandmark: boolean;
  onToggleSound: () => void;
  onOpenAchievements: () => void;
  onOpenAtlas: () => void;
  onOpenContact: () => void;
  onPause: () => void;
  onInspectNearest: (landmark: LandmarkData) => void;
  contextualAction: ContextualWorldAction | null;
  isMeditating: boolean;
  onTriggerAction: () => void;
  activeHighlight: { title: string; subtitle: string; description: string } | null;
  onCloseHighlight: () => void;
  onJoystickMove: (x: number, y: number) => void;
  onJump: () => void;
}

const WEATHER_LABELS: Record<WeatherKind, string> = {
  clear: 'Clear',
  mist: 'Mist',
  foggy: 'Foggy',
  rain: 'Rain',
  snow: 'Snow',
};

export const WorldHud: React.FC<WorldHudProps> = ({
  zoneName,
  discoveredCount,
  totalLandmarks,
  unlockedAchievementsCount,
  totalAchievementsCount,
  distanceWalked,
  timeState,
  weatherInfo,
  activeWeather,
  isOffline,
  soundEnabled,
  nearestLandmark,
  placementMode,
  dockCollapsed,
  showLumbiniPresets = false,
  hasOpenLandmark,
  onToggleSound,
  onOpenAchievements,
  onOpenAtlas,
  onOpenContact,
  onPause,
  onInspectNearest,
  contextualAction,
  isMeditating,
  onTriggerAction,
  activeHighlight,
  onCloseHighlight,
  onJoystickMove,
  onJump,
}) => {
  const padRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [stickActive, setStickActive] = useState(false);

  const handleStickMove = (clientX: number, clientY: number) => {
    const el = padRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.38;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, maxR);
    const angle = Math.atan2(dy, dx);
    const kx = Math.cos(angle) * clamped;
    const ky = Math.sin(angle) * clamped;
    setKnobPos({ x: kx, y: ky });
    onJoystickMove(kx / maxR, ky / maxR);
  };

  const resetStick = () => {
    setStickActive(false);
    setKnobPos({ x: 0, y: 0 });
    onJoystickMove(0, 0);
  };

  const formattedHour = (() => {
    const h24 = Math.floor(timeState.hour);
    const m = Math.floor((timeState.hour - h24) * 60);
    const suffix = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
  })();

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-2.5 sm:p-4">
      {/* Top Perimeter Clusters */}
      <div className="flex items-start justify-between gap-1.5 sm:gap-2">
        {/* Top-Left Compact Location & Progress Readout */}
        <div
          className="pointer-events-auto rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 border border-slate-300/15 shadow-lg min-w-0 flex-1 sm:flex-initial sm:max-w-md"
          style={{ backgroundColor: 'rgba(13, 20, 34, 0.90)' }}
        >
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#eae5da] truncate">
            <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" aria-hidden="true" />
            <span className="truncate">{zoneName}</span>
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] sm:text-xs text-slate-300 tabular-nums">
            <span className="text-amber-300 font-medium whitespace-nowrap">
              {discoveredCount}/{totalLandmarks} Landmarks
            </span>
            <span className="hidden sm:inline" aria-hidden="true">
              ·
            </span>
            <span className="hidden sm:inline whitespace-nowrap">{Math.round(distanceWalked)}m walked</span>
            <span className="hidden sm:inline" aria-hidden="true">
              ·
            </span>
            <span className="hidden sm:inline whitespace-nowrap">
              {formattedHour} ({timeState.phaseLabel})
            </span>
            <span className="hidden sm:inline" aria-hidden="true">
              ·
            </span>
            <span className="hidden sm:inline whitespace-nowrap">
              {WEATHER_LABELS[activeWeather]} {weatherInfo.temperatureC}°C
            </span>
            {isOffline && (
              <span className="inline-flex items-center gap-1 text-amber-300 whitespace-nowrap">
                <WifiOff className="w-3 h-3" aria-hidden="true" />
                Offline Sync
              </span>
            )}
          </div>
        </div>

        {/* Top-Right Compact Utility Controls */}
        <div className="pointer-events-auto flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleSound();
            }}
            aria-label={soundEnabled ? 'Mute sound (M)' : 'Enable sound (M)'}
            title={soundEnabled ? 'Mute sound (M)' : 'Enable sound (M)'}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border border-slate-300/15 text-slate-100 hover:border-amber-400/60 hover:text-amber-300 flex items-center justify-center transition-colors cursor-pointer"
            style={{ backgroundColor: 'rgba(13, 20, 34, 0.90)' }}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenAchievements();
            }}
            aria-label={`Open Achievements (${unlockedAchievementsCount} of ${totalAchievementsCount} unlocked)`}
            title="Achievements & Milestones"
            className="w-8 h-8 sm:w-auto sm:h-10 sm:px-3 rounded-lg border border-slate-300/15 text-slate-100 hover:border-amber-400/60 hover:text-amber-300 inline-flex items-center justify-center gap-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums"
            style={{ backgroundColor: 'rgba(13, 20, 34, 0.90)' }}
          >
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" aria-hidden="true" />
            <span className="hidden sm:inline">
              Badges {unlockedAchievementsCount}/{totalAchievementsCount}
            </span>
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenAtlas();
            }}
            aria-label="Open World Atlas (L)"
            title="World Atlas (L)"
            className="w-8 h-8 sm:w-auto sm:h-10 sm:px-3 rounded-lg border border-slate-300/15 text-slate-100 hover:border-amber-400/60 hover:text-amber-300 inline-flex items-center justify-center gap-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
            style={{ backgroundColor: 'rgba(13, 20, 34, 0.90)' }}
          >
            <MapIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Atlas</span>
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenContact();
            }}
            aria-label="Contact Recruiter Form"
            className="h-8 sm:h-10 px-2 sm:px-3.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-[11px] sm:text-xs inline-flex items-center gap-1 sm:gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow"
          >
            <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
            <span className="sm:hidden">Contact</span>
            <span className="hidden sm:inline">Hire / Contact</span>
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onPause();
            }}
            aria-label="Pause Menu (P)"
            title="Pause Menu (P)"
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border border-slate-300/15 text-slate-100 hover:border-amber-400/60 hover:text-amber-300 flex items-center justify-center transition-colors cursor-pointer"
            style={{ backgroundColor: 'rgba(13, 20, 34, 0.90)' }}
          >
            <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Center-Bottom Contextual Interaction Prompt */}
      <div
        className={`flex flex-col items-center gap-2 transition-all ${
          dockCollapsed ? 'mb-16' : showLumbiniPresets ? 'mb-56' : 'mb-44'
        }`}
      >
        {placementMode && (
          <div
            className="pointer-events-auto px-4 py-2 rounded-lg border border-amber-400/60 text-amber-200 text-xs sm:text-sm font-medium shadow-lg"
            style={{ backgroundColor: 'rgba(13, 20, 34, 0.94)' }}
          >
            Click or tap anywhere on the terrain to place your custom marker
          </div>
        )}

        {activeHighlight && (
          <div
            data-testid="maya-devi-highlight-card"
            className="pointer-events-auto max-w-md w-[90vw] rounded-xl border border-amber-400/55 px-4 py-3 text-left shadow-2xl"
            style={{ backgroundColor: 'rgba(13, 20, 34, 0.96)' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-300">
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{activeHighlight.subtitle}</span>
                </div>
                <h2 className="mt-0.5 text-sm sm:text-base font-bold text-[#eae5da]">
                  {activeHighlight.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onCloseHighlight}
                aria-label="Close artifact details"
                className="p-1 rounded-md text-slate-300 hover:text-amber-300 hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
              {activeHighlight.description}
            </p>
          </div>
        )}

        {(isMeditating || (contextualAction && !placementMode && !hasOpenLandmark && !activeHighlight)) && (
          <button
            type="button"
            data-testid="contextual-action-prompt"
            onClick={() => {
              if (contextualAction?.kind === 'landmark' && contextualAction.landmark) {
                onInspectNearest(contextualAction.landmark);
              } else {
                onTriggerAction();
              }
            }}
            className="hidden sm:inline-flex pointer-events-auto px-4 py-2 rounded-lg border border-amber-400/70 text-[#eae5da] hover:bg-amber-500 hover:text-slate-950 text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-lg whitespace-nowrap max-w-[90vw] truncate"
            style={{ backgroundColor: 'rgba(13, 20, 34, 0.94)' }}
          >
            {isMeditating
              ? 'Press E or Move · Leave Meditation'
              : `Press E or Click · ${contextualAction?.label ?? ''}`}
          </button>
        )}

        {!contextualAction && nearestLandmark && !placementMode && !hasOpenLandmark && !isMeditating && !activeHighlight && (
          <button
            type="button"
            onClick={() => onInspectNearest(nearestLandmark)}
            className="hidden sm:inline-flex pointer-events-auto px-4 py-2 rounded-lg border border-amber-400/70 text-[#eae5da] hover:bg-amber-500 hover:text-slate-950 text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-lg whitespace-nowrap max-w-[90vw] truncate"
            style={{ backgroundColor: 'rgba(13, 20, 34, 0.94)' }}
          >
            Press E or Click to Inspect · {nearestLandmark.title}
          </button>
        )}
      </div>

      {/* Mobile Touch Controls (Positioned cleanly above collapsed dock) */}
      <div
        className={`sm:hidden fixed inset-x-0 px-3 flex items-end justify-between pointer-events-none transition-all ${
          dockCollapsed ? 'bottom-14' : showLumbiniPresets ? 'bottom-52' : 'bottom-40'
        }`}
      >
        {/* Virtual Thumbstick */}
        <div
          ref={padRef}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setStickActive(true);
            handleStickMove(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            if (stickActive) handleStickMove(e.clientX, e.clientY);
          }}
          onPointerUp={resetStick}
          onPointerCancel={resetStick}
          aria-label="Movement Joystick"
          className="pointer-events-auto relative w-20 h-20 rounded-full border border-slate-300/20 touch-none flex items-center justify-center"
          style={{ backgroundColor: 'rgba(13, 20, 34, 0.78)' }}
        >
          <div
            className="w-9 h-9 rounded-full bg-amber-400/90 shadow-md transition-transform duration-75"
            style={{
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            }}
          />
        </div>

        {/* Touch Action Buttons (>= 44px tap targets) */}
        <div className="pointer-events-auto flex items-center gap-2">
          {(isMeditating || (contextualAction && !hasOpenLandmark) || (nearestLandmark && !hasOpenLandmark)) && (
            <button
              type="button"
              onClick={() => {
                if (isMeditating || (contextualAction && contextualAction.kind !== 'landmark')) {
                  onTriggerAction();
                } else if (nearestLandmark) {
                  onInspectNearest(nearestLandmark);
                }
              }}
              className="min-w-[48px] h-11 px-3.5 rounded-xl bg-amber-500 text-slate-950 font-semibold text-xs shadow-lg active:bg-amber-600"
            >
              {isMeditating
                ? 'Stand'
                : contextualAction?.kind === 'toss-pebble'
                  ? 'Toss'
                  : contextualAction?.kind === 'spin-prayer-wheel'
                    ? 'Spin'
                    : contextualAction?.kind === 'sit-meditate'
                      ? 'Meditate'
                      : 'Inspect'}
            </button>
          )}
          <button
            type="button"
            onClick={onJump}
            className="min-w-[52px] h-11 px-3.5 rounded-xl border border-slate-300/20 text-slate-100 font-semibold text-xs shadow-lg active:bg-slate-700"
            style={{ backgroundColor: 'rgba(13, 20, 34, 0.88)' }}
          >
            Jump
          </button>
        </div>
      </div>
    </div>
  );
};

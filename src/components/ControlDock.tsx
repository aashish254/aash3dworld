import React from 'react';
import {
  ChevronDown,
  ChevronUp,
  CloudFog,
  CloudRain,
  CloudSnow,
  Flag,
  Share2,
  Sun,
  Sunset,
  Moon,
  Sparkles,
  Volume2,
  VolumeX,
  Wind,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import {
  CameraViewMode,
  GraphicsQualityPreset,
  LUMBINI_PRESET_OPTIONS,
  LumbiniAmbiencePreset,
  TimePreset,
  WeatherKind,
} from '../world/worldLogic';

interface ControlDockProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  timePreset: TimePreset;
  onChangeTimePreset: (preset: TimePreset) => void;
  weatherMode: 'live' | WeatherKind;
  onChangeWeatherMode: (mode: 'live' | WeatherKind) => void;
  lumbiniPreset: LumbiniAmbiencePreset;
  onChangeLumbiniPreset: (preset: LumbiniAmbiencePreset) => void;
  showLumbiniPresets: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  placementMode: boolean;
  onTogglePlacementMode: () => void;
  onShareTrail: () => void;
  waypointCount: number;
  shareFeedback: string | null;
  cameraMode: CameraViewMode;
  onToggleCameraMode: () => void;
  graphicsQuality: GraphicsQualityPreset;
  onChangeGraphicsQuality: (quality: GraphicsQualityPreset) => void;
}

const TIME_OPTIONS: Array<{ id: TimePreset; label: string; icon: React.ReactNode }> = [
  { id: 'live', label: 'Live', icon: <Sun className="w-3.5 h-3.5" aria-hidden="true" /> },
  { id: 'dawn', label: 'Dawn', icon: <Sunset className="w-3.5 h-3.5" aria-hidden="true" /> },
  { id: 'noon', label: 'Noon', icon: <Sun className="w-3.5 h-3.5" aria-hidden="true" /> },
  { id: 'dusk', label: 'Dusk', icon: <Sunset className="w-3.5 h-3.5" aria-hidden="true" /> },
  { id: 'night', label: 'Night', icon: <Moon className="w-3.5 h-3.5" aria-hidden="true" /> },
];

const WEATHER_OPTIONS: Array<{
  id: 'live' | WeatherKind;
  label: string;
  icon: React.ReactNode;
}> = [
  { id: 'live', label: 'Live', icon: <Wind className="w-3.5 h-3.5" aria-hidden="true" /> },
  { id: 'clear', label: 'Clear', icon: <Sun className="w-3.5 h-3.5" aria-hidden="true" /> },
  { id: 'mist', label: 'Mist', icon: <Wind className="w-3.5 h-3.5" aria-hidden="true" /> },
  { id: 'foggy', label: 'Foggy', icon: <CloudFog className="w-3.5 h-3.5" aria-hidden="true" /> },
  { id: 'rain', label: 'Rain', icon: <CloudRain className="w-3.5 h-3.5" aria-hidden="true" /> },
  { id: 'snow', label: 'Snow', icon: <CloudSnow className="w-3.5 h-3.5" aria-hidden="true" /> },
];

export const ControlDock: React.FC<ControlDockProps> = ({
  collapsed,
  onToggleCollapsed,
  timePreset,
  onChangeTimePreset,
  weatherMode,
  onChangeWeatherMode,
  lumbiniPreset,
  onChangeLumbiniPreset,
  showLumbiniPresets,
  soundEnabled,
  onToggleSound,
  placementMode,
  onTogglePlacementMode,
  onShareTrail,
  waypointCount,
  shareFeedback,
  cameraMode,
  onToggleCameraMode,
  graphicsQuality,
  onChangeGraphicsQuality,
}) => {
  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none"
      style={{ maxWidth: 'min(960px, 95vw)' }}
    >
      {/* Collapse / Expand Tab */}
      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-expanded={!collapsed}
        className="pointer-events-auto mb-1.5 px-3 py-1 rounded-t-lg border border-b-0 border-slate-300/15 text-xs font-medium text-slate-200 hover:text-amber-300 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        style={{ backgroundColor: 'rgba(13, 20, 34, 0.92)' }}
      >
        {collapsed ? (
          <>
            <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Show Controls (H)</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Hide Controls (H)</span>
          </>
        )}
      </button>

      {!collapsed && (
        <div
          className="pointer-events-auto w-full rounded-xl border border-slate-300/15 px-3 py-2.5 shadow-2xl flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
          style={{ backgroundColor: 'rgba(13, 20, 34, 0.92)' }}
        >
          {/* Time of Day Segmented Control */}
          <div className="flex flex-wrap items-center justify-center gap-1" role="group" aria-label="Time of Day">
            <span className="text-[11px] font-medium text-slate-400 mr-1 hidden md:inline">
              Sky
            </span>
            {TIME_OPTIONS.map((opt) => {
              const active = timePreset === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangeTimePreset(opt.id)}
                  className={`px-2 sm:px-2.5 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-300 hover:text-[#eae5da] hover:bg-slate-200/10'
                  }`}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Weather Segmented Control */}
          <div className="flex flex-wrap items-center justify-center gap-1" role="group" aria-label="Weather">
            <span className="text-[11px] font-medium text-slate-400 mr-1 hidden md:inline">
              Weather
            </span>
            {WEATHER_OPTIONS.map((opt) => {
              const active = weatherMode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangeWeatherMode(opt.id)}
                  className={`px-2 sm:px-2.5 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-sky-500/85 text-slate-950'
                      : 'text-slate-300 hover:text-[#eae5da] hover:bg-slate-200/10'
                  }`}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Custom Trail Marker & Ambient Audio Tools */}
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <button
              type="button"
              data-testid="dock-audio-toggle"
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleSound();
              }}
              aria-pressed={soundEnabled}
              aria-label={soundEnabled ? 'Mute ambient audio (M)' : 'Enable ambient audio (M)'}
              title={soundEnabled ? 'Mute ambient audio (M)' : 'Enable ambient audio (M)'}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                soundEnabled
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-200 hover:bg-white/10 border border-slate-300/15'
              }`}
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>{soundEnabled ? 'Sound On (M)' : 'Audio (M)'}</span>
            </button>

            <button
              type="button"
              onClick={onTogglePlacementMode}
              aria-pressed={placementMode}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                placementMode
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-200 hover:bg-white/10 border border-slate-300/15'
              }`}
            >
              <Flag className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{placementMode ? 'Tap Terrain...' : 'Place Marker'}</span>
            </button>

            {waypointCount > 0 && (
              <button
                type="button"
                onClick={onShareTrail}
                className="px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-200 hover:bg-white/10 border border-slate-300/15 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{shareFeedback || `Share (${waypointCount})`}</span>
              </button>
            )}

            <button
              type="button"
              data-testid="dock-camera-toggle"
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleCameraMode();
              }}
              aria-pressed={cameraMode === 'first-person'}
              title="Toggle First-Person / Third-Person Camera (V)"
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                cameraMode === 'first-person'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-200 hover:bg-white/10 border border-slate-300/15'
              }`}
            >
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{cameraMode === 'first-person' ? '1st Person (V)' : '3rd Person (V)'}</span>
            </button>

            <div
              className="flex items-center gap-0.5 border border-slate-300/15 rounded-md p-0.5"
              role="group"
              aria-label="Graphics Quality"
            >
              <span className="text-[11px] font-medium text-slate-400 px-1.5 hidden md:inline-flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3" aria-hidden="true" />
              </span>
              {(['high', 'medium', 'low'] as GraphicsQualityPreset[]).map((q) => {
                const active = graphicsQuality === q;
                const label = q === 'high' ? 'High' : q === 'medium' ? 'Med' : 'Low';
                return (
                  <button
                    key={q}
                    type="button"
                    data-testid={`quality-${q}`}
                    onClick={() => onChangeGraphicsQuality(q)}
                    aria-pressed={active}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-slate-200 text-slate-950'
                        : 'text-slate-300 hover:text-[#eae5da] hover:bg-slate-200/10'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {showLumbiniPresets && (
            <div
              className="w-full pt-2 border-t border-slate-300/15 flex flex-wrap items-center justify-center gap-1"
              role="group"
              aria-label="Lumbini Atmosphere"
            >
              <span className="text-[11px] font-medium text-amber-300/90 mr-1.5 inline-flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Lumbini Ambience</span>
              </span>
              {LUMBINI_PRESET_OPTIONS.map((opt) => {
                const active = lumbiniPreset === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    data-testid={`lumbini-preset-${opt.id}`}
                    title={opt.description}
                    aria-pressed={active}
                    onClick={() => onChangeLumbiniPreset(opt.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-amber-400 text-slate-950'
                        : 'text-slate-300 hover:text-[#eae5da] hover:bg-slate-200/10'
                    }`}
                  >
                    {opt.shortLabel}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

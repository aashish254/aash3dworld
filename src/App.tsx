import { useCallback, useEffect, useRef, useState } from 'react';
import { LANDMARKS, LandmarkData } from './data/portfolioData';
import { LiveWeatherInfo, fetchLiveWeather } from './services/weatherService';
import { WorldEngine, WorldGameState, WorldHudSnapshot } from './world/WorldEngine';
import { soundEngine } from './world/soundEngine';
import {
  CameraViewMode,
  CustomWaypoint,
  GraphicsQualityPreset,
  LumbiniAmbiencePreset,
  TimePreset,
  WeatherKind,
  computeTimeLightingState,
  decodeWaypointsFromHash,
  encodeWaypointsToHash,
  getLandmarkApproachPoint,
  getPresetHour,
} from './world/worldLogic';
import {
  ACHIEVEMENTS,
  VisitHistoryEntry,
  evaluateAchievements,
  recordVisitHistory,
} from './data/achievementsData';
import { Achievements } from './components/Achievements';
import { TitleOverlay } from './components/TitleOverlay';
import { WorldHud } from './components/WorldHud';
import { ControlDock } from './components/ControlDock';
import { LandmarkDrawer } from './components/LandmarkDrawer';
import { LandmarksIndexModal } from './components/LandmarksIndexModal';
import { ContactModal } from './components/ContactModal';
import { PauseModal } from './components/PauseModal';
import { WaypointPromptModal } from './components/WaypointPromptModal';

const STORAGE_PROGRESS_KEY = 'aashish_3d_progress_v1';

interface PersistedState {
  discoveredIds: string[];
  customWaypoints: CustomWaypoint[];
  visitHistory: VisitHistoryEntry[];
  totalDistanceWalked: number;
  bellRingsCount: number;
}

function loadPersistedState(): PersistedState {
  let discoveredIds: string[] = [];
  let customWaypoints: CustomWaypoint[] = [];
  let visitHistory: VisitHistoryEntry[] = [];
  let totalDistanceWalked = 0;
  let bellRingsCount = 0;
  try {
    const raw = localStorage.getItem(STORAGE_PROGRESS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (Array.isArray(parsed.discoveredIds)) {
        discoveredIds = parsed.discoveredIds.filter((id) => typeof id === 'string');
      }
      if (Array.isArray(parsed.customWaypoints)) {
        customWaypoints = parsed.customWaypoints;
      }
      if (Array.isArray(parsed.visitHistory)) {
        visitHistory = parsed.visitHistory.filter(
          (entry): entry is VisitHistoryEntry =>
            Boolean(entry) &&
            typeof entry.id === 'string' &&
            typeof entry.visitedAt === 'number' &&
            Number.isFinite(entry.visitedAt),
        );
      }
      if (
        typeof parsed.totalDistanceWalked === 'number' &&
        Number.isFinite(parsed.totalDistanceWalked) &&
        parsed.totalDistanceWalked >= 0
      ) {
        totalDistanceWalked = parsed.totalDistanceWalked;
      }
      if (
        typeof parsed.bellRingsCount === 'number' &&
        Number.isFinite(parsed.bellRingsCount) &&
        parsed.bellRingsCount >= 0
      ) {
        bellRingsCount = parsed.bellRingsCount;
      }
    }
  } catch {
    // Ignore storage read errors
  }

  if (typeof window !== 'undefined' && window.location.hash.startsWith('#trail=')) {
    const shared = decodeWaypointsFromHash(window.location.hash);
    if (shared.length > 0) {
      const existingLabels = new Set(customWaypoints.map((w) => w.label));
      for (const wp of shared) {
        if (!existingLabels.has(wp.label)) {
          customWaypoints.push(wp);
        }
      }
    }
  }
  return {
    discoveredIds,
    customWaypoints,
    visitHistory,
    totalDistanceWalked,
    bellRingsCount,
  };
}

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<WorldEngine | null>(null);

  const initialAutostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const [gameState, setGameState] = useState<WorldGameState>(
    initialAutostart ? 'playing' : 'title',
  );
  const [persisted, setPersisted] = useState<PersistedState>(() => loadPersistedState());
  const [selectedLandmark, setSelectedLandmark] = useState<LandmarkData | null>(null);
  const [atlasOpen, setAtlasOpen] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const lastSavedDistanceRef = useRef<number>(persisted.totalDistanceWalked);
  const [dockCollapsed, setDockCollapsed] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 640,
  );
  const [placementMode, setPlacementMode] = useState(false);
  const [pendingWaypointCoords, setPendingWaypointCoords] = useState<{
    x: number;
    z: number;
  } | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const [timePreset, setTimePreset] = useState<TimePreset>('live');
  const [weatherMode, setWeatherMode] = useState<'live' | WeatherKind>('live');
  const [lumbiniPreset, setLumbiniPreset] = useState<LumbiniAmbiencePreset>('sanctuary-auto');
  const [weatherInfo, setWeatherInfo] = useState<LiveWeatherInfo>({
    weather: 'clear',
    temperatureC: 18,
    windKmh: 7,
    locationLabel: 'Kathmandu Valley',
    source: 'offline-fallback',
    updatedAt: Date.now(),
  });
  const [isOffline, setIsOffline] = useState<boolean>(
    typeof navigator !== 'undefined' ? !navigator.onLine : false,
  );
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [webglError, setWebglError] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<CameraViewMode>('third-person');
  const [graphicsQuality, setGraphicsQuality] = useState<GraphicsQualityPreset>('high');
  const [activeHighlight, setActiveHighlight] = useState<{
    title: string;
    subtitle: string;
    description: string;
  } | null>(null);

  const [hud, setHud] = useState<WorldHudSnapshot>(() => ({
    zoneName: 'Kathmandu Valley',
    nearestLandmark: null,
    distanceWalked: persisted.totalDistanceWalked,
    timeState: computeTimeLightingState(getPresetHour('live'), 'clear'),
    coords: { x: 0, z: 6 },
    contextualAction: null,
    isMeditating: false,
  }));

  const achievementProgress = {
    discoveredIds: persisted.discoveredIds,
    totalDistanceWalked: Math.max(persisted.totalDistanceWalked, hud.distanceWalked),
    customWaypointCount: persisted.customWaypoints.length,
    bellRingsCount: persisted.bellRingsCount,
  };
  const unlockedAchievementsCount = evaluateAchievements(achievementProgress).filter(
    (item) => item.status.unlocked,
  ).length;

  const activeWeather: WeatherKind =
    weatherMode === 'live' ? weatherInfo.weather : weatherMode;

  // Keep body data-state synced for accessibility and verification
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-width: 639px)');
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setDockCollapsed(true);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Persist discovered landmarks & custom markers offline
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PROGRESS_KEY, JSON.stringify(persisted));
    } catch {
      // Ignore quota issues
    }
    engineRef.current?.syncCustomWaypoints(persisted.customWaypoints);
    engineRef.current?.syncDiscoveredLandmarks(persisted.discoveredIds);
  }, [persisted]);

  // Real-time weather fetch + online/offline sync listener
  useEffect(() => {
    let active = true;
    fetchLiveWeather().then((info) => {
      if (active) setWeatherInfo(info);
    });

    const handleOnline = () => {
      setIsOffline(false);
      fetchLiveWeather().then((info) => {
        if (active) setWeatherInfo(info);
      });
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      active = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const openLandmark = useCallback((landmark: LandmarkData) => {
    setSelectedLandmark(landmark);
    setAtlasOpen(false);
    setAchievementsOpen(false);
    engineRef.current?.markLandmarkDiscovered(landmark.id);
    engineRef.current?.setFocusedLandmark(landmark);
    soundEngine.playBellChime();
    setPersisted((prev) => {
      const discoveredIds = prev.discoveredIds.includes(landmark.id)
        ? prev.discoveredIds
        : [...prev.discoveredIds, landmark.id];
      const visitHistory = recordVisitHistory(prev.visitHistory, landmark.id);
      return { ...prev, discoveredIds, visitHistory };
    });
  }, []);

  const callbacksRef = useRef({
    onSelectLandmark: openLandmark,
    onHudUpdate: (snapshot: WorldHudSnapshot) => {
      setHud(snapshot);
      if (snapshot.distanceWalked - lastSavedDistanceRef.current >= 10) {
        lastSavedDistanceRef.current = snapshot.distanceWalked;
        setPersisted((prev) =>
          snapshot.distanceWalked > prev.totalDistanceWalked
            ? { ...prev, totalDistanceWalked: Math.round(snapshot.distanceWalked) }
            : prev,
        );
      }
    },
    onBellRing: () => {
      setPersisted((prev) => ({ ...prev, bellRingsCount: prev.bellRingsCount + 1 }));
    },
    onPlaceWaypointRequest: (x: number, z: number) => {
      setPlacementMode(false);
      setPendingWaypointCoords({ x, z });
    },
    onInspectHighlight: (highlight: { title: string; subtitle: string; description: string }) => {
      setActiveHighlight(highlight);
    },
    onWebglError: (msg: string) => setWebglError(msg),
  });

  // Mount Three.js WorldEngine once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const engine = new WorldEngine(container, {
      onSelectLandmark: (lm) => callbacksRef.current.onSelectLandmark(lm),
      onHudUpdate: (snap) => callbacksRef.current.onHudUpdate(snap),
      onBellRing: () => callbacksRef.current.onBellRing(),
      onPlaceWaypointRequest: (x, z) => callbacksRef.current.onPlaceWaypointRequest(x, z),
      onInspectHighlight: (hl) => callbacksRef.current.onInspectHighlight(hl),
      onWebglError: (msg) => callbacksRef.current.onWebglError(msg),
    });
    engineRef.current = engine;
    engine.setInitialDistanceWalked(persisted.totalDistanceWalked);
    engine.setGameState(initialAutostart ? 'playing' : 'title');
    engine.syncCustomWaypoints(persisted.customWaypoints);
    engine.syncDiscoveredLandmarks(persisted.discoveredIds);

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync engine state with React controls
  useEffect(() => {
    engineRef.current?.setGameState(gameState);
  }, [gameState]);

  useEffect(() => {
    engineRef.current?.setTimePreset(timePreset);
  }, [timePreset]);

  useEffect(() => {
    engineRef.current?.setWeather(activeWeather);
  }, [activeWeather]);

  useEffect(() => {
    engineRef.current?.setLumbiniPreset(lumbiniPreset);
  }, [lumbiniPreset]);

  useEffect(() => {
    engineRef.current?.setPlacementMode(placementMode);
  }, [placementMode]);

  useEffect(() => {
    engineRef.current?.setCameraMode(cameraMode);
  }, [cameraMode]);

  useEffect(() => {
    engineRef.current?.setGraphicsQuality(graphicsQuality);
  }, [graphicsQuality]);

  const handleStart = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    document.body.dataset.state = 'playing';
    setGameState('playing');
    soundEngine.playClick();
  }, []);

  const handleCloseLandmark = useCallback(() => {
    setSelectedLandmark(null);
    engineRef.current?.setFocusedLandmark(null);
  }, []);

  const handleTeleportLandmark = useCallback(
    (lm: LandmarkData) => {
      const pt = getLandmarkApproachPoint(lm);
      engineRef.current?.teleportTo(pt.x, pt.z);
      openLandmark(lm);
    },
    [openLandmark],
  );

  // Global keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        if (e.code === 'Escape') {
          setContactOpen(false);
          setPendingWaypointCoords(null);
        }
        return;
      }

      if (gameState === 'title') {
        if ((e.code === 'Enter' || e.code === 'Space') && !contactOpen) {
          e.preventDefault();
          handleStart();
        }
        return;
      }

      if (e.code === 'KeyE' && gameState === 'playing') {
        if (activeHighlight) {
          e.preventDefault();
          setActiveHighlight(null);
          return;
        }
        if (hud.contextualAction || hud.isMeditating || hud.nearestLandmark) {
          e.preventDefault();
          if (hud.contextualAction || hud.isMeditating) {
            engineRef.current?.triggerContextualAction();
          } else if (hud.nearestLandmark) {
            openLandmark(hud.nearestLandmark);
          }
          return;
        }
      }

      if (e.code === 'KeyV' && gameState === 'playing') {
        setCameraMode((prev) => (prev === 'third-person' ? 'first-person' : 'third-person'));
        return;
      }

      if (e.code === 'KeyM') {
        setSoundEnabled(soundEngine.toggle());
        return;
      }

      if (e.code === 'KeyH') {
        setDockCollapsed((prev) => !prev);
        return;
      }

      if (e.code === 'KeyL' && gameState === 'playing') {
        setAtlasOpen((prev) => !prev);
        return;
      }

      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        if (contactOpen) {
          setContactOpen(false);
          return;
        }
        if (pendingWaypointCoords) {
          setPendingWaypointCoords(null);
          return;
        }
        if (activeHighlight) {
          setActiveHighlight(null);
          return;
        }
        if (achievementsOpen) {
          setAchievementsOpen(false);
          return;
        }
        if (atlasOpen) {
          setAtlasOpen(false);
          return;
        }
        if (selectedLandmark) {
          handleCloseLandmark();
          return;
        }
        if (placementMode) {
          setPlacementMode(false);
          return;
        }
        setGameState((prev) => (prev === 'playing' ? 'paused' : 'playing'));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    achievementsOpen,
    activeHighlight,
    atlasOpen,
    contactOpen,
    gameState,
    handleCloseLandmark,
    handleStart,
    hud.contextualAction,
    hud.isMeditating,
    hud.nearestLandmark,
    openLandmark,
    pendingWaypointCoords,
    placementMode,
    selectedLandmark,
  ]);

  const handleSaveWaypoint = (label: string, color: string) => {
    if (!pendingWaypointCoords) return;
    const nextWp: CustomWaypoint = {
      id: `wp_${Date.now().toString(36)}`,
      label,
      x: pendingWaypointCoords.x,
      z: pendingWaypointCoords.z,
      color,
      createdAt: Date.now(),
    };
    setPersisted((prev) => ({
      ...prev,
      customWaypoints: [...prev.customWaypoints, nextWp],
    }));
    setPendingWaypointCoords(null);
    soundEngine.playBellChime();
  };

  const handleShareTrail = () => {
    const hash = encodeWaypointsToHash(persisted.customWaypoints);
    if (!hash) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}${hash}`;
    window.history.replaceState(null, '', hash);
    navigator.clipboard?.writeText(shareUrl).catch(() => undefined);
    setShareFeedback('Link Copied');
    window.setTimeout(() => setShareFeedback(null), 2200);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0f1724] select-none">
      {/* Dedicated WebGL Mount Container */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full"
        aria-label="Interactive 3D Portfolio World"
      />

      {webglError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#0f1724]">
          <div className="max-w-md rounded-2xl border border-white/15 bg-[#152033] p-6 space-y-4">
            <h1 className="text-xl font-bold text-slate-50">
              Aashish Kumar Mahato — 3D Portfolio
            </h1>
            <p className="text-sm text-slate-300">
              WebGL rendering is unavailable in this browser context ({webglError}). You can still explore Aashish&apos;s story or send a recruiter inquiry directly.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setAtlasOpen(true)}
                className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 text-xs font-semibold cursor-pointer"
              >
                Browse Landmarks
              </button>
              <button
                type="button"
                onClick={() => setContactOpen(true)}
                className="px-4 py-2 rounded-lg border border-white/15 text-slate-100 text-xs font-medium cursor-pointer"
              >
                Recruiter Contact
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Title Screen */}
      {gameState === 'title' && (
        <TitleOverlay
          onStart={handleStart}
          onOpenContact={() => setContactOpen(true)}
          discoveredCount={persisted.discoveredIds.length}
          totalLandmarks={LANDMARKS.length}
        />
      )}

      {/* Playing HUD & Collapsible Bottom Dock */}
      {gameState === 'playing' && (() => {
        const showLumbiniPresets =
          hud.zoneName === 'Lumbini Sacred Garden' ||
          selectedLandmark?.id === 'lumbini-buddha' ||
          (hud.coords.x <= -152 && hud.coords.z >= 15 && hud.coords.z <= 185);
        return (
          <>
            <WorldHud
              zoneName={hud.zoneName}
              discoveredCount={persisted.discoveredIds.length}
              totalLandmarks={LANDMARKS.length}
              unlockedAchievementsCount={unlockedAchievementsCount}
              totalAchievementsCount={ACHIEVEMENTS.length}
              distanceWalked={hud.distanceWalked}
              timeState={hud.timeState}
              weatherInfo={weatherInfo}
              activeWeather={activeWeather}
              isOffline={isOffline}
              soundEnabled={soundEnabled}
              nearestLandmark={hud.nearestLandmark}
              placementMode={placementMode}
              dockCollapsed={dockCollapsed}
              showLumbiniPresets={showLumbiniPresets}
              hasOpenLandmark={Boolean(selectedLandmark)}
              onToggleSound={() => setSoundEnabled(soundEngine.toggle())}
              onOpenAchievements={() => setAchievementsOpen(true)}
              onOpenAtlas={() => setAtlasOpen(true)}
              onOpenContact={() => setContactOpen(true)}
              onPause={() => setGameState('paused')}
              onInspectNearest={openLandmark}
              contextualAction={hud.contextualAction}
              isMeditating={hud.isMeditating}
              onTriggerAction={() => engineRef.current?.triggerContextualAction()}
              activeHighlight={activeHighlight}
              onCloseHighlight={() => setActiveHighlight(null)}
              onJoystickMove={(x, y) => engineRef.current?.setJoystickInput(x, y)}
              onJump={() => engineRef.current?.triggerJump()}
            />

            <ControlDock
              collapsed={dockCollapsed}
              onToggleCollapsed={() => setDockCollapsed((p) => !p)}
              timePreset={timePreset}
              onChangeTimePreset={setTimePreset}
              weatherMode={weatherMode}
              onChangeWeatherMode={setWeatherMode}
              lumbiniPreset={lumbiniPreset}
              onChangeLumbiniPreset={setLumbiniPreset}
              showLumbiniPresets={showLumbiniPresets}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled(soundEngine.toggle())}
              placementMode={placementMode}
              onTogglePlacementMode={() => setPlacementMode((p) => !p)}
              onShareTrail={handleShareTrail}
              waypointCount={persisted.customWaypoints.length}
              shareFeedback={shareFeedback}
              cameraMode={cameraMode}
              onToggleCameraMode={() =>
                setCameraMode((prev) => (prev === 'third-person' ? 'first-person' : 'third-person'))
              }
              graphicsQuality={graphicsQuality}
              onChangeGraphicsQuality={setGraphicsQuality}
            />
          </>
        );
      })()}

      {/* Landmark Story & Project Drawer */}
      <LandmarkDrawer
        landmark={selectedLandmark}
        progress={achievementProgress}
        visitHistory={persisted.visitHistory}
        onClose={handleCloseLandmark}
        onNavigateTo={handleTeleportLandmark}
        onSelectLandmark={openLandmark}
        onOpenContact={() => setContactOpen(true)}
      />

      {/* Achievements & Milestones Modal */}
      <Achievements
        progress={achievementProgress}
        open={achievementsOpen}
        onClose={() => setAchievementsOpen(false)}
      />

      {/* World Atlas Fast Travel Modal */}
      <LandmarksIndexModal
        open={atlasOpen}
        discoveredIds={persisted.discoveredIds}
        customWaypoints={persisted.customWaypoints}
        onClose={() => setAtlasOpen(false)}
        onTeleportLandmark={handleTeleportLandmark}
        onTeleportWaypoint={(wp) => {
          engineRef.current?.teleportTo(wp.x, wp.z);
          setAtlasOpen(false);
        }}
        onDeleteWaypoint={(id) =>
          setPersisted((prev) => ({
            ...prev,
            customWaypoints: prev.customWaypoints.filter((w) => w.id !== id),
          }))
        }
      />

      {/* Custom Trail Marker Prompt */}
      <WaypointPromptModal
        coords={pendingWaypointCoords}
        onCancel={() => setPendingWaypointCoords(null)}
        onSave={handleSaveWaypoint}
      />

      {/* Recruiter Contact Modal */}
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />

      {/* Pause Modal */}
      <PauseModal
        open={gameState === 'paused'}
        discoveredCount={persisted.discoveredIds.length}
        distanceWalked={hud.distanceWalked}
        onResume={() => setGameState('playing')}
        onResetPosition={() => {
          engineRef.current?.resetToSpawn();
          setGameState('playing');
        }}
        onBackToTitle={() => {
          handleCloseLandmark();
          setGameState('title');
        }}
      />
    </main>
  );
}

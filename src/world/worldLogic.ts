import { LANDMARKS } from '../data/portfolioData';

export type WeatherKind = 'clear' | 'mist' | 'foggy' | 'rain' | 'snow';
export type TimePreset = 'live' | 'dawn' | 'noon' | 'dusk' | 'night';
export type LumbiniAmbiencePreset =
  | 'sanctuary-auto'
  | 'lotus-dawn'
  | 'bodhi-zen'
  | 'butter-lamp-dusk'
  | 'moonlight-vigil';

export interface LumbiniPresetMeta {
  id: LumbiniAmbiencePreset;
  label: string;
  shortLabel: string;
  description: string;
}

export const LUMBINI_PRESET_OPTIONS: LumbiniPresetMeta[] = [
  {
    id: 'sanctuary-auto',
    label: 'Sanctuary Auto',
    shortLabel: 'Auto',
    description: 'Blends natural valley sky with soft sanctuary lantern warmth and gentle wind chimes',
  },
  {
    id: 'lotus-dawn',
    label: 'Lotus Dawn',
    shortLabel: 'Lotus Dawn',
    description: 'Rose-gold early morning mist over Pushkarini Pond with crisp morning temple chimes',
  },
  {
    id: 'bodhi-zen',
    label: 'Bodhi Zen',
    shortLabel: 'Bodhi Zen',
    description: 'Tranquil luminous sanctuary daylight with balanced prayer-flag breeze and singing bowls',
  },
  {
    id: 'butter-lamp-dusk',
    label: 'Butter-Lamp Dusk',
    shortLabel: 'Lamp Dusk',
    description: 'Saffron twilight glow illuminating Maya Devi, Peace Flame, and Peace Canal lanterns',
  },
  {
    id: 'moonlight-vigil',
    label: 'Moonlight Vigil',
    shortLabel: 'Peace Vigil',
    description: 'Deep starlit meditation vigil with warm butter-lamp pools and resonant temple bowls',
  },
];

export interface CustomWaypoint {
  id: string;
  label: string;
  x: number;
  z: number;
  color: string;
  createdAt: number;
}

export interface ExplorerProgress {
  discoveredIds: string[];
  distanceWalked: number;
  customWaypoints: CustomWaypoint[];
}

export interface TimeLightingState {
  hour: number;
  phaseLabel: 'Night' | 'Dawn' | 'Morning' | 'Afternoon' | 'Golden Hour' | 'Dusk';
  sunElevation: number;
  sunAzimuth: number;
  sunColor: string;
  sunIntensity: number;
  hemiSkyColor: string;
  hemiGroundColor: string;
  hemiIntensity: number;
  skyTopColor: string;
  skyHorizonColor: string;
  fogColor: string;
  fogDensity: number;
  lanternIntensity: number;
  starOpacity: number;
  cameraFar: number;
  bloomStrength: number;
  bloomRadius: number;
  bloomThreshold: number;
  emissiveScale: number;
  envIntensity: number;
}

export interface AtmosphereParticleProfile {
  weather: WeatherKind;
  activeRatio: number;
  opacity: number;
  particleSize: number;
  fallSpeed: number;
  windDriftX: number;
  windDriftZ: number;
  turbulence: number;
  streakStretch: number;
  colorHex: string;
  glowStrength: number;
}

export interface ContactPayload {
  name: string;
  email: string;
  organization: string;
  roleType: string;
  message: string;
}

export interface ContactValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof ContactPayload, string>>;
}

export const WORLD_RADIUS = 410;
export const SPAWN_POSITION = { x: 0, z: 6 };

export const BRIDGE_BOUNDS = {
  minX: 22.5,
  maxX: 37.5,
  centerZ: -24,
  halfWidth: 3.2,
  deckY: 1.05,
};

export const GLACIAL_LAKE = {
  x: -132,
  z: -120,
  basinRadius: 32,
  waterRadius: 26,
  waterLevel: -0.25,
};

export const LUMBINI_PEACE_CANAL = {
  centerX: -272,
  minX: -278,
  maxX: -266,
  minZ: 34,
  maxZ: 162,
  waterLevel: -0.26,
  bridgeMinX: -280.2,
  bridgeMaxX: -263.8,
  bridgeCenterZ: 100.0,
  bridgeHalfWidth: 2.6,
  stupaCenterX: -304,
  stupaCenterZ: 100,
  stupaPlazaRadius: 9.6,
};

export const ROAD_PATHS: Array<Array<[number, number]>> = [
  [[0, 6], [-24, -10], [-48, -24]],
  [[-48, -24], [-78, -10], [-108, 4]],
  [[-108, 4], [-109, -35], [-108, -74]],
  [[-48, -24], [-51, -58], [-54, -92]],
  [[-48, -24], [-18, -68], [10, -108]],
  [[10, -108], [52, -104], [94, -96]],
  [[0, 6], [11, -10], [22.5, -24]],
  [[37.5, -24], [58, -26], [78, -28]],
  [[78, -28], [87, -62], [94, -96]],
  // Smooth continuous boulevard from Spawn arriving perpendicularly at Janaki Chowk East Gate (-53.9, 128.5)
  [[0, 6], [-16, 28], [-30, 58], [-38, 94], [-42, 122], [-46.5, 128.5], [-50.5, 128.5], [-53.9, 128.5]],
  // Janaki Chowk South Gate (-92, 149.5) -> Lumbini South Torana Gate (-210, 148.0)
  [[-92, 149.5], [-92, 155.5], [-92, 161.5], [-120, 163.5], [-155, 163.5], [-190, 162.5], [-210, 159.0], [-210, 154.0], [-210, 148.0]],
  // Park Corridor spur from South Boulevard -> Lumbini East Cross Gate (-166.0, 100.0)
  [[-156.5, 163.5], [-157.5, 134.0], [-157.5, 106.0], [-161.5, 100.0], [-166.0, 100.0]],
  // Boudhanath Stupa (-108, 4) -> Lumbini North Torana Gate (-210, 52.0)
  [[-108, 4], [-136, 14], [-172, 26], [-204, 38], [-210, 45.0], [-210, 52.0]],
  // Expanded Lumbini Western Sacred Parkland & Peace Canal South Promenade
  [[-210, 159.0], [-240, 166.0], [-272, 167.0], [-298, 158.0], [-304, 132.0], [-304, 109.6]],
  // Expanded Lumbini Western Sacred Parkland & Peace Canal North Promenade
  [[-210, 43.0], [-240, 31.0], [-272, 29.0], [-298, 40.0], [-304, 68.0], [-304, 90.4]],
];

export const ROAD_LANTERN_COORDS: Array<[number, number]> = [
  [-8, 0],
  [-28, -14],
  [-64, -15],
  [-95, -5],
  [-112, -38],
  [-56, -60],
  [-18, -68],
  [52, -100],
  [16, -21],
  [56, -24],
  [88, -62],
  [-18, 28],
  [-46, 86],
  [-48.5, 132.2],
  [-48.5, 124.8],
  [-88.2, 154.5],
  [-95.8, 154.5],
  [-206.2, 151.0],
  [-213.8, 151.0],
  [-206.2, 48.0],
  [-213.8, 48.0],
  [-162.5, 96.4],
  [-162.5, 103.6],
  [-155.0, 160.0],
  [-182.0, 160.0],
  [-172.0, 30.0],
  // Expanded Lumbini Peace Canal & Western Peace Stupa lanterns
  [-260.2, 96.4],
  [-260.2, 103.6],
  [-283.6, 96.4],
  [-283.6, 103.6],
  [-285.5, 163.0],
  [-299.5, 132.0],
  [-299.5, 68.0],
  [-272.0, 26.2],
];

export const PRAYER_FLAG_POLES: Array<[number, number]> = [
  [-55, -20],
  [-42, -29],
  [-6.2, 0.5],
  [4.2, -4.5],
  [-114, 1],
  [-101, 9],
];

export type TreeSpecies =
  | 'sakura'
  | 'deodar'
  | 'rhodo'
  | 'maple'
  | 'peepal'
  | 'jacaranda'
  | 'willow'
  | 'birch'
  | 'gulmohar'
  | 'cypress'
  | 'palm';

export interface TreeSpot {
  x: number;
  z: number;
  scale: number;
  type: TreeSpecies;
}

export interface BoulderSpot {
  x: number;
  z: number;
  idx: number;
}

export interface OuterTempleArtifactSpot {
  x: number;
  z: number;
  kind: 'offering-bowl' | 'incense-stand' | 'prayer-flags';
  rotY: number;
  scale: number;
}

// Detailed ritual artifacts (carved marble & bronze Urli offering bowls, Dhupauro censers, stone-anchored prayer flags)
export const OUTER_TEMPLE_ARTIFACT_SPOTS: OuterTempleArtifactSpot[] = [
  // Janaki Mandir outer compound flanking approaches & sacred garden borders
  { x: -127.8, z: 131.0, kind: 'incense-stand', rotY: 0.6, scale: 1.05 },
  { x: -141.5, z: 74.5, kind: 'prayer-flags', rotY: 0.45, scale: 1.05 },
  { x: -142.5, z: 90.5, kind: 'offering-bowl', rotY: 0.0, scale: 1.05 },
  { x: -141.5, z: 151.5, kind: 'prayer-flags', rotY: -0.4, scale: 1.05 },
  { x: -133.5, z: 147.0, kind: 'offering-bowl', rotY: 0.3, scale: 1.0 },
  { x: -63.0, z: 71.5, kind: 'incense-stand', rotY: 0.15, scale: 1.0 },
  { x: -58.5, z: 118.0, kind: 'offering-bowl', rotY: -0.5, scale: 1.05 },
  { x: -59.5, z: 144.5, kind: 'prayer-flags', rotY: 0.35, scale: 1.0 },
  { x: -68.5, z: 152.5, kind: 'offering-bowl', rotY: -0.2, scale: 1.05 },
  { x: -116.5, z: 152.5, kind: 'incense-stand', rotY: 0.25, scale: 1.0 },
  // Pashupatinath outer temple grounds (-48, -24)
  { x: -58.5, z: -31.5, kind: 'incense-stand', rotY: 0.3, scale: 1.05 },
  { x: -37.5, z: -16.5, kind: 'offering-bowl', rotY: 0.0, scale: 1.05 },
  { x: -57.5, z: -14.5, kind: 'prayer-flags', rotY: 0.5, scale: 1.0 },
  { x: -38.5, z: -33.0, kind: 'incense-stand', rotY: -0.4, scale: 1.0 },
  // Boudhanath Stupa outer kora grounds (-108, 4)
  { x: -119.5, z: -5.5, kind: 'offering-bowl', rotY: 0.4, scale: 1.05 },
  { x: -96.5, z: -5.5, kind: 'prayer-flags', rotY: -0.3, scale: 1.05 },
  { x: -118.5, z: 14.5, kind: 'offering-bowl', rotY: 0.2, scale: 1.05 },
  { x: -97.5, z: 13.5, kind: 'incense-stand', rotY: -0.2, scale: 1.0 },
  // Lumbini Peace Garden outer grounds (-210, 96) & Expanded Peace Canal Parkland
  { x: -258.0, z: 76.0, kind: 'offering-bowl', rotY: 0.25, scale: 1.05 },
  { x: -161.2, z: 76.0, kind: 'offering-bowl', rotY: 0.0, scale: 1.05 },
  { x: -258.0, z: 126.0, kind: 'prayer-flags', rotY: 0.6, scale: 1.05 },
  { x: -198.0, z: 48.0, kind: 'incense-stand', rotY: -0.5, scale: 1.0 },
  { x: -285.5, z: 76.0, kind: 'prayer-flags', rotY: 0.15, scale: 1.1 },
  { x: -285.5, z: 124.0, kind: 'prayer-flags', rotY: -0.15, scale: 1.1 },
  { x: -295.0, z: 112.0, kind: 'offering-bowl', rotY: 0.4, scale: 1.05 },
  { x: -295.0, z: 88.0, kind: 'incense-stand', rotY: -0.4, scale: 1.05 },
];

function catmullRomValue(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

let cachedRoadSamples: Array<{ x: number; z: number }> | null = null;
let cachedRoadDeckSamples: Array<{ x: number; z: number; deckY: number }> | null = null;

function getCoarseRoadSamples(): Array<{ x: number; z: number }> {
  if (cachedRoadSamples) return cachedRoadSamples;
  const samples: Array<{ x: number; z: number }> = [];
  for (const chain of ROAD_PATHS) {
    const n = chain.length;
    if (n < 2) continue;
    for (let i = 0; i < n - 1; i++) {
      const p0 = chain[Math.max(0, i - 1)];
      const p1 = chain[i];
      const p2 = chain[i + 1];
      const p3 = chain[Math.min(n - 1, i + 2)];
      const segLen = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      const steps = Math.max(8, Math.ceil(segLen * 1.8));
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        samples.push({
          x: catmullRomValue(p0[0], p1[0], p2[0], p3[0], t),
          z: catmullRomValue(p0[1], p1[1], p2[1], p3[1], t),
        });
      }
    }
  }
  cachedRoadSamples = samples;
  return samples;
}

function minDistToRoadSamples(x: number, z: number, samples: Array<{ x: number; z: number }>): number {
  let minD = Infinity;
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    const d = Math.hypot(x - s.x, z - s.z);
    if (d < minD) minD = d;
  }
  return minD;
}

let cachedTreeSpots: TreeSpot[] | null = null;
let cachedBoulderSpots: BoulderSpot[] | null = null;

export function getWorldTreeSpots(): TreeSpot[] {
  if (cachedTreeSpots) return cachedTreeSpots;
  const roadSamples = getCoarseRoadSamples();
  const goldenAngle = 2.39996323;
  const treeSpots: TreeSpot[] = [];

  for (let i = 0; i < 4200 && treeSpots.length < 660; i++) {
    const angle = i * goldenAngle;
    const t = (i + 0.5) / 4200;
    const radius = 14.5 + Math.sqrt(t) * 340;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    const nearLandmark = LANDMARKS.some((lm) => {
      const dx = x - lm.position.x;
      const dz = z - lm.position.z;
      if (lm.id === 'janaki-mandir') {
        return dx > -64 && dx < 46 && dz > -42 && dz < 78;
      }
      if (lm.id === 'lumbini-buddha') {
        return dx > -51 && dx < 51 && dz > -50 && dz < 58;
      }
      const inPlazaRadius = Math.hypot(dx, dz - 2.0) < 15.0;
      const inCameraCorridor = dz >= 0 && dz < 24 && Math.abs(dx) < 10.5;
      return inPlazaRadius || inCameraCorridor;
    });
    const nearSpawn = Math.hypot(x - SPAWN_POSITION.x, z - SPAWN_POSITION.z) < 12.5;
    const riverCenterX = getRiverCenterX(z);
    const nearRiver = Math.abs(x - riverCenterX) < 10.2;
    const nearLake = Math.hypot(x - GLACIAL_LAKE.x, z - GLACIAL_LAKE.z) < GLACIAL_LAKE.basinRadius + 4.2;
    const nearPeaceCanal =
      x >= LUMBINI_PEACE_CANAL.minX - 6.5 &&
      x <= LUMBINI_PEACE_CANAL.maxX + 6.5 &&
      z >= LUMBINI_PEACE_CANAL.minZ - 5.0 &&
      z <= LUMBINI_PEACE_CANAL.maxZ + 5.0;
    const nearWestPeaceStupa =
      Math.hypot(x - LUMBINI_PEACE_CANAL.stupaCenterX, z - LUMBINI_PEACE_CANAL.stupaCenterZ) <
        LUMBINI_PEACE_CANAL.stupaPlazaRadius + 4.5 ||
      (x >= -296 && x <= -252 && Math.abs(z - LUMBINI_PEACE_CANAL.bridgeCenterZ) < 6.2);
    const nearRoad = minDistToRoadSamples(x, z, roadSamples) < 4.6;
    const nearArtifact = OUTER_TEMPLE_ARTIFACT_SPOTS.some((a) => Math.hypot(x - a.x, z - a.z) < 3.0);

    if (
      nearLandmark ||
      nearSpawn ||
      nearRiver ||
      nearLake ||
      nearPeaceCanal ||
      nearWestPeaceStupa ||
      nearRoad ||
      nearArtifact
    ) {
      continue;
    }

    const nearWater =
      Math.abs(x - riverCenterX) < 22 ||
      Math.hypot(x - GLACIAL_LAKE.x, z - GLACIAL_LAKE.z) < GLACIAL_LAKE.basinRadius + 18 ||
      (x >= LUMBINI_PEACE_CANAL.minX - 18 &&
        x <= LUMBINI_PEACE_CANAL.maxX + 18 &&
        z >= LUMBINI_PEACE_CANAL.minZ - 14 &&
        z <= LUMBINI_PEACE_CANAL.maxZ + 14);
    const nearPeaceGarden = Math.hypot(x + 240, z - 96) < 105;
    const isEastBank = x > riverCenterX + 10;
    const isHighNorth = z < -48;

    let type: TreeSpecies;
    if (nearPeaceGarden) {
      const pool: TreeSpecies[] = ['sakura', 'peepal', 'sakura', 'jacaranda', 'willow', 'maple'];
      type = pool[i % pool.length];
    } else if (nearWater) {
      const pool: TreeSpecies[] = ['willow', 'sakura', 'birch', 'willow', 'maple'];
      type = pool[i % pool.length];
    } else if (isEastBank) {
      const pool: TreeSpecies[] = ['palm', 'gulmohar', 'jacaranda', 'peepal', 'cypress', 'sakura'];
      type = pool[i % pool.length];
    } else if (isHighNorth) {
      const pool: TreeSpecies[] = ['deodar', 'rhodo', 'birch', 'cypress', 'maple', 'deodar'];
      type = pool[i % pool.length];
    } else {
      const pool: TreeSpecies[] = [
        'sakura',
        'maple',
        'deodar',
        'jacaranda',
        'birch',
        'rhodo',
        'peepal',
        'cypress',
        'gulmohar',
        'willow',
      ];
      type = pool[i % pool.length];
    }

    treeSpots.push({
      x,
      z,
      scale: 1.05 + ((i * 17) % 52) / 100,
      type,
    });
  }
  cachedTreeSpots = treeSpots;
  return treeSpots;
}

export function getWorldBoulderSpots(): BoulderSpot[] {
  if (cachedBoulderSpots) return cachedBoulderSpots;
  const roadSamples = getCoarseRoadSamples();
  const goldenAngle = 2.39996323;
  const rockSpots: BoulderSpot[] = [];
  for (let i = 0; i < 520 && rockSpots.length < 116; i++) {
    const a = i * goldenAngle + 0.4;
    const r = 18 + Math.sqrt((i + 1) / 520) * 330;
    const rx = Math.cos(a) * r;
    const rz = Math.sin(a) * r;
    const nearLandmark = LANDMARKS.some((lm) =>
      lm.id === 'janaki-mandir'
        ? rx - lm.position.x > -64 && rx - lm.position.x < 46 && rz - lm.position.z > -42 && rz - lm.position.z < 75
        : lm.id === 'lumbini-buddha'
          ? rx - lm.position.x > -51 && rx - lm.position.x < 51 && rz - lm.position.z > -50 && rz - lm.position.z < 58
          : Math.hypot(rx - lm.position.x, rz - lm.position.z) < 14,
    );
    const nearSpawn = Math.hypot(rx - SPAWN_POSITION.x, rz - SPAWN_POSITION.z) < 12;
    const riverCenterX = getRiverCenterX(rz);
    const nearRiver = Math.abs(rx - riverCenterX) < 8.5;
    const nearLake = Math.hypot(rx - GLACIAL_LAKE.x, rz - GLACIAL_LAKE.z) < GLACIAL_LAKE.basinRadius + 2.5;
    const nearPeaceParkland = rx > -324 && rx < -252 && rz > 24 && rz < 172;
    const nearRoad = minDistToRoadSamples(rx, rz, roadSamples) < 4.5;
    if (nearLandmark || nearSpawn || nearRiver || nearLake || nearPeaceParkland || nearRoad) continue;
    rockSpots.push({ x: rx, z: rz, idx: i });
  }
  cachedBoulderSpots = rockSpots;
  return rockSpots;
}

export function getRiverCenterX(z: number): number {
  return 34 + Math.sin(z * 0.028) * 6.5;
}

export function getLandmarkApproachPoint(lm: (typeof LANDMARKS)[number]): { x: number; z: number } {
  return {
    x: lm.position.x + (lm.approachOffset?.x ?? 0),
    z: lm.position.z + (lm.approachOffset?.z ?? 4.8),
  };
}

export function isOnBridgeDeck(x: number, z: number): boolean {
  return (
    x >= BRIDGE_BOUNDS.minX &&
    x <= BRIDGE_BOUNDS.maxX &&
    Math.abs(z - BRIDGE_BOUNDS.centerZ) <= BRIDGE_BOUNDS.halfWidth
  );
}

export function isOnLumbiniCanalBridge(x: number, z: number): boolean {
  return (
    x >= LUMBINI_PEACE_CANAL.bridgeMinX &&
    x <= LUMBINI_PEACE_CANAL.bridgeMaxX &&
    Math.abs(z - LUMBINI_PEACE_CANAL.bridgeCenterZ) <= LUMBINI_PEACE_CANAL.bridgeHalfWidth
  );
}

/**
 * Computes terrain elevation at (x, z).
 * Ensures flat plazas around spawn and all 10 landmarks, a monumental plinth & stair ramp at Janaki Mandir,
 * wide flat UNESCO Lumbini Terai parkland with Peace Canal & Western Peace Stupa left of Janaki Mandir,
 * sweeping open-world Himalayan valley hills, and a clear river channel separating Nepal from Vellore.
 */
export function groundHeightAt(x: number, z: number): number {
  if (isOnBridgeDeck(x, z)) {
    const t = (x - BRIDGE_BOUNDS.minX) / (BRIDGE_BOUNDS.maxX - BRIDGE_BOUNDS.minX);
    const arch = Math.sin(t * Math.PI) * 0.65;
    return BRIDGE_BOUNDS.deckY + arch;
  }

  if (isOnLumbiniCanalBridge(x, z)) {
    const t =
      (x - LUMBINI_PEACE_CANAL.bridgeMinX) /
      (LUMBINI_PEACE_CANAL.bridgeMaxX - LUMBINI_PEACE_CANAL.bridgeMinX);
    const arch = Math.sin(t * Math.PI) * 0.62;
    return 0.36 + arch;
  }

  // Sweeping open-world Himalayan valley undulation
  let h =
    Math.sin(x * 0.032) * Math.cos(z * 0.028) * 1.35 +
    Math.sin(x * 0.08 + z * 0.05) * 0.38;

  // Foothill rim around outer valley basin pushed generously outward to preserve open western Lumbini plains
  const radial = Math.hypot(x, z);
  if (radial > 345 && z > -135) {
    const outerT = Math.min(1, (radial - 345) / 110);
    const northFade = smoothstep(-135, -60, z);
    h += outerT * outerT * 6.5 * northFade;
  }
  if (z < -150) {
    const underMountain = smoothstep(-150, -210, z);
    h = lerp(h, -3.2, underMountain);
  }

  // Flatten spawn plaza and landmark terraces smoothly
  const flatAnchors: Array<{ x: number; z: number; radius: number; targetY: number }> = [
    { x: SPAWN_POSITION.x, z: SPAWN_POSITION.z, radius: 16, targetY: 0.15 },
    ...LANDMARKS.map((lm) => ({
      x: lm.position.x,
      z: lm.position.z,
      radius: lm.id === 'janaki-mandir' ? 58 : lm.id === 'lumbini-buddha' ? 68 : 18,
      targetY:
        lm.id === 'pumdikot-shiva'
          ? 1.45
          : lm.id === 'recruiter-beacon'
            ? 0.75
            : lm.id === 'janaki-mandir' || lm.id === 'lumbini-buddha'
              ? 0.25
              : 0.2,
    })),
  ];

  for (const anchor of flatAnchors) {
    const d = Math.hypot(x - anchor.x, z - anchor.z);
    if (d < anchor.radius) {
      const blend = 1 - smoothstep(anchor.radius * 0.52, anchor.radius, d);
      h = lerp(h, anchor.targetY, blend);
    }
  }

  // Level Lumbini 88m x 96m Sacred Garden AND expanded Western Peace Canal Parkland (-326.. -165, z: 26..170)
  const lumbini = LANDMARKS.find((l) => l.id === 'lumbini-buddha');
  if (lumbini) {
    const ldx = x - lumbini.position.x;
    const ldz = z - lumbini.position.z;
    const parkOutX = ldx < -114.0 ? -114.0 - ldx : ldx > 45.0 ? ldx - 45.0 : 0;
    const parkOutZ = ldz < -70.0 ? -70.0 - ldz : ldz > 74.0 ? ldz - 74.0 : 0;
    const parkDist = Math.hypot(parkOutX, parkOutZ);
    if (parkDist < 28) {
      const pBlend = 1 - smoothstep(0, 28, parkDist);
      h = lerp(h, 0.25, pBlend);
    }

    // Carve Lumbini Central Reflection Peace Canal running North-South west of Maya Devi Gate
    if (
      x >= LUMBINI_PEACE_CANAL.minX - 2.2 &&
      x <= LUMBINI_PEACE_CANAL.maxX + 2.2 &&
      z >= LUMBINI_PEACE_CANAL.minZ - 2.2 &&
      z <= LUMBINI_PEACE_CANAL.maxZ + 2.2
    ) {
      const cx = Math.max(0, Math.abs(x - LUMBINI_PEACE_CANAL.centerX) - 5.2);
      const cz = Math.max(0, Math.abs(z - 98.0) - 63.2);
      const canalEdge = Math.hypot(cx, cz);
      const canalCarve = 1 - smoothstep(0, 1.8, canalEdge);
      h = lerp(h, -1.15, canalCarve);
    }

    // Carve stepped Pushkarini Sacred Pond basin centered at local (+10.0, +16.5)
    if (ldx >= -3.2 && ldx <= 23.2 && ldz >= 7.5 && ldz <= 25.5) {
      const px = Math.max(0, Math.abs(ldx - 10.0) - 11.2);
      const pz = Math.max(0, Math.abs(ldz - 16.5) - 6.9);
      const pondDist = Math.hypot(px, pz);
      const pondCarve = 1 - smoothstep(0, 1.4, pondDist);
      h = lerp(h, -0.82, pondCarve);
    }

    // Maya Devi Temple (center 0, -22.0, 36m x 24m): sloped South ramp, walkable interior boardwalk (1.25m), sunken pit (-0.10m)
    const inPit = Math.abs(ldx) <= 9.0 && ldz >= -27.6 && ldz <= -16.4;
    if (inPit) {
      h = -0.10;
    } else if (Math.abs(ldx) <= 17.2 && ldz >= -33.2 && ldz <= -10.8) {
      h = 1.25;
    } else if (Math.abs(ldx) <= 1.95 && ldz > -10.8 && ldz <= -2.0) {
      const rampT = Math.min(1, Math.max(0, 1 - (ldz + 10.0) / 8.0));
      h = lerp(0.35, 1.25, rampT);
    }
  }

  // Level entire Janaki Mandir Chowk brick plaza, East/South gate roadbeds & West Ganga Sagar / Vivah Mandap grounds at y = 0.25m
  const janaki = LANDMARKS.find((l) => l.id === 'janaki-mandir');
  if (janaki) {
    const jdx = x - janaki.position.x;
    const jdz = z - janaki.position.z;
    const outX = Math.max(0, Math.max(-60 - jdx, jdx - 43));
    const outZ = jdz < -38 ? -38 - jdz : jdz > 64 ? jdz - 64 : 0;
    const outDist = Math.hypot(outX, outZ);
    if (outDist < 16) {
      const chowkBlend = 1 - smoothstep(0, 16, outDist);
      h = lerp(h, 0.25, chowkBlend);
    }

    // Carve stepped Ganga Sagar sacred kund pond basin on West Janaki grounds (-44.5, 16.0)
    if (jdx >= -52.2 && jdx <= -36.8 && jdz >= 6.6 && jdz <= 25.4) {
      const bx = Math.max(0, Math.abs(jdx + 44.5) - 6.0);
      const bz = Math.max(0, Math.abs(jdz - 16.0) - 7.8);
      const pondEdgeDist = Math.hypot(bx, bz);
      const pondCarve = 1 - smoothstep(0, 1.4, pondEdgeDist);
      h = lerp(h, -0.35, pondCarve);
    }

    // Janaki Mandir monumental marble plinth & ceremonial front stair ramp (real 49m palace scale)
    if (Math.abs(jdx) <= 25.0 && jdz >= -22.0 && jdz <= 18.6) {
      h = 1.05;
    } else if (Math.abs(jdx) <= 5.4 && jdz > 18.6 && jdz <= 22.0) {
      const stairT = 1 - (jdz - 18.6) / (22.0 - 18.6);
      h = lerp(0.25, 1.05, stairT);
    }
  }

  // Carve Fewa / Tilicho turquoise glacial alpine lake basin in the NW foothills
  const distToLake = Math.hypot(x - GLACIAL_LAKE.x, z - GLACIAL_LAKE.z);
  if (distToLake < GLACIAL_LAKE.basinRadius) {
    const lakeBlend = 1 - smoothstep(GLACIAL_LAKE.waterRadius * 0.68, GLACIAL_LAKE.basinRadius, distToLake);
    h = lerp(h, -1.85, lakeBlend);
  }

  // Carve serene mountain river channel winding through the valley
  const riverCenterX = getRiverCenterX(z);
  const distToRiver = Math.abs(x - riverCenterX);
  if (distToRiver < 8.4) {
    const bankBlend = 1 - smoothstep(3.2, 8.4, distToRiver);
    h = lerp(h, -1.85, bankBlend);
  }

  return h;
}

function getRoadDeckSamples(): Array<{ x: number; z: number; deckY: number }> {
  if (cachedRoadDeckSamples) return cachedRoadDeckSamples;
  const out: Array<{ x: number; z: number; deckY: number }> = [];
  for (const chain of ROAD_PATHS) {
    const n = chain.length;
    if (n < 2) continue;
    for (let i = 0; i < n - 1; i++) {
      const p0 = chain[Math.max(0, i - 1)];
      const p1 = chain[i];
      const p2 = chain[i + 1];
      const p3 = chain[Math.min(n - 1, i + 2)];
      const segLen = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      const steps = Math.max(8, Math.ceil(segLen * 1.4));
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const px = catmullRomValue(p0[0], p1[0], p2[0], p3[0], t);
        const pz = catmullRomValue(p0[1], p1[1], p2[1], p3[1], t);
        const tNext = Math.min(1, t + 0.02);
        const nx = catmullRomValue(p0[0], p1[0], p2[0], p3[0], tNext);
        const nz = catmullRomValue(p0[1], p1[1], p2[1], p3[1], tNext);
        let tx = nx - px;
        let tz = nz - pz;
        const tLen = Math.hypot(tx, tz);
        if (tLen < 1e-4) {
          const tPrev = Math.max(0, t - 0.02);
          tx = px - catmullRomValue(p0[0], p1[0], p2[0], p3[0], tPrev);
          tz = pz - catmullRomValue(p0[1], p1[1], p2[1], p3[1], tPrev);
        }
        const len = Math.hypot(tx, tz) || 1;
        const dirX = -tz / len;
        const dirZ = tx / len;
        const halfW = 2.0;
        const deckY =
          Math.max(
            groundHeightAt(px, pz),
            groundHeightAt(px - dirX * halfW, pz - dirZ * halfW),
            groundHeightAt(px + dirX * halfW, pz + dirZ * halfW),
          ) + 0.022;
        out.push({ x: px, z: pz, deckY });
      }
    }
  }
  cachedRoadDeckSamples = out;
  return out;
}

/**
 * Returns the exact visible walkable/prop surface height at (x, z), accounting for raised stone
 * plaza aprons and level crowned cobblestone road decks so props and artifacts never sink into roads.
 */
export function getSurfaceHeightAt(x: number, z: number): number {
  const base = groundHeightAt(x, z);
  if (isOnBridgeDeck(x, z) || isOnLumbiniCanalBridge(x, z)) {
    return base + 0.02;
  }

  let surfaceY = base;

  // Raised circular stone plaza aprons at Spawn & non-Janaki landmarks (cylinder top = centerY + 0.10)
  if (Math.hypot(x - SPAWN_POSITION.x, z - SPAWN_POSITION.z) <= 7.45) {
    surfaceY = Math.max(surfaceY, groundHeightAt(SPAWN_POSITION.x, SPAWN_POSITION.z) + 0.105);
  }
  for (const lm of LANDMARKS) {
    if (lm.id === 'janaki-mandir' || lm.id === 'lumbini-buddha') continue;
    const r = lm.id === 'boudhanath-stupa' ? 8.25 : lm.id === 'pumdikot-shiva' ? 7.65 : 7.05;
    if (Math.hypot(x - lm.position.x, z - lm.position.z) <= r) {
      surfaceY = Math.max(surfaceY, groundHeightAt(lm.position.x, lm.position.z) + 0.105);
    }
  }

  // Lumbini 88m x 96m Sacred Garden lawns, red-brick paths, Maya Devi South ramp & interior boardwalk
  const lumbini = LANDMARKS.find((l) => l.id === 'lumbini-buddha');
  if (lumbini) {
    const ldx = x - lumbini.position.x;
    const ldz = z - lumbini.position.z;
    const inPit = Math.abs(ldx) <= 9.0 && ldz >= -27.6 && ldz <= -16.4;
    const inPushkariniBasin = ldx >= -3.2 && ldx <= 23.2 && ldz >= 7.5 && ldz <= 25.5;
    if (!inPit && !inPushkariniBasin && ldx >= -44.2 && ldx <= 44.2 && ldz >= -44.2 && ldz <= 52.2) {
      if (Math.abs(ldx) <= 17.2 && ldz >= -33.2 && ldz <= -10.8) {
        surfaceY = Math.max(surfaceY, 1.25);
      } else if (Math.abs(ldx) <= 1.95 && ldz > -10.8 && ldz <= -2.0) {
        const rampT = Math.min(1, Math.max(0, 1 - (ldz + 10.0) / 8.0));
        surfaceY = Math.max(surfaceY, lerp(0.35, 1.25, rampT));
      } else {
        const onBrickWalk =
          (Math.abs(ldx) <= 8.5 && ldz >= 28.0 && ldz <= 52.4) ||
          (ldz >= 2.0 && ldz <= 6.0) ||
          (Math.abs(ldx) <= 3.4 && ldz >= -2.5 && ldz <= 2.0) ||
          (ldx >= -22.4 && ldx <= -19.2 && ldz >= -42.5 && ldz <= 30.8) ||
          (ldx >= 24.2 && ldx <= 27.2 && ldz >= -42.5 && ldz <= 30.8) ||
          (ldx >= -19.2 && ldx <= 27.2 && ldz >= 27.2 && ldz <= 30.8) ||
          (ldx >= -22.4 && ldx <= 27.2 && ldz >= -42.5 && ldz <= -38.5) ||
          (Math.abs(ldx) <= 3.4 && ldz >= -44.4 && ldz <= -42.5) ||
          (ldx >= -27.0 && ldx <= -22.4 && ldz >= -22.8 && ldz <= -19.2) ||
          (Math.abs(ldx) <= 20.4 && ldz >= -36.8 && ldz <= -34.2);
        surfaceY = Math.max(surfaceY, onBrickWalk ? 0.35 : 0.28);
      }
    }
  }

  // Expanded Western Peace Parkland: West-Gate-to-Canal Promenade, Canal-side boardwalks & White Peace Stupa Overlook
  const onWestCanalAxisWalk =
    x >= -295.0 &&
    x <= -254.0 &&
    Math.abs(z - LUMBINI_PEACE_CANAL.bridgeCenterZ) <= 2.6;
  const onCanalEdgePromenade =
    z >= LUMBINI_PEACE_CANAL.minZ &&
    z <= LUMBINI_PEACE_CANAL.maxZ &&
    ((x >= -265.2 && x <= -261.2) || (x >= -282.8 && x <= -278.8));
  const onWestStupaPlaza =
    Math.hypot(x - LUMBINI_PEACE_CANAL.stupaCenterX, z - LUMBINI_PEACE_CANAL.stupaCenterZ) <=
    LUMBINI_PEACE_CANAL.stupaPlazaRadius;
  if (onWestStupaPlaza || onWestCanalAxisWalk) {
    surfaceY = Math.max(surfaceY, 0.35);
  } else if (onCanalEdgePromenade) {
    surfaceY = Math.max(surfaceY, 0.32);
  }

  // Raised level cobblestone road decks outside Janaki Chowk, Lumbini Precinct & Western Peace Plaza
  const inJanakiChowk = x >= -131.0 && x <= -53.5 && z >= 70.0 && z <= 150.2;
  const inLumbiniPrecinct = x >= -255.0 && x <= -165.0 && z >= 51.0 && z <= 149.0;
  if (!inJanakiChowk && !inLumbiniPrecinct && !onWestStupaPlaza) {
    const roadSamples = getRoadDeckSamples();
    let bestDist = 2.35;
    let bestDeckY = surfaceY;
    for (let i = 0; i < roadSamples.length; i++) {
      const s = roadSamples[i];
      const d = Math.hypot(x - s.x, z - s.z);
      if (d < bestDist) {
        bestDist = d;
        bestDeckY = s.deckY;
      }
    }
    if (bestDist < 2.35) {
      surfaceY = Math.max(surfaceY, bestDeckY);
    }
  }

  return surfaceY;
}

/**
 * Checks whether (x, z) is walkable without stepping into deep river/lake/canal water,
 * solid palace masonry walls, or outside the open-world boundary.
 */
export function isWalkablePosition(x: number, z: number): boolean {
  if (Math.hypot(x, z) > WORLD_RADIUS - 3.0) return false;
  if (isOnBridgeDeck(x, z)) {
    // Bridge end truss pylons flanking the deck entry at ±3.2m
    const onPylonX =
      Math.abs(x - BRIDGE_BOUNDS.minX) < 0.7 || Math.abs(x - BRIDGE_BOUNDS.maxX) < 0.7;
    if (onPylonX && Math.abs(z - BRIDGE_BOUNDS.centerZ) >= 2.8) return false;
    return true;
  }
  if (isOnLumbiniCanalBridge(x, z)) {
    // Arched Maitri Peace Bridge balustrade edge rails block side plunge while keeping ±2.25m deck open
    if (Math.abs(z - LUMBINI_PEACE_CANAL.bridgeCenterZ) >= 2.28) return false;
    return true;
  }
  if (
    x >= LUMBINI_PEACE_CANAL.minX - 0.65 &&
    x <= LUMBINI_PEACE_CANAL.maxX + 0.65 &&
    z >= LUMBINI_PEACE_CANAL.minZ - 0.65 &&
    z <= LUMBINI_PEACE_CANAL.maxZ + 0.65
  ) {
    return false;
  }
  if (
    Math.hypot(x - LUMBINI_PEACE_CANAL.stupaCenterX, z - LUMBINI_PEACE_CANAL.stupaCenterZ) <= 4.35
  ) {
    return false;
  }
  if (Math.hypot(x - GLACIAL_LAKE.x, z - GLACIAL_LAKE.z) < GLACIAL_LAKE.waterRadius - 0.6) {
    return false;
  }
  const riverCenterX = getRiverCenterX(z);
  const distToRiver = Math.abs(x - riverCenterX);
  if (distToRiver < 4.6) return false;

  // Spawn Plaza Monuments: 3D Name Sign (-1.5, -1.2) & Trail Kiosk (5.15, 3.2)
  if (Math.abs(x + 1.5) <= 2.0 && Math.abs(z + 1.2) <= 0.7) return false;
  if (Math.abs(x - 5.15) <= 1.35 && Math.abs(z - 3.2) <= 0.7) return false;

  // Prayer flag poles
  for (const [fx, fz] of PRAYER_FLAG_POLES) {
    if (Math.hypot(x - fx, z - fz) <= 0.58) return false;
  }

  // Outer temple ground ritual artifacts (offering bowls, incense stands, prayer flag poles)
  for (let i = 0; i < OUTER_TEMPLE_ARTIFACT_SPOTS.length; i++) {
    const art = OUTER_TEMPLE_ARTIFACT_SPOTS[i];
    const hitR = art.kind === 'prayer-flags' ? 0.95 : 0.92;
    if (Math.hypot(x - art.x, z - art.z) <= hitR * art.scale) return false;
  }

  // Roadside stone lanterns (padded for body radius)
  for (const [lx, lz] of ROAD_LANTERN_COORDS) {
    if (Math.hypot(x - lx, z - lz) <= 0.72) return false;
  }

  // Open-world trees & boulders (padded for full trunk/boulder silhouette)
  const trees = getWorldTreeSpots();
  for (let i = 0; i < trees.length; i++) {
    const tr = trees[i];
    if (Math.hypot(x - tr.x, z - tr.z) <= 0.78 * tr.scale) return false;
  }
  const boulders = getWorldBoulderSpots();
  for (let i = 0; i < boulders.length; i++) {
    const b = boulders[i];
    if (Math.hypot(x - b.x, z - b.z) <= 0.98) return false;
  }

  // Non-Janaki landmark masonry bases, columns, sculptures & signposts (approachOffset points stay clear)
  for (const lm of LANDMARKS) {
    if (lm.id === 'janaki-mandir' || lm.id === 'lumbini-buddha') continue;
    const dx = x - lm.position.x;
    const dz = z - lm.position.z;
    if (Math.hypot(dx, dz) > 12.0) continue;

    switch (lm.id) {
      case 'kathmandu-stupa':
        if (Math.abs(dx) <= 4.7 && Math.abs(dz) <= 4.4 && !(Math.abs(dx - 0.45) <= 1.1 && dz >= 1.8)) {
          return false;
        }
        if (Math.hypot(dx - 3.45, dz - 4.15) <= 0.95) return false;
        break;
      case 'boudhanath-stupa':
        if (Math.abs(dx) <= 4.05 && Math.abs(dz) <= 4.05) return false;
        if (Math.hypot(dx - 3.85, dz - 4.4) <= 0.95) return false;
        break;
      case 'pumdikot-shiva':
        if (Math.hypot(dx, dz) <= 3.1) return false;
        if (
          Math.hypot(dx, dz) >= 4.45 &&
          Math.hypot(dx, dz) <= 5.2 &&
          !(Math.abs(dx) < 1.35 && dz > 0)
        ) {
          return false;
        }
        if (Math.hypot(dx + 3.4, dz - 4.9) <= 0.95) return false;
        break;
      case 'vit-vellore-tower':
        if (Math.abs(dx) <= 2.95 && Math.abs(dz) <= 2.75) return false;
        if (Math.hypot(dx + 3.3, dz - 3.85) <= 0.95) return false;
        break;
      case 'aniflow-studio':
        if (Math.abs(dx) <= 2.75 && Math.abs(dz + 0.45) <= 0.72) return false;
        if (Math.hypot(dx - 2.5, dz - 1.25) <= 0.92) return false;
        if (Math.hypot(dx + 2.45, dz - 0.95) <= 0.75) return false;
        if (Math.hypot(dx + 2.9, dz - 3.3) <= 0.95) return false;
        break;
      case 'agent-infra-monolith':
        if (Math.abs(dx) <= 2.65 && dz >= -2.55 && dz <= 0.05) return false;
        if (Math.abs(dx) <= 1.65 && Math.abs(dz - 1.85) <= 0.58) return false;
        if (Math.hypot(dx - 3.2, dz - 3.2) <= 0.95) return false;
        break;
      case 'breath-sensor-lab':
        if (Math.hypot(dx, dz) <= 2.72) return false;
        if (Math.hypot(dx + 2.8, dz - 3.4) <= 0.95) return false;
        break;
      case 'recruiter-beacon':
        if (Math.hypot(dx, dz) <= 1.65) return false;
        if (Math.abs(dx) <= 0.65 && Math.abs(dz - 2.05) <= 0.55) return false;
        if (Math.hypot(dx - 2.75, dz + 2.1) <= 0.95) return false;
        break;
    }
  }

  // Monumental 88m x 96m Lumbini Maya Devi Temple & Sacred Garden collision bounds
  const lumbiniLm = LANDMARKS.find((l) => l.id === 'lumbini-buddha');
  if (lumbiniLm) {
    const ldx = x - lumbiniLm.position.x;
    const ldz = z - lumbiniLm.position.z;
    if (ldx >= -45.2 && ldx <= 45.2 && ldz >= -45.2 && ldz <= 53.2) {
      // 1. Perimeter low brick wall (keep North/South axial gates |ldx| <= 3.4 and West/East gates ldz in [1.5, 6.5] wide open)
      if (Math.abs(ldz - 52.0) <= 0.65 && Math.abs(ldx) >= 3.4 && ldx >= -44.4 && ldx <= 44.4) return false;
      if (Math.abs(ldz + 44.0) <= 0.65 && Math.abs(ldx) >= 3.4 && ldx >= -44.4 && ldx <= 44.4) return false;
      if (Math.abs(ldx + 44.0) <= 0.65 && (ldz < 1.5 || ldz > 6.5) && ldz >= -44.4 && ldz <= 52.4) return false;
      if (Math.abs(ldx - 44.0) <= 0.65 && (ldz < 1.5 || ldz > 6.5) && ldz >= -44.4 && ldz <= 52.4) return false;

      // 2. South & North Dharmachakra Torana Gate piers + West/East Gate piers
      if (Math.abs(Math.abs(ldx) - 4.12) <= 0.85 && (Math.abs(ldz - 51.8) <= 0.85 || Math.abs(ldz + 43.8) <= 0.85)) {
        return false;
      }
      if ((Math.abs(ldx + 44.0) <= 0.82 || Math.abs(ldx - 44.0) <= 0.82) && (Math.abs(ldz - 1.5) <= 0.82 || Math.abs(ldz - 6.5) <= 0.82)) {
        return false;
      }

      // 3. 2003 Maya Devi Temple (center 0, -22.0, 36m x 24m): outer walls & sunken pit blocked; South ramp, doorway & interior boardwalk loop open
      if (Math.abs(ldx) <= 18.6 && ldz >= -34.6 && ldz <= -9.4) {
        const inDoorway = Math.abs(ldx) <= 1.55 && ldz >= -12.8 && ldz <= -9.3;
        const inBoardwalk =
          Math.abs(ldx) <= 16.85 &&
          ldz >= -32.85 &&
          ldz <= -11.15 &&
          !(Math.abs(ldx) <= 9.35 && ldz >= -27.95 && ldz <= -16.05);
        if (!inDoorway && !inBoardwalk) return false;
      }
      // South entrance ramp side Dharmachakra railings (center |ldx| <= 1.70 stays walkable!)
      if (Math.abs(Math.abs(ldx) - 2.06) <= 0.36 && ldz >= -10.0 && ldz <= -1.9) return false;

      // 4. Stepped Pushkarini Sacred Pond coping & water basin (+10.0, +16.5, 26.0m x 17.6m)
      if (ldx >= -3.35 && ldx <= 23.35 && ldz >= 7.35 && ldz <= 25.65) return false;

      // 5. Historic Ashoka Pillar fenced enclosure (-27.0, -21.0, scaled 1.22x)
      if (ldx >= -29.65 && ldx <= -24.35 && ldz >= -23.65 && ldz <= -18.35) return false;

      // 6. Monumental Golden Baby Buddha Lotus Basin (0, +39.0, scaled 1.28x)
      if (Math.hypot(ldx, ldz - 39.0) <= 4.15) return false;

      // 7. Myanmar Golden Pagoda (-32.5, +39.0, scaled 1.25x) & Royal Thai Marble Sanctuary (+35.0, -22.0, scaled 1.12x)
      if (Math.abs(ldx + 32.5) <= 5.6 && Math.abs(ldz - 39.0) <= 5.6) return false;
      if (Math.abs(ldx - 35.0) <= 5.15 && Math.abs(ldz + 22.0) <= 5.15) return false;

      // 8. Sacred Bodhi Tree Chautara (-29.0, +16.5, scaled 1.35x) & Eternal Peace Flame (+35.0, +24.0, scaled 1.22x)
      if (Math.hypot(ldx + 29.0, ldz - 16.5) <= 4.35) return false;
      if (Math.hypot(ldx - 35.0, ldz - 24.0) <= 2.75) return false;

      // 9. Excavated Mauryan Brick Ruins, Peace Bell Pavilion, Spinning Prayer Wheels, Lanterns, Shilalekh & Hedges
      for (const [rx, rz, rw, rd] of [
        [-9.5, -3.5, 3.6, 3.0],
        [9.5, -3.5, 4.0, 3.2],
        [16.5, -3.2, 3.2, 2.8],
        [-28.5, -8.0, 3.6, 3.0],
        [-35.0, -3.5, 3.8, 3.2],
        [-32.5, -32.0, 4.2, 3.4],
        [33.5, -6.5, 3.4, 2.8],
        [34.5, -0.5, 3.6, 3.0],
        [-11.5, 13.5, 3.0, 2.8],
        [-11.5, 20.5, 2.8, 2.6],
        [-34.5, 26.5, 3.4, 3.0],
        [35.0, 13.5, 3.2, 2.8],
        [-14.5, -38.5, 3.4, 2.8],
        [14.5, -38.5, 3.4, 2.8],
      ] as Array<[number, number, number, number]>) {
        if (Math.abs(ldx - rx) <= rw * 0.5 + 0.35 && Math.abs(ldz - rz) <= rd * 0.5 + 0.35) return false;
      }
      if (Math.abs(ldx + 13.0) <= 1.45 && Math.abs(ldz - 30.5) <= 1.45) return false;
      if (Math.abs(Math.abs(ldx) - 7.4) <= 0.78 && Math.abs(ldz - 39.0) <= 1.85) return false;
      if (Math.abs(ldx - 14.0) <= 2.05 && Math.abs(ldz - 46.5) <= 0.95) return false;
      for (const [plx, plz] of [
        [-7.4, 48.5], [7.4, 48.5],
        [-7.4, 33.0], [7.4, 33.0],
        [-4.2, -1.2], [4.2, -1.2],
        [-18.0, 0.8], [22.8, 0.8],
        [-20.8, -36.5], [25.7, -36.5],
        [23.2, 28.5], [-8.5, 28.5],
      ] as Array<[number, number]>) {
        if (Math.hypot(ldx - plx, ldz - plz) <= 0.55) return false;
      }
      for (const [hx, hz, hsx, hsz] of [
        [-22.8, -9.2, 0.68, 17.5],
        [-22.8, -30.6, 0.68, 12.2],
        [-22.8, 16.6, 0.68, 19.6],
        [27.6, -16.8, 0.68, 39.2],
        [27.6, 16.6, 0.68, 19.6],
        [-33.4, 6.3, 19.8, 0.68],
        [35.6, 6.3, 15.6, 0.68],
        [-8.9, 41.2, 0.68, 19.8],
        [8.9, 41.2, 0.68, 19.8],
        [-16.4, 31.2, 13.8, 0.68],
        [16.4, 31.2, 13.8, 0.68],
      ] as Array<[number, number, number, number]>) {
        if (Math.abs(ldx - hx) <= hsx * 0.5 + 0.25 && Math.abs(ldz - hz) <= hsz * 0.5 + 0.25) return false;
      }
    }
  }

  // Janaki Mandir full exterior & interior solid masonry collision (0.5m body clearance around pillars, arches & bastions)
  const janaki = LANDMARKS.find((l) => l.id === 'janaki-mandir');
  if (janaki) {
    const jdx = x - janaki.position.x;
    const jdz = z - janaki.position.z;

    // 1. Exterior plinth rim & side bastion footprint: guide entry up central staircase (|jdx| <= 4.65) & Simha Dwar arch (|jdx| <= 1.65)
    if (
      Math.abs(jdx) <= 26.2 &&
      jdz >= -23.2 &&
      jdz <= 19.2 &&
      !(Math.abs(jdx) <= 4.65 && jdz >= 18.2) &&
      !(Math.abs(jdx) <= 1.65 && jdz >= 10.0) &&
      !(Math.abs(jdx) <= 13.55 && jdz >= -12.6 && jdz <= 10.1)
    ) {
      return false;
    }

    // 2. Front ceremonial staircase cheek walls & guardian lion pedestals
    if (jdz >= 18.2 && jdz <= 23.6 && Math.abs(jdx) >= 4.65 && Math.abs(jdx) <= 7.0) {
      return false;
    }

    // 3. Janakpur Chowk heritage monument signpost (local 10.5, 24.0)
    if (jdx >= 8.1 && jdx <= 12.9 && jdz >= 22.8 && jdz <= 25.2) {
      return false;
    }

    // 4. Front palace facade & Simha Dwar side piers (keep central gateway arch |jdx| <= 1.65 open!)
    if (jdz >= 10.1 && jdz <= 19.2 && Math.abs(jdx) >= 1.65 && Math.abs(jdx) <= 26.2) {
      return false;
    }

    // 5. Left, Right & North enclosed Parikrama colonnade & palace walls (keep inner Prangan |jdx| <= 13.55, jdz in [-12.6, 10.1] walkable)
    if (jdz >= -23.2 && jdz < 10.1 && Math.abs(jdx) > 13.55 && Math.abs(jdx) <= 26.2) {
      return false;
    }
    if (jdz >= -23.2 && jdz < -12.6 && Math.abs(jdx) <= 14.5) {
      return false;
    }

    // 6. Inner Garbhagriha Ram-Janaki Sanctum plinth, Mukhamandapa porch & front steps + standing floor bell
    if (jdz >= -10.8 && jdz <= -1.25 && Math.abs(jdx) <= 4.9) {
      return false;
    }
    if (Math.hypot(jdx + 1.68, jdz + 2.85) <= 0.55) {
      return false;
    }

    // 7. Central Axial Lotus Medallion Processional Forecourt at (0, +3.5) remains unobstructed & walkable
    // Central Mughal Torana-Darwaza Gate masonry piers at (±3.25, 0.35) block pass-through while central span stays wide open
    if (Math.abs(Math.abs(jdx) - 3.25) <= 0.72 && Math.abs(jdz - 0.35) <= 0.82) {
      return false;
    }

    // 8. Four Courtyard Corner Marigold & Ashoka Planter Beds (local ±10.6, ±8.2) & Two North Sanctum Charbagh Parterres (local ±7.4, -9.8)
    if (Math.abs(jdx) >= 9.05 && Math.abs(jdx) <= 12.15 && Math.abs(jdz) >= 6.65 && Math.abs(jdz) <= 9.75) {
      return false;
    }
    if (Math.abs(jdx) >= 6.0 && Math.abs(jdx) <= 8.8 && jdz >= -11.2 && jdz <= -8.4) {
      return false;
    }

    // 9. Inner Courtyard Prayer-Wheel Gallery Racks (±12.2, -0.2) & Corner Prayer-Wheel Shrines (±5.6, -2.6 / +6.6)
    if (Math.abs(jdx) >= 11.3 && Math.abs(jdx) <= 13.1 && jdz >= -3.35 && jdz <= 2.95) {
      return false;
    }
    if (
      Math.abs(Math.abs(jdx) - 5.6) <= 0.85 &&
      (Math.abs(jdz + 2.6) <= 0.75 || Math.abs(jdz - 6.6) <= 0.75)
    ) {
      return false;
    }

    // 10. Standing Nepali Brass Panasa Lantern Pedestals on South Promenade (local ±2.85, +8.85)
    if (Math.abs(Math.abs(jdx) - 2.85) <= 0.48 && Math.abs(jdz - 8.85) <= 0.48) {
      return false;
    }

    // 11. Outer Janakpur Chowk Monuments (wide central marble runner, approach point (0,34), & gates stay open!)
    if (Math.abs(Math.abs(jdx) - 3.1) <= 0.72 && Math.abs(jdz - 57.5) <= 0.75) {
      return false;
    }
    if (Math.abs(jdx - 38.1) <= 0.75 && Math.abs(Math.abs(jdz - 36.5) - 3.1) <= 0.72) {
      return false;
    }
    if (Math.abs(Math.abs(jdx) - 7.2) <= 0.78 && Math.abs(jdz - 28.5) <= 0.78) {
      return false;
    }
    if (Math.hypot(jdx + 14.5, jdz - 34.0) <= 2.65) {
      return false;
    }
    if (Math.abs(Math.abs(jdx) - 24.5) <= 1.65 && Math.abs(jdz - 44.5) <= 1.65) {
      return false;
    }
    if (Math.abs(jdx + 26.5) <= 1.55 && Math.abs(jdz - 25.0) <= 1.55) {
      return false;
    }
    for (const [sx, sz, hw, hd] of [
      [-28.0, 33.5, 1.3, 1.75],
      [-17.5, 48.0, 1.75, 1.3],
      [24.5, 26.5, 1.3, 1.75],
      [17.5, 48.0, 1.75, 1.3],
    ] as Array<[number, number, number, number]>) {
      if (Math.abs(jdx - sx) <= hw && Math.abs(jdz - sz) <= hd) {
        return false;
      }
    }
    if (Math.abs(Math.abs(jdx) - 5.6) <= 0.58 && Math.abs(jdz - 39.5) <= 1.12) {
      return false;
    }

    // 12. Closed 4-Sided Compound Balustrade Fence & Octagonal Corner Burj Turrets (prevents passing through fence!)
    if (Math.abs(jdx + 56.5) <= 0.78 && jdz >= -35.2 && jdz <= 58.2) return false;
    if (Math.abs(jdz + 34.5) <= 0.78 && jdx >= -57.2 && jdx <= 38.8) return false;
    if (Math.abs(jdz - 57.5) <= 0.78 && jdx >= -57.2 && jdx <= 38.8 && Math.abs(jdx) >= 2.25) {
      return false;
    }
    if (
      Math.abs(jdx - 38.1) <= 0.78 &&
      jdz >= -35.2 &&
      jdz <= 58.2 &&
      Math.abs(jdz - 36.5) >= 2.25
    ) {
      return false;
    }
    for (const [bx, bz] of [
      [-56.5, 57.5],
      [38.1, 57.5],
      [38.1, -34.5],
      [-56.5, -34.5],
      [0, -34.5],
    ] as Array<[number, number]>) {
      if (Math.hypot(jdx - bx, jdz - bz) <= 1.18) return false;
    }

    // Paired interior Chowk cast-bronze lamp posts
    for (const [lx, lz] of [
      [-4.6, 54.0],
      [4.6, 54.0],
      [34.6, 32.7],
      [34.6, 40.3],
      [-15.2, 26.2],
      [15.2, 26.2],
      [-11.5, 44.5],
      [11.5, 44.5],
      [-32.5, 24.0],
      [32.5, 24.0],
      [-39.5, 53.5],
      [32.5, 51.0],
      [-53.2, 29.5],
      [-53.2, 50.5],
    ] as Array<[number, number]>) {
      if (Math.hypot(jdx - lx, jdz - lz) <= 0.68) return false;
    }

    // 13. Outer West, North & East Janaki Sacred Grounds (Ganga Sagar, Vivah Mandap, North Stambha, Chautaras, Pati, Pyaau & Amenities)
    // Ganga Sagar kund water basin & stepped coping rim (-44.5, 16.0) padded for player body radius
    if (jdx >= -52.68 && jdx <= -36.32 && jdz >= 6.02 && jdz <= 25.98) return false;
    // Varuna Ghat shrine north of Ganga Sagar (-44.5, 5.9)
    if (Math.abs(jdx + 44.5) <= 2.05 && Math.abs(jdz - 5.9) <= 1.55) return false;
    // Dana bird-feeding pedestal (-35.2, 16.0)
    if (Math.hypot(jdx + 35.2, jdz - 16.0) <= 0.92) return false;
    // Vivah Mandap (-45.0, 40.0): stepped Vedic Havan Kund altar + 12 perimeter columns
    if (Math.abs(jdx + 45.0) <= 1.45 && Math.abs(jdz - 40.0) <= 1.45) return false;
    for (const [mx, mz] of [
      [-2.9, -2.9], [-1.0, -2.9], [1.0, -2.9], [2.9, -2.9],
      [-2.9, 2.9], [-1.0, 2.9], [1.0, 2.9], [2.9, 2.9],
      [-2.9, -1.0], [-2.9, 1.0], [2.9, -1.0], [2.9, 1.0],
    ] as Array<[number, number]>) {
      if (Math.hypot(jdx + 45.0 - mx, jdz - 40.0 - mz) <= 0.62) return false;
    }
    // North Garuda Stambha column (0, -29.0) & twin North Tulsi shrines (±5.5, -29.0)
    if (Math.abs(jdx) <= 1.55 && Math.abs(jdz + 29.0) <= 1.55) return false;
    if (Math.abs(Math.abs(jdx) - 5.5) <= 1.2 && Math.abs(jdz + 29.0) <= 1.2) return false;
    // 4 Exterior Peepal Chautara platforms
    for (const [cx, cz] of [
      [-13.5, -28.5],
      [13.5, -28.5],
      [-32.5, -10.0],
      [32.5, -17.5],
    ] as Array<[number, number]>) {
      if (Math.abs(jdx - cx) <= 1.85 && Math.abs(jdz - cz) <= 1.85) return false;
    }
    // Ornate West Pilgrim Pati Rest Pavilion (-33.5, 50.5, orthogonal East-facing rotY = PI/2, 6.8 x 4.0m -> 4.0m X by 6.8m Z)
    if (Math.abs(jdx + 33.5) <= 2.38 && Math.abs(jdz - 50.5) <= 3.88) return false;
    // East Heritage Pyaau Water Kiosk (+32.0, -3.5)
    if (Math.abs(jdx - 32.0) <= 1.75 && Math.abs(jdz + 3.5) <= 2.05) return false;
    // South Plaza Pilgrim Amenities: Pakhala foot-wash trough (+15.5, 22.8) & Chappal rack (-15.5, 22.8)
    if (Math.abs(jdx - 15.5) <= 1.75 && Math.abs(jdz - 22.8) <= 1.1) return false;
    if (Math.abs(jdx + 15.5) <= 1.78 && Math.abs(jdz - 22.8) <= 0.95) return false;
    // Landscaped Raised Perimeter Garden Beds
    if (Math.abs(jdx + 42.5) <= 5.35 && Math.abs(jdz + 16.5) <= 4.35) return false;
    if (Math.abs(jdx + 42.5) <= 5.35 && Math.abs(jdz + 2.5) <= 4.15) return false;
    if (Math.abs(jdx - 32.5) <= 3.25 && Math.abs(jdz - 7.5) <= 4.15) return false;
    // Exterior Parikrama sandstone benches, lanterns & floral urns
    for (const [bx, bz, hw, hd] of [
      [-27.8, -9.0, 0.72, 1.28],
      [-27.8, 5.5, 0.72, 1.28],
      [27.8, -9.0, 0.72, 1.28],
      [27.8, 5.5, 0.72, 1.28],
      [-6.5, -24.8, 1.28, 0.72],
      [6.5, -24.8, 1.28, 0.72],
      [-40.5, -29.2, 1.28, 0.72],
      [26.5, -29.2, 1.28, 0.72],
    ] as Array<[number, number, number, number]>) {
      if (Math.abs(jdx - bx) <= hw && Math.abs(jdz - bz) <= hd) return false;
    }
    for (const [px, pz] of [
      [-28.2, -21.5],
      [28.2, -21.5],
      [-28.2, 16.5],
      [28.2, 16.5],
      [-10.5, -25.2],
      [10.5, -25.2],
      [-51.8, -29.8],
      [33.8, -29.8],
      [-20.5, -25.6],
      [20.5, -25.6],
      [-33.5, -21.2],
      [-33.5, 8.5],
      [-52.0, 29.0],
      [-52.0, 50.0],
    ] as Array<[number, number]>) {
      if (Math.hypot(jdx - px, jdz - pz) <= 0.75) return false;
    }
  }

  return true;
}

export function clampToWalkable(
  prevX: number,
  prevZ: number,
  nextX: number,
  nextZ: number,
): { x: number; z: number } {
  const dist = Math.hypot(nextX - prevX, nextZ - prevZ);
  // Instant fast-travel teleport (> 6m): validate destination directly
  if (dist > 6.0) {
    return isWalkablePosition(nextX, nextZ) ? { x: nextX, z: nextZ } : { x: prevX, z: prevZ };
  }

  // Swept substepping prevents fast sprinting from tunneling through temple walls
  const steps = Math.max(1, Math.ceil(dist / 0.3));
  let curX = prevX;
  let curZ = prevZ;
  const stepDx = (nextX - prevX) / steps;
  const stepDz = (nextZ - prevZ) / steps;

  for (let i = 0; i < steps; i++) {
    const tx = curX + stepDx;
    const tz = curZ + stepDz;
    if (isWalkablePosition(tx, tz)) {
      curX = tx;
      curZ = tz;
    } else if (isWalkablePosition(tx, curZ)) {
      curX = tx;
    } else if (isWalkablePosition(curX, tz)) {
      curZ = tz;
    } else {
      break;
    }
  }

  return { x: curX, z: curZ };
}

export function findNearestLandmark(
  x: number,
  z: number,
): { landmark: (typeof LANDMARKS)[number]; distance: number } | null {
  let best: (typeof LANDMARKS)[number] | null = null;
  let bestDist = Infinity;
  for (const lm of LANDMARKS) {
    const d = Math.hypot(x - lm.position.x, z - lm.position.z);
    if (d <= lm.interactRadius && d < bestDist) {
      best = lm;
      bestDist = d;
    }
  }
  return best ? { landmark: best, distance: bestDist } : null;
}

export function getPresetHour(preset: TimePreset, now = new Date()): number {
  switch (preset) {
    case 'dawn':
      return 6.35;
    case 'noon':
      return 12.5;
    case 'dusk':
      return 17.85;
    case 'night':
      return 22.25;
    case 'live':
    default:
      return now.getHours() + now.getMinutes() / 60;
  }
}

export function computeTimeLightingState(
  hourInput: number,
  weather: WeatherKind = 'clear',
): TimeLightingState {
  const hour = ((hourInput % 24) + 24) % 24;

  // Physically grounded atmospheric Rayleigh sky, sunlight & natural terrain bounce stops across 24 hours
  interface Stop {
    h: number;
    skyTop: string;
    skyHorizon: string;
    sunColor: string;
    sunInt: number;
    hemiSky: string;
    hemiGround: string;
    hemiInt: number;
    lantern: number;
    stars: number;
    bloomStrength: number;
    bloomRadius: number;
    bloomThreshold: number;
    emissiveScale: number;
    envInt: number;
  }

  const stops: Stop[] = [
    {
      h: 0,
      skyTop: '#070d1c',
      skyHorizon: '#1c2a44',
      sunColor: '#9eb8e0',
      sunInt: 0.44,
      hemiSky: '#466190',
      hemiGround: '#161a24',
      hemiInt: 0.42,
      lantern: 3.4,
      stars: 1.0,
      bloomStrength: 0.38,
      bloomRadius: 0.52,
      bloomThreshold: 1.08,
      emissiveScale: 2.55,
      envInt: 0.22,
    },
    {
      h: 5.2,
      skyTop: '#1a2947',
      skyHorizon: '#9b6d5e',
      sunColor: '#f7b472',
      sunInt: 0.88,
      hemiSky: '#7587ad',
      hemiGround: '#2c2724',
      hemiInt: 0.5,
      lantern: 2.1,
      stars: 0.48,
      bloomStrength: 0.28,
      bloomRadius: 0.44,
      bloomThreshold: 1.2,
      emissiveScale: 1.85,
      envInt: 0.28,
    },
    {
      h: 6.8,
      skyTop: '#36659e',
      skyHorizon: '#dfc29f',
      sunColor: '#ffd4a3',
      sunInt: 1.42,
      hemiSky: '#94b5db',
      hemiGround: '#474034',
      hemiInt: 0.56,
      lantern: 0.75,
      stars: 0.0,
      bloomStrength: 0.2,
      bloomRadius: 0.38,
      bloomThreshold: 1.32,
      emissiveScale: 1.15,
      envInt: 0.34,
    },
    {
      h: 12.0,
      skyTop: '#2967ad',
      skyHorizon: '#c1d6e8',
      sunColor: '#fff1db',
      sunInt: 1.58,
      hemiSky: '#acc9e8',
      hemiGround: '#454236',
      hemiInt: 0.58,
      lantern: 0.12,
      stars: 0.0,
      bloomStrength: 0.1,
      bloomRadius: 0.3,
      bloomThreshold: 1.48,
      emissiveScale: 0.58,
      envInt: 0.34,
    },
    {
      h: 17.5,
      skyTop: '#325285',
      skyHorizon: '#db9f72',
      sunColor: '#f7b878',
      sunInt: 1.38,
      hemiSky: '#8fa4cc',
      hemiGround: '#42352b',
      hemiInt: 0.54,
      lantern: 1.85,
      stars: 0.08,
      bloomStrength: 0.26,
      bloomRadius: 0.44,
      bloomThreshold: 1.26,
      emissiveScale: 1.5,
      envInt: 0.32,
    },
    {
      h: 19.3,
      skyTop: '#0d162c',
      skyHorizon: '#2a3c59',
      sunColor: '#9eb8e0',
      sunInt: 0.48,
      hemiSky: '#4f6a99',
      hemiGround: '#191e29',
      hemiInt: 0.44,
      lantern: 3.1,
      stars: 0.92,
      bloomStrength: 0.36,
      bloomRadius: 0.5,
      bloomThreshold: 1.1,
      emissiveScale: 2.35,
      envInt: 0.24,
    },
    {
      h: 24.0,
      skyTop: '#070d1c',
      skyHorizon: '#1c2a44',
      sunColor: '#9eb8e0',
      sunInt: 0.44,
      hemiSky: '#466190',
      hemiGround: '#161a24',
      hemiInt: 0.42,
      lantern: 3.4,
      stars: 1.0,
      bloomStrength: 0.38,
      bloomRadius: 0.52,
      bloomThreshold: 1.08,
      emissiveScale: 2.55,
      envInt: 0.22,
    },
  ];

  let a = stops[0];
  let b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (hour >= stops[i].h && hour <= stops[i + 1].h) {
      a = stops[i];
      b = stops[i + 1];
      break;
    }
  }
  const span = Math.max(0.0001, b.h - a.h);
  const t = smoothstep(0, 1, (hour - a.h) / span);

  // Sun arc across sky
  const dayArc = ((hour - 6) / 12) * Math.PI;
  const isDay = hour >= 5.5 && hour <= 19.0;
  const sunElevation = isDay ? Math.max(0.18, Math.sin(dayArc) * 1.15) : 0.45;
  const sunAzimuth = isDay ? -0.8 + ((hour - 6) / 12) * 1.6 : 0.65;

  let skyTopColor = lerpHexColor(a.skyTop, b.skyTop, t);
  let skyHorizonColor = lerpHexColor(a.skyHorizon, b.skyHorizon, t);
  let sunIntensity = lerp(a.sunInt, b.sunInt, t);
  let fogDensity = 0.0018;
  let cameraFar = 780;
  let bloomStrength = lerp(a.bloomStrength, b.bloomStrength, t);
  let bloomRadius = lerp(a.bloomRadius, b.bloomRadius, t);
  let bloomThreshold = lerp(a.bloomThreshold, b.bloomThreshold, t);
  const emissiveScale = lerp(a.emissiveScale, b.emissiveScale, t);
  const envIntensity = lerp(a.envInt, b.envInt, t);

  if (weather === 'mist') {
    skyHorizonColor = lerpHexColor(skyHorizonColor, '#c4cdd6', 0.55);
    skyTopColor = lerpHexColor(skyTopColor, '#8293a6', 0.45);
    sunIntensity *= 0.68;
    fogDensity = 0.0068;
    cameraFar = 540;
    bloomStrength *= 1.1;
    bloomRadius += 0.08;
  } else if (weather === 'foggy') {
    skyHorizonColor = lerpHexColor(skyHorizonColor, '#aeb6bf', 0.72);
    skyTopColor = lerpHexColor(skyTopColor, '#7a8490', 0.65);
    sunIntensity *= 0.54;
    fogDensity = 0.0102;
    cameraFar = 250;
    bloomStrength *= 1.15;
    bloomRadius += 0.14;
  } else if (weather === 'rain') {
    skyHorizonColor = lerpHexColor(skyHorizonColor, '#64707d', 0.62);
    skyTopColor = lerpHexColor(skyTopColor, '#333e4c', 0.6);
    sunIntensity *= 0.52;
    fogDensity = 0.0062;
    cameraFar = 520;
    bloomStrength *= 1.05;
  } else if (weather === 'snow') {
    skyHorizonColor = lerpHexColor(skyHorizonColor, '#c7d1dc', 0.45);
    skyTopColor = lerpHexColor(skyTopColor, '#7b8ca2', 0.35);
    sunIntensity *= 0.74;
    fogDensity = 0.0054;
    cameraFar = 520;
    bloomThreshold = Math.min(1.6, bloomThreshold + 0.1);
  }

  let phaseLabel: TimeLightingState['phaseLabel'] = 'Night';
  if (hour >= 5 && hour < 7.5) phaseLabel = 'Dawn';
  else if (hour >= 7.5 && hour < 12) phaseLabel = 'Morning';
  else if (hour >= 12 && hour < 16.5) phaseLabel = 'Afternoon';
  else if (hour >= 16.5 && hour < 18.5) phaseLabel = 'Golden Hour';
  else if (hour >= 18.5 && hour < 20.2) phaseLabel = 'Dusk';

  return {
    hour,
    phaseLabel,
    sunElevation,
    sunAzimuth,
    sunColor: lerpHexColor(a.sunColor, b.sunColor, t),
    sunIntensity,
    hemiSkyColor: lerpHexColor(a.hemiSky, b.hemiSky, t),
    hemiGroundColor: lerpHexColor(a.hemiGround, b.hemiGround, t),
    hemiIntensity: lerp(a.hemiInt, b.hemiInt, t),
    skyTopColor,
    skyHorizonColor,
    fogColor: skyHorizonColor,
    fogDensity,
    lanternIntensity: lerp(a.lantern, b.lantern, t),
    starOpacity: weather === 'rain' || weather === 'foggy' ? 0 : lerp(a.stars, b.stars, t),
    cameraFar,
    bloomStrength,
    bloomRadius,
    bloomThreshold,
    emissiveScale,
    envIntensity,
  };
}

/**
 * Computes spatial proximity blend (0..1) inside the expanded Lumbini UNESCO Sacred Garden
 * and Western Peace Canal Sanctuary (left of Janaki Mandir).
 */
export function computeLumbiniBlendFactor(
  x: number,
  z: number,
  focusedLandmarkId?: string | null,
): number {
  if (focusedLandmarkId === 'lumbini-buddha') return 1.0;
  // Rectangular core covering Maya Devi Sanctuary, Pushkarini Pond, Peace Canal & Western Peace Stupa
  const dx = x < -316 ? -316 - x : x > -164 ? x - -164 : 0;
  const dz = z < 32 ? 32 - z : z > 168 ? z - 168 : 0;
  const boxDist = Math.hypot(dx, dz);
  return 1 - smoothstep(0, 46, boxDist);
}

/**
 * Blends valley time lighting with Lumbini Sanctuary atmosphere presets:
 * - 'sanctuary-auto': preserves valley sky time while adding serene sanctum lamp glow & slight mist warmth
 * - 'lotus-dawn': rose-gold Himalayan morning mist & warm butter-lamp highlights
 * - 'bodhi-zen': high-clarity serene daylight with calm sky contrast & gentle inner sanctum radiance
 * - 'butter-lamp-dusk': saffron-amber dusk activating Pushkarini, Peace Flame & Peace Canal lanterns
 * - 'moonlight-vigil': deep starlit peaceful night vigil with warm butter-lamp pools
 */
export function computeEffectiveLightingState(
  hourInput: number,
  weather: WeatherKind,
  x: number,
  z: number,
  lumbiniPreset: LumbiniAmbiencePreset = 'sanctuary-auto',
  focusedLandmarkId?: string | null,
): { lighting: TimeLightingState; lumbiniBlend: number } {
  const base = computeTimeLightingState(hourInput, weather);
  const spatialFactor = computeLumbiniBlendFactor(x, z, focusedLandmarkId);

  if (spatialFactor <= 0.01) {
    return { lighting: base, lumbiniBlend: 0 };
  }

  if (lumbiniPreset === 'sanctuary-auto') {
    const subtleWarmth = spatialFactor * 0.22;
    return {
      lumbiniBlend: spatialFactor,
      lighting: {
        ...base,
        sunColor: lerpHexColor(base.sunColor, '#ffe9c4', subtleWarmth),
        skyHorizonColor: lerpHexColor(base.skyHorizonColor, '#dfceb8', subtleWarmth * 0.65),
        fogColor: lerpHexColor(base.fogColor, '#dfceb8', subtleWarmth * 0.65),
        lanternIntensity: Math.max(base.lanternIntensity, lerp(base.lanternIntensity, 0.72, spatialFactor)),
        emissiveScale: Math.max(base.emissiveScale, lerp(base.emissiveScale, 0.96, spatialFactor)),
      },
    };
  }

  const presetSpecs: Record<
    Exclude<LumbiniAmbiencePreset, 'sanctuary-auto'>,
    {
      hour: number;
      sunColor: string;
      sunInt: number;
      hemiSky: string;
      hemiGround: string;
      hemiInt: number;
      skyTop: string;
      skyHorizon: string;
      fogDensity: number;
      lantern: number;
      stars: number;
      bloomStrength: number;
      bloomRadius: number;
      bloomThreshold: number;
      emissiveScale: number;
      envInt: number;
      elevation: number;
      azimuth: number;
      phaseLabel: TimeLightingState['phaseLabel'];
    }
  > = {
    'lotus-dawn': {
      hour: 6.15,
      sunColor: '#ffcba0',
      sunInt: 1.32,
      hemiSky: '#a3b6da',
      hemiGround: '#4a3d33',
      hemiInt: 0.56,
      skyTop: '#2c5488',
      skyHorizon: '#e5b293',
      fogDensity: 0.0038,
      lantern: 1.45,
      stars: 0.08,
      bloomStrength: 0.24,
      bloomRadius: 0.42,
      bloomThreshold: 1.22,
      emissiveScale: 1.45,
      envInt: 0.32,
      elevation: 0.28,
      azimuth: -0.68,
      phaseLabel: 'Dawn',
    },
    'bodhi-zen': {
      hour: 11.2,
      sunColor: '#fff3dc',
      sunInt: 1.54,
      hemiSky: '#b2d0eb',
      hemiGround: '#444639',
      hemiInt: 0.59,
      skyTop: '#2466ab',
      skyHorizon: '#cae1ec',
      fogDensity: 0.0017,
      lantern: 0.65,
      stars: 0.0,
      bloomStrength: 0.14,
      bloomRadius: 0.34,
      bloomThreshold: 1.38,
      emissiveScale: 0.92,
      envInt: 0.35,
      elevation: 0.98,
      azimuth: -0.18,
      phaseLabel: 'Morning',
    },
    'butter-lamp-dusk': {
      hour: 17.95,
      sunColor: '#ffad66',
      sunInt: 1.24,
      hemiSky: '#7d92c4',
      hemiGround: '#3e2d24',
      hemiInt: 0.53,
      skyTop: '#1a2c59',
      skyHorizon: '#de8f62',
      fogDensity: 0.0029,
      lantern: 3.15,
      stars: 0.24,
      bloomStrength: 0.32,
      bloomRadius: 0.48,
      bloomThreshold: 1.12,
      emissiveScale: 2.25,
      envInt: 0.29,
      elevation: 0.24,
      azimuth: 0.68,
      phaseLabel: 'Dusk',
    },
    'moonlight-vigil': {
      hour: 22.4,
      sunColor: '#a6c2eb',
      sunInt: 0.52,
      hemiSky: '#4a689c',
      hemiGround: '#161b26',
      hemiInt: 0.46,
      skyTop: '#070f24',
      skyHorizon: '#1c2d4d',
      fogDensity: 0.0024,
      lantern: 3.85,
      stars: 0.96,
      bloomStrength: 0.38,
      bloomRadius: 0.52,
      bloomThreshold: 1.06,
      emissiveScale: 2.7,
      envInt: 0.24,
      elevation: 0.48,
      azimuth: 0.58,
      phaseLabel: 'Night',
    },
  };

  const target = presetSpecs[lumbiniPreset];
  const blend = spatialFactor;
  const fogColor = lerpHexColor(base.fogColor, target.skyHorizon, blend);

  return {
    lumbiniBlend: blend,
    lighting: {
      hour: blend > 0.5 ? target.hour : base.hour,
      phaseLabel: blend > 0.5 ? target.phaseLabel : base.phaseLabel,
      sunElevation: lerp(base.sunElevation, target.elevation, blend),
      sunAzimuth: lerp(base.sunAzimuth, target.azimuth, blend),
      sunColor: lerpHexColor(base.sunColor, target.sunColor, blend),
      sunIntensity: lerp(base.sunIntensity, target.sunInt, blend),
      hemiSkyColor: lerpHexColor(base.hemiSkyColor, target.hemiSky, blend),
      hemiGroundColor: lerpHexColor(base.hemiGroundColor, target.hemiGround, blend),
      hemiIntensity: lerp(base.hemiIntensity, target.hemiInt, blend),
      skyTopColor: lerpHexColor(base.skyTopColor, target.skyTop, blend),
      skyHorizonColor: lerpHexColor(base.skyHorizonColor, target.skyHorizon, blend),
      fogColor,
      fogDensity: Math.max(base.fogDensity, lerp(base.fogDensity, target.fogDensity, blend)),
      lanternIntensity: lerp(base.lanternIntensity, target.lantern, blend),
      starOpacity:
        weather === 'rain' || weather === 'foggy'
          ? 0
          : lerp(base.starOpacity, target.stars, blend),
      cameraFar: base.cameraFar,
      bloomStrength: lerp(base.bloomStrength, target.bloomStrength, blend),
      bloomRadius: lerp(base.bloomRadius, target.bloomRadius, blend),
      bloomThreshold: lerp(base.bloomThreshold, target.bloomThreshold, blend),
      emissiveScale: lerp(base.emissiveScale, target.emissiveScale, blend),
      envIntensity: lerp(base.envIntensity, target.envInt, blend),
    },
  };
}

export interface LumbiniAudioProfile {
  chimeActivity: number;
  bowlActivity: number;
  flagFlutterLevel: number;
  padWarmth: number;
  chimeIntervalMinSec: number;
  chimeIntervalMaxSec: number;
  bowlIntervalSec: number;
}

/**
 * Computes soft temple wind-chimes, singing-bowl resonance, and prayer-flag cloth flutter
 * levels driven by spatial proximity to Lumbini Sacred Garden and the active preset.
 */
export function computeLumbiniAudioProfile(
  mix: SpatialAmbienceMix,
  preset: LumbiniAmbiencePreset = 'sanctuary-auto',
  weather: WeatherKind = 'clear',
): LumbiniAudioProfile {
  const inSanctuary = mix.activeZone === 'peace-garden';
  const baseFactor = inSanctuary ? 1.0 : mix.nearestForestId === 'lumbini-grove' ? 0.52 : 0.0;

  if (baseFactor <= 0.01) {
    return {
      chimeActivity: 0,
      bowlActivity: 0,
      flagFlutterLevel: Math.min(0.35, mix.windLevel * 0.25),
      padWarmth: mix.activeZone === 'temple-courtyard' ? 0.45 : 0.25,
      chimeIntervalMinSec: 9,
      chimeIntervalMaxSec: 15,
      bowlIntervalSec: 20,
    };
  }

  let chimeMult = 0.72;
  let bowlMult = 0.56;
  let flutterMult = 0.76;
  let padWarmth = 0.78;
  let chimeMin = 4.2;
  let chimeMax = 8.4;
  let bowlSec = 11.5;

  switch (preset) {
    case 'lotus-dawn':
      chimeMult = 0.92;
      bowlMult = 0.48;
      flutterMult = 0.85;
      padWarmth = 0.74;
      chimeMin = 3.2;
      chimeMax = 6.5;
      bowlSec = 13.0;
      break;
    case 'bodhi-zen':
      chimeMult = 0.84;
      bowlMult = 0.72;
      flutterMult = 0.92;
      padWarmth = 0.86;
      chimeMin = 3.8;
      chimeMax = 7.2;
      bowlSec = 10.5;
      break;
    case 'butter-lamp-dusk':
      chimeMult = 0.76;
      bowlMult = 0.92;
      flutterMult = 0.74;
      padWarmth = 0.95;
      chimeMin = 4.5;
      chimeMax = 8.6;
      bowlSec = 9.0;
      break;
    case 'moonlight-vigil':
      chimeMult = 0.64;
      bowlMult = 1.0;
      flutterMult = 0.58;
      padWarmth = 1.0;
      chimeMin = 5.4;
      chimeMax = 9.8;
      bowlSec = 8.2;
      break;
    case 'sanctuary-auto':
    default:
      break;
  }

  const weatherBreezeBoost = weather === 'rain' ? 0.8 : weather === 'mist' ? 0.92 : 1.0;
  const windNorm = Math.max(0.28, Math.min(1.0, 0.34 + mix.windLevel * 0.72));

  return {
    chimeActivity: Math.min(1, baseFactor * chimeMult * (0.65 + windNorm * 0.35)),
    bowlActivity: Math.min(1, baseFactor * bowlMult),
    flagFlutterLevel: Math.min(1, baseFactor * flutterMult * windNorm * weatherBreezeBoost),
    padWarmth: baseFactor * padWarmth,
    chimeIntervalMinSec: chimeMin,
    chimeIntervalMaxSec: chimeMax,
    bowlIntervalSec: bowlSec,
  };
}

export function mapWmoToWeather(wmoCode: number): WeatherKind {
  if (wmoCode === 48) return 'foggy';
  if (wmoCode === 45) return 'mist';
  if (
    (wmoCode >= 71 && wmoCode <= 77) ||
    wmoCode === 85 ||
    wmoCode === 86
  ) {
    return 'snow';
  }
  if (
    (wmoCode >= 51 && wmoCode <= 67) ||
    (wmoCode >= 80 && wmoCode <= 82) ||
    (wmoCode >= 95 && wmoCode <= 99)
  ) {
    return 'rain';
  }
  return 'clear';
}

export function computeAtmosphereParticleProfile(
  weather: WeatherKind,
  hourInput: number,
): AtmosphereParticleProfile {
  const hour = ((hourInput % 24) + 24) % 24;
  const isTwilightOrNight = hour < 6.4 || hour >= 17.6;

  switch (weather) {
    case 'mist':
      return {
        weather,
        activeRatio: 0.44,
        opacity: 0.36,
        particleSize: 165,
        fallSpeed: 0.72,
        windDriftX: 2.1,
        windDriftZ: 0.8,
        turbulence: 1.15,
        streakStretch: 0,
        colorHex: '#e6edf5',
        glowStrength: 0.2,
      };
    case 'foggy':
      return {
        weather,
        activeRatio: 0.68,
        opacity: 0.32,
        particleSize: 195,
        fallSpeed: 0.22,
        windDriftX: 1.1,
        windDriftZ: 0.45,
        turbulence: 1.35,
        streakStretch: 0,
        colorHex: '#d7dee6',
        glowStrength: 0.15,
      };
    case 'rain':
      return {
        weather,
        activeRatio: 0.94,
        opacity: 0.84,
        particleSize: 360,
        fallSpeed: 19.5,
        windDriftX: 3.2,
        windDriftZ: 1.1,
        turbulence: 0.15,
        streakStretch: 1.0,
        colorHex: '#e0f2fe',
        glowStrength: 0.3,
      };
    case 'snow':
      return {
        weather,
        activeRatio: 1.0,
        opacity: 0.94,
        particleSize: 165,
        fallSpeed: 2.65,
        windDriftX: 1.35,
        windDriftZ: 0.65,
        turbulence: 1.45,
        streakStretch: 0,
        colorHex: '#ffffff',
        glowStrength: 0.45,
      };
    case 'clear':
    default:
      return {
        weather: 'clear',
        activeRatio: isTwilightOrNight ? 0.28 : 0.16,
        opacity: isTwilightOrNight ? 0.84 : 0.6,
        particleSize: isTwilightOrNight ? 108 : 84,
        fallSpeed: -0.22,
        windDriftX: 0.45,
        windDriftZ: 0.25,
        turbulence: 0.68,
        streakStretch: 0,
        colorHex: isTwilightOrNight ? '#fde68a' : '#fff3c4',
        glowStrength: isTwilightOrNight ? 0.95 : 0.55,
      };
  }
}

export interface IncenseSmokeProfile {
  opacity: number;
  eveningGlow: number;
  plumeHeightScale: number;
}

export interface IncenseVentOffsets {
  ventY: number;
  ringRadius: number;
  maxRise: number;
  lateralScale: number;
}

export function computeIncenseSmokeProfile(lanternIntensity: number): IncenseSmokeProfile {
  const eveningGlow = Math.max(0, Math.min(1, (lanternIntensity - 0.28) / 2.2));
  return {
    opacity: 0.24 + eveningGlow * 0.14,
    eveningGlow,
    plumeHeightScale: 0.94 + eveningGlow * 0.14,
  };
}

export function computeIncenseVentOffsets(
  kind: 'standing' | 'hanging',
  scale: number,
): IncenseVentOffsets {
  if (kind === 'standing') {
    return {
      ventY: 2.02 * scale,
      ringRadius: 0.155 * scale,
      maxRise: 1.85 * scale,
      lateralScale: 1.0,
    };
  }
  return {
    ventY: -0.63 * scale,
    ringRadius: 0.135 * scale,
    maxRise: 0.95 * scale,
    lateralScale: 1.25,
  };
}

export interface BirdFlightTrackSpec {
  centerX: number;
  centerZ: number;
  radiusX: number;
  radiusZ: number;
  baseY: number;
  bobAmp: number;
  angularSpeed: number;
  phase: number;
  figureEight?: number;
}

export interface BirdFlightSample {
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  roll: number;
  wingFlapRad: number;
}

export function sampleBirdFlightState(
  track: BirdFlightTrackSpec,
  elapsed: number,
  flapFreq = 26,
): BirdFlightSample {
  const fig = track.figureEight ?? 0;
  const w = track.angularSpeed;
  const t = elapsed * w + track.phase;

  const cosT = Math.cos(t);
  const sinT = Math.sin(t);
  const sin2T = Math.sin(2 * t);
  const cos2T = Math.cos(2 * t);

  const x = track.centerX + cosT * track.radiusX;
  const z = track.centerZ + (sinT + fig * sin2T) * track.radiusZ;
  const bobPhase = t * 2.0 + track.phase * 1.3;
  const y = track.baseY + Math.sin(bobPhase) * track.bobAmp;

  const vx = -sinT * track.radiusX * w;
  const vz = (cosT + 2 * fig * cos2T) * track.radiusZ * w;
  const vy = Math.cos(bobPhase) * track.bobAmp * 2.0 * w;

  const horizSpeed = Math.hypot(vx, vz);
  const yaw = Math.atan2(vx, vz);
  const pitch = Math.atan2(-vy, Math.max(0.01, horizSpeed));

  // Centripetal lateral acceleration yields realistic inward wing banking during turns
  const ax = -cosT * track.radiusX * w * w;
  const az = (-sinT - 4 * fig * sin2T) * track.radiusZ * w * w;
  const fx = horizSpeed > 1e-4 ? vx / horizSpeed : 0;
  const fz = horizSpeed > 1e-4 ? vz / horizSpeed : 1;
  const lateralAcc = fx * az - fz * ax;
  const roll = Math.max(-0.44, Math.min(0.44, lateralAcc * 0.42));

  // Natural pigeon flap-and-glide cadence (~3s cycle: active beats followed by serene dihedral glide)
  const rawCycle = (elapsed * 0.34 + track.phase * 0.71) % 1;
  const u = rawCycle < 0 ? rawCycle + 1 : rawCycle;
  const climbBoost = vy > 0.08 ? 0.25 : 0;
  let flapEnvelope = 1.0;
  if (u > 0.62 && u < 0.72) {
    flapEnvelope = 1 - smoothstep(0.62, 0.72, u);
  } else if (u >= 0.72 && u < 0.92) {
    flapEnvelope = 0.0;
  } else if (u >= 0.92) {
    flapEnvelope = smoothstep(0.92, 1.0, u);
  }
  flapEnvelope = Math.min(1.0, flapEnvelope + climbBoost);

  const activeBeat = Math.sin(elapsed * flapFreq + track.phase * 3.1) * 0.64 + 0.06;
  const glideDihedral = 0.2;
  const wingFlapRad = lerp(glideDihedral, activeBeat, flapEnvelope);

  return { x, y, z, yaw, pitch, roll, wingFlapRad };
}

export function validateContactPayload(payload: ContactPayload): ContactValidationResult {
  const errors: Partial<Record<keyof ContactPayload, string>> = {};
  const name = payload.name.trim();
  const email = payload.email.trim();
  const message = payload.message.trim();

  if (name.length < 2) {
    errors.name = 'Please enter your name (at least 2 characters).';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Please enter a valid work or recruiter email address.';
  }
  if (message.length < 10) {
    errors.message = 'Please share a short note about the role or project (at least 10 characters).';
  }
  if (message.length > 2500) {
    errors.message = 'Message must be under 2,500 characters.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function encodeWaypointsToHash(waypoints: CustomWaypoint[]): string {
  if (waypoints.length === 0) return '';
  const compact = waypoints.slice(0, 12).map((wp) => ({
    l: wp.label.slice(0, 32),
    x: Math.round(wp.x * 10) / 10,
    z: Math.round(wp.z * 10) / 10,
    c: wp.color,
  }));
  const json = JSON.stringify(compact);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `#trail=${btoa(binary)}`;
}

export function decodeWaypointsFromHash(hash: string): CustomWaypoint[] {
  if (!hash.startsWith('#trail=')) return [];
  try {
    const b64 = hash.slice('#trail='.length);
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .slice(0, 12)
      .filter(
        (item) =>
          item &&
          typeof item.l === 'string' &&
          typeof item.x === 'number' &&
          typeof item.z === 'number' &&
          Number.isFinite(item.x) &&
          Number.isFinite(item.z),
      )
      .map((item, idx) => ({
        id: `shared-${idx}-${Math.round(item.x)}-${Math.round(item.z)}`,
        label: item.l.slice(0, 32),
        x: Math.max(-WORLD_RADIUS + 4, Math.min(WORLD_RADIUS - 4, item.x)),
        z: Math.max(-WORLD_RADIUS + 4, Math.min(WORLD_RADIUS - 4, item.z)),
        color: typeof item.c === 'string' && /^#[0-9a-fA-F]{6}$/.test(item.c) ? item.c : '#f59e0b',
        createdAt: Date.now(),
      }));
  } catch {
    return [];
  }
}

export type FootstepSurfaceKind = 'stone' | 'wood' | 'grass';

export interface ForestLandmarkArea {
  id: string;
  name: string;
  x: number;
  z: number;
  innerRadius: number;
  outerRadius: number;
  birdDensity: number;
  rustleDensity: number;
}

export const FOREST_LANDMARK_AREAS: ForestLandmarkArea[] = [
  {
    id: 'lumbini-grove',
    name: 'Lumbini Sacred Grove',
    x: -228,
    z: 96,
    innerRadius: 56,
    outerRadius: 112,
    birdDensity: 1.0,
    rustleDensity: 0.82,
  },
  {
    id: 'pumdikot-forest',
    name: 'Pumdikot Alpine Forest',
    x: -108,
    z: -74,
    innerRadius: 12,
    outerRadius: 52,
    birdDensity: 0.72,
    rustleDensity: 1.0,
  },
  {
    id: 'pashupati-woodland',
    name: 'Pashupati Bagmati Woodland',
    x: -48,
    z: -24,
    innerRadius: 10,
    outerRadius: 44,
    birdDensity: 0.88,
    rustleDensity: 0.84,
  },
  {
    id: 'boudha-grove',
    name: 'Boudhanath Pine & Sakura Grove',
    x: -108,
    z: 4,
    innerRadius: 12,
    outerRadius: 44,
    birdDensity: 0.8,
    rustleDensity: 0.76,
  },
  {
    id: 'bagmati-willow-woods',
    name: 'Bagmati Willow & Birch Woods',
    x: 20,
    z: 42,
    innerRadius: 10,
    outerRadius: 34,
    birdDensity: 0.84,
    rustleDensity: 0.74,
  },
];

export interface ForestProximityInfo {
  forestProximity: number;
  birdForestBoost: number;
  windRustleLevel: number;
  nearestForestId: string | null;
  nearestForestName: string | null;
  nearbyTreeCount: number;
}

/**
 * Computes proximity (0..1) to named forest landmark areas and local tree-canopy density
 * for driving dynamic bird chirping and wind-rustling foliage ambience.
 */
export function computeForestProximity(x: number, z: number): ForestProximityInfo {
  let maxAreaProx = 0;
  let maxBirdBoost = 0;
  let maxRustle = 0;
  let nearestForestId: string | null = null;
  let nearestForestName: string | null = null;

  for (let i = 0; i < FOREST_LANDMARK_AREAS.length; i++) {
    const area = FOREST_LANDMARK_AREAS[i];
    const d = Math.hypot(x - area.x, z - area.z);
    const prox = 1 - smoothstep(area.innerRadius, area.outerRadius, d);
    if (prox > maxAreaProx) {
      maxAreaProx = prox;
      nearestForestId = prox > 0.05 ? area.id : nearestForestId;
      nearestForestName = prox > 0.05 ? area.name : nearestForestName;
    }
    maxBirdBoost = Math.max(maxBirdBoost, prox * area.birdDensity);
    maxRustle = Math.max(maxRustle, prox * area.rustleDensity);
  }

  // Blend in local woodland canopy density from procedural valley trees
  const trees = getWorldTreeSpots();
  let nearbyTreeCount = 0;
  for (let i = 0; i < trees.length; i++) {
    const tr = trees[i];
    const dx = x - tr.x;
    const dz = z - tr.z;
    if (dx * dx + dz * dz <= 24 * 24) {
      nearbyTreeCount++;
    }
  }
  const canopyDensity = Math.max(0, Math.min(1, (nearbyTreeCount - 3) / 14));

  const forestProximity = Math.max(0, Math.min(1, Math.max(maxAreaProx, canopyDensity * 0.72)));
  const birdForestBoost = Math.max(0, Math.min(1, Math.max(maxBirdBoost, canopyDensity * 0.65)));
  const windRustleLevel = Math.max(0, Math.min(1, Math.max(maxRustle, canopyDensity * 0.68)));

  return {
    forestProximity,
    birdForestBoost,
    windRustleLevel,
    nearestForestId: forestProximity > 0.05 ? nearestForestId : null,
    nearestForestName: forestProximity > 0.05 ? nearestForestName : null,
    nearbyTreeCount,
  };
}

export interface MeadowZone {
  id: string;
  name: string;
  x: number;
  z: number;
  radiusX: number;
  radiusZ: number;
  falloff: number;
}

export const MEADOW_ZONES: MeadowZone[] = [
  {
    id: 'western-valley-meadow',
    name: 'Western Valley Meadow',
    x: -65,
    z: 45,
    radiusX: 30,
    radiusZ: 28,
    falloff: 10,
  },
  {
    id: 'lumbini-clover-meadow',
    name: 'Lumbini Clover Meadow',
    x: -175,
    z: 24,
    radiusX: 28,
    radiusZ: 24,
    falloff: 9,
  },
  {
    id: 'lumbini-western-peace-meadow',
    name: 'Lumbini Peace Parkland Meadow',
    x: -318,
    z: 132,
    radiusX: 26,
    radiusZ: 28,
    falloff: 10,
  },
  {
    id: 'bagmati-wildflower-meadow',
    name: 'Bagmati Wildflower Meadow',
    x: 16,
    z: 24,
    radiusX: 16,
    radiusZ: 28,
    falloff: 8,
  },
  {
    id: 'kathmandu-south-meadow',
    name: 'Kathmandu Valley Meadow',
    x: -22,
    z: 18,
    radiusX: 16,
    radiusZ: 16,
    falloff: 7,
  },
  {
    id: 'vellore-foothill-meadow',
    name: 'Vellore Foothill Meadow',
    x: 64,
    z: 16,
    radiusX: 26,
    radiusZ: 26,
    falloff: 9,
  },
  {
    id: 'annapurna-foothill-meadow',
    name: 'Annapurna Foothill Meadow',
    x: -76,
    z: -46,
    radiusX: 22,
    radiusZ: 22,
    falloff: 8,
  },
];

export interface MeadowZoneQuery {
  inMeadow: boolean;
  zoneId: string | null;
  zoneName: string | null;
  factor: number;
}

/**
 * Evaluates whether world coordinates (x, z) fall inside a designated grassy 'meadow' zone
 * (excluding paved stone roads, plazas, and wooden bridge decks).
 */
export function getMeadowZoneAt(x: number, z: number): MeadowZoneQuery {
  if (getFootstepSurfaceKind(x, z) !== 'grass') {
    return { inMeadow: false, zoneId: null, zoneName: null, factor: 0 };
  }

  let bestFactor = 0;
  let bestZone: MeadowZone | null = null;
  for (let i = 0; i < MEADOW_ZONES.length; i++) {
    const mz = MEADOW_ZONES[i];
    const normDist = Math.hypot((x - mz.x) / mz.radiusX, (z - mz.z) / mz.radiusZ);
    const outerRatio = 1 + mz.falloff / Math.min(mz.radiusX, mz.radiusZ);
    const f = 1 - smoothstep(0.68, outerRatio, normDist);
    if (f > bestFactor) {
      bestFactor = f;
      bestZone = mz;
    }
  }

  const inMeadow = bestFactor > 0.05 && bestZone !== null;
  return {
    inMeadow,
    zoneId: inMeadow && bestZone ? bestZone.id : null,
    zoneName: inMeadow && bestZone ? bestZone.name : null,
    factor: bestFactor,
  };
}

export interface SpatialAmbienceMix {
  windLevel: number;
  birdLevel: number;
  streamLevel: number;
  forestLevel: number;
  rustleLevel: number;
  nearestForestId: string | null;
  activeZone:
    | 'himalayan-ridge'
    | 'peace-garden'
    | 'temple-courtyard'
    | 'river-valley'
    | 'open-valley';
}

const STONE_PLAZA_RADII: Record<string, number> = {
  'kathmandu-stupa': 9.2,
  'boudhanath-stupa': 10.5,
  'pumdikot-shiva': 9.5,
  'vit-vellore-tower': 11.2,
  'aniflow-studio': 8.2,
  'agent-infra-monolith': 8.4,
  'breath-sensor-lab': 8.4,
  'recruiter-beacon': 8.2,
};

const ROAD_SEGMENTS_COARSE: Array<Array<[number, number]>> = ROAD_PATHS;

function pointToSegmentDist(
  px: number,
  pz: number,
  ax: number,
  az: number,
  bx: number,
  bz: number,
): number {
  const dx = bx - ax;
  const dz = bz - az;
  const lenSq = dx * dx + dz * dz;
  if (lenSq < 1e-6) return Math.hypot(px - ax, pz - az);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / lenSq));
  return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
}

/**
 * Classifies ground surface at (x, z) for footstep dust vs grass-displacement effects and audio.
 */
export function getFootstepSurfaceKind(x: number, z: number): FootstepSurfaceKind {
  if (isOnBridgeDeck(x, z)) return 'wood';
  if (isOnLumbiniCanalBridge(x, z)) return 'stone';
  if (Math.hypot(x - SPAWN_POSITION.x, z - SPAWN_POSITION.z) <= 7.5) return 'stone';

  const lumbini = LANDMARKS.find((l) => l.id === 'lumbini-buddha');
  if (lumbini) {
    const ldx = x - lumbini.position.x;
    const ldz = z - lumbini.position.z;
    if (ldx >= -44.2 && ldx <= 44.2 && ldz >= -44.2 && ldz <= 52.2) {
      if (
        Math.abs(ldx) <= 17.2 &&
        ldz >= -33.2 &&
        ldz <= -10.8 &&
        !(Math.abs(ldx) <= 9.0 && ldz >= -27.6 && ldz <= -16.4)
      ) {
        return 'wood';
      }
      const onBrickOrRamp =
        (Math.abs(ldx) <= 1.95 && ldz > -10.8 && ldz <= -2.0) ||
        (Math.abs(ldx) <= 8.5 && ldz >= 28.0 && ldz <= 52.4) ||
        (ldz >= 2.0 && ldz <= 6.0) ||
        (Math.abs(ldx) <= 3.4 && ldz >= -2.5 && ldz <= 2.0) ||
        (ldx >= -22.4 && ldx <= -19.2 && ldz >= -42.5 && ldz <= 30.8) ||
        (ldx >= 24.2 && ldx <= 27.2 && ldz >= -42.5 && ldz <= 30.8) ||
        (ldx >= -19.2 && ldx <= 27.2 && ldz >= 27.2 && ldz <= 30.8) ||
        (ldx >= -22.4 && ldx <= 27.2 && ldz >= -42.5 && ldz <= -38.5) ||
        (Math.abs(ldx) <= 3.4 && ldz >= -44.4 && ldz <= -42.5) ||
        (ldx >= -27.0 && ldx <= -22.4 && ldz >= -22.8 && ldz <= -19.2) ||
        (Math.abs(ldx) <= 20.4 && ldz >= -36.8 && ldz <= -34.2);
      return onBrickOrRamp ? 'stone' : 'grass';
    }
  }

  // Western Lumbini Peace Canal promenade, Maitri bridge approach & Peace Stupa plaza
  if (
    Math.hypot(x - LUMBINI_PEACE_CANAL.stupaCenterX, z - LUMBINI_PEACE_CANAL.stupaCenterZ) <=
      LUMBINI_PEACE_CANAL.stupaPlazaRadius ||
    (x >= -295.0 && x <= -254.0 && Math.abs(z - LUMBINI_PEACE_CANAL.bridgeCenterZ) <= 2.6) ||
    (z >= LUMBINI_PEACE_CANAL.minZ &&
      z <= LUMBINI_PEACE_CANAL.maxZ &&
      ((x >= -265.2 && x <= -261.2) || (x >= -282.8 && x <= -278.8)))
  ) {
    return 'stone';
  }

  const janaki = LANDMARKS.find((l) => l.id === 'janaki-mandir');
  if (janaki) {
    const jdx = x - janaki.position.x;
    const jdz = z - janaki.position.z;
    // Temple plinth + inner courtyard + stairs + outer Chowk brick plaza & Parikrama walkways
    if (Math.abs(jdx) <= 28.5 && jdz >= -25.8 && jdz <= 22.0) return 'stone';
    if (Math.abs(jdx) <= 38.6 && jdz >= 15.0 && jdz <= 58.2) return 'stone';
    if (jdx >= -56.8 && jdx <= -37.5 && jdz >= 25.0 && jdz <= 58.2) return 'stone';
    if (jdx >= -56.5 && jdx <= -35.0 && jdz >= 2.0 && jdz <= 26.0) return 'stone';
    if (jdx >= -56.8 && jdx <= 38.5 && jdz >= -34.8 && jdz <= -30.0) return 'stone';
    if (jdx >= -56.8 && jdx <= -52.5 && jdz >= -34.5 && jdz <= 8.0) return 'stone';
    if (jdx >= 34.2 && jdx <= 38.5 && jdz >= -34.5 && jdz <= 15.8) return 'stone';
  }

  for (const lm of LANDMARKS) {
    const rad = STONE_PLAZA_RADII[lm.id];
    if (rad && Math.hypot(x - lm.position.x, z - lm.position.z) <= rad) {
      return 'stone';
    }
  }

  for (const chain of ROAD_SEGMENTS_COARSE) {
    for (let i = 0; i < chain.length - 1; i++) {
      const [ax, az] = chain[i];
      const [bx, bz] = chain[i + 1];
      if (pointToSegmentDist(x, z, ax, az, bx, bz) <= 2.35) {
        return 'stone';
      }
    }
  }

  return 'grass';
}

/**
 * Computes spatial ambient wind, wind-rustling foliage, stream water murmur, & birdsong mix
 * based on proximity to forest landmark areas, alpine lake/ridge elevation, river corridor, and Janaki courtyard.
 */
export function computeSpatialAmbienceMix(
  x: number,
  z: number,
  elevation: number,
): SpatialAmbienceMix {
  const pumdikot = LANDMARKS.find((l) => l.id === 'pumdikot-shiva');
  const lumbini = LANDMARKS.find((l) => l.id === 'lumbini-buddha');
  const janaki = LANDMARKS.find((l) => l.id === 'janaki-mandir');
  const ktm = LANDMARKS.find((l) => l.id === 'kathmandu-stupa');
  const boudha = LANDMARKS.find((l) => l.id === 'boudhanath-stupa');

  const dPumdikot = pumdikot ? Math.hypot(x - pumdikot.position.x, z - pumdikot.position.z) : 999;
  const dLake = Math.hypot(x - GLACIAL_LAKE.x, z - GLACIAL_LAKE.z);
  const dLumbini = lumbini ? Math.hypot(x - lumbini.position.x, z - lumbini.position.z) : 999;
  const dKtm = ktm ? Math.hypot(x - ktm.position.x, z - ktm.position.z) : 999;
  const dBoudha = boudha ? Math.hypot(x - boudha.position.x, z - boudha.position.z) : 999;
  const dRiver = Math.abs(x - getRiverCenterX(z));
  const dPeaceCanal =
    z >= LUMBINI_PEACE_CANAL.minZ - 12 && z <= LUMBINI_PEACE_CANAL.maxZ + 12
      ? Math.abs(x - LUMBINI_PEACE_CANAL.centerX)
      : 999;

  const ridgeFactor = Math.max(
    1 - smoothstep(10, 38, dPumdikot),
    1 - smoothstep(24, 52, dLake),
    smoothstep(-95, -145, z) * 0.72,
    smoothstep(1.1, 3.0, elevation) * 0.58,
  );
  const peaceGardenFactor = Math.max(
    1 - smoothstep(14, 54, dLumbini),
    computeLumbiniBlendFactor(x, z),
  );
  const stupaSanctuaryFactor = Math.max(
    1 - smoothstep(8, 22, dKtm),
    1 - smoothstep(10, 26, dBoudha),
  );
  const riverFactor = 1 - smoothstep(6, 26, dRiver);
  const peaceCanalWaterFactor = (1 - smoothstep(4, 18, dPeaceCanal)) * 0.42;

  const forestInfo = computeForestProximity(x, z);

  let inJanakiCourtyard = 0;
  let inJanakiChowk = 0;
  let nearJanakiWater = 0;
  if (janaki) {
    const jdx = x - janaki.position.x;
    const jdz = z - janaki.position.z;
    if (Math.abs(jdx) <= 14.5 && jdz >= -13.5 && jdz <= 11.5) {
      inJanakiCourtyard = 1;
    } else if (Math.abs(jdx) <= 56 && jdz >= -34 && jdz <= 60) {
      inJanakiChowk = 1 - smoothstep(28, 52, Math.hypot(jdx + 12, jdz - 26));
    }
    const dHiti = Math.hypot(jdx + 14.5, jdz - 34.0);
    const dGanga = Math.hypot(jdx + 44.5, jdz - 16.0);
    nearJanakiWater = Math.max(
      (1 - smoothstep(3, 14, dHiti)) * 0.42,
      (1 - smoothstep(8, 22, dGanga)) * 0.52,
    );
  }

  let windLevel =
    0.14 +
    ridgeFactor * 0.74 +
    riverFactor * 0.22 +
    peaceGardenFactor * 0.08 +
    forestInfo.forestProximity * 0.12;
  windLevel = lerp(windLevel, 0.07, inJanakiCourtyard * 0.85);
  windLevel = Math.max(0, Math.min(1, windLevel));

  const forestLevel = Math.max(
    0,
    Math.min(1, forestInfo.forestProximity * (1 - inJanakiCourtyard * 0.82)),
  );

  let rustleLevel =
    forestInfo.windRustleLevel * (0.42 + windLevel * 0.58) +
    forestLevel * 0.25;
  rustleLevel = lerp(rustleLevel, 0.04, inJanakiCourtyard * 0.9);
  rustleLevel = Math.max(0, Math.min(1, rustleLevel));

  let birdLevel =
    0.14 +
    forestInfo.birdForestBoost * 0.56 +
    peaceGardenFactor * 0.48 +
    stupaSanctuaryFactor * 0.28 +
    inJanakiCourtyard * 0.64 +
    inJanakiChowk * 0.34 +
    riverFactor * 0.26 +
    (1 - smoothstep(26, 48, dLake)) * 0.18;
  birdLevel *= 1 - ridgeFactor * 0.38;
  birdLevel = Math.max(0, Math.min(1, birdLevel));

  const streamLevel = Math.max(
    0,
    Math.min(
      1,
      Math.max(
        (1 - smoothstep(4, 24, dRiver)) * 0.95,
        (1 - smoothstep(20, 44, dLake)) * 0.85,
        nearJanakiWater,
        peaceCanalWaterFactor,
      ),
    ),
  );

  let activeZone: SpatialAmbienceMix['activeZone'] = 'open-valley';
  if (ridgeFactor >= 0.45) activeZone = 'himalayan-ridge';
  else if (peaceGardenFactor >= 0.4) activeZone = 'peace-garden';
  else if (inJanakiCourtyard > 0.5 || inJanakiChowk > 0.35) activeZone = 'temple-courtyard';
  else if (riverFactor >= 0.45) activeZone = 'river-valley';

  return {
    windLevel,
    birdLevel,
    streamLevel,
    forestLevel,
    rustleLevel,
    nearestForestId: forestInfo.nearestForestId,
    activeZone,
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function lerpHexColor(hexA: string, hexB: string, t: number): string {
  const a = parseInt(hexA.slice(1), 16);
  const b = parseInt(hexB.slice(1), 16);
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const br = (b >> 16) & 255;
  const bg = (b >> 8) & 255;
  const bb = b & 255;
  const r = Math.round(lerp(ar, br, t));
  const g = Math.round(lerp(ag, bg, t));
  const bl = Math.round(lerp(ab, bb, t));
  return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`;
}

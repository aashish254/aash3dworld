import { LANDMARKS } from '../data/portfolioData';
import {
  PASHUPATI_COMPLEX,
  PASHUPATI_INTERACTIVE_SPOTS,
  carvePashupatinathGround,
  getPashupatinathSurfaceY,
  isInPashupatiBagmatiRiver,
  isInPashupatiPrecinct,
  isOnPashupatiBagmatiBridge,
  isPashupatinathWalkable,
} from './pashupatinathData';
import {
  BOUDHA_INTERACTIVE_SPOTS,
  carveBoudhanathGround,
  getBoudha108PrayerWheelPlacements,
  getBoudhanathSurfaceY,
  isBoudhanathWalkable,
  isInBoudhaHardSurface,
  isInBoudhaPrecinct,
} from './boudhanathData';
import {
  PUMDIKOT_INTERACTIVE_SPOTS,
  carvePumdikotGround,
  getPumdikotSurfaceY,
  isInPumdikotHardSurface,
  isInPumdikotPrecinct,
  isPumdikotWalkable,
} from './pumdikotData';
import {
  TREK_KEY_SPOTS,
  TREK_PLATEAUS,
  computeHimalayaTrekAmbience,
  getTrekFootstepSurface,
  getTrekSurfaceHeightAt,
  isInsideTrekMountainFootprint,
  isTrekPositionWalkable,
} from './himalayaTrekData';

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

export const WORLD_RADIUS = 560;
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

export const LUMBINI_FENCE_BOUNDS = {
  localMinX: -88.0,
  localMaxX: 64.0,
  localMinZ: -66.0,
  localMaxZ: 74.0,
  minX: -368.0,
  maxX: -216.0,
  minZ: 30.0,
  maxZ: 170.0,
  gateXHalf: 3.65,
  gateZ0: 1.05,
  gateZ1: 6.95,
} as const;

export const LUMBINI_PEACE_CANAL = {
  centerX: -348,
  minX: -354,
  maxX: -342,
  minZ: 44,
  maxZ: 156,
  waterLevel: -0.26,
  bridgeMinX: -356.2,
  bridgeMaxX: -339.8,
  bridgeCenterZ: 100.0,
  bridgeHalfWidth: 2.6,
};

export const LUMBINI_SACRED_POND = {
  centerX: -280,
  centerZ: 96,
  innerMinX: -324.6,
  innerMaxX: -235.4,
  innerMinZ: 51.4,
  innerMaxZ: 148.6,
  outerMinX: -330.0,
  outerMaxX: -230.0,
  outerMinZ: 44.0,
  outerMaxZ: 156.0,
  waterLevel: 0.03,
  bridgeBaseY: 0.35,
  bridgeArchLift: 0.26,
  southBridge: { minX: -283.4, maxX: -276.6, minZ: 148.0, maxZ: 156.6 },
  northBridge: { minX: -283.4, maxX: -276.6, minZ: 43.4, maxZ: 52.0 },
  eastBridge: { minX: -236.0, maxX: -229.4, minZ: 97.2, maxZ: 102.8 },
  westBridge: { minX: -330.6, maxX: -324.0, minZ: 97.2, maxZ: 102.8 },
  southPromenadeZ: { min: 156.2, max: 159.6 },
  northPromenadeZ: { min: 40.4, max: 43.8 },
};

export const LUMBINI_PUSHKARINI_POND = {
  centerX: -270,
  centerZ: 112.5,
  minX: -281.0,
  maxX: -259.0,
  minZ: 105.8,
  maxZ: 119.2,
  waterLevel: 0.21,
};

export const ROAD_PATHS: Array<Array<[number, number]>> = [
  [[0, 6], [-24, -10], [-48, -24]],
  [[-48, -24], [-78, -10], [-108, 4]],
  [[-108, 4], [-116, -42], [-112, -84]],
  [[0, 6], [11, -10], [22.5, -24]],
  [[37.5, -24], [58, -26], [78, -28]],
  [[78, -28], [98, -42], [118, -56]],
  [[118, -56], [127, -72], [136, -88]],
  [[136, -88], [115, -92], [94, -96]],
  [[78, -28], [87, -62], [94, -96]],
  // Smooth continuous boulevard from Spawn arriving perpendicularly at Janaki Chowk East Gate (-53.9, 128.5)
  [[0, 6], [-16, 28], [-30, 58], [-38, 94], [-42, 122], [-46.5, 128.5], [-50.5, 128.5], [-53.9, 128.5]],
  // Continuous Janaki Chowk South Gate (-92, 149.5) -> Scenic Perimeter Boulevard cleanly outside expanded Lumbini Fence -> Boudhanath Stupa (-108, 4)
  [[-92, 149.5], [-92, 158.0], [-92, 168.0], [-125, 174.0], [-170, 177.5], [-212, 178.5], [-250, 178.5], [-280, 178.5], [-320, 178.5], [-356, 178.5], [-376, 172.0], [-379, 140.0], [-379, 100.0], [-379, 60.0], [-376, 28.0], [-354, 21.0], [-315, 21.0], [-280, 21.0], [-245, 21.0], [-212, 21.0], [-176, 18.0], [-140, 11.0], [-108, 4]],
  // East Scenic Park Corridor cleanly outside Lumbini East Fence (x = -216) and >= 54m clear of Janaki Mandir West Wall (x = -148.5)
  [[-205.0, 176.5], [-205.0, 140.0], [-205.0, 108.0], [-205.0, 100.0], [-205.0, 72.0], [-205.0, 23.0]],
  // Pashupatinath Western Avenue straight south along x=-92 from Janaki Mandir South Gate -> Paschim Dwar Approach Plaza (-82, 300)
  [[-92.0, 168.0], [-92.0, 212.0], [-92.0, 256.0], [-92.0, 300.0], [-84.0, 300.0]],
  // Pashupatinath North Gate Avenue from Janaki East Boulevard -> North Gate (-28, 238)
  [[-46.5, 128.5], [-34.0, 168.0], [-28.0, 206.0], [-28.0, 236.5]],
  // Boudhanath Stupa & Kora Plaza East, North & South Gate Avenues (-308, 302)
  [[-92.0, 300.0], [-132.0, 296.0], [-172.0, 298.0], [-212.0, 301.0], [-245.0, 302.0]],
  [[-308.0, 178.5], [-308.0, 208.0], [-308.0, 239.0]],
  [[-212.0, 301.0], [-228.0, 336.0], [-244.0, 368.0], [-276.0, 376.0], [-302.0, 375.0], [-308.0, 371.0], [-308.0, 366.0]],
  // Pumdikot Mahadev South Crimson Gate Approach Spur (-50, -28)
  [[-48, -24], [-49.5, -25.0], [-50, -28]],
  // North Himalayan Trailhead Approach Spur connecting Spawn Vista directly to Sagarmatha Trek Gate (6, -144)
  [[0, 6], [4, -40], [6, -92], [6, -142]],
];

export const ROAD_LANTERN_COORDS: Array<[number, number]> = [
  [-8, 0],
  [-28, -14],
  [-64, -15],
  [-95, -5],
  [-112, -38],
  [-54.5, -22.5],
  [-44.5, -21.5],
  [16, -21],
  [56, -24],
  [94, -44],
  [110, -52],
  [126, -70],
  [116, -95],
  [84, -62],
  [-18, 28],
  [-46, 86],
  [-48.5, 132.2],
  [-48.5, 124.8],
  [-88.2, 154.5],
  [-95.8, 154.5],
  [-155.0, 173.5],
  [-196.0, 174.0],
  [-245.0, 174.2],
  [-320.0, 174.2],
  // Expanded Lumbini Outer Scenic Boulevard & East Corridor lanterns (all seated cleanly on dry verge outside fence)
  [-374.5, 136.0],
  [-374.5, 64.0],
  [-373.8, 96.2],
  [-373.8, 103.8],
  [-315.0, 25.5],
  [-245.0, 25.5],
  [-186.0, 24.5],
  [-209.5, 96.0],
  [-209.5, 104.0],
  // Pashupatinath Western & North Avenue Approach Lanterns
  [-96.5, 196.0],
  [-87.5, 224.0],
  [-96.5, 252.0],
  [-87.5, 276.0],
  [-96.5, 294.0],
  [-24.0, 220.0],
  [-32.0, 188.0],
  // Boudhanath Approach Avenues
  [-132.0, 291.5],
  [-172.0, 293.5],
  [-212.0, 296.5],
  [-240.0, 306.5],
  [-303.5, 208.0],
  [-276.0, 371.0],
  // North Himalayan Trailhead Spur lanterns
  [1.2, -52.0],
  [9.8, -102.0],
  [1.8, -138.0],
];

export const PRAYER_FLAG_POLES: Array<[number, number]> = [
  [-96.0, 284.0],
  [-84.0, 287.0],
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
  // Pashupatinath Western Approach Plaza ritual artifacts (-98..-88, 289..313)
  { x: -97.5, z: 289.5, kind: 'incense-stand', rotY: 0.3, scale: 1.05 },
  { x: -93.0, z: 289.5, kind: 'offering-bowl', rotY: 0.0, scale: 1.05 },
  { x: -97.5, z: 312.5, kind: 'prayer-flags', rotY: 0.5, scale: 1.0 },
  { x: -95.0, z: 312.5, kind: 'incense-stand', rotY: -0.4, scale: 1.0 },
  // Boudhanath Stupa & Kora Plaza outer gate aprons (-308, 302)
  { x: -314.5, z: 364.2, kind: 'offering-bowl', rotY: 0.35, scale: 1.05 },
  { x: -301.5, z: 364.2, kind: 'prayer-flags', rotY: -0.35, scale: 1.05 },
  { x: -245.2, z: 295.8, kind: 'incense-stand', rotY: 0.25, scale: 1.0 },
  { x: -245.2, z: 308.2, kind: 'offering-bowl', rotY: -0.25, scale: 1.05 },
  // Lumbini Sacred Garden outer lawns & Peace Canal Parkland inside unified fence (-280, 96)
  { x: -285.8, z: 159.5, kind: 'offering-bowl', rotY: 0.25, scale: 1.05 },
  { x: -274.2, z: 159.5, kind: 'offering-bowl', rotY: -0.25, scale: 1.05 },
  { x: -286.5, z: 37.5, kind: 'prayer-flags', rotY: 0.4, scale: 1.05 },
  { x: -273.5, z: 37.5, kind: 'incense-stand', rotY: -0.4, scale: 1.0 },
  { x: -336.5, z: 86.0, kind: 'prayer-flags', rotY: 0.15, scale: 1.1 },
  { x: -336.5, z: 114.0, kind: 'prayer-flags', rotY: -0.15, scale: 1.1 },
  { x: -361.0, z: 112.0, kind: 'offering-bowl', rotY: 0.4, scale: 1.05 },
  { x: -361.0, z: 88.0, kind: 'incense-stand', rotY: -0.4, scale: 1.05 },
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

  for (let i = 0; i < 2400 && treeSpots.length < 660; i++) {
    const angle = i * goldenAngle;
    const t = ((i % 1200) + 0.5) / 1200;
    const radius = 14.5 + Math.sqrt(t) * 485;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    const nearLandmark = LANDMARKS.some((lm) => {
      const dx = x - lm.position.x;
      const dz = z - lm.position.z;
      if (lm.id === 'janaki-mandir') {
        return dx > -64 && dx < 46 && dz > -42 && dz < 78;
      }
      if (lm.id === 'lumbini-buddha') {
        return dx > -92 && dx < 68 && dz > -70 && dz < 78;
      }
      if (lm.id === 'kathmandu-stupa') {
        return isInPashupatiPrecinct(x, z);
      }
      if (lm.id === 'boudhanath-stupa') {
        return isInBoudhaPrecinct(x, z, 5);
      }
      if (lm.id === 'pumdikot-shiva') {
        return isInPumdikotPrecinct(x, z, 5);
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
    const nearWestCanalWalk =
      x >= -370 && x <= -324 && Math.abs(z - LUMBINI_PEACE_CANAL.bridgeCenterZ) < 6.2;
    const nearRoad = minDistToRoadSamples(x, z, roadSamples) < 4.6;
    const nearArtifact = OUTER_TEMPLE_ARTIFACT_SPOTS.some((a) => Math.hypot(x - a.x, z - a.z) < 3.0);
    const inSagarmathaPeak =
      (x >= -112 && x <= 186 && z <= -135) ||
      Math.hypot(x - TREK_PLATEAUS.trailhead.x, z - TREK_PLATEAUS.trailhead.z) < 16;

    if (
      nearLandmark ||
      nearSpawn ||
      nearRiver ||
      nearLake ||
      nearPeaceCanal ||
      nearWestCanalWalk ||
      nearRoad ||
      nearArtifact ||
      inSagarmathaPeak
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
    const nearPeaceGarden = Math.hypot(x + 310, z - 96) < 125;
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
    const r = 18 + Math.sqrt((i + 1) / 520) * 465;
    const rx = Math.cos(a) * r;
    const rz = Math.sin(a) * r;
    const nearLandmark = LANDMARKS.some((lm) =>
      lm.id === 'janaki-mandir'
        ? rx - lm.position.x > -64 && rx - lm.position.x < 46 && rz - lm.position.z > -42 && rz - lm.position.z < 75
        : lm.id === 'lumbini-buddha'
          ? rx - lm.position.x > -92 && rx - lm.position.x < 68 && rz - lm.position.z > -70 && rz - lm.position.z < 78
          : lm.id === 'kathmandu-stupa'
            ? isInPashupatiPrecinct(rx, rz)
            : lm.id === 'boudhanath-stupa'
              ? isInBoudhaPrecinct(rx, rz, 5)
              : lm.id === 'pumdikot-shiva'
                ? isInPumdikotPrecinct(rx, rz, 5)
                : Math.hypot(rx - lm.position.x, rz - lm.position.z) < 14,
    );
    const nearSpawn = Math.hypot(rx - SPAWN_POSITION.x, rz - SPAWN_POSITION.z) < 12;
    const riverCenterX = getRiverCenterX(rz);
    const nearRiver = Math.abs(rx - riverCenterX) < 8.5;
    const nearLake = Math.hypot(rx - GLACIAL_LAKE.x, rz - GLACIAL_LAKE.z) < GLACIAL_LAKE.basinRadius + 2.5;
    const nearPeaceParkland = rx >= -376 && rx <= -210 && rz >= 24 && rz <= 176;
    const nearRoad = minDistToRoadSamples(rx, rz, roadSamples) < 4.5;
    const inSagarmathaPeak =
      (rx >= -112 && rx <= 186 && rz <= -135) ||
      Math.hypot(rx - TREK_PLATEAUS.trailhead.x, rz - TREK_PLATEAUS.trailhead.z) < 15;
    if (nearLandmark || nearSpawn || nearRiver || nearLake || nearPeaceParkland || nearRoad || inSagarmathaPeak) continue;
    rockSpots.push({ x: rx, z: rz, idx: i });
  }
  cachedBoulderSpots = rockSpots;
  return rockSpots;
}

export function getRiverCenterX(z: number): number {
  const meander = Math.sin(z * 0.028) * 6.5;
  // Smoothly align the meandering river straight along x=34 through the stone Pashupatinath Aryaghat corridor (z=236..364)
  if (z > 210 && z < 392) {
    const enterT = smoothstep(210, 236, z);
    const exitT = 1 - smoothstep(364, 392, z);
    const channelize = Math.min(enterT, exitT);
    return 34 + meander * (1 - channelize);
  }
  return 34 + meander;
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

export function isOnLumbiniSacredBridge(x: number, z: number): boolean {
  const { southBridge, northBridge, eastBridge, westBridge } = LUMBINI_SACRED_POND;
  return (
    (x >= southBridge.minX && x <= southBridge.maxX && z >= southBridge.minZ && z <= southBridge.maxZ) ||
    (x >= northBridge.minX && x <= northBridge.maxX && z >= northBridge.minZ && z <= northBridge.maxZ) ||
    (x >= eastBridge.minX && x <= eastBridge.maxX && z >= eastBridge.minZ && z <= eastBridge.maxZ) ||
    (x >= westBridge.minX && x <= westBridge.maxX && z >= westBridge.minZ && z <= westBridge.maxZ)
  );
}

export function getLumbiniSacredBridgeDeckY(x: number, z: number): number {
  const { southBridge, northBridge, eastBridge, westBridge, bridgeBaseY, bridgeArchLift } = LUMBINI_SACRED_POND;
  if (x >= southBridge.minX && x <= southBridge.maxX && z >= southBridge.minZ && z <= southBridge.maxZ) {
    const t = Math.max(0, Math.min(1, (z - southBridge.minZ) / (southBridge.maxZ - southBridge.minZ)));
    return bridgeBaseY + Math.sin(t * Math.PI) * bridgeArchLift;
  }
  if (x >= northBridge.minX && x <= northBridge.maxX && z >= northBridge.minZ && z <= northBridge.maxZ) {
    const t = Math.max(0, Math.min(1, (z - northBridge.minZ) / (northBridge.maxZ - northBridge.minZ)));
    return bridgeBaseY + Math.sin(t * Math.PI) * bridgeArchLift;
  }
  if (x >= eastBridge.minX && x <= eastBridge.maxX && z >= eastBridge.minZ && z <= eastBridge.maxZ) {
    const t = Math.max(0, Math.min(1, (x - eastBridge.minX) / (eastBridge.maxX - eastBridge.minX)));
    return bridgeBaseY + Math.sin(t * Math.PI) * bridgeArchLift;
  }
  if (x >= westBridge.minX && x <= westBridge.maxX && z >= westBridge.minZ && z <= westBridge.maxZ) {
    const t = Math.max(0, Math.min(1, (x - westBridge.minX) / (westBridge.maxX - westBridge.minX)));
    return bridgeBaseY + Math.sin(t * Math.PI) * bridgeArchLift;
  }
  return bridgeBaseY;
}

export function isOnLumbiniBridgeAbutmentPier(_x: number, _z: number): boolean {
  // In-pond bridge abutment piers were removed so the pond moat stays clean and unobstructed.
  return false;
}

export function isInLumbiniSurroundingPond(x: number, z: number): boolean {
  if (isOnLumbiniSacredBridge(x, z) || isOnLumbiniBridgeAbutmentPier(x, z)) return false;
  const p = LUMBINI_SACRED_POND;
  const inOuter =
    x >= p.outerMinX && x <= p.outerMaxX && z >= p.outerMinZ && z <= p.outerMaxZ;
  if (!inOuter) return false;
  const inInnerIsland =
    x > p.innerMinX && x < p.innerMaxX && z > p.innerMinZ && z < p.innerMaxZ;
  return !inInnerIsland;
}

export function isInLumbiniPushkariniPond(x: number, z: number): boolean {
  const p = LUMBINI_PUSHKARINI_POND;
  return x >= p.minX && x <= p.maxX && z >= p.minZ && z <= p.maxZ;
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

  if (isOnLumbiniSacredBridge(x, z)) {
    return getLumbiniSacredBridgeDeckY(x, z);
  }

  // Sweeping open-world Himalayan valley undulation
  let h =
    Math.sin(x * 0.032) * Math.cos(z * 0.028) * 1.35 +
    Math.sin(x * 0.08 + z * 0.05) * 0.38;

  // Foothill rim around outer valley basin pushed generously outward to preserve open western Lumbini plains
  const radial = Math.hypot(x, z);
  if (radial > 515 && z > -135) {
    const outerT = Math.min(1, (radial - 515) / 95);
    const northFade = smoothstep(-135, -60, z);
    h += outerT * outerT * 6.5 * northFade;
  }
  if (z < -158) {
    const trailFade = smoothstep(8.5, 18.0, Math.hypot(x - TREK_PLATEAUS.trailhead.x, z - TREK_PLATEAUS.trailhead.z));
    const underMountain = smoothstep(-158, -218, z) * trailFade;
    h = lerp(h, -3.2, underMountain);
  }

  // Flatten spawn plaza and landmark terraces smoothly
  const flatAnchors: Array<{ x: number; z: number; radius: number; targetY: number }> = [
    { x: SPAWN_POSITION.x, z: SPAWN_POSITION.z, radius: 16, targetY: 0.15 },
    ...LANDMARKS.filter((lm) => lm.id !== 'boudhanath-stupa' && lm.id !== 'pumdikot-shiva').map((lm) => ({
      x: lm.position.x,
      z: lm.position.z,
      radius: lm.id === 'janaki-mandir' ? 58 : lm.id === 'lumbini-buddha' ? 92 : 18,
      targetY:
        lm.id === 'recruiter-beacon'
          ? 0.75
          : lm.id === 'janaki-mandir' || lm.id === 'lumbini-buddha' || lm.id === 'kathmandu-stupa'
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

  // Level entire expanded Lumbini Sacred Garden + Peace Canal Parkland + perimeter roads (-384..-204, z: 16..182)
  const lumbini = LANDMARKS.find((l) => l.id === 'lumbini-buddha');
  if (lumbini) {
    const ldx = x - lumbini.position.x;
    const ldz = z - lumbini.position.z;
    const parkOutX = ldx < -104.0 ? -104.0 - ldx : ldx > 76.0 ? ldx - 76.0 : 0;
    const parkOutZ = ldz < -80.0 ? -80.0 - ldz : ldz > 86.0 ? ldz - 86.0 : 0;
    const parkDist = Math.hypot(parkOutX, parkOutZ);
    if (parkDist < 28) {
      const pBlend = 1 - smoothstep(0, 28, parkDist);
      h = lerp(h, 0.25, pBlend);
    }

    // Carve Lumbini Central Reflection Peace Canal running North-South inside the expanded West Lawn
    if (
      x >= LUMBINI_PEACE_CANAL.minX - 2.2 &&
      x <= LUMBINI_PEACE_CANAL.maxX + 2.2 &&
      z >= LUMBINI_PEACE_CANAL.minZ - 2.2 &&
      z <= LUMBINI_PEACE_CANAL.maxZ + 2.2
    ) {
      const cx = Math.max(0, Math.abs(x - LUMBINI_PEACE_CANAL.centerX) - 5.2);
      const cz = Math.max(0, Math.abs(z - 100.0) - 55.2);
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

    // Carve surrounding Sacred Garden Reflecting Pond moat around the 88m x 96m garden island
    if (isInLumbiniSurroundingPond(x, z)) {
      const p = LUMBINI_SACRED_POND;
      const distFromInner = Math.max(
        p.innerMinX - x,
        x - p.innerMaxX,
        p.innerMinZ - z,
        z - p.innerMaxZ,
      );
      const distFromOuter = Math.min(
        x - p.outerMinX,
        p.outerMaxX - x,
        z - p.outerMinZ,
        p.outerMaxZ - z,
      );
      const bankDist = Math.max(0, Math.min(distFromInner, distFromOuter));
      const carve = smoothstep(0, 0.9, bankDist);
      h = lerp(0.25, -0.90, carve);
    } else if (isOnLumbiniBridgeAbutmentPier(x, z)) {
      h = 0.34;
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

  // Level entire Pashupatinath Temple Complex parkland, approach avenues & Sleshmantak edge at y = 0.25m
  const pashupati = LANDMARKS.find((l) => l.id === 'kathmandu-stupa');
  if (pashupati) {
    const pOutX = x < -102.0 ? -102.0 - x : x > 80.0 ? x - 80.0 : 0;
    const pOutZ = z < 222.0 ? 222.0 - z : z > 378.0 ? z - 378.0 : 0;
    const pashDist = Math.hypot(pOutX, pOutZ);
    if (pashDist < 28) {
      const pBlend = 1 - smoothstep(0, 28, pashDist);
      h = lerp(h, 0.25, pBlend);
    }
  }

  // Carve Fewa / Tilicho turquoise glacial alpine lake basin in the NW foothills
  const distToLake = Math.hypot(x - GLACIAL_LAKE.x, z - GLACIAL_LAKE.z);
  if (distToLake < GLACIAL_LAKE.basinRadius) {
    const lakeBlend = 1 - smoothstep(GLACIAL_LAKE.waterRadius * 0.68, GLACIAL_LAKE.basinRadius, distToLake);
    h = lerp(h, -1.85, lakeBlend);
  }

  // Carve serene mountain river channel winding through the valley south of Sagarmatha Trek Peak spring
  const riverCenterX = getRiverCenterX(z);
  const distToRiver = Math.abs(x - riverCenterX);
  if (z >= -156 && distToRiver < 8.4) {
    const bankBlend = 1 - smoothstep(3.2, 8.4, distToRiver);
    h = lerp(h, -1.85, bankBlend);
  }

  // Carve monumental 108m x 124m Pashupatinath courtyard, Bagmati River channel, and East Bank Pandra Shivalaya
  h = carvePashupatinathGround(x, z, h);
  h = carveBoudhanathGround(x, z, h);
  h = carvePumdikotGround(x, z, h);

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
export function getSurfaceHeightAt(x: number, z: number, refY = 0): number {
  const base = groundHeightAt(x, z);
  if (isOnBridgeDeck(x, z) || isOnLumbiniCanalBridge(x, z)) {
    return base + 0.02;
  }
  if (isOnLumbiniSacredBridge(x, z)) {
    return base;
  }

  let surfaceY = base;

  if (refY >= 2.2 || (z <= -139 && isInsideTrekMountainFootprint(x, z, refY))) {
    const trekY = getTrekSurfaceHeightAt(x, z, refY);
    if (trekY !== null) {
      return trekY;
    }
  }

  const pashupatiY = getPashupatinathSurfaceY(x, z);
  if (pashupatiY !== null) {
    return pashupatiY;
  }
  const boudhaY = getBoudhanathSurfaceY(x, z);
  if (boudhaY !== null) {
    return boudhaY;
  }
  const pumdikotY = getPumdikotSurfaceY(x, z, refY);
  if (pumdikotY !== null) {
    return pumdikotY;
  }

  // Raised circular stone plaza aprons at Spawn & small non-precinct landmarks
  if (Math.hypot(x - SPAWN_POSITION.x, z - SPAWN_POSITION.z) <= 7.45) {
    surfaceY = Math.max(surfaceY, groundHeightAt(SPAWN_POSITION.x, SPAWN_POSITION.z) + 0.105);
  }
  for (const lm of LANDMARKS) {
    if (
      lm.id === 'janaki-mandir' ||
      lm.id === 'lumbini-buddha' ||
      lm.id === 'kathmandu-stupa' ||
      lm.id === 'boudhanath-stupa' ||
      lm.id === 'pumdikot-shiva'
    ) {
      continue;
    }
    const r = 7.05;
    if (Math.hypot(x - lm.position.x, z - lm.position.z) <= r) {
      surfaceY = Math.max(surfaceY, groundHeightAt(lm.position.x, lm.position.z) + 0.105);
    }
  }

  // Lumbini 88m x 96m Sacred Garden lawns, red-brick paths, Maya Devi South ramp, interior boardwalk & outer pond promenade
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
          (ldx >= -8.5 && ldx <= -3.2 && ldz >= 6.0 && ldz <= 28.0) ||
          (Math.abs(ldx) <= 5.8 && ldz >= -10.0 && ldz <= 2.0) ||
          (ldz >= 2.0 && ldz <= 6.0) ||
          (Math.abs(ldx) <= 3.4 && ldz >= -2.5 && ldz <= 2.0) ||
          (ldx >= -22.4 && ldx <= -19.2 && ldz >= -42.5 && ldz <= 30.8) ||
          (ldx >= 24.2 && ldx <= 27.2 && ldz >= -42.5 && ldz <= 30.8) ||
          (ldx >= -19.2 && ldx <= 27.2 && ldz >= 27.2 && ldz <= 30.8) ||
          (ldx >= -22.4 && ldx <= 27.2 && ldz >= -42.5 && ldz <= -38.5) ||
          (Math.abs(ldx) <= 3.4 && ldz >= -44.4 && ldz <= -42.5) ||
          (ldx >= -27.0 && ldx <= -22.4 && ldz >= -22.8 && ldz <= -19.2) ||
          (Math.abs(ldx) <= 20.4 && ldz >= -36.8 && ldz <= -34.2) ||
          (ldx >= -27.5 && ldx <= -8.5 && ldz >= 37.2 && ldz <= 40.8) ||
          (ldx >= -19.2 && ldx <= -8.5 && ldz >= 28.8 && ldz <= 32.6) ||
          (ldx >= -25.6 && ldx <= -22.4 && ldz >= 14.8 && ldz <= 18.2) ||
          (ldx >= 27.2 && ldx <= 32.4 && ldz >= 22.4 && ldz <= 25.6) ||
          (ldx >= 27.2 && ldx <= 30.0 && ldz >= -23.8 && ldz <= -20.2);
        surfaceY = Math.max(surfaceY, onBrickWalk ? 0.35 : 0.28);
      }
    } else if (!isInLumbiniSurroundingPond(x, z)) {
      const onOuterGateAvenue =
        (Math.abs(ldx) <= 3.65 && ldz >= 60.0 && ldz <= LUMBINI_FENCE_BOUNDS.localMaxZ + 0.85) ||
        (Math.abs(ldx) <= 3.65 && ldz >= LUMBINI_FENCE_BOUNDS.localMinZ - 0.85 && ldz <= -52.0) ||
        (ldx >= 50.0 && ldx <= LUMBINI_FENCE_BOUNDS.localMaxX + 0.85 && ldz >= 1.15 && ldz <= 6.85);
      const onPondCoping =
        x >= LUMBINI_SACRED_POND.outerMinX - 0.65 &&
        x <= LUMBINI_SACRED_POND.outerMaxX + 0.65 &&
        z >= LUMBINI_SACRED_POND.outerMinZ - 0.65 &&
        z <= LUMBINI_SACRED_POND.outerMaxZ + 0.65;
      if (onOuterGateAvenue) {
        surfaceY = Math.max(surfaceY, 0.35);
      } else if (onPondCoping) {
        surfaceY = Math.max(surfaceY, 0.34);
      }
    }
  }

  // Expanded Western Peace Lawn: West-Gate-to-Canal Axial Walk & Peace Canal stone coping rims
  const onWestCanalAxisWalk =
    x >= LUMBINI_FENCE_BOUNDS.minX - 0.85 &&
    x <= LUMBINI_SACRED_POND.outerMinX + 0.2 &&
    Math.abs(z - LUMBINI_PEACE_CANAL.bridgeCenterZ) <= 2.68;
  const onCanalCoping =
    z >= LUMBINI_PEACE_CANAL.minZ - 0.6 &&
    z <= LUMBINI_PEACE_CANAL.maxZ + 0.6 &&
    ((x >= LUMBINI_PEACE_CANAL.maxX - 0.1 && x <= LUMBINI_PEACE_CANAL.maxX + 0.85) ||
      (x >= LUMBINI_PEACE_CANAL.minX - 0.85 && x <= LUMBINI_PEACE_CANAL.minX + 0.1));
  if (onWestCanalAxisWalk) {
    surfaceY = Math.max(surfaceY, 0.35);
  } else if (onCanalCoping) {
    surfaceY = Math.max(surfaceY, 0.34);
  }

  // Raised level cobblestone road decks outside Janaki Chowk & Lumbini Precinct
  const inJanakiChowk = x >= -131.0 && x <= -53.5 && z >= 70.0 && z <= 150.2;
  const inLumbiniPrecinct =
    x >= LUMBINI_FENCE_BOUNDS.minX - 0.5 &&
    x <= LUMBINI_FENCE_BOUNDS.maxX + 0.5 &&
    z >= LUMBINI_FENCE_BOUNDS.minZ - 0.5 &&
    z <= LUMBINI_FENCE_BOUNDS.maxZ + 0.5;
  if (!inJanakiChowk && !inLumbiniPrecinct && !isInBoudhaPrecinct(x, z) && !isInPumdikotPrecinct(x, z)) {
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
export function isWalkablePosition(x: number, z: number, refY = 0): boolean {
  if (refY >= 2.2 || (z <= -140 && isInsideTrekMountainFootprint(x, z, refY))) {
    return isTrekPositionWalkable(x, z, refY);
  }
  if (Math.hypot(x, z) > WORLD_RADIUS - 3.0) return false;
  if (isOnBridgeDeck(x, z)) {
    // Bridge end truss pylons flanking the deck entry at ±3.2m
    const onPylonX =
      Math.abs(x - BRIDGE_BOUNDS.minX) < 0.7 || Math.abs(x - BRIDGE_BOUNDS.maxX) < 0.7;
    if (onPylonX && Math.abs(z - BRIDGE_BOUNDS.centerZ) >= 2.8) return false;
    return true;
  }
  if (isOnPashupatiBagmatiBridge(x, z)) {
    if (Math.abs(z - PASHUPATI_COMPLEX.bridgeCenterZ) > PASHUPATI_COMPLEX.bridgeHalfZ - 0.35) {
      return false;
    }
    return true;
  }
  if (isOnLumbiniCanalBridge(x, z)) {
    // Arched Maitri Peace Bridge balustrade edge rails block side plunge while keeping ±2.25m deck open
    if (Math.abs(z - LUMBINI_PEACE_CANAL.bridgeCenterZ) >= 2.28) return false;
    return true;
  }
  if (isOnLumbiniSacredBridge(x, z)) {
    const ldx = x - LUMBINI_SACRED_POND.centerX;
    const ldz = z - LUMBINI_SACRED_POND.centerZ;
    // Block parapet side balusters while keeping wide central pilgrim bridge decks open
    if ((ldz > 52.0 || ldz < -44.0) && Math.abs(ldx) >= 3.05) return false;
    if ((ldx > 44.0 || ldx < -44.0) && Math.abs(ldz - 4.0) >= 2.45) return false;
    return true;
  }
  if (isInLumbiniSurroundingPond(x, z)) {
    return false;
  }
  if (
    x >= LUMBINI_PEACE_CANAL.minX - 0.65 &&
    x <= LUMBINI_PEACE_CANAL.maxX + 0.65 &&
    z >= LUMBINI_PEACE_CANAL.minZ - 0.65 &&
    z <= LUMBINI_PEACE_CANAL.maxZ + 0.65
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

  if (!isPashupatinathWalkable(x, z)) return false;
  if (!isBoudhanathWalkable(x, z)) return false;
  if (!isPumdikotWalkable(x, z, refY)) return false;

  // Non-precinct landmark masonry bases, columns, sculptures & signposts (approachOffset points stay clear)
  for (const lm of LANDMARKS) {
    if (
      lm.id === 'janaki-mandir' ||
      lm.id === 'lumbini-buddha' ||
      lm.id === 'kathmandu-stupa' ||
      lm.id === 'boudhanath-stupa' ||
      lm.id === 'pumdikot-shiva'
    ) {
      continue;
    }
    const dx = x - lm.position.x;
    const dz = z - lm.position.z;
    if (Math.hypot(dx, dz) > 12.0) continue;

    switch (lm.id) {
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

  // Monumental Lumbini Maya Devi Temple, Sacred Pond, Peace Canal & Expanded Heritage Perimeter Fence collision bounds
  const lumbiniLm = LANDMARKS.find((l) => l.id === 'lumbini-buddha');
  if (lumbiniLm) {
    const ldx = x - lumbiniLm.position.x;
    const ldz = z - lumbiniLm.position.z;
    if (ldx >= -92.0 && ldx <= 68.0 && ldz >= -70.0 && ldz <= 78.0) {
      // 1. Unified Outer Complex Heritage Perimeter Fence enclosing Temple + Sacred Pond + Peace Canal + Outer Lawns
      const fb = LUMBINI_FENCE_BOUNDS;
      if (Math.abs(ldz - fb.localMaxZ) <= 0.45 && Math.abs(ldx) >= 3.45 && ldx >= fb.localMinX - 0.5 && ldx <= fb.localMaxX + 0.5) return false;
      if (Math.abs(ldz - fb.localMinZ) <= 0.45 && Math.abs(ldx) >= 3.45 && ldx >= fb.localMinX - 0.5 && ldx <= fb.localMaxX + 0.5) return false;
      if (Math.abs(ldx - fb.localMinX) <= 0.45 && (ldz < 1.25 || ldz > 6.75) && ldz >= fb.localMinZ - 0.5 && ldz <= fb.localMaxZ + 0.5) return false;
      if (Math.abs(ldx - fb.localMaxX) <= 0.45 && (ldz < 1.25 || ldz > 6.75) && ldz >= fb.localMinZ - 0.5 && ldz <= fb.localMaxZ + 0.5) return false;

      // Outer Corner Bastions & 8 Cardinal Entrance Gate Piers
      for (const [px, pz] of [
        [fb.localMinX, fb.localMaxZ], [fb.localMaxX, fb.localMaxZ], [fb.localMinX, fb.localMinZ], [fb.localMaxX, fb.localMinZ],
        [-fb.gateXHalf, fb.localMaxZ], [fb.gateXHalf, fb.localMaxZ], [-fb.gateXHalf, fb.localMinZ], [fb.gateXHalf, fb.localMinZ],
        [fb.localMinX, fb.gateZ0], [fb.localMinX, fb.gateZ1], [fb.localMaxX, fb.gateZ0], [fb.localMaxX, fb.gateZ1],
      ] as Array<[number, number]>) {
        if (Math.abs(ldx - px) <= 0.62 && Math.abs(ldz - pz) <= 0.62) return false;
      }

      // 2. Inner South & North Dharmachakra Torana Bridgehead Piers + West/East Portal Piers
      if (Math.abs(Math.abs(ldx) - 4.12) <= 0.85 && (Math.abs(ldz - 51.8) <= 0.85 || Math.abs(ldz + 43.8) <= 0.85)) {
        return false;
      }
      if ((Math.abs(ldx + 44.0) <= 0.82 || Math.abs(ldx - 44.0) <= 0.82) && (Math.abs(ldz - 1.5) <= 0.82 || Math.abs(ldz - 6.5) <= 0.82)) {
        return false;
      }

      // 3. 2003 Maya Devi Temple (center 0, -22.0, 36m x 24m): outer walls & sunken pit blocked; South ramp, doorway & interior boardwalk loop open
      if (Math.abs(ldx) <= 18.6 && ldz >= -34.6 && ldz <= -9.4) {
        const inDoorway = Math.abs(ldx) <= 1.65 && ldz >= -12.8 && ldz <= -9.3;
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

      // 7. Myanmar Golden Pagoda (-32.2, +41.2; 16.8m stone forecourt walkable, 13.84m chamfered fence & corner fixtures blocked) & Royal Thai Marble Sanctuary (+35.0, -22.0, scaled 1.12x)
      if (
        Math.abs(ldx + 32.2) <= 7.25 &&
        Math.abs(ldz - 41.2) <= 7.25 &&
        Math.abs(ldx + 32.2) + Math.abs(ldz - 41.2) <= 12.95
      ) {
        return false;
      }
      if (Math.abs(Math.abs(ldx + 32.2) - 2.25) <= 0.72 && Math.abs(ldz - 48.46) <= 0.72) return false;
      if (Math.abs(Math.abs(ldx + 32.2) - 7.48) <= 0.48 && Math.abs(ldz - 47.92) <= 0.48) return false;
      if (Math.abs(ldx + 29.82) <= 0.42 && Math.abs(ldz - 48.92) <= 0.36) return false;
      if (
        Math.abs(ldx + 39.82) <= 0.36 &&
        (Math.abs(ldz - 45.4) <= 0.36 || Math.abs(ldz - 43.3) <= 0.36 || Math.abs(ldz - 41.2) <= 0.36)
      ) {
        return false;
      }
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
        [-13.0, 13.5, 3.0, 2.8],
        [-13.0, 20.5, 2.8, 2.6],
        [-34.5, 26.5, 3.4, 3.0],
        [35.0, 13.5, 3.2, 2.8],
        [-14.5, -38.5, 3.4, 2.8],
        [14.5, -38.5, 3.4, 2.8],
      ] as Array<[number, number, number, number]>) {
        if (Math.abs(ldx - rx) <= rw * 0.5 + 0.35 && Math.abs(ldz - rz) <= rd * 0.5 + 0.35) return false;
      }
      if (Math.abs(ldx + 13.0) <= 1.45 && Math.abs(ldz - 30.5) <= 1.45) return false;
      if (Math.abs(Math.abs(ldx) - 7.4) <= 0.78 && Math.abs(ldz - 39.0) <= 1.85) return false;
      if (Math.abs(Math.abs(ldx) - 6.8) <= 0.72 && Math.abs(ldz - 1.8) <= 1.35) return false;
      if (Math.abs(ldx - 14.0) <= 2.05 && Math.abs(ldz - 46.5) <= 0.95) return false;
      for (const [plx, plz] of [
        [-7.4, 48.5], [7.4, 48.5],
        [-7.4, 33.0], [7.4, 33.0],
        [-4.2, -1.2], [4.2, -1.2],
        [-18.0, 0.8], [22.8, 0.8],
        [-20.8, -36.5], [25.7, -36.5],
        [22.2, 26.25], [-2.2, 26.25],
        [-8.95, 17.0], [-8.95, 7.2],
        [-4.6, 72.4], [4.6, 72.4],
        [-4.6, -64.4], [4.6, -64.4],
      ] as Array<[number, number]>) {
        if (Math.hypot(ldx - plx, ldz - plz) <= 0.55) return false;
      }
      // Stone pilgrim meditation benches flanking walkways & outer gates
      for (const [bx, bz, hw, hd] of [
        [-7.6, 44.5, 0.55, 1.15],
        [7.6, 44.5, 0.55, 1.15],
        [-7.6, 11.8, 0.55, 1.15],
        [-7.6, 22.2, 0.55, 1.15],
        [-14.5, 1.3, 1.15, 0.55],
        [14.5, 1.3, 1.15, 0.55],
        [-5.8, 70.0, 0.55, 1.15],
        [5.8, 70.0, 0.55, 1.15],
      ] as Array<[number, number, number, number]>) {
        if (Math.abs(ldx - bx) <= hw && Math.abs(ldz - bz) <= hd) return false;
      }
      // (South Bridge entry steles removed)

      for (const [hx, hz, hsx, hsz] of [
        [-22.8, -9.2, 0.68, 17.5],
        [-22.8, -30.6, 0.68, 12.2],
        [-22.8, 16.6, 0.68, 19.6],
        [27.6, -16.8, 0.68, 39.2],
        [27.6, 16.6, 0.68, 19.6],
        [-33.4, 6.3, 19.8, 0.68],
        [35.6, 6.3, 15.6, 0.68],
        [-8.9, 35.1, 0.68, 7.6],
        [-8.9, 47.2, 0.68, 7.8],
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
  refY = 0,
): { x: number; z: number } {
  const dist = Math.hypot(nextX - prevX, nextZ - prevZ);
  // Instant fast-travel teleport (> 6m): validate destination directly
  if (dist > 6.0) {
    return isWalkablePosition(nextX, nextZ, refY) ? { x: nextX, z: nextZ } : { x: prevX, z: prevZ };
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
    if (isWalkablePosition(tx, tz, refY)) {
      curX = tx;
      curZ = tz;
    } else if (isWalkablePosition(tx, curZ, refY)) {
      curX = tx;
    } else if (isWalkablePosition(curX, tz, refY)) {
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
  let fogDensity = 0.0014;
  let cameraFar = 2200;
  let bloomStrength = lerp(a.bloomStrength, b.bloomStrength, t);
  let bloomRadius = lerp(a.bloomRadius, b.bloomRadius, t);
  let bloomThreshold = lerp(a.bloomThreshold, b.bloomThreshold, t);
  const emissiveScale = lerp(a.emissiveScale, b.emissiveScale, t);
  const envIntensity = lerp(a.envInt, b.envInt, t);

  if (weather === 'mist') {
    skyHorizonColor = lerpHexColor(skyHorizonColor, '#c4cdd6', 0.55);
    skyTopColor = lerpHexColor(skyTopColor, '#8293a6', 0.45);
    sunIntensity *= 0.68;
    fogDensity = 0.0056;
    cameraFar = 1650;
    bloomStrength *= 1.1;
    bloomRadius += 0.08;
  } else if (weather === 'foggy') {
    skyHorizonColor = lerpHexColor(skyHorizonColor, '#aeb6bf', 0.72);
    skyTopColor = lerpHexColor(skyTopColor, '#7a8490', 0.65);
    sunIntensity *= 0.54;
    fogDensity = 0.0092;
    cameraFar = 780;
    bloomStrength *= 1.15;
    bloomRadius += 0.14;
  } else if (weather === 'rain') {
    skyHorizonColor = lerpHexColor(skyHorizonColor, '#64707d', 0.62);
    skyTopColor = lerpHexColor(skyTopColor, '#333e4c', 0.6);
    sunIntensity *= 0.52;
    fogDensity = 0.0054;
    cameraFar = 1500;
    bloomStrength *= 1.05;
  } else if (weather === 'snow') {
    skyHorizonColor = lerpHexColor(skyHorizonColor, '#c7d1dc', 0.45);
    skyTopColor = lerpHexColor(skyTopColor, '#7b8ca2', 0.35);
    sunIntensity *= 0.74;
    fogDensity = 0.0046;
    cameraFar = 1550;
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
  // Rectangular core covering Maya Devi Sanctuary, Pushkarini Pond, Peace Canal & Expanded Perimeter Fence
  const dx = x < -374 ? -374 - x : x > -210 ? x - -210 : 0;
  const dz = z < 24 ? 24 - z : z > 176 ? z - 176 : 0;
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

export type FootstepSurfaceKind = 'stone' | 'wood' | 'grass' | 'snow' | 'ice';

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
    x: -302,
    z: 96,
    innerRadius: 74,
    outerRadius: 136,
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
    id: 'boudha-kora-grove',
    name: 'Boudhanath Kora Courtyard Park',
    x: -308,
    z: 302,
    innerRadius: 24,
    outerRadius: 72,
    birdDensity: 0.78,
    rustleDensity: 0.66,
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
    x: -180,
    z: 76,
    radiusX: 28,
    radiusZ: 34,
    falloff: 9,
  },
  {
    id: 'lumbini-western-peace-meadow',
    name: 'Lumbini Peace Parkland Meadow',
    x: -396,
    z: 112,
    radiusX: 24,
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
    x: -138,
    z: -48,
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
  'boudhanath-stupa': 10.5,
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
export function getFootstepSurfaceKind(x: number, z: number, refY = 0): FootstepSurfaceKind {
  if (refY >= 2.0 || (z <= -140 && isInsideTrekMountainFootprint(x, z, refY))) {
    const trekSurf = getTrekFootstepSurface(x, refY, z);
    if (trekSurf) return trekSurf;
  }
  if (isOnBridgeDeck(x, z)) return 'wood';
  if (isOnLumbiniCanalBridge(x, z) || isOnLumbiniSacredBridge(x, z)) return 'stone';
  if (isOnPashupatiBagmatiBridge(x, z)) return 'stone';
  const pashuY = getPashupatinathSurfaceY(x, z);
  if (pashuY !== null && x <= PASHUPATI_COMPLEX.eastBankMaxX) return 'stone';
  if (isInBoudhaHardSurface(x, z)) return 'stone';
  if (isInPumdikotHardSurface(x, z)) return 'stone';
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
        (ldx >= -8.5 && ldx <= -3.2 && ldz >= 6.0 && ldz <= 28.0) ||
        (Math.abs(ldx) <= 5.8 && ldz >= -10.0 && ldz <= 2.0) ||
        (ldz >= 2.0 && ldz <= 6.0) ||
        (Math.abs(ldx) <= 3.4 && ldz >= -2.5 && ldz <= 2.0) ||
        (ldx >= -22.4 && ldx <= -19.2 && ldz >= -42.5 && ldz <= 30.8) ||
        (ldx >= 24.2 && ldx <= 27.2 && ldz >= -42.5 && ldz <= 30.8) ||
        (ldx >= -19.2 && ldx <= 27.2 && ldz >= 27.2 && ldz <= 30.8) ||
        (ldx >= -22.4 && ldx <= 27.2 && ldz >= -42.5 && ldz <= -38.5) ||
        (Math.abs(ldx) <= 3.4 && ldz >= -44.4 && ldz <= -42.5) ||
        (ldx >= -27.0 && ldx <= -22.4 && ldz >= -22.8 && ldz <= -19.2) ||
        (Math.abs(ldx) <= 20.4 && ldz >= -36.8 && ldz <= -34.2) ||
        (ldx >= -23.85 && ldx <= -8.5 && ldz >= 39.4 && ldz <= 43.0) ||
        (ldx >= -40.6 && ldx <= -23.8 && ldz >= 32.8 && ldz <= 49.6) ||
        (ldx >= -19.2 && ldx <= -8.5 && ldz >= 28.8 && ldz <= 32.2) ||
        (ldx >= -25.6 && ldx <= -22.4 && ldz >= 14.8 && ldz <= 18.2) ||
        (ldx >= 27.2 && ldx <= 32.4 && ldz >= 22.4 && ldz <= 25.6) ||
        (ldx >= 27.2 && ldx <= 30.0 && ldz >= -23.8 && ldz <= -20.2);
      return onBrickOrRamp ? 'stone' : 'grass';
    }
    if (!isInLumbiniSurroundingPond(x, z)) {
      const onOuterGateAvenue =
        (Math.abs(ldx) <= 3.65 && ldz >= 60.0 && ldz <= LUMBINI_FENCE_BOUNDS.localMaxZ + 0.85) ||
        (Math.abs(ldx) <= 3.65 && ldz >= LUMBINI_FENCE_BOUNDS.localMinZ - 0.85 && ldz <= -52.0) ||
        (ldx >= 50.0 && ldx <= LUMBINI_FENCE_BOUNDS.localMaxX + 0.85 && ldz >= 1.15 && ldz <= 6.85);
      const onPondCoping =
        x >= LUMBINI_SACRED_POND.outerMinX - 0.65 &&
        x <= LUMBINI_SACRED_POND.outerMaxX + 0.65 &&
        z >= LUMBINI_SACRED_POND.outerMinZ - 0.65 &&
        z <= LUMBINI_SACRED_POND.outerMaxZ + 0.65;
      if (onOuterGateAvenue || onPondCoping) return 'stone';
    }
  }

  // Western Lumbini Peace Canal coping & Maitri bridge axial approach
  if (
    (x >= LUMBINI_FENCE_BOUNDS.minX - 0.85 &&
      x <= LUMBINI_SACRED_POND.outerMinX + 0.2 &&
      Math.abs(z - LUMBINI_PEACE_CANAL.bridgeCenterZ) <= 2.68) ||
    (z >= LUMBINI_PEACE_CANAL.minZ - 0.6 &&
      z <= LUMBINI_PEACE_CANAL.maxZ + 0.6 &&
      ((x >= LUMBINI_PEACE_CANAL.maxX - 0.1 && x <= LUMBINI_PEACE_CANAL.maxX + 0.85) ||
        (x >= LUMBINI_PEACE_CANAL.minX - 0.85 && x <= LUMBINI_PEACE_CANAL.minX + 0.1)))
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

  const trekAmbience = computeHimalayaTrekAmbience(x, elevation, z);
  const ridgeFactor = Math.max(
    1 - smoothstep(10, 38, dPumdikot),
    1 - smoothstep(10, 38, Math.hypot(x + 108, z + 74)),
    1 - smoothstep(24, 52, dLake),
    smoothstep(-95, -145, z) * 0.72,
    smoothstep(1.1, 3.0, elevation) * 0.58,
    trekAmbience.onMountain ? trekAmbience.windStrength : 0,
  );
  const peaceGardenFactor = Math.max(
    1 - smoothstep(14, 54, dLumbini),
    computeLumbiniBlendFactor(x, z),
  );
  const stupaSanctuaryFactor = Math.max(
    1 - smoothstep(8, 22, dKtm),
    1 - smoothstep(18, 64, dBoudha),
  );
  const riverFactor = elevation > 8 ? 0 : 1 - smoothstep(6, 26, dRiver);
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
    ridgeFactor * 0.78 +
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
  birdLevel *= 1 - ridgeFactor * 0.48;
  birdLevel = Math.max(0, Math.min(1, birdLevel));

  const streamLevel = Math.max(
    0,
    Math.min(
      1,
      Math.max(
        (elevation > 10 ? 0 : 1 - smoothstep(4, 24, dRiver)) * 0.95,
        (1 - smoothstep(20, 44, dLake)) * 0.85,
        nearJanakiWater,
        peaceCanalWaterFactor,
        trekAmbience.waterfallGain * 0.98,
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

export type LumbiniSpatialEmitterKind =
  | 'bird-canopy'
  | 'bird-dove'
  | 'bird-pond'
  | 'leaf-rustle';

export type LumbiniEmitterSpeciesHint =
  | 'bulbul'
  | 'parakeet'
  | 'dove'
  | 'pipal-tree'
  | 'garden-hedge';

export interface LumbiniSpatialEmitterSpec {
  id: string;
  kind: LumbiniSpatialEmitterKind;
  label: string;
  x: number;
  y: number;
  z: number;
  refDistance: number;
  maxDistance: number;
  baseWeight: number;
  speciesHint: LumbiniEmitterSpeciesHint;
}

/**
 * Localized 3D ambient sound emitters anchored directly to real Lumbini Sacred Garden
 * landmarks: Sacred Bodhi (Pipal) Tree Chautara, Pushkarini Pond banks, Maya Devi
 * clerestory doves, Torana gateways, Royal Thai grove, Peace Canal shoreline, and trimmed garden hedges.
 */
export const LUMBINI_SPATIAL_AUDIO_EMITTERS: LumbiniSpatialEmitterSpec[] = [
  // Sacred Bodhi Tree Canopy & Pipal Foliage (-280 - 29.0, y, 96 + 16.5)
  {
    id: 'lumbini-bodhi-birds',
    kind: 'bird-canopy',
    label: 'Sacred Bodhi Canopy Birds',
    x: -309.0,
    y: 7.2,
    z: 112.5,
    refDistance: 6.5,
    maxDistance: 58,
    baseWeight: 1.0,
    speciesHint: 'parakeet',
  },
  {
    id: 'lumbini-bodhi-leaves',
    kind: 'leaf-rustle',
    label: 'Sacred Bodhi Pipal Leaves',
    x: -309.0,
    y: 5.8,
    z: 112.5,
    refDistance: 6.0,
    maxDistance: 46,
    baseWeight: 1.0,
    speciesHint: 'pipal-tree',
  },
  // Pushkarini Sacred Pond Ghat Birds (-280 + 10.5, y, 96 + 16.5)
  {
    id: 'lumbini-pushkarini-birds',
    kind: 'bird-pond',
    label: 'Pushkarini Pond Songbirds',
    x: -269.5,
    y: 2.8,
    z: 112.5,
    refDistance: 6.5,
    maxDistance: 54,
    baseWeight: 0.92,
    speciesHint: 'bulbul',
  },
  // South Torana & Baby Buddha Forecourt Doves (-280, y, 96 + 51.8)
  {
    id: 'lumbini-torana-doves',
    kind: 'bird-dove',
    label: 'South Torana Temple Doves',
    x: -280.0,
    y: 6.2,
    z: 147.8,
    refDistance: 6.5,
    maxDistance: 56,
    baseWeight: 0.9,
    speciesHint: 'dove',
  },
  // Maya Devi Temple Rooftop & North Lawn Doves (-280, y, 96 - 22.0)
  {
    id: 'lumbini-mayadevi-doves',
    kind: 'bird-dove',
    label: 'Maya Devi Sanctuary Doves',
    x: -280.0,
    y: 7.4,
    z: 74.0,
    refDistance: 6.5,
    maxDistance: 54,
    baseWeight: 0.88,
    speciesHint: 'dove',
  },
  // Royal Thai Sanctuary East Grove Birds (-280 + 34.5, y, 96 - 22.0)
  {
    id: 'lumbini-thai-birds',
    kind: 'bird-canopy',
    label: 'Thai Sanctuary Songbirds',
    x: -245.5,
    y: 5.2,
    z: 74.0,
    refDistance: 6.0,
    maxDistance: 50,
    baseWeight: 0.84,
    speciesHint: 'bulbul',
  },
  // South Sacred Bridge & Surrounding Pond Songbirds (-280 - 12, y, 96 + 56)
  {
    id: 'lumbini-south-pond-birds',
    kind: 'bird-pond',
    label: 'Sacred Pond Bank Birds',
    x: -292.0,
    y: 2.6,
    z: 152.0,
    refDistance: 6.5,
    maxDistance: 52,
    baseWeight: 0.86,
    speciesHint: 'bulbul',
  },
  // Maitri Peace Canal Shoreline Birds (-348, y, 100)
  {
    id: 'lumbini-canal-birds',
    kind: 'bird-pond',
    label: 'Peace Canal Waterfront Doves',
    x: -348.0,
    y: 4.6,
    z: 100.0,
    refDistance: 7.5,
    maxDistance: 64,
    baseWeight: 0.85,
    speciesHint: 'dove',
  },
  // Trimmed Sacred Garden Hedges & Perimeter Grove Rustle Emitters
  {
    id: 'lumbini-sw-forecourt-leaves',
    kind: 'leaf-rustle',
    label: 'South-West Forecourt Hedge',
    x: -288.9,
    y: 1.0,
    z: 137.2,
    refDistance: 4.5,
    maxDistance: 34,
    baseWeight: 0.72,
    speciesHint: 'garden-hedge',
  },
  {
    id: 'lumbini-se-forecourt-leaves',
    kind: 'leaf-rustle',
    label: 'South-East Forecourt Hedge',
    x: -271.1,
    y: 1.0,
    z: 137.2,
    refDistance: 4.5,
    maxDistance: 34,
    baseWeight: 0.72,
    speciesHint: 'garden-hedge',
  },
  {
    id: 'lumbini-south-pond-leaves',
    kind: 'leaf-rustle',
    label: 'Pushkarini South-West Hedge',
    x: -296.4,
    y: 1.0,
    z: 127.2,
    refDistance: 4.5,
    maxDistance: 34,
    baseWeight: 0.76,
    speciesHint: 'garden-hedge',
  },
  {
    id: 'lumbini-se-pond-leaves',
    kind: 'leaf-rustle',
    label: 'Pushkarini South-East Hedge',
    x: -263.6,
    y: 1.0,
    z: 127.2,
    refDistance: 4.5,
    maxDistance: 34,
    baseWeight: 0.74,
    speciesHint: 'garden-hedge',
  },
  {
    id: 'lumbini-nw-ashoka-leaves',
    kind: 'leaf-rustle',
    label: 'Ashoka Grove West Hedge',
    x: -302.8,
    y: 1.2,
    z: 76.8,
    refDistance: 4.8,
    maxDistance: 36,
    baseWeight: 0.78,
    speciesHint: 'garden-hedge',
  },
  {
    id: 'lumbini-ne-thai-leaves',
    kind: 'leaf-rustle',
    label: 'Thai Court East Hedge',
    x: -252.4,
    y: 1.3,
    z: 79.2,
    refDistance: 4.8,
    maxDistance: 36,
    baseWeight: 0.76,
    speciesHint: 'garden-hedge',
  },
  {
    id: 'lumbini-se-flame-leaves',
    kind: 'leaf-rustle',
    label: 'Peace Flame East Hedge',
    x: -252.4,
    y: 1.2,
    z: 112.6,
    refDistance: 4.8,
    maxDistance: 36,
    baseWeight: 0.76,
    speciesHint: 'garden-hedge',
  },
  {
    id: 'lumbini-west-park-leaves',
    kind: 'leaf-rustle',
    label: 'Western Peace Parkland Trees',
    x: -361.0,
    y: 3.0,
    z: 100.0,
    refDistance: 6.0,
    maxDistance: 48,
    baseWeight: 0.85,
    speciesHint: 'pipal-tree',
  },
];

export interface SpatialEmitterPanGain {
  emitter: LumbiniSpatialEmitterSpec;
  distance: number;
  distanceGain: number;
  pan: number;
  weight: number;
}

export interface LumbiniSpatialAudioState {
  inZone: boolean;
  zoneFactor: number;
  birdActivity: number;
  leafRustleActivity: number;
  birdIntervalMinSec: number;
  birdIntervalMaxSec: number;
  rustleIntervalMinSec: number;
  rustleIntervalMaxSec: number;
  activeBirdEmitters: SpatialEmitterPanGain[];
  activeRustleEmitters: SpatialEmitterPanGain[];
  nearestBirdEmitter: SpatialEmitterPanGain | null;
  nearestRustleEmitter: SpatialEmitterPanGain | null;
}

/**
 * Computes 3D distance attenuation and signed stereo pan (-1 left .. +1 right)
 * relative to a listener's horizontal look forward vector (forwardX, forwardZ).
 */
export function computeSpatialEmitterPanGain(
  listenerX: number,
  listenerY: number,
  listenerZ: number,
  forwardX: number,
  forwardZ: number,
  emitter: LumbiniSpatialEmitterSpec,
): SpatialEmitterPanGain {
  const dx = emitter.x - listenerX;
  const dy = emitter.y - listenerY;
  const dz = emitter.z - listenerZ;
  const distance = Math.hypot(dx, dy, dz);

  if (distance >= emitter.maxDistance) {
    return {
      emitter,
      distance,
      distanceGain: 0,
      pan: 0,
      weight: 0,
    };
  }

  const inv =
    emitter.refDistance /
    (emitter.refDistance + Math.max(0, distance - emitter.refDistance) * 0.88);
  const edgeFade = 1 - smoothstep(emitter.maxDistance * 0.68, emitter.maxDistance, distance);
  const distanceGain = Math.max(0, Math.min(1, inv * edgeFade));

  const fLen = Math.hypot(forwardX, forwardZ);
  const fx = fLen > 1e-4 ? forwardX / fLen : 0;
  const fz = fLen > 1e-4 ? forwardZ / fLen : -1;
  // Right vector = forward x up(0,1,0) = (-fz, fx)
  const rightX = -fz;
  const rightZ = fx;

  const horizDist = Math.hypot(dx, dz);
  let pan = 0;
  if (horizDist > 0.1) {
    pan = Math.max(-1, Math.min(1, (dx / horizDist) * rightX + (dz / horizDist) * rightZ));
  }

  return {
    emitter,
    distance,
    distanceGain,
    pan,
    weight: distanceGain * emitter.baseWeight,
  };
}

/**
 * Evaluates active localized bird-chirp & leaf-rustle emitters, weights, and cadence
 * inside Lumbini Sacred Garden based on listener 3D pose, ambience preset, weather, and wind.
 */
export function computeLumbiniSpatialAudioState(
  listenerX: number,
  listenerY: number,
  listenerZ: number,
  forwardX: number,
  forwardZ: number,
  windLevel: number,
  preset: LumbiniAmbiencePreset = 'sanctuary-auto',
  weather: WeatherKind = 'clear',
): LumbiniSpatialAudioState {
  const lumbiniFactor = computeLumbiniBlendFactor(listenerX, listenerZ);
  const dGarden = Math.hypot(listenerX - LUMBINI_SACRED_POND.centerX, listenerZ - LUMBINI_SACRED_POND.centerZ);
  const precinctFactor = Math.max(lumbiniFactor, 1 - smoothstep(48, 86, dGarden));
  const inZone = precinctFactor > 0.08;

  if (!inZone) {
    return {
      inZone: false,
      zoneFactor: 0,
      birdActivity: 0,
      leafRustleActivity: 0,
      birdIntervalMinSec: 6.0,
      birdIntervalMaxSec: 10.0,
      rustleIntervalMinSec: 6.0,
      rustleIntervalMaxSec: 11.0,
      activeBirdEmitters: [],
      activeRustleEmitters: [],
      nearestBirdEmitter: null,
      nearestRustleEmitter: null,
    };
  }

  let birdPresetScale = 0.85;
  let rustlePresetScale = 0.84;
  let birdMin = 1.65;
  let birdMax = 3.65;
  let rustleMin = 2.0;
  let rustleMax = 4.6;

  switch (preset) {
    case 'lotus-dawn':
      birdPresetScale = 1.0;
      rustlePresetScale = 0.88;
      birdMin = 1.15;
      birdMax = 2.65;
      rustleMin = 2.2;
      rustleMax = 4.8;
      break;
    case 'bodhi-zen':
      birdPresetScale = 0.92;
      rustlePresetScale = 0.96;
      birdMin = 1.45;
      birdMax = 3.2;
      rustleMin = 1.75;
      rustleMax = 4.1;
      break;
    case 'butter-lamp-dusk':
      birdPresetScale = 0.64;
      rustlePresetScale = 0.82;
      birdMin = 2.15;
      birdMax = 4.4;
      rustleMin = 2.2;
      rustleMax = 4.9;
      break;
    case 'moonlight-vigil':
      birdPresetScale = 0.24;
      rustlePresetScale = 0.72;
      birdMin = 4.2;
      birdMax = 7.8;
      rustleMin = 2.6;
      rustleMax = 5.8;
      break;
    case 'sanctuary-auto':
    default:
      break;
  }

  const weatherBirdScale =
    weather === 'rain' ? 0.18 : weather === 'snow' ? 0.28 : weather === 'foggy' ? 0.68 : weather === 'mist' ? 0.85 : 1.0;
  const weatherRustleScale =
    weather === 'rain' ? 1.15 : weather === 'snow' ? 0.75 : weather === 'mist' ? 0.9 : 1.0;

  const clampedWind = Math.max(0, Math.min(1, windLevel));
  const breezeCadenceScale = Math.max(0.58, 1.15 - clampedWind * 0.45);

  const activeBirdEmitters: SpatialEmitterPanGain[] = [];
  const activeRustleEmitters: SpatialEmitterPanGain[] = [];

  for (let i = 0; i < LUMBINI_SPATIAL_AUDIO_EMITTERS.length; i++) {
    const em = LUMBINI_SPATIAL_AUDIO_EMITTERS[i];
    const evalState = computeSpatialEmitterPanGain(
      listenerX,
      listenerY,
      listenerZ,
      forwardX,
      forwardZ,
      em,
    );
    if (evalState.distanceGain <= 0.015) continue;
    if (em.kind === 'leaf-rustle') {
      activeRustleEmitters.push(evalState);
    } else {
      activeBirdEmitters.push(evalState);
    }
  }

  activeBirdEmitters.sort((a, b) => b.weight - a.weight);
  activeRustleEmitters.sort((a, b) => b.weight - a.weight);

  const nearestBirdEmitter = activeBirdEmitters[0] ?? null;
  const nearestRustleEmitter = activeRustleEmitters[0] ?? null;

  const birdPeak = nearestBirdEmitter ? Math.min(1, nearestBirdEmitter.distanceGain * 1.12) : 0;
  const rustlePeak = nearestRustleEmitter ? Math.min(1, nearestRustleEmitter.distanceGain * 1.12) : 0;

  const birdActivity = Math.max(
    0,
    Math.min(1, precinctFactor * birdPresetScale * weatherBirdScale * (0.45 + birdPeak * 0.55)),
  );
  const leafRustleActivity = Math.max(
    0,
    Math.min(
      1,
      precinctFactor *
        rustlePresetScale *
        weatherRustleScale *
        (0.45 + clampedWind * 0.55) *
        (0.42 + rustlePeak * 0.58),
    ),
  );

  return {
    inZone,
    zoneFactor: precinctFactor,
    birdActivity,
    leafRustleActivity,
    birdIntervalMinSec: birdMin / Math.max(0.45, weatherBirdScale),
    birdIntervalMaxSec: birdMax / Math.max(0.45, weatherBirdScale),
    rustleIntervalMinSec: rustleMin * breezeCadenceScale,
    rustleIntervalMaxSec: rustleMax * breezeCadenceScale,
    activeBirdEmitters,
    activeRustleEmitters,
    nearestBirdEmitter,
    nearestRustleEmitter,
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

function createMulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type LotusFlowerStage = 'full-bloom' | 'half-bloom' | 'bud' | 'pad-only';
export type LotusHueVariant = 'sakura-pink' | 'rose-magenta' | 'ivory-white';

export interface LotusFlowerPlacement {
  id: number;
  pond: 'surrounding' | 'pushkarini';
  x: number;
  y: number;
  z: number;
  padRadius: number;
  bloomScale: number;
  rotY: number;
  padTiltX: number;
  padTiltZ: number;
  stage: LotusFlowerStage;
  hueVariant: LotusHueVariant;
  phase: number;
}

function isSafeSurroundingLotusSpot(x: number, z: number, padRadius: number): boolean {
  const p = LUMBINI_SACRED_POND;
  const bankMargin = 0.65 + padRadius;
  const inOuter =
    x >= p.outerMinX + bankMargin &&
    x <= p.outerMaxX - bankMargin &&
    z >= p.outerMinZ + bankMargin &&
    z <= p.outerMaxZ - bankMargin;
  if (!inOuter) return false;

  const inInnerCleared =
    x > p.innerMinX - bankMargin &&
    x < p.innerMaxX + bankMargin &&
    z > p.innerMinZ - bankMargin &&
    z < p.innerMaxZ + bankMargin;
  if (inInnerCleared) return false;

  // Keep clear of all 4 Sacred Causeway Bridges, underwater piers, and abutment piers
  if (z >= p.southBridge.minZ - 0.8 && Math.abs(x - p.centerX) <= 4.75 + padRadius) return false;
  if (z <= p.northBridge.maxZ + 0.8 && Math.abs(x - p.centerX) <= 4.75 + padRadius) return false;
  if (x >= p.eastBridge.minX - 0.8 && Math.abs(z - 100.0) <= 4.35 + padRadius) return false;
  if (x <= p.westBridge.maxX + 0.8 && Math.abs(z - 100.0) <= 4.35 + padRadius) return false;

  return isInLumbiniSurroundingPond(x, z);
}

function isSafePushkariniLotusSpot(x: number, z: number, padRadius: number): boolean {
  const p = LUMBINI_PUSHKARINI_POND;
  const margin = 0.72 + padRadius;
  if (
    x < p.minX + margin ||
    x > p.maxX - margin ||
    z < p.minZ + margin ||
    z > p.maxZ - margin
  ) {
    return false;
  }
  const dx = Math.abs(x - p.centerX);
  const dz = Math.abs(z - p.centerZ);
  // Keep North/South ritual stairs & center temple reflection lane open
  if (dx <= 3.2 && dz >= 4.0) return false;
  if (dx <= 3.6 && dz <= 2.6) return false;
  return true;
}

/**
 * Generates deterministic, botanically clustered procedural lotus flowers & notched lily pads
 * across both the Lumbini Sacred Garden Surrounding Pond moat and the inner Pushkarini Sacred Pond.
 */
export function generateLumbiniPondLotusPlacements(seed = 202604): LotusFlowerPlacement[] {
  const rand = createMulberry32(seed);
  const placements: LotusFlowerPlacement[] = [];

  const pickStage = (r: number): LotusFlowerStage => {
    if (r < 0.39) return 'full-bloom';
    if (r < 0.64) return 'half-bloom';
    if (r < 0.82) return 'bud';
    return 'pad-only';
  };

  const pickHue = (r: number): LotusHueVariant => {
    if (r < 0.50) return 'sakura-pink';
    if (r < 0.78) return 'rose-magenta';
    return 'ivory-white';
  };

  const hasOverlap = (
    pond: 'surrounding' | 'pushkarini',
    x: number,
    z: number,
    padRadius: number,
  ): boolean => {
    for (let i = placements.length - 1; i >= 0; i--) {
      const other = placements[i];
      if (other.pond !== pond) continue;
      const minDist = (other.padRadius + padRadius) * 0.96;
      if (Math.hypot(other.x - x, other.z - z) < minDist) {
        return true;
      }
    }
    return false;
  };

  const expandColony = (
    pond: 'surrounding' | 'pushkarini',
    cx: number,
    cz: number,
    count: number,
    spreadX: number,
    spreadZ: number,
    waterY: number,
  ) => {
    const goldenAngle = 2.399963229728653;
    const baseAngle = rand() * Math.PI * 2;
    let attempts = 0;
    let added = 0;
    while (added < count && attempts < count * 5) {
      attempts++;
      const idx = attempts;
      const t = Math.sqrt(idx / (count + 1.2));
      const ang = baseAngle + idx * goldenAngle + (rand() - 0.5) * 0.42;
      const px = cx + Math.cos(ang) * spreadX * (0.2 + t * 0.85) + (rand() - 0.5) * 0.32;
      const pz = cz + Math.sin(ang) * spreadZ * (0.2 + t * 0.85) + (rand() - 0.5) * 0.32;
      const padRadius = 0.25 + rand() * 0.16;

      const valid =
        pond === 'surrounding'
          ? isSafeSurroundingLotusSpot(px, pz, padRadius)
          : isSafePushkariniLotusSpot(px, pz, padRadius);
      if (!valid || hasOverlap(pond, px, pz, padRadius)) continue;

      const stage = pickStage(rand());
      placements.push({
        id: placements.length,
        pond,
        x: px,
        y: waterY,
        z: pz,
        padRadius,
        bloomScale: 0.82 + rand() * 0.46,
        rotY: rand() * Math.PI * 2,
        padTiltX: (rand() - 0.5) * 0.05,
        padTiltZ: (rand() - 0.5) * 0.05,
        stage,
        hueVariant: pickHue(rand()),
        phase: rand() * Math.PI * 2,
      });
      added++;
    }
  };

  // Surrounding Sacred Pond organic colonies spanning all 4 moat channels & corner bays
  const surroundingColonies: Array<[number, number, number, number, number]> = [
    // South channel (West bay)
    [-320.5, 152.2, 10, 4.4, 2.2],
    [-308.5, 152.6, 11, 4.8, 2.2],
    [-294.0, 152.0, 10, 4.2, 2.1],
    // South channel (East bay)
    [-266.0, 152.3, 10, 4.4, 2.2],
    [-252.0, 152.6, 11, 4.8, 2.2],
    [-239.0, 152.0, 10, 4.2, 2.1],
    // North channel (West & East bays)
    [-320.0, 47.7, 9, 4.2, 2.1],
    [-305.0, 47.6, 10, 4.6, 2.1],
    [-291.5, 47.8, 9, 3.8, 2.0],
    [-267.5, 47.7, 9, 4.0, 2.0],
    [-252.5, 47.6, 10, 4.6, 2.1],
    [-238.5, 47.8, 9, 4.0, 2.0],
    // West channel (South & North arms away from West bridge z=100)
    [-327.3, 139.0, 8, 1.3, 5.2],
    [-327.2, 121.0, 8, 1.3, 5.2],
    [-327.3, 81.0, 8, 1.3, 5.2],
    [-327.2, 62.5, 8, 1.3, 5.2],
    // East channel (South & North arms away from East bridge z=100)
    [-232.7, 139.5, 8, 1.3, 5.2],
    [-232.8, 121.5, 8, 1.3, 5.2],
    [-232.7, 81.5, 8, 1.3, 5.2],
    [-232.8, 62.0, 8, 1.3, 5.2],
  ];
  for (const [cx, cz, cnt, sx, sz] of surroundingColonies) {
    expandColony('surrounding', cx, cz, cnt, sx, sz, LUMBINI_SACRED_POND.waterLevel);
  }

  // Pushkarini Sacred Pond sheltered corner & side lotus colonies
  const pushkariniColonies: Array<[number, number, number, number, number]> = [
    [-277.8, 108.4, 8, 2.2, 1.8],
    [-277.6, 116.5, 8, 2.2, 1.8],
    [-262.2, 108.5, 8, 2.2, 1.8],
    [-262.3, 116.4, 8, 2.2, 1.8],
  ];
  for (const [cx, cz, cnt, sx, sz] of pushkariniColonies) {
    expandColony('pushkarini', cx, cz, cnt, sx, sz, LUMBINI_PUSHKARINI_POND.waterLevel);
  }

  return placements;
}

export interface TrailPondRippleOrigin {
  x: number;
  z: number;
  pond: 'surrounding' | 'pushkarini';
  strength: number;
  trailZone: string;
}

/**
 * Detects when the player is wading inside the Lumbini Surrounding Sacred Pond or
 * inner Pushkarini Sacred Pond, returning the water-surface coordinate where a ripple expands.
 * Dry-ground paths, promenades, and bridges never trigger water ripples.
 */
export function findLumbiniTrailPondRippleOrigin(
  playerX: number,
  playerZ: number,
  strideIndex = 0,
): TrailPondRippleOrigin | null {
  if (isInLumbiniPushkariniPond(playerX, playerZ)) {
    const sway = Math.sin(strideIndex * 1.73) * 0.25;
    const pk = LUMBINI_PUSHKARINI_POND;
    return {
      x: Math.max(pk.minX + 0.5, Math.min(pk.maxX - 0.5, playerX + sway)),
      z: Math.max(pk.minZ + 0.5, Math.min(pk.maxZ - 0.5, playerZ + sway * 0.6)),
      pond: 'pushkarini',
      strength: 0.92,
      trailZone: 'pushkarini-wade',
    };
  }
  if (isInLumbiniSurroundingPond(playerX, playerZ)) {
    const sway = Math.sin(strideIndex * 1.73) * 0.25;
    return {
      x: playerX + sway,
      z: playerZ + sway * 0.6,
      pond: 'surrounding',
      strength: 0.92,
      trailZone: 'surrounding-wade',
    };
  }
  return null;
}

export type WeatherParticleMode = 'petals' | 'rain' | 'snow' | 'mist' | 'foggy';

export interface WeatherParticleModeProfile {
  weather: WeatherKind;
  mode: WeatherParticleMode;
  activeRatio: number;
  opacity: number;
  baseSize: number;
  fallSpeed: number;
  windDriftX: number;
  windDriftZ: number;
  turbulence: number;
  tumbleSpeed: number;
  stretch: number;
  primaryColorHex: string;
  secondaryColorHex: string;
}

/**
 * Computes the dedicated 3D scene weather particle system configuration from activeWeather:
 * - 'clear' -> falling cherry blossom petals across the valley
 * - 'rain'  -> wind-slanted falling raindrops
 * - 'snow'  -> gentle light snow flakes
 * - 'mist' / 'foggy' -> drifting valley mist motes
 */
export function computeWeatherParticleModeProfile(
  weather: WeatherKind,
): WeatherParticleModeProfile {
  switch (weather) {
    case 'rain':
      return {
        weather: 'rain',
        mode: 'rain',
        activeRatio: 1.0,
        opacity: 0.84,
        baseSize: 335,
        fallSpeed: 19.5,
        windDriftX: 3.4,
        windDriftZ: 1.15,
        turbulence: 0.14,
        tumbleSpeed: 0,
        stretch: 1.0,
        primaryColorHex: '#e0f2fe',
        secondaryColorHex: '#93c5fd',
      };
    case 'snow':
      return {
        weather: 'snow',
        mode: 'snow',
        activeRatio: 0.56,
        opacity: 0.82,
        baseSize: 136,
        fallSpeed: 1.82,
        windDriftX: 1.08,
        windDriftZ: 0.52,
        turbulence: 1.72,
        tumbleSpeed: 0.85,
        stretch: 0,
        primaryColorHex: '#ffffff',
        secondaryColorHex: '#dbeafe',
      };
    case 'mist':
      return {
        weather: 'mist',
        mode: 'mist',
        activeRatio: 0.24,
        opacity: 0.34,
        baseSize: 122,
        fallSpeed: 0.46,
        windDriftX: 1.65,
        windDriftZ: 0.65,
        turbulence: 1.15,
        tumbleSpeed: 0.45,
        stretch: 0,
        primaryColorHex: '#e2e8f0',
        secondaryColorHex: '#cbd5e1',
      };
    case 'foggy':
      return {
        weather: 'foggy',
        mode: 'foggy',
        activeRatio: 0.3,
        opacity: 0.32,
        baseSize: 145,
        fallSpeed: 0.22,
        windDriftX: 0.92,
        windDriftZ: 0.4,
        turbulence: 1.25,
        tumbleSpeed: 0.3,
        stretch: 0,
        primaryColorHex: '#d1d5db',
        secondaryColorHex: '#9ca3af',
      };
    case 'clear':
    default:
      return {
        weather: 'clear',
        mode: 'petals',
        activeRatio: 0.44,
        opacity: 0.9,
        baseSize: 148,
        fallSpeed: 1.38,
        windDriftX: 1.15,
        windDriftZ: 0.58,
        turbulence: 1.55,
        tumbleSpeed: 2.3,
        stretch: 0,
        primaryColorHex: '#fff1f2',
        secondaryColorHex: '#f472b6',
      };
  }
}

export interface LumbiniFireflyPlacement {
  id: number;
  pond: 'pushkarini' | 'surrounding';
  x: number;
  y: number;
  z: number;
  phase: number;
  speed: number;
  scale: number;
  warmShift: number;
}

/**
 * Computes bioluminescent firefly visibility [0..1] near the Lumbini ponds
 * during nighttime presets ('night', 'moonlight-vigil') and night/dusk hours.
 */
export function computeLumbiniFireflyIntensity(
  timePreset: TimePreset,
  effectiveHour: number,
  lumbiniPreset: LumbiniAmbiencePreset = 'sanctuary-auto',
  weather: WeatherKind = 'clear',
  phaseLabel?: TimeLightingState['phaseLabel'],
): number {
  const hour = ((effectiveHour % 24) + 24) % 24;
  let nightFactor = 0;

  if (timePreset === 'night' || lumbiniPreset === 'moonlight-vigil' || phaseLabel === 'Night') {
    nightFactor = 1.0;
  } else if (hour >= 19.2 || hour < 5.2) {
    nightFactor = 1.0;
  } else if (hour >= 17.4 && hour < 19.2) {
    nightFactor = 0.18 + 0.82 * smoothstep(17.4, 19.2, hour);
  } else if (hour >= 5.2 && hour < 6.4) {
    nightFactor = 1.0 - smoothstep(5.2, 6.4, hour);
  }

  if (nightFactor <= 0.005) return 0;

  const weatherScale =
    weather === 'rain'
      ? 0.28
      : weather === 'snow'
        ? 0.24
        : weather === 'foggy'
          ? 0.72
          : weather === 'mist'
            ? 0.86
            : 1.0;

  return Math.max(0, Math.min(1, nightFactor * weatherScale));
}

/**
 * Generates deterministic bioluminescent firefly placements hovering above
 * the Lumbini Pushkarini Sacred Pond and the Surrounding Sacred Pond moat.
 */
export function generateLumbiniFireflyPlacements(
  count = 260,
  seed = 202611,
): LumbiniFireflyPlacement[] {
  const rand = createMulberry32(seed);
  const out: LumbiniFireflyPlacement[] = [];
  const pk = LUMBINI_PUSHKARINI_POND;
  const sp = LUMBINI_SACRED_POND;

  const pushkariniTarget = Math.round(count * 0.36);

  for (let i = 0; i < pushkariniTarget; i++) {
    const x = lerp(pk.minX - 0.6, pk.maxX + 0.6, rand());
    const z = lerp(pk.minZ - 0.6, pk.maxZ + 0.6, rand());
    out.push({
      id: out.length,
      pond: 'pushkarini',
      x,
      y: pk.waterLevel + 0.35 + rand() * 2.05,
      z,
      phase: rand() * Math.PI * 2,
      speed: 0.42 + rand() * 0.65,
      scale: 0.75 + rand() * 0.65,
      warmShift: rand(),
    });
  }

  // Distribute surrounding pond fireflies across all 4 moat channels with generous presence near the South bridge & promenade
  const channels: Array<{ minX: number; maxX: number; minZ: number; maxZ: number; weight: number }> = [
    // South channel (in front of Lumbini approach & flanking South Sacred Bridge)
    { minX: sp.outerMinX + 2, maxX: sp.outerMaxX - 2, minZ: sp.innerMaxZ - 0.3, maxZ: sp.outerMaxZ + 0.4, weight: 0.42 },
    // West channel
    { minX: sp.outerMinX - 0.3, maxX: sp.innerMinX + 0.3, minZ: sp.outerMinZ + 4, maxZ: sp.outerMaxZ - 4, weight: 0.2 },
    // East channel
    { minX: sp.innerMaxX - 0.3, maxX: sp.outerMaxX + 0.3, minZ: sp.outerMinZ + 4, maxZ: sp.outerMaxZ - 4, weight: 0.2 },
    // North channel
    { minX: sp.outerMinX + 2, maxX: sp.outerMaxX - 2, minZ: sp.outerMinZ - 0.3, maxZ: sp.innerMinZ + 0.3, weight: 0.18 },
  ];

  const remaining = count - pushkariniTarget;
  for (let i = 0; i < remaining; i++) {
    let pickRoll = rand();
    let ch = channels[0];
    for (let c = 0; c < channels.length; c++) {
      pickRoll -= channels[c].weight;
      if (pickRoll <= 0) {
        ch = channels[c];
        break;
      }
    }
    const x = lerp(ch.minX, ch.maxX, rand());
    const z = lerp(ch.minZ, ch.maxZ, rand());
    out.push({
      id: out.length,
      pond: 'surrounding',
      x,
      y: sp.waterLevel + 0.32 + rand() * 2.25,
      z,
      phase: rand() * Math.PI * 2,
      speed: 0.38 + rand() * 0.72,
      scale: 0.78 + rand() * 0.68,
      warmShift: rand(),
    });
  }

  return out;
}

export interface LandmarkApproachCueSpec {
  landmarkId: string;
  motifName: string;
  notesHz: number[];
  waveType: 'sine' | 'triangle';
  stepSec: number;
  noteDurSec: number;
  shimmerRatio: number;
  baseGain: number;
}

export const LANDMARK_APPROACH_CUE_SPECS: Record<string, LandmarkApproachCueSpec> = {
  'kathmandu-stupa': {
    landmarkId: 'kathmandu-stupa',
    motifName: 'Pashupati Bronze Ghanta',
    notesHz: [392.0, 523.25, 659.25],
    waveType: 'sine',
    stepSec: 0.15,
    noteDurSec: 0.95,
    shimmerRatio: 2.756,
    baseGain: 0.032,
  },
  'boudhanath-stupa': {
    landmarkId: 'boudhanath-stupa',
    motifName: 'Boudha Mandala Chime',
    notesHz: [329.63, 440.0, 587.33],
    waveType: 'sine',
    stepSec: 0.18,
    noteDurSec: 1.05,
    shimmerRatio: 2.0,
    baseGain: 0.03,
  },
  'pumdikot-shiva': {
    landmarkId: 'pumdikot-shiva',
    motifName: 'Annapurna Ridge Wind-Flute',
    notesHz: [440.0, 587.33, 880.0],
    waveType: 'sine',
    stepSec: 0.17,
    noteDurSec: 1.0,
    shimmerRatio: 2.0,
    baseGain: 0.028,
  },
  'janaki-mandir': {
    landmarkId: 'janaki-mandir',
    motifName: 'Mithila Courtyard Sitar-Bell',
    notesHz: [349.23, 440.0, 523.25, 698.46],
    waveType: 'triangle',
    stepSec: 0.12,
    noteDurSec: 0.85,
    shimmerRatio: 2.0,
    baseGain: 0.028,
  },
  'lumbini-buddha': {
    landmarkId: 'lumbini-buddha',
    motifName: 'Lumbini Lotus Sanctuary Bowl',
    notesHz: [293.66, 440.0, 587.33],
    waveType: 'sine',
    stepSec: 0.22,
    noteDurSec: 1.25,
    shimmerRatio: 2.0,
    baseGain: 0.03,
  },
  'vit-vellore-tower': {
    landmarkId: 'vit-vellore-tower',
    motifName: 'Vellore Clock Carillon',
    notesHz: [493.88, 659.25, 783.99],
    waveType: 'triangle',
    stepSec: 0.14,
    noteDurSec: 0.82,
    shimmerRatio: 2.756,
    baseGain: 0.028,
  },
  'aniflow-studio': {
    landmarkId: 'aniflow-studio',
    motifName: 'AniFlow Studio Marimba',
    notesHz: [523.25, 659.25, 783.99, 1046.5],
    waveType: 'triangle',
    stepSec: 0.1,
    noteDurSec: 0.65,
    shimmerRatio: 1.5,
    baseGain: 0.027,
  },
  'agent-infra-monolith': {
    landmarkId: 'agent-infra-monolith',
    motifName: 'Systems Citadel Harmonic Pulse',
    notesHz: [392.0, 587.33, 783.99],
    waveType: 'sine',
    stepSec: 0.12,
    noteDurSec: 0.78,
    shimmerRatio: 3.0,
    baseGain: 0.029,
  },
  'breath-sensor-lab': {
    landmarkId: 'breath-sensor-lab',
    motifName: 'Observatory Crystalline Resonance',
    notesHz: [466.16, 698.46, 932.33],
    waveType: 'sine',
    stepSec: 0.16,
    noteDurSec: 0.92,
    shimmerRatio: 2.5,
    baseGain: 0.028,
  },
  'recruiter-beacon': {
    landmarkId: 'recruiter-beacon',
    motifName: 'Summit Beacon Signal',
    notesHz: [587.33, 739.99, 880.0, 1174.66],
    waveType: 'sine',
    stepSec: 0.11,
    noteDurSec: 0.85,
    shimmerRatio: 2.0,
    baseGain: 0.03,
  },
  'himalayan-trek': {
    landmarkId: 'himalayan-trek',
    motifName: 'Sagarmatha Alpine Horn',
    notesHz: [293.66, 392.0, 587.33],
    waveType: 'sine',
    stepSec: 0.2,
    noteDurSec: 1.15,
    shimmerRatio: 2.0,
    baseGain: 0.032,
  },
};

export function getLandmarkApproachCueRadius(lm: (typeof LANDMARKS)[number]): number {
  return lm.interactRadius + 16;
}

export function computeLandmarkApproachCuePanAndGain(
  listenerX: number,
  listenerZ: number,
  forwardX: number,
  forwardZ: number,
  targetX: number,
  targetZ: number,
  cueRadius: number,
): { pan: number; distanceGain: number; distance: number } {
  const dx = targetX - listenerX;
  const dz = targetZ - listenerZ;
  const distance = Math.hypot(dx, dz);

  const fLen = Math.hypot(forwardX, forwardZ) || 1;
  const fx = forwardX / fLen;
  const fz = forwardZ / fLen;
  // Right vector in Three.js XZ (+Y up): forward x up = (-fz, fx)
  const rx = -fz;
  const rz = fx;

  let pan = 0;
  if (distance > 0.05) {
    pan = Math.max(-1, Math.min(1, (dx * rx + dz * rz) / distance));
  }

  const maxRange = Math.max(cueRadius * 1.35, 34);
  const norm = Math.max(0, Math.min(1, 1 - distance / maxRange));
  const distanceGain = Math.max(0.22, Math.min(1.0, 0.25 + norm * 0.75));

  return { pan, distanceGain, distance };
}

export interface UnexploredLandmarkApproachMatch {
  landmark: (typeof LANDMARKS)[number];
  distance: number;
  cueRadius: number;
  spec: LandmarkApproachCueSpec;
}

/**
 * Finds the closest unexplored landmark within its spatial approach cue radius
 * that has not yet been discovered or triggered for a first-time approach cue.
 */
export function findFirstUnexploredLandmarkApproach(
  x: number,
  z: number,
  discoveredIds: ReadonlySet<string> | readonly string[],
  cuedIds: ReadonlySet<string> | readonly string[],
): UnexploredLandmarkApproachMatch | null {
  const hasId = (col: ReadonlySet<string> | readonly string[], id: string) =>
    Array.isArray(col) ? col.includes(id) : (col as ReadonlySet<string>).has(id);

  let best: UnexploredLandmarkApproachMatch | null = null;
  for (let i = 0; i < LANDMARKS.length; i++) {
    const lm = LANDMARKS[i];
    if (hasId(discoveredIds, lm.id) || hasId(cuedIds, lm.id)) continue;
    const cueRadius = getLandmarkApproachCueRadius(lm);
    const distance = Math.hypot(x - lm.position.x, z - lm.position.z);
    if (distance <= cueRadius && (!best || distance < best.distance)) {
      const spec =
        LANDMARK_APPROACH_CUE_SPECS[lm.id] ?? LANDMARK_APPROACH_CUE_SPECS['recruiter-beacon'];
      best = { landmark: lm, distance, cueRadius, spec };
    }
  }
  return best;
}

export type GraphicsQualityPreset = 'high' | 'medium' | 'low';

export interface GraphicsQualityConfig {
  preset: GraphicsQualityPreset;
  label: string;
  grassRatio: number;
  shadowMapSize: 2048 | 1024 | 512;
  maxPixelRatio: number;
}

export function getGraphicsQualityConfig(preset: GraphicsQualityPreset): GraphicsQualityConfig {
  switch (preset) {
    case 'low':
      return {
        preset: 'low',
        label: 'Low',
        grassRatio: 0.25,
        shadowMapSize: 512,
        maxPixelRatio: 1,
      };
    case 'medium':
      return {
        preset: 'medium',
        label: 'Medium',
        grassRatio: 0.55,
        shadowMapSize: 1024,
        maxPixelRatio: 1.5,
      };
    case 'high':
    default:
      return {
        preset: 'high',
        label: 'High',
        grassRatio: 1.0,
        shadowMapSize: 2048,
        maxPixelRatio: 2,
      };
  }
}

export type CameraViewMode = 'third-person' | 'first-person';

/**
 * Localized 3D bird emitters anchored in non-Lumbini forest woodlands, mountain tree pockets,
 * and riverbank groves so positional bird chirping triggers dynamically in every forest area.
 */
export const WORLD_FOREST_BIRD_EMITTERS: LumbiniSpatialEmitterSpec[] = [
  {
    id: 'forest-pumdikot-west',
    kind: 'bird-canopy',
    label: 'Pumdikot Ridge Pine Canopy',
    x: -116.0,
    y: 9.2,
    z: -78.0,
    refDistance: 7.5,
    maxDistance: 56,
    baseWeight: 0.96,
    speciesHint: 'bulbul',
  },
  {
    id: 'forest-pumdikot-east',
    kind: 'bird-canopy',
    label: 'Pumdikot Cedar Woodland',
    x: -101.0,
    y: 8.6,
    z: -68.0,
    refDistance: 7.5,
    maxDistance: 56,
    baseWeight: 0.92,
    speciesHint: 'parakeet',
  },
  {
    id: 'forest-pashupati-north',
    kind: 'bird-canopy',
    label: 'Mrigasthali Woodland Canopy',
    x: -44.0,
    y: 6.4,
    z: -30.0,
    refDistance: 6.5,
    maxDistance: 50,
    baseWeight: 1.0,
    speciesHint: 'bulbul',
  },
  {
    id: 'forest-pashupati-west',
    kind: 'bird-dove',
    label: 'Pashupati Riverbank Grove',
    x: -56.0,
    y: 5.8,
    z: -16.0,
    refDistance: 6.5,
    maxDistance: 48,
    baseWeight: 0.9,
    speciesHint: 'dove',
  },
  {
    id: 'forest-boudha-grove',
    kind: 'bird-canopy',
    label: 'Boudhanath Pine & Sakura Grove',
    x: -110.0,
    y: 6.2,
    z: 4.0,
    refDistance: 6.8,
    maxDistance: 52,
    baseWeight: 0.95,
    speciesHint: 'parakeet',
  },
  {
    id: 'forest-bagmati-willows',
    kind: 'bird-pond',
    label: 'Bagmati Willow & Birch Woods',
    x: 20.0,
    y: 5.0,
    z: 42.0,
    refDistance: 6.5,
    maxDistance: 46,
    baseWeight: 0.94,
    speciesHint: 'bulbul',
  },
  {
    id: 'forest-glacial-pines',
    kind: 'bird-canopy',
    label: 'Glacial Lake Pine Ridge',
    x: -158.0,
    y: 7.2,
    z: -116.0,
    refDistance: 7.0,
    maxDistance: 52,
    baseWeight: 0.85,
    speciesHint: 'bulbul',
  },
  {
    id: 'forest-vellore-banyan',
    kind: 'bird-canopy',
    label: 'Vellore Courtyard Palms & Banyans',
    x: 56.0,
    y: 5.6,
    z: -74.0,
    refDistance: 6.5,
    maxDistance: 48,
    baseWeight: 0.84,
    speciesHint: 'parakeet',
  },
  {
    id: 'forest-sleshmantak-north',
    kind: 'bird-canopy',
    label: 'Sleshmantak Sacred Woodland (North)',
    x: 74.0,
    y: 6.8,
    z: 276.0,
    refDistance: 7.0,
    maxDistance: 56,
    baseWeight: 0.96,
    speciesHint: 'bulbul',
  },
  {
    id: 'forest-sleshmantak-south',
    kind: 'bird-dove',
    label: 'Sleshmantak Sacred Woodland (South)',
    x: 74.0,
    y: 6.2,
    z: 324.0,
    refDistance: 7.0,
    maxDistance: 56,
    baseWeight: 0.92,
    speciesHint: 'dove',
  },
];

export interface ForestBirdSpatialAudioState {
  inForest: boolean;
  forestFactor: number;
  birdActivity: number;
  intervalMinSec: number;
  intervalMaxSec: number;
  activeEmitters: SpatialEmitterPanGain[];
  nearestEmitter: SpatialEmitterPanGain | null;
}

/**
 * Computes active localized forest-bird emitters and chirp cadence across all non-Lumbini
 * woodland areas based on 3D listener pose, tree proximity, time of day, and weather.
 */
export function computeForestBirdSpatialAudioState(
  listenerX: number,
  listenerY: number,
  listenerZ: number,
  forwardX: number,
  forwardZ: number,
  windLevel: number,
  weather: WeatherKind = 'clear',
  timeHour = 10,
): ForestBirdSpatialAudioState {
  const forest = computeForestProximity(listenerX, listenerZ);
  const hour = ((timeHour % 24) + 24) % 24;
  const daylightBirdBoost =
    hour >= 5.2 && hour <= 19.4
      ? hour < 8.5 || hour > 16.8
        ? 1.0
        : 0.86
      : 0.22;
  const weatherScale =
    weather === 'rain' ? 0.16 : weather === 'snow' ? 0.25 : weather === 'foggy' ? 0.7 : weather === 'mist' ? 0.86 : 1.0;

  const activeEmitters: SpatialEmitterPanGain[] = [];
  for (let i = 0; i < WORLD_FOREST_BIRD_EMITTERS.length; i++) {
    const ev = computeSpatialEmitterPanGain(
      listenerX,
      listenerY,
      listenerZ,
      forwardX,
      forwardZ,
      WORLD_FOREST_BIRD_EMITTERS[i],
    );
    if (ev.distanceGain > 0.015) {
      activeEmitters.push(ev);
    }
  }
  activeEmitters.sort((a, b) => b.weight - a.weight);

  const nearestEmitter = activeEmitters[0] ?? null;
  const localCanopy = Math.max(forest.forestProximity, forest.birdForestBoost, nearestEmitter ? nearestEmitter.distanceGain * 0.92 : 0);
  const inForest = localCanopy > 0.12 && activeEmitters.length > 0;

  if (!inForest) {
    return {
      inForest: false,
      forestFactor: localCanopy,
      birdActivity: 0,
      intervalMinSec: 5.5,
      intervalMaxSec: 10.0,
      activeEmitters: [],
      nearestEmitter: null,
    };
  }

  const windCalmScale = 1 - Math.max(0, Math.min(1, windLevel)) * 0.18;
  const birdActivity = Math.max(
    0,
    Math.min(1, localCanopy * daylightBirdBoost * weatherScale * windCalmScale),
  );

  return {
    inForest: true,
    forestFactor: localCanopy,
    birdActivity,
    intervalMinSec: 1.45 / Math.max(0.4, weatherScale * daylightBirdBoost),
    intervalMaxSec: 3.65 / Math.max(0.4, weatherScale * daylightBirdBoost),
    activeEmitters,
    nearestEmitter,
  };
}

/**
 * Localized pond-bank cricket stridulation emitters flanking Lumbini Pushkarini Pond,
 * the Surrounding Sacred Pond lotus banks, and Peace Canal reed beds.
 */
export const LUMBINI_POND_CRICKET_EMITTERS: LumbiniSpatialEmitterSpec[] = [
  {
    id: 'lumbini-cricket-pushkarini-west',
    kind: 'bird-pond',
    label: 'Pushkarini West Brick Reed Bank',
    x: -281.5,
    y: 0.45,
    z: 112.5,
    refDistance: 5.5,
    maxDistance: 44,
    baseWeight: 1.0,
    speciesHint: 'garden-hedge',
  },
  {
    id: 'lumbini-cricket-pushkarini-east',
    kind: 'bird-pond',
    label: 'Pushkarini East Reed Bank',
    x: -258.5,
    y: 0.45,
    z: 112.5,
    refDistance: 5.5,
    maxDistance: 44,
    baseWeight: 0.96,
    speciesHint: 'garden-hedge',
  },
  {
    id: 'lumbini-cricket-pushkarini-south',
    kind: 'bird-pond',
    label: 'Pushkarini South Lotus Steps',
    x: -270.0,
    y: 0.45,
    z: 120.0,
    refDistance: 5.5,
    maxDistance: 44,
    baseWeight: 0.96,
    speciesHint: 'garden-hedge',
  },
  {
    id: 'lumbini-cricket-moat-south',
    kind: 'bird-pond',
    label: 'Sacred Pond South Reed Shore',
    x: -292.0,
    y: 0.4,
    z: 156.5,
    refDistance: 6.5,
    maxDistance: 52,
    baseWeight: 0.92,
    speciesHint: 'garden-hedge',
  },
  {
    id: 'lumbini-cricket-moat-west',
    kind: 'bird-pond',
    label: 'Sacred Pond West Lotus Shore',
    x: -329.5,
    y: 0.4,
    z: 108.0,
    refDistance: 6.5,
    maxDistance: 50,
    baseWeight: 0.88,
    speciesHint: 'garden-hedge',
  },
  {
    id: 'lumbini-cricket-moat-east',
    kind: 'bird-pond',
    label: 'Sacred Pond East Lotus Shore',
    x: -230.5,
    y: 0.4,
    z: 96.0,
    refDistance: 6.5,
    maxDistance: 50,
    baseWeight: 0.86,
    speciesHint: 'garden-hedge',
  },
  {
    id: 'lumbini-cricket-canal',
    kind: 'bird-pond',
    label: 'Peace Canal Tall Grass Bank',
    x: -341.5,
    y: 0.35,
    z: 100.0,
    refDistance: 6.5,
    maxDistance: 48,
    baseWeight: 0.85,
    speciesHint: 'garden-hedge',
  },
];

export interface LumbiniCricketSpatialState {
  inZone: boolean;
  cricketActivity: number;
  intervalMinSec: number;
  intervalMaxSec: number;
  activeEmitters: SpatialEmitterPanGain[];
  nearestEmitter: SpatialEmitterPanGain | null;
}

/**
 * Evaluates spatial cricket presence around Lumbini's ponds and canal.
 * Crickets peak during twilight, dusk, and night vigils, with a quiet localized shoreline hum near water by day.
 */
export function computeLumbiniCricketSpatialState(
  listenerX: number,
  listenerY: number,
  listenerZ: number,
  forwardX: number,
  forwardZ: number,
  timeHour = 20,
  preset: LumbiniAmbiencePreset = 'sanctuary-auto',
  weather: WeatherKind = 'clear',
): LumbiniCricketSpatialState {
  const hour = ((timeHour % 24) + 24) % 24;
  let diurnalFactor = 0.24;
  if (preset === 'moonlight-vigil' || hour >= 19.2 || hour < 5.0) {
    diurnalFactor = 1.0;
  } else if (preset === 'butter-lamp-dusk' || (hour >= 17.0 && hour < 19.2)) {
    diurnalFactor = 0.84;
  } else if (preset === 'lotus-dawn' || (hour >= 5.0 && hour < 7.0)) {
    diurnalFactor = 0.56;
  }

  const weatherScale =
    weather === 'rain' ? 0.14 : weather === 'snow' ? 0.12 : weather === 'foggy' ? 0.72 : weather === 'mist' ? 0.88 : 1.0;

  const activeEmitters: SpatialEmitterPanGain[] = [];
  for (let i = 0; i < LUMBINI_POND_CRICKET_EMITTERS.length; i++) {
    const ev = computeSpatialEmitterPanGain(
      listenerX,
      listenerY,
      listenerZ,
      forwardX,
      forwardZ,
      LUMBINI_POND_CRICKET_EMITTERS[i],
    );
    if (ev.distanceGain > 0.025) {
      activeEmitters.push(ev);
    }
  }
  activeEmitters.sort((a, b) => b.weight - a.weight);

  const nearestEmitter = activeEmitters[0] ?? null;
  if (!nearestEmitter) {
    return {
      inZone: false,
      cricketActivity: 0,
      intervalMinSec: 5.0,
      intervalMaxSec: 9.0,
      activeEmitters: [],
      nearestEmitter: null,
    };
  }

  const cricketActivity = Math.max(
    0,
    Math.min(1, nearestEmitter.distanceGain * diurnalFactor * weatherScale),
  );
  const paceBoost = 0.55 + cricketActivity * 0.85;

  return {
    inZone: true,
    cricketActivity,
    intervalMinSec: 1.05 / paceBoost,
    intervalMaxSec: 2.35 / paceBoost,
    activeEmitters,
    nearestEmitter,
  };
}

export type WaterRippleBody =
  | 'surrounding'
  | 'pushkarini'
  | 'peace-canal'
  | 'bagmati-river'
  | 'glacial-lake'
  | 'ganga-sagar';

export interface WaterEdgeRippleOrigin {
  x: number;
  z: number;
  waterBody: WaterRippleBody;
  strength: number;
  trailZone: string;
}

/**
 * Generalized water-wading ripple detector: ONLY emits ripples when the player is actually
 * stepping inside water (Pushkarini Pond, Surrounding Sacred Pond, Maitri Peace Canal,
 * Bagmati River, Glacial Lake, or Janaki Ganga Sagar). Walking or sprinting on dry paths
 * or bridges never emits water ripples.
 */
export function findWaterEdgeRippleOrigin(
  playerX: number,
  playerZ: number,
  strideIndex = 0,
): WaterEdgeRippleOrigin | null {
  const lumbiniWade = findLumbiniTrailPondRippleOrigin(playerX, playerZ, strideIndex);
  if (lumbiniWade) {
    return {
      x: lumbiniWade.x,
      z: lumbiniWade.z,
      waterBody: lumbiniWade.pond,
      strength: lumbiniWade.strength,
      trailZone: lumbiniWade.trailZone,
    };
  }

  const sway = Math.sin(strideIndex * 1.73) * 0.25;

  // Maitri Peace Canal (only when wading in the canal water itself, never on the bridge)
  const pc = LUMBINI_PEACE_CANAL;
  if (
    !isOnLumbiniCanalBridge(playerX, playerZ) &&
    playerX > pc.minX + 0.25 &&
    playerX < pc.maxX - 0.25 &&
    playerZ > pc.minZ + 0.25 &&
    playerZ < pc.maxZ - 0.25
  ) {
    return {
      x: playerX + sway * 0.5,
      z: playerZ + sway * 0.5,
      waterBody: 'peace-canal',
      strength: 0.9,
      trailZone: 'peace-canal-wade',
    };
  }

  // Glacial Lake (only inside water radius)
  const dxLake = playerX - GLACIAL_LAKE.x;
  const dzLake = playerZ - GLACIAL_LAKE.z;
  const distLake = Math.hypot(dxLake, dzLake);
  if (distLake < GLACIAL_LAKE.waterRadius - 0.3) {
    return {
      x: playerX + sway * 0.4,
      z: playerZ + sway * 0.4,
      waterBody: 'glacial-lake',
      strength: 0.9,
      trailZone: 'glacial-lake-wade',
    };
  }

  // Janaki Mandir Ganga Sagar Ghat Pond (inside basin only)
  const gsMinX = -142.8;
  const gsMaxX = -130.2;
  const gsMinZ = 100.0;
  const gsMaxZ = 116.0;
  if (
    playerX > gsMinX &&
    playerX < gsMaxX &&
    playerZ > gsMinZ &&
    playerZ < gsMaxZ
  ) {
    return {
      x: playerX + sway * 0.4,
      z: playerZ + sway * 0.4,
      waterBody: 'ganga-sagar',
      strength: 0.88,
      trailZone: 'ganga-sagar-wade',
    };
  }

  // Bagmati River (only when wading inside channel, never on north or Pashupatinath bridge decks)
  if (
    playerZ >= -220 &&
    playerZ <= 420 &&
    !isOnBridgeDeck(playerX, playerZ) &&
    !isOnPashupatiBagmatiBridge(playerX, playerZ)
  ) {
    const riverX = getRiverCenterX(playerZ);
    if (Math.abs(playerX - riverX) < 6.4) {
      return {
        x: playerX + sway * 0.4,
        z: playerZ + sway * 0.4,
        waterBody: 'bagmati-river',
        strength: 0.9,
        trailZone: 'bagmati-river-wade',
      };
    }
  }

  return null;
}

/**
 * Steps damped angular velocity & angle for interactive Tibetan/Buddhist Mani prayer wheels.
 */
export function stepPrayerWheelSpin(
  angle: number,
  velocity: number,
  dt: number,
  impulse = 0,
): { angle: number; velocity: number; active: boolean } {
  const clampedDt = Math.max(0, Math.min(0.1, dt));
  const boosted = Math.min(28, velocity + Math.max(0, impulse));
  const nextAngle = angle + boosted * clampedDt;
  const damping = Math.exp(-0.72 * clampedDt);
  const idleDrift = 0.22;
  const nextVel = idleDrift + (boosted - idleDrift) * damping;
  return {
    angle: nextAngle,
    velocity: nextVel < 0.24 ? idleDrift : nextVel,
    active: nextVel > 0.65,
  };
}

export const CAMERA_LOOK_DOWN_MAX_RAD = (80 * Math.PI) / 180;
export const CAMERA_LOOK_UP_MAX_RAD = (85 * Math.PI) / 180;

/**
 * Clamps orbital camera pitch so the player can freely look from -80 deg (straight down into ruins)
 * up to +85 deg (straight up at ceiling trusses and sky).
 * Orbital convention: positive pitch places camera above target looking down; negative pitch places
 * camera below target looking upward.
 */
export function clampCameraPitch(pitchRad: number): number {
  return Math.max(-CAMERA_LOOK_UP_MAX_RAD, Math.min(CAMERA_LOOK_DOWN_MAX_RAD, pitchRad));
}

/**
 * Converts shared camera orbit pitch into first-person look pitch (+85 deg up, -80 deg down).
 */
export function computeFirstPersonLookPitch(orbitPitchRad: number): number {
  return Math.max(-CAMERA_LOOK_DOWN_MAX_RAD, Math.min(CAMERA_LOOK_UP_MAX_RAD, -orbitPitchRad));
}

/**
 * Frame-rate independent exponential camera damping for weighty rotational & zoom inertia.
 */
export function dampCameraValue(current: number, target: number, lambda: number, dt: number): number {
  const safeDt = Math.max(0, Math.min(0.1, dt));
  return current + (target - current) * (1 - Math.exp(-lambda * safeDt));
}

/**
 * Prevents the third-person camera boom from clipping below boardwalks or terrain when looking upward.
 * Samples surface height along the look-target -> camera ray and slides the camera smoothly toward
 * the player's shoulder whenever the boom dips below surfaceY + floorMargin.
 */
export function resolveThirdPersonCameraFloorClearance(
  targetX: number,
  targetY: number,
  targetZ: number,
  camX: number,
  camY: number,
  camZ: number,
  minClearDist: number,
  floorMargin: number,
  sampleSurfaceY: (x: number, z: number) => number,
): { x: number; y: number; z: number; clipped: boolean } {
  const dx = camX - targetX;
  const dy = camY - targetY;
  const dz = camZ - targetZ;
  const totalDist = Math.hypot(dx, dy, dz);
  if (totalDist <= 0.001) {
    return { x: camX, y: camY, z: camZ, clipped: false };
  }

  let bestT = 1.0;
  let clipped = false;
  if (dy < -0.02) {
    const tMin = Math.min(1.0, Math.max(0.05, minClearDist / totalDist));
    for (const frac of [0.55, 0.78, 1.0]) {
      const t = Math.max(tMin, frac);
      const sx = targetX + dx * t;
      const sz = targetZ + dz * t;
      const minY = sampleSurfaceY(sx, sz) + floorMargin;
      const sy = targetY + dy * t;
      if (sy < minY) {
        const hitT = (minY - targetY) / dy;
        const clampedT = Math.max(tMin, Math.min(1.0, hitT));
        if (clampedT < bestT) {
          bestT = clampedT;
          clipped = true;
        }
      }
    }
  }

  const outX = targetX + dx * bestT;
  const outZ = targetZ + dz * bestT;
  const floorMinY = sampleSurfaceY(outX, outZ) + floorMargin;
  const rawOutY = targetY + dy * bestT;
  const outY = Math.max(floorMinY, rawOutY);
  if (rawOutY < floorMinY) {
    clipped = true;
  }
  return { x: outX, y: outY, z: outZ, clipped };
}

export type ContextualWorldActionKind =
  | 'inspect-marker-stone'
  | 'inspect-mauryan-chambers'
  | 'inspect-nativity-relief'
  | 'inspect-shiva-lingam'
  | 'inspect-golden-nandi'
  | 'light-pashupati-lamps'
  | 'perform-bagmati-aarati'
  | 'spin-boudha-kora-wheels'
  | 'ring-boudha-singing-bowl'
  | 'sprinkle-pumdikot-water'
  | 'enter-pumdikot-sanctum'
  | 'offer-pumdikot-bel-diya'
  | 'inspect-pumdikot-shiva'
  | 'light-butter-lamp'
  | 'spin-prayer-wheel'
  | 'ring-temple-bell'
  | 'toss-pebble'
  | 'sit-meditate'
  | 'drink-butter-tea'
  | 'use-scenic-telescope'
  | 'rest-high-camp'
  | 'hoist-summit-flag'
  | 'landmark';

export interface ContextualWorldAction {
  kind: ContextualWorldActionKind;
  label: string;
  targetX: number;
  targetZ: number;
  index?: number;
  litCount?: number;
  totalCount?: number;
  landmark?: (typeof LANDMARKS)[number];
}

export const MAYA_DEVI_PLAQUE_SPOTS: ReadonlyArray<{
  kind: 'inspect-marker-stone' | 'inspect-mauryan-chambers' | 'inspect-nativity-relief';
  label: string;
  x: number;
  z: number;
}> = [
  {
    kind: 'inspect-marker-stone',
    label: 'Inspect Sacred Marker Stone',
    x: -280.0,
    z: 79.68,
  },
  {
    kind: 'inspect-mauryan-chambers',
    label: 'Inspect Mauryan Brick Chambers (3rd Century BCE)',
    x: -270.92,
    z: 74.0,
  },
  {
    kind: 'inspect-nativity-relief',
    label: 'Inspect The Nativity Sculpture',
    x: -280.0,
    z: 68.32,
  },
];

/**
 * Determines the highest-priority [E] contextual world interaction around the player:
 * Pashupatinath Sacred Sanctum/Nandi/Lamps/Bagmati Aarati, Maya Devi museum plaques,
 * Prayer Wheel, Temple Bell, Pebble Toss, Meditation Bench, or nearest Landmark.
 */
export function computeContextualWorldAction(
  playerX: number,
  playerZ: number,
  nearestLandmark: (typeof LANDMARKS)[number] | null,
  prayerWheelSpots: ReadonlyArray<{ x: number; z: number }>,
  bellSpots: ReadonlyArray<{ x: number; z: number }>,
  pebbleSpots: ReadonlyArray<{ x: number; z: number; pondX: number; pondZ: number; label: string }>,
  meditationSpots: ReadonlyArray<{ x: number; z: number; lookX: number; lookZ: number; label: string }>,
  butterLampSpots: ReadonlyArray<{ x: number; z: number; isLit?: boolean }> = [],
  pashupatiSpots: {
    gheeLampRacks?: ReadonlyArray<{ x: number; z: number; lit?: boolean }>;
    aaratiTerrace?: { x: number; z: number };
  } = {},
  playerY = 0,
): ContextualWorldAction | null {
  // 00. Sagarmatha Trek High-Altitude Interactions (Zone 5 Teahouse, Zone 6 High Camp, Zone 7 Summit Spire)
  if (playerY >= 209.0 && Math.hypot(playerX - TREK_PLATEAUS.summit.x, playerZ - TREK_PLATEAUS.summit.z) <= 6.2) {
    return {
      kind: 'hoist-summit-flag',
      label: 'Hoist Prayer Flag & Celebrate Summit',
      targetX: TREK_KEY_SPOTS.summitPlaque.x,
      targetZ: TREK_KEY_SPOTS.summitPlaque.z,
    };
  }
  if (
    playerY >= 168.0 &&
    playerY <= 185.0 &&
    Math.hypot(playerX - TREK_KEY_SPOTS.highCampTent.x, playerZ - TREK_KEY_SPOTS.highCampTent.z) <= 6.5
  ) {
    return {
      kind: 'rest-high-camp',
      label: 'Rest at Himalayan High Camp (176m)',
      targetX: TREK_KEY_SPOTS.highCampTent.x,
      targetZ: TREK_KEY_SPOTS.highCampTent.z,
    };
  }
  if (playerY >= 134.0 && playerY <= 151.0) {
    if (Math.hypot(playerX - TREK_KEY_SPOTS.teahouseTelescope.x, playerZ - TREK_KEY_SPOTS.teahouseTelescope.z) <= 3.6) {
      return {
        kind: 'use-scenic-telescope',
        label: 'Look Through Brass Scenic Telescope',
        targetX: TREK_KEY_SPOTS.teahouseTelescope.x,
        targetZ: TREK_KEY_SPOTS.teahouseTelescope.z,
      };
    }
    if (Math.hypot(playerX - TREK_KEY_SPOTS.teahouseKettle.x, playerZ - TREK_KEY_SPOTS.teahouseKettle.z) <= 4.6) {
      return {
        kind: 'drink-butter-tea',
        label: 'Drink Hot Yak Butter Tea & Warm Up',
        targetX: TREK_KEY_SPOTS.teahouseKettle.x,
        targetZ: TREK_KEY_SPOTS.teahouseKettle.z,
      };
    }
  }

  // 0a. Boudhanath Interactive Ritual Spots
  const gompaBowl = BOUDHA_INTERACTIVE_SPOTS.gompaBowl;
  if (Math.hypot(playerX - gompaBowl.x, playerZ - gompaBowl.z) <= 3.6) {
    return {
      kind: 'ring-boudha-singing-bowl',
      label: gompaBowl.label,
      targetX: gompaBowl.x,
      targetZ: gompaBowl.z,
    };
  }
  const boudhaWheels = getBoudha108PrayerWheelPlacements();
  let bestKoraIdx = -1;
  let bestKoraDist = 2.95;
  for (let i = 0; i < boudhaWheels.length; i++) {
    const d = Math.hypot(playerX - boudhaWheels[i].worldX, playerZ - boudhaWheels[i].worldZ);
    if (d < bestKoraDist) {
      bestKoraDist = d;
      bestKoraIdx = i;
    }
  }
  if (bestKoraIdx >= 0) {
    return {
      kind: 'spin-boudha-kora-wheels',
      label: 'Spin 108 Kora Brass Prayer Wheels',
      targetX: boudhaWheels[bestKoraIdx].worldX,
      targetZ: boudhaWheels[bestKoraIdx].worldZ,
      index: bestKoraIdx,
    };
  }

  // 0b. Pumdikot Mahadev Interactive Rituals, Inner Sanctum & Upper 108-Lingam Terrace
  if (isInPumdikotPrecinct(playerX, playerZ, 2.0)) {
    const pLingam = PUMDIKOT_INTERACTIVE_SPOTS.innerLingamCenter;
    const pDistToDomeCenter = Math.hypot(playerX - pLingam.x, playerZ - pLingam.z);
    if (playerY >= 4.2 && pDistToDomeCenter <= 16.5) {
      const plaque = PUMDIKOT_INTERACTIVE_SPOTS.upperTerracePlaque;
      return {
        kind: 'inspect-pumdikot-shiva',
        label: 'Inspect 108-ft Pumdikot Mahadev',
        targetX: plaque.x,
        targetZ: plaque.z,
      };
    }
    if (playerY < 4.2 && pDistToDomeCenter <= 6.4) {
      return {
        kind: 'offer-pumdikot-bel-diya',
        label: 'Offer Bel Leaves & Light Diya',
        targetX: pLingam.x,
        targetZ: pLingam.z,
      };
    }
    const portico = PUMDIKOT_INTERACTIVE_SPOTS.porticoEntrance;
    if (
      playerY < 4.2 &&
      Math.hypot(playerX - portico.x, playerZ - portico.z) <= 3.8 &&
      pDistToDomeCenter > 10.6
    ) {
      return {
        kind: 'enter-pumdikot-sanctum',
        label: 'Enter Pumdikot Inner Sanctum',
        targetX: portico.x,
        targetZ: portico.z,
      };
    }
    const shivakunda = PUMDIKOT_INTERACTIVE_SPOTS.shivakundaCenter;
    if (playerY < 4.2 && Math.hypot(playerX - shivakunda.x, playerZ - shivakunda.z) <= 8.2) {
      return {
        kind: 'sprinkle-pumdikot-water',
        label: 'Sprinkle Sacred Water',
        targetX: shivakunda.x,
        targetZ: shivakunda.z,
      };
    }
  }

  // 0. Pashupatinath Sacred Interactions (Chaturmukha Shiva Lingam, Golden Nandi, Ghee-Lamp Racks, Bagmati Aarati)
  const lingamCenter = PASHUPATI_INTERACTIVE_SPOTS.shivaLingamCenter;
  if (
    Math.abs(playerX - lingamCenter.x) <= 5.4 &&
    Math.abs(playerZ - lingamCenter.z) <= 5.4
  ) {
    return {
      kind: 'inspect-shiva-lingam',
      label: 'Offer Bel Leaf & Inspect Chaturmukha Shiva Lingam',
      targetX: lingamCenter.x,
      targetZ: lingamCenter.z,
    };
  }

  const nandiCenter = PASHUPATI_INTERACTIVE_SPOTS.nandiPedestalCenter;
  if (Math.hypot(playerX - nandiCenter.x, playerZ - nandiCenter.z) <= 4.35) {
    return {
      kind: 'inspect-golden-nandi',
      label: 'Inspect Golden Nandi Bull',
      targetX: nandiCenter.x,
      targetZ: nandiCenter.z,
    };
  }

  const racks = pashupatiSpots.gheeLampRacks ?? PASHUPATI_INTERACTIVE_SPOTS.gheeLampRacks;
  for (let i = 0; i < racks.length; i++) {
    const r = racks[i];
    if (Math.hypot(playerX - r.x, playerZ - r.z) <= 3.15) {
      const isLit = 'lit' in r && Boolean(r.lit);
      return {
        kind: 'light-pashupati-lamps',
        label: isLit ? 'Extinguish / Trim Sacred Ghee Lamps' : 'Light Tiered Brass Ghee-Lamp Rack',
        targetX: r.x,
        targetZ: r.z,
        index: i,
      };
    }
  }

  const aarati = pashupatiSpots.aaratiTerrace ?? PASHUPATI_INTERACTIVE_SPOTS.aaratiTerraceCenter;
  if (Math.hypot(playerX - aarati.x, playerZ - aarati.z) <= 4.4) {
    return {
      kind: 'perform-bagmati-aarati',
      label: 'Perform Bagmati Sandhya Aarati & Float River Diyas',
      targetX: aarati.x,
      targetZ: aarati.z,
    };
  }

  // 1. Inside Maya Devi Sanctuary boardwalk -> pick nearest of the 3 museum plaques (Marker Stone, Mauryan Chambers, Nativity Sculpture)
  const inMayaDeviBoardwalk =
    playerX >= -297.5 && playerX <= -262.5 && playerZ >= 62.5 && playerZ <= 85.4;
  if (inMayaDeviBoardwalk) {
    let bestPlaque = MAYA_DEVI_PLAQUE_SPOTS[0];
    let bestDist = Infinity;
    for (const spot of MAYA_DEVI_PLAQUE_SPOTS) {
      const d = Math.hypot(playerX - spot.x, playerZ - spot.z);
      if (d < bestDist) {
        bestDist = d;
        bestPlaque = spot;
      }
    }
    if (bestDist <= 6.2) {
      return {
        kind: bestPlaque.kind,
        label: bestPlaque.label,
        targetX: bestPlaque.x,
        targetZ: bestPlaque.z,
      };
    }
    return {
      kind: 'inspect-marker-stone',
      label: 'Inspect Sacred Marker Stone',
      targetX: -280.0,
      targetZ: 74.0,
    };
  }

  // 2. Nearest Mani Prayer Wheel within reach
  let bestWheelIdx = -1;
  let bestWheelDist = 3.2;
  for (let i = 0; i < prayerWheelSpots.length; i++) {
    const d = Math.hypot(playerX - prayerWheelSpots[i].x, playerZ - prayerWheelSpots[i].z);
    if (d < bestWheelDist) {
      bestWheelDist = d;
      bestWheelIdx = i;
    }
  }
  if (bestWheelIdx >= 0) {
    return {
      kind: 'spin-prayer-wheel',
      label: 'Spin Mani Prayer Wheel',
      targetX: prayerWheelSpots[bestWheelIdx].x,
      targetZ: prayerWheelSpots[bestWheelIdx].z,
      index: bestWheelIdx,
    };
  }

  // 3. Nearest Digital Butter Lamp Ritual Offering near the Golden Baby Buddha Monument
  if (butterLampSpots.length > 0) {
    let bestUnlitIdx = -1;
    let bestUnlitDist = Infinity;
    let bestAnyIdx = -1;
    let bestAnyDist = 3.25;
    let litCount = 0;

    for (let i = 0; i < butterLampSpots.length; i++) {
      const spot = butterLampSpots[i];
      if (spot.isLit) litCount++;
      const d = Math.hypot(playerX - spot.x, playerZ - spot.z);
      if (d < bestAnyDist) {
        bestAnyDist = d;
        bestAnyIdx = i;
      }
      if (!spot.isLit && d < 6.4 && d < bestUnlitDist) {
        bestUnlitDist = d;
        bestUnlitIdx = i;
      }
    }

    if (bestAnyIdx >= 0) {
      const chosenIdx = bestUnlitIdx >= 0 ? bestUnlitIdx : bestAnyIdx;
      const chosen = butterLampSpots[chosenIdx];
      const totalCount = butterLampSpots.length;
      const label =
        litCount < totalCount
          ? `Ritual Offering · Light Butter Lamp (${litCount}/${totalCount})`
          : `Ritual Offering · Offer Flame Blessing (${litCount}/${totalCount})`;
      return {
        kind: 'light-butter-lamp',
        label,
        targetX: chosen.x,
        targetZ: chosen.z,
        index: chosenIdx,
        litCount,
        totalCount,
      };
    }
  }

  // 4. Nearest Temple Bell within reach
  let bestBellIdx = -1;
  let bestBellDist = 3.6;
  for (let i = 0; i < bellSpots.length; i++) {
    const d = Math.hypot(playerX - bellSpots[i].x, playerZ - bellSpots[i].z);
    if (d < bestBellDist) {
      bestBellDist = d;
      bestBellIdx = i;
    }
  }
  if (bestBellIdx >= 0) {
    return {
      kind: 'ring-temple-bell',
      label: 'Ring Bronze Temple Bell',
      targetX: bellSpots[bestBellIdx].x,
      targetZ: bellSpots[bestBellIdx].z,
      index: bestBellIdx,
    };
  }

  // 4. Nearest Pebble Skimming / Toss Pile beside Pond Overlook
  let bestPebbleIdx = -1;
  let bestPebbleDist = 3.5;
  for (let i = 0; i < pebbleSpots.length; i++) {
    const d = Math.hypot(playerX - pebbleSpots[i].x, playerZ - pebbleSpots[i].z);
    if (d < bestPebbleDist) {
      bestPebbleDist = d;
      bestPebbleIdx = i;
    }
  }
  if (bestPebbleIdx >= 0) {
    const spot = pebbleSpots[bestPebbleIdx];
    return {
      kind: 'toss-pebble',
      label: `Toss Pebble (${spot.label})`,
      targetX: spot.pondX,
      targetZ: spot.pondZ,
      index: bestPebbleIdx,
    };
  }

  // 5. Nearest Chautara / Meditation Bench
  let bestMedIdx = -1;
  let bestMedDist = 4.2;
  for (let i = 0; i < meditationSpots.length; i++) {
    const d = Math.hypot(playerX - meditationSpots[i].x, playerZ - meditationSpots[i].z);
    if (d < bestMedDist) {
      bestMedDist = d;
      bestMedIdx = i;
    }
  }
  if (bestMedIdx >= 0) {
    const med = meditationSpots[bestMedIdx];
    return {
      kind: 'sit-meditate',
      label: `Sit & Meditate (${med.label})`,
      targetX: med.lookX,
      targetZ: med.lookZ,
      index: bestMedIdx,
    };
  }

  // 6. Standard Landmark Inspection
  if (nearestLandmark) {
    return {
      kind: 'landmark',
      label: `Inspect ${nearestLandmark.title}`,
      targetX: nearestLandmark.position.x,
      targetZ: nearestLandmark.position.z,
      landmark: nearestLandmark,
    };
  }

  return null;
}

export interface FootprintDecalSlot {
  x: number;
  y: number;
  z: number;
  yaw: number;
  side: -1 | 1;
  age: number;
  maxAge: number;
  surfaceKind: FootstepSurfaceKind;
  active: boolean;
}

export interface FootprintDecalPoolState {
  slots: FootprintDecalSlot[];
  cursor: number;
  totalSpawned: number;
}

export function createFootprintDecalPool(capacity = 48): FootprintDecalPoolState {
  const safeCap = Math.max(8, Math.floor(capacity));
  const slots: FootprintDecalSlot[] = Array.from({ length: safeCap }, () => ({
    x: 0,
    y: -999,
    z: 0,
    yaw: 0,
    side: 1,
    age: 0,
    maxAge: 7.5,
    surfaceKind: 'stone' as FootstepSurfaceKind,
    active: false,
  }));
  return { slots, cursor: 0, totalSpawned: 0 };
}

export function recordFootprintDecal(
  pool: FootprintDecalPoolState,
  playerX: number,
  playerY: number,
  playerZ: number,
  playerYaw: number,
  side: -1 | 1,
  surfaceKind: FootstepSurfaceKind,
): FootprintDecalSlot {
  const cosY = Math.cos(playerYaw);
  const sinY = Math.sin(playerYaw);
  const lateralOffset = side * 0.16;
  const idx = pool.cursor;
  pool.cursor = (pool.cursor + 1) % pool.slots.length;
  pool.totalSpawned += 1;

  const slot = pool.slots[idx];
  slot.x = playerX + cosY * lateralOffset;
  slot.y = playerY + 0.015;
  slot.z = playerZ - sinY * lateralOffset;
  slot.yaw = playerYaw;
  slot.side = side;
  slot.age = 0;
  slot.maxAge =
    surfaceKind === 'wood'
      ? 4.8
      : surfaceKind === 'snow' || surfaceKind === 'ice'
        ? 9.2
        : surfaceKind === 'grass'
          ? 6.8
          : 8.2;
  slot.surfaceKind = surfaceKind;
  slot.active = true;
  return slot;
}

export function computeFootprintDecalAlpha(age: number, maxAge: number): number {
  if (maxAge <= 0 || age >= maxAge || age < 0) return 0;
  const t = age / maxAge;
  const holdFade = t < 0.28 ? 1 : 1 - (t - 0.28) / 0.72;
  return Math.max(0, Math.min(1, holdFade * holdFade * 0.66));
}

export function stepFootprintDecalPool(
  pool: FootprintDecalPoolState,
  dt: number,
): number {
  let activeCount = 0;
  for (let i = 0; i < pool.slots.length; i++) {
    const slot = pool.slots[i];
    if (!slot.active) continue;
    slot.age += dt;
    if (slot.age >= slot.maxAge) {
      slot.active = false;
      slot.y = -999;
      continue;
    }
    activeCount += 1;
  }
  return activeCount;
}

export interface MeditationButterflyState {
  homeX: number;
  homeY: number;
  homeZ: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  flapPhase: number;
  flapRate: number;
  orbitRadius: number;
  orbitAngle: number;
  orbitSpeed: number;
  colorIndex: number;
}

const LUMBINI_BUTTERFLY_ANCHORS: ReadonlyArray<[number, number, number]> = [
  [-304.0, 1.8, 112.5], // Bodhi Tree Chautara
  [-280.0, 2.0, 128.0], // South Forecourt & Marigold Beds
  [-270.0, 1.5, 112.5], // Pushkarini Sacred Pond edge
  [-280.0, 2.2, 87.5], // Maya Devi South Promenade & Forecourt
  [-254.0, 1.9, 116.0], // Eternal Peace Flame garden
];

export function createMeditationButterflyStates(
  count = 28,
): MeditationButterflyState[] {
  const safeCount = Math.max(4, Math.floor(count));
  const out: MeditationButterflyState[] = [];
  for (let i = 0; i < safeCount; i++) {
    const anchor = LUMBINI_BUTTERFLY_ANCHORS[i % LUMBINI_BUTTERFLY_ANCHORS.length];
    const angle = (i * 2.399963) % (Math.PI * 2);
    const orbitRadius = 1.15 + ((i * 19) % 100) / 34;
    const homeY = anchor[1] + ((i * 29) % 100) / 85;
    const x = anchor[0] + Math.cos(angle) * orbitRadius;
    const z = anchor[2] + Math.sin(angle) * orbitRadius;
    out.push({
      homeX: anchor[0],
      homeY,
      homeZ: anchor[2],
      x,
      y: homeY,
      z,
      yaw: angle + Math.PI * 0.5,
      flapPhase: (i * 0.91) % (Math.PI * 2),
      flapRate: 8.6 + ((i * 13) % 10) * 0.45,
      orbitRadius,
      orbitAngle: angle,
      orbitSpeed: (0.48 + ((i * 7) % 11) * 0.055) * (i % 2 === 0 ? 1 : -1),
      colorIndex: i % 5,
    });
  }
  return out;
}

export function stepMeditationButterflies(
  states: MeditationButterflyState[],
  dt: number,
  elapsed: number,
  isMeditating: boolean,
  meditateX: number,
  meditateY: number,
  meditateZ: number,
): void {
  const clampedDt = Math.min(0.08, Math.max(0.001, dt));
  const lerpAlpha = 1 - Math.exp(-(isMeditating ? 2.1 : 1.35) * clampedDt);
  for (let i = 0; i < states.length; i++) {
    const b = states[i];
    b.orbitAngle += b.orbitSpeed * (isMeditating ? 1.35 : 1.0) * clampedDt;
    b.flapPhase += b.flapRate * (isMeditating ? 1.15 : 1.0) * clampedDt;

    const ringRadius = isMeditating ? 0.95 + (i % 5) * 0.44 : b.orbitRadius;
    const centerX = isMeditating ? meditateX : b.homeX;
    const centerY = isMeditating
      ? meditateY + 0.95 + (i % 4) * 0.36 + Math.sin(elapsed * 1.9 + i) * 0.24
      : b.homeY + Math.sin(elapsed * 1.6 + i * 1.1) * 0.34;
    const centerZ = isMeditating ? meditateZ : b.homeZ;

    const targetX = centerX + Math.cos(b.orbitAngle) * ringRadius;
    const targetZ = centerZ + Math.sin(b.orbitAngle) * ringRadius;
    const dx = targetX - b.x;
    const dz = targetZ - b.z;
    b.x += dx * lerpAlpha;
    b.y += (centerY - b.y) * lerpAlpha;
    b.z += dz * lerpAlpha;

    if (Math.hypot(dx, dz) > 0.002) {
      const targetYaw = Math.atan2(dx, dz);
      const yawDiff = Math.atan2(Math.sin(targetYaw - b.yaw), Math.cos(targetYaw - b.yaw));
      b.yaw += yawDiff * (1 - Math.exp(-8 * clampedDt));
    }
  }
}

/**
 * Returns true when a world coordinate lies inside or immediately within Maya Devi Temple's
 * interior sanctuary / upper skylight box (preventing stuck birds mid-air inside the temple).
 */
export function isInsideMayaDeviBirdExclusion(x: number, y: number, z: number): boolean {
  return x >= -299.0 && x <= -261.0 && z >= 61.0 && z <= 87.0 && y < 14.5;
}

export interface LumbiniPondProximityState {
  active: boolean;
  factor: number;
  anchorX: number;
  anchorZ: number;
  nearestPond: 'pushkarini' | 'surrounding' | 'none';
}

/**
 * Computes continuous shader-based wake ripple excitation for Lumbini Sacred Garden ponds
 * strictly when the player is wading inside Pushkarini Sacred Pond or Surrounding Sacred Pond.
 */
export function computeLumbiniPondProximityState(
  playerX: number,
  playerZ: number,
  playerSpeed: number,
): LumbiniPondProximityState {
  const inPushkarini = isInLumbiniPushkariniPond(playerX, playerZ);
  const inSurrounding = !inPushkarini && isInLumbiniSurroundingPond(playerX, playerZ);
  if (!inPushkarini && !inSurrounding) {
    return {
      active: false,
      factor: 0,
      anchorX: playerX,
      anchorZ: playerZ,
      nearestPond: 'none',
    };
  }

  const speedNorm = Math.max(0, Math.min(1, playerSpeed / 4.5));
  const factor = Math.min(1, 0.35 + 0.65 * speedNorm);

  return {
    active: factor > 0.02,
    factor,
    anchorX: playerX,
    anchorZ: playerZ,
    nearestPond: inPushkarini ? 'pushkarini' : 'surrounding',
  };
}

export interface LumbiniIncenseSmokePlacement {
  id: number;
  brazierIndex: number;
  x: number;
  y: number;
  z: number;
  phase: number;
  speed: number;
  riseHeight: number;
  swirlRadius: number;
  swirlFreq: number;
  scale: number;
  warmShift: number;
}

export const BABY_BUDDHA_MONUMENT_ORIGIN = {
  x: -280.0,
  y: 0.1,
  z: 135.0,
  scale: 1.28,
} as const;

export const BABY_BUDDHA_BRAZIER_LOCAL_ANGLES = [
  Math.PI * 0.25,
  Math.PI * 0.75,
  Math.PI * 1.25,
  Math.PI * 1.75,
] as const;

/**
 * Generates deterministic floating incense smoke plumes rising around the
 * Golden Baby Buddha monument base: 4 dense curling plumes anchored to the
 * 4 sculpted bronze Dhupa braziers plus gentle ambient lotus-basin wisps.
 */
export function generateLumbiniIncenseSmokePlacements(
  count = 240,
  seed = 202618,
): LumbiniIncenseSmokePlacement[] {
  const rand = createMulberry32(seed);
  const out: LumbiniIncenseSmokePlacement[] = [];
  const { x: ox, y: oy, z: oz, scale } = BABY_BUDDHA_MONUMENT_ORIGIN;
  const brazierLocalR = 1.06;
  const brazierTipLocalY = 0.66;

  const brazierParticles = Math.round(count * 0.90);
  for (let i = 0; i < count; i++) {
    const isBrazierPlume = i < brazierParticles;
    const brazierIdx = isBrazierPlume ? i % 4 : -1;
    let x: number;
    let y: number;
    let z: number;
    let riseHeight: number;
    let swirlRadius: number;
    let speed: number;
    let pScale: number;

    if (isBrazierPlume) {
      const a = BABY_BUDDHA_BRAZIER_LOCAL_ANGLES[brazierIdx];
      const bx = ox + Math.sin(a) * brazierLocalR * scale;
      const bz = oz + Math.cos(a) * brazierLocalR * scale;
      const stickJitterAngle = rand() * Math.PI * 2;
      const stickSpread = rand() * 0.042;
      x = bx + Math.cos(stickJitterAngle) * stickSpread;
      y = oy + brazierTipLocalY * scale + rand() * 0.04;
      z = bz + Math.sin(stickJitterAngle) * stickSpread;
      riseHeight = 2.0 + rand() * 1.25;
      swirlRadius = 0.14 + rand() * 0.18;
      speed = 0.16 + rand() * 0.10;
      pScale = 0.44 + rand() * 0.34;
    } else {
      const a = rand() * Math.PI * 2;
      const ringR = lerp(1.18, 1.85, rand()) * scale;
      x = ox + Math.sin(a) * ringR;
      y = oy + (0.62 + rand() * 0.18) * scale;
      z = oz + Math.cos(a) * ringR;
      riseHeight = 1.9 + rand() * 1.05;
      swirlRadius = 0.22 + rand() * 0.22;
      speed = 0.12 + rand() * 0.07;
      pScale = 0.48 + rand() * 0.32;
    }

    out.push({
      id: i,
      brazierIndex: brazierIdx,
      x,
      y,
      z,
      phase: rand(),
      speed,
      riseHeight,
      swirlRadius,
      swirlFreq: 1.8 + rand() * 2.2,
      scale: pScale,
      warmShift: rand(),
    });
  }

  return out;
}

export interface ButterLampFlameState {
  scaleX: number;
  scaleY: number;
  haloScale: number;
  haloOpacity: number;
  lightIntensity: number;
  ignitionBurstProgress: number;
}

/**
 * Pure kinematic flame envelope for digital butter lamps: unlit lamps stay dark (0),
 * while newly lit lamps spring outward smoothly with subtle breathing flicker.
 */
export function computeButterLampFlameState(
  elapsed: number,
  litAtElapsed: number,
  seed: number,
): ButterLampFlameState {
  if (!Number.isFinite(litAtElapsed) || litAtElapsed < 0 || elapsed < litAtElapsed) {
    return {
      scaleX: 0,
      scaleY: 0,
      haloScale: 0,
      haloOpacity: 0,
      lightIntensity: 0,
      ignitionBurstProgress: 0,
    };
  }

  const age = Math.max(0, elapsed - litAtElapsed);
  // Underdamped spring rise on ignition (0 -> 1.38 overshoot -> settles to 1.0 by ~0.75s)
  const rise = 1 - Math.exp(-9.0 * age);
  const overshoot = Math.exp(-5.5 * age) * Math.sin(age * 11.5) * 0.34;
  const envelope = Math.max(0, rise + overshoot);

  // Multi-harmonic candle / ghee-wick dance
  const waveA = Math.sin(elapsed * 7.8 + seed * 2.7);
  const waveB = Math.cos(elapsed * 12.6 + seed * 4.1);
  const waveC = Math.sin(elapsed * 3.4 + seed * 1.3);

  const flickerY = 1.0 + 0.12 * waveA + 0.06 * waveB;
  const flickerXZ = 1.0 + 0.07 * waveC - 0.05 * waveA;

  return {
    scaleX: envelope * flickerXZ,
    scaleY: envelope * flickerY,
    haloScale: envelope * (1.0 + 0.14 * waveA + 0.06 * waveC),
    haloOpacity: Math.min(1, envelope * (0.42 + 0.08 * waveA)),
    lightIntensity: envelope * (0.9 + 0.16 * waveA + 0.08 * waveB),
    ignitionBurstProgress: Math.min(1, age / 1.15),
  };
}




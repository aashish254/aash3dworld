export type TrekZoneId = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type TrekSurfaceKind = 'stone' | 'wood' | 'grass' | 'snow' | 'ice';
export type TrekCheckpointId = 'trailhead' | 'teahouse' | 'summit';

export interface TrekWaypointSpec {
  x: number;
  y: number;
  z: number;
  width: number;
  zone: TrekZoneId;
  surface: TrekSurfaceKind;
  isBridge?: boolean;
}

export interface TrekZoneMeta {
  id: TrekZoneId;
  name: string;
  elevationRange: string;
  minS: number;
  maxS: number;
  description: string;
}

export interface TrekSample {
  index: number;
  s: number;
  x: number;
  y: number;
  z: number;
  tx: number;
  tz: number;
  nx: number;
  nz: number;
  width: number;
  zone: TrekZoneId;
  surface: TrekSurfaceKind;
  isBridge: boolean;
}

export interface TrekBridgeSpan {
  id: 'bridge-1' | 'bridge-2' | 'boulder-bridge' | 'crevasse-ladder';
  label: string;
  startS: number;
  endS: number;
  start: [number, number, number];
  end: [number, number, number];
  width: number;
  sag: number;
  surface: TrekSurfaceKind;
}

export interface TrekTelescopeTarget {
  id: string;
  name: string;
  subtitle: string;
  x: number;
  y: number;
  z: number;
  distanceM: number;
  bearingLabel: string;
}

export const SAGARMATHA_PEAK_CENTER = {
  x: 32,
  z: -355,
  summitY: 216.0,
  rx: 138,
  rz: 192,
} as const;

export const TREK_ZONES: TrekZoneMeta[] = [
  {
    id: 1,
    name: 'Zone 1 · Valley Trailhead & Mani Gate',
    elevationRange: '0m – 20m',
    minS: 0,
    maxS: 115,
    description: 'Sherpa timber archway, trail map kiosk, carved Mani prayer walls, and Chautara resting tree.',
  },
  {
    id: 2,
    name: 'Zone 2 · Ulleri Stairs & Glacial Waterfall',
    elevationRange: '20m – 60m',
    minS: 115,
    maxS: 320,
    description: 'Steep granite staircases winding beneath Himalayan pines, scarlet Lali Gurans, and a cascading glacial waterfall.',
  },
  {
    id: 3,
    name: 'Zone 3 · Twin Hillary Suspension Bridges',
    elevationRange: '60m – 95m',
    minS: 320,
    maxS: 515,
    description: 'High-altitude wire-cable suspension spans draped in fluttering Lungta prayer flags over deep alpine gorges.',
  },
  {
    id: 4,
    name: 'Zone 4 · Cliffside Iron Chains & Monal Crag',
    elevationRange: '95m – 130m',
    minS: 515,
    maxS: 680,
    description: 'Narrow carved rock ledges rigged with bolted iron chains, red trail blazes, and iridescent Himalayan Monal pheasants.',
  },
  {
    id: 5,
    name: 'Zone 5 · Sherpa Teahouse (Sagarmatha View Lodge)',
    elevationRange: '130m – 155m',
    minS: 680,
    maxS: 805,
    description: 'Dry-stone Sherpa lodge with a cantilevered viewing deck, steaming Yak butter tea, and a brass scenic telescope.',
  },
  {
    id: 6,
    name: 'Zone 6 · High Camp, Seracs & Crevasse Ladder',
    elevationRange: '155m – 215m',
    minS: 805,
    maxS: 1085,
    description: 'Translucent blue-ice seracs, expedition dome tents at High Camp, fixed ropes, and an aluminum ladder spanning a glowing crevasse.',
  },
  {
    id: 7,
    name: 'Zone 7 · Himalayan Summit Spire',
    elevationRange: '216m',
    minS: 1085,
    maxS: 1200,
    description: 'Snow-crowned pinnacle with a stone Chorten, dense streaming Lungta prayer flags, golden Trishul, and brass elevation plaque.',
  },
];

export const TREK_CHECKPOINTS: Record<
  TrekCheckpointId,
  { id: TrekCheckpointId; label: string; altitudeM: number; x: number; y: number; z: number; yaw: number }
> = {
  trailhead: {
    id: 'trailhead',
    label: 'Trailhead Gate',
    altitudeM: 0,
    x: 6,
    y: 0.25,
    z: -144,
    yaw: Math.PI,
  },
  teahouse: {
    id: 'teahouse',
    label: 'Sherpa Teahouse',
    altitudeM: 142,
    x: 48,
    y: 142.0,
    z: -274,
    yaw: 0.15,
  },
  summit: {
    id: 'summit',
    label: 'Summit Spire',
    altitudeM: 216,
    x: 32,
    y: 216.0,
    z: -355,
    yaw: 0.0,
  },
};

export const TREK_PLATEAUS = {
  trailhead: { x: 6, y: 0.25, z: -144, radius: 7.2 },
  waterfallOverlook: { x: 84, y: 46.5, z: -278, radius: 4.5 },
  teahouse: { x: 48, y: 142.0, z: -275, radius: 9.2 },
  teahouseDeck: { minX: 40.5, maxX: 55.5, minZ: -271.5, maxZ: -264.5, y: 142.0 },
  highCamp: { x: 36, y: 176.0, z: -384, radius: 8.6 },
  summit: { x: 32, y: 216.0, z: -355, radius: 6.4 },
} as const;

export const TREK_KEY_SPOTS = {
  trailMapBoard: { x: 2.2, y: 0.25, z: -145.5 },
  maniWallStart: { x: 8.5, y: 2.2, z: -158.0 },
  chautaraTree: { x: 18.5, y: 8.5, z: -183.5 },
  waterfallCenter: { x: 92.0, y: 50.0, z: -276.0 },
  waterfallBridge: { x: 84.0, y: 46.5, z: -278.0 },
  monalPerch: { x: -79.5, y: 111.4, z: -307.5 },
  teahouseKettle: { x: 45.2, y: 142.0, z: -268.2 },
  teahouseTelescope: { x: 51.6, y: 142.0, z: -265.8 },
  highCampTent: { x: 38.5, y: 176.0, z: -386.5 },
  crevasseCenter: { x: -22.0, y: 196.75, z: -360.0 },
  summitChorten: { x: 32.0, y: 216.0, z: -356.8 },
  summitPlaque: { x: 32.0, y: 216.0, z: -352.6 },
} as const;

export const TREK_BRIDGE_SPANS: TrekBridgeSpan[] = [
  {
    id: 'bridge-1',
    label: 'Khumbu East Suspension Bridge',
    startS: 344,
    endS: 394,
    start: [104, 62.0, -364],
    end: [76, 65.0, -406],
    width: 1.9,
    sag: 0.72,
    surface: 'wood',
  },
  {
    id: 'bridge-2',
    label: 'Gorge West Suspension Bridge',
    startS: 486,
    endS: 530,
    start: [-32, 85.0, -412],
    end: [-64, 88.5, -382],
    width: 1.9,
    sag: 0.65,
    surface: 'wood',
  },
  {
    id: 'boulder-bridge',
    label: 'Scramble Timber Bridge',
    startS: 595,
    endS: 608,
    start: [-64, 115.4, -292],
    end: [-54, 118.4, -282],
    width: 1.55,
    sag: 0.14,
    surface: 'wood',
  },
  {
    id: 'crevasse-ladder',
    label: 'Khumbu Crevasse Ladder',
    startS: 924,
    endS: 938,
    start: [-24, 196.0, -367],
    end: [-20, 197.5, -353],
    width: 1.35,
    sag: 0.04,
    surface: 'wood',
  },
];

export const TREK_TELESCOPE_TARGETS: TrekTelescopeTarget[] = [
  {
    id: 'pumdikot-shiva',
    name: 'Pumdikot Mahadev',
    subtitle: '108-ft Meditating Shiva & Himalayan Ridge',
    x: -50,
    y: 16,
    z: -98,
    distanceM: 196,
    bearingLabel: 'WSW · 241°',
  },
  {
    id: 'pashupatinath',
    name: 'Pashupatinath Temple',
    subtitle: 'Golden Pagoda Sanctum & Bagmati Ghats',
    x: -28,
    y: 8,
    z: 300,
    distanceM: 571,
    bearingLabel: 'SSW · 194°',
  },
  {
    id: 'janaki-mandir',
    name: 'Janaki Mandir',
    subtitle: 'Mithila Marble Palace & Sacred Chowk',
    x: -92,
    y: 10,
    z: 108,
    distanceM: 400,
    bearingLabel: 'SW · 204°',
  },
  {
    id: 'lumbini-buddha',
    name: 'Lumbini Sacred Garden',
    subtitle: 'Maya Devi Temple, Ashoka Pillar & Eternal Flame',
    x: -280,
    y: 7,
    z: 96,
    distanceM: 492,
    bearingLabel: 'SW · 223°',
  },
  {
    id: 'boudhanath-stupa',
    name: 'Boudhanath Stupa',
    subtitle: 'Grand White Mandala & All-Seeing Eyes',
    x: -308,
    y: 14,
    z: 302,
    distanceM: 672,
    bearingLabel: 'SW · 212°',
  },
];

// 34 carefully graded 3D waypoints producing ~1,120m continuous climb from Valley Floor (0.25m) to Summit Spire (216m)
export const HIMALAYA_TREK_WAYPOINTS: TrekWaypointSpec[] = [
  // Zone 1: Valley Trailhead & Mani Gate (0m -> 20m)
  { x: 6, y: 0.25, z: -144, width: 3.0, zone: 1, surface: 'stone' },
  { x: 9, y: 2.6, z: -158, width: 2.9, zone: 1, surface: 'stone' },
  { x: 19, y: 7.4, z: -179, width: 2.8, zone: 1, surface: 'stone' },
  { x: 38, y: 13.6, z: -195, width: 2.75, zone: 1, surface: 'stone' },
  { x: 63, y: 20.0, z: -214, width: 2.7, zone: 1, surface: 'stone' },

  // Zone 2: Ulleri Granite Stairs & Glacial Waterfall (20m -> 60m)
  { x: 85, y: 28.0, z: -234, width: 2.55, zone: 2, surface: 'stone' },
  { x: 98, y: 37.5, z: -257, width: 2.5, zone: 2, surface: 'stone' },
  { x: 84, y: 46.5, z: -278, width: 2.45, zone: 2, surface: 'wood' }, // Waterfall footbridge hairpin
  { x: 105, y: 53.5, z: -304, width: 2.45, zone: 2, surface: 'stone' },
  { x: 117, y: 60.0, z: -334, width: 2.35, zone: 2, surface: 'stone' },

  // Zone 3: Twin Hillary Suspension Bridges (60m -> 95m)
  { x: 104, y: 62.0, z: -364, width: 2.15, zone: 3, surface: 'stone' },
  { x: 90, y: 62.9, z: -385, width: 1.9, zone: 3, surface: 'wood', isBridge: true },
  { x: 76, y: 65.0, z: -406, width: 2.15, zone: 3, surface: 'stone' },
  { x: 52, y: 71.2, z: -424, width: 2.1, zone: 3, surface: 'stone' },
  { x: 20, y: 77.2, z: -432, width: 2.05, zone: 3, surface: 'stone' },
  { x: -14, y: 82.0, z: -425, width: 2.0, zone: 3, surface: 'stone' },
  { x: -32, y: 85.0, z: -412, width: 2.0, zone: 3, surface: 'stone' },
  { x: -48, y: 86.2, z: -397, width: 1.9, zone: 3, surface: 'wood', isBridge: true },
  { x: -64, y: 88.5, z: -382, width: 2.0, zone: 3, surface: 'stone' },
  { x: -77, y: 95.0, z: -362, width: 1.85, zone: 3, surface: 'stone' },

  // Zone 4: Cliffside Iron Chains, Blazes & Boulder Scramble (95m -> 130m)
  { x: -82, y: 102.5, z: -336, width: 1.62, zone: 4, surface: 'stone' },
  { x: -75, y: 110.5, z: -308, width: 1.56, zone: 4, surface: 'stone' },
  { x: -59, y: 117.2, z: -287, width: 1.62, zone: 4, surface: 'wood', isBridge: true },
  { x: -34, y: 124.8, z: -271, width: 1.68, zone: 4, surface: 'stone' },
  { x: -6, y: 130.0, z: -265, width: 1.8, zone: 4, surface: 'stone' },

  // Zone 5: Sherpa Teahouse — Sagarmatha View Lodge (130m -> 155m)
  { x: 22, y: 136.8, z: -267, width: 2.1, zone: 5, surface: 'stone' },
  { x: 48, y: 142.0, z: -275, width: 2.6, zone: 5, surface: 'stone' },
  { x: 68, y: 148.8, z: -297, width: 2.05, zone: 5, surface: 'stone' },
  { x: 74, y: 155.0, z: -326, width: 1.95, zone: 5, surface: 'stone' },

  // Zone 6: Alpine Snowfields, High Camp, Crevasse Ladder & Summit Arête (155m -> 215m)
  { x: 63, y: 165.5, z: -358, width: 1.82, zone: 6, surface: 'snow' },
  { x: 36, y: 176.0, z: -384, width: 2.25, zone: 6, surface: 'snow' },
  { x: 2, y: 185.5, z: -390, width: 1.65, zone: 6, surface: 'snow' },
  { x: -24, y: 196.0, z: -367, width: 1.55, zone: 6, surface: 'snow' },
  { x: -22, y: 196.75, z: -360, width: 1.4, zone: 6, surface: 'wood', isBridge: true },
  { x: -20, y: 197.5, z: -353, width: 1.55, zone: 6, surface: 'snow' },
  { x: -12, y: 204.5, z: -334, width: 1.48, zone: 6, surface: 'snow' },
  { x: 18, y: 209.5, z: -329, width: 1.44, zone: 6, surface: 'snow' },
  { x: 44, y: 213.4, z: -343, width: 1.42, zone: 6, surface: 'snow' },

  // Zone 7: Summit Spire (216m)
  { x: 32, y: 216.0, z: -355, width: 2.8, zone: 7, surface: 'snow' },
];

function catmullRom1D(p0: number, p1: number, p2: number, p3: number, t: number): number {
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

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function buildTrekSplineSamples(): {
  samples: TrekSample[];
  totalLength: number;
  grid: Map<number, number[]>;
  cellSize: number;
} {
  const nPts = HIMALAYA_TREK_WAYPOINTS.length;
  const segSteps = 14;
  const raw: Array<{
    x: number;
    y: number;
    z: number;
    width: number;
    zone: TrekZoneId;
    surface: TrekSurfaceKind;
    isBridge: boolean;
  }> = [];

  for (let seg = 0; seg < nPts - 1; seg++) {
    const w0 = HIMALAYA_TREK_WAYPOINTS[Math.max(0, seg - 1)];
    const w1 = HIMALAYA_TREK_WAYPOINTS[seg];
    const w2 = HIMALAYA_TREK_WAYPOINTS[seg + 1];
    const w3 = HIMALAYA_TREK_WAYPOINTS[Math.min(nPts - 1, seg + 2)];
    const linearBridge = Boolean(w1.isBridge || w2.isBridge);

    for (let k = 0; k < segSteps; k++) {
      const t = k / segSteps;
      const x = linearBridge
        ? w1.x + (w2.x - w1.x) * t
        : catmullRom1D(w0.x, w1.x, w2.x, w3.x, t);
      const y = linearBridge
        ? w1.y + (w2.y - w1.y) * t
        : catmullRom1D(w0.y, w1.y, w2.y, w3.y, t);
      const z = linearBridge
        ? w1.z + (w2.z - w1.z) * t
        : catmullRom1D(w0.z, w1.z, w2.z, w3.z, t);
      const width = w1.width + (w2.width - w1.width) * t;
      const zone = t < 0.5 ? w1.zone : w2.zone;
      const surface = t < 0.5 ? w1.surface : w2.surface;
      const isBridge =
        Boolean(w1.isBridge && w2.isBridge) ||
        (linearBridge && t > 0.08 && t < 0.92 && Boolean(w1.isBridge || w2.isBridge));
      raw.push({ x, y, z, width, zone, surface, isBridge });
    }
  }
  const last = HIMALAYA_TREK_WAYPOINTS[nPts - 1];
  raw.push({
    x: last.x,
    y: last.y,
    z: last.z,
    width: last.width,
    zone: last.zone,
    surface: last.surface,
    isBridge: Boolean(last.isBridge),
  });

  // Apply exact catenary sag along Bridge 1, Bridge 2, Boulder Bridge, and Crevasse Ladder
  const samples: TrekSample[] = [];
  let cumS = 0;
  for (let i = 0; i < raw.length; i++) {
    if (i > 0) {
      cumS += Math.hypot(
        raw[i].x - raw[i - 1].x,
        raw[i].y - raw[i - 1].y,
        raw[i].z - raw[i - 1].z,
      );
    }
    const prev = raw[Math.max(0, i - 1)];
    const next = raw[Math.min(raw.length - 1, i + 1)];
    const dx = next.x - prev.x;
    const dz = next.z - prev.z;
    const hLen = Math.hypot(dx, dz) || 1;
    const tx = dx / hLen;
    const tz = dz / hLen;
    const nx = -tz;
    const nz = tx;

    samples.push({
      index: i,
      s: cumS,
      x: raw[i].x,
      y: raw[i].y,
      z: raw[i].z,
      tx,
      tz,
      nx,
      nz,
      width: raw[i].width,
      zone: raw[i].zone,
      surface: raw[i].surface,
      isBridge: raw[i].isBridge,
    });
  }

  // Enforce exact straight catenary deck elevation & alignment inside each TREK_BRIDGE_SPANS
  for (const span of TREK_BRIDGE_SPANS) {
    const [sx, sy, sz] = span.start;
    const [ex, ey, ez] = span.end;
    const vx = ex - sx;
    const vz = ez - sz;
    const lenSq = vx * vx + vz * vz || 1;
    const hLen = Math.sqrt(lenSq);
    const dirX = vx / hLen;
    const dirZ = vz / hLen;

    for (const smp of samples) {
      const proj = ((smp.x - sx) * vx + (smp.z - sz) * vz) / lenSq;
      if (proj >= -0.02 && proj <= 1.02) {
        const perp = Math.abs((smp.x - sx) * -dirZ + (smp.z - sz) * dirX);
        if (perp < 5.5 && Math.abs(smp.y - (sy + ey) * 0.5) < 9) {
          const u = clamp(proj, 0, 1);
          smp.x = sx + vx * u;
          smp.z = sz + vz * u;
          smp.y = sy + (ey - sy) * u - Math.sin(u * Math.PI) * span.sag;
          smp.tx = dirX;
          smp.tz = dirZ;
          smp.nx = -dirZ;
          smp.nz = dirX;
          smp.width = span.width;
          smp.surface = span.surface;
          smp.isBridge = true;
        }
      }
    }
  }

  const cellSize = 10;
  const grid = new Map<number, number[]>();
  for (let i = 0; i < samples.length; i++) {
    const gx = Math.floor(samples[i].x / cellSize);
    const gz = Math.floor(samples[i].z / cellSize);
    const key = (gx + 2048) * 4096 + (gz + 2048);
    let arr = grid.get(key);
    if (!arr) {
      arr = [];
      grid.set(key, arr);
    }
    arr.push(i);
  }

  return {
    samples,
    totalLength: cumS,
    grid,
    cellSize,
  };
}

const BUILT_TREK = buildTrekSplineSamples();
export const TREK_SAMPLES: readonly TrekSample[] = BUILT_TREK.samples;
export const TREK_TOTAL_LENGTH_M: number = BUILT_TREK.totalLength;

export function getZoneMetaById(zoneId: TrekZoneId): TrekZoneMeta {
  return TREK_ZONES.find((z) => z.id === zoneId) ?? TREK_ZONES[0];
}

export function getTrekZoneAtProgress(s: number, y: number): TrekZoneMeta {
  if (y >= 214.0) return TREK_ZONES[6];
  if (y >= 154.5) return TREK_ZONES[5];
  if (y >= 129.5) return TREK_ZONES[4];
  if (y >= 94.5) return TREK_ZONES[3];
  if (y >= 59.5) return TREK_ZONES[2];
  if (y >= 19.5) return TREK_ZONES[1];
  for (const z of TREK_ZONES) {
    if (s >= z.minS && s <= z.maxS) return z;
  }
  return TREK_ZONES[0];
}

export function findNearestTrekSample(
  x: number,
  z: number,
  refY?: number,
): { sample: TrekSample; distXZ: number } {
  const { grid, cellSize, samples } = BUILT_TREK;
  const gx = Math.floor(x / cellSize);
  const gz = Math.floor(z / cellSize);

  let bestIdx = -1;
  let bestScore = Infinity;
  let bestDistXZ = Infinity;

  const evalCandidate = (idx: number) => {
    const smp = samples[idx];
    const dXZ = Math.hypot(x - smp.x, z - smp.z);
    let score = dXZ;
    if (typeof refY === 'number') {
      const dy = Math.abs(smp.y - refY);
      if (dy > 8.5) {
        score += dy * 1.9;
      } else {
        score += dy * 0.25;
      }
    }
    if (score < bestScore) {
      bestScore = score;
      bestDistXZ = dXZ;
      bestIdx = idx;
    }
  };

  for (let ox = -2; ox <= 2; ox++) {
    for (let oz = -2; oz <= 2; oz++) {
      const key = (gx + ox + 2048) * 4096 + (gz + oz + 2048);
      const bucket = grid.get(key);
      if (!bucket) continue;
      for (let k = 0; k < bucket.length; k++) {
        evalCandidate(bucket[k]);
      }
    }
  }

  if (bestIdx === -1) {
    for (let i = 0; i < samples.length; i += 3) {
      evalCandidate(i);
    }
  }

  return {
    sample: samples[Math.max(0, bestIdx)],
    distXZ: bestDistXZ,
  };
}

export function isInsideTrekMountainFootprint(x: number, z: number, refY?: number): boolean {
  if (typeof refY === 'number' && refY >= 2.2) return true;
  if (Math.hypot(x - TREK_PLATEAUS.trailhead.x, z - TREK_PLATEAUS.trailhead.z) <= 13.5) {
    return true;
  }
  const nx = (x - SAGARMATHA_PEAK_CENTER.x) / (SAGARMATHA_PEAK_CENTER.rx + 18);
  const nz = (z - SAGARMATHA_PEAK_CENTER.z) / (SAGARMATHA_PEAK_CENTER.rz + 18);
  return nx * nx + nz * nz <= 1.0 && z <= -132;
}

function distToSegmentXZ(
  px: number,
  pz: number,
  ax: number,
  az: number,
  bx: number,
  bz: number,
): { dist: number; t: number } {
  const vx = bx - ax;
  const vz = bz - az;
  const lenSq = vx * vx + vz * vz;
  if (lenSq < 1e-6) return { dist: Math.hypot(px - ax, pz - az), t: 0 };
  const t = clamp(((px - ax) * vx + (pz - az) * vz) / lenSq, 0, 1);
  const qx = ax + vx * t;
  const qz = az + vz * t;
  return { dist: Math.hypot(px - qx, pz - qz), t };
}

export function getTrekSurfaceHeightAt(x: number, z: number, refY?: number): number | null {
  const yCheck = typeof refY === 'number' ? refY : 0;

  // Flat Summit Spire plateau
  if (
    yCheck >= 204 &&
    Math.hypot(x - TREK_PLATEAUS.summit.x, z - TREK_PLATEAUS.summit.z) <= TREK_PLATEAUS.summit.radius + 1.2
  ) {
    return TREK_PLATEAUS.summit.y;
  }

  // Flat High Camp saddle
  if (
    yCheck >= 165 &&
    yCheck <= 190 &&
    Math.hypot(x - TREK_PLATEAUS.highCamp.x, z - TREK_PLATEAUS.highCamp.z) <= TREK_PLATEAUS.highCamp.radius + 0.8
  ) {
    return TREK_PLATEAUS.highCamp.y;
  }

  // Zone 5 Sherpa Teahouse Terrace + Cantilevered Panorama Deck
  if (yCheck >= 131 && yCheck <= 154) {
    const td = TREK_PLATEAUS.teahouseDeck;
    if (x >= td.minX && x <= td.maxX && z >= td.minZ && z <= td.maxZ) {
      return td.y;
    }
    if (Math.hypot(x - TREK_PLATEAUS.teahouse.x, z - TREK_PLATEAUS.teahouse.z) <= TREK_PLATEAUS.teahouse.radius) {
      return TREK_PLATEAUS.teahouse.y;
    }
  }

  // Zone 1 Trailhead plaza
  if (
    yCheck < 6.0 &&
    Math.hypot(x - TREK_PLATEAUS.trailhead.x, z - TREK_PLATEAUS.trailhead.z) <= TREK_PLATEAUS.trailhead.radius
  ) {
    return TREK_PLATEAUS.trailhead.y;
  }

  // Exact bridge spans
  for (const span of TREK_BRIDGE_SPANS) {
    const seg = distToSegmentXZ(x, z, span.start[0], span.start[2], span.end[0], span.end[2]);
    const midY = (span.start[1] + span.end[1]) * 0.5;
    if (seg.dist <= span.width * 0.72 && Math.abs(yCheck - midY) < 9.5) {
      const baseY = span.start[1] + (span.end[1] - span.start[1]) * seg.t;
      return baseY - Math.sin(seg.t * Math.PI) * span.sag;
    }
  }

  const { sample, distXZ } = findNearestTrekSample(x, z, refY);
  const halfW = sample.width * 0.5 + 0.65;
  if (distXZ <= halfW + 1.2) {
    // Interpolate seamlessly with neighboring sample along tangent
    const nIdx =
      (x - sample.x) * sample.tx + (z - sample.z) * sample.tz >= 0
        ? Math.min(TREK_SAMPLES.length - 1, sample.index + 1)
        : Math.max(0, sample.index - 1);
    const neighbor = TREK_SAMPLES[nIdx];
    const seg = distToSegmentXZ(x, z, sample.x, sample.z, neighbor.x, neighbor.z);
    return sample.y + (neighbor.y - sample.y) * seg.t;
  }

  return null;
}

export function isTrekPositionWalkable(x: number, z: number, refY?: number): boolean {
  const yCheck = typeof refY === 'number' ? refY : 0;

  if (
    yCheck >= 204 &&
    Math.hypot(x - TREK_PLATEAUS.summit.x, z - TREK_PLATEAUS.summit.z) <= TREK_PLATEAUS.summit.radius - 0.5
  ) {
    // Exclude Summit Chorten stone core at (32, -356.8)
    if (Math.hypot(x - TREK_KEY_SPOTS.summitChorten.x, z - TREK_KEY_SPOTS.summitChorten.z) < 1.35) {
      return false;
    }
    return true;
  }

  if (
    yCheck >= 165 &&
    yCheck <= 190 &&
    Math.hypot(x - TREK_PLATEAUS.highCamp.x, z - TREK_PLATEAUS.highCamp.z) <= TREK_PLATEAUS.highCamp.radius - 0.5
  ) {
    // Keep outside High Camp main expedition tent footprint
    if (Math.hypot(x - TREK_KEY_SPOTS.highCampTent.x, z - TREK_KEY_SPOTS.highCampTent.z) < 2.15) {
      return false;
    }
    return true;
  }

  if (yCheck >= 131 && yCheck <= 154) {
    const td = TREK_PLATEAUS.teahouseDeck;
    if (x >= td.minX + 0.3 && x <= td.maxX - 0.3 && z >= td.minZ + 0.3 && z <= td.maxZ - 0.3) {
      return true;
    }
    if (Math.hypot(x - TREK_PLATEAUS.teahouse.x, z - TREK_PLATEAUS.teahouse.z) <= TREK_PLATEAUS.teahouse.radius - 0.5) {
      // Keep out of Teahouse stone building walls centered behind terrace
      if (x >= 44.2 && x <= 53.8 && z >= -283.5 && z <= -276.8) {
        return false;
      }
      return true;
    }
  }

  if (
    yCheck < 6.0 &&
    Math.hypot(x - TREK_PLATEAUS.trailhead.x, z - TREK_PLATEAUS.trailhead.z) <= TREK_PLATEAUS.trailhead.radius
  ) {
    return true;
  }

  for (const span of TREK_BRIDGE_SPANS) {
    const seg = distToSegmentXZ(x, z, span.start[0], span.start[2], span.end[0], span.end[2]);
    const midY = (span.start[1] + span.end[1]) * 0.5;
    if (seg.dist <= span.width * 0.52 && Math.abs(yCheck - midY) < 9.5) {
      return true;
    }
  }

  const { sample, distXZ } = findNearestTrekSample(x, z, refY);
  const walkHalfW = sample.width * 0.5 + 0.35;
  return distXZ <= walkHalfW && (typeof refY !== 'number' || Math.abs(sample.y - refY) < 8.5);
}

export function getTrekFootstepSurface(x: number, y: number, z: number): TrekSurfaceKind | null {
  if (y < 1.2 && Math.hypot(x - TREK_PLATEAUS.trailhead.x, z - TREK_PLATEAUS.trailhead.z) > 8.5) {
    return null;
  }
  const { sample, distXZ } = findNearestTrekSample(x, z, y);
  if (distXZ <= sample.width + 2.5 || y >= 4.0) {
    if (y >= 139.5 && y <= 144.5 && z >= -272.5 && z <= -264 && Math.abs(x - 48) <= 9) {
      return 'wood';
    }
    return sample.surface;
  }
  return null;
}

/**
 * Analytical mountain heightfield for the visual sculpted Sagarmatha Trek Peak mesh.
 * Carves clean trail terraces on the spline and dramatic canyons beneath suspension bridges & crevasse ladder.
 */
export function computeSagarmathaPeakVisualHeight(x: number, z: number): number {
  const cx = SAGARMATHA_PEAK_CENTER.x;
  const cz = SAGARMATHA_PEAK_CENTER.z;
  const dx = (x - cx) / SAGARMATHA_PEAK_CENTER.rx;
  const dz = (z - cz) / SAGARMATHA_PEAK_CENTER.rz;
  const radial = Math.hypot(dx, dz);

  // Smooth transition down to 0 at valley floor edge so it joins diorama terrain without seams
  const env = 1 - smoothstep(0.68, 1.04, radial);
  if (env <= 0.0005) return 0;

  // Multi-arête sculpted Himalayan pyramid shape (sharp north-west, east, and south-west ridges)
  const angle = Math.atan2(dz, dx);
  const areteBoost =
    0.16 * Math.pow(Math.max(0, Math.cos(angle * 3.0 + 0.45)), 2.2) +
    0.10 * Math.pow(Math.max(0, Math.sin(angle * 5.0 - 0.8)), 2.0);
  const pyramid = Math.pow(Math.max(0, 1 - radial * (0.94 - areteBoost)), 1.22);

  const ridgeNoise =
    Math.sin(x * 0.045 + Math.cos(z * 0.038) * 1.4) * 5.2 +
    Math.cos(x * 0.092 - z * 0.084) * 3.1 +
    Math.sin(x * 0.21 + z * 0.17) * 1.4;

  let h = env * (pyramid * 214.5 + ridgeNoise * smoothstep(0.08, 0.45, pyramid));

  // Sub-peak shoulders framing the summit spire
  const eastShoulder = Math.max(0, 1 - Math.hypot((x - 106) / 64, (z + 322) / 58)) * 96;
  const westShoulder = Math.max(0, 1 - Math.hypot((x + 68) / 68, (z + 345) / 62)) * 132;
  const northFlank = Math.max(0, 1 - Math.hypot((x - 18) / 86, (z + 428) / 66)) * 144;
  h = Math.max(h, env * Math.max(eastShoulder, westShoulder, northFlank) + ridgeNoise * 0.5 * env);

  // Carve dramatic alpine gorges under Bridge 1, Bridge 2, and Zone 6 Crevasse
  const b1 = distToSegmentXZ(x, z, 104, -364, 76, -406);
  if (b1.dist < 18) {
    const notch = (1 - smoothstep(3, 18, b1.dist)) * Math.sin(b1.t * Math.PI);
    h = Math.min(h, 45.0 + b1.dist * 0.65) - notch * 4.0;
  }
  const b2 = distToSegmentXZ(x, z, -32, -412, -64, -382);
  if (b2.dist < 18) {
    const notch = (1 - smoothstep(3, 18, b2.dist)) * Math.sin(b2.t * Math.PI);
    h = Math.min(h, 66.0 + b2.dist * 0.7) - notch * 4.5;
  }
  const crev = distToSegmentXZ(x, z, -24, -367, -20, -353);
  if (crev.dist < 9.5) {
    const slot = (1 - smoothstep(1.4, 9.0, crev.dist)) * Math.sin(crev.t * Math.PI);
    h -= slot * 11.5;
  }

  // Sculpt crisp cut-and-fill ledges beneath non-bridge trail segments and plateaus
  const { sample, distXZ } = findNearestTrekSample(x, z, h);
  if (!sample.isBridge && distXZ < 10.5) {
    const trailT = 1 - smoothstep(sample.width * 0.55, 10.5, distXZ);
    const targetTrailBase = sample.y - 0.16;
    h = h + (targetTrailBase - h) * trailT;
  }

  // Flatten Teahouse Terrace, High Camp Saddle, and Summit Spire cap
  const dTea = Math.hypot(x - TREK_PLATEAUS.teahouse.x, z - TREK_PLATEAUS.teahouse.z);
  if (dTea < 14) {
    const t = 1 - smoothstep(8.2, 14, dTea);
    h = h + (TREK_PLATEAUS.teahouse.y - 0.14 - h) * t;
  }
  const dHigh = Math.hypot(x - TREK_PLATEAUS.highCamp.x, z - TREK_PLATEAUS.highCamp.z);
  if (dHigh < 13.5) {
    const t = 1 - smoothstep(7.8, 13.5, dHigh);
    h = h + (TREK_PLATEAUS.highCamp.y - 0.12 - h) * t;
  }
  const dSum = Math.hypot(x - TREK_PLATEAUS.summit.x, z - TREK_PLATEAUS.summit.z);
  if (dSum < 11.5) {
    const t = 1 - smoothstep(5.4, 11.5, dSum);
    h = h + (TREK_PLATEAUS.summit.y - 0.12 - h) * t;
  }

  // Keep Valley Trailhead apron flat at y=0..0.25
  const dHead = Math.hypot(x - TREK_PLATEAUS.trailhead.x, z - TREK_PLATEAUS.trailhead.z);
  if (dHead < 15) {
    const t = 1 - smoothstep(7.0, 15.0, dHead);
    h = h * (1 - t);
  }

  return Math.max(0, h);
}

export function computeHimalayaTrekAmbience(x: number, y: number, z: number): {
  onMountain: boolean;
  altitudeNorm: number;
  windStrength: number;
  waterfallGain: number;
  zone: TrekZoneMeta | null;
} {
  if (y < 2.0 && !isInsideTrekMountainFootprint(x, z, y)) {
    return { onMountain: false, altitudeNorm: 0, windStrength: 0, waterfallGain: 0, zone: null };
  }
  const { sample, distXZ } = findNearestTrekSample(x, z, y);
  const onMountain = y >= 2.2 || distXZ < 12;
  if (!onMountain) {
    return { onMountain: false, altitudeNorm: 0, windStrength: 0, waterfallGain: 0, zone: null };
  }
  const altitudeNorm = clamp(y / SAGARMATHA_PEAK_CENTER.summitY, 0, 1);
  const windStrength = clamp(0.18 + altitudeNorm * 0.82, 0, 1);
  const dWf = Math.hypot(
    x - TREK_KEY_SPOTS.waterfallCenter.x,
    y - TREK_KEY_SPOTS.waterfallCenter.y,
    z - TREK_KEY_SPOTS.waterfallCenter.z,
  );
  const waterfallGain = clamp(1 - dWf / 38, 0, 1);
  return {
    onMountain: true,
    altitudeNorm,
    windStrength,
    waterfallGain,
    zone: getTrekZoneAtProgress(sample.s, y),
  };
}

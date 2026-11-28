import { LandmarkData } from '../data/portfolioData';

/**
 * Single source of truth for the monumental 96m x 120m Pumdikot Mahadev Temple Complex
 * (Pokhara, Nepal) anchored directly on the main world ground plane (y = 0).
 */
export const PUMDIKOT_COMPLEX = {
  centerX: -50.0,
  centerZ: -88.0,
  halfX: 48.0, // world X: [-98 .. -2] (96m)
  halfZ: 60.0, // world Z: [-148 .. -28] (120m)
  groundY: 0.0,
  plazaY: 0.28,

  // South Crimson Entrance Gate & Heritage Approach
  southGateLocalZ: 60.0,
  southGateOpenHalfX: 3.4,

  // Inner Polygonal View Plaza Balustrade
  innerPlazaHalfX: 39.0,
  innerPlazaMinZ: -48.0,
  innerPlazaMaxZ: 45.0,
  innerPlazaChamfer: 9.5,

  // Sunken Turquoise Blue Sacred Pond (Shivakunda) in front-center of plaza
  pondLocalX: 0.0,
  pondLocalZ: 20.0,
  pondOuterHalf: 5.8,
  pondWaterHalf: 4.85,
  pondRailHalf: 6.25,
  pondWaterY: -0.14,
  pondFloorY: -0.92,
  pondCenterPedestalR: 1.45,

  // Giant Brass Kneeling Nandi Bull & Ceremonial Golden Trishul / Bell
  nandiLocalX: 0.0,
  nandiLocalZ: 5.2,
  nandiHalfX: 1.95,
  nandiHalfZ: 2.75,
  trishulLocalX: -9.8,
  trishulLocalZ: 9.6,
  bellLocalX: -12.4,
  bellLocalZ: 10.6,

  // Right-Side Stone Pagoda Shrine (Sumeru / Ganesh Mandir)
  ganeshLocalX: 24.5,
  ganeshLocalZ: 16.0,
  ganeshPlinthHalf: 3.45,

  // Monumental Two-Tier Blush-Pink Rotunda, Emerald Portico & Walkable Garbhagriha
  rotundaCenterLocalZ: -20.0,
  rotundaOuterR: 13.8,
  rotundaInnerR: 11.4,
  rotundaDoorHalfX: 2.25,
  garbhagrihaY: 0.48,
  lingamAltarR: 2.35,

  porticoHalfX: 4.75,
  porticoMinLocalZ: -6.5,
  porticoMaxLocalZ: -2.2,

  // Upper Circumambulation (Pradakshina) Terrace & White Ribbed Dome
  upperTerraceY: 6.25,
  upperTerraceInnerR: 10.1,
  upperTerraceOuterR: 14.5,
  domeRadius: 10.0,
  domeCrownY: 15.6,

  // Twin Symmetrical Split Staircases (flanking the emerald portico)
  stairLowerOuterX: 18.2,
  stairLowerInnerX: 14.2,
  stairLowerStartZ: -1.6,
  stairLowerEndZ: -6.8,
  stairMidLandingEndZ: -10.8,
  stairMidY: 2.45,
  stairUpperInnerX: 5.4,
  stairUpperMinZ: -10.6,
  stairUpperMaxZ: -6.8,

  // Upper Front Viewing Balcony above Portico
  balconyHalfX: 5.4,
  balconyMinZ: -10.6,
  balconyMaxZ: -5.4,
} as const;

export const PUMDIKOT_INTERACTIVE_SPOTS = {
  southGate: {
    x: PUMDIKOT_COMPLEX.centerX,
    z: PUMDIKOT_COMPLEX.centerZ + PUMDIKOT_COMPLEX.southGateLocalZ,
  },
  shivakundaCenter: {
    x: PUMDIKOT_COMPLEX.centerX + PUMDIKOT_COMPLEX.pondLocalX,
    z: PUMDIKOT_COMPLEX.centerZ + PUMDIKOT_COMPLEX.pondLocalZ,
  },
  nandiCenter: {
    x: PUMDIKOT_COMPLEX.centerX + PUMDIKOT_COMPLEX.nandiLocalX,
    z: PUMDIKOT_COMPLEX.centerZ + PUMDIKOT_COMPLEX.nandiLocalZ,
  },
  trishulBell: {
    x: PUMDIKOT_COMPLEX.centerX + PUMDIKOT_COMPLEX.bellLocalX,
    z: PUMDIKOT_COMPLEX.centerZ + PUMDIKOT_COMPLEX.bellLocalZ,
  },
  ganeshShrine: {
    x: PUMDIKOT_COMPLEX.centerX + PUMDIKOT_COMPLEX.ganeshLocalX,
    z: PUMDIKOT_COMPLEX.centerZ + PUMDIKOT_COMPLEX.ganeshLocalZ,
  },
  porticoEntrance: {
    x: PUMDIKOT_COMPLEX.centerX,
    z: PUMDIKOT_COMPLEX.centerZ + PUMDIKOT_COMPLEX.porticoMaxLocalZ - 1.2,
  },
  innerLingamCenter: {
    x: PUMDIKOT_COMPLEX.centerX,
    z: PUMDIKOT_COMPLEX.centerZ + PUMDIKOT_COMPLEX.rotundaCenterLocalZ,
  },
  upperTerracePlaque: {
    x: PUMDIKOT_COMPLEX.centerX,
    z: PUMDIKOT_COMPLEX.centerZ + PUMDIKOT_COMPLEX.rotundaCenterLocalZ + 12.2,
  },
} as const;

export const PUMDIKOT_HIGHLIGHTS = {
  shivakunda: {
    title: 'Shivakunda Sacred Pond · Pumdikot Plaza',
    subtitle: 'Turquoise Ceramic Tank & Central Shiva Lingam',
    description:
      'Centered on the diamond-patterned granite courtyard, the stepped turquoise-tiled Shivakunda holds consecrated Himalayan spring water around a carved black-stone Shiva Lingam, adorned with floating marigold blossoms and brushed stainless safety rails.',
  },
  innerSanctum: {
    title: 'Garbhagriha · Pumdikot Inner Sanctum',
    subtitle: 'Sphatik Crystal Shiva Lingam & Kailash Gallery',
    description:
      'Beneath the emerald-green Om portico and blush-pink rotunda walls lies the walkable circular Garbhagriha. A glowing Sphatik crystal and black Shaligram Shiva Lingam rests under a dripping silver Abhisheka Kalash, surrounded by Kailash murals, brass ghee lamps, and carved timber rafters.',
  },
  colossalShiva: {
    title: '108-ft Colossal Lord Shiva · Pumdikot Mahadev',
    subtitle: 'Pokhara, Nepal · White Ribbed Dome & 108 Lingams',
    description:
      'Rising above twin curved staircases and an upper Pradakshina walkway lined with 108 miniature Shiva Lingams, the sky-blue Neelakantha Mahadev sits in Padmasana atop a golden Tiger-Pelt throne—right palm raised in Abhaya blessing with "ॐ", left hand gripping an 18-meter golden Trishul and Damaru.',
  },
} as const;

export interface PumdikotLingamPlacement {
  index: number;
  angle: number;
  localX: number;
  localZ: number;
  worldX: number;
  worldZ: number;
}

let cached108Lingams: PumdikotLingamPlacement[] | null = null;

/**
 * Generates exact placements for the 108 miniature black-stone Shiva Lingams
 * circling the upper Pradakshina terrace (skipping the two curved stair landings).
 */
export function getPumdikot108LingamPlacements(): PumdikotLingamPlacement[] {
  if (cached108Lingams) return cached108Lingams;
  const c = PUMDIKOT_COMPLEX;
  const ringR = 13.45;
  const out: PumdikotLingamPlacement[] = [];
  // Distribute 108 evenly along the continuous upper ring arc avoiding the front stair landings
  // Front stair mouths sit around +Z side angles (~ ±22°..±38° from +Z).
  // Angle a=0 is South (+Z). We place across valid arc [0.68 rad .. 2*PI - 0.68 rad] plus center front balcony [-0.30..0.30]
  const totalCount = 108;
  const frontBalconyCount = 8;
  const mainArcCount = totalCount - frontBalconyCount;
  const minArc = 0.88;
  const maxArc = Math.PI * 2 - 0.88;

  for (let i = 0; i < mainArcCount; i++) {
    const t = i / (mainArcCount - 1);
    const a = minArc + t * (maxArc - minArc);
    const lx = Math.sin(a) * ringR;
    const lz = c.rotundaCenterLocalZ + Math.cos(a) * ringR;
    out.push({
      index: out.length,
      angle: a,
      localX: lx,
      localZ: lz,
      worldX: c.centerX + lx,
      worldZ: c.centerZ + lz,
    });
  }

  for (let i = 0; i < frontBalconyCount; i++) {
    const t = i / (frontBalconyCount - 1);
    const a = -0.28 + t * 0.56;
    const lx = Math.sin(a) * (ringR + 0.15);
    const lz = c.rotundaCenterLocalZ + Math.cos(a) * (ringR + 0.15);
    out.push({
      index: out.length,
      angle: a,
      localX: lx,
      localZ: lz,
      worldX: c.centerX + lx,
      worldZ: c.centerZ + lz,
    });
  }

  cached108Lingams = out;
  return out;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function isInPumdikotPrecinct(x: number, z: number, pad = 0): boolean {
  const c = PUMDIKOT_COMPLEX;
  return (
    Math.abs(x - c.centerX) <= c.halfX + pad &&
    Math.abs(z - c.centerZ) <= c.halfZ + pad
  );
}

export function isInPumdikotShivakunda(x: number, z: number): boolean {
  const c = PUMDIKOT_COMPLEX;
  const lx = x - c.centerX;
  const lz = z - c.centerZ;
  return (
    Math.abs(lx - c.pondLocalX) <= c.pondWaterHalf &&
    Math.abs(lz - c.pondLocalZ) <= c.pondWaterHalf
  );
}

export function isInPumdikotInnerSanctum(x: number, z: number, y = 0.5): boolean {
  const c = PUMDIKOT_COMPLEX;
  const lx = x - c.centerX;
  const lz = z - c.centerZ;
  const r = Math.hypot(lx, lz - c.rotundaCenterLocalZ);
  return y < 4.2 && r <= c.rotundaInnerR + 0.4;
}

export function getPumdikotSeparationMetrics(landmarks: ReadonlyArray<LandmarkData>): {
  minMonumentDist: number;
  toBoudhaMeters: number;
  toPashupatiMeters: number;
  toLumbiniMeters: number;
  toJanakiMeters: number;
} {
  const px = PUMDIKOT_COMPLEX.centerX;
  const pz = PUMDIKOT_COMPLEX.centerZ;
  const distTo = (id: string) => {
    const target = landmarks.find((l) => l.id === id);
    return target ? Math.hypot(px - target.position.x, pz - target.position.z) : 999;
  };
  const toBoudhaMeters = distTo('boudhanath-stupa');
  const toPashupatiMeters = distTo('kathmandu-stupa');
  const toLumbiniMeters = distTo('lumbini-buddha');
  const toJanakiMeters = distTo('janaki-mandir');
  return {
    minMonumentDist: Math.min(toBoudhaMeters, toPashupatiMeters, toLumbiniMeters, toJanakiMeters),
    toBoudhaMeters,
    toPashupatiMeters,
    toLumbiniMeters,
    toJanakiMeters,
  };
}

/**
 * Levels the main world ground plane smoothly inside & around the 96m x 120m Pumdikot precinct
 * at y = 0.0 so the plaza sits anchored cleanly on the main terrain without buried walls or seams.
 */
export function carvePumdikotGround(x: number, z: number, baseH: number): number {
  const c = PUMDIKOT_COMPLEX;
  const lx = x - c.centerX;
  const lz = z - c.centerZ;
  const outX = Math.max(0, Math.abs(lx) - (c.halfX + 6.0));
  const outZ = Math.max(0, Math.abs(lz) - (c.halfZ + 6.0));
  const dist = Math.hypot(outX, outZ);
  if (dist >= 20.0) return baseH;
  const blend = 1 - smoothstep(0, 20.0, dist);
  return baseH + (c.groundY - baseH) * blend;
}

/**
 * Returns exact walkable elevation inside the Pumdikot Mahadev Temple Complex:
 * - Outer gate ramp: 0.0 -> 0.28
 * - Diamond-tiled View Plaza: 0.28
 * - Emerald Portico & Walkable Garbhagriha Interior: 0.48
 * - Twin Symmetrical Split Staircases: smooth ramps 0.28 -> 2.45 -> 6.25
 * - Upper Pradakshina Terrace & Front Viewing Balcony: 6.25
 * Returns null outside Pumdikot precinct.
 */
export function getPumdikotSurfaceY(x: number, z: number, refY = 0): number | null {
  const c = PUMDIKOT_COMPLEX;
  const lx = x - c.centerX;
  const lz = z - c.centerZ;

  // Include South Gate outer approach apron up to +6.5m outside south fence
  if (Math.abs(lx) > c.halfX + 1.5 || lz < -c.halfZ - 1.5 || lz > c.halfZ + 6.5) {
    return null;
  }

  // Outer South Gate approach ramp outside fence (lz in [60.0 .. 65.5])
  if (lz > c.southGateLocalZ) {
    if (Math.abs(lx) <= c.southGateOpenHalfX + 1.6) {
      const t = Math.max(0, Math.min(1, 1 - (lz - c.southGateLocalZ) / 5.5));
      return c.groundY + (c.plazaY - c.groundY) * t;
    }
    return c.groundY;
  }

  // Side Ganesh Stone Pagoda raised stepped plinth
  const gx = Math.abs(lx - c.ganeshLocalX);
  const gz = Math.abs(lz - c.ganeshLocalZ);
  if (gx <= c.ganeshPlinthHalf && gz <= c.ganeshPlinthHalf) {
    return c.plazaY + 0.56;
  }
  if (lx >= c.ganeshLocalX - c.ganeshPlinthHalf - 1.6 && lx < c.ganeshLocalX - c.ganeshPlinthHalf && gz <= 1.5) {
    const t = 1 - (c.ganeshLocalX - c.ganeshPlinthHalf - lx) / 1.6;
    return c.plazaY + 0.56 * Math.max(0, Math.min(1, t));
  }

  // Twin Symmetrical Split Staircases (left/right mirror across lx = 0)
  const ax = Math.abs(lx);
  // 1. Lower South-facing flight: ax in [14.2 .. 18.2], lz in [-6.8 .. -1.6]
  if (ax >= c.stairLowerInnerX && ax <= c.stairLowerOuterX && lz <= c.stairLowerStartZ && lz >= c.stairLowerEndZ) {
    const t = (c.stairLowerStartZ - lz) / (c.stairLowerStartZ - c.stairLowerEndZ);
    return c.plazaY + (c.stairMidY - c.plazaY) * Math.max(0, Math.min(1, t));
  }
  // 2. Mid-landing: ax in [14.2 .. 18.2], lz in [-10.8 .. -6.8]
  if (ax >= c.stairLowerInnerX && ax <= c.stairLowerOuterX && lz < c.stairLowerEndZ && lz >= c.stairMidLandingEndZ) {
    return c.stairMidY;
  }
  // 3. Upper inward flight: ax in [5.4 .. 14.2], lz in [-10.6 .. -6.8]
  if (ax >= c.stairUpperInnerX && ax < c.stairLowerInnerX && lz >= c.stairUpperMinZ && lz <= c.stairUpperMaxZ) {
    const t = (c.stairLowerInnerX - ax) / (c.stairLowerInnerX - c.stairUpperInnerX);
    return c.stairMidY + (c.upperTerraceY - c.stairMidY) * Math.max(0, Math.min(1, t));
  }

  // Upper Terrace & Front Viewing Balcony when player is elevated (refY >= 4.2)
  const rRotunda = Math.hypot(lx, lz - c.rotundaCenterLocalZ);
  const inFrontBalcony =
    ax <= c.balconyHalfX && lz >= c.balconyMinZ && lz <= c.balconyMaxZ;
  const inUpperRing =
    rRotunda >= c.upperTerraceInnerR - 0.15 && rRotunda <= c.upperTerraceOuterR + 0.2;
  if (refY >= 4.2 && (inFrontBalcony || inUpperRing)) {
    return c.upperTerraceY;
  }

  // Inside Walkable Garbhagriha & Emerald-Green Portico (ground level)
  if (rRotunda <= c.rotundaInnerR + 1.2) {
    return c.garbhagrihaY;
  }
  if (ax <= c.porticoHalfX && lz >= c.porticoMinLocalZ && lz <= c.porticoMaxLocalZ) {
    const stepT = Math.max(0, Math.min(1, (c.porticoMaxLocalZ - lz) / 1.1));
    return c.plazaY + (c.garbhagrihaY - c.plazaY) * stepT;
  }

  // Sunken Blue Shivakunda interior basin (if probed)
  if (
    Math.abs(lx - c.pondLocalX) <= c.pondWaterHalf &&
    Math.abs(lz - c.pondLocalZ) <= c.pondWaterHalf
  ) {
    return c.pondFloorY;
  }

  // Main Diamond-Tiled Plaza
  if (Math.abs(lx) <= c.halfX - 1.2 && lz >= -c.halfZ + 1.2 && lz <= c.southGateLocalZ) {
    return c.plazaY;
  }

  return c.groundY;
}

/**
 * Checks walkability inside Pumdikot: allows entering through the South Crimson Gate,
 * walking across the diamond plaza, inside the Garbhagriha around the central crystal Lingam,
 * climbing up the twin curved staircases, and circumambulating the 108-Lingam upper terrace.
 */
export function isPumdikotWalkable(x: number, z: number, refY = 0): boolean {
  const c = PUMDIKOT_COMPLEX;
  const lx = x - c.centerX;
  const lz = z - c.centerZ;
  if (Math.abs(lx) > c.halfX + 1.5 || Math.abs(lz) > c.halfZ + 1.5) {
    return true;
  }

  const ax = Math.abs(lx);

  // 1. Outer Perimeter Fence (96m x 120m) with open 6.8m South Gate
  if (Math.abs(lz - c.halfZ) <= 0.52) {
    if (ax >= c.southGateOpenHalfX - 0.35) return false;
  }
  if (Math.abs(lz + c.halfZ) <= 0.52) return false;
  if (Math.abs(ax - c.halfX) <= 0.52) return false;
  // South Gate Piers
  if (
    Math.abs(lz - c.southGateLocalZ) <= 0.95 &&
    Math.abs(ax - (c.southGateOpenHalfX + 0.55)) <= 0.72
  ) {
    return false;
  }

  // 2. Inner Polygonal View Plaza White Stone Balustrade
  const inInnerXRange = ax <= c.innerPlazaHalfX + 0.55;
  const inInnerZRange = lz >= c.innerPlazaMinZ - 0.55 && lz <= c.innerPlazaMaxZ + 0.55;
  if (inInnerXRange && inInnerZRange) {
    // South & North balustrade walls (South leaves wide ±4.2m central approach)
    if (Math.abs(lz - c.innerPlazaMaxZ) <= 0.42 && ax >= 4.2 && ax <= c.innerPlazaHalfX - c.innerPlazaChamfer) {
      return false;
    }
    if (Math.abs(lz - c.innerPlazaMinZ) <= 0.42 && ax <= c.innerPlazaHalfX - c.innerPlazaChamfer) {
      return false;
    }
    // East & West balustrade walls
    if (
      Math.abs(ax - c.innerPlazaHalfX) <= 0.42 &&
      lz >= c.innerPlazaMinZ + c.innerPlazaChamfer &&
      lz <= c.innerPlazaMaxZ - c.innerPlazaChamfer
    ) {
      return false;
    }
    // Diagonal octagonal chamfer corners
    const dxCorner = ax - (c.innerPlazaHalfX - c.innerPlazaChamfer);
    const dzSouth = lz - (c.innerPlazaMaxZ - c.innerPlazaChamfer);
    const dzNorth = (c.innerPlazaMinZ + c.innerPlazaChamfer) - lz;
    if (dxCorner > 0 && dzSouth > 0 && Math.abs(dxCorner + dzSouth - c.innerPlazaChamfer) <= 0.45) {
      return false;
    }
    if (dxCorner > 0 && dzNorth > 0 && Math.abs(dxCorner + dzNorth - c.innerPlazaChamfer) <= 0.45) {
      return false;
    }
  }

  // 3. Elevated Upper Pradakshina Terrace vs Ground Floor collisions
  const rRotunda = Math.hypot(lx, lz - c.rotundaCenterLocalZ);
  const onUpperDeck = refY >= 4.2;

  if (onUpperDeck) {
    // Inner White Ribbed Dome core blocks walking through dome
    if (rRotunda < c.domeRadius + 0.35) return false;
    // Front stair arrival gaps stay open (ax in [5.0 .. 14.5] near balcony front)
    const atStairMouth =
      ax >= 5.0 && ax <= 15.0 && lz >= c.stairUpperMinZ - 0.3 && lz <= c.stairUpperMaxZ + 0.4;
    const onBalcony =
      ax <= c.balconyHalfX - 0.35 && lz >= c.balconyMinZ && lz <= c.balconyMaxZ - 0.38;
    // Outer upper parapet rail (skip stair mouths & front viewing balcony edge)
    if (!atStairMouth && !onBalcony && rRotunda >= c.upperTerraceOuterR - 0.45) {
      return false;
    }
    // Front balcony South parapet rail
    if (ax <= c.balconyHalfX && Math.abs(lz - c.balconyMaxZ) <= 0.42) {
      return false;
    }
    // Keep player from stepping off side stair edges above ground
    if (ax >= c.stairUpperInnerX && ax <= c.stairLowerInnerX && lz >= c.stairUpperMinZ && lz <= c.stairUpperMaxZ) {
      if (lz < c.stairUpperMinZ + 0.38 || lz > c.stairUpperMaxZ - 0.38) return false;
    }
    return true;
  }

  // Ground-level collisions (refY < 4.2)
  // 4. Sunken Blue Shivakunda Pond + Safety Rail
  if (
    Math.abs(lx - c.pondLocalX) <= c.pondRailHalf &&
    Math.abs(lz - c.pondLocalZ) <= c.pondRailHalf
  ) {
    return false;
  }

  // 5. Giant Brass Nandi Bull Plinth + Rail
  if (
    Math.abs(lx - c.nandiLocalX) <= c.nandiHalfX + 0.25 &&
    Math.abs(lz - c.nandiLocalZ) <= c.nandiHalfZ + 0.25
  ) {
    return false;
  }

  // 6. Ceremonial Golden Trishul & Bell Pavilion
  if (Math.hypot(lx - c.trishulLocalX, lz - c.trishulLocalZ) <= 1.55) return false;
  if (Math.hypot(lx - c.bellLocalX, lz - c.bellLocalZ) <= 1.1) return false;

  // 7. Side Stone Pagoda (Sumeru / Ganesh Mandir) sanctuary core (stepped plinth stays walkable around alcove front)
  const gx = Math.abs(lx - c.ganeshLocalX);
  const gz = Math.abs(lz - c.ganeshLocalZ);
  if (gx <= 2.05 && gz <= 2.05) return false;

  // 8. Portico Columns (4 sculpted pillars flanking ±2.65 & ±4.35 at lz = -2.65)
  for (const px of [-4.35, -2.55, 2.55, 4.35]) {
    if (Math.hypot(lx - px, lz + 2.65) <= 0.58) return false;
  }

  // 9. Twin Staircases side retaining walls on ground level (only front stair entry lz > -2.0 is open)
  if (ax >= c.stairLowerInnerX - 0.4 && ax <= c.stairLowerOuterX + 0.4 && lz >= c.stairMidLandingEndZ && lz < c.stairLowerStartZ - 0.2) {
    // Allow walking UP the lower flight from South, block walking sideways into staircase masonry
    if (ax < c.stairLowerInnerX + 0.25 || ax > c.stairLowerOuterX - 0.25) {
      return false;
    }
  }
  if (ax >= c.stairUpperInnerX && ax < c.stairLowerInnerX && lz >= c.stairUpperMinZ - 0.4 && lz <= c.stairUpperMaxZ + 0.4) {
    return false; // upper flight sits elevated above ground plaza walls
  }

  // 10. Hollow Rotunda Masonry Shell (r in [11.2 .. 14.0]) with open 4.5m South Portal
  const inSouthDoorway = ax <= c.rotundaDoorHalfX && lz > c.rotundaCenterLocalZ;
  if (rRotunda >= c.rotundaInnerR - 0.15 && rRotunda <= c.rotundaOuterR + 0.25 && !inSouthDoorway) {
    return false;
  }

  // 11. Central Garbhagriha Sphatik Shiva Lingam Altar Rail
  if (rRotunda <= c.lingamAltarR) {
    return false;
  }

  return true;
}

export function isInPumdikotHardSurface(x: number, z: number): boolean {
  const c = PUMDIKOT_COMPLEX;
  const lx = x - c.centerX;
  const lz = z - c.centerZ;
  return (
    Math.abs(lx) <= c.halfX + 0.6 &&
    lz >= -c.halfZ - 0.6 &&
    lz <= c.halfZ + 5.8
  );
}

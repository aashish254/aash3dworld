export interface BoudhaSeparationMetrics {
  toLumbiniMeters: number;
  toPashupatiMeters: number;
  toJanakiMeters: number;
}

export const BOUDHA_COMPLEX = {
  centerX: -308,
  centerZ: 302,
  halfSize: 58.0, // 116m x 116m precinct: world X [-366..-250], world Z [244..360]
  groundY: 0.25,
  plazaY: 0.35,
  tier1Radius: 22.0,
  tier2Radius: 18.8,
  tier3Radius: 16.0,
  tier1Y: 2.05,
  tier2Y: 3.85,
  tier3Y: 5.65,
  domeRadius: 13.6,
  stairHalfW: 2.05,
  // Northern Tibetan Monastery (Gompa)
  gompaCenterZ: -43.5,
  gompaHalfX: 11.5,
  gompaMinZ: -51.5,
  gompaMaxZ: -35.5,
  gompaFloorY: 0.55,
  gompaDoorHalfX: 2.15,
  // Ajima (Hariti) Southern Shrine off-axis
  ajimaLocalX: -14.5,
  ajimaLocalZ: 34.5,
} as const;

export const BOUDHA_HIGHLIGHTS = {
  koraWheels: {
    title: '108 Mani Prayer Wheels · Boudhanath Kora',
    subtitle: 'UNESCO World Heritage · Kathmandu, Nepal',
    description:
      'Pilgrims walk clockwise in Kora around Boudhanath’s massive 44m Mandala base, spinning rows of copper-and-brass Mani wheels embossed with "Om Mani Padme Hum" to send compassionate blessings into the Himalayan wind.',
  },
  gompaAltar: {
    title: 'Samtenling Tibetan Gompa & Singing Bowl',
    subtitle: '108 Butter Lamps · Guru Rinpoche & Shakyamuni Altar',
    description:
      'Inside the red-and-gold monastic hall north of the Great Stupa, butter lamps illuminate silk Thangkas and golden statues of Shakyamuni Buddha and Padmasambhava while a giant prayer wheel and bronze singing bowl anchor daily chanting.',
  },
  buddhaEyes: {
    title: 'All-Seeing Wisdom Eyes & Nepali Numeral "१"',
    subtitle: 'Boudhanath Harmika & 13-Step Bodhi Spire',
    description:
      'Looking out toward the four cardinal directions from the gilded Harmika, the serene blue-and-white Wisdom Eyes symbolize the Buddha’s omnipresent awareness above the curly Nepali numeral "१" (Ek), signifying unity of all beings.',
  },
} as const;

export const BOUDHA_INTERACTIVE_SPOTS = {
  gompaBowl: {
    x: BOUDHA_COMPLEX.centerX + 0,
    z: BOUDHA_COMPLEX.centerZ - 45.6,
    label: 'Ring Monastery Singing Bowl & Light Butter Lamps',
  },
  gompaWheel: {
    x: BOUDHA_COMPLEX.centerX + 7.6,
    z: BOUDHA_COMPLEX.centerZ - 43.0,
    label: 'Spin Giant Monastery Prayer Wheel',
  },
  ajimaShrine: {
    x: BOUDHA_COMPLEX.centerX + BOUDHA_COMPLEX.ajimaLocalX,
    z: BOUDHA_COMPLEX.centerZ + BOUDHA_COMPLEX.ajimaLocalZ + 3.4,
    label: 'Offer Incense at Ajima (Hariti) Shrine',
  },
} as const;

export function getBoudhaSeparationMetrics(
  landmarks: ReadonlyArray<{ id: string; position: { x: number; z: number } }>,
): BoudhaSeparationMetrics {
  const boudha = landmarks.find((l) => l.id === 'boudhanath-stupa') ?? {
    position: { x: BOUDHA_COMPLEX.centerX, z: BOUDHA_COMPLEX.centerZ },
  };
  const distTo = (id: string) => {
    const target = landmarks.find((l) => l.id === id);
    if (!target) return 999;
    return Math.hypot(boudha.position.x - target.position.x, boudha.position.z - target.position.z);
  };
  return {
    toLumbiniMeters: distTo('lumbini-buddha'),
    toPashupatiMeters: distTo('kathmandu-stupa'),
    toJanakiMeters: distTo('janaki-mandir'),
  };
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Signed/boolean membership inside the authentic 3-projection indented Mandala plinth (Medhi).
 */
export function isInsideBoudhaMandalaTier(lx: number, lz: number, outerRadius: number): boolean {
  const ax = Math.abs(lx);
  const az = Math.abs(lz);
  return (
    (ax <= outerRadius && az <= outerRadius * 0.54) ||
    (az <= outerRadius && ax <= outerRadius * 0.54) ||
    (ax <= outerRadius * 0.82 && az <= outerRadius * 0.74) ||
    (az <= outerRadius * 0.82 && ax <= outerRadius * 0.74)
  );
}

/**
 * Distance to the outer indented perimeter edge of a Mandala tier (0 right on edge, >0 outside, <0 inside).
 */
function mandalaTierEdgeMargin(lx: number, lz: number, outerRadius: number): number {
  const ax = Math.abs(lx);
  const az = Math.abs(lz);
  const rectDist = (hx: number, hz: number) => Math.max(ax - hx, az - hz);
  return Math.min(
    rectDist(outerRadius, outerRadius * 0.54),
    rectDist(outerRadius * 0.54, outerRadius),
    rectDist(outerRadius * 0.82, outerRadius * 0.74),
    rectDist(outerRadius * 0.74, outerRadius * 0.82),
  );
}

export function isInBoudhaPrecinct(x: number, z: number, pad = 0): boolean {
  const c = BOUDHA_COMPLEX;
  return (
    Math.abs(x - c.centerX) <= c.halfSize + pad &&
    Math.abs(z - c.centerZ) <= c.halfSize + pad
  );
}

/**
 * Smoothly levels the terrain base inside & around the 116m x 116m Boudhanath Stupa & Kora Plaza.
 */
export function carveBoudhanathGround(x: number, z: number, baseH: number): number {
  const c = BOUDHA_COMPLEX;
  const lx = x - c.centerX;
  const lz = z - c.centerZ;
  const outX = Math.max(0, Math.abs(lx) - (c.halfSize + 10));
  const outZ = Math.max(0, Math.abs(lz) - (c.halfSize + 10));
  const dist = Math.hypot(outX, outZ);
  if (dist >= 26) return baseH;
  const blend = 1 - smoothstep(0, 26, dist);
  return baseH + (c.groundY - baseH) * blend;
}

/**
 * Exact walkable surface elevation inside Boudhanath (Granite Kora Plaza, 4 Cardinal Stairs,
 * 3 Climbable Mandala Terraces, Northern Gompa Ramp & Floor), or null outside precinct.
 */
export function getBoudhanathSurfaceY(x: number, z: number): number | null {
  const c = BOUDHA_COMPLEX;
  const lx = x - c.centerX;
  const lz = z - c.centerZ;

  // Include outer gate approach aprons up to +6.5m beyond fence
  if (Math.abs(lx) > c.halfSize + 6.5 || Math.abs(lz) > c.halfSize + 6.5) {
    return null;
  }

  // Outside fence: only South, East, North gate entrance aprons
  if (Math.abs(lx) > c.halfSize || Math.abs(lz) > c.halfSize) {
    const onSouthApron = Math.abs(lx) <= 4.6 && lz >= c.halfSize && lz <= c.halfSize + 6.5;
    const onEastApron = Math.abs(lz) <= 4.2 && lx >= c.halfSize && lx <= c.halfSize + 6.5;
    const onNorthApron = Math.abs(lx) <= 4.2 && lz <= -c.halfSize && lz >= -c.halfSize - 6.5;
    if (onSouthApron || onEastApron || onNorthApron) {
      return c.plazaY;
    }
    return null;
  }

  // 1. Check Northern Gompa interior & South approach steps
  if (Math.abs(lx) <= c.gompaHalfX && lz >= c.gompaMinZ && lz <= c.gompaMaxZ) {
    return c.gompaFloorY;
  }
  if (Math.abs(lx) <= 2.6 && lz > c.gompaMaxZ && lz <= c.gompaMaxZ + 2.2) {
    const t = 1 - (lz - c.gompaMaxZ) / 2.2;
    return c.plazaY + (c.gompaFloorY - c.plazaY) * t;
  }

  // 2. Check 4 Cardinal Mandala Staircases (climb smoothly plaza 0.35 -> tier1 2.05 -> tier2 3.85 -> tier3 5.65)
  const checkStairAxis = (along: number, perpAbs: number): number | null => {
    if (perpAbs > c.stairHalfW) return null;
    if (along >= 22.0 && along <= 25.8) {
      const t = 1 - (along - 22.0) / 3.8;
      return c.plazaY + (c.tier1Y - c.plazaY) * t;
    }
    if (along > 21.2 && along < 22.0) return c.tier1Y;
    if (along >= 18.8 && along <= 21.2) {
      const t = 1 - (along - 18.8) / 2.4;
      return c.tier1Y + (c.tier2Y - c.tier1Y) * t;
    }
    if (along > 18.1 && along < 18.8) return c.tier2Y;
    if (along >= 16.0 && along <= 18.1) {
      const t = 1 - (along - 16.0) / 2.1;
      return c.tier2Y + (c.tier3Y - c.tier2Y) * t;
    }
    return null;
  };

  const sSouth = checkStairAxis(lz, Math.abs(lx));
  if (sSouth !== null) return sSouth;
  const sNorth = checkStairAxis(-lz, Math.abs(lx));
  if (sNorth !== null) return sNorth;
  const sEast = checkStairAxis(lx, Math.abs(lz));
  if (sEast !== null) return sEast;
  const sWest = checkStairAxis(-lx, Math.abs(lz));
  if (sWest !== null) return sWest;

  // 3. Mandala Plinth Terraces (Tier 3 highest -> Tier 2 -> Tier 1)
  if (isInsideBoudhaMandalaTier(lx, lz, c.tier3Radius)) return c.tier3Y;
  if (isInsideBoudhaMandalaTier(lx, lz, c.tier2Radius)) return c.tier2Y;
  if (isInsideBoudhaMandalaTier(lx, lz, c.tier1Radius)) return c.tier1Y;

  return c.plazaY;
}

export function isInBoudhaHardSurface(x: number, z: number): boolean {
  return getBoudhanathSurfaceY(x, z) !== null;
}

export function isBoudhanathWalkable(x: number, z: number): boolean {
  const c = BOUDHA_COMPLEX;
  const lx = x - c.centerX;
  const lz = z - c.centerZ;
  if (Math.abs(lx) > c.halfSize + 1.0 || Math.abs(lz) > c.halfSize + 1.0) {
    return true;
  }

  // 1. Perimeter Fence walls (leave South, East, North gates cleanly open)
  const onSouthFence = Math.abs(lz - c.halfSize) <= 0.55 && Math.abs(lx) >= 3.85;
  const onNorthFence = Math.abs(lz + c.halfSize) <= 0.55 && Math.abs(lx) >= 3.45;
  const onEastFence = Math.abs(lx - c.halfSize) <= 0.55 && Math.abs(lz) >= 3.45;
  const onWestFence = Math.abs(lx + c.halfSize) <= 0.55;
  if (onSouthFence || onNorthFence || onEastFence || onWestFence) {
    return false;
  }

  // Main Kora Dwar Gatehouse flanking piers & Snow Lions
  if (Math.abs(Math.abs(lx) - 4.45) <= 0.85 && Math.abs(lz - c.halfSize) <= 1.25) return false;
  if (Math.abs(Math.abs(lx) - 3.6) <= 0.65 && Math.abs(lz - (c.halfSize - 2.6)) <= 0.75) return false;
  if (Math.abs(lx - 4.8) <= 0.85 && Math.abs(lz - (c.halfSize - 4.8)) <= 0.55) return false; // Heritage plaque
  // East & North Gate piers
  if (Math.abs(lx - c.halfSize) <= 0.85 && Math.abs(Math.abs(lz) - 3.95) <= 0.75) return false;
  if (Math.abs(lz + c.halfSize) <= 0.85 && Math.abs(Math.abs(lx) - 3.95) <= 0.75) return false;

  // 2. Massive White Stupa Dome (Anda) core
  if (Math.hypot(lx, lz) <= c.domeRadius + 0.35) {
    return false;
  }

  // 3. Cardinal stair cheek walls / Snow Lion balustrades (stair corridor |perp| <= 2.05 stays open!)
  const checkCheek = (along: number, perpAbs: number) =>
    along >= 15.8 && along <= 25.8 && perpAbs > c.stairHalfW && perpAbs <= c.stairHalfW + 0.95;
  if (
    checkCheek(lz, Math.abs(lx)) ||
    checkCheek(-lz, Math.abs(lx)) ||
    checkCheek(lx, Math.abs(lz)) ||
    checkCheek(-lx, Math.abs(lz))
  ) {
    return false;
  }

  // 4. Vertical terrace risers / low parapet walls between Tier 1/2/3 except at 4 cardinal stair openings
  const inCardinalStairOpening =
    Math.abs(lx) <= c.stairHalfW || Math.abs(lz) <= c.stairHalfW;
  if (!inCardinalStairOpening) {
    for (const r of [c.tier1Radius, c.tier2Radius, c.tier3Radius]) {
      if (Math.abs(mandalaTierEdgeMargin(lx, lz, r)) <= 0.34) {
        return false;
      }
    }
  }

  // 5. Walkable Northern Tibetan Monastery (Gompa): hollow walls & interior pillars/altar/wheel
  if (Math.abs(lx) <= c.gompaHalfX + 0.45 && lz >= c.gompaMinZ - 0.45 && lz <= c.gompaMaxZ + 0.45) {
    const insideRoom =
      Math.abs(lx) <= c.gompaHalfX - 1.0 && lz >= c.gompaMinZ + 1.0 && lz <= c.gompaMaxZ - 1.0;
    const inFrontDoor = Math.abs(lx) <= c.gompaDoorHalfX && lz >= c.gompaMaxZ - 1.2;
    if (!insideRoom && !inFrontDoor) {
      return false;
    }
    // Interior Main Shakyamuni/Padmasambhava Altar & Butter Lamp table at back North wall
    if (Math.abs(lx) <= 4.4 && lz <= -46.8) return false;
    // Giant floor-to-ceiling Prayer Wheel inside East wing
    if (Math.hypot(lx - 7.6, lz + 43.0) <= 1.55) return false;
    // Four Red-Lacquer Monastery Hall Columns & Side Cushion Benches
    for (const px of [-4.6, 4.6]) {
      for (const pz of [-40.5, -45.5]) {
        if (Math.hypot(lx - px, lz - pz) <= 0.58) return false;
      }
    }
    if (Math.abs(lx + 8.6) <= 1.25 && lz >= -48.5 && lz <= -38.5) return false;
  }

  // 6. Ajima (Hariti) Southern Pagoda Shrine off-axis (-14.5, +34.5)
  if (Math.abs(lx - c.ajimaLocalX) <= 2.95 && Math.abs(lz - c.ajimaLocalZ) <= 2.95) {
    return false;
  }

  // 7. Perimeter Kora Houses & Stalls lining diagonal/outer edges (radius 44..57, keeping gates/Gompa open)
  const houses: Array<[number, number, number, number]> = [
    [-46.0, -28.0, 5.5, 9.0],
    [-46.0, 0.0, 5.5, 9.0],
    [-46.0, 28.0, 5.5, 9.0],
    [-33.0, 46.5, 8.5, 5.0],
    [33.0, 46.5, 8.5, 5.0],
    [46.0, -28.0, 5.5, 9.0],
    [46.0, 28.0, 5.5, 9.0],
    [-34.0, -45.0, 7.5, 5.0],
    [34.0, -45.0, 7.5, 5.0],
  ];
  for (const [hx, hz, hw, hd] of houses) {
    if (Math.abs(lx - hx) <= hw + 0.4 && Math.abs(lz - hz) <= hd + 0.4) {
      return false;
    }
  }

  // Thangka & Singing Bowl merchant stalls along diagonal mid-ring
  const stalls: Array<[number, number]> = [
    [-33.5, 21.5],
    [33.5, 21.5],
    [-33.5, -21.5],
    [33.5, -21.5],
  ];
  for (const [sx, sz] of stalls) {
    if (Math.abs(lx - sx) <= 2.4 && Math.abs(lz - sz) <= 1.7) return false;
  }

  return true;
}

/**
 * Generates coordinates & orientation for the 108 Kora brass prayer wheels mounted along
 * the circular stone Kora wall niche ring surrounding the Mandala plinth.
 */
export function getBoudha108PrayerWheelPlacements(): Array<{
  localX: number;
  localY: number;
  localZ: number;
  worldX: number;
  worldZ: number;
  yaw: number;
}> {
  const c = BOUDHA_COMPLEX;
  const out: Array<{
    localX: number;
    localY: number;
    localZ: number;
    worldX: number;
    worldZ: number;
    yaw: number;
  }> = [];
  // Place 108 wheels evenly in 4 bays of 27 around the outer circular Kora balustrade/wall (r = 28.4m),
  // cleanly skipping the 4 cardinal avenue corridors (|angle gap| around ±90°)
  const bays = 4;
  const perBay = 27;
  const ringR = 28.4;
  const arcHalf = Math.PI * 0.25 - 0.14; // keep ±0.14 rad (~4m) cardinal walkways clear!
  for (let b = 0; b < bays; b++) {
    const centerAng = Math.PI * 0.25 + b * (Math.PI * 0.5); // NE, NW, SW, SE quadrants
    for (let k = 0; k < perBay; k++) {
      const t = (k + 0.5) / perBay - 0.5;
      const a = centerAng + t * (arcHalf * 2);
      const localX = Math.cos(a) * ringR;
      const localZ = Math.sin(a) * ringR;
      out.push({
        localX,
        localY: c.plazaY + 1.08,
        localZ,
        worldX: c.centerX + localX,
        worldZ: c.centerZ + localZ,
        yaw: -a + Math.PI * 0.5,
      });
    }
  }
  return out;
}

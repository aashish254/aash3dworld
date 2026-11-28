import { LandmarkData } from '../data/portfolioData';

/**
 * Single source of truth for the monumental 108m x 124m Pashupatinath Temple Complex,
 * Bagmati River (28m wide), Aryaghat / Surya Ghat, Arched Newari Bridge, and
 * Pandra Shivalaya / Sleshmantak Forest East Bank.
 */
export const PASHUPATI_COMPLEX = {
  centerX: -28.0,
  centerZ: 300.0,

  // 108m (X) x 124m (Z) outer sacred precinct along West Bank of real Bagmati River (x=26)
  minX: -82.0, // -28 - 54 (Paschim Dwar Western Gate)
  maxX: 26.0, // -28 + 54 (Ghat top promenade crest overlooking real Bagmati River)
  minZ: 238.0, // 300 - 62 (North Gate -> 88.5m clear parkland south of Janaki South Wall z=149.5)
  maxZ: 362.0, // 300 + 62 (South Gate)
  courtyardY: 0.28,

  // Main Pagoda Temple 3-tier Peti plinth (24m x 24m outer footprint -> ±12m)
  plinthOuterHalf: 12.0,
  plinthDeckHalf: 10.2,
  plinthDeckY: 2.08, // 0.28 + 1.80m three-tier stone plinth
  sanctumOuterHalf: 7.8, // 15.6m x 15.6m Dachi Appa brick sanctum walls
  sanctumWallThick: 0.92, // walls span [6.88..7.80]
  sanctumDoorHalf: 1.75, // 3.5m wide open cardinal silver portals
  railingHalf: 2.8, // Central Garbhagriha brass-and-timber railing (5.6m x 5.6m)

  // Western Approach Plaza (aligned straight south on x=-92 from Janaki South Gate) & Paschim Dwar
  westGateCenterZ: 300.0,
  westGateOpenHalfZ: 2.6,
  northGateCenterX: -28.0,
  southGateCenterX: -28.0,
  nsGateOpenHalfX: 2.3,

  // Real Existing Bagmati River Alley (centered along x=34.0, wide 9.1m open channel between granite ghats)
  ghatTopX: 26.0,
  riverMinX: 28.8,
  riverMaxX: 39.2,
  riverCenterX: 34.0,
  riverMinZ: 236.0,
  riverMaxZ: 364.0,
  riverWaterY: -0.34,
  riverBedY: -1.65,

  // Arched Multi-Span Newari Brick-and-Stone Bagmati Bridge crossing the real river
  bridgeMinX: 25.8,
  bridgeMaxX: 41.8,
  bridgeCenterZ: 300.0,
  bridgeHalfZ: 2.75,
  bridgeBaseY: 0.34,
  bridgeApexLift: 1.45,

  // Pandra Shivalaya East-Bank Terrace & Sleshmantak Forest across the real Bagmati River
  eastBankMinX: 41.5,
  eastBankMaxX: 62.0,
  eastBankMinZ: 238.0,
  eastBankMaxZ: 362.0,
  eastBankY: 0.42,
  sleshmantakMaxX: 90.0,
} as const;

export const PASHUPATI_INTERACTIVE_SPOTS = {
  shivaLingamCenter: { x: PASHUPATI_COMPLEX.centerX, z: PASHUPATI_COMPLEX.centerZ },
  nandiPedestalCenter: { x: PASHUPATI_COMPLEX.centerX - 19.5, z: PASHUPATI_COMPLEX.centerZ },
  ghantaBellWorld: { x: PASHUPATI_COMPLEX.centerX - 25.0, y: 2.6, z: PASHUPATI_COMPLEX.centerZ + 14.0 },
  gheeLampRacks: [
    { x: PASHUPATI_COMPLEX.centerX - 15.5, z: PASHUPATI_COMPLEX.centerZ - 6.8, label: 'North Ghee-Lamp Rack' },
    { x: PASHUPATI_COMPLEX.centerX - 15.5, z: PASHUPATI_COMPLEX.centerZ + 6.8, label: 'South Ghee-Lamp Rack' },
  ] as ReadonlyArray<{ x: number; z: number; label: string }>,
  aaratiTerraceCenter: { x: 27.5, z: 300.0 },
  aaratiStands: [
    { x: 28.0, z: 294.4 },
    { x: 28.0, z: 296.7 },
    { x: 28.0, z: 303.3 },
    { x: 28.0, z: 305.6 },
  ] as ReadonlyArray<{ x: number; z: number }>,
  vasukiShrineCenter: { x: PASHUPATI_COMPLEX.centerX + 24.0, z: PASHUPATI_COMPLEX.centerZ - 24.0 },
  trishulMonumentCenter: { x: PASHUPATI_COMPLEX.centerX - 27.0, z: PASHUPATI_COMPLEX.centerZ - 14.5 },
  dhungeDharaCenter: { x: PASHUPATI_COMPLEX.centerX - 36.0, z: PASHUPATI_COMPLEX.centerZ - 16.0 },
  juttaGharCenter: { x: PASHUPATI_COMPLEX.minX - 8.5, z: PASHUPATI_COMPLEX.centerZ + 10.5 },
} as const;

export const PASHUPATI_SHIKHARA_POSITIONS: ReadonlyArray<[number, number, number]> = [
  // [localX, localZ, scale]
  [-24.0, -36.0, 1.05],
  [-8.0, -38.0, 0.96],
  [8.0, -38.0, 0.96],
  [-36.0, -32.0, 0.92],
  [-24.0, 36.0, 1.05],
  [-8.0, 38.0, 0.96],
  [8.0, 38.0, 0.96],
  [24.0, 36.0, 1.0],
];

export const PASHUPATI_CHAUTARA_TREES: ReadonlyArray<{
  localX: number;
  localZ: number;
  species: 'rudraksha' | 'bel';
  platformHalf: number;
}> = [
  { localX: -38.0, localZ: 24.0, species: 'rudraksha', platformHalf: 2.3 },
  { localX: 32.0, localZ: -38.0, species: 'bel', platformHalf: 2.2 },
  { localX: 32.0, localZ: 38.0, species: 'rudraksha', platformHalf: 2.2 },
];

export const PASHUPATI_HIGHLIGHTS = {
  shivaLingam: {
    title: 'Chaturmukha Shiva Lingam · Garbhagriha',
    subtitle: 'Four-Faced Mukhalinga & Silver Vasuki Naga',
    description:
      'At the heart of Pashupatinath rests the sacred black Shaligram Chaturmukha Lingam with four serene cardinal faces—Sadyojata (West), Vamadeva (North), Aghora (South), and Tatpurusha (East)—crowned by Ishana above. Adorned with fresh green Bel leaves, marigold garlands, Sindoor, Chandan, a coiled silver Vasuki hood, and a suspended Abhisheka Kalash dripping sacred water.',
  },
  goldenNandi: {
    title: 'Golden Nandi · Paschim Axis Vahana',
    subtitle: 'Gilded Bronze Sacred Bull of Lord Shiva',
    description:
      'Positioned along the western processional axis gazing eternally through the silver portals toward Lord Pashupati, the monumental gilded bronze Nandi rests on a stepped granite pedestal flanked by twin 6.5m brass Deepstambha oil-lamp pillars.',
  },
  bagmatiAarati: {
    title: 'Bagmati Sandhya Aarati · Aryaghat',
    subtitle: 'Sacred Riverbanks & Pandra Shivalaya',
    description:
      'Along the stepped granite Aryaghat and Surya Ghat facing the fifteen stone domes of Pandra Shivalaya, priests raise multi-tiered blazing brass Aarati candelabras above the flowing Bagmati while floating leaf-lamp diyas drift downstream.',
  },
} as const;

export function getPashupatiSeparationMetrics(landmarks: ReadonlyArray<LandmarkData>): {
  toJanakiMeters: number;
  toLumbiniMeters: number;
} {
  const janaki = landmarks.find((l) => l.id === 'janaki-mandir');
  const lumbini = landmarks.find((l) => l.id === 'lumbini-buddha');
  const px = PASHUPATI_COMPLEX.centerX;
  const pz = PASHUPATI_COMPLEX.centerZ;
  return {
    toJanakiMeters: janaki ? Math.hypot(px - janaki.position.x, pz - janaki.position.z) : 0,
    toLumbiniMeters: lumbini ? Math.hypot(px - lumbini.position.x, pz - lumbini.position.z) : 0,
  };
}

export function isOnPashupatiBagmatiBridge(x: number, z: number): boolean {
  const c = PASHUPATI_COMPLEX;
  return (
    x >= c.bridgeMinX &&
    x <= c.bridgeMaxX &&
    Math.abs(z - c.bridgeCenterZ) <= c.bridgeHalfZ
  );
}

export function getPashupatiBagmatiBridgeDeckY(x: number): number {
  const c = PASHUPATI_COMPLEX;
  const t = Math.max(0, Math.min(1, (x - c.bridgeMinX) / (c.bridgeMaxX - c.bridgeMinX)));
  return c.bridgeBaseY + Math.sin(t * Math.PI) * c.bridgeApexLift;
}

export function isInPashupatiBagmatiRiver(x: number, z: number): boolean {
  const c = PASHUPATI_COMPLEX;
  return x >= c.riverMinX && x <= c.riverMaxX && z >= c.riverMinZ && z <= c.riverMaxZ;
}

export function isInPashupatiPrecinct(x: number, z: number): boolean {
  const c = PASHUPATI_COMPLEX;
  return x >= c.minX - 18.0 && x <= c.maxX + 86.0 && z >= c.minZ - 10.0 && z <= c.maxZ + 12.0;
}

/**
 * Carves flat courtyard terrain, sunken Bagmati River channel, and smooth ghat slopes
 * inside the terrain mesh & groundHeightAt function so stone flagstones and water never z-fight.
 */
export function carvePashupatinathGround(x: number, z: number, currentY: number): number {
  const c = PASHUPATI_COMPLEX;

  // Quick AABB early-out (includes 14m north/south riverbank blend transitions)
  if (x < c.minX - 24 || x > c.sleshmantakMaxX + 12 || z < c.minZ - 18 || z > c.maxZ + 18) {
    return currentY;
  }

  // Courtyard, Western Approach Plaza & North/South Gate Aprons cleanly recessed 8cm beneath 0.28m stone pavers
  const inMainDeck = x >= c.minX - 18.5 && x <= c.maxX && z >= c.minZ - 2 && z <= c.maxZ + 2;
  const inNorthSouthApron =
    Math.abs(x - c.northGateCenterX) <= 4.8 &&
    ((z >= c.minZ - 6.0 && z < c.minZ - 2) || (z > c.maxZ + 2 && z <= c.maxZ + 6.0));
  if (inMainDeck || inNorthSouthApron) {
    return 0.18;
  }

  // Clean Bagmati River channel & ghat bed across the Pashupati reach (plus 14m north/south smooth transitions)
  if (x > c.maxX && x < c.eastBankMinX && z >= c.minZ - 14 && z <= c.maxZ + 14) {
    let channelTarget = -1.65;
    if (x < 29.8) {
      const t = Math.max(0, Math.min(1, (x - c.maxX) / (29.8 - c.maxX)));
      channelTarget = 0.18 - t * 1.83;
    } else if (x > 38.2) {
      const t = Math.max(0, Math.min(1, (c.eastBankMinX - x) / (c.eastBankMinX - 38.2)));
      channelTarget = 0.18 - t * 1.83;
    }
    if (z < c.minZ) {
      const bz = Math.max(0, Math.min(1, (z - (c.minZ - 14)) / 14));
      return currentY * (1 - bz) + channelTarget * bz;
    }
    if (z > c.maxZ) {
      const bz = Math.max(0, Math.min(1, (c.maxZ + 14 - z) / 14));
      return currentY * (1 - bz) + channelTarget * bz;
    }
    return channelTarget;
  }

  // East Bank Pandra Shivalaya Terrace (x: 41.5..62) carved flat beneath 0.42m stonework
  if (x >= c.eastBankMinX && x <= c.eastBankMaxX + 2 && z >= c.eastBankMinZ - 2 && z <= c.eastBankMaxZ + 2) {
    return 0.18;
  }

  return currentY;
}

/**
 * Exact walkable surface elevation across courtyard flagstones, 3-tier temple plinth & 4 cardinal stairways,
 * Nandi pedestal apron, Aryaghat/Surya Ghat river stairs, arched Bagmati Bridge, and Pandra Shivalaya east bank.
 */
export function getPashupatinathSurfaceY(x: number, z: number): number | null {
  const c = PASHUPATI_COMPLEX;

  // 1. Arched Multi-Span Bagmati Bridge deck takes precedence above real river water
  if (isOnPashupatiBagmatiBridge(x, z)) {
    return getPashupatiBagmatiBridgeDeckY(x);
  }

  // 2. East-Bank Pandra Shivalaya Terraced Platform & East riverfront steps (x: 38.7..41.5)
  if (x >= c.eastBankMinX && x <= c.eastBankMaxX && z >= c.eastBankMinZ && z <= c.eastBankMaxZ) {
    return c.eastBankY;
  }
  if (x >= 38.7 && x < c.eastBankMinX && z >= c.eastBankMinZ && z <= c.eastBankMaxZ) {
    const t = Math.max(0, Math.min(1, (c.eastBankMinX - x) / (c.eastBankMinX - 38.7)));
    const stepped = Math.floor(t * 4) / 4;
    return c.eastBankY - stepped * (c.eastBankY + 0.68);
  }
  if (x > c.eastBankMaxX && x <= c.sleshmantakMaxX && z >= c.minZ && z <= c.maxZ) {
    return 0.25;
  }

  // 3. Stepped Aryaghat & Surya Ghat descending cleanly from x=26.0 (y=0.28) down to x=29.6 (submerged -0.44m in real river edge)
  if (x > c.ghatTopX && x <= c.ghatTopX + 3.6 && z >= c.minZ && z <= c.maxZ) {
    if (Math.abs(z - c.bridgeCenterZ) <= 7.5 && x >= c.ghatTopX && x <= c.ghatTopX + 3.4) {
      return c.courtyardY;
    }
    const t = Math.max(0, Math.min(1, (x - c.ghatTopX) / 3.6));
    const stepped = Math.floor(t * 5) / 5;
    return c.courtyardY - stepped * (c.courtyardY + 0.62);
  }

  // 4. Inside 108m x 124m Temple Courtyard, Western Approach Plaza & North/South Gate Aprons
  const inCourtyard = x >= c.minX && x <= c.maxX && z >= c.minZ && z <= c.maxZ;
  const inWestPlaza = x >= c.minX - 18.0 && x < c.minX && Math.abs(z - c.westGateCenterZ) <= 18.0;
  const inNorthGateApron = z >= c.minZ - 5.6 && z < c.minZ && Math.abs(x - c.northGateCenterX) <= 4.4;
  const inSouthGateApron = z > c.maxZ && z <= c.maxZ + 5.6 && Math.abs(x - c.southGateCenterX) <= 4.4;

  if (!inCourtyard && !inWestPlaza && !inNorthGateApron && !inSouthGateApron) {
    return null;
  }

  // Main Pagoda 3-Tier Plinth & 4 Cardinal Stairways
  const lx = x - c.centerX;
  const lz = z - c.centerZ;
  const ax = Math.abs(lx);
  const az = Math.abs(lz);

  // Cardinal Stairways (width 4.6m -> |u| <= 2.3, climbing from 12.8m to 10.2m)
  const inNSStair = ax <= 2.35 && az >= 10.2 && az <= 13.0;
  const inEWStair = az <= 2.35 && ax >= 10.2 && ax <= 13.0;
  if (inNSStair || inEWStair) {
    const dist = inNSStair ? az : ax;
    const t = Math.max(0, Math.min(1, (13.0 - dist) / (13.0 - 10.2)));
    return c.courtyardY + t * (c.plinthDeckY - c.courtyardY);
  }

  // Top Deck & Interior Sanctum floor
  if (ax <= c.plinthDeckHalf && az <= c.plinthDeckHalf) {
    return c.plinthDeckY;
  }
  // Tier 2 step lip (10.2..11.1)
  if (ax <= 11.1 && az <= 11.1) {
    return c.courtyardY + 1.2;
  }
  // Tier 1 step lip (11.1..12.0)
  if (ax <= c.plinthOuterHalf && az <= c.plinthOuterHalf) {
    return c.courtyardY + 0.6;
  }

  // Vasuki Nath Shrine small plinth step
  const vdx = Math.abs(x - PASHUPATI_INTERACTIVE_SPOTS.vasukiShrineCenter.x);
  const vdz = Math.abs(z - PASHUPATI_INTERACTIVE_SPOTS.vasukiShrineCenter.z);
  if (vdx <= 5.2 && vdz <= 5.2) {
    return c.courtyardY + 0.38;
  }

  return c.courtyardY;
}

/**
 * Water surface detection for Bagmati River (with downstream Z velocity for floating items/splashes).
 */
export function getPashupatinathWaterAt(
  x: number,
  z: number,
): { inWater: boolean; surfaceY: number; flowX: number; flowZ: number } | null {
  if (isOnPashupatiBagmatiBridge(x, z)) return null;
  if (isInPashupatiBagmatiRiver(x, z)) {
    return {
      inWater: true,
      surfaceY: PASHUPATI_COMPLEX.riverWaterY,
      flowX: 0.0,
      flowZ: 1.65,
    };
  }
  return null;
}

/**
 * Solid architectural & geographical collision rules for Pashupatinath Temple Complex:
 * - Perimeter brick-and-iron fence with open Western, North & South gates
 * - Monumental Western Gatehouse piers, Simha lions & Jutta Ghar pavilion
 * - 3-tier Peti plinth edges (open strictly up the 4 cardinal stone stairways)
 * - Dachi Appa sanctum walls with ALL 4 cardinal silver doorways wide open (walkable interior!)
 * - 16 interior Sal-wood pillars (off-axis so all 4 doorways stay clear)
 * - Central Garbhagriha brass-and-timber railing & Chaturmukha Shiva Lingam pedestal
 * - Golden Nandi pedestal, Deepstambha pillars, Vasuki Nath core, 8 Shikhara shrines,
 *   Ghanta Bell pillars, Ghee-lamp racks, Trishul monument, Dhunge Dhara basin, Chautara platforms
 * - Bagmati River deep channel (blocking non-bridge traversal; bridge parapets keep player on deck)
 * - Pandra Shivalaya dome shrines
 */
export function isPashupatinathWalkable(x: number, z: number): boolean {
  const c = PASHUPATI_COMPLEX;

  // Quick early-out outside Pashupatinath + East bank footprint
  if (x < c.minX - 16 || x > c.eastBankMaxX + 20 || z < c.minZ - 10 || z > c.maxZ + 12) {
    return true;
  }

  // 1. Arched Bagmati Bridge deck (walkable interior; side parapets block stepping off into river)
  if (x >= c.bridgeMinX && x <= c.bridgeMaxX && Math.abs(z - c.bridgeCenterZ) <= 3.6) {
    if (Math.abs(z - c.bridgeCenterZ) <= c.bridgeHalfZ - 0.35) return true;
    return false;
  }

  // 2. Deep Bagmati River channel blocks crossing except via bridge; shallowest ghat step allowed at shoreline
  if (x >= c.riverMinX + 0.6 && x <= c.riverMaxX - 0.6 && z >= c.riverMinZ - 2 && z <= c.riverMaxZ + 2) {
    return false;
  }

  // 3. Perimeter Fence (West x=-236, North z=186, South z=310; open along East Bagmati ghats x=-128)
  if (
    Math.abs(x - c.minX) <= 0.65 &&
    z >= c.minZ - 0.6 &&
    z <= c.maxZ + 0.6 &&
    Math.abs(z - c.westGateCenterZ) > c.westGateOpenHalfZ
  ) {
    return false;
  }
  if (
    Math.abs(z - c.minZ) <= 0.65 &&
    x >= c.minX - 0.6 &&
    x <= c.maxX + 0.6 &&
    Math.abs(x - c.northGateCenterX) > c.nsGateOpenHalfX
  ) {
    return false;
  }
  if (
    Math.abs(z - c.maxZ) <= 0.65 &&
    x >= c.minX - 0.6 &&
    x <= c.maxX + 0.6 &&
    Math.abs(x - c.southGateCenterX) > c.nsGateOpenHalfX
  ) {
    return false;
  }

  // Western Gatehouse side bays & Guardian Lions & Deepstambhas & Signboard & Jutta Ghar
  if (
    Math.abs(x - c.minX) <= 2.35 &&
    Math.abs(z - c.westGateCenterZ) > c.westGateOpenHalfZ &&
    Math.abs(z - c.westGateCenterZ) <= 5.8
  ) {
    return false;
  }
  // Guardian Lions & Deepstambhas outside West Gate
  for (const [gx, gz, rad] of [
    [c.minX - 3.2, c.westGateCenterZ - 4.0, 0.95],
    [c.minX - 3.2, c.westGateCenterZ + 4.0, 0.95],
    [c.minX - 4.5, c.westGateCenterZ - 5.4, 0.85],
    [c.minX - 4.5, c.westGateCenterZ + 5.4, 0.85],
    [c.minX - 5.5, c.westGateCenterZ - 8.0, 1.35],
  ] as Array<[number, number, number]>) {
    if (Math.hypot(x - gx, z - gz) <= rad) return false;
  }
  // Shoe-Keeping Pavilion (Jutta Ghar) outside West Gate South Plaza
  if (
    Math.abs(x - PASHUPATI_INTERACTIVE_SPOTS.juttaGharCenter.x) <= 3.1 &&
    Math.abs(z - PASHUPATI_INTERACTIVE_SPOTS.juttaGharCenter.z) <= 2.2
  ) {
    return false;
  }

  // 4. Main Pagoda Temple Plinth, Stairways, Sanctum Walls, Pillars & Garbhagriha
  const lx = x - c.centerX;
  const lz = z - c.centerZ;
  const ax = Math.abs(lx);
  const az = Math.abs(lz);

  // Stairway cheek walls (flanking each 4.6m stairway at |u| in [2.35..3.15])
  if (
    (ax >= 2.35 && ax <= 3.15 && az >= 10.2 && az <= 13.0) ||
    (az >= 2.35 && az <= 3.15 && ax >= 10.2 && ax <= 13.0)
  ) {
    return false;
  }

  // Plinth outer sheer drop (prevent climbing sheer 1.8m plinth walls outside the 4 stairways)
  if (ax <= c.plinthOuterHalf + 0.35 && az <= c.plinthOuterHalf + 0.35) {
    const onStairCorridor =
      (ax <= 2.35 && az >= 10.2) || (az <= 2.35 && ax >= 10.2);
    const insideUpperDeck = ax <= c.plinthDeckHalf - 0.25 && az <= c.plinthDeckHalf - 0.25;
    if (!onStairCorridor && !insideUpperDeck) {
      return false;
    }
  }

  // Corner guardian elephants on Peti corners (±10.6, ±10.6)
  if (ax >= 9.6 && ax <= 11.6 && az >= 9.6 && az <= 11.6) {
    return false;
  }

  // Sanctum Dachi Appa brick walls (6.65..8.05) — ALL 4 cardinal portals (|u| <= 1.75) stay wide open!
  if (ax <= c.sanctumOuterHalf + 0.35 && az <= c.sanctumOuterHalf + 0.35) {
    const inWallRing =
      ax >= c.sanctumOuterHalf - c.sanctumWallThick - 0.32 ||
      az >= c.sanctumOuterHalf - c.sanctumWallThick - 0.32;
    const inPortalSpan = ax <= c.sanctumDoorHalf || az <= c.sanctumDoorHalf;
    if (inWallRing && !inPortalSpan) {
      return false;
    }

    // Dvarapala door guardians flanking portals exteriorly
    if (
      (ax >= 2.0 && ax <= 2.9 && az >= 7.6 && az <= 8.8) ||
      (az >= 2.0 && az <= 2.9 && ax >= 7.6 && ax <= 8.8)
    ) {
      return false;
    }
  }

  // 16 Octagonal Carved Sal-Wood Interior Pradakshina Pillars (on ring ±5.25 & ±2.55 off-axis)
  if (ax < c.sanctumOuterHalf && az < c.sanctumOuterHalf) {
    for (const px of [-5.25, -2.55, 2.55, 5.25]) {
      for (const pz of [-5.25, -2.55, 2.55, 5.25]) {
        if (Math.abs(px) < 3.0 && Math.abs(pz) < 3.0) continue; // keep Garbhagriha open
        if (Math.hypot(lx - px, lz - pz) <= 0.48) return false;
      }
    }
    // Central Garbhagriha waist-high brass-and-timber railing + Lingam Yoni-Peeth
    if (ax <= c.railingHalf + 0.32 && az <= c.railingHalf + 0.32) {
      return false;
    }
  }

  // 5. Courtyard Monuments & Micro-Props
  // Golden Nandi Bull pedestal (local -19.5, 0) + flanking brass Deepstambha pillars (-19.5, ±3.6)
  if (Math.abs(lx + 19.5) <= 3.1 && Math.abs(lz) <= 2.2) return false;
  if (Math.hypot(lx + 19.5, lz - 3.6) <= 0.72 || Math.hypot(lx + 19.5, lz + 3.6) <= 0.72) {
    return false;
  }

  // Colossal 7.5m Golden Trishul & Damaru monument (local -27.0, -14.5)
  if (Math.hypot(lx + 27.0, lz + 14.5) <= 2.05) return false;

  // Vasuki Nath Pagoda Shrine core (local +24, -24)
  if (Math.abs(lx - 24.0) <= 3.8 && Math.abs(lz + 24.0) <= 3.8) return false;

  // 8 Ribbed Stone Shikhara Shrines
  for (const [sx, sz, sScale] of PASHUPATI_SHIKHARA_POSITIONS) {
    if (Math.abs(lx - sx) <= 2.35 * sScale && Math.abs(lz - sz) <= 2.35 * sScale) {
      return false;
    }
  }

  // Bell Pavilion (Ghanta) 4 corner posts (local -25, +14 -> open middle under bell!)
  for (const bx of [-2.1, 2.1]) {
    for (const bz of [-2.1, 2.1]) {
      if (Math.hypot(lx + 25.0 - bx, lz - 14.0 - bz) <= 0.55) return false;
    }
  }

  // Tiered brass ghee-lamp racks (local -15.5, ±6.8)
  for (const rack of PASHUPATI_INTERACTIVE_SPOTS.gheeLampRacks) {
    if (Math.abs(x - rack.x) <= 1.25 && Math.abs(z - rack.z) <= 0.78) return false;
  }

  // Rudraksha & Bel Chautara tree platforms
  for (const ct of PASHUPATI_CHAUTARA_TREES) {
    if (Math.abs(lx - ct.localX) <= ct.platformHalf + 0.35 && Math.abs(lz - ct.localZ) <= ct.platformHalf + 0.35) {
      return false;
    }
  }

  // Sunken Dhunge Dhara basin walls (local -36, -16)
  if (Math.abs(lx + 36.0) <= 2.95 && Math.abs(lz + 16.0) <= 2.95) return false;

  // Bagmati Aarati brass stands flanking bridge entrance (x=28.0, z=294.4..305.6)
  for (const st of PASHUPATI_INTERACTIVE_SPOTS.aaratiStands) {
    if (Math.hypot(x - st.x, z - st.z) <= 0.72) return false;
  }

  // Bagmati Overlook Parapet Wall (x=25.8) & riverside Shiva mini-shrines (x=24.75) — openings stay clear at ±[31..41] and [-8.2..8.2]
  if (Math.abs(x - (c.ghatTopX - 0.2)) <= 0.45) {
    if (
      (lz >= -60.2 && lz <= -41.0) ||
      (lz >= -31.0 && lz <= -8.2) ||
      (lz >= 8.2 && lz <= 31.0) ||
      (lz >= 41.0 && lz <= 60.2)
    ) {
      return false;
    }
  }
  if (Math.abs(x - (c.ghatTopX - 1.25)) <= 0.72) {
    for (const gz of [-46.0, -21.0, 21.0, 46.0]) {
      if (Math.abs(lz - gz) <= 0.72) return false;
    }
  }

  // East Bank Pandra Shivalaya 15 symmetrical stone shrines (6 front, 6 middle, 3 upper rear centered on bridge axis)
  if (x >= 44 && x <= 63) {
    const shivalayaCoords: ReadonlyArray<[number, number]> = [
      [48.0, 274], [48.0, 282], [48.0, 290], [48.0, 310], [48.0, 318], [48.0, 326],
      [54.3, 274], [54.3, 282], [54.3, 290], [54.3, 310], [54.3, 318], [54.3, 326],
      [60.3, 282], [60.3, 300], [60.3, 318],
    ];
    for (const [sx, sz] of shivalayaCoords) {
      if (Math.abs(x - sx) <= 1.85 && Math.abs(z - sz) <= 1.85) return false;
    }
  }

  return true;
}

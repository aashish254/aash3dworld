import * as THREE from 'three';

/**
 * Shared reusable geometry cache for high-detail turned & sculpted Nepali sacred architecture,
 * brass oil lamps, sanctum murtis, temple bells, gajur finials, and stone guardian lions.
 */

let cachedFlameGeo: THREE.LatheGeometry | null = null;
export function getSacredTeardropFlameGeo(): THREE.LatheGeometry {
  if (cachedFlameGeo) return cachedFlameGeo;
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.42, 0.14),
    new THREE.Vector2(0.55, 0.34),
    new THREE.Vector2(0.46, 0.62),
    new THREE.Vector2(0.28, 0.92),
    new THREE.Vector2(0.11, 1.24),
    new THREE.Vector2(0.0, 1.48),
  ];
  cachedFlameGeo = new THREE.LatheGeometry(pts, 20);
  cachedFlameGeo.computeVertexNormals();
  return cachedFlameGeo;
}

/**
 * Builds a realistic sculpted two-stage sacred Jyoti flame (no spherical balls).
 */
export function createSacredFlameGroup(
  flameMat: THREE.Material,
  scale = 1,
): THREE.Group {
  const g = new THREE.Group();
  const geo = getSacredTeardropFlameGeo();
  const core = new THREE.Mesh(geo, flameMat);
  core.scale.set(0.052 * scale, 0.088 * scale, 0.052 * scale);
  g.add(core);
  return g;
}

/**
 * Smooth 28-segment LatheGeometry profile for traditional Nepali Gajur / Purna-Kalasha spire finials.
 */
let cachedGajurGeo: THREE.LatheGeometry | null = null;
export function getDetailedGajurKalashGeo(): THREE.LatheGeometry {
  if (cachedGajurGeo) return cachedGajurGeo;
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.28, 0.0),
    new THREE.Vector2(0.32, 0.06),
    new THREE.Vector2(0.24, 0.12),
    new THREE.Vector2(0.16, 0.16),
    new THREE.Vector2(0.26, 0.25),
    new THREE.Vector2(0.30, 0.36),
    new THREE.Vector2(0.25, 0.48),
    new THREE.Vector2(0.13, 0.56),
    new THREE.Vector2(0.18, 0.63),
    new THREE.Vector2(0.11, 0.70),
    new THREE.Vector2(0.15, 0.78),
    new THREE.Vector2(0.11, 0.87),
    new THREE.Vector2(0.055, 1.02),
    new THREE.Vector2(0.028, 1.18),
    new THREE.Vector2(0.0, 1.32),
  ];
  cachedGajurGeo = new THREE.LatheGeometry(pts, 28);
  cachedGajurGeo.computeVertexNormals();
  return cachedGajurGeo;
}

/**
 * Creates a smooth turned Nepali Gajur / Kalash roof or chhatri spire finial.
 */
export function createDetailedGajurSpire(
  goldMat: THREE.Material,
  bronzeMat: THREE.Material,
  height = 1.2,
  radiusScale = 1.0,
): THREE.Group {
  const g = new THREE.Group();
  const spireGeo = getDetailedGajurKalashGeo();
  const baseRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24 * radiusScale, 0.30 * radiusScale, height * 0.08, 24),
    bronzeMat,
  );
  baseRing.position.y = height * 0.04;
  baseRing.castShadow = true;

  const finial = new THREE.Mesh(spireGeo, goldMat);
  finial.scale.set(radiusScale * (height / 1.32), height / 1.32, radiusScale * (height / 1.32));
  finial.position.y = height * 0.06;
  finial.castShadow = true;

  g.add(baseRing, finial);
  return g;
}

/**
 * Smooth 28-segment LatheGeometry geometries for Rooftop Kumbha Urns & Parterre Lotus Finials.
 */
let cachedKumbhaUrnGeo: THREE.LatheGeometry | null = null;
export function getDetailedKumbhaUrnGeo(): THREE.LatheGeometry {
  if (cachedKumbhaUrnGeo) return cachedKumbhaUrnGeo;
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.36, 0.0),
    new THREE.Vector2(0.40, 0.08),
    new THREE.Vector2(0.24, 0.16),
    new THREE.Vector2(0.38, 0.28),
    new THREE.Vector2(0.42, 0.42),
    new THREE.Vector2(0.34, 0.56),
    new THREE.Vector2(0.20, 0.64),
    new THREE.Vector2(0.25, 0.70),
    new THREE.Vector2(0.14, 0.74),
    new THREE.Vector2(0.0, 0.78),
  ];
  cachedKumbhaUrnGeo = new THREE.LatheGeometry(pts, 24);
  cachedKumbhaUrnGeo.computeVertexNormals();
  return cachedKumbhaUrnGeo;
}

let cachedParterreFinialGeo: THREE.LatheGeometry | null = null;
export function getDetailedParterreFinialGeo(): THREE.LatheGeometry {
  if (cachedParterreFinialGeo) return cachedParterreFinialGeo;
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.11, 0.0),
    new THREE.Vector2(0.115, 0.03),
    new THREE.Vector2(0.075, 0.06),
    new THREE.Vector2(0.10, 0.105),
    new THREE.Vector2(0.095, 0.145),
    new THREE.Vector2(0.055, 0.175),
    new THREE.Vector2(0.03, 0.205),
    new THREE.Vector2(0.0, 0.23),
  ];
  cachedParterreFinialGeo = new THREE.LatheGeometry(pts, 24);
  cachedParterreFinialGeo.computeVertexNormals();
  return cachedParterreFinialGeo;
}

let cachedPrayerCapGeo: THREE.LatheGeometry | null = null;
export function getDetailedPrayerWheelCapGeo(): THREE.LatheGeometry {
  if (cachedPrayerCapGeo) return cachedPrayerCapGeo;
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(0.245, 0.0),
    new THREE.Vector2(0.25, 0.025),
    new THREE.Vector2(0.21, 0.05),
    new THREE.Vector2(0.15, 0.085),
    new THREE.Vector2(0.09, 0.115),
    new THREE.Vector2(0.05, 0.14),
    new THREE.Vector2(0.0, 0.145),
  ];
  cachedPrayerCapGeo = new THREE.LatheGeometry(pts, 28);
  cachedPrayerCapGeo.computeVertexNormals();
  return cachedPrayerCapGeo;
}

/**
 * Builds an authentic, high-detail 32-segment Lathe-turned Nepali Brass Temple Bell (Ghanta)
 * with forged suspension shackle, fluted acoustic bell body, soundbow flare, and inner clapper.
 */
let cachedBellBodyGeo: THREE.LatheGeometry | null = null;
function getDetailedBellBodyGeo(): THREE.LatheGeometry {
  if (cachedBellBodyGeo) return cachedBellBodyGeo;
  // Inner cavity top->bottom (-radial inward normals), chamfered lip, then outer bell bottom->top (+radial outward normals)
  const cleanPts: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.28),
    new THREE.Vector2(0.11, 0.21),
    new THREE.Vector2(0.145, 0.13),
    new THREE.Vector2(0.195, 0.015),
    new THREE.Vector2(0.21, 0.0),
    new THREE.Vector2(0.238, 0.0),
    new THREE.Vector2(0.245, 0.015),
    new THREE.Vector2(0.23, 0.042),
    new THREE.Vector2(0.185, 0.09),
    new THREE.Vector2(0.162, 0.15),
    new THREE.Vector2(0.156, 0.21),
    new THREE.Vector2(0.135, 0.265),
    new THREE.Vector2(0.085, 0.30),
    new THREE.Vector2(0.045, 0.33),
    new THREE.Vector2(0.0, 0.35),
  ];
  cachedBellBodyGeo = new THREE.LatheGeometry(cleanPts, 28);
  cachedBellBodyGeo.computeVertexNormals();
  return cachedBellBodyGeo;
}

export function createDetailedTempleBell(
  goldMat: THREE.Material,
  bronzeMat: THREE.Material,
  dropLen: number,
  bellScale = 1,
): THREE.Group {
  const b = new THREE.Group();
  b.userData.noMerge = true;

  // Forged iron-bronze chain links suspending bell from beam (fixed to ceiling)
  const linkCount = Math.max(3, Math.round(dropLen / 0.12));
  const linkStep = dropLen / linkCount;
  const linkGeo = new THREE.TorusGeometry(0.028, 0.009, 8, 16);
  for (let i = 0; i < linkCount; i++) {
    const link = new THREE.Mesh(linkGeo, bronzeMat);
    link.position.y = -linkStep * (i + 0.5);
    link.rotation.y = (i % 2) * (Math.PI / 2);
    b.add(link);
  }

  // Dedicated pendulum swing pivot anchored at the suspension crown
  const swingPivot = new THREE.Group();
  swingPivot.position.y = -dropLen;
  b.add(swingPivot);

  // Carved lotus suspension crown loop
  const crownRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.045 * bellScale, 0.014 * bellScale, 10, 18),
    bronzeMat,
  );
  crownRing.position.y = -0.01 * bellScale;

  // Smooth Lathe bell body (bottom lip sits at -0.38 * bellScale below pivot)
  const bellBody = new THREE.Mesh(getDetailedBellBodyGeo(), goldMat);
  bellBody.scale.setScalar(bellScale);
  bellBody.position.y = -0.37 * bellScale;
  bellBody.castShadow = true;

  // Molded soundbow bead collar & waist ring
  const waistRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.164 * bellScale, 0.012 * bellScale, 10, 28),
    bronzeMat,
  );
  waistRing.rotation.x = Math.PI / 2;
  waistRing.position.y = -0.22 * bellScale;

  const lipRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.236 * bellScale, 0.014 * bellScale, 10, 28),
    bronzeMat,
  );
  lipRing.rotation.x = Math.PI / 2;
  lipRing.position.y = -0.35 * bellScale;

  // Inner brass clapper pendulum pivoted inside crown for realistic secondary swing lag
  const clapperPivot = new THREE.Group();
  clapperPivot.position.y = -0.14 * bellScale;
  const clapperStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01 * bellScale, 0.012 * bellScale, 0.26 * bellScale, 10),
    bronzeMat,
  );
  clapperStem.position.y = -0.13 * bellScale;
  const clapperBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.042 * bellScale, 14, 12),
    bronzeMat,
  );
  clapperBall.position.y = -0.26 * bellScale;
  clapperPivot.add(clapperStem, clapperBall);

  swingPivot.add(crownRing, bellBody, waistRing, lipRing, clapperPivot);
  b.userData.bellSwingPivot = swingPivot;
  b.userData.bellClapperPivot = clapperPivot;
  b.userData.bellScale = bellScale;
  return b;
}

/**
 * Builds an intricate traditional Nepali Brass Sukunda / Karwa-Diyo oil lamp
 * (turned base, scalloped oil reservoir, wick spout, S-scroll Naga backplate, and teardrop flame).
 */
let cachedSukundaBaseGeo: THREE.LatheGeometry | null = null;
function getSukundaBaseGeo(): THREE.LatheGeometry {
  if (cachedSukundaBaseGeo) return cachedSukundaBaseGeo;
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.10, 0.0),
    new THREE.Vector2(0.105, 0.02),
    new THREE.Vector2(0.06, 0.045),
    new THREE.Vector2(0.036, 0.075),
    new THREE.Vector2(0.05, 0.10),
    new THREE.Vector2(0.095, 0.125),
    new THREE.Vector2(0.11, 0.148),
    new THREE.Vector2(0.09, 0.155),
    new THREE.Vector2(0.072, 0.128),
    new THREE.Vector2(0.0, 0.125),
  ];
  cachedSukundaBaseGeo = new THREE.LatheGeometry(pts, 24);
  cachedSukundaBaseGeo.computeVertexNormals();
  return cachedSukundaBaseGeo;
}

export function createDetailedBrassSukundaDiyo(
  goldMat: THREE.Material,
  bronzeMat: THREE.Material,
  flameMat: THREE.Material,
  scale = 1,
  withBackShield = true,
): THREE.Group {
  const g = new THREE.Group();

  const body = new THREE.Mesh(getSukundaBaseGeo(), goldMat);
  body.castShadow = true;
  g.add(body);

  // Turned pedestal collar ring
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.044, 0.008, 8, 20), bronzeMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.075;
  g.add(collar);

  // Extended leaf-shaped oil wick spout (+Z)
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.034, 0.08, 12), bronzeMat);
  spout.rotation.x = Math.PI / 2 - 0.25;
  spout.position.set(0, 0.148, 0.11);
  g.add(spout);

  if (withBackShield) {
    // Graceful S-curved Nepali Sukunda back arch & miniature Kalash crest (-Z)
    const archCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.05, -0.05),
      new THREE.Vector3(0, 0.14, -0.105),
      new THREE.Vector3(0, 0.24, -0.085),
      new THREE.Vector3(0, 0.29, -0.03),
    ]);
    const handle = new THREE.Mesh(new THREE.TubeGeometry(archCurve, 14, 0.012, 10, false), bronzeMat);
    const shieldPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.035, 0.022, 18), goldMat);
    shieldPlate.rotation.x = Math.PI / 2 - 0.2;
    shieldPlate.position.set(0, 0.225, -0.082);
    const crestBud = new THREE.Mesh(getDetailedParterreFinialGeo(), goldMat);
    crestBud.scale.setScalar(0.32);
    crestBud.position.set(0, 0.285, -0.03);
    g.add(handle, shieldPlate, crestBud);
  }

  // Sculpted organic teardrop Jyoti flame nested inside wick spout
  const flame = createSacredFlameGroup(flameMat, 0.92);
  flame.position.set(0, 0.145, 0.132);
  g.add(flame);
  g.userData.flameGroup = flame;

  g.scale.setScalar(scale);
  return g;
}

/**
 * Builds the monumental, turned 32-segment Nepali Brass Deepastambha / Panasa Oil Lamp Tower
 * (replaces the stick-like lamp stands in Image 3 with ornate multi-tier carved metalwork & 14 radial oil spouts).
 */
let cachedDeepaStandGeo: THREE.LatheGeometry | null = null;
function getDetailedDeepastambhaStandGeo(): THREE.LatheGeometry {
  if (cachedDeepaStandGeo) return cachedDeepaStandGeo;
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.34, 0.0),
    new THREE.Vector2(0.35, 0.045),
    new THREE.Vector2(0.30, 0.085),
    new THREE.Vector2(0.315, 0.12),
    new THREE.Vector2(0.24, 0.175),
    new THREE.Vector2(0.15, 0.23),
    new THREE.Vector2(0.18, 0.28),
    new THREE.Vector2(0.125, 0.34),
    // Lower baluster Kalasha swell
    new THREE.Vector2(0.165, 0.48),
    new THREE.Vector2(0.145, 0.62),
    new THREE.Vector2(0.095, 0.72),
    new THREE.Vector2(0.125, 0.78),
    new THREE.Vector2(0.09, 0.84),
    // Tapered fluted stem
    new THREE.Vector2(0.105, 1.08),
    new THREE.Vector2(0.082, 1.26),
    new THREE.Vector2(0.12, 1.32),
    new THREE.Vector2(0.075, 1.38),
    // Upper baluster shaft
    new THREE.Vector2(0.086, 1.62),
    new THREE.Vector2(0.068, 1.76),
    new THREE.Vector2(0.105, 1.82),
    new THREE.Vector2(0.062, 1.88),
    // Apex lotus cup
    new THREE.Vector2(0.11, 2.02),
    new THREE.Vector2(0.08, 2.12),
    new THREE.Vector2(0.0, 2.16),
  ];
  cachedDeepaStandGeo = new THREE.LatheGeometry(pts, 32);
  cachedDeepaStandGeo.computeVertexNormals();
  return cachedDeepaStandGeo;
}

let cachedDeepaBowlGeo: THREE.LatheGeometry | null = null;
function getDetailedDeepaBowlGeo(): THREE.LatheGeometry {
  if (cachedDeepaBowlGeo) return cachedDeepaBowlGeo;
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.08, 0.0),
    new THREE.Vector2(0.22, 0.03),
    new THREE.Vector2(0.35, 0.085),
    new THREE.Vector2(0.39, 0.13),
    new THREE.Vector2(0.37, 0.145),
    new THREE.Vector2(0.32, 0.11),
    new THREE.Vector2(0.12, 0.09),
    new THREE.Vector2(0.0, 0.082),
  ];
  cachedDeepaBowlGeo = new THREE.LatheGeometry(pts, 32);
  cachedDeepaBowlGeo.computeVertexNormals();
  return cachedDeepaBowlGeo;
}

export function createDetailedDeepastambha(
  goldMat: THREE.Material,
  bronzeMat: THREE.Material,
  flameMat: THREE.Material,
  scale = 1,
): THREE.Group {
  const g = new THREE.Group();

  // Main 32-segment lathe-turned brass column
  const stand = new THREE.Mesh(getDetailedDeepastambhaStandGeo(), goldMat);
  stand.castShadow = true;
  stand.receiveShadow = true;
  g.add(stand);

  // Contrasting antique bronze torus rings & lotus base collar
  for (const [ry, rr, tube] of [
    [0.085, 0.315, 0.018],
    [0.28, 0.18, 0.016],
    [0.78, 0.128, 0.015],
    [1.32, 0.122, 0.014],
    [1.82, 0.108, 0.013],
  ] as Array<[number, number, number]>) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(rr, tube, 12, 28), bronzeMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = ry;
    g.add(ring);
  }

  // Two sculpted multi-spout brass oil platters with radial spouts & teardrop flames
  const tiers: Array<{ y: number; scale: number; spouts: number }> = [
    { y: 1.24, scale: 1.0, spouts: 8 },
    { y: 1.72, scale: 0.72, spouts: 6 },
  ];
  const bowlGeo = getDetailedDeepaBowlGeo();
  const spoutGeo = new THREE.CylinderGeometry(0.018, 0.036, 0.11, 10);

  for (const tier of tiers) {
    const platter = new THREE.Mesh(bowlGeo, bronzeMat);
    platter.scale.setScalar(tier.scale);
    platter.position.y = tier.y;
    platter.castShadow = true;
    g.add(platter);

    // Beaded brass rim lip
    const rimBead = new THREE.Mesh(
      new THREE.TorusGeometry(0.382 * tier.scale, 0.013 * tier.scale, 10, 28),
      goldMat,
    );
    rimBead.rotation.x = Math.PI / 2;
    rimBead.position.y = tier.y + 0.136 * tier.scale;
    g.add(rimBead);

    for (let s = 0; s < tier.spouts; s++) {
      const a = (s / tier.spouts) * Math.PI * 2;
      const sx = Math.sin(a) * 0.37 * tier.scale;
      const sz = Math.cos(a) * 0.37 * tier.scale;

      const lipSpout = new THREE.Mesh(spoutGeo, goldMat);
      lipSpout.scale.setScalar(tier.scale);
      lipSpout.position.set(sx, tier.y + 0.125 * tier.scale, sz);
      lipSpout.rotation.y = a;
      lipSpout.rotation.x = Math.PI / 2 - 0.32;
      g.add(lipSpout);

      const tFlame = createSacredFlameGroup(flameMat, 0.62 * tier.scale);
      tFlame.position.set(
        Math.sin(a) * 0.415 * tier.scale,
        tier.y + 0.145 * tier.scale,
        Math.cos(a) * 0.415 * tier.scale,
      );
      g.add(tFlame);
    }
  }

  // Ornate Purna-Kalasha apex crown + central sacred Jyoti flame
  const apexKalash = new THREE.Mesh(getDetailedParterreFinialGeo(), goldMat);
  apexKalash.scale.set(0.85, 0.72, 0.85);
  apexKalash.position.y = 2.02;
  g.add(apexKalash);

  const apexFlame = createSacredFlameGroup(flameMat, 1.38);
  apexFlame.position.y = 2.16;
  g.add(apexFlame);

  g.scale.setScalar(scale);
  return g;
}

/**
 * Builds an intricately sculpted Golden Sanctum Murti (Shri Ram or Mata Janaki)
 * with draped Lathe garment, lotus Padma-Pitha base, curved arms, Vanamala garland,
 * sculpted serene head, Shira-Chakra halo, and multi-tiered Nepali-Mithila royal crown.
 */
function createSculptedSanctumMurti(
  goldMat: THREE.Material,
  bronzeMat: THREE.Material,
  marigoldMat: THREE.Material,
  isMataJanaki: boolean,
): THREE.Group {
  const m = new THREE.Group();

  // 1. Carved Padma-Pitha Double Lotus Throne Pedestal (y = 0..0.20)
  const lotusPts: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.24, 0.0),
    new THREE.Vector2(0.25, 0.045),
    new THREE.Vector2(0.18, 0.085),
    new THREE.Vector2(0.22, 0.13),
    new THREE.Vector2(0.20, 0.175),
    new THREE.Vector2(0.15, 0.195),
    new THREE.Vector2(0.0, 0.20),
  ];
  const padmaBase = new THREE.Mesh(new THREE.LatheGeometry(lotusPts, 28), bronzeMat);
  padmaBase.castShadow = true;
  m.add(padmaBase);

  // Carved petal beads circling the Padma-Pitha
  const beadGeo = new THREE.SphereGeometry(0.022, 10, 8);
  for (let p = 0; p < 14; p++) {
    const a = (p / 14) * Math.PI * 2;
    const bead = new THREE.Mesh(beadGeo, goldMat);
    bead.scale.set(1.2, 0.75, 0.8);
    bead.position.set(Math.sin(a) * 0.215, 0.12, Math.cos(a) * 0.215);
    m.add(bead);
  }

  // 2. Draped Lower Garment (Dhoti / Lehenga-Sari silhouette, y = 0.20..0.78)
  const robePts: THREE.Vector2[] = isMataJanaki
    ? [
        new THREE.Vector2(0.175, 0.20),
        new THREE.Vector2(0.19, 0.28),
        new THREE.Vector2(0.165, 0.42),
        new THREE.Vector2(0.145, 0.56),
        new THREE.Vector2(0.115, 0.68),
        new THREE.Vector2(0.098, 0.78),
      ]
    : [
        new THREE.Vector2(0.16, 0.20),
        new THREE.Vector2(0.17, 0.30),
        new THREE.Vector2(0.145, 0.45),
        new THREE.Vector2(0.13, 0.60),
        new THREE.Vector2(0.112, 0.72),
        new THREE.Vector2(0.105, 0.78),
      ];
  const lowerRobe = new THREE.Mesh(new THREE.LatheGeometry(robePts, 28), goldMat);
  lowerRobe.castShadow = true;
  m.add(lowerRobe);

  // Ornate carved waist Kamarbandh belt & sash drape
  const waistBelt = new THREE.Mesh(
    new THREE.TorusGeometry(isMataJanaki ? 0.106 : 0.112, 0.017, 10, 24),
    bronzeMat,
  );
  waistBelt.rotation.x = Math.PI / 2;
  waistBelt.position.y = 0.76;
  m.add(waistBelt);

  // 3. Sculpted Torso & Shoulder Mantle (y = 0.76..1.08)
  const torsoPts: THREE.Vector2[] = isMataJanaki
    ? [
        new THREE.Vector2(0.098, 0.76),
        new THREE.Vector2(0.118, 0.88),
        new THREE.Vector2(0.128, 0.99),
        new THREE.Vector2(0.092, 1.06),
        new THREE.Vector2(0.052, 1.09),
      ]
    : [
        new THREE.Vector2(0.105, 0.76),
        new THREE.Vector2(0.13, 0.89),
        new THREE.Vector2(0.148, 1.01),
        new THREE.Vector2(0.108, 1.07),
        new THREE.Vector2(0.056, 1.10),
      ];
  const torso = new THREE.Mesh(new THREE.LatheGeometry(torsoPts, 28), goldMat);
  torso.scale.set(1.12, 1.0, 0.82); // anatomically broader shoulder width vs chest depth
  torso.castShadow = true;
  m.add(torso);

  // Sculpted shoulder pauldrons & graceful curved arms in Abhaya / Blessing posture
  const shX = isMataJanaki ? 0.132 : 0.152;
  for (const side of [-1, 1]) {
    const shBall = new THREE.Mesh(new THREE.SphereGeometry(0.042, 14, 12), goldMat);
    shBall.position.set(side * shX, 1.02, 0.0);
    m.add(shBall);

    const armCurve =
      side === 1
        ? new THREE.CatmullRomCurve3([
            new THREE.Vector3(shX, 1.02, 0.0),
            new THREE.Vector3(shX + 0.045, 0.88, 0.03),
            new THREE.Vector3(shX + 0.035, 0.82, 0.115),
            new THREE.Vector3(shX + 0.015, 0.92, 0.145),
          ])
        : isMataJanaki
          ? new THREE.CatmullRomCurve3([
              new THREE.Vector3(-shX, 1.02, 0.0),
              new THREE.Vector3(-shX - 0.04, 0.86, 0.04),
              new THREE.Vector3(-shX - 0.02, 0.78, 0.12),
              new THREE.Vector3(-0.08, 0.86, 0.14),
            ])
          : new THREE.CatmullRomCurve3([
              new THREE.Vector3(-shX, 1.02, 0.0),
              new THREE.Vector3(-shX - 0.048, 0.90, 0.02),
              new THREE.Vector3(-shX - 0.06, 0.98, 0.07),
              new THREE.Vector3(-shX - 0.055, 1.12, 0.06),
            ]);

    const arm = new THREE.Mesh(new THREE.TubeGeometry(armCurve, 14, 0.027, 10, false), goldMat);
    arm.castShadow = true;
    m.add(arm);

    const bangle = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 8, 16), bronzeMat);
    bangle.position.copy(armCurve.getPoint(0.75));
    bangle.rotation.x = Math.PI / 3;
    m.add(bangle);
  }

  // Shri Ram's golden Kodanda Bow + bowstring on left arm / Mata Janaki's sacred blooming lotus
  if (!isMataJanaki) {
    const bowCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.22, 0.34, 0.04),
      new THREE.Vector3(-0.245, 0.72, 0.11),
      new THREE.Vector3(-0.21, 1.08, 0.075),
      new THREE.Vector3(-0.23, 1.40, 0.02),
    ]);
    const bow = new THREE.Mesh(new THREE.TubeGeometry(bowCurve, 20, 0.015, 10, false), bronzeMat);
    const stringCurve = new THREE.LineCurve3(
      new THREE.Vector3(-0.22, 0.34, 0.04),
      new THREE.Vector3(-0.23, 1.40, 0.02),
    );
    const bowString = new THREE.Mesh(
      new THREE.TubeGeometry(stringCurve, 4, 0.004, 6, false),
      goldMat,
    );
    m.add(bow, bowString);
  } else {
    const lotusGroup = new THREE.Group();
    lotusGroup.position.set(-0.085, 0.875, 0.148);
    const petalGeo = new THREE.SphereGeometry(0.024, 10, 8);
    for (let lp = 0; lp < 6; lp++) {
      const la = (lp / 6) * Math.PI * 2;
      const pet = new THREE.Mesh(petalGeo, marigoldMat);
      pet.scale.set(0.65, 1.35, 0.45);
      pet.position.set(Math.sin(la) * 0.02, 0.012, Math.cos(la) * 0.02);
      pet.rotation.z = -Math.sin(la) * 0.45;
      pet.rotation.x = Math.cos(la) * 0.45;
      lotusGroup.add(pet);
    }
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), goldMat);
    core.position.y = 0.022;
    lotusGroup.add(core);
    m.add(lotusGroup);
  }

  // Draped diagonal Uttariya / Sari Pallu ceremonial sash
  const sashCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-shX * 0.88, 1.03, -0.02),
    new THREE.Vector3(-0.04, 0.91, 0.115),
    new THREE.Vector3(shX * 0.82, 0.77, 0.05),
  ]);
  const sash = new THREE.Mesh(new THREE.TubeGeometry(sashCurve, 16, 0.019, 10, false), bronzeMat);
  m.add(sash);

  // 4. Layered Haram Necklace & Long Vanamala Garland
  const necklace = new THREE.Mesh(new THREE.TorusGeometry(0.074, 0.015, 10, 22), bronzeMat);
  necklace.rotation.x = Math.PI / 2 - 0.34;
  necklace.position.set(0, 1.045, 0.032);
  m.add(necklace);

  const vanamalaCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.082, 1.05, 0.02),
    new THREE.Vector3(-0.095, 0.84, 0.118),
    new THREE.Vector3(0.0, 0.60, 0.152),
    new THREE.Vector3(0.095, 0.84, 0.118),
    new THREE.Vector3(0.082, 1.05, 0.02),
  ]);
  const vanamala = new THREE.Mesh(new THREE.TubeGeometry(vanamalaCurve, 24, 0.019, 10, false), marigoldMat);
  m.add(vanamala);

  // 5. Sculpted Neck, Serene Head, Brow, Ears & Kundala Rings (y = 1.09..1.30)
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.054, 0.075, 18), goldMat);
  neck.position.y = 1.115;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.088, 24, 18), goldMat);
  head.scale.set(0.88, 1.08, 0.95);
  head.position.set(0, 1.218, 0.01);
  head.castShadow = true;
  // Subtle sculpted nose bridge & forehead Tilak jewel
  const noseBridge = new THREE.Mesh(new THREE.CapsuleGeometry(0.0085, 0.022, 6, 10), goldMat);
  noseBridge.rotation.x = -0.22;
  noseBridge.position.set(0, 1.21, 0.088);
  const tilak = new THREE.Mesh(new THREE.CapsuleGeometry(0.0045, 0.014, 4, 8), marigoldMat);
  tilak.position.set(0, 1.248, 0.086);
  m.add(neck, head, noseBridge, tilak);

  for (const side of [-1, 1]) {
    const kundala = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.0065, 8, 18), bronzeMat);
    kundala.rotation.y = Math.PI / 2;
    kundala.position.set(side * 0.084, 1.185, 0.012);
    m.add(kundala);
  }

  // 6. Ornate Multi-Tiered Nepali-Mithila Royal Mukuta (Crown)
  const mukutaPts: THREE.Vector2[] = [
    new THREE.Vector2(0.082, 0.0),
    new THREE.Vector2(0.088, 0.036),
    new THREE.Vector2(0.070, 0.076),
    new THREE.Vector2(0.076, 0.108),
    new THREE.Vector2(0.054, 0.148),
    new THREE.Vector2(0.060, 0.175),
    new THREE.Vector2(0.034, 0.22),
    new THREE.Vector2(0.016, 0.268),
    new THREE.Vector2(0.0, 0.31),
  ];
  const mukuta = new THREE.Mesh(new THREE.LatheGeometry(mukutaPts, 24), bronzeMat);
  mukuta.position.set(0, 1.276, 0.008);
  mukuta.castShadow = true;
  const crownBand = new THREE.Mesh(new THREE.TorusGeometry(0.084, 0.011, 8, 24), goldMat);
  crownBand.rotation.x = Math.PI / 2;
  crownBand.position.set(0, 1.292, 0.008);
  const crownGem = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), marigoldMat);
  crownGem.position.set(0, 1.312, 0.092);
  m.add(mukuta, crownBand, crownGem);

  // 7. Carved Shira-Chakra Halo Ring behind head
  const headHalo = new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.015, 10, 28), bronzeMat);
  headHalo.position.set(0, 1.255, -0.075);
  m.add(headHalo);

  return m;
}

/**
 * Replaces the 2 stick-like golden cylinders + flat yellow circle inside the Garbhagriha
 * with a deeply detailed, grounded Singhasan throne altar, twin sculpted Shri Ram & Mata Janaki murtis,
 * royal Chhatra parasol, carved Prabhavali sunburst halo, and Pancharti ritual offerings.
 */
export function createDetailedSanctumAltarpiece(params: {
  goldMat: THREE.Material;
  bronzeMat: THREE.Material;
  marbleMat: THREE.Material;
  whiteTrimMat: THREE.Material;
  crimsonClothMat: THREE.Material;
  marigoldMat: THREE.Material;
  flameMat: THREE.Material;
  altarHaloMap: THREE.Texture;
}): THREE.Group {
  const {
    goldMat,
    bronzeMat,
    marbleMat,
    whiteTrimMat,
    crimsonClothMat,
    marigoldMat,
    flameMat,
    altarHaloMap,
  } = params;

  const altar = new THREE.Group();

  // 1. Grounded Carved Marble & Gilded Singhasan Throne Dais (sits solidly on Jagati floor y = 0.72)
  const baseStep = new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.22, 0.96), marbleMat);
  baseStep.position.set(0, 0.83, 2.02);
  baseStep.receiveShadow = true;
  baseStep.castShadow = true;

  const midDais = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.36, 0.76), whiteTrimMat);
  midDais.position.set(0, 1.12, 2.02);
  midDais.castShadow = true;

  const brassMolding = new THREE.Mesh(new THREE.BoxGeometry(2.10, 0.07, 0.82), bronzeMat);
  brassMolding.position.set(0, 1.32, 2.02);

  // Crimson silk altar throne cloth & carved golden border drape
  const throneCloth = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.09, 0.72), crimsonClothMat);
  throneCloth.position.set(0, 1.39, 2.02);
  const clothFrontDrape = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.28, 0.05), crimsonClothMat);
  clothFrontDrape.position.set(0, 1.24, 2.385);
  const clothGoldBorder = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.04, 0.06), goldMat);
  clothGoldBorder.position.set(0, 1.11, 2.39);

  // Ornate Lathe-turned Simhasana throne backrest pillars & scalloped brass lintel
  const thronePostPts: THREE.Vector2[] = [
    new THREE.Vector2(0.072, 0.0),
    new THREE.Vector2(0.075, 0.09),
    new THREE.Vector2(0.052, 0.16),
    new THREE.Vector2(0.064, 0.28),
    new THREE.Vector2(0.044, 0.45),
    new THREE.Vector2(0.050, 0.88),
    new THREE.Vector2(0.065, 1.02),
    new THREE.Vector2(0.042, 1.16),
    new THREE.Vector2(0.054, 1.42),
    new THREE.Vector2(0.072, 1.50),
    new THREE.Vector2(0.048, 1.54),
  ];
  const thronePostGeo = new THREE.LatheGeometry(thronePostPts, 24);
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(thronePostGeo, bronzeMat);
    post.position.set(side * 0.90, 1.36, 1.94);
    post.castShadow = true;
    const finial = new THREE.Mesh(getDetailedParterreFinialGeo(), goldMat);
    finial.scale.set(0.68, 0.78, 0.68);
    finial.position.set(side * 0.90, 2.90, 1.94);
    // Brass scrolled corner bracket under top crossbar
    const cornerArm = new THREE.Mesh(
      new THREE.TorusGeometry(0.16, 0.018, 10, 18, Math.PI * 0.5),
      goldMat,
    );
    cornerArm.position.set(side * 0.74, 2.70, 1.94);
    cornerArm.rotation.z = side === -1 ? Math.PI * 0.5 : 0;
    altar.add(post, finial, cornerArm);
  }
  const throneCrossbar = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.065, 0.085), bronzeMat);
  throneCrossbar.position.set(0, 2.86, 1.94);
  const throneTopMold = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.035, 0.10), goldMat);
  throneTopMold.position.set(0, 2.91, 1.94);

  altar.add(
    baseStep,
    midDais,
    brassMolding,
    throneCloth,
    clothFrontDrape,
    clothGoldBorder,
    throneCrossbar,
    throneTopMold,
  );

  // 2. Radiant Carved Prabhavali Sunburst Lotus Mandala Halo (replaces flat yellow cylinder!)
  const haloMat = new THREE.MeshBasicMaterial({
    map: altarHaloMap,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const haloDisc = new THREE.Mesh(new THREE.PlaneGeometry(1.88, 1.88), haloMat);
  haloDisc.position.set(0, 2.24, 1.94);
  haloDisc.userData.noMerge = true;
  altar.add(haloDisc);

  // Carved brass Prabhavali outer arch frame with flame finials
  const prabhavaliRing = new THREE.Mesh(new THREE.TorusGeometry(0.84, 0.028, 12, 40, Math.PI * 1.18), goldMat);
  prabhavaliRing.rotation.z = -Math.PI * 0.09;
  prabhavaliRing.position.set(0, 2.16, 1.96);
  altar.add(prabhavaliRing);
  for (let i = 0; i < 11; i++) {
    const a = -Math.PI * 0.06 + (i / 10) * Math.PI * 1.12;
    const boss = new THREE.Mesh(getDetailedParterreFinialGeo(), bronzeMat);
    boss.scale.set(0.28, 0.34, 0.28);
    boss.position.set(Math.cos(a) * 0.88, 2.16 + Math.sin(a) * 0.88, 1.96);
    boss.rotation.z = a - Math.PI / 2;
    altar.add(boss);
  }

  // 3. Twin Sculpted Golden Sanctum Murtis (Shri Ram at left -0.40, Mata Janaki at right +0.40)
  const ramMurti = createSculptedSanctumMurti(goldMat, bronzeMat, marigoldMat, false);
  ramMurti.position.set(-0.40, 1.43, 2.08);
  const sitaMurti = createSculptedSanctumMurti(goldMat, bronzeMat, marigoldMat, true);
  sitaMurti.position.set(0.40, 1.43, 2.08);
  sitaMurti.scale.setScalar(0.95);
  altar.add(ramMurti, sitaMurti);

  // 4. Royal Gilded Chhatra (Ceremonial Parasol Canopy) crowned above the center
  const chhatraStem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.42, 12), bronzeMat);
  chhatraStem.position.set(0, 3.06, 2.08);
  const chhatraCanopyPts: THREE.Vector2[] = [
    new THREE.Vector2(0.42, 0.0),
    new THREE.Vector2(0.40, 0.045),
    new THREE.Vector2(0.26, 0.09),
    new THREE.Vector2(0.11, 0.13),
    new THREE.Vector2(0.0, 0.17),
  ];
  const chhatraDome = new THREE.Mesh(new THREE.LatheGeometry(chhatraCanopyPts, 28), goldMat);
  chhatraDome.position.set(0, 2.88, 2.08);
  const chhatraTop = new THREE.Mesh(getDetailedParterreFinialGeo(), bronzeMat);
  chhatraTop.scale.set(0.45, 0.55, 0.45);
  chhatraTop.position.set(0, 3.04, 2.08);
  altar.add(chhatraStem, chhatraDome, chhatraTop);

  // 5. Front Altar Step Ritual Offerings: Center Brass Purna-Kalasha + Flanking Sukunda Lamps + Puja Thali
  const centerKalash = new THREE.Mesh(getDetailedKumbhaUrnGeo(), goldMat);
  centerKalash.scale.set(0.32, 0.34, 0.32);
  centerKalash.position.set(0, 0.94, 2.34);
  altar.add(centerKalash);

  for (const lx of [-0.72, 0.72]) {
    const altarDiyo = createDetailedBrassSukundaDiyo(goldMat, bronzeMat, flameMat, 0.86, true);
    altarDiyo.position.set(lx, 0.94, 2.36);
    altar.add(altarDiyo);
  }

  return altar;
}

/**
 * Builds a museum-grade, intricately sculpted Golden Guardian Singha Lion seated proudly
 * on a stepped marble-and-bronze pedestal (layered flowing golden mane curls, muscular chest,
 * roaring jaw with fangs, bronze claws, and carved lotus plinth — zero spiky cone ruffs).
 */
export function createDetailedGuardianLion(
  goldMat: THREE.Material,
  bronzeMat: THREE.Material,
  darkInlayMat: THREE.Material,
  pedestalMat: THREE.Material,
  tealMat: THREE.Material,
): THREE.Group {
  const lion = new THREE.Group();

  // 1. Stepped Carved Stone & Bronze Pedestal (1.44m × 1.46m footprint clears stair cheek wall)
  const pedSub = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.14, 1.48), pedestalMat);
  pedSub.position.y = 0.07;
  pedSub.castShadow = true;
  pedSub.receiveShadow = true;
  const pedBase = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.16, 1.34), pedestalMat);
  pedBase.position.y = 0.22;
  pedBase.castShadow = true;
  const pedShaft = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.50, 1.12), pedestalMat);
  pedShaft.position.y = 0.55;
  pedShaft.castShadow = true;
  const pedBrassFillet = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.055, 1.22), bronzeMat);
  pedBrassFillet.position.y = 0.828;
  const pedMold = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.10, 1.30), tealMat);
  pedMold.position.y = 0.905;
  const pedTop = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.065, 1.18), pedestalMat);
  pedTop.position.y = 0.988;
  lion.add(pedSub, pedBase, pedShaft, pedBrassFillet, pedMold, pedTop);

  const baseTop = 1.02;

  // 2. Sculpted Golden Padma-Pitha Lotus Throne Slab beneath the Lion
  const pad = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.065, 1.00), bronzeMat);
  pad.position.set(0, baseTop + 0.032, 0.02);
  pad.castShadow = true;
  const padTrim = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.028, 1.04), goldMat);
  padTrim.position.set(0, baseTop + 0.068, 0.02);
  lion.add(pad, padTrim);

  const lBase = baseTop + 0.082;

  // 3. Muscular Seated Golden Lion Body (broad flared ribcage, slender waist, sculpted haunches)
  const lumbarPts: THREE.Vector2[] = [
    new THREE.Vector2(0.01, 0.0),
    new THREE.Vector2(0.24, 0.06),
    new THREE.Vector2(0.205, 0.24),
    new THREE.Vector2(0.265, 0.46),
    new THREE.Vector2(0.305, 0.65),
    new THREE.Vector2(0.215, 0.79),
    new THREE.Vector2(0.01, 0.83),
  ];
  const torso = new THREE.Mesh(new THREE.LatheGeometry(lumbarPts, 28), goldMat);
  torso.scale.set(0.98, 1.0, 1.14);
  torso.rotation.x = -0.35;
  torso.position.set(0, lBase + 0.12, -0.07);
  torso.castShadow = true;

  // Sculpted pectoral chest plates & muscular spinal ridge
  for (const side of [-1, 1]) {
    const pec = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 14), goldMat);
    pec.scale.set(0.92, 1.18, 0.85);
    pec.position.set(side * 0.095, lBase + 0.46, 0.17);
    pec.castShadow = true;
    lion.add(pec);
  }
  const sternum = new THREE.Mesh(new THREE.SphereGeometry(0.19, 18, 14), goldMat);
  sternum.scale.set(0.90, 1.06, 0.88);
  sternum.position.set(0, lBase + 0.50, 0.14);

  const pelvis = new THREE.Mesh(new THREE.SphereGeometry(0.235, 20, 14), goldMat);
  pelvis.scale.set(1.04, 0.84, 1.14);
  pelvis.position.set(0, lBase + 0.19, -0.22);
  pelvis.castShadow = true;
  lion.add(torso, sternum, pelvis);

  // 4. Ornate Ceremonial Temple Collar & Hanging Gilded Ghanta Bell
  const bellCollar = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.022, 12, 28), bronzeMat);
  bellCollar.rotation.x = Math.PI / 2 - 0.44;
  bellCollar.position.set(0, lBase + 0.56, 0.21);
  const collarBeadGeo = new THREE.SphereGeometry(0.020, 8, 8);
  for (let b = -3; b <= 3; b++) {
    const a = b * 0.34;
    const cBead = new THREE.Mesh(collarBeadGeo, goldMat);
    cBead.position.set(Math.sin(a) * 0.215, lBase + 0.495 + Math.abs(b) * 0.015, 0.21 + Math.cos(a) * 0.20);
    lion.add(cBead);
  }
  const neckBell = new THREE.Mesh(getDetailedBellBodyGeo(), bronzeMat);
  neckBell.scale.setScalar(0.22);
  neckBell.position.set(0, lBase + 0.39, 0.38);
  lion.add(bellCollar, neckBell);

  // 5. Lush Flowing Multi-Tier Golden Sculpted Mane (curved tapered S-wave locks — zero spiky cones!)
  const curlGeo = new THREE.SphereGeometry(0.085, 16, 12);
  // Inner cheek & forehead mane framing collar
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const isUnder = Math.cos(a) < -0.55;
    const lock = new THREE.Mesh(curlGeo, i % 3 === 0 ? bronzeMat : goldMat);
    lock.scale.set(0.84, 0.72, 1.65);
    lock.position.set(
      Math.sin(a) * (isUnder ? 0.16 : 0.21),
      lBase + 0.77 + Math.cos(a) * (isUnder ? 0.17 : 0.19),
      0.21 - Math.abs(Math.sin(a)) * 0.03,
    );
    lock.lookAt(
      Math.sin(a) * 0.48,
      lBase + 0.76 + Math.cos(a) * 0.42,
      -0.25,
    );
    lock.castShadow = true;
    lion.add(lock);
  }

  // Sweeping sculpted shoulder & dorsal cape mane waves (curved TubeGeometry locks flowing down neck)
  for (let i = 0; i < 15; i++) {
    const a = -Math.PI * 0.78 + (i / 14) * Math.PI * 1.56;
    const rStart = 0.20;
    const rMid = 0.265;
    const rEnd = 0.29;
    const waveCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.sin(a) * rStart, lBase + 0.78 + Math.cos(a) * 0.16, 0.18),
      new THREE.Vector3(Math.sin(a) * rMid, lBase + 0.68 + Math.cos(a) * 0.12, 0.04),
      new THREE.Vector3(Math.sin(a) * rEnd, lBase + 0.52 + Math.cos(a) * 0.06, -0.08),
    ]);
    const wave = new THREE.Mesh(
      new THREE.TubeGeometry(waveCurve, 10, i % 2 === 0 ? 0.056 : 0.048, 10, false),
      i % 4 === 0 ? bronzeMat : goldMat,
    );
    wave.castShadow = true;
    lion.add(wave);
  }

  // Sculpted mane crest crown lock on forehead
  const crownCrest = new THREE.Mesh(curlGeo, goldMat);
  crownCrest.scale.set(1.15, 0.75, 1.55);
  crownCrest.position.set(0, lBase + 0.94, 0.25);
  crownCrest.rotation.x = -0.35;
  lion.add(crownCrest);

  // 6. Regal Chiseled Lion Head, Snout, Roaring Mouth & Inlaid Eyes
  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.175, 22, 16), goldMat);
  cranium.scale.set(0.96, 0.94, 1.04);
  cranium.position.set(0, lBase + 0.79, 0.30);
  cranium.castShadow = true;

  const browBridge = new THREE.Mesh(new THREE.SphereGeometry(0.155, 18, 14), goldMat);
  browBridge.scale.set(1.06, 0.72, 0.96);
  browBridge.position.set(0, lBase + 0.82, 0.34);

  // Strong sculpted feline nasal bridge + cheek zygomatic ridges
  const snoutBridge = new THREE.Mesh(new THREE.CapsuleGeometry(0.064, 0.145, 8, 14), goldMat);
  snoutBridge.rotation.x = Math.PI / 2 + 0.18;
  snoutBridge.scale.set(1.10, 0.86, 1.0);
  snoutBridge.position.set(0, lBase + 0.752, 0.44);

  for (const side of [-1, 1]) {
    const cheekBone = new THREE.Mesh(new THREE.SphereGeometry(0.082, 14, 12), goldMat);
    cheekBone.scale.set(0.95, 0.85, 1.15);
    cheekBone.position.set(side * 0.105, lBase + 0.74, 0.37);
    const whiskerPad = new THREE.Mesh(new THREE.SphereGeometry(0.068, 16, 12), goldMat);
    whiskerPad.scale.set(0.98, 0.86, 1.24);
    whiskerPad.position.set(side * 0.066, lBase + 0.708, 0.455);
    lion.add(cheekBone, whiskerPad);
  }

  // Broad feline T-shaped bronze rhinarium nose
  const nosePad = new THREE.Mesh(new THREE.SphereGeometry(0.044, 14, 10), bronzeMat);
  nosePad.scale.set(1.18, 0.75, 0.92);
  nosePad.position.set(0, lBase + 0.742, 0.538);

  // Parted roaring jaw, dark inlaid oral cavity, golden curled tongue & 4 curved fangs
  const mouthCavity = new THREE.Mesh(new THREE.SphereGeometry(0.060, 14, 10), darkInlayMat);
  mouthCavity.scale.set(1.08, 0.70, 1.15);
  mouthCavity.position.set(0, lBase + 0.658, 0.445);

  const tongue = new THREE.Mesh(new THREE.CapsuleGeometry(0.028, 0.065, 6, 10), bronzeMat);
  tongue.rotation.x = Math.PI / 2 + 0.36;
  tongue.scale.set(1.15, 0.55, 1.0);
  tongue.position.set(0, lBase + 0.638, 0.468);

  const lowerJaw = new THREE.Mesh(new THREE.CapsuleGeometry(0.056, 0.125, 8, 12), goldMat);
  lowerJaw.rotation.x = Math.PI / 2 + 0.22;
  lowerJaw.scale.set(1.15, 0.64, 1.0);
  lowerJaw.position.set(0, lBase + 0.616, 0.435);

  const chinBeard = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), bronzeMat);
  chinBeard.scale.set(0.92, 1.28, 1.05);
  chinBeard.position.set(0, lBase + 0.585, 0.43);

  const fangGeo = new THREE.ConeGeometry(0.011, 0.038, 10);
  for (const side of [-1, 1]) {
    const upperFang = new THREE.Mesh(fangGeo, pedestalMat);
    upperFang.rotation.x = Math.PI;
    upperFang.position.set(side * 0.046, lBase + 0.668, 0.492);
    const lowerFang = new THREE.Mesh(fangGeo, pedestalMat);
    lowerFang.position.set(side * 0.039, lBase + 0.642, 0.484);
    lion.add(upperFang, lowerFang);
  }
  lion.add(cranium, browBridge, snoutBridge, nosePad, mouthCavity, tongue, lowerJaw, chinBeard);

  // 7. Expressive Almond Eyes, Rounded Lion Ears, Muscular Limbs & Clawed Paws
  for (const side of [-1, 1]) {
    const earOuter = new THREE.Mesh(new THREE.SphereGeometry(0.048, 12, 10), goldMat);
    earOuter.scale.set(0.88, 1.15, 0.58);
    earOuter.position.set(side * 0.142, lBase + 0.915, 0.275);
    earOuter.rotation.z = -side * 0.36;
    earOuter.rotation.y = side * 0.25;
    const earHollow = new THREE.Mesh(new THREE.SphereGeometry(0.030, 10, 8), bronzeMat);
    earHollow.scale.set(0.82, 1.05, 0.38);
    earHollow.position.set(side * 0.142, lBase + 0.912, 0.292);
    earHollow.rotation.z = -side * 0.36;

    // Arched supraorbital brow & bronze-rimmed obsidian eye
    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.072, 6, 10), goldMat);
    brow.rotation.z = Math.PI / 2 - side * 0.24;
    brow.position.set(side * 0.075, lBase + 0.820, 0.450);
    const eyeSocket = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 10), bronzeMat);
    eyeSocket.scale.set(1.25, 0.82, 0.72);
    eyeSocket.position.set(side * 0.076, lBase + 0.794, 0.448);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.017, 10, 8), darkInlayMat);
    pupil.position.set(side * 0.076, lBase + 0.793, 0.460);

    // Muscular shoulder blade & curved foreleg pillar
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.118, 16, 12), goldMat);
    shoulder.scale.set(0.84, 1.28, 0.98);
    shoulder.position.set(side * 0.178, lBase + 0.47, 0.20);
    const legCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.172, lBase + 0.47, 0.22),
      new THREE.Vector3(side * 0.185, lBase + 0.27, 0.285),
      new THREE.Vector3(side * 0.175, lBase + 0.072, 0.305),
    ]);
    const foreLeg = new THREE.Mesh(new THREE.TubeGeometry(legCurve, 14, 0.070, 14, false), goldMat);
    foreLeg.castShadow = true;

    // Articulated front paw + 4 toes + bronze claws
    const pawPad = new THREE.Mesh(new THREE.SphereGeometry(0.076, 14, 12), goldMat);
    pawPad.scale.set(0.98, 0.56, 1.25);
    pawPad.position.set(side * 0.175, lBase + 0.062, 0.375);
    for (let t = -1.5; t <= 1.5; t += 1) {
      const tx = side * 0.175 + t * 0.032;
      const toe = new THREE.Mesh(new THREE.CapsuleGeometry(0.017, 0.044, 6, 8), goldMat);
      toe.rotation.x = Math.PI / 2 - 0.14;
      toe.position.set(tx, lBase + 0.056, 0.45);
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.009, 0.032, 8), bronzeMat);
      claw.rotation.x = Math.PI / 2 + 0.22;
      claw.position.set(tx, lBase + 0.042, 0.49);
      lion.add(toe, claw);
    }

    // Folded muscular hind thigh + rear paw with claws
    const hindThigh = new THREE.Mesh(new THREE.SphereGeometry(0.140, 16, 12), goldMat);
    hindThigh.scale.set(0.70, 1.04, 1.30);
    hindThigh.position.set(side * 0.215, lBase + 0.19, -0.15);
    const rearPaw = new THREE.Mesh(new THREE.SphereGeometry(0.058, 12, 10), goldMat);
    rearPaw.scale.set(0.90, 0.52, 1.30);
    rearPaw.position.set(side * 0.225, lBase + 0.058, 0.015);
    for (let t = -1.5; t <= 1.5; t += 1) {
      const rToe = new THREE.Mesh(new THREE.CapsuleGeometry(0.013, 0.032, 4, 6), goldMat);
      rToe.rotation.x = Math.PI / 2 - 0.12;
      rToe.position.set(side * 0.225 + t * 0.024, lBase + 0.050, 0.08);
      lion.add(rToe);
    }

    lion.add(earOuter, earHollow, brow, eyeSocket, pupil, shoulder, foreLeg, pawPad, hindThigh, rearPaw);
  }

  // 8. Graceful S-Curved Dorsal Tail Arching Up Over the Back with Bronze Tuft
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, lBase + 0.13, -0.39),
    new THREE.Vector3(0.065, lBase + 0.28, -0.47),
    new THREE.Vector3(0.075, lBase + 0.45, -0.36),
    new THREE.Vector3(0.022, lBase + 0.52, -0.21),
  ]);
  const tail = new THREE.Mesh(new THREE.TubeGeometry(tailCurve, 16, 0.032, 10, false), goldMat);
  const tailTuft = new THREE.Mesh(curlGeo, bronzeMat);
  tailTuft.scale.set(0.55, 0.55, 1.15);
  tailTuft.rotation.x = 0.35;
  tailTuft.position.set(0.022, lBase + 0.525, -0.19);
  lion.add(tail, tailTuft);

  return lion;
}

/**
 * Builds a realistic turned cast-iron & brass Chowk heritage lantern post
 * (replaces the low-poly 6-sided pole+cone lamps in the outer plaza).
 */
export function createDetailedChowkLanternPost(
  plinthStoneMat: THREE.Material,
  darkBronzeMat: THREE.Material,
  goldMat: THREE.Material,
  tealMat: THREE.Material,
  flameMat: THREE.Material,
): THREE.Group {
  const g = new THREE.Group();

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.34, 0.62), plinthStoneMat);
  plinth.position.y = 0.17;
  plinth.castShadow = true;
  plinth.receiveShadow = true;

  // 24-segment baluster-turned cast-iron post
  const postPts: THREE.Vector2[] = [
    new THREE.Vector2(0.22, 0.34),
    new THREE.Vector2(0.18, 0.48),
    new THREE.Vector2(0.11, 0.64),
    new THREE.Vector2(0.14, 0.80),
    new THREE.Vector2(0.095, 1.0),
    new THREE.Vector2(0.085, 2.4),
    new THREE.Vector2(0.115, 2.65),
    new THREE.Vector2(0.075, 2.95),
    new THREE.Vector2(0.07, 3.65),
    new THREE.Vector2(0.16, 3.74),
  ];
  const post = new THREE.Mesh(new THREE.LatheGeometry(postPts, 24), darkBronzeMat);
  post.castShadow = true;
  g.add(plinth, post);

  // Brass collar rings along column
  for (const [ry, rr] of [
    [0.80, 0.145],
    [2.65, 0.12],
    [3.74, 0.165],
  ] as Array<[number, number]>) {
    const c = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.015, 10, 24), goldMat);
    c.rotation.x = Math.PI / 2;
    c.position.y = ry;
    g.add(c);
  }

  // Hexagonal glazed brass lantern cage (6 corner mullions + warm glowing core + curved pagoda roof + Gajur finial)
  const cageBaseY = 3.75;
  const cageH = 0.48;
  const cageR = 0.22;

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const mullion = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, cageH, 8), goldMat);
    mullion.position.set(Math.sin(a) * cageR, cageBaseY + cageH * 0.5, Math.cos(a) * cageR);
    g.add(mullion);
  }

  const warmMantle = createSacredFlameGroup(flameMat, 2.1);
  warmMantle.position.y = cageBaseY + 0.12;
  g.add(warmMantle);

  const lanternRoofPts: THREE.Vector2[] = [
    new THREE.Vector2(0.32, 0.0),
    new THREE.Vector2(0.24, 0.08),
    new THREE.Vector2(0.12, 0.18),
    new THREE.Vector2(0.04, 0.24),
  ];
  const capRoof = new THREE.Mesh(new THREE.LatheGeometry(lanternRoofPts, 24), tealMat);
  capRoof.position.y = cageBaseY + cageH;
  const finial = new THREE.Mesh(getDetailedParterreFinialGeo(), goldMat);
  finial.scale.setScalar(0.65);
  finial.position.y = cageBaseY + cageH + 0.23;
  g.add(capRoof, finial);

  return g;
}

/**
 * Towering Carved Stone & Brass Chowk Deepastambha / Garuda Stambha Column (~5.0m tall)
 * grounding the Janakpur outer processional approach.
 */
export function createChowkMonumentalDeepastambha(
  plinthStoneMat: THREE.Material,
  marbleMat: THREE.Material,
  tealMat: THREE.Material,
  goldMat: THREE.Material,
  bronzeMat: THREE.Material,
  flameMat: THREE.Material,
): THREE.Group {
  const g = new THREE.Group();
  const base1 = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.22, 1.42), marbleMat);
  base1.position.y = 0.11;
  base1.castShadow = true;
  base1.receiveShadow = true;
  const base2 = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.56, 1.16), marbleMat);
  base2.position.y = 0.50;
  base2.castShadow = true;
  const baseTeal = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.10, 1.24), tealMat);
  baseTeal.position.y = 0.83;

  const stambha = createDetailedDeepastambha(goldMat, bronzeMat, flameMat, 1.72);
  stambha.position.y = 0.88;

  g.add(base1, base2, baseTeal, stambha);
  return g;
}

/**
 * Carved Stone Hiti (Traditional Nepali Tiered Lotus Water Basin & Makara Fountain).
 */
export function createChowkHitiFountain(
  marbleMat: THREE.Material,
  plinthStoneMat: THREE.Material,
  tealMat: THREE.Material,
  goldMat: THREE.Material,
  bronzeMat: THREE.Material,
  waterMat: THREE.Material,
): THREE.Group {
  const g = new THREE.Group();

  // Outer stepped octagonal stone apron
  const stepRim = new THREE.Mesh(new THREE.CylinderGeometry(2.58, 2.72, 0.18, 16), plinthStoneMat);
  stepRim.position.y = 0.09;
  stepRim.receiveShadow = true;
  stepRim.castShadow = true;

  // Molded Makrana marble basin wall + teal lip
  const outerWall = new THREE.Mesh(new THREE.CylinderGeometry(2.26, 2.34, 0.58, 24, 1, true), marbleMat);
  outerWall.position.y = 0.46;
  outerWall.castShadow = true;
  const basinFloor = new THREE.Mesh(new THREE.CylinderGeometry(2.22, 2.22, 0.12, 24), plinthStoneMat);
  basinFloor.position.y = 0.22;
  const lipRing = new THREE.Mesh(new THREE.TorusGeometry(2.26, 0.10, 12, 28), tealMat);
  lipRing.rotation.x = Math.PI / 2;
  lipRing.position.y = 0.74;
  lipRing.castShadow = true;

  // Calm turquoise water surface inside basin (keep isolated for realistic GLSL shader animation)
  const waterDisc = new THREE.Mesh(new THREE.CylinderGeometry(2.18, 2.18, 0.04, 32), waterMat);
  waterDisc.position.y = 0.60;
  waterDisc.userData.noMerge = true;

  // Central carved lotus fountain pedestal + brass Kalasha tier
  const centerPedPts: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.56, 0.0),
    new THREE.Vector2(0.50, 0.16),
    new THREE.Vector2(0.32, 0.34),
    new THREE.Vector2(0.42, 0.58),
    new THREE.Vector2(0.68, 0.72),
    new THREE.Vector2(0.64, 0.80),
    new THREE.Vector2(0.24, 0.74),
    new THREE.Vector2(0.18, 1.06),
    new THREE.Vector2(0.42, 1.18),
    new THREE.Vector2(0.38, 1.24),
    new THREE.Vector2(0.12, 1.22),
  ];
  const centerTier = new THREE.Mesh(new THREE.LatheGeometry(centerPedPts, 24), marbleMat);
  centerTier.position.y = 0.24;
  centerTier.castShadow = true;

  const finial = createDetailedGajurSpire(goldMat, bronzeMat, 0.72, 0.74);
  finial.position.y = 1.44;

  // 4 Bronze Makara spouts projecting around the basin rim
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.065, 0.34, 12), bronzeMat);
    spout.position.set(Math.sin(a) * 0.44, 0.94, Math.cos(a) * 0.44);
    spout.rotation.y = a;
    spout.rotation.x = Math.PI / 2.3;
    g.add(spout);
  }

  g.add(stepRim, outerWall, basinFloor, lipRing, waterDisc, centerTier, finial);
  return g;
}

/**
 * Traditional Nepali Brick-and-Marble Chautara Platform with Multi-Branch Sacred Peepal Tree
 * (sculpted TubeGeometry trunk/roots/boughs + botanical alpha-cutout leaf cluster cards — zero poly balls!).
 */
export function createChowkChautaraTree(params: {
  brickMat: THREE.Material;
  marbleMat: THREE.Material;
  tealMat: THREE.Material;
  barkMat: THREE.Material;
  soilMat: THREE.Material;
  foliageMat: THREE.Material;
  goldMat: THREE.Material;
  bronzeMat: THREE.Material;
  flameMat: THREE.Material;
  seed: number;
}): THREE.Group {
  const {
    brickMat,
    marbleMat,
    tealMat,
    barkMat,
    soilMat,
    foliageMat,
    goldMat,
    bronzeMat,
    flameMat,
    seed,
  } = params;
  const g = new THREE.Group();

  // Stepped brick & marble Chautara seat platform (2.8m × 2.8m)
  const lowerTier = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.34, 2.85), brickMat);
  lowerTier.position.y = 0.17;
  lowerTier.castShadow = true;
  lowerTier.receiveShadow = true;
  const lowerCap = new THREE.Mesh(new THREE.BoxGeometry(2.96, 0.08, 2.96), marbleMat);
  lowerCap.position.y = 0.38;
  lowerCap.receiveShadow = true;

  const upperTier = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.40, 1.78), brickMat);
  upperTier.position.y = 0.62;
  upperTier.castShadow = true;
  const upperRim = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.08, 1.88), tealMat);
  upperRim.position.y = 0.85;

  const soilMound = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.82, 0.12, 20), soilMat);
  soilMound.position.y = 0.88;
  g.add(lowerTier, lowerCap, upperTier, upperRim, soilMound);

  // Corner brass Sukunda oil lamps on Chautara bench ledge
  for (const [lx, lz] of [
    [-1.18, 1.18],
    [1.18, 1.18],
  ] as Array<[number, number]>) {
    const lamp = createDetailedBrassSukundaDiyo(goldMat, bronzeMat, flameMat, 0.72, true);
    lamp.position.set(lx, 0.42, lz);
    g.add(lamp);
  }

  // Sculpted gnarled Peepal trunk + 4 buttress roots + 6 spreading primary branches (TubeGeometry)
  const hRand = (n: number) => {
    const s = Math.sin(seed * 91.3 + n * 47.7) * 43758.5453;
    return s - Math.floor(s);
  };

  const trunkPts = [
    new THREE.Vector3(0, 0.84, 0),
    new THREE.Vector3((hRand(1) - 0.5) * 0.14, 1.8, (hRand(2) - 0.5) * 0.14),
    new THREE.Vector3((hRand(3) - 0.5) * 0.18, 2.8, (hRand(4) - 0.5) * 0.18),
    new THREE.Vector3(0, 3.65, 0),
  ];
  const trunk = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(trunkPts), 14, 0.24, 12, false),
    barkMat,
  );
  trunk.castShadow = true;
  g.add(trunk);

  // Buttress roots anchoring into Chautara soil
  for (let r = 0; r < 5; r++) {
    const a = (r / 5) * Math.PI * 2 + hRand(10 + r) * 0.4;
    const rootCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(a) * 0.16, 1.38, Math.sin(a) * 0.16),
      new THREE.Vector3(Math.cos(a) * 0.38, 1.04, Math.sin(a) * 0.38),
      new THREE.Vector3(Math.cos(a) * 0.64, 0.86, Math.sin(a) * 0.64),
    ]);
    const root = new THREE.Mesh(new THREE.TubeGeometry(rootCurve, 8, 0.085, 8, false), barkMat);
    g.add(root);
  }

  // Layered curved boughs & arched botanical alpha-cutout leaf clusters
  const leafSprayGeo = new THREE.PlaneGeometry(1.45, 1.55, 3, 4);
  leafSprayGeo.translate(0, 0.775, 0);
  const pos = leafSprayGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = Math.max(0, pos.getY(i) / 1.55);
    const x = pos.getX(i);
    pos.setZ(i, Math.pow(y, 1.4) * 0.38 - (x * x) * 0.22);
    pos.setY(i, pos.getY(i) - Math.pow(y, 2.1) * 0.24);
  }
  leafSprayGeo.computeVertexNormals();

  const branchCount = 7;
  for (let b = 0; b < branchCount; b++) {
    const a = (b / branchCount) * Math.PI * 2 + hRand(20 + b) * 0.5;
    const reach = 1.65 + hRand(30 + b) * 0.55;
    const tipY = 4.65 + hRand(40 + b) * 0.95;
    const startY = 2.95 + (b % 3) * 0.32;
    const branchCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, startY, 0),
      new THREE.Vector3(Math.cos(a) * reach * 0.45, startY + 0.75, Math.sin(a) * reach * 0.45),
      new THREE.Vector3(Math.cos(a) * reach, tipY, Math.sin(a) * reach),
    ]);
    const limb = new THREE.Mesh(new THREE.TubeGeometry(branchCurve, 10, 0.095, 8, false), barkMat);
    limb.castShadow = true;
    g.add(limb);

    const tipPt = branchCurve.getPoint(1);
    const midPt = branchCurve.getPoint(0.68);
    // Arching leaf spray rosettes at branch tips & mid-crown
    for (const [pt, sc] of [
      [tipPt, 1.05],
      [midPt, 0.88],
    ] as Array<[THREE.Vector3, number]>) {
      for (let k = 0; k < 4; k++) {
        const yaw = a + k * 1.57 + hRand(b * 9 + k) * 0.4;
        const spray = new THREE.Mesh(leafSprayGeo, foliageMat);
        spray.position.copy(pt);
        spray.rotation.set(0.55 + hRand(b + k) * 0.28, yaw, (hRand(k * 7) - 0.5) * 0.25, 'YXZ');
        spray.scale.setScalar(sc);
        spray.castShadow = true;
        g.add(spray);
      }
    }
  }

  // Crown apex leaf sprays
  for (let k = 0; k < 6; k++) {
    const yaw = (k / 6) * Math.PI * 2;
    const crownSpray = new THREE.Mesh(leafSprayGeo, foliageMat);
    crownSpray.position.set(Math.cos(yaw) * 0.24, 4.95, Math.sin(yaw) * 0.24);
    crownSpray.rotation.set(0.42, yaw, 0, 'YXZ');
    crownSpray.scale.setScalar(1.12);
    crownSpray.castShadow = true;
    g.add(crownSpray);
  }

  return g;
}

/**
 * Traditional Wooden & Terracotta-Tiled Mithila Puja / Prasad Offering Mandapa Stall
 * featuring turned columns, stacked brass Kalasha pots, marigold offerings, and glowing Sukunda diya.
 */
export function createChowkPujaStall(params: {
  plinthStoneMat: THREE.Material;
  woodMat: THREE.Material;
  terracottaMat: THREE.Material;
  tealMat: THREE.Material;
  crimsonMat: THREE.Material;
  goldMat: THREE.Material;
  bronzeMat: THREE.Material;
  marigoldMat: THREE.Material;
  flameMat: THREE.Material;
}): THREE.Group {
  const {
    plinthStoneMat,
    woodMat,
    terracottaMat,
    tealMat,
    crimsonMat,
    goldMat,
    bronzeMat,
    marigoldMat,
    flameMat,
  } = params;
  const g = new THREE.Group();

  // Stone stall plinth (2.9m wide × 2.0m deep)
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.22, 2.0), plinthStoneMat);
  plinth.position.y = 0.11;
  plinth.castShadow = true;
  plinth.receiveShadow = true;

  // Carved wooden counter desk + crimson cloth drape
  const counterBase = new THREE.Mesh(new THREE.BoxGeometry(2.48, 0.68, 0.96), woodMat);
  counterBase.position.set(0, 0.56, 0.14);
  counterBase.castShadow = true;
  const counterTop = new THREE.Mesh(new THREE.BoxGeometry(2.62, 0.08, 1.10), woodMat);
  counterTop.position.set(0, 0.94, 0.14);
  const counterCloth = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.56, 0.04), crimsonMat);
  counterCloth.position.set(0, 0.58, 0.63);
  g.add(plinth, counterBase, counterTop, counterCloth);

  // 4 Turned Sal-wood corner colonnettes supporting tiled pagoda canopy
  const colPts: THREE.Vector2[] = [
    new THREE.Vector2(0.085, 0.0),
    new THREE.Vector2(0.09, 0.14),
    new THREE.Vector2(0.058, 0.24),
    new THREE.Vector2(0.068, 0.85),
    new THREE.Vector2(0.054, 1.45),
    new THREE.Vector2(0.062, 1.98),
    new THREE.Vector2(0.092, 2.12),
    new THREE.Vector2(0.095, 2.18),
  ];
  const colGeo = new THREE.LatheGeometry(colPts, 18);
  for (const cx of [-1.22, 1.22]) {
    for (const cz of [-0.76, 0.76]) {
      const col = new THREE.Mesh(colGeo, woodMat);
      col.position.set(cx, 0.22, cz);
      col.castShadow = true;
      g.add(col);
    }
  }

  // Carved wooden eave fascia & sloped terracotta Khaprail pagoda roof + brass Kalash spire
  const topBeam = new THREE.Mesh(new THREE.BoxGeometry(2.74, 0.14, 1.82), woodMat);
  topBeam.position.y = 2.44;
  const canopyRoof = new THREE.Mesh(
    createRectangularHipRoofGeometry(3.04, 0.86, 2.12, 0.52),
    terracottaMat,
  );
  canopyRoof.position.y = 2.94;
  canopyRoof.castShadow = true;
  const roofTrim = new THREE.Mesh(new THREE.BoxGeometry(2.96, 0.08, 2.04), tealMat);
  roofTrim.position.y = 2.52;
  const roofGajur = createDetailedGajurSpire(goldMat, bronzeMat, 0.48, 0.56);
  roofGajur.position.y = 3.36;
  g.add(topBeam, canopyRoof, roofTrim, roofGajur);

  // Brass ritual vessels (Kalasha pots), Puja Thali trays, marigold bowls & Sukunda lamp on counter
  const kalashGeo = getDetailedKumbhaUrnGeo();
  for (const kx of [-0.82, -0.52, 0.56]) {
    const k = new THREE.Mesh(kalashGeo, goldMat);
    k.scale.set(0.26, 0.28, 0.26);
    k.position.set(kx, 0.98, 0.16);
    g.add(k);
  }
  for (const tx of [-0.14, 0.22]) {
    const thali = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.03, 18), bronzeMat);
    thali.position.set(tx, 0.995, 0.22);
    const prasad = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.09, 12), marigoldMat);
    prasad.position.set(tx, 1.045, 0.22);
    g.add(thali, prasad);
  }
  const stallLamp = createDetailedBrassSukundaDiyo(goldMat, bronzeMat, flameMat, 0.72, true);
  stallLamp.position.set(0.92, 0.98, 0.24);
  g.add(stallLamp);

  return g;
}

/**
 * Carved Sandstone & Teal-Inlaid Courtyard Rest Bench.
 */
export function createChowkStoneBench(
  stoneMat: THREE.Material,
  marbleMat: THREE.Material,
  tealMat: THREE.Material,
): THREE.Group {
  const g = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.11, 1.88), marbleMat);
  seat.position.y = 0.46;
  seat.castShadow = true;
  seat.receiveShadow = true;
  const trim = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.05, 1.92), tealMat);
  trim.position.y = 0.42;

  for (const bz of [-0.70, 0.70]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.40, 0.22), stoneMat);
    leg.position.set(0, 0.20, bz);
    leg.castShadow = true;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.18, 0.12), stoneMat);
    arm.position.set(0, 0.60, bz * 1.18);
    g.add(leg, arm);
  }
  g.add(seat, trim);
  return g;
}

/**
 * Woven crimson & zari-gold ceremonial Asana prayer carpet laid flush before the Garbhagriha steps.
 */
export function createGarbhagrihaAsanaCarpet(
  crimsonMat: THREE.Material,
  goldMat: THREE.Material,
): THREE.Group {
  const g = new THREE.Group();
  g.userData.noMerge = true;

  const baseMat = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.016, 1.28), crimsonMat);
  baseMat.position.y = 0.008;
  baseMat.receiveShadow = true;
  g.add(baseMat);

  // Inner zari gold border strips
  for (const bz of [-0.56, 0.56]) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.019, 0.055), goldMat);
    strip.position.set(0, 0.009, bz);
    g.add(strip);
  }
  for (const bx of [-0.88, 0.88]) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.019, 1.18), goldMat);
    strip.position.set(bx, 0.009, 0);
    g.add(strip);
  }

  // Woven fringe tassels at front & back edges
  const tasselGeo = new THREE.CylinderGeometry(0.008, 0.006, 0.09, 6);
  tasselGeo.rotateX(Math.PI / 2);
  for (const fz of [-0.68, 0.68]) {
    for (let i = -7; i <= 7; i++) {
      const tassel = new THREE.Mesh(tasselGeo, goldMat);
      tassel.position.set(i * 0.115, 0.006, fz);
      g.add(tassel);
    }
  }
  return g;
}

/**
 * Five-wick turned brass Pancharti lamp stand flanking the Garbhagriha sanctum threshold.
 */
export function createDetailedPanchartiStand(
  goldMat: THREE.Material,
  bronzeMat: THREE.Material,
  flameMat: THREE.Material,
): THREE.Group {
  const g = new THREE.Group();
  g.userData.noMerge = true;

  const standPts: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.24, 0.0),
    new THREE.Vector2(0.22, 0.05),
    new THREE.Vector2(0.11, 0.12),
    new THREE.Vector2(0.065, 0.44),
    new THREE.Vector2(0.10, 0.56),
    new THREE.Vector2(0.055, 0.68),
    new THREE.Vector2(0.062, 0.92),
    new THREE.Vector2(0.18, 1.00),
    new THREE.Vector2(0.15, 1.04),
    new THREE.Vector2(0.0, 1.02),
  ];
  const pedestal = new THREE.Mesh(new THREE.LatheGeometry(standPts, 24), bronzeMat);
  pedestal.castShadow = true;
  g.add(pedestal);

  // Radial 5 Pancharti oil spoons + glowing teardrop Jyoti flames
  const bowlGeo = new THREE.CylinderGeometry(0.048, 0.024, 0.032, 12);
  const armGeo = new THREE.CylinderGeometry(0.012, 0.016, 0.16, 8);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const arm = new THREE.Mesh(armGeo, goldMat);
    arm.rotation.z = Math.PI / 2 - 0.18;
    arm.rotation.y = -a;
    arm.position.set(Math.cos(a) * 0.14, 1.04, Math.sin(a) * 0.14);
    const bowl = new THREE.Mesh(bowlGeo, goldMat);
    bowl.position.set(Math.cos(a) * 0.21, 1.07, Math.sin(a) * 0.21);
    const flame = createSacredFlameGroup(flameMat, 0.65);
    flame.position.set(Math.cos(a) * 0.22, 1.085, Math.sin(a) * 0.22);
    g.add(arm, bowl, flame);
  }
  const crownFlame = createSacredFlameGroup(flameMat, 0.85);
  crownFlame.position.set(0, 1.06, 0);
  g.add(crownFlame);

  return g;
}

/**
 * Embossed brass Puja Thali tray with spiral white Shankha conch, sandalwood katori, marigold blossoms & central aarti diya.
 */
export function createPujaThaliWithShankha(
  goldMat: THREE.Material,
  bronzeMat: THREE.Material,
  marigoldMat: THREE.Material,
  whiteMat: THREE.Material,
  flameMat: THREE.Material,
): THREE.Group {
  const g = new THREE.Group();
  g.userData.noMerge = true;

  const trayPts: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.24, 0.0),
    new THREE.Vector2(0.27, 0.035),
    new THREE.Vector2(0.255, 0.04),
    new THREE.Vector2(0.22, 0.012),
    new THREE.Vector2(0.0, 0.012),
  ];
  const tray = new THREE.Mesh(new THREE.LatheGeometry(trayPts, 28), bronzeMat);
  tray.castShadow = true;
  g.add(tray);

  // Spiral sacred white Shankha conch shell
  const shankhaPts: THREE.Vector2[] = [
    new THREE.Vector2(0.002, -0.09),
    new THREE.Vector2(0.025, -0.06),
    new THREE.Vector2(0.048, -0.02),
    new THREE.Vector2(0.056, 0.025),
    new THREE.Vector2(0.040, 0.06),
    new THREE.Vector2(0.018, 0.088),
    new THREE.Vector2(0.0, 0.102),
  ];
  const shankha = new THREE.Mesh(new THREE.LatheGeometry(shankhaPts, 18), whiteMat);
  shankha.rotation.z = Math.PI / 2 - 0.18;
  shankha.rotation.y = 0.42;
  shankha.position.set(-0.085, 0.058, 0.035);
  g.add(shankha);

  // Sandalwood / kumkum katori bowl + marigold petals
  const katori = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.028, 0.032, 16), goldMat);
  katori.position.set(0.095, 0.028, 0.055);
  const kumkum = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), marigoldMat);
  kumkum.scale.set(1, 0.45, 1);
  kumkum.position.set(0.095, 0.042, 0.055);
  g.add(katori, kumkum);

  for (let p = 0; p < 5; p++) {
    const a = (p / 5) * Math.PI - 0.2;
    const petal = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), marigoldMat);
    petal.scale.set(1.1, 0.65, 1.1);
    petal.position.set(Math.cos(a) * 0.11, 0.026, -0.09 + Math.sin(a) * 0.04);
    g.add(petal);
  }

  // Central brass aarti diya
  const diyaCup = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.024, 0.032, 16), goldMat);
  diyaCup.position.set(0.01, 0.028, -0.01);
  const flame = createSacredFlameGroup(flameMat, 0.68);
  flame.position.set(0.01, 0.045, -0.01);
  g.add(diyaCup, flame);

  return g;
}

/**
 * Generates an extruded wall pier/spandrel framing an authentic multi-foil cusped Mughal-Rajput archway.
 */
export function createCuspedArchSpandrelGeo(
  width: number,
  height: number,
  archWidth: number,
  archHeight: number,
  depth: number,
): THREE.ExtrudeGeometry {
  const hw = width * 0.5;
  const haw = archWidth * 0.5;
  const springY = archHeight * 0.54;

  const shape = new THREE.Shape();
  shape.moveTo(-hw, 0);
  shape.lineTo(-haw, 0);
  shape.lineTo(-haw, springY);
  shape.quadraticCurveTo(-haw * 0.96, archHeight * 0.68, -haw * 0.72, archHeight * 0.74);
  shape.quadraticCurveTo(-haw * 0.58, archHeight * 0.86, -haw * 0.34, archHeight * 0.88);
  shape.quadraticCurveTo(-haw * 0.18, archHeight * 0.97, 0, archHeight);
  shape.quadraticCurveTo(haw * 0.18, archHeight * 0.97, haw * 0.34, archHeight * 0.88);
  shape.quadraticCurveTo(haw * 0.58, archHeight * 0.86, haw * 0.72, archHeight * 0.74);
  shape.quadraticCurveTo(haw * 0.96, archHeight * 0.68, haw, springY);
  shape.lineTo(haw, 0);
  shape.lineTo(hw, 0);
  shape.lineTo(hw, height);
  shape.lineTo(-hw, height);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 12,
  });
  geo.translate(0, 0, -depth * 0.5);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates an authentic Mithila-Mughal bulbous ribbed onion dome profile via LatheGeometry.
 */
export function createOnionDomeGeometry(radius: number, height: number): THREE.LatheGeometry {
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(radius * 0.8, 0),
    new THREE.Vector2(radius * 0.98, height * 0.14),
    new THREE.Vector2(radius * 1.0, height * 0.34),
    new THREE.Vector2(radius * 0.84, height * 0.56),
    new THREE.Vector2(radius * 0.54, height * 0.76),
    new THREE.Vector2(radius * 0.22, height * 0.92),
    new THREE.Vector2(0.02, height),
  ];
  return new THREE.LatheGeometry(pts, 24);
}

/**
 * Generates an extruded S-curve Rajput-Mughal madal corbel bracket centered at origin.
 */
export function createCurvedBracketGeometry(
  thickness: number,
  height: number,
  projection: number,
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const hh = height * 0.5;
  const hp = projection * 0.5;
  shape.moveTo(-hp, hh);
  shape.lineTo(hp, hh);
  shape.lineTo(hp, hh * 0.52);
  shape.bezierCurveTo(hp * 0.55, hh * 0.32, hp * 0.35, -hh * 0.15, -hp * 0.22, -hh * 0.38);
  shape.quadraticCurveTo(-hp * 0.58, -hh * 0.55, -hp * 0.62, -hh);
  shape.lineTo(-hp, -hh);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    curveSegments: 10,
  });
  geo.translate(0, 0, -thickness * 0.5);
  geo.rotateY(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates an undistorted, true orthogonal rectangular hipped terracotta roof
 * (replacing skewed ConeGeometry+scale pyramids) centered vertically on [-height/2 .. +height/2].
 */
export function createRectangularHipRoofGeometry(
  width: number,
  height: number,
  depth: number,
  ridgeInsetScale = 0.68,
): THREE.BufferGeometry {
  const hw = width * 0.5;
  const hh = height * 0.5;
  const hd = depth * 0.5;

  const fl = new THREE.Vector3(-hw, -hh, hd);
  const fr = new THREE.Vector3(hw, -hh, hd);
  const br = new THREE.Vector3(hw, -hh, -hd);
  const bl = new THREE.Vector3(-hw, -hh, -hd);

  const positions: number[] = [];
  const uvs: number[] = [];

  const pushTri = (
    a: THREE.Vector3,
    b: THREE.Vector3,
    c: THREE.Vector3,
    ua: number,
    va: number,
    ub: number,
    vb: number,
    uc: number,
    vc: number,
  ) => {
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    uvs.push(ua, va, ub, vb, uc, vc);
  };

  if (width >= depth) {
    const rx = Math.max(0.04, Math.min(hw * 0.84, hw - hd * ridgeInsetScale));
    const rl = new THREE.Vector3(-rx, hh, 0);
    const rr = new THREE.Vector3(rx, hh, 0);

    // Front (+Z) slope
    pushTri(fl, fr, rr, 0, 0, width * 0.5, 0, (hw + rx) * 0.5, 1);
    pushTri(fl, rr, rl, 0, 0, (hw + rx) * 0.5, 1, (hw - rx) * 0.5, 1);
    // Back (-Z) slope
    pushTri(br, bl, rl, 0, 0, width * 0.5, 0, (hw + rx) * 0.5, 1);
    pushTri(br, rl, rr, 0, 0, (hw + rx) * 0.5, 1, (hw - rx) * 0.5, 1);
    // Left (-X) hip
    pushTri(bl, fl, rl, 0, 0, depth * 0.5, 0, depth * 0.25, 1);
    // Right (+X) hip
    pushTri(fr, br, rr, 0, 0, depth * 0.5, 0, depth * 0.25, 1);
  } else {
    const rz = Math.max(0.04, Math.min(hd * 0.84, hd - hw * ridgeInsetScale));
    const rf = new THREE.Vector3(0, hh, rz);
    const rb = new THREE.Vector3(0, hh, -rz);

    // Right (+X) slope
    pushTri(fr, br, rb, 0, 0, depth * 0.5, 0, (hd + rz) * 0.5, 1);
    pushTri(fr, rb, rf, 0, 0, (hd + rz) * 0.5, 1, (hd - rz) * 0.5, 1);
    // Left (-X) slope
    pushTri(bl, fl, rf, 0, 0, depth * 0.5, 0, (hd + rz) * 0.5, 1);
    pushTri(bl, rf, rb, 0, 0, (hd + rz) * 0.5, 1, (hd - rz) * 0.5, 1);
    // Front (+Z) hip
    pushTri(fl, fr, rf, 0, 0, width * 0.5, 0, width * 0.25, 1);
    // Back (-Z) hip
    pushTri(br, bl, rb, 0, 0, width * 0.5, 0, width * 0.25, 1);
  }

  // Bottom soffit cap (-Y normal)
  pushTri(bl, fr, fl, 0, 0, 1, 1, 0, 1);
  pushTri(bl, br, fr, 0, 0, 1, 0, 1, 1);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}


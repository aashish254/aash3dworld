import * as THREE from 'three';
import {
  createDetailedBrassSukundaDiyo,
  createDetailedGajurSpire,
  createRectangularHipRoofGeometry,
  createSacredFlameGroup,
} from './janakiMandirCraft';
import { BuddhaMaterials, createMonumentalSeatedBuddha } from './lumbiniBuddhaSculpt';
import { applyRealisticWaterShader } from './waterShader';
import { createWavingPrayerFlagGarland } from './prayerFlags';

const _m4 = new THREE.Matrix4();
const _v3 = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _e = new THREE.Euler();
const _colorTmp = new THREE.Color();

/**
 * Builds the historic Ashoka Pillar of Lumbini (249 BCE) faithfully matching real-life appearance:
 * tapered Chunar sandstone monolithic shaft, authentic weathered broken top with rounded protective cap
 * (no lion capital), bronze/iron clamp bands, Brahmi inscription face, brass protective fence & plaque.
 */
export function buildAuthenticAshokaPillar(
  stoneMat: THREE.Material,
  brickMat: THREE.Material,
  ironMat: THREE.Material,
  brassMat: THREE.Material,
  edictMap: THREE.Texture,
  edictNormal: THREE.Texture,
): THREE.Group {
  const g = new THREE.Group();

  // Stepped brick & sandstone fenced enclosure (3.8m x 3.8m)
  const brickBase = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.28, 3.8), brickMat);
  brickBase.position.y = 0.14;
  brickBase.castShadow = true;
  brickBase.receiveShadow = true;

  const stoneDeck = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.16, 3.2), stoneMat);
  stoneDeck.position.y = 0.36;
  stoneDeck.castShadow = true;
  stoneDeck.receiveShadow = true;
  g.add(brickBase, stoneDeck);

  // Golden-brass protective perimeter fence (authentic Lumbini brass railing)
  for (const sx of [-1.68, 1.68]) {
    for (const sz of [-1.68, 1.68]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.92, 0.14), stoneMat);
      post.position.set(sx, 0.72, sz);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), brassMat);
      cap.position.set(sx, 1.22, sz);
      g.add(post, cap);
    }
  }
  const railGeoX = new THREE.BoxGeometry(3.36, 0.055, 0.055);
  const railGeoZ = new THREE.BoxGeometry(0.055, 0.055, 3.36);
  for (const ry of [0.56, 1.06]) {
    for (const side of [-1.68, 1.68]) {
      const rx = new THREE.Mesh(railGeoX, brassMat);
      rx.position.set(0, ry, side);
      const rz = new THREE.Mesh(railGeoZ, brassMat);
      rz.position.set(side, ry, 0);
      g.add(rx, rz);
    }
  }
  const picketCoords: Array<[number, number]> = [];
  for (let i = -4; i <= 4; i++) {
    picketCoords.push([i * 0.34, -1.68], [i * 0.34, 1.68], [-1.68, i * 0.34], [1.68, i * 0.34]);
  }
  const picketGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.56, 6);
  const pickets = new THREE.InstancedMesh(picketGeo, brassMat, picketCoords.length);
  picketCoords.forEach(([px, pz], idx) => {
    _v3.set(px, 0.81, pz);
    _q.identity();
    _s.setScalar(1);
    _m4.compose(_v3, _q, _s);
    pickets.setMatrixAt(idx, _m4);
  });
  pickets.instanceMatrix.needsUpdate = true;
  pickets.computeBoundingSphere();
  g.add(pickets);

  // Pillar square stone plinth with Brahmi Edict engraving
  const pedSquare = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.44, 1.52), stoneMat);
  pedSquare.position.y = 0.66;
  pedSquare.castShadow = true;

  const edictMat = new THREE.MeshStandardMaterial({
    map: edictMap,
    normalMap: edictNormal,
    normalScale: new THREE.Vector2(1.0, 1.0),
    roughness: 0.72,
  });
  const edictEast = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.34, 0.72), edictMat);
  edictEast.position.set(0.77, 0.66, 0);
  const edictSouth = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.34, 0.06), edictMat);
  edictSouth.position.set(0, 0.66, 0.77);
  g.add(pedSquare, edictEast, edictSouth);

  // Monolithic tapered Chunar sandstone shaft (6.2m above plinth -> ~7.1m total)
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.47, 6.2, 24), stoneMat);
  shaft.position.y = 3.98;
  shaft.castShadow = true;
  shaft.receiveShadow = true;
  g.add(shaft);

  // Carved Brahmi inscription band directly on lower pillar face
  const shaftEdict = new THREE.Mesh(
    new THREE.CylinderGeometry(0.455, 0.462, 0.75, 24, 1, true, -0.55, 1.1),
    edictMat,
  );
  shaftEdict.position.y = 2.15;
  g.add(shaftEdict);

  // Historic dark iron/bronze structural clamp bands encircling the shaft
  for (const cy of [3.2, 5.1, 6.65]) {
    const rad = THREE.MathUtils.lerp(0.47, 0.35, (cy - 0.88) / 6.2) + 0.015;
    const band = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.032, 8, 24), ironMat);
    band.rotation.x = Math.PI / 2;
    band.position.y = cy;
    g.add(band);
  }

  // Authentic weathered broken/stepped top with protective bronze cap (NO lion capital!)
  const brokenShoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.35, 0.24, 18), stoneMat);
  brokenShoulder.position.y = 7.20;
  brokenShoulder.castShadow = true;
  const stoneCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.45),
    ironMat,
  );
  stoneCap.position.y = 7.28;
  g.add(brokenShoulder, stoneCap);

  return g;
}

/**
 * Builds the monumental stepped Pushkarini Sacred Pond (26.0m x 17.6m) directly south-east of Maya Devi Temple,
 * with 4 descending terracotta-red brick ghat tiers, dark stone pool bed, blooming lotus clusters,
 * and animated mirror-reflective water reflecting the temple facade.
 */
export function buildPushkariniPond(
  terracottaMat: THREE.Material,
  brickMat: THREE.Material,
  chunarMat: THREE.Material,
  waterNormal: THREE.Texture,
): THREE.Group {
  const g = new THREE.Group();

  const outerW = 26.0; // X
  const outerD = 17.6; // Z
  const waterW = 22.0;
  const waterD = 13.4;

  // Dark stone deep floor beneath water
  const pondFloor = new THREE.Mesh(
    new THREE.BoxGeometry(waterW + 0.8, 0.14, waterD + 0.8),
    new THREE.MeshStandardMaterial({ color: 0x16282a, roughness: 0.9 }),
  );
  pondFloor.position.y = -0.92;
  pondFloor.receiveShadow = true;
  g.add(pondFloor);

  // 4 stepped descending terracotta-brick ghat tiers (from outer coping at y=+0.34 down to -0.68)
  const tiers: Array<[number, number, number, number, number]> = [
    [outerW, outerD, 1.5, -0.18, 0.34], // outer parapet rim
    [outerW - 1.35, outerD - 1.35, 1.2, -0.32, 0.14], // upper ghat step
    [outerW - 2.6, outerD - 2.6, 0.92, -0.45, -0.06], // water-level step
    [outerW - 3.6, outerD - 3.6, 0.62, -0.58, -0.26], // submerged step
  ];
  tiers.forEach(([w, d, rimT, cy, h], idx) => {
    const mat = idx === 0 ? terracottaMat : brickMat;
    const nRim = new THREE.Mesh(new THREE.BoxGeometry(w, h + 0.82, rimT), mat);
    nRim.position.set(0, cy, -d * 0.5 + rimT * 0.5);
    const sRim = new THREE.Mesh(new THREE.BoxGeometry(w, h + 0.82, rimT), mat);
    sRim.position.set(0, cy, d * 0.5 - rimT * 0.5);
    const wRim = new THREE.Mesh(new THREE.BoxGeometry(rimT, h + 0.82, d - rimT * 1.9), mat);
    wRim.position.set(-w * 0.5 + rimT * 0.5, cy, 0);
    const eRim = new THREE.Mesh(new THREE.BoxGeometry(rimT, h + 0.82, d - rimT * 1.9), mat);
    eRim.position.set(w * 0.5 - rimT * 0.5, cy, 0);
    [nRim, sRim, wRim, eRim].forEach((m) => {
      m.castShadow = true;
      m.receiveShadow = true;
      g.add(m);
    });
  });

  // Formal South & North descending ritual stair piers
  for (const sz of [-waterD * 0.5 - 0.15, waterD * 0.5 + 0.15]) {
    for (const sx of [-2.4, 2.4]) {
      const pier = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.64, 0.72), chunarMat);
      pier.position.set(sx, 0.14, sz);
      pier.castShadow = true;
      g.add(pier);
    }
  }

  // Animated mirror-reflective sacred water plane (y = -0.14 in local = +0.21 world, cleanly above floor)
  const waterTimeUniform = { value: 0 };
  const waterMat = new THREE.MeshStandardMaterial({
    normalMap: waterNormal,
    normalScale: new THREE.Vector2(0.32, 0.32),
    color: 0x1b4e4c,
    roughness: 0.04,
    metalness: 0.36,
    transparent: true,
    opacity: 0.90,
  });
  applyRealisticWaterShader(waterMat, waterTimeUniform, {
    mode: 'pond',
    maxRadius: 12.5,
    flowSpeed: 0.95,
    deepTint: 0x0b2a2b,
    shallowTint: 0x226863,
  });
  g.userData.waterTimeUniform = waterTimeUniform;
  const waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(waterW, waterD, 20, 14), waterMat);
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.y = -0.14;
  waterMesh.userData.nonCollidable = true;
  g.add(waterMesh);

  // Subtle floating lotus pads & blossoms along edges
  const padGeo = new THREE.CircleGeometry(0.28, 12, 0.25, Math.PI * 1.8);
  padGeo.rotateX(-Math.PI / 2);
  const padMat = new THREE.MeshStandardMaterial({ color: 0x387439, roughness: 0.62 });
  const petalGeo = new THREE.ConeGeometry(0.07, 0.16, 5);
  const petalMat = new THREE.MeshStandardMaterial({ color: 0xf49bb7, roughness: 0.45 });
  for (const [lx, lz] of [
    [-8.2, -4.2],
    [-6.6, 4.4],
    [8.0, -4.0],
    [8.4, 4.1],
    [-2.8, -4.8],
    [3.2, 4.8],
  ] as Array<[number, number]>) {
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.set(lx, -0.125, lz);
    pad.userData.nonCollidable = true;
    g.add(pad);
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      const p = new THREE.Mesh(petalGeo, petalMat);
      p.position.set(lx + Math.cos(a) * 0.07, -0.085, lz + Math.sin(a) * 0.07);
      p.rotation.set(0.6, -a, 0);
      p.userData.nonCollidable = true;
      g.add(p);
    }
  }

  return g;
}

/**
 * Builds the Myanmar Golden Temple (Lokamani Pula Pagoda) inspired shrine from user photos:
 * stepped white base, red-and-white picket perimeter fence, ornate golden Burmese flame arches,
 * terraced golden octagonal plinth, Shwedagon bell stupa, ringed spire & Hti crown.
 */
export function buildMyanmarGoldenPagoda(
  whiteStuccoMat: THREE.Material,
  goldMat: THREE.Material,
  crimsonMat: THREE.Material,
): THREE.Group {
  const g = new THREE.Group();

  // White stepped masonry terrace (8.4m x 8.4m)
  const t1 = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.42, 8.4), whiteStuccoMat);
  t1.position.y = 0.21;
  t1.castShadow = true;
  t1.receiveShadow = true;
  const t2 = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.56, 7.2), whiteStuccoMat);
  t2.position.y = 0.70;
  t2.castShadow = true;
  t2.receiveShadow = true;
  g.add(t1, t2);

  // Red-and-white Burmese perimeter picket fence + golden crest frieze
  const railMat = whiteStuccoMat;
  const picketPts: THREE.Matrix4[] = [];
  for (const side of [-1, 1]) {
    const barZ = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.08, 0.08), railMat);
    barZ.position.set(0, 1.04, side * 4.05);
    const redStripZ = new THREE.Mesh(new THREE.BoxGeometry(8.1, 0.28, 0.04), crimsonMat);
    redStripZ.position.set(0, 0.68, side * 4.05);
    const barX = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 8.2), railMat);
    barX.position.set(side * 4.05, 1.04, 0);
    const redStripX = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 8.1), crimsonMat);
    redStripX.position.set(side * 4.05, 0.68, 0);
    g.add(barZ, redStripZ, barX, redStripX);

    for (let i = -9; i <= 9; i++) {
      if (Math.abs(i) <= 1 && side === 1) continue; // open front entry gate
      _v3.set(i * 0.42, 0.74, side * 4.05);
      _q.identity();
      _s.set(0.045, 0.64, 0.045);
      picketPts.push(new THREE.Matrix4().compose(_v3, _q, _s));
      _v3.set(side * 4.05, 0.74, i * 0.42);
      picketPts.push(new THREE.Matrix4().compose(_v3, _q, _s));
    }
  }
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const fenceInst = new THREE.InstancedMesh(unitBox, railMat, picketPts.length);
  picketPts.forEach((m, idx) => fenceInst.setMatrixAt(idx, m));
  fenceInst.instanceMatrix.needsUpdate = true;
  fenceInst.computeBoundingSphere();
  g.add(fenceInst);

  // Ornate Golden Burmese Flame-Pediment Entrance Gate on South (+Z) & North (-Z)
  for (const side of [-1, 1]) {
    const gz = side * 3.62;
    const archGroup = new THREE.Group();
    archGroup.position.set(0, 0.42, gz);
    if (side === -1) archGroup.rotation.y = Math.PI;
    for (const sx of [-0.72, 0.72]) {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.32, 2.0, 0.36), goldMat);
      col.position.set(sx, 1.0, 0);
      col.castShadow = true;
      archGroup.add(col);
    }
    const pediment = new THREE.Mesh(new THREE.ConeGeometry(1.18, 1.38, 4), goldMat);
    pediment.rotation.y = Math.PI / 4;
    pediment.scale.set(1.0, 1.0, 0.36);
    pediment.position.set(0, 2.55, 0);
    pediment.castShadow = true;
    const grille = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.65, 0.06), whiteStuccoMat);
    grille.position.set(0, 0.85, 0);
    archGroup.add(pediment, grille);
    g.add(archGroup);
  }

  // 4 Terraced Golden Plinths rising into the Shwedagon Bell Stupa & Spire
  for (let tier = 0; tier < 4; tier++) {
    const w = 6.0 - tier * 0.78;
    const h = 0.42;
    const step = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), goldMat);
    step.position.y = 0.98 + tier * h + h * 0.5;
    step.castShadow = true;
    step.receiveShadow = true;
    g.add(step);
    // Corner flame finials
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const fin = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.42, 6), goldMat);
        fin.position.set(sx * (w * 0.5 - 0.14), 0.98 + (tier + 1) * h + 0.18, sz * (w * 0.5 - 0.14));
        g.add(fin);
      }
    }
  }

  // Golden Shwedagon Bell Dome + Ringed Conical Spire + Openwork Hti Umbrella Crown (~10.5m total height)
  const bellPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(1.88, 0.0),
    new THREE.Vector2(1.56, 0.48),
    new THREE.Vector2(1.24, 1.15),
    new THREE.Vector2(1.02, 1.85),
    new THREE.Vector2(0.76, 2.48),
    new THREE.Vector2(0.56, 3.10),
    new THREE.Vector2(0.32, 4.10),
    new THREE.Vector2(0.16, 5.20),
    new THREE.Vector2(0.04, 6.20),
  ];
  const bell = new THREE.Mesh(new THREE.LatheGeometry(bellPts, 28), goldMat);
  bell.position.y = 2.66;
  bell.castShadow = true;
  g.add(bell);

  for (let r = 0; r < 6; r++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.68 - r * 0.075, 0.036, 8, 22), goldMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 5.45 + r * 0.28;
    g.add(ring);
  }
  const htiCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.48, 0.36, 12, 1, true), goldMat);
  htiCrown.position.y = 7.75;
  const htiOrb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), goldMat);
  htiOrb.position.y = 8.95;
  g.add(htiCrown, htiOrb);

  return g;
}

/**
 * Builds the Royal Thai Monastery White-Marble Pavilion (Wat Thai Lumbini style)
 * sheltering the Monumental Golden Dhyana Buddha holding a dark alms bowl atop a red-and-gold
 * snow-lion Dharmachakra throne (combining both user reference images!).
 */
export function buildThaiMarbleSanctuary(
  whiteMarbleMat: THREE.Material,
  goldMat: THREE.Material,
  crimsonMat: THREE.Material,
  heroMats: BuddhaMaterials,
): { group: THREE.Group; light: THREE.PointLight } {
  const g = new THREE.Group();

  // Wide white marble base terrace (8.6m x 8.6m)
  const base1 = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.38, 8.6), whiteMarbleMat);
  base1.position.y = 0.19;
  base1.castShadow = true;
  base1.receiveShadow = true;
  const base2 = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.36, 7.6), whiteMarbleMat);
  base2.position.y = 0.56;
  base2.castShadow = true;
  base2.receiveShadow = true;
  g.add(base1, base2);

  // Corner & colonnade Thai white marble columns with gilded lotus capitals
  for (const sx of [-3.1, 0, 3.1]) {
    for (const sz of [-3.1, 3.1]) {
      if (sx === 0 && sz > 0) continue; // front view open
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.24, 3.8, 16), whiteMarbleMat);
      col.position.set(sx, 2.64, sz);
      col.castShadow = true;
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.21, 0.28, 16), goldMat);
      cap.position.set(sx, 4.42, sz);
      g.add(col, cap);
    }
  }
  for (const sx of [-3.1, 3.1]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.24, 3.8, 16), whiteMarbleMat);
    col.position.set(sx, 2.64, 0);
    col.castShadow = true;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.21, 0.28, 16), goldMat);
    cap.position.set(sx, 4.42, 0);
    g.add(col, cap);
  }

  // Sweeping Multi-Tiered White & Gold Thai Chofah Roofs
  for (const [tier, rw, rh, ry] of [
    [0, 8.4, 1.35, 4.58],
    [1, 6.2, 1.25, 5.72],
    [2, 3.8, 1.15, 6.72],
  ] as Array<[number, number, number, number]>) {
    const roof = new THREE.Mesh(createRectangularHipRoofGeometry(rw, rh, rw, 0.58), whiteMarbleMat);
    roof.position.y = ry + rh * 0.5;
    roof.castShadow = true;
    const trim = new THREE.Mesh(new THREE.BoxGeometry(rw + 0.12, 0.10, rw + 0.12), goldMat);
    trim.position.y = ry + 0.05;
    g.add(roof, trim);
    // Golden Chofah sky-tassel finials at gable corners
    if (tier < 2) {
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const chofah = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.65, 6), goldMat);
          chofah.position.set(sx * (rw * 0.46), ry + 0.42, sz * (rw * 0.46));
          chofah.rotation.z = -sx * 0.28;
          g.add(chofah);
        }
      }
    }
  }
  const spire = createDetailedGajurSpire(goldMat, crimsonMat, 0.85);
  spire.position.y = 7.82;
  g.add(spire);

  // Monumental Golden Dhyana Buddha with Dark Alms Bowl atop Red & Gold Tibetan Lion Throne
  const buddha = createMonumentalSeatedBuddha(heroMats, {
    scale: 0.92,
    pose: 'dhyana',
    withNagaCanopy: false,
    withOfferingLamps: true,
    withAlmsBowl: true,
    crimsonThrone: true,
  });
  buddha.position.set(0, 0.74, 0);
  g.add(buddha);

  const light = new THREE.PointLight(0xffe1a6, 1.8, 12, 1.4);
  light.position.set(0, 4.2, 1.1);
  g.add(light);

  return { group: g, light };
}

/**
 * Builds the Sacred Bodhi (Pipal) Tree Chautara platform beside Pushkarini Pond:
 * stepped octagonal brick & white stucco platform, gnarled root buttresses, saffron prayer scarf,
 * InstancedMesh botanical Bodhi foliage, and 5-color Buddhist prayer flag canopy.
 */
export function buildSacredBodhiChautara(
  brickMat: THREE.Material,
  whiteStuccoMat: THREE.Material,
  timberMat: THREE.Material,
  goldMat: THREE.Material,
  bronzeMat: THREE.Material,
  flameMat: THREE.Material,
): THREE.Group {
  const bodhi = new THREE.Group();

  const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.0, 0.36, 8), brickMat);
  tier1.position.y = 0.18;
  tier1.castShadow = true;
  tier1.receiveShadow = true;
  const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(2.22, 2.34, 0.38, 8), whiteStuccoMat);
  tier2.position.y = 0.55;
  tier2.castShadow = true;
  tier2.receiveShadow = true;
  const soil = new THREE.Mesh(
    new THREE.CylinderGeometry(1.92, 1.98, 0.14, 16),
    new THREE.MeshStandardMaterial({ color: 0x4b3828, roughness: 0.95 }),
  );
  soil.position.y = 0.72;
  bodhi.add(tier1, tier2, soil);

  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.72, 0),
    new THREE.Vector3(0.12, 2.1, 0.08),
    new THREE.Vector3(-0.08, 3.4, -0.05),
    new THREE.Vector3(0.05, 4.6, 0.05),
  ]);
  const trunk = new THREE.Mesh(new THREE.TubeGeometry(trunkCurve, 14, 0.34, 10, false), timberMat);
  trunk.castShadow = true;
  bodhi.add(trunk);

  // Saffron ceremonial cloth tied around sacred trunk
  const scarf = new THREE.Mesh(
    new THREE.TorusGeometry(0.37, 0.06, 8, 20),
    new THREE.MeshStandardMaterial({ color: 0xdf7b1c, roughness: 0.72 }),
  );
  scarf.rotation.x = Math.PI / 2;
  scarf.position.set(0.06, 1.85, 0.04);
  bodhi.add(scarf);

  const diyo = createDetailedBrassSukundaDiyo(goldMat, bronzeMat, flameMat, 0.75, true);
  diyo.position.set(1.05, 0.74, 1.78);
  bodhi.add(diyo);

  for (let r = 0; r < 6; r++) {
    const a = (r / 6) * Math.PI * 2 + 0.25;
    const rc = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(a) * 0.24, 1.65, Math.sin(a) * 0.24),
      new THREE.Vector3(Math.cos(a) * 0.62, 1.05, Math.sin(a) * 0.62),
      new THREE.Vector3(Math.cos(a) * 1.24, 0.75, Math.sin(a) * 1.24),
    ]);
    const rm = new THREE.Mesh(new THREE.TubeGeometry(rc, 8, 0.12, 8, false), timberMat);
    rm.castShadow = true;
    bodhi.add(rm);
  }

  const branchEndpoints: THREE.Vector3[] = [];
  for (let b = 0; b < 6; b++) {
    const a = (b / 6) * Math.PI * 2 + 0.35;
    const reach = 2.4 + (b % 2) * 0.45;
    const topY = 5.45 + (b % 3) * 0.48;
    const bc = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.04, 3.6 + (b % 2) * 0.25, 0.02),
      new THREE.Vector3(Math.cos(a) * reach * 0.52, 4.6, Math.sin(a) * reach * 0.52),
      new THREE.Vector3(Math.cos(a) * reach, topY, Math.sin(a) * reach),
    ]);
    const bm = new THREE.Mesh(new THREE.TubeGeometry(bc, 10, 0.12, 8, false), timberMat);
    bm.castShadow = true;
    bodhi.add(bm);
    branchEndpoints.push(bc.getPoint(0.65), bc.getPoint(1.0));
  }
  branchEndpoints.push(new THREE.Vector3(0, 6.2, 0), new THREE.Vector3(0.25, 6.5, -0.2));

  const sprigGeo = new THREE.ConeGeometry(0.34, 0.48, 5);
  sprigGeo.scale(1.25, 0.52, 0.95);
  const sprigMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.72 });
  const leafPalette = [0x3d6e31, 0x4b7f3a, 0x2f5a26, 0x5c8f43, 0x679948];
  const leafCount = 720;
  const leafInst = new THREE.InstancedMesh(sprigGeo, sprigMat, leafCount);
  leafInst.castShadow = true;
  leafInst.receiveShadow = true;
  leafInst.userData.nonCollidable = true;
  for (let i = 0; i < leafCount; i++) {
    const center = branchEndpoints[i % branchEndpoints.length];
    const ga = i * 2.39996323;
    const rad = Math.sqrt(((i * 19) % 100) / 100) * 1.55;
    const hVar = (((i * 37) % 100) / 100 - 0.35) * 1.25;
    _v3.set(
      center.x + Math.cos(ga) * rad,
      Math.max(4.0, center.y + hVar),
      center.z + Math.sin(ga) * rad,
    );
    _q.setFromEuler(_e.set(((i * 7) % 10) * 0.08 - 0.4, ga, ((i * 11) % 10) * 0.06 - 0.3));
    _s.setScalar(0.8 + ((i * 13) % 10) * 0.06);
    _m4.compose(_v3, _q, _s);
    leafInst.setMatrixAt(i, _m4);
    _colorTmp.setHex(leafPalette[i % leafPalette.length]);
    leafInst.setColorAt(i, _colorTmp);
  }
  leafInst.instanceMatrix.needsUpdate = true;
  if (leafInst.instanceColor) leafInst.instanceColor.needsUpdate = true;
  leafInst.computeBoundingSphere();
  bodhi.add(leafInst);

  // 6 perimeter bollards anchoring radial & ring waving 5-color Buddhist Lungta canopies
  const canopyRadius = 3.08;
  const canopyPosts: THREE.Vector3[] = [];
  for (let p = 0; p < 6; p++) {
    const angle = (p / 6) * Math.PI * 2 + 0.15;
    const bx = Math.cos(angle) * canopyRadius;
    const bz = Math.sin(angle) * canopyRadius;
    const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.48, 8), timberMat);
    bollard.position.set(bx, 0.74, bz);
    bollard.castShadow = true;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), goldMat);
    cap.position.set(bx, 1.50, bz);
    bodhi.add(bollard, cap);
    canopyPosts.push(new THREE.Vector3(bx, 1.44, bz));
  }
  for (let p = 0; p < canopyPosts.length; p++) {
    const angle = (p / 6) * Math.PI * 2 + 0.15;
    const canopyAnchor = new THREE.Vector3(Math.cos(angle) * 1.45, 4.75, Math.sin(angle) * 1.45);
    const radialLine = createWavingPrayerFlagGarland(canopyAnchor, canopyPosts[p], {
      flagCount: 6,
      flagWidth: 0.28,
      flagHeight: 0.36,
      sag: 0.28,
    });
    radialLine.group.userData.nonCollidable = true;
    bodhi.add(radialLine.group);

    const nextPost = canopyPosts[(p + 1) % canopyPosts.length];
    const ringLine = createWavingPrayerFlagGarland(canopyPosts[p], nextPost, {
      flagCount: 5,
      flagWidth: 0.26,
      flagHeight: 0.34,
      sag: 0.22,
    });
    ringLine.group.userData.nonCollidable = true;
    bodhi.add(ringLine.group);
  }

  const diyoLight = new THREE.PointLight(0xffb454, 1.85, 14, 1.5);
  diyoLight.position.set(1.05, 1.5, 1.78);
  diyoLight.userData = {
    flickerPhase: 1.7,
    flickerAmp: 0.14,
    intensityScale: 0.88,
    warmFlicker: true,
  };
  bodhi.add(diyoLight);
  bodhi.userData.diyoLight = diyoLight;

  return bodhi;
}

/**
 * Builds the Eternal Peace Flame (Shanti Deep) monument with stepped Chunar sandstone plinth,
 * bronze brazier bowl, glowing ember core, animated flame & warm PointLight.
 */
export function buildEternalPeaceFlame(
  chunarStoneMat: THREE.Material,
  marbleWalkMat: THREE.Material,
  warmBronzeMat: THREE.Material,
  giltGoldMat: THREE.Material,
  flameGlowMat: THREE.Material,
): { group: THREE.Group; flameNode: THREE.Object3D; light: THREE.PointLight } {
  const g = new THREE.Group();

  const b1 = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.92, 0.28, 8), chunarStoneMat);
  b1.position.y = 0.14;
  b1.castShadow = true;
  b1.receiveShadow = true;
  const b2 = new THREE.Mesh(new THREE.CylinderGeometry(1.20, 1.38, 0.42, 8), marbleWalkMat);
  b2.position.y = 0.49;
  b2.castShadow = true;

  const pedPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.62, 0.0),
    new THREE.Vector2(0.48, 0.24),
    new THREE.Vector2(0.36, 0.52),
    new THREE.Vector2(0.46, 0.78),
    new THREE.Vector2(0.40, 0.90),
  ];
  const ped = new THREE.Mesh(new THREE.LatheGeometry(pedPts, 20), warmBronzeMat);
  ped.position.y = 0.70;
  ped.castShadow = true;

  const bowlPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.40, 0.02),
    new THREE.Vector2(0.82, 0.22),
    new THREE.Vector2(0.88, 0.36),
    new THREE.Vector2(0.76, 0.38),
    new THREE.Vector2(0.0, 0.20),
  ];
  const bowl = new THREE.Mesh(new THREE.LatheGeometry(bowlPts, 24), giltGoldMat);
  bowl.position.y = 1.56;
  bowl.castShadow = true;

  const ember = new THREE.Mesh(
    new THREE.SphereGeometry(0.48, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
    new THREE.MeshStandardMaterial({
      color: 0x7c2008,
      emissive: 0xff5a18,
      emissiveIntensity: 2.1,
      roughness: 0.65,
    }),
  );
  ember.position.y = 1.72;

  const flameNode = createSacredFlameGroup(flameGlowMat, 4.0);
  flameNode.position.y = 1.84;
  flameNode.userData.nonCollidable = true;
  flameNode.userData.noMerge = true;
  flameNode.userData.onFlickerUpdate = (elapsed: number) => {
    const pulse = 1 + Math.sin(elapsed * 7.2) * 0.12 + Math.cos(elapsed * 11.4) * 0.06;
    flameNode.scale.set(1 + Math.sin(elapsed * 5.3) * 0.07, pulse, 1 + Math.cos(elapsed * 6.1) * 0.07);
  };

  const light = new THREE.PointLight(0xffa43c, 2.3, 18, 1.45);
  light.position.set(0, 2.65, 0);

  g.add(b1, b2, ped, bowl, ember, flameNode, light);
  return { group: g, flameNode, light };
}

/**
 * Builds a carved Maurya weathered brick archaeological stupa/monastery ruin base
 * (matching excavated ruins scattered across the Sacred Garden lawns around Maya Devi Temple).
 */
export function buildExcavatedBrickRuin(
  brickMat: THREE.Material,
  w: number,
  h: number,
  d: number,
): THREE.Group {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.52, d), brickMat);
  base.position.y = h * 0.26;
  base.castShadow = true;
  base.receiveShadow = true;

  const upper = new THREE.Mesh(new THREE.BoxGeometry(w * 0.78, h * 0.36, d * 0.78), brickMat);
  upper.position.y = h * 0.52 + h * 0.18;
  upper.castShadow = true;
  upper.receiveShadow = true;

  const crest = new THREE.Mesh(new THREE.BoxGeometry(w * 0.54, h * 0.22, d * 0.54), brickMat);
  crest.position.y = h * 0.88 + h * 0.11;
  crest.castShadow = true;
  g.add(base, upper, crest);
  return g;
}

/**
 * Builds a carved Chunar sandstone Dharmachakra Torana ceremonial entrance archway.
 */
export function buildToranaGate(
  stoneMat: THREE.Material,
  brickMat: THREE.Material,
  goldMat: THREE.Material,
  bronzeMat: THREE.Material,
): THREE.Group {
  const g = new THREE.Group();
  for (const side of [-1, 1]) {
    const px = side * 3.55;
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.44, 1.18), brickMat);
    base.position.set(px, 0.22, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.36, 0.96), stoneMat);
    plinth.position.set(px, 0.62, 0);
    plinth.castShadow = true;
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.68, 3.80, 0.68), stoneMat);
    pillar.position.set(px, 2.70, 0);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    const capital = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.28, 0.96), stoneMat);
    capital.position.set(px, 4.74, 0);
    capital.castShadow = true;
    const lotusCap = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.24, 16), goldMat);
    lotusCap.position.set(px, 5.00, 0);
    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), goldMat);
    finial.position.set(px, 5.21, 0);
    g.add(base, plinth, pillar, capital, lotusCap, finial);
  }
  for (const [by, bw, bh] of [
    [4.70, 8.2, 0.34],
    [5.27, 8.7, 0.30],
  ] as Array<[number, number, number]>) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.64), stoneMat);
    beam.position.set(0, by, 0);
    beam.castShadow = true;
    beam.receiveShadow = true;
    g.add(beam);
    for (const side of [-1, 1]) {
      const volute = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.065, 8, 16), goldMat);
      volute.position.set(side * (bw * 0.5 + 0.04), by + 0.06, 0);
      g.add(volute);
    }
  }
  for (const sx of [-1.85, 0, 1.85]) {
    const spacer = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.44), bronzeMat);
    spacer.position.set(sx, 4.99, 0);
    g.add(spacer);
  }
  const wheelOuter = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.06, 10, 32), goldMat);
  wheelOuter.position.set(0, 6.07, 0);
  wheelOuter.castShadow = true;
  const wheelHub = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.14, 16), goldMat);
  wheelHub.rotation.x = Math.PI / 2;
  wheelHub.position.set(0, 6.07, 0);
  const wheelStand = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.26, 0.36), stoneMat);
  wheelStand.position.set(0, 5.51, 0);
  g.add(wheelOuter, wheelHub, wheelStand);
  const spokeGeo = new THREE.CylinderGeometry(0.022, 0.022, 1.06, 8);
  for (let i = 0; i < 4; i++) {
    const spoke = new THREE.Mesh(spokeGeo, goldMat);
    spoke.position.set(0, 6.07, 0);
    spoke.rotation.z = (i / 4) * Math.PI;
    g.add(spoke);
  }
  return g;
}

/**
 * Builds a carved Chunar sandstone Peace Garden lantern pedestal.
 */
export function buildPeaceLantern(
  stoneMat: THREE.Material,
  bronzeMat: THREE.Material,
  glowMat: THREE.Material,
): THREE.Group {
  const g = new THREE.Group();
  const foot = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.18, 0.66), stoneMat);
  foot.position.y = 0.09;
  foot.castShadow = true;
  foot.receiveShadow = true;
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.22, 0.50), stoneMat);
  plinth.position.y = 0.29;
  plinth.castShadow = true;
  const shaftPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.16, 0.0),
    new THREE.Vector2(0.11, 0.18),
    new THREE.Vector2(0.10, 0.86),
    new THREE.Vector2(0.15, 0.98),
    new THREE.Vector2(0.0, 0.98),
  ];
  const shaft = new THREE.Mesh(new THREE.LatheGeometry(shaftPts, 16), stoneMat);
  shaft.position.y = 0.40;
  shaft.castShadow = true;
  const sill = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.09, 0.44), stoneMat);
  sill.position.y = 1.425;
  const glassCore = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.34, 8), glowMat);
  glassCore.position.y = 1.64;
  for (const sx of [-0.15, 0.15]) {
    for (const sz of [-0.15, 0.15]) {
      const mullion = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.36, 6), bronzeMat);
      mullion.position.set(sx, 1.64, sz);
      g.add(mullion);
    }
  }
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.26, 4), stoneMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 1.94;
  roof.castShadow = true;
  const kalash = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 8), bronzeMat);
  kalash.position.y = 2.11;
  g.add(foot, plinth, shaft, sill, glassCore, roof, kalash);
  return g;
}

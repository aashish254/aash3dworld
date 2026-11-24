import * as THREE from 'three';
import { JanakiMandirTextures } from './janakiMandirTextures';
import {
  createChowkChautaraTree,
  createChowkStoneBench,
  createCurvedBracketGeometry,
  createCuspedArchSpandrelGeo,
  createDetailedBrassSukundaDiyo,
  createDetailedDeepastambha,
  createDetailedGajurSpire,
  createDetailedTempleBell,
  createOnionDomeGeometry,
  getDetailedParterreFinialGeo,
  getSacredTeardropFlameGeo,
} from './janakiMandirCraft';
import { applyRealisticWaterShader } from './waterShader';

export interface JanakiExteriorParams {
  group: THREE.Group;
  jTex: JanakiMandirTextures;
  plazaY: number;
  waterUTime: { value: number };
  marbleWallMat: THREE.Material;
  whiteTrimMat: THREE.Material;
  tealTrimMat: THREE.Material;
  terracottaTrimMat: THREE.Material;
  flagstoneMat: THREE.Material;
  brickPlazaMat: THREE.Material;
  plinthStoneMat: THREE.Material;
  passageStoneMat: THREE.Material;
  darkWoodMat: THREE.Material;
  goldMat: THREE.Material;
  bronzeMat: THREE.Material;
  diyoGlowMat: THREE.Material;
  marigoldMat: THREE.Material;
  crimsonClothMat: THREE.Material;
  barkMat: THREE.Material;
  chautaraSoilMat: THREE.Material;
  chautaraFoliageMat: THREE.Material;
  domeMat: THREE.Material;
  beaconLights: THREE.PointLight[];
  animatedNodes: THREE.Object3D[];
  registerBell: (bell: THREE.Group) => THREE.Group;
  markOccluder: (obj: THREE.Object3D) => void;
}

/**
 * Populates the spacious West, North, and East perimeter grounds outside Janaki Mandir
 * inside the enclosed heritage compound with authentic Janakpur sacred & civic monuments:
 * - Outer Flagstone Parikrama Perimeter Walkways, landscaped garden beds & sandstone benches
 * - Ganga Sagar Sacred Stepped Ghat Kund Pond with animated water shader, brass handrails,
 *   floating leaf diyas, lotus blossoms, Varuna shrine, and Dana bird-feeding pedestal
 * - Vivah Mandap 12-Pillar Sacred Marriage Pavilion with stepped Tri-Mekhala Vedic Havan Kund
 * - North Garuda Stambha + Twin North Wayside Shrines + Sacred Peepal Chautara Trees
 * - Ornate Newari/Mithila Carved Timber West Pilgrim Pati (Phalcha) Rest Pavilion
 * - East Heritage Pyaau Water Kiosk + South-side Pakhala Foot-Wash Trough & Paduka Shoe Stand
 */
export function createJanakiMandirExterior({
  group,
  jTex,
  plazaY,
  waterUTime,
  marbleWallMat,
  whiteTrimMat,
  tealTrimMat,
  terracottaTrimMat,
  flagstoneMat,
  brickPlazaMat,
  plinthStoneMat,
  passageStoneMat,
  darkWoodMat,
  goldMat,
  bronzeMat,
  diyoGlowMat,
  marigoldMat,
  crimsonClothMat,
  barkMat,
  chautaraSoilMat,
  chautaraFoliageMat,
  domeMat,
  beaconLights,
  animatedNodes,
  registerBell,
  markOccluder,
}: JanakiExteriorParams): void {
  const exterior = new THREE.Group();
  exterior.position.y = plazaY;

  // Shared turned timber & brass/ceramic materials for high-detail craft
  const carvedTimberMat = new THREE.MeshStandardMaterial({
    color: 0x3b2416,
    roughness: 0.72,
    metalness: 0.06,
  });
  const warmCushionMat = new THREE.MeshStandardMaterial({
    color: 0xa62626,
    roughness: 0.88,
  });
  const saffronTrimMat = new THREE.MeshStandardMaterial({
    color: 0xd98218,
    roughness: 0.76,
  });
  const slateStoneMat = new THREE.MeshStandardMaterial({
    color: 0x3b3d42,
    roughness: 0.84,
  });

  // -------------------------------------------------------------------------
  // 1. OUTER PARIKRAMA FLAGSTONE WALKWAY BORDER & LANDSCAPED GARDEN CURBS
  // -------------------------------------------------------------------------
  const westWalk = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.08, 43.2), flagstoneMat);
  westWalk.position.set(-26.8, 0.02, -3.5);
  westWalk.receiveShadow = true;

  const eastWalk = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.08, 43.2), flagstoneMat);
  eastWalk.position.set(26.8, 0.02, -3.5);
  eastWalk.receiveShadow = true;

  const northWalk = new THREE.Mesh(new THREE.BoxGeometry(57.0, 0.08, 3.6), flagstoneMat);
  northWalk.position.set(0, 0.02, -23.8);
  northWalk.receiveShadow = true;

  // Connecting transverse paths linking Parikrama walks cleanly to outer compound walks & monuments
  const northStambhaPath = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.075, 8.6), flagstoneMat);
  northStambhaPath.position.set(0, 0.018, -28.0);
  northStambhaPath.receiveShadow = true;

  const westBridgeWalk = new THREE.Mesh(new THREE.BoxGeometry(27.8, 0.075, 3.2), flagstoneMat);
  westBridgeWalk.position.set(-40.8, 0.018, -23.8);
  westBridgeWalk.receiveShadow = true;

  const eastBridgeWalk = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.075, 3.2), flagstoneMat);
  eastBridgeWalk.position.set(32.0, 0.018, -23.8);
  eastBridgeWalk.receiveShadow = true;

  const pyaauLinkWalk = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.075, 4.4), flagstoneMat);
  pyaauLinkWalk.position.set(31.8, 0.018, -3.5);
  pyaauLinkWalk.receiveShadow = true;

  const southWestLink = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.075, 3.6), brickPlazaMat);
  southWestLink.position.set(-32.2, 0.016, 16.0);
  southWestLink.receiveShadow = true;

  // 4 Perimeter brick apron strips framing Ganga Sagar coping rim (keeping basin interior 100% open!)
  const gsNorthApron = new THREE.Mesh(new THREE.BoxGeometry(22.4, 0.08, 3.8), brickPlazaMat);
  gsNorthApron.position.set(-45.3, 0.015, 16.0 - 11.2);
  gsNorthApron.receiveShadow = true;
  const gsSouthApron = new THREE.Mesh(new THREE.BoxGeometry(22.4, 0.08, 3.8), brickPlazaMat);
  gsSouthApron.position.set(-45.3, 0.015, 16.0 + 11.2);
  gsSouthApron.receiveShadow = true;
  const gsWestApron = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.08, 18.6), brickPlazaMat);
  gsWestApron.position.set(-53.7, 0.015, 16.0);
  gsWestApron.receiveShadow = true;
  const gsEastApron = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.08, 18.6), brickPlazaMat);
  gsEastApron.position.set(-35.4, 0.015, 16.0);
  gsEastApron.receiveShadow = true;

  const vivahApron = new THREE.Mesh(new THREE.BoxGeometry(13.5, 0.08, 13.5), brickPlazaMat);
  vivahApron.position.set(-45.0, 0.015, 40.0);
  vivahApron.receiveShadow = true;

  exterior.add(
    westWalk,
    eastWalk,
    northWalk,
    northStambhaPath,
    westBridgeWalk,
    eastBridgeWalk,
    pyaauLinkWalk,
    southWestLink,
    gsNorthApron,
    gsSouthApron,
    gsWestApron,
    gsEastApron,
    vivahApron,
  );

  // Landscaped Raised Heritage Garden Lawn Beds (NW & NE outer greens inside the closed wall)
  const addGardenLawnBed = (gx: number, gz: number, bw: number, bd: number) => {
    const bed = new THREE.Group();
    bed.position.set(gx, 0, gz);

    // 4 enclosing brick & stone curb borders
    const borders: Array<[number, number, number, number]> = [
      [0, -bd / 2, bw + 0.4, 0.36],
      [0, bd / 2, bw + 0.4, 0.36],
      [-bw / 2, 0, 0.36, bd],
      [bw / 2, 0, 0.36, bd],
    ];
    for (const [bx, bz, w, d] of borders) {
      const curb = new THREE.Mesh(new THREE.BoxGeometry(w, 0.24, d), brickPlazaMat);
      curb.position.set(bx, 0.12, bz);
      curb.castShadow = true;
      curb.receiveShadow = true;
      const coping = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, 0.06, d + 0.06), marbleWallMat);
      coping.position.set(bx, 0.26, bz);
      bed.add(curb, coping);
    }

    const soil = new THREE.Mesh(new THREE.BoxGeometry(bw - 0.3, 0.14, bd - 0.3), chautaraSoilMat);
    soil.position.y = 0.07;
    soil.receiveShadow = true;
    bed.add(soil);

    // Corner ornamental brass finials + low manicured shrubs & marigold blossoms
    for (const sx of [-bw / 2, bw / 2]) {
      for (const sz of [-bd / 2, bd / 2]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.36, 0.42), plinthStoneMat);
        post.position.set(sx, 0.18, sz);
        const cap = new THREE.Mesh(getDetailedParterreFinialGeo(), tealTrimMat);
        cap.scale.setScalar(0.65);
        cap.position.set(sx, 0.36, sz);
        bed.add(post, cap);
      }
    }

    const cols = Math.max(2, Math.floor(bw / 2.2));
    const rows = Math.max(2, Math.floor(bd / 2.2));
    for (let ix = 0; ix < cols; ix++) {
      for (let iz = 0; iz < rows; iz++) {
        const px = -bw * 0.34 + (cols > 1 ? (ix / (cols - 1)) * (bw * 0.68) : 0);
        const pz = -bd * 0.34 + (rows > 1 ? (iz / (rows - 1)) * (bd * 0.68) : 0);
        const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.46, 1), chautaraFoliageMat);
        bush.scale.set(1.1, 0.72, 1.1);
        bush.position.set(px, 0.34, pz);
        bush.castShadow = true;
        bed.add(bush);
        for (let b = 0; b < 3; b++) {
          const a = (b / 3) * Math.PI * 2 + ix + iz;
          const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), marigoldMat);
          bloom.position.set(px + Math.cos(a) * 0.28, 0.56, pz + Math.sin(a) * 0.28);
          bed.add(bloom);
        }
      }
    }

    // Center stone planter pedestal with Tulsi / Deepa
    const centerPed = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.48, 0.84), marbleWallMat);
    centerPed.position.y = 0.24;
    const centerCap = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.08, 0.92), tealTrimMat);
    centerCap.position.y = 0.52;
    const centerLamp = createDetailedBrassSukundaDiyo(goldMat, bronzeMat, diyoGlowMat, 0.82, true);
    centerLamp.position.y = 0.56;
    bed.add(centerPed, centerCap, centerLamp);

    exterior.add(bed);
  };

  addGardenLawnBed(-42.5, -16.5, 9.6, 7.6);
  addGardenLawnBed(-42.5, -2.5, 9.6, 7.2);
  addGardenLawnBed(32.5, 7.5, 5.4, 7.2);

  // Outer stone benches & low carved stone lantern bollards along West, North, and East Parikrama
  const benchPlacements: Array<[number, number, number]> = [
    [-27.8, -9.0, 0],
    [-27.8, 5.5, 0],
    [27.8, -9.0, Math.PI],
    [27.8, 5.5, Math.PI],
    [-6.5, -24.8, Math.PI / 2],
    [6.5, -24.8, Math.PI / 2],
    [-40.5, -29.2, Math.PI / 2],
    [26.5, -29.2, Math.PI / 2],
  ];
  for (const [bx, bz, rotY] of benchPlacements) {
    const bench = createChowkStoneBench(plinthStoneMat, marbleWallMat, tealTrimMat);
    bench.position.set(bx, 0.04, bz);
    bench.rotation.y = rotY;
    exterior.add(bench);
  }

  for (const [lx, lz] of [
    [-28.2, -21.5],
    [28.2, -21.5],
    [-28.2, 16.5],
    [28.2, 16.5],
    [-10.5, -25.2],
    [10.5, -25.2],
    [-51.8, -29.8],
    [33.8, -29.8],
  ] as Array<[number, number]>) {
    const ped = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.56, 0.62), plinthStoneMat);
    ped.position.set(lx, 0.28, lz);
    ped.castShadow = true;
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.1, 0.72), tealTrimMat);
    cap.position.set(lx, 0.6, lz);
    const diyo = createDetailedBrassSukundaDiyo(goldMat, bronzeMat, diyoGlowMat, 0.9, true);
    diyo.position.set(lx, 0.65, lz);
    exterior.add(ped, cap, diyo);
  }

  // Carved Stone Floral Planter Urns lining the North & West walkways
  const urnBodyGeo = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.24, 0.0),
      new THREE.Vector2(0.26, 0.08),
      new THREE.Vector2(0.14, 0.18),
      new THREE.Vector2(0.32, 0.42),
      new THREE.Vector2(0.34, 0.56),
      new THREE.Vector2(0.26, 0.64),
      new THREE.Vector2(0.30, 0.68),
      new THREE.Vector2(0.0, 0.64),
    ],
    18,
  );
  for (const [ux, uz] of [
    [-20.5, -25.6],
    [20.5, -25.6],
    [-33.5, -21.2],
    [-33.5, 8.5],
    [-52.0, 29.0],
    [-52.0, 50.0],
  ] as Array<[number, number]>) {
    const uPlinth = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.24, 0.68), plinthStoneMat);
    uPlinth.position.set(ux, 0.12, uz);
    const uPot = new THREE.Mesh(urnBodyGeo, terracottaTrimMat);
    uPot.position.set(ux, 0.24, uz);
    uPot.castShadow = true;
    const uPlant = new THREE.Mesh(new THREE.DodecahedronGeometry(0.34, 1), chautaraFoliageMat);
    uPlant.position.set(ux, 0.96, uz);
    const uFlower = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), marigoldMat);
    uFlower.position.set(ux, 1.24, uz);
    exterior.add(uPlinth, uPot, uPlant, uFlower);
  }

  // -------------------------------------------------------------------------
  // 2. GANGA SAGAR SACRED STEPPED GHAT KUND POND (local -44.5, 16.0)
  // -------------------------------------------------------------------------
  const kund = new THREE.Group();
  kund.position.set(-44.5, 0, 16.0);

  const outerW = 14.4;
  const outerD = 18.0;
  // Build 4 perimeter masonry coping walls around central open stepped water basin
  const pondRimWalls: Array<[number, number, number, number]> = [
    [0, -outerD / 2, outerW + 1.0, 0.96],
    [0, outerD / 2, outerW + 1.0, 0.96],
    [-outerW / 2, 0, 0.96, outerD],
    [outerW / 2, 0, 0.96, outerD],
  ];
  for (const [wx, wz, ww, wd] of pondRimWalls) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(ww, 0.42, wd), marbleWallMat);
    wall.position.set(wx, 0.21, wz);
    wall.castShadow = true;
    wall.receiveShadow = true;
    const trim = new THREE.Mesh(new THREE.BoxGeometry(ww + 0.08, 0.1, wd + 0.08), tealTrimMat);
    trim.position.set(wx, 0.44, wz);
    kund.add(wall, trim);
  }

  // Stepped brick/stone ghat steps descending along all 4 inner edges into the water
  for (let st = 0; st < 3; st++) {
    const inset = st * 0.56 + 0.52;
    const stepY = -0.14 - st * 0.24;
    const wSpan = outerW - inset * 2;
    const dSpan = outerD - inset * 2;
    const nS = new THREE.Mesh(new THREE.BoxGeometry(wSpan + 0.56, 0.24, 0.56), passageStoneMat);
    nS.position.set(0, stepY, -outerD / 2 + inset);
    const sS = new THREE.Mesh(new THREE.BoxGeometry(wSpan + 0.56, 0.24, 0.56), passageStoneMat);
    sS.position.set(0, stepY, outerD / 2 - inset);
    const wS = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.24, dSpan), plinthStoneMat);
    wS.position.set(-outerW / 2 + inset, stepY, 0);
    const eS = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.24, dSpan), plinthStoneMat);
    eS.position.set(outerW / 2 - inset, stepY, 0);
    nS.receiveShadow = true;
    sS.receiveShadow = true;
    wS.receiveShadow = true;
    eS.receiveShadow = true;
    kund.add(nS, sS, wS, eS);
  }

  // Brass Ghat pilgrimage safety handrails descending cleanly onto stone steps on East & South ghats
  const addGhatHandrail = (
    px1: number,
    py1: number,
    pz1: number,
    px2: number,
    py2: number,
    pz2: number,
  ) => {
    const topRailY1 = py1 + 0.72;
    const topRailY2 = Math.max(py2 + 0.72, 0.28);
    const posts: Array<[number, number, number, number]> = [
      [px1, py1, pz1, topRailY1],
      [px2, py2, pz2, topRailY2],
    ];
    for (const [px, py, pz, topY] of posts) {
      const postH = topY - py;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.042, postH, 12), bronzeMat);
      post.position.set(px, py + postH * 0.5, pz);
      const baseFoot = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.06, 10), bronzeMat);
      baseFoot.position.set(px, py + 0.03, pz);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.052, 10, 10), goldMat);
      knob.position.set(px, topY + 0.03, pz);
      kund.add(post, baseFoot, knob);
    }
    const dx = px2 - px1;
    const dy = topRailY2 - topRailY1;
    const dz = pz2 - pz1;
    const len = Math.hypot(dx, dy, dz);
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, len, 12), goldMat);
    rail.position.set((px1 + px2) * 0.5, (topRailY1 + topRailY2) * 0.5, (pz1 + pz2) * 0.5);
    const dir = new THREE.Vector3(dx, dy, dz).normalize();
    rail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    kund.add(rail);
  };
  // East ghat rails anchored from coping rim (x=7.05, y=0.48) down onto step 2 (x=5.62, y=-0.50)
  addGhatHandrail(7.05, 0.48, -1.05, 5.62, -0.5, -1.05);
  addGhatHandrail(7.05, 0.48, 1.05, 5.62, -0.5, 1.05);
  // South ghat rails anchored from coping rim (z=8.85, y=0.48) down onto step 2 (z=7.42, y=-0.50)
  addGhatHandrail(-1.05, 0.48, 8.85, -1.05, -0.5, 7.42);
  addGhatHandrail(1.05, 0.48, 8.85, 1.05, -0.5, 7.42);

  // Dark mineral basin bottom bed beneath translucent water plane
  const pondBed = new THREE.Mesh(
    new THREE.PlaneGeometry(outerW - 1.2, outerD - 1.2),
    new THREE.MeshStandardMaterial({ color: 0x0b2528, roughness: 0.94 }),
  );
  pondBed.rotation.x = -Math.PI / 2;
  pondBed.position.y = -0.58;
  kund.add(pondBed);

  // Realistic animated shader pond water surface (userData.noMerge prevents mergeStaticMeshes from stripping shader!)
  const pondWaterGeo = new THREE.PlaneGeometry(outerW - 1.2, outerD - 1.2, 24, 30);
  pondWaterGeo.rotateX(-Math.PI / 2);
  const pondWaterMat = new THREE.MeshStandardMaterial({
    color: 0x1e767b,
    roughness: 0.1,
    metalness: 0.28,
    transparent: true,
    opacity: 0.88,
  });
  applyRealisticWaterShader(pondWaterMat, waterUTime, {
    mode: 'pond',
    maxRadius: 8.6,
    flowSpeed: 1.15,
    deepTint: 0x0c3d45,
    shallowTint: 0x267972,
  });
  const pondSurface = new THREE.Mesh(pondWaterGeo, pondWaterMat);
  pondSurface.position.y = -0.08;
  pondSurface.receiveShadow = true;
  pondSurface.userData.noMerge = true;
  kund.add(pondSurface);

  // Floating lotus pads, pink/gold lotus blossoms & sacred glowing leaf diyas across Ganga Sagar water
  const lilyMat = new THREE.MeshStandardMaterial({
    color: 0x2b6e3c,
    roughness: 0.72,
    side: THREE.DoubleSide,
  });
  const lotusPetalMat = new THREE.MeshStandardMaterial({
    color: 0xe68496,
    emissive: 0x5c1824,
    emissiveIntensity: 0.18,
    roughness: 0.52,
  });
  const lilyGeo = new THREE.CircleGeometry(0.42, 14, 0, Math.PI * 1.82);
  lilyGeo.rotateX(-Math.PI / 2);
  const lotusCoords: Array<[number, number, boolean]> = [
    [-2.8, -4.4, true],
    [2.4, -3.6, true],
    [-3.2, 1.5, false],
    [3.1, 2.2, true],
    [-1.4, 5.2, true],
    [2.6, 5.4, false],
    [0.2, -1.2, true],
    [-4.1, -2.0, false],
    [4.0, -5.0, true],
  ];
  for (const [lx, lz, hasBloom] of lotusCoords) {
    const pad = new THREE.Mesh(lilyGeo, lilyMat);
    pad.position.set(lx, -0.055, lz);
    pad.rotation.y = (lx + lz) * 1.7;
    pad.userData.noMerge = true;
    kund.add(pad);
    if (hasBloom) {
      const bloom = new THREE.Group();
      bloom.position.set(lx, -0.04, lz);
      bloom.userData.noMerge = true;
      for (let p = 0; p < 6; p++) {
        const a = (p / 6) * Math.PI * 2;
        const pet = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 5), lotusPetalMat);
        pet.position.set(Math.sin(a) * 0.08, 0.06, Math.cos(a) * 0.08);
        pet.rotation.x = 0.58;
        pet.rotation.y = a;
        bloom.add(pet);
      }
      const centerPod = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), goldMat);
      centerPod.position.y = 0.06;
      bloom.add(centerPod);
      kund.add(bloom);
    }
  }

  // Floating brass leaf diyas near East & South Ghat water steps
  const flameGeo = getSacredTeardropFlameGeo();
  for (const [dx, dz] of [
    [4.6, -1.6],
    [4.5, 1.8],
    [-1.2, 6.4],
    [1.6, 6.2],
  ] as Array<[number, number]>) {
    const fLeaf = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.12, 0.04, 10), lilyMat);
    fLeaf.position.set(dx, -0.06, dz);
    fLeaf.userData.noMerge = true;
    const fCup = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.06, 0.05, 10), bronzeMat);
    fCup.position.set(dx, -0.02, dz);
    fCup.userData.noMerge = true;
    const fFlame = new THREE.Mesh(flameGeo, diyoGlowMat);
    fFlame.scale.set(0.06, 0.08, 0.06);
    fFlame.position.set(dx, 0.005, dz);
    fFlame.userData.noMerge = true;
    kund.add(fLeaf, fCup, fFlame);
  }

  // 4 Corner Ganga Sagar Ghat Deepa Pillars
  for (const sx of [-outerW / 2 - 0.1, outerW / 2 + 0.1]) {
    for (const sz of [-outerD / 2 - 0.1, outerD / 2 + 0.1]) {
      const cPed = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.92, 1.18), marbleWallMat);
      cPed.position.set(sx, 0.46, sz);
      cPed.castShadow = true;
      const cCap = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.14, 1.3), tealTrimMat);
      cCap.position.set(sx, 0.98, sz);
      const cLamp = createDetailedDeepastambha(goldMat, bronzeMat, diyoGlowMat, 1.05);
      cLamp.position.set(sx, 1.05, sz);
      kund.add(cPed, cCap, cLamp);
    }
  }

  // North Axis Varuna Arched Ghat Shrine Pavilion overseeing Ganga Sagar
  const vShrine = new THREE.Group();
  vShrine.position.set(0, 0.45, -outerD / 2 - 1.1);
  const vPlinth = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.48, 2.2), plinthStoneMat);
  vPlinth.position.y = 0.24;
  const vBack = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.2, 0.36), marbleWallMat);
  vBack.position.set(0, 1.56, -0.72);
  vBack.castShadow = true;
  const vArch = new THREE.Mesh(
    createCuspedArchSpandrelGeo(2.6, 2.2, 1.75, 1.75, 0.28),
    whiteTrimMat,
  );
  vArch.position.set(0, 0.48, 0.72);
  const vRoof = new THREE.Mesh(new THREE.BoxGeometry(3.15, 0.22, 2.35), terracottaTrimMat);
  vRoof.position.y = 2.74;
  const vDome = new THREE.Mesh(createOnionDomeGeometry(0.84, 1.48), domeMat);
  vDome.position.y = 2.86;
  const vSpire = createDetailedGajurSpire(goldMat, bronzeMat, 0.68, 0.62);
  vSpire.position.y = 4.32;
  const vKalash = createDetailedBrassSukundaDiyo(goldMat, bronzeMat, diyoGlowMat, 0.95, true);
  vKalash.position.set(0, 0.48, 0.05);
  vShrine.add(vPlinth, vBack, vArch, vRoof, vDome, vSpire, vKalash);
  kund.add(vShrine);

  markOccluder(kund);
  exterior.add(kund);

  // Carved Stone Dana Bird-Feeding Pedestal & Bowl on Ganga Sagar East Apron (-35.2, 16.0)
  const dana = new THREE.Group();
  dana.position.set(-35.2, 0.04, 16.0);
  const danaBase = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.2, 0.92), plinthStoneMat);
  danaBase.position.y = 0.1;
  danaBase.castShadow = true;
  const danaShaft = new THREE.Mesh(
    new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.0, 0.0),
        new THREE.Vector2(0.28, 0.0),
        new THREE.Vector2(0.18, 0.14),
        new THREE.Vector2(0.12, 0.42),
        new THREE.Vector2(0.18, 0.64),
        new THREE.Vector2(0.13, 0.72),
        new THREE.Vector2(0.46, 0.86),
        new THREE.Vector2(0.52, 0.96),
        new THREE.Vector2(0.44, 0.98),
        new THREE.Vector2(0.38, 0.88),
        new THREE.Vector2(0.0, 0.86),
      ],
      20,
    ),
    marbleWallMat,
  );
  danaShaft.position.y = 0.2;
  danaShaft.castShadow = true;
  const grainMound = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 8), saffronTrimMat);
  grainMound.scale.set(1.0, 0.28, 1.0);
  grainMound.position.y = 1.07;
  dana.add(danaBase, danaShaft, grainMound);

  const pigeonBodyMat = new THREE.MeshStandardMaterial({ color: 0x7c8791, roughness: 0.78 });
  const pigeonNeckMat = new THREE.MeshStandardMaterial({ color: 0x45625e, roughness: 0.64 });
  for (const [px, pz, rot] of [
    [-0.36, 0.24, 0.8],
    [0.32, -0.28, -2.1],
  ] as Array<[number, number, number]>) {
    const bird = new THREE.Group();
    bird.position.set(px, 1.18, pz);
    bird.rotation.y = rot;
    const bTorso = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 8), pigeonBodyMat);
    bTorso.scale.set(0.85, 0.9, 1.45);
    const bNeck = new THREE.Mesh(new THREE.SphereGeometry(0.052, 8, 8), pigeonNeckMat);
    bNeck.position.set(0, 0.075, 0.08);
    const bBeak = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.04, 5), bronzeMat);
    bBeak.rotation.x = Math.PI / 2;
    bBeak.position.set(0, 0.075, 0.14);
    bird.add(bTorso, bNeck, bBeak);
    dana.add(bird);
  }
  exterior.add(dana);

  // -------------------------------------------------------------------------
  // 3. VIVAH MANDAP WEDDING PAVILION (local -45.0, 40.0) & VEDIC HAVAN KUND
  // -------------------------------------------------------------------------
  const vivah = new THREE.Group();
  vivah.position.set(-45.0, 0, 40.0);

  const vmStep1 = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.24, 8.2), plinthStoneMat);
  vmStep1.position.y = 0.12;
  vmStep1.receiveShadow = true;
  const vmStep2 = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.32, 7.2), marbleWallMat);
  vmStep2.position.y = 0.4;
  vmStep2.castShadow = true;
  vmStep2.receiveShadow = true;
  const vmTrim = new THREE.Mesh(new THREE.BoxGeometry(7.36, 0.1, 7.36), tealTrimMat);
  vmTrim.position.y = 0.58;
  vivah.add(vmStep1, vmStep2, vmTrim);

  // 12 Carved Mandap Pillars around perimeter supporting cusped arches & double Mithila pavilion roof
  const pillarGeo = new THREE.CylinderGeometry(0.14, 0.18, 2.95, 16);
  const mandapCoords: Array<[number, number]> = [
    [-2.9, -2.9], [-1.0, -2.9], [1.0, -2.9], [2.9, -2.9],
    [-2.9, 2.9], [-1.0, 2.9], [1.0, 2.9], [2.9, 2.9],
    [-2.9, -1.0], [-2.9, 1.0],
    [2.9, -1.0], [2.9, 1.0],
  ];
  for (const [px, pz] of mandapCoords) {
    const pBase = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.22, 0.46), passageStoneMat);
    pBase.position.set(px, 0.72, pz);
    const pShaft = new THREE.Mesh(pillarGeo, whiteTrimMat);
    pShaft.position.set(px, 2.28, pz);
    pShaft.castShadow = true;
    const pCap = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.16, 0.46), tealTrimMat);
    pCap.position.set(px, 3.82, pz);
    vivah.add(pBase, pShaft, pCap);
  }

  // Cusped center entry arches on all 4 sides + terracotta brackets
  const vmArchGeo = createCuspedArchSpandrelGeo(2.0, 1.05, 1.56, 0.82, 0.22);
  const brkGeo = createCurvedBracketGeometry(0.18, 0.44, 0.5);
  for (const [ax, az, rot] of [
    [0, 2.9, 0],
    [0, -2.9, Math.PI],
    [-2.9, 0, -Math.PI / 2],
    [2.9, 0, Math.PI / 2],
  ] as Array<[number, number, number]>) {
    const arch = new THREE.Mesh(vmArchGeo, whiteTrimMat);
    arch.position.set(ax, 2.86, az);
    arch.rotation.y = rot;
    const brk = new THREE.Mesh(brkGeo, terracottaTrimMat);
    brk.position.set(ax, 3.8, az + Math.cos(rot) * 0.35);
    brk.rotation.y = rot;
    vivah.add(arch, brk);
  }

  // Lower & Upper Mithila stepped pyramidal roof + central gilded Gajur spire
  const vmEave = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.22, 7.5), terracottaTrimMat);
  vmEave.position.y = 4.0;
  vmEave.castShadow = true;
  const vmTier1 = new THREE.Mesh(new THREE.ConeGeometry(4.8, 1.75, 4), terracottaTrimMat);
  vmTier1.rotation.y = Math.PI / 4;
  vmTier1.position.y = 4.98;
  vmTier1.castShadow = true;
  const vmTier2 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.86, 2.6), marbleWallMat);
  vmTier2.position.y = 5.65;
  const vmRoofTop = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.25, 4), goldMat);
  vmRoofTop.rotation.y = Math.PI / 4;
  vmRoofTop.position.y = 6.72;
  const vmSpire = createDetailedGajurSpire(goldMat, bronzeMat, 1.15, 0.86);
  vmSpire.position.y = 7.34;
  vivah.add(vmEave, vmTier1, vmTier2, vmRoofTop, vmSpire);

  // Corner mini cupolas on Vivah Mandap roof
  for (const cx of [-2.85, 2.85]) {
    for (const cz of [-2.85, 2.85]) {
      const mDome = new THREE.Mesh(createOnionDomeGeometry(0.45, 0.88), domeMat);
      mDome.position.set(cx, 4.12, cz);
      const mKal = createDetailedGajurSpire(goldMat, bronzeMat, 0.42, 0.38);
      mKal.position.set(cx, 4.98, cz);
      vivah.add(mDome, mKal);
    }
  }

  // -------------------------------------------------------------------------
  // STEPPED VEDIC TRI-MEKHALA HAVAN KUND (replaces flat box + white cone!)
  // -------------------------------------------------------------------------
  const havan = new THREE.Group();
  havan.position.set(0, 0.63, 0);

  // 3 stepped altar tiers (Tri-Mekhala) with contrasting brick, white marble & teal trim
  const tier1 = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.15, 2.05), passageStoneMat);
  tier1.position.y = 0.075;
  tier1.receiveShadow = true;
  const tier2 = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.16, 1.74), brickPlazaMat);
  tier2.position.y = 0.23;
  tier2.castShadow = true;
  const tier3 = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.14, 1.44), marbleWallMat);
  tier3.position.y = 0.38;
  tier3.castShadow = true;
  havan.add(tier1, tier2, tier3);

  // 4-sided raised hollow brick & terracotta coping walls forming a real recessed fire pit cavity!
  const pitRimOuter = 1.24;
  const wallThick = 0.18;
  const wallH = 0.16;
  const rimParts: Array<[number, number, number, number]> = [
    [0, -pitRimOuter / 2 + wallThick / 2, pitRimOuter, wallThick],
    [0, pitRimOuter / 2 - wallThick / 2, pitRimOuter, wallThick],
    [-pitRimOuter / 2 + wallThick / 2, 0, wallThick, pitRimOuter - wallThick * 2],
    [pitRimOuter / 2 - wallThick / 2, 0, wallThick, pitRimOuter - wallThick * 2],
  ];
  for (const [rx, rz, rw, rd] of rimParts) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(rw, wallH, rd), terracottaTrimMat);
    wall.position.set(rx, 0.53, rz);
    wall.castShadow = true;
    havan.add(wall);
  }

  // Corner carved brass lotus finials & marigold floral border around the altar steps
  for (const cx of [-0.6, 0.6]) {
    for (const cz of [-0.6, 0.6]) {
      const cPost = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.18), marbleWallMat);
      cPost.position.set(cx, 0.56, cz);
      const cFin = new THREE.Mesh(getDetailedParterreFinialGeo(), goldMat);
      cFin.scale.setScalar(0.55);
      cFin.position.set(cx, 0.67, cz);
      havan.add(cPost, cFin);
    }
  }
  for (let m = -0.82; m <= 0.83; m += 0.28) {
    for (const side of [-0.94, 0.94]) {
      const f1 = new THREE.Mesh(new THREE.SphereGeometry(0.065, 6, 6), marigoldMat);
      f1.position.set(m, 0.18, side);
      const f2 = new THREE.Mesh(new THREE.SphereGeometry(0.065, 6, 6), crimsonClothMat);
      f2.position.set(side, 0.18, m);
      havan.add(f1, f2);
    }
  }

  // Dark charcoal ash pit floor & glowing red-orange ember bed inside recessed cavity
  const ashMat = new THREE.MeshStandardMaterial({ color: 0x1b1817, roughness: 0.98 });
  const emberMat = new THREE.MeshStandardMaterial({
    color: 0xc2270a,
    emissive: 0xff4500,
    emissiveIntensity: 1.7,
    roughness: 0.65,
  });
  const charWoodMat = new THREE.MeshStandardMaterial({
    color: 0x291a12,
    roughness: 0.92,
  });

  const ashBed = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.04, 0.86), ashMat);
  ashBed.position.y = 0.47;
  const emberMound = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.07, 14), emberMat);
  emberMound.position.y = 0.50;
  havan.add(ashBed, emberMound);

  // Scattered glowing coal embers inside the pit
  for (let e = 0; e < 7; e++) {
    const a = (e / 7) * Math.PI * 2 + 0.3;
    const r = 0.12 + (e % 3) * 0.09;
    const coal = new THREE.Mesh(new THREE.DodecahedronGeometry(0.045, 0), emberMat);
    coal.position.set(Math.cos(a) * r, 0.53, Math.sin(a) * r);
    coal.rotation.set(e, e * 1.3, 0);
    havan.add(coal);
  }

  // 4 Crossed Samidha firewood logs stacked around center ember core
  const logGeo = new THREE.CylinderGeometry(0.038, 0.046, 0.68, 8);
  for (const [lx, lz, rotY, tiltX] of [
    [0, 0.12, 0.12, 0.28],
    [0, -0.12, -0.18, -0.28],
    [0.12, 0, Math.PI / 2 + 0.15, 0.26],
    [-0.12, 0, Math.PI / 2 - 0.12, -0.26],
  ] as Array<[number, number, number, number]>) {
    const log = new THREE.Mesh(logGeo, charWoodMat);
    log.position.set(lx, 0.58, lz);
    log.rotation.order = 'YXZ';
    log.rotation.y = rotY;
    log.rotation.x = Math.PI / 2 - tiltX;
    havan.add(log);
  }

  // Multi-layered animated Vedic Agni flames (curved warm orange/amber/gold tongues — zero white cone!)
  const flameOuterMat = new THREE.MeshStandardMaterial({
    color: 0xff5a00,
    emissive: 0xff4500,
    emissiveIntensity: 1.9,
    roughness: 0.35,
    transparent: true,
    opacity: 0.88,
  });
  const flameMidMat = new THREE.MeshStandardMaterial({
    color: 0xff9e00,
    emissive: 0xff7700,
    emissiveIntensity: 2.1,
    roughness: 0.28,
  });
  const flameCoreMat = new THREE.MeshStandardMaterial({
    color: 0xffdf7a,
    emissive: 0xffb703,
    emissiveIntensity: 2.3,
    roughness: 0.22,
  });

  const havanFireGroup = new THREE.Group();
  havanFireGroup.position.set(0, 0.56, 0);
  havanFireGroup.userData.noMerge = true;

  const havanTongues: Array<{ mesh: THREE.Mesh; baseScale: [number, number, number]; phase: number }> = [];
  const registerTongue = (
    mat: THREE.Material,
    sx: number,
    sy: number,
    sz: number,
    px: number,
    py: number,
    pz: number,
    rx: number,
    rz: number,
    phase: number,
  ) => {
    const m = new THREE.Mesh(flameGeo, mat);
    m.scale.set(sx, sy, sz);
    m.position.set(px, py, pz);
    m.rotation.set(rx, phase, rz);
    m.userData.noMerge = true;
    havanFireGroup.add(m);
    havanTongues.push({ mesh: m, baseScale: [sx, sy, sz], phase });
  };

  // Bright golden central Agni core tongue + 6 dancing saffron/amber flames
  registerTongue(flameCoreMat, 0.16, 0.34, 0.16, 0, 0.02, 0, 0, 0, 0.0);
  registerTongue(flameMidMat, 0.24, 0.44, 0.24, 0, 0.0, 0, 0.06, -0.05, 1.1);
  for (let t = 0; t < 5; t++) {
    const a = (t / 5) * Math.PI * 2;
    const rad = 0.11;
    registerTongue(
      t % 2 === 0 ? flameOuterMat : flameMidMat,
      0.14 + (t % 2) * 0.03,
      0.27 + (t % 3) * 0.05,
      0.14,
      Math.cos(a) * rad,
      -0.01,
      Math.sin(a) * rad,
      Math.sin(a) * 0.16,
      -Math.cos(a) * 0.16,
      1.7 + t * 1.25,
    );
  }
  havan.add(havanFireGroup);

  // Brass Purna-Kalash water pot & copper Panchapatra + Sruva ghee ladle at altar step corner
  const kalash = createDetailedBrassSukundaDiyo(goldMat, bronzeMat, diyoGlowMat, 0.62, false);
  kalash.position.set(0.86, 0.15, 0.86);
  const ladleHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.62, 8), bronzeMat);
  ladleHandle.rotation.z = Math.PI / 2;
  ladleHandle.rotation.y = 0.45;
  ladleHandle.position.set(-0.76, 0.47, 0.54);
  const ladleSpoon = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.04, 10), goldMat);
  ladleSpoon.position.set(-0.48, 0.47, 0.41);
  havan.add(kalash, ladleHandle, ladleSpoon);

  vivah.add(havan);

  const vmBell = registerBell(createDetailedTempleBell(goldMat, bronzeMat, 0.58, 0.92));
  vmBell.position.set(0, 3.86, 0);
  const vmLight = new THREE.PointLight(0xff9838, 2.1, 16, 1.6);
  vmLight.position.set(0, 2.5, 0);
  beaconLights.push(vmLight);
  vivah.add(vmBell, vmLight);

  markOccluder(vivah);
  exterior.add(vivah);

  // -------------------------------------------------------------------------
  // 4. NORTH GARUDA STAMBHA COLUMN + TWIN WAYSIDE SHRINES + PEEPAL CHAUTARAS
  // -------------------------------------------------------------------------
  const northStambha = new THREE.Group();
  northStambha.position.set(0, 0, -29.0);
  const stBase = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.42, 2.15), plinthStoneMat);
  stBase.position.y = 0.21;
  stBase.castShadow = true;
  stBase.receiveShadow = true;
  const stMid = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.62, 1.62), marbleWallMat);
  stMid.position.y = 0.72;
  const stTeal = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.12, 1.74), tealTrimMat);
  stTeal.position.y = 1.06;
  const stCol = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 4.4, 18), marbleWallMat);
  stCol.position.y = 3.3;
  stCol.castShadow = true;
  const stCap = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.3, 0.36, 18), goldMat);
  stCap.position.y = 5.64;
  const stSpire = createDetailedGajurSpire(goldMat, bronzeMat, 0.92, 0.72);
  stSpire.position.y = 5.82;
  northStambha.add(stBase, stMid, stTeal, stCol, stCap, stSpire);
  exterior.add(northStambha);

  // Twin Carved Stone Tulsi Vrindavan Shrines flanking North Garuda Stambha (±5.5, -29.0)
  for (const sx of [-5.5, 5.5]) {
    const tulsi = new THREE.Group();
    tulsi.position.set(sx, 0, -29.0);
    const tStep = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.22, 1.65), plinthStoneMat);
    tStep.position.y = 0.11;
    tStep.castShadow = true;
    const tBody = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.72, 1.12), marbleWallMat);
    tBody.position.y = 0.58;
    tBody.castShadow = true;
    const tTrim = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.1, 1.22), tealTrimMat);
    tTrim.position.y = 0.98;
    const tSoil = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.08, 0.76), chautaraSoilMat);
    tSoil.position.y = 1.04;
    const tCrown = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42, 1), chautaraFoliageMat);
    tCrown.position.y = 1.38;
    tCrown.castShadow = true;
    const tLamp = createDetailedBrassSukundaDiyo(goldMat, bronzeMat, diyoGlowMat, 0.72, true);
    tLamp.position.set(0, 0.22, 0.68);
    tulsi.add(tStep, tBody, tTrim, tSoil, tCrown, tLamp);
    exterior.add(tulsi);
  }

  const exteriorChautaraCoords: Array<[number, number, number]> = [
    [-13.5, -28.5, 41],
    [13.5, -28.5, 42],
    [-32.5, -10.0, 43],
    [32.5, -17.5, 44],
  ];
  for (const [tx, tz, seed] of exteriorChautaraCoords) {
    const chautara = createChowkChautaraTree({
      brickMat: brickPlazaMat,
      marbleMat: marbleWallMat,
      tealMat: tealTrimMat,
      barkMat,
      soilMat: chautaraSoilMat,
      foliageMat: chautaraFoliageMat,
      goldMat,
      bronzeMat,
      flameMat: diyoGlowMat,
      seed,
    });
    chautara.position.set(tx, 0, tz);
    chautara.userData.noMerge = true;
    exterior.add(chautara);
  }

  // -------------------------------------------------------------------------
  // 5. ORNATE NEWARI / MITHILA WEST PILGRIM PATI (PHALCHA) REST PAVILION (-33.5, 50.5)
  // -------------------------------------------------------------------------
  const pati = new THREE.Group();
  pati.position.set(-33.5, 0, 50.5);
  pati.rotation.y = Math.PI * 0.14;

  // Two-tier carved brick & stone plinth with front steps + cheek walls
  const patiStep = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.24, 4.0), plinthStoneMat);
  patiStep.position.y = 0.12;
  patiStep.receiveShadow = true;
  const patiPlinth = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.36, 3.6), brickPlazaMat);
  patiPlinth.position.y = 0.42;
  patiPlinth.castShadow = true;
  patiPlinth.receiveShadow = true;
  const patiDeck = new THREE.Mesh(new THREE.BoxGeometry(6.52, 0.08, 3.72), flagstoneMat);
  patiDeck.position.y = 0.62;
  patiDeck.receiveShadow = true;
  pati.add(patiStep, patiPlinth, patiDeck);

  // Front central 2-step staircase & flanking cheek curbs (z = +1.8 .. +2.38)
  const pStair1 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.22, 0.42), passageStoneMat);
  pStair1.position.set(0, 0.11, 2.2);
  const pStair2 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.42, 0.38), passageStoneMat);
  pStair2.position.set(0, 0.21, 1.9);
  for (const sx of [-1.22, 1.22]) {
    const pCheek = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.46, 0.72), marbleWallMat);
    pCheek.position.set(sx, 0.23, 2.02);
    pati.add(pCheek);
  }
  pati.add(pStair1, pStair2);

  // Rear masonry wall & partial wing side walls with framed Mithila panels & brick Sukunda niches
  const patiBack = new THREE.Mesh(new THREE.BoxGeometry(5.88, 2.48, 0.34), marbleWallMat);
  patiBack.position.set(0, 1.88, -1.52);
  patiBack.castShadow = true;
  const patiBackDado = new THREE.Mesh(new THREE.BoxGeometry(5.96, 0.56, 0.38), brickPlazaMat);
  patiBackDado.position.set(0, 0.94, -1.52);
  const patiBackTeal = new THREE.Mesh(new THREE.BoxGeometry(5.98, 0.12, 0.4), tealTrimMat);
  patiBackTeal.position.set(0, 1.24, -1.52);
  pati.add(patiBack, patiBackDado, patiBackTeal);

  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.32, 2.48, 1.56), marbleWallMat);
    wing.position.set(side * 2.78, 1.88, -0.82);
    wing.castShadow = true;
    const wingDado = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.56, 1.6), brickPlazaMat);
    wingDado.position.set(side * 2.78, 0.94, -0.82);
    pati.add(wing, wingDado);
  }

  // Framed Mithila Fresco Panels + Recessed Brick Lamp Niches along rear wall
  const patiMuralMat = new THREE.MeshStandardMaterial({
    map: jTex.mithilaMuralMap,
    roughness: 0.72,
  });
  for (const mx of [-1.42, 1.42]) {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.78, 1.26, 0.06), carvedTimberMat);
    frame.position.set(mx, 2.06, -1.33);
    const canvas = new THREE.Mesh(new THREE.PlaneGeometry(1.58, 1.06), patiMuralMat);
    canvas.position.set(mx, 2.06, -1.295);
    pati.add(frame, canvas);
  }
  // Central recessed niche + flanking wall sconces with Sukunda oil lamps
  const nicheBack = new THREE.Mesh(new THREE.BoxGeometry(0.76, 1.02, 0.16), slateStoneMat);
  nicheBack.position.set(0, 2.02, -1.36);
  const nicheArch = new THREE.Mesh(
    createCuspedArchSpandrelGeo(0.92, 1.12, 0.62, 0.86, 0.14),
    terracottaTrimMat,
  );
  nicheArch.position.set(0, 1.5, -1.28);
  const nicheShelf = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.08, 0.24), marbleWallMat);
  nicheShelf.position.set(0, 1.52, -1.26);
  const nicheLamp = createDetailedBrassSukundaDiyo(goldMat, bronzeMat, diyoGlowMat, 0.76, true);
  nicheLamp.position.set(0, 1.56, -1.24);
  pati.add(nicheBack, nicheArch, nicheShelf, nicheLamp);

  // 6 Turned Carved Sal-Wood Tham Columns with stone pads & Meth timber capitals
  const thamShaftGeo = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.14, 0.0),
      new THREE.Vector2(0.15, 0.14),
      new THREE.Vector2(0.10, 0.22),
      new THREE.Vector2(0.13, 0.42),
      new THREE.Vector2(0.11, 1.05),
      new THREE.Vector2(0.13, 1.35),
      new THREE.Vector2(0.095, 1.62),
      new THREE.Vector2(0.14, 1.85),
      new THREE.Vector2(0.11, 2.12),
    ],
    14,
  );
  const thamPositions: Array<[number, number]> = [
    [-2.78, 1.48],
    [-0.96, 1.48],
    [0.96, 1.48],
    [2.78, 1.48],
    [-2.78, 0.15],
    [2.78, 0.15],
  ];
  for (const [cx, cz] of thamPositions) {
    const cPad = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.36), plinthStoneMat);
    cPad.position.set(cx, 0.72, cz);
    const cShaft = new THREE.Mesh(thamShaftGeo, carvedTimberMat);
    cShaft.position.set(cx, 0.79, cz);
    cShaft.castShadow = true;
    const methCap = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.18, 0.34), carvedTimberMat);
    methCap.position.set(cx, 2.98, cz);
    pati.add(cPad, cShaft, methCap);
  }

  // Timber lintel ring beam + 5 diagonal carved Tundal roof struts supporting deep overhanging eaves
  const frontLintel = new THREE.Mesh(new THREE.BoxGeometry(5.96, 0.22, 0.28), carvedTimberMat);
  frontLintel.position.set(0, 3.16, 1.48);
  const backLintel = new THREE.Mesh(new THREE.BoxGeometry(5.96, 0.22, 0.28), carvedTimberMat);
  backLintel.position.set(0, 3.16, -1.52);
  pati.add(frontLintel, backLintel);

  for (const sx of [-2.4, -1.2, 0, 1.2, 2.4]) {
    const tundal = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.84, 0.14), carvedTimberMat);
    tundal.position.set(sx, 3.08, 1.72);
    tundal.rotation.x = -0.58;
    pati.add(tundal);
  }

  // Multi-tiered hipped Khaprail terracotta roof with exposed timber rafters, fascia & 3 brass Gajurs
  const eaveUnderBeam = new THREE.Mesh(new THREE.BoxGeometry(6.85, 0.12, 4.15), carvedTimberMat);
  eaveUnderBeam.position.set(0, 3.3, 0);
  for (let rx = -3.1; rx <= 3.11; rx += 0.62) {
    const rafter = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 4.32), carvedTimberMat);
    rafter.position.set(rx, 3.24, 0);
    pati.add(rafter);
  }
  const patiLowerRoof = new THREE.Mesh(new THREE.ConeGeometry(4.45, 0.85, 4), terracottaTrimMat);
  patiLowerRoof.rotation.y = Math.PI / 4;
  patiLowerRoof.scale.set(1.26, 1.0, 0.8);
  patiLowerRoof.position.y = 3.74;
  patiLowerRoof.castShadow = true;

  const patiUpperRoof = new THREE.Mesh(new THREE.ConeGeometry(3.35, 1.05, 4), terracottaTrimMat);
  patiUpperRoof.rotation.y = Math.PI / 4;
  patiUpperRoof.scale.set(1.25, 1.0, 0.72);
  patiUpperRoof.position.y = 4.38;
  patiUpperRoof.castShadow = true;

  const ridgeBeam = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.18, 0.22), terracottaTrimMat);
  ridgeBeam.position.y = 4.92;
  pati.add(eaveUnderBeam, patiLowerRoof, patiUpperRoof, ridgeBeam);

  for (const [fx, s] of [
    [-1.25, 0.38],
    [0, 0.56],
    [1.25, 0.40],
  ] as Array<[number, number]>) {
    const finial = createDetailedGajurSpire(goldMat, bronzeMat, s, s);
    finial.position.set(fx, 4.98, 0);
    pati.add(finial);
  }

  // Interior carved Sal-wood Takht platform with crimson Dari rug, bolsters, Gagri pot & hanging Akashdeep
  const takht = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.22, 1.12), carvedTimberMat);
  takht.position.set(0, 0.86, -0.52);
  takht.castShadow = true;
  for (const tx of [-1.88, 1.88]) {
    for (const tz of [-0.94, -0.1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 0.14), carvedTimberMat);
      leg.position.set(tx, 0.72, tz);
      pati.add(leg);
    }
  }
  const dari = new THREE.Mesh(new THREE.BoxGeometry(3.96, 0.05, 0.96), warmCushionMat);
  dari.position.set(0, 0.99, -0.52);
  const dariBorder = new THREE.Mesh(new THREE.BoxGeometry(4.02, 0.04, 1.02), saffronTrimMat);
  dariBorder.position.set(0, 0.975, -0.52);
  pati.add(takht, dari, dariBorder);

  for (const bx of [-1.62, 0, 1.62]) {
    const bolster = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.64, 12), crimsonClothMat);
    bolster.rotation.x = Math.PI / 2;
    bolster.position.set(bx, 1.12, -0.56);
    pati.add(bolster);
  }

  // Brass Gagri water pitcher & corner Sukunda lamp on deck
  const gagri = new THREE.Mesh(
    new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.0, 0.0),
        new THREE.Vector2(0.12, 0.0),
        new THREE.Vector2(0.22, 0.16),
        new THREE.Vector2(0.20, 0.28),
        new THREE.Vector2(0.09, 0.36),
        new THREE.Vector2(0.14, 0.42),
      ],
      16,
    ),
    goldMat,
  );
  gagri.position.set(2.38, 0.66, -0.35);
  const patiDiyo = createDetailedBrassSukundaDiyo(goldMat, bronzeMat, diyoGlowMat, 0.85, true);
  patiDiyo.position.set(2.38, 0.66, 1.12);
  pati.add(gagri, patiDiyo);

  // Hanging Brass Akashdeep Lantern suspended beneath front eave
  const akash = new THREE.Group();
  akash.position.set(0, 3.12, 1.56);
  const akChain = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.42, 6), bronzeMat);
  akChain.position.y = -0.21;
  const akCap = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.16, 6), goldMat);
  akCap.position.y = -0.46;
  const akGlow = new THREE.Mesh(flameGeo, diyoGlowMat);
  akGlow.scale.set(0.09, 0.12, 0.09);
  akGlow.position.y = -0.68;
  const akRing = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.018, 6, 16), bronzeMat);
  akRing.rotation.x = Math.PI / 2;
  akRing.position.y = -0.74;
  akash.add(akChain, akCap, akGlow, akRing);
  pati.add(akash);

  markOccluder(pati);
  exterior.add(pati);

  // -------------------------------------------------------------------------
  // 6. EAST HERITAGE PYAAU WATER KIOSK (+32.0, -3.5)
  // -------------------------------------------------------------------------
  const pyaau = new THREE.Group();
  pyaau.position.set(32.0, 0, -3.5);
  pyaau.rotation.y = -Math.PI / 2;
  const pyPlinth = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.42, 2.4), plinthStoneMat);
  pyPlinth.position.y = 0.21;
  pyPlinth.castShadow = true;
  pyPlinth.receiveShadow = true;
  const pyShelf = new THREE.Mesh(new THREE.BoxGeometry(2.75, 0.72, 1.15), marbleWallMat);
  pyShelf.position.set(0, 0.78, -0.2);
  const pyRoof = new THREE.Mesh(new THREE.ConeGeometry(2.55, 0.95, 4), terracottaTrimMat);
  pyRoof.rotation.y = Math.PI / 4;
  pyRoof.scale.set(1.22, 1.0, 0.92);
  pyRoof.position.y = 2.96;
  const pySpire = createDetailedGajurSpire(goldMat, bronzeMat, 0.44, 0.48);
  pySpire.position.y = 3.44;
  pyaau.add(pyPlinth, pyShelf, pyRoof, pySpire);

  for (const cx of [-1.42, 1.42]) {
    for (const cz of [-0.95, 0.95]) {
      const pCol = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.08, 12), darkWoodMat);
      pCol.position.set(cx, 1.46, cz);
      pyaau.add(pCol);
    }
  }
  const matkaGeo = new THREE.SphereGeometry(0.24, 14, 12);
  for (const mx of [-0.72, 0, 0.72]) {
    const pot = new THREE.Mesh(matkaGeo, terracottaTrimMat);
    pot.scale.set(1.0, 1.15, 1.0);
    pot.position.set(mx, 1.38, -0.2);
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.22, 8), bronzeMat);
    spout.rotation.x = Math.PI / 2.6;
    spout.position.set(mx, 0.92, 0.44);
    pyaau.add(pot, spout);
  }
  markOccluder(pyaau);
  exterior.add(pyaau);

  // -------------------------------------------------------------------------
  // 7. SOUTH PLAZA PILGRIM AMENITIES: PAKHALA FOOT-WASH TROUGH & CHAPPAL STAND
  // -------------------------------------------------------------------------
  // Carved Stone Pakhala Foot-Wash Basin (+15.5, 22.8)
  const pakhala = new THREE.Group();
  pakhala.position.set(15.5, 0, 22.8);
  const pkSlab = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.12, 1.7), flagstoneMat);
  pkSlab.position.y = 0.06;
  pkSlab.receiveShadow = true;
  const pkRimParts: Array<[number, number, number, number]> = [
    [0, -0.56, 2.32, 0.2],
    [0, 0.56, 2.32, 0.2],
    [-1.06, 0, 0.2, 0.92],
    [1.06, 0, 0.2, 0.92],
  ];
  for (const [rx, rz, rw, rd] of pkRimParts) {
    const rim = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.42, rd), marbleWallMat);
    rim.position.set(rx, 0.32, rz);
    rim.castShadow = true;
    const rTrim = new THREE.Mesh(new THREE.BoxGeometry(rw + 0.04, 0.06, rd + 0.04), tealTrimMat);
    rTrim.position.set(rx, 0.54, rz);
    pakhala.add(rim, rTrim);
  }
  const pkWaterGeo = new THREE.PlaneGeometry(1.92, 0.92, 8, 6);
  pkWaterGeo.rotateX(-Math.PI / 2);
  const pkWater = new THREE.Mesh(pkWaterGeo, pondWaterMat);
  pkWater.position.y = 0.4;
  pkWater.userData.noMerge = true;
  const pkBack = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.88, 0.22), plinthStoneMat);
  pkBack.position.set(0, 0.54, -0.68);
  pakhala.add(pkSlab, pkWater, pkBack);
  for (const sx of [-0.65, 0, 0.65]) {
    const spoutBase = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.12, 10), goldMat);
    spoutBase.rotation.x = Math.PI / 2;
    spoutBase.position.set(sx, 0.72, -0.54);
    const spoutPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.032, 0.22, 8), bronzeMat);
    spoutPipe.rotation.x = Math.PI / 2.4;
    spoutPipe.position.set(sx, 0.67, -0.44);
    pakhala.add(spoutBase, spoutPipe);
  }
  exterior.add(pakhala);

  // Covered Carved Sal-Wood Paduka / Chappal Shoe Rack (-15.5, 22.8)
  const shoeRack = new THREE.Group();
  shoeRack.position.set(-15.5, 0, 22.8);
  const srBase = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.14, 1.15), plinthStoneMat);
  srBase.position.y = 0.07;
  srBase.receiveShadow = true;
  shoeRack.add(srBase);
  for (const px of [-1.18, 1.18]) {
    for (const pz of [-0.38, 0.38]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.11, 1.48, 0.11), carvedTimberMat);
      post.position.set(px, 0.88, pz);
      post.castShadow = true;
      shoeRack.add(post);
    }
  }
  for (const sy of [0.34, 0.74, 1.14]) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.06, 0.78), darkWoodMat);
    shelf.position.y = sy;
    shoeRack.add(shelf);
    // Pairs of neat footwear on each rack tier
    for (const fx of [-0.75, -0.15, 0.45, 0.88]) {
      for (const pairOff of [-0.07, 0.07]) {
        const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.055, 0.24), slateStoneMat);
        shoe.position.set(fx + pairOff, sy + 0.055, 0.04);
        shoeRack.add(shoe);
      }
    }
  }
  const srRoof = new THREE.Mesh(new THREE.ConeGeometry(1.98, 0.64, 4), terracottaTrimMat);
  srRoof.rotation.y = Math.PI / 4;
  srRoof.scale.set(1.38, 1.0, 0.65);
  srRoof.position.y = 1.92;
  srRoof.castShadow = true;
  const srSpire = createDetailedGajurSpire(goldMat, bronzeMat, 0.32, 0.32);
  srSpire.position.y = 2.24;
  shoeRack.add(srRoof, srSpire);
  exterior.add(shoeRack);

  group.add(exterior);

  // Register organic multi-tongue Vedic Havan flame dance
  const extCtrl = new THREE.Object3D();
  extCtrl.name = 'JanakiExteriorController';
  extCtrl.userData.noMerge = true;
  extCtrl.userData.onFlickerUpdate = (elapsed: number) => {
    for (let i = 0; i < havanTongues.length; i++) {
      const t = havanTongues[i];
      const f1 = Math.sin(elapsed * 10.5 + t.phase * 2.7);
      const f2 = Math.cos(elapsed * 14.2 + t.phase * 1.9);
      t.mesh.scale.set(
        t.baseScale[0] * (1 + f1 * 0.11),
        t.baseScale[1] * (1 + f2 * 0.18),
        t.baseScale[2] * (1 - f1 * 0.09),
      );
      t.mesh.rotation.z = Math.sin(elapsed * 6.8 + t.phase) * 0.12;
    }
    vmLight.intensity = 1.9 + Math.sin(elapsed * 11.4) * 0.24 + Math.cos(elapsed * 17.2) * 0.12;
  };
  exterior.add(extCtrl);
  animatedNodes.push(extCtrl);
}

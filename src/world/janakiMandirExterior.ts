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
  createRectangularHipRoofGeometry,
  getDetailedParterreFinialGeo,
  getSacredTeardropFlameGeo,
} from './janakiMandirCraft';
import { applyRealisticWaterShader } from './waterShader';

function extHash01(seed: number): number {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function createExtArchedSprigGeo(
  width: number,
  height: number,
  archForward: number,
  cupDepth: number,
): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(width, height, 4, 5);
  geo.translate(0, height * 0.5, 0);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const v = Math.max(0, Math.min(1, y / height));
    const uNorm = x / (width * 0.5);
    const droopY = -Math.pow(v, 2.2) * (archForward * 0.32);
    const forwardZ = Math.pow(v, 1.45) * archForward - uNorm * uNorm * cupDepth * (0.35 + v * 0.65);
    pos.setY(i, y + droopY);
    pos.setZ(i, pos.getZ(i) + forwardZ);
  }
  geo.computeVertexNormals();
  return geo;
}

function createExtMughalUrnGeo(radius: number, height: number): THREE.LatheGeometry {
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(radius * 0.56, 0),
    new THREE.Vector2(radius * 0.68, height * 0.06),
    new THREE.Vector2(radius * 0.52, height * 0.13),
    new THREE.Vector2(radius * 0.46, height * 0.22),
    new THREE.Vector2(radius * 0.78, height * 0.4),
    new THREE.Vector2(radius * 0.96, height * 0.58),
    new THREE.Vector2(radius * 0.98, height * 0.72),
    new THREE.Vector2(radius * 0.84, height * 0.84),
    new THREE.Vector2(radius * 0.88, height * 0.91),
    new THREE.Vector2(radius * 1.04, height * 0.96),
    new THREE.Vector2(radius * 1.0, height * 1.0),
    new THREE.Vector2(radius * 0.82, height * 0.98),
    new THREE.Vector2(radius * 0.76, height * 0.85),
  ];
  const geo = new THREE.LatheGeometry(pts, 28);
  geo.computeVertexNormals();
  return geo;
}

function addExtWoodyStems(
  parent: THREE.Object3D,
  barkMat: THREE.Material,
  ox: number,
  oy: number,
  oz: number,
  count: number,
  height: number,
  spread: number,
  radius: number,
  seed: number,
): void {
  const GOLDEN = 2.399963229728653;
  for (let i = 0; i < count; i++) {
    const angle = i * GOLDEN + extHash01(seed + i) * 0.7;
    const lean = spread * (0.45 + extHash01(seed + i * 3 + 1) * 0.55);
    const tipH = height * (0.68 + extHash01(seed + i * 5 + 2) * 0.32);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(ox, oy - 0.02, oz),
      new THREE.Vector3(ox + Math.cos(angle) * lean * 0.32, oy + tipH * 0.38, oz + Math.sin(angle) * lean * 0.32),
      new THREE.Vector3(ox + Math.cos(angle) * lean * 0.78, oy + tipH * 0.74, oz + Math.sin(angle) * lean * 0.78),
      new THREE.Vector3(ox + Math.cos(angle + 0.18) * lean, oy + tipH, oz + Math.sin(angle + 0.18) * lean),
    ]);
    const tubeGeo = new THREE.TubeGeometry(curve, 6, radius * (0.72 + extHash01(seed + i * 7) * 0.35), 5, false);
    const stem = new THREE.Mesh(tubeGeo, barkMat);
    stem.castShadow = true;
    parent.add(stem);
  }
}

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
    map: textures.basaltCarvedMap,
    normalMap: textures.basaltCarvedNormal,
    normalScale: new THREE.Vector2(0.75, 0.75),
    roughnessMap: textures.basaltCarvedRough,
    aoMap: textures.basaltCarvedAo,
    aoMapIntensity: 0.84,
    color: 0x5c6066,
    roughness: 0.9,
    metalness: 0.05,
  });

  // High-detail exterior botanical materials & instanced alpha-cutout flora collectors
  const extSoilMat = new THREE.MeshStandardMaterial({
    map: jTex.soilLoamMap,
    normalMap: jTex.soilLoamNormal,
    normalScale: new THREE.Vector2(0.82, 0.82),
    roughnessMap: jTex.soilLoamRough,
    color: 0xffffff,
    roughness: 1.0,
    metalness: 0.0,
  });
  const extUrnMat = new THREE.MeshStandardMaterial({
    map: jTex.terracottaUrnMap,
    normalMap: jTex.terracottaUrnNormal,
    normalScale: new THREE.Vector2(0.75, 0.75),
    roughnessMap: jTex.terracottaUrnRough,
    color: 0xffffff,
    roughness: 1.0,
    metalness: 0.02,
  });
  const extShrubMat = new THREE.MeshStandardMaterial({
    map: jTex.shrubFoliageMap,
    normalMap: jTex.shrubFoliageNormal,
    normalScale: new THREE.Vector2(0.68, 0.68),
    alphaTest: 0.36,
    side: THREE.DoubleSide,
    roughness: 0.82,
    metalness: 0.0,
    color: 0xffffff,
  });
  const extTulsiMat = new THREE.MeshStandardMaterial({
    map: jTex.tulsiLeafMap,
    normalMap: jTex.tulsiLeafNormal,
    normalScale: new THREE.Vector2(0.68, 0.68),
    alphaTest: 0.36,
    side: THREE.DoubleSide,
    roughness: 0.8,
    metalness: 0.0,
    color: 0xffffff,
  });
  const extMarigoldMat = new THREE.MeshStandardMaterial({
    map: jTex.marigoldMap,
    normalMap: jTex.marigoldNormal,
    normalScale: new THREE.Vector2(0.68, 0.68),
    alphaTest: 0.36,
    side: THREE.DoubleSide,
    roughness: 0.78,
    metalness: 0.0,
    color: 0xffffff,
  });
  const extFernMat = new THREE.MeshStandardMaterial({
    map: jTex.fernPalmMap,
    normalMap: jTex.fernPalmNormal,
    normalScale: new THREE.Vector2(0.68, 0.68),
    alphaTest: 0.36,
    side: THREE.DoubleSide,
    roughness: 0.76,
    metalness: 0.0,
    color: 0xffffff,
  });

  const extShrubSprigGeo = createExtArchedSprigGeo(0.84, 0.94, 0.24, 0.11);
  const extTulsiSprigGeo = createExtArchedSprigGeo(0.56, 0.74, 0.16, 0.07);
  const extMarigoldSprigGeo = createExtArchedSprigGeo(0.46, 0.54, 0.14, 0.06);
  const extFernSprigGeo = createExtArchedSprigGeo(0.54, 0.88, 0.28, 0.09);

  interface ExtBotanicalItem {
    matrix: THREE.Matrix4;
    tint: THREE.Color;
  }
  const extShrubList: ExtBotanicalItem[] = [];
  const extTulsiList: ExtBotanicalItem[] = [];
  const extMarigoldList: ExtBotanicalItem[] = [];
  const extFernList: ExtBotanicalItem[] = [];

  const eTmpPos = new THREE.Vector3();
  const eTmpQuat = new THREE.Quaternion();
  const eTmpScale = new THREE.Vector3();
  const eTmpEuler = new THREE.Euler();
  const GOLDEN_ANG = 2.399963229728653;

  const pushExtSprig = (
    list: ExtBotanicalItem[],
    x: number,
    y: number,
    z: number,
    yaw: number,
    pitch: number,
    roll: number,
    sx: number,
    sy: number,
    sz: number,
    seed: number,
  ) => {
    eTmpPos.set(x, y, z);
    eTmpEuler.set(pitch, yaw, roll, 'YXZ');
    eTmpQuat.setFromEuler(eTmpEuler);
    eTmpScale.set(sx, sy, sz);
    const shade = 0.86 + extHash01(seed) * 0.22;
    list.push({
      matrix: new THREE.Matrix4().compose(eTmpPos, eTmpQuat, eTmpScale),
      tint: new THREE.Color(shade * (0.96 + extHash01(seed + 11) * 0.08), shade, shade * 0.94),
    });
  };

  const addExtRealisticShrub = (
    stemParent: THREE.Object3D,
    localX: number,
    localY: number,
    localZ: number,
    worldX: number,
    worldY: number,
    worldZ: number,
    scale: number,
    seed: number,
    boughCount = 11,
  ) => {
    addExtWoodyStems(stemParent, barkMat, localX, localY, localZ, 5, 0.72 * scale, 0.42 * scale, 0.03 * scale, seed);
    for (let i = 0; i < boughCount; i++) {
      const h = extHash01(seed + i * 11.3);
      const layer = i < boughCount * 0.45 ? 0 : i < boughCount * 0.8 ? 1 : 2;
      const yaw = i * GOLDEN_ANG + extHash01(seed + i * 7.1) * 0.35;
      const ringR = (layer === 0 ? 0.22 : layer === 1 ? 0.13 : 0.05) * scale;
      const yOff = (layer === 0 ? 0.04 : layer === 1 ? 0.24 : 0.42) * scale;
      const pitchOut = (layer === 0 ? 0.62 : layer === 1 ? 0.38 : 0.16) + (h - 0.5) * 0.14;
      const sBase = scale * (0.82 + h * 0.32);
      pushExtSprig(
        extShrubList,
        worldX + Math.sin(yaw) * ringR,
        worldY + yOff,
        worldZ + Math.cos(yaw) * ringR,
        yaw,
        pitchOut,
        (extHash01(seed + i * 5.7) - 0.5) * 0.24,
        sBase,
        sBase * (0.88 + extHash01(seed + i * 3.1) * 0.24),
        sBase,
        seed + i * 13,
      );
    }
  };

  const addExtMarigoldCluster = (wx: number, wy: number, wz: number, scale: number, seed: number) => {
    const baseYaw = extHash01(seed) * Math.PI * 2;
    for (let k = 0; k < 3; k++) {
      const yaw = baseYaw + k * 2.09 + (extHash01(seed + k * 3) - 0.5) * 0.35;
      const s = scale * (0.86 + extHash01(seed + k * 7) * 0.26);
      pushExtSprig(
        extMarigoldList,
        wx + Math.sin(yaw) * 0.03 * scale,
        wy,
        wz + Math.cos(yaw) * 0.03 * scale,
        yaw,
        0.26 + extHash01(seed + k * 5) * 0.18,
        (extHash01(seed + k * 11) - 0.5) * 0.16,
        s,
        s,
        s,
        seed + k * 23,
      );
    }
  };

  // -------------------------------------------------------------------------
  // 1. OUTER PARIKRAMA FLAGSTONE WALKWAY BORDER & CONTINUOUS STONE CURBS
  // -------------------------------------------------------------------------
  const westWalk = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.08, 41.1), flagstoneMat);
  westWalk.position.set(-26.8, -0.036, -5.05);
  westWalk.receiveShadow = true;

  const eastWalk = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.08, 41.1), flagstoneMat);
  eastWalk.position.set(26.8, -0.036, -5.05);
  eastWalk.receiveShadow = true;

  const northWalk = new THREE.Mesh(new THREE.BoxGeometry(57.0, 0.08, 3.6), flagstoneMat);
  northWalk.position.set(0, -0.036, -23.8);
  northWalk.receiveShadow = true;

  // Connecting transverse paths sitting flush (top = +0.004) with continuous white marble lawn curbs
  const northStambhaPath = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.08, 8.6), flagstoneMat);
  northStambhaPath.position.set(0, -0.036, -28.0);
  northStambhaPath.receiveShadow = true;

  const westBridgeWalk = new THREE.Mesh(new THREE.BoxGeometry(27.8, 0.08, 3.2), flagstoneMat);
  westBridgeWalk.position.set(-40.8, -0.036, -23.8);
  westBridgeWalk.receiveShadow = true;

  const eastBridgeWalk = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.08, 3.2), flagstoneMat);
  eastBridgeWalk.position.set(32.0, -0.036, -23.8);
  eastBridgeWalk.receiveShadow = true;

  const pyaauLinkWalk = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.08, 5.2), flagstoneMat);
  pyaauLinkWalk.position.set(31.8, -0.036, -3.5);
  pyaauLinkWalk.receiveShadow = true;

  const southWestLink = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.08, 3.6), brickPlazaMat);
  southWestLink.position.set(-32.2, -0.036, 16.0);
  southWestLink.receiveShadow = true;

  // Continuous white marble edging curbs separating flagstone walks from grass lawns
  for (const [cx, cz, cw, cd] of [
    [-28.58, -5.05, 0.22, 41.1],
    [28.58, -5.05, 0.22, 41.1],
    [0, -25.68, 57.0, 0.22],
    [-40.8, -22.12, 24.4, 0.22],
    [-40.8, -25.48, 24.4, 0.22],
    [32.0, -22.12, 7.4, 0.22],
    [32.0, -25.48, 7.4, 0.22],
    [31.4, -0.82, 5.8, 0.22],
    [31.4, -6.18, 5.8, 0.22],
  ] as Array<[number, number, number, number]>) {
    const lawnCurb = new THREE.Mesh(new THREE.BoxGeometry(cw, 0.06, cd), marbleWallMat);
    lawnCurb.position.set(cx, 0.015, cz);
    lawnCurb.receiveShadow = true;
    exterior.add(lawnCurb);
  }

  // 4 Perimeter brick apron strips framing Ganga Sagar coping rim (flush with plazaY)
  const gsNorthApron = new THREE.Mesh(new THREE.BoxGeometry(22.4, 0.08, 3.8), brickPlazaMat);
  gsNorthApron.position.set(-45.3, -0.036, 16.0 - 11.2);
  gsNorthApron.receiveShadow = true;
  const gsSouthApron = new THREE.Mesh(new THREE.BoxGeometry(22.4, 0.08, 3.8), brickPlazaMat);
  gsSouthApron.position.set(-45.3, -0.036, 16.0 + 11.2);
  gsSouthApron.receiveShadow = true;
  const gsWestApron = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.08, 18.6), brickPlazaMat);
  gsWestApron.position.set(-53.7, -0.036, 16.0);
  gsWestApron.receiveShadow = true;
  const gsEastApron = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.08, 18.6), brickPlazaMat);
  gsEastApron.position.set(-35.4, -0.036, 16.0);
  gsEastApron.receiveShadow = true;

  const vivahApron = new THREE.Mesh(new THREE.BoxGeometry(13.5, 0.08, 13.5), brickPlazaMat);
  vivahApron.position.set(-45.0, -0.036, 40.0);
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

    const soil = new THREE.Mesh(new THREE.BoxGeometry(bw - 0.3, 0.14, bd - 0.3), extSoilMat);
    soil.position.y = 0.07;
    soil.receiveShadow = true;
    bed.add(soil);

    // Corner ornamental brass finials + lush multi-layer botanical shrubs & Sayapatri marigold borders
    for (const sx of [-bw / 2, bw / 2]) {
      for (const sz of [-bd / 2, bd / 2]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.36, 0.42), marbleWallMat);
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
        const seed = Math.round((gx + 100) * 31 + (gz + 100) * 17 + ix * 13 + iz * 29);
        addExtRealisticShrub(bed, px, 0.14, pz, gx + px, 0.14, gz + pz, 0.92, seed, 11);
        for (let b = 0; b < 3; b++) {
          const a = (b / 3) * Math.PI * 2 + ix * 1.1 + iz * 0.7;
          addExtMarigoldCluster(
            gx + px + Math.cos(a) * 0.46,
            0.14,
            gz + pz + Math.sin(a) * 0.46,
            0.78,
            seed + b * 41,
          );
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
    const bench = createChowkStoneBench(marbleWallMat, marbleWallMat, tealTrimMat);
    bench.position.set(bx, 0.004, bz);
    bench.rotation.y = rotY;
    bench.userData.noMerge = true;
    bench.userData.snapCategory = 'sitting';
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
    const bollard = new THREE.Group();
    bollard.position.set(lx, 0.004, lz);
    bollard.userData.noMerge = true;
    bollard.userData.snapCategory = 'lantern';
    const ped = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.56, 0.62), marbleWallMat);
    ped.position.set(0, 0.28, 0);
    ped.castShadow = true;
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.1, 0.72), tealTrimMat);
    cap.position.set(0, 0.6, 0);
    const diyo = createDetailedBrassSukundaDiyo(goldMat, bronzeMat, diyoGlowMat, 0.9, true);
    diyo.position.set(0, 0.65, 0);
    bollard.add(ped, cap, diyo);
    exterior.add(bollard);
  }

  // Carved Stone & Terracotta Mughal Lotus Urns with arching fern rosettes & marigolds
  const urnBodyGeo = createExtMughalUrnGeo(0.36, 0.7);
  for (const [uIdx, [ux, uz]] of (
    [
      [-20.5, -25.6],
      [20.5, -25.6],
      [-33.5, -21.2],
      [-33.5, 8.5],
      [-52.0, 29.0],
      [-52.0, 50.0],
    ] as Array<[number, number]>
  ).entries()) {
    const urnGroup = new THREE.Group();
    urnGroup.position.set(ux, 0.004, uz);
    urnGroup.userData.noMerge = true;
    urnGroup.userData.snapCategory = 'pot';
    const uPlinth = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.24, 0.68), marbleWallMat);
    uPlinth.position.set(0, 0.12, 0);
    const uPot = new THREE.Mesh(urnBodyGeo, extUrnMat);
    uPot.position.set(0, 0.24, 0);
    uPot.castShadow = true;
    const uSoil = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.06, 18), extSoilMat);
    uSoil.position.set(0, 0.87, 0);
    urnGroup.add(uPlinth, uPot, uSoil);
    exterior.add(urnGroup);

    const seed = 700 + uIdx * 53;
    for (let f = 0; f < 9; f++) {
      const yaw = f * GOLDEN_ANG + extHash01(seed + f) * 0.25;
      const pitch = f < 5 ? 0.34 : 0.06;
      const s = 0.56 + extHash01(seed + f * 3) * 0.18;
      pushExtSprig(
        extFernList,
        ux + Math.sin(yaw) * 0.05,
        0.89,
        uz + Math.cos(yaw) * 0.05,
        yaw,
        pitch,
        (extHash01(seed + f * 5) - 0.5) * 0.16,
        s,
        s,
        s,
        seed + f * 7,
      );
    }
    addExtMarigoldCluster(ux, 0.90, uz, 0.72, seed + 29);
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
    const wS = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.24, dSpan), passageStoneMat);
    wS.position.set(-outerW / 2 + inset, stepY, 0);
    const eS = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.24, dSpan), passageStoneMat);
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
  const vPlinth = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.48, 2.2), marbleWallMat);
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
  const danaBase = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.2, 0.92), marbleWallMat);
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

  const vmStep1 = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.24, 8.2), passageStoneMat);
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
  for (let m = -0.82; m <= 0.83; m += 0.38) {
    for (const side of [-0.94, 0.94]) {
      const mSeed = Math.round((m + 2) * 37 + (side > 0 ? 11 : 23));
      addExtMarigoldCluster(-45.0 + m, 0.78, 40.0 + side, 0.44, mSeed);
      addExtMarigoldCluster(-45.0 + side, 0.78, 40.0 + m, 0.44, mSeed + 97);
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
  const stBase = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.42, 2.15), marbleWallMat);
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
    const tStep = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.22, 1.65), marbleWallMat);
    tStep.position.y = 0.11;
    tStep.castShadow = true;
    const tBody = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.72, 1.12), marbleWallMat);
    tBody.position.y = 0.58;
    tBody.castShadow = true;
    const tTrim = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.1, 1.22), tealTrimMat);
    tTrim.position.y = 0.98;
    const tSoil = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.08, 0.76), extSoilMat);
    tSoil.position.y = 1.04;
    addExtWoodyStems(tulsi, barkMat, 0, 1.08, 0, 5, 0.56, 0.26, 0.022, sx < 0 ? 811 : 829);
    const tSeed = sx < 0 ? 811 : 829;
    for (let t = 0; t < 11; t++) {
      const yaw = t * GOLDEN_ANG + extHash01(tSeed + t) * 0.3;
      const layer = t < 6 ? 0 : 1;
      const rad = layer === 0 ? 0.14 : 0.05;
      const ts = 0.72 + extHash01(tSeed + t * 5) * 0.22;
      pushExtSprig(
        extTulsiList,
        sx + Math.sin(yaw) * rad,
        1.08 + (layer === 0 ? 0.02 : 0.20),
        -29.0 + Math.cos(yaw) * rad,
        yaw,
        layer === 0 ? 0.45 : 0.18,
        (extHash01(tSeed + t * 9) - 0.5) * 0.2,
        ts,
        ts,
        ts,
        tSeed + t * 13,
      );
    }
    const tLamp = createDetailedBrassSukundaDiyo(goldMat, bronzeMat, diyoGlowMat, 0.72, true);
    tLamp.position.set(0, 0.22, 0.68);
    tulsi.add(tStep, tBody, tTrim, tSoil, tLamp);
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
    chautara.userData.snapCategory = 'sitting';
    exterior.add(chautara);
  }

  // -------------------------------------------------------------------------
  // 5. ORNATE NEWARI / MITHILA WEST PILGRIM PATI (PHALCHA) REST PAVILION (-33.5, 50.5)
  // -------------------------------------------------------------------------
  const pati = new THREE.Group();
  pati.position.set(-33.5, 0, 50.5);
  pati.rotation.y = Math.PI / 2;
  pati.userData.noMerge = true;
  pati.userData.snapCategory = 'sitting';

  // Two-tier carved white Makrana marble & stone plinth with front steps + cheek walls
  const patiStep = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.24, 4.0), passageStoneMat);
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
    const cPad = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.36), marbleWallMat);
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

  // True orthogonal multi-tiered hipped Khaprail terracotta roof with exposed timber rafters & 3 brass Gajurs
  const eaveUnderBeam = new THREE.Mesh(new THREE.BoxGeometry(6.85, 0.12, 4.15), carvedTimberMat);
  eaveUnderBeam.position.set(0, 3.3, 0);
  for (let rx = -3.1; rx <= 3.11; rx += 0.62) {
    const rafter = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 4.32), carvedTimberMat);
    rafter.position.set(rx, 3.24, 0);
    pati.add(rafter);
  }
  const patiLowerRoof = new THREE.Mesh(
    createRectangularHipRoofGeometry(7.2, 0.85, 4.4, 0.68),
    terracottaTrimMat,
  );
  patiLowerRoof.position.y = 3.76;
  patiLowerRoof.castShadow = true;

  const patiUpperRoof = new THREE.Mesh(
    createRectangularHipRoofGeometry(5.2, 0.92, 3.0, 0.68),
    terracottaTrimMat,
  );
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
  // 6. EAST HERITAGE PYAAU WATER KIOSK (+32.0, -3.5) — Lathe Gagri/Matka Vessels, Carved Teak & Brass Taps
  // -------------------------------------------------------------------------
  const pyaau = new THREE.Group();
  pyaau.position.set(32.0, 0, -3.5);
  pyaau.rotation.y = -Math.PI / 2;

  const pyStep = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.18, 2.9), passageStoneMat);
  pyStep.position.y = 0.09;
  pyStep.receiveShadow = true;
  const pyPlinth = new THREE.Mesh(new THREE.BoxGeometry(3.48, 0.28, 2.48), marbleWallMat);
  pyPlinth.position.y = 0.32;
  pyPlinth.castShadow = true;
  pyPlinth.receiveShadow = true;
  const pyPlinthTrim = new THREE.Mesh(new THREE.BoxGeometry(3.54, 0.07, 2.54), tealTrimMat);
  pyPlinthTrim.position.y = 0.48;

  // Molded marble serving counter with recessed terracotta dado & front brass tap trough
  const pyCounter = new THREE.Mesh(new THREE.BoxGeometry(2.76, 0.68, 1.05), marbleWallMat);
  pyCounter.position.set(0, 0.86, -0.2);
  pyCounter.castShadow = true;
  const pyCounterTop = new THREE.Mesh(new THREE.BoxGeometry(2.90, 0.08, 1.18), whiteTrimMat);
  pyCounterTop.position.set(0, 1.24, -0.2);
  const pyCounterTrim = new THREE.Mesh(new THREE.BoxGeometry(2.84, 0.06, 1.12), tealTrimMat);
  pyCounterTrim.position.set(0, 1.18, -0.2);
  const pyDripBasinRim = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.14, 0.36), marbleWallMat);
  pyDripBasinRim.position.set(0, 0.58, 0.50);
  const pyDripWater = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.04, 0.24), pondWaterMat);
  pyDripWater.position.set(0, 0.635, 0.50);
  pyDripWater.userData.noMerge = true;

  pyaau.add(
    pyStep,
    pyPlinth,
    pyPlinthTrim,
    pyCounter,
    pyCounterTop,
    pyCounterTrim,
    pyDripBasinRim,
    pyDripWater,
  );

  // Turned carved teak columns + marble pedestals + capitals + roof lintels & exposed rafters
  const pyColLathe = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.115, 0.0),
      new THREE.Vector2(0.125, 0.12),
      new THREE.Vector2(0.085, 0.22),
      new THREE.Vector2(0.105, 0.88),
      new THREE.Vector2(0.082, 1.54),
      new THREE.Vector2(0.115, 1.76),
      new THREE.Vector2(0.095, 1.96),
    ],
    14,
  );
  for (const cx of [-1.42, 1.42]) {
    for (const cz of [-0.95, 0.95]) {
      const colBase = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.32), marbleWallMat);
      colBase.position.set(cx, 0.57, cz);
      const pCol = new THREE.Mesh(pyColLathe, carvedTimberMat);
      pCol.position.set(cx, 0.63, cz);
      pCol.castShadow = true;
      const colCap = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.28), carvedTimberMat);
      colCap.position.set(cx, 2.66, cz);
      pyaau.add(colBase, pCol, colCap);
    }
  }
  const pyFrontBeam = new THREE.Mesh(new THREE.BoxGeometry(3.26, 0.16, 0.22), carvedTimberMat);
  pyFrontBeam.position.set(0, 2.78, 0.95);
  const pyBackBeam = new THREE.Mesh(new THREE.BoxGeometry(3.26, 0.16, 0.22), carvedTimberMat);
  pyBackBeam.position.set(0, 2.78, -0.95);
  pyaau.add(pyFrontBeam, pyBackBeam);
  for (let rx = -1.5; rx <= 1.51; rx += 0.5) {
    const pyRafter = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 2.68), carvedTimberMat);
    pyRafter.position.set(rx, 2.88, 0);
    pyaau.add(pyRafter);
  }
  const pyRoof = new THREE.Mesh(
    createRectangularHipRoofGeometry(3.9, 0.96, 2.9, 0.65),
    terracottaTrimMat,
  );
  pyRoof.position.y = 3.38;
  pyRoof.castShadow = true;
  const pyRidge = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.12, 0.16), terracottaTrimMat);
  pyRidge.position.y = 3.88;
  const pySpire = createDetailedGajurSpire(goldMat, bronzeMat, 0.44, 0.48);
  pySpire.position.y = 3.94;
  pyaau.add(pyRoof, pyRidge, pySpire);

  // Authentic lathe-turned Nepali Matka/Gagri water vessels with flared rings, lids & brass tap spigots
  const matkaVesselGeo = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.14, 0.0),
      new THREE.Vector2(0.11, 0.04),
      new THREE.Vector2(0.24, 0.16),
      new THREE.Vector2(0.28, 0.29),
      new THREE.Vector2(0.25, 0.41),
      new THREE.Vector2(0.14, 0.49),
      new THREE.Vector2(0.115, 0.55),
      new THREE.Vector2(0.155, 0.59),
      new THREE.Vector2(0.125, 0.60),
      new THREE.Vector2(0.09, 0.54),
    ],
    24,
  );
  const pyRingStandGeo = new THREE.TorusGeometry(0.13, 0.026, 8, 18);
  pyRingStandGeo.rotateX(Math.PI / 2);
  const pyLidGeo = new THREE.ConeGeometry(0.145, 0.075, 16);
  const pyWaterStreamMat = new THREE.MeshStandardMaterial({
    color: 0x93e2ee,
    roughness: 0.08,
    metalness: 0.1,
    transparent: true,
    opacity: 0.62,
  });

  for (const [mIdx, mx] of ([-0.76, 0, 0.76] as const).entries()) {
    const stand = new THREE.Mesh(pyRingStandGeo, carvedTimberMat);
    stand.position.set(mx, 1.305, -0.2);
    const potMat = mIdx === 1 ? bronzeMat : extUrnMat;
    const pot = new THREE.Mesh(matkaVesselGeo, potMat);
    pot.position.set(mx, 1.30, -0.2);
    pot.castShadow = true;
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.265, 0.012, 8, 22), goldMat);
    band.rotation.x = Math.PI / 2;
    band.position.set(mx, 1.62, -0.2);
    const lid = new THREE.Mesh(pyLidGeo, goldMat);
    lid.position.set(mx, 1.925, -0.2);
    const lidKnob = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), bronzeMat);
    lidKnob.position.set(mx, 1.97, -0.2);

    // Wall escutcheon plate + horizontal feed pipe + vertical tap valve + curved gooseneck spout
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.024, 14), goldMat);
    plate.rotation.x = Math.PI / 2;
    plate.position.set(mx, 0.94, 0.34);
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.18, 10), bronzeMat);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(mx, 0.94, 0.43);
    const tapNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.018, 0.09, 10), goldMat);
    tapNeck.position.set(mx, 0.90, 0.51);
    const valveStem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.055, 8), bronzeMat);
    valveStem.position.set(mx, 0.975, 0.46);
    const valveCross = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.014, 0.016), goldMat);
    valveCross.position.set(mx, 1.005, 0.46);
    const trickle = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.013, 0.21, 8), pyWaterStreamMat);
    trickle.position.set(mx, 0.745, 0.51);
    trickle.userData.noMerge = true;

    pyaau.add(stand, pot, band, lid, lidKnob, plate, pipe, tapNeck, valveStem, valveCross, trickle);
  }
  markOccluder(pyaau);
  exterior.add(pyaau);

  // -------------------------------------------------------------------------
  // 7. SOUTH PLAZA PILGRIM AMENITIES: PAKHALA FOOT-WASH TROUGH & CHAPPAL STAND
  // -------------------------------------------------------------------------
  // Carved Stone Pakhala Foot-Wash Trough & Hiti Brass Tap Wall (+15.5, 22.8)
  const pakhala = new THREE.Group();
  pakhala.position.set(15.5, 0, 22.8);
  const pkSlab = new THREE.Mesh(new THREE.BoxGeometry(3.05, 0.12, 1.95), flagstoneMat);
  pkSlab.position.y = 0.06;
  pkSlab.receiveShadow = true;
  // Front ribbed marble footrest step for pilgrim shoe-free washing
  const pkFrontStep = new THREE.Mesh(new THREE.BoxGeometry(2.36, 0.16, 0.34), marbleWallMat);
  pkFrontStep.position.set(0, 0.20, 0.78);
  pkFrontStep.receiveShadow = true;
  pakhala.add(pkSlab, pkFrontStep);

  const pkRimParts: Array<[number, number, number, number]> = [
    [0, -0.56, 2.38, 0.22],
    [0, 0.56, 2.38, 0.22],
    [-1.08, 0, 0.22, 0.90],
    [1.08, 0, 0.22, 0.90],
  ];
  for (const [rx, rz, rw, rd] of pkRimParts) {
    const rim = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.44, rd), marbleWallMat);
    rim.position.set(rx, 0.34, rz);
    rim.castShadow = true;
    const rTrim = new THREE.Mesh(new THREE.BoxGeometry(rw + 0.04, 0.07, rd + 0.04), tealTrimMat);
    rTrim.position.set(rx, 0.58, rz);
    pakhala.add(rim, rTrim);
  }
  for (const cx of [-1.08, 1.08]) {
    for (const cz of [-0.56, 0.56]) {
      const cPost = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.52, 0.26), marbleWallMat);
      cPost.position.set(cx, 0.38, cz);
      const cFin = new THREE.Mesh(getDetailedParterreFinialGeo(), goldMat);
      cFin.scale.setScalar(0.45);
      cFin.position.set(cx, 0.64, cz);
      pakhala.add(cPost, cFin);
    }
  }
  // Stone basin floor + brass drain grate + rippling clear water
  const pkBasinFloor = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.08, 0.90), passageStoneMat);
  pkBasinFloor.position.y = 0.22;
  const pkDrain = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.015, 16), bronzeMat);
  pkDrain.position.set(0.62, 0.265, 0.14);
  const pkWaterGeo = new THREE.PlaneGeometry(1.92, 0.90, 12, 8);
  pkWaterGeo.rotateX(-Math.PI / 2);
  const pkWater = new THREE.Mesh(pkWaterGeo, pondWaterMat);
  pkWater.position.y = 0.43;
  pkWater.userData.noMerge = true;

  // Sculpted carved Hiti back wall with 3 arched stone niches, cornice cap & 3 brass Kalash finials
  const pkBack = new THREE.Mesh(new THREE.BoxGeometry(2.38, 1.08, 0.24), marbleWallMat);
  pkBack.position.set(0, 0.66, -0.68);
  pkBack.castShadow = true;
  const pkBackCap = new THREE.Mesh(new THREE.BoxGeometry(2.52, 0.11, 0.34), tealTrimMat);
  pkBackCap.position.set(0, 1.24, -0.68);
  const pkBackEave = new THREE.Mesh(new THREE.BoxGeometry(2.62, 0.09, 0.42), terracottaTrimMat);
  pkBackEave.position.set(0, 1.32, -0.66);
  const pkNicheArchGeo = createCuspedArchSpandrelGeo(0.62, 0.64, 0.44, 0.48, 0.06);
  pakhala.add(pkBasinFloor, pkDrain, pkWater, pkBack, pkBackCap, pkBackEave);

  for (const sx of [-0.68, 0, 0.68]) {
    const nicheArch = new THREE.Mesh(pkNicheArchGeo, whiteTrimMat);
    nicheArch.position.set(sx, 0.56, -0.54);
    const rosette = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.025, 16), bronzeMat);
    rosette.rotation.x = Math.PI / 2;
    rosette.position.set(sx, 0.82, -0.545);
    const spoutBase = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.068, 0.04, 12), goldMat);
    spoutBase.rotation.x = Math.PI / 2;
    spoutBase.position.set(sx, 0.82, -0.525);
    const spoutArm = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.18, 10), bronzeMat);
    spoutArm.rotation.x = Math.PI / 2;
    spoutArm.position.set(sx, 0.82, -0.43);
    const spoutTip = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.015, 0.08, 10), goldMat);
    spoutTip.position.set(sx, 0.78, -0.35);
    const valveStem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.05, 8), bronzeMat);
    valveStem.position.set(sx, 0.855, -0.40);
    const valveBar = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.014, 0.015), goldMat);
    valveBar.position.set(sx, 0.88, -0.40);
    const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.014, 0.33, 8), pyWaterStreamMat);
    stream.position.set(sx, 0.585, -0.35);
    stream.userData.noMerge = true;
    const ripple = new THREE.Mesh(new THREE.RingGeometry(0.04, 0.075, 18), pyWaterStreamMat);
    ripple.rotation.x = -Math.PI / 2;
    ripple.position.set(sx, 0.436, -0.35);
    ripple.userData.noMerge = true;
    const kalashTop = createDetailedGajurSpire(goldMat, bronzeMat, 0.24, 0.24);
    kalashTop.position.set(sx, 1.365, -0.66);
    pakhala.add(
      nicheArch,
      rosette,
      spoutBase,
      spoutArm,
      spoutTip,
      valveStem,
      valveBar,
      stream,
      ripple,
      kalashTop,
    );
  }
  exterior.add(pakhala);

  // Covered Carved Sal-Wood Paduka / Chappal Shoe Rack (-15.5, 22.8)
  const shoeRack = new THREE.Group();
  shoeRack.position.set(-15.5, 0, 22.8);
  const srBase = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.14, 1.15), marbleWallMat);
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
    for (const fx of [-0.75, -0.15, 0.45, 0.88]) {
      for (const pairOff of [-0.07, 0.07]) {
        const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.055, 0.24), slateStoneMat);
        shoe.position.set(fx + pairOff, sy + 0.055, 0.04);
        shoeRack.add(shoe);
      }
    }
  }
  const srRoof = new THREE.Mesh(
    createRectangularHipRoofGeometry(3.0, 0.64, 1.4, 0.7),
    terracottaTrimMat,
  );
  srRoof.position.y = 1.92;
  srRoof.castShadow = true;
  const srSpire = createDetailedGajurSpire(goldMat, bronzeMat, 0.32, 0.32);
  srSpire.position.y = 2.24;
  shoeRack.add(srRoof, srSpire);
  exterior.add(shoeRack);

  // Build InstancedMesh botanical foliage groups for exterior beds, urns, Havan borders & Tulsi shrines
  const buildExtBotanicalInstanced = (
    items: ExtBotanicalItem[],
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
  ): THREE.InstancedMesh | null => {
    if (items.length === 0) return null;
    const inst = new THREE.InstancedMesh(geo, mat, items.length);
    items.forEach((it, idx) => {
      inst.setMatrixAt(idx, it.matrix);
      inst.setColorAt(idx, it.tint);
    });
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    inst.castShadow = true;
    inst.receiveShadow = true;
    inst.computeBoundingSphere();
    inst.userData.noMerge = true;
    inst.userData.nonCollidable = true;
    exterior.add(inst);
    return inst;
  };

  buildExtBotanicalInstanced(extShrubList, extShrubSprigGeo, extShrubMat);
  buildExtBotanicalInstanced(extTulsiList, extTulsiSprigGeo, extTulsiMat);
  buildExtBotanicalInstanced(extMarigoldList, extMarigoldSprigGeo, extMarigoldMat);
  buildExtBotanicalInstanced(extFernList, extFernSprigGeo, extFernMat);

  group.add(exterior);

  // Register organic multi-tongue Vedic Havan flame dance (instanced foliage stays rock-steady on soil)
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


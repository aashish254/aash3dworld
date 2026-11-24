import * as THREE from 'three';
import { JanakiMandirTextures } from './janakiMandirTextures';
import { ProceduralTextureSet } from './proceduralTextures';
import { createDetailedBrassSukundaDiyo, getDetailedParterreFinialGeo } from './janakiMandirCraft';

export interface JanakiCourtyardGardenParams {
  group: THREE.Group;
  textures: JanakiMandirTextures;
  woodTextures: ProceduralTextureSet;
  marbleWallMat: THREE.Material;
  whiteTrimMat: THREE.Material;
  tealTrimMat: THREE.Material;
  terracottaTrimMat: THREE.Material;
  goldMat: THREE.Material;
  bronzeMat: THREE.Material;
  diyoGlowMat: THREE.Material;
  markOccluder: (obj: THREE.Object3D) => void;
}

const GOLDEN_ANGLE = 2.399963229728653; // ~137.508 deg phyllotactic spiral

/** Deterministic pseudo-random helper [0, 1) */
function hash01(seed: number): number {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

/**
 * Generates an organically arched, cupped 3D botanical sprig/bough mesh pivoted at base stem (0, 0, 0).
 * Replaces flat planes and low-poly blobs with smooth doubly-curved 3D geometry.
 */
function createArchedSprigGeo(
  width: number,
  height: number,
  archForward: number,
  cupDepth: number,
): THREE.BufferGeometry {
  const cols = 4;
  const rows = 5;
  const geo = new THREE.PlaneGeometry(width, height, cols, rows);
  geo.translate(0, height * 0.5, 0);

  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const v = Math.max(0, Math.min(1, y / height));
    const uNorm = x / (width * 0.5); // -1..1

    // Smooth forward botanical lean + gravity arch + subtle midrib V-cup
    const droopY = -Math.pow(v, 2.2) * (archForward * 0.32);
    const forwardZ = Math.pow(v, 1.45) * archForward - (uNorm * uNorm) * cupDepth * (0.35 + v * 0.65);

    pos.setY(i, y + droopY);
    pos.setZ(i, pos.getZ(i) + forwardZ);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates a gracefully arching Cycas/fern courtyard palm frond pivoted at its base stem (0, 0, 0).
 */
function createDroopingFrondGeo(
  width: number,
  length: number,
  archDrop: number,
  vFoldDepth: number,
): THREE.BufferGeometry {
  const cols = 4;
  const rows = 7;
  const geo = new THREE.PlaneGeometry(width, length, cols, rows);
  geo.translate(0, length * 0.5, 0);

  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const t = Math.max(0, Math.min(1, y / length));
    const uAbs = Math.abs(x) / (width * 0.5);

    // Frond rises smoothly outward (+Z) then droops gracefully past the midpoint
    const zOut = Math.sin(t * Math.PI * 0.54) * length * 0.78 + t * length * 0.14;
    const yArc = Math.sin(t * Math.PI * 0.72) * (length * 0.42) - Math.pow(t, 2.35) * archDrop;
    // Slight realistic rachis V-fold across leaflet span
    const foldZ = uAbs * vFoldDepth * (0.4 + 0.6 * Math.sin(t * Math.PI));

    pos.setY(i, yArc);
    pos.setZ(i, zOut - foldZ);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates a smooth, high-segment lathe-turned Mughal Lotus Terracotta/Marble Urn (zero facets).
 */
function createMughalLotusUrnGeo(radius: number, height: number): THREE.LatheGeometry {
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(radius * 0.56, 0),
    new THREE.Vector2(radius * 0.68, height * 0.06),
    new THREE.Vector2(radius * 0.52, height * 0.13),
    new THREE.Vector2(radius * 0.46, height * 0.22),
    new THREE.Vector2(radius * 0.78, height * 0.40),
    new THREE.Vector2(radius * 0.96, height * 0.58),
    new THREE.Vector2(radius * 0.98, height * 0.72),
    new THREE.Vector2(radius * 0.84, height * 0.84),
    new THREE.Vector2(radius * 0.88, height * 0.91),
    new THREE.Vector2(radius * 1.04, height * 0.96),
    new THREE.Vector2(radius * 1.00, height * 1.00),
    new THREE.Vector2(radius * 0.82, height * 0.98),
    new THREE.Vector2(radius * 0.76, height * 0.85),
  ];
  const geo = new THREE.LatheGeometry(pts, 28);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates a rounded organic garden loam soil bed (rectangular or circular) with gently mounded center.
 */
function createSoilBedGeo(width: number, depth: number, moundHeight: number, segs = 12): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(width, depth, segs, segs);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const hw = width * 0.5;
  const hd = depth * 0.5;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const nx = x / hw;
    const nz = z / hd;
    const r2 = Math.min(1, nx * nx + nz * nz);
    const bump = Math.sin((x * 4.3 + z * 3.7)) * 0.012 + Math.cos(x * 7.1 - z * 5.9) * 0.008;
    const dome = (1 - r2) * moundHeight + bump * (1 - r2 * 0.7);
    pos.setY(i, Math.max(-0.02, dome));
  }
  geo.computeVertexNormals();
  return geo;
}

function createCircularSoilGeo(radius: number, moundHeight: number): THREE.BufferGeometry {
  // Ordered bottom-outer -> peak so LatheGeometry normals point strictly upward (+Y)
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(radius, -0.015),
    new THREE.Vector2(radius * 0.94, moundHeight * 0.14),
    new THREE.Vector2(radius * 0.70, moundHeight * 0.56),
    new THREE.Vector2(radius * 0.35, moundHeight * 0.88),
    new THREE.Vector2(0.001, moundHeight),
  ];
  const dome = new THREE.LatheGeometry(pts, 24);
  dome.computeVertexNormals();
  return dome;
}

/**
 * Adds curved woody TubeGeometry branches rising out of soil so shrubs & Tulsi have true 3D stems.
 */
function addWoodyBranchCluster(
  parent: THREE.Object3D,
  barkMat: THREE.Material,
  originX: number,
  originY: number,
  originZ: number,
  branchCount: number,
  height: number,
  spread: number,
  baseRadius: number,
  seedOffset: number,
): void {
  for (let i = 0; i < branchCount; i++) {
    const angle = i * GOLDEN_ANGLE + hash01(seedOffset + i) * 0.7;
    const lean = spread * (0.45 + hash01(seedOffset + i * 3 + 1) * 0.55);
    const tipH = height * (0.68 + hash01(seedOffset + i * 5 + 2) * 0.32);

    const p0 = new THREE.Vector3(originX, originY - 0.03, originZ);
    const p1 = new THREE.Vector3(
      originX + Math.cos(angle) * lean * 0.32,
      originY + tipH * 0.38,
      originZ + Math.sin(angle) * lean * 0.32,
    );
    const p2 = new THREE.Vector3(
      originX + Math.cos(angle) * lean * 0.78,
      originY + tipH * 0.74,
      originZ + Math.sin(angle) * lean * 0.78,
    );
    const p3 = new THREE.Vector3(
      originX + Math.cos(angle + 0.18) * lean,
      originY + tipH,
      originZ + Math.sin(angle + 0.18) * lean,
    );

    const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);
    const r = baseRadius * (0.72 + hash01(seedOffset + i * 7) * 0.35);
    const tubeGeo = new THREE.TubeGeometry(curve, 6, r, 5, false);
    const stem = new THREE.Mesh(tubeGeo, barkMat);
    stem.castShadow = true;
    parent.add(stem);
  }
}

interface BotanicalPlacement {
  matrix: THREE.Matrix4;
  tint: THREE.Color;
}

/**
 * Populates Janaki Mandir's inner Prangan courtyard with lifelike, high-detail botanical gardens,
 * Mughal terracotta lotus urns, sacred Tulsi Vrindavan mandap, Charbagh corner/sanctum parterres,
 * Sayapatri marigold borders, and gracefully arching courtyard palms/ferns.
 */
export function createJanakiCourtyardGarden({
  group,
  textures: jTex,
  woodTextures,
  marbleWallMat,
  whiteTrimMat,
  tealTrimMat,
  terracottaTrimMat,
  goldMat,
  bronzeMat,
  diyoGlowMat,
  markOccluder,
}: JanakiCourtyardGardenParams): void {
  // 1. Matte Calibrated Botanical & Pottery PBR Materials (zero glare)
  const soilLoamMat = new THREE.MeshStandardMaterial({
    map: jTex.soilLoamMap,
    normalMap: jTex.soilLoamNormal,
    normalScale: new THREE.Vector2(0.82, 0.82),
    roughnessMap: jTex.soilLoamRough,
    color: 0xffffff,
    roughness: 1.0,
    metalness: 0.0,
  });

  const terracottaUrnMat = new THREE.MeshStandardMaterial({
    map: jTex.terracottaUrnMap,
    normalMap: jTex.terracottaUrnNormal,
    normalScale: new THREE.Vector2(0.75, 0.75),
    roughnessMap: jTex.terracottaUrnRough,
    color: 0xffffff,
    roughness: 1.0,
    metalness: 0.02,
  });

  const barkMat = new THREE.MeshStandardMaterial({
    map: woodTextures.woodMap,
    normalMap: woodTextures.woodNormal,
    normalScale: new THREE.Vector2(0.65, 0.65),
    color: 0x5c422c,
    roughness: 0.9,
    metalness: 0.0,
  });

  const makeFoliageMaterial = (map: THREE.CanvasTexture, normalMap: THREE.CanvasTexture, roughness: number) =>
    new THREE.MeshStandardMaterial({
      map,
      normalMap,
      normalScale: new THREE.Vector2(0.68, 0.68),
      alphaTest: 0.36,
      side: THREE.DoubleSide,
      roughness,
      metalness: 0.0,
      color: 0xffffff,
    });

  const tulsiMat = makeFoliageMaterial(jTex.tulsiLeafMap, jTex.tulsiLeafNormal, 0.8);
  const shrubMat = makeFoliageMaterial(jTex.shrubFoliageMap, jTex.shrubFoliageNormal, 0.82);
  const marigoldMat = makeFoliageMaterial(jTex.marigoldMap, jTex.marigoldNormal, 0.78);
  const fernPalmMat = makeFoliageMaterial(jTex.fernPalmMap, jTex.fernPalmNormal, 0.76);

  // Curved multi-row alpha-cutout botanical geometries (non-flat, zero poly facets)
  const tulsiSprigGeo = createArchedSprigGeo(0.56, 0.74, 0.16, 0.07);
  const shrubBoughGeo = createArchedSprigGeo(0.84, 0.94, 0.24, 0.11);
  const marigoldSprigGeo = createArchedSprigGeo(0.46, 0.54, 0.14, 0.06);
  const fernFrondGeo = createDroopingFrondGeo(0.46, 0.92, 0.24, 0.05);

  const tulsiInstances: BotanicalPlacement[] = [];
  const shrubInstances: BotanicalPlacement[] = [];
  const marigoldInstances: BotanicalPlacement[] = [];
  const fernInstances: BotanicalPlacement[] = [];

  const tmpPos = new THREE.Vector3();
  const tmpQuat = new THREE.Quaternion();
  const tmpScale = new THREE.Vector3();
  const tmpEuler = new THREE.Euler();

  const pushSprig = (
    list: BotanicalPlacement[],
    x: number,
    y: number,
    z: number,
    yaw: number,
    pitchOut: number,
    roll: number,
    sx: number,
    sy: number,
    sz: number,
    seed: number,
    tintLow = 0.86,
    tintHigh = 1.08,
  ) => {
    tmpPos.set(x, y, z);
    tmpEuler.set(pitchOut, yaw, roll, 'YXZ');
    tmpQuat.setFromEuler(tmpEuler);
    tmpScale.set(sx, sy, sz);
    const mat = new THREE.Matrix4().compose(tmpPos, tmpQuat, tmpScale);
    const shade = tintLow + hash01(seed) * (tintHigh - tintLow);
    const warm = 0.96 + hash01(seed + 19) * 0.08;
    const tint = new THREE.Color(shade * warm, shade, shade * 0.94);
    list.push({ matrix: mat, tint });
  };

  /** Scatters an organic multi-tier shrub (woody stems + lower broad boughs + upper crown sprigs) */
  const addOrnamentalShrub = (
    parent: THREE.Object3D,
    wx: number,
    wy: number,
    wz: number,
    scale: number,
    seed: number,
    boughCount: number,
  ) => {
    addWoodyBranchCluster(parent, barkMat, 0, wy, 0, 5, 0.72 * scale, 0.42 * scale, 0.032 * scale, seed);

    for (let i = 0; i < boughCount; i++) {
      const h = hash01(seed + i * 11.3);
      const layer = i < boughCount * 0.45 ? 0 : i < boughCount * 0.8 ? 1 : 2;
      const yaw = i * GOLDEN_ANGLE + hash01(seed + i * 7.1) * 0.35;
      const ringR = (layer === 0 ? 0.24 : layer === 1 ? 0.14 : 0.05) * scale;
      const yOff = (layer === 0 ? 0.04 : layer === 1 ? 0.26 : 0.44) * scale;
      const pitchOut = (layer === 0 ? 0.62 : layer === 1 ? 0.38 : 0.16) + (h - 0.5) * 0.14;
      const sBase = scale * (0.82 + h * 0.32);

      pushSprig(
        shrubInstances,
        wx + Math.sin(yaw) * ringR,
        wy + yOff,
        wz + Math.cos(yaw) * ringR,
        yaw,
        pitchOut,
        (hash01(seed + i * 5.7) - 0.5) * 0.26,
        sBase,
        sBase * (0.88 + hash01(seed + i * 3.1) * 0.24),
        sBase,
        seed + i * 13,
      );
    }
  };

  /** Scatters a lush arching Cycas / fern palm rosette (concentric tiers + central unfurling fronds) */
  const addCourtyardPalmRosette = (
    wx: number,
    wy: number,
    wz: number,
    scale: number,
    seed: number,
    frondCount = 12,
  ) => {
    for (let i = 0; i < frondCount; i++) {
      const outer = i < Math.ceil(frondCount * 0.62);
      const yaw = i * GOLDEN_ANGLE + hash01(seed + i * 4.3) * 0.24;
      const pitch = outer ? 0.02 + hash01(seed + i * 9) * 0.12 : -0.34 + hash01(seed + i * 9) * 0.16;
      const s = scale * (outer ? 0.96 + hash01(seed + i) * 0.18 : 0.74 + hash01(seed + i) * 0.15);

      pushSprig(
        fernInstances,
        wx + Math.sin(yaw) * 0.04 * scale,
        wy - 0.02 * scale,
        wz + Math.cos(yaw) * 0.04 * scale,
        yaw,
        pitch,
        (hash01(seed + i * 2.9) - 0.5) * 0.14,
        s,
        s,
        s,
        seed + i * 17,
        0.88,
        1.08,
      );
    }
  };

  /** Scatters delicate Sayapatri (Nepali marigold) flower tufts in natural crossed-sprig pairs */
  const addMarigoldTuft = (wx: number, wy: number, wz: number, scale: number, seed: number) => {
    const baseYaw = hash01(seed) * Math.PI * 2;
    for (let k = 0; k < 3; k++) {
      const yaw = baseYaw + k * 2.09 + (hash01(seed + k * 3) - 0.5) * 0.35;
      const s = scale * (0.86 + hash01(seed + k * 7) * 0.28);
      pushSprig(
        marigoldInstances,
        wx + Math.sin(yaw) * 0.03 * scale,
        wy,
        wz + Math.cos(yaw) * 0.03 * scale,
        yaw,
        0.26 + hash01(seed + k * 5) * 0.18,
        (hash01(seed + k * 11) - 0.5) * 0.16,
        s,
        s,
        s,
        seed + k * 23,
        0.9,
        1.06,
      );
    }
  };

  // =========================================================================
  // A. OPEN CENTRAL PROCESSIONAL LOTUS MEDALLION FORECOURT (Clear before Garbhagriha)
  // =========================================================================
  // (Central axial Tulsi pot removed so the 16-petal Sacred Lotus Medallion & praying stairs remain unobstructed.)

  // =========================================================================
  // B. FOUR GRAND CORNER CHARBAGH PARTERRE BEDS (±10.6, ±8.2) & TWO NORTH SANCTUM BEDS (±7.4, -9.8)
  // =========================================================================
  const parterreSoilGeo = createSoilBedGeo(1.88, 1.88, 0.09, 14);

  const parterreCoords: Array<{ x: number; z: number; seed: number; northSanctum: boolean }> = [
    { x: -10.6, z: -8.2, seed: 1100, northSanctum: false },
    { x: 10.6, z: -8.2, seed: 1200, northSanctum: false },
    { x: -10.6, z: 8.2, seed: 1300, northSanctum: false },
    { x: 10.6, z: 8.2, seed: 1400, northSanctum: false },
    { x: -7.4, z: -9.8, seed: 1500, northSanctum: true },
    { x: 7.4, z: -9.8, seed: 1600, northSanctum: true },
  ];

  for (const bed of parterreCoords) {
    const bedGroup = new THREE.Group();
    bedGroup.position.set(bed.x, 0, bed.z);

    const w = bed.northSanctum ? 2.05 : 2.15;
    const h = bed.northSanctum ? 0.38 : 0.42;

    const pBox = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), marbleWallMat);
    pBox.position.y = h * 0.5;
    pBox.castShadow = true;
    pBox.receiveShadow = true;

    const pCurb = new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, 0.1, w + 0.12), terracottaTrimMat);
    pCurb.position.y = h + 0.04;
    pCurb.castShadow = true;

    // Carved Makrana marble lotus corner finials + teal inlay trim band
    const pBand = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.07, w + 0.04), tealTrimMat);
    pBand.position.y = h - 0.04;

    const parterreFinialGeo = getDetailedParterreFinialGeo();
    const halfCorner = w * 0.48;
    for (const cx of [-halfCorner, halfCorner]) {
      for (const cz of [-halfCorner, halfCorner]) {
        const finial = new THREE.Mesh(parterreFinialGeo, whiteTrimMat);
        finial.position.set(cx, h + 0.09, cz);
        finial.castShadow = true;
        bedGroup.add(finial);
      }
    }

    // Damp organic humus soil mound
    const soil = new THREE.Mesh(parterreSoilGeo, soilLoamMat);
    soil.position.y = h + 0.03;
    soil.receiveShadow = true;

    // Sculpted Nepali Brass Sukunda Diyo oil lamp on inner walkway corner of each bed
    const diyaX = bed.x < 0 ? w * 0.44 : -w * 0.44;
    const diyaZ = bed.z < 0 ? w * 0.44 : -w * 0.44;
    const bedSukunda = createDetailedBrassSukundaDiyo(goldMat, bronzeMat, diyoGlowMat, 0.72, true);
    bedSukunda.position.set(diyaX, h + 0.09, diyaZ);
    bedSukunda.rotation.y = Math.atan2(-bed.x, -bed.z);

    bedGroup.add(pBox, pCurb, pBand, soil, bedSukunda);

    const soilY = h + 0.09;
    // Central woody multi-stemmed flowering Ashoka/Chameli shrub
    addOrnamentalShrub(
      bedGroup,
      bed.x,
      soilY,
      bed.z,
      bed.northSanctum ? 1.05 : 1.18,
      bed.seed,
      bed.northSanctum ? 18 : 22,
    );

    // North Sanctum beds highlight graceful arching Cycas/fern palm fronds above the shrub
    if (bed.northSanctum) {
      addCourtyardPalmRosette(bed.x, soilY + 0.12, bed.z, 1.08, bed.seed + 45, 11);
    }

    // Corner courtyard fern accents inside opposite corners of the soil bed
    for (const [fx, fz, fSeed] of [
      [-0.58, -0.58, bed.seed + 71],
      [0.58, 0.58, bed.seed + 83],
    ] as Array<[number, number, number]>) {
      addCourtyardPalmRosette(bed.x + fx, soilY - 0.02, bed.z + fz, 0.54, fSeed, 7);
    }

    // Lush Sayapatri (marigold) border tufts ringing the damp soil margin
    const borderPts: Array<[number, number]> = [
      [-0.64, 0.02],
      [0.64, -0.02],
      [0.02, -0.64],
      [-0.02, 0.64],
      [-0.56, 0.56],
      [0.56, -0.56],
    ];
    borderPts.forEach(([ox, oz], idx) => {
      addMarigoldTuft(bed.x + ox, soilY - 0.01, bed.z + oz, 0.85, bed.seed + 110 + idx * 17);
    });

    markOccluder(bedGroup);
    group.add(bedGroup);
  }

  // =========================================================================
  // C. TWELVE SCULPTED MUGHAL TERRACOTTA & MARBLE LOTUS URNS (WALKWAYS & THRESHOLDS CLEAR)
  // =========================================================================
  const urnSmallGeo = createMughalLotusUrnGeo(0.38, 0.62);
  const urnTallGeo = createMughalLotusUrnGeo(0.45, 0.74);
  const urnSmallSoilGeo = createCircularSoilGeo(0.31, 0.06);
  const urnTallSoilGeo = createCircularSoilGeo(0.37, 0.07);

  interface UrnSpec {
    x: number;
    z: number;
    tall: boolean;
    kind: 'palm' | 'tulsi' | 'shrub';
    seed: number;
  }

  const urnSpecs: UrnSpec[] = [
    // Flanking Central Mughal Gate outer piers (4.25m clear of 5.4m doorway span)
    { x: -4.25, z: 0.35, tall: true, kind: 'palm', seed: 2100 },
    { x: 4.25, z: 0.35, tall: true, kind: 'palm', seed: 2200 },
    // Flanking Inner Simha Dwar Pishtaq along South cloister border
    { x: -4.15, z: 10.0, tall: true, kind: 'shrub', seed: 2300 },
    { x: 4.15, z: 10.0, tall: true, kind: 'shrub', seed: 2400 },
    // Hugging Sanctum Jagati plinth front corners cleanly inside sanctum collision margin
    { x: -4.85, z: -4.4, tall: false, kind: 'tulsi', seed: 2500 },
    { x: 4.85, z: -4.4, tall: false, kind: 'tulsi', seed: 2600 },
    // Flanking Parikrama East & West veranda edges (clear of Dalan gates, prayer-wheel racks & veranda curb)
    { x: -13.16, z: -6.2, tall: false, kind: 'palm', seed: 2700 },
    { x: 13.16, z: -6.2, tall: false, kind: 'palm', seed: 2800 },
    { x: -13.16, z: 4.2, tall: false, kind: 'shrub', seed: 2900 },
    { x: 13.16, z: 4.2, tall: false, kind: 'shrub', seed: 3000 },
  ];

  for (const spec of urnSpecs) {
    const uGroup = new THREE.Group();
    uGroup.position.set(spec.x, 0, spec.z);

    const padW = spec.tall ? 0.78 : 0.66;
    const pad = new THREE.Mesh(new THREE.BoxGeometry(padW, 0.14, padW), whiteTrimMat);
    pad.position.y = 0.07;
    pad.castShadow = true;
    pad.receiveShadow = true;

    const collar = new THREE.Mesh(new THREE.BoxGeometry(padW + 0.06, 0.06, padW + 0.06), tealTrimMat);
    collar.position.y = 0.16;

    const urnH = spec.tall ? 0.74 : 0.62;
    const urnMesh = new THREE.Mesh(spec.tall ? urnTallGeo : urnSmallGeo, terracottaUrnMat);
    urnMesh.position.y = 0.18;
    urnMesh.castShadow = true;
    urnMesh.receiveShadow = true;

    const soilY = 0.18 + urnH * 0.9;
    const soilMesh = new THREE.Mesh(spec.tall ? urnTallSoilGeo : urnSmallSoilGeo, soilLoamMat);
    soilMesh.position.y = soilY;
    soilMesh.receiveShadow = true;

    uGroup.add(pad, collar, urnMesh, soilMesh);

    if (spec.kind === 'palm') {
      addCourtyardPalmRosette(spec.x, soilY + 0.04, spec.z, spec.tall ? 0.96 : 0.82, spec.seed, 10);
      addMarigoldTuft(spec.x + 0.14, soilY + 0.02, spec.z + 0.1, 0.66, spec.seed + 33);
      addMarigoldTuft(spec.x - 0.14, soilY + 0.02, spec.z - 0.1, 0.64, spec.seed + 55);
    } else if (spec.kind === 'tulsi') {
      addWoodyBranchCluster(uGroup, barkMat, 0, soilY, 0, 4, 0.42, 0.22, 0.018, spec.seed);
      for (let i = 0; i < 12; i++) {
        const yaw = i * GOLDEN_ANGLE;
        const r = i >= 7 ? 0.04 : 0.11;
        pushSprig(
          tulsiInstances,
          spec.x + Math.sin(yaw) * r,
          soilY + (i >= 7 ? 0.08 : 0.01),
          spec.z + Math.cos(yaw) * r,
          yaw,
          i >= 7 ? 0.18 : 0.48,
          (hash01(spec.seed + i) - 0.5) * 0.2,
          0.74,
          0.74,
          0.74,
          spec.seed + i * 7,
        );
      }
    } else {
      addOrnamentalShrub(uGroup, spec.x, soilY, spec.z, spec.tall ? 0.78 : 0.66, spec.seed, 12);
      addMarigoldTuft(spec.x, soilY + 0.01, spec.z + (spec.z > 0 ? -0.14 : 0.14), 0.65, spec.seed + 41);
    }

    group.add(uGroup);
  }

  // =========================================================================
  // D. FINALIZE INSTANCED ALPHA-CUTOUT BOTANICAL FOLIAGE (4 DRAW CALLS TOTAL)
  // =========================================================================
  const buildBotanicalInstancedMesh = (
    geo: THREE.BufferGeometry,
    mat: THREE.MeshStandardMaterial,
    tex: THREE.CanvasTexture,
    items: BotanicalPlacement[],
  ) => {
    if (items.length === 0) return;
    const inst = new THREE.InstancedMesh(geo, mat, items.length);
    for (let i = 0; i < items.length; i++) {
      inst.setMatrixAt(i, items[i].matrix);
      inst.setColorAt(i, items[i].tint);
    }
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    inst.castShadow = true;
    inst.receiveShadow = true;
    // Leaf-shaped alpha cutout shadows instead of rectangular card silhouettes
    inst.customDepthMaterial = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
      map: tex,
      alphaTest: 0.36,
    });
    inst.computeBoundingSphere();
    inst.userData.nonCollidable = true;
    group.add(inst);
  };

  buildBotanicalInstancedMesh(tulsiSprigGeo, tulsiMat, jTex.tulsiLeafMap, tulsiInstances);
  buildBotanicalInstancedMesh(shrubBoughGeo, shrubMat, jTex.shrubFoliageMap, shrubInstances);
  buildBotanicalInstancedMesh(marigoldSprigGeo, marigoldMat, jTex.marigoldMap, marigoldInstances);
  buildBotanicalInstancedMesh(fernFrondGeo, fernPalmMat, jTex.fernPalmMap, fernInstances);
}

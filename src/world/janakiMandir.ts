import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { LandmarkBuildResult } from './proceduralModels';
import { ProceduralTextureSet } from './proceduralTextures';
import { createJanakiCourtyardGarden } from './janakiMandirGarden';
import { createJanakiCourtyardLanterns } from './janakiMandirLanterns';
import { createJanakiCourtyardBirds } from './janakiMandirBirds';
import { createJanakiMandirExterior } from './janakiMandirExterior';
import { applyRealisticWaterShader } from './waterShader';
import {
  createChowkChautaraTree,
  createChowkHitiFountain,
  createChowkMonumentalDeepastambha,
  createChowkPujaStall,
  createChowkStoneBench,
  createDetailedBrassSukundaDiyo,
  createDetailedChowkLanternPost,
  createDetailedDeepastambha,
  createDetailedGajurSpire,
  createDetailedGuardianLion,
  createDetailedPanchartiStand,
  createDetailedSanctumAltarpiece,
  createDetailedTempleBell,
  createGarbhagrihaAsanaCarpet,
  createPujaThaliWithShankha,
  getDetailedGajurKalashGeo,
  getDetailedKumbhaUrnGeo,
  getDetailedParterreFinialGeo,
  getDetailedPrayerWheelCapGeo,
} from './janakiMandirCraft';

const _m4 = new THREE.Matrix4();
const _v3 = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _e = new THREE.Euler();

/**
 * Generates an extruded wall pier/spandrel framing an authentic multi-foil cusped Mughal-Rajput archway.
 */
function createCuspedArchSpandrelGeo(
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
  // Multi-foil 5-lobe cusped Rajput-Mughal arch contour
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
function createOnionDomeGeometry(radius: number, height: number): THREE.LatheGeometry {
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
function createCurvedBracketGeometry(
  thickness: number,
  height: number,
  projection: number,
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const hh = height * 0.5;
  const hp = projection * 0.5;
  // Profile in XY (X = projection depth, Y = vertical) then rotated to YZ plane
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
  // Rotate so profile X aligns with +Z outward eave direction and thickness aligns with X
  geo.rotateY(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

// Detailed Guardian Lion & Temple Bell builders live in ./janakiMandirCraft.ts

/**
 * Builds a realistic, richly detailed Nepali carved granite, Khaprail terracotta-canopy &
 * gilded-brass Shilalekh heritage monument stele (replaces flat low-poly signboards).
 */
function createJanakiMonumentSign(
  textures: ProceduralTextureSet,
  goldMat: THREE.Material,
  bronzeMat: THREE.Material,
  terracottaMat: THREE.Material,
  flameMat: THREE.Material,
): THREE.Group {
  const g = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({
    map: textures.cobbleMap,
    normalMap: textures.cobbleNormal,
    color: 0x9b9488,
    roughness: 0.86,
  });
  const slateFrameMat = new THREE.MeshStandardMaterial({
    color: 0x26292e,
    roughness: 0.64,
    metalness: 0.14,
  });
  const tex = textures.createSignTexture('JANAKI MANDIR', 'Janakpurdham · Nau Lakha Palace', '#d49a3a');
  const faceMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.42, metalness: 0.16 });

  // Two-course stepped chamfered granite pedestal plinth
  const baseLower = new THREE.Mesh(new THREE.BoxGeometry(3.85, 0.24, 1.15), stoneMat);
  baseLower.position.y = 0.12;
  baseLower.castShadow = true;
  baseLower.receiveShadow = true;
  const baseUpper = new THREE.Mesh(new THREE.BoxGeometry(3.52, 0.22, 0.92), stoneMat);
  baseUpper.position.y = 0.35;
  baseUpper.castShadow = true;
  baseUpper.receiveShadow = true;
  const baseTrim = new THREE.Mesh(new THREE.BoxGeometry(3.60, 0.06, 0.98), terracottaMat);
  baseTrim.position.y = 0.48;
  g.add(baseLower, baseUpper, baseTrim);

  // Turned stone-and-wood Shilalekh pillars + stepped pedestals + brass collars
  const postPts = [
    new THREE.Vector2(0.15, 0.0),
    new THREE.Vector2(0.16, 0.14),
    new THREE.Vector2(0.115, 0.24),
    new THREE.Vector2(0.105, 1.48),
    new THREE.Vector2(0.14, 1.62),
    new THREE.Vector2(0.155, 1.72),
  ];
  const postGeo = new THREE.LatheGeometry(postPts, 20);
  const bracketGeo = createCurvedBracketGeometry(0.12, 0.32, 0.46);
  for (const px of [-1.46, 1.46]) {
    const colBase = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.38), stoneMat);
    colBase.position.set(px, 0.58, 0);
    const col = new THREE.Mesh(postGeo, stoneMat);
    col.position.set(px, 0.65, 0);
    col.castShadow = true;
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.122, 0.015, 8, 20), bronzeMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.set(px, 1.92, 0);
    const abacus = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.10, 0.42), bronzeMat);
    abacus.position.set(px, 2.40, 0);
    const brkF = new THREE.Mesh(bracketGeo, terracottaMat);
    brkF.position.set(px, 2.24, 0.24);
    const brkB = new THREE.Mesh(bracketGeo, terracottaMat);
    brkB.rotation.y = Math.PI;
    brkB.position.set(px, 2.24, -0.24);
    g.add(colBase, col, collar, abacus, brkF, brkB);

    // Flanking carved stone diya shoulders
    const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.24, 0.38), stoneMat);
    shoulder.position.set(px * 1.18, 0.58, 0.14);
    const diyo = createDetailedBrassSukundaDiyo(goldMat, bronzeMat, flameMat, 0.68, true);
    diyo.position.set(px * 1.18, 0.70, 0.14);
    g.add(shoulder, diyo);
  }

  // Carved dark slate & molded brass plaque slab recessed neatly between the turned columns
  const frameOuter = new THREE.Mesh(new THREE.BoxGeometry(2.74, 1.14, 0.18), slateFrameMat);
  frameOuter.position.set(0, 1.54, 0);
  frameOuter.castShadow = true;
  const brassMolding = new THREE.Mesh(new THREE.BoxGeometry(2.64, 1.04, 0.20), bronzeMat);
  brassMolding.position.set(0, 1.54, 0);
  const faceFront = new THREE.Mesh(new THREE.PlaneGeometry(2.48, 0.92), faceMat);
  faceFront.position.set(0, 1.54, 0.105);
  const faceBack = new THREE.Mesh(new THREE.PlaneGeometry(2.48, 0.92), faceMat);
  faceBack.rotation.y = Math.PI;
  faceBack.position.set(0, 1.54, -0.105);
  g.add(frameOuter, brassMolding, faceFront, faceBack);

  // Brass corner rosettes & lower lotus apron rail
  const rosetteGeo = new THREE.CylinderGeometry(0.036, 0.036, 0.22, 12);
  rosetteGeo.rotateX(Math.PI / 2);
  for (const rx of [-1.26, 1.26]) {
    for (const ry of [1.06, 2.02]) {
      const ros = new THREE.Mesh(rosetteGeo, goldMat);
      ros.position.set(rx, ry, 0);
      g.add(ros);
    }
  }
  const lowerApron = new THREE.Mesh(new THREE.BoxGeometry(2.72, 0.12, 0.22), terracottaMat);
  lowerApron.position.set(0, 0.91, 0);
  g.add(lowerApron);

  // Traditional overhanging Nepali Khaprail terracotta roof canopy + rafters + twin brass Gajur spires
  const lintelBeam = new THREE.Mesh(new THREE.BoxGeometry(3.46, 0.16, 0.44), bronzeMat);
  lintelBeam.position.set(0, 2.52, 0);
  const roofLower = new THREE.Mesh(new THREE.BoxGeometry(3.88, 0.12, 1.16), terracottaMat);
  roofLower.position.set(0, 2.64, 0);
  roofLower.castShadow = true;
  const roofUpper = new THREE.Mesh(new THREE.BoxGeometry(3.42, 0.16, 0.78), terracottaMat);
  roofUpper.position.set(0, 2.78, 0);
  roofUpper.castShadow = true;
  const ridgeCap = new THREE.Mesh(new THREE.BoxGeometry(3.26, 0.10, 0.24), bronzeMat);
  ridgeCap.position.set(0, 2.90, 0);
  g.add(lintelBeam, roofLower, roofUpper, ridgeCap);

  for (let r = -4; r <= 4; r++) {
    const rafter = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 1.06), slateFrameMat);
    rafter.position.set(r * 0.42, 2.58, 0);
    g.add(rafter);
  }
  for (const fx of [-1.25, 0, 1.25]) {
    const finial = createDetailedGajurSpire(goldMat, bronzeMat, fx === 0 ? 0.48 : 0.36, fx === 0 ? 0.48 : 0.38);
    finial.position.set(fx, 2.95, 0);
    g.add(finial);
  }

  return g;
}

/**
 * 1:1 Monumental Real-World Scale Janaki Mandir · Janakpur Palace (~49.2m × 40m × 21.6m)
 * Anchored at world y = 1.05m (the marble plinth surface).
 * Outer Janakpur Chowk brick plaza extends south (local z: +18.5..+57.5) at local y = -0.78m.
 * Walkable up central stairs & through the vaulted Mithila-mural Simha Dwar into the 4-sided
 * colonnaded Parikrama cloister and open marble Prangan courtyard featuring the 3-tier Garbhagriha Ram-Janaki Sanctum.
 */
export function createJanakiMandir(
  textures: ProceduralTextureSet,
  onAssetLoaded?: () => void,
): LandmarkBuildResult {
  const group = new THREE.Group();
  const beaconLights: THREE.PointLight[] = [];
  const animatedNodes: THREE.Object3D[] = [];
  const cameraOccluders: THREE.Object3D[] = [];
  const templeBells: THREE.Group[] = [];
  const registerBell = (bell: THREE.Group): THREE.Group => {
    templeBells.push(bell);
    return bell;
  };
  const jTex = textures.janaki;

  // --- Shared Matte Calibrated PBR Materials (1024px Mughal Makrana Marble, zero glare) ---
  const marbleWallMat = new THREE.MeshStandardMaterial({
    map: jTex.marbleAshlarMap,
    normalMap: jTex.marbleAshlarNormal,
    normalScale: new THREE.Vector2(0.58, 0.58),
    roughnessMap: jTex.marbleAshlarRough,
    color: 0xf4f1ea,
    roughness: 1.0,
    metalness: 0.02,
  });
  const whiteTrimMat = new THREE.MeshStandardMaterial({
    map: jTex.marbleTrimMap,
    normalMap: jTex.marbleTrimNormal,
    normalScale: new THREE.Vector2(0.45, 0.45),
    roughnessMap: jTex.marbleTrimRough,
    color: 0xf2eee6,
    roughness: 1.0,
    metalness: 0.02,
  });
  const pillarCarvedMat = new THREE.MeshStandardMaterial({
    map: jTex.pillarCarvedMap,
    normalMap: jTex.pillarCarvedNormal,
    normalScale: new THREE.Vector2(0.88, 0.88),
    roughnessMap: jTex.pillarCarvedRough,
    color: 0xf6f3ec,
    roughness: 1.0,
    metalness: 0.02,
  });
  const carvedDoorMat = new THREE.MeshStandardMaterial({
    map: jTex.carvedDoorMap,
    normalMap: jTex.carvedDoorNormal,
    normalScale: new THREE.Vector2(0.85, 0.85),
    color: 0xffffff,
    roughness: 0.74,
    metalness: 0.08,
  });
  const domeMat = new THREE.MeshStandardMaterial({
    map: jTex.domeRibMap,
    normalMap: jTex.domeRibNormal,
    normalScale: new THREE.Vector2(0.65, 0.65),
    roughnessMap: jTex.domeRibRough,
    color: 0xf5f2eb,
    roughness: 1.0,
    metalness: 0.03,
  });
  const tealTrimMat = new THREE.MeshStandardMaterial({
    color: 0x265d66,
    roughness: 0.74,
    metalness: 0.06,
  });
  const terracottaTrimMat = new THREE.MeshStandardMaterial({
    color: 0xa34b30,
    roughness: 0.82,
    metalness: 0.04,
  });
  const jharokhaStoneMat = new THREE.MeshStandardMaterial({
    map: textures.sandstoneMap,
    normalMap: textures.sandstoneNormal,
    color: 0xd49d8a,
    roughness: 0.8,
  });
  const lionStoneMat = new THREE.MeshStandardMaterial({
    map: textures.sandstoneMap,
    normalMap: textures.sandstoneNormal,
    color: 0xded5c5,
    roughness: 0.76,
  });
  const darkStoneMat = new THREE.MeshStandardMaterial({
    map: textures.sandstoneMap,
    normalMap: textures.sandstoneNormal,
    color: 0x3b3631,
    roughness: 0.78,
  });
  const waterUTime = { value: 0 };
  const hitiWaterMat = new THREE.MeshStandardMaterial({
    color: 0x1e7e88,
    normalMap: textures.waterNormal,
    normalScale: new THREE.Vector2(0.32, 0.32),
    roughness: 0.08,
    metalness: 0.42,
    transparent: true,
    opacity: 0.9,
  });
  applyRealisticWaterShader(hitiWaterMat, waterUTime, {
    mode: 'pond',
    maxRadius: 2.2,
    flowSpeed: 1.0,
    deepTint: 0x0b3f49,
    shallowTint: 0x25747b,
  });
  const waterShaderController = new THREE.Object3D();
  waterShaderController.userData.noMerge = true;
  waterShaderController.userData.onFlickerUpdate = (elapsed: number) => {
    waterUTime.value = elapsed;
  };
  animatedNodes.push(waterShaderController);
  const chautaraFoliageMat = new THREE.MeshStandardMaterial({
    map: jTex.shrubFoliageMap,
    normalMap: jTex.shrubFoliageNormal,
    normalScale: new THREE.Vector2(0.68, 0.68),
    alphaTest: 0.36,
    side: THREE.DoubleSide,
    roughness: 0.82,
    metalness: 0.0,
    color: 0xffffff,
  });
  const chautaraSoilMat = new THREE.MeshStandardMaterial({
    map: jTex.soilLoamMap,
    normalMap: jTex.soilLoamNormal,
    normalScale: new THREE.Vector2(0.75, 0.75),
    roughnessMap: jTex.soilLoamRough,
    color: 0xffffff,
    roughness: 1.0,
    metalness: 0.0,
  });
  const jaliMat = new THREE.MeshStandardMaterial({
    map: jTex.saffronJaliMap,
    normalMap: jTex.saffronJaliNormal,
    normalScale: new THREE.Vector2(0.9, 0.9),
    color: 0xffffff,
    emissive: 0x8f5212,
    emissiveIntensity: 0.28,
    roughness: 0.68,
  });
  const stainedGlassMat = new THREE.MeshStandardMaterial({
    map: jTex.stainedGlassArchMap,
    color: 0xffffff,
    emissive: 0x5c361a,
    emissiveIntensity: 0.35,
    roughness: 0.42,
    metalness: 0.1,
  });
  const toranaMat = new THREE.MeshStandardMaterial({
    map: jTex.mithilaToranaMap,
    roughness: 0.76,
  });
  const muralMat = new THREE.MeshStandardMaterial({
    map: jTex.mithilaMuralMap,
    roughness: 0.78,
  });
  const darkRecessMat = new THREE.MeshStandardMaterial({
    color: 0x1b1512,
    roughness: 0.94,
  });
  const courtyardMandalaMat = new THREE.MeshStandardMaterial({
    map: jTex.courtyardMandalaMap,
    normalMap: jTex.courtyardMandalaNormal,
    normalScale: new THREE.Vector2(0.76, 0.76),
    roughnessMap: jTex.courtyardMandalaRough,
    color: 0xf6f3ec,
    roughness: 1.0,
    metalness: 0.02,
  });
  const courtyardMedallionMat = new THREE.MeshStandardMaterial({
    map: jTex.courtyardMedallionMap,
    normalMap: jTex.courtyardMedallionNormal,
    normalScale: new THREE.Vector2(0.72, 0.72),
    roughnessMap: jTex.courtyardMedallionRough,
    color: 0xf6f3ec,
    roughness: 1.0,
    metalness: 0.02,
    alphaTest: 0.45,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const flagstoneMat = new THREE.MeshStandardMaterial({
    map: jTex.flagstoneMap,
    normalMap: jTex.flagstoneNormal,
    normalScale: new THREE.Vector2(0.56, 0.56),
    roughnessMap: jTex.flagstoneRough,
    color: 0xf5f2eb,
    roughness: 1.0,
    metalness: 0.02,
  });
  const prayerWheelMat = new THREE.MeshStandardMaterial({
    map: jTex.prayerWheelMap,
    normalMap: jTex.prayerWheelNormal,
    normalScale: new THREE.Vector2(0.75, 0.75),
    roughnessMap: jTex.prayerWheelRough,
    color: 0xffffff,
    roughness: 1.0,
    metalness: 0.72,
  });
  const passageStoneMat = new THREE.MeshStandardMaterial({
    map: textures.marbleWalkMap,
    normalMap: textures.sandstoneNormal,
    normalScale: new THREE.Vector2(0.3, 0.3),
    color: 0xd4cec2,
    roughness: 0.82,
  });
  const plinthStoneMat = new THREE.MeshStandardMaterial({
    map: textures.cobbleMap,
    normalMap: textures.cobbleNormal,
    color: 0xaea79b,
    roughness: 0.88,
  });
  const brickPlazaMat = new THREE.MeshStandardMaterial({
    map: jTex.brickPlazaMap,
    normalMap: jTex.brickPlazaNormal,
    roughnessMap: jTex.brickPlazaRough,
    color: 0xffffff,
    roughness: 0.92,
  });
  const darkWoodMat = new THREE.MeshStandardMaterial({
    map: textures.woodMap,
    normalMap: textures.woodNormal,
    color: 0x5c3e24,
    roughness: 0.78,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    map: jTex.antiqueBrassMap,
    normalMap: jTex.antiqueBrassNormal,
    normalScale: new THREE.Vector2(0.52, 0.52),
    roughnessMap: jTex.antiqueBrassRough,
    color: 0xffefc6,
    roughness: 0.9,
    metalness: 0.86,
  });
  const bronzeMat = new THREE.MeshStandardMaterial({
    map: jTex.antiqueBrassMap,
    normalMap: jTex.antiqueBrassNormal,
    normalScale: new THREE.Vector2(0.75, 0.75),
    roughnessMap: jTex.antiqueBrassRough,
    color: 0x916b35,
    roughness: 1.0,
    metalness: 0.78,
  });
  const crimsonClothMat = new THREE.MeshStandardMaterial({
    color: 0x992420,
    roughness: 0.82,
  });
  const marigoldMat = new THREE.MeshStandardMaterial({
    color: 0xe38a19,
    emissive: 0x7a3e06,
    emissiveIntensity: 0.25,
    roughness: 0.74,
  });
  const diyoGlowMat = new THREE.MeshStandardMaterial({
    color: 0xffe4a0,
    emissive: 0xe68d1e,
    emissiveIntensity: 2.3,
    roughness: 0.22,
  });

  // Helper to mark architectural walls as camera occluders (merged cleanly below)
  const markOccluder = (obj: THREE.Object3D) => {
    obj.userData.isOccluder = true;
  };

  // =========================================================================
  // 1. JANAKPUR CHOWK BRICK PLAZA & FULL ENCLOSED SACRED COMPOUND GROUNDS
  // =========================================================================
  const plazaY = -0.80;
  // Main South Chowk Brick Plaza (-38.1..+38.1, z: 15.5..57.5) + West-South Compound Brick Extension (-56.5..-38.1, z: 25.4..57.5)
  const chowkFloor = new THREE.Mesh(new THREE.BoxGeometry(76.2, 0.08, 42.0), brickPlazaMat);
  chowkFloor.position.set(0, plazaY - 0.036, 36.5);
  chowkFloor.receiveShadow = true;
  const westSouthChowkFloor = new THREE.Mesh(new THREE.BoxGeometry(18.4, 0.08, 32.1), brickPlazaMat);
  westSouthChowkFloor.position.set(-47.3, plazaY - 0.036, 41.45);
  westSouthChowkFloor.receiveShadow = true;
  // North, East & West-North Perimeter Flagstone Compound Border Paths cleanly inside the closed wall
  const northCompoundWalk = new THREE.Mesh(new THREE.BoxGeometry(94.6, 0.07, 4.4), flagstoneMat);
  northCompoundWalk.position.set(-9.2, plazaY - 0.03, -32.3);
  northCompoundWalk.receiveShadow = true;
  const westCompoundWalk = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.07, 38.0), flagstoneMat);
  westCompoundWalk.position.set(-54.6, plazaY - 0.03, -11.5);
  westCompoundWalk.receiveShadow = true;
  const eastCompoundWalk = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.07, 50.0), flagstoneMat);
  eastCompoundWalk.position.set(36.2, plazaY - 0.03, -9.5);
  eastCompoundWalk.receiveShadow = true;
  group.add(chowkFloor, westSouthChowkFloor, northCompoundWalk, westCompoundWalk, eastCompoundWalk);

  // Ceremonial Makrana Marble Approach Carpet Runner (South Gate -> Front Steps) & East Gate Link
  const mainCarpet = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.024, 35.6), passageStoneMat);
  mainCarpet.position.set(0, plazaY + 0.006, 39.8);
  mainCarpet.receiveShadow = true;
  group.add(mainCarpet);
  for (const side of [-1, 1]) {
    const terraBorder = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.028, 35.6), terracottaTrimMat);
    terraBorder.position.set(side * 2.74, plazaY + 0.008, 39.8);
    const tealBorder = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.028, 35.6), tealTrimMat);
    tealBorder.position.set(side * 2.98, plazaY + 0.008, 39.8);
    group.add(terraBorder, tealBorder);
  }
  const eastWalkway = new THREE.Mesh(new THREE.BoxGeometry(35.2, 0.022, 3.6), passageStoneMat);
  eastWalkway.position.set(20.6, plazaY + 0.004, 36.5);
  eastWalkway.receiveShadow = true;
  group.add(eastWalkway);
  for (const bz of [34.55, 38.45]) {
    const eWalkBorder = new THREE.Mesh(new THREE.BoxGeometry(34.8, 0.025, 0.22), terracottaTrimMat);
    eWalkBorder.position.set(20.6, plazaY + 0.006, bz);
    group.add(eWalkBorder);
  }

  // Pierced Mughal-Arch Sandstone Chowk & Compound Perimeter Balustrade (Closed around Ganga Sagar + Vivah Mandap!)
  const chowkBalArchGeo = createCuspedArchSpandrelGeo(1.75, 0.56, 1.18, 0.42, 0.16);
  const addChowkBalustradeSegment = (
    x1: number,
    z1: number,
    x2: number,
    z2: number,
    withPierFinials = true,
  ) => {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.hypot(dx, dz);
    if (len < 0.5) return;
    const rotY = Math.atan2(dx, dz) - Math.PI / 2;
    const midX = (x1 + x2) * 0.5;
    const midZ = (z1 + z2) * 0.5;

    const curb = new THREE.Mesh(new THREE.BoxGeometry(len, 0.20, 0.54), plinthStoneMat);
    curb.position.set(midX, plazaY + 0.08, midZ);
    curb.rotation.y = rotY;
    curb.receiveShadow = true;
    const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.11, 0.36), terracottaTrimMat);
    rail.position.set(midX, plazaY + 0.75, midZ);
    rail.rotation.y = rotY;
    group.add(curb, rail);

    const bays = Math.max(1, Math.floor(len / 1.75));
    const step = len / bays;
    const dirX = dx / len;
    const dirZ = dz / len;
    for (let i = 0; i < bays; i++) {
      const bx = x1 + dirX * ((i + 0.5) * step);
      const bz = z1 + dirZ * ((i + 0.5) * step);
      const arch = new THREE.Mesh(chowkBalArchGeo, jharokhaStoneMat);
      arch.scale.set(step / 1.75, 1, 1);
      arch.position.set(bx, plazaY + 0.14, bz);
      arch.rotation.y = rotY;
      arch.castShadow = true;
      group.add(arch);
    }
    if (withPierFinials) {
      const interval = Math.max(1, Math.round(bays / Math.max(2, Math.round(len / 7.5))));
      for (let i = 0; i <= bays; i += interval) {
        const px = x1 + dirX * (i * step);
        const pz = z1 + dirZ * (i * step);
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.88, 0.36), plinthStoneMat);
        post.position.set(px, plazaY + 0.44, pz);
        post.castShadow = true;
        const finial = new THREE.Mesh(getDetailedParterreFinialGeo(), tealTrimMat);
        finial.scale.setScalar(0.9);
        finial.position.set(px, plazaY + 0.88, pz);
        group.add(post, finial);
      }
    }
  };

  // Closed 4-Sided Compound Boundary (Ganga Sagar + Vivah Mandap sit cleanly INSIDE!)
  // South Balustrade (left & right of South Torana Gate piers at ±3.7)
  addChowkBalustradeSegment(-56.5, 57.5, -3.7, 57.5);
  addChowkBalustradeSegment(3.7, 57.5, 38.1, 57.5);
  // West Balustrade (full unbroken run outside Ganga Sagar & Vivah Mandap!)
  addChowkBalustradeSegment(-56.5, -34.5, -56.5, 57.5);
  // North Balustrade (full unbroken run behind North Garuda Stambha & Chautaras!)
  addChowkBalustradeSegment(-56.5, -34.5, 38.1, -34.5);
  // East Balustrade (full run from North to South, split cleanly around East Torana Gate at z = 36.5 ± 3.7)
  addChowkBalustradeSegment(38.1, -34.5, 38.1, 32.8);
  addChowkBalustradeSegment(38.1, 40.2, 38.1, 57.5);

  // Ornamental Octagonal Corner Burj Turrets & North Axis Shrine Pier closing all 4 boundary corners cleanly
  const cornerBurjDomeGeo = createOnionDomeGeometry(0.56, 1.05);
  for (const [bx, bz] of [
    [-56.5, 57.5],
    [38.1, 57.5],
    [38.1, -34.5],
    [-56.5, -34.5],
    [0, -34.5],
  ] as Array<[number, number]>) {
    const burj = new THREE.Group();
    burj.position.set(bx, plazaY, bz);
    const bBase = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.44, 1.36), plinthStoneMat);
    bBase.position.y = 0.22;
    bBase.castShadow = true;
    const bShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.62, 1.75, 8), marbleWallMat);
    bShaft.position.y = 1.31;
    bShaft.castShadow = true;
    const bTeal = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.64, 0.14, 8), tealTrimMat);
    bTeal.position.y = 2.22;
    const bEave = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.78, 0.16, 8), terracottaTrimMat);
    bEave.position.y = 2.34;
    const bDome = new THREE.Mesh(cornerBurjDomeGeo, domeMat);
    bDome.position.y = 2.42;
    const bSpire = createDetailedGajurSpire(goldMat, bronzeMat, 0.56, 0.48);
    bSpire.position.y = 3.45;
    burj.add(bBase, bShaft, bTeal, bEave, bDome, bSpire);
    markOccluder(burj);
    group.add(burj);
  }

  const southThreshold = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.04, 1.2), passageStoneMat);
  southThreshold.position.set(0, plazaY + 0.002, 57.5);
  southThreshold.receiveShadow = true;
  group.add(southThreshold);

  const eastThreshold = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 5.6), passageStoneMat);
  eastThreshold.position.set(38.1, plazaY + 0.002, 36.5);
  eastThreshold.receiveShadow = true;
  group.add(eastThreshold);

  // Sculpted South & East Outer Chowk Torana Gateways (open ceremonial portals with hanging brass bells!)
  const toranaMiniDomeGeo = createOnionDomeGeometry(0.42, 0.84);
  const toranaCrownDomeGeo = createOnionDomeGeometry(0.72, 1.38);
  const addChowkToranaGate = (gx: number, gz: number, rotY: number) => {
    const gate = new THREE.Group();
    gate.position.set(gx, plazaY, gz);
    gate.rotation.y = rotY;
    markOccluder(gate);

    for (const side of [-1, 1]) {
      const px = side * 3.1;
      const pBase = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.42, 1.22), plinthStoneMat);
      pBase.position.set(px, 0.21, 0);
      pBase.castShadow = true;
      const pShaft = new THREE.Mesh(new THREE.BoxGeometry(0.96, 3.35, 1.0), marbleWallMat);
      pShaft.position.set(px, 2.08, 0);
      pShaft.castShadow = true;
      const pTeal = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.14, 1.12), tealTrimMat);
      pTeal.position.set(px, 3.82, 0);
      const pCap = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.16, 1.28), terracottaTrimMat);
      pCap.position.set(px, 3.96, 0);
      const turretDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.72, 8), marbleWallMat);
      turretDrum.position.set(px, 4.40, 0);
      const turretDome = new THREE.Mesh(toranaMiniDomeGeo, domeMat);
      turretDome.position.set(px, 4.76, 0);
      const turretSpire = createDetailedGajurSpire(goldMat, bronzeMat, 0.46, 0.40);
      turretSpire.position.set(px, 5.58, 0);

      const diyaShelf = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.32), terracottaTrimMat);
      diyaShelf.position.set(px - side * 0.56, 1.62, 0);
      const diya = createDetailedBrassSukundaDiyo(goldMat, bronzeMat, diyoGlowMat, 0.78, true);
      diya.position.set(px - side * 0.56, 1.66, 0);
      diya.rotation.y = side === -1 ? Math.PI / 2 : -Math.PI / 2;

      gate.add(pBase, pShaft, pTeal, pCap, turretDrum, turretDome, turretSpire, diyaShelf, diya);
    }

    const archSpan = new THREE.Mesh(
      createCuspedArchSpandrelGeo(6.4, 2.15, 4.95, 1.62, 0.76),
      whiteTrimMat,
    );
    archSpan.position.set(0, 3.05, 0);
    archSpan.castShadow = true;
    const plaqueF = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 0.56), toranaMat);
    plaqueF.position.set(0, 4.86, 0.40);
    const plaqueB = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 0.56), toranaMat);
    plaqueB.position.set(0, 4.86, -0.40);
    plaqueB.rotation.y = Math.PI;
    const lintelTeal = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.22, 1.02), tealTrimMat);
    lintelTeal.position.set(0, 5.26, 0);
    const lintelEave = new THREE.Mesh(new THREE.BoxGeometry(7.1, 0.16, 1.46), terracottaTrimMat);
    lintelEave.position.set(0, 5.10, 0);

    const crownDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.74, 0.80, 0.72, 8), marbleWallMat);
    crownDrum.position.set(0, 5.72, 0);
    const crownDome = new THREE.Mesh(toranaCrownDomeGeo, domeMat);
    crownDome.position.set(0, 6.08, 0);
    crownDome.castShadow = true;
    const crownSpire = createDetailedGajurSpire(goldMat, bronzeMat, 0.72, 0.58);
    crownSpire.position.set(0, 7.42, 0);

    const toranaBell = registerBell(createDetailedTempleBell(goldMat, bronzeMat, 0.48, 0.96));
    toranaBell.position.set(0, 4.64, 0);

    gate.add(
      archSpan,
      plaqueF,
      plaqueB,
      lintelTeal,
      lintelEave,
      crownDrum,
      crownDome,
      crownSpire,
      toranaBell,
    );
    group.add(gate);
  };

  addChowkToranaGate(0, 57.5, 0);
  addChowkToranaGate(38.1, 36.5, Math.PI / 2);

  // Twin Monumental Deepastambha Brass Lamp Pillars flanking the Janaki Approach (±7.2, 28.5)
  for (const side of [-1, 1]) {
    const deepaTower = createChowkMonumentalDeepastambha(
      plinthStoneMat,
      marbleWallMat,
      tealTrimMat,
      goldMat,
      bronzeMat,
      diyoGlowMat,
    );
    deepaTower.position.set(side * 7.2, plazaY, 28.5);
    markOccluder(deepaTower);
    group.add(deepaTower);
  }

  // Carved Stone Hiti Lotus Fountain Basin (-14.5, 34.0)
  const hiti = createChowkHitiFountain(
    marbleWallMat,
    plinthStoneMat,
    tealTrimMat,
    goldMat,
    bronzeMat,
    hitiWaterMat,
  );
  hiti.position.set(-14.5, plazaY, 34.0);
  markOccluder(hiti);
  group.add(hiti);

  // Three Sacred Brick-and-Marble Peepal Chautara Platforms
  for (const [cx, cz, seed] of [
    [-24.5, 44.5, 101],
    [24.5, 44.5, 202],
    [-26.5, 25.0, 303],
  ] as Array<[number, number, number]>) {
    const chautara = createChowkChautaraTree({
      brickMat: brickPlazaMat,
      marbleMat: whiteTrimMat,
      tealMat: tealTrimMat,
      barkMat: darkWoodMat,
      soilMat: chautaraSoilMat,
      foliageMat: chautaraFoliageMat,
      goldMat,
      bronzeMat,
      flameMat: diyoGlowMat,
      seed,
    });
    chautara.position.set(cx, plazaY, cz);
    chautara.userData.noMerge = true;
    markOccluder(chautara);
    group.add(chautara);
  }

  // Four Traditional Wooden & Khaprail-Tiled Mithila Puja Offering Stalls
  for (const [sx, sz, rotY] of [
    [-28.0, 33.5, Math.PI / 2],
    [-17.5, 48.0, Math.PI],
    [24.5, 26.5, -Math.PI / 2],
    [17.5, 48.0, Math.PI],
  ] as Array<[number, number, number]>) {
    const stall = createChowkPujaStall({
      plinthStoneMat,
      woodMat: darkWoodMat,
      terracottaMat: terracottaTrimMat,
      tealMat: tealTrimMat,
      crimsonMat: crimsonClothMat,
      goldMat,
      bronzeMat,
      marigoldMat,
      flameMat: diyoGlowMat,
    });
    stall.position.set(sx, plazaY, sz);
    stall.rotation.y = rotY;
    markOccluder(stall);
    group.add(stall);
  }

  // Flanking Carved Sandstone Promenade Rest Benches (±5.6, 39.5)
  for (const side of [-1, 1]) {
    const bench = createChowkStoneBench(plinthStoneMat, whiteTrimMat, tealTrimMat);
    bench.position.set(side * 5.6, plazaY, 39.5);
    bench.rotation.y = side === -1 ? 0 : Math.PI;
    group.add(bench);
  }

  // Symmetrical Ceremonial Chowk Cast-Bronze & Glazed Brass Lamp Posts flanking entrances & walkways
  const lampPositions: Array<[number, number]> = [
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
  ];
  for (const [lx, lz] of lampPositions) {
    const chowkLamp = createDetailedChowkLanternPost(
      plinthStoneMat,
      darkWoodMat,
      goldMat,
      tealTrimMat,
      diyoGlowMat,
    );
    chowkLamp.position.set(lx, plazaY, lz);
    group.add(chowkLamp);
  }

  // =========================================================================
  // 2. MONUMENTAL STEPPED PALACE PLINTH, COURTYARD FLOOR & GUARDIAN LIONS
  // =========================================================================
  const mainPlinth = new THREE.Mesh(new THREE.BoxGeometry(50.2, 0.84, 40.8), plinthStoneMat);
  mainPlinth.position.set(0, -0.44, -1.7);
  mainPlinth.receiveShadow = true;
  mainPlinth.castShadow = true;
  markOccluder(mainPlinth);
  group.add(mainPlinth);

  // Outer perimeter teal cornice moldings (4 discrete beams outside plinth so ZERO bleed on courtyard floor!)
  for (const [fx, fz, fw, fd] of [
    [0, 18.75, 50.4, 0.14],
    [0, -22.15, 50.4, 0.14],
    [-25.15, -1.7, 0.14, 40.9],
    [25.15, -1.7, 0.14, 40.9],
  ] as Array<[number, number, number, number]>) {
    // Leave clean opening in center south edge for the ceremonial staircase
    if (fz > 18) {
      for (const sx of [-15.2, 15.2]) {
        const halfBeam = new THREE.Mesh(new THREE.BoxGeometry(20.0, 0.14, 0.16), tealTrimMat);
        halfBeam.position.set(sx, -0.09, fz);
        group.add(halfBeam);
      }
    } else {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(fw, 0.14, fd), tealTrimMat);
      beam.position.set(fx, -0.09, fz);
      group.add(beam);
    }
  }

  // High-Res Weather-Worn Nepali Ashtakona Geometric Stone Tile Courtyard Floor + Flush Carved Lotus Medallion
  const courtyardMandalaFloor = new THREE.Mesh(
    new THREE.BoxGeometry(29.8, 0.04, 25.4),
    courtyardMandalaMat,
  );
  courtyardMandalaFloor.position.set(0, 0.005, -1.3);
  courtyardMandalaFloor.receiveShadow = true;
  group.add(courtyardMandalaFloor);

  const courtyardCenterMedallion = new THREE.Mesh(
    new THREE.PlaneGeometry(11.2, 11.2),
    courtyardMedallionMat,
  );
  courtyardCenterMedallion.rotation.x = -Math.PI / 2;
  courtyardCenterMedallion.position.set(0, 0.027, -1.3);
  courtyardCenterMedallion.receiveShadow = true;
  group.add(courtyardCenterMedallion);

  // Raised Carved Flagstone Parikrama Veranda Decks & Border Curbs around Courtyard Perimeter
  // Curb sits cleanly inside x = ±14.04 & z = -13.04 so colonnade pillar bases (±14.4, -13.4) sit proud on veranda!
  for (const side of [-1, 1]) {
    const sideDeck = new THREE.Mesh(new THREE.BoxGeometry(2.56, 0.04, 26.2), flagstoneMat);
    sideDeck.position.set(side * 15.32, 0.016, -1.8);
    sideDeck.receiveShadow = true;
    const sideCurb = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 25.4), tealTrimMat);
    sideCurb.position.set(side * 14.04, 0.026, -1.8);
    group.add(sideDeck, sideCurb);
  }
  const northDeck = new THREE.Mesh(new THREE.BoxGeometry(28.08, 0.04, 2.36), flagstoneMat);
  northDeck.position.set(0, 0.016, -14.22);
  northDeck.receiveShadow = true;
  const northCurb = new THREE.Mesh(new THREE.BoxGeometry(28.08, 0.06, 0.14), tealTrimMat);
  northCurb.position.set(0, 0.026, -13.04);
  group.add(northDeck, northCurb);

  // Clean Marble Threshold Passage Floor running seamlessly through Simha Dwar to Stair Top
  const passageFloor = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.05, 8.2), passageStoneMat);
  passageFloor.position.set(0, 0.008, 15.1);
  passageFloor.receiveShadow = true;
  group.add(passageFloor);

  // Front Ceremonial Staircase (10.6m wide, z = 18.6 to 22.0, 7 crisp stone risers)
  const stairWidth = 10.6;
  for (let s = 0; s < 7; s++) {
    const t = s / 6;
    const stepH = (1 - t * 0.82) * 0.82;
    const stepZ = 18.68 + s * 0.48;
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(stairWidth, stepH, 0.54),
      s === 0 ? passageStoneMat : plinthStoneMat,
    );
    step.position.set(0, -0.8 + stepH * 0.5, stepZ);
    step.receiveShadow = true;
    step.castShadow = true;
    group.add(step);
  }

  // Stairway cheek walls + Sculpted 3D Guardian Singha Lions (z = 22.92 -> pedestal clears cheek wall cleanly!)
  for (const side of [-1, 1]) {
    const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.94, 3.65), marbleWallMat);
    cheek.position.set(side * 5.65, -0.34, 20.3);
    cheek.castShadow = true;
    markOccluder(cheek);
    group.add(cheek);

    const lion = createDetailedGuardianLion(
      goldMat,
      bronzeMat,
      darkStoneMat,
      plinthStoneMat,
      tealTrimMat,
    );
    lion.position.set(side * 5.8, -0.80, 22.92);
    markOccluder(lion);
    group.add(lion);
  }

  // =========================================================================
  // INSTANCED ARCHITECTURAL TRIM HELPERS (Brackets, Kumbhas, 4-Part Carved Pillars)
  // =========================================================================
  const bracketMatrices: THREE.Matrix4[] = [];
  const kumbhaBaseMatrices: THREE.Matrix4[] = [];
  const kumbhaDomeMatrices: THREE.Matrix4[] = [];
  const pillarBaseMatrices: THREE.Matrix4[] = [];
  const pillarNeckMatrices: THREE.Matrix4[] = [];
  const pillarShaftMatrices: THREE.Matrix4[] = [];
  const pillarCapMatrices: THREE.Matrix4[] = [];
  const pillarAbacusMatrices: THREE.Matrix4[] = [];

  const pushBracket = (x: number, y: number, z: number, rotY = 0) => {
    _v3.set(x, y, z);
    _q.setFromEuler(_e.set(0, rotY, 0));
    _s.set(1, 1, 1);
    _m4.compose(_v3, _q, _s);
    bracketMatrices.push(_m4.clone());
  };

  const pushKumbha = (x: number, y: number, z: number, scale = 1) => {
    _v3.set(x, y + 0.34 * scale, z);
    _q.identity();
    _s.set(scale, scale, scale);
    _m4.compose(_v3, _q, _s);
    kumbhaBaseMatrices.push(_m4.clone());

    _v3.set(x, y + 0.68 * scale, z);
    _m4.compose(_v3, _q, _s);
    kumbhaDomeMatrices.push(_m4.clone());
  };

  const pushPillar = (x: number, baseY: number, z: number, totalH = 3.1, scaleR = 1) => {
    const baseH = 0.24 * Math.min(1.1, scaleR);
    const neckH = 0.14 * Math.min(1.1, scaleR);
    const capH = 0.24 * Math.min(1.1, scaleR);
    const abacusH = 0.12 * Math.min(1.1, scaleR);
    const shaftH = Math.max(0.4, totalH - baseH - neckH - capH - abacusH);

    // 1. Chamfered stone plinth base
    _v3.set(x, baseY + baseH * 0.5, z);
    _q.setFromEuler(_e.set(0, Math.PI / 4, 0));
    _s.set(scaleR, baseH / 0.24, scaleR);
    _m4.compose(_v3, _q, _s);
    pillarBaseMatrices.push(_m4.clone());

    // 2. Turned lotus base collar
    _q.identity();
    _v3.set(x, baseY + baseH + neckH * 0.5, z);
    _s.set(scaleR, neckH / 0.14, scaleR);
    _m4.compose(_v3, _q, _s);
    pillarNeckMatrices.push(_m4.clone());

    // 3. Fluted carved limestone shaft
    _v3.set(x, baseY + baseH + neckH + shaftH * 0.5, z);
    _s.set(scaleR, shaftH, scaleR);
    _m4.compose(_v3, _q, _s);
    pillarShaftMatrices.push(_m4.clone());

    // 4. Flared ghata-pallava capital
    _v3.set(x, baseY + baseH + neckH + shaftH + capH * 0.5, z);
    _s.set(scaleR, capH / 0.24, scaleR);
    _m4.compose(_v3, _q, _s);
    pillarCapMatrices.push(_m4.clone());

    // 5. Square turquoise abacus impost
    _v3.set(x, baseY + totalH - abacusH * 0.5, z);
    _s.set(scaleR, abacusH / 0.12, scaleR);
    _m4.compose(_v3, _q, _s);
    pillarAbacusMatrices.push(_m4.clone());
  };

  // Cached cusped arch generator + reusable ornate recessed Window & Portal Frame builders
  const archGeoCache = new Map<string, THREE.BufferGeometry>();
  const getArchGeo = (w: number, h: number, aw: number, ah: number, d: number) => {
    const key = `${w.toFixed(2)}_${h.toFixed(2)}_${aw.toFixed(2)}_${ah.toFixed(2)}_${d.toFixed(2)}`;
    let g = archGeoCache.get(key);
    if (!g) {
      g = createCuspedArchSpandrelGeo(w, h, aw, ah, d);
      archGeoCache.set(key, g);
    }
    return g;
  };

  const addArchedWindow = (
    parent: THREE.Object3D,
    x: number,
    yBottom: number,
    z: number,
    rotY: number,
    w: number,
    h: number,
    paneMat: THREE.Material,
    frameMat: THREE.Material = whiteTrimMat,
    hoodMat: THREE.Material = terracottaTrimMat,
    sillMat: THREE.Material = tealTrimMat,
  ) => {
    const win = new THREE.Group();
    win.position.set(x, yBottom, z);
    win.rotation.y = rotY;

    const pane = new THREE.Mesh(new THREE.BoxGeometry(w * 0.78, h * 0.86, 0.05), paneMat);
    pane.position.set(0, h * 0.45, 0.045);

    const spandrel = new THREE.Mesh(
      getArchGeo(w, h, w * 0.72, h * 0.80, 0.12),
      frameMat,
    );
    spandrel.position.set(0, 0, 0.12);
    spandrel.castShadow = true;

    const jambW = Math.max(0.11, w * 0.11);
    for (const side of [-1, 1]) {
      const jamb = new THREE.Mesh(
        new THREE.BoxGeometry(jambW, h * 0.94, 0.18),
        sillMat,
      );
      jamb.position.set(side * (w * 0.46), h * 0.47, 0.13);
      win.add(jamb);
    }

    const sill = new THREE.Mesh(new THREE.BoxGeometry(w * 1.14, 0.10, 0.26), sillMat);
    sill.position.set(0, -0.03, 0.15);

    const hood = new THREE.Mesh(new THREE.BoxGeometry(w * 1.22, 0.08, 0.32), hoodMat);
    hood.position.set(0, h + 0.03, 0.20);
    hood.rotation.x = 0.24;
    hood.castShadow = true;

    const crest = new THREE.Mesh(new THREE.BoxGeometry(w * 0.86, 0.09, 0.10), sillMat);
    crest.position.set(0, h + 0.11, 0.11);

    win.add(pane, spandrel, sill, hood, crest);
    parent.add(win);
  };

  const addArchedDoor = (
    parent: THREE.Object3D,
    x: number,
    yBottom: number,
    z: number,
    rotY: number,
    w: number,
    h: number,
    doorLeafMat: THREE.Material = carvedDoorMat,
    frameMat: THREE.Material = whiteTrimMat,
  ) => {
    const portal = new THREE.Group();
    portal.position.set(x, yBottom, z);
    portal.rotation.y = rotY;

    // Door panel height stays strictly below the arch spring line (springY = h * 0.84 * 0.54 = h * 0.4536),
    // with a dark recessed arched tympanum behind the cusped spandrel so zero wood corners pierce marble!
    const archH = h * 0.84;
    const archW = w * 0.74;
    const transomY = archH * 0.56;

    const recess = new THREE.Mesh(new THREE.BoxGeometry(archW * 0.96, archH * 0.92, 0.045), darkRecessMat);
    recess.position.set(0, archH * 0.46, 0.026);

    const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(archW * 0.94, transomY, 0.05), doorLeafMat);
    doorPanel.position.set(0, transomY * 0.5, 0.068);

    const transomBeam = new THREE.Mesh(new THREE.BoxGeometry(archW * 1.02, 0.09, 0.14), terracottaTrimMat);
    transomBeam.position.set(0, transomY + 0.045, 0.115);

    const spandrel = new THREE.Mesh(
      getArchGeo(w, h, archW, archH, 0.13),
      frameMat,
    );
    spandrel.position.set(0, 0, 0.175);
    spandrel.castShadow = true;

    const jambW = Math.max(0.11, (w - archW) * 0.52);
    for (const side of [-1, 1]) {
      const jamb = new THREE.Mesh(new THREE.BoxGeometry(jambW, h * 0.95, 0.16), frameMat);
      jamb.position.set(side * (w * 0.5 - jambW * 0.5), h * 0.475, 0.165);
      portal.add(jamb);
    }

    const lintel = new THREE.Mesh(new THREE.BoxGeometry(w * 1.16, 0.10, 0.28), terracottaTrimMat);
    lintel.position.set(0, h + 0.02, 0.18);
    lintel.rotation.x = 0.2;

    const threshold = new THREE.Mesh(new THREE.BoxGeometry(w * 1.08, 0.08, 0.28), passageStoneMat);
    threshold.position.set(0, 0.04, 0.14);

    portal.add(recess, doorPanel, transomBeam, spandrel, lintel, threshold);
    parent.add(portal);
  };

  // =========================================================================
  // 3. SIX 4-STORY OCTAGONAL PAVILION BASTION TOWERS (True Open Chhatri Lanterns)
  // =========================================================================
  const towerPositions: Array<{ x: number; z: number; scale: number }> = [
    { x: -23.4, z: 15.2, scale: 1.04 },
    { x: -13.6, z: 15.2, scale: 1.0 },
    { x: 13.6, z: 15.2, scale: 1.0 },
    { x: 23.4, z: 15.2, scale: 1.04 },
    { x: -23.4, z: -19.0, scale: 0.96 },
    { x: 23.4, z: -19.0, scale: 0.96 },
  ];

  const mainOnionDomeGeo = createOnionDomeGeometry(1.46, 2.75);
  const towerArchGeo = createCuspedArchSpandrelGeo(1.08, 2.35, 0.72, 1.85, 0.16);
  const chhatriSpandrelGeo = createCuspedArchSpandrelGeo(1.12, 0.68, 0.78, 0.48, 0.14);

  for (const tw of towerPositions) {
    const tower = new THREE.Group();
    tower.position.set(tw.x, 0, tw.z);
    tower.scale.setScalar(tw.scale);
    markOccluder(tower);

    // Core bastion shaft
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.88, 10.6, 8), marbleWallMat);
    shaft.position.y = 5.3;
    shaft.rotation.y = Math.PI / 8;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    tower.add(shaft);

    // Mithila horizontal cornice rings (strictly proud of 1.88m radius to avoid Z-fighting)
    for (const [fy, rad, col] of [
      [0.24, 1.98, tealTrimMat],
      [4.78, 1.96, tealTrimMat],
      [5.12, 2.02, terracottaTrimMat],
      [9.68, 1.96, tealTrimMat],
      [10.02, 2.04, terracottaTrimMat],
    ] as Array<[number, number, THREE.Material]>) {
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, 0.22, 8), col);
      ring.position.y = fy;
      ring.rotation.y = Math.PI / 8;
      tower.add(ring);
    }

    // 8 Faces: Cusped 3D Arched Niches framing teakwood shutters (1F) & stained glass / jali (2F)
    for (let f = 0; f < 8; f++) {
      const a = (f / 8) * Math.PI * 2;
      const sinA = Math.sin(a);
      const cosA = Math.cos(a);

      // Ground story arched recess + carved shutter door + framed cusped spandrel + stone sill
      const gBack = new THREE.Mesh(
        new THREE.BoxGeometry(0.76, 1.95, 0.08),
        f % 2 === 0 ? carvedDoorMat : darkRecessMat,
      );
      gBack.position.set(sinA * 1.66, 2.35, cosA * 1.66);
      gBack.rotation.y = a;
      const gArch = new THREE.Mesh(towerArchGeo, whiteTrimMat);
      gArch.position.set(sinA * 1.76, 1.35, cosA * 1.76);
      gArch.rotation.y = a;
      const gSill = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.09, 0.22), tealTrimMat);
      gSill.position.set(sinA * 1.80, 1.32, cosA * 1.80);
      gSill.rotation.y = a;

      // Second story arched alcove with stained glass / saffron jali + sill + terracotta dripstone
      const uBack = new THREE.Mesh(
        new THREE.BoxGeometry(0.78, 2.1, 0.08),
        f % 2 === 0 ? jaliMat : stainedGlassMat,
      );
      uBack.position.set(sinA * 1.66, 7.25, cosA * 1.66);
      uBack.rotation.y = a;
      const uArch = new THREE.Mesh(towerArchGeo, whiteTrimMat);
      uArch.position.set(sinA * 1.76, 6.2, cosA * 1.76);
      uArch.rotation.y = a;
      const uSill = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.09, 0.22), tealTrimMat);
      uSill.position.set(sinA * 1.80, 6.17, cosA * 1.80);
      uSill.rotation.y = a;
      const uHood = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.08, 0.26), terracottaTrimMat);
      uHood.position.set(sinA * 1.82, 8.58, cosA * 1.82);
      uHood.rotation.y = a;

      // Open Chhatri upper cusped arch span linking each pair of octagonal columns
      const cArch = new THREE.Mesh(chhatriSpandrelGeo, whiteTrimMat);
      cArch.position.set(sinA * 1.35, 12.75, cosA * 1.35);
      cArch.rotation.y = a;

      tower.add(gBack, gArch, gSill, uBack, uArch, uSill, uHood, cArch);
    }

    // Overhanging 1st Chhajja Eave Canopy (y = 10.65m)
    const chhajja1 = new THREE.Mesh(new THREE.CylinderGeometry(2.02, 2.84, 0.34, 8), terracottaTrimMat);
    chhajja1.position.y = 10.72;
    chhajja1.rotation.y = Math.PI / 8;
    chhajja1.castShadow = true;
    const chhajjaRim1 = new THREE.Mesh(new THREE.CylinderGeometry(2.86, 2.86, 0.1, 8), tealTrimMat);
    chhajjaRim1.position.y = 10.56;
    chhajjaRim1.rotation.y = Math.PI / 8;
    tower.add(chhajja1, chhajjaRim1);

    // 3rd Story TRUE OPEN Octagonal Chhatri Lantern (see-through sculpted colonnade around central shrine pillar!)
    const chhatriPlinth = new THREE.Mesh(new THREE.CylinderGeometry(1.48, 1.56, 0.34, 8), marbleWallMat);
    chhatriPlinth.position.y = 11.02;
    chhatriPlinth.rotation.y = Math.PI / 8;
    const innerAltarPed = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.42, 0.78, 20), whiteTrimMat);
    innerAltarPed.position.y = 11.55;
    const innerKalash = createDetailedBrassSukundaDiyo(goldMat, bronzeMat, diyoGlowMat, 1.35, true);
    innerKalash.position.y = 11.94;
    tower.add(chhatriPlinth, innerAltarPed, innerKalash);

    for (let c = 0; c < 8; c++) {
      const a = (c / 8) * Math.PI * 2 + Math.PI / 8;
      pushPillar(
        tw.x + Math.sin(a) * 1.44 * tw.scale,
        11.18 * tw.scale,
        tw.z + Math.cos(a) * 1.44 * tw.scale,
        2.25 * tw.scale,
        0.72 * tw.scale,
      );
    }

    // Upper Double Chhajja Eaves + Octagonal Drum
    const chhajja2 = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 2.42, 0.32, 8), terracottaTrimMat);
    chhajja2.position.y = 13.56;
    chhajja2.rotation.y = Math.PI / 8;
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(1.38, 1.46, 0.92, 8), marbleWallMat);
    drum.position.y = 14.12;
    drum.rotation.y = Math.PI / 8;
    const chhajja3 = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.88, 0.24, 8), tealTrimMat);
    chhajja3.position.y = 14.56;
    chhajja3.rotation.y = Math.PI / 8;
    tower.add(chhajja2, drum, chhajja3);

    // Ribbed Lotus Onion Dome + Inverted Lotus Cap + Sculpted Brass Gajur Kalash Spire
    const onionDome = new THREE.Mesh(mainOnionDomeGeo, domeMat);
    onionDome.position.y = 14.64;
    onionDome.castShadow = true;
    const lotusCap = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.14, 0.36, 24), tealTrimMat);
    lotusCap.position.y = 17.42;
    const kalashSpire = createDetailedGajurSpire(goldMat, bronzeMat, 1.32, 0.9);
    kalashSpire.position.y = 17.60;
    tower.add(onionDome, lotusCap, kalashSpire);

    group.add(tower);
  }

  // =========================================================================
  // 4. LEFT & RIGHT OUTER JALI WING PAVILIONS (x = ±18.46, Exact Tower Clearance!)
  // =========================================================================
  const wingArchGeo = createCuspedArchSpandrelGeo(1.38, 3.85, 0.98, 3.15, 0.42);
  const wingUpperArchGeo = createCuspedArchSpandrelGeo(1.38, 3.95, 0.98, 3.2, 0.42);

  for (const side of [-1, 1]) {
    const cx = side * 18.46;
    const pavilion = new THREE.Group();
    pavilion.position.set(cx, 0, 14.4);
    markOccluder(pavilion);

    // Recessed main masonry core behind the colonnade face (5.52m width clears towers ±15.64 & ±21.28)
    const block = new THREE.Mesh(new THREE.BoxGeometry(5.52, 9.6, 5.2), marbleWallMat);
    block.position.set(0, 4.8, -0.2);
    block.castShadow = true;
    block.receiveShadow = true;
    pavilion.add(block);

    // Distinct proud cornice bands (capped within 5.64m width so ZERO intersection with corner towers!)
    for (const [by, bz, bw, bd, col] of [
      [0.24, 0.08, 5.58, 5.75, tealTrimMat],
      [4.55, 0.14, 5.60, 5.9, tealTrimMat],
      [4.88, 0.18, 5.64, 6.02, terracottaTrimMat],
      [9.42, 0.16, 5.60, 5.95, tealTrimMat],
      [9.72, 0.22, 5.66, 6.15, terracottaTrimMat],
    ] as Array<[number, number, number, number, THREE.Material]>) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.24, bd), col);
      band.position.set(0, by, bz);
      pavilion.add(band);
    }

    // 4 Real 3D Cusped Arch Bays with Deep Recessed Carved Teak Doors (1F) & Saffron Jali (2F)
    for (let b = 0; b < 4; b++) {
      const bx = -2.07 + b * 1.38;
      // Ground arch recess & carved teakwood chamber shutter
      const gBack = new THREE.Mesh(new THREE.BoxGeometry(1.10, 3.3, 0.22), darkRecessMat);
      gBack.position.set(bx, 1.95, 2.38);
      const gDoor = new THREE.Mesh(new THREE.BoxGeometry(0.90, 2.85, 0.18), carvedDoorMat);
      gDoor.position.set(bx, 1.7, 2.48);
      const gSpandrel = new THREE.Mesh(wingArchGeo, marbleWallMat);
      gSpandrel.position.set(bx, 0.32, 2.75);
      gSpandrel.castShadow = true;

      // Second floor saffron jali screen framed behind real cusped Mughal arch + molded sill
      const uBack = new THREE.Mesh(new THREE.BoxGeometry(1.10, 3.4, 0.22), jaliMat);
      uBack.position.set(bx, 6.95, 2.42);
      const uSpandrel = new THREE.Mesh(wingUpperArchGeo, marbleWallMat);
      uSpandrel.position.set(bx, 5.08, 2.75);
      uSpandrel.castShadow = true;
      const uSill = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.12, 0.34), tealTrimMat);
      uSill.position.set(bx, 5.08, 2.82);

      // Mithila arch spandrel crest trim
      const crest = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.14, 0.12), tealTrimMat);
      crest.position.set(bx, 9.15, 2.94);

      pavilion.add(gBack, gDoor, gSpandrel, uBack, uSpandrel, uSill, crest);
    }

    // Engaged vertical bay pilasters framing the outer wing colonnade
    for (let p = 0; p < 5; p++) {
      const px = -2.76 + p * 1.38;
      const pilaster = new THREE.Mesh(new THREE.BoxGeometry(0.18, 9.1, 0.24), whiteTrimMat);
      pilaster.position.set(px, 4.75, 2.92);
      pavilion.add(pilaster);
    }

    // Overhanging terracotta eave + parapet masonry coping wall + 6 parapet kumbha cupolas & brackets
    const eave = new THREE.Mesh(new THREE.BoxGeometry(5.68, 0.2, 6.32), terracottaTrimMat);
    eave.position.set(0, 9.9, 0.24);
    const parapet = new THREE.Mesh(new THREE.BoxGeometry(5.60, 0.38, 0.36), marbleWallMat);
    parapet.position.set(0, 10.12, 2.85);
    pavilion.add(eave, parapet);

    for (let k = 0; k < 6; k++) {
      pushKumbha(cx - 2.25 + k * 0.90, 10.30, 17.25, 0.86);
      pushBracket(cx - 2.25 + k * 0.90, 9.65, 17.42, 0);
    }

    group.add(pavilion);
  }

  // =========================================================================
  // 5. CONNECTING 2-STORY ARCADE GALLERIES (x = ±9.02, Exact Tower Clearance!)
  // =========================================================================
  const galleryArchSpandrel = createCuspedArchSpandrelGeo(1.26, 3.85, 0.90, 3.12, 0.45);

  for (const side of [-1, 1]) {
    const gx = side * 9.02;
    const gallery = new THREE.Group();
    gallery.position.set(gx, 0, 14.3);
    markOccluder(gallery);

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(5.04, 8.2, 3.9), marbleWallMat);
    backWall.position.set(0, 4.1, -0.35);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    gallery.add(backWall);

    // Distinct proud cornices (capped cleanly inside 5.12m between tower & Simha Dwar)
    for (const [by, bz, col] of [
      [4.2, 0.12, tealTrimMat],
      [4.48, 0.18, terracottaTrimMat],
      [8.02, 0.16, tealTrimMat],
      [8.3, 0.22, terracottaTrimMat],
    ] as Array<[number, number, THREE.Material]>) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(5.12, 0.22, 4.9), col);
      band.position.set(0, by, bz);
      gallery.add(band);
    }

    // 4 Open Arched Veranda Bays (1F carved wood / recess, 2F stained glass windows + sills)
    for (let b = 0; b < 4; b++) {
      const bx = -1.89 + b * 1.26;
      const gBack = new THREE.Mesh(new THREE.BoxGeometry(1.00, 3.6, 0.2), darkRecessMat);
      gBack.position.set(bx, 1.9, 1.9);
      const gDoor = new THREE.Mesh(new THREE.BoxGeometry(0.82, 2.7, 0.16), carvedDoorMat);
      gDoor.position.set(bx, 1.5, 2.02);
      const gSpandrel = new THREE.Mesh(galleryArchSpandrel, marbleWallMat);
      gSpandrel.position.set(bx, 0.15, 2.38);
      gSpandrel.castShadow = true;

      const uBack = new THREE.Mesh(new THREE.BoxGeometry(0.98, 3.1, 0.2), stainedGlassMat);
      uBack.position.set(bx, 6.2, 1.92);
      const uSpandrel = new THREE.Mesh(galleryArchSpandrel, marbleWallMat);
      uSpandrel.scale.set(0.98, 0.86, 0.9);
      uSpandrel.position.set(bx, 4.65, 2.38);
      const uSill = new THREE.Mesh(new THREE.BoxGeometry(1.10, 0.1, 0.28), tealTrimMat);
      uSill.position.set(bx, 4.65, 2.48);
      gallery.add(gBack, gDoor, gSpandrel, uBack, uSpandrel, uSill);
    }

    const gParapet = new THREE.Mesh(new THREE.BoxGeometry(5.10, 0.34, 0.34), marbleWallMat);
    gParapet.position.set(0, 8.56, 2.45);
    gallery.add(gParapet);

    for (let k = 0; k < 5; k++) {
      pushKumbha(gx - 1.80 + k * 0.90, 8.72, 16.75, 0.74);
      pushBracket(gx - 1.80 + k * 0.90, 8.14, 16.92, 0);
    }

    group.add(gallery);
  }

  // =========================================================================
  // 6. CENTRAL 3-STORY SIMHA DWAR GATEWAY MAHAL (Mithila Murals + Brass Bells!)
  // =========================================================================
  const gateway = new THREE.Group();
  gateway.position.set(0, 0, 14.8);
  markOccluder(gateway);

  for (const side of [-1, 1]) {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(4.2, 5.65, 6.8), marbleWallMat);
    pier.position.set(side * 4.2, 2.825, 0);
    pier.castShadow = true;
    pier.receiveShadow = true;
    gateway.add(pier);

    // Ornate carved teakwood temple doors swung open cleanly beneath vault spring line (2.62m) with framed jambs
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.66, 2.04), whiteTrimMat);
    doorFrame.position.set(side * 2.04, 1.33, 1.45);
    const doorLintel = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 2.16), terracottaTrimMat);
    doorLintel.position.set(side * 2.02, 2.62, 1.45);
    const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.10, 2.52, 1.84), carvedDoorMat);
    doorLeaf.position.set(side * 1.98, 1.26, 1.45);
    // Brass stud bands & ring knockers proud on the swung-open wooden gate leaves
    for (const dy of [0.65, 1.32, 1.98]) {
      const studBar = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.075, 1.72), goldMat);
      studBar.position.set(side * 1.97, dy, 1.45);
      gateway.add(studBar);
    }
    gateway.add(doorFrame, doorLintel, doorLeaf);

    // Mithila Madhubani Heritage Mural Panels lining the INSIDE walls of Simha Dwar tunnel!
    const innerMural = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.45), muralMat);
    innerMural.position.set(side * 2.06, 2.55, -1.35);
    innerMural.rotation.y = side === -1 ? Math.PI / 2 : -Math.PI / 2;
    gateway.add(innerMural);

    // Sculpted brass Sukunda diya sconce inside Simha Dwar tunnel
    const nicheShelf = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.36), terracottaTrimMat);
    nicheShelf.position.set(side * 1.98, 2.02, 0.1);
    const nicheDiyo = createDetailedBrassSukundaDiyo(goldMat, bronzeMat, diyoGlowMat, 0.88, true);
    nicheDiyo.position.set(side * 1.96, 2.06, 0.1);
    nicheDiyo.rotation.y = side === -1 ? Math.PI / 2 : -Math.PI / 2;
    gateway.add(nicheShelf, nicheDiyo);

    // Twin front recessed cusped-arch jali niches flanking Simha Dwar outer portal
    for (const nx of [side * 3.16, side * 5.14]) {
      addArchedWindow(gateway, nx, 0.65, 3.4, 0, 1.28, 3.55, jaliMat, whiteTrimMat, terracottaTrimMat, tealTrimMat);
    }

    // Engaged corner pilasters framing Simha Dwar front piers
    for (const px of [side * 2.18, side * 6.18]) {
      const pShaft = new THREE.Mesh(new THREE.BoxGeometry(0.28, 5.5, 0.24), whiteTrimMat);
      pShaft.position.set(px, 2.78, 3.44);
      gateway.add(pShaft);
    }
  }

  // Vaulted Gateway Passage Arch + Coffered Tunnel Ceiling Ribs + Hanging Temple Bell
  const portalArchBridge = new THREE.Mesh(
    createCuspedArchSpandrelGeo(4.4, 5.75, 4.0, 4.85, 6.8),
    marbleWallMat,
  );
  portalArchBridge.position.set(0, 0, 0);
  portalArchBridge.castShadow = true;
  gateway.add(portalArchBridge);

  for (const rz of [-2.4, 0, 2.4]) {
    const cofferRib = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.16, 0.35), terracottaTrimMat);
    cofferRib.position.set(0, 4.92, rz);
    gateway.add(cofferRib);
  }

  const gateBell = registerBell(createDetailedTempleBell(goldMat, bronzeMat, 0.72, 1.35));
  gateBell.position.set(0, 4.88, 2.15);
  gateway.add(gateBell);

  // Ornate painted Mithila Torana plaque directly above outer Simha Dwar arch
  const toranaLintel = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.76), toranaMat);
  toranaLintel.position.set(0, 5.26, 3.46);
  gateway.add(toranaLintel);

  // Prominent Cantilevered Terracotta-Sandstone Jharokha Balcony with Pierced Cusped-Arch Stone Balustrade
  const jharokhaDeck = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.36, 1.78), jharokhaStoneMat);
  jharokhaDeck.position.set(0, 5.72, 4.15);
  jharokhaDeck.castShadow = true;
  jharokhaDeck.receiveShadow = true;
  const jharokhaBottomCurb = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.14, 0.22), jharokhaStoneMat);
  jharokhaBottomCurb.position.set(0, 5.96, 4.94);
  const jharokhaTopMold = new THREE.Mesh(new THREE.BoxGeometry(10.75, 0.16, 0.28), terracottaTrimMat);
  jharokhaTopMold.position.set(0, 6.84, 4.94);
  gateway.add(jharokhaDeck, jharokhaBottomCurb, jharokhaTopMold);

  const balustradeArchGeo = getArchGeo(0.88, 0.78, 0.56, 0.58, 0.16);
  for (let b = 0; b < 11; b++) {
    const bx = -4.4 + b * 0.88;
    const balArch = new THREE.Mesh(balustradeArchGeo, jharokhaStoneMat);
    balArch.position.set(bx, 6.02, 4.94);
    balArch.castShadow = true;
    gateway.add(balArch);
    // Carved newel posts + miniature urns at ends and center
    if (b === 0 || b === 5 || b === 10) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.92, 0.24), terracottaTrimMat);
      post.position.set(bx + (b === 10 ? 0.44 : b === 0 ? -0.44 : 0), 6.4, 4.94);
      const urn = new THREE.Mesh(getDetailedParterreFinialGeo(), tealTrimMat);
      urn.scale.setScalar(1.05);
      urn.position.set(post.position.x, 6.91, 4.94);
      gateway.add(post, urn);
    }
  }

  for (const side of [-1, 1]) {
    const sideTop = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 1.68), terracottaTrimMat);
    sideTop.position.set(side * 5.2, 6.84, 4.15);
    gateway.add(sideTop);
    for (const wz of [3.75, 4.55]) {
      const sBal = new THREE.Mesh(balustradeArchGeo, jharokhaStoneMat);
      sBal.rotation.y = side * (Math.PI / 2);
      sBal.position.set(side * 5.2, 6.02, wz);
      gateway.add(sBal);
    }
  }
  for (let b = 0; b < 13; b++) {
    pushBracket(-4.8 + b * 0.8, 5.38, 18.92, 0);
  }

  // 2nd Floor Central Royal Mahal Pavilion (y = 5.7..10.6m) with 5 Open Veranda Arches + Side Bays
  const hall2Floor = new THREE.Mesh(new THREE.BoxGeometry(12.6, 4.9, 5.4), marbleWallMat);
  hall2Floor.position.set(0, 8.2, -0.4);
  hall2Floor.castShadow = true;
  hall2Floor.receiveShadow = true;
  gateway.add(hall2Floor);

  const royalArchGeo = createCuspedArchSpandrelGeo(1.75, 4.2, 1.28, 3.35, 0.45);
  for (let a = 0; a < 5; a++) {
    const ax = -3.6 + a * 1.8;
    const archWall = new THREE.Mesh(royalArchGeo, marbleWallMat);
    archWall.position.set(ax, 5.8, 3.05);
    archWall.castShadow = true;
    // Recessed lit 2nd-story veranda gallery back-wall + carved teak chamber doors + stained clerestory
    const galleryBack = new THREE.Mesh(new THREE.BoxGeometry(1.58, 3.8, 0.14), passageStoneMat);
    galleryBack.position.set(ax, 7.65, 2.38);
    const galleryDoor = new THREE.Mesh(new THREE.BoxGeometry(1.02, 2.25, 0.10), carvedDoorMat);
    galleryDoor.position.set(ax, 6.95, 2.46);
    const jaliInsert = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.95, 0.10), a % 2 === 0 ? jaliMat : stainedGlassMat);
    jaliInsert.position.set(ax, 8.92, 2.48);
    gateway.add(archWall, galleryBack, galleryDoor, jaliInsert);
    if (a % 2 === 1) {
      const sconceDiyo = createDetailedBrassSukundaDiyo(goldMat, bronzeMat, diyoGlowMat, 0.74, true);
      sconceDiyo.position.set(ax, 7.72, 2.62);
      gateway.add(sconceDiyo);
    }
  }
  // 2nd floor east/west flanking side arched windows so 360° views stay rich
  for (const side of [-1, 1]) {
    for (const sz of [-1.45, 0.7]) {
      addArchedWindow(
        gateway,
        side * 6.3,
        6.45,
        sz,
        side * (Math.PI / 2),
        1.5,
        2.9,
        stainedGlassMat,
        whiteTrimMat,
      );
    }
  }
  const hall2Cornice = new THREE.Mesh(new THREE.BoxGeometry(13.2, 0.28, 6.7), tealTrimMat);
  hall2Cornice.position.set(0, 10.7, 0.05);
  const hall2Eave = new THREE.Mesh(new THREE.BoxGeometry(13.6, 0.2, 7.1), terracottaTrimMat);
  hall2Eave.position.set(0, 10.48, 0.05);
  gateway.add(hall2Cornice, hall2Eave);

  // 3rd Floor Royal Crown Pavilion (y = 10.8..15.0m) with Ornate Cusped-Arch Colored Glass Clerestory Bays
  const crown3 = new THREE.Mesh(new THREE.BoxGeometry(10.6, 4.1, 5.2), marbleWallMat);
  crown3.position.set(0, 12.85, -0.3);
  crown3.castShadow = true;
  gateway.add(crown3);

  for (let w = 0; w < 5; w++) {
    const wx = -3.4 + w * 1.7;
    addArchedWindow(
      gateway,
      wx,
      11.45,
      2.3,
      0,
      1.36,
      2.85,
      w % 2 === 0 ? jaliMat : stainedGlassMat,
      whiteTrimMat,
    );
  }
  // 3rd floor East/West/North side arched clerestory windows
  for (const side of [-1, 1]) {
    for (const sz of [-1.4, 0.8]) {
      addArchedWindow(
        gateway,
        side * 5.3,
        11.45,
        sz,
        side * (Math.PI / 2),
        1.45,
        2.8,
        stainedGlassMat,
        whiteTrimMat,
      );
    }
  }
  for (let nw = -1; nw <= 1; nw++) {
    addArchedWindow(
      gateway,
      nw * 2.6,
      11.45,
      -2.9,
      Math.PI,
      1.45,
      2.8,
      nw === 0 ? jaliMat : stainedGlassMat,
      whiteTrimMat,
    );
  }

  const crownRoofSlab = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.34, 6.0), tealTrimMat);
  crownRoofSlab.position.set(0, 15.0, -0.3);
  const crownEave = new THREE.Mesh(new THREE.BoxGeometry(11.8, 0.18, 6.4), terracottaTrimMat);
  crownEave.position.set(0, 14.8, -0.3);
  gateway.add(crownRoofSlab, crownEave);

  for (const kx of [-4.6, -3.6, -2.6, 2.6, 3.6, 4.6]) {
    pushKumbha(kx, 15.14, 17.2, 0.92);
  }

  // Corner Crown Chhatri Turrets atop 3rd Floor Mahal
  const smallDomeGeo = createOnionDomeGeometry(0.92, 1.85);
  for (const cx of [-4.7, 4.7]) {
    const drumC = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.95, 1.35, 8), marbleWallMat);
    drumC.position.set(cx, 15.8, 1.85);
    const roofC = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 1.25, 0.22, 8), tealTrimMat);
    roofC.position.set(cx, 16.5, 1.85);
    const dMesh = new THREE.Mesh(smallDomeGeo, domeMat);
    dMesh.position.set(cx, 16.57, 1.85);
    const tip = createDetailedGajurSpire(goldMat, bronzeMat, 0.92, 0.82);
    tip.position.set(cx, 18.38, 1.85);
    gateway.add(drumC, roofC, dMesh, tip);
  }

  // Grand Central Lotus Onion Dome & Ornate Gajur Spire (peaking at localY = 22.1m)
  const centralDrum = new THREE.Mesh(new THREE.CylinderGeometry(2.65, 2.85, 1.45, 24), marbleWallMat);
  centralDrum.position.set(0, 15.8, -0.2);
  centralDrum.castShadow = true;
  const centralNeck = new THREE.Mesh(new THREE.CylinderGeometry(2.78, 2.78, 0.26, 24), tealTrimMat);
  centralNeck.position.set(0, 16.5, -0.2);
  const centralDome = new THREE.Mesh(createOnionDomeGeometry(2.75, 3.85), domeMat);
  centralDome.position.set(0, 16.6, -0.2);
  centralDome.castShadow = true;
  const centralCap = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.22, 0.45, 24), tealTrimMat);
  centralCap.position.set(0, 20.43, -0.2);
  const centralKalash = createDetailedGajurSpire(goldMat, bronzeMat, 1.75, 1.18);
  centralKalash.position.set(0, 20.64, -0.2);
  gateway.add(centralDrum, centralNeck, centralDome, centralCap, centralKalash);

  // Two Double-Triangle Crimson National Flags of Nepal on Central Mahal Roof
  const flagMat = new THREE.MeshStandardMaterial({
    map: jTex.nepalFlagMap,
    transparent: true,
    alphaTest: 0.2,
    roughness: 0.72,
    side: THREE.DoubleSide,
  });
  for (const [idx, fx] of ([-2.9, 2.9] as const).entries()) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 3.2, 8), goldMat);
    pole.position.set(fx, 16.65, 2.0);
    const pivot = new THREE.Group();
    pivot.position.set(fx, 17.5, 2.0);
    pivot.rotation.y = idx === 0 ? 0.18 : 0.24;
    const flagMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 1.45), flagMat);
    flagMesh.position.set(0.68, 0, 0);
    pivot.add(flagMesh);
    gateway.add(pole, pivot);
  }

  group.add(gateway);

  // =========================================================================
  // 7. QUADRANGULAR COURTYARD WINGS + TRUE 3D PARIKRAMA COLONNADE ARCADE
  //    + 360° ARTICULATED EXTERIOR WEST, EAST & NORTH PALACE FACADES
  // =========================================================================
  // Arches sit cleanly ABOVE pillar imposts (y = 2.85 -> 4.33) with ZERO jamb/pillar overlap!
  const innerVerandaArchGeo = createCuspedArchSpandrelGeo(3.4, 1.48, 2.72, 1.12, 0.36);

  const addFramedCourtyardMural = (x: number, y: number, z: number, rotY: number) => {
    const mGroup = new THREE.Group();
    mGroup.position.set(x, y, z);
    mGroup.rotation.y = rotY;
    const outerFrame = new THREE.Mesh(new THREE.BoxGeometry(2.68, 2.04, 0.08), tealTrimMat);
    const innerMolding = new THREE.Mesh(new THREE.BoxGeometry(2.54, 1.90, 0.10), whiteTrimMat);
    const canvas = new THREE.Mesh(new THREE.PlaneGeometry(2.38, 1.74), muralMat);
    canvas.position.z = 0.055;
    mGroup.add(outerFrame, innerMolding, canvas);
    group.add(mGroup);
  };

  // West & East Courtyard Wings (x = ±14.4 colonnade face, inner wall ±16.6, exterior wall ±24.2)
  for (const side of [-1, 1]) {
    const wx = side * 20.4;
    const outerWing = new THREE.Mesh(new THREE.BoxGeometry(7.6, 8.8, 28.2), marbleWallMat);
    outerWing.position.set(wx, 4.4, -0.9);
    outerWing.castShadow = true;
    outerWing.receiveShadow = true;
    markOccluder(outerWing);

    // Proud cornice moldings (strictly outside ±24.25m & inside ±16.55m, z = -15.0..+13.2 clear of corner towers)
    const wingTealMid = new THREE.Mesh(new THREE.BoxGeometry(7.78, 0.22, 28.4), tealTrimMat);
    wingTealMid.position.set(wx, 4.35, -0.9);
    const wingTopRoof = new THREE.Mesh(new THREE.BoxGeometry(7.92, 0.28, 28.6), terracottaTrimMat);
    wingTopRoof.position.set(wx, 8.78, -0.9);
    // Rooftop masonry parapet coping walls under inner & outer Kumbha urns
    const innerParapet = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 26.8), marbleWallMat);
    innerParapet.position.set(side * 16.6, 9.08, -1.6);
    const outerParapet = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 26.8), marbleWallMat);
    outerParapet.position.set(side * 23.85, 9.08, -1.6);
    markOccluder(wingTealMid);
    markOccluder(wingTopRoof);
    group.add(outerWing, wingTealMid, wingTopRoof, innerParapet, outerParapet);

    // Covered Parikrama Veranda Overhang Eave & 2nd-Story Upper Balcony (y = 4.46 clears 4.33 arch top!)
    const verandaCanopy = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.26, 26.0), terracottaTrimMat);
    verandaCanopy.position.set(side * 15.5, 4.46, -1.8);
    verandaCanopy.castShadow = true;
    const verandaTeal = new THREE.Mesh(new THREE.BoxGeometry(2.66, 0.14, 26.1), tealTrimMat);
    verandaTeal.position.set(side * 15.5, 4.66, -1.8);
    markOccluder(verandaCanopy);
    markOccluder(verandaTeal);
    group.add(verandaCanopy, verandaTeal);

    const innerRotY = side === -1 ? Math.PI / 2 : -Math.PI / 2;
    const outerRotY = side === -1 ? -Math.PI / 2 : Math.PI / 2;

    // 7 Arched Veranda Bays along West & East inner courtyard walls (bay b=3 replaced cleanly by Dalan Gate!)
    for (let b = 0; b < 7; b++) {
      const bz = -11.9 + b * 3.4;
      if (b !== 3) {
        const arch = new THREE.Mesh(innerVerandaArchGeo, marbleWallMat);
        arch.rotation.y = innerRotY;
        arch.position.set(side * 14.4, 2.85, bz);
        arch.castShadow = true;
        markOccluder(arch);
        group.add(arch);
      }

      pushPillar(side * 14.4, 0, bz - 1.7, 2.85, 0.94);
      if (b === 6) pushPillar(side * 14.4, 0, bz + 1.7, 2.85, 0.94);

      // Recessed inner wall details: Alternating Carved Cusped-Arch Doors & Framed Mithila Murals!
      if (b % 2 === 0) {
        addArchedDoor(group, side * 16.58, 0, bz, innerRotY, 1.85, 3.15);
      } else {
        addFramedCourtyardMural(side * 16.56, 2.05, bz, innerRotY);
        if (b !== 3) {
          const bell = registerBell(createDetailedTempleBell(goldMat, bronzeMat, 0.42, 0.88));
          bell.position.set(side * 14.4, 3.96, bz);
          group.add(bell);
        }
      }

      // Upper 2nd Story Colored Stained-Glass / Jali Recessed Cusped Arch Windows
      addArchedWindow(
        group,
        side * 16.58,
        5.05,
        bz,
        innerRotY,
        1.95,
        2.85,
        b % 2 === 0 ? stainedGlassMat : jaliMat,
        whiteTrimMat,
      );

      pushKumbha(side * 16.6, 9.28, bz, 0.85);
    }

    // Exterior West & East Palace Facades (x = ±24.2, 7 articulated bays clear of corner towers)
    for (let b = 0; b < 7; b++) {
      const bzExt = -12.0 + b * 3.7;
      if (b % 2 === 0) {
        addArchedDoor(group, side * 24.22, 0.32, bzExt, outerRotY, 2.05, 3.45);
      } else {
        addArchedWindow(
          group,
          side * 24.22,
          0.35,
          bzExt,
          outerRotY,
          2.05,
          3.4,
          darkRecessMat,
          whiteTrimMat,
        );
      }
      addArchedWindow(
        group,
        side * 24.22,
        5.05,
        bzExt,
        outerRotY,
        2.05,
        2.95,
        b % 2 === 0 ? jaliMat : stainedGlassMat,
        whiteTrimMat,
      );
      pushKumbha(side * 23.85, 9.28, bzExt, 0.85);
      pushBracket(side * 24.32, 8.58, bzExt, outerRotY);
    }

    // Vertical fluted wall pilasters dividing every exterior West/East bay
    for (let p = 0; p < 8; p++) {
      const pz = -13.85 + p * 3.7;
      const extPil = new THREE.Mesh(new THREE.BoxGeometry(0.24, 8.5, 0.34), whiteTrimMat);
      extPil.position.set(side * 24.28, 4.45, pz);
      extPil.castShadow = true;
      markOccluder(extPil);
      const extPilCap = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.2, 0.42), tealTrimMat);
      extPilCap.position.set(side * 24.28, 8.55, pz);
      group.add(extPil, extPilCap);
    }
  }

  // North Rear Sanctum Wing closing the quadrangle (43.2m connects cleanly into ±21.6 tower edges & outerWing)
  const northWing = new THREE.Mesh(new THREE.BoxGeometry(43.2, 9.4, 6.4), marbleWallMat);
  northWing.position.set(0, 4.7, -18.2);
  northWing.castShadow = true;
  northWing.receiveShadow = true;
  markOccluder(northWing);
  const northTeal = new THREE.Mesh(new THREE.BoxGeometry(43.4, 0.24, 6.62), tealTrimMat);
  northTeal.position.set(0, 4.5, -18.2);
  const northTop = new THREE.Mesh(new THREE.BoxGeometry(43.6, 0.28, 6.82), terracottaTrimMat);
  northTop.position.set(0, 9.35, -18.2);
  const northParapetFront = new THREE.Mesh(new THREE.BoxGeometry(29.6, 0.40, 0.38), marbleWallMat);
  northParapetFront.position.set(0, 9.66, -15.1);
  const northParapetBack = new THREE.Mesh(new THREE.BoxGeometry(41.8, 0.40, 0.38), marbleWallMat);
  northParapetBack.position.set(0, 9.66, -21.05);
  const northVerandaCanopy = new THREE.Mesh(new THREE.BoxGeometry(28.8, 0.26, 2.4), terracottaTrimMat);
  northVerandaCanopy.position.set(0, 4.46, -14.2);
  const northVerandaTeal = new THREE.Mesh(new THREE.BoxGeometry(28.8, 0.14, 2.46), tealTrimMat);
  northVerandaTeal.position.set(0, 4.66, -14.2);
  markOccluder(northTeal);
  markOccluder(northTop);
  markOccluder(northVerandaCanopy);
  group.add(
    northWing,
    northTeal,
    northTop,
    northParapetFront,
    northParapetBack,
    northVerandaCanopy,
    northVerandaTeal,
  );

  // Align North 8 bays (8 * 3.6m = 28.8m) cleanly at z = -13.6 so corner pillars (±14.4, -13.6) match West/East colonnades 1:1 (zero double pillars!)
  const northVerandaArchGeo = createCuspedArchSpandrelGeo(3.6, 1.48, 2.92, 1.12, 0.36);
  for (let b = 0; b < 8; b++) {
    const bx = -12.6 + b * 3.6;
    const nArch = new THREE.Mesh(northVerandaArchGeo, marbleWallMat);
    nArch.position.set(bx, 2.85, -13.6);
    nArch.castShadow = true;
    markOccluder(nArch);
    group.add(nArch);

    // Skip b = 0 left pillar (-14.4, -13.6) and b = 7 right pillar (+14.4, -13.6) already built by West/East colonnades
    if (b > 0) {
      pushPillar(bx - 1.8, 0, -13.6, 2.85, 0.94);
    }

    if (b % 2 === 0) {
      addFramedCourtyardMural(bx, 2.05, -14.96, 0);
    } else {
      addArchedDoor(group, bx, 0, -14.98, 0, 1.85, 3.15);
      const bell = registerBell(createDetailedTempleBell(goldMat, bronzeMat, 0.42, 0.88));
      bell.position.set(bx, 3.96, -13.6);
      group.add(bell);
    }

    addArchedWindow(
      group,
      bx,
      5.2,
      -14.98,
      0,
      1.95,
      2.85,
      b % 2 === 0 ? stainedGlassMat : jaliMat,
      whiteTrimMat,
    );
    pushKumbha(bx, 9.86, -15.1, 0.88);
  }

  // North Rear Exterior Facade (z = -21.4, 9 articulated bays clear of NW/NE bastion towers)
  for (let b = 0; b < 9; b++) {
    const bxExt = -16.0 + b * 4.0;
    if (b === 4) {
      addArchedDoor(group, bxExt, 0.32, -21.42, Math.PI, 2.4, 3.7);
    } else if (b % 2 === 0) {
      addArchedDoor(group, bxExt, 0.32, -21.42, Math.PI, 2.0, 3.45);
    } else {
      addArchedWindow(group, bxExt, 0.35, -21.42, Math.PI, 2.0, 3.4, darkRecessMat, whiteTrimMat);
    }
    addArchedWindow(
      group,
      bxExt,
      5.25,
      -21.42,
      Math.PI,
      2.05,
      3.0,
      b % 2 === 0 ? jaliMat : stainedGlassMat,
      whiteTrimMat,
    );
    pushKumbha(bxExt, 9.86, -21.05, 0.88);
    pushBracket(bxExt, 9.15, -21.52, Math.PI);
  }
  for (let p = 0; p < 10; p++) {
    const px = -18.0 + p * 4.0;
    const rearPil = new THREE.Mesh(new THREE.BoxGeometry(0.34, 9.1, 0.24), whiteTrimMat);
    rearPil.position.set(px, 4.75, -21.48);
    rearPil.castShadow = true;
    markOccluder(rearPil);
    const rearPilCap = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.32), tealTrimMat);
    rearPilCap.position.set(px, 9.15, -21.48);
    group.add(rearPil, rearPilCap);
  }

  // Inner South Courtyard Cloister Bays flanking Simha Dwar (2 equal 4.1m bays connecting cleanly into ±14.4, 10.2!)
  const southVerandaArchGeo = createCuspedArchSpandrelGeo(4.1, 1.48, 3.36, 1.12, 0.36);
  for (const side of [-1, 1]) {
    // Continuous masonry backing wall & veranda canopy extending cleanly to join West/East colonnades
    const sBackWall = new THREE.Mesh(new THREE.BoxGeometry(10.4, 8.2, 0.46), marbleWallMat);
    sBackWall.position.set(side * 11.4, 4.1, 12.16);
    sBackWall.castShadow = true;
    sBackWall.receiveShadow = true;
    const sCanopy = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.26, 2.35), terracottaTrimMat);
    sCanopy.position.set(side * 10.9, 4.46, 11.15);
    const sCanopyTeal = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.14, 2.41), tealTrimMat);
    sCanopyTeal.position.set(side * 10.9, 4.66, 11.15);
    markOccluder(sBackWall);
    group.add(sBackWall, sCanopy, sCanopyTeal);

    // Push pillars at ±6.2 and ±10.3 along z = 10.2 (corner ±14.4, 10.2 is shared with West/East veranda!)
    pushPillar(side * 6.2, 0, 10.2, 2.85, 0.94);
    pushPillar(side * 10.3, 0, 10.2, 2.85, 0.94);

    for (let b = 0; b < 2; b++) {
      const bx = side * (8.25 + b * 4.1);
      const sArch = new THREE.Mesh(southVerandaArchGeo, marbleWallMat);
      sArch.position.set(bx, 2.85, 10.2);
      sArch.castShadow = true;
      markOccluder(sArch);
      group.add(sArch);

      // Ground level: carved door on inner bay, framed Mithila fresco mural on outer bay (zero clash!)
      if (b === 0) {
        addArchedDoor(group, bx, 0, 11.92, Math.PI, 1.85, 3.15);
      } else {
        addFramedCourtyardMural(bx, 2.05, 11.90, Math.PI);
        const sBell = registerBell(createDetailedTempleBell(goldMat, bronzeMat, 0.42, 0.88));
        sBell.position.set(bx, 3.96, 10.2);
        group.add(sBell);
      }
      // 2nd Story stained-glass / jali window above canopy
      addArchedWindow(
        group,
        bx,
        5.05,
        11.92,
        Math.PI,
        1.95,
        2.75,
        b === 0 ? stainedGlassMat : jaliMat,
        whiteTrimMat,
      );
    }
  }

  // =========================================================================
  // 8. GRAND 3-TIER INNER GARBHAGRIHA RAM-JANAKI SANCTUM (0, -6.0)
  // =========================================================================
  const shrine = new THREE.Group();
  shrine.position.set(0, 0, -6.0);
  markOccluder(shrine);

  // Raised Carved Jagati Plinth (8.8m × 7.6m × 0.72m) + Front Ceremonial Steps + Cheek Balustrades
  const sBase = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.72, 7.6), marbleWallMat);
  sBase.position.y = 0.36;
  sBase.castShadow = true;
  sBase.receiveShadow = true;
  const sTrim = new THREE.Mesh(new THREE.BoxGeometry(8.98, 0.14, 7.78), tealTrimMat);
  sTrim.position.y = 0.68;
  shrine.add(sBase, sTrim);

  for (let st = 0; st < 3; st++) {
    const stepM = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.22, 0.42), st % 2 === 0 ? passageStoneMat : plinthStoneMat);
    stepM.position.set(0, 0.11 + st * 0.22, 4.52 - st * 0.34);
    shrine.add(stepM);
  }
  for (const side of [-1, 1]) {
    const cheekBlock = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.68, 1.38), marbleWallMat);
    cheekBlock.position.set(side * 1.92, 0.34, 4.18);
    cheekBlock.castShadow = true;
    const cheekCap = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.09, 1.44), tealTrimMat);
    cheekCap.position.set(side * 1.92, 0.70, 4.18);
    const cheekFinial = new THREE.Mesh(getDetailedParterreFinialGeo(), goldMat);
    cheekFinial.scale.setScalar(0.55);
    cheekFinial.position.set(side * 1.92, 0.74, 4.78);
    shrine.add(cheekBlock, cheekCap, cheekFinial);
  }

  // Mukhamandapa Pillared Front Porch (0.72 -> 3.62, cleanly supporting cusped porch arches at y = 3.62!)
  for (const px of [-2.4, -0.95, 0.95, 2.4]) {
    pushPillar(px, 0.72, -6.0 + 3.35, 2.90, 0.92);
  }
  const porchCenterArch = getArchGeo(1.9, 1.05, 1.48, 0.78, 0.22);
  const porchSideArch = getArchGeo(1.45, 1.05, 1.06, 0.76, 0.22);
  const cPorchArch = new THREE.Mesh(porchCenterArch, whiteTrimMat);
  cPorchArch.position.set(0, 3.62, 3.35);
  cPorchArch.castShadow = true;
  shrine.add(cPorchArch);
  for (const side of [-1, 1]) {
    const fSideArch = new THREE.Mesh(porchSideArch, whiteTrimMat);
    fSideArch.position.set(side * 1.675, 3.62, 3.35);
    fSideArch.castShadow = true;
    const sideReturnArch = new THREE.Mesh(porchSideArch, whiteTrimMat);
    sideReturnArch.rotation.y = side * (Math.PI / 2);
    sideReturnArch.position.set(side * 2.4, 3.62, 2.62);
    // Engaged Marble Wall Pilasters receiving sideReturnArch cleanly at z = 1.88
    const porchReturnPilaster = new THREE.Mesh(new THREE.BoxGeometry(0.28, 3.9, 0.28), whiteTrimMat);
    porchReturnPilaster.position.set(side * 2.4, 2.67, 1.88);
    const porchReturnCap = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.16, 0.36), tealTrimMat);
    porchReturnCap.position.set(side * 2.4, 4.58, 1.88);
    shrine.add(fSideArch, sideReturnArch, porchReturnPilaster, porchReturnCap);
  }
  const porchBell = registerBell(createDetailedTempleBell(goldMat, bronzeMat, 0.56, 0.78));
  porchBell.position.set(0, 4.46, 3.30);
  shrine.add(porchBell);

  // High-Detail Baluster-Turned Nepali Brass Deepastambha + 5-Wick Pancharti Stands flanking Mukhamandapa
  for (const lx of [-3.35, 3.35]) {
    const deepa = createDetailedDeepastambha(goldMat, bronzeMat, diyoGlowMat, 0.98);
    deepa.position.set(lx, 0.72, 3.35);
    shrine.add(deepa);
  }
  for (const px of [-1.38, 1.38]) {
    const pancharti = createDetailedPanchartiStand(goldMat, bronzeMat, diyoGlowMat);
    pancharti.position.set(px, 0.72, 3.05);
    shrine.add(pancharti);
  }

  // Ceremonial Puja Thali + Spiral White Shankha on Garbhagriha Threshold
  const pujaThali = createPujaThaliWithShankha(
    goldMat,
    bronzeMat,
    marigoldMat,
    whiteTrimMat,
    diyoGlowMat,
  );
  pujaThali.position.set(0, 0.94, 2.52);
  shrine.add(pujaThali);

  // Woven Ceremonial Crimson & Gold Asana Prayer Carpet laid flush before steps at courtyard (-0.75)
  const asanaCarpet = createGarbhagrihaAsanaCarpet(crimsonClothMat, goldMat);
  asanaCarpet.position.set(0, 0.032, -0.75);
  group.add(asanaCarpet);

  // Standing Brass Floor Bell Frame beside Garbhagriha steps (-1.68, -2.85) — clickable & ringable!
  const floorBellStand = new THREE.Group();
  floorBellStand.position.set(-1.68, 0.025, -2.85);
  floorBellStand.userData.noMerge = true;
  const bellPlinth = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.42, 0.14, 16), plinthStoneMat);
  bellPlinth.position.y = 0.07;
  bellPlinth.castShadow = true;
  for (const bx of [-0.34, 0.34]) {
    const upright = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.044, 1.72, 12), bronzeMat);
    upright.position.set(bx, 0.96, 0);
    upright.castShadow = true;
    const tip = new THREE.Mesh(getDetailedParterreFinialGeo(), goldMat);
    tip.scale.setScalar(0.5);
    tip.position.set(bx, 1.86, 0);
    floorBellStand.add(upright, tip);
  }
  const crossYoke = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.08, 0.09), bronzeMat);
  crossYoke.position.set(0, 1.82, 0);
  const standBell = registerBell(createDetailedTempleBell(goldMat, bronzeMat, 0.38, 0.86));
  standBell.position.set(0, 1.78, 0);
  floorBellStand.add(bellPlinth, crossYoke, standBell);
  group.add(floorBellStand);

  // Main Sanctum Mandap Chamber (5.8m × 4.6m × 4.0m) with Corner Pilasters, Cusped Gold Torana & Ram-Janaki Shrine Altar
  const sanctumCore = new THREE.Mesh(new THREE.BoxGeometry(5.8, 4.0, 4.6), marbleWallMat);
  sanctumCore.position.set(0, 2.72, -0.4);
  sanctumCore.castShadow = true;
  for (const px of [-2.88, 2.88]) {
    for (const pz of [-2.68, 1.88]) {
      const sPil = new THREE.Mesh(new THREE.BoxGeometry(0.34, 4.0, 0.34), whiteTrimMat);
      sPil.position.set(px, 2.72, pz);
      const sPilCap = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.42), tealTrimMat);
      sPilCap.position.set(px, 4.58, pz);
      shrine.add(sPil, sPilCap);
    }
  }
  const sanctumFrieze = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 0.86), muralMat);
  sanctumFrieze.position.set(0, 4.2, 1.94);

  // Recessed Sanctum Altar Niche + Sculpted Golden Cusped Prabhavali Torana + Detailed Singhasan & Twin Sculpted Murtis
  const altarVoid = new THREE.Mesh(new THREE.BoxGeometry(2.45, 3.10, 0.42), darkRecessMat);
  altarVoid.position.set(0, 2.28, 1.72);
  const goldToranaArch = new THREE.Mesh(
    getArchGeo(2.96, 3.25, 2.08, 2.75, 0.16),
    goldMat,
  );
  goldToranaArch.position.set(0, 0.72, 2.00);
  const goldToranaHood = new THREE.Mesh(new THREE.BoxGeometry(3.22, 0.12, 0.28), goldMat);
  goldToranaHood.position.set(0, 3.98, 2.02);
  const altarInnerCloth = new THREE.Mesh(new THREE.BoxGeometry(2.12, 2.65, 0.08), crimsonClothMat);
  altarInnerCloth.position.set(0, 2.15, 1.88);

  // Sculpted Beaded Marigold & Jasmine Toran Garland + Hanging Side Flower Tassels
  const marigoldGarland = new THREE.Group();
  const flowerBeadGeo = new THREE.SphereGeometry(0.058, 10, 8);
  const jasmineBeadGeo = new THREE.SphereGeometry(0.036, 8, 6);
  for (let i = 0; i <= 26; i++) {
    const u = i / 26;
    const angle = u * Math.PI;
    const rad = 0.98 + Math.sin(u * Math.PI) * 0.08;
    const bead = new THREE.Mesh(i % 4 === 0 ? jasmineBeadGeo : flowerBeadGeo, i % 4 === 0 ? whiteTrimMat : marigoldMat);
    bead.position.set(Math.cos(angle) * rad, 2.90 + Math.sin(angle) * rad * 0.92, 2.05);
    marigoldGarland.add(bead);
  }
  for (const side of [-1, 1]) {
    for (let t = 1; t <= 4; t++) {
      const tasselBead = new THREE.Mesh(t === 4 ? jasmineBeadGeo : flowerBeadGeo, t === 4 ? whiteTrimMat : marigoldMat);
      tasselBead.position.set(side * 0.98, 2.90 - t * 0.11, 2.05);
      marigoldGarland.add(tasselBead);
    }
  }

  const sanctumAltarpiece = createDetailedSanctumAltarpiece({
    goldMat,
    bronzeMat,
    marbleMat: marbleWallMat,
    whiteTrimMat,
    crimsonClothMat,
    marigoldMat,
    flameMat: diyoGlowMat,
    altarHaloMap: jTex.altarHaloMap,
  });

  shrine.add(
    sanctumCore,
    sanctumFrieze,
    goldToranaArch,
    goldToranaHood,
    altarVoid,
    altarInnerCloth,
    marigoldGarland,
    sanctumAltarpiece,
  );

  // Sanctum Side & Rear Framed Cusped Stained-Glass / Jali Alcoves
  for (const side of [-1, 1]) {
    addArchedWindow(
      shrine,
      side * 2.9,
      1.35,
      -0.4,
      side * (Math.PI / 2),
      1.95,
      2.55,
      stainedGlassMat,
      whiteTrimMat,
    );
  }
  addArchedWindow(shrine, 0, 1.35, -2.7, Math.PI, 2.1, 2.55, jaliMat, whiteTrimMat);

  // Sanctum Overhanging Roof Cornice + 2nd Tier Pavilion + 4 Corner Chhatris + Central Onion Dome (11.4m tall)
  const sRoofSlab = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.32, 6.8), terracottaTrimMat);
  sRoofSlab.position.set(0, 4.82, 0.4);
  const sRoofTeal = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.18, 6.6), tealTrimMat);
  sRoofTeal.position.set(0, 5.04, 0.4);

  const sTier2 = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2.0, 4.0), marbleWallMat);
  sTier2.position.set(0, 6.1, -0.2);
  sTier2.castShadow = true;
  // 2nd Tier Cardinal Cusped Jali & Stained-Glass Clerestory Windows + Corner Pilasters
  addArchedWindow(shrine, 0, 5.25, 1.8, 0, 1.65, 1.6, jaliMat, whiteTrimMat);
  addArchedWindow(shrine, 0, 5.25, -2.2, Math.PI, 1.65, 1.6, jaliMat, whiteTrimMat);
  addArchedWindow(shrine, -2.2, 5.25, -0.2, -Math.PI / 2, 1.65, 1.6, stainedGlassMat, whiteTrimMat);
  addArchedWindow(shrine, 2.2, 5.25, -0.2, Math.PI / 2, 1.65, 1.6, stainedGlassMat, whiteTrimMat);
  for (const px of [-2.18, 2.18]) {
    for (const pz of [-2.18, 1.78]) {
      const t2Pil = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.98, 0.24), whiteTrimMat);
      t2Pil.position.set(px, 6.1, pz);
      shrine.add(t2Pil);
    }
  }

  const sTier2Cornice = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.24, 4.4), tealTrimMat);
  sTier2Cornice.position.set(0, 7.18, -0.2);
  const sDome = new THREE.Mesh(createOnionDomeGeometry(1.75, 2.85), domeMat);
  sDome.position.set(0, 7.3, -0.2);
  sDome.castShadow = true;
  const sLotusCap = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.16, 0.36, 24), tealTrimMat);
  sLotusCap.position.set(0, 10.22, -0.2);
  const sKalash = createDetailedGajurSpire(goldMat, bronzeMat, 1.32, 0.96);
  sKalash.position.set(0, 10.38, -0.2);
  shrine.add(sRoofSlab, sRoofTeal, sTier2, sTier2Cornice, sDome, sLotusCap, sKalash);

  // 4 Sanctum Corner Open 4-Pillar Mini Chhatri Pavilions
  const miniChhatriDome = createOnionDomeGeometry(0.58, 1.15);
  const miniChhatriArchGeo = getArchGeo(0.86, 0.36, 0.62, 0.26, 0.08);
  const miniPostPts = [
    new THREE.Vector2(0.055, 0),
    new THREE.Vector2(0.06, 0.08),
    new THREE.Vector2(0.04, 0.14),
    new THREE.Vector2(0.038, 0.64),
    new THREE.Vector2(0.056, 0.72),
    new THREE.Vector2(0.058, 0.78),
  ];
  const miniPostGeo = new THREE.LatheGeometry(miniPostPts, 14);
  for (const cx of [-2.45, 2.45]) {
    for (const cz of [-2.15, 2.25]) {
      const cPlinth = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.14, 1.06), marbleWallMat);
      cPlinth.position.set(cx, 5.19, cz);
      const cCenterDiyo = new THREE.Mesh(getDetailedParterreFinialGeo(), goldMat);
      cCenterDiyo.scale.setScalar(0.55);
      cCenterDiyo.position.set(cx, 5.26, cz);
      shrine.add(cPlinth, cCenterDiyo);

      for (const pxOff of [-0.38, 0.38]) {
        for (const pzOff of [-0.38, 0.38]) {
          const post = new THREE.Mesh(miniPostGeo, whiteTrimMat);
          post.position.set(cx + pxOff, 5.26, cz + pzOff);
          post.castShadow = true;
          shrine.add(post);
        }
      }
      for (const [ax, az, aRot] of [
        [0, 0.38, 0],
        [0, -0.38, Math.PI],
        [-0.38, 0, -Math.PI / 2],
        [0.38, 0, Math.PI / 2],
      ] as Array<[number, number, number]>) {
        const mArch = new THREE.Mesh(miniChhatriArchGeo, whiteTrimMat);
        mArch.position.set(cx + ax, 5.68, cz + az);
        mArch.rotation.y = aRot;
        shrine.add(mArch);
      }

      const cEave = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.80, 0.16, 16), terracottaTrimMat);
      cEave.position.set(cx, 6.08, cz);
      const cTealRim = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.54, 0.08, 16), tealTrimMat);
      cTealRim.position.set(cx, 6.18, cz);
      const cDome = new THREE.Mesh(miniChhatriDome, domeMat);
      cDome.position.set(cx, 6.22, cz);
      cDome.castShadow = true;
      const cSpire = createDetailedGajurSpire(goldMat, bronzeMat, 0.62, 0.52);
      cSpire.position.set(cx, 7.34, cz);
      shrine.add(cEave, cTealRim, cDome, cSpire);
    }
  }
  group.add(shrine);

  // =========================================================================
  // 9. PHOTOREALISTIC COURTYARD BOTANICAL GARDENS (Sacred Tulsi Vrindavan, Charbagh Parterres & Lotus Urns)
  // =========================================================================
  createJanakiCourtyardGarden({
    group,
    textures: jTex,
    woodTextures: textures,
    marbleWallMat,
    whiteTrimMat,
    tealTrimMat,
    terracottaTrimMat,
    goldMat,
    bronzeMat,
    diyoGlowMat,
    markOccluder,
  });

  // =========================================================================
  // 9d. NON-PROCEDURAL GLTF TRADITIONAL NEPALI BRASS LANTERNS (STANDING PANASA & HANGING AKASHDEEP)
  // =========================================================================
  createJanakiCourtyardLanterns({
    group,
    textures: jTex,
    plinthStoneMat,
    goldMat,
    beaconLights,
    animatedNodes,
    onAssetLoaded,
  });

  // =========================================================================
  // 9e. AMBIENT SCULPTED COURTYARD DOVES & ROCK PIGEONS
  // =========================================================================
  createJanakiCourtyardBirds({
    group,
    animatedNodes,
  });

  // =========================================================================
  // 9b. SPINNING BRASS MANI PRAYER-WHEEL GALLERY RACKS & CORNER SHRINES
  // =========================================================================
  const wheelBarrelGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.56, 28);
  const wheelCapGeo = getDetailedPrayerWheelCapGeo();
  const wheelRingGeo = new THREE.TorusGeometry(0.225, 0.024, 10, 28);
  const wheelFinialGeo = getDetailedParterreFinialGeo();

  const addSpinningPrayerWheel = (
    parent: THREE.Object3D,
    x: number,
    yCenter: number,
    z: number,
    scale = 1,
  ) => {
    const spinner = new THREE.Group();
    spinner.position.set(x, yCenter, z);
    spinner.scale.setScalar(scale);
    spinner.userData.noMerge = true;

    const barrel = new THREE.Mesh(wheelBarrelGeo, prayerWheelMat);
    barrel.castShadow = true;
    const topCap = new THREE.Mesh(wheelCapGeo, goldMat);
    topCap.position.y = 0.28;
    const botCap = new THREE.Mesh(wheelCapGeo, goldMat);
    botCap.rotation.x = Math.PI;
    botCap.position.y = -0.28;
    const midRing = new THREE.Mesh(wheelRingGeo, bronzeMat);
    midRing.rotation.x = Math.PI / 2;
    const finialTip = new THREE.Mesh(wheelFinialGeo, goldMat);
    finialTip.scale.setScalar(0.68);
    finialTip.position.y = 0.42;

    spinner.add(barrel, topCap, botCap, midRing, finialTip);
    parent.add(spinner);
    animatedNodes.push(spinner);
  };

  // Flanking East & West Covered Prayer-Wheel Gallery Racks (6 spinning Mani drums each)
  for (const side of [-1, 1]) {
    const rx = side * 12.2;
    const rack = new THREE.Group();
    rack.position.set(rx, 0, -0.2);

    const rPlinth = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.34, 5.4), plinthStoneMat);
    rPlinth.position.y = 0.17;
    rPlinth.castShadow = true;
    rPlinth.receiveShadow = true;
    const rCap = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.08, 5.48), tealTrimMat);
    rCap.position.y = 0.38;
    const rTable = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.10, 5.1), darkWoodMat);
    rTable.position.y = 0.72;
    const rTopBeam = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.14, 5.2), darkWoodMat);
    rTopBeam.position.y = 1.98;
    const rRoof = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.16, 5.65), terracottaTrimMat);
    rRoof.position.y = 2.12;
    rRoof.castShadow = true;
    const rRoofTeal = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.09, 5.48), tealTrimMat);
    rRoofTeal.position.y = 2.24;
    rack.add(rPlinth, rCap, rTable, rTopBeam, rRoof, rRoofTeal);

    const rackPostPts: THREE.Vector2[] = [
      new THREE.Vector2(0.085, 0.0),
      new THREE.Vector2(0.09, 0.10),
      new THREE.Vector2(0.058, 0.20),
      new THREE.Vector2(0.068, 0.76),
      new THREE.Vector2(0.052, 1.32),
      new THREE.Vector2(0.084, 1.48),
      new THREE.Vector2(0.088, 1.56),
    ];
    const rackPostGeo = new THREE.LatheGeometry(rackPostPts, 18);
    for (const pz of [-2.42, 0, 2.42]) {
      const post = new THREE.Mesh(rackPostGeo, darkWoodMat);
      post.position.set(0, 0.42, pz);
      post.castShadow = true;
      rack.add(post);
      if (pz !== 0) {
        const kal = createDetailedGajurSpire(goldMat, bronzeMat, 0.36, 0.42);
        kal.position.set(0, 2.28, pz);
        rack.add(kal);
      }
    }

    // 6 Individual Spinning Brass Mani Drums along the Gallery Rack
    for (let w = 0; w < 6; w++) {
      const wz = -2.0 + w * 0.8 + (w >= 3 ? 0.18 : -0.18);
      const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.24, 12), bronzeMat);
      spindle.position.set(0, 1.35, wz);
      rack.add(spindle);
      addSpinningPrayerWheel(rack, 0, 1.34, wz, 0.92);
    }

    markOccluder(rack);
    group.add(rack);
  }

  // Four Ceremonial Giant Corner Ashta-Mangala Prayer-Wheel Shrines
  for (const px of [-5.6, 5.6]) {
    for (const pz of [-2.6, 6.6]) {
      const shrineWheel = new THREE.Group();
      shrineWheel.position.set(px, 0, pz);

      const octBase = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.56, 0.44, 24), whiteTrimMat);
      octBase.position.y = 0.22;
      octBase.castShadow = true;
      octBase.receiveShadow = true;
      const octTeal = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.10, 24), tealTrimMat);
      octTeal.position.y = 0.48;
      const octBrass = new THREE.Mesh(new THREE.TorusGeometry(0.49, 0.018, 10, 28), bronzeMat);
      octBrass.rotation.x = Math.PI / 2;
      octBrass.position.y = 0.44;
      const yokeArch = new THREE.Mesh(
        getArchGeo(1.06, 1.56, 0.78, 1.32, 0.12),
        whiteTrimMat,
      );
      yokeArch.position.y = 0.52;
      yokeArch.castShadow = true;
      const yokeCap = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.08, 0.18), terracottaTrimMat);
      yokeCap.position.y = 2.09;
      const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.48, 16), bronzeMat);
      axle.position.y = 1.26;
      const topKalash = createDetailedGajurSpire(goldMat, bronzeMat, 0.42, 0.48);
      topKalash.position.y = 2.13;
      shrineWheel.add(octBase, octTeal, octBrass, yokeArch, yokeCap, axle, topKalash);

      addSpinningPrayerWheel(shrineWheel, 0, 1.22, 0, 1.28);
      markOccluder(shrineWheel);
      group.add(shrineWheel);
    }
  }

  // =========================================================================
  // 9c. INTRICATE NON-COLLIDABLE INNER COURTYARD MUGHAL GATE STRUCTURES
  // =========================================================================
  const innerGateDomeGeo = createOnionDomeGeometry(0.76, 1.48);
  const innerGateMiniDomeGeo = createOnionDomeGeometry(0.46, 0.94);

  // (A) Central Walk-Through Mughal Torana-Darwaza Gate (z = 0.35, wide 5.4m clear span)
  const centralGate = new THREE.Group();
  centralGate.position.set(0, 0, 0.35);

  for (const side of [-1, 1]) {
    const px = side * 3.25;
    // Octagonal stepped marble pier base + twin engaged Mughal guldasta pilasters
    const pierPlinth = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.36, 1.30), whiteTrimMat);
    pierPlinth.position.set(px, 0.18, 0);
    pierPlinth.castShadow = true;
    const pierCap = new THREE.Mesh(new THREE.BoxGeometry(1.20, 0.10, 1.38), tealTrimMat);
    pierCap.position.set(px, 0.40, 0);
    const pierCore = new THREE.Mesh(new THREE.BoxGeometry(0.68, 3.25, 0.78), marbleWallMat);
    pierCore.position.set(px, 2.02, 0);
    pierCore.castShadow = true;
    centralGate.add(pierPlinth, pierCap, pierCore);

    // 4 engaged fluted Mughal corner columns clasping pierCore cleanly on widened pierCap
    for (const cxOff of [-0.38, 0.38]) {
      for (const czOff of [-0.43, 0.43]) {
        pushPillar(px + cxOff, 0.44, 0.35 + czOff, 3.2, 0.48);
      }
    }

    // Sculpted brass Sukunda diya sconce facing the inner processional walkway
    const dShelf = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.32), terracottaTrimMat);
    dShelf.position.set(px - side * 0.38, 1.72, 0);
    const dSukunda = createDetailedBrassSukundaDiyo(goldMat, bronzeMat, diyoGlowMat, 0.78, true);
    dSukunda.position.set(px - side * 0.40, 1.76, 0);
    dSukunda.rotation.y = side === -1 ? Math.PI / 2 : -Math.PI / 2;
    centralGate.add(dShelf, dSukunda);

    // Towering octagonal guldasta corner turrets rising above the gate parapet
    const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 2.25, 8), whiteTrimMat);
    turret.position.set(px, 5.75, 0);
    const turretEave = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.56, 0.16, 8), terracottaTrimMat);
    turretEave.position.set(px, 6.92, 0);
    const turretDome = new THREE.Mesh(innerGateMiniDomeGeo, domeMat);
    turretDome.position.set(px, 6.98, 0);
    const turretSpire = createDetailedGajurSpire(goldMat, bronzeMat, 0.54, 0.44);
    turretSpire.position.set(px, 7.90, 0);
    centralGate.add(turret, turretEave, turretDome, turretSpire);
  }

  // Sculpted Multi-Foil Mughal Cusped Archway Bridge spanning wide open (5.4m clear, 4.7m high)
  const gateArchBridge = new THREE.Mesh(
    getArchGeo(7.6, 2.15, 5.4, 1.58, 0.72),
    whiteTrimMat,
  );
  gateArchBridge.position.set(0, 3.25, 0);
  gateArchBridge.castShadow = true;
  const gateFriezeS = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 0.62), toranaMat);
  gateFriezeS.position.set(0, 5.06, 0.38);
  const gateFriezeN = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 0.62), toranaMat);
  gateFriezeN.position.set(0, 5.06, -0.38);
  gateFriezeN.rotation.y = Math.PI;
  const gateCornice = new THREE.Mesh(new THREE.BoxGeometry(8.1, 0.22, 1.05), tealTrimMat);
  gateCornice.position.set(0, 5.52, 0);
  const gateEave = new THREE.Mesh(new THREE.BoxGeometry(8.45, 0.18, 1.58), terracottaTrimMat);
  gateEave.position.set(0, 5.34, 0);
  gateEave.castShadow = true;
  centralGate.add(gateArchBridge, gateFriezeS, gateFriezeN, gateCornice, gateEave);

  for (let kx = -2.4; kx <= 2.41; kx += 0.96) {
    if (Math.abs(kx) > 0.6) pushKumbha(kx, 5.62, 0.35, 0.62);
    pushBracket(kx, 5.14, 0.35 + 0.56, 0);
    pushBracket(kx, 5.14, 0.35 - 0.56, Math.PI);
  }
  for (const bx of [-1.85, 0, 1.85]) {
    const gBell = registerBell(createDetailedTempleBell(goldMat, bronzeMat, 0.55, bx === 0 ? 1.15 : 0.85));
    gBell.position.set(bx, 4.78, 0);
    centralGate.add(gBell);
  }

  // Crowning Open Octagonal Chhatri Lantern atop Central Courtyard Gate
  const cgDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.98, 0.28, 8), whiteTrimMat);
  cgDrum.position.y = 5.76;
  const cgCanopy = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 1.18, 0.22, 8), terracottaTrimMat);
  cgCanopy.position.y = 7.12;
  const cgDome = new THREE.Mesh(innerGateDomeGeo, domeMat);
  cgDome.position.y = 7.22;
  cgDome.castShadow = true;
  const cgKalash = createDetailedGajurSpire(goldMat, bronzeMat, 0.78, 0.66);
  cgKalash.position.y = 8.68;
  centralGate.add(cgDrum, cgCanopy, cgDome, cgKalash);
  for (let c = 0; c < 8; c++) {
    const a = (c / 8) * Math.PI * 2 + Math.PI / 8;
    pushPillar(Math.sin(a) * 0.78, 5.88, 0.35 + Math.cos(a) * 0.78, 1.18, 0.42);
  }
  markOccluder(centralGate);
  group.add(centralGate);

  // (B) Inner Simha Dwar Courtyard Pishtaq Framing Portal (z = 11.15 facing courtyard)
  const innerSimhaPishtaq = new THREE.Group();
  innerSimhaPishtaq.position.set(0, 0, 11.15);
  const pishtaqArch = new THREE.Mesh(
    getArchGeo(5.6, 5.45, 4.0, 4.65, 0.34),
    whiteTrimMat,
  );
  pishtaqArch.castShadow = true;
  const pishtaqTopBand = new THREE.Mesh(new THREE.BoxGeometry(6.1, 0.24, 0.72), tealTrimMat);
  pishtaqTopBand.position.set(0, 5.56, -0.05);
  const pishtaqEave = new THREE.Mesh(new THREE.BoxGeometry(6.3, 0.18, 1.15), terracottaTrimMat);
  pishtaqEave.position.set(0, 5.36, -0.25);
  const pishtaqMural = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 0.68), toranaMat);
  pishtaqMural.position.set(0, 5.02, -0.20);
  pishtaqMural.rotation.y = Math.PI;
  innerSimhaPishtaq.add(pishtaqArch, pishtaqTopBand, pishtaqEave, pishtaqMural);

  for (const side of [-1, 1]) {
    const gx = side * 2.65;
    const guldasta = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 6.95, 8), whiteTrimMat);
    guldasta.position.set(gx, 3.48, -0.08);
    guldasta.castShadow = true;
    const gCap = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.54, 0.18, 8), terracottaTrimMat);
    gCap.position.set(gx, 7.02, -0.08);
    const gDome = new THREE.Mesh(innerGateMiniDomeGeo, domeMat);
    gDome.position.set(gx, 7.10, -0.08);
    const gSpire = createDetailedGajurSpire(goldMat, bronzeMat, 0.58, 0.48);
    gSpire.position.set(gx, 8.02, -0.08);
    innerSimhaPishtaq.add(guldasta, gCap, gDome, gSpire);
  }
  markOccluder(innerSimhaPishtaq);
  group.add(innerSimhaPishtaq);

  // (C) East & West Parikrama Royal Dalan Inner Courtyard Pishtaq Gates (x = ±14.02, z = -1.7)
  for (const side of [-1, 1]) {
    const dalanGate = new THREE.Group();
    dalanGate.position.set(side * 14.02, 0, -1.7);
    dalanGate.rotation.y = side === -1 ? Math.PI / 2 : -Math.PI / 2;

    const dArch = new THREE.Mesh(
      getArchGeo(3.6, 4.45, 2.55, 3.48, 0.36),
      whiteTrimMat,
    );
    dArch.castShadow = true;
    const dPlaque = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.58), toranaMat);
    dPlaque.position.set(0, 3.92, 0.21);
    const dTeal = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.22, 0.72), tealTrimMat);
    dTeal.position.set(0, 4.56, 0.12);
    const dEave = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.16, 1.12), terracottaTrimMat);
    dEave.position.set(0, 4.38, 0.28);
    const dBell = registerBell(createDetailedTempleBell(goldMat, bronzeMat, 0.48, 0.92));
    dBell.position.set(0, 3.55, 0.18);
    dalanGate.add(dArch, dPlaque, dTeal, dEave, dBell);

    for (const gx of [-1.68, 1.68]) {
      const gCol = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 5.4, 8), whiteTrimMat);
      gCol.position.set(gx, 2.7, 0.0);
      const gEave = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 0.14, 8), terracottaTrimMat);
      gEave.position.set(gx, 5.46, 0.0);
      const gDome = new THREE.Mesh(innerGateMiniDomeGeo, domeMat);
      gDome.scale.setScalar(0.76);
      gDome.position.set(gx, 5.52, 0.0);
      const gSpire = createDetailedGajurSpire(goldMat, bronzeMat, 0.48, 0.4);
      gSpire.position.set(gx, 6.22, 0.0);
      dalanGate.add(gCol, gEave, gDome, gSpire);
    }

    const dCupolaDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.74, 0.75, 8), marbleWallMat);
    dCupolaDrum.position.set(0, 5.02, 0.1);
    const dCupolaEave = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 1.05, 0.18, 8), terracottaTrimMat);
    dCupolaEave.position.set(0, 5.46, 0.1);
    const dCupolaDome = new THREE.Mesh(innerGateDomeGeo, domeMat);
    dCupolaDome.position.set(0, 5.54, 0.1);
    const dCupolaSpire = createDetailedGajurSpire(goldMat, bronzeMat, 0.64, 0.56);
    dCupolaSpire.position.set(0, 7.0, 0.1);
    dalanGate.add(dCupolaDrum, dCupolaEave, dCupolaDome, dCupolaSpire);

    markOccluder(dalanGate);
    group.add(dalanGate);
  }

  // =========================================================================
  // 10. INSTANCED SCULPTED DETAILS (Lathe Kumbha Urns & Gajurs, S-Curve Brackets, Carved Pillars)
  // =========================================================================
  if (kumbhaBaseMatrices.length > 0) {
    const kBaseGeo = new THREE.CylinderGeometry(0.40, 0.46, 0.68, 24);
    const kRingGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.10, 24);
    const kDomeGeo = getDetailedKumbhaUrnGeo();
    const kSpireGeo = getDetailedGajurKalashGeo();

    const kBaseInst = new THREE.InstancedMesh(kBaseGeo, marbleWallMat, kumbhaBaseMatrices.length);
    const kRingInst = new THREE.InstancedMesh(kRingGeo, terracottaTrimMat, kumbhaBaseMatrices.length);
    const kDomeInst = new THREE.InstancedMesh(kDomeGeo, tealTrimMat, kumbhaDomeMatrices.length);
    const kSpireInst = new THREE.InstancedMesh(kSpireGeo, goldMat, kumbhaDomeMatrices.length);

    kumbhaBaseMatrices.forEach((m, i) => {
      kBaseInst.setMatrixAt(i, m);
      _m4.copy(m);
      _v3.set(0, 0.32, 0);
      _m4.multiply(new THREE.Matrix4().makeTranslation(_v3.x, _v3.y, _v3.z));
      kRingInst.setMatrixAt(i, _m4);
    });
    kumbhaDomeMatrices.forEach((m, i) => {
      _m4.copy(m);
      _m4.multiply(new THREE.Matrix4().makeScale(0.92, 0.68, 0.92));
      kDomeInst.setMatrixAt(i, _m4);
      _m4.copy(m);
      _m4.multiply(new THREE.Matrix4().makeTranslation(0, 0.50, 0));
      _m4.multiply(new THREE.Matrix4().makeScale(0.32, 0.36, 0.32));
      kSpireInst.setMatrixAt(i, _m4);
    });
    kBaseInst.castShadow = true;
    kBaseInst.instanceMatrix.needsUpdate = true;
    kRingInst.instanceMatrix.needsUpdate = true;
    kDomeInst.instanceMatrix.needsUpdate = true;
    kSpireInst.instanceMatrix.needsUpdate = true;
    kBaseInst.computeBoundingSphere();
    kRingInst.computeBoundingSphere();
    kDomeInst.computeBoundingSphere();
    kSpireInst.computeBoundingSphere();
    group.add(kBaseInst, kRingInst, kDomeInst, kSpireInst);
  }

  if (bracketMatrices.length > 0) {
    const brkGeo = createCurvedBracketGeometry(0.22, 0.54, 0.62);
    const brkInst = new THREE.InstancedMesh(brkGeo, terracottaTrimMat, bracketMatrices.length);
    bracketMatrices.forEach((m, i) => brkInst.setMatrixAt(i, m));
    brkInst.instanceMatrix.needsUpdate = true;
    brkInst.computeBoundingSphere();
    group.add(brkInst);
  }

  if (pillarShaftMatrices.length > 0) {
    const pBaseGeo = new THREE.BoxGeometry(0.46, 0.24, 0.46);
    const pNeckGeo = new THREE.CylinderGeometry(0.23, 0.27, 0.14, 24);
    const pShaftGeo = new THREE.CylinderGeometry(0.185, 0.215, 1.0, 24);
    const pCapGeo = new THREE.CylinderGeometry(0.30, 0.19, 0.24, 24);
    const pAbacusGeo = new THREE.BoxGeometry(0.54, 0.12, 0.54);

    const pBaseInst = new THREE.InstancedMesh(pBaseGeo, plinthStoneMat, pillarBaseMatrices.length);
    const pNeckInst = new THREE.InstancedMesh(pNeckGeo, tealTrimMat, pillarNeckMatrices.length);
    const pShaftInst = new THREE.InstancedMesh(pShaftGeo, pillarCarvedMat, pillarShaftMatrices.length);
    const pCapInst = new THREE.InstancedMesh(pCapGeo, terracottaTrimMat, pillarCapMatrices.length);
    const pAbacusInst = new THREE.InstancedMesh(pAbacusGeo, tealTrimMat, pillarAbacusMatrices.length);

    const instList = [
      [pBaseInst, pillarBaseMatrices],
      [pNeckInst, pillarNeckMatrices],
      [pShaftInst, pillarShaftMatrices],
      [pCapInst, pillarCapMatrices],
      [pAbacusInst, pillarAbacusMatrices],
    ] as const;

    for (const [inst, mats] of instList) {
      mats.forEach((m, i) => inst.setMatrixAt(i, m));
      inst.castShadow = true;
      inst.receiveShadow = true;
      inst.instanceMatrix.needsUpdate = true;
      inst.computeBoundingSphere();
      group.add(inst);
    }
    cameraOccluders.push(pShaftInst);
  }

  // =========================================================================
  // 10b. WEST, NORTH & EAST OUTER HERITAGE GROUNDS (Ganga Sagar, Vivah Mandap, Pati & Pyaau)
  // =========================================================================
  createJanakiMandirExterior({
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
    barkMat: darkWoodMat,
    chautaraSoilMat,
    chautaraFoliageMat,
    domeMat,
    beaconLights,
    animatedNodes,
    registerBell,
    markOccluder,
  });

  // =========================================================================
  // 11. HERITAGE SIGNPOST, LIGHTING, MERGE & CAMERA OCCLUDERS
  // =========================================================================
  const sign = createJanakiMonumentSign(
    textures,
    goldMat,
    bronzeMat,
    terracottaTrimMat,
    diyoGlowMat,
  );
  sign.position.set(10.5, plazaY, 24.0);
  sign.rotation.y = -0.15;
  markOccluder(sign);
  group.add(sign);

  const gateLight = new THREE.PointLight(0xffbd66, 2.4, 34, 1.4);
  gateLight.position.set(0, 4.6, 17.5);
  group.add(gateLight);
  beaconLights.push(gateLight);

  const hitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(52.0, 22.5, 44.0),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  hitMesh.position.set(0, 10.8, -1.5);
  hitMesh.layers.set(1);
  group.add(hitMesh);

  const worldUvScales = new Map<THREE.Material, number>([
    [marbleWallMat, 4.2],
    [whiteTrimMat, 2.4],
    [flagstoneMat, 3.2],
  ]);

  mergeStaticMeshesByMaterial(group, hitMesh, cameraOccluders, worldUvScales);

  group.userData.templeBells = templeBells;

  return { group, hitMesh, beaconLights, animatedNodes, cameraOccluders };
}

/**
 * Applies seamless world-space triplanar UVs to non-indexed masonry geometry so
 * ashlar blocks, marble veins, and Mughal stringcourses align across walls and arches.
 */
function applyWorldBoxUVs(geo: THREE.BufferGeometry, tileMeters: number): void {
  const pos = geo.getAttribute('position');
  const norm = geo.getAttribute('normal');
  const uv = geo.getAttribute('uv');
  if (!pos || !norm || !uv) return;

  const invScale = 1 / tileMeters;
  for (let i = 0; i < pos.count; i += 3) {
    const ax = (Math.abs(norm.getX(i)) + Math.abs(norm.getX(i + 1)) + Math.abs(norm.getX(i + 2))) / 3;
    const ay = (Math.abs(norm.getY(i)) + Math.abs(norm.getY(i + 1)) + Math.abs(norm.getY(i + 2))) / 3;
    const az = (Math.abs(norm.getZ(i)) + Math.abs(norm.getZ(i + 1)) + Math.abs(norm.getZ(i + 2))) / 3;

    for (let k = 0; k < 3; k++) {
      const idx = i + k;
      const vx = pos.getX(idx);
      const vy = pos.getY(idx);
      const vz = pos.getZ(idx);

      if (ay >= ax && ay >= az) {
        uv.setXY(idx, vx * invScale, vz * invScale);
      } else if (ax >= az) {
        uv.setXY(idx, vz * invScale, vy * invScale);
      } else {
        uv.setXY(idx, vx * invScale, vy * invScale);
      }
    }
  }
  uv.needsUpdate = true;
}

function isInsideOccluderSubtree(obj: THREE.Object3D): boolean {
  let cur: THREE.Object3D | null = obj;
  while (cur) {
    if (cur.userData.isOccluder) return true;
    cur = cur.parent;
  }
  return false;
}

function isInsideNoMergeSubtree(obj: THREE.Object3D): boolean {
  let cur: THREE.Object3D | null = obj;
  while (cur) {
    if (cur.userData.noMerge) return true;
    cur = cur.parent;
  }
  return false;
}

function mergeStaticMeshesByMaterial(
  root: THREE.Group,
  skipMesh: THREE.Mesh,
  cameraOccluders: THREE.Object3D[],
  worldUvScales: Map<THREE.Material, number>,
): void {
  root.updateMatrixWorld(true);

  const buckets = new Map<
    string,
    {
      mat: THREE.Material;
      castShadow: boolean;
      receiveShadow: boolean;
      isOccluder: boolean;
      geos: THREE.BufferGeometry[];
    }
  >();
  const matIds = new Map<THREE.Material, number>();
  let nextMatId = 1;
  const toRemove: THREE.Mesh[] = [];

  root.traverse((obj) => {
    if (!(obj as THREE.Mesh).isMesh) return;
    if ((obj as THREE.InstancedMesh).isInstancedMesh) return;
    if (obj === skipMesh) return;
    if (isInsideNoMergeSubtree(obj)) return;
    const mesh = obj as THREE.Mesh;
    if (Array.isArray(mesh.material) || !mesh.material || !mesh.geometry) return;

    const mat = mesh.material;
    let mId = matIds.get(mat);
    if (!mId) {
      mId = nextMatId++;
      matIds.set(mat, mId);
    }

    const occ = isInsideOccluderSubtree(mesh);
    const key = `${mId}_${mesh.castShadow ? 1 : 0}_${mesh.receiveShadow ? 1 : 0}_${occ ? 1 : 0}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        mat,
        castShadow: mesh.castShadow,
        receiveShadow: mesh.receiveShadow,
        isOccluder: occ,
        geos: [],
      };
      buckets.set(key, bucket);
    }

    const g = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
    if (!g.getAttribute('normal')) {
      g.computeVertexNormals();
    }
    if (!g.getAttribute('uv')) {
      const count = g.getAttribute('position').count;
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
    }
    for (const attrName of Object.keys(g.attributes)) {
      if (attrName !== 'position' && attrName !== 'normal' && attrName !== 'uv') {
        g.deleteAttribute(attrName);
      }
    }
    g.applyMatrix4(mesh.matrixWorld);
    const uvTileMeters = worldUvScales.get(mat);
    if (uvTileMeters) {
      applyWorldBoxUVs(g, uvTileMeters);
    }
    bucket.geos.push(g);
    toRemove.push(mesh);
  });

  const oldGeos = new Set<THREE.BufferGeometry>();
  for (const m of toRemove) {
    oldGeos.add(m.geometry);
    m.parent?.remove(m);
  }
  oldGeos.forEach((g) => g.dispose());

  for (const bucket of buckets.values()) {
    if (bucket.geos.length === 0) continue;
    const merged = mergeGeometries(bucket.geos, false);
    for (const g of bucket.geos) g.dispose();
    if (!merged) continue;
    const mergedMesh = new THREE.Mesh(merged, bucket.mat);
    mergedMesh.castShadow = bucket.castShadow;
    mergedMesh.receiveShadow = bucket.receiveShadow;
    root.add(mergedMesh);
    if (bucket.isOccluder) {
      cameraOccluders.push(mergedMesh);
    }
  }
}

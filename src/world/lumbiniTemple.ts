import * as THREE from 'three';
import {
  createDetailedGajurSpire,
  createDetailedTempleBell,
  createRectangularHipRoofGeometry,
  getDetailedParterreFinialGeo,
  getDetailedPrayerWheelCapGeo,
} from './janakiMandirCraft';
import { BuddhaMaterials, createMonumentalBabyBuddhaMonument } from './lumbiniBuddhaSculpt';
import {
  buildDetailedLumbiniBench,
  buildDetailedLumbiniBollards,
  buildDetailedOverlookBalustrade,
  buildRealisticLumbiniHedges,
} from './lumbiniGardenCraft';
import { buildMayaDeviTemple } from './lumbiniMayaDevi';
import {
  buildAuthenticAshokaPillar,
  buildEternalPeaceFlame,
  buildExcavatedBrickRuin,
  buildMyanmarGoldenPagoda,
  buildPeaceLantern,
  buildPushkariniPond,
  buildSacredBodhiChautara,
  buildSacredGardenSurroundingPond,
  buildThaiMarbleSanctuary,
  buildToranaGate,
} from './lumbiniShrines';
import { buildLumbiniComplexPerimeterFence } from './lumbiniPerimeterFence';
import { mergeStaticMeshesByMaterial } from './meshOptimization';
import { createLumbiniTextures } from './lumbiniTextures';
import { createWavingPrayerFlagGarland, updatePrayerFlagUniforms } from './prayerFlags';
import { LandmarkBuildResult } from './proceduralModels';
import { ProceduralTextureSet } from './proceduralTextures';
import {
  LUMBINI_FENCE_BOUNDS,
  LUMBINI_PUSHKARINI_POND,
  LUMBINI_SACRED_POND,
} from './worldLogic';

const _m4 = new THREE.Matrix4();
const _v3 = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _e = new THREE.Euler();

/**
 * Builds the Monumental Lumbini Maya Devi Temple & Sacred Garden Sanctuary (54m x 58m)
 * centered at (-8, 120) with authentic real-life architecture:
 * - True 2003 White-Painted Brick Maya Devi Temple (continuous multi-pane clerestory windows,
 *   terracotta-capped parapet piers, central skylight dome & golden Nepali Chaitya spire,
 *   sloped Dharmachakra ramp & walkable interior boardwalk overlooking 15-chamber Mauryan ruins & Marker Stone)
 * - Stepped Pushkarini Sacred Pond reflecting Maya Devi Temple directly south
 * - Authentic Ashoka Pillar (249 BCE) with broken weathered top, iron clamps & brass railing
 * - Monumental Golden Baby Buddha pointing skyward on marigold-garlanded dark-basalt lotus pool
 * - Myanmar Golden Pagoda & Royal Thai Marble Pavilion sheltering Great Alms-Bowl Dhyana Buddha
 * - Sacred Bodhi Tree Chautara, Eternal Peace Flame, Excavated Brick Ruins, Red-Brick Paths & Trimmed Hedges
 */
export function createLumbiniBuddha(
  textures: ProceduralTextureSet,
  isSoftwareGl = false,
): LandmarkBuildResult {
  const group = new THREE.Group();
  const beaconLights: THREE.PointLight[] = [];
  const animatedNodes: THREE.Object3D[] = [];
  const cameraOccluders: THREE.Object3D[] = [];
  const templeBells: THREE.Group[] = [];

  const lTex = createLumbiniTextures(Math.max(4, textures.meadowMap?.anisotropy || 4));
  const jTex = textures.janaki;
  const extraDisposers: Array<() => void> = [() => lTex.dispose()];
  group.userData.disposeExtraTextures = () => {
    for (const fn of extraDisposers) fn();
  };

  // =========================================================================
  // 1. SHARED ARCHAEOLOGICAL & SACRED GARDEN PBR MATERIALS
  // =========================================================================
  const whiteBrickMat = new THREE.MeshStandardMaterial({
    map: lTex.whiteBrickMap,
    normalMap: lTex.whiteBrickNormal,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughnessMap: lTex.whiteBrickRough,
    aoMap: lTex.whiteBrickAo,
    aoMapIntensity: 0.72,
    color: 0xf6f4ee,
    roughness: 0.88,
    metalness: 0.02,
  });

  const brickMat = new THREE.MeshStandardMaterial({
    map: lTex.mauryaBrickMap,
    normalMap: lTex.mauryaBrickNormal,
    normalScale: new THREE.Vector2(0.92, 0.92),
    roughnessMap: lTex.mauryaBrickRough,
    aoMap: lTex.mauryaBrickAo,
    aoMapIntensity: 0.86,
    color: 0xba6a49,
    roughness: 0.92,
    metalness: 0.02,
  });

  // Sunlit archaeological brick material (0xffffff multiplier preserves true mortar, ochre, and moss detail)
  const archaeoBrickMat = new THREE.MeshStandardMaterial({
    map: lTex.mauryaBrickMap,
    normalMap: lTex.mauryaBrickNormal,
    normalScale: new THREE.Vector2(1.08, 1.08),
    roughnessMap: lTex.mauryaBrickRough,
    aoMap: lTex.mauryaBrickAo,
    aoMapIntensity: 0.82,
    color: 0xf4e4d8,
    roughness: 0.89,
    metalness: 0.02,
  });

  const terracottaPaverMat = new THREE.MeshStandardMaterial({
    map: lTex.terracottaPaverMap,
    normalMap: lTex.terracottaPaverNormal,
    normalScale: new THREE.Vector2(0.78, 0.78),
    roughnessMap: lTex.terracottaPaverRough,
    color: 0xb66852,
    roughness: 0.88,
    metalness: 0.03,
  });

  const terracottaCapMat = new THREE.MeshStandardMaterial({
    color: 0xa83e2f,
    roughness: 0.74,
    metalness: 0.04,
  });

  const lawnMat = new THREE.MeshStandardMaterial({
    map: lTex.gardenLawnMap,
    normalMap: lTex.gardenLawnNormal,
    normalScale: new THREE.Vector2(0.65, 0.65),
    roughnessMap: lTex.gardenLawnRough,
    color: 0x5c8b3f,
    roughness: 0.94,
    metalness: 0.01,
  });

  const hedgeMat = new THREE.MeshStandardMaterial({
    map: lTex.hedgeLeafMap,
    normalMap: lTex.hedgeLeafNormal,
    normalScale: new THREE.Vector2(0.85, 0.85),
    color: 0x4c7c33,
    roughness: 0.89,
    metalness: 0.02,
  });

  const whiteStuccoMat = new THREE.MeshPhysicalMaterial({
    map: lTex.stuccoWhiteMap,
    normalMap: lTex.stuccoWhiteNormal,
    normalScale: new THREE.Vector2(0.55, 0.55),
    roughnessMap: lTex.stuccoWhiteRough,
    aoMap: lTex.stuccoWhiteAo,
    aoMapIntensity: 0.7,
    color: 0xf7f5ef,
    roughness: 0.82,
    metalness: 0.02,
    clearcoat: 0.14,
    clearcoatRoughness: 0.45,
  });

  const whiteMarbleMat = new THREE.MeshPhysicalMaterial({
    map: jTex.marbleAshlarMap,
    normalMap: jTex.marbleAshlarNormal,
    normalScale: new THREE.Vector2(0.5, 0.5),
    roughnessMap: jTex.marbleAshlarRough,
    color: 0xf6f3ec,
    roughness: 0.48,
    metalness: 0.04,
    clearcoat: 0.3,
    clearcoatRoughness: 0.25,
  });

  const chunarStoneMat = new THREE.MeshStandardMaterial({
    map: lTex.chunarStoneMap,
    normalMap: lTex.chunarStoneNormal,
    normalScale: new THREE.Vector2(0.75, 0.75),
    roughnessMap: lTex.chunarStoneRough,
    aoMap: lTex.chunarStoneAo,
    aoMapIntensity: 0.78,
    color: 0xf3eadc,
    roughness: 0.80,
    metalness: 0.04,
  });

  const giltGoldMat = new THREE.MeshStandardMaterial({
    map: lTex.giltBronzeMap,
    normalMap: lTex.giltBronzeNormal,
    normalScale: new THREE.Vector2(0.58, 0.58),
    roughnessMap: lTex.giltBronzeRough,
    color: 0xf4c85b,
    roughness: 0.24,
    metalness: 0.90,
    emissive: 0x4b2f06,
    emissiveIntensity: 0.14,
  });

  const warmBronzeMat = new THREE.MeshStandardMaterial({
    map: textures.agedBronzeMap,
    normalMap: textures.agedBronzeNormal,
    roughnessMap: textures.agedBronzeRough,
    color: 0xba8438,
    roughness: 0.34,
    metalness: 0.85,
  });

  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x353b42,
    roughness: 0.46,
    metalness: 0.78,
  });

  const timberMat = new THREE.MeshStandardMaterial({
    map: textures.woodMap,
    normalMap: textures.woodNormal,
    color: 0x6e472d,
    roughness: 0.84,
  });

  const crimsonLacquerMat = new THREE.MeshStandardMaterial({
    color: 0x8f221d,
    roughness: 0.42,
    metalness: 0.16,
  });

  const deepIndigoHairMat = new THREE.MeshStandardMaterial({
    color: 0x222c44,
    roughness: 0.52,
    metalness: 0.24,
  });

  const flameGlowMat = new THREE.MeshStandardMaterial({
    color: 0xfff5cb,
    emissive: 0xffa02e,
    emissiveIntensity: 2.35,
    roughness: 0.16,
  });

  const glassTintMat = new THREE.MeshPhysicalMaterial({
    color: 0x1b2733,
    roughness: 0.15,
    metalness: 0.2,
    clearcoat: 0.9,
  });

  const heroMats: BuddhaMaterials = {
    skinMat: giltGoldMat,
    robeMat: giltGoldMat,
    hairMat: deepIndigoHairMat,
    goldMat: giltGoldMat,
    bronzeMat: warmBronzeMat,
    stonePlinthMat: chunarStoneMat,
    crimsonLacquerMat,
    flameMat: flameGlowMat,
  };

  // =========================================================================
  // 2. MANICURED GREEN LAWNS, TERRACOTTA RED-BRICK WALKWAYS & TRIMMED HEDGES
  // =========================================================================
  // 88m x 96m garden bounds: x in [-44.0, +44.0], z in [-44.0, +52.0]
  // Lawns segmented around Pushkarini Pond (x:-3.0..+23.0, z:+7.7..+25.3) and Maya Devi Pit (|x|<=17.6, z:-33.6..-10.4)
  const addLawnSlab = (x0: number, x1: number, z0: number, z1: number) => {
    const sx = x1 - x0;
    const sz = z1 - z0;
    if (sx <= 0.1 || sz <= 0.1) return;
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.14, sz), lawnMat);
    m.position.set((x0 + x1) * 0.5, -0.04, (z0 + z1) * 0.5);
    m.receiveShadow = true;
    group.add(m);
  };
  addLawnSlab(-44.0, 44.0, -44.0, -33.6); // North sacred lawn
  addLawnSlab(-44.0, -17.6, -33.6, 7.7); // NW lawn (Ashoka Pillar, West cross lawn)
  addLawnSlab(17.6, 44.0, -33.6, 7.7); // NE lawn (Royal Thai court)
  addLawnSlab(-17.6, 17.6, -10.4, 7.7); // Central lawn between Maya Devi & Pushkarini
  addLawnSlab(-44.0, -3.0, 7.7, 25.3); // West of Pushkarini (Bodhi Tree)
  addLawnSlab(23.0, 44.0, 7.7, 25.3); // East of Pushkarini (Eternal Peace Flame)
  addLawnSlab(-44.0, 44.0, 25.3, 52.0); // South lawn & Baby Buddha forecourt

  // Terracotta Red-Brick Ceremonial Walkways (y = +0.10 top surface -> world +0.35m)
  const addBrickWalk = (x0: number, x1: number, z0: number, z1: number) => {
    const sx = x1 - x0;
    const sz = z1 - z0;
    const walk = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.16, sz), terracottaPaverMat);
    walk.position.set((x0 + x1) * 0.5, 0.02, (z0 + z1) * 0.5);
    walk.receiveShadow = true;
    group.add(walk);
  };
  // Non-overlapping Terracotta Red-Brick Ceremonial Walkways (y = +0.10 top surface -> world +0.35m)
  addBrickWalk(-8.5, 8.5, 30.8, 52.0); // Grand South Axial Forecourt (south of South Promenade)
  addBrickWalk(-8.5, -3.2, 6.0, 27.2); // Continuous Pushkarini West Overlook Causeway -> South Promenade
  addBrickWalk(-5.8, 5.8, -10.0, 2.0); // Expanded Maya Devi South Temple Forecourt & Axial Ramp Approach
  addBrickWalk(-44.0, 44.0, 2.0, 6.0); // Grand East-West Cross Promenade between West & East Gates
  addBrickWalk(-22.4, -19.2, -42.5, 2.0); // West Brick Garden Walk (North segment)
  addBrickWalk(-22.4, -19.2, 6.0, 30.8); // West Brick Garden Walk (South segment)
  addBrickWalk(24.2, 27.2, -42.5, 2.0); // East Brick Garden Walk (North segment)
  addBrickWalk(24.2, 27.2, 6.0, 30.8); // East Brick Garden Walk (South segment)
  addBrickWalk(-19.2, 24.2, 27.2, 30.8); // South Pushkarini Pond Promenade
  addBrickWalk(-19.2, 24.2, -42.5, -38.5); // North Gate Cross Walk
  addBrickWalk(-3.4, 3.4, -44.0, -42.5); // North Torana Gate Threshold Spur
  addBrickWalk(-27.0, -22.4, -22.8, -19.2); // Ashoka Pillar Viewing Spur
  addBrickWalk(-19.2, 20.4, -36.8, -34.2); // Maya Devi North Circumambulation Walk
  // Monument Shrine Spur Trails connecting every pavilion cleanly to the main network
  addBrickWalk(-23.78, -8.5, 39.4, 43.0); // Myanmar Golden Pagoda spur aligned flush outside forecourt slab
  addBrickWalk(-19.2, -8.5, 30.8, 32.4); // Full-width Peace Bell Pavilion ceremonial court pad
  addBrickWalk(-25.6, -22.4, 14.8, 18.2); // Sacred Bodhi Chautara spur
  addBrickWalk(27.2, 32.4, 22.4, 25.6); // Eternal Peace Flame spur
  addBrickWalk(27.2, 30.0, -23.8, -20.2); // Royal Thai Sanctuary spur

  // Outer Sacred Garden Pond Moat, Ghat Banks, 4 Arched Causeway Bridges & Outer Promenades
  const surroundingPond = buildSacredGardenSurroundingPond(
    terracottaPaverMat,
    brickMat,
    chunarStoneMat,
    giltGoldMat,
    warmBronzeMat,
    isSoftwareGl,
  );
  group.add(surroundingPond);

  // Compact 2-step Chunar sandstone gate threshold aprons outside the 4 expanded perimeter gates (clear of roads)
  const addOuterRoadApron = (edgeX: number, edgeZ: number, w: number, rotY: number) => {
    const landing = new THREE.Group();
    landing.position.set(edgeX, 0, edgeZ);
    landing.rotation.y = rotY;
    const upperStep = new THREE.Mesh(new THREE.BoxGeometry(w, 0.18, 0.85), chunarStoneMat);
    upperStep.position.set(0, 0.005, 0.425); // flush outside gate (z=0..0.85m, top = +0.095 -> world 0.345m)
    upperStep.receiveShadow = true;
    upperStep.userData.nonCollidable = true;
    const lowerStep = new THREE.Mesh(new THREE.BoxGeometry(w + 0.44, 0.14, 0.80), chunarStoneMat);
    lowerStep.position.set(0, -0.025, 1.25); // gentle step down onto lawn (0.85..1.65m, top = +0.045 -> world 0.295m)
    lowerStep.receiveShadow = true;
    lowerStep.userData.nonCollidable = true;
    landing.add(upperStep, lowerStep);
    group.add(landing);
  };
  addOuterRoadApron(0, LUMBINI_FENCE_BOUNDS.localMaxZ, 6.8, 0);
  addOuterRoadApron(0, LUMBINI_FENCE_BOUNDS.localMinZ, 6.8, Math.PI);
  addOuterRoadApron(LUMBINI_FENCE_BOUNDS.localMaxX, 4.0, 5.2, Math.PI * 0.5);
  addOuterRoadApron(LUMBINI_FENCE_BOUNDS.localMinX, 4.0, 5.2, -Math.PI * 0.5);

  // Detailed Chunar Sandstone Curbs, Transverse Perspective Ribs & Sculpted 3D Dharmachakra Medallions
  const curbTransforms: Array<[number, number, number, number]> = [
    // South Forecourt & Overlook curbs
    [-8.55, 40.0, 0.22, 24.0],
    [8.55, 40.0, 0.22, 24.0],
    [-8.55, 17.0, 0.22, 22.0],
    [-3.25, 17.0, 0.22, 22.0],
    [-5.85, -4.0, 0.22, 12.0],
    [5.85, -4.0, 0.22, 12.0],
    // Symmetric East-West Cross Promenade curbs
    [-26.25, 1.95, 35.5, 0.22],
    [25.05, 1.95, 37.9, 0.22],
    [-26.25, 6.05, 35.5, 0.22],
    [25.05, 6.05, 37.9, 0.22],
    // Transverse axial perspective ribs every 4m amplifying depth toward Maya Devi Temple (split cleanly around medallions & curbs!)
    [-2.05, 62.0, 2.3, 0.28],
    [2.05, 62.0, 2.3, 0.28],
    ...[50.0, 46.0, 34.0, 30.0].map((rz): [number, number, number, number] => [0, rz, 6.4, 0.28]),
    ...[8.0, 12.0, 16.0, 20.0, 24.0].map((rz): [number, number, number, number] => [-5.90, rz, 4.96, 0.26]),
    [-2.35, 0.0, 2.9, 0.28],
    [2.35, 0.0, 2.9, 0.28],
    ...[-4.0, -8.0].map((rz): [number, number, number, number] => [0, rz, 7.6, 0.28]),
    ...[-34, -26, -18, -10, 10, 18, 26, 34, 41].map((rx): [number, number, number, number] => [rx, 4.0, 0.26, 3.8]),
    ...[65.5, 69.5, 73.0, -56.5, -60.5, -64.5].map((rz): [number, number, number, number] => [0, rz, 6.5, 0.28]),
    ...[54.5, 59.5].map((rx): [number, number, number, number] => [rx, 4.0, 0.26, 4.9]),
  ];
  const unitStripGeo = new THREE.BoxGeometry(1, 0.024, 1);
  const curbInst = new THREE.InstancedMesh(unitStripGeo, chunarStoneMat, curbTransforms.length);
  curbInst.receiveShadow = true;
  curbInst.userData.nonCollidable = true;
  curbTransforms.forEach(([cx, cz, sx, sz], idx) => {
    _v3.set(cx, 0.105, cz);
    _q.identity();
    _s.set(sx, 1, sz);
    _m4.compose(_v3, _q, _s);
    curbInst.setMatrixAt(idx, _m4);
  });
  curbInst.instanceMatrix.needsUpdate = true;
  curbInst.computeBoundingSphere();
  group.add(curbInst);

  // Sculpted 3D Chunar sandstone + bronze Lotus / Dharmachakra medallions along main axis
  const medStoneBaseGeo = new THREE.CylinderGeometry(0.86, 0.90, 0.020, 24);
  const medStoneInnerGeo = new THREE.CylinderGeometry(0.62, 0.62, 0.016, 24);
  const medBronzeRimGeo = new THREE.TorusGeometry(0.63, 0.024, 8, 24);
  medBronzeRimGeo.rotateX(Math.PI / 2);
  const medCoreDiscGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.018, 18);
  const medSpokeGeo = new THREE.BoxGeometry(1.22, 0.014, 0.065);
  for (const [mx, mz] of [
    [0, 61.9],
    [0, 49.0],
    [0, 31.0],
    [0, 4.0],
    [0, -1.0],
  ] as Array<[number, number]>) {
    const baseY = mz > 55 ? 0.098 : 0.108;
    const outerStone = new THREE.Mesh(medStoneBaseGeo, chunarStoneMat);
    outerStone.position.set(mx, baseY, mz);
    outerStone.receiveShadow = true;
    outerStone.userData.nonCollidable = true;
    const innerStone = new THREE.Mesh(medStoneInnerGeo, terracottaPaverMat);
    innerStone.position.set(mx, baseY + 0.014, mz);
    innerStone.receiveShadow = true;
    innerStone.userData.nonCollidable = true;
    const rim = new THREE.Mesh(medBronzeRimGeo, warmBronzeMat);
    rim.position.set(mx, baseY + 0.024, mz);
    rim.userData.nonCollidable = true;
    const hub = new THREE.Mesh(medCoreDiscGeo, giltGoldMat);
    hub.position.set(mx, baseY + 0.023, mz);
    hub.userData.nonCollidable = true;
    group.add(outerStone, innerStone, rim, hub);
    for (let k = 0; k < 4; k++) {
      const spoke = new THREE.Mesh(medSpokeGeo, warmBronzeMat);
      spoke.position.set(mx, baseY + 0.022, mz);
      spoke.rotation.y = (k * Math.PI) / 4;
      spoke.userData.nonCollidable = true;
      group.add(spoke);
    }
  }

  // Pushkarini West Overlook Balustrade guarding the reflective pond edge (ldx = -3.15, ldz 7.8..25.2)
  const overlookRail = buildDetailedOverlookBalustrade(-3.15, 7.8, 25.2, 8, warmBronzeMat, giltGoldMat);
  group.add(overlookRail);

  // Carved speckled Himalayan granite, dark basalt & bronze Kalash trail bollards with draped chain swags
  const bollardCoords: Array<[number, number]> = [
    [-6.4, 48.5], [6.4, 48.5],
    [-6.4, 45.5], [6.4, 45.5],
    [-6.4, 42.5], [6.4, 42.5],
    [-6.4, 35.5], [6.4, 35.5],
    [-6.4, 32.5], [6.4, 32.5],
    [-4.1, 63.0], [4.1, 63.0],
    [-4.1, 72.2], [4.1, 72.2],
  ];
  const bollards = buildDetailedLumbiniBollards(bollardCoords, {
    baseY: 0.08,
    bronzeMat: warmBronzeMat,
    giltMat: giltGoldMat,
    chainLinks: [
      [0, 2], [2, 4],
      [1, 3], [3, 5],
      [6, 8],
      [7, 9],
    ],
  });
  group.add(bollards);

  // Detailed sculpted Himalayan granite & oiled Burmese teak heritage garden benches
  const addPilgrimBench = (bx: number, bz: number, rotY: number, withStonePad = false) => {
    if (withStonePad) {
      const pad = new THREE.Mesh(
        new THREE.BoxGeometry(Math.abs(Math.sin(rotY)) > 0.5 ? 1.55 : 2.55, 0.18, Math.abs(Math.sin(rotY)) > 0.5 ? 2.55 : 1.55),
        chunarStoneMat,
      );
      pad.position.set(bx, 0.01, bz);
      pad.receiveShadow = true;
      group.add(pad);
    }
    const bg = buildDetailedLumbiniBench();
    bg.position.set(bx, 0.10, bz);
    bg.rotation.y = rotY;
    group.add(bg);
  };
  addPilgrimBench(-7.6, 44.5, Math.PI * 0.5);
  addPilgrimBench(7.6, 44.5, -Math.PI * 0.5);
  addPilgrimBench(-7.6, 11.8, Math.PI * 0.5);
  addPilgrimBench(-7.6, 22.2, Math.PI * 0.5);
  addPilgrimBench(-14.5, 1.3, 0);
  addPilgrimBench(14.5, 1.3, 0);
  addPilgrimBench(-5.8, 70.0, Math.PI * 0.5, true);
  addPilgrimBench(5.8, 70.0, -Math.PI * 0.5, true);

  // (Red-roofed South Bridge Milepost Steles removed for a clean unobstructed temple approach.)

  // Trimmed Multi-Tiered Boxwood Hedges bordering red-brick garden paths (InstancedMesh)
  const hedgeCoords: Array<[number, number, number, number]> = [
    // [cx, cz, sx, sz]
    [-22.8, -9.2, 0.68, 17.5],
    [-22.8, -30.6, 0.68, 12.2],
    [-22.8, 16.6, 0.68, 19.6],
    [27.6, -16.8, 0.68, 39.2],
    [27.6, 16.6, 0.68, 19.6],
    [-33.4, 6.3, 19.8, 0.68],
    [35.6, 6.3, 15.6, 0.68],
    [-8.9, 35.4, 0.68, 7.0],
    [-8.9, 47.2, 0.68, 7.8],
    [8.9, 41.2, 0.68, 19.8],
    [-17.2, 32.85, 4.4, 0.68],
    [-9.9, 32.85, 2.0, 0.68],
    [16.4, 31.2, 13.8, 0.68],
  ];
  const realisticHedges = buildRealisticLumbiniHedges(
    hedgeCoords,
    brickMat,
    jTex.shrubFoliageMap,
    jTex.shrubFoliageNormal,
  );
  group.add(realisticHedges);

  // =========================================================================
  // 3. UNIFIED COMPLEX PERIMETER FENCING AROUND TEMPLE + SACRED LAKE + 4 PORTALS
  // =========================================================================
  // Dividing inner brick walls removed so Maya Devi lawns & Sacred Lake read as one
  // unified sacred sanctuary enclosed by an ornate outer heritage perimeter fence.
  const complexPerimeterFence = buildLumbiniComplexPerimeterFence({
    brickMat,
    chunarStoneMat,
    warmBronzeMat,
    giltGoldMat,
    terracottaCapMat,
  });
  group.add(complexPerimeterFence);

  // Cardinal Dharmachakra Torana Archways at South & North Inner Bridgehead Portals
  const southTorana = buildToranaGate(chunarStoneMat, brickMat, giltGoldMat, warmBronzeMat);
  southTorana.scale.setScalar(1.16);
  southTorana.position.set(0, 0.10, 51.8);
  const northTorana = buildToranaGate(chunarStoneMat, brickMat, giltGoldMat, warmBronzeMat);
  northTorana.scale.setScalar(1.16);
  northTorana.position.set(0, 0.10, -43.8);
  group.add(southTorana, northTorana);

  // Sculpted West & East Side Gate Stone Piers with stepped plinths, bronze reliefs, hip roofs & Gajur spires
  for (const gx of [-44.0, 44.0]) {
    for (const gz of [1.5, 6.5]) {
      const gatePier = new THREE.Group();
      gatePier.position.set(gx, 0.08, gz);
      const pBrick = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.30, 1.42), brickMat);
      pBrick.position.y = 0.15;
      pBrick.castShadow = true;
      pBrick.receiveShadow = true;
      const pStone = new THREE.Mesh(new THREE.BoxGeometry(1.20, 0.24, 1.20), chunarStoneMat);
      pStone.position.y = 0.42;
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.92, 2.08, 0.92), chunarStoneMat);
      shaft.position.y = 1.58;
      shaft.castShadow = true;
      const midBand = new THREE.Mesh(new THREE.BoxGeometry(1.00, 0.12, 1.00), warmBronzeMat);
      midBand.position.y = 1.58;
      for (const fx of [-0.47, 0.47]) {
        const ros = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 12), giltGoldMat);
        ros.rotation.z = Math.PI / 2;
        ros.position.set(fx, 1.98, 0);
        gatePier.add(ros);
      }
      const pCap = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.16, 1.16), chunarStoneMat);
      pCap.position.y = 2.70;
      const pRoof = new THREE.Mesh(createRectangularHipRoofGeometry(1.42, 0.42, 1.42, 0.48), terracottaCapMat);
      pRoof.position.y = 2.98;
      pRoof.castShadow = true;
      const pGajur = createDetailedGajurSpire(giltGoldMat, warmBronzeMat, 0.46);
      pGajur.position.y = 3.19;
      gatePier.add(pBrick, pStone, shaft, midBand, pCap, pRoof, pGajur);
      group.add(gatePier);
    }
  }

  // =========================================================================
  // 4. REAL-LIFE 2003 MAYA DEVI TEMPLE (36m x 24m, Centered North: 0, -22.0)
  // =========================================================================
  const mayaDevi = buildMayaDeviTemple(lTex, {
    whiteBrickMat,
    stuccoWhiteMat: whiteStuccoMat,
    brickMat,
    terracottaCapMat,
    chunarStoneMat,
    giltGoldMat,
    warmBronzeMat,
    darkMetalMat,
    timberMat,
    glassTintMat,
    flameGlowMat,
    heroMats,
  });
  mayaDevi.group.position.set(0, 0, -22.0);
  group.add(mayaDevi.group);
  beaconLights.push(...mayaDevi.beaconLights);
  animatedNodes.push(...mayaDevi.animatedNodes);
  cameraOccluders.push(...mayaDevi.cameraOccluders);

  // =========================================================================
  // 5. PUSHKARINI SACRED POND (+10.0, +16.5) & ASHOKA PILLAR (-27.0, -21.0)
  // =========================================================================
  const pushkarini = buildPushkariniPond(
    terracottaPaverMat,
    brickMat,
    chunarStoneMat,
    textures.waterNormal,
    isSoftwareGl,
  );
  pushkarini.position.set(10.0, 0.10, 16.5);
  group.add(pushkarini);
  const pushkariniTimeUniform = pushkarini.userData.waterTimeUniform as { value: number } | undefined;
  if (pushkariniTimeUniform) {
    const pushkariniWaterCtrl = new THREE.Object3D();
    pushkariniWaterCtrl.userData.noMerge = true;
    pushkariniWaterCtrl.userData.onFlickerUpdate = (elapsed: number) => {
      pushkariniTimeUniform.value = elapsed;
    };
    animatedNodes.push(pushkariniWaterCtrl);
  }

  const ashoka = buildAuthenticAshokaPillar(
    chunarStoneMat,
    brickMat,
    darkMetalMat,
    giltGoldMat,
    lTex.brahmiEdictMap,
    lTex.brahmiEdictNormal,
  );
  ashoka.scale.setScalar(1.22);
  ashoka.position.set(-27.0, 0.03, -21.0);
  group.add(ashoka);
  if (Array.isArray(ashoka.userData.cameraOccluderMeshes)) {
    cameraOccluders.push(...(ashoka.userData.cameraOccluderMeshes as THREE.Object3D[]));
  }

  // =========================================================================
  // 6. MONUMENTAL GOLDEN BABY BUDDHA (South Forecourt: 0, +39.0)
  // =========================================================================
  const babyBuddha = createMonumentalBabyBuddhaMonument(heroMats, hedgeMat, {
    shrubMap: jTex.shrubFoliageMap,
    shrubNormal: jTex.shrubFoliageNormal,
    waterNormal: textures.waterNormal,
  });
  babyBuddha.scale.setScalar(1.28);
  babyBuddha.position.set(0, 0.10, 39.0);
  const babyLight = new THREE.PointLight(0xffdca0, 2.4, 18, 1.3);
  babyLight.position.set(0, 6.2, 41.2);
  beaconLights.push(babyLight);
  group.add(babyBuddha, babyLight);

  // =========================================================================
  // 7. MYANMAR GOLDEN PAGODA (-32.2, +41.2) & ROYAL THAI SANCTUARY (+35.0, -22.0)
  // =========================================================================
  const myanmarPagoda = buildMyanmarGoldenPagoda(
    whiteStuccoMat,
    giltGoldMat,
    crimsonLacquerMat,
    chunarStoneMat,
    warmBronzeMat,
    darkMetalMat,
    flameGlowMat,
    heroMats,
  );
  myanmarPagoda.position.set(-32.2, 0.03, 41.2);
  if (typeof myanmarPagoda.userData.disposeExtraTextures === 'function') {
    extraDisposers.push(myanmarPagoda.userData.disposeExtraTextures as () => void);
  }
  myanmarPagoda.traverse((obj) => {
    if (obj instanceof THREE.PointLight) {
      beaconLights.push(obj);
    }
  });
  group.add(myanmarPagoda);

  const thaiSanctuary = buildThaiMarbleSanctuary(whiteMarbleMat, giltGoldMat, crimsonLacquerMat, heroMats);
  thaiSanctuary.group.scale.setScalar(1.12);
  thaiSanctuary.group.position.set(35.0, 0.03, -22.0);
  group.add(thaiSanctuary.group);
  beaconLights.push(thaiSanctuary.light);
  if (Array.isArray(thaiSanctuary.group.userData.cameraOccluderMeshes)) {
    cameraOccluders.push(...(thaiSanctuary.group.userData.cameraOccluderMeshes as THREE.Object3D[]));
  }

  // =========================================================================
  // 8. SACRED BODHI TREE (-29.0, +16.5) & ETERNAL PEACE FLAME (+35.0, +24.0)
  // =========================================================================
  const bodhi = buildSacredBodhiChautara(
    brickMat,
    whiteStuccoMat,
    timberMat,
    giltGoldMat,
    warmBronzeMat,
    flameGlowMat,
  );
  bodhi.scale.setScalar(1.35);
  bodhi.position.set(-29.0, 0.03, 16.5);
  group.add(bodhi);
  if (bodhi.userData.diyoLight instanceof THREE.PointLight) {
    beaconLights.push(bodhi.userData.diyoLight);
  }
  if (bodhi.userData.animatedLeaves instanceof THREE.Object3D) {
    animatedNodes.push(bodhi.userData.animatedLeaves);
  }
  if (Array.isArray(bodhi.userData.cameraOccluderMeshes)) {
    cameraOccluders.push(...(bodhi.userData.cameraOccluderMeshes as THREE.Object3D[]));
  }

  const peaceFlame = buildEternalPeaceFlame(
    chunarStoneMat,
    whiteMarbleMat,
    warmBronzeMat,
    giltGoldMat,
    flameGlowMat,
  );
  peaceFlame.group.scale.setScalar(1.22);
  peaceFlame.group.position.set(35.0, 0.03, 24.0);
  group.add(peaceFlame.group);
  animatedNodes.push(peaceFlame.flameNode);
  beaconLights.push(peaceFlame.light);

  // =========================================================================
  // 9. EXCAVATED MAURYAN BRICK RUINS, PEACE BELL PAVILION, PRAYER WHEELS & SHILALEKH
  // =========================================================================
  // Symmetrically aligned Mauryan archaeological stupa courtyard bays (clear of walks, hedges & lanterns)
  const ruinSpecs: Array<[number, number, number, number, number]> = [
    [-13.5, -5.0, 3.6, 1.05, 3.0],
    [13.5, -5.0, 3.6, 1.05, 3.0],
    [-32.5, -5.0, 3.6, 1.05, 3.0],
    [35.0, -5.0, 3.6, 1.05, 3.0],
    [-13.5, 13.5, 3.2, 0.96, 2.8],
    [-13.5, 20.5, 3.2, 0.96, 2.8],
    [35.0, 13.5, 3.2, 0.96, 2.8],
    [-32.5, -31.5, 3.8, 1.08, 3.0],
  ];
  ruinSpecs.forEach(([rx, rz, rw, rh, rd], idx) => {
    const ruin = buildExcavatedBrickRuin(archaeoBrickMat, rw, rh, rd, {
      stoneMat: chunarStoneMat,
      bronzeMat: warmBronzeMat,
      flameMat: flameGlowMat,
      variantIndex: idx,
    });
    ruin.position.set(rx, 0.03, rz);
    group.add(ruin);
  });

  // Detailed 4-Pillar Newari Timber & Terracotta-Tile Sacred Peace Bell Shrine (-13.0, +30.5)
  const bellPav = new THREE.Group();
  bellPav.scale.setScalar(1.15);
  bellPav.position.set(-13.0, 0.10, 30.5);

  const bellPlinth1 = new THREE.Mesh(new THREE.BoxGeometry(2.50, 0.18, 2.50), brickMat);
  bellPlinth1.position.y = 0.09;
  bellPlinth1.castShadow = true;
  bellPlinth1.receiveShadow = true;
  const bellPlinth2 = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.18, 2.08), chunarStoneMat);
  bellPlinth2.position.y = 0.27;
  bellPlinth2.castShadow = true;
  bellPlinth2.receiveShadow = true;
  const bellStep = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.16, 0.36), chunarStoneMat);
  bellStep.position.set(0, 0.08, 1.32);
  bellPav.add(bellPlinth1, bellPlinth2, bellStep);

  // 4 Carved timber pillars with stone column shoes, collar moldings & angled Newari Tundal struts
  const colOff = 0.74;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const cx = sx * colOff;
      const cz = sz * colOff;
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.28), chunarStoneMat);
      shoe.position.set(cx, 0.43, cz);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.105, 2.15, 12), timberMat);
      post.position.set(cx, 1.56, cz);
      post.castShadow = true;
      const midBand = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.020, 6, 12), warmBronzeMat);
      midBand.rotation.x = Math.PI / 2;
      midBand.position.set(cx, 1.48, cz);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.26), timberMat);
      cap.position.set(cx, 2.68, cz);
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.56, 0.09), timberMat);
      strut.position.set(cx + sx * 0.18, 2.52, cz + sz * 0.18);
      strut.rotation.z = -sx * 0.58;
      strut.rotation.x = sz * 0.58;
      bellPav.add(shoe, post, midBand, cap, strut);
    }
  }

  // Carved tie beams, perimeter architrave & central suspension yoke + brass chain
  for (const sz of [-colOff, colOff]) {
    const beamX = new THREE.Mesh(new THREE.BoxGeometry(1.90, 0.16, 0.18), timberMat);
    beamX.position.set(0, 2.78, sz);
    bellPav.add(beamX);
  }
  for (const sx of [-colOff, colOff]) {
    const beamZ = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 1.72), timberMat);
    beamZ.position.set(sx, 2.78, 0);
    bellPav.add(beamZ);
  }
  const bellCrossBeam = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.18, 0.22), timberMat);
  bellCrossBeam.position.set(0, 2.80, 0);
  const suspensionRing = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.020, 8, 16), giltGoldMat);
  suspensionRing.position.set(0, 2.66, 0);
  bellPav.add(bellCrossBeam, suspensionRing);

  // Double-tiered Newari terracotta hip roof with golden trim & bronze wind-chimes
  const bellEavesTrim = new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.08, 2.38), warmBronzeMat);
  bellEavesTrim.position.set(0, 2.89, 0);
  const bellRoof1 = new THREE.Mesh(createRectangularHipRoofGeometry(2.68, 0.52, 2.68, 0.56), terracottaCapMat);
  bellRoof1.position.set(0, 3.16, 0);
  bellRoof1.castShadow = true;
  const bellRoof2 = new THREE.Mesh(createRectangularHipRoofGeometry(1.64, 0.42, 1.64, 0.48), terracottaCapMat);
  bellRoof2.position.set(0, 3.58, 0);
  bellRoof2.castShadow = true;
  const bellGajur = createDetailedGajurSpire(giltGoldMat, warmBronzeMat, 0.44);
  bellGajur.position.set(0, 3.80, 0);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const chime = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.10, 6), giltGoldMat);
      chime.position.set(sx * 1.18, 2.79, sz * 1.18);
      bellPav.add(chime);
    }
  }

  const mainBell = createDetailedTempleBell(warmBronzeMat, giltGoldMat, 1.05);
  mainBell.position.set(0, 2.58, 0);
  templeBells.push(mainBell);
  bellPav.add(bellEavesTrim, bellRoof1, bellRoof2, bellGajur, mainBell);
  group.add(bellPav);

  // 4 Interactive Mani Prayer-Wheel Shrines: Baby Buddha Forecourt (x=±7.4, z=+39.0) & Maya Devi South Forecourt (x=±6.8, z=+1.8)
  const prayerWheelMat = new THREE.MeshStandardMaterial({
    map: jTex.prayerWheelMap,
    normalMap: jTex.prayerWheelNormal,
    roughnessMap: jTex.prayerWheelRough,
    color: 0xffd670,
    roughness: 0.30,
    metalness: 0.86,
  });
  const wheelBarrelGeo = new THREE.CylinderGeometry(0.215, 0.215, 0.48, 24);
  const wheelCapGeo = getDetailedPrayerWheelCapGeo();
  const wheelBellyRingGeo = new THREE.TorusGeometry(0.222, 0.020, 8, 24);
  const wheelFinialGeo = getDetailedParterreFinialGeo();
  const wheelAxleGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.96, 8);
  const wheelCollarGeo = new THREE.TorusGeometry(0.055, 0.012, 6, 14);
  const rackPostPts: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.095, 0.0),
    new THREE.Vector2(0.085, 0.14),
    new THREE.Vector2(0.068, 0.22),
    new THREE.Vector2(0.056, 0.72),
    new THREE.Vector2(0.072, 0.80),
    new THREE.Vector2(0.054, 1.38),
    new THREE.Vector2(0.088, 1.50),
    new THREE.Vector2(0.0, 1.54),
  ];
  const rackPostGeo = new THREE.LatheGeometry(rackPostPts, 12);

  const prayerWheelSpinners: THREE.Object3D[] = [];
  const prayerWheelRackConfigs: Array<{ x: number; z: number; spanZ: number; wheelOffsets: number[] }> = [
    { x: -7.4, z: 39.0, spanZ: 3.15, wheelOffsets: [-0.82, 0, 0.82] },
    { x: 7.4, z: 39.0, spanZ: 3.15, wheelOffsets: [-0.82, 0, 0.82] },
    { x: -6.8, z: 1.8, spanZ: 2.35, wheelOffsets: [-0.62, 0, 0.62] },
    { x: 6.8, z: 1.8, spanZ: 2.35, wheelOffsets: [-0.62, 0, 0.62] },
  ];

  for (const cfg of prayerWheelRackConfigs) {
    const rack = new THREE.Group();
    rack.position.set(cfg.x, 0.03, cfg.z);

    // Carved Chunar stone & brick tiered base
    const rStonePlinth = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.16, cfg.spanZ + 0.16), chunarStoneMat);
    rStonePlinth.position.y = 0.08;
    rStonePlinth.castShadow = true;
    rStonePlinth.receiveShadow = true;
    const rBrickTier = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.18, cfg.spanZ), brickMat);
    rBrickTier.position.y = 0.25;
    rBrickTier.castShadow = true;
    const rSill = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.06, cfg.spanZ + 0.06), chunarStoneMat);
    rSill.position.y = 0.37;
    const rBench = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.09, cfg.spanZ - 0.18), timberMat);
    rBench.position.y = 0.68;
    const rTopBeam = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.13, cfg.spanZ - 0.08), timberMat);
    rTopBeam.position.y = 1.84;
    const roofH = 0.44;
    const rRoof = new THREE.Mesh(
      createRectangularHipRoofGeometry(1.26, roofH, cfg.spanZ + 0.48, 0.56),
      terracottaCapMat,
    );
    rRoof.position.y = 1.91 + roofH * 0.5;
    rRoof.castShadow = true;
    const rRoofTrim = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.07, cfg.spanZ + 0.32), warmBronzeMat);
    rRoofTrim.position.y = 1.92;
    const rGajur = createDetailedGajurSpire(giltGoldMat, warmBronzeMat, 0.34);
    rGajur.position.y = 1.91 + roofH;
    rack.add(rStonePlinth, rBrickTier, rSill, rBench, rTopBeam, rRoof, rRoofTrim, rGajur);

    const postHalfZ = cfg.spanZ * 0.44;
    for (const px of [-0.26, 0.26]) {
      for (const pz of [-postHalfZ, postHalfZ]) {
        const post = new THREE.Mesh(rackPostGeo, timberMat);
        post.position.set(px, 0.38, pz);
        post.castShadow = true;
        rack.add(post);
      }
    }

    for (const wz of cfg.wheelOffsets) {
      const axle = new THREE.Mesh(wheelAxleGeo, warmBronzeMat);
      axle.position.set(0, 1.24, wz);
      const botBearing = new THREE.Mesh(wheelCollarGeo, warmBronzeMat);
      botBearing.rotation.x = Math.PI / 2;
      botBearing.position.set(0, 0.74, wz);
      const topBearing = new THREE.Mesh(wheelCollarGeo, warmBronzeMat);
      topBearing.rotation.x = Math.PI / 2;
      topBearing.position.set(0, 1.76, wz);
      rack.add(axle, botBearing, topBearing);

      const spinner = new THREE.Group();
      spinner.position.set(0, 1.24, wz);
      spinner.userData.noSpin = true;
      spinner.userData.noMerge = true;
      spinner.userData.prayerWheel = { angle: Math.abs(wz) * 1.4, velocity: 0.24 };

      const barrel = new THREE.Mesh(wheelBarrelGeo, prayerWheelMat);
      barrel.castShadow = true;
      const topCap = new THREE.Mesh(wheelCapGeo, giltGoldMat);
      topCap.scale.setScalar(0.88);
      topCap.position.y = 0.24;
      const botCap = new THREE.Mesh(wheelCapGeo, giltGoldMat);
      botCap.scale.setScalar(0.88);
      botCap.rotation.x = Math.PI;
      botCap.position.y = -0.24;
      const midRing = new THREE.Mesh(wheelBellyRingGeo, warmBronzeMat);
      midRing.rotation.x = Math.PI / 2;
      const topFinial = new THREE.Mesh(wheelFinialGeo, giltGoldMat);
      topFinial.scale.setScalar(0.55);
      topFinial.position.y = 0.36;

      spinner.add(barrel, topCap, botCap, midRing, topFinial);
      rack.add(spinner);
      animatedNodes.push(spinner);
      prayerWheelSpinners.push(spinner);
    }
    group.add(rack);
  }

  // Pond-margin pebble-toss interaction spots (no obtrusive bowls blocking temple walkways)
  const localPebbleSpecs: Array<[number, number, number, number, string]> = [
    [-3.6, 16.5, 5.0, 16.5, 'Pushkarini Pond'],
    [10.0, 7.6, 10.0, 15.0, 'Pushkarini Pond'],
    [-6.8, 53.6, -8.5, 55.0, 'Sacred Pond'],
  ];

  // Peace Garden Stone Lanterns neatly placed along lawn edges & axial gate curbs (every lantern actively lit!)
  for (const [lx, lz] of [
    [-7.4, 48.5], [7.4, 48.5],
    [-7.4, 33.0], [7.4, 33.0],
    [-4.2, -1.2], [4.2, -1.2],
    [-18.0, 0.8], [22.8, 0.8],
    [-20.8, -36.5], [25.7, -36.5],
    [22.2, 26.25], [-2.2, 26.25],
    [-8.95, 17.0], [-8.95, 7.2],
    [-4.6, 72.4], [4.6, 72.4],
    [-4.6, -64.4], [4.6, -64.4],
  ] as Array<[number, number]>) {
    if (Math.abs(lz) > 60) {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.18, 1.15), chunarStoneMat);
      pad.position.set(lx, 0.01, lz);
      pad.receiveShadow = true;
      group.add(pad);
    }
    const lantern = buildPeaceLantern(chunarStoneMat, warmBronzeMat, flameGlowMat);
    lantern.position.set(lx, 0.10, lz);
    const lLight = new THREE.PointLight(0xffb54d, 1.85, 19, 1.6);
    lLight.position.set(0, 1.92, 0);
    lLight.userData.intensityScale = 1.28;
    lLight.userData.flickerAmp = 0.08;
    lLight.userData.flickerPhase = lx * 0.37 + lz * 0.51;
    lLight.userData.warmFlicker = true;
    lantern.add(lLight);
    beaconLights.push(lLight);
    group.add(lantern);
  }

  // Waving 5-color Buddhist Lungta garlands anchored to heritage poles cleanly seated on promenade curbs
  const garlandPoleMat = new THREE.MeshStandardMaterial({
    color: 0x9c7446,
    roughness: 0.72,
    metalness: 0.14,
  });
  const sanctuaryGarlandSpecs: Array<[THREE.Vector3, THREE.Vector3, number, boolean]> = [
    [new THREE.Vector3(-9.6, 3.35, 48.5), new THREE.Vector3(-9.6, 3.35, 33.0), 12, true],
    [new THREE.Vector3(9.6, 3.35, 48.5), new THREE.Vector3(9.6, 3.35, 33.0), 12, true],
    [new THREE.Vector3(-42.5, 3.45, 1.4), new THREE.Vector3(-22.8, 3.45, 1.4), 14, true],
    [new THREE.Vector3(27.2, 3.45, 1.4), new THREE.Vector3(42.5, 3.45, 1.4), 11, true],
    [new THREE.Vector3(-30.5, 3.3, -24.5), new THREE.Vector3(-23.5, 3.3, -24.5), 7, true],
    [new THREE.Vector3(-16.2, 3.3, 27.2), new THREE.Vector3(-10.4, 3.3, 27.2), 6, true],
    [new THREE.Vector3(-5.6, 3.85, 72.4), new THREE.Vector3(5.6, 3.85, 72.4), 11, true],
    [new THREE.Vector3(-5.6, 3.85, -64.4), new THREE.Vector3(5.6, 3.85, -64.4), 11, true],
    [new THREE.Vector3(-10.0, 3.35, 17.0), new THREE.Vector3(-10.0, 3.35, 7.2), 9, true],
  ];
  for (const [startPt, endPt, count, poles] of sanctuaryGarlandSpecs) {
    const garland = createWavingPrayerFlagGarland(startPt, endPt, {
      flagCount: count,
      flagWidth: 0.36,
      flagHeight: 0.46,
      sag: 0.56,
      includePoles: poles,
      poleBaseGroundY: () => 0.09,
      poleMaterial: garlandPoleMat,
    });
    garland.group.userData.nonCollidable = true;
    group.add(garland.group);
  }

  // Drives shared GPU vertex-wave cloth animation synced to wind speed & direction
  const prayerFlagSync = new THREE.Object3D();
  prayerFlagSync.userData.noMerge = true;
  prayerFlagSync.userData.nonCollidable = true;
  prayerFlagSync.userData.isGlobalAnimation = true;
  prayerFlagSync.userData.onEnvironmentUpdate = (env: {
    elapsed: number;
    windX: number;
    windZ: number;
    windSpeed: number;
  }) => {
    updatePrayerFlagUniforms(env.elapsed, env.windX, env.windZ, env.windSpeed);
  };
  animatedNodes.push(prayerFlagSync);

  // Ornate Heritage Shilalekh Banner Pavilion at South-East Forecourt (+14.0, +46.5)
  const shilalekh = new THREE.Group();
  shilalekh.position.set(14.0, 0.03, 46.5);
  shilalekh.rotation.y = -0.28;
  const sBrickDais = new THREE.Mesh(new THREE.BoxGeometry(4.25, 0.22, 1.38), brickMat);
  sBrickDais.position.y = 0.11;
  sBrickDais.castShadow = true;
  sBrickDais.receiveShadow = true;
  const sBase = new THREE.Mesh(new THREE.BoxGeometry(3.84, 0.22, 1.06), chunarStoneMat);
  sBase.position.y = 0.33;
  sBase.castShadow = true;
  const sFrontStep = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.16, 0.42), chunarStoneMat);
  sFrontStep.position.set(0, 0.08, 0.78);
  shilalekh.add(sBrickDais, sBase, sFrontStep);

  for (const px of [-1.52, 1.52]) {
    const colShoe = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.42), chunarStoneMat);
    colShoe.position.set(px, 0.52, 0);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.142, 2.38, 16), chunarStoneMat);
    col.position.set(px, 1.76, 0);
    col.castShadow = true;
    const midCollar = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.022, 8, 16), warmBronzeMat);
    midCollar.rotation.x = Math.PI / 2;
    midCollar.position.set(px, 1.72, 0);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.16, 0.38), chunarStoneMat);
    cap.position.set(px, 2.94, 0);
    // Diagonal Newari Tundal brackets flanking column heads
    const bracketIn = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.46, 0.12), warmBronzeMat);
    bracketIn.position.set(px - Math.sign(px) * 0.20, 2.74, 0);
    bracketIn.rotation.z = Math.sign(px) * 0.62;
    shilalekh.add(colShoe, col, midCollar, cap, bracketIn);
  }
  const sPanelMat = new THREE.MeshStandardMaterial({
    map: lTex.shilalekhSignMap,
    roughness: 0.38,
    metalness: 0.14,
  });
  const sBoardFrame = new THREE.Mesh(new THREE.BoxGeometry(2.90, 1.50, 0.14), warmBronzeMat);
  sBoardFrame.position.set(0, 1.72, 0);
  const sBoard = new THREE.Mesh(new THREE.BoxGeometry(2.74, 1.36, 0.18), [
    chunarStoneMat,
    chunarStoneMat,
    chunarStoneMat,
    chunarStoneMat,
    sPanelMat,
    sPanelMat,
  ]);
  sBoard.position.set(0, 1.72, 0);
  sBoard.castShadow = true;
  for (const rx of [-1.36, 1.36]) {
    for (const ry of [1.04, 2.40]) {
      const boss = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.22, 10), giltGoldMat);
      boss.rotation.x = Math.PI / 2;
      boss.position.set(rx, ry, 0);
      shilalekh.add(boss);
    }
  }
  const sBeam = new THREE.Mesh(new THREE.BoxGeometry(3.52, 0.18, 0.62), chunarStoneMat);
  sBeam.position.set(0, 3.06, 0);
  const sSoffit = new THREE.Mesh(new THREE.BoxGeometry(3.72, 0.06, 1.18), warmBronzeMat);
  sSoffit.position.set(0, 3.16, 0);
  const sCanopyH = 0.66;
  const sCanopy = new THREE.Mesh(
    createRectangularHipRoofGeometry(4.02, sCanopyH, 1.48, 0.56),
    terracottaCapMat,
  );
  sCanopy.position.set(0, 3.19 + sCanopyH * 0.5, 0);
  sCanopy.castShadow = true;
  for (const bx of [-1.85, 1.85]) {
    for (const bz of [-0.62, 0.62]) {
      const bell = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.11, 8), giltGoldMat);
      bell.position.set(bx, 3.09, bz);
      shilalekh.add(bell);
    }
  }
  const sGajur = createDetailedGajurSpire(giltGoldMat, warmBronzeMat, 0.56);
  sGajur.position.set(0, 3.19 + sCanopyH, 0);
  shilalekh.add(sBoardFrame, sBoard, sBeam, sSoffit, sCanopy, sGajur);
  group.add(shilalekh);

  group.userData.templeBells = templeBells;
  group.userData.prayerWheelSpinners = prayerWheelSpinners;
  group.userData.babyButterLamps = babyBuddha.userData.butterLamps ?? [];
  group.userData.babyRitualLampLight = babyBuddha.userData.ritualLampLight ?? null;
  group.userData.mayaDeviHighlights = mayaDevi.group.userData.mayaDeviHighlights;
  group.userData.mayaDeviPlaqueHitTargets = mayaDevi.plaqueHitTargets;
  group.userData.pebbleSpots = localPebbleSpecs.map(([px, pz, pondX, pondZ, label]) => ({
    x: LUMBINI_SACRED_POND.centerX + px,
    z: LUMBINI_SACRED_POND.centerZ + pz,
    pondX: LUMBINI_SACRED_POND.centerX + pondX,
    pondZ: LUMBINI_SACRED_POND.centerZ + pondZ,
    label,
  }));
  group.userData.meditationSpots = [
    {
      x: LUMBINI_SACRED_POND.centerX - 24.0,
      z: LUMBINI_SACRED_POND.centerZ + 16.5,
      lookX: LUMBINI_PUSHKARINI_POND.centerX,
      lookZ: LUMBINI_PUSHKARINI_POND.centerZ,
      label: 'Sacred Bodhi Chautara',
    },
    {
      x: LUMBINI_SACRED_POND.centerX,
      z: LUMBINI_SACRED_POND.centerZ - 30.5,
      lookX: LUMBINI_SACRED_POND.centerX,
      lookZ: LUMBINI_SACRED_POND.centerZ - 22.0,
      label: 'Maya Devi Sanctum',
    },
  ];
  group.userData.lotusCount =
    (typeof pushkarini.userData.lotusCount === 'number' ? pushkarini.userData.lotusCount : 0) +
    (typeof surroundingPond.userData.lotusCount === 'number'
      ? surroundingPond.userData.lotusCount
      : 0);

  // Hit target encompassing entire expanded Lumbini Sacred Garden, Peace Canal & 21.8m Myanmar Golden Pagoda spire
  const hitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(158.0, 24.0, 146.0),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  hitMesh.position.set(-12.0, 12.0, 4.0);
  hitMesh.layers.set(1);
  group.add(hitMesh);

  for (const bell of templeBells) {
    bell.userData.noMerge = true;
  }
  const occluderSet = new Set<THREE.Object3D>(cameraOccluders);
  mergeStaticMeshesByMaterial(group, {
    occluderSet,
    cameraOccludersOut: cameraOccluders,
  });

  return { group, hitMesh, beaconLights, animatedNodes, cameraOccluders };
}

import * as THREE from 'three';
import {
  createDetailedGajurSpire,
  createDetailedTempleBell,
  createRectangularHipRoofGeometry,
} from './janakiMandirCraft';
import { BuddhaMaterials, createMonumentalBabyBuddhaMonument } from './lumbiniBuddhaSculpt';
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
import { createLumbiniTextures } from './lumbiniTextures';
import { createWavingPrayerFlagGarland, updatePrayerFlagUniforms } from './prayerFlags';
import { LandmarkBuildResult } from './proceduralModels';
import { ProceduralTextureSet } from './proceduralTextures';

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

  const lTex = createLumbiniTextures();
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
    color: 0xc26e4a,
    roughness: 0.92,
    metalness: 0.02,
  });

  const terracottaPaverMat = new THREE.MeshStandardMaterial({
    map: lTex.terracottaPaverMap,
    normalMap: lTex.terracottaPaverNormal,
    normalScale: new THREE.Vector2(0.78, 0.78),
    roughnessMap: lTex.terracottaPaverRough,
    color: 0xcc6b52,
    roughness: 0.86,
    metalness: 0.03,
  });

  const terracottaCapMat = new THREE.MeshStandardMaterial({
    color: 0xb63f2e,
    roughness: 0.72,
    metalness: 0.04,
  });

  const lawnMat = new THREE.MeshStandardMaterial({
    map: lTex.gardenLawnMap,
    normalMap: lTex.gardenLawnNormal,
    normalScale: new THREE.Vector2(0.65, 0.65),
    roughnessMap: lTex.gardenLawnRough,
    color: 0x6cb442,
    roughness: 0.94,
    metalness: 0.01,
  });

  const hedgeMat = new THREE.MeshStandardMaterial({
    map: lTex.hedgeLeafMap,
    normalMap: lTex.hedgeLeafNormal,
    normalScale: new THREE.Vector2(0.85, 0.85),
    color: 0x5ca430,
    roughness: 0.88,
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
    color: 0xcab08f,
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
  addBrickWalk(-8.5, 8.5, 28.0, 52.0); // Grand South Axial Forecourt (around Baby Buddha)
  addBrickWalk(-8.5, -3.2, 6.0, 28.0); // Continuous Pushkarini West Overlook Causeway -> Temple Forecourt
  addBrickWalk(-5.8, 5.8, -10.0, 2.0); // Expanded Maya Devi South Temple Forecourt
  addBrickWalk(-44.0, 44.0, 2.0, 6.0); // Grand East-West Cross Promenade between West & East Gates
  addBrickWalk(-3.4, 3.4, -2.5, 2.0); // Axial Temple Ramp Approach Spur
  addBrickWalk(-22.4, -19.2, -42.5, 30.8); // West Brick Garden Walk
  addBrickWalk(24.2, 27.2, -42.5, 30.8); // East Brick Garden Walk
  addBrickWalk(-19.2, 27.2, 27.2, 30.8); // South Pushkarini Pond Promenade
  addBrickWalk(-22.4, 27.2, -42.5, -38.5); // North Gate Cross Walk
  addBrickWalk(-3.4, 3.4, -44.0, -42.5); // North Torana Gate Threshold Spur
  addBrickWalk(-27.0, -22.4, -22.8, -19.2); // Ashoka Pillar Viewing Spur
  addBrickWalk(-20.4, 20.4, -36.8, -34.2); // Maya Devi North Circumambulation Walk
  // Monument Shrine Spur Trails connecting every pavilion cleanly to the main network
  addBrickWalk(-23.85, -8.5, 39.4, 43.0); // Myanmar Golden Pagoda spur aligned with East Pyatthat gate axis
  addBrickWalk(-19.2, -8.5, 28.8, 32.2); // Peace Bell Pavilion spur
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

  // Smooth outer Chunar sandstone transition aprons connecting Outer Promenades (ly=+0.09) down to roads (ly=+0.025)
  const addOuterRoadApron = (cx: number, cz: number, w: number, rotY: number) => {
    const apron = new THREE.Mesh(new THREE.BoxGeometry(w, 0.14, 1.55), chunarStoneMat);
    apron.position.set(cx, -0.01, cz);
    apron.rotation.y = rotY;
    apron.rotation.x = rotY === 0 ? 0.048 : rotY === Math.PI ? -0.048 : 0;
    if (Math.abs(Math.abs(rotY) - Math.PI * 0.5) < 0.1) {
      apron.rotation.z = rotY > 0 ? -0.048 : 0.048;
    }
    apron.receiveShadow = true;
    apron.userData.nonCollidable = true;
    group.add(apron);
  };
  addOuterRoadApron(0, 64.25, 6.8, 0);
  addOuterRoadApron(0, -56.25, 6.8, Math.PI);
  addOuterRoadApron(51.25, 4.0, 5.2, Math.PI * 0.5);
  addOuterRoadApron(-51.65, 4.0, 5.2, -Math.PI * 0.5);

  // Detailed Chunar Sandstone Curbs, Transverse Perspective Ribs & Lotus/Dharmachakra Trail Medallions
  const curbTransforms: Array<[number, number, number, number]> = [
    // South Forecourt & Overlook curbs
    [-8.55, 40.0, 0.22, 24.0],
    [8.55, 40.0, 0.22, 24.0],
    [-8.55, 17.0, 0.22, 22.0],
    [-3.25, 17.0, 0.22, 22.0],
    [-5.85, -4.0, 0.22, 12.0],
    [5.85, -4.0, 0.22, 12.0],
    // East-West Cross Promenade curbs
    [-26.2, 1.95, 35.6, 0.22],
    [26.2, 1.95, 35.6, 0.22],
    [-26.2, 6.05, 35.6, 0.22],
    [25.0, 6.05, 38.0, 0.22],
    // Transverse axial perspective ribs every 4m amplifying depth toward Maya Devi Temple
    ...[62.0, 50.0, 46.0, 34.0, 30.0].map((rz): [number, number, number, number] => [0, rz, 6.4, 0.28]),
    ...[8.0, 12.0, 16.0, 20.0, 24.0].map((rz): [number, number, number, number] => [-5.85, rz, 5.1, 0.26]),
    ...[0.0, -4.0, -8.0].map((rz): [number, number, number, number] => [0, rz, 7.6, 0.28]),
    ...[-34, -26, -18, -10, 10, 18, 26, 34, 41].map((rx): [number, number, number, number] => [rx, 4.0, 0.26, 3.8]),
    ...[-42, -30, -18, -8, 8, 18, 30, 42].map((rx): [number, number, number, number] => [rx, 61.9, 0.28, 3.1]),
  ];
  const unitStripGeo = new THREE.BoxGeometry(1, 0.04, 1);
  const curbInst = new THREE.InstancedMesh(unitStripGeo, chunarStoneMat, curbTransforms.length);
  curbInst.receiveShadow = true;
  curbInst.userData.nonCollidable = true;
  curbTransforms.forEach(([cx, cz, sx, sz], idx) => {
    _v3.set(cx, 0.095, cz);
    _q.identity();
    _s.set(sx, 1, sz);
    _m4.compose(_v3, _q, _s);
    curbInst.setMatrixAt(idx, _m4);
  });
  curbInst.instanceMatrix.needsUpdate = true;
  curbInst.computeBoundingSphere();
  group.add(curbInst);

  // Inlaid carved Chunar sandstone + bronze Lotus / Dharmachakra trail medallions along main axis
  const medRingGeo = new THREE.RingGeometry(0.62, 0.86, 24);
  medRingGeo.rotateX(-Math.PI / 2);
  const medCoreGeo = new THREE.CircleGeometry(0.42, 16);
  medCoreGeo.rotateX(-Math.PI / 2);
  for (const [mx, mz] of [
    [0, 61.9],
    [0, 49.0],
    [0, 31.0],
    [0, 4.0],
    [0, -1.0],
  ] as Array<[number, number]>) {
    const outerRing = new THREE.Mesh(medRingGeo, chunarStoneMat);
    outerRing.position.set(mx, 0.104, mz);
    outerRing.receiveShadow = true;
    outerRing.userData.nonCollidable = true;
    const innerDisc = new THREE.Mesh(medCoreGeo, warmBronzeMat);
    innerDisc.position.set(mx, 0.105, mz);
    innerDisc.receiveShadow = true;
    innerDisc.userData.nonCollidable = true;
    group.add(outerRing, innerDisc);
  }

  // Pushkarini West Overlook Balustrade guarding the reflective pond edge (ldx = -3.15, ldz 7.7..25.3)
  const overlookRail = new THREE.Group();
  for (let i = 0; i <= 8; i++) {
    const pz = 7.8 + (i / 8) * 17.4;
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.72, 0.18), chunarStoneMat);
    post.position.set(-3.15, 0.46, pz);
    post.castShadow = true;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), giltGoldMat);
    cap.position.set(-3.15, 0.86, pz);
    overlookRail.add(post, cap);
  }
  const overlookHandrail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 17.55), chunarStoneMat);
  overlookHandrail.position.set(-3.15, 0.78, 16.5);
  overlookHandrail.castShadow = true;
  overlookRail.add(overlookHandrail);
  group.add(overlookRail);

  // Brass-capped Chunar sandstone trail bollards flanking South Approach & Outer Promenade (InstancedMesh)
  const bollardCoords: Array<[number, number]> = [
    [-6.4, 48.5], [6.4, 48.5],
    [-6.4, 45.5], [6.4, 45.5],
    [-6.4, 42.5], [6.4, 42.5],
    [-6.4, 35.5], [6.4, 35.5],
    [-6.4, 32.5], [6.4, 32.5],
    [-9.5, 60.55], [9.5, 60.55],
    [-19.5, 60.55], [19.5, 60.55],
    [-29.5, 60.55], [29.5, 60.55],
    [-39.5, 60.55], [39.5, 60.55],
  ];
  const bollardPostGeo = new THREE.CylinderGeometry(0.085, 0.11, 0.68, 10);
  const bollardCapGeo = new THREE.SphereGeometry(0.095, 10, 8);
  const bollardPosts = new THREE.InstancedMesh(bollardPostGeo, chunarStoneMat, bollardCoords.length);
  const bollardCaps = new THREE.InstancedMesh(bollardCapGeo, giltGoldMat, bollardCoords.length);
  bollardPosts.castShadow = true;
  bollardPosts.userData.nonCollidable = true;
  bollardCaps.userData.nonCollidable = true;
  bollardCoords.forEach(([bx, bz], idx) => {
    _v3.set(bx, 0.42, bz);
    _q.identity();
    _s.setScalar(1);
    _m4.compose(_v3, _q, _s);
    bollardPosts.setMatrixAt(idx, _m4);
    _v3.set(bx, 0.78, bz);
    _m4.compose(_v3, _q, _s);
    bollardCaps.setMatrixAt(idx, _m4);
  });
  bollardPosts.instanceMatrix.needsUpdate = true;
  bollardCaps.instanceMatrix.needsUpdate = true;
  bollardPosts.computeBoundingSphere();
  bollardCaps.computeBoundingSphere();
  group.add(bollardPosts, bollardCaps);

  // Carved Chunar sandstone pilgrim meditation benches along paths & overlooks
  const addPilgrimBench = (bx: number, bz: number, rotY: number) => {
    const bg = new THREE.Group();
    bg.position.set(bx, 0.10, bz);
    bg.rotation.y = rotY;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.12, 0.56), chunarStoneMat);
    seat.position.y = 0.42;
    seat.castShadow = true;
    seat.receiveShadow = true;
    for (const lx of [-0.72, 0.72]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.38, 0.48), brickMat);
      leg.position.set(lx, 0.19, 0);
      leg.castShadow = true;
      bg.add(leg);
    }
    bg.add(seat);
    group.add(bg);
  };
  addPilgrimBench(-7.6, 44.5, Math.PI * 0.5);
  addPilgrimBench(7.6, 44.5, -Math.PI * 0.5);
  addPilgrimBench(-7.6, 11.8, Math.PI * 0.5);
  addPilgrimBench(-7.6, 22.2, Math.PI * 0.5);
  addPilgrimBench(-14.5, 1.3, 0);
  addPilgrimBench(14.5, 1.3, 0);
  addPilgrimBench(-15.5, 62.5, 0);
  addPilgrimBench(15.5, 62.5, 0);

  // Exterior Pilgrim Welcome Milepost Steles flanking South Bridge Entry (+-5.2, 64.2)
  for (const sx of [-5.2, 5.2]) {
    const stele = new THREE.Group();
    stele.position.set(sx, 0.08, 64.2);
    const sPed = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.34, 0.76), brickMat);
    sPed.position.y = 0.17;
    sPed.castShadow = true;
    const sSlab = new THREE.Mesh(new THREE.BoxGeometry(0.76, 1.48, 0.32), chunarStoneMat);
    sSlab.position.y = 1.08;
    sSlab.castShadow = true;
    const sCap = new THREE.Mesh(new THREE.ConeGeometry(0.58, 0.42, 4), terracottaCapMat);
    sCap.rotation.y = Math.PI / 4;
    sCap.position.y = 2.02;
    const sFin = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), giltGoldMat);
    sFin.position.y = 2.30;
    stele.add(sPed, sSlab, sCap, sFin);
    group.add(stele);
  }

  // Trimmed Vibrant Green Hedges bordering red-brick garden paths (InstancedMesh)
  const hedgeCoords: Array<[number, number, number, number]> = [
    // [cx, cz, sx, sz]
    [-22.8, -9.2, 0.68, 17.5],
    [-22.8, -30.6, 0.68, 12.2],
    [-22.8, 16.6, 0.68, 19.6],
    [27.6, -16.8, 0.68, 39.2],
    [27.6, 16.6, 0.68, 19.6],
    [-33.4, 6.3, 19.8, 0.68],
    [35.6, 6.3, 15.6, 0.68],
    [-8.9, 35.1, 0.68, 7.6],
    [-8.9, 47.2, 0.68, 7.8],
    [8.9, 41.2, 0.68, 19.8],
    [-16.4, 31.2, 13.8, 0.68],
    [16.4, 31.2, 13.8, 0.68],
  ];
  const unitBoxGeo = new THREE.BoxGeometry(1, 1, 1);
  const hedgeInst = new THREE.InstancedMesh(unitBoxGeo, hedgeMat, hedgeCoords.length);
  hedgeInst.castShadow = true;
  hedgeInst.receiveShadow = true;
  hedgeCoords.forEach(([hx, hz, sx, sz], idx) => {
    _v3.set(hx, 0.34, hz);
    _q.identity();
    _s.set(sx, 0.66, sz);
    _m4.compose(_v3, _q, _s);
    hedgeInst.setMatrixAt(idx, _m4);
  });
  hedgeInst.instanceMatrix.needsUpdate = true;
  hedgeInst.computeBoundingSphere();
  group.add(hedgeInst);

  // =========================================================================
  // 3. PERIMETER GARDEN BRICK WALL (88m x 96m) & 4 CARDINAL GATES
  // =========================================================================
  const addGardenWall = (cx: number, cz: number, sx: number, sz: number) => {
    const base = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.70, sz), brickMat);
    base.position.set(cx, 0.35, cz);
    base.castShadow = true;
    base.receiveShadow = true;
    const cap = new THREE.Mesh(new THREE.BoxGeometry(sx + 0.08, 0.14, sz + 0.08), chunarStoneMat);
    cap.position.set(cx, 0.77, cz);
    group.add(base, cap);
  };
  // South boundary (z = +52.0, gate |x| <= 3.4)
  addGardenWall(-23.7, 52.0, 40.6, 0.68);
  addGardenWall(23.7, 52.0, 40.6, 0.68);
  // North boundary (z = -44.0, gate |x| <= 3.4)
  addGardenWall(-23.7, -44.0, 40.6, 0.68);
  addGardenWall(23.7, -44.0, 40.6, 0.68);
  // West boundary (x = -44.0, gate z in [1.5, 6.5])
  addGardenWall(-44.0, -21.25, 0.68, 45.5);
  addGardenWall(-44.0, 29.25, 0.68, 45.5);
  // East boundary (x = +44.0, gate z in [1.5, 6.5])
  addGardenWall(44.0, -21.25, 0.68, 45.5);
  addGardenWall(44.0, 29.25, 0.68, 45.5);

  // Cardinal Dharmachakra Torana Archways at South & North Gates
  const southTorana = buildToranaGate(chunarStoneMat, brickMat, giltGoldMat, warmBronzeMat);
  southTorana.scale.setScalar(1.16);
  southTorana.position.set(0, 0.10, 51.8);
  const northTorana = buildToranaGate(chunarStoneMat, brickMat, giltGoldMat, warmBronzeMat);
  northTorana.scale.setScalar(1.16);
  northTorana.position.set(0, 0.10, -43.8);
  group.add(southTorana, northTorana);

  // West & East Side Gate Stone Piers
  for (const gx of [-44.0, 44.0]) {
    for (const gz of [1.5, 6.5]) {
      const pier = new THREE.Mesh(new THREE.BoxGeometry(1.05, 2.75, 1.05), chunarStoneMat);
      pier.position.set(gx, 1.38, gz);
      pier.castShadow = true;
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 10), giltGoldMat);
      orb.position.set(gx, 2.95, gz);
      group.add(pier, orb);
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

  // =========================================================================
  // 6. MONUMENTAL GOLDEN BABY BUDDHA (South Forecourt: 0, +39.0)
  // =========================================================================
  const babyBuddha = createMonumentalBabyBuddhaMonument(heroMats, hedgeMat);
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
  const ruinSpecs: Array<[number, number, number, number, number]> = [
    [-9.5, -3.5, 3.6, 1.05, 3.0],
    [9.5, -3.5, 4.0, 1.10, 3.2],
    [16.5, -3.2, 3.2, 0.96, 2.8],
    [-28.5, -8.0, 3.6, 1.02, 3.0],
    [-35.0, -3.5, 3.8, 1.12, 3.2],
    [-32.5, -32.0, 4.2, 1.15, 3.4],
    [33.5, -6.5, 3.4, 0.96, 2.8],
    [34.5, -0.5, 3.6, 1.02, 3.0],
    [-13.0, 13.5, 3.0, 0.92, 2.8],
    [-13.0, 20.5, 2.8, 0.88, 2.6],
    [-34.5, 26.5, 3.4, 0.98, 3.0],
    [35.0, 13.5, 3.2, 0.94, 2.8],
    [-14.5, -38.5, 3.4, 0.98, 2.8],
    [14.5, -38.5, 3.4, 0.98, 2.8],
  ];
  for (const [rx, rz, rw, rh, rd] of ruinSpecs) {
    const ruin = buildExcavatedBrickRuin(brickMat, rw, rh, rd);
    ruin.position.set(rx, 0.03, rz);
    group.add(ruin);
  }

  // Interactive Sacred Peace Bell Pavilion (-13.0, +30.5)
  const bellPav = new THREE.Group();
  bellPav.scale.setScalar(1.15);
  bellPav.position.set(-13.0, 0.10, 30.5);
  const bellBase = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.24, 2.0), chunarStoneMat);
  bellBase.position.y = 0.12;
  for (const sx of [-0.68, 0.68]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.45, 0.18), timberMat);
    post.position.set(sx, 1.46, 0);
    post.castShadow = true;
    bellPav.add(post);
  }
  const bellBeam = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.20, 0.28), timberMat);
  bellBeam.position.set(0, 2.74, 0);
  const bellRoof = new THREE.Mesh(createRectangularHipRoofGeometry(2.4, 0.62, 1.6, 0.52), terracottaCapMat);
  bellRoof.position.set(0, 3.15, 0);
  bellRoof.castShadow = true;
  const bellGajur = createDetailedGajurSpire(giltGoldMat, warmBronzeMat, 0.42);
  bellGajur.position.set(0, 3.46, 0);
  const mainBell = createDetailedTempleBell(warmBronzeMat, giltGoldMat, 1.05);
  mainBell.position.set(0, 2.60, 0);
  templeBells.push(mainBell);
  bellPav.add(bellBase, bellBeam, bellRoof, bellGajur, mainBell);
  group.add(bellPav);

  // 2 Spinning Mani Brass Prayer-Wheel Racks flanking Baby Buddha South Forecourt (x = +-7.4, z = +39.0)
  const prayerWheelMat = new THREE.MeshStandardMaterial({
    map: jTex.prayerWheelMap,
    normalMap: jTex.prayerWheelNormal,
    roughnessMap: jTex.prayerWheelRough,
    color: 0xffd670,
    roughness: 0.34,
    metalness: 0.85,
  });
  const prayerWheelSpinners: THREE.Object3D[] = [];
  for (const side of [-1, 1]) {
    const rack = new THREE.Group();
    rack.position.set(side * 7.4, 0.03, 39.0);
    const rBase = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.26, 3.2), brickMat);
    rBase.position.y = 0.13;
    rBase.castShadow = true;
    for (const pz of [-1.34, 1.34]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.54, 0.24), timberMat);
      post.position.set(0, 1.02, pz);
      rack.add(post);
    }
    const rRoof = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.20, 3.28), terracottaCapMat);
    rRoof.position.y = 1.86;
    rRoof.castShadow = true;
    rack.add(rBase, rRoof);
    for (const wz of [-0.82, 0, 0.82]) {
      const spinner = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.46, 16), prayerWheelMat);
      spinner.position.set(0, 1.12, wz);
      spinner.castShadow = true;
      spinner.userData.noSpin = true;
      spinner.userData.prayerWheel = { angle: Math.abs(wz), velocity: 0.22 };
      rack.add(spinner);
      animatedNodes.push(spinner);
      prayerWheelSpinners.push(spinner);
    }
    group.add(rack);
  }

  // Smooth river-pebble offering cairns beside Pushkarini Pond Overlook & South Steps for pebble tossing
  const pebblePileMat = new THREE.MeshStandardMaterial({ color: 0x7a7d80, roughness: 0.86 });
  const localPebbleSpecs: Array<[number, number, number, number, string]> = [
    [-5.5, 16.5, 5.0, 16.5, 'Pushkarini Pond'],
    [10.0, 6.4, 10.0, 15.0, 'Pushkarini Pond'],
    [-2.5, 52.8, -8.5, 55.0, 'Sacred Pond'],
  ];
  for (const [px, pz] of localPebbleSpecs) {
    const cairn = new THREE.Group();
    cairn.position.set(px, 0.12, pz);
    cairn.userData.nonCollidable = true;
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.24, 0.14, 10), chunarStoneMat);
    bowl.position.y = 0.07;
    cairn.add(bowl);
    for (let k = 0; k < 5; k++) {
      const ang = (k / 5) * Math.PI * 2;
      const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.085, 0), pebblePileMat);
      st.scale.set(1.2, 0.65, 1.0);
      st.position.set(Math.cos(ang) * 0.12, 0.15 + (k % 2) * 0.04, Math.sin(ang) * 0.12);
      cairn.add(st);
    }
    group.add(cairn);
  }

  // Peace Garden Stone Lanterns along axial red-brick walks, Pushkarini Overlook & Outer Sacred Bridges
  for (const [lx, lz] of [
    [-7.4, 48.5], [7.4, 48.5],
    [-7.4, 33.0], [7.4, 33.0],
    [-4.2, -1.2], [4.2, -1.2],
    [-18.0, 0.8], [22.8, 0.8],
    [-20.8, -36.5], [25.7, -36.5],
    [23.2, 28.5], [-8.5, 28.5],
    [-8.2, 17.0], [-8.2, 7.2],
    [-5.2, 62.6], [5.2, 62.6],
    [-5.2, -54.6], [5.2, -54.6],
  ] as Array<[number, number]>) {
    const lantern = buildPeaceLantern(chunarStoneMat, warmBronzeMat, flameGlowMat);
    lantern.position.set(lx, 0.10, lz);
    group.add(lantern);
  }

  // Waving 5-color Buddhist Lungta garlands along South Forecourt, Overlook & Outer Sacred Bridge Archways
  const sanctuaryGarlandSpecs: Array<[THREE.Vector3, THREE.Vector3, number, boolean]> = [
    [new THREE.Vector3(-7.4, 3.35, 48.5), new THREE.Vector3(-7.4, 3.35, 33.0), 12, true],
    [new THREE.Vector3(7.4, 3.35, 48.5), new THREE.Vector3(7.4, 3.35, 33.0), 12, true],
    [new THREE.Vector3(-42.5, 3.45, 1.4), new THREE.Vector3(-22.8, 3.45, 1.4), 14, true],
    [new THREE.Vector3(27.2, 3.45, 1.4), new THREE.Vector3(42.5, 3.45, 1.4), 11, true],
    [new THREE.Vector3(-30.5, 3.3, -24.5), new THREE.Vector3(-23.5, 3.3, -24.5), 7, true],
    [new THREE.Vector3(-14.6, 3.1, 28.6), new THREE.Vector3(-11.4, 3.1, 28.6), 5, true],
    [new THREE.Vector3(-5.2, 3.85, 62.6), new THREE.Vector3(5.2, 3.85, 62.6), 11, true],
    [new THREE.Vector3(-5.2, 3.85, -54.6), new THREE.Vector3(5.2, 3.85, -54.6), 11, true],
    [new THREE.Vector3(-8.2, 3.35, 17.0), new THREE.Vector3(-8.2, 3.35, 7.2), 9, true],
  ];
  for (const [startPt, endPt, count, poles] of sanctuaryGarlandSpecs) {
    const garland = createWavingPrayerFlagGarland(startPt, endPt, {
      flagCount: count,
      flagWidth: 0.36,
      flagHeight: 0.46,
      sag: 0.56,
      includePoles: poles,
      poleBaseGroundY: () => 0.08,
      poleMaterial: timberMat,
    });
    garland.group.userData.nonCollidable = true;
    group.add(garland.group);
  }

  // Drives shared GPU vertex-wave cloth animation synced to wind speed & direction
  const prayerFlagSync = new THREE.Object3D();
  prayerFlagSync.userData.noMerge = true;
  prayerFlagSync.userData.nonCollidable = true;
  prayerFlagSync.userData.onEnvironmentUpdate = (env: {
    elapsed: number;
    windX: number;
    windZ: number;
    windSpeed: number;
  }) => {
    updatePrayerFlagUniforms(env.elapsed, env.windX, env.windZ, env.windSpeed);
  };
  animatedNodes.push(prayerFlagSync);

  // Heritage Shilalekh Monument Stele at South-East Forecourt (+14.0, +46.5)
  const shilalekh = new THREE.Group();
  shilalekh.position.set(14.0, 0.03, 46.5);
  shilalekh.rotation.y = -0.28;
  const sBase = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.38, 1.04), chunarStoneMat);
  sBase.position.y = 0.19;
  sBase.castShadow = true;
  for (const px of [-1.48, 1.48]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 2.52, 12), chunarStoneMat);
    col.position.set(px, 1.62, 0);
    col.castShadow = true;
    shilalekh.add(col);
  }
  const sPanelMat = new THREE.MeshStandardMaterial({
    map: lTex.shilalekhSignMap,
    roughness: 0.42,
    metalness: 0.16,
  });
  const sBoard = new THREE.Mesh(new THREE.BoxGeometry(2.76, 1.38, 0.18), [
    chunarStoneMat,
    chunarStoneMat,
    chunarStoneMat,
    chunarStoneMat,
    sPanelMat,
    sPanelMat,
  ]);
  sBoard.position.set(0, 1.58, 0);
  sBoard.castShadow = true;
  const sBeam = new THREE.Mesh(new THREE.BoxGeometry(3.32, 0.16, 0.56), chunarStoneMat);
  sBeam.position.set(0, 2.90, 0);
  const sCanopyH = 0.62;
  const sCanopy = new THREE.Mesh(
    createRectangularHipRoofGeometry(3.88, sCanopyH, 1.42, 0.58),
    terracottaCapMat,
  );
  sCanopy.position.set(0, 2.98 + sCanopyH * 0.5, 0);
  sCanopy.castShadow = true;
  const sGajur = createDetailedGajurSpire(giltGoldMat, warmBronzeMat, 0.54);
  sGajur.position.set(0, 2.98 + sCanopyH, 0);
  shilalekh.add(sBase, sBoard, sBeam, sCanopy, sGajur);
  group.add(shilalekh);

  group.userData.templeBells = templeBells;
  group.userData.prayerWheelSpinners = prayerWheelSpinners;
  group.userData.mayaDeviHighlights = mayaDevi.group.userData.mayaDeviHighlights;
  group.userData.pebbleSpots = localPebbleSpecs.map(([px, pz, pondX, pondZ, label]) => ({
    x: -210 + px,
    z: 96 + pz,
    pondX: -210 + pondX,
    pondZ: 96 + pondZ,
    label,
  }));
  group.userData.meditationSpots = [
    { x: -234.0, z: 112.5, lookX: -200.0, lookZ: 112.5, label: 'Sacred Bodhi Chautara' },
    { x: -210.0, z: 65.5, lookX: -210.0, lookZ: 74.0, label: 'Maya Devi Sanctum' },
  ];
  group.userData.lotusCount =
    (typeof pushkarini.userData.lotusCount === 'number' ? pushkarini.userData.lotusCount : 0) +
    (typeof surroundingPond.userData.lotusCount === 'number'
      ? surroundingPond.userData.lotusCount
      : 0);

  // Hit target encompassing entire Lumbini Sacred Garden & 21.8m Myanmar Golden Pagoda spire
  const hitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(108.0, 23.5, 122.0),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  hitMesh.position.set(0, 11.75, 4.0);
  hitMesh.layers.set(1);
  group.add(hitMesh);

  return { group, hitMesh, beaconLights, animatedNodes, cameraOccluders };
}

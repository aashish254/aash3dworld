import * as THREE from 'three';
import {
  createDetailedBrassSukundaDiyo,
  createDetailedGajurSpire,
} from './janakiMandirCraft';
import { LumbiniTextureSet } from './lumbiniTextures';
import { createCarvedLotusPetalGeometry } from './mayaDeviSculptureGeo';

const _m4 = new THREE.Matrix4();
const _v3 = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _e = new THREE.Euler();

export interface MayaDeviStaircaseOptions {
  doorHalfW: number;
  doorH: number;
  wallT: number;
  rampZStart: number;
  rampZEnd: number;
  rampYStart: number;
  rampYEnd: number;
}

export interface MayaDeviStaircaseMats {
  chunarStoneMat: THREE.Material;
  giltGoldMat: THREE.Material;
  warmBronzeMat: THREE.Material;
  darkMetalMat: THREE.Material;
  timberMat: THREE.Material;
  flameGlowMat: THREE.Material;
}

/**
 * Builds a real-life, museum-grade carved Chunar sandstone & Newari bronze
 * ceremonial entrance stairway, Chandrasila Moonstone apron, draped woven velvet
 * runner with turned brass stair rods, multi-tier stone cheek walls, lathed stone
 * balusters, spandrel-anchored Dharmachakra jali panels, and Kalash guardian newel piers.
 */
export function buildMayaDeviStaircase(
  lTex: LumbiniTextureSet,
  mats: MayaDeviStaircaseMats,
  opts: MayaDeviStaircaseOptions,
): {
  group: THREE.Group;
  lampFlames: THREE.Object3D[];
} {
  const group = new THREE.Group();
  const lampFlames: THREE.Object3D[] = [];

  const { doorHalfW, doorH, wallT, rampZStart, rampZEnd, rampYStart, rampYEnd } = opts;
  const rampSpanZ = rampZStart - rampZEnd; // 8.0m
  const rampRise = rampYEnd - rampYStart; // 0.90m
  const rampAngle = Math.atan2(rampRise, rampSpanZ);
  const rampHyp = Math.hypot(rampSpanZ, rampRise);

  // Dedicated high-detail PBR materials for stone masonry, carved friezes & woven runner
  const stairStoneMat = new THREE.MeshStandardMaterial({
    map: lTex.stairStoneMap,
    normalMap: lTex.stairStoneNormal,
    normalScale: new THREE.Vector2(1.15, 1.15),
    roughnessMap: lTex.stairStoneRough,
    color: 0xffffff,
    roughness: 0.78,
    metalness: 0.03,
  });

  const darkStoneMat = new THREE.MeshStandardMaterial({
    map: lTex.chunarStoneMap,
    normalMap: lTex.chunarStoneNormal,
    normalScale: new THREE.Vector2(0.95, 0.95),
    roughnessMap: lTex.chunarStoneRough,
    color: 0x8f7458,
    roughness: 0.88,
    metalness: 0.04,
  });

  const carvedFriezeMat = new THREE.MeshStandardMaterial({
    map: lTex.carvedFriezeMap,
    normalMap: lTex.carvedFriezeNormal,
    normalScale: new THREE.Vector2(1.85, 1.85),
    roughnessMap: lTex.chunarStoneRough,
    color: 0xffffff,
    roughness: 0.78,
    metalness: 0.04,
  });

  const velvetRunnerMat = new THREE.MeshStandardMaterial({
    map: lTex.velvetRunnerMap,
    normalMap: lTex.velvetRunnerNormal,
    normalScale: new THREE.Vector2(1.1, 1.1),
    roughnessMap: lTex.velvetRunnerRough,
    color: 0xffffff,
    roughness: 0.92,
    metalness: 0.02,
  });

  const moonstoneMat = new THREE.MeshStandardMaterial({
    map: lTex.moonstoneMap,
    normalMap: lTex.moonstoneNormal,
    normalScale: new THREE.Vector2(1.75, 1.75),
    roughnessMap: lTex.moonstoneRough,
    color: 0xffffff,
    roughness: 0.76,
    metalness: 0.04,
  });

  // =========================================================================
  // 1. SMOOTH COLLISION WALK-RAMP CORE (recessed cleanly under visual stone treads)
  // =========================================================================
  const rampShape = new THREE.Shape();
  rampShape.moveTo(-rampZStart, -0.10);
  rampShape.lineTo(-rampZEnd, -0.10);
  rampShape.lineTo(-rampZEnd, rampYEnd - 0.032);
  rampShape.lineTo(-rampZStart, rampYStart - 0.032);
  rampShape.closePath();

  const rampGeo = new THREE.ExtrudeGeometry(rampShape, {
    depth: doorHalfW * 2 + 0.10,
    bevelEnabled: false,
  });
  rampGeo.translate(0, 0, -(doorHalfW + 0.05));
  rampGeo.rotateY(Math.PI * 0.5);
  rampGeo.computeVertexNormals();
  const rampMesh = new THREE.Mesh(rampGeo, darkStoneMat);
  rampMesh.castShadow = false;
  rampMesh.receiveShadow = true;
  group.add(rampMesh);

  // =========================================================================
  // 2. CARVED CHANDRASILA (MOONSTONE) THRESHOLD PLAZA & VOLUTE APRON
  // =========================================================================
  const apronGroup = new THREE.Group();
  apronGroup.position.set(0, rampYStart, rampZStart);
  apronGroup.userData.nonCollidable = true;

  // Wide dressed sandstone plaza threshold slab seated cleanly above terracotta pavers (y = 0.10 -> 0.128)
  const plazaSlab = new THREE.Mesh(new THREE.BoxGeometry(5.16, 0.028, 2.38), stairStoneMat);
  plazaSlab.position.set(0, 0.014, 1.18);
  plazaSlab.receiveShadow = true;
  apronGroup.add(plazaSlab);

  // Chamfered perimeter stone border courses framing the threshold apron
  const borderLong = new THREE.Mesh(new THREE.BoxGeometry(5.26, 0.034, 0.16), darkStoneMat);
  borderLong.position.set(0, 0.017, 2.34);
  borderLong.receiveShadow = true;
  apronGroup.add(borderLong);
  for (const side of [-1, 1]) {
    const borderSide = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.034, 2.38), darkStoneMat);
    borderSide.position.set(side * 2.54, 0.017, 1.18);
    borderSide.receiveShadow = true;
    apronGroup.add(borderSide);
  }

  // Semicircular Carved Chandrasila Mandala Disc (oriented +Z outward onto plaza)
  const moonDiscGeo = new THREE.CylinderGeometry(1.76, 1.82, 0.024, 36, 1, false, -Math.PI * 0.5, Math.PI);
  const moonDisc = new THREE.Mesh(moonDiscGeo, moonstoneMat);
  moonDisc.position.set(0, 0.032, 0.04);
  moonDisc.receiveShadow = true;
  apronGroup.add(moonDisc);

  // Helper for solid 3D extruded half-annulus stone curbs & inlaid bronze bands (zero thin-plane Z-fighting!)
  const makeHalfRingGeo = (rInner: number, rOuter: number, depth: number) => {
    const s = new THREE.Shape();
    s.absarc(0, 0, rOuter, 0, Math.PI, false);
    s.absarc(0, 0, rInner, Math.PI, 0, true);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 36 });
    g.rotateX(Math.PI * 0.5);
    g.computeVertexNormals();
    return g;
  };

  // Outer stepped stone curb (y = 0.028 .. 0.052) + middle bronze ring + inner gold ring
  const moonCurb = new THREE.Mesh(makeHalfRingGeo(1.73, 1.90, 0.024), darkStoneMat);
  moonCurb.position.set(0, 0.052, 0.04);
  moonCurb.receiveShadow = true;

  const moonInlay = new THREE.Mesh(makeHalfRingGeo(1.28, 1.36, 0.012), mats.warmBronzeMat);
  moonInlay.position.set(0, 0.051, 0.04);

  const moonInnerInlay = new THREE.Mesh(makeHalfRingGeo(0.75, 0.80, 0.012), mats.giltGoldMat);
  moonInnerInlay.position.set(0, 0.052, 0.04);
  apronGroup.add(moonCurb, moonInlay, moonInnerInlay);

  // 13 Real 3D Carved Stone Lotus Petals fanned in crisp bas-relief around inner Chandrasila
  const moonPetalGeo = createCarvedLotusPetalGeometry(0.115, 0.32, 0.026);
  const moonPetalCount = 13;
  const moonPetalInst = new THREE.InstancedMesh(moonPetalGeo, mats.chunarStoneMat, moonPetalCount);
  for (let i = 0; i < moonPetalCount; i++) {
    const a = (i / (moonPetalCount - 1)) * Math.PI * 0.88 + Math.PI * 0.06;
    const rad = 0.50;
    _v3.set(Math.cos(a) * rad, 0.054, 0.04 + Math.sin(a) * rad);
    _q.setFromEuler(_e.set(Math.PI * 0.46, -a + Math.PI * 0.5, 0, 'YXZ'));
    _s.set(1.0, 1.0, 1.15);
    _m4.compose(_v3, _q, _s);
    moonPetalInst.setMatrixAt(i, _m4);
  }
  moonPetalInst.instanceMatrix.needsUpdate = true;
  moonPetalInst.computeBoundingSphere();
  moonPetalInst.receiveShadow = true;
  apronGroup.add(moonPetalInst);

  // Central carved half-lotus seed-pod boss at step threshold
  const halfPod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.36, 0.036, 20, 1, false, -Math.PI * 0.5, Math.PI),
    mats.chunarStoneMat,
  );
  halfPod.position.set(0, 0.046, 0.04);
  apronGroup.add(halfPod);

  group.add(apronGroup);

  // =========================================================================
  // 3. 16 CARVED SANDSTONE STEPS (JOINTED SLABS, PROFILED BULLNOSE, SCOTIA,
  //    CARVED RELIEF RISERS, CASCADING VELVET RUNNER & BRASS STAIR RODS)
  // =========================================================================
  const stairCount = 16;
  const stepRun = rampSpanZ / stairCount; // 0.50m
  const stepRise = rampRise / stairCount; // 0.05625m
  const stairW = doorHalfW * 2 - 0.04; // 3.76m
  const runnerW = 1.44;
  const wingW = (stairW - runnerW) * 0.5 - 0.01; // ~1.15m per side

  // Shared geometries for instancing & clean draw calls
  const centerSlabGeo = new THREE.BoxGeometry(runnerW + 0.24, 0.034, stepRun + 0.048);
  const wingSlabGeo = new THREE.BoxGeometry(wingW - 0.12, 0.034, stepRun + 0.048);
  const jointGrooveGeo = new THREE.BoxGeometry(0.014, 0.030, stepRun + 0.042);

  const bullnoseGeo = new THREE.CylinderGeometry(0.019, 0.019, stairW + 0.02, 12);
  bullnoseGeo.rotateZ(Math.PI * 0.5);

  const scotiaGeo = new THREE.BoxGeometry(stairW - 0.04, 0.016, 0.024);
  const riserPanelGeo = new THREE.BoxGeometry(stairW - 0.14, stepRise + 0.008, 0.028);
  const riserStileGeo = new THREE.BoxGeometry(0.11, stepRise + 0.012, 0.036);

  const runnerTreadGeo = new THREE.BoxGeometry(runnerW, 0.012, stepRun + 0.024);
  const runnerBullnoseGeo = new THREE.CylinderGeometry(0.022, 0.022, runnerW, 12, 1, false, 0, Math.PI);
  runnerBullnoseGeo.rotateZ(Math.PI * 0.5);
  const runnerRiserGeo = new THREE.BoxGeometry(runnerW, stepRise + 0.012, 0.012);

  const brassRodGeo = new THREE.CylinderGeometry(0.010, 0.010, runnerW + 0.08, 10);
  brassRodGeo.rotateZ(Math.PI * 0.5);
  const rodFinialGeo = new THREE.SphereGeometry(0.017, 10, 8);
  const riserStudGeo = new THREE.CylinderGeometry(0.018, 0.022, 0.016, 10);
  riserStudGeo.rotateX(Math.PI * 0.5);

  const centerSlabs: THREE.Matrix4[] = [];
  const wingSlabs: THREE.Matrix4[] = [];
  const jointGrooves: THREE.Matrix4[] = [];
  const bullnoses: THREE.Matrix4[] = [];
  const scotias: THREE.Matrix4[] = [];
  const risers: THREE.Matrix4[] = [];
  const riserStiles: THREE.Matrix4[] = [];
  const runnerTreads: THREE.Matrix4[] = [];
  const runnerBullnoses: THREE.Matrix4[] = [];
  const runnerRisers: THREE.Matrix4[] = [];
  const brassRods: THREE.Matrix4[] = [];
  const rodFinials: THREE.Matrix4[] = [];
  const riserStuds: THREE.Matrix4[] = [];

  for (let s = 0; s < stairCount; s++) {
    const stepTopY = rampYStart + (s + 1) * stepRise;
    const stepCenterZ = rampZStart - (s + 0.5) * stepRun;
    const frontEdgeZ = stepCenterZ + stepRun * 0.5;

    _q.identity();
    _s.setScalar(1);

    // 3 jointed ashlar stone slabs across the tread width
    _v3.set(0, stepTopY - 0.017, stepCenterZ + 0.008);
    centerSlabs.push(new THREE.Matrix4().compose(_v3, _q, _s));

    for (const side of [-1, 1]) {
      const wx = side * (runnerW * 0.5 + 0.12 + (wingW - 0.12) * 0.5 + 0.01);
      _v3.set(wx, stepTopY - 0.017, stepCenterZ + 0.008);
      wingSlabs.push(new THREE.Matrix4().compose(_v3, _q, _s));

      // Expansion joint reveal between center & wing slabs
      _v3.set(side * (runnerW * 0.5 + 0.122), stepTopY - 0.018, stepCenterZ + 0.008);
      jointGrooves.push(new THREE.Matrix4().compose(_v3, _q, _s));

      // Riser flanking stone stiles & cast bronze rosette studs
      _v3.set(side * (stairW * 0.5 - 0.06), stepTopY - stepRise * 0.5 - 0.016, frontEdgeZ - 0.006);
      riserStiles.push(new THREE.Matrix4().compose(_v3, _q, _s));

      for (const frac of [0.35, 0.72]) {
        const sx = side * (runnerW * 0.5 + frac * (stairW * 0.5 - runnerW * 0.5 - 0.12));
        _v3.set(sx, stepTopY - stepRise * 0.52 - 0.012, frontEdgeZ + 0.006);
        riserStuds.push(new THREE.Matrix4().compose(_v3, _q, _s));
      }
    }

    // Profiled bullnose lip + recessed undercut scotia shadow molding
    _v3.set(0, stepTopY - 0.019, frontEdgeZ + 0.024);
    bullnoses.push(new THREE.Matrix4().compose(_v3, _q, _s));

    _v3.set(0, stepTopY - 0.036, frontEdgeZ + 0.008);
    scotias.push(new THREE.Matrix4().compose(_v3, _q, _s));

    // Carved floral lotus-scroll relief riser panel
    _v3.set(0, stepTopY - stepRise * 0.5 - 0.016, frontEdgeZ - 0.008);
    risers.push(new THREE.Matrix4().compose(_v3, _q, _s));

    // Continuous cascading woven velvet runner (tread + bullnose wrap + vertical riser drop)
    _v3.set(0, stepTopY + 0.004, stepCenterZ + 0.008);
    runnerTreads.push(new THREE.Matrix4().compose(_v3, _q, _s));

    _v3.set(0, stepTopY - 0.012, frontEdgeZ + 0.025);
    runnerBullnoses.push(new THREE.Matrix4().compose(_v3, _q, _s));

    _v3.set(0, stepTopY - stepRise * 0.5 - 0.014, frontEdgeZ + 0.008);
    runnerRisers.push(new THREE.Matrix4().compose(_v3, _q, _s));

    // Turned brass stair rod & twin acorn clasp brackets at tread-riser crease
    const creaseZ = stepCenterZ - stepRun * 0.5 + 0.018;
    const rodY = stepTopY + 0.012;
    _v3.set(0, rodY, creaseZ);
    brassRods.push(new THREE.Matrix4().compose(_v3, _q, _s));

    for (const side of [-1, 1]) {
      _v3.set(side * (runnerW * 0.5 + 0.048), rodY, creaseZ);
      rodFinials.push(new THREE.Matrix4().compose(_v3, _q, _s));
    }
  }

  const addInstancedGroup = (
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    matrices: THREE.Matrix4[],
    castShadow = true,
  ) => {
    const inst = new THREE.InstancedMesh(geo, mat, matrices.length);
    for (let i = 0; i < matrices.length; i++) inst.setMatrixAt(i, matrices[i]);
    inst.instanceMatrix.needsUpdate = true;
    inst.computeBoundingSphere();
    inst.castShadow = castShadow;
    inst.receiveShadow = true;
    inst.userData.nonCollidable = true;
    group.add(inst);
    return inst;
  };

  addInstancedGroup(centerSlabGeo, stairStoneMat, centerSlabs, true);
  addInstancedGroup(wingSlabGeo, stairStoneMat, wingSlabs, true);
  addInstancedGroup(jointGrooveGeo, darkStoneMat, jointGrooves, false);
  addInstancedGroup(bullnoseGeo, stairStoneMat, bullnoses, true);
  addInstancedGroup(scotiaGeo, darkStoneMat, scotias, false);
  addInstancedGroup(riserPanelGeo, carvedFriezeMat, risers, false);
  addInstancedGroup(riserStileGeo, darkStoneMat, riserStiles, true);
  addInstancedGroup(runnerTreadGeo, velvetRunnerMat, runnerTreads, false);
  addInstancedGroup(runnerBullnoseGeo, velvetRunnerMat, runnerBullnoses, false);
  addInstancedGroup(runnerRiserGeo, velvetRunnerMat, runnerRisers, false);
  addInstancedGroup(brassRodGeo, mats.giltGoldMat, brassRods, true);
  addInstancedGroup(rodFinialGeo, mats.warmBronzeMat, rodFinials, false);
  addInstancedGroup(riserStudGeo, mats.warmBronzeMat, riserStuds, false);

  // =========================================================================
  // 4. PORTAL THRESHOLD LANDING, CARVED SILL & ARCHITRAVE CROWN (z = +12.0)
  // =========================================================================
  const thresholdSill = new THREE.Mesh(
    new THREE.BoxGeometry(doorHalfW * 2 - 0.06, 0.22, wallT + 0.28),
    stairStoneMat,
  );
  thresholdSill.position.set(0, rampYEnd - 0.10, rampZEnd - wallT * 0.5);
  thresholdSill.receiveShadow = true;
  thresholdSill.castShadow = true;
  const thresholdBrassPlate = new THREE.Mesh(
    new THREE.BoxGeometry(doorHalfW * 2 - 0.34, 0.020, 0.28),
    mats.giltGoldMat,
  );
  thresholdBrassPlate.position.set(0, rampYEnd + 0.011, rampZEnd - 0.04);
  thresholdBrassPlate.userData.nonCollidable = true;
  const portalHeaderCornice = new THREE.Mesh(
    new THREE.BoxGeometry(doorHalfW * 2 + 0.90, 0.24, 0.36),
    stairStoneMat,
  );
  portalHeaderCornice.position.set(0, doorH + 0.12, rampZEnd + 0.06);
  portalHeaderCornice.castShadow = true;
  portalHeaderCornice.userData.nonCollidable = true;
  const portalHeaderBrass = new THREE.Mesh(
    new THREE.BoxGeometry(doorHalfW * 2 + 0.62, 0.06, 0.38),
    mats.giltGoldMat,
  );
  portalHeaderBrass.position.set(0, doorH + 0.24, rampZEnd + 0.06);
  portalHeaderBrass.userData.nonCollidable = true;
  group.add(thresholdSill, thresholdBrassPlate, portalHeaderCornice, portalHeaderBrass);

  // =========================================================================
  // 5. LAYERED STONE CHEEK-WALLS, LATHED BALUSTERS, ANCHORED DHARMACHAKRA
  //    JALI SCREENS, CURVED VOLUTES & GUARDIAN KALASH NEWEL PIERS
  // =========================================================================
  // Profiled ExtrudeGeometry Handrail Cross-Section (molded top cap with side drip grooves)
  const handrailSpan = rampHyp - 0.44;
  const railProfile = new THREE.Shape();
  railProfile.moveTo(-0.11, -0.045);
  railProfile.lineTo(0.11, -0.045);
  railProfile.lineTo(0.11, -0.015);
  railProfile.lineTo(0.088, -0.008);
  railProfile.lineTo(0.118, 0.012);
  railProfile.lineTo(0.118, 0.040);
  railProfile.lineTo(0.072, 0.068);
  railProfile.lineTo(-0.072, 0.068);
  railProfile.lineTo(-0.118, 0.040);
  railProfile.lineTo(-0.118, 0.012);
  railProfile.lineTo(-0.088, -0.008);
  railProfile.lineTo(-0.11, -0.015);
  railProfile.closePath();

  const handrailExtrudeGeo = new THREE.ExtrudeGeometry(railProfile, {
    depth: handrailSpan,
    bevelEnabled: false,
  });
  handrailExtrudeGeo.translate(0, 0, -handrailSpan * 0.5);
  handrailExtrudeGeo.computeVertexNormals();

  // Sloped Carved Stone Cheek-Wall Wedge sitting cleanly on ground (z = +20 -> +12)
  const cheekShape = new THREE.Shape();
  cheekShape.moveTo(-rampZStart - 0.05, 0.02);
  cheekShape.lineTo(-rampZEnd + 0.05, 0.02);
  cheekShape.lineTo(-rampZEnd + 0.05, rampYEnd + 0.16);
  cheekShape.lineTo(-rampZStart - 0.05, rampYStart + 0.16);
  cheekShape.closePath();
  const cheekGeo = new THREE.ExtrudeGeometry(cheekShape, {
    depth: 0.34,
    bevelEnabled: true,
    bevelSize: 0.015,
    bevelThickness: 0.015,
    bevelSegments: 2,
  });
  cheekGeo.translate(0, 0, -0.17);
  cheekGeo.rotateY(Math.PI * 0.5);
  cheekGeo.computeVertexNormals();

  // Curved Stone Cheek-Wall Scroll Volute sweeping forward beside Foot Newel Pier
  const voluteShape = new THREE.Shape();
  voluteShape.moveTo(0, 0);
  voluteShape.lineTo(0.86, 0);
  voluteShape.quadraticCurveTo(0.92, 0.24, 0.66, 0.36);
  voluteShape.quadraticCurveTo(0.38, 0.44, 0.16, 0.72);
  voluteShape.lineTo(0, 0.78);
  voluteShape.closePath();
  const voluteGeo = new THREE.ExtrudeGeometry(voluteShape, {
    depth: 0.26,
    bevelEnabled: true,
    bevelSize: 0.018,
    bevelThickness: 0.018,
    bevelSegments: 2,
  });
  voluteGeo.translate(0, 0, -0.13);
  voluteGeo.rotateY(-Math.PI * 0.5);
  voluteGeo.computeVertexNormals();

  // Classical Turned Architectural Stone Baluster (LatheGeometry, height = 0.76m)
  const balusterPts: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.088, 0.0),
    new THREE.Vector2(0.088, 0.055),
    new THREE.Vector2(0.068, 0.075),
    new THREE.Vector2(0.074, 0.105),
    new THREE.Vector2(0.050, 0.135),
    new THREE.Vector2(0.080, 0.265),
    new THREE.Vector2(0.074, 0.385),
    new THREE.Vector2(0.044, 0.515),
    new THREE.Vector2(0.058, 0.555),
    new THREE.Vector2(0.042, 0.595),
    new THREE.Vector2(0.076, 0.655),
    new THREE.Vector2(0.088, 0.690),
    new THREE.Vector2(0.088, 0.735),
    new THREE.Vector2(0.0, 0.735),
  ];
  const balusterGeo = new THREE.LatheGeometry(balusterPts, 18);
  balusterGeo.computeVertexNormals();

  // Fluted Sacred Kalash Urn Finial for Guardian Foot Piers (LatheGeometry)
  const kalashUrnPts: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.155, 0.0),
    new THREE.Vector2(0.165, 0.032),
    new THREE.Vector2(0.120, 0.065),
    new THREE.Vector2(0.102, 0.092),
    new THREE.Vector2(0.175, 0.165),
    new THREE.Vector2(0.192, 0.235),
    new THREE.Vector2(0.145, 0.305),
    new THREE.Vector2(0.082, 0.355),
    new THREE.Vector2(0.118, 0.395),
    new THREE.Vector2(0.095, 0.415),
    new THREE.Vector2(0.0, 0.415),
  ];
  const kalashUrnGeo = new THREE.LatheGeometry(kalashUrnPts, 24);
  kalashUrnGeo.computeVertexNormals();

  // Dharmachakra Framed Jali Panel Shared Geometries
  const wheelOuterGeo = new THREE.TorusGeometry(0.245, 0.026, 10, 28);
  const wheelInnerRimGeo = new THREE.TorusGeometry(0.175, 0.013, 8, 24);
  const wheelSpokeGeo = new THREE.CylinderGeometry(0.008, 0.014, 0.165, 8);
  const wheelHubGeo = new THREE.CylinderGeometry(0.056, 0.056, 0.064, 16);
  const wheelRimBeadGeo = new THREE.SphereGeometry(0.018, 8, 6);
  const spandrelDiagGeo = new THREE.BoxGeometry(0.028, 0.24, 0.032);

  const bayCount = 7;
  const baySpanZ = (rampSpanZ - 0.60) / bayCount; // ~1.057m between piers
  const frameLen = baySpanZ - 0.16;

  for (const side of [-1, 1]) {
    const rx = side * (doorHalfW + 0.18);
    const midY = (rampYStart + rampYEnd) * 0.5;
    const midZ = (rampZStart + rampZEnd) * 0.5;

    // A. Solid Carved Stone Cheek-Wall (keep collidable to guard stair edges)
    const cheekWall = new THREE.Mesh(cheekGeo, stairStoneMat);
    cheekWall.position.set(rx, 0, 0);
    cheekWall.castShadow = true;
    cheekWall.receiveShadow = true;
    group.add(cheekWall);

    // Molded Stone Shoe Rail Sill + Recessed Carved Lotus Frieze Band on outer/inner cheek faces
    const shoeRail = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.065, rampHyp + 0.10),
      darkStoneMat,
    );
    shoeRail.position.set(rx, midY + 0.17, midZ);
    shoeRail.rotation.x = rampAngle;
    shoeRail.castShadow = true;
    shoeRail.userData.nonCollidable = true;

    const cheekFrieze = new THREE.Mesh(
      new THREE.BoxGeometry(0.365, 0.135, rampHyp - 0.35),
      carvedFriezeMat,
    );
    cheekFrieze.position.set(rx, midY + 0.03, midZ);
    cheekFrieze.rotation.x = rampAngle;
    cheekFrieze.receiveShadow = true;
    cheekFrieze.userData.nonCollidable = true;

    // Profiled Extruded Handrail + Bronze Underside Channel
    const handrail = new THREE.Mesh(handrailExtrudeGeo, stairStoneMat);
    handrail.position.set(rx, midY + 0.99, midZ);
    handrail.rotation.x = rampAngle;
    handrail.castShadow = true;
    handrail.receiveShadow = true;

    const handrailBronzeChannel = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.030, handrailSpan),
      mats.warmBronzeMat,
    );
    handrailBronzeChannel.position.set(rx, midY + 0.925, midZ);
    handrailBronzeChannel.rotation.x = rampAngle;
    handrailBronzeChannel.userData.nonCollidable = true;

    group.add(cheekFrieze, shoeRail, handrail, handrailBronzeChannel);

    // B. 8 Lathed Stone Balusters + 7 Framed & Spandrel-Anchored Dharmachakra Jali Screens
    const firstPostZ = rampZStart - 0.30;
    const lastPostZ = rampZEnd + 0.30;

    for (let p = 0; p <= bayCount; p++) {
      const t = p / bayCount;
      const pz = THREE.MathUtils.lerp(firstPostZ, lastPostZ, t);
      const py = THREE.MathUtils.lerp(rampYStart + 0.034, rampYEnd - 0.034, t);

      // Square carved stone sub-plinth under turned baluster
      const subPlinth = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.075, 0.20), darkStoneMat);
      subPlinth.position.set(rx, py + 0.21, pz);
      subPlinth.userData.nonCollidable = true;

      const baluster = new THREE.Mesh(balusterGeo, stairStoneMat);
      baluster.position.set(rx, py + 0.23, pz);
      baluster.castShadow = true;
      baluster.receiveShadow = true;
      baluster.userData.nonCollidable = true;

      const bronzeCollar = new THREE.Mesh(
        new THREE.BoxGeometry(0.19, 0.032, 0.19),
        mats.warmBronzeMat,
      );
      bronzeCollar.position.set(rx, py + 0.91, pz);
      bronzeCollar.userData.nonCollidable = true;

      group.add(subPlinth, baluster, bronzeCollar);

      if (p < bayCount) {
        const mt = (p + 0.5) / bayCount;
        const mz = THREE.MathUtils.lerp(firstPostZ, lastPostZ, mt);
        const my = THREE.MathUtils.lerp(rampYStart + 0.034, rampYEnd - 0.034, mt);

        const bayGroup = new THREE.Group();
        bayGroup.position.set(rx, my + 0.57, mz);
        bayGroup.userData.nonCollidable = true;

        // Sloped solid bronze-and-stone outer Jali frame (anchored cleanly between balusters!)
        const frameTop = new THREE.Mesh(
          new THREE.BoxGeometry(0.065, 0.040, frameLen + 0.04),
          mats.warmBronzeMat,
        );
        frameTop.position.y = 0.285;
        frameTop.rotation.x = rampAngle;

        const frameBot = new THREE.Mesh(
          new THREE.BoxGeometry(0.065, 0.040, frameLen + 0.04),
          mats.warmBronzeMat,
        );
        frameBot.position.y = -0.285;
        frameBot.rotation.x = rampAngle;

        for (const sz of [-frameLen * 0.5 + 0.02, frameLen * 0.5 - 0.02]) {
          const stile = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.58, 0.042), mats.warmBronzeMat);
          stile.position.z = sz;
          bayGroup.add(stile);
        }

        // 4 Diagonal Carved Bronze Corner Spandrels anchoring the wheel to frame corners
        for (const sy of [-1, 1]) {
          for (const sz of [-1, 1]) {
            const spandrel = new THREE.Mesh(spandrelDiagGeo, mats.warmBronzeMat);
            spandrel.position.set(0, sy * 0.21, sz * (frameLen * 0.36));
            spandrel.rotation.x = sy * sz * 0.92;
            bayGroup.add(spandrel);
          }
        }

        // Top & bottom anchor stanchion struts connecting wheel rim to frame rails
        for (const sy of [-1, 1]) {
          const vAnchor = new THREE.Mesh(
            new THREE.CylinderGeometry(0.016, 0.016, 0.08, 8),
            mats.warmBronzeMat,
          );
          vAnchor.position.y = sy * 0.265;
          bayGroup.add(vAnchor);
        }

        // Intricate 8-Spoke Dharmachakra Wheel
        const wheelOuter = new THREE.Mesh(wheelOuterGeo, mats.giltGoldMat);
        wheelOuter.rotation.y = Math.PI * 0.5;
        wheelOuter.castShadow = true;

        const wheelInner = new THREE.Mesh(wheelInnerRimGeo, mats.warmBronzeMat);
        wheelInner.rotation.y = Math.PI * 0.5;

        const wheelHub = new THREE.Mesh(wheelHubGeo, mats.giltGoldMat);
        wheelHub.rotation.z = Math.PI * 0.5;

        const hubBoss = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 8), mats.warmBronzeMat);
        hubBoss.scale.set(1.25, 0.85, 0.85);

        bayGroup.add(frameTop, frameBot, wheelOuter, wheelInner, wheelHub, hubBoss);

        for (let k = 0; k < 8; k++) {
          const ang = (k / 8) * Math.PI * 2;
          const spoke = new THREE.Mesh(wheelSpokeGeo, mats.giltGoldMat);
          spoke.position.set(0, Math.cos(ang) * 0.115, Math.sin(ang) * 0.115);
          spoke.rotation.x = ang;
          bayGroup.add(spoke);

          const rimBead = new THREE.Mesh(wheelRimBeadGeo, mats.giltGoldMat);
          rimBead.position.set(0, Math.cos(ang) * 0.265, Math.sin(ang) * 0.265);
          bayGroup.add(rimBead);
        }

        group.add(bayGroup);
      }
    }

    // C. Curved Stone Cheek-Wall Scroll Volute sweeping cleanly forward from front of Foot Newel Pier
    const volute = new THREE.Mesh(voluteGeo, stairStoneMat);
    volute.position.set(rx, rampYStart + 0.024, rampZStart + 0.38);
    volute.castShadow = true;
    volute.receiveShadow = true;
    volute.userData.nonCollidable = true;
    group.add(volute);

    // D. Monumental 6-Part Guardian Foot Newel Pier + Carved Kalash Urn & Sukunda Lamp
    const pierZ = rampZStart + 0.08;
    const pierGroup = new THREE.Group();
    pierGroup.position.set(rx, rampYStart, pierZ);

    const fBase1 = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.14, 0.62), darkStoneMat);
    fBase1.position.y = 0.07;
    fBase1.castShadow = true;
    fBase1.receiveShadow = true;

    const fBase2 = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.14, 0.50), stairStoneMat);
    fBase2.position.y = 0.21;
    fBase2.castShadow = true;

    const fShaft = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.82, 0.38), stairStoneMat);
    fShaft.position.y = 0.69;
    fShaft.castShadow = true;
    fShaft.receiveShadow = true;

    // Recessed carved stone lotus-scroll frieze panels + gilded medallions on pier shaft
    const fFrieze = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.54, 0.28), carvedFriezeMat);
    fFrieze.position.y = 0.69;
    fFrieze.userData.nonCollidable = true;
    const fFriezeZ = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.54, 0.40), carvedFriezeMat);
    fFriezeZ.position.y = 0.69;
    fFriezeZ.userData.nonCollidable = true;

    const frontMedallion = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.095, 0.032, 16),
      mats.giltGoldMat,
    );
    frontMedallion.rotation.x = Math.PI * 0.5;
    frontMedallion.position.set(0, 0.69, 0.198);
    frontMedallion.userData.nonCollidable = true;

    // Stepped dentil & cyma cornice capital
    const fNeck = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.06, 0.44), darkStoneMat);
    fNeck.position.y = 1.12;
    fNeck.userData.nonCollidable = true;
    const fCap = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.11, 0.54), stairStoneMat);
    fCap.position.y = 1.20;
    fCap.castShadow = true;
    fCap.userData.nonCollidable = true;
    const fAbacus = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 0.42), mats.warmBronzeMat);
    fAbacus.position.y = 1.28;
    fAbacus.userData.nonCollidable = true;

    // Fluted Sacred Kalash Urn + Golden Gajur Spire Crown
    const kalashUrn = new THREE.Mesh(kalashUrnGeo, mats.warmBronzeMat);
    kalashUrn.position.y = 1.305;
    kalashUrn.castShadow = true;
    kalashUrn.userData.nonCollidable = true;

    const kalashGajur = createDetailedGajurSpire(mats.giltGoldMat, mats.warmBronzeMat, 0.34);
    kalashGajur.position.y = 1.71;
    kalashGajur.userData.nonCollidable = true;

    // Ceremonial Brass Sukunda Oil Lamp seated on a carved stone plinth beside the volute
    const lampPlinth = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.20, 0.14, 16), darkStoneMat);
    lampPlinth.position.set(-side * 0.38, 0.095, 0.68);
    lampPlinth.castShadow = true;
    lampPlinth.receiveShadow = true;
    lampPlinth.userData.nonCollidable = true;

    const diyo = createDetailedBrassSukundaDiyo(
      mats.giltGoldMat,
      mats.warmBronzeMat,
      mats.flameGlowMat,
      0.74,
      true,
    );
    diyo.position.set(-side * 0.38, 0.165, 0.68);
    diyo.userData.nonCollidable = true;
    const dFlame = diyo.userData.flameGroup as THREE.Object3D | undefined;
    if (dFlame) {
      dFlame.userData.baseScale = dFlame.scale.x || 1.0;
      lampFlames.push(dFlame);
    }

    pierGroup.add(
      fBase1,
      fBase2,
      fShaft,
      fFrieze,
      fFriezeZ,
      frontMedallion,
      fNeck,
      fCap,
      fAbacus,
      kalashUrn,
      kalashGajur,
      lampPlinth,
      diyo,
    );
    group.add(pierGroup);

    // E. Portal Top Newel Pier anchoring handrail cleanly at doorway jamb (z = +12.0)
    const topPierGroup = new THREE.Group();
    topPierGroup.position.set(rx, rampYEnd, rampZEnd + 0.02);

    const tPlinth = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.24, 0.42), darkStoneMat);
    tPlinth.position.y = 0.12;
    const tShaft = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.96, 0.32), stairStoneMat);
    tShaft.position.y = 0.70;
    tShaft.castShadow = true;
    const tFrieze = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.62, 0.22), carvedFriezeMat);
    tFrieze.position.y = 0.70;
    tFrieze.userData.nonCollidable = true;
    const tCap = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.10, 0.42), darkStoneMat);
    tCap.position.y = 1.22;
    tCap.userData.nonCollidable = true;
    const tCrown = createDetailedGajurSpire(mats.giltGoldMat, mats.warmBronzeMat, 0.26);
    tCrown.position.y = 1.27;
    tCrown.userData.nonCollidable = true;

    topPierGroup.add(tPlinth, tShaft, tFrieze, tCap, tCrown);
    group.add(topPierGroup);
  }

  return { group, lampFlames };
}

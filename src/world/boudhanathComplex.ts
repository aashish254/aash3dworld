import * as THREE from 'three';
import {
  BOUDHA_COMPLEX,
  BOUDHA_HIGHLIGHTS,
  getBoudha108PrayerWheelPlacements,
} from './boudhanathData';
import { buildBoudhanathPlazaAndGompa } from './boudhanathPlazaAndGompa';
import { mergeStaticMeshesByMaterial } from './meshOptimization';
import { createWavingPrayerFlagGarland } from './prayerFlags';
import { LandmarkBuildResult } from './proceduralModels';
import { ProceduralTextureSet } from './proceduralTextures';
import { getStupaPbrMaterials } from './stupaTextures';

function addMandalaTierGeometry(
  group: THREE.Group,
  outerR: number,
  yBottom: number,
  yTop: number,
  whiteMat: THREE.Material,
  goldMat: THREE.Material,
  stairHalfW: number,
): void {
  const height = yTop - yBottom;
  const centerY = (yBottom + yTop) * 0.5;

  // Authentic 3-projection indented Mandala plinth cross-boxes matching isInsideBoudhaMandalaTier
  const dims: Array<[number, number]> = [
    [outerR * 2, outerR * 1.08],
    [outerR * 1.08, outerR * 2],
    [outerR * 1.64, outerR * 1.48],
    [outerR * 1.48, outerR * 1.64],
  ];
  for (const [w, d] of dims) {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(w, height, d), whiteMat);
    slab.position.set(0, centerY, 0);
    slab.castShadow = true;
    slab.receiveShadow = true;
    group.add(slab);
  }

  // Low whitewashed terrace parapet curbs along outer wings (leaving cardinal stairs open)
  const parapetH = 0.44;
  const parapetY = yTop + parapetH * 0.5;
  const wingSpan = outerR * 0.54 - stairHalfW - 0.15;
  if (wingSpan > 0.6) {
    for (const side of [-1, 1]) {
      for (const dir of [-1, 1]) {
        const segZ = new THREE.Mesh(
          new THREE.BoxGeometry(wingSpan, parapetH, 0.32),
          whiteMat,
        );
        segZ.position.set(side * (stairHalfW + wingSpan * 0.5 + 0.12), parapetY, dir * (outerR - 0.18));
        const segX = new THREE.Mesh(
          new THREE.BoxGeometry(0.32, parapetH, wingSpan),
          whiteMat,
        );
        segX.position.set(dir * (outerR - 0.18), parapetY, side * (stairHalfW + wingSpan * 0.5 + 0.12));
        group.add(segZ, segX);
      }
    }
  }

  // Corner miniature golden/white votive chaitya finials at diagonal Mandala projections
  const diag = outerR * 0.80;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const miniBase = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.65, 0.92), whiteMat);
      miniBase.position.set(sx * diag, yTop + 0.325, sz * diag);
      const miniSpire = new THREE.Mesh(new THREE.ConeGeometry(0.38, 1.05, 8), goldMat);
      miniSpire.position.set(sx * diag, yTop + 1.15, sz * diag);
      group.add(miniBase, miniSpire);
    }
  }
}

function buildMandalaGuardianLion(whiteMat: THREE.Material, goldMat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.42, 0.88), whiteMat);
  base.position.y = 0.21;
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.52, 0.65), whiteMat);
  body.position.set(0, 0.65, 0);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), whiteMat);
  head.position.set(0, 1.05, 0.22);
  const crest = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.18, 6), goldMat);
  crest.position.set(0, 1.32, 0.22);
  g.add(base, body, head, crest);
  return g;
}

/**
 * Assembles the complete monumental 116m x 116m Boudhanath Stupa & Kora Plaza UNESCO precinct:
 * - Matching perimeter boundary fencing, South Kora Dwar entrance archway, Newari townhouses & Ajima Pagoda
 * - Three-tier climbable Mandala Plinth (Medhi) with 108 niche Dhyani Buddhas & 4 cardinal stairways
 * - Massive white hemisphere (Anda) with saffron Chhyon lotus wash & 108 spinning brass Kora prayer wheels
 * - Tall gilded Harmika with 1024x1024 Wisdom Eyes & Nepali "१", 13-step spire, Chhatra & 64 Lungta garlands
 * - Walkable Northern Tibetan Monastery (Gompa) with 108 butter lamps & singing bowl
 */
export function createBoudhanathComplex(textures: ProceduralTextureSet): LandmarkBuildResult {
  const c = BOUDHA_COMPLEX;
  const mats = getStupaPbrMaterials(textures);
  const group = new THREE.Group();
  group.name = 'BoudhanathStupaComplex';

  const plazaAndGompa = buildBoudhanathPlazaAndGompa(mats);
  const staticGroup = new THREE.Group();
  const dynamicGroup = new THREE.Group();
  staticGroup.add(plazaAndGompa.staticGroup);
  dynamicGroup.add(plazaAndGompa.dynamicGroup);

  const beaconLights: THREE.PointLight[] = [...plazaAndGompa.beaconLights];
  const animatedNodes: THREE.Object3D[] = [...plazaAndGompa.animatedNodes];
  const cameraOccluders: THREE.Object3D[] = [];

  // =========================================================================
  // 1. THREE-TIER CLIMBABLE MANDALA PLINTH (MEDHI) + 108 NICHE DHYANI BUDDHAS
  // =========================================================================
  addMandalaTierGeometry(
    staticGroup,
    c.tier1Radius,
    c.plazaY,
    c.tier1Y,
    mats.whiteStuccoMat,
    mats.gildedCopperMat,
    c.stairHalfW,
  );
  addMandalaTierGeometry(
    staticGroup,
    c.tier2Radius,
    c.tier1Y,
    c.tier2Y,
    mats.whiteStuccoMat,
    mats.gildedCopperMat,
    c.stairHalfW,
  );
  addMandalaTierGeometry(
    staticGroup,
    c.tier3Radius,
    c.tier2Y,
    c.tier3Y,
    mats.whiteStuccoMat,
    mats.gildedCopperMat,
    c.stairHalfW,
  );

  // 108 Recessed Stone Niche Dhyani Buddha Reliefs mounted around Tier 1 perimeter bays
  const nichePositions: Array<{ x: number; y: number; z: number; rotY: number }> = [];
  const addNicheRow = (
    x1: number,
    z1: number,
    x2: number,
    z2: number,
    y: number,
    rotY: number,
    count: number,
  ) => {
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count;
      nichePositions.push({
        x: x1 + (x2 - x1) * t,
        y,
        z: z1 + (z2 - z1) * t,
        rotY,
      });
    }
  };
  // 4 cardinal faces x 2 wings x 10 + 8 diagonal outer projections -> 108 Dhyani Buddha reliefs
  const ny = c.plazaY + 1.05;
  for (const dir of [-1, 1]) {
    const faceZ = dir * (c.tier1Radius + 0.04);
    const faceRotZ = dir > 0 ? 0 : Math.PI;
    addNicheRow(-11.4, faceZ, -3.1, faceZ, ny, faceRotZ, 7);
    addNicheRow(3.1, faceZ, 11.4, faceZ, ny, faceRotZ, 7);

    const faceX = dir * (c.tier1Radius + 0.04);
    const faceRotX = dir > 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
    addNicheRow(faceX, -11.4, faceX, -3.1, ny, faceRotX, 7);
    addNicheRow(faceX, 3.1, faceX, 11.4, ny, faceRotX, 7);
  }
  // Remaining 52 niches around Tier 2 outer faces & diagonal corners
  const ny2 = c.tier1Y + 0.92;
  for (const dir of [-1, 1]) {
    const fz = dir * (c.tier2Radius + 0.04);
    const rZ = dir > 0 ? 0 : Math.PI;
    addNicheRow(-9.6, fz, -2.8, fz, ny2, rZ, 6);
    addNicheRow(2.8, fz, 9.6, fz, ny2, rZ, 7);

    const fx = dir * (c.tier2Radius + 0.04);
    const rX = dir > 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
    addNicheRow(fx, -9.6, fx, -2.8, ny2, rX, 6);
    addNicheRow(fx, 2.8, fx, 9.6, ny2, rX, 7);
  }

  const dummy = new THREE.Object3D();
  const nicheFrameInst = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.66, 0.88, 0.14),
    mats.mossyCarvedStoneMat,
    nichePositions.length,
  );
  const nicheBuddhaInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.14, 0.24, 0.52, 8),
    mats.buddhaGoldMat,
    nichePositions.length,
  );
  for (let i = 0; i < nichePositions.length; i++) {
    const n = nichePositions[i];
    dummy.position.set(n.x, n.y, n.z);
    dummy.rotation.set(0, n.rotY, 0);
    dummy.updateMatrix();
    nicheFrameInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(n.x, n.y - 0.05, n.z);
    dummy.updateMatrix();
    nicheBuddhaInst.setMatrixAt(i, dummy.matrix);
  }
  nicheFrameInst.instanceMatrix.needsUpdate = true;
  nicheBuddhaInst.instanceMatrix.needsUpdate = true;
  nicheFrameInst.computeBoundingSphere();
  nicheBuddhaInst.computeBoundingSphere();
  dynamicGroup.add(nicheFrameInst, nicheBuddhaInst);

  // =========================================================================
  // 2. FOUR CARDINAL CEREMONIAL STAIRWAYS + GUARDIAN SNOW LIONS
  // =========================================================================
  const buildCardinalStair = (yaw: number) => {
    const stair = new THREE.Group();
    stair.rotation.y = yaw;
    const stairW = c.stairHalfW * 2; // 4.1m wide open stair corridor

    const buildFlight = (zOuter: number, zInner: number, yLow: number, yHigh: number, steps: number) => {
      const span = zOuter - zInner;
      const stepD = span / steps;
      const stepH = (yHigh - yLow) / steps;
      for (let i = 0; i < steps; i++) {
        const sy = yLow + (i + 0.5) * stepH;
        const sz = zOuter - (i + 0.5) * stepD;
        const tread = new THREE.Mesh(
          new THREE.BoxGeometry(stairW, stepH + 0.08, stepD + 0.05),
          mats.graniteFlagstoneMat,
        );
        tread.position.set(0, sy, sz);
        tread.receiveShadow = true;
        tread.castShadow = true;
        stair.add(tread);
      }
      // Cheek walls flanking stair corridor (outside |perp| > 2.05)
      for (const side of [-1, 1]) {
        const cheek = new THREE.Mesh(
          new THREE.BoxGeometry(0.56, yHigh - yLow + 0.55, span + 0.3),
          mats.whiteStuccoMat,
        );
        cheek.position.set(side * (c.stairHalfW + 0.34), (yLow + yHigh) * 0.5 + 0.15, (zOuter + zInner) * 0.5);
        cheek.castShadow = true;
        stair.add(cheek);
      }
    };

    buildFlight(25.8, 22.0, c.plazaY, c.tier1Y, 8);
    buildFlight(21.2, 18.8, c.tier1Y, c.tier2Y, 7);
    buildFlight(18.1, 16.0, c.tier2Y, c.tier3Y, 7);

    // Flanking Snow Lions at the lower stair portal
    for (const side of [-1, 1]) {
      const lion = buildMandalaGuardianLion(mats.whiteStuccoMat, mats.gildedCopperMat);
      lion.position.set(side * (c.stairHalfW + 0.52), c.plazaY, 26.2);
      stair.add(lion);
    }

    staticGroup.add(stair);
  };
  buildCardinalStair(0); // South
  buildCardinalStair(Math.PI); // North
  buildCardinalStair(Math.PI * 0.5); // East
  buildCardinalStair(-Math.PI * 0.5); // West

  // =========================================================================
  // 3. 108 SPINNING BRASS PRAYER WHEELS AROUND THE KORA WALL (r = 28.4m)
  // =========================================================================
  const koraPlacements = getBoudha108PrayerWheelPlacements();
  // Continuous 4-quadrant low curved stone wall base behind the 108 wheels
  for (let b = 0; b < 4; b++) {
    const startAngle = Math.PI * 0.25 + b * Math.PI * 0.5 - (Math.PI * 0.25 - 0.13);
    const arcLen = (Math.PI * 0.25 - 0.13) * 2;
    const bayWall = new THREE.Mesh(
      new THREE.CylinderGeometry(28.85, 28.85, 1.55, 24, 1, false, startAngle, arcLen),
      mats.whiteStuccoMat,
    );
    bayWall.position.y = c.plazaY + 0.775;
    // Note: CylinderGeometry theta=0 starts along +Z, while cos/sin starts along +X -> use Torus/boxes instead for exact alignment!
    void bayWall;
  }

  // Exact per-wheel stone housing & spinning brass Mani cylinder using InstancedMesh
  const koraHousingInst = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1.12, 1.52, 0.56),
    mats.whiteStuccoMat,
    koraPlacements.length,
  );
  const koraRoofInst = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1.18, 0.16, 0.72),
    mats.jhingatiRoofMat,
    koraPlacements.length,
  );
  const koraBrassInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.44, 12),
    mats.prayerWheelBrassMat,
    koraPlacements.length,
  );
  const koraTopCapInst = new THREE.InstancedMesh(
    new THREE.ConeGeometry(0.19, 0.10, 10),
    mats.gildedCopperMat,
    koraPlacements.length,
  );
  koraHousingInst.castShadow = true;
  koraHousingInst.receiveShadow = true;
  koraBrassInst.userData.noMerge = true;
  koraTopCapInst.userData.noMerge = true;

  const koraWheelStates = koraPlacements.map((p, idx) => ({
    ...p,
    angle: idx * 0.35,
    velocity: 0.22,
  }));

  for (let i = 0; i < koraPlacements.length; i++) {
    const w = koraPlacements[i];
    // Push outer stone housing slightly outside r=28.4 along outward radial
    const lenR = Math.hypot(w.localX, w.localZ) || 1;
    const ux = w.localX / lenR;
    const uz = w.localZ / lenR;

    dummy.position.set(w.localX + ux * 0.24, c.plazaY + 0.76, w.localZ + uz * 0.24);
    dummy.rotation.set(0, w.yaw, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    koraHousingInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(w.localX + ux * 0.18, c.plazaY + 1.56, w.localZ + uz * 0.18);
    dummy.updateMatrix();
    koraRoofInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(w.localX - ux * 0.08, w.localY, w.localZ - uz * 0.08);
    dummy.rotation.set(0, w.yaw + koraWheelStates[i].angle, 0);
    dummy.updateMatrix();
    koraBrassInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(w.localX - ux * 0.08, w.localY + 0.26, w.localZ - uz * 0.08);
    dummy.updateMatrix();
    koraTopCapInst.setMatrixAt(i, dummy.matrix);
  }
  koraHousingInst.instanceMatrix.needsUpdate = true;
  koraRoofInst.instanceMatrix.needsUpdate = true;
  koraBrassInst.instanceMatrix.needsUpdate = true;
  koraTopCapInst.instanceMatrix.needsUpdate = true;
  koraHousingInst.computeBoundingSphere();
  koraRoofInst.computeBoundingSphere();
  koraBrassInst.computeBoundingSphere();
  koraTopCapInst.computeBoundingSphere();
  dynamicGroup.add(koraHousingInst, koraRoofInst, koraBrassInst, koraTopCapInst);

  // Cascading wave spin across neighboring Kora wheels when interacted with
  let waveCenterIdx = -1;
  let waveUntil = -10;
  const triggerBoudhaKoraWave = (startIdx = 0) => {
    waveCenterIdx = startIdx;
    waveUntil = performance.now() / 1000 + 4.8;
    for (let offset = -5; offset <= 5; offset++) {
      const idx = (startIdx + offset + koraWheelStates.length) % koraWheelStates.length;
      const distFactor = Math.max(0.35, 1.0 - Math.abs(offset) * 0.12);
      koraWheelStates[idx].velocity = Math.max(koraWheelStates[idx].velocity, 16.5 * distFactor);
    }
  };

  const koraAnimNode = new THREE.Object3D();
  koraAnimNode.userData.noMerge = true;
  koraAnimNode.userData.onEnvironmentUpdate = (env: { dt?: number }) => {
    const dt = Math.min(0.05, env.dt ?? 0.016);
    const nowSec = performance.now() / 1000;
    let dirty = false;
    for (let i = 0; i < koraWheelStates.length; i++) {
      const st = koraWheelStates[i];
      if (st.velocity > 0.24 || nowSec < waveUntil) {
        dirty = true;
      }
      st.angle += st.velocity * dt;
      st.velocity = Math.max(0.22, st.velocity - dt * 2.8);
      if (dirty || i % 2 === 0) {
        const lenR = Math.hypot(st.localX, st.localZ) || 1;
        const ux = st.localX / lenR;
        const uz = st.localZ / lenR;
        dummy.position.set(st.localX - ux * 0.08, st.localY, st.localZ - uz * 0.08);
        dummy.rotation.set(0, st.yaw + st.angle, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        koraBrassInst.setMatrixAt(i, dummy.matrix);

        dummy.position.set(st.localX - ux * 0.08, st.localY + 0.26, st.localZ - uz * 0.08);
        dummy.updateMatrix();
        koraTopCapInst.setMatrixAt(i, dummy.matrix);
      }
    }
    if (dirty || waveCenterIdx >= 0) {
      koraBrassInst.instanceMatrix.needsUpdate = true;
      koraTopCapInst.instanceMatrix.needsUpdate = true;
    }
  };
  dynamicGroup.add(koraAnimNode);
  animatedNodes.push(koraAnimNode);

  // =========================================================================
  // 4. MONUMENTAL WHITE ANDA DOME (CHHYON), HARMIKA (WISDOM EYES), 13-STEP SPIRE & 64 LUNGTA CABLES
  // =========================================================================
  const domeRim = new THREE.Mesh(
    new THREE.CylinderGeometry(c.domeRadius + 0.35, c.domeRadius + 0.48, 0.95, 48),
    mats.whiteStuccoMat,
  );
  domeRim.position.y = c.tier3Y + 0.45;
  domeRim.castShadow = true;
  domeRim.receiveShadow = true;
  staticGroup.add(domeRim);

  // Monumental hemispherical dome (~27.2m wide, rising from y=5.65 to y=17.95)
  const domeGeo = new THREE.SphereGeometry(c.domeRadius, 48, 28, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const dome = new THREE.Mesh(domeGeo, mats.stupaDomeChhyonMat);
  dome.scale.set(1.0, 0.89, 1.0);
  dome.position.y = c.tier3Y + 0.2;
  dome.castShadow = true;
  dome.receiveShadow = true;
  staticGroup.add(dome);

  // Circular niche frieze ring right above Tier 3 dome base
  const domeNicheRing = new THREE.Mesh(
    new THREE.TorusGeometry(c.domeRadius + 0.08, 0.22, 8, 48),
    mats.whiteStuccoMat,
  );
  domeNicheRing.rotation.x = Math.PI / 2;
  domeNicheRing.position.y = c.tier3Y + 1.02;
  staticGroup.add(domeNicheRing);

  // Gilded Harmika Base Collar & Towering Wisdom Eyes Cube (y = 17.6..21.4)
  const harmikaBase = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.55, 5.3), mats.gildedCopperMat);
  harmikaBase.position.y = 17.85;
  const harmikaEyesBox = new THREE.Mesh(
    new THREE.BoxGeometry(4.8, 3.3, 4.8),
    mats.harmikaEyesMat,
  );
  harmikaEyesBox.position.y = 19.75;
  harmikaEyesBox.castShadow = true;
  staticGroup.add(harmikaBase, harmikaEyesBox);

  // Pleated 5-Color Harmika Valance Skirt
  const valance = new THREE.Mesh(
    new THREE.CylinderGeometry(2.85, 3.05, 0.92, 4, 1, true),
    mats.valanceClothMat,
  );
  valance.rotation.y = Math.PI * 0.25;
  valance.position.y = 21.15;
  staticGroup.add(valance);

  // 13-Step Tapered Golden Bodhisattva Spire (Bhumis) from y=21.7 to y=32.5
  const stepCount = 13;
  for (let s = 0; s < stepCount; s++) {
    const t = s / (stepCount - 1);
    const stepW = THREE.MathUtils.lerp(4.4, 1.32, t);
    const stepH = 0.72;
    const sy = 22.0 + s * 0.82;
    const tierMesh = new THREE.Mesh(
      new THREE.BoxGeometry(stepW, stepH, stepW),
      mats.gildedSpireRingMat,
    );
    tierMesh.position.y = sy;
    tierMesh.castShadow = true;
    staticGroup.add(tierMesh);
  }

  // Ornate Lacy Gilded Chhatravali Parasol Canopy & Gajur Pinnacle (y = 32.8..38.2m!)
  const umbrellaNeck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 0.82, 1.35, 16),
    mats.gildedCopperMat,
  );
  umbrellaNeck.position.y = 33.15;
  const canopyBase = new THREE.Mesh(
    new THREE.CylinderGeometry(1.85, 2.08, 0.95, 24),
    mats.gildedCopperMat,
  );
  canopyBase.position.y = 34.15;
  const canopyValance = new THREE.Mesh(
    new THREE.CylinderGeometry(1.98, 2.15, 0.72, 20, 1, true),
    mats.valanceClothMat,
  );
  canopyValance.position.y = 33.42;
  const canopyDome = new THREE.Mesh(
    new THREE.ConeGeometry(1.85, 1.45, 20),
    mats.gildedCopperMat,
  );
  canopyDome.position.y = 35.32;
  const finialSpire = new THREE.Mesh(
    new THREE.ConeGeometry(0.45, 2.35, 14),
    mats.gildedCopperMat,
  );
  finialSpire.position.y = 37.05;
  const pinnacleOrb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), mats.buddhaGoldMat);
  pinnacleOrb.position.y = 38.2;
  staticGroup.add(umbrellaNeck, canopyBase, canopyValance, canopyDome, finialSpire, pinnacleOrb);

  // 64 Radial Vertex-Animated Lungta Prayer-Flag Garlands fanning from Spire Crown onto 16 Perimeter Masts (never blocking cardinal stairs!)
  const flagCountLines = 64;
  const mastCount = 16;
  const spireAnchorY = 32.8;
  const mastOffsets: Array<{ x: number; z: number; y: number }> = [];
  for (let m = 0; m < mastCount; m++) {
    // Offset by half-step (11.25 deg) so ZERO masts sit on cardinal stairways (0, 90, 180, 270 deg)
    const mastAngle = ((m + 0.5) / mastCount) * Math.PI * 2;
    const mx = Math.cos(mastAngle) * 30.8;
    const mz = Math.sin(mastAngle) * 30.8;
    const my = 5.45;
    mastOffsets.push({ x: mx, z: mz, y: my });

    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.11, my - c.plazaY, 8),
      mats.tibetanVermilionWoodMat,
    );
    mast.position.set(mx, c.plazaY + (my - c.plazaY) * 0.5, mz);
    mast.castShadow = true;
    const mastCap = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.34, 8), mats.gildedCopperMat);
    mastCap.position.set(mx, my + 0.17, mz);
    staticGroup.add(mast, mastCap);
  }

  for (let i = 0; i < flagCountLines; i++) {
    const angle = (i / flagCountLines) * Math.PI * 2;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const start = new THREE.Vector3(cosA * 0.95, spireAnchorY, sinA * 0.95);
    const mast = mastOffsets[Math.floor((i / flagCountLines) * mastCount) % mastCount];
    const end = new THREE.Vector3(mast.x, mast.y - 0.15, mast.z);

    const garland = createWavingPrayerFlagGarland(start, end, {
      flagCount: 14,
      flagWidth: 0.44,
      flagHeight: 0.56,
      sag: 1.85,
      includePoles: false,
    });
    garland.group.userData.noMerge = true;
    dynamicGroup.add(garland.group);
  }

  // Merge static masonry, roofs, houses, and dome cleanly by material
  mergeStaticMeshesByMaterial(staticGroup, {
    minBucketSize: 2,
    preserveCustomShaderMaterials: true,
    cameraOccludersOut: cameraOccluders,
  });

  group.add(staticGroup, dynamicGroup);

  // Subtle Beacon Light illuminating Harmika Wisdom Eyes at dusk/night
  const harmikaBeacon = new THREE.PointLight(0xffcb66, 7.5, 48, 1.5);
  harmikaBeacon.position.set(0, 22.8, 7.2);
  beaconLights.push(harmikaBeacon);
  group.add(harmikaBeacon);

  // Invisible Layer-1 landmark click bounding volume
  const hitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(116.0, 38.5, 116.0),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  hitMesh.position.set(0, 19.25, 0);
  hitMesh.layers.set(1);
  hitMesh.userData.noMerge = true;
  hitMesh.userData.nonCollidable = true;
  group.add(hitMesh);

  // Expose interactive state & callbacks cleanly to WorldEngine
  group.userData.templeBells = plazaAndGompa.templeBells;
  group.userData.prayerWheelSpinners = plazaAndGompa.prayerWheelSpinners;
  group.userData.boudhaKoraBrassInst = koraBrassInst;
  group.userData.triggerBoudhaKoraWave = triggerBoudhaKoraWave;
  group.userData.gompaBowlHitTarget = plazaAndGompa.gompaBowlHitTarget;
  group.userData.ajimaHitTarget = plazaAndGompa.ajimaHitTarget;
  group.userData.triggerGompaBlessing = plazaAndGompa.triggerGompaBlessing;
  group.userData.triggerAjimaOffering = plazaAndGompa.triggerAjimaOffering;
  group.userData.boudhaHighlights = BOUDHA_HIGHLIGHTS;

  return {
    group,
    hitMesh,
    beaconLights,
    animatedNodes,
    cameraOccluders,
  };
}

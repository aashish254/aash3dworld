import * as THREE from 'three';
import { LandmarkBuildResult } from './proceduralModels';
import { ProceduralTextureSet } from './proceduralTextures';
import { mergeStaticMeshesByMaterial } from './meshOptimization';
import { applyRealisticWaterShader, REFLECTIVE_WATER_ENV_UNIFORMS } from './waterShader';
import { PUMDIKOT_COMPLEX, getPumdikot108LingamPlacements } from './pumdikotData';
import { PumdikotPbrMaterials, getPumdikotMaterials } from './pumdikotTextures';
import { buildPumdikotShivaSculpt } from './pumdikotShivaSculpt';

function createHangingBronzeBell(
  mats: PumdikotPbrMaterials,
  scale = 1.0,
): THREE.Group {
  const bellRoot = new THREE.Group();
  bellRoot.scale.setScalar(scale);

  const chain = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.36, 8),
    mats.wroughtIronMat,
  );
  chain.position.y = -0.18;
  chain.userData.nonCollidable = true;

  const swingPivot = new THREE.Group();
  swingPivot.position.y = -0.34;
  swingPivot.userData.noMerge = true;

  // Inner cavity top->bottom (-radial inward normals), chamfered lip, then outer shell bottom->top (+radial outward normals)
  const bellPts = [
    new THREE.Vector2(0.0, -0.10),
    new THREE.Vector2(0.14, -0.16),
    new THREE.Vector2(0.19, -0.35),
    new THREE.Vector2(0.265, -0.525),
    new THREE.Vector2(0.275, -0.535),
    new THREE.Vector2(0.30, -0.535),
    new THREE.Vector2(0.31, -0.52),
    new THREE.Vector2(0.28, -0.48),
    new THREE.Vector2(0.21, -0.34),
    new THREE.Vector2(0.16, -0.16),
    new THREE.Vector2(0.09, -0.04),
    new THREE.Vector2(0.0, 0.0),
  ];
  const bellGeo = new THREE.LatheGeometry(bellPts, 20);
  bellGeo.computeVertexNormals();
  const bellBody = new THREE.Mesh(bellGeo, mats.polishedBrassMat);
  bellBody.castShadow = true;
  bellBody.userData.nonCollidable = true;

  const clapperPivot = new THREE.Group();
  clapperPivot.position.y = -0.16;
  const rod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.42, 8),
    mats.wroughtIronMat,
  );
  rod.position.y = -0.21;
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), mats.polishedBrassMat);
  ball.position.y = -0.42;
  clapperPivot.add(rod, ball);

  swingPivot.add(bellBody, clapperPivot);
  bellRoot.add(chain, swingPivot);
  bellRoot.userData.bellSwingPivot = swingPivot;
  bellRoot.userData.bellClapperPivot = clapperPivot;
  bellRoot.userData.noMerge = true;
  bellRoot.userData.nonCollidable = true;
  return bellRoot;
}

function buildBrassNandiBull(mats: PumdikotPbrMaterials): THREE.Group {
  const nandi = new THREE.Group();

  // Polished granite stepped plinth + stainless safety rail around Nandi
  const plinth1 = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.36, 5.2), mats.graniteCurbMat);
  plinth1.position.y = 0.18;
  plinth1.receiveShadow = true;
  plinth1.castShadow = true;
  const plinth2 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.34, 4.5), mats.dachiAppaBrickMat);
  plinth2.position.y = 0.52;
  plinth2.castShadow = true;
  const capSlab = new THREE.Mesh(new THREE.BoxGeometry(3.36, 0.12, 4.66), mats.graniteCurbMat);
  capSlab.position.y = 0.74;
  capSlab.receiveShadow = true;
  nandi.add(plinth1, plinth2, capSlab);

  // Stainless steel safety rail posts & bars around plinth perimeter
  const rx = 1.72;
  const rz = 2.38;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 0, 1]) {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.038, 0.038, 0.85, 8),
        mats.stainlessRailMat,
      );
      post.position.set(sx * rx, 1.15, sz * rz);
      nandi.add(post);
    }
    const sideBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, rz * 2, 8),
      mats.stainlessRailMat,
    );
    sideBar.rotation.x = Math.PI * 0.5;
    sideBar.position.set(sx * rx, 1.52, 0);
    nandi.add(sideBar);
  }
  for (const sz of [-1, 1]) {
    const endBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, rx * 2, 8),
      mats.stainlessRailMat,
    );
    endBar.rotation.z = Math.PI * 0.5;
    endBar.position.set(0, 1.52, sz * rz);
    nandi.add(endBar);
  }

  // Monumental Brass Kneeling Nandi Bull (local +Z = forward, rotated PI in courtyard to face North)
  const bull = new THREE.Group();
  bull.position.y = 0.8;

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.76, 1.65, 8, 18), mats.polishedBrassMat);
  torso.rotation.x = Math.PI * 0.5;
  torso.scale.set(1.06, 1.0, 0.94);
  torso.position.set(0, 0.78, -0.15);
  torso.castShadow = true;

  const haunch = new THREE.Mesh(new THREE.SphereGeometry(0.78, 16, 12), mats.polishedBrassMat);
  haunch.scale.set(1.04, 0.92, 1.15);
  haunch.position.set(0, 0.74, -0.95);
  haunch.castShadow = true;

  const hump = new THREE.Mesh(new THREE.SphereGeometry(0.56, 14, 12), mats.polishedBrassMat);
  hump.scale.set(0.86, 1.25, 1.05);
  hump.position.set(0, 1.48, 0.62);
  hump.castShadow = true;

  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.66, 16, 12), mats.polishedBrassMat);
  chest.scale.set(0.95, 1.08, 1.1);
  chest.position.set(0, 0.96, 0.92);
  chest.castShadow = true;

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.56, 0.85, 16), mats.polishedBrassMat);
  neck.position.set(0, 1.38, 1.28);
  neck.rotation.x = 0.55;

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.58, 0.95), mats.polishedBrassMat);
  head.position.set(0, 1.68, 1.72);
  head.rotation.x = 0.22;
  head.castShadow = true;

  const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.42, 12), mats.polishedBrassMat);
  snout.rotation.x = Math.PI * 0.5 + 0.22;
  snout.position.set(0, 1.56, 2.2);

  // Curved Horns, Ears & Garland Collar
  for (const sx of [-1, 1]) {
    const hornCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sx * 0.24, 1.92, 1.46),
      new THREE.Vector3(sx * 0.5, 2.24, 1.5),
      new THREE.Vector3(sx * 0.44, 2.58, 1.65),
    ]);
    const horn = new THREE.Mesh(new THREE.TubeGeometry(hornCurve, 10, 0.068, 8, false), mats.polishedBrassMat);
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.36, 8), mats.polishedBrassMat);
    ear.position.set(sx * 0.48, 1.76, 1.42);
    ear.rotation.z = -sx * 1.15;
    const foreleg = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.72, 6, 10), mats.polishedBrassMat);
    foreleg.rotation.x = Math.PI * 0.48;
    foreleg.position.set(sx * 0.58, 0.24, 0.92);
    const hindleg = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.85, 6, 10), mats.polishedBrassMat);
    hindleg.rotation.x = Math.PI * 0.48;
    hindleg.position.set(sx * 0.68, 0.26, -0.78);
    bull.add(horn, ear, foreleg, hindleg);
  }

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.09, 8, 18), mats.goldMat);
  collar.position.set(0, 1.24, 1.16);
  collar.rotation.x = Math.PI * 0.35;

  const saddle = new THREE.Mesh(new THREE.CylinderGeometry(0.81, 0.81, 0.92, 16, 1, true, -0.9, 1.8), mats.goldMat);
  saddle.rotation.z = Math.PI * 0.5;
  saddle.rotation.y = Math.PI * 0.5;
  saddle.position.set(0, 0.84, -0.15);

  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.05, -1.68),
    new THREE.Vector3(0.32, 0.78, -1.78),
    new THREE.Vector3(0.52, 0.35, -1.55),
  ]);
  const tail = new THREE.Mesh(new THREE.TubeGeometry(tailCurve, 10, 0.06, 8, false), mats.polishedBrassMat);

  bull.add(torso, haunch, hump, chest, neck, head, snout, collar, saddle, tail);
  nandi.add(bull);
  return nandi;
}

function buildGaneshStonePagoda(
  mats: PumdikotPbrMaterials,
  bellOut: THREE.Group[],
  beaconLights: THREE.PointLight[],
): THREE.Group {
  const pagoda = new THREE.Group();

  // Stepped grey granite plinth (6.9m x 6.9m)
  const p1 = new THREE.Mesh(new THREE.BoxGeometry(6.9, 0.28, 6.9), mats.greyPagodaStoneMat);
  p1.position.y = 0.14;
  p1.receiveShadow = true;
  p1.castShadow = true;
  const p2 = new THREE.Mesh(new THREE.BoxGeometry(6.1, 0.28, 6.1), mats.greyPagodaStoneMat);
  p2.position.y = 0.42;
  p2.receiveShadow = true;
  // West-facing stone approach steps (in Ganesh local +Z before rotation)
  const step1 = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.26, 0.85), mats.greyPagodaStoneMat);
  step1.position.set(0, 0.13, 3.85);
  step1.userData.nonCollidable = true;
  const step2 = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.26, 0.75), mats.greyPagodaStoneMat);
  step2.position.set(0, 0.39, 3.5);
  step2.userData.nonCollidable = true;
  pagoda.add(p1, p2, step1, step2);

  const deckY = 0.56;
  // Inner carved stone sanctum walls (open front +Z alcove)
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.75, 0.45), mats.greyPagodaStoneMat);
  backWall.position.set(0, deckY + 1.375, -1.55);
  backWall.castShadow = true;
  pagoda.add(backWall);
  for (const sx of [-1, 1]) {
    const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.45, 2.75, 3.5), mats.greyPagodaStoneMat);
    sideWall.position.set(sx * 1.55, deckY + 1.375, 0);
    sideWall.castShadow = true;
    pagoda.add(sideWall);
  }
  // 4 Outer corner carved stone-and-timber pillars
  for (const sx of [-2.4, 2.4]) {
    for (const sz of [-2.4, 2.4]) {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.32, 2.75, 0.32), mats.carvedTimberMat);
      col.position.set(sx, deckY + 1.375, sz);
      col.castShadow = true;
      pagoda.add(col);
    }
  }

  // Golden Ganesh Murti inside the stone shrine
  const ganesh = new THREE.Group();
  ganesh.position.set(0, deckY, -0.35);
  const gSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.78, 0.45, 16), mats.greyPagodaStoneMat);
  gSeat.position.y = 0.22;
  const gBody = new THREE.Mesh(new THREE.SphereGeometry(0.48, 14, 12), mats.goldMat);
  gBody.scale.set(1.12, 1.0, 0.95);
  gBody.position.y = 0.85;
  const gHead = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 12), mats.goldMat);
  gHead.position.set(0, 1.44, 0.04);
  const gTrunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.38, 0.32),
    new THREE.Vector3(0.06, 1.15, 0.46),
    new THREE.Vector3(0.22, 1.02, 0.36),
  ]);
  const gTrunk = new THREE.Mesh(new THREE.TubeGeometry(gTrunkCurve, 10, 0.08, 8, false), mats.goldMat);
  const gCrown = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.48, 8), mats.goldMat);
  gCrown.position.set(0, 1.92, 0.02);
  for (const sx of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.CircleGeometry(0.26, 10), mats.goldMat);
    ear.material = mats.goldMat.clone();
    ear.material.side = THREE.DoubleSide;
    ear.position.set(sx * 0.34, 1.42, 0.02);
    ear.rotation.y = sx * 0.45;
    ganesh.add(ear);
  }
  ganesh.add(gSeat, gBody, gHead, gTrunk, gCrown);
  pagoda.add(ganesh);

  // Two-tier sloped Nepali carved-timber & grey-slate pagoda roofs + Gajur pinnacle
  const roof1 = new THREE.Mesh(new THREE.ConeGeometry(4.45, 1.75, 4), mats.carvedTimberMat);
  roof1.rotation.y = Math.PI * 0.25;
  roof1.position.y = deckY + 3.45;
  roof1.castShadow = true;
  roof1.userData.nonCollidable = true;
  const midCore = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.25, 2.8), mats.dachiAppaBrickMat);
  midCore.position.y = deckY + 4.45;
  midCore.userData.nonCollidable = true;
  const roof2 = new THREE.Mesh(new THREE.ConeGeometry(3.05, 1.55, 4), mats.carvedTimberMat);
  roof2.rotation.y = Math.PI * 0.25;
  roof2.position.y = deckY + 5.55;
  roof2.castShadow = true;
  roof2.userData.nonCollidable = true;
  const gajur = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.95, 10), mats.goldMat);
  gajur.position.y = deckY + 6.75;
  pagoda.add(roof1, midCore, roof2, gajur);

  // Twin Hanging Bronze Bells on front portico eave + flickering ghee lamps
  for (const sx of [-1.2, 1.2]) {
    const bell = createHangingBronzeBell(mats, 0.72);
    bell.position.set(sx, deckY + 2.7, 2.35);
    pagoda.add(bell);
    bellOut.push(bell);

    const lampStand = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.75, 10), mats.polishedBrassMat);
    lampStand.position.set(sx * 1.9, deckY + 0.38, 2.45);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), mats.warmLampMat);
    flame.scale.set(0.8, 1.55, 0.8);
    flame.position.set(sx * 1.9, deckY + 0.84, 2.45);
    flame.userData.nonCollidable = true;
    pagoda.add(lampStand, flame);
  }

  const shrineLight = new THREE.PointLight(0xffb44c, 1.9, 14, 1.6);
  shrineLight.position.set(0, deckY + 1.85, 0.8);
  shrineLight.userData.intensityScale = 1.4;
  shrineLight.userData.warmFlicker = true;
  shrineLight.userData.flickerAmp = 0.1;
  pagoda.add(shrineLight);
  beaconLights.push(shrineLight);

  return pagoda;
}

/**
 * Builds the complete monumental 96m x 120m Pumdikot Mahadev Temple Complex (Pokhara, Nepal):
 * - Matching red-brick/white-pillar/wrought-iron perimeter fence with gilded Trishul & Damaru medallions
 * - Crimson double entrance gate + overhead heritage signboard
 * - Inner polygonal View Plaza balustrades & diamond-patterned slate/cream stone paving
 * - Sunken turquoise-tiled Shivakunda pond with central Lingam & floating marigolds
 * - Giant brass Nandi, ceremonial golden Trishul & hanging bronze bell, & side stone Ganesh pagoda
 * - Two-tier blush-pink rotunda with emerald-green Om portico & walkable Garbhagriha sanctum
 * - Twin symmetrical split staircases rising to the 108-Lingam upper Pradakshina terrace
 * - White ribbed hemispherical dome + 108-ft colossal seated Lord Shiva statue
 */
export function createPumdikotComplex(
  textures: ProceduralTextureSet,
  _isSoftwareGl = false,
): LandmarkBuildResult {
  const c = PUMDIKOT_COMPLEX;
  const mats = getPumdikotMaterials(textures);
  const group = new THREE.Group();
  group.name = 'PumdikotMahadevComplex';

  const beaconLights: THREE.PointLight[] = [];
  const animatedNodes: THREE.Object3D[] = [];
  const cameraOccluders: THREE.Object3D[] = [];
  const templeBells: THREE.Group[] = [];

  // =========================================================================
  // 1. OUTER 96m x 120m PERIMETER FENCE (Instanced) & CRIMSON ENTRANCE GATE
  // =========================================================================
  const fenceGroup = new THREE.Group();
  const pillarCoords: Array<{ x: number; z: number }> = [];
  const wallRuns: Array<{ x: number; z: number; len: number; rotY: number }> = [];
  const picketCoords: Array<{ x: number; z: number; rotY: number }> = [];
  const medallionCoords: Array<{ x: number; z: number; rotY: number }> = [];

  const addFenceEdge = (
    x1: number,
    z1: number,
    x2: number,
    z2: number,
    gapMin: number,
    gapMax: number,
    horizontal: boolean,
  ) => {
    const totalLen = Math.hypot(x2 - x1, z2 - z1);
    const dx = (x2 - x1) / totalLen;
    const dz = (z2 - z1) / totalLen;
    const rotY = horizontal ? 0 : Math.PI * 0.5;
    const spans: Array<[number, number]> =
      gapMax > gapMin
        ? [
            [0, gapMin],
            [gapMax, totalLen],
          ]
        : [[0, totalLen]];
    for (const [s0, s1] of spans) {
      const span = s1 - s0;
      if (span < 1.0) continue;
      const mid = (s0 + s1) * 0.5;
      wallRuns.push({ x: x1 + dx * mid, z: z1 + dz * mid, len: span, rotY });
      const bays = Math.max(1, Math.round(span / 4.5));
      for (let b = 0; b <= bays; b++) {
        const d = s0 + (b / bays) * span;
        pillarCoords.push({ x: x1 + dx * d, z: z1 + dz * d });
        if (b < bays) {
          const b0 = d;
          const b1 = s0 + ((b + 1) / bays) * span;
          medallionCoords.push({
            x: x1 + dx * (b0 + b1) * 0.5,
            z: z1 + dz * (b0 + b1) * 0.5,
            rotY,
          });
          const pickets = 11;
          for (let p = 1; p < pickets; p++) {
            const pd = b0 + (p / pickets) * (b1 - b0);
            picketCoords.push({ x: x1 + dx * pd, z: z1 + dz * pd, rotY });
          }
        }
      }
    }
  };

  // South border has a 6.8m central entrance gap; North, West, East continuous
  const southGapStart = c.halfX - c.southGateOpenHalfX;
  const southGapEnd = c.halfX + c.southGateOpenHalfX;
  addFenceEdge(-c.halfX, c.halfZ, c.halfX, c.halfZ, southGapStart, southGapEnd, true);
  addFenceEdge(-c.halfX, -c.halfZ, c.halfX, -c.halfZ, -1, -1, true);
  addFenceEdge(-c.halfX, -c.halfZ, -c.halfX, c.halfZ, -1, -1, false);
  addFenceEdge(c.halfX, -c.halfZ, c.halfX, c.halfZ, -1, -1, false);

  for (const w of wallRuns) {
    const dwarf = new THREE.Mesh(
      new THREE.BoxGeometry(w.len, 0.72, 0.36),
      mats.dachiAppaBrickMat,
    );
    dwarf.position.set(w.x, 0.36, w.z);
    dwarf.rotation.y = w.rotY;
    dwarf.castShadow = true;
    dwarf.receiveShadow = true;
    const coping = new THREE.Mesh(
      new THREE.BoxGeometry(w.len + 0.08, 0.1, 0.44),
      mats.whitePlasterMat,
    );
    coping.position.set(w.x, 0.76, w.z);
    coping.rotation.y = w.rotY;
    const topBar = new THREE.Mesh(
      new THREE.BoxGeometry(w.len, 0.06, 0.06),
      mats.wroughtIronMat,
    );
    topBar.position.set(w.x, 2.05, w.z);
    topBar.rotation.y = w.rotY;
    const midBar = new THREE.Mesh(
      new THREE.BoxGeometry(w.len, 0.05, 0.05),
      mats.wroughtIronMat,
    );
    midBar.position.set(w.x, 1.38, w.z);
    midBar.rotation.y = w.rotY;
    fenceGroup.add(dwarf, coping, topBar, midBar);
  }

  const dummy = new THREE.Object3D();
  const pillarInst = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.48, 2.25, 0.48),
    mats.whitePlasterMat,
    pillarCoords.length,
  );
  pillarInst.castShadow = true;
  pillarInst.receiveShadow = true;
  const finialInst = new THREE.InstancedMesh(
    new THREE.ConeGeometry(0.13, 0.48, 6),
    mats.goldMat,
    pillarCoords.length,
  );
  pillarCoords.forEach((p, idx) => {
    dummy.position.set(p.x, 1.125, p.z);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    pillarInst.setMatrixAt(idx, dummy.matrix);
    dummy.position.set(p.x, 2.48, p.z);
    dummy.updateMatrix();
    finialInst.setMatrixAt(idx, dummy.matrix);
  });
  pillarInst.computeBoundingSphere();
  finialInst.computeBoundingSphere();
  fenceGroup.add(pillarInst, finialInst);

  const picketInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.026, 0.026, 1.38, 6),
    mats.wroughtIronMat,
    picketCoords.length,
  );
  picketCoords.forEach((p, idx) => {
    dummy.position.set(p.x, 1.48, p.z);
    dummy.rotation.set(0, p.rotY, 0);
    dummy.updateMatrix();
    picketInst.setMatrixAt(idx, dummy.matrix);
  });
  picketInst.computeBoundingSphere();
  fenceGroup.add(picketInst);

  // Gilded circular Trishul & Damaru medallions centered in every fence bay
  const medallionInst = new THREE.InstancedMesh(
    new THREE.TorusGeometry(0.28, 0.042, 6, 16),
    mats.goldMat,
    medallionCoords.length,
  );
  const medBossInst = new THREE.InstancedMesh(
    new THREE.OctahedronGeometry(0.11, 0),
    mats.goldMat,
    medallionCoords.length,
  );
  medallionCoords.forEach((m, idx) => {
    dummy.position.set(m.x, 1.42, m.z);
    dummy.rotation.set(0, m.rotY, 0);
    dummy.updateMatrix();
    medallionInst.setMatrixAt(idx, dummy.matrix);
    medBossInst.setMatrixAt(idx, dummy.matrix);
  });
  medallionInst.computeBoundingSphere();
  medBossInst.computeBoundingSphere();
  fenceGroup.add(medallionInst, medBossInst);

  // Grand Crimson-Painted Wrought-Iron Double Entrance Gate + Gate Piers + Heritage Signboard
  const gateGroup = new THREE.Group();
  gateGroup.position.set(0, 0, c.southGateLocalZ);
  for (const sx of [-1, 1]) {
    const pier = new THREE.Mesh(
      new THREE.BoxGeometry(1.18, 4.65, 1.18),
      mats.dachiAppaBrickMat,
    );
    pier.position.set(sx * (c.southGateOpenHalfX + 0.58), 2.32, 0);
    pier.castShadow = true;
    const pierCap = new THREE.Mesh(
      new THREE.BoxGeometry(1.38, 0.24, 1.38),
      mats.whitePlasterMat,
    );
    pierCap.position.set(sx * (c.southGateOpenHalfX + 0.58), 4.72, 0);
    const pierFinial = new THREE.Mesh(
      new THREE.ConeGeometry(0.24, 0.85, 8),
      mats.goldMat,
    );
    pierFinial.position.set(sx * (c.southGateOpenHalfX + 0.58), 5.25, 0);

    // Open Crimson-Painted Wrought-Iron Gate Leaf swung inward (~72 deg)
    const leafPivot = new THREE.Group();
    leafPivot.position.set(sx * c.southGateOpenHalfX, 0.28, -0.1);
    leafPivot.rotation.y = sx * 1.24;
    const leafWidth = 2.95;
    const bottomFrame = new THREE.Mesh(
      new THREE.BoxGeometry(leafWidth, 0.14, 0.1),
      mats.crimsonGateMat,
    );
    bottomFrame.position.set(-sx * leafWidth * 0.5, 0.22, 0);
    const topFrame = new THREE.Mesh(
      new THREE.BoxGeometry(leafWidth, 0.14, 0.1),
      mats.crimsonGateMat,
    );
    topFrame.position.set(-sx * leafWidth * 0.5, 2.55, 0);
    for (let k = 0; k <= 8; k++) {
      const bar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.032, 0.032, 2.48, 6),
        mats.crimsonGateMat,
      );
      bar.position.set(-sx * (0.16 + (k / 8) * (leafWidth - 0.32)), 1.4, 0);
      const spear = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 6), mats.goldMat);
      spear.position.set(bar.position.x, 2.75, 0);
      leafPivot.add(bar, spear);
    }
    const leafCrest = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.045, 6, 16), mats.goldMat);
    leafCrest.position.set(-sx * leafWidth * 0.5, 1.42, 0);
    leafPivot.add(bottomFrame, topFrame, leafCrest);
    leafPivot.userData.nonCollidable = true;

    gateGroup.add(pier, pierCap, pierFinial, leafPivot);

    const gateLamp = new THREE.PointLight(0xffb44c, 1.9, 18, 1.5);
    gateLamp.position.set(sx * (c.southGateOpenHalfX + 0.58), 4.2, 1.1);
    gateLamp.userData.intensityScale = 1.45;
    gateGroup.add(gateLamp);
    beaconLights.push(gateLamp);
  }

  // Overhead Heritage Signboard Arch spanning across the Crimson Gate Piers
  const lintelBeam = new THREE.Mesh(
    new THREE.BoxGeometry((c.southGateOpenHalfX + 0.9) * 2, 0.42, 0.72),
    mats.crimsonGateMat,
  );
  lintelBeam.position.set(0, 4.78, 0);
  lintelBeam.userData.nonCollidable = true;
  const signBoardBacking = new THREE.Mesh(
    new THREE.BoxGeometry(6.6, 2.08, 0.24),
    mats.crimsonGateMat,
  );
  signBoardBacking.position.set(0, 5.85, 0);
  signBoardBacking.userData.nonCollidable = true;
  const signFront = new THREE.Mesh(new THREE.PlaneGeometry(6.3, 1.88), mats.signboardMat);
  signFront.position.set(0, 5.85, 0.14);
  signFront.userData.nonCollidable = true;
  const signBack = new THREE.Mesh(new THREE.PlaneGeometry(6.3, 1.88), mats.signboardMat);
  signBack.rotation.y = Math.PI;
  signBack.position.set(0, 5.85, -0.14);
  signBack.userData.nonCollidable = true;
  gateGroup.add(lintelBeam, signBoardBacking, signFront, signBack);

  // Smooth South Approach Stone Apron outside gate (lz in [60 .. 65.5])
  const gateApron = new THREE.Mesh(
    new THREE.BoxGeometry(9.8, 0.28, 5.6),
    mats.graniteCurbMat,
  );
  gateApron.position.set(0, 0.12, c.southGateLocalZ + 2.75);
  gateApron.rotation.x = 0.048;
  gateApron.receiveShadow = true;
  gateApron.userData.nonCollidable = true;
  fenceGroup.add(gateGroup, gateApron);
  group.add(fenceGroup);

  // =========================================================================
  // 2. DIAMOND-PATTERNED GRAND PLAZA & INNER POLYGONAL BALUSTRADE
  // =========================================================================
  const plazaGroup = new THREE.Group();
  const plazaBase = new THREE.Mesh(
    new THREE.BoxGeometry(c.halfX * 2 - 1.2, 0.28, c.halfZ * 2 - 1.2),
    mats.graniteCurbMat,
  );
  plazaBase.position.y = 0.14;
  plazaBase.receiveShadow = true;
  plazaBase.userData.nonCollidable = true;

  const diamondFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(c.halfX * 2 - 2.4, c.halfZ * 2 - 2.4),
    mats.diamondPlazaMat,
  );
  diamondFloor.rotation.x = -Math.PI * 0.5;
  diamondFloor.position.y = c.plazaY + 0.004;
  diamondFloor.receiveShadow = true;
  diamondFloor.userData.nonCollidable = true;
  plazaGroup.add(plazaBase, diamondFloor);

  // Inner Octagonal / Polygonal View Plaza White Stone Balustrades
  const hx = c.innerPlazaHalfX;
  const minZ = c.innerPlazaMinZ;
  const maxZ = c.innerPlazaMaxZ;
  const ch = c.innerPlazaChamfer;
  const balSegments: Array<[number, number, number, number]> = [
    [-hx + ch, maxZ, -4.4, maxZ],
    [4.4, maxZ, hx - ch, maxZ],
    [-hx + ch, minZ, hx - ch, minZ],
    [-hx, minZ + ch, -hx, maxZ - ch],
    [hx, minZ + ch, hx, maxZ - ch],
    [-hx, maxZ - ch, -hx + ch, maxZ],
    [hx - ch, maxZ, hx, maxZ - ch],
    [-hx, minZ + ch, -hx + ch, minZ],
    [hx - ch, minZ, hx, minZ + ch],
  ];
  const balPostPts: Array<{ x: number; z: number; lamp: boolean }> = [];
  for (const [x1, z1, x2, z2] of balSegments) {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const rotY = Math.atan2(x2 - x1, z2 - z1) - Math.PI * 0.5;
    const midX = (x1 + x2) * 0.5;
    const midZ = (z1 + z2) * 0.5;
    const curb = new THREE.Mesh(
      new THREE.BoxGeometry(len, 0.24, 0.34),
      mats.whitePlasterMat,
    );
    curb.position.set(midX, c.plazaY + 0.12, midZ);
    curb.rotation.y = rotY;
    const topRail = new THREE.Mesh(
      new THREE.BoxGeometry(len, 0.12, 0.38),
      mats.whitePlasterMat,
    );
    topRail.position.set(midX, c.plazaY + 0.96, midZ);
    topRail.rotation.y = rotY;
    topRail.castShadow = true;
    plazaGroup.add(curb, topRail);

    const steps = Math.max(2, Math.round(len / 1.4));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      balPostPts.push({
        x: x1 + (x2 - x1) * t,
        z: z1 + (z2 - z1) * t,
        lamp: s === 0 || s === steps || s % 4 === 0,
      });
    }
  }
  const balusterInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.08, 0.11, 0.68, 8),
    mats.whitePlasterMat,
    balPostPts.length,
  );
  const balLampPts = balPostPts.filter((p) => p.lamp);
  const balLampPillarInst = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.32, 1.15, 0.32),
    mats.whitePlasterMat,
    balLampPts.length,
  );
  const balLampGlobeInst = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.14, 8, 8),
    mats.warmLampMat,
    balLampPts.length,
  );
  balPostPts.forEach((p, idx) => {
    dummy.position.set(p.x, c.plazaY + 0.56, p.z);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    balusterInst.setMatrixAt(idx, dummy.matrix);
  });
  balLampPts.forEach((p, idx) => {
    dummy.position.set(p.x, c.plazaY + 0.58, p.z);
    dummy.updateMatrix();
    balLampPillarInst.setMatrixAt(idx, dummy.matrix);
    dummy.position.set(p.x, c.plazaY + 1.28, p.z);
    dummy.updateMatrix();
    balLampGlobeInst.setMatrixAt(idx, dummy.matrix);
  });
  balusterInst.computeBoundingSphere();
  balLampPillarInst.computeBoundingSphere();
  balLampGlobeInst.computeBoundingSphere();
  plazaGroup.add(balusterInst, balLampPillarInst, balLampGlobeInst);
  group.add(plazaGroup);

  // =========================================================================
  // 3. SUNKEN BLUE SACRED POND (SHIVAKUNDA) & CENTRAL SHIVA LINGAM
  // =========================================================================
  const pondGroup = new THREE.Group();
  pondGroup.position.set(c.pondLocalX, 0, c.pondLocalZ);

  // Granite outer curb + stepped turquoise mosaic tank walls & tiled floor
  for (const sx of [-1, 1]) {
    const curbEW = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.24, c.pondOuterHalf * 2),
      mats.graniteCurbMat,
    );
    curbEW.position.set(sx * (c.pondWaterHalf + 0.48), c.plazaY + 0.12, 0);
    const tileWallEW = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 1.25, c.pondWaterHalf * 2),
      mats.blueMosaicMat,
    );
    tileWallEW.position.set(sx * (c.pondWaterHalf + 0.08), c.plazaY - 0.56, 0);
    pondGroup.add(curbEW, tileWallEW);
  }
  for (const sz of [-1, 1]) {
    const curbNS = new THREE.Mesh(
      new THREE.BoxGeometry(c.pondOuterHalf * 2, 0.24, 0.95),
      mats.graniteCurbMat,
    );
    curbNS.position.set(0, c.plazaY + 0.12, sz * (c.pondWaterHalf + 0.48));
    const tileWallNS = new THREE.Mesh(
      new THREE.BoxGeometry(c.pondWaterHalf * 2, 1.25, 0.24),
      mats.blueMosaicMat,
    );
    tileWallNS.position.set(0, c.plazaY - 0.56, sz * (c.pondWaterHalf + 0.08));
    pondGroup.add(curbNS, tileWallNS);
  }

  // Stepped ceramic tile shelf & pond floor
  const stepShelf = new THREE.Mesh(
    new THREE.BoxGeometry(c.pondWaterHalf * 2, 0.35, c.pondWaterHalf * 2),
    mats.blueMosaicMat,
  );
  stepShelf.position.y = c.pondFloorY - 0.18;
  const innerStep = new THREE.Mesh(
    new THREE.BoxGeometry(c.pondWaterHalf * 1.85, 0.28, c.pondWaterHalf * 1.85),
    mats.blueMosaicMat,
  );
  innerStep.position.y = c.pondFloorY + 0.02;
  pondGroup.add(stepShelf, innerStep);

  // Stainless steel tubular perimeter guardrail (matches photo!)
  const sr = c.pondRailHalf - 0.2;
  for (const sx of [-1, 1]) {
    for (let s = -2; s <= 2; s++) {
      const p1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 1.05, 8),
        mats.stainlessRailMat,
      );
      p1.position.set(sx * sr, c.plazaY + 0.52, (s / 2) * sr);
      pondGroup.add(p1);
    }
    for (const ry of [0.58, 1.02]) {
      const bar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.036, 0.036, sr * 2, 8),
        mats.stainlessRailMat,
      );
      bar.rotation.x = Math.PI * 0.5;
      bar.position.set(sx * sr, c.plazaY + ry, 0);
      pondGroup.add(bar);
    }
  }
  for (const sz of [-1, 1]) {
    for (let s = -1; s <= 1; s++) {
      const p1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 1.05, 8),
        mats.stainlessRailMat,
      );
      p1.position.set((s / 2) * sr, c.plazaY + 0.52, sz * sr);
      pondGroup.add(p1);
    }
    for (const ry of [0.58, 1.02]) {
      const bar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.036, 0.036, sr * 2, 8),
        mats.stainlessRailMat,
      );
      bar.rotation.z = Math.PI * 0.5;
      bar.position.set(0, c.plazaY + ry, sz * sr);
      pondGroup.add(bar);
    }
  }

  // Central blue-tiled circular pedestal & carved black Shiva Lingam rising from Shivakunda
  const centerPed = new THREE.Mesh(
    new THREE.CylinderGeometry(1.38, 1.56, 1.08, 24),
    mats.blueMosaicMat,
  );
  centerPed.position.y = c.pondFloorY + 0.45;
  const yoniBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 1.12, 0.34, 24),
    mats.blackBasaltMat,
  );
  yoniBase.position.y = c.pondWaterY + 0.25;
  const yoniRim = new THREE.Mesh(
    new THREE.CylinderGeometry(1.12, 0.92, 0.26, 24),
    mats.blackBasaltMat,
  );
  yoniRim.position.y = c.pondWaterY + 0.54;
  const yoniSpout = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.88), mats.blackBasaltMat);
  yoniSpout.position.set(0, c.pondWaterY + 0.54, 1.12);
  const centralLingam = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.42, 0.88, 10, 18),
    mats.blackBasaltMat,
  );
  centralLingam.position.y = c.pondWaterY + 1.06;
  centralLingam.castShadow = true;
  pondGroup.add(centerPed, yoniBase, yoniRim, yoniSpout, centralLingam);

  // Rippling translucent turquoise Shivakunda water + floating marigold blossoms
  const pondWaterMat = new THREE.MeshPhysicalMaterial({
    color: 0x26b6d8,
    roughness: 0.08,
    metalness: 0.04,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    transparent: true,
    opacity: 0.72,
  });
  applyRealisticWaterShader(pondWaterMat, REFLECTIVE_WATER_ENV_UNIFORMS.uWaterTime, {
    mode: 'pond',
    maxRadius: c.pondWaterHalf,
    flowSpeed: 0.85,
    shallowTint: 0x3ecae6,
    deepTint: 0x0e6a99,
  });
  const pondWater = new THREE.Mesh(
    new THREE.PlaneGeometry(c.pondWaterHalf * 2, c.pondWaterHalf * 2, 24, 24),
    pondWaterMat,
  );
  pondWater.rotation.x = -Math.PI * 0.5;
  pondWater.position.y = c.pondWaterY;
  pondWater.userData.noMerge = true;
  pondWater.userData.noSpin = true;
  pondWater.userData.nonCollidable = true;
  pondGroup.add(pondWater);

  // Floating marigold flowers on Shivakunda surface (InstancedMesh + gentle bobbing)
  const marigoldFloatInst = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(0.11, 0),
    mats.marigoldMat,
    24,
  );
  marigoldFloatInst.userData.noMerge = true;
  marigoldFloatInst.userData.noSpin = true;
  marigoldFloatInst.userData.nonCollidable = true;
  const marigoldPos: Array<[number, number]> = [];
  for (let i = 0; i < 24; i++) {
    const a = i * 2.39996;
    const rad = 1.9 + ((i * 7) % 24) * 0.1;
    marigoldPos.push([Math.cos(a) * rad, Math.sin(a) * rad]);
    dummy.position.set(Math.cos(a) * rad, c.pondWaterY + 0.02, Math.sin(a) * rad);
    dummy.scale.set(1.2, 0.55, 1.2);
    dummy.updateMatrix();
    marigoldFloatInst.setMatrixAt(i, dummy.matrix);
  }
  marigoldFloatInst.computeBoundingSphere();
  marigoldFloatInst.userData.onEnvironmentUpdate = (env: { elapsed: number }) => {
    for (let i = 0; i < 24; i++) {
      const [bx, bz] = marigoldPos[i];
      dummy.position.set(
        bx + Math.sin(env.elapsed * 0.65 + i) * 0.08,
        c.pondWaterY + 0.025 + Math.sin(env.elapsed * 1.8 + i * 0.9) * 0.014,
        bz + Math.cos(env.elapsed * 0.55 + i) * 0.08,
      );
      dummy.rotation.set(0, env.elapsed * 0.2 + i, 0);
      dummy.scale.set(1.2, 0.55, 1.2);
      dummy.updateMatrix();
      marigoldFloatInst.setMatrixAt(i, dummy.matrix);
    }
    marigoldFloatInst.instanceMatrix.needsUpdate = true;
  };
  animatedNodes.push(marigoldFloatInst);
  pondGroup.add(marigoldFloatInst);

  const shivakundaHitTarget = new THREE.Mesh(
    new THREE.BoxGeometry(c.pondOuterHalf * 2.1, 2.2, c.pondOuterHalf * 2.1),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  shivakundaHitTarget.position.y = 0.7;
  shivakundaHitTarget.layers.set(2);
  shivakundaHitTarget.userData.noMerge = true;
  shivakundaHitTarget.userData.nonCollidable = true;
  pondGroup.add(shivakundaHitTarget);
  group.add(pondGroup);

  // =========================================================================
  // 4. BRASS NANDI BULL, GOLDEN TRISHUL & HANGING BELL, SIDE GANESH PAGODA
  // =========================================================================
  const nandiMonument = buildBrassNandiBull(mats);
  nandiMonument.position.set(c.nandiLocalX, c.plazaY, c.nandiLocalZ);
  nandiMonument.rotation.y = Math.PI; // facing North (-Z) toward rotunda & Shiva
  group.add(nandiMonument);

  // Ceremonial Golden Trishul & Damaru Monument + Silk Ribbons
  const trishulAltar = new THREE.Group();
  trishulAltar.position.set(c.trishulLocalX, c.plazaY, c.trishulLocalZ);
  const tPlinth = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.35, 0.68, 12), mats.graniteCurbMat);
  tPlinth.position.y = 0.34;
  tPlinth.castShadow = true;
  const tShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 5.2, 12), mats.goldMat);
  tShaft.position.y = 3.2;
  tShaft.castShadow = true;
  const tTip = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.15, 8), mats.goldMat);
  tTip.position.y = 6.2;
  const tProngArc = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.065, 8, 18, Math.PI),
    mats.goldMat,
  );
  tProngArc.rotation.z = Math.PI;
  tProngArc.position.y = 5.78;
  const tDamaru1 = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.28, 12), mats.polishedBrassMat);
  tDamaru1.rotation.z = Math.PI * 0.5;
  tDamaru1.position.set(0.14, 4.65, 0);
  const tDamaru2 = tDamaru1.clone();
  tDamaru2.rotation.z = -Math.PI * 0.5;
  tDamaru2.position.set(-0.14, 4.65, 0);
  trishulAltar.add(tPlinth, tShaft, tTip, tProngArc, tDamaru1, tDamaru2);

  // Saffron & crimson fluttering ribbons on ceremonial Trishul
  const ribbonMat = mats.saffronClothMat.clone();
  const trishulRibbon = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 1.75, 2, 6), ribbonMat);
  trishulRibbon.position.set(0.24, 3.85, 0);
  trishulRibbon.userData.noMerge = true;
  trishulRibbon.userData.noSpin = true;
  trishulRibbon.userData.nonCollidable = true;
  trishulRibbon.userData.onEnvironmentUpdate = (env: { elapsed: number }) => {
    trishulRibbon.rotation.z = 0.18 + Math.sin(env.elapsed * 3.2) * 0.14;
    trishulRibbon.rotation.x = Math.cos(env.elapsed * 2.4) * 0.12;
  };
  animatedNodes.push(trishulRibbon);
  trishulAltar.add(trishulRibbon);
  group.add(trishulAltar);

  // Hanging Temple Bell Arch beside Trishul
  const bellArch = new THREE.Group();
  bellArch.position.set(c.bellLocalX, c.plazaY, c.bellLocalZ);
  for (const sx of [-0.72, 0.72]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.1, 0.22), mats.carvedTimberMat);
    post.position.set(sx, 1.55, 0);
    post.castShadow = true;
    bellArch.add(post);
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.24, 0.28), mats.carvedTimberMat);
  beam.position.y = 3.1;
  bellArch.add(beam);
  const plazaBell = createHangingBronzeBell(mats, 1.25);
  plazaBell.position.y = 2.98;
  bellArch.add(plazaBell);
  templeBells.push(plazaBell);
  group.add(bellArch);

  const nandiBellHitTarget = new THREE.Mesh(
    new THREE.BoxGeometry(15.5, 4.5, 8.5),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  nandiBellHitTarget.position.set(-5.0, c.plazaY + 2.1, 8.5);
  nandiBellHitTarget.layers.set(2);
  nandiBellHitTarget.userData.noMerge = true;
  nandiBellHitTarget.userData.nonCollidable = true;
  group.add(nandiBellHitTarget);

  // Side Stone Pagoda Shrine (Sumeru / Ganesh Mandir) on right side of plaza
  const ganeshShrine = buildGaneshStonePagoda(mats, templeBells, beaconLights);
  ganeshShrine.position.set(c.ganeshLocalX, c.plazaY, c.ganeshLocalZ);
  ganeshShrine.rotation.y = -Math.PI * 0.5; // face West toward central plaza axis
  group.add(ganeshShrine);

  // Courtyard Micro-Props: Carved Stone Benches, Rhododendron/Marigold Planters, Deepstambha Posts, Copper Kalash
  const benchCoords: Array<[number, number, number]> = [
    [-26, 36, Math.PI * 0.5],
    [-26, 16, Math.PI * 0.5],
    [-26, -4, Math.PI * 0.5],
    [26, 36, -Math.PI * 0.5],
    [26, -4, -Math.PI * 0.5],
    [-14, 42, Math.PI],
    [14, 42, Math.PI],
    [-24, -44, 0],
    [24, -44, 0],
  ];
  for (const [bx, bz, rot] of benchCoords) {
    const bGroup = new THREE.Group();
    bGroup.position.set(bx, c.plazaY, bz);
    bGroup.rotation.y = rot;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.14, 0.68), mats.graniteCurbMat);
    seat.position.y = 0.48;
    seat.castShadow = true;
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.44, 0.58), mats.graniteCurbMat);
    legL.position.set(-0.92, 0.22, 0);
    const legR = legL.clone();
    legR.position.x = 0.92;
    bGroup.add(seat, legL, legR);
    group.add(bGroup);
  }

  // Brass Deepstambha Lamp Posts + Ornamental Flower Planters
  const deepstambhaSpots: Array<[number, number]> = [
    [-8.5, 48.0],
    [8.5, 48.0],
    [-9.2, 26.0],
    [9.2, 26.0],
    [-9.2, 4.0],
    [9.2, 4.0],
    [-16.0, -39.0],
    [16.0, -39.0],
  ];
  for (const [dx, dz] of deepstambhaSpots) {
    const lamp = new THREE.Group();
    lamp.position.set(dx, c.plazaY, dz);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.56, 0.42, 10), mats.graniteCurbMat);
    base.position.y = 0.21;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.18, 2.55, 10), mats.polishedBrassMat);
    shaft.position.y = 1.65;
    shaft.castShadow = true;
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.16, 0.24, 12), mats.goldMat);
    bowl.position.y = 2.98;
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), mats.warmLampMat);
    flame.scale.set(0.85, 1.5, 0.85);
    flame.position.y = 3.24;
    flame.userData.nonCollidable = true;
    lamp.add(base, shaft, bowl, flame);
    group.add(lamp);
  }

  // Key warm courtyard PointLights (kept focused so dynamic pool stays lightweight)
  const plazaCenterLight = new THREE.PointLight(0xffcb6e, 2.4, 34, 1.4);
  plazaCenterLight.position.set(0, 6.2, 12);
  plazaCenterLight.userData.intensityScale = 1.4;
  group.add(plazaCenterLight);
  beaconLights.push(plazaCenterLight);

  // Ornamental Planters + Stacked Copper Kalash Vessels
  const planterSpots: Array<[number, number]> = [
    [-6.0, 56.0],
    [6.0, 56.0],
    [-14.5, 32.0],
    [14.5, 32.0],
    [-14.5, 14.0],
    [14.5, 14.0],
    [-6.2, -1.6],
    [6.2, -1.6],
  ];
  for (const [px, pz] of planterSpots) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.52, 0.56, 12), mats.dachiAppaBrickMat);
    pot.position.set(px, c.plazaY + 0.28, pz);
    const shrub = new THREE.Mesh(new THREE.DodecahedronGeometry(0.62, 1), mats.belLeafMat);
    shrub.position.set(px, c.plazaY + 0.82, pz);
    shrub.userData.nonCollidable = true;
    const bloom1 = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 6), mats.marigoldMat);
    bloom1.position.set(px + 0.24, c.plazaY + 1.12, pz + 0.16);
    const bloom2 = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), mats.crimsonGateMat);
    bloom2.position.set(px - 0.22, c.plazaY + 1.06, pz - 0.18);
    group.add(pot, shrub, bloom1, bloom2);
  }

  // Stacked Copper Water Vessels (Kalash) near Portico & Ganesh Shrine
  for (const [kx, kz] of [
    [-5.6, -2.8],
    [5.6, -2.8],
    [20.8, 12.2],
  ]) {
    for (let tier = 0; tier < 2; tier++) {
      const pot = new THREE.Mesh(
        new THREE.SphereGeometry(0.28 - tier * 0.06, 12, 10),
        mats.copperMat,
      );
      pot.scale.set(1.0, 0.88, 1.0);
      pot.position.set(kx, c.plazaY + 0.24 + tier * 0.42, kz);
      group.add(pot);
    }
  }

  // =========================================================================
  // 5. TWO-TIER BLUSH-PINK ROTUNDA, EMERALD PORTICO & WALKABLE GARBHAGRIHA
  // =========================================================================
  const rotundaGroup = new THREE.Group();
  rotundaGroup.position.set(0, 0, c.rotundaCenterLocalZ);

  // Ground Sanctum Marble Floor (r = 14.0m at y = 0.48)
  const sanctumFloor = new THREE.Mesh(
    new THREE.CylinderGeometry(14.0, 14.2, 0.24, 36),
    mats.garbhagrihaFloorMat,
  );
  sanctumFloor.position.y = c.garbhagrihaY - 0.12;
  sanctumFloor.receiveShadow = true;
  sanctumFloor.userData.nonCollidable = true;
  rotundaGroup.add(sanctumFloor);

  // Curved Hollow Cylindrical Blush-Pink Rotunda Shell (with open South doorway ±2.25m)
  const wallH = c.upperTerraceY - c.garbhagrihaY;
  const wallCenterY = c.garbhagrihaY + wallH * 0.5;
  const doorHalfAngle = Math.asin(c.rotundaDoorHalfX / c.rotundaOuterR); // ~0.165 rad
  const wallSegs = 28;
  const startA = doorHalfAngle + 0.02;
  const endA = Math.PI * 2 - doorHalfAngle - 0.02;
  const arcStep = (endA - startA) / wallSegs;
  const wallMidR = (c.rotundaInnerR + c.rotundaOuterR) * 0.5;
  const wallThick = c.rotundaOuterR - c.rotundaInnerR;

  const rotundaWallGroup = new THREE.Group();
  for (let i = 0; i < wallSegs; i++) {
    const a = startA + (i + 0.5) * arcStep;
    const segLen = 2 * wallMidR * Math.sin(arcStep * 0.5) + 0.22;
    const seg = new THREE.Mesh(
      new THREE.BoxGeometry(segLen, wallH, wallThick),
      mats.blushRotundaMat,
    );
    seg.position.set(Math.sin(a) * wallMidR, wallCenterY, Math.cos(a) * wallMidR);
    seg.rotation.y = a;
    seg.castShadow = true;
    seg.receiveShadow = true;
    rotundaWallGroup.add(seg);

    // Exterior white pilasters & recessed arched window bays every 2nd segment
    if (i % 2 === 0) {
      const pil = new THREE.Mesh(
        new THREE.BoxGeometry(0.54, wallH + 0.1, 0.34),
        mats.whitePlasterMat,
      );
      pil.position.set(
        Math.sin(a) * (c.rotundaOuterR + 0.08),
        wallCenterY,
        Math.cos(a) * (c.rotundaOuterR + 0.08),
      );
      pil.rotation.y = a;
      rotundaWallGroup.add(pil);
    } else {
      const winGlass = new THREE.Mesh(
        new THREE.PlaneGeometry(1.35, 2.25),
        mats.skylightGlassMat,
      );
      winGlass.position.set(
        Math.sin(a) * (c.rotundaOuterR + 0.05),
        wallCenterY + 0.25,
        Math.cos(a) * (c.rotundaOuterR + 0.05),
      );
      winGlass.rotation.y = a;
      const winFrame = new THREE.Mesh(
        new THREE.BoxGeometry(1.55, 2.45, 0.16),
        mats.whitePlasterMat,
      );
      winFrame.position.set(
        Math.sin(a) * (c.rotundaOuterR - 0.03),
        wallCenterY + 0.25,
        Math.cos(a) * (c.rotundaOuterR - 0.03),
      );
      winFrame.rotation.y = a;
      rotundaWallGroup.add(winGlass, winFrame);
    }
  }
  // Upper lintel above the South doorway so portal has a clean architectural header
  const doorLintel = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 1.45, wallThick + 0.2),
    mats.blushRotundaMat,
  );
  doorLintel.position.set(0, c.upperTerraceY - 0.72, c.rotundaOuterR - wallThick * 0.5);
  doorLintel.userData.nonCollidable = true;
  rotundaWallGroup.add(doorLintel);
  rotundaGroup.add(rotundaWallGroup);
  cameraOccluders.push(rotundaWallGroup);

  // Emerald-Green Sloped-Roof Gabled Portico with Vasuki-entwined Columns & Om Pediment
  const porticoGroup = new THREE.Group();
  porticoGroup.position.set(0, 0, c.rotundaOuterR + 1.9);
  const porticoFloor = new THREE.Mesh(
    new THREE.BoxGeometry(c.porticoHalfX * 2, 0.24, 4.6),
    mats.garbhagrihaFloorMat,
  );
  porticoFloor.position.set(0, c.garbhagrihaY - 0.12, 0);
  porticoFloor.receiveShadow = true;
  porticoFloor.userData.nonCollidable = true;
  porticoGroup.add(porticoFloor);

  // 4 Sculpted Columns wrapped with golden coiled Vasuki serpents & flower garlands
  for (const px of [-4.35, -2.55, 2.55, 4.35]) {
    const colBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.48, 0.42, 12),
      mats.dachiAppaBrickMat,
    );
    colBase.position.set(px, c.garbhagrihaY + 0.21, 1.75);
    const colShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.34, 4.3, 14),
      mats.whitePlasterMat,
    );
    colShaft.position.set(px, c.garbhagrihaY + 2.55, 1.75);
    colShaft.castShadow = true;
    const snakeSpiral = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.32, 0.055, 24, 6, 2, 3),
      mats.goldMat,
    );
    snakeSpiral.scale.set(1.0, 2.2, 1.0);
    snakeSpiral.position.set(px, c.garbhagrihaY + 2.35, 1.75);
    const garlandRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.36, 0.085, 8, 14),
      mats.marigoldMat,
    );
    garlandRing.rotation.x = Math.PI * 0.5;
    garlandRing.position.set(px, c.garbhagrihaY + 4.35, 1.75);
    porticoGroup.add(colBase, colShaft, snakeSpiral, garlandRing);
  }

  // Emerald-green tiered eave & triangular gable pediment with golden "Om"
  const eaveBand = new THREE.Mesh(
    new THREE.BoxGeometry(10.2, 0.42, 4.8),
    mats.emeraldRoofMat,
  );
  eaveBand.position.set(0, c.upperTerraceY - 0.52, 0.2);
  eaveBand.userData.nonCollidable = true;
  const eaveGoldTrim = new THREE.Mesh(
    new THREE.BoxGeometry(10.35, 0.14, 4.92),
    mats.goldMat,
  );
  eaveGoldTrim.position.set(0, c.upperTerraceY - 0.72, 0.2);
  eaveGoldTrim.userData.nonCollidable = true;

  const pedimentShape = new THREE.Shape();
  pedimentShape.moveTo(-4.8, 0);
  pedimentShape.lineTo(4.8, 0);
  pedimentShape.lineTo(0, 2.05);
  pedimentShape.closePath();
  const pedimentGeo = new THREE.ExtrudeGeometry(pedimentShape, { depth: 0.45, bevelEnabled: false });
  const pedimentMesh = new THREE.Mesh(pedimentGeo, mats.emeraldRoofMat);
  pedimentMesh.position.set(0, c.upperTerraceY - 0.3, 2.35);
  pedimentMesh.userData.nonCollidable = true;

  const omPanel = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 1.42), mats.omPedimentMat);
  omPanel.position.set(0, c.upperTerraceY + 0.58, 2.84);
  omPanel.userData.nonCollidable = true;
  porticoGroup.add(eaveBand, eaveGoldTrim, pedimentMesh, omPanel);
  rotundaGroup.add(porticoGroup);

  // Portico Click Target
  const porticoHitTarget = new THREE.Mesh(
    new THREE.BoxGeometry(5.6, 4.8, 4.6),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  porticoHitTarget.position.set(0, c.garbhagrihaY + 2.4, c.rotundaOuterR + 1.5);
  porticoHitTarget.layers.set(2);
  porticoHitTarget.userData.noMerge = true;
  porticoHitTarget.userData.nonCollidable = true;
  rotundaGroup.add(porticoHitTarget);

  // =========================================================================
  // 6. WALKABLE GARBHAGRIHA INTERIOR (Sphatik Lingam, Kailash Reliefs, Diyas)
  // =========================================================================
  const sanctumGroup = new THREE.Group();
  // Carved Dark-Timber Radial Ceiling Rafters & Golden Lotus Boss
  for (let r = 0; r < 12; r++) {
    const a = (r / 12) * Math.PI * 2;
    const rafter = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.32, c.rotundaInnerR - 0.6),
      mats.carvedTimberMat,
    );
    rafter.position.set(
      Math.sin(a) * (c.rotundaInnerR * 0.5),
      c.upperTerraceY - 0.42,
      Math.cos(a) * (c.rotundaInnerR * 0.5),
    );
    rafter.rotation.y = a;
    rafter.userData.nonCollidable = true;
    sanctumGroup.add(rafter);
  }
  const ceilingLotus = new THREE.Mesh(
    new THREE.CylinderGeometry(2.1, 1.4, 0.25, 16),
    mats.goldMat,
  );
  ceilingLotus.position.y = c.upperTerraceY - 0.35;
  ceilingLotus.userData.nonCollidable = true;
  sanctumGroup.add(ceilingLotus);

  // 8 Framed Kailash / Shiva-Parvati Bas-Relief Murals & Flickering Ghee-Lamp Sconces
  const sconceFlames: THREE.Mesh[] = [];
  for (let i = 0; i < 8; i++) {
    const a = startA + 0.42 + (i / 7) * (endA - startA - 0.84);
    const rx = Math.sin(a) * (c.rotundaInnerR - 0.14);
    const rz = Math.cos(a) * (c.rotundaInnerR - 0.14);
    const mural = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.95), mats.kailashMuralMat);
    mural.position.set(rx, c.garbhagrihaY + 2.65, rz);
    mural.rotation.y = a + Math.PI;
    mural.userData.nonCollidable = true;

    const sconceBowl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.12, 0.16, 10),
      mats.polishedBrassMat,
    );
    sconceBowl.position.set(
      Math.sin(a) * (c.rotundaInnerR - 0.45),
      c.garbhagrihaY + 1.35,
      Math.cos(a) * (c.rotundaInnerR - 0.45),
    );
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), mats.warmLampMat);
    flame.scale.set(0.8, 1.6, 0.8);
    flame.position.set(
      sconceBowl.position.x,
      sconceBowl.position.y + 0.16,
      sconceBowl.position.z,
    );
    flame.userData.noMerge = true;
    flame.userData.noSpin = true;
    flame.userData.nonCollidable = true;
    sconceFlames.push(flame);
    sanctumGroup.add(mural, sconceBowl, flame);
  }

  // Central Illuminated Sphatik (Crystal) & Black-Stone Shiva Lingam on Brass Yoni
  const altarPlinth = new THREE.Mesh(
    new THREE.CylinderGeometry(1.42, 1.65, 0.48, 24),
    mats.garbhagrihaFloorMat,
  );
  altarPlinth.position.y = c.garbhagrihaY + 0.24;
  const brassYoni = new THREE.Mesh(
    new THREE.CylinderGeometry(0.88, 1.06, 0.38, 24),
    mats.polishedBrassMat,
  );
  brassYoni.position.y = c.garbhagrihaY + 0.67;
  const innerBlackBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.52, 0.26, 20),
    mats.blackBasaltMat,
  );
  innerBlackBase.position.y = c.garbhagrihaY + 0.96;
  const sphatikLingam = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.36, 0.78, 12, 20),
    mats.sphatikCrystalMat,
  );
  sphatikLingam.position.y = c.garbhagrihaY + 1.56;
  sphatikLingam.userData.noMerge = true;

  // Marigold garland & fresh green Bel leaves around altar
  const altarGarland = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.11, 8, 20), mats.marigoldMat);
  altarGarland.rotation.x = Math.PI * 0.5;
  altarGarland.position.y = c.garbhagrihaY + 0.9;
  const belCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.08, 9), mats.belLeafMat);
  belCrown.position.y = c.garbhagrihaY + 2.28;

  // Octagonal low brass rail circling the altar (r = 2.25m)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const nextA = ((i + 1) / 8) * Math.PI * 2;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.72, 8), mats.polishedBrassMat);
    post.position.set(Math.sin(a) * 2.15, c.garbhagrihaY + 0.36, Math.cos(a) * 2.15);
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 1.65, 8), mats.polishedBrassMat);
    bar.rotation.z = Math.PI * 0.5;
    bar.rotation.y = (a + nextA) * 0.5;
    bar.position.set(
      Math.sin((a + nextA) * 0.5) * 1.98,
      c.garbhagrihaY + 0.68,
      Math.cos((a + nextA) * 0.5) * 1.98,
    );
    sanctumGroup.add(post, bar);
  }

  // Suspended Silver Abhisheka Water Vessel (Kalash) + Dripping Droplet + Volumetric Golden Light Cone
  const kalashY = c.upperTerraceY - 1.35;
  const silverKalash = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 14, 12),
    mats.silverMoonMat,
  );
  silverKalash.position.y = kalashY;
  silverKalash.userData.nonCollidable = true;
  const chain = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 1.0, 6),
    mats.silverMoonMat,
  );
  chain.position.y = kalashY + 0.55;
  chain.userData.nonCollidable = true;
  const droplet = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), mats.sphatikCrystalMat);
  droplet.position.y = kalashY - 0.4;
  droplet.userData.noMerge = true;
  droplet.userData.noSpin = true;
  droplet.userData.nonCollidable = true;

  const beamMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uPulse: { value: 0 } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uPulse;
      varying vec2 vUv;
      void main() {
        float fadeY = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.1, vUv.y);
        float shimmer = 0.72 + 0.28 * sin(uTime * 2.2 + vUv.x * 12.56);
        float alpha = fadeY * shimmer * (0.14 + uPulse * 0.16);
        gl_FragColor = vec4(1.0, 0.82, 0.42, alpha);
      }
    `,
  });
  const goldenCone = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 2.15, 4.9, 20, 1, true),
    beamMat,
  );
  goldenCone.position.y = c.garbhagrihaY + 2.65;
  goldenCone.userData.noMerge = true;
  goldenCone.userData.noSpin = true;
  goldenCone.userData.nonCollidable = true;

  let sanctumOfferBoost = 0;
  const triggerInnerOffering = () => {
    sanctumOfferBoost = 1.0;
  };
  droplet.userData.onEnvironmentUpdate = (env: { elapsed: number }) => {
    sanctumOfferBoost = Math.max(0, sanctumOfferBoost - 0.015);
    beamMat.uniforms.uTime.value = env.elapsed;
    beamMat.uniforms.uPulse.value = sanctumOfferBoost;
    const dropPhase = (env.elapsed * 0.65) % 1;
    droplet.position.y = THREE.MathUtils.lerp(kalashY - 0.35, c.garbhagrihaY + 2.35, dropPhase * dropPhase);
    for (let k = 0; k < sconceFlames.length; k++) {
      const f = sconceFlames[k];
      const sc = 0.85 + Math.sin(env.elapsed * 11.0 + k * 1.9) * 0.2 + sanctumOfferBoost * 0.35;
      f.scale.set(0.8, 1.6 * sc, 0.8);
    }
  };
  animatedNodes.push(droplet);

  sanctumGroup.add(
    altarPlinth,
    brassYoni,
    innerBlackBase,
    sphatikLingam,
    altarGarland,
    belCrown,
    silverKalash,
    chain,
    droplet,
    goldenCone,
  );

  // Warm interior PointLights (stay active day & night via interiorSanctum flag!)
  const sanctumLight = new THREE.PointLight(0xffb44c, 3.6, 22, 1.3);
  sanctumLight.position.set(0, c.garbhagrihaY + 4.1, 0);
  sanctumLight.userData.interiorSanctum = true;
  sanctumLight.userData.warmFlicker = true;
  sanctumLight.userData.flickerAmp = 0.08;
  sanctumLight.userData.intensityScale = 2.6;
  sanctumGroup.add(sanctumLight);
  beaconLights.push(sanctumLight);

  const innerLingamHitTarget = new THREE.Mesh(
    new THREE.CylinderGeometry(2.3, 2.3, 3.2, 12),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  innerLingamHitTarget.position.y = c.garbhagrihaY + 1.6;
  innerLingamHitTarget.layers.set(2);
  innerLingamHitTarget.userData.noMerge = true;
  innerLingamHitTarget.userData.nonCollidable = true;
  sanctumGroup.add(innerLingamHitTarget);
  rotundaGroup.add(sanctumGroup);

  // =========================================================================
  // 7. TWIN SYMMETRICAL SPLIT STAIRCASES & UPPER 108-LINGAM TERRACE
  // =========================================================================
  const stairsAndTerrace = new THREE.Group();
  for (const sx of [-1, 1]) {
    // 7a. Lower South-facing flight: |lx| in [14.2..18.2], lz in [-1.6 .. -6.8] (y: 0.28 -> 2.45)
    const lowerSteps = 10;
    for (let s = 0; s < lowerSteps; s++) {
      const t0 = s / lowerSteps;
      const t1 = (s + 1) / lowerSteps;
      const sy = THREE.MathUtils.lerp(c.plazaY, c.stairMidY, t1);
      const sz = THREE.MathUtils.lerp(c.stairLowerStartZ, c.stairLowerEndZ, (t0 + t1) * 0.5);
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(4.0, sy, 0.56),
        mats.whitePlasterMat,
      );
      step.position.set(sx * 16.2, sy * 0.5, sz);
      step.castShadow = true;
      step.receiveShadow = true;
      step.userData.nonCollidable = true;
      stairsAndTerrace.add(step);
    }
    // Mid-landing: |lx| in [14.2..18.2], lz in [-10.8 .. -6.8], y = 2.45
    const midLanding = new THREE.Mesh(
      new THREE.BoxGeometry(4.1, c.stairMidY, 4.1),
      mats.whitePlasterMat,
    );
    midLanding.position.set(sx * 16.2, c.stairMidY * 0.5, -8.8);
    midLanding.castShadow = true;
    midLanding.receiveShadow = true;
    midLanding.userData.nonCollidable = true;
    stairsAndTerrace.add(midLanding);

    // Side retaining walls + stainless handrails on lower flight & mid-landing
    for (const sideOff of [-1.92, 1.92]) {
      const railCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(sx * 16.2 + sideOff, c.plazaY + 0.95, c.stairLowerStartZ),
        new THREE.Vector3(sx * 16.2 + sideOff, c.stairMidY + 0.95, c.stairLowerEndZ),
        new THREE.Vector3(sx * 16.2 + sideOff, c.stairMidY + 0.95, c.stairMidLandingEndZ + 0.2),
      ]);
      const rail = new THREE.Mesh(
        new THREE.TubeGeometry(railCurve, 14, 0.042, 8, false),
        mats.stainlessRailMat,
      );
      rail.userData.nonCollidable = true;
      stairsAndTerrace.add(rail);
    }

    // 7b. Upper Inward-climbing flight: |lx| from 14.2 -> 5.4, lz in [-10.6 .. -6.8] (y: 2.45 -> 6.25)
    const upperSteps = 16;
    for (let s = 0; s < upperSteps; s++) {
      const t = (s + 0.5) / upperSteps;
      const ux = THREE.MathUtils.lerp(c.stairLowerInnerX, c.stairUpperInnerX, t);
      const uy = THREE.MathUtils.lerp(c.stairMidY, c.upperTerraceY, (s + 1) / upperSteps);
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(0.62, 0.42, 3.8),
        mats.whitePlasterMat,
      );
      step.position.set(sx * ux, uy - 0.21, -8.7);
      step.castShadow = true;
      step.receiveShadow = true;
      step.userData.nonCollidable = true;
      stairsAndTerrace.add(step);

      // Stepped blush-pink stringer beam under upper flight
      const stringer = new THREE.Mesh(
        new THREE.BoxGeometry(0.64, 0.85, 3.92),
        mats.blushRotundaMat,
      );
      stringer.position.set(sx * ux, uy - 0.64, -8.7);
      stringer.userData.nonCollidable = true;
      stairsAndTerrace.add(stringer);
    }
    // Handrails flanking upper inward flight
    for (const szOff of [-10.48, -6.92]) {
      const uRailCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(sx * c.stairLowerInnerX, c.stairMidY + 0.95, szOff),
        new THREE.Vector3(sx * c.stairUpperInnerX, c.upperTerraceY + 0.95, szOff),
      ]);
      const uRail = new THREE.Mesh(
        new THREE.TubeGeometry(uRailCurve, 12, 0.042, 8, false),
        mats.stainlessRailMat,
      );
      uRail.userData.nonCollidable = true;
      stairsAndTerrace.add(uRail);
    }
  }

  // Upper Terrace Slab & Front Viewing Balcony above Portico (y = 6.25, nonCollidable so ceiling never traps ground player!)
  const upperRingGeo = new THREE.CylinderGeometry(
    c.upperTerraceOuterR,
    c.upperTerraceOuterR,
    0.42,
    40,
  );
  const upperDeck = new THREE.Mesh(upperRingGeo, mats.whitePlasterMat);
  upperDeck.position.set(0, c.upperTerraceY - 0.21, c.rotundaCenterLocalZ);
  upperDeck.receiveShadow = true;
  upperDeck.castShadow = true;
  upperDeck.userData.nonCollidable = true;
  cameraOccluders.push(upperDeck);

  const frontBalconyDeck = new THREE.Mesh(
    new THREE.BoxGeometry(c.balconyHalfX * 2, 0.42, c.balconyMaxZ - c.balconyMinZ),
    mats.whitePlasterMat,
  );
  frontBalconyDeck.position.set(
    0,
    c.upperTerraceY - 0.21,
    (c.balconyMinZ + c.balconyMaxZ) * 0.5,
  );
  frontBalconyDeck.receiveShadow = true;
  frontBalconyDeck.userData.nonCollidable = true;
  stairsAndTerrace.add(upperDeck, frontBalconyDeck);

  // Upper Terrace Stainless Guardrails (skipping stair arrival mouths)
  const railArcSegments: Array<[number, number]> = [
    [0.64, Math.PI * 2 - 0.64],
  ];
  for (const [a0, a1] of railArcSegments) {
    const segs = 34;
    for (let i = 0; i < segs; i++) {
      const ang0 = a0 + (i / segs) * (a1 - a0);
      const ang1 = a0 + ((i + 1) / segs) * (a1 - a0);
      const px0 = Math.sin(ang0) * 14.32;
      const pz0 = c.rotundaCenterLocalZ + Math.cos(ang0) * 14.32;
      const px1 = Math.sin(ang1) * 14.32;
      const pz1 = c.rotundaCenterLocalZ + Math.cos(ang1) * 14.32;
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.036, 0.036, 1.02, 6),
        mats.stainlessRailMat,
      );
      post.position.set(px0, c.upperTerraceY + 0.51, pz0);
      post.userData.nonCollidable = true;
      const len = Math.hypot(px1 - px0, pz1 - pz0);
      const bar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.032, 0.032, len, 6),
        mats.stainlessRailMat,
      );
      bar.position.set((px0 + px1) * 0.5, c.upperTerraceY + 0.98, (pz0 + pz1) * 0.5);
      bar.rotation.z = Math.PI * 0.5;
      bar.rotation.y = Math.atan2(px1 - px0, pz1 - pz0) + Math.PI * 0.5;
      bar.userData.nonCollidable = true;
      stairsAndTerrace.add(post, bar);
    }
  }
  // Front balcony South stainless parapet rail
  const balFrontRail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, c.balconyHalfX * 2, 8),
    mats.stainlessRailMat,
  );
  balFrontRail.rotation.z = Math.PI * 0.5;
  balFrontRail.position.set(0, c.upperTerraceY + 0.98, c.balconyMaxZ);
  balFrontRail.userData.nonCollidable = true;
  stairsAndTerrace.add(balFrontRail);

  // 108 Miniature Black-Stone Shiva Lingams + Pedestals + Glowing Brass Diyos (InstancedMesh)
  const lingamPlacements = getPumdikot108LingamPlacements();
  const miniPedInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.24, 0.28, 0.38, 10),
    mats.whitePlasterMat,
    lingamPlacements.length,
  );
  const miniYoniInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.2, 0.16, 0.12, 10),
    mats.blackBasaltMat,
    lingamPlacements.length,
  );
  const miniLingamInst = new THREE.InstancedMesh(
    new THREE.CapsuleGeometry(0.08, 0.18, 6, 10),
    mats.blackBasaltMat,
    lingamPlacements.length,
  );
  const miniDiyoInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.09, 0.05, 0.06, 8),
    mats.polishedBrassMat,
    lingamPlacements.length,
  );
  const miniFlameInst = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.045, 6, 6),
    mats.warmLampMat,
    lingamPlacements.length,
  );
  miniPedInst.userData.nonCollidable = true;
  miniYoniInst.userData.nonCollidable = true;
  miniLingamInst.userData.nonCollidable = true;
  miniDiyoInst.userData.nonCollidable = true;
  miniFlameInst.userData.nonCollidable = true;

  lingamPlacements.forEach((lp, idx) => {
    dummy.rotation.set(0, lp.angle, 0);
    dummy.scale.set(1, 1, 1);
    dummy.position.set(lp.localX, c.upperTerraceY + 0.19, lp.localZ);
    dummy.updateMatrix();
    miniPedInst.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(lp.localX, c.upperTerraceY + 0.44, lp.localZ);
    dummy.updateMatrix();
    miniYoniInst.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(lp.localX, c.upperTerraceY + 0.58, lp.localZ);
    dummy.updateMatrix();
    miniLingamInst.setMatrixAt(idx, dummy.matrix);

    const inwardX = lp.localX - Math.sin(lp.angle) * 0.34;
    const inwardZ = lp.localZ - Math.cos(lp.angle) * 0.34;
    dummy.position.set(inwardX, c.upperTerraceY + 0.03, inwardZ);
    dummy.updateMatrix();
    miniDiyoInst.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(inwardX, c.upperTerraceY + 0.09, inwardZ);
    dummy.updateMatrix();
    miniFlameInst.setMatrixAt(idx, dummy.matrix);
  });
  miniPedInst.computeBoundingSphere();
  miniYoniInst.computeBoundingSphere();
  miniLingamInst.computeBoundingSphere();
  miniDiyoInst.computeBoundingSphere();
  miniFlameInst.computeBoundingSphere();
  stairsAndTerrace.add(
    miniPedInst,
    miniYoniInst,
    miniLingamInst,
    miniDiyoInst,
    miniFlameInst,
  );
  group.add(stairsAndTerrace);

  // =========================================================================
  // 8. WHITE RIBBED HEMISPHERICAL DOME (20m DIAMETER) & COLOSSAL SHIVA STATUE
  // =========================================================================
  const domeGroup = new THREE.Group();
  domeGroup.position.set(0, c.upperTerraceY, c.rotundaCenterLocalZ);

  // Dome base drum + hemispherical ribbed dome shell
  const domeDrum = new THREE.Mesh(
    new THREE.CylinderGeometry(c.domeRadius, c.domeRadius + 0.15, 1.35, 36),
    mats.whitePlasterMat,
  );
  domeDrum.position.y = 0.675;
  domeDrum.castShadow = true;
  domeDrum.receiveShadow = true;

  const domeHemisphere = new THREE.Mesh(
    new THREE.SphereGeometry(c.domeRadius, 36, 20, 0, Math.PI * 2, 0, Math.PI * 0.48),
    mats.ribbedDomeMat,
  );
  domeHemisphere.position.y = 1.25;
  domeHemisphere.scale.set(1.0, 0.82, 1.0);
  domeHemisphere.castShadow = true;
  domeHemisphere.receiveShadow = true;
  cameraOccluders.push(domeHemisphere);
  domeGroup.add(domeDrum, domeHemisphere);

  // Radial Recessed Skylight Windows around the upper dome (glowing warm amber at night)
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.15;
    const skGroup = new THREE.Group();
    const skR = c.domeRadius * 0.72;
    skGroup.position.set(Math.sin(a) * skR, 6.85, Math.cos(a) * skR);
    skGroup.rotation.y = a;
    skGroup.rotation.x = -0.68;
    const skFrame = new THREE.Mesh(new THREE.BoxGeometry(1.48, 1.15, 0.36), mats.whitePlasterMat);
    const skPane = new THREE.Mesh(new THREE.PlaneGeometry(1.12, 0.84), mats.skylightGlassMat);
    skPane.position.z = 0.19;
    skGroup.add(skFrame, skPane);
    domeGroup.add(skGroup);
  }

  // Small Golden Ganesh Statue seated on the front-right dome terrace ledge (matches photo!)
  const domeGanesh = new THREE.Group();
  domeGanesh.position.set(6.2, 0.0, 7.6);
  domeGanesh.rotation.y = 0.45;
  const dgPed = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.9, 1.3), mats.whitePlasterMat);
  dgPed.position.y = 0.45;
  const dgBody = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 10), mats.goldMat);
  dgBody.position.y = 1.28;
  const dgHead = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), mats.goldMat);
  dgHead.position.y = 1.82;
  const dgCrown = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.42, 8), mats.goldMat);
  dgCrown.position.y = 2.18;
  domeGanesh.add(dgPed, dgBody, dgHead, dgCrown);
  domeGroup.add(domeGanesh);

  // Colossal Seated 108-ft Scale Lord Shiva Statue atop the Dome Crown
  const shivaSculpt = buildPumdikotShivaSculpt(mats);
  shivaSculpt.group.position.set(0, c.domeCrownY - c.upperTerraceY, 0);
  domeGroup.add(shivaSculpt.group);
  animatedNodes.push(...shivaSculpt.animatedNodes);

  // Monumental accent uplights highlighting the blue Shiva colossus & Trishul at dusk/night
  const shivaKeyLight = new THREE.PointLight(0xffdfb0, 3.2, 38, 1.2);
  shivaKeyLight.position.set(0, 14.5, 11.5);
  shivaKeyLight.userData.intensityScale = 2.1;
  domeGroup.add(shivaKeyLight);
  beaconLights.push(shivaKeyLight);

  // Upper Terrace Shiva Plaque Hit Target
  const domeShivaHitTarget = new THREE.Mesh(
    new THREE.SphereGeometry(9.0, 12, 10),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  domeShivaHitTarget.position.set(0, 13.0, 0);
  domeShivaHitTarget.layers.set(2);
  domeShivaHitTarget.userData.noMerge = true;
  domeShivaHitTarget.userData.nonCollidable = true;
  domeGroup.add(domeShivaHitTarget);

  group.add(rotundaGroup, domeGroup);

  // =========================================================================
  // 9. LAYER-1 VISTA HIT MESH & OPTIMIZATION MERGE
  // =========================================================================
  const hitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(96.0, 36.0, 120.0),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  hitMesh.position.set(0, 18.0, 0);
  hitMesh.layers.set(1);
  hitMesh.userData.noMerge = true;
  hitMesh.userData.nonCollidable = true;
  group.add(hitMesh);

  mergeStaticMeshesByMaterial(group, { preserveCustomShaderMaterials: true });

  group.userData.templeBells = templeBells;
  group.userData.shivakundaHitTarget = shivakundaHitTarget;
  group.userData.nandiBellHitTarget = nandiBellHitTarget;
  group.userData.porticoHitTarget = porticoHitTarget;
  group.userData.innerLingamHitTarget = innerLingamHitTarget;
  group.userData.domeShivaHitTarget = domeShivaHitTarget;
  group.userData.triggerInnerOffering = triggerInnerOffering;

  return {
    group,
    hitMesh,
    beaconLights,
    animatedNodes,
    cameraOccluders,
  };
}

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { getLumbiniGardenCraftMaterials } from './lumbiniGardenCraft';
import { createDetailedGajurSpire, createRectangularHipRoofGeometry } from './janakiMandirCraft';

export interface LumbiniPerimeterFenceMaterials {
  brickMat: THREE.Material;
  chunarStoneMat: THREE.Material;
  warmBronzeMat: THREE.Material;
  giltGoldMat: THREE.Material;
  terracottaCapMat: THREE.Material;
}

function pushNonIndexed(
  bucket: THREE.BufferGeometry[],
  geo: THREE.BufferGeometry,
  y = 0,
  rotX = 0,
  rotY = 0,
  rotZ = 0,
  x = 0,
  z = 0,
): void {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  geo.dispose();
  if (!g.getAttribute('normal')) g.computeVertexNormals();
  if (!g.getAttribute('uv')) {
    const pos = g.getAttribute('position');
    const uvs = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      uvs[i * 2] = pos.getX(i) * 0.5 + 0.5;
      uvs[i * 2 + 1] = pos.getY(i) * 0.5 + 0.5;
    }
    g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  }
  for (const attrName of Object.keys(g.attributes)) {
    if (attrName !== 'position' && attrName !== 'normal' && attrName !== 'uv') {
      g.deleteAttribute(attrName);
    }
  }
  if (rotX !== 0) g.rotateX(rotX);
  if (rotZ !== 0) g.rotateZ(rotZ);
  if (rotY !== 0) g.rotateY(rotY);
  if (x !== 0 || y !== 0 || z !== 0) g.translate(x, y, z);
  bucket.push(g);
}

function makeWorldBox(w: number, h: number, d: number, tileW = 1.6, tileH = 1.6): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(w, h, d);
  const pos = geo.attributes.position;
  const norm = geo.attributes.normal;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const nx = Math.abs(norm.getX(i));
    const ny = Math.abs(norm.getY(i));
    if (ny > 0.6) {
      uv.setXY(i, x / tileW + 0.5, z / tileW + 0.5);
    } else if (nx > 0.6) {
      uv.setXY(i, z / tileW + 0.5, y / tileH + 0.5);
    } else {
      uv.setXY(i, x / tileW + 0.5, y / tileH + 0.5);
    }
  }
  uv.needsUpdate = true;
  return geo;
}

function createBayScrollCurveGeo(
  points: THREE.Vector3[],
  radius = 0.012,
  tubularSegments = 7,
): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, tubularSegments, radius, 4, false);
}

function createScrollHornGeo(): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.08, 0.0, 0),
    new THREE.Vector3(0.01, 0.008, 0),
    new THREE.Vector3(0.065, 0.042, 0),
    new THREE.Vector3(0.088, 0.095, 0),
    new THREE.Vector3(0.062, 0.125, 0),
    new THREE.Vector3(0.025, 0.112, 0),
  ]);
  return new THREE.TubeGeometry(curve, 8, 0.015, 4, false);
}

function mergeBucket(parts: THREE.BufferGeometry[]): THREE.BufferGeometry | null {
  if (parts.length === 0) return null;
  const merged = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  return merged ?? null;
}

function addInstancedFromBucket(
  parent: THREE.Group,
  parts: THREE.BufferGeometry[],
  mat: THREE.Material,
  matrices: THREE.Matrix4[],
  castShadow = true,
): void {
  if (matrices.length === 0) {
    parts.forEach((p) => p.dispose());
    return;
  }
  const geo = mergeBucket(parts);
  if (!geo) return;
  const inst = new THREE.InstancedMesh(geo, mat, matrices.length);
  inst.castShadow = castShadow;
  inst.receiveShadow = true;
  for (let i = 0; i < matrices.length; i++) {
    inst.setMatrixAt(i, matrices[i]);
  }
  inst.instanceMatrix.needsUpdate = true;
  parent.add(inst);
}

/**
 * Builds the unified, highly detailed complex heritage perimeter fence enclosing the
 * ENTIRE Lumbini Sacred Complex (Maya Devi Temple, inner monuments, surrounding Sacred Lake,
 * and outer pilgrim promenades) as one cohesive architectural boundary with 4 grand cardinal gates.
 * Uses InstancedMesh templates for pillars, Dharmachakra medallions, pickets, and gate towers
 * so draw calls and BVH geometry stay minimal while preserving intricate heritage detailing.
 */
export function buildLumbiniComplexPerimeterFence(
  mats: LumbiniPerimeterFenceMaterials,
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'lumbini-complex-perimeter-fence';

  const craft = getLumbiniGardenCraftMaterials();
  const basaltMat = craft.basaltMat;
  const castIronMat = craft.castIronMat;
  const giltBrassMat = craft.giltBrassMat;
  const weatheredMat = craft.weatheredSandstoneMat;
  const slateRoofMat = craft.slateRoofMat;

  // Continuous linear run buckets (8 perimeter runs -> tiny triangle count)
  const basaltRunParts: THREE.BufferGeometry[] = [];
  const brickRunParts: THREE.BufferGeometry[] = [];
  const stoneRunParts: THREE.BufferGeometry[] = [];
  const ironRunParts: THREE.BufferGeometry[] = [];

  // Instance transform arrays
  const bayMatrices: THREE.Matrix4[] = [];
  const pillarMatrices: THREE.Matrix4[] = [];
  const outerPicketMatrices: THREE.Matrix4[] = [];
  const centerTopPicketMatrices: THREE.Matrix4[] = [];
  const centerBotPicketMatrices: THREE.Matrix4[] = [];
  const tallSpearMatrices: THREE.Matrix4[] = [];
  const shortSpearMatrices: THREE.Matrix4[] = [];
  const ringMatrices: THREE.Matrix4[] = [];
  const cornerTowerMatrices: THREE.Matrix4[] = [];
  const gatePierMatrices: THREE.Matrix4[] = [];

  const tmpPos = new THREE.Vector3();
  const tmpQuat = new THREE.Quaternion();
  const tmpScale = new THREE.Vector3(1, 1, 1);
  const yAxis = new THREE.Vector3(0, 1, 0);

  const makeMat4 = (x: number, y: number, z: number, rotY: number, sx = 1): THREE.Matrix4 => {
    tmpPos.set(x, y, z);
    tmpQuat.setFromAxisAngle(yAxis, rotY);
    tmpScale.set(sx, 1, 1);
    return new THREE.Matrix4().compose(tmpPos, tmpQuat, tmpScale);
  };

  // Outer perimeter line (aligns flush along outer promenade borders around Temple + Sacred Lake)
  const xMin = -51.075;
  const xMax = 50.575;
  const zMin = -55.475;
  const zMax = 63.475;
  const gateXHalf = 3.65;
  const gateZ0 = 1.05;
  const gateZ1 = 6.95;

  const addFenceRun = (
    x0: number,
    z0: number,
    x1: number,
    z1: number,
    rotY: number,
  ) => {
    const dx = x1 - x0;
    const dz = z1 - z0;
    const totalLen = Math.hypot(dx, dz);
    const midX = (x0 + x1) * 0.5;
    const midZ = (z0 + z1) * 0.5;
    const clearRunLen = Math.max(0.5, totalLen - 0.5);

    // Continuous masonry footing, brick dado, Chunar stone coping & 3 cast-iron rails along the entire run
    pushNonIndexed(basaltRunParts, makeWorldBox(clearRunLen, 0.38, 0.42, 1.8, 1.0), -0.07, 0, rotY, 0, midX, midZ);
    pushNonIndexed(brickRunParts, makeWorldBox(clearRunLen, 0.50, 0.28, 1.8, 1.2), 0.37, 0, rotY, 0, midX, midZ);
    pushNonIndexed(stoneRunParts, makeWorldBox(clearRunLen, 0.12, 0.38, 1.6, 1.0), 0.68, 0, rotY, 0, midX, midZ);
    for (const [ry, rh, rw] of [
      [0.77, 0.055, 0.075],
      [1.64, 0.042, 0.065],
      [1.84, 0.052, 0.075],
    ] as Array<[number, number, number]>) {
      pushNonIndexed(ironRunParts, new THREE.BoxGeometry(clearRunLen, rh, rw), ry, 0, rotY, 0, midX, midZ);
    }

    const bayCount = Math.max(2, Math.round(totalLen / 4.25));
    for (let b = 0; b <= bayCount; b++) {
      const t = b / bayCount;
      const px = THREE.MathUtils.lerp(x0, x1, t);
      const pz = THREE.MathUtils.lerp(z0, z1, t);
      if (b > 0 && b < bayCount) {
        pillarMatrices.push(makeMat4(px, 0, pz, rotY));
      }
      if (b < bayCount) {
        const tNext = (b + 1) / bayCount;
        const bx = THREE.MathUtils.lerp(x0, x1, tNext);
        const bz = THREE.MathUtils.lerp(z0, z1, tNext);
        const bayLen = Math.hypot(bx - px, bz - pz);
        const clearBayLen = Math.max(0.4, bayLen - 0.36);
        const bayMidX = (px + bx) * 0.5;
        const bayMidZ = (pz + bz) * 0.5;
        const bayRotY = Math.atan2(-(bz - pz), bx - px);

        // Bay centerpiece medallion + dado panel + bronze bosses
        bayMatrices.push(makeMat4(bayMidX, 0, bayMidZ, bayRotY));

        // Vertical pickets, frieze rings & alternating lotus-spear finials
        const picketSpacing = 0.25;
        const pCount = Math.max(5, Math.round(clearBayLen / picketSpacing));
        for (let i = 1; i < pCount; i++) {
          const pt = i / pCount - 0.5;
          const localX = pt * clearBayLen;
          const wx = px + ((bx - px) / bayLen) * (bayLen * 0.5 + localX);
          const wz = pz + ((bz - pz) / bayLen) * (bayLen * 0.5 + localX);
          const distCenter = Math.abs(localX);

          ringMatrices.push(makeMat4(wx, 1.74, wz, bayRotY));
          if (i % 2 === 1) {
            tallSpearMatrices.push(makeMat4(wx, 0, wz, bayRotY));
          } else {
            shortSpearMatrices.push(makeMat4(wx, 0, wz, bayRotY));
          }

          if (distCenter >= 0.36) {
            outerPicketMatrices.push(makeMat4(wx, 0, wz, bayRotY));
          } else {
            centerTopPicketMatrices.push(makeMat4(wx, 0, wz, bayRotY));
            centerBotPicketMatrices.push(makeMat4(wx, 0, wz, bayRotY));
          }
        }
      }
    }
  };

  // 1. 4 Monumental Corner Bastion Pagoda Towers
  for (const [cx, cz] of [
    [xMin, zMax],
    [xMax, zMax],
    [xMin, zMin],
    [xMax, zMin],
  ] as Array<[number, number]>) {
    cornerTowerMatrices.push(makeMat4(cx, 0, cz, 0));
  }

  // 2. 8 Grand Cardinal Gate Piers (South, North, West, East openings)
  for (const [gx, gz, gRot] of [
    [-gateXHalf, zMax, 0],
    [gateXHalf, zMax, 0],
    [-gateXHalf, zMin, 0],
    [gateXHalf, zMin, 0],
    [xMin, gateZ0, Math.PI * 0.5],
    [xMin, gateZ1, Math.PI * 0.5],
    [xMax, gateZ0, Math.PI * 0.5],
    [xMax, gateZ1, Math.PI * 0.5],
  ] as Array<[number, number, number]>) {
    gatePierMatrices.push(makeMat4(gx, 0, gz, gRot));
  }

  // 3. 8 Continuous Multi-Bay Ornate Perimeter Runs
  addFenceRun(xMin, zMax, -gateXHalf, zMax, 0);
  addFenceRun(gateXHalf, zMax, xMax, zMax, 0);
  addFenceRun(xMin, zMin, -gateXHalf, zMin, 0);
  addFenceRun(gateXHalf, zMin, xMax, zMin, 0);
  addFenceRun(xMin, zMin, xMin, gateZ0, Math.PI * 0.5);
  addFenceRun(xMin, gateZ1, xMin, zMax, Math.PI * 0.5);
  addFenceRun(xMax, zMin, xMax, gateZ0, Math.PI * 0.5);
  addFenceRun(xMax, gateZ1, xMax, zMax, Math.PI * 0.5);

  // Finalize static continuous runs
  const addRunMesh = (parts: THREE.BufferGeometry[], mat: THREE.Material) => {
    const geo = mergeBucket(parts);
    if (!geo) return;
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
  };
  addRunMesh(basaltRunParts, basaltMat);
  addRunMesh(brickRunParts, mats.brickMat);
  addRunMesh(stoneRunParts, mats.chunarStoneMat);
  addRunMesh(ironRunParts, castIronMat);

  // ---- Template A: Intermediate Heritage Octagonal Pillar ----
  const pBasalt: THREE.BufferGeometry[] = [];
  const pStone: THREE.BufferGeometry[] = [];
  const pWeathered: THREE.BufferGeometry[] = [];
  const pBronze: THREE.BufferGeometry[] = [];
  const pGilt: THREE.BufferGeometry[] = [];

  pushNonIndexed(pBasalt, makeWorldBox(0.50, 0.42, 0.50, 1.0, 1.0), -0.05);
  pushNonIndexed(pStone, makeWorldBox(0.42, 0.58, 0.42, 1.2, 1.2), 0.45);
  pushNonIndexed(pWeathered, makeWorldBox(0.46, 0.08, 0.46, 1.2, 1.0), 0.76);
  pushNonIndexed(pStone, new THREE.CylinderGeometry(0.155, 0.175, 1.16, 8), 1.38, 0, Math.PI / 8, 0);
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2;
    pushNonIndexed(pBasalt, new THREE.BoxGeometry(0.055, 0.96, 0.032), 1.38, 0, a, 0, Math.sin(a) * 0.15, Math.cos(a) * 0.15);
  }
  pushNonIndexed(pBronze, new THREE.CylinderGeometry(0.185, 0.185, 0.08, 8), 1.38, 0, Math.PI / 8, 0);
  pushNonIndexed(pWeathered, new THREE.CylinderGeometry(0.22, 0.155, 0.12, 8), 2.02, 0, Math.PI / 8, 0);
  pushNonIndexed(pStone, makeWorldBox(0.44, 0.09, 0.44, 1.2, 1.0), 2.125);
  pushNonIndexed(pBronze, new THREE.CylinderGeometry(0.13, 0.16, 0.05, 8), 2.195);
  const kalashGeo = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.11, 0.0),
      new THREE.Vector2(0.08, 0.032),
      new THREE.Vector2(0.135, 0.085),
      new THREE.Vector2(0.125, 0.145),
      new THREE.Vector2(0.058, 0.195),
      new THREE.Vector2(0.082, 0.23),
      new THREE.Vector2(0.032, 0.29),
      new THREE.Vector2(0.014, 0.35),
      new THREE.Vector2(0.0, 0.40),
    ],
    10,
  );
  pushNonIndexed(pGilt, kalashGeo, 2.22);

  addInstancedFromBucket(group, pBasalt, basaltMat, pillarMatrices);
  addInstancedFromBucket(group, pStone, mats.chunarStoneMat, pillarMatrices);
  addInstancedFromBucket(group, pWeathered, weatheredMat, pillarMatrices);
  addInstancedFromBucket(group, pBronze, mats.warmBronzeMat, pillarMatrices);
  addInstancedFromBucket(group, pGilt, giltBrassMat, pillarMatrices);

  // ---- Template B: Bay Dharmachakra Medallion, S-Scrolls & Recessed Dado Panel ----
  const bBasalt: THREE.BufferGeometry[] = [];
  const bIron: THREE.BufferGeometry[] = [];
  const bBronze: THREE.BufferGeometry[] = [];
  const bGilt: THREE.BufferGeometry[] = [];

  pushNonIndexed(bBasalt, makeWorldBox(2.9, 0.26, 0.305, 1.4, 1.0), 0.37);
  for (const faceSign of [-1, 1]) {
    pushNonIndexed(bBronze, new THREE.CylinderGeometry(0.065, 0.075, 0.032, 8), 0.37, Math.PI / 2, 0, 0, 0, faceSign * 0.155);
  }
  const wheelY = 1.20;
  pushNonIndexed(bIron, new THREE.TorusGeometry(0.34, 0.020, 4, 16), wheelY);
  pushNonIndexed(bBronze, new THREE.TorusGeometry(0.285, 0.015, 4, 14), wheelY);
  pushNonIndexed(bGilt, new THREE.TorusGeometry(0.23, 0.014, 4, 14), wheelY);
  pushNonIndexed(bGilt, new THREE.CylinderGeometry(0.062, 0.062, 0.044, 8), wheelY, Math.PI / 2, 0, 0);
  for (let sp = 0; sp < 4; sp++) {
    pushNonIndexed(bGilt, new THREE.BoxGeometry(0.44, 0.020, 0.018), wheelY, 0, 0, (sp * Math.PI) / 4);
  }
  for (const sDir of [-1, 1]) {
    const sInner = sDir * 0.34;
    const sOuter = sDir * 0.80;
    pushNonIndexed(
      bBronze,
      createBayScrollCurveGeo([
        new THREE.Vector3(sInner, wheelY + 0.14, 0),
        new THREE.Vector3((sInner + sOuter) * 0.5, wheelY + 0.34, 0),
        new THREE.Vector3(sOuter, wheelY + 0.10, 0),
        new THREE.Vector3(sOuter * 0.88, wheelY - 0.04, 0),
      ]),
    );
    pushNonIndexed(
      bBronze,
      createBayScrollCurveGeo([
        new THREE.Vector3(sInner, wheelY - 0.14, 0),
        new THREE.Vector3((sInner + sOuter) * 0.5, wheelY - 0.34, 0),
        new THREE.Vector3(sOuter, wheelY - 0.10, 0),
        new THREE.Vector3(sOuter * 0.88, wheelY + 0.04, 0),
      ]),
    );
  }

  addInstancedFromBucket(group, bBasalt, basaltMat, bayMatrices);
  addInstancedFromBucket(group, bIron, castIronMat, bayMatrices);
  addInstancedFromBucket(group, bBronze, mats.warmBronzeMat, bayMatrices);
  addInstancedFromBucket(group, bGilt, giltBrassMat, bayMatrices);

  // ---- Template C: Pickets, Upper Frieze Rings & Spear Finials (InstancedMesh) ----
  addInstancedFromBucket(group, [new THREE.TorusGeometry(0.068, 0.011, 4, 8)], mats.warmBronzeMat, ringMatrices, false);

  addInstancedFromBucket(
    group,
    [new THREE.BoxGeometry(0.024, 1.08, 0.024).translate(0, 1.30, 0)],
    castIronMat,
    outerPicketMatrices,
    false,
  );
  addInstancedFromBucket(
    group,
    [new THREE.BoxGeometry(0.040, 0.036, 0.040).translate(0, 1.20, 0)],
    mats.warmBronzeMat,
    outerPicketMatrices,
    false,
  );
  addInstancedFromBucket(
    group,
    [new THREE.BoxGeometry(0.022, 0.30, 0.022).translate(0, 1.69, 0)],
    castIronMat,
    centerTopPicketMatrices,
    false,
  );
  addInstancedFromBucket(
    group,
    [new THREE.BoxGeometry(0.022, 0.14, 0.022).translate(0, 0.84, 0)],
    castIronMat,
    centerBotPicketMatrices,
    false,
  );

  // Tall & Short Lotus Spear Finials
  addInstancedFromBucket(
    group,
    [new THREE.BoxGeometry(0.022, 0.09, 0.022).translate(0, 1.90, 0)],
    castIronMat,
    tallSpearMatrices,
    false,
  );
  addInstancedFromBucket(
    group,
    [new THREE.ConeGeometry(0.024, 0.17, 4).rotateY(Math.PI / 4).translate(0, 2.02, 0)],
    mats.warmBronzeMat,
    tallSpearMatrices,
    false,
  );
  addInstancedFromBucket(
    group,
    [new THREE.BoxGeometry(0.022, 0.04, 0.022).translate(0, 1.88, 0)],
    castIronMat,
    shortSpearMatrices,
    false,
  );
  addInstancedFromBucket(
    group,
    [new THREE.ConeGeometry(0.022, 0.115, 4).rotateY(Math.PI / 4).translate(0, 1.95, 0)],
    mats.warmBronzeMat,
    shortSpearMatrices,
    false,
  );

  // ---- Template D: Corner Bastions & Cardinal Gate Pagoda Piers (InstancedMesh) ----
  const buildPierTemplate = (isCorner: boolean, matrices: THREE.Matrix4[]) => {
    const podiumW = isCorner ? 1.06 : 1.02;
    const shaftW = isCorner ? 0.66 : 0.64;
    const roofW = isCorner ? 1.28 : 1.26;
    const shaftH = isCorner ? 1.56 : 1.78;
    const shaftBottom = 0.86;
    const shaftTop = shaftBottom + shaftH;

    const mBasalt: THREE.BufferGeometry[] = [];
    const mBrick: THREE.BufferGeometry[] = [];
    const mStone: THREE.BufferGeometry[] = [];
    const mWeathered: THREE.BufferGeometry[] = [];
    const mBronze: THREE.BufferGeometry[] = [];
    const mGilt: THREE.BufferGeometry[] = [];
    const mRoof: THREE.BufferGeometry[] = [];

    pushNonIndexed(mBasalt, makeWorldBox(podiumW + 0.14, 0.42, podiumW + 0.14, 1.2, 1.0), -0.05);
    pushNonIndexed(mBrick, makeWorldBox(podiumW, 0.34, podiumW, 1.2, 1.0), 0.33);
    pushNonIndexed(mStone, makeWorldBox(podiumW - 0.14, 0.24, podiumW - 0.14, 1.2, 1.0), 0.62);
    pushNonIndexed(mWeathered, makeWorldBox(podiumW - 0.22, 0.12, podiumW - 0.22, 1.2, 1.0), 0.80);

    pushNonIndexed(mStone, makeWorldBox(shaftW, shaftH, shaftW, 1.4, 1.6), shaftBottom + shaftH * 0.5);
    for (const cx of [-shaftW * 0.46, shaftW * 0.46]) {
      for (const cz of [-shaftW * 0.46, shaftW * 0.46]) {
        pushNonIndexed(mWeathered, new THREE.CylinderGeometry(0.052, 0.058, shaftH - 0.08, 6), shaftBottom + shaftH * 0.5, 0, 0, 0, cx, cz);
      }
    }
    for (const cy of [shaftBottom + shaftH * 0.38, shaftBottom + shaftH * 0.78]) {
      pushNonIndexed(mBronze, makeWorldBox(shaftW + 0.08, 0.08, shaftW + 0.08), cy);
    }
    const medY = shaftBottom + shaftH * 0.58;
    for (let f = 0; f < 4; f++) {
      const fa = (f * Math.PI) / 2;
      const fx = Math.sin(fa) * (shaftW * 0.5 + 0.015);
      const fz = Math.cos(fa) * (shaftW * 0.5 + 0.015);
      pushNonIndexed(mBasalt, new THREE.BoxGeometry(0.34, 0.34, 0.03), medY, 0, fa, 0, fx, fz);
      pushNonIndexed(mGilt, new THREE.TorusGeometry(0.11, 0.014, 4, 12), medY, 0, fa, 0, Math.sin(fa) * (shaftW * 0.5 + 0.03), Math.cos(fa) * (shaftW * 0.5 + 0.03));
      pushNonIndexed(mGilt, new THREE.CylinderGeometry(0.035, 0.035, 0.035, 8), medY, Math.PI / 2, fa, 0, Math.sin(fa) * (shaftW * 0.5 + 0.03), Math.cos(fa) * (shaftW * 0.5 + 0.03));
    }

    pushNonIndexed(mWeathered, makeWorldBox(shaftW + 0.16, 0.12, shaftW + 0.16), shaftTop + 0.06);
    pushNonIndexed(mStone, makeWorldBox(shaftW + 0.30, 0.12, shaftW + 0.30), shaftTop + 0.18);

    const roofBaseY = shaftTop + 0.24;
    pushNonIndexed(mRoof, createRectangularHipRoofGeometry(roofW, 0.36, roofW, 0.44), roofBaseY + 0.18);
    const hornGeo = createScrollHornGeo();
    for (let c = 0; c < 4; c++) {
      const ca = Math.PI / 4 + (c * Math.PI) / 2;
      pushNonIndexed(mGilt, hornGeo.clone(), roofBaseY + 0.01, 0, -ca, 0, Math.cos(ca) * (roofW * 0.62), Math.sin(ca) * (roofW * 0.62));
      const bx = Math.cos(ca) * (roofW * 0.54);
      const bz = Math.sin(ca) * (roofW * 0.54);
      pushNonIndexed(mBronze, new THREE.CylinderGeometry(0.008, 0.008, 0.06, 4), roofBaseY - 0.03, 0, 0, 0, bx, bz);
      pushNonIndexed(mGilt, new THREE.ConeGeometry(0.032, 0.065, 6), roofBaseY - 0.075, 0, 0, 0, bx, bz);
    }
    hornGeo.dispose();

    const roof2Y = roofBaseY + 0.36;
    pushNonIndexed(mBronze, makeWorldBox(roofW * 0.52, 0.08, roofW * 0.52), roof2Y + 0.04);
    pushNonIndexed(mRoof, createRectangularHipRoofGeometry(roofW * 0.66, 0.26, roofW * 0.66, 0.20), roof2Y + 0.21);

    addInstancedFromBucket(group, mBasalt, basaltMat, matrices);
    addInstancedFromBucket(group, mBrick, mats.brickMat, matrices);
    addInstancedFromBucket(group, mStone, mats.chunarStoneMat, matrices);
    addInstancedFromBucket(group, mWeathered, weatheredMat, matrices);
    addInstancedFromBucket(group, mBronze, mats.warmBronzeMat, matrices);
    addInstancedFromBucket(group, mGilt, giltBrassMat, matrices);
    addInstancedFromBucket(group, mRoof, slateRoofMat, matrices);

    const spireY = roof2Y + 0.34;
    for (const mat4 of matrices) {
      const p = new THREE.Vector3().setFromMatrixPosition(mat4);
      const gajur = createDetailedGajurSpire(giltBrassMat, mats.warmBronzeMat, 0.54, 0.16);
      gajur.position.set(p.x, spireY, p.z);
      group.add(gajur);
    }
  };

  buildPierTemplate(true, cornerTowerMatrices);
  buildPierTemplate(false, gatePierMatrices);

  return group;
}

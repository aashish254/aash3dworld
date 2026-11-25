import * as THREE from 'three';

export interface NavMeshVertex {
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  nz: number;
}

export interface HorizontalCollisionResult {
  x: number;
  z: number;
  collided: boolean;
  hitNormalX: number;
  hitNormalZ: number;
}

export interface WallClearanceResult {
  x: number;
  z: number;
  pushed: boolean;
  normalX: number;
  normalZ: number;
}

export interface PhysicsWorldStats {
  floorTriangles: number;
  wallTriangles: number;
  instancedColliders: number;
  navVertices: number;
  floorBvhNodes: number;
  wallBvhNodes: number;
}

export interface SanitizedBarrierBox {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
  isFloor: boolean;
  name?: string;
}

export interface GeometrySanitizeOptions {
  excludeRoots?: Set<THREE.Object3D>;
  excludeSnapCategories?: boolean;
  reportedTargets?: Array<string | THREE.Object3D>;
  minWallThickness?: number;
  minFloorThickness?: number;
}

export interface GeometrySanitizeReport {
  scannedMeshes: number;
  repairedGeometries: number;
  strippedDegenerateTris: number;
  recomputedNormals: number;
  addedUv1Count: number;
  sanitizedBarriers: number;
  sanitizedBarrierBoxes: SanitizedBarrierBox[];
}

interface BvhNode {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
  leftOrStart: number;
  rightOrCount: number; // > 0 => internal (right child index); <= 0 => leaf (-count)
}

interface TriList {
  count: number;
  capacity: number;
  ax: Float32Array;
  ay: Float32Array;
  az: Float32Array;
  bx: Float32Array;
  by: Float32Array;
  bz: Float32Array;
  cx: Float32Array;
  cy: Float32Array;
  cz: Float32Array;
  ny: Float32Array;
  minX: Float32Array;
  minY: Float32Array;
  minZ: Float32Array;
  maxX: Float32Array;
  maxY: Float32Array;
  maxZ: Float32Array;
  centX: Float32Array;
  centY: Float32Array;
  centZ: Float32Array;
}

interface InstancedCollider {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
  cx: number;
  cz: number;
  radius: number;
}

const LEAF_MAX_PRIMS = 8;
const MAX_BVH_DEPTH = 24;
const NAV_CELL_SIZE = 2.0;

function createTriList(initialCapacity = 2048): TriList {
  return {
    count: 0,
    capacity: initialCapacity,
    ax: new Float32Array(initialCapacity),
    ay: new Float32Array(initialCapacity),
    az: new Float32Array(initialCapacity),
    bx: new Float32Array(initialCapacity),
    by: new Float32Array(initialCapacity),
    bz: new Float32Array(initialCapacity),
    cx: new Float32Array(initialCapacity),
    cy: new Float32Array(initialCapacity),
    cz: new Float32Array(initialCapacity),
    ny: new Float32Array(initialCapacity),
    minX: new Float32Array(initialCapacity),
    minY: new Float32Array(initialCapacity),
    minZ: new Float32Array(initialCapacity),
    maxX: new Float32Array(initialCapacity),
    maxY: new Float32Array(initialCapacity),
    maxZ: new Float32Array(initialCapacity),
    centX: new Float32Array(initialCapacity),
    centY: new Float32Array(initialCapacity),
    centZ: new Float32Array(initialCapacity),
  };
}

function growTriList(list: TriList): void {
  const nextCap = Math.max(256, list.capacity * 2);
  const resize = (arr: Float32Array): Float32Array => {
    const out = new Float32Array(nextCap);
    out.set(arr);
    return out;
  };
  list.ax = resize(list.ax);
  list.ay = resize(list.ay);
  list.az = resize(list.az);
  list.bx = resize(list.bx);
  list.by = resize(list.by);
  list.bz = resize(list.bz);
  list.cx = resize(list.cx);
  list.cy = resize(list.cy);
  list.cz = resize(list.cz);
  list.ny = resize(list.ny);
  list.minX = resize(list.minX);
  list.minY = resize(list.minY);
  list.minZ = resize(list.minZ);
  list.maxX = resize(list.maxX);
  list.maxY = resize(list.maxY);
  list.maxZ = resize(list.maxZ);
  list.centX = resize(list.centX);
  list.centY = resize(list.centY);
  list.centZ = resize(list.centZ);
  list.capacity = nextCap;
}

function pushTri(
  list: TriList,
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number,
  cx: number,
  cy: number,
  cz: number,
  ny: number,
): void {
  if (list.count >= list.capacity) {
    growTriList(list);
  }
  const i = list.count++;
  list.ax[i] = ax;
  list.ay[i] = ay;
  list.az[i] = az;
  list.bx[i] = bx;
  list.by[i] = by;
  list.bz[i] = bz;
  list.cx[i] = cx;
  list.cy[i] = cy;
  list.cz[i] = cz;
  list.ny[i] = ny;

  const minX = ax < bx ? (ax < cx ? ax : cx) : bx < cx ? bx : cx;
  const minY = ay < by ? (ay < cy ? ay : cy) : by < cy ? by : cy;
  const minZ = az < bz ? (az < cz ? az : cz) : bz < cz ? bz : cz;
  const maxX = ax > bx ? (ax > cx ? ax : cx) : bx > cx ? bx : cx;
  const maxY = ay > by ? (ay > cy ? ay : cy) : by > cy ? by : cy;
  const maxZ = az > bz ? (az > cz ? az : cz) : bz > cz ? bz : cz;

  list.minX[i] = minX;
  list.minY[i] = minY;
  list.minZ[i] = minZ;
  list.maxX[i] = maxX;
  list.maxY[i] = maxY;
  list.maxZ[i] = maxZ;

  list.centX[i] = (ax + bx + cx) / 3;
  list.centY[i] = (ay + by + cy) / 3;
  list.centZ[i] = (az + bz + cz) / 3;
}

function buildFlatBvh(
  count: number,
  minX: Float32Array,
  minY: Float32Array,
  minZ: Float32Array,
  maxX: Float32Array,
  maxY: Float32Array,
  maxZ: Float32Array,
  centX: Float32Array,
  centY: Float32Array,
  centZ: Float32Array,
): { nodes: BvhNode[]; indices: Int32Array } {
  const indices = new Int32Array(count);
  for (let i = 0; i < count; i++) indices[i] = i;
  if (count === 0) return { nodes: [], indices };

  const nodes: BvhNode[] = [];
  const stack: Array<{ nodeIdx: number; start: number; end: number; depth: number }> = [];

  const makeNodeBounds = (start: number, end: number): BvhNode => {
    let bMinX = Infinity;
    let bMinY = Infinity;
    let bMinZ = Infinity;
    let bMaxX = -Infinity;
    let bMaxY = -Infinity;
    let bMaxZ = -Infinity;
    for (let k = start; k < end; k++) {
      const idx = indices[k];
      if (minX[idx] < bMinX) bMinX = minX[idx];
      if (minY[idx] < bMinY) bMinY = minY[idx];
      if (minZ[idx] < bMinZ) bMinZ = minZ[idx];
      if (maxX[idx] > bMaxX) bMaxX = maxX[idx];
      if (maxY[idx] > bMaxY) bMaxY = maxY[idx];
      if (maxZ[idx] > bMaxZ) bMaxZ = maxZ[idx];
    }
    return {
      minX: bMinX,
      minY: bMinY,
      minZ: bMinZ,
      maxX: bMaxX,
      maxY: bMaxY,
      maxZ: bMaxZ,
      leftOrStart: start,
      rightOrCount: -(end - start),
    };
  };

  nodes.push(makeNodeBounds(0, count));
  stack.push({ nodeIdx: 0, start: 0, end: count, depth: 0 });

  while (stack.length > 0) {
    const job = stack.pop()!;
    const primCount = job.end - job.start;
    if (primCount <= LEAF_MAX_PRIMS || job.depth >= MAX_BVH_DEPTH) continue;

    // Centroid bounds to choose split axis
    let cMinX = Infinity;
    let cMinY = Infinity;
    let cMinZ = Infinity;
    let cMaxX = -Infinity;
    let cMaxY = -Infinity;
    let cMaxZ = -Infinity;
    for (let k = job.start; k < job.end; k++) {
      const idx = indices[k];
      const cx = centX[idx];
      const cy = centY[idx];
      const cz = centZ[idx];
      if (cx < cMinX) cMinX = cx;
      if (cy < cMinY) cMinY = cy;
      if (cz < cMinZ) cMinZ = cz;
      if (cx > cMaxX) cMaxX = cx;
      if (cy > cMaxY) cMaxY = cy;
      if (cz > cMaxZ) cMaxZ = cz;
    }

    const spanX = cMaxX - cMinX;
    const spanY = cMaxY - cMinY;
    const spanZ = cMaxZ - cMinZ;
    let axis = 0;
    let centArr = centX;
    let midVal = (cMinX + cMaxX) * 0.5;
    if (spanY >= spanX && spanY >= spanZ) {
      axis = 1;
      centArr = centY;
      midVal = (cMinY + cMaxY) * 0.5;
    } else if (spanZ >= spanX && spanZ >= spanY) {
      axis = 2;
      centArr = centZ;
      midVal = (cMinZ + cMaxZ) * 0.5;
    }

    if ((axis === 0 ? spanX : axis === 1 ? spanY : spanZ) < 1e-5) {
      continue;
    }

    // Partition in place around centroid midpoint
    let left = job.start;
    let right = job.end - 1;
    while (left <= right) {
      while (left <= right && centArr[indices[left]] < midVal) left++;
      while (left <= right && centArr[indices[right]] >= midVal) right--;
      if (left < right) {
        const tmp = indices[left];
        indices[left] = indices[right];
        indices[right] = tmp;
        left++;
        right--;
      }
    }

    let split = left;
    if (split === job.start || split === job.end) {
      split = (job.start + job.end) >> 1;
    }

    const leftIdx = nodes.length;
    nodes.push(makeNodeBounds(job.start, split));
    const rightIdx = nodes.length;
    nodes.push(makeNodeBounds(split, job.end));

    nodes[job.nodeIdx].leftOrStart = leftIdx;
    nodes[job.nodeIdx].rightOrCount = rightIdx;

    stack.push({ nodeIdx: rightIdx, start: split, end: job.end, depth: job.depth + 1 });
    stack.push({ nodeIdx: leftIdx, start: job.start, end: split, depth: job.depth + 1 });
  }

  return { nodes, indices };
}

// Pre-allocated scratch buffers for zero-allocation frame queries
const _travStack = new Int32Array(128);
const _clipInX = new Float64Array(8);
const _clipInY = new Float64Array(8);
const _clipInZ = new Float64Array(8);
const _clipTmpX = new Float64Array(8);
const _clipTmpY = new Float64Array(8);
const _clipTmpZ = new Float64Array(8);
const _clipOutX = new Float64Array(8);
const _clipOutY = new Float64Array(8);
const _clipOutZ = new Float64Array(8);

const _vA = new THREE.Vector3();
const _vB = new THREE.Vector3();
const _vC = new THREE.Vector3();
const _instMat = new THREE.Matrix4();
const _worldInstMat = new THREE.Matrix4();
const _instBox = new THREE.Box3();
const _localPos = new THREE.Vector3();
const _worldPos = new THREE.Vector3();

function clipYPlane(
  inCount: number,
  inX: Float64Array,
  inY: Float64Array,
  inZ: Float64Array,
  outX: Float64Array,
  outY: Float64Array,
  outZ: Float64Array,
  planeY: number,
  keepAbove: boolean,
): number {
  if (inCount === 0) return 0;
  let outCount = 0;

  let prevX = inX[inCount - 1];
  let prevY = inY[inCount - 1];
  let prevZ = inZ[inCount - 1];
  let prevInside = keepAbove ? prevY >= planeY : prevY <= planeY;

  for (let i = 0; i < inCount; i++) {
    const curX = inX[i];
    const curY = inY[i];
    const curZ = inZ[i];
    const curInside = keepAbove ? curY >= planeY : curY <= planeY;

    if (curInside !== prevInside) {
      const denom = curY - prevY;
      const t = Math.abs(denom) > 1e-8 ? (planeY - prevY) / denom : 0;
      outX[outCount] = prevX + (curX - prevX) * t;
      outY[outCount] = planeY;
      outZ[outCount] = prevZ + (curZ - prevZ) * t;
      outCount++;
    }
    if (curInside) {
      outX[outCount] = curX;
      outY[outCount] = curY;
      outZ[outCount] = curZ;
      outCount++;
    }

    prevX = curX;
    prevY = curY;
    prevZ = curZ;
    prevInside = curInside;
  }

  return outCount;
}

function pointInConvexPolyXZ(
  px: number,
  pz: number,
  polyX: Float64Array,
  polyZ: Float64Array,
  count: number,
): boolean {
  if (count < 3) return false;
  let posSign = 0;
  let negSign = 0;
  for (let i = 0; i < count; i++) {
    const j = (i + 1) % count;
    const ex = polyX[j] - polyX[i];
    const ez = polyZ[j] - polyZ[i];
    const cross = ex * (pz - polyZ[i]) - ez * (px - polyX[i]);
    if (cross > 1e-6) posSign++;
    else if (cross < -1e-6) negSign++;
    if (posSign > 0 && negSign > 0) return false;
  }
  return posSign > 0 || negSign > 0;
}

function sampleTriangleYAtXZ(
  x: number,
  z: number,
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number,
  cx: number,
  cy: number,
  cz: number,
): number | null {
  const v0x = cx - ax;
  const v0z = cz - az;
  const v1x = bx - ax;
  const v1z = bz - az;
  const v2x = x - ax;
  const v2z = z - az;

  const dot00 = v0x * v0x + v0z * v0z;
  const dot01 = v0x * v1x + v0z * v1z;
  const dot02 = v0x * v2x + v0z * v2z;
  const dot11 = v1x * v1x + v1z * v1z;
  const dot12 = v1x * v2x + v1z * v2z;

  const denom = dot00 * dot11 - dot01 * dot01;
  if (Math.abs(denom) < 1e-9) return null;
  const invDenom = 1 / denom;
  const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
  const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

  const eps = -0.0025;
  if (u >= eps && v >= eps && u + v <= 1 - eps) {
    const cu = Math.max(0, Math.min(1, u));
    const cv = Math.max(0, Math.min(1 - cu, v));
    const cw = 1 - cu - cv;
    return cw * ay + cv * by + cu * cy;
  }
  return null;
}

function isObjectExcluded(
  obj: THREE.Object3D,
  excludeRoots: Set<THREE.Object3D>,
  excludeSnapCategories: boolean,
): boolean {
  let cur: THREE.Object3D | null = obj;
  while (cur) {
    if (excludeRoots.has(cur)) return true;
    if (cur.userData?.nonCollidable) return true;
    if (excludeSnapCategories && cur.userData?.snapCategory) return true;
    cur = cur.parent;
  }
  return false;
}

function isMaterialCollidable(mat: THREE.Material | THREE.Material[]): boolean {
  const m = Array.isArray(mat) ? mat[0] : mat;
  if (!m) return false;
  if (m.visible === false) return false;
  if (m.depthWrite === false) return false;
  if (m.transparent && m.opacity < 0.85) return false;
  return true;
}

function computeLowTrunkRadiusXZ(geo: THREE.BufferGeometry, maxLocalY = 2.2): number {
  const pos = geo.getAttribute('position');
  if (!pos) return 0.35;
  let minY = Infinity;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y < minY) minY = y;
  }
  const cutoffY = minY + maxLocalY;
  let maxR2 = 0;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) <= cutoffY) {
      const r2 = pos.getX(i) * pos.getX(i) + pos.getZ(i) * pos.getZ(i);
      if (r2 > maxR2) maxR2 = r2;
    }
  }
  if (maxR2 <= 1e-6) {
    if (!geo.boundingBox) geo.computeBoundingBox();
    const bb = geo.boundingBox;
    if (!bb) return 0.35;
    return Math.max(
      Math.abs(bb.max.x - bb.min.x),
      Math.abs(bb.max.z - bb.min.z),
    ) * 0.45;
  }
  return Math.sqrt(maxR2);
}

const _sanitizeLocalBox = new THREE.Box3();
const _sanitizeWorldBox = new THREE.Box3();

function matchesReportedTarget(
  obj: THREE.Object3D,
  targetNames: string[],
  targetObjects: Set<THREE.Object3D>,
): boolean {
  if (targetObjects.size === 0 && targetNames.length === 0) return false;
  let cur: THREE.Object3D | null = obj;
  while (cur) {
    if (targetObjects.has(cur)) return true;
    if (cur.name && targetNames.length > 0) {
      const lower = cur.name.toLowerCase();
      for (let i = 0; i < targetNames.length; i++) {
        if (lower.includes(targetNames[i])) return true;
      }
    }
    cur = cur.parent;
  }
  return false;
}

function populateMissingUvsAndUv1(geo: THREE.BufferGeometry): boolean {
  const pos = geo.getAttribute('position');
  if (!pos) return false;
  let uv = geo.getAttribute('uv');
  if (!uv || uv.count !== pos.count) {
    const uvArr = new Float32Array(pos.count * 2);
    const norm = geo.getAttribute('normal');
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      if (norm) {
        const ax = Math.abs(norm.getX(i));
        const ay = Math.abs(norm.getY(i));
        const az = Math.abs(norm.getZ(i));
        if (ay >= ax && ay >= az) {
          uvArr[i * 2] = x;
          uvArr[i * 2 + 1] = z;
        } else if (ax >= az) {
          uvArr[i * 2] = z;
          uvArr[i * 2 + 1] = y;
        } else {
          uvArr[i * 2] = x;
          uvArr[i * 2 + 1] = y;
        }
      } else {
        uvArr[i * 2] = x;
        uvArr[i * 2 + 1] = z;
      }
    }
    uv = new THREE.BufferAttribute(uvArr, 2);
    geo.setAttribute('uv', uv);
  }
  const uv1 = geo.getAttribute('uv1');
  if (!uv1 || uv1.count !== pos.count) {
    geo.setAttribute('uv1', uv.clone());
    return true;
  }
  return false;
}

function sanitizeBufferGeometry(geo: THREE.BufferGeometry): {
  repaired: boolean;
  strippedDegenerate: number;
  recomputedNormals: boolean;
  addedUv1: boolean;
} {
  const pos = geo.getAttribute('position');
  if (!pos || pos.count < 3) {
    return { repaired: false, strippedDegenerate: 0, recomputedNormals: false, addedUv1: false };
  }

  let repaired = false;
  let strippedDegenerate = 0;
  let recomputedNormals = false;

  // 1. Repair any non-finite vertex positions in place before checking triangles
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
      pos.setXYZ(i, Number.isFinite(x) ? x : 0, Number.isFinite(y) ? y : 0, Number.isFinite(z) ? z : 0);
      repaired = true;
    }
  }
  if (repaired) pos.needsUpdate = true;

  // 2. Strip zero-area degenerate triangles
  const index = geo.getIndex();
  if (index) {
    const triCount = Math.floor(index.count / 3);
    let hasDegenerate = false;
    for (let t = 0; t < triCount; t++) {
      const i0 = index.getX(t * 3);
      const i1 = index.getX(t * 3 + 1);
      const i2 = index.getX(t * 3 + 2);
      if (i0 === i1 || i1 === i2 || i0 === i2) {
        hasDegenerate = true;
        break;
      }
      const abx = pos.getX(i1) - pos.getX(i0);
      const aby = pos.getY(i1) - pos.getY(i0);
      const abz = pos.getZ(i1) - pos.getZ(i0);
      const acx = pos.getX(i2) - pos.getX(i0);
      const acy = pos.getY(i2) - pos.getY(i0);
      const acz = pos.getZ(i2) - pos.getZ(i0);
      const cx = aby * acz - abz * acy;
      const cy = abz * acx - abx * acz;
      const cz = abx * acy - aby * acx;
      if (cx * cx + cy * cy + cz * cz < 1e-12) {
        hasDegenerate = true;
        break;
      }
    }

    if (hasDegenerate) {
      const validIndices: number[] = [];
      for (let t = 0; t < triCount; t++) {
        const i0 = index.getX(t * 3);
        const i1 = index.getX(t * 3 + 1);
        const i2 = index.getX(t * 3 + 2);
        if (i0 === i1 || i1 === i2 || i0 === i2) {
          strippedDegenerate++;
          continue;
        }
        const abx = pos.getX(i1) - pos.getX(i0);
        const aby = pos.getY(i1) - pos.getY(i0);
        const abz = pos.getZ(i1) - pos.getZ(i0);
        const acx = pos.getX(i2) - pos.getX(i0);
        const acy = pos.getY(i2) - pos.getY(i0);
        const acz = pos.getZ(i2) - pos.getZ(i0);
        const cx = aby * acz - abz * acy;
        const cy = abz * acx - abx * acz;
        const cz = abx * acy - aby * acx;
        if (cx * cx + cy * cy + cz * cz < 1e-12) {
          strippedDegenerate++;
          continue;
        }
        validIndices.push(i0, i1, i2);
      }
      if (strippedDegenerate > 0 && validIndices.length >= 3) {
        geo.setIndex(validIndices);
        repaired = true;
      }
    }
  } else {
    const triCount = Math.floor(pos.count / 3);
    const keepTri: number[] = [];
    for (let t = 0; t < triCount; t++) {
      const i0 = t * 3;
      const i1 = t * 3 + 1;
      const i2 = t * 3 + 2;
      const abx = pos.getX(i1) - pos.getX(i0);
      const aby = pos.getY(i1) - pos.getY(i0);
      const abz = pos.getZ(i1) - pos.getZ(i0);
      const acx = pos.getX(i2) - pos.getX(i0);
      const acy = pos.getY(i2) - pos.getY(i0);
      const acz = pos.getZ(i2) - pos.getZ(i0);
      const cx = aby * acz - abz * acy;
      const cy = abz * acx - abx * acz;
      const cz = abx * acy - aby * acx;
      if (cx * cx + cy * cy + cz * cz < 1e-12) {
        strippedDegenerate++;
      } else {
        keepTri.push(t);
      }
    }
    if (strippedDegenerate > 0 && keepTri.length > 0) {
      const nextCount = keepTri.length * 3;
      for (const attrName of Object.keys(geo.attributes)) {
        const attr = geo.getAttribute(attrName);
        if (!attr || !('itemSize' in attr)) continue;
        const itemSize = attr.itemSize;
        const nextArr = new Float32Array(nextCount * itemSize);
        let writeIdx = 0;
        for (let k = 0; k < keepTri.length; k++) {
          const base = keepTri[k] * 3;
          for (let v = 0; v < 3; v++) {
            const srcV = base + v;
            for (let c = 0; c < itemSize; c++) {
              nextArr[writeIdx++] = attr.array[srcV * itemSize + c];
            }
          }
        }
        geo.setAttribute(attrName, new THREE.BufferAttribute(nextArr, itemSize));
      }
      repaired = true;
    }
  }

  // 3. Recompute missing or corrupted vertex normals
  const norm = geo.getAttribute('normal');
  let needsNormals = !norm || norm.count !== geo.getAttribute('position').count;
  if (!needsNormals && norm) {
    const sampleStep = Math.max(1, Math.floor(norm.count / 128));
    for (let i = 0; i < norm.count; i += sampleStep) {
      const nx = norm.getX(i);
      const ny = norm.getY(i);
      const nz = norm.getZ(i);
      if (!Number.isFinite(nx) || !Number.isFinite(ny) || !Number.isFinite(nz) || nx * nx + ny * ny + nz * nz < 1e-8) {
        needsNormals = true;
        break;
      }
    }
  }
  if (needsNormals) {
    geo.computeVertexNormals();
    recomputedNormals = true;
    repaired = true;
  }

  // 4. Populate missing uv & uv1 so Three.js aoMap (channel 1) renders properly
  const addedUv1 = populateMissingUvsAndUv1(geo);
  if (addedUv1) repaired = true;

  if (!geo.boundingBox || repaired) geo.computeBoundingBox();
  if (!geo.boundingSphere || repaired) geo.computeBoundingSphere();

  return { repaired, strippedDegenerate, recomputedNormals, addedUv1 };
}

/**
 * World Geometry Sanitizer:
 * Scans static scene geometry and reported meshes, strips degenerate/NaN triangles,
 * repairs normals, populates `uv1` for AO maps, and builds solid watertight physical
 * barrier boxes for thin single-sided, inverted, or pass-through meshes.
 */
export function sanitizeSceneGeometry(
  scene: THREE.Object3D,
  options: GeometrySanitizeOptions = {},
): GeometrySanitizeReport {
  const excludeRoots = options.excludeRoots ?? new Set<THREE.Object3D>();
  const excludeSnapCategories = Boolean(options.excludeSnapCategories);
  const minWallThickness = options.minWallThickness ?? 0.22;
  const minFloorThickness = options.minFloorThickness ?? 0.1;

  const targetNames: string[] = [];
  const targetObjects = new Set<THREE.Object3D>();
  if (options.reportedTargets) {
    for (const target of options.reportedTargets) {
      if (typeof target === 'string') {
        const trimmed = target.trim().toLowerCase();
        if (trimmed) targetNames.push(trimmed);
      } else if (target) {
        targetObjects.add(target);
      }
    }
  }

  scene.updateMatrixWorld(true);

  const seenGeos = new Set<THREE.BufferGeometry>();
  const sanitizedBarrierBoxes: SanitizedBarrierBox[] = [];
  let scannedMeshes = 0;
  let repairedGeometries = 0;
  let strippedDegenerateTris = 0;
  let recomputedNormals = 0;
  let addedUv1Count = 0;

  scene.traverse((obj) => {
    if (!obj.visible) return;
    if (obj.layers.mask !== 1) return;
    if ((obj as THREE.Points).isPoints || (obj as THREE.Line).isLine || (obj as THREE.Sprite).isSprite) {
      return;
    }
    if (isObjectExcluded(obj, excludeRoots, excludeSnapCategories)) return;

    const mesh = obj as THREE.Mesh;
    const isInst = Boolean((obj as THREE.InstancedMesh).isInstancedMesh);
    if (!mesh.isMesh && !isInst) return;
    if (!mesh.geometry) return;

    const isReported = matchesReportedTarget(mesh, targetNames, targetObjects);
    if (!isReported && !isMaterialCollidable(mesh.material)) return;

    scannedMeshes++;

    if (!seenGeos.has(mesh.geometry)) {
      seenGeos.add(mesh.geometry);
      const res = sanitizeBufferGeometry(mesh.geometry);
      if (res.repaired) repairedGeometries++;
      strippedDegenerateTris += res.strippedDegenerate;
      if (res.recomputedNormals) recomputedNormals++;
      if (res.addedUv1) addedUv1Count++;
    }

    if (isInst) return;

    const geo = mesh.geometry;
    if (!geo.boundingBox) geo.computeBoundingBox();
    if (!geo.boundingBox || geo.boundingBox.isEmpty()) return;

    _sanitizeLocalBox.copy(geo.boundingBox);
    _sanitizeWorldBox.copy(_sanitizeLocalBox).applyMatrix4(mesh.matrixWorld);

    const minX = _sanitizeWorldBox.min.x;
    const minY = _sanitizeWorldBox.min.y;
    const minZ = _sanitizeWorldBox.min.z;
    const maxX = _sanitizeWorldBox.max.x;
    const maxY = _sanitizeWorldBox.max.y;
    const maxZ = _sanitizeWorldBox.max.z;

    const dx = maxX - minX;
    const dy = maxY - minY;
    const dz = maxZ - minZ;

    // Detect single-sided planes, razor-thin vertical walls/balustrades, negative-scale inverted shells,
    // paper-thin floor slabs, or explicitly reported clipping targets
    const minHoriz = Math.min(dx, dz);
    const maxHoriz = Math.max(dx, dz);
    const isThinWall = dy >= 0.35 && minHoriz < minWallThickness && maxHoriz >= 0.28;
    const isThinFloor = dy < minFloorThickness && dx >= 0.5 && dz >= 0.5;
    const isNegativeDet = mesh.matrixWorld.determinant() < 0 && dy >= 0.35;
    const isSingleSidedPlane = geo instanceof THREE.PlaneGeometry && dy >= 0.35;

    if (isReported || isThinWall || isThinFloor || isNegativeDet || isSingleSidedPlane) {
      let bMinX = minX;
      let bMaxX = maxX;
      let bMinZ = minZ;
      let bMaxZ = maxZ;
      let bMinY = minY;
      const bMaxY = maxY;

      if (isThinFloor && !isThinWall && !(isReported && dy >= 0.35)) {
        bMinY = Math.min(minY, maxY - minFloorThickness);
        sanitizedBarrierBoxes.push({
          minX: bMinX,
          minY: bMinY,
          minZ: bMinZ,
          maxX: bMaxX,
          maxY: bMaxY,
          maxZ: bMaxZ,
          isFloor: true,
          name: mesh.name || undefined,
        });
      } else {
        if (dx < minWallThickness) {
          const padX = (minWallThickness - dx) * 0.5;
          bMinX -= padX;
          bMaxX += padX;
        }
        if (dz < minWallThickness) {
          const padZ = (minWallThickness - dz) * 0.5;
          bMinZ -= padZ;
          bMaxZ += padZ;
        }
        if (dy < minFloorThickness) {
          bMinY = Math.min(minY, maxY - minFloorThickness);
        }
        sanitizedBarrierBoxes.push({
          minX: bMinX,
          minY: bMinY,
          minZ: bMinZ,
          maxX: bMaxX,
          maxY: bMaxY,
          maxZ: bMaxZ,
          isFloor: false,
          name: mesh.name || undefined,
        });
      }

      mesh.userData.sanitizedBarrier = true;
    }
  });

  return {
    scannedMeshes,
    repairedGeometries,
    strippedDegenerateTris,
    recomputedNormals,
    addedUv1Count,
    sanitizedBarriers: sanitizedBarrierBoxes.length,
    sanitizedBarrierBoxes,
  };
}

/**
 * Triangle-level + per-instance Static Bounding Volume Hierarchy (BVH) physics
 * and spatial-hashed Floor Navigation Mesh for WorldEngine.
 */
export class StaticPhysicsWorld {
  private floorTris = createTriList(16384);
  private wallTris = createTriList(16384);
  private floorBvh: { nodes: BvhNode[]; indices: Int32Array } = {
    nodes: [],
    indices: new Int32Array(0),
  };
  private wallBvh: { nodes: BvhNode[]; indices: Int32Array } = {
    nodes: [],
    indices: new Int32Array(0),
  };

  private instancedColliders: InstancedCollider[] = [];
  private instBvh: { nodes: BvhNode[]; indices: Int32Array } = {
    nodes: [],
    indices: new Int32Array(0),
  };

  private navVertices: NavMeshVertex[] = [];
  private navGrid = new Map<string, number[]>();
  private sanitizedBarriers: SanitizedBarrierBox[] = [];

  public setSanitizedBarriers(barriers: SanitizedBarrierBox[]): void {
    this.sanitizedBarriers = barriers.slice();
  }

  private pushOutwardBoxFace(
    list: TriList,
    ax: number,
    ay: number,
    az: number,
    bx: number,
    by: number,
    bz: number,
    cx: number,
    cy: number,
    cz: number,
    dx: number,
    dy: number,
    dz: number,
    ny: number,
  ): void {
    pushTri(list, ax, ay, az, bx, by, bz, cx, cy, cz, ny);
    pushTri(list, ax, ay, az, cx, cy, cz, dx, dy, dz, ny);
  }

  private injectSanitizedBarriers(): void {
    for (let i = 0; i < this.sanitizedBarriers.length; i++) {
      const b = this.sanitizedBarriers[i];
      if (b.maxX <= b.minX || b.maxY <= b.minY || b.maxZ <= b.minZ) continue;

      if (b.isFloor || b.maxY - b.minY <= 0.35) {
        // Walkable top face (+Y) + nav mesh vertices
        this.pushOutwardBoxFace(
          this.floorTris,
          b.minX, b.maxY, b.maxZ,
          b.maxX, b.maxY, b.maxZ,
          b.maxX, b.maxY, b.minZ,
          b.minX, b.maxY, b.minZ,
          1,
        );
        this.addNavMeshTriangleVertices(
          b.minX, b.maxY, b.maxZ,
          b.maxX, b.maxY, b.maxZ,
          b.maxX, b.maxY, b.minZ,
          0, 1, 0,
        );
        this.addNavMeshTriangleVertices(
          b.minX, b.maxY, b.maxZ,
          b.maxX, b.maxY, b.minZ,
          b.minX, b.maxY, b.minZ,
          0, 1, 0,
        );
      }

      // 4 watertight vertical side walls (+Z, -Z, +X, -X)
      this.pushOutwardBoxFace(
        this.wallTris,
        b.minX, b.minY, b.maxZ,
        b.maxX, b.minY, b.maxZ,
        b.maxX, b.maxY, b.maxZ,
        b.minX, b.maxY, b.maxZ,
        0,
      );
      this.pushOutwardBoxFace(
        this.wallTris,
        b.maxX, b.minY, b.minZ,
        b.minX, b.minY, b.minZ,
        b.minX, b.maxY, b.minZ,
        b.maxX, b.maxY, b.minZ,
        0,
      );
      this.pushOutwardBoxFace(
        this.wallTris,
        b.maxX, b.minY, b.maxZ,
        b.maxX, b.minY, b.minZ,
        b.maxX, b.maxY, b.minZ,
        b.maxX, b.maxY, b.maxZ,
        0,
      );
      this.pushOutwardBoxFace(
        this.wallTris,
        b.minX, b.minY, b.minZ,
        b.minX, b.minY, b.maxZ,
        b.minX, b.maxY, b.maxZ,
        b.minX, b.maxY, b.minZ,
        0,
      );
    }
  }

  public buildFromScene(
    scene: THREE.Object3D,
    excludeRoots: Set<THREE.Object3D> = new Set(),
    options: { excludeSnapCategories?: boolean } = {},
  ): void {
    this.floorTris = createTriList(16384);
    this.wallTris = createTriList(16384);
    this.instancedColliders = [];
    this.navVertices = [];
    this.navGrid.clear();

    scene.updateMatrixWorld(true);
    this.extractSubtree(scene, excludeRoots, Boolean(options.excludeSnapCategories));
    this.injectSanitizedBarriers();
    this.rebuildStructures();
  }

  public appendStaticObjects(
    roots: THREE.Object3D[],
    excludeRoots: Set<THREE.Object3D> = new Set(),
  ): void {
    for (const root of roots) {
      root.updateMatrixWorld(true);
      this.extractSubtree(root, excludeRoots, false);
    }
    this.rebuildStructures();
  }

  private extractSubtree(
    root: THREE.Object3D,
    excludeRoots: Set<THREE.Object3D>,
    excludeSnapCategories: boolean,
  ): void {
    root.traverse((obj) => {
      if (!obj.visible) return;
      if (obj.layers.mask !== 1) return; // skip raycast hitMeshes (layers 1, 2)
      if ((obj as THREE.Points).isPoints || (obj as THREE.Line).isLine || (obj as THREE.Sprite).isSprite) {
        return;
      }
      if (isObjectExcluded(obj, excludeRoots, excludeSnapCategories)) return;

      if ((obj as THREE.InstancedMesh).isInstancedMesh) {
        this.extractInstancedMesh(obj as THREE.InstancedMesh);
        return;
      }

      if ((obj as THREE.Mesh).isMesh) {
        this.extractMesh(obj as THREE.Mesh);
      }
    });
  }

  private extractMesh(mesh: THREE.Mesh): void {
    if (!mesh.geometry || !isMaterialCollidable(mesh.material)) return;
    const isTerrainGrid = Boolean(mesh.userData?.terrainGrid);
    const skipNavMesh = Boolean(mesh.userData?.skipNavMesh);
    const skipNavSubdiv = isTerrainGrid || Boolean(mesh.userData?.skipNavSubdiv);
    this.extractGeometryTriangles(
      mesh.geometry,
      mesh.matrixWorld,
      isTerrainGrid,
      skipNavMesh,
      skipNavSubdiv,
    );
  }

  private extractGeometryTriangles(
    geometry: THREE.BufferGeometry,
    matWorld: THREE.Matrix4,
    isTerrainGrid: boolean,
    skipNavMesh: boolean,
    skipNavSubdiv: boolean,
  ): void {
    const pos = geometry.getAttribute('position');
    if (!pos || pos.count < 3) return;

    const detSign = matWorld.determinant() < 0 ? -1 : 1;
    const index = geometry.getIndex();
    const triCount = index ? Math.floor(index.count / 3) : Math.floor(pos.count / 3);
    if (triCount <= 0) return;

    const e = matWorld.elements;
    const m00 = e[0], m01 = e[4], m02 = e[8], m03 = e[12];
    const m10 = e[1], m11 = e[5], m12 = e[9], m13 = e[13];
    const m20 = e[2], m21 = e[6], m22 = e[10], m23 = e[14];

    for (let t = 0; t < triCount; t++) {
      const i0 = index ? index.getX(t * 3) : t * 3;
      const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
      const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;

      const lx0 = pos.getX(i0), ly0 = pos.getY(i0), lz0 = pos.getZ(i0);
      const lx1 = pos.getX(i1), ly1 = pos.getY(i1), lz1 = pos.getZ(i1);
      const lx2 = pos.getX(i2), ly2 = pos.getY(i2), lz2 = pos.getZ(i2);

      const ax = m00 * lx0 + m01 * ly0 + m02 * lz0 + m03;
      const ay = m10 * lx0 + m11 * ly0 + m12 * lz0 + m13;
      const az = m20 * lx0 + m21 * ly0 + m22 * lz0 + m23;

      const bx = m00 * lx1 + m01 * ly1 + m02 * lz1 + m03;
      const by = m10 * lx1 + m11 * ly1 + m12 * lz1 + m13;
      const bz = m20 * lx1 + m21 * ly1 + m22 * lz1 + m23;

      const cx = m00 * lx2 + m01 * ly2 + m02 * lz2 + m03;
      const cy = m10 * lx2 + m11 * ly2 + m12 * lz2 + m13;
      const cz = m20 * lx2 + m21 * ly2 + m22 * lz2 + m23;

      const abx = bx - ax, aby = by - ay, abz = bz - az;
      const acx = cx - ax, acy = cy - ay, acz = cz - az;
      const nxRaw = (aby * acz - abz * acy) * detSign;
      const nyRaw = (abz * acx - abx * acz) * detSign;
      const nzRaw = (abx * acy - aby * acx) * detSign;
      const lenSq = nxRaw * nxRaw + nyRaw * nyRaw + nzRaw * nzRaw;
      if (lenSq < 1e-10) continue;

      const invLen = 1 / Math.sqrt(lenSq);
      const nx = nxRaw * invLen;
      const ny = nyRaw * invLen;
      const nz = nzRaw * invLen;

      if (ny >= 0.48) {
        pushTri(this.floorTris, ax, ay, az, bx, by, bz, cx, cy, cz, ny);
        if (!isTerrainGrid && !skipNavMesh) {
          this.addNavMeshTriangleVertices(ax, ay, az, bx, by, bz, cx, cy, cz, nx, ny, nz, skipNavSubdiv);
        }
      }
      if (Math.abs(ny) < 0.72) {
        pushTri(this.wallTris, ax, ay, az, bx, by, bz, cx, cy, cz, ny);
      }
    }

    if (isTerrainGrid && !skipNavMesh) {
      const normAttr = geometry.getAttribute('normal');
      for (let vi = 0; vi < pos.count; vi++) {
        const lx = pos.getX(vi);
        const ly = pos.getY(vi);
        const lz = pos.getZ(vi);
        const wx = m00 * lx + m01 * ly + m02 * lz + m03;
        const wy = m10 * lx + m11 * ly + m12 * lz + m13;
        const wz = m20 * lx + m21 * ly + m22 * lz + m23;

        let wnx = 0;
        let wny = 1;
        let wnz = 0;
        if (normAttr) {
          const lnx = normAttr.getX(vi);
          const lny = normAttr.getY(vi);
          const lnz = normAttr.getZ(vi);
          const rx = m00 * lnx + m01 * lny + m02 * lnz;
          const ry = m10 * lnx + m11 * lny + m12 * lnz;
          const rz = m20 * lnx + m21 * lny + m22 * lnz;
          const nLen = Math.hypot(rx, ry, rz) || 1;
          wnx = rx / nLen;
          wny = ry / nLen;
          wnz = rz / nLen;
        }
        if (wny >= 0.48) {
          this.pushNavVertex(wx, wy, wz, wnx, wny, wnz);
        }
      }
    }
  }

  private extractInstancedMesh(inst: THREE.InstancedMesh): void {
    if (!inst.geometry || !isMaterialCollidable(inst.material)) return;
    if (!inst.geometry.boundingBox) inst.geometry.computeBoundingBox();
    const localBb = inst.geometry.boundingBox;
    if (!localBb) return;

    const skipNavMesh = Boolean(inst.userData?.skipNavMesh);
    const isBoxGeo = inst.geometry.type === 'BoxGeometry';
    const baseRadiusXZ = computeLowTrunkRadiusXZ(inst.geometry, 2.2);
    const localCenterX = (localBb.min.x + localBb.max.x) * 0.5;
    const localCenterZ = (localBb.min.z + localBb.max.z) * 0.5;

    for (let i = 0; i < inst.count; i++) {
      inst.getMatrixAt(i, _instMat);
      _worldInstMat.multiplyMatrices(inst.matrixWorld, _instMat);
      _instBox.copy(localBb).applyMatrix4(_worldInstMat);

      const me = _worldInstMat.elements;
      const sx = Math.hypot(me[0], me[1], me[2]);
      const sz = Math.hypot(me[8], me[9], me[10]);
      const minScaleXZ = Math.max(1e-4, Math.min(sx, sz));
      const maxScaleXZ = Math.max(sx, sz);

      if (isBoxGeo || maxScaleXZ / minScaleXZ > 1.8) {
        this.extractGeometryTriangles(
          inst.geometry,
          _worldInstMat,
          false,
          skipNavMesh,
          true,
        );
        continue;
      }

      _localPos.set(localCenterX, localBb.min.y, localCenterZ);
      _worldPos.copy(_localPos).applyMatrix4(_worldInstMat);

      const radius = Math.max(0.12, baseRadiusXZ * maxScaleXZ);
      this.instancedColliders.push({
        minX: _instBox.min.x,
        minY: _instBox.min.y,
        minZ: _instBox.min.z,
        maxX: _instBox.max.x,
        maxY: _instBox.max.y,
        maxZ: _instBox.max.z,
        cx: _worldPos.x,
        cz: _worldPos.z,
        radius,
      });
    }
  }

  private pushNavVertex(x: number, y: number, z: number, nx: number, ny: number, nz: number): void {
    const idx = this.navVertices.length;
    this.navVertices.push({ x, y, z, nx, ny, nz });
    const gx = Math.floor(x / NAV_CELL_SIZE);
    const gz = Math.floor(z / NAV_CELL_SIZE);
    const key = `${gx},${gz}`;
    let bucket = this.navGrid.get(key);
    if (!bucket) {
      bucket = [];
      this.navGrid.set(key, bucket);
    }
    bucket.push(idx);
  }

  private addNavMeshTriangleVertices(
    ax: number,
    ay: number,
    az: number,
    bx: number,
    by: number,
    bz: number,
    cx: number,
    cy: number,
    cz: number,
    nx: number,
    ny: number,
    nz: number,
    skipSubdiv = false,
  ): void {
    this.pushNavVertex(ax, ay, az, nx, ny, nz);
    this.pushNavVertex(bx, by, bz, nx, ny, nz);
    this.pushNavVertex(cx, cy, cz, nx, ny, nz);

    if (skipSubdiv) return;

    const ab = Math.hypot(bx - ax, bz - az);
    const bc = Math.hypot(cx - bx, cz - bz);
    const ca = Math.hypot(ax - cx, az - cz);
    const maxEdge = Math.max(ab, bc, ca);

    // Subdivide large plaza/floor boxes so every surface has nav-mesh vertices within ~1.5m
    if (maxEdge > 2.2) {
      const divs = Math.min(8, Math.ceil(maxEdge / 1.8));
      for (let i = 0; i <= divs; i++) {
        for (let j = 0; j <= divs - i; j++) {
          if (
            (i === 0 && j === 0) ||
            (i === divs && j === 0) ||
            (i === 0 && j === divs)
          ) {
            continue;
          }
          const u = i / divs;
          const v = j / divs;
          const w = 1 - u - v;
          this.pushNavVertex(
            w * ax + u * bx + v * cx,
            w * ay + u * by + v * cy,
            w * az + u * bz + v * cz,
            nx,
            ny,
            nz,
          );
        }
      }
    }
  }

  private rebuildStructures(): void {
    this.floorBvh = buildFlatBvh(
      this.floorTris.count,
      this.floorTris.minX,
      this.floorTris.minY,
      this.floorTris.minZ,
      this.floorTris.maxX,
      this.floorTris.maxY,
      this.floorTris.maxZ,
      this.floorTris.centX,
      this.floorTris.centY,
      this.floorTris.centZ,
    );

    this.wallBvh = buildFlatBvh(
      this.wallTris.count,
      this.wallTris.minX,
      this.wallTris.minY,
      this.wallTris.minZ,
      this.wallTris.maxX,
      this.wallTris.maxY,
      this.wallTris.maxZ,
      this.wallTris.centX,
      this.wallTris.centY,
      this.wallTris.centZ,
    );

    const icCount = this.instancedColliders.length;
    if (icCount > 0) {
      const minX = new Float32Array(icCount);
      const minY = new Float32Array(icCount);
      const minZ = new Float32Array(icCount);
      const maxX = new Float32Array(icCount);
      const maxY = new Float32Array(icCount);
      const maxZ = new Float32Array(icCount);
      const centX = new Float32Array(icCount);
      const centY = new Float32Array(icCount);
      const centZ = new Float32Array(icCount);
      for (let i = 0; i < icCount; i++) {
        const c = this.instancedColliders[i];
        minX[i] = c.cx - c.radius;
        minY[i] = c.minY;
        minZ[i] = c.cz - c.radius;
        maxX[i] = c.cx + c.radius;
        maxY[i] = c.maxY;
        maxZ[i] = c.cz + c.radius;
        centX[i] = c.cx;
        centY[i] = (c.minY + c.maxY) * 0.5;
        centZ[i] = c.cz;
      }
      this.instBvh = buildFlatBvh(icCount, minX, minY, minZ, maxX, maxY, maxZ, centX, centY, centZ);
    } else {
      this.instBvh = { nodes: [], indices: new Int32Array(0) };
    }
  }

  public getStats(): PhysicsWorldStats {
    return {
      floorTriangles: this.floorTris.count,
      wallTriangles: this.wallTris.count,
      instancedColliders: this.instancedColliders.length,
      navVertices: this.navVertices.length,
      floorBvhNodes: this.floorBvh.nodes.length,
      wallBvhNodes: this.wallBvh.nodes.length,
    };
  }

  /**
   * Returns highest walkable floor triangle Y at (x, z) <= maxCeilingY.
   */
  public sampleFloorHeight(x: number, z: number, maxCeilingY = Infinity): number | null {
    const nodes = this.floorBvh.nodes;
    if (nodes.length === 0) return null;

    const indices = this.floorBvh.indices;
    const tris = this.floorTris;
    let bestY = -Infinity;
    let found = false;

    let sp = 0;
    _travStack[sp++] = 0;

    while (sp > 0) {
      const node = nodes[_travStack[--sp]];
      if (
        x < node.minX - 0.02 ||
        x > node.maxX + 0.02 ||
        z < node.minZ - 0.02 ||
        z > node.maxZ + 0.02 ||
        node.minY > maxCeilingY
      ) {
        continue;
      }

      if (node.rightOrCount <= 0) {
        const count = -node.rightOrCount;
        const start = node.leftOrStart;
        for (let k = 0; k < count; k++) {
          const idx = indices[start + k];
          if (
            x < tris.minX[idx] - 0.01 ||
            x > tris.maxX[idx] + 0.01 ||
            z < tris.minZ[idx] - 0.01 ||
            z > tris.maxZ[idx] + 0.01 ||
            tris.minY[idx] > maxCeilingY
          ) {
            continue;
          }
          const hitY = sampleTriangleYAtXZ(
            x,
            z,
            tris.ax[idx],
            tris.ay[idx],
            tris.az[idx],
            tris.bx[idx],
            tris.by[idx],
            tris.bz[idx],
            tris.cx[idx],
            tris.cy[idx],
            tris.cz[idx],
          );
          if (hitY !== null && hitY <= maxCeilingY && hitY > bestY) {
            bestY = hitY;
            found = true;
          }
        }
      } else {
        if (sp + 2 <= _travStack.length) {
          _travStack[sp++] = node.rightOrCount;
          _travStack[sp++] = node.leftOrStart;
        }
      }
    }

    return found ? bestY : null;
  }

  /**
   * Samples center + 4 rim offsets around (x, z) so wide props (pots/crates) never sink on sloped edges or curbs.
   */
  public sampleFootprintSupportY(
    x: number,
    z: number,
    radius: number,
    maxCeilingY = Infinity,
  ): number | null {
    const r = radius * 0.82;
    let bestY = -Infinity;
    let found = false;

    const cY = this.sampleFloorHeight(x, z, maxCeilingY);
    if (cY !== null) {
      bestY = cY;
      found = true;
    }

    const r1 = this.sampleFloorHeight(x + r, z, maxCeilingY);
    if (r1 !== null && r1 > bestY) {
      bestY = r1;
      found = true;
    }
    const r2 = this.sampleFloorHeight(x - r, z, maxCeilingY);
    if (r2 !== null && r2 > bestY) {
      bestY = r2;
      found = true;
    }
    const r3 = this.sampleFloorHeight(x, z + r, maxCeilingY);
    if (r3 !== null && r3 > bestY) {
      bestY = r3;
      found = true;
    }
    const r4 = this.sampleFloorHeight(x, z - r, maxCeilingY);
    if (r4 !== null && r4 > bestY) {
      bestY = r4;
      found = true;
    }

    return found ? bestY : null;
  }

  /**
   * Spatial-hash lookup of the nearest floor navigation mesh vertex to (x, y, z).
   */
  public findNearestNavVertex(
    x: number,
    y: number,
    z: number,
    maxSearchRadius = 4.5,
  ): (NavMeshVertex & { distance: number }) | null {
    if (this.navVertices.length === 0) return null;

    const cellRad = Math.max(1, Math.ceil(maxSearchRadius / NAV_CELL_SIZE));
    const cx = Math.floor(x / NAV_CELL_SIZE);
    const cz = Math.floor(z / NAV_CELL_SIZE);
    const maxR2 = maxSearchRadius * maxSearchRadius;

    let bestIdx = -1;
    let bestScore = Infinity;
    let bestDist = Infinity;

    for (let gx = cx - cellRad; gx <= cx + cellRad; gx++) {
      for (let gz = cz - cellRad; gz <= cz + cellRad; gz++) {
        const bucket = this.navGrid.get(`${gx},${gz}`);
        if (!bucket) continue;
        for (let i = 0; i < bucket.length; i++) {
          const vIdx = bucket[i];
          const v = this.navVertices[vIdx];
          const dx = v.x - x;
          const dy = v.y - y;
          const dz = v.z - z;
          const xz2 = dx * dx + dz * dz;
          if (xz2 > maxR2) continue;
          // Prioritize vertices on the same walkable vertical tier while penalizing distant elevations
          const tierPenalty = Math.abs(dy) > 1.25 ? dy * dy * 4.0 : dy * dy * 0.65;
          const score = xz2 + tierPenalty;
          if (score < bestScore) {
            bestScore = score;
            bestIdx = vIdx;
            bestDist = Math.sqrt(xz2 + dy * dy);
          }
        }
      }
    }

    if (bestIdx < 0) return null;
    const best = this.navVertices[bestIdx];
    return {
      x: best.x,
      y: best.y,
      z: best.z,
      nx: best.nx,
      ny: best.ny,
      nz: best.nz,
      distance: bestDist,
    };
  }

  /**
   * Resolves horizontal cylinder movement against StaticWallBVH + InstancedColliders.
   * Substeps fast movement and iterates 3 relaxation passes to prevent wall tunneling.
   */
  public resolveHorizontalCollision(
    prevX: number,
    prevZ: number,
    nextX: number,
    nextZ: number,
    baseY: number,
    height: number,
    radius: number,
    stepUp = 0.24,
  ): HorizontalCollisionResult {
    const dxTotal = nextX - prevX;
    const dzTotal = nextZ - prevZ;
    const totalDist = Math.hypot(dxTotal, dzTotal);
    const maxSubstep = Math.max(0.12, radius * 0.5);
    const substeps = Math.max(1, Math.min(24, Math.ceil(totalDist / maxSubstep)));

    let curX = prevX;
    let curZ = prevZ;
    let collided = false;
    let hitNx = 0;
    let hitNz = 0;

    const clipMinY = baseY + stepUp;
    const clipMaxY = baseY + Math.max(stepUp + 0.12, height - 0.06);

    for (let s = 0; s < substeps; s++) {
      curX += dxTotal / substeps;
      curZ += dzTotal / substeps;

      for (let pass = 0; pass < 3; pass++) {
        let pushedInPass = false;

        // 1. Static wall triangle BVH push-out
        if (this.wallBvh.nodes.length > 0) {
          const res = this.resolveAgainstWallBvh(curX, curZ, clipMinY, clipMaxY, radius);
          if (res.pushed) {
            curX = res.x;
            curZ = res.z;
            collided = true;
            hitNx = res.nx;
            hitNz = res.nz;
            pushedInPass = true;
          }
        }

        // 2. Solid InstancedMesh colliders (tree trunks, boulders, courtyard columns)
        if (this.instBvh.nodes.length > 0) {
          const iRes = this.resolveAgainstInstancedBvh(curX, curZ, clipMinY, clipMaxY, radius);
          if (iRes.pushed) {
            curX = iRes.x;
            curZ = iRes.z;
            collided = true;
            hitNx = iRes.nx;
            hitNz = iRes.nz;
            pushedInPass = true;
          }
        }

        if (!pushedInPass) break;
      }
    }

    return {
      x: curX,
      z: curZ,
      collided,
      hitNormalX: hitNx,
      hitNormalZ: hitNz,
    };
  }

  /**
   * Computes flush horizontal wall clearance for static/interactive asset placement.
   */
  public findNearestWallClearance(
    x: number,
    z: number,
    baseY: number,
    height: number,
    radius: number,
  ): WallClearanceResult {
    const res = this.resolveHorizontalCollision(
      x,
      z,
      x,
      z,
      baseY,
      height,
      radius,
      0.16,
    );
    return {
      x: res.x,
      z: res.z,
      pushed: res.collided,
      normalX: res.hitNormalX,
      normalZ: res.hitNormalZ,
    };
  }

  private resolveAgainstWallBvh(
    cx: number,
    cz: number,
    clipMinY: number,
    clipMaxY: number,
    radius: number,
  ): { x: number; z: number; pushed: boolean; nx: number; nz: number } {
    const nodes = this.wallBvh.nodes;
    const indices = this.wallBvh.indices;
    const tris = this.wallTris;

    let curX = cx;
    let curZ = cz;
    let pushed = false;
    let outNx = 0;
    let outNz = 0;
    const rSq = radius * radius;

    let sp = 0;
    _travStack[sp++] = 0;

    while (sp > 0) {
      const node = nodes[_travStack[--sp]];
      if (
        curX + radius < node.minX ||
        curX - radius > node.maxX ||
        curZ + radius < node.minZ ||
        curZ - radius > node.maxZ ||
        node.maxY <= clipMinY ||
        node.minY >= clipMaxY
      ) {
        continue;
      }

      if (node.rightOrCount <= 0) {
        const count = -node.rightOrCount;
        const start = node.leftOrStart;
        for (let k = 0; k < count; k++) {
          const idx = indices[start + k];
          if (
            curX + radius < tris.minX[idx] ||
            curX - radius > tris.maxX[idx] ||
            curZ + radius < tris.minZ[idx] ||
            curZ - radius > tris.maxZ[idx] ||
            tris.maxY[idx] <= clipMinY ||
            tris.minY[idx] >= clipMaxY
          ) {
            continue;
          }

          let polyCount = 3;
          _clipInX[0] = tris.ax[idx];
          _clipInY[0] = tris.ay[idx];
          _clipInZ[0] = tris.az[idx];
          _clipInX[1] = tris.bx[idx];
          _clipInY[1] = tris.by[idx];
          _clipInZ[1] = tris.bz[idx];
          _clipInX[2] = tris.cx[idx];
          _clipInY[2] = tris.cy[idx];
          _clipInZ[2] = tris.cz[idx];

          if (tris.minY[idx] < clipMinY || tris.maxY[idx] > clipMaxY) {
            polyCount = clipYPlane(
              3,
              _clipInX,
              _clipInY,
              _clipInZ,
              _clipTmpX,
              _clipTmpY,
              _clipTmpZ,
              clipMinY,
              true,
            );
            if (polyCount === 0) continue;
            polyCount = clipYPlane(
              polyCount,
              _clipTmpX,
              _clipTmpY,
              _clipTmpZ,
              _clipOutX,
              _clipOutY,
              _clipOutZ,
              clipMaxY,
              false,
            );
            if (polyCount < 2) continue;
          } else {
            for (let p = 0; p < 3; p++) {
              _clipOutX[p] = _clipInX[p];
              _clipOutZ[p] = _clipInZ[p];
            }
          }

          let bestDistSq = Infinity;
          let closestX = curX;
          let closestZ = curZ;

          for (let p = 0; p < polyCount; p++) {
            const q = (p + 1) % polyCount;
            const x0 = _clipOutX[p];
            const z0 = _clipOutZ[p];
            const x1 = _clipOutX[q];
            const z1 = _clipOutZ[q];
            const ex = x1 - x0;
            const ez = z1 - z0;
            const lenSq = ex * ex + ez * ez;
            let t = 0;
            if (lenSq > 1e-10) {
              t = ((curX - x0) * ex + (curZ - z0) * ez) / lenSq;
              if (t < 0) t = 0;
              else if (t > 1) t = 1;
            }
            const px = x0 + ex * t;
            const pz = z0 + ez * t;
            const dx = curX - px;
            const dz = curZ - pz;
            const dSq = dx * dx + dz * dz;
            if (dSq < bestDistSq) {
              bestDistSq = dSq;
              closestX = px;
              closestZ = pz;
            }
          }

          const inside =
            polyCount >= 3 && pointInConvexPolyXZ(curX, curZ, _clipOutX, _clipOutZ, polyCount);

          if (inside || bestDistSq < rSq) {
            const dist = Math.sqrt(bestDistSq);
            let nx: number;
            let nz: number;
            let pen: number;

            if (inside) {
              nx = dist > 1e-6 ? (closestX - curX) / dist : 0;
              nz = dist > 1e-6 ? (closestZ - curZ) / dist : 1;
              pen = radius + dist;
            } else if (dist > 1e-6) {
              nx = (curX - closestX) / dist;
              nz = (curZ - closestZ) / dist;
              pen = radius - dist;
            } else {
              // Exactly on edge: push using horizontal component of triangle normal
              _vA.set(tris.bx[idx] - tris.ax[idx], tris.by[idx] - tris.ay[idx], tris.bz[idx] - tris.az[idx]);
              _vB.set(tris.cx[idx] - tris.ax[idx], tris.cy[idx] - tris.ay[idx], tris.cz[idx] - tris.az[idx]);
              _vC.crossVectors(_vA, _vB);
              const nLen = Math.hypot(_vC.x, _vC.z);
              nx = nLen > 1e-6 ? _vC.x / nLen : 0;
              nz = nLen > 1e-6 ? _vC.z / nLen : 1;
              pen = radius;
            }

            if (pen > 0) {
              curX += nx * pen;
              curZ += nz * pen;
              pushed = true;
              outNx = nx;
              outNz = nz;
            }
          }
        }
      } else {
        if (sp + 2 <= _travStack.length) {
          _travStack[sp++] = node.rightOrCount;
          _travStack[sp++] = node.leftOrStart;
        }
      }
    }

    return { x: curX, z: curZ, pushed, nx: outNx, nz: outNz };
  }

  private resolveAgainstInstancedBvh(
    cx: number,
    cz: number,
    clipMinY: number,
    clipMaxY: number,
    radius: number,
  ): { x: number; z: number; pushed: boolean; nx: number; nz: number } {
    const nodes = this.instBvh.nodes;
    const indices = this.instBvh.indices;

    let curX = cx;
    let curZ = cz;
    let pushed = false;
    let outNx = 0;
    let outNz = 0;

    let sp = 0;
    _travStack[sp++] = 0;

    while (sp > 0) {
      const node = nodes[_travStack[--sp]];
      if (
        curX + radius < node.minX ||
        curX - radius > node.maxX ||
        curZ + radius < node.minZ ||
        curZ - radius > node.maxZ ||
        node.maxY <= clipMinY ||
        node.minY >= clipMaxY
      ) {
        continue;
      }

      if (node.rightOrCount <= 0) {
        const count = -node.rightOrCount;
        const start = node.leftOrStart;
        for (let k = 0; k < count; k++) {
          const c = this.instancedColliders[indices[start + k]];
          if (c.maxY <= clipMinY || c.minY >= clipMaxY) continue;
          const dx = curX - c.cx;
          const dz = curZ - c.cz;
          const minSep = radius + c.radius;
          const distSq = dx * dx + dz * dz;
          if (distSq < minSep * minSep) {
            const dist = Math.sqrt(distSq);
            const nx = dist > 1e-6 ? dx / dist : 1;
            const nz = dist > 1e-6 ? dz / dist : 0;
            const pen = minSep - dist;
            curX += nx * pen;
            curZ += nz * pen;
            pushed = true;
            outNx = nx;
            outNz = nz;
          }
        }
      } else {
        if (sp + 2 <= _travStack.length) {
          _travStack[sp++] = node.rightOrCount;
          _travStack[sp++] = node.leftOrStart;
        }
      }
    }

    return { x: curX, z: curZ, pushed, nx: outNx, nz: outNz };
  }
}

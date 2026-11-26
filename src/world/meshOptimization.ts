import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const _globalTextureCache = new Map<string, THREE.Texture>();
const _scopedMaterialCache = new WeakMap<object, Map<string, THREE.Material>>();
const _globalMaterialCache = new Map<string, THREE.Material>();

const _invRootMat = new THREE.Matrix4();
const _localToRoot = new THREE.Matrix4();

export function getCachedTexture<T extends THREE.Texture>(key: string, factory: () => T): T {
  const existing = _globalTextureCache.get(key);
  if (existing) return existing as T;
  const created = factory();
  created.userData = { ...created.userData, __cachedSingleton: true };
  _globalTextureCache.set(key, created);
  return created;
}

export function getCachedMaterial<T extends THREE.Material>(
  scope: object | null | undefined,
  key: string,
  factory: () => T,
): T {
  if (!scope) {
    const existing = _globalMaterialCache.get(key);
    if (existing) return existing as T;
    const created = factory();
    created.userData = { ...created.userData, __cachedSingleton: true };
    _globalMaterialCache.set(key, created);
    return created;
  }

  let map = _scopedMaterialCache.get(scope);
  if (!map) {
    map = new Map<string, THREE.Material>();
    _scopedMaterialCache.set(scope, map);
  }
  const existing = map.get(key);
  if (existing) return existing as T;
  const created = factory();
  map.set(key, created);
  return created;
}

export function isInsideNoMergeSubtree(obj: THREE.Object3D): boolean {
  let cur: THREE.Object3D | null = obj;
  while (cur) {
    const ud = cur.userData;
    if (
      ud &&
      (ud.noMerge ||
        ud.isInteractiveProp ||
        ud.isReflectiveWater ||
        typeof ud.prayerFlagMode === 'string')
    ) {
      return true;
    }
    cur = cur.parent;
  }
  return false;
}

function isInsideOccluderSubtree(
  obj: THREE.Object3D,
  extraOccluders?: Set<THREE.Object3D>,
): boolean {
  let cur: THREE.Object3D | null = obj;
  while (cur) {
    if (cur.userData?.isOccluder || extraOccluders?.has(cur)) return true;
    cur = cur.parent;
  }
  return false;
}

function isInsideNonCollidableSubtree(obj: THREE.Object3D): boolean {
  let cur: THREE.Object3D | null = obj;
  while (cur) {
    if (cur.userData?.nonCollidable) return true;
    cur = cur.parent;
  }
  return false;
}

function isInsideSkipNavMeshSubtree(obj: THREE.Object3D): boolean {
  let cur: THREE.Object3D | null = obj;
  while (cur) {
    if (cur.userData?.skipNavMesh) return true;
    cur = cur.parent;
  }
  return false;
}

function flipNonIndexedWinding(geo: THREE.BufferGeometry): void {
  const attrs = geo.attributes;
  const pos = attrs.position;
  if (!pos) return;
  const vertCount = pos.count;
  for (const attrName of Object.keys(attrs)) {
    const attr = attrs[attrName] as THREE.BufferAttribute;
    const itemSize = attr.itemSize;
    const arr = attr.array as Float32Array;
    if (!arr || typeof arr.length !== 'number') continue;
    for (let i = 0; i + 2 < vertCount; i += 3) {
      const i1 = (i + 1) * itemSize;
      const i2 = (i + 2) * itemSize;
      for (let k = 0; k < itemSize; k++) {
        const tmp = arr[i1 + k];
        arr[i1 + k] = arr[i2 + k];
        arr[i2 + k] = tmp;
      }
    }
    attr.needsUpdate = true;
  }
}

export interface MergeStaticMeshesOptions {
  skipObjects?: Set<THREE.Object3D>;
  occluderSet?: Set<THREE.Object3D>;
  cameraOccludersOut?: THREE.Object3D[];
  minBucketSize?: number;
  preserveCustomShaderMaterials?: boolean;
}

/**
 * Merges static non-interactive meshes sharing the same material and physical/shadow/occluder flags
 * into single BufferGeometry meshes relative to `root` to drastically cut draw calls with zero visual loss.
 */
export function mergeStaticMeshesByMaterial(
  root: THREE.Group,
  options: MergeStaticMeshesOptions = {},
): THREE.Mesh[] {
  root.updateMatrixWorld(true);
  _invRootMat.copy(root.matrixWorld).invert();

  const skipObjects = options.skipObjects;
  const occluderSet = options.occluderSet;
  const minBucketSize = options.minBucketSize ?? 2;
  const preserveCustomShaderMaterials = options.preserveCustomShaderMaterials ?? false;

  interface MergeBucket {
    mat: THREE.Material;
    castShadow: boolean;
    receiveShadow: boolean;
    isOccluder: boolean;
    nonCollidable: boolean;
    skipNavMesh: boolean;
    renderOrder: number;
    meshes: THREE.Mesh[];
  }

  const buckets = new Map<string, MergeBucket>();
  const matIds = new Map<THREE.Material, number>();
  let nextMatId = 1;
  const preservedOccluders: THREE.Object3D[] = [];

  root.traverse((obj) => {
    if (!(obj as THREE.Mesh).isMesh) return;
    if ((obj as THREE.InstancedMesh).isInstancedMesh) return;
    if ((obj as THREE.SkinnedMesh).isSkinnedMesh) return;
    const mesh = obj as THREE.Mesh;
    if (mesh.morphTargetInfluences && mesh.morphTargetInfluences.length > 0) return;

    const occ = isInsideOccluderSubtree(mesh, occluderSet);

    if (
      obj === root ||
      skipObjects?.has(obj) ||
      obj.layers.mask !== 1 ||
      isInsideNoMergeSubtree(obj) ||
      Array.isArray(mesh.material) ||
      !mesh.material ||
      !mesh.geometry
    ) {
      if (occ) preservedOccluders.push(mesh);
      return;
    }

    const mat = mesh.material;
    if ((mat as THREE.ShaderMaterial).isShaderMaterial) {
      if (occ) preservedOccluders.push(mesh);
      return;
    }
    if (preserveCustomShaderMaterials && typeof mat.onBeforeCompile === 'function') {
      const hasCustom =
        mat.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile &&
        Boolean(mat.customProgramCacheKey);
      if (hasCustom) {
        if (occ) preservedOccluders.push(mesh);
        return;
      }
    }
    // Keep additive / depthWrite=false transparent overlays independent so draw sorting stays exact
    if (mat.transparent && !mat.depthWrite) {
      if (occ) preservedOccluders.push(mesh);
      return;
    }

    let mId = matIds.get(mat);
    if (!mId) {
      mId = nextMatId++;
      matIds.set(mat, mId);
    }

    const nonCollidable = isInsideNonCollidableSubtree(mesh);
    const skipNavMesh = isInsideSkipNavMeshSubtree(mesh);
    const key = `${mId}_${mesh.castShadow ? 1 : 0}_${mesh.receiveShadow ? 1 : 0}_${occ ? 1 : 0}_${nonCollidable ? 1 : 0}_${skipNavMesh ? 1 : 0}_${mesh.renderOrder}`;

    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        mat,
        castShadow: mesh.castShadow,
        receiveShadow: mesh.receiveShadow,
        isOccluder: occ,
        nonCollidable,
        skipNavMesh,
        renderOrder: mesh.renderOrder,
        meshes: [],
      };
      buckets.set(key, bucket);
    }
    bucket.meshes.push(mesh);
  });

  const mergedMeshes: THREE.Mesh[] = [];
  const toRemove: THREE.Mesh[] = [];
  const geosToMergeFrom: Set<THREE.BufferGeometry> = new Set();

  for (const bucket of buckets.values()) {
    if (bucket.meshes.length < minBucketSize) {
      if (bucket.isOccluder) {
        for (const m of bucket.meshes) preservedOccluders.push(m);
      }
      continue;
    }

    let hasAnyColor = false;
    for (const m of bucket.meshes) {
      if (m.geometry.getAttribute('color')) {
        hasAnyColor = true;
        break;
      }
    }

    const geos: THREE.BufferGeometry[] = [];
    for (const m of bucket.meshes) {
      const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
      if (!g.getAttribute('normal')) {
        g.computeVertexNormals();
      }
      const posAttr = g.getAttribute('position');
      if (!posAttr || posAttr.count === 0) {
        g.dispose();
        continue;
      }
      if (!g.getAttribute('uv')) {
        g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(posAttr.count * 2), 2));
      }
      if (!g.getAttribute('uv1')) {
        g.setAttribute('uv1', g.getAttribute('uv').clone());
      }
      if (hasAnyColor && !g.getAttribute('color')) {
        const colArr = new Float32Array(posAttr.count * 3);
        colArr.fill(1);
        g.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
      }

      for (const attrName of Object.keys(g.attributes)) {
        if (
          attrName !== 'position' &&
          attrName !== 'normal' &&
          attrName !== 'uv' &&
          attrName !== 'uv1' &&
          !(hasAnyColor && attrName === 'color')
        ) {
          g.deleteAttribute(attrName);
        }
      }

      _localToRoot.copy(_invRootMat).multiply(m.matrixWorld);
      g.applyMatrix4(_localToRoot);
      if (_localToRoot.determinant() < 0) {
        flipNonIndexedWinding(g);
      }
      geos.push(g);
    }

    if (geos.length === 0) continue;
    const merged = mergeGeometries(geos, false);
    for (const g of geos) g.dispose();
    if (!merged) {
      if (bucket.isOccluder) {
        for (const m of bucket.meshes) preservedOccluders.push(m);
      }
      continue;
    }

    for (const m of bucket.meshes) {
      geosToMergeFrom.add(m.geometry);
      toRemove.push(m);
    }

    const mergedMesh = new THREE.Mesh(merged, bucket.mat);
    mergedMesh.castShadow = bucket.castShadow;
    mergedMesh.receiveShadow = bucket.receiveShadow;
    mergedMesh.renderOrder = bucket.renderOrder;
    if (bucket.nonCollidable) mergedMesh.userData.nonCollidable = true;
    if (bucket.skipNavMesh) mergedMesh.userData.skipNavMesh = true;
    if (bucket.isOccluder) mergedMesh.userData.isOccluder = true;
    root.add(mergedMesh);
    mergedMeshes.push(mergedMesh);
    if (bucket.isOccluder) preservedOccluders.push(mergedMesh);
  }

  for (const m of toRemove) {
    m.parent?.remove(m);
  }
  const stillReferenced = new Set<THREE.BufferGeometry>();
  root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh && (obj as THREE.Mesh).geometry) {
      stillReferenced.add((obj as THREE.Mesh).geometry);
    }
  });
  geosToMergeFrom.forEach((g) => {
    if (!stillReferenced.has(g)) g.dispose();
  });

  if (options.cameraOccludersOut) {
    options.cameraOccludersOut.length = 0;
    options.cameraOccludersOut.push(...preservedOccluders);
  }

  return mergedMeshes;
}

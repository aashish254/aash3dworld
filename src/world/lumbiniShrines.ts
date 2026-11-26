import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  createDetailedBrassSukundaDiyo,
  createDetailedGajurSpire,
  createRectangularHipRoofGeometry,
  createSacredFlameGroup,
} from './janakiMandirCraft';
import { BuddhaMaterials, createMonumentalSeatedBuddha } from './lumbiniBuddhaSculpt';
import {
  buildDetailedExcavatedBrickRuin,
  buildDetailedLumbiniBollards,
  buildDetailedPeaceLantern,
  getLumbiniGardenCraftMaterials,
} from './lumbiniGardenCraft';
import {
  REFLECTIVE_WATER_ENV_UNIFORMS,
  WATER_INTERACTION_UNIFORMS,
  WATER_RIPPLE_COUNT,
  createReflectivePondSurface,
} from './waterShader';
import { createWavingPrayerFlagGarland } from './prayerFlags';
import {
  LUMBINI_PUSHKARINI_POND,
  LUMBINI_SACRED_POND,
  LotusFlowerPlacement,
  generateLumbiniPondLotusPlacements,
} from './worldLogic';

const _m4 = new THREE.Matrix4();
const _v3 = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _e = new THREE.Euler();
const _colorTmp = new THREE.Color();

function applyLotusFloatWaveShader(mat: THREE.MeshStandardMaterial, amplitude = 0.011): void {
  mat.customProgramCacheKey = () => `lumbini-lotus-float-v2-${amplitude.toFixed(3)}`;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uWaterTime = REFLECTIVE_WATER_ENV_UNIFORMS.uWaterTime;
    shader.uniforms.uRainIntensity = REFLECTIVE_WATER_ENV_UNIFORMS.uRainIntensity;
    shader.uniforms.uWaterRipples = WATER_INTERACTION_UNIFORMS.uWaterRipples;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform float uWaterTime;
         uniform float uRainIntensity;
         uniform vec4 uWaterRipples[${WATER_RIPPLE_COUNT}];`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vec4 instOrigin = vec4(0.0, 0.0, 0.0, 1.0);
         #ifdef USE_INSTANCING
           instOrigin = instanceMatrix * instOrigin;
         #endif
         vec3 wPos = (modelMatrix * instOrigin).xyz;
         float wt = uWaterTime * 1.15;
         float phase = wPos.x * 0.85 + wPos.z * 0.72;
         float bob = sin(wt + phase) * ${amplitude.toFixed(4)}
                   + cos(wt * 1.65 - wPos.z * 1.1) * ${(amplitude * 0.42).toFixed(4)};
         float rippleLift = 0.0;
         vec2 rippleTilt = vec2(0.0);
         for (int i = 0; i < ${WATER_RIPPLE_COUNT}; i++) {
           vec4 rSlot = uWaterRipples[i];
           if (rSlot.z > 0.0) {
             float age = uWaterTime - rSlot.z;
             if (age >= 0.0 && age < 3.6) {
               vec2 rDiff = wPos.xz - rSlot.xy;
               float dist = length(rDiff);
               float front = age * 3.1;
               float ring = exp(-pow((dist - front) / 1.15, 2.0)) * (1.0 - smoothstep(0.5, 3.6, age));
               float rWave = sin((dist - front) * 5.4) * ring * rSlot.w;
               rippleLift += rWave * ${(amplitude * 1.85).toFixed(4)};
               rippleTilt += (rDiff / max(dist, 0.05)) * rWave * 0.06;
             }
           }
         }
         float rainJiggle = clamp(uRainIntensity, 0.0, 1.0)
                          * sin(uWaterTime * 11.5 + wPos.x * 7.3 + wPos.z * 5.9)
                          * 0.0055;
         transformed.y += bob + rippleLift + rainJiggle + dot(transformed.xz, rippleTilt);
         transformed.x += sin(wt * 0.92 + phase) * ${(amplitude * 0.55).toFixed(4)};`,
      );
  };
}

function createCuppedLotusPadGeometry(): THREE.BufferGeometry {
  const segs = 20;
  const rings = 3;
  const gapHalf = 0.17;
  const startAng = gapHalf;
  const sweep = Math.PI * 2 - gapHalf * 2;

  const positions: number[] = [0, 0.002, 0];
  const uvs: number[] = [0.5, 0.5];
  const indices: number[] = [];

  for (let r = 1; r <= rings; r++) {
    const radialT = r / rings;
    // Slight concave cup with subtle upturned leaf rim
    const y = r === 1 ? -0.004 : r === 2 ? 0.004 : 0.019;
    for (let s = 0; s <= segs; s++) {
      const ang = startAng + (s / segs) * sweep;
      const wave = r === rings ? Math.sin(ang * 5.0) * 0.005 : 0;
      const rad = radialT * (r === rings ? 1.0 + Math.sin(ang * 7.0) * 0.035 : 1.0);
      positions.push(Math.cos(ang) * rad, y + wave, Math.sin(ang) * rad);
      uvs.push(0.5 + Math.cos(ang) * radialT * 0.5, 0.5 + Math.sin(ang) * radialT * 0.5);
    }
  }

  const ringStride = segs + 1;
  // Inner triangle fan
  for (let s = 0; s < segs; s++) {
    indices.push(0, 1 + s + 1, 1 + s);
  }
  // Outer rings
  for (let r = 1; r < rings; r++) {
    const baseA = 1 + (r - 1) * ringStride;
    const baseB = 1 + r * ringStride;
    for (let s = 0; s < segs; s++) {
      const a0 = baseA + s;
      const a1 = baseA + s + 1;
      const b0 = baseB + s;
      const b1 = baseB + s + 1;
      indices.push(a0, a1, b1, a0, b1, b0);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function createSingleCuppedPetalGeometry(
  length: number,
  width: number,
  cupDepth: number,
  tiltAngle: number,
  baseRadius: number,
  azimuthAngle: number,
): THREE.BufferGeometry {
  const rows = 4;
  const cols = 2;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r <= rows; r++) {
    const v = r / rows; // 0 = base, 1 = pointed tip
    const widthProfile = Math.sin(v * Math.PI * 0.92) * (1.0 - v * 0.25);
    const halfW = width * 0.5 * Math.max(0.14, widthProfile);
    const localLen = v * length;
    const curveBack = Math.pow(v, 1.45) * cupDepth * 1.4;

    for (let c = 0; c <= cols; c++) {
      const u = c / cols;
      const xOffset = (u - 0.5) * 2.0 * halfW;
      const spoonHollow = (1.0 - Math.pow((u - 0.5) * 2.0, 2)) * cupDepth * Math.sin(v * Math.PI);
      const px = xOffset;
      const py = localLen;
      const pz = curveBack - spoonHollow;

      // Tilt petal outward/upward around X, offset radially, and rotate by azimuth
      const rx = px;
      const ry = py * Math.cos(tiltAngle) - pz * Math.sin(tiltAngle);
      const rz = py * Math.sin(tiltAngle) + pz * Math.cos(tiltAngle) + baseRadius;

      const ca = Math.cos(azimuthAngle);
      const sa = Math.sin(azimuthAngle);
      positions.push(rx * ca + rz * sa, ry, -rx * sa + rz * ca);
      uvs.push(u, v);
    }
  }

  const stride = cols + 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i0 = r * stride + c;
      const i1 = i0 + 1;
      const i2 = i0 + stride;
      const i3 = i2 + 1;
      indices.push(i0, i2, i1, i1, i2, i3);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  const nonIndexed = geo.toNonIndexed();
  geo.dispose();
  nonIndexed.computeVertexNormals();
  return nonIndexed;
}

function createLotusBloomRingGeometry(mode: 'outer' | 'inner'): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  if (mode === 'outer') {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const az = (i / count) * Math.PI * 2;
      parts.push(createSingleCuppedPetalGeometry(0.18, 0.105, 0.026, 1.02, 0.036, az));
    }
  } else {
    const count = 6;
    for (let i = 0; i < count; i++) {
      const az = ((i + 0.5) / count) * Math.PI * 2;
      parts.push(createSingleCuppedPetalGeometry(0.155, 0.088, 0.028, 0.56, 0.028, az));
    }
  }
  const merged = mergeGeometries(parts, false);
  parts.forEach((g) => g.dispose());
  return merged;
}

function createLotusSeedPodGeometry(): THREE.BufferGeometry {
  const pod = new THREE.CylinderGeometry(0.044, 0.018, 0.052, 10).toNonIndexed();
  pod.translate(0, 0.054, 0);
  const stamenCrown = new THREE.TorusGeometry(0.044, 0.011, 6, 12).toNonIndexed();
  stamenCrown.rotateX(Math.PI / 2);
  stamenCrown.translate(0, 0.046, 0);
  const merged = mergeGeometries([pod, stamenCrown], false);
  pod.dispose();
  stamenCrown.dispose();
  return merged;
}

function createLotusBudGeometry(): THREE.BufferGeometry {
  const budPts = [
    new THREE.Vector2(0.008, 0.0),
    new THREE.Vector2(0.012, 0.065),
    new THREE.Vector2(0.048, 0.115),
    new THREE.Vector2(0.054, 0.165),
    new THREE.Vector2(0.034, 0.220),
    new THREE.Vector2(0.0, 0.268),
  ];
  return new THREE.LatheGeometry(budPts, 10);
}

let cachedLotusGeos: {
  pad: THREE.BufferGeometry;
  outerBloom: THREE.BufferGeometry;
  innerBloom: THREE.BufferGeometry;
  seedPod: THREE.BufferGeometry;
  bud: THREE.BufferGeometry;
} | null = null;

function getLotusGeos() {
  if (!cachedLotusGeos) {
    cachedLotusGeos = {
      pad: createCuppedLotusPadGeometry(),
      outerBloom: createLotusBloomRingGeometry('outer'),
      innerBloom: createLotusBloomRingGeometry('inner'),
      seedPod: createLotusSeedPodGeometry(),
      bud: createLotusBudGeometry(),
    };
  }
  return cachedLotusGeos;
}

function buildProceduralLotusInstancedGarden(
  placements: LotusFlowerPlacement[],
  originX: number,
  originZ: number,
  waterLocalY: number,
): THREE.Group {
  const floraGroup = new THREE.Group();
  floraGroup.userData.nonCollidable = true;
  floraGroup.userData.isLotusFlora = true;
  if (placements.length === 0) return floraGroup;

  const geos = getLotusGeos();

  const padMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.44,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });
  applyLotusFloatWaveShader(padMat, 0.008);

  const outerPetalMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.34,
    metalness: 0.03,
    side: THREE.DoubleSide,
  });
  applyLotusFloatWaveShader(outerPetalMat, 0.010);

  const innerPetalMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.30,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });
  applyLotusFloatWaveShader(innerPetalMat, 0.011);

  const podMat = new THREE.MeshStandardMaterial({
    color: 0xf5cb4c,
    emissive: 0x4b3105,
    emissiveIntensity: 0.32,
    roughness: 0.36,
    metalness: 0.12,
  });
  applyLotusFloatWaveShader(podMat, 0.011);

  const budMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.32,
    metalness: 0.03,
  });
  applyLotusFloatWaveShader(budMat, 0.011);

  const outerList: LotusFlowerPlacement[] = [];
  const innerList: LotusFlowerPlacement[] = [];
  const podList: LotusFlowerPlacement[] = [];
  const budList: LotusFlowerPlacement[] = [];

  for (let i = 0; i < placements.length; i++) {
    const pl = placements[i];
    if (pl.stage === 'full-bloom') {
      outerList.push(pl);
      innerList.push(pl);
      podList.push(pl);
    } else if (pl.stage === 'half-bloom') {
      outerList.push(pl);
      innerList.push(pl);
    } else if (pl.stage === 'bud') {
      budList.push(pl);
    }
  }

  // 1. Floating Notched Lily Pads (1 per placement)
  const padInst = new THREE.InstancedMesh(geos.pad, padMat, placements.length);
  padInst.receiveShadow = true;
  padInst.userData.nonCollidable = true;
  padInst.userData.isLotusFlora = true;

  const padTints = [0x2e6f3a, 0x3b7d42, 0x266235, 0x488848];
  placements.forEach((pl, idx) => {
    _v3.set(pl.x - originX, waterLocalY + 0.008, pl.z - originZ);
    _e.set(pl.padTiltX, pl.rotY, pl.padTiltZ);
    _q.setFromEuler(_e);
    _s.set(pl.padRadius, 1.0, pl.padRadius);
    _m4.compose(_v3, _q, _s);
    padInst.setMatrixAt(idx, _m4);
    _colorTmp.setHex(padTints[idx % padTints.length]);
    padInst.setColorAt(idx, _colorTmp);
  });
  padInst.instanceMatrix.needsUpdate = true;
  if (padInst.instanceColor) padInst.instanceColor.needsUpdate = true;
  padInst.computeBoundingSphere();
  floraGroup.add(padInst);

  const resolveHueHex = (variant: LotusFlowerPlacement['hueVariant'], isInner: boolean): number => {
    if (variant === 'sakura-pink') return isInner ? 0xfdc5d7 : 0xf493b7;
    if (variant === 'rose-magenta') return isInner ? 0xf79dc2 : 0xe46297;
    return isInner ? 0xfffaf6 : 0xf7e3ea;
  };

  // 2. Outer Lotus Petal Rosettes
  if (outerList.length > 0) {
    const outerInst = new THREE.InstancedMesh(geos.outerBloom, outerPetalMat, outerList.length);
    outerInst.castShadow = true;
    outerInst.receiveShadow = true;
    outerInst.userData.nonCollidable = true;
    outerInst.userData.isLotusFlora = true;
    outerList.forEach((pl, idx) => {
      const sc = pl.bloomScale * (pl.stage === 'half-bloom' ? 0.84 : 1.05);
      _v3.set(pl.x - originX, waterLocalY + 0.018, pl.z - originZ);
      _e.set(pl.padTiltX * 0.5, pl.rotY + 0.4, pl.padTiltZ * 0.5);
      _q.setFromEuler(_e);
      _s.set(sc, sc * (pl.stage === 'half-bloom' ? 1.08 : 0.96), sc);
      _m4.compose(_v3, _q, _s);
      outerInst.setMatrixAt(idx, _m4);
      _colorTmp.setHex(resolveHueHex(pl.hueVariant, false));
      outerInst.setColorAt(idx, _colorTmp);
    });
    outerInst.instanceMatrix.needsUpdate = true;
    if (outerInst.instanceColor) outerInst.instanceColor.needsUpdate = true;
    outerInst.computeBoundingSphere();
    floraGroup.add(outerInst);
  }

  // 3. Inner Upright Cupped Petals
  if (innerList.length > 0) {
    const innerInst = new THREE.InstancedMesh(geos.innerBloom, innerPetalMat, innerList.length);
    innerInst.castShadow = true;
    innerInst.userData.nonCollidable = true;
    innerInst.userData.isLotusFlora = true;
    innerList.forEach((pl, idx) => {
      const sc = pl.bloomScale * (pl.stage === 'half-bloom' ? 0.78 : 1.02);
      _v3.set(pl.x - originX, waterLocalY + 0.024, pl.z - originZ);
      _e.set(pl.padTiltX * 0.4, pl.rotY + 0.75, pl.padTiltZ * 0.4);
      _q.setFromEuler(_e);
      _s.set(sc, sc * 1.06, sc);
      _m4.compose(_v3, _q, _s);
      innerInst.setMatrixAt(idx, _m4);
      _colorTmp.setHex(resolveHueHex(pl.hueVariant, true));
      innerInst.setColorAt(idx, _colorTmp);
    });
    innerInst.instanceMatrix.needsUpdate = true;
    if (innerInst.instanceColor) innerInst.instanceColor.needsUpdate = true;
    innerInst.computeBoundingSphere();
    floraGroup.add(innerInst);
  }

  // 4. Golden Seed-Pod Receptacles & Stamens
  if (podList.length > 0) {
    const podInst = new THREE.InstancedMesh(geos.seedPod, podMat, podList.length);
    podInst.userData.nonCollidable = true;
    podInst.userData.isLotusFlora = true;
    podList.forEach((pl, idx) => {
      const sc = pl.bloomScale;
      _v3.set(pl.x - originX, waterLocalY + 0.020, pl.z - originZ);
      _q.identity();
      _s.set(sc, sc, sc);
      _m4.compose(_v3, _q, _s);
      podInst.setMatrixAt(idx, _m4);
    });
    podInst.instanceMatrix.needsUpdate = true;
    podInst.computeBoundingSphere();
    floraGroup.add(podInst);
  }

  // 5. Pointed Closed Lotus Buds
  if (budList.length > 0) {
    const budInst = new THREE.InstancedMesh(geos.bud, budMat, budList.length);
    budInst.castShadow = true;
    budInst.userData.nonCollidable = true;
    budInst.userData.isLotusFlora = true;
    budList.forEach((pl, idx) => {
      const sc = pl.bloomScale * 0.95;
      _v3.set(pl.x - originX, waterLocalY + 0.008, pl.z - originZ);
      _e.set(pl.padTiltX * 1.6, pl.rotY, pl.padTiltZ * 1.6);
      _q.setFromEuler(_e);
      _s.set(sc, sc, sc);
      _m4.compose(_v3, _q, _s);
      budInst.setMatrixAt(idx, _m4);
      _colorTmp.setHex(resolveHueHex(pl.hueVariant, false));
      budInst.setColorAt(idx, _colorTmp);
    });
    budInst.instanceMatrix.needsUpdate = true;
    if (budInst.instanceColor) budInst.instanceColor.needsUpdate = true;
    budInst.computeBoundingSphere();
    floraGroup.add(budInst);
  }

  floraGroup.userData.lotusCount = placements.length;
  return floraGroup;
}

/**
 * Builds the historic Ashoka Pillar of Lumbini (249 BCE) faithfully matching real-life appearance:
 * tapered Chunar sandstone monolithic shaft, authentic weathered broken top with rounded protective cap
 * (no lion capital), bronze/iron clamp bands, Brahmi inscription face, brass protective fence & plaque.
 */
export function buildAuthenticAshokaPillar(
  stoneMat: THREE.Material,
  brickMat: THREE.Material,
  ironMat: THREE.Material,
  brassMat: THREE.Material,
  edictMap: THREE.Texture,
  edictNormal: THREE.Texture,
): THREE.Group {
  const g = new THREE.Group();

  // Stepped brick & sandstone fenced enclosure (3.8m x 3.8m)
  const brickBase = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.28, 3.8), brickMat);
  brickBase.position.y = 0.14;
  brickBase.castShadow = true;
  brickBase.receiveShadow = true;

  const stoneDeck = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.16, 3.2), stoneMat);
  stoneDeck.position.y = 0.36;
  stoneDeck.castShadow = true;
  stoneDeck.receiveShadow = true;
  g.add(brickBase, stoneDeck);

  // Golden-brass protective perimeter fence (authentic Lumbini brass railing)
  for (const sx of [-1.68, 1.68]) {
    for (const sz of [-1.68, 1.68]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.92, 0.14), stoneMat);
      post.position.set(sx, 0.72, sz);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), brassMat);
      cap.position.set(sx, 1.22, sz);
      g.add(post, cap);
    }
  }
  const railGeoX = new THREE.BoxGeometry(3.36, 0.055, 0.055);
  const railGeoZ = new THREE.BoxGeometry(0.055, 0.055, 3.36);
  for (const ry of [0.56, 1.06]) {
    for (const side of [-1.68, 1.68]) {
      const rx = new THREE.Mesh(railGeoX, brassMat);
      rx.position.set(0, ry, side);
      const rz = new THREE.Mesh(railGeoZ, brassMat);
      rz.position.set(side, ry, 0);
      g.add(rx, rz);
    }
  }
  const picketCoords: Array<[number, number]> = [];
  for (let i = -4; i <= 4; i++) {
    picketCoords.push([i * 0.34, -1.68], [i * 0.34, 1.68], [-1.68, i * 0.34], [1.68, i * 0.34]);
  }
  const picketGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.56, 6);
  const pickets = new THREE.InstancedMesh(picketGeo, brassMat, picketCoords.length);
  picketCoords.forEach(([px, pz], idx) => {
    _v3.set(px, 0.81, pz);
    _q.identity();
    _s.setScalar(1);
    _m4.compose(_v3, _q, _s);
    pickets.setMatrixAt(idx, _m4);
  });
  pickets.instanceMatrix.needsUpdate = true;
  pickets.computeBoundingSphere();
  g.add(pickets);

  // Pillar square stone plinth with Brahmi Edict engraving
  const pedSquare = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.44, 1.52), stoneMat);
  pedSquare.position.y = 0.66;
  pedSquare.castShadow = true;

  const edictMat = new THREE.MeshStandardMaterial({
    map: edictMap,
    normalMap: edictNormal,
    normalScale: new THREE.Vector2(1.0, 1.0),
    roughness: 0.72,
  });
  const edictEast = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.34, 0.72), edictMat);
  edictEast.position.set(0.77, 0.66, 0);
  const edictSouth = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.34, 0.06), edictMat);
  edictSouth.position.set(0, 0.66, 0.77);
  g.add(pedSquare, edictEast, edictSouth);

  // Monolithic tapered Chunar sandstone shaft (6.2m above plinth -> ~7.1m total)
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.47, 6.2, 24), stoneMat);
  shaft.position.y = 3.98;
  shaft.castShadow = true;
  shaft.receiveShadow = true;
  g.add(shaft);

  // Carved Brahmi inscription band directly on lower pillar face
  const shaftEdict = new THREE.Mesh(
    new THREE.CylinderGeometry(0.455, 0.462, 0.75, 24, 1, true, -0.55, 1.1),
    edictMat,
  );
  shaftEdict.position.y = 2.15;
  g.add(shaftEdict);

  // Historic dark iron/bronze structural clamp bands encircling the shaft
  for (const cy of [3.2, 5.1, 6.65]) {
    const rad = THREE.MathUtils.lerp(0.47, 0.35, (cy - 0.88) / 6.2) + 0.015;
    const band = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.032, 8, 24), ironMat);
    band.rotation.x = Math.PI / 2;
    band.position.y = cy;
    g.add(band);
  }

  // Authentic weathered broken/stepped top with protective bronze cap (NO lion capital!)
  const brokenShoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.35, 0.24, 18), stoneMat);
  brokenShoulder.position.y = 7.20;
  brokenShoulder.castShadow = true;
  const stoneCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.45),
    ironMat,
  );
  stoneCap.position.y = 7.28;
  g.add(brokenShoulder, stoneCap);

  return g;
}

/**
 * Builds the monumental stepped Pushkarini Sacred Pond (26.0m x 17.6m) directly south-east of Maya Devi Temple,
 * with 4 descending terracotta-red brick ghat tiers, dark stone pool bed, blooming lotus clusters,
 * and animated mirror-reflective water reflecting the temple facade.
 */
export function buildPushkariniPond(
  terracottaMat: THREE.Material,
  brickMat: THREE.Material,
  chunarMat: THREE.Material,
  _waterNormal: THREE.Texture,
  isSoftwareGl = false,
): THREE.Group {
  const g = new THREE.Group();

  const outerW = 26.0; // X
  const outerD = 17.6; // Z
  const waterW = 22.0;
  const waterD = 13.4;

  // Dark stone deep floor beneath water
  const pondFloor = new THREE.Mesh(
    new THREE.BoxGeometry(waterW + 0.8, 0.14, waterD + 0.8),
    new THREE.MeshStandardMaterial({ color: 0x16282a, roughness: 0.9 }),
  );
  pondFloor.position.y = -0.92;
  pondFloor.receiveShadow = true;
  g.add(pondFloor);

  // 4 stepped descending terracotta-brick ghat tiers (from outer coping at y=+0.34 down to -0.68)
  const tiers: Array<[number, number, number, number, number]> = [
    [outerW, outerD, 1.5, -0.18, 0.34], // outer parapet rim
    [outerW - 1.35, outerD - 1.35, 1.2, -0.32, 0.14], // upper ghat step
    [outerW - 2.6, outerD - 2.6, 0.92, -0.45, -0.06], // water-level step
    [outerW - 3.6, outerD - 3.6, 0.62, -0.58, -0.26], // submerged step
  ];
  tiers.forEach(([w, d, rimT, cy, h], idx) => {
    const mat = idx === 0 ? terracottaMat : brickMat;
    const nRim = new THREE.Mesh(new THREE.BoxGeometry(w, h + 0.82, rimT), mat);
    nRim.position.set(0, cy, -d * 0.5 + rimT * 0.5);
    const sRim = new THREE.Mesh(new THREE.BoxGeometry(w, h + 0.82, rimT), mat);
    sRim.position.set(0, cy, d * 0.5 - rimT * 0.5);
    const sideLen = Math.max(0.2, d - rimT * 2.004);
    const wRim = new THREE.Mesh(new THREE.BoxGeometry(rimT, h + 0.82, sideLen), mat);
    wRim.position.set(-w * 0.5 + rimT * 0.5, cy, 0);
    const eRim = new THREE.Mesh(new THREE.BoxGeometry(rimT, h + 0.82, sideLen), mat);
    eRim.position.set(w * 0.5 - rimT * 0.5, cy, 0);
    [nRim, sRim, wRim, eRim].forEach((m) => {
      m.castShadow = true;
      m.receiveShadow = true;
      g.add(m);
    });
  });

  // Formal South & North descending ritual stair piers
  for (const sz of [-waterD * 0.5 - 0.15, waterD * 0.5 + 0.15]) {
    for (const sx of [-2.4, 2.4]) {
      const pier = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.64, 0.72), chunarMat);
      pier.position.set(sx, 0.14, sz);
      pier.castShadow = true;
      g.add(pier);
    }
  }

  // Real-time planar mirror-reflective sacred water surface (y = -0.14 in local = +0.21 world)
  g.userData.waterTimeUniform = REFLECTIVE_WATER_ENV_UNIFORMS.uWaterTime;
  const waterMesh = createReflectivePondSurface(new THREE.PlaneGeometry(waterW, waterD, 24, 16), {
    isSoftwareGl,
    textureSize: isSoftwareGl ? 256 : 512,
    deepTint: 0x092b2d,
    shallowTint: 0x206762,
    reflectivity: 0.80,
    rippleStrength: 0.020,
    anchorWorldPos: new THREE.Vector3(-200, 0.21, 112.5),
  });
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.y = -0.14;
  waterMesh.userData.nonCollidable = true;
  g.add(waterMesh);

  // Procedural floating lotus pads, multi-tier blossoms, buds & golden seed pods
  const pushkariniLotuses = generateLumbiniPondLotusPlacements().filter(
    (p) => p.pond === 'pushkarini',
  );
  const pushkariniFlora = buildProceduralLotusInstancedGarden(
    pushkariniLotuses,
    LUMBINI_PUSHKARINI_POND.centerX,
    LUMBINI_PUSHKARINI_POND.centerZ,
    -0.14,
  );
  g.add(pushkariniFlora);
  g.userData.lotusCount = pushkariniLotuses.length;

  return g;
}

/**
 * Real-life scaled Myanmar Golden Temple (Lokamani Cula Pagoda) builder lives in lumbiniMyanmarPagoda.ts.
 */
export { buildMyanmarGoldenPagoda } from './lumbiniMyanmarPagoda';


/**
 * Builds the Royal Thai Monastery White-Marble Pavilion (Wat Thai Lumbini style)
 * sheltering the Monumental Golden Dhyana Buddha holding a dark alms bowl atop a red-and-gold
 * snow-lion Dharmachakra throne (combining both user reference images!).
 */
export function buildThaiMarbleSanctuary(
  whiteMarbleMat: THREE.Material,
  goldMat: THREE.Material,
  crimsonMat: THREE.Material,
  heroMats: BuddhaMaterials,
): { group: THREE.Group; light: THREE.PointLight } {
  const g = new THREE.Group();

  // Wide white marble base terrace (8.6m x 8.6m)
  const base1 = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.38, 8.6), whiteMarbleMat);
  base1.position.y = 0.19;
  base1.castShadow = true;
  base1.receiveShadow = true;
  const base2 = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.36, 7.6), whiteMarbleMat);
  base2.position.y = 0.56;
  base2.castShadow = true;
  base2.receiveShadow = true;
  g.add(base1, base2);

  // Corner & colonnade Thai white marble columns with gilded lotus capitals
  for (const sx of [-3.1, 0, 3.1]) {
    for (const sz of [-3.1, 3.1]) {
      if (sx === 0 && sz > 0) continue; // front view open
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.24, 3.8, 16), whiteMarbleMat);
      col.position.set(sx, 2.64, sz);
      col.castShadow = true;
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.21, 0.28, 16), goldMat);
      cap.position.set(sx, 4.42, sz);
      g.add(col, cap);
    }
  }
  for (const sx of [-3.1, 3.1]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.24, 3.8, 16), whiteMarbleMat);
    col.position.set(sx, 2.64, 0);
    col.castShadow = true;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.21, 0.28, 16), goldMat);
    cap.position.set(sx, 4.42, 0);
    g.add(col, cap);
  }

  // Sweeping Multi-Tiered White & Gold Thai Chofah Roofs
  for (const [tier, rw, rh, ry] of [
    [0, 8.4, 1.35, 4.58],
    [1, 6.2, 1.25, 5.72],
    [2, 3.8, 1.15, 6.72],
  ] as Array<[number, number, number, number]>) {
    const roof = new THREE.Mesh(createRectangularHipRoofGeometry(rw, rh, rw, 0.58), whiteMarbleMat);
    roof.position.y = ry + rh * 0.5;
    roof.castShadow = true;
    const trim = new THREE.Mesh(new THREE.BoxGeometry(rw + 0.12, 0.10, rw + 0.12), goldMat);
    trim.position.y = ry + 0.05;
    g.add(roof, trim);
    // Golden Chofah sky-tassel finials at gable corners
    if (tier < 2) {
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const chofah = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.65, 6), goldMat);
          chofah.position.set(sx * (rw * 0.46), ry + 0.42, sz * (rw * 0.46));
          chofah.rotation.z = -sx * 0.28;
          g.add(chofah);
        }
      }
    }
  }
  const spire = createDetailedGajurSpire(goldMat, crimsonMat, 0.85);
  spire.position.y = 7.82;
  g.add(spire);

  // Monumental Golden Dhyana Buddha with Dark Alms Bowl atop Red & Gold Tibetan Lion Throne
  const buddha = createMonumentalSeatedBuddha(heroMats, {
    scale: 0.92,
    pose: 'dhyana',
    withNagaCanopy: false,
    withOfferingLamps: true,
    withAlmsBowl: true,
    crimsonThrone: true,
  });
  buddha.position.set(0, 0.74, 0);
  g.add(buddha);

  const light = new THREE.PointLight(0xffe1a6, 1.8, 12, 1.4);
  light.position.set(0, 4.2, 1.1);
  g.add(light);

  return { group: g, light };
}

/**
 * Builds the Sacred Bodhi (Pipal) Tree Chautara platform beside Pushkarini Pond:
 * stepped octagonal brick & white stucco platform, gnarled root buttresses, saffron prayer scarf,
 * InstancedMesh botanical Bodhi foliage, and 5-color Buddhist prayer flag canopy.
 */
export function buildSacredBodhiChautara(
  brickMat: THREE.Material,
  whiteStuccoMat: THREE.Material,
  timberMat: THREE.Material,
  goldMat: THREE.Material,
  bronzeMat: THREE.Material,
  flameMat: THREE.Material,
): THREE.Group {
  const bodhi = new THREE.Group();

  const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.0, 0.36, 8), brickMat);
  tier1.position.y = 0.18;
  tier1.castShadow = true;
  tier1.receiveShadow = true;
  const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(2.22, 2.34, 0.38, 8), whiteStuccoMat);
  tier2.position.y = 0.55;
  tier2.castShadow = true;
  tier2.receiveShadow = true;
  const soil = new THREE.Mesh(
    new THREE.CylinderGeometry(1.92, 1.98, 0.14, 16),
    new THREE.MeshStandardMaterial({ color: 0x4b3828, roughness: 0.95 }),
  );
  soil.position.y = 0.72;
  bodhi.add(tier1, tier2, soil);

  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.72, 0),
    new THREE.Vector3(0.12, 2.1, 0.08),
    new THREE.Vector3(-0.08, 3.4, -0.05),
    new THREE.Vector3(0.05, 4.6, 0.05),
  ]);
  const trunk = new THREE.Mesh(new THREE.TubeGeometry(trunkCurve, 14, 0.34, 10, false), timberMat);
  trunk.castShadow = true;
  bodhi.add(trunk);

  // Saffron ceremonial cloth tied around sacred trunk
  const scarf = new THREE.Mesh(
    new THREE.TorusGeometry(0.37, 0.06, 8, 20),
    new THREE.MeshStandardMaterial({ color: 0xdf7b1c, roughness: 0.72 }),
  );
  scarf.rotation.x = Math.PI / 2;
  scarf.position.set(0.06, 1.85, 0.04);
  bodhi.add(scarf);

  const diyo = createDetailedBrassSukundaDiyo(goldMat, bronzeMat, flameMat, 0.75, true);
  diyo.position.set(1.05, 0.74, 1.78);
  bodhi.add(diyo);

  for (let r = 0; r < 6; r++) {
    const a = (r / 6) * Math.PI * 2 + 0.25;
    const rc = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(a) * 0.24, 1.65, Math.sin(a) * 0.24),
      new THREE.Vector3(Math.cos(a) * 0.62, 1.05, Math.sin(a) * 0.62),
      new THREE.Vector3(Math.cos(a) * 1.24, 0.75, Math.sin(a) * 1.24),
    ]);
    const rm = new THREE.Mesh(new THREE.TubeGeometry(rc, 8, 0.12, 8, false), timberMat);
    rm.castShadow = true;
    bodhi.add(rm);
  }

  const branchEndpoints: THREE.Vector3[] = [];
  for (let b = 0; b < 6; b++) {
    const a = (b / 6) * Math.PI * 2 + 0.35;
    const reach = 2.4 + (b % 2) * 0.45;
    const topY = 5.45 + (b % 3) * 0.48;
    const bc = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.04, 3.6 + (b % 2) * 0.25, 0.02),
      new THREE.Vector3(Math.cos(a) * reach * 0.52, 4.6, Math.sin(a) * reach * 0.52),
      new THREE.Vector3(Math.cos(a) * reach, topY, Math.sin(a) * reach),
    ]);
    const bm = new THREE.Mesh(new THREE.TubeGeometry(bc, 10, 0.12, 8, false), timberMat);
    bm.castShadow = true;
    bodhi.add(bm);
    branchEndpoints.push(bc.getPoint(0.65), bc.getPoint(1.0));
  }
  branchEndpoints.push(new THREE.Vector3(0, 6.2, 0), new THREE.Vector3(0.25, 6.5, -0.2));

  let pipalClusterMap: THREE.CanvasTexture | null = null;
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 256, 256);
      // Draw a cluster of 7 heart-shaped Ficus religiosa (Pipal) leaves with slender drip tips
      const leaves: Array<[number, number, number, number, string]> = [
        [128, 122, 0.0, 1.05, '#dcefc6'],
        [82, 134, -0.58, 0.92, '#c8e3aa'],
        [174, 134, 0.58, 0.92, '#cee8b0'],
        [98, 86, -0.35, 0.84, '#e6f5d2'],
        [158, 86, 0.35, 0.84, '#d9edc2'],
        [112, 168, -0.25, 0.78, '#bdd99e'],
        [146, 168, 0.25, 0.78, '#c2df9f'],
      ];
      for (const [lx, ly, rot, sc, fill] of leaves) {
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(rot);
        ctx.scale(sc, sc);
        ctx.fillStyle = fill;
        ctx.beginPath();
        // Heart-shaped base + characteristic long Pipal acuminate drip tip
        ctx.moveTo(0, -46);
        ctx.bezierCurveTo(10, -28, 34, -18, 32, 10);
        ctx.bezierCurveTo(30, 32, 12, 38, 0, 26);
        ctx.bezierCurveTo(-12, 38, -30, 32, -32, 10);
        ctx.bezierCurveTo(-34, -18, -10, -28, 0, -46);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 232, 0.45)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(0, 24);
        ctx.lineTo(0, -42);
        ctx.stroke();
        ctx.restore();
      }
      pipalClusterMap = new THREE.CanvasTexture(c);
      pipalClusterMap.colorSpace = THREE.SRGBColorSpace;
      pipalClusterMap.needsUpdate = true;
    }
  }

  const cardA = new THREE.PlaneGeometry(0.86, 0.96, 2, 2);
  const posA = cardA.attributes.position;
  for (let vi = 0; vi < posA.count; vi++) {
    const px = posA.getX(vi);
    const py = posA.getY(vi);
    posA.setZ(vi, -0.09 * (px * px + py * py));
  }
  cardA.computeVertexNormals();
  const cardB = cardA.clone();
  cardB.rotateY(Math.PI * 0.48);
  cardB.rotateX(0.24);
  const sprigGeo = mergeGeometries([cardA, cardB], false);
  cardA.dispose();
  cardB.dispose();

  const bodhiWindUniforms = {
    uBodhiTime: { value: 0 },
    uBodhiWind: { value: 0.45 },
  };
  const sprigMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: pipalClusterMap ?? undefined,
    alphaTest: pipalClusterMap ? 0.36 : 0,
    side: THREE.DoubleSide,
    roughness: 0.64,
    metalness: 0.02,
  });
  sprigMat.customProgramCacheKey = () => 'bodhi-pipal-foliage-v1';
  sprigMat.onBeforeCompile = (shader) => {
    shader.uniforms.uBodhiTime = bodhiWindUniforms.uBodhiTime;
    shader.uniforms.uBodhiWind = bodhiWindUniforms.uBodhiWind;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform float uBodhiTime;
         uniform float uBodhiWind;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vec4 bOrig = vec4(0.0, 0.0, 0.0, 1.0);
         #ifdef USE_INSTANCING
           bOrig = instanceMatrix * bOrig;
         #endif
         float bPhase = bOrig.x * 1.3 + bOrig.z * 1.1 + bOrig.y * 0.7;
         float bSway = sin(uBodhiTime * 2.1 + bPhase) * (0.045 + uBodhiWind * 0.085);
         transformed.x += bSway * (0.5 + position.y);
         transformed.z += cos(uBodhiTime * 1.7 + bPhase * 0.8) * (0.032 + uBodhiWind * 0.055);`,
      );
  };

  const leafPalette = [0x4c8339, 0x5c9443, 0x3b6c2c, 0x6ba24a, 0x7cb052];
  const leafCount = 620;
  const leafInst = new THREE.InstancedMesh(sprigGeo, sprigMat, leafCount);
  leafInst.castShadow = true;
  leafInst.receiveShadow = true;
  leafInst.userData.nonCollidable = true;
  for (let i = 0; i < leafCount; i++) {
    const center = branchEndpoints[i % branchEndpoints.length];
    const ga = i * 2.39996323;
    const rad = Math.sqrt(((i * 19) % 100) / 100) * 1.65;
    const hVar = (((i * 37) % 100) / 100 - 0.32) * 1.32;
    _v3.set(
      center.x + Math.cos(ga) * rad,
      Math.max(3.85, center.y + hVar),
      center.z + Math.sin(ga) * rad,
    );
    _q.setFromEuler(_e.set(((i * 7) % 10) * 0.08 - 0.4, ga, ((i * 11) % 10) * 0.06 - 0.3));
    _s.setScalar(0.84 + ((i * 13) % 10) * 0.06);
    _m4.compose(_v3, _q, _s);
    leafInst.setMatrixAt(i, _m4);
    _colorTmp.setHex(leafPalette[i % leafPalette.length]);
    leafInst.setColorAt(i, _colorTmp);
  }
  leafInst.instanceMatrix.needsUpdate = true;
  if (leafInst.instanceColor) leafInst.instanceColor.needsUpdate = true;
  leafInst.computeBoundingSphere();
  bodhi.add(leafInst);

  // Drifting golden-green falling Bodhi leaves circling down around the Chautara
  const fallingCount = 72;
  const fPos = new Float32Array(fallingCount * 3);
  const fSeed = new Float32Array(fallingCount);
  for (let i = 0; i < fallingCount; i++) {
    const a = i * 2.39996323;
    const r = 1.2 + ((i * 29) % 100) / 100 * 4.4;
    fPos[i * 3] = Math.cos(a) * r;
    fPos[i * 3 + 1] = 0.6 + ((i * 41) % 100) / 100 * 5.2;
    fPos[i * 3 + 2] = Math.sin(a) * r;
    fSeed[i] = ((i * 17) % 100) / 100 * 6.2831;
  }
  const fGeo = new THREE.BufferGeometry();
  fGeo.setAttribute('position', new THREE.BufferAttribute(fPos, 3));
  fGeo.setAttribute('aSeed', new THREE.BufferAttribute(fSeed, 1));
  const fMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: bodhiWindUniforms.uBodhiTime,
      uWind: bodhiWindUniforms.uBodhiWind,
    },
    transparent: true,
    depthWrite: false,
    vertexShader: `
      attribute float aSeed;
      uniform float uTime;
      uniform float uWind;
      varying float vAlpha;
      varying float vSpin;
      void main() {
        vec3 p = position;
        float cycle = mod(p.y - uTime * (0.28 + uWind * 0.16) + aSeed, 5.2);
        p.y = 0.55 + cycle;
        float sway = 0.45 + uWind * 0.75;
        p.x += sin(uTime * 1.15 + aSeed * 2.0 + cycle * 1.4) * sway;
        p.z += cos(uTime * 0.95 + aSeed * 1.7 + cycle * 1.2) * sway;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = clamp(32.0 / max(1.4, -mv.z), 3.0, 11.0);
        vAlpha = smoothstep(0.55, 1.35, p.y) * (1.0 - smoothstep(4.9, 5.75, p.y));
        vSpin = uTime * 2.2 + aSeed;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      varying float vSpin;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float c = cos(vSpin);
        float s = sin(vSpin);
        vec2 ruv = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);
        float heart = length(vec2(ruv.x * 1.35, ruv.y - abs(ruv.x) * 0.38));
        if (heart > 0.34) discard;
        vec3 col = mix(vec3(0.46, 0.72, 0.24), vec3(0.84, 0.76, 0.24), 0.4 + 0.4 * sin(vSpin));
        gl_FragColor = vec4(col, vAlpha * 0.88);
      }
    `,
  });
  const fallingLeaves = new THREE.Points(fGeo, fMat);
  fallingLeaves.name = 'BodhiFallingLeaves';
  fallingLeaves.frustumCulled = false;
  fallingLeaves.userData.noMerge = true;
  fallingLeaves.userData.nonCollidable = true;
  fallingLeaves.userData.onEnvironmentUpdate = (env: { elapsed: number; windSpeed: number }) => {
    bodhiWindUniforms.uBodhiTime.value = env.elapsed;
    bodhiWindUniforms.uBodhiWind.value = Math.min(1, Math.max(0.15, env.windSpeed * 0.28));
  };
  bodhi.add(fallingLeaves);
  bodhi.userData.animatedLeaves = fallingLeaves;

  // 6 carved stone & bronze perimeter bollards anchoring radial & ring waving 5-color Buddhist Lungta canopies
  const canopyRadius = 3.08;
  const canopyPosts: THREE.Vector3[] = [];
  const bodhiBollardCoords: Array<[number, number]> = [];
  for (let p = 0; p < 6; p++) {
    const angle = (p / 6) * Math.PI * 2 + 0.15;
    const bx = Math.cos(angle) * canopyRadius;
    const bz = Math.sin(angle) * canopyRadius;
    bodhiBollardCoords.push([bx, bz]);
    canopyPosts.push(new THREE.Vector3(bx, 1.40, bz));
  }
  const bodhiBollards = buildDetailedLumbiniBollards(bodhiBollardCoords, {
    baseY: 0.02,
    heightScale: 1.56,
    radiusScale: 0.85,
    bronzeMat,
    giltMat: goldMat,
  });
  bodhi.add(bodhiBollards);
  for (let p = 0; p < canopyPosts.length; p++) {
    const angle = (p / 6) * Math.PI * 2 + 0.15;
    const canopyAnchor = new THREE.Vector3(Math.cos(angle) * 1.45, 4.75, Math.sin(angle) * 1.45);
    const radialLine = createWavingPrayerFlagGarland(canopyAnchor, canopyPosts[p], {
      flagCount: 6,
      flagWidth: 0.28,
      flagHeight: 0.36,
      sag: 0.28,
    });
    radialLine.group.userData.nonCollidable = true;
    bodhi.add(radialLine.group);

    const nextPost = canopyPosts[(p + 1) % canopyPosts.length];
    const ringLine = createWavingPrayerFlagGarland(canopyPosts[p], nextPost, {
      flagCount: 5,
      flagWidth: 0.26,
      flagHeight: 0.34,
      sag: 0.22,
    });
    ringLine.group.userData.nonCollidable = true;
    bodhi.add(ringLine.group);
  }

  const diyoLight = new THREE.PointLight(0xffb454, 1.85, 14, 1.5);
  diyoLight.position.set(1.05, 1.5, 1.78);
  diyoLight.userData = {
    flickerPhase: 1.7,
    flickerAmp: 0.14,
    intensityScale: 0.88,
    warmFlicker: true,
  };
  bodhi.add(diyoLight);
  bodhi.userData.diyoLight = diyoLight;

  return bodhi;
}

/**
 * Builds the Eternal Peace Flame (Shanti Deep) monument with stepped Chunar sandstone plinth,
 * bronze brazier bowl, glowing ember core, animated flame & warm PointLight.
 */
export function buildEternalPeaceFlame(
  chunarStoneMat: THREE.Material,
  marbleWalkMat: THREE.Material,
  warmBronzeMat: THREE.Material,
  giltGoldMat: THREE.Material,
  flameGlowMat: THREE.Material,
): { group: THREE.Group; flameNode: THREE.Object3D; light: THREE.PointLight } {
  const g = new THREE.Group();

  const b1 = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.92, 0.28, 8), chunarStoneMat);
  b1.position.y = 0.14;
  b1.castShadow = true;
  b1.receiveShadow = true;
  const b2 = new THREE.Mesh(new THREE.CylinderGeometry(1.20, 1.38, 0.42, 8), marbleWalkMat);
  b2.position.y = 0.49;
  b2.castShadow = true;

  const pedPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.62, 0.0),
    new THREE.Vector2(0.48, 0.24),
    new THREE.Vector2(0.36, 0.52),
    new THREE.Vector2(0.46, 0.78),
    new THREE.Vector2(0.40, 0.90),
  ];
  const ped = new THREE.Mesh(new THREE.LatheGeometry(pedPts, 20), warmBronzeMat);
  ped.position.y = 0.70;
  ped.castShadow = true;

  const bowlPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.40, 0.02),
    new THREE.Vector2(0.82, 0.22),
    new THREE.Vector2(0.88, 0.36),
    new THREE.Vector2(0.76, 0.38),
    new THREE.Vector2(0.0, 0.20),
  ];
  const bowl = new THREE.Mesh(new THREE.LatheGeometry(bowlPts, 24), giltGoldMat);
  bowl.position.y = 1.56;
  bowl.castShadow = true;

  const ember = new THREE.Mesh(
    new THREE.SphereGeometry(0.48, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
    new THREE.MeshStandardMaterial({
      color: 0x7c2008,
      emissive: 0xff5a18,
      emissiveIntensity: 2.1,
      roughness: 0.65,
    }),
  );
  ember.position.y = 1.72;

  const flameNode = createSacredFlameGroup(flameGlowMat, 4.0);
  flameNode.position.y = 1.84;
  flameNode.userData.nonCollidable = true;
  flameNode.userData.noMerge = true;
  flameNode.userData.onFlickerUpdate = (elapsed: number) => {
    const pulse = 1 + Math.sin(elapsed * 7.2) * 0.12 + Math.cos(elapsed * 11.4) * 0.06;
    flameNode.scale.set(1 + Math.sin(elapsed * 5.3) * 0.07, pulse, 1 + Math.cos(elapsed * 6.1) * 0.07);
  };

  const light = new THREE.PointLight(0xffa43c, 2.3, 18, 1.45);
  light.position.set(0, 2.65, 0);

  g.add(b1, b2, ped, bowl, ember, flameNode, light);
  return { group: g, flameNode, light };
}

/**
 * Builds a carved Maurya weathered brick archaeological stupa/monastery ruin base
 * (matching excavated ruins scattered across the Sacred Garden lawns around Maya Devi Temple).
 */
export function buildExcavatedBrickRuin(
  brickMat: THREE.Material,
  w: number,
  h: number,
  d: number,
  extra?: {
    stoneMat?: THREE.Material;
    bronzeMat?: THREE.Material;
    flameMat?: THREE.Material;
    variantIndex?: number;
  },
): THREE.Group {
  const craftMats = getLumbiniGardenCraftMaterials();
  return buildDetailedExcavatedBrickRuin(
    brickMat,
    extra?.stoneMat ?? craftMats.weatheredSandstoneMat,
    extra?.bronzeMat ?? craftMats.giltBrassMat,
    extra?.flameMat ?? craftMats.giltBrassMat,
    w,
    h,
    d,
    extra?.variantIndex ?? 0,
  );
}

/**
 * Builds a carved Chunar sandstone Dharmachakra Torana ceremonial entrance archway.
 */
export function buildToranaGate(
  stoneMat: THREE.Material,
  brickMat: THREE.Material,
  goldMat: THREE.Material,
  bronzeMat: THREE.Material,
): THREE.Group {
  const g = new THREE.Group();
  for (const side of [-1, 1]) {
    const px = side * 3.55;
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.44, 1.18), brickMat);
    base.position.set(px, 0.22, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.36, 0.96), stoneMat);
    plinth.position.set(px, 0.62, 0);
    plinth.castShadow = true;
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.68, 3.80, 0.68), stoneMat);
    pillar.position.set(px, 2.70, 0);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    const capital = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.28, 0.96), stoneMat);
    capital.position.set(px, 4.74, 0);
    capital.castShadow = true;
    const lotusCap = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.24, 16), goldMat);
    lotusCap.position.set(px, 5.00, 0);
    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), goldMat);
    finial.position.set(px, 5.21, 0);
    g.add(base, plinth, pillar, capital, lotusCap, finial);
  }
  for (const [by, bw, bh] of [
    [4.70, 8.2, 0.34],
    [5.27, 8.7, 0.30],
  ] as Array<[number, number, number]>) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.64), stoneMat);
    beam.position.set(0, by, 0);
    beam.castShadow = true;
    beam.receiveShadow = true;
    g.add(beam);
    for (const side of [-1, 1]) {
      const volute = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.065, 8, 16), goldMat);
      volute.position.set(side * (bw * 0.5 + 0.04), by + 0.06, 0);
      g.add(volute);
    }
  }
  for (const sx of [-1.85, 0, 1.85]) {
    const spacer = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.44), bronzeMat);
    spacer.position.set(sx, 4.99, 0);
    g.add(spacer);
  }
  const wheelOuter = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.06, 10, 32), goldMat);
  wheelOuter.position.set(0, 6.07, 0);
  wheelOuter.castShadow = true;
  const wheelHub = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.14, 16), goldMat);
  wheelHub.rotation.x = Math.PI / 2;
  wheelHub.position.set(0, 6.07, 0);
  const wheelStand = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.26, 0.36), stoneMat);
  wheelStand.position.set(0, 5.51, 0);
  g.add(wheelOuter, wheelHub, wheelStand);
  const spokeGeo = new THREE.CylinderGeometry(0.022, 0.022, 1.06, 8);
  for (let i = 0; i < 4; i++) {
    const spoke = new THREE.Mesh(spokeGeo, goldMat);
    spoke.position.set(0, 6.07, 0);
    spoke.rotation.z = (i / 4) * Math.PI;
    g.add(spoke);
  }
  return g;
}

/**
 * Builds an authentic, high-detail Nepali Chaitya-Dipa Pagoda Peace Lantern
 * combining dark carved basalt, pale speckled Himalayan granite, oxidized
 * copper-slate pagoda tiers, filigree bronze Jali, amber glass & inner Diyo flame.
 */
export function buildPeaceLantern(
  stoneMat: THREE.Material,
  bronzeMat: THREE.Material,
  glowMat: THREE.Material,
): THREE.Group {
  return buildDetailedPeaceLantern(stoneMat, bronzeMat, glowMat);
}

function appendWaterChannelStrip(
  positions: number[],
  uvs: number[],
  indices: number[],
  x0: number,
  x1: number,
  z0: number,
  z1: number,
  segX: number,
  segZ: number,
): void {
  // Reflector lies in local XY facing +Z; rotating X by -PI/2 maps (x, y, 0) -> (x, 0, -y)
  const baseVert = positions.length / 3;
  const y0 = -z1;
  const y1 = -z0;
  const isNSChannel = Math.abs(x1 - x0) >= Math.abs(z1 - z0);
  const chanWidth = Math.max(1.0, isNSChannel ? Math.abs(z1 - z0) : Math.abs(x1 - x0));
  for (let iz = 0; iz <= segZ; iz++) {
    const v = iz / segZ;
    const vy = THREE.MathUtils.lerp(y0, y1, v);
    for (let ix = 0; ix <= segX; ix++) {
      const u = ix / segX;
      const vx = THREE.MathUtils.lerp(x0, x1, u);
      positions.push(vx, vy, 0);
      if (isNSChannel) {
        const endDist = Math.min(Math.abs(vx - x0), Math.abs(x1 - vx));
        const uvU = THREE.MathUtils.clamp(endDist / chanWidth, 0, 0.5);
        uvs.push(uvU, v);
      } else {
        uvs.push(u, 0.5);
      }
    }
  }
  const stride = segX + 1;
  for (let iz = 0; iz < segZ; iz++) {
    for (let ix = 0; ix < segX; ix++) {
      const a = baseVert + iz * stride + ix;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, b, d, a, d, c);
    }
  }
}

/**
 * Builds the continuous reflective Sacred Garden Surrounding Pond moat framing Lumbini's
 * 88m x 96m inner complex: stepped terracotta & Chunar sandstone ghat retaining banks,
 * 4 arched pilgrim causeway bridges with carved balustrades, outer brick promenades,
 * stone abutment piers supporting cardinal lanterns, and sheltered lotus clusters.
 */
export function buildSacredGardenSurroundingPond(
  terracottaMat: THREE.Material,
  brickMat: THREE.Material,
  chunarMat: THREE.Material,
  goldMat: THREE.Material,
  bronzeMat: THREE.Material,
  isSoftwareGl = false,
): THREE.Group {
  const g = new THREE.Group();

  // Local extents relative to (-210, 0.25, 96)
  const inMinX = LUMBINI_SACRED_POND.innerMinX - LUMBINI_SACRED_POND.centerX; // -44.6
  const inMaxX = LUMBINI_SACRED_POND.innerMaxX - LUMBINI_SACRED_POND.centerX; // +44.6
  const inMinZ = LUMBINI_SACRED_POND.innerMinZ - LUMBINI_SACRED_POND.centerZ; // -44.6
  const inMaxZ = LUMBINI_SACRED_POND.innerMaxZ - LUMBINI_SACRED_POND.centerZ; // +52.6

  const outMinX = LUMBINI_SACRED_POND.outerMinX - LUMBINI_SACRED_POND.centerX; // -50.0
  const outMaxX = LUMBINI_SACRED_POND.outerMaxX - LUMBINI_SACRED_POND.centerX; // +50.0
  const outMinZ = LUMBINI_SACRED_POND.outerMinZ - LUMBINI_SACRED_POND.centerZ; // -52.0
  const outMaxZ = LUMBINI_SACRED_POND.outerMaxZ - LUMBINI_SACRED_POND.centerZ; // +60.0

  // 1. Dark underwater stone pond bed (ly = -1.03 -> world -0.78m)
  const bedMat = new THREE.MeshStandardMaterial({ color: 0x132426, roughness: 0.92, metalness: 0.02 });
  const addBedSlab = (x0: number, x1: number, z0: number, z1: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.14, z1 - z0), bedMat);
    m.position.set((x0 + x1) * 0.5, -1.03, (z0 + z1) * 0.5);
    m.receiveShadow = true;
    m.userData.nonCollidable = true;
    g.add(m);
  };
  addBedSlab(outMinX - 0.4, outMaxX + 0.4, outMinZ - 0.4, inMinZ + 0.4);
  addBedSlab(outMinX - 0.4, outMaxX + 0.4, inMaxZ - 0.4, outMaxZ + 0.4);
  addBedSlab(outMinX - 0.4, inMinX + 0.4, inMinZ, inMaxZ);
  addBedSlab(inMaxX - 0.4, outMaxX + 0.4, inMinZ, inMaxZ);

  // 2. Stepped terracotta & Chunar sandstone ghat retaining ledges (inner island skirt + outer pond walls)
  const addBankWall = (x0: number, x1: number, z0: number, z1: number, topY: number, botY: number, mat: THREE.Material) => {
    const sx = x1 - x0;
    const sz = z1 - z0;
    if (sx <= 0.05 || sz <= 0.05) return;
    const h = topY - botY;
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, h, sz), mat);
    m.position.set((x0 + x1) * 0.5, botY + h * 0.5, (z0 + z1) * 0.5);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  };

  // Inner island ghat skirt (split cleanly around cardinal gates/bridges & corners)
  // South & North inner banks (skip bridge mouth |ldx| <= 3.4)
  for (const [z0, z1] of [[inMaxZ - 0.65, inMaxZ + 0.15], [inMinZ - 0.15, inMinZ + 0.65]] as Array<[number, number]>) {
    addBankWall(inMinX, -3.4, z0, z1, 0.08, -1.02, brickMat);
    addBankWall(3.4, inMaxX, z0, z1, 0.08, -1.02, brickMat);
    addBankWall(inMinX, -3.4, z0 - 0.28, z1 + 0.28, -0.28, -1.02, brickMat);
    addBankWall(3.4, inMaxX, z0 - 0.28, z1 + 0.28, -0.28, -1.02, brickMat);
  }
  // West & East inner banks (trimmed clear of N/S bank corners; skip bridge mouth ldz in [1.2, 6.8])
  for (const [x0, x1] of [[inMinX - 0.15, inMinX + 0.65], [inMaxX - 0.65, inMaxX + 0.15]] as Array<[number, number]>) {
    addBankWall(x0, x1, inMinZ + 0.654, 1.2, 0.08, -1.02, brickMat);
    addBankWall(x0, x1, 6.8, inMaxZ - 0.654, 0.08, -1.02, brickMat);
    addBankWall(x0 - 0.28, x1 + 0.28, inMinZ + 0.934, 1.2, -0.28, -1.02, brickMat);
    addBankWall(x0 - 0.28, x1 + 0.28, 6.8, inMaxZ - 0.934, -0.28, -1.02, brickMat);
  }

  // Outer pond retaining wall + stepped submerged ghat ledge + Chunar sandstone coping
  for (const [z0, z1] of [[outMaxZ - 0.1, outMaxZ + 0.55], [outMinZ - 0.55, outMinZ + 0.1]] as Array<[number, number]>) {
    addBankWall(outMinX - 0.55, -3.4, z0, z1, 0.09, -1.02, chunarMat);
    addBankWall(3.4, outMaxX + 0.55, z0, z1, 0.09, -1.02, chunarMat);
    const stepZ0 = z0 > 0 ? z0 - 0.6 : z1;
    const stepZ1 = z0 > 0 ? z0 : z1 + 0.6;
    addBankWall(outMinX, -3.4, stepZ0, stepZ1, -0.28, -1.02, brickMat);
    addBankWall(3.4, outMaxX, stepZ0, stepZ1, -0.28, -1.02, brickMat);
  }
  for (const [x0, x1] of [[outMinX - 0.55, outMinX + 0.1], [outMaxX - 0.1, outMaxX + 0.55]] as Array<[number, number]>) {
    addBankWall(x0, x1, outMinZ + 0.104, 1.2, 0.09, -1.02, chunarMat);
    addBankWall(x0, x1, 6.8, outMaxZ - 0.104, 0.09, -1.02, chunarMat);
    const stepX0 = x0 < 0 ? x1 : x0 - 0.6;
    const stepX1 = x0 < 0 ? x1 + 0.6 : x0;
    addBankWall(stepX0, stepX1, outMinZ + 0.604, 1.2, -0.28, -1.02, brickMat);
    addBankWall(stepX0, stepX1, 6.8, outMaxZ - 0.604, -0.28, -1.02, brickMat);
  }

  // 3. Outer Sacred Pond Pilgrim Promenades (top at ly = +0.09 -> world +0.34m)
  const addPromenadeWalk = (x0: number, x1: number, z0: number, z1: number) => {
    const sx = x1 - x0;
    const sz = z1 - z0;
    const walk = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.22, sz), terracottaMat);
    walk.position.set((x0 + x1) * 0.5, -0.02, (z0 + z1) * 0.5);
    walk.receiveShadow = true;
    g.add(walk);
  };
  addPromenadeWalk(-51.2, 50.7, 60.2, 63.6); // South outer pilgrim trail
  addPromenadeWalk(-51.2, 50.7, -55.6, -52.2); // North outer pilgrim trail
  addPromenadeWalk(-51.2, -50.0, -52.2, 60.2); // West outer coping walk
  addPromenadeWalk(50.0, 50.7, -52.2, 60.2); // East outer coping trim

  // Outer Chunar sandstone curb border rails along South & North outer trails (flush non-blocking)
  for (const cz of [60.28, 63.52, -52.28, -55.52]) {
    const curb = new THREE.Mesh(new THREE.BoxGeometry(101.9, 0.16, 0.22), chunarMat);
    curb.position.set(-0.25, 0.015, cz);
    curb.receiveShadow = true;
    curb.userData.nonCollidable = true;
    g.add(curb);
  }

  // 4. Single Combined Real-Time Planar Reflector Water Surface across all 4 surrounding pond channels
  const waterPositions: number[] = [];
  const waterUvs: number[] = [];
  const waterIndices: number[] = [];
  appendWaterChannelStrip(waterPositions, waterUvs, waterIndices, outMinX, outMaxX, outMinZ, inMinZ, 32, 4);
  appendWaterChannelStrip(waterPositions, waterUvs, waterIndices, outMinX, outMaxX, inMaxZ, outMaxZ, 32, 4);
  appendWaterChannelStrip(waterPositions, waterUvs, waterIndices, outMinX, inMinX, inMinZ, inMaxZ, 4, 32);
  appendWaterChannelStrip(waterPositions, waterUvs, waterIndices, inMaxX, outMaxX, inMinZ, inMaxZ, 4, 32);

  const waterGeo = new THREE.BufferGeometry();
  waterGeo.setAttribute('position', new THREE.Float32BufferAttribute(waterPositions, 3));
  waterGeo.setAttribute('uv', new THREE.Float32BufferAttribute(waterUvs, 2));
  waterGeo.setIndex(waterIndices);
  waterGeo.computeVertexNormals();

  const surroundingWater = createReflectivePondSurface(waterGeo, {
    isSoftwareGl,
    textureSize: isSoftwareGl ? 256 : 512,
    deepTint: 0x08272b,
    shallowTint: 0x1c5c5a,
    reflectivity: 0.78,
    rippleStrength: 0.018,
    anchorWorldPos: new THREE.Vector3(-210, LUMBINI_SACRED_POND.waterLevel, 96),
  });
  surroundingWater.rotation.x = -Math.PI / 2;
  surroundingWater.position.y = -0.22; // world y = +0.03m
  surroundingWater.userData.nonCollidable = true;
  g.add(surroundingWater);

  // 5. Four Arched Pilgrim Causeway Bridges spanning South, North, East & West Pond Channels
  const buildCausewayBridge = (
    axis: 'z' | 'x',
    cx: number,
    cz: number,
    spanLen: number,
    width: number,
  ) => {
    const bg = new THREE.Group();
    bg.position.set(cx, 0, cz);
    const segs = 10;
    const segLen = spanLen / segs;
    const baseDeckY = LUMBINI_SACRED_POND.bridgeBaseY - 0.25; // +0.10 local (+0.35 world)
    const archLift = LUMBINI_SACRED_POND.bridgeArchLift; // +0.26

    for (let i = 0; i < segs; i++) {
      const t = (i + 0.5) / segs;
      const u = (t - 0.5) * spanLen;
      const lift = Math.sin(t * Math.PI) * archLift;
      const slope = Math.cos(t * Math.PI) * (Math.PI / spanLen) * archLift;
      const deckY = baseDeckY + lift;

      const slabW = axis === 'z' ? width - 0.5 : segLen + 0.08;
      const slabD = axis === 'z' ? segLen + 0.08 : width - 0.5;
      const deckSlab = new THREE.Mesh(new THREE.BoxGeometry(slabW, 0.26, slabD), terracottaMat);
      deckSlab.position.set(axis === 'x' ? u : 0, deckY - 0.13, axis === 'z' ? u : 0);
      if (axis === 'z') deckSlab.rotation.x = -slope;
      else deckSlab.rotation.z = slope;
      deckSlab.receiveShadow = true;
      deckSlab.castShadow = true;
      bg.add(deckSlab);

      // Chunar sandstone arched side fascia stringers
      for (const side of [-1, 1]) {
        const edgeOff = side * (width * 0.5 - 0.18);
        const trimW = axis === 'z' ? 0.34 : segLen + 0.08;
        const trimD = axis === 'z' ? segLen + 0.08 : 0.34;
        const fascia = new THREE.Mesh(new THREE.BoxGeometry(trimW, 0.44, trimD), chunarMat);
        fascia.position.set(axis === 'x' ? u : edgeOff, deckY - 0.14, axis === 'z' ? u : edgeOff);
        if (axis === 'z') fascia.rotation.x = -slope;
        else fascia.rotation.z = slope;
        fascia.castShadow = true;
        fascia.receiveShadow = true;
        bg.add(fascia);
      }
    }

    // Carved Chunar sandstone parapet balusters, handrails & brass lotus finials
    const postCount = 5;
    for (const side of [-1, 1]) {
      const edgeOff = side * (width * 0.5 - 0.18);
      for (let p = 0; p < postCount; p++) {
        const t = p / (postCount - 1);
        const u = (t - 0.5) * (spanLen - 0.7);
        const py = baseDeckY + Math.sin(t * Math.PI) * archLift;
        const isEnd = p === 0 || p === postCount - 1;
        const post = new THREE.Mesh(
          new THREE.BoxGeometry(isEnd ? 0.34 : 0.22, isEnd ? 0.96 : 0.78, isEnd ? 0.34 : 0.22),
          chunarMat,
        );
        post.position.set(axis === 'x' ? u : edgeOff, py + (isEnd ? 0.48 : 0.39), axis === 'z' ? u : edgeOff);
        post.castShadow = true;
        bg.add(post);

        const finial = new THREE.Mesh(new THREE.SphereGeometry(isEnd ? 0.11 : 0.075, 10, 8), goldMat);
        finial.position.set(
          axis === 'x' ? u : edgeOff,
          py + (isEnd ? 1.02 : 0.84),
          axis === 'z' ? u : edgeOff,
        );
        bg.add(finial);
      }

      // Top parapet handrail segments connecting posts
      for (let s = 0; s < 6; s++) {
        const t = (s + 0.5) / 6;
        const u = (t - 0.5) * (spanLen - 0.7);
        const segL = (spanLen - 0.7) / 6 + 0.06;
        const py = baseDeckY + Math.sin(t * Math.PI) * archLift + 0.76;
        const slope = Math.cos(t * Math.PI) * (Math.PI / spanLen) * archLift;
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(axis === 'z' ? 0.16 : segL, 0.10, axis === 'z' ? segL : 0.16),
          chunarMat,
        );
        rail.position.set(axis === 'x' ? u : edgeOff, py, axis === 'z' ? u : edgeOff);
        if (axis === 'z') rail.rotation.x = -slope;
        else rail.rotation.z = slope;
        rail.castShadow = true;
        bg.add(rail);
      }
    }

    // Twin underwater masonry bridge support piers flanking center arch
    for (const uOff of [-spanLen * 0.26, spanLen * 0.26]) {
      const pier = new THREE.Mesh(
        new THREE.BoxGeometry(axis === 'z' ? width - 0.3 : 0.65, 1.15, axis === 'z' ? 0.65 : width - 0.3),
        brickMat,
      );
      pier.position.set(axis === 'x' ? uOff : 0, -0.52, axis === 'z' ? uOff : 0);
      pier.receiveShadow = true;
      bg.add(pier);
    }

    g.add(bg);
  };

  buildCausewayBridge('z', 0, 56.3, 8.6, 6.8); // South Sacred Bridge (ldz 52.0..60.6)
  buildCausewayBridge('z', 0, -48.3, 8.6, 6.8); // North Sacred Bridge (ldz -52.6..-44.0)
  buildCausewayBridge('x', 47.3, 4.0, 6.6, 5.6); // East Sacred Bridge (ldx 44.0..50.6)
  buildCausewayBridge('x', -47.3, 4.0, 6.6, 5.6); // West Sacred Bridge (ldx -50.6..-44.0)

  // 6. Eight Stone Bridge Abutment Piers emerging from the pond for the 8 cardinal roadside lanterns
  const pierCoords: Array<[number, number]> = [
    [3.8, 55.0],
    [-3.8, 55.0],
    [3.8, -48.0],
    [-3.8, -48.0],
    [47.5, 0.4],
    [47.5, 7.6],
    [-50.2, 0.4],
    [-50.2, 7.6],
  ];
  for (const [px, pz] of pierCoords) {
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.06, 1.18), brickMat);
    base.position.set(px, -0.50, pz);
    base.castShadow = true;
    base.receiveShadow = true;
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.14, 1.06), chunarMat);
    cap.position.set(px, 0.02, pz); // top at +0.09 local (+0.34 world)
    cap.castShadow = true;
    cap.receiveShadow = true;
    g.add(base, cap);
  }

  // 7. Procedural Floating Lotus Pads & Blossoms in calm sheltered pond colonies (away from bridges & walls)
  const surroundingLotuses = generateLumbiniPondLotusPlacements().filter(
    (p) => p.pond === 'surrounding',
  );
  const surroundingFlora = buildProceduralLotusInstancedGarden(
    surroundingLotuses,
    LUMBINI_SACRED_POND.centerX,
    LUMBINI_SACRED_POND.centerZ,
    -0.22,
  );
  g.add(surroundingFlora);
  g.userData.lotusCount = surroundingLotuses.length;

  // 8. Decorative Bronze Kalash Boundary Lamps at outer South & North Promenade corners
  for (const [bx, bz] of [[-50.5, 62.9], [50.2, 62.9], [-50.5, -54.9], [50.2, -54.9]] as Array<[number, number]>) {
    const ped = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.46, 0.56), chunarMat);
    ped.position.set(bx, 0.32, bz);
    ped.castShadow = true;
    const pot = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), bronzeMat);
    pot.position.set(bx, 0.68, bz);
    g.add(ped, pot);
  }

  return g;
}


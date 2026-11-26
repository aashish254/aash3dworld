import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  createDetailedBrassSukundaDiyo,
  createDetailedGajurSpire,
  createRectangularHipRoofGeometry,
} from './janakiMandirCraft';
import {
  BuddhaMaterials,
  createBotanicalLotusTextures,
  createMonumentalSeatedBuddha,
  createRoundedSpoonLotusPetalGeo,
} from './lumbiniBuddhaSculpt';
import { createTaperedLimbGeometry } from './mayaDeviSculptureGeo';
import {
  buildDetailedExcavatedBrickRuin,
  buildDetailedLumbiniBollards,
  buildDetailedPeaceLantern,
  getLumbiniGardenCraftMaterials,
} from './lumbiniGardenCraft';
import {
  buildMuseumCausewayBridge,
  buildMuseumToranaGate,
} from './lumbiniBridgeAndToranaCraft';
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
  const segs = 28;
  const rings = 4;
  const gapHalf = 0.16;
  const startAng = gapHalf;
  const sweep = Math.PI * 2 - gapHalf * 2;

  const positions: number[] = [0, 0.002, 0];
  const uvs: number[] = [0.5, 0.5];
  const indices: number[] = [];

  for (let r = 1; r <= rings; r++) {
    const radialT = r / rings;
    const y = r === 1 ? -0.004 : r === 2 ? 0.001 : r === 3 ? 0.008 : 0.022;
    for (let s = 0; s <= segs; s++) {
      const ang = startAng + (s / segs) * sweep;
      const wave = r === rings ? Math.sin(ang * 6.0) * 0.004 : 0;
      const rad = radialT * (r === rings ? 1.0 + Math.sin(ang * 7.0) * 0.028 : 1.0);
      positions.push(Math.cos(ang) * rad, y + wave, Math.sin(ang) * rad);
      uvs.push(0.5 + Math.cos(ang) * radialT * 0.5, 0.5 + Math.sin(ang) * radialT * 0.5);
    }
  }

  const ringStride = segs + 1;
  for (let s = 0; s < segs; s++) {
    indices.push(0, 1 + s + 1, 1 + s);
  }
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

function createLotusBloomRingGeometry(mode: 'outer' | 'inner'): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const baseSpoon = createRoundedSpoonLotusPetalGeo(0.095, 0.168, 0.032);
  const pushPetal = (g: THREE.BufferGeometry, ry: number, rx: number, rOff: number, yOff: number) => {
    const ni = g.index ? g.toNonIndexed() : g.clone();
    ni.rotateX(rx);
    ni.rotateY(ry);
    ni.translate(Math.sin(ry) * rOff, yOff, Math.cos(ry) * rOff);
    parts.push(ni);
    g.dispose();
  };

  if (mode === 'outer') {
    const count = 10;
    for (let i = 0; i < count; i++) {
      const az = (i / count) * Math.PI * 2;
      const p = baseSpoon.clone();
      p.scale(1.06, 1.0, 1.0);
      pushPetal(p, az, 1.04 + (i % 2) * 0.08, 0.038, 0.010);
    }
  } else {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const az = ((i + 0.5) / count) * Math.PI * 2;
      const p = baseSpoon.clone();
      p.scale(0.84, 0.88, 0.88);
      pushPetal(p, az, 0.56 + (i % 2) * 0.08, 0.026, 0.018);
    }
  }
  baseSpoon.dispose();
  const merged = mergeGeometries(parts, false)!;
  parts.forEach((g) => g.dispose());
  return merged;
}

function createLotusSeedPodGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const pod = new THREE.CylinderGeometry(0.044, 0.018, 0.052, 12).toNonIndexed();
  pod.translate(0, 0.052, 0);
  parts.push(pod);
  for (let s = 0; s < 14; s++) {
    const sa = (s / 14) * Math.PI * 2;
    const st = new THREE.CylinderGeometry(0.0032, 0.0024, 0.040, 4).toNonIndexed();
    st.rotateX(0.32);
    st.rotateY(sa);
    st.translate(Math.sin(sa) * 0.044, 0.058, Math.cos(sa) * 0.044);
    parts.push(st);
  }
  const merged = mergeGeometries(parts, false)!;
  parts.forEach((p) => p.dispose());
  return merged;
}

function createLotusBudGeometry(): THREE.BufferGeometry {
  const budPts = [
    new THREE.Vector2(0.008, 0.0),
    new THREE.Vector2(0.014, 0.060),
    new THREE.Vector2(0.054, 0.115),
    new THREE.Vector2(0.058, 0.168),
    new THREE.Vector2(0.036, 0.222),
    new THREE.Vector2(0.0, 0.258),
  ];
  return new THREE.LatheGeometry(budPts, 14);
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

let cachedBotanicalLotusTex: {
  petalMap: THREE.CanvasTexture | null;
  padMap: THREE.CanvasTexture | null;
} | null = null;

function getSharedBotanicalLotusTex() {
  if (!cachedBotanicalLotusTex) {
    cachedBotanicalLotusTex = createBotanicalLotusTextures();
  }
  return cachedBotanicalLotusTex;
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
  const lotusTex = getSharedBotanicalLotusTex();

  const padMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: lotusTex.padMap ?? undefined,
    roughness: 0.42,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });
  applyLotusFloatWaveShader(padMat, 0.008);

  const outerPetalMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: lotusTex.petalMap ?? undefined,
    roughness: 0.34,
    metalness: 0.03,
    side: THREE.DoubleSide,
  });
  applyLotusFloatWaveShader(outerPetalMat, 0.010);

  const innerPetalMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: lotusTex.petalMap ?? undefined,
    roughness: 0.30,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });
  applyLotusFloatWaveShader(innerPetalMat, 0.011);

  const podMat = new THREE.MeshStandardMaterial({
    color: 0xf5cb4c,
    emissive: 0x4b3105,
    emissiveIntensity: 0.28,
    roughness: 0.36,
    metalness: 0.12,
  });
  applyLotusFloatWaveShader(podMat, 0.011);

  const budMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: lotusTex.petalMap ?? undefined,
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

  // Stepped brick & Chunar sandstone fenced enclosure (3.9m x 3.9m)
  const brickBase = new THREE.Mesh(new THREE.BoxGeometry(3.92, 0.28, 3.92), brickMat);
  brickBase.position.y = 0.14;
  brickBase.castShadow = true;
  brickBase.receiveShadow = true;

  const stoneDeck = new THREE.Mesh(new THREE.BoxGeometry(3.32, 0.18, 3.32), stoneMat);
  stoneDeck.position.y = 0.37;
  stoneDeck.castShadow = true;
  stoneDeck.receiveShadow = true;
  const innerCurb = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.10, 2.04), brickMat);
  innerCurb.position.y = 0.49;
  innerCurb.receiveShadow = true;
  g.add(brickBase, stoneDeck, innerCurb);

  // Turned brass Kalash urn finials & octagonal chamfered fence corner posts
  const fenceUrnGeo = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.075, 0.0),
      new THREE.Vector2(0.055, 0.03),
      new THREE.Vector2(0.088, 0.075),
      new THREE.Vector2(0.042, 0.125),
      new THREE.Vector2(0.056, 0.155),
      new THREE.Vector2(0.014, 0.21),
      new THREE.Vector2(0.0, 0.24),
    ],
    14,
  );
  for (const sx of [-1.70, 1.70]) {
    for (const sz of [-1.70, 1.70]) {
      const pFoot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.24), stoneMat);
      pFoot.position.set(sx, 0.34, sz);
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.86, 0.16), stoneMat);
      post.position.set(sx, 0.82, sz);
      post.castShadow = true;
      const pCap = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.22), stoneMat);
      pCap.position.set(sx, 1.26, sz);
      const cap = new THREE.Mesh(fenceUrnGeo, brassMat);
      cap.position.set(sx, 1.30, sz);
      g.add(pFoot, post, pCap, cap);
    }
  }
  const railGeoX = new THREE.BoxGeometry(3.40, 0.058, 0.058);
  const railGeoZ = new THREE.BoxGeometry(0.058, 0.058, 3.40);
  for (const ry of [0.58, 1.12]) {
    for (const side of [-1.70, 1.70]) {
      const rx = new THREE.Mesh(railGeoX, brassMat);
      rx.position.set(0, ry, side);
      const rz = new THREE.Mesh(railGeoZ, brassMat);
      rz.position.set(side, ry, 0);
      g.add(rx, rz);
    }
  }
  const picketCoords: Array<[number, number]> = [];
  for (let i = -4; i <= 4; i++) {
    picketCoords.push([i * 0.34, -1.70], [i * 0.34, 1.70], [-1.70, i * 0.34], [1.70, i * 0.34]);
  }
  const picketGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.58, 8);
  const pickets = new THREE.InstancedMesh(picketGeo, brassMat, picketCoords.length);
  picketCoords.forEach(([px, pz], idx) => {
    _v3.set(px, 0.85, pz);
    _q.identity();
    _s.setScalar(1);
    _m4.compose(_v3, _q, _s);
    pickets.setMatrixAt(idx, _m4);
  });
  pickets.instanceMatrix.needsUpdate = true;
  pickets.computeBoundingSphere();
  g.add(pickets);

  // Pillar stepped Mauryan plinth with carved chamfer & Brahmi Edict engraving
  const pedLower = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.22, 1.74), stoneMat);
  pedLower.position.y = 0.58;
  pedLower.castShadow = true;
  const pedSquare = new THREE.Mesh(new THREE.BoxGeometry(1.50, 0.32, 1.50), stoneMat);
  pedSquare.position.y = 0.82;
  pedSquare.castShadow = true;
  const pedTop = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.10, 1.26), stoneMat);
  pedTop.position.y = 1.00;
  const shaftCollarGeo = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.58, 0.0),
      new THREE.Vector2(0.56, 0.06),
      new THREE.Vector2(0.51, 0.12),
      new THREE.Vector2(0.47, 0.18),
      new THREE.Vector2(0.0, 0.18),
    ],
    28,
  );
  const shaftCollar = new THREE.Mesh(shaftCollarGeo, stoneMat);
  shaftCollar.position.y = 1.05;

  const edictMat = new THREE.MeshStandardMaterial({
    map: edictMap,
    normalMap: edictNormal,
    normalScale: new THREE.Vector2(1.0, 1.0),
    roughness: 0.72,
  });
  const edictEastFrame = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.78), brassMat);
  edictEastFrame.position.set(0.755, 0.82, 0);
  const edictEast = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.22, 0.70), edictMat);
  edictEast.position.set(0.76, 0.82, 0);
  const edictSouthFrame = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.28, 0.04), brassMat);
  edictSouthFrame.position.set(0, 0.82, 0.755);
  const edictSouth = new THREE.Mesh(new THREE.BoxGeometry(0.70, 0.22, 0.055), edictMat);
  edictSouth.position.set(0, 0.82, 0.76);
  g.add(pedLower, pedSquare, pedTop, shaftCollar, edictEastFrame, edictEast, edictSouthFrame, edictSouth);

  // Monolithic tapered Chunar sandstone shaft (6.05m above Mauryan collar)
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.47, 6.05, 32), stoneMat);
  shaft.position.y = 4.22;
  shaft.castShadow = true;
  shaft.receiveShadow = true;
  g.add(shaft);

  // Subtle horizontal Mauryan masonry stress hairline grooves & Brahmi inscription panel
  const shaftEdict = new THREE.Mesh(
    new THREE.CylinderGeometry(0.456, 0.464, 0.76, 28, 1, true, -0.58, 1.16),
    edictMat,
  );
  shaftEdict.position.y = 2.32;
  g.add(shaftEdict);

  // Historic conservation bronze/iron structural clamp bands with bolted side lugs & forged rivets
  for (const cy of [3.35, 5.20, 6.75]) {
    const rad = THREE.MathUtils.lerp(0.47, 0.35, (cy - 1.19) / 6.05) + 0.015;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, 0.09, 28, 1, true), ironMat);
    band.position.y = cy;
    g.add(band);
    for (const lx of [-1, 1]) {
      const flange = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.11, 0.06), ironMat);
      flange.position.set(lx * (rad + 0.015), cy, 0);
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.09, 6), brassMat);
      bolt.rotation.x = Math.PI / 2;
      bolt.position.set(lx * (rad + 0.022), cy, 0);
      g.add(flange, bolt);
    }
    for (let rv = 0; rv < 8; rv++) {
      const ra = (rv / 8) * Math.PI * 2 + 0.39;
      const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 6), brassMat);
      rivet.position.set(Math.cos(ra) * (rad + 0.008), cy, Math.sin(ra) * (rad + 0.008));
      g.add(rivet);
    }
  }

  // Authentic weathered Mauryan Chunar sandstone stepped/fractured crown with flush bronze weather band (not a black iron mushroom cap)
  const neckRing = new THREE.Mesh(new THREE.TorusGeometry(0.355, 0.026, 10, 28), stoneMat);
  neckRing.rotation.x = Math.PI / 2;
  neckRing.position.y = 7.23;
  const bellCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.37, 0.18, 28), stoneMat);
  bellCollar.position.y = 7.34;
  bellCollar.castShadow = true;
  const bronzeSealBand = new THREE.Mesh(new THREE.CylinderGeometry(0.315, 0.32, 0.045, 28), brassMat);
  bronzeSealBand.position.y = 7.45;
  const fracturedCrown1 = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.31, 0.16, 18), stoneMat);
  fracturedCrown1.position.y = 7.54;
  fracturedCrown1.castShadow = true;
  const fracturedCrown2 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 0.14, 14), stoneMat);
  fracturedCrown2.position.set(0.02, 7.68, -0.01);
  fracturedCrown2.rotation.z = 0.08;
  fracturedCrown2.castShadow = true;
  const weatheredTip = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16, 1), stoneMat);
  weatheredTip.scale.set(1.05, 0.52, 0.95);
  weatheredTip.position.set(0.02, 7.75, -0.01);
  g.add(neckRing, bellCollar, bronzeSealBand, fracturedCrown1, fracturedCrown2, weatheredTip);

  g.userData.cameraOccluderMeshes = [brickBase, stoneDeck, pedSquare, shaft];

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

  // Flush inset Chunar sandstone ritual ghat stair treads centered on North & South pond banks
  for (const dir of [-1, 1]) {
    const zEdge = dir * (waterD * 0.5 + 0.38);
    for (let st = 0; st < 3; st++) {
      const tread = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.14, 0.56), chunarMat);
      tread.position.set(0, 0.16 - st * 0.16, zEdge - dir * (st * 0.48));
      tread.receiveShadow = true;
      g.add(tread);
    }
    for (const sx of [-2.02, 2.02]) {
      const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 1.38), chunarMat);
      cheek.position.set(sx, 0.15, zEdge - dir * 0.22);
      cheek.castShadow = true;
      cheek.receiveShadow = true;
      g.add(cheek);
    }
  }

  // Real-time planar mirror-reflective sacred water surface (y = -0.14 in local = +0.21 world)
  g.userData.waterTimeUniform = REFLECTIVE_WATER_ENV_UNIFORMS.uWaterTime;
  const waterMesh = createReflectivePondSurface(new THREE.PlaneGeometry(waterW, waterD, 24, 16), {
    isSoftwareGl,
    textureSize: isSoftwareGl ? 128 : 512,
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

  // Wide white marble base terrace (8.8m x 8.8m) + stepped front ceremonial stairs (+Z)
  const base1 = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.38, 8.8), whiteMarbleMat);
  base1.position.y = 0.19;
  base1.castShadow = true;
  base1.receiveShadow = true;
  const base2 = new THREE.Mesh(new THREE.BoxGeometry(7.7, 0.36, 7.7), whiteMarbleMat);
  base2.position.y = 0.56;
  base2.castShadow = true;
  base2.receiveShadow = true;
  const baseTrim = new THREE.Mesh(new THREE.BoxGeometry(7.82, 0.07, 7.82), goldMat);
  baseTrim.position.y = 0.715;
  g.add(base1, base2, baseTrim);

  // Front marble entry steps (+Z) flanked by gilded Thai stair rails
  for (let st = 0; st < 3; st++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.24, 0.56), whiteMarbleMat);
    step.position.set(0, 0.12 + st * 0.22, 4.78 - st * 0.44);
    step.receiveShadow = true;
    g.add(step);
  }
  for (const sx of [-1.86, 1.86]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.54, 1.38), whiteMarbleMat);
    rail.position.set(sx, 0.48, 4.34);
    rail.rotation.x = 0.36;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), goldMat);
    cap.position.set(sx, 0.62, 5.02);
    g.add(rail, cap);
  }

  // Tall Thai marble colonnade (shafts y=0.74..6.16 -> 5.42m tall) clearing Buddha crown & halo cleanly!
  const colSpecs: Array<[number, number]> = [
    [-3.15, -3.15],
    [0, -3.15],
    [3.15, -3.15],
    [-3.15, 0],
    [3.15, 0],
    [-3.15, 3.15],
    [3.15, 3.15],
  ];
  for (const [sx, sz] of colSpecs) {
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.32, 0.58), whiteMarbleMat);
    plinth.position.set(sx, 0.90, sz);
    const baseRing = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.04, 8, 16), goldMat);
    baseRing.rotation.x = Math.PI / 2;
    baseRing.position.set(sx, 1.07, sz);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.23, 5.04, 18), whiteMarbleMat);
    col.position.set(sx, 3.58, sz);
    col.castShadow = true;
    const midBand = new THREE.Mesh(new THREE.TorusGeometry(0.215, 0.028, 6, 16), goldMat);
    midBand.rotation.x = Math.PI / 2;
    midBand.position.set(sx, 3.6, sz);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.20, 0.36, 16), goldMat);
    cap.position.set(sx, 6.26, sz);
    g.add(plinth, baseRing, col, midBand, cap);
  }

  // Perimeter cornice architrave beams + coffered soffit ceiling + gilded Thai Khan Thuai eave brackets
  for (const sz of [-3.15, 3.15]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.26, 0.44), whiteMarbleMat);
    beam.position.set(0, 6.38, sz);
    g.add(beam);
  }
  for (const sx of [-3.15, 3.15]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.26, 6.4), whiteMarbleMat);
    beam.position.set(sx, 6.38, 0);
    g.add(beam);
  }
  // Recessed white-marble & gold coffered soffit ceiling closing roof underside cleanly (zero clipping!)
  const soffitOuter = new THREE.Mesh(new THREE.BoxGeometry(6.62, 0.06, 6.62), whiteMarbleMat);
  soffitOuter.position.y = 6.53;
  const soffitFrame = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.03, 4.4), goldMat);
  soffitFrame.position.y = 6.495;
  const soffitInner = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.035, 4.0), crimsonMat);
  soffitInner.position.y = 6.49;
  const soffitMandala = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.04, 24), goldMat);
  soffitMandala.position.y = 6.485;
  g.add(soffitOuter, soffitFrame, soffitInner, soffitMandala);

  // Diagonal gilded Thai Khan Thuai eave struts under the architraves
  for (const [sx, sz] of colSpecs) {
    if (sx === 0 || sz === 0) {
      const ang = Math.atan2(sx, sz);
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.62, 0.14), goldMat);
      strut.position.set(sx * 1.07, 6.18, sz * 1.07);
      strut.rotation.y = ang;
      strut.rotation.x = -0.58;
      g.add(strut);
    }
  }

  // Sweeping Multi-Tiered White & Gold Thai Chofah Roofs stacked strictly without slope clipping (above 6.56m soffit)
  const chofahCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.06, 0.28, 0),
    new THREE.Vector3(0.22, 0.56, 0),
    new THREE.Vector3(0.14, 0.78, 0),
  ]);
  const chofahGeo = createTaperedLimbGeometry(
    chofahCurve,
    (t) => THREE.MathUtils.lerp(0.078, 0.014, t),
    12,
    8,
  );

  for (const [tier, rw, rh, ry] of [
    [0, 8.9, 1.36, 6.58],
    [1, 6.55, 1.24, 7.94],
    [2, 4.15, 1.16, 9.18],
  ] as Array<[number, number, number, number]>) {
    const trim = new THREE.Mesh(new THREE.BoxGeometry(rw + 0.14, 0.10, rw + 0.14), goldMat);
    trim.position.y = ry + 0.05;
    const roof = new THREE.Mesh(createRectangularHipRoofGeometry(rw, rh, rw, 0.62), whiteMarbleMat);
    roof.position.y = ry + 0.08 + rh * 0.5;
    roof.castShadow = true;
    const ridgeBand = new THREE.Mesh(new THREE.BoxGeometry(rw * 0.34, 0.09, rw * 0.34), goldMat);
    ridgeBand.position.y = ry + 0.08 + rh - 0.01;
    g.add(trim, roof, ridgeBand);

    // Sculpted curved golden Chofah sky-tassel finials at gable corners
    if (tier < 2) {
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const chofah = new THREE.Mesh(chofahGeo, goldMat);
          chofah.position.set(sx * (rw * 0.45), ry + 0.10, sz * (rw * 0.45));
          chofah.rotation.y = Math.atan2(sz, sx);
          g.add(chofah);
        }
      }
    }
  }
  const spire = createDetailedGajurSpire(goldMat, crimsonMat, 0.92);
  spire.position.y = 10.36;
  g.add(spire);

  // Monumental Golden Dhyana Buddha (scale 0.72 -> crown at ~4.60m, halo top ~5.23m, >1.20m clear headroom!)
  const buddha = createMonumentalSeatedBuddha(heroMats, {
    scale: 0.72,
    pose: 'dhyana',
    withNagaCanopy: false,
    withOfferingLamps: true,
    withAlmsBowl: true,
    crimsonThrone: true,
  });
  buddha.position.set(0, 0.74, 0);
  g.add(buddha);

  // Elevated forward sanctum canopy light (prevents harsh specular glare dot on chest)
  const light = new THREE.PointLight(0xffdfb0, 1.65, 16, 1.45);
  light.position.set(0, 5.88, 2.75);
  g.add(light);

  g.userData.cameraOccluderMeshes = [base1, base2, soffitOuter];

  return { group: g, light };
}

/**
 * Builds the Sacred Bodhi (Pipal) Tree Chautara platform beside Pushkarini Pond:
 * stepped octagonal brick & white stucco platform, gnarled root buttresses, saffron prayer scarf,
 * InstancedMesh botanical Bodhi foliage, and 5-color Buddhist prayer flag canopy.
 */
function createBodhiBarkTextures(): {
  map: THREE.CanvasTexture | null;
  normalMap: THREE.CanvasTexture | null;
} {
  if (typeof document === 'undefined') return { map: null, normalMap: null };
  const w = 256;
  const h = 256;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#6c5c4c';
  ctx.fillRect(0, 0, w, h);

  // Organic Ficus religiosa pale-grey-brown lenticel bark with twisted vertical fissures
  let seed = 419;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 620; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const len = 18 + rnd() * 56;
    const wid = 1.5 + rnd() * 3.5;
    const dark = rnd() > 0.45;
    ctx.strokeStyle = dark ? 'rgba(46, 36, 28, 0.42)' : 'rgba(148, 134, 114, 0.34)';
    ctx.lineWidth = wid;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + (rnd() - 0.5) * 14, y + len * 0.35, x + (rnd() - 0.5) * 14, y + len * 0.7, x + (rnd() - 0.5) * 8, y + len);
    ctx.stroke();
  }
  for (let i = 0; i < 160; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(84, 96, 56, 0.25)' : 'rgba(176, 162, 140, 0.22)';
    ctx.beginPath();
    ctx.ellipse(rnd() * w, rnd() * h, 3 + rnd() * 9, 2 + rnd() * 5, rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  const map = new THREE.CanvasTexture(c);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 4);
  map.colorSpace = THREE.SRGBColorSpace;

  const nc = document.createElement('canvas');
  nc.width = w;
  nc.height = h;
  const nctx = nc.getContext('2d')!;
  nctx.fillStyle = 'rgb(128,128,255)';
  nctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 380; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    nctx.strokeStyle = rnd() > 0.5 ? 'rgb(96,128,240)' : 'rgb(160,128,240)';
    nctx.lineWidth = 2 + rnd() * 3;
    nctx.beginPath();
    nctx.moveTo(x, y);
    nctx.lineTo(x + (rnd() - 0.5) * 10, y + 18 + rnd() * 36);
    nctx.stroke();
  }
  const normalMap = new THREE.CanvasTexture(nc);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(2, 4);
  return { map, normalMap };
}

/**
 * Builds the Sacred Bodhi (Pipal) Tree Chautara platform beside Pushkarini Pond:
 * stepped octagonal brick & white stucco platform, tapered gnarled buttress roots & Ficus bark,
 * fine heart-shaped botanical Pipal leaf canopy, saffron scarf, and perimeter prayer flags.
 */
export function buildSacredBodhiChautara(
  brickMat: THREE.Material,
  whiteStuccoMat: THREE.Material,
  _timberMat: THREE.Material,
  goldMat: THREE.Material,
  bronzeMat: THREE.Material,
  flameMat: THREE.Material,
): THREE.Group {
  const bodhi = new THREE.Group();

  const barkTex = createBodhiBarkTextures();
  const barkMat = new THREE.MeshStandardMaterial({
    map: barkTex.map ?? undefined,
    normalMap: barkTex.normalMap ?? undefined,
    normalScale: new THREE.Vector2(1.1, 1.1),
    color: 0x857462,
    roughness: 0.91,
    metalness: 0.02,
  });

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
    new THREE.MeshStandardMaterial({ color: 0x453526, roughness: 0.95 }),
  );
  soil.position.y = 0.72;
  bodhi.add(tier1, tier2, soil);

  // Solid inner gnarled Ficus heartwood core + outer tapered trunk + 6 muscular bark ribs (zero see-through center!)
  const corePts = [
    new THREE.Vector2(0.0, 0.66),
    new THREE.Vector2(0.62, 0.66),
    new THREE.Vector2(0.50, 1.25),
    new THREE.Vector2(0.45, 1.95),
    new THREE.Vector2(0.41, 2.75),
    new THREE.Vector2(0.35, 3.65),
    new THREE.Vector2(0.24, 4.35),
    new THREE.Vector2(0.0, 4.38),
  ];
  const trunkCore = new THREE.Mesh(new THREE.LatheGeometry(corePts, 18), barkMat);
  trunkCore.position.set(0.03, 0, 0.02);
  trunkCore.castShadow = true;
  trunkCore.receiveShadow = true;
  bodhi.add(trunkCore);

  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.68, 0),
    new THREE.Vector3(0.08, 1.85, 0.05),
    new THREE.Vector3(-0.06, 3.15, -0.03),
    new THREE.Vector3(0.03, 4.38, 0.02),
  ]);
  const trunk = new THREE.Mesh(
    createTaperedLimbGeometry(trunkCurve, (t) => THREE.MathUtils.lerp(0.56, 0.28, Math.pow(t, 0.75)), 20, 16),
    barkMat,
  );
  trunk.castShadow = true;
  bodhi.add(trunk);

  // Sculpted braided aerial roots & muscular fluted bark ribs hugging the solid trunk core
  const aerialMeshes: THREE.Mesh[] = [];
  for (let ar = 0; ar < 5; ar++) {
    const a0 = (ar / 5) * Math.PI * 2 + 0.25;
    const ac = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(a0) * 0.24, 3.65, Math.sin(a0) * 0.24),
      new THREE.Vector3(Math.cos(a0 + 0.36) * 0.40, 2.25, Math.sin(a0 + 0.36) * 0.40),
      new THREE.Vector3(Math.cos(a0 + 0.72) * 0.56, 0.73, Math.sin(a0 + 0.72) * 0.56),
    ]);
    const am = new THREE.Mesh(
      createTaperedLimbGeometry(ac, (t) => THREE.MathUtils.lerp(0.08, 0.14, t), 14, 9),
      barkMat,
    );
    am.castShadow = true;
    bodhi.add(am);
    aerialMeshes.push(am);
  }

  // Intricate pleated ceremonial saffron & gold-bordered sacred cloth sash tied tightly around the trunk
  const saffronMat = new THREE.MeshStandardMaterial({ color: 0xe37817, roughness: 0.68, metalness: 0.04 });
  const saffronGoldTrimMat = new THREE.MeshStandardMaterial({ color: 0xdfb13d, roughness: 0.36, metalness: 0.55 });
  const clothBandGeo = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.46, 0.0),
      new THREE.Vector2(0.535, 0.04),
      new THREE.Vector2(0.555, 0.09),
      new THREE.Vector2(0.525, 0.14),
      new THREE.Vector2(0.550, 0.19),
      new THREE.Vector2(0.515, 0.24),
      new THREE.Vector2(0.455, 0.27),
    ],
    28,
  );
  const clothBand = new THREE.Mesh(clothBandGeo, saffronMat);
  clothBand.position.set(0.055, 1.72, 0.038);
  clothBand.castShadow = true;
  bodhi.add(clothBand);
  for (const [ry, tiltX, tiltZ] of [
    [1.75, 0.05, -0.04],
    [1.96, -0.05, 0.04],
  ]) {
    const goldEdge = new THREE.Mesh(new THREE.TorusGeometry(0.532, 0.016, 8, 28), saffronGoldTrimMat);
    goldEdge.rotation.set(Math.PI / 2 + tiltX, 0, tiltZ);
    goldEdge.position.set(0.055, ry, 0.038);
    bodhi.add(goldEdge);
  }
  const knotMesh = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 10), saffronMat);
  knotMesh.scale.set(1.2, 0.9, 1.0);
  knotMesh.position.set(0.24, 1.84, 0.52);
  bodhi.add(knotMesh);
  for (const [offX, lenY, twist] of [
    [-0.06, 0.68, -0.14],
    [0.08, 0.54, 0.18],
  ]) {
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.22 + offX * 0.3, 1.80, 0.52),
      new THREE.Vector3(0.26 + offX, 1.48, 0.58),
      new THREE.Vector3(0.29 + offX * 1.4, 1.80 - lenY, 0.62 + twist * 0.15),
    ]);
    const tail = new THREE.Mesh(
      createTaperedLimbGeometry(tailCurve, (t) => THREE.MathUtils.lerp(0.055, 0.082, t), 10, 8),
      saffronMat,
    );
    tail.scale.set(1.0, 1.0, 0.42);
    tail.castShadow = true;
    bodhi.add(tail);
  }

  const diyo = createDetailedBrassSukundaDiyo(goldMat, bronzeMat, flameMat, 0.75, true);
  diyo.position.set(1.05, 0.74, 1.78);
  bodhi.add(diyo);

  // Tapered sprawling buttress roots gripping the soil bed
  for (let r = 0; r < 8; r++) {
    const a = (r / 8) * Math.PI * 2 + 0.18;
    const rc = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(a) * 0.26, 1.78, Math.sin(a) * 0.26),
      new THREE.Vector3(Math.cos(a + 0.08) * 0.74, 1.04, Math.sin(a + 0.08) * 0.74),
      new THREE.Vector3(Math.cos(a) * 1.52, 0.73, Math.sin(a) * 1.52),
    ]);
    const rm = new THREE.Mesh(
      createTaperedLimbGeometry(rc, (t) => THREE.MathUtils.lerp(0.19, 0.048, t), 12, 8),
      barkMat,
    );
    rm.castShadow = true;
    bodhi.add(rm);
  }

  // Primary, central apical, secondary & tertiary branches forming a connected Ficus canopy (zero floating sky leaves!)
  const branchEndpoints: THREE.Vector3[] = [];
  const flagAnchors: THREE.Vector3[] = [];

  // Central upright apical leader & upper crown boughs so crown top leaves grow cleanly from real branches
  const apicalCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.03, 4.18, 0.02),
    new THREE.Vector3(-0.04, 5.10, 0.05),
    new THREE.Vector3(0.05, 5.98, -0.02),
  ]);
  const apicalMesh = new THREE.Mesh(
    createTaperedLimbGeometry(apicalCurve, (t) => THREE.MathUtils.lerp(0.24, 0.075, t), 12, 9),
    barkMat,
  );
  apicalMesh.castShadow = true;
  bodhi.add(apicalMesh);
  for (let up = 0; up < 4; up++) {
    const ua = (up / 4) * Math.PI * 2 + 0.55;
    const uOrigin = apicalCurve.getPoint(0.45 + (up % 2) * 0.25);
    const uc = new THREE.CatmullRomCurve3([
      uOrigin,
      new THREE.Vector3(uOrigin.x + Math.cos(ua) * 0.78, uOrigin.y + 0.45, uOrigin.z + Math.sin(ua) * 0.78),
      new THREE.Vector3(uOrigin.x + Math.cos(ua) * 1.45, uOrigin.y + 0.72, uOrigin.z + Math.sin(ua) * 1.45),
    ]);
    const um = new THREE.Mesh(
      createTaperedLimbGeometry(uc, (t) => THREE.MathUtils.lerp(0.11, 0.028, t), 10, 7),
      barkMat,
    );
    um.castShadow = true;
    bodhi.add(um);
    branchEndpoints.push(uc.getPoint(0.45), uc.getPoint(0.75), uc.getPoint(1.0));
  }

  for (let b = 0; b < 6; b++) {
    const a = (b / 6) * Math.PI * 2 + 0.32;
    const reach = 2.65 + (b % 2) * 0.55;
    const topY = 5.45 + (b % 3) * 0.46;
    const bc = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.03, 3.65 + (b % 2) * 0.25, 0.02),
      new THREE.Vector3(Math.cos(a) * reach * 0.52, 4.62, Math.sin(a) * reach * 0.52),
      new THREE.Vector3(Math.cos(a) * reach, topY, Math.sin(a) * reach),
    ]);
    const bm = new THREE.Mesh(
      createTaperedLimbGeometry(bc, (t) => THREE.MathUtils.lerp(0.22, 0.055, t), 14, 9),
      barkMat,
    );
    bm.castShadow = true;
    bodhi.add(bm);

    const midPt = bc.getPoint(0.55);
    const tipPt = bc.getPoint(1.0);
    branchEndpoints.push(bc.getPoint(0.48), midPt, bc.getPoint(0.78), tipPt);
    flagAnchors.push(bc.getPoint(0.62));

    // Forking secondary & tertiary twigs bridging canopy gaps seamlessly
    for (const side of [-1, 1]) {
      const sa = a + side * 0.44;
      const twigReach = reach * 0.58;
      const sc = new THREE.CatmullRomCurve3([
        midPt,
        new THREE.Vector3(
          midPt.x + Math.cos(sa) * twigReach * 0.55,
          midPt.y + 0.54,
          midPt.z + Math.sin(sa) * twigReach * 0.55,
        ),
        new THREE.Vector3(
          midPt.x + Math.cos(sa) * twigReach,
          midPt.y + 0.92 + (b % 2) * 0.24,
          midPt.z + Math.sin(sa) * twigReach,
        ),
      ]);
      const tm = new THREE.Mesh(
        createTaperedLimbGeometry(sc, (t) => THREE.MathUtils.lerp(0.11, 0.028, t), 10, 7),
        barkMat,
      );
      tm.castShadow = true;
      bodhi.add(tm);
      const secMid = sc.getPoint(0.52);
      const secTip = sc.getPoint(1.0);
      branchEndpoints.push(secMid, sc.getPoint(0.78), secTip);

      // Tertiary fine fork upward toward canopy rim
      const ta = sa + side * 0.34;
      const tc = new THREE.CatmullRomCurve3([
        secMid,
        new THREE.Vector3(
          secMid.x + Math.cos(ta) * 0.55,
          secMid.y + 0.36,
          secMid.z + Math.sin(ta) * 0.55,
        ),
        new THREE.Vector3(
          secMid.x + Math.cos(ta) * 0.96,
          secMid.y + 0.58,
          secMid.z + Math.sin(ta) * 0.96,
        ),
      ]);
      const ttm = new THREE.Mesh(
        createTaperedLimbGeometry(tc, (t) => THREE.MathUtils.lerp(0.055, 0.018, t), 8, 6),
        barkMat,
      );
      ttm.castShadow = true;
      bodhi.add(ttm);
      branchEndpoints.push(tc.getPoint(0.55), tc.getPoint(1.0));
    }
  }

  let pipalClusterMap: THREE.CanvasTexture | null = null;
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 512, 512);
      // Draw a dense fine twig spray of 14 crisp heart-shaped Pipal leaves with midribs & lateral veins
      const leaves: Array<[number, number, number, number, string]> = [
        [256, 176, 0.0, 0.72, '#d5ecc0'],
        [184, 212, -0.64, 0.66, '#b7da96'],
        [328, 212, 0.64, 0.66, '#c1e1a0'],
        [142, 294, -0.95, 0.62, '#9fc77d'],
        [370, 294, 0.95, 0.62, '#a8ce86'],
        [214, 118, -0.35, 0.58, '#e3f4d0'],
        [298, 118, 0.35, 0.58, '#d9eeca'],
        [256, 266, 0.14, 0.68, '#b0d58e'],
        [194, 344, -0.45, 0.60, '#9ac178'],
        [318, 344, 0.45, 0.60, '#a2c980'],
        [256, 368, -0.08, 0.58, '#95bc73'],
        [128, 178, -0.82, 0.54, '#cbe6ad'],
        [384, 178, 0.82, 0.54, '#c7e3aa'],
        [256, 86, 0.06, 0.52, '#e8f7d6'],
      ];
      // Delicate woody twig stems connecting the sprig
      ctx.strokeStyle = '#5c4e38';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(256, 470);
      ctx.lineTo(256, 170);
      ctx.moveTo(256, 330);
      ctx.lineTo(150, 220);
      ctx.moveTo(256, 330);
      ctx.lineTo(362, 220);
      ctx.stroke();

      for (const [lx, ly, rot, sc, fill] of leaves) {
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(rot);
        ctx.scale(sc, sc);
        ctx.fillStyle = fill;
        ctx.beginPath();
        // Heart-shaped base + signature long Pipal acuminate drip tip
        ctx.moveTo(0, -68);
        ctx.bezierCurveTo(10, -40, 44, -22, 42, 12);
        ctx.bezierCurveTo(40, 40, 16, 48, 0, 34);
        ctx.bezierCurveTo(-16, 48, -40, 40, -42, 12);
        ctx.bezierCurveTo(-44, -22, -10, -40, 0, -68);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(244, 250, 224, 0.58)';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(0, 32);
        ctx.lineTo(0, -62);
        for (const vy of [-24, -4, 14]) {
          ctx.moveTo(0, vy);
          ctx.quadraticCurveTo(16, vy - 6, 28, vy - 14);
          ctx.moveTo(0, vy);
          ctx.quadraticCurveTo(-16, vy - 6, -28, vy - 14);
        }
        ctx.stroke();
        ctx.restore();
      }
      pipalClusterMap = new THREE.CanvasTexture(c);
      pipalClusterMap.colorSpace = THREE.SRGBColorSpace;
      pipalClusterMap.needsUpdate = true;
    }
  }

  const cardA = new THREE.PlaneGeometry(0.56, 0.62, 2, 2);
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
  const sprigGeo = mergeGeometries([cardA, cardB], false)!;
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
  const leafCount = 1320;
  const leafInst = new THREE.InstancedMesh(sprigGeo, sprigMat, leafCount);
  leafInst.castShadow = true;
  leafInst.receiveShadow = true;
  leafInst.userData.nonCollidable = true;
  for (let i = 0; i < leafCount; i++) {
    const center = branchEndpoints[i % branchEndpoints.length];
    const ga = i * 2.39996323;
    // Keep every sprig closely clustered onto physical branches/twigs (zero leaves floating detached in the sky)
    const rad = Math.sqrt(((i * 19) % 100) / 100) * 0.52;
    const hVar = (((i * 37) % 100) / 100) * 0.64 - 0.24;
    _v3.set(
      center.x + Math.cos(ga) * rad,
      Math.max(4.05, center.y + hVar),
      center.z + Math.sin(ga) * rad,
    );
    _q.setFromEuler(_e.set(((i * 7) % 10) * 0.12 - 0.55, ga, ((i * 11) % 10) * 0.10 - 0.45));
    _s.setScalar(0.76 + ((i * 13) % 10) * 0.044);
    _m4.compose(_v3, _q, _s);
    leafInst.setMatrixAt(i, _m4);
    _colorTmp.setHex(leafPalette[i % leafPalette.length]);
    leafInst.setColorAt(i, _colorTmp);
  }
  leafInst.instanceMatrix.needsUpdate = true;
  if (leafInst.instanceColor) leafInst.instanceColor.needsUpdate = true;
  leafInst.computeBoundingSphere();
  bodhi.add(leafInst);
  bodhi.userData.cameraOccluderMeshes = [tier1, tier2, soil, trunkCore, trunk, ...aerialMeshes];

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
    const angle = (p / 6) * Math.PI * 2 + 0.32;
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
    const anchor = flagAnchors[p] ?? new THREE.Vector3(0, 4.6, 0);
    const radialLine = createWavingPrayerFlagGarland(anchor, canopyPosts[p], {
      flagCount: 5,
      flagWidth: 0.26,
      flagHeight: 0.34,
      sag: 0.24,
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
 * Builds the Eternal Peace Flame (Shanti Deep) monument with 3-tier carved stone lotus terrace,
 * embossed bronze torch cauldron, ember coal pit, and animated volumetric multi-tongue flame shader.
 */
export function buildEternalPeaceFlame(
  chunarStoneMat: THREE.Material,
  marbleWalkMat: THREE.Material,
  warmBronzeMat: THREE.Material,
  giltGoldMat: THREE.Material,
  _flameGlowMat: THREE.Material,
): { group: THREE.Group; flameNode: THREE.Object3D; light: THREE.PointLight } {
  const g = new THREE.Group();

  // 1. Stepped octagonal stone & marble lotus terrace
  const b1 = new THREE.Mesh(new THREE.CylinderGeometry(2.02, 2.18, 0.28, 8), chunarStoneMat);
  b1.position.y = 0.14;
  b1.castShadow = true;
  b1.receiveShadow = true;
  const b2 = new THREE.Mesh(new THREE.CylinderGeometry(1.52, 1.68, 0.34, 8), marbleWalkMat);
  b2.position.y = 0.45;
  b2.castShadow = true;
  b2.receiveShadow = true;
  const b3 = new THREE.Mesh(new THREE.CylinderGeometry(1.06, 1.18, 0.22, 8), chunarStoneMat);
  b3.position.y = 0.72;
  b3.castShadow = true;
  g.add(b1, b2, b3);

  // Corner stone guardrail piers & lotus finials around terrace
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const px = Math.cos(a) * 1.82;
    const pz = Math.sin(a) * 1.82;
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.44, 0.18), chunarStoneMat);
    post.position.set(px, 0.48, pz);
    post.rotation.y = -a;
    post.castShadow = true;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 8), giltGoldMat);
    cap.position.set(px, 0.74, pz);
    g.add(post, cap);
  }

  // 2. Sculpted fluted bronze baluster pedestal + embossed lotus cauldron bowl
  const pedPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.76, 0.0),
    new THREE.Vector2(0.68, 0.10),
    new THREE.Vector2(0.52, 0.26),
    new THREE.Vector2(0.36, 0.48),
    new THREE.Vector2(0.46, 0.64),
    new THREE.Vector2(0.34, 0.78),
    new THREE.Vector2(0.42, 0.92),
  ];
  const ped = new THREE.Mesh(new THREE.LatheGeometry(pedPts, 24), warmBronzeMat);
  ped.position.y = 0.82;
  ped.castShadow = true;

  const bowlPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.44, 0.02),
    new THREE.Vector2(0.76, 0.16),
    new THREE.Vector2(0.92, 0.34),
    new THREE.Vector2(0.96, 0.44),
    new THREE.Vector2(0.84, 0.46),
    new THREE.Vector2(0.72, 0.26),
    new THREE.Vector2(0.0, 0.18),
  ];
  const bowl = new THREE.Mesh(new THREE.LatheGeometry(bowlPts, 28), warmBronzeMat);
  bowl.position.y = 1.70;
  bowl.castShadow = true;

  // Gilded beaded rim & 4 scrolled cauldron handles
  const rimCollar = new THREE.Mesh(new THREE.TorusGeometry(0.90, 0.048, 10, 28), giltGoldMat);
  rimCollar.rotation.x = Math.PI / 2;
  rimCollar.position.y = 2.13;
  const neckCollar = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.036, 8, 24), giltGoldMat);
  neckCollar.rotation.x = Math.PI / 2;
  neckCollar.position.y = 1.72;
  g.add(ped, bowl, rimCollar, neckCollar);

  for (let h = 0; h < 4; h++) {
    const ha = (h / 4) * Math.PI * 2 + Math.PI / 4;
    const hRing = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.024, 8, 16), giltGoldMat);
    hRing.position.set(Math.cos(ha) * 0.94, 1.96, Math.sin(ha) * 0.94);
    hRing.rotation.y = -ha + Math.PI / 2;
    g.add(hRing);
  }

  // Embossed lotus petal relief ring cupping the bronze cauldron belly
  const cauldronPetalGeo = createRoundedSpoonLotusPetalGeo(0.24, 0.42, 0.055);
  const petalInst = new THREE.InstancedMesh(cauldronPetalGeo, giltGoldMat, 14);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    _v3.set(Math.sin(a) * 0.68, 1.74, Math.cos(a) * 0.68);
    _q.setFromEuler(_e.set(0.48, a, 0));
    _s.set(1.0, 1.0, 1.0);
    _m4.compose(_v3, _q, _s);
    petalInst.setMatrixAt(i, _m4);
  }
  petalInst.instanceMatrix.needsUpdate = true;
  g.add(petalInst);

  // Dark basalt ash & glowing ember coal bed inside bowl
  const coalBed = new THREE.Mesh(
    new THREE.SphereGeometry(0.68, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.42),
    new THREE.MeshStandardMaterial({ color: 0x261a14, roughness: 0.94 }),
  );
  coalBed.scale.set(1.0, 0.32, 1.0);
  coalBed.position.y = 1.88;
  g.add(coalBed);

  const emberGeo = new THREE.DodecahedronGeometry(0.085, 0);
  const emberMat = new THREE.MeshStandardMaterial({
    color: 0x5c1806,
    emissive: 0xff5a16,
    emissiveIntensity: 1.9,
    roughness: 0.75,
  });
  const emberInst = new THREE.InstancedMesh(emberGeo, emberMat, 14);
  for (let e = 0; e < 14; e++) {
    const a = e * 2.39996;
    const r = e === 0 ? 0 : 0.14 + Math.sqrt(e / 14) * 0.40;
    _v3.set(Math.cos(a) * r, 1.96 + (1 - r) * 0.08, Math.sin(a) * r);
    _q.setFromEuler(_e.set(e * 0.4, a, e * 0.3));
    _s.set(1.2, 0.65, 1.0);
    _m4.compose(_v3, _q, _s);
    emberInst.setMatrixAt(e, _m4);
  }
  emberInst.instanceMatrix.needsUpdate = true;
  g.add(emberInst);

  // 3. Realistic animated volumetric multi-tongue Peace Flame GLSL shader + rising sparks
  const flameTime = { value: 0 };
  const flameShaderMat = new THREE.ShaderMaterial({
    uniforms: { uTime: flameTime },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    vertexShader: `
      uniform float uTime;
      varying vec2 vUv;
      varying float vEdge;
      void main() {
        vUv = uv;
        vec3 p = position;
        float h = uv.y;
        float sway = sin(uTime * 5.2 + h * 5.8 + position.x * 4.0) * 0.11 * h * h;
        float swayZ = cos(uTime * 4.4 + h * 4.9 + position.z * 4.0) * 0.09 * h * h;
        p.x += sway;
        p.z += swayZ;
        vEdge = abs(uv.x * 2.0 - 1.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vUv;
      varying float vEdge;
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }
      float vnoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
      }
      void main() {
        float h = vUv.y;
        float n1 = vnoise(vec2(vUv.x * 5.5, h * 4.5 - uTime * 3.8));
        float n2 = vnoise(vec2(vUv.x * 11.0 + 3.1, h * 9.0 - uTime * 6.2));
        float turb = n1 * 0.65 + n2 * 0.35;
        float taper = mix(0.95, 0.08, pow(h, 0.72));
        float mask = smoothstep(taper, taper * 0.25, vEdge + (turb - 0.5) * 0.42);
        float tipMask = smoothstep(0.0, 0.12, h) * (1.0 - smoothstep(0.45, 1.0, h + turb * 0.32));
        float alpha = mask * tipMask * 0.78;
        if (alpha < 0.015) discard;
        vec3 outerOrange = vec3(1.0, 0.32, 0.04);
        vec3 midAmber = vec3(1.0, 0.74, 0.16);
        vec3 coreWhite = vec3(1.0, 0.96, 0.80);
        vec3 col = mix(outerOrange, midAmber, smoothstep(0.0, 0.55, 1.0 - vEdge));
        col = mix(col, coreWhite, smoothstep(0.35, 0.92, (1.0 - h) * (1.0 - vEdge)));
        gl_FragColor = vec4(col * 1.35, alpha);
      }
    `,
  });

  const flameNode = new THREE.Group();
  flameNode.position.y = 1.98;
  flameNode.userData.nonCollidable = true;
  flameNode.userData.noMerge = true;

  // Crossed tapered flame ribbon sheets for full 360-degree volumetric fire silhouette
  for (let i = 0; i < 4; i++) {
    const sheetGeo = new THREE.PlaneGeometry(0.84 - (i % 2) * 0.18, 1.35 - (i % 2) * 0.16, 4, 10);
    sheetGeo.translate(0, (1.35 - (i % 2) * 0.16) * 0.5, 0);
    const sheet = new THREE.Mesh(sheetGeo, flameShaderMat);
    sheet.rotation.y = (i / 4) * Math.PI;
    flameNode.add(sheet);
  }

  // Rising golden embers around flame
  const sparkCount = 24;
  const spPos = new Float32Array(sparkCount * 3);
  const spSeed = new Float32Array(sparkCount);
  for (let i = 0; i < sparkCount; i++) {
    const a = i * 2.39996;
    const r = 0.08 + ((i * 19) % 100) / 100 * 0.28;
    spPos[i * 3] = Math.cos(a) * r;
    spPos[i * 3 + 1] = 0.1 + ((i * 31) % 100) / 100 * 1.4;
    spPos[i * 3 + 2] = Math.sin(a) * r;
    spSeed[i] = i * 0.73;
  }
  const spGeo = new THREE.BufferGeometry();
  spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3));
  spGeo.setAttribute('aSeed', new THREE.BufferAttribute(spSeed, 1));
  const spMat = new THREE.ShaderMaterial({
    uniforms: { uTime: flameTime },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float aSeed;
      uniform float uTime;
      varying float vAlpha;
      void main() {
        float life = fract(aSeed * 0.37 + uTime * 0.62);
        vec3 p = position;
        p.y = life * 1.75;
        p.x += sin(life * 7.0 + uTime * 2.4 + aSeed) * 0.14;
        p.z += cos(life * 6.0 + uTime * 2.1 + aSeed) * 0.14;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = clamp(14.0 / max(1.2, -mv.z), 2.0, 6.0);
        vAlpha = smoothstep(0.0, 0.18, life) * (1.0 - smoothstep(0.55, 1.0, life));
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        if (d > 0.5) discard;
        gl_FragColor = vec4(1.0, 0.78, 0.25, (1.0 - d * 2.0) * vAlpha * 0.9);
      }
    `,
  });
  const sparks = new THREE.Points(spGeo, spMat);
  sparks.userData.nonCollidable = true;
  flameNode.add(sparks);

  flameNode.userData.noMerge = true;
  flameNode.userData.onFlickerUpdate = (elapsed: number) => {
    flameTime.value = elapsed;
    const pulse = 1 + Math.sin(elapsed * 6.4) * 0.05 + Math.cos(elapsed * 10.2) * 0.03;
    flameNode.scale.set(1, pulse, 1);
  };

  const light = new THREE.PointLight(0xffa43c, 2.35, 19, 1.45);
  light.position.set(0, 2.85, 0);

  g.add(flameNode, light);
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
  return buildMuseumToranaGate(stoneMat, brickMat, goldMat, bronzeMat);
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

  // Outer Chunar sandstone curb border rails cleanly split at cardinal bridges (top +0.112 local -> proud 2.2cm, zero Z-fighting)
  const addCurbRun = (x0: number, x1: number, z0: number, z1: number) => {
    const sx = x1 - x0;
    const sz = z1 - z0;
    const curb = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.044, sz), chunarMat);
    curb.position.set((x0 + x1) * 0.5, 0.090, (z0 + z1) * 0.5);
    curb.receiveShadow = true;
    curb.userData.nonCollidable = true;
    g.add(curb);
  };
  for (const cz of [60.31, 63.49, -52.31, -55.49]) {
    addCurbRun(-51.2, -3.45, cz - 0.11, cz + 0.11);
    addCurbRun(3.45, 50.7, cz - 0.11, cz + 0.11);
  }
  for (const cx of [-51.09, 50.59]) {
    addCurbRun(cx - 0.11, cx + 0.11, -52.2, 1.25);
    addCurbRun(cx - 0.11, cx + 0.11, 6.75, 60.2);
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
    textureSize: isSoftwareGl ? 128 : 512,
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

  // 5. Four Highly Detailed Heritage Stone & Terracotta Arched Pilgrim Causeway Bridges
  const bridgeMats = {
    terracottaMat,
    brickMat,
    chunarMat,
    bronzeMat,
  };
  g.add(buildMuseumCausewayBridge('z', 0, 56.3, 8.6, 6.8, bridgeMats)); // South Sacred Bridge (ldz 52.0..60.6)
  g.add(buildMuseumCausewayBridge('z', 0, -48.3, 8.6, 6.8, bridgeMats)); // North Sacred Bridge (ldz -52.6..-44.0)
  g.add(buildMuseumCausewayBridge('x', 47.3, 4.0, 6.6, 5.6, bridgeMats)); // East Sacred Bridge (ldx 44.0..50.6)
  g.add(buildMuseumCausewayBridge('x', -47.3, 4.0, 6.6, 5.6, bridgeMats)); // West Sacred Bridge (ldx -50.6..-44.0)

  // (Water-standing bridge abutment piers & lanterns removed so the pond moat stays clean and unobstructed.)

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

  // 8. Ornate Tiered Granite & Bronze Kalash Corner Boundary Pillars at outer South & North Promenade corners
  const cornerKalashGeo = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.14, 0.0),
      new THREE.Vector2(0.11, 0.05),
      new THREE.Vector2(0.20, 0.14),
      new THREE.Vector2(0.21, 0.22),
      new THREE.Vector2(0.12, 0.30),
      new THREE.Vector2(0.16, 0.35),
      new THREE.Vector2(0.06, 0.42),
      new THREE.Vector2(0.015, 0.52),
      new THREE.Vector2(0.0, 0.56),
    ],
    18,
  );
  for (const [bx, bz] of [[-50.5, 62.9], [50.2, 62.9], [-50.5, -54.9], [50.2, -54.9]] as Array<[number, number]>) {
    const mon = new THREE.Group();
    mon.position.set(bx, 0.09, bz);
    const footBrick = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.18, 0.92), brickMat);
    footBrick.position.y = 0.09;
    footBrick.castShadow = true;
    footBrick.receiveShadow = true;
    const baseStone = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.16, 0.76), chunarMat);
    baseStone.position.y = 0.26;
    baseStone.castShadow = true;
    const shaftBlock = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.52, 0.56), chunarMat);
    shaftBlock.position.y = 0.60;
    shaftBlock.castShadow = true;
    const bronzeBand = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.07, 0.60), bronzeMat);
    bronzeBand.position.y = 0.60;
    const cornice = new THREE.Mesh(new THREE.BoxGeometry(0.70, 0.11, 0.70), chunarMat);
    cornice.position.y = 0.91;
    const lotusPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.30, 0.08, 16), bronzeMat);
    lotusPlate.position.y = 1.00;
    const pot = new THREE.Mesh(cornerKalashGeo, goldMat);
    pot.position.y = 1.04;
    pot.castShadow = true;
    mon.add(footBrick, baseStone, shaftBlock, bronzeBand, cornice, lotusPlate, pot);
    g.add(mon);
  }

  return g;
}


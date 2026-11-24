import * as THREE from 'three';
import { LANDMARKS } from '../data/portfolioData';
import { ProceduralTextureSet } from './proceduralTextures';
import {
  BRIDGE_BOUNDS,
  GLACIAL_LAKE,
  ROAD_LANTERN_COORDS,
  ROAD_PATHS,
  SPAWN_POSITION,
  getRiverCenterX,
  getWorldBoulderSpots,
  getWorldTreeSpots,
  groundHeightAt,
} from './worldLogic';
import { applyRealisticWaterShader } from './waterShader';

export interface AnimatedWaterController {
  group: THREE.Group;
  update: (elapsed: number) => void;
}

export interface AnimatedGrassController {
  group: THREE.Group;
  update: (elapsed: number) => void;
}

export interface MountainCloudController {
  group: THREE.Group;
  update: (elapsed: number) => void;
}

export interface RoadAndLanternsResult {
  group: THREE.Group;
  lanternLights: THREE.PointLight[];
}

const _vec3 = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _euler = new THREE.Euler();
const _color = new THREE.Color();

function ridgedNoise(x: number, z: number): number {
  const n1 = 1 - Math.abs(Math.sin(x * 0.022 + Math.cos(z * 0.018) * 1.65));
  const n2 = 1 - Math.abs(Math.sin(x * 0.048 - z * 0.036 + 0.7));
  const n3 = 1 - Math.abs(Math.cos(x * 0.095 - z * 0.078 + 1.3));
  const n4 = Math.sin(x * 0.21 + z * 0.17) * 0.5 + 0.5;
  return (
    Math.pow(n1, 1.4) * 0.48 +
    Math.pow(n2, 1.25) * 0.27 +
    n3 * 0.16 +
    n4 * 0.09
  );
}

function buildRoadCurves(): THREE.CatmullRomCurve3[] {
  return ROAD_PATHS.map(
    (pts) =>
      new THREE.CatmullRomCurve3(
        pts.map(([x, z]) => new THREE.Vector3(x, 0, z)),
      ),
  );
}

function minDistanceToRoads(
  x: number,
  z: number,
  samples: Array<{ x: number; z: number }>,
): number {
  let minD = Infinity;
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    const d = Math.hypot(x - s.x, z - s.z);
    if (d < minD) minD = d;
  }
  return minD;
}

function sampleRoadPoints(): Array<{ x: number; z: number }> {
  const pts: Array<{ x: number; z: number }> = [];
  for (const curve of buildRoadCurves()) {
    const count = Math.ceil(curve.getLength() * 1.8);
    for (let i = 0; i <= count; i++) {
      const p = curve.getPointAt(i / count);
      pts.push({ x: p.x, z: p.z });
    }
  }
  return pts;
}

/**
 * Photorealistic Himalayan Range along the northern horizon:
 * smooth high-resolution tectonic ridgelines, eroded couloirs, slope-based snow & glacier stratification
 * (steep cliff faces remain dark gneiss rock while ridges & cirques hold wind-packed snow).
 */
export function createSculptedHimalayas(textures: ProceduralTextureSet): THREE.Mesh {
  const width = 960;
  const depth = 290;
  const segX = 160;
  const segZ = 52;

  const geo = new THREE.PlaneGeometry(width, depth, segX, segZ);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const zLocal = pos.getZ(i);
    const z = zLocal - 325;
    pos.setZ(i, z);

    const zFront = 1 - THREE.MathUtils.smoothstep(z, -315, -182);
    const zBack = THREE.MathUtils.smoothstep(z, -475, -355);
    const zBlend = zFront * zBack;
    const flank = THREE.MathUtils.smoothstep(Math.abs(x), 210, 400) * 0.36;
    const envelope = Math.min(1, zBlend + flank * (1 - THREE.MathUtils.smoothstep(z, -240, -145)));

    const ridge = ridgedNoise(x, z);

    const jaggedPeak = (cx: number, cz: number, sx: number, sz: number, h: number) => {
      const dx = Math.abs(x - cx) / sx;
      const dz = Math.abs(z - cz) / sz;
      const arete = Math.max(0, 1 - Math.hypot(dx * 0.78, dz * 0.95));
      const spine = Math.max(0, 1 - (dx * 0.55 + dz * 1.08));
      return (Math.pow(arete, 1.35) * 0.55 + Math.pow(spine, 1.75) * 0.45) * h;
    };

    const annapurnaWest = jaggedPeak(-250, -338, 88, 66, 78);
    const machapuchareTwinL = jaggedPeak(-172, -312, 62, 54, 92);
    const machapuchareTwinR = jaggedPeak(-150, -324, 54, 54, 78);
    const amaDablamMain = jaggedPeak(-74, -315, 68, 56, 88);
    const amaDablamShoulder = jaggedPeak(-54, -306, 56, 52, 62);
    const everestWestShoulder = jaggedPeak(-16, -342, 66, 58, 72);
    const everestSummit = jaggedPeak(22, -335, 82, 66, 112);
    const lhotseEast = jaggedPeak(62, -346, 68, 60, 78);
    const easternMassif = jaggedPeak(175, -332, 88, 64, 76);
    const easternSaddle = jaggedPeak(270, -358, 86, 62, 68);
    const outerLeft = jaggedPeak(-355, -298, 88, 62, 54);
    const outerRight = jaggedPeak(355, -298, 88, 62, 56);

    const massHeight =
      annapurnaWest +
      machapuchareTwinL +
      machapuchareTwinR +
      amaDablamMain +
      amaDablamShoulder +
      everestWestShoulder +
      everestSummit +
      lhotseEast +
      easternMassif +
      easternSaddle +
      outerLeft +
      outerRight;

    const couloirErosion =
      Math.sin(x * 0.29 + ridge * 3.1) * 2.2 * THREE.MathUtils.smoothstep(massHeight, 14, 65);
    const microCrag =
      Math.sin(x * 0.62 - z * 0.44) *
      Math.cos(x * 0.24 + z * 0.55) *
      1.35 *
      THREE.MathUtils.smoothstep(massHeight, 12, 54);

    const frontCanyonWeight = 1 - THREE.MathUtils.smoothstep(z, -318, -238);
    const gorgeMask = 1 - Math.exp(-Math.pow((x - 42) / 28, 2)) * 0.55 * frontCanyonWeight;
    const height =
      -3.8 + envelope * gorgeMask * (8.5 + ridge * 24 + massHeight + couloirErosion + microCrag);
    pos.setY(i, height);
  }

  geo.computeVertexNormals();
  const norm = geo.attributes.normal;
  const colors = new Float32Array(pos.count * 3);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const slopeY = THREE.MathUtils.clamp(norm.getY(i), 0, 1);

    const timberline = THREE.MathUtils.smoothstep(y, 1.0, 20.0);
    const snowAlt = 30.0 + Math.sin(x * 0.052) * 5.2 + Math.cos(z * 0.068) * 3.2;
    const altSnow = THREE.MathUtils.smoothstep(y, snowAlt, snowAlt + 15.0);
    const slopeSnowRetention = THREE.MathUtils.smoothstep(slopeY, 0.56, 0.82);
    const snowFactor = altSnow * (0.18 + 0.82 * slopeSnowRetention);

    const glacierShelf =
      THREE.MathUtils.smoothstep(y, snowAlt - 7.5, snowAlt + 6.0) *
      THREE.MathUtils.smoothstep(slopeY, 0.58, 0.86) *
      (0.5 + 0.5 * Math.sin(x * 0.11 + z * 0.09));

    let r = THREE.MathUtils.lerp(0.18, 0.24, timberline);
    let g = THREE.MathUtils.lerp(0.24, 0.26, timberline);
    let b = THREE.MathUtils.lerp(0.16, 0.29, timberline);

    const cragTint = 0.5 + 0.5 * Math.sin(x * 0.095 - z * 0.068);
    r = THREE.MathUtils.lerp(r, 0.36, cragTint * 0.28 * timberline);
    g = THREE.MathUtils.lerp(g, 0.34, cragTint * 0.28 * timberline);
    b = THREE.MathUtils.lerp(b, 0.33, cragTint * 0.28 * timberline);

    if (glacierShelf > 0.15) {
      r = THREE.MathUtils.lerp(r, 0.52, glacierShelf * 0.48);
      g = THREE.MathUtils.lerp(g, 0.65, glacierShelf * 0.48);
      b = THREE.MathUtils.lerp(b, 0.76, glacierShelf * 0.48);
    }

    _color.setRGB(
      THREE.MathUtils.lerp(r, 0.8, snowFactor),
      THREE.MathUtils.lerp(g, 0.82, snowFactor),
      THREE.MathUtils.lerp(b, 0.85, snowFactor),
    );
    colors[i * 3] = _color.r;
    colors[i * 3 + 1] = _color.g;
    colors[i * 3 + 2] = _color.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    normalMap: textures.rockNormal,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughness: 0.9,
    metalness: 0.03,
    flatShading: false,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  return mesh;
}

/**
 * High-altitude translucent unlit alpine valley cloud wisps drifting cleanly past mountain shoulders
 * without dark undersides or muddy shadows.
 */
export function createMountainClouds(): MountainCloudController {
  const group = new THREE.Group();

  const cCanvas = document.createElement('canvas');
  cCanvas.width = 256;
  cCanvas.height = 128;
  const ctx = cCanvas.getContext('2d')!;
  ctx.clearRect(0, 0, 256, 128);
  ctx.save();
  ctx.translate(128, 64);
  ctx.scale(2, 1);
  const g = ctx.createRadialGradient(0, 0, 6, 0, 0, 60);
  g.addColorStop(0, 'rgba(220, 226, 234, 0.68)');
  g.addColorStop(0.45, 'rgba(208, 216, 228, 0.32)');
  g.addColorStop(1, 'rgba(196, 208, 224, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 62, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  const mistTex = new THREE.CanvasTexture(cCanvas);
  mistTex.colorSpace = THREE.SRGBColorSpace;

  const cloudMat = new THREE.MeshBasicMaterial({
    map: mistTex,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const ribbonGeo = new THREE.PlaneGeometry(110, 22);
  const banks: Array<{ obj: THREE.Group; baseX: number; speed: number; phase: number }> = [];

  const seeds: Array<[number, number, number, number]> = [
    [-190, 42, -255, 1.15],
    [-65, 48, -280, 1.3],
    [78, 46, -268, 1.2],
    [195, 43, -245, 1.1],
  ];

  seeds.forEach(([x, y, z, s], idx) => {
    const cluster = new THREE.Group();
    cluster.position.set(x, y, z);
    const p1 = new THREE.Mesh(ribbonGeo, cloudMat);
    p1.scale.set(s, s, 1);
    const p2 = new THREE.Mesh(ribbonGeo, cloudMat);
    p2.position.set(22 * s, 3.5, -8);
    p2.scale.set(s * 0.78, s * 0.75, 1);
    cluster.add(p1, p2);
    group.add(cluster);
    banks.push({
      obj: cluster,
      baseX: x,
      speed: 1.4 + (idx % 3) * 0.45,
      phase: idx * 1.3,
    });
  });

  return {
    group,
    update: (elapsed: number) => {
      for (const b of banks) {
        const span = 560;
        const wrapped = ((b.baseX + elapsed * b.speed + span * 0.5) % span) - span * 0.5;
        b.obj.position.x = wrapped;
        b.obj.position.y += Math.sin(elapsed * 0.35 + b.phase) * 0.002;
      }
    },
  };
}

/**
 * Natural multi-biome valley ground transitioning from moist Himalayan turf & moss (West)
 * across exposed river shingle/silt to sun-baked Tamil Nadu laterite loam (East).
 */
export function createDioramaTerrain(textures: ProceduralTextureSet): THREE.Mesh {
  textures.meadowMap.repeat.set(110, 110);
  textures.meadowNormal.repeat.set(110, 110);
  textures.meadowRough.repeat.set(110, 110);

  const size = 640;
  const segs = 136;
  const geo = new THREE.PlaneGeometry(size, size, segs, segs);
  geo.rotateX(-Math.PI / 2);

  const roadSamples = sampleRoadPoints();
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    let y = groundHeightAt(x, z);
    const underChowk = x >= -130.5 && x <= -53.6 && z >= 107.5 && z <= 149.7;
    const underPlinth = Math.abs(x + 92) <= 25.2 && z >= 70.0 && z <= 111.0;
    const roadDist =
      x > -118 && x < 105 && z > -118 && z < 172 ? minDistanceToRoads(x, z, roadSamples) : 99;
    if (underChowk || underPlinth) {
      y = 0.08;
    } else if (roadDist < 2.15) {
      // Depress roadbed sub-grade cleanly beneath the level stone road deck so grass triangles never pierce the pavers
      y -= (1 - THREE.MathUtils.smoothstep(roadDist, 0.7, 2.15)) * 0.07;
    }
    pos.setY(i, y);

    const riverCenterX = getRiverCenterX(z);
    const distRiver = Math.abs(x - riverCenterX);
    const eastBankBlend = THREE.MathUtils.smoothstep(x - riverCenterX, 4.5, 22.0);
    const outerFoothillBlend = THREE.MathUtils.smoothstep(Math.hypot(x, z), 170, 250);

    const distLake = Math.hypot(x - GLACIAL_LAKE.x, z - GLACIAL_LAKE.z);
    if (distRiver < 8.4 || distLake < GLACIAL_LAKE.basinRadius) {
      const shoreT =
        distLake < GLACIAL_LAKE.basinRadius
          ? THREE.MathUtils.smoothstep(distLake, GLACIAL_LAKE.waterRadius * 0.65, GLACIAL_LAKE.basinRadius)
          : THREE.MathUtils.smoothstep(distRiver, 3.2, 8.4);
      _color.setRGB(
        THREE.MathUtils.lerp(0.24, 0.5, shoreT),
        THREE.MathUtils.lerp(0.32, 0.49, shoreT),
        THREE.MathUtils.lerp(0.34, 0.44, shoreT),
      );
    } else {
      _color.setRGB(
        THREE.MathUtils.lerp(0.76, 1.06, eastBankBlend),
        THREE.MathUtils.lerp(0.84, 0.88, eastBankBlend),
        THREE.MathUtils.lerp(0.68, 0.62, eastBankBlend),
      );
      if (roadDist < 3.6) {
        const vergeBlend = 1 - THREE.MathUtils.smoothstep(roadDist, 1.8, 3.6);
        _color.lerp(new THREE.Color(0x666153), vergeBlend * 0.45);
      }
      if (outerFoothillBlend > 0) {
        _color.lerp(new THREE.Color(0x52574b), outerFoothillBlend * 0.62);
      }
    }

    colors[i * 3] = _color.r;
    colors[i * 3 + 1] = _color.g;
    colors[i * 3 + 2] = _color.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    map: textures.meadowMap,
    normalMap: textures.meadowNormal,
    normalScale: new THREE.Vector2(0.7, 0.7),
    roughnessMap: textures.meadowRough,
    vertexColors: true,
    roughness: 0.94,
    metalness: 0.02,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Realistic natural mountain grass tufts & swaying riverbank reeds.
 */
export function createInstancedGrassField(): AnimatedGrassController {
  const group = new THREE.Group();
  const roadSamples = sampleRoadPoints();
  const plazas = [
    { x: SPAWN_POSITION.x, z: SPAWN_POSITION.z, r: 8.5 },
    ...LANDMARKS.map((lm) => ({
      x: lm.position.x,
      z: lm.position.z,
      r: lm.id === 'janaki-mandir' ? 32 : lm.id === 'boudhanath-stupa' ? 12 : 11,
    })),
  ];

  // Slender tapered realistic grass blades (3 angled blades per tuft)
  const tuftPositions: number[] = [];
  const tuftIndices: number[] = [];
  const blades = [
    { ox: 0.0, oz: 0.0, rot: 0.0, tiltX: 0.1, h: 0.6, w: 0.06 },
    { ox: -0.09, oz: 0.07, rot: 2.1, tiltX: 0.14, h: 0.5, w: 0.05 },
    { ox: 0.09, oz: -0.06, rot: 4.1, tiltX: 0.13, h: 0.54, w: 0.055 },
  ];
  blades.forEach((b, bi) => {
    const c = Math.cos(b.rot);
    const s = Math.sin(b.rot);
    const addPt = (lx: number, ly: number, lz: number) => {
      tuftPositions.push(b.ox + lx * c - lz * s, ly, b.oz + lx * s + lz * c);
    };
    addPt(-b.w, 0.0, 0.0);
    addPt(b.w, 0.0, 0.0);
    addPt(-b.w * 0.65, b.h * 0.42, b.tiltX * 0.25);
    addPt(b.w * 0.65, b.h * 0.42, b.tiltX * 0.25);
    addPt(0.0, b.h, b.tiltX);
    const base = bi * 5;
    tuftIndices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2, base + 2, base + 3, base + 4);
  });

  const bladeGeo = new THREE.BufferGeometry();
  bladeGeo.setAttribute('position', new THREE.Float32BufferAttribute(tuftPositions, 3));
  bladeGeo.setIndex(tuftIndices);
  bladeGeo.computeVertexNormals();

  const uTime = { value: 0 };
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.86,
    metalness: 0.01,
    side: THREE.DoubleSide,
  });

  bladeMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uTime;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform float uTime;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vec4 instOrigin = vec4(0.0, 0.0, 0.0, 1.0);
         #ifdef USE_INSTANCING
           instOrigin = instanceMatrix * instOrigin;
         #endif
         float hFactor = clamp(position.y / 0.6, 0.0, 1.0);
         float wave = sin(uTime * 1.9 + instOrigin.x * 0.35 + instOrigin.z * 0.28) * 0.11
                    + cos(uTime * 3.1 + instOrigin.x * 0.7) * 0.04;
         transformed.x += wave * hFactor * hFactor;
         transformed.z += wave * 0.4 * hFactor * hFactor;`,
      );
  };

  interface GrassSpot {
    x: number;
    z: number;
    scale: number;
    rot: number;
    east: boolean;
    nearRiver: boolean;
  }

  const grassSpots: GrassSpot[] = [];
  const pebbleSpots: Array<{ x: number; z: number; scale: number; rot: number }> = [];

  const goldenAngle = 2.39996323;
  const maxAttempts = 8500;
  for (let i = 0; i < maxAttempts && grassSpots.length < 2800; i++) {
    const angle = i * goldenAngle;
    const t = (i + 0.5) / maxAttempts;
    const radius = 8.0 + Math.sqrt(t) * 185.0;
    const jx = Math.sin(i * 12.9898) * 1.6;
    const jz = Math.cos(i * 78.233) * 1.6;
    const x = Math.cos(angle) * radius + jx;
    const z = Math.sin(angle) * radius + jz;

    const riverCenterX = getRiverCenterX(z);
    const distRiver = Math.abs(x - riverCenterX);
    if (distRiver < 8.4) continue;
    if (Math.hypot(x - GLACIAL_LAKE.x, z - GLACIAL_LAKE.z) < GLACIAL_LAKE.basinRadius + 1.4) continue;
    if (
      x > BRIDGE_BOUNDS.minX - 4 &&
      x < BRIDGE_BOUNDS.maxX + 4 &&
      Math.abs(z - BRIDGE_BOUNDS.centerZ) < 6.0
    ) {
      continue;
    }
    // Keep Janakpur Chowk brick plaza, temple compound & West Vivah Mandap/Ganga Sagar precinct clean
    if (x > -150 && x < -48 && z > 60 && z < 158) continue;

    let inPlaza = false;
    for (const pl of plazas) {
      if (Math.hypot(x - pl.x, z - pl.z) < pl.r) {
        inPlaza = true;
        break;
      }
    }
    if (inPlaza) continue;

    const roadD = minDistanceToRoads(x, z, roadSamples);
    if (roadD < 2.6) continue;

    const nearVerge = roadD < 6.2;
    const nearRiver = distRiver < 11.5;
    if (!nearVerge && !nearRiver && i % 3 !== 0) continue;

    grassSpots.push({
      x,
      z,
      scale: (nearRiver ? 1.38 : nearVerge ? 1.02 : 0.92) + ((i * 19) % 42) / 100,
      rot: ((i * 73) % 628) / 100,
      east: x > riverCenterX,
      nearRiver,
    });

    if ((nearVerge || nearRiver) && i % 9 === 0 && pebbleSpots.length < 320) {
      pebbleSpots.push({
        x: x - 0.14,
        z: z + 0.14,
        scale: 0.8 + ((i * 11) % 50) / 100,
        rot: (i * 0.8) % (Math.PI * 2),
      });
    }
  }

  const grassMesh = new THREE.InstancedMesh(bladeGeo, bladeMat, grassSpots.length);
  grassMesh.castShadow = false;
  grassMesh.receiveShadow = true;

  const westPalette = [0x3d5528, 0x486231, 0x526b38, 0x5c733d, 0x354a22];
  const eastPalette = [0x7d7443, 0x8b7e4a, 0x6c6e3b, 0x948651];
  const reedPalette = [0x4c5e2c, 0x626b34, 0x76703d];

  grassSpots.forEach((gs, idx) => {
    const y = groundHeightAt(gs.x, gs.z);
    _vec3.set(gs.x, y - 0.02, gs.z);
    _quat.setFromEuler(_euler.set(0.06 * Math.sin(idx), gs.rot, 0.05 * Math.cos(idx)));
    _scale.set(gs.scale * 0.95, gs.scale, gs.scale * 0.95);
    _mat4.compose(_vec3, _quat, _scale);
    grassMesh.setMatrixAt(idx, _mat4);

    const pal = gs.nearRiver ? reedPalette : gs.east ? eastPalette : westPalette;
    _color.setHex(pal[idx % pal.length]);
    grassMesh.setColorAt(idx, _color);
  });
  grassMesh.instanceMatrix.needsUpdate = true;
  if (grassMesh.instanceColor) grassMesh.instanceColor.needsUpdate = true;
  grassMesh.computeBoundingSphere();
  group.add(grassMesh);

  if (pebbleSpots.length > 0) {
    const pebGeo = new THREE.IcosahedronGeometry(0.14, 1);
    const pebMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.85,
    });
    const pebMesh = new THREE.InstancedMesh(pebGeo, pebMat, pebbleSpots.length);
    pebbleSpots.forEach((pb, idx) => {
      const y = groundHeightAt(pb.x, pb.z);
      _vec3.set(pb.x, y + 0.025, pb.z);
      _quat.setFromEuler(_euler.set(idx * 0.3, pb.rot, idx * 0.2));
      _scale.set(pb.scale * 1.25, pb.scale * 0.45, pb.scale * 0.95);
      _mat4.compose(_vec3, _quat, _scale);
      pebMesh.setMatrixAt(idx, _mat4);
      _color.setHex(idx % 2 === 0 ? 0x7a7e82 : 0x8a8175);
      pebMesh.setColorAt(idx, _color);
    });
    pebMesh.instanceMatrix.needsUpdate = true;
    if (pebMesh.instanceColor) pebMesh.instanceColor.needsUpdate = true;
    pebMesh.computeBoundingSphere();
    group.add(pebMesh);
  }

  return {
    group,
    update: (elapsed: number) => {
      uTime.value = elapsed;
    },
  };
}

/**
 * Natural Himalayan Glacial Meltwater River with Fresnel reflection tinting,
 * stony shallows, submerged riverbed boulders breaking the current, and whitewater ripples.
 */
export function createAnimatedRiver(textures: ProceduralTextureSet): AnimatedWaterController {
  const group = new THREE.Group();

  const geo = new THREE.PlaneGeometry(14.5, 480, 24, 120);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const rx = pos.getX(i);
    const rz = pos.getZ(i);
    pos.setX(i, rx + getRiverCenterX(rz));
  }
  geo.computeVertexNormals();

  const uTime = { value: 0 };
  const mat = new THREE.MeshStandardMaterial({
    color: 0x26545a,
    normalMap: textures.waterNormal,
    normalScale: new THREE.Vector2(0.45, 0.45),
    roughness: 0.06,
    metalness: 0.48,
    transparent: true,
    opacity: 0.9,
  });

  applyRealisticWaterShader(mat, uTime, {
    mode: 'river',
    maxRadius: 7.25,
    flowSpeed: 2.1,
    deepTint: 0x0b353c,
    shallowTint: 0x265e5d,
  });

  const waterMesh = new THREE.Mesh(geo, mat);
  waterMesh.position.y = -0.34;
  waterMesh.receiveShadow = true;
  group.add(waterMesh);

  const stoneGeo = new THREE.IcosahedronGeometry(0.82, 2);
  const sPos = stoneGeo.attributes.position;
  for (let i = 0; i < sPos.count; i++) {
    const vx = sPos.getX(i);
    const vy = sPos.getY(i);
    const vz = sPos.getZ(i);
    const n = 0.82 + 0.24 * Math.sin(vx * 3.1 + vy * 2.4) * Math.cos(vz * 3.5);
    sPos.setXYZ(i, vx * n, vy * n * 0.68, vz * n);
  }
  stoneGeo.computeVertexNormals();

  const riverStoneMat = new THREE.MeshStandardMaterial({
    normalMap: textures.rockNormal,
    normalScale: new THREE.Vector2(0.95, 0.95),
    color: 0xffffff,
    roughness: 0.38,
    metalness: 0.04,
  });

  const stoneCoords: Array<{ x: number; y: number; z: number; s: number }> = [];
  for (let i = 0; i < 120; i++) {
    const z = -175 + i * 2.95 + Math.sin(i * 1.9) * 0.8;
    if (Math.abs(z - BRIDGE_BOUNDS.centerZ) < 6.5) continue;
    const rcX = getRiverCenterX(z);
    const offset = Math.sin(i * 2.71) * 5.8;
    const x = rcX + offset;
    const dist = Math.abs(offset);
    stoneCoords.push({
      x,
      y: dist > 4.2 ? -0.38 : -0.46,
      z,
      s: 0.68 + (i % 5) * 0.26,
    });
  }

  const riverStones = new THREE.InstancedMesh(stoneGeo, riverStoneMat, stoneCoords.length);
  riverStones.castShadow = true;
  riverStones.receiveShadow = true;
  stoneCoords.forEach((sc, idx) => {
    _vec3.set(sc.x, sc.y, sc.z);
    _quat.setFromEuler(_euler.set(idx * 0.4, idx * 1.1, idx * 0.25));
    _scale.set(sc.s * 1.15, sc.s * 0.72, sc.s);
    _mat4.compose(_vec3, _quat, _scale);
    riverStones.setMatrixAt(idx, _mat4);
    const tone = 0.36 + (idx % 4) * 0.06;
    _color.setRGB(tone, tone * 0.98, tone * 0.95);
    riverStones.setColorAt(idx, _color);
  });
  riverStones.instanceMatrix.needsUpdate = true;
  if (riverStones.instanceColor) riverStones.instanceColor.needsUpdate = true;
  riverStones.computeBoundingSphere();
  group.add(riverStones);

  return {
    group,
    update: (elapsed: number) => {
      uTime.value = elapsed;
    },
  };
}

function trimPathBetweenPlazas(
  points: Array<[number, number]>,
  plazas: Array<{ x: number; z: number; r: number }>,
): Array<[number, number]> {
  if (points.length < 2) return points;
  const res = points.map((p) => [p[0], p[1]] as [number, number]);

  const trimEnd = (idx: number, dirIdx: number) => {
    const [px, pz] = res[idx];
    const [nx, nz] = res[dirIdx];
    for (const pl of plazas) {
      const dist = Math.hypot(px - pl.x, pz - pl.z);
      if (dist < pl.r - 0.15) {
        const dx = nx - px;
        const dz = nz - pz;
        const len = Math.hypot(dx, dz) || 1;
        const push = Math.max(0, pl.r - 0.1 - dist);
        res[idx][0] = px + (dx / len) * push;
        res[idx][1] = pz + (dz / len) * push;
        break;
      }
    }
  };

  trimEnd(0, 1);
  trimEnd(res.length - 1, res.length - 2);
  return res;
}

/**
 * Weathered stone flagstone roads with granite edge curbing & carved Nepali stone lanterns.
 */
export function createCurbedRoads(textures: ProceduralTextureSet): RoadAndLanternsResult {
  const group = new THREE.Group();
  const lanternLights: THREE.PointLight[] = [];

  const roadMat = new THREE.MeshStandardMaterial({
    map: textures.cobbleMap,
    normalMap: textures.cobbleNormal,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughnessMap: textures.cobbleRough,
    color: 0xffffff,
    roughness: 0.88,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  // Dedicated 1:1 world-meter flagstone texture set for curved road ribbons (eliminates 4x UV stretching)
  const roadCobbleColor = textures.cobbleMap.clone();
  roadCobbleColor.repeat.set(1, 1);
  roadCobbleColor.needsUpdate = true;
  const roadCobbleNormal = textures.cobbleNormal.clone();
  roadCobbleNormal.repeat.set(1, 1);
  roadCobbleNormal.needsUpdate = true;
  const roadCobbleRough = textures.cobbleRough.clone();
  roadCobbleRough.repeat.set(1, 1);
  roadCobbleRough.needsUpdate = true;

  const roadRibbonMat = new THREE.MeshStandardMaterial({
    map: roadCobbleColor,
    normalMap: roadCobbleNormal,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughnessMap: roadCobbleRough,
    color: 0xffffff,
    roughness: 0.88,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const curbMat = new THREE.MeshStandardMaterial({
    map: textures.sandstoneMap,
    normalMap: textures.sandstoneNormal,
    normalScale: new THREE.Vector2(0.5, 0.5),
    color: 0x9b9589,
    roughness: 0.88,
    metalness: 0.03,
  });

  const sandstonePlazaMat = new THREE.MeshStandardMaterial({
    map: textures.sandstoneMap,
    normalMap: textures.sandstoneNormal,
    normalScale: new THREE.Vector2(0.8, 0.8),
    roughnessMap: textures.sandstoneRough,
    color: 0xffffff,
    roughness: 0.84,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const aprons = [
    { x: SPAWN_POSITION.x, z: SPAWN_POSITION.z, r: 7.4, mat: roadMat },
    ...LANDMARKS.filter((lm) => lm.id !== 'janaki-mandir').map((lm) => ({
      x: lm.position.x,
      z: lm.position.z,
      r: lm.id === 'boudhanath-stupa' ? 8.2 : lm.id === 'pumdikot-shiva' ? 7.6 : 7.0,
      mat: lm.id === 'vit-vellore-tower' ? sandstonePlazaMat : roadMat,
    })),
  ];

  for (const ap of aprons) {
    const y = groundHeightAt(ap.x, ap.z);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(ap.r, ap.r + 0.45, 0.14, 32), ap.mat);
    pad.position.set(ap.x, y + 0.03, ap.z);
    pad.receiveShadow = true;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(ap.r, 0.16, 8, 36), curbMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(ap.x, y + 0.08, ap.z);
    rim.receiveShadow = true;
    rim.castShadow = true;
    group.add(pad, rim);
  }

  const curbTransforms: THREE.Matrix4[] = [];
  for (const rawPts of ROAD_PATHS) {
    const pts = trimPathBetweenPlazas(rawPts, aprons);
    const curve = new THREE.CatmullRomCurve3(
      pts.map(([x, z]) => new THREE.Vector3(x, groundHeightAt(x, z), z)),
    );
    const len = curve.getLength();
    if (len < 1.5) continue;
    const steps = Math.max(16, Math.min(120, Math.floor(len * 0.75)));
    const width = 4.0;
    const shoulder = 0.65;
    const uvScale = 0.28;

    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const p = curve.getPointAt(t);
      const tan = curve.getTangentAt(t);
      const nx = -tan.z;
      const nz = tan.x;
      const nLen = Math.hypot(nx, nz) || 1;
      const dirX = nx / nLen;
      const dirZ = nz / nLen;
      const halfW = width * 0.5;
      const outerW = halfW + shoulder;

      const lx = p.x - dirX * halfW;
      const lz = p.z - dirZ * halfW;
      const rxp = p.x + dirX * halfW;
      const rzp = p.z + dirZ * halfW;
      const slx = p.x - dirX * outerW;
      const slz = p.z - dirZ * outerW;
      const srx = p.x + dirX * outerW;
      const srz = p.z + dirZ * outerW;

      // Level cross-section deck height so left & right road edges never cant or sink under sloped grass
      const deckY =
        Math.max(
          groundHeightAt(p.x, p.z),
          groundHeightAt(lx, lz),
          groundHeightAt(rxp, rzp),
        ) + 0.016;
      const skirtY = deckY - 0.22;

      positions.push(
        slx, skirtY, slz,
        lx, deckY, lz,
        rxp, deckY, rzp,
        srx, skirtY, srz,
      );

      const v = t * len * uvScale;
      uvs.push(
        -shoulder * uvScale, v,
        0, v,
        width * uvScale, v,
        (width + shoulder) * uvScale, v,
      );

      if (i < steps) {
        const base = i * 4;
        const next = base + 4;
        // Left sloped shoulder, flat level crown deck, right sloped shoulder
        indices.push(base, base + 1, next);
        indices.push(base + 1, next + 1, next);
        indices.push(base + 1, base + 2, next + 1);
        indices.push(base + 2, next + 2, next + 1);
        indices.push(base + 2, base + 3, next + 2);
        indices.push(base + 3, next + 3, next + 2);
      }

      if (i % 2 === 0) {
        for (const side of [-1, 1]) {
          const cx = p.x + dirX * (halfW + 0.16) * side;
          const cz = p.z + dirZ * (halfW + 0.16) * side;
          // Exclude road curb blocks inside Janaki Chowk plaza or overlapping its East/South gate thresholds
          if (cx > -131.5 && cx < -53.0 && cz > 70 && cz < 150.4) continue;
          const cy = deckY;
          if (cy > -0.1) {
            _vec3.set(cx, cy + 0.035, cz);
            _quat.setFromEuler(_euler.set(0, Math.atan2(tan.x, tan.z), 0));
            _scale.set(1, 1, 1);
            _mat4.compose(_vec3, _quat, _scale);
            curbTransforms.push(_mat4.clone());
          }
        }
      }
    }

    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    roadGeo.setIndex(indices);
    roadGeo.computeVertexNormals();
    const roadMesh = new THREE.Mesh(roadGeo, roadRibbonMat);
    roadMesh.receiveShadow = true;
    group.add(roadMesh);
  }

  if (curbTransforms.length > 0) {
    const curbGeo = new THREE.BoxGeometry(0.32, 0.18, 0.72);
    const curbInst = new THREE.InstancedMesh(curbGeo, curbMat, curbTransforms.length);
    curbTransforms.forEach((m, i) => curbInst.setMatrixAt(i, m));
    curbInst.castShadow = true;
    curbInst.receiveShadow = true;
    curbInst.instanceMatrix.needsUpdate = true;
    curbInst.computeBoundingSphere();
    group.add(curbInst);
  }

  const lanternCoords = ROAD_LANTERN_COORDS;
  const lanternStoneMat = new THREE.MeshStandardMaterial({
    map: textures.cobbleMap,
    normalMap: textures.cobbleNormal,
    color: 0x8b8a84,
    roughness: 0.88,
  });
  const lanternBronzeMat = new THREE.MeshStandardMaterial({
    color: 0x8c6427,
    roughness: 0.34,
    metalness: 0.84,
  });
  const lanternGlowMat = new THREE.MeshStandardMaterial({
    color: 0xffdf9e,
    emissive: 0xe69832,
    emissiveIntensity: 2.2,
    roughness: 0.25,
  });

  const lanternShaftGeo = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.22, 0.0),
      new THREE.Vector2(0.23, 0.08),
      new THREE.Vector2(0.16, 0.16),
      new THREE.Vector2(0.18, 0.34),
      new THREE.Vector2(0.12, 0.56),
      new THREE.Vector2(0.15, 0.86),
      new THREE.Vector2(0.11, 1.18),
      new THREE.Vector2(0.17, 1.34),
      new THREE.Vector2(0.22, 1.44),
      new THREE.Vector2(0.0, 1.44),
    ],
    18,
  );
  const lanternFinialGeo = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.1, 0.0),
      new THREE.Vector2(0.11, 0.04),
      new THREE.Vector2(0.05, 0.08),
      new THREE.Vector2(0.08, 0.15),
      new THREE.Vector2(0.04, 0.22),
      new THREE.Vector2(0.02, 0.28),
      new THREE.Vector2(0.0, 0.34),
    ],
    14,
  );
  const lanternEaveGeo = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.0, 0.34),
      new THREE.Vector2(0.16, 0.24),
      new THREE.Vector2(0.32, 0.12),
      new THREE.Vector2(0.46, 0.03),
      new THREE.Vector2(0.42, 0.0),
      new THREE.Vector2(0.0, 0.0),
    ],
    8,
  );

  lanternCoords.forEach(([lx, lz], idx) => {
    const ly = groundHeightAt(lx, lz);
    const post = new THREE.Group();
    post.position.set(lx, ly, lz);

    const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.2, 0.62), lanternStoneMat);
    plinth.position.y = 0.1;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    const baseCollar = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.48), lanternStoneMat);
    baseCollar.position.y = 0.26;
    const shaft = new THREE.Mesh(lanternShaftGeo, lanternStoneMat);
    shaft.position.y = 0.32;
    shaft.castShadow = true;

    const cageBase = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.07, 0.46), lanternStoneMat);
    cageBase.position.y = 1.79;
    const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.34, 8), lanternGlowMat);
    housing.position.y = 1.99;
    for (const mx of [-0.16, 0.16]) {
      for (const mz of [-0.16, 0.16]) {
        const mullion = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.028, 0.38, 6), lanternStoneMat);
        mullion.position.set(mx, 1.99, mz);
        post.add(mullion);
      }
    }
    const brassCollar = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.018, 8, 16), lanternBronzeMat);
    brassCollar.rotation.x = Math.PI / 2;
    brassCollar.position.y = 2.16;

    const roof = new THREE.Mesh(lanternEaveGeo, lanternStoneMat);
    roof.position.y = 2.18;
    roof.rotation.y = Math.PI / 8;
    roof.castShadow = true;
    const finial = new THREE.Mesh(lanternFinialGeo, lanternBronzeMat);
    finial.position.y = 2.5;

    post.add(plinth, baseCollar, shaft, cageBase, housing, brassCollar, roof, finial);
    if (idx % 3 === 0) {
      const ptLight = new THREE.PointLight(0xffb85c, 1.6, 18, 1.7);
      ptLight.position.set(0, 1.99, 0);
      post.add(ptLight);
      lanternLights.push(ptLight);
    }
    group.add(post);
  });

  return { group, lanternLights };
}

export function createInstancedFoliage(
  textures: ProceduralTextureSet,
): THREE.Group {
  const group = new THREE.Group();
  const treeSpots = getWorldTreeSpots();

  const deodars = treeSpots.filter((t) => t.type === 'deodar');
  const rhodos = treeSpots.filter((t) => t.type === 'rhodo');
  const palms = treeSpots.filter((t) => t.type === 'palm');

  const barkMat = new THREE.MeshStandardMaterial({
    map: textures.barkMap,
    normalMap: textures.barkNormal,
    normalScale: new THREE.Vector2(1.0, 1.0),
    color: 0xffffff,
    roughness: 0.92,
  });

  // 1. Dense Multi-Tiered Himalayan Deodar / Spruce Cedars (overlapping organic scalloped bough tiers)
  if (deodars.length > 0) {
    const trunkGeo = new THREE.CylinderGeometry(0.08, 0.28, 4.3, 9);
    trunkGeo.translate(0, 2.15, 0);

    const makeBoughTier = (r: number, h: number, yPos: number, seed: number) => {
      const cGeo = new THREE.ConeGeometry(r, h, 18, 4, false);
      const p = cGeo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const vx = p.getX(i);
        const vy = p.getY(i);
        const vz = p.getZ(i);
        const angle = Math.atan2(vz, vx);
        const normY = (vy + h * 0.5) / h; // 0 = bottom rim, 1 = tip
        const branchLobe =
          0.26 * Math.sin(angle * 7 + seed) +
          0.16 * Math.cos(angle * 11 - seed * 1.4) +
          0.09 * Math.sin(angle * 17 + seed * 0.6);
        const rimFlute = (1 - normY) * branchLobe;
        const radial = Math.hypot(vx, vz);
        if (radial > 0.01) {
          const factor = 1 + rimFlute;
          const droop = (1 - normY) * -0.22 * (0.45 + 0.55 * Math.sin(angle * 7 + seed));
          p.setXYZ(i, vx * factor, vy + droop, vz * factor);
        }
      }
      cGeo.computeVertexNormals();
      cGeo.translate(0, yPos, 0);
      return cGeo;
    };

    const t1 = makeBoughTier(1.72, 1.45, 2.0, 0.4);
    const t2 = makeBoughTier(1.46, 1.38, 2.8, 1.6);
    const t3 = makeBoughTier(1.18, 1.28, 3.55, 2.8);
    const t4 = makeBoughTier(0.88, 1.15, 4.25, 4.1);
    const t5 = makeBoughTier(0.56, 0.95, 4.88, 5.3);

    const pineMat = new THREE.MeshStandardMaterial({
      map: textures.pineCanopyMap,
      normalMap: textures.rockNormal,
      normalScale: new THREE.Vector2(0.45, 0.45),
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.01,
    });

    const mTrunks = new THREE.InstancedMesh(trunkGeo, barkMat, deodars.length);
    const mT1 = new THREE.InstancedMesh(t1, pineMat, deodars.length);
    const mT2 = new THREE.InstancedMesh(t2, pineMat, deodars.length);
    const mT3 = new THREE.InstancedMesh(t3, pineMat, deodars.length);
    const mT4 = new THREE.InstancedMesh(t4, pineMat, deodars.length);
    const mT5 = new THREE.InstancedMesh(t5, pineMat, deodars.length);

    deodars.forEach((p, idx) => {
      const y = groundHeightAt(p.x, p.z);
      _vec3.set(p.x, y - 0.06, p.z);
      _quat.setFromEuler(_euler.set(0, idx * 1.15, 0));
      _scale.set(p.scale, p.scale * (0.95 + (idx % 3) * 0.08), p.scale);
      _mat4.compose(_vec3, _quat, _scale);
      mTrunks.setMatrixAt(idx, _mat4);
      mT1.setMatrixAt(idx, _mat4);
      mT2.setMatrixAt(idx, _mat4);
      mT3.setMatrixAt(idx, _mat4);
      mT4.setMatrixAt(idx, _mat4);
      mT5.setMatrixAt(idx, _mat4);

      const tint = idx % 3;
      // Subtle ambient-occlusion vertical gradient from deep shaded lower boughs to sunlit crown tip
      _color.setHex(tint === 0 ? 0x6f846b : tint === 1 ? 0x677c64 : 0x768b71);
      mT1.setColorAt(idx, _color);
      _color.setHex(tint === 0 ? 0x7c9277 : tint === 1 ? 0x73886f : 0x84997e);
      mT2.setColorAt(idx, _color);
      _color.setHex(tint === 0 ? 0x89a083 : tint === 1 ? 0x80967b : 0x91a88b);
      mT3.setColorAt(idx, _color);
      _color.setHex(tint === 0 ? 0x96ad8f : tint === 1 ? 0x8da487 : 0x9eb696);
      mT4.setColorAt(idx, _color);
      _color.setHex(tint === 0 ? 0xa3ba9b : tint === 1 ? 0x9ab192 : 0xabc2a3);
      mT5.setColorAt(idx, _color);
    });

    [mTrunks, mT1, mT2, mT3, mT4, mT5].forEach((m) => {
      m.castShadow = true;
      m.receiveShadow = true;
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      m.computeBoundingSphere();
      group.add(m);
    });
  }

  // 2. Real Organic Himalayan Rhododendrons (Lali Gurans) with smooth organic crowns & crimson blossoms
  if (rhodos.length > 0) {
    const rTrunkGeo = new THREE.CylinderGeometry(0.11, 0.23, 2.0, 9);
    rTrunkGeo.translate(0, 1.0, 0);

    const makeOrganicCanopy = (radius: number, ox: number, oy: number, oz: number) => {
      const g = new THREE.IcosahedronGeometry(radius, 2);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const vx = p.getX(i);
        const vy = p.getY(i);
        const vz = p.getZ(i);
        const disp = 0.86 + 0.22 * Math.sin(vx * 3.8 + vz * 2.9) * Math.cos(vy * 4.2);
        p.setXYZ(i, vx * disp + ox, vy * disp * 0.78 + oy, vz * disp + oz);
      }
      g.computeVertexNormals();
      return g;
    };

    const rLeaf1Geo = makeOrganicCanopy(1.06, -0.25, 2.45, 0.12);
    const rLeaf2Geo = makeOrganicCanopy(0.9, 0.34, 2.78, -0.18);
    const rBloom1Geo = makeOrganicCanopy(0.24, 0.65, 3.05, 0.36);
    const rBloom2Geo = makeOrganicCanopy(0.22, -0.56, 2.75, -0.38);
    const rBloom3Geo = makeOrganicCanopy(0.2, 0.08, 3.3, 0.24);

    const leafMat = new THREE.MeshStandardMaterial({
      normalMap: textures.meadowNormal,
      normalScale: new THREE.Vector2(0.45, 0.45),
      color: 0x2c4a2b,
      roughness: 0.82,
    });
    const bloomMat = new THREE.MeshStandardMaterial({
      color: 0xa11b2d,
      roughness: 0.62,
    });

    const rTrunks = new THREE.InstancedMesh(rTrunkGeo, barkMat, rhodos.length);
    const rLeaves1 = new THREE.InstancedMesh(rLeaf1Geo, leafMat, rhodos.length);
    const rLeaves2 = new THREE.InstancedMesh(rLeaf2Geo, leafMat, rhodos.length);
    const rBlooms1 = new THREE.InstancedMesh(rBloom1Geo, bloomMat, rhodos.length);
    const rBlooms2 = new THREE.InstancedMesh(rBloom2Geo, bloomMat, rhodos.length);
    const rBlooms3 = new THREE.InstancedMesh(rBloom3Geo, bloomMat, rhodos.length);

    rhodos.forEach((p, idx) => {
      const y = groundHeightAt(p.x, p.z);
      _vec3.set(p.x, y - 0.05, p.z);
      _quat.setFromEuler(_euler.set(0, idx * 1.3, 0));
      _scale.setScalar(p.scale);
      _mat4.compose(_vec3, _quat, _scale);
      rTrunks.setMatrixAt(idx, _mat4);
      rLeaves1.setMatrixAt(idx, _mat4);
      rLeaves2.setMatrixAt(idx, _mat4);
      rBlooms1.setMatrixAt(idx, _mat4);
      rBlooms2.setMatrixAt(idx, _mat4);
      rBlooms3.setMatrixAt(idx, _mat4);
    });
    [rTrunks, rLeaves1, rLeaves2, rBlooms1, rBlooms2, rBlooms3].forEach((m) => {
      m.castShadow = true;
      m.receiveShadow = true;
      m.instanceMatrix.needsUpdate = true;
      m.computeBoundingSphere();
      group.add(m);
    });
  }

  // 3. Vellore Campus Tropical Coconut Palms with Pinnate Leaflets (palmFrondMap alphaTest)
  if (palms.length > 0) {
    const palmMat = new THREE.MeshStandardMaterial({
      map: textures.palmFrondMap,
      alphaTest: 0.38,
      color: 0xdbe6cc,
      roughness: 0.74,
      side: THREE.DoubleSide,
    });
    const coconutMat = new THREE.MeshStandardMaterial({ color: 0x4f3a1e, roughness: 0.82 });

    const frondGeo = new THREE.PlaneGeometry(0.95, 2.55, 2, 7);
    const fPos = frondGeo.attributes.position;
    for (let i = 0; i < fPos.count; i++) {
      const fx = fPos.getX(i);
      const fy = fPos.getY(i) + 1.275; // 0..2.55
      const t = fy / 2.55;
      const archY = Math.sin(t * Math.PI * 0.75) * 0.56 - t * t * 0.92;
      fPos.setXYZ(i, fx, archY, fy);
    }
    frondGeo.computeVertexNormals();

    palms.forEach((p, idx) => {
      const y = groundHeightAt(p.x, p.z);
      const palmGroup = new THREE.Group();
      palmGroup.position.set(p.x, y - 0.05, p.z);
      palmGroup.scale.setScalar(p.scale);
      palmGroup.rotation.y = idx * 1.1;

      const curvePts = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.14, 1.45, 0.06),
        new THREE.Vector3(0.32, 3.05, 0.14),
        new THREE.Vector3(0.4, 4.65, 0.2),
      ];
      const trunkGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curvePts), 12, 0.15, 8, false);
      const trunk = new THREE.Mesh(trunkGeo, barkMat);
      trunk.castShadow = true;
      palmGroup.add(trunk);

      const crownOrigin = new THREE.Vector3(0.4, 4.62, 0.2);
      for (let c = 0; c < 4; c++) {
        const a = (c / 4) * Math.PI * 2;
        const nut = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), coconutMat);
        nut.position.set(
          crownOrigin.x + Math.cos(a) * 0.16,
          crownOrigin.y - 0.14,
          crownOrigin.z + Math.sin(a) * 0.16,
        );
        palmGroup.add(nut);
      }

      for (let f = 0; f < 9; f++) {
        const frond = new THREE.Mesh(frondGeo, palmMat);
        const angle = (f / 9) * Math.PI * 2 + (idx % 3) * 0.25;
        frond.position.copy(crownOrigin);
        frond.rotation.y = angle;
        frond.rotation.x = f % 2 === 0 ? 0.08 : 0.24;
        frond.castShadow = true;
        palmGroup.add(frond);
      }
      group.add(palmGroup);
    });
  }

  // 4. Real Subdivided Displaced Granite Field Boulders across the 200m valley
  const rockSpots = getWorldBoulderSpots();

  const rockGeo = new THREE.IcosahedronGeometry(0.75, 2);
  const rPos = rockGeo.attributes.position;
  for (let i = 0; i < rPos.count; i++) {
    const vx = rPos.getX(i);
    const vy = rPos.getY(i);
    const vz = rPos.getZ(i);
    const crag = 0.78 + 0.26 * Math.sin(vx * 3.4 + vz * 2.1) * Math.cos(vy * 3.9 - vx * 1.4);
    rPos.setXYZ(i, vx * crag, vy * crag, vz * crag);
  }
  rockGeo.computeVertexNormals();

  const rockMat = new THREE.MeshStandardMaterial({
    normalMap: textures.rockNormal,
    normalScale: new THREE.Vector2(1.0, 1.0),
    color: 0xffffff,
    roughness: 0.9,
  });
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, rockSpots.length);
  rocks.castShadow = true;
  rocks.receiveShadow = true;

  rockSpots.forEach((rp, i) => {
    const ry = groundHeightAt(rp.x, rp.z);
    _vec3.set(rp.x, ry + 0.08, rp.z);
    _quat.setFromEuler(_euler.set(rp.idx * 0.5, rp.idx * 1.2, 0));
    _scale.set(0.7 + (rp.idx % 4) * 0.22, 0.45 + (rp.idx % 3) * 0.16, 0.7 + ((rp.idx + 1) % 4) * 0.2);
    _mat4.compose(_vec3, _quat, _scale);
    rocks.setMatrixAt(i, _mat4);
    const s = 0.42 + (rp.idx % 5) * 0.04;
    _color.setRGB(s + 0.03, s + 0.02, s);
    rocks.setColorAt(i, _color);
  });
  rocks.instanceMatrix.needsUpdate = true;
  if (rocks.instanceColor) rocks.instanceColor.needsUpdate = true;
  rocks.computeBoundingSphere();
  group.add(rocks);

  return group;
}

/**
 * Himalayan Cliffside Monastery (image_22cbe3ee) perched on a northern gneiss crag spur
 * alongside a Sherpa Stone Tea-House Lodge (image_b2a55a1e) below Ama Dablam.
 */
export function createHimalayanGompaAndLodge(textures: ProceduralTextureSet): THREE.Group {
  const group = new THREE.Group();

  const cragMat = new THREE.MeshStandardMaterial({
    normalMap: textures.rockNormal,
    normalScale: new THREE.Vector2(1.0, 1.0),
    color: 0x3b3f47,
    roughness: 0.92,
  });
  const whiteWallMat = new THREE.MeshStandardMaterial({
    normalMap: textures.sandstoneNormal,
    normalScale: new THREE.Vector2(0.35, 0.35),
    color: 0xd4cec2,
    roughness: 0.9,
  });
  const crimsonMat = new THREE.MeshStandardMaterial({ color: 0x6f211c, roughness: 0.82 });
  const timberMat = new THREE.MeshStandardMaterial({
    map: textures.woodMap,
    normalMap: textures.woodNormal,
    color: 0x5c3e26,
    roughness: 0.84,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xc9942a,
    roughness: 0.3,
    metalness: 0.85,
  });
  const warmWinMat = new THREE.MeshStandardMaterial({
    color: 0xffdf99,
    emissive: 0xe68c1e,
    emissiveIntensity: 2.1,
  });

  // 1. Cliffside Tibetan-Nepali Gompa Monastery at (-48, -182) perched on Himalayan foothills
  const gompa = new THREE.Group();
  const gx = -48;
  const gz = -182;
  gompa.position.set(gx, groundHeightAt(gx, gz), gz);
  gompa.rotation.y = 0.24;
  gompa.scale.setScalar(2.35);

  const cliffMain = new THREE.Mesh(new THREE.ConeGeometry(4.4, 9.6, 7), cragMat);
  cliffMain.position.set(0, 4.2, -1.5);
  cliffMain.scale.set(1.2, 1, 0.9);
  cliffMain.castShadow = true;
  cliffMain.receiveShadow = true;
  const cliffLedge = new THREE.Mesh(new THREE.BoxGeometry(5.6, 3.6, 3.2), cragMat);
  cliffLedge.position.set(0, 2.2, 0.6);
  cliffLedge.castShadow = true;
  gompa.add(cliffMain, cliffLedge);

  for (let s = 0; s < 8; s++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.28, 0.65), cragMat);
    step.position.set(-2.6 + s * 0.26, 0.4 + s * 0.42, 2.4 - s * 0.12);
    gompa.add(step);
  }

  const hall = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.1, 2.4), whiteWallMat);
  hall.position.set(0, 4.75, 0.65);
  hall.castShadow = true;
  const frieze = new THREE.Mesh(new THREE.BoxGeometry(4.32, 0.36, 2.52), crimsonMat);
  frieze.position.set(0, 5.55, 0.65);
  const timberGallery = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.72, 0.55), timberMat);
  timberGallery.position.set(0, 4.65, 1.98);
  const roofLower = new THREE.Mesh(new THREE.ConeGeometry(3.2, 0.72, 4), crimsonMat);
  roofLower.rotation.y = Math.PI / 4;
  roofLower.position.set(0, 6.12, 0.65);
  const upperShrine = new THREE.Mesh(new THREE.BoxGeometry(1.85, 1.05, 1.55), whiteWallMat);
  upperShrine.position.set(0, 6.75, 0.65);
  const upperBand = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.24, 1.64), crimsonMat);
  upperBand.position.set(0, 7.12, 0.65);
  const roofTop = new THREE.Mesh(new THREE.ConeGeometry(1.65, 0.68, 4), goldMat);
  roofTop.rotation.y = Math.PI / 4;
  roofTop.position.set(0, 7.62, 0.65);
  const gyeltsen = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.55, 8), goldMat);
  gyeltsen.position.set(0, 8.16, 0.65);
  gompa.add(hall, frieze, timberGallery, roofLower, upperShrine, upperBand, roofTop, gyeltsen);

  for (const wx of [-1.25, 0, 1.25]) {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.54), warmWinMat);
    win.position.set(wx, 4.95, 1.87);
    gompa.add(win);
  }
  group.add(gompa);

  // 2. Sherpa Stone Tea-House Lodge at (-98, -176) below Ama Dablam
  const lodge = new THREE.Group();
  const lx = -98;
  const lz = -176;
  lodge.position.set(lx, groundHeightAt(lx, lz) + 0.18, lz);
  lodge.rotation.y = 0.18;
  lodge.scale.setScalar(2.15);

  const stoneMat = new THREE.MeshStandardMaterial({
    map: textures.cobbleMap,
    normalMap: textures.cobbleNormal,
    color: 0x8d887e,
    roughness: 0.9,
  });
  const blueRoofMat = new THREE.MeshStandardMaterial({ color: 0x24597c, roughness: 0.62 });
  const redRoofMat = new THREE.MeshStandardMaterial({ color: 0x8c2e28, roughness: 0.64 });

  const foundation = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.55, 5.0), cragMat);
  foundation.position.y = 0.275;
  foundation.receiveShadow = true;
  lodge.add(foundation);

  const mainWing = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.55, 2.3), stoneMat);
  mainWing.position.set(-0.9, 1.28, -0.35);
  mainWing.castShadow = true;
  const mainRoof = new THREE.Mesh(new THREE.ConeGeometry(3.2, 0.85, 4), blueRoofMat);
  mainRoof.rotation.y = Math.PI / 4;
  mainRoof.scale.set(1.25, 1, 0.72);
  mainRoof.position.set(-0.9, 2.45, -0.35);

  const sideWing = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.35, 2.1), stoneMat);
  sideWing.position.set(2.0, 1.18, 0.35);
  sideWing.castShadow = true;
  const sideRoof = new THREE.Mesh(new THREE.ConeGeometry(2.05, 0.75, 4), redRoofMat);
  sideRoof.rotation.y = Math.PI / 4;
  sideRoof.scale.set(1.05, 1, 0.85);
  sideRoof.position.set(2.0, 2.22, 0.35);

  for (const wx of [-2.1, -1.2, -0.3, 1.7]) {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), warmWinMat);
    win.position.set(wx, 1.38, wx > 1 ? 1.41 : 0.82);
    lodge.add(win);
  }
  const lowWall = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.34, 0.24), stoneMat);
  lowWall.position.set(-0.2, 0.65, 2.15);
  lodge.add(mainWing, mainRoof, sideWing, sideRoof, lowWall);
  group.add(lodge);

  return group;
}

/**
 * Fewa / Tilicho Turquoise Glacial Lake, Cliff Waterfall, Tal Barahi Island Mini-Pagoda
 * and 5 Colorful Wooden Doonga Boats (image_f25becb4, image_fa933aef, image_d009d284).
 */
export function createGlacialLakeAndWaterfall(
  textures: ProceduralTextureSet,
): AnimatedWaterController {
  const group = new THREE.Group();
  group.position.set(GLACIAL_LAKE.x, 0, GLACIAL_LAKE.z);

  const uTime = { value: 0 };

  // 1. Turquoise Alpine Lake Surface with mineral gradient & shoreline ripples
  const lakeGeo = new THREE.CircleGeometry(GLACIAL_LAKE.waterRadius + 0.15, 48);
  lakeGeo.rotateX(-Math.PI / 2);
  const lakeMat = new THREE.MeshStandardMaterial({
    color: 0x1c727d,
    normalMap: textures.waterNormal,
    normalScale: new THREE.Vector2(0.36, 0.36),
    roughness: 0.08,
    metalness: 0.44,
    transparent: true,
    opacity: 0.9,
  });
  applyRealisticWaterShader(lakeMat, uTime, {
    mode: 'lake',
    maxRadius: GLACIAL_LAKE.waterRadius,
    flowSpeed: 1.5,
    deepTint: 0x0b3b47,
    shallowTint: 0x247378,
  });
  const lakeSurface = new THREE.Mesh(lakeGeo, lakeMat);
  lakeSurface.position.y = GLACIAL_LAKE.waterLevel;
  lakeSurface.receiveShadow = true;
  group.add(lakeSurface);

  // 2. Stepped North Rock Cliff & Cascading Waterfall feeding the 26m Glacial Lake
  const cliffMat = new THREE.MeshStandardMaterial({
    normalMap: textures.rockNormal,
    normalScale: new THREE.Vector2(0.95, 0.95),
    color: 0x3b4046,
    roughness: 0.9,
  });
  const fallWall = new THREE.Mesh(new THREE.BoxGeometry(18.0, 15.5, 7.5), cliffMat);
  fallWall.position.set(-1.5, 5.6, -24.5);
  fallWall.castShadow = true;
  fallWall.receiveShadow = true;
  const ledgeL = new THREE.Mesh(new THREE.ConeGeometry(6.8, 13.0, 7), cliffMat);
  ledgeL.position.set(-9.5, 4.6, -22.5);
  const ledgeR = new THREE.Mesh(new THREE.ConeGeometry(6.2, 12.2, 7), cliffMat);
  ledgeR.position.set(6.5, 4.2, -23.0);
  group.add(fallWall, ledgeL, ledgeR);

  const cascadeMat = new THREE.MeshStandardMaterial({
    color: 0xc2d8df,
    emissive: 0x6ea8b8,
    emissiveIntensity: 0.45,
    roughness: 0.25,
    transparent: true,
    opacity: 0.82,
    side: THREE.DoubleSide,
  });
  const fallRibbon1 = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 14.2, 4, 10), cascadeMat);
  fallRibbon1.position.set(-2.0, 5.8, -20.5);
  fallRibbon1.rotation.x = -0.14;
  const fallRibbon2 = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 13.2, 4, 8), cascadeMat);
  fallRibbon2.position.set(1.5, 5.2, -20.7);
  fallRibbon2.rotation.x = -0.16;
  const splashRing = new THREE.Mesh(
    new THREE.RingGeometry(1.4, 4.2, 24),
    new THREE.MeshBasicMaterial({
      color: 0xc8dee6,
      transparent: true,
      opacity: 0.56,
      side: THREE.DoubleSide,
    }),
  );
  splashRing.rotation.x = -Math.PI / 2;
  splashRing.position.set(-0.8, GLACIAL_LAKE.waterLevel + 0.04, -18.8);
  group.add(fallRibbon1, fallRibbon2, splashRing);

  // 3. Tal Barahi Island Mini-Pagoda at center-west of lake
  const islet = new THREE.Group();
  islet.position.set(-1.5, GLACIAL_LAKE.waterLevel, -1.2);
  islet.scale.setScalar(2.35);
  const islandStone = new THREE.Mesh(
    new THREE.CylinderGeometry(1.55, 2.05, 0.58, 12),
    cliffMat,
  );
  islandStone.position.y = 0.08;
  const brickMat = new THREE.MeshStandardMaterial({
    map: textures.brickMap,
    normalMap: textures.brickNormal,
    color: 0xffffff,
    roughness: 0.8,
  });
  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xba8628,
    roughness: 0.32,
    metalness: 0.84,
  });
  const miniBody = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.92, 1.15), brickMat);
  miniBody.position.y = 0.78;
  const miniRoof1 = new THREE.Mesh(new THREE.ConeGeometry(1.12, 0.52, 4), copperMat);
  miniRoof1.rotation.y = Math.PI / 4;
  miniRoof1.position.y = 1.42;
  const miniRoof2 = new THREE.Mesh(new THREE.ConeGeometry(0.74, 0.42, 4), copperMat);
  miniRoof2.rotation.y = Math.PI / 4;
  miniRoof2.position.y = 1.84;
  const miniGajur = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.34, 8), copperMat);
  miniGajur.position.y = 2.18;
  islet.add(islandStone, miniBody, miniRoof1, miniRoof2, miniGajur);
  group.add(islet);

  // 4. 5 Colorful Wooden Fewa Doonga Boats moored near shoreline + drifting gently
  const boatColors = [0xb8352b, 0x2763a8, 0xd49a24, 0x2d784d, 0xc85a2b];
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xcfc9bc, roughness: 0.78 });
  const oarMat = new THREE.MeshStandardMaterial({ color: 0x6b4b2a, roughness: 0.82 });
  const boats: Array<{ obj: THREE.Group; baseY: number; phase: number; baseRotZ: number }> = [];

  const boatAnchors: Array<[number, number, number]> = [
    [11.5, 11.2, 0.55],
    [13.4, 6.8, 0.75],
    [8.2, 14.5, 0.32],
    [-12.2, 9.8, -0.68],
    [-14.6, 4.8, -0.92],
  ];

  boatAnchors.forEach(([bx, bz, rotY], idx) => {
    const boat = new THREE.Group();
    boat.position.set(bx, GLACIAL_LAKE.waterLevel + 0.05, bz);
    boat.rotation.y = rotY;
    boat.scale.setScalar(1.45);

    const hullMat = new THREE.MeshStandardMaterial({
      color: boatColors[idx % boatColors.length],
      roughness: 0.72,
    });
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.16, 1.65, 10), hullMat);
    hull.rotation.x = Math.PI / 2;
    hull.scale.set(1.0, 1.0, 0.65);
    hull.castShadow = true;
    const gunwale = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.42, 10), trimMat);
    gunwale.rotation.x = Math.PI / 2;
    gunwale.scale.set(1.02, 1.0, 0.25);
    gunwale.position.y = 0.08;
    const seat1 = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.05, 0.18), oarMat);
    seat1.position.set(0, 0.12, -0.25);
    const seat2 = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.05, 0.18), oarMat);
    seat2.position.set(0, 0.12, 0.25);
    const oar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.3, 6), oarMat);
    oar.rotation.x = Math.PI / 2;
    oar.rotation.z = 0.16;
    oar.position.set(0.14, 0.15, 0);

    boat.add(hull, gunwale, seat1, seat2, oar);
    group.add(boat);
    boats.push({
      obj: boat,
      baseY: GLACIAL_LAKE.waterLevel + 0.05,
      phase: idx * 1.15,
      baseRotZ: 0,
    });
  });

  // Wooden mooring dock jetty at south-east shore
  const jetty = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.22, 4.4), oarMat);
  jetty.position.set(14.0, GLACIAL_LAKE.waterLevel + 0.3, 15.2);
  jetty.rotation.y = -0.68;
  jetty.castShadow = true;
  group.add(jetty);

  return {
    group,
    update: (elapsed: number) => {
      uTime.value = elapsed;
      const splashScale = 0.85 + (Math.sin(elapsed * 4.5) * 0.5 + 0.5) * 0.35;
      splashRing.scale.setScalar(splashScale);
      cascadeMat.opacity = 0.72 + Math.sin(elapsed * 7.2) * 0.12;
      for (const b of boats) {
        b.obj.position.y = b.baseY + Math.sin(elapsed * 1.8 + b.phase) * 0.035;
        b.obj.rotation.z = Math.sin(elapsed * 1.3 + b.phase) * 0.055;
        b.obj.rotation.x = Math.cos(elapsed * 1.1 + b.phase) * 0.035;
      }
    },
  };
}


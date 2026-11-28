import * as THREE from 'three';
import { LANDMARKS } from '../data/portfolioData';
import { createRectangularHipRoofGeometry } from './janakiMandirCraft';
import { buildPeaceLantern } from './lumbiniShrines';
import { ProceduralTextureSet } from './proceduralTextures';
import {
  BRIDGE_BOUNDS,
  GLACIAL_LAKE,
  GraphicsQualityPreset,
  LUMBINI_FENCE_BOUNDS,
  LUMBINI_PEACE_CANAL,
  LUMBINI_SACRED_POND,
  OUTER_TEMPLE_ARTIFACT_SPOTS,
  ROAD_LANTERN_COORDS,
  ROAD_PATHS,
  SPAWN_POSITION,
  TreeSpecies,
  TreeSpot,
  WeatherKind,
  getGraphicsQualityConfig,
  getMeadowZoneAt,
  getRiverCenterX,
  getWorldBoulderSpots,
  getWorldTreeSpots,
  groundHeightAt,
  isInLumbiniSurroundingPond,
  isOnLumbiniBridgeAbutmentPier,
  isOnLumbiniCanalBridge,
  isOnLumbiniSacredBridge,
} from './worldLogic';
import {
  isInBoudhaHardSurface,
  isInBoudhaPrecinct,
} from './boudhanathData';
import {
  isInPumdikotHardSurface,
  isInPumdikotPrecinct,
} from './pumdikotData';
import { applyRealisticWaterShader } from './waterShader';
import { getCachedMaterial, getCachedTexture, mergeStaticMeshesByMaterial } from './meshOptimization';
import { createHimalayanAmphitheater } from './himalayaAmphitheater';

export const WORLD_HAZE_UNIFORMS = {
  uHazeColor: { value: new THREE.Color('#c9dfef') },
  uSunDir: { value: new THREE.Vector3(0.5, 0.6, 0.4).normalize() },
  uSunColor: { value: new THREE.Color('#fff1db') },
  uHazeDensity: { value: 0.0028 },
  uHeightFalloff: { value: 0.055 },
  uMaxHaze: { value: 0.84 },
};

/**
 * Injects height-attenuated volumetric distance haze & aerial sun-scattering perspective
 * onto large landscape/mountain PBR materials so distant Himalayan ridges gain scale and depth.
 */
export function applyVolumetricHazeShader(mat: THREE.MeshStandardMaterial): void {
  mat.customProgramCacheKey = () => 'volumetric-haze-v1';
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uHazeColor = WORLD_HAZE_UNIFORMS.uHazeColor;
    shader.uniforms.uSunDir = WORLD_HAZE_UNIFORMS.uSunDir;
    shader.uniforms.uSunColor = WORLD_HAZE_UNIFORMS.uSunColor;
    shader.uniforms.uHazeDensity = WORLD_HAZE_UNIFORMS.uHazeDensity;
    shader.uniforms.uHeightFalloff = WORLD_HAZE_UNIFORMS.uHeightFalloff;
    shader.uniforms.uMaxHaze = WORLD_HAZE_UNIFORMS.uMaxHaze;

    shader.vertexShader = `varying vec3 vHazeWorldPos;\n${shader.vertexShader}`.replace(
      '#include <project_vertex>',
      `#ifdef USE_INSTANCING
         vHazeWorldPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
       #else
         vHazeWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
       #endif
       #include <project_vertex>`,
    );

    shader.fragmentShader = `
      uniform vec3 uHazeColor;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      uniform float uHazeDensity;
      uniform float uHeightFalloff;
      uniform float uMaxHaze;
      varying vec3 vHazeWorldPos;
      ${shader.fragmentShader}
    `.replace(
      '#include <fog_fragment>',
      `#include <fog_fragment>
      {
        vec3 toFrag = vHazeWorldPos - cameraPosition;
        float fragDist = length(toFrag);
        vec3 rayDir = toFrag / max(fragDist, 0.0001);
        float camH = max(cameraPosition.y, -2.0);
        float fragH = max(vHazeWorldPos.y, -2.0);
        float avgH = mix(camH, fragH, 0.48);
        float heightAtten = exp(-max(0.0, avgH + 1.5) * uHeightFalloff);
        float opticalDepth = max(0.0, fragDist - 18.0) * uHazeDensity * (0.34 + 0.66 * heightAtten);
        float hazeFactor = clamp(1.0 - exp(-opticalDepth), 0.0, uMaxHaze);
        float sunScatter = pow(max(dot(rayDir, normalize(uSunDir)), 0.0), 5.0);
        vec3 aerialTint = mix(uHazeColor, mix(uHazeColor, uSunColor, 0.42), sunScatter * 0.65);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, aerialTint, hazeFactor);
      }`,
    );
  };
}

/**
 * Multi-layered procedural PBR ground shader blending Grass Turf, River/Verge Pebbles,
 * and Weathered Alpine Rock (albedo, tangent-space normal maps, roughness maps, and AO maps)
 * with world-space anti-tiling and organic noise breakup, plus volumetric aerial haze.
 */
export function applyTerrainMultiLayerShader(
  mat: THREE.MeshStandardMaterial,
  textures: ProceduralTextureSet,
  opts: { isHimalayas?: boolean } = {},
): void {
  const isHimalayas = Boolean(opts.isHimalayas);
  mat.customProgramCacheKey = () =>
    isHimalayas ? 'himalaya-multilayer-v1' : 'terrain-multilayer-v1';

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uHazeColor = WORLD_HAZE_UNIFORMS.uHazeColor;
    shader.uniforms.uSunDir = WORLD_HAZE_UNIFORMS.uSunDir;
    shader.uniforms.uSunColor = WORLD_HAZE_UNIFORMS.uSunColor;
    shader.uniforms.uHazeDensity = WORLD_HAZE_UNIFORMS.uHazeDensity;
    shader.uniforms.uHeightFalloff = WORLD_HAZE_UNIFORMS.uHeightFalloff;
    shader.uniforms.uMaxHaze = WORLD_HAZE_UNIFORMS.uMaxHaze;

    shader.uniforms.uGrassMap = { value: textures.meadowMap };
    shader.uniforms.uGrassNormal = { value: textures.meadowNormal };
    shader.uniforms.uGrassRough = { value: textures.meadowRough };
    shader.uniforms.uGrassAo = { value: textures.meadowAo ?? textures.meadowRough };

    shader.uniforms.uPebbleMap = { value: textures.pebbleMap ?? textures.meadowMap };
    shader.uniforms.uPebbleNormal = { value: textures.pebbleNormal ?? textures.rockNormal };
    shader.uniforms.uPebbleRough = { value: textures.pebbleRough ?? textures.meadowRough };
    shader.uniforms.uPebbleAo = { value: textures.pebbleAo ?? textures.rockAo };

    shader.uniforms.uRockMap = { value: textures.rockMap ?? textures.meadowMap };
    shader.uniforms.uRockNormal = { value: textures.rockNormal };
    shader.uniforms.uRockRough = { value: textures.rockRough ?? textures.meadowRough };
    shader.uniforms.uRockAo = { value: textures.rockAo };
    shader.uniforms.uIsHimalayas = { value: isHimalayas ? 1.0 : 0.0 };

    shader.vertexShader = `
      attribute vec3 aTerrainMix;
      attribute float aSnowMask;
      varying vec3 vHazeWorldPos;
      varying vec3 vTerrainWorldPos;
      varying vec3 vTerrainMix;
      varying float vTerrainSnow;
      ${shader.vertexShader}
    `.replace(
      '#include <project_vertex>',
      `vTerrainMix = aTerrainMix;
       vTerrainSnow = aSnowMask;
       #ifdef USE_INSTANCING
         vHazeWorldPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
       #else
         vHazeWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
       #endif
       vTerrainWorldPos = vHazeWorldPos;
       #include <project_vertex>`,
    );

    shader.fragmentShader = `
      uniform vec3 uHazeColor;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      uniform float uHazeDensity;
      uniform float uHeightFalloff;
      uniform float uMaxHaze;

      uniform sampler2D uGrassMap;
      uniform sampler2D uGrassNormal;
      uniform sampler2D uGrassRough;
      uniform sampler2D uGrassAo;

      uniform sampler2D uPebbleMap;
      uniform sampler2D uPebbleNormal;
      uniform sampler2D uPebbleRough;
      uniform sampler2D uPebbleAo;

      uniform sampler2D uRockMap;
      uniform sampler2D uRockNormal;
      uniform sampler2D uRockRough;
      uniform sampler2D uRockAo;
      uniform float uIsHimalayas;

      varying vec3 vHazeWorldPos;
      varying vec3 vTerrainWorldPos;
      varying vec3 vTerrainMix;
      varying float vTerrainSnow;

      float terrainHash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float terrainVNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        float a = terrainHash21(i);
        float b = terrainHash21(i + vec2(1.0, 0.0));
        float c = terrainHash21(i + vec2(0.0, 1.0));
        float d = terrainHash21(i + vec2(1.0, 1.0));
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }

      float terrainFbm2(vec2 p) {
        float v = terrainVNoise(p) * 0.65;
        v += terrainVNoise(p * 2.13 + vec2(7.4, 3.1)) * 0.35;
        return v;
      }

      vec2 terrainRot2(vec2 p, float a) {
        float c = cos(a);
        float s = sin(a);
        return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
      }
      ${shader.fragmentShader}
    `
      .replace(
        '#include <map_fragment>',
        `float terrainBlendRough = 0.9;
         vec3 terrainBlendMapN = vec3(0.0, 0.0, 1.0);
         float terrainBlendAo = 1.0;
         {
           vec2 tPos = vec2(vTerrainWorldPos.x, -vTerrainWorldPos.z);
           float macroVar = terrainFbm2(tPos * 0.085);
           float detailBreak = terrainFbm2(tPos * 0.44 + vec2(17.3, 9.1));

           vec2 uvGrassA = tPos * 0.175;
           vec2 uvGrassB = terrainRot2(tPos * 0.068, 0.58) + vec2(0.37, 0.71);
           vec2 uvPebA = tPos * 0.24 + vec2(detailBreak - 0.5, macroVar - 0.5) * 0.09;
           vec2 uvPebB = terrainRot2(tPos * 0.135, 0.72) + vec2(0.41, 0.27);
           vec2 uvRockA = tPos * 0.092;
           vec2 uvRockB = terrainRot2(tPos * 0.041, -0.48) + vec2(0.19, 0.63);

           vec3 gAlb = mix(texture2D(uGrassMap, uvGrassA).rgb, texture2D(uGrassMap, uvGrassB).rgb, 0.34);
           gAlb *= mix(0.88, 1.12, macroVar);
           vec3 gNorm = normalize(mix(texture2D(uGrassNormal, uvGrassA).xyz * 2.0 - 1.0, texture2D(uGrassNormal, uvGrassB).xyz * 2.0 - 1.0, 0.34));
           float gRough = mix(texture2D(uGrassRough, uvGrassA).g, texture2D(uGrassRough, uvGrassB).g, 0.34);
           float gAo = mix(texture2D(uGrassAo, uvGrassA).r, texture2D(uGrassAo, uvGrassB).r, 0.34);

           vec3 pAlb = mix(texture2D(uPebbleMap, uvPebA).rgb, texture2D(uPebbleMap, uvPebB).rgb, 0.42);
           pAlb *= mix(0.85, 1.15, macroVar);
           vec3 pNorm = normalize(mix(texture2D(uPebbleNormal, uvPebA).xyz * 2.0 - 1.0, texture2D(uPebbleNormal, uvPebB).xyz * 2.0 - 1.0, 0.42));
           float pRough = mix(texture2D(uPebbleRough, uvPebA).g, texture2D(uPebbleRough, uvPebB).g, 0.42);
           float pAo = mix(texture2D(uPebbleAo, uvPebA).r, texture2D(uPebbleAo, uvPebB).r, 0.42);

           vec3 rAlb = mix(texture2D(uRockMap, uvRockA).rgb, texture2D(uRockMap, uvRockB).rgb, 0.38);
           vec3 rNorm = normalize(mix(texture2D(uRockNormal, uvRockA).xyz * 2.0 - 1.0, texture2D(uRockNormal, uvRockB).xyz * 2.0 - 1.0, 0.38));
           float rRough = mix(texture2D(uRockRough, uvRockA).g, texture2D(uRockRough, uvRockB).g, 0.38);
           float rAo = mix(texture2D(uRockAo, uvRockA).r, texture2D(uRockAo, uvRockB).r, 0.38);

           float pebHeight = pAo * 0.65 + pAlb.g * 0.35;
           float rockHeight = rAo * 0.55 + (1.0 - rRough) * 0.45;
           float grassHeight = gAo * 0.5 + 0.22;

           vec3 rawW = max(vTerrainMix, vec3(0.0));
           rawW /= max(rawW.x + rawW.y + rawW.z, 0.0001);

           float b0 = rawW.x + (grassHeight - 0.5) * 0.14 + (detailBreak - 0.5) * 0.16;
           float b1 = rawW.y + (pebHeight - 0.5) * 0.22 + (detailBreak - 0.5) * 0.18;
           float b2 = rawW.z + (rockHeight - 0.5) * 0.22 + (macroVar - 0.5) * 0.18;

           float maxB = max(b0, max(b1, b2)) - 0.26;
           vec3 wSharp = max(vec3(b0, b1, b2) - vec3(maxB), vec3(0.0));
           wSharp *= step(vec3(0.005), rawW);
           float wSum = wSharp.x + wSharp.y + wSharp.z;
           vec3 wLayer = wSum > 0.0001 ? (wSharp / wSum) : rawW;

           vec3 layerAlbedo = gAlb * wLayer.x + pAlb * wLayer.y + rAlb * wLayer.z;
           terrainBlendRough = clamp(gRough * wLayer.x + pRough * wLayer.y + rRough * wLayer.z, 0.16, 0.99);
           terrainBlendMapN = normalize(gNorm * wLayer.x + pNorm * wLayer.y + rNorm * wLayer.z);
           terrainBlendAo = clamp(gAo * wLayer.x + pAo * wLayer.y + rAo * wLayer.z, 0.25, 1.0);

           if (uIsHimalayas > 0.5) {
             float snowMask = smoothstep(0.24, 0.74, vTerrainSnow + (detailBreak - 0.5) * 0.22);
             vec3 snowDriftN = normalize(vec3((detailBreak - 0.5) * 0.2, (macroVar - 0.5) * 0.14, 1.0));
             layerAlbedo = mix(layerAlbedo, vec3(0.84, 0.87, 0.92), snowMask);
             terrainBlendRough = mix(terrainBlendRough, 0.74, snowMask);
             terrainBlendMapN = normalize(mix(terrainBlendMapN, snowDriftN, snowMask * 0.85));
             terrainBlendAo = mix(terrainBlendAo, 0.96, snowMask * 0.72);
           }

           diffuseColor.rgb *= layerAlbedo;
         }`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `float roughnessFactor = roughness * terrainBlendRough;`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#if defined( USE_NORMALMAP_TANGENTSPACE )
           vec3 mapN = terrainBlendMapN;
           mapN.xy *= normalScale;
           normal = normalize( tbn * mapN );
         #endif`,
      )
      .replace(
        '#include <aomap_fragment>',
        `#ifdef USE_AOMAP
           float ambientOcclusion = ( terrainBlendAo - 1.0 ) * aoMapIntensity + 1.0;
           reflectedLight.indirectDiffuse *= ambientOcclusion;
           #if defined( USE_ENVMAP ) && defined( STANDARD )
             float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
             reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
           #endif
         #endif`,
      )
      .replace(
        '#include <fog_fragment>',
        `#include <fog_fragment>
        {
          vec3 toFrag = vHazeWorldPos - cameraPosition;
          float fragDist = length(toFrag);
          vec3 rayDir = toFrag / max(fragDist, 0.0001);
          float camH = max(cameraPosition.y, -2.0);
          float fragH = max(vHazeWorldPos.y, -2.0);
          float avgH = mix(camH, fragH, 0.48);
          float heightAtten = exp(-max(0.0, avgH + 1.5) * uHeightFalloff);
          float opticalDepth = max(0.0, fragDist - 18.0) * uHazeDensity * (0.34 + 0.66 * heightAtten);
          float hazeFactor = clamp(1.0 - exp(-opticalDepth), 0.0, uMaxHaze);
          float sunScatter = pow(max(dot(rayDir, normalize(uSunDir)), 0.0), 5.0);
          vec3 aerialTint = mix(uHazeColor, mix(uHazeColor, uSunColor, 0.42), sunScatter * 0.65);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, aerialTint, hazeFactor);
        }`,
      );
  };
}

export interface AnimatedWaterController {
  group: THREE.Group;
  update: (elapsed: number) => void;
}

export interface GrassInteractor {
  x: number;
  y: number;
  z: number;
  r: number;
}

export interface AnimatedGrassController {
  group: THREE.Group;
  update: (
    elapsed: number,
    playerPos?: THREE.Vector3,
    interactors?: GrassInteractor[],
    playerMove?: THREE.Vector3,
    meadowActivity?: number,
  ) => void;
  setQuality?: (preset: GraphicsQualityPreset) => void;
  getShaderUniforms?: () => {
    uTime: { value: number };
    uPlayerPos: { value: THREE.Vector3 };
    uPlayerMove: { value: THREE.Vector3 };
    uMeadowActivity: { value: number };
  };
}

export interface AnimatedFoliageController {
  group: THREE.Group;
  update: (elapsed: number, bumpPos?: THREE.Vector3, bumpStrength?: number) => void;
}

export interface MountainCloudController {
  group: THREE.Group;
  update: (elapsed: number, weather?: WeatherKind, alpenglowColor?: THREE.Color) => void;
}

export interface RoadAndLanternsResult {
  group: THREE.Group;
  lanternGroup: THREE.Group;
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

interface RoadSampleGrid {
  cellSize: number;
  buckets: Map<number, number[]>;
  samples: Array<{ x: number; z: number }>;
}

function buildRoadSampleGrid(
  samples: Array<{ x: number; z: number }>,
  cellSize = 10,
): RoadSampleGrid {
  const buckets = new Map<number, number[]>();
  for (let i = 0; i < samples.length; i++) {
    const gx = Math.floor(samples[i].x / cellSize);
    const gz = Math.floor(samples[i].z / cellSize);
    const key = (gx + 2048) * 4096 + (gz + 2048);
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = [];
      buckets.set(key, bucket);
    }
    bucket.push(i);
  }
  return { cellSize, buckets, samples };
}

function minDistanceToRoadsFast(
  x: number,
  z: number,
  grid: RoadSampleGrid,
): number {
  const gx = Math.floor(x / grid.cellSize);
  const gz = Math.floor(z / grid.cellSize);
  let minD2 = Infinity;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const key = (gx + dx + 2048) * 4096 + (gz + dz + 2048);
      const bucket = grid.buckets.get(key);
      if (!bucket) continue;
      for (let i = 0; i < bucket.length; i++) {
        const s = grid.samples[bucket[i]];
        const rx = x - s.x;
        const rz = z - s.z;
        const d2 = rx * rx + rz * rz;
        if (d2 < minD2) minD2 = d2;
      }
    }
  }
  return minD2 === Infinity ? 99 : Math.sqrt(minD2);
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
 * Authentic 360-degree three-tier Nepali Himalayan Mountain Amphitheater:
 * foreground Mahabharat terraced foothills & river gorges, mid-altitude granite massifs,
 * and towering Ama Dablam / Machapuchare / Lhotse / Sagarmatha snow peaks.
 */
export function createSculptedHimalayas(textures: ProceduralTextureSet): THREE.Mesh {
  return createHimalayanAmphitheater(textures);
}

/**
 * Volumetric Himalayan ridge cloud bands weaving 360 degrees through mountain gorges,
 * paired with wind-blown snow spindrift plumes streaming off the high summit arêtes.
 */
export function createMountainClouds(): MountainCloudController {
  const group = new THREE.Group();
  group.userData.nonCollidable = true;

  const mistTex = getCachedTexture('mountain-mist-tex', () => {
    const cCanvas = document.createElement('canvas');
    cCanvas.width = 256;
    cCanvas.height = 128;
    const ctx = cCanvas.getContext('2d')!;
    ctx.clearRect(0, 0, 256, 128);
    ctx.save();
    ctx.translate(128, 64);
    ctx.scale(2, 1);
    const g = ctx.createRadialGradient(0, 0, 6, 0, 0, 60);
    g.addColorStop(0, 'rgba(232, 238, 246, 0.72)');
    g.addColorStop(0.45, 'rgba(216, 224, 236, 0.34)');
    g.addColorStop(1, 'rgba(196, 208, 224, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 62, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    const tex = new THREE.CanvasTexture(cCanvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });

  const cloudMat = new THREE.MeshBasicMaterial({
    map: mistTex,
    color: 0xffffff,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const mistMat = cloudMat.clone();
  mistMat.opacity = 0.24;

  const spindriftMat = new THREE.MeshBasicMaterial({
    map: mistTex,
    color: 0xf4f8ff,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const ribbonGeo = new THREE.PlaneGeometry(140, 26);
  const banks: Array<{
    obj: THREE.Group;
    angle: number;
    radius: number;
    baseY: number;
    angSpeed: number;
    phase: number;
    isLow: boolean;
  }> = [];

  // 360-degree gorge & mid-mountain cloud rings weaving around the valley
  for (let i = 0; i < 18; i++) {
    const isLow = i >= 10;
    const angle = (i / (isLow ? 8 : 10)) * Math.PI * 2 + (isLow ? 0.35 : 0.12);
    const radius = isLow ? 510 + (i % 3) * 65 : 740 + (i % 4) * 75;
    const baseY = isLow ? 34 + (i % 3) * 14 : 98 + (i % 4) * 24;
    const scale = isLow ? 1.35 + (i % 2) * 0.35 : 1.75 + (i % 3) * 0.45;
    const mat = isLow ? mistMat : cloudMat;

    const cluster = new THREE.Group();
    cluster.position.set(Math.cos(angle) * radius, baseY, Math.sin(angle) * radius);
    cluster.lookAt(0, baseY, 0);

    const p1 = new THREE.Mesh(ribbonGeo, mat);
    p1.scale.set(scale, scale * 0.92, 1);
    const p2 = new THREE.Mesh(ribbonGeo, mat);
    p2.position.set(28 * scale, isLow ? 3.5 : 6.0, -14);
    p2.scale.set(scale * 0.78, scale * 0.74, 1);
    cluster.add(p1, p2);
    group.add(cluster);

    banks.push({
      obj: cluster,
      angle,
      radius,
      baseY,
      angSpeed: (isLow ? 0.0042 : 0.0028) + (i % 3) * 0.0008,
      phase: i * 1.15,
      isLow,
    });
  }

  // Summit wind-blown snow spindrift plumes streaming off Sagarmatha Trek Peak & Great Himalaya spires
  const spindriftGeo = new THREE.PlaneGeometry(54, 11);
  const spindriftPlumes: Array<{
    mesh: THREE.Mesh;
    anchorX: number;
    anchorY: number;
    anchorZ: number;
    phase: number;
    span: number;
  }> = [];
  const summitPlumeAnchors: Array<[number, number, number, number]> = [
    [32, 217, -355, 0.9], // Flagship Sagarmatha Trek Peak summit
    [40, 215, -358, 0.85],
    [16, 362, -1085, 2.2], // Great Himalaya Sagarmatha spire
    [-415, 294, -990, 1.9], // Machapuchare spire
    [-210, 312, -1040, 2.0], // Ama Dablam spire
    [290, 326, -1050, 2.0], // Lhotse massif
  ];
  summitPlumeAnchors.forEach(([ax, ay, az, sc], idx) => {
    const plume = new THREE.Mesh(spindriftGeo, spindriftMat);
    plume.position.set(ax, ay, az);
    plume.scale.set(sc, sc * 0.85, 1);
    plume.rotation.y = 0.28 + idx * 0.08;
    plume.rotation.z = -0.06;
    group.add(plume);
    spindriftPlumes.push({
      mesh: plume,
      anchorX: ax,
      anchorY: ay,
      anchorZ: az,
      phase: idx * 1.37,
      span: 14 * sc,
    });
  });

  const baseTint = new THREE.Color(0xffffff);

  return {
    group,
    update: (elapsed: number, weather: WeatherKind = 'clear', alpenglowColor?: THREE.Color) => {
      const isFoggy = weather === 'foggy';
      const isMist = weather === 'mist';
      const isSnow = weather === 'snow';
      cloudMat.opacity = isFoggy ? 0.62 : isMist ? 0.50 : isSnow ? 0.44 : 0.30;
      mistMat.opacity = isFoggy ? 0.54 : isMist ? 0.42 : isSnow ? 0.34 : 0.20;
      spindriftMat.opacity = isSnow ? 0.68 : isFoggy ? 0.46 : 0.32;

      if (alpenglowColor) {
        baseTint.setHex(0xffffff).lerp(alpenglowColor, 0.42);
        cloudMat.color.copy(baseTint);
        mistMat.color.copy(baseTint);
        spindriftMat.color.setHex(0xf6f9ff).lerp(alpenglowColor, 0.35);
      } else {
        cloudMat.color.setHex(0xffffff);
        mistMat.color.setHex(0xffffff);
        spindriftMat.color.setHex(0xf4f8ff);
      }

      for (const b of banks) {
        const a = b.angle + elapsed * b.angSpeed;
        const y = b.baseY + Math.sin(elapsed * 0.32 + b.phase) * 3.2;
        b.obj.position.set(Math.cos(a) * b.radius, y, Math.sin(a) * b.radius);
        b.obj.lookAt(0, y, 0);
      }

      const windMul = isSnow ? 2.4 : 1.0;
      for (const p of spindriftPlumes) {
        const cycle = ((elapsed * 0.35 * windMul + p.phase) % 1);
        p.mesh.position.set(
          p.anchorX + 6 + cycle * p.span,
          p.anchorY + Math.sin(elapsed * 1.6 + p.phase) * 1.4 - cycle * 1.5,
          p.anchorZ - cycle * 3.5,
        );
      }
    },
  };
}

export function sampleTerrainMeshHeight(
  terrainMesh: THREE.Mesh | undefined,
  x: number,
  z: number,
): number {
  const grid = terrainMesh?.userData?.terrainGrid as { size: number; segs: number } | undefined;
  const pos = terrainMesh?.geometry?.getAttribute('position');
  if (!grid || !pos) return groundHeightAt(x, z);

  const { size, segs } = grid;
  const half = size * 0.5;
  if (x < -half || x > half || z < -half || z > half) {
    return groundHeightAt(x, z);
  }

  const fx = THREE.MathUtils.clamp(((x + half) / size) * segs, 0, segs - 1e-6);
  const fz = THREE.MathUtils.clamp(((z + half) / size) * segs, 0, segs - 1e-6);
  const ix = Math.floor(fx);
  const iz = Math.floor(fz);
  const u = fx - ix;
  const v = fz - iz;
  const stride = segs + 1;

  const ya = pos.getY(ix + stride * iz);
  const yb = pos.getY(ix + stride * (iz + 1));
  const yc = pos.getY(ix + 1 + stride * (iz + 1));
  const yd = pos.getY(ix + 1 + stride * iz);

  if (u + v <= 1) {
    return ya * (1 - u - v) + yd * u + yb * v;
  }
  return yb * (1 - u) + yd * (1 - v) + yc * (u + v - 1);
}

/**
 * Natural multi-biome valley ground transitioning from moist Himalayan turf & moss (West)
 * across exposed river shingle/silt to sun-baked Tamil Nadu laterite loam (East).
 */
export function createDioramaTerrain(textures: ProceduralTextureSet): THREE.Mesh {
  textures.meadowMap.repeat.set(162, 162);
  textures.meadowNormal.repeat.set(162, 162);
  textures.meadowRough.repeat.set(162, 162);

  const size = 1220;
  const segs = 512;
  const geo = new THREE.PlaneGeometry(size, size, segs, segs);
  geo.rotateX(-Math.PI / 2);
  if (geo.attributes.uv) {
    geo.setAttribute('uv1', geo.attributes.uv.clone());
  }

  const roadSamples = sampleRoadPoints();
  const roadGrid = buildRoadSampleGrid(roadSamples, 10);
  const landmarkClearZones = [
    { x: SPAWN_POSITION.x, z: SPAWN_POSITION.z, r: 12 },
    ...LANDMARKS.map((lm) => ({
      x: lm.position.x,
      z: lm.position.z,
      r:
        lm.id === 'janaki-mandir'
          ? 58
          : lm.id === 'lumbini-buddha'
            ? 92
            : lm.id === 'kathmandu-stupa'
              ? 88
              : lm.id === 'boudhanath-stupa'
                ? 68
                : 20,
    })),
  ];

  const pos = geo.attributes.position;
  const roadDistCache = new Float32Array(pos.count);
  const pondMaskCache = new Uint8Array(pos.count);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    let y = groundHeightAt(x, z);
    const jx = x + 92;
    const jz = z - 92;
    const underChowk = jx >= -56.5 && jx <= 38.2 && jz >= 15.5 && jz <= 57.6;
    const underPlinth = Math.abs(jx) <= 25.2 && jz >= -22.0 && jz <= 19.0;
    const underCompoundWalk =
      (jx >= -56.8 && jx <= 38.4 && jz >= -34.8 && jz <= -29.8) ||
      (jx >= -56.8 && jx <= -52.2 && jz >= -30.5 && jz <= 25.6) ||
      (jx >= 34.0 && jx <= 38.4 && jz >= -30.5 && jz <= 16.0);
    const underBridgeWalk =
      (jx >= -28.6 && jx <= -25.0 && jz >= -25.7 && jz <= 15.6) ||
      (jx >= 25.0 && jx <= 28.6 && jz >= -25.7 && jz <= 15.6) ||
      (jx >= -53.0 && jx <= 34.6 && jz >= -25.7 && jz <= -21.9) ||
      (jx >= -2.2 && jx <= 2.2 && jz >= -30.2 && jz <= -25.5) ||
      (jx >= 28.4 && jx <= 34.4 && jz >= -6.2 && jz <= -0.8) ||
      (jx >= -52.8 && jx <= -34.0 && jz >= 2.8 && jz <= 25.5) ||
      (jx >= -34.2 && jx <= -28.4 && jz >= 14.1 && jz <= 17.9);
    const underGangaSagarBasin = jx >= -51.6 && jx <= -37.4 && jz >= 7.2 && jz <= 24.8;
    const lx = x - LUMBINI_SACRED_POND.centerX;
    const lz = z - LUMBINI_SACRED_POND.centerZ;
    const underPushkariniBasin = lx >= -3.2 && lx <= 23.2 && lz >= 7.5 && lz <= 25.5;
    const underMayaPit = Math.abs(lx) <= 17.5 && lz >= -33.5 && lz <= -10.5;
    const underMayaRamp = Math.abs(lx) <= 2.35 && lz > -10.5 && lz <= -1.8;
    const underLumbiniPlaza = lx >= -44.8 && lx <= 44.8 && lz >= -44.8 && lz <= 52.8;
    const inSurroundingPond = isInLumbiniSurroundingPond(x, z);
    const onSacredBridge = isOnLumbiniSacredBridge(x, z);
    const onBridgePier = isOnLumbiniBridgeAbutmentPier(x, z);
    const underLumbiniOuterPromenade =
      !inSurroundingPond &&
      !onSacredBridge &&
      !onBridgePier &&
      ((Math.abs(lx) <= 4.2 && lz >= 59.8 && lz <= LUMBINI_FENCE_BOUNDS.localMaxZ + 2.2) ||
        (Math.abs(lx) <= 4.2 && lz >= LUMBINI_FENCE_BOUNDS.localMinZ - 2.2 && lz <= -51.8) ||
        (Math.abs(lz - 4.0) <= 3.2 && lx >= 49.8 && lx <= LUMBINI_FENCE_BOUNDS.localMaxX + 2.2) ||
        (x >= LUMBINI_SACRED_POND.outerMinX - 1.2 &&
          x <= LUMBINI_SACRED_POND.outerMaxX + 1.2 &&
          z >= LUMBINI_SACRED_POND.outerMinZ - 1.2 &&
          z <= LUMBINI_SACRED_POND.outerMaxZ + 1.2));
    // Carve Peace Canal continuously underneath Maitri Peace Bridge so water flows visibly below the arch
    const underPeaceCanal =
      x >= LUMBINI_PEACE_CANAL.minX - 1.2 &&
      x <= LUMBINI_PEACE_CANAL.maxX + 1.2 &&
      z >= LUMBINI_PEACE_CANAL.minZ - 1.2 &&
      z <= LUMBINI_PEACE_CANAL.maxZ + 1.2;
    const underWestPeaceWalk =
      (x >= LUMBINI_FENCE_BOUNDS.minX - 2.2 &&
        x <= LUMBINI_SACRED_POND.outerMinX + 0.5 &&
        Math.abs(z - LUMBINI_PEACE_CANAL.bridgeCenterZ) <= 3.3) ||
      (z >= LUMBINI_PEACE_CANAL.minZ - 1.0 &&
        z <= LUMBINI_PEACE_CANAL.maxZ + 1.0 &&
        ((x >= LUMBINI_PEACE_CANAL.maxX - 0.2 && x <= LUMBINI_PEACE_CANAL.maxX + 1.4) ||
          (x >= LUMBINI_PEACE_CANAL.minX - 1.4 && x <= LUMBINI_PEACE_CANAL.minX + 0.2)));

    const roadDist =
      x > -470 && x < 240 && z > -118 && z < 405 ? minDistanceToRoadsFast(x, z, roadGrid) : 99;
    roadDistCache[i] = roadDist;

    const underPashupatiAryaghat =
      x > 26.0 && x < 41.5 && z >= 224.0 && z <= 376.0;
    const underPashupatiDeck =
      (x >= -100.5 && x <= 26.0 && z >= 236.0 && z <= 364.0) ||
      (Math.abs(x + 28.0) <= 4.8 &&
        ((z >= 232.0 && z < 236.0) || (z > 364.0 && z <= 368.0))) ||
      (x >= 41.5 && x <= 62.5 && z >= 236.0 && z <= 364.0);
    const inBoudhaClear = isInBoudhaPrecinct(x, z, 2.5);
    const inPumdikotClear = isInPumdikotPrecinct(x, z, 2.5);

    const inWaterBasin =
      underPeaceCanal ||
      inSurroundingPond ||
      underPushkariniBasin ||
      underGangaSagarBasin;
    const isStructuralClear =
      inWaterBasin ||
      onBridgePier ||
      onSacredBridge ||
      underMayaPit ||
      underMayaRamp ||
      underPlinth ||
      underChowk ||
      underCompoundWalk ||
      underBridgeWalk ||
      underLumbiniPlaza ||
      underLumbiniOuterPromenade ||
      underWestPeaceWalk ||
      underPashupatiAryaghat ||
      underPashupatiDeck ||
      inBoudhaClear ||
      inPumdikotClear;
    if (isStructuralClear) {
      pondMaskCache[i] = inWaterBasin ? 2 : 1;
    }

    if (inBoudhaClear || inPumdikotClear) {
      // Preserve carved flat Boudhanath Kora & Pumdikot View Plazas
    } else if (underPashupatiAryaghat) {
      // Preserve smooth carved Bagmati river channel & 14m transitions from carvePashupatinathGround
      y = Math.min(y, 0.25);
    } else if (underPashupatiDeck) {
      y = 0.18;
    } else if (underPeaceCanal) {
      y = -1.15;
    } else if (inSurroundingPond || onSacredBridge) {
      y = -0.9;
    } else if (onBridgePier) {
      y = 0.34;
    } else if (underPushkariniBasin) {
      y = -0.82;
    } else if (underGangaSagarBasin) {
      y = -0.48;
    } else if (underMayaPit) {
      y = -0.95;
    } else if (underPlinth || underMayaRamp) {
      y = 0.08;
    } else if (
      underChowk ||
      underCompoundWalk ||
      underBridgeWalk ||
      underLumbiniPlaza ||
      underLumbiniOuterPromenade ||
      underWestPeaceWalk
    ) {
      y = 0.14;
    } else if (roadDist < 2.85) {
      // Depress roadbed sub-grade cleanly beneath the level stone road deck so grass triangles never pierce the pavers
      y -= (1 - THREE.MathUtils.smoothstep(roadDist, 1.1, 2.85)) * 0.12;
    } else {
      // High-density subtle micro-relief across natural valley turf, riverbanks & rocky foothills
      const distLake = Math.hypot(x - GLACIAL_LAKE.x, z - GLACIAL_LAKE.z);
      const distRiver = Math.abs(x - getRiverCenterX(z));
      const inPark = x >= -392 && x <= -196 && z >= 12 && z <= 188;
      let landmarkClear = 1.0;
      for (let li = 0; li < landmarkClearZones.length; li++) {
        const lzZone = landmarkClearZones[li];
        const ld = Math.hypot(x - lzZone.x, z - lzZone.z);
        if (ld < lzZone.r + 7) {
          landmarkClear = Math.min(
            landmarkClear,
            THREE.MathUtils.smoothstep(ld, lzZone.r, lzZone.r + 7),
          );
          if (landmarkClear <= 0.001) break;
        }
      }
      const riverBridgeClear =
        (x > BRIDGE_BOUNDS.minX - 6 &&
          x < BRIDGE_BOUNDS.maxX + 6 &&
          Math.abs(z - BRIDGE_BOUNDS.centerZ) < 6.5) ||
        (x > 25.0 && x < 44.0 && Math.abs(z - 300.0) < 7.5)
          ? 0
          : 1;
      const roadFade = THREE.MathUtils.smoothstep(roadDist, 3.6, 7.2);
      const lakeFade = THREE.MathUtils.smoothstep(distLake, GLACIAL_LAKE.basinRadius + 1.5, GLACIAL_LAKE.basinRadius + 7);
      const riverFade = THREE.MathUtils.smoothstep(distRiver, 3.5, 9.5);
      const parkScale = inPark ? 0.0 : 1.0;
      const reliefMask = landmarkClear * roadFade * lakeFade * riverFade * riverBridgeClear * parkScale;

      if (reliefMask > 0.005) {
        const foothillBoost = 1 + THREE.MathUtils.smoothstep(Math.hypot(x, z), 475, 585) * 1.65;
        const undulation =
          Math.sin(x * 0.23 + z * 0.16) * 0.105 +
          Math.cos(x * 0.51 - z * 0.41) * 0.068 +
          Math.sin(x * 0.94 + z * 0.87) * 0.042;
        y += undulation * reliefMask * foothillBoost;
      }
    }
    pos.setY(i, y);
  }

  geo.computeVertexNormals();
  const norm = geo.attributes.normal;
  const colors = new Float32Array(pos.count * 3);
  const terrainMix = new Float32Array(pos.count * 3);
  const snowMaskAttr = new Float32Array(pos.count);

  const parkTint = new THREE.Color(0x6c944d);
  const vergeTint = new THREE.Color(0x9a9285);
  const rockSlopeTint = new THREE.Color(0x95948f);
  const riverWetTint = new THREE.Color(0x7c888a);
  const riverBankTint = new THREE.Color(0xa9a59b);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const roadDist = roadDistCache[i];
    const clearFlag = pondMaskCache[i];
    const slope = 1 - THREE.MathUtils.clamp(norm.getY(i), 0, 1);

    const riverCenterX = getRiverCenterX(z);
    const distRiver = Math.abs(x - riverCenterX);
    const eastBankBlend = THREE.MathUtils.smoothstep(x - riverCenterX, 4.5, 22.0);
    const outerFoothillBlend = THREE.MathUtils.smoothstep(Math.hypot(x, z), 505, 585);
    const northSlopeBlend = THREE.MathUtils.smoothstep(-z, 118, 195);
    const distLake = Math.hypot(x - GLACIAL_LAKE.x, z - GLACIAL_LAKE.z);

    // Compute per-vertex surface mix: [grass, pebble, rock]
    let wPebble = 0;
    let wRock = 0;

    if (clearFlag === 2) {
      wPebble = 0.86;
      wRock = 0.14;
    } else if (clearFlag === 3) {
      wPebble = 0.08;
      wRock = THREE.MathUtils.smoothstep(slope, 0.14, 0.42) * 0.52;
    } else if (distRiver < 9.6 || distLake < GLACIAL_LAKE.basinRadius + 2.4) {
      const riverPeb =
        distRiver < 9.6 ? 1 - THREE.MathUtils.smoothstep(distRiver, 5.2, 9.6) : 0;
      const lakePeb =
        distLake < GLACIAL_LAKE.basinRadius + 2.4
          ? 1 - THREE.MathUtils.smoothstep(distLake, GLACIAL_LAKE.basinRadius - 1.2, GLACIAL_LAKE.basinRadius + 2.4)
          : 0;
      wPebble = Math.max(riverPeb, lakePeb);
      wRock = THREE.MathUtils.smoothstep(slope, 0.045, 0.18) * 0.72;
    } else {
      if (roadDist >= 1.5 && roadDist < 4.5 && clearFlag === 0) {
        const shoulderBand =
          THREE.MathUtils.smoothstep(roadDist, 1.5, 2.2) *
          (1 - THREE.MathUtils.smoothstep(roadDist, 2.8, 4.5));
        wPebble = Math.max(wPebble, shoulderBand * 0.85);
      }
      const dryGravelPocket =
        Math.max(0, Math.sin(x * 0.045 + z * 0.038) * Math.cos(x * 0.029 - z * 0.052)) *
        eastBankBlend *
        (clearFlag === 0 ? 0.36 : 0);
      wPebble = Math.max(wPebble, dryGravelPocket);

      const slopeRock = THREE.MathUtils.smoothstep(slope, 0.045, 0.19);
      const foothillRock = outerFoothillBlend * 0.68 + northSlopeBlend * 0.56;
      const cliffRock =
        distLake < 38 && z < GLACIAL_LAKE.z - 8
          ? THREE.MathUtils.smoothstep(-z + GLACIAL_LAKE.z, 8, 22) * 0.85
          : 0;
      wRock = Math.min(1, slopeRock * 0.92 + foothillRock * (0.45 + 0.55 * slopeRock) + cliffRock);
    }

    const totalPR = wPebble + wRock;
    if (totalPR > 1.0) {
      wPebble /= totalPR;
      wRock /= totalPR;
    }
    const wGrass = Math.max(0, 1.0 - wPebble - wRock);
    const sumW = wGrass + wPebble + wRock || 1;
    const ng = wGrass / sumW;
    const np = wPebble / sumW;
    const nr = wRock / sumW;
    terrainMix[i * 3] = ng;
    terrainMix[i * 3 + 1] = np;
    terrainMix[i * 3 + 2] = nr;
    snowMaskAttr[i] = 0;

    // Color tint per layer so grass has valley biome warmth while pebble & rock keep clean mineral hues
    if (clearFlag === 2) {
      _color.setRGB(0.56, 0.64, 0.64);
    } else if (clearFlag === 3) {
      _color.setRGB(0.76, 0.90, 0.68).lerp(parkTint, 0.34);
      if (nr > 0.05) {
        _color.lerp(rockSlopeTint, nr * 0.68);
      }
    } else if (distRiver < 8.4 || distLake < GLACIAL_LAKE.basinRadius) {
      const shoreT =
        distLake < GLACIAL_LAKE.basinRadius
          ? THREE.MathUtils.smoothstep(distLake, GLACIAL_LAKE.waterRadius * 0.65, GLACIAL_LAKE.basinRadius)
          : THREE.MathUtils.smoothstep(distRiver, 3.2, 8.4);
      _color.copy(riverWetTint).lerp(riverBankTint, shoreT);
    } else {
      _color.setRGB(
        THREE.MathUtils.lerp(0.84, 1.08, eastBankBlend),
        THREE.MathUtils.lerp(0.92, 0.92, eastBankBlend),
        THREE.MathUtils.lerp(0.75, 0.68, eastBankBlend),
      );
      if (
        x >= LUMBINI_FENCE_BOUNDS.minX - 6 &&
        x <= LUMBINI_FENCE_BOUNDS.maxX + 6 &&
        z >= LUMBINI_FENCE_BOUNDS.minZ - 6 &&
        z <= LUMBINI_FENCE_BOUNDS.maxZ + 6 &&
        clearFlag === 0
      ) {
        const parkDx =
          x < LUMBINI_FENCE_BOUNDS.minX
            ? LUMBINI_FENCE_BOUNDS.minX - x
            : x > LUMBINI_FENCE_BOUNDS.maxX
              ? x - LUMBINI_FENCE_BOUNDS.maxX
              : 0;
        const parkDz =
          z < LUMBINI_FENCE_BOUNDS.minZ
            ? LUMBINI_FENCE_BOUNDS.minZ - z
            : z > LUMBINI_FENCE_BOUNDS.maxZ
              ? z - LUMBINI_FENCE_BOUNDS.maxZ
              : 0;
        const parkLawnBlend = 1 - THREE.MathUtils.smoothstep(Math.hypot(parkDx, parkDz), 0, 10);
        _color.lerp(parkTint, parkLawnBlend * 0.34);
      }
      if (roadDist < 4.0) {
        const vergeBlend = 1 - THREE.MathUtils.smoothstep(roadDist, 1.8, 4.0);
        _color.lerp(vergeTint, vergeBlend * 0.45);
      }
      if (nr > 0.05) {
        _color.lerp(rockSlopeTint, nr * 0.8);
      }
    }

    colors[i * 3] = _color.r;
    colors[i * 3 + 1] = _color.g;
    colors[i * 3 + 2] = _color.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('aTerrainMix', new THREE.BufferAttribute(terrainMix, 3));
  geo.setAttribute('aSnowMask', new THREE.BufferAttribute(snowMaskAttr, 1));

  const mat = new THREE.MeshStandardMaterial({
    map: textures.meadowMap,
    normalMap: textures.meadowNormal,
    normalScale: new THREE.Vector2(0.95, 0.95),
    roughnessMap: textures.meadowRough,
    aoMap: textures.meadowAo ?? textures.meadowRough,
    aoMapIntensity: 0.76,
    vertexColors: true,
    roughness: 0.96,
    metalness: 0.02,
  });
  applyTerrainMultiLayerShader(mat, textures, { isHimalayas: false });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.userData.terrainGrid = { size, segs };
  return mesh;
}

/**
 * Lush, dense Bruno-Simon-inspired reactive meadow grass tufts, swaying riverbank reeds,
 * and meadow wildflowers with root-to-tip gradients, rolling wind waves, and player/prop bending.
 */
export function createInstancedGrassField(terrainMesh?: THREE.Mesh): AnimatedGrassController {
  const group = new THREE.Group();
  group.userData.nonCollidable = true;
  const roadSamples = sampleRoadPoints();
  const roadGrid = buildRoadSampleGrid(roadSamples, 10);
  const plazas = [
    { x: SPAWN_POSITION.x, z: SPAWN_POSITION.z, r: 8.5 },
    ...LANDMARKS.filter((lm) => lm.id !== 'boudhanath-stupa').map((lm) => ({
      x: lm.position.x,
      z: lm.position.z,
      r: lm.id === 'janaki-mandir' ? 32 : lm.id === 'lumbini-buddha' ? 60 : 11,
    })),
  ];

  // Rich 5-blade curved tapered grass tuft (3 vertical segments per blade for smooth bending)
  const tuftPositions: number[] = [];
  const tuftNormals: number[] = [];
  const tuftTips: number[] = [];
  const tuftIndices: number[] = [];
  const blades = [
    { ox: 0.0, oz: 0.0, rot: 0.0, tiltX: 0.14, h: 0.72, w: 0.072 },
    { ox: -0.11, oz: 0.08, rot: 1.35, tiltX: 0.17, h: 0.60, w: 0.062 },
    { ox: 0.11, oz: -0.07, rot: 2.65, tiltX: 0.16, h: 0.64, w: 0.065 },
    { ox: -0.07, oz: -0.11, rot: 3.95, tiltX: 0.15, h: 0.56, w: 0.058 },
    { ox: 0.08, oz: 0.10, rot: 5.15, tiltX: 0.18, h: 0.58, w: 0.060 },
  ];
  blades.forEach((b, bi) => {
    const c = Math.cos(b.rot);
    const s = Math.sin(b.rot);
    const addVert = (lx: number, ly: number, lz: number, tip: number) => {
      const wx = b.ox + lx * c - lz * s;
      const wz = b.oz + lx * s + lz * c;
      tuftPositions.push(wx, ly, wz);
      // Upward-biased soft normal so meadows catch sunlight evenly from every camera angle
      const nx = wx * 0.55;
      const ny = 1.0;
      const nz = wz * 0.55;
      const invLen = 1 / Math.hypot(nx, ny, nz);
      tuftNormals.push(nx * invLen, ny * invLen, nz * invLen);
      tuftTips.push(tip);
    };
    addVert(-b.w, -0.05, 0.0, 0.0);
    addVert(b.w, -0.05, 0.0, 0.0);
    addVert(-b.w * 0.74, b.h * 0.36, b.tiltX * 0.20, 0.36);
    addVert(b.w * 0.74, b.h * 0.36, b.tiltX * 0.20, 0.36);
    addVert(-b.w * 0.42, b.h * 0.72, b.tiltX * 0.58, 0.72);
    addVert(b.w * 0.42, b.h * 0.72, b.tiltX * 0.58, 0.72);
    addVert(0.0, b.h, b.tiltX, 1.0);
    const base = bi * 7;
    tuftIndices.push(
      base, base + 1, base + 2,
      base + 1, base + 3, base + 2,
      base + 2, base + 3, base + 4,
      base + 3, base + 5, base + 4,
      base + 4, base + 5, base + 6,
    );
  });

  const bladeGeo = new THREE.BufferGeometry();
  bladeGeo.setAttribute('position', new THREE.Float32BufferAttribute(tuftPositions, 3));
  bladeGeo.setAttribute('normal', new THREE.Float32BufferAttribute(tuftNormals, 3));
  bladeGeo.setAttribute('aTip', new THREE.Float32BufferAttribute(tuftTips, 1));
  bladeGeo.setIndex(tuftIndices);

  const GRASS_INTERACTOR_SLOTS = 6;
  const uTime = { value: 0 };
  const uPlayerPos = { value: new THREE.Vector3(0, -999, 0) };
  const uPlayerMove = { value: new THREE.Vector3(0, 0, 0) }; // (vx, vz, speed)
  const uMeadowActivity = { value: 0 };
  const uInteractors = {
    value: Array.from({ length: GRASS_INTERACTOR_SLOTS }, () => new THREE.Vector4(0, -999, 0, 0)),
  };

  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.82,
    metalness: 0.01,
    side: THREE.DoubleSide,
  });

  bladeMat.customProgramCacheKey = () => 'reactive-grass-v3';
  bladeMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uTime;
    shader.uniforms.uPlayerPos = uPlayerPos;
    shader.uniforms.uPlayerMove = uPlayerMove;
    shader.uniforms.uMeadowActivity = uMeadowActivity;
    shader.uniforms.uInteractors = uInteractors;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         attribute float aTip;
         attribute float aMeadow;
         uniform float uTime;
         uniform vec3 uPlayerPos;
         uniform vec3 uPlayerMove;
         uniform float uMeadowActivity;
         uniform vec4 uInteractors[${GRASS_INTERACTOR_SLOTS}];
         varying float vTip;
         varying float vWindWave;
         varying float vMeadowDisp;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vTip = aTip;
         vec4 instOrigin = vec4(0.0, 0.0, 0.0, 1.0);
         #ifdef USE_INSTANCING
           instOrigin = instanceMatrix * instOrigin;
         #endif
         float hFactor = aTip * aTip;

         // Rolling meadow gusts + fine blade flutter
         float gust = sin(uTime * 1.65 + instOrigin.x * 0.14 + instOrigin.z * 0.11);
         float swirl = cos(uTime * 2.85 + instOrigin.x * 0.42 - instOrigin.z * 0.31);
         float wave = gust * 0.14 + swirl * 0.045;
         vWindWave = clamp(gust * 0.5 + 0.5, 0.0, 1.0);
         transformed.x += wave * hFactor;
         transformed.z += (wave * 0.48 + sin(uTime * 2.2 + instOrigin.z * 0.25) * 0.04) * hFactor;

         // Interactive radial parting, meadow-zone movement wake & moving props
         vec2 bendTotal = vec2(0.0);
         float pushDown = 0.0;
         float meadowDispVis = 0.0;

         vec2 dp = instOrigin.xz - uPlayerPos.xz;
         float dPlayer = length(dp);
         float dyPlayer = abs(instOrigin.y - uPlayerPos.y);
         float meadowMask = clamp(aMeadow, 0.0, 1.0) * clamp(uMeadowActivity, 0.0, 1.35);
         float wakeRadius = mix(1.35, 2.45, clamp(meadowMask, 0.0, 1.0));

         if (dPlayer < wakeRadius && dyPlayer < 1.8) {
           float pForce = smoothstep(wakeRadius, 0.18, dPlayer);
           vec2 dir = dPlayer > 0.001 ? dp / dPlayer : vec2(1.0, 0.0);
           bendTotal += dir * (pForce * (0.58 + meadowMask * 0.44));
           pushDown = max(pushDown, pForce * (0.42 + meadowMask * 0.24));

           // Directional wake & stride ripple when moving through designated 'meadow' zones
           if (meadowMask > 0.01 && uPlayerMove.z > 0.05) {
             vec2 moveDir = normalize(uPlayerMove.xy);
             float strideRipple = sin(dPlayer * 5.4 - uTime * 10.5) * 0.16 * pForce * meadowMask;
             bendTotal += (moveDir * (0.36 * pForce * meadowMask)) + dir * strideRipple;
             meadowDispVis = pForce * clamp(meadowMask, 0.0, 1.0);
           }
         }
         vMeadowDisp = meadowDispVis;

         for (int k = 0; k < ${GRASS_INTERACTOR_SLOTS}; k++) {
           vec4 inter = uInteractors[k];
           if (inter.w > 0.01) {
             vec2 di = instOrigin.xz - inter.xz;
             float distI = length(di);
             if (distI < inter.w && abs(instOrigin.y - inter.y) < 1.8) {
               float f = smoothstep(inter.w, 0.12, distI);
               vec2 dirI = distI > 0.001 ? di / distI : vec2(0.0, 1.0);
               bendTotal += dirI * (f * 0.52);
               pushDown = max(pushDown, f * 0.38);
             }
           }
         }

         transformed.xz += bendTotal * aTip;
         transformed.y *= (1.0 - pushDown * aTip);`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         varying float vTip;
         varying float vWindWave;
         varying float vMeadowDisp;`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         vec3 rootTint = vec3(0.42, 0.62, 0.38);
         vec3 tipTint = vec3(1.26, 1.24, 0.88);
         diffuseColor.rgb *= mix(rootTint, tipTint, smoothstep(0.0, 1.0, vTip));
         // Sun-kissed translucent subsurface wind crest shimmer + parted meadow highlight
         diffuseColor.rgb += vec3(0.11, 0.12, 0.03) * (vTip * vTip * vWindWave);
         diffuseColor.rgb += vec3(0.09, 0.12, 0.03) * (vTip * vMeadowDisp);`,
      );
  };

  interface GrassSpot {
    x: number;
    z: number;
    scale: number;
    rot: number;
    east: boolean;
    nearRiver: boolean;
    meadowFactor: number;
  }

  const grassSpots: GrassSpot[] = [];
  const flowerSpots: Array<{
    x: number;
    z: number;
    scale: number;
    rot: number;
    east: boolean;
    meadowFactor: number;
  }> = [];
  const pebbleSpots: Array<{ x: number; z: number; scale: number; rot: number }> = [];

  const isExcludedFloraPoint = (px: number, pz: number, roadClearDist: number): { excluded: boolean; roadD: number; distRiver: number } => {
    const riverCenterX = getRiverCenterX(pz);
    const distRiver = Math.abs(px - riverCenterX);
    if (distRiver < 8.1) return { excluded: true, roadD: 99, distRiver };
    if (Math.hypot(px - GLACIAL_LAKE.x, pz - GLACIAL_LAKE.z) < GLACIAL_LAKE.basinRadius + 1.1) {
      return { excluded: true, roadD: 99, distRiver };
    }
    if (
      px > BRIDGE_BOUNDS.minX - 4 &&
      px < BRIDGE_BOUNDS.maxX + 4 &&
      Math.abs(pz - BRIDGE_BOUNDS.centerZ) < 6.0
    ) {
      return { excluded: true, roadD: 99, distRiver };
    }
    // Keep ENTIRE Janaki Mandir compound and entire expanded fenced Lumbini Sacred Garden + Peace Canal free of wild grass, flowers & pebbles
    if (px > -152 && px < -50 && pz > 54.5 && pz < 153) {
      return { excluded: true, roadD: 99, distRiver };
    }
    if (
      px >= LUMBINI_FENCE_BOUNDS.minX - 2.5 &&
      px <= LUMBINI_FENCE_BOUNDS.maxX + 2.5 &&
      pz >= LUMBINI_FENCE_BOUNDS.minZ - 2.5 &&
      pz <= LUMBINI_FENCE_BOUNDS.maxZ + 2.5
    ) {
      return { excluded: true, roadD: 99, distRiver };
    }
    // Keep Pashupatinath courtyard, Western Plaza, Bagmati River & Pandra Shivalaya free of wild grass while keeping Sleshmantak Forest grassy
    if (px >= -102 && px <= 63 && pz >= 230 && pz <= 370) {
      return { excluded: true, roadD: 99, distRiver };
    }
    // Keep Boudhanath Kora & Pumdikot View Plazas free of wild grass
    if (isInBoudhaHardSurface(px, pz) || isInPumdikotHardSurface(px, pz)) {
      return { excluded: true, roadD: 99, distRiver };
    }
    for (const art of OUTER_TEMPLE_ARTIFACT_SPOTS) {
      if (Math.hypot(px - art.x, pz - art.z) <= 1.95 * art.scale) {
        return { excluded: true, roadD: 99, distRiver };
      }
    }
    for (const pl of plazas) {
      if (Math.hypot(px - pl.x, pz - pl.z) < pl.r) {
        return { excluded: true, roadD: 99, distRiver };
      }
    }
    const roadD = minDistanceToRoadsFast(px, pz, roadGrid);
    if (roadD < roadClearDist) return { excluded: true, roadD, distRiver };
    return { excluded: false, roadD, distRiver };
  };

  const goldenAngle = 2.39996323;
  const maxAttempts = 44000;
  for (let i = 0; i < maxAttempts && grassSpots.length < 22000; i++) {
    const angle = i * goldenAngle;
    const t = (i + 0.5) / maxAttempts;
    const radius = 7.4 + Math.sqrt(t) * 485.0;
    const jx = Math.sin(i * 12.9898) * 1.45;
    const jz = Math.cos(i * 78.233) * 1.45;
    const x = Math.cos(angle) * radius + jx;
    const z = Math.sin(angle) * radius + jz;

    const check = isExcludedFloraPoint(x, z, 3.15);
    if (check.excluded) continue;

    const riverCenterX = getRiverCenterX(z);
    const nearVerge = check.roadD < 7.8;
    const nearRiver = check.distRiver < 12.2;
    const nearHero = Math.hypot(x, z) < 95;
    const meadowInfo = getMeadowZoneAt(x, z);
    if (!nearVerge && !nearRiver && !nearHero && !meadowInfo.inMeadow && i % 2 !== 0) continue;

    grassSpots.push({
      x,
      z,
      scale:
        (nearRiver ? 1.38 : meadowInfo.inMeadow ? 1.12 : nearVerge ? 1.06 : 0.96) +
        ((i * 19) % 44) / 100,
      rot: ((i * 73) % 628) / 100,
      east: x > riverCenterX,
      nearRiver,
      meadowFactor: meadowInfo.factor,
    });

    if (!nearRiver && (i % 10 === 0 || (meadowInfo.inMeadow && i % 6 === 0)) && flowerSpots.length < 1500) {
      const fx = x + 0.14 * Math.cos(i);
      const fz = z + 0.14 * Math.sin(i);
      if (!isExcludedFloraPoint(fx, fz, 3.15).excluded) {
        flowerSpots.push({
          x: fx,
          z: fz,
          scale: 0.78 + ((i * 17) % 40) / 100,
          rot: (i * 1.1) % (Math.PI * 2),
          east: fx > getRiverCenterX(fz),
          meadowFactor: meadowInfo.factor,
        });
      }
    }

    if ((nearVerge || nearRiver) && i % 18 === 0 && pebbleSpots.length < 360) {
      const px = x - 0.14;
      const pz = z + 0.14;
      if (!isExcludedFloraPoint(px, pz, 3.15).excluded) {
        pebbleSpots.push({
          x: px,
          z: pz,
          scale: 0.8 + ((i * 11) % 50) / 100,
          rot: (i * 0.8) % (Math.PI * 2),
        });
      }
    }
  }

  const grassMeadowAttr = new THREE.InstancedBufferAttribute(
    new Float32Array(grassSpots.map((gs) => gs.meadowFactor)),
    1,
  );
  bladeGeo.setAttribute('aMeadow', grassMeadowAttr);

  const grassMesh = new THREE.InstancedMesh(bladeGeo, bladeMat, grassSpots.length);
  grassMesh.castShadow = false;
  grassMesh.receiveShadow = true;

  const westPalette = [0x4c7032, 0x5b823c, 0x678e42, 0x769948, 0x3f612a];
  const eastPalette = [0x928a48, 0xa39751, 0x828443, 0xb0a158];
  const reedPalette = [0x587334, 0x6c803b, 0x828545];

  grassSpots.forEach((gs, idx) => {
    const y = sampleTerrainMeshHeight(terrainMesh, gs.x, gs.z);
    _vec3.set(gs.x, y - 0.03, gs.z);
    _quat.setFromEuler(_euler.set(0.05 * Math.sin(idx), gs.rot, 0.05 * Math.cos(idx)));
    _scale.set(gs.scale * 1.05, gs.scale, gs.scale * 1.05);
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

  let flowerMesh: THREE.InstancedMesh | null = null;
  if (flowerSpots.length > 0) {
    // Rooted meadow wildflower: tapered green stem (-0.05..0.31) + 5-sided blossom cup (0.28..0.41)
    const stemPart = new THREE.CylinderGeometry(0.015, 0.026, 0.36, 5, 2);
    stemPart.translate(0, 0.13, 0);
    const leafL = new THREE.BoxGeometry(0.09, 0.014, 0.035);
    leafL.rotateZ(0.45);
    leafL.translate(-0.045, 0.13, 0);
    const leafR = new THREE.BoxGeometry(0.09, 0.014, 0.035);
    leafR.rotateZ(-0.42);
    leafR.translate(0.045, 0.16, 0.02);
    const blossomPart = new THREE.CylinderGeometry(0.11, 0.03, 0.13, 5, 1);
    blossomPart.translate(0, 0.345, 0);

    const flowerParts = [
      { geo: stemPart, isBlossom: 0.0 },
      { geo: leafL, isBlossom: 0.0 },
      { geo: leafR, isBlossom: 0.0 },
      { geo: blossomPart, isBlossom: 1.0 },
    ].map(({ geo: raw, isBlossom }) => ({
      geo: raw.index ? raw.toNonIndexed() : raw,
      isBlossom,
    }));

    const totalFlowerVerts = flowerParts.reduce((acc, p) => acc + p.geo.attributes.position.count, 0);
    const fPosArr = new Float32Array(totalFlowerVerts * 3);
    const fNormArr = new Float32Array(totalFlowerVerts * 3);
    const fTipArr = new Float32Array(totalFlowerVerts);
    const fBlossomArr = new Float32Array(totalFlowerVerts);
    let fOff = 0;
    for (const part of flowerParts) {
      if (!part.geo.attributes.normal) part.geo.computeVertexNormals();
      const gp = part.geo.attributes.position;
      const gn = part.geo.attributes.normal;
      for (let vi = 0; vi < gp.count; vi++) {
        const vx = gp.getX(vi);
        const vy = gp.getY(vi);
        const vz = gp.getZ(vi);
        fPosArr[(fOff + vi) * 3] = vx;
        fPosArr[(fOff + vi) * 3 + 1] = vy;
        fPosArr[(fOff + vi) * 3 + 2] = vz;
        fNormArr[(fOff + vi) * 3] = gn.getX(vi);
        fNormArr[(fOff + vi) * 3 + 1] = gn.getY(vi);
        fNormArr[(fOff + vi) * 3 + 2] = gn.getZ(vi);
        fTipArr[fOff + vi] = THREE.MathUtils.clamp((vy + 0.05) / 0.46, 0, 1);
        fBlossomArr[fOff + vi] = part.isBlossom;
      }
      fOff += gp.count;
    }

    const flowerGeo = new THREE.BufferGeometry();
    flowerGeo.setAttribute('position', new THREE.BufferAttribute(fPosArr, 3));
    flowerGeo.setAttribute('normal', new THREE.BufferAttribute(fNormArr, 3));
    flowerGeo.setAttribute('aTip', new THREE.BufferAttribute(fTipArr, 1));
    flowerGeo.setAttribute('aIsBlossom', new THREE.BufferAttribute(fBlossomArr, 1));
    flowerGeo.setAttribute(
      'aMeadow',
      new THREE.InstancedBufferAttribute(
        new Float32Array(flowerSpots.map((fl) => fl.meadowFactor)),
        1,
      ),
    );
    const flowerMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.72,
      metalness: 0.02,
    });
    flowerMat.customProgramCacheKey = () => 'reactive-flower-v3';
    flowerMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uTime;
      shader.uniforms.uPlayerPos = uPlayerPos;
      shader.uniforms.uPlayerMove = uPlayerMove;
      shader.uniforms.uMeadowActivity = uMeadowActivity;
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
           attribute float aTip;
           attribute float aIsBlossom;
           attribute float aMeadow;
           uniform float uTime;
           uniform vec3 uPlayerPos;
           uniform vec3 uPlayerMove;
           uniform float uMeadowActivity;
           varying float vTip;
           varying float vIsBlossom;`,
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           vTip = aTip;
           vIsBlossom = aIsBlossom;
           vec4 instOrigin = vec4(0.0, 0.0, 0.0, 1.0);
           #ifdef USE_INSTANCING
             instOrigin = instanceMatrix * instOrigin;
           #endif
           float hFactor = aTip * aTip;
           float gust = sin(uTime * 1.65 + instOrigin.x * 0.14 + instOrigin.z * 0.11) * 0.10;
           transformed.x += gust * hFactor;
           vec2 dp = instOrigin.xz - uPlayerPos.xz;
           float dPlayer = length(dp);
           float meadowMask = clamp(aMeadow, 0.0, 1.0) * clamp(uMeadowActivity, 0.0, 1.35);
           float wakeRadius = mix(1.25, 2.25, clamp(meadowMask, 0.0, 1.0));
           if (dPlayer < wakeRadius && abs(instOrigin.y - uPlayerPos.y) < 1.6) {
             float pf = smoothstep(wakeRadius, 0.2, dPlayer);
             vec2 dir = dp / max(dPlayer, 0.001);
             vec2 wakePush = dir * (pf * (0.34 + meadowMask * 0.34));
             if (meadowMask > 0.01 && uPlayerMove.z > 0.05) {
               wakePush += normalize(uPlayerMove.xy) * (0.28 * pf * meadowMask);
             }
             transformed.xz += wakePush * aTip;
             transformed.y *= (1.0 - pf * (0.32 + meadowMask * 0.18) * aTip);
           }`,
        );

      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
           varying float vTip;
           varying float vIsBlossom;`,
        )
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
           if (vIsBlossom < 0.5) {
             diffuseColor.rgb = mix(vec3(0.20, 0.36, 0.14), vec3(0.36, 0.56, 0.22), clamp(vTip * 1.35, 0.0, 1.0));
           }`,
        );
    };
    flowerMesh = new THREE.InstancedMesh(flowerGeo, flowerMat, flowerSpots.length);
    const flowerPalette = [0xf7f1df, 0xf6c453, 0xf2a7c1, 0xebe6d6, 0xfa9c4b];
    flowerSpots.forEach((fl, idx) => {
      const y = sampleTerrainMeshHeight(terrainMesh, fl.x, fl.z);
      _vec3.set(fl.x, y - 0.02, fl.z);
      _quat.setFromEuler(_euler.set(0.06 * Math.sin(idx), fl.rot, 0.06 * Math.cos(idx)));
      _scale.setScalar(fl.scale);
      _mat4.compose(_vec3, _quat, _scale);
      flowerMesh!.setMatrixAt(idx, _mat4);
      _color.setHex(flowerPalette[idx % flowerPalette.length]);
      flowerMesh!.setColorAt(idx, _color);
    });
    flowerMesh.instanceMatrix.needsUpdate = true;
    if (flowerMesh.instanceColor) flowerMesh.instanceColor.needsUpdate = true;
    flowerMesh.computeBoundingSphere();
    group.add(flowerMesh);
  }

  if (pebbleSpots.length > 0) {
    const pebGeo = new THREE.IcosahedronGeometry(0.14, 1);
    const pebMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.85,
    });
    const pebMesh = new THREE.InstancedMesh(pebGeo, pebMat, pebbleSpots.length);
    pebbleSpots.forEach((pb, idx) => {
      const y = sampleTerrainMeshHeight(terrainMesh, pb.x, pb.z);
      _vec3.set(pb.x, y - 0.008, pb.z);
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

  const maxGrassCount = grassMesh.count;
  const maxFlowerCount = flowerMesh ? flowerMesh.count : 0;

  return {
    group,
    getShaderUniforms: () => ({
      uTime,
      uPlayerPos,
      uPlayerMove,
      uMeadowActivity,
    }),
    setQuality: (preset: GraphicsQualityPreset) => {
      const cfg = getGraphicsQualityConfig(preset);
      grassMesh.count = Math.max(1, Math.round(maxGrassCount * cfg.grassRatio));
      if (flowerMesh) {
        flowerMesh.count = Math.max(1, Math.round(maxFlowerCount * cfg.grassRatio));
      }
    },
    update: (
      elapsed: number,
      playerPos?: THREE.Vector3,
      interactors?: GrassInteractor[],
      playerMove?: THREE.Vector3,
      meadowActivity = 0,
    ) => {
      uTime.value = elapsed;
      if (playerPos) {
        uPlayerPos.value.copy(playerPos);
      }
      if (playerMove) {
        uPlayerMove.value.copy(playerMove);
      }
      uMeadowActivity.value = meadowActivity;
      for (let i = 0; i < GRASS_INTERACTOR_SLOTS; i++) {
        const item = interactors?.[i];
        if (item) {
          uInteractors.value[i].set(item.x, item.y, item.z, item.r);
        } else {
          uInteractors.value[i].set(0, -999, 0, 0);
        }
      }
    },
  };
}

/**
 * Natural Himalayan Glacial Meltwater River with Fresnel reflection tinting,
 * stony shallows, submerged riverbed boulders breaking the current, and whitewater ripples.
 */
export function createAnimatedRiver(textures: ProceduralTextureSet): AnimatedWaterController {
  const group = new THREE.Group();

  const geo = new THREE.PlaneGeometry(14.5, 636, 24, 165);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0, 164);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const rx = pos.getX(i);
    const rz = pos.getZ(i);
    pos.setX(i, rx + getRiverCenterX(rz));
    if (rz < -142) {
      pos.setY(i, -((-142 - rz) * 0.08));
    }
  }
  geo.computeVertexNormals();

  const uTime = { value: 0 };
  const mat = new THREE.MeshStandardMaterial({
    color: 0x1b4c54,
    normalMap: textures.waterNormal,
    normalScale: new THREE.Vector2(0.42, 0.42),
    roughness: 0.22,
    metalness: 0.14,
    transparent: true,
    opacity: 0.94,
  });

  applyRealisticWaterShader(mat, uTime, {
    mode: 'river',
    maxRadius: 7.25,
    flowSpeed: 2.1,
    deepTint: 0x0a323b,
    shallowTint: 0x1d585e,
  });

  const waterMesh = new THREE.Mesh(geo, mat);
  waterMesh.position.y = -0.34;
  waterMesh.receiveShadow = true;
  waterMesh.userData.nonCollidable = true;
  group.add(waterMesh);

  const stoneGeo = new THREE.IcosahedronGeometry(0.82, 3);
  if (stoneGeo.attributes.uv) {
    stoneGeo.setAttribute('uv1', stoneGeo.attributes.uv.clone());
  }
  const sPos = stoneGeo.attributes.position;
  for (let i = 0; i < sPos.count; i++) {
    const vx = sPos.getX(i);
    const vy = sPos.getY(i);
    const vz = sPos.getZ(i);
    const n =
      0.82 +
      0.22 * Math.sin(vx * 3.1 + vy * 2.4) * Math.cos(vz * 3.5) +
      0.08 * Math.sin(vx * 7.2 - vz * 6.4);
    sPos.setXYZ(i, vx * n, vy * n * 0.68, vz * n);
  }
  stoneGeo.computeVertexNormals();

  const riverStoneMat = new THREE.MeshStandardMaterial({
    map: textures.rockMap ?? textures.meadowMap,
    normalMap: textures.rockNormal,
    normalScale: new THREE.Vector2(0.95, 0.95),
    roughnessMap: textures.rockRough ?? textures.meadowRough,
    aoMap: textures.rockAo,
    aoMapIntensity: 0.78,
    color: 0xbcbab4,
    roughness: 0.52,
    metalness: 0.04,
  });

  const stoneCoords: Array<{ x: number; y: number; z: number; s: number }> = [];
  for (let i = 0; i < 196; i++) {
    const z = -150 + i * 3.15 + Math.sin(i * 1.9) * 0.75;
    if (Math.abs(z - BRIDGE_BOUNDS.centerZ) < 6.5) continue;
    if (z >= 220 && z <= 382) continue;
    const rcX = getRiverCenterX(z);
    const maxOffset = 4.2;
    const offset = Math.sin(i * 2.71) * maxOffset;
    const x = rcX + offset;
    const bedY = groundHeightAt(x, z);
    const s = 0.68 + (i % 5) * 0.26;
    const halfH = s * 0.72 * 0.56;
    stoneCoords.push({
      x,
      y: bedY + halfH * 0.45,
      z,
      s,
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

  // Drifting stylized autumn & sakura leaves riding the river current
  const leafCount = 96;
  const leafGeo = new THREE.PlaneGeometry(0.24, 0.14);
  leafGeo.rotateX(-Math.PI / 2);
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.65,
    side: THREE.DoubleSide,
  });
  const floatingLeaves = new THREE.InstancedMesh(leafGeo, leafMat, leafCount);
  floatingLeaves.userData.nonCollidable = true;
  const leafMeta: Array<{ offset: number; zBase: number; speed: number; rot: number; phase: number }> = [];
  const leafColors = [0xd95338, 0xe88d3a, 0xf2b5c8, 0xd4a438, 0xc7402a];
  for (let i = 0; i < leafCount; i++) {
    leafMeta.push({
      offset: (Math.sin(i * 19.37) * 0.65) * 4.5,
      zBase: -150 + (i / leafCount) * 600,
      speed: 1.35 + (i % 5) * 0.22,
      rot: i * 1.4,
      phase: i * 0.87,
    });
    _color.setHex(leafColors[i % leafColors.length]);
    floatingLeaves.setColorAt(i, _color);
  }
  if (floatingLeaves.instanceColor) floatingLeaves.instanceColor.needsUpdate = true;
  floatingLeaves.computeBoundingSphere();
  group.add(floatingLeaves);

  return {
    group,
    update: (elapsed: number) => {
      uTime.value = elapsed;
      for (let i = 0; i < leafCount; i++) {
        const m = leafMeta[i];
        const span = 600;
        const z = ((m.zBase + elapsed * m.speed + 150) % span) - 150;
        const x = getRiverCenterX(z) + m.offset + Math.sin(elapsed * 0.9 + m.phase) * 0.45;
        const y = -0.305 + Math.sin(elapsed * 2.2 + m.phase) * 0.014;
        _vec3.set(x, y, z);
        _quat.setFromEuler(_euler.set(0.05 * Math.sin(elapsed * 2 + m.phase), m.rot + elapsed * 0.35, 0.04 * Math.cos(elapsed * 1.7 + m.phase)));
        _scale.setScalar(1.0);
        _mat4.compose(_vec3, _quat, _scale);
        floatingLeaves.setMatrixAt(i, _mat4);
      }
      floatingLeaves.instanceMatrix.needsUpdate = true;
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
export function createCurbedRoads(
  textures: ProceduralTextureSet,
  terrainMesh?: THREE.Mesh,
): RoadAndLanternsResult {
  const group = new THREE.Group();
  const lanternLights: THREE.PointLight[] = [];

  const roadMat = new THREE.MeshStandardMaterial({
    map: textures.cobbleMap,
    normalMap: textures.cobbleNormal,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughnessMap: textures.cobbleRough,
    aoMap: textures.cobbleAo,
    aoMapIntensity: 0.88,
    color: 0xffffff,
    roughness: 1.0,
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
  const roadCobbleAo = textures.cobbleAo.clone();
  roadCobbleAo.repeat.set(1, 1);
  roadCobbleAo.needsUpdate = true;

  const roadRibbonMat = new THREE.MeshStandardMaterial({
    map: roadCobbleColor,
    normalMap: roadCobbleNormal,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughnessMap: roadCobbleRough,
    aoMap: roadCobbleAo,
    aoMapIntensity: 0.88,
    color: 0xffffff,
    roughness: 1.0,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const curbMat = new THREE.MeshStandardMaterial({
    map: textures.sandstoneMap,
    normalMap: textures.sandstoneNormal,
    normalScale: new THREE.Vector2(0.6, 0.6),
    roughnessMap: textures.sandstoneRough,
    aoMap: textures.sandstoneAo,
    aoMapIntensity: 0.85,
    color: 0xa69f93,
    roughness: 1.0,
    metalness: 0.03,
  });

  const sandstonePlazaMat = new THREE.MeshStandardMaterial({
    map: textures.sandstoneMap,
    normalMap: textures.sandstoneNormal,
    normalScale: new THREE.Vector2(0.82, 0.82),
    roughnessMap: textures.sandstoneRough,
    aoMap: textures.sandstoneAo,
    aoMapIntensity: 0.86,
    color: 0xffffff,
    roughness: 1.0,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const aprons = [
    { x: SPAWN_POSITION.x, z: SPAWN_POSITION.z, r: 7.4, mat: roadMat },
    ...LANDMARKS.filter(
      (lm) =>
        lm.id !== 'janaki-mandir' &&
        lm.id !== 'lumbini-buddha' &&
        lm.id !== 'kathmandu-stupa' &&
        lm.id !== 'boudhanath-stupa' &&
        lm.id !== 'pumdikot-shiva',
    ).map((lm) => ({
      x: lm.position.x,
      z: lm.position.z,
      r: 7.0,
      mat: lm.id === 'vit-vellore-tower' ? sandstonePlazaMat : roadMat,
    })),
  ];

  for (const ap of aprons) {
    const y = sampleTerrainMeshHeight(terrainMesh, ap.x, ap.z);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(ap.r, ap.r + 0.45, 0.26, 32), ap.mat);
    pad.position.set(ap.x, y - 0.03, ap.z);
    pad.receiveShadow = true;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(ap.r, 0.16, 8, 36), curbMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(ap.x, y + 0.08, ap.z);
    rim.receiveShadow = true;
    rim.castShadow = true;
    group.add(pad, rim);
  }

  const curbPositions: number[] = [];
  const curbUvs: number[] = [];
  const curbIndices: number[] = [];
  let curbVertCount = 0;

  const trimPlazas = [
    ...aprons,
  ];

  for (const rawPts of ROAD_PATHS) {
    const pts = trimPathBetweenPlazas(rawPts, trimPlazas);
    const curve = new THREE.CatmullRomCurve3(
      pts.map(([x, z]) => new THREE.Vector3(x, sampleTerrainMeshHeight(terrainMesh, x, z), z)),
    );
    const len = curve.getLength();
    if (len < 1.5) continue;
    const steps = Math.max(16, Math.min(260, Math.floor(len * 0.9)));
    const width = 4.0;
    const shoulder = 0.65;
    const uvScale = 0.28;

    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const ringMeta: Array<{
      lx: number;
      lz: number;
      rxp: number;
      rzp: number;
      dirX: number;
      dirZ: number;
      deckY: number;
      v: number;
    }> = [];

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

      let deckY =
        Math.max(
          groundHeightAt(p.x, p.z),
          groundHeightAt(lx, lz),
          groundHeightAt(rxp, rzp),
          sampleTerrainMeshHeight(terrainMesh, p.x, p.z),
          sampleTerrainMeshHeight(terrainMesh, lx, lz),
          sampleTerrainMeshHeight(terrainMesh, rxp, rzp),
        ) + 0.028;
      if (isInLumbiniSurroundingPond(p.x, p.z) || isOnLumbiniSacredBridge(p.x, p.z)) {
        deckY = -0.55;
      }
      const skirtY = deckY - 0.26;

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
        indices.push(base, base + 1, next);
        indices.push(base + 1, next + 1, next);
        indices.push(base + 1, base + 2, next + 1);
        indices.push(base + 2, next + 2, next + 1);
        indices.push(base + 2, base + 3, next + 2);
        indices.push(base + 3, next + 3, next + 2);
      }

      ringMeta.push({ lx, lz, rxp, rzp, dirX, dirZ, deckY, v });
    }

    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    roadGeo.setIndex(indices);
    roadGeo.computeVertexNormals();
    const roadMesh = new THREE.Mesh(roadGeo, roadRibbonMat);
    roadMesh.receiveShadow = true;
    group.add(roadMesh);

    // Continuous flush beveled granite curbstone ribbons on both road shoulders (no gapped boxes)
    const curbW = 0.28;
    const curbTop = 0.068;
    const curbBot = -0.18;
    for (const side of [-1, 1]) {
      let prevRingStart = -1;
      for (let i = 0; i <= steps; i++) {
        const rm = ringMeta[i];
        const baseX = side === -1 ? rm.lx : rm.rxp;
        const baseZ = side === -1 ? rm.lz : rm.rzp;
        const inChowk =
          baseX > -131.5 && baseX < -53.0 && baseZ > 70 && baseZ < 150.4;
        const inLumbini =
          baseX > LUMBINI_FENCE_BOUNDS.minX - 0.5 &&
          baseX < LUMBINI_FENCE_BOUNDS.maxX + 0.5 &&
          baseZ > LUMBINI_FENCE_BOUNDS.minZ - 0.5 &&
          baseZ < LUMBINI_FENCE_BOUNDS.maxZ + 0.5;
        const atEastCorridorTJunction =
          baseX > -208.0 &&
          baseX < -202.0 &&
          ((baseZ > 175.0 && baseZ < 180.0) || (baseZ > 19.0 && baseZ < 24.5));
        const inBoudhaGate = isInBoudhaPrecinct(baseX, baseZ, 4.5);
        const inPumdikotGate = isInPumdikotPrecinct(baseX, baseZ, 3.0);
        if (
          inChowk ||
          inLumbini ||
          atEastCorridorTJunction ||
          inBoudhaGate ||
          inPumdikotGate ||
          rm.deckY <= -0.1
        ) {
          prevRingStart = -1;
          continue;
        }
        const outX = rm.dirX * side;
        const outZ = rm.dirZ * side;
        const ix = baseX - outX * 0.02;
        const iz = baseZ - outZ * 0.02;
        const ox = baseX + outX * curbW;
        const oz = baseZ + outZ * curbW;
        const topY = rm.deckY + curbTop;
        const botY = rm.deckY + curbBot;

        const ringStart = curbVertCount;
        // 4-point beveled profile: inner-base, inner-top, outer-top, outer-base
        curbPositions.push(
          ix, rm.deckY - 0.04, iz,
          ix + outX * 0.03, topY, iz + outZ * 0.03,
          ox - outX * 0.03, topY, oz - outZ * 0.03,
          ox, botY, oz,
        );
        curbUvs.push(0, rm.v, 0.25, rm.v, 0.75, rm.v, 1, rm.v);
        curbVertCount += 4;

        if (prevRingStart >= 0) {
          for (let s = 0; s < 3; s++) {
            const a = prevRingStart + s;
            const b = prevRingStart + s + 1;
            const c = ringStart + s;
            const d = ringStart + s + 1;
            if (side === 1) {
              curbIndices.push(a, b, c, b, d, c);
            } else {
              curbIndices.push(a, c, b, b, c, d);
            }
          }
        }
        prevRingStart = ringStart;
      }
    }
  }

  if (curbPositions.length > 0) {
    const continuousCurbGeo = new THREE.BufferGeometry();
    continuousCurbGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbPositions, 3));
    continuousCurbGeo.setAttribute('uv', new THREE.Float32BufferAttribute(curbUvs, 2));
    continuousCurbGeo.setIndex(curbIndices);
    continuousCurbGeo.computeVertexNormals();
    const continuousCurbMesh = new THREE.Mesh(continuousCurbGeo, curbMat);
    continuousCurbMesh.castShadow = true;
    continuousCurbMesh.receiveShadow = true;
    group.add(continuousCurbMesh);
  }

  mergeStaticMeshesByMaterial(group, { preserveCustomShaderMaterials: true });

  const lanternGroup = new THREE.Group();
  lanternGroup.userData.snapCategory = 'lantern-root';
  group.add(lanternGroup);

  const lanternCoords = ROAD_LANTERN_COORDS;
  const lanternStoneMat = getCachedMaterial(textures, 'road-lantern-stone', () =>
    new THREE.MeshStandardMaterial({
    map: textures.cobbleMap,
    normalMap: textures.cobbleNormal,
    normalScale: new THREE.Vector2(0.7, 0.7),
    roughnessMap: textures.cobbleRough,
    aoMap: textures.cobbleAo,
    aoMapIntensity: 0.86,
    color: 0x94938c,
    roughness: 1.0,
  }),
  );
  const lanternBronzeMat = getCachedMaterial(textures, 'road-lantern-bronze', () =>
    new THREE.MeshStandardMaterial({
      color: 0x8c6427,
      roughness: 0.34,
      metalness: 0.84,
    }),
  );
  const lanternGlowMat = getCachedMaterial(textures, 'road-lantern-glow', () =>
    new THREE.MeshStandardMaterial({
      color: 0xffdf9e,
      emissive: 0xe69832,
      emissiveIntensity: 2.2,
      roughness: 0.25,
    }),
  );

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

  lanternCoords.forEach(([lx, lz]) => {
    const ly = isOnLumbiniBridgeAbutmentPier(lx, lz)
      ? 0.34
      : sampleTerrainMeshHeight(terrainMesh, lx, lz);
    const post = new THREE.Group();
    post.position.set(lx, ly, lz);
    post.userData.snapCategory = 'lantern';
    post.userData.groundEmbed = 0.44;
    post.userData.lockXZ = true;

    const footing = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.46, 0.76), lanternStoneMat);
    footing.position.y = -0.22;
    footing.receiveShadow = true;
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.14, 0.74), lanternStoneMat);
    plinth.position.y = 0.08;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    const detailedLantern = buildPeaceLantern(lanternStoneMat, lanternBronzeMat, lanternGlowMat);
    detailedLantern.position.y = 0.15;
    post.add(footing, plinth, detailedLantern);

    const ptLight = new THREE.PointLight(0xffb54d, 1.85, 19, 1.6);
    ptLight.position.set(0, 2.02, 0);
    ptLight.userData.intensityScale = 1.28;
    ptLight.userData.flickerAmp = 0.08;
    ptLight.userData.flickerPhase = lx * 0.37 + lz * 0.51;
    ptLight.userData.warmFlicker = true;
    post.add(ptLight);
    lanternLights.push(ptLight);
    lanternGroup.add(post);
  });

  // Carved Stone Directional Mileposts along Southern Perimeter Boulevard & Pashupati West Avenue
  const milepostSpecs: Array<{ x: number; z: number; rotY: number; lines: string[] }> = [
    {
      x: -96.5,
      z: 166.0,
      rotY: 0.15,
      lines: ['<- LUMBINI', 'JANAKI ^', 'v PASHUPATI'],
    },
    {
      x: -33.5,
      z: 228.0,
      rotY: 0.0,
      lines: ['PASHUPATINATH', 'NORTH GATE v', '<- PASCHIM DWAR'],
    },
    {
      x: -97.0,
      z: 276.0,
      rotY: 1.57,
      lines: ['PASCHIM DWAR ->', 'PASHUPATINATH', '<- BOUDHANATH'],
    },
    {
      x: -168.0,
      z: 293.0,
      rotY: 1.57,
      lines: ['<- BOUDHANATH', 'KORA PLAZA', 'PASHUPATI ->'],
    },
    {
      x: -43.5,
      z: -24.5,
      rotY: -0.3,
      lines: ['PUMDIKOT ^', '108-FT SHIVA', 'RIVER BRIDGE ->'],
    },
    {
      x: 58.0,
      z: -20.5,
      rotY: 0.25,
      lines: ['VIT VELLORE ->', 'ANIFLOW STUDIO ^', 'SYSTEMS CITADEL'],
    },
  ];
  for (const mp of milepostSpecs) {
    const my = sampleTerrainMeshHeight(terrainMesh, mp.x, mp.z);
    const mpGroup = new THREE.Group();
    mpGroup.position.set(mp.x, my, mp.z);
    mpGroup.rotation.y = mp.rotY;
    mpGroup.userData.snapCategory = 'milepost';
    mpGroup.userData.lockXZ = true;

    const base = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.36, 0.65), lanternStoneMat);
    base.position.y = 0.18;
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.45, 0.32), curbMat);
    pillar.position.y = 1.05;
    pillar.castShadow = true;
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.42, 4), lanternStoneMat);
    cap.rotation.y = Math.PI * 0.25;
    cap.position.y = 1.98;
    mpGroup.add(base, pillar, cap);

    if (typeof document !== 'undefined') {
      const mc = document.createElement('canvas');
      mc.width = 256;
      mc.height = 192;
      const mctx = mc.getContext('2d');
      if (mctx) {
        mctx.fillStyle = '#2c2824';
        mctx.fillRect(0, 0, 256, 192);
        mctx.strokeStyle = '#d4a244';
        mctx.lineWidth = 6;
        mctx.strokeRect(8, 8, 240, 176);
        mctx.fillStyle = '#f5dfb0';
        mctx.font = 'bold 22px Georgia, serif';
        mctx.textAlign = 'center';
        mp.lines.forEach((ln, idx) => mctx.fillText(ln, 128, 56 + idx * 44));
      }
      const mTex = new THREE.CanvasTexture(mc);
      mTex.colorSpace = THREE.SRGBColorSpace;
      const plaqueMat = new THREE.MeshStandardMaterial({ map: mTex, roughness: 0.65 });
      const frontP = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.72), plaqueMat);
      frontP.position.set(0, 1.18, 0.17);
      const backP = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.72), plaqueMat);
      backP.rotation.y = Math.PI;
      backP.position.set(0, 1.18, -0.17);
      mpGroup.add(frontP, backP);
    }
    group.add(mpGroup);
  }

  return { group, lanternGroup, lanternLights };
}

function mergeStaticGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const nonIndexed = geos.map((g) => (g.index ? g.toNonIndexed() : g));
  let totalVerts = 0;
  for (const g of nonIndexed) {
    totalVerts += g.attributes.position.count;
  }
  const posArr = new Float32Array(totalVerts * 3);
  const normArr = new Float32Array(totalVerts * 3);
  const uvArr = new Float32Array(totalVerts * 2);

  let vOffset = 0;
  for (const g of nonIndexed) {
    if (!g.attributes.normal) g.computeVertexNormals();
    const pos = g.attributes.position;
    const norm = g.attributes.normal;
    const uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const dst3 = (vOffset + i) * 3;
      const dst2 = (vOffset + i) * 2;
      posArr[dst3] = pos.getX(i);
      posArr[dst3 + 1] = pos.getY(i);
      posArr[dst3 + 2] = pos.getZ(i);
      normArr[dst3] = norm.getX(i);
      normArr[dst3 + 1] = norm.getY(i);
      normArr[dst3 + 2] = norm.getZ(i);
      uvArr[dst2] = uv ? uv.getX(i) : 0;
      uvArr[dst2 + 1] = uv ? uv.getY(i) : 0;
    }
    vOffset += pos.count;
  }

  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(normArr, 3));
  const uvAttr = new THREE.BufferAttribute(uvArr, 2);
  out.setAttribute('uv', uvAttr);
  out.setAttribute('uv1', uvAttr.clone());
  return out;
}

function makeBranchSkeletonGeo(
  curves: Array<{ pts: Array<[number, number, number]>; rStart: number; rEnd: number }>,
): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (const br of curves) {
    const curve = new THREE.CatmullRomCurve3(
      br.pts.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    );
    const tube = new THREE.TubeGeometry(curve, 8, (br.rStart + br.rEnd) * 0.5, 6, false);
    const p = tube.attributes.position;
    // Taper radius cleanly along curve length
    const center = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      const ringIdx = Math.floor(i / 7);
      const t = Math.min(1, ringIdx / 8);
      curve.getPointAt(t, center);
      const taper = THREE.MathUtils.lerp(br.rStart, br.rEnd, t) / ((br.rStart + br.rEnd) * 0.5);
      p.setXYZ(
        i,
        center.x + (p.getX(i) - center.x) * taper,
        center.y + (p.getY(i) - center.y) * taper,
        center.z + (p.getZ(i) - center.z) * taper,
      );
    }
    tube.computeVertexNormals();
    parts.push(tube);
  }
  return mergeStaticGeometries(parts);
}

function makeBotanicalCanopySprayGeo(
  clusters: Array<{
    x: number;
    y: number;
    z: number;
    w: number;
    h: number;
    rx: number;
    ry: number;
    rz: number;
    arch: number;
  }>,
): THREE.BufferGeometry {
  const planes: THREE.BufferGeometry[] = [];
  for (const cl of clusters) {
    for (let cross = 0; cross < 3; cross++) {
      const g = new THREE.PlaneGeometry(cl.w, cl.h, 2, 3);
      const pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const px = pos.getX(i);
        const py = pos.getY(i);
        const nx = px / (cl.w * 0.5);
        const ny = py / (cl.h * 0.5);
        const dome = (1 - (nx * nx * 0.52 + ny * ny * 0.52)) * cl.arch;
        pos.setZ(i, dome);
      }
      g.rotateX(cl.rx + (cross === 1 ? 0.32 : cross === 2 ? -0.34 : 0));
      g.rotateY(cl.ry + cross * (Math.PI / 3));
      g.rotateZ(cl.rz);
      g.translate(cl.x, cl.y, cl.z);
      planes.push(g);
    }
  }
  const merged = mergeStaticGeometries(planes);
  // Sculpted volumetric canopy normals (soft upward & outward spherical gradient so crowns read lush & sunlit)
  const mPos = merged.attributes.position;
  const mNorm = merged.attributes.normal;
  let sumY = 0;
  for (let i = 0; i < mPos.count; i++) sumY += mPos.getY(i);
  const centerY = mPos.count > 0 ? sumY / mPos.count : 3.2;
  for (let i = 0; i < mPos.count; i++) {
    const px = mPos.getX(i);
    const py = mPos.getY(i) - centerY;
    const pz = mPos.getZ(i);
    const sx = px * 0.65;
    const sy = py * 0.72 + 0.85;
    const sz = pz * 0.65;
    const len = Math.hypot(sx, sy, sz) || 1;
    mNorm.setXYZ(i, sx / len, sy / len, sz / len);
  }
  mNorm.needsUpdate = true;
  return merged;
}

export function createInstancedFoliage(
  textures: ProceduralTextureSet,
  terrainMesh?: THREE.Mesh,
): AnimatedFoliageController {
  const group = new THREE.Group();
  const treeSpots = getWorldTreeSpots();

  const bySpecies = new Map<TreeSpecies, TreeSpot[]>();
  for (const spot of treeSpots) {
    const arr = bySpecies.get(spot.type);
    if (arr) arr.push(spot);
    else bySpecies.set(spot.type, [spot]);
  }

  const uTreeTime = { value: 0 };
  const uBumpPos = { value: new THREE.Vector3(0, -999, 0) };
  const uBumpStrength = { value: 0 };

  const applyTreeSwayShader = (
    mat: THREE.MeshStandardMaterial | THREE.MeshDepthMaterial,
    isDepth: boolean,
  ) => {
    mat.customProgramCacheKey = () => (isDepth ? 'tree-sway-depth-v1' : 'tree-sway-v1');
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTreeTime = uTreeTime;
      shader.uniforms.uBumpPos = uBumpPos;
      shader.uniforms.uBumpStrength = uBumpStrength;

      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
           uniform float uTreeTime;
           uniform vec3 uBumpPos;
           uniform float uBumpStrength;
           varying float vCanopyHeight;`,
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           vec4 instBase = vec4(0.0, 0.0, 0.0, 1.0);
           #ifdef USE_INSTANCING
             instBase = instanceMatrix * instBase;
           #endif
           float crownWeight = clamp((position.y - 1.2) / 3.4, 0.0, 1.0);
           vCanopyHeight = crownWeight;
           float breeze = sin(uTreeTime * 1.45 + instBase.x * 0.17 + instBase.z * 0.13 + position.y * 0.65);
           float flutter = cos(uTreeTime * 3.4 + position.x * 2.1 + position.z * 1.9 + instBase.x) * 0.045;
           transformed.x += (breeze * 0.11 + flutter) * crownWeight;
           transformed.z += (breeze * 0.07 - flutter * 0.6) * crownWeight;

           if (uBumpStrength > 0.001) {
             float bDist = length(instBase.xz - uBumpPos.xz);
             float bMask = 1.0 - smoothstep(0.5, 4.2, bDist);
             float shake = sin(uTreeTime * 26.0) * uBumpStrength * bMask * crownWeight * 0.28;
             transformed.x += shake;
             transformed.z += cos(uTreeTime * 23.0) * uBumpStrength * bMask * crownWeight * 0.22;
           }`,
        );

      if (!isDepth) {
        shader.fragmentShader = shader.fragmentShader
          .replace(
            '#include <common>',
            `#include <common>
             varying float vCanopyHeight;`,
          )
          .replace(
            '#include <color_fragment>',
            `#include <color_fragment>
             float crownGrad = mix(0.86, 1.24, smoothstep(0.0, 1.0, vCanopyHeight));
             diffuseColor.rgb *= crownGrad;
             diffuseColor.rgb += vec3(0.04, 0.03, 0.01) * vCanopyHeight;`,
          );
      }
    };
  };

  const barkMat = new THREE.MeshStandardMaterial({
    map: textures.barkMap,
    normalMap: textures.barkNormal,
    normalScale: new THREE.Vector2(1.0, 1.0),
    color: 0xffffff,
    roughness: 0.92,
  });

  const silverBirchBarkMat = new THREE.MeshStandardMaterial({
    map: textures.barkSilverBirchMap,
    normalMap: textures.barkNormal,
    normalScale: new THREE.Vector2(0.75, 0.75),
    color: 0xffffff,
    roughness: 0.82,
  });

  const makeFoliageMat = (map: THREE.Texture, roughness = 0.74) => {
    const m = new THREE.MeshStandardMaterial({
      map,
      alphaTest: 0.34,
      color: 0xffffff,
      roughness,
      metalness: 0.01,
      side: THREE.DoubleSide,
    });
    applyTreeSwayShader(m, false);
    return m;
  };

  const makeFoliageDepthMat = (map: THREE.Texture) => {
    const dm = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
      map,
      alphaTest: 0.34,
    });
    applyTreeSwayShader(dm, true);
    return dm;
  };

  // Shared branching trunks & rich organic alpha-cutout canopy sprays across 11 real-world species
  const wideGnarledTrunkGeo = makeBranchSkeletonGeo([
    { pts: [[0, -0.78, 0], [0.02, 0.1, 0.01], [0.06, 1.05, 0.03], [-0.04, 2.05, -0.02]], rStart: 0.27, rEnd: 0.14 },
    { pts: [[-0.02, 1.75, 0], [-0.62, 2.38, 0.38], [-1.24, 2.75, 0.65]], rStart: 0.12, rEnd: 0.045 },
    { pts: [[0.02, 1.82, -0.02], [0.68, 2.45, -0.35], [1.28, 2.84, -0.62]], rStart: 0.12, rEnd: 0.045 },
    { pts: [[-0.03, 1.9, 0.02], [-0.42, 2.52, -0.68], [-0.76, 2.95, -1.16]], rStart: 0.11, rEnd: 0.04 },
    { pts: [[0.01, 1.95, 0.04], [0.46, 2.58, 0.66], [0.82, 3.05, 1.1]], rStart: 0.11, rEnd: 0.04 },
  ]);

  const tallForkedTrunkGeo = makeBranchSkeletonGeo([
    { pts: [[0, -0.78, 0], [0.01, 0.1, 0], [0.04, 1.35, -0.03], [-0.02, 2.7, 0.04], [0.03, 3.6, 0]], rStart: 0.26, rEnd: 0.08 },
    { pts: [[0, 2.2, 0], [-0.72, 2.92, 0.34], [-1.18, 3.45, 0.56]], rStart: 0.11, rEnd: 0.04 },
    { pts: [[0, 2.4, 0], [0.75, 3.1, -0.28], [1.22, 3.62, -0.52]], rStart: 0.11, rEnd: 0.04 },
    { pts: [[0, 2.6, 0], [-0.36, 3.3, -0.72], [-0.6, 3.85, -1.05]], rStart: 0.095, rEnd: 0.035 },
    { pts: [[0, 2.7, 0], [0.32, 3.42, 0.72], [0.55, 3.95, 1.02]], rStart: 0.095, rEnd: 0.035 },
  ]);

  const birchMultiStemGeo = makeBranchSkeletonGeo([
    { pts: [[-0.12, -0.78, 0.05], [-0.14, 0.1, 0.06], [-0.32, 1.6, 0.18], [-0.52, 3.45, 0.28]], rStart: 0.12, rEnd: 0.038 },
    { pts: [[0.14, -0.78, -0.06], [0.16, 0.1, -0.07], [0.36, 1.75, -0.16], [0.56, 3.7, -0.26]], rStart: 0.12, rEnd: 0.038 },
    { pts: [[0.0, -0.78, 0.0], [0.01, 0.1, 0.01], [0.05, 1.9, 0.04], [-0.08, 3.95, -0.06]], rStart: 0.14, rEnd: 0.04 },
    { pts: [[-0.25, 2.1, 0.12], [-0.78, 2.9, 0.48]], rStart: 0.05, rEnd: 0.02 },
    { pts: [[0.28, 2.3, -0.1], [0.85, 3.15, -0.45]], rStart: 0.05, rEnd: 0.02 },
  ]);

  const coniferTrunkGeo = makeBranchSkeletonGeo([
    { pts: [[0, -0.78, 0], [0.01, 0.1, 0], [0.03, 2.1, -0.02], [-0.02, 4.3, 0.02], [0, 5.5, 0]], rStart: 0.26, rEnd: 0.04 },
    { pts: [[0, 1.85, 0], [-0.85, 1.72, 0.25]], rStart: 0.065, rEnd: 0.02 },
    { pts: [[0, 2.15, 0], [0.82, 2.02, -0.25]], rStart: 0.065, rEnd: 0.02 },
    { pts: [[0, 2.65, 0], [0.18, 2.52, 0.72]], rStart: 0.055, rEnd: 0.02 },
    { pts: [[0, 3.15, 0], [-0.22, 3.02, -0.68]], rStart: 0.05, rEnd: 0.02 },
  ]);

  const wideUmbrellaSprayGeo = makeBotanicalCanopySprayGeo([
    { x: 0, y: 3.45, z: 0, w: 2.35, h: 2.05, rx: 0.22, ry: 0.15, rz: 0.05, arch: 0.45 },
    { x: -1.15, y: 2.85, z: 0.58, w: 1.95, h: 1.75, rx: 0.35, ry: 0.7, rz: 0.14, arch: 0.38 },
    { x: 1.22, y: 2.95, z: -0.52, w: 1.95, h: 1.75, rx: 0.32, ry: -0.6, rz: -0.12, arch: 0.38 },
    { x: -0.72, y: 3.05, z: -1.08, w: 1.85, h: 1.7, rx: -0.3, ry: 0.4, rz: 0.1, arch: 0.35 },
    { x: 0.78, y: 3.12, z: 1.02, w: 1.85, h: 1.7, rx: 0.32, ry: -0.35, rz: -0.08, arch: 0.35 },
    { x: -0.45, y: 3.65, z: 0.32, w: 1.65, h: 1.5, rx: 0.18, ry: 1.1, rz: 0.04, arch: 0.3 },
    { x: 0.48, y: 3.72, z: -0.28, w: 1.65, h: 1.5, rx: -0.2, ry: 2.1, rz: -0.04, arch: 0.3 },
  ]);

  const tallCrownSprayGeo = makeBotanicalCanopySprayGeo([
    { x: 0, y: 4.15, z: 0, w: 2.1, h: 2.05, rx: 0.25, ry: 0.2, rz: 0.05, arch: 0.42 },
    { x: -1.05, y: 3.45, z: 0.52, w: 1.8, h: 1.75, rx: 0.34, ry: 0.85, rz: 0.12, arch: 0.34 },
    { x: 1.1, y: 3.55, z: -0.48, w: 1.8, h: 1.75, rx: -0.32, ry: 0.55, rz: -0.1, arch: 0.34 },
    { x: -0.58, y: 3.72, z: -0.95, w: 1.7, h: 1.65, rx: -0.28, ry: 1.4, rz: 0.08, arch: 0.32 },
    { x: 0.52, y: 3.85, z: 0.94, w: 1.7, h: 1.65, rx: 0.28, ry: -1.1, rz: -0.08, arch: 0.32 },
    { x: 0.1, y: 4.55, z: 0.1, w: 1.55, h: 1.55, rx: 0.16, ry: 0.9, rz: 0.02, arch: 0.28 },
  ]);

  const weepingWillowSprayGeo = makeBotanicalCanopySprayGeo([
    { x: 0, y: 3.85, z: 0, w: 2.15, h: 2.35, rx: 0.12, ry: 0.1, rz: 0.04, arch: 0.38 },
    { x: -1.2, y: 2.75, z: 0.45, w: 1.65, h: 2.75, rx: 0.08, ry: 0.72, rz: 0.12, arch: 0.28 },
    { x: 1.2, y: 2.75, z: -0.45, w: 1.65, h: 2.75, rx: -0.08, ry: -0.72, rz: -0.12, arch: 0.28 },
    { x: -0.48, y: 2.8, z: -1.15, w: 1.65, h: 2.7, rx: -0.1, ry: 1.4, rz: 0.08, arch: 0.28 },
    { x: 0.48, y: 2.8, z: 1.15, w: 1.65, h: 2.7, rx: 0.1, ry: -1.4, rz: -0.08, arch: 0.28 },
    { x: -0.95, y: 3.25, z: -0.82, w: 1.55, h: 2.45, rx: -0.1, ry: 0.45, rz: 0.06, arch: 0.25 },
    { x: 0.95, y: 3.25, z: 0.82, w: 1.55, h: 2.45, rx: 0.1, ry: -0.45, rz: -0.06, arch: 0.25 },
  ]);

  const deodarBoughSprayGeo = makeBotanicalCanopySprayGeo([
    { x: -0.75, y: 1.95, z: 0.55, w: 1.85, h: 1.25, rx: -1.15, ry: 0.5, rz: 0.12, arch: 0.24 },
    { x: 0.78, y: 1.98, z: -0.52, w: 1.85, h: 1.25, rx: 1.15, ry: 0.6, rz: -0.12, arch: 0.24 },
    { x: -0.52, y: 2.02, z: -0.78, w: 1.8, h: 1.25, rx: 1.18, ry: 2.1, rz: 0.08, arch: 0.24 },
    { x: 0.55, y: 2.05, z: 0.75, w: 1.8, h: 1.25, rx: -1.18, ry: -0.8, rz: -0.08, arch: 0.24 },
    { x: -0.55, y: 2.95, z: 0.42, w: 1.5, h: 1.1, rx: -1.1, ry: 0.9, rz: 0.1, arch: 0.22 },
    { x: 0.58, y: 3.0, z: -0.42, w: 1.5, h: 1.1, rx: 1.1, ry: 0.3, rz: -0.1, arch: 0.22 },
    { x: 0.0, y: 3.85, z: 0.0, w: 1.45, h: 1.15, rx: -1.05, ry: 1.5, rz: 0.05, arch: 0.2 },
    { x: 0.0, y: 4.75, z: 0.0, w: 1.05, h: 1.1, rx: 0.3, ry: 0.4, rz: 0.0, arch: 0.18 },
    { x: 0.0, y: 5.35, z: 0.0, w: 0.72, h: 0.9, rx: 0.1, ry: 1.2, rz: 0.0, arch: 0.14 },
  ]);

  const cypressColumnSprayGeo = makeBotanicalCanopySprayGeo([
    { x: 0, y: 1.85, z: 0, w: 1.05, h: 1.75, rx: 0.08, ry: 0.2, rz: 0.04, arch: 0.22 },
    { x: 0, y: 2.95, z: 0, w: 0.95, h: 1.85, rx: -0.08, ry: 1.05, rz: -0.04, arch: 0.2 },
    { x: 0, y: 4.05, z: 0, w: 0.8, h: 1.75, rx: 0.06, ry: 0.65, rz: 0.03, arch: 0.16 },
    { x: 0, y: 5.05, z: 0, w: 0.55, h: 1.35, rx: -0.05, ry: 1.5, rz: -0.02, arch: 0.12 },
  ]);

  interface SpeciesBuildConfig {
    trunkGeo: THREE.BufferGeometry;
    trunkMat: THREE.Material;
    canopyGeo: THREE.BufferGeometry;
    canopyTex: THREE.Texture;
    palette: number[];
    roughness?: number;
  }

  const speciesConfigs: Record<Exclude<TreeSpecies, 'palm'>, SpeciesBuildConfig> = {
    sakura: {
      trunkGeo: wideGnarledTrunkGeo,
      trunkMat: barkMat,
      canopyGeo: wideUmbrellaSprayGeo,
      canopyTex: textures.sakuraBlossomMap,
      palette: [0xffd8e4, 0xffc6d9, 0xffe6ef, 0xf7b8cd],
      roughness: 0.68,
    },
    maple: {
      trunkGeo: wideGnarledTrunkGeo,
      trunkMat: barkMat,
      canopyGeo: wideUmbrellaSprayGeo,
      canopyTex: textures.mapleFoliageMap,
      palette: [0xd94b2b, 0xe8732a, 0xc43728, 0xeb922f],
      roughness: 0.74,
    },
    jacaranda: {
      trunkGeo: wideGnarledTrunkGeo,
      trunkMat: barkMat,
      canopyGeo: wideUmbrellaSprayGeo,
      canopyTex: textures.jacarandaBloomMap,
      palette: [0x9275eb, 0xa88ef5, 0x8062db, 0xb89ef7],
      roughness: 0.7,
    },
    gulmohar: {
      trunkGeo: wideGnarledTrunkGeo,
      trunkMat: barkMat,
      canopyGeo: wideUmbrellaSprayGeo,
      canopyTex: textures.gulmoharBloomMap,
      palette: [0xf25224, 0xf57827, 0xdc3a20, 0xf7942a],
      roughness: 0.7,
    },
    willow: {
      trunkGeo: tallForkedTrunkGeo,
      trunkMat: barkMat,
      canopyGeo: weepingWillowSprayGeo,
      canopyTex: textures.willowFrondMap,
      palette: [0x7ea64b, 0x6f9641, 0x8cb356, 0x648a38],
      roughness: 0.76,
    },
    birch: {
      trunkGeo: birchMultiStemGeo,
      trunkMat: silverBirchBarkMat,
      canopyGeo: tallCrownSprayGeo,
      canopyTex: textures.birchLeafMap,
      palette: [0xd2de64, 0xb8cf55, 0xe5d75c, 0x9ec250],
      roughness: 0.75,
    },
    peepal: {
      trunkGeo: wideGnarledTrunkGeo,
      trunkMat: barkMat,
      canopyGeo: wideUmbrellaSprayGeo,
      canopyTex: textures.broadleafFoliageMap,
      palette: [0x58873d, 0x669647, 0x4b7733, 0x72a150],
      roughness: 0.78,
    },
    rhodo: {
      trunkGeo: wideGnarledTrunkGeo,
      trunkMat: barkMat,
      canopyGeo: wideUmbrellaSprayGeo,
      canopyTex: textures.gulmoharBloomMap,
      palette: [0xba2544, 0xcf3255, 0xa31b38, 0xd64566],
      roughness: 0.72,
    },
    deodar: {
      trunkGeo: coniferTrunkGeo,
      trunkMat: barkMat,
      canopyGeo: deodarBoughSprayGeo,
      canopyTex: textures.pineNeedlesMap,
      palette: [0x4c6e4b, 0x426141, 0x577a54, 0x3b573b],
      roughness: 0.84,
    },
    cypress: {
      trunkGeo: coniferTrunkGeo,
      trunkMat: barkMat,
      canopyGeo: cypressColumnSprayGeo,
      canopyTex: textures.pineNeedlesMap,
      palette: [0x3d5c42, 0x344f38, 0x47694b],
      roughness: 0.84,
    },
  };

  (Object.keys(speciesConfigs) as Array<Exclude<TreeSpecies, 'palm'>>).forEach((sp, spIdx) => {
    const spots = bySpecies.get(sp);
    if (!spots || spots.length === 0) return;
    const cfg = speciesConfigs[sp];
    const canopyMat = makeFoliageMat(cfg.canopyTex, cfg.roughness ?? 0.76);
    const depthMat = makeFoliageDepthMat(cfg.canopyTex);

    const mTrunks = new THREE.InstancedMesh(cfg.trunkGeo, cfg.trunkMat, spots.length);
    const mCanopy = new THREE.InstancedMesh(cfg.canopyGeo, canopyMat, spots.length);
    mCanopy.userData.nonCollidable = true;
    mCanopy.customDepthMaterial = depthMat;

    spots.forEach((p, idx) => {
      const rRim = 0.48 * p.scale;
      const y = Math.min(
        sampleTerrainMeshHeight(terrainMesh, p.x, p.z),
        groundHeightAt(p.x, p.z),
        sampleTerrainMeshHeight(terrainMesh, p.x + rRim, p.z),
        sampleTerrainMeshHeight(terrainMesh, p.x - rRim, p.z),
        sampleTerrainMeshHeight(terrainMesh, p.x, p.z + rRim),
        sampleTerrainMeshHeight(terrainMesh, p.x, p.z - rRim),
      );
      _vec3.set(p.x, y - 0.12, p.z);
      _quat.setFromEuler(_euler.set(0, idx * 1.47 + spIdx * 0.7, 0));
      _scale.setScalar(p.scale);
      _mat4.compose(_vec3, _quat, _scale);
      mTrunks.setMatrixAt(idx, _mat4);
      mCanopy.setMatrixAt(idx, _mat4);
      _color.setHex(cfg.palette[idx % cfg.palette.length]);
      mCanopy.setColorAt(idx, _color);
    });

    [mTrunks, mCanopy].forEach((m) => {
      m.castShadow = true;
      m.receiveShadow = true;
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      m.computeBoundingSphere();
      group.add(m);
    });
  });

  // Instanced Vellore Tropical Coconut Palms with Pinnate Leaflets
  const palms = bySpecies.get('palm') ?? [];
  if (palms.length > 0) {
    const palmCurvePts = [
      new THREE.Vector3(0, -0.78, 0),
      new THREE.Vector3(0.02, 0.1, 0),
      new THREE.Vector3(0.14, 1.45, 0.06),
      new THREE.Vector3(0.32, 3.05, 0.14),
      new THREE.Vector3(0.4, 4.65, 0.2),
    ];
    const palmTrunkGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(palmCurvePts), 12, 0.15, 8, false);

    const frondGeo = new THREE.PlaneGeometry(0.95, 2.55, 2, 7);
    const fPos = frondGeo.attributes.position;
    for (let i = 0; i < fPos.count; i++) {
      const fx = fPos.getX(i);
      const fy = fPos.getY(i) + 1.275;
      const t = fy / 2.55;
      const archY = Math.sin(t * Math.PI * 0.75) * 0.56 - t * t * 0.92;
      fPos.setXYZ(i, fx, archY, fy);
    }
    frondGeo.computeVertexNormals();

    const crownParts: THREE.BufferGeometry[] = [];
    for (let f = 0; f < 9; f++) {
      const fg = frondGeo.clone();
      fg.rotateX(f % 2 === 0 ? 0.08 : 0.24);
      fg.rotateY((f / 9) * Math.PI * 2);
      fg.translate(0.4, 4.62, 0.2);
      crownParts.push(fg);
    }
    const palmCrownGeo = mergeStaticGeometries(crownParts);

    const nutParts: THREE.BufferGeometry[] = [];
    for (let c = 0; c < 4; c++) {
      const a = (c / 4) * Math.PI * 2;
      const ng = new THREE.SphereGeometry(0.13, 8, 6);
      ng.translate(0.4 + Math.cos(a) * 0.16, 4.48, 0.2 + Math.sin(a) * 0.16);
      nutParts.push(ng);
    }
    const palmNutsGeo = mergeStaticGeometries(nutParts);

    const palmMat = makeFoliageMat(textures.palmFrondMap, 0.72);
    const coconutMat = new THREE.MeshStandardMaterial({ color: 0x4f3a1e, roughness: 0.82 });

    const mPalmTrunks = new THREE.InstancedMesh(palmTrunkGeo, barkMat, palms.length);
    const mPalmCrowns = new THREE.InstancedMesh(palmCrownGeo, palmMat, palms.length);
    const mPalmNuts = new THREE.InstancedMesh(palmNutsGeo, coconutMat, palms.length);
    mPalmCrowns.userData.nonCollidable = true;
    mPalmNuts.userData.nonCollidable = true;
    mPalmCrowns.customDepthMaterial = makeFoliageDepthMat(textures.palmFrondMap);

    palms.forEach((p, idx) => {
      const rRim = 0.45 * p.scale;
      const y = Math.min(
        sampleTerrainMeshHeight(terrainMesh, p.x, p.z),
        groundHeightAt(p.x, p.z),
        sampleTerrainMeshHeight(terrainMesh, p.x + rRim, p.z),
        sampleTerrainMeshHeight(terrainMesh, p.x - rRim, p.z),
        sampleTerrainMeshHeight(terrainMesh, p.x, p.z + rRim),
        sampleTerrainMeshHeight(terrainMesh, p.x, p.z - rRim),
      );
      _vec3.set(p.x, y - 0.12, p.z);
      _quat.setFromEuler(_euler.set(0, idx * 1.1, 0));
      _scale.setScalar(p.scale);
      _mat4.compose(_vec3, _quat, _scale);
      mPalmTrunks.setMatrixAt(idx, _mat4);
      mPalmCrowns.setMatrixAt(idx, _mat4);
      mPalmNuts.setMatrixAt(idx, _mat4);
      _color.setHex(idx % 2 === 0 ? 0xdbe6cc : 0xcde0bc);
      mPalmCrowns.setColorAt(idx, _color);
    });

    [mPalmTrunks, mPalmCrowns, mPalmNuts].forEach((m) => {
      m.castShadow = true;
      m.receiveShadow = true;
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      m.computeBoundingSphere();
      group.add(m);
    });
  }

  // Real Subdivided Displaced Granite Field Boulders across the 200m valley
  const rockSpots = getWorldBoulderSpots();

  const rockGeo = new THREE.IcosahedronGeometry(0.75, 3);
  if (rockGeo.attributes.uv) {
    rockGeo.setAttribute('uv1', rockGeo.attributes.uv.clone());
  }
  const rPos = rockGeo.attributes.position;
  for (let i = 0; i < rPos.count; i++) {
    const vx = rPos.getX(i);
    const vy = rPos.getY(i);
    const vz = rPos.getZ(i);
    const crag =
      0.78 +
      0.24 * Math.sin(vx * 3.4 + vz * 2.1) * Math.cos(vy * 3.9 - vx * 1.4) +
      0.08 * Math.sin(vx * 7.8 + vy * 6.5 - vz * 5.2);
    rPos.setXYZ(i, vx * crag, vy * crag, vz * crag);
  }
  rockGeo.computeVertexNormals();

  const rockMat = new THREE.MeshStandardMaterial({
    map: textures.rockMap ?? textures.meadowMap,
    normalMap: textures.rockNormal,
    normalScale: new THREE.Vector2(1.05, 1.05),
    roughnessMap: textures.rockRough ?? textures.meadowRough,
    aoMap: textures.rockAo,
    aoMapIntensity: 0.82,
    color: 0xd6d4ce,
    roughness: 0.92,
  });
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, rockSpots.length);
  rocks.castShadow = true;
  rocks.receiveShadow = true;

  rockSpots.forEach((rp, i) => {
    const meshY = sampleTerrainMeshHeight(terrainMesh, rp.x, rp.z);
    const minRimY = Math.min(
      sampleTerrainMeshHeight(terrainMesh, rp.x + 0.55, rp.z),
      sampleTerrainMeshHeight(terrainMesh, rp.x - 0.55, rp.z),
      sampleTerrainMeshHeight(terrainMesh, rp.x, rp.z + 0.55),
      sampleTerrainMeshHeight(terrainMesh, rp.x, rp.z - 0.55),
    );
    const ry = Math.min(meshY, minRimY) - 0.14;
    _vec3.set(rp.x, ry, rp.z);
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

  return {
    group,
    update: (elapsed: number, bumpPos?: THREE.Vector3, bumpStrength = 0) => {
      uTreeTime.value = elapsed;
      if (bumpPos) uBumpPos.value.copy(bumpPos);
      uBumpStrength.value = bumpStrength;
    },
  };
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
  lakeSurface.userData.nonCollidable = true;
  group.add(lakeSurface);

  // 2. Stepped North Rock Cliff & Cascading Waterfall feeding the 26m Glacial Lake
  const cliffMat = new THREE.MeshStandardMaterial({
    map: textures.rockMap ?? textures.meadowMap,
    normalMap: textures.rockNormal,
    normalScale: new THREE.Vector2(1.0, 1.0),
    roughnessMap: textures.rockRough ?? textures.meadowRough,
    aoMap: textures.rockAo,
    aoMapIntensity: 0.8,
    color: 0x989ea5,
    roughness: 0.92,
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
  fallRibbon1.userData.nonCollidable = true;
  const fallRibbon2 = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 13.2, 4, 8), cascadeMat);
  fallRibbon2.position.set(1.5, 5.2, -20.7);
  fallRibbon2.rotation.x = -0.16;
  fallRibbon2.userData.nonCollidable = true;
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
  splashRing.userData.nonCollidable = true;
  group.add(fallRibbon1, fallRibbon2, splashRing);

  // 3. Tal Barahi Island Mini-Pagoda at center-west of lake (bedrock extends down to lakebed)
  const islet = new THREE.Group();
  islet.position.set(-1.5, GLACIAL_LAKE.waterLevel, -1.2);
  islet.scale.setScalar(2.35);
  const islandStone = new THREE.Mesh(
    new THREE.CylinderGeometry(1.55, 2.35, 1.85, 12),
    cliffMat,
  );
  islandStone.position.y = -0.555;
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

  // Wooden mooring dock jetty at south-east shore with submerged timber pilings anchored into lakebed
  const jettyGroup = new THREE.Group();
  jettyGroup.position.set(14.0, GLACIAL_LAKE.waterLevel + 0.3, 15.2);
  jettyGroup.rotation.y = -0.68;
  const jetty = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.22, 4.4), oarMat);
  jetty.castShadow = true;
  jetty.receiveShadow = true;
  jettyGroup.add(jetty);
  for (const px of [-0.95, 0.95]) {
    for (const pz of [-1.75, 1.75]) {
      const piling = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 2.35, 8), oarMat);
      piling.position.set(px, -1.05, pz);
      piling.castShadow = true;
      jettyGroup.add(piling);
    }
  }
  group.add(jettyGroup);

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

export interface LumbiniPeaceParklandResult extends AnimatedWaterController {
  beaconLights: THREE.PointLight[];
}

/**
 * Kenzo Tange Master Plan Western Sacred Peace Parkland (west of Lumbini Maya Devi Gate):
 * - 12m x 128m Lumbini Central Reflection Peace Canal with stepped terracotta/sandstone ghats & red-brick promenades
 * - Arched Maitri Peace Bridge connecting Maya Devi West Gate directly to the Western White Peace Stupa Overlook
 * - White Shanti Peace Stupa Overlook plaza with golden Gajur spire, warm butter-lamp lights, stone benches,
 *   and waving 5-color Buddhist Lungta prayer flags
 */
export function createLumbiniPeaceParkland(
  textures: ProceduralTextureSet,
): LumbiniPeaceParklandResult {
  const group = new THREE.Group();
  const beaconLights: THREE.PointLight[] = [];

  const canalSpanZ = LUMBINI_PEACE_CANAL.maxZ - LUMBINI_PEACE_CANAL.minZ;
  const canalMidZ = (LUMBINI_PEACE_CANAL.minZ + LUMBINI_PEACE_CANAL.maxZ) * 0.5;
  const canalWidthX = LUMBINI_PEACE_CANAL.maxX - LUMBINI_PEACE_CANAL.minX;

  const brickPaverMat = new THREE.MeshStandardMaterial({
    map: textures.brickMap,
    normalMap: textures.brickNormal,
    normalScale: new THREE.Vector2(0.75, 0.75),
    color: 0xc96f52,
    roughness: 0.86,
    metalness: 0.02,
  });
  const chunarStoneMat = new THREE.MeshStandardMaterial({
    map: textures.sandstoneMap,
    normalMap: textures.sandstoneNormal,
    normalScale: new THREE.Vector2(0.68, 0.68),
    roughnessMap: textures.sandstoneRough,
    aoMap: textures.sandstoneAo,
    aoMapIntensity: 0.82,
    color: 0xe6dccb,
    roughness: 0.9,
    metalness: 0.02,
  });
  const bronzeMat = new THREE.MeshStandardMaterial({
    map: textures.agedBronzeMap,
    normalMap: textures.agedBronzeNormal,
    color: 0x8f6632,
    roughness: 0.36,
    metalness: 0.84,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf0bd45,
    roughness: 0.22,
    metalness: 0.9,
    emissive: 0x5c3e08,
    emissiveIntensity: 0.22,
  });
  const lanternGlowMat = new THREE.MeshStandardMaterial({
    color: 0xffdf9e,
    emissive: 0xffaa38,
    emissiveIntensity: 1.35,
    roughness: 0.24,
  });

  // 1. Reflective Peace Canal Water Plane
  const canalGeo = new THREE.PlaneGeometry(canalWidthX + 0.4, canalSpanZ + 0.4, 20, 64);
  canalGeo.rotateX(-Math.PI / 2);
  const uTime = { value: 0 };
  const canalWaterMat = new THREE.MeshStandardMaterial({
    color: 0x205a5c,
    normalMap: textures.waterNormal,
    normalScale: new THREE.Vector2(0.32, 0.32),
    roughness: 0.06,
    metalness: 0.5,
    transparent: true,
    opacity: 0.9,
  });
  applyRealisticWaterShader(canalWaterMat, uTime, {
    mode: 'river',
    maxRadius: canalWidthX * 0.52,
    flowSpeed: 0.48,
    deepTint: 0x0f3b40,
    shallowTint: 0x266260,
  });
  const canalWater = new THREE.Mesh(canalGeo, canalWaterMat);
  canalWater.position.set(LUMBINI_PEACE_CANAL.centerX, LUMBINI_PEACE_CANAL.waterLevel, canalMidZ);
  canalWater.receiveShadow = true;
  canalWater.userData.nonCollidable = true;
  group.add(canalWater);

  // Dark pebble bed floor beneath the canal so water has clean depth
  const canalBed = new THREE.Mesh(
    new THREE.BoxGeometry(canalWidthX + 1.2, 0.25, canalSpanZ + 1.2),
    new THREE.MeshStandardMaterial({ color: 0x2e3533, roughness: 0.95 }),
  );
  canalBed.position.set(LUMBINI_PEACE_CANAL.centerX, -1.18, canalMidZ);
  canalBed.receiveShadow = true;
  group.add(canalBed);

  // 2. Stepped Canal Coping Walls & Twin Brick Promenades (split cleanly at the Maitri Bridge opening)
  const stepWallMat = brickPaverMat;
  const bZ = LUMBINI_PEACE_CANAL.bridgeCenterZ;
  const canalWallMinZ = LUMBINI_PEACE_CANAL.minZ - 0.6;
  const canalWallMaxZ = LUMBINI_PEACE_CANAL.maxZ + 0.6;
  const bridgeOpeningHalfZ = 2.78;
  const bankRuns: Array<[number, number]> = [
    [canalWallMinZ, bZ - bridgeOpeningHalfZ],
    [bZ + bridgeOpeningHalfZ, canalWallMaxZ],
  ];
  for (const side of [-1, 1]) {
    const bankX = LUMBINI_PEACE_CANAL.centerX + side * (canalWidthX * 0.5 + 0.25);
    for (const [rz0, rz1] of bankRuns) {
      const rLen = rz1 - rz0;
      const rMid = (rz0 + rz1) * 0.5;
      const lowerStep = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.85, rLen), stepWallMat);
      lowerStep.position.set(bankX - side * 0.15, -0.62, rMid);
      lowerStep.receiveShadow = true;

      const copingWall = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.72, rLen), chunarStoneMat);
      copingWall.position.set(bankX + side * 0.15, 0.04, rMid);
      copingWall.castShadow = true;
      copingWall.receiveShadow = true;

      group.add(lowerStep, copingWall);
    }
  }
  for (const endZ of [LUMBINI_PEACE_CANAL.minZ - 0.25, LUMBINI_PEACE_CANAL.maxZ + 0.25]) {
    const endWall = new THREE.Mesh(new THREE.BoxGeometry(canalWidthX + 1.5, 1.35, 0.9), chunarStoneMat);
    endWall.position.set(LUMBINI_PEACE_CANAL.centerX, -0.22, endZ);
    endWall.castShadow = true;
    endWall.receiveShadow = true;
    group.add(endWall);
  }

  // Axial brick approach walk linking West Sacred Bridge across Maitri Peace Bridge cleanly to West Perimeter Gate
  for (const [segX, segW] of [
    [-335.2, 9.6],
    [-362.0, 12.0],
  ] as Array<[number, number]>) {
    const axisWalk = new THREE.Mesh(new THREE.BoxGeometry(segW, 0.24, 5.2), brickPaverMat);
    axisWalk.position.set(segX, 0.23, bZ);
    axisWalk.receiveShadow = true;
    group.add(axisWalk);
    for (const sz of [-2.68, 2.68]) {
      const curb = new THREE.Mesh(new THREE.BoxGeometry(segW, 0.28, 0.24), chunarStoneMat);
      curb.position.set(segX, 0.24, bZ + sz);
      curb.receiveShadow = true;
      group.add(curb);
    }
  }

  // 3. Arched Maitri Peace Bridge (spanning x = -280.2 .. -263.8 at z = 100.0)
  const bridgeGroup = new THREE.Group();
  const bMin = LUMBINI_PEACE_CANAL.bridgeMinX;
  const bMax = LUMBINI_PEACE_CANAL.bridgeMaxX;
  const bLen = bMax - bMin;
  const segCount = 20;
  const segLen = bLen / segCount;

  const maitriBalusterPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.088, 0.0),
    new THREE.Vector2(0.072, 0.09),
    new THREE.Vector2(0.045, 0.20),
    new THREE.Vector2(0.074, 0.36),
    new THREE.Vector2(0.044, 0.56),
    new THREE.Vector2(0.078, 0.70),
    new THREE.Vector2(0.090, 0.78),
  ];
  const maitriBalusterGeo = new THREE.LatheGeometry(maitriBalusterPts, 12);
  const maitriFinialGeo = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.082, 0.0),
      new THREE.Vector2(0.094, 0.045),
      new THREE.Vector2(0.052, 0.085),
      new THREE.Vector2(0.075, 0.135),
      new THREE.Vector2(0.025, 0.195),
      new THREE.Vector2(0.0, 0.235),
    ],
    14,
  );

  for (let i = 0; i < segCount; i++) {
    const t = (i + 0.5) / segCount;
    const x = THREE.MathUtils.lerp(bMin, bMax, t);
    const y = 0.36 + Math.sin(t * Math.PI) * 0.62;
    const slope = ((Math.cos(t * Math.PI) * Math.PI) / bLen) * 0.62;
    const pitch = Math.atan(slope);

    const slab = new THREE.Mesh(new THREE.BoxGeometry(segLen + 0.12, 0.26, 4.95), brickPaverMat);
    slab.position.set(x, y - 0.13, bZ);
    slab.rotation.z = pitch;
    slab.castShadow = true;
    slab.receiveShadow = true;
    bridgeGroup.add(slab);

    const archFascia = new THREE.Mesh(new THREE.BoxGeometry(segLen + 0.14, 0.38, 5.42), chunarStoneMat);
    archFascia.position.set(x, y - 0.28, bZ);
    archFascia.rotation.z = pitch;
    archFascia.castShadow = true;
    const lowerArchTrim = new THREE.Mesh(new THREE.BoxGeometry(segLen + 0.14, 0.08, 5.48), chunarStoneMat);
    lowerArchTrim.position.set(x, y - 0.45, bZ);
    lowerArchTrim.rotation.z = pitch;
    bridgeGroup.add(archFascia, lowerArchTrim);

    // Carved Chunar sandstone spandrel arch voussoir ribs, balustrade base curb & turned balusters
    for (const side of [-1, 1]) {
      const bzSide = bZ + side * 2.42;
      const baseCurb = new THREE.Mesh(new THREE.BoxGeometry(segLen + 0.10, 0.10, 0.28), chunarStoneMat);
      baseCurb.position.set(x, y + 0.045, bzSide);
      baseCurb.rotation.z = pitch;
      baseCurb.receiveShadow = true;
      bridgeGroup.add(baseCurb);

      const archUnderY = y - 0.50 - (1 - Math.sin(t * Math.PI)) * 0.44;
      const isKeystone = i === Math.floor(segCount / 2) - 1 || i === Math.floor(segCount / 2);
      const voussoir = new THREE.Mesh(
        new THREE.BoxGeometry(segLen * 0.90, isKeystone ? 0.30 : 0.24, isKeystone ? 0.46 : 0.38),
        isKeystone ? brickPaverMat : chunarStoneMat,
      );
      voussoir.position.set(x, archUnderY, bzSide);
      voussoir.rotation.z = pitch * 1.4;
      voussoir.castShadow = true;
      bridgeGroup.add(voussoir);

      if (i % 5 === 0 || i === segCount - 1) {
        const isEnd = i === 0 || i === segCount - 1;
        const postH = isEnd ? 1.00 : 0.90;
        const postPlinth = new THREE.Mesh(
          new THREE.BoxGeometry(isEnd ? 0.42 : 0.30, 0.12, isEnd ? 0.42 : 0.30),
          chunarStoneMat,
        );
        postPlinth.position.set(x, y + 0.06, bzSide);
        const post = new THREE.Mesh(
          new THREE.BoxGeometry(isEnd ? 0.34 : 0.24, postH, isEnd ? 0.34 : 0.24),
          chunarStoneMat,
        );
        post.position.set(x, y + postH * 0.5, bzSide);
        post.castShadow = true;
        const cap = new THREE.Mesh(
          new THREE.BoxGeometry(isEnd ? 0.42 : 0.30, 0.08, isEnd ? 0.42 : 0.30),
          chunarStoneMat,
        );
        cap.position.set(x, y + postH + 0.02, bzSide);
        const finial = new THREE.Mesh(maitriFinialGeo, goldMat);
        finial.scale.setScalar(isEnd ? 1.05 : 0.78);
        finial.position.set(x, y + postH + 0.06, bzSide);
        bridgeGroup.add(postPlinth, post, cap, finial);
        if (isEnd) {
          const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 0.38), bronzeMat);
          plaque.position.set(x, y + 0.54, bzSide);
          bridgeGroup.add(plaque);
        }
      } else {
        const baluster = new THREE.Mesh(maitriBalusterGeo, chunarStoneMat);
        baluster.position.set(x, y + 0.07, bzSide);
        baluster.castShadow = true;
        bridgeGroup.add(baluster);
      }
      if (i < segCount - 1) {
        const tMid = (i + 1) / segCount;
        const xMid = THREE.MathUtils.lerp(bMin, bMax, tMid);
        const yMid = 0.36 + Math.sin(tMid * Math.PI) * 0.62;
        const pitchMid = Math.atan(((Math.cos(tMid * Math.PI) * Math.PI) / bLen) * 0.62);
        const rail = new THREE.Mesh(new THREE.BoxGeometry(segLen + 0.08, 0.12, 0.24), chunarStoneMat);
        rail.position.set(xMid, yMid + 0.85, bzSide);
        rail.rotation.z = pitchMid;
        rail.castShadow = true;
        bridgeGroup.add(rail);
      }
    }
  }
  // Twin submerged canal bridge footings supporting arch spans cleanly beneath water level (-0.26m)
  for (const pierX of [LUMBINI_PEACE_CANAL.centerX - 4.0, LUMBINI_PEACE_CANAL.centerX + 4.0]) {
    const canalPier = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.72, 5.2), brickPaverMat);
    canalPier.position.set(pierX, -0.78, bZ);
    canalPier.receiveShadow = true;
    bridgeGroup.add(canalPier);
  }
  // Flush bridge stone abutments (top 0.34m < 0.35m walk) & 4 Maitri Peace Lanterns on offset piers clear of handrails
  for (const bxEnd of [bMin + 0.45, bMax - 0.45]) {
    const abutment = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.32, 5.5), chunarStoneMat);
    abutment.position.set(bxEnd, -0.32, bZ);
    abutment.castShadow = true;
    abutment.receiveShadow = true;
    bridgeGroup.add(abutment);

    for (const side of [-1, 1]) {
      const lanternZ = bZ + side * 3.18; // 0.76m outside handrail at bZ ± 2.42
      const pierBase = new THREE.Mesh(new THREE.BoxGeometry(1.16, 1.24, 1.16), chunarStoneMat);
      pierBase.position.set(bxEnd, -0.26, lanternZ);
      pierBase.castShadow = true;
      pierBase.receiveShadow = true;
      const pierCap = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.12, 1.24), chunarStoneMat);
      pierCap.position.set(bxEnd, 0.33, lanternZ);
      bridgeGroup.add(pierBase, pierCap);

      const lantern = buildPeaceLantern(chunarStoneMat, bronzeMat, lanternGlowMat);
      lantern.position.set(bxEnd, 0.39, lanternZ);
      bridgeGroup.add(lantern);
      const pLight = new THREE.PointLight(0xffb85c, 1.35, 19, 1.65);
      pLight.position.set(0, 1.65, 0);
      pLight.userData.intensityScale = 1.05;
      pLight.userData.flickerAmp = 0.08;
      pLight.userData.flickerPhase = bxEnd * 0.2 + side;
      pLight.userData.warmFlicker = true;
      lantern.add(pLight);
      beaconLights.push(pLight);
    }
  }
  group.add(bridgeGroup);
  mergeStaticMeshesByMaterial(group, { preserveCustomShaderMaterials: true });

  return {
    group,
    beaconLights,
    update: (elapsed: number) => {
      uTime.value = elapsed;
    },
  };
}



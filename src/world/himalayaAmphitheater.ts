import * as THREE from 'three';
import { ProceduralTextureSet } from './proceduralTextures';
import { WORLD_HAZE_UNIFORMS } from './mountainAndTerrain';

export const HIMALAYA_TERRAIN_UNIFORMS = {
  uAlpenglowColor: { value: new THREE.Color('#ff8450') },
  uAlpenglowStrength: { value: 0.0 },
  uMoonGlint: { value: 0.0 },
  uSnowFrost: { value: 0.0 },
  uWindTime: { value: 0.0 },
};

/**
 * Custom GPU Tri-Planar Slope & Altitude Terrain Shader for the Nepal Himalayas:
 * - Valley Floor (0m–25m): lush Himalayan meadow grass, moss, footpaths
 * - Sub-Alpine Forest Zone (25m–85m): pine-needle forest humus + stepped Khet/Bari terraces
 * - Vertical Cliff Faces (slope > 42 deg, worldNormal.y < 0.743): exposed dark-grey & warm-ochre
 *   stratified Himalayan granite with horizontal sedimentary bands + vertical fractures, zero snow sticking
 * - Alpine & Snow Zone (> 85m on gentle/moderate slopes): wind-carved snowfields, blue-ice glacial
 *   subsurface scattering in shaded crevices, crisp specular highlights, Dawn/Dusk alpenglow,
 *   Night moonlight glint, and Snow-weather frost.
 */
export function applyHimalayanTerrainShader(
  mat: THREE.MeshStandardMaterial,
  textures: ProceduralTextureSet,
  opts: { isAmphitheater?: boolean } = {},
): void {
  const isAmphitheater = Boolean(opts.isAmphitheater);
  mat.customProgramCacheKey = () =>
    isAmphitheater ? 'himalaya-triplanar-amphitheater-v1' : 'himalaya-triplanar-peak-v1';

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uHazeColor = WORLD_HAZE_UNIFORMS.uHazeColor;
    shader.uniforms.uSunDir = WORLD_HAZE_UNIFORMS.uSunDir;
    shader.uniforms.uSunColor = WORLD_HAZE_UNIFORMS.uSunColor;
    shader.uniforms.uHazeDensity = WORLD_HAZE_UNIFORMS.uHazeDensity;
    shader.uniforms.uHeightFalloff = WORLD_HAZE_UNIFORMS.uHeightFalloff;
    shader.uniforms.uMaxHaze = WORLD_HAZE_UNIFORMS.uMaxHaze;

    shader.uniforms.uAlpenglowColor = HIMALAYA_TERRAIN_UNIFORMS.uAlpenglowColor;
    shader.uniforms.uAlpenglowStrength = HIMALAYA_TERRAIN_UNIFORMS.uAlpenglowStrength;
    shader.uniforms.uMoonGlint = HIMALAYA_TERRAIN_UNIFORMS.uMoonGlint;
    shader.uniforms.uSnowFrost = HIMALAYA_TERRAIN_UNIFORMS.uSnowFrost;
    shader.uniforms.uWindTime = HIMALAYA_TERRAIN_UNIFORMS.uWindTime;

    shader.uniforms.uGrassMap = { value: textures.meadowMap };
    shader.uniforms.uPebbleMap = { value: textures.pebbleMap ?? textures.meadowMap };
    shader.uniforms.uRockMap = { value: textures.rockMap ?? textures.meadowMap };
    shader.uniforms.uRockNormal = { value: textures.rockNormal };
    shader.uniforms.uRockRough = { value: textures.rockRough ?? textures.meadowRough };
    shader.uniforms.uRockAo = { value: textures.rockAo };
    shader.uniforms.uIsAmphitheater = { value: isAmphitheater ? 1.0 : 0.0 };

    shader.vertexShader = `
      attribute float aSnowMask;
      varying vec3 vHimWorldPos;
      varying vec3 vHimWorldNormal;
      varying float vHimSnowAttr;
      ${shader.vertexShader}
    `.replace(
      '#include <project_vertex>',
      `vHimSnowAttr = aSnowMask;
       vec4 himWp = modelMatrix * vec4(transformed, 1.0);
       vHimWorldPos = himWp.xyz;
       vHimWorldNormal = normalize(mat3(modelMatrix) * objectNormal);
       #include <project_vertex>`,
    );

    shader.fragmentShader = `
      uniform vec3 uHazeColor;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      uniform float uHazeDensity;
      uniform float uHeightFalloff;
      uniform float uMaxHaze;

      uniform vec3 uAlpenglowColor;
      uniform float uAlpenglowStrength;
      uniform float uMoonGlint;
      uniform float uSnowFrost;
      uniform float uWindTime;
      uniform float uIsAmphitheater;

      uniform sampler2D uGrassMap;
      uniform sampler2D uPebbleMap;
      uniform sampler2D uRockMap;
      uniform sampler2D uRockNormal;
      uniform sampler2D uRockRough;
      uniform sampler2D uRockAo;

      varying vec3 vHimWorldPos;
      varying vec3 vHimWorldNormal;
      varying float vHimSnowAttr;

      float himHash21(vec2 p) {
        p = fract(p * vec2(127.1, 311.7));
        p += dot(p, p + 41.23);
        return fract(p.x * p.y);
      }

      float himNoise2(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(himHash21(i), himHash21(i + vec2(1.0, 0.0)), u.x),
          mix(himHash21(i + vec2(0.0, 1.0)), himHash21(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      float himFbm2(vec2 p) {
        float v = himNoise2(p) * 0.58;
        v += himNoise2(p * 2.17 + vec2(5.2, 8.7)) * 0.28;
        v += himNoise2(p * 4.41 + vec2(1.9, 3.3)) * 0.14;
        return v;
      }

      vec4 sampleTriplanar(sampler2D tex, vec3 wp, vec3 wNormPow, float scale) {
        vec4 cx = texture2D(tex, wp.zy * scale);
        vec4 cy = texture2D(tex, wp.xz * scale);
        vec4 cz = texture2D(tex, wp.xy * scale);
        return cx * wNormPow.x + cy * wNormPow.y + cz * wNormPow.z;
      }
      ${shader.fragmentShader}
    `
      .replace(
        '#include <map_fragment>',
        `float himBlendRough = 0.88;
         vec3 himBlendMapN = vec3(0.0, 0.0, 1.0);
         float himBlendAo = 1.0;
         vec3 himAlpenglowAdd = vec3(0.0);
         vec3 himSnowGlint = vec3(0.0);
         {
           vec3 wp = vHimWorldPos;
           vec3 wN = normalize(vHimWorldNormal);
           vec3 wPow = pow(abs(wN), vec3(4.0));
           wPow /= max(wPow.x + wPow.y + wPow.z, 0.0001);

           float h = wp.y;
           float slopeY = clamp(wN.y, 0.0, 1.0);
           // 42 deg slope threshold: cos(42 deg) = 0.7431
           float isCliff = 1.0 - smoothstep(0.60, 0.76, slopeY);
           float macroNoise = himFbm2(wp.xz * 0.022);
           float microNoise = himFbm2(wp.xz * 0.19 + vec2(11.3, 4.7));

           // Tri-planar textures
           float rockScale = uIsAmphitheater > 0.5 ? 0.014 : 0.048;
           vec3 grassAlb = sampleTriplanar(uGrassMap, wp, wPow, 0.085).rgb;
           vec3 pebAlb = sampleTriplanar(uPebbleMap, wp, wPow, 0.075).rgb;
           vec3 rockAlb = sampleTriplanar(uRockMap, wp, wPow, rockScale).rgb;
           vec3 rockN = normalize(sampleTriplanar(uRockNormal, wp, wPow, rockScale).xyz * 2.0 - 1.0);
           float rockR = sampleTriplanar(uRockRough, wp, wPow, rockScale).g;
           float rockA = sampleTriplanar(uRockAo, wp, wPow, rockScale).r;

           // 1. Valley Meadow (0-25m)
           float valleyW = 1.0 - smoothstep(18.0, 32.0, h);
           vec3 meadowCol = grassAlb * mix(vec3(0.76, 0.88, 0.62), vec3(0.92, 0.96, 0.72), macroNoise);

           // 2. Sub-Alpine Forest Zone (25-85m): pine humus, rhododendron moss & Nepali Khet/Bari terraces
           float forestW = smoothstep(18.0, 32.0, h) * (1.0 - smoothstep(74.0, 94.0, h));
           float terraceStep = smoothstep(0.35, 0.65, fract(h * 0.42 + macroNoise * 0.35));
           vec3 forestCol = mix(grassAlb * vec3(0.34, 0.44, 0.28), pebAlb * vec3(0.45, 0.39, 0.30), 0.38 + terraceStep * 0.22);
           // Stepped agricultural Khet terraces glow warm chartreuse-olive in amphitheater foothills
           if (uIsAmphitheater > 0.5 && h < 72.0) {
             float terraceBand = smoothstep(0.74, 0.96, sin(h * 2.15 + macroNoise * 3.0) * 0.5 + 0.5);
             forestCol = mix(forestCol, grassAlb * vec3(0.58, 0.66, 0.34), terraceBand * 0.48 * (1.0 - isCliff));
           }

           // 3. Stratified Himalayan Granite Cliffs (dark gneiss + warm ochre Yellow Band strata + vertical fractures)
           float strataWave = sin(h * 0.46 + wp.x * 0.025 + macroNoise * 3.8) * 0.5 + 0.5;
           float fracture = smoothstep(0.62, 0.92, sin(wp.x * 0.52 + wp.z * 0.48 + microNoise * 4.2) * 0.5 + 0.5);
           vec3 darkGranite = rockAlb * vec3(0.30, 0.32, 0.36);
           vec3 ochreBand = rockAlb * vec3(0.64, 0.50, 0.36);
           vec3 cliffCol = mix(darkGranite, ochreBand, smoothstep(0.35, 0.78, strataWave) * 0.55);
           cliffCol *= mix(0.68, 1.06, 1.0 - fracture * 0.42);
           cliffCol *= mix(0.75, 1.10, rockA);

           // Alpine talus rock transition (75m-98m)
           float alpineRockW = smoothstep(74.0, 96.0, h);
           vec3 baseGround = meadowCol * valleyW + forestCol * forestW + cliffCol * 0.85 * alpineRockW;
           float groundNorm = max(valleyW + forestW + alpineRockW, 0.001);
           baseGround /= groundNorm;

           // Blend steep walls cleanly onto stratified granite
           vec3 rockBlended = mix(baseGround, cliffCol, clamp(isCliff + alpineRockW * 0.45, 0.0, 1.0));

           // 4. Alpine & Snow Zone (> 85m on slopes <= 42 deg; zero snow on sheer vertical walls!)
           float altSnowThresh = uIsAmphitheater > 0.5 ? 88.0 : 85.0;
           float altSnow = smoothstep(altSnowThresh - 6.0, altSnowThresh + 18.0, h + (macroNoise - 0.5) * 14.0);
           float slopeRetention = smoothstep(0.71, 0.84, slopeY); // Strictly zero above 42 deg!
           float couloirSnow = smoothstep(0.45, 0.85, macroNoise) * smoothstep(0.54, 0.72, slopeY) * 0.38;
           float frostLift = uSnowFrost * smoothstep(0.55, 0.82, slopeY) * smoothstep(14.0, 48.0, h) * 0.65;
           float snowMask = clamp(max(altSnow * slopeRetention, max(vHimSnowAttr * slopeRetention, couloirSnow * altSnow)) + frostLift, 0.0, 1.0);
           snowMask *= smoothstep(0.64, 0.75, slopeY);

           // Wind-sculpted snowfield + subtle blue-ice glacial subsurface tint in crevices
           float sastrugi = sin(wp.x * 0.34 - wp.z * 0.28 + microNoise * 2.6) * 0.5 + 0.5;
           float blueIceMask = smoothstep(0.18, 0.78, 1.0 - rockA) * smoothstep(105.0, 165.0, h) * 0.58;
           vec3 crispSnow = mix(vec3(0.84, 0.90, 0.97), vec3(0.96, 0.98, 1.00), sastrugi * 0.65 + 0.35);
           vec3 glacialIce = vec3(0.54, 0.76, 0.94);
           vec3 snowCol = mix(crispSnow, glacialIce, blueIceMask * 0.48);

           // Sunlit Himalayan Alpenglow (Dawn / Dusk warm rose-amber glow on high sunlit ridges)
           vec3 sunD = normalize(uSunDir);
           float sunFacing = clamp(dot(wN, sunD) * 0.82 + 0.18, 0.0, 1.0);
           float highPeakMask = smoothstep(72.0, 155.0, h);
           himAlpenglowAdd = uAlpenglowColor * (uAlpenglowStrength * sunFacing * highPeakMask * (0.45 + 0.65 * snowMask));

           // Specular snow sparkle & moonlight silver glint
           vec3 viewD = normalize(cameraPosition - wp);
           vec3 halfV = normalize(sunD + viewD);
           float specGlint = pow(max(dot(wN, halfV), 0.0), 42.0) * snowMask;
           float microSparkle = step(0.88, himNoise2(wp.xz * 2.4 + vec2(uWindTime * 0.05))) * snowMask;
           himSnowGlint = uSunColor * (specGlint * 0.24 + microSparkle * 0.11) + vec3(0.76, 0.86, 1.0) * (uMoonGlint * specGlint * 0.36);

           vec3 finalAlb = mix(rockBlended, snowCol, snowMask);
           diffuseColor.rgb = finalAlb * mix(0.88, 1.08, vColor.g);

           himBlendRough = mix(mix(0.88, clamp(rockR * 1.08, 0.55, 0.98), isCliff), mix(0.38, 0.24, blueIceMask), snowMask);
           vec3 snowNorm = normalize(vec3((sastrugi - 0.5) * 0.16, (microNoise - 0.5) * 0.14, 1.0));
           himBlendMapN = normalize(mix(rockN, snowNorm, snowMask * 0.82));
           himBlendAo = mix(mix(0.88, rockA, isCliff), 0.96, snowMask * 0.7);
         }`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `float roughnessFactor = roughness * himBlendRough;`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#if defined( USE_NORMALMAP_TANGENTSPACE )
           vec3 mapN = himBlendMapN;
           mapN.xy *= normalScale;
           normal = normalize( tbn * mapN );
         #endif`,
      )
      .replace(
        '#include <aomap_fragment>',
        `#ifdef USE_AOMAP
           float ambientOcclusion = ( himBlendAo - 1.0 ) * aoMapIntensity + 1.0;
           reflectedLight.indirectDiffuse *= ambientOcclusion;
         #endif`,
      )
      .replace(
        '#include <dithering_fragment>',
        `gl_FragColor.rgb += himAlpenglowAdd + himSnowGlint;
         #include <dithering_fragment>`,
      )
      .replace(
        '#include <fog_fragment>',
        `#include <fog_fragment>
        {
          vec3 toFrag = vHimWorldPos - cameraPosition;
          float fragDist = length(toFrag);
          vec3 rayDir = toFrag / max(fragDist, 0.0001);
          float camH = max(cameraPosition.y, -2.0);
          float fragH = max(vHimWorldPos.y, -2.0);
          float avgH = mix(camH, fragH, 0.45);
          float heightAtten = exp(-max(0.0, avgH + 1.5) * uHeightFalloff);
          float distStart = uIsAmphitheater > 0.5 ? 240.0 : 32.0;
          float densityScale = uIsAmphitheater > 0.5 ? 0.55 : 0.88;
          float opticalDepth = max(0.0, fragDist - distStart) * uHazeDensity * densityScale * (0.28 + 0.72 * heightAtten);
          float hazeFactor = clamp(1.0 - exp(-opticalDepth), 0.0, uMaxHaze * 0.86);
          float sunScatter = pow(max(dot(rayDir, normalize(uSunDir)), 0.0), 5.0);
          vec3 aerialTint = mix(uHazeColor, mix(uHazeColor, uSunColor, 0.42), sunScatter * 0.65);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, aerialTint, hazeFactor);
        }`,
      );
  };
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function ridgedHarmonic(x: number, z: number): number {
  const n1 = 1 - Math.abs(Math.sin(x * 0.0085 + Math.cos(z * 0.0072) * 1.45));
  const n2 = 1 - Math.abs(Math.sin(x * 0.019 - z * 0.015 + 0.8));
  const n3 = 1 - Math.abs(Math.cos(x * 0.044 + z * 0.038 - 0.6));
  const n4 = Math.sin(x * 0.088 - z * 0.074) * 0.5 + 0.5;
  return Math.pow(n1, 1.45) * 0.48 + Math.pow(n2, 1.35) * 0.28 + n3 * 0.16 + n4 * 0.08;
}

interface IconicPeakSpec {
  x: number;
  z: number;
  rx: number;
  rz: number;
  height: number;
  ridgeCount: number;
  phase: number;
  twinSplit?: boolean;
  flutedGlacier?: boolean;
}

const GREAT_HIMALAYA_PEAKS: IconicPeakSpec[] = [
  // Machapuchare ("Fishtail" Twin Spire in WNW)
  { x: -560, z: -890, rx: 165, rz: 145, height: 325, ridgeCount: 4, phase: 0.3, twinSplit: true },
  // Annapurna South & Fang flanking West-NW
  { x: -840, z: -690, rx: 195, rz: 165, height: 292, ridgeCount: 5, phase: 1.1 },
  // Ama Dablam (Iconic fluted ridges & hanging glacier North-Northwest)
  { x: -245, z: -1020, rx: 168, rz: 152, height: 332, ridgeCount: 5, phase: 0.7, flutedGlacier: true },
  // Nuptse / Sagarmatha / Lhotse Great Wall behind the northern climbable peak
  { x: -30, z: -1095, rx: 215, rz: 175, height: 378, ridgeCount: 4, phase: 0.2 },
  { x: 210, z: -1075, rx: 205, rz: 170, height: 356, ridgeCount: 5, phase: 1.9, flutedGlacier: true },
  // Makalu / Kanchenjunga East-NE spires
  { x: 540, z: -925, rx: 190, rz: 165, height: 318, ridgeCount: 4, phase: 2.4 },
  { x: 855, z: -635, rx: 195, rz: 175, height: 286, ridgeCount: 5, phase: 0.9 },
  // Eastern & Western flanking snow massifs completing the 360 amphitheater
  { x: 1035, z: -180, rx: 185, rz: 195, height: 258, ridgeCount: 4, phase: 1.5 },
  { x: 965, z: 420, rx: 190, rz: 195, height: 244, ridgeCount: 5, phase: 2.1 },
  { x: 560, z: 915, rx: 205, rz: 185, height: 238, ridgeCount: 4, phase: 0.5 },
  { x: -55, z: 1065, rx: 225, rz: 180, height: 252, ridgeCount: 5, phase: 1.8 },
  { x: -640, z: 865, rx: 195, rz: 185, height: 242, ridgeCount: 4, phase: 2.7 },
  { x: -1010, z: 360, rx: 195, rz: 195, height: 256, ridgeCount: 5, phase: 0.4 },
  { x: -1045, z: -220, rx: 190, rz: 190, height: 274, ridgeCount: 4, phase: 1.4 },
];

function evalIconicPeak(x: number, z: number, p: IconicPeakSpec): number {
  const dx = (x - p.x) / p.rx;
  const dz = (z - p.z) / p.rz;
  const r = Math.hypot(dx, dz);
  if (r >= 1.15) return 0;

  const angle = Math.atan2(dz, dx);
  const arete = 0.22 * Math.pow(Math.max(0, Math.cos(angle * p.ridgeCount + p.phase)), 2.0);
  const crossArete = 0.11 * Math.pow(Math.max(0, Math.sin(angle * (p.ridgeCount + 2) - p.phase * 0.7)), 1.8);
  const core = Math.max(0, 1 - r * (0.94 - arete - crossArete));
  let h = Math.pow(core, 1.24) * p.height;

  // Machapuchare Fishtail twin-spire notch
  if (p.twinSplit && r < 0.45) {
    const notch = Math.exp(-Math.pow((x - p.x) / 22, 2)) * (1 - smoothstep(0.1, 0.45, r));
    const twinL = Math.exp(-Math.pow((x - (p.x - 24)) / 26, 2)) * 28;
    const twinR = Math.exp(-Math.pow((x - (p.x + 24)) / 26, 2)) * 24;
    h = h - notch * 38 + (twinL + twinR) * (1 - smoothstep(0.12, 0.5, r));
  }

  // Ama Dablam fluted snow ridges & cirque ribs
  if (p.flutedGlacier && r < 0.78) {
    const flutes = Math.abs(Math.sin(angle * 16 + r * 5.0)) * 14 * (1 - smoothstep(0.15, 0.78, r));
    h += flutes;
  }

  // Wind-carved snow couloirs & glacial cirques
  const couloir = Math.sin(angle * 7.0 + r * 6.5) * 9.5 * smoothstep(0.18, 0.75, core);
  return Math.max(0, h + couloir);
}

/**
 * Builds the 360-degree Three-Tier Nepali Himalayan Mountain Amphitheater surrounding the valley
 * at 630m–1260m radius (completely clear of all temples, Pumdikot, Glacial Lake, and the climbable peak).
 */
export function createHimalayanAmphitheater(textures: ProceduralTextureSet): THREE.Mesh {
  const segR = 92;
  const segA = 384;
  const rInner = 565;
  const rOuter = 1275;

  const vertCount = (segR + 1) * (segA + 1);
  const positions = new Float32Array(vertCount * 3);
  const colors = new Float32Array(vertCount * 3);
  const uvs = new Float32Array(vertCount * 2);
  const terrainMix = new Float32Array(vertCount * 3);
  const snowMask = new Float32Array(vertCount);
  const indices: number[] = [];

  for (let ir = 0; ir <= segR; ir++) {
    const vr = ir / segR;
    // Non-linear radial distribution puts higher resolution on Tier 2/3 jagged spires
    const r = rInner + Math.pow(vr, 1.08) * (rOuter - rInner);

    for (let ia = 0; ia <= segA; ia++) {
      const va = ia / segA;
      const theta = va * Math.PI * 2;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;

      const idx = ir * (segA + 1) + ia;
      uvs[idx * 2] = va * 24;
      uvs[idx * 2 + 1] = vr * 8;

      const ridge = ridgedHarmonic(x, z);

      // Tier 1 (585m – 780m): Mahabharat terraced green foothills & deep river gorges
      const tier1Env = smoothstep(570, 635, r) * (1 - smoothstep(735, 835, r) * 0.35);
      const riverGorgeCut =
        Math.exp(-Math.pow((x - 16) / 48, 2)) * (z < -500 ? 0.55 : z > 500 ? 0.42 : 0);
      const tier1H =
        tier1Env * (24 + ridge * 46 + Math.sin(theta * 14) * 9) * (1 - riverGorgeCut);

      // Tier 2 (760m – 980m): Jagged dark-granite rocky massifs & scree saddles
      const tier2Env = smoothstep(730, 815, r) * (1 - smoothstep(945, 1060, r) * 0.25);
      const mass2Fold = Math.pow(1 - Math.abs(Math.sin(theta * 11 + ridge * 2.2)), 1.45);
      const tier2H = tier2Env * (62 + mass2Fold * 88 + ridge * 44);

      // Tier 3 (940m – 1265m): Towering Great Himalaya Snow Peaks
      const tier3Env = smoothstep(915, 1020, r) * (1 - smoothstep(1225, 1278, r));
      let iconicSum = 0;
      for (let pIdx = 0; pIdx < GREAT_HIMALAYA_PEAKS.length; pIdx++) {
        iconicSum = Math.max(iconicSum, evalIconicPeak(x, z, GREAT_HIMALAYA_PEAKS[pIdx]));
      }
      const northBoost = z < -450 ? 1.0 : 0.76;
      const chainSpine =
        tier3Env * northBoost * (108 + Math.pow(1 - Math.abs(Math.sin(theta * 9 + 0.5)), 1.6) * 115 + ridge * 58);

      const outerFade = 1 - smoothstep(1235, 1276, r);
      const skirtDrop = r < 595 ? -4.5 * (1 - smoothstep(565, 595, r)) : -2.5;
      const finalY =
        skirtDrop +
        outerFade * Math.max(tier1H, tier2H, chainSpine, iconicSum * smoothstep(820, 960, r));

      positions[idx * 3] = x;
      positions[idx * 3 + 1] = finalY;
      positions[idx * 3 + 2] = z;

      const grassW = 1 - smoothstep(16, 48, finalY);
      const rockW = smoothstep(32, 78, finalY);
      const pebbleW = Math.max(0, 1 - grassW - rockW);
      const wSum = grassW + pebbleW + rockW || 1;
      terrainMix[idx * 3] = grassW / wSum;
      terrainMix[idx * 3 + 1] = pebbleW / wSum;
      terrainMix[idx * 3 + 2] = rockW / wSum;

      // Color modulation hint (neutralized so shader drives altitude + slope realism)
      const snowAttr = smoothstep(84, 138, finalY);
      snowMask[idx] = snowAttr;
      colors[idx * 3] = 0.94;
      colors[idx * 3 + 1] = 0.96;
      colors[idx * 3 + 2] = 0.98;
    }
  }

  for (let ir = 0; ir < segR; ir++) {
    for (let ia = 0; ia < segA; ia++) {
      const a = ir * (segA + 1) + ia;
      const b = (ir + 1) * (segA + 1) + ia;
      const c = (ir + 1) * (segA + 1) + (ia + 1);
      const d = ir * (segA + 1) + (ia + 1);
      indices.push(a, d, b, b, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setAttribute('uv1', new THREE.BufferAttribute(uvs.slice(), 2));
  geo.setAttribute('aTerrainMix', new THREE.BufferAttribute(terrainMix, 3));
  geo.setAttribute('aSnowMask', new THREE.BufferAttribute(snowMask, 1));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    map: textures.rockMap ?? textures.meadowMap,
    normalMap: textures.rockNormal,
    normalScale: new THREE.Vector2(1.1, 1.1),
    roughnessMap: textures.rockRough ?? textures.meadowRough,
    aoMap: textures.rockAo,
    aoMapIntensity: 0.78,
    vertexColors: true,
    roughness: 0.92,
    metalness: 0.03,
    side: THREE.FrontSide,
  });
  applyHimalayanTerrainShader(mat, textures, { isAmphitheater: true });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.userData.skipNavMesh = true;
  mesh.userData.nonCollidable = true;
  return mesh;
}

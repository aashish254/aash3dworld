import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';

export interface WaterShaderOptions {
  mode: 'river' | 'lake' | 'pond';
  maxRadius?: number;
  flowSpeed?: number;
  shallowTint?: THREE.ColorRepresentation;
  deepTint?: THREE.ColorRepresentation;
}

export const WATER_RIPPLE_COUNT = 12;

const rippleSlots: THREE.Vector4[] = Array.from(
  { length: WATER_RIPPLE_COUNT },
  () => new THREE.Vector4(0, 0, -999, 0),
);
let rippleCursor = 0;
let lastRippleTime = -10;

export const WATER_INTERACTION_UNIFORMS = {
  uWaterRipples: { value: rippleSlots },
};

export const REFLECTIVE_WATER_ENV_UNIFORMS = {
  uWaterTime: { value: 0 },
  uRainIntensity: { value: 0 },
  uSkyColor: { value: new THREE.Color('#9ec4de') },
  uSunDir: { value: new THREE.Vector3(0.45, 0.72, 0.35).normalize() },
  uSunColor: { value: new THREE.Color('#fff2dc') },
  uFogColor: { value: new THREE.Color('#c9dfef') },
  uFogDensity: { value: 0.0022 },
  uPlayerWaterPos: { value: new THREE.Vector3(0, -999, 0) },
  uPlayerWaterSpeed: { value: 0 },
  uPlayerPondProximity: { value: 0 },
};

let isRenderingPlanarReflection = false;
let nextSoftReflectorSlot = 0;
let lastSoftReflectorRenderMs = -1000;
const _camDeltaPos = new THREE.Vector3();

/**
 * Spawns an expanding concentric water ripple ring in world XZ coordinates
 * (shared automatically across river, glacial lake, and temple ponds).
 */
export function triggerWaterRipple(
  worldX: number,
  worldZ: number,
  elapsed: number,
  strength = 1.0,
): void {
  // Prevent flooding all slots within the same frame at the same point
  if (elapsed - lastRippleTime < 0.04) {
    const prev = rippleSlots[(rippleCursor + WATER_RIPPLE_COUNT - 1) % WATER_RIPPLE_COUNT];
    if (Math.hypot(prev.x - worldX, prev.y - worldZ) < 0.65) return;
  }
  rippleSlots[rippleCursor].set(worldX, worldZ, elapsed, THREE.MathUtils.clamp(strength, 0.25, 2.0));
  rippleCursor = (rippleCursor + 1) % WATER_RIPPLE_COUNT;
  lastRippleTime = elapsed;
}

export interface ReflectivePondOptions {
  textureSize?: number;
  isSoftwareGl?: boolean;
  deepTint?: THREE.ColorRepresentation;
  shallowTint?: THREE.ColorRepresentation;
  reflectivity?: number;
  rippleStrength?: number;
  anchorWorldPos?: THREE.Vector3;
  maxActiveDistance?: number;
}

/**
 * Creates a real-time planar reflective water surface using Three.js Reflector
 * blended with animated capillary ripples, interactive footstep/prop wave rings,
 * Schlick Fresnel reflection, deep sacred pond emerald tint, and atmospheric fog.
 */
export function createReflectivePondSurface(
  geometry: THREE.BufferGeometry,
  options: ReflectivePondOptions = {},
): Reflector {
  const isSoft = Boolean(options.isSoftwareGl);
  const texSize = options.textureSize ?? (isSoft ? 128 : 512);
  const softSlot = nextSoftReflectorSlot++;
  const deepColor = new THREE.Color(options.deepTint ?? 0x0b2d30);
  const shallowColor = new THREE.Color(options.shallowTint ?? 0x226863);
  const reflectivity = options.reflectivity ?? 0.86;
  const rippleStrength = options.rippleStrength ?? 0.022;
  const anchorPos = (options.anchorWorldPos ?? new THREE.Vector3(-280, 0, 96)).clone();
  const maxActiveDist = options.maxActiveDistance ?? 225;

  const customShader = {
    name: 'SacredPondReflectiveWaterShader',
    uniforms: {
      color: { value: new THREE.Color(0xc8dfdd) },
      tDiffuse: { value: null },
      textureMatrix: { value: new THREE.Matrix4() },
      uWaterTime: { value: 0 },
      uRainIntensity: { value: 0 },
      uSkyColor: { value: new THREE.Color('#9ec4de') },
      uSunDir: { value: new THREE.Vector3(0.45, 0.72, 0.35).normalize() },
      uSunColor: { value: new THREE.Color('#fff2dc') },
      uFogColor: { value: new THREE.Color('#c9dfef') },
      uFogDensity: { value: 0.0022 },
      uDeepColor: { value: deepColor },
      uShallowColor: { value: shallowColor },
      uReflectivity: { value: reflectivity },
      uRippleStrength: { value: rippleStrength },
      uWaterRipples: { value: rippleSlots },
      uPlayerWaterPos: { value: new THREE.Vector3(0, -999, 0) },
      uPlayerWaterSpeed: { value: 0 },
      uPlayerPondProximity: { value: 0 },
    },
    vertexShader: /* glsl */ `
      uniform mat4 textureMatrix;
      varying vec4 vProjUv;
      varying vec3 vWorldPos;
      varying vec2 vPondUv;

      #include <common>
      #include <logdepthbuf_pars_vertex>

      void main() {
        vPondUv = uv;
        vProjUv = textureMatrix * vec4(position, 1.0);
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;

        #include <logdepthbuf_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 color;
      uniform sampler2D tDiffuse;
      uniform float uWaterTime;
      uniform float uRainIntensity;
      uniform vec3 uSkyColor;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      uniform vec3 uFogColor;
      uniform float uFogDensity;
      uniform vec3 uDeepColor;
      uniform vec3 uShallowColor;
      uniform float uReflectivity;
      uniform float uRippleStrength;
      uniform vec4 uWaterRipples[${WATER_RIPPLE_COUNT}];
      uniform vec3 uPlayerWaterPos;
      uniform float uPlayerWaterSpeed;
      uniform float uPlayerPondProximity;

      varying vec4 vProjUv;
      varying vec3 vWorldPos;
      varying vec2 vPondUv;

      #include <logdepthbuf_pars_fragment>

      vec3 rainHash3(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
        p3 += dot(p3, p3.yxz + 33.33);
        return fract((p3.xxy + p3.yzz) * p3.zyx);
      }

      // Evaluates a localized expanding raindrop ring inside cell [0..1]^2 with zero boundary crossing
      vec3 evalRainRingLayer(vec2 worldXZ, float scale, float angle, float rate, vec2 seedOff) {
        float ca = cos(angle);
        float sa = sin(angle);
        mat2 rot = mat2(ca, -sa, sa, ca);
        vec2 p = (rot * worldXZ) * scale + seedOff;
        vec2 cell = floor(p);
        vec2 f = fract(p);

        float slot = floor(uWaterTime * rate);
        vec3 h = rainHash3(cell + seedOff + slot * 0.37);
        float cycle = fract(uWaterTime * rate + h.z);
        if (cycle < 0.01) return vec3(0.0);

        vec2 center = vec2(0.5) + (h.xy - 0.5) * 0.34;
        vec2 dVec = f - center;
        float dist = length(dVec);
        float radius = cycle * 0.27;
        float ringDelta = dist - radius;
        float fade = smoothstep(0.0, 0.07, cycle) * pow(max(0.0, 1.0 - cycle), 1.35);
        float env = exp(-ringDelta * ringDelta * 260.0) * fade;
        float ringWave = cos(ringDelta * 46.0) * env;
        float crest = smoothstep(0.28, 0.92, sin(ringDelta * 46.0)) * env;

        vec2 dirLocal = dVec / max(dist, 0.0005);
        vec2 gradWorld = mat2(ca, sa, -sa, ca) * (dirLocal * ringWave * 0.14);
        return vec3(gradWorld.x, gradWorld.y, crest);
      }

      void main() {
        #include <logdepthbuf_fragment>

        float t = uWaterTime * 0.78;
        vec2 wp = vWorldPos.xz;

        // Multi-angled organic capillary wave octaves (rotated angles avoid grid/horizontal striping)
        vec2 dir1 = vec2(0.84, 0.54);
        vec2 dir2 = vec2(-0.61, 0.79);
        vec2 dir3 = vec2(0.32, -0.95);
        vec2 dir4 = vec2(-0.92, -0.39);
        float p1 = dot(wp, dir1) * 1.95 - t * 1.05;
        float p2 = dot(wp, dir2) * 2.75 + t * 0.84;
        float p3 = dot(wp, dir3) * 4.10 - t * 1.28;
        float p4 = dot(wp, dir4) * 5.65 + t * 1.12;
        float w1 = sin(p1);
        float w2 = cos(p2);
        float w3 = sin(p3);
        float w4 = cos(p4);

        float rainAmt = clamp(uRainIntensity, 0.0, 1.0);
        float windGain = 1.0 + rainAmt * 0.55;
        vec2 grad = dir1 * cos(p1) * 0.0085
                  - dir2 * sin(p2) * 0.0065
                  + dir3 * cos(p3) * 0.0045
                  - dir4 * sin(p4) * 0.0032;
        float gx = grad.x * windGain;
        float gz = grad.y * windGain;

        // Procedural multi-scale raindrop ripple rings across pond surface when raining
        float interactiveFoam = 0.0;
        if (rainAmt > 0.005) {
          vec3 r1 = evalRainRingLayer(wp, 0.92, 0.00, 1.45, vec2(1.3, 4.7));
          vec3 r2 = evalRainRingLayer(wp, 1.42, 0.62, 1.85, vec2(11.7, 3.1));
          vec3 r3 = evalRainRingLayer(wp, 2.08, 1.24, 2.35, vec2(5.9, 17.3));
          vec3 rSum = (r1 + r2 * 0.9 + r3 * 0.78) * rainAmt;
          gx += rSum.x;
          gz += rSum.y;
          interactiveFoam += rSum.z * 0.42;
        }

        // World-space interactive concentric ripple rings (pilgrim trails, bridges, wading & splashes)
        for (int rIdx = 0; rIdx < ${WATER_RIPPLE_COUNT}; rIdx++) {
          vec4 rp = uWaterRipples[rIdx];
          float age = uWaterTime - rp.z;
          if (age > 0.0 && age < 2.8 && rp.w > 0.01) {
            vec2 dVec = wp - rp.xy;
            float dLen = length(dVec);
            float radius = age * 3.6;
            float ringDelta = dLen - radius;
            float env = exp(-age * 1.15) * exp(-ringDelta * ringDelta * 3.8) * rp.w;
            float ringWave = sin(ringDelta * 10.5);
            interactiveFoam += smoothstep(0.30, 0.92, ringWave) * env * 0.62;
            vec2 dir2 = dVec / max(dLen, 0.001);
            float dWave = cos(ringDelta * 10.5) * env * 0.17;
            gx += dir2.x * dWave;
            gz += dir2.y * dWave;
          }
        }

        // Continuous shader-based player proximity & movement wave field around pond shores
        float proxStrength = clamp(uPlayerPondProximity, 0.0, 1.0);
        if (proxStrength > 0.01) {
          vec2 pVec = wp - uPlayerWaterPos.xz;
          float pDist = length(pVec);
          float pFalloff = (1.0 - smoothstep(0.8, 13.5, pDist)) * proxStrength;
          float moveBoost = clamp(uPlayerWaterSpeed / 5.0, 0.0, 1.2);
          float proxPhase = pDist * 7.6 - uWaterTime * (3.4 + moveBoost * 2.2);
          float proxWave = cos(proxPhase) * pFalloff * (0.048 + 0.072 * moveBoost);
          vec2 pDir = pVec / max(pDist, 0.001);
          gx += pDir.x * proxWave;
          gz += pDir.y * proxWave;
          interactiveFoam += smoothstep(0.42, 0.95, sin(proxPhase)) * pFalloff * (0.14 + 0.24 * moveBoost);
        }

        vec3 N = normalize(vec3(-gx, 1.0, -gz));
        vec3 toCam = cameraPosition - vWorldPos;
        float camDist = length(toCam);
        vec3 V = toCam / max(camDist, 0.0001);

        float ndv = clamp(dot(N, V), 0.0, 1.0);
        float fresnel = 0.08 + 0.86 * pow(1.0 - ndv, 3.6);

        // Edge-distance parameter from UV perimeter for brick-step depth gradient & organic shoreline lap
        float edgeDist = clamp(min(min(vPondUv.x, 1.0 - vPondUv.x), min(vPondUv.y, 1.0 - vPondUv.y)), 0.0, 0.5);
        float shallowMask = 1.0 - smoothstep(0.0, 0.16, edgeDist);

        // Projective planar reflection lookup with gentle, natural distortion (zero horizontal banding)
        vec4 reflUv = vProjUv;
        float projW = max(reflUv.w, 0.001);
        vec2 rippleDisp = vec2(gx * 0.85, gz * 0.55) * (uRippleStrength * 11.0) * projW;
        reflUv.xy += rippleDisp;
        vec2 safeNd = clamp(reflUv.xy / projW, 0.004, 0.996);
        reflUv.xy = safeNd * projW;
        vec3 planarRefl = texture2DProj(tDiffuse, reflUv).rgb;

        // Subtle underwater mineral caustic shimmer + emerald-jade depth absorption
        float caustic = smoothstep(0.52, 0.95, (w1 * w3 + w2 * w4) * 0.24 + 0.5);
        float depthMix = clamp(0.14 + 0.18 * (1.0 - ndv) + shallowMask * 0.50, 0.0, 1.0);
        vec3 waterBody = mix(uDeepColor, uShallowColor, depthMix);
        waterBody += vec3(0.026, 0.088, 0.076) * caustic * (0.45 + shallowMask * 0.55);

        // Blend water body with live planar reflection & soft sky Fresnel bounce
        vec3 envReflect = mix(planarRefl * color * 0.92, uSkyColor * 0.86, 0.12 + rainAmt * 0.14);
        float reflWeight = clamp(fresnel * uReflectivity * 0.72 + 0.08 - rainAmt * 0.05, 0.14, 0.78);
        vec3 col = mix(waterBody, envReflect, reflWeight);

        // Soft organic water-edge meniscus against brick ghat steps (no striped parallel lines)
        float organicEdgeNoise = sin(wp.x * 2.1 + wp.y * 1.7 + t * 0.6) * 0.004 + cos(wp.x * 3.7 - wp.y * 2.9 - t * 0.8) * 0.003;
        float shoreEdge = max(0.0, edgeDist + organicEdgeNoise);
        float shoreFoam = (1.0 - smoothstep(0.0, 0.018, shoreEdge)) * (0.14 + 0.12 * smoothstep(0.2, 0.85, w1 * 0.5 + 0.5));

        // Crisp sun specular sparkle on wave & raindrop crests
        vec3 L = normalize(uSunDir);
        vec3 H = normalize(L + V);
        float sunHeight = smoothstep(0.02, 0.25, L.y);
        float spec = pow(max(dot(N, H), 0.0), 140.0) * sunHeight;
        col += uSunColor * spec * 0.85;

        // Interactive splash, shoreline & raindrop ring foam highlights
        col = mix(col, vec3(0.92, 0.97, 0.96), clamp(interactiveFoam + shoreFoam, 0.0, 0.84));

        // Match scene exponential squared fog
        float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * camDist * camDist);
        col = mix(col, uFogColor, clamp(fogFactor, 0.0, 1.0));

        gl_FragColor = vec4(col, 0.96);

        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  };

  const reflector = new Reflector(geometry, {
    clipBias: 0.003,
    textureWidth: texSize,
    textureHeight: texSize,
    multisample: 0,
    color: 0xd6e6e4,
    shader: customShader,
  });

  // Wire shared live environment uniforms directly after Reflector clones shader.uniforms
  const mat = reflector.material as THREE.ShaderMaterial;
  mat.uniforms.uWaterTime = REFLECTIVE_WATER_ENV_UNIFORMS.uWaterTime;
  mat.uniforms.uRainIntensity = REFLECTIVE_WATER_ENV_UNIFORMS.uRainIntensity;
  mat.uniforms.uSkyColor = REFLECTIVE_WATER_ENV_UNIFORMS.uSkyColor;
  mat.uniforms.uSunDir = REFLECTIVE_WATER_ENV_UNIFORMS.uSunDir;
  mat.uniforms.uSunColor = REFLECTIVE_WATER_ENV_UNIFORMS.uSunColor;
  mat.uniforms.uFogColor = REFLECTIVE_WATER_ENV_UNIFORMS.uFogColor;
  mat.uniforms.uFogDensity = REFLECTIVE_WATER_ENV_UNIFORMS.uFogDensity;
  mat.uniforms.uWaterRipples = WATER_INTERACTION_UNIFORMS.uWaterRipples;
  mat.uniforms.uPlayerWaterPos = REFLECTIVE_WATER_ENV_UNIFORMS.uPlayerWaterPos;
  mat.uniforms.uPlayerWaterSpeed = REFLECTIVE_WATER_ENV_UNIFORMS.uPlayerWaterSpeed;
  mat.uniforms.uPlayerPondProximity = REFLECTIVE_WATER_ENV_UNIFORMS.uPlayerPondProximity;
  mat.transparent = true;

  // Guard against recursive reflector-in-reflector renders + distance & software-GL frame pacing
  const baseOnBeforeRender = reflector.onBeforeRender;
  let hasRenderedOnce = false;
  let frameCounter = 0;
  const lastCamPos = new THREE.Vector3(1e6, 1e6, 1e6);
  const lastCamQuat = new THREE.Quaternion();

  reflector.onBeforeRender = function (renderer, scene, camera, ...rest) {
    if (isRenderingPlanarReflection) return;
    if (camera.position.distanceTo(anchorPos) > maxActiveDist) return;

    frameCounter++;
    const camMoved =
      _camDeltaPos.subVectors(camera.position, lastCamPos).lengthSq() > 0.04;
    const camRotated =
      1 - Math.abs(lastCamQuat.dot(camera.quaternion)) > 0.0015;

    if (isSoft) {
      const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
      if (hasRenderedOnce) {
        if ((frameCounter + softSlot) % 6 !== 0 && !camMoved && !camRotated) return;
        if ((camMoved || camRotated) && (frameCounter + softSlot) % 4 !== 0) return;
      } else if (nowMs - lastSoftReflectorRenderMs < 150) {
        return;
      }
      lastSoftReflectorRenderMs = nowMs;
    }

    isRenderingPlanarReflection = true;
    try {
      (
        baseOnBeforeRender as (
          r: THREE.WebGLRenderer,
          s: THREE.Scene,
          c: THREE.Camera,
          ...args: unknown[]
        ) => void
      ).call(this, renderer, scene, camera, ...rest);
      hasRenderedOnce = true;
      lastCamPos.copy(camera.position);
      lastCamQuat.copy(camera.quaternion);
    } finally {
      isRenderingPlanarReflection = false;
    }
  };

  reflector.userData.nonCollidable = true;
  reflector.userData.isReflectiveWater = true;
  return reflector;
}

/**
 * Enhances a MeshStandardMaterial with a stylized + physically grounded GLSL water shader:
 * - Multi-octave capillary & current wave displacement
 * - Crisp Bruno-Simon-inspired layered shoreline foam contour ribbons
 * - World-space interactive concentric ripple rings from footsteps, jumps, and splashed props
 * - Analytical wave normal perturbation + Schlick Fresnel sky reflection & sun sparkles
 */
export function applyRealisticWaterShader(
  material: THREE.MeshStandardMaterial,
  uTime: { value: number },
  options: WaterShaderOptions,
): void {
  const modeCode = options.mode === 'river' ? 0 : options.mode === 'lake' ? 1 : 2;
  const maxRadius = Math.max(0.5, options.maxRadius ?? 26);
  const flowSpeed = options.flowSpeed ?? (options.mode === 'river' ? 2.15 : 1.25);

  const deepColor = new THREE.Color(
    options.deepTint ??
      (options.mode === 'river'
        ? 0x0d4c59
        : options.mode === 'lake'
          ? 0x0e4f60
          : 0x115862),
  );
  const shallowColor = new THREE.Color(
    options.shallowTint ??
      (options.mode === 'river'
        ? 0x2f8a88
        : options.mode === 'lake'
          ? 0x359699
          : 0x32908c),
  );

  material.customProgramCacheKey = () =>
    `realistic-water-v2-${modeCode}-${maxRadius.toFixed(1)}`;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWaterTime = uTime;
    shader.uniforms.uRainIntensity = REFLECTIVE_WATER_ENV_UNIFORMS.uRainIntensity;
    shader.uniforms.uWaterDeep = { value: deepColor };
    shader.uniforms.uWaterShallow = { value: shallowColor };
    shader.uniforms.uWaterRipples = WATER_INTERACTION_UNIFORMS.uWaterRipples;
    shader.uniforms.uPlayerWaterPos = REFLECTIVE_WATER_ENV_UNIFORMS.uPlayerWaterPos;
    shader.uniforms.uPlayerWaterSpeed = REFLECTIVE_WATER_ENV_UNIFORMS.uPlayerWaterSpeed;
    shader.uniforms.uPlayerPondProximity = REFLECTIVE_WATER_ENV_UNIFORMS.uPlayerPondProximity;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform float uWaterTime;
         varying vec2 vWaterUv;
         varying vec3 vWaterLocal;
         varying vec3 vWaterWorldPos;
         varying float vWaveCrest;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vWaterUv = uv;
         vWaterLocal = position;
         float wt = uWaterTime * ${flowSpeed.toFixed(2)};
         ${
           modeCode === 0
             ? `
         float w1 = sin(position.z * 0.48 - wt + position.x * 0.42) * 0.032;
         float w2 = cos(position.x * 1.15 + position.z * 0.72 - wt * 0.78) * 0.018;
         float w3 = sin((position.x - position.z) * 1.85 - wt * 1.35) * 0.008;
         float wh = w1 + w2 + w3;`
             : modeCode === 1
               ? `
         float w1 = sin(position.x * 0.92 + position.z * 0.55 - wt * 1.1) * 0.022;
         float w2 = cos(position.z * 1.35 - position.x * 0.68 - wt * 0.85) * 0.015;
         float w3 = sin(length(position.xz) * 1.9 - wt * 1.45) * 0.009;
         float wh = w1 + w2 + w3;`
               : `
         float rad = length(position.xz);
         float w1 = sin(rad * 2.2 - wt * 1.3) * 0.011;
         float w2 = cos(position.x * 2.6 + position.z * 2.1 - wt * 0.95) * 0.007;
         float wh = w1 + w2;`
         }
         transformed.y += wh;
         vWaveCrest = wh;
         vWaterWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform float uWaterTime;
         uniform float uRainIntensity;
         uniform vec3 uWaterDeep;
         uniform vec3 uWaterShallow;
         uniform vec4 uWaterRipples[${WATER_RIPPLE_COUNT}];
         uniform vec3 uPlayerWaterPos;
         uniform float uPlayerWaterSpeed;
         uniform float uPlayerPondProximity;
         varying vec2 vWaterUv;
         varying vec3 vWaterLocal;
         varying vec3 vWaterWorldPos;
         varying float vWaveCrest;

         vec3 stdRainHash3(vec2 p) {
           vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
           p3 += dot(p3, p3.yxz + 33.33);
           return fract((p3.xxy + p3.yzz) * p3.zyx);
         }

         vec3 evalStdRainRing(vec2 worldXZ, float scale, float angle, float rate, vec2 seedOff) {
           float ca = cos(angle);
           float sa = sin(angle);
           mat2 rot = mat2(ca, -sa, sa, ca);
           vec2 p = (rot * worldXZ) * scale + seedOff;
           vec2 cell = floor(p);
           vec2 f = fract(p);
           float slot = floor(uWaterTime * rate);
           vec3 h = stdRainHash3(cell + seedOff + slot * 0.37);
           float cycle = fract(uWaterTime * rate + h.z);
           if (cycle < 0.01) return vec3(0.0);
           vec2 center = vec2(0.5) + (h.xy - 0.5) * 0.34;
           vec2 dVec = f - center;
           float dist = length(dVec);
           float radius = cycle * 0.27;
           float ringDelta = dist - radius;
           float fade = smoothstep(0.0, 0.07, cycle) * pow(max(0.0, 1.0 - cycle), 1.35);
           float env = exp(-ringDelta * ringDelta * 260.0) * fade;
           float ringWave = cos(ringDelta * 46.0) * env;
           float crest = smoothstep(0.28, 0.92, sin(ringDelta * 46.0)) * env;
           vec2 dirLocal = dVec / max(dist, 0.0005);
           vec2 gradWorld = mat2(ca, sa, -sa, ca) * (dirLocal * ringWave * 0.16);
           return vec3(gradWorld.x, gradWorld.y, crest);
         }`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         float wt = uWaterTime * ${flowSpeed.toFixed(2)};
         ${
           modeCode === 0
             ? `
         float edgeNorm = abs(vWaterUv.x - 0.5) * 2.0;
         float edgeNoise = sin(vWaterLocal.z * 1.15 - wt * 0.95) * 0.045 + cos(vWaterLocal.z * 2.3 + wt * 0.65) * 0.025;
         float edgeDist = clamp(edgeNorm + edgeNoise, 0.0, 1.08);
         float shoreBand = smoothstep(0.89, 0.992, edgeDist);
         // Subtle stylized shoreline foam contour lines
         float contourPhase = (1.0 - edgeDist) * 24.0 - wt * 1.45 + sin(vWaterLocal.z * 0.85) * 0.8;
         float contourWave1 = smoothstep(0.74, 0.93, sin(contourPhase)) * smoothstep(0.72, 0.94, edgeDist) * (1.0 - smoothstep(0.95, 1.02, edgeDist));
         float contourWave2 = smoothstep(0.80, 0.96, cos(vWaterLocal.z * 0.62 - wt * 1.1 + edgeDist * 14.0)) * smoothstep(0.60, 0.86, edgeDist) * (1.0 - smoothstep(0.88, 0.96, edgeDist));
         float f1 = sin(vWaterLocal.z * 0.95 - wt * 1.3 + sin(vWaterLocal.x * 1.45) * 1.2);
         float f2 = cos(vWaterLocal.x * 1.95 + vWaterLocal.z * 0.75 - wt * 0.95);`
             : modeCode === 1
               ? `
         float edgeNorm = clamp(length(vWaterLocal.xz) / ${maxRadius.toFixed(2)}, 0.0, 1.0);
         float angL = atan(vWaterLocal.z, vWaterLocal.x);
         float edgeNoise = sin(angL * 9.0 + wt * 0.65) * 0.025 + cos(angL * 5.0 - wt * 0.45) * 0.015;
         float edgeDist = clamp(edgeNorm + edgeNoise, 0.0, 1.05);
         float shoreBand = smoothstep(0.89, 0.99, edgeDist);
         float contourPhase = (1.0 - edgeDist) * 32.0 - wt * 1.25;
         float contourWave1 = smoothstep(0.70, 0.92, sin(contourPhase)) * smoothstep(0.78, 0.95, edgeDist);
         float contourWave2 = smoothstep(0.78, 0.94, sin(contourPhase * 0.7 + angL * 3.0)) * smoothstep(0.70, 0.89, edgeDist) * (1.0 - smoothstep(0.90, 0.97, edgeDist));
         float f1 = sin(vWaterLocal.x * 1.25 - vWaterLocal.z * 0.95 + wt * 1.1);
         float f2 = cos(length(vWaterLocal.xz) * 2.4 - wt * 1.35);`
               : `
         float edgeNorm = clamp(max(abs(vWaterLocal.x), abs(vWaterLocal.z)) / ${maxRadius.toFixed(2)}, 0.0, 1.0);
         float edgeNoise = sin((vWaterLocal.x + vWaterLocal.z) * 2.2 - wt) * 0.025;
         float edgeDist = clamp(edgeNorm + edgeNoise, 0.0, 1.05);
         float shoreBand = smoothstep(0.86, 0.99, edgeDist);
         float contourPhase = (1.0 - edgeDist) * 18.0 - wt * 1.3;
         float contourWave1 = smoothstep(0.72, 0.92, sin(contourPhase)) * smoothstep(0.74, 0.95, edgeDist);
         float contourWave2 = 0.0;
         float f1 = sin(length(vWaterLocal.xz) * 3.1 - wt * 1.45);
         float f2 = cos(vWaterLocal.x * 2.8 - vWaterLocal.z * 2.4 + wt * 1.1);`
         }

         // Interactive expanding concentric water ripples from footsteps, trails & rain
         float interactiveFoam = 0.0;
         float rippleGradX = 0.0;
         float rippleGradZ = 0.0;
         float rainAmt = clamp(uRainIntensity, 0.0, 1.0);
         if (rainAmt > 0.005) {
           vec3 rr1 = evalStdRainRing(vWaterWorldPos.xz, 0.92, 0.0, 1.45, vec2(2.3, 6.1));
           vec3 rr2 = evalStdRainRing(vWaterWorldPos.xz, 1.48, 0.71, 1.95, vec2(9.4, 3.8));
           vec3 rrSum = (rr1 + rr2 * 0.85) * rainAmt;
           rippleGradX += rrSum.x;
           rippleGradZ += rrSum.y;
           interactiveFoam += rrSum.z * 0.45;
         }
         for (int rIdx = 0; rIdx < ${WATER_RIPPLE_COUNT}; rIdx++) {
           vec4 rp = uWaterRipples[rIdx];
           float age = uWaterTime - rp.z;
           if (age > 0.0 && age < 2.8 && rp.w > 0.01) {
             vec2 dVec = vWaterWorldPos.xz - rp.xy;
             float dLen = length(dVec);
             float radius = age * 3.6;
             float ringDelta = dLen - radius;
             float env = exp(-age * 1.15) * exp(-ringDelta * ringDelta * 3.8) * rp.w;
             float ringWave = sin(ringDelta * 10.5);
             interactiveFoam += smoothstep(0.30, 0.92, ringWave) * env * 0.82;
             vec2 dir2 = dVec / max(dLen, 0.001);
             float dWave = cos(ringDelta * 10.5) * env * 0.24;
             rippleGradX += dir2.x * dWave;
             rippleGradZ += dir2.y * dWave;
           }
         }
         float stdProx = clamp(uPlayerPondProximity, 0.0, 1.0);
         if (stdProx > 0.01) {
           vec2 pVec = vWaterWorldPos.xz - uPlayerWaterPos.xz;
           float pDist = length(pVec);
           float pFall = (1.0 - smoothstep(0.8, 13.5, pDist)) * stdProx;
           float mvBoost = clamp(uPlayerWaterSpeed / 5.0, 0.0, 1.2);
           float ph = pDist * 7.6 - uWaterTime * (3.4 + mvBoost * 2.2);
           float pW = cos(ph) * pFall * (0.048 + 0.072 * mvBoost);
           vec2 pDir = pVec / max(pDist, 0.001);
           rippleGradX += pDir.x * pW;
           rippleGradZ += pDir.y * pW;
           interactiveFoam += smoothstep(0.42, 0.95, sin(ph)) * pFall * (0.16 + 0.26 * mvBoost);
         }

         vec3 waterCol = mix(uWaterDeep, uWaterShallow, smoothstep(0.18, 0.92, edgeNorm));
         float caustic = smoothstep(0.54, 0.96, (f1 * f2) * 0.5 + 0.5);
         waterCol += vec3(0.03, 0.09, 0.10) * caustic;

         float maxFoamCap = ${modeCode === 0 ? '0.42' : '0.84'};
         float totalFoam = clamp(shoreBand * ${modeCode === 0 ? '0.28' : '0.52'} + contourWave1 * ${modeCode === 0 ? '0.32' : '0.62'} + contourWave2 * ${modeCode === 0 ? '0.20' : '0.34'} + interactiveFoam, 0.0, maxFoamCap);
         vec3 foamColor = ${modeCode === 0 ? 'vec3(0.68, 0.78, 0.80)' : 'vec3(0.90, 0.96, 0.97)'};
         diffuseColor.rgb = mix(waterCol, foamColor, totalFoam);`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
         {
           float wtn = uWaterTime * ${flowSpeed.toFixed(2)};
           vec2 wpN = vWaterWorldPos.xz;
           float p1N = dot(wpN, vec2(0.84, 0.54)) * 2.1 - wtn * 1.15;
           float p2N = dot(wpN, vec2(-0.61, 0.79)) * 3.1 + wtn * 0.95;
           float p3N = dot(wpN, vec2(0.37, -0.93)) * 4.5 - wtn * 1.45;
           float gx = cos(p1N) * 0.032 - sin(p2N) * 0.024 + cos(p3N) * 0.016 + rippleGradX;
           float gz = cos(p1N) * 0.021 + sin(p2N) * 0.030 - cos(p3N) * 0.022 + rippleGradZ;
           vec3 rippleWorldN = normalize(vec3(-gx, 1.0, -gz));
           vec3 rippleViewN = normalize((viewMatrix * vec4(rippleWorldN, 0.0)).xyz);
           normal = normalize(mix(normal, rippleViewN, 0.58));

           // Balanced Fresnel sky reflection & crisp sun glint without blowing out into bloom haze
           vec3 viewDirW = normalize(vViewPosition);
           float ndv = clamp(dot(normal, viewDirW), 0.0, 1.0);
           float fresnel = pow(1.0 - ndv, 3.4);
           vec3 skyReflect = vec3(0.42, 0.60, 0.70);
           diffuseColor.rgb = mix(diffuseColor.rgb, skyReflect, fresnel * ${modeCode === 0 ? '0.22' : '0.34'});

           float sunSparkle = pow(clamp(max(0.0, vWaveCrest * 18.0) + max(0.0, abs(gx) + abs(gz)) * 3.2, 0.0, 1.0), 3.2);
           diffuseColor.rgb += vec3(0.08, 0.10, 0.11) * sunSparkle;
         }`,
      );
  };
}

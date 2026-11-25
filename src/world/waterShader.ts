import * as THREE from 'three';

export interface WaterShaderOptions {
  mode: 'river' | 'lake' | 'pond';
  maxRadius?: number;
  flowSpeed?: number;
  shallowTint?: THREE.ColorRepresentation;
  deepTint?: THREE.ColorRepresentation;
}

export const WATER_RIPPLE_COUNT = 8;

const rippleSlots: THREE.Vector4[] = Array.from(
  { length: WATER_RIPPLE_COUNT },
  () => new THREE.Vector4(0, 0, -999, 0),
);
let rippleCursor = 0;
let lastRippleTime = -10;

export const WATER_INTERACTION_UNIFORMS = {
  uWaterRipples: { value: rippleSlots },
};

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
    shader.uniforms.uWaterDeep = { value: deepColor };
    shader.uniforms.uWaterShallow = { value: shallowColor };
    shader.uniforms.uWaterRipples = WATER_INTERACTION_UNIFORMS.uWaterRipples;

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
         uniform vec3 uWaterDeep;
         uniform vec3 uWaterShallow;
         uniform vec4 uWaterRipples[${WATER_RIPPLE_COUNT}];
         varying vec2 vWaterUv;
         varying vec3 vWaterLocal;
         varying vec3 vWaterWorldPos;
         varying float vWaveCrest;`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         float wt = uWaterTime * ${flowSpeed.toFixed(2)};
         ${
           modeCode === 0
             ? `
         float edgeNorm = abs(vWaterUv.x - 0.5) * 2.0;
         float edgeNoise = sin(vWaterLocal.z * 1.15 - wt * 0.95) * 0.055 + cos(vWaterLocal.z * 2.3 + wt * 0.65) * 0.030;
         float edgeDist = clamp(edgeNorm + edgeNoise, 0.0, 1.1);
         float shoreBand = smoothstep(0.82, 0.985, edgeDist);
         // Crisp stylized concentric shoreline foam contour lines
         float contourPhase = (1.0 - edgeDist) * 24.0 - wt * 1.45 + sin(vWaterLocal.z * 0.85) * 0.8;
         float contourWave1 = smoothstep(0.68, 0.90, sin(contourPhase)) * smoothstep(0.66, 0.92, edgeDist) * (1.0 - smoothstep(0.95, 1.02, edgeDist));
         float contourWave2 = smoothstep(0.76, 0.94, cos(vWaterLocal.z * 0.62 - wt * 1.1 + edgeDist * 14.0)) * smoothstep(0.55, 0.84, edgeDist) * (1.0 - smoothstep(0.86, 0.95, edgeDist));
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

         // Interactive expanding concentric water ripples from footsteps & splashed props
         float interactiveFoam = 0.0;
         float rippleGradX = 0.0;
         float rippleGradZ = 0.0;
         for (int rIdx = 0; rIdx < ${WATER_RIPPLE_COUNT}; rIdx++) {
           vec4 rp = uWaterRipples[rIdx];
           float age = uWaterTime - rp.z;
           if (age > 0.0 && age < 2.6 && rp.w > 0.01) {
             vec2 dVec = vWaterWorldPos.xz - rp.xy;
             float dLen = length(dVec);
             float radius = age * 3.8;
             float ringDelta = dLen - radius;
             float env = exp(-age * 1.35) * exp(-ringDelta * ringDelta * 5.2) * rp.w;
             float ringWave = sin(ringDelta * 11.5);
             interactiveFoam += smoothstep(0.35, 0.92, ringWave) * env * 0.85;
             vec2 dir2 = dVec / max(dLen, 0.001);
             float dWave = cos(ringDelta * 11.5) * env * 0.24;
             rippleGradX += dir2.x * dWave;
             rippleGradZ += dir2.y * dWave;
           }
         }

         vec3 waterCol = mix(uWaterDeep, uWaterShallow, smoothstep(0.16, 0.92, edgeNorm));
         float caustic = smoothstep(0.54, 0.96, (f1 * f2) * 0.5 + 0.5);
         waterCol += vec3(0.06, 0.14, 0.15) * caustic;

         float totalFoam = clamp(shoreBand * 0.52 + contourWave1 * 0.62 + contourWave2 * 0.34 + interactiveFoam, 0.0, 0.92);
         vec3 foamColor = vec3(0.92, 0.97, 0.98);
         diffuseColor.rgb = mix(waterCol, foamColor, totalFoam);`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
         {
           float wtn = uWaterTime * ${flowSpeed.toFixed(2)};
           float gx = cos(vWaterLocal.x * 2.3 + vWaterLocal.z * 1.4 - wtn * 1.4) * 0.065
                    + sin(vWaterLocal.x * 4.7 - vWaterLocal.z * 3.1 + wtn * 1.9) * 0.032
                    + rippleGradX;
           float gz = sin(vWaterLocal.z * 2.1 - vWaterLocal.x * 1.5 - wtn * 1.25) * 0.065
                    + cos(vWaterLocal.z * 4.3 + vWaterLocal.x * 2.8 - wtn * 1.7) * 0.032
                    + rippleGradZ;
           vec3 rippleWorldN = normalize(vec3(-gx, 1.0, -gz));
           vec3 rippleViewN = normalize((viewMatrix * vec4(rippleWorldN, 0.0)).xyz);
           normal = normalize(mix(normal, rippleViewN, 0.62));

           // Fresnel sky/horizon reflection & crisp stylized specular glint
           vec3 viewDirW = normalize(vViewPosition);
           float ndv = clamp(dot(normal, viewDirW), 0.0, 1.0);
           float fresnel = pow(1.0 - ndv, 3.0);
           vec3 skyReflect = vec3(0.58, 0.76, 0.86);
           diffuseColor.rgb = mix(diffuseColor.rgb, skyReflect, fresnel * 0.42);

           float sunSparkle = pow(clamp(max(0.0, vWaveCrest * 18.0) + max(0.0, abs(gx) + abs(gz)) * 3.2, 0.0, 1.0), 3.0);
           diffuseColor.rgb += vec3(0.24, 0.28, 0.30) * sunSparkle;
         }`,
      );
  };
}

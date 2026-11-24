import * as THREE from 'three';

export interface WaterShaderOptions {
  mode: 'river' | 'lake' | 'pond';
  maxRadius?: number;
  flowSpeed?: number;
  shallowTint?: THREE.ColorRepresentation;
  deepTint?: THREE.ColorRepresentation;
}

/**
 * Enhances a MeshStandardMaterial with a realistic animated GLSL water shader:
 * - Multi-octave Gerstner-inspired capillary & wind wave displacement
 * - Analytical wave gradient normal perturbation for dynamic sun/sky specular sparkles
 * - Schlick Fresnel sky/horizon reflection & mineral-tinted depth coloration + shoreline foam
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
        ? 0x0c343b
        : options.mode === 'lake'
          ? 0x0d3d4a
          : 0x0f494f),
  );
  const shallowColor = new THREE.Color(
    options.shallowTint ??
      (options.mode === 'river'
        ? 0x265955
        : options.mode === 'lake'
          ? 0x2a7a7e
          : 0x287872),
  );

  material.customProgramCacheKey = () =>
    `realistic-water-v1-${modeCode}-${maxRadius.toFixed(1)}`;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWaterTime = uTime;
    shader.uniforms.uWaterDeep = { value: deepColor };
    shader.uniforms.uWaterShallow = { value: shallowColor };

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform float uWaterTime;
         varying vec2 vWaterUv;
         varying vec3 vWaterLocal;
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
         float w1 = sin(position.z * 0.48 - wt + position.x * 0.42) * 0.030;
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
         vWaveCrest = wh;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform float uWaterTime;
         uniform vec3 uWaterDeep;
         uniform vec3 uWaterShallow;
         varying vec2 vWaterUv;
         varying vec3 vWaterLocal;
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
         float edgeNoise = sin(vWaterLocal.z * 1.35 - wt * 1.15) * 0.055 + cos(vWaterLocal.z * 2.4 + wt * 0.75) * 0.032;
         float shoreMask = smoothstep(0.79, 0.98, edgeNorm + edgeNoise);
         float f1 = sin(vWaterLocal.z * 0.95 - wt * 1.3 + sin(vWaterLocal.x * 1.45) * 1.2);
         float f2 = cos(vWaterLocal.x * 1.95 + vWaterLocal.z * 0.75 - wt * 0.95);`
             : modeCode === 1
               ? `
         float edgeNorm = clamp(length(vWaterLocal.xz) / ${maxRadius.toFixed(2)}, 0.0, 1.0);
         float edgeNoise = sin(atan(vWaterLocal.z, vWaterLocal.x) * 8.0 + wt * 0.7) * 0.025;
         float shoreMask = smoothstep(0.88, 0.99, edgeNorm + edgeNoise);
         float f1 = sin(vWaterLocal.x * 1.25 - vWaterLocal.z * 0.95 + wt * 1.1);
         float f2 = cos(length(vWaterLocal.xz) * 2.4 - wt * 1.35);`
               : `
         float edgeNorm = clamp(max(abs(vWaterLocal.x), abs(vWaterLocal.z)) / ${maxRadius.toFixed(2)}, 0.0, 1.0);
         float edgeNoise = sin((vWaterLocal.x + vWaterLocal.z) * 2.2 - wt) * 0.025;
         float shoreMask = smoothstep(0.84, 0.99, edgeNorm + edgeNoise);
         float f1 = sin(length(vWaterLocal.xz) * 3.1 - wt * 1.45);
         float f2 = cos(vWaterLocal.x * 2.8 - vWaterLocal.z * 2.4 + wt * 1.1);`
         }
         vec3 waterCol = mix(uWaterDeep, uWaterShallow, smoothstep(0.18, 0.94, edgeNorm));
         float caustic = smoothstep(0.55, 0.96, (f1 * f2) * 0.5 + 0.5);
         waterCol += vec3(0.05, 0.11, 0.12) * caustic;
         diffuseColor.rgb = mix(waterCol, vec3(0.84, 0.91, 0.93), shoreMask * 0.44);`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
         {
           float wtn = uWaterTime * ${flowSpeed.toFixed(2)};
           float gx = cos(vWaterLocal.x * 2.3 + vWaterLocal.z * 1.4 - wtn * 1.4) * 0.065
                    + sin(vWaterLocal.x * 4.7 - vWaterLocal.z * 3.1 + wtn * 1.9) * 0.032;
           float gz = sin(vWaterLocal.z * 2.1 - vWaterLocal.x * 1.5 - wtn * 1.25) * 0.065
                    + cos(vWaterLocal.z * 4.3 + vWaterLocal.x * 2.8 - wtn * 1.7) * 0.032;
           vec3 rippleWorldN = normalize(vec3(-gx, 1.0, -gz));
           vec3 rippleViewN = normalize((viewMatrix * vec4(rippleWorldN, 0.0)).xyz);
           normal = normalize(mix(normal, rippleViewN, 0.58));

           // Fresnel sky/horizon reflection & dynamic crest glint driven by ripple-perturbed normal
           vec3 viewDirW = normalize(vViewPosition);
           float ndv = clamp(dot(normal, viewDirW), 0.0, 1.0);
           float fresnel = pow(1.0 - ndv, 3.0);
           vec3 skyReflect = vec3(0.54, 0.70, 0.82);
           diffuseColor.rgb = mix(diffuseColor.rgb, skyReflect, fresnel * 0.44);

           float sunSparkle = pow(clamp(max(0.0, vWaveCrest * 18.0) + max(0.0, abs(gx) + abs(gz)) * 3.2, 0.0, 1.0), 3.0);
           diffuseColor.rgb += vec3(0.22, 0.26, 0.29) * sunSparkle;
         }`,
      );
  };
}

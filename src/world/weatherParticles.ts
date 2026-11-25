import * as THREE from 'three';
import {
  type WeatherKind,
  type WeatherParticleMode,
  computeWeatherParticleModeProfile,
} from './worldLogic';

const WEATHER_PARTICLE_COUNT = 1400;
const WEATHER_BOX_SIZE = new THREE.Vector3(42, 20, 42);
const _scratchColorA = new THREE.Color();
const _scratchColorB = new THREE.Color();
const _scratchSun = new THREE.Color();

function modeToShaderIndex(mode: WeatherParticleMode): number {
  switch (mode) {
    case 'petals':
      return 0;
    case 'rain':
      return 1;
    case 'snow':
      return 2;
    case 'mist':
    case 'foggy':
    default:
      return 3;
  }
}

function seededUnit(i: number, salt: number): number {
  const x = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export class WeatherParticleSystem {
  public readonly points: THREE.Points;
  public readonly material: THREE.ShaderMaterial;
  public readonly count = WEATHER_PARTICLE_COUNT;

  private activeMode: WeatherParticleMode = 'petals';
  private lastWeather: WeatherKind | null = null;
  private drift = new THREE.Vector3();

  constructor(initialWeather: WeatherKind = 'clear', initialPixelScale = 1) {
    const positions = new Float32Array(this.count * 3);
    const seeds = new Float32Array(this.count * 3);
    const normIndices = new Float32Array(this.count);
    const colorMix = new Float32Array(this.count);

    for (let i = 0; i < this.count; i++) {
      positions[i * 3] = seededUnit(i, 1) * WEATHER_BOX_SIZE.x;
      positions[i * 3 + 1] = seededUnit(i, 2) * WEATHER_BOX_SIZE.y;
      positions[i * 3 + 2] = seededUnit(i, 3) * WEATHER_BOX_SIZE.z;

      seeds[i * 3] = 0.72 + seededUnit(i, 4) * 0.62; // speed multiplier
      seeds[i * 3 + 1] = seededUnit(i, 5) * Math.PI * 2; // phase
      seeds[i * 3 + 2] = 0.7 + seededUnit(i, 6) * 0.75; // size multiplier
      normIndices[i] = this.count > 1 ? i / (this.count - 1) : 0;
      colorMix[i] = seededUnit(i, 7);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3));
    geometry.setAttribute('aNormIndex', new THREE.BufferAttribute(normIndices, 1));
    geometry.setAttribute('aColorMix', new THREE.BufferAttribute(colorMix, 1));

    const profile = computeWeatherParticleModeProfile(initialWeather);
    this.activeMode = profile.mode;
    this.lastWeather = initialWeather;

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uMode: { value: modeToShaderIndex(profile.mode) },
        uCenter: { value: new THREE.Vector3(0, 0, 6) },
        uDrift: { value: new THREE.Vector3() },
        uBoxSize: { value: WEATHER_BOX_SIZE.clone() },
        uActiveFraction: { value: profile.activeRatio },
        uTurbulence: { value: profile.turbulence },
        uTumbleSpeed: { value: profile.tumbleSpeed },
        uBaseSize: { value: profile.baseSize },
        uPixelScale: { value: initialPixelScale },
        uOpacity: { value: profile.opacity },
        uPrimaryColor: { value: new THREE.Color(profile.primaryColorHex) },
        uSecondaryColor: { value: new THREE.Color(profile.secondaryColorHex) },
        uLightTint: { value: new THREE.Color('#ffffff') },
      },
      vertexShader: `
        attribute vec3 aSeed;
        attribute float aNormIndex;
        attribute float aColorMix;

        uniform float uTime;
        uniform float uMode;
        uniform vec3 uCenter;
        uniform vec3 uDrift;
        uniform vec3 uBoxSize;
        uniform float uActiveFraction;
        uniform float uTurbulence;
        uniform float uTumbleSpeed;
        uniform float uBaseSize;
        uniform float uPixelScale;

        varying float vAlpha;
        varying float vRot;
        varying float vColorMix;

        void main() {
          if (aNormIndex > uActiveFraction) {
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
            gl_PointSize = 0.0;
            vAlpha = 0.0;
            vRot = 0.0;
            vColorMix = 0.0;
            return;
          }

          vec3 halfBox = uBoxSize * 0.5;
          float swirlFreq = uMode < 0.5 ? 1.15 : 0.85;
          vec3 flutter = vec3(
            sin(uTime * swirlFreq + aSeed.y) * uTurbulence,
            cos(uTime * 0.78 + aSeed.y * 1.37) * (uTurbulence * 0.28),
            cos(uTime * (swirlFreq * 0.9) + aSeed.y * 0.89) * uTurbulence
          );
          vec3 motion = vec3(uDrift.x * aSeed.x, uDrift.y * aSeed.x, uDrift.z * aSeed.x) + flutter;
          vec3 baseAnchor = vec3(uCenter.x, uCenter.y - 1.2, uCenter.z);
          vec3 rel = mod(position + motion - baseAnchor + vec3(halfBox.x, 0.0, halfBox.z), uBoxSize) - vec3(halfBox.x, 0.0, halfBox.z);
          vec3 worldPos = vec3(uCenter.x + rel.x, (uCenter.y - 1.2) + rel.y, uCenter.z + rel.z);

          vec4 mvPosition = modelViewMatrix * vec4(worldPos, 1.0);
          float camDist = -mvPosition.z;

          float heightFade = smoothstep(0.0, 1.6, rel.y) * (1.0 - smoothstep(uBoxSize.y - 3.0, uBoxSize.y, rel.y));
          float nearFade = smoothstep(1.1, 3.4, camDist);
          float farFade = 1.0 - smoothstep(26.0, 44.0, camDist);
          float poolFade = smoothstep(uActiveFraction, max(0.0, uActiveFraction - 0.05), aNormIndex);

          vAlpha = heightFade * nearFade * farFade * poolFade;
          vRot = uTime * uTumbleSpeed * (0.75 + 0.45 * aColorMix) + aSeed.y;
          vColorMix = aColorMix;

          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = clamp((uBaseSize * aSeed.z * uPixelScale) / max(camDist, 1.0), 1.8, 36.0 * uPixelScale);
        }
      `,
      fragmentShader: `
        uniform float uMode;
        uniform float uOpacity;
        uniform vec3 uPrimaryColor;
        uniform vec3 uSecondaryColor;
        uniform vec3 uLightTint;

        varying float vAlpha;
        varying float vRot;
        varying float vColorMix;

        void main() {
          if (vAlpha <= 0.006) discard;
          vec2 uv = gl_PointCoord - vec2(0.5);

          float shape = 0.0;
          vec3 baseColor = uPrimaryColor;

          if (uMode < 0.5) {
            // Falling Cherry Blossom Petal (notched two-lobed sakura petal with flutter tilt)
            float c = cos(vRot);
            float s = sin(vRot);
            vec2 p = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);
            float tiltScale = 0.62 + 0.38 * abs(sin(vRot * 0.72 + vColorMix * 3.1));
            p.y /= tiltScale;
            float notch = smoothstep(0.0, 0.2, p.y) * 0.13 * exp(-p.x * p.x * 38.0);
            float d = length(vec2(p.x * 1.12, (p.y + notch) * 1.74)) * 2.0;
            shape = smoothstep(1.0, 0.24, d);
            baseColor = mix(uPrimaryColor, uSecondaryColor, clamp(d * 0.55 + vColorMix * 0.45, 0.0, 1.0)) * uLightTint;
          } else if (uMode < 1.5) {
            // Wind-slanted Falling Raindrop Streak
            float c = 0.982;
            float s = 0.188;
            vec2 p = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);
            float d = length(vec2(p.x * 5.2, p.y * 0.92)) * 2.0;
            shape = pow(smoothstep(1.0, 0.12, d), 0.95);
            baseColor = mix(uPrimaryColor, uSecondaryColor, clamp(d * 0.4 + vColorMix * 0.25, 0.0, 1.0));
          } else if (uMode < 2.5) {
            // Light Snow Crystal Flake (soft 6-lobed feathering)
            float r = length(uv) * 2.0;
            float ang = atan(uv.y, uv.x) + vRot * 0.35;
            float crystal = 0.86 + 0.14 * cos(ang * 6.0);
            float d = r / crystal;
            shape = pow(smoothstep(1.0, 0.08, d), 1.35);
            baseColor = mix(uPrimaryColor, uSecondaryColor, clamp(d * 0.3 + vColorMix * 0.2, 0.0, 1.0));
          } else {
            // Drifting Mist / Fog Mote
            float d = length(uv) * 2.0;
            shape = pow(smoothstep(1.0, 0.05, d), 1.6);
            baseColor = mix(uPrimaryColor, uSecondaryColor, vColorMix);
          }

          float alpha = shape * vAlpha * uOpacity;
          if (alpha < 0.008) discard;
          gl_FragColor = vec4(baseColor, alpha);
        }
      `,
    });

    this.points = new THREE.Points(geometry, this.material);
    this.points.name = 'WeatherParticleSystem';
    this.points.frustumCulled = false;
    this.points.renderOrder = 3;
    this.points.userData.nonCollidable = true;
  }

  public get currentMode(): WeatherParticleMode {
    return this.activeMode;
  }

  public syncWeatherImmediate(weather: WeatherKind, pixelScale: number): void {
    const profile = computeWeatherParticleModeProfile(weather);
    this.activeMode = profile.mode;
    this.lastWeather = weather;

    const u = this.material.uniforms;
    u.uMode.value = modeToShaderIndex(profile.mode);
    u.uActiveFraction.value = profile.activeRatio;
    u.uTurbulence.value = profile.turbulence;
    u.uTumbleSpeed.value = profile.tumbleSpeed;
    u.uBaseSize.value = profile.baseSize;
    u.uOpacity.value = profile.opacity;
    u.uPixelScale.value = pixelScale;
    (u.uPrimaryColor.value as THREE.Color).set(profile.primaryColorHex);
    (u.uSecondaryColor.value as THREE.Color).set(profile.secondaryColorHex);
  }

  public update(
    dt: number,
    elapsed: number,
    weather: WeatherKind,
    anchor: THREE.Vector3,
    pixelScale: number,
    sunColorHex = '#ffffff',
  ): void {
    const profile = computeWeatherParticleModeProfile(weather);
    if (this.lastWeather !== weather) {
      this.syncWeatherImmediate(weather, pixelScale);
    }

    const wrap = (val: number, max: number) => ((val % max) + max) % max;
    const gust = 1 + 0.18 * Math.sin(elapsed * 0.42);
    this.drift.x = wrap(this.drift.x + profile.windDriftX * gust * dt, WEATHER_BOX_SIZE.x);
    this.drift.y = wrap(this.drift.y - profile.fallSpeed * dt, WEATHER_BOX_SIZE.y);
    this.drift.z = wrap(this.drift.z + profile.windDriftZ * gust * dt, WEATHER_BOX_SIZE.z);

    const u = this.material.uniforms;
    u.uTime.value = elapsed;
    (u.uCenter.value as THREE.Vector3).copy(anchor);
    (u.uDrift.value as THREE.Vector3).copy(this.drift);
    u.uPixelScale.value = pixelScale;
    _scratchColorA.set('#ffffff');
    _scratchSun.set(sunColorHex);
    _scratchColorB.copy(_scratchColorA).lerp(_scratchSun, 0.22);
    (u.uLightTint.value as THREE.Color).copy(_scratchColorB);
  }

  public dispose(): void {
    this.points.geometry.dispose();
    this.material.dispose();
  }
}

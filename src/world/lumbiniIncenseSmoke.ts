import * as THREE from 'three';
import {
  type LumbiniIncenseSmokePlacement,
  generateLumbiniIncenseSmokePlacements,
} from './worldLogic';

export class LumbiniIncenseSmokeSystem {
  public readonly points: THREE.Points;
  public readonly material: THREE.ShaderMaterial;
  public readonly count: number;
  public readonly placements: LumbiniIncenseSmokePlacement[];

  constructor(count = 240, seed = 202618) {
    this.placements = generateLumbiniIncenseSmokePlacements(count, seed);
    this.count = this.placements.length;

    const positions = new Float32Array(this.count * 3);
    const motionA = new Float32Array(this.count * 4); // phase, speed, riseHeight, swirlRadius
    const motionB = new Float32Array(this.count * 3); // swirlFreq, scale, warmShift

    for (let i = 0; i < this.count; i++) {
      const p = this.placements[i];
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;

      motionA[i * 4] = p.phase;
      motionA[i * 4 + 1] = p.speed;
      motionA[i * 4 + 2] = p.riseHeight;
      motionA[i * 4 + 3] = p.swirlRadius;

      motionB[i * 3] = p.swirlFreq;
      motionB[i * 3 + 1] = p.scale;
      motionB[i * 3 + 2] = p.warmShift;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aMotionA', new THREE.BufferAttribute(motionA, 4));
    geometry.setAttribute('aMotionB', new THREE.BufferAttribute(motionB, 3));

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uPixelScale: { value: 1 },
        uWind: { value: new THREE.Vector2(0.32, 0.14) },
        uLightTint: { value: new THREE.Color('#f4efe6') },
        uRitualGlow: { value: 0 },
      },
      vertexShader: `
        attribute vec4 aMotionA;
        attribute vec3 aMotionB;

        uniform float uTime;
        uniform float uPixelScale;
        uniform vec2 uWind;

        varying float vAlpha;
        varying float vWarmShift;
        varying float vPhase;
        varying float vAge;

        void main() {
          float phase = aMotionA.x;
          float speed = aMotionA.y;
          float riseHeight = aMotionA.z;
          float swirlRadius = aMotionA.w;

          float swirlFreq = aMotionB.x;
          float sizeScale = aMotionB.y;
          vWarmShift = aMotionB.z;
          vPhase = phase * 6.283185;

          float t = fract(uTime * speed + phase);
          vAge = t;

          // Delicate rising ribbon near brazier -> gentle helical curl -> soft wispy dispersion aloft
          float curlEnv = smoothstep(0.04, 0.88, t);
          float angle = t * swirlFreq * 6.283185 + vPhase;
          float driftX = cos(angle) * swirlRadius * curlEnv + sin(uTime * 0.42 + vPhase + t * 2.5) * 0.14 * curlEnv;
          float driftZ = sin(angle * 0.92) * swirlRadius * curlEnv + cos(uTime * 0.37 + vPhase * 1.3 + t * 2.1) * 0.14 * curlEnv;
          vec2 windOffset = uWind * pow(t, 1.35) * 1.18;

          vec3 worldPos = vec3(
            position.x + driftX + windOffset.x,
            position.y + t * riseHeight,
            position.z + driftZ + windOffset.y
          );

          vec4 mvPosition = modelViewMatrix * vec4(worldPos, 1.0);
          float camDist = -mvPosition.z;

          float lifeFade = smoothstep(0.0, 0.16, t) * pow(1.0 - smoothstep(0.32, 1.0, t), 1.35);
          float distFade = (1.0 - smoothstep(40.0, 92.0, camDist)) * smoothstep(0.55, 1.6, camDist);
          vAlpha = lifeFade * distFade * 0.34;

          gl_Position = projectionMatrix * mvPosition;
          float expand = mix(72.0, 290.0, pow(t, 0.78));
          float pointSz = (expand * sizeScale * uPixelScale) / max(camDist, 1.0);
          gl_PointSize = clamp(pointSz, 3.0, 42.0 * uPixelScale);
        }
      `,
      fragmentShader: `
        uniform vec3 uLightTint;
        uniform float uRitualGlow;

        varying float vAlpha;
        varying float vWarmShift;
        varying float vPhase;
        varying float vAge;

        float smokeHash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float smokeNoise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(smokeHash(i), smokeHash(i + vec2(1.0, 0.0)), u.x),
            mix(smokeHash(i + vec2(0.0, 1.0)), smokeHash(i + vec2(1.0, 1.0)), u.x),
            u.y
          );
        }

        float smokeFbm(vec2 p) {
          float v = 0.0;
          float a = 0.52;
          mat2 rot = mat2(0.80, -0.60, 0.60, 0.80);
          for (int i = 0; i < 3; i++) {
            v += a * smokeNoise(p);
            p = rot * p * 2.08 + vec2(1.7, 3.1);
            a *= 0.48;
          }
          return v;
        }

        void main() {
          if (vAlpha <= 0.004) discard;
          vec2 uv = gl_PointCoord - vec2(0.5);
          float r = length(uv) * 2.0;
          if (r > 1.0) discard;

          // Curl-like wispy distortion so smoke trails look organic and feathery, never star-shaped
          float ca = cos(vPhase + vAge * 1.4);
          float sa = sin(vPhase + vAge * 1.4);
          vec2 p = mat2(ca, -sa, sa, ca) * (uv * 3.6) + vec2(vPhase * 0.85, -vAge * 1.65);
          float qx = smokeFbm(p + vec2(0.4, 1.2));
          float qy = smokeFbm(p + vec2(3.7, 2.1));
          float wispNoise = smokeFbm(p + vec2(qx, qy) * 1.45);

          float radialMask = pow(smoothstep(1.0, 0.08, r), 1.85);
          float wispDensity = smoothstep(0.24, 0.82, wispNoise * 0.88 + (1.0 - r) * 0.28);
          float alpha = clamp(radialMask * wispDensity * vAlpha, 0.0, 0.56);
          if (alpha <= 0.004) discard;

          vec3 sandalMist = vec3(0.85, 0.84, 0.82);
          vec3 warmAmberMist = vec3(0.95, 0.88, 0.77);
          vec3 baseSmoke = mix(sandalMist, warmAmberMist, vWarmShift * 0.65 + uRitualGlow * 0.35);
          vec3 litSmoke = baseSmoke * mix(vec3(0.84), uLightTint, 0.45);
          gl_FragColor = vec4(litSmoke, alpha);
        }
      `,
    });

    this.points = new THREE.Points(geometry, this.material);
    this.points.name = 'LumbiniIncenseSmoke';
    this.points.frustumCulled = false;
    this.points.renderOrder = 4;
    this.points.userData.nonCollidable = true;
  }

  public update(
    elapsed: number,
    windX: number,
    windZ: number,
    pixelScale: number,
    sunColorHex: string,
    ritualGlow = 0,
  ): void {
    this.material.uniforms.uTime.value = elapsed;
    (this.material.uniforms.uWind.value as THREE.Vector2).set(windX, windZ);
    this.material.uniforms.uPixelScale.value = pixelScale;
    (this.material.uniforms.uLightTint.value as THREE.Color)
      .set('#f4efe6')
      .lerp(new THREE.Color(sunColorHex), 0.28);
    this.material.uniforms.uRitualGlow.value = Math.max(0, Math.min(1, ritualGlow));
  }

  public dispose(): void {
    this.points.geometry.dispose();
    this.material.dispose();
  }
}

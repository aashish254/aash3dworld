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

          // Laminar ribbon near brazier -> gentle helical curl -> soft wind dispersion aloft
          float curlEnv = smoothstep(0.06, 0.85, t);
          float angle = t * swirlFreq * 6.283185 + vPhase;
          float driftX = cos(angle) * swirlRadius * curlEnv + sin(uTime * 0.45 + vPhase) * 0.12 * curlEnv;
          float driftZ = sin(angle * 0.92) * swirlRadius * curlEnv + cos(uTime * 0.39 + vPhase * 1.3) * 0.12 * curlEnv;
          vec2 windOffset = uWind * pow(t, 1.35) * 1.15;

          vec3 worldPos = vec3(
            position.x + driftX + windOffset.x,
            position.y + t * riseHeight,
            position.z + driftZ + windOffset.y
          );

          vec4 mvPosition = modelViewMatrix * vec4(worldPos, 1.0);
          float camDist = -mvPosition.z;

          float lifeFade = smoothstep(0.0, 0.14, t) * (1.0 - smoothstep(0.52, 1.0, t));
          float distFade = (1.0 - smoothstep(40.0, 92.0, camDist)) * smoothstep(0.55, 1.6, camDist);
          vAlpha = lifeFade * distFade * 0.46;

          gl_Position = projectionMatrix * mvPosition;
          float expand = mix(105.0, 325.0, pow(t, 0.72));
          float pointSz = (expand * sizeScale * uPixelScale) / max(camDist, 1.0);
          gl_PointSize = clamp(pointSz, 3.2, 46.0 * uPixelScale);
        }
      `,
      fragmentShader: `
        uniform vec3 uLightTint;
        uniform float uRitualGlow;

        varying float vAlpha;
        varying float vWarmShift;
        varying float vPhase;
        varying float vAge;

        void main() {
          if (vAlpha <= 0.006) discard;
          vec2 uv = gl_PointCoord - vec2(0.5);
          float r = length(uv) * 2.0;
          if (r > 1.0) discard;

          float ang = atan(uv.y, uv.x) + vPhase + vAge * 2.4;
          float wisp = 0.78 + 0.22 * sin(ang * 2.0 + r * 4.5) * cos(ang * 3.0 - vAge * 3.1);
          float radial = pow(smoothstep(1.0, 0.04, r), 1.75);
          float alpha = clamp(radial * wisp * vAlpha, 0.0, 0.68);
          if (alpha <= 0.006) discard;

          vec3 sandalMist = vec3(0.84, 0.83, 0.81);
          vec3 warmAmberMist = vec3(0.96, 0.88, 0.76);
          vec3 baseSmoke = mix(sandalMist, warmAmberMist, vWarmShift * 0.65 + uRitualGlow * 0.35);
          vec3 litSmoke = baseSmoke * mix(vec3(0.82), uLightTint, 0.45);
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

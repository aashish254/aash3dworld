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
        uniform float uRitualGlow;

        varying float vAlpha;
        varying float vWarmShift;
        varying float vRot;
        varying float vAge;

        void main() {
          float phase = aMotionA.x;
          float speed = aMotionA.y;
          float riseHeight = aMotionA.z;
          float swirlRadius = aMotionA.w;

          float swirlFreq = aMotionB.x;
          float sizeScale = aMotionB.y;
          vWarmShift = aMotionB.z;

          float t = fract(uTime * speed + phase);
          vAge = t;
          float phaseRad = phase * 6.283185;
          vRot = phaseRad + t * 2.15;

          // Match Janaki Mandir's fine sinuous vertical ribbon rising from the bronze braziers
          float spread = 0.025 + pow(t, 1.15) * swirlRadius;
          float swirlT = uTime * 1.18 + phaseRad + t * swirlFreq * 3.14159;
          vec2 curl = vec2(
            sin(swirlT) + 0.44 * sin(swirlT * 1.9 + phaseRad),
            cos(swirlT * 0.92 + 0.7) + 0.44 * cos(swirlT * 1.7 - phaseRad * 0.65)
          ) * spread * 0.56;
          vec2 windOffset = uWind * pow(t, 1.32) * 0.92;

          vec3 worldPos = vec3(
            position.x + curl.x + windOffset.x,
            position.y + pow(t, 0.86) * riseHeight,
            position.z + curl.y + windOffset.y
          );

          vec4 mvPosition = modelViewMatrix * vec4(worldPos, 1.0);
          float camDist = -mvPosition.z;

          float fadeIn = smoothstep(0.0, 0.12, t);
          float fadeOut = pow(1.0 - smoothstep(0.18, 1.0, t), 1.38);
          float nearFade = smoothstep(0.75, 2.0, camDist);
          float farFade = 1.0 - smoothstep(30.0, 68.0, camDist);
          vAlpha = fadeIn * fadeOut * nearFade * farFade * (0.16 + 0.12 * uRitualGlow);

          gl_Position = projectionMatrix * mvPosition;
          float worldPx = mix(54.0, 168.0, pow(t, 0.78)) * sizeScale * uPixelScale;
          gl_PointSize = clamp(worldPx / max(camDist, 1.0), 2.0, 44.0 * uPixelScale);
        }
      `,
      fragmentShader: `
        uniform vec3 uLightTint;
        uniform float uRitualGlow;

        varying float vAlpha;
        varying float vWarmShift;
        varying float vRot;
        varying float vAge;

        void main() {
          if (vAlpha <= 0.004) discard;
          vec2 uv = gl_PointCoord - vec2(0.5);
          float c = cos(vRot);
          float s = sin(vRot);
          vec2 rotUv = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);

          // Fine sinuous ribbon tendril with domain warp matching Janaki Temple incense shader
          vec2 q = vec2(rotUv.x * 1.54, rotUv.y * 0.74);
          q += 0.11 * vec2(
            sin(q.y * 9.5 + vAge * 6.5),
            cos(q.x * 8.2 - vAge * 5.2)
          );

          float dist = length(q) * 2.0;
          if (dist > 0.94) discard;
          float radial = pow(smoothstep(0.92, 0.05, dist), 1.55);
          float filament = 0.56 + 0.44 * sin(q.x * 11.5 + q.y * 7.5 + vAge * 5.4) * cos(q.y * 9.5 - q.x * 6.0 - vAge * 4.3);

          vec3 coolWisp = vec3(0.74, 0.80, 0.87);
          vec3 warmWisp = vec3(1.0, 0.86, 0.64);
          float warmth = (1.0 - smoothstep(0.0, 0.55, vAge)) * (0.35 + uRitualGlow * 0.65);
          vec3 baseSmoke = mix(coolWisp, warmWisp, clamp(warmth * 0.78 + vWarmShift * 0.22, 0.0, 1.0));
          vec3 litSmoke = baseSmoke * mix(vec3(0.86), uLightTint, 0.35);

          float alpha = clamp(radial * filament * vAlpha, 0.0, 0.24);
          if (alpha < 0.004) discard;
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

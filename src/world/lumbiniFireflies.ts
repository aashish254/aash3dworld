import * as THREE from 'three';
import {
  type LumbiniFireflyPlacement,
  generateLumbiniFireflyPlacements,
} from './worldLogic';

export class LumbiniFireflySystem {
  public readonly points: THREE.Points;
  public readonly material: THREE.ShaderMaterial;
  public readonly count: number;
  public readonly placements: LumbiniFireflyPlacement[];

  constructor(count = 260, seed = 202611) {
    this.placements = generateLumbiniFireflyPlacements(count, seed);
    this.count = this.placements.length;

    const positions = new Float32Array(this.count * 3);
    const seeds = new Float32Array(this.count * 4);

    for (let i = 0; i < this.count; i++) {
      const f = this.placements[i];
      positions[i * 3] = f.x;
      positions[i * 3 + 1] = f.y;
      positions[i * 3 + 2] = f.z;

      seeds[i * 4] = f.phase;
      seeds[i * 4 + 1] = f.speed;
      seeds[i * 4 + 2] = f.scale;
      seeds[i * 4 + 3] = f.warmShift;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 0 },
        uPixelScale: { value: 1 },
      },
      vertexShader: `
        attribute vec4 aSeed;
        uniform float uTime;
        uniform float uIntensity;
        uniform float uPixelScale;

        varying float vAlpha;
        varying float vWarmShift;

        void main() {
          float phase = aSeed.x;
          float speed = aSeed.y;
          float sizeScale = aSeed.z;
          vWarmShift = aSeed.w;

          // Organic Lissajous hover above the pond water & lotus pads
          vec3 drift = vec3(
            sin(uTime * speed + phase) * 0.95 + cos(uTime * speed * 0.53 + phase * 1.7) * 0.35,
            sin(uTime * speed * 1.35 + phase * 1.3) * 0.36 + cos(uTime * speed * 0.72 + phase) * 0.16,
            cos(uTime * speed * 0.88 + phase * 1.1) * 0.95 + sin(uTime * speed * 0.47 + phase * 2.1) * 0.35
          );

          vec3 worldPos = position + drift;
          vec4 mvPosition = modelViewMatrix * vec4(worldPos, 1.0);
          float camDist = -mvPosition.z;

          // Individual bioluminescent blink envelope
          float blinkWave = 0.5 + 0.5 * sin(uTime * (1.25 + speed * 0.95) + phase * 3.7);
          float pulse = 0.22 + 0.78 * pow(blinkWave, 2.6);

          float distFade = (1.0 - smoothstep(78.0, 145.0, camDist)) * smoothstep(0.6, 2.2, camDist);
          vAlpha = uIntensity * pulse * distFade;

          gl_Position = projectionMatrix * mvPosition;
          float pointSz = (145.0 * sizeScale * (0.72 + 0.42 * pulse) * uPixelScale) / max(camDist, 1.0);
          gl_PointSize = clamp(pointSz, 2.8, 32.0 * uPixelScale);
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        varying float vWarmShift;

        void main() {
          if (vAlpha <= 0.008) discard;
          vec2 uv = gl_PointCoord - vec2(0.5);
          float d = length(uv) * 2.0;
          if (d > 1.0) discard;

          float core = smoothstep(0.42, 0.0, d);
          float halo = pow(smoothstep(1.0, 0.05, d), 2.1);

          vec3 limeGlow = vec3(0.75, 0.96, 0.36);
          vec3 goldGlow = vec3(0.99, 0.88, 0.32);
          vec3 outerColor = mix(limeGlow, goldGlow, vWarmShift);
          vec3 coreColor = vec3(1.0, 0.99, 0.86);
          vec3 color = mix(outerColor, coreColor, core * 0.82);

          float alpha = clamp((halo * 0.78 + core * 0.55) * vAlpha, 0.0, 1.0);
          gl_FragColor = vec4(color, alpha);
        }
      `,
    });

    this.points = new THREE.Points(geometry, this.material);
    this.points.name = 'LumbiniNightFireflies';
    this.points.frustumCulled = false;
    this.points.renderOrder = 3;
    this.points.visible = false;
    this.points.userData.nonCollidable = true;
  }

  public update(elapsed: number, intensity: number, pixelScale: number): void {
    const clamped = Math.max(0, Math.min(1, intensity));
    this.points.visible = clamped > 0.01;
    this.material.uniforms.uTime.value = elapsed;
    this.material.uniforms.uIntensity.value = clamped;
    this.material.uniforms.uPixelScale.value = pixelScale;
  }

  public dispose(): void {
    this.points.geometry.dispose();
    this.material.dispose();
  }
}

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  createBotanicalLotusTextures,
  createRoundedSpoonLotusPetalGeo,
} from './lumbiniBuddhaSculpt';

export const URLI_CENTER_DIYA_LOCAL: readonly [number, number] = [0.0, 0.0];
export const URLI_FLOATING_DIYA_COORDS: ReadonlyArray<readonly [number, number]> = [
  [-0.20, -0.14],
  [0.21, -0.13],
];
export const URLI_LOTUS_CLUSTER_COORDS: ReadonlyArray<{
  x: number;
  z: number;
  scale: number;
  yaw: number;
  hasBuddyPad: boolean;
}> = [
  { x: -0.21, z: 0.14, scale: 1.0, yaw: 0.4, hasBuddyPad: true },
  { x: 0.21, z: 0.11, scale: 0.95, yaw: 2.35, hasBuddyPad: false },
  { x: 0.01, z: -0.23, scale: 0.92, yaw: 4.15, hasBuddyPad: true },
];
export const URLI_BUD_COORDS: ReadonlyArray<{
  x: number;
  z: number;
  height: number;
  tiltX: number;
  yaw: number;
}> = [
  { x: -0.09, z: 0.25, height: 0.052, tiltX: 0.16, yaw: 0.8 },
  { x: 0.14, z: -0.02, height: 0.044, tiltX: -0.14, yaw: 2.9 },
];
export const URLI_FLOATING_PETAL_COORDS: ReadonlyArray<{
  x: number;
  z: number;
  yaw: number;
  scale: number;
}> = [
  { x: -0.11, z: -0.04, yaw: 0.7, scale: 0.85 },
  { x: 0.09, z: 0.21, yaw: 2.2, scale: 0.78 },
  { x: -0.28, z: -0.01, yaw: 4.1, scale: 0.72 },
];

export interface UrliFlameInstance {
  rig: THREE.Group;
  mantleUniforms: { uTime: { value: number }; uIntensity: { value: number }; uPhase: { value: number } };
  haloUniforms: { uTime: { value: number }; uIntensity: { value: number } };
  baseScale: number;
  phase: number;
}

export interface UrliOfferingBowlBuild {
  group: THREE.Group;
  waterUniforms: {
    uTime: { value: number };
    uSkyColor: { value: THREE.Color };
    uFlameIntensity: { value: number };
  };
  flames: UrliFlameInstance[];
}

export interface UrliPedestalMaterials {
  whiteMarbleMat: THREE.Material;
  tealMarbleMat: THREE.Material;
  weatheredStoneMat: THREE.Material;
  agedBronzeMat: THREE.Material;
  brightBrassMat: THREE.Material;
}

/**
 * Circular disc geometry with clean planar XZ UVs (0..1) and upward normals (0, 1, 0),
 * eliminating the polar UV distortion stripes produced by THREE.CircleGeometry.
 */
export function createUrliWaterDiscGeo(
  radius = 0.432,
  rings = 14,
  segs = 48,
): THREE.BufferGeometry {
  const pos: number[] = [0, 0, 0];
  const norm: number[] = [0, 1, 0];
  const uv: number[] = [0.5, 0.5];
  const idx: number[] = [];

  for (let r = 1; r <= rings; r++) {
    const rad = (r / rings) * radius;
    for (let s = 0; s <= segs; s++) {
      const a = (s / segs) * Math.PI * 2;
      const x = Math.cos(a) * rad;
      const z = Math.sin(a) * rad;
      pos.push(x, 0, z);
      norm.push(0, 1, 0);
      uv.push(0.5 + x / (radius * 2), 0.5 + z / (radius * 2));
    }
  }

  const stride = segs + 1;
  // Center triangle fan (CCW viewed from +Y -> right-handed +Y normal)
  for (let s = 0; s < segs; s++) {
    idx.push(0, 1 + s + 1, 1 + s);
  }
  // Concentric quad rings
  for (let r = 1; r < rings; r++) {
    const row0 = 1 + (r - 1) * stride;
    const row1 = 1 + r * stride;
    for (let s = 0; s < segs; s++) {
      const a = row0 + s;
      const b = row0 + s + 1;
      const c = row1 + s;
      const d = row1 + s + 1;
      idx.push(a, b, d, a, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(norm, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  return geo;
}

/**
 * Undulating radial-veined notched Nelumbo lily pad geometry with planar radial UVs
 * and gently upturned rippled outer edge.
 */
export function createUrliSculptedLilyPadGeo(
  radius = 0.106,
  segs = 24,
): THREE.BufferGeometry {
  const notchGap = 0.27;
  const pos: number[] = [0, 0.0018, 0];
  const uv: number[] = [0.5, 0.5];
  const idx: number[] = [];

  const ringRadii = [0.42, 0.78, 1.0];
  const ringY = [0.0005, 0.0018, 0.0055];

  for (let ring = 0; ring < ringRadii.length; ring++) {
    const r = radius * ringRadii[ring];
    for (let i = 0; i <= segs; i++) {
      const a = notchGap * 0.5 + (i / segs) * (Math.PI * 2 - notchGap);
      const edgeRipple = ring === 2 ? Math.sin(a * 6.0) * 0.0032 : Math.sin(a * 4.0) * 0.0012;
      const yWave = ring === 2 ? Math.cos(a * 5.0) * 0.0016 : 0;
      const x = Math.cos(a) * (r + edgeRipple);
      const z = Math.sin(a) * (r + edgeRipple);
      pos.push(x, ringY[ring] + yWave, z);
      uv.push(0.5 + x / (radius * 2.04), 0.5 + z / (radius * 2.04));
    }
  }

  const stride = segs + 1;
  for (let i = 0; i < segs; i++) {
    idx.push(0, 1 + i + 1, 1 + i);
  }
  for (let ring = 0; ring < 2; ring++) {
    const r0 = 1 + ring * stride;
    const r1 = 1 + (ring + 1) * stride;
    for (let i = 0; i < segs; i++) {
      const a = r0 + i;
      const b = r0 + i + 1;
      const c = r1 + i;
      const d = r1 + i + 1;
      idx.push(a, b, d, a, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Organic teardrop oil-lamp flame LatheGeometry with rounded glowing belly and fine tapered tip.
 */
export function createUrliFlameTeardropGeo(
  maxRadius = 0.017,
  height = 0.084,
): THREE.BufferGeometry {
  const pts: THREE.Vector2[] = [];
  const steps = 14;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Rounded teardrop: swells quickly in lower 25%, tapers smoothly to fine point at t=1
    const envelope = Math.sin(Math.pow(t, 0.58) * Math.PI) * Math.pow(1 - t * 0.65, 0.55);
    const r = i === 0 || i === steps ? 0 : Math.max(0.0004, maxRadius * envelope * 1.18);
    pts.push(new THREE.Vector2(r, t * height));
  }
  const geo = new THREE.LatheGeometry(pts, 20);
  geo.computeVertexNormals();
  return geo;
}

function createUrliSeedPodTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 62);
  grad.addColorStop(0.0, '#eab949');
  grad.addColorStop(0.68, '#ca9122');
  grad.addColorStop(1.0, '#8d5b10');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  // Seed alveoli dimples
  for (let ring = 0; ring < 2; ring++) {
    const cnt = ring === 0 ? 6 : 12;
    const rad = ring === 0 ? 19 : 41;
    for (let i = 0; i < cnt; i++) {
      const a = (i / cnt) * Math.PI * 2 + ring * 0.25;
      const sx = 64 + Math.cos(a) * rad;
      const sy = 64 + Math.sin(a) * rad;
      ctx.fillStyle = '#5f3b0a';
      ctx.beginPath();
      ctx.arc(sx, sy, 5.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#a26b17';
      ctx.beginPath();
      ctx.arc(sx - 1.0, sy - 1.0, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createUrliWaterShaderMaterial(
  sharedUniforms: {
    uTime: { value: number };
    uSkyColor: { value: THREE.Color };
    uFlameIntensity: { value: number };
  },
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: sharedUniforms.uTime,
      uSkyColor: sharedUniforms.uSkyColor,
      uFlameIntensity: sharedUniforms.uFlameIntensity,
    },
    vertexShader: `
      varying vec2 vBowlXZ;
      varying vec3 vWorldPos;
      void main() {
        vBowlXZ = position.xz;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uSkyColor;
      uniform float uFlameIntensity;
      varying vec2 vBowlXZ;
      varying vec3 vWorldPos;

      float radialWave(vec2 p, vec2 c, float freq, float speed, float amp, float decay) {
        vec2 d = p - c;
        float dist = length(d) + 0.0001;
        return sin(dist * freq - uTime * speed) * amp * exp(-dist * decay);
      }

      float waterHeight(vec2 p) {
        float h = 0.0;
        // Concentric capillary ripples around center Akhanda Diya & 2 floating diyas
        h += radialWave(p, vec2(0.0, 0.0), 46.0, 2.2, 0.0022, 4.0);
        h += radialWave(p, vec2(-0.20, -0.14), 54.0, 2.6, 0.0017, 5.5);
        h += radialWave(p, vec2(0.21, -0.13), 52.0, 2.4, 0.0017, 5.5);
        // Gentle meniscus ripples around the 3 floating lotus pads
        h += radialWave(p, vec2(-0.21, 0.14), 38.0, 1.6, 0.0012, 6.2);
        h += radialWave(p, vec2(0.21, 0.11), 40.0, 1.8, 0.0011, 6.2);
        h += radialWave(p, vec2(0.01, -0.23), 36.0, 1.5, 0.0011, 6.2);
        // Subtle organic ambient wind micro-ripples
        h += sin(dot(p, vec2(19.0, 13.0)) + uTime * 1.4) * 0.00055;
        h += cos(dot(p, vec2(-15.0, 23.0)) - uTime * 1.1) * 0.00045;
        return h;
      }

      vec3 flameWaterGlow(vec2 p, vec2 c, vec3 N, vec3 V, float radius, float flicker) {
        vec2 toFlame = p - c;
        float d = length(toFlame);
        // Distort reflection streak along wave normal + view direction toward camera
        vec2 viewDirXZ = normalize(V.xz + vec2(0.0001));
        vec2 stretched = toFlame - viewDirXZ * dot(toFlame, viewDirXZ) * 0.42 + N.xz * 0.16;
        float sd = length(stretched);
        float glow = exp(-sd * sd / (radius * radius)) * 0.85;
        float causticRing = smoothstep(radius * 1.35, 0.0, sd) * (0.65 + 0.35 * sin(d * 68.0 - uTime * 3.4));
        float glint = pow(max(0.0, 1.0 - sd / (radius * 0.55)), 3.2) * (0.75 + 0.25 * max(0.0, N.x * 4.0 + N.z * 4.0));
        vec3 warmAmber = mix(vec3(0.95, 0.42, 0.08), vec3(1.0, 0.82, 0.36), clamp(glint + glow * 0.5, 0.0, 1.0));
        return warmAmber * (glow * 0.55 + causticRing * 0.22 + glint * 0.72) * flicker;
      }

      void main() {
        vec2 p = vBowlXZ;
        float eps = 0.003;
        float hC = waterHeight(p);
        float hX = waterHeight(p + vec2(eps, 0.0));
        float hZ = waterHeight(p + vec2(0.0, eps));
        vec3 N = normalize(vec3(-(hX - hC) / eps, 1.0, -(hZ - hC) / eps));

        vec3 V = normalize(cameraPosition - vWorldPos);
        float r = length(p);

        // Deep dark sacred emerald-jade water absorption + subtle warm hammered bronze inner wall bounce
        vec3 deepWater = vec3(0.014, 0.068, 0.072);
        vec3 midWater = vec3(0.028, 0.125, 0.122);
        vec3 bronzeRimBounce = vec3(0.24, 0.13, 0.055);
        float rimZone = smoothstep(0.26, 0.425, r);
        vec3 baseCol = mix(deepWater, midWater, smoothstep(0.05, 0.32, r));
        baseCol = mix(baseCol, bronzeRimBounce, rimZone * 0.62);

        // Contact AO & meniscus darkening under floating pads, floating diyas, center stem & rim wall
        float ao = 1.0;
        ao *= mix(0.45, 1.0, smoothstep(0.032, 0.075, r)); // center stem
        ao *= mix(0.42, 1.0, smoothstep(0.065, 0.125, length(p - vec2(-0.21, 0.14))));
        ao *= mix(0.42, 1.0, smoothstep(0.062, 0.120, length(p - vec2(0.21, 0.11))));
        ao *= mix(0.42, 1.0, smoothstep(0.060, 0.118, length(p - vec2(0.01, -0.23))));
        ao *= mix(0.48, 1.0, smoothstep(0.045, 0.088, length(p - vec2(-0.20, -0.14))));
        ao *= mix(0.48, 1.0, smoothstep(0.045, 0.088, length(p - vec2(0.21, -0.13))));
        ao *= mix(1.0, 0.46, smoothstep(0.395, 0.432, r)); // outer bronze bowl meniscus

        // Soft sky Fresnel reflection tinted smoothly with world sky
        float ndotv = clamp(dot(N, V), 0.0, 1.0);
        float fresnel = 0.04 + 0.78 * pow(1.0 - ndotv, 3.6);
        vec3 skyRefl = clamp(uSkyColor * 0.78 + vec3(0.08, 0.13, 0.16), 0.04, 0.75);
        vec3 col = mix(baseCol * ao, skyRefl, fresnel * 0.72);

        // Warm golden-amber diya flame reflections & water shimmer
        float f0 = 0.92 + 0.08 * sin(uTime * 6.3 + 0.4);
        float f1 = 0.91 + 0.09 * sin(uTime * 7.1 + 2.1);
        float f2 = 0.91 + 0.09 * cos(uTime * 6.7 + 4.3);
        vec3 flameRefl = vec3(0.0);
        flameRefl += flameWaterGlow(p, vec2(0.0, 0.0), N, V, 0.155, f0) * 1.15;
        flameRefl += flameWaterGlow(p, vec2(-0.20, -0.14), N, V, 0.115, f1) * 0.95;
        flameRefl += flameWaterGlow(p, vec2(0.21, -0.13), N, V, 0.115, f2) * 0.95;
        col += flameRefl * uFlameIntensity;

        // Subtle crisp wave-crest moonlight / sky specular highlight
        vec3 Lsky = normalize(vec3(-0.35, 0.85, 0.4));
        vec3 H = normalize(Lsky + V);
        float spec = pow(max(dot(N, H), 0.0), 42.0) * 0.24;
        col += skyRefl * spec;

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}

function createUrliFlameOuterShaderMaterial(
  sharedUniforms: { uTime: { value: number }; uIntensity: { value: number }; uPhase: { value: number } },
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: sharedUniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
    vertexShader: `
      uniform float uTime;
      uniform float uPhase;
      varying float vH;
      varying vec3 vNormalV;
      varying vec3 vViewPos;
      void main() {
        vH = clamp(uv.y, 0.0, 1.0);
        vec3 p = position;
        // Organic gentle candlelight sway strongest near flame tip
        float bend = vH * vH;
        p.x += sin(uTime * 5.8 + uPhase + vH * 4.2) * 0.0042 * bend;
        p.z += cos(uTime * 4.9 + uPhase * 1.3 + vH * 3.8) * 0.0036 * bend;
        p.y *= 0.96 + 0.07 * sin(uTime * 7.4 + uPhase * 2.1);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vViewPos = -mv.xyz;
        vNormalV = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uIntensity;
      uniform float uPhase;
      varying float vH;
      varying vec3 vNormalV;
      varying vec3 vViewPos;
      void main() {
        vec3 V = normalize(vViewPos);
        float ndotv = clamp(abs(dot(normalize(vNormalV), V)), 0.0, 1.0);
        float rimSoft = pow(ndotv, 0.82);

        // Authentic oil-lamp thermal gradient: faint blue base -> hot gold heart -> rich saffron -> amber tip
        vec3 blueBase = vec3(0.28, 0.52, 1.0);
        vec3 goldHeart = vec3(1.0, 0.88, 0.44);
        vec3 saffronMid = vec3(1.0, 0.50, 0.08);
        vec3 crimsonTip = vec3(0.92, 0.22, 0.02);

        vec3 col = mix(blueBase, goldHeart, smoothstep(0.02, 0.24, vH));
        col = mix(col, saffronMid, smoothstep(0.32, 0.68, vH));
        col = mix(col, crimsonTip, smoothstep(0.72, 1.0, vH));

        float tipFade = smoothstep(0.0, 0.08, vH) * (1.0 - smoothstep(0.68, 1.0, vH));
        float flicker = 0.92 + 0.08 * sin(uTime * 8.2 + uPhase * 1.7);
        float alpha = rimSoft * tipFade * 0.86 * clamp(uIntensity, 0.45, 1.45);
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(col * 1.18 * flicker, alpha);
      }
    `,
  });
}

function createUrliFlameHaloMaterial(
  sharedUniforms: { uTime: { value: number }; uIntensity: { value: number } },
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: sharedUniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        float worldScale = length(vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]));
        vec4 mvCenter = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        mvCenter.xy += position.xy * worldScale;
        gl_Position = projectionMatrix * mvCenter;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uIntensity;
      varying vec2 vUv;
      void main() {
        vec2 c = vUv - 0.5;
        float d = length(c) * 2.0;
        if (d > 1.0) discard;
        float falloff = exp(-d * d * 5.2) * (1.0 - smoothstep(0.65, 1.0, d));
        float pulse = 0.94 + 0.06 * sin(uTime * 6.8);
        vec3 glowCol = mix(vec3(1.0, 0.46, 0.08), vec3(1.0, 0.82, 0.36), exp(-d * d * 8.0));
        gl_FragColor = vec4(glowCol, falloff * 0.34 * pulse * clamp(uIntensity, 0.5, 1.35));
      }
    `,
  });
}

export class UrliOfferingBowlSuite {
  private readonly footingGeo: THREE.BufferGeometry;
  private readonly plinthGeo: THREE.BufferGeometry;
  private readonly steppedGeo: THREE.BufferGeometry;
  private readonly tealCollarGeo: THREE.BufferGeometry;
  private readonly neckGeo: THREE.BufferGeometry;
  private readonly lotusBaseGeo: THREE.BufferGeometry;
  private readonly calyxCollarGeo: THREE.BufferGeometry;

  private readonly bowlGeo: THREE.BufferGeometry;
  private readonly bowlBandGeo: THREE.BufferGeometry;
  private readonly bowlRimCollarGeo: THREE.BufferGeometry;
  private readonly bowlHandleGeo: THREE.BufferGeometry;
  private readonly bowlWaterGeo: THREE.BufferGeometry;

  private readonly centerDiyaStandGeo: THREE.BufferGeometry;
  private readonly centerOilPoolGeo: THREE.BufferGeometry;
  private readonly floatingDiyaCupGeo: THREE.BufferGeometry;
  private readonly floatingDiyaSpoutGeo: THREE.BufferGeometry;
  private readonly floatingOilPoolGeo: THREE.BufferGeometry;
  private readonly wickGeo: THREE.BufferGeometry;
  private readonly wickEmberGeo: THREE.BufferGeometry;
  private readonly flameCoreGeo: THREE.BufferGeometry;
  private readonly flameOuterGeo: THREE.BufferGeometry;
  private readonly flameHaloGeo: THREE.BufferGeometry;

  private readonly lilyPadGeo: THREE.BufferGeometry;
  private readonly lotusCalyxGeo: THREE.BufferGeometry;
  private readonly lotusCorollaGeo: THREE.BufferGeometry;
  private readonly lotusPodGeo: THREE.BufferGeometry;
  private readonly lotusStamenGeo: THREE.BufferGeometry;
  private readonly lotusBudPetalGeo: THREE.BufferGeometry;
  private readonly budStemGeo: THREE.BufferGeometry;
  private readonly loosePetalGeo: THREE.BufferGeometry;

  private readonly gheeOilMat: THREE.MeshPhysicalMaterial;
  private readonly wickMat: THREE.MeshStandardMaterial;
  private readonly wickEmberMat: THREE.MeshStandardMaterial;
  private readonly flameCoreMat: THREE.MeshStandardMaterial;
  private readonly lilyPadMat: THREE.MeshPhysicalMaterial;
  private readonly sepalMat: THREE.MeshStandardMaterial;
  private readonly lotusCorollaMat: THREE.MeshPhysicalMaterial;
  private readonly lotusBudMat: THREE.MeshPhysicalMaterial;
  private readonly seedPodMat: THREE.MeshStandardMaterial;
  private readonly stamenAntherMat: THREE.MeshStandardMaterial;

  constructor(anisotropy = 4) {
    // Pedestal & Urli Vessel
    this.footingGeo = new THREE.CylinderGeometry(0.55, 0.64, 0.82, 24);
    this.plinthGeo = new THREE.CylinderGeometry(0.48, 0.54, 0.12, 24);
    this.steppedGeo = new THREE.CylinderGeometry(0.39, 0.45, 0.12, 24);
    this.tealCollarGeo = new THREE.CylinderGeometry(0.33, 0.36, 0.08, 24);
    this.neckGeo = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.0, 0.0),
        new THREE.Vector2(0.32, 0.0),
        new THREE.Vector2(0.27, 0.035),
        new THREE.Vector2(0.22, 0.075),
        new THREE.Vector2(0.25, 0.115),
        new THREE.Vector2(0.31, 0.145),
        new THREE.Vector2(0.0, 0.145),
      ],
      24,
    );
    this.lotusBaseGeo = createRoundedSpoonLotusPetalGeo(0.115, 0.19, 0.026);
    this.calyxCollarGeo = new THREE.TorusGeometry(0.245, 0.016, 10, 28);
    this.calyxCollarGeo.rotateX(Math.PI / 2);

    this.bowlGeo = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.0, 0.0),
        new THREE.Vector2(0.22, 0.015),
        new THREE.Vector2(0.35, 0.07),
        new THREE.Vector2(0.49, 0.18),
        new THREE.Vector2(0.54, 0.28),
        new THREE.Vector2(0.58, 0.32),
        new THREE.Vector2(0.55, 0.35),
        new THREE.Vector2(0.47, 0.32),
        new THREE.Vector2(0.42, 0.27),
        new THREE.Vector2(0.24, 0.11),
        new THREE.Vector2(0.0, 0.095),
      ],
      36,
    );
    this.bowlBandGeo = new THREE.TorusGeometry(0.525, 0.014, 10, 36);
    this.bowlBandGeo.rotateX(Math.PI / 2);
    this.bowlRimCollarGeo = new THREE.TorusGeometry(0.562, 0.014, 10, 36);
    this.bowlRimCollarGeo.rotateX(Math.PI / 2);
    this.bowlHandleGeo = new THREE.TorusGeometry(0.055, 0.014, 10, 20);
    this.bowlWaterGeo = createUrliWaterDiscGeo(0.432, 14, 48);

    // Turned-Brass Center Akhanda Diya Stand (footed base in water -> knopped baluster -> fluted oil saucer)
    this.centerDiyaStandGeo = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.0, -0.12),
        new THREE.Vector2(0.052, -0.12),
        new THREE.Vector2(0.044, -0.095),
        new THREE.Vector2(0.025, -0.06),
        new THREE.Vector2(0.036, 0.002), // water-line beaded collar
        new THREE.Vector2(0.020, 0.016),
        new THREE.Vector2(0.015, 0.045),
        new THREE.Vector2(0.028, 0.056), // baluster knop
        new THREE.Vector2(0.015, 0.068),
        new THREE.Vector2(0.026, 0.082),
        new THREE.Vector2(0.064, 0.098), // flared saucer lip
        new THREE.Vector2(0.057, 0.104), // rolled brass rim
        new THREE.Vector2(0.045, 0.089), // inner oil basin bevel
        new THREE.Vector2(0.0, 0.084),
      ],
      24,
    );
    this.centerOilPoolGeo = new THREE.CylinderGeometry(0.043, 0.036, 0.006, 20);

    // Floating Spun-Brass Katori Diya + Spout Lip
    this.floatingDiyaCupGeo = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.0, 0.0),
        new THREE.Vector2(0.022, 0.002),
        new THREE.Vector2(0.042, 0.016),
        new THREE.Vector2(0.047, 0.029),
        new THREE.Vector2(0.041, 0.032),
        new THREE.Vector2(0.032, 0.020),
        new THREE.Vector2(0.0, 0.016),
      ],
      24,
    );
    const spoutPts = [
      new THREE.Vector3(0, 0.018, 0.024),
      new THREE.Vector3(0, 0.025, 0.043),
      new THREE.Vector3(0, 0.032, 0.054),
    ];
    this.floatingDiyaSpoutGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(spoutPts),
      6,
      0.0065,
      8,
      true,
    );
    this.floatingOilPoolGeo = new THREE.CylinderGeometry(0.031, 0.025, 0.005, 18);

    // Curved Twisted Cotton Wick & Ember Bead
    this.wickGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.004, -0.008, 0.002),
        new THREE.Vector3(0.0, 0.003, 0.001),
        new THREE.Vector3(0.001, 0.014, 0.0),
      ]),
      8,
      0.0032,
      6,
      false,
    );
    this.wickEmberGeo = new THREE.SphereGeometry(0.0038, 8, 6);

    // Multi-layered Sculpted Flame Geometries
    this.flameCoreGeo = createUrliFlameTeardropGeo(0.0082, 0.042);
    this.flameOuterGeo = createUrliFlameTeardropGeo(0.0175, 0.084);
    this.flameHaloGeo = new THREE.PlaneGeometry(0.145, 0.165);

    // Botanical Lily Pad & 22-Petal 3-Tier Sacred Lotus + Seed Pod + Stamens + Buds
    this.lilyPadGeo = createUrliSculptedLilyPadGeo(0.106, 24);
    this.loosePetalGeo = createRoundedSpoonLotusPetalGeo(0.042, 0.068, 0.012);

    const petalParts: THREE.BufferGeometry[] = [];
    const sepalParts: THREE.BufferGeometry[] = [];
    const pushGeom = (
      arr: THREE.BufferGeometry[],
      g: THREE.BufferGeometry,
      y = 0,
      ry = 0,
      rx = 0,
      x = 0,
      z = 0,
    ) => {
      const ni = g.index ? g.toNonIndexed() : g.clone();
      if (rx) ni.rotateX(rx);
      if (ry) ni.rotateY(ry);
      ni.translate(x, y, z);
      arr.push(ni);
      g.dispose();
    };

    const sepalBase = createRoundedSpoonLotusPetalGeo(0.028, 0.056, 0.008);
    for (let s = 0; s < 6; s++) {
      const a = (s / 6) * Math.PI * 2 + 0.15;
      pushGeom(sepalParts, sepalBase.clone(), 0.004, a, 1.32, Math.sin(a) * 0.020, Math.cos(a) * 0.020);
    }
    sepalBase.dispose();
    this.lotusCalyxGeo = mergeGeometries(sepalParts, false)!;
    sepalParts.forEach((p) => p.dispose());

    const basePetal = createRoundedSpoonLotusPetalGeo(0.044, 0.078, 0.016);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      pushGeom(
        petalParts,
        basePetal.clone(),
        0.007,
        a,
        1.04 + (i % 2) * 0.08,
        Math.sin(a) * 0.021,
        Math.cos(a) * 0.021,
      );
    }
    for (let i = 0; i < 8; i++) {
      const a = ((i + 0.5) / 8) * Math.PI * 2;
      const mid = basePetal.clone();
      mid.scale(0.88, 0.92, 0.90);
      pushGeom(petalParts, mid, 0.011, a, 0.62 + (i % 2) * 0.06, Math.sin(a) * 0.016, Math.cos(a) * 0.016);
    }
    for (let i = 0; i < 6; i++) {
      const a = ((i + 0.25) / 6) * Math.PI * 2;
      const inner = basePetal.clone();
      inner.scale(0.72, 0.80, 0.78);
      pushGeom(petalParts, inner, 0.015, a, 0.28, Math.sin(a) * 0.010, Math.cos(a) * 0.010);
    }
    basePetal.dispose();
    this.lotusCorollaGeo = mergeGeometries(petalParts, false)!;
    petalParts.forEach((p) => p.dispose());

    // Golden Seed Pod Receptacle + 18 Slender Tipped Stamens
    const podCore = new THREE.CylinderGeometry(0.021, 0.009, 0.024, 14).toNonIndexed();
    podCore.translate(0, 0.022, 0);
    this.lotusPodGeo = podCore;

    const stamenParts: THREE.BufferGeometry[] = [];
    for (let s = 0; s < 18; s++) {
      const sa = (s / 18) * Math.PI * 2;
      const fil = new THREE.CylinderGeometry(0.0014, 0.0011, 0.019, 5).toNonIndexed();
      fil.rotateX(0.30);
      fil.rotateY(sa);
      fil.translate(Math.sin(sa) * 0.021, 0.025, Math.cos(sa) * 0.021);
      stamenParts.push(fil);
      const anther = new THREE.SphereGeometry(0.0022, 5, 4).toNonIndexed();
      anther.translate(Math.sin(sa) * 0.024, 0.034, Math.cos(sa) * 0.024);
      stamenParts.push(anther);
    }
    this.lotusStamenGeo = mergeGeometries(stamenParts, false)!;
    stamenParts.forEach((p) => p.dispose());

    // Pointed Imbricated Lotus Bud Petals + Curved Stem
    const budParts: THREE.BufferGeometry[] = [];
    const budPetalBase = createRoundedSpoonLotusPetalGeo(0.024, 0.048, 0.010);
    for (let b = 0; b < 6; b++) {
      const a = (b / 6) * Math.PI * 2;
      const bp = budPetalBase.clone();
      bp.scale(1.0, 1.0 + (b % 2) * 0.06, 1.0);
      pushGeom(budParts, bp, 0.002, a, 0.15 + (b % 2) * 0.04, Math.sin(a) * 0.004, Math.cos(a) * 0.004);
    }
    budPetalBase.dispose();
    this.lotusBudPetalGeo = mergeGeometries(budParts, false)!;
    budParts.forEach((p) => p.dispose());

    this.budStemGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -0.055, 0),
        new THREE.Vector3(0.003, -0.015, 0.002),
        new THREE.Vector3(0, 0.036, 0),
      ]),
      8,
      0.0036,
      6,
      false,
    );

    // Botanical Textures & Rich Physical Materials
    const { petalMap, padMap } = createBotanicalLotusTextures();
    if (petalMap) petalMap.anisotropy = anisotropy;
    if (padMap) padMap.anisotropy = anisotropy;
    const seedPodMap = createUrliSeedPodTexture();
    if (seedPodMap) seedPodMap.anisotropy = anisotropy;

    this.gheeOilMat = new THREE.MeshPhysicalMaterial({
      color: 0xc2700e,
      roughness: 0.07,
      metalness: 0.02,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      emissive: 0x3b1800,
      emissiveIntensity: 0.30,
    });
    this.wickMat = new THREE.MeshStandardMaterial({
      color: 0x24150c,
      roughness: 0.94,
    });
    this.wickEmberMat = new THREE.MeshStandardMaterial({
      color: 0x5c1806,
      emissive: 0xff5a12,
      emissiveIntensity: 2.2,
      roughness: 0.55,
    });
    this.flameCoreMat = new THREE.MeshStandardMaterial({
      color: 0xfff0b2,
      emissive: 0xffcb4d,
      emissiveIntensity: 2.1,
      roughness: 0.14,
    });

    this.lilyPadMat = new THREE.MeshPhysicalMaterial({
      map: padMap ?? undefined,
      color: padMap ? 0xffffff : 0x3d7b34,
      roughness: 0.44,
      metalness: 0.02,
      clearcoat: 0.54,
      clearcoatRoughness: 0.22,
      side: THREE.DoubleSide,
    });
    this.sepalMat = new THREE.MeshStandardMaterial({
      color: 0x3f6b2c,
      roughness: 0.62,
      side: THREE.DoubleSide,
    });
    this.lotusCorollaMat = new THREE.MeshPhysicalMaterial({
      map: petalMap ?? undefined,
      color: petalMap ? 0xffffff : 0xf4a8c0,
      roughness: 0.36,
      metalness: 0.01,
      clearcoat: 0.16,
      clearcoatRoughness: 0.38,
      emissive: 0x380c1c,
      emissiveIntensity: 0.06,
      side: THREE.DoubleSide,
    });
    this.lotusBudMat = new THREE.MeshPhysicalMaterial({
      map: petalMap ?? undefined,
      color: petalMap ? 0xf7cddc : 0xe47da2,
      roughness: 0.34,
      clearcoat: 0.20,
      side: THREE.DoubleSide,
    });
    this.seedPodMat = new THREE.MeshStandardMaterial({
      map: seedPodMap ?? undefined,
      color: seedPodMap ? 0xffffff : 0xd69f28,
      roughness: 0.58,
      metalness: 0.04,
    });
    this.stamenAntherMat = new THREE.MeshStandardMaterial({
      color: 0xffb824,
      emissive: 0x704200,
      emissiveIntensity: 0.18,
      roughness: 0.45,
    });
  }

  private buildFlameRig(
    scale: number,
    phase: number,
    haloUniforms: { uTime: { value: number }; uIntensity: { value: number } },
    haloMat: THREE.ShaderMaterial,
  ): { rig: THREE.Group; instance: UrliFlameInstance } {
    const rig = new THREE.Group();
    rig.scale.setScalar(scale);
    rig.userData.noMerge = true;
    rig.userData.nonCollidable = true;

    const core = new THREE.Mesh(this.flameCoreGeo, this.flameCoreMat);
    core.position.y = 0.002;
    core.userData.noMerge = true;
    core.userData.nonCollidable = true;

    const mantleUniforms = {
      uTime: { value: 0 },
      uIntensity: { value: 1.0 },
      uPhase: { value: phase },
    };
    const mantleMat = createUrliFlameOuterShaderMaterial(mantleUniforms);
    const mantle = new THREE.Mesh(this.flameOuterGeo, mantleMat);
    mantle.renderOrder = 4;
    mantle.userData.noMerge = true;
    mantle.userData.nonCollidable = true;

    const halo = new THREE.Mesh(this.flameHaloGeo, haloMat);
    halo.position.y = 0.042;
    halo.renderOrder = 3;
    halo.userData.noMerge = true;
    halo.userData.nonCollidable = true;

    rig.add(core, mantle, halo);
    return {
      rig,
      instance: {
        rig,
        mantleUniforms,
        haloUniforms,
        baseScale: scale,
        phase,
      },
    };
  }

  public createOfferingBowlAssembly(
    mats: UrliPedestalMaterials,
    seedPhase = 0,
  ): UrliOfferingBowlBuild {
    const artifact = new THREE.Group();
    const flames: UrliFlameInstance[] = [];

    // 1. Makrana White Marble Pedestal & Hammered Bronze Urli Vessel
    const footing = new THREE.Mesh(this.footingGeo, mats.weatheredStoneMat);
    footing.position.y = -0.39;
    footing.receiveShadow = true;
    const p1 = new THREE.Mesh(this.plinthGeo, mats.whiteMarbleMat);
    p1.position.y = 0.06;
    p1.castShadow = true;
    p1.receiveShadow = true;
    const p2 = new THREE.Mesh(this.steppedGeo, mats.whiteMarbleMat);
    p2.position.y = 0.18;
    p2.castShadow = true;
    const collar = new THREE.Mesh(this.tealCollarGeo, mats.tealMarbleMat);
    collar.position.y = 0.28;
    const neck = new THREE.Mesh(this.neckGeo, mats.whiteMarbleMat);
    neck.position.y = 0.31;
    neck.castShadow = true;
    const calyxRing = new THREE.Mesh(this.calyxCollarGeo, mats.brightBrassMat);
    calyxRing.position.y = 0.335;
    artifact.add(footing, p1, p2, collar, neck, calyxRing);

    for (let lp = 0; lp < 12; lp++) {
      const ang = (lp / 12) * Math.PI * 2;
      const petal = new THREE.Mesh(this.lotusBaseGeo, mats.whiteMarbleMat);
      petal.position.set(Math.sin(ang) * 0.24, 0.345, Math.cos(ang) * 0.24);
      petal.rotation.y = ang;
      petal.rotation.x = 0.34;
      petal.castShadow = true;
      artifact.add(petal);
    }
    for (let lp = 0; lp < 12; lp++) {
      const ang = ((lp + 0.5) / 12) * Math.PI * 2;
      const petal = new THREE.Mesh(this.lotusBaseGeo, mats.whiteMarbleMat);
      petal.scale.setScalar(0.84);
      petal.position.set(Math.sin(ang) * 0.215, 0.372, Math.cos(ang) * 0.215);
      petal.rotation.y = ang;
      petal.rotation.x = 0.24;
      artifact.add(petal);
    }

    const bowl = new THREE.Mesh(this.bowlGeo, mats.agedBronzeMat);
    bowl.position.y = 0.44;
    bowl.castShadow = true;
    bowl.receiveShadow = true;
    const band = new THREE.Mesh(this.bowlBandGeo, mats.brightBrassMat);
    band.position.y = 0.69;
    const rimCollar = new THREE.Mesh(this.bowlRimCollarGeo, mats.brightBrassMat);
    rimCollar.position.y = 0.775;
    artifact.add(bowl, band, rimCollar);

    for (const side of [-1, 1]) {
      const handle = new THREE.Mesh(this.bowlHandleGeo, mats.brightBrassMat);
      handle.position.set(side * 0.565, 0.67, 0);
      handle.rotation.y = Math.PI / 2;
      artifact.add(handle);
    }

    // 2. Smooth Planar-UV Animated GLSL Urli Water
    const waterUniforms = {
      uTime: { value: 0 },
      uSkyColor: { value: new THREE.Color('#273a54') },
      uFlameIntensity: { value: 1.0 },
    };
    const waterMat = createUrliWaterShaderMaterial(waterUniforms);
    const water = new THREE.Mesh(this.bowlWaterGeo, waterMat);
    water.position.y = 0.710;
    water.userData.noMerge = true;
    water.userData.nonCollidable = true;
    artifact.add(water);

    const haloUniforms = {
      uTime: { value: 0 },
      uIntensity: { value: 1.0 },
    };
    const sharedHaloMat = createUrliFlameHaloMaterial(haloUniforms);

    // 3. Center Turned-Brass Akhanda Diya Lamp (molten ghee pool, curved wick & realistic flame)
    const centerDiya = new THREE.Group();
    centerDiya.position.set(URLI_CENTER_DIYA_LOCAL[0], 0.710, URLI_CENTER_DIYA_LOCAL[1]);
    const cStand = new THREE.Mesh(this.centerDiyaStandGeo, mats.brightBrassMat);
    cStand.castShadow = true;
    const cOil = new THREE.Mesh(this.centerOilPoolGeo, this.gheeOilMat);
    cOil.position.y = 0.090;
    const cWick = new THREE.Mesh(this.wickGeo, this.wickMat);
    cWick.position.y = 0.091;
    const cEmber = new THREE.Mesh(this.wickEmberGeo, this.wickEmberMat);
    cEmber.position.set(0.001, 0.105, 0);
    const cFlameBuilt = this.buildFlameRig(1.06, seedPhase + 0.5, haloUniforms, sharedHaloMat);
    cFlameBuilt.rig.position.set(0.001, 0.105, 0);
    flames.push(cFlameBuilt.instance);
    centerDiya.add(cStand, cOil, cWick, cEmber, cFlameBuilt.rig);
    artifact.add(centerDiya);

    // 4. Two Floating Spun-Brass Diyas resting on Notched Emerald Lotus-Leaf Coasters
    URLI_FLOATING_DIYA_COORDS.forEach(([dx, dz], idx) => {
      const floatGroup = new THREE.Group();
      floatGroup.position.set(dx, 0.712, dz);
      floatGroup.rotation.y = idx === 0 ? 0.55 : -0.75;

      const coasterPad = new THREE.Mesh(this.lilyPadGeo, this.lilyPadMat);
      coasterPad.scale.setScalar(0.64);
      coasterPad.position.y = 0.0;
      coasterPad.receiveShadow = true;

      const cup = new THREE.Mesh(this.floatingDiyaCupGeo, mats.brightBrassMat);
      cup.position.y = 0.004;
      cup.castShadow = true;
      const spout = new THREE.Mesh(this.floatingDiyaSpoutGeo, mats.brightBrassMat);
      spout.position.y = 0.004;
      const oil = new THREE.Mesh(this.floatingOilPoolGeo, this.gheeOilMat);
      oil.position.y = 0.023;

      const wick = new THREE.Mesh(this.wickGeo, this.wickMat);
      wick.scale.setScalar(0.84);
      wick.position.set(0, 0.023, 0.022);
      wick.rotation.x = 0.28;
      const ember = new THREE.Mesh(this.wickEmberGeo, this.wickEmberMat);
      ember.scale.setScalar(0.82);
      ember.position.set(0, 0.034, 0.025);

      const fFlameBuilt = this.buildFlameRig(
        0.78,
        seedPhase + 2.1 + idx * 1.9,
        haloUniforms,
        sharedHaloMat,
      );
      fFlameBuilt.rig.position.set(0, 0.034, 0.025);
      flames.push(fFlameBuilt.instance);

      floatGroup.add(coasterPad, cup, spout, oil, wick, ember, fFlameBuilt.rig);
      artifact.add(floatGroup);
    });

    // 5. High-Detail 22-Petal 3-Tier Botanical Lotus Clusters on Veined Notched Lily Pads
    for (const cluster of URLI_LOTUS_CLUSTER_COORDS) {
      const cg = new THREE.Group();
      cg.position.set(cluster.x, 0.713, cluster.z);
      cg.rotation.y = cluster.yaw;

      const mainPad = new THREE.Mesh(this.lilyPadGeo, this.lilyPadMat);
      mainPad.scale.setScalar(cluster.scale);
      mainPad.receiveShadow = true;
      cg.add(mainPad);

      if (cluster.hasBuddyPad) {
        const buddyPad = new THREE.Mesh(this.lilyPadGeo, this.lilyPadMat);
        buddyPad.scale.setScalar(cluster.scale * 0.56);
        buddyPad.position.set(0.088 * cluster.scale, -0.0016, 0.048 * cluster.scale);
        buddyPad.rotation.y = 2.1;
        buddyPad.receiveShadow = true;
        cg.add(buddyPad);
      }

      const bloom = new THREE.Group();
      bloom.scale.setScalar(cluster.scale);
      bloom.position.set(0, 0.003, 0);

      const calyx = new THREE.Mesh(this.lotusCalyxGeo, this.sepalMat);
      const corolla = new THREE.Mesh(this.lotusCorollaGeo, this.lotusCorollaMat);
      corolla.castShadow = true;
      const seedPod = new THREE.Mesh(this.lotusPodGeo, this.seedPodMat);
      const stamens = new THREE.Mesh(this.lotusStamenGeo, this.stamenAntherMat);

      bloom.add(calyx, corolla, seedPod, stamens);
      cg.add(bloom);
      artifact.add(cg);
    }

    // 6. Two Pointed Half-Open Lotus Buds on Curved Stems
    for (const bud of URLI_BUD_COORDS) {
      const bg = new THREE.Group();
      bg.position.set(bud.x, 0.713, bud.z);
      bg.rotation.y = bud.yaw;
      const stem = new THREE.Mesh(this.budStemGeo, this.sepalMat);
      const head = new THREE.Group();
      head.position.set(0, 0.036, 0);
      head.rotation.x = bud.tiltX;
      head.scale.setScalar(bud.height / 0.048);
      const bCalyx = new THREE.Mesh(this.lotusCalyxGeo, this.sepalMat);
      bCalyx.scale.set(0.68, 0.92, 0.68);
      const bPetals = new THREE.Mesh(this.lotusBudPetalGeo, this.lotusBudMat);
      head.add(bCalyx, bPetals);
      bg.add(stem, head);
      artifact.add(bg);
    }

    // 7. Loose Drifting Pink Lotus Petals on the Water Surface
    for (const lp of URLI_FLOATING_PETAL_COORDS) {
      const petal = new THREE.Mesh(this.loosePetalGeo, this.lotusCorollaMat);
      petal.position.set(lp.x, 0.7115, lp.z);
      petal.rotation.order = 'YXZ';
      petal.rotation.y = lp.yaw;
      petal.rotation.x = Math.PI * 0.46;
      petal.scale.setScalar(lp.scale);
      artifact.add(petal);
    }

    return { group: artifact, waterUniforms, flames };
  }
}

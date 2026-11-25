import * as THREE from 'three';

export const LUNGTA_PALETTE = [
  0x2563eb, // Sky / Wisdom (Blue)
  0xf8fafc, // Clouds / Air (White)
  0xdc2626, // Fire / Dharma (Red)
  0x16a34a, // Water / Nature (Green)
  0xeab308, // Earth / Prosperity (Yellow/Gold)
] as const;

export const PRAYER_FLAG_UNIFORMS = {
  uTime: { value: 0 },
  // x, z = wind vector in world space; y = wind speed multiplier (~0.35..1.25)
  uWind: { value: new THREE.Vector3(0.45, 0.58, 0.25) },
};

export function updatePrayerFlagUniforms(
  elapsed: number,
  windX = 0.45,
  windZ = 0.25,
  windSpeed = 0.58,
): void {
  PRAYER_FLAG_UNIFORMS.uTime.value = elapsed;
  PRAYER_FLAG_UNIFORMS.uWind.value.set(windX, THREE.MathUtils.clamp(windSpeed, 0.3, 1.45), windZ);
}

let cachedSingleTextures: THREE.Texture[] | null = null;
let cachedFiveBandTexture: THREE.Texture | null = null;
let cachedRopeMat: THREE.MeshStandardMaterial | null = null;
let cachedPoleMat: THREE.MeshStandardMaterial | null = null;
let cachedFinialMat: THREE.MeshStandardMaterial | null = null;
let cachedDrapeMats: THREE.MeshStandardMaterial[] | null = null;
let cachedPoleBannerMat: THREE.MeshStandardMaterial | null = null;

function createFallbackTexture(rgba: [number, number, number, number]): THREE.DataTexture {
  const tex = new THREE.DataTexture(new Uint8Array(rgba), 1, 1, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function buildClothPrintTexture(hex: number, idx: number): THREE.Texture {
  if (typeof document === 'undefined') {
    const c = new THREE.Color(hex);
    return createFallbackTexture([
      Math.round(c.r * 255),
      Math.round(c.g * 255),
      Math.round(c.b * 255),
      255,
    ]);
  }
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return createFallbackTexture([248, 250, 252, 255]);
  }
  const baseColor = new THREE.Color(hex);
  const r = Math.round(baseColor.r * 255);
  const g = Math.round(baseColor.g * 255);
  const b = Math.round(baseColor.b * 255);
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.fillRect(0, 0, 128, 128);

  // Fine woven cotton warp/weft grain
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 128; i += 4) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(128, i);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 128);
    ctx.stroke();
  }

  // Woodblock Tibetan mantra border, central Lungta medallion & prayer script lines
  const inkAlpha = idx === 1 || idx === 4 ? 0.24 : 0.28;
  ctx.strokeStyle = `rgba(18, 20, 24, ${inkAlpha})`;
  ctx.fillStyle = `rgba(18, 20, 24, ${inkAlpha})`;
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 12, 108, 104);

  ctx.beginPath();
  ctx.arc(64, 58, 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(64, 58, 7, 0, Math.PI * 2);
  ctx.stroke();

  for (let row = 0; row < 5; row++) {
    const y = 26 + row * 18;
    ctx.fillRect(18, y, 22, 2);
    ctx.fillRect(88, y, 22, 2);
  }
  for (let row = 0; row < 3; row++) {
    ctx.fillRect(22, 86 + row * 9, 84, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function buildFiveBandLungtaTexture(): THREE.Texture {
  if (typeof document === 'undefined') {
    return createFallbackTexture([234, 179, 8, 255]);
  }
  const canvas = document.createElement('canvas');
  canvas.width = 192;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return createFallbackTexture([234, 179, 8, 255]);
  }
  const bandH = canvas.height / LUNGTA_PALETTE.length;
  LUNGTA_PALETTE.forEach((hex, idx) => {
    const c = new THREE.Color(hex);
    ctx.fillStyle = `rgb(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)})`;
    ctx.fillRect(0, idx * bandH, canvas.width, bandH + 1);

    ctx.strokeStyle = idx === 1 || idx === 4 ? 'rgba(18,22,28,0.22)' : 'rgba(15,18,24,0.25)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(12, idx * bandH + 5, canvas.width - 24, bandH - 10);
    ctx.beginPath();
    ctx.arc(canvas.width * 0.5, idx * bandH + bandH * 0.5, bandH * 0.24, 0, Math.PI * 2);
    ctx.stroke();
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function applyPrayerFlagClothShader(
  mat: THREE.MeshStandardMaterial,
  mode: 'drape' | 'pole',
): void {
  mat.customProgramCacheKey = () =>
    mode === 'drape' ? 'lungta-drape-flag-v1' : 'lungta-pole-banner-v1';

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = PRAYER_FLAG_UNIFORMS.uTime;
    shader.uniforms.uWind = PRAYER_FLAG_UNIFORMS.uWind;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform float uTime;
         uniform vec3 uWind;`,
      )
      .replace(
        '#include <begin_vertex>',
        mode === 'drape'
          ? `#include <begin_vertex>
             vec4 flagOriginW = modelMatrix * vec4(0.0, 0.0, 0.0, 1.0);
             float fPhase = flagOriginW.x * 0.71 + flagOriginW.z * 0.59 + flagOriginW.y * 0.33;
             float pinMask = pow(clamp(1.0 - uv.y, 0.0, 1.0), 1.35);
             float ws = clamp(uWind.y, 0.3, 1.45);
             float waveA = sin(uTime * (3.7 + ws * 1.45) + fPhase + uv.x * 5.2 - (1.0 - uv.y) * 4.5);
             float waveB = cos(uTime * (6.9 + ws * 1.8) + fPhase * 1.7 + uv.y * 8.2);
             float waveC = sin(uTime * 2.15 + fPhase * 0.8);
             vec3 wDir = vec3(uWind.x, 0.0, uWind.z);
             vec3 axisX = normalize(vec3(modelMatrix[0][0], modelMatrix[0][1], modelMatrix[0][2]) + vec3(0.0001, 0.0, 0.0));
             vec3 axisZ = normalize(vec3(modelMatrix[2][0], modelMatrix[2][1], modelMatrix[2][2]) + vec3(0.0, 0.0, 0.0001));
             float localWindX = dot(wDir, axisX);
             float localWindZ = dot(wDir, axisZ);
             transformed.z += (waveA * 0.088 + waveB * 0.028) * pinMask * (0.75 + ws * 0.55) + localWindZ * pinMask * (0.10 + 0.05 * waveC);
             transformed.x += localWindX * pinMask * 0.08 + sin(uTime * 3.1 + fPhase + (1.0 - uv.y) * 3.4) * 0.032 * pinMask;
             transformed.y += pinMask * (0.035 * ws + 0.025 * waveC);`
          : `#include <begin_vertex>
             vec4 flagOriginW = modelMatrix * vec4(0.0, 0.0, 0.0, 1.0);
             float fPhase = flagOriginW.x * 0.53 + flagOriginW.z * 0.67 + flagOriginW.y * 0.41;
             float pinMask = pow(clamp(uv.x, 0.0, 1.0), 1.15);
             float ws = clamp(uWind.y, 0.3, 1.45);
             float travel = sin(uTime * (4.3 + ws * 1.65) - uv.x * 6.4 + fPhase);
             float ripple = cos(uTime * (7.6 + ws * 2.1) - uv.x * 11.4 + uv.y * 3.4 + fPhase * 1.4);
             float lift = sin(uTime * 2.4 - uv.x * 3.8 + fPhase);
             transformed.z += (travel * 0.095 + ripple * 0.034) * pinMask * (0.78 + ws * 0.55);
             transformed.y += (lift * 0.038 + 0.032 * ws) * pinMask;
             transformed.x -= (1.0 - cos(travel * 0.24)) * pinMask * 0.04;`,
      );
  };
}

export function getLungtaDrapeMaterials(): THREE.MeshStandardMaterial[] {
  if (cachedDrapeMats) return cachedDrapeMats;
  if (!cachedSingleTextures) {
    cachedSingleTextures = LUNGTA_PALETTE.map((hex, i) => buildClothPrintTexture(hex, i));
  }
  cachedDrapeMats = cachedSingleTextures.map((tex) => {
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.84,
      metalness: 0.01,
      side: THREE.DoubleSide,
    });
    applyPrayerFlagClothShader(mat, 'drape');
    return mat;
  });
  return cachedDrapeMats;
}

export function getLungtaPoleBannerMaterial(): THREE.MeshStandardMaterial {
  if (cachedPoleBannerMat) return cachedPoleBannerMat;
  if (!cachedFiveBandTexture) {
    cachedFiveBandTexture = buildFiveBandLungtaTexture();
  }
  cachedPoleBannerMat = new THREE.MeshStandardMaterial({
    map: cachedFiveBandTexture,
    roughness: 0.82,
    metalness: 0.01,
    side: THREE.DoubleSide,
  });
  applyPrayerFlagClothShader(cachedPoleBannerMat, 'pole');
  return cachedPoleBannerMat;
}

function getSharedPoleMat(): THREE.MeshStandardMaterial {
  if (!cachedPoleMat) {
    cachedPoleMat = new THREE.MeshStandardMaterial({ color: 0x4b3826, roughness: 0.84 });
  }
  return cachedPoleMat;
}

function getSharedRopeMat(): THREE.MeshStandardMaterial {
  if (!cachedRopeMat) {
    cachedRopeMat = new THREE.MeshStandardMaterial({ color: 0xc2bcb0, roughness: 0.86 });
  }
  return cachedRopeMat;
}

function getSharedFinialMat(): THREE.MeshStandardMaterial {
  if (!cachedFinialMat) {
    cachedFinialMat = new THREE.MeshStandardMaterial({
      color: 0xe6b84c,
      roughness: 0.26,
      metalness: 0.88,
    });
  }
  return cachedFinialMat;
}

export interface PrayerFlagGarlandOptions {
  flagCount?: number;
  flagWidth?: number;
  flagHeight?: number;
  sag?: number;
  includePoles?: boolean;
  poleBaseGroundY?: (x: number, z: number) => number;
  poleMaterial?: THREE.Material;
}

/**
 * Creates a catenary Tibetan Lungta prayer-flag garland between two 3D points,
 * using subdivided GPU-animated cloth flags pinned cleanly along their top rope seam.
 */
export function createWavingPrayerFlagGarland(
  start: THREE.Vector3,
  end: THREE.Vector3,
  options: PrayerFlagGarlandOptions = {},
): { group: THREE.Group; flags: THREE.Mesh[] } {
  const flagCount = options.flagCount ?? 10;
  const flagW = options.flagWidth ?? 0.38;
  const flagH = options.flagHeight ?? 0.48;
  const sag = options.sag ?? 0.68;

  const group = new THREE.Group();
  const flags: THREE.Mesh[] = [];
  const mats = getLungtaDrapeMaterials();
  const ropeMat = getSharedRopeMat();
  const poleMat = options.poleMaterial ?? getSharedPoleMat();
  const finialMat = getSharedFinialMat();

  if (options.includePoles) {
    const getBaseY = options.poleBaseGroundY ?? (() => 0);
    for (const p of [start, end]) {
      const y0 = getBaseY(p.x, p.z);
      const poleH = Math.max(1.2, p.y - y0 + 0.45);
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.052, 0.075, poleH, 8),
        poleMat,
      );
      pole.position.set(p.x, y0 + poleH * 0.5 - 0.1, p.z);
      pole.castShadow = true;
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.072, 8, 6), finialMat);
      knob.position.set(p.x, y0 + poleH - 0.08, p.z);
      group.add(pole, knob);
    }
  }

  const mid = start.clone().lerp(end, 0.5);
  mid.y -= sag;
  const curve = new THREE.CatmullRomCurve3([start, mid, end]);
  const rope = new THREE.Mesh(new THREE.TubeGeometry(curve, 18, 0.016, 5, false), ropeMat);
  rope.userData.nonCollidable = true;
  group.add(rope);

  // Pin top edge of cloth mesh at local y = 0 so shader leaves the rope seam anchored
  const flagGeo = new THREE.PlaneGeometry(flagW, flagH, 4, 6);
  flagGeo.translate(0, -flagH * 0.5, 0);

  const yaw = Math.atan2(end.z - start.z, end.x - start.x);
  for (let i = 1; i <= flagCount; i++) {
    const t = i / (flagCount + 1);
    const pos = curve.getPoint(t);
    const flag = new THREE.Mesh(flagGeo, mats[(i - 1) % mats.length]);
    flag.position.set(pos.x, pos.y - 0.01, pos.z);
    flag.rotation.y = yaw;
    flag.userData.nonCollidable = true;
    flag.userData.noSpin = true;
    flag.userData.prayerFlagMode = 'drape';
    group.add(flag);
    flags.push(flag);
  }

  return { group, flags };
}

export interface WavingPoleBannerOptions {
  height?: number;
  bannerWidth?: number;
  bannerHeight?: number;
  baseYaw?: number;
  poleMaterial?: THREE.Material;
  finialMaterial?: THREE.Material;
}

/**
 * Creates a vertical mast flying a unified 5-stripe Buddhist Lungta banner with GPU cloth flutter
 * and subtle wind-vane swaying (explicitly non-spinning and non-collidable).
 */
export function createWavingPoleBanner(options: WavingPoleBannerOptions = {}): {
  group: THREE.Group;
  clothMesh: THREE.Mesh;
} {
  const height = options.height ?? 2.35;
  const bannerW = options.bannerWidth ?? 0.84;
  const bannerH = options.bannerHeight ?? 0.58;
  const baseYaw = options.baseYaw ?? 0.25;

  const group = new THREE.Group();
  group.userData.nonCollidable = true;

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.044, height, 8),
    options.poleMaterial ?? getSharedPoleMat(),
  );
  pole.position.y = height * 0.5;
  pole.userData.nonCollidable = true;

  const knob = new THREE.Mesh(
    new THREE.SphereGeometry(0.056, 8, 8),
    options.finialMaterial ?? getSharedFinialMat(),
  );
  knob.position.y = height + 0.02;
  knob.userData.nonCollidable = true;

  const bannerGeo = new THREE.PlaneGeometry(bannerW, bannerH, 10, 5);
  bannerGeo.translate(bannerW * 0.5, 0, 0);

  const clothMesh = new THREE.Mesh(bannerGeo, getLungtaPoleBannerMaterial());
  clothMesh.position.set(0.025, height - bannerH * 0.58, 0);
  clothMesh.rotation.y = baseYaw;
  clothMesh.userData.nonCollidable = true;
  clothMesh.userData.noSpin = true;
  clothMesh.userData.prayerFlagMode = 'pole';
  clothMesh.userData.onEnvironmentUpdate = (env: {
    elapsed: number;
    windX: number;
    windZ: number;
  }) => {
    const targetYaw = Math.atan2(-env.windZ, env.windX);
    const windSway = Math.sin(env.elapsed * 1.15 + baseYaw * 2.3) * 0.16;
    clothMesh.rotation.y = baseYaw + Math.sin(targetYaw - baseYaw) * 0.28 + windSway;
  };

  group.add(pole, knob, clothMesh);
  return { group, clothMesh };
}

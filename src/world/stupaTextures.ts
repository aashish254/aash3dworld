import * as THREE from 'three';
import { getCachedMaterial, getCachedTexture } from './meshOptimization';
import { ProceduralTextureSet } from './proceduralTextures';

export interface StupaPbrMaterials {
  stupaDomeChhyonMat: THREE.MeshStandardMaterial;
  whiteStuccoMat: THREE.MeshStandardMaterial;
  gildedCopperMat: THREE.MeshStandardMaterial;
  gildedSpireRingMat: THREE.MeshStandardMaterial;
  prayerWheelBrassMat: THREE.MeshStandardMaterial;
  harmikaEyesMat: THREE.MeshStandardMaterial;
  valanceClothMat: THREE.MeshStandardMaterial;
  graniteFlagstoneMat: THREE.MeshStandardMaterial;
  mossyCarvedStoneMat: THREE.MeshStandardMaterial;
  dachiBrickMat: THREE.MeshStandardMaterial;
  sandstoneCopingMat: THREE.MeshStandardMaterial;
  jhingatiRoofMat: THREE.MeshStandardMaterial;
  wroughtIronMat: THREE.MeshStandardMaterial;
  tibetanVermilionWoodMat: THREE.MeshStandardMaterial;
  deepTeakWoodMat: THREE.MeshStandardMaterial;
  monasteryFloorMat: THREE.MeshStandardMaterial;
  crimsonCushionMat: THREE.MeshStandardMaterial;
  thangkaArtMat: THREE.MeshStandardMaterial;
  buddhaGoldMat: THREE.MeshStandardMaterial;
  pondWaterStoneMat: THREE.MeshStandardMaterial;
  boudhaPlaqueMat: THREE.MeshStandardMaterial;
  butterFlameMat: THREE.MeshStandardMaterial;
  butterHaloMat: THREE.MeshBasicMaterial;
  marigoldMat: THREE.MeshStandardMaterial;
  sindoorMat: THREE.MeshStandardMaterial;
  newariWallPlasterMat: THREE.MeshStandardMaterial;
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  if (typeof document === 'undefined') {
    const noop = () => {};
    const fakeData = { data: new Uint8ClampedArray(w * h * 4) };
    const fakeGrad = { addColorStop: noop };
    const fakeCtx = {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      globalAlpha: 1,
      font: '',
      textAlign: 'left',
      textBaseline: 'alphabetic',
      fillRect: noop,
      clearRect: noop,
      strokeRect: noop,
      fillText: noop,
      beginPath: noop,
      arc: noop,
      ellipse: noop,
      moveTo: noop,
      lineTo: noop,
      quadraticCurveTo: noop,
      bezierCurveTo: noop,
      closePath: noop,
      clip: noop,
      fill: noop,
      stroke: noop,
      save: noop,
      restore: noop,
      translate: noop,
      rotate: noop,
      scale: noop,
      createLinearGradient: () => fakeGrad,
      createRadialGradient: () => fakeGrad,
      getImageData: () => fakeData,
      createImageData: () => fakeData,
      putImageData: noop,
    } as unknown as CanvasRenderingContext2D;
    return [
      { width: w, height: h, getContext: () => fakeCtx } as unknown as HTMLCanvasElement,
      fakeCtx,
    ];
  }
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d', { willReadFrequently: true })!];
}

function hash2d(x: number, y: number, seed = 67): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  return n - Math.floor(n);
}

function heightCanvasToNormal(heightCanvas: HTMLCanvasElement, strength = 2.6): HTMLCanvasElement {
  const w = heightCanvas.width;
  const h = heightCanvas.height;
  const ctx = heightCanvas.getContext('2d', { willReadFrequently: true });
  const src = ctx ? ctx.getImageData(0, 0, w, h).data : new Uint8ClampedArray(w * h * 4);
  const [out, outCtx] = makeCanvas(w, h);
  const img = outCtx.createImageData(w, h);
  const dst = img.data;
  const sample = (x: number, y: number) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const tl = sample(x - 1, y - 1);
      const t = sample(x, y - 1);
      const tr = sample(x + 1, y - 1);
      const l = sample(x - 1, y);
      const r = sample(x + 1, y);
      const bl = sample(x - 1, y + 1);
      const b = sample(x, y + 1);
      const br = sample(x + 1, y + 1);
      const dx = tr + 2 * r + br - (tl + 2 * l + bl);
      const dy = bl + 2 * b + br - (tl + 2 * t + tr);
      let nx = -dx * strength;
      let ny = -dy * strength;
      let nz = 1.0;
      const inv = 1 / Math.hypot(nx, ny, nz);
      nx *= inv;
      ny *= inv;
      nz *= inv;
      const idx = (y * w + x) * 4;
      dst[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      dst[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      dst[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      dst[idx + 3] = 255;
    }
  }
  outCtx.putImageData(img, 0, 0);
  return out;
}

function buildTex(
  canvas: HTMLCanvasElement,
  srgb: boolean,
  repX = 1,
  repY = 1,
  clamp = false,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.wrapS = clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  tex.wrapT = clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  tex.repeat.set(repX, repY);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates and globally caches singleton PBR textures & materials for Boudhanath and Swayambhunath:
 * - Weathered White Lime Stucco + Saffron-Ochre Chhyon Lotus Wash
 * - Repoussé Gilded Copper (metalness: 0.92, roughness: 0.20)
 * - 1024x1024 High-DPI Hand-Painted Buddha Wisdom Eyes + Nepali "१"
 * - Kathmandu Granite Flagstones & Ancient Mossy Stone
 * - Tibetan Monastery Vermilion/Teak Wood, Thangkas, 12-Zodiac Dharmadhatu Mandala & Heritage Plaques
 */
export function getStupaPbrMaterials(textures: ProceduralTextureSet): StupaPbrMaterials {
  // 1. Lime Stucco Surface (Normal + Roughness) + Saffron Chhyon Dome Albedo
  const limeStuccoHeight = (() => {
    const s = 512;
    const [c, ctx] = makeCanvas(s, s);
    ctx.fillStyle = '#c8c8c8';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 3200; i++) {
      const px = hash2d(i, 1, 13) * s;
      const py = hash2d(i, 2, 29) * s;
      const r = 4 + hash2d(i, 3, 41) * 18;
      const v = Math.round(168 + hash2d(i, 4, 53) * 58);
      ctx.fillStyle = `rgba(${v},${v},${v},0.16)`;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
    return c;
  })();

  const limeStuccoNormal = getCachedTexture('stupa-lime-stucco-normal', () =>
    buildTex(heightCanvasToNormal(limeStuccoHeight, 1.85), false, 4, 3),
  );
  const limeStuccoRough = getCachedTexture('stupa-lime-stucco-rough', () => {
    const s = 256;
    const [c, ctx] = makeCanvas(s, s);
    ctx.fillStyle = '#dedede';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 900; i++) {
      const v = Math.round(202 + hash2d(i, 6, 71) * 44);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(hash2d(i, 1, 79) * s, hash2d(i, 2, 83) * s, 5, 5);
    }
    return buildTex(c, false, 4, 3);
  });

  // Whitewashed Anda dome with bold radial saffron-yellow / ochre Chhyon lotus wash streaks
  const chhyonDomeAlbedo = getCachedTexture('stupa-anda-chhyon-albedo', () => {
    const w = 1024;
    const h = 512;
    const [c, ctx] = makeCanvas(w, h);
    const baseGrad = ctx.createLinearGradient(0, 0, 0, h);
    baseGrad.addColorStop(0.0, '#efe9da');
    baseGrad.addColorStop(0.35, '#f6f3eb');
    baseGrad.addColorStop(0.82, '#ede8dc');
    baseGrad.addColorStop(1.0, '#d8d1c2');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle troweled limewash texture patches
    for (let i = 0; i < 2000; i++) {
      const px = hash2d(i, 3, 19) * w;
      const py = hash2d(i, 7, 37) * h;
      const rad = 6 + hash2d(i, 9, 43) * 22;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.14)' : 'rgba(182,174,158,0.09)';
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Iconic Boudhanath / Swayambhunath saffron Chhyon lotus petal garlands along top 55% (v=0..0.55)
    // Top of SphereGeometry has uv.y = 1.0 in Three.js, so in Canvas coordinates y=0 corresponds to TOP pole!
    const petals = 18;
    const bayW = w / petals;
    for (let p = 0; p < petals; p++) {
      const cx = (p + 0.5) * bayW;
      const leftX = p * bayW;
      const rightX = (p + 1) * bayW;

      // Golden-ochre scalloped lotus garland band & vertical rainwater trickle streaks
      const petalGrad = ctx.createLinearGradient(cx, 0, cx, h * 0.52);
      petalGrad.addColorStop(0.0, 'rgba(202, 134, 24, 0.88)');
      petalGrad.addColorStop(0.28, 'rgba(216, 148, 34, 0.72)');
      petalGrad.addColorStop(0.68, 'rgba(198, 128, 30, 0.24)');
      petalGrad.addColorStop(1.0, 'rgba(198, 128, 30, 0.0)');
      ctx.fillStyle = petalGrad;
      ctx.beginPath();
      ctx.moveTo(leftX, 0);
      ctx.lineTo(rightX, 0);
      ctx.lineTo(rightX, h * 0.14);
      ctx.quadraticCurveTo(cx, h * 0.50, leftX, h * 0.14);
      ctx.closePath();
      ctx.fill();

      // Arch stroke accentuating double lotus wash line like real Chhyon pouring
      ctx.strokeStyle = 'rgba(214, 142, 26, 0.52)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(leftX, h * 0.10);
      ctx.quadraticCurveTo(cx, h * 0.44, rightX, h * 0.10);
      ctx.stroke();

      // Rainwater ochre runoff streaks down mid-dome
      for (let s = 0; s < 3; s++) {
        const sx = leftX + (0.2 + s * 0.3) * bayW;
        const streakLen = h * (0.48 + hash2d(p, s, 91) * 0.26);
        const sg = ctx.createLinearGradient(sx, h * 0.16, sx, streakLen);
        sg.addColorStop(0, 'rgba(194, 124, 28, 0.28)');
        sg.addColorStop(1, 'rgba(194, 124, 28, 0.0)');
        ctx.fillStyle = sg;
        ctx.fillRect(sx - 2.5, h * 0.16, 5, streakLen - h * 0.16);
      }
    }

    // Crown saffron cap right under Harmika
    const crownGrad = ctx.createLinearGradient(0, 0, 0, h * 0.16);
    crownGrad.addColorStop(0, 'rgba(204, 134, 22, 0.92)');
    crownGrad.addColorStop(1, 'rgba(204, 134, 22, 0.0)');
    ctx.fillStyle = crownGrad;
    ctx.fillRect(0, 0, w, h * 0.16);

    // Subtle weathered grey base border near dome skirt
    const skirtGrad = ctx.createLinearGradient(0, h * 0.85, 0, h);
    skirtGrad.addColorStop(0, 'rgba(86, 82, 74, 0.0)');
    skirtGrad.addColorStop(1, 'rgba(72, 68, 60, 0.26)');
    ctx.fillStyle = skirtGrad;
    ctx.fillRect(0, h * 0.85, w, h * 0.15);

    return buildTex(c, true, 1, 1);
  });

  // 2. Repoussé Gilded Copper (metalness: 0.92, roughness: 0.20)
  const copperAlbedo = getCachedTexture('stupa-gold-copper-albedo', () => {
    const s = 512;
    const [c, ctx] = makeCanvas(s, s);
    const g = ctx.createLinearGradient(0, 0, s, s);
    g.addColorStop(0, '#eab93d');
    g.addColorStop(0.5, '#f9d666');
    g.addColorStop(1, '#d19822');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);

    const bays = 8;
    const bw = s / bays;
    for (let b = 0; b < bays; b++) {
      const x = b * bw;
      ctx.fillStyle = 'rgba(130, 82, 10, 0.36)';
      ctx.fillRect(x, 0, 4, s);
      ctx.fillStyle = 'rgba(255, 245, 195, 0.48)';
      ctx.fillRect(x + 4, 0, 3, s);
      for (let y = 32; y < s; y += 64) {
        ctx.strokeStyle = 'rgba(148, 92, 14, 0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + bw * 0.5, y, 13, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    for (let i = 0; i < 1200; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,244,185,0.16)' : 'rgba(140,86,14,0.14)';
      ctx.beginPath();
      ctx.arc(hash2d(i, 3, 21) * s, hash2d(i, 7, 33) * s, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    return buildTex(c, true, 2, 2);
  });

  const copperHeight = (() => {
    const s = 512;
    const [c, ctx] = makeCanvas(s, s);
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, s, s);
    const bays = 8;
    const bw = s / bays;
    for (let b = 0; b < bays; b++) {
      const x = b * bw;
      ctx.fillStyle = '#efefef';
      ctx.fillRect(x, 0, 6, s);
      for (let y = 32; y < s; y += 64) {
        ctx.strokeStyle = '#d4d4d4';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x + bw * 0.5, y, 13, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    return c;
  })();

  const copperNormal = getCachedTexture('stupa-gold-copper-normal', () =>
    buildTex(heightCanvasToNormal(copperHeight, 2.5), false, 2, 2),
  );
  const copperRough = getCachedTexture('stupa-gold-copper-rough', () => {
    const s = 256;
    const [c, ctx] = makeCanvas(s, s);
    ctx.fillStyle = '#333333'; // ~0.20 roughness
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 500; i++) {
      const v = 32 + Math.round(hash2d(i, 5, 41) * 28);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(hash2d(i, 1, 51) * s, hash2d(i, 2, 61) * s, 4, 4);
    }
    return buildTex(c, false, 2, 2);
  });

  // 3. Hand-Painted Buddha Wisdom Eyes Texture (1024x1024 High-DPI)
  const harmikaEyesTex = getCachedTexture('stupa-harmika-wisdom-eyes-1024', () => {
    const s = 1024;
    const [c, ctx] = makeCanvas(s, s);

    // Gilded copper plate backdrop
    const bg = ctx.createLinearGradient(0, 0, s, s);
    bg.addColorStop(0, '#dca832');
    bg.addColorStop(0.5, '#f6d265');
    bg.addColorStop(1, '#c9901d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, s, s);

    // Subtle hammered gold border frame
    ctx.strokeStyle = '#7c4c0a';
    ctx.lineWidth = 24;
    ctx.strokeRect(20, 20, s - 40, s - 40);
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 6;
    ctx.strokeRect(38, 38, s - 76, s - 76);

    // Upper red/gold frieze stripe under valance
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(42, 42, s - 84, 72);
    ctx.fillStyle = '#fbbf24';
    for (let x = 86; x < s - 60; x += 72) {
      ctx.beginPath();
      ctx.arc(x, 78, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // Centered Urna (Third Eye of Wisdom) - Golden frame + crimson jewel center
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.ellipse(512, 276, 36, 46, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.ellipse(512, 276, 14, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw symmetrical serene half-closed Buddha Wisdom Eyes
    const drawEye = (cx: number, cy: number, flipX: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(flipX, 1);

      // Sweeping dark blue-black lotus-leaf eyebrow
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 28;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-185, -135);
      ctx.bezierCurveTo(-90, -215, 70, -215, 195, -120);
      ctx.stroke();

      // Thin golden highlight ribbon along eyebrow ridge
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-175, -148);
      ctx.bezierCurveTo(-85, -225, 70, -225, 185, -135);
      ctx.stroke();

      // Almond sclera outline & pure white sclera fill
      ctx.beginPath();
      ctx.moveTo(-195, 8);
      ctx.bezierCurveTo(-85, -88, 95, -78, 192, 14);
      ctx.bezierCurveTo(95, 76, -85, 78, -195, 8);
      ctx.closePath();
      ctx.fillStyle = '#f8fafc';
      ctx.fill();

      // Clip iris inside eye aperture
      ctx.save();
      ctx.clip();

      // Outer sapphire ring & deep cobalt iris
      const irisGrad = ctx.createRadialGradient(0, -4, 14, 0, -4, 62);
      irisGrad.addColorStop(0, '#0b1e59');
      irisGrad.addColorStop(0.55, '#1d4ed8');
      irisGrad.addColorStop(1, '#1e3a8a');
      ctx.fillStyle = irisGrad;
      ctx.beginPath();
      ctx.arc(0, -4, 58, 0, Math.PI * 2);
      ctx.fill();

      // Black pupil
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.arc(0, -4, 28, 0, Math.PI * 2);
      ctx.fill();

      // Subtle reflective eye catchlight
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-14, -18, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Bold black kohl eye rims (double upper lid crease + almond outline)
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.moveTo(-195, 8);
      ctx.bezierCurveTo(-85, -88, 95, -78, 192, 14);
      ctx.bezierCurveTo(95, 76, -85, 78, -195, 8);
      ctx.closePath();
      ctx.stroke();

      // Upper meditative eyelid fold
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(-175, -18);
      ctx.bezierCurveTo(-75, -108, 88, -102, 178, -12);
      ctx.stroke();

      ctx.restore();
    };

    drawEye(290, 465, 1);
    drawEye(734, 465, -1);

    // Iconic curly Nepali numeral "१" (Ek - Unity of all things) below bridge of nose
    ctx.strokeStyle = '#0f172a';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 34;
    ctx.beginPath();
    // Upper spiral head of Devanagari १
    ctx.arc(512, 650, 54, Math.PI * 0.25, Math.PI * 2.05, true);
    ctx.bezierCurveTo(568, 720, 495, 800, 456, 878);
    ctx.stroke();

    // Fine crimson/white inner border on "१" for crisp heritage relief
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(512, 650, 54, Math.PI * 0.25, Math.PI * 2.05, true);
    ctx.bezierCurveTo(568, 720, 495, 800, 456, 878);
    ctx.stroke();

    return buildTex(c, true, 1, 1, true);
  });

  // 4. Five-Color Harmika Valance Banner Texture (Red / Blue / Yellow / White / Green pleated cloth)
  const valanceTex = getCachedTexture('stupa-harmika-valance', () => {
    const [c, ctx] = makeCanvas(512, 128);
    const colors = ['#1d4ed8', '#f8fafc', '#dc2626', '#16a34a', '#eab308'];
    const bandW = 512 / 10;
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(i * bandW, 0, bandW + 1, 128);
      ctx.fillStyle = 'rgba(0,0,0,0.16)';
      ctx.fillRect(i * bandW, 0, 5, 128);
    }
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, 0, 512, 18);
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(0, 108, 512, 20);
    return buildTex(c, true, 2, 1);
  });

  // 5. Engraved Brass Mani Prayer Wheel Texture
  const prayerWheelTex = getCachedTexture('stupa-mani-wheel-albedo', () => {
    const [c, ctx] = makeCanvas(256, 256);
    const bg = ctx.createLinearGradient(0, 0, 256, 0);
    bg.addColorStop(0, '#b7811f');
    bg.addColorStop(0.5, '#eec154');
    bg.addColorStop(1, '#9d6a14');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 256, 256);
    // Horizontal copper bands & embossed Mantra calligraphy rows
    ctx.fillStyle = '#6b2016';
    ctx.fillRect(0, 18, 256, 20);
    ctx.fillRect(0, 218, 256, 20);
    ctx.fillStyle = '#472808';
    for (let row = 58; row < 200; row += 38) {
      for (let x = 10; x < 246; x += 26) {
        ctx.fillRect(x, row, 18, 18);
        ctx.clearRect?.(0, 0, 0, 0);
        ctx.fillStyle = '#fce08b';
        ctx.fillRect(x + 4, row + 4, 10, 10);
        ctx.fillStyle = '#472808';
      }
    }
    return buildTex(c, true, 1, 1);
  });

  // 6. Kathmandu Granite Flagstones & Ancient Mossy Stone
  const flagstoneAlbedo = getCachedTexture('stupa-granite-flagstone-albedo', () => {
    const s = 512;
    const [c, ctx] = makeCanvas(s, s);
    ctx.fillStyle = '#383e45';
    ctx.fillRect(0, 0, s, s);
    const rows = 8;
    const cols = 6;
    const sh = s / rows;
    const sw = s / cols;
    for (let r = 0; r < rows; r++) {
      const stagger = (r % 2) * (sw * 0.45);
      for (let col = -1; col <= cols; col++) {
        const n = hash2d(col, r, 109);
        const sx = col * sw + stagger + 2.5;
        const sy = r * sh + 2.5;
        const w = sw - 5;
        const h = sh - 5;
        const v = Math.round(114 + n * 34);
        ctx.fillStyle = `rgb(${v - 6}, ${v - 1}, ${v + 9})`;
        ctx.fillRect(sx, sy, w, h);

        if (hash2d(col, r, 137) > 0.54) {
          ctx.fillStyle = 'rgba(66, 98, 48, 0.30)';
          ctx.fillRect(sx - 2, sy - 2, w * 0.48, 4.5);
        }
      }
    }
    // Ceremonial Sindoor vermilion & marigold/saffron festival scatter
    for (let i = 0; i < 28; i++) {
      const px = hash2d(i, 3, 211) * s;
      const py = hash2d(i, 7, 223) * s;
      const rad = 5 + hash2d(i, 1, 233) * 14;
      const isSindoor = i % 2 === 0;
      const g = ctx.createRadialGradient(px, py, 1, px, py, rad);
      g.addColorStop(0, isSindoor ? 'rgba(210, 42, 26, 0.25)' : 'rgba(242, 162, 22, 0.24)');
      g.addColorStop(1, 'rgba(200, 80, 20, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    return buildTex(c, true, 14, 14);
  });

  const flagstoneHeight = (() => {
    const s = 512;
    const [c, ctx] = makeCanvas(s, s);
    ctx.fillStyle = '#2d2d2d';
    ctx.fillRect(0, 0, s, s);
    const rows = 8;
    const cols = 6;
    const sh = s / rows;
    const sw = s / cols;
    for (let r = 0; r < rows; r++) {
      const stagger = (r % 2) * (sw * 0.45);
      for (let col = -1; col <= cols; col++) {
        const n = hash2d(col, r, 109);
        const hv = Math.round(176 + n * 50);
        ctx.fillStyle = `rgb(${hv},${hv},${hv})`;
        ctx.fillRect(col * sw + stagger + 2.5, r * sh + 2.5, sw - 5, sh - 5);
      }
    }
    return c;
  })();

  const flagstoneNormal = getCachedTexture('stupa-granite-flagstone-normal', () =>
    buildTex(heightCanvasToNormal(flagstoneHeight, 2.6), false, 14, 14),
  );
  const flagstoneRough = getCachedTexture('stupa-granite-flagstone-rough', () => {
    const s = 256;
    const [c, ctx] = makeCanvas(s, s);
    ctx.fillStyle = '#c8c8c8';
    ctx.fillRect(0, 0, s, s);
    return buildTex(c, false, 14, 14);
  });

  // 7. Ancient Mossy Carved Volcanic Stone (Chaityas, Swayambhu 365 stairs, Hilltop Parapets)
  const mossyStoneAlbedo = getCachedTexture('stupa-mossy-stone-albedo', () => {
    const s = 512;
    const [c, ctx] = makeCanvas(s, s);
    ctx.fillStyle = '#5c5b57';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 1800; i++) {
      const px = hash2d(i, 2, 17) * s;
      const py = hash2d(i, 5, 31) * s;
      const v = Math.round(74 + hash2d(i, 8, 43) * 44);
      ctx.fillStyle = `rgba(${v},${v},${v - 4},0.35)`;
      ctx.fillRect(px, py, 6, 4);
    }
    // Mossy lichen patches + subtle Sindoor ritual flecks
    for (let i = 0; i < 42; i++) {
      const mx = hash2d(i, 1, 73) * s;
      const my = hash2d(i, 4, 89) * s;
      const r = 10 + hash2d(i, 9, 97) * 26;
      const mg = ctx.createRadialGradient(mx, my, 2, mx, my, r);
      mg.addColorStop(0, i % 7 === 0 ? 'rgba(186, 42, 26, 0.24)' : 'rgba(66, 92, 46, 0.42)');
      mg.addColorStop(1, 'rgba(66, 92, 46, 0)');
      ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.arc(mx, my, r, 0, Math.PI * 2);
      ctx.fill();
    }
    return buildTex(c, true, 3, 3);
  });

  // 8. Red Dachi Appa Brick (matching Pashupatinath / Lumbini / Janaki perimeter fence dwarf wall)
  const brickAlbedo = getCachedTexture('stupa-dachi-brick-albedo', () => {
    const s = 512;
    const [c, ctx] = makeCanvas(s, s);
    ctx.fillStyle = '#241511';
    ctx.fillRect(0, 0, s, s);
    const rows = 16;
    const cols = 6;
    const bh = s / rows;
    const bw = s / cols;
    for (let r = 0; r < rows; r++) {
      const stagger = (r % 2) * (bw * 0.5);
      for (let col = -1; col <= cols; col++) {
        const n = hash2d(col, r, 17);
        const red = Math.round(122 + n * 38);
        const grn = Math.round(36 + n * 18);
        const blu = Math.round(25 + n * 14);
        ctx.fillStyle = `rgb(${red},${grn},${blu})`;
        ctx.fillRect(col * bw + stagger + 1.5, r * bh + 1.5, bw - 3.0, bh - 3.0);
      }
    }
    return buildTex(c, true, 3, 2);
  });
  const brickNormal = getCachedTexture('stupa-dachi-brick-normal', () =>
    buildTex(heightCanvasToNormal(flagstoneHeight, 2.2), false, 3, 2),
  );

  // 9. Tibetan Monastery Vermilion Wood + Gold Leaf Geometric Trim
  const tibetanWoodTex = getCachedTexture('stupa-tibetan-vermilion-wood', () => {
    const s = 512;
    const [c, ctx] = makeCanvas(s, s);
    ctx.fillStyle = '#7c1a16';
    ctx.fillRect(0, 0, s, s);
    for (let x = 0; x < s; x += 4) {
      const v = hash2d(x, 2, 121);
      ctx.fillStyle = v > 0.5 ? 'rgba(155, 36, 26, 0.35)' : 'rgba(56, 10, 8, 0.38)';
      ctx.fillRect(x, 0, 2, s);
    }
    // Gold-leaf Tibetan decorative frieze bands top & bottom
    ctx.fillStyle = '#d99e26';
    ctx.fillRect(0, 0, s, 26);
    ctx.fillRect(0, s - 26, s, 26);
    ctx.strokeStyle = '#60120c';
    ctx.lineWidth = 4;
    for (let x = 16; x < s; x += 32) {
      ctx.strokeRect(x, 4, 20, 18);
      ctx.strokeRect(x, s - 22, 20, 18);
    }
    return buildTex(c, true, 2, 1);
  });

  // 10. Silk Thangka Scroll Painting Texture for Gompa Pillars/Walls
  const thangkaTex = getCachedTexture('stupa-thangka-silk-art', () => {
    const [c, ctx] = makeCanvas(256, 512);
    // Gold-brocade silk frame
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(0, 0, 256, 512);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 14;
    ctx.strokeRect(12, 12, 232, 488);
    // Inner celestial mandala canvas
    const sky = ctx.createLinearGradient(0, 40, 0, 440);
    sky.addColorStop(0, '#0f3a75');
    sky.addColorStop(0.5, '#1e6b8a');
    sky.addColorStop(1, '#1e5c45');
    ctx.fillStyle = sky;
    ctx.fillRect(34, 44, 188, 410);
    // Radiant golden lotus halo & serene Buddha silhouette
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(128, 205, 62, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(128, 205, 42, 0, Math.PI * 2);
    ctx.fill();
    // Golden robe seated figure
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(128, 178, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(128, 250, 42, 46, 0, 0, Math.PI * 2);
    ctx.fill();
    // Lotus throne
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.ellipse(128, 304, 54, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    return buildTex(c, true, 1, 1, true);
  });

  // 11. Heritage Plaque
  const makePlaqueTex = (
    key: string,
    title: string,
    subtitle: string,
    detail: string,
    mantra: string,
  ) =>
    getCachedTexture(key, () => {
      const [c, ctx] = makeCanvas(1024, 512);
      ctx.fillStyle = '#1b1410';
      ctx.fillRect(0, 0, 1024, 512);
      ctx.strokeStyle = '#d4a23a';
      ctx.lineWidth = 14;
      ctx.strokeRect(20, 20, 984, 472);
      ctx.strokeStyle = '#9c6e18';
      ctx.lineWidth = 4;
      ctx.strokeRect(36, 36, 952, 440);

      ctx.fillStyle = '#f3c95b';
      ctx.font = 'bold 46px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, 512, 145);

      ctx.fillStyle = '#f7e6bd';
      ctx.font = '600 31px Georgia, serif';
      ctx.fillText(subtitle, 512, 224);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '25px sans-serif';
      ctx.fillText(detail, 512, 306);

      ctx.fillStyle = '#e5b84b';
      ctx.font = 'italic 24px Georgia, serif';
      ctx.fillText(mantra, 512, 392);
      return buildTex(c, true, 1, 1, true);
    });

  const boudhaPlaqueTex = makePlaqueTex(
    'boudha-unesco-plaque',
    'BOUDHANATH STUPA',
    'Kathmandu, Nepal · UNESCO World Heritage',
    'Three-Tier Mandala Plinth · 108 Prayer Wheels · Walking Tibetan Gompa',
    'ॐ मणि पद्मे हूँ · Kora Dwar Entrance',
  );

  // Materials (globally cached singletons)
  return {
    stupaDomeChhyonMat: getCachedMaterial(textures, 'stupa-dome-chhyon-mat', () =>
      new THREE.MeshStandardMaterial({
        map: chhyonDomeAlbedo,
        normalMap: limeStuccoNormal,
        normalScale: new THREE.Vector2(0.55, 0.55),
        roughnessMap: limeStuccoRough,
        color: 0xffffff,
        roughness: 0.92,
        metalness: 0.01,
      }),
    ),
    whiteStuccoMat: getCachedMaterial(textures, 'stupa-white-stucco-mat', () =>
      new THREE.MeshStandardMaterial({
        normalMap: limeStuccoNormal,
        normalScale: new THREE.Vector2(0.45, 0.45),
        roughnessMap: limeStuccoRough,
        color: 0xf4f0e6,
        roughness: 0.88,
        metalness: 0.02,
      }),
    ),
    gildedCopperMat: getCachedMaterial(textures, 'stupa-gilded-copper-mat', () =>
      new THREE.MeshStandardMaterial({
        map: copperAlbedo,
        normalMap: copperNormal,
        normalScale: new THREE.Vector2(0.65, 0.65),
        roughnessMap: copperRough,
        color: 0xf8d468,
        metalness: 0.92,
        roughness: 0.20,
        side: THREE.DoubleSide,
      }),
    ),
    gildedSpireRingMat: getCachedMaterial(textures, 'stupa-gilded-spire-ring-mat', () =>
      new THREE.MeshStandardMaterial({
        map: copperAlbedo,
        normalMap: copperNormal,
        normalScale: new THREE.Vector2(0.45, 0.45),
        color: 0xf6cf5c,
        metalness: 0.92,
        roughness: 0.20,
      }),
    ),
    prayerWheelBrassMat: getCachedMaterial(textures, 'stupa-prayer-wheel-brass-mat', () =>
      new THREE.MeshStandardMaterial({
        map: prayerWheelTex,
        normalMap: copperNormal,
        normalScale: new THREE.Vector2(0.45, 0.45),
        color: 0xf4ca64,
        metalness: 0.86,
        roughness: 0.26,
      }),
    ),
    harmikaEyesMat: getCachedMaterial(textures, 'stupa-harmika-eyes-mat', () =>
      new THREE.MeshStandardMaterial({
        map: harmikaEyesTex,
        normalMap: copperNormal,
        normalScale: new THREE.Vector2(0.28, 0.28),
        color: 0xffffff,
        metalness: 0.56,
        roughness: 0.30,
      }),
    ),
    valanceClothMat: getCachedMaterial(textures, 'stupa-valance-cloth-mat', () =>
      new THREE.MeshStandardMaterial({
        map: valanceTex,
        roughness: 0.84,
        metalness: 0.02,
        side: THREE.DoubleSide,
      }),
    ),
    graniteFlagstoneMat: getCachedMaterial(textures, 'stupa-granite-flagstone-mat', () =>
      new THREE.MeshStandardMaterial({
        map: flagstoneAlbedo,
        normalMap: flagstoneNormal,
        normalScale: new THREE.Vector2(0.76, 0.76),
        roughnessMap: flagstoneRough,
        color: 0xd6dbe2,
        roughness: 0.86,
        metalness: 0.04,
      }),
    ),
    mossyCarvedStoneMat: getCachedMaterial(textures, 'stupa-mossy-carved-stone-mat', () =>
      new THREE.MeshStandardMaterial({
        map: mossyStoneAlbedo,
        normalMap: flagstoneNormal,
        normalScale: new THREE.Vector2(0.7, 0.7),
        roughness: 0.88,
        metalness: 0.03,
      }),
    ),
    dachiBrickMat: getCachedMaterial(textures, 'stupa-dachi-brick-mat', () =>
      new THREE.MeshStandardMaterial({
        map: brickAlbedo,
        normalMap: brickNormal,
        normalScale: new THREE.Vector2(0.8, 0.8),
        roughness: 0.78,
        metalness: 0.04,
      }),
    ),
    sandstoneCopingMat: getCachedMaterial(textures, 'stupa-sandstone-coping-mat', () =>
      new THREE.MeshStandardMaterial({
        normalMap: textures.sandstoneNormal,
        color: 0xd2c0a0,
        roughness: 0.78,
        metalness: 0.02,
      }),
    ),
    jhingatiRoofMat: getCachedMaterial(textures, 'stupa-jhingati-roof-mat', () =>
      new THREE.MeshStandardMaterial({
        color: 0x6e3528,
        normalMap: brickNormal,
        roughness: 0.76,
        metalness: 0.04,
        side: THREE.DoubleSide,
      }),
    ),
    wroughtIronMat: getCachedMaterial(textures, 'stupa-wrought-iron-mat', () =>
      new THREE.MeshStandardMaterial({
        color: 0x20242b,
        roughness: 0.42,
        metalness: 0.86,
      }),
    ),
    tibetanVermilionWoodMat: getCachedMaterial(textures, 'stupa-tibetan-vermilion-mat', () =>
      new THREE.MeshStandardMaterial({
        map: tibetanWoodTex,
        normalMap: textures.woodNormal,
        normalScale: new THREE.Vector2(0.65, 0.65),
        roughness: 0.48,
        metalness: 0.06,
      }),
    ),
    deepTeakWoodMat: getCachedMaterial(textures, 'stupa-deep-teak-mat', () =>
      new THREE.MeshStandardMaterial({
        map: textures.woodMap,
        normalMap: textures.woodNormal,
        color: 0x5c3621,
        roughness: 0.62,
        metalness: 0.04,
      }),
    ),
    monasteryFloorMat: getCachedMaterial(textures, 'stupa-monastery-floor-mat', () =>
      new THREE.MeshStandardMaterial({
        map: textures.woodMap,
        normalMap: textures.woodNormal,
        color: 0x7c4a26,
        roughness: 0.42,
        metalness: 0.08,
      }),
    ),
    crimsonCushionMat: getCachedMaterial(textures, 'stupa-crimson-cushion-mat', () =>
      new THREE.MeshStandardMaterial({
        color: 0x991b1b,
        roughness: 0.86,
        metalness: 0.02,
      }),
    ),
    thangkaArtMat: getCachedMaterial(textures, 'stupa-thangka-art-mat', () =>
      new THREE.MeshStandardMaterial({
        map: thangkaTex,
        roughness: 0.52,
        metalness: 0.12,
        side: THREE.DoubleSide,
      }),
    ),
    buddhaGoldMat: getCachedMaterial(textures, 'stupa-buddha-gold-mat', () =>
      new THREE.MeshStandardMaterial({
        color: 0xf4c542,
        metalness: 0.90,
        roughness: 0.22,
      }),
    ),
    pondWaterStoneMat: getCachedMaterial(textures, 'stupa-pond-stone-mat', () =>
      new THREE.MeshStandardMaterial({
        color: 0xc2b8a8,
        normalMap: textures.sandstoneNormal,
        roughness: 0.72,
      }),
    ),
    boudhaPlaqueMat: getCachedMaterial(textures, 'boudha-plaque-mat', () =>
      new THREE.MeshStandardMaterial({
        map: boudhaPlaqueTex,
        roughness: 0.42,
        metalness: 0.22,
      }),
    ),
    butterFlameMat: getCachedMaterial(textures, 'stupa-butter-flame-mat', () =>
      new THREE.MeshStandardMaterial({
        color: 0xffeba0,
        emissive: 0xf59e0b,
        emissiveIntensity: 3.1,
        roughness: 0.15,
      }),
    ),
    butterHaloMat: getCachedMaterial(textures, 'stupa-butter-halo-mat', () =>
      new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        transparent: true,
        opacity: 0.34,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    ),
    marigoldMat: getCachedMaterial(textures, 'stupa-marigold-mat', () =>
      new THREE.MeshStandardMaterial({
        color: 0xf97316,
        emissive: 0x7c2d12,
        emissiveIntensity: 0.16,
        roughness: 0.72,
      }),
    ),
    sindoorMat: getCachedMaterial(textures, 'stupa-sindoor-mat', () =>
      new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        emissive: 0x7f1d1d,
        emissiveIntensity: 0.14,
        roughness: 0.85,
      }),
    ),
    newariWallPlasterMat: getCachedMaterial(textures, 'stupa-newari-house-plaster-mat', () =>
      new THREE.MeshStandardMaterial({
        normalMap: limeStuccoNormal,
        color: 0xe6d6bc,
        roughness: 0.84,
        metalness: 0.02,
      }),
    ),
  };
}

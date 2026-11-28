import * as THREE from 'three';
import { getCachedMaterial, getCachedTexture } from './meshOptimization';
import { ProceduralTextureSet } from './proceduralTextures';

export interface PashupatinathPbrMaterials {
  dachiAppaBrickMat: THREE.MeshStandardMaterial;
  dachiAppaSootMat: THREE.MeshStandardMaterial;
  gildedCopperRoofMat: THREE.MeshStandardMaterial;
  gildedTrimMat: THREE.MeshStandardMaterial;
  carvedSalWoodMat: THREE.MeshStandardMaterial;
  salLatticeMat: THREE.MeshStandardMaterial;
  graniteFlagstoneMat: THREE.MeshStandardMaterial;
  granitePlinthMat: THREE.MeshStandardMaterial;
  sanctumFloorMat: THREE.MeshStandardMaterial;
  repousseSilverMat: THREE.MeshStandardMaterial;
  jhingatiTileMat: THREE.MeshStandardMaterial;
  whitePlasterMat: THREE.MeshStandardMaterial;
  creamPolychromeMat: THREE.MeshStandardMaterial;
  crimsonTrimMat: THREE.MeshStandardMaterial;
  wroughtIronMat: THREE.MeshStandardMaterial;
  agedBronzeMat: THREE.MeshStandardMaterial;
  blackBasaltMat: THREE.MeshStandardMaterial;
  sandstoneCopingMat: THREE.MeshStandardMaterial;
  toranaGildedMat: THREE.MeshStandardMaterial;
  shivaMuralMat: THREE.MeshStandardMaterial;
  signboardMat: THREE.MeshStandardMaterial;
  crimsonClothMat: THREE.MeshStandardMaterial;
  marigoldMat: THREE.MeshStandardMaterial;
  belLeafMat: THREE.MeshStandardMaterial;
  sindoorMat: THREE.MeshStandardMaterial;
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
    return [{ width: w, height: h, getContext: () => fakeCtx } as unknown as HTMLCanvasElement, fakeCtx];
  }
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d', { willReadFrequently: true })!];
}

function hash2d(x: number, y: number, seed = 41): number {
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
 * Generates and globally caches singleton PBR textures & materials for the Pashupatinath complex:
 * Dachi Appa glazed brick, Repoussé Gilded Copper, Carved Aged Sal Wood,
 * Kathmandu Granite Flagstones (with moss & Sindoor/Kesari stains), and Repoussé Silver Plate.
 */
export function getPashupatinathMaterials(textures: ProceduralTextureSet): PashupatinathPbrMaterials {
  // 1. Newari Dachi Appa Glazed Terracotta Brick (Albedo + Sobel Normal + Roughness)
  const dachiBrickAlbedo = getCachedTexture('pashupati-dachi-albedo', () => {
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
        const bx = col * bw + stagger + 1.5;
        const by = r * bh + 1.5;
        const w = bw - 3.0;
        const h = bh - 3.0;
        const grad = ctx.createLinearGradient(bx, by, bx, by + h);
        const red = Math.round(118 + n * 42);
        const grn = Math.round(32 + n * 22);
        const blu = Math.round(24 + n * 16);
        grad.addColorStop(0, `rgb(${red + 14}, ${grn + 8}, ${blu + 5})`);
        grad.addColorStop(0.55, `rgb(${red}, ${grn}, ${blu})`);
        grad.addColorStop(1, `rgb(${Math.max(55, red - 26)}, ${Math.max(16, grn - 10)}, ${Math.max(12, blu - 8)})`);
        ctx.fillStyle = grad;
        ctx.fillRect(bx, by, w, h);

        // Micro-pitted clay glaze sheen highlight
        for (let p = 0; p < 12; p++) {
          const px = bx + hash2d(col * 19 + p, r, 31) * w;
          const py = by + hash2d(col, r * 23 + p, 53) * h;
          ctx.fillStyle = p % 3 === 0 ? 'rgba(225,130,90,0.12)' : 'rgba(26,12,10,0.22)';
          ctx.fillRect(px, py, 2.2, 2.2);
        }
      }
    }
    // Subtle soot weathering gradient across upper seam bands
    const soot = ctx.createLinearGradient(0, 0, 0, s);
    soot.addColorStop(0, 'rgba(18, 12, 10, 0.24)');
    soot.addColorStop(0.28, 'rgba(18, 12, 10, 0.0)');
    soot.addColorStop(0.85, 'rgba(18, 12, 10, 0.06)');
    soot.addColorStop(1, 'rgba(14, 10, 8, 0.22)');
    ctx.fillStyle = soot;
    ctx.fillRect(0, 0, s, s);
    return buildTex(c, true, 3, 2.4);
  });

  const dachiBrickHeight = (() => {
    const s = 512;
    const [c, ctx] = makeCanvas(s, s);
    ctx.fillStyle = '#202020';
    ctx.fillRect(0, 0, s, s);
    const rows = 16;
    const cols = 6;
    const bh = s / rows;
    const bw = s / cols;
    for (let r = 0; r < rows; r++) {
      const stagger = (r % 2) * (bw * 0.5);
      for (let col = -1; col <= cols; col++) {
        const n = hash2d(col, r, 17);
        const hVal = Math.round(176 + n * 48);
        ctx.fillStyle = `rgb(${hVal},${hVal},${hVal})`;
        ctx.fillRect(col * bw + stagger + 1.5, r * bh + 1.5, bw - 3.0, bh - 3.0);
      }
    }
    return c;
  })();

  const dachiBrickNormal = getCachedTexture('pashupati-dachi-normal', () =>
    buildTex(heightCanvasToNormal(dachiBrickHeight, 3.0), false, 3, 2.4),
  );
  const dachiBrickRough = getCachedTexture('pashupati-dachi-rough', () => {
    const s = 512;
    const [c, ctx] = makeCanvas(s, s);
    ctx.fillStyle = '#b4b4b4';
    ctx.fillRect(0, 0, s, s);
    const rows = 16;
    const cols = 6;
    const bh = s / rows;
    const bw = s / cols;
    for (let r = 0; r < rows; r++) {
      const stagger = (r % 2) * (bw * 0.5);
      for (let col = -1; col <= cols; col++) {
        const n = hash2d(col, r, 73);
        const rVal = Math.round(92 + n * 48); // semi-glazed terracotta sheen
        ctx.fillStyle = `rgb(${rVal},${rVal},${rVal})`;
        ctx.fillRect(col * bw + stagger + 1.5, r * bh + 1.5, bw - 3.0, bh - 3.0);
      }
    }
    return buildTex(c, false, 3, 2.4);
  });

  // 2. Repoussé Gilded Copper (metalness: 0.92, roughness: 0.20)
  const copperGoldAlbedo = getCachedTexture('pashupati-gold-copper-albedo', () => {
    const s = 512;
    const [c, ctx] = makeCanvas(s, s);
    const bg = ctx.createLinearGradient(0, 0, s, s);
    bg.addColorStop(0, '#e8b944');
    bg.addColorStop(0.5, '#f6cf5e');
    bg.addColorStop(1, '#d39b28');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, s, s);

    // Hammered repoussé sheet panels & raised vertical standing seams
    const bays = 8;
    const bayW = s / bays;
    for (let b = 0; b < bays; b++) {
      const x = b * bayW;
      ctx.fillStyle = 'rgba(130, 82, 12, 0.42)';
      ctx.fillRect(x, 0, 4, s);
      ctx.fillStyle = 'rgba(255, 240, 175, 0.52)';
      ctx.fillRect(x + 4, 0, 3, s);
      // Embossed lotus/mandala medallions down sheet center
      for (let y = 32; y < s; y += 64) {
        ctx.strokeStyle = 'rgba(155, 96, 16, 0.36)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + bayW * 0.5, y, 14, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    // Hammer dimples
    for (let i = 0; i < 1400; i++) {
      const px = hash2d(i, 3, 91) * s;
      const py = hash2d(i, 7, 97) * s;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,244,185,0.16)' : 'rgba(140,86,14,0.14)';
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    return buildTex(c, true, 4, 2);
  });

  const copperGoldHeight = (() => {
    const s = 512;
    const [c, ctx] = makeCanvas(s, s);
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, s, s);
    const bays = 8;
    const bayW = s / bays;
    for (let b = 0; b < bays; b++) {
      const x = b * bayW;
      ctx.fillStyle = '#efefef'; // raised vertical standing seam
      ctx.fillRect(x, 0, 6, s);
      for (let y = 32; y < s; y += 64) {
        ctx.strokeStyle = '#c8c8c8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x + bayW * 0.5, y, 14, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    return c;
  })();

  const copperGoldNormal = getCachedTexture('pashupati-gold-copper-normal', () =>
    buildTex(heightCanvasToNormal(copperGoldHeight, 2.4), false, 4, 2),
  );
  const copperGoldRough = getCachedTexture('pashupati-gold-copper-rough', () => {
    const s = 256;
    const [c, ctx] = makeCanvas(s, s);
    ctx.fillStyle = '#383838'; // ~0.22 roughness base
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 600; i++) {
      const v = 36 + Math.round(hash2d(i, 5, 19) * 32);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(hash2d(i, 1, 29) * s, hash2d(i, 2, 37) * s, 4, 4);
    }
    return buildTex(c, false, 4, 2);
  });

  // 3. Carved Aged Sal Wood (dark mahogany/ebony-brown Nepali timber)
  const salWoodAlbedo = getCachedTexture('pashupati-sal-albedo', () => {
    const s = 512;
    const [c, ctx] = makeCanvas(s, s);
    ctx.fillStyle = '#331d13';
    ctx.fillRect(0, 0, s, s);
    for (let x = 0; x < s; x += 3) {
      const g = hash2d(x, 1, 47);
      ctx.fillStyle = g > 0.5 ? 'rgba(66, 38, 24, 0.45)' : 'rgba(22, 12, 8, 0.45)';
      ctx.fillRect(x, 0, 2, s);
    }
    // Carved geometric border friezes
    for (let y = 0; y < s; y += 64) {
      ctx.strokeStyle = 'rgba(20, 10, 6, 0.55)';
      ctx.lineWidth = 2;
      ctx.strokeRect(4, y + 4, s - 8, 56);
    }
    return buildTex(c, true, 2, 2);
  });

  const salWoodHeight = (() => {
    const s = 512;
    const [c, ctx] = makeCanvas(s, s);
    ctx.fillStyle = '#909090';
    ctx.fillRect(0, 0, s, s);
    for (let x = 0; x < s; x += 4) {
      const hVal = 110 + Math.round(hash2d(x, 2, 59) * 65);
      ctx.fillStyle = `rgb(${hVal},${hVal},${hVal})`;
      ctx.fillRect(x, 0, 2, s);
    }
    return c;
  })();

  const salWoodNormal = getCachedTexture('pashupati-sal-normal', () =>
    buildTex(heightCanvasToNormal(salWoodHeight, 2.2), false, 2, 2),
  );

  // 4. Kathmandu Valley Granite & Basalt Flagstones (moss crevices + Sindoor vermilion & Kesari saffron stains)
  const flagstoneAlbedo = getCachedTexture('pashupati-flagstone-albedo', () => {
    const s = 512;
    const [c, ctx] = makeCanvas(s, s);
    ctx.fillStyle = '#3a3f42';
    ctx.fillRect(0, 0, s, s);
    const rows = 8;
    const cols = 6;
    const sh = s / rows;
    const sw = s / cols;
    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (sw * 0.45);
      for (let col = -1; col <= cols; col++) {
        const n = hash2d(col, r, 103);
        const sx = col * sw + offset + 2.5;
        const sy = r * sh + 2.5;
        const w = sw - 5;
        const h = sh - 5;
        const base = Math.round(108 + n * 34);
        ctx.fillStyle = `rgb(${base - 4}, ${base}, ${base + 8})`;
        ctx.fillRect(sx, sy, w, h);

        // Subtle moss along mortar seams
        if (hash2d(col, r, 131) > 0.56) {
          ctx.fillStyle = 'rgba(72, 98, 52, 0.28)';
          ctx.fillRect(sx - 2, sy - 2, w * 0.45, 4);
        }
      }
    }
    // Scattered ceremonial Sindoor (vermilion) & Kesari (saffron) powder traces
    for (let i = 0; i < 24; i++) {
      const px = hash2d(i, 3, 211) * s;
      const py = hash2d(i, 9, 223) * s;
      const rad = 6 + hash2d(i, 1, 227) * 14;
      const isSindoor = i % 2 === 0;
      const g = ctx.createRadialGradient(px, py, 1, px, py, rad);
      g.addColorStop(0, isSindoor ? 'rgba(205, 44, 28, 0.26)' : 'rgba(232, 152, 24, 0.22)');
      g.addColorStop(1, 'rgba(200, 80, 20, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    return buildTex(c, true, 16, 18);
  });

  const flagstoneHeight = (() => {
    const s = 512;
    const [c, ctx] = makeCanvas(s, s);
    ctx.fillStyle = '#303030';
    ctx.fillRect(0, 0, s, s);
    const rows = 8;
    const cols = 6;
    const sh = s / rows;
    const sw = s / cols;
    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (sw * 0.45);
      for (let col = -1; col <= cols; col++) {
        const n = hash2d(col, r, 103);
        const hv = Math.round(175 + n * 50);
        ctx.fillStyle = `rgb(${hv},${hv},${hv})`;
        ctx.fillRect(col * sw + offset + 2.5, r * sh + 2.5, sw - 5, sh - 5);
      }
    }
    return c;
  })();

  const flagstoneNormal = getCachedTexture('pashupati-flagstone-normal', () =>
    buildTex(heightCanvasToNormal(flagstoneHeight, 2.5), false, 16, 18),
  );
  const flagstoneRough = getCachedTexture('pashupati-flagstone-rough', () => {
    const s = 256;
    const [c, ctx] = makeCanvas(s, s);
    ctx.fillStyle = '#c4c4c4';
    ctx.fillRect(0, 0, s, s);
    return buildTex(c, false, 16, 18);
  });

  // 5. Repoussé Silver Plate (metalness: 0.94, roughness: 0.18, oxidized dark recesses)
  const silverAlbedo = getCachedTexture('pashupati-silver-albedo', () => {
    const s = 512;
    const [c, ctx] = makeCanvas(s, s);
    ctx.fillStyle = '#e5e9ef';
    ctx.fillRect(0, 0, s, s);

    // Ornate embossed grid + lotus rosettes + oxidized silver borders
    const panelsX = 4;
    const panelsY = 6;
    const pw = s / panelsX;
    const ph = s / panelsY;
    for (let py = 0; py < panelsY; py++) {
      for (let px = 0; px < panelsX; px++) {
        const x = px * pw;
        const y = py * ph;
        ctx.strokeStyle = 'rgba(42, 46, 56, 0.72)';
        ctx.lineWidth = 4;
        ctx.strokeRect(x + 6, y + 6, pw - 12, ph - 12);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 11, y + 11, pw - 22, ph - 22);
        // Central repoussé lotus medallion
        ctx.fillStyle = 'rgba(65, 70, 82, 0.36)';
        ctx.beginPath();
        ctx.arc(x + pw * 0.5, y + ph * 0.5, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(x + pw * 0.5, y + ph * 0.5, 11, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    return buildTex(c, true, 1, 1);
  });

  const silverHeight = (() => {
    const s = 512;
    const [c, ctx] = makeCanvas(s, s);
    ctx.fillStyle = '#707070';
    ctx.fillRect(0, 0, s, s);
    const panelsX = 4;
    const panelsY = 6;
    const pw = s / panelsX;
    const ph = s / panelsY;
    for (let py = 0; py < panelsY; py++) {
      for (let px = 0; px < panelsX; px++) {
        const x = px * pw;
        const y = py * ph;
        ctx.strokeStyle = '#ececec';
        ctx.lineWidth = 5;
        ctx.strokeRect(x + 10, y + 10, pw - 20, ph - 20);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x + pw * 0.5, y + ph * 0.5, 12, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    return c;
  })();

  const silverNormal = getCachedTexture('pashupati-silver-normal', () =>
    buildTex(heightCanvasToNormal(silverHeight, 2.8), false, 1, 1),
  );

  // 6. Jhingati Clay Roof Tiles
  const jhingatiAlbedo = getCachedTexture('pashupati-jhingati-albedo', () => {
    const s = 256;
    const [c, ctx] = makeCanvas(s, s);
    ctx.fillStyle = '#48241d';
    ctx.fillRect(0, 0, s, s);
    for (let r = 0; r < 14; r++) {
      const y = (r / 14) * s;
      for (let col = 0; col < 12; col++) {
        const x = (col / 12) * s;
        const n = hash2d(col, r, 151);
        ctx.fillStyle = `rgb(${Math.round(92 + n * 34)}, ${Math.round(42 + n * 18)}, ${Math.round(32 + n * 14)})`;
        ctx.fillRect(x + 1, y + 1, s / 12 - 2, s / 14 - 2);
      }
    }
    return buildTex(c, true, 3, 3);
  });

  // 7. Pashupatinath Heritage UNESCO Signboard
  const signboardTex = getCachedTexture('pashupati-unesco-signboard', () => {
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
    ctx.font = 'bold 48px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('PASHUPATINATH TEMPLE COMPLEX', 512, 145);

    ctx.fillStyle = '#f7e6bd';
    ctx.font = '600 32px Georgia, serif';
    ctx.fillText('UNESCO World Heritage Site · Kathmandu, Nepal', 512, 222);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '26px sans-serif';
    ctx.fillText('5th Century Pagoda · Chaturmukha Shiva Lingam · Bagmati Sacred Ghats', 512, 305);

    ctx.fillStyle = '#e5b84b';
    ctx.font = 'italic 24px Georgia, serif';
    ctx.fillText('ॐ श्री पशुपतये नमः · Paschim Dwar Entrance', 512, 392);
    return buildTex(c, true, 1, 1, true);
  });

  // 8. Paschim Dwar Polychrome Shiva / Om Arch Mural Texture
  const shivaMuralTex = getCachedTexture('pashupati-shiva-mural', () => {
    const [c, ctx] = makeCanvas(512, 512);
    const sky = ctx.createLinearGradient(0, 0, 0, 512);
    sky.addColorStop(0, '#1e4e79');
    sky.addColorStop(0.55, '#64a5d6');
    sky.addColorStop(1, '#2f7a6d');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 512, 512);

    // Himalayan snow peaks backdrop
    ctx.fillStyle = '#eef6ff';
    ctx.beginPath();
    ctx.moveTo(0, 320);
    ctx.lineTo(110, 145);
    ctx.lineTo(220, 260);
    ctx.lineTo(310, 115);
    ctx.lineTo(420, 240);
    ctx.lineTo(512, 155);
    ctx.lineTo(512, 350);
    ctx.lineTo(0, 350);
    ctx.closePath();
    ctx.fill();

    // Stylized Lord Shiva & Golden Om aura
    ctx.fillStyle = 'rgba(255, 220, 120, 0.45)';
    ctx.beginPath();
    ctx.arc(256, 210, 74, 0, Math.PI * 2);
    ctx.fill();

    // Blue silhouette of Lord Shiva holding Golden Trishul
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(256, 195, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(228, 225, 56, 98);
    // Tiger skin wrap
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(226, 290, 60, 46);
    // Golden Trishul
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(332, 390);
    ctx.lineTo(332, 120);
    ctx.moveTo(304, 155);
    ctx.quadraticCurveTo(332, 192, 360, 155);
    ctx.stroke();

    // Ornate golden border
    ctx.strokeStyle = '#f5c542';
    ctx.lineWidth = 18;
    ctx.strokeRect(10, 10, 492, 492);
    return buildTex(c, true, 1, 1, true);
  });

  // Materials (globally cached singletons)
  const dachiAppaBrickMat = getCachedMaterial(textures, 'pashupati-dachi-brick-mat', () =>
    new THREE.MeshStandardMaterial({
      map: dachiBrickAlbedo,
      normalMap: dachiBrickNormal,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughnessMap: dachiBrickRough,
      roughness: 0.78,
      metalness: 0.04,
    }),
  );

  const dachiAppaSootMat = getCachedMaterial(textures, 'pashupati-dachi-soot-mat', () =>
    new THREE.MeshStandardMaterial({
      map: dachiBrickAlbedo,
      normalMap: dachiBrickNormal,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughnessMap: dachiBrickRough,
      color: 0xc29e96,
      roughness: 0.84,
      metalness: 0.02,
    }),
  );

  const gildedCopperRoofMat = getCachedMaterial(textures, 'pashupati-gilded-copper-mat', () =>
    new THREE.MeshStandardMaterial({
      map: copperGoldAlbedo,
      normalMap: copperGoldNormal,
      normalScale: new THREE.Vector2(0.62, 0.62),
      roughnessMap: copperGoldRough,
      color: 0xf7cf6d,
      metalness: 0.90,
      roughness: 0.96,
      side: THREE.DoubleSide,
    }),
  );

  const gildedTrimMat = getCachedMaterial(textures, 'pashupati-gilded-trim-mat', () =>
    new THREE.MeshStandardMaterial({
      map: copperGoldAlbedo,
      normalMap: copperGoldNormal,
      normalScale: new THREE.Vector2(0.42, 0.42),
      color: 0xf7cf5c,
      metalness: 0.91,
      roughness: 0.22,
    }),
  );

  const carvedSalWoodMat = getCachedMaterial(textures, 'pashupati-sal-wood-mat', () =>
    new THREE.MeshStandardMaterial({
      map: salWoodAlbedo,
      normalMap: salWoodNormal,
      normalScale: new THREE.Vector2(0.82, 0.82),
      color: 0xc8a48c,
      roughness: 0.55,
      metalness: 0.05,
    }),
  );

  const salLatticeMat = getCachedMaterial(textures, 'pashupati-sal-lattice-mat', () =>
    new THREE.MeshStandardMaterial({
      map: salWoodAlbedo,
      normalMap: salWoodNormal,
      color: 0x9b745d,
      roughness: 0.58,
      metalness: 0.04,
    }),
  );

  const graniteFlagstoneMat = getCachedMaterial(textures, 'pashupati-granite-flagstone-mat', () =>
    new THREE.MeshStandardMaterial({
      map: flagstoneAlbedo,
      normalMap: flagstoneNormal,
      normalScale: new THREE.Vector2(0.72, 0.72),
      roughnessMap: flagstoneRough,
      color: 0xd4d8de,
      roughness: 0.88,
      metalness: 0.03,
    }),
  );

  const granitePlinthMat = getCachedMaterial(textures, 'pashupati-granite-plinth-mat', () =>
    new THREE.MeshStandardMaterial({
      normalMap: flagstoneNormal,
      normalScale: new THREE.Vector2(0.45, 0.45),
      color: 0x858b94,
      roughness: 0.82,
      metalness: 0.04,
    }),
  );

  const sanctumFloorMat = getCachedMaterial(textures, 'pashupati-sanctum-floor-mat', () =>
    new THREE.MeshStandardMaterial({
      normalMap: flagstoneNormal,
      normalScale: new THREE.Vector2(0.32, 0.32),
      color: 0x3b4048,
      roughness: 0.36,
      metalness: 0.14,
    }),
  );

  const repousseSilverMat = getCachedMaterial(textures, 'pashupati-silver-mat', () =>
    new THREE.MeshStandardMaterial({
      map: silverAlbedo,
      normalMap: silverNormal,
      normalScale: new THREE.Vector2(0.75, 0.75),
      color: 0xf4f7fb,
      metalness: 0.94,
      roughness: 0.18,
    }),
  );

  const jhingatiTileMat = getCachedMaterial(textures, 'pashupati-jhingati-mat', () =>
    new THREE.MeshStandardMaterial({
      map: jhingatiAlbedo,
      normalMap: dachiBrickNormal,
      normalScale: new THREE.Vector2(0.65, 0.65),
      color: 0xb87e6d,
      roughness: 0.76,
      metalness: 0.04,
      side: THREE.DoubleSide,
    }),
  );

  const whitePlasterMat = getCachedMaterial(textures, 'pashupati-white-plaster-mat', () =>
    new THREE.MeshStandardMaterial({
      normalMap: textures.sandstoneNormal,
      normalScale: new THREE.Vector2(0.32, 0.32),
      color: 0xe6e0d2,
      roughness: 0.84,
      metalness: 0.02,
    }),
  );

  const creamPolychromeMat = getCachedMaterial(textures, 'pashupati-cream-polychrome-mat', () =>
    new THREE.MeshStandardMaterial({
      normalMap: textures.sandstoneNormal,
      color: 0xe9d399,
      roughness: 0.74,
      metalness: 0.03,
    }),
  );

  const crimsonTrimMat = getCachedMaterial(textures, 'pashupati-crimson-trim-mat', () =>
    new THREE.MeshStandardMaterial({
      color: 0x99201c,
      roughness: 0.66,
      metalness: 0.05,
    }),
  );

  const wroughtIronMat = getCachedMaterial(textures, 'pashupati-wrought-iron-mat', () =>
    new THREE.MeshStandardMaterial({
      color: 0x22262d,
      roughness: 0.42,
      metalness: 0.86,
    }),
  );

  const agedBronzeMat = getCachedMaterial(textures, 'pashupati-aged-bronze-mat', () =>
    new THREE.MeshStandardMaterial({
      color: 0x6b4f2d,
      roughness: 0.34,
      metalness: 0.86,
    }),
  );

  const blackBasaltMat = getCachedMaterial(textures, 'pashupati-black-basalt-mat', () =>
    new THREE.MeshStandardMaterial({
      color: 0x23262b,
      roughness: 0.28,
      metalness: 0.16,
    }),
  );

  const sandstoneCopingMat = getCachedMaterial(textures, 'pashupati-sandstone-coping-mat', () =>
    new THREE.MeshStandardMaterial({
      normalMap: textures.sandstoneNormal,
      color: 0xd0be9e,
      roughness: 0.78,
      metalness: 0.02,
    }),
  );

  const toranaGildedMat = getCachedMaterial(textures, 'pashupati-torana-gilded-mat', () =>
    new THREE.MeshStandardMaterial({
      map: silverAlbedo,
      normalMap: silverNormal,
      normalScale: new THREE.Vector2(0.85, 0.85),
      color: 0xf6ce58,
      metalness: 0.92,
      roughness: 0.22,
    }),
  );

  const shivaMuralMat = getCachedMaterial(textures, 'pashupati-shiva-mural-mat', () =>
    new THREE.MeshStandardMaterial({
      map: shivaMuralTex,
      roughness: 0.48,
      metalness: 0.06,
    }),
  );

  const signboardMat = getCachedMaterial(textures, 'pashupati-unesco-sign-mat', () =>
    new THREE.MeshStandardMaterial({
      map: signboardTex,
      roughness: 0.42,
      metalness: 0.22,
    }),
  );

  const crimsonClothMat = getCachedMaterial(textures, 'pashupati-crimson-cloth-mat', () =>
    new THREE.MeshStandardMaterial({
      color: 0xb91c1c,
      roughness: 0.82,
      metalness: 0.02,
      side: THREE.DoubleSide,
    }),
  );

  const marigoldMat = getCachedMaterial(textures, 'pashupati-marigold-mat', () =>
    new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0x7c2d12,
      emissiveIntensity: 0.16,
      roughness: 0.72,
    }),
  );

  const belLeafMat = getCachedMaterial(textures, 'pashupati-bel-leaf-mat', () =>
    new THREE.MeshStandardMaterial({
      color: 0x2f7d32,
      roughness: 0.62,
      metalness: 0.02,
      side: THREE.DoubleSide,
    }),
  );

  const sindoorMat = getCachedMaterial(textures, 'pashupati-sindoor-mat', () =>
    new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.14,
      roughness: 0.88,
    }),
  );

  return {
    dachiAppaBrickMat,
    dachiAppaSootMat,
    gildedCopperRoofMat,
    gildedTrimMat,
    carvedSalWoodMat,
    salLatticeMat,
    graniteFlagstoneMat,
    granitePlinthMat,
    sanctumFloorMat,
    repousseSilverMat,
    jhingatiTileMat,
    whitePlasterMat,
    creamPolychromeMat,
    crimsonTrimMat,
    wroughtIronMat,
    agedBronzeMat,
    blackBasaltMat,
    sandstoneCopingMat,
    toranaGildedMat,
    shivaMuralMat,
    signboardMat,
    crimsonClothMat,
    marigoldMat,
    belLeafMat,
    sindoorMat,
  };
}

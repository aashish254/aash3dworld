import * as THREE from 'three';
import { getCachedMaterial, getCachedTexture } from './meshOptimization';
import { ProceduralTextureSet } from './proceduralTextures';

export interface PumdikotPbrMaterials {
  diamondPlazaMat: THREE.MeshStandardMaterial;
  blushRotundaMat: THREE.MeshStandardMaterial;
  whitePlasterMat: THREE.MeshStandardMaterial;
  ribbedDomeMat: THREE.MeshStandardMaterial;
  blueMosaicMat: THREE.MeshStandardMaterial;
  emeraldRoofMat: THREE.MeshStandardMaterial;
  crimsonGateMat: THREE.MeshStandardMaterial;
  dachiAppaBrickMat: THREE.MeshStandardMaterial;
  graniteCurbMat: THREE.MeshStandardMaterial;
  greyPagodaStoneMat: THREE.MeshStandardMaterial;
  carvedTimberMat: THREE.MeshStandardMaterial;
  wroughtIronMat: THREE.MeshStandardMaterial;
  stainlessRailMat: THREE.MeshStandardMaterial;
  polishedBrassMat: THREE.MeshStandardMaterial;
  goldMat: THREE.MeshStandardMaterial;
  copperMat: THREE.MeshStandardMaterial;
  shivaBlueMat: THREE.MeshStandardMaterial;
  shivaHairMat: THREE.MeshStandardMaterial;
  silverMoonMat: THREE.MeshStandardMaterial;
  tigerPeltMat: THREE.MeshStandardMaterial;
  rudrakshaMat: THREE.MeshStandardMaterial;
  blackBasaltMat: THREE.MeshStandardMaterial;
  sphatikCrystalMat: THREE.MeshPhysicalMaterial;
  garbhagrihaFloorMat: THREE.MeshStandardMaterial;
  signboardMat: THREE.MeshStandardMaterial;
  omPedimentMat: THREE.MeshStandardMaterial;
  kailashMuralMat: THREE.MeshStandardMaterial;
  skylightGlassMat: THREE.MeshStandardMaterial;
  warmLampMat: THREE.MeshStandardMaterial;
  saffronClothMat: THREE.MeshStandardMaterial;
  marigoldMat: THREE.MeshStandardMaterial;
  belLeafMat: THREE.MeshStandardMaterial;
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

function hash2d(x: number, y: number, seed = 73): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  return n - Math.floor(n);
}

function heightCanvasToNormal(heightCanvas: HTMLCanvasElement, strength = 2.4): HTMLCanvasElement {
  const w = heightCanvas.width;
  const h = heightCanvas.height;
  const ctx = heightCanvas.getContext('2d', { willReadFrequently: true });
  const [nCan, nCtx] = makeCanvas(w, h);
  if (!ctx) return nCan;
  const src = ctx.getImageData(0, 0, w, h).data;
  const dst = nCtx.createImageData(w, h);
  const sample = (px: number, py: number) => {
    const sx = ((px % w) + w) % w;
    const sy = ((py % h) + h) % h;
    return src[(sy * w + sx) * 4] / 255;
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (sample(x + 1, y) - sample(x - 1, y)) * strength;
      const dy = (sample(x, y + 1) - sample(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const idx = (y * w + x) * 4;
      dst.data[idx] = Math.round(((-dx / len) * 0.5 + 0.5) * 255);
      dst.data[idx + 1] = Math.round(((-dy / len) * 0.5 + 0.5) * 255);
      dst.data[idx + 2] = Math.round(((1 / len) * 0.5 + 0.5) * 255);
      dst.data[idx + 3] = 255;
    }
  }
  nCtx.putImageData(dst, 0, 0);
  return nCan;
}

function buildDiamondPlazaTextures(): {
  map: THREE.CanvasTexture;
  normal: THREE.CanvasTexture;
  rough: THREE.CanvasTexture;
} {
  const map = getCachedTexture('pumdikot-diamond-map', () => {
    const [c, ctx] = makeCanvas(512, 512);
    ctx.fillStyle = '#c8c3b8';
    ctx.fillRect(0, 0, 512, 512);
    // Rotated 45-degree checkerboard of slate-blue granite & ivory-cream marble diamonds
    const cells = 4;
    const step = 512 / cells;
    ctx.save();
    ctx.translate(256, 256);
    ctx.rotate(Math.PI * 0.25);
    const span = 512 * 1.6;
    const half = span * 0.5;
    const count = Math.ceil(span / (step * 0.707));
    const unit = step * 0.7071;
    for (let ix = -count; ix <= count; ix++) {
      for (let iy = -count; iy <= count; iy++) {
        const isDark = ((ix + iy) & 1) === 0;
        const n = hash2d(ix + 31, iy + 17, 11);
        if (isDark) {
          const r = Math.round(92 + n * 14);
          const g = Math.round(106 + n * 14);
          const b = Math.round(120 + n * 16);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
        } else {
          const r = Math.round(226 + n * 12);
          const g = Math.round(220 + n * 12);
          const b = Math.round(206 + n * 12);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
        }
        const px = ix * unit;
        const py = iy * unit;
        if (px + unit < -half || px > half || py + unit < -half || py > half) continue;
        ctx.fillRect(px + 2, py + 2, unit - 4, unit - 4);
      }
    }
    ctx.restore();
    // Subtle granite speckles
    for (let i = 0; i < 4200; i++) {
      const sx = hash2d(i, 1, 91) * 512;
      const sy = hash2d(i, 2, 92) * 512;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(25,35,48,0.07)';
      ctx.fillRect(sx, sy, 2, 2);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(16, 20);
    tex.anisotropy = 8;
    return tex;
  });

  const normal = getCachedTexture('pumdikot-diamond-normal', () => {
    const [hc, hCtx] = makeCanvas(512, 512);
    hCtx.fillStyle = '#909090';
    hCtx.fillRect(0, 0, 512, 512);
    const unit = (512 / 4) * 0.7071;
    hCtx.save();
    hCtx.translate(256, 256);
    hCtx.rotate(Math.PI * 0.25);
    const count = 12;
    for (let ix = -count; ix <= count; ix++) {
      for (let iy = -count; iy <= count; iy++) {
        hCtx.fillStyle = ((ix + iy) & 1) === 0 ? '#dcdcdc' : '#e6e6e6';
        hCtx.fillRect(ix * unit + 2.5, iy * unit + 2.5, unit - 5, unit - 5);
      }
    }
    hCtx.restore();
    const tex = new THREE.CanvasTexture(heightCanvasToNormal(hc, 2.2));
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(16, 20);
    tex.anisotropy = 8;
    return tex;
  });

  const rough = getCachedTexture('pumdikot-diamond-rough', () => {
    const [c, ctx] = makeCanvas(512, 512);
    ctx.fillStyle = '#969696';
    ctx.fillRect(0, 0, 512, 512);
    const unit = (512 / 4) * 0.7071;
    ctx.save();
    ctx.translate(256, 256);
    ctx.rotate(Math.PI * 0.25);
    for (let ix = -12; ix <= 12; ix++) {
      for (let iy = -12; iy <= 12; iy++) {
        ctx.fillStyle = ((ix + iy) & 1) === 0 ? '#6e6e6e' : '#585858';
        ctx.fillRect(ix * unit + 2.5, iy * unit + 2.5, unit - 5, unit - 5);
      }
    }
    ctx.restore();
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(16, 20);
    return tex;
  });

  return { map, normal, rough };
}

function buildBlueMosaicTextures(): {
  map: THREE.CanvasTexture;
  normal: THREE.CanvasTexture;
} {
  const map = getCachedTexture('pumdikot-blue-mosaic-map', () => {
    const [c, ctx] = makeCanvas(256, 256);
    ctx.fillStyle = '#dbeafe';
    ctx.fillRect(0, 0, 256, 256);
    const cols = 16;
    const sz = 256 / cols;
    for (let y = 0; y < cols; y++) {
      for (let x = 0; x < cols; x++) {
        const n = hash2d(x, y, 53);
        if (n < 0.32) ctx.fillStyle = '#0e6d9c';
        else if (n < 0.68) ctx.fillStyle = '#1488bd';
        else ctx.fillStyle = '#22a4d6';
        ctx.fillRect(x * sz + 1, y * sz + 1, sz - 2, sz - 2);
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    tex.anisotropy = 4;
    return tex;
  });

  const normal = getCachedTexture('pumdikot-blue-mosaic-normal', () => {
    const [hc, hCtx] = makeCanvas(256, 256);
    hCtx.fillStyle = '#707070';
    hCtx.fillRect(0, 0, 256, 256);
    const cols = 16;
    const sz = 256 / cols;
    hCtx.fillStyle = '#f0f0f0';
    for (let y = 0; y < cols; y++) {
      for (let x = 0; x < cols; x++) {
        hCtx.fillRect(x * sz + 1.5, y * sz + 1.5, sz - 3, sz - 3);
      }
    }
    const tex = new THREE.CanvasTexture(heightCanvasToNormal(hc, 2.0));
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    return tex;
  });

  return { map, normal };
}

function buildRibbedDomeTexture(): THREE.CanvasTexture {
  return getCachedTexture('pumdikot-ribbed-dome-map', () => {
    const [c, ctx] = makeCanvas(512, 512);
    ctx.fillStyle = '#f4f1ea';
    ctx.fillRect(0, 0, 512, 512);
    const rows = 28;
    const rowH = 512 / rows;
    for (let r = 0; r < rows; r++) {
      const y = r * rowH;
      const shade = 238 + Math.round(hash2d(r, 3, 21) * 12);
      ctx.fillStyle = `rgb(${shade}, ${shade - 2}, ${shade - 6})`;
      ctx.fillRect(0, y + 1, 512, rowH - 2);
      ctx.fillStyle = 'rgba(130, 125, 118, 0.35)';
      ctx.fillRect(0, y, 512, 1.5);
      const blocks = 14;
      const bw = 512 / blocks;
      const offset = (r % 2) * (bw * 0.5);
      for (let b = 0; b <= blocks; b++) {
        const bx = (b * bw + offset) % 512;
        ctx.fillStyle = 'rgba(145, 140, 132, 0.25)';
        ctx.fillRect(bx, y, 1.2, rowH);
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 1);
    tex.anisotropy = 8;
    return tex;
  });
}

function buildSignboardTexture(): THREE.CanvasTexture {
  return getCachedTexture('pumdikot-signboard-map', () => {
    const [c, ctx] = makeCanvas(1024, 320);
    const grad = ctx.createLinearGradient(0, 0, 0, 320);
    grad.addColorStop(0, '#7f1d1d');
    grad.addColorStop(1, '#450a0a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 320);

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 10;
    ctx.strokeRect(14, 14, 996, 292);
    ctx.lineWidth = 3;
    ctx.strokeRect(28, 28, 968, 264);

    ctx.fillStyle = '#fde68a';
    ctx.textAlign = 'center';
    ctx.font = 'bold 46px Georgia, serif';
    ctx.fillText('PUMDIKOT MAHADEV TEMPLE', 512, 112);

    ctx.fillStyle = '#fef3c7';
    ctx.font = '600 30px Georgia, serif';
    ctx.fillText('108 ft Lord Shiva Sanctuary · Pokhara, Nepal', 512, 174);

    ctx.fillStyle = '#fca5a5';
    ctx.font = '24px Georgia, serif';
    ctx.fillText('Om Namah Shivaya · Shivakunda · Garbhagriha · 108 Shiva Lingams', 512, 236);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  });
}

function buildOmPedimentTexture(): THREE.CanvasTexture {
  return getCachedTexture('pumdikot-om-pediment-map', () => {
    const [c, ctx] = makeCanvas(512, 256);
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#fde68a');
    grad.addColorStop(1, '#f3c37a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 12;
    ctx.strokeRect(10, 10, 492, 236);

    ctx.fillStyle = '#b45309';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 116px Georgia, serif';
    ctx.fillText('ॐ', 256, 132);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });
}

function buildKailashMuralTexture(): THREE.CanvasTexture {
  return getCachedTexture('pumdikot-kailash-mural-map', () => {
    const [c, ctx] = makeCanvas(512, 384);
    const sky = ctx.createLinearGradient(0, 0, 0, 260);
    sky.addColorStop(0, '#1e3a8a');
    sky.addColorStop(0.65, '#3b82f6');
    sky.addColorStop(1, '#fed7aa');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 512, 384);

    // Mount Kailash peaks
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(40, 270);
    ctx.lineTo(155, 118);
    ctx.lineTo(256, 56);
    ctx.lineTo(364, 126);
    ctx.lineTo(474, 270);
    ctx.closePath();
    ctx.fill();

    // Lake Manasarovar reflection
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(0, 270, 512, 114);

    // Golden Crescent & Trishul silhouette in foreground
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(256, 330);
    ctx.lineTo(256, 178);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(256, 198, 26, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();

    // Ornamental frame
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 14;
    ctx.strokeRect(7, 7, 498, 370);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });
}

export function getPumdikotMaterials(textures: ProceduralTextureSet): PumdikotPbrMaterials {
  const diamond = buildDiamondPlazaTextures();
  const mosaic = buildBlueMosaicTextures();
  const domeTex = buildRibbedDomeTexture();
  const signTex = buildSignboardTexture();
  const omTex = buildOmPedimentTexture();
  const muralTex = buildKailashMuralTexture();

  return {
    diamondPlazaMat: getCachedMaterial(textures, 'pumdikot-diamond-plaza', () =>
      new THREE.MeshStandardMaterial({
        map: diamond.map,
        normalMap: diamond.normal,
        normalScale: new THREE.Vector2(0.75, 0.75),
        roughnessMap: diamond.rough,
        roughness: 0.92,
        metalness: 0.04,
      }),
    ),
    blushRotundaMat: getCachedMaterial(textures, 'pumdikot-blush-rotunda', () =>
      new THREE.MeshStandardMaterial({
        normalMap: textures.sandstoneNormal,
        normalScale: new THREE.Vector2(0.38, 0.38),
        roughnessMap: textures.sandstoneRough,
        color: 0xe6a89b,
        roughness: 0.88,
        metalness: 0.02,
      }),
    ),
    whitePlasterMat: getCachedMaterial(textures, 'pumdikot-white-plaster', () =>
      new THREE.MeshStandardMaterial({
        normalMap: textures.sandstoneNormal,
        normalScale: new THREE.Vector2(0.28, 0.28),
        color: 0xf4efe6,
        roughness: 0.78,
        metalness: 0.02,
      }),
    ),
    ribbedDomeMat: getCachedMaterial(textures, 'pumdikot-ribbed-dome', () =>
      new THREE.MeshStandardMaterial({
        map: domeTex,
        normalMap: textures.sandstoneNormal,
        normalScale: new THREE.Vector2(0.35, 0.35),
        color: 0xf8f6f0,
        roughness: 0.68,
        metalness: 0.03,
      }),
    ),
    blueMosaicMat: getCachedMaterial(textures, 'pumdikot-blue-mosaic', () =>
      new THREE.MeshStandardMaterial({
        map: mosaic.map,
        normalMap: mosaic.normal,
        normalScale: new THREE.Vector2(0.7, 0.7),
        roughness: 0.22,
        metalness: 0.08,
      }),
    ),
    emeraldRoofMat: getCachedMaterial(textures, 'pumdikot-emerald-roof', () =>
      new THREE.MeshStandardMaterial({
        normalMap: textures.sandstoneNormal,
        normalScale: new THREE.Vector2(0.45, 0.45),
        color: 0x157a4c,
        roughness: 0.42,
        metalness: 0.14,
      }),
    ),
    crimsonGateMat: getCachedMaterial(textures, 'pumdikot-crimson-gate', () =>
      new THREE.MeshStandardMaterial({
        color: 0x991b1b,
        roughness: 0.36,
        metalness: 0.42,
      }),
    ),
    dachiAppaBrickMat: getCachedMaterial(textures, 'pumdikot-brick', () =>
      new THREE.MeshStandardMaterial({
        map: textures.brickMap,
        normalMap: textures.brickNormal,
        normalScale: new THREE.Vector2(0.65, 0.65),
        roughnessMap: textures.brickRough,
        color: 0x9f3f2d,
        roughness: 0.85,
      }),
    ),
    graniteCurbMat: getCachedMaterial(textures, 'pumdikot-granite-curb', () =>
      new THREE.MeshStandardMaterial({
        map: textures.cobbleMap,
        normalMap: textures.cobbleNormal,
        normalScale: new THREE.Vector2(0.55, 0.55),
        color: 0x6f747c,
        roughness: 0.62,
        metalness: 0.06,
      }),
    ),
    greyPagodaStoneMat: getCachedMaterial(textures, 'pumdikot-grey-pagoda', () =>
      new THREE.MeshStandardMaterial({
        map: textures.basaltCarvedMap,
        normalMap: textures.basaltCarvedNormal,
        normalScale: new THREE.Vector2(0.8, 0.8),
        color: 0x949188,
        roughness: 0.78,
        metalness: 0.05,
      }),
    ),
    carvedTimberMat: getCachedMaterial(textures, 'pumdikot-carved-timber', () =>
      new THREE.MeshStandardMaterial({
        map: textures.woodMap,
        normalMap: textures.woodNormal,
        normalScale: new THREE.Vector2(0.7, 0.7),
        color: 0x4c2b18,
        roughness: 0.64,
        metalness: 0.04,
      }),
    ),
    wroughtIronMat: getCachedMaterial(textures, 'pumdikot-wrought-iron', () =>
      new THREE.MeshStandardMaterial({
        color: 0x20242a,
        roughness: 0.38,
        metalness: 0.82,
      }),
    ),
    stainlessRailMat: getCachedMaterial(textures, 'pumdikot-stainless-rail', () =>
      new THREE.MeshStandardMaterial({
        color: 0xd6dde6,
        roughness: 0.18,
        metalness: 0.92,
      }),
    ),
    polishedBrassMat: getCachedMaterial(textures, 'pumdikot-polished-brass', () =>
      new THREE.MeshStandardMaterial({
        map: textures.agedBronzeMap,
        normalMap: textures.agedBronzeNormal,
        normalScale: new THREE.Vector2(0.4, 0.4),
        color: 0xe6b83c,
        roughness: 0.2,
        metalness: 0.9,
      }),
    ),
    goldMat: getCachedMaterial(textures, 'pumdikot-gold', () =>
      new THREE.MeshStandardMaterial({
        map: textures.agedBronzeMap,
        normalMap: textures.agedBronzeNormal,
        normalScale: new THREE.Vector2(0.48, 0.48),
        color: 0xf4c44e,
        roughness: 0.24,
        metalness: 0.92,
      }),
    ),
    copperMat: getCachedMaterial(textures, 'pumdikot-copper', () =>
      new THREE.MeshStandardMaterial({
        color: 0xc2653b,
        roughness: 0.3,
        metalness: 0.84,
      }),
    ),
    shivaBlueMat: getCachedMaterial(textures, 'pumdikot-shiva-blue', () =>
      new THREE.MeshStandardMaterial({
        normalMap: textures.sandstoneNormal,
        normalScale: new THREE.Vector2(0.32, 0.32),
        color: 0x5aa6df,
        roughness: 0.42,
        metalness: 0.12,
      }),
    ),
    shivaHairMat: getCachedMaterial(textures, 'pumdikot-shiva-hair', () =>
      new THREE.MeshStandardMaterial({
        normalMap: textures.basaltCarvedNormal,
        normalScale: new THREE.Vector2(0.75, 0.75),
        color: 0x1d2028,
        roughness: 0.72,
        metalness: 0.08,
      }),
    ),
    silverMoonMat: getCachedMaterial(textures, 'pumdikot-silver-moon', () =>
      new THREE.MeshStandardMaterial({
        color: 0xeef2f7,
        emissive: 0x94a3b8,
        emissiveIntensity: 0.32,
        roughness: 0.16,
        metalness: 0.92,
      }),
    ),
    tigerPeltMat: getCachedMaterial(textures, 'pumdikot-tiger-pelt', () =>
      new THREE.MeshStandardMaterial({
        map: textures.tigerPeltMap,
        normalMap: textures.basaltCarvedNormal,
        normalScale: new THREE.Vector2(0.36, 0.36),
        color: 0xebb048,
        roughness: 0.78,
      }),
    ),
    rudrakshaMat: getCachedMaterial(textures, 'pumdikot-rudraksha', () =>
      new THREE.MeshStandardMaterial({
        color: 0x6b3a1e,
        roughness: 0.82,
        metalness: 0.06,
      }),
    ),
    blackBasaltMat: getCachedMaterial(textures, 'pumdikot-black-basalt', () =>
      new THREE.MeshStandardMaterial({
        map: textures.basaltCarvedMap,
        normalMap: textures.basaltCarvedNormal,
        normalScale: new THREE.Vector2(0.55, 0.55),
        color: 0x1c2026,
        roughness: 0.28,
        metalness: 0.22,
      }),
    ),
    sphatikCrystalMat: getCachedMaterial(textures, 'pumdikot-sphatik-crystal', () =>
      new THREE.MeshPhysicalMaterial({
        color: 0xe0f2fe,
        emissive: 0x7dd3fc,
        emissiveIntensity: 0.52,
        roughness: 0.1,
        metalness: 0.06,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
        transparent: true,
        opacity: 0.86,
      }),
    ),
    garbhagrihaFloorMat: getCachedMaterial(textures, 'pumdikot-garbhagriha-floor', () =>
      new THREE.MeshStandardMaterial({
        map: textures.janaki.marbleAshlarMap,
        normalMap: textures.janaki.marbleAshlarNormal,
        normalScale: new THREE.Vector2(0.45, 0.45),
        color: 0xf2ece0,
        roughness: 0.34,
        metalness: 0.05,
      }),
    ),
    signboardMat: getCachedMaterial(textures, 'pumdikot-signboard', () =>
      new THREE.MeshStandardMaterial({
        map: signTex,
        roughness: 0.44,
        metalness: 0.14,
      }),
    ),
    omPedimentMat: getCachedMaterial(textures, 'pumdikot-om-pediment', () =>
      new THREE.MeshStandardMaterial({
        map: omTex,
        roughness: 0.45,
        metalness: 0.25,
      }),
    ),
    kailashMuralMat: getCachedMaterial(textures, 'pumdikot-kailash-mural', () =>
      new THREE.MeshStandardMaterial({
        map: muralTex,
        roughness: 0.55,
      }),
    ),
    skylightGlassMat: getCachedMaterial(textures, 'pumdikot-skylight-glass', () =>
      new THREE.MeshStandardMaterial({
        color: 0x7dd3fc,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.65,
        roughness: 0.18,
        metalness: 0.35,
      }),
    ),
    warmLampMat: getCachedMaterial(textures, 'pumdikot-warm-lamp', () =>
      new THREE.MeshStandardMaterial({
        color: 0xffeba8,
        emissive: 0xf59e0b,
        emissiveIntensity: 2.6,
        roughness: 0.22,
      }),
    ),
    saffronClothMat: getCachedMaterial(textures, 'pumdikot-saffron-cloth', () =>
      new THREE.MeshStandardMaterial({
        color: 0xf97316,
        roughness: 0.72,
        side: THREE.DoubleSide,
      }),
    ),
    marigoldMat: getCachedMaterial(textures, 'pumdikot-marigold', () =>
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        roughness: 0.68,
      }),
    ),
    belLeafMat: getCachedMaterial(textures, 'pumdikot-bel-leaf', () =>
      new THREE.MeshStandardMaterial({
        color: 0x166534,
        roughness: 0.62,
      }),
    ),
  };
}

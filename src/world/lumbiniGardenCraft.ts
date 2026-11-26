import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createCarvedLotusPetalGeometry } from './mayaDeviSculptureGeo';

function makeSafeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
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
      fillRect: noop,
      clearRect: noop,
      strokeRect: noop,
      beginPath: noop,
      arc: noop,
      ellipse: noop,
      moveTo: noop,
      lineTo: noop,
      quadraticCurveTo: noop,
      bezierCurveTo: noop,
      closePath: noop,
      fill: noop,
      stroke: noop,
      save: noop,
      restore: noop,
      translate: noop,
      rotate: noop,
      createLinearGradient: () => fakeGrad,
      createRadialGradient: () => fakeGrad,
      getImageData: () => fakeData,
      putImageData: noop,
      createImageData: () => fakeData,
    } as unknown as CanvasRenderingContext2D;
    return [{ width: w, height: h } as unknown as HTMLCanvasElement, fakeCtx];
  }
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

function hash2d(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

function heightCanvasToNormalSafe(hCanvas: HTMLCanvasElement, strength = 1.8): HTMLCanvasElement {
  const w = hCanvas.width;
  const h = hCanvas.height;
  const [out, outCtx] = makeSafeCanvas(w, h);
  if (typeof document === 'undefined') return out;
  const srcCtx = hCanvas.getContext('2d', { willReadFrequently: true });
  if (!srcCtx) return out;
  const src = srcCtx.getImageData(0, 0, w, h).data;
  const img = outCtx.createImageData(w, h);
  const dst = img.data;
  const sample = (px: number, py: number) => src[(((py + h) % h) * w + ((px + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (sample(x + 1, y) - sample(x - 1, y)) * strength;
      const dy = (sample(x, y + 1) - sample(x, y - 1)) * strength;
      const len = Math.hypot(-dx, -dy, 1) || 1;
      const i = (y * w + x) * 4;
      dst[i] = Math.round(((-dx / len) * 0.5 + 0.5) * 255);
      dst[i + 1] = Math.round(((-dy / len) * 0.5 + 0.5) * 255);
      dst[i + 2] = Math.round(((1 / len) * 0.5 + 0.5) * 255);
      dst[i + 3] = 255;
    }
  }
  outCtx.putImageData(img, 0, 0);
  return out;
}

function makeCanvasTex(
  c: HTMLCanvasElement,
  srgb: boolean,
  repX = 1,
  repY = 1,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repX, repY);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

export interface LumbiniGardenCraftMaterials {
  basaltMat: THREE.MeshStandardMaterial;
  graniteMat: THREE.MeshStandardMaterial;
  slateRoofMat: THREE.MeshPhysicalMaterial;
  giltBrassMat: THREE.MeshStandardMaterial;
  castIronMat: THREE.MeshStandardMaterial;
  teakWoodMat: THREE.MeshStandardMaterial;
  weatheredSandstoneMat: THREE.MeshStandardMaterial;
  stupaAlcoveMat: THREE.MeshStandardMaterial;
  marigoldMat: THREE.MeshStandardMaterial;
  mossMat: THREE.MeshStandardMaterial;
}

let cachedCraftMats: LumbiniGardenCraftMaterials | null = null;

/**
 * Shared procedural PBR material suite for carved Himalayan stone, dark basalt,
 * oxidized copper-slate pagoda roofs, cast iron, oiled teak slats, and votive shrine details.
 * Zero wood-streaked stone tints!
 */
export function getLumbiniGardenCraftMaterials(): LumbiniGardenCraftMaterials {
  if (cachedCraftMats) return cachedCraftMats;

  // 1. Dark Himalayan Charcoal Basalt (256x256 crystalline mineral grain, softened to natural weathered stone)
  const [bC, bCtx] = makeSafeCanvas(256, 256);
  const [bH, bHCtx] = makeSafeCanvas(256, 256);
  bCtx.fillStyle = '#565a60';
  bCtx.fillRect(0, 0, 256, 256);
  bHCtx.fillStyle = '#848484';
  bHCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4800; i++) {
    const px = hash2d(i, 3, 19) * 256;
    const py = hash2d(i, 7, 29) * 256;
    const t = hash2d(i, 11, 37);
    const sz = 1.2 + t * 2.6;
    if (t > 0.72) {
      bCtx.fillStyle = 'rgba(154, 158, 164, 0.34)';
      bHCtx.fillStyle = '#c8c8c8';
    } else if (t < 0.28) {
      bCtx.fillStyle = 'rgba(42, 45, 50, 0.36)';
      bHCtx.fillStyle = '#4a4a4a';
    } else {
      bCtx.fillStyle = 'rgba(98, 102, 108, 0.24)';
      bHCtx.fillStyle = '#949494';
    }
    bCtx.fillRect(px, py, sz, sz);
    bHCtx.fillRect(px, py, sz, sz);
  }
  const basaltMap = makeCanvasTex(bC, true, 2, 2);
  const basaltNormal = makeCanvasTex(heightCanvasToNormalSafe(bH, 1.9), false, 2, 2);
  const basaltMat = new THREE.MeshStandardMaterial({
    map: basaltMap,
    normalMap: basaltNormal,
    normalScale: new THREE.Vector2(0.88, 0.88),
    color: 0xffffff,
    roughness: 0.80,
    metalness: 0.05,
  });

  // 2. Weathered Himalayan Granite / Dressed Limestone (natural mottled grey-warm ashlar, zero plastic white or wood streaks)
  const [gC, gCtx] = makeSafeCanvas(256, 256);
  const [gH, gHCtx] = makeSafeCanvas(256, 256);
  gCtx.fillStyle = '#a8a49a';
  gCtx.fillRect(0, 0, 256, 256);
  gHCtx.fillStyle = '#909090';
  gHCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 5500; i++) {
    const px = hash2d(i, 5, 53) * 256;
    const py = hash2d(i, 9, 67) * 256;
    const t = hash2d(i, 13, 83);
    const sz = 1 + t * 2.4;
    if (t > 0.76) {
      gCtx.fillStyle = 'rgba(222, 218, 208, 0.36)';
      gHCtx.fillStyle = '#cfcfcf';
    } else if (t < 0.24) {
      gCtx.fillStyle = 'rgba(78, 78, 76, 0.36)';
      gHCtx.fillStyle = '#505050';
    } else {
      gCtx.fillStyle = 'rgba(138, 134, 124, 0.28)';
      gHCtx.fillStyle = '#9c9c9c';
    }
    gCtx.fillRect(px, py, sz, sz);
    gHCtx.fillRect(px, py, sz, sz);
  }
  // Subtle weathered stone mottling patches
  for (let p = 0; p < 36; p++) {
    const sx = hash2d(p, 1, 211) * 256;
    const sy = hash2d(p, 2, 223) * 256;
    const rad = 10 + hash2d(p, 3, 229) * 24;
    gCtx.fillStyle = p % 2 === 0 ? 'rgba(92, 90, 82, 0.08)' : 'rgba(188, 184, 174, 0.09)';
    gCtx.beginPath();
    gCtx.arc(sx, sy, rad, 0, Math.PI * 2);
    gCtx.fill();
  }
  const graniteMap = makeCanvasTex(gC, true, 2, 2);
  const graniteNormal = makeCanvasTex(heightCanvasToNormalSafe(gH, 1.8), false, 2, 2);
  const graniteMat = new THREE.MeshStandardMaterial({
    map: graniteMap,
    normalMap: graniteNormal,
    normalScale: new THREE.Vector2(0.85, 0.85),
    color: 0xffffff,
    roughness: 0.76,
    metalness: 0.04,
  });

  // 3. Oxidized Hammered Copper-Slate Pagoda Roof (overlapping scalloped tile courses + subtle patina)
  const [rC, rCtx] = makeSafeCanvas(256, 256);
  const [rH, rHCtx] = makeSafeCanvas(256, 256);
  rCtx.fillStyle = '#2d3339';
  rCtx.fillRect(0, 0, 256, 256);
  rHCtx.fillStyle = '#686868';
  rHCtx.fillRect(0, 0, 256, 256);
  const tRows = 8;
  const tCols = 8;
  const tw = 256 / tCols;
  const th = 256 / tRows;
  for (let row = 0; row < tRows; row++) {
    const off = (row % 2) * (tw * 0.5);
    for (let col = -1; col <= tCols; col++) {
      const tx = col * tw + off;
      const ty = row * th;
      const n = hash2d(col + row * 9, row, 101);
      const r = Math.round(42 + n * 16);
      const g = Math.round(50 + n * 18);
      const b = Math.round(54 + n * 16);
      rCtx.fillStyle = `rgb(${r},${g},${b})`;
      rCtx.fillRect(tx + 1, ty + 1, tw - 2, th - 2);
      rCtx.fillStyle = 'rgba(130, 152, 146, 0.14)';
      rCtx.fillRect(tx + 2, ty + th - 4, tw - 4, 2);
      const hv = Math.round(135 + n * 65);
      rHCtx.fillStyle = `rgb(${hv},${hv},${hv})`;
      rHCtx.fillRect(tx + 1.5, ty + 1.5, tw - 3, th - 3);
    }
  }
  const slateMap = makeCanvasTex(rC, true, 3, 2);
  const slateNormal = makeCanvasTex(heightCanvasToNormalSafe(rH, 2.1), false, 3, 2);
  const slateRoofMat = new THREE.MeshPhysicalMaterial({
    map: slateMap,
    normalMap: slateNormal,
    normalScale: new THREE.Vector2(0.88, 0.88),
    color: 0xffffff,
    roughness: 0.46,
    metalness: 0.34,
    clearcoat: 0.18,
    clearcoatRoughness: 0.42,
  });

  // 4. Oiled Burmese Teak Wood Slats (for benches ONLY)
  const [wC, wCtx] = makeSafeCanvas(256, 256);
  const [wH, wHCtx] = makeSafeCanvas(256, 256);
  wCtx.fillStyle = '#8b532d';
  wCtx.fillRect(0, 0, 256, 256);
  wHCtx.fillStyle = '#909090';
  wHCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 2) {
    const n = hash2d(y, 3, 149);
    const wave = Math.sin(y * 0.18) * 14 + (n - 0.5) * 18;
    const r = Math.max(40, Math.min(200, Math.round(138 + wave)));
    const g = Math.max(22, Math.min(140, Math.round(82 + wave * 0.65)));
    const b = Math.max(12, Math.min(90, Math.round(44 + wave * 0.4)));
    wCtx.fillStyle = `rgb(${r},${g},${b})`;
    wCtx.fillRect(0, y, 256, 2);
    const hv = Math.round(110 + n * 85);
    wHCtx.fillStyle = `rgb(${hv},${hv},${hv})`;
    wHCtx.fillRect(0, y, 256, 2);
  }
  const teakMap = makeCanvasTex(wC, true, 2, 1);
  const teakNormal = makeCanvasTex(heightCanvasToNormalSafe(wH, 1.35), false, 2, 1);
  const teakWoodMat = new THREE.MeshStandardMaterial({
    map: teakMap,
    normalMap: teakNormal,
    normalScale: new THREE.Vector2(0.65, 0.65),
    color: 0xffffff,
    roughness: 0.54,
    metalness: 0.04,
  });

  // 5. Burnished Gilt Brass & Cast Wrought Iron
  const giltBrassMat = new THREE.MeshStandardMaterial({
    color: 0xe6b84c,
    roughness: 0.25,
    metalness: 0.88,
    emissive: 0x3b2404,
    emissiveIntensity: 0.12,
  });

  const castIronMat = new THREE.MeshStandardMaterial({
    color: 0x2a2e33,
    roughness: 0.42,
    metalness: 0.76,
  });

  // 6. Deeply Weathered Carved Chunar Stone Trim for Stupa Ruins (ashlar masonry joints, chisel marks & moss patina)
  const [sC, sCtx] = makeSafeCanvas(256, 256);
  const [sH, sHCtx] = makeSafeCanvas(256, 256);
  sCtx.fillStyle = '#9e8b70';
  sCtx.fillRect(0, 0, 256, 256);
  sHCtx.fillStyle = '#9c9c9c';
  sHCtx.fillRect(0, 0, 256, 256);
  // Ashlar block joint courses
  for (let row = 0; row < 4; row++) {
    const y = row * 64;
    sCtx.fillStyle = 'rgba(48, 38, 28, 0.34)';
    sCtx.fillRect(0, y, 256, 3);
    sHCtx.fillStyle = '#424242';
    sHCtx.fillRect(0, y, 256, 3);
    for (let col = 0; col < 3; col++) {
      const x = ((col * 85 + (row % 2) * 42) % 256);
      sCtx.fillRect(x, y, 3, 64);
      sHCtx.fillRect(x, y, 3, 64);
    }
  }
  // Patina blotches & sandstone mineral pitting
  for (let p = 0; p < 32; p++) {
    const px = hash2d(p, 5, 163) * 256;
    const py = hash2d(p, 9, 167) * 256;
    const rad = 8 + hash2d(p, 13, 197) * 22;
    sCtx.fillStyle = p % 3 === 0 ? 'rgba(72, 82, 54, 0.16)' : 'rgba(62, 48, 34, 0.14)';
    sCtx.beginPath();
    sCtx.arc(px, py, rad, 0, Math.PI * 2);
    sCtx.fill();
  }
  for (let i = 0; i < 4400; i++) {
    const px = hash2d(i, 7, 173) * 256;
    const py = hash2d(i, 11, 181) * 256;
    const t = hash2d(i, 15, 193);
    sCtx.fillStyle = t > 0.5 ? 'rgba(205, 188, 160, 0.24)' : 'rgba(66, 54, 40, 0.26)';
    sCtx.fillRect(px, py, 2, 2);
    const hv = Math.round(92 + t * 112);
    sHCtx.fillStyle = `rgb(${hv},${hv},${hv})`;
    sHCtx.fillRect(px, py, 2, 2);
  }
  const sMap = makeCanvasTex(sC, true, 2, 2);
  const sNormal = makeCanvasTex(heightCanvasToNormalSafe(sH, 2.0), false, 2, 2);
  const weatheredSandstoneMat = new THREE.MeshStandardMaterial({
    map: sMap,
    normalMap: sNormal,
    normalScale: new THREE.Vector2(0.92, 0.92),
    color: 0xffffff,
    roughness: 0.86,
    metalness: 0.03,
  });

  const stupaAlcoveMat = new THREE.MeshStandardMaterial({
    color: 0x2c1b15,
    roughness: 0.92,
    metalness: 0.02,
  });

  const marigoldMat = new THREE.MeshStandardMaterial({
    color: 0xf48c18,
    roughness: 0.68,
    metalness: 0.02,
    emissive: 0x3b1800,
    emissiveIntensity: 0.08,
  });

  const mossMat = new THREE.MeshStandardMaterial({
    color: 0x4b6e32,
    roughness: 0.94,
    metalness: 0.01,
  });

  cachedCraftMats = {
    basaltMat,
    graniteMat,
    slateRoofMat,
    giltBrassMat,
    castIronMat,
    teakWoodMat,
    weatheredSandstoneMat,
    stupaAlcoveMat,
    marigoldMat,
    mossMat,
  };
  return cachedCraftMats;
}

function pushNonIndexedPart(
  list: THREE.BufferGeometry[],
  geo: THREE.BufferGeometry,
  translateY = 0,
  rotX = 0,
  rotY = 0,
  rotZ = 0,
  translateX = 0,
  translateZ = 0,
): void {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  if (rotX !== 0) g.rotateX(rotX);
  if (rotY !== 0) g.rotateY(rotY);
  if (rotZ !== 0) g.rotateZ(rotZ);
  if (translateX !== 0 || translateY !== 0 || translateZ !== 0) {
    g.translate(translateX, translateY, translateZ);
  }
  if (!g.getAttribute('normal')) g.computeVertexNormals();
  if (!g.getAttribute('uv')) {
    const count = g.getAttribute('position').count;
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
  }
  list.push(g);
  geo.dispose();
}

/**
 * Computes consistent world-proportional UVs on a BoxGeometry so brick courses
 * never stretch or squish regardless of slab aspect ratio.
 */
export function makeWorldUvBoxGeo(
  sx: number,
  sy: number,
  sz: number,
  tileW = 7.6,
  tileH = 3.2,
): THREE.BoxGeometry {
  const geo = new THREE.BoxGeometry(sx, sy, sz);
  const pos = geo.getAttribute('position');
  const norm = geo.getAttribute('normal');
  const uv = geo.getAttribute('uv');
  for (let i = 0; i < pos.count; i++) {
    const nx = Math.abs(norm.getX(i));
    const ny = Math.abs(norm.getY(i));
    const px = pos.getX(i);
    const py = pos.getY(i);
    const pz = pos.getZ(i);
    if (nx > 0.5) {
      uv.setXY(i, (pz + sz * 0.5) / tileW, (py + sy * 0.5) / tileH);
    } else if (ny > 0.5) {
      uv.setXY(i, (px + sx * 0.5) / tileW, (pz + sz * 0.5) / tileW);
    } else {
      uv.setXY(i, (px + sx * 0.5) / tileW, (py + sy * 0.5) / tileH);
    }
  }
  uv.needsUpdate = true;
  return geo;
}

function makeWorldUvBrickCylGeo(
  rTop: number,
  rBot: number,
  h: number,
  seg: number,
  tileW = 7.6,
  tileH = 3.2,
): THREE.CylinderGeometry {
  const geo = new THREE.CylinderGeometry(rTop, rBot, h, seg);
  const norm = geo.getAttribute('normal');
  const pos = geo.getAttribute('position');
  const uv = geo.getAttribute('uv');
  const uScale = (2 * Math.PI * ((rTop + rBot) * 0.5)) / tileW;
  const vScale = h / tileH;
  for (let i = 0; i < uv.count; i++) {
    const ny = Math.abs(norm.getY(i));
    if (ny > 0.75) {
      uv.setXY(i, (pos.getX(i) + rBot) / tileW, (pos.getZ(i) + rBot) / tileW);
    } else {
      uv.setXY(i, uv.getX(i) * uScale, uv.getY(i) * vScale);
    }
  }
  uv.needsUpdate = true;
  return geo;
}

// =========================================================================
// 1. MULTI-MATERIAL NEPALI CHAITYA-DIPA PEACE LANTERN (ZERO WOOD LOOK)
// =========================================================================

interface DetailedPeaceLanternCache {
  basaltGeo: THREE.BufferGeometry;
  graniteGeo: THREE.BufferGeometry;
  roofGeo: THREE.BufferGeometry;
  bronzeGeo: THREE.BufferGeometry;
  giltGeo: THREE.BufferGeometry;
  amberGlassGeo: THREE.BufferGeometry;
  chimneyGeo: THREE.BufferGeometry;
  flameGeo: THREE.BufferGeometry;
  amberGlassMat: THREE.MeshPhysicalMaterial;
  chimneyGlassMat: THREE.MeshPhysicalMaterial;
}

let cachedDetailedLantern: DetailedPeaceLanternCache | null = null;

function createScrollHornGeo(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.015, -0.015);
  shape.quadraticCurveTo(0.04, -0.01, 0.068, 0.032);
  shape.quadraticCurveTo(0.088, 0.068, 0.064, 0.095);
  shape.quadraticCurveTo(0.042, 0.11, 0.028, 0.085);
  shape.quadraticCurveTo(0.036, 0.056, 0.014, 0.034);
  shape.quadraticCurveTo(-0.012, 0.018, -0.022, 0.008);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.016,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
    curveSegments: 8,
  });
  geo.translate(0, 0, -0.008);
  return geo;
}

function getDetailedPeaceLanternCache(): DetailedPeaceLanternCache {
  if (cachedDetailedLantern) return cachedDetailedLantern;

  const basaltParts: THREE.BufferGeometry[] = [];
  const graniteParts: THREE.BufferGeometry[] = [];
  const roofParts: THREE.BufferGeometry[] = [];
  const bronzeParts: THREE.BufferGeometry[] = [];
  const giltParts: THREE.BufferGeometry[] = [];

  // A. Heavy Dark Basalt Plinth + Stepped Granite Collar + Corner Kalash Studs (y = 0 .. 0.34)
  pushNonIndexedPart(basaltParts, makeWorldUvBoxGeo(0.86, 0.10, 0.86, 0.9, 0.9), 0.05);
  pushNonIndexedPart(graniteParts, makeWorldUvBoxGeo(0.70, 0.095, 0.70, 0.9, 0.9), 0.1475);
  pushNonIndexedPart(basaltParts, makeWorldUvBoxGeo(0.54, 0.075, 0.54, 0.9, 0.9), 0.2325);
  pushNonIndexedPart(basaltParts, new THREE.CylinderGeometry(0.255, 0.285, 0.065, 8), 0.302, 0, Math.PI / 8);

  // 4 Turned Bronze Guardian Corner Finial Buds on square plinth terrace
  const cornerBudPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.046, 0.0),
    new THREE.Vector2(0.050, 0.025),
    new THREE.Vector2(0.032, 0.055),
    new THREE.Vector2(0.038, 0.08),
    new THREE.Vector2(0.018, 0.115),
    new THREE.Vector2(0.0, 0.135),
  ];
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      pushNonIndexedPart(
        bronzeParts,
        new THREE.LatheGeometry(cornerBudPts, 10),
        0.195,
        0,
        0,
        0,
        sx * 0.29,
        sz * 0.29,
      );
    }
  }

  // B. Double-Tier Carved Padma-Pitha Granite Lotus Pedestal (y = 0.33 .. 0.53)
  const lotusPedPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.235, 0.0),
    new THREE.Vector2(0.25, 0.045),
    new THREE.Vector2(0.215, 0.09),
    new THREE.Vector2(0.175, 0.145),
    new THREE.Vector2(0.195, 0.175),
    new THREE.Vector2(0.155, 0.20),
    new THREE.Vector2(0.0, 0.20),
  ];
  pushNonIndexedPart(graniteParts, new THREE.LatheGeometry(lotusPedPts, 16), 0.33);

  // 12 Sculpted 3D Carved Granite Lotus Petals ringing the Padma-Pitha pedestal + Bronze Bead Collar
  const lotusPetalBase = createCarvedLotusPetalGeometry(0.088, 0.145, 0.026);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const petal = lotusPetalBase.clone();
    petal.rotateX(-0.48);
    petal.rotateY(a);
    petal.translate(Math.sin(a) * 0.195, 0.395, Math.cos(a) * 0.195);
    pushNonIndexedPart(graniteParts, petal);
  }
  lotusPetalBase.dispose();
  pushNonIndexedPart(bronzeParts, new THREE.TorusGeometry(0.168, 0.015, 8, 24), 0.525, Math.PI * 0.5);

  // C. Carved Octagonal Granite Column Shaft + Basalt Ribs + Mid Kumbha Medallion Collar (y = 0.53 .. 1.44)
  pushNonIndexedPart(graniteParts, new THREE.CylinderGeometry(0.122, 0.152, 0.90, 8), 0.98, 0, Math.PI / 8);

  // 8 Vertical Dark Basalt Arris Pilaster Ribs at octagonal corners
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    pushNonIndexedPart(
      basaltParts,
      new THREE.CylinderGeometry(0.014, 0.019, 0.84, 6),
      0.98,
      0,
      0,
      0,
      Math.cos(a) * 0.132,
      Math.sin(a) * 0.132,
    );
  }

  // Mid-shaft Carved Basalt Kumbha Band + 8 Embossed Gilt Rosette Medallions
  pushNonIndexedPart(basaltParts, new THREE.CylinderGeometry(0.162, 0.162, 0.085, 8), 0.98, 0, Math.PI / 8);
  pushNonIndexedPart(bronzeParts, new THREE.TorusGeometry(0.158, 0.011, 8, 24), 0.935, Math.PI * 0.5);
  pushNonIndexedPart(bronzeParts, new THREE.TorusGeometry(0.158, 0.011, 8, 24), 1.025, Math.PI * 0.5);
  for (let i = 0; i < 8; i++) {
    const fa = (i / 8) * Math.PI * 2;
    const faceR = 0.151;
    pushNonIndexedPart(
      giltParts,
      new THREE.CylinderGeometry(0.028, 0.032, 0.016, 12),
      0.98,
      Math.PI * 0.5,
      -fa,
      0,
      Math.sin(fa) * faceR,
      Math.cos(fa) * faceR,
    );
  }

  // D. Upper Ghata-Pallava Granite Capital + 8 Stepped Newari Meth Corbel Brackets (y = 1.40 .. 1.66)
  const capPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.13, 0.0),
    new THREE.Vector2(0.165, 0.045),
    new THREE.Vector2(0.215, 0.105),
    new THREE.Vector2(0.20, 0.145),
    new THREE.Vector2(0.0, 0.145),
  ];
  pushNonIndexedPart(graniteParts, new THREE.LatheGeometry(capPts, 8), 1.40, 0, Math.PI / 8);
  pushNonIndexedPart(bronzeParts, new THREE.TorusGeometry(0.146, 0.013, 8, 20), 1.405, Math.PI * 0.5);

  // 8 Stepped Multi-Notched S-Curved Granite Meth Corbel Brackets radiating flush under octagonal deck
  const corbelShape = new THREE.Shape();
  corbelShape.moveTo(0.0, 0.0);
  corbelShape.lineTo(0.0, 0.145);
  corbelShape.lineTo(0.155, 0.145);
  corbelShape.lineTo(0.155, 0.105);
  corbelShape.quadraticCurveTo(0.10, 0.095, 0.095, 0.055);
  corbelShape.quadraticCurveTo(0.055, 0.045, 0.045, 0.0);
  corbelShape.closePath();
  const corbelBaseGeo = new THREE.ExtrudeGeometry(corbelShape, {
    depth: 0.036,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2,
    curveSegments: 8,
  });
  corbelBaseGeo.translate(0, 0, -0.018);
  corbelBaseGeo.rotateY(-Math.PI * 0.5); // profile extends outward along +Z

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const cGeo = corbelBaseGeo.clone();
    cGeo.rotateY(a);
    cGeo.translate(Math.sin(a) * 0.14, 1.40, Math.cos(a) * 0.14);
    pushNonIndexedPart(graniteParts, cGeo);
  }
  corbelBaseGeo.dispose();

  // Projecting Octagonal Granite Cornice Platform + Basalt Coping Sill + Bronze Dentil Beads
  pushNonIndexedPart(graniteParts, new THREE.CylinderGeometry(0.325, 0.275, 0.075, 8), 1.575, 0, Math.PI / 8);
  pushNonIndexedPart(basaltParts, new THREE.CylinderGeometry(0.305, 0.315, 0.036, 8), 1.630, 0, Math.PI / 8);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    pushNonIndexedPart(
      bronzeParts,
      new THREE.SphereGeometry(0.014, 7, 6),
      1.545,
      0,
      0,
      0,
      Math.cos(a) * 0.275,
      Math.sin(a) * 0.275,
    );
  }

  // Miniature Pierced Bronze Parapet Balustrade around Balcony Rim (y = 1.65 .. 1.73)
  const balR = 0.275;
  pushNonIndexedPart(bronzeParts, new THREE.TorusGeometry(balR, 0.009, 6, 8), 1.725, Math.PI * 0.5, Math.PI / 8);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    pushNonIndexedPart(
      bronzeParts,
      new THREE.CylinderGeometry(0.008, 0.011, 0.078, 6),
      1.685,
      0,
      0,
      0,
      Math.cos(a) * balR,
      Math.sin(a) * balR,
    );
  }

  // E. Ornate Octagonal Bronze & Gilt Jali Lantern Chamber (y = 1.65 .. 2.15)
  pushNonIndexedPart(bronzeParts, new THREE.CylinderGeometry(0.225, 0.242, 0.036, 8), 1.665, 0, Math.PI / 8);
  // Inner Sukhunda / Diyo brass oil lamp bowl
  const diyoPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.076, 0.0),
    new THREE.Vector2(0.044, 0.038),
    new THREE.Vector2(0.028, 0.068),
    new THREE.Vector2(0.088, 0.105),
    new THREE.Vector2(0.078, 0.125),
    new THREE.Vector2(0.018, 0.125),
  ];
  pushNonIndexedPart(giltParts, new THREE.LatheGeometry(diyoPts, 16), 1.68);

  const chamberR = 0.195;
  const chamberBotY = 1.675;
  const chamberTopY = 2.135;
  const chamberH = chamberTopY - chamberBotY;
  const chamberMidY = (chamberBotY + chamberTopY) * 0.5;
  const stepA = (Math.PI * 2) / 8;
  const chord = 2 * chamberR * Math.sin(Math.PI / 8);
  const diagLen = Math.hypot(chord * 0.86, chamberH * 0.84);
  const diagTilt = Math.atan2(chord * 0.86, chamberH * 0.84);

  for (let i = 0; i < 8; i++) {
    const ca = i * stepA + Math.PI / 8;
    const cx = Math.cos(ca) * chamberR;
    const cz = Math.sin(ca) * chamberR;
    // Turned bronze corner colonnettes + decorative lotus beads
    pushNonIndexedPart(bronzeParts, new THREE.CylinderGeometry(0.015, 0.018, chamberH, 8), chamberMidY, 0, 0, 0, cx, cz);
    pushNonIndexedPart(giltParts, new THREE.SphereGeometry(0.022, 8, 6), chamberMidY, 0, 0, 0, cx, cz);
    pushNonIndexedPart(giltParts, new THREE.SphereGeometry(0.020, 8, 6), chamberBotY + 0.035, 0, 0, 0, cx, cz);
    pushNonIndexedPart(giltParts, new THREE.SphereGeometry(0.020, 8, 6), chamberTopY - 0.035, 0, 0, 0, cx, cz);

    const fa = (i + 0.5) * stepA + Math.PI / 8;
    const fDist = chamberR * Math.cos(Math.PI / 8) + 0.005;
    const fx = Math.cos(fa) * fDist;
    const fz = Math.sin(fa) * fDist;
    const yaw = -fa + Math.PI * 0.5;

    // Crossed Jali diamond bars + central vertical filigree stile + gilt Torana arch cusp
    const b1 = new THREE.CylinderGeometry(0.0045, 0.0045, diagLen, 5);
    b1.rotateZ(diagTilt);
    b1.rotateY(yaw);
    b1.translate(fx, chamberMidY, fz);
    pushNonIndexedPart(bronzeParts, b1);

    const b2 = new THREE.CylinderGeometry(0.0045, 0.0045, diagLen, 5);
    b2.rotateZ(-diagTilt);
    b2.rotateY(yaw);
    b2.translate(fx, chamberMidY, fz);
    pushNonIndexedPart(bronzeParts, b2);

    const midV = new THREE.CylinderGeometry(0.004, 0.004, chamberH * 0.88, 5);
    midV.translate(fx, chamberMidY, fz);
    pushNonIndexedPart(bronzeParts, midV);

    const cusp = new THREE.TorusGeometry(chord * 0.36, 0.007, 6, 12, Math.PI);
    cusp.rotateY(yaw);
    cusp.translate(fx, chamberTopY - 0.085, fz);
    pushNonIndexedPart(giltParts, cusp);
  }

  // Carved Basalt & Bronze Eave Frieze Ring above chamber (y = 2.13 .. 2.21)
  pushNonIndexedPart(bronzeParts, new THREE.CylinderGeometry(0.245, 0.222, 0.045, 8), chamberTopY + 0.015, 0, Math.PI / 8);
  pushNonIndexedPart(basaltParts, new THREE.CylinderGeometry(0.275, 0.250, 0.042, 8), chamberTopY + 0.056, 0, Math.PI / 8);

  // F. Two-Tier Oxidized Copper-Slate Pagoda Canopy Roof + Radial Rafters + Scroll Horns + Bells (y = 2.20 .. 2.60)
  const roofBaseY = 2.20;
  for (let i = 0; i < 16; i++) {
    const ra = (i / 16) * Math.PI * 2;
    pushNonIndexedPart(
      bronzeParts,
      new THREE.BoxGeometry(0.016, 0.018, 0.25),
      roofBaseY + 0.005,
      -0.16,
      ra,
      0,
      Math.sin(ra) * 0.27,
      Math.cos(ra) * 0.27,
    );
  }

  // Lower swept slate roof skirt (y = 2.20 .. 2.44)
  const lowerRoofPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.45, 0.0),
    new THREE.Vector2(0.44, 0.026),
    new THREE.Vector2(0.32, 0.098),
    new THREE.Vector2(0.23, 0.195),
    new THREE.Vector2(0.185, 0.245),
    new THREE.Vector2(0.0, 0.25),
  ];
  pushNonIndexedPart(roofParts, new THREE.LatheGeometry(lowerRoofPts, 8), roofBaseY, 0, Math.PI / 8);

  // Upper tiered slate cupola skirt (y = 2.42 .. 2.60) + bronze divider ring
  pushNonIndexedPart(bronzeParts, new THREE.CylinderGeometry(0.195, 0.21, 0.032, 8), roofBaseY + 0.235, 0, Math.PI / 8);
  const upperRoofPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.27, 0.0),
    new THREE.Vector2(0.26, 0.022),
    new THREE.Vector2(0.18, 0.088),
    new THREE.Vector2(0.125, 0.16),
    new THREE.Vector2(0.0, 0.165),
  ];
  pushNonIndexedPart(roofParts, new THREE.LatheGeometry(upperRoofPts, 8), roofBaseY + 0.245, 0, Math.PI / 8);

  const scrollHorn = createScrollHornGeo();
  for (let i = 0; i < 8; i++) {
    const ha = i * stepA + Math.PI / 8;
    const midHx = Math.cos(ha) * 0.305;
    const midHz = Math.sin(ha) * 0.305;
    // Lower hip ridge rib (gilt bronze) meeting scroll horn seamlessly
    const ridge = new THREE.CylinderGeometry(0.0085, 0.013, 0.38, 6);
    ridge.rotateZ(Math.PI * 0.32);
    ridge.rotateY(-ha);
    ridge.translate(midHx, roofBaseY + 0.125, midHz);
    pushNonIndexedPart(giltParts, ridge);

    // Upper tier hip ridge rib
    const upHx = Math.cos(ha) * 0.185;
    const upHz = Math.sin(ha) * 0.185;
    const upRidge = new THREE.CylinderGeometry(0.007, 0.011, 0.20, 6);
    upRidge.rotateZ(Math.PI * 0.29);
    upRidge.rotateY(-ha);
    upRidge.translate(upHx, roofBaseY + 0.325, upHz);
    pushNonIndexedPart(giltParts, upRidge);

    // Curled Makara/Scroll corner horn finial on lower eaves
    const horn = scrollHorn.clone();
    horn.rotateY(-ha);
    horn.translate(Math.cos(ha) * 0.425, roofBaseY + 0.022, Math.sin(ha) * 0.425);
    pushNonIndexedPart(giltParts, horn);

    // Suspended miniature brass Ghanti temple bell + leaf wind catcher (Pataka) under every corner eave
    const bellX = Math.cos(ha) * 0.385;
    const bellZ = Math.sin(ha) * 0.385;
    pushNonIndexedPart(bronzeParts, new THREE.CylinderGeometry(0.004, 0.004, 0.044, 5), roofBaseY - 0.022, 0, 0, 0, bellX, bellZ);
    pushNonIndexedPart(giltParts, new THREE.ConeGeometry(0.024, 0.048, 8), roofBaseY - 0.060, 0, 0, 0, bellX, bellZ);
    pushNonIndexedPart(bronzeParts, new THREE.SphereGeometry(0.009, 6, 5), roofBaseY - 0.090, 0, 0, 0, bellX, bellZ);
    pushNonIndexedPart(giltParts, new THREE.OctahedronGeometry(0.015, 0), roofBaseY - 0.118, 0, 0, 0, bellX, bellZ);
  }
  scrollHorn.dispose();

  // G. Carved Granite Harmika Plinth + 13-Step Gilt Chaitya Gajur Finial (y = 2.60 .. 3.06)
  pushNonIndexedPart(graniteParts, new THREE.BoxGeometry(0.22, 0.075, 0.22), roofBaseY + 0.435);
  pushNonIndexedPart(basaltParts, new THREE.BoxGeometry(0.245, 0.026, 0.245), roofBaseY + 0.48);
  const gajurPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.10, 0.0),
    new THREE.Vector2(0.078, 0.032),
    new THREE.Vector2(0.088, 0.058),
    new THREE.Vector2(0.062, 0.096),
    new THREE.Vector2(0.070, 0.125),
    new THREE.Vector2(0.046, 0.165),
    new THREE.Vector2(0.052, 0.192),
    new THREE.Vector2(0.028, 0.255),
    new THREE.Vector2(0.038, 0.305),
    new THREE.Vector2(0.017, 0.35),
    new THREE.Vector2(0.0, 0.41),
  ];
  pushNonIndexedPart(giltParts, new THREE.LatheGeometry(gajurPts, 16), roofBaseY + 0.495);

  const basaltGeo = mergeGeometries(basaltParts, false)!;
  const graniteGeo = mergeGeometries(graniteParts, false)!;
  const roofGeo = mergeGeometries(roofParts, false)!;
  const bronzeGeo = mergeGeometries(bronzeParts, false)!;
  const giltGeo = mergeGeometries(giltParts, false)!;

  basaltParts.forEach((p) => p.dispose());
  graniteParts.forEach((p) => p.dispose());
  roofParts.forEach((p) => p.dispose());
  bronzeParts.forEach((p) => p.dispose());
  giltParts.forEach((p) => p.dispose());

  // Warm frosted amber octagonal glass panes + clear hurricane chimney + teardrop flame
  const amberGlassGeo = new THREE.CylinderGeometry(0.174, 0.174, 0.41, 8);
  amberGlassGeo.rotateY(Math.PI / 8);
  amberGlassGeo.translate(0, 1.90, 0);

  const chimneyGeo = new THREE.CylinderGeometry(0.056, 0.064, 0.24, 12);
  chimneyGeo.translate(0, 1.89, 0);

  const flamePts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.025, 0.02),
    new THREE.Vector2(0.030, 0.05),
    new THREE.Vector2(0.017, 0.095),
    new THREE.Vector2(0.004, 0.135),
    new THREE.Vector2(0.0, 0.15),
  ];
  const flameGeo = new THREE.LatheGeometry(flamePts, 12);
  flameGeo.translate(0, 1.795, 0);

  const amberGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffd796,
    emissive: 0xff9328,
    emissiveIntensity: 0.44,
    roughness: 0.16,
    metalness: 0.04,
    transparent: true,
    opacity: 0.36,
    clearcoat: 0.85,
    depthWrite: false,
    side: THREE.FrontSide,
  });

  const chimneyGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0xfff8e6,
    emissive: 0xffb84d,
    emissiveIntensity: 0.24,
    roughness: 0.08,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
    side: THREE.FrontSide,
  });

  cachedDetailedLantern = {
    basaltGeo,
    graniteGeo,
    roofGeo,
    bronzeGeo,
    giltGeo,
    amberGlassGeo,
    chimneyGeo,
    flameGeo,
    amberGlassMat,
    chimneyGlassMat,
  };
  return cachedDetailedLantern;
}

/**
 * Builds an ultra-detailed, multi-material Nepali Heritage Stone, Oxidized Copper-Slate &
 * Filigree Bronze Chaitya-Dipa Peace Lantern (zero monochrome woodish stone).
 */
export function buildDetailedPeaceLantern(
  _stoneMat: THREE.Material,
  bronzeMat: THREE.Material,
  glowMat: THREE.Material,
): THREE.Group {
  const cache = getDetailedPeaceLanternCache();
  const mats = getLumbiniGardenCraftMaterials();
  const g = new THREE.Group();

  const basaltMesh = new THREE.Mesh(cache.basaltGeo, mats.basaltMat);
  basaltMesh.castShadow = true;
  basaltMesh.receiveShadow = true;

  const graniteMesh = new THREE.Mesh(cache.graniteGeo, mats.graniteMat);
  graniteMesh.castShadow = true;
  graniteMesh.receiveShadow = true;

  const roofMesh = new THREE.Mesh(cache.roofGeo, mats.slateRoofMat);
  roofMesh.castShadow = true;
  roofMesh.receiveShadow = true;
  roofMesh.userData.nonCollidable = true;

  const bronzeMesh = new THREE.Mesh(cache.bronzeGeo, bronzeMat);
  bronzeMesh.castShadow = true;
  bronzeMesh.userData.nonCollidable = true;

  const giltMesh = new THREE.Mesh(cache.giltGeo, mats.giltBrassMat);
  giltMesh.castShadow = true;
  giltMesh.userData.nonCollidable = true;

  const amberGlass = new THREE.Mesh(cache.amberGlassGeo, cache.amberGlassMat);
  amberGlass.userData.nonCollidable = true;

  const chimney = new THREE.Mesh(cache.chimneyGeo, cache.chimneyGlassMat);
  chimney.userData.nonCollidable = true;

  const flame = new THREE.Mesh(cache.flameGeo, glowMat);
  flame.userData.nonCollidable = true;

  g.add(
    basaltMesh,
    graniteMesh,
    roofMesh,
    bronzeMesh,
    giltMesh,
    amberGlass,
    chimney,
    flame,
  );
  return g;
}

// =========================================================================
// 2. HIGHLY DETAILED HERITAGE GRANITE & OILED TEAK GARDEN BENCH
// =========================================================================

interface DetailedBenchCache {
  basaltGeo: THREE.BufferGeometry;
  graniteGeo: THREE.BufferGeometry;
  ironGeo: THREE.BufferGeometry;
  teakGeo: THREE.BufferGeometry;
  brassGeo: THREE.BufferGeometry;
}

let cachedDetailedBench: DetailedBenchCache | null = null;

function createCarvedBenchLegGeo(): THREE.BufferGeometry {
  // Side profile in XY where X = Z depth (-0.28 rear .. +0.28 front), Y = height (0.045 .. 0.435)
  const s = new THREE.Shape();
  s.moveTo(-0.26, 0.045);
  s.lineTo(0.26, 0.045);
  s.lineTo(0.24, 0.115);
  s.quadraticCurveTo(0.16, 0.155, 0.15, 0.245);
  s.quadraticCurveTo(0.16, 0.34, 0.245, 0.385);
  s.lineTo(0.255, 0.43);
  s.lineTo(-0.245, 0.43);
  s.lineTo(-0.23, 0.375);
  s.quadraticCurveTo(-0.15, 0.33, -0.145, 0.245);
  s.quadraticCurveTo(-0.15, 0.155, -0.23, 0.115);
  s.closePath();

  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.11,
    bevelEnabled: true,
    bevelThickness: 0.014,
    bevelSize: 0.012,
    bevelSegments: 2,
    curveSegments: 10,
  });
  // Rotate -90 deg around Y so shape +X maps directly to local +Z (front) and thickness centers on X=0
  geo.rotateY(-Math.PI * 0.5);
  geo.translate(0.055, 0, 0);
  return geo;
}

function createSweptArmrestMetalGeo(): THREE.BufferGeometry {
  // S-curved cast-iron armrest frame in Z-Y plane (shape X -> local Z depth: -Z rear .. +Z front)
  const s = new THREE.Shape();
  s.moveTo(-0.255, 0.43);
  s.lineTo(-0.205, 0.43);
  s.lineTo(-0.225, 0.65);
  s.quadraticCurveTo(-0.215, 0.678, -0.06, 0.675);
  s.lineTo(0.20, 0.675);
  s.quadraticCurveTo(0.265, 0.675, 0.27, 0.615);
  s.quadraticCurveTo(0.27, 0.545, 0.205, 0.535);
  s.quadraticCurveTo(0.16, 0.525, 0.155, 0.43);
  s.lineTo(0.20, 0.43);
  s.quadraticCurveTo(0.21, 0.505, 0.23, 0.545);
  s.quadraticCurveTo(0.305, 0.57, 0.30, 0.635);
  s.quadraticCurveTo(0.295, 0.71, 0.20, 0.71);
  s.lineTo(-0.08, 0.71);
  s.quadraticCurveTo(-0.24, 0.71, -0.265, 0.665);
  s.closePath();

  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.036,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2,
    curveSegments: 10,
  });
  // Rotate -90 deg around Y so +X -> +Z (front scroll faces forward)
  geo.rotateY(-Math.PI * 0.5);
  geo.translate(0.018, 0, 0);
  return geo;
}

function createBackStanchionGeo(): THREE.BufferGeometry {
  // Swept ergonomic reclined spine sitting immediately BEHIND the backrest slats (-0.255 .. -0.375)
  const s = new THREE.Shape();
  s.moveTo(-0.258, 0.39);
  s.lineTo(-0.218, 0.39);
  s.quadraticCurveTo(-0.255, 0.64, -0.340, 0.905);
  s.lineTo(-0.380, 0.915);
  s.quadraticCurveTo(-0.295, 0.64, -0.258, 0.39);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.034,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
    curveSegments: 8,
  });
  // Rotate -90 deg around Y so negative shape X stays negative Z (rear of bench)
  geo.rotateY(-Math.PI * 0.5);
  geo.translate(0.017, 0, 0);
  return geo;
}

function getDetailedBenchCache(): DetailedBenchCache {
  if (cachedDetailedBench) return cachedDetailedBench;

  const basaltParts: THREE.BufferGeometry[] = [];
  const graniteParts: THREE.BufferGeometry[] = [];
  const ironParts: THREE.BufferGeometry[] = [];
  const teakParts: THREE.BufferGeometry[] = [];
  const brassParts: THREE.BufferGeometry[] = [];

  const legXs = [-0.78, 0.78];
  const seatW = 1.98;
  const legGeo = createCarvedBenchLegGeo();
  const armGeo = createSweptArmrestMetalGeo();
  const spineGeo = createBackStanchionGeo();

  // A. Sculpted Stone Legs, Basalt Floor Shoes, Anchor Bolts, Side Rosettes & Stretcher Rods
  for (const lx of legXs) {
    // Dark basalt stepped shoe
    pushNonIndexedPart(basaltParts, makeWorldUvBoxGeo(0.20, 0.048, 0.60, 0.8, 0.8), 0.024, 0, 0, 0, lx, 0);
    // Carved grey granite scroll leg body
    pushNonIndexedPart(graniteParts, legGeo.clone(), 0, 0, 0, 0, lx, 0);
    // Carved top seat bolster pad
    pushNonIndexedPart(basaltParts, makeWorldUvBoxGeo(0.16, 0.028, 0.54, 0.8, 0.8), 0.442, 0, 0, 0, lx, 0);

    // Bronze floor anchor brackets + bolts
    for (const sz of [-0.26, 0.26]) {
      pushNonIndexedPart(ironParts, new THREE.BoxGeometry(0.22, 0.016, 0.05), 0.008, 0, 0, 0, lx, sz);
      for (const bx of [-0.085, 0.085]) {
        pushNonIndexedPart(brassParts, new THREE.CylinderGeometry(0.010, 0.010, 0.024, 6), 0.014, 0, 0, 0, lx + bx, sz);
      }
    }

    // Recessed bronze lotus rosette medallions on outer faces of both stone legs
    const outerSign = Math.sign(lx);
    pushNonIndexedPart(
      brassParts,
      new THREE.CylinderGeometry(0.042, 0.048, 0.016, 12),
      0.245,
      0,
      0,
      Math.PI * 0.5,
      lx + outerSign * 0.068,
      0,
    );

    // Swept Cast-Iron Scroll Armrest + Turned Teak Arm Pad on top
    pushNonIndexedPart(ironParts, armGeo.clone(), 0, 0, 0, 0, lx, 0);
    pushNonIndexedPart(teakParts, makeWorldUvBoxGeo(0.074, 0.030, 0.39, 0.6, 0.6), 0.718, 0, 0, 0, lx, 0.01);
    // Brass bolts fixing teak arm pad
    for (const az of [-0.11, 0.14]) {
      pushNonIndexedPart(brassParts, new THREE.SphereGeometry(0.009, 6, 5), 0.733, 0, 0, 0, lx, az);
    }
  }
  legGeo.dispose();
  armGeo.dispose();

  // Horizontal Cross-Stretcher Rods + Center Decorative Collar between legs
  for (const sz of [-0.12, 0.12]) {
    pushNonIndexedPart(ironParts, new THREE.CylinderGeometry(0.016, 0.016, 1.56, 10), 0.18, 0, 0, Math.PI * 0.5, 0, sz);
    pushNonIndexedPart(brassParts, new THREE.TorusGeometry(0.022, 0.007, 6, 14), 0.18, 0, Math.PI * 0.5, 0, 0, sz);
    pushNonIndexedPart(brassParts, new THREE.TorusGeometry(0.022, 0.007, 6, 14), 0.18, 0, Math.PI * 0.5, 0, -0.68, sz);
    pushNonIndexedPart(brassParts, new THREE.TorusGeometry(0.022, 0.007, 6, 14), 0.18, 0, Math.PI * 0.5, 0, 0.68, sz);
  }

  // B. 3 Forged Cast-Iron Rear Stanchions + Center Under-Seat Support Spine
  for (const sx of [-0.78, 0.0, 0.78]) {
    pushNonIndexedPart(ironParts, spineGeo.clone(), 0, 0, 0, 0, sx, 0);
    // Under-seat iron support rib running Z -0.24 .. +0.24
    pushNonIndexedPart(ironParts, new THREE.BoxGeometry(0.036, 0.034, 0.50), 0.436, 0, 0, 0, sx, 0.01);
  }
  spineGeo.dispose();

  // C. 7 Contoured Individually Spaced Teak Seat Slats (Ergonomic Waterfall Front + Subtle Lumbar Curve)
  // [zOffset, yOffset, rotX]
  const seatSlats: Array<[number, number, number]> = [
    [0.248, 0.456, 0.28], // Rolled waterfall front bullnose slat
    [0.172, 0.470, 0.06],
    [0.092, 0.471, 0.01],
    [0.012, 0.467, -0.02],
    [-0.068, 0.462, -0.04],
    [-0.148, 0.460, -0.03],
    [-0.224, 0.464, 0.05], // Rear seat slat tucked against backrest
  ];
  for (const [sz, sy, rx] of seatSlats) {
    pushNonIndexedPart(teakParts, makeWorldUvBoxGeo(seatW, 0.030, 0.066, 0.9, 0.4), sy, rx, 0, 0, 0, sz);
    for (const bx of [-0.78, 0.0, 0.78]) {
      pushNonIndexedPart(brassParts, new THREE.SphereGeometry(0.0085, 6, 5), sy + 0.014, 0, 0, 0, bx, sz);
    }
  }

  // D. 4 Ergonomic Reclined Backrest Teak Slats + Arched Carved Top Crest Rail & Center Lotus Emblem
  const backTilt = -0.22; // matches spine recline (-Z topward)
  const backSlatsY = [0.545, 0.635, 0.725, 0.815];
  for (const by of backSlatsY) {
    const bz = -0.23 - (by - 0.39) * 0.21;
    pushNonIndexedPart(teakParts, makeWorldUvBoxGeo(seatW - 0.04, 0.068, 0.028, 0.9, 0.4), by, backTilt, 0, 0, 0, bz);
    for (const bx of [-0.78, 0.0, 0.78]) {
      pushNonIndexedPart(brassParts, new THREE.SphereGeometry(0.0085, 6, 5), by, 0, 0, 0, bx, bz + 0.015);
    }
  }

  // Carved Top Crest Rail + Bronze Frame Finial Caps + Center Carved Dharmachakra Medallion Plaque
  const crestY = 0.905;
  const crestZ = -0.338;
  pushNonIndexedPart(teakParts, makeWorldUvBoxGeo(seatW + 0.02, 0.075, 0.038, 0.9, 0.4), crestY, backTilt, 0, 0, 0, crestZ);
  // Raised center crown plaque on crest rail
  pushNonIndexedPart(teakParts, makeWorldUvBoxGeo(0.36, 0.115, 0.044, 0.6, 0.4), crestY + 0.02, backTilt, 0, 0, 0, crestZ);
  pushNonIndexedPart(
    brassParts,
    new THREE.TorusGeometry(0.044, 0.008, 8, 20),
    crestY + 0.022,
    backTilt,
    0,
    0,
    0,
    crestZ + 0.025,
  );
  for (let sp = 0; sp < 4; sp++) {
    pushNonIndexedPart(
      brassParts,
      new THREE.CylinderGeometry(0.0035, 0.0035, 0.082, 5),
      crestY + 0.022,
      backTilt,
      0,
      (sp / 4) * Math.PI,
      0,
      crestZ + 0.025,
    );
  }
  pushNonIndexedPart(
    brassParts,
    new THREE.SphereGeometry(0.016, 8, 6),
    crestY + 0.022,
    0,
    0,
    0,
    0,
    crestZ + 0.025,
  );
  for (const sx of [-1, 1]) {
    pushNonIndexedPart(
      brassParts,
      new THREE.SphereGeometry(0.024, 8, 6),
      crestY + 0.045,
      0,
      0,
      0,
      sx * (seatW * 0.5 - 0.04),
      crestZ - 0.008,
    );
  }

  const basaltGeo = mergeGeometries(basaltParts, false)!;
  const graniteGeo = mergeGeometries(graniteParts, false)!;
  const ironGeo = mergeGeometries(ironParts, false)!;
  const teakGeo = mergeGeometries(teakParts, false)!;
  const brassGeo = mergeGeometries(brassParts, false)!;

  basaltParts.forEach((p) => p.dispose());
  graniteParts.forEach((p) => p.dispose());
  ironParts.forEach((p) => p.dispose());
  teakParts.forEach((p) => p.dispose());
  brassParts.forEach((p) => p.dispose());

  cachedDetailedBench = {
    basaltGeo,
    graniteGeo,
    ironGeo,
    teakGeo,
    brassGeo,
  };
  return cachedDetailedBench;
}

/**
 * Builds a museum-grade Lumbini Heritage Bench:
 * sculpted grey granite pedestal legs with bronze anchors & side medallions,
 * 7-slat contoured oiled Burmese teak seat with brass bolts, cast-iron stanchions,
 * swept scrolled armrests, and a carved backrest crest with Dharmachakra emblem.
 */
export function buildDetailedLumbiniBench(): THREE.Group {
  const cache = getDetailedBenchCache();
  const mats = getLumbiniGardenCraftMaterials();
  const g = new THREE.Group();

  const basaltMesh = new THREE.Mesh(cache.basaltGeo, mats.basaltMat);
  basaltMesh.castShadow = true;
  basaltMesh.receiveShadow = true;

  const graniteMesh = new THREE.Mesh(cache.graniteGeo, mats.graniteMat);
  graniteMesh.castShadow = true;
  graniteMesh.receiveShadow = true;

  const ironMesh = new THREE.Mesh(cache.ironGeo, mats.castIronMat);
  ironMesh.castShadow = true;
  ironMesh.userData.nonCollidable = true;

  const teakMesh = new THREE.Mesh(cache.teakGeo, mats.teakWoodMat);
  teakMesh.castShadow = true;
  teakMesh.receiveShadow = true;

  const brassMesh = new THREE.Mesh(cache.brassGeo, mats.giltBrassMat);
  brassMesh.userData.nonCollidable = true;

  g.add(basaltMesh, graniteMesh, ironMesh, teakMesh, brassMesh);
  return g;
}

// =========================================================================
// 3. EXCAVATED MAURYAN / KUSHAN VOTIVE BRICK STUPA RUIN & RELIC SHRINE
// =========================================================================

function createMonolithicVotiveStupaGeo(): THREE.BufferGeometry {
  const pts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.32, 0.0),
    new THREE.Vector2(0.30, 0.05),
    new THREE.Vector2(0.24, 0.09),
    new THREE.Vector2(0.26, 0.14),
    new THREE.Vector2(0.21, 0.19),
    // Bell-shaped anda dome
    new THREE.Vector2(0.22, 0.28),
    new THREE.Vector2(0.18, 0.37),
    new THREE.Vector2(0.11, 0.43),
    // Harmika & carved chhatravali tiers
    new THREE.Vector2(0.125, 0.46),
    new THREE.Vector2(0.095, 0.50),
    new THREE.Vector2(0.075, 0.54),
    new THREE.Vector2(0.055, 0.58),
    new THREE.Vector2(0.032, 0.63),
    new THREE.Vector2(0.0, 0.67),
  ];
  const geo = new THREE.LatheGeometry(pts, 18);
  geo.computeVertexNormals();
  return geo;
}

let cachedVotiveCrownGeo: THREE.BufferGeometry | null = null;

/**
 * Builds an authentic, highly detailed Lumbini Archaeological Votive Brick Stupa Ruin:
 * - Dressed basalt & sandstone excavation trench curb + 4 corner bollards
 * - World-UV Mauryan brick Triratha (cruciform) Jagati plinth with 3D brick dentil cornices
 * - 4 recessed arched Chaitya/Devakostha shrine niches with stone frames, sculpted Buddha/lotus
 *   relief medallions & projecting offering sills
 * - Twin glowing brass Diyo oil lamps & orange marigold petal offerings on the front sill
 * - Carved Padmasana sandstone lotus terrace + weathered octagonal/circular brick Medhi stupa drum
 * - Stepped ruined concentric brick Anda courses + carved monolithic sandstone Votive Stupa finial
 */
export function buildDetailedExcavatedBrickRuin(
  brickMat: THREE.Material,
  stoneMat: THREE.Material,
  bronzeMat: THREE.Material,
  flameMat: THREE.Material,
  w: number,
  h: number,
  d: number,
  variantIndex = 0,
): THREE.Group {
  const g = new THREE.Group();
  const mats = getLumbiniGardenCraftMaterials();
  const trimStoneMat = mats.weatheredSandstoneMat || stoneMat;

  const brickParts: THREE.BufferGeometry[] = [];
  const basaltParts: THREE.BufferGeometry[] = [];
  const stoneTrimParts: THREE.BufferGeometry[] = [];
  const alcoveParts: THREE.BufferGeometry[] = [];
  const bronzeParts: THREE.BufferGeometry[] = [];
  const marigoldParts: THREE.BufferGeometry[] = [];
  const mossParts: THREE.BufferGeometry[] = [];
  const flameParts: THREE.BufferGeometry[] = [];

  const minSpan = Math.min(w, d);
  const plH = Math.max(0.46, h * 0.48);

  // 1. Grounded Dark Basalt Foundation Curb + 4 Corner Dressed Stone Bollards (y = 0 .. 0.14)
  pushNonIndexedPart(
    basaltParts,
    makeWorldUvBoxGeo(w + 0.30, 0.11, d + 0.30, 1.2, 0.8),
    0.055,
  );
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      pushNonIndexedPart(
        stoneTrimParts,
        new THREE.CylinderGeometry(0.085, 0.105, 0.26, 8),
        0.18,
        0,
        Math.PI / 8,
        0,
        sx * (w * 0.5 + 0.05),
        sz * (d * 0.5 + 0.05),
      );
      pushNonIndexedPart(
        stoneTrimParts,
        new THREE.SphereGeometry(0.082, 8, 6),
        0.31,
        0,
        0,
        0,
        sx * (w * 0.5 + 0.05),
        sz * (d * 0.5 + 0.05),
      );
    }
  }

  // 2. Stepped Triratha (Cruciform) Mauryan Brick Jagati Plinth + Corner Pilasters + Corbel Brick Dentils
  const tier1H = plH;
  const tier1Y = 0.10 + tier1H * 0.5;
  pushNonIndexedPart(brickParts, makeWorldUvBoxGeo(w, tier1H, d), tier1Y);

  // Projecting central bhadra shrine bays on X and Z axes
  const bhadraW = w * 0.52;
  const bhadraD = d * 0.52;
  const bhadraProj = 0.22;
  pushNonIndexedPart(
    brickParts,
    makeWorldUvBoxGeo(bhadraW, tier1H * 0.94, d + bhadraProj * 2),
    0.10 + tier1H * 0.47,
  );
  pushNonIndexedPart(
    brickParts,
    makeWorldUvBoxGeo(w + bhadraProj * 2, tier1H * 0.94, bhadraD),
    0.10 + tier1H * 0.47,
  );

  // 4 Corner brick Karni pilasters + natural organic moss/lichen cluster patches along lower plinth
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      pushNonIndexedPart(
        brickParts,
        makeWorldUvBoxGeo(0.32, tier1H + 0.04, 0.32),
        0.10 + (tier1H + 0.04) * 0.5,
        0,
        0,
        0,
        sx * (w * 0.5 - 0.12),
        sz * (d * 0.5 - 0.12),
      );
      for (let m = 0; m < 3; m++) {
        const tuft = new THREE.DodecahedronGeometry(0.075 + m * 0.015, 0);
        tuft.scale(1.6, 0.42, 1.3);
        pushNonIndexedPart(
          mossParts,
          tuft,
          0.115,
          0,
          m * 0.9,
          0,
          sx * (w * 0.5 - 0.05 + m * 0.03),
          sz * (d * 0.5 - 0.05 - m * 0.03),
        );
      }
    }
  }

  // Corbeled brick cornice band + 3D projecting brick dentil teeth along all 4 sides
  const corniceY = 0.10 + tier1H + 0.045;
  pushNonIndexedPart(brickParts, makeWorldUvBoxGeo(w + 0.12, 0.09, d + 0.12), corniceY);
  const dentilY = corniceY - 0.065;
  const xCount = Math.max(6, Math.round(w / 0.32));
  for (let i = 0; i <= xCount; i++) {
    const dx = THREE.MathUtils.lerp(-w * 0.45, w * 0.45, i / xCount);
    for (const sz of [-1, 1]) {
      const zOff = Math.abs(dx) < bhadraW * 0.49 ? d * 0.5 + bhadraProj + 0.03 : d * 0.5 + 0.04;
      pushNonIndexedPart(brickParts, makeWorldUvBoxGeo(0.11, 0.06, 0.08), dentilY, 0, 0, 0, dx, sz * zOff);
    }
  }
  const zCount = Math.max(5, Math.round(d / 0.32));
  for (let i = 0; i <= zCount; i++) {
    const dz = THREE.MathUtils.lerp(-d * 0.45, d * 0.45, i / zCount);
    for (const sx of [-1, 1]) {
      const xOff = Math.abs(dz) < bhadraD * 0.49 ? w * 0.5 + bhadraProj + 0.03 : w * 0.5 + 0.04;
      pushNonIndexedPart(brickParts, makeWorldUvBoxGeo(0.08, 0.06, 0.11), dentilY, 0, 0, 0, sx * xOff, dz);
    }
  }

  // 3. 4 Recessed Arched Devakostha Shrine Niches + Sandstone Frames + Offering Sills + Diyo Lamps
  const nicheMidY = 0.12 + tier1H * 0.50;
  const nicheH = Math.min(0.42, tier1H * 0.68);
  const addCardinalNiche = (axis: 'z' | 'x', dir: -1 | 1, includeOfferings: boolean) => {
    const rotY = axis === 'z' ? (dir > 0 ? 0 : Math.PI) : (dir > 0 ? Math.PI * 0.5 : -Math.PI * 0.5);
    const dist = (axis === 'z' ? d * 0.5 : w * 0.5) + bhadraProj;

    const localStone: THREE.BufferGeometry[] = [];
    const localAlcove: THREE.BufferGeometry[] = [];
    const localBronze: THREE.BufferGeometry[] = [];

    // Shadowed recessed niche back wall
    pushNonIndexedPart(localAlcove, new THREE.BoxGeometry(0.46, nicheH, 0.08), nicheMidY, 0, 0, 0, 0, -0.01);
    // Sculpted bronze/gilt miniature seated Buddha & lotus cushion inside niche
    pushNonIndexedPart(localBronze, new THREE.CylinderGeometry(0.105, 0.125, 0.045, 10), nicheMidY - nicheH * 0.30, 0, 0, 0, 0, 0.035);
    pushNonIndexedPart(localBronze, new THREE.ConeGeometry(0.09, 0.16, 10), nicheMidY - nicheH * 0.10, 0, 0, 0, 0, 0.038);
    pushNonIndexedPart(localBronze, new THREE.SphereGeometry(0.048, 8, 8), nicheMidY + nicheH * 0.08, 0, 0, 0, 0, 0.042);

    // Side sandstone pilasters + offering sill + corbelled pointed Chaitya arch gable
    for (const sx of [-0.26, 0.26]) {
      pushNonIndexedPart(localStone, new THREE.BoxGeometry(0.075, nicheH + 0.04, 0.095), nicheMidY, 0, 0, 0, sx, 0.035);
    }
    pushNonIndexedPart(localStone, new THREE.BoxGeometry(0.70, 0.068, 0.22), nicheMidY - nicheH * 0.5 - 0.02, 0, 0, 0, 0, 0.09);
    pushNonIndexedPart(localStone, new THREE.BoxGeometry(0.64, 0.07, 0.12), nicheMidY + nicheH * 0.5 + 0.025, 0, 0, 0, 0, 0.045);
    pushNonIndexedPart(localStone, new THREE.CylinderGeometry(0.06, 0.25, 0.13, 4), nicheMidY + nicheH * 0.5 + 0.11, 0, Math.PI * 0.25, 0, 0, 0.045);

    for (const pg of localStone) {
      pg.rotateY(rotY);
      pg.translate(axis === 'x' ? dir * dist : 0, 0, axis === 'z' ? dir * dist : 0);
      stoneTrimParts.push(pg);
    }
    for (const ag of localAlcove) {
      ag.rotateY(rotY);
      ag.translate(axis === 'x' ? dir * dist : 0, 0, axis === 'z' ? dir * dist : 0);
      alcoveParts.push(ag);
    }
    for (const bg of localBronze) {
      bg.rotateY(rotY);
      bg.translate(axis === 'x' ? dir * dist : 0, 0, axis === 'z' ? dir * dist : 0);
      bronzeParts.push(bg);
    }

    // Front South (+Z) Devotional Brass Diyo Oil Lamps & Marigold Offerings on Sills
    if (includeOfferings) {
      const sillTopY = nicheMidY - nicheH * 0.5 + 0.014;
      const sillZ = dist + 0.145;
      for (const lx of [-0.21, 0.21]) {
        pushNonIndexedPart(bronzeParts, new THREE.CylinderGeometry(0.044, 0.028, 0.034, 10), sillTopY + 0.017, 0, 0, 0, lx, sillZ);
        pushNonIndexedPart(flameParts, new THREE.ConeGeometry(0.016, 0.048, 7), sillTopY + 0.056, 0, 0, 0, lx, sillZ);
      }
      for (let m = 0; m < 5; m++) {
        const mx = (m - 2) * 0.058;
        pushNonIndexedPart(
          marigoldParts,
          new THREE.DodecahedronGeometry(0.028, 0),
          sillTopY + 0.018,
          0,
          m * 0.7,
          0,
          mx,
          sillZ + 0.01,
        );
      }
    }
  };

  addCardinalNiche('z', 1, true);
  addCardinalNiche('z', -1, false);
  addCardinalNiche('x', -1, false);
  addCardinalNiche('x', 1, variantIndex % 2 === 0);

  // 4. Upper Carved Sandstone Padmasana Molding + Circular/Octagonal Brick Medhi Stupa Drum
  const deckY = 0.10 + tier1H + 0.09;
  const trimDeckW = w * 0.80;
  const trimDeckD = d * 0.80;
  pushNonIndexedPart(stoneTrimParts, makeWorldUvBoxGeo(trimDeckW + 0.06, 0.075, trimDeckD + 0.06, 1.4, 1.0), deckY + 0.038);
  pushNonIndexedPart(brickParts, makeWorldUvBoxGeo(trimDeckW, 0.18, trimDeckD), deckY + 0.165);
  pushNonIndexedPart(stoneTrimParts, makeWorldUvBoxGeo(trimDeckW + 0.05, 0.06, trimDeckD + 0.05, 1.4, 1.0), deckY + 0.285);

  const drumBaseY = deckY + 0.315;
  const drumR = minSpan * 0.31;
  const drumH = Math.max(0.24, h * 0.28);
  // Circular/16-sided brick stupa drum + carved basalt/sandstone base ring
  pushNonIndexedPart(
    basaltParts,
    new THREE.CylinderGeometry(drumR + 0.06, drumR + 0.10, 0.07, 16),
    drumBaseY + 0.035,
  );
  pushNonIndexedPart(
    brickParts,
    makeWorldUvBrickCylGeo(drumR * 0.96, drumR, drumH, 16),
    drumBaseY + 0.07 + drumH * 0.5,
  );

  // 8 Brick & Sandstone Drum Stambha Pilasters around the circular Medhi drum
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const rx = Math.cos(a) * (drumR * 0.97);
    const rz = Math.sin(a) * (drumR * 0.97);
    pushNonIndexedPart(
      stoneTrimParts,
      new THREE.BoxGeometry(0.11, drumH * 0.85, 0.085),
      drumBaseY + 0.07 + drumH * 0.45,
      0,
      -a + Math.PI * 0.5,
      0,
      rx,
      rz,
    );
  }

  // 5. Stepped Concentric Weathered Brick Anda Courses + Carved Monolithic Votive Stupa Crown
  const crownBaseY = drumBaseY + 0.07 + drumH;
  pushNonIndexedPart(
    brickParts,
    makeWorldUvBrickCylGeo(drumR * 0.78, drumR * 0.90, 0.12, 14),
    crownBaseY + 0.06,
  );
  pushNonIndexedPart(
    brickParts,
    makeWorldUvBrickCylGeo(drumR * 0.58, drumR * 0.72, 0.11, 12),
    crownBaseY + 0.175,
  );

  // Seated irregular excavated brick blocks perched cleanly ON the inner brick courses (zero overhang!)
  const blockCount = 10;
  for (let b = 0; b < blockCount; b++) {
    const n = hash2d(b, variantIndex + 3, 251);
    if (n < 0.25) continue;
    const a = (b / blockCount) * Math.PI * 2 + variantIndex * 0.4;
    const rad = drumR * (0.46 + (b % 2) * 0.14);
    const bh = 0.06 + n * 0.055;
    pushNonIndexedPart(
      brickParts,
      makeWorldUvBoxGeo(0.18, bh, 0.13),
      crownBaseY + 0.12 + bh * 0.5,
      0,
      -a,
      0,
      Math.cos(a) * rad,
      Math.sin(a) * rad,
    );
  }

  // Monolithic Carved Sandstone Votive Chaitya Crown atop center
  if (!cachedVotiveCrownGeo) {
    cachedVotiveCrownGeo = createMonolithicVotiveStupaGeo();
  }
  const crownScale = THREE.MathUtils.clamp(minSpan / 3.4, 0.75, 1.18);
  const votiveCrown = cachedVotiveCrownGeo.clone();
  votiveCrown.scale(crownScale, crownScale, crownScale);
  votiveCrown.translate(0, crownBaseY + 0.21, 0);
  pushNonIndexedPart(stoneTrimParts, votiveCrown);

  // Merge grouped static geometries cleanly for fast draw calls & accurate BVH collision
  const solidBrickGeo = mergeGeometries(brickParts, false)!;
  const solidBasaltGeo = mergeGeometries(basaltParts, false)!;
  const solidStoneGeo = mergeGeometries(stoneTrimParts, false)!;
  const solidAlcoveGeo = mergeGeometries(alcoveParts, false)!;

  brickParts.forEach((p) => p.dispose());
  basaltParts.forEach((p) => p.dispose());
  stoneTrimParts.forEach((p) => p.dispose());
  alcoveParts.forEach((p) => p.dispose());

  const brickMesh = new THREE.Mesh(solidBrickGeo, brickMat);
  brickMesh.castShadow = true;
  brickMesh.receiveShadow = true;

  const basaltMesh = new THREE.Mesh(solidBasaltGeo, mats.basaltMat);
  basaltMesh.castShadow = true;
  basaltMesh.receiveShadow = true;

  const stoneMesh = new THREE.Mesh(solidStoneGeo, trimStoneMat);
  stoneMesh.castShadow = true;
  stoneMesh.receiveShadow = true;

  const alcoveMesh = new THREE.Mesh(solidAlcoveGeo, mats.stupaAlcoveMat);
  alcoveMesh.userData.nonCollidable = true;

  g.add(brickMesh, basaltMesh, stoneMesh, alcoveMesh);

  if (bronzeParts.length > 0) {
    const bronzeGeo = mergeGeometries(bronzeParts, false)!;
    bronzeParts.forEach((p) => p.dispose());
    const bronzeMesh = new THREE.Mesh(bronzeGeo, bronzeMat);
    bronzeMesh.userData.nonCollidable = true;
    g.add(bronzeMesh);
  }
  if (flameParts.length > 0) {
    const flameGeo = mergeGeometries(flameParts, false)!;
    flameParts.forEach((p) => p.dispose());
    const flameMesh = new THREE.Mesh(flameGeo, flameMat);
    flameMesh.userData.nonCollidable = true;
    g.add(flameMesh);
  }
  if (marigoldParts.length > 0) {
    const marigoldGeo = mergeGeometries(marigoldParts, false)!;
    marigoldParts.forEach((p) => p.dispose());
    const marigoldMesh = new THREE.Mesh(marigoldGeo, mats.marigoldMat);
    marigoldMesh.userData.nonCollidable = true;
    g.add(marigoldMesh);
  }
  if (mossParts.length > 0) {
    const mossGeo = mergeGeometries(mossParts, false)!;
    mossParts.forEach((p) => p.dispose());
    const mossMesh = new THREE.Mesh(mossGeo, mats.mossMat);
    mossMesh.userData.nonCollidable = true;
    g.add(mossMesh);
  }

  return g;
}

// =========================================================================
// 4. CARVED HERITAGE GRANITE & BRONZE PROMENADE BOLLARDS + CHAIN SWAGS
// =========================================================================

const _craftM4 = new THREE.Matrix4();
const _craftV3 = new THREE.Vector3();
const _craftQ = new THREE.Quaternion();
const _craftS = new THREE.Vector3();
const _craftE = new THREE.Euler();
const _craftColor = new THREE.Color();

interface DetailedBollardGeos {
  basaltGeo: THREE.BufferGeometry;
  graniteGeo: THREE.BufferGeometry;
  bronzeGeo: THREE.BufferGeometry;
  giltGeo: THREE.BufferGeometry;
}

let cachedBollardGeos: DetailedBollardGeos | null = null;

function getDetailedBollardGeos(): DetailedBollardGeos {
  if (cachedBollardGeos) return cachedBollardGeos;

  // Basalt stepped octagonal plinth base (y: 0.0 .. 0.145)
  const basaltParts: THREE.BufferGeometry[] = [];
  pushNonIndexedPart(basaltParts, new THREE.CylinderGeometry(0.145, 0.162, 0.075, 8), 0.0375, 0, Math.PI / 8);
  pushNonIndexedPart(basaltParts, new THREE.CylinderGeometry(0.125, 0.142, 0.055, 8), 0.102, 0, Math.PI / 8);
  pushNonIndexedPart(basaltParts, new THREE.TorusGeometry(0.122, 0.015, 6, 16), 0.132, Math.PI / 2);

  // Carved speckled granite shaft with molded base torus, waist flutes, collar & capital (y: 0.14 .. 0.72)
  const shaftPts = [
    new THREE.Vector2(0.0, 0.138),
    new THREE.Vector2(0.118, 0.140),
    new THREE.Vector2(0.105, 0.185),
    new THREE.Vector2(0.116, 0.215),
    new THREE.Vector2(0.098, 0.245),
    new THREE.Vector2(0.092, 0.395),
    new THREE.Vector2(0.106, 0.422),
    new THREE.Vector2(0.090, 0.450),
    new THREE.Vector2(0.084, 0.615),
    new THREE.Vector2(0.102, 0.655),
    new THREE.Vector2(0.112, 0.692),
    new THREE.Vector2(0.092, 0.722),
    new THREE.Vector2(0.0, 0.722),
  ];
  const graniteParts: THREE.BufferGeometry[] = [];
  pushNonIndexedPart(graniteParts, new THREE.LatheGeometry(shaftPts, 16));
  // 8 subtle vertical carved chamfer ribs around lower & upper barrel
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    pushNonIndexedPart(
      graniteParts,
      new THREE.CylinderGeometry(0.012, 0.014, 0.34, 5),
      0.43,
      0,
      -a,
      0,
      Math.cos(a) * 0.088,
      Math.sin(a) * 0.088,
    );
  }

  // Cast-bronze waist band, anchor rings & lotus calyx neck collar
  const bronzeParts: THREE.BufferGeometry[] = [];
  pushNonIndexedPart(bronzeParts, new THREE.TorusGeometry(0.098, 0.014, 7, 16), 0.422, Math.PI / 2);
  pushNonIndexedPart(bronzeParts, new THREE.CylinderGeometry(0.115, 0.094, 0.052, 16), 0.725);
  pushNonIndexedPart(bronzeParts, new THREE.TorusGeometry(0.108, 0.013, 7, 16), 0.748, Math.PI / 2);
  // 4 embossed bronze rosette studs + side ring eyes on waist
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    pushNonIndexedPart(
      bronzeParts,
      new THREE.SphereGeometry(0.018, 6, 5),
      0.422,
      0,
      0,
      0,
      Math.cos(a) * 0.105,
      Math.sin(a) * 0.105,
    );
  }
  for (const sx of [-1, 1]) {
    pushNonIndexedPart(bronzeParts, new THREE.TorusGeometry(0.032, 0.008, 6, 12), 0.565, 0, Math.PI / 2, 0, sx * 0.105, 0);
  }

  // Stepped gilt-brass Kalash urn & lotus-bud crown finial (y: 0.74 .. 0.92 — never a bare sphere!)
  const giltPts = [
    new THREE.Vector2(0.0, 0.745),
    new THREE.Vector2(0.092, 0.748),
    new THREE.Vector2(0.068, 0.768),
    new THREE.Vector2(0.088, 0.805),
    new THREE.Vector2(0.078, 0.842),
    new THREE.Vector2(0.044, 0.865),
    new THREE.Vector2(0.054, 0.880),
    new THREE.Vector2(0.022, 0.904),
    new THREE.Vector2(0.0, 0.935),
  ];
  const giltParts: THREE.BufferGeometry[] = [];
  pushNonIndexedPart(giltParts, new THREE.LatheGeometry(giltPts, 16));

  const basaltGeo = mergeGeometries(basaltParts, false)!;
  const graniteGeo = mergeGeometries(graniteParts, false)!;
  const bronzeGeo = mergeGeometries(bronzeParts, false)!;
  const giltGeo = mergeGeometries(giltParts, false)!;

  basaltParts.forEach((p) => p.dispose());
  graniteParts.forEach((p) => p.dispose());
  bronzeParts.forEach((p) => p.dispose());
  giltParts.forEach((p) => p.dispose());

  cachedBollardGeos = { basaltGeo, graniteGeo, bronzeGeo, giltGeo };
  return cachedBollardGeos;
}

/**
 * Builds instanced, ultra-detailed carved basalt, speckled granite & bronze Kalash bollards
 * with optional forged hanging chain swags connecting bollard pairs.
 */
export function buildDetailedLumbiniBollards(
  coords: Array<[number, number]>,
  opts?: {
    baseY?: number;
    heightScale?: number;
    radiusScale?: number;
    bronzeMat?: THREE.Material;
    giltMat?: THREE.Material;
    chainLinks?: Array<[number, number]>;
  },
): THREE.Group {
  const g = new THREE.Group();
  const geos = getDetailedBollardGeos();
  const mats = getLumbiniGardenCraftMaterials();
  const baseY = opts?.baseY ?? 0.08;
  const sy = opts?.heightScale ?? 1.0;
  const sxz = opts?.radiusScale ?? 1.0;
  const bronzeMat = opts?.bronzeMat ?? mats.castIronMat;
  const giltMat = opts?.giltMat ?? mats.giltBrassMat;

  const basaltInst = new THREE.InstancedMesh(geos.basaltGeo, mats.basaltMat, coords.length);
  const graniteInst = new THREE.InstancedMesh(geos.graniteGeo, mats.graniteMat, coords.length);
  const bronzeInst = new THREE.InstancedMesh(geos.bronzeGeo, bronzeMat, coords.length);
  const giltInst = new THREE.InstancedMesh(geos.giltGeo, giltMat, coords.length);

  for (const inst of [basaltInst, graniteInst, bronzeInst, giltInst]) {
    inst.castShadow = true;
    inst.receiveShadow = true;
    inst.userData.nonCollidable = true;
  }

  coords.forEach(([bx, bz], idx) => {
    _craftV3.set(bx, baseY, bz);
    _craftQ.identity();
    _craftS.set(sxz, sy, sxz);
    _craftM4.compose(_craftV3, _craftQ, _craftS);
    basaltInst.setMatrixAt(idx, _craftM4);
    graniteInst.setMatrixAt(idx, _craftM4);
    bronzeInst.setMatrixAt(idx, _craftM4);
    giltInst.setMatrixAt(idx, _craftM4);
  });

  for (const inst of [basaltInst, graniteInst, bronzeInst, giltInst]) {
    inst.instanceMatrix.needsUpdate = true;
    inst.computeBoundingSphere();
  }
  g.add(basaltInst, graniteInst, bronzeInst, giltInst);

  // Optional draped forged cast-iron/bronze catenary chain swags linking pairs of bollard indices
  if (opts?.chainLinks && opts.chainLinks.length > 0) {
    const chainParts: THREE.BufferGeometry[] = [];
    const anchorY = baseY + 0.565 * sy;
    for (const [iA, iB] of opts.chainLinks) {
      const a = coords[iA];
      const b = coords[iB];
      if (!a || !b) continue;
      const midX = (a[0] + b[0]) * 0.5;
      const midZ = (a[1] + b[1]) * 0.5;
      const span = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const sag = Math.min(0.24, span * 0.075);
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(a[0], anchorY, a[1]),
        new THREE.Vector3((a[0] + midX) * 0.5, anchorY - sag * 0.72, (a[1] + midZ) * 0.5),
        new THREE.Vector3(midX, anchorY - sag, midZ),
        new THREE.Vector3((b[0] + midX) * 0.5, anchorY - sag * 0.72, (b[1] + midZ) * 0.5),
        new THREE.Vector3(b[0], anchorY, b[1]),
      ]);
      const tube = new THREE.TubeGeometry(curve, 14, 0.015, 6, false);
      pushNonIndexedPart(chainParts, tube);
      // Individual chain bead links along curve for crisp metallic silhouette
      for (let k = 1; k < 10; k++) {
        const pt = curve.getPoint(k / 10);
        const bead = new THREE.TorusGeometry(0.021, 0.006, 5, 10);
        pushNonIndexedPart(chainParts, bead, pt.y, k % 2 === 0 ? 0 : Math.PI * 0.5, 0, 0, pt.x, pt.z);
      }
    }
    if (chainParts.length > 0) {
      const chainGeo = mergeGeometries(chainParts, false)!;
      chainParts.forEach((p) => p.dispose());
      const chainMesh = new THREE.Mesh(chainGeo, mats.castIronMat);
      chainMesh.castShadow = true;
      chainMesh.userData.nonCollidable = true;
      g.add(chainMesh);
    }
  }

  return g;
}

// =========================================================================
// 5. PUSHKARINI OVERLOOK CARVED GRANITE, BALUSTER & DHARMACHAKRA BALUSTRADE
// =========================================================================

/**
 * Builds an intricate, multi-material Himalayan carved stone, turned baluster & bronze
 * Dharmachakra railing anchored flush onto a stepped dark basalt curb (zero underside gap).
 */
export function buildDetailedOverlookBalustrade(
  x: number,
  zStart: number,
  zEnd: number,
  bayCount: number,
  bronzeMat?: THREE.Material,
  giltMat?: THREE.Material,
): THREE.Group {
  const g = new THREE.Group();
  const mats = getLumbiniGardenCraftMaterials();
  const useBronze = bronzeMat ?? mats.castIronMat;
  const useGilt = giltMat ?? mats.giltBrassMat;

  const totalLen = Math.abs(zEnd - zStart);
  const centerZ = (zStart + zEnd) * 0.5;
  const baySpan = totalLen / bayCount;

  const basaltParts: THREE.BufferGeometry[] = [];
  const graniteParts: THREE.BufferGeometry[] = [];
  const bronzeParts: THREE.BufferGeometry[] = [];
  const giltParts: THREE.BufferGeometry[] = [];

  // Continuous stepped dark basalt ground plinth curb anchored cleanly into paver surface (y = 0.02 .. 0.18)
  pushNonIndexedPart(basaltParts, makeWorldUvBoxGeo(0.36, 0.11, totalLen + 0.42, 1.2, 0.8), 0.075, 0, 0, 0, x, centerZ);
  pushNonIndexedPart(basaltParts, makeWorldUvBoxGeo(0.28, 0.06, totalLen + 0.30, 1.2, 0.8), 0.16, 0, 0, 0, x, centerZ);

  // Molded granite lower sill & beveled top handrail coping (y = 0.22..0.28 & y = 0.72..0.81)
  pushNonIndexedPart(graniteParts, makeWorldUvBoxGeo(0.18, 0.065, totalLen, 1.4, 0.8), 0.225, 0, 0, 0, x, centerZ);
  pushNonIndexedPart(graniteParts, makeWorldUvBoxGeo(0.20, 0.065, totalLen + 0.12, 1.4, 0.8), 0.745, 0, 0, 0, x, centerZ);
  pushNonIndexedPart(graniteParts, makeWorldUvBoxGeo(0.15, 0.036, totalLen + 0.08, 1.4, 0.8), 0.794, 0, 0, 0, x, centerZ);

  // Reusable turned stone vase baluster template (y: 0.255 .. 0.715)
  const balusterPts = [
    new THREE.Vector2(0.0, 0.255),
    new THREE.Vector2(0.056, 0.258),
    new THREE.Vector2(0.050, 0.288),
    new THREE.Vector2(0.032, 0.325),
    new THREE.Vector2(0.058, 0.415),
    new THREE.Vector2(0.064, 0.480),
    new THREE.Vector2(0.034, 0.565),
    new THREE.Vector2(0.028, 0.625),
    new THREE.Vector2(0.048, 0.675),
    new THREE.Vector2(0.056, 0.712),
    new THREE.Vector2(0.0, 0.715),
  ];
  const balusterGeo = new THREE.LatheGeometry(balusterPts, 12);

  // Pier crown brass Kalash finial template
  const pierFinialPts = [
    new THREE.Vector2(0.0, 0.875),
    new THREE.Vector2(0.068, 0.878),
    new THREE.Vector2(0.050, 0.896),
    new THREE.Vector2(0.066, 0.930),
    new THREE.Vector2(0.056, 0.962),
    new THREE.Vector2(0.028, 0.985),
    new THREE.Vector2(0.038, 1.000),
    new THREE.Vector2(0.015, 1.024),
    new THREE.Vector2(0.0, 1.052),
  ];
  const pierFinialGeo = new THREE.LatheGeometry(pierFinialPts, 14);

  // Monumental Carved Corner & Bay Piers
  for (let i = 0; i <= bayCount; i++) {
    const pz = zStart + i * baySpan;
    // Stepped basalt pier shoe
    pushNonIndexedPart(basaltParts, makeWorldUvBoxGeo(0.28, 0.08, 0.28, 0.8, 0.8), 0.21, 0, 0, 0, x, pz);
    // Chamfered carved granite pier shaft
    pushNonIndexedPart(graniteParts, makeWorldUvBoxGeo(0.22, 0.54, 0.22, 0.8, 0.8), 0.52, 0, 0, 0, x, pz);
    // Recessed decorative vertical stone panel frames on pier faces
    pushNonIndexedPart(basaltParts, makeWorldUvBoxGeo(0.236, 0.34, 0.12, 0.8, 0.8), 0.50, 0, 0, 0, x, pz);
    pushNonIndexedPart(basaltParts, makeWorldUvBoxGeo(0.12, 0.34, 0.236, 0.8, 0.8), 0.50, 0, 0, 0, x, pz);
    // Stepped flared stone capital collar
    pushNonIndexedPart(graniteParts, makeWorldUvBoxGeo(0.27, 0.055, 0.27, 0.8, 0.8), 0.815, 0, 0, 0, x, pz);
    pushNonIndexedPart(basaltParts, makeWorldUvBoxGeo(0.23, 0.035, 0.23, 0.8, 0.8), 0.858, 0, 0, 0, x, pz);
    // Bronze lotus calyx neck + gilt Kalash finial
    pushNonIndexedPart(bronzeParts, new THREE.CylinderGeometry(0.082, 0.068, 0.032, 12), 0.875, 0, 0, 0, x, pz);
    pushNonIndexedPart(giltParts, pierFinialGeo.clone(), 0, 0, 0, 0, x, pz);
  }

  // Ornate Intermediate Bays: 4 turned stone balusters flanking a cast-bronze Dharmachakra wheel
  for (let b = 0; b < bayCount; b++) {
    const bMidZ = zStart + (b + 0.5) * baySpan;
    const innerHalf = baySpan * 0.5 - 0.14;
    const balOffs = [-innerHalf * 0.78, -innerHalf * 0.44, innerHalf * 0.44, innerHalf * 0.78];
    for (const bo of balOffs) {
      pushNonIndexedPart(graniteParts, balusterGeo.clone(), 0, 0, 0, 0, x, bMidZ + bo);
      pushNonIndexedPart(bronzeParts, new THREE.TorusGeometry(0.044, 0.008, 6, 12), 0.48, Math.PI / 2, 0, 0, x, bMidZ + bo);
    }

    // Center Bronze Dharmachakra Wheel Frame inside carved granite ring
    const wheelY = 0.485;
    pushNonIndexedPart(graniteParts, new THREE.TorusGeometry(0.17, 0.024, 7, 18), wheelY, 0, Math.PI / 2, 0, x, bMidZ);
    pushNonIndexedPart(bronzeParts, new THREE.TorusGeometry(0.142, 0.014, 7, 18), wheelY, 0, Math.PI / 2, 0, x, bMidZ);
    pushNonIndexedPart(giltParts, new THREE.CylinderGeometry(0.032, 0.032, 0.042, 10), wheelY, 0, 0, Math.PI / 2, x, bMidZ);
    for (let sp = 0; sp < 4; sp++) {
      pushNonIndexedPart(
        giltParts,
        new THREE.CylinderGeometry(0.007, 0.007, 0.27, 6),
        wheelY,
        (sp / 4) * Math.PI,
        0,
        0,
        x,
        bMidZ,
      );
    }
  }

  balusterGeo.dispose();
  pierFinialGeo.dispose();

  const basaltMesh = new THREE.Mesh(mergeGeometries(basaltParts, false)!, mats.basaltMat);
  const graniteMesh = new THREE.Mesh(mergeGeometries(graniteParts, false)!, mats.graniteMat);
  const bronzeMesh = new THREE.Mesh(mergeGeometries(bronzeParts, false)!, useBronze);
  const giltMesh = new THREE.Mesh(mergeGeometries(giltParts, false)!, useGilt);

  basaltParts.forEach((p) => p.dispose());
  graniteParts.forEach((p) => p.dispose());
  bronzeParts.forEach((p) => p.dispose());
  giltParts.forEach((p) => p.dispose());

  for (const m of [basaltMesh, graniteMesh, bronzeMesh, giltMesh]) {
    m.castShadow = true;
    m.receiveShadow = true;
  }
  bronzeMesh.userData.nonCollidable = true;
  giltMesh.userData.nonCollidable = true;
  g.add(basaltMesh, graniteMesh, bronzeMesh, giltMesh);

  return g;
}

// =========================================================================
// 6. REALISTIC BOTANICAL GARDEN SHRUB HEDGES & PLANTER BEDS
// =========================================================================

let cachedShrubLeafMat: THREE.MeshStandardMaterial | null = null;

function createFallbackShrubCanvas(): [HTMLCanvasElement, HTMLCanvasElement] {
  const [c, ctx] = makeSafeCanvas(128, 128);
  const [h, hCtx] = makeSafeCanvas(128, 128);
  hCtx.fillStyle = '#808080';
  hCtx.fillRect(0, 0, 128, 128);
  ctx.clearRect(0, 0, 128, 128);
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const rad = 22 + (i % 3) * 14;
    const lx = 64 + Math.cos(a) * rad * 0.72;
    const ly = 72 - (i / 18) * 38 + Math.sin(a) * 14;
    ctx.fillStyle = i % 2 === 0 ? '#3f6e2b' : '#588c38';
    ctx.beginPath();
    ctx.ellipse(lx, ly, 15, 7, a, 0, Math.PI * 2);
    ctx.fill();
    hCtx.fillStyle = '#bcbcbc';
    hCtx.beginPath();
    hCtx.ellipse(lx, ly, 15, 7, a, 0, Math.PI * 2);
    hCtx.fill();
  }
  return [c, h];
}

export function getLumbiniBotanicalLeafMaterial(
  leafMap?: THREE.Texture,
  leafNormal?: THREE.Texture,
): THREE.MeshStandardMaterial {
  if (leafMap) {
    return new THREE.MeshStandardMaterial({
      map: leafMap,
      normalMap: leafNormal ?? null,
      normalScale: new THREE.Vector2(0.88, 0.88),
      color: 0xffffff,
      alphaTest: 0.42,
      side: THREE.DoubleSide,
      roughness: 0.82,
      metalness: 0.02,
    });
  }
  if (cachedShrubLeafMat) return cachedShrubLeafMat;
  const [c, h] = createFallbackShrubCanvas();
  const map = makeCanvasTex(c, true, 1, 1);
  const norm = makeCanvasTex(heightCanvasToNormalSafe(h, 2.0), false, 1, 1);
  cachedShrubLeafMat = new THREE.MeshStandardMaterial({
    map,
    normalMap: norm,
    normalScale: new THREE.Vector2(0.85, 0.85),
    color: 0xffffff,
    alphaTest: 0.42,
    side: THREE.DoubleSide,
    roughness: 0.82,
    metalness: 0.02,
  });
  return cachedShrubLeafMat;
}

/**
 * Builds a single crossed double-curved 3D botanical sprig cluster pivoted at its stem base (y=0).
 */
export function createCrossedShrubSprigGeo(width = 0.56, height = 0.58): THREE.BufferGeometry {
  const makeCard = (rotY: number, leanZ: number) => {
    const plane = new THREE.PlaneGeometry(width, height, 3, 4);
    plane.translate(0, height * 0.46, 0);
    const pos = plane.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const v = Math.max(0, Math.min(1, y / height));
      const uNorm = x / (width * 0.5);
      const droop = -Math.pow(v, 2.1) * (leanZ * 0.25);
      const cup = Math.pow(v, 1.35) * leanZ - uNorm * uNorm * 0.075 * (0.4 + v * 0.6);
      pos.setY(i, y + droop);
      pos.setZ(i, pos.getZ(i) + cup);
    }
    const ni = plane.toNonIndexed();
    plane.dispose();
    ni.rotateY(rotY);
    ni.computeVertexNormals();
    return ni;
  };
  const a = makeCard(0.0, 0.14);
  const b = makeCard(Math.PI * 0.5, 0.14);
  const c = makeCard(Math.PI * 0.25, 0.11);
  const merged = mergeGeometries([a, b, c], false)!;
  a.dispose();
  b.dispose();
  c.dispose();
  return merged;
}

/**
 * Replaces blocky two-box garden hedges with landscaped brick/stone planter curbs, dark soil beds,
 * deep-shaded inner woody core (preserving exact BVH footprints), and dense 3D botanical leaf sprigs.
 */
export function buildRealisticLumbiniHedges(
  hedgeCoords: Array<[number, number, number, number]>,
  brickMat: THREE.Material,
  leafMap?: THREE.Texture,
  leafNormal?: THREE.Texture,
): THREE.Group {
  const g = new THREE.Group();
  const mats = getLumbiniGardenCraftMaterials();

  const unitBoxGeo = new THREE.BoxGeometry(1, 1, 1);
  const soilMat = new THREE.MeshStandardMaterial({
    color: 0x3a2a1d,
    roughness: 0.96,
    metalness: 0.01,
  });
  const woodyInnerMat = new THREE.MeshStandardMaterial({
    color: 0x1e3315,
    roughness: 0.94,
    metalness: 0.01,
  });

  // 1. Landscaped world-UV basalt & red-brick planter curbs + dark garden loam soil under every hedge (non-collidable trim)
  const curbParts: THREE.BufferGeometry[] = [];
  const brickBorderParts: THREE.BufferGeometry[] = [];
  const soilParts: THREE.BufferGeometry[] = [];
  // Dark tight inner shrub core preserves solid BVH blocking without showing flat bright green boxes
  const coreInst = new THREE.InstancedMesh(unitBoxGeo, woodyInnerMat, hedgeCoords.length);
  coreInst.castShadow = true;
  coreInst.receiveShadow = true;

  const sprigTransforms: Array<{ x: number; y: number; z: number; rx: number; ry: number; rz: number; s: number; tone: number }> = [];

  hedgeCoords.forEach(([hx, hz, sx, sz], idx) => {
    _craftQ.identity();

    // Outer stepped basalt & world-UV red-brick planter curb
    pushNonIndexedPart(curbParts, makeWorldUvBoxGeo(sx + 0.16, 0.09, sz + 0.16, 1.2, 1.2), 0.055, 0, 0, 0, hx, hz);
    pushNonIndexedPart(brickBorderParts, makeWorldUvBoxGeo(sx + 0.08, 0.06, sz + 0.08, 0.75, 0.75), 0.095, 0, 0, 0, hx, hz);
    pushNonIndexedPart(soilParts, new THREE.BoxGeometry(Math.max(0.2, sx - 0.04), 0.03, Math.max(0.2, sz - 0.04)), 0.125, 0, 0, 0, hx, hz);

    // Compact dark inner shrub branch-shadow core (kept slightly smaller than sprig envelope)
    _craftV3.set(hx, 0.28, hz);
    _craftS.set(Math.max(0.32, sx * 0.72), 0.36, Math.max(0.32, sz * 0.72));
    _craftM4.compose(_craftV3, _craftQ, _craftS);
    coreInst.setMatrixAt(idx, _craftM4);

    // Populate organic crossed botanical leaf sprigs densely along major axis + side shoulders
    const alongX = sx >= sz;
    const majorLen = alongX ? sx : sz;
    const minorSpan = alongX ? sz : sx;
    const step = 0.44;
    const count = Math.max(2, Math.round(majorLen / step));
    for (let k = 0; k <= count; k++) {
      const t = count === 0 ? 0.5 : k / count;
      const offset = (t - 0.5) * Math.max(0.1, majorLen - 0.22);
      const n0 = hash2d(idx * 37 + k, 3, 19);
      const n1 = hash2d(idx * 37 + k, 7, 41);
      const n2 = hash2d(idx * 37 + k, 11, 73);
      const cx = alongX ? hx + offset : hx;
      const cz = alongX ? hz : hz + offset;

      // Top lush crown sprig
      sprigTransforms.push({
        x: cx + (n0 - 0.5) * 0.14,
        y: 0.24 + n1 * 0.08,
        z: cz + (n1 - 0.5) * 0.14,
        rx: (n0 - 0.5) * 0.28,
        ry: n2 * Math.PI * 2,
        rz: (n1 - 0.5) * 0.28,
        s: 0.88 + n0 * 0.26,
        tone: n2,
      });

      // Lower flank sprigs leaning slightly outward on both sides for natural bushy volume
      for (const side of [-1, 1]) {
        const perp = side * Math.max(0.16, minorSpan * 0.28);
        const sn = hash2d(idx * 53 + k * 2 + (side > 0 ? 1 : 0), 17, 97);
        sprigTransforms.push({
          x: cx + (alongX ? 0 : perp) + (sn - 0.5) * 0.08,
          y: 0.12 + sn * 0.05,
          z: cz + (alongX ? perp : 0) + (n0 - 0.5) * 0.08,
          rx: alongX ? side * (0.32 + sn * 0.18) : (sn - 0.5) * 0.2,
          ry: sn * Math.PI * 2,
          rz: alongX ? (sn - 0.5) * 0.2 : -side * (0.32 + sn * 0.18),
          s: 0.72 + sn * 0.22,
          tone: sn,
        });
      }
    }
  });

  coreInst.instanceMatrix.needsUpdate = true;
  coreInst.computeBoundingSphere();
  g.add(coreInst);

  if (curbParts.length > 0) {
    const curbMesh = new THREE.Mesh(mergeGeometries(curbParts, false)!, mats.basaltMat);
    curbMesh.receiveShadow = true;
    curbMesh.userData.nonCollidable = true;
    curbParts.forEach((p) => p.dispose());

    const brickBorderMesh = new THREE.Mesh(mergeGeometries(brickBorderParts, false)!, brickMat);
    brickBorderMesh.receiveShadow = true;
    brickBorderMesh.userData.nonCollidable = true;
    brickBorderParts.forEach((p) => p.dispose());

    const soilMesh = new THREE.Mesh(mergeGeometries(soilParts, false)!, soilMat);
    soilMesh.receiveShadow = true;
    soilMesh.userData.nonCollidable = true;
    soilParts.forEach((p) => p.dispose());

    g.add(curbMesh, brickBorderMesh, soilMesh);
  }

  // Build single-draw-call InstancedMesh for all ~1,200+ crossed botanical shrub clusters
  const sprigGeo = createCrossedShrubSprigGeo(0.58, 0.56);
  const leafMat = getLumbiniBotanicalLeafMaterial(leafMap, leafNormal);
  const foliageInst = new THREE.InstancedMesh(sprigGeo, leafMat, sprigTransforms.length);
  foliageInst.castShadow = true;
  foliageInst.receiveShadow = true;
  foliageInst.userData.nonCollidable = true;

  sprigTransforms.forEach((st, idx) => {
    _craftV3.set(st.x, st.y, st.z);
    _craftQ.setFromEuler(_craftE.set(st.rx, st.ry, st.rz));
    _craftS.setScalar(st.s);
    _craftM4.compose(_craftV3, _craftQ, _craftS);
    foliageInst.setMatrixAt(idx, _craftM4);

    // Subtle organic chlorophyll shade variation (deep emerald to sunlit fresh foliage)
    const hue = 0.24 + st.tone * 0.055;
    const sat = 0.44 + st.tone * 0.14;
    const light = 0.52 + st.tone * 0.22;
    _craftColor.setHSL(hue, sat, light);
    foliageInst.setColorAt(idx, _craftColor);
  });
  foliageInst.instanceMatrix.needsUpdate = true;
  if (foliageInst.instanceColor) foliageInst.instanceColor.needsUpdate = true;
  foliageInst.computeBoundingSphere();
  g.add(foliageInst);

  return g;
}


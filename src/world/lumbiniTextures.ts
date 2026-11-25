import * as THREE from 'three';

export interface LumbiniTextureSet {
  mauryaBrickMap: THREE.CanvasTexture;
  mauryaBrickNormal: THREE.CanvasTexture;
  mauryaBrickRough: THREE.CanvasTexture;
  mauryaBrickAo: THREE.CanvasTexture;
  whiteBrickMap: THREE.CanvasTexture;
  whiteBrickNormal: THREE.CanvasTexture;
  whiteBrickRough: THREE.CanvasTexture;
  whiteBrickAo: THREE.CanvasTexture;
  terracottaPaverMap: THREE.CanvasTexture;
  terracottaPaverNormal: THREE.CanvasTexture;
  terracottaPaverRough: THREE.CanvasTexture;
  gardenLawnMap: THREE.CanvasTexture;
  gardenLawnNormal: THREE.CanvasTexture;
  gardenLawnRough: THREE.CanvasTexture;
  hedgeLeafMap: THREE.CanvasTexture;
  hedgeLeafNormal: THREE.CanvasTexture;
  stuccoWhiteMap: THREE.CanvasTexture;
  stuccoWhiteNormal: THREE.CanvasTexture;
  stuccoWhiteRough: THREE.CanvasTexture;
  stuccoWhiteAo: THREE.CanvasTexture;
  chunarStoneMap: THREE.CanvasTexture;
  chunarStoneNormal: THREE.CanvasTexture;
  chunarStoneRough: THREE.CanvasTexture;
  chunarStoneAo: THREE.CanvasTexture;
  giltBronzeMap: THREE.CanvasTexture;
  giltBronzeNormal: THREE.CanvasTexture;
  giltBronzeRough: THREE.CanvasTexture;
  harmikaEyesMap: THREE.CanvasTexture;
  brahmiEdictMap: THREE.CanvasTexture;
  brahmiEdictNormal: THREE.CanvasTexture;
  nativityReliefMap: THREE.CanvasTexture;
  nativityReliefNormal: THREE.CanvasTexture;
  shilalekhSignMap: THREE.CanvasTexture;
  dispose: () => void;
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
      font: '',
      textAlign: 'left',
      fillRect: noop,
      strokeRect: noop,
      fillText: noop,
      beginPath: noop,
      arc: noop,
      ellipse: noop,
      moveTo: noop,
      lineTo: noop,
      quadraticCurveTo: noop,
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
      createImageData: () => fakeData,
      putImageData: noop,
    } as unknown as CanvasRenderingContext2D;
    return [{ width: w, height: h, getContext: () => fakeCtx } as unknown as HTMLCanvasElement, fakeCtx];
  }
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

function seededNoise(x: number, y: number, seed = 17): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

function heightCanvasToNormal(heightCanvas: HTMLCanvasElement, strength = 2.4): HTMLCanvasElement {
  const w = heightCanvas.width;
  const h = heightCanvas.height;
  const src = heightCanvas.getContext('2d')!.getImageData(0, 0, w, h).data;
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
      const i = (y * w + x) * 4;
      dst[i] = Math.round((nx * 0.5 + 0.5) * 255);
      dst[i + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      dst[i + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      dst[i + 3] = 255;
    }
  }
  outCtx.putImageData(img, 0, 0);
  return out;
}

function heightCanvasToAo(heightCanvas: HTMLCanvasElement, radius = 3, strength = 1.6, floorMin = 92): HTMLCanvasElement {
  const w = heightCanvas.width;
  const h = heightCanvas.height;
  const src = heightCanvas.getContext('2d')!.getImageData(0, 0, w, h).data;
  const [out, outCtx] = makeCanvas(w, h);
  const img = outCtx.createImageData(w, h);
  const dst = img.data;
  const dirs = [
    [radius, 0], [-radius, 0], [0, radius], [0, -radius],
    [radius, radius], [-radius, radius], [radius, -radius], [-radius, -radius],
  ];
  const sample = (x: number, y: number) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = sample(x, y);
      let occ = 0;
      for (const [dx, dy] of dirs) {
        const diff = sample(x + dx, y + dy) - c;
        if (diff > 0.02) occ += diff;
      }
      const v = Math.max(floorMin, Math.min(255, Math.round(255 * (1 - (occ / dirs.length) * strength))));
      const i = (y * w + x) * 4;
      dst[i] = v;
      dst[i + 1] = v;
      dst[i + 2] = v;
      dst[i + 3] = 255;
    }
  }
  outCtx.putImageData(img, 0, 0);
  return out;
}

function toTex(
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

export function createLumbiniTextures(): LumbiniTextureSet {
  // 1. Weathered Maurya Archaeological Terracotta Brick (Ruins, Foundation Plinths, Pushkarini Stepped Ghats)
  const [brickC, brickCtx] = makeCanvas(512, 512);
  const [brickH, brickHCtx] = makeCanvas(512, 512);
  const [brickR, brickRCtx] = makeCanvas(512, 512);
  brickCtx.fillStyle = '#4e392e';
  brickCtx.fillRect(0, 0, 512, 512);
  brickHCtx.fillStyle = '#282828';
  brickHCtx.fillRect(0, 0, 512, 512);
  brickRCtx.fillStyle = '#ececec';
  brickRCtx.fillRect(0, 0, 512, 512);

  const rows = 16;
  const cols = 8;
  const bw = 512 / cols;
  const bh = 512 / rows;
  for (let row = 0; row < rows; row++) {
    const offset = (row % 2) * (bw * 0.5);
    for (let col = -1; col <= cols; col++) {
      const n = seededNoise(col + row * 13, row, 41);
      const n2 = seededNoise(row, col, 93);
      const bx = col * bw + offset;
      const by = row * bh;
      const r = Math.round(148 + n * 38 - n2 * 22);
      const g = Math.round(74 + n * 24 - n2 * 14);
      const b = Math.round(48 + n * 16 - n2 * 10);
      brickCtx.fillStyle = `rgb(${r},${g},${b})`;
      brickCtx.fillRect(bx + 2, by + 2, bw - 4, bh - 4);
      brickCtx.fillStyle = `rgba(218, 202, 182, ${0.05 + n2 * 0.08})`;
      brickCtx.fillRect(bx + 3, by + 2, bw - 6, 4);

      const hVal = Math.round(190 + n * 52);
      brickHCtx.fillStyle = `rgb(${hVal},${hVal},${hVal})`;
      brickHCtx.fillRect(bx + 2, by + 2, bw - 4, bh - 4);

      const rVal = Math.round(188 + n2 * 52);
      brickRCtx.fillStyle = `rgb(${rVal},${rVal},${rVal})`;
      brickRCtx.fillRect(bx + 2, by + 2, bw - 4, bh - 4);
    }
  }
  const mauryaBrickMap = toTex(brickC, true, 3, 2);
  const mauryaBrickNormal = toTex(heightCanvasToNormal(brickH, 2.5), false, 3, 2);
  const mauryaBrickRough = toTex(brickR, false, 3, 2);
  const mauryaBrickAo = toTex(heightCanvasToAo(brickH, 3, 1.8, 82), false, 3, 2);

  // 2. Crisp White-Painted Exposed Brick Masonry (Signature 2003 Maya Devi Temple Exterior)
  const [wbC, wbCtx] = makeCanvas(512, 512);
  const [wbH, wbHCtx] = makeCanvas(512, 512);
  const [wbR, wbRCtx] = makeCanvas(512, 512);
  wbCtx.fillStyle = '#dad8d2';
  wbCtx.fillRect(0, 0, 512, 512);
  wbHCtx.fillStyle = '#626262';
  wbHCtx.fillRect(0, 0, 512, 512);
  wbRCtx.fillStyle = '#dadada';
  wbRCtx.fillRect(0, 0, 512, 512);

  const wbRows = 20;
  const wbCols = 9;
  const wbw = 512 / wbCols;
  const wbh = 512 / wbRows;
  for (let row = 0; row < wbRows; row++) {
    const offset = (row % 2) * (wbw * 0.5);
    for (let col = -1; col <= wbCols; col++) {
      const n = seededNoise(col + row * 17, row, 19);
      const n2 = seededNoise(row, col, 61);
      const bx = col * wbw + offset;
      const by = row * wbh;
      const base = Math.round(238 + n * 14 - n2 * 10);
      wbCtx.fillStyle = `rgb(${base},${base - 1},${base - 3})`;
      wbCtx.fillRect(bx + 1.5, by + 1.5, wbw - 3, wbh - 3);
      // Subtle top edge highlight & bottom joint shadow for tactile painted brick relief
      wbCtx.fillStyle = 'rgba(255,255,255,0.45)';
      wbCtx.fillRect(bx + 2, by + 1.5, wbw - 4, 2);
      wbCtx.fillStyle = `rgba(145, 142, 136, ${0.14 + n2 * 0.12})`;
      wbCtx.fillRect(bx + 2, by + wbh - 3.5, wbw - 4, 2);

      const hv = Math.round(188 + n * 48);
      wbHCtx.fillStyle = `rgb(${hv},${hv},${hv})`;
      wbHCtx.fillRect(bx + 1.5, by + 1.5, wbw - 3, wbh - 3);

      const rv = Math.round(176 + n2 * 44);
      wbRCtx.fillStyle = `rgb(${rv},${rv},${rv})`;
      wbRCtx.fillRect(bx + 1.5, by + 1.5, wbw - 3, wbh - 3);
    }
  }
  // Faint monsoon weathering stipple near mortar lines
  for (let i = 0; i < 1200; i++) {
    const x = seededNoise(i, 3, 55) * 512;
    const y = seededNoise(i, 7, 73) * 512;
    const r = 1.5 + seededNoise(i, 9, 89) * 5;
    wbCtx.fillStyle = `rgba(162, 158, 150, ${0.03 + seededNoise(i, 11, 97) * 0.05})`;
    wbCtx.beginPath();
    wbCtx.arc(x, y, r, 0, Math.PI * 2);
    wbCtx.fill();
  }
  const whiteBrickMap = toTex(wbC, true, 5, 2.2);
  const whiteBrickNormal = toTex(heightCanvasToNormal(wbH, 2.1), false, 5, 2.2);
  const whiteBrickRough = toTex(wbR, false, 5, 2.2);
  const whiteBrickAo = toTex(heightCanvasToAo(wbH, 2, 1.45, 118), false, 5, 2.2);

  // 3. Terracotta Red-Brick Garden Pavers & Pushkarini Ghat Coping
  const [tpC, tpCtx] = makeCanvas(512, 512);
  const [tpH, tpHCtx] = makeCanvas(512, 512);
  const [tpR, tpRCtx] = makeCanvas(512, 512);
  tpCtx.fillStyle = '#733829';
  tpCtx.fillRect(0, 0, 512, 512);
  tpHCtx.fillStyle = '#525252';
  tpHCtx.fillRect(0, 0, 512, 512);
  tpRCtx.fillStyle = '#cccccc';
  tpRCtx.fillRect(0, 0, 512, 512);

  const tpRows = 12;
  const tpCols = 8;
  const tpw = 512 / tpCols;
  const tph = 512 / tpRows;
  for (let row = 0; row < tpRows; row++) {
    const off = (row % 2) * (tpw * 0.5);
    for (let col = -1; col <= tpCols; col++) {
      const n = seededNoise(col * 7 + row, row * 3, 29);
      const n2 = seededNoise(row, col * 11, 53);
      const bx = col * tpw + off;
      const by = row * tph;
      const r = Math.round(174 + n * 28 - n2 * 16);
      const g = Math.round(82 + n * 18 - n2 * 12);
      const b = Math.round(64 + n * 14 - n2 * 10);
      tpCtx.fillStyle = `rgb(${r},${g},${b})`;
      tpCtx.fillRect(bx + 2, by + 2, tpw - 4, tph - 4);
      tpCtx.fillStyle = 'rgba(255, 210, 188, 0.09)';
      tpCtx.fillRect(bx + 3, by + 2, tpw - 6, 3);
      const hv = Math.round(196 + n * 38);
      tpHCtx.fillStyle = `rgb(${hv},${hv},${hv})`;
      tpHCtx.fillRect(bx + 2, by + 2, tpw - 4, tph - 4);
      const rv = Math.round(170 + n2 * 52);
      tpRCtx.fillStyle = `rgb(${rv},${rv},${rv})`;
      tpRCtx.fillRect(bx + 2, by + 2, tpw - 4, tph - 4);
    }
  }
  const terracottaPaverMap = toTex(tpC, true, 4, 4);
  const terracottaPaverNormal = toTex(heightCanvasToNormal(tpH, 1.9), false, 4, 4);
  const terracottaPaverRough = toTex(tpR, false, 4, 4);

  // 4. Manicured Lumbini Sacred Garden Green Lawn (with subtle mow bands)
  const [lnC, lnCtx] = makeCanvas(512, 512);
  const [lnH, lnHCtx] = makeCanvas(512, 512);
  const [lnR, lnRCtx] = makeCanvas(512, 512);
  lnCtx.fillStyle = '#538e34';
  lnCtx.fillRect(0, 0, 512, 512);
  lnHCtx.fillStyle = '#909090';
  lnHCtx.fillRect(0, 0, 512, 512);
  lnRCtx.fillStyle = '#dcdcdc';
  lnRCtx.fillRect(0, 0, 512, 512);
  // Crisp lawn mowing bands
  for (let s = 0; s < 8; s++) {
    lnCtx.fillStyle = s % 2 === 0 ? 'rgba(132, 198, 72, 0.14)' : 'rgba(54, 102, 28, 0.12)';
    lnCtx.fillRect(s * 64, 0, 64, 512);
  }
  for (let i = 0; i < 4200; i++) {
    const x = seededNoise(i, 1, 31) * 512;
    const y = seededNoise(i, 2, 43) * 512;
    const n = seededNoise(i, 3, 67);
    const len = 3 + n * 5;
    lnCtx.fillStyle = n > 0.5 ? 'rgba(145, 206, 78, 0.24)' : 'rgba(46, 94, 24, 0.22)';
    lnCtx.fillRect(x, y, 2, len);
    const hv = Math.round(130 + n * 95);
    lnHCtx.fillStyle = `rgb(${hv},${hv},${hv})`;
    lnHCtx.fillRect(x, y, 2, len);
    const rv = Math.round(195 + (1 - n) * 45);
    lnRCtx.fillStyle = `rgb(${rv},${rv},${rv})`;
    lnRCtx.fillRect(x, y, 2, len);
  }
  const gardenLawnMap = toTex(lnC, true, 6, 6);
  const gardenLawnNormal = toTex(heightCanvasToNormal(lnH, 1.4), false, 6, 6);
  const gardenLawnRough = toTex(lnR, false, 6, 6);

  // 5. Trimmed Boxwood / Duranta Hedge Foliage Texture (bordering red-brick paths)
  const [hgC, hgCtx] = makeCanvas(256, 256);
  const [hgH, hgHCtx] = makeCanvas(256, 256);
  hgCtx.fillStyle = '#3d7424';
  hgCtx.fillRect(0, 0, 256, 256);
  hgHCtx.fillStyle = '#707070';
  hgHCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2200; i++) {
    const x = seededNoise(i, 4, 13) * 256;
    const y = seededNoise(i, 8, 29) * 256;
    const rad = 2 + seededNoise(i, 12, 37) * 4.5;
    const t = seededNoise(i, 16, 41);
    const r = Math.round(52 + t * 88);
    const g = Math.round(108 + t * 92);
    const b = Math.round(24 + t * 32);
    hgCtx.fillStyle = `rgba(${r},${g},${b},0.85)`;
    hgCtx.beginPath();
    hgCtx.arc(x, y, rad, 0, Math.PI * 2);
    hgCtx.fill();
    const hv = Math.round(115 + t * 125);
    hgHCtx.fillStyle = `rgba(${hv},${hv},${hv},0.85)`;
    hgHCtx.beginPath();
    hgHCtx.arc(x, y, rad, 0, Math.PI * 2);
    hgHCtx.fill();
  }
  const hedgeLeafMap = toTex(hgC, true, 4, 1);
  const hedgeLeafNormal = toTex(heightCanvasToNormal(hgH, 2.2), false, 4, 1);

  // 6. Whitewashed Sacred Lime Stucco (Rooftop Pavilion, Stupa Domes, Thai Pavilion)
  const [stuccoC, stuccoCtx] = makeCanvas(512, 512);
  const [stuccoH, stuccoHCtx] = makeCanvas(512, 512);
  const [stuccoR, stuccoRCtx] = makeCanvas(512, 512);
  stuccoCtx.fillStyle = '#f4f1ea';
  stuccoCtx.fillRect(0, 0, 512, 512);
  stuccoHCtx.fillStyle = '#d4d4d4';
  stuccoHCtx.fillRect(0, 0, 512, 512);
  stuccoRCtx.fillStyle = '#cfcfcf';
  stuccoRCtx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 2000; i++) {
    const x = seededNoise(i, 1, 7) * 512;
    const y = seededNoise(i, 2, 13) * 512;
    const rad = 2 + seededNoise(i, 3, 19) * 14;
    const shade = 236 + Math.round((seededNoise(i, 4, 23) - 0.5) * 16);
    stuccoCtx.fillStyle = `rgba(${shade}, ${shade - 2}, ${shade - 8}, 0.16)`;
    stuccoCtx.beginPath();
    stuccoCtx.arc(x, y, rad, 0, Math.PI * 2);
    stuccoCtx.fill();

    const hv = 198 + Math.round((seededNoise(i, 5, 31) - 0.5) * 32);
    stuccoHCtx.fillStyle = `rgba(${hv},${hv},${hv},0.22)`;
    stuccoHCtx.beginPath();
    stuccoHCtx.arc(x, y, rad * 0.85, 0, Math.PI * 2);
    stuccoHCtx.fill();

    const rv = 172 + Math.round(seededNoise(i, 6, 47) * 58);
    stuccoRCtx.fillStyle = `rgba(${rv},${rv},${rv},0.25)`;
    stuccoRCtx.beginPath();
    stuccoRCtx.arc(x, y, rad, 0, Math.PI * 2);
    stuccoRCtx.fill();
  }
  const stuccoWhiteMap = toTex(stuccoC, true, 2, 2);
  const stuccoWhiteNormal = toTex(heightCanvasToNormal(stuccoH, 1.25), false, 2, 2);
  const stuccoWhiteRough = toTex(stuccoR, false, 2, 2);
  const stuccoWhiteAo = toTex(heightCanvasToAo(stuccoH, 2, 1.2, 122), false, 2, 2);

  // 7. Weathered Pink-Buff Chunar Sandstone (Ashoka Pillar, Marker Stone, Toranas & Peace Flame)
  const [chuC, chuCtx] = makeCanvas(512, 512);
  const [chuH, chuHCtx] = makeCanvas(512, 512);
  const [chuR, chuRCtx] = makeCanvas(512, 512);
  const chuGrad = chuCtx.createLinearGradient(0, 0, 512, 512);
  chuGrad.addColorStop(0, '#c8a987');
  chuGrad.addColorStop(0.5, '#ba9c7a');
  chuGrad.addColorStop(1, '#d2b492');
  chuCtx.fillStyle = chuGrad;
  chuCtx.fillRect(0, 0, 512, 512);
  chuHCtx.fillStyle = '#c8c8c8';
  chuHCtx.fillRect(0, 0, 512, 512);
  chuRCtx.fillStyle = '#a8a8a8';
  chuRCtx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 1900; i++) {
    const x = seededNoise(i, 11, 5) * 512;
    const y = seededNoise(i, 22, 9) * 512;
    const w = 10 + seededNoise(i, 33, 15) * 42;
    const h = 1.5 + seededNoise(i, 44, 21) * 4;
    const tone = seededNoise(i, 55, 29);
    chuCtx.fillStyle = tone > 0.5 ? 'rgba(244, 224, 198, 0.14)' : 'rgba(116, 88, 60, 0.14)';
    chuCtx.fillRect(x, y, w, h);
    const hv = Math.round(176 + tone * 56);
    chuHCtx.fillStyle = `rgba(${hv},${hv},${hv},0.22)`;
    chuHCtx.fillRect(x, y, w, h);
    const rv = Math.round(135 + (1 - tone) * 72);
    chuRCtx.fillStyle = `rgba(${rv},${rv},${rv},0.26)`;
    chuRCtx.fillRect(x, y, w, h);
  }
  const chunarStoneMap = toTex(chuC, true, 1, 2);
  const chunarStoneNormal = toTex(heightCanvasToNormal(chuH, 1.55), false, 1, 2);
  const chunarStoneRough = toTex(chuR, false, 1, 2);
  const chunarStoneAo = toTex(heightCanvasToAo(chuH, 2, 1.35, 120), false, 1, 2);

  // 8. Antique Gilded Bronze Patina (Statues, Golden Gajur Spire, Myanmar Stupa, Baby Buddha)
  const [giltC, giltCtx] = makeCanvas(512, 512);
  const [giltH, giltHCtx] = makeCanvas(512, 512);
  const [giltR, giltRCtx] = makeCanvas(512, 512);
  const giltGrad = giltCtx.createLinearGradient(0, 0, 512, 512);
  giltGrad.addColorStop(0, '#f2ca63');
  giltGrad.addColorStop(0.5, '#d9a134');
  giltGrad.addColorStop(1, '#f6d272');
  giltCtx.fillStyle = giltGrad;
  giltCtx.fillRect(0, 0, 512, 512);
  giltHCtx.fillStyle = '#c8c8c8';
  giltHCtx.fillRect(0, 0, 512, 512);
  giltRCtx.fillStyle = '#525252';
  giltRCtx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 1500; i++) {
    const x = seededNoise(i, 7, 11) * 512;
    const y = seededNoise(i, 9, 17) * 512;
    const rad = 2 + seededNoise(i, 13, 31) * 10;
    const tone = seededNoise(i, 17, 43);
    giltCtx.fillStyle = tone > 0.45 ? 'rgba(255, 236, 162, 0.14)' : 'rgba(130, 86, 22, 0.14)';
    giltCtx.beginPath();
    giltCtx.arc(x, y, rad, 0, Math.PI * 2);
    giltCtx.fill();
    const hv = Math.round(180 + tone * 50);
    giltHCtx.fillStyle = `rgba(${hv},${hv},${hv},0.22)`;
    giltHCtx.beginPath();
    giltHCtx.arc(x, y, rad * 0.7, 0, Math.PI * 2);
    giltHCtx.fill();
    const rv = Math.round(58 + (1 - tone) * 62);
    giltRCtx.fillStyle = `rgba(${rv},${rv},${rv},0.25)`;
    giltRCtx.beginPath();
    giltRCtx.arc(x, y, rad, 0, Math.PI * 2);
    giltRCtx.fill();
  }
  const giltBronzeMap = toTex(giltC, true, 2, 2);
  const giltBronzeNormal = toTex(heightCanvasToNormal(giltH, 1.25), false, 2, 2);
  const giltBronzeRough = toTex(giltR, false, 2, 2);

  // 9. Buddha Wisdom Eyes Texture (for Votive Stupa Harmikas)
  const [eyesC, eyesCtx] = makeCanvas(512, 256);
  const eyesGrad = eyesCtx.createLinearGradient(0, 0, 0, 256);
  eyesGrad.addColorStop(0, '#fff9ec');
  eyesGrad.addColorStop(1, '#ede1c6');
  eyesCtx.fillStyle = eyesGrad;
  eyesCtx.fillRect(0, 0, 512, 256);
  eyesCtx.strokeStyle = '#c48f29';
  eyesCtx.lineWidth = 10;
  eyesCtx.strokeRect(10, 10, 492, 236);
  const drawEye = (cx: number) => {
    eyesCtx.save();
    eyesCtx.translate(cx, 126);
    eyesCtx.fillStyle = '#ffffff';
    eyesCtx.beginPath();
    eyesCtx.moveTo(-64, 0);
    eyesCtx.quadraticCurveTo(0, -34, 64, 0);
    eyesCtx.quadraticCurveTo(0, 24, -64, 0);
    eyesCtx.fill();
    eyesCtx.strokeStyle = '#182442';
    eyesCtx.lineWidth = 7;
    eyesCtx.stroke();
    eyesCtx.fillStyle = '#183059';
    eyesCtx.beginPath();
    eyesCtx.arc(0, -2, 19, 0, Math.PI * 2);
    eyesCtx.fill();
    eyesCtx.restore();
  };
  drawEye(152);
  drawEye(360);
  const harmikaEyesMap = toTex(eyesC, true, 1, 1, true);

  // 10. Ashoka Pillar Brahmi Edict Inscription Plaque
  const [brC, brCtx] = makeCanvas(512, 512);
  const [brH, brHCtx] = makeCanvas(512, 512);
  brCtx.fillStyle = '#c6a882';
  brCtx.fillRect(0, 0, 512, 512);
  brHCtx.fillStyle = '#d0d0d0';
  brHCtx.fillRect(0, 0, 512, 512);
  brCtx.strokeStyle = '#755b3e';
  brCtx.lineWidth = 10;
  brCtx.strokeRect(20, 20, 472, 472);
  brHCtx.strokeStyle = '#606060';
  brHCtx.lineWidth = 10;
  brHCtx.strokeRect(20, 20, 472, 472);
  brCtx.strokeStyle = '#4e3b26';
  brHCtx.strokeStyle = '#303030';
  brCtx.lineWidth = 5;
  brHCtx.lineWidth = 5;
  for (let row = 0; row < 5; row++) {
    const y = 94 + row * 78;
    for (let col = 0; col < 10; col++) {
      const x = 58 + col * 41;
      const g = Math.floor(seededNoise(col, row, 107) * 5);
      for (const ctx of [brCtx, brHCtx]) {
        ctx.beginPath();
        if (g === 0) {
          ctx.moveTo(x, y - 16);
          ctx.lineTo(x, y + 16);
          ctx.moveTo(x - 10, y);
          ctx.lineTo(x + 10, y);
        } else if (g === 1) {
          ctx.arc(x, y - 4, 10, 0, Math.PI * 2);
          ctx.moveTo(x, y + 6);
          ctx.lineTo(x, y + 18);
        } else if (g === 2) {
          ctx.moveTo(x - 10, y - 14);
          ctx.lineTo(x - 10, y + 14);
          ctx.lineTo(x + 10, y + 14);
          ctx.lineTo(x + 10, y - 14);
        } else if (g === 3) {
          ctx.moveTo(x - 10, y + 14);
          ctx.lineTo(x, y - 14);
          ctx.lineTo(x + 10, y + 14);
        } else {
          ctx.moveTo(x - 10, y - 14);
          ctx.lineTo(x + 10, y - 14);
          ctx.moveTo(x, y - 14);
          ctx.lineTo(x, y + 16);
        }
        ctx.stroke();
      }
    }
  }
  const brahmiEdictMap = toTex(brC, true, 1, 1, true);
  const brahmiEdictNormal = toTex(heightCanvasToNormal(brH, 2.2), false, 1, 1, true);

  // 11. Carved 4th-century CE Gupta Sandstone Nativity Bas-Relief (Maya Devi grasping Sal tree branch)
  const [natC, natCtx] = makeCanvas(512, 640);
  const [natH, natHCtx] = makeCanvas(512, 640);
  const natGrad = natCtx.createLinearGradient(0, 0, 0, 640);
  natGrad.addColorStop(0, '#b59268');
  natGrad.addColorStop(0.5, '#c7a479');
  natGrad.addColorStop(1, '#9c7b54');
  natCtx.fillStyle = natGrad;
  natCtx.fillRect(0, 0, 512, 640);
  natHCtx.fillStyle = '#606060';
  natHCtx.fillRect(0, 0, 512, 640);

  // Recessed stone stele frame & carved Sal-leaf arch
  natCtx.strokeStyle = '#6f5333';
  natCtx.lineWidth = 18;
  natCtx.strokeRect(20, 20, 472, 600);
  natHCtx.strokeStyle = '#c8c8c8';
  natHCtx.lineWidth = 18;
  natHCtx.strokeRect(20, 20, 472, 600);

  for (const [ctx, fillMain, fillAccent] of [
    [natCtx, '#d8b78b', '#e7cb9f'],
    [natHCtx, '#c4c4c4', '#ececec'],
  ] as Array<[CanvasRenderingContext2D, string, string]>) {
    // Sal tree bough arching across top
    ctx.strokeStyle = fillMain;
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.moveTo(76, 220);
    ctx.quadraticCurveTo(256, 70, 434, 154);
    ctx.stroke();
    // Carved lotus pedestal
    ctx.fillStyle = fillMain;
    ctx.fillRect(108, 522, 296, 36);
    // Queen Maya Devi sculpted relief silhouette (head, torso, hip sway, raised right arm grasping branch)
    ctx.beginPath();
    ctx.arc(248, 224, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(252, 346, 52, 86, 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(216, 405, 72, 118);
    // Raised right arm to Sal bough
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.moveTo(286, 280);
    ctx.lineTo(328, 174);
    ctx.stroke();
    // Halo behind Maya Devi & newborn Prince Siddhartha beside her
    ctx.strokeStyle = fillAccent;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(248, 224, 58, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = fillAccent;
    ctx.beginPath();
    ctx.arc(348, 444, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(334, 462, 28, 58);
  }
  const nativityReliefMap = toTex(natC, true, 1, 1, true);
  const nativityReliefNormal = toTex(heightCanvasToNormal(natH, 2.4), false, 1, 1, true);

  // 12. Heritage Shilalekh Monument Plaque (LUMBINI · MAYA DEVI TEMPLE · UNESCO WORLD HERITAGE)
  const [sgC, sgCtx] = makeCanvas(1024, 512);
  const sgBg = sgCtx.createLinearGradient(0, 0, 0, 512);
  sgBg.addColorStop(0, '#131d26');
  sgBg.addColorStop(1, '#0b1218');
  sgCtx.fillStyle = sgBg;
  sgCtx.fillRect(0, 0, 1024, 512);
  sgCtx.strokeStyle = '#d4a342';
  sgCtx.lineWidth = 14;
  sgCtx.strokeRect(20, 20, 984, 472);
  sgCtx.strokeStyle = '#b93c2d';
  sgCtx.lineWidth = 4;
  sgCtx.strokeRect(38, 38, 948, 436);
  sgCtx.fillStyle = '#f8dfa6';
  sgCtx.font = 'bold 58px Georgia, serif';
  sgCtx.textAlign = 'center';
  sgCtx.fillText('LUMBINI · MAYA DEVI TEMPLE', 512, 194);
  sgCtx.fillStyle = '#d1fae5';
  sgCtx.font = '32px Georgia, serif';
  sgCtx.fillText('Birthplace of Lord Gautama Buddha · UNESCO World Heritage', 512, 282);
  sgCtx.fillStyle = '#e5b95c';
  sgCtx.font = '25px Georgia, serif';
  sgCtx.fillText('Marker Stone · Ashoka Pillar (249 BCE) · Pushkarini Sacred Pond', 512, 358);
  const shilalekhSignMap = toTex(sgC, true, 1, 1, true);

  const allTex = [
    mauryaBrickMap,
    mauryaBrickNormal,
    mauryaBrickRough,
    mauryaBrickAo,
    whiteBrickMap,
    whiteBrickNormal,
    whiteBrickRough,
    whiteBrickAo,
    terracottaPaverMap,
    terracottaPaverNormal,
    terracottaPaverRough,
    gardenLawnMap,
    gardenLawnNormal,
    gardenLawnRough,
    hedgeLeafMap,
    hedgeLeafNormal,
    stuccoWhiteMap,
    stuccoWhiteNormal,
    stuccoWhiteRough,
    stuccoWhiteAo,
    chunarStoneMap,
    chunarStoneNormal,
    chunarStoneRough,
    chunarStoneAo,
    giltBronzeMap,
    giltBronzeNormal,
    giltBronzeRough,
    harmikaEyesMap,
    brahmiEdictMap,
    brahmiEdictNormal,
    nativityReliefMap,
    nativityReliefNormal,
    shilalekhSignMap,
  ];

  return {
    mauryaBrickMap,
    mauryaBrickNormal,
    mauryaBrickRough,
    mauryaBrickAo,
    whiteBrickMap,
    whiteBrickNormal,
    whiteBrickRough,
    whiteBrickAo,
    terracottaPaverMap,
    terracottaPaverNormal,
    terracottaPaverRough,
    gardenLawnMap,
    gardenLawnNormal,
    gardenLawnRough,
    hedgeLeafMap,
    hedgeLeafNormal,
    stuccoWhiteMap,
    stuccoWhiteNormal,
    stuccoWhiteRough,
    stuccoWhiteAo,
    chunarStoneMap,
    chunarStoneNormal,
    chunarStoneRough,
    chunarStoneAo,
    giltBronzeMap,
    giltBronzeNormal,
    giltBronzeRough,
    harmikaEyesMap,
    brahmiEdictMap,
    brahmiEdictNormal,
    nativityReliefMap,
    nativityReliefNormal,
    shilalekhSignMap,
    dispose: () => {
      for (const t of allTex) t.dispose();
    },
  };
}

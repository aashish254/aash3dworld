import * as THREE from 'three';

export interface LumbiniTextureSet {
  mauryaBrickMap: THREE.CanvasTexture;
  mauryaBrickNormal: THREE.CanvasTexture;
  mauryaBrickRough: THREE.CanvasTexture;
  mauryaBrickAo: THREE.CanvasTexture;
  mauryaBrickDisp: THREE.CanvasTexture;
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
  salWoodMap: THREE.CanvasTexture;
  salWoodNormal: THREE.CanvasTexture;
  salWoodRough: THREE.CanvasTexture;
  trenchEarthMap: THREE.CanvasTexture;
  trenchEarthNormal: THREE.CanvasTexture;
  trenchEarthRough: THREE.CanvasTexture;
  cofferTimberMap: THREE.CanvasTexture;
  cofferTimberNormal: THREE.CanvasTexture;
  cofferTimberRough: THREE.CanvasTexture;
  cushionFabricMap: THREE.CanvasTexture;
  cushionFabricNormal: THREE.CanvasTexture;
  altarBrocadeMap: THREE.CanvasTexture;
  altarBrocadeNormal: THREE.CanvasTexture;
  khataSilkMap: THREE.CanvasTexture;
  markerStoneMap: THREE.CanvasTexture;
  markerStoneNormal: THREE.CanvasTexture;
  markerStoneRough: THREE.CanvasTexture;
  carvedSandstoneMap: THREE.CanvasTexture;
  carvedSandstoneNormal: THREE.CanvasTexture;
  carvedSandstoneRough: THREE.CanvasTexture;
  plaqueMarkerMap: THREE.CanvasTexture;
  plaqueChambersMap: THREE.CanvasTexture;
  plaqueNativityMap: THREE.CanvasTexture;
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

function seededNoise(x: number, y: number, seed = 17): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

function heightCanvasToNormal(heightCanvas: HTMLCanvasElement, strength = 2.4): HTMLCanvasElement {
  const w = heightCanvas.width;
  const h = heightCanvas.height;
  const src = heightCanvas.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, w, h).data;
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
  const src = heightCanvas.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, w, h).data;
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
  maxAnisotropy = 4,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.wrapS = clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  tex.wrapT = clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  tex.repeat.set(repX, repY);
  tex.anisotropy = Math.min(16, Math.max(1, maxAnisotropy));
  tex.needsUpdate = true;
  return tex;
}

export function createLumbiniTextures(maxAnisotropy = 4): LumbiniTextureSet {
  // 1. High-Resolution 1024px Weathered Maurya/Sunga Archaeological Terracotta Brick
  //    (Albedo, Normal, Roughness, AO, and Physical Mortar Displacement)
  const bSize = 1024;
  const [brickC, brickCtx] = makeCanvas(bSize, bSize);
  const [brickH, brickHCtx] = makeCanvas(bSize, bSize);
  const [brickR, brickRCtx] = makeCanvas(bSize, bSize);

  // Recessed sandy lime-clay mortar base
  brickCtx.fillStyle = '#423127';
  brickCtx.fillRect(0, 0, bSize, bSize);
  brickHCtx.fillStyle = '#242424';
  brickHCtx.fillRect(0, 0, bSize, bSize);
  brickRCtx.fillStyle = '#f2f2f2';
  brickRCtx.fillRect(0, 0, bSize, bSize);

  // Granular mortar sand aggregate in joints
  for (let i = 0; i < 6500; i++) {
    const mx = seededNoise(i, 3, 211) * bSize;
    const my = seededNoise(i, 7, 223) * bSize;
    const mn = seededNoise(i, 11, 229);
    brickCtx.fillStyle = mn > 0.5 ? 'rgba(136, 112, 92, 0.24)' : 'rgba(32, 22, 16, 0.28)';
    brickCtx.fillRect(mx, my, 2 + mn * 3, 2 + mn * 3);
    const mh = Math.round(28 + mn * 28);
    brickHCtx.fillStyle = `rgb(${mh},${mh},${mh})`;
    brickHCtx.fillRect(mx, my, 2, 2);
  }

  const rows = 20;
  const cols = 8;
  const bw = bSize / cols;
  const bh = bSize / rows;
  const mortarGap = 5.5;
  for (let row = 0; row < rows; row++) {
    // Alternating running/Flemish-style archaeological brick offset
    const offset = (row % 2) * (bw * 0.5) + (row % 3 === 0 ? bw * 0.12 : 0);
    for (let col = -1; col <= cols; col++) {
      const n = seededNoise(col + row * 17, row, 41);
      const n2 = seededNoise(row * 3, col * 7, 93);
      const n3 = seededNoise(col * 5, row * 11, 137);
      const bx = col * bw + offset + (n3 - 0.5) * 4;
      const by = row * bh + (n2 - 0.5) * 2.2;
      const wSpan = bw - mortarGap * 2;
      const hSpan = bh - mortarGap * 2;

      // Kiln-fired terracotta palette variation (rich sienna, burnt ochre, deep umber)
      const r = Math.round(142 + n * 44 - n2 * 24 - (n3 > 0.82 ? 22 : 0));
      const g = Math.round(68 + n * 26 - n2 * 16 - (n3 > 0.82 ? 14 : 0));
      const b = Math.round(44 + n * 18 - n2 * 12);

      // Outer beveled shadow shoulder on height canvas for crisp mortar groove transition
      const shoulderH = Math.round(115 + n * 35);
      brickHCtx.fillStyle = `rgb(${shoulderH},${shoulderH},${shoulderH})`;
      brickHCtx.fillRect(bx + mortarGap - 1.5, by + mortarGap - 1.5, wSpan + 3, hSpan + 3);

      // Main brick body
      brickCtx.fillStyle = `rgb(${r},${g},${b})`;
      brickCtx.fillRect(bx + mortarGap, by + mortarGap, wSpan, hSpan);

      const hVal = Math.round(188 + n * 56);
      brickHCtx.fillStyle = `rgb(${hVal},${hVal},${hVal})`;
      brickHCtx.fillRect(bx + mortarGap + 2, by + mortarGap + 2, wSpan - 4, hSpan - 4);

      const rVal = Math.round(184 + n2 * 56);
      brickRCtx.fillStyle = `rgb(${rVal},${rVal},${rVal})`;
      brickRCtx.fillRect(bx + mortarGap, by + mortarGap, wSpan, hSpan);

      // Subtle upper edge bevel highlight & lower underside mortar shadow
      brickCtx.fillStyle = `rgba(228, 198, 168, ${0.08 + n2 * 0.08})`;
      brickCtx.fillRect(bx + mortarGap + 2, by + mortarGap, wSpan - 4, 4);
      brickCtx.fillStyle = 'rgba(32, 18, 12, 0.28)';
      brickCtx.fillRect(bx + mortarGap, by + mortarGap + hSpan - 4, wSpan, 4);

      // Subtle kiln blotches & lime-salt efflorescence patches
      if (n > 0.68) {
        brickCtx.fillStyle = 'rgba(226, 214, 194, 0.13)';
        brickCtx.beginPath();
        brickCtx.ellipse(bx + wSpan * (0.3 + n2 * 0.4), by + hSpan * 0.5, 16 + n * 18, 7 + n2 * 6, 0, 0, Math.PI * 2);
        brickCtx.fill();
      }
      if (n3 < 0.22) {
        brickCtx.fillStyle = 'rgba(38, 22, 14, 0.24)';
        brickCtx.fillRect(bx + mortarGap + 6, by + mortarGap + 5, wSpan * 0.42, hSpan * 0.55);
      }

      // Chipped edges, spalling pits & vertical stress cracks
      if (n2 > 0.52) {
        const spX = bx + mortarGap + 8 + n * (wSpan - 32);
        const spY = by + mortarGap + 4 + n3 * (hSpan - 16);
        const spW = 8 + n * 16;
        const spH = 6 + n2 * 9;
        brickCtx.fillStyle = 'rgba(46, 26, 17, 0.34)';
        brickCtx.fillRect(spX, spY, spW, spH);
        brickHCtx.fillStyle = '#545454';
        brickHCtx.fillRect(spX, spY, spW, spH);
        brickRCtx.fillStyle = '#e8e8e8';
        brickRCtx.fillRect(spX, spY, spW, spH);
      }
      if (n > 0.78) {
        const crX = bx + mortarGap + wSpan * (0.25 + n2 * 0.5);
        brickCtx.strokeStyle = 'rgba(36, 20, 12, 0.45)';
        brickHCtx.strokeStyle = '#363636';
        brickCtx.lineWidth = 2;
        brickHCtx.lineWidth = 2.5;
        brickCtx.beginPath();
        brickHCtx.beginPath();
        brickCtx.moveTo(crX, by + mortarGap);
        brickHCtx.moveTo(crX, by + mortarGap);
        brickCtx.lineTo(crX + (n3 - 0.5) * 10, by + mortarGap + hSpan * 0.55);
        brickHCtx.lineTo(crX + (n3 - 0.5) * 10, by + mortarGap + hSpan * 0.55);
        brickCtx.lineTo(crX + (n2 - 0.5) * 8, by + mortarGap + hSpan);
        brickHCtx.lineTo(crX + (n2 - 0.5) * 8, by + mortarGap + hSpan);
        brickCtx.stroke();
        brickHCtx.stroke();
      }

      // Archaeological dampness & mossy patina along lower brick courses
      if (row >= rows - 5 && n > 0.24) {
        brickCtx.fillStyle = `rgba(52, 76, 34, ${0.18 + n * 0.22})`;
        brickCtx.fillRect(bx + mortarGap, by + mortarGap + hSpan * 0.32, wSpan, hSpan * 0.68);
        const dampR = Math.max(76, rVal - 84);
        brickRCtx.fillStyle = `rgb(${dampR},${dampR},${dampR})`;
        brickRCtx.fillRect(bx + mortarGap, by + mortarGap + hSpan * 0.32, wSpan, hSpan * 0.68);
      }
    }
  }

  // Fine fired-clay sand grog & surface pitting across all bricks
  for (let i = 0; i < 8000; i++) {
    const gx = seededNoise(i, 5, 313) * bSize;
    const gy = seededNoise(i, 9, 317) * bSize;
    const gn = seededNoise(i, 13, 331);
    const sz = 1.2 + gn * 2.4;
    brickCtx.fillStyle = gn > 0.65 ? 'rgba(218, 174, 132, 0.14)' : 'rgba(38, 22, 14, 0.16)';
    brickCtx.fillRect(gx, gy, sz, sz);
    const gh = Math.round(100 + gn * 110);
    brickHCtx.fillStyle = `rgba(${gh},${gh},${gh},0.18)`;
    brickHCtx.fillRect(gx, gy, sz, sz);
  }

  const mauryaBrickMap = toTex(brickC, true, 3, 2);
  const mauryaBrickNormal = toTex(heightCanvasToNormal(brickH, 3.2), false, 3, 2);
  const mauryaBrickRough = toTex(brickR, false, 3, 2);
  const mauryaBrickAo = toTex(heightCanvasToAo(brickH, 4, 2.05, 76), false, 3, 2);
  const mauryaBrickDisp = toTex(brickH, false, 3, 2);

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
  // Faint monsoon rainwater streaks & hairline mortar micro-cracks
  for (let s = 0; s < 26; s++) {
    const sx = seededNoise(s, 19, 101) * 512;
    const sy = seededNoise(s, 23, 107) * 260;
    const sh = 64 + seededNoise(s, 29, 113) * 190;
    const sw = 2 + seededNoise(s, 31, 127) * 6;
    const sg = wbCtx.createLinearGradient(sx, sy, sx, sy + sh);
    sg.addColorStop(0, 'rgba(138, 134, 125, 0.11)');
    sg.addColorStop(1, 'rgba(138, 134, 125, 0)');
    wbCtx.fillStyle = sg;
    wbCtx.fillRect(sx, sy, sw, sh);
  }
  wbCtx.strokeStyle = 'rgba(116, 112, 104, 0.22)';
  wbHCtx.strokeStyle = 'rgba(54, 54, 54, 0.55)';
  wbCtx.lineWidth = 1;
  wbHCtx.lineWidth = 1.2;
  for (let c = 0; c < 18; c++) {
    let cx = seededNoise(c, 5, 131) * 512;
    let cy = seededNoise(c, 9, 137) * 512;
    wbCtx.beginPath();
    wbHCtx.beginPath();
    wbCtx.moveTo(cx, cy);
    wbHCtx.moveTo(cx, cy);
    for (let seg = 0; seg < 4; seg++) {
      cx += (seededNoise(c, seg + 1, 149) - 0.5) * 18;
      cy += 8 + seededNoise(c, seg + 5, 151) * 16;
      wbCtx.lineTo(cx, cy);
      wbHCtx.lineTo(cx, cy);
    }
    wbCtx.stroke();
    wbHCtx.stroke();
  }
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
  // Subtle stucco vertical rainwater run-off streaks & hairline mineral craze lines
  for (let s = 0; s < 22; s++) {
    const sx = seededNoise(s, 41, 211) * 512;
    const sy = seededNoise(s, 43, 223) * 256;
    const sh = 70 + seededNoise(s, 47, 227) * 180;
    const sg = stuccoCtx.createLinearGradient(sx, sy, sx, sy + sh);
    sg.addColorStop(0, 'rgba(154, 146, 134, 0.12)');
    sg.addColorStop(1, 'rgba(154, 146, 134, 0)');
    stuccoCtx.fillStyle = sg;
    stuccoCtx.fillRect(sx, sy, 3 + seededNoise(s, 53, 229) * 6, sh);
  }
  stuccoCtx.strokeStyle = 'rgba(136, 128, 116, 0.18)';
  stuccoHCtx.strokeStyle = 'rgba(90, 90, 90, 0.45)';
  stuccoCtx.lineWidth = 0.9;
  stuccoHCtx.lineWidth = 1.1;
  for (let c = 0; c < 14; c++) {
    let cx = seededNoise(c, 11, 233) * 512;
    let cy = seededNoise(c, 13, 239) * 512;
    stuccoCtx.beginPath();
    stuccoHCtx.beginPath();
    stuccoCtx.moveTo(cx, cy);
    stuccoHCtx.moveTo(cx, cy);
    for (let seg = 0; seg < 4; seg++) {
      cx += (seededNoise(c, seg + 3, 241) - 0.5) * 16;
      cy += 9 + seededNoise(c, seg + 7, 251) * 14;
      stuccoCtx.lineTo(cx, cy);
      stuccoHCtx.lineTo(cx, cy);
    }
    stuccoCtx.stroke();
    stuccoHCtx.stroke();
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

  // 11. Carved 4th-century CE Gupta Sandstone Nativity Bas-Relief Backing
  const [natC, natCtx] = makeCanvas(512, 640);
  const [natH, natHCtx] = makeCanvas(512, 640);
  const natGrad = natCtx.createLinearGradient(0, 0, 0, 640);
  natGrad.addColorStop(0, '#785c3d');
  natGrad.addColorStop(0.42, '#9a7954');
  natGrad.addColorStop(1, '#684d31');
  natCtx.fillStyle = natGrad;
  natCtx.fillRect(0, 0, 512, 640);
  natHCtx.fillStyle = '#525252';
  natHCtx.fillRect(0, 0, 512, 640);

  // Fine Chunar sandstone sedimentary grain, chisel tooling marks & weathered mineral patina
  for (let i = 0; i < 3000; i++) {
    const x = seededNoise(i, 7, 173) * 512;
    const y = seededNoise(i, 11, 179) * 640;
    const tone = seededNoise(i, 13, 181);
    natCtx.fillStyle = tone > 0.5 ? 'rgba(222, 192, 152, 0.11)' : 'rgba(54, 38, 22, 0.14)';
    natCtx.fillRect(x, y, 5 + tone * 14, 1.5);
    const hv = Math.round(70 + tone * 48);
    natHCtx.fillStyle = `rgba(${hv},${hv},${hv},0.24)`;
    natHCtx.fillRect(x, y, 5 + tone * 14, 1.5);
  }

  // Carved double border molding, scalloped Prabhamandala halo, flying Gandharvas & attendant reliefs
  for (const [ctx, strokeA, strokeB, isHeight] of [
    [natCtx, '#523a22', '#cfb082', false],
    [natHCtx, '#9c9c9c', '#dedede', true],
  ] as Array<[CanvasRenderingContext2D, string, string, boolean]>) {
    ctx.strokeStyle = strokeA;
    ctx.lineWidth = 16;
    ctx.strokeRect(16, 16, 480, 608);
    ctx.strokeStyle = strokeB;
    ctx.lineWidth = 5;
    ctx.strokeRect(32, 32, 448, 576);

    // Carved beaded pearl-and-lotus arch halo behind Maya Devi
    ctx.fillStyle = strokeB;
    for (let p = 0; p < 22; p++) {
      const a = Math.PI + (p / 21) * Math.PI;
      const px = 256 + Math.cos(a) * 188;
      const py = 236 + Math.sin(a) * 188;
      ctx.beginPath();
      ctx.arc(px, py, 8.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Scalloped double Prabhamandala lotus petals behind central figures
    ctx.strokeStyle = strokeB;
    ctx.lineWidth = 4;
    for (let r = 0; r < 3; r++) {
      ctx.beginPath();
      ctx.arc(246, 228, 76 + r * 28, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
    }
    ctx.strokeStyle = isHeight ? '#c8c8c8' : '#b7966a';
    ctx.lineWidth = 2.5;
    for (let ray = 0; ray < 15; ray++) {
      const ra = Math.PI * 1.08 + (ray / 14) * Math.PI * 0.84;
      ctx.beginPath();
      ctx.moveTo(246 + Math.cos(ra) * 76, 228 + Math.sin(ra) * 76);
      ctx.lineTo(246 + Math.cos(ra) * 136, 228 + Math.sin(ra) * 136);
      ctx.stroke();
    }

    // Carved flying celestial Vidyadhara / Gandharva figures holding garlands in upper corners
    for (const side of [-1, 1]) {
      const gx = 256 + side * 144;
      const gy = 98;
      ctx.fillStyle = isHeight ? '#c0c0c0' : '#a8875d';
      ctx.beginPath();
      ctx.ellipse(gx, gy, 32, 14, side * -0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(gx - side * 26, gy - 6, 11, 0, Math.PI * 2);
      ctx.fill();
      // Trailing celestial scarf scroll
      ctx.strokeStyle = strokeB;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(gx + side * 10, gy + 4);
      ctx.quadraticCurveTo(gx + side * 44, gy - 14, gx + side * 56, gy + 16);
      ctx.stroke();
    }

    // Shallow bas-relief kneeling Brahma & Indra attendant silhouettes flanking pedestal
    for (const side of [-1, 1]) {
      const ax = 256 + side * 158;
      const ay = 474;
      ctx.fillStyle = isHeight ? '#aeaeae' : '#96764f';
      ctx.beginPath();
      ctx.ellipse(ax, ay, 24, 38, side * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ax - side * 4, ay - 46, 13, 0, Math.PI * 2);
      ctx.fill();
    }

    // Carved stepped lotus frieze along bottom register
    ctx.fillStyle = strokeA;
    ctx.fillRect(46, 534, 420, 48);
    ctx.fillStyle = strokeB;
    for (let lx = 66; lx <= 446; lx += 30) {
      ctx.beginPath();
      ctx.moveTo(lx - 12, 576);
      ctx.quadraticCurveTo(lx, 540, lx + 12, 576);
      ctx.closePath();
      ctx.fill();
    }
  }
  const nativityReliefMap = toTex(natC, true, 1, 1, true);
  const nativityReliefNormal = toTex(heightCanvasToNormal(natH, 3.1), false, 1, 1, true);

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
    mauryaBrickDisp,
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

  // 13. Carved Nepali Sal Wood & Polished Teak Planks (Interior Boardwalk, Tie-Beams & Doorway Casings)
  const [swC, swCtx] = makeCanvas(512, 512);
  const [swH, swHCtx] = makeCanvas(512, 512);
  const [swR, swRCtx] = makeCanvas(512, 512);
  swCtx.fillStyle = '#6c4529';
  swCtx.fillRect(0, 0, 512, 512);
  swHCtx.fillStyle = '#909090';
  swHCtx.fillRect(0, 0, 512, 512);
  swRCtx.fillStyle = '#a8a8a8';
  swRCtx.fillRect(0, 0, 512, 512);

  const planks = 8;
  const plankH = 512 / planks;
  for (let p = 0; p < planks; p++) {
    const py = p * plankH;
    const tone = seededNoise(p, 17, 307);
    const pr = Math.round(98 + tone * 26);
    const pg = Math.round(62 + tone * 18);
    const pb = Math.round(36 + tone * 12);
    swCtx.fillStyle = `rgb(${pr},${pg},${pb})`;
    swCtx.fillRect(0, py + 1.5, 512, plankH - 3);
    // Plank joint groove
    swCtx.fillStyle = 'rgba(34, 20, 12, 0.72)';
    swCtx.fillRect(0, py, 512, 2);
    swHCtx.fillStyle = '#242424';
    swHCtx.fillRect(0, py, 512, 2);
    swRCtx.fillStyle = '#e0e0e0';
    swRCtx.fillRect(0, py, 512, 2);

    // Organic longitudinal wood grain & teak sheen variations
    for (let g = 0; g < 18; g++) {
      const gy = py + 4 + (g / 18) * (plankH - 8);
      const gn = seededNoise(p * 31 + g, 3, 311);
      swCtx.strokeStyle = gn > 0.5 ? 'rgba(54, 30, 16, 0.28)' : 'rgba(154, 106, 66, 0.16)';
      swCtx.lineWidth = 1.0 + gn * 1.4;
      swCtx.beginPath();
      swHCtx.strokeStyle = gn > 0.5 ? '#727272' : '#bcbcbc';
      swHCtx.lineWidth = 1.0;
      swHCtx.beginPath();
      for (let x = 0; x <= 512; x += 32) {
        const yOff = Math.sin(x * 0.025 + gn * 8.0 + p) * 2.2;
        if (x === 0) {
          swCtx.moveTo(x, gy + yOff);
          swHCtx.moveTo(x, gy + yOff);
        } else {
          swCtx.lineTo(x, gy + yOff);
          swHCtx.lineTo(x, gy + yOff);
        }
      }
      swCtx.stroke();
      swHCtx.stroke();
      const rv = Math.round(118 + gn * 64);
      swRCtx.fillStyle = `rgba(${rv},${rv},${rv},0.35)`;
      swRCtx.fillRect(0, gy - 1, 512, 2);
    }
  }
  const salWoodMap = toTex(swC, true, 2, 2);
  const salWoodNormal = toTex(heightCanvasToNormal(swH, 1.85), false, 2, 2);
  const salWoodRough = toTex(swR, false, 2, 2);
  allTex.push(salWoodMap, salWoodNormal, salWoodRough);

  // 14. Excavated Sandy-Earth Trench Bed (Maya Devi Archaeological Pit Floor)
  const [teC, teCtx] = makeCanvas(512, 512);
  const [teH, teHCtx] = makeCanvas(512, 512);
  const [teR, teRCtx] = makeCanvas(512, 512);
  teCtx.fillStyle = '#5c4936';
  teCtx.fillRect(0, 0, 512, 512);
  teHCtx.fillStyle = '#787878';
  teHCtx.fillRect(0, 0, 512, 512);
  teRCtx.fillStyle = '#dcdcdc';
  teRCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2400; i++) {
    const x = seededNoise(i, 3, 601) * 512;
    const y = seededNoise(i, 5, 607) * 512;
    const sz = 1.5 + seededNoise(i, 11, 613) * 5.5;
    const tone = seededNoise(i, 13, 619);
    if (tone > 0.78) {
      teCtx.fillStyle = 'rgba(138, 114, 84, 0.34)';
      teHCtx.fillStyle = '#a6a6a6';
    } else if (tone < 0.25) {
      teCtx.fillStyle = 'rgba(54, 42, 30, 0.38)';
      teHCtx.fillStyle = '#525252';
      teRCtx.fillStyle = '#a4a4a4';
      teRCtx.fillRect(x, y, sz * 1.6, sz * 1.2);
    } else {
      teCtx.fillStyle = 'rgba(106, 86, 64, 0.28)';
      teHCtx.fillStyle = '#828282';
    }
    teCtx.fillRect(x, y, sz, sz * 0.72);
    teHCtx.fillRect(x, y, sz, sz * 0.72);
  }
  teCtx.strokeStyle = 'rgba(66, 52, 38, 0.22)';
  teCtx.lineWidth = 2;
  for (let r = 0; r < 14; r++) {
    const ry = r * 38 + 12;
    teCtx.beginPath();
    teCtx.moveTo(0, ry);
    teCtx.quadraticCurveTo(256, ry + (r % 2 === 0 ? 12 : -12), 512, ry);
    teCtx.stroke();
  }
  const trenchEarthMap = toTex(teC, true, 9, 6);
  const trenchEarthNormal = toTex(heightCanvasToNormal(teH, 2.5), false, 9, 6);
  const trenchEarthRough = toTex(teR, false, 9, 6);
  allTex.push(trenchEarthMap, trenchEarthNormal, trenchEarthRough);

  // 15. Dark Coffered Museum Timber & Acoustic Ceiling Panels
  const [ctC, ctCtx] = makeCanvas(512, 512);
  const [ctH, ctHCtx] = makeCanvas(512, 512);
  const [ctR, ctRCtx] = makeCanvas(512, 512);
  ctCtx.fillStyle = '#382215';
  ctCtx.fillRect(0, 0, 512, 512);
  ctHCtx.fillStyle = '#888888';
  ctHCtx.fillRect(0, 0, 512, 512);
  ctRCtx.fillStyle = '#b6b6b6';
  ctRCtx.fillRect(0, 0, 512, 512);
  for (let s = 0; s < 16; s++) {
    const sy = s * 32;
    const tn = seededNoise(s, 9, 701);
    ctCtx.fillStyle = `rgb(${Math.round(54 + tn * 22)},${Math.round(32 + tn * 14)},${Math.round(19 + tn * 9)})`;
    ctCtx.fillRect(0, sy + 2, 512, 28);
    ctCtx.fillStyle = 'rgba(14, 8, 4, 0.85)';
    ctCtx.fillRect(0, sy, 512, 2.5);
    ctHCtx.fillStyle = '#242424';
    ctHCtx.fillRect(0, sy, 512, 2.5);
    ctRCtx.fillStyle = '#dedede';
    ctRCtx.fillRect(0, sy, 512, 2.5);
  }
  const cofferTimberMap = toTex(ctC, true, 2, 2);
  const cofferTimberNormal = toTex(heightCanvasToNormal(ctH, 2.0), false, 2, 2);
  const cofferTimberRough = toTex(ctR, false, 2, 2);
  allTex.push(cofferTimberMap, cofferTimberNormal, cofferTimberRough);

  // 16. Quilted Himalayan Tibetan Silk Brocade Prayer Cushion Texture + Tactile Normal Map
  const [cfC, cfCtx] = makeCanvas(512, 512);
  const [cfH, cfHCtx] = makeCanvas(512, 512);
  const cfGrad = cfCtx.createRadialGradient(256, 256, 28, 256, 256, 330);
  cfGrad.addColorStop(0, '#8f242b');
  cfGrad.addColorStop(0.7, '#751b22');
  cfGrad.addColorStop(1, '#581218');
  cfCtx.fillStyle = cfGrad;
  cfCtx.fillRect(0, 0, 512, 512);
  cfHCtx.fillStyle = '#b8b8b8';
  cfHCtx.fillRect(0, 0, 512, 512);

  // Fine woven silk slub threads (cross-hatch weave)
  for (let i = 0; i < 512; i += 4) {
    const shade = (i % 8 === 0) ? 1 : 0;
    cfCtx.fillStyle = shade ? 'rgba(255, 224, 160, 0.05)' : 'rgba(28, 4, 8, 0.11)';
    cfCtx.fillRect(0, i, 512, 2);
    cfCtx.fillRect(i, 0, 2, 512);
    cfHCtx.fillStyle = shade ? '#c4c4c4' : '#9c9c9c';
    cfHCtx.fillRect(0, i, 512, 2);
    cfHCtx.fillRect(i, 0, 2, 512);
  }
  // Golden Tibetan Endless Knot & Lotus Rosette Brocade Medallions in tiled lattice
  for (let gy = 64; gy < 512; gy += 128) {
    for (let gx = 64; gx < 512; gx += 128) {
      for (const [ctx, colGold, colSaffron] of [
        [cfCtx, 'rgba(229, 174, 62, 0.68)', 'rgba(246, 206, 108, 0.45)'],
        [cfHCtx, '#e6e6e6', '#d4d4d4'],
      ] as Array<[CanvasRenderingContext2D, string, string]>) {
        ctx.save();
        ctx.translate(gx, gy);
        ctx.strokeStyle = colGold;
        ctx.lineWidth = 3;
        // Outer 8-petal lotus ring
        for (let p = 0; p < 8; p++) {
          const a = (p / 8) * Math.PI * 2;
          ctx.beginPath();
          ctx.ellipse(Math.cos(a) * 26, Math.sin(a) * 26, 11, 6, a, 0, Math.PI * 2);
          ctx.stroke();
        }
        // Central Endless Knot lattice
        ctx.strokeStyle = colSaffron;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(-14, -14, 28, 28);
        ctx.beginPath();
        ctx.moveTo(-20, -6);
        ctx.lineTo(20, -6);
        ctx.moveTo(-20, 6);
        ctx.lineTo(20, 6);
        ctx.moveTo(-6, -20);
        ctx.lineTo(-6, 20);
        ctx.moveTo(6, -20);
        ctx.lineTo(6, 20);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
  // Quilted channel seams + tufted diamond pockets & double gold piping border
  for (let q = 0; q <= 512; q += 128) {
    cfCtx.strokeStyle = 'rgba(34, 6, 9, 0.48)';
    cfCtx.lineWidth = 4;
    cfCtx.beginPath();
    cfCtx.moveTo(q, 0);
    cfCtx.lineTo(q, 512);
    cfCtx.moveTo(0, q);
    cfCtx.lineTo(512, q);
    cfCtx.stroke();

    cfHCtx.strokeStyle = '#383838';
    cfHCtx.lineWidth = 6;
    cfHCtx.beginPath();
    cfHCtx.moveTo(q, 0);
    cfHCtx.lineTo(q, 512);
    cfHCtx.moveTo(0, q);
    cfHCtx.lineTo(512, q);
    cfHCtx.stroke();
  }
  cfCtx.strokeStyle = '#eab347';
  cfCtx.lineWidth = 14;
  cfCtx.strokeRect(12, 12, 488, 488);
  cfCtx.strokeStyle = '#c87f24';
  cfCtx.lineWidth = 4;
  cfCtx.strokeRect(24, 24, 464, 464);

  const cushionFabricMap = toTex(cfC, true, 1, 1);
  const cushionFabricNormal = toTex(heightCanvasToNormal(cfH, 2.3), false, 1, 1);
  allTex.push(cushionFabricMap, cushionFabricNormal);

  // 16B. Crimson & Gold Pleated Tibetan Silk Altar Skirt Brocade (Choe-sham Offering Table)
  const [abC, abCtx] = makeCanvas(512, 256);
  const [abH, abHCtx] = makeCanvas(512, 256);
  abCtx.fillStyle = '#6f1419';
  abCtx.fillRect(0, 0, 512, 256);
  abHCtx.fillStyle = '#909090';
  abHCtx.fillRect(0, 0, 512, 256);
  // Vertical fabric pleat folds across skirt width
  for (let x = 0; x < 512; x += 32) {
    const fg = abCtx.createLinearGradient(x, 0, x + 32, 0);
    fg.addColorStop(0, 'rgba(26, 4, 6, 0.45)');
    fg.addColorStop(0.35, 'rgba(155, 36, 42, 0.25)');
    fg.addColorStop(0.65, 'rgba(210, 74, 62, 0.16)');
    fg.addColorStop(1, 'rgba(26, 4, 6, 0.45)');
    abCtx.fillStyle = fg;
    abCtx.fillRect(x, 0, 32, 256);

    const hg = abHCtx.createLinearGradient(x, 0, x + 32, 0);
    hg.addColorStop(0, '#3e3e3e');
    hg.addColorStop(0.5, '#d8d8d8');
    hg.addColorStop(1, '#3e3e3e');
    abHCtx.fillStyle = hg;
    abHCtx.fillRect(x, 0, 32, 256);
  }
  // Upper Saffron-Gold Tibetan Valance Band & Embroidered Cloud/Lotus Trim
  abCtx.fillStyle = '#c88b26';
  abCtx.fillRect(0, 0, 512, 54);
  abCtx.fillStyle = '#29406c';
  abCtx.fillRect(0, 54, 512, 18);
  abCtx.fillStyle = '#eab64c';
  abCtx.fillRect(0, 224, 512, 32);
  // Embroidered golden lotus medallions per pleat & fringe tassels along bottom
  for (let mx = 48; mx < 512; mx += 96) {
    abCtx.strokeStyle = '#f5ca64';
    abCtx.lineWidth = 3;
    abCtx.beginPath();
    abCtx.arc(mx, 146, 26, 0, Math.PI * 2);
    abCtx.stroke();
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      abCtx.beginPath();
      abCtx.moveTo(mx + Math.cos(a) * 8, 146 + Math.sin(a) * 8);
      abCtx.lineTo(mx + Math.cos(a) * 23, 146 + Math.sin(a) * 23);
      abCtx.stroke();
    }
    abHCtx.strokeStyle = '#ffffff';
    abHCtx.lineWidth = 3;
    abHCtx.beginPath();
    abHCtx.arc(mx, 146, 26, 0, Math.PI * 2);
    abHCtx.stroke();
  }
  for (let tx = 4; tx < 512; tx += 8) {
    abCtx.fillStyle = tx % 16 === 0 ? '#f6d272' : '#d2932e';
    abCtx.fillRect(tx, 232, 4, 24);
  }
  const altarBrocadeMap = toTex(abC, true, 1, 1, true);
  const altarBrocadeNormal = toTex(heightCanvasToNormal(abH, 2.2), false, 1, 1, true);
  allTex.push(altarBrocadeMap, altarBrocadeNormal);

  // 16C. Ivory-Gold Ceremonial Khata Silk Scarf Texture
  const [khC, khCtx] = makeCanvas(256, 512);
  khCtx.fillStyle = '#f3ebd8';
  khCtx.fillRect(0, 0, 256, 512);
  for (let y = 0; y < 512; y += 6) {
    khCtx.fillStyle = y % 12 === 0 ? 'rgba(218, 185, 114, 0.14)' : 'rgba(255, 255, 255, 0.14)';
    khCtx.fillRect(0, y, 256, 2);
  }
  khCtx.fillStyle = 'rgba(212, 166, 62, 0.55)';
  khCtx.fillRect(10, 0, 12, 512);
  khCtx.fillRect(234, 0, 12, 512);
  khCtx.strokeStyle = 'rgba(205, 160, 64, 0.36)';
  khCtx.lineWidth = 2;
  for (let my = 48; my < 512; my += 96) {
    khCtx.strokeRect(108, my - 16, 40, 32);
    khCtx.beginPath();
    khCtx.arc(128, my, 24, 0, Math.PI * 2);
    khCtx.stroke();
  }
  const khataSilkMap = toTex(khC, true, 1, 2);
  allTex.push(khataSilkMap);

  // 17. Three Museum History Plaques along the Observation Railing
  const makePlaqueTex = (eyebrow: string, title: string, line1: string, line2: string) => {
    const [pc, pCtx] = makeCanvas(512, 320);
    const bg = pCtx.createLinearGradient(0, 0, 0, 320);
    bg.addColorStop(0, '#18202c');
    bg.addColorStop(1, '#0d131b');
    pCtx.fillStyle = bg;
    pCtx.fillRect(0, 0, 512, 320);
    pCtx.strokeStyle = '#d4a342';
    pCtx.lineWidth = 8;
    pCtx.strokeRect(12, 12, 488, 296);
    pCtx.strokeStyle = 'rgba(212, 163, 66, 0.42)';
    pCtx.lineWidth = 2;
    pCtx.strokeRect(24, 24, 464, 272);
    pCtx.fillStyle = '#eab354';
    pCtx.font = 'bold 17px Georgia, serif';
    pCtx.textAlign = 'center';
    pCtx.fillText(eyebrow.toUpperCase(), 256, 68);
    pCtx.fillStyle = '#f8f2e4';
    pCtx.font = 'bold 28px Georgia, serif';
    pCtx.fillText(title, 256, 118);
    pCtx.fillStyle = '#d4a342';
    pCtx.fillRect(140, 142, 232, 2);
    pCtx.fillStyle = '#cbd5e1';
    pCtx.font = '18px Georgia, serif';
    pCtx.fillText(line1, 256, 194);
    pCtx.fillText(line2, 256, 226);
    pCtx.fillStyle = '#f59e0b';
    pCtx.font = 'bold 15px sans-serif';
    pCtx.fillText('PRESS E OR CLICK TO INSPECT', 256, 272);
    const t = toTex(pc, true, 1, 1, true);
    allTex.push(t);
    return t;
  };
  const plaqueMarkerMap = makePlaqueTex(
    'Birthplace Sanctum · Core',
    'The Sacred Marker Stone',
    'Conglomerate stone marking the exact',
    'birthplace of Siddhartha Gautama.',
  );
  const plaqueChambersMap = makePlaqueTex(
    'Archaeological Trench · -1.6m',
    'Mauryan Brick Chambers',
    'Stepped Mauryan, Sunga & Kushan brick',
    'sanctuary foundations (3rd c. BCE).',
  );
  const plaqueNativityMap = makePlaqueTex(
    '4th-Century Sandstone Stele',
    'The Nativity Sculpture',
    'Queen Maya Devi grasping a Sal tree',
    'branch as Prince Siddhartha stands.',
  );

  // 20. Sacred Marker Stone Weathered River-Cobble Conglomerate PBR Maps (1024x1024)
  const [msC, msCtx] = makeCanvas(1024, 1024);
  const [msH, msHCtx] = makeCanvas(1024, 1024);
  const [msR, msRCtx] = makeCanvas(1024, 1024);
  const msGrad = msCtx.createRadialGradient(512, 512, 80, 512, 512, 640);
  msGrad.addColorStop(0, '#9d8264');
  msGrad.addColorStop(0.55, '#7e654b');
  msGrad.addColorStop(1, '#584634');
  msCtx.fillStyle = msGrad;
  msCtx.fillRect(0, 0, 1024, 1024);
  msHCtx.fillStyle = '#747474';
  msHCtx.fillRect(0, 0, 1024, 1024);
  msRCtx.fillStyle = '#d2d2d2';
  msRCtx.fillRect(0, 0, 1024, 1024);

  // Fine sandy conglomerate matrix & mineral grains
  for (let i = 0; i < 6500; i++) {
    const x = seededNoise(i, 3, 911) * 1024;
    const y = seededNoise(i, 7, 919) * 1024;
    const t = seededNoise(i, 11, 929);
    const sz = 2 + t * 5;
    msCtx.fillStyle = t > 0.5 ? 'rgba(196, 170, 136, 0.18)' : 'rgba(46, 36, 26, 0.22)';
    msCtx.fillRect(x, y, sz, sz);
    const hv = Math.round(92 + t * 58);
    msHCtx.fillStyle = `rgba(${hv},${hv},${hv},0.36)`;
    msHCtx.fillRect(x, y, sz, sz);
  }

  // Embedded rounded river pebbles / quartz, sandstone, jasper & basalt clasts
  const cobblePalettes = [
    ['#dfd0b8', '#a89274'],
    ['#988470', '#635344'],
    ['#c18d62', '#825738'],
    ['#75706a', '#46423d'],
    ['#ece1cf', '#b9a78c'],
    ['#ad7a5e', '#744c37'],
  ];
  for (let c = 0; c < 680; c++) {
    const cx = 24 + seededNoise(c, 5, 937) * 976;
    const cy = 24 + seededNoise(c, 9, 941) * 976;
    const rx = 7 + seededNoise(c, 13, 947) * 26;
    const ry = rx * (0.56 + seededNoise(c, 17, 953) * 0.44);
    const ang = seededNoise(c, 21, 967) * Math.PI;
    const pal = cobblePalettes[Math.floor(seededNoise(c, 25, 971) * cobblePalettes.length)];

    msCtx.save();
    msCtx.translate(cx, cy);
    msCtx.rotate(ang);
    msCtx.fillStyle = 'rgba(32, 23, 16, 0.56)';
    msCtx.beginPath();
    msCtx.ellipse(0, 0, rx + 3.5, ry + 3.5, 0, 0, Math.PI * 2);
    msCtx.fill();
    const cg = msCtx.createRadialGradient(-rx * 0.25, -ry * 0.25, 1, 0, 0, rx);
    cg.addColorStop(0, pal[0]);
    cg.addColorStop(0.75, pal[1]);
    cg.addColorStop(1, '#4c3b2b');
    msCtx.fillStyle = cg;
    msCtx.beginPath();
    msCtx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    msCtx.fill();
    msCtx.restore();

    msHCtx.save();
    msHCtx.translate(cx, cy);
    msHCtx.rotate(ang);
    msHCtx.fillStyle = '#323232';
    msHCtx.beginPath();
    msHCtx.ellipse(0, 0, rx + 3.5, ry + 3.5, 0, 0, Math.PI * 2);
    msHCtx.fill();
    const hg = msHCtx.createRadialGradient(-rx * 0.22, -ry * 0.22, 1, 0, 0, rx);
    hg.addColorStop(0, '#f8f8f8');
    hg.addColorStop(1, '#8c8c8c');
    msHCtx.fillStyle = hg;
    msHCtx.beginPath();
    msHCtx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    msHCtx.fill();
    msHCtx.restore();

    msRCtx.save();
    msRCtx.translate(cx, cy);
    msRCtx.rotate(ang);
    const rv = Math.round(78 + seededNoise(c, 31, 977) * 78);
    msRCtx.fillStyle = `rgb(${rv},${rv},${rv})`;
    msRCtx.beginPath();
    msRCtx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    msRCtx.fill();
    msRCtx.restore();
  }

  // Natural geological fracture veins & fine calcite lines
  msCtx.strokeStyle = 'rgba(38, 26, 18, 0.56)';
  msHCtx.strokeStyle = '#1c1c1c';
  msCtx.lineWidth = 3.0;
  msHCtx.lineWidth = 3.8;
  for (let f = 0; f < 14; f++) {
    let fx = seededNoise(f, 3, 983) * 1024;
    let fy = seededNoise(f, 7, 991) * 1024;
    msCtx.beginPath();
    msHCtx.beginPath();
    msCtx.moveTo(fx, fy);
    msHCtx.moveTo(fx, fy);
    for (let s = 0; s < 7; s++) {
      fx += (seededNoise(f, s + 11, 997) - 0.35) * 78;
      fy += (seededNoise(f, s + 17, 1009) - 0.5) * 68;
      msCtx.lineTo(fx, fy);
      msHCtx.lineTo(fx, fy);
    }
    msCtx.stroke();
    msHCtx.stroke();
  }

  // Ritual worship traces on the center stone face (kumkum, saffron paste & glinting gold varq flecks)
  for (let w = 0; w < 38; w++) {
    const wx = 240 + seededNoise(w, 2, 1013) * 544;
    const wy = 260 + seededNoise(w, 5, 1019) * 504;
    const wr = 10 + seededNoise(w, 9, 1021) * 26;
    const isGold = w % 4 === 0;
    msCtx.fillStyle = isGold
      ? 'rgba(242, 194, 68, 0.42)'
      : w % 2 === 0
        ? 'rgba(188, 52, 22, 0.24)'
        : 'rgba(222, 140, 26, 0.22)';
    msCtx.beginPath();
    msCtx.arc(wx, wy, wr, 0, Math.PI * 2);
    msCtx.fill();
    if (isGold) {
      msRCtx.fillStyle = '#383838';
      msRCtx.beginPath();
      msRCtx.arc(wx, wy, wr * 0.75, 0, Math.PI * 2);
      msRCtx.fill();
    }
  }
  const markerStoneMap = toTex(msC, true, 1, 1, true);
  const markerStoneNormal = toTex(heightCanvasToNormal(msH, 3.8), false, 1, 1, true);
  const markerStoneRough = toTex(msR, false, 1, 1, true);
  allTex.push(markerStoneMap, markerStoneNormal, markerStoneRough);

  // 21. Isotropic Fine-Grained Carved Gupta Chunar Sandstone (for Nativity Relief Statues — zero wood-streak bands)
  const [csC, csCtx] = makeCanvas(512, 512);
  const [csH, csHCtx] = makeCanvas(512, 512);
  const [csR, csRCtx] = makeCanvas(512, 512);
  const csGrad = csCtx.createRadialGradient(256, 256, 30, 256, 256, 360);
  csGrad.addColorStop(0, '#d8ba93');
  csGrad.addColorStop(0.6, '#ccb088');
  csGrad.addColorStop(1, '#c0a27a');
  csCtx.fillStyle = csGrad;
  csCtx.fillRect(0, 0, 512, 512);
  csHCtx.fillStyle = '#a0a0a0';
  csHCtx.fillRect(0, 0, 512, 512);
  csRCtx.fillStyle = '#b4b4b4';
  csRCtx.fillRect(0, 0, 512, 512);

  // Fine isotropic quartz-sandstone micro-grain & subtle ancient patina mottling
  for (let i = 0; i < 4200; i++) {
    const x = seededNoise(i, 3, 1103) * 512;
    const y = seededNoise(i, 7, 1109) * 512;
    const rad = 1.0 + seededNoise(i, 11, 1117) * 3.8;
    const tone = seededNoise(i, 17, 1123);
    csCtx.fillStyle =
      tone > 0.6
        ? 'rgba(246, 228, 198, 0.14)'
        : tone < 0.25
          ? 'rgba(122, 92, 58, 0.12)'
          : 'rgba(182, 148, 108, 0.10)';
    csCtx.beginPath();
    csCtx.arc(x, y, rad, 0, Math.PI * 2);
    csCtx.fill();

    const hv = Math.round(138 + tone * 52);
    csHCtx.fillStyle = `rgba(${hv},${hv},${hv},0.28)`;
    csHCtx.beginPath();
    csHCtx.arc(x, y, rad * 0.85, 0, Math.PI * 2);
    csHCtx.fill();

    const rv = Math.round(145 + (1 - tone) * 65);
    csRCtx.fillStyle = `rgba(${rv},${rv},${rv},0.26)`;
    csRCtx.beginPath();
    csRCtx.arc(x, y, rad, 0, Math.PI * 2);
    csRCtx.fill();
  }
  // Subtle mineral warm-ochre & gold-leaf rub traces on venerated relief stone
  for (let p = 0; p < 160; p++) {
    const px = seededNoise(p, 5, 1151) * 512;
    const py = seededNoise(p, 9, 1163) * 512;
    const pr = 5 + seededNoise(p, 13, 1171) * 18;
    const t = seededNoise(p, 19, 1181);
    csCtx.fillStyle = t > 0.5 ? 'rgba(232, 196, 136, 0.08)' : 'rgba(138, 102, 64, 0.08)';
    csCtx.beginPath();
    csCtx.arc(px, py, pr, 0, Math.PI * 2);
    csCtx.fill();
  }
  const carvedSandstoneMap = toTex(csC, true, 2, 2);
  const carvedSandstoneNormal = toTex(heightCanvasToNormal(csH, 1.35), false, 2, 2);
  const carvedSandstoneRough = toTex(csR, false, 2, 2);
  allTex.push(carvedSandstoneMap, carvedSandstoneNormal, carvedSandstoneRough);

  const clampedAniso = Math.min(16, Math.max(1, maxAnisotropy));
  for (const t of allTex) {
    t.anisotropy = clampedAniso;
  }

  return {
    mauryaBrickMap,
    mauryaBrickNormal,
    mauryaBrickRough,
    mauryaBrickAo,
    mauryaBrickDisp,
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
    salWoodMap,
    salWoodNormal,
    salWoodRough,
    trenchEarthMap,
    trenchEarthNormal,
    trenchEarthRough,
    cofferTimberMap,
    cofferTimberNormal,
    cofferTimberRough,
    cushionFabricMap,
    cushionFabricNormal,
    altarBrocadeMap,
    altarBrocadeNormal,
    khataSilkMap,
    markerStoneMap,
    markerStoneNormal,
    markerStoneRough,
    carvedSandstoneMap,
    carvedSandstoneNormal,
    carvedSandstoneRough,
    plaqueMarkerMap,
    plaqueChambersMap,
    plaqueNativityMap,
    dispose: () => {
      for (const t of allTex) t.dispose();
    },
  };
}

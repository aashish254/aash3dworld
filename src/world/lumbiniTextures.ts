import * as THREE from 'three';

export interface LumbiniTextureSet {
  mauryaBrickMap: THREE.CanvasTexture;
  mauryaBrickNormal: THREE.CanvasTexture;
  mauryaBrickRough: THREE.CanvasTexture;
  mauryaBrickAo: THREE.CanvasTexture;
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
      moveTo: noop,
      lineTo: noop,
      quadraticCurveTo: noop,
      fill: noop,
      stroke: noop,
      save: noop,
      restore: noop,
      translate: noop,
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
  // 1. Weathered Maurya Archaeological Terracotta Brick (base of Maya Devi Temple & Pushkarini Ghats)
  const [brickC, brickCtx] = makeCanvas(512, 512);
  const [brickH, brickHCtx] = makeCanvas(512, 512);
  const [brickR, brickRCtx] = makeCanvas(512, 512);
  brickCtx.fillStyle = '#5a4337';
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
      const r = Math.round(154 + n * 34 - n2 * 18);
      const g = Math.round(78 + n * 22 - n2 * 12);
      const b = Math.round(52 + n * 16 - n2 * 8);
      brickCtx.fillStyle = `rgb(${r},${g},${b})`;
      brickCtx.fillRect(bx + 2, by + 2, bw - 4, bh - 4);
      // Subtle lime weathering edge
      brickCtx.fillStyle = `rgba(218, 202, 182, ${0.06 + n2 * 0.08})`;
      brickCtx.fillRect(bx + 3, by + 2, bw - 6, 4);

      const hVal = Math.round(192 + n * 48);
      brickHCtx.fillStyle = `rgb(${hVal},${hVal},${hVal})`;
      brickHCtx.fillRect(bx + 2, by + 2, bw - 4, bh - 4);

      const rVal = Math.round(188 + n2 * 52);
      brickRCtx.fillStyle = `rgb(${rVal},${rVal},${rVal})`;
      brickRCtx.fillRect(bx + 2, by + 2, bw - 4, bh - 4);
    }
  }
  const mauryaBrickMap = toTex(brickC, true, 3, 2);
  const mauryaBrickNormal = toTex(heightCanvasToNormal(brickH, 2.3), false, 3, 2);
  const mauryaBrickRough = toTex(brickR, false, 3, 2);
  const mauryaBrickAo = toTex(heightCanvasToAo(brickH, 3, 1.75, 84), false, 3, 2);

  // 2. Whitewashed Sacred Lime Stucco (Maya Devi upper temple facade & stepped roof)
  const [stuccoC, stuccoCtx] = makeCanvas(512, 512);
  const [stuccoH, stuccoHCtx] = makeCanvas(512, 512);
  const [stuccoR, stuccoRCtx] = makeCanvas(512, 512);
  stuccoCtx.fillStyle = '#f2ede4';
  stuccoCtx.fillRect(0, 0, 512, 512);
  stuccoHCtx.fillStyle = '#d4d4d4';
  stuccoHCtx.fillRect(0, 0, 512, 512);
  stuccoRCtx.fillStyle = '#cfcfcf';
  stuccoRCtx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 2400; i++) {
    const x = seededNoise(i, 1, 7) * 512;
    const y = seededNoise(i, 2, 13) * 512;
    const rad = 2 + seededNoise(i, 3, 19) * 14;
    const shade = 232 + Math.round((seededNoise(i, 4, 23) - 0.5) * 18);
    stuccoCtx.fillStyle = `rgba(${shade}, ${shade - 4}, ${shade - 12}, 0.18)`;
    stuccoCtx.beginPath();
    stuccoCtx.arc(x, y, rad, 0, Math.PI * 2);
    stuccoCtx.fill();

    const hv = 198 + Math.round((seededNoise(i, 5, 31) - 0.5) * 34);
    stuccoHCtx.fillStyle = `rgba(${hv},${hv},${hv},0.22)`;
    stuccoHCtx.beginPath();
    stuccoHCtx.arc(x, y, rad * 0.85, 0, Math.PI * 2);
    stuccoHCtx.fill();

    const rv = 175 + Math.round(seededNoise(i, 6, 47) * 60);
    stuccoRCtx.fillStyle = `rgba(${rv},${rv},${rv},0.25)`;
    stuccoRCtx.beginPath();
    stuccoRCtx.arc(x, y, rad, 0, Math.PI * 2);
    stuccoRCtx.fill();
  }
  // Subtle horizontal ashlar plaster scoring lines
  for (let y = 0; y < 512; y += 64) {
    stuccoCtx.fillStyle = 'rgba(155, 146, 134, 0.22)';
    stuccoCtx.fillRect(0, y, 512, 2);
    stuccoHCtx.fillStyle = '#8e8e8e';
    stuccoHCtx.fillRect(0, y, 512, 2);
  }
  const stuccoWhiteMap = toTex(stuccoC, true, 2, 2);
  const stuccoWhiteNormal = toTex(heightCanvasToNormal(stuccoH, 1.35), false, 2, 2);
  const stuccoWhiteRough = toTex(stuccoR, false, 2, 2);
  const stuccoWhiteAo = toTex(heightCanvasToAo(stuccoH, 2, 1.25, 118), false, 2, 2);

  // 3. Polished Buff Chunar Sandstone (Ashoka Pillar, Dharma Wheel Capital, Plinths & Torana)
  const [chuC, chuCtx] = makeCanvas(512, 512);
  const [chuH, chuHCtx] = makeCanvas(512, 512);
  const [chuR, chuRCtx] = makeCanvas(512, 512);
  const chuGrad = chuCtx.createLinearGradient(0, 0, 512, 512);
  chuGrad.addColorStop(0, '#d6b992');
  chuGrad.addColorStop(0.5, '#cbb089');
  chuGrad.addColorStop(1, '#dfc5a1');
  chuCtx.fillStyle = chuGrad;
  chuCtx.fillRect(0, 0, 512, 512);
  chuHCtx.fillStyle = '#cccccc';
  chuHCtx.fillRect(0, 0, 512, 512);
  chuRCtx.fillStyle = '#9c9c9c';
  chuRCtx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 1800; i++) {
    const x = seededNoise(i, 11, 5) * 512;
    const y = seededNoise(i, 22, 9) * 512;
    const w = 12 + seededNoise(i, 33, 15) * 44;
    const h = 1.5 + seededNoise(i, 44, 21) * 4;
    const tone = seededNoise(i, 55, 29);
    chuCtx.fillStyle = tone > 0.5 ? 'rgba(246, 229, 202, 0.14)' : 'rgba(138, 108, 76, 0.12)';
    chuCtx.fillRect(x, y, w, h);
    const hv = Math.round(182 + tone * 52);
    chuHCtx.fillStyle = `rgba(${hv},${hv},${hv},0.22)`;
    chuHCtx.fillRect(x, y, w, h);
    const rv = Math.round(130 + (1 - tone) * 68);
    chuRCtx.fillStyle = `rgba(${rv},${rv},${rv},0.26)`;
    chuRCtx.fillRect(x, y, w, h);
  }
  const chunarStoneMap = toTex(chuC, true, 1, 2);
  const chunarStoneNormal = toTex(heightCanvasToNormal(chuH, 1.45), false, 1, 2);
  const chunarStoneRough = toTex(chuR, false, 1, 2);
  const chunarStoneAo = toTex(heightCanvasToAo(chuH, 2, 1.3, 125), false, 1, 2);

  // 4. Antique Gilded Bronze Patina (Hero Buddha, Gajur Spire, Lotus Petals)
  const [giltC, giltCtx] = makeCanvas(512, 512);
  const [giltH, giltHCtx] = makeCanvas(512, 512);
  const [giltR, giltRCtx] = makeCanvas(512, 512);
  const giltGrad = giltCtx.createLinearGradient(0, 0, 512, 512);
  giltGrad.addColorStop(0, '#efc55e');
  giltGrad.addColorStop(0.5, '#d69e35');
  giltGrad.addColorStop(1, '#f3ce6c');
  giltCtx.fillStyle = giltGrad;
  giltCtx.fillRect(0, 0, 512, 512);
  giltHCtx.fillStyle = '#c8c8c8';
  giltHCtx.fillRect(0, 0, 512, 512);
  giltRCtx.fillStyle = '#585858';
  giltRCtx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 1600; i++) {
    const x = seededNoise(i, 7, 11) * 512;
    const y = seededNoise(i, 9, 17) * 512;
    const rad = 2 + seededNoise(i, 13, 31) * 10;
    const tone = seededNoise(i, 17, 43);
    giltCtx.fillStyle = tone > 0.45 ? 'rgba(255, 232, 152, 0.14)' : 'rgba(130, 86, 22, 0.15)';
    giltCtx.beginPath();
    giltCtx.arc(x, y, rad, 0, Math.PI * 2);
    giltCtx.fill();
    const hv = Math.round(180 + tone * 50);
    giltHCtx.fillStyle = `rgba(${hv},${hv},${hv},0.22)`;
    giltHCtx.beginPath();
    giltHCtx.arc(x, y, rad * 0.7, 0, Math.PI * 2);
    giltHCtx.fill();
    const rv = Math.round(62 + (1 - tone) * 65);
    giltRCtx.fillStyle = `rgba(${rv},${rv},${rv},0.25)`;
    giltRCtx.beginPath();
    giltRCtx.arc(x, y, rad, 0, Math.PI * 2);
    giltRCtx.fill();
  }
  const giltBronzeMap = toTex(giltC, true, 2, 2);
  const giltBronzeNormal = toTex(heightCanvasToNormal(giltH, 1.25), false, 2, 2);
  const giltBronzeRough = toTex(giltR, false, 2, 2);

  // 5. All-Seeing Buddha Wisdom Eyes Harmika Texture (Maya Devi Spire Harmika Box)
  const [eyesC, eyesCtx] = makeCanvas(512, 256);
  const eyesGrad = eyesCtx.createLinearGradient(0, 0, 0, 256);
  eyesGrad.addColorStop(0, '#fff9ec');
  eyesGrad.addColorStop(1, '#ede1c6');
  eyesCtx.fillStyle = eyesGrad;
  eyesCtx.fillRect(0, 0, 512, 256);
  eyesCtx.strokeStyle = '#c48f29';
  eyesCtx.lineWidth = 10;
  eyesCtx.strokeRect(10, 10, 492, 236);
  // Decorative red-gold upper lotus band
  eyesCtx.fillStyle = '#9c2c24';
  eyesCtx.fillRect(15, 15, 482, 26);
  eyesCtx.fillStyle = '#d9a43b';
  for (let x = 32; x < 492; x += 28) {
    eyesCtx.beginPath();
    eyesCtx.arc(x, 28, 7, 0, Math.PI * 2);
    eyesCtx.fill();
  }
  // Wisdom eyes
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
    // Iris
    eyesCtx.fillStyle = '#183059';
    eyesCtx.beginPath();
    eyesCtx.arc(0, -2, 19, 0, Math.PI * 2);
    eyesCtx.fill();
    eyesCtx.fillStyle = '#0c1528';
    eyesCtx.beginPath();
    eyesCtx.arc(0, -2, 9, 0, Math.PI * 2);
    eyesCtx.fill();
    // Brow
    eyesCtx.strokeStyle = '#182442';
    eyesCtx.lineWidth = 8;
    eyesCtx.beginPath();
    eyesCtx.moveTo(-70, -26);
    eyesCtx.quadraticCurveTo(0, -64, 72, -22);
    eyesCtx.stroke();
    eyesCtx.restore();
  };
  drawEye(152);
  drawEye(360);
  // Urna (third eye)
  eyesCtx.fillStyle = '#b91c1c';
  eyesCtx.beginPath();
  eyesCtx.arc(256, 86, 13, 0, Math.PI * 2);
  eyesCtx.fill();
  eyesCtx.strokeStyle = '#d49a2a';
  eyesCtx.lineWidth = 3;
  eyesCtx.stroke();
  // Nepali question-mark Ek (nose / unity symbol)
  eyesCtx.strokeStyle = '#182442';
  eyesCtx.lineWidth = 8;
  eyesCtx.lineCap = 'round';
  eyesCtx.beginPath();
  eyesCtx.arc(256, 152, 16, Math.PI * 1.1, Math.PI * 0.35, false);
  eyesCtx.quadraticCurveTo(270, 184, 248, 206);
  eyesCtx.quadraticCurveTo(234, 222, 260, 224);
  eyesCtx.stroke();
  const harmikaEyesMap = toTex(eyesC, true, 1, 1, true);

  // 6. Ashoka Pillar Brahmi Edict Inscription Plaque
  const [brC, brCtx] = makeCanvas(512, 512);
  const [brH, brHCtx] = makeCanvas(512, 512);
  brCtx.fillStyle = '#cdb28c';
  brCtx.fillRect(0, 0, 512, 512);
  brHCtx.fillStyle = '#d0d0d0';
  brHCtx.fillRect(0, 0, 512, 512);
  brCtx.strokeStyle = '#7e6344';
  brCtx.lineWidth = 10;
  brCtx.strokeRect(20, 20, 472, 472);
  brHCtx.strokeStyle = '#606060';
  brHCtx.lineWidth = 10;
  brHCtx.strokeRect(20, 20, 472, 472);
  // Carved ancient Brahmi-style geometric glyph lines
  brCtx.strokeStyle = '#5c462e';
  brHCtx.strokeStyle = '#383838';
  brCtx.lineWidth = 5;
  brHCtx.lineWidth = 5;
  for (let row = 0; row < 6; row++) {
    const y = 78 + row * 68;
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
  const brahmiEdictNormal = toTex(heightCanvasToNormal(brH, 2.0), false, 1, 1, true);

  // 7. Maya Devi Nativity Bas-Relief Mural (Inner Sanctum Altar Backdrop)
  const [natC, natCtx] = makeCanvas(512, 512);
  const natGrad = natCtx.createLinearGradient(0, 0, 0, 512);
  natGrad.addColorStop(0, '#8d5b21');
  natGrad.addColorStop(0.5, '#d69d38');
  natGrad.addColorStop(1, '#7c4c19');
  natCtx.fillStyle = natGrad;
  natCtx.fillRect(0, 0, 512, 512);
  // Radiant Dharma aura halo
  const haloGrad = natCtx.createRadialGradient(256, 236, 20, 256, 236, 210);
  haloGrad.addColorStop(0, '#fff2b2');
  haloGrad.addColorStop(0.45, '#e8b349');
  haloGrad.addColorStop(1, 'rgba(130, 82, 22, 0)');
  natCtx.fillStyle = haloGrad;
  natCtx.fillRect(0, 0, 512, 512);
  // Stylized Sal tree arch framing Queen Maya Devi & lotus
  natCtx.strokeStyle = '#5a3610';
  natCtx.lineWidth = 10;
  natCtx.strokeRect(18, 18, 476, 476);
  natCtx.strokeStyle = '#f9dc81';
  natCtx.lineWidth = 4;
  natCtx.beginPath();
  natCtx.arc(256, 232, 168, Math.PI * 0.9, Math.PI * 2.1);
  natCtx.stroke();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    natCtx.beginPath();
    natCtx.moveTo(256 + Math.cos(a) * 44, 232 + Math.sin(a) * 44);
    natCtx.lineTo(256 + Math.cos(a) * 165, 232 + Math.sin(a) * 165);
    natCtx.stroke();
  }
  const nativityReliefMap = toTex(natC, true, 1, 1, true);

  // 8. Shilalekh Monument Plaque (LUMBINI · MAYA DEVI TEMPLE)
  const [sgC, sgCtx] = makeCanvas(1024, 512);
  const sgBg = sgCtx.createLinearGradient(0, 0, 0, 512);
  sgBg.addColorStop(0, '#16202a');
  sgBg.addColorStop(1, '#0f171f');
  sgCtx.fillStyle = sgBg;
  sgCtx.fillRect(0, 0, 1024, 512);
  sgCtx.strokeStyle = '#d4a342';
  sgCtx.lineWidth = 14;
  sgCtx.strokeRect(20, 20, 984, 472);
  sgCtx.strokeStyle = '#10b981';
  sgCtx.lineWidth = 4;
  sgCtx.strokeRect(38, 38, 948, 436);
  sgCtx.fillStyle = '#f6dca0';
  sgCtx.font = 'bold 64px Georgia, serif';
  sgCtx.textAlign = 'center';
  sgCtx.fillText('LUMBINI · MAYA DEVI', 512, 205);
  sgCtx.fillStyle = '#d1fae5';
  sgCtx.font = '34px Georgia, serif';
  sgCtx.fillText('Birthplace of Gautama Buddha · Sacred Garden', 512, 290);
  sgCtx.fillStyle = '#e5b95c';
  sgCtx.font = '26px Georgia, serif';
  sgCtx.fillText('Ashoka Pillar · Pushkarini Pond · Peace Sanctuary', 512, 365);
  const shilalekhSignMap = toTex(sgC, true, 1, 1, true);

  const allTex = [
    mauryaBrickMap,
    mauryaBrickNormal,
    mauryaBrickRough,
    mauryaBrickAo,
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
    shilalekhSignMap,
  ];

  return {
    mauryaBrickMap,
    mauryaBrickNormal,
    mauryaBrickRough,
    mauryaBrickAo,
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
    shilalekhSignMap,
    dispose: () => {
      for (const t of allTex) t.dispose();
    },
  };
}

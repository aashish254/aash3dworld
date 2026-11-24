import * as THREE from 'three';

export interface JanakiMandirTextures {
  brickPlazaMap: THREE.CanvasTexture;
  brickPlazaNormal: THREE.CanvasTexture;
  brickPlazaRough: THREE.CanvasTexture;
  brickPlazaAo: THREE.CanvasTexture;
  marbleAshlarMap: THREE.CanvasTexture;
  marbleAshlarNormal: THREE.CanvasTexture;
  marbleAshlarRough: THREE.CanvasTexture;
  marbleAshlarAo: THREE.CanvasTexture;
  marbleTrimMap: THREE.CanvasTexture;
  marbleTrimNormal: THREE.CanvasTexture;
  marbleTrimRough: THREE.CanvasTexture;
  marbleTrimAo: THREE.CanvasTexture;
  stairMarbleMap: THREE.CanvasTexture;
  stairMarbleNormal: THREE.CanvasTexture;
  stairMarbleRough: THREE.CanvasTexture;
  stairMarbleAo: THREE.CanvasTexture;
  pillarCarvedMap: THREE.CanvasTexture;
  pillarCarvedNormal: THREE.CanvasTexture;
  pillarCarvedRough: THREE.CanvasTexture;
  pillarCarvedAo: THREE.CanvasTexture;
  carvedDoorMap: THREE.CanvasTexture;
  carvedDoorNormal: THREE.CanvasTexture;
  courtyardMandalaMap: THREE.CanvasTexture;
  courtyardMandalaNormal: THREE.CanvasTexture;
  courtyardMandalaRough: THREE.CanvasTexture;
  courtyardMandalaAo: THREE.CanvasTexture;
  courtyardMedallionMap: THREE.CanvasTexture;
  courtyardMedallionNormal: THREE.CanvasTexture;
  courtyardMedallionRough: THREE.CanvasTexture;
  courtyardMedallionAo: THREE.CanvasTexture;
  flagstoneMap: THREE.CanvasTexture;
  flagstoneNormal: THREE.CanvasTexture;
  flagstoneRough: THREE.CanvasTexture;
  flagstoneAo: THREE.CanvasTexture;
  prayerWheelMap: THREE.CanvasTexture;
  prayerWheelNormal: THREE.CanvasTexture;
  prayerWheelRough: THREE.CanvasTexture;
  mithilaToranaMap: THREE.CanvasTexture;
  mithilaMuralMap: THREE.CanvasTexture;
  saffronJaliMap: THREE.CanvasTexture;
  saffronJaliNormal: THREE.CanvasTexture;
  stainedGlassArchMap: THREE.CanvasTexture;
  domeRibMap: THREE.CanvasTexture;
  domeRibNormal: THREE.CanvasTexture;
  domeRibRough: THREE.CanvasTexture;
  domeRibAo: THREE.CanvasTexture;
  nepalFlagMap: THREE.CanvasTexture;
  soilLoamMap: THREE.CanvasTexture;
  soilLoamNormal: THREE.CanvasTexture;
  soilLoamRough: THREE.CanvasTexture;
  terracottaUrnMap: THREE.CanvasTexture;
  terracottaUrnNormal: THREE.CanvasTexture;
  terracottaUrnRough: THREE.CanvasTexture;
  tulsiLeafMap: THREE.CanvasTexture;
  tulsiLeafNormal: THREE.CanvasTexture;
  shrubFoliageMap: THREE.CanvasTexture;
  shrubFoliageNormal: THREE.CanvasTexture;
  marigoldMap: THREE.CanvasTexture;
  marigoldNormal: THREE.CanvasTexture;
  fernPalmMap: THREE.CanvasTexture;
  fernPalmNormal: THREE.CanvasTexture;
  antiqueBrassMap: THREE.CanvasTexture;
  antiqueBrassNormal: THREE.CanvasTexture;
  antiqueBrassRough: THREE.CanvasTexture;
  lanternHaloMap: THREE.CanvasTexture;
  altarHaloMap: THREE.CanvasTexture;
  dispose: () => void;
}

function makeCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function heightToNormalCanvas(heightCanvas: HTMLCanvasElement, strength = 2.4): HTMLCanvasElement {
  const w = heightCanvas.width;
  const h = heightCanvas.height;
  const hCtx = heightCanvas.getContext('2d')!;
  const src = hCtx.getImageData(0, 0, w, h).data;

  const [outCanvas, outCtx] = makeCanvas(w, h);
  const outImg = outCtx.createImageData(w, h);
  const dst = outImg.data;

  const sample = (x: number, y: number): number => {
    const wx = ((x % w) + w) % w;
    const wy = ((y % h) + h) % h;
    return src[(wy * w + wx) * 4] / 255;
  };

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

      const dX = tr + 2 * r + br - (tl + 2 * l + bl);
      const dY = bl + 2 * b + br - (tl + 2 * t + tr);

      let nx = -dX * strength;
      let ny = -dY * strength;
      let nz = 1.0;
      const invLen = 1 / Math.hypot(nx, ny, nz);
      nx *= invLen;
      ny *= invLen;
      nz *= invLen;

      const idx = (y * w + x) * 4;
      dst[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      dst[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      dst[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      dst[idx + 3] = 255;
    }
  }

  outCtx.putImageData(outImg, 0, 0);
  return outCanvas;
}

/**
 * Generates an 8-direction multi-radius crevice ambient occlusion canvas from a grayscale heightmap
 * so mortar joints, stair nosing grooves, fluted columns, and carved reliefs gather natural contact shadow.
 */
function heightToAoCanvas(
  heightCanvas: HTMLCanvasElement,
  radius = 3,
  strength = 1.65,
  floorMin = 85,
): HTMLCanvasElement {
  const w = heightCanvas.width;
  const h = heightCanvas.height;
  const hCtx = heightCanvas.getContext('2d')!;
  const src = hCtx.getImageData(0, 0, w, h).data;

  const [outCanvas, outCtx] = makeCanvas(w, h);
  const outImg = outCtx.createImageData(w, h);
  const dst = outImg.data;

  const r1 = Math.max(1, Math.round(radius));
  const r2 = Math.max(2, Math.round(radius * 2));
  const dirs = [
    [r1, 0],
    [-r1, 0],
    [0, r1],
    [0, -r1],
    [r1, r1],
    [-r1, r1],
    [r1, -r1],
    [-r1, -r1],
    [r2, 0],
    [-r2, 0],
    [0, r2],
    [0, -r2],
  ];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const center = src[(y * w + x) * 4] / 255;
      let occ = 0;
      for (let d = 0; d < dirs.length; d++) {
        const sx = (((x + dirs[d][0]) % w) + w) % w;
        const sy = (((y + dirs[d][1]) % h) + h) % h;
        const neighbor = src[(sy * w + sx) * 4] / 255;
        if (neighbor > center) {
          occ += (neighbor - center) * (d < 8 ? 1.0 : 0.55);
        }
      }
      const cavityBoost = center < 0.42 ? (0.42 - center) * 0.48 : 0;
      const ao = Math.max(floorMin / 255, Math.min(1, 1 - (occ / 6.2) * strength - cavityBoost));
      const v = Math.round(ao * 255);
      const idx = (y * w + x) * 4;
      dst[idx] = v;
      dst[idx + 1] = v;
      dst[idx + 2] = v;
      dst[idx + 3] = 255;
    }
  }

  outCtx.putImageData(outImg, 0, 0);
  return outCanvas;
}

export function createJanakiMandirTextures(maxAnisotropy: number): JanakiMandirTextures {
  const list: THREE.Texture[] = [];

  const reg = (
    canvas: HTMLCanvasElement,
    isColor: boolean,
    repX = 1,
    repY = 1,
    clamp = false,
  ): THREE.CanvasTexture => {
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
    tex.wrapT = clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
    tex.repeat.set(repX, repY);
    tex.anisotropy = Math.min(8, maxAnisotropy || 1);
    if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    list.push(tex);
    return tex;
  };

  // 1. Janakpur Chowk Sun-Baked Rose-Terracotta & Buff Brick Plaza Pavers (image_dcbe1087 foreground)
  const [bpC, bpCtx] = makeCanvas(512, 512);
  const [bpHC, bpHCtx] = makeCanvas(512, 512);
  const [bpRC, bpRCtx] = makeCanvas(512, 512);
  bpCtx.fillStyle = '#8b7768';
  bpCtx.fillRect(0, 0, 512, 512);
  bpHCtx.fillStyle = '#383838';
  bpHCtx.fillRect(0, 0, 512, 512);
  bpRCtx.fillStyle = '#e8e8e8';
  bpRCtx.fillRect(0, 0, 512, 512);

  const brickRows = 16;
  const brickCols = 8;
  const bh = 512 / brickRows;
  const bw = 512 / brickCols;
  for (let r = 0; r < brickRows; r++) {
    const off = (r % 2) * (bw * 0.5);
    for (let c = -1; c <= brickCols; c++) {
      const hash = (r * 73 + c * 131) & 255;
      const v = (hash % 28) - 14;
      // Dusty rose-ochre & sun-bleached terracotta tones
      const cr = 186 + v;
      const cg = 148 + Math.floor(v * 0.85);
      const cb = 128 + Math.floor(v * 0.72);
      const x = c * bw + off + 2;
      const y = r * bh + 2;
      bpCtx.fillStyle = `rgb(${cr},${cg},${cb})`;
      bpCtx.fillRect(x, y, bw - 3, bh - 3);
      // Subtle sandy dust & tiny moss patches in rare joints
      if (hash % 29 === 0) {
        bpCtx.fillStyle = 'rgba(72, 92, 46, 0.48)';
        bpCtx.fillRect(x - 2, y - 2, 10, 6);
      }
      const hVal = 184 + (hash % 44);
      bpHCtx.fillStyle = `rgb(${hVal},${hVal},${hVal})`;
      bpHCtx.fillRect(x + 1, y + 1, bw - 5, bh - 5);
      const rVal = 192 + (hash % 42);
      bpRCtx.fillStyle = `rgb(${rVal},${rVal},${rVal})`;
      bpRCtx.fillRect(x, y, bw - 3, bh - 3);
    }
  }
  const brickPlazaMap = reg(bpC, true, 16, 10);
  const brickPlazaNormal = reg(heightToNormalCanvas(bpHC, 2.2), false, 16, 10);
  const brickPlazaRough = reg(bpRC, false, 16, 10);
  const brickPlazaAo = reg(heightToAoCanvas(bpHC, 3, 1.75), false, 16, 10);

  // Seamless periodic 256x256 Makrana marble mineral grain generator (fast, organic, zero tile seams)
  const createMarbleGrainTile = (
    baseR: number,
    baseG: number,
    baseB: number,
    veinR: number,
    veinG: number,
    veinB: number,
    goldHint = true,
  ): HTMLCanvasElement => {
    const sz = 256;
    const [c, ctx] = makeCanvas(sz, sz);
    const img = ctx.createImageData(sz, sz);
    const d = img.data;
    const TAU = Math.PI * 2;
    for (let y = 0; y < sz; y++) {
      const v = (y / sz) * TAU;
      for (let x = 0; x < sz; x++) {
        const u = (x / sz) * TAU;
        // Multi-harmonic periodic turbulence for authentic flowing Makrana marble veins
        const f1 = Math.sin(u * 2 + v) * 0.55 + Math.cos(u - v * 2) * 0.45;
        const f2 = Math.sin(u * 4 - v * 3 + f1 * 1.8) * 0.5 + Math.cos(u * 3 + v * 5) * 0.35;
        const f3 = Math.sin(u * 9 + v * 7 + f2 * 2.2) * 0.3 + Math.cos(u * 11 - v * 8) * 0.2;
        const turb = f1 * 1.45 + f2 * 0.95 + f3 * 0.5;
        const ridge = Math.pow(1 - Math.min(1, Math.abs(Math.sin(u * 2 + v * 2 + turb * 1.65))), 4.5);
        const fineVein = Math.pow(1 - Math.min(1, Math.abs(Math.sin(u * 5 - v * 3 + turb * 2.4))), 7.0) * 0.55;
        const cloud = (f1 * 0.5 + f2 * 0.3 + 0.5) * 0.08;
        const mix = Math.min(1, ridge * 0.72 + fineVein * 0.48 + cloud);
        const warmShift = goldHint ? fineVein * 8 : 0;

        const idx = (y * sz + x) * 4;
        d[idx] = Math.max(0, Math.min(255, Math.round(baseR * (1 - mix) + veinR * mix + warmShift)));
        d[idx + 1] = Math.max(0, Math.min(255, Math.round(baseG * (1 - mix) + veinG * mix + warmShift * 0.6)));
        d[idx + 2] = Math.max(0, Math.min(255, Math.round(baseB * (1 - mix) + veinB * mix - warmShift * 0.3)));
        d[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return c;
  };

  const makranaTile = createMarbleGrainTile(232, 226, 214, 178, 171, 159, true);
  const fineTrimTile = createMarbleGrainTile(234, 229, 219, 186, 179, 166, true);

  // 2. High-Res 1024x1024 Photorealistic PBR Mughal-Style Makrana White Marble Ashlar Masonry
  const [maC, maCtx] = makeCanvas(1024, 1024);
  const [maHC, maHCtx] = makeCanvas(1024, 1024);
  const [maRC, maRCtx] = makeCanvas(1024, 1024);

  maCtx.fillStyle = '#c8c0b1';
  maCtx.fillRect(0, 0, 1024, 1024);
  maHCtx.fillStyle = '#525252';
  maHCtx.fillRect(0, 0, 1024, 1024);
  maRCtx.fillStyle = '#e5e5e5';
  maRCtx.fillRect(0, 0, 1024, 1024);

  const courseH = 128; // 8 courses per 1024px (~0.52m world block height)
  const blockW = 256; // 4 blocks per row (~1.05m world block length)
  for (let row = 0; row < 8; row++) {
    const y = row * courseH;
    const off = (row % 2) * (blockW * 0.5);
    for (let col = -1; col <= 4; col++) {
      const x = col * blockW + off;
      const h = ((col + 4) * 53 + row * 97) & 255;
      const bw = blockW - 4;
      const bh = courseH - 4;

      // Stamp organic Makrana marble veining shifted per block so every slab looks unique
      maCtx.save();
      maCtx.beginPath();
      maCtx.rect(x + 2, y + 2, bw, bh);
      maCtx.clip();
      const ox = (h * 17) % 256;
      const oy = (h * 31) % 256;
      for (let ty = -256; ty < bh + 256; ty += 256) {
        for (let tx = -256; tx < bw + 256; tx += 256) {
          maCtx.drawImage(makranaTile, x + 2 + tx - ox, y + 2 + ty - oy);
        }
      }
      // Subtle warm/cool mineral variation per stone block
      const tint = (h % 14) - 7;
      maCtx.fillStyle = tint >= 0 ? `rgba(246, 240, 228, ${tint * 0.015})` : `rgba(145, 138, 124, ${-tint * 0.016})`;
      maCtx.fillRect(x + 2, y + 2, bw, bh);

      // Carved Mughal recessed rectangular panel (takhcha / beveled dado frame) on alternating courses
      if (row === 1 || row === 5) {
        maCtx.strokeStyle = 'rgba(132, 124, 110, 0.36)';
        maCtx.lineWidth = 3;
        maCtx.strokeRect(x + 20, y + 18, bw - 36, bh - 32);
        maCtx.strokeStyle = 'rgba(248, 244, 236, 0.45)';
        maCtx.lineWidth = 2;
        maCtx.strokeRect(x + 23, y + 21, bw - 42, bh - 38);
      }

      // Crisp chiseled stone edge micro-chamfer (top-left bright, bottom-right shadow)
      maCtx.strokeStyle = 'rgba(250, 246, 238, 0.55)';
      maCtx.lineWidth = 2;
      maCtx.beginPath();
      maCtx.moveTo(x + 3, y + bh);
      maCtx.lineTo(x + 3, y + 3);
      maCtx.lineTo(x + bw, y + 3);
      maCtx.stroke();
      maCtx.strokeStyle = 'rgba(116, 108, 96, 0.42)';
      maCtx.beginPath();
      maCtx.moveTo(x + bw + 1, y + 3);
      maCtx.lineTo(x + bw + 1, y + bh + 1);
      maCtx.lineTo(x + 3, y + bh + 1);
      maCtx.stroke();
      maCtx.restore();

      // Height map block body + beveled edge + recessed takhcha frame
      const hv = 198 + (h % 18);
      maHCtx.fillStyle = `rgb(${hv},${hv},${hv})`;
      maHCtx.fillRect(x + 4, y + 4, bw - 4, bh - 4);
      maHCtx.strokeStyle = '#d4d4d4';
      maHCtx.lineWidth = 3;
      maHCtx.strokeRect(x + 3, y + 3, bw - 2, bh - 2);
      if (row === 1 || row === 5) {
        maHCtx.strokeStyle = '#8e8e8e';
        maHCtx.lineWidth = 5;
        maHCtx.strokeRect(x + 20, y + 18, bw - 36, bh - 32);
      }

      // Roughness map: satin honed Makrana marble face (0.60 - 0.72) vs rougher carved borders
      const rv = 158 + (h % 24);
      maRCtx.fillStyle = `rgb(${rv},${rv},${rv})`;
      maRCtx.fillRect(x + 3, y + 3, bw - 2, bh - 2);
      if (row === 1 || row === 5) {
        maRCtx.strokeStyle = '#cfcfcf';
        maRCtx.lineWidth = 5;
        maRCtx.strokeRect(x + 20, y + 18, bw - 36, bh - 32);
      }
    }

    // Authentic Mughal Geometric Khatam / Lotus-Lozenge Stringcourse Frieze on courses 0 & 4
    if (row === 0 || row === 4) {
      const fy = y + courseH - 26;
      maCtx.fillStyle = 'rgba(205, 198, 184, 0.85)';
      maCtx.fillRect(0, fy, 1024, 22);
      maCtx.fillStyle = 'rgba(42, 96, 104, 0.35)';
      maCtx.fillRect(0, fy + 2, 1024, 3);
      maCtx.fillRect(0, fy + 17, 1024, 3);
      maHCtx.fillStyle = '#929292';
      maHCtx.fillRect(0, fy, 1024, 22);
      maRCtx.fillStyle = '#c8c8c8';
      maRCtx.fillRect(0, fy, 1024, 22);

      for (let dx = 16; dx < 1024; dx += 32) {
        maCtx.fillStyle = 'rgba(163, 82, 54, 0.42)';
        maCtx.beginPath();
        maCtx.moveTo(dx, fy + 4);
        maCtx.lineTo(dx + 8, fy + 11);
        maCtx.lineTo(dx, fy + 18);
        maCtx.lineTo(dx - 8, fy + 11);
        maCtx.closePath();
        maCtx.fill();

        maHCtx.fillStyle = '#ededed';
        maHCtx.beginPath();
        maHCtx.moveTo(dx, fy + 4);
        maHCtx.lineTo(dx + 8, fy + 11);
        maHCtx.lineTo(dx, fy + 18);
        maHCtx.lineTo(dx - 8, fy + 11);
        maHCtx.closePath();
        maHCtx.fill();
      }
    }
  }

  // Subtle historical monsoon mineral patina toward lower edge of tile
  const wGrad = maCtx.createLinearGradient(0, 820, 0, 1024);
  wGrad.addColorStop(0, 'rgba(92, 84, 72, 0)');
  wGrad.addColorStop(1, 'rgba(92, 84, 72, 0.11)');
  maCtx.fillStyle = wGrad;
  maCtx.fillRect(0, 820, 1024, 204);

  const marbleAshlarMap = reg(maC, true, 1, 1);
  const marbleAshlarNormal = reg(heightToNormalCanvas(maHC, 2.2), false, 1, 1);
  const marbleAshlarRough = reg(maRC, false, 1, 1);
  const marbleAshlarAo = reg(heightToAoCanvas(maHC, 4, 1.7), false, 1, 1);

  // 2b. 1024x1024 Honed Mughal Makrana Carved Marble Trim (spandrels, pilasters, archivolts)
  const [mtC, mtCtx] = makeCanvas(1024, 1024);
  const [mtHC, mtHCtx] = makeCanvas(1024, 1024);
  const [mtRC, mtRCtx] = makeCanvas(1024, 1024);

  for (let ty = 0; ty < 1024; ty += 256) {
    for (let tx = 0; tx < 1024; tx += 256) {
      mtCtx.drawImage(fineTrimTile, tx, ty);
    }
  }
  mtHCtx.fillStyle = '#c4c4c4';
  mtHCtx.fillRect(0, 0, 1024, 1024);
  mtRCtx.fillStyle = '#9a9a9a'; // satin-honed carved marble (~0.60 roughness)
  mtRCtx.fillRect(0, 0, 1024, 1024);

  // Subtle dressed marble stone joint & carved Mughal reed molding flutes every 128px
  for (let y = 0; y < 1024; y += 128) {
    mtCtx.strokeStyle = 'rgba(138, 130, 118, 0.24)';
    mtCtx.lineWidth = 2;
    mtCtx.beginPath();
    mtCtx.moveTo(0, y);
    mtCtx.lineTo(1024, y);
    mtCtx.stroke();

    mtCtx.fillStyle = 'rgba(196, 188, 174, 0.35)';
    mtCtx.fillRect(0, y + 8, 1024, 6);
    mtHCtx.fillStyle = '#767676';
    mtHCtx.fillRect(0, y, 1024, 3);
    mtHCtx.fillStyle = '#ebebeb';
    mtHCtx.fillRect(0, y + 7, 1024, 7);
    mtRCtx.fillStyle = '#bababa';
    mtRCtx.fillRect(0, y, 1024, 12);
  }
  const marbleTrimMap = reg(mtC, true, 1, 1);
  const marbleTrimNormal = reg(heightToNormalCanvas(mtHC, 1.8), false, 1, 1);
  const marbleTrimRough = reg(mtRC, false, 1, 1);
  const marbleTrimAo = reg(heightToAoCanvas(mtHC, 4, 1.55), false, 1, 1);

  // 2c. 512x512 Honed Makrana Stair Tread & Threshold Marble (chiseled anti-slip nosing grooves + joint AO)
  const [smC, smCtx] = makeCanvas(512, 512);
  const [smHC, smHCtx] = makeCanvas(512, 512);
  const [smRC, smRCtx] = makeCanvas(512, 512);
  smCtx.fillStyle = '#9e9586';
  smCtx.fillRect(0, 0, 512, 512);
  smHCtx.fillStyle = '#404040';
  smHCtx.fillRect(0, 0, 512, 512);
  smRCtx.fillStyle = '#c8c8c8';
  smRCtx.fillRect(0, 0, 512, 512);

  for (let sr = 0; sr < 4; sr++) {
    const sy = sr * 128;
    const soff = (sr % 2) * 128;
    for (let sc = -1; sc <= 2; sc++) {
      const sx = sc * 256 + soff;
      const sh = ((sc + 3) * 67 + sr * 109) & 255;
      const bx = sx + 2;
      const by = sy + 2;
      const bw = 252;
      const bh = 124;

      smCtx.save();
      smCtx.beginPath();
      smCtx.rect(bx, by, bw, bh);
      smCtx.clip();
      smCtx.drawImage(makranaTile, bx - ((sh * 9) % 128), by - ((sh * 13) % 128), 384, 384);
      // Warm golden-pilgrim foot-worn tread center sheen
      const wearGrad = smCtx.createLinearGradient(bx, by, bx, by + bh);
      wearGrad.addColorStop(0, 'rgba(255, 251, 244, 0.14)');
      wearGrad.addColorStop(0.5, 'rgba(248, 241, 228, 0.22)');
      wearGrad.addColorStop(1, 'rgba(162, 152, 138, 0.18)');
      smCtx.fillStyle = wearGrad;
      smCtx.fillRect(bx, by, bw, bh);
      // Anti-slip triple chiseled stair nosing flutes near slab edge
      for (let g = 0; g < 3; g++) {
        smCtx.fillStyle = 'rgba(132, 122, 108, 0.42)';
        smCtx.fillRect(bx + 6, by + 12 + g * 8, bw - 12, 3);
      }
      smCtx.restore();

      const hBase = 198 + (sh % 18);
      smHCtx.fillStyle = `rgb(${hBase},${hBase},${hBase})`;
      smHCtx.fillRect(bx + 2, by + 2, bw - 4, bh - 4);
      for (let g = 0; g < 3; g++) {
        smHCtx.fillStyle = '#5e5e5e';
        smHCtx.fillRect(bx + 6, by + 12 + g * 8, bw - 12, 3);
      }

      // Honed smooth center (0.34 roughness = ~87) & slightly crisper matte edges/grooves (~148)
      const rBase = 92 + (sh % 26);
      smRCtx.fillStyle = `rgb(${rBase},${rBase},${rBase})`;
      smRCtx.fillRect(bx, by, bw, bh);
      for (let g = 0; g < 3; g++) {
        smRCtx.fillStyle = '#acacac';
        smRCtx.fillRect(bx + 6, by + 12 + g * 8, bw - 12, 3);
      }
    }
  }
  const stairMarbleMap = reg(smC, true, 1, 1);
  const stairMarbleNormal = reg(heightToNormalCanvas(smHC, 2.4), false, 1, 1);
  const stairMarbleRough = reg(smRC, false, 1, 1);
  const stairMarbleAo = reg(heightToAoCanvas(smHC, 4, 1.85), false, 1, 1);

  // 3. Ornate Mithila Simha-Dwar Torana Painting (around central archway arch)
  const [torC, torCtx] = makeCanvas(512, 512);
  torCtx.fillStyle = '#dbd5c7';
  torCtx.fillRect(0, 0, 512, 512);
  // Teal & terracotta architectural spandrel borders
  torCtx.fillStyle = '#2a666e';
  torCtx.fillRect(0, 0, 512, 34);
  torCtx.fillRect(0, 480, 512, 32);
  torCtx.fillStyle = '#a84e32';
  torCtx.fillRect(0, 34, 512, 14);
  torCtx.fillRect(0, 466, 512, 14);
  // Ornamental saffron & teal arch framing crest
  torCtx.strokeStyle = '#c28322';
  torCtx.lineWidth = 18;
  torCtx.beginPath();
  torCtx.arc(256, 300, 195, Math.PI, 0);
  torCtx.stroke();
  torCtx.strokeStyle = '#2a666e';
  torCtx.lineWidth = 10;
  torCtx.beginPath();
  torCtx.arc(256, 300, 178, Math.PI, 0);
  torCtx.stroke();
  // Auspicious Mithila lotus medallions in the left & right arch spandrels
  for (const [mx, my] of [
    [82, 122],
    [430, 122],
    [138, 76],
    [374, 76],
  ]) {
    torCtx.fillStyle = '#a84e32';
    torCtx.beginPath();
    torCtx.arc(mx, my, 24, 0, Math.PI * 2);
    torCtx.fill();
    torCtx.fillStyle = '#d49a2a';
    torCtx.beginPath();
    torCtx.arc(mx, my, 15, 0, Math.PI * 2);
    torCtx.fill();
    torCtx.fillStyle = '#2a666e';
    torCtx.beginPath();
    torCtx.arc(mx, my, 7, 0, Math.PI * 2);
    torCtx.fill();
  }
  // Central dark indigo shadow portal interior cue
  torCtx.fillStyle = '#181411';
  torCtx.beginPath();
  torCtx.arc(256, 300, 162, Math.PI, 0);
  torCtx.lineTo(418, 512);
  torCtx.lineTo(94, 512);
  torCtx.closePath();
  torCtx.fill();
  // Sacred Mithila brass lintel banner over the gate
  torCtx.fillStyle = '#8b2f24';
  torCtx.fillRect(118, 54, 276, 42);
  torCtx.strokeStyle = '#d8a63c';
  torCtx.lineWidth = 4;
  torCtx.strokeRect(120, 56, 272, 38);
  torCtx.fillStyle = '#f2dfad';
  torCtx.font = 'bold 21px Georgia, serif';
  torCtx.textAlign = 'center';
  torCtx.fillText('JANAKI MANDIR · JANAKPUR', 256, 82);
  torCtx.textAlign = 'left';
  const mithilaToranaMap = reg(torC, true, 1, 1, true);

  // 4. Golden Saffron Jali Lattice Screens (4 wing arches & royal bays)
  const [jaliC, jaliCtx] = makeCanvas(256, 256);
  const [jaliHC, jaliHCtx] = makeCanvas(256, 256);
  jaliCtx.fillStyle = '#2b1b0c';
  jaliCtx.fillRect(0, 0, 256, 256);
  jaliHCtx.fillStyle = '#252525';
  jaliHCtx.fillRect(0, 0, 256, 256);

  jaliCtx.strokeStyle = '#cc8a28';
  jaliCtx.lineWidth = 8;
  jaliHCtx.strokeStyle = '#ececec';
  jaliHCtx.lineWidth = 8;
  for (let i = -256; i <= 512; i += 32) {
    jaliCtx.beginPath();
    jaliCtx.moveTo(i, 0);
    jaliCtx.lineTo(i + 256, 256);
    jaliCtx.moveTo(i + 256, 0);
    jaliCtx.lineTo(i, 256);
    jaliCtx.stroke();

    jaliHCtx.beginPath();
    jaliHCtx.moveTo(i, 0);
    jaliHCtx.lineTo(i + 256, 256);
    jaliHCtx.moveTo(i + 256, 0);
    jaliHCtx.lineTo(i, 256);
    jaliHCtx.stroke();
  }
  jaliCtx.strokeStyle = '#a85224';
  jaliCtx.lineWidth = 10;
  jaliCtx.strokeRect(5, 5, 246, 246);
  const saffronJaliMap = reg(jaliC, true, 1, 1);
  const saffronJaliNormal = reg(heightToNormalCanvas(jaliHC, 2.8), false, 1, 1);

  // 5. High-Res 1024x512 Ribbed Makrana Marble Lotus-Petal Onion Dome with Turquoise Collar Rings
  const [domeC, domeCtx] = makeCanvas(1024, 512);
  const [domeHC, domeHCtx] = makeCanvas(1024, 512);
  const [domeRC, domeRCtx] = makeCanvas(1024, 512);
  for (let ty = 0; ty < 512; ty += 256) {
    for (let tx = 0; tx < 1024; tx += 256) {
      domeCtx.drawImage(fineTrimTile, tx, ty);
    }
  }
  domeHCtx.fillStyle = '#909090';
  domeHCtx.fillRect(0, 0, 1024, 512);
  domeRCtx.fillStyle = '#9e9e9e';
  domeRCtx.fillRect(0, 0, 1024, 512);

  const ribs = 16;
  const ribW = 1024 / ribs;
  for (let r = 0; r < ribs; r++) {
    const rx = r * ribW;
    const g = domeCtx.createLinearGradient(rx, 0, rx + ribW, 0);
    g.addColorStop(0, 'rgba(138, 130, 118, 0.58)');
    g.addColorStop(0.24, 'rgba(235, 229, 217, 0.25)');
    g.addColorStop(0.5, 'rgba(248, 244, 236, 0.35)');
    g.addColorStop(0.76, 'rgba(235, 229, 217, 0.25)');
    g.addColorStop(1, 'rgba(138, 130, 118, 0.58)');
    domeCtx.fillStyle = g;
    domeCtx.fillRect(rx, 0, ribW, 512);

    // Painted Mithila turquoise rib flute accents
    domeCtx.fillStyle = '#2a666e';
    domeCtx.fillRect(rx + ribW * 0.43, 0, ribW * 0.14, 512);

    const hg = domeHCtx.createLinearGradient(rx, 0, rx + ribW, 0);
    hg.addColorStop(0, '#4a4a4a');
    hg.addColorStop(0.5, '#f2f2f2');
    hg.addColorStop(1, '#4a4a4a');
    domeHCtx.fillStyle = hg;
    domeHCtx.fillRect(rx, 0, ribW, 512);

    const rg = domeRCtx.createLinearGradient(rx, 0, rx + ribW, 0);
    rg.addColorStop(0, '#d2d2d2');
    rg.addColorStop(0.5, '#969696');
    rg.addColorStop(1, '#d2d2d2');
    domeRCtx.fillStyle = rg;
    domeRCtx.fillRect(rx, 0, ribW, 512);

    // Inverted lotus petal collar at dome base
    const px = rx + ribW * 0.5;
    domeCtx.fillStyle = 'rgba(205, 152, 62, 0.72)';
    domeCtx.beginPath();
    domeCtx.moveTo(px - ribW * 0.42, 444);
    domeCtx.quadraticCurveTo(px, 386, px + ribW * 0.42, 444);
    domeCtx.closePath();
    domeCtx.fill();

    domeHCtx.fillStyle = '#ececec';
    domeHCtx.beginPath();
    domeHCtx.moveTo(px - ribW * 0.42, 444);
    domeHCtx.quadraticCurveTo(px, 386, px + ribW * 0.42, 444);
    domeHCtx.closePath();
    domeHCtx.fill();
  }
  // Turquoise & terracotta dome neck ring trim
  domeCtx.fillStyle = '#2a666e';
  domeCtx.fillRect(0, 448, 1024, 36);
  domeCtx.fillStyle = '#a84e32';
  domeCtx.fillRect(0, 484, 1024, 28);
  domeCtx.fillStyle = '#2a666e';
  domeCtx.fillRect(0, 0, 1024, 48);

  const domeRibMap = reg(domeC, true, 1, 1);
  const domeRibNormal = reg(heightToNormalCanvas(domeHC, 2.5), false, 1, 1);
  const domeRibRough = reg(domeRC, false, 1, 1);
  const domeRibAo = reg(heightToAoCanvas(domeHC, 4, 1.6), false, 1, 1);

  // 6. Authentic Crimson Double-Pennant National Flag of Nepal (transparent canvas)
  const [flagC, flagCtx] = makeCanvas(256, 256);
  flagCtx.clearRect(0, 0, 256, 256);
  // Cobalt blue outer border silhouette
  flagCtx.fillStyle = '#13356b';
  flagCtx.beginPath();
  flagCtx.moveTo(10, 12);
  flagCtx.lineTo(222, 128);
  flagCtx.lineTo(104, 128);
  flagCtx.lineTo(240, 244);
  flagCtx.lineTo(10, 244);
  flagCtx.closePath();
  flagCtx.fill();
  // Crimson red field
  flagCtx.fillStyle = '#a61c2c';
  flagCtx.beginPath();
  flagCtx.moveTo(22, 30);
  flagCtx.lineTo(192, 118);
  flagCtx.lineTo(74, 118);
  flagCtx.lineTo(212, 232);
  flagCtx.lineTo(22, 232);
  flagCtx.closePath();
  flagCtx.fill();
  // White crescent moon & sun emblem
  flagCtx.fillStyle = '#f2ede4';
  flagCtx.beginPath();
  flagCtx.arc(72, 86, 18, 0, Math.PI * 2);
  flagCtx.fill();
  flagCtx.fillStyle = '#a61c2c';
  flagCtx.beginPath();
  flagCtx.arc(72, 78, 15, 0, Math.PI * 2);
  flagCtx.fill();
  flagCtx.fillStyle = '#f2ede4';
  flagCtx.beginPath();
  flagCtx.arc(72, 184, 20, 0, Math.PI * 2);
  flagCtx.fill();
  const nepalFlagMap = reg(flagC, true, 1, 1, true);

  // 7. High-Res 1024x1024 Repeating Weather-Worn Nepali Ashtakona & Chaukath Stone Courtyard Tiles (5x4 tiled = ~172 px/m, ~1.49m bays)
  const [cmC, cmCtx] = makeCanvas(1024, 1024);
  const [cmHC, cmHCtx] = makeCanvas(1024, 1024);
  const [cmRC, cmRCtx] = makeCanvas(1024, 1024);

  // Eroded sandy mortar base
  cmCtx.fillStyle = '#6c6255';
  cmCtx.fillRect(0, 0, 1024, 1024);
  cmHCtx.fillStyle = '#343434';
  cmHCtx.fillRect(0, 0, 1024, 1024);
  cmRCtx.fillStyle = '#eeeeee'; // gritty matte mortar
  cmRCtx.fillRect(0, 0, 1024, 1024);

  const stampWeatheredStonePoly = (
    drawPath: (c: CanvasRenderingContext2D) => void,
    rgb: [number, number, number],
    heightVal: number,
    roughVal: number,
    seed: number,
    grainAlpha = 0.32,
  ) => {
    const jitter = (seed % 16) - 8;
    const r = Math.max(0, Math.min(255, rgb[0] + jitter));
    const g = Math.max(0, Math.min(255, rgb[1] + Math.round(jitter * 0.92)));
    const b = Math.max(0, Math.min(255, rgb[2] + Math.round(jitter * 0.85)));

    cmCtx.save();
    drawPath(cmCtx);
    cmCtx.clip();
    cmCtx.fillStyle = `rgb(${r},${g},${b})`;
    cmCtx.fillRect(0, 0, 1024, 1024);
    cmCtx.globalAlpha = grainAlpha;
    cmCtx.drawImage(makranaTile, -((seed * 17) % 256), -((seed * 31) % 256));
    cmCtx.drawImage(makranaTile, 256 - ((seed * 17) % 256), -((seed * 31) % 256));
    cmCtx.drawImage(makranaTile, -((seed * 17) % 256), 256 - ((seed * 31) % 256));
    cmCtx.drawImage(makranaTile, 256 - ((seed * 17) % 256), 256 - ((seed * 31) % 256));
    cmCtx.drawImage(makranaTile, 512 - ((seed * 17) % 256), 512 - ((seed * 31) % 256));
    cmCtx.drawImage(makranaTile, 768 - ((seed * 17) % 256), 768 - ((seed * 31) % 256));
    cmCtx.globalAlpha = 1;
    // Soft sun-bleached chiseled arris wear
    cmCtx.strokeStyle = 'rgba(246, 240, 229, 0.24)';
    cmCtx.lineWidth = 2.0;
    drawPath(cmCtx);
    cmCtx.stroke();
    cmCtx.restore();

    cmHCtx.save();
    drawPath(cmHCtx);
    cmHCtx.fillStyle = `rgb(${heightVal},${heightVal},${heightVal})`;
    cmHCtx.fill();
    cmHCtx.strokeStyle = '#444444';
    cmHCtx.lineWidth = 2.8;
    cmHCtx.stroke();
    cmHCtx.restore();

    cmRCtx.save();
    drawPath(cmRCtx);
    cmRCtx.fillStyle = `rgb(${roughVal},${roughVal},${roughVal})`;
    cmRCtx.fill();
    cmRCtx.strokeStyle = '#d4d4d4';
    cmRCtx.lineWidth = 2.2;
    cmRCtx.stroke();
    cmRCtx.restore();
  };

  const baySize = 256; // 4x4 courtyard bays per 1024px repeat (~1.49m per stone bay)
  for (let by = 0; by < 4; by++) {
    for (let bx = 0; bx < 4; bx++) {
      const ox = bx * baySize;
      const oy = by * baySize;
      const cx = ox + baySize * 0.5;
      const cy = oy + baySize * 0.5;
      const baySeed = (bx * 73 + by * 139) & 255;
      const isAshtakonaBay = (bx + by) % 2 === 0;

      // 1. Dressed outer buff sandstone ashlar frame slabs
      const frameT = 24;
      const borderSlabs: Array<[number, number, number, number, [number, number, number]]> = [
        [ox + 2, oy + 2, frameT - 3, frameT - 3, [196, 186, 170]],
        [ox + baySize - frameT + 1, oy + 2, frameT - 3, frameT - 3, [192, 182, 166]],
        [ox + 2, oy + baySize - frameT + 1, frameT - 3, frameT - 3, [190, 180, 164]],
        [ox + baySize - frameT + 1, oy + baySize - frameT + 1, frameT - 3, frameT - 3, [198, 188, 172]],
        [ox + frameT + 1, oy + 2, 102, frameT - 3, [206, 197, 182]],
        [ox + frameT + 106, oy + 2, 100, frameT - 3, [198, 189, 174]],
        [ox + frameT + 1, oy + baySize - frameT + 1, 100, frameT - 3, [200, 191, 176]],
        [ox + frameT + 104, oy + baySize - frameT + 1, 102, frameT - 3, [208, 199, 184]],
        [ox + 2, oy + frameT + 1, frameT - 3, 102, [202, 193, 178]],
        [ox + 2, oy + frameT + 106, frameT - 3, 100, [194, 185, 170]],
        [ox + baySize - frameT + 1, oy + frameT + 1, frameT - 3, 100, [195, 186, 171]],
        [ox + baySize - frameT + 1, oy + frameT + 104, frameT - 3, 102, [204, 195, 180]],
      ];

      borderSlabs.forEach(([rx, ry, rw, rh, rgb], sIdx) => {
        stampWeatheredStonePoly(
          (c) => {
            c.beginPath();
            c.rect(rx, ry, rw, rh);
          },
          rgb,
          190 + ((baySeed + sIdx * 11) % 24),
          152 + ((baySeed + sIdx * 17) % 30),
          baySeed + sIdx * 19,
          0.32,
        );
      });

      const inMin = frameT + 2;
      const inMax = baySize - frameT - 2;

      if (isAshtakonaBay) {
        // 2a. Corner Damaru slate-grey & weathered sandstone spandrel inlays
        const octCut = 48;
        const corners: Array<[number, number, number, number, number, number, [number, number, number]]> = [
          [ox + inMin, oy + inMin, ox + inMin + octCut, oy + inMin, ox + inMin, oy + inMin + octCut, [142, 140, 134]],
          [ox + inMax, oy + inMin, ox + inMax - octCut, oy + inMin, ox + inMax, oy + inMin + octCut, [168, 138, 118]],
          [ox + inMax, oy + inMax, ox + inMax - octCut, oy + inMax, ox + inMax, oy + inMax - octCut, [142, 140, 134]],
          [ox + inMin, oy + inMax, ox + inMin + octCut, oy + inMax, ox + inMin, oy + inMax - octCut, [168, 138, 118]],
        ];
        corners.forEach(([x0, y0, x1, y1, x2, y2, rgb], cIdx) => {
          stampWeatheredStonePoly(
            (c) => {
              c.beginPath();
              c.moveTo(x0, y0);
              c.lineTo(x1, y1);
              c.lineTo(x2, y2);
              c.closePath();
            },
            rgb,
            184,
            168,
            baySeed + cIdx * 23,
            0.28,
          );
        });

        // 3a. Octagonal Chaukath limestone outer ring & muted mineral Ashtakona 8-pointed star
        const outerOctR = 98;
        const midStarR = 86;
        const innerStarR = 60;
        const coreR = 28;

        for (let seg = 0; seg < 8; seg++) {
          const a0 = (seg / 8) * Math.PI * 2 + Math.PI / 8;
          const a1 = ((seg + 1) / 8) * Math.PI * 2 + Math.PI / 8;
          stampWeatheredStonePoly(
            (c) => {
              c.beginPath();
              c.moveTo(cx + Math.cos(a0) * midStarR, cy + Math.sin(a0) * midStarR);
              c.lineTo(cx + Math.cos(a0) * outerOctR, cy + Math.sin(a0) * outerOctR);
              c.lineTo(cx + Math.cos(a1) * outerOctR, cy + Math.sin(a1) * outerOctR);
              c.lineTo(cx + Math.cos(a1) * midStarR, cy + Math.sin(a1) * midStarR);
              c.closePath();
            },
            seg % 2 === 0 ? [210, 202, 188] : [201, 193, 179],
            196,
            144,
            baySeed + seg * 29,
            0.34,
          );
        }

        // 8-Pointed Ashtakona Star (muted Patan slate-basalt & weathered terracotta sandstone)
        for (let pt = 0; pt < 8; pt++) {
          const aPeak = (pt / 8) * Math.PI * 2;
          const aL = aPeak - Math.PI / 8;
          const aR = aPeak + Math.PI / 8;
          const tipR = midStarR - 2;
          const valleyR = innerStarR;
          const rgb: [number, number, number] =
            pt % 2 === 0 ? [116, 128, 126] : [164, 120, 102];
          stampWeatheredStonePoly(
            (c) => {
              c.beginPath();
              c.moveTo(cx + Math.cos(aL) * valleyR, cy + Math.sin(aL) * valleyR);
              c.lineTo(cx + Math.cos(aPeak) * tipR, cy + Math.sin(aPeak) * tipR);
              c.lineTo(cx + Math.cos(aR) * valleyR, cy + Math.sin(aR) * valleyR);
              c.lineTo(cx + Math.cos(aPeak) * (coreR + 3), cy + Math.sin(aPeak) * (coreR + 3));
              c.closePath();
            },
            rgb,
            190,
            136,
            baySeed + pt * 37,
            0.30,
          );

          // Foot-worn Makrana limestone diamond-lozenges between star points
          const aMid = aPeak + Math.PI / 8;
          stampWeatheredStonePoly(
            (c) => {
              c.beginPath();
              c.moveTo(cx + Math.cos(aMid) * (coreR + 2), cy + Math.sin(aMid) * (coreR + 2));
              c.lineTo(cx + Math.cos(aPeak) * (tipR - 2), cy + Math.sin(aPeak) * (tipR - 2));
              c.lineTo(cx + Math.cos(aMid) * (midStarR - 3), cy + Math.sin(aMid) * (midStarR - 3));
              c.lineTo(cx + Math.cos(aPeak + Math.PI / 4) * (tipR - 2), cy + Math.sin(aPeak + Math.PI / 4) * (tipR - 2));
              c.closePath();
            },
            [212, 205, 192],
            198,
            126, // Foot-polished Makrana inlay
            baySeed + pt * 41,
            0.36,
          );
        }

        // Carved 8-petal Padma stone rosette & ochre sandstone boss
        stampWeatheredStonePoly(
          (c) => {
            c.beginPath();
            c.arc(cx, cy, coreR, 0, Math.PI * 2);
          },
          [206, 198, 183],
          196,
          132,
          baySeed + 5,
          0.32,
        );
        for (let p = 0; p < 8; p++) {
          const pa = (p / 8) * Math.PI * 2;
          cmCtx.save();
          cmCtx.translate(cx, cy);
          cmCtx.rotate(pa);
          cmCtx.fillStyle = p % 2 === 0 ? 'rgba(156, 114, 96, 0.72)' : 'rgba(104, 118, 116, 0.72)';
          cmCtx.beginPath();
          cmCtx.moveTo(0, -9);
          cmCtx.quadraticCurveTo(6.5, -18, 0, -25);
          cmCtx.quadraticCurveTo(-6.5, -18, 0, -9);
          cmCtx.fill();
          cmCtx.restore();
        }
        stampWeatheredStonePoly(
          (c) => {
            c.beginPath();
            c.arc(cx, cy, 9, 0, Math.PI * 2);
          },
          [176, 148, 108],
          208,
          122,
          baySeed + 99,
          0.22,
        );
      } else {
        // 2b. Quiet Hand-Dressed Limestone Ashlar Field with Carved Khatam Diamond Inlay
        const innerSpan = inMax - inMin;
        const half = innerSpan * 0.5;
        const qTiles: Array<[number, number, number, number, [number, number, number]]> = [
          [ox + inMin, oy + inMin, half - 1.5, half - 1.5, [202, 194, 179]],
          [ox + inMin + half + 1.5, oy + inMin, half - 1.5, half - 1.5, [195, 187, 172]],
          [ox + inMin, oy + inMin + half + 1.5, half - 1.5, half - 1.5, [197, 189, 174]],
          [ox + inMin + half + 1.5, oy + inMin + half + 1.5, half - 1.5, half - 1.5, [205, 197, 182]],
        ];
        qTiles.forEach(([tx, ty, tw, th, rgb], qIdx) => {
          stampWeatheredStonePoly(
            (c) => {
              c.beginPath();
              c.rect(tx, ty, tw, th);
            },
            rgb,
            193 + ((baySeed + qIdx * 13) % 18),
            138 + ((baySeed + qIdx * 19) % 24),
            baySeed + qIdx * 31,
            0.36,
          );
        });
        // Centered carved limestone + muted slate diamond keystone
        const dR = 52;
        stampWeatheredStonePoly(
          (c) => {
            c.beginPath();
            c.moveTo(cx, cy - dR);
            c.lineTo(cx + dR, cy);
            c.lineTo(cx, cy + dR);
            c.lineTo(cx - dR, cy);
            c.closePath();
          },
          [184, 176, 162],
          196,
          130,
          baySeed + 51,
          0.34,
        );
        const dR2 = 30;
        stampWeatheredStonePoly(
          (c) => {
            c.beginPath();
            c.moveTo(cx, cy - dR2);
            c.lineTo(cx + dR2, cy);
            c.lineTo(cx, cy + dR2);
            c.lineTo(cx - dR2, cy);
            c.closePath();
          },
          [134, 138, 134],
          190,
          140,
          baySeed + 67,
          0.3,
        );
      }
    }
  }

  // Realistic weather-worn patina pass: micro-pitting, hairline fractures, sandy dust & mortar lichen
  for (let i = 0; i < 2400; i++) {
    const px = ((i * 397 + 19) % 1024);
    const py = ((i * 613 + 47) % 1024);
    const sz = 1 + (i % 3);
    const isLight = i % 3 === 0;
    cmCtx.fillStyle = isLight ? 'rgba(246, 241, 232, 0.16)' : 'rgba(64, 56, 48, 0.14)';
    cmCtx.fillRect(px, py, sz, sz);
    if (i % 4 === 0) {
      cmHCtx.fillStyle = isLight ? 'rgba(220,220,220,0.18)' : 'rgba(58,58,58,0.28)';
      cmHCtx.fillRect(px, py, sz + 1, sz + 1);
      cmRCtx.fillStyle = 'rgba(228,228,228,0.22)';
      cmRCtx.fillRect(px, py, sz + 1, sz + 1);
    }
  }
  // Subtle damp moss/lichen specks along mortar seams (every 256px bay edge)
  for (let i = 0; i < 160; i++) {
    const seamX = ((i % 4) * 256 + ((i * 53) % 16) - 8 + 1024) % 1024;
    const seamY = ((i * 193) % 1024);
    cmCtx.fillStyle = 'rgba(72, 86, 52, 0.28)';
    cmCtx.beginPath();
    cmCtx.arc(seamX, seamY, 2 + (i % 3), 0, Math.PI * 2);
    cmCtx.fill();
  }
  // Hairline stone weathering cracks
  cmCtx.strokeStyle = 'rgba(56, 49, 42, 0.36)';
  cmCtx.lineWidth = 1.25;
  cmHCtx.strokeStyle = 'rgba(42, 42, 42, 0.6)';
  cmHCtx.lineWidth = 1.6;
  for (let cIdx = 0; cIdx < 24; cIdx++) {
    const fx = ((cIdx * 173 + 64) % 940) + 42;
    const fy = ((cIdx * 281 + 52) % 940) + 42;
    for (const targetCtx of [cmCtx, cmHCtx]) {
      targetCtx.beginPath();
      targetCtx.moveTo(fx, fy);
      let cxp = fx;
      let cyp = fy;
      for (let s = 0; s < 5; s++) {
        cxp += (((cIdx * 37 + s * 71) % 28) - 14);
        cyp += (((cIdx * 53 + s * 43) % 28) - 14);
        targetCtx.lineTo(cxp, cyp);
      }
      targetCtx.stroke();
    }
  }

  const courtyardMandalaMap = reg(cmC, true, 5, 4, false);
  const courtyardMandalaNormal = reg(heightToNormalCanvas(cmHC, 2.7), false, 5, 4, false);
  const courtyardMandalaRough = reg(cmRC, false, 5, 4, false);
  const courtyardMandalaAo = reg(heightToAoCanvas(cmHC, 4, 1.8), false, 5, 4, false);

  // 7a. Central Sacred 16-Petal Ashtadala Carved Stone Lotus Medallion (1024x1024 flush inlay at ~91 px/m)
  const [medC, medCtx] = makeCanvas(1024, 1024);
  const [medHC, medHCtx] = makeCanvas(1024, 1024);
  const [medRC, medRCtx] = makeCanvas(1024, 1024);
  medCtx.clearRect(0, 0, 1024, 1024);
  medHCtx.fillStyle = '#484848';
  medHCtx.fillRect(0, 0, 1024, 1024);
  medRCtx.fillStyle = '#dcdcdc';
  medRCtx.fillRect(0, 0, 1024, 1024);

  medCtx.save();
  medCtx.beginPath();
  medCtx.arc(512, 512, 492, 0, Math.PI * 2);
  medCtx.clip();

  // Base dressed Makrana limestone backing inside circle
  medCtx.fillStyle = '#cfc6b4';
  medCtx.fillRect(0, 0, 1024, 1024);

  medHCtx.fillStyle = '#b8b8b8';
  medHCtx.beginPath();
  medHCtx.arc(512, 512, 492, 0, Math.PI * 2);
  medHCtx.fill();
  medRCtx.fillStyle = '#929292';
  medRCtx.beginPath();
  medRCtx.arc(512, 512, 492, 0, Math.PI * 2);
  medRCtx.fill();

  medCtx.save();
  medCtx.translate(512, 512);
  medHCtx.save();
  medHCtx.translate(512, 512);

  // Outer dressed limestone perimeter curb (32 jointed coping stones) grounding circle into tile grid
  for (let seg = 0; seg < 32; seg++) {
    const a0 = (seg / 32) * Math.PI * 2;
    const a1 = ((seg + 1) / 32) * Math.PI * 2;
    medCtx.fillStyle = seg % 2 === 0 ? '#c4baaa' : '#bbb09f';
    medCtx.beginPath();
    medCtx.arc(0, 0, 491, a0 + 0.004, a1 - 0.004);
    medCtx.arc(0, 0, 464, a1 - 0.004, a0 + 0.004, true);
    medCtx.closePath();
    medCtx.fill();
    medCtx.strokeStyle = 'rgba(72, 64, 54, 0.62)';
    medCtx.lineWidth = 2.5;
    medCtx.stroke();

    medHCtx.fillStyle = '#cecece';
    medHCtx.beginPath();
    medHCtx.arc(0, 0, 491, a0 + 0.004, a1 - 0.004);
    medHCtx.arc(0, 0, 464, a1 - 0.004, a0 + 0.004, true);
    medHCtx.closePath();
    medHCtx.fill();
  }

  // Carved muted slate-teal ring (24 jointed stones) & weathered terracotta inner ring
  for (let seg = 0; seg < 24; seg++) {
    const a0 = (seg / 24) * Math.PI * 2;
    const a1 = ((seg + 1) / 24) * Math.PI * 2;
    medCtx.fillStyle = seg % 2 === 0 ? '#5b7577' : '#657f81';
    medCtx.beginPath();
    medCtx.arc(0, 0, 461, a0 + 0.008, a1 - 0.008);
    medCtx.arc(0, 0, 412, a1 - 0.008, a0 + 0.008, true);
    medCtx.closePath();
    medCtx.fill();
    medCtx.strokeStyle = 'rgba(68, 60, 50, 0.62)';
    medCtx.lineWidth = 2.8;
    medCtx.stroke();
  }
  medCtx.strokeStyle = '#9c6855';
  medCtx.lineWidth = 12;
  medCtx.beginPath();
  medCtx.arc(0, 0, 392, 0, Math.PI * 2);
  medCtx.stroke();

  // 16 Carved Stone Lotus Petals with muted mineral pigments & chiseled bevel edges
  for (let p = 0; p < 16; p++) {
    const a = (p / 16) * Math.PI * 2;
    medCtx.save();
    medCtx.rotate(a);
    medCtx.fillStyle = p % 2 === 0 ? '#9f6a56' : '#597476';
    medCtx.beginPath();
    medCtx.moveTo(0, -110);
    medCtx.quadraticCurveTo(68, -250, 0, -374);
    medCtx.quadraticCurveTo(-68, -250, 0, -110);
    medCtx.closePath();
    medCtx.fill();
    medCtx.strokeStyle = 'rgba(242, 236, 224, 0.32)';
    medCtx.lineWidth = 3;
    medCtx.stroke();
    medCtx.restore();

    medHCtx.save();
    medHCtx.rotate(a);
    medHCtx.fillStyle = '#d6d6d6';
    medHCtx.beginPath();
    medHCtx.moveTo(0, -110);
    medHCtx.quadraticCurveTo(68, -250, 0, -374);
    medHCtx.quadraticCurveTo(-68, -250, 0, -110);
    medHCtx.closePath();
    medHCtx.fill();
    medHCtx.strokeStyle = '#4c4c4c';
    medHCtx.lineWidth = 4;
    medHCtx.stroke();
    medHCtx.restore();

    // Radial stone slab joint line between petals
    const ja = a + Math.PI / 16;
    medCtx.strokeStyle = 'rgba(72, 64, 54, 0.56)';
    medCtx.lineWidth = 2.8;
    medCtx.beginPath();
    medCtx.moveTo(Math.cos(ja) * 124, Math.sin(ja) * 124);
    medCtx.lineTo(Math.cos(ja) * 412, Math.sin(ja) * 412);
    medCtx.stroke();
    medHCtx.strokeStyle = '#404040';
    medHCtx.lineWidth = 3.5;
    medHCtx.beginPath();
    medHCtx.moveTo(Math.cos(ja) * 124, Math.sin(ja) * 124);
    medHCtx.lineTo(Math.cos(ja) * 412, Math.sin(ja) * 412);
    medHCtx.stroke();
  }

  // Inner weathered ochre-sandstone ring & carved ivory limestone medallion
  medCtx.fillStyle = '#ae8c5a';
  medCtx.beginPath();
  medCtx.arc(0, 0, 126, 0, Math.PI * 2);
  medCtx.fill();
  medCtx.fillStyle = '#d4cbb8';
  medCtx.beginPath();
  medCtx.arc(0, 0, 84, 0, Math.PI * 2);
  medCtx.fill();

  medHCtx.restore();
  medCtx.restore();

  // Real Makrana stone veining & weathering patina overlaid across ALL medallion petals & slabs
  for (let ty = 0; ty < 4; ty++) {
    for (let tx = 0; tx < 4; tx++) {
      medCtx.globalAlpha = 0.28;
      medCtx.drawImage(makranaTile, tx * 256, ty * 256);
    }
  }
  medCtx.globalAlpha = 1;
  for (let i = 0; i < 1800; i++) {
    const px = (i * 419 + 31) % 1024;
    const py = (i * 577 + 67) % 1024;
    medCtx.fillStyle = i % 2 === 0 ? 'rgba(64, 56, 48, 0.14)' : 'rgba(246, 240, 230, 0.14)';
    medCtx.fillRect(px, py, 2, 2);
  }
  medCtx.restore();

  const courtyardMedallionMap = reg(medC, true, 1, 1, true);
  const courtyardMedallionNormal = reg(heightToNormalCanvas(medHC, 2.3), false, 1, 1, true);
  const courtyardMedallionRough = reg(medRC, false, 1, 1, true);
  const courtyardMedallionAo = reg(heightToAoCanvas(medHC, 4, 1.75), false, 1, 1, true);

  // 7b. Seamless 512x512 Weather-Worn Nepali Diamond-Border Flagstone Walkway Texture (Parikrama verandas & thresholds)
  const [fsC, fsCtx] = makeCanvas(512, 512);
  const [fsHC, fsHCtx] = makeCanvas(512, 512);
  const [fsRC, fsRCtx] = makeCanvas(512, 512);
  fsCtx.fillStyle = '#60574c';
  fsCtx.fillRect(0, 0, 512, 512);
  fsHCtx.fillStyle = '#383838';
  fsHCtx.fillRect(0, 0, 512, 512);
  fsRCtx.fillStyle = '#ececec';
  fsRCtx.fillRect(0, 0, 512, 512);

  for (let row = 0; row < 8; row++) {
    const y = row * 64;
    const off = (row % 2) * 64;
    for (let col = -1; col <= 4; col++) {
      const x = col * 128 + off;
      const h = ((col + 4) * 61 + row * 89) & 255;
      const tone = 190 + (h % 26);
      const sw = 123;
      const sh = 59;
      fsCtx.save();
      fsCtx.beginPath();
      fsCtx.rect(x + 2, y + 2, sw, sh);
      fsCtx.clip();
      fsCtx.fillStyle = `rgb(${tone}, ${tone - 8}, ${tone - 18})`;
      fsCtx.fillRect(x + 2, y + 2, sw, sh);
      fsCtx.globalAlpha = 0.36;
      fsCtx.drawImage(makranaTile, x - ((h * 5) % 128), y - ((h * 9) % 128));
      fsCtx.globalAlpha = 1;
      // Subtle inset Nepali diamond motif on alternate slabs
      if ((row + col) % 2 === 0) {
        const dcx = x + 2 + sw * 0.5;
        const dcy = y + 2 + sh * 0.5;
        fsCtx.strokeStyle = 'rgba(116, 98, 82, 0.34)';
        fsCtx.lineWidth = 1.6;
        fsCtx.beginPath();
        fsCtx.moveTo(dcx, dcy - 14);
        fsCtx.lineTo(dcx + 20, dcy);
        fsCtx.lineTo(dcx, dcy + 14);
        fsCtx.lineTo(dcx - 20, dcy);
        fsCtx.closePath();
        fsCtx.stroke();
      }
      fsCtx.strokeStyle = 'rgba(248, 243, 234, 0.36)';
      fsCtx.lineWidth = 2;
      fsCtx.strokeRect(x + 3, y + 3, sw - 2, sh - 2);
      fsCtx.restore();

      const hv = 186 + (h % 30);
      fsHCtx.fillStyle = `rgb(${hv},${hv},${hv})`;
      fsHCtx.fillRect(x + 4, y + 4, sw - 4, sh - 4);
      const rv = 148 + (h % 38);
      fsRCtx.fillStyle = `rgb(${rv},${rv},${rv})`;
      fsRCtx.fillRect(x + 3, y + 3, sw - 2, sh - 2);
    }
  }
  for (let i = 0; i < 650; i++) {
    const px = (i * 223 + 17) % 512;
    const py = (i * 331 + 29) % 512;
    fsCtx.fillStyle = i % 5 === 0 ? 'rgba(72, 86, 52, 0.24)' : 'rgba(64, 56, 48, 0.14)';
    fsCtx.fillRect(px, py, 2, 2);
  }
  const flagstoneMap = reg(fsC, true, 1, 1);
  const flagstoneNormal = reg(heightToNormalCanvas(fsHC, 2.3), false, 1, 1);
  const flagstoneRough = reg(fsRC, false, 1, 1);
  const flagstoneAo = reg(heightToAoCanvas(fsHC, 3, 1.75), false, 1, 1);

  // 7c. Embossed Spun Copper-Brass Prayer Wheel Barrel PBR Maps (512x512)
  const [pwC, pwCtx] = makeCanvas(512, 512);
  const [pwHC, pwHCtx] = makeCanvas(512, 512);
  const [pwRC, pwRCtx] = makeCanvas(512, 512);

  const pwGrad = pwCtx.createLinearGradient(0, 0, 512, 0);
  pwGrad.addColorStop(0, '#966820');
  pwGrad.addColorStop(0.25, '#cfa03c');
  pwGrad.addColorStop(0.5, '#e2b856');
  pwGrad.addColorStop(0.75, '#cfa03c');
  pwGrad.addColorStop(1, '#966820');
  pwCtx.fillStyle = pwGrad;
  pwCtx.fillRect(0, 0, 512, 512);
  pwHCtx.fillStyle = '#888888';
  pwHCtx.fillRect(0, 0, 512, 512);
  pwRCtx.fillStyle = '#5c5c5c'; // polished brass ~0.36 roughness
  pwRCtx.fillRect(0, 0, 512, 512);

  // Top & bottom crimson-lacquer & copper collar bands
  for (const [by, bh, col] of [
    [0, 52, '#6b1c18'],
    [52, 22, '#d8aa44'],
    [438, 22, '#d8aa44'],
    [460, 52, '#6b1c18'],
  ] as Array<[number, number, string]>) {
    pwCtx.fillStyle = col;
    pwCtx.fillRect(0, by, 512, bh);
  }
  pwHCtx.fillStyle = '#dcdcdc';
  pwHCtx.fillRect(0, 48, 512, 28);
  pwHCtx.fillRect(0, 436, 512, 28);
  pwRCtx.fillStyle = '#a4a4a4';
  pwRCtx.fillRect(0, 0, 512, 52);
  pwRCtx.fillRect(0, 460, 512, 52);

  // Beaded brass rivets & embossed sacred mantra/medallion reliefs around barrel
  for (let i = 0; i < 16; i++) {
    const cx = i * 32 + 16;
    for (const ry of [63, 449]) {
      pwCtx.fillStyle = '#f2d072';
      pwCtx.beginPath();
      pwCtx.arc(cx, ry, 6, 0, Math.PI * 2);
      pwCtx.fill();
      pwHCtx.fillStyle = '#ffffff';
      pwHCtx.beginPath();
      pwHCtx.arc(cx, ry, 6, 0, Math.PI * 2);
      pwHCtx.fill();
    }
    // Stylized embossed sacred script glyph & central Dharmachakra lotus motif
    if (i % 2 === 0) {
      const mx = cx + 16;
      pwCtx.strokeStyle = '#6d4710';
      pwCtx.lineWidth = 4;
      pwCtx.strokeRect(mx - 18, 128, 36, 256);
      pwCtx.fillStyle = '#f3d274';
      pwCtx.beginPath();
      pwCtx.arc(mx, 256, 18, 0, Math.PI * 2);
      pwCtx.fill();
      pwCtx.fillStyle = '#7e251c';
      pwCtx.beginPath();
      pwCtx.arc(mx, 256, 8, 0, Math.PI * 2);
      pwCtx.fill();

      pwHCtx.fillStyle = '#f4f4f4';
      pwHCtx.fillRect(mx - 12, 148, 24, 216);
      pwHCtx.beginPath();
      pwHCtx.arc(mx, 256, 20, 0, Math.PI * 2);
      pwHCtx.fill();
      pwRCtx.fillStyle = '#383838';
      pwRCtx.beginPath();
      pwRCtx.arc(mx, 256, 20, 0, Math.PI * 2);
      pwRCtx.fill();
    }
  }
  const prayerWheelMap = reg(pwC, true, 1, 1);
  const prayerWheelNormal = reg(heightToNormalCanvas(pwHC, 2.8), false, 1, 1);
  const prayerWheelRough = reg(pwRC, false, 1, 1);

  // 8. Jewel-Toned Colored Stained-Glass Arch Window Lattice (Janaki Mandir signature feature)
  const [sgC, sgCtx] = makeCanvas(256, 256);
  sgCtx.fillStyle = '#181412';
  sgCtx.fillRect(0, 0, 256, 256);
  const glassColors = ['#b8322f', '#247a5e', '#265c96', '#d68b22', '#87367d'];
  const cell = 32;
  for (let y = 16; y < 240; y += cell) {
    for (let x = 16; x < 240; x += cell) {
      const gi = (Math.floor(x / cell) * 3 + Math.floor(y / cell) * 5) % glassColors.length;
      sgCtx.fillStyle = glassColors[gi];
      sgCtx.fillRect(x + 3, y + 3, cell - 6, cell - 6);
    }
  }
  // Ornate arch mullion ribs
  sgCtx.strokeStyle = '#d6c5a3';
  sgCtx.lineWidth = 6;
  sgCtx.strokeRect(10, 10, 236, 236);
  for (let x = 48; x < 236; x += 32) {
    sgCtx.beginPath();
    sgCtx.moveTo(x, 12);
    sgCtx.lineTo(x, 244);
    sgCtx.stroke();
  }
  const stainedGlassArchMap = reg(sgC, true, 1, 1, true);

  // 9. Intricate Mithila / Madhubani Bhitti-Chitra Heritage Mural Fresco (512x256)
  const [mmC, mmCtx] = makeCanvas(512, 256);
  const plasterGrad = mmCtx.createLinearGradient(0, 0, 0, 256);
  plasterGrad.addColorStop(0, '#eae0cb');
  plasterGrad.addColorStop(0.5, '#e3d6be');
  plasterGrad.addColorStop(1, '#dacab0');
  mmCtx.fillStyle = plasterGrad;
  mmCtx.fillRect(0, 0, 512, 256);

  // Subtle aged lime plaster speckle
  for (let i = 0; i < 420; i++) {
    const px = ((i * 197) % 512);
    const py = ((i * 113) % 256);
    mmCtx.fillStyle = i % 2 === 0 ? 'rgba(130, 108, 78, 0.08)' : 'rgba(255, 250, 240, 0.14)';
    mmCtx.fillRect(px, py, 2 + (i % 3), 2);
  }

  // Traditional Madhubani double-line border with Kachni stepped triangles
  mmCtx.fillStyle = '#8b2920';
  mmCtx.fillRect(0, 0, 512, 14);
  mmCtx.fillRect(0, 242, 512, 14);
  mmCtx.fillStyle = '#20535c';
  mmCtx.fillRect(0, 14, 512, 6);
  mmCtx.fillRect(0, 236, 512, 6);

  mmCtx.strokeStyle = '#8b2920';
  mmCtx.lineWidth = 2;
  mmCtx.strokeRect(16, 28, 480, 200);
  mmCtx.strokeStyle = '#c48926';
  mmCtx.lineWidth = 1.5;
  mmCtx.strokeRect(22, 34, 468, 188);

  // Scalloped border dots & geometric lotus teeth along top & bottom border
  for (let bx = 26; bx <= 486; bx += 16) {
    mmCtx.fillStyle = '#c48926';
    mmCtx.beginPath();
    mmCtx.moveTo(bx, 34);
    mmCtx.lineTo(bx + 8, 43);
    mmCtx.lineTo(bx + 16, 34);
    mmCtx.closePath();
    mmCtx.fill();

    mmCtx.beginPath();
    mmCtx.moveTo(bx, 222);
    mmCtx.lineTo(bx + 8, 213);
    mmCtx.lineTo(bx + 16, 222);
    mmCtx.closePath();
    mmCtx.fill();
  }

  // Symmetrical Mithila Lotus Vine & Sacred Kalasha Fresco Motifs
  const drawMithilaLotus = (cx: number, cy: number, rad: number, petals: number) => {
    // Outer pointed lotus petals
    for (let p = 0; p < petals; p++) {
      const a = (p / petals) * Math.PI * 2;
      mmCtx.save();
      mmCtx.translate(cx, cy);
      mmCtx.rotate(a);
      mmCtx.fillStyle = p % 2 === 0 ? '#a23828' : '#d2932b';
      mmCtx.beginPath();
      mmCtx.moveTo(0, -rad * 0.28);
      mmCtx.quadraticCurveTo(rad * 0.28, -rad * 0.68, 0, -rad);
      mmCtx.quadraticCurveTo(-rad * 0.28, -rad * 0.68, 0, -rad * 0.28);
      mmCtx.fill();
      mmCtx.strokeStyle = '#4e2716';
      mmCtx.lineWidth = 1.2;
      mmCtx.stroke();
      mmCtx.restore();
    }
    // Inner teal rosette & golden pistil
    mmCtx.fillStyle = '#245861';
    mmCtx.beginPath();
    mmCtx.arc(cx, cy, rad * 0.34, 0, Math.PI * 2);
    mmCtx.fill();
    mmCtx.strokeStyle = '#e5b84b';
    mmCtx.lineWidth = 2;
    mmCtx.stroke();
    mmCtx.fillStyle = '#e5b84b';
    mmCtx.beginPath();
    mmCtx.arc(cx, cy, rad * 0.14, 0, Math.PI * 2);
    mmCtx.fill();
  };

  // Central Sacred Purna-Kalasha + Ashtadala Lotus Mandala
  drawMithilaLotus(256, 128, 52, 12);
  // Flanking blooming Mithila Lotuses + graceful Kadamba foliage tendrils
  for (const fx of [118, 394]) {
    drawMithilaLotus(fx, 128, 36, 8);
    // Flowing symmetrical creeper stems
    mmCtx.strokeStyle = '#2b5e36';
    mmCtx.lineWidth = 2.6;
    mmCtx.beginPath();
    mmCtx.moveTo(fx - 52, 165);
    mmCtx.bezierCurveTo(fx - 26, 145, fx - 24, 98, fx, 90);
    mmCtx.bezierCurveTo(fx + 24, 98, fx + 26, 145, fx + 52, 165);
    mmCtx.stroke();

    // Small pointed Madhubani leaves & vermilion buds along vines
    for (const [lx, ly, ang] of [
      [fx - 42, 146, -0.6],
      [fx - 34, 108, -0.35],
      [fx + 34, 108, 0.35],
      [fx + 42, 146, 0.6],
    ] as Array<[number, number, number]>) {
      mmCtx.save();
      mmCtx.translate(lx, ly);
      mmCtx.rotate(ang);
      mmCtx.fillStyle = '#336e3f';
      mmCtx.beginPath();
      mmCtx.ellipse(0, 0, 6, 13, 0, 0, Math.PI * 2);
      mmCtx.fill();
      mmCtx.strokeStyle = '#204528';
      mmCtx.lineWidth = 1;
      mmCtx.stroke();
      mmCtx.restore();
    }
  }

  // Connecting horizontal floral scrollwork across middle band
  for (const cx of [186, 326]) {
    mmCtx.strokeStyle = '#2b5e36';
    mmCtx.lineWidth = 2.2;
    mmCtx.beginPath();
    mmCtx.moveTo(cx - 26, 128);
    mmCtx.quadraticCurveTo(cx, 102, cx + 26, 128);
    mmCtx.quadraticCurveTo(cx, 154, cx - 26, 128);
    mmCtx.stroke();
    mmCtx.fillStyle = '#b4402b';
    mmCtx.beginPath();
    mmCtx.arc(cx, 128, 7, 0, Math.PI * 2);
    mmCtx.fill();
  }
  const mithilaMuralMap = reg(mmC, true, 1, 1, true);

  // 9b. High-Res 1024x1024 Fluted Mughal Makrana Marble Pillar Shaft + Padma Lotus & Khatam Reliefs
  const [pilC, pilCtx] = makeCanvas(1024, 1024);
  const [pilHC, pilHCtx] = makeCanvas(1024, 1024);
  const [pilRC, pilRCtx] = makeCanvas(1024, 1024);

  for (let ty = 0; ty < 1024; ty += 256) {
    for (let tx = 0; tx < 1024; tx += 256) {
      pilCtx.drawImage(makranaTile, tx, ty);
    }
  }
  pilHCtx.fillStyle = '#929292';
  pilHCtx.fillRect(0, 0, 1024, 1024);
  pilRCtx.fillStyle = '#a4a4a4';
  pilRCtx.fillRect(0, 0, 1024, 1024);

  const flutes = 16;
  const fluteW = 1024 / flutes;
  for (let f = 0; f < flutes; f++) {
    const fx = f * fluteW;
    // Convex Mughal shaft reed fluting shading layered over organic Makrana marble veining
    const fg = pilCtx.createLinearGradient(fx, 0, fx + fluteW, 0);
    fg.addColorStop(0, 'rgba(132, 124, 110, 0.62)');
    fg.addColorStop(0.18, 'rgba(226, 220, 208, 0.25)');
    fg.addColorStop(0.5, 'rgba(248, 244, 236, 0.42)');
    fg.addColorStop(0.82, 'rgba(226, 220, 208, 0.25)');
    fg.addColorStop(1, 'rgba(132, 124, 110, 0.62)');
    pilCtx.fillStyle = fg;
    pilCtx.fillRect(fx, 136, fluteW, 744);

    // Subtle inlaid dark slate flute shadow arris line
    pilCtx.fillStyle = 'rgba(108, 100, 88, 0.34)';
    pilCtx.fillRect(fx, 136, 3, 744);

    const fhg = pilHCtx.createLinearGradient(fx, 0, fx + fluteW, 0);
    fhg.addColorStop(0, '#424242');
    fhg.addColorStop(0.5, '#f0f0f0');
    fhg.addColorStop(1, '#424242');
    pilHCtx.fillStyle = fhg;
    pilHCtx.fillRect(fx, 136, fluteW, 744);

    // Honed marble shine on convex ridges, matte stone inside flute grooves
    const frg = pilRCtx.createLinearGradient(fx, 0, fx + fluteW, 0);
    frg.addColorStop(0, '#d6d6d6');
    frg.addColorStop(0.5, '#8c8c8c');
    frg.addColorStop(1, '#d6d6d6');
    pilRCtx.fillStyle = frg;
    pilRCtx.fillRect(fx, 136, fluteW, 744);
  }

  // Mid-shaft carved Mughal floral-ring & kumbha molding band (y = 488..536)
  pilCtx.fillStyle = '#cec5b5';
  pilCtx.fillRect(0, 488, 1024, 48);
  pilCtx.fillStyle = '#265d66';
  pilCtx.fillRect(0, 494, 1024, 8);
  pilCtx.fillRect(0, 522, 1024, 8);
  pilHCtx.fillStyle = '#e4e4e4';
  pilHCtx.fillRect(0, 490, 1024, 44);
  pilRCtx.fillStyle = '#969696';
  pilRCtx.fillRect(0, 490, 1024, 44);
  for (let p = 0; p < flutes; p++) {
    const px = p * fluteW + fluteW * 0.5;
    pilCtx.fillStyle = '#c88c28';
    pilCtx.beginPath();
    pilCtx.moveTo(px, 502);
    pilCtx.lineTo(px + fluteW * 0.24, 512);
    pilCtx.lineTo(px, 522);
    pilCtx.lineTo(px - fluteW * 0.24, 512);
    pilCtx.closePath();
    pilCtx.fill();

    pilHCtx.fillStyle = '#ffffff';
    pilHCtx.beginPath();
    pilHCtx.moveTo(px, 502);
    pilHCtx.lineTo(px + fluteW * 0.24, 512);
    pilHCtx.lineTo(px, 522);
    pilHCtx.lineTo(px - fluteW * 0.24, 512);
    pilHCtx.closePath();
    pilHCtx.fill();
  }

  // Upper Mughal Padma (Inverted Lotus Petal) & Khatam Chevron Collar (y = 0..140)
  pilCtx.fillStyle = '#265d66';
  pilCtx.fillRect(0, 0, 1024, 40);
  pilCtx.fillStyle = '#a34b30';
  pilCtx.fillRect(0, 40, 1024, 28);
  pilCtx.fillStyle = '#c8942a';
  pilCtx.fillRect(0, 68, 1024, 14);
  pilCtx.fillStyle = '#cfc5b4';
  pilCtx.fillRect(0, 82, 1024, 54);
  pilHCtx.fillStyle = '#dcdcdc';
  pilHCtx.fillRect(0, 0, 1024, 132);
  pilHCtx.fillStyle = '#484848';
  pilHCtx.fillRect(0, 132, 1024, 8);
  pilRCtx.fillStyle = '#b4b4b4';
  pilRCtx.fillRect(0, 0, 1024, 136);

  for (let p = 0; p < flutes; p++) {
    const px = p * fluteW + fluteW * 0.5;
    // Upper downward lotus petals
    pilCtx.fillStyle = '#dfd7c8';
    pilCtx.strokeStyle = '#7c705e';
    pilCtx.lineWidth = 3;
    pilCtx.beginPath();
    pilCtx.moveTo(px - fluteW * 0.42, 82);
    pilCtx.quadraticCurveTo(px, 146, px + fluteW * 0.42, 82);
    pilCtx.closePath();
    pilCtx.fill();
    pilCtx.stroke();

    pilCtx.fillStyle = '#a34b30';
    pilCtx.beginPath();
    pilCtx.moveTo(px - fluteW * 0.16, 86);
    pilCtx.quadraticCurveTo(px, 124, px + fluteW * 0.16, 86);
    pilCtx.closePath();
    pilCtx.fill();

    pilHCtx.fillStyle = '#f2f2f2';
    pilHCtx.beginPath();
    pilHCtx.moveTo(px - fluteW * 0.42, 82);
    pilHCtx.quadraticCurveTo(px, 146, px + fluteW * 0.42, 82);
    pilHCtx.closePath();
    pilHCtx.fill();
  }

  // Lower Mughal Acanthus-Lotus Plinth Collar & Pietra Dura Base Band (y = 880..1024)
  pilCtx.fillStyle = '#265d66';
  pilCtx.fillRect(0, 956, 1024, 68);
  pilCtx.fillStyle = '#a34b30';
  pilCtx.fillRect(0, 922, 1024, 34);
  pilCtx.fillStyle = '#cfc5b4';
  pilCtx.fillRect(0, 880, 1024, 42);
  pilRCtx.fillStyle = '#b8b8b8';
  pilRCtx.fillRect(0, 880, 1024, 144);

  for (let p = 0; p < flutes; p++) {
    const px = p * fluteW + fluteW * 0.5;
    pilCtx.fillStyle = '#e2dacb';
    pilCtx.strokeStyle = '#7c705e';
    pilCtx.lineWidth = 3;
    pilCtx.beginPath();
    pilCtx.moveTo(px - fluteW * 0.42, 922);
    pilCtx.quadraticCurveTo(px, 846, px + fluteW * 0.42, 922);
    pilCtx.closePath();
    pilCtx.fill();
    pilCtx.stroke();

    pilCtx.fillStyle = '#d49a2a';
    pilCtx.beginPath();
    pilCtx.moveTo(px - fluteW * 0.16, 916);
    pilCtx.quadraticCurveTo(px, 872, px + fluteW * 0.16, 916);
    pilCtx.closePath();
    pilCtx.fill();

    pilHCtx.fillStyle = '#f0f0f0';
    pilHCtx.beginPath();
    pilHCtx.moveTo(px - fluteW * 0.42, 922);
    pilHCtx.quadraticCurveTo(px, 846, px + fluteW * 0.42, 922);
    pilHCtx.closePath();
    pilHCtx.fill();
  }
  const pillarCarvedMap = reg(pilC, true, 1, 1);
  const pillarCarvedNormal = reg(heightToNormalCanvas(pilHC, 2.7), false, 1, 1);
  const pillarCarvedRough = reg(pilRC, false, 1, 1);
  const pillarCarvedAo = reg(heightToAoCanvas(pilHC, 4, 1.7), false, 1, 1);

  // 10. Carved Mithila Teakwood Double-Leaf Chamber Door + Brass Rosette Studs
  const [drC, drCtx] = makeCanvas(256, 512);
  const [drHC, drHCtx] = makeCanvas(256, 512);
  drCtx.fillStyle = '#4e311a';
  drCtx.fillRect(0, 0, 256, 512);
  drHCtx.fillStyle = '#909090';
  drHCtx.fillRect(0, 0, 256, 512);

  // Subtle vertical wood grain
  for (let x = 0; x < 256; x += 4) {
    const tone = ((x * 23) % 16) - 8;
    drCtx.fillStyle = `rgba(${78 + tone}, ${48 + Math.floor(tone * 0.6)}, ${26 + Math.floor(tone * 0.4)}, 0.45)`;
    drCtx.fillRect(x, 0, 3, 512);
  }
  // Outer jamb rail + central meeting stile
  drCtx.fillStyle = '#331e0e';
  drCtx.fillRect(123, 0, 10, 512);
  drHCtx.fillStyle = '#242424';
  drHCtx.fillRect(124, 0, 8, 512);

  // 2 leaves × 4 coffered carved panels + brass bosses
  for (let leaf = 0; leaf < 2; leaf++) {
    const lx = leaf === 0 ? 18 : 142;
    const lw = 96;
    for (let row = 0; row < 4; row++) {
      const py = 24 + row * 118;
      const ph = 98;
      // Outer carved frame bevel
      drCtx.strokeStyle = '#6c4424';
      drCtx.lineWidth = 6;
      drCtx.strokeRect(lx, py, lw, ph);
      drHCtx.strokeStyle = '#e2e2e2';
      drHCtx.lineWidth = 6;
      drHCtx.strokeRect(lx, py, lw, ph);

      // Recessed coffer interior
      drCtx.fillStyle = '#3a2210';
      drCtx.fillRect(lx + 8, py + 8, lw - 16, ph - 16);
      drHCtx.fillStyle = '#484848';
      drHCtx.fillRect(lx + 8, py + 8, lw - 16, ph - 16);

      // Inner carved diamond motif + brass lotus stud
      const cx = lx + lw * 0.5;
      const cy = py + ph * 0.5;
      drCtx.strokeStyle = '#784c28';
      drCtx.lineWidth = 3;
      drCtx.beginPath();
      drCtx.moveTo(cx, py + 16);
      drCtx.lineTo(lx + lw - 16, cy);
      drCtx.lineTo(cx, py + ph - 16);
      drCtx.lineTo(lx + 16, cy);
      drCtx.closePath();
      drCtx.stroke();

      drCtx.fillStyle = '#c9942a';
      drCtx.beginPath();
      drCtx.arc(cx, cy, 8, 0, Math.PI * 2);
      drCtx.fill();
      drHCtx.fillStyle = '#f5f5f5';
      drHCtx.beginPath();
      drHCtx.arc(cx, cy, 8, 0, Math.PI * 2);
      drHCtx.fill();
    }
  }
  const carvedDoorMap = reg(drC, true, 1, 1, true);
  const carvedDoorNormal = reg(heightToNormalCanvas(drHC, 2.7), false, 1, 1, true);

  // =========================================================================
  // 11. REALISTIC COURTYARD GARDEN PBR TEXTURES (Loam Soil, Urns, Alpha-Cutout Foliage)
  // =========================================================================

  // 11a. Damp Temple Garden Loam, Humus & Pebble Soil (512x512)
  const [slC, slCtx] = makeCanvas(512, 512);
  const [slHC, slHCtx] = makeCanvas(512, 512);
  const [slRC, slRCtx] = makeCanvas(512, 512);
  slCtx.fillStyle = '#382a1e';
  slCtx.fillRect(0, 0, 512, 512);
  slHCtx.fillStyle = '#7a7a7a';
  slHCtx.fillRect(0, 0, 512, 512);
  slRCtx.fillStyle = '#e8e8e8';
  slRCtx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 4800; i++) {
    const x = (i * 193 + (i % 29) * 37) % 512;
    const y = (i * 277 + (i % 23) * 41) % 512;
    const rad = 1.2 + (i % 5) * 0.85;
    const h = (i * 67) & 255;
    if (h % 19 === 0) {
      // Tiny river sand / limestone grit fleck
      slCtx.fillStyle = 'rgba(136, 122, 102, 0.52)';
      slHCtx.fillStyle = '#c8c8c8';
    } else if (h % 23 === 0) {
      // Fallen dried marigold / moss organic speck
      slCtx.fillStyle = h % 2 === 0 ? 'rgba(64, 86, 40, 0.45)' : 'rgba(156, 98, 32, 0.36)';
      slHCtx.fillStyle = '#9c9c9c';
    } else {
      const lum = 34 + (h % 34);
      slCtx.fillStyle = `rgb(${lum + 14}, ${lum + 3}, ${Math.max(12, lum - 8)})`;
      const hv = 85 + (h % 95);
      slHCtx.fillStyle = `rgb(${hv},${hv},${hv})`;
    }
    slCtx.beginPath();
    slCtx.arc(x, y, rad, 0, Math.PI * 2);
    slCtx.fill();
    slHCtx.beginPath();
    slHCtx.arc(x, y, rad, 0, Math.PI * 2);
    slHCtx.fill();
  }
  const soilLoamMap = reg(slC, true, 2, 2);
  const soilLoamNormal = reg(heightToNormalCanvas(slHC, 2.5), false, 2, 2);
  const soilLoamRough = reg(slRC, false, 2, 2);

  // 11b. Hand-Thrown Kiln-Fired Terracotta & Carved Mithila Urn Glaze (512x512)
  const [tuC, tuCtx] = makeCanvas(512, 512);
  const [tuHC, tuHCtx] = makeCanvas(512, 512);
  const [tuRC, tuRCtx] = makeCanvas(512, 512);
  tuCtx.fillStyle = '#9c4c32';
  tuCtx.fillRect(0, 0, 512, 512);
  tuHCtx.fillStyle = '#888888';
  tuHCtx.fillRect(0, 0, 512, 512);
  tuRCtx.fillStyle = '#c6c6c6';
  tuRCtx.fillRect(0, 0, 512, 512);

  // Subtle horizontal potter's wheel striations & mineral kiln patina
  for (let y = 0; y < 512; y += 4) {
    const w = Math.sin(y * 0.12) * 8 + ((y * 19) % 9) - 4;
    tuCtx.fillStyle = `rgb(${Math.round(158 + w)}, ${Math.round(78 + w * 0.55)}, ${Math.round(52 + w * 0.4)})`;
    tuCtx.fillRect(0, y, 512, 4);
    const hv = Math.round(132 + Math.sin(y * 0.18) * 18);
    tuHCtx.fillStyle = `rgb(${hv},${hv},${hv})`;
    tuHCtx.fillRect(0, y, 512, 4);
  }
  // Carved Mughal lotus-flute relief ring around vessel belly
  for (let i = 0; i < 16; i++) {
    const cx = i * 32 + 16;
    tuCtx.fillStyle = 'rgba(222, 186, 152, 0.28)';
    tuCtx.beginPath();
    tuCtx.moveTo(cx - 12, 260);
    tuCtx.quadraticCurveTo(cx, 198, cx + 12, 260);
    tuCtx.closePath();
    tuCtx.fill();
    tuHCtx.fillStyle = '#e0e0e0';
    tuHCtx.beginPath();
    tuHCtx.moveTo(cx - 12, 260);
    tuHCtx.quadraticCurveTo(cx, 198, cx + 12, 260);
    tuHCtx.closePath();
    tuHCtx.fill();
  }
  const terracottaUrnMap = reg(tuC, true, 1, 1);
  const terracottaUrnNormal = reg(heightToNormalCanvas(tuHC, 2.2), false, 1, 1);
  const terracottaUrnRough = reg(tuRC, false, 1, 1);

  // Helper to paint an organic veined leaf blade onto both Color and Height canvases
  const paintBotanicalLeaf = (
    cCtx: CanvasRenderingContext2D,
    hCtx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    len: number,
    width: number,
    r: number,
    g: number,
    b: number,
    veinColor: string,
    serrated = false,
  ) => {
    const drawShape = (ctx: CanvasRenderingContext2D) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      if (serrated) {
        const steps = 6;
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          const profile = Math.sin(t * Math.PI) * width * (1 - t * 0.15);
          const notch = s < steps ? 3.2 : 0;
          ctx.lineTo(profile + notch, -len * (t - 0.04));
          ctx.lineTo(profile * 0.86, -len * t);
        }
        for (let s = steps - 1; s >= 1; s--) {
          const t = s / steps;
          const profile = Math.sin(t * Math.PI) * width * (1 - t * 0.15);
          ctx.lineTo(-profile * 0.86, -len * t);
          ctx.lineTo(-profile - 3.2, -len * (t - 0.04));
        }
      } else {
        ctx.bezierCurveTo(width * 0.95, -len * 0.25, width * 0.72, -len * 0.78, 0, -len);
        ctx.bezierCurveTo(-width * 0.72, -len * 0.78, -width * 0.95, -len * 0.25, 0, 0);
      }
      ctx.closePath();
      ctx.restore();
    };

    // Color leaf with natural longitudinal sun gradient
    drawShape(cCtx);
    cCtx.save();
    cCtx.translate(x, y);
    cCtx.rotate(angle);
    const grad = cCtx.createLinearGradient(0, 0, 0, -len);
    grad.addColorStop(0, `rgb(${Math.round(r * 0.78)}, ${Math.round(g * 0.82)}, ${Math.round(b * 0.78)})`);
    grad.addColorStop(0.55, `rgb(${r}, ${g}, ${b})`);
    grad.addColorStop(1, `rgb(${Math.min(255, r + 24)}, ${Math.min(255, g + 26)}, ${Math.min(255, b + 14)})`);
    cCtx.fillStyle = grad;
    cCtx.fill();
    // Central midrib & lateral secondary veins
    cCtx.strokeStyle = veinColor;
    cCtx.lineWidth = Math.max(1.2, width * 0.075);
    cCtx.beginPath();
    cCtx.moveTo(0, 0);
    cCtx.lineTo(0, -len * 0.92);
    cCtx.stroke();
    cCtx.lineWidth = Math.max(0.8, width * 0.042);
    for (let v = 1; v <= 4; v++) {
      const vt = v / 5;
      const vy = -len * vt;
      const vw = Math.sin(vt * Math.PI) * width * 0.65;
      cCtx.beginPath();
      cCtx.moveTo(0, vy);
      cCtx.quadraticCurveTo(vw * 0.5, vy - len * 0.06, vw, vy - len * 0.12);
      cCtx.moveTo(0, vy);
      cCtx.quadraticCurveTo(-vw * 0.5, vy - len * 0.06, -vw, vy - len * 0.12);
      cCtx.stroke();
    }
    cCtx.restore();

    // Height leaf for normal map relief (raised lamina, recessed midrib & margin)
    drawShape(hCtx);
    hCtx.fillStyle = '#c8c8c8';
    hCtx.fill();
    hCtx.save();
    hCtx.translate(x, y);
    hCtx.rotate(angle);
    hCtx.strokeStyle = '#707070';
    hCtx.lineWidth = Math.max(1.4, width * 0.08);
    hCtx.beginPath();
    hCtx.moveTo(0, 0);
    hCtx.lineTo(0, -len * 0.92);
    hCtx.stroke();
    hCtx.restore();
  };

  // 11c. Sacred Krishna Tulsi Sprig Texture (512x512 alpha cutout + normal map)
  const [tlC, tlCtx] = makeCanvas(512, 512);
  const [tlHC, tlHCtx] = makeCanvas(512, 512);
  tlCtx.clearRect(0, 0, 512, 512);
  tlHCtx.fillStyle = '#787878';
  tlHCtx.fillRect(0, 0, 512, 512);

  // Woody purple-brown branching Tulsi stems
  const tulsiStems: Array<[number, number, number, number, number, number]> = [
    [256, 508, 256, 300, 256, 72],
    [256, 410, 178, 330, 118, 200],
    [256, 390, 338, 310, 394, 192],
    [256, 270, 204, 210, 158, 128],
    [256, 255, 310, 198, 354, 118],
  ];
  for (const [x0, y0, cx, cy, x1, y1] of tulsiStems) {
    tlCtx.strokeStyle = '#53353e';
    tlCtx.lineWidth = 6.5;
    tlCtx.lineCap = 'round';
    tlCtx.beginPath();
    tlCtx.moveTo(x0, y0);
    tlCtx.quadraticCurveTo(cx, cy, x1, y1);
    tlCtx.stroke();

    tlHCtx.strokeStyle = '#e0e0e0';
    tlHCtx.lineWidth = 6.5;
    tlHCtx.beginPath();
    tlHCtx.moveTo(x0, y0);
    tlHCtx.quadraticCurveTo(cx, cy, x1, y1);
    tlHCtx.stroke();
  }
  // Paired opposite serrated Krishna Tulsi leaves along each stem
  const tulsiLeaves: Array<[number, number, number, number, number, number]> = [
    [252, 430, -0.82, 74, 30, 0],
    [260, 424, 0.85, 72, 29, 1],
    [252, 340, -0.78, 78, 31, 0],
    [260, 332, 0.76, 76, 30, 1],
    [252, 236, -0.68, 68, 27, 0],
    [260, 228, 0.65, 68, 27, 1],
    [184, 326, -1.25, 64, 25, 1],
    [152, 265, -0.92, 62, 24, 0],
    [122, 204, -0.58, 56, 22, 1],
    [328, 318, 1.24, 64, 25, 0],
    [362, 256, 0.94, 62, 24, 1],
    [390, 196, 0.56, 56, 22, 0],
    [206, 198, -0.95, 58, 23, 0],
    [164, 134, -0.42, 52, 20, 1],
    [308, 188, 0.95, 58, 23, 1],
    [348, 124, 0.44, 52, 20, 0],
  ];
  for (const [lx, ly, ang, len, wid, alt] of tulsiLeaves) {
    const r = alt === 0 ? 58 : 70;
    const g = alt === 0 ? 96 : 112;
    const b = alt === 0 ? 50 : 54;
    paintBotanicalLeaf(tlCtx, tlHCtx, lx, ly, ang, len, wid, r, g, b, 'rgba(132, 102, 108, 0.75)', true);
  }
  // Delicate purple-magenta Sacred Tulsi Manjari blossom whorls crowning central & side stems
  for (const [mx, my] of [
    [256, 82],
    [256, 108],
    [256, 134],
    [158, 128],
    [354, 118],
  ]) {
    for (let k = -2; k <= 2; k++) {
      tlCtx.fillStyle = k % 2 === 0 ? '#7c456e' : '#9c5d8c';
      tlCtx.beginPath();
      tlCtx.ellipse(mx + k * 5, my + Math.abs(k) * 3, 5.5, 8.5, k * 0.25, 0, Math.PI * 2);
      tlCtx.fill();
      tlHCtx.fillStyle = '#efefef';
      tlHCtx.beginPath();
      tlHCtx.arc(mx + k * 5, my + Math.abs(k) * 3, 6, 0, Math.PI * 2);
      tlHCtx.fill();
    }
  }
  const tulsiLeafMap = reg(tlC, true, 1, 1, true);
  const tulsiLeafNormal = reg(heightToNormalCanvas(tlHC, 2.4), false, 1, 1, true);

  // 11d. Dense Ornamental Temple Shrub Bough Card (Ashoka / Jasmine / Bougainvillea, 512x512 alpha cutout)
  const [sbC, sbCtx] = makeCanvas(512, 512);
  const [sbHC, sbHCtx] = makeCanvas(512, 512);
  sbCtx.clearRect(0, 0, 512, 512);
  sbHCtx.fillStyle = '#787878';
  sbHCtx.fillRect(0, 0, 512, 512);

  // Natural dark woody shrub twigs radiating cleanly from bottom stem
  const shrubTwigs: Array<[number, number, number, number, number, number, number]> = [
    [256, 506, 252, 340, 256, 90, 8],
    [256, 430, 165, 340, 84, 210, 5.5],
    [256, 415, 348, 335, 428, 205, 5.5],
    [252, 310, 178, 230, 124, 128, 4.5],
    [258, 295, 336, 220, 392, 120, 4.5],
    [254, 210, 205, 145, 178, 68, 3.5],
    [258, 205, 305, 140, 334, 65, 3.5],
  ];
  for (const [x0, y0, cx, cy, x1, y1, lw] of shrubTwigs) {
    sbCtx.strokeStyle = '#4e3b28';
    sbCtx.lineWidth = lw;
    sbCtx.lineCap = 'round';
    sbCtx.beginPath();
    sbCtx.moveTo(x0, y0);
    sbCtx.quadraticCurveTo(cx, cy, x1, y1);
    sbCtx.stroke();
    sbHCtx.strokeStyle = '#d4d4d4';
    sbHCtx.lineWidth = lw;
    sbHCtx.beginPath();
    sbHCtx.moveTo(x0, y0);
    sbHCtx.quadraticCurveTo(cx, cy, x1, y1);
    sbHCtx.stroke();
  }
  // 28 layered lanceolate foliage leaves with rich olive-to-emerald chlorophyll tones
  for (let i = 0; i < 28; i++) {
    const h = (i * 71 + 19) & 255;
    const t = i / 27;
    const angle = ((i % 7) - 3) * 0.42 + ((h % 12) - 6) * 0.03;
    const ringR = 52 + ((i * 43) % 156);
    const lx = 256 + Math.sin(angle * 1.15) * ringR * 0.95;
    const ly = 415 - t * 290 - Math.cos(angle) * 28;
    const len = 76 + (h % 38);
    const wid = 24 + (h % 11);
    const tone = i % 3;
    const r = tone === 0 ? 44 : tone === 1 ? 58 : 74;
    const g = tone === 0 ? 78 : tone === 1 ? 98 : 114;
    const b = tone === 0 ? 36 : tone === 1 ? 46 : 52;
    paintBotanicalLeaf(sbCtx, sbHCtx, lx, ly, angle, len, wid, r, g, b, 'rgba(138, 162, 92, 0.55)', false);
  }
  // Subtle creamy-white Chameli jasmine & vermilion temple blossom clusters nestled among upper leaves
  for (const [bx, by, isCream] of [
    [164, 152, true],
    [248, 92, true],
    [344, 148, true],
    [118, 224, false],
    [388, 214, false],
    [282, 168, true],
  ] as Array<[number, number, boolean]>) {
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2;
      sbCtx.fillStyle = isCream ? '#ede6d2' : '#c44638';
      sbCtx.beginPath();
      sbCtx.ellipse(bx + Math.cos(a) * 8, by + Math.sin(a) * 8, 7, 4.5, a, 0, Math.PI * 2);
      sbCtx.fill();
    }
    sbCtx.fillStyle = '#d89b28';
    sbCtx.beginPath();
    sbCtx.arc(bx, by, 4, 0, Math.PI * 2);
    sbCtx.fill();
  }
  const shrubFoliageMap = reg(sbC, true, 1, 1, true);
  const shrubFoliageNormal = reg(heightToNormalCanvas(sbHC, 2.3), false, 1, 1, true);

  // 11e. Nepali Sayapatri (Marigold) Flowering Cluster Texture (512x512 alpha cutout)
  const [mgC, mgCtx] = makeCanvas(512, 512);
  const [mgHC, mgHCtx] = makeCanvas(512, 512);
  mgCtx.clearRect(0, 0, 512, 512);
  mgHCtx.fillStyle = '#787878';
  mgHCtx.fillRect(0, 0, 512, 512);

  // Feathery pinnate marigold stems & leaflets
  const mgStems: Array<[number, number, number, number]> = [
    [256, 504, 256, 138],
    [256, 440, 142, 196],
    [256, 430, 368, 192],
    [256, 360, 186, 128],
    [256, 355, 326, 128],
  ];
  for (const [x0, y0, x1, y1] of mgStems) {
    mgCtx.strokeStyle = '#3d612c';
    mgCtx.lineWidth = 6;
    mgCtx.lineCap = 'round';
    mgCtx.beginPath();
    mgCtx.moveTo(x0, y0);
    mgCtx.lineTo(x1, y1);
    mgCtx.stroke();
    mgHCtx.strokeStyle = '#cfcfcf';
    mgHCtx.lineWidth = 6;
    mgHCtx.beginPath();
    mgHCtx.moveTo(x0, y0);
    mgHCtx.lineTo(x1, y1);
    mgHCtx.stroke();
  }
  for (let i = 0; i < 26; i++) {
    const t = i / 25;
    const ang = ((i % 7) - 3) * 0.45;
    const lx = 256 + Math.sin(ang) * (40 + (i % 4) * 34);
    const ly = 445 - t * 235;
    paintBotanicalLeaf(mgCtx, mgHCtx, lx, ly, ang, 64, 16, 54, 92, 42, 'rgba(116, 148, 76, 0.65)', true);
  }
  // Multi-layered ruffled Sayapatri saffron-gold & burnt-orange flower heads
  for (const [fx, fy, rad, isDeep] of [
    [256, 124, 48, false],
    [142, 188, 38, true],
    [368, 184, 38, false],
    [186, 122, 34, false],
    [326, 124, 34, true],
  ] as Array<[number, number, number, boolean]>) {
    for (let ring = 0; ring < 3; ring++) {
      const petals = 14 - ring * 3;
      const rDist = rad * (0.78 - ring * 0.24);
      for (let p = 0; p < petals; p++) {
        const a = (p / petals) * Math.PI * 2 + ring * 0.35;
        const px = fx + Math.cos(a) * rDist * 0.6;
        const py = fy + Math.sin(a) * rDist * 0.6;
        mgCtx.fillStyle =
          ring === 0
            ? isDeep
              ? '#c85814'
              : '#d97616'
            : ring === 1
              ? isDeep
                ? '#df7a1a'
                : '#eba022'
              : '#f2bc38';
        mgCtx.beginPath();
        mgCtx.arc(px, py, rad * (0.36 - ring * 0.06), 0, Math.PI * 2);
        mgCtx.fill();
        mgHCtx.fillStyle = `rgb(${215 + ring * 16},${215 + ring * 16},${215 + ring * 16})`;
        mgHCtx.beginPath();
        mgHCtx.arc(px, py, rad * (0.36 - ring * 0.06), 0, Math.PI * 2);
        mgHCtx.fill();
      }
    }
  }
  const marigoldMap = reg(mgC, true, 1, 1, true);
  const marigoldNormal = reg(heightToNormalCanvas(mgHC, 2.5), false, 1, 1, true);

  // 11f. Arching Courtyard Ornamental Fern / Cycas Palm Frond Texture (512x512 alpha cutout)
  const [fpC, fpCtx] = makeCanvas(512, 512);
  const [fpHC, fpHCtx] = makeCanvas(512, 512);
  fpCtx.clearRect(0, 0, 512, 512);
  fpHCtx.fillStyle = '#787878';
  fpHCtx.fillRect(0, 0, 512, 512);

  // Tapered olive-gold central rachis spine
  fpCtx.strokeStyle = '#627834';
  fpCtx.lineWidth = 8;
  fpCtx.lineCap = 'round';
  fpCtx.beginPath();
  fpCtx.moveTo(256, 506);
  fpCtx.quadraticCurveTo(254, 260, 256, 22);
  fpCtx.stroke();
  fpHCtx.strokeStyle = '#ececec';
  fpHCtx.lineWidth = 8;
  fpHCtx.beginPath();
  fpHCtx.moveTo(256, 506);
  fpHCtx.quadraticCurveTo(254, 260, 256, 22);
  fpHCtx.stroke();

  const pinnaePairs = 24;
  for (let i = 0; i < pinnaePairs; i++) {
    const t = i / (pinnaePairs - 1);
    const y = 472 - t * 432;
    const span = 216 * Math.sin(Math.pow(1 - t * 0.9, 0.65) * Math.PI * 0.62 + 0.18);
    for (const side of [-1, 1]) {
      const g = 74 + ((i * 13 + (side > 0 ? 11 : 0)) % 36);
      const r = Math.round(g * 0.56);
      const b = Math.round(g * 0.40);
      const grad = fpCtx.createLinearGradient(256, y, 256 + side * span, y - 24);
      grad.addColorStop(0, `rgb(${Math.round(r * 0.8)}, ${Math.round(g * 0.85)}, ${b})`);
      grad.addColorStop(1, `rgb(${r + 16}, ${g + 22}, ${b + 8})`);
      fpCtx.fillStyle = grad;
      fpCtx.beginPath();
      fpCtx.moveTo(256, y);
      fpCtx.quadraticCurveTo(256 + side * span * 0.55, y - 26, 256 + side * span, y - 4);
      fpCtx.quadraticCurveTo(256 + side * span * 0.48, y - 10, 256, y + 8);
      fpCtx.closePath();
      fpCtx.fill();

      fpHCtx.fillStyle = '#cfcfcf';
      fpHCtx.beginPath();
      fpHCtx.moveTo(256, y);
      fpHCtx.quadraticCurveTo(256 + side * span * 0.55, y - 26, 256 + side * span, y - 4);
      fpHCtx.quadraticCurveTo(256 + side * span * 0.48, y - 10, 256, y + 8);
      fpHCtx.closePath();
      fpHCtx.fill();
    }
  }
  const fernPalmMap = reg(fpC, true, 1, 1, true);
  const fernPalmNormal = reg(heightToNormalCanvas(fpHC, 2.2), false, 1, 1, true);

  // 12. Hammered Antique Nepali Brass & Engraved Patina PBR Maps (512x512)
  const [brC, brCtx] = makeCanvas(512, 512);
  const [brHC, brHCtx] = makeCanvas(512, 512);
  const [brRC, brRCtx] = makeCanvas(512, 512);

  const brGrad = brCtx.createLinearGradient(0, 0, 512, 512);
  brGrad.addColorStop(0, '#a87d28');
  brGrad.addColorStop(0.5, '#c79a38');
  brGrad.addColorStop(1, '#986f21');
  brCtx.fillStyle = brGrad;
  brCtx.fillRect(0, 0, 512, 512);
  brHCtx.fillStyle = '#8a8a8a';
  brHCtx.fillRect(0, 0, 512, 512);
  brRCtx.fillStyle = '#5c5c5c'; // ~0.36 satin-burnished antique brass
  brRCtx.fillRect(0, 0, 512, 512);

  // Hand-hammered peen dimples & bronze patina micro-flecks
  for (let i = 0; i < 620; i++) {
    const h = (i * 197 + 43) & 1023;
    const x = (i * 137 + (h % 29)) % 512;
    const y = (i * 223 + (h % 37)) % 512;
    const r = 4 + (h % 9);
    const bright = (h % 18) - 8;
    brCtx.fillStyle = bright >= 0 ? `rgba(235, 198, 108, 0.12)` : `rgba(88, 56, 16, 0.14)`;
    brCtx.beginPath();
    brCtx.arc(x, y, r, 0, Math.PI * 2);
    brCtx.fill();

    const hv = 114 + (h % 38);
    brHCtx.fillStyle = `rgba(${hv},${hv},${hv},0.35)`;
    brHCtx.beginPath();
    brHCtx.arc(x, y, r, 0, Math.PI * 2);
    brHCtx.fill();

    const rv = 76 + (h % 44);
    brRCtx.fillStyle = `rgba(${rv},${rv},${rv},0.35)`;
    brRCtx.beginPath();
    brRCtx.arc(x, y, r, 0, Math.PI * 2);
    brRCtx.fill();
  }

  // Fine lathe-turned horizontal tooling bands & Newari engraved lotus-beading collars
  for (let y = 16; y < 512; y += 32) {
    brCtx.strokeStyle = y % 128 === 16 ? 'rgba(64, 42, 12, 0.34)' : 'rgba(242, 208, 122, 0.14)';
    brCtx.lineWidth = y % 128 === 16 ? 3 : 1.2;
    brCtx.beginPath();
    brCtx.moveTo(0, y);
    brCtx.lineTo(512, y);
    brCtx.stroke();

    brHCtx.strokeStyle = y % 128 === 16 ? '#4e4e4e' : '#b2b2b2';
    brHCtx.lineWidth = y % 128 === 16 ? 3 : 1.2;
    brHCtx.beginPath();
    brHCtx.moveTo(0, y);
    brHCtx.lineTo(512, y);
    brHCtx.stroke();
  }

  const antiqueBrassMap = reg(brC, true, 1, 1);
  const antiqueBrassNormal = reg(heightToNormalCanvas(brHC, 2.0), false, 1, 1);
  const antiqueBrassRough = reg(brRC, false, 1, 1);

  // 13. Soft Warm Candlelight Radial Halo Texture (256x256)
  const [hlC, hlCtx] = makeCanvas(256, 256);
  hlCtx.clearRect(0, 0, 256, 256);
  const hlGrad = hlCtx.createRadialGradient(128, 128, 4, 128, 128, 126);
  hlGrad.addColorStop(0.0, 'rgba(255, 232, 168, 0.85)');
  hlGrad.addColorStop(0.22, 'rgba(255, 184, 78, 0.42)');
  hlGrad.addColorStop(0.55, 'rgba(245, 134, 34, 0.14)');
  hlGrad.addColorStop(1.0, 'rgba(230, 100, 12, 0.0)');
  hlCtx.fillStyle = hlGrad;
  hlCtx.fillRect(0, 0, 256, 256);
  const lanternHaloMap = reg(hlC, true, 1, 1, true);

  // 14. Carved Golden Prabhavali Lotus & Sunburst Sanctum Halo Texture (512x512)
  const [ahC, ahCtx] = makeCanvas(512, 512);
  ahCtx.clearRect(0, 0, 512, 512);
  ahCtx.save();
  ahCtx.translate(256, 256);

  const ahGlow = ahCtx.createRadialGradient(0, 0, 12, 0, 0, 248);
  ahGlow.addColorStop(0.0, 'rgba(68, 12, 12, 0.96)');
  ahGlow.addColorStop(0.36, 'rgba(112, 22, 16, 0.94)');
  ahGlow.addColorStop(0.56, 'rgba(196, 114, 24, 0.88)');
  ahGlow.addColorStop(0.76, 'rgba(248, 198, 92, 0.72)');
  ahGlow.addColorStop(0.92, 'rgba(164, 78, 18, 0.36)');
  ahGlow.addColorStop(1.0, 'rgba(92, 30, 10, 0.0)');
  ahCtx.fillStyle = ahGlow;
  ahCtx.beginPath();
  ahCtx.arc(0, 0, 248, 0, Math.PI * 2);
  ahCtx.fill();

  // 32 delicate engraved sunburst rays framing the outer ring
  for (let r = 0; r < 32; r++) {
    const a = (r / 32) * Math.PI * 2;
    ahCtx.save();
    ahCtx.rotate(a);
    ahCtx.fillStyle = r % 2 === 0 ? 'rgba(255, 228, 148, 0.44)' : 'rgba(255, 194, 82, 0.22)';
    ahCtx.beginPath();
    ahCtx.moveTo(0, -102);
    ahCtx.lineTo(10, -236);
    ahCtx.lineTo(-10, -236);
    ahCtx.closePath();
    ahCtx.fill();
    ahCtx.restore();
  }

  // Concentric 16-petal carved gold lotus mandala ring
  for (let p = 0; p < 16; p++) {
    const a = (p / 16) * Math.PI * 2;
    ahCtx.save();
    ahCtx.rotate(a);
    ahCtx.fillStyle = 'rgba(255, 214, 116, 0.62)';
    ahCtx.strokeStyle = 'rgba(118, 56, 12, 0.72)';
    ahCtx.lineWidth = 2.2;
    ahCtx.beginPath();
    ahCtx.moveTo(0, -108);
    ahCtx.quadraticCurveTo(26, -158, 0, -206);
    ahCtx.quadraticCurveTo(-26, -158, 0, -108);
    ahCtx.closePath();
    ahCtx.fill();
    ahCtx.stroke();
    ahCtx.restore();
  }

  // Inner beaded filigree circles
  ahCtx.strokeStyle = 'rgba(255, 232, 168, 0.82)';
  ahCtx.lineWidth = 3;
  ahCtx.beginPath();
  ahCtx.arc(0, 0, 206, 0, Math.PI * 2);
  ahCtx.stroke();
  ahCtx.strokeStyle = 'rgba(248, 196, 92, 0.78)';
  ahCtx.lineWidth = 2.6;
  ahCtx.beginPath();
  ahCtx.arc(0, 0, 108, 0, Math.PI * 2);
  ahCtx.stroke();
  ahCtx.restore();
  const altarHaloMap = reg(ahC, true, 1, 1, true);

  return {
    brickPlazaMap,
    brickPlazaNormal,
    brickPlazaRough,
    brickPlazaAo,
    marbleAshlarMap,
    marbleAshlarNormal,
    marbleAshlarRough,
    marbleAshlarAo,
    marbleTrimMap,
    marbleTrimNormal,
    marbleTrimRough,
    marbleTrimAo,
    stairMarbleMap,
    stairMarbleNormal,
    stairMarbleRough,
    stairMarbleAo,
    pillarCarvedMap,
    pillarCarvedNormal,
    pillarCarvedRough,
    pillarCarvedAo,
    carvedDoorMap,
    carvedDoorNormal,
    courtyardMandalaMap,
    courtyardMandalaNormal,
    courtyardMandalaRough,
    courtyardMandalaAo,
    courtyardMedallionMap,
    courtyardMedallionNormal,
    courtyardMedallionRough,
    courtyardMedallionAo,
    flagstoneMap,
    flagstoneNormal,
    flagstoneRough,
    flagstoneAo,
    prayerWheelMap,
    prayerWheelNormal,
    prayerWheelRough,
    mithilaToranaMap,
    mithilaMuralMap,
    saffronJaliMap,
    saffronJaliNormal,
    stainedGlassArchMap,
    domeRibMap,
    domeRibNormal,
    domeRibRough,
    domeRibAo,
    nepalFlagMap,
    soilLoamMap,
    soilLoamNormal,
    soilLoamRough,
    terracottaUrnMap,
    terracottaUrnNormal,
    terracottaUrnRough,
    tulsiLeafMap,
    tulsiLeafNormal,
    shrubFoliageMap,
    shrubFoliageNormal,
    marigoldMap,
    marigoldNormal,
    fernPalmMap,
    fernPalmNormal,
    antiqueBrassMap,
    antiqueBrassNormal,
    antiqueBrassRough,
    lanternHaloMap,
    altarHaloMap,
    dispose: () => list.forEach((t) => t.dispose()),
  };
}

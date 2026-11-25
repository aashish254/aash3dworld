import * as THREE from 'three';
import { JanakiMandirTextures, createJanakiMandirTextures } from './janakiMandirTextures';

export interface ProceduralTextureSet {
  janaki: JanakiMandirTextures;
  meadowMap: THREE.CanvasTexture;
  meadowNormal: THREE.CanvasTexture;
  meadowRough: THREE.CanvasTexture;
  meadowAo: THREE.CanvasTexture;
  pebbleMap: THREE.CanvasTexture;
  pebbleNormal: THREE.CanvasTexture;
  pebbleRough: THREE.CanvasTexture;
  pebbleAo: THREE.CanvasTexture;
  cobbleMap: THREE.CanvasTexture;
  cobbleNormal: THREE.CanvasTexture;
  cobbleRough: THREE.CanvasTexture;
  cobbleAo: THREE.CanvasTexture;
  brickMap: THREE.CanvasTexture;
  brickNormal: THREE.CanvasTexture;
  brickRough: THREE.CanvasTexture;
  brickAo: THREE.CanvasTexture;
  sandstoneMap: THREE.CanvasTexture;
  sandstoneNormal: THREE.CanvasTexture;
  sandstoneRough: THREE.CanvasTexture;
  sandstoneAo: THREE.CanvasTexture;
  roofTileMap: THREE.CanvasTexture;
  roofTileNormal: THREE.CanvasTexture;
  woodMap: THREE.CanvasTexture;
  woodNormal: THREE.CanvasTexture;
  barkMap: THREE.CanvasTexture;
  barkNormal: THREE.CanvasTexture;
  pineCanopyMap: THREE.CanvasTexture;
  pineNeedlesMap: THREE.CanvasTexture;
  palmFrondMap: THREE.CanvasTexture;
  rockMap: THREE.CanvasTexture;
  rockNormal: THREE.CanvasTexture;
  rockRough: THREE.CanvasTexture;
  rockAo: THREE.CanvasTexture;
  waterNormal: THREE.CanvasTexture;
  crateFaceMap: THREE.CanvasTexture;
  crateNormal: THREE.CanvasTexture;
  windowGlassMap: THREE.CanvasTexture;
  dhakaMap: THREE.CanvasTexture;
  stupaEyesMap: THREE.CanvasTexture;
  stupaDomeMap: THREE.CanvasTexture;
  janakiFacadeMap: THREE.CanvasTexture;
  pashupatiGateMap: THREE.CanvasTexture;
  tigerPeltMap: THREE.CanvasTexture;
  marbleWalkMap: THREE.CanvasTexture;
  marbleWalkNormal: THREE.CanvasTexture;
  marbleWalkRough: THREE.CanvasTexture;
  marbleWalkAo: THREE.CanvasTexture;
  monumentPlaqueTex: THREE.CanvasTexture;
  valleyMapBoardTex: THREE.CanvasTexture;
  contactShadowMap: THREE.CanvasTexture;
  aniflowScreenMap: THREE.CanvasTexture;
  agentScreenMap: THREE.CanvasTexture;
  clockFaceMap: THREE.CanvasTexture;
  basaltCarvedMap: THREE.CanvasTexture;
  basaltCarvedNormal: THREE.CanvasTexture;
  basaltCarvedRough: THREE.CanvasTexture;
  basaltCarvedAo: THREE.CanvasTexture;
  agedBronzeMap: THREE.CanvasTexture;
  agedBronzeNormal: THREE.CanvasTexture;
  agedBronzeRough: THREE.CanvasTexture;
  sakuraBlossomMap: THREE.CanvasTexture;
  mapleFoliageMap: THREE.CanvasTexture;
  broadleafFoliageMap: THREE.CanvasTexture;
  jacarandaBloomMap: THREE.CanvasTexture;
  willowFrondMap: THREE.CanvasTexture;
  gulmoharBloomMap: THREE.CanvasTexture;
  birchLeafMap: THREE.CanvasTexture;
  barkSilverBirchMap: THREE.CanvasTexture;
  createSignTexture: (title: string, subtitle: string, accent: string) => THREE.CanvasTexture;
  dispose: () => void;
}

function makeCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

/**
 * Converts a grayscale height canvas into a tileable tangent-space normal map canvas
 * using a Sobel filter so stone joints, brick recesses, wood grain, and rock catch real light.
 */
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
 * Computes crevice ambient occlusion from a grayscale heightmap canvas so mortar joints,
 * stone cobble seams, and rock fissures shade realistically under indirect illumination.
 */
function heightToAoCanvas(
  heightCanvas: HTMLCanvasElement,
  radius = 3,
  strength = 1.65,
  floorMin = 84,
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

export function createProceduralTextures(maxAnisotropy: number): ProceduralTextureSet {
  const janaki = createJanakiMandirTextures(maxAnisotropy);
  const textures: THREE.Texture[] = [];

  const register = (
    canvas: HTMLCanvasElement,
    isColor: boolean,
    repeatX = 1,
    repeatY = 1,
    clamp = false,
  ): THREE.CanvasTexture => {
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
    tex.wrapT = clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    tex.anisotropy = Math.min(8, maxAnisotropy || 1);
    if (isColor) {
      tex.colorSpace = THREE.SRGBColorSpace;
    }
    tex.needsUpdate = true;
    textures.push(tex);
    return tex;
  };

  // 1. Natural Valley Loam, Moss & Grass Turf (seamless 512x512 multi-tone turf, humus pockets & fine blade micro-relief)
  const [meadowC, meadowCtx] = makeCanvas(512, 512);
  const [meadowHC, meadowHCtx] = makeCanvas(512, 512);
  const [meadowRC, meadowRCtx] = makeCanvas(512, 512);
  meadowCtx.fillStyle = '#4c5c38';
  meadowCtx.fillRect(0, 0, 512, 512);
  meadowHCtx.fillStyle = '#787878';
  meadowHCtx.fillRect(0, 0, 512, 512);
  meadowRCtx.fillStyle = '#dcdcdc';
  meadowRCtx.fillRect(0, 0, 512, 512);

  const drawWrappedDisc = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    fill: string | CanvasGradient,
  ) => {
    ctx.fillStyle = fill;
    for (let ox = -512; ox <= 512; ox += 512) {
      if (x + ox + r < 0 || x + ox - r > 512) continue;
      for (let oy = -512; oy <= 512; oy += 512) {
        if (y + oy + r < 0 || y + oy - r > 512) continue;
        ctx.beginPath();
        ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  // Organic humus soil & clover/moss clumps
  for (let i = 0; i < 720; i++) {
    const cx = (i * 197 + (i % 13) * 41) % 512;
    const cy = (i * 313 + (i % 17) * 29) % 512;
    const r = 9 + (i % 22);
    const col =
      i % 4 === 0
        ? 'rgba(54, 68, 38, 0.24)'
        : i % 4 === 1
          ? 'rgba(88, 82, 58, 0.19)'
          : i % 4 === 2
            ? 'rgba(98, 114, 68, 0.20)'
            : 'rgba(62, 78, 44, 0.18)';
    drawWrappedDisc(meadowCtx, cx, cy, r, col);

    const hVal = i % 4 === 1 ? 102 : i % 2 === 0 ? 118 : 148;
    drawWrappedDisc(meadowHCtx, cx, cy, r * 0.85, `rgba(${hVal},${hVal},${hVal},0.2)`);

    const rVal = i % 4 === 1 ? 244 : 210;
    drawWrappedDisc(meadowRCtx, cx, cy, r * 0.9, `rgba(${rVal},${rVal},${rVal},0.2)`);
  }

  // Crisp grass blade clusters & dry thatch flecks with wrapped height & roughness
  for (let i = 0; i < 16500; i++) {
    const x = (i * 173 + (i % 19) * 31) % 512;
    const y = (i * 257 + (i % 23) * 43) % 512;
    const shade = (i * 29) % 6;
    const tilt = ((i % 7) - 3) * 0.65;
    const bLen = 3.2 + (i % 4);
    meadowCtx.strokeStyle =
      shade === 0
        ? 'rgba(46, 58, 32, 0.62)'
        : shade === 1
          ? 'rgba(72, 90, 48, 0.56)'
          : shade === 2
            ? 'rgba(96, 112, 64, 0.48)'
            : shade === 3
              ? 'rgba(104, 92, 66, 0.44)'
              : shade === 4
                ? 'rgba(122, 134, 82, 0.4)'
                : 'rgba(64, 80, 42, 0.54)';
    meadowCtx.lineWidth = shade === 3 ? 1.8 : 1.3;
    meadowCtx.beginPath();
    meadowCtx.moveTo(x, y);
    meadowCtx.lineTo(x + tilt, y - bLen);
    meadowCtx.stroke();

    const b = shade === 3 ? 86 + ((i * 23) % 45) : 122 + ((i * 37) % 108);
    meadowHCtx.strokeStyle = `rgb(${b},${b},${b})`;
    meadowHCtx.lineWidth = 1.6;
    meadowHCtx.beginPath();
    meadowHCtx.moveTo(x, y);
    meadowHCtx.lineTo(x + tilt, y - bLen);
    meadowHCtx.stroke();

    const rv = shade === 3 ? 238 : 186 + ((i * 17) % 48);
    meadowRCtx.fillStyle = `rgb(${rv},${rv},${rv})`;
    meadowRCtx.fillRect(x, y - 2, 2, 3);
  }
  const meadowMap = register(meadowC, true, 36, 36);
  const meadowNormal = register(heightToNormalCanvas(meadowHC, 2.2), false, 36, 36);
  const meadowRough = register(meadowRC, false, 36, 36);
  const meadowAo = register(heightToAoCanvas(meadowHC, 2, 1.45, 112), false, 36, 36);

  // 1b. Riverbed, Shoreline & Trail Verge Multi-Scale Pebbles / River Shingle (512x512 seamless PBR set)
  const [pebC, pebCtx] = makeCanvas(512, 512);
  const [pebHC, pebHCtx] = makeCanvas(512, 512);
  const [pebRC, pebRCtx] = makeCanvas(512, 512);
  // Damp river silt & coarse sand bed beneath stones
  pebCtx.fillStyle = '#5c554a';
  pebCtx.fillRect(0, 0, 512, 512);
  pebHCtx.fillStyle = '#343434';
  pebHCtx.fillRect(0, 0, 512, 512);
  pebRCtx.fillStyle = '#ececec';
  pebRCtx.fillRect(0, 0, 512, 512);

  const drawWrappedPebble = (
    px: number,
    py: number,
    rx: number,
    ry: number,
    ang: number,
    rgb: [number, number, number],
    crownH: number,
    roughVal: number,
    speckleSeed: number,
  ) => {
    const maxR = Math.max(rx, ry) + 2;
    for (let ox = -512; ox <= 512; ox += 512) {
      if (px + ox + maxR < 0 || px + ox - maxR > 512) continue;
      for (let oy = -512; oy <= 512; oy += 512) {
        if (py + oy + maxR < 0 || py + oy - maxR > 512) continue;
        const cx = px + ox;
        const cy = py + oy;

        // Albedo with soft edge shadow & top sun-worn mineral sheen
        pebCtx.save();
        pebCtx.translate(cx, cy);
        pebCtx.rotate(ang);
        pebCtx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
        pebCtx.beginPath();
        pebCtx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        pebCtx.fill();
        pebCtx.strokeStyle = 'rgba(26, 23, 19, 0.42)';
        pebCtx.lineWidth = 1.2;
        pebCtx.stroke();
        // Mineral grain fleck inside stone
        pebCtx.fillStyle = speckleSeed % 3 === 0 ? 'rgba(240, 235, 224, 0.18)' : 'rgba(34, 32, 30, 0.16)';
        pebCtx.fillRect(-rx * 0.35, -ry * 0.25, rx * 0.35, ry * 0.22);
        pebCtx.restore();

        // Domed 3D spherical-cap height gradient for crisp normal & AO relief
        pebHCtx.save();
        pebHCtx.translate(cx, cy);
        pebHCtx.rotate(ang);
        pebHCtx.scale(1, ry / Math.max(1, rx));
        const hGrad = pebHCtx.createRadialGradient(0, 0, rx * 0.08, 0, 0, rx);
        hGrad.addColorStop(0, `rgb(${crownH},${crownH},${crownH})`);
        hGrad.addColorStop(0.72, `rgb(${Math.round(crownH * 0.78)},${Math.round(crownH * 0.78)},${Math.round(crownH * 0.78)})`);
        hGrad.addColorStop(1, 'rgb(48,48,48)');
        pebHCtx.fillStyle = hGrad;
        pebHCtx.beginPath();
        pebHCtx.arc(0, 0, rx, 0, Math.PI * 2);
        pebHCtx.fill();
        pebHCtx.restore();

        // Water-tumbled smoother centers vs matte crevices
        pebRCtx.save();
        pebRCtx.translate(cx, cy);
        pebRCtx.rotate(ang);
        pebRCtx.fillStyle = `rgb(${roughVal},${roughVal},${roughVal})`;
        pebRCtx.beginPath();
        pebRCtx.ellipse(0, 0, rx * 0.88, ry * 0.88, 0, 0, Math.PI * 2);
        pebRCtx.fill();
        pebRCtx.restore();
      }
    }
  };

  const pebbleTones: Array<[number, number, number]> = [
    [136, 132, 124], // Quartzite grey
    [116, 118, 122], // River slate
    [152, 138, 118], // Warm sandstone pebble
    [102, 98, 92],   // Basalt cobble
    [164, 156, 144], // Pale granite pebble
    [132, 114, 96],  // Iron-stained river stone
  ];

  // Fine coarse gravel bed (950 grains)
  for (let i = 0; i < 950; i++) {
    const gx = (i * 199 + (i % 17) * 23) % 512;
    const gy = (i * 311 + (i % 13) * 37) % 512;
    const rx = 2.2 + (i % 4);
    const ry = 1.8 + ((i * 3) % 3);
    const tone = pebbleTones[i % pebbleTones.length];
    const shade = 0.86 + ((i % 5) * 0.06);
    drawWrappedPebble(
      gx,
      gy,
      rx,
      ry,
      (i * 0.9) % Math.PI,
      [Math.round(tone[0] * shade), Math.round(tone[1] * shade), Math.round(tone[2] * shade)],
      115 + (i % 45),
      150 + (i % 50),
      i,
    );
  }
  // Medium rounded river pebbles (420 stones)
  for (let i = 0; i < 420; i++) {
    const px = (i * 241 + (i % 19) * 31 + 17) % 512;
    const py = (i * 379 + (i % 23) * 19 + 11) % 512;
    const rx = 6.5 + (i % 9);
    const ry = 4.8 + ((i * 5) % 7);
    const tone = pebbleTones[(i * 7) % pebbleTones.length];
    const v = ((i * 13) % 24) - 12;
    drawWrappedPebble(
      px,
      py,
      rx,
      ry,
      (i * 1.17) % Math.PI,
      [tone[0] + v, tone[1] + v, tone[2] + v],
      165 + (i % 52),
      112 + (i % 46),
      i + 3,
    );
  }
  // Larger cobble stones (115 stones)
  for (let i = 0; i < 115; i++) {
    const px = (i * 283 + (i % 11) * 47 + 29) % 512;
    const py = (i * 409 + (i % 13) * 41 + 23) % 512;
    const rx = 13 + (i % 11);
    const ry = 9.5 + ((i * 3) % 8);
    const tone = pebbleTones[(i * 5 + 2) % pebbleTones.length];
    const v = ((i * 17) % 26) - 13;
    drawWrappedPebble(
      px,
      py,
      rx,
      ry,
      (i * 0.73) % Math.PI,
      [tone[0] + v, tone[1] + v, tone[2] + v],
      195 + (i % 52),
      96 + (i % 44),
      i + 9,
    );
  }
  const pebbleMap = register(pebC, true, 1, 1);
  const pebbleNormal = register(heightToNormalCanvas(pebHC, 2.8), false, 1, 1);
  const pebbleRough = register(pebRC, false, 1, 1);
  const pebbleAo = register(heightToAoCanvas(pebHC, 3, 1.7, 92), false, 1, 1);

  // 2. Authentic Damp Patan Durbar Square Quartzite & Slate Flagstones
  const [cobbleC, cobbleCtx] = makeCanvas(512, 512);
  const [cobbleHC, cobbleHCtx] = makeCanvas(512, 512);
  const [cobbleRC, cobbleRCtx] = makeCanvas(512, 512);
  // Dark earthy moss-filled stone joints
  cobbleCtx.fillStyle = '#3a3b34';
  cobbleCtx.fillRect(0, 0, 512, 512);
  cobbleHCtx.fillStyle = '#202020';
  cobbleHCtx.fillRect(0, 0, 512, 512);
  cobbleRCtx.fillStyle = '#ebebeb';
  cobbleRCtx.fillRect(0, 0, 512, 512);

  const rows = 8;
  const cols = 6;
  const cellH = 512 / rows;
  const cellW = 512 / cols;
  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (cellW * 0.5);
    for (let c = -1; c <= cols; c++) {
      const hash = (r * 73 + c * 137) & 255;
      const v = (hash % 30) - 15;
      const warm = (hash % 12) - 6;
      const baseR = 114 + v + warm;
      const baseG = 112 + v + Math.floor(warm * 0.5);
      const baseB = 106 + v - Math.floor(warm * 0.4);
      const x = c * cellW + offset + 3;
      const y = r * cellH + 3;
      const w = cellW - 6;
      const h = cellH - 6;

      cobbleCtx.fillStyle = `rgb(${baseR}, ${baseG}, ${baseB})`;
      cobbleCtx.beginPath();
      cobbleCtx.roundRect(x, y, w, h, 3);
      cobbleCtx.fill();

      // Subtle mineral speckling & lichen weathering inside each stone slab
      for (let s = 0; s < 14; s++) {
        const sx = x + ((hash * 13 + s * 29) % Math.max(4, Math.floor(w - 8))) + 4;
        const sy = y + ((hash * 19 + s * 17) % Math.max(4, Math.floor(h - 8))) + 4;
        cobbleCtx.fillStyle =
          s % 4 === 0 ? 'rgba(66, 82, 52, 0.22)' : 'rgba(255, 250, 240, 0.08)';
        cobbleCtx.fillRect(sx, sy, 3 + (s % 4), 2 + (s % 3));
      }

      const bh = 185 + (hash % 45);
      cobbleHCtx.fillStyle = `rgb(${bh},${bh},${bh})`;
      cobbleHCtx.beginPath();
      cobbleHCtx.roundRect(x + 1, y + 1, w - 2, h - 2, 3);
      cobbleHCtx.fill();

      // Polished worn center stones have slightly lower roughness (140-175) vs rough joints (235)
      const rr = 148 + (hash % 42);
      cobbleRCtx.fillStyle = `rgb(${rr},${rr},${rr})`;
      cobbleRCtx.beginPath();
      cobbleRCtx.roundRect(x, y, w, h, 3);
      cobbleRCtx.fill();
    }
  }
  const cobbleMap = register(cobbleC, true, 4, 4);
  const cobbleNormal = register(heightToNormalCanvas(cobbleHC, 2.8), false, 4, 4);
  const cobbleRough = register(cobbleRC, false, 4, 4);
  const cobbleAo = register(heightToAoCanvas(cobbleHC, 3, 1.8), false, 4, 4);

  // 3. Real Weathered Newari *Dachi Appa* Kiln Terracotta Brick + Surkhi Mortar
  const [brickC, brickCtx] = makeCanvas(512, 512);
  const [brickHC, brickHCtx] = makeCanvas(512, 512);
  const [brickRC, brickRCtx] = makeCanvas(512, 512);
  brickCtx.fillStyle = '#8b7e72'; // Recessed weathered lime-sand mortar
  brickCtx.fillRect(0, 0, 512, 512);
  brickHCtx.fillStyle = '#383838';
  brickHCtx.fillRect(0, 0, 512, 512);
  brickRCtx.fillStyle = '#e5e5e5';
  brickRCtx.fillRect(0, 0, 512, 512);

  const bRows = 16;
  const bCols = 8;
  const bH = 512 / bRows;
  const bW = 512 / bCols;
  for (let r = 0; r < bRows; r++) {
    const off = (r % 2) * (bW * 0.5);
    for (let c = -1; c <= bCols; c++) {
      const hsh = (r * 59 + c * 101) & 255;
      const v = (hsh % 34) - 17;
      const soot = r > 12 || hsh % 11 === 0 ? -18 : 0;
      const cr = Math.max(60, 146 + v + soot);
      const cg = Math.max(28, 64 + Math.floor(v * 0.45) + Math.floor(soot * 0.6));
      const cb = Math.max(22, 46 + Math.floor(v * 0.35) + Math.floor(soot * 0.4));
      const bx = c * bW + off + 2;
      const by = r * bH + 2;
      brickCtx.fillStyle = `rgb(${cr}, ${cg}, ${cb})`;
      brickCtx.fillRect(bx, by, bW - 4, bH - 4);
      // Slight glaze sheen variation along top edge of fired brick
      brickCtx.fillStyle = 'rgba(255, 224, 195, 0.08)';
      brickCtx.fillRect(bx, by, bW - 4, 3);

      const bh = 185 + (hsh % 42);
      brickHCtx.fillStyle = `rgb(${bh},${bh},${bh})`;
      brickHCtx.fillRect(bx + 1, by + 1, bW - 6, bH - 6);

      const br = 158 + (hsh % 50);
      brickRCtx.fillStyle = `rgb(${br},${br},${br})`;
      brickRCtx.fillRect(bx, by, bW - 4, bH - 4);
    }
  }
  const brickMap = register(brickC, true, 2, 2);
  const brickNormal = register(heightToNormalCanvas(brickHC, 2.7), false, 2, 2);
  const brickRough = register(brickRC, false, 2, 2);
  const brickAo = register(heightToAoCanvas(brickHC, 3, 1.75), false, 2, 2);

  // 4. Sedimentary Chunar Sandstone Ashlar (VIT Vellore Campus Stonework)
  const [sandC, sandCtx] = makeCanvas(512, 512);
  const [sandHC, sandHCtx] = makeCanvas(512, 512);
  const [sandRC, sandRCtx] = makeCanvas(512, 512);
  sandCtx.fillStyle = '#7c6f5e';
  sandCtx.fillRect(0, 0, 512, 512);
  sandHCtx.fillStyle = '#404040';
  sandHCtx.fillRect(0, 0, 512, 512);
  sandRCtx.fillStyle = '#e0e0e0';
  sandRCtx.fillRect(0, 0, 512, 512);

  for (let r = 0; r < 10; r++) {
    const off = (r % 2) * 64;
    for (let c = -1; c <= 4; c++) {
      const hsh = (r * 43 + c * 89) & 255;
      const v = (hsh % 22) - 11;
      const sx = c * 128 + off + 2;
      const sy = r * 51 + 2;
      sandCtx.fillStyle = `rgb(${194 + v}, ${166 + v}, ${130 + v})`;
      sandCtx.fillRect(sx, sy, 124, 47);

      // Sedimentary horizontal mineral veins
      for (let vein = 0; vein < 3; vein++) {
        sandCtx.fillStyle =
          vein % 2 === 0 ? 'rgba(138, 112, 82, 0.14)' : 'rgba(235, 220, 196, 0.12)';
        sandCtx.fillRect(sx + 4, sy + 9 + vein * 13, 116, 3);
      }

      const sh = 190 + (hsh % 35);
      sandHCtx.fillStyle = `rgb(${sh},${sh},${sh})`;
      sandHCtx.fillRect(sx + 1, sy + 1, 122, 45);
      const sr = 188 + (hsh % 36);
      sandRCtx.fillStyle = `rgb(${sr},${sr},${sr})`;
      sandRCtx.fillRect(sx, sy, 124, 47);
    }
  }
  const sandstoneMap = register(sandC, true, 2, 2);
  const sandstoneNormal = register(heightToNormalCanvas(sandHC, 2.3), false, 2, 2);
  const sandstoneRough = register(sandRC, false, 2, 2);
  const sandstoneAo = register(heightToAoCanvas(sandHC, 3, 1.65), false, 2, 2);

  // 5. Weathered Terracotta & Lichen *Jhingati* Scalloped Pagoda Roof Tiles
  const [roofC, roofCtx] = makeCanvas(256, 256);
  const [roofHC, roofHCtx] = makeCanvas(256, 256);
  roofCtx.fillStyle = '#4e271c';
  roofCtx.fillRect(0, 0, 256, 256);
  roofHCtx.fillStyle = '#606060';
  roofHCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 22) {
    for (let x = 0; x < 256; x += 16) {
      const v = ((x * 13 + y * 29) % 24) - 12;
      roofCtx.fillStyle = `rgb(${112 + v}, ${50 + Math.floor(v * 0.5)}, ${34 + Math.floor(v * 0.4)})`;
      roofCtx.fillRect(x + 1, y, 13, 20);
      roofCtx.fillStyle = 'rgba(20, 15, 10, 0.35)';
      roofCtx.fillRect(x + 14, y, 2, 22);
      if ((x + y) % 5 === 0) {
        roofCtx.fillStyle = 'rgba(84, 98, 56, 0.25)';
        roofCtx.fillRect(x + 3, y + 6, 6, 5);
      }
      roofHCtx.fillStyle = '#d8d8d8';
      roofHCtx.fillRect(x + 2, y + 1, 11, 18);
    }
    roofCtx.fillStyle = 'rgba(15, 8, 5, 0.4)';
    roofCtx.fillRect(0, y + 20, 256, 2);
    roofHCtx.fillStyle = '#282828';
    roofHCtx.fillRect(0, y + 20, 256, 2);
  }
  const roofTileMap = register(roofC, true, 4, 3);
  const roofTileNormal = register(heightToNormalCanvas(roofHC, 2.5), false, 4, 3);

  // 6. Dark Aged Oiled *Sal* Timber Wood Grain
  const [woodC, woodCtx] = makeCanvas(256, 256);
  const [woodHC, woodHCtx] = makeCanvas(256, 256);
  woodCtx.fillStyle = '#472c1b';
  woodCtx.fillRect(0, 0, 256, 256);
  woodHCtx.fillStyle = '#808080';
  woodHCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 3) {
    const tone = ((y * 19 + ((y >> 3) * 11)) % 24) - 12;
    woodCtx.fillStyle = `rgb(${74 + tone}, ${46 + Math.floor(tone * 0.65)}, ${28 + Math.floor(tone * 0.45)})`;
    woodCtx.fillRect(0, y, 256, 3);
    const hv = 128 + tone * 3;
    woodHCtx.fillStyle = `rgb(${hv},${hv},${hv})`;
    woodHCtx.fillRect(0, y, 256, 2);
  }
  for (let p = 0; p < 4; p++) {
    woodCtx.fillStyle = 'rgba(18, 10, 5, 0.48)';
    woodCtx.fillRect(0, p * 64, 256, 2);
    woodHCtx.fillStyle = '#262626';
    woodHCtx.fillRect(0, p * 64, 256, 2);
  }
  const woodMap = register(woodC, true, 1, 2);
  const woodNormal = register(heightToNormalCanvas(woodHC, 2.0), false, 1, 2);

  // 7. Fissured Himalayan Deodar / Pine Tree Bark
  const [barkC, barkCtx] = makeCanvas(256, 256);
  const [barkHC, barkHCtx] = makeCanvas(256, 256);
  barkCtx.fillStyle = '#46382c';
  barkCtx.fillRect(0, 0, 256, 256);
  barkHCtx.fillStyle = '#505050';
  barkHCtx.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 6) {
    for (let y = 0; y < 256; y += 18) {
      const hsh = (x * 17 + y * 31) % 30;
      const r = 68 + hsh;
      const g = 54 + Math.floor(hsh * 0.75);
      const b = 42 + Math.floor(hsh * 0.55);
      barkCtx.fillStyle = `rgb(${r},${g},${b})`;
      barkCtx.fillRect(x, y + (x % 9), 4, 15);
      barkCtx.fillStyle = 'rgba(20, 14, 10, 0.55)';
      barkCtx.fillRect(x + 4, y, 2, 18);
      const hv = 150 + hsh * 2;
      barkHCtx.fillStyle = `rgb(${hv},${hv},${hv})`;
      barkHCtx.fillRect(x, y + (x % 9), 4, 15);
    }
  }
  const barkMap = register(barkC, true, 2, 3);
  const barkNormal = register(heightToNormalCanvas(barkHC, 3.0), false, 2, 3);

  // 7b. Weathered Alpine Gneiss & Stratified Outcrop Rock PBR Maps (seamless 512x512 albedo, normal, roughness, AO)
  const [rockC, rockCtx] = makeCanvas(512, 512);
  const [rockHC, rockHCtx] = makeCanvas(512, 512);
  const [rockRC, rockRCtx] = makeCanvas(512, 512);
  rockCtx.fillStyle = '#696864';
  rockCtx.fillRect(0, 0, 512, 512);
  rockHCtx.fillStyle = '#848484';
  rockHCtx.fillRect(0, 0, 512, 512);
  rockRCtx.fillStyle = '#cccccc';
  rockRCtx.fillRect(0, 0, 512, 512);

  // Horizontal tectonic rock strata bands with gentle wave undulation
  for (let row = 0; row < 28; row++) {
    const baseY = (row / 28) * 512;
    const tone = ((row * 37) % 28) - 14;
    const bandR = 104 + tone + (row % 5 === 0 ? 12 : 0);
    const bandG = 102 + tone + (row % 5 === 0 ? 6 : 0);
    const bandB = 98 + tone;
    rockCtx.fillStyle = `rgba(${bandR},${bandG},${bandB},0.36)`;
    rockCtx.beginPath();
    rockCtx.moveTo(0, baseY);
    for (let x = 0; x <= 512; x += 32) {
      const wave = Math.sin((x / 512) * Math.PI * 2 + row * 0.7) * 5 + Math.cos((x / 512) * Math.PI * 4 - row) * 2.5;
      rockCtx.lineTo(x, baseY + wave);
    }
    rockCtx.lineTo(512, baseY + 22);
    rockCtx.lineTo(0, baseY + 22);
    rockCtx.closePath();
    rockCtx.fill();

    const hBand = 112 + ((row * 29) % 44);
    rockHCtx.fillStyle = `rgba(${hBand},${hBand},${hBand},0.32)`;
    rockHCtx.fillRect(0, baseY, 512, 16);
  }

  // Faceted granite/gneiss mineral blocks, iron-oxide weathering & alpine lichen spots (wrapped cleanly)
  for (let i = 0; i < 1400; i++) {
    const rx = (i * 157 + (i % 13) * 31) % 512;
    const ry = (i * 269 + (i % 17) * 23) % 512;
    const rw = 5 + (i % 20);
    const rh = 3 + ((i * 7) % 12);
    const ang = ((i % 11) - 5) * 0.14;
    const isRust = i % 13 === 0;
    const isLichen = i % 19 === 0;
    const isQuartz = i % 11 === 0;
    const col = isRust
      ? 'rgba(132, 92, 62, 0.24)'
      : isLichen
        ? 'rgba(98, 108, 64, 0.22)'
        : isQuartz
          ? 'rgba(176, 174, 168, 0.18)'
          : i % 2 === 0
            ? 'rgba(72, 74, 78, 0.24)'
            : 'rgba(132, 130, 124, 0.20)';
    const hVal = isQuartz ? 186 : i % 3 === 0 ? 74 : 154 + ((i * 19) % 55);
    const rVal = isQuartz ? 142 : i % 4 === 0 ? 236 : 178 + ((i * 13) % 48);

    for (let ox = -512; ox <= 512; ox += 512) {
      if (rx + ox + rw < 0 || rx + ox - rw > 512) continue;
      for (let oy = -512; oy <= 512; oy += 512) {
        if (ry + oy + rw < 0 || ry + oy - rw > 512) continue;
        rockCtx.save();
        rockCtx.translate(rx + ox, ry + oy);
        rockCtx.rotate(ang);
        rockCtx.fillStyle = col;
        rockCtx.fillRect(-rw / 2, -rh / 2, rw, rh);
        rockCtx.restore();

        rockHCtx.save();
        rockHCtx.translate(rx + ox, ry + oy);
        rockHCtx.rotate(ang);
        rockHCtx.fillStyle = `rgba(${hVal},${hVal},${hVal},0.46)`;
        rockHCtx.fillRect(-rw / 2, -rh / 2, rw, rh);
        rockHCtx.restore();

        rockRCtx.save();
        rockRCtx.translate(rx + ox, ry + oy);
        rockRCtx.rotate(ang);
        rockRCtx.fillStyle = `rgba(${rVal},${rVal},${rVal},0.35)`;
        rockRCtx.fillRect(-rw / 2, -rh / 2, rw, rh);
        rockRCtx.restore();
      }
    }
  }

  // Deep weathered tectonic fissures & frost-shattered joint cracks
  for (let c = 0; c < 68; c++) {
    const sx = (c * 131) % 512;
    const sy = (c * 211) % 512;
    const dx = 42 + (c % 5) * 22;
    const dy = ((c % 3) - 1) * 28 + 12;
    for (let ox = -512; ox <= 512; ox += 512) {
      for (let oy = -512; oy <= 512; oy += 512) {
        if (sx + ox < -140 || sx + ox > 650 || sy + oy < -140 || sy + oy > 650) continue;
        rockCtx.strokeStyle = c % 4 === 0 ? 'rgba(32, 30, 28, 0.56)' : 'rgba(46, 44, 42, 0.42)';
        rockCtx.lineWidth = c % 3 === 0 ? 2.2 : 1.3;
        rockCtx.beginPath();
        rockCtx.moveTo(sx + ox, sy + oy);
        rockCtx.bezierCurveTo(
          sx + ox + dx * 0.35,
          sy + oy + dy * 0.7,
          sx + ox + dx * 0.7,
          sy + oy - dy * 0.3,
          sx + ox + dx,
          sy + oy + dy,
        );
        rockCtx.stroke();

        rockHCtx.strokeStyle = 'rgba(28, 28, 28, 0.72)';
        rockHCtx.lineWidth = c % 3 === 0 ? 2.6 : 1.6;
        rockHCtx.beginPath();
        rockHCtx.moveTo(sx + ox, sy + oy);
        rockHCtx.bezierCurveTo(
          sx + ox + dx * 0.35,
          sy + oy + dy * 0.7,
          sx + ox + dx * 0.7,
          sy + oy - dy * 0.3,
          sx + ox + dx,
          sy + oy + dy,
        );
        rockHCtx.stroke();

        rockRCtx.strokeStyle = 'rgba(246, 246, 246, 0.65)';
        rockRCtx.lineWidth = 2.4;
        rockRCtx.beginPath();
        rockRCtx.moveTo(sx + ox, sy + oy);
        rockRCtx.bezierCurveTo(
          sx + ox + dx * 0.35,
          sy + oy + dy * 0.7,
          sx + ox + dx * 0.7,
          sy + oy - dy * 0.3,
          sx + ox + dx,
          sy + oy + dy,
        );
        rockRCtx.stroke();
      }
    }
  }
  const rockMap = register(rockC, true, 10, 4);
  const rockNormal = register(heightToNormalCanvas(rockHC, 2.8), false, 10, 4);
  const rockRough = register(rockRC, false, 10, 4);
  const rockAo = register(heightToAoCanvas(rockHC, 3, 1.7, 86), false, 10, 4);

  // 7c. Flowing Glacial Stream Ripple Normal Map
  const [watHC, watHCtx] = makeCanvas(256, 256);
  const watImg = watHCtx.createImageData(256, 256);
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const u = (x / 256) * Math.PI * 2;
      const v = (y / 256) * Math.PI * 2;
      const wave =
        Math.sin(u * 4 + Math.cos(v * 2) * 1.4) * 0.45 +
        Math.cos(v * 6 - Math.sin(u * 3) * 1.2) * 0.35 +
        Math.sin((u + v) * 8) * 0.2;
      const lum = Math.max(0, Math.min(255, Math.round(128 + wave * 64)));
      const idx = (y * 256 + x) * 4;
      watImg.data[idx] = lum;
      watImg.data[idx + 1] = lum;
      watImg.data[idx + 2] = lum;
      watImg.data[idx + 3] = 255;
    }
  }
  watHCtx.putImageData(watImg, 0, 0);
  const waterNormal = register(heightToNormalCanvas(watHC, 1.4), false, 3, 24);

  // 7d. Dense Evergreen Deodar Spruce Canopy Texture (multi-tone conifer needle clusters + inner bough depth)
  const [pcC, pcCtx] = makeCanvas(256, 256);
  pcCtx.fillStyle = '#192918';
  pcCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4200; i++) {
    const px = (i * 113 + (i % 13) * 17) % 256;
    const py = (i * 179 + (i % 19) * 23) % 256;
    const shade = (i % 7 === 0) ? 0.65 : 1.0;
    const g = Math.round((42 + ((i * 29) % 48)) * shade);
    pcCtx.strokeStyle = `rgba(${Math.round(g * 0.44)}, ${g}, ${Math.round(g * 0.4)}, 0.84)`;
    pcCtx.lineWidth = i % 3 === 0 ? 2.1 : 1.3;
    pcCtx.beginPath();
    pcCtx.moveTo(px, py);
    pcCtx.lineTo(px + ((i % 7) - 3) * 2.4, py + 6 + (i % 4));
    pcCtx.stroke();
  }
  const pineCanopyMap = register(pcC, true, 3, 2);

  // 8. Alpha-Cutout Botanical Foliage: Himalayan Deodar Pine Needle Bough Card
  const [pineC, pineCtx] = makeCanvas(256, 256);
  pineCtx.clearRect(0, 0, 256, 256);
  // Central woody branchlet
  pineCtx.strokeStyle = '#4b3623';
  pineCtx.lineWidth = 5;
  pineCtx.beginPath();
  pineCtx.moveTo(128, 250);
  pineCtx.lineTo(128, 36);
  pineCtx.stroke();
  // Dense layered conifer needle tufts radiating along branchlet
  for (let i = 0; i < 240; i++) {
    const t = i / 240;
    const y = 242 - t * 212;
    const maxSpread = 112 * Math.sin(Math.pow(1 - t * 0.85, 0.7) * Math.PI * 0.55);
    const side = i % 2 === 0 ? -1 : 1;
    const len = (0.35 + ((i * 29) % 65) / 100) * maxSpread;
    const tipX = 128 + side * len;
    const tipY = y - 14 - ((i * 13) % 18);
    const gTone = 52 + ((i * 19) % 38);
    pineCtx.strokeStyle = `rgb(${Math.round(gTone * 0.52)}, ${gTone}, ${Math.round(gTone * 0.44)})`;
    pineCtx.lineWidth = 2.6;
    pineCtx.beginPath();
    pineCtx.moveTo(128 + side * 3, y);
    pineCtx.lineTo(tipX, tipY);
    pineCtx.stroke();
    // Fine secondary needles off sub-twigs
    for (let k = -1; k <= 1; k += 2) {
      pineCtx.strokeStyle = `rgb(${Math.round(gTone * 0.46)}, ${gTone + 8}, ${Math.round(gTone * 0.42)})`;
      pineCtx.lineWidth = 1.8;
      pineCtx.beginPath();
      pineCtx.moveTo(128 + side * len * 0.55, (y + tipY) * 0.5);
      pineCtx.lineTo(128 + side * len * 0.78 + k * 7, tipY - 9);
      pineCtx.stroke();
    }
  }
  const pineNeedlesMap = register(pineC, true, 1, 1, true);

  // 9. Alpha-Cutout Pinnate Coconut Palm Frond Leaflets
  const [palmC, palmCtx] = makeCanvas(256, 512);
  palmCtx.clearRect(0, 0, 256, 512);
  // Central fibrous rachis stem
  palmCtx.strokeStyle = '#5c6e32';
  palmCtx.lineWidth = 7;
  palmCtx.beginPath();
  palmCtx.moveTo(128, 508);
  palmCtx.lineTo(128, 16);
  palmCtx.stroke();
  for (let i = 0; i < 42; i++) {
    const t = i / 41;
    const y = 492 - t * 468;
    const span = 118 * Math.sin(Math.pow(1 - t * 0.9, 0.65) * Math.PI * 0.58 + 0.25);
    for (const side of [-1, 1]) {
      const g = 74 + ((i * 17 + (side > 0 ? 11 : 0)) % 34);
      palmCtx.fillStyle = `rgb(${Math.round(g * 0.54)}, ${g}, ${Math.round(g * 0.36)})`;
      palmCtx.beginPath();
      palmCtx.moveTo(128, y);
      palmCtx.quadraticCurveTo(
        128 + side * span * 0.55,
        y - 16,
        128 + side * span,
        y + 18,
      );
      palmCtx.quadraticCurveTo(
        128 + side * span * 0.45,
        y - 4,
        128,
        y + 7,
      );
      palmCtx.closePath();
      palmCtx.fill();
    }
  }
  const palmFrondMap = register(palmC, true, 1, 1, true);

  // 10. Weathered Expedition Timber Shipping Crate (natural pine wood + dark iron corner plates)
  const [crateC, crateCtx] = makeCanvas(256, 256);
  const [crateHC, crateHCtx] = makeCanvas(256, 256);
  crateCtx.fillStyle = '#8b6a47';
  crateCtx.fillRect(0, 0, 256, 256);
  crateHCtx.fillStyle = '#909090';
  crateHCtx.fillRect(0, 0, 256, 256);
  for (let y = 26; y < 230; y += 34) {
    crateCtx.fillStyle = '#6c5033';
    crateCtx.fillRect(24, y, 208, 3);
    crateCtx.fillStyle = 'rgba(255, 232, 196, 0.08)';
    crateCtx.fillRect(24, y + 3, 208, 12);
    crateHCtx.fillStyle = '#383838';
    crateHCtx.fillRect(24, y, 208, 3);
  }
  // Diagonal cross-brace & perimeter frame slats
  crateCtx.strokeStyle = '#a38059';
  crateCtx.lineWidth = 22;
  crateCtx.beginPath();
  crateCtx.moveTo(22, 22);
  crateCtx.lineTo(234, 234);
  crateCtx.stroke();
  crateCtx.strokeStyle = '#ab8760';
  crateCtx.lineWidth = 26;
  crateCtx.strokeRect(13, 13, 230, 230);
  crateHCtx.strokeStyle = '#d4d4d4';
  crateHCtx.lineWidth = 22;
  crateHCtx.strokeRect(13, 13, 230, 230);
  // Oxidized iron corner straps & stencil
  crateCtx.fillStyle = '#2d3138';
  for (const [cx, cy] of [[4, 4], [220, 4], [4, 220], [220, 220]]) {
    crateCtx.fillRect(cx, cy, 32, 32);
  }
  crateCtx.fillStyle = 'rgba(38, 30, 22, 0.55)';
  crateCtx.font = 'bold 20px monospace';
  crateCtx.fillText('KTM · 04', 76, 136);
  const crateFaceMap = register(crateC, true, 1, 1, true);
  const crateNormal = register(heightToNormalCanvas(crateHC, 2.2), false, 1, 1, true);

  // 11. Architectural Smoked Curtain-Wall Glass & Iron Mullions
  const [glassC, glassCtx] = makeCanvas(256, 256);
  const gGrad = glassCtx.createLinearGradient(0, 0, 256, 256);
  gGrad.addColorStop(0, '#1e2f3d');
  gGrad.addColorStop(0.5, '#354f63');
  gGrad.addColorStop(1, '#16232e');
  glassCtx.fillStyle = gGrad;
  glassCtx.fillRect(0, 0, 256, 256);
  glassCtx.strokeStyle = '#222830';
  glassCtx.lineWidth = 10;
  glassCtx.strokeRect(5, 5, 246, 246);
  glassCtx.lineWidth = 5;
  glassCtx.beginPath();
  glassCtx.moveTo(128, 0);
  glassCtx.lineTo(128, 256);
  glassCtx.moveTo(0, 128);
  glassCtx.lineTo(256, 128);
  glassCtx.stroke();
  const windowGlassMap = register(glassC, true, 1, 1);

  // 12. Traditional Nepali Dhaka Geometric Textile Pattern
  const [dhakaC, dhakaCtx] = makeCanvas(256, 256);
  dhakaCtx.fillStyle = '#7c1919';
  dhakaCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 32) {
    for (let x = 0; x < 256; x += 32) {
      dhakaCtx.fillStyle = '#c98821';
      dhakaCtx.beginPath();
      dhakaCtx.moveTo(x + 16, y + 2);
      dhakaCtx.lineTo(x + 30, y + 16);
      dhakaCtx.lineTo(x + 16, y + 30);
      dhakaCtx.lineTo(x + 2, y + 16);
      dhakaCtx.closePath();
      dhakaCtx.fill();

      dhakaCtx.fillStyle = '#e5ded2';
      dhakaCtx.fillRect(x + 12, y + 12, 8, 8);
      dhakaCtx.fillStyle = '#181e28';
      dhakaCtx.fillRect(x + 14, y + 14, 4, 4);
    }
  }
  const dhakaMap = register(dhakaC, true, 2, 1);

  // 13. Swayambhu Wisdom Eyes Harmika Face (weathered gilt brass + mineral pigments)
  const [eyesC, eyesCtx] = makeCanvas(256, 128);
  eyesCtx.fillStyle = '#c89228';
  eyesCtx.fillRect(0, 0, 256, 128);
  eyesCtx.strokeStyle = '#684411';
  eyesCtx.lineWidth = 6;
  eyesCtx.strokeRect(4, 4, 248, 120);
  for (const cx of [74, 182]) {
    eyesCtx.fillStyle = '#f3ede2';
    eyesCtx.beginPath();
    eyesCtx.ellipse(cx, 54, 34, 16, 0, 0, Math.PI * 2);
    eyesCtx.fill();
    eyesCtx.strokeStyle = '#1d222b';
    eyesCtx.lineWidth = 4;
    eyesCtx.stroke();

    eyesCtx.fillStyle = '#1d222b';
    eyesCtx.beginPath();
    eyesCtx.arc(cx, 54, 10, 0, Math.PI * 2);
    eyesCtx.fill();

    eyesCtx.strokeStyle = '#1d222b';
    eyesCtx.lineWidth = 5;
    eyesCtx.beginPath();
    eyesCtx.moveTo(cx - 32, 32);
    eyesCtx.quadraticCurveTo(cx, 18, cx + 32, 32);
    eyesCtx.stroke();
  }
  eyesCtx.fillStyle = '#9e2323';
  eyesCtx.beginPath();
  eyesCtx.arc(128, 30, 8, 0, Math.PI * 2);
  eyesCtx.fill();
  eyesCtx.strokeStyle = '#1d222b';
  eyesCtx.lineWidth = 5;
  eyesCtx.beginPath();
  eyesCtx.arc(128, 84, 10, 0, Math.PI * 1.5);
  eyesCtx.stroke();
  eyesCtx.beginPath();
  eyesCtx.moveTo(128, 94);
  eyesCtx.quadraticCurveTo(136, 112, 118, 116);
  eyesCtx.stroke();
  const stupaEyesMap = register(eyesC, true, 1, 1, true);

  // 14. Cast-Bronze Heritage Monument Plaque ("AASHISH KUMAR MAHATO")
  const [plqC, plqCtx] = makeCanvas(768, 224);
  const pGrad = plqCtx.createLinearGradient(0, 0, 768, 224);
  pGrad.addColorStop(0, '#3a2c1c');
  pGrad.addColorStop(0.5, '#523e28');
  pGrad.addColorStop(1, '#2f2417');
  plqCtx.fillStyle = pGrad;
  plqCtx.fillRect(0, 0, 768, 224);
  plqCtx.strokeStyle = '#b48a4e';
  plqCtx.lineWidth = 8;
  plqCtx.strokeRect(12, 12, 744, 200);
  plqCtx.strokeStyle = '#7c5d33';
  plqCtx.lineWidth = 2;
  plqCtx.strokeRect(22, 22, 724, 180);
  // Corner rivets
  plqCtx.fillStyle = '#c89e62';
  for (const [rx, ry] of [[34, 34], [734, 34], [34, 190], [734, 190]]) {
    plqCtx.beginPath();
    plqCtx.arc(rx, ry, 5, 0, Math.PI * 2);
    plqCtx.fill();
  }
  plqCtx.fillStyle = '#e7cf9d';
  plqCtx.textAlign = 'center';
  plqCtx.font = 'bold 46px Georgia, serif';
  plqCtx.fillText('AASHISH KUMAR MAHATO', 384, 104);
  plqCtx.fillStyle = '#c7ad7c';
  plqCtx.font = '21px sans-serif';
  plqCtx.fillText('SYSTEMS ENGINEER · KATHMANDU VALLEY TO VELLORE', 384, 152);
  plqCtx.textAlign = 'left';
  const monumentPlaqueTex = register(plqC, true, 1, 1, true);

  // 15. Architectural Parchment Valley Trail Map (Updated with All Nepal & India Landmarks)
  const [mapC, mapCtx] = makeCanvas(512, 320);
  mapCtx.fillStyle = '#d6cab2';
  mapCtx.fillRect(0, 0, 512, 320);
  mapCtx.strokeStyle = '#5e442c';
  mapCtx.lineWidth = 10;
  mapCtx.strokeRect(10, 10, 492, 300);
  mapCtx.strokeStyle = 'rgba(110, 92, 68, 0.22)';
  mapCtx.lineWidth = 1.5;
  for (let ring = 0; ring < 5; ring++) {
    mapCtx.beginPath();
    mapCtx.ellipse(140, 130, 45 + ring * 26, 30 + ring * 18, 0.3, 0, Math.PI * 2);
    mapCtx.stroke();
  }
  // Turquoise Fewa / Tilicho glacial lake on NW map
  mapCtx.fillStyle = '#1f7a8c';
  mapCtx.beginPath();
  mapCtx.ellipse(76, 66, 34, 22, -0.2, 0, Math.PI * 2);
  mapCtx.fill();
  // Glacial river contour
  mapCtx.strokeStyle = '#2d626e';
  mapCtx.lineWidth = 20;
  mapCtx.beginPath();
  mapCtx.moveTo(318, 20);
  mapCtx.bezierCurveTo(288, 110, 348, 210, 318, 300);
  mapCtx.stroke();
  mapCtx.strokeStyle = '#8b4c32';
  mapCtx.lineWidth = 4;
  mapCtx.setLineDash([8, 5]);
  mapCtx.beginPath();
  mapCtx.moveTo(235, 215);
  mapCtx.lineTo(155, 165);
  mapCtx.lineTo(80, 180);
  mapCtx.moveTo(80, 180);
  mapCtx.lineTo(80, 115);
  mapCtx.moveTo(235, 215);
  mapCtx.lineTo(235, 275);
  mapCtx.moveTo(235, 215);
  mapCtx.lineTo(395, 155);
  mapCtx.lineTo(425, 68);
  mapCtx.stroke();
  mapCtx.setLineDash([]);
  const pins: Array<[number, number, string, string]> = [
    [155, 165, '#a6621c', 'PASHUPATI'],
    [76, 178, '#b47b14', 'BOUDHA'],
    [78, 115, '#19759e', 'PUMDIKOT'],
    [78, 250, '#c07119', 'JANAKPUR'],
    [235, 276, '#1c6b4d', 'LUMBINI'],
    [395, 155, '#a84332', 'VIT INDIA'],
    [425, 68, '#5a448c', 'SENSOR LAB'],
    [235, 215, '#7a3e14', 'COURTYARD'],
  ];
  for (const [px, py, col, lbl] of pins) {
    mapCtx.fillStyle = col;
    mapCtx.beginPath();
    mapCtx.arc(px, py, 7, 0, Math.PI * 2);
    mapCtx.fill();
    mapCtx.fillStyle = '#241f18';
    mapCtx.font = 'bold 11px sans-serif';
    mapCtx.fillText(lbl, px + 10, py + 4);
  }
  const valleyMapBoardTex = register(mapC, true, 1, 1, true);

  // 15b. Boudhanath Stupa Limewashed Dome + Saffron Lotus-Petal Garlands
  const [sdC, sdCtx] = makeCanvas(512, 256);
  sdCtx.fillStyle = '#dbd5c8';
  sdCtx.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 400; i++) {
    const sx = (i * 97) % 512;
    const sy = (i * 61) % 256;
    sdCtx.fillStyle = i % 2 === 0 ? 'rgba(170, 162, 148, 0.14)' : 'rgba(232, 226, 214, 0.12)';
    sdCtx.fillRect(sx, sy, 14 + (i % 18), 6 + (i % 8));
  }
  // Golden-saffron lime wash lotus garlands cascading along upper hemisphere
  const petalCount = 8;
  const petalW = 512 / petalCount;
  sdCtx.fillStyle = 'rgba(202, 142, 34, 0.85)';
  for (let p = 0; p < petalCount; p++) {
    const x0 = p * petalW;
    const xm = x0 + petalW * 0.5;
    sdCtx.beginPath();
    sdCtx.moveTo(x0, 0);
    sdCtx.lineTo(x0 + petalW, 0);
    sdCtx.quadraticCurveTo(x0 + petalW * 0.72, 92, xm, 128);
    sdCtx.quadraticCurveTo(x0 + petalW * 0.28, 92, x0, 0);
    sdCtx.closePath();
    sdCtx.fill();
  }
  // Subtle monsoon patina toward base
  const baseGrad = sdCtx.createLinearGradient(0, 175, 0, 256);
  baseGrad.addColorStop(0, 'rgba(92, 86, 74, 0)');
  baseGrad.addColorStop(1, 'rgba(84, 78, 66, 0.28)');
  sdCtx.fillStyle = baseGrad;
  sdCtx.fillRect(0, 175, 512, 81);
  const stupaDomeMap = register(sdC, true, 1, 1, true);

  // 15c. Janaki Mandir Mithila-Rajput Palace Facade (arched bays, saffron jali screens & teal/terracotta trim)
  const [jmC, jmCtx] = makeCanvas(512, 256);
  jmCtx.fillStyle = '#ddd7ca';
  jmCtx.fillRect(0, 0, 512, 256);
  // Mithila teal & terracotta horizontal dado and cornice bands
  jmCtx.fillStyle = '#2d6870';
  jmCtx.fillRect(0, 6, 512, 8);
  jmCtx.fillRect(0, 126, 512, 8);
  jmCtx.fillRect(0, 244, 512, 12);
  jmCtx.fillStyle = '#a84f32';
  jmCtx.fillRect(0, 16, 512, 5);
  jmCtx.fillRect(0, 136, 512, 5);
  // 2 stories x 6 scalloped arched bays
  for (let row = 0; row < 2; row++) {
    const yTop = row === 0 ? 30 : 148;
    const bayH = 88;
    for (let col = 0; col < 6; col++) {
      const bx = 10 + col * 83;
      const bw = 70;
      // Arched masonry frame
      jmCtx.strokeStyle = '#336b73';
      jmCtx.lineWidth = 4;
      jmCtx.beginPath();
      jmCtx.moveTo(bx, yTop + bayH);
      jmCtx.lineTo(bx, yTop + 26);
      jmCtx.quadraticCurveTo(bx + bw * 0.5, yTop - 6, bx + bw, yTop + 26);
      jmCtx.lineTo(bx + bw, yTop + bayH);
      jmCtx.stroke();
      // Terracotta outer floral rib
      jmCtx.strokeStyle = '#b35737';
      jmCtx.lineWidth = 2;
      jmCtx.strokeRect(bx - 4, yTop - 2, bw + 8, bayH + 4);
      // Interior: Saffron Jali screen on upper story, dark colonnade/arches on ground
      jmCtx.fillStyle = row === 0 ? '#c98827' : '#25211e';
      jmCtx.beginPath();
      jmCtx.moveTo(bx + 7, yTop + bayH - 4);
      jmCtx.lineTo(bx + 7, yTop + 29);
      jmCtx.quadraticCurveTo(bx + bw * 0.5, yTop + 4, bx + bw - 7, yTop + 29);
      jmCtx.lineTo(bx + bw - 7, yTop + bayH - 4);
      jmCtx.closePath();
      jmCtx.fill();
      if (row === 0) {
        // Fine jali lattice dots
        jmCtx.strokeStyle = '#6c4211';
        jmCtx.lineWidth = 1.5;
        for (let lx = bx + 14; lx < bx + bw - 10; lx += 9) {
          jmCtx.beginPath();
          jmCtx.moveTo(lx, yTop + 24);
          jmCtx.lineTo(lx, yTop + bayH - 6);
          jmCtx.stroke();
        }
        for (let ly = yTop + 28; ly < yTop + bayH - 8; ly += 9) {
          jmCtx.beginPath();
          jmCtx.moveTo(bx + 9, ly);
          jmCtx.lineTo(bx + bw - 9, ly);
          jmCtx.stroke();
        }
      }
    }
  }
  const janakiFacadeMap = register(jmC, true, 1, 1, true);

  // 15d. Pashupatinath Entrance Tympanum & Sacred Om Banner
  const [pgC, pgCtx] = makeCanvas(256, 256);
  pgCtx.fillStyle = '#d4c9af';
  pgCtx.fillRect(0, 0, 256, 256);
  // Sky-blue Shiva Himalayan mural panel
  pgCtx.fillStyle = '#3276a8';
  pgCtx.fillRect(28, 36, 200, 152);
  // Snowy mountain silhouette inside mural
  pgCtx.fillStyle = '#d8e0e8';
  pgCtx.beginPath();
  pgCtx.moveTo(28, 134);
  pgCtx.lineTo(74, 84);
  pgCtx.lineTo(128, 114);
  pgCtx.lineTo(182, 78);
  pgCtx.lineTo(228, 134);
  pgCtx.lineTo(228, 188);
  pgCtx.lineTo(28, 188);
  pgCtx.closePath();
  pgCtx.fill();
  // Golden Trishul + Crescent + Om motif centered
  pgCtx.strokeStyle = '#d49a2a';
  pgCtx.lineWidth = 7;
  pgCtx.beginPath();
  pgCtx.moveTo(128, 56);
  pgCtx.lineTo(128, 168);
  pgCtx.moveTo(104, 72);
  pgCtx.quadraticCurveTo(104, 96, 128, 96);
  pgCtx.quadraticCurveTo(152, 96, 152, 72);
  pgCtx.stroke();
  pgCtx.fillStyle = '#d49a2a';
  pgCtx.font = 'bold 28px Georgia, serif';
  pgCtx.textAlign = 'center';
  pgCtx.fillText('ॐ', 128, 30);
  // Sacred green & gold temple lintel plaque bar
  pgCtx.fillStyle = '#1f3622';
  pgCtx.fillRect(18, 198, 220, 44);
  pgCtx.strokeStyle = '#c89b32';
  pgCtx.lineWidth = 3;
  pgCtx.strokeRect(20, 200, 216, 40);
  pgCtx.fillStyle = '#e8c468';
  pgCtx.font = 'bold 16px Georgia, serif';
  pgCtx.fillText('PASHUPATINATH · NEPAL', 128, 226);
  pgCtx.textAlign = 'left';
  const pashupatiGateMap = register(pgC, true, 1, 1, true);

  // 15e. Pumdikot Shiva Tiger-Skin Throne Texture
  const [tpC, tpCtx] = makeCanvas(256, 256);
  tpCtx.fillStyle = '#b86c22';
  tpCtx.fillRect(0, 0, 256, 256);
  tpCtx.fillStyle = '#1f1610';
  for (let y = 12; y < 250; y += 26) {
    tpCtx.beginPath();
    tpCtx.moveTo(0, y);
    tpCtx.bezierCurveTo(64, y - 10, 128, y + 12, 256, y - 4);
    tpCtx.lineTo(256, y + 7);
    tpCtx.bezierCurveTo(128, y + 20, 64, y - 2, 0, y + 8);
    tpCtx.closePath();
    tpCtx.fill();
  }
  tpCtx.fillStyle = 'rgba(224, 186, 122, 0.35)';
  tpCtx.fillRect(92, 0, 72, 256);
  const tigerPeltMap = register(tpC, true, 2, 1);

  // 15f. Lumbini Veined Marble Walkway & Ceremonial Threshold Tiles (full PBR: map + normal + rough + ao)
  const [mwC, mwCtx] = makeCanvas(256, 256);
  const [mwHC, mwHCtx] = makeCanvas(256, 256);
  const [mwRC, mwRCtx] = makeCanvas(256, 256);
  mwCtx.fillStyle = '#8b887e';
  mwCtx.fillRect(0, 0, 256, 256);
  mwHCtx.fillStyle = '#3c3c3c';
  mwHCtx.fillRect(0, 0, 256, 256);
  mwRCtx.fillStyle = '#d4d4d4';
  mwRCtx.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const v = ((r * 17 + c * 29) % 14) - 7;
      mwCtx.fillStyle = `rgb(${194 + v}, ${190 + v}, ${180 + v})`;
      const tx = c * 64 + 2;
      const ty = r * 64 + 2;
      mwCtx.fillRect(tx, ty, 60, 60);
      mwCtx.strokeStyle = 'rgba(130, 128, 122, 0.28)';
      mwCtx.lineWidth = 1.5;
      mwCtx.beginPath();
      mwCtx.moveTo(tx + 6, ty + 14 + (c % 3) * 10);
      mwCtx.bezierCurveTo(tx + 24, ty + 30, tx + 40, ty + 18, tx + 54, ty + 46);
      mwCtx.stroke();

      const hVal = 196 + ((r * 19 + c * 31) % 24);
      mwHCtx.fillStyle = `rgb(${hVal},${hVal},${hVal})`;
      mwHCtx.fillRect(tx + 1, ty + 1, 58, 58);

      const rVal = 104 + ((r * 23 + c * 17) % 34);
      mwRCtx.fillStyle = `rgb(${rVal},${rVal},${rVal})`;
      mwRCtx.fillRect(tx, ty, 60, 60);
    }
  }
  const marbleWalkMap = register(mwC, true, 2, 5);
  const marbleWalkNormal = register(heightToNormalCanvas(mwHC, 2.1), false, 2, 5);
  const marbleWalkRough = register(mwRC, false, 2, 5);
  const marbleWalkAo = register(heightToAoCanvas(mwHC, 2, 1.75), false, 2, 5);

  // 16. Natural Neutral Soft Contact Shadow Disc
  const [shadowC, shadowCtx] = makeCanvas(128, 128);
  const grad = shadowCtx.createRadialGradient(64, 64, 4, 64, 64, 62);
  grad.addColorStop(0, 'rgba(18, 20, 22, 0.56)');
  grad.addColorStop(0.55, 'rgba(18, 20, 22, 0.22)');
  grad.addColorStop(1, 'rgba(18, 20, 22, 0)');
  shadowCtx.fillStyle = grad;
  shadowCtx.fillRect(0, 0, 128, 128);
  const contactShadowMap = register(shadowC, true, 1, 1, true);

  // 17. Screens + Detailed Roman Numeral Heritage Clock Dial
  const aniflowScreenMap = register(
    createTerminalCanvas(
      'ANIFLOW · LOCAL STUDIO',
      [
        '01. YOLOv8 panel detect  [OK]',
        '02. OCR bubble extract   [OK]',
        '03. Ollama script synth  [RUN]',
        '04. Edge TTS voiceover   [READY]',
        'github.com/aashish254/Aniflow',
      ],
      '#38bdf8',
    ),
    true,
    1,
    1,
    true,
  );

  const agentScreenMap = register(
    createTerminalCanvas(
      'LOCAL-FIRST INFRA · OSS',
      [
        '$ burn --watch --local',
        'token-spend: $0.00 (Local LLM)',
        'sandbox: strict-fs-isolation',
        'upstream: laya · openclaw · orca',
        'telemetry: zero-cloud-export',
      ],
      '#10b981',
    ),
    true,
    1,
    1,
    true,
  );

  const [clockC, clockCtx] = makeCanvas(256, 256);
  clockCtx.fillStyle = '#d4cbb8';
  clockCtx.beginPath();
  clockCtx.arc(128, 128, 122, 0, Math.PI * 2);
  clockCtx.fill();
  clockCtx.strokeStyle = '#5c4123';
  clockCtx.lineWidth = 10;
  clockCtx.stroke();
  clockCtx.strokeStyle = '#8b7355';
  clockCtx.lineWidth = 2;
  clockCtx.beginPath();
  clockCtx.arc(128, 128, 108, 0, Math.PI * 2);
  clockCtx.stroke();
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    clockCtx.save();
    clockCtx.translate(128, 128);
    clockCtx.rotate(a);
    clockCtx.fillStyle = i % 5 === 0 ? '#1b1d22' : '#645c50';
    clockCtx.fillRect(i % 5 === 0 ? -2.5 : -1, -106, i % 5 === 0 ? 5 : 2, i % 5 === 0 ? 16 : 8);
    clockCtx.restore();
  }
  const numerals = ['XII', 'III', 'VI', 'IX'];
  clockCtx.fillStyle = '#1b1d22';
  clockCtx.font = 'bold 20px Georgia, serif';
  clockCtx.textAlign = 'center';
  clockCtx.textBaseline = 'middle';
  clockCtx.fillText(numerals[0], 128, 52);
  clockCtx.fillText(numerals[1], 204, 128);
  clockCtx.fillText(numerals[2], 128, 204);
  clockCtx.fillText(numerals[3], 52, 128);
  clockCtx.textAlign = 'left';
  clockCtx.textBaseline = 'alphabetic';
  clockCtx.strokeStyle = '#181a1f';
  clockCtx.lineWidth = 7;
  clockCtx.lineCap = 'round';
  clockCtx.beginPath();
  clockCtx.moveTo(128, 128);
  clockCtx.lineTo(128, 60);
  clockCtx.moveTo(128, 128);
  clockCtx.lineTo(176, 148);
  clockCtx.stroke();
  const clockFaceMap = register(clockC, true, 1, 1, true);

  const createSignTexture = (title: string, subtitle: string, accent: string) => {
    const [sc, sctx] = makeCanvas(512, 192);
    const bgGrad = sctx.createLinearGradient(0, 0, 512, 192);
    bgGrad.addColorStop(0, '#1e2124');
    bgGrad.addColorStop(0.5, '#25292d');
    bgGrad.addColorStop(1, '#181a1d');
    sctx.fillStyle = bgGrad;
    sctx.fillRect(0, 0, 512, 192);

    // Subtle stone grain speckle
    for (let i = 0; i < 420; i++) {
      const gx = (Math.sin(i * 73.1) * 0.5 + 0.5) * 512;
      const gy = (Math.cos(i * 41.7) * 0.5 + 0.5) * 192;
      sctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.08)';
      sctx.fillRect(gx, gy, 2, 2);
    }

    // Carved double bronze & gold-leaf border with corner ornaments
    sctx.strokeStyle = '#9c783c';
    sctx.lineWidth = 6;
    sctx.strokeRect(10, 10, 492, 172);
    sctx.strokeStyle = accent;
    sctx.globalAlpha = 0.65;
    sctx.lineWidth = 2;
    sctx.strokeRect(20, 20, 472, 152);
    sctx.globalAlpha = 1;

    for (const [cx, cy] of [
      [28, 28],
      [484, 28],
      [28, 164],
      [484, 164],
    ]) {
      sctx.fillStyle = '#c89e4c';
      sctx.beginPath();
      sctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
      sctx.fill();
    }

    sctx.textAlign = 'center';
    sctx.fillStyle = '#f5ead6';
    sctx.font = 'bold 34px Georgia, serif';
    sctx.fillText(title.slice(0, 24), 256, 78);

    // Engraved divider flourish
    sctx.strokeStyle = '#b98e46';
    sctx.lineWidth = 2;
    sctx.beginPath();
    sctx.moveTo(96, 98);
    sctx.lineTo(416, 98);
    sctx.stroke();

    sctx.fillStyle = '#d3c8b4';
    sctx.font = '20px Georgia, serif';
    sctx.fillText(subtitle.slice(0, 34), 256, 134);
    sctx.textAlign = 'left';
    return register(sc, true, 1, 1, true);
  };

  // 18. Photogrammetry-Grade Carved Basalt Stone & Aged Patina Bronze PBR Maps
  const [basC, basCtx] = makeCanvas(512, 512);
  const [basHC, basHCtx] = makeCanvas(512, 512);
  const [basRC, basRCtx] = makeCanvas(512, 512);
  basCtx.fillStyle = '#5a6068';
  basCtx.fillRect(0, 0, 512, 512);
  basHCtx.fillStyle = '#808080';
  basHCtx.fillRect(0, 0, 512, 512);
  basRCtx.fillStyle = '#b8b8b8';
  basRCtx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 2400; i++) {
    const x = (i * 193 + (i % 19) * 37) % 512;
    const y = (i * 317 + (i % 23) * 43) % 512;
    const w = 3 + (i % 14);
    const h = 2 + (i % 6);
    const tone = i % 5 === 0 ? 'rgba(32,36,42,0.22)' : i % 3 === 0 ? 'rgba(130,136,142,0.16)' : 'rgba(68,74,80,0.18)';
    basCtx.fillStyle = tone;
    basCtx.fillRect(x, y, w, h);
    basHCtx.fillStyle = i % 2 === 0 ? 'rgba(215,215,215,0.22)' : 'rgba(42,42,42,0.24)';
    basHCtx.fillRect(x, y, w, h);
    basRCtx.fillStyle = i % 4 === 0 ? 'rgba(225,225,225,0.24)' : 'rgba(145,145,145,0.2)';
    basRCtx.fillRect(x, y, w, h);
  }
  // Fine chisel-tool ridges & mineral quartz veins
  for (let v = 0; v < 42; v++) {
    const sx = (v * 97) % 512;
    const sy = (v * 149) % 512;
    basCtx.strokeStyle = v % 3 === 0 ? 'rgba(182,188,192,0.22)' : 'rgba(38,42,46,0.28)';
    basCtx.lineWidth = 1.4;
    basCtx.beginPath();
    basCtx.moveTo(sx, sy);
    basCtx.bezierCurveTo(sx + 28, sy + 18, sx + 54, sy - 14, sx + 86, sy + 12);
    basCtx.stroke();
    basHCtx.strokeStyle = 'rgba(210,210,210,0.22)';
    basHCtx.lineWidth = 1.4;
    basHCtx.beginPath();
    basHCtx.moveTo(sx, sy);
    basHCtx.bezierCurveTo(sx + 28, sy + 18, sx + 54, sy - 14, sx + 86, sy + 12);
    basHCtx.stroke();
  }
  const basaltCarvedMap = register(basC, true, 2, 2);
  const basaltCarvedNormal = register(heightToNormalCanvas(basHC, 2.6), false, 2, 2);
  const basaltCarvedRough = register(basRC, false, 2, 2);
  const basaltCarvedAo = register(heightToAoCanvas(basHC, 3, 1.6), false, 2, 2);

  const [brzC, brzCtx] = makeCanvas(512, 512);
  const [brzHC, brzHCtx] = makeCanvas(512, 512);
  const [brzRC, brzRCtx] = makeCanvas(512, 512);
  brzCtx.fillStyle = '#9e7634';
  brzCtx.fillRect(0, 0, 512, 512);
  brzHCtx.fillStyle = '#808080';
  brzHCtx.fillRect(0, 0, 512, 512);
  brzRCtx.fillStyle = '#5c5c5c';
  brzRCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1600; i++) {
    const x = (i * 227 + (i % 13) * 29) % 512;
    const y = (i * 353 + (i % 17) * 31) % 512;
    const rad = 2 + (i % 9);
    brzCtx.fillStyle =
      i % 9 === 0
        ? 'rgba(72,118,98,0.16)'
        : i % 3 === 0
          ? 'rgba(222,184,96,0.18)'
          : 'rgba(66,44,16,0.18)';
    brzCtx.beginPath();
    brzCtx.arc(x, y, rad, 0, Math.PI * 2);
    brzCtx.fill();
    brzHCtx.fillStyle = i % 2 === 0 ? 'rgba(180,180,180,0.2)' : 'rgba(85,85,85,0.2)';
    brzHCtx.beginPath();
    brzHCtx.arc(x, y, rad, 0, Math.PI * 2);
    brzHCtx.fill();
    brzRCtx.fillStyle = i % 9 === 0 ? 'rgba(195,195,195,0.35)' : 'rgba(65,65,65,0.25)';
    brzRCtx.beginPath();
    brzRCtx.arc(x, y, rad, 0, Math.PI * 2);
    brzRCtx.fill();
  }
  const agedBronzeMap = register(brzC, true, 2, 2);
  const agedBronzeNormal = register(heightToNormalCanvas(brzHC, 2.0), false, 2, 2);
  const agedBronzeRough = register(brzRC, false, 2, 2);

  // 19. High-Detail Alpha-Cutout Botanical Tree Canopy & Blossom Sprays (512x512)
  const makeSeedRand = (s: number) => {
    let state = s >>> 0;
    return () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
  };

  const drawFoliageTwigs = (ctx: CanvasRenderingContext2D, twigCol: string, rand: () => number) => {
    ctx.strokeStyle = twigCol;
    ctx.lineCap = 'round';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(256, 504);
    ctx.quadraticCurveTo(246, 360, 256, 175);
    ctx.stroke();
    for (let b = 0; b < 7; b++) {
      const yStart = 430 - b * 44;
      const dir = b % 2 === 0 ? -1 : 1;
      const len = 86 + rand() * 70;
      ctx.lineWidth = 4.5 - b * 0.35;
      ctx.beginPath();
      ctx.moveTo(254, yStart);
      ctx.quadraticCurveTo(256 + dir * len * 0.55, yStart - 28, 256 + dir * len, yStart - 64 - rand() * 24);
      ctx.stroke();
    }
  };

  const drawLeafSprayCard = (
    seed: number,
    twigCol: string,
    palette: string[],
    leafCount: number,
    leafLen: number,
    leafWid: number,
    serrated = false,
  ): THREE.CanvasTexture => {
    const [c, ctx] = makeCanvas(512, 512);
    ctx.clearRect(0, 0, 512, 512);
    const rand = makeSeedRand(seed);
    drawFoliageTwigs(ctx, twigCol, rand);

    for (let i = 0; i < leafCount; i++) {
      const t = i / leafCount;
      const radius = Math.pow(rand(), 0.56) * 206;
      const ang = rand() * Math.PI * 2;
      const cx = 256 + Math.cos(ang) * radius;
      const cy = 248 + Math.sin(ang) * radius * 0.96;
      const lAngle = ang + (rand() - 0.5) * 1.1;
      const sc = (0.72 + rand() * 0.58) * (1.0 - radius / 580);
      const col = palette[Math.floor(rand() * palette.length)];

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(lAngle);
      ctx.scale(sc, sc);
      ctx.fillStyle = col;
      ctx.beginPath();
      if (serrated) {
        // 5-lobed maple-like silhouette
        ctx.moveTo(0, -leafLen);
        ctx.lineTo(leafWid * 0.55, -leafLen * 0.38);
        ctx.lineTo(leafWid * 1.15, -leafLen * 0.45);
        ctx.lineTo(leafWid * 0.62, 0);
        ctx.lineTo(leafWid * 0.9, leafLen * 0.46);
        ctx.lineTo(0, leafLen * 0.28);
        ctx.lineTo(-leafWid * 0.9, leafLen * 0.46);
        ctx.lineTo(-leafWid * 0.62, 0);
        ctx.lineTo(-leafWid * 1.15, -leafLen * 0.45);
        ctx.lineTo(-leafWid * 0.55, -leafLen * 0.38);
      } else {
        ctx.moveTo(0, -leafLen);
        ctx.quadraticCurveTo(leafWid, -leafLen * 0.15, 0, leafLen * 0.55);
        ctx.quadraticCurveTo(-leafWid, -leafLen * 0.15, 0, -leafLen);
      }
      ctx.closePath();
      ctx.fill();

      // Subtle midrib vein highlight
      ctx.strokeStyle = t > 0.5 ? 'rgba(255,255,230,0.18)' : 'rgba(15,28,12,0.22)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, leafLen * 0.42);
      ctx.lineTo(0, -leafLen * 0.85);
      ctx.stroke();
      ctx.restore();
    }
    return register(c, true, 1, 1, true);
  };

  // 19a. Japanese Sakura (5-petal notched cherry blossom cluster + dark cherry twigs)
  const [sakC, sakCtx] = makeCanvas(512, 512);
  sakCtx.clearRect(0, 0, 512, 512);
  const sakRand = makeSeedRand(9101);
  drawFoliageTwigs(sakCtx, '#3e2926', sakRand);
  const sakuraCols = ['#f7c8d6', '#f4b4c8', '#fadde6', '#ee9eb8', '#fceaf0'];
  // A few young bronze-green cherry leaves peeking between blossoms
  for (let i = 0; i < 36; i++) {
    const r = Math.pow(sakRand(), 0.58) * 185;
    const a = sakRand() * Math.PI * 2;
    sakCtx.save();
    sakCtx.translate(256 + Math.cos(a) * r, 246 + Math.sin(a) * r * 0.92);
    sakCtx.rotate(a);
    sakCtx.fillStyle = '#5c7c44';
    sakCtx.beginPath();
    sakCtx.ellipse(0, 0, 9, 22, 0, 0, Math.PI * 2);
    sakCtx.fill();
    sakCtx.restore();
  }
  for (let i = 0; i < 120; i++) {
    const r = Math.pow(sakRand(), 0.54) * 204;
    const a = sakRand() * Math.PI * 2;
    const bx = 256 + Math.cos(a) * r;
    const by = 248 + Math.sin(a) * r * 0.94;
    const sc = 0.65 + sakRand() * 0.65;
    const pCol = sakuraCols[Math.floor(sakRand() * sakuraCols.length)];
    sakCtx.save();
    sakCtx.translate(bx, by);
    sakCtx.rotate(sakRand() * Math.PI * 2);
    sakCtx.scale(sc, sc);
    for (let p = 0; p < 5; p++) {
      sakCtx.save();
      sakCtx.rotate((p / 5) * Math.PI * 2);
      sakCtx.fillStyle = pCol;
      sakCtx.beginPath();
      sakCtx.moveTo(0, 0);
      sakCtx.quadraticCurveTo(11, -14, 5, -24);
      sakCtx.lineTo(0, -19);
      sakCtx.lineTo(-5, -24);
      sakCtx.quadraticCurveTo(-11, -14, 0, 0);
      sakCtx.closePath();
      sakCtx.fill();
      sakCtx.restore();
    }
    sakCtx.fillStyle = '#b9365f';
    sakCtx.beginPath();
    sakCtx.arc(0, 0, 4.2, 0, Math.PI * 2);
    sakCtx.fill();
    sakCtx.fillStyle = '#ffe599';
    sakCtx.beginPath();
    sakCtx.arc(0, 0, 2.0, 0, Math.PI * 2);
    sakCtx.fill();
    sakCtx.restore();
  }
  const sakuraBlossomMap = register(sakC, true, 1, 1, true);

  // 19b. Maple, Broadleaf, Birch
  const mapleFoliageMap = drawLeafSprayCard(
    9102,
    '#443025',
    ['#b83a24', '#cf4e27', '#df7626', '#9b2a1e', '#e5922e'],
    130,
    24,
    20,
    true,
  );
  const broadleafFoliageMap = drawLeafSprayCard(
    9103,
    '#493a2b',
    ['#36592e', '#466c36', '#567e3e', '#2d4b25', '#688d46'],
    155,
    25,
    15,
    false,
  );
  const birchLeafMap = drawLeafSprayCard(
    9104,
    '#7c766d',
    ['#c5a838', '#d9bc46', '#92a43c', '#e6cb5c', '#748e36'],
    150,
    20,
    13,
    false,
  );

  // 19c. Jacaranda & Gulmohar
  const jacarandaBloomMap = drawLeafSprayCard(
    9105,
    '#4e4034',
    ['#755bc7', '#8970d9', '#6148b2', '#9d87e6', '#4c6d36'],
    165,
    18,
    12,
    false,
  );
  const gulmoharBloomMap = drawLeafSprayCard(
    9106,
    '#4a3a2a',
    ['#dc411e', '#ee5a24', '#f27c22', '#bf2c16', '#466f30'],
    165,
    19,
    13,
    false,
  );

  // 19d. Weeping Willow Hanging Frond Curtain Card
  const [wilC, wilCtx] = makeCanvas(512, 512);
  wilCtx.clearRect(0, 0, 512, 512);
  const wilRand = makeSeedRand(9107);
  const willowCols = ['#527839', '#638945', '#446830', '#73984f', '#81a456'];
  for (let s = 0; s < 13; s++) {
    const sx = 54 + s * 33 + (wilRand() - 0.5) * 14;
    const strandLen = 360 + wilRand() * 130;
    wilCtx.strokeStyle = '#5f6835';
    wilCtx.lineWidth = 2.4;
    wilCtx.beginPath();
    wilCtx.moveTo(sx, 14);
    wilCtx.quadraticCurveTo(sx + (wilRand() - 0.5) * 28, strandLen * 0.5, sx + (wilRand() - 0.5) * 22, 14 + strandLen);
    wilCtx.stroke();
    for (let y = 24; y < 14 + strandLen; y += 16) {
      for (const side of [-1, 1]) {
        wilCtx.save();
        wilCtx.translate(sx + side * 6, y);
        wilCtx.rotate(side * 0.42 + (wilRand() - 0.5) * 0.25);
        wilCtx.fillStyle = willowCols[Math.floor(wilRand() * willowCols.length)];
        wilCtx.beginPath();
        wilCtx.ellipse(0, 12, 3.6, 15, 0, 0, Math.PI * 2);
        wilCtx.fill();
        wilCtx.restore();
      }
    }
  }
  const willowFrondMap = register(wilC, true, 1, 1, true);

  // 19e. Silver Birch White Bark with Dark Horizontal Lenticels
  const [sbC, sbCtx] = makeCanvas(256, 512);
  sbCtx.fillStyle = '#dddad2';
  sbCtx.fillRect(0, 0, 256, 512);
  const sbRand = makeSeedRand(9108);
  for (let i = 0; i < 160; i++) {
    const lx = sbRand() * 230;
    const ly = sbRand() * 508;
    const lw = 16 + sbRand() * 54;
    const lh = 2 + sbRand() * 5;
    sbCtx.fillStyle = sbRand() > 0.25 ? 'rgba(42,38,35,0.72)' : 'rgba(92,84,74,0.45)';
    sbCtx.fillRect(lx, ly, lw, lh);
  }
  const barkSilverBirchMap = register(sbC, true, 1, 3);

  return {
    janaki,
    meadowMap,
    meadowNormal,
    meadowRough,
    meadowAo,
    pebbleMap,
    pebbleNormal,
    pebbleRough,
    pebbleAo,
    cobbleMap,
    cobbleNormal,
    cobbleRough,
    cobbleAo,
    brickMap,
    brickNormal,
    brickRough,
    brickAo,
    sandstoneMap,
    sandstoneNormal,
    sandstoneRough,
    sandstoneAo,
    roofTileMap,
    roofTileNormal,
    woodMap,
    woodNormal,
    barkMap,
    barkNormal,
    pineCanopyMap,
    pineNeedlesMap,
    palmFrondMap,
    rockMap,
    rockNormal,
    rockRough,
    rockAo,
    waterNormal,
    crateFaceMap,
    crateNormal,
    windowGlassMap,
    dhakaMap,
    stupaEyesMap,
    stupaDomeMap,
    janakiFacadeMap,
    pashupatiGateMap,
    tigerPeltMap,
    marbleWalkMap,
    marbleWalkNormal,
    marbleWalkRough,
    marbleWalkAo,
    monumentPlaqueTex,
    valleyMapBoardTex,
    contactShadowMap,
    aniflowScreenMap,
    agentScreenMap,
    clockFaceMap,
    basaltCarvedMap,
    basaltCarvedNormal,
    basaltCarvedRough,
    basaltCarvedAo,
    agedBronzeMap,
    agedBronzeNormal,
    agedBronzeRough,
    sakuraBlossomMap,
    mapleFoliageMap,
    broadleafFoliageMap,
    jacarandaBloomMap,
    willowFrondMap,
    gulmoharBloomMap,
    birchLeafMap,
    barkSilverBirchMap,
    createSignTexture,
    dispose: () => {
      janaki.dispose();
      textures.forEach((t) => t.dispose());
    },
  };
}

function createTerminalCanvas(
  header: string,
  lines: string[],
  accent: string,
): HTMLCanvasElement {
  const [canvas, ctx] = makeCanvas(512, 320);
  ctx.fillStyle = '#0c121a';
  ctx.fillRect(0, 0, 512, 320);

  ctx.strokeStyle = '#2d3b4e';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, 492, 300);

  ctx.fillStyle = '#182433';
  ctx.fillRect(10, 10, 492, 46);
  ctx.fillStyle = accent;
  ctx.fillRect(10, 54, 492, 3);

  ctx.fillStyle = '#e5ecf4';
  ctx.font = 'bold 21px monospace';
  ctx.fillText(header, 24, 40);

  ctx.font = '18px monospace';
  lines.forEach((line, idx) => {
    ctx.fillStyle = idx === lines.length - 1 ? accent : '#cfd9e6';
    ctx.fillText(line, 24, 96 + idx * 42);
  });

  return canvas;
}

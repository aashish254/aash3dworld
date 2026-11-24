import * as THREE from 'three';
import { JanakiMandirTextures, createJanakiMandirTextures } from './janakiMandirTextures';

export interface ProceduralTextureSet {
  janaki: JanakiMandirTextures;
  meadowMap: THREE.CanvasTexture;
  meadowNormal: THREE.CanvasTexture;
  meadowRough: THREE.CanvasTexture;
  cobbleMap: THREE.CanvasTexture;
  cobbleNormal: THREE.CanvasTexture;
  cobbleRough: THREE.CanvasTexture;
  brickMap: THREE.CanvasTexture;
  brickNormal: THREE.CanvasTexture;
  brickRough: THREE.CanvasTexture;
  sandstoneMap: THREE.CanvasTexture;
  sandstoneNormal: THREE.CanvasTexture;
  sandstoneRough: THREE.CanvasTexture;
  roofTileMap: THREE.CanvasTexture;
  roofTileNormal: THREE.CanvasTexture;
  woodMap: THREE.CanvasTexture;
  woodNormal: THREE.CanvasTexture;
  barkMap: THREE.CanvasTexture;
  barkNormal: THREE.CanvasTexture;
  pineCanopyMap: THREE.CanvasTexture;
  pineNeedlesMap: THREE.CanvasTexture;
  palmFrondMap: THREE.CanvasTexture;
  rockNormal: THREE.CanvasTexture;
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
  monumentPlaqueTex: THREE.CanvasTexture;
  valleyMapBoardTex: THREE.CanvasTexture;
  contactShadowMap: THREE.CanvasTexture;
  aniflowScreenMap: THREE.CanvasTexture;
  agentScreenMap: THREE.CanvasTexture;
  clockFaceMap: THREE.CanvasTexture;
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

  // 1. Natural Valley Loam, Moss & Grass Turf (desaturated real-world foliage & soil base)
  const [meadowC, meadowCtx] = makeCanvas(512, 512);
  const [meadowHC, meadowHCtx] = makeCanvas(512, 512);
  const [meadowRC, meadowRCtx] = makeCanvas(512, 512);
  meadowCtx.fillStyle = '#4f5e3b';
  meadowCtx.fillRect(0, 0, 512, 512);
  meadowHCtx.fillStyle = '#808080';
  meadowHCtx.fillRect(0, 0, 512, 512);
  meadowRCtx.fillStyle = '#dadada';
  meadowRCtx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 650; i++) {
    const cx = (i * 197 + (i % 13) * 41) % 512;
    const cy = (i * 313 + (i % 17) * 29) % 512;
    const r = 10 + (i % 24);
    meadowCtx.fillStyle =
      i % 3 === 0
        ? 'rgba(56, 70, 42, 0.22)'
        : i % 3 === 1
          ? 'rgba(92, 86, 62, 0.16)'
          : 'rgba(104, 120, 74, 0.18)';
    meadowCtx.beginPath();
    meadowCtx.arc(cx, cy, r, 0, Math.PI * 2);
    meadowCtx.fill();

    const hVal = i % 2 === 0 ? 115 : 142;
    meadowHCtx.fillStyle = `rgba(${hVal},${hVal},${hVal},0.18)`;
    meadowHCtx.beginPath();
    meadowHCtx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
    meadowHCtx.fill();
  }
  for (let i = 0; i < 14000; i++) {
    const x = (i * 173 + (i % 19) * 31) % 512;
    const y = (i * 257 + (i % 23) * 43) % 512;
    const shade = (i * 29) % 5;
    meadowCtx.fillStyle =
      shade === 0
        ? 'rgba(48, 60, 34, 0.55)'
        : shade === 1
          ? 'rgba(72, 88, 50, 0.52)'
          : shade === 2
            ? 'rgba(94, 108, 64, 0.45)'
            : shade === 3
              ? 'rgba(102, 92, 68, 0.42)'
              : 'rgba(116, 128, 82, 0.36)';
    meadowCtx.fillRect(x, y, 1.4, 3.5);
    const b = 96 + ((i * 37) % 110);
    meadowHCtx.fillStyle = `rgb(${b},${b},${b})`;
    meadowHCtx.fillRect(x, y, 1.6, 3.5);
    const rv = 195 + ((i * 17) % 55);
    meadowRCtx.fillStyle = `rgb(${rv},${rv},${rv})`;
    meadowRCtx.fillRect(x, y, 2, 3);
  }
  const meadowMap = register(meadowC, true, 36, 36);
  const meadowNormal = register(heightToNormalCanvas(meadowHC, 1.8), false, 36, 36);
  const meadowRough = register(meadowRC, false, 36, 36);

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

  // 7b. Organic Alpine Gneiss Rock Micro-Crag Normal Map (zero rectangular masonry seams)
  const [rockHC, rockHCtx] = makeCanvas(256, 256);
  rockHCtx.fillStyle = '#808080';
  rockHCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 650; i++) {
    const rx = (i * 89 + (i % 11) * 23) % 256;
    const ry = (i * 137 + (i % 17) * 19) % 256;
    const rw = 4 + (i % 16);
    const rh = 3 + ((i * 7) % 10);
    const v = 90 + ((i * 31) % 85);
    rockHCtx.fillStyle = `rgba(${v},${v},${v},0.42)`;
    rockHCtx.save();
    rockHCtx.translate(rx, ry);
    rockHCtx.rotate((i % 7) * 0.45);
    rockHCtx.fillRect(-rw / 2, -rh / 2, rw, rh);
    rockHCtx.restore();
  }
  const rockNormal = register(heightToNormalCanvas(rockHC, 2.2), false, 10, 4);

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

  // 15f. Lumbini Veined Marble Walkway Tiles (Matte neutral warm stone)
  const [mwC, mwCtx] = makeCanvas(256, 256);
  mwCtx.fillStyle = '#8b887e';
  mwCtx.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const v = ((r * 17 + c * 29) % 14) - 7;
      mwCtx.fillStyle = `rgb(${194 + v}, ${190 + v}, ${180 + v})`;
      const tx = c * 64 + 2;
      const ty = r * 64 + 2;
      mwCtx.fillRect(tx, ty, 60, 60);
      mwCtx.strokeStyle = 'rgba(130, 128, 122, 0.25)';
      mwCtx.lineWidth = 1.5;
      mwCtx.beginPath();
      mwCtx.moveTo(tx + 6, ty + 14 + (c % 3) * 10);
      mwCtx.bezierCurveTo(tx + 24, ty + 30, tx + 40, ty + 18, tx + 54, ty + 46);
      mwCtx.stroke();
    }
  }
  const marbleWalkMap = register(mwC, true, 2, 5);

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

  return {
    janaki,
    meadowMap,
    meadowNormal,
    meadowRough,
    cobbleMap,
    cobbleNormal,
    cobbleRough,
    brickMap,
    brickNormal,
    brickRough,
    sandstoneMap,
    sandstoneNormal,
    sandstoneRough,
    roofTileMap,
    roofTileNormal,
    woodMap,
    woodNormal,
    barkMap,
    barkNormal,
    pineCanopyMap,
    pineNeedlesMap,
    palmFrondMap,
    rockNormal,
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
    monumentPlaqueTex,
    valleyMapBoardTex,
    contactShadowMap,
    aniflowScreenMap,
    agentScreenMap,
    clockFaceMap,
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

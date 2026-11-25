import * as THREE from 'three';
import { BuddhaMaterials, createMonumentalSeatedBuddha } from './lumbiniBuddhaSculpt';

const _m4 = new THREE.Matrix4();
const _v3 = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _e = new THREE.Euler();

/**
 * Generates a realistic 512x512 grey/sandstone square-slab forecourt tile texture
 * with subtle weathered mortar joints and mineral speckle (guarded for Node tests).
 */
function createForecourtTileTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#c5bfb2';
  ctx.fillRect(0, 0, size, size);

  const tiles = 8;
  const tilePx = size / tiles;
  let seed = 41927;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };

  for (let ty = 0; ty < tiles; ty++) {
    for (let tx = 0; tx < tiles; tx++) {
      const shade = Math.round(182 + (rand() - 0.5) * 26);
      const warm = Math.round(shade - 6 + rand() * 8);
      const cool = Math.round(shade - 12 + rand() * 6);
      ctx.fillStyle = `rgb(${shade}, ${warm}, ${cool})`;
      ctx.fillRect(tx * tilePx + 2, ty * tilePx + 2, tilePx - 4, tilePx - 4);

      // Subtle mineral & leaf-shadow mottling
      for (let k = 0; k < 14; k++) {
        const sx = tx * tilePx + 3 + rand() * (tilePx - 6);
        const sy = ty * tilePx + 3 + rand() * (tilePx - 6);
        const sr = 2 + rand() * 8;
        ctx.fillStyle = rand() > 0.5 ? 'rgba(95, 92, 84, 0.10)' : 'rgba(232, 228, 218, 0.12)';
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Crisp stone mortar grid lines
  ctx.strokeStyle = 'rgba(72, 70, 64, 0.48)';
  ctx.lineWidth = 2.5;
  for (let i = 0; i <= tiles; i++) {
    const p = i * tilePx;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Creates a square-with-chamfered-corners 2D shape centered at (0, 0)
 * matching the octagonal-chamfered terrace plan of the Lokamani Cula Pagoda.
 */
function createChamferedSquareShape(halfExtent: number, chamfer: number): THREE.Shape {
  const h = halfExtent;
  const c = Math.min(chamfer, h * 0.45);
  const s = new THREE.Shape();
  s.moveTo(-h + c, -h);
  s.lineTo(h - c, -h);
  s.lineTo(h, -h + c);
  s.lineTo(h, h - c);
  s.lineTo(h - c, h);
  s.lineTo(-h + c, h);
  s.lineTo(-h, h - c);
  s.lineTo(-h, -h + c);
  s.closePath();
  return s;
}

/**
 * Extrudes a horizontal chamfered terrace tier sitting with bottom at y = 0 and top at y = height.
 */
function createChamferedTierGeometry(
  halfExtent: number,
  chamfer: number,
  height: number,
  bevelSize = 0.035,
): THREE.ExtrudeGeometry {
  const shape = createChamferedSquareShape(halfExtent - bevelSize, chamfer);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.04, height - bevelSize * 2),
    bevelEnabled: true,
    bevelThickness: bevelSize,
    bevelSize,
    bevelSegments: 2,
    curveSegments: 1,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, bevelSize, 0);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Sculpted Burmese Sein-Taung (tiered lotus-leaf flame crenellation crest) with flanking
 * side-bud curls used along the continuous golden gallery parapet behind the picket fence.
 */
function createSeinTaungCrestGeometry(): THREE.ExtrudeGeometry {
  const s = new THREE.Shape();
  s.moveTo(-0.14, 0);
  s.lineTo(0.14, 0);
  s.lineTo(0.16, 0.12);
  // Lower flanking curl buds
  s.quadraticCurveTo(0.22, 0.20, 0.13, 0.27);
  s.quadraticCurveTo(0.18, 0.36, 0.09, 0.44);
  s.quadraticCurveTo(0.12, 0.54, 0.045, 0.62);
  s.lineTo(0.0, 0.76);
  s.lineTo(-0.045, 0.62);
  s.quadraticCurveTo(-0.12, 0.54, -0.09, 0.44);
  s.quadraticCurveTo(-0.18, 0.36, -0.13, 0.27);
  s.quadraticCurveTo(-0.22, 0.20, -0.16, 0.12);
  s.closePath();

  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.065,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.016,
    bevelSegments: 2,
  });
  geo.translate(0, 0, -0.0325);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Multi-pronged Burmese Kanok corner flame ornament / Ban-Ya pinnacle mounted on the
 * white & golden stepped terraces.
 */
function createKanokFlameFinialGeometry(scale = 1): THREE.ExtrudeGeometry {
  const s = new THREE.Shape();
  s.moveTo(-0.15 * scale, 0);
  s.lineTo(0.15 * scale, 0);
  s.lineTo(0.21 * scale, 0.16 * scale);
  s.quadraticCurveTo(0.30 * scale, 0.29 * scale, 0.15 * scale, 0.41 * scale);
  s.quadraticCurveTo(0.22 * scale, 0.56 * scale, 0.075 * scale, 0.69 * scale);
  s.lineTo(0, 0.92 * scale);
  s.lineTo(-0.075 * scale, 0.69 * scale);
  s.quadraticCurveTo(-0.22 * scale, 0.56 * scale, -0.15 * scale, 0.41 * scale);
  s.quadraticCurveTo(-0.30 * scale, 0.29 * scale, -0.21 * scale, 0.16 * scale);
  s.closePath();

  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.09 * scale,
    bevelEnabled: true,
    bevelThickness: 0.022 * scale,
    bevelSize: 0.02 * scale,
    bevelSegments: 2,
  });
  geo.translate(0, 0, -0.045 * scale);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Sweeping curved corner Makara/Kanok horn acroterion lining the chamfered corners of
 * the white stepped terraces (distinct upturned corner wings in real photos).
 */
function createCornerWingGeometry(): THREE.ExtrudeGeometry {
  const s = new THREE.Shape();
  s.moveTo(-0.32, 0);
  s.lineTo(0.22, 0);
  s.quadraticCurveTo(0.34, 0.18, 0.26, 0.44);
  s.quadraticCurveTo(0.36, 0.62, 0.18, 0.86);
  s.lineTo(0.14, 1.08);
  s.quadraticCurveTo(0.02, 0.88, -0.06, 0.64);
  s.quadraticCurveTo(-0.22, 0.44, -0.32, 0.18);
  s.closePath();

  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.11,
    bevelEnabled: true,
    bevelThickness: 0.022,
    bevelSize: 0.02,
    bevelSegments: 2,
  });
  geo.translate(0, 0, -0.055);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Ornate sculpted Burmese Pyatthat / Mok flame pediment arch crowning each of the 4 cardinal
 * entrance portals with cusped trefoil opening & stepped Kanok filigree silhouette.
 */
function createBurmeseArchPedimentGeometry(): THREE.ExtrudeGeometry {
  const outer = new THREE.Shape();
  outer.moveTo(-1.38, 0);
  outer.lineTo(-1.08, 0);
  // Inner cusped trefoil arch opening cutout
  outer.lineTo(-1.08, 1.76);
  outer.quadraticCurveTo(-1.02, 2.24, -0.62, 2.38);
  outer.quadraticCurveTo(-0.24, 2.48, 0.0, 2.84);
  outer.quadraticCurveTo(0.24, 2.48, 0.62, 2.38);
  outer.quadraticCurveTo(1.02, 2.24, 1.08, 1.76);
  outer.lineTo(1.08, 0);
  outer.lineTo(1.38, 0);
  // Outer multi-tiered Kanok flame gable silhouette
  outer.lineTo(1.50, 1.76);
  outer.quadraticCurveTo(1.68, 2.04, 1.38, 2.28);
  outer.quadraticCurveTo(1.50, 2.58, 1.04, 2.78);
  outer.quadraticCurveTo(1.08, 3.08, 0.62, 3.26);
  outer.quadraticCurveTo(0.56, 3.56, 0.22, 3.74);
  outer.lineTo(0.0, 4.14);
  outer.lineTo(-0.22, 3.74);
  outer.quadraticCurveTo(-0.56, 3.56, -0.62, 3.26);
  outer.quadraticCurveTo(-1.08, 3.08, -1.04, 2.78);
  outer.quadraticCurveTo(-1.50, 2.58, -1.38, 2.28);
  outer.quadraticCurveTo(-1.68, 2.04, -1.50, 1.76);
  outer.closePath();

  const geo = new THREE.ExtrudeGeometry(outer, {
    depth: 0.42,
    bevelEnabled: true,
    bevelThickness: 0.048,
    bevelSize: 0.042,
    bevelSegments: 2,
  });
  geo.translate(0, 0, -0.21);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Inner crisp white moulded trefoil arch frame nested directly inside the carved gold pediment.
 */
function createInnerTrefoilArchLinerGeometry(): THREE.ExtrudeGeometry {
  const outer = new THREE.Shape();
  outer.moveTo(-1.12, 0);
  outer.lineTo(-0.98, 0);
  outer.lineTo(-0.98, 1.74);
  outer.quadraticCurveTo(-0.92, 2.16, -0.56, 2.28);
  outer.quadraticCurveTo(-0.20, 2.38, 0.0, 2.70);
  outer.quadraticCurveTo(0.20, 2.38, 0.56, 2.28);
  outer.quadraticCurveTo(0.92, 2.16, 0.98, 1.74);
  outer.lineTo(0.98, 0);
  outer.lineTo(1.12, 0);
  outer.lineTo(1.12, 1.80);
  outer.quadraticCurveTo(1.06, 2.28, 0.64, 2.42);
  outer.quadraticCurveTo(0.26, 2.52, 0.0, 2.86);
  outer.quadraticCurveTo(-0.26, 2.52, -0.64, 2.42);
  outer.quadraticCurveTo(-1.06, 2.28, -1.12, 1.80);
  outer.closePath();

  const geo = new THREE.ExtrudeGeometry(outer, {
    depth: 0.34,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.025,
    bevelSegments: 2,
  });
  geo.translate(0, 0, -0.17);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds an ultra-detailed, real-life scaled Myanmar Golden Temple (Lokamani Cula Pagoda)
 * modeled faithfully from the Lumbini site photographs:
 * - 16.8m x 16.8m weathered grey-stone tiled forecourt with dark-slate runner channels & inlaid compass medallions
 * - Flanking stepped azure-blue corner offering pedestals with golden guardian Buddhas, brass & ceramic bowls
 * - Left & right 6.8m white steel floodlight masts with green/white banner brackets + right crimson notice post & curved gooseneck lamp
 * - 3 West-side white concrete garden bollards with crimson caps
 * - 13.84m chamfered-octagonal white-steel picket fence with subdivided bay posts, spear tips, white-framed crimson tablets & crimson gate sills
 * - Continuous double-ribbed golden Sein-Taung leaf-flame parapet cresting (~152 crests)
 * - 3 stepped white masonry gallery terraces with overhang cornices & curved Kanok corner horn wings
 * - 4 cardinal multi-layered gold Pyatthat flame-arch entrance portals with stepped masonry saddle roofs, white trefoil arch liners,
 *   delicate white wrought-iron diamond lattice gates with 3-petal center rosettes, and recessed golden seated Buddha
 * - 7 stepped golden Pyitsaya terraces with recessed shadow reveals, corner miniature zedi pinnacles & dense Ban-Ya flame crests
 * - Broad Shwedagon-profile bell stupa with 32-petal Kya-Hmauk/Kya-Lan lotus waist, Yin-Ban jewel lappets, 18-ring Phaung-Yit spire,
 *   flared lotus cup, lacy 7-tier openwork Hti with 24 exterior filigree ringlets, 28 hanging Swe-Le bells, wind vane & Sein-Bu diamond orb.
 */
export function buildMyanmarGoldenPagoda(
  whiteStuccoMat: THREE.Material,
  goldMat: THREE.Material,
  crimsonMat: THREE.Material,
  chunarStoneMat?: THREE.Material,
  warmBronzeMat?: THREE.Material,
  darkMetalMat?: THREE.Material,
  flameGlowMat?: THREE.Material,
  heroMats?: BuddhaMaterials,
): THREE.Group {
  const g = new THREE.Group();
  g.name = 'MyanmarGoldenPagoda';

  const tileTex = createForecourtTileTexture();
  if (tileTex) {
    g.userData.disposeExtraTextures = () => {
      tileTex.dispose();
    };
  }

  const baseStoneSrc = chunarStoneMat instanceof THREE.MeshStandardMaterial ? chunarStoneMat : null;
  const forecourtMat = new THREE.MeshStandardMaterial({
    map: tileTex ?? baseStoneSrc?.map ?? null,
    normalMap: baseStoneSrc?.normalMap ?? null,
    normalScale: new THREE.Vector2(0.45, 0.45),
    roughnessMap: baseStoneSrc?.roughnessMap ?? null,
    color: tileTex ? 0xe4e0d8 : 0xc2bcb0,
    roughness: 0.84,
    metalness: 0.04,
  });
  const bronzeMat =
    warmBronzeMat ??
    new THREE.MeshStandardMaterial({ color: 0xb98234, roughness: 0.34, metalness: 0.84 });
  const ironMat =
    darkMetalMat ??
    new THREE.MeshStandardMaterial({ color: 0x30363e, roughness: 0.52, metalness: 0.72 });
  const azurePedestalMat = new THREE.MeshStandardMaterial({
    color: 0x1d72c2,
    roughness: 0.58,
    metalness: 0.06,
  });
  const azurePaleTrimMat = new THREE.MeshStandardMaterial({
    color: 0x76b2e5,
    roughness: 0.64,
    metalness: 0.04,
  });
  const whiteSteelGateMat = new THREE.MeshStandardMaterial({
    color: 0xf6f7f9,
    roughness: 0.32,
    metalness: 0.28,
  });
  const goldSrc = goldMat instanceof THREE.MeshStandardMaterial ? goldMat : null;
  const brightGoldMat = new THREE.MeshPhysicalMaterial({
    map: goldSrc?.map ?? null,
    normalMap: goldSrc?.normalMap ?? null,
    normalScale: goldSrc ? goldSrc.normalScale.clone().multiplyScalar(0.70) : new THREE.Vector2(0.42, 0.42),
    roughnessMap: goldSrc?.roughnessMap ?? null,
    color: 0xffdf48,
    roughness: 0.23,
    metalness: 0.74,
    clearcoat: 0.44,
    clearcoatRoughness: 0.16,
    emissive: 0x7c5408,
    emissiveIntensity: 0.22,
  });
  const deepGoldMat = new THREE.MeshStandardMaterial({
    map: goldSrc?.map ?? null,
    normalMap: goldSrc?.normalMap ?? null,
    normalScale: goldSrc ? goldSrc.normalScale.clone() : new THREE.Vector2(0.55, 0.55),
    roughnessMap: goldSrc?.roughnessMap ?? null,
    color: 0xdf9f1f,
    roughness: 0.28,
    metalness: 0.78,
    emissive: 0x523404,
    emissiveIntensity: 0.16,
  });
  const darkSlateStoneMat = new THREE.MeshStandardMaterial({
    color: 0x3b414a,
    roughness: 0.78,
    metalness: 0.08,
  });
  const bannerGreenMat = new THREE.MeshStandardMaterial({
    color: 0x168049,
    roughness: 0.58,
    metalness: 0.08,
  });
  const ceramicYellowMat = new THREE.MeshStandardMaterial({
    color: 0xd9a83c,
    roughness: 0.48,
    metalness: 0.06,
  });
  const mossTuftMat = new THREE.MeshStandardMaterial({
    color: 0x2f6b24,
    roughness: 0.88,
    metalness: 0.02,
  });
  const lampGlowMat =
    flameGlowMat ??
    new THREE.MeshStandardMaterial({
      color: 0xfff5cb,
      emissive: 0xffb347,
      emissiveIntensity: 2.0,
      roughness: 0.18,
    });

  // =========================================================================
  // 1. 16.8m x 16.8m TILED FORECOURT PLAZA, DARK SLATE RUNNERS & MEDALLIONS
  // =========================================================================
  const plazaSlab = new THREE.Mesh(new THREE.BoxGeometry(16.8, 0.14, 16.8), forecourtMat);
  plazaSlab.position.y = 0.0; // top surface at y = +0.07 local (+0.10 in Lumbini = flush with brick walk!)
  plazaSlab.receiveShadow = true;
  plazaSlab.userData.nonCollidable = true;
  g.add(plazaSlab);

  // Outer perimeter curb + paired dark-slate axial runner channels (distinct in photo foreground!)
  for (const [cx, cz, sx, sz] of [
    [0, 8.32, 16.8, 0.16],
    [0, -8.32, 16.8, 0.16],
    [8.32, 0, 0.16, 16.8],
    [-8.32, 0, 0.16, 16.8],
    // Paired South/East/West/North gate axial dark stone runner borders
    [-1.42, 7.62, 0.11, 1.56],
    [1.42, 7.62, 0.11, 1.56],
    [-1.42, -7.62, 0.11, 1.56],
    [1.42, -7.62, 0.11, 1.56],
    [7.62, -1.42, 1.56, 0.11],
    [7.62, 1.42, 1.56, 0.11],
    [-7.62, -1.42, 1.56, 0.11],
    [-7.62, 1.42, 1.56, 0.11],
  ] as Array<[number, number, number, number]>) {
    const curb = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.025, sz), darkSlateStoneMat);
    curb.position.set(cx, 0.072, cz);
    curb.receiveShadow = true;
    curb.userData.nonCollidable = true;
    g.add(curb);
  }

  // Inlaid 8-point compass-star medallions at the plaza corners & gate axes
  const medRingGeo = new THREE.RingGeometry(0.42, 0.64, 24);
  medRingGeo.rotateX(-Math.PI / 2);
  const medStarBarGeo = new THREE.BoxGeometry(1.06, 0.012, 0.11);
  for (const [mx, mz] of [
    [-6.65, 7.72],
    [6.65, 7.72],
    [-6.65, -7.72],
    [6.65, -7.72],
    [0, 7.78],
    [-7.78, 0],
    [7.78, 0],
  ] as Array<[number, number]>) {
    const ring = new THREE.Mesh(medRingGeo, darkSlateStoneMat);
    ring.position.set(mx, 0.074, mz);
    ring.userData.nonCollidable = true;
    g.add(ring);
    for (let k = 0; k < 4; k++) {
      const ray = new THREE.Mesh(medStarBarGeo, bronzeMat);
      ray.position.set(mx, 0.076, mz);
      ray.rotation.y = (k * Math.PI) / 4;
      ray.userData.nonCollidable = true;
      g.add(ray);
    }
  }

  // =========================================================================
  // 2. CHAMFERED OCTAGONAL FENCE: PICKETS, SPEAR TIPS & FRAMED CRIMSON TABLETS
  // =========================================================================
  const fenceHalf = 6.92;
  const fenceChamfer = 1.85;
  const cCorner = fenceHalf - fenceChamfer; // 5.07

  const perimeterSegments: Array<[number, number, number, number, boolean]> = [
    [-cCorner, fenceHalf, cCorner, fenceHalf, true], // South front
    [cCorner, fenceHalf, fenceHalf, cCorner, false], // SE chamfer
    [fenceHalf, cCorner, fenceHalf, -cCorner, true], // East
    [fenceHalf, -cCorner, cCorner, -fenceHalf, false], // NE chamfer
    [cCorner, -fenceHalf, -cCorner, -fenceHalf, true], // North
    [-cCorner, -fenceHalf, -fenceHalf, -cCorner, false], // NW chamfer
    [-fenceHalf, -cCorner, -fenceHalf, cCorner, true], // West
    [-fenceHalf, cCorner, -cCorner, fenceHalf, false], // SW chamfer
  ];

  const picketMatrices: THREE.Matrix4[] = [];
  const spearMatrices: THREE.Matrix4[] = [];
  const postMatrices: THREE.Matrix4[] = [];
  const tabletMatrices: THREE.Matrix4[] = [];

  const pushSegment = (
    ax: number,
    az: number,
    bx: number,
    bz: number,
    gapHalf: number,
  ) => {
    const dx = bx - ax;
    const dz = bz - az;
    const len = Math.hypot(dx, dz);
    const rotY = Math.atan2(-dz, dx);
    const nx = -dz / len;
    const nz = dx / len;

    const buildSubRun = (t0: number, t1: number) => {
      const subLen = (t1 - t0) * len;
      if (subLen < 0.25) return;
      const midT = (t0 + t1) * 0.5;
      const mx = ax + dx * midT;
      const mz = az + dz * midT;

      // White masonry plinth base + lower white wall backing behind steel bars
      const curb = new THREE.Mesh(new THREE.BoxGeometry(subLen, 0.20, 0.22), whiteStuccoMat);
      curb.position.set(mx, 0.17, mz);
      curb.rotation.y = rotY;
      curb.castShadow = true;
      curb.receiveShadow = true;

      const backWhiteWall = new THREE.Mesh(new THREE.BoxGeometry(subLen - 0.04, 0.72, 0.07), whiteStuccoMat);
      backWhiteWall.position.set(mx - nx * 0.04, 0.62, mz - nz * 0.04);
      backWhiteWall.rotation.y = rotY;
      backWhiteWall.receiveShadow = true;

      // Lower & Top crisp white tubular rails
      for (const ry of [0.30, 1.15]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(subLen, 0.048, 0.065), whiteSteelGateMat);
        rail.position.set(mx + nx * 0.055, ry, mz + nz * 0.055);
        rail.rotation.y = rotY;
        g.add(rail);
      }
      g.add(curb, backWhiteWall);

      // Subdivide long runs into crisp framed bays with square posts & recessed crimson tablets
      const bayCount = Math.max(1, Math.round(subLen / 1.9));
      for (let b = 0; b <= bayCount; b++) {
        const bt = t0 + (b / bayCount) * (t1 - t0);
        const px = ax + dx * bt;
        const pz = az + dz * bt;
        _v3.set(px + nx * 0.02, 0.66, pz + nz * 0.02);
        _q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
        _s.set(0.11, 1.18, 0.12);
        postMatrices.push(new THREE.Matrix4().compose(_v3, _q, _s));

        if (b < bayCount) {
          const bMid = t0 + ((b + 0.5) / bayCount) * (t1 - t0);
          const bxPos = ax + dx * bMid;
          const bzPos = az + dz * bMid;
          const bayLen = subLen / bayCount;
          _v3.set(bxPos + nx * 0.002, 0.64, bzPos + nz * 0.002);
          _q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
          _s.set(Math.max(0.45, bayLen - 0.28), 0.50, 0.04);
          tabletMatrices.push(new THREE.Matrix4().compose(_v3, _q, _s));
        }
      }

      // Dense white vertical pickets every ~0.145m + miniature spear tips above top rail
      const pCount = Math.max(3, Math.floor(subLen / 0.145));
      for (let i = 1; i < pCount; i++) {
        const lt = t0 + (i / pCount) * (t1 - t0);
        const px = ax + dx * lt;
        const pz = az + dz * lt;
        _v3.set(px + nx * 0.058, 0.74, pz + nz * 0.058);
        _q.identity();
        _s.set(1, 1, 1);
        picketMatrices.push(new THREE.Matrix4().compose(_v3, _q, _s));

        _v3.set(px + nx * 0.058, 1.22, pz + nz * 0.058);
        spearMatrices.push(new THREE.Matrix4().compose(_v3, _q, _s));
      }
    };

    if (gapHalf > 0 && len > gapHalf * 2.5) {
      const gapT = gapHalf / len;
      buildSubRun(0, 0.5 - gapT);
      buildSubRun(0.5 + gapT, 1);
    } else {
      buildSubRun(0, 1);
    }
  };

  for (const [x1, z1, x2, z2, hasGate] of perimeterSegments) {
    pushSegment(x1, z1, x2, z2, hasGate ? 1.34 : 0);
  }

  const picketGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.90, 6);
  const picketInst = new THREE.InstancedMesh(picketGeo, whiteSteelGateMat, picketMatrices.length);
  picketInst.castShadow = true;
  picketMatrices.forEach((m, idx) => picketInst.setMatrixAt(idx, m));
  picketInst.instanceMatrix.needsUpdate = true;
  picketInst.computeBoundingSphere();
  g.add(picketInst);

  const spearGeo = new THREE.ConeGeometry(0.022, 0.08, 4);
  const spearInst = new THREE.InstancedMesh(spearGeo, whiteSteelGateMat, spearMatrices.length);
  spearMatrices.forEach((m, idx) => spearInst.setMatrixAt(idx, m));
  spearInst.instanceMatrix.needsUpdate = true;
  spearInst.computeBoundingSphere();
  g.add(spearInst);

  const postGeo = new THREE.BoxGeometry(1, 1, 1);
  const postInst = new THREE.InstancedMesh(postGeo, whiteStuccoMat, postMatrices.length);
  postInst.castShadow = true;
  postMatrices.forEach((m, idx) => postInst.setMatrixAt(idx, m));
  postInst.instanceMatrix.needsUpdate = true;
  postInst.computeBoundingSphere();
  g.add(postInst);

  const tabletGeo = new THREE.BoxGeometry(1, 1, 1);
  const tabletInst = new THREE.InstancedMesh(tabletGeo, crimsonMat, tabletMatrices.length);
  tabletMatrices.forEach((m, idx) => tabletInst.setMatrixAt(idx, m));
  tabletInst.instanceMatrix.needsUpdate = true;
  tabletInst.computeBoundingSphere();
  g.add(tabletInst);

  // =========================================================================
  // 3. THREE STEPPED WHITE TERRACES, SEIN-TAUNG PARAPET & KANOK CORNER WINGS
  // =========================================================================
  const whiteTierSpecs: Array<{ half: number; chamfer: number; y: number; h: number }> = [
    { half: 6.26, chamfer: 1.66, y: 0.07, h: 0.92 }, // Base white gallery deck (top 0.99)
    { half: 5.56, chamfer: 1.48, y: 0.99, h: 0.88 }, // Mid white terrace (top 1.87)
    { half: 4.88, chamfer: 1.30, y: 1.87, h: 0.88 }, // Upper white terrace (top 2.75)
  ];

  for (let i = 0; i < whiteTierSpecs.length; i++) {
    const spec = whiteTierSpecs[i];
    const slab = new THREE.Mesh(
      createChamferedTierGeometry(spec.half, spec.chamfer, spec.h, 0.04),
      whiteStuccoMat,
    );
    slab.position.y = spec.y;
    slab.castShadow = true;
    slab.receiveShadow = true;
    g.add(slab);

    // Crisp overhanging white cornice ledge casting deep horizontal shadow lines
    const ledge = new THREE.Mesh(
      createChamferedTierGeometry(spec.half + 0.095, spec.chamfer + 0.02, 0.105, 0.02),
      whiteStuccoMat,
    );
    ledge.position.y = spec.y + spec.h - 0.10;
    ledge.castShadow = true;
    ledge.receiveShadow = true;
    g.add(ledge);
  }

  // Thin golden plinth moulding ring right where the 7 golden Pyitsaya terraces meet Tier-3 white deck
  const baseGoldSkirt = new THREE.Mesh(
    createChamferedTierGeometry(4.42, 1.15, 0.08, 0.015),
    deepGoldMat,
  );
  baseGoldSkirt.position.y = 2.74;
  g.add(baseGoldSkirt);

  // Continuous golden Sein-Taung leaf-flame cresting along Tier-1 gallery parapet (tight 0.27m spacing + central ribs!)
  const crestMatrices: THREE.Matrix4[] = [];
  const crestRibMatrices: THREE.Matrix4[] = [];
  const parapetHalf = 6.14;
  const parapetChamfer = 1.60;
  const pC = parapetHalf - parapetChamfer;
  const parapetEdges: Array<[number, number, number, number]> = [
    [-pC, parapetHalf, pC, parapetHalf],
    [pC, parapetHalf, parapetHalf, pC],
    [parapetHalf, pC, parapetHalf, -pC],
    [parapetHalf, -pC, pC, -parapetHalf],
    [pC, -parapetHalf, -pC, -parapetHalf],
    [-pC, -parapetHalf, -parapetHalf, -pC],
    [-parapetHalf, -pC, -parapetHalf, pC],
    [-parapetHalf, pC, -pC, parapetHalf],
  ];
  for (const [ax, az, bx, bz] of parapetEdges) {
    const dx = bx - ax;
    const dz = bz - az;
    const len = Math.hypot(dx, dz);
    const rotY = Math.atan2(-dz, dx);
    const nx = -dz / len;
    const nz = dx / len;
    const count = Math.max(5, Math.floor(len / 0.27));
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const px = ax + dx * t;
      const pz = az + dz * t;
      if ((Math.abs(px) < 1.38 && Math.abs(pz) > 5.8) || (Math.abs(pz) < 1.38 && Math.abs(px) > 5.8)) {
        continue;
      }
      _v3.set(px, 0.98, pz);
      _q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
      _s.set(1.0, 1.0, 1.0);
      crestMatrices.push(new THREE.Matrix4().compose(_v3, _q, _s));

      _v3.set(px + nx * 0.04, 1.30, pz + nz * 0.04);
      _s.set(0.035, 0.44, 0.04);
      crestRibMatrices.push(new THREE.Matrix4().compose(_v3, _q, _s));
    }
  }
  const crestGeo = createSeinTaungCrestGeometry();
  const crestInst = new THREE.InstancedMesh(crestGeo, brightGoldMat, crestMatrices.length);
  crestInst.castShadow = true;
  crestMatrices.forEach((m, idx) => crestInst.setMatrixAt(idx, m));
  crestInst.instanceMatrix.needsUpdate = true;
  crestInst.computeBoundingSphere();
  g.add(crestInst);

  const crestRibInst = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    deepGoldMat,
    crestRibMatrices.length,
  );
  crestRibMatrices.forEach((m, idx) => crestRibInst.setMatrixAt(idx, m));
  crestRibInst.instanceMatrix.needsUpdate = true;
  crestRibInst.computeBoundingSphere();
  g.add(crestRibInst);

  // Sweeping corner Kanok horn wings flanking every chamfered edge on the white stepped terraces
  const cornerWingGeo = createCornerWingGeometry();
  const cornerWingMatrices: THREE.Matrix4[] = [];
  for (const [half, chamfer, ky, sc] of [
    [6.10, 1.58, 0.98, 0.76],
    [5.40, 1.40, 1.86, 0.72],
    [4.74, 1.24, 2.74, 0.68],
  ] as Array<[number, number, number, number]>) {
    const cOff = half - chamfer;
    const edgeVerts: Array<[number, number, number]> = [
      [cOff + 0.14, half - 0.14, -Math.PI * 0.25],
      [half - 0.14, cOff + 0.14, -Math.PI * 0.25],
      [half - 0.14, -(cOff + 0.14), Math.PI * 0.25],
      [cOff + 0.14, -(half - 0.14), Math.PI * 0.25],
      [-(cOff + 0.14), -(half - 0.14), Math.PI * 0.75],
      [-(half - 0.14), -(cOff + 0.14), Math.PI * 0.75],
      [-(half - 0.14), cOff + 0.14, -Math.PI * 0.75],
      [-(cOff + 0.14), half - 0.14, -Math.PI * 0.75],
    ];
    for (const [wx, wz, rot] of edgeVerts) {
      _v3.set(wx, ky, wz);
      _q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rot);
      _s.set(sc, sc * 1.06, sc);
      cornerWingMatrices.push(new THREE.Matrix4().compose(_v3, _q, _s));
    }
  }
  const cornerWingInst = new THREE.InstancedMesh(
    cornerWingGeo,
    brightGoldMat,
    cornerWingMatrices.length,
  );
  cornerWingInst.castShadow = true;
  cornerWingMatrices.forEach((m, idx) => cornerWingInst.setMatrixAt(idx, m));
  cornerWingInst.instanceMatrix.needsUpdate = true;
  cornerWingInst.computeBoundingSphere();
  g.add(cornerWingInst);

  // =========================================================================
  // 4. FOUR CARDINAL PYATTHAT PORTALS, WHITE TREFOIL LINERS & LATTICE GATES
  // =========================================================================
  const archPedimentGeo = createBurmeseArchPedimentGeometry();
  const innerTrefoilGeo = createInnerTrefoilArchLinerGeometry();
  const smallCrocketGeo = createKanokFlameFinialGeometry(0.45);
  const latticeBarGeo = new THREE.BoxGeometry(0.028, 1.84, 0.022);
  const latticeMatrices: THREE.Matrix4[] = [];

  for (let sideIdx = 0; sideIdx < 4; sideIdx++) {
    const portalAngle = (sideIdx * Math.PI) / 2;
    const portal = new THREE.Group();
    portal.rotation.y = portalAngle;

    const zFront = 6.08;

    // Stepped stone threshold + vivid crimson masonry gate sill visible at entrance base in real photo!
    const threshold = new THREE.Mesh(new THREE.BoxGeometry(3.25, 0.22, 1.15), whiteStuccoMat);
    threshold.position.set(0, 0.18, zFront + 0.12);
    threshold.receiveShadow = true;
    const crimsonSill = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.16, 0.36), crimsonMat);
    crimsonSill.position.set(0, 0.24, zFront + 0.18);
    crimsonSill.receiveShadow = true;
    portal.add(threshold, crimsonSill);

    // Solid white masonry porch vestibule + stepped gabled saddle backing seamlessly tying into Tier-3 wall
    for (const [px, py, pz, sx, sy, sz] of [
      [-1.30, 1.52, zFront - 0.92, 0.34, 2.74, 1.78],
      [1.30, 1.52, zFront - 0.92, 0.34, 2.74, 1.78],
      [0, 2.74, zFront - 0.95, 2.86, 0.38, 1.74],
      [0, 3.12, zFront - 0.68, 2.04, 0.42, 1.18],
      [0, 3.48, zFront - 0.44, 1.24, 0.36, 0.72],
    ] as Array<[number, number, number, number, number, number]>) {
      const block = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), whiteStuccoMat);
      block.position.set(px, py, pz);
      block.castShadow = true;
      block.receiveShadow = true;
      portal.add(block);
    }

    // Layered ornate gold Burmese flame-pediment + relief pilasters & side flame crockets
    const pediment = new THREE.Mesh(archPedimentGeo, brightGoldMat);
    pediment.position.set(0, 0.28, zFront);
    pediment.castShadow = true;
    portal.add(pediment);

    for (const sx of [-1.24, 1.24]) {
      const pilaster = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.02, 0.46), deepGoldMat);
      pilaster.position.set(sx, 1.29, zFront + 0.04);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.52), brightGoldMat);
      cap.position.set(sx, 2.28, zFront + 0.05);
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.52), deepGoldMat);
      base.position.set(sx, 0.36, zFront + 0.05);
      portal.add(pilaster, cap, base);
    }

    // Raised carved gold flame crockets stepping up both flanks of the pediment gable
    for (const [cx, cy, tilt] of [
      [-1.46, 2.12, 0.32],
      [1.46, 2.12, -0.32],
      [-1.18, 2.74, 0.24],
      [1.18, 2.74, -0.24],
      [-0.78, 3.24, 0.18],
      [0.78, 3.24, -0.18],
    ] as Array<[number, number, number]>) {
      const crocket = new THREE.Mesh(smallCrocketGeo, brightGoldMat);
      crocket.position.set(cx, cy, zFront + 0.08);
      crocket.rotation.z = tilt;
      portal.add(crocket);
    }

    // Central carved circular golden crest medallion + crowning kalasa pinnacle
    const archMedallion = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.14, 18), deepGoldMat);
    archMedallion.rotation.x = Math.PI / 2;
    archMedallion.position.set(0, 3.30, zFront + 0.20);
    const archCenterJewel = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 1), brightGoldMat);
    archCenterJewel.position.set(0, 3.30, zFront + 0.27);
    portal.add(archMedallion, archCenterJewel);

    // Crisp white moulded inner trefoil arch liner + subtle hairline crimson shadow trim (NO boxy red rectangle!)
    const whiteLiner = new THREE.Mesh(innerTrefoilGeo, whiteStuccoMat);
    whiteLiner.position.set(0, 0.28, zFront + 0.04);
    const crimsonArchTrim = new THREE.Mesh(innerTrefoilGeo, crimsonMat);
    crimsonArchTrim.scale.set(1.04, 1.02, 0.92);
    crimsonArchTrim.position.set(0, 0.28, zFront + 0.01);
    portal.add(whiteLiner, crimsonArchTrim);

    // Deep recessed white sanctuary alcove behind the white iron gate
    const innerAlcove = new THREE.Mesh(new THREE.BoxGeometry(2.26, 2.72, 0.22), whiteStuccoMat);
    innerAlcove.position.set(0, 1.62, zFront - 1.12);
    const alcoveFloor = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.22, 1.06), whiteStuccoMat);
    alcoveFloor.position.set(0, 0.29, zFront - 0.56);
    portal.add(innerAlcove, alcoveFloor);

    // Warm sanctuary shrine glow & miniature golden Buddha visible cleanly BEHIND the white lattice gate
    if (sideIdx === 0 && heroMats) {
      const miniBuddha = createMonumentalSeatedBuddha(heroMats, {
        scale: 0.25,
        pose: 'bhumisparsha',
        withNagaCanopy: false,
        withOfferingLamps: false,
      });
      miniBuddha.position.set(0, 0.42, zFront - 0.58);
      portal.add(miniBuddha);

      const portalGlow = new THREE.PointLight(0xffcb78, 1.5, 10, 1.5);
      portalGlow.position.set(0, 2.05, zFront - 0.14);
      portal.add(portalGlow);
    }

    // Intricate white wrought-iron gate: lower & upper frames, diamond lattice, arched top bars & 3-petal white rosette!
    const gateFrameBot = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.055, 0.045), whiteSteelGateMat);
    gateFrameBot.position.set(0, 0.34, zFront + 0.08);
    const gateFrameMid = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.045, 0.045), whiteSteelGateMat);
    gateFrameMid.position.set(0, 1.98, zFront + 0.08);

    // Welded 3-circle floral filigree centerpiece rosette matching the real gate photo!
    for (const [rx, ry, rr] of [
      [0, 1.32, 0.16],
      [-0.18, 1.12, 0.14],
      [0.18, 1.12, 0.14],
    ] as Array<[number, number, number]>) {
      const petalDisc = new THREE.Mesh(
        new THREE.CylinderGeometry(rr, rr, 0.045, 16),
        whiteSteelGateMat,
      );
      petalDisc.rotation.x = Math.PI / 2;
      petalDisc.position.set(rx, ry, zFront + 0.09);
      portal.add(petalDisc);
    }
    portal.add(gateFrameBot, gateFrameMid);

    // Vertical gate stiles + diagonal diamond lattice bars + upper arch vertical bars
    for (let b = -4; b <= 4; b++) {
      for (const tilt of [-0.60, 0.60]) {
        const localPos = new THREE.Vector3(b * 0.19, 1.16, zFront + 0.08);
        localPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), portalAngle);
        _e.set(0, portalAngle, tilt);
        _q.setFromEuler(_e);
        _s.set(1, 0.90, 1);
        latticeMatrices.push(new THREE.Matrix4().compose(localPos, _q, _s));
      }
      // Vertical top-arch gate spindles filling the upper curved fanlight
      if (Math.abs(b) <= 3) {
        const barH = 0.56 - Math.abs(b) * 0.09;
        const vBar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.014, 0.014, barH, 6),
          whiteSteelGateMat,
        );
        vBar.position.set(b * 0.22, 1.98 + barH * 0.5, zFront + 0.08);
        portal.add(vBar);
      }
    }

    g.add(portal);
  }

  const latticeInst = new THREE.InstancedMesh(
    latticeBarGeo,
    whiteSteelGateMat,
    latticeMatrices.length,
  );
  latticeMatrices.forEach((m, idx) => latticeInst.setMatrixAt(idx, m));
  latticeInst.instanceMatrix.needsUpdate = true;
  latticeInst.computeBoundingSphere();
  g.add(latticeInst);

  // =========================================================================
  // 5. SEVEN STEPPED GOLDEN PYITSAYA TERRACES + ZEDI PINNACLES & BAN-YA CRESTS
  // =========================================================================
  const pyitsayaCount = 7;
  const pyitsayaBaseY = 2.75;
  const pyitsayaStepH = 0.49;
  const banyaMatrices: THREE.Matrix4[] = [];
  const zediCornerMatrices: THREE.Matrix4[] = [];

  for (let t = 0; t < pyitsayaCount; t++) {
    const half = 4.36 - t * 0.27; // 4.36 down to 2.74 (broad solid base for wide bell!)
    const chamfer = 1.15 - t * 0.07;
    const ty = pyitsayaBaseY + t * pyitsayaStepH;

    const stepMesh = new THREE.Mesh(
      createChamferedTierGeometry(half, chamfer, pyitsayaStepH, 0.03),
      brightGoldMat,
    );
    stepMesh.position.y = ty;
    stepMesh.castShadow = true;
    stepMesh.receiveShadow = true;
    g.add(stepMesh);

    // Overhanging darker-gold cornice nosing casting crisp alternating stepped light/shadow lines
    const rim = new THREE.Mesh(
      createChamferedTierGeometry(half + 0.068, chamfer + 0.015, 0.092, 0.018),
      deepGoldMat,
    );
    rim.position.y = ty + pyitsayaStepH - 0.082;
    rim.castShadow = true;
    g.add(rim);

    // Miniature corner zedi stupa pinnacles on the chamfer corners of steps 0..4
    if (t < 5) {
      const finScale = 0.64 - t * 0.06;
      const cornerOff = half - chamfer * 0.5 - 0.14;
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          _v3.set(sx * cornerOff, ty + pyitsayaStepH - 0.01, sz * cornerOff);
          _q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(sx, sz));
          _s.set(finScale, finScale * 1.18, finScale);
          zediCornerMatrices.push(new THREE.Matrix4().compose(_v3, _q, _s));
        }
      }
    }

    // Dense ornate Ban-Ya flame crests lining bottom 3 golden terraces along all 4 cardinal faces
    if (t <= 2) {
      const spanMax = half - chamfer - 0.24;
      const numCrests = Math.max(4, Math.floor((spanMax * 2) / 0.56));
      const fScale = 0.56 - t * 0.06;
      for (const sign of [-1, 1]) {
        for (let k = 0; k <= numCrests; k++) {
          const off = THREE.MathUtils.lerp(-spanMax, spanMax, k / numCrests);
          // Skip right behind top of entrance pediment on bottom golden tier
          if (t === 0 && Math.abs(off) < 0.72) continue;
          _v3.set(off, ty + pyitsayaStepH - 0.01, sign * (half - 0.11));
          _q.identity();
          _s.set(fScale, fScale * 1.10, fScale);
          banyaMatrices.push(new THREE.Matrix4().compose(_v3, _q, _s));

          _v3.set(sign * (half - 0.11), ty + pyitsayaStepH - 0.01, off);
          _q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
          banyaMatrices.push(new THREE.Matrix4().compose(_v3, _q, _s));
        }
      }
    }
  }

  const banyaGeo = createKanokFlameFinialGeometry(0.82);
  const banyaInst = new THREE.InstancedMesh(banyaGeo, brightGoldMat, banyaMatrices.length);
  banyaInst.castShadow = true;
  banyaMatrices.forEach((m, idx) => banyaInst.setMatrixAt(idx, m));
  banyaInst.instanceMatrix.needsUpdate = true;
  banyaInst.computeBoundingSphere();
  g.add(banyaInst);

  // Sculpted miniature corner zedi stupa-pinnacle geometry (stepped square base + bell spire)
  const zediPinPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.24, 0.0),
    new THREE.Vector2(0.22, 0.22),
    new THREE.Vector2(0.16, 0.45),
    new THREE.Vector2(0.11, 0.68),
    new THREE.Vector2(0.05, 0.96),
    new THREE.Vector2(0.0, 1.15),
  ];
  const zediPinGeo = new THREE.LatheGeometry(zediPinPts, 10);
  zediPinGeo.computeVertexNormals();
  const zediCornerInst = new THREE.InstancedMesh(
    zediPinGeo,
    brightGoldMat,
    zediCornerMatrices.length,
  );
  zediCornerInst.castShadow = true;
  zediCornerMatrices.forEach((m, idx) => zediCornerInst.setMatrixAt(idx, m));
  zediCornerInst.instanceMatrix.needsUpdate = true;
  zediCornerInst.computeBoundingSphere();
  g.add(zediCornerInst);

  // =========================================================================
  // 6. BROAD SHWEDAGON-PROFILE BELL STUPA, LOTUS PETAL WAIST & YIN-BAN LAPPETS
  // =========================================================================
  const bellBaseY = pyitsayaBaseY + pyitsayaCount * pyitsayaStepH; // 6.18m
  const bellPts: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(2.86, 0.0), // Broad Kya-Lan lotus plinth sitting squarely on 2.74m top Pyitsaya
    new THREE.Vector2(2.92, 0.26),
    new THREE.Vector2(2.54, 0.56), // Deep waist groove
    new THREE.Vector2(2.74, 0.88), // Pronounced lower bell torus flare
    new THREE.Vector2(2.56, 1.24),
    new THREE.Vector2(2.42, 1.98), // Full, sweeping Khaung-Laung lower bell
    new THREE.Vector2(2.14, 2.90), // Smooth bell concavity
    new THREE.Vector2(1.82, 3.85), // Broad bell shoulder
    new THREE.Vector2(1.52, 4.65), // Yin-Ban upper chest frieze base
    new THREE.Vector2(1.38, 5.28), // Top of bell shoulder -> wide bold Phaung-Yit spire!
    new THREE.Vector2(0.0, 5.28),
  ];
  const bellGeo = new THREE.LatheGeometry(bellPts, 44);
  bellGeo.computeVertexNormals();
  const bellMesh = new THREE.Mesh(bellGeo, brightGoldMat);
  bellMesh.position.y = bellBaseY;
  bellMesh.castShadow = true;
  bellMesh.receiveShadow = true;
  g.add(bellMesh);

  // 32 Sculpted double-lotus petals (Kya-Lan upturned & Kya-Hmauk downturned) around bell waist
  const petalCount = 32;
  const petalGeo = new THREE.ConeGeometry(0.18, 0.46, 5);
  petalGeo.scale(1.0, 1.0, 0.44);
  const lotusInst = new THREE.InstancedMesh(petalGeo, deepGoldMat, petalCount * 2);
  let pIdx = 0;
  for (let i = 0; i < petalCount; i++) {
    const a = (i / petalCount) * Math.PI * 2;
    // Lower upturned lotus ring
    _v3.set(Math.cos(a) * 2.72, bellBaseY + 0.44, Math.sin(a) * 2.72);
    _e.set(0.28, -a + Math.PI / 2, 0);
    _q.setFromEuler(_e);
    _s.set(1, 1, 1);
    lotusInst.setMatrixAt(pIdx++, new THREE.Matrix4().compose(_v3, _q, _s));

    // Upper downturned lotus ring
    _v3.set(Math.cos(a) * 2.68, bellBaseY + 0.96, Math.sin(a) * 2.68);
    _e.set(Math.PI - 0.24, -a + Math.PI / 2, 0);
    _q.setFromEuler(_e);
    lotusInst.setMatrixAt(pIdx++, new THREE.Matrix4().compose(_v3, _q, _s));
  }
  lotusInst.instanceMatrix.needsUpdate = true;
  lotusInst.computeBoundingSphere();
  g.add(lotusInst);

  // 24 Yin-Ban triangular pendant jewel-lappet motifs around the upper bell chest (visible in real photo!)
  const lappetGeo = new THREE.ConeGeometry(0.14, 0.42, 4);
  lappetGeo.scale(1.1, 1.0, 0.38);
  const lappetInst = new THREE.InstancedMesh(lappetGeo, deepGoldMat, 24);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    _v3.set(Math.cos(a) * 1.63, bellBaseY + 4.38, Math.sin(a) * 1.63);
    _e.set(Math.PI - 0.16, -a + Math.PI / 2, 0);
    _q.setFromEuler(_e);
    _s.set(1, 1, 1);
    lappetInst.setMatrixAt(i, new THREE.Matrix4().compose(_v3, _q, _s));
  }
  lappetInst.instanceMatrix.needsUpdate = true;
  lappetInst.computeBoundingSphere();
  g.add(lappetInst);

  // Bold horizontal Baung-Yit & Yin-Ban turned cord rings on the bell body
  for (const [ry, rr, tube] of [
    [bellBaseY + 1.24, 2.58, 0.075],
    [bellBaseY + 2.52, 2.26, 0.068],
    [bellBaseY + 4.66, 1.54, 0.072],
    [bellBaseY + 4.98, 1.46, 0.064],
  ] as Array<[number, number, number]>) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(rr, tube, 12, 44), deepGoldMat);
    band.rotation.x = Math.PI / 2;
    band.position.y = ry;
    g.add(band);
  }

  // =========================================================================
  // 7. 18-RING BOLD PHAUNG-YIT SPIRE, LOTUS CUP, LACY HTI CROWN & SEIN-BU ORB
  // =========================================================================
  const spireBaseY = bellBaseY + 5.28; // 11.46m
  const spireHeight = 5.42; // top at 16.88m
  const spireCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.40, 1.35, spireHeight, 32),
    brightGoldMat,
  );
  spireCore.position.y = spireBaseY + spireHeight * 0.5;
  spireCore.castShadow = true;
  g.add(spireCore);

  // 18 chunky turned horizontal Phaung-Yit rings giving rich corrugated silhouette like the photo
  const ringCount = 18;
  for (let r = 0; r < ringCount; r++) {
    const t = r / (ringCount - 1);
    const ry = spireBaseY + 0.15 + t * (spireHeight - 0.30);
    const rad = THREE.MathUtils.lerp(1.36, 0.42, t);
    const tube = THREE.MathUtils.lerp(0.085, 0.042, t);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(rad, tube, 12, 32), deepGoldMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = ry;
    g.add(ring);
  }

  // Flared double-lotus neck cup (Kya-Hmauk / Kya-Lan) beneath the Hti umbrella (16.84m..17.85m)
  const neckCupPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.42, 0.0),
    new THREE.Vector2(0.68, 0.30), // wide flared lower lotus lip
    new THREE.Vector2(0.36, 0.52), // pinched waist
    new THREE.Vector2(0.64, 0.78), // flared upper lotus cup rim
    new THREE.Vector2(0.28, 1.00),
    new THREE.Vector2(0.0, 1.00),
  ];
  const neckCup = new THREE.Mesh(new THREE.LatheGeometry(neckCupPts, 28), brightGoldMat);
  neckCup.position.y = spireBaseY + spireHeight - 0.04; // 16.84m -> top 17.84m
  neckCup.castShadow = true;
  g.add(neckCup);

  // Intricate Openwork Tiered Hti Umbrella Crown (7 concentric hoops + 8 ribs + 24 exterior filigree loops + 28 Swe-Le bells)
  const htiBaseY = 17.84;
  const htiCenterShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.17, 3.05, 16),
    brightGoldMat,
  );
  htiCenterShaft.position.y = htiBaseY + 1.50;
  g.add(htiCenterShaft);

  const htiTierCount = 7;
  for (let h = 0; h < htiTierCount; h++) {
    const t = h / (htiTierCount - 1);
    const hy = htiBaseY + 0.16 + t * 1.65;
    const hRad = THREE.MathUtils.lerp(1.04, 0.25, t);
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(hRad, 0.026, 8, 28), brightGoldMat);
    hoop.rotation.x = Math.PI / 2;
    hoop.position.y = hy;
    g.add(hoop);
  }

  // 8 angled filigree umbrella ribs
  for (let s = 0; s < 8; s++) {
    const a = (s / 8) * Math.PI * 2;
    const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.022, 1.82, 6), deepGoldMat);
    rib.position.set(Math.cos(a) * 0.56, htiBaseY + 0.96, Math.sin(a) * 0.56);
    rib.rotation.z = Math.cos(a) * 0.39;
    rib.rotation.x = -Math.sin(a) * 0.39;
    g.add(rib);
  }

  // 24 Delicate exterior lacy gold filigree loops encircling the lower Hti halo (clearly visible against sky in photo!)
  const lacyLoopGeo = new THREE.TorusGeometry(0.11, 0.015, 6, 14);
  const lacyInst = new THREE.InstancedMesh(lacyLoopGeo, brightGoldMat, 24);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const tierOffset = i % 2 === 0 ? 0.22 : 0.56;
    const rOut = i % 2 === 0 ? 1.06 : 0.86;
    _v3.set(Math.cos(a) * rOut, htiBaseY + tierOffset, Math.sin(a) * rOut);
    _e.set(0, -a, 0);
    _q.setFromEuler(_e);
    _s.set(1, 1.15, 1);
    lacyInst.setMatrixAt(i, new THREE.Matrix4().compose(_v3, _q, _s));
  }
  lacyInst.instanceMatrix.needsUpdate = true;
  lacyInst.computeBoundingSphere();
  g.add(lacyInst);

  // 28 Hanging golden Swe-Le bells around the Hti hoops
  const miniBellGeo = new THREE.ConeGeometry(0.044, 0.11, 8);
  const bellMatrices: THREE.Matrix4[] = [];
  for (const [tierY, tierR, cnt] of [
    [htiBaseY + 0.06, 1.02, 16],
    [htiBaseY + 0.58, 0.78, 12],
  ] as Array<[number, number, number]>) {
    for (let i = 0; i < cnt; i++) {
      const a = (i / cnt) * Math.PI * 2;
      _v3.set(Math.cos(a) * tierR, tierY, Math.sin(a) * tierR);
      _q.identity();
      _s.set(1, 1, 1);
      bellMatrices.push(new THREE.Matrix4().compose(_v3, _q, _s));
    }
  }
  const htiBells = new THREE.InstancedMesh(miniBellGeo, brightGoldMat, bellMatrices.length);
  bellMatrices.forEach((m, idx) => htiBells.setMatrixAt(idx, m));
  htiBells.instanceMatrix.needsUpdate = true;
  htiBells.computeBoundingSphere();
  g.add(htiBells);

  // Sculpted Hnget-Myat-Na wind-vane pennant & crowning multi-tiered Sein-Bu diamond orb (~21.8m)
  const vane = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.26, 0.035), brightGoldMat);
  vane.position.set(0.42, htiBaseY + 2.28, 0);
  const vaneRim = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), deepGoldMat);
  vaneRim.position.set(0.84, htiBaseY + 2.28, 0);
  const seinBuNeck = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.52, 14), deepGoldMat);
  seinBuNeck.position.y = htiBaseY + 2.75;
  const seinBuOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.21, 1), brightGoldMat);
  seinBuOrb.position.y = htiBaseY + 3.20;
  const seinBuTip = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.42, 8), brightGoldMat);
  seinBuTip.position.y = htiBaseY + 3.55;
  g.add(vane, vaneRim, seinBuNeck, seinBuOrb, seinBuTip);

  // =========================================================================
  // 8. AZURE OFFERING PEDESTALS, CRIMSON NOTICE POST, STREETLIGHT & MASTS
  // =========================================================================
  for (const sx of [-2.25, 2.25]) {
    const ped = new THREE.Group();
    ped.position.set(sx, 0.07, 7.26);

    const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.28, 0.98), azurePedestalMat);
    b1.position.y = 0.14;
    b1.castShadow = true;
    const bMid = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.10, 0.84), azurePaleTrimMat);
    bMid.position.y = 0.33;
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.32, 0.76), azurePedestalMat);
    b2.position.y = 0.54;
    b2.castShadow = true;
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.09, 0.84), whiteStuccoMat);
    cap.position.y = 0.74;
    const lotusCushion = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.09, 14), brightGoldMat);
    lotusCushion.position.set(0, 0.83, -0.04);

    if (heroMats) {
      const guardian = createMonumentalSeatedBuddha(heroMats, {
        scale: 0.145,
        pose: 'dhyana',
        withNagaCanopy: false,
        withOfferingLamps: false,
      });
      guardian.position.set(0, 0.86, -0.04);
      ped.add(guardian);
    }

    // Brass offering pot beside each pedestal (+ yellow ceramic pot by West pedestal, moss tuft by East pedestal!)
    const offeringBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.10, 0.20, 12), bronzeMat);
    offeringBowl.position.set(sx < 0 ? -0.58 : 0.58, 0.14, 0.18);
    ped.add(b1, bMid, b2, cap, lotusCushion, offeringBowl);

    if (sx < 0) {
      const yellowPot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.26, 12), ceramicYellowMat);
      yellowPot.position.set(-0.92, 0.13, 0.22);
      ped.add(yellowPot);
    } else {
      const mossTuft = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16, 0), mossTuftMat);
      mossTuft.scale.set(1.2, 0.75, 1.0);
      mossTuft.position.set(0.76, 0.08, -0.14);
      ped.add(mossTuft);
    }

    g.add(ped);
  }

  // Tall White Steel Solar/Floodlight Masts flanking South Plaza Corners (6.8m tall, stepped blue-white plinth & banners!)
  for (const [mx, mz] of [
    [-7.48, 6.72],
    [7.48, 6.72],
  ] as Array<[number, number]>) {
    const mast = new THREE.Group();
    mast.position.set(mx, 0.07, mz);
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.26, 0.68), azurePedestalMat);
    plinth.position.y = 0.13;
    const mastBase = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.24, 0.38, 12), whiteStuccoMat);
    mastBase.position.y = 0.44;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.105, 6.25, 12), whiteSteelGateMat);
    pole.position.y = 3.55;
    pole.castShadow = true;

    // Vertical green & white decorative lamp-post brackets seen on left floodlight tower in photo
    for (const dy of [4.85, 5.45]) {
      const brace = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.05, 0.06), bannerGreenMat);
      brace.position.y = dy;
      mast.add(brace);
    }

    const crossArm = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.065, 0.09), whiteSteelGateMat);
    crossArm.position.y = 6.42;
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.028, 0.65, 8), whiteSteelGateMat);
    rod.position.y = 6.95;
    const capFinial = new THREE.Mesh(new THREE.SphereGeometry(0.10, 10, 8), brightGoldMat);
    capFinial.position.y = 6.70;
    for (const fx of [-0.36, 0.36]) {
      const lampHead = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.26), ironMat);
      lampHead.position.set(fx, 6.32, 0.06);
      lampHead.rotation.x = 0.45;
      const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.18), lampGlowMat);
      lens.position.set(fx, 6.26, 0.12);
      lens.rotation.x = Math.PI / 2 + 0.45;
      const tipKnob = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), brightGoldMat);
      tipKnob.position.set(fx, 6.50, 0);
      mast.add(lampHead, lens, tipKnob);
    }
    mast.add(plinth, mastBase, pole, crossArm, rod, capFinial);
    g.add(mast);
  }

  // Slim Crimson Notice Stand beside East South Pedestal + Tall Curved Gooseneck Streetlight behind it
  const redPost = new THREE.Group();
  redPost.position.set(2.38, 0.07, 7.72);
  const rpPole = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.038, 2.38, 8), crimsonMat);
  rpPole.position.y = 1.19;
  const rpSign = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.34, 0.05), crimsonMat);
  rpSign.position.y = 2.16;
  redPost.add(rpPole, rpSign);
  g.add(redPost);

  const streetMast = new THREE.Group();
  streetMast.position.set(2.58, 0.07, 6.82);
  const sPole = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.055, 7.4, 8), ironMat);
  sPole.position.y = 3.7;
  const sArm = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.045, 0.05), ironMat);
  sArm.position.set(-0.45, 7.42, 0);
  sArm.rotation.z = -0.08;
  const sHead = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.09, 0.16), ironMat);
  sHead.position.set(-0.88, 7.36, 0);
  streetMast.add(sPole, sArm, sHead);
  g.add(streetMast);

  // 3 West-flank white concrete garden bollards with crimson-painted pyramid caps (visible on far left of photo!)
  for (const bz of [4.2, 2.1, 0.0]) {
    const bol = new THREE.Group();
    bol.position.set(-7.62, 0.07, bz);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.86, 0.22), whiteStuccoMat);
    body.position.y = 0.43;
    body.castShadow = true;
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.22, 4), crimsonMat);
    cap.rotation.y = Math.PI / 4;
    cap.position.y = 0.96;
    bol.add(body, cap);
    g.add(bol);
  }

  return g;
}

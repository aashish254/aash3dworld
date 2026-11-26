import * as THREE from 'three';

function hash2D(x: number, y: number, seed = 17): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  return n - Math.floor(n);
}

function smoothNoise2D(x: number, y: number, seed = 17): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2D(ix, iy, seed);
  const b = hash2D(ix + 1, iy, seed);
  const c = hash2D(ix, iy + 1, seed);
  const d = hash2D(ix + 1, iy + 1, seed);
  return (a * (1 - ux) + b * ux) * (1 - uy) + (c * (1 - ux) + d * ux) * uy;
}

function fbm2D(x: number, y: number, seed = 17, octaves = 4): number {
  let value = 0;
  let amp = 0.5;
  let freq = 1.0;
  for (let i = 0; i < octaves; i++) {
    value += amp * (smoothNoise2D(x * freq, y * freq, seed + i * 13) * 2 - 1);
    freq *= 2.04;
    amp *= 0.5;
  }
  return value;
}

/**
 * Generates an organic, weathered, stratified conglomerate boulder-slab for the Sacred Marker Stone
 * with natural rounded bevels, asymmetrical chipped corners, central wear dish, and flat base at y = 0.
 */
export function createSculptedMarkerStoneGeometry(
  width = 1.12,
  height = 0.21,
  depth = 0.74,
  radialSegs = 64,
  heightSegs = 12,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const halfW = width * 0.5;
  const halfD = depth * 0.5;

  // Build concentric rings from center (0) -> rim -> base perimeter -> bottom center
  const ringCount = 12; // top face radial subdivisions
  const totalRings = ringCount + heightSegs + 2;

  const pushVertex = (x: number, y: number, z: number, u: number, v: number) => {
    positions.push(x, y, z);
    uvs.push(u, v);
  };

  // Top center vertex
  const centerTopY = height * 0.94 + fbm2D(0.1, 0.2, 53, 3) * 0.008;
  pushVertex(0, centerTopY, 0, 0.5, 0.5);

  // Rings 1..ringCount on top face, then side wall down to y = 0
  for (let r = 1; r <= ringCount + heightSegs; r++) {
    const isTop = r <= ringCount;
    const radFrac = isTop ? r / ringCount : 1.0;
    const sideFrac = isTop ? 0.0 : (r - ringCount) / heightSegs;

    for (let s = 0; s <= radialSegs; s++) {
      const theta = (s / radialSegs) * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      // Rounded superellipse footprint (natural oblong slab, not sharp rectangle)
      const p = 3.2;
      const superR = Math.pow(Math.pow(Math.abs(cosT), p) + Math.pow(Math.abs(sinT), p), -1 / p);
      const rimNoise =
        1.0 +
        0.065 * Math.sin(theta * 2.0 + 0.4) +
        0.045 * Math.cos(theta * 3.0 - 0.7) +
        0.032 * fbm2D(cosT * 2.4 + 3.1, sinT * 2.4 + 1.7, 71, 3);

      // Subtle bevel inward near top & base
      const bevelScale = isTop
        ? 0.94 + 0.06 * Math.sin((radFrac * Math.PI) * 0.5)
        : 1.0 - 0.07 * Math.pow(sideFrac, 2.2) + 0.025 * Math.sin(sideFrac * Math.PI);

      const rx = cosT * superR * halfW * rimNoise * radFrac * bevelScale;
      const rz = sinT * superR * halfD * rimNoise * radFrac * bevelScale;

      let y: number;
      if (isTop) {
        // Gentle crowned rim with subtle venerated central wear depression & rock strata
        const dome = Math.cos(radFrac * Math.PI * 0.44);
        const edgeRoll = 1.0 - Math.pow(Math.max(0, radFrac - 0.76) / 0.24, 2.0) * 0.26;
        const wearBowl = -0.014 * Math.exp(-radFrac * radFrac * 4.5);
        const strata = fbm2D(rx * 3.8 + 1.2, rz * 3.8 + 0.8, 37, 4) * 0.014 * (0.4 + 0.6 * radFrac);
        const stepLedge =
          Math.floor((fbm2D(rx * 2.2, rz * 2.2, 83, 2) + 1.0) * 2.0) * 0.004 * radFrac;
        y = height * (0.76 + 0.22 * dome) * edgeRoll + wearBowl + strata + stepLedge;
      } else {
        const edgeTopY =
          height *
            0.76 *
            (1.0 - 0.26) +
          fbm2D(rx * 3.8 + 1.2, rz * 3.8 + 0.8, 37, 4) * 0.014;
        const sideChip = fbm2D(cosT * 4.5 + sideFrac * 2.0, sideFrac * 5.0, 97, 3) * 0.012;
        y = Math.max(0, edgeTopY * (1.0 - sideFrac) + sideChip * (1.0 - sideFrac));
      }

      const u = THREE.MathUtils.clamp(0.5 + rx / (width * 1.12), 0.02, 0.98);
      const v = THREE.MathUtils.clamp(0.5 + rz / (depth * 1.12), 0.02, 0.98);
      pushVertex(rx, y, rz, u, v);
    }
  }

  // Bottom center vertex at y = 0
  const bottomCenterIdx = positions.length / 3;
  pushVertex(0, 0, 0, 0.5, 0.5);

  const stride = radialSegs + 1;
  // Triangles from top center (index 0) to ring 1
  for (let s = 0; s < radialSegs; s++) {
    indices.push(0, 1 + s + 1, 1 + s);
  }
  // Quads across rings 1..(ringCount + heightSegs - 1)
  for (let r = 1; r < ringCount + heightSegs; r++) {
    const rowA = 1 + (r - 1) * stride;
    const rowB = 1 + r * stride;
    for (let s = 0; s < radialSegs; s++) {
      const a = rowA + s;
      const b = rowA + s + 1;
      const c = rowB + s + 1;
      const d = rowB + s;
      indices.push(a, b, c, a, c, d);
    }
  }
  // Bottom cap from last ring to bottomCenterIdx
  const lastRow = 1 + (ringCount + heightSegs - 1) * stride;
  for (let s = 0; s < radialSegs; s++) {
    indices.push(bottomCenterIdx, lastRow + s, lastRow + s + 1);
  }

  void totalRings;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates a swept anatomical limb along a 3D CatmullRomCurve3 using parallel-transport
 * (Bishop) frames and a variable radius profile so arms taper smoothly from deltoid -> elbow -> wrist.
 */
export function createTaperedLimbGeometry(
  curve: THREE.CatmullRomCurve3,
  radiusAt: (t: number) => number,
  tubularSegments = 20,
  radialSegments = 14,
): THREE.BufferGeometry {
  const pts = curve.getSpacedPoints(tubularSegments);
  const tangents: THREE.Vector3[] = [];
  for (let i = 0; i <= tubularSegments; i++) {
    tangents.push(curve.getTangentAt(i / tubularSegments).normalize());
  }

  // Parallel transport initial normal
  const normals: THREE.Vector3[] = [];
  const binormals: THREE.Vector3[] = [];
  const ref = Math.abs(tangents[0].y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const n0 = new THREE.Vector3().crossVectors(tangents[0], ref).normalize();
  const b0 = new THREE.Vector3().crossVectors(tangents[0], n0).normalize();
  normals.push(n0);
  binormals.push(b0);

  const axis = new THREE.Vector3();
  const q = new THREE.Quaternion();
  for (let i = 1; i <= tubularSegments; i++) {
    const prevN = normals[i - 1].clone();
    axis.crossVectors(tangents[i - 1], tangents[i]);
    if (axis.lengthSq() > 1e-8) {
      axis.normalize();
      const angle = Math.acos(THREE.MathUtils.clamp(tangents[i - 1].dot(tangents[i]), -1, 1));
      q.setFromAxisAngle(axis, angle);
      prevN.applyQuaternion(q).normalize();
    }
    const bi = new THREE.Vector3().crossVectors(tangents[i], prevN).normalize();
    normals.push(prevN);
    binormals.push(bi);
  }

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= tubularSegments; i++) {
    const t = i / tubularSegments;
    const p = pts[i];
    const r = Math.max(0.002, radiusAt(t));
    const n = normals[i];
    const b = binormals[i];
    for (let j = 0; j <= radialSegments; j++) {
      const v = j / radialSegments;
      const theta = v * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);
      positions.push(
        p.x + r * (cosT * n.x + sinT * b.x),
        p.y + r * (cosT * n.y + sinT * b.y),
        p.z + r * (cosT * n.z + sinT * b.z),
      );
      uvs.push(v, t);
    }
  }

  const stride = radialSegments + 1;
  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + (j + 1);
      const d = i * stride + (j + 1);
      indices.push(a, d, b, b, d, c);
    }
  }

  // End caps
  const startCenterIdx = positions.length / 3;
  positions.push(pts[0].x, pts[0].y, pts[0].z);
  uvs.push(0.5, 0);
  const endCenterIdx = positions.length / 3;
  const lastPt = pts[tubularSegments];
  positions.push(lastPt.x, lastPt.y, lastPt.z);
  uvs.push(0.5, 1);
  for (let j = 0; j < radialSegments; j++) {
    indices.push(startCenterIdx, j + 1, j);
    const base = tubularSegments * stride;
    indices.push(endCenterIdx, base + j, base + j + 1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates an analytically sculpted classical Indian/Nepali Gupta sculpture head
 * with smooth cranium, brow ridge, eye sockets, nose bridge, nostrils, cheeks, lips, chin, and neck.
 * Faces +Z.
 */
export function createAnatomicalHeadGeometry(isChild = false): THREE.BufferGeometry {
  const latSegs = 46;
  const lonSegs = 52;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let iy = 0; iy <= latSegs; iy++) {
    const v = iy / latSegs; // 0 = neck bottom, 1 = crown top
    const phi = v * Math.PI; // 0..PI from bottom to top
    const y = -0.155 + v * 0.315; // [-0.155 .. +0.160]

    for (let ix = 0; ix <= lonSegs; ix++) {
      const u = ix / lonSegs;
      const theta = (u - 0.5) * Math.PI * 2; // 0 = front (+Z)
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);

      // Base oval cranial-jaw profile along vertical height v
      let rx: number;
      let rz: number;
      if (v < 0.14) {
        // Neck column transitioning into jaw with subtle trivali ring contour
        const nt = v / 0.14;
        const neckRing = Math.sin(nt * Math.PI * 2.0) * 0.0018;
        rx = THREE.MathUtils.lerp(0.048, 0.062, nt) + neckRing;
        rz = THREE.MathUtils.lerp(0.048, 0.066, nt) + neckRing;
      } else {
        const hv = (v - 0.14) / 0.86; // 0..1 head
        const oval = Math.sin(Math.pow(hv, 0.78) * Math.PI);
        const jawTaper = hv < 0.36 ? THREE.MathUtils.lerp(0.56, 0.96, hv / 0.36) : 1.0;
        rx = (isChild ? 0.118 : 0.106) * Math.pow(Math.max(0.0, oval), 0.72) * jawTaper + 0.008 * (1 - hv);
        rz = (isChild ? 0.122 : 0.115) * Math.pow(Math.max(0.0, oval), 0.72) * jawTaper + 0.008 * (1 - hv);
      }

      let x = sinT * rx;
      let z = cosT * rz;

      // Facial anatomical relief on front hemisphere (cosT > 0)
      if (cosT > 0.05 && v >= 0.14 && v <= 0.88) {
        const frontMask = Math.pow(Math.max(0, cosT), 1.35);
        const xAbs = Math.abs(sinT);

        // Defined chin & jawline fullness + subtle mentolabial groove under lower lip
        const chinWeight = Math.exp(-Math.pow((v - 0.228) / 0.058, 2)) * Math.exp(-Math.pow(xAbs / 0.24, 2));
        const chinCleft = Math.exp(-Math.pow((v - 0.278) / 0.016, 2)) * Math.exp(-Math.pow(xAbs / 0.16, 2));
        z += chinWeight * 0.023 * frontMask - chinCleft * 0.007;

        // Sculpted malar cheek plane
        const cheekWeight =
          Math.exp(-Math.pow((v - 0.445) / 0.10, 2)) *
          Math.exp(-Math.pow((xAbs - 0.40) / 0.22, 2));
        z += cheekWeight * (isChild ? 0.025 : 0.018);
        x += Math.sign(sinT) * cheekWeight * (isChild ? 0.009 : 0.005);

        // Deep carved orbital eye socket depressions
        const socketWeight =
          Math.exp(-Math.pow((v - 0.565) / 0.050, 2)) *
          Math.exp(-Math.pow((xAbs - 0.30) / 0.135, 2));
        z -= socketWeight * 0.0155;

        // Convex serene half-closed almond eyelids + engraved lower lid slit crease
        const lidWeight =
          Math.exp(-Math.pow((v - 0.562) / 0.018, 2)) *
          Math.exp(-Math.pow((xAbs - 0.30) / 0.095, 2));
        const eyelidSlit =
          Math.exp(-Math.pow((v - 0.543) / 0.007, 2)) *
          Math.exp(-Math.pow((xAbs - 0.30) / 0.092, 2));
        z += lidWeight * 0.0135 - eyelidSlit * 0.0065;

        // Crisp continuous arched Gupta brow ridge
        const browY = 0.626 - 0.022 * Math.pow((xAbs - 0.29) / 0.24, 2);
        const browWeight =
          Math.exp(-Math.pow((v - browY) / 0.015, 2)) *
          Math.exp(-Math.pow((xAbs - 0.285) / 0.21, 2));
        z += browWeight * 0.014;

        // Sculpted straight nose bridge, crisp tip, nostril wings & delicate philtrum
        const noseBridge =
          v >= 0.42 && v <= 0.635
            ? Math.sin(((v - 0.42) / 0.215) * Math.PI * 0.85) * Math.exp(-Math.pow(xAbs / 0.074, 2))
            : 0;
        const noseTip =
          Math.exp(-Math.pow((v - 0.435) / 0.032, 2)) * Math.exp(-Math.pow(xAbs / 0.092, 2));
        const nostrilFlare =
          Math.exp(-Math.pow((v - 0.424) / 0.020, 2)) *
          Math.exp(-Math.pow((xAbs - 0.112) / 0.048, 2));
        const philtrum =
          Math.exp(-Math.pow((v - 0.388) / 0.018, 2)) * Math.exp(-Math.pow(xAbs / 0.038, 2));
        z += noseBridge * 0.0245 + noseTip * 0.0235 + nostrilFlare * 0.0115 - philtrum * 0.0055;

        // Sculpted cupid's bow upper lip, serene smile parting groove & plump lower lip
        const bowArch = 0.006 * Math.cos((xAbs / 0.14) * Math.PI);
        const upperLip =
          Math.exp(-Math.pow((v - (0.355 + bowArch * 0.5)) / 0.015, 2)) *
          Math.exp(-Math.pow(xAbs / 0.172, 2));
        const smileCornerLift = 0.005 * Math.pow(Math.min(1, xAbs / 0.16), 2);
        const lipCrease =
          Math.exp(-Math.pow((v - (0.335 + smileCornerLift)) / 0.0065, 2)) *
          Math.exp(-Math.pow(xAbs / 0.158, 2));
        const lowerLip =
          Math.exp(-Math.pow((v - 0.310) / 0.016, 2)) * Math.exp(-Math.pow(xAbs / 0.142, 2));
        z += upperLip * 0.016 - lipCrease * 0.0115 + lowerLip * 0.0165;

        // Forehead plane gently rounded
        const foreheadWeight = Math.exp(-Math.pow((v - 0.735) / 0.105, 2)) * frontMask;
        z += foreheadWeight * 0.010;
      }

      // Close pole at top of crown cleanly
      if (iy === latSegs) {
        x = 0;
        z = 0;
      }

      void phi;
      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  const stride = lonSegs + 1;
  for (let iy = 0; iy < latSegs; iy++) {
    for (let ix = 0; ix < lonSegs; ix++) {
      const a = iy * stride + ix;
      const b = a + 1;
      const c = (iy + 1) * stride + ix + 1;
      const d = (iy + 1) * stride + ix;
      indices.push(a, b, c, a, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export interface SculptedTorsoOptions {
  height: number;
  waistRadius: number;
  hipRadius: number;
  chestRadius: number;
  shoulderRadius: number;
  neckRadius: number;
  bustProjection: number;
  tribhangaSway: number;
  isChild?: boolean;
}

/**
 * Creates a non-axisymmetric sculpted Gupta-style upper torso with oval ribcage,
 * slender waist, clavicles, anatomical bust/pectoral modeling, diagonal uttariya edge,
 * and S-curved tribhanga spine offset.
 */
export function createSculptedTorsoGeometry(opts: SculptedTorsoOptions): THREE.BufferGeometry {
  const ySegs = 32;
  const radSegs = 40;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let iy = 0; iy <= ySegs; iy++) {
    const v = iy / ySegs;
    const y = v * opts.height;

    // Smooth anatomical torso width & depth profile
    let rx: number;
    let rz: number;
    if (v < 0.28) {
      const t = v / 0.28;
      rx = THREE.MathUtils.lerp(opts.hipRadius, opts.waistRadius, Math.sin(t * Math.PI * 0.5));
      rz = rx * (opts.isChild ? 0.84 : 0.72);
    } else if (v < 0.68) {
      const t = (v - 0.28) / 0.40;
      rx = THREE.MathUtils.lerp(opts.waistRadius, opts.chestRadius, t * t * (3 - 2 * t));
      rz = rx * (opts.isChild ? 0.84 : 0.70);
    } else if (v < 0.86) {
      const t = (v - 0.68) / 0.18;
      rx = THREE.MathUtils.lerp(opts.chestRadius, opts.shoulderRadius, Math.sin(t * Math.PI * 0.5));
      rz = THREE.MathUtils.lerp(opts.chestRadius * 0.70, opts.shoulderRadius * 0.54, t);
    } else {
      const t = (v - 0.86) / 0.14;
      rx = THREE.MathUtils.lerp(opts.shoulderRadius, opts.neckRadius, Math.pow(t, 0.75));
      rz = THREE.MathUtils.lerp(opts.shoulderRadius * 0.54, opts.neckRadius, Math.pow(t, 0.75));
    }

    const swayX = Math.sin(v * Math.PI) * opts.tribhangaSway;
    const backCurveZ = Math.sin(v * Math.PI) * 0.015;

    for (let ix = 0; ix <= radSegs; ix++) {
      const u = ix / radSegs;
      const theta = (u - 0.5) * Math.PI * 2; // 0 = front (+Z)
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);

      let x = swayX + sinT * rx;
      let z = backCurveZ + cosT * rz;

      // Bilateral bust / pectoral projection on front (+Z)
      if (cosT > 0.05) {
        const yBust = opts.isChild ? 0.62 : 0.58;
        const bustYWeight = Math.exp(-Math.pow((v - yBust) / 0.13, 2));
        const xSpread = Math.abs(sinT);
        const bustXWeight = Math.exp(-Math.pow((xSpread - 0.42) / 0.28, 2));
        z += bustYWeight * bustXWeight * opts.bustProjection * Math.pow(cosT, 1.2);

        // Child rounded lower belly
        if (opts.isChild) {
          const belly = Math.exp(-Math.pow((v - 0.24) / 0.16, 2)) * Math.pow(cosT, 1.3);
          z += belly * opts.chestRadius * 0.24;
        } else {
          // Subtle ribcage sternum & diagonal uttariya fold ridge
          const sashDist = Math.abs(v - (0.30 + (sinT + 0.6) * 0.34));
          const sashRidge = Math.exp(-Math.pow(sashDist / 0.035, 2)) * Math.max(0, cosT);
          z += sashRidge * 0.008;
        }
      }

      // Subtle spinal furrow on back (-Z)
      if (cosT < -0.25 && v > 0.1 && v < 0.85) {
        const spineDip = Math.exp(-Math.pow(sinT / 0.16, 2)) * (-cosT);
        z += spineDip * 0.012;
      }

      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  const stride = radSegs + 1;
  for (let iy = 0; iy < ySegs; iy++) {
    for (let ix = 0; ix < radSegs; ix++) {
      const a = iy * stride + ix;
      const b = a + 1;
      const c = (iy + 1) * stride + ix + 1;
      const d = (iy + 1) * stride + ix;
      indices.push(a, b, c, a, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export interface SculptedDhotiOptions {
  height: number;
  ankleRadius: number;
  hipRadius: number;
  waistRadius: number;
  pleatCount?: number;
  hipShiftX?: number;
  thighSeparation?: number;
}

/**
 * Creates a sculpted lower garment (Paridhana / Dhoti) with visible anatomical thigh/knee
 * silhouette beneath clinging Gupta drapery, carved U-shaped catenary fold ribs, and
 * a flowing central pleated lappet.
 */
export function createSculptedDhotiGeometry(opts: SculptedDhotiOptions): THREE.BufferGeometry {
  const ySegs = 44;
  const radSegs = 56;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const hipShift = opts.hipShiftX ?? 0;
  const thighSep = opts.thighSeparation ?? 0.022;
  const pleatCount = opts.pleatCount ?? 5;

  for (let iy = 0; iy <= ySegs; iy++) {
    const v = iy / ySegs; // 0 = ankles, 1 = waist
    const y = v * opts.height;

    let rx: number;
    if (v < 0.14) {
      rx = THREE.MathUtils.lerp(opts.ankleRadius * 0.94, opts.ankleRadius, v / 0.14);
    } else if (v < 0.78) {
      const t = (v - 0.14) / 0.64;
      rx = THREE.MathUtils.lerp(opts.ankleRadius, opts.hipRadius, Math.pow(t, 0.85));
    } else {
      const t = (v - 0.78) / 0.22;
      rx = THREE.MathUtils.lerp(opts.hipRadius, opts.waistRadius, t * t * (3 - 2 * t));
    }
    const rz = rx * 0.74;
    const centerX = Math.sin(v * Math.PI * 0.85) * hipShift;

    for (let ix = 0; ix <= radSegs; ix++) {
      const u = ix / radSegs;
      const theta = (u - 0.5) * Math.PI * 2;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);

      // Dual-lobe thigh, knee & calf relief visible through clinging Gupta fabric
      const legPresence = Math.sin(Math.min(1, v / 0.88) * Math.PI) * Math.abs(cosT);
      const legSeparationDip = -Math.exp(-Math.pow(sinT / 0.15, 2)) * thighSep * 1.35 * legPresence;
      const thighSwell =
        Math.exp(-Math.pow((Math.abs(sinT) - 0.48) / 0.27, 2)) * thighSep * 1.12 * legPresence;

      // Carved catenary Gupta drapery U-fold ribs sweeping across knees & thighs
      const drapeArch = Math.sin((v * 4.5 - 0.28 * (1.0 - Math.abs(sinT))) * Math.PI);
      const waveFold = drapeArch * 0.0044 * Math.sin(v * Math.PI) * Math.max(0, cosT);

      // Deep vertical carved pleat flutes along central dhoti lappet and side gathers
      const centerPleatMask = Math.exp(-Math.pow(sinT / 0.25, 2)) * Math.max(0, cosT) * (1 - v * 0.22);
      const centerPleatRipples = Math.cos(sinT * Math.PI * pleatCount * 3.4) * 0.0115 * centerPleatMask;
      const sideGather =
        Math.exp(-Math.pow((Math.abs(sinT) - 0.82) / 0.17, 2)) *
        Math.cos(sinT * 20.0) *
        0.0048 *
        (1 - v * 0.35);

      const x = centerX + sinT * (rx + thighSwell * 0.24);
      const z =
        cosT * rz +
        Math.sign(cosT) * (legSeparationDip + thighSwell + waveFold + centerPleatRipples + sideGather);

      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  const stride = radSegs + 1;
  for (let iy = 0; iy < ySegs; iy++) {
    for (let ix = 0; ix < radSegs; ix++) {
      const a = iy * stride + ix;
      const b = a + 1;
      const c = (iy + 1) * stride + ix + 1;
      const d = (iy + 1) * stride + ix;
      indices.push(a, b, c, a, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates a curved, cupped, sculpted lotus petal geometry for Padmasana pedestals
 * and sacred lotus flower offerings.
 */
export function createCarvedLotusPetalGeometry(
  width = 0.08,
  height = 0.09,
  cupDepth = 0.025,
): THREE.BufferGeometry {
  const uSegs = 6;
  const vSegs = 8;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let iv = 0; iv <= vSegs; iv++) {
    const v = iv / vSegs; // 0 = base, 1 = pointed tip
    // Classic Indian lotus petal silhouette: swells at mid-height, tapers to gentle point
    const halfSpan = width * 0.5 * Math.sin(Math.pow(v, 0.65) * Math.PI * 0.94 + 0.12);
    const y = v * height;
    const archOut = Math.sin(v * Math.PI * 0.85) * cupDepth - Math.pow(v, 2.2) * cupDepth * 0.45;

    for (let iu = 0; iu <= uSegs; iu++) {
      const u = iu / uSegs;
      const s = u * 2 - 1; // -1..+1 across width
      const x = s * halfSpan;
      // Cupped midrib ridge + curved outer lip
      const cup = (1 - s * s) * cupDepth * 0.55 * Math.sin(v * Math.PI);
      const midRib = Math.exp(-s * s * 14) * 0.004 * (1 - v);
      const z = archOut + cup + midRib;
      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  const stride = uSegs + 1;
  for (let iv = 0; iv < vSegs; iv++) {
    for (let iu = 0; iu < uSegs; iu++) {
      const a = iv * stride + iu;
      const b = a + 1;
      const c = (iv + 1) * stride + iu + 1;
      const d = (iv + 1) * stride + iu;
      indices.push(a, b, c, a, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates a ruffled, multi-lobed marigold flower blossom geometry (replacing faceted dodecahedrons).
 */
export function createMarigoldFloretGeometry(radius = 0.044): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(radius, 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, y, z) || 1;
    const ang = Math.atan2(z, x);
    const elev = Math.asin(THREE.MathUtils.clamp(y / r, -1, 1));
    // Ruffled radial petal clusters
    const ruffle =
      1.0 +
      0.22 * Math.sin(ang * 7.0 + elev * 3.0) +
      0.14 * Math.cos(ang * 13.0 - elev * 5.0);
    pos.setXYZ(i, x * ruffle, y * 0.72 * ruffle, z * ruffle);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

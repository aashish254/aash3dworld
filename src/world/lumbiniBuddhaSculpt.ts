import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  createCrossedShrubSprigGeo,
  getLumbiniBotanicalLeafMaterial,
  getLumbiniGardenCraftMaterials,
} from './lumbiniGardenCraft';
import {
  createCarvedLotusPetalGeometry,
  createTaperedLimbGeometry,
} from './mayaDeviSculptureGeo';

const _m4 = new THREE.Matrix4();
const _v3 = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _e = new THREE.Euler();
const _cTmp = new THREE.Color();

export interface BuddhaMaterials {
  skinMat: THREE.Material;
  robeMat: THREE.Material;
  hairMat: THREE.Material;
  goldMat: THREE.Material;
  bronzeMat: THREE.Material;
  stonePlinthMat: THREE.Material;
  crimsonLacquerMat: THREE.Material;
  flameMat: THREE.Material;
}

const BRONZE_PATINA_C = new THREE.Color(0x52340a);
const BRONZE_MID_C = new THREE.Color(0xbe8822);
const BRONZE_BRIGHT_C = new THREE.Color(0xf6c954);
const HAIR_PATINA_C = new THREE.Color(0x472d08);
const HAIR_CREST_C = new THREE.Color(0xdca836);

function setGeometryUniformColor(geo: THREE.BufferGeometry, hex: number): THREE.BufferGeometry {
  const pos = geo.getAttribute('position');
  if (!pos) return geo;
  const c = new THREE.Color(hex);
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  return geo;
}

function setGeometryCavityColor(
  geo: THREE.BufferGeometry,
  cavityAtIndex: (i: number, pos: THREE.BufferAttribute) => number,
  darkC = BRONZE_PATINA_C,
  midC = BRONZE_MID_C,
  brightC = BRONZE_BRIGHT_C,
): THREE.BufferGeometry {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const cav = THREE.MathUtils.clamp(cavityAtIndex(i, pos), 0, 1);
    if (cav > 0.5) {
      _cTmp.lerpColors(midC, darkC, (cav - 0.5) * 2.0);
    } else {
      _cTmp.lerpColors(brightC, midC, cav * 2.0);
    }
    colors[i * 3] = _cTmp.r;
    colors[i * 3 + 1] = _cTmp.g;
    colors[i * 3 + 2] = _cTmp.b;
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  return geo;
}

let cachedSeatedCastGoldMat: THREE.MeshStandardMaterial | null = null;
function getSharedSeatedCastGoldMat(): THREE.MeshStandardMaterial {
  if (cachedSeatedCastGoldMat) return cachedSeatedCastGoldMat;
  const { normalMap, roughnessMap } = createSeamlessCastBronzeMicroTextures(128);
  cachedSeatedCastGoldMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    normalMap,
    normalScale: new THREE.Vector2(0.14, 0.14),
    roughnessMap,
    roughness: 0.30,
    metalness: 0.83,
    emissive: 0x221403,
    emissiveIntensity: 0.07,
  });
  return cachedSeatedCastGoldMat;
}

/**
 * Generates a unified high-resolution continuous sculpted Buddha head & neck geometry (112x128)
 * with museum cast-bronze cavity patina, crisp carved eyelids & half-open calm gaze,
 * graceful arched brows, sculpted nose alae & nostril hollows, compassionate smiling lips,
 * M-arch temple hairline step, and Trivali neck rings. Faces +Z.
 */
function createContinuousBuddhaHeadGeo(variant: 'baby' | 'adult'): THREE.BufferGeometry {
  const isBaby = variant === 'baby';
  const latSegs = isBaby ? 84 : 64;
  const lonSegs = isBaby ? 96 : 72;
  const positions: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const yMin = isBaby ? -0.17 : -0.52;
  const ySpan = isBaby ? 0.55 : 1.06;
  const headMaxRx = isBaby ? 0.210 : 0.362;
  const headMaxRz = isBaby ? 0.212 : 0.382;
  const neckBottomRx = isBaby ? 0.128 : 0.195;
  const neckTopRx = isBaby ? 0.122 : 0.188;

  for (let iy = 0; iy <= latSegs; iy++) {
    const v = iy / latSegs; // 0 = neck base .. 1 = crown apex
    const y = yMin + v * ySpan;

    let rx: number;
    let rz: number;
    let neckCav = 0;
    if (v < 0.14) {
      const nt = v / 0.14;
      const trivaliWave = Math.sin(nt * Math.PI * 3.0);
      const trivali = trivaliWave * (isBaby ? 0.0014 : 0.0038);
      neckCav = Math.max(0, -trivaliWave) * (isBaby ? 0.22 : 0.36);
      rx = THREE.MathUtils.lerp(neckBottomRx, neckTopRx, nt) + trivali;
      rz = THREE.MathUtils.lerp(neckBottomRx * 0.94, neckTopRx * 0.95, nt) + trivali;
    } else {
      const hv = (v - 0.14) / 0.86; // 0 = under-chin .. 1 = top of cranium
      const jawFull =
        hv < 0.44
          ? Math.sqrt(Math.max(0.0, 1.0 - Math.pow((0.44 - hv) / 0.44, 2.0)))
          : 1.0;
      const crownFull =
        hv > 0.56
          ? Math.sqrt(Math.max(0.0, 1.0 - Math.pow((hv - 0.56) / 0.44, 2.0)))
          : 1.0;
      const midWidth = isBaby
        ? 0.99 + 0.058 * Math.exp(-Math.pow((hv - 0.36) / 0.24, 2))
        : 0.94 + 0.06 * Math.exp(-Math.pow((hv - 0.48) / 0.25, 2));
      const neckJoinBlend = THREE.MathUtils.smoothstep(hv, 0.0, 0.11);
      const ovalRx = headMaxRx * jawFull * crownFull * midWidth;
      const ovalRz = headMaxRz * jawFull * crownFull * midWidth;
      rx = THREE.MathUtils.lerp(neckTopRx * 0.96, ovalRx, neckJoinBlend);
      rz = THREE.MathUtils.lerp(neckTopRx * 0.92, ovalRz, neckJoinBlend);
    }

    for (let ix = 0; ix <= lonSegs; ix++) {
      const u = ix / lonSegs;
      const theta = (u - 0.5) * Math.PI * 2; // 0 = front (+Z)
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);

      let x = sinT * rx;
      let z = cosT * rz;
      let cavity = neckCav;

      // Subtle cranial occiput fullness
      if (v > 0.24 && cosT < 0) {
        const occiput = Math.exp(-Math.pow((v - 0.62) / 0.22, 2)) * (-cosT);
        z -= occiput * (isBaby ? 0.014 : 0.028);
      }

      // Under-chin double-chin shadow for youthful baby fullness
      if (isBaby && v > 0.13 && v < 0.22 && cosT > 0) {
        const underJawShadow =
          Math.exp(-Math.pow((v - 0.175) / 0.026, 2)) * Math.pow(cosT, 1.5);
        cavity += underJawShadow * 0.42;
      }

      // C-infinity smooth front blending — zero cheek seam
      const frontFade = 0.5 + 0.5 * Math.tanh(cosT * 4.6);
      const vertFade =
        THREE.MathUtils.smoothstep(v, 0.15, 0.23) *
        (1.0 - THREE.MathUtils.smoothstep(v, 0.80, 0.92));
      const faceMask = frontFade * vertFade;

      if (faceMask > 0.002) {
        const xAbs = Math.abs(sinT);
        const relief = isBaby ? 1.12 : 1.78;

        // Soft rounded chin & mentolabial fold
        const chinWeight =
          Math.exp(-Math.pow((v - 0.248) / 0.056, 2)) *
          Math.exp(-Math.pow(xAbs / (isBaby ? 0.28 : 0.24), 2));
        const chinCleft =
          Math.exp(-Math.pow((v - 0.300) / 0.015, 2)) * Math.exp(-Math.pow(xAbs / 0.15, 2));
        z += (chinWeight * 0.022 - chinCleft * 0.0065) * relief * faceMask;
        cavity += chinCleft * 0.38 * faceMask;

        // Cherubic cheeks
        const cheekWeight =
          Math.exp(-Math.pow((v - 0.415) / 0.116, 2)) *
          Math.exp(-Math.pow((xAbs - (isBaby ? 0.38 : 0.37)) / (isBaby ? 0.28 : 0.23), 2));
        z += cheekWeight * (isBaby ? 0.027 : 0.017) * relief * frontFade;
        x += Math.sign(sinT) * cheekWeight * (isBaby ? 0.010 : 0.005) * frontFade;
        cavity -= cheekWeight * 0.22 * frontFade;

        // Soft orbital hollows
        const socketWeight =
          Math.exp(-Math.pow((v - 0.556) / 0.054, 2)) *
          Math.exp(-Math.pow((xAbs - 0.275) / 0.145, 2));
        z -= socketWeight * (isBaby ? 0.013 : 0.016) * relief * faceMask;
        cavity += socketWeight * 0.22 * faceMask;

        // Convex serene half-open eyeball + carved upper eyelid rim + crisp dark lash slit + lower rim
        const eyeXDiff = (xAbs - 0.268) / 0.105;
        const eyeEnv = Math.exp(-eyeXDiff * eyeXDiff);
        const eyeball =
          Math.exp(-Math.pow((v - 0.544) / 0.018, 2)) * eyeEnv;
        const upperLidCurveY = 0.560 - 0.012 * eyeXDiff * eyeXDiff;
        const upperLid =
          Math.exp(-Math.pow((v - upperLidCurveY) / 0.011, 2)) * eyeEnv;
        const lashSlitY = 0.543 - 0.008 * eyeXDiff * eyeXDiff;
        const lashSlit =
          Math.exp(-Math.pow((v - lashSlitY) / 0.0065, 2)) *
          Math.exp(-Math.pow((xAbs - 0.268) / 0.095, 2));
        const lowerLidY = 0.525 - 0.005 * eyeXDiff * eyeXDiff;
        const lowerLid =
          Math.exp(-Math.pow((v - lowerLidY) / 0.009, 2)) *
          Math.exp(-Math.pow((xAbs - 0.268) / 0.092, 2));
        const upperFoldY = 0.576 - 0.013 * eyeXDiff * eyeXDiff;
        const upperFold =
          Math.exp(-Math.pow((v - upperFoldY) / 0.006, 2)) * eyeEnv;

        z +=
          (eyeball * 0.010 +
            upperLid * 0.0155 +
            lowerLid * 0.0085 -
            lashSlit * 0.0095 -
            upperFold * 0.0045) *
          relief *
          faceMask;
        cavity += (lashSlit * 0.86 + upperFold * 0.42) * faceMask;

        // Gracefully arched tapered eyebrows
        const browArch = (xAbs - 0.235) / 0.175;
        const browY = 0.635 - 0.025 * browArch * browArch;
        const browWeight =
          Math.exp(-Math.pow((v - browY) / 0.0125, 2)) *
          Math.exp(-Math.pow((xAbs - 0.255) / 0.185, 2)) *
          THREE.MathUtils.smoothstep(xAbs, 0.04, 0.12);
        z += browWeight * (isBaby ? 0.0125 : 0.0145) * relief * faceMask;
        cavity += browWeight * 0.40 * faceMask;

        // Classical straight/soft child nose bridge, rounded tip, nostril wings & dark nostril hollows
        const noseBridge =
          v >= 0.430 && v <= 0.618
            ? Math.sin(((v - 0.430) / 0.188) * Math.PI * 0.86) *
              Math.exp(-Math.pow(xAbs / (isBaby ? 0.068 : 0.062), 2))
            : 0;
        const noseTip =
          Math.exp(-Math.pow((v - 0.440) / 0.030, 2)) *
          Math.exp(-Math.pow(xAbs / (isBaby ? 0.084 : 0.078), 2));
        const nostrilWing =
          Math.exp(-Math.pow((v - 0.430) / 0.018, 2)) *
          Math.exp(-Math.pow((xAbs - 0.098) / 0.044, 2));
        const alarCrease =
          Math.exp(-Math.pow((v - 0.438) / 0.022, 2)) *
          Math.exp(-Math.pow((xAbs - 0.132) / 0.025, 2));
        const nostrilHole =
          Math.exp(-Math.pow((v - 0.415) / 0.011, 2)) *
          Math.exp(-Math.pow((xAbs - 0.064) / 0.028, 2));
        const philtrum =
          Math.exp(-Math.pow((v - 0.392) / 0.018, 2)) * Math.exp(-Math.pow(xAbs / 0.032, 2));

        z +=
          (noseBridge * 0.024 +
            noseTip * (isBaby ? 0.024 : 0.026) +
            nostrilWing * 0.0125 -
            alarCrease * 0.0045 -
            nostrilHole * 0.0095 -
            philtrum * 0.0048) *
          relief *
          faceMask;
        cavity += (alarCrease * 0.46 + nostrilHole * 0.86 + philtrum * 0.25) * faceMask;

        // Compassionate calm smiling lips & corner smile dimples
        const bowArch = 0.0055 * Math.cos((xAbs / 0.13) * Math.PI);
        const upperLip =
          Math.exp(-Math.pow((v - (0.360 + bowArch * 0.42)) / 0.0135, 2)) *
          Math.exp(-Math.pow(xAbs / 0.158, 2));
        const smileCorner = 0.0085 * Math.pow(Math.min(1, xAbs / 0.150), 2);
        const lipParting =
          Math.exp(-Math.pow((v - (0.342 + smileCorner)) / 0.0068, 2)) *
          Math.exp(-Math.pow(xAbs / 0.148, 2));
        const cornerDimple =
          Math.exp(-Math.pow((v - 0.351) / 0.014, 2)) *
          Math.exp(-Math.pow((xAbs - 0.158) / 0.032, 2));
        const lowerLip =
          Math.exp(-Math.pow((v - 0.318) / 0.0155, 2)) * Math.exp(-Math.pow(xAbs / 0.135, 2));

        z +=
          (upperLip * 0.0155 -
            lipParting * 0.0105 -
            cornerDimple * 0.0045 +
            lowerLip * 0.0155) *
          relief *
          faceMask;
        cavity += (lipParting * 0.84 + cornerDimple * 0.50) * faceMask;

        // Smooth calm forehead dome
        const foreheadWeight = Math.exp(-Math.pow((v - 0.700) / 0.085, 2)) * frontFade;
        z += foreheadWeight * 0.007 * relief * vertFade;
      }

      // Stepped classical M-arch hairline transition near top of forehead & temples
      const xAbsAll = Math.abs(sinT);
      const hairlineV =
        cosT > 0
          ? 0.750 - 0.014 * Math.exp(-Math.pow(xAbsAll / 0.10, 2)) - 0.068 * Math.pow(xAbsAll, 2.2)
          : 0.675;
      const hairlineStep = THREE.MathUtils.smoothstep(v, hairlineV - 0.012, hairlineV + 0.012);
      const hairlineGroove = Math.exp(-Math.pow((v - hairlineV) / 0.014, 2));
      if (v > hairlineV - 0.025) {
        x += sinT * hairlineStep * 0.0032;
        z += cosT * hairlineStep * 0.0032;
        cavity += hairlineGroove * 0.56 + hairlineStep * 0.32;
      }

      if (iy === latSegs) {
        x = 0;
        z = 0;
      }

      positions.push(x, y, z);
      uvs.push(u, v);

      const cav = THREE.MathUtils.clamp(cavity, 0, 1);
      if (cav > 0.45) {
        _cTmp.lerpColors(BRONZE_MID_C, BRONZE_PATINA_C, (cav - 0.45) / 0.55);
      } else {
        _cTmp.lerpColors(BRONZE_BRIGHT_C, BRONZE_MID_C, cav / 0.45);
      }
      colors.push(_cTmp.r, _cTmp.g, _cTmp.b);
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
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds an anatomical sculpted royal ear with carved outer helix rim, inner antihelix ridge,
 * recessed concha bowl with bronze patina, and natural rounded child lobe (or slotted adult lobe).
 */
function buildAnatomicalBronzeEar(
  skinMat: THREE.Material,
  shadowMat: THREE.Material,
  side: -1 | 1,
  elongatedSlotted = false,
): THREE.Group {
  const ear = new THREE.Group();

  const earShape = new THREE.Shape();
  if (elongatedSlotted) {
    earShape.moveTo(-0.04, 0.16);
    earShape.bezierCurveTo(0.06, 0.21, 0.11, 0.11, 0.085, -0.05);
    earShape.bezierCurveTo(0.07, -0.22, 0.06, -0.35, 0.012, -0.40);
    earShape.bezierCurveTo(-0.036, -0.41, -0.058, -0.32, -0.042, -0.20);
    earShape.bezierCurveTo(-0.035, -0.06, -0.05, 0.06, -0.04, 0.16);

    const slot = new THREE.Path();
    slot.moveTo(0.002, -0.15);
    slot.bezierCurveTo(0.022, -0.15, 0.022, -0.32, 0.002, -0.32);
    slot.bezierCurveTo(-0.018, -0.32, -0.018, -0.15, 0.002, -0.15);
    earShape.holes.push(slot);
  } else {
    // Natural rounded youthful Prince Siddhartha ear with distinct auricle & plump round lobe
    earShape.moveTo(-0.018, 0.062);
    earShape.bezierCurveTo(0.038, 0.078, 0.064, 0.042, 0.052, -0.014);
    earShape.bezierCurveTo(0.044, -0.058, 0.028, -0.084, 0.004, -0.086);
    earShape.bezierCurveTo(-0.016, -0.084, -0.026, -0.056, -0.020, -0.014);
    earShape.bezierCurveTo(-0.018, 0.020, -0.022, 0.042, -0.018, 0.062);
  }

  const depth = elongatedSlotted ? 0.044 : 0.022;
  const shellGeo = new THREE.ExtrudeGeometry(earShape, {
    depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.42,
    bevelSize: depth * 0.34,
    bevelSegments: 3,
    curveSegments: 16,
  });
  shellGeo.center();
  setGeometryCavityColor(shellGeo, (i, pos) => (Math.abs(pos.getZ(i)) < depth * 0.35 ? 0.55 : 0.15));

  const shell = new THREE.Mesh(shellGeo, skinMat);
  shell.rotation.y = side * (Math.PI * 0.5 - (elongatedSlotted ? 0.34 : 0.44));
  shell.castShadow = true;

  // Sculpted outer helix rim tube wrapping the ear edge
  const helixPts = elongatedSlotted
    ? [
        new THREE.Vector3(-0.02, 0.14, 0.01),
        new THREE.Vector3(0.06, 0.15, 0.012),
        new THREE.Vector3(0.08, 0.02, 0.012),
        new THREE.Vector3(0.045, -0.14, 0.010),
      ]
    : [
        new THREE.Vector3(-0.012, 0.052, 0.008),
        new THREE.Vector3(0.036, 0.058, 0.010),
        new THREE.Vector3(0.048, 0.006, 0.010),
        new THREE.Vector3(0.026, -0.056, 0.008),
      ];
  const helixGeo = createTaperedLimbGeometry(
    new THREE.CatmullRomCurve3(helixPts),
    (t) => (elongatedSlotted ? 0.016 : 0.0085) * (1.0 - 0.18 * t),
    14,
    8,
  );
  setGeometryUniformColor(helixGeo, 0xf2c24c);
  const helix = new THREE.Mesh(helixGeo, skinMat);
  helix.rotation.y = shell.rotation.y;

  // Deep antique-patina concha cavity & sculpted antihelix ridge
  const conchaGeo = new THREE.SphereGeometry(elongatedSlotted ? 0.046 : 0.024, 12, 10);
  setGeometryUniformColor(conchaGeo, 0x4e3208);
  const concha = new THREE.Mesh(conchaGeo, shadowMat);
  concha.scale.set(0.32, 1.25, 0.70);
  concha.position.set(side * (elongatedSlotted ? 0.016 : 0.010), elongatedSlotted ? 0.03 : -0.004, 0.008);

  const tragusGeo = new THREE.SphereGeometry(elongatedSlotted ? 0.020 : 0.011, 10, 8);
  setGeometryUniformColor(tragusGeo, 0xe8b540);
  const tragus = new THREE.Mesh(tragusGeo, skinMat);
  tragus.position.set(side * (elongatedSlotted ? 0.008 : 0.006), elongatedSlotted ? -0.02 : -0.010, 0.022);

  ear.add(shell, helix, concha, tragus);
  return ear;
}

/**
 * Generates a coiled 3D snail-shell Dakshinavarta hair curl geometry with root patina
 * and golden highlight crests so each curl reads sharply on cast bronze.
 */
function createSpiralCurlGeo(baseRadius = 0.024): THREE.BufferGeometry {
  const pts: THREE.Vector3[] = [];
  const turns = 1.65;
  const steps = 18;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const ang = t * Math.PI * 2 * turns;
    const r = baseRadius * (1.0 - t * 0.76);
    const y = t * baseRadius * 0.88;
    pts.push(new THREE.Vector3(Math.cos(ang) * r, y, Math.sin(ang) * r));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const geo = createTaperedLimbGeometry(
    curve,
    (t) => baseRadius * (0.36 - 0.16 * t),
    8,
    5,
  );
  geo.scale(1 / baseRadius, 1 / baseRadius, 1 / baseRadius);
  geo.computeVertexNormals();
  setGeometryCavityColor(
    geo,
    (i, pos) => 1.0 - THREE.MathUtils.clamp(pos.getY(i) / 0.85, 0, 1),
    HAIR_PATINA_C,
    BRONZE_MID_C,
    HAIR_CREST_C,
  );
  return geo;
}

/**
 * Creates a sculpted, classical adult Buddha head using unified continuous geometry,
 * calm oval face, arched brows, half-closed eyelids, elongated pierced ears,
 * coiled Dakshinavarta snail-shell curls, Ushnisha dome, and subtle lotus-bud Ketumala finial.
 */
function buildSculptedBuddhaHead(
  mats: BuddhaMaterials,
  scale = 1.0,
): THREE.Group {
  const headGroup = new THREE.Group();
  const adultSkinMat = getSharedSeatedCastGoldMat();

  const cranium = new THREE.Mesh(createContinuousBuddhaHeadGeo('adult'), adultSkinMat);
  cranium.castShadow = true;
  cranium.receiveShadow = true;
  headGroup.add(cranium);

  // Sculpted hair cap beneath curls
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.358, 28, 22), mats.hairMat);
  hairCap.scale.set(0.97, 0.98, 1.03);
  hairCap.position.set(0, 0.195, -0.024);
  headGroup.add(hairCap);

  // Ushnisha wisdom dome + balanced lotus-bud Ketumala crown
  const ushnisha = new THREE.Mesh(new THREE.SphereGeometry(0.195, 22, 18), mats.hairMat);
  ushnisha.position.set(0, 0.56, -0.022);
  ushnisha.scale.set(1.0, 0.84, 1.0);
  ushnisha.castShadow = true;

  const ketuBase = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.082, 0.052, 16), mats.goldMat);
  ketuBase.position.set(0, 0.72, -0.022);
  const flamePts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.056, 0.038),
    new THREE.Vector2(0.044, 0.105),
    new THREE.Vector2(0.020, 0.175),
    new THREE.Vector2(0.0, 0.225),
  ];
  const ketuFlame = new THREE.Mesh(new THREE.LatheGeometry(flamePts, 16), mats.goldMat);
  ketuFlame.position.set(0, 0.74, -0.022);
  ketuFlame.castShadow = true;
  headGroup.add(ushnisha, ketuBase, ketuFlame);

  // Dense 8-tier oriented 3D snail-shell hair curls
  const curlPositions: Array<[number, number, number, number]> = [];
  const rows: Array<[number, number, number, number]> = [
    [32, 0.354, 0.165, 0.040],
    [30, 0.356, 0.240, 0.040],
    [28, 0.340, 0.315, 0.039],
    [24, 0.305, 0.390, 0.038],
    [20, 0.252, 0.460, 0.037],
    [16, 0.190, 0.525, 0.035],
    [14, 0.182, 0.590, 0.033],
    [10, 0.125, 0.655, 0.031],
  ];
  rows.forEach(([count, rr, ry, cs], rIdx) => {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + rIdx * 0.24;
      const cosA = Math.cos(a);
      if (rIdx === 0 && cosA > 0.18) continue;
      if (rIdx === 1 && cosA > 0.42) continue;
      if (rIdx === 2 && cosA > 0.68) continue;
      if (rIdx === 3 && cosA > 0.88) continue;
      curlPositions.push([
        Math.sin(a) * rr * 0.94,
        ry,
        cosA * rr * 1.01 - 0.022,
        cs,
      ]);
    }
  });
  const curlGeo = createSpiralCurlGeo(0.042);
  const curlMesh = new THREE.InstancedMesh(curlGeo, mats.hairMat, curlPositions.length);
  curlMesh.castShadow = true;
  const upVec = new THREE.Vector3(0, 1, 0);
  const outVec = new THREE.Vector3();
  curlPositions.forEach(([cx, cy, cz, cs], idx) => {
    _v3.set(cx, cy, cz);
    outVec.set(cx, Math.max(0.08, cy - 0.195), cz + 0.022).normalize();
    _q.setFromUnitVectors(upVec, outVec);
    _s.set(cs, cs * 0.90, cs);
    _m4.compose(_v3, _q, _s);
    curlMesh.setMatrixAt(idx, _m4);
  });
  curlMesh.instanceMatrix.needsUpdate = true;
  curlMesh.computeBoundingSphere();
  headGroup.add(curlMesh);

  // Subtle sculpted Urna jewel above bridge of nose
  const urna = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 10), mats.goldMat);
  urna.scale.set(1.0, 1.0, 0.55);
  urna.position.set(0, 0.138, 0.372);
  headGroup.add(urna);

  // Sculpted elongated slotted pierced ears flush along cranium sides
  const adultEarSkinMat = getSharedSeatedCastGoldMat();
  for (const side of [-1, 1] as const) {
    const ear = buildAnatomicalBronzeEar(adultEarSkinMat, mats.bronzeMat, side, true);
    ear.position.set(side * 0.342, -0.05, -0.015);
    ear.rotation.y = side * -0.10;
    headGroup.add(ear);
  }

  headGroup.scale.setScalar(scale);
  return headGroup;
}

/**
 * Builds an open-work filigree Prabhavali (Dharma Halo Mandorla) anchored firmly behind
 * the Buddha statue with vertical bronze struts down to the lotus throne.
 */
function buildPrabhavaliHalo(
  mats: BuddhaMaterials,
  centerY: number,
  backZ: number,
  radius: number,
  strutBottomY: number,
): THREE.Group {
  const halo = new THREE.Group();

  const outerRing = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.068, 12, 48), mats.goldMat);
  outerRing.position.set(0, centerY, backZ);
  outerRing.castShadow = true;

  const midRing = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.76, 0.042, 10, 40), mats.bronzeMat);
  midRing.position.set(0, centerY, backZ + 0.01);

  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.44, 0.034, 10, 32), mats.goldMat);
  innerRing.position.set(0, centerY, backZ + 0.015);

  const chakraHub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.15, radius * 0.15, 0.06, 20), mats.goldMat);
  chakraHub.rotation.x = Math.PI / 2;
  chakraHub.position.set(0, centerY, backZ + 0.015);

  halo.add(outerRing, midRing, innerRing, chakraHub);

  // 16 Dharmachakra radial spokes + outer flame scroll pearls
  const spokeGeo = new THREE.CylinderGeometry(0.018, 0.022, radius * 0.94, 8);
  const spokeMesh = new THREE.InstancedMesh(spokeGeo, mats.goldMat, 16);
  const flameBeadGeo = new THREE.OctahedronGeometry(0.056, 1);
  const beadMesh = new THREE.InstancedMesh(flameBeadGeo, mats.goldMat, 24);

  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    _v3.set(Math.cos(a) * radius * 0.49, centerY + Math.sin(a) * radius * 0.49, backZ);
    _q.setFromEuler(_e.set(0, 0, a - Math.PI / 2));
    _s.setScalar(1);
    _m4.compose(_v3, _q, _s);
    spokeMesh.setMatrixAt(i, _m4);
  }
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    _v3.set(Math.cos(a) * (radius + 0.11), centerY + Math.sin(a) * (radius + 0.11), backZ);
    _q.setFromEuler(_e.set(0, 0, a - Math.PI / 2));
    _s.set(0.85, 1.35, 0.65);
    _m4.compose(_v3, _q, _s);
    beadMesh.setMatrixAt(i, _m4);
  }
  spokeMesh.instanceMatrix.needsUpdate = true;
  beadMesh.instanceMatrix.needsUpdate = true;
  halo.add(spokeMesh, beadMesh);

  // Anchor struts connecting Prabhavali down into the throne pedestal so nothing ever floats
  const strutH = Math.max(0.5, centerY - strutBottomY);
  for (const sx of [-radius * 0.36, radius * 0.36]) {
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, strutH, 10), mats.bronzeMat);
    strut.position.set(sx, strutBottomY + strutH * 0.5, backZ);
    strut.castShadow = true;
    halo.add(strut);
  }

  return halo;
}

/**
 * Builds sculpted finger + hand assembly for Earth-touching / Dhyana / Blessing mudras.
 */
function buildSculptedHand(
  mat: THREE.Material,
  pose: 'palm-up' | 'earth-touch' | 'abhaya-up' | 'hem-hold',
  mirrorX = 1,
): THREE.Group {
  const hand = new THREE.Group();
  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.115, 14, 12), mat);
  palm.scale.set(1.05, 0.42, 1.25);
  palm.castShadow = true;
  hand.add(palm);

  const fingerOffsets = [-0.075, -0.025, 0.025, 0.075];
  const fingerLens = [0.11, 0.132, 0.125, 0.098];

  for (let i = 0; i < 4; i++) {
    const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.019, fingerLens[i], 5, 8), mat);
    if (pose === 'earth-touch') {
      f.rotation.x = 0.25;
      f.position.set(fingerOffsets[i] * mirrorX, -0.08 - fingerLens[i] * 0.45, 0.105);
    } else if (pose === 'abhaya-up') {
      f.position.set(fingerOffsets[i] * mirrorX, 0.09 + fingerLens[i] * 0.45, 0.01);
    } else if (pose === 'hem-hold') {
      f.rotation.x = 0.85;
      f.position.set(fingerOffsets[i] * mirrorX, -0.05, 0.09);
    } else {
      f.rotation.x = Math.PI / 2 - 0.12;
      f.position.set(fingerOffsets[i] * mirrorX, 0.01, 0.11 + fingerLens[i] * 0.42);
    }
    hand.add(f);
  }

  const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.021, 0.085, 5, 8), mat);
  if (pose === 'earth-touch') {
    thumb.rotation.z = mirrorX * 0.45;
    thumb.position.set(mirrorX * -0.095, -0.03, 0.06);
  } else if (pose === 'abhaya-up') {
    thumb.rotation.z = mirrorX * -0.52;
    thumb.position.set(mirrorX * -0.105, 0.055, 0.025);
  } else {
    thumb.rotation.z = mirrorX * 0.8;
    thumb.position.set(mirrorX * 0.085, 0.032, 0.055);
  }
  hand.add(thumb);

  if (pose === 'abhaya-up') {
    palm.rotation.x = Math.PI / 2;
  }

  return hand;
}

/**
 * 1. Monumental Seated Great Buddha (Bhumisparsha or Muchalinda Dhyana Mudra)
 *    atop a stepped octagonal Vajrasana Lion-Throne & Double-Tier Golden Lotus Pedestal.
 */
export function createMonumentalSeatedBuddha(
  mats: BuddhaMaterials,
  options: {
    scale?: number;
    pose?: 'bhumisparsha' | 'dhyana';
    withNagaCanopy?: boolean;
    withOfferingLamps?: boolean;
    withAlmsBowl?: boolean;
    crimsonThrone?: boolean;
  } = {},
): THREE.Group {
  const scale = options.scale ?? 1.38;
  const pose = options.pose ?? 'bhumisparsha';
  const withNaga = options.withNagaCanopy ?? false;
  const withLamps = options.withOfferingLamps ?? true;
  const withAlmsBowl = options.withAlmsBowl ?? false;
  const thronePlinthMat = options.crimsonThrone ? mats.crimsonLacquerMat : mats.stonePlinthMat;

  const root = new THREE.Group();
  const monument = new THREE.Group();

  // A. Carved Octagonal Vajrasana / Tibetan Lion-Throne Plinth (y: 0 -> 1.38)
  const plinth1 = new THREE.Mesh(new THREE.CylinderGeometry(2.68, 2.86, 0.34, 8), thronePlinthMat);
  plinth1.position.y = 0.17;
  plinth1.castShadow = true;
  plinth1.receiveShadow = true;

  const plinth2 = new THREE.Mesh(new THREE.CylinderGeometry(2.38, 2.52, 0.24, 8), thronePlinthMat);
  plinth2.position.y = 0.46;
  plinth2.castShadow = true;
  plinth2.receiveShadow = true;

  const drum = new THREE.Mesh(new THREE.CylinderGeometry(2.08, 2.16, 0.56, 8), thronePlinthMat);
  drum.position.y = 0.86;
  drum.castShadow = true;
  drum.receiveShadow = true;

  const cornice = new THREE.Mesh(new THREE.CylinderGeometry(2.38, 2.16, 0.22, 8), mats.goldMat);
  cornice.position.y = 1.25;
  cornice.castShadow = true;
  cornice.receiveShadow = true;

  const bronzeTrim = new THREE.Mesh(new THREE.TorusGeometry(2.14, 0.045, 8, 24), mats.bronzeMat);
  bronzeTrim.rotation.x = Math.PI / 2;
  bronzeTrim.position.y = 1.14;

  monument.add(plinth1, plinth2, drum, cornice, bronzeTrim);

  // Corner pilasters & golden Dharma medallions around octagonal drum
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const pil = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.56, 0.24), mats.goldMat);
    pil.position.set(Math.sin(a) * 2.08, 0.86, Math.cos(a) * 2.08);
    pil.rotation.y = a;
    monument.add(pil);

    const panelA = (i / 8) * Math.PI * 2;
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 16), mats.goldMat);
    disc.rotation.x = Math.PI / 2;
    disc.rotation.z = -panelA;
    disc.position.set(Math.sin(panelA) * 1.97, 0.86, Math.cos(panelA) * 1.97);
    monument.add(disc);
  }

  // Optional flickering bronze butter lamps along the front offering sill
  if (withLamps) {
    const lampStemGeo = new THREE.CylinderGeometry(0.032, 0.055, 0.14, 10);
    const lampCupGeo = new THREE.CylinderGeometry(0.08, 0.035, 0.05, 12);
    const lampFlameGeo = new THREE.ConeGeometry(0.03, 0.11, 8);
    for (const lx of [-1.42, -0.86, -0.3, 0.3, 0.86, 1.42]) {
      const lz = 2.06 - Math.abs(lx) * 0.22;
      const stem = new THREE.Mesh(lampStemGeo, mats.bronzeMat);
      stem.position.set(lx, 0.41, lz);
      const cup = new THREE.Mesh(lampCupGeo, mats.goldMat);
      cup.position.set(lx, 0.50, lz);
      const flame = new THREE.Mesh(lampFlameGeo, mats.flameMat);
      flame.position.set(lx, 0.57, lz);
      monument.add(stem, cup, flame);
    }
  }

  // B. Double-Tier Sculpted Golden Lotus Pedestal (y: 1.36 -> 2.08)
  const lotusCorePts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(1.94, 0.0),
    new THREE.Vector2(1.66, 0.26),
    new THREE.Vector2(1.56, 0.42),
    new THREE.Vector2(1.88, 0.68),
    new THREE.Vector2(1.76, 0.72),
    new THREE.Vector2(0.0, 0.72),
  ];
  const lotusCore = new THREE.Mesh(new THREE.LatheGeometry(lotusCorePts, 32), mats.crimsonLacquerMat);
  lotusCore.position.y = 1.36;
  lotusCore.castShadow = true;
  lotusCore.receiveShadow = true;
  monument.add(lotusCore);

  const petalGeo = createPlumpLotusPetalGeo(0.56, 0.62, 0.15);
  const petalInst = new THREE.InstancedMesh(petalGeo, getSharedSeatedCastGoldMat(), 36);
  petalInst.castShadow = true;
  let pIdx = 0;
  for (let tier = 0; tier < 2; tier++) {
    const count = 18;
    const rad = tier === 0 ? 1.88 : 1.76;
    const py = tier === 0 ? 1.38 : 1.66;
    const tilt = tier === 0 ? 0.85 : -0.18;
    for (let i = 0; i < count; i++) {
      const a = ((i + tier * 0.5) / count) * Math.PI * 2;
      _v3.set(Math.sin(a) * rad, py, Math.cos(a) * rad);
      _q.setFromEuler(_e.set(0, a, 0));
      const tiltQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt, 0, 0));
      _q.multiply(tiltQ);
      _s.set(1.05, 1.0, 1.05);
      _m4.compose(_v3, _q, _s);
      petalInst.setMatrixAt(pIdx++, _m4);
    }
  }
  petalInst.instanceMatrix.needsUpdate = true;
  monument.add(petalInst);

  const seatRing = new THREE.Mesh(new THREE.TorusGeometry(1.74, 0.065, 10, 36), mats.goldMat);
  seatRing.rotation.x = Math.PI / 2;
  seatRing.position.y = 2.08;
  monument.add(seatRing);

  // C. Sculpted Buddha Body (local y = 0 at lotus seat = 2.08m)
  const buddha = new THREE.Group();
  buddha.position.y = 2.08;

  // Padmasana crossed legs foundation
  const lapPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(1.50, 0.0),
    new THREE.Vector2(1.44, 0.22),
    new THREE.Vector2(1.18, 0.44),
    new THREE.Vector2(0.76, 0.58),
  ];
  const lapMesh = new THREE.Mesh(new THREE.LatheGeometry(lapPts, 32), mats.robeMat);
  lapMesh.scale.set(1.16, 1.0, 0.78);
  lapMesh.castShadow = true;
  lapMesh.receiveShadow = true;
  buddha.add(lapMesh);

  for (const side of [-1, 1]) {
    const legCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 1.24, 0.22, 0.14),
      new THREE.Vector3(side * 0.84, 0.26, 0.54),
      new THREE.Vector3(side * 0.14, 0.31, 0.56),
    ]);
    const shin = new THREE.Mesh(new THREE.TubeGeometry(legCurve, 20, 0.23, 14, false), mats.robeMat);
    shin.castShadow = true;
    const knee = new THREE.Mesh(new THREE.SphereGeometry(0.41, 16, 14), mats.robeMat);
    knee.scale.set(1.20, 0.72, 1.02);
    knee.position.set(side * 1.05, 0.26, 0.15);
    knee.castShadow = true;

    // Upturned lotus foot sole resting cleanly on opposite thigh
    const footSole = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), mats.skinMat);
    footSole.scale.set(1.35, 0.44, 0.85);
    footSole.rotation.set(0.18, side * -0.45, side * -0.15);
    footSole.position.set(side * -0.28, 0.43, 0.48);
    buddha.add(shin, knee, footSole);
  }

  // Cascading front Sanghati robe fan hanging smoothly down front edge of lotus seat
  const drapeShape = new THREE.Shape();
  drapeShape.moveTo(-0.56, 0.08);
  drapeShape.quadraticCurveTo(0, 0.14, 0.56, 0.08);
  drapeShape.bezierCurveTo(0.68, -0.14, 0.52, -0.34, 0.28, -0.36);
  drapeShape.quadraticCurveTo(0, -0.42, -0.28, -0.36);
  drapeShape.bezierCurveTo(-0.52, -0.34, -0.68, -0.14, -0.56, 0.08);
  const drapeGeo = new THREE.ExtrudeGeometry(drapeShape, {
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.028,
    bevelSize: 0.025,
    bevelSegments: 2,
    curveSegments: 10,
  });
  const drapeMesh = new THREE.Mesh(drapeGeo, mats.robeMat);
  drapeMesh.rotation.x = -0.32;
  drapeMesh.position.set(0, 0.12, 0.96);
  drapeMesh.castShadow = true;
  buddha.add(drapeMesh);

  // Sculpted Anatomical Torso & Robe-draped Shoulders (clean silhouette without protruding spheres)
  const torsoPts = [
    new THREE.Vector2(0.0, 0.42),
    new THREE.Vector2(0.84, 0.52),
    new THREE.Vector2(0.65, 0.94),
    new THREE.Vector2(0.69, 1.38),
    new THREE.Vector2(0.80, 1.82),
    new THREE.Vector2(0.64, 2.06),
    new THREE.Vector2(0.24, 2.22),
    new THREE.Vector2(0.19, 2.40),
  ];
  const torso = new THREE.Mesh(new THREE.LatheGeometry(torsoPts, 36), mats.robeMat);
  torso.scale.set(1.14, 1.0, 0.70);
  torso.castShadow = true;
  torso.receiveShadow = true;
  buddha.add(torso);

  // Smooth sculpted bare right shoulder & upper chest contour flush with the torso
  const rightChest = new THREE.Mesh(new THREE.SphereGeometry(0.33, 18, 14), mats.skinMat);
  rightChest.scale.set(1.06, 0.90, 0.56);
  rightChest.position.set(0.30, 1.71, 0.11);
  rightChest.castShadow = true;
  const rightCollar = new THREE.Mesh(new THREE.CapsuleGeometry(0.135, 0.34, 8, 12), mats.skinMat);
  rightCollar.rotation.z = -1.28;
  rightCollar.position.set(0.41, 1.91, 0.04);
  buddha.add(rightChest, rightCollar);

  // Diagonal rolled monastic Sanghati robe edge & 5 tailored chest drapery folds hugging the torso
  for (let f = 0; f < 5; f++) {
    const off = f * 0.11;
    const foldCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.66 + off * 0.22, 2.02 - off * 0.24, 0.12),
      new THREE.Vector3(-0.14, 1.72 - off * 0.42, 0.51),
      new THREE.Vector3(0.42, 1.44 - off * 0.38, 0.44),
      new THREE.Vector3(0.70, 1.18 - off * 0.24, 0.06),
    ]);
    const foldRadius = f === 0 ? 0.044 : 0.028;
    const fold = new THREE.Mesh(new THREE.TubeGeometry(foldCurve, 22, foldRadius, 10, false), mats.robeMat);
    fold.castShadow = true;
    buddha.add(fold);
  }

  // Pleated folded shoulder shawl descending neatly over left shoulder
  const shawlCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.44, 2.12, -0.22),
    new THREE.Vector3(-0.54, 2.04, 0.14),
    new THREE.Vector3(-0.42, 1.62, 0.44),
    new THREE.Vector3(-0.34, 1.18, 0.46),
  ]);
  const shawl = new THREE.Mesh(new THREE.TubeGeometry(shawlCurve, 18, 0.072, 10, false), mats.robeMat);
  shawl.scale.set(1.15, 1, 0.42);
  shawl.castShadow = true;
  buddha.add(shawl);

  // Arms & Mudras — recessed cleanly inside shoulder wall with smooth anatomical taper to wrist
  const seatedArmRad = (t: number) => THREE.MathUtils.lerp(0.195, 0.128, Math.pow(t, 0.85));
  const leftArmCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.62, 1.92, 0.01),
    new THREE.Vector3(-0.84, 1.88, 0.02),
    new THREE.Vector3(-0.92, 1.34, 0.12),
    new THREE.Vector3(-0.70, 0.86, 0.42),
    new THREE.Vector3(-0.22, 0.62, 0.56),
  ]);
  const leftArm = new THREE.Mesh(createTaperedLimbGeometry(leftArmCurve, seatedArmRad, 28, 16), mats.robeMat);
  leftArm.castShadow = true;
  const leftHand = buildSculptedHand(mats.skinMat, 'palm-up', -1);
  leftHand.position.set(-0.08, 0.58, 0.58);
  buddha.add(leftArm, leftHand);

  if (pose === 'bhumisparsha') {
    // Right Arm: Graceful Earth-Touching pose draping over right knee
    const rightArmCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.62, 1.92, 0.01),
      new THREE.Vector3(0.84, 1.88, 0.02),
      new THREE.Vector3(0.94, 1.32, 0.12),
      new THREE.Vector3(0.92, 0.78, 0.34),
      new THREE.Vector3(0.84, 0.44, 0.46),
    ]);
    const rightArm = new THREE.Mesh(
      createTaperedLimbGeometry(rightArmCurve, (t) => THREE.MathUtils.lerp(0.185, 0.122, Math.pow(t, 0.85)), 28, 16),
      mats.skinMat,
    );
    rightArm.castShadow = true;
    const rightHand = buildSculptedHand(mats.skinMat, 'earth-touch', 1);
    rightHand.position.set(0.84, 0.38, 0.48);
    rightHand.rotation.y = -0.18;
    buddha.add(rightArm, rightHand);
  } else {
    // Symmetric Dhyana Mudra right arm & cupped palm
    const rightArmCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.62, 1.92, 0.01),
      new THREE.Vector3(0.84, 1.88, 0.02),
      new THREE.Vector3(0.92, 1.34, 0.12),
      new THREE.Vector3(0.70, 0.86, 0.42),
      new THREE.Vector3(0.22, 0.65, 0.56),
    ]);
    const rightArm = new THREE.Mesh(createTaperedLimbGeometry(rightArmCurve, seatedArmRad, 28, 16), mats.robeMat);
    rightArm.castShadow = true;
    const rightHand = buildSculptedHand(mats.skinMat, 'palm-up', 1);
    rightHand.position.set(0.06, 0.65, 0.56);
    buddha.add(rightArm, rightHand);
  }

  // Dark lacquered begging / alms bowl resting gently in Dhyana cupped palms (matching Great Buddha throne)
  if (withAlmsBowl) {
    const bowlMat = new THREE.MeshStandardMaterial({
      color: 0x262930,
      roughness: 0.28,
      metalness: 0.42,
    });
    const bowlPts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.18, 0.02),
      new THREE.Vector2(0.32, 0.12),
      new THREE.Vector2(0.35, 0.24),
      new THREE.Vector2(0.28, 0.30),
      new THREE.Vector2(0.25, 0.29),
      new THREE.Vector2(0.30, 0.22),
      new THREE.Vector2(0.0, 0.08),
    ];
    const bowl = new THREE.Mesh(new THREE.LatheGeometry(bowlPts, 24), bowlMat);
    bowl.position.set(0, 0.63, 0.58);
    bowl.castShadow = true;
    const bowlRim = new THREE.Mesh(new THREE.TorusGeometry(0.265, 0.016, 8, 24), mats.goldMat);
    bowlRim.rotation.x = Math.PI / 2;
    bowlRim.position.set(0, 0.92, 0.58);
    buddha.add(bowl, bowlRim);
  }

  // Head mounted firmly onto top of neck
  const head = buildSculptedBuddhaHead(mats, 1.0);
  head.position.set(0, 2.74, 0.02);
  buddha.add(head);

  // Muchalinda 7-Hooded Naga Canopy (if enabled) OR Filigree Prabhavali Halo
  if (withNaga) {
    // Coiled Naga snake seat rings behind lower back with golden scale bands
    for (let c = 0; c < 3; c++) {
      const coil = new THREE.Mesh(new THREE.TorusGeometry(1.44 - c * 0.13, 0.15, 10, 28), mats.stonePlinthMat);
      coil.rotation.x = Math.PI / 2;
      coil.position.set(0, 0.18 + c * 0.25, -0.34);
      coil.castShadow = true;
      buddha.add(coil);
    }
    const nagaNeck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.62, 2.75, 14),
      mats.stonePlinthMat,
    );
    nagaNeck.scale.set(1.25, 1, 0.42);
    nagaNeck.position.set(0, 1.65, -0.66);
    nagaNeck.castShadow = true;
    buddha.add(nagaNeck);

    // 7 fanned cobra hoods arching majestically over Buddha's crown with sculpted snout, gold collar & crest
    const hoodShape = new THREE.Shape();
    hoodShape.moveTo(-0.25, 0);
    hoodShape.bezierCurveTo(-0.36, 0.38, -0.24, 0.88, 0, 1.06);
    hoodShape.bezierCurveTo(0.24, 0.88, 0.36, 0.38, 0.25, 0);
    hoodShape.closePath();
    const hoodGeo = new THREE.ExtrudeGeometry(hoodShape, {
      depth: 0.14,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.03,
      bevelSegments: 2,
    });
    for (let h = -3; h <= 3; h++) {
      const angle = h * 0.25;
      const cobraHead = new THREE.Group();
      const hood = new THREE.Mesh(hoodGeo, mats.stonePlinthMat);
      hood.castShadow = true;

      // Forward-curving cobra head & snout crowning each hood
      const neckArch = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), mats.stonePlinthMat);
      neckArch.scale.set(1.0, 0.82, 1.45);
      neckArch.position.set(0, 0.84, 0.18);
      const crownJewel = new THREE.Mesh(new THREE.OctahedronGeometry(0.065, 0), mats.goldMat);
      crownJewel.position.set(0, 1.06, 0.10);
      const collarBand = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.025, 6, 14), mats.goldMat);
      collarBand.rotation.x = Math.PI / 2;
      collarBand.position.set(0, 0.44, 0.08);

      cobraHead.add(hood, neckArch, crownJewel, collarBand);
      cobraHead.position.set(Math.sin(angle) * 0.96, 2.86 + Math.cos(angle) * 0.36, -0.60 + Math.abs(h) * 0.06);
      cobraHead.rotation.z = -angle * 0.82;
      cobraHead.rotation.x = 0.26;
      cobraHead.scale.setScalar(1.08 - Math.abs(h) * 0.055);
      buddha.add(cobraHead);
    }
  } else {
    const halo = buildPrabhavaliHalo(mats, 2.68, -0.78, 1.48, 0.0);
    buddha.add(halo);
  }

  monument.add(buddha);
  monument.scale.setScalar(scale);
  root.add(monument);
  return root;
}

/**
 * 2. Monumental Standing Abhaya Mudra (Peace / Fearlessness Blessing) Buddha
 *    with flowing symmetrical Sanghati robe pleats & lotus pedestal.
 */
export function createStandingBlessingBuddha(
  mats: BuddhaMaterials,
  scale = 1.15,
): THREE.Group {
  const root = new THREE.Group();
  const group = new THREE.Group();

  // Carved square-to-octagonal stone & lotus pedestal (y: 0 -> 1.15)
  const stepBase = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.28, 2.4), mats.stonePlinthMat);
  stepBase.position.y = 0.14;
  stepBase.castShadow = true;
  stepBase.receiveShadow = true;

  const octPlinth = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.08, 0.48, 8), mats.stonePlinthMat);
  octPlinth.position.y = 0.52;
  octPlinth.castShadow = true;

  const lotusPad = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.86, 0.32, 24), mats.goldMat);
  lotusPad.position.y = 0.92;
  lotusPad.castShadow = true;
  group.add(stepBase, octPlinth, lotusPad);

  // Standing figure (y = 1.08 -> 4.35)
  const fig = new THREE.Group();
  fig.position.y = 1.08;

  // Bare feet grounded firmly on lotus pad
  for (const side of [-1, 1]) {
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.10, 0.30), mats.skinMat);
    foot.position.set(side * 0.15, 0.05, 0.06);
    fig.add(foot);
  }

  // Symmetrical flowing monastic Sanghati robe Lathe silhouette
  const robePts = [
    new THREE.Vector2(0.0, 0.10),
    new THREE.Vector2(0.46, 0.10),
    new THREE.Vector2(0.41, 0.55),
    new THREE.Vector2(0.36, 1.05),
    new THREE.Vector2(0.34, 1.55),
    new THREE.Vector2(0.42, 2.05),
    new THREE.Vector2(0.50, 2.42),
    new THREE.Vector2(0.42, 2.60),
    new THREE.Vector2(0.15, 2.72),
    new THREE.Vector2(0.12, 2.86),
  ];
  const body = new THREE.Mesh(new THREE.LatheGeometry(robePts, 28), mats.robeMat);
  body.scale.set(1.12, 1.0, 0.72);
  body.castShadow = true;
  body.receiveShadow = true;
  fig.add(body);

  // Rhythmic U-shaped Gandhara/Mathura robe drapery folds down front
  for (let u = 0; u < 6; u++) {
    const ry = 0.45 + u * 0.34;
    const rad = 0.33 + (u >= 4 ? 0.05 : 0);
    const uCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-rad, ry + 0.16, 0.04),
      new THREE.Vector3(-rad * 0.5, ry + 0.02, rad * 0.72),
      new THREE.Vector3(0, ry - 0.05, rad * 0.78),
      new THREE.Vector3(rad * 0.5, ry + 0.02, rad * 0.72),
      new THREE.Vector3(rad, ry + 0.16, 0.04),
    ]);
    const pleat = new THREE.Mesh(new THREE.TubeGeometry(uCurve, 16, 0.024, 8, false), mats.robeMat);
    fig.add(pleat);
  }

  // Right arm raised in Abhaya (Peace / Fearlessness) Mudra
  const rightArmCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.48, 2.48, 0.0),
    new THREE.Vector3(0.58, 1.98, 0.06),
    new THREE.Vector3(0.46, 1.88, 0.36),
    new THREE.Vector3(0.38, 2.18, 0.44),
  ]);
  const rightArm = new THREE.Mesh(new THREE.TubeGeometry(rightArmCurve, 18, 0.105, 12, false), mats.robeMat);
  rightArm.castShadow = true;
  const rightHand = buildSculptedHand(mats.skinMat, 'abhaya-up', 1);
  rightHand.scale.setScalar(0.75);
  rightHand.position.set(0.38, 2.26, 0.45);
  fig.add(rightArm, rightHand);

  // Left arm descending gracefully to clasp robe hem
  const leftArmCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.48, 2.48, 0.0),
    new THREE.Vector3(-0.56, 1.92, 0.06),
    new THREE.Vector3(-0.44, 1.48, 0.24),
  ]);
  const leftArm = new THREE.Mesh(new THREE.TubeGeometry(leftArmCurve, 18, 0.105, 12, false), mats.robeMat);
  leftArm.castShadow = true;
  const leftHand = buildSculptedHand(mats.skinMat, 'hem-hold', -1);
  leftHand.scale.setScalar(0.74);
  leftHand.position.set(-0.42, 1.42, 0.26);
  fig.add(leftArm, leftHand);

  // Serene head & Ushnisha
  const head = buildSculptedBuddhaHead(mats, 0.72);
  head.position.set(0, 3.08, 0.02);
  fig.add(head);

  // Bronze Halo behind head
  const halo = buildPrabhavaliHalo(mats, 3.04, -0.45, 0.92, 0.10);
  fig.add(halo);

  group.add(fig);
  group.scale.setScalar(scale);
  root.add(group);
  return root;
}

/**
 * 3. Golden Baby Siddhartha Nativity Statue (Right arm pointing skyward, standing on open golden lotus)
 *    for the illuminated Maya Devi Inner Sanctum Marker Stone shrine.
 */
export function createNativitySiddharthaStatue(
  goldMat: THREE.Material,
  stoneMat: THREE.Material,
): THREE.Group {
  const g = new THREE.Group();

  // Carved Sacred Marker Stone Altar Slab
  const markerBase = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.26, 1.15), stoneMat);
  markerBase.position.y = 0.13;
  markerBase.castShadow = true;
  markerBase.receiveShadow = true;

  const lotusCup = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.26, 0.24, 16), goldMat);
  lotusCup.position.y = 0.38;
  g.add(markerBase, lotusCup);

  // Standing Baby Siddhartha figure
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 0.46, 14), goldMat);
  torso.position.y = 0.88;
  const dhoti = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.17, 0.26, 14), goldMat);
  dhoti.position.y = 0.64;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.145, 16, 14), goldMat);
  head.position.y = 1.24;
  const topknot = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 10), goldMat);
  topknot.position.y = 1.39;

  // Right arm raised skyward ("I am foremost in the world"), left arm lowered
  const rArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.036, 0.34, 6, 8), goldMat);
  rArm.rotation.z = -0.22;
  rArm.position.set(0.18, 1.24, 0.02);
  const lArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.036, 0.32, 6, 8), goldMat);
  lArm.rotation.z = 0.18;
  lArm.position.set(-0.18, 0.82, 0.02);

  // Subtle vertical radiant mandorla ring behind child figure
  const aureole = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.028, 8, 32), goldMat);
  aureole.position.set(0, 1.05, -0.22);

  g.add(torso, dhoti, head, topknot, rArm, lArm, aureole);
  return g;
}

export function createRoundedSpoonLotusPetalGeo(
  width = 0.062,
  length = 0.118,
  cupDepth = 0.022,
): THREE.BufferGeometry {
  const uSegs = 6;
  const vSegs = 8;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];

  for (let iv = 0; iv <= vSegs; iv++) {
    const v = iv / vSegs;
    // Rounded spoon profile: slender base -> broad mid-belly -> softly rounded tip (never pointy)
    const widthEnv = Math.sin(Math.pow(v, 0.72) * Math.PI * 0.94 + 0.12);
    const halfW = width * 0.5 * widthEnv;
    const y = Math.pow(v, 1.08) * length;
    const spoonCurl = Math.sin(v * Math.PI) * cupDepth * 0.55;
    for (let iu = 0; iu <= uSegs; iu++) {
      const u = iu / uSegs;
      const s = u * 2 - 1;
      const x = s * halfW;
      // Cupped concave inner dish + delicate central vein ridge
      const dish = (1 - s * s) * Math.sin(v * Math.PI) * cupDepth;
      const vein = Math.exp(-s * s * 16) * 0.0025 * Math.sin(v * Math.PI);
      const z = dish + spoonCurl - vein;
      pos.push(x, y, z);
      uv.push(u, v);
    }
  }
  const stride = uSegs + 1;
  for (let iv = 0; iv < vSegs; iv++) {
    for (let iu = 0; iu < uSegs; iu++) {
      const a = iv * stride + iu;
      const b = a + 1;
      const c = (iv + 1) * stride + iu + 1;
      const d = (iv + 1) * stride + iu;
      idx.push(a, b, c, a, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

export function createBotanicalLotusTextures(): {
  petalMap: THREE.CanvasTexture | null;
  padMap: THREE.CanvasTexture | null;
} {
  if (typeof document === 'undefined') return { petalMap: null, padMap: null };

  // Delicate pink-to-ivory sacred Nelumbo petal texture with vertical crimson veins
  const pc = document.createElement('canvas');
  pc.width = 128;
  pc.height = 128;
  const pCtx = pc.getContext('2d')!;
  const pGrad = pCtx.createLinearGradient(0, 128, 0, 0);
  pGrad.addColorStop(0.0, '#fff4ea');
  pGrad.addColorStop(0.45, '#fbd6e0');
  pGrad.addColorStop(0.84, '#f094b2');
  pGrad.addColorStop(1.0, '#d85b86');
  pCtx.fillStyle = pGrad;
  pCtx.fillRect(0, 0, 128, 128);
  pCtx.strokeStyle = 'rgba(196, 62, 108, 0.28)';
  pCtx.lineWidth = 1.4;
  for (let v = -5; v <= 5; v++) {
    pCtx.beginPath();
    pCtx.moveTo(64 + v * 3, 128);
    pCtx.quadraticCurveTo(64 + v * 11, 64, 64 + v * 7, 4);
    pCtx.stroke();
  }
  const petalMap = new THREE.CanvasTexture(pc);
  petalMap.colorSpace = THREE.SRGBColorSpace;

  // Radial veined emerald lily pad texture with subtle burgundy edge & water droplets
  const lc = document.createElement('canvas');
  lc.width = 256;
  lc.height = 256;
  const lCtx = lc.getContext('2d')!;
  const lGrad = lCtx.createRadialGradient(128, 128, 8, 128, 128, 126);
  lGrad.addColorStop(0, '#629842');
  lGrad.addColorStop(0.55, '#3b7329');
  lGrad.addColorStop(0.92, '#2d5c20');
  lGrad.addColorStop(1.0, '#574828');
  lCtx.fillStyle = lGrad;
  lCtx.fillRect(0, 0, 256, 256);
  lCtx.strokeStyle = 'rgba(146, 198, 92, 0.42)';
  lCtx.lineWidth = 1.6;
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    lCtx.beginPath();
    lCtx.moveTo(128, 128);
    lCtx.quadraticCurveTo(
      128 + Math.cos(a + 0.1) * 68,
      128 + Math.sin(a + 0.1) * 68,
      128 + Math.cos(a) * 120,
      128 + Math.sin(a) * 120,
    );
    lCtx.stroke();
  }
  const padMap = new THREE.CanvasTexture(lc);
  padMap.colorSpace = THREE.SRGBColorSpace;
  return { petalMap, padMap };
}

function createSculptedMarigoldFlowerGeo(): { petalGeo: THREE.BufferGeometry; calyxGeo: THREE.BufferGeometry } {
  const petalParts: THREE.BufferGeometry[] = [];
  const push = (g: THREE.BufferGeometry, y = 0, rx = 0, ry = 0, rz = 0, x = 0, z = 0) => {
    const ni = g.index ? g.toNonIndexed() : g.clone();
    if (rx) ni.rotateX(rx);
    if (ry) ni.rotateY(ry);
    if (rz) ni.rotateZ(rz);
    ni.translate(x, y, z);
    if (!ni.getAttribute('normal')) ni.computeVertexNormals();
    if (!ni.getAttribute('uv')) {
      ni.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(ni.getAttribute('position').count * 2), 2));
    }
    petalParts.push(ni);
    g.dispose();
  };

  // Delicate individual ruffled Sayapatri marigold florets arranged in 3 airy concentric whorls (never lumpy spheres)
  const floretOuter = createRoundedSpoonLotusPetalGeo(0.020, 0.036, 0.005);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const tilt = 1.08 + (i % 2) * 0.14;
    push(floretOuter.clone(), 0.014, tilt, -a, 0, Math.sin(a) * 0.018, Math.cos(a) * 0.018);
  }
  for (let i = 0; i < 9; i++) {
    const a = ((i + 0.45) / 9) * Math.PI * 2;
    const f = floretOuter.clone();
    f.scale(0.84, 0.86, 0.84);
    push(f, 0.020, 0.62 + (i % 2) * 0.12, -a, 0, Math.sin(a) * 0.011, Math.cos(a) * 0.011);
  }
  for (let i = 0; i < 6; i++) {
    const a = ((i + 0.25) / 6) * Math.PI * 2;
    const f = floretOuter.clone();
    f.scale(0.64, 0.72, 0.64);
    push(f, 0.025, 0.24, -a, 0, Math.sin(a) * 0.004, Math.cos(a) * 0.004);
  }
  floretOuter.dispose();

  const petalGeo = mergeGeometries(petalParts, false)!;
  petalParts.forEach((p) => p.dispose());

  // Tapered green sepal calyx cup + flanking leaf tips
  const calyxParts: THREE.BufferGeometry[] = [];
  const cup = new THREE.CylinderGeometry(0.022, 0.010, 0.018, 7).toNonIndexed();
  cup.translate(0, 0.009, 0);
  calyxParts.push(cup);
  for (let l = 0; l < 2; l++) {
    const leaf = createRoundedSpoonLotusPetalGeo(0.016, 0.032, 0.003).toNonIndexed();
    leaf.rotateX(1.32);
    leaf.rotateY(l * Math.PI + 0.4);
    leaf.translate(0, 0.008, 0);
    calyxParts.push(leaf);
  }
  const calyxGeo = mergeGeometries(calyxParts, false)!;
  calyxParts.forEach((c) => c.dispose());
  return { petalGeo, calyxGeo };
}

function createSculptedCuppedLotusFlowerGeo(): {
  petalGeo: THREE.BufferGeometry;
  podGeo: THREE.BufferGeometry;
  padGeo: THREE.BufferGeometry;
} {
  const parts: THREE.BufferGeometry[] = [];
  const push = (g: THREE.BufferGeometry, y = 0, ry = 0, rx = 0, x = 0, z = 0) => {
    const ni = g.index ? g.toNonIndexed() : g.clone();
    if (rx) ni.rotateX(rx);
    if (ry) ni.rotateY(ry);
    ni.translate(x, y, z);
    parts.push(ni);
    g.dispose();
  };
  const outerPetal = createRoundedSpoonLotusPetalGeo(0.068, 0.118, 0.024);
  // Outer 8 wide-open gently cupped petals
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    push(outerPetal.clone(), 0.012, a, 1.02 + (i % 2) * 0.08, Math.sin(a) * 0.032, Math.cos(a) * 0.032);
  }
  // Middle 8 half-cupped lush petals
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * Math.PI * 2;
    const mid = outerPetal.clone();
    mid.scale(0.88, 0.92, 0.90);
    push(mid, 0.018, a, 0.64, Math.sin(a) * 0.024, Math.cos(a) * 0.024);
  }
  // Inner 6 upright bud-forming petals
  for (let i = 0; i < 6; i++) {
    const a = ((i + 0.25) / 6) * Math.PI * 2;
    const inner = outerPetal.clone();
    inner.scale(0.72, 0.80, 0.78);
    push(inner, 0.024, a, 0.30, Math.sin(a) * 0.015, Math.cos(a) * 0.015);
  }
  outerPetal.dispose();
  const petalGeo = mergeGeometries(parts, false)!;
  parts.forEach((p) => p.dispose());

  // Sculpted inverted-cone seed-pod receptacle + delicate stamen ring
  const podParts: THREE.BufferGeometry[] = [];
  const podCore = new THREE.CylinderGeometry(0.030, 0.014, 0.034, 12).toNonIndexed();
  podCore.translate(0, 0.032, 0);
  podParts.push(podCore);
  for (let s = 0; s < 12; s++) {
    const sa = (s / 12) * Math.PI * 2;
    const st = new THREE.CylinderGeometry(0.0022, 0.0018, 0.026, 4).toNonIndexed();
    st.rotateX(0.32);
    st.rotateY(sa);
    st.translate(Math.sin(sa) * 0.030, 0.036, Math.cos(sa) * 0.030);
    podParts.push(st);
  }
  const podGeo = mergeGeometries(podParts, false)!;
  podParts.forEach((p) => p.dispose());

  // Notched veined lily pad with planar radial UVs & slightly upturned rim
  const segs = 22;
  const notchGap = 0.28;
  const padPos: number[] = [];
  const padUv: number[] = [];
  const padIdx: number[] = [];
  padPos.push(0, 0.002, 0);
  padUv.push(0.5, 0.5);
  for (let ring = 1; ring <= 2; ring++) {
    const r = ring === 1 ? 0.115 : 0.175;
    const y = ring === 1 ? 0.001 : 0.007;
    for (let i = 0; i <= segs; i++) {
      const a = notchGap * 0.5 + (i / segs) * (Math.PI * 2 - notchGap);
      const wave = ring === 2 ? Math.sin(a * 5) * 0.004 : 0;
      const x = Math.cos(a) * (r + wave);
      const z = Math.sin(a) * (r + wave);
      padPos.push(x, y, z);
      padUv.push(0.5 + (x / 0.36), 0.5 + (z / 0.36));
    }
  }
  const r1Start = 1;
  const r2Start = 1 + (segs + 1);
  for (let i = 0; i < segs; i++) {
    padIdx.push(0, r1Start + i, r1Start + i + 1);
    padIdx.push(r1Start + i, r2Start + i, r2Start + i + 1);
    padIdx.push(r1Start + i, r2Start + i + 1, r1Start + i + 1);
  }
  const padGeo = new THREE.BufferGeometry();
  padGeo.setAttribute('position', new THREE.Float32BufferAttribute(padPos, 3));
  padGeo.setAttribute('uv', new THREE.Float32BufferAttribute(padUv, 2));
  padGeo.setIndex(padIdx);
  padGeo.computeVertexNormals();

  return { petalGeo, podGeo, padGeo };
}

function hashFloat2(x: number, y: number, seed = 41): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  return n - Math.floor(n);
}

/**
 * Pure DataTexture seamless cast-bronze normal & roughness maps (works cleanly in Node tests
 * without DOM canvas while eliminating any tiled checkerboard artifacts on bronze surfaces).
 */
function createSeamlessCastBronzeMicroTextures(size = 128): {
  normalMap: THREE.DataTexture;
  roughnessMap: THREE.DataTexture;
} {
  const normData = new Uint8Array(size * size * 4);
  const roughData = new Uint8Array(size * size * 4);
  const heights = new Float32Array(size * size);

  for (let y = 0; y < size; y++) {
    const ny = (y / size) * Math.PI * 2;
    for (let x = 0; x < size; x++) {
      const nx = (x / size) * Math.PI * 2;
      const sx = x % size;
      const sy = y % size;
      // Smooth periodic hammered cast-bronze micro-relief + fine grain
      const ripple =
        Math.sin(nx * 2.0 + Math.cos(ny * 3.0) * 0.45) * 0.35 +
        Math.cos(ny * 2.0 - Math.sin(nx * 3.0) * 0.45) * 0.35 +
        Math.sin(nx * 5.0 + ny * 4.0) * 0.14;
      const grain = (hashFloat2(sx, sy, 19) - 0.5) * 0.16;
      const h = ripple * 0.5 + grain;
      heights[y * size + x] = h;

      const rVal = Math.round(THREE.MathUtils.clamp(216 + ripple * 18 + grain * 42, 165, 250));
      const idx = (y * size + x) * 4;
      roughData[idx] = rVal;
      roughData[idx + 1] = rVal;
      roughData[idx + 2] = rVal;
      roughData[idx + 3] = 255;
    }
  }

  for (let y = 0; y < size; y++) {
    const ym = (y - 1 + size) % size;
    const yp = (y + 1) % size;
    for (let x = 0; x < size; x++) {
      const xm = (x - 1 + size) % size;
      const xp = (x + 1) % size;
      const dx = (heights[y * size + xp] - heights[y * size + xm]) * 0.85;
      const dy = (heights[yp * size + x] - heights[ym * size + x]) * 0.85;
      const invLen = 1.0 / Math.hypot(dx, dy, 1.0);
      const nx = (-dx * invLen * 0.5 + 0.5) * 255;
      const ny = (-dy * invLen * 0.5 + 0.5) * 255;
      const nz = (invLen * 0.5 + 0.5) * 255;
      const idx = (y * size + x) * 4;
      normData[idx] = Math.round(nx);
      normData[idx + 1] = Math.round(ny);
      normData[idx + 2] = Math.round(nz);
      normData[idx + 3] = 255;
    }
  }

  const normalMap = new THREE.DataTexture(normData, size, size, THREE.RGBAFormat);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(4, 4);
  normalMap.colorSpace = THREE.NoColorSpace;
  normalMap.needsUpdate = true;

  const roughnessMap = new THREE.DataTexture(roughData, size, size, THREE.RGBAFormat);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(4, 4);
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.needsUpdate = true;

  return { normalMap, roughnessMap };
}

/**
 * Builds the realistic Prince Siddhartha head matching the serene Lumbini sculpture:
 * full youthful oval face (C-infinity smooth shading + cavity patina), half-open calm gaze,
 * graceful arched brows, rounded nose & compassionate smile, crisp M-curve lotus hairline fillet,
 * 420+ dense textured bronze curls with rounded topknot Ushnisha bun, and sculpted child ears.
 */
function buildNobleBabySiddharthaHead(
  skinMat: THREE.Material,
  hairMat: THREE.Material,
  ornamentMat: THREE.Material,
): THREE.Group {
  const headGroup = new THREE.Group();
  headGroup.name = 'BabyBuddhaHead';

  const headGeo = createContinuousBuddhaHeadGeo('baby');
  const cranium = new THREE.Mesh(headGeo, skinMat);
  cranium.castShadow = true;
  cranium.receiveShadow = true;
  headGroup.add(cranium);

  // Cohesive sculpted dark-patina hair dome hugging M-arch forehead hairline
  const hairCapGeo = new THREE.SphereGeometry(0.209, 36, 28);
  setGeometryCavityColor(
    hairCapGeo,
    (i, pos) => THREE.MathUtils.clamp(0.72 - pos.getY(i) * 1.4, 0.35, 0.85),
    HAIR_PATINA_C,
    BRONZE_MID_C,
    HAIR_CREST_C,
  );
  const hairCap = new THREE.Mesh(hairCapGeo, hairMat);
  hairCap.scale.set(0.98, 0.90, 1.03);
  hairCap.position.set(0, 0.184, -0.022);
  headGroup.add(hairCap);

  // Compact rounded coiled topknot Ushnisha bun nestled naturally on crown (zero tall spire)
  const ushnishaGeo = new THREE.SphereGeometry(0.088, 26, 20);
  setGeometryCavityColor(
    ushnishaGeo,
    (i, pos) => THREE.MathUtils.clamp(0.65 - pos.getY(i) * 2.0, 0.25, 0.78),
    HAIR_PATINA_C,
    BRONZE_MID_C,
    HAIR_CREST_C,
  );
  const ushnisha = new THREE.Mesh(ushnishaGeo, hairMat);
  ushnisha.position.set(0, 0.388, -0.016);
  ushnisha.scale.set(1.06, 0.68, 1.02);
  ushnisha.castShadow = true;
  headGroup.add(ushnisha);

  // Crisp carved M-arch forehead hairline fillet separating brow gold from textured hair
  const filletPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 32; i++) {
    const t = i / 32;
    const ang = THREE.MathUtils.lerp(-Math.PI * 0.56, Math.PI * 0.56, t);
    const sinA = Math.sin(ang);
    const cosA = Math.cos(ang);
    const xAbs = Math.abs(sinA);
    const yV =
      0.750 - 0.014 * Math.exp(-Math.pow(xAbs / 0.10, 2)) - 0.068 * Math.pow(xAbs, 2.2);
    const fy = -0.17 + yV * 0.55;
    const hv = (yV - 0.14) / 0.86;
    const crownFull = Math.sqrt(Math.max(0.0, 1.0 - Math.pow((hv - 0.56) / 0.44, 2.0)));
    const midW = 0.99 + 0.058 * Math.exp(-Math.pow((hv - 0.36) / 0.24, 2));
    const rrX = 0.210 * crownFull * midW + 0.002;
    const rrZ = 0.212 * crownFull * midW + 0.002;
    filletPts.push(new THREE.Vector3(sinA * rrX, fy, cosA * rrZ));
  }
  const filletGeo = createTaperedLimbGeometry(
    new THREE.CatmullRomCurve3(filletPts),
    () => 0.0062,
    40,
    7,
  );
  setGeometryUniformColor(filletGeo, 0x6a4410);
  headGroup.add(new THREE.Mesh(filletGeo, hairMat));

  // Dense 11-tier overlapping spiral whorl curls covering 100% of scalp & topknot bun
  const curlPlacements: Array<[number, number, number, number]> = [];
  const rows: Array<[number, number, number, number, number]> = [
    [48, 0.207, 0.132, 0.0155, 0.10],
    [46, 0.210, 0.164, 0.0160, 0.36],
    [44, 0.208, 0.196, 0.0160, 0.62],
    [42, 0.200, 0.228, 0.0160, 0.84],
    [38, 0.186, 0.262, 0.0158, 0.96],
    [32, 0.164, 0.296, 0.0154, 1.0],
    [26, 0.134, 0.330, 0.0148, 1.0],
    [20, 0.100, 0.360, 0.0142, 1.0],
    [18, 0.088, 0.384, 0.0138, 1.0],
    [14, 0.072, 0.408, 0.0132, 1.0],
    [10, 0.044, 0.428, 0.0124, 1.0],
  ];
  rows.forEach(([count, rr, ry, cs, frontCutoff], rIdx) => {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + rIdx * 0.21;
      const cosA = Math.cos(a);
      if (cosA > frontCutoff) continue;
      curlPlacements.push([
        Math.sin(a) * rr * 0.96,
        ry,
        cosA * rr * 1.01 - 0.020,
        cs,
      ]);
    }
  });
  // Crown apex center curl on topknot
  curlPlacements.push([0, 0.440, -0.016, 0.0122]);

  const spiralCurlGeo = createSpiralCurlGeo(0.022);
  const curlMesh = new THREE.InstancedMesh(spiralCurlGeo, hairMat, curlPlacements.length);
  curlMesh.castShadow = true;
  const upVec = new THREE.Vector3(0, 1, 0);
  const outVec = new THREE.Vector3();
  curlPlacements.forEach(([cx, cy, cz, cs], idx) => {
    _v3.set(cx, cy, cz);
    outVec.set(cx, Math.max(0.05, cy - 0.184), cz + 0.020).normalize();
    _q.setFromUnitVectors(upVec, outVec);
    _s.set(cs, cs * 0.85, cs);
    _m4.compose(_v3, _q, _s);
    curlMesh.setMatrixAt(idx, _m4);
  });
  curlMesh.instanceMatrix.needsUpdate = true;
  curlMesh.computeBoundingSphere();
  headGroup.add(curlMesh);

  // Delicate Urna bindi above nose bridge with subtle patina collar
  const urnaGeo = new THREE.SphereGeometry(0.0105, 12, 10);
  setGeometryUniformColor(urnaGeo, 0xf8d46e);
  const urna = new THREE.Mesh(urnaGeo, ornamentMat);
  urna.scale.set(1.0, 1.0, 0.50);
  urna.position.set(0, 0.132, 0.212);
  headGroup.add(urna);

  // Sculpted charming anatomical child-prince ears framing cheeks
  for (const side of [-1, 1] as const) {
    const ear = buildAnatomicalBronzeEar(skinMat, hairMat, side, false);
    ear.position.set(side * 0.205, 0.044, -0.010);
    ear.rotation.y = side * -0.20;
    headGroup.add(ear);
  }

  return headGroup;
}

/**
 * Computes exact sculpted Baby Buddha torso surface coordinates (x, z, bellyOut) at vertical
 * fraction v and angle theta so the unified Uttariya sash hugs the bronze skin seamlessly.
 */
function sampleBabyTorsoProfile(v: number): { rx: number; rz: number; swayX: number; spineZ: number } {
  let rx: number;
  let rz: number;
  if (v < 0.36) {
    const t = v / 0.36;
    rx = THREE.MathUtils.lerp(0.244, 0.256, Math.sin(t * Math.PI * 0.6));
    rz = THREE.MathUtils.lerp(0.192, 0.205, Math.sin(t * Math.PI * 0.6));
  } else if (v < 0.72) {
    const t = (v - 0.36) / 0.36;
    const s = t * t * (3 - 2 * t);
    rx = THREE.MathUtils.lerp(0.256, 0.278, s);
    rz = THREE.MathUtils.lerp(0.205, 0.214, s);
  } else if (v < 0.86) {
    const t = (v - 0.72) / 0.14;
    rx = THREE.MathUtils.lerp(0.278, 0.262, t * 0.55);
    rz = THREE.MathUtils.lerp(0.214, 0.172, t);
  } else {
    const t = (v - 0.86) / 0.14;
    rx = THREE.MathUtils.lerp(0.269, 0.128, Math.pow(t, 0.74));
    rz = THREE.MathUtils.lerp(0.172, 0.118, Math.pow(t, 0.74));
  }
  const swayX = -0.004 * (1 - v) - Math.sin(v * Math.PI) * 0.004;
  const spineZ = Math.sin(v * Math.PI) * 0.010;
  return { rx, rz, swayX, spineZ };
}

/**
 * Generates a natural child-prince upper torso (64x80) with cavity patina around clavicles,
 * soft child chest, gentle youth belly, carved umbilicus navel pit, and back spine dip.
 */
function createSculptedBabyBuddhaTorsoGeo(height = 0.94): THREE.BufferGeometry {
  const ySegs = 48;
  const radSegs = 64;
  const positions: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  for (let iy = 0; iy <= ySegs; iy++) {
    const v = iy / ySegs; // 0 = waist (1.16) .. 1 = neck base (2.10)
    const y = v * height;
    const { rx, rz, swayX, spineZ } = sampleBabyTorsoProfile(v);

    for (let ix = 0; ix <= radSegs; ix++) {
      const u = ix / radSegs;
      const theta = (u - 0.5) * Math.PI * 2;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);

      const x = swayX + sinT * rx;
      let z = spineZ + cosT * rz;
      let cavity = 0.08;

      const front = 0.5 + 0.5 * Math.tanh(cosT * 3.8);
      if (front > 0.01) {
        const xAbs = Math.abs(sinT);
        const chestSoft =
          Math.exp(-Math.pow((v - 0.66) / 0.12, 2)) * Math.exp(-Math.pow((xAbs - 0.36) / 0.30, 2));
        const clavY = 0.84 - 0.025 * xAbs;
        const clavSoft =
          Math.exp(-Math.pow((v - clavY) / 0.020, 2)) *
          Math.exp(-Math.pow((xAbs - 0.34) / 0.28, 2));
        const clavHollow =
          Math.exp(-Math.pow((v - (clavY + 0.024)) / 0.018, 2)) *
          Math.exp(-Math.pow((xAbs - 0.32) / 0.24, 2));
        const belly = Math.exp(-Math.pow((v - 0.26) / 0.18, 2));
        const navel =
          Math.exp(-Math.pow((v - 0.235) / 0.018, 2)) * Math.exp(-Math.pow(xAbs / 0.044, 2));
        const lowerBellyFold = Math.exp(-Math.pow((v - 0.03) / 0.025, 2));

        z += (chestSoft * 0.013 + clavSoft * 0.006 - clavHollow * 0.004 + belly * 0.026 - navel * 0.015) * front;
        cavity += (clavHollow * 0.28 + navel * 0.85 + lowerBellyFold * 0.45) * front;
        cavity -= (belly * 0.10 + chestSoft * 0.08) * front;
      }

      const back = 0.5 + 0.5 * Math.tanh(-cosT * 3.8);
      if (back > 0.01 && v > 0.10 && v < 0.88) {
        const xAbs = Math.abs(sinT);
        const spineDip = Math.exp(-Math.pow(xAbs / 0.13, 2)) * Math.sin(v * Math.PI);
        z += spineDip * 0.012 * back;
        cavity += spineDip * 0.36 * back;
      }

      positions.push(x, y, z);
      uvs.push(u, v);

      const cav = THREE.MathUtils.clamp(cavity, 0, 1);
      if (cav > 0.45) {
        _cTmp.lerpColors(BRONZE_MID_C, BRONZE_PATINA_C, (cav - 0.45) / 0.55);
      } else {
        _cTmp.lerpColors(BRONZE_BRIGHT_C, BRONZE_MID_C, cav / 0.45);
      }
      colors.push(_cTmp.r, _cTmp.g, _cTmp.b);
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
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates a single unified sculpted pleated Uttariya cloth ribbon (~0.105m wide) sweeping
 * diagonally from left shoulder (+X) down across chest/belly to right hip (-X) and around back,
 * plus the vertical chest shoulder-strap and sculpted butterfly tie-bow matching the reference photo.
 */
function buildPleatedUttariyaShawl(
  shawlMat: THREE.Material,
  detailMat: THREE.Material,
): THREE.Group {
  const g = new THREE.Group();

  const segAlong = 96;
  const segAcross = 16;
  const halfWidth = 0.054;
  const positions: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  for (let ia = 0; ia <= segAlong; ia++) {
    const t = ia / segAlong;
    // Complete continuous 360-degree wrap: -X hip -> front belly -> +X left shoulder -> back -> -X hip
    const theta = t * Math.PI * 2;
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);
    const frontWeight = 0.5 + 0.5 * Math.tanh(cosT * 3.8);
    const backWeight = 0.5 + 0.5 * Math.tanh(-cosT * 3.8);
    const centerY = 1.61 + 0.365 * Math.sin(theta - 0.22);

    for (let iw = 0; iw <= segAcross; iw++) {
      const wFrac = iw / segAcross; // 0..1 across cloth width
      const wSigned = wFrac * 2 - 1; // -1..+1
      const bandOffset = wSigned * halfWidth;

      const baseY = centerY + bandOffset * 0.72;
      const v = THREE.MathUtils.clamp((baseY - 1.16) / 0.94, 0.04, 0.93);
      const { rx, rz, swayX, spineZ } = sampleBabyTorsoProfile(v);

      const xAbs = Math.abs(sinT);
      const bellyOut = Math.exp(-Math.pow((v - 0.26) / 0.18, 2)) * 0.026 * frontWeight;
      const chestOut =
        Math.exp(-Math.pow((v - 0.66) / 0.12, 2)) *
        Math.exp(-Math.pow((xAbs - 0.36) / 0.30, 2)) *
        0.013 *
        frontWeight;
      const backDipOut =
        v > 0.10 && v < 0.88
          ? Math.exp(-Math.pow(xAbs / 0.13, 2)) * Math.sin(v * Math.PI) * 0.012 * backWeight
          : 0;

      // 4 crisp longitudinal fold ridges + bevelled edge curl hugging surface cleanly
      const edgeEnv = Math.sqrt(Math.max(0.0, 1.0 - Math.pow(wSigned, 4)));
      const pleatWave = Math.cos(wSigned * Math.PI * 3.5);
      const lift = (0.011 + 0.008 * (0.5 + 0.5 * pleatWave)) * edgeEnv;

      const x = swayX + sinT * (rx + lift);
      const z = spineZ + cosT * (rz + lift) + bellyOut + chestOut + backDipOut;

      positions.push(x, baseY, z);
      uvs.push(t, wFrac);

      const cav = (0.5 - 0.5 * pleatWave) * 0.62 + (1.0 - edgeEnv) * 0.42;
      if (cav > 0.45) {
        _cTmp.lerpColors(BRONZE_MID_C, BRONZE_PATINA_C, (cav - 0.45) / 0.55);
      } else {
        _cTmp.lerpColors(BRONZE_BRIGHT_C, BRONZE_MID_C, cav / 0.45);
      }
      colors.push(_cTmp.r, _cTmp.g, _cTmp.b);
    }
  }

  const stride = segAcross + 1;
  for (let ia = 0; ia < segAlong; ia++) {
    for (let iw = 0; iw < segAcross; iw++) {
      const a = ia * stride + iw;
      const b = a + 1;
      const c = (ia + 1) * stride + iw + 1;
      const d = (ia + 1) * stride + iw;
      indices.push(a, d, c, a, c, b);
    }
  }

  const ribbonGeo = new THREE.BufferGeometry();
  ribbonGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  ribbonGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  ribbonGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  ribbonGeo.setIndex(indices);
  ribbonGeo.computeVertexNormals();

  const ribbonMesh = new THREE.Mesh(ribbonGeo, shawlMat);
  ribbonMesh.castShadow = true;
  g.add(ribbonMesh);

  // Broad folded vertical silk strap dropping over left pectoral (+X) to tie-knot bow
  const strapPts = [
    new THREE.Vector3(0.162, 1.98, 0.142),
    new THREE.Vector3(0.154, 1.88, 0.200),
    new THREE.Vector3(0.148, 1.78, 0.226),
    new THREE.Vector3(0.142, 1.69, 0.234),
  ];
  const strapGeo = createTaperedLimbGeometry(
    new THREE.CatmullRomCurve3(strapPts),
    (t) => THREE.MathUtils.lerp(0.032, 0.025, t),
    18,
    10,
  );
  strapGeo.scale(1.0, 1.0, 1.0);
  setGeometryCavityColor(strapGeo, (i, pos) => (pos.getZ(i) < 0.205 ? 0.42 : 0.14));
  const strap = new THREE.Mesh(strapGeo, shawlMat);
  strap.castShadow = true;
  g.add(strap);

  // Sculpted 2-loop butterfly rosette bow + central knot + 2 hanging pleated tails
  const knotGeo = new THREE.SphereGeometry(0.016, 10, 8);
  setGeometryUniformColor(knotGeo, 0xf2c24c);
  const knotCenter = new THREE.Mesh(knotGeo, detailMat);
  knotCenter.position.set(0.142, 1.685, 0.238);
  for (const side of [-1, 1] as const) {
    const loopGeo = new THREE.TorusGeometry(0.021, 0.0072, 8, 18);
    setGeometryCavityColor(loopGeo, (i, pos) => (pos.getZ(i) < 0 ? 0.60 : 0.12));
    const loop = new THREE.Mesh(loopGeo, detailMat);
    loop.position.set(0.142 + side * 0.021, 1.690, 0.236);
    loop.rotation.set(0.18, 0.38, side * 0.46);
    const tailGeo = new THREE.CapsuleGeometry(0.0068, 0.036, 4, 8);
    setGeometryUniformColor(tailGeo, 0xe8b53c);
    const tail = new THREE.Mesh(tailGeo, detailMat);
    tail.position.set(0.142 + side * 0.013, 1.646, 0.240);
    tail.rotation.z = side * -0.24;
    g.add(loop, tail);
  }
  g.add(knotCenter);
  return g;
}

/**
 * Generates plump, broad, softly curved lotus petals with central spine ridge, rolled margin,
 * and dark bronze patina in petal valleys matching the real Lumbini pedestal.
 */
function createPlumpLotusPetalGeo(
  width = 0.42,
  height = 0.38,
  puff = 0.125,
): THREE.BufferGeometry {
  const uSegs = 16;
  const vSegs = 16;
  const positions: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  for (let iv = 0; iv <= vSegs; iv++) {
    const v = iv / vSegs; // 0 = base .. 1 = rounded tip
    const halfSpan = width * 0.5 * Math.pow(Math.sin(v * Math.PI * 0.92 + 0.14), 0.56);
    const y = v * height;
    const bellyZ = Math.sin(Math.pow(v, 0.72) * Math.PI) * puff;

    for (let iu = 0; iu <= uSegs; iu++) {
      const u = iu / uSegs;
      const s = u * 2 - 1;
      const absS = Math.abs(s);
      const x = s * halfSpan;
      const roundProfile = Math.sqrt(Math.max(0.0, 1.0 - s * s * 0.88));
      const spine = Math.exp(-Math.pow(absS / 0.16, 2)) * 0.014 * Math.sin(v * Math.PI);
      const marginLip =
        Math.exp(-Math.pow((absS - 0.84) / 0.10, 2)) * 0.015 * Math.sin(v * Math.PI);
      const marginGroove =
        Math.exp(-Math.pow((absS - 0.68) / 0.09, 2)) * 0.008 * Math.sin(v * Math.PI);
      const z = bellyZ * roundProfile + spine + marginLip - marginGroove;
      positions.push(x, y, z);
      uvs.push(u, v);

      const cav = THREE.MathUtils.clamp(
        0.10 + marginGroove * 52 + (1.0 - Math.sin(v * Math.PI)) * 0.35 + (absS > 0.90 ? 0.45 : 0),
        0,
        1,
      );
      if (cav > 0.45) {
        _cTmp.lerpColors(BRONZE_MID_C, BRONZE_PATINA_C, (cav - 0.45) / 0.55);
      } else {
        _cTmp.lerpColors(BRONZE_BRIGHT_C, BRONZE_MID_C, cav / 0.45);
      }
      colors.push(_cTmp.r, _cTmp.g, _cTmp.b);
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
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates contoured two-leg silk dhoti geometry (72x96) for the Baby Buddha:
 * reveals two sturdy rounded child thighs & calves separated by a central vertical valley,
 * sweeping diagonal U-drape folds with cavity patina, and flared wavy ruffled ankle hems.
 */
function createContouredBabyDhotiGeo(): THREE.BufferGeometry {
  const ySegs = 56;
  const radSegs = 72;
  const height = 0.99; // covers y = 0.18 .. 1.17 in figure space
  const positions: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  for (let iy = 0; iy <= ySegs; iy++) {
    const v = iy / ySegs; // 0 = ruffled ankle cuff .. 1 = waist
    const y = v * height;

    // Gentle flaring ruffled cuff at bottom -> contoured thighs -> waistband top
    const cuffFlare = v < 0.12 ? Math.pow((0.12 - v) / 0.12, 1.5) * 0.032 : 0;
    const baseRx = THREE.MathUtils.lerp(0.204, 0.252, Math.pow(v, 0.65)) + cuffFlare;
    const baseRz = THREE.MathUtils.lerp(0.156, 0.194, Math.pow(v, 0.65)) + cuffFlare * 0.8;
    const thighFull = Math.sin(Math.pow(v, 0.85) * Math.PI) * 0.022;

    for (let ix = 0; ix <= radSegs; ix++) {
      const u = ix / radSegs;
      const theta = (u - 0.5) * Math.PI * 2;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);
      const xAbs = Math.abs(sinT);

      // Two-leg sculptural contour: soft vertical cleft between legs + sturdy child thighs
      const frontBack = Math.abs(cosT);
      const legValley =
        Math.exp(-Math.pow(xAbs / 0.26, 2)) *
        Math.pow(frontBack, 1.6) *
        THREE.MathUtils.smoothstep(v, 0.06, 0.25) *
        (1.0 - THREE.MathUtils.smoothstep(v, 0.78, 0.98));
      const legCrown =
        Math.exp(-Math.pow((xAbs - 0.44) / 0.26, 2)) *
        frontBack *
        THREE.MathUtils.smoothstep(v, 0.10, 0.30);

      // Diagonal U-drape cloth folds cascading smoothly down each thigh toward center Patka
      const uFoldPhase = (v * 4.2 + xAbs * 1.15) * Math.PI * 2.0;
      const uFold =
        Math.sin(uFoldPhase) *
        0.0085 *
        THREE.MathUtils.smoothstep(v, 0.10, 0.26) *
        (1.0 - THREE.MathUtils.smoothstep(v, 0.82, 0.96)) *
        (0.45 + 0.55 * frontBack);

      // Vertical side pleats at +/-X hips
      const sidePleatEnv = Math.exp(-Math.pow((1.0 - xAbs) / 0.22, 2));
      const sidePleat = Math.cos(theta * 14.0) * 0.008 * sidePleatEnv;

      // Wavy sinusoidal ruffled lower ankle hem
      const hemRuffleEnv = Math.exp(-Math.pow(v / 0.09, 2));
      const hemRuffle = Math.cos(theta * 9.0) * 0.017 * hemRuffleEnv;
      const hemYWave = Math.cos(theta * 9.0) * 0.016 * hemRuffleEnv;

      const rBoost =
        thighFull +
        legCrown * 0.018 -
        legValley * 0.026 +
        uFold +
        sidePleat +
        hemRuffle;

      const x = sinT * (baseRx + rBoost * 0.78);
      const z = cosT * (baseRz + rBoost);

      positions.push(x, y + hemYWave, z);
      uvs.push(u, v);

      // Deep bronze patina in leg valley, U-fold valleys, side pleats & hem ruffle creases
      const cav = THREE.MathUtils.clamp(
        0.12 +
          legValley * 1.8 +
          Math.max(0, -Math.sin(uFoldPhase)) * 0.42 * (0.4 + 0.6 * frontBack) +
          Math.max(0, -Math.cos(theta * 14.0)) * 0.35 * sidePleatEnv +
          Math.max(0, -Math.cos(theta * 9.0)) * 0.55 * hemRuffleEnv,
        0,
        1,
      );
      if (cav > 0.45) {
        _cTmp.lerpColors(BRONZE_MID_C, BRONZE_PATINA_C, (cav - 0.45) / 0.55);
      } else {
        _cTmp.lerpColors(BRONZE_BRIGHT_C, BRONZE_MID_C, cav / 0.45);
      }
      colors.push(_cTmp.r, _cTmp.g, _cTmp.b);
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
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates the smooth, broad central Patka front drape panel with raised side hem borders
 * (matching image_1198606f.png — clean convex cloth flap, zero boxy flutes).
 */
function createVolumetricPleatedPatkaGeo(): THREE.BufferGeometry {
  const segX = 22;
  const segY = 32;
  const widthTop = 0.092;
  const widthBot = 0.128;
  const height = 0.96;
  const thickness = 0.018;
  const positions: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const emitSurface = (frontSign: 1 | -1) => {
    const baseOffset = positions.length / 3;
    for (let iy = 0; iy <= segY; iy++) {
      const v = iy / segY;
      const y = -v * height;
      const halfW = THREE.MathUtils.lerp(widthTop, widthBot, Math.pow(v, 0.85)) * 0.5;
      // Follows soft thigh fullness then curves cleanly back at ankles
      const drapeArchZ =
        Math.sin(v * Math.PI * 0.78) * 0.022 - Math.pow(Math.max(0, v - 0.75) / 0.25, 1.5) * 0.014;

      for (let ix = 0; ix <= segX; ix++) {
        const u = ix / segX;
        const s = u * 2 - 1;
        const absS = Math.abs(s);
        const x = s * halfW;

        // Smooth softly arched cloth face with crisp raised rolled borders on left/right edges
        const edgeRoll = Math.exp(-Math.pow((absS - 0.84) / 0.10, 2)) * 0.0085;
        const edgeGroove = Math.exp(-Math.pow((absS - 0.70) / 0.08, 2)) * 0.0035;
        const softCenterCrown = Math.cos(s * Math.PI * 0.5) * 0.009;
        const edgePinch = Math.sqrt(Math.max(0, 1.0 - Math.pow(s, 6)));
        const z =
          drapeArchZ +
          softCenterCrown +
          edgeRoll -
          edgeGroove +
          frontSign * thickness * 0.5 * edgePinch;

        positions.push(x, y, z);
        uvs.push(u, v);

        const cav = THREE.MathUtils.clamp(0.10 + edgeGroove * 95 + (absS > 0.92 ? 0.45 : 0), 0, 1);
        if (cav > 0.45) {
          _cTmp.lerpColors(BRONZE_MID_C, BRONZE_PATINA_C, (cav - 0.45) / 0.55);
        } else {
          _cTmp.lerpColors(BRONZE_BRIGHT_C, BRONZE_MID_C, cav / 0.45);
        }
        colors.push(_cTmp.r, _cTmp.g, _cTmp.b);
      }
    }
    const stride = segX + 1;
    for (let iy = 0; iy < segY; iy++) {
      for (let ix = 0; ix < segX; ix++) {
        const a = baseOffset + iy * stride + ix;
        const b = a + 1;
        const c = baseOffset + (iy + 1) * stride + ix + 1;
        const d = baseOffset + (iy + 1) * stride + ix;
        if (frontSign === 1) {
          indices.push(a, d, c, a, c, b);
        } else {
          indices.push(a, b, c, a, c, d);
        }
      }
    }
  };

  emitSurface(1);
  emitSurface(-1);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds sculpted cast-bronze hand with anatomical palm, patina inter-finger creases, and 5 articulated fingers.
 */
function buildSculptedPointingHand(
  skinMat: THREE.Material,
  direction: 'up' | 'down',
  side: -1 | 1,
): THREE.Group {
  const hand = new THREE.Group();
  const dir = direction === 'up' ? 1 : -1;

  const palmGeo = new THREE.SphereGeometry(0.052, 16, 14);
  setGeometryCavityColor(palmGeo, (i, pos) =>
    THREE.MathUtils.clamp(0.15 + Math.max(0, -pos.getZ(i)) * 8.0, 0.1, 0.55),
  );
  const palm = new THREE.Mesh(palmGeo, skinMat);
  palm.scale.set(0.88, 1.12, 0.44);
  palm.castShadow = true;
  hand.add(palm);

  const idxX = side === -1 ? 0.021 : -0.021;
  const indexCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(idxX, dir * 0.032, 0.004),
    new THREE.Vector3(idxX, dir * 0.095, 0.008),
    new THREE.Vector3(idxX * 0.92, dir * 0.162, 0.010),
  ]);
  const indexGeo = createTaperedLimbGeometry(indexCurve, (t) => 0.0125 * (1.0 - 0.34 * t), 14, 10);
  setGeometryCavityColor(indexGeo, (i, pos) =>
    THREE.MathUtils.clamp(0.32 - Math.abs(pos.getY(i)) * 1.4, 0.08, 0.42),
  );
  const indexFinger = new THREE.Mesh(indexGeo, skinMat);
  indexFinger.castShadow = true;
  hand.add(indexFinger);

  if (direction === 'up') {
    const offsets = [0.002, -0.017, -0.034];
    for (let i = 0; i < 3; i++) {
      const curlCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(offsets[i], 0.038, 0.004),
        new THREE.Vector3(offsets[i], 0.066, 0.025),
        new THREE.Vector3(offsets[i], 0.042, 0.038),
        new THREE.Vector3(offsets[i], 0.020, 0.024),
      ]);
      const fGeo = createTaperedLimbGeometry(
        curlCurve,
        (t) => (0.0110 - i * 0.001) * (1 - 0.25 * t),
        12,
        8,
      );
      setGeometryCavityColor(fGeo, (vi, pos) => (pos.getZ(vi) < 0.020 ? 0.55 : 0.15));
      hand.add(new THREE.Mesh(fGeo, skinMat));
    }
    const thumbCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.033, -0.008, 0.012),
      new THREE.Vector3(0.029, 0.024, 0.028),
      new THREE.Vector3(0.012, 0.044, 0.032),
    ]);
    const thumbGeo = createTaperedLimbGeometry(thumbCurve, (t) => 0.0122 * (1 - 0.28 * t), 10, 8);
    setGeometryUniformColor(thumbGeo, 0xf2c24c);
    hand.add(new THREE.Mesh(thumbGeo, skinMat));
  } else {
    const offsets = [0.000, 0.019, 0.036];
    const lens = [0.106, 0.096, 0.078];
    for (let i = 0; i < 3; i++) {
      const fCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(offsets[i], -0.034, 0.002),
        new THREE.Vector3(offsets[i], -0.034 - lens[i] * 0.55, 0.012),
        new THREE.Vector3(offsets[i], -0.034 - lens[i], 0.004),
      ]);
      const fGeo = createTaperedLimbGeometry(
        fCurve,
        (t) => (0.0108 - i * 0.001) * (1 - 0.30 * t),
        12,
        8,
      );
      setGeometryCavityColor(fGeo, (vi, pos) => (pos.getY(vi) > -0.05 ? 0.45 : 0.12));
      hand.add(new THREE.Mesh(fGeo, skinMat));
    }
    const thumbCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.033, 0.004, 0.012),
      new THREE.Vector3(-0.037, -0.030, 0.022),
      new THREE.Vector3(-0.027, -0.064, 0.018),
    ]);
    const thumbGeo = createTaperedLimbGeometry(thumbCurve, (t) => 0.0118 * (1 - 0.26 * t), 10, 8);
    setGeometryUniformColor(thumbGeo, 0xf2c24c);
    hand.add(new THREE.Mesh(thumbGeo, skinMat));
  }

  return hand;
}

/**
 * Builds sculpted bare foot with arched instep, 5 individually articulated plump toes
 * with inter-toe bronze patina, and smooth ankle/shin column atop the lotus seed-bed.
 */
function buildSculptedBareFoot(
  skinMat: THREE.Material,
  side: -1 | 1,
): THREE.Group {
  const foot = new THREE.Group();

  const heelGeo = new THREE.SphereGeometry(0.056, 12, 10);
  setGeometryCavityColor(heelGeo, (i, pos) => (pos.getY(i) < 0 ? 0.55 : 0.15));
  const heel = new THREE.Mesh(heelGeo, skinMat);
  heel.scale.set(0.88, 0.72, 1.05);
  heel.position.set(0, 0.040, -0.045);
  foot.add(heel);

  const instepCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.040, -0.045),
    new THREE.Vector3(0, 0.048, 0.036),
    new THREE.Vector3(0, 0.026, 0.122),
  ]);
  const instepGeo = createTaperedLimbGeometry(
    instepCurve,
    (t) => 0.056 + Math.sin(t * Math.PI) * 0.010,
    14,
    12,
  );
  setGeometryCavityColor(instepGeo, (i, pos) => (pos.getY(i) < 0.018 ? 0.58 : 0.10));
  const instep = new THREE.Mesh(instepGeo, skinMat);
  instep.scale.set(1.10, 0.58, 1.0);
  instep.castShadow = true;
  foot.add(instep);

  const rawX = [-0.036, -0.016, 0.003, 0.021, 0.038];
  const toeRad = [0.0150, 0.0122, 0.0110, 0.0098, 0.0086];
  const toeLen = [0.042, 0.040, 0.035, 0.030, 0.024];
  for (let i = 0; i < 5; i++) {
    const tx = side === -1 ? -rawX[i] : rawX[i];
    const tCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(tx, 0.016, 0.116),
      new THREE.Vector3(tx, 0.017, 0.116 + toeLen[i] * 0.55),
      new THREE.Vector3(tx, 0.013, 0.116 + toeLen[i]),
    ]);
    const toeGeo = createTaperedLimbGeometry(
      tCurve,
      (t) => toeRad[i] * (1 - 0.20 * t),
      8,
      8,
    );
    setGeometryCavityColor(toeGeo, (vi, pos) => (pos.getY(vi) < 0.012 || pos.getZ(vi) < 0.122 ? 0.62 : 0.08));
    foot.add(new THREE.Mesh(toeGeo, skinMat));
  }

  const calfCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.050, -0.038),
    new THREE.Vector3(0, 0.16, -0.036),
    new THREE.Vector3(0, 0.28, -0.030),
    new THREE.Vector3(0, 0.38, -0.026),
  ]);
  const calfGeo = createTaperedLimbGeometry(
    calfCurve,
    (t) => 0.054 + t * 0.030 + Math.sin(t * Math.PI * 0.85) * 0.010,
    14,
    14,
  );
  setGeometryCavityColor(calfGeo, (i, pos) => (pos.getY(i) < 0.08 ? 0.45 : 0.12));
  const calf = new THREE.Mesh(calfGeo, skinMat);
  calf.castShadow = true;
  foot.add(calf);
  return foot;
}

/**
 * 4. Monumental Golden Baby Buddha (Prince Siddhartha standing barefoot in dignified
 *    stance on a proportionate double-tier sculpted golden lotus pedestal inside a dark basalt
 *    lotus-petal water-mirror basin woven with Sayapatri marigold garlands, floating
 *    sacred lotuses, and a dense botanical circular shrub bed).
 */
export function createMonumentalBabyBuddhaMonument(
  mats: BuddhaMaterials,
  _hedgeMat: THREE.Material,
  extraTextures?: {
    shrubMap?: THREE.Texture;
    shrubNormal?: THREE.Texture;
    waterNormal?: THREE.Texture;
  },
): THREE.Group {
  const root = new THREE.Group();
  const craftMats = getLumbiniGardenCraftMaterials();
  const { normalMap: bronzeMicroNormal, roughnessMap: bronzeMicroRough } =
    createSeamlessCastBronzeMicroTextures(128);

  // Museum-grade antique gilded cast-bronze shaders with vertex cavity patina
  const statueGoldMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    normalMap: bronzeMicroNormal,
    normalScale: new THREE.Vector2(0.14, 0.14),
    roughnessMap: bronzeMicroRough,
    roughness: 0.31,
    metalness: 0.83,
    emissive: 0x221403,
    emissiveIntensity: 0.07,
  });

  const hairCurlsGoldMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    normalMap: bronzeMicroNormal,
    normalScale: new THREE.Vector2(0.18, 0.18),
    roughnessMap: bronzeMicroRough,
    roughness: 0.36,
    metalness: 0.82,
    emissive: 0x1c1002,
    emissiveIntensity: 0.06,
  });

  const ornamentGoldMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    normalMap: bronzeMicroNormal,
    normalScale: new THREE.Vector2(0.14, 0.14),
    roughnessMap: bronzeMicroRough,
    roughness: 0.30,
    metalness: 0.84,
    emissive: 0x201302,
    emissiveIntensity: 0.06,
  });

  const lotusGoldMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    normalMap: bronzeMicroNormal,
    normalScale: new THREE.Vector2(0.16, 0.16),
    roughnessMap: bronzeMicroRough,
    roughness: 0.32,
    metalness: 0.83,
    emissive: 0x1e1202,
    emissiveIntensity: 0.06,
  });

  const deepPoolWaterMat = new THREE.MeshPhysicalMaterial({
    color: 0x162b30,
    normalMap: extraTextures?.waterNormal ?? null,
    normalScale: new THREE.Vector2(0.18, 0.18),
    roughness: 0.08,
    metalness: 0.14,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    transparent: true,
    opacity: 0.92,
  });

  const botanicalLotusTex = createBotanicalLotusTextures();

  const marigoldPetalMat = new THREE.MeshStandardMaterial({
    color: 0xf77e14,
    roughness: 0.68,
    metalness: 0.02,
    emissive: 0x3b1200,
    emissiveIntensity: 0.08,
    side: THREE.DoubleSide,
  });

  const mangoLeafRopeMat = new THREE.MeshStandardMaterial({
    color: 0x264b1c,
    roughness: 0.84,
    metalness: 0.02,
  });

  const lotusPetalPinkMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: botanicalLotusTex.petalMap,
    roughness: 0.52,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });

  const lotusPadMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: botanicalLotusTex.padMap,
    roughness: 0.72,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });

  // =========================================================================
  // A. CARVED DARK BASALT WATER-MIRROR LOTUS BASIN & GRANITE COPING (r = 3.16m)
  // =========================================================================
  const basinProfilePts: THREE.Vector2[] = [
    new THREE.Vector2(3.22, 0.0),
    new THREE.Vector2(3.22, 0.12),
    new THREE.Vector2(3.12, 0.16),
    new THREE.Vector2(3.10, 0.34),
    new THREE.Vector2(3.16, 0.38),
    new THREE.Vector2(3.12, 0.43),
    new THREE.Vector2(2.88, 0.43),
    new THREE.Vector2(2.84, 0.33),
    new THREE.Vector2(0.76, 0.33),
    new THREE.Vector2(0.0, 0.33),
  ];
  const basinBody = new THREE.Mesh(new THREE.LatheGeometry(basinProfilePts, 48), craftMats.basaltMat);
  basinBody.castShadow = true;
  basinBody.receiveShadow = true;
  root.add(basinBody);

  const graniteCopingRim = new THREE.Mesh(new THREE.TorusGeometry(3.00, 0.068, 10, 48), craftMats.graniteMat);
  graniteCopingRim.rotation.x = Math.PI / 2;
  graniteCopingRim.position.y = 0.415;
  graniteCopingRim.receiveShadow = true;
  const bronzeRimBead = new THREE.Mesh(new THREE.TorusGeometry(2.87, 0.022, 8, 48), mats.bronzeMat);
  bronzeRimBead.rotation.x = Math.PI / 2;
  bronzeRimBead.position.y = 0.422;
  root.add(graniteCopingRim, bronzeRimBead);

  const basaltCuppedPetalGeo = createCarvedLotusPetalGeometry(0.24, 0.46, 0.048);
  const basaltPetals = new THREE.InstancedMesh(basaltCuppedPetalGeo, craftMats.basaltMat, 28);
  basaltPetals.castShadow = true;
  basaltPetals.receiveShadow = true;
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    _v3.set(Math.sin(a) * 2.98, 0.25, Math.cos(a) * 2.98);
    _q.setFromEuler(_e.set(0, a, 0));
    const tilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.78, 0, 0));
    _q.multiply(tilt);
    _s.set(1.06, 1.0, 1.0);
    _m4.compose(_v3, _q, _s);
    basaltPetals.setMatrixAt(i, _m4);
  }
  basaltPetals.instanceMatrix.needsUpdate = true;
  basaltPetals.computeBoundingSphere();
  root.add(basaltPetals);

  // Interactive Digital Butter Lamps (Ornate Newari Sukunda / Choemi) mounted around the basalt lotus basin rim
  const plinthParts: THREE.BufferGeometry[] = [];
  const pBase = new THREE.BoxGeometry(0.34, 0.09, 0.36).toNonIndexed();
  pBase.translate(0, -0.025, 0);
  const pCap = new THREE.BoxGeometry(0.28, 0.045, 0.30).toNonIndexed();
  pCap.translate(0, 0.042, 0);
  const pPad = new THREE.CylinderGeometry(0.115, 0.135, 0.022, 16).toNonIndexed();
  pPad.translate(0, 0.075, 0);
  plinthParts.push(pBase, pCap, pPad);
  const plinthGeo = mergeGeometries(plinthParts, false)!;
  plinthParts.forEach((p) => p.dispose());

  // Sculpted Newari brass butter lamp: stepped lotus foot + turned baluster + embossed lotus chalice + beaded lip
  const lampParts: THREE.BufferGeometry[] = [];
  const lampProfilePts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.068, 0.0),
    new THREE.Vector2(0.066, 0.010),
    new THREE.Vector2(0.056, 0.018),
    new THREE.Vector2(0.036, 0.028),
    new THREE.Vector2(0.018, 0.042),
    new THREE.Vector2(0.026, 0.058), // Baluster center knot
    new THREE.Vector2(0.016, 0.074),
    new THREE.Vector2(0.028, 0.092),
    new THREE.Vector2(0.062, 0.114),
    new THREE.Vector2(0.088, 0.136),
    new THREE.Vector2(0.096, 0.146), // Rolled rim bead
    new THREE.Vector2(0.084, 0.150),
    new THREE.Vector2(0.070, 0.132),
    new THREE.Vector2(0.0, 0.124),
  ];
  const lampLathe = setGeometryCavityColor(
    new THREE.LatheGeometry(lampProfilePts, 24).toNonIndexed(),
    (i, pos) => (pos.getY(i) < 0.045 || (pos.getY(i) > 0.085 && pos.getY(i) < 0.115) ? 0.56 : 0.14),
  );
  lampParts.push(lampLathe);
  // 12 embossed lotus petals encircling the chalice belly & foot
  const lampPetalGeo = createRoundedSpoonLotusPetalGeo(0.024, 0.042, 0.006);
  for (let lp = 0; lp < 12; lp++) {
    const la = (lp / 12) * Math.PI * 2;
    const petal = lampPetalGeo.clone().toNonIndexed();
    petal.rotateX(0.68);
    petal.rotateY(la);
    petal.translate(Math.sin(la) * 0.044, 0.096, Math.cos(la) * 0.044);
    setGeometryCavityColor(petal, () => 0.34);
    lampParts.push(petal);
  }
  lampPetalGeo.dispose();
  const lampBeadRing = setGeometryCavityColor(
    new THREE.TorusGeometry(0.088, 0.0065, 8, 28).toNonIndexed(),
    () => 0.18,
  );
  lampBeadRing.rotateX(Math.PI / 2);
  lampBeadRing.translate(0, 0.145, 0);
  lampParts.push(lampBeadRing);
  const butterLampBodyGeo = mergeGeometries(lampParts, false)!;
  lampParts.forEach((p) => p.dispose());

  // Concave molten golden ghee meniscus + braided twisted cotton wick with dark charred tip
  const gheePts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.022, -0.002),
    new THREE.Vector2(0.056, 0.001),
    new THREE.Vector2(0.072, 0.007),
    new THREE.Vector2(0.0, 0.007),
  ];
  const lampGheeGeo = new THREE.LatheGeometry(gheePts, 20);
  const lampWickGeo = new THREE.ConeGeometry(0.0055, 0.024, 8);
  const lampWickMat = new THREE.MeshStandardMaterial({
    color: 0x3b2a1c,
    roughness: 0.90,
    metalness: 0.02,
    emissive: 0x2e1204,
    emissiveIntensity: 0.32,
  });
  const lampGheeMat = new THREE.MeshPhysicalMaterial({
    color: 0xf4a828,
    roughness: 0.16,
    metalness: 0.04,
    clearcoat: 0.92,
    clearcoatRoughness: 0.12,
    emissive: 0x5c2d00,
    emissiveIntensity: 0.24,
  });
  const outerFlameGeo = new THREE.SphereGeometry(0.024, 12, 10);
  outerFlameGeo.scale(0.85, 1.95, 0.85);
  outerFlameGeo.translate(0, 0.036, 0);
  const innerFlameGeo = new THREE.SphereGeometry(0.013, 10, 8);
  innerFlameGeo.scale(0.8, 1.75, 0.8);
  innerFlameGeo.translate(0, 0.028, 0);
  const haloSphereGeo = new THREE.SphereGeometry(0.092, 12, 10);
  haloSphereGeo.translate(0, 0.036, 0);

  const outerFlameMat = new THREE.MeshBasicMaterial({
    color: 0xff941a,
    transparent: true,
    opacity: 0.92,
  });
  const innerFlameMat = new THREE.MeshBasicMaterial({
    color: 0xfff6cf,
  });

  const butterLamps: Array<{
    lampIndex: number;
    flameGroup: THREE.Group;
    haloMesh: THREE.Mesh;
    localPos: [number, number, number];
  }> = [];

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const rx = Math.sin(a) * 2.98;
    const rz = Math.cos(a) * 2.98;
    const p = new THREE.Mesh(plinthGeo, craftMats.graniteMat);
    p.position.set(rx, 0.44, rz);
    p.rotation.y = a;
    p.castShadow = true;

    const lampBody = new THREE.Mesh(butterLampBodyGeo, ornamentGoldMat);
    lampBody.position.set(rx, 0.525, rz);
    lampBody.castShadow = true;

    const ghee = new THREE.Mesh(lampGheeGeo, lampGheeMat);
    ghee.position.set(rx, 0.654, rz);

    const wick = new THREE.Mesh(lampWickGeo, lampWickMat);
    wick.position.set(rx, 0.668, rz);

    const flameGroup = new THREE.Group();
    flameGroup.name = `BabyBuddhaButterLampFlame_${i}`;
    flameGroup.position.set(rx, 0.674, rz);
    flameGroup.scale.setScalar(0);
    flameGroup.visible = false;
    flameGroup.userData.nonCollidable = true;

    const outerFl = new THREE.Mesh(outerFlameGeo, outerFlameMat);
    const innerFl = new THREE.Mesh(innerFlameGeo, innerFlameMat);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffb338,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const haloMesh = new THREE.Mesh(haloSphereGeo, haloMat);
    flameGroup.add(outerFl, innerFl, haloMesh);

    root.add(p, lampBody, ghee, wick, flameGroup);
    butterLamps.push({
      lampIndex: i,
      flameGroup,
      haloMesh,
      localPos: [rx, 0.674, rz],
    });
  }
  root.userData.butterLamps = butterLamps;

  const ritualLampLight = new THREE.PointLight(0xffac42, 0, 12.5, 1.35);
  ritualLampLight.position.set(0, 1.35, 2.95);
  root.add(ritualLampLight);
  root.userData.ritualLampLight = ritualLampLight;

  // 4 Sculpted Cast-Bronze Dhupa Incense Braziers seated around the golden lotus pedestal (r = 1.06m)
  const brPedPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.195, 0.0),
    new THREE.Vector2(0.188, 0.032),
    new THREE.Vector2(0.155, 0.048),
    new THREE.Vector2(0.145, 0.088),
    new THREE.Vector2(0.165, 0.108),
    new THREE.Vector2(0.0, 0.112),
  ];
  const brazierPedestalGeo = new THREE.LatheGeometry(brPedPts, 8);
  const brazierParts: THREE.BufferGeometry[] = [];
  const brazierBowlPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.105, 0.0),
    new THREE.Vector2(0.100, 0.018),
    new THREE.Vector2(0.054, 0.042),
    new THREE.Vector2(0.088, 0.068),
    new THREE.Vector2(0.158, 0.108),
    new THREE.Vector2(0.164, 0.132),
    new THREE.Vector2(0.146, 0.146),
    new THREE.Vector2(0.126, 0.142),
    new THREE.Vector2(0.115, 0.112),
    new THREE.Vector2(0.0, 0.104),
  ];
  brazierParts.push(new THREE.LatheGeometry(brazierBowlPts, 24).toNonIndexed());
  // Embossed bronze collar & twin temple ring handles
  const brCollar = new THREE.TorusGeometry(0.154, 0.0085, 8, 24).toNonIndexed();
  brCollar.rotateX(Math.PI / 2);
  brCollar.translate(0, 0.122, 0);
  brazierParts.push(brCollar);
  for (const hSide of [-1, 1]) {
    const hRing = new THREE.TorusGeometry(0.026, 0.006, 6, 14).toNonIndexed();
    hRing.rotateY(Math.PI / 2);
    hRing.translate(hSide * 0.164, 0.112, 0);
    brazierParts.push(hRing);
  }
  const brPetal = createRoundedSpoonLotusPetalGeo(0.036, 0.056, 0.009);
  for (let bp = 0; bp < 12; bp++) {
    const ba = (bp / 12) * Math.PI * 2;
    const petal = brPetal.clone().toNonIndexed();
    petal.rotateX(0.76);
    petal.rotateY(ba);
    petal.translate(Math.sin(ba) * 0.094, 0.072, Math.cos(ba) * 0.094);
    brazierParts.push(petal);
  }
  brPetal.dispose();
  const brazierBowlGeo = mergeGeometries(brazierParts, false)!;
  brazierParts.forEach((p) => p.dispose());

  // Sculpted mounded ash bed
  const ashPts = [
    new THREE.Vector2(0.0, 0.022),
    new THREE.Vector2(0.052, 0.015),
    new THREE.Vector2(0.116, 0.002),
    new THREE.Vector2(0.0, 0.0),
  ];
  const ashBedGeo = new THREE.LatheGeometry(ashPts, 18);
  const ashBedMat = new THREE.MeshStandardMaterial({
    color: 0x8d8880,
    roughness: 0.96,
    metalness: 0.02,
  });
  const incenseStickGeo = new THREE.CylinderGeometry(0.0032, 0.0044, 0.155, 6);
  const incenseStickMat = new THREE.MeshStandardMaterial({
    color: 0x62341c,
    roughness: 0.88,
  });
  const emberTipGeo = new THREE.ConeGeometry(0.0048, 0.012, 6);
  const emberTipMat = new THREE.MeshBasicMaterial({ color: 0xff7824 });
  const coalEmberMat = new THREE.MeshBasicMaterial({ color: 0xff5a12 });

  for (let b = 0; b < 4; b++) {
    const ba = Math.PI * 0.25 + b * Math.PI * 0.5;
    const bx = Math.sin(ba) * 1.06;
    const bz = Math.cos(ba) * 1.06;
    const brazier = new THREE.Group();
    brazier.name = `DhupaIncenseBrazier_${b}`;
    brazier.position.set(bx, 0.376, bz);
    brazier.rotation.y = ba;

    const ped = new THREE.Mesh(brazierPedestalGeo, craftMats.basaltMat);
    ped.castShadow = true;
    const bowl = new THREE.Mesh(brazierBowlGeo, mats.bronzeMat);
    bowl.position.y = 0.102;
    bowl.castShadow = true;
    const ash = new THREE.Mesh(ashBedGeo, ashBedMat);
    ash.position.y = 0.214;
    brazier.add(ped, bowl, ash);

    for (let e = 0; e < 4; e++) {
      const ea = e * 1.57 + 0.4;
      const coal = new THREE.Mesh(emberTipGeo, coalEmberMat);
      coal.position.set(Math.sin(ea) * 0.045, 0.225, Math.cos(ea) * 0.045);
      coal.scale.setScalar(0.8);
      brazier.add(coal);
    }

    for (let s = 0; s < 3; s++) {
      const sa = (s - 1) * 1.85;
      const stickHolder = new THREE.Group();
      stickHolder.position.set(Math.sin(sa) * 0.022, 0.228, Math.cos(sa) * 0.022);
      stickHolder.rotation.set(Math.cos(sa) * 0.20, 0, -Math.sin(sa) * 0.20);
      const stick = new THREE.Mesh(incenseStickGeo, incenseStickMat);
      stick.position.y = 0.072;
      const tip = new THREE.Mesh(emberTipGeo, emberTipMat);
      tip.position.y = 0.154;
      stickHolder.add(stick, tip);
      brazier.add(stickHolder);
    }

    root.add(brazier);
  }

  const poolDisc = new THREE.Mesh(new THREE.CircleGeometry(2.84, 48), deepPoolWaterMat);
  poolDisc.rotation.x = -Math.PI / 2;
  poolDisc.position.y = 0.382;
  poolDisc.receiveShadow = true;
  poolDisc.userData.nonCollidable = true;
  root.add(poolDisc);

  for (const rRing of [1.18, 1.98]) {
    const rip = new THREE.Mesh(new THREE.TorusGeometry(rRing, 0.012, 6, 48), mats.bronzeMat);
    rip.rotation.x = Math.PI / 2;
    rip.position.y = 0.388;
    rip.userData.nonCollidable = true;
    root.add(rip);
  }

  // =========================================================================
  // B. WOVEN SAYAPATRI MARIGOLD GARLANDS & FLOATING SACRED LOTUS BLOOMS
  // =========================================================================
  for (const gRad of [2.74, 0.92]) {
    const vine = new THREE.Mesh(new THREE.TorusGeometry(gRad, 0.011, 6, 48), mangoLeafRopeMat);
    vine.rotation.x = Math.PI / 2;
    vine.position.y = 0.412;
    vine.userData.nonCollidable = true;
    root.add(vine);
  }
  const festoonCoords: Array<[number, number, number]> = [];
  for (let f = 0; f < 8; f++) {
    const a0 = (f / 8) * Math.PI * 2;
    const a1 = ((f + 1) / 8) * Math.PI * 2;
    const pts: THREE.Vector3[] = [];
    for (let s = 0; s <= 12; s++) {
      const t = s / 12;
      const a = a0 + (a1 - a0) * t;
      const r = 2.74 - Math.sin(t * Math.PI) * 0.42;
      const pos = new THREE.Vector3(Math.sin(a) * r, 0.402, Math.cos(a) * r);
      pts.push(pos);
      if (s > 0 && s < 12) {
        festoonCoords.push([pos.x, 0.398, pos.z]);
      }
    }
    const festoonVine = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.0085, 5, false),
      mangoLeafRopeMat,
    );
    festoonVine.userData.nonCollidable = true;
    root.add(festoonVine);
  }

  const flowerCoords: Array<[number, number, number, number]> = [];
  for (const [ringR, stepCount] of [
    [2.74, 156],
    [0.92, 54],
  ] as Array<[number, number]>) {
    for (let i = 0; i < stepCount; i++) {
      const a = (i / stepCount) * Math.PI * 2;
      flowerCoords.push([Math.sin(a) * ringR, 0.414, Math.cos(a) * ringR, 0.96 + (i % 3) * 0.12]);
    }
  }
  festoonCoords.forEach(([fx, fy, fz], idx) => {
    flowerCoords.push([fx, fy + 0.006, fz, 0.95 + (idx % 2) * 0.14]);
  });

  const { petalGeo: mgPetalGeo, calyxGeo: mgCalyxGeo } = createSculptedMarigoldFlowerGeo();
  const marigoldBlossomInst = new THREE.InstancedMesh(mgPetalGeo, marigoldPetalMat, flowerCoords.length);
  const marigoldCalyxInst = new THREE.InstancedMesh(mgCalyxGeo, mangoLeafRopeMat, flowerCoords.length);
  marigoldBlossomInst.userData.nonCollidable = true;
  marigoldCalyxInst.userData.nonCollidable = true;

  flowerCoords.forEach(([bx, by, bz, bs], idx) => {
    _v3.set(bx, by, bz);
    _q.setFromEuler(_e.set(0.14 * Math.sin(idx * 1.7), idx * 1.17, 0.14 * Math.cos(idx * 1.3)));
    _s.setScalar(bs);
    _m4.compose(_v3, _q, _s);
    marigoldBlossomInst.setMatrixAt(idx, _m4);
    marigoldCalyxInst.setMatrixAt(idx, _m4);
    const tone = idx % 4;
    _cTmp.setHex(
      tone === 0 ? 0xffb824 : tone === 1 ? 0xf78618 : tone === 2 ? 0xe85a0c : 0xffcc36,
    );
    marigoldBlossomInst.setColorAt(idx, _cTmp);
  });
  marigoldBlossomInst.instanceMatrix.needsUpdate = true;
  if (marigoldBlossomInst.instanceColor) marigoldBlossomInst.instanceColor.needsUpdate = true;
  marigoldCalyxInst.instanceMatrix.needsUpdate = true;
  marigoldBlossomInst.computeBoundingSphere();
  marigoldCalyxInst.computeBoundingSphere();
  root.add(marigoldBlossomInst, marigoldCalyxInst);

  const { petalGeo: lotPetalGeo, podGeo: lotPodGeo, padGeo } = createSculptedCuppedLotusFlowerGeo();
  setGeometryUniformColor(lotPodGeo, 0xe8b63c);
  const floatLotusCoords: Array<[number, number, number]> = [];
  for (let i = 0; i < 16; i++) {
    const a = ((i + 0.35) / 16) * Math.PI * 2;
    const rad = i % 2 === 0 ? 1.56 : 1.98;
    floatLotusCoords.push([Math.sin(a) * rad, Math.cos(a) * rad, 0.90 + (i % 3) * 0.14]);
  }
  const padInst = new THREE.InstancedMesh(padGeo, lotusPadMat, floatLotusCoords.length);
  const lotBloomInst = new THREE.InstancedMesh(lotPetalGeo, lotusPetalPinkMat, floatLotusCoords.length);
  const lotPodInst = new THREE.InstancedMesh(lotPodGeo, ornamentGoldMat, floatLotusCoords.length);
  for (const inst of [padInst, lotBloomInst, lotPodInst]) inst.userData.nonCollidable = true;
  floatLotusCoords.forEach(([lx, lz, ls], idx) => {
    _v3.set(lx, 0.386, lz);
    _q.setFromEuler(_e.set(0, idx * 1.37, 0));
    _s.setScalar(ls);
    _m4.compose(_v3, _q, _s);
    padInst.setMatrixAt(idx, _m4);
    lotBloomInst.setMatrixAt(idx, _m4);
    lotPodInst.setMatrixAt(idx, _m4);
    _cTmp.setHex(idx % 3 === 0 ? 0xfff4f7 : 0xfad2df);
    lotBloomInst.setColorAt(idx, _cTmp);
  });
  for (const inst of [padInst, lotBloomInst, lotPodInst]) {
    inst.instanceMatrix.needsUpdate = true;
    inst.computeBoundingSphere();
  }
  if (lotBloomInst.instanceColor) lotBloomInst.instanceColor.needsUpdate = true;
  root.add(padInst, lotBloomInst, lotPodInst);

  // =========================================================================
  // C. REALISTIC BOTANICAL CIRCULAR SHRUB BORDER & PLANTER CURB (r = 3.18..3.60)
  // =========================================================================
  const outerPlanterCurb = new THREE.Mesh(
    new THREE.TorusGeometry(3.54, 0.075, 8, 48),
    craftMats.graniteMat,
  );
  outerPlanterCurb.rotation.x = Math.PI / 2;
  outerPlanterCurb.position.y = 0.075;
  outerPlanterCurb.receiveShadow = true;

  const loamSoilMat = new THREE.MeshStandardMaterial({ color: 0x39281b, roughness: 0.96 });
  const soilRing = new THREE.Mesh(new THREE.RingGeometry(3.16, 3.52, 48), loamSoilMat);
  soilRing.rotation.x = -Math.PI / 2;
  soilRing.position.y = 0.105;
  soilRing.receiveShadow = true;
  soilRing.userData.nonCollidable = true;
  root.add(outerPlanterCurb, soilRing);

  const sprigGeo = createCrossedShrubSprigGeo(0.52, 0.46);
  const leafMat = getLumbiniBotanicalLeafMaterial(extraTextures?.shrubMap, extraTextures?.shrubNormal);
  const shrubRingCount = 220;
  const ringFoliageInst = new THREE.InstancedMesh(sprigGeo, leafMat, shrubRingCount);
  ringFoliageInst.castShadow = true;
  ringFoliageInst.receiveShadow = true;
  ringFoliageInst.userData.nonCollidable = true;

  for (let i = 0; i < shrubRingCount; i++) {
    const a = (i / shrubRingCount) * Math.PI * 2;
    const radialJitter = Math.sin(i * 19.7) * 0.5 * 0.14;
    const rr = 3.33 + radialJitter;
    const sScale = 0.78 + ((i * 37) % 10) * 0.036;
    _v3.set(Math.sin(a) * rr, 0.105 + (i % 2) * 0.035, Math.cos(a) * rr);
    _q.setFromEuler(_e.set(Math.cos(a) * 0.18, a + (i % 5) * 0.6, -Math.sin(a) * 0.18));
    _s.setScalar(sScale);
    _m4.compose(_v3, _q, _s);
    ringFoliageInst.setMatrixAt(i, _m4);
    const tShade = ((i * 29) % 11) / 10;
    _cTmp.setHSL(0.24 + tShade * 0.055, 0.44 + tShade * 0.14, 0.50 + tShade * 0.22);
    ringFoliageInst.setColorAt(i, _cTmp);
  }
  ringFoliageInst.instanceMatrix.needsUpdate = true;
  if (ringFoliageInst.instanceColor) ringFoliageInst.instanceColor.needsUpdate = true;
  ringFoliageInst.computeBoundingSphere();
  root.add(ringFoliageInst);

  // =========================================================================
  // D. PROPORTIONATE DOUBLE-TIER GOLDEN LOTUS PEDESTAL (r = 0.45..0.72, y: 0.38 -> 1.50)
  // =========================================================================
  const lotusCorePts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.74, 0.0),
    new THREE.Vector2(0.68, 0.09),
    new THREE.Vector2(0.58, 0.26),
    new THREE.Vector2(0.49, 0.46),
    new THREE.Vector2(0.50, 0.56),
    new THREE.Vector2(0.58, 0.76),
    new THREE.Vector2(0.52, 0.92),
    new THREE.Vector2(0.47, 0.98),
    new THREE.Vector2(0.46, 1.07),
    new THREE.Vector2(0.48, 1.11),
    new THREE.Vector2(0.0, 1.11),
  ];
  const lotusCoreGeo = new THREE.LatheGeometry(lotusCorePts, 40);
  setGeometryCavityColor(lotusCoreGeo, (i, pos) => {
    const py = pos.getY(i);
    if (py > 0.43 && py < 0.54) return 0.72; // waist patina
    if (py > 0.94 && py < 1.06) return 0.62; // stamen collar groove
    return 0.26;
  });
  const lotusCore = new THREE.Mesh(lotusCoreGeo, lotusGoldMat);
  lotusCore.position.y = 0.38;
  lotusCore.castShadow = true;
  lotusCore.receiveShadow = true;
  root.add(lotusCore);

  // Pearl mala waist ring (36 beads)
  const pearlGeo = new THREE.SphereGeometry(0.022, 8, 6);
  setGeometryUniformColor(pearlGeo, 0xf2c24c);
  const waistPearls = new THREE.InstancedMesh(pearlGeo, ornamentGoldMat, 36);
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    _v3.set(Math.sin(a) * 0.505, 0.87, Math.cos(a) * 0.505);
    _q.identity();
    _s.set(1.0, 0.85, 1.0);
    _m4.compose(_v3, _q, _s);
    waistPearls.setMatrixAt(i, _m4);
  }
  waistPearls.instanceMatrix.needsUpdate = true;
  root.add(waistPearls);

  // Plump bulbous double-tier sculpted petals (12 lower + 12 upper staggered)
  const plumpPetalGeo = createPlumpLotusPetalGeo(0.39, 0.38, 0.115);
  const goldPetals = new THREE.InstancedMesh(plumpPetalGeo, lotusGoldMat, 24);
  goldPetals.castShadow = true;
  let gpIdx = 0;
  for (let tier = 0; tier < 2; tier++) {
    const count = 12;
    const rad = tier === 0 ? 0.57 : 0.51;
    const py = tier === 0 ? 0.45 : 0.89;
    const tilt = tier === 0 ? 0.46 : -0.14;
    for (let i = 0; i < count; i++) {
      const a = ((i + tier * 0.5) / count) * Math.PI * 2;
      _v3.set(Math.sin(a) * rad, py, Math.cos(a) * rad);
      _q.setFromEuler(_e.set(0, a, 0));
      const tq = new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt, 0, 0));
      _q.multiply(tq);
      _s.set(1.04, 1.0, 1.05);
      _m4.compose(_v3, _q, _s);
      goldPetals.setMatrixAt(gpIdx++, _m4);
    }
  }
  goldPetals.instanceMatrix.needsUpdate = true;
  goldPetals.computeBoundingSphere();
  root.add(goldPetals);

  // Vertical reeded stamen drum collar & stepped lotus seed-bed rim (matching reference photo)
  const collarRibGeo = new THREE.CapsuleGeometry(0.013, 0.080, 4, 6);
  setGeometryCavityColor(collarRibGeo, (i, pos) => (pos.getZ(i) < 0 ? 0.65 : 0.15));
  const collarRibs = new THREE.InstancedMesh(collarRibGeo, ornamentGoldMat, 44);
  for (let i = 0; i < 44; i++) {
    const a = (i / 44) * Math.PI * 2;
    _v3.set(Math.sin(a) * 0.482, 1.385, Math.cos(a) * 0.482);
    _q.setFromEuler(_e.set(0, a, 0));
    _s.setScalar(1);
    _m4.compose(_v3, _q, _s);
    collarRibs.setMatrixAt(i, _m4);
  }
  collarRibs.instanceMatrix.needsUpdate = true;
  root.add(collarRibs);

  const topSeatRimGeo = new THREE.TorusGeometry(0.488, 0.026, 10, 40);
  setGeometryCavityColor(topSeatRimGeo, (i, pos) => (pos.getZ(i) < 0 ? 0.55 : 0.12));
  const topSeatRim = new THREE.Mesh(topSeatRimGeo, lotusGoldMat);
  topSeatRim.rotation.x = Math.PI / 2;
  topSeatRim.position.y = 1.455;

  const seedBedStepGeo = new THREE.CylinderGeometry(0.43, 0.47, 0.052, 40);
  setGeometryCavityColor(seedBedStepGeo, (i, pos) => (pos.getY(i) < 0 ? 0.55 : 0.15));
  const seedBedStep = new THREE.Mesh(seedBedStepGeo, lotusGoldMat);
  seedBedStep.position.y = 1.482;
  seedBedStep.receiveShadow = true;
  root.add(topSeatRim, seedBedStep);

  // =========================================================================
  // E. REALISTIC LUMBINI GOLDEN PRINCE SIDDHARTHA (y: 1.51 -> ~4.25m, ~1:4.3 ratio)
  // =========================================================================
  const fig = new THREE.Group();
  fig.name = 'BabyBuddhaFigure';
  fig.position.y = 1.51;

  // 1. Visible Bare Feet standing flat & proud on top of the lotus seed-bed (10 articulated toes)
  const rightFoot = buildSculptedBareFoot(statueGoldMat, -1);
  rightFoot.position.set(-0.126, 0.0, 0.028);
  rightFoot.rotation.y = -0.05;
  const leftFoot = buildSculptedBareFoot(statueGoldMat, 1);
  leftFoot.position.set(0.126, 0.0, 0.010);
  leftFoot.rotation.y = 0.05;
  fig.add(rightFoot, leftFoot);

  // 2. Contoured Two-Leg Wrapped Dhoti with U-folds, wavy ruffled ankle cuffs & smooth Patka
  const dhoti = new THREE.Mesh(createContouredBabyDhotiGeo(), statueGoldMat);
  dhoti.position.set(0, 0.18, 0);
  dhoti.castShadow = true;
  dhoti.receiveShadow = true;
  fig.add(dhoti);

  // Flared wavy ruffled lower hem accent border
  const hemRufflePts: THREE.Vector3[] = [];
  for (let i = 0; i <= 48; i++) {
    const t = i / 48;
    const a = t * Math.PI * 2;
    const wave = Math.cos(a * 9.0) * 0.017;
    hemRufflePts.push(new THREE.Vector3(Math.sin(a) * (0.226 + wave * 0.7), 0.185 + wave, Math.cos(a) * (0.172 + wave * 0.7)));
  }
  const hemRuffleGeo = createTaperedLimbGeometry(
    new THREE.CatmullRomCurve3(hemRufflePts, true),
    () => 0.013,
    56,
    8,
  );
  setGeometryCavityColor(hemRuffleGeo, (i, pos) => (pos.getY(i) < 0.182 ? 0.58 : 0.14));
  fig.add(new THREE.Mesh(hemRuffleGeo, lotusGoldMat));

  // Ornate S-scroll scalloped rolled waistband + tucked hip side flaps + smooth broad Patka
  const waistFoldPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 48; i++) {
    const t = i / 48;
    const a = t * Math.PI * 2;
    const wave = Math.sin(a * 10.0) * 0.012;
    waistFoldPts.push(new THREE.Vector3(Math.sin(a) * 0.256, 1.158 + wave, Math.cos(a) * 0.200));
  }
  const waistFoldGeo = createTaperedLimbGeometry(
    new THREE.CatmullRomCurve3(waistFoldPts, true),
    () => 0.020,
    56,
    8,
  );
  setGeometryCavityColor(waistFoldGeo, (i, pos) => (pos.getY(i) < 1.152 ? 0.65 : 0.12));
  const waistFold = new THREE.Mesh(waistFoldGeo, lotusGoldMat);

  // 14 sculpted S-scroll rosettes along front/side waistband
  const scrollGeo = new THREE.TorusGeometry(0.016, 0.0055, 6, 12, Math.PI * 1.45);
  setGeometryUniformColor(scrollGeo, 0xe8b83d);
  const waistScrolls = new THREE.InstancedMesh(scrollGeo, ornamentGoldMat, 14);
  for (let i = 0; i < 14; i++) {
    const a = THREE.MathUtils.lerp(-Math.PI * 0.62, Math.PI * 0.62, i / 13);
    _v3.set(Math.sin(a) * 0.264, 1.162 + Math.sin(i * 1.8) * 0.006, Math.cos(a) * 0.206);
    _q.setFromEuler(_e.set(0.2, a, i * 0.9));
    _s.setScalar(1);
    _m4.compose(_v3, _q, _s);
    waistScrolls.setMatrixAt(i, _m4);
  }
  waistScrolls.instanceMatrix.needsUpdate = true;

  // Tucked hip cloth drape flaps at +/-X hips
  for (const side of [-1, 1] as const) {
    const flapCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.254, 1.14, 0.02),
      new THREE.Vector3(side * 0.278, 0.96, 0.01),
      new THREE.Vector3(side * 0.262, 0.78, -0.02),
    ]);
    const flapGeo = createTaperedLimbGeometry(flapCurve, (t) => 0.018 * (1.0 - 0.35 * t), 12, 8);
    setGeometryUniformColor(flapGeo, 0xd8a332);
    fig.add(new THREE.Mesh(flapGeo, lotusGoldMat));
  }

  const patkaMesh = new THREE.Mesh(createVolumetricPleatedPatkaGeo(), lotusGoldMat);
  patkaMesh.position.set(0.0, 1.162, 0.194);
  patkaMesh.castShadow = true;
  fig.add(waistFold, waistScrolls, patkaMesh);

  // 3. Natural Child-Prince Torso + Unified Pleated Uttariya Ribbon + Bow
  const torsoMesh = new THREE.Mesh(createSculptedBabyBuddhaTorsoGeo(0.94), statueGoldMat);
  torsoMesh.position.set(0, 1.16, 0);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  fig.add(torsoMesh);

  const uttariyaShawl = buildPleatedUttariyaShawl(lotusGoldMat, ornamentGoldMat);
  fig.add(uttariyaShawl);

  // 4. Sculpted Serene Prince Siddhartha Head (~1:4.3 figure-to-head ratio, rounded bun, zero seam)
  const babyHead = buildNobleBabySiddharthaHead(statueGoldMat, hairCurlsGoldMat, ornamentGoldMat);
  babyHead.position.set(0.0, 2.27, 0.008);
  fig.add(babyHead);

  // 5. Continuous RIGHT Arm (-X = viewer's left): seamless deltoid entry -> natural child elbow -> skyward hand
  const rightArmCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.186, 1.835, -0.004),
    new THREE.Vector3(-0.312, 1.780, 0.012),
    new THREE.Vector3(-0.408, 1.675, 0.034),
    new THREE.Vector3(-0.472, 1.745, 0.056),
    new THREE.Vector3(-0.468, 1.965, 0.072),
    new THREE.Vector3(-0.452, 2.185, 0.078),
  ]);
  const rightArmRad = (t: number) => {
    if (t < 0.35) return THREE.MathUtils.lerp(0.092, 0.078, t / 0.35);
    if (t < 0.65) return THREE.MathUtils.lerp(0.078, 0.064, (t - 0.35) / 0.30);
    return THREE.MathUtils.lerp(0.064, 0.049, (t - 0.65) / 0.35);
  };
  const rightArmGeo = createTaperedLimbGeometry(rightArmCurve, rightArmRad, 36, 16);
  setGeometryCavityColor(rightArmGeo, (i, pos) => {
    const px = pos.getX(i);
    const py = pos.getY(i);
    const underArm = px > -0.26 && py < 1.82 ? 0.55 : 0.0;
    const elbowCrease = Math.exp(-Math.pow((py - 1.70) / 0.05, 2)) * (pos.getZ(i) > 0.04 ? 0.28 : 0);
    return Math.min(0.8, 0.12 + underArm + elbowCrease);
  });
  const rightArm = new THREE.Mesh(rightArmGeo, statueGoldMat);
  rightArm.name = 'RightArmSkyward';
  rightArm.castShadow = true;

  const rightHand = buildSculptedPointingHand(statueGoldMat, 'up', -1);
  rightHand.name = 'RightHandSkyward';
  rightHand.position.set(-0.452, 2.225, 0.078);
  fig.add(rightArm, rightHand);

  // 6. Continuous LEFT Arm (+X = viewer's right): organic child curve beside hip/thigh
  const leftArmCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.186, 1.835, -0.004),
    new THREE.Vector3(0.302, 1.775, 0.004),
    new THREE.Vector3(0.348, 1.540, 0.018),
    new THREE.Vector3(0.372, 1.310, 0.032),
    new THREE.Vector3(0.388, 1.110, 0.048),
    new THREE.Vector3(0.398, 0.975, 0.060),
  ]);
  const leftArmRad = (t: number) => {
    if (t < 0.35) return THREE.MathUtils.lerp(0.092, 0.076, t / 0.35);
    if (t < 0.70) return THREE.MathUtils.lerp(0.076, 0.058, (t - 0.35) / 0.35);
    return THREE.MathUtils.lerp(0.058, 0.048, (t - 0.70) / 0.30);
  };
  const leftArmGeo = createTaperedLimbGeometry(leftArmCurve, leftArmRad, 32, 16);
  setGeometryCavityColor(leftArmGeo, (i, pos) => {
    const px = pos.getX(i);
    const py = pos.getY(i);
    const underArm = px < 0.27 && py < 1.80 ? 0.52 : 0.0;
    return Math.min(0.8, 0.12 + underArm);
  });
  const leftArm = new THREE.Mesh(leftArmGeo, statueGoldMat);
  leftArm.name = 'LeftArmEarthward';
  leftArm.castShadow = true;

  const leftHand = buildSculptedPointingHand(statueGoldMat, 'down', 1);
  leftHand.name = 'LeftHandEarthward';
  leftHand.position.set(0.398, 0.940, 0.060);
  fig.add(leftArm, leftHand);

  root.add(fig);
  return root;
}

/**
 * Compact sculpted Padmasana Dhyana Buddha for stupa shrines & facade alcoves (total height ~0.95m, faces +Z).
 */
export function createDetailedNicheSeatedBuddha(
  goldMat: THREE.Material,
  bronzeMat: THREE.Material,
): THREE.Group {
  const g = new THREE.Group();

  // Double-lotus seat plinth
  const plinthPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.34, 0.0),
    new THREE.Vector2(0.28, 0.06),
    new THREE.Vector2(0.25, 0.10),
    new THREE.Vector2(0.32, 0.15),
    new THREE.Vector2(0.0, 0.15),
  ];
  const plinth = new THREE.Mesh(new THREE.LatheGeometry(plinthPts, 20), bronzeMat);
  plinth.castShadow = true;
  g.add(plinth);

  const petalGeo = createRoundedSpoonLotusPetalGeo(0.085, 0.09, 0.018);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const p = new THREE.Mesh(petalGeo, goldMat);
    p.position.set(Math.sin(a) * 0.28, 0.08, Math.cos(a) * 0.28);
    p.rotation.y = a;
    p.rotation.x = 0.45;
    g.add(p);
  }

  // Padmasana crossed legs
  const lapPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.30, 0.0),
    new THREE.Vector2(0.28, 0.06),
    new THREE.Vector2(0.22, 0.11),
    new THREE.Vector2(0.14, 0.14),
  ];
  const lap = new THREE.Mesh(new THREE.LatheGeometry(lapPts, 20), goldMat);
  lap.scale.set(1.12, 1.0, 0.78);
  lap.position.y = 0.15;
  lap.castShadow = true;
  g.add(lap);

  for (const side of [-1, 1]) {
    const knee = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 10), goldMat);
    knee.scale.set(1.25, 0.68, 1.0);
    knee.position.set(side * 0.22, 0.20, 0.04);
    g.add(knee);
  }

  // Sculpted torso + draped shoulders
  const torsoPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.17, 0.02),
    new THREE.Vector2(0.13, 0.13),
    new THREE.Vector2(0.15, 0.24),
    new THREE.Vector2(0.18, 0.34),
    new THREE.Vector2(0.14, 0.41),
    new THREE.Vector2(0.055, 0.45),
    new THREE.Vector2(0.048, 0.49),
  ];
  const torso = new THREE.Mesh(new THREE.LatheGeometry(torsoPts, 22), goldMat);
  torso.scale.set(1.12, 1.0, 0.72);
  torso.position.y = 0.24;
  torso.castShadow = true;
  g.add(torso);

  // Tapered Dhyana arms & folded palms + alms vessel
  for (const side of [-1, 1]) {
    const armCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.15, 0.59, 0.01),
      new THREE.Vector3(side * 0.21, 0.46, 0.04),
      new THREE.Vector3(side * 0.15, 0.33, 0.10),
      new THREE.Vector3(side * 0.04, 0.29, 0.13),
    ]);
    const arm = new THREE.Mesh(
      createTaperedLimbGeometry(armCurve, (t) => THREE.MathUtils.lerp(0.044, 0.028, t), 14, 10),
      goldMat,
    );
    g.add(arm);
  }
  const hands = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.060, 0.026, 12), goldMat);
  hands.position.set(0, 0.285, 0.13);
  const bowl = new THREE.Mesh(
    new THREE.SphereGeometry(0.052, 12, 8, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.65),
    bronzeMat,
  );
  bowl.position.set(0, 0.33, 0.13);
  g.add(hands, bowl);

  // Head + snail-shell hair dome + Ushnisha + elongated ears
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.095, 16, 14), goldMat);
  head.scale.set(0.92, 1.08, 0.96);
  head.position.set(0, 0.79, 0.01);
  const ushnisha = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 10), goldMat);
  ushnisha.scale.set(1.0, 0.85, 1.0);
  ushnisha.position.set(0, 0.895, 0.0);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.058, 8), goldMat);
  flame.position.set(0, 0.945, 0.0);
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.055, 4, 6), goldMat);
    ear.position.set(side * 0.088, 0.77, 0.0);
    g.add(ear);
  }

  // Ornate concentric Prabhavali aura ring
  const haloOuter = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.016, 8, 28), goldMat);
  haloOuter.position.set(0, 0.74, -0.10);
  const haloInner = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.009, 6, 24), bronzeMat);
  haloInner.position.set(0, 0.74, -0.095);

  g.add(head, ushnisha, flame, haloOuter, haloInner);
  return g;
}


import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  createCrossedShrubSprigGeo,
  getLumbiniBotanicalLeafMaterial,
  getLumbiniGardenCraftMaterials,
} from './lumbiniGardenCraft';
import { createCarvedLotusPetalGeometry } from './mayaDeviSculptureGeo';

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

/**
 * Creates a sculpted, oval-jawed, serene Buddha head with arched brows, half-closed eyelids,
 * refined nose, compassionate lips, elongated perforated ears, Kambugriva neck rings,
 * InstancedMesh 6-tier snail-shell curls, Ushnisha dome, and Ketumala flame finial.
 */
function buildSculptedBuddhaHead(
  mats: BuddhaMaterials,
  scale = 1.0,
): THREE.Group {
  const headGroup = new THREE.Group();

  // Contoured oval cranial + jaw Lathe profile (much more lifelike than a plain sphere)
  const headPts: THREE.Vector2[] = [
    new THREE.Vector2(0.0, -0.44),
    new THREE.Vector2(0.14, -0.42),
    new THREE.Vector2(0.28, -0.32),
    new THREE.Vector2(0.37, -0.14),
    new THREE.Vector2(0.41, 0.08),
    new THREE.Vector2(0.40, 0.28),
    new THREE.Vector2(0.32, 0.43),
    new THREE.Vector2(0.18, 0.51),
    new THREE.Vector2(0.0, 0.53),
  ];
  const cranium = new THREE.Mesh(new THREE.LatheGeometry(headPts, 28), mats.skinMat);
  cranium.scale.set(0.92, 1.0, 0.96);
  cranium.castShadow = true;
  cranium.receiveShadow = true;
  headGroup.add(cranium);

  // Ushnisha wisdom dome
  const ushnisha = new THREE.Mesh(new THREE.SphereGeometry(0.21, 20, 16), mats.hairMat);
  ushnisha.position.set(0, 0.54, -0.02);
  ushnisha.scale.set(1.0, 0.86, 1.0);
  ushnisha.castShadow = true;
  headGroup.add(ushnisha);

  // Flaming Ketumala finial (authentic South/SE Asian & Nepali Buddha crown jewel)
  const ketuBase = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.095, 0.07, 14), mats.goldMat);
  ketuBase.position.set(0, 0.72, -0.02);
  const flamePts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.062, 0.05),
    new THREE.Vector2(0.048, 0.14),
    new THREE.Vector2(0.022, 0.23),
    new THREE.Vector2(0.0, 0.30),
  ];
  const ketuFlame = new THREE.Mesh(new THREE.LatheGeometry(flamePts, 14), mats.goldMat);
  ketuFlame.position.set(0, 0.74, -0.02);
  ketuFlame.castShadow = true;
  headGroup.add(ketuBase, ketuFlame);

  // Dense 7-tier concentric snail-shell hair curls (InstancedMesh for crisp sculptural detail)
  const curlPositions: Array<[number, number, number, number]> = [];
  const rows: Array<[number, number, number, number]> = [
    [28, 0.382, 0.19, 0.048],
    [26, 0.368, 0.27, 0.048],
    [22, 0.332, 0.35, 0.047],
    [18, 0.270, 0.43, 0.045],
    [14, 0.195, 0.51, 0.042],
    [12, 0.175, 0.59, 0.039],
    [8, 0.105, 0.66, 0.036],
  ];
  rows.forEach(([count, rr, ry, cs], rIdx) => {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + rIdx * 0.24;
      // Leave smooth arched forehead open on lower front rows
      if (rIdx === 0 && Math.cos(a) > 0.34) continue;
      if (rIdx === 1 && Math.cos(a) > 0.62) continue;
      if (rIdx === 2 && Math.cos(a) > 0.86) continue;
      curlPositions.push([
        Math.sin(a) * rr * 0.91,
        ry,
        Math.cos(a) * rr * 0.94 - 0.01,
        cs,
      ]);
    }
  });
  const curlGeo = new THREE.SphereGeometry(1, 9, 8);
  const curlMesh = new THREE.InstancedMesh(curlGeo, mats.hairMat, curlPositions.length);
  curlMesh.castShadow = true;
  curlPositions.forEach(([cx, cy, cz, cs], idx) => {
    _v3.set(cx, cy, cz);
    _q.identity();
    _s.setScalar(cs);
    _m4.compose(_v3, _q, _s);
    curlMesh.setMatrixAt(idx, _m4);
  });
  curlMesh.instanceMatrix.needsUpdate = true;
  headGroup.add(curlMesh);

  // Refined straight nose bridge, nasal tip & nostril flares
  const noseBridge = new THREE.Mesh(new THREE.CapsuleGeometry(0.028, 0.14, 6, 10), mats.skinMat);
  noseBridge.rotation.x = -0.22;
  noseBridge.position.set(0, -0.01, 0.398);
  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), mats.skinMat);
  noseTip.scale.set(1.22, 0.86, 0.96);
  noseTip.position.set(0, -0.088, 0.418);
  headGroup.add(noseBridge, noseTip);

  // Sculpted serene compassionate lips (upper cupid's bow + lower lip + subtle smile shadow crease)
  const upperLip = new THREE.Mesh(new THREE.CapsuleGeometry(0.020, 0.078, 6, 10), mats.skinMat);
  upperLip.rotation.z = Math.PI / 2;
  upperLip.position.set(0, -0.175, 0.390);
  const lipCrease = new THREE.Mesh(new THREE.CapsuleGeometry(0.007, 0.072, 4, 8), mats.bronzeMat);
  lipCrease.rotation.z = Math.PI / 2;
  lipCrease.position.set(0, -0.192, 0.394);
  const lowerLip = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.064, 6, 10), mats.skinMat);
  lowerLip.rotation.z = Math.PI / 2;
  lowerLip.position.set(0, -0.208, 0.384);
  headGroup.add(upperLip, lipCrease, lowerLip);

  // Arched meditative brows, half-closed eyelids & subtle dark meditative eye-slits
  for (const side of [-1, 1]) {
    const browCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.038, 0.088, 0.382),
      new THREE.Vector3(side * 0.125, 0.130, 0.376),
      new THREE.Vector3(side * 0.218, 0.095, 0.340),
    ]);
    const brow = new THREE.Mesh(new THREE.TubeGeometry(browCurve, 12, 0.014, 8, false), mats.skinMat);

    const lidCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.055, 0.048, 0.378),
      new THREE.Vector3(side * 0.125, 0.062, 0.386),
      new THREE.Vector3(side * 0.195, 0.040, 0.354),
    ]);
    const upperLid = new THREE.Mesh(new THREE.TubeGeometry(lidCurve, 10, 0.015, 8, false), mats.skinMat);

    const eyeSlitCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.062, 0.038, 0.382),
      new THREE.Vector3(side * 0.125, 0.032, 0.390),
      new THREE.Vector3(side * 0.188, 0.036, 0.358),
    ]);
    const eyeSlit = new THREE.Mesh(new THREE.TubeGeometry(eyeSlitCurve, 10, 0.0085, 6, false), mats.hairMat);

    const lowerLidCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.06, 0.030, 0.376),
      new THREE.Vector3(side * 0.125, 0.020, 0.382),
      new THREE.Vector3(side * 0.19, 0.030, 0.354),
    ]);
    const lowerLid = new THREE.Mesh(new THREE.TubeGeometry(lowerLidCurve, 10, 0.010, 6, false), mats.skinMat);

    // Elongated sculpted ear & perforated pendant earlobe
    const earCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.375, 0.12, -0.02),
      new THREE.Vector3(side * 0.425, -0.05, -0.01),
      new THREE.Vector3(side * 0.415, -0.26, 0.01),
      new THREE.Vector3(side * 0.39, -0.40, 0.02),
    ]);
    const earRim = new THREE.Mesh(new THREE.TubeGeometry(earCurve, 16, 0.046, 10, false), mats.skinMat);
    const earLobe = new THREE.Mesh(new THREE.SphereGeometry(0.052, 10, 8), mats.skinMat);
    earLobe.scale.set(0.75, 1.38, 0.9);
    earLobe.position.set(side * 0.39, -0.41, 0.02);

    headGroup.add(brow, upperLid, eyeSlit, lowerLid, earRim, earLobe);
  }

  // Golden Urna third-eye dot
  const urna = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 10), mats.goldMat);
  urna.position.set(0, 0.125, 0.398);
  headGroup.add(urna);

  // Three auspicious Kambugriva neck rings
  for (let r = 0; r < 3; r++) {
    const neckRing = new THREE.Mesh(new THREE.TorusGeometry(0.185 - r * 0.006, 0.014, 8, 22), mats.skinMat);
    neckRing.rotation.x = Math.PI / 2;
    neckRing.position.set(0, -0.44 - r * 0.045, 0.01);
    headGroup.add(neckRing);
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

  const petalShape = new THREE.Shape();
  petalShape.moveTo(0, 0);
  petalShape.bezierCurveTo(0.28, 0.12, 0.33, 0.46, 0, 0.68);
  petalShape.bezierCurveTo(-0.33, 0.46, -0.28, 0.12, 0, 0);
  const petalGeo = new THREE.ExtrudeGeometry(petalShape, {
    depth: 0.075,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.025,
    bevelSegments: 2,
    curveSegments: 8,
  });
  petalGeo.center();

  const petalInst = new THREE.InstancedMesh(petalGeo, mats.goldMat, 40);
  petalInst.castShadow = true;
  let pIdx = 0;
  for (let tier = 0; tier < 2; tier++) {
    const count = 20;
    const rad = tier === 0 ? 1.90 : 1.78;
    const py = tier === 0 ? 1.56 : 1.84;
    const tilt = tier === 0 ? 0.92 : 0.42;
    for (let i = 0; i < count; i++) {
      const a = ((i + tier * 0.5) / count) * Math.PI * 2;
      _v3.set(Math.sin(a) * rad, py, Math.cos(a) * rad);
      _q.setFromEuler(_e.set(0, a, 0));
      const tiltQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt, 0, 0));
      _q.multiply(tiltQ);
      _s.set(1.05, 1.0, 1.0);
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

  // Sculpted Torso & Robe-draped Shoulders
  const torsoPts = [
    new THREE.Vector2(0.0, 0.42),
    new THREE.Vector2(0.84, 0.52),
    new THREE.Vector2(0.66, 0.94),
    new THREE.Vector2(0.68, 1.38),
    new THREE.Vector2(0.82, 1.84),
    new THREE.Vector2(0.65, 2.08),
    new THREE.Vector2(0.24, 2.22),
    new THREE.Vector2(0.19, 2.40),
  ];
  const torso = new THREE.Mesh(new THREE.LatheGeometry(torsoPts, 32), mats.robeMat);
  torso.scale.set(1.16, 1.0, 0.72);
  torso.castShadow = true;
  torso.receiveShadow = true;
  buddha.add(torso);

  // Exposed right chest/shoulder skin section in authentic open-shoulder Uttarasanga style
  const rightChest = new THREE.Mesh(new THREE.SphereGeometry(0.46, 18, 16), mats.skinMat);
  rightChest.scale.set(1.08, 1.12, 0.78);
  rightChest.position.set(0.32, 1.68, 0.14);
  rightChest.castShadow = true;
  buddha.add(rightChest);

  // Smooth rounded shoulder deltoid caps so arms join torso organically
  const leftDeltoid = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), mats.robeMat);
  leftDeltoid.scale.set(1.08, 0.96, 0.92);
  leftDeltoid.position.set(-0.78, 1.94, 0.02);
  const rightDeltoid = new THREE.Mesh(
    new THREE.SphereGeometry(0.23, 14, 12),
    pose === 'bhumisparsha' ? mats.skinMat : mats.robeMat,
  );
  rightDeltoid.scale.set(1.08, 0.96, 0.92);
  rightDeltoid.position.set(0.76, 1.94, 0.02);
  buddha.add(leftDeltoid, rightDeltoid);

  // Diagonal rolled monastic Sanghati robe edge & 6 sculpted radial fold ribs across chest
  for (let f = 0; f < 6; f++) {
    const off = f * 0.095;
    const foldCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.66 + off * 0.24, 2.04 - off * 0.25, 0.18),
      new THREE.Vector3(-0.14, 1.70 - off * 0.46, 0.57),
      new THREE.Vector3(0.44, 1.40 - off * 0.40, 0.48),
      new THREE.Vector3(0.72, 1.15 - off * 0.26, 0.08),
    ]);
    const foldRadius = f === 0 ? 0.062 : 0.042;
    const fold = new THREE.Mesh(new THREE.TubeGeometry(foldCurve, 22, foldRadius, 10, false), mats.robeMat);
    fold.castShadow = true;
    buddha.add(fold);
  }

  // Pleated folded shoulder shawl descending over left shoulder
  const shawlCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.46, 2.16, -0.26),
    new THREE.Vector3(-0.56, 2.08, 0.16),
    new THREE.Vector3(-0.44, 1.62, 0.48),
    new THREE.Vector3(-0.34, 1.18, 0.51),
  ]);
  const shawl = new THREE.Mesh(new THREE.TubeGeometry(shawlCurve, 18, 0.095, 10, false), mats.robeMat);
  shawl.scale.set(1.2, 1, 0.45);
  shawl.castShadow = true;
  buddha.add(shawl);

  // Arms & Mudras
  // Left Arm (always rests calmly in lap holding meditation / palm-up)
  const leftArmCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.78, 1.94, 0.02),
    new THREE.Vector3(-0.92, 1.34, 0.12),
    new THREE.Vector3(-0.70, 0.86, 0.42),
    new THREE.Vector3(-0.22, 0.62, 0.56),
  ]);
  const leftArm = new THREE.Mesh(new THREE.TubeGeometry(leftArmCurve, 22, 0.165, 14, false), mats.robeMat);
  leftArm.castShadow = true;
  const leftHand = buildSculptedHand(mats.skinMat, 'palm-up', -1);
  leftHand.position.set(-0.08, 0.58, 0.58);
  buddha.add(leftArm, leftHand);

  if (pose === 'bhumisparsha') {
    // Right Arm: Graceful Earth-Touching pose draping over right knee
    const rightArmCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.76, 1.94, 0.02),
      new THREE.Vector3(0.94, 1.32, 0.12),
      new THREE.Vector3(0.92, 0.78, 0.34),
      new THREE.Vector3(0.84, 0.44, 0.46),
    ]);
    const rightArm = new THREE.Mesh(new THREE.TubeGeometry(rightArmCurve, 22, 0.155, 14, false), mats.skinMat);
    rightArm.castShadow = true;
    const rightHand = buildSculptedHand(mats.skinMat, 'earth-touch', 1);
    rightHand.position.set(0.84, 0.38, 0.48);
    rightHand.rotation.y = -0.18;
    buddha.add(rightArm, rightHand);
  } else {
    // Symmetric Dhyana Mudra right arm & cupped palm
    const rightArmCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.78, 1.94, 0.02),
      new THREE.Vector3(0.92, 1.34, 0.12),
      new THREE.Vector3(0.70, 0.86, 0.42),
      new THREE.Vector3(0.22, 0.65, 0.56),
    ]);
    const rightArm = new THREE.Mesh(new THREE.TubeGeometry(rightArmCurve, 22, 0.165, 14, false), mats.robeMat);
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

  // Outer ruffled marigold petal whorl (10 cupped ruffled petals)
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const p = new THREE.SphereGeometry(0.022, 6, 5);
    p.scale(1.15, 0.55, 1.55);
    push(p, 0.018, 0.35, -a, 0, Math.cos(a) * 0.036, Math.sin(a) * 0.036);
  }
  // Middle dense ruffled crown whorl (8 upright florets)
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * Math.PI * 2;
    const p = new THREE.SphereGeometry(0.018, 6, 5);
    p.scale(1.0, 0.85, 1.25);
    push(p, 0.034, -0.25, -a, 0, Math.cos(a) * 0.021, Math.sin(a) * 0.021);
  }
  // Central saffron-orange core dome
  push(new THREE.SphereGeometry(0.020, 7, 6), 0.042);

  const petalGeo = mergeGeometries(petalParts, false)!;
  petalParts.forEach((p) => p.dispose());

  // Green sepal calyx cup under blossom
  const calyxGeo = new THREE.CylinderGeometry(0.030, 0.014, 0.018, 7).toNonIndexed();
  calyxGeo.translate(0, 0.009, 0);
  return { petalGeo, calyxGeo };
}

function createSculptedCuppedLotusFlowerGeo(): { petalGeo: THREE.BufferGeometry; podGeo: THREE.BufferGeometry } {
  const parts: THREE.BufferGeometry[] = [];
  const push = (g: THREE.BufferGeometry, y = 0, ry = 0, rx = 0, x = 0, z = 0) => {
    const ni = g.index ? g.toNonIndexed() : g.clone();
    if (rx) ni.rotateX(rx);
    if (ry) ni.rotateY(ry);
    ni.translate(x, y, z);
    if (!ni.getAttribute('uv')) {
      ni.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(ni.getAttribute('position').count * 2), 2));
    }
    parts.push(ni);
    g.dispose();
  };
  const basePetal = createCarvedLotusPetalGeometry(0.085, 0.145, 0.022);
  // Outer 8 flaring lotus petals
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    push(basePetal.clone(), 0.014, -a, 0.92, Math.cos(a) * 0.035, Math.sin(a) * 0.035);
  }
  // Inner 6 cupped upright petals
  for (let i = 0; i < 6; i++) {
    const a = ((i + 0.5) / 6) * Math.PI * 2;
    const inner = basePetal.clone();
    inner.scale(0.82, 0.86, 0.82);
    push(inner, 0.022, -a, 0.42, Math.cos(a) * 0.022, Math.sin(a) * 0.022);
  }
  basePetal.dispose();
  const petalGeo = mergeGeometries(parts, false)!;
  parts.forEach((p) => p.dispose());

  const podGeo = new THREE.CylinderGeometry(0.032, 0.016, 0.042, 10);
  podGeo.translate(0, 0.035, 0);
  return { petalGeo, podGeo };
}

function buildDetailedBabySiddharthaHead(
  mats: BuddhaMaterials,
  curlMat: THREE.Material,
): THREE.Group {
  const headGroup = new THREE.Group();

  // Contoured child-Bodhisattva cranial & oval jaw Lathe profile (soft youthful cheeks, rounded chin)
  const headPts: THREE.Vector2[] = [
    new THREE.Vector2(0.0, -0.34),
    new THREE.Vector2(0.115, -0.325),
    new THREE.Vector2(0.225, -0.245),
    new THREE.Vector2(0.305, -0.105),
    new THREE.Vector2(0.335, 0.065),
    new THREE.Vector2(0.328, 0.225),
    new THREE.Vector2(0.265, 0.345),
    new THREE.Vector2(0.15, 0.415),
    new THREE.Vector2(0.0, 0.435),
  ];
  const cranium = new THREE.Mesh(new THREE.LatheGeometry(headPts, 32), mats.skinMat);
  cranium.scale.set(0.95, 1.0, 0.97);
  cranium.castShadow = true;
  cranium.receiveShadow = true;
  headGroup.add(cranium);

  // Ushnisha wisdom dome + sculpted lotus-bud Ketumala crown finial
  const ushnisha = new THREE.Mesh(new THREE.SphereGeometry(0.165, 20, 16), curlMat);
  ushnisha.position.set(0, 0.435, -0.015);
  ushnisha.scale.set(1.0, 0.84, 1.0);
  ushnisha.castShadow = true;
  const ketuBase = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.082, 0.055, 14), mats.goldMat);
  ketuBase.position.set(0, 0.565, -0.015);
  const ketuPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.054, 0.032),
    new THREE.Vector2(0.044, 0.095),
    new THREE.Vector2(0.022, 0.165),
    new THREE.Vector2(0.0, 0.225),
  ];
  const ketuFlame = new THREE.Mesh(new THREE.LatheGeometry(ketuPts, 16), mats.goldMat);
  ketuFlame.position.set(0, 0.585, -0.015);
  headGroup.add(ushnisha, ketuBase, ketuFlame);

  // Dense 7-tier coiled snail-shell Buddha hair curls (burnished bronze-gold for rich relief!)
  const curlPositions: Array<[number, number, number, number]> = [];
  const rows: Array<[number, number, number, number]> = [
    [28, 0.312, 0.155, 0.037],
    [26, 0.300, 0.220, 0.037],
    [22, 0.270, 0.285, 0.036],
    [18, 0.222, 0.348, 0.035],
    [14, 0.158, 0.410, 0.033],
    [12, 0.142, 0.475, 0.030],
    [8, 0.085, 0.530, 0.028],
  ];
  rows.forEach(([count, rr, ry, cs], rIdx) => {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + rIdx * 0.24;
      // Smooth arched forehead hairline over brow
      if (rIdx === 0 && Math.cos(a) > 0.36) continue;
      if (rIdx === 1 && Math.cos(a) > 0.64) continue;
      if (rIdx === 2 && Math.cos(a) > 0.87) continue;
      curlPositions.push([
        Math.sin(a) * rr * 0.94,
        ry,
        Math.cos(a) * rr * 0.96 - 0.01,
        cs,
      ]);
    }
  });
  const curlGeo = new THREE.SphereGeometry(1, 8, 7);
  const curlMesh = new THREE.InstancedMesh(curlGeo, curlMat, curlPositions.length);
  curlMesh.castShadow = true;
  curlPositions.forEach(([cx, cy, cz, cs], idx) => {
    _v3.set(cx, cy, cz);
    _q.identity();
    _s.set(cs, cs * 0.92, cs);
    _m4.compose(_v3, _q, _s);
    curlMesh.setMatrixAt(idx, _m4);
  });
  curlMesh.instanceMatrix.needsUpdate = true;
  headGroup.add(curlMesh);

  // Refined straight nose bridge, nasal tip & delicate nostrils
  const noseBridge = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.112, 6, 10), mats.skinMat);
  noseBridge.rotation.x = -0.22;
  noseBridge.position.set(0, -0.005, 0.324);
  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), mats.skinMat);
  noseTip.scale.set(1.22, 0.85, 0.96);
  noseTip.position.set(0, -0.068, 0.340);
  headGroup.add(noseBridge, noseTip);
  for (const side of [-1, 1]) {
    const alar = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), mats.skinMat);
    alar.position.set(side * 0.024, -0.078, 0.326);
    headGroup.add(alar);
  }

  // Serene smiling cupid's bow lips & subtle smile shadow crease
  const upperLip = new THREE.Mesh(new THREE.CapsuleGeometry(0.015, 0.062, 6, 10), mats.skinMat);
  upperLip.rotation.z = Math.PI / 2;
  upperLip.position.set(0, -0.140, 0.318);
  const lipCrease = new THREE.Mesh(new THREE.CapsuleGeometry(0.0055, 0.058, 4, 8), mats.bronzeMat);
  lipCrease.rotation.z = Math.PI / 2;
  lipCrease.position.set(0, -0.154, 0.322);
  const lowerLip = new THREE.Mesh(new THREE.CapsuleGeometry(0.017, 0.050, 6, 10), mats.skinMat);
  lowerLip.rotation.z = Math.PI / 2;
  lowerLip.position.set(0, -0.168, 0.312);
  headGroup.add(upperLip, lipCrease, lowerLip);

  // Gentle chin contour & golden Urna third-eye jewel
  const chin = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 10), mats.skinMat);
  chin.scale.set(1.12, 0.78, 0.85);
  chin.position.set(0, -0.245, 0.258);
  const urna = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 10), mats.goldMat);
  urna.position.set(0, 0.102, 0.326);
  headGroup.add(chin, urna);

  // Arched brows, sculpted half-closed eyelids & anatomical curved perforated ears (zero box/disc ears!)
  for (const side of [-1, 1]) {
    const browCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.032, 0.072, 0.314),
      new THREE.Vector3(side * 0.102, 0.106, 0.308),
      new THREE.Vector3(side * 0.178, 0.078, 0.278),
    ]);
    const brow = new THREE.Mesh(new THREE.TubeGeometry(browCurve, 12, 0.011, 8, false), mats.skinMat);

    const lidCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.045, 0.039, 0.310),
      new THREE.Vector3(side * 0.102, 0.052, 0.318),
      new THREE.Vector3(side * 0.158, 0.034, 0.290),
    ]);
    const upperLid = new THREE.Mesh(new THREE.TubeGeometry(lidCurve, 10, 0.012, 8, false), mats.skinMat);

    const eyeSlitCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.050, 0.032, 0.314),
      new THREE.Vector3(side * 0.102, 0.026, 0.321),
      new THREE.Vector3(side * 0.152, 0.030, 0.294),
    ]);
    const eyeSlit = new THREE.Mesh(new THREE.TubeGeometry(eyeSlitCurve, 10, 0.007, 6, false), mats.bronzeMat);

    const lowerLidCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.048, 0.024, 0.308),
      new THREE.Vector3(side * 0.102, 0.016, 0.314),
      new THREE.Vector3(side * 0.154, 0.025, 0.290),
    ]);
    const lowerLid = new THREE.Mesh(new THREE.TubeGeometry(lowerLidCurve, 10, 0.008, 6, false), mats.skinMat);

    // Sculpted anatomical ear helix, inner concha hollow & elongated pendant earlobe hugging head cleanly
    const earOuterCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.298, 0.105, -0.025),
      new THREE.Vector3(side * 0.342, 0.040, -0.042),
      new THREE.Vector3(side * 0.340, -0.105, -0.032),
      new THREE.Vector3(side * 0.326, -0.235, -0.010),
      new THREE.Vector3(side * 0.310, -0.325, 0.012),
    ]);
    const earHelix = new THREE.Mesh(new THREE.TubeGeometry(earOuterCurve, 18, 0.028, 10, false), mats.skinMat);
    const earBowl = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), mats.bronzeMat);
    earBowl.scale.set(0.32, 1.15, 0.72);
    earBowl.position.set(side * 0.306, -0.025, -0.022);
    const earLobe = new THREE.Mesh(new THREE.SphereGeometry(0.038, 10, 8), mats.skinMat);
    earLobe.scale.set(0.72, 1.45, 0.85);
    earLobe.position.set(side * 0.312, -0.315, 0.010);

    headGroup.add(brow, upperLid, eyeSlit, lowerLid, earHelix, earBowl, earLobe);
  }

  // Three auspicious Kambugriva neck rings
  for (let r = 0; r < 3; r++) {
    const neckRing = new THREE.Mesh(new THREE.TorusGeometry(0.150 - r * 0.005, 0.012, 8, 22), mats.skinMat);
    neckRing.rotation.x = Math.PI / 2;
    neckRing.position.set(0, -0.348 - r * 0.036, 0.01);
    headGroup.add(neckRing);
  }

  return headGroup;
}

function buildSkywardPointingRightHand(mat: THREE.Material, bangleMat: THREE.Material): THREE.Group {
  const hand = new THREE.Group();
  // Carved wrist bangle
  const bangle = new THREE.Mesh(new THREE.TorusGeometry(0.072, 0.016, 8, 16), bangleMat);
  bangle.rotation.x = Math.PI / 2;
  bangle.position.y = -0.055;
  hand.add(bangle);

  // Anatomical upright palm
  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.080, 14, 12), mat);
  palm.scale.set(0.95, 1.25, 0.48);
  palm.castShadow = true;
  hand.add(palm);

  // Extended skyward-pointing index finger (2 phalanx joints + rounded fingertip)
  const indexLower = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.072, 6, 8), mat);
  indexLower.position.set(-0.028, 0.122, 0.008);
  const indexUpper = new THREE.Mesh(new THREE.CapsuleGeometry(0.015, 0.068, 6, 8), mat);
  indexUpper.position.set(-0.028, 0.205, 0.010);
  hand.add(indexLower, indexUpper);

  // Curled middle, ring & little fingers folded neatly toward palm
  const curledX = [0.008, 0.040, 0.068];
  const curledLens = [0.056, 0.050, 0.042];
  for (let i = 0; i < 3; i++) {
    const f1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.015, curledLens[i], 5, 8), mat);
    f1.rotation.x = 0.85;
    f1.position.set(curledX[i], 0.095, 0.025);
    const f2 = new THREE.Mesh(new THREE.CapsuleGeometry(0.013, curledLens[i] * 0.78, 5, 8), mat);
    f2.rotation.x = 2.05;
    f2.position.set(curledX[i], 0.068, 0.052);
    hand.add(f1, f2);
  }

  // Graceful thumb folded diagonally across front of palm
  const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.017, 0.068, 5, 8), mat);
  thumb.rotation.set(0.35, 0, -0.68);
  thumb.position.set(-0.048, 0.032, 0.042);
  hand.add(thumb);

  return hand;
}

function buildRelaxedOpenLeftHand(mat: THREE.Material, bangleMat: THREE.Material): THREE.Group {
  const hand = new THREE.Group();
  const bangle = new THREE.Mesh(new THREE.TorusGeometry(0.072, 0.016, 8, 16), bangleMat);
  bangle.rotation.x = Math.PI / 2;
  bangle.position.y = 0.055;
  hand.add(bangle);

  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.078, 14, 12), mat);
  palm.scale.set(0.48, 1.24, 0.96);
  palm.castShadow = true;
  hand.add(palm);

  const fZ = [0.048, 0.016, -0.016, -0.046];
  const fLen = [0.078, 0.092, 0.086, 0.068];
  for (let i = 0; i < 4; i++) {
    const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, fLen[i], 5, 8), mat);
    f.rotation.z = 0.14;
    f.position.set(0.010, -0.095 - fLen[i] * 0.35, fZ[i]);
    hand.add(f);
  }
  const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.016, 0.064, 5, 8), mat);
  thumb.rotation.set(-0.42, 0, 0.25);
  thumb.position.set(0.025, -0.052, 0.074);
  hand.add(thumb);
  return hand;
}

function buildSculptedBareFoot(mat: THREE.Material, bangleMat: THREE.Material): THREE.Group {
  const foot = new THREE.Group();
  // Contoured heel & arched sole-instep profile
  const heel = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), mat);
  heel.scale.set(0.92, 0.72, 1.10);
  heel.position.set(0, 0.052, -0.065);
  const arch = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.16, 8, 12), mat);
  arch.rotation.x = Math.PI / 2 - 0.08;
  arch.scale.set(1.02, 1.0, 0.68);
  arch.position.set(0, 0.044, 0.045);
  foot.add(heel, arch);

  // 5 individually sculpted toes across forefoot
  const toeX = [-0.046, -0.020, 0.004, 0.026, 0.046];
  const toeRad = [0.018, 0.015, 0.014, 0.012, 0.0105];
  const toeLen = [0.048, 0.046, 0.042, 0.036, 0.028];
  for (let i = 0; i < 5; i++) {
    const t = new THREE.Mesh(new THREE.CapsuleGeometry(toeRad[i], toeLen[i], 5, 8), mat);
    t.rotation.x = Math.PI / 2;
    t.position.set(toeX[i], 0.022, 0.155 + (i === 0 ? 0.008 : -i * 0.005));
    foot.add(t);
  }
  // Sculpted ankle + beaded golden Nupura anklet ring
  const ankle = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.082, 0.11, 14), mat);
  ankle.position.set(0, 0.115, -0.045);
  const anklet = new THREE.Mesh(new THREE.TorusGeometry(0.084, 0.014, 8, 16), bangleMat);
  anklet.rotation.x = Math.PI / 2;
  anklet.position.set(0, 0.11, -0.042);
  foot.add(ankle, anklet);
  return foot;
}

/**
 * 4. Monumental Golden Baby Buddha (Prince Siddhartha standing barefoot on a double-tier sculpted
 *    golden lotus pedestal inside a dark basalt lotus-petal water-mirror basin woven with
 *    Sayapatri marigold garlands, floating sacred lotuses, and a dense botanical circular shrub bed).
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

  // Warm burnished gold-bronze for hair curls, engraved folds & jewel accents
  const burnishedHairGoldMat = new THREE.MeshStandardMaterial({
    color: 0xb67e1c,
    roughness: 0.34,
    metalness: 0.86,
    emissive: 0x331c02,
    emissiveIntensity: 0.10,
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

  const marigoldPetalMat = new THREE.MeshStandardMaterial({
    color: 0xf77e14,
    roughness: 0.62,
    metalness: 0.02,
    emissive: 0x451800,
    emissiveIntensity: 0.14,
  });

  const mangoLeafRopeMat = new THREE.MeshStandardMaterial({
    color: 0x2d5820,
    roughness: 0.82,
    metalness: 0.02,
  });

  const lotusPetalPinkMat = new THREE.MeshStandardMaterial({
    color: 0xf6c0cf,
    roughness: 0.56,
    metalness: 0.02,
  });

  const lotusPadMat = new THREE.MeshStandardMaterial({
    color: 0x386a2b,
    roughness: 0.78,
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
    new THREE.Vector2(1.42, 0.33),
    new THREE.Vector2(0.0, 0.33),
  ];
  const basinBody = new THREE.Mesh(new THREE.LatheGeometry(basinProfilePts, 48), craftMats.basaltMat);
  basinBody.castShadow = true;
  basinBody.receiveShadow = true;
  root.add(basinBody);

  // Speckled grey granite architectural coping rim ring + bronze joint band
  const graniteCopingRim = new THREE.Mesh(new THREE.TorusGeometry(3.00, 0.068, 10, 48), craftMats.graniteMat);
  graniteCopingRim.rotation.x = Math.PI / 2;
  graniteCopingRim.position.y = 0.415;
  graniteCopingRim.receiveShadow = true;
  const bronzeRimBead = new THREE.Mesh(new THREE.TorusGeometry(2.87, 0.022, 8, 48), mats.bronzeMat);
  bronzeRimBead.rotation.x = Math.PI / 2;
  bronzeRimBead.position.y = 0.422;
  root.add(graniteCopingRim, bronzeRimBead);

  // 28 smooth sculpted cupped dark basalt Padma (lotus-petal) coping stones crowning the outer basin wall
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

  // 8 Cardinal & Intercardinal Carved Granite Rim Plinths with Cast-Bronze Diyo Oil Lamps & Water Spouts
  const plinthGeo = new THREE.BoxGeometry(0.32, 0.14, 0.34);
  const lampStemGeo = new THREE.CylinderGeometry(0.024, 0.042, 0.10, 10);
  const lampBowlGeo = new THREE.CylinderGeometry(0.068, 0.032, 0.042, 12);
  const lampFlameGeo = new THREE.ConeGeometry(0.018, 0.045, 7);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const rx = Math.sin(a) * 2.98;
    const rz = Math.cos(a) * 2.98;
    const p = new THREE.Mesh(plinthGeo, craftMats.graniteMat);
    p.position.set(rx, 0.44, rz);
    p.rotation.y = a;
    p.castShadow = true;
    const stem = new THREE.Mesh(lampStemGeo, mats.bronzeMat);
    stem.position.set(rx, 0.56, rz);
    const bowl = new THREE.Mesh(lampBowlGeo, mats.goldMat);
    bowl.position.set(rx, 0.62, rz);
    const fl = new THREE.Mesh(lampFlameGeo, mats.flameMat);
    fl.position.set(rx, 0.655, rz);
    root.add(p, stem, bowl, fl);
  }

  // Crystalline dark obsidian-teal reflective shallow water pool + inlaid bronze ripple rings
  const poolDisc = new THREE.Mesh(new THREE.CircleGeometry(2.84, 48), deepPoolWaterMat);
  poolDisc.rotation.x = -Math.PI / 2;
  poolDisc.position.y = 0.382;
  poolDisc.receiveShadow = true;
  poolDisc.userData.nonCollidable = true;
  root.add(poolDisc);

  for (const rRing of [1.85, 2.38]) {
    const rip = new THREE.Mesh(new THREE.TorusGeometry(rRing, 0.014, 6, 48), mats.bronzeMat);
    rip.rotation.x = Math.PI / 2;
    rip.position.y = 0.388;
    rip.userData.nonCollidable = true;
    root.add(rip);
  }

  // =========================================================================
  // B. WOVEN MULTI-PETAL SAYAPATRI MARIGOLD GARLANDS & FLOATING LOTUS BLOOMS
  // =========================================================================
  // Braided green mango-leaf garland ropes circling the inner basin rim & lotus pedestal collar
  for (const gRad of [2.74, 1.54]) {
    const rope = new THREE.Mesh(new THREE.TorusGeometry(gRad, 0.036, 8, 48), mangoLeafRopeMat);
    rope.rotation.x = Math.PI / 2;
    rope.position.y = 0.422;
    rope.userData.nonCollidable = true;
    root.add(rope);
  }
  // 8 Draped scalloped leaf-and-marigold garland festoons across the water edge
  const festoonCoords: Array<[number, number, number]> = [];
  for (let f = 0; f < 8; f++) {
    const a0 = (f / 8) * Math.PI * 2;
    const a1 = ((f + 1) / 8) * Math.PI * 2;
    const pts: THREE.Vector3[] = [];
    for (let s = 0; s <= 12; s++) {
      const t = s / 12;
      const a = a0 + (a1 - a0) * t;
      const r = 2.74 - Math.sin(t * Math.PI) * 0.42;
      const pos = new THREE.Vector3(Math.sin(a) * r, 0.415, Math.cos(a) * r);
      pts.push(pos);
      if (s > 0 && s < 12) {
        festoonCoords.push([pos.x, 0.405, pos.z]);
      }
    }
    const festoonRope = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.026, 6, false),
      mangoLeafRopeMat,
    );
    festoonRope.userData.nonCollidable = true;
    root.add(festoonRope);
  }

  // Collect all marigold flower placements around rings + festoons (instanced 3D ruffled marigold rosettes!)
  const flowerCoords: Array<[number, number, number, number]> = [];
  for (const [ringR, stepCount] of [
    [2.74, 132],
    [1.54, 76],
  ] as Array<[number, number]>) {
    for (let i = 0; i < stepCount; i++) {
      const a = (i / stepCount) * Math.PI * 2;
      flowerCoords.push([Math.sin(a) * ringR, 0.432, Math.cos(a) * ringR, 0.92 + (i % 3) * 0.10]);
    }
  }
  festoonCoords.forEach(([fx, fy, fz], idx) => {
    flowerCoords.push([fx, fy, fz, 0.95 + (idx % 2) * 0.12]);
  });

  const { petalGeo: mgPetalGeo, calyxGeo: mgCalyxGeo } = createSculptedMarigoldFlowerGeo();
  const marigoldBlossomInst = new THREE.InstancedMesh(mgPetalGeo, marigoldPetalMat, flowerCoords.length);
  const marigoldCalyxInst = new THREE.InstancedMesh(mgCalyxGeo, mangoLeafRopeMat, flowerCoords.length);
  marigoldBlossomInst.userData.nonCollidable = true;
  marigoldCalyxInst.userData.nonCollidable = true;

  flowerCoords.forEach(([bx, by, bz, bs], idx) => {
    _v3.set(bx, by, bz);
    _q.setFromEuler(_e.set(0.08 * Math.sin(idx), idx * 1.1, 0.08 * Math.cos(idx)));
    _s.setScalar(bs);
    _m4.compose(_v3, _q, _s);
    marigoldBlossomInst.setMatrixAt(idx, _m4);
    marigoldCalyxInst.setMatrixAt(idx, _m4);
    // Rich marigold tonal palette: golden yellow-saffron, bright marigold orange & deep vermilion orange
    const tone = idx % 3;
    _cTmp.setHex(tone === 0 ? 0xffaa1d : tone === 1 ? 0xf67214 : 0xe5510a);
    marigoldBlossomInst.setColorAt(idx, _cTmp);
  });
  marigoldBlossomInst.instanceMatrix.needsUpdate = true;
  if (marigoldBlossomInst.instanceColor) marigoldBlossomInst.instanceColor.needsUpdate = true;
  marigoldCalyxInst.instanceMatrix.needsUpdate = true;
  marigoldBlossomInst.computeBoundingSphere();
  marigoldCalyxInst.computeBoundingSphere();
  root.add(marigoldBlossomInst, marigoldCalyxInst);

  // 14 Floating Sacred Lotuses & Lily Pads resting in the reflective basin pool
  const { petalGeo: lotPetalGeo, podGeo: lotPodGeo } = createSculptedCuppedLotusFlowerGeo();
  const padGeo = new THREE.CylinderGeometry(0.16, 0.15, 0.010, 14, 1, false, 0.25, Math.PI * 1.86);
  const floatLotusCoords: Array<[number, number, number]> = [];
  for (let i = 0; i < 14; i++) {
    const a = ((i + 0.35) / 14) * Math.PI * 2;
    const rad = i % 2 === 0 ? 1.88 : 2.18;
    floatLotusCoords.push([Math.sin(a) * rad, Math.cos(a) * rad, 0.85 + (i % 3) * 0.14]);
  }
  const padInst = new THREE.InstancedMesh(padGeo, lotusPadMat, floatLotusCoords.length);
  const lotBloomInst = new THREE.InstancedMesh(lotPetalGeo, lotusPetalPinkMat, floatLotusCoords.length);
  const lotPodInst = new THREE.InstancedMesh(lotPodGeo, mats.goldMat, floatLotusCoords.length);
  for (const inst of [padInst, lotBloomInst, lotPodInst]) inst.userData.nonCollidable = true;
  floatLotusCoords.forEach(([lx, lz, ls], idx) => {
    _v3.set(lx, 0.388, lz);
    _q.setFromEuler(_e.set(0, idx * 1.3, 0));
    _s.setScalar(ls);
    _m4.compose(_v3, _q, _s);
    padInst.setMatrixAt(idx, _m4);
    lotBloomInst.setMatrixAt(idx, _m4);
    lotPodInst.setMatrixAt(idx, _m4);
    _cTmp.setHex(idx % 3 === 0 ? 0xfff0f4 : 0xf4a8be);
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

  // Dense ring of 240 crossed doubly-curved botanical leaf sprigs + 36 woody stems + floral buds
  const sprigGeo = createCrossedShrubSprigGeo(0.52, 0.46);
  const leafMat = getLumbiniBotanicalLeafMaterial(extraTextures?.shrubMap, extraTextures?.shrubNormal);
  const shrubRingCount = 220;
  const ringFoliageInst = new THREE.InstancedMesh(sprigGeo, leafMat, shrubRingCount);
  ringFoliageInst.castShadow = true;
  ringFoliageInst.receiveShadow = true;
  ringFoliageInst.userData.nonCollidable = true;

  for (let i = 0; i < shrubRingCount; i++) {
    const a = (i / shrubRingCount) * Math.PI * 2;
    const radialJitter = (Math.sin(i * 19.7) * 0.5) * 0.14;
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
  // D. DOUBLE-TIER SCULPTED GOLDEN LOTUS PEDESTAL (y: 0.36 -> 1.44)
  // =========================================================================
  const lotusCorePts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(1.40, 0.0),
    new THREE.Vector2(1.36, 0.10),
    new THREE.Vector2(1.16, 0.26),
    new THREE.Vector2(0.92, 0.48),
    new THREE.Vector2(0.95, 0.58),
    new THREE.Vector2(1.26, 0.84),
    new THREE.Vector2(1.18, 1.00),
    new THREE.Vector2(0.0, 1.00),
  ];
  const lotusCore = new THREE.Mesh(new THREE.LatheGeometry(lotusCorePts, 36), mats.goldMat);
  lotusCore.position.y = 0.38;
  lotusCore.castShadow = true;
  lotusCore.receiveShadow = true;
  root.add(lotusCore);

  // Waist beaded pearl ring & 8 embossed Dharmachakra lotus medallions
  const waistPearlRing = new THREE.Mesh(new THREE.TorusGeometry(0.94, 0.032, 8, 36), burnishedHairGoldMat);
  waistPearlRing.rotation.x = Math.PI / 2;
  waistPearlRing.position.y = 0.88;
  root.add(waistPearlRing);
  const medGeo = new THREE.CylinderGeometry(0.11, 0.12, 0.04, 16);
  for (let m = 0; m < 8; m++) {
    const a = (m / 8) * Math.PI * 2;
    const med = new THREE.Mesh(medGeo, mats.bronzeMat);
    med.position.set(Math.sin(a) * 0.94, 0.88, Math.cos(a) * 0.94);
    med.rotation.set(Math.PI / 2, 0, -a);
    root.add(med);
  }

  // 40 Double-curved cupped 3D lotus petals across 2 lush staggered tiers
  const carvedGoldPetalGeo = createCarvedLotusPetalGeometry(0.38, 0.62, 0.072);
  const goldPetals = new THREE.InstancedMesh(carvedGoldPetalGeo, mats.goldMat, 40);
  goldPetals.castShadow = true;
  let gpIdx = 0;
  for (let tier = 0; tier < 2; tier++) {
    const count = 20;
    const rad = tier === 0 ? 1.24 : 1.18;
    const py = tier === 0 ? 0.58 : 0.96;
    const tilt = tier === 0 ? 1.06 : 0.42;
    for (let i = 0; i < count; i++) {
      const a = ((i + tier * 0.5) / count) * Math.PI * 2;
      _v3.set(Math.sin(a) * rad, py, Math.cos(a) * rad);
      _q.setFromEuler(_e.set(0, a, 0));
      const tq = new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt, 0, 0));
      _q.multiply(tq);
      _s.set(1.06, 1.08, 1.04);
      _m4.compose(_v3, _q, _s);
      goldPetals.setMatrixAt(gpIdx++, _m4);
    }
  }
  goldPetals.instanceMatrix.needsUpdate = true;
  goldPetals.computeBoundingSphere();
  root.add(goldPetals);

  // Upper seed-pod rim + 32 golden stamen pearls cradling Baby Siddhartha's feet
  const topLotusRim = new THREE.Mesh(new THREE.TorusGeometry(1.13, 0.048, 10, 36), mats.goldMat);
  topLotusRim.rotation.x = Math.PI / 2;
  topLotusRim.position.y = 1.38;
  root.add(topLotusRim);
  const stamenGeo = new THREE.SphereGeometry(0.032, 8, 6);
  const stamens = new THREE.InstancedMesh(stamenGeo, burnishedHairGoldMat, 32);
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    _v3.set(Math.sin(a) * 1.13, 1.425, Math.cos(a) * 1.13);
    _q.identity();
    _s.setScalar(1);
    _m4.compose(_v3, _q, _s);
    stamens.setMatrixAt(i, _m4);
  }
  stamens.instanceMatrix.needsUpdate = true;
  root.add(stamens);

  // =========================================================================
  // E. ULTRA-DETAILED REAL-LIFE GOLDEN BABY SIDDHARTHA (y: 1.40 -> 4.52)
  // =========================================================================
  const fig = new THREE.Group();
  fig.position.y = 1.40;

  // 1. Sculpted Bare Feet (arched instep, 5 toes per foot) + Nupura Anklets + Tapered Calves
  for (const side of [-1, 1]) {
    const foot = buildSculptedBareFoot(mats.goldMat, burnishedHairGoldMat);
    foot.position.set(side * 0.185, 0.0, 0.05);
    foot.rotation.y = side * 0.06;
    fig.add(foot);

    const shinPts = [
      new THREE.Vector2(0.072, 0.14),
      new THREE.Vector2(0.088, 0.26),
      new THREE.Vector2(0.114, 0.42),
      new THREE.Vector2(0.120, 0.56),
    ];
    const shin = new THREE.Mesh(new THREE.LatheGeometry(shinPts, 16), mats.goldMat);
    shin.position.set(side * 0.185, 0.0, -0.02);
    shin.castShadow = true;
    fig.add(shin);
  }

  // 2. Intricately Pleated Dhoti Wrap + Layered Hem Border + Ornate Girdle Belt + Central Pleated Sash
  const dhotiGeo = new THREE.CylinderGeometry(0.365, 0.425, 0.86, 36, 10, false);
  const dPos = dhotiGeo.attributes.position;
  for (let i = 0; i < dPos.count; i++) {
    const x = dPos.getX(i);
    const y = dPos.getY(i);
    const z = dPos.getZ(i);
    const ang = Math.atan2(x, z);
    const v = (y + 0.43) / 0.86; // 0 = hem .. 1 = waist
    // Sculpted vertical fan pleats + graceful front drape sag
    const pleat = Math.sin(ang * 14.0) * 0.020 * (1.0 - v * 0.35);
    const hipCurve = Math.sin(v * Math.PI) * 0.032;
    const radScale = 1.0 + pleat + hipCurve;
    dPos.setX(i, x * radScale * 1.06);
    dPos.setZ(i, z * radScale * 0.82);
  }
  dhotiGeo.computeVertexNormals();
  const dhoti = new THREE.Mesh(dhotiGeo, mats.goldMat);
  dhoti.position.y = 0.68;
  dhoti.castShadow = true;
  fig.add(dhoti);

  // Scalloped lower Dhoti brocade border hem + multi-strand jeweled Mekhala waist girdle + lotus clasp
  const hemBorder = new THREE.Mesh(new THREE.TorusGeometry(0.425, 0.024, 8, 36), burnishedHairGoldMat);
  hemBorder.rotation.x = Math.PI / 2;
  hemBorder.scale.set(1.06, 0.82, 1);
  hemBorder.position.y = 0.26;

  for (const [gy, gr] of [
    [1.10, 0.368],
    [1.04, 0.376],
  ] as Array<[number, number]>) {
    const belt = new THREE.Mesh(new THREE.TorusGeometry(gr, 0.026, 8, 32), burnishedHairGoldMat);
    belt.rotation.x = Math.PI / 2;
    belt.scale.set(1.06, 0.83, 1);
    belt.position.y = gy;
    fig.add(belt);
  }
  const beltClasp = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.088, 0.045, 16), burnishedHairGoldMat);
  beltClasp.rotation.x = Math.PI / 2;
  beltClasp.position.set(0, 1.07, 0.315);
  const beltJewel = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 8), mats.goldMat);
  beltJewel.position.set(0, 1.07, 0.340);

  // Sculpted fluted central front Patka sash tail hanging cleanly between shins
  const patkaGeo = new THREE.PlaneGeometry(0.21, 0.78, 8, 12);
  const pPos = patkaGeo.attributes.position;
  for (let i = 0; i < pPos.count; i++) {
    const px = pPos.getX(i);
    const py = pPos.getY(i);
    const v = 1.0 - (py + 0.39) / 0.78; // 0 top .. 1 bottom hem
    const flare = 1.0 + v * 0.42;
    const wave = Math.cos((px / 0.105) * Math.PI * 2.5) * 0.018;
    const zCurve = Math.sin(v * Math.PI * 0.65) * 0.045;
    pPos.setX(i, px * flare);
    pPos.setZ(i, wave + zCurve);
  }
  patkaGeo.computeVertexNormals();
  const patkaFront = new THREE.Mesh(patkaGeo, burnishedHairGoldMat);
  patkaFront.material.side = THREE.DoubleSide;
  patkaFront.position.set(0, 0.66, 0.335);
  patkaFront.castShadow = true;
  fig.add(hemBorder, beltClasp, beltJewel, patkaFront);

  // 3. Anatomical Child-Bodhisattva Upper Torso, Collarbones, Navel & Sacred Upavita / Kantha-Hara
  const torsoPts = [
    new THREE.Vector2(0.0, 1.04),
    new THREE.Vector2(0.355, 1.05),
    new THREE.Vector2(0.388, 1.24),
    new THREE.Vector2(0.370, 1.48),
    new THREE.Vector2(0.395, 1.72),
    new THREE.Vector2(0.388, 1.88),
    new THREE.Vector2(0.245, 2.02),
    new THREE.Vector2(0.155, 2.12),
  ];
  const torso = new THREE.Mesh(new THREE.LatheGeometry(torsoPts, 32), mats.goldMat);
  torso.scale.set(1.08, 1.0, 0.80);
  torso.castShadow = true;
  fig.add(torso);

  // Subtle carved navel ring + pectoral / collarbone curves
  const navel = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.008, 6, 12), burnishedHairGoldMat);
  navel.position.set(0, 1.26, 0.312);
  fig.add(navel);

  for (const side of [-1, 1]) {
    const clavCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.04, 1.97, 0.165),
      new THREE.Vector3(side * 0.18, 1.96, 0.155),
      new THREE.Vector3(side * 0.34, 1.91, 0.085),
    ]);
    const clav = new THREE.Mesh(new THREE.TubeGeometry(clavCurve, 10, 0.014, 7, false), mats.goldMat);
    fig.add(clav);
  }

  // Ornate Kantha-Hara golden royal collar necklace + diagonal Upavita sacred sash
  const necklaceCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.18, 2.02, 0.02),
    new THREE.Vector3(-0.13, 1.88, 0.24),
    new THREE.Vector3(0.0, 1.82, 0.305),
    new THREE.Vector3(0.13, 1.88, 0.24),
    new THREE.Vector3(0.18, 2.02, 0.02),
  ]);
  const necklace = new THREE.Mesh(new THREE.TubeGeometry(necklaceCurve, 20, 0.022, 8, false), burnishedHairGoldMat);
  const neckPendant = new THREE.Mesh(new THREE.OctahedronGeometry(0.046, 1), mats.goldMat);
  neckPendant.scale.set(0.85, 1.25, 0.55);
  neckPendant.position.set(0, 1.78, 0.315);

  const sashCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.24, 1.98, -0.18),
    new THREE.Vector3(-0.28, 1.98, 0.16),
    new THREE.Vector3(-0.02, 1.56, 0.325),
    new THREE.Vector3(0.32, 1.18, 0.22),
    new THREE.Vector3(0.35, 1.16, -0.14),
  ]);
  const sash = new THREE.Mesh(new THREE.TubeGeometry(sashCurve, 24, 0.036, 8, false), burnishedHairGoldMat);
  sash.scale.set(1.04, 1.0, 0.72);
  fig.add(necklace, neckPendant, sash);

  // 4. Sculpted Baby Siddhartha Head (ears hugging head, serene face, 130+ snail-shell curls)
  const babyHead = buildDetailedBabySiddharthaHead(mats, burnishedHairGoldMat);
  babyHead.position.set(0, 2.42, 0.02);
  fig.add(babyHead);

  // 5. Articulated Right Arm Raised Skyward + Keyura Armlet + Multi-Finger Pointing Hand
  const rightArmCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.34, 1.88, -0.01),
    new THREE.Vector3(0.49, 1.94, 0.04),
    new THREE.Vector3(0.55, 2.16, 0.09),
    new THREE.Vector3(0.52, 2.46, 0.10),
    new THREE.Vector3(0.48, 2.68, 0.08),
  ]);
  const rightArm = new THREE.Mesh(new THREE.TubeGeometry(rightArmCurve, 24, 0.078, 14, false), mats.goldMat);
  rightArm.castShadow = true;
  const rShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.118, 14, 12), mats.goldMat);
  rShoulder.scale.set(1.05, 0.92, 0.92);
  rShoulder.position.set(0.37, 1.88, -0.01);
  const rArmlet = new THREE.Mesh(new THREE.TorusGeometry(0.086, 0.016, 8, 16), burnishedHairGoldMat);
  rArmlet.rotation.y = Math.PI / 2;
  rArmlet.position.set(0.51, 2.02, 0.06);
  const rightHand = buildSkywardPointingRightHand(mats.goldMat, burnishedHairGoldMat);
  rightHand.position.set(0.48, 2.74, 0.08);
  fig.add(rightArm, rShoulder, rArmlet, rightHand);

  // 6. Articulated Left Arm Descending Gracefully + Keyura Armlet + Open 5-Finger Hand
  const leftArmCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.34, 1.88, -0.01),
    new THREE.Vector3(-0.48, 1.72, 0.02),
    new THREE.Vector3(-0.54, 1.46, 0.05),
    new THREE.Vector3(-0.54, 1.18, 0.06),
  ]);
  const leftArm = new THREE.Mesh(new THREE.TubeGeometry(leftArmCurve, 22, 0.078, 14, false), mats.goldMat);
  leftArm.castShadow = true;
  const lShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.118, 14, 12), mats.goldMat);
  lShoulder.scale.set(1.05, 0.92, 0.92);
  lShoulder.position.set(-0.37, 1.88, -0.01);
  const lArmlet = new THREE.Mesh(new THREE.TorusGeometry(0.086, 0.016, 8, 16), burnishedHairGoldMat);
  lArmlet.rotation.x = Math.PI / 2 - 0.35;
  lArmlet.position.set(-0.51, 1.60, 0.035);
  const leftHand = buildRelaxedOpenLeftHand(mats.goldMat, burnishedHairGoldMat);
  leftHand.position.set(-0.54, 1.10, 0.06);
  fig.add(leftArm, lShoulder, lArmlet, leftHand);

  root.add(fig);
  return root;
}

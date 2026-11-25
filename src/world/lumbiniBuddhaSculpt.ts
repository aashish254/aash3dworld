import * as THREE from 'three';

const _m4 = new THREE.Matrix4();
const _v3 = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _e = new THREE.Euler();

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
  } = {},
): THREE.Group {
  const scale = options.scale ?? 1.38;
  const pose = options.pose ?? 'bhumisparsha';
  const withNaga = options.withNagaCanopy ?? false;
  const withLamps = options.withOfferingLamps ?? true;

  const root = new THREE.Group();
  const monument = new THREE.Group();

  // A. Carved Octagonal Vajrasana Sandstone & Bronze Plinth (y: 0 -> 1.38)
  const plinth1 = new THREE.Mesh(new THREE.CylinderGeometry(2.68, 2.86, 0.34, 8), mats.stonePlinthMat);
  plinth1.position.y = 0.17;
  plinth1.castShadow = true;
  plinth1.receiveShadow = true;

  const plinth2 = new THREE.Mesh(new THREE.CylinderGeometry(2.38, 2.52, 0.24, 8), mats.stonePlinthMat);
  plinth2.position.y = 0.46;
  plinth2.castShadow = true;
  plinth2.receiveShadow = true;

  const drum = new THREE.Mesh(new THREE.CylinderGeometry(2.08, 2.16, 0.56, 8), mats.stonePlinthMat);
  drum.position.y = 0.86;
  drum.castShadow = true;
  drum.receiveShadow = true;

  const cornice = new THREE.Mesh(new THREE.CylinderGeometry(2.38, 2.16, 0.22, 8), mats.stonePlinthMat);
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
    const pil = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.56, 0.24), mats.stonePlinthMat);
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

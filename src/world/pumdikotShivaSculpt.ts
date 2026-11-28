import * as THREE from 'three';
import { getCachedMaterial, getCachedTexture, mergeStaticMeshesByMaterial } from './meshOptimization';
import { PumdikotPbrMaterials } from './pumdikotTextures';

export interface PumdikotShivaSculptBuild {
  group: THREE.Group;
  animatedNodes: THREE.Object3D[];
}

function buildOmPalmTexture(): THREE.CanvasTexture {
  return getCachedTexture('pumdikot-om-palm-map', () => {
    if (typeof document === 'undefined') {
      return new THREE.CanvasTexture({ width: 128, height: 128 } as unknown as HTMLCanvasElement);
    }
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#6bb4e8';
    ctx.fillRect(0, 0, 256, 256);
    // Subtle warm lotus glow behind Om on Abhaya palm
    const rad = ctx.createRadialGradient(128, 128, 12, 128, 128, 110);
    rad.addColorStop(0, 'rgba(254, 240, 138, 0.55)');
    rad.addColorStop(1, 'rgba(107, 180, 232, 0.0)');
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = '#c2410c';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 5;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 138px Georgia, serif';
    ctx.strokeText('ॐ', 128, 134);
    ctx.fillText('ॐ', 128, 134);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });
}

function createTaperedLimb(
  pts: Array<[number, number, number]>,
  rStart: number,
  rEnd: number,
  mat: THREE.Material,
  tubularSegments = 16,
  radialSegments = 14,
): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  const geo = new THREE.TubeGeometry(curve, tubularSegments, (rStart + rEnd) * 0.5, radialSegments, false);
  const pos = geo.attributes.position;
  const center = new THREE.Vector3();
  const avg = (rStart + rEnd) * 0.5;
  for (let i = 0; i < pos.count; i++) {
    const ringIdx = Math.floor(i / (radialSegments + 1));
    const t = Math.min(1, ringIdx / tubularSegments);
    curve.getPointAt(t, center);
    const r = THREE.MathUtils.lerp(rStart, rEnd, t);
    const scale = r / Math.max(0.001, avg);
    pos.setXYZ(
      i,
      center.x + (pos.getX(i) - center.x) * scale,
      center.y + (pos.getY(i) - center.y) * scale,
      center.z + (pos.getZ(i) - center.z) * scale,
    );
  }
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Builds the monumental 108-ft scale seated Lord Shiva idol & Tiger-Pelt throne
 * crowning Pumdikot's white ribbed dome (facing +Z toward the plaza & Nandi).
 */
export function buildPumdikotShivaSculpt(
  mats: PumdikotPbrMaterials,
): PumdikotShivaSculptBuild {
  const group = new THREE.Group();
  group.name = 'PumdikotShivaColossus';
  const animatedNodes: THREE.Object3D[] = [];

  const omPalmMat = getCachedMaterial(
    { omPalm: true },
    'pumdikot-om-palm-mat',
    () =>
      new THREE.MeshStandardMaterial({
        map: buildOmPalmTexture(),
        roughness: 0.4,
        metalness: 0.1,
      }),
  );

  // -------------------------------------------------------------------------
  // 1. GOLDEN LOTUS PEDESTAL & TIGER-PELT THRONE (with 3D Front Tiger Head)
  // -------------------------------------------------------------------------
  const pedestalBase = new THREE.Mesh(
    new THREE.CylinderGeometry(5.5, 5.9, 0.85, 32),
    mats.goldMat,
  );
  pedestalBase.position.y = 0.42;
  pedestalBase.castShadow = true;
  pedestalBase.receiveShadow = true;
  group.add(pedestalBase);

  // 18 radial sculpted golden lotus petals circling the throne plinth
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const petal = new THREE.Mesh(new THREE.SphereGeometry(0.78, 10, 8), mats.goldMat);
    petal.scale.set(1.05, 1.28, 0.26);
    petal.position.set(Math.sin(a) * 5.62, 0.72, Math.cos(a) * 5.62);
    petal.rotation.y = a;
    petal.rotation.x = 0.28;
    group.add(petal);
  }

  // Draped Tiger-Pelt rock mound & cushion
  const tigerCushion = new THREE.Mesh(
    new THREE.CylinderGeometry(4.85, 5.25, 1.05, 28),
    mats.tigerPeltMat,
  );
  tigerCushion.scale.set(1.16, 1.0, 0.86);
  tigerCushion.position.set(0, 1.15, 0.1);
  tigerCushion.castShadow = true;
  tigerCushion.receiveShadow = true;
  group.add(tigerCushion);

  // Sculpted Tiger Head projecting proudly center-front (+Z)
  const tigerHead = new THREE.Group();
  tigerHead.position.set(0, 1.26, 4.46);
  tigerHead.scale.setScalar(1.22);
  const tCranium = new THREE.Mesh(new THREE.SphereGeometry(0.92, 16, 12), mats.tigerPeltMat);
  tCranium.scale.set(1.18, 0.92, 1.06);
  const tSnout = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.56, 0.82), mats.whitePlasterMat);
  tSnout.position.set(0, -0.18, 0.65);
  const tNose = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.24, 5), mats.crimsonGateMat);
  tNose.rotation.x = Math.PI * 0.5;
  tNose.position.set(0, 0.04, 1.06);
  const tBrow = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.22, 0.35), mats.blackBasaltMat);
  tBrow.position.set(0, 0.34, 0.76);
  for (const sx of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.36, 8), mats.tigerPeltMat);
    ear.position.set(sx * 0.78, 0.72, -0.1);
    ear.rotation.z = -sx * 0.45;
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), mats.goldMat);
    eye.position.set(sx * 0.36, 0.2, 0.86);
    const ruff = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.9, 6), mats.tigerPeltMat);
    ruff.position.set(sx * 0.96, -0.1, 0.1);
    ruff.rotation.z = -sx * 1.15;
    const fang = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 6), mats.whitePlasterMat);
    fang.rotation.x = Math.PI;
    fang.position.set(sx * 0.24, -0.46, 0.92);
    tigerHead.add(ear, eye, ruff, fang);
  }
  tigerHead.add(tCranium, tSnout, tNose, tBrow);
  group.add(tigerHead);

  // Resting ceremonial Damaru beside Shiva's right hip
  const hipDamaru = new THREE.Group();
  hipDamaru.position.set(-4.85, 1.92, 1.35);
  hipDamaru.rotation.z = 0.22;
  hipDamaru.rotation.y = 0.55;
  const dCone1 = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.56, 16), mats.carvedTimberMat);
  dCone1.rotation.x = Math.PI * 0.5;
  dCone1.position.z = -0.26;
  const dCone2 = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.56, 16), mats.carvedTimberMat);
  dCone2.rotation.x = -Math.PI * 0.5;
  dCone2.position.z = 0.26;
  const dCap1 = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.06, 16), mats.whitePlasterMat);
  dCap1.rotation.x = Math.PI * 0.5;
  dCap1.position.z = 0.52;
  const dCap2 = dCap1.clone();
  dCap2.position.z = -0.52;
  const dWaist = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.05, 8, 14), mats.goldMat);
  hipDamaru.add(dCone1, dCone2, dCap1, dCap2, dWaist);
  group.add(hipDamaru);

  // -------------------------------------------------------------------------
  // 2. SEATED PADMASANA LORD SHIVA (Sky-Blue Neelakantha, ~15.8m tall)
  // -------------------------------------------------------------------------
  // Crossed legs & thighs
  const rightThigh = createTaperedLimb(
    [
      [-0.85, 2.15, 0.4],
      [-2.75, 2.02, 1.4],
      [-4.15, 2.05, 1.9],
      [-2.15, 2.25, 2.45],
      [0.45, 2.38, 2.35],
    ],
    1.12,
    0.64,
    mats.shivaBlueMat,
    20,
    14,
  );
  const leftThigh = createTaperedLimb(
    [
      [0.85, 2.15, 0.4],
      [2.75, 2.02, 1.4],
      [4.15, 2.05, 1.9],
      [2.15, 2.35, 2.55],
      [-0.55, 2.52, 2.45],
    ],
    1.12,
    0.64,
    mats.shivaBlueMat,
    20,
    14,
  );
  const rFoot = new THREE.Mesh(new THREE.SphereGeometry(0.56, 12, 10), mats.shivaBlueMat);
  rFoot.scale.set(1.25, 0.55, 0.8);
  rFoot.position.set(0.65, 2.45, 2.38);
  const lFoot = rFoot.clone();
  lFoot.position.set(-0.68, 2.56, 2.48);
  group.add(rightThigh, leftThigh, rFoot, lFoot);

  // Tiger-pelt dhoti waist wrap
  const dhotiWrap = new THREE.Mesh(
    new THREE.CylinderGeometry(1.75, 2.25, 2.1, 24),
    mats.tigerPeltMat,
  );
  dhotiWrap.scale.set(1.18, 1.0, 0.86);
  dhotiWrap.position.set(0, 2.65, 0.3);
  dhotiWrap.castShadow = true;
  group.add(dhotiWrap);

  // Sculpted Torso (narrow athletic waist expanding to broad chest & shoulders)
  const torsoPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(1.72, 0.0),
    new THREE.Vector2(1.48, 1.4),
    new THREE.Vector2(1.78, 2.9),
    new THREE.Vector2(2.26, 4.35),
    new THREE.Vector2(2.05, 5.15),
    new THREE.Vector2(0.92, 5.55),
    new THREE.Vector2(0.0, 5.6),
  ];
  const torsoGeo = new THREE.LatheGeometry(torsoPts, 28);
  const torsoMesh = new THREE.Mesh(torsoGeo, mats.shivaBlueMat);
  torsoMesh.scale.set(1.16, 1.0, 0.74);
  torsoMesh.position.set(0, 3.05, 0.08);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  group.add(torsoMesh);

  // Diagonal Tiger-Pelt Angavastram Sash across left shoulder -> right waist (draped visibly over chest)
  const sash = createTaperedLimb(
    [
      [1.82, 8.2, -0.45],
      [1.84, 8.28, 0.25],
      [1.18, 6.85, 1.38],
      [0.12, 5.25, 1.54],
      [-1.08, 3.68, 1.34],
    ],
    0.46,
    0.42,
    mats.tigerPeltMat,
    16,
    12,
  );
  group.add(sash);

  // Rudraksha Necklaces & Chest Malas
  for (let m = 0; m < 3; m++) {
    const malaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.75 - m * 0.14, 8.35 - m * 0.15, 0.45),
      new THREE.Vector3(-0.55 - m * 0.1, 6.7 - m * 0.7, 1.48 + m * 0.12),
      new THREE.Vector3(0, 5.85 - m * 0.85, 1.62 + m * 0.14),
      new THREE.Vector3(0.55 + m * 0.1, 6.7 - m * 0.7, 1.48 + m * 0.12),
      new THREE.Vector3(0.75 + m * 0.14, 8.35 - m * 0.15, 0.45),
    ]);
    const mala = new THREE.Mesh(
      new THREE.TubeGeometry(malaCurve, 22, 0.12 - m * 0.015, 8, false),
      mats.rudrakshaMat,
    );
    group.add(mala);
  }

  // Vasuki King Cobra draped around neck with open flared hood on Shiva's right (-X)
  const vasukiBody = createTaperedLimb(
    [
      [0.95, 8.45, -0.35],
      [0.85, 8.6, 0.65],
      [0.0, 8.45, 0.92],
      [-0.95, 8.55, 0.65],
      [-1.45, 9.1, 0.55],
      [-1.58, 9.95, 0.62],
    ],
    0.16,
    0.22,
    mats.blackBasaltMat,
    20,
    10,
  );
  const cobraHood = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), mats.blackBasaltMat);
  cobraHood.scale.set(1.22, 1.45, 0.26);
  cobraHood.position.set(-1.55, 10.06, 0.58);
  cobraHood.rotation.y = 0.24;
  const cobraMark = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 6, 12, Math.PI), mats.goldMat);
  cobraMark.position.set(-1.54, 10.06, 0.7);
  group.add(vasukiBody, cobraHood, cobraMark);

  // -------------------------------------------------------------------------
  // 3. HEAD, TRIPUNDRA, TRINETRA, JATA HAIR & SILVER CRESCENT MOON
  // -------------------------------------------------------------------------
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.9, 1.15, 18), mats.shivaBlueMat);
  neck.position.set(0, 8.85, 0.15);
  group.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(1.18, 24, 18), mats.shivaBlueMat);
  head.scale.set(0.9, 1.12, 0.95);
  head.position.set(0, 10.18, 0.25);
  head.castShadow = true;
  group.add(head);

  // Serene facial sculpting: nose bridge, eyes, Tripundra white forehead lines, Trinetra
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.44, 0.3), mats.shivaBlueMat);
  nose.position.set(0, 10.14, 1.34);
  nose.rotation.x = -0.18;
  group.add(nose);

  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), mats.blackBasaltMat);
    eye.scale.set(1.35, 0.52, 0.6);
    eye.position.set(sx * 0.38, 10.35, 1.24);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.055, 0.08), mats.blackBasaltMat);
    brow.position.set(sx * 0.38, 10.52, 1.28);
    brow.rotation.z = -sx * 0.12;
    const kundala = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.06, 8, 16), mats.goldMat);
    kundala.rotation.y = Math.PI * 0.5;
    kundala.position.set(sx * 1.08, 9.75, 0.22);
    group.add(eye, brow, kundala);
  }
  const lips = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.075, 0.1), mats.crimsonGateMat);
  lips.position.set(0, 9.75, 1.28);
  group.add(lips);

  // Three horizontal white Tripundra ash bands + glowing golden vertical Trinetra
  for (let t = 0; t < 3; t++) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.045, 0.06), mats.whitePlasterMat);
    band.position.set(0, 10.68 + t * 0.09, 1.24 - t * 0.03);
    group.add(band);
  }
  const trinetra = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 8), mats.goldMat);
  trinetra.scale.set(0.65, 1.45, 0.6);
  trinetra.position.set(0, 10.74, 1.27);
  group.add(trinetra);

  // Jata hair crown + cascading shoulder locks + Silver Crescent Moon
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(1.24, 20, 14), mats.shivaHairMat);
  hairCap.scale.set(0.95, 1.05, 1.02);
  hairCap.position.set(0, 10.48, 0.05);
  const jatamukuta = new THREE.Mesh(
    new THREE.CylinderGeometry(0.54, 0.88, 1.45, 18),
    mats.shivaHairMat,
  );
  jatamukuta.position.set(0, 11.88, 0.02);
  const topKnot = new THREE.Mesh(new THREE.SphereGeometry(0.56, 16, 12), mats.shivaHairMat);
  topKnot.position.set(0, 12.65, 0.02);
  const gangaSpire = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.88, 8), mats.silverMoonMat);
  gangaSpire.position.set(0, 13.42, 0.02);
  group.add(hairCap, jatamukuta, topKnot, gangaSpire);

  // Flowing Jata locks draping over both shoulders
  for (const sx of [-1, 1]) {
    const lock1 = createTaperedLimb(
      [
        [sx * 0.82, 10.65, 0.1],
        [sx * 1.48, 9.45, 0.05],
        [sx * 2.15, 8.25, 0.15],
        [sx * 2.38, 6.85, 0.25],
      ],
      0.34,
      0.16,
      mats.shivaHairMat,
      12,
      8,
    );
    const lock2 = createTaperedLimb(
      [
        [sx * 0.55, 10.75, -0.55],
        [sx * 1.15, 9.25, -0.75],
        [sx * 1.65, 7.6, -0.65],
      ],
      0.36,
      0.18,
      mats.shivaHairMat,
      10,
      8,
    );
    group.add(lock1, lock2);
  }

  // Gleaming Silver Crescent Moon on Jatamukuta
  const moonGroup = new THREE.Group();
  moonGroup.position.set(-0.78, 12.15, 0.42);
  moonGroup.rotation.z = 0.45;
  const moonCrescent = new THREE.Mesh(
    new THREE.TorusGeometry(0.62, 0.14, 10, 22, Math.PI * 1.25),
    mats.silverMoonMat,
  );
  moonCrescent.rotation.z = Math.PI * 0.62;
  moonGroup.add(moonCrescent);
  group.add(moonGroup);

  // -------------------------------------------------------------------------
  // 4. ARMS (Right Abhaya Blessing Palm with Om; Left Gripping 18m Trishul)
  // -------------------------------------------------------------------------
  // Right Arm (-X): shoulder -> elbow -> raised upright Abhaya forearm & palm
  const rightArm = createTaperedLimb(
    [
      [-2.15, 7.75, 0.12],
      [-2.85, 6.15, 0.42],
      [-3.15, 5.15, 1.25],
      [-2.95, 6.75, 1.95],
      [-2.82, 8.05, 2.05],
    ],
    0.72,
    0.42,
    mats.shivaBlueMat,
    18,
    12,
  );
  const rightBracelet = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.08, 8, 14), mats.rudrakshaMat);
  rightBracelet.rotation.x = Math.PI * 0.5;
  rightBracelet.position.set(-2.85, 7.62, 2.02);

  // Sculpted Abhaya hand & Om palm disc
  const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.82, 1.05, 0.34), mats.shivaBlueMat);
  rightHand.position.set(-2.82, 8.72, 2.06);
  const omPalmDisc = new THREE.Mesh(new THREE.CircleGeometry(0.38, 18), omPalmMat);
  omPalmDisc.position.set(-2.82, 8.66, 2.25);
  for (let f = 0; f < 4; f++) {
    const finger = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.085, 0.52 - Math.abs(f - 1.5) * 0.08, 4, 8),
      mats.shivaBlueMat,
    );
    finger.position.set(-3.12 + f * 0.2, 9.52, 2.06);
    group.add(finger);
  }
  const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.38, 4, 8), mats.shivaBlueMat);
  thumb.position.set(-2.34, 8.78, 2.1);
  thumb.rotation.z = -0.58;
  group.add(rightArm, rightBracelet, rightHand, omPalmDisc, thumb);

  // Left Arm (+X): shoulder -> elbow -> extended grip holding Trishul shaft at x=+4.25
  const leftArm = createTaperedLimb(
    [
      [2.15, 7.75, 0.12],
      [2.85, 6.25, 0.35],
      [3.38, 5.45, 1.05],
      [4.02, 7.15, 1.65],
      [4.25, 8.45, 1.75],
    ],
    0.72,
    0.42,
    mats.shivaBlueMat,
    18,
    12,
  );
  const leftBracelet = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.08, 8, 14), mats.rudrakshaMat);
  leftBracelet.rotation.x = Math.PI * 0.5;
  leftBracelet.position.set(4.18, 7.95, 1.72);
  const leftFist = new THREE.Mesh(new THREE.SphereGeometry(0.46, 12, 10), mats.shivaBlueMat);
  leftFist.position.set(4.28, 8.58, 1.78);
  group.add(leftArm, leftBracelet, leftFist);

  // -------------------------------------------------------------------------
  // 5. TOWERING 18m GOLDEN TRISHUL, TIED DAMARU & ANIMATED BANNER
  // -------------------------------------------------------------------------
  const trishulGroup = new THREE.Group();
  trishulGroup.position.set(4.3, 0.3, 1.78);

  const staff = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.21, 15.8, 14),
    mats.goldMat,
  );
  staff.position.y = 7.9;
  staff.castShadow = true;
  trishulGroup.add(staff);

  // Decorative collar rings along Trishul shaft
  for (const ry of [1.2, 5.2, 8.3, 12.0, 14.8]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.06, 8, 14), mats.polishedBrassMat);
    ring.rotation.x = Math.PI * 0.5;
    ring.position.y = ry;
    trishulGroup.add(ring);
  }

  // Sculpted 3-Pronged Golden Trishul Crown (y = 14.8 .. 18.2)
  const centerBlade = new THREE.Mesh(new THREE.ConeGeometry(0.28, 3.35, 10), mats.goldMat);
  centerBlade.position.y = 16.55;
  centerBlade.castShadow = true;
  const jewel = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), mats.crimsonGateMat);
  jewel.position.set(0, 15.6, 0.14);
  trishulGroup.add(centerBlade, jewel);

  for (const sx of [-1, 1]) {
    const prong = createTaperedLimb(
      [
        [0, 14.9, 0],
        [sx * 0.95, 15.15, 0],
        [sx * 1.32, 16.25, 0],
        [sx * 0.92, 17.55, 0],
      ],
      0.2,
      0.06,
      mats.goldMat,
      14,
      10,
    );
    trishulGroup.add(prong);
  }

  // Ceremonial Damaru tied near grip (y = 9.95)
  const staffDamaru = new THREE.Group();
  staffDamaru.position.set(0, 9.95, 0.22);
  staffDamaru.rotation.z = Math.PI * 0.5;
  const sd1 = new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.58, 14), mats.carvedTimberMat);
  sd1.position.y = 0.28;
  sd1.rotation.x = Math.PI;
  const sd2 = new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.58, 14), mats.carvedTimberMat);
  sd2.position.y = -0.28;
  const sdTie = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.06, 8, 14), mats.crimsonGateMat);
  sdTie.rotation.x = Math.PI * 0.5;
  staffDamaru.add(sd1, sd2, sdTie);
  trishulGroup.add(staffDamaru);

  // Fluttering Crimson-and-Saffron Silk Banner beneath the Trishul prongs
  const bannerPivot = new THREE.Group();
  bannerPivot.position.set(0.12, 14.2, 0);
  bannerPivot.userData.noMerge = true;
  bannerPivot.userData.noSpin = true;

  const bannerCloth = new THREE.Mesh(
    new THREE.PlaneGeometry(1.65, 2.45, 8, 6),
    mats.saffronClothMat,
  );
  bannerCloth.position.set(0.85, -1.2, 0);
  bannerCloth.userData.noMerge = true;
  bannerCloth.userData.noSpin = true;
  bannerCloth.userData.nonCollidable = true;

  const bannerBasePos = (bannerCloth.geometry.attributes.position as THREE.BufferAttribute).array.slice() as Float32Array;
  const crimsonStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(1.62, 0.55, 6, 1),
    mats.crimsonGateMat,
  );
  crimsonStrip.material = mats.crimsonGateMat.clone();
  crimsonStrip.material.side = THREE.DoubleSide;
  crimsonStrip.position.set(0.85, -2.15, 0.03);
  crimsonStrip.userData.noMerge = true;
  crimsonStrip.userData.noSpin = true;
  crimsonStrip.userData.nonCollidable = true;

  bannerPivot.add(bannerCloth, crimsonStrip);
  bannerPivot.userData.onEnvironmentUpdate = (env: { elapsed: number; windSpeed?: number }) => {
    const t = env.elapsed;
    const wind = Math.max(0.6, Math.min(2.2, env.windSpeed ?? 1.0));
    const pos = bannerCloth.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const bx = bannerBasePos[i * 3];
      const by = bannerBasePos[i * 3 + 1];
      const attachT = Math.max(0, (bx + 0.825) / 1.65);
      const wave =
        Math.sin(t * 3.4 * wind - bx * 2.6 + by * 1.1) * 0.24 * attachT +
        Math.cos(t * 2.1 - by * 1.7) * 0.08 * attachT;
      pos.setZ(i, wave);
    }
    pos.needsUpdate = true;
    bannerPivot.rotation.y = 0.22 + Math.sin(t * 1.35) * 0.14;
  };
  animatedNodes.push(bannerPivot);
  trishulGroup.add(bannerPivot);

  group.add(trishulGroup);

  mergeStaticMeshesByMaterial(group, { preserveCustomShaderMaterials: true });

  return { group, animatedNodes };
}

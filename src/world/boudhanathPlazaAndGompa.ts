import * as THREE from 'three';
import { BOUDHA_COMPLEX } from './boudhanathData';
import { StupaPbrMaterials } from './stupaTextures';

export interface BoudhaPlazaBuild {
  staticGroup: THREE.Group;
  dynamicGroup: THREE.Group;
  beaconLights: THREE.PointLight[];
  animatedNodes: THREE.Object3D[];
  templeBells: THREE.Group[];
  prayerWheelSpinners: THREE.Object3D[];
  gompaBowlHitTarget: THREE.Mesh;
  ajimaHitTarget: THREE.Mesh;
  triggerGompaBlessing: () => void;
  triggerAjimaOffering: () => void;
}

function buildSnowLionStatue(
  whiteMat: THREE.Material,
  goldMat: THREE.Material,
  turquoiseMat: THREE.Material,
  scale = 1.0,
): THREE.Group {
  const lion = new THREE.Group();
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.56, 1.38), whiteMat);
  plinth.position.y = 0.28;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  const trim = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.10, 1.46), goldMat);
  trim.position.y = 0.59;

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.62, 0.94), whiteMat);
  torso.position.set(0, 1.02, -0.06);
  torso.rotation.x = -0.32;
  torso.castShadow = true;

  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 8), whiteMat);
  chest.position.set(0, 1.28, 0.24);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), whiteMat);
  head.position.set(0, 1.62, 0.34);

  // Turquoise & Gold Tibetan Snow Lion mane curls
  const mane = new THREE.Mesh(new THREE.DodecahedronGeometry(0.34, 0), turquoiseMat);
  mane.scale.set(1.12, 1.05, 0.85);
  mane.position.set(0, 1.56, 0.21);
  const crown = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.22, 6), goldMat);
  crown.position.set(0, 1.94, 0.34);

  for (const sx of [-0.20, 0.20]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.10, 0.62, 8), whiteMat);
    leg.position.set(sx, 0.96, 0.32);
    lion.add(leg);
  }
  lion.add(plinth, trim, torso, chest, head, mane, crown);
  lion.scale.setScalar(scale);
  return lion;
}

function buildTempleBellGroup(goldMat: THREE.Material, frameMat: THREE.Material): THREE.Group {
  const bellGroup = new THREE.Group();
  const postL = new THREE.Mesh(new THREE.BoxGeometry(0.11, 1.55, 0.11), frameMat);
  postL.position.set(-0.42, 0.78, 0);
  const postR = postL.clone();
  postR.position.x = 0.42;
  const beam = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.14, 0.16), frameMat);
  beam.position.y = 1.55;
  const swingPivot = new THREE.Group();
  swingPivot.position.y = 1.48;
  const bellBody = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.24, 0.40, 12), goldMat);
  bellBody.position.y = -0.26;
  const clapperPivot = new THREE.Group();
  clapperPivot.position.y = -0.32;
  const clapper = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), goldMat);
  clapper.position.y = -0.14;
  clapperPivot.add(clapper);
  swingPivot.add(bellBody, clapperPivot);
  bellGroup.add(postL, postR, beam, swingPivot);
  bellGroup.userData.bellSwingPivot = swingPivot;
  bellGroup.userData.bellClapperPivot = clapperPivot;
  return bellGroup;
}

function buildNewariKoraHouse(
  width: number,
  depth: number,
  stories: number,
  mats: StupaPbrMaterials,
  accentColorHex: number,
): THREE.Group {
  const house = new THREE.Group();
  const storyH = 3.15;
  const totalH = stories * storyH;

  const facadeMat = new THREE.MeshStandardMaterial({
    color: accentColorHex,
    roughness: 0.85,
    metalness: 0.02,
  });

  // Ground stone plinth
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.3, 0.45, depth + 0.3),
    mats.mossyCarvedStoneMat,
  );
  plinth.position.y = 0.225;
  plinth.receiveShadow = true;
  house.add(plinth);

  // Main multi-story Tibetan/Newari townhouse block
  const body = new THREE.Mesh(new THREE.BoxGeometry(width, totalH, depth), facadeMat);
  body.position.y = 0.45 + totalH * 0.5;
  body.castShadow = true;
  body.receiveShadow = true;
  house.add(body);

  // Ground-floor Tibetan shop awning + wooden cornice bands per story
  for (let s = 1; s <= stories; s++) {
    const band = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.24, 0.18, depth + 0.24),
      mats.tibetanVermilionWoodMat,
    );
    band.position.y = 0.45 + s * storyH - 0.1;
    house.add(band);
  }

  // Carved timber window bays on both wide faces
  const winCount = Math.max(2, Math.floor(width / 3.2));
  for (let s = 0; s < stories; s++) {
    const wy = 0.45 + s * storyH + 1.55;
    for (let w = 0; w < winCount; w++) {
      const wx = ((w + 0.5) / winCount - 0.5) * (width - 1.6);
      for (const zSide of [-depth * 0.5 - 0.05, depth * 0.5 + 0.05]) {
        const frame = new THREE.Mesh(
          new THREE.BoxGeometry(1.18, 1.32, 0.14),
          mats.deepTeakWoodMat,
        );
        frame.position.set(wx, wy, zSide);
        const glass = new THREE.Mesh(
          new THREE.BoxGeometry(0.84, 0.96, 0.18),
          mats.butterFlameMat,
        );
        glass.position.set(wx, wy, zSide);
        house.add(frame, glass);
      }
    }
  }

  // Pitched clay-tile & gold cornice rooftop with rooftop Mani banner finial
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(Math.max(width, depth) * 0.72, 2.2, 4),
    mats.jhingatiRoofMat,
  );
  roof.rotation.y = Math.PI * 0.25;
  roof.scale.set(width / Math.max(width, depth), 1.0, depth / Math.max(width, depth));
  roof.position.y = 0.45 + totalH + 1.05;
  roof.castShadow = true;
  const finial = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.95, 8), mats.gildedCopperMat);
  finial.position.y = 0.45 + totalH + 2.45;
  house.add(roof, finial);
  return house;
}

/**
 * Builds the 116m x 116m Boudhanath Granite Kora Plaza, matching Dachi-brick & wrought-iron
 * Perimeter Fencing with gilded Endless Knot / Dharmachakra medallions, the monumental South Kora Dwar
 * Entrance Archway, East & North gateways, 3-story Newari-Tibetan houses, Thangka stalls,
 * Ajima Pagoda Shrine, and the Walkable Northern Tibetan Monastery (Gompa) with 108 butter lamps & singing bowl.
 */
export function buildBoudhanathPlazaAndGompa(mats: StupaPbrMaterials): BoudhaPlazaBuild {
  const c = BOUDHA_COMPLEX;
  const staticGroup = new THREE.Group();
  const dynamicGroup = new THREE.Group();
  const beaconLights: THREE.PointLight[] = [];
  const animatedNodes: THREE.Object3D[] = [];
  const templeBells: THREE.Group[] = [];
  const prayerWheelSpinners: THREE.Object3D[] = [];

  const turquoiseMat = new THREE.MeshStandardMaterial({
    color: 0x0f766e,
    roughness: 0.46,
    metalness: 0.15,
  });

  // =========================================================================
  // 1. GRANITE KORA PLAZA DECK & GATE ENTRANCE APRONS
  // =========================================================================
  const plazaSlab = new THREE.Mesh(
    new THREE.BoxGeometry(c.halfSize * 2, 0.22, c.halfSize * 2),
    mats.graniteFlagstoneMat,
  );
  plazaSlab.position.set(0, c.plazaY - 0.11, 0);
  plazaSlab.receiveShadow = true;
  staticGroup.add(plazaSlab);

  // Outer stone approach aprons cleanly bridging roads to South Kora Dwar, East & North gates
  const aprons: Array<[number, number, number, number]> = [
    [0, c.halfSize + 3.2, 9.2, 6.5],
    [c.halfSize + 3.2, 0, 6.5, 8.4],
    [0, -c.halfSize - 3.2, 8.4, 6.5],
  ];
  for (const [ax, az, aw, ad] of aprons) {
    const apron = new THREE.Mesh(new THREE.BoxGeometry(aw, 0.22, ad), mats.graniteFlagstoneMat);
    apron.position.set(ax, c.plazaY - 0.11, az);
    apron.receiveShadow = true;
    staticGroup.add(apron);
  }

  // =========================================================================
  // 2. MATCHING PERIMETER FENCING (Dachi brick dwarf wall, white pillars, wrought iron + gold Dharmachakra)
  // =========================================================================
  const pillarPositions: Array<{ x: number; z: number }> = [];
  const picketPositions: Array<{ x: number; z: number; rotY: number }> = [];
  const medallionPositions: Array<{ x: number; z: number; rotY: number }> = [];
  const wallSegments: Array<{ x: number; z: number; len: number; rotY: number }> = [];

  const addFenceRun = (
    x1: number,
    z1: number,
    x2: number,
    z2: number,
    gapMin: number,
    gapMax: number,
    isHorizontalZ: boolean,
  ) => {
    const totalLen = Math.hypot(x2 - x1, z2 - z1);
    const dirX = (x2 - x1) / totalLen;
    const dirZ = (z2 - z1) / totalLen;
    const rotY = isHorizontalZ ? 0 : Math.PI * 0.5;
    const spans: Array<[number, number]> = gapMax > gapMin ? [[0, gapMin], [gapMax, totalLen]] : [[0, totalLen]];
    for (const [s0, s1] of spans) {
      const span = s1 - s0;
      if (span < 1.0) continue;
      const mid = (s0 + s1) * 0.5;
      wallSegments.push({ x: x1 + dirX * mid, z: z1 + dirZ * mid, len: span, rotY });

      const bayCount = Math.max(1, Math.round(span / 4.5));
      for (let b = 0; b <= bayCount; b++) {
        const d = s0 + (b / bayCount) * span;
        pillarPositions.push({ x: x1 + dirX * d, z: z1 + dirZ * d });
        if (b < bayCount) {
          const b0 = d;
          const b1 = s0 + ((b + 1) / bayCount) * span;
          const bMid = (b0 + b1) * 0.5;
          medallionPositions.push({ x: x1 + dirX * bMid, z: z1 + dirZ * bMid, rotY });
          for (let p = 1; p < 12; p++) {
            const pd = b0 + (p / 12) * (b1 - b0);
            picketPositions.push({ x: x1 + dirX * pd, z: z1 + dirZ * pd, rotY });
          }
        }
      }
    }
  };

  const hs = c.halfSize; // 58m
  addFenceRun(-hs, hs, hs, hs, hs - 3.9, hs + 3.9, true); // South gate gap
  addFenceRun(-hs, -hs, hs, -hs, hs - 3.45, hs + 3.45, true); // North gate gap
  addFenceRun(hs, -hs, hs, hs, hs - 3.45, hs + 3.45, false); // East gate gap
  addFenceRun(-hs, -hs, -hs, hs, -1, -1, false); // Solid West perimeter fence

  for (const seg of wallSegments) {
    const brickWall = new THREE.Mesh(
      new THREE.BoxGeometry(seg.len, 0.65, 0.45),
      mats.dachiBrickMat,
    );
    brickWall.position.set(seg.x, c.plazaY + 0.325, seg.z);
    brickWall.rotation.y = seg.rotY;
    brickWall.castShadow = true;
    brickWall.receiveShadow = true;

    const coping = new THREE.Mesh(
      new THREE.BoxGeometry(seg.len + 0.08, 0.12, 0.54),
      mats.sandstoneCopingMat,
    );
    coping.position.set(seg.x, c.plazaY + 0.71, seg.z);
    coping.rotation.y = seg.rotY;
    staticGroup.add(brickWall, coping);

    for (const ry of [c.plazaY + 0.96, c.plazaY + 2.15]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(seg.len, 0.06, 0.06), mats.wroughtIronMat);
      rail.position.set(seg.x, ry, seg.z);
      rail.rotation.y = seg.rotY;
      staticGroup.add(rail);
    }
  }

  const dummy = new THREE.Object3D();
  const pillarInst = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.48, 2.6, 0.48),
    mats.whiteStuccoMat,
    pillarPositions.length,
  );
  pillarInst.castShadow = true;
  const capRoofInst = new THREE.InstancedMesh(
    new THREE.ConeGeometry(0.42, 0.36, 4),
    mats.jhingatiRoofMat,
    pillarPositions.length,
  );
  const capGoldInst = new THREE.InstancedMesh(
    new THREE.ConeGeometry(0.11, 0.34, 8),
    mats.gildedCopperMat,
    pillarPositions.length,
  );

  for (let i = 0; i < pillarPositions.length; i++) {
    const p = pillarPositions[i];
    dummy.position.set(p.x, c.plazaY + 1.3, p.z);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    pillarInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(p.x, c.plazaY + 2.78, p.z);
    dummy.rotation.set(0, Math.PI * 0.25, 0);
    dummy.updateMatrix();
    capRoofInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(p.x, c.plazaY + 3.08, p.z);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    capGoldInst.setMatrixAt(i, dummy.matrix);
  }
  pillarInst.instanceMatrix.needsUpdate = true;
  capRoofInst.instanceMatrix.needsUpdate = true;
  capGoldInst.instanceMatrix.needsUpdate = true;
  pillarInst.computeBoundingSphere();
  capRoofInst.computeBoundingSphere();
  capGoldInst.computeBoundingSphere();
  dynamicGroup.add(pillarInst, capRoofInst, capGoldInst);

  const picketInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.025, 0.025, 1.48, 6),
    mats.wroughtIronMat,
    picketPositions.length,
  );
  for (let i = 0; i < picketPositions.length; i++) {
    const pk = picketPositions[i];
    dummy.position.set(pk.x, c.plazaY + 1.56, pk.z);
    dummy.rotation.set(0, pk.rotY, 0);
    dummy.updateMatrix();
    picketInst.setMatrixAt(i, dummy.matrix);
  }
  picketInst.instanceMatrix.needsUpdate = true;
  picketInst.computeBoundingSphere();
  dynamicGroup.add(picketInst);

  // Gilded Dharmachakra & Endless Knot fence medallions
  const medRingInst = new THREE.InstancedMesh(
    new THREE.TorusGeometry(0.28, 0.038, 6, 16),
    mats.gildedCopperMat,
    medallionPositions.length,
  );
  const medCrossInst = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.32, 0.32, 0.05),
    mats.gildedCopperMat,
    medallionPositions.length,
  );
  for (let i = 0; i < medallionPositions.length; i++) {
    const m = medallionPositions[i];
    dummy.position.set(m.x, c.plazaY + 1.56, m.z);
    dummy.rotation.set(0, m.rotY, 0);
    dummy.updateMatrix();
    medRingInst.setMatrixAt(i, dummy.matrix);

    dummy.rotation.set(0, m.rotY, Math.PI * 0.25);
    dummy.updateMatrix();
    medCrossInst.setMatrixAt(i, dummy.matrix);
  }
  medRingInst.instanceMatrix.needsUpdate = true;
  medCrossInst.instanceMatrix.needsUpdate = true;
  medRingInst.computeBoundingSphere();
  medCrossInst.computeBoundingSphere();
  dynamicGroup.add(medRingInst, medCrossInst);

  // =========================================================================
  // 3. GRAND TIBETAN-NEWARI SOUTH ENTRANCE ARCHWAY (KORA DWAR) + EAST/NORTH GATES
  // =========================================================================
  const buildGatehouse = (
    gx: number,
    gz: number,
    rotY: number,
    isMainSouth: boolean,
  ) => {
    const gate = new THREE.Group();
    gate.position.set(gx, c.plazaY, gz);
    gate.rotation.y = rotY;
    const spanHalf = isMainSouth ? 4.45 : 3.95;

    for (const sx of [-spanHalf, spanHalf]) {
      const pier = new THREE.Mesh(
        new THREE.BoxGeometry(1.45, isMainSouth ? 5.2 : 4.2, 1.55),
        mats.dachiBrickMat,
      );
      pier.position.set(sx, isMainSouth ? 2.6 : 2.1, 0);
      pier.castShadow = true;
      pier.receiveShadow = true;
      const band = new THREE.Mesh(
        new THREE.BoxGeometry(1.62, 0.28, 1.72),
        mats.whiteStuccoMat,
      );
      band.position.set(sx, isMainSouth ? 4.8 : 3.9, 0);
      gate.add(pier, band);
    }

    const lintel = new THREE.Mesh(
      new THREE.BoxGeometry(spanHalf * 2 + 1.8, 0.88, 1.75),
      mats.tibetanVermilionWoodMat,
    );
    lintel.position.set(0, isMainSouth ? 5.35 : 4.35, 0);
    lintel.castShadow = true;
    gate.add(lintel);

    // Carved Wooden Torana Tympanum above archway
    const torana = new THREE.Mesh(
      new THREE.ConeGeometry(isMainSouth ? 2.6 : 1.9, isMainSouth ? 1.7 : 1.25, 3),
      mats.gildedCopperMat,
    );
    torana.scale.set(1.3, 1.0, 0.16);
    torana.position.set(0, isMainSouth ? 6.2 : 5.05, 0.92);
    gate.add(torana);

    // Two-tier Newari Pagoda Roof for Kora Dwar, single-tier for East/North gates
    const roof1 = new THREE.Mesh(
      new THREE.ConeGeometry(spanHalf + 2.4, 2.2, 4),
      mats.jhingatiRoofMat,
    );
    roof1.rotation.y = Math.PI * 0.25;
    roof1.scale.set(1.25, 1.0, 0.65);
    roof1.position.set(0, isMainSouth ? 6.8 : 5.55, 0);
    roof1.castShadow = true;
    gate.add(roof1);

    if (isMainSouth) {
      const upperBox = new THREE.Mesh(
        new THREE.BoxGeometry(6.6, 1.5, 2.4),
        mats.whiteStuccoMat,
      );
      upperBox.position.set(0, 7.65, 0);
      const roof2 = new THREE.Mesh(new THREE.ConeGeometry(4.8, 1.85, 4), mats.gildedCopperMat);
      roof2.rotation.y = Math.PI * 0.25;
      roof2.scale.set(1.22, 1.0, 0.64);
      roof2.position.set(0, 9.15, 0);
      roof2.castShadow = true;
      const gajur = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.4, 12), mats.gildedCopperMat);
      gajur.position.set(0, 10.65, 0);
      gate.add(upperBox, roof2, gajur);

      // Flanking Snow Lions inside main South entrance
      for (const sx of [-3.6, 3.6]) {
        const lion = buildSnowLionStatue(mats.whiteStuccoMat, mats.gildedCopperMat, turquoiseMat, 0.96);
        lion.position.set(sx, 0, -2.6);
        lion.rotation.y = Math.PI;
        gate.add(lion);
      }

      // Prayer-wheel racks mounted inside left & right of South Gate
      for (const side of [-1, 1]) {
        const rx = side * 6.4;
        const rackFrame = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.65, 0.48), mats.tibetanVermilionWoodMat);
        rackFrame.position.set(rx, 0.85, -1.8);
        rackFrame.castShadow = true;
        gate.add(rackFrame);
        for (let w = 0; w < 3; w++) {
          const wheel = new THREE.Group();
          const cyl = new THREE.Mesh(
            new THREE.CylinderGeometry(0.19, 0.19, 0.44, 12),
            mats.prayerWheelBrassMat,
          );
          const cap = new THREE.Mesh(
            new THREE.ConeGeometry(0.20, 0.10, 12),
            mats.gildedCopperMat,
          );
          cap.position.y = 0.27;
          wheel.add(cyl, cap);
          wheel.position.set(rx - 0.8 + w * 0.8, 0.96, -1.8);
          wheel.userData.noMerge = true;
          wheel.userData.prayerWheel = { angle: w * 0.6, velocity: 0.25 };
          dynamicGroup.add(wheel);
          gate.updateMatrixWorld(true);
          // Re-anchor wheel cleanly into dynamicGroup in Boudha-local coords
          wheel.position.set(gx + rx - 0.8 + w * 0.8, c.plazaY + 0.96, gz - 1.8);
          prayerWheelSpinners.push(wheel);
        }
      }

      // Prominent Heritage Plaque centered on Kora Dwar South lintel + flanking brick stand
      const lintelPlaque = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 0.82), mats.boudhaPlaqueMat);
      lintelPlaque.position.set(0, 5.36, 0.92);
      const plaqueStand = new THREE.Mesh(new THREE.BoxGeometry(1.75, 2.25, 0.24), mats.dachiBrickMat);
      plaqueStand.position.set(4.8, 1.12, -4.8);
      plaqueStand.castShadow = true;
      const plaqueFace = new THREE.Mesh(new THREE.PlaneGeometry(1.52, 0.78), mats.boudhaPlaqueMat);
      plaqueFace.position.set(4.8, 1.48, -4.67);
      const plaqueBack = plaqueFace.clone();
      plaqueBack.rotation.y = Math.PI;
      plaqueBack.position.z = -4.93;
      gate.add(lintelPlaque, plaqueStand, plaqueFace, plaqueBack);

      const gateLight = new THREE.PointLight(0xffb454, 4.5, 22, 1.8);
      gateLight.position.set(gx, c.plazaY + 4.4, gz - 1.2);
      beaconLights.push(gateLight);
      dynamicGroup.add(gateLight);
    } else {
      const gajur = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.95, 10), mats.gildedCopperMat);
      gajur.position.set(0, 6.9, 0);
      gate.add(gajur);
    }

    staticGroup.add(gate);
  };

  buildGatehouse(0, hs, 0, true);
  buildGatehouse(hs, 0, Math.PI * 0.5, false);
  buildGatehouse(0, -hs, Math.PI, false);

  // =========================================================================
  // 4. OUTER 3-STORY NEWARI-TIBETAN KORA HOUSES & THANGKA STALLS
  // =========================================================================
  const houseSpecs: Array<[number, number, number, number, number, number, number]> = [
    [-46.0, -28.0, 10.6, 17.6, 3, Math.PI * 0.5, 0xead8be],
    [-46.0, 0.0, 10.6, 17.6, 3, Math.PI * 0.5, 0xd8875a],
    [-46.0, 28.0, 10.6, 17.6, 3, Math.PI * 0.5, 0xead8be],
    [-33.0, 46.5, 16.6, 9.6, 3, 0, 0xe2c79d],
    [33.0, 46.5, 16.6, 9.6, 3, 0, 0xc76b4c],
    [46.0, -28.0, 10.6, 17.6, 3, -Math.PI * 0.5, 0xe8d9bf],
    [46.0, 28.0, 10.6, 17.6, 3, -Math.PI * 0.5, 0xd58a5e],
    [-34.0, -45.0, 14.6, 9.6, 3, Math.PI, 0xe5d3b5],
    [34.0, -45.0, 14.6, 9.6, 3, Math.PI, 0xc87050],
  ];
  for (const [hx, hz, w, d, stories, ry, colorHex] of houseSpecs) {
    const house = buildNewariKoraHouse(w, d, stories, mats, colorHex);
    house.position.set(hx, c.plazaY, hz);
    house.rotation.y = ry;
    staticGroup.add(house);
  }

  // Four Thangka & Singing-Bowl Merchant Stalls along the Kora diagonals
  for (const [sx, sz] of [
    [-33.5, 21.5],
    [33.5, 21.5],
    [-33.5, -21.5],
    [33.5, -21.5],
  ] as Array<[number, number]>) {
    const stall = new THREE.Group();
    stall.position.set(sx, c.plazaY, sz);
    stall.rotation.y = Math.atan2(-sx, -sz);
    const counter = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.92, 1.35), mats.deepTeakWoodMat);
    counter.position.y = 0.46;
    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 0.14, 2.2),
      mats.valanceClothMat,
    );
    canopy.position.set(0, 2.55, 0.25);
    canopy.rotation.x = 0.18;
    for (const px of [-1.95, 1.95]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.5, 0.14), mats.tibetanVermilionWoodMat);
      post.position.set(px, 1.25, -0.55);
      stall.add(post);
    }
    const thangka = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.65), mats.thangkaArtMat);
    thangka.position.set(-0.9, 1.72, -0.45);
    const bowl1 = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.14, 0.16, 14), mats.gildedCopperMat);
    bowl1.position.set(0.65, 1.0, 0.15);
    const bowl2 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.10, 0.13, 14), mats.prayerWheelBrassMat);
    bowl2.position.set(1.2, 0.99, 0.15);
    stall.add(counter, canopy, thangka, bowl1, bowl2);
    staticGroup.add(stall);
  }

  // =========================================================================
  // 5. AJIMA (HARITI) TWO-TIER PAGODA SHRINE (OFF-AXIS -14.5, +34.5)
  // =========================================================================
  const ajima = new THREE.Group();
  ajima.position.set(c.ajimaLocalX, c.plazaY, c.ajimaLocalZ);
  const aBase = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.65, 5.2), mats.mossyCarvedStoneMat);
  aBase.position.y = 0.325;
  aBase.receiveShadow = true;
  const aSanctum = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.75, 3.5), mats.dachiBrickMat);
  aSanctum.position.y = 2.02;
  aSanctum.castShadow = true;
  const aRoof1 = new THREE.Mesh(new THREE.ConeGeometry(3.85, 1.35, 4), mats.gildedCopperMat);
  aRoof1.rotation.y = Math.PI * 0.25;
  aRoof1.position.y = 4.02;
  aRoof1.castShadow = true;
  const aUpper = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.45, 2.35), mats.tibetanVermilionWoodMat);
  aUpper.position.y = 4.9;
  const aRoof2 = new THREE.Mesh(new THREE.ConeGeometry(2.75, 1.25, 4), mats.gildedCopperMat);
  aRoof2.rotation.y = Math.PI * 0.25;
  aRoof2.position.y = 6.15;
  const aGajur = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.92, 10), mats.gildedCopperMat);
  aGajur.position.y = 7.15;
  // Front brass lamp stand & glowing incense bowl
  const aLampStand = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.85, 12), mats.prayerWheelBrassMat);
  aLampStand.position.set(0, 0.85, 2.7);
  const aFlame = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), mats.butterFlameMat);
  aFlame.position.set(0, 1.38, 2.7);
  aFlame.userData.noMerge = true;
  ajima.add(aBase, aSanctum, aRoof1, aUpper, aRoof2, aGajur, aLampStand);
  staticGroup.add(ajima);
  aFlame.position.set(c.ajimaLocalX, c.plazaY + 1.38, c.ajimaLocalZ + 2.7);
  dynamicGroup.add(aFlame);

  const ajimaBell = buildTempleBellGroup(mats.gildedCopperMat, mats.deepTeakWoodMat);
  ajimaBell.position.set(c.ajimaLocalX + 2.6, c.plazaY + 0.55, c.ajimaLocalZ + 2.2);
  dynamicGroup.add(ajimaBell);
  templeBells.push(ajimaBell);

  const ajimaHitTarget = new THREE.Mesh(
    new THREE.SphereGeometry(1.4, 8, 8),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  ajimaHitTarget.position.set(c.ajimaLocalX, c.plazaY + 1.4, c.ajimaLocalZ + 2.7);
  ajimaHitTarget.userData.noMerge = true;
  ajimaHitTarget.userData.nonCollidable = true;
  dynamicGroup.add(ajimaHitTarget);

  // =========================================================================
  // 6. WALKABLE NORTHERN TIBETAN MONASTERY (GOMPA) AT Z = -43.5
  // =========================================================================
  const gompa = new THREE.Group();
  const gz = c.gompaCenterZ;
  const gHalfX = c.gompaHalfX; // 11.5m -> width 23m, depth 16m (-51.5..-35.5)
  const gFloorY = c.gompaFloorY; // 0.55m

  // Raised wooden-and-granite hall floor
  const gDeck = new THREE.Mesh(new THREE.BoxGeometry(gHalfX * 2, 0.42, 16.0), mats.monasteryFloorMat);
  gDeck.position.set(0, gFloorY - 0.21, gz);
  gDeck.receiveShadow = true;
  gompa.add(gDeck);

  // South approach stairs leading smoothly up from plazaY (0.35) to gompaFloorY (0.55)
  for (let s = 0; s < 3; s++) {
    const t = (s + 1) / 3;
    const tread = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.08, 0.72), mats.graniteFlagstoneMat);
    tread.position.set(0, c.plazaY + (gFloorY - c.plazaY) * t - 0.04, c.gompaMaxZ + 2.2 - s * 0.72);
    tread.receiveShadow = true;
    gompa.add(tread);
  }

  // Hollow monastery walls (open South doorway |lx| <= 2.15)
  const wallH = 6.2;
  const wallThick = 0.75;
  const northWall = new THREE.Mesh(
    new THREE.BoxGeometry(gHalfX * 2, wallH, wallThick),
    mats.dachiBrickMat,
  );
  northWall.position.set(0, gFloorY + wallH * 0.5, c.gompaMinZ + wallThick * 0.5);
  northWall.castShadow = true;
  northWall.receiveShadow = true;
  gompa.add(northWall);

  for (const sx of [-gHalfX + wallThick * 0.5, gHalfX - wallThick * 0.5]) {
    const sideWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThick, wallH, 16.0),
      mats.dachiBrickMat,
    );
    sideWall.position.set(sx, gFloorY + wallH * 0.5, gz);
    sideWall.castShadow = true;
    sideWall.receiveShadow = true;
    gompa.add(sideWall);
  }

  // South front walls flanking open 4.3m doorway + carved doorway arch lintel
  const frontWingW = gHalfX - c.gompaDoorHalfX;
  for (const dir of [-1, 1]) {
    const wing = new THREE.Mesh(
      new THREE.BoxGeometry(frontWingW, wallH, wallThick),
      mats.dachiBrickMat,
    );
    wing.position.set(
      dir * (c.gompaDoorHalfX + frontWingW * 0.5),
      gFloorY + wallH * 0.5,
      c.gompaMaxZ - wallThick * 0.5,
    );
    wing.castShadow = true;
    wing.receiveShadow = true;
    gompa.add(wing);
  }
  const doorHeader = new THREE.Mesh(
    new THREE.BoxGeometry(c.gompaDoorHalfX * 2 + 0.8, 1.85, wallThick + 0.16),
    mats.tibetanVermilionWoodMat,
  );
  doorHeader.position.set(0, gFloorY + wallH - 0.92, c.gompaMaxZ - wallThick * 0.5);
  gompa.add(doorHeader);

  // Two-tier Golden & Crimson Tibetan Gompa Roof overhead (no ceiling drop occlusion)
  const gRoof1 = new THREE.Mesh(new THREE.BoxGeometry(gHalfX * 2 + 1.8, 0.48, 17.6), mats.tibetanVermilionWoodMat);
  gRoof1.position.set(0, gFloorY + wallH + 0.24, gz);
  const gUpper = new THREE.Mesh(new THREE.BoxGeometry(15.0, 2.2, 10.0), mats.whiteStuccoMat);
  gUpper.position.set(0, gFloorY + wallH + 1.5, gz);
  const gRoof2 = new THREE.Mesh(new THREE.ConeGeometry(9.2, 2.4, 4), mats.gildedCopperMat);
  gRoof2.rotation.y = Math.PI * 0.25;
  gRoof2.scale.set(1.3, 1.0, 0.85);
  gRoof2.position.set(0, gFloorY + wallH + 3.6, gz);
  gRoof2.castShadow = true;
  // Dharmachakra & Twin Deer crest on Gompa rooftop
  const dharmaWheel = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.10, 8, 20), mats.gildedCopperMat);
  dharmaWheel.position.set(0, gFloorY + wallH + 1.55, c.gompaMaxZ + 0.1);
  gompa.add(gRoof1, gUpper, gRoof2, dharmaWheel);

  // Interior Red-and-Gold Lacquer Columns + Silk Thangkas
  for (const px of [-4.6, 4.6]) {
    for (const pz of [-40.5, -45.5]) {
      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.36, wallH, 12),
        mats.tibetanVermilionWoodMat,
      );
      col.position.set(px, gFloorY + wallH * 0.5, pz);
      col.castShadow = true;
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.32, 0.95), mats.gildedCopperMat);
      cap.position.set(px, gFloorY + wallH - 0.16, pz);
      const thangka = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 1.55), mats.thangkaArtMat);
      thangka.position.set(px, gFloorY + 3.2, pz + 0.38);
      gompa.add(col, cap, thangka);
    }
  }

  // Crimson Monk Cushion Rows along West Wing
  for (let row = 0; row < 4; row++) {
    const cz = -48.0 + row * 2.4;
    const bench = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.28, 1.4), mats.crimsonCushionMat);
    bench.position.set(-8.6, gFloorY + 0.14, cz);
    gompa.add(bench);
  }

  // Towering Shakyamuni & Guru Rinpoche Golden Altar at Back North Wall
  const altarPlinth = new THREE.Mesh(new THREE.BoxGeometry(8.2, 1.15, 2.6), mats.tibetanVermilionWoodMat);
  altarPlinth.position.set(0, gFloorY + 0.575, -49.2);
  gompa.add(altarPlinth);

  const buildAltarBuddha = (bx: number, scale: number) => {
    const fig = new THREE.Group();
    const lotus = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.62, 0.38, 14), mats.crimsonCushionMat);
    lotus.position.y = 0.19;
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.68, 1.35, 12), mats.buddhaGoldMat);
    torso.position.y = 1.02;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), mats.buddhaGoldMat);
    head.position.y = 1.94;
    const ushnisha = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), mats.buddhaGoldMat);
    ushnisha.position.y = 2.26;
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.07, 8, 24), mats.gildedCopperMat);
    halo.position.set(0, 1.55, -0.25);
    fig.add(lotus, torso, head, ushnisha, halo);
    fig.scale.setScalar(scale);
    fig.position.set(bx, gFloorY + 1.15, -49.4);
    gompa.add(fig);
  };
  buildAltarBuddha(0, 1.38); // Center Shakyamuni Buddha
  buildAltarBuddha(-2.4, 0.96); // Guru Rinpoche (Padmasambhava)
  buildAltarBuddha(2.4, 0.96); // Chenrezig (Avalokiteshvara)

  // Ceremonial Bronze Singing Bowl Table in front of Main Altar
  const bowlTable = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.78, 1.05), mats.deepTeakWoodMat);
  bowlTable.position.set(0, gFloorY + 0.39, -46.8);
  const singingBowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.24, 0.26, 18),
    mats.gildedCopperMat,
  );
  singingBowl.position.set(0, gFloorY + 0.91, -46.8);
  const striker = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.05, 0.42, 8),
    mats.deepTeakWoodMat,
  );
  striker.rotation.z = Math.PI * 0.42;
  striker.position.set(0.48, gFloorY + 0.84, -46.6);
  gompa.add(bowlTable, singingBowl, striker);
  staticGroup.add(gompa);

  // Giant Floor-to-Ceiling Spinning Monastery Prayer Wheel in East Wing (+7.6, -43.0)
  const giantWheelGroup = new THREE.Group();
  giantWheelGroup.position.set(7.6, gFloorY, -43.0);
  giantWheelGroup.userData.noMerge = true;
  giantWheelGroup.userData.prayerWheel = { angle: 0, velocity: 0.32 };
  const gwPedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.2, 0.45, 16), mats.mossyCarvedStoneMat);
  gwPedestal.position.y = 0.225;
  const gwDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 3.6, 20), mats.prayerWheelBrassMat);
  gwDrum.position.y = 2.25;
  const gwCap = new THREE.Mesh(new THREE.ConeGeometry(0.98, 0.95, 16), mats.gildedCopperMat);
  gwCap.position.y = 4.52;
  giantWheelGroup.add(gwPedestal, gwDrum, gwCap);
  dynamicGroup.add(giantWheelGroup);
  prayerWheelSpinners.push(giantWheelGroup);

  // 108 Flickering Butter Lamps in 3 brass racks along the Altar shelf (InstancedMesh!)
  const lampCount = 108;
  const lampCupsInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.055, 0.032, 0.08, 8),
    mats.prayerWheelBrassMat,
    lampCount,
  );
  const lampFlamesInst = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.042, 6, 6),
    mats.butterFlameMat,
    lampCount,
  );
  lampCupsInst.userData.noMerge = true;
  lampFlamesInst.userData.noMerge = true;
  const flameOrigins: Array<{ x: number; y: number; z: number; phase: number }> = [];
  for (let i = 0; i < lampCount; i++) {
    const row = Math.floor(i / 36);
    const col = i % 36;
    const lx = -4.2 + (col / 35) * 8.4;
    const ly = gFloorY + 0.94 + row * 0.16;
    const lz = -47.9 - row * 0.16;
    dummy.position.set(lx, ly, lz);
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    lampCupsInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(lx, ly + 0.06, lz);
    dummy.scale.set(0.85, 1.45, 0.85);
    dummy.updateMatrix();
    lampFlamesInst.setMatrixAt(i, dummy.matrix);
    flameOrigins.push({ x: lx, y: ly + 0.06, z: lz, phase: i * 0.37 });
  }
  lampCupsInst.instanceMatrix.needsUpdate = true;
  lampFlamesInst.instanceMatrix.needsUpdate = true;
  lampCupsInst.computeBoundingSphere();
  lampFlamesInst.computeBoundingSphere();
  dynamicGroup.add(lampCupsInst, lampFlamesInst);

  const gompaLight = new THREE.PointLight(0xffaa44, 7.5, 22, 1.7);
  gompaLight.position.set(0, gFloorY + 3.4, -46.8);
  beaconLights.push(gompaLight);
  dynamicGroup.add(gompaLight);

  let bowlBoostUntil = -10;
  const triggerGompaBlessing = () => {
    bowlBoostUntil = performance.now() / 1000 + 6.5;
    const pw = giantWheelGroup.userData.prayerWheel as { velocity: number };
    if (pw) pw.velocity = 14.0;
  };
  const triggerAjimaOffering = () => {
    bowlBoostUntil = performance.now() / 1000 + 4.5;
  };

  // Smooth flickering animation controller for all 108 monastery butter lamps
  const flameAnimNode = new THREE.Object3D();
  flameAnimNode.userData.noMerge = true;
  flameAnimNode.userData.onFlickerUpdate = (elapsed: number, lanternIntensity: number) => {
    const nowSec = performance.now() / 1000;
    const boosted = nowSec < bowlBoostUntil ? 1.55 : 1.0;
    gompaLight.intensity = (6.8 + Math.sin(elapsed * 5.2) * 0.8) * boosted * Math.max(0.85, lanternIntensity);
    for (let i = 0; i < lampCount; i++) {
      const f = flameOrigins[i];
      const fPulse = 0.82 + 0.28 * Math.sin(elapsed * 8.4 + f.phase);
      dummy.position.set(f.x, f.y, f.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(0.85 * fPulse, (1.35 + fPulse * 0.4) * boosted, 0.85 * fPulse);
      dummy.updateMatrix();
      lampFlamesInst.setMatrixAt(i, dummy.matrix);
    }
    lampFlamesInst.instanceMatrix.needsUpdate = true;
  };
  dynamicGroup.add(flameAnimNode);
  animatedNodes.push(flameAnimNode);

  const gompaBowlHitTarget = new THREE.Mesh(
    new THREE.SphereGeometry(1.35, 8, 8),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  gompaBowlHitTarget.position.set(0, gFloorY + 1.05, -46.8);
  gompaBowlHitTarget.userData.noMerge = true;
  gompaBowlHitTarget.userData.nonCollidable = true;
  dynamicGroup.add(gompaBowlHitTarget);

  return {
    staticGroup,
    dynamicGroup,
    beaconLights,
    animatedNodes,
    templeBells,
    prayerWheelSpinners,
    gompaBowlHitTarget,
    ajimaHitTarget,
    triggerGompaBlessing,
    triggerAjimaOffering,
  };
}

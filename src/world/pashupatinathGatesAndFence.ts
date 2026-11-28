import * as THREE from 'three';
import { mergeStaticMeshesByMaterial } from './meshOptimization';
import { PASHUPATI_COMPLEX } from './pashupatinathData';
import { PashupatinathPbrMaterials } from './pashupatinathTextures';

export interface PashupatinathGatesBuild {
  group: THREE.Group;
  beaconLights: THREE.PointLight[];
  templeBells: THREE.Group[];
}

function buildSimhaLion(stoneMat: THREE.Material, goldMat: THREE.Material): THREE.Group {
  const lion = new THREE.Group();
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.72, 1.45), stoneMat);
  plinth.position.y = 0.36;
  plinth.castShadow = true;
  const plinthTrim = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.14, 1.58), stoneMat);
  plinthTrim.position.y = 0.76;

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.78, 1.05), stoneMat);
  torso.position.set(0, 1.24, -0.08);
  torso.rotation.x = -0.35;
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), stoneMat);
  chest.position.set(0, 1.55, 0.25);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), stoneMat);
  head.position.set(0, 1.92, 0.34);
  const mane = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42, 0), stoneMat);
  mane.scale.set(1.12, 1.05, 0.85);
  mane.position.set(0, 1.88, 0.22);
  const crown = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.28, 6), goldMat);
  crown.position.set(0, 2.28, 0.34);
  for (const sx of [-0.26, 0.26]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.72, 8), stoneMat);
    leg.position.set(sx, 1.18, 0.36);
    lion.add(leg);
  }
  lion.add(plinth, plinthTrim, torso, chest, head, mane, crown);
  return lion;
}

function buildStoneDeepstambha(stoneMat: THREE.Material, goldMat: THREE.Material, flameMat: THREE.Material, height = 4.2): THREE.Group {
  const col = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.65, 1.05), stoneMat);
  base.position.y = 0.325;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, height - 1.1, 10), stoneMat);
  shaft.position.y = 0.65 + (height - 1.1) * 0.5;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.24, 0.28, 12), goldMat);
  cap.position.y = height - 0.32;
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), flameMat);
  flame.scale.set(0.85, 1.6, 0.85);
  flame.position.y = height - 0.05;
  col.add(base, shaft, cap, flame);
  return col;
}

function buildCornerPavilion(mats: PashupatinathPbrMaterials): THREE.Group {
  const pav = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.15, 3.8), mats.dachiAppaBrickMat);
  base.position.y = 0.175;
  base.castShadow = true;
  pav.add(base);

  for (const sx of [-1.45, 1.45]) {
    for (const sz of [-1.45, 1.45]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.75, 0.24), mats.carvedSalWoodMat);
      post.position.set(sx, 2.12, sz);
      post.castShadow = true;
      pav.add(post);
    }
  }
  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.15, 1.55, 4), mats.jhingatiTileMat);
  roof.rotation.y = Math.PI * 0.25;
  roof.position.y = 4.25;
  roof.castShadow = true;
  const finial = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.75, 10), mats.gildedTrimMat);
  finial.position.y = 5.35;
  pav.add(roof, finial);
  return pav;
}

/**
 * Builds the 108m x 124m Perimeter Fencing (matching Lumbini & Janaki), 4 Corner Pavilions,
 * Monumental Western Entrance Gatehouse (Paschim Dwar) with Guardian Lions, Torana, Jutta Ghar & UNESCO Signboard,
 * and North / South Arched Dachi Appa Portals.
 */
export function buildPashupatinathGatesAndFence(
  mats: PashupatinathPbrMaterials,
): PashupatinathGatesBuild {
  const c = PASHUPATI_COMPLEX;
  const group = new THREE.Group();
  group.name = 'PashupatinathGatesAndFence';

  const beaconLights: THREE.PointLight[] = [];
  const templeBells: THREE.Group[] = [];

  const diyoFlameMat = new THREE.MeshStandardMaterial({
    color: 0xffe49c,
    emissive: 0xf59e0b,
    emissiveIntensity: 2.9,
    roughness: 0.2,
  });

  // Precinct local half extents: X in [-54..+54], Z in [-62..+62]
  const halfX = 54.0;
  const halfZ = 62.0;

  // =========================================================================
  // 1. INSTANCED PERIMETER FENCE (West, North, South; East open along Bagmati ghats)
  // =========================================================================
  const pillarPositions: Array<{ x: number; z: number }> = [];
  const wallSegments: Array<{ x: number; z: number; len: number; rotY: number }> = [];
  const picketPositions: Array<{ x: number; z: number; rotY: number }> = [];
  const medallionPositions: Array<{ x: number; z: number; rotY: number }> = [];

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

    const spanParts: Array<[number, number]> = [
      [0, gapMin],
      [gapMax, totalLen],
    ];
    for (const [s0, s1] of spanParts) {
      const span = s1 - s0;
      if (span < 1.2) continue;
      const mid = (s0 + s1) * 0.5;
      wallSegments.push({
        x: x1 + dirX * mid,
        z: z1 + dirZ * mid,
        len: span,
        rotY,
      });

      const bayCount = Math.max(1, Math.round(span / 4.5));
      for (let b = 0; b <= bayCount; b++) {
        const d = s0 + (b / bayCount) * span;
        pillarPositions.push({ x: x1 + dirX * d, z: z1 + dirZ * d });
        if (b < bayCount) {
          const b0 = d;
          const b1 = s0 + ((b + 1) / bayCount) * span;
          const bMid = (b0 + b1) * 0.5;
          medallionPositions.push({
            x: x1 + dirX * bMid,
            z: z1 + dirZ * bMid,
            rotY,
          });
          const picketCount = 12;
          for (let p = 1; p < picketCount; p++) {
            const pd = b0 + (p / picketCount) * (b1 - b0);
            picketPositions.push({
              x: x1 + dirX * pd,
              z: z1 + dirZ * pd,
              rotY,
            });
          }
        }
      }
    }
  };

  // West boundary (x = -54, z: -62..+62, gatehouse gap in [-5.8..+5.8] -> 56.2..67.8 along 124m)
  addFenceRun(-halfX, -halfZ, -halfX, halfZ, 56.2, 67.8, false);
  // North boundary (z = -62, x: -54..+54, gate gap in [-3.4..+3.4] -> 50.6..57.4 along 108m)
  addFenceRun(-halfX, -halfZ, halfX, -halfZ, 50.6, 57.4, true);
  // South boundary (z = +62, x: -54..+54, gate gap in [-3.4..+3.4] -> 50.6..57.4 along 108m)
  addFenceRun(-halfX, halfZ, halfX, halfZ, 50.6, 57.4, true);

  // Build dwarf red-brick wall + sandstone coping
  for (const seg of wallSegments) {
    const brickWall = new THREE.Mesh(
      new THREE.BoxGeometry(seg.len, 0.65, 0.45),
      mats.dachiAppaBrickMat,
    );
    brickWall.position.set(seg.x, c.courtyardY + 0.325, seg.z);
    brickWall.rotation.y = seg.rotY;
    brickWall.castShadow = true;
    brickWall.receiveShadow = true;

    const coping = new THREE.Mesh(
      new THREE.BoxGeometry(seg.len + 0.08, 0.12, 0.54),
      mats.sandstoneCopingMat,
    );
    coping.position.set(seg.x, c.courtyardY + 0.71, seg.z);
    coping.rotation.y = seg.rotY;
    group.add(brickWall, coping);

    // Top & bottom iron rails spanning the wall
    for (const ry of [c.courtyardY + 0.96, c.courtyardY + 2.15]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(seg.len, 0.06, 0.06), mats.wroughtIronMat);
      rail.position.set(seg.x, ry, seg.z);
      rail.rotation.y = seg.rotY;
      group.add(rail);
    }
  }

  // Instanced White-Plastered Pillars (2.6m tall) + Tiered Terracotta & Gold Pagoda Finials
  const dummy = new THREE.Object3D();
  const pillarGeo = new THREE.BoxGeometry(0.48, 2.6, 0.48);
  const pillarInst = new THREE.InstancedMesh(pillarGeo, mats.whitePlasterMat, pillarPositions.length);
  pillarInst.castShadow = true;
  const capRoofGeo = new THREE.ConeGeometry(0.42, 0.36, 4);
  const capRoofInst = new THREE.InstancedMesh(capRoofGeo, mats.jhingatiTileMat, pillarPositions.length);
  const capGoldGeo = new THREE.ConeGeometry(0.11, 0.34, 8);
  const capGoldInst = new THREE.InstancedMesh(capGoldGeo, mats.gildedTrimMat, pillarPositions.length);

  for (let i = 0; i < pillarPositions.length; i++) {
    const p = pillarPositions[i];
    dummy.position.set(p.x, c.courtyardY + 1.3, p.z);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    pillarInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(p.x, c.courtyardY + 2.78, p.z);
    dummy.rotation.set(0, Math.PI * 0.25, 0);
    dummy.updateMatrix();
    capRoofInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(p.x, c.courtyardY + 3.08, p.z);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    capGoldInst.setMatrixAt(i, dummy.matrix);
  }
  pillarInst.instanceMatrix.needsUpdate = true;
  capRoofInst.instanceMatrix.needsUpdate = true;
  capGoldInst.instanceMatrix.needsUpdate = true;
  group.add(pillarInst, capRoofInst, capGoldInst);

  // Instanced Black Wrought-Iron Vertical Pickets
  const picketGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.48, 6);
  const picketInst = new THREE.InstancedMesh(picketGeo, mats.wroughtIronMat, picketPositions.length);
  for (let i = 0; i < picketPositions.length; i++) {
    const pk = picketPositions[i];
    dummy.position.set(pk.x, c.courtyardY + 1.56, pk.z);
    dummy.rotation.set(0, pk.rotY, 0);
    dummy.updateMatrix();
    picketInst.setMatrixAt(i, dummy.matrix);
  }
  picketInst.instanceMatrix.needsUpdate = true;
  group.add(picketInst);

  // Instanced Gilded Circular Trishul & Damaru Medallions centered in each bay
  const medRingGeo = new THREE.TorusGeometry(0.28, 0.04, 6, 16);
  const medRingInst = new THREE.InstancedMesh(medRingGeo, mats.gildedTrimMat, medallionPositions.length);
  const medTrishulGeo = new THREE.BoxGeometry(0.05, 0.42, 0.05);
  const medTrishulInst = new THREE.InstancedMesh(medTrishulGeo, mats.gildedTrimMat, medallionPositions.length);
  for (let i = 0; i < medallionPositions.length; i++) {
    const m = medallionPositions[i];
    dummy.position.set(m.x, c.courtyardY + 1.56, m.z);
    dummy.rotation.set(0, m.rotY, 0);
    dummy.updateMatrix();
    medRingInst.setMatrixAt(i, dummy.matrix);
    medTrishulInst.setMatrixAt(i, dummy.matrix);
  }
  medRingInst.instanceMatrix.needsUpdate = true;
  medTrishulInst.instanceMatrix.needsUpdate = true;
  group.add(medRingInst, medTrishulInst);

  // 4 Corner Pavilions
  for (const [cx, cz] of [
    [-halfX, -halfZ],
    [-halfX, halfZ],
    [halfX, -halfZ],
    [halfX, halfZ],
  ] as Array<[number, number]>) {
    const pav = buildCornerPavilion(mats);
    pav.position.set(cx, c.courtyardY, cz);
    group.add(pav);
  }

  // Bagmati Overlook Red-and-White Crenellated Parapet is built cleanly in pashupatinathBagmati.ts
  // with aligned openings at Aryaghat/Surya Ghat stairs and the Aarati/Bridge terrace.

  // =========================================================================
  // 2. MONUMENTAL WESTERN ENTRANCE GATE (PASCHIM DWAR — 11m x 8.5m)
  // =========================================================================
  const westGate = new THREE.Group();
  westGate.position.set(-halfX, c.courtyardY, 0);
  group.add(westGate);

  // Side Gatehouse Masonry Bays framing the wide 5.2m walkable central portal (z in [-2.6..+2.6])
  for (const sz of [-1, 1]) {
    const sideBay = new THREE.Mesh(new THREE.BoxGeometry(3.8, 5.4, 3.2), mats.dachiAppaBrickMat);
    sideBay.position.set(0, 2.7, sz * 4.2);
    sideBay.castShadow = true;
    sideBay.receiveShadow = true;
    westGate.add(sideBay);

    // Cream polychrome temple bay facade panel (inspired by photo image_ddb68ca7)
    const creamPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 4.4, 2.35),
      mats.creamPolychromeMat,
    );
    creamPanel.position.set(-1.92, 2.4, sz * 4.2);
    const latticeWin = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 1.55, 1.35),
      mats.wroughtIronMat,
    );
    latticeWin.position.set(-2.0, 2.8, sz * 4.2);
    const winFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 1.72, 1.52),
      mats.carvedSalWoodMat,
    );
    winFrame.position.set(-1.97, 2.8, sz * 4.2);
    westGate.add(creamPanel, winFrame, latticeWin);

    // Carved Tikijhya diagonal/vertical wooden lattice bars across side windows
    for (let m = -2; m <= 2; m++) {
      const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.48, 0.06), mats.carvedSalWoodMat);
      vBar.position.set(-2.07, 2.8, sz * 4.2 + m * 0.24);
      westGate.add(vBar);
    }
    for (let r = -1; r <= 1; r++) {
      const hBar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 1.28), mats.carvedSalWoodMat);
      hBar.position.set(-2.07, 2.8 + r * 0.36, sz * 4.2);
      westGate.add(hBar);
    }

    // Gatehouse flanking columns
    const col = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.28, 5.2, 10),
      mats.blackBasaltMat,
    );
    col.position.set(-1.95, 2.6, sz * 2.78);
    westGate.add(col);
  }

  // Central Portal Overhead Lintel & Shiva Polychrome Mural Gable + Carved Gilded Torana
  const portalHeader = new THREE.Mesh(new THREE.BoxGeometry(3.9, 2.4, 5.6), mats.dachiAppaBrickMat);
  portalHeader.position.set(0, 5.65, 0);
  portalHeader.castShadow = true;
  westGate.add(portalHeader);

  // Dark forest-green & gilded temple header plaque between Torana and Shiva Mural
  const headerPlaque = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.42, 4.6),
    mats.belLeafMat,
  );
  headerPlaque.position.set(-2.02, 4.48, 0);
  const headerGoldTrim = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.08, 4.72),
    mats.gildedTrimMat,
  );
  headerGoldTrim.position.set(-2.03, 4.68, 0);
  westGate.add(headerPlaque, headerGoldTrim);

  // Shiva Mural Frame facing West approaching visitors
  const muralBacking = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 2.05, 2.65),
    mats.creamPolychromeMat,
  );
  muralBacking.position.set(-1.96, 5.78, 0);
  const muralFace = new THREE.Mesh(new THREE.PlaneGeometry(2.35, 1.75), mats.shivaMuralMat);
  muralFace.rotation.y = -Math.PI * 0.5;
  muralFace.position.set(-2.09, 5.78, 0);
  westGate.add(muralBacking, muralFace);

  // Gilded Carved Torana (Chepu & Makaras) over central portal opening
  const torana = new THREE.Group();
  torana.rotation.y = -Math.PI * 0.5;
  torana.position.set(-2.06, 3.88, 0);
  const tBeam = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.3, 0.24), mats.gildedTrimMat);
  const tArch = new THREE.Mesh(
    new THREE.CylinderGeometry(2.05, 2.15, 0.16, 22, 1, false, 0, Math.PI),
    mats.toranaGildedMat,
  );
  tArch.rotation.z = Math.PI * 0.5;
  tArch.rotation.y = Math.PI * 0.5;
  tArch.position.y = 0.14;
  const tOuterRim = new THREE.Mesh(
    new THREE.TorusGeometry(2.12, 0.14, 10, 24, Math.PI),
    mats.gildedTrimMat,
  );
  tOuterRim.position.set(0, 0.14, 0.04);
  const tInnerRim = new THREE.Mesh(
    new THREE.TorusGeometry(1.42, 0.08, 8, 20, Math.PI),
    mats.gildedTrimMat,
  );
  tInnerRim.position.set(0, 0.14, 0.07);
  const chepu = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 1), mats.gildedTrimMat);
  chepu.scale.set(1.15, 0.88, 0.55);
  chepu.position.set(0, 1.62, 0.12);
  torana.add(tBeam, tArch, tOuterRim, tInnerRim, chepu);
  westGate.add(torana);

  // Sweeping Jhingati Clay-Tile Pagoda Roof (11.8m wide) + Golden Gajur & Hanging Wind Bells
  const gateRoof = new THREE.Mesh(
    new THREE.BoxGeometry(5.6, 0.24, 12.2),
    mats.carvedSalWoodMat,
  );
  gateRoof.position.set(0, 6.85, 0);
  const slopedRoof = new THREE.Mesh(
    new THREE.ConeGeometry(7.2, 2.1, 4),
    mats.jhingatiTileMat,
  );
  slopedRoof.scale.set(0.68, 1.0, 1.32);
  slopedRoof.rotation.y = Math.PI * 0.25;
  slopedRoof.position.set(0, 7.9, 0);
  slopedRoof.castShadow = true;
  const gateGajur = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.35, 12), mats.gildedTrimMat);
  gateGajur.position.set(0, 9.45, 0);
  westGate.add(gateRoof, slopedRoof, gateGajur);

  for (const bz of [-4.2, -1.6, 1.6, 4.2]) {
    const eaveBell = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.34, 8), mats.agedBronzeMat);
    eaveBell.position.set(-2.65, 6.58, bz);
    westGate.add(eaveBell);
  }

  // Gate Lantern Lights
  for (const lz of [-2.4, 2.4]) {
    const gLight = new THREE.PointLight(0xffb858, 2.4, 16, 1.6);
    gLight.position.set(-2.6, 4.2, lz);
    gLight.userData.warmFlicker = true;
    gLight.userData.flickerAmp = 0.08;
    gLight.userData.intensityScale = 1.6;
    westGate.add(gLight);
    beaconLights.push(gLight);
  }

  // Flanking Stone Guardian Lions (Simha) & Stone Deepstambha Oil-Lamp Pillars outside Paschim Dwar
  for (const sz of [-1, 1]) {
    const simha = buildSimhaLion(mats.granitePlinthMat, mats.gildedTrimMat);
    simha.position.set(-3.2, 0, sz * 4.0);
    simha.rotation.y = -Math.PI * 0.5;
    westGate.add(simha);

    const stambha = buildStoneDeepstambha(mats.granitePlinthMat, mats.gildedTrimMat, diyoFlameMat, 4.4);
    stambha.position.set(-4.5, 0, sz * 5.4);
    westGate.add(stambha);
  }

  // Ornate Dark-and-Gold UNESCO Heritage Signboard near Paschim Dwar
  const signGroup = new THREE.Group();
  signGroup.position.set(-5.5, 0, -8.0);
  signGroup.rotation.y = -Math.PI * 0.36;
  const signBase = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.35, 0.72), mats.granitePlinthMat);
  signBase.position.y = 0.175;
  for (const sx of [-1.55, 1.55]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.65, 0.18), mats.gildedTrimMat);
    post.position.set(sx, 1.48, 0);
    signGroup.add(post);
  }
  const boardFrame = new THREE.Mesh(new THREE.BoxGeometry(3.25, 1.68, 0.14), mats.gildedTrimMat);
  boardFrame.position.y = 2.05;
  const boardFace = new THREE.Mesh(new THREE.PlaneGeometry(3.05, 1.48), mats.signboardMat);
  boardFace.position.set(0, 2.05, 0.08);
  const boardBack = new THREE.Mesh(new THREE.PlaneGeometry(3.05, 1.48), mats.signboardMat);
  boardBack.rotation.y = Math.PI;
  boardBack.position.set(0, 2.05, -0.08);
  signGroup.add(signBase, boardFrame, boardFace, boardBack);
  westGate.add(signGroup);

  // Traditional Timber-and-Brick Shoe-Keeping Pavilion (Jutta Ghar) just outside Western Gate
  const jutta = new THREE.Group();
  jutta.position.set(-8.5, 0, 10.5);
  const jPlinth = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.42, 4.0), mats.dachiAppaBrickMat);
  jPlinth.position.y = 0.21;
  jPlinth.receiveShadow = true;
  jutta.add(jPlinth);
  for (const jx of [-2.4, 0, 2.4]) {
    for (const jz of [-1.55, 1.55]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.55, 0.2), mats.carvedSalWoodMat);
      post.position.set(jx, 1.68, jz);
      post.castShadow = true;
      jutta.add(post);
    }
  }
  const jRack = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.35, 0.55), mats.salLatticeMat);
  jRack.position.set(0, 1.1, 0);
  const jRoof = new THREE.Mesh(new THREE.ConeGeometry(4.4, 1.45, 4), mats.jhingatiTileMat);
  jRoof.scale.set(1.15, 1.0, 0.85);
  jRoof.rotation.y = Math.PI * 0.25;
  jRoof.position.y = 3.55;
  jRoof.castShadow = true;
  jutta.add(jRack, jRoof);
  westGate.add(jutta);

  // =========================================================================
  // 3. NORTH & SOUTH SECONDARY ARCHED DACHI APPA GATES
  // =========================================================================
  for (const [gz, dirSign] of [
    [-halfZ, -1],
    [halfZ, 1],
  ] as Array<[number, number]>) {
    const nsGate = new THREE.Group();
    nsGate.position.set(0, c.courtyardY, gz);
    for (const sx of [-1, 1]) {
      const pier = new THREE.Mesh(new THREE.BoxGeometry(2.1, 4.4, 1.85), mats.dachiAppaBrickMat);
      pier.position.set(sx * 3.35, 2.2, 0);
      pier.castShadow = true;
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.35, 1.98), mats.salLatticeMat);
      win.position.set(sx * 3.35, 2.45, 0);
      const guardian = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 1.35, 8), mats.granitePlinthMat);
      guardian.position.set(sx * 2.95, 0.68, dirSign * 1.35);
      nsGate.add(pier, win, guardian);
    }
    const header = new THREE.Mesh(new THREE.BoxGeometry(8.8, 1.45, 1.9), mats.dachiAppaBrickMat);
    header.position.y = 4.65;
    header.castShadow = true;
    const nsRoof = new THREE.Mesh(new THREE.ConeGeometry(5.4, 1.65, 4), mats.jhingatiTileMat);
    nsRoof.scale.set(1.3, 1.0, 0.65);
    nsRoof.rotation.y = Math.PI * 0.25;
    nsRoof.position.y = 6.05;
    nsRoof.castShadow = true;
    const nsGajur = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.95, 10), mats.gildedTrimMat);
    nsGajur.position.y = 7.2;
    nsGate.add(header, nsRoof, nsGajur);
    group.add(nsGate);
  }

  mergeStaticMeshesByMaterial(group, { preserveCustomShaderMaterials: true });

  return { group, beaconLights, templeBells };
}

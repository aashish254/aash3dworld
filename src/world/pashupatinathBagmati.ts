import * as THREE from 'three';
import { mergeStaticMeshesByMaterial } from './meshOptimization';
import {
  PASHUPATI_COMPLEX,
  PASHUPATI_INTERACTIVE_SPOTS,
  getPashupatiBagmatiBridgeDeckY,
} from './pashupatinathData';
import { PashupatinathPbrMaterials } from './pashupatinathTextures';

export interface PashupatinathBagmatiBuild {
  group: THREE.Group;
  beaconLights: THREE.PointLight[];
  animatedNodes: THREE.Object3D[];
  aaratiHitTarget: THREE.Mesh;
  triggerBagmatiAarati: () => void;
}

/**
 * Builds the Eastern Bagmati River Precinct:
 * - 28m wide flowing Bagmati River with custom GLSL shader & floating leaf-lamp Diyas + marigold offerings
 * - Stepped granite Aryaghat (North) & Surya Ghat (South), riverside Shiva Lingams, Newari Pati/Sattal rest houses
 * - Interactive Bagmati Sandhya Aarati Terrace (3 multi-tiered blazing brass stands -> dynamic bloom & launched river Diyas)
 * - Arched 3-span Newari Brick-and-Stone Bagmati Bridge
 * - East Bank Pandra Shivalaya (15 symmetrical stone dome shrines) + dense InstancedMesh Sleshmantak Forest
 */
export function buildPashupatinathBagmati(
  mats: PashupatinathPbrMaterials,
): PashupatinathBagmatiBuild {
  const c = PASHUPATI_COMPLEX;
  const cx = c.centerX;
  const cz = c.centerZ;
  const group = new THREE.Group();
  const beaconLights: THREE.PointLight[] = [];
  const animatedNodes: THREE.Object3D[] = [];

  // =========================================================================
  // 1. ARYAGHAT & SURYA GHAT STEPPED GRANITE BANKS + RIVERSIDE PATI / SATTAL
  // =========================================================================
  // 5 stepped granite tiers descending from ghatTopX (x=26.0 -> local +54.0) cleanly into the real river edge (x=29.6, y=-0.44m)
  const ghatStartLocalX = c.ghatTopX - cx; // +54
  const spanW = 3.6; // descends from local +54.0 to +57.6 (world x=26.0..29.6, leaving 9.1m open channel)

  for (let s = 0; s < 5; s++) {
    const t0 = s / 5;
    const stepW = spanW / 5 + 0.12;
    const stepX = ghatStartLocalX + (s + 0.5) * (spanW / 5);
    const stepTopY = c.courtyardY - t0 * (c.courtyardY + 0.62);
    const stepBox = new THREE.Mesh(
      new THREE.BoxGeometry(stepW, 2.0, 124.0),
      mats.graniteFlagstoneMat,
    );
    stepBox.position.set(stepX, stepTopY - 1.0, 0);
    stepBox.receiveShadow = true;
    group.add(stepBox);
  }

  // Bagmati Overlook Red-and-White Crenellated Newari Parapet Wall along ghat crest (+53.8)
  // Leaves wide openings for Bridge/Aarati [-8.2..8.2] and Aryaghat/Surya Ghat stairs [-41..-31] & [31..41]
  for (const [zStart, zEnd] of [
    [-60.2, -41.0],
    [-31.0, -8.2],
    [8.2, 31.0],
    [41.0, 60.2],
  ] as Array<[number, number]>) {
    const segLen = zEnd - zStart;
    const zMid = (zStart + zEnd) * 0.5;
    const lowWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.88, segLen),
      mats.whitePlasterMat,
    );
    lowWall.position.set(ghatStartLocalX - 0.2, c.courtyardY + 0.44, zMid);
    lowWall.castShadow = true;
    lowWall.receiveShadow = true;
    group.add(lowWall);

    const redCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.54, 0.14, segLen),
      mats.dachiAppaBrickMat,
    );
    redCap.position.set(ghatStartLocalX - 0.2, c.courtyardY + 0.95, zMid);
    group.add(redCap);

    const merlonCount = Math.floor(segLen / 1.45);
    for (let m = 0; m < merlonCount; m++) {
      const mz = zStart + 0.72 + m * 1.45;
      const merlon = new THREE.Mesh(
        new THREE.BoxGeometry(0.48, 0.32, 0.56),
        mats.dachiAppaBrickMat,
      );
      merlon.position.set(ghatStartLocalX - 0.2, c.courtyardY + 1.18, mz);
      group.add(merlon);
    }
  }

  // Ritual Ghat Stone Platforms on upper Aryaghat (North) & Surya Ghat (South) terrace + riverside Shiva Shrines
  for (const gz of [-46.0, -21.0, 21.0, 46.0]) {
    const plat = new THREE.Mesh(
      new THREE.CylinderGeometry(1.32, 1.48, 0.44, 16),
      mats.granitePlinthMat,
    );
    plat.position.set(ghatStartLocalX + 1.0, c.courtyardY - 0.22, gz);
    plat.receiveShadow = true;
    group.add(plat);

    const miniShrine = new THREE.Mesh(
      new THREE.BoxGeometry(1.12, 1.42, 1.12),
      mats.sandstoneCopingMat,
    );
    miniShrine.position.set(ghatStartLocalX - 1.25, c.courtyardY + 0.71, gz);
    miniShrine.castShadow = true;
    const miniDome = new THREE.Mesh(
      new THREE.ConeGeometry(0.84, 0.92, 4),
      mats.sandstoneCopingMat,
    );
    miniDome.rotation.y = Math.PI * 0.25;
    miniDome.position.set(ghatStartLocalX - 1.25, c.courtyardY + 1.88, gz);
    miniDome.castShadow = true;
    group.add(miniShrine, miniDome);
  }

  // Newari Colonnaded Brick-and-Timber Pati / Sattal Resting Houses overlooking the ghats (local +49.5)
  for (const [pz, pLen] of [
    [-28.0, 18.0],
    [28.0, 18.0],
  ] as Array<[number, number]>) {
    const pati = new THREE.Group();
    pati.position.set(49.5, c.courtyardY, pz);
    const pDeck = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.65, pLen), mats.granitePlinthMat);
    pDeck.position.y = 0.325;
    pDeck.receiveShadow = true;
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(0.55, 3.6, pLen - 0.6), mats.whitePlasterMat);
    backWall.position.set(-2.45, 2.45, 0);
    backWall.castShadow = true;
    for (let z = -pLen * 0.42; z <= pLen * 0.42 + 0.05; z += 3.0) {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.24, 3.4, 0.24), mats.carvedSalWoodMat);
      col.position.set(2.45, 2.35, z);
      col.castShadow = true;
      pati.add(col);
    }
    const pRoof = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.28, pLen + 1.4), mats.jhingatiTileMat);
    pRoof.position.set(0.15, 4.35, 0);
    pRoof.rotation.z = -0.22;
    pRoof.castShadow = true;
    pati.add(pDeck, backWall, pRoof);
    group.add(pati);
  }

  // =========================================================================
  // 2. INTERACTIVE BAGMATI SANDHYA AARATI TERRACE (local +55.5, 0)
  // =========================================================================
  const aaratiTerrace = new THREE.Mesh(
    new THREE.BoxGeometry(3.8, 1.9, 15.2),
    mats.granitePlinthMat,
  );
  aaratiTerrace.position.set(55.5, c.courtyardY - 0.95, 0);
  aaratiTerrace.receiveShadow = true;
  group.add(aaratiTerrace);

  const aaratiFlameMat = new THREE.MeshBasicMaterial({ color: 0xffdf8a });
  const aaratiHaloMat = new THREE.MeshBasicMaterial({
    color: 0xff8c28,
    transparent: true,
    opacity: 0.14,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const aaratiStandsAnim: Array<{
    group: THREE.Group;
    flames: THREE.Mesh[];
    halos: THREE.Mesh[];
    light: THREE.PointLight;
  }> = [];

  PASHUPATI_INTERACTIVE_SPOTS.aaratiStands.forEach((st, idx) => {
    const slx = st.x - cx;
    const slz = st.z - cz;
    const stand = new THREE.Group();
    stand.position.set(slx, c.courtyardY, slz);
    stand.userData.noMerge = true;

    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 0.48, 10), mats.granitePlinthMat);
    ped.position.y = 0.24;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.11, 1.55, 10), mats.gildedTrimMat);
    stem.position.y = 1.24;
    stand.add(ped, stem);

    const flames: THREE.Mesh[] = [];
    const halos: THREE.Mesh[] = [];
    for (const [tierY, r] of [
      [1.35, 0.42],
      [1.72, 0.30],
      [2.05, 0.18],
    ] as Array<[number, number]>) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.032, 6, 14), mats.gildedTrimMat);
      ring.rotation.x = Math.PI * 0.5;
      ring.position.y = tierY;
      stand.add(ring);

      const cups = r > 0.25 ? 6 : 4;
      for (let k = 0; k < cups; k++) {
        const ka = (k / cups) * Math.PI * 2;
        const fl = new THREE.Mesh(new THREE.ConeGeometry(0.052, 0.21, 6), aaratiFlameMat);
        fl.position.set(Math.cos(ka) * r, tierY + 0.13, Math.sin(ka) * r);
        fl.userData.noMerge = true;
        fl.userData.nonCollidable = true;
        const hl = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), aaratiHaloMat);
        hl.position.copy(fl.position);
        hl.userData.noMerge = true;
        hl.userData.nonCollidable = true;
        stand.add(fl, hl);
        flames.push(fl);
        halos.push(hl);
      }
    }

    const aLight = new THREE.PointLight(0xffa640, 2.4, 16, 1.5);
    aLight.position.set(slx, 2.45, slz);
    aLight.userData.warmFlicker = true;
    aLight.userData.flickerAmp = 0.14;
    aLight.userData.intensityScale = 1.85;
    group.add(aLight);
    beaconLights.push(aLight);

    group.add(stand);
    aaratiStandsAnim.push({ group: stand, flames, halos, light: aLight });
  });

  const aaratiHitTarget = new THREE.Mesh(
    new THREE.SphereGeometry(2.6, 8, 8),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  aaratiHitTarget.position.set(55.5, c.courtyardY + 1.4, 0);
  aaratiHitTarget.userData.noMerge = true;
  aaratiHitTarget.userData.nonCollidable = true;
  group.add(aaratiHitTarget);

  // =========================================================================
  // 3. FLOATING LEAF-LAMP DIYAS & MARIGOLDS IN THE REAL BAGMATI RIVER
  //    (Reuses the existing world animated river water — zero duplicate river mesh)
  // =========================================================================
  const riverCenterLocalX = c.riverCenterX - cx; // +62.0 (real river center x=34)

  const diyaLeafMat = new THREE.MeshStandardMaterial({ color: 0x2f6b29, roughness: 0.72 });
  const floatingDiyas: Array<{
    group: THREE.Group;
    x: number;
    z: number;
    speed: number;
    phase: number;
  }> = [];

  const createDiyaMesh = (): THREE.Group => {
    const dg = new THREE.Group();
    dg.userData.noMerge = true;
    dg.userData.nonCollidable = true;
    const leaf = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.03, 8), diyaLeafMat);
    const petal = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.035, 5, 8), mats.marigoldMat);
    petal.rotation.x = Math.PI * 0.5;
    petal.position.y = 0.03;
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.11, 5), aaratiFlameMat);
    flame.position.y = 0.09;
    dg.add(leaf, petal, flame);
    return dg;
  };

  for (let i = 0; i < 24; i++) {
    const dm = createDiyaMesh();
    const rx = riverCenterLocalX - 2.6 + ((i * 23) % 10) * 0.56;
    const rz = -56 + ((i * 53) % 112);
    dm.position.set(rx, c.riverWaterY + 0.025, rz);
    group.add(dm);
    floatingDiyas.push({
      group: dm,
      x: rx,
      z: rz,
      speed: 1.15 + (i % 5) * 0.22,
      phase: i * 0.85,
    });
  }

  let aaratiPulse = 0;
  const triggerBagmatiAarati = () => {
    aaratiPulse = 1.0;
    // Launch 5 fresh glowing leaf-lamp Diyas near Aarati Ghat stairs into real river flow
    for (let k = 0; k < 5; k++) {
      const targetDiya = floatingDiyas[k % floatingDiyas.length];
      targetDiya.x = riverCenterLocalX - 1.6 + k * 0.75;
      targetDiya.z = -3.0 + k * 1.45;
      targetDiya.speed = 1.45 + k * 0.08;
    }
  };

  // =========================================================================
  // 4. ARCHED 3-SPAN NEWARI BRICK-AND-STONE BAGMATI BRIDGE
  // =========================================================================
  const bridgeMinLX = c.bridgeMinX - cx;
  const bridgeMaxLX = c.bridgeMaxX - cx;
  const segCount = 24;
  for (let s = 0; s < segCount; s++) {
    const t0 = s / segCount;
    const t1 = (s + 1) / segCount;
    const wx0 = THREE.MathUtils.lerp(c.bridgeMinX, c.bridgeMaxX, t0);
    const wx1 = THREE.MathUtils.lerp(c.bridgeMinX, c.bridgeMaxX, t1);
    const x0 = wx0 - cx;
    const x1 = wx1 - cx;
    const y0 = getPashupatiBagmatiBridgeDeckY(wx0);
    const y1 = getPashupatiBagmatiBridgeDeckY(wx1);
    const segLen = Math.hypot(x1 - x0, y1 - y0) + 0.08;
    const pitch = Math.atan2(y1 - y0, x1 - x0);

    const deckSeg = new THREE.Mesh(
      new THREE.BoxGeometry(segLen, 0.36, c.bridgeHalfZ * 2),
      mats.graniteFlagstoneMat,
    );
    deckSeg.position.set((x0 + x1) * 0.5, (y0 + y1) * 0.5 - 0.18, 0);
    deckSeg.rotation.z = pitch;
    deckSeg.castShadow = true;
    deckSeg.receiveShadow = true;
    group.add(deckSeg);

    // Brick side parapets + Sal-wood top rails
    for (const pz of [-c.bridgeHalfZ + 0.22, c.bridgeHalfZ - 0.22]) {
      const parapet = new THREE.Mesh(
        new THREE.BoxGeometry(segLen, 0.88, 0.34),
        mats.dachiAppaBrickMat,
      );
      parapet.position.set((x0 + x1) * 0.5, (y0 + y1) * 0.5 + 0.44, pz);
      parapet.rotation.z = pitch;
      parapet.castShadow = true;
      group.add(parapet);
    }
  }

  // Stone river piers & arched underside soffits cleanly beneath bridge deck over real river
  for (const pierWx of [30.2, 34.0, 37.8]) {
    const px = pierWx - cx;
    const deckUnderY = getPashupatiBagmatiBridgeDeckY(pierWx) - 0.36;
    const pierH = deckUnderY - (-1.65);
    const pierCenterY = -1.65 + pierH * 0.5;
    const pier = new THREE.Mesh(new THREE.BoxGeometry(1.45, pierH, 6.0), mats.granitePlinthMat);
    pier.position.set(px, pierCenterY, 0);
    pier.castShadow = true;
    const cutwater = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, pierH, 4), mats.granitePlinthMat);
    cutwater.position.set(px, pierCenterY, -3.1);
    cutwater.rotation.y = Math.PI * 0.25;
    group.add(pier, cutwater);
  }
  for (const frac of [0.15, 0.5, 0.85]) {
    const wx = THREE.MathUtils.lerp(c.bridgeMinX, c.bridgeMaxX, frac);
    const lx = wx - cx;
    const parapetTopY = getPashupatiBagmatiBridgeDeckY(wx) + 0.88;
    for (const pz of [-c.bridgeHalfZ + 0.22, c.bridgeHalfZ - 0.22]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 0.24), mats.granitePlinthMat);
      post.position.set(lx, parapetTopY + 0.13, pz);
      const bLantern = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.28, 6), aaratiFlameMat);
      bLantern.position.set(lx, parapetTopY + 0.38, pz);
      bLantern.userData.noMerge = true;
      bLantern.userData.nonCollidable = true;
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.18, 4), mats.agedBronzeMat);
      cap.rotation.y = Math.PI * 0.25;
      cap.position.set(lx, parapetTopY + 0.58, pz);
      group.add(post, bLantern, cap);
    }
  }

  // =========================================================================
  // 5. EAST BANK PANDRA SHIVALAYA (15 SYMMETRICAL STONE DOME SHRINES)
  // =========================================================================
  const ebMinX = c.eastBankMinX - cx;
  const ebMaxX = c.eastBankMaxX - cx;
  const ebMinZ = c.eastBankMinZ - cz;
  const ebMaxZ = c.eastBankMaxZ - cz;
  const eastTerrace = new THREE.Mesh(
    new THREE.BoxGeometry(ebMaxX - ebMinX, 1.8, ebMaxZ - ebMinZ),
    mats.graniteFlagstoneMat,
  );
  eastTerrace.position.set((ebMinX + ebMaxX) * 0.5, c.eastBankY - 0.9, (ebMinZ + ebMaxZ) * 0.5);
  eastTerrace.receiveShadow = true;
  group.add(eastTerrace);

  // Full-length 124m granite riverfront steps descending cleanly from x=41.5 (y=0.42) to x=38.7 (submerged -0.405m)
  const eastSpanW = 2.8;
  for (let es = 0; es < 4; es++) {
    const stepW = eastSpanW / 4 + 0.14;
    const stepX = ebMinX - (es + 0.5) * (eastSpanW / 4);
    const stepTopY = c.eastBankY - (es / 4) * (c.eastBankY + 0.68);
    const curbStep = new THREE.Mesh(
      new THREE.BoxGeometry(stepW, 2.0, ebMaxZ - ebMinZ),
      mats.granitePlinthMat,
    );
    curbStep.position.set(stepX, stepTopY - 1.0, (ebMinZ + ebMaxZ) * 0.5);
    curbStep.receiveShadow = true;
    group.add(curbStep);
  }

  const shivalayaCoords: ReadonlyArray<[number, number]> = [
    [48.0, 274], [48.0, 282], [48.0, 290], [48.0, 310], [48.0, 318], [48.0, 326],
    [54.3, 274], [54.3, 282], [54.3, 290], [54.3, 310], [54.3, 318], [54.3, 326],
    [60.3, 282], [60.3, 300], [60.3, 318],
  ];
  for (const [wx, wz] of shivalayaCoords) {
    const sx = wx - cx;
    const sz = wz - cz;
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.45, 2.8), mats.granitePlinthMat);
    base.position.set(sx, c.eastBankY + 0.225, sz);
    base.castShadow = true;
    const cube = new THREE.Mesh(new THREE.BoxGeometry(2.15, 2.05, 2.15), mats.whitePlasterMat);
    cube.position.set(sx, c.eastBankY + 1.45, sz);
    cube.castShadow = true;
    const dome = new THREE.Mesh(new THREE.ConeGeometry(1.42, 1.55, 10), mats.whitePlasterMat);
    dome.position.set(sx, c.eastBankY + 3.22, sz);
    dome.castShadow = true;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.55, 8), mats.gildedTrimMat);
    tip.position.set(sx, c.eastBankY + 4.22, sz);
    const miniLinga = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.25, 0.6, 10),
      mats.blackBasaltMat,
    );
    miniLinga.position.set(sx, c.eastBankY + 0.72, sz);
    group.add(base, cube, dome, tip, miniLinga);
  }

  // =========================================================================
  // 6. DENSE INSTANCED SLESHMANTAK FOREST EAST OF PANDRA SHIVALAYA
  // =========================================================================
  const treeCount = 54;
  const trunkGeo = new THREE.CylinderGeometry(0.16, 0.34, 4.6, 7);
  const canopyGeo = new THREE.IcosahedronGeometry(2.2, 1);
  const forestTrunkMat = mats.carvedSalWoodMat;
  const forestCanopyMat = new THREE.MeshStandardMaterial({ color: 0x245531, roughness: 0.86 });
  const upperCanopyMat = new THREE.MeshStandardMaterial({ color: 0x2e663b, roughness: 0.84 });

  const trunkInst = new THREE.InstancedMesh(trunkGeo, forestTrunkMat, treeCount);
  const canopyInst = new THREE.InstancedMesh(canopyGeo, forestCanopyMat, treeCount);
  const upperCanopyInst = new THREE.InstancedMesh(canopyGeo, upperCanopyMat, treeCount);
  trunkInst.castShadow = true;
  canopyInst.castShadow = true;
  trunkInst.userData.noMerge = true;
  canopyInst.userData.noMerge = true;
  upperCanopyInst.userData.noMerge = true;

  const dummy = new THREE.Object3D();
  for (let i = 0; i < treeCount; i++) {
    const h1 = Math.abs(Math.sin(i * 12.9898 + 4.1414) * 43758.5453) % 1;
    const h2 = Math.abs(Math.sin(i * 78.233 + 1.732) * 24634.6345) % 1;
    const h3 = Math.abs(Math.sin(i * 39.17 + 7.21) * 19453.21) % 1;
    const tx = (c.eastBankMaxX - cx) + 4.5 + h1 * 24.5;
    const tz = -54.0 + h2 * 108.0;
    const sc = 0.82 + h3 * 0.68;

    dummy.position.set(tx, 0.25 + 2.3 * sc, tz);
    dummy.scale.set(sc, sc, sc);
    dummy.rotation.set(0, h1 * Math.PI * 2, (h2 - 0.5) * 0.06);
    dummy.updateMatrix();
    trunkInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(tx, 0.25 + 4.4 * sc, tz);
    dummy.scale.set(sc * 1.24, sc * 0.86, sc * 1.18);
    dummy.updateMatrix();
    canopyInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(tx + (h2 - 0.5) * 0.7, 0.25 + 5.75 * sc, tz + (h1 - 0.5) * 0.7);
    dummy.scale.set(sc * 0.92, sc * 0.82, sc * 0.94);
    dummy.updateMatrix();
    upperCanopyInst.setMatrixAt(i, dummy.matrix);
  }
  trunkInst.instanceMatrix.needsUpdate = true;
  canopyInst.instanceMatrix.needsUpdate = true;
  upperCanopyInst.instanceMatrix.needsUpdate = true;
  group.add(trunkInst, canopyInst, upperCanopyInst);

  // Animator Driver for floating Bagmati Diyas & Aarati Ritual Pulse
  const riverAnim = new THREE.Object3D();
  riverAnim.position.set(c.riverCenterX - cx, 0, 0);
  riverAnim.userData.noMerge = true;
  riverAnim.userData.onEnvironmentUpdate = (env: { elapsed: number }) => {
    const t = env.elapsed;
    aaratiPulse = Math.max(0, aaratiPulse - 0.008);

    for (let i = 0; i < floatingDiyas.length; i++) {
      const fd = floatingDiyas[i];
      fd.z += fd.speed * 0.024;
      if (fd.z > 58) fd.z = -56;
      fd.group.position.set(
        fd.x + Math.sin(t * 0.9 + fd.phase) * 0.32,
        c.riverWaterY + 0.025 + Math.sin(t * 2.4 + fd.phase) * 0.016,
        fd.z,
      );
      fd.group.rotation.y = t * 0.4 + fd.phase;
    }

    for (let i = 0; i < aaratiStandsAnim.length; i++) {
      const st = aaratiStandsAnim[i];
      st.group.rotation.y = Math.sin(t * 1.8 + i * 1.2) * (0.04 + aaratiPulse * 0.22);
      st.light.userData.intensityScale = 1.85 + aaratiPulse * 2.4;
      for (let f = 0; f < st.flames.length; f++) {
        const s = (0.9 + 0.2 * Math.sin(t * 10 + f)) * (1 + aaratiPulse * 0.65);
        st.flames[f].scale.set(1 + aaratiPulse * 0.25, s, 1 + aaratiPulse * 0.25);
        st.halos[f].scale.setScalar(1 + aaratiPulse * 0.85);
      }
    }
  };
  group.add(riverAnim);
  animatedNodes.push(riverAnim);

  mergeStaticMeshesByMaterial(group, { preserveCustomShaderMaterials: true });

  return {
    group,
    beaconLights,
    animatedNodes,
    aaratiHitTarget,
    triggerBagmatiAarati,
  };
}

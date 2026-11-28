import * as THREE from 'three';
import { mergeStaticMeshesByMaterial } from './meshOptimization';
import {
  PASHUPATI_CHAUTARA_TREES,
  PASHUPATI_COMPLEX,
  PASHUPATI_INTERACTIVE_SPOTS,
  PASHUPATI_SHIKHARA_POSITIONS,
} from './pashupatinathData';
import { PashupatinathPbrMaterials } from './pashupatinathTextures';

export interface PashupatinathCourtyardBuild {
  group: THREE.Group;
  beaconLights: THREE.PointLight[];
  animatedNodes: THREE.Object3D[];
  templeBells: THREE.Group[];
  nandiHitTarget: THREE.Mesh;
  gheeLampHitTargets: THREE.Mesh[];
  toggleGheeLampRack: (idx: number) => boolean;
}

function buildCourtyardBell(bronzeMat: THREE.Material, ropeMat: THREE.Material): THREE.Group {
  const bellGroup = new THREE.Group();
  bellGroup.userData.noMerge = true;
  bellGroup.userData.nonCollidable = true;

  const swingPivot = new THREE.Group();
  swingPivot.userData.noMerge = true;
  bellGroup.userData.bellSwingPivot = swingPivot;

  const bracket = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.28, 8), bronzeMat);
  bracket.position.y = -0.14;
  swingPivot.add(bracket);

  // Inner cavity top->bottom (-radial inward normals), chamfered lip, then outer shell bottom->top (+radial outward normals)
  const bellProfile = [
    new THREE.Vector2(0.0, -0.14),
    new THREE.Vector2(0.14, -0.18),
    new THREE.Vector2(0.23, -0.56),
    new THREE.Vector2(0.38, -0.825),
    new THREE.Vector2(0.395, -0.845),
    new THREE.Vector2(0.445, -0.845),
    new THREE.Vector2(0.46, -0.825),
    new THREE.Vector2(0.42, -0.78),
    new THREE.Vector2(0.28, -0.58),
    new THREE.Vector2(0.22, -0.24),
    new THREE.Vector2(0.14, -0.05),
    new THREE.Vector2(0.0, 0.0),
  ];
  const bellGeo = new THREE.LatheGeometry(bellProfile, 20);
  bellGeo.computeVertexNormals();
  const bellBody = new THREE.Mesh(bellGeo, bronzeMat);
  bellBody.position.y = -0.22;
  bellBody.castShadow = true;
  swingPivot.add(bellBody);

  const clapperPivot = new THREE.Group();
  clapperPivot.position.y = -0.35;
  clapperPivot.userData.noMerge = true;
  bellGroup.userData.bellClapperPivot = clapperPivot;

  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.72, 8), bronzeMat);
  rod.position.y = -0.36;
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), bronzeMat);
  ball.position.y = -0.74;
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.55, 6), ropeMat);
  rope.position.y = -1.04;
  clapperPivot.add(rod, ball, rope);
  swingPivot.add(clapperPivot);

  bellGroup.add(swingPivot);
  return bellGroup;
}

/**
 * Builds Pashupati Chowk (Courtyard) stone flagstones, Golden Nandi Bull & Deepstambha pillars,
 * colossal 7.5m Golden Trishul & Damaru, Vasuki Nath 2-tier Pagoda, 8 stone Shikhara shrines,
 * Ghanta Bell Pavilion, 2 interactive ghee-lamp racks, Rudraksha & Bel Chautaras,
 * sunken Dhunge Dhara Makara spout basin, and living courtyard pigeons & monkeys.
 */
export function buildPashupatinathCourtyard(
  mats: PashupatinathPbrMaterials,
): PashupatinathCourtyardBuild {
  const c = PASHUPATI_COMPLEX;
  const group = new THREE.Group();
  const beaconLights: THREE.PointLight[] = [];
  const animatedNodes: THREE.Object3D[] = [];
  const templeBells: THREE.Group[] = [];

  const diyoFlameMat = new THREE.MeshBasicMaterial({ color: 0xffd275 });
  const diyoHaloMat = new THREE.MeshBasicMaterial({
    color: 0xff9b38,
    transparent: true,
    opacity: 0.42,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  // =========================================================================
  // 1. COURTYARD GRANITE FLAGSTONES, WESTERN PLAZA & NORTH GATE APRON
  // =========================================================================
  const courtyardSlab = new THREE.Mesh(
    new THREE.BoxGeometry(108.0, 0.56, 124.0),
    mats.graniteFlagstoneMat,
  );
  courtyardSlab.position.set(0, c.courtyardY - 0.28, 0);
  courtyardSlab.receiveShadow = true;
  group.add(courtyardSlab);

  // Western Approach Plaza (x local [-72..-54])
  const westPlazaSlab = new THREE.Mesh(
    new THREE.BoxGeometry(18.5, 0.56, 36.0),
    mats.graniteFlagstoneMat,
  );
  westPlazaSlab.position.set(-63.0, c.courtyardY - 0.28, 0);
  westPlazaSlab.receiveShadow = true;
  group.add(westPlazaSlab);

  // North & South Gate Aprons (matching 8.8m gatehouse width, embedded cleanly into flat terrain)
  for (const az of [-64.8, 64.8]) {
    const gateApronSlab = new THREE.Mesh(
      new THREE.BoxGeometry(8.8, 0.56, 5.6),
      mats.graniteFlagstoneMat,
    );
    gateApronSlab.position.set(0, c.courtyardY - 0.28, az);
    gateApronSlab.receiveShadow = true;
    group.add(gateApronSlab);
  }

  // Western ceremonial granite-and-crimson ritual runner from Paschim Dwar to Main Pagoda stairs
  const axialBorder = new THREE.Mesh(
    new THREE.BoxGeometry(40.0, 0.04, 5.4),
    mats.granitePlinthMat,
  );
  axialBorder.position.set(-34.0, c.courtyardY + 0.015, 0);
  axialBorder.receiveShadow = true;
  const axialCarpet = new THREE.Mesh(
    new THREE.BoxGeometry(40.0, 0.05, 4.1),
    mats.dachiAppaBrickMat,
  );
  axialCarpet.position.set(-34.0, c.courtyardY + 0.025, 0);
  axialCarpet.receiveShadow = true;
  group.add(axialBorder, axialCarpet);

  // =========================================================================
  // 2. WESTERN-AXIS MONUMENTAL GOLDEN NANDI BULL & TWIN 6.5m DEEPSTAMBHAS
  // =========================================================================
  const nandiGroup = new THREE.Group();
  nandiGroup.position.set(-19.5, c.courtyardY, 0);

  // 5.5m x 3.8m stepped granite pedestal
  const nStep1 = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.55, 3.8), mats.granitePlinthMat);
  nStep1.position.y = 0.275;
  nStep1.castShadow = true;
  nStep1.receiveShadow = true;
  const nStep2 = new THREE.Mesh(new THREE.BoxGeometry(4.85, 0.55, 3.25), mats.granitePlinthMat);
  nStep2.position.y = 0.825;
  nStep2.castShadow = true;
  nStep2.receiveShadow = true;
  const nStep3 = new THREE.Mesh(new THREE.BoxGeometry(4.25, 0.4, 2.75), mats.granitePlinthMat);
  nStep3.position.y = 1.3;
  nStep3.castShadow = true;
  nStep3.receiveShadow = true;
  nandiGroup.add(nStep1, nStep2, nStep3);

  // Sacred crimson & marigold saddle cushion under Nandi
  const cushion = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.16, 1.85), mats.crimsonClothMat);
  cushion.position.y = 1.58;
  nandiGroup.add(cushion);

  // Brass perimeter guardrail posts & top bars
  for (const px of [-2.45, -0.82, 0.82, 2.45]) {
    for (const pz of [-1.62, 1.62]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 1.05, 8), mats.gildedTrimMat);
      post.position.set(px, 1.07, pz);
      nandiGroup.add(post);
    }
  }
  for (const pz of [-1.62, 1.62]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(4.95, 0.06, 0.06), mats.gildedTrimMat);
    rail.position.set(0, 1.55, pz);
    nandiGroup.add(rail);
  }
  for (const px of [-2.45, 2.45]) {
    const endRail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 3.3), mats.gildedTrimMat);
    endRail.position.set(px, 1.55, 0);
    nandiGroup.add(endRail);
  }

  // Sculpted Gilded Bronze Kneeling Nandi Bull facing East (+X toward Shiva Lingam)
  const bull = new THREE.Group();
  bull.position.y = 1.66;

  const torso = new THREE.Mesh(new THREE.SphereGeometry(1.05, 18, 14), mats.gildedCopperRoofMat);
  torso.scale.set(1.58, 0.82, 0.86);
  torso.position.set(-0.15, 0.72, 0);
  torso.castShadow = true;
  bull.add(torso);

  const hump = new THREE.Mesh(new THREE.SphereGeometry(0.56, 14, 12), mats.gildedCopperRoofMat);
  hump.scale.set(1.05, 1.22, 0.88);
  hump.position.set(0.58, 1.38, 0);
  hump.castShadow = true;
  bull.add(hump);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.64, 0.95, 14), mats.gildedCopperRoofMat);
  neck.rotation.z = -0.58;
  neck.position.set(1.12, 1.12, 0);
  neck.castShadow = true;
  bull.add(neck);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.56, 0.52), mats.gildedCopperRoofMat);
  head.position.set(1.56, 1.38, 0);
  head.rotation.z = -0.22;
  head.castShadow = true;
  bull.add(head);

  const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.42, 10), mats.gildedCopperRoofMat);
  snout.rotation.z = Math.PI * 0.42;
  snout.position.set(1.96, 1.22, 0);
  bull.add(snout);

  // Curved Golden Horns & Ears
  for (const sz of [-1, 1]) {
    const hornCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.38, 1.62, sz * 0.22),
      new THREE.Vector3(1.25, 1.98, sz * 0.42),
      new THREE.Vector3(1.48, 2.24, sz * 0.34),
    ]);
    const horn = new THREE.Mesh(new THREE.TubeGeometry(hornCurve, 10, 0.068, 8, false), mats.gildedTrimMat);
    horn.castShadow = true;
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.32), mats.gildedCopperRoofMat);
    ear.position.set(1.28, 1.48, sz * 0.38);
    ear.rotation.z = 0.25;
    bull.add(horn, ear);

    // Folded kneeling forelegs & hindquarters
    const foreLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.92, 10), mats.gildedCopperRoofMat);
    foreLeg.rotation.z = Math.PI * 0.46;
    foreLeg.position.set(0.88, 0.16, sz * 0.62);
    const hindLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.15, 1.05, 10), mats.gildedCopperRoofMat);
    hindLeg.rotation.z = Math.PI * 0.48;
    hindLeg.position.set(-0.95, 0.18, sz * 0.65);
    bull.add(foreLeg, hindLeg);
  }

  // Ornate harness, tail, and fresh marigold collar garland
  const saddleCloth = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.85, 1.72), mats.crimsonClothMat);
  saddleCloth.position.set(-0.18, 0.82, 0);
  const collarGarland = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.11, 8, 18), mats.marigoldMat);
  collarGarland.rotation.y = Math.PI * 0.5;
  collarGarland.rotation.x = 0.45;
  collarGarland.position.set(1.15, 1.12, 0);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.04, 1.15, 8), mats.gildedTrimMat);
  tail.rotation.z = 0.72;
  tail.position.set(-1.68, 0.58, 0.32);
  bull.add(saddleCloth, collarGarland, tail);
  nandiGroup.add(bull);

  // Twin 6.5m Brass Deepstambha Oil-Lamp Pillars flanking Nandi (local -19.5, ±3.6)
  for (const sz of [-1, 1]) {
    const dpGroup = new THREE.Group();
    dpGroup.position.set(0, 0, sz * 3.6);
    const dpBase = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.72, 1.18), mats.granitePlinthMat);
    dpBase.position.y = 0.36;
    dpBase.castShadow = true;
    const dpShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.24, 5.4, 12), mats.gildedTrimMat);
    dpShaft.position.y = 3.42;
    dpShaft.castShadow = true;
    dpGroup.add(dpBase, dpShaft);

    for (let ring = 0; ring < 4; ring++) {
      const ry = 2.4 + ring * 0.95;
      const rad = 0.54 - ring * 0.07;
      const saucer = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.045, 6, 16), mats.gildedTrimMat);
      saucer.rotation.x = Math.PI * 0.5;
      saucer.position.y = ry;
      dpGroup.add(saucer);
      for (let w = 0; w < 6; w++) {
        const wa = (w / 6) * Math.PI * 2;
        const flame = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.09, 5), diyoFlameMat);
        flame.position.set(Math.cos(wa) * rad, ry + 0.07, Math.sin(wa) * rad);
        flame.userData.noMerge = true;
        flame.userData.nonCollidable = true;
        dpGroup.add(flame);
      }
    }
    const dpTop = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.72, 10), mats.gildedCopperRoofMat);
    dpTop.position.y = 6.38;
    dpGroup.add(dpTop);

    const dpLight = new THREE.PointLight(0xffb44c, 2.2, 14, 1.6);
    dpLight.position.set(-19.5, c.courtyardY + 4.8, sz * 3.6);
    dpLight.userData.warmFlicker = true;
    dpLight.userData.flickerAmp = 0.08;
    dpLight.userData.intensityScale = 1.6;
    group.add(dpLight);
    beaconLights.push(dpLight);

    nandiGroup.add(dpGroup);
  }
  group.add(nandiGroup);

  const nandiHitTarget = new THREE.Mesh(
    new THREE.SphereGeometry(2.5, 10, 10),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  nandiHitTarget.position.set(-19.5, c.courtyardY + 2.3, 0);
  nandiHitTarget.userData.noMerge = true;
  nandiHitTarget.userData.nonCollidable = true;
  group.add(nandiHitTarget);

  // =========================================================================
  // 3. COLOSSAL 7.5m GOLDEN TRISHUL & DAMARU MONUMENT (local -27.0, -14.5)
  // =========================================================================
  const trishulGroup = new THREE.Group();
  trishulGroup.position.set(-27.0, c.courtyardY, -14.5);
  const tBase1 = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 2.05, 0.65, 12), mats.granitePlinthMat);
  tBase1.position.y = 0.325;
  tBase1.castShadow = true;
  const tBase2 = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.45, 0.55, 12), mats.dachiAppaBrickMat);
  tBase2.position.y = 0.925;
  const tShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 6.2, 12), mats.gildedTrimMat);
  tShaft.position.y = 4.25;
  tShaft.castShadow = true;
  const tSpear = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.15, 8), mats.gildedCopperRoofMat);
  tSpear.position.y = 7.42;
  trishulGroup.add(tBase1, tBase2, tShaft, tSpear);

  for (const sx of [-1, 1]) {
    const prongCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 6.1, 0),
      new THREE.Vector3(sx * 0.72, 6.22, 0),
      new THREE.Vector3(sx * 0.95, 6.95, 0),
      new THREE.Vector3(sx * 0.78, 7.52, 0),
    ]);
    const prong = new THREE.Mesh(new THREE.TubeGeometry(prongCurve, 12, 0.085, 8, false), mats.gildedTrimMat);
    prong.castShadow = true;
    trishulGroup.add(prong);
  }
  // Hourglass Damaru drum
  const damaruTop = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.42, 12), mats.agedBronzeMat);
  damaruTop.position.set(0.25, 5.75, 0);
  damaruTop.rotation.x = Math.PI;
  const damaruBot = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.42, 12), mats.agedBronzeMat);
  damaruBot.position.set(0.25, 5.33, 0);
  trishulGroup.add(damaruTop, damaruBot);

  // Flowing Crimson Sacred Cloth Ribbons
  const trishulRibbons: THREE.Mesh[] = [];
  for (let r = 0; r < 2; r++) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.85, 0.02), mats.crimsonClothMat);
    rib.position.set(-0.18 + r * 0.36, 4.95, 0.16);
    rib.userData.noMerge = true;
    rib.userData.nonCollidable = true;
    trishulGroup.add(rib);
    trishulRibbons.push(rib);
  }
  group.add(trishulGroup);

  // =========================================================================
  // 4. NE 2-TIER VASUKI NATH PAGODA SHRINE (local +24, -24)
  // =========================================================================
  const vasuki = new THREE.Group();
  vasuki.position.set(24.0, c.courtyardY, -24.0);
  const vPlinth = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.38, 10.4), mats.granitePlinthMat);
  vPlinth.position.y = 0.19;
  vPlinth.receiveShadow = true;
  vPlinth.castShadow = true;
  const vWalls = new THREE.Mesh(new THREE.BoxGeometry(5.6, 3.6, 5.6), mats.dachiAppaBrickMat);
  vWalls.position.y = 2.18;
  vWalls.castShadow = true;
  const vWestDoor = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.35, 1.75), mats.repousseSilverMat);
  vWestDoor.position.set(-2.82, 1.56, 0);
  const vRoof1 = new THREE.Mesh(new THREE.ConeGeometry(5.6, 1.65, 4), mats.jhingatiTileMat);
  vRoof1.rotation.y = Math.PI * 0.25;
  vRoof1.position.y = 4.65;
  vRoof1.castShadow = true;
  const vUpper = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.9, 3.5), mats.dachiAppaBrickMat);
  vUpper.position.y = 5.95;
  const vRoof2 = new THREE.Mesh(new THREE.ConeGeometry(3.8, 1.45, 4), mats.gildedCopperRoofMat);
  vRoof2.rotation.y = Math.PI * 0.25;
  vRoof2.position.y = 7.4;
  vRoof2.castShadow = true;
  const vGajur = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.25, 10), mats.gildedTrimMat);
  vGajur.position.y = 8.65;
  // Five stone Naga serpent hoods guarding Vasuki entrance
  for (let nh = -2; nh <= 2; nh++) {
    const naga = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), mats.granitePlinthMat);
    naga.scale.set(0.65, 1.45, 1.1);
    naga.position.set(-3.1, 2.85 + (2 - Math.abs(nh)) * 0.12, nh * 0.26);
    vasuki.add(naga);
  }
  vasuki.add(vPlinth, vWalls, vWestDoor, vRoof1, vUpper, vRoof2, vGajur);
  group.add(vasuki);

  // =========================================================================
  // 5. 8 RIBBED STONE SHIKHARA SHRINES
  // =========================================================================
  for (const [sx, sz, sc] of PASHUPATI_SHIKHARA_POSITIONS) {
    const shikhara = new THREE.Group();
    shikhara.position.set(sx, c.courtyardY, sz);
    shikhara.scale.setScalar(sc);

    const sBase = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.55, 3.6), mats.granitePlinthMat);
    sBase.position.y = 0.275;
    sBase.castShadow = true;
    const sBody = new THREE.Mesh(new THREE.BoxGeometry(2.65, 2.25, 2.65), mats.sandstoneCopingMat);
    sBody.position.y = 1.68;
    sBody.castShadow = true;
    // Recessed dark sanctum archways on all 4 sides
    const sNicheX = new THREE.Mesh(new THREE.BoxGeometry(2.74, 1.35, 1.05), mats.blackBasaltMat);
    sNicheX.position.y = 1.38;
    const sNicheZ = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.35, 2.74), mats.blackBasaltMat);
    sNicheZ.position.y = 1.38;
    const sCornice = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.24, 3.0), mats.granitePlinthMat);
    sCornice.position.y = 2.86;
    const sTower = new THREE.Mesh(
      new THREE.CylinderGeometry(0.62, 1.55, 3.1, 8),
      mats.sandstoneCopingMat,
    );
    sTower.rotation.y = Math.PI / 8;
    sTower.position.y = 4.42;
    sTower.castShadow = true;
    shikhara.add(sBase, sBody, sNicheX, sNicheZ, sCornice, sTower);

    // 4 carved Bhumi cornice rib tiers ascending the Shikhara spire
    for (let b = 0; b < 4; b++) {
      const bt = b / 3;
      const bw = 2.45 - bt * 0.95;
      const bhumi = new THREE.Mesh(
        new THREE.BoxGeometry(bw, 0.16, bw),
        mats.granitePlinthMat,
      );
      bhumi.position.y = 3.45 + b * 0.65;
      shikhara.add(bhumi);
    }

    const sAmalaka = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.72, 0.36, 12), mats.granitePlinthMat);
    sAmalaka.position.y = 6.1;
    const sKalash = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.85, 10), mats.gildedTrimMat);
    sKalash.position.y = 6.68;
    const innerLinga = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.26, 0.65, 10),
      mats.blackBasaltMat,
    );
    innerLinga.position.y = 0.92;
    shikhara.add(sAmalaka, sKalash, innerLinga);
    group.add(shikhara);
  }

  // =========================================================================
  // 6. CARVED TIMBER GHANTA BELL PAVILION (local -25.0, +14.0)
  // =========================================================================
  const ghantaGroup = new THREE.Group();
  ghantaGroup.position.set(-25.0, c.courtyardY, 14.0);
  const gPad = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.14, 5.2), mats.granitePlinthMat);
  gPad.position.y = 0.07;
  gPad.receiveShadow = true;
  ghantaGroup.add(gPad);

  for (const bx of [-2.1, 2.1]) {
    for (const bz of [-2.1, 2.1]) {
      const colBase = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.38, 0.54), mats.granitePlinthMat);
      colBase.position.set(bx, 0.25, bz);
      const colPost = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.35, 0.3), mats.carvedSalWoodMat);
      colPost.position.set(bx, 2.08, bz);
      colPost.castShadow = true;
      ghantaGroup.add(colBase, colPost);
    }
  }
  const gBeam = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.34, 4.8), mats.carvedSalWoodMat);
  gBeam.position.y = 3.85;
  const gRoof = new THREE.Mesh(new THREE.ConeGeometry(4.2, 1.55, 4), mats.jhingatiTileMat);
  gRoof.rotation.y = Math.PI * 0.25;
  gRoof.position.y = 4.78;
  gRoof.castShadow = true;
  const gFinial = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.85, 10), mats.gildedTrimMat);
  gFinial.position.y = 5.88;
  ghantaGroup.add(gBeam, gRoof, gFinial);

  const ghantaBell = buildCourtyardBell(mats.agedBronzeMat, mats.crimsonClothMat);
  ghantaBell.position.set(0, 3.65, 0);
  ghantaBell.scale.setScalar(1.38);
  ghantaGroup.add(ghantaBell);
  templeBells.push(ghantaBell);
  group.add(ghantaGroup);

  // =========================================================================
  // 7. 2 INTERACTIVE TIERED BRASS GHEE-LAMP RACKS (local -15.5, ±6.8)
  // =========================================================================
  const gheeLampHitTargets: THREE.Mesh[] = [];
  const rackStates: Array<{
    lit: boolean;
    flames: THREE.Mesh[];
    halos: THREE.Mesh[];
    light: THREE.PointLight;
  }> = [];

  PASHUPATI_INTERACTIVE_SPOTS.gheeLampRacks.forEach((rackSpec, rackIdx) => {
    const rackLx = rackSpec.x - c.centerX;
    const rackLz = rackSpec.z - c.centerZ;
    const rack = new THREE.Group();
    rack.position.set(rackLx, c.courtyardY, rackLz);

    const rPlinth = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.32, 1.05), mats.granitePlinthMat);
    rPlinth.position.y = 0.16;
    rPlinth.castShadow = true;
    rack.add(rPlinth);

    for (const sx of [-0.82, 0.82]) {
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.55, 8), mats.gildedTrimMat);
      stand.position.set(sx, 1.08, 0);
      rack.add(stand);
    }

    const flames: THREE.Mesh[] = [];
    const halos: THREE.Mesh[] = [];
    for (const tierY of [0.95, 1.48]) {
      const tray = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.08, 0.42), mats.gildedTrimMat);
      tray.position.y = tierY;
      rack.add(tray);

      for (let w = -2; w <= 2; w++) {
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.055, 0.07, 8), mats.agedBronzeMat);
        cup.position.set(w * 0.34, tierY + 0.07, 0);
        rack.add(cup);

        const fl = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.14, 6), diyoFlameMat);
        fl.position.set(w * 0.34, tierY + 0.16, 0);
        fl.visible = false;
        fl.userData.noMerge = true;
        fl.userData.nonCollidable = true;
        const hl = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), diyoHaloMat);
        hl.position.copy(fl.position);
        hl.visible = false;
        hl.userData.noMerge = true;
        hl.userData.nonCollidable = true;
        rack.add(fl, hl);
        flames.push(fl);
        halos.push(hl);
      }
    }

    const rackLight = new THREE.PointLight(0xffaa44, 0, 12, 1.7);
    rackLight.position.set(rackLx, c.courtyardY + 1.65, rackLz);
    rackLight.userData.warmFlicker = true;
    rackLight.userData.flickerAmp = 0.12;
    rackLight.userData.intensityScale = 0;
    group.add(rackLight);
    beaconLights.push(rackLight);

    const hitTarget = new THREE.Mesh(
      new THREE.SphereGeometry(1.45, 8, 8),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    hitTarget.position.set(rackLx, c.courtyardY + 1.1, rackLz);
    hitTarget.userData.noMerge = true;
    hitTarget.userData.nonCollidable = true;
    hitTarget.userData.pashupatiRackIndex = rackIdx;
    group.add(hitTarget);
    gheeLampHitTargets.push(hitTarget);

    rackStates.push({ lit: false, flames, halos, light: rackLight });
    group.add(rack);
  });

  const toggleGheeLampRack = (idx: number): boolean => {
    const st = rackStates[idx];
    if (!st) return false;
    st.lit = !st.lit;
    for (const fl of st.flames) fl.visible = st.lit;
    for (const hl of st.halos) hl.visible = st.lit;
    st.light.userData.intensityScale = st.lit ? 2.1 : 0;
    return st.lit;
  };

  // =========================================================================
  // 8. RUDRAKSHA & BEL TREES ON CHAUTARAS + SUNKEN DHUNGE DHARA WATER SPOUT
  // =========================================================================
  const treeFoliageMat = new THREE.MeshStandardMaterial({ color: 0x2c6b36, roughness: 0.78 });
  for (const ct of PASHUPATI_CHAUTARA_TREES) {
    const ch = new THREE.Group();
    ch.position.set(ct.localX, c.courtyardY, ct.localZ);
    const plat = new THREE.Mesh(
      new THREE.BoxGeometry(ct.platformHalf * 2, 0.85, ct.platformHalf * 2),
      mats.dachiAppaBrickMat,
    );
    plat.position.y = 0.425;
    plat.castShadow = true;
    plat.receiveShadow = true;
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(ct.platformHalf * 2 + 0.18, 0.14, ct.platformHalf * 2 + 0.18),
      mats.sandstoneCopingMat,
    );
    cap.position.y = 0.9;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.38, 4.2, 10),
      mats.carvedSalWoodMat,
    );
    trunk.position.y = 2.9;
    trunk.castShadow = true;
    ch.add(plat, cap, trunk);

    const canopyOffsets: Array<[number, number, number, number]> =
      ct.species === 'rudraksha'
        ? [
            [0, 5.6, 0, 2.1],
            [-1.3, 4.9, 0.9, 1.45],
            [1.4, 5.1, -0.7, 1.55],
            [0.4, 6.4, 0.5, 1.35],
          ]
        : [
            [0, 5.4, 0, 1.85],
            [-1.1, 4.8, -0.8, 1.3],
            [1.2, 4.9, 0.9, 1.35],
          ];
    for (const [cx, cy, cz, cr] of canopyOffsets) {
      const leafBall = new THREE.Mesh(new THREE.DodecahedronGeometry(cr, 1), treeFoliageMat);
      leafBall.position.set(cx, cy, cz);
      leafBall.castShadow = true;
      ch.add(leafBall);
    }
    group.add(ch);
  }

  // Sunken Dhunge Dhara Basin with Carved Makara Spout (local -36, -16)
  const dhara = new THREE.Group();
  dhara.position.set(-36.0, c.courtyardY, -16.0);
  const rimFrame = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.42, 5.6), mats.granitePlinthMat);
  rimFrame.position.y = 0.21;
  const basinPoolMat = new THREE.MeshStandardMaterial({
    color: 0x1a6872,
    roughness: 0.14,
    metalness: 0.15,
    transparent: true,
    opacity: 0.88,
  });
  const basinWater = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), basinPoolMat);
  basinWater.rotation.x = -Math.PI * 0.5;
  basinWater.position.y = 0.43;
  const makaraWall = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.45, 0.85), mats.dachiAppaBrickMat);
  makaraWall.position.set(0, 0.95, -2.35);
  const makaraSpout = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.26, 0.95), mats.gildedTrimMat);
  makaraSpout.position.set(0, 1.15, -1.78);
  const spoutStream = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.085, 0.72, 8),
    basinPoolMat,
  );
  spoutStream.position.set(0, 0.78, -1.32);
  spoutStream.rotation.x = 0.22;
  spoutStream.userData.noMerge = true;
  spoutStream.userData.nonCollidable = true;
  dhara.add(rimFrame, basinWater, makaraWall, makaraSpout, spoutStream);

  // Brass & Terracotta Gagro water pots beside Dhunge Dhara
  for (const [gx, gz] of [
    [-2.1, 2.3],
    [2.0, 2.2],
  ] as Array<[number, number]>) {
    const pot = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), mats.gildedCopperRoofMat);
    pot.position.set(gx, 0.28, gz);
    const neckRim = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.035, 6, 12), mats.gildedTrimMat);
    neckRim.rotation.x = Math.PI * 0.5;
    neckRim.position.set(gx, 0.54, gz);
    dhara.add(pot, neckRim);
  }
  group.add(dhara);

  // =========================================================================
  // 9. ANIMATED COURTYARD PIGEONS & TEMPLE MACAQUES
  // =========================================================================
  const pigeonFlockGroup = new THREE.Group();
  pigeonFlockGroup.userData.noMerge = true;
  pigeonFlockGroup.userData.nonCollidable = true;
  const pigeonBodyMat = new THREE.MeshStandardMaterial({ color: 0x7b8694, roughness: 0.75 });
  const pigeonWingMat = new THREE.MeshStandardMaterial({ color: 0x525d6c, roughness: 0.75 });

  const pigeons: Array<{
    root: THREE.Group;
    leftWing: THREE.Mesh;
    rightWing: THREE.Mesh;
    mode: 'peck' | 'circle';
    baseX: number;
    baseZ: number;
    phase: number;
  }> = [];

  const groundPigeonCoords: Array<[number, number]> = [
    [-28, 8], [-27, 9.5], [-29, 7], [-31, 10], [-22, -6], [-21, -7.5],
    [-14, 15], [-16, 17], [15, 22], [17, 21],
  ];
  groundPigeonCoords.forEach(([px, pz], idx) => {
    const pg = new THREE.Group();
    pg.position.set(px, c.courtyardY + 0.08, pz);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), pigeonBodyMat);
    body.scale.set(1.35, 0.85, 0.85);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.065, 6, 6), pigeonBodyMat);
    head.position.set(0.14, 0.09, 0);
    const lw = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.14), pigeonWingMat);
    lw.position.set(-0.02, 0.04, 0.08);
    const rw = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.14), pigeonWingMat);
    rw.position.set(-0.02, 0.04, -0.08);
    pg.add(body, head, lw, rw);
    pigeonFlockGroup.add(pg);
    pigeons.push({ root: pg, leftWing: lw, rightWing: rw, mode: 'peck', baseX: px, baseZ: pz, phase: idx * 1.1 });
  });

  for (let idx = 0; idx < 6; idx++) {
    const pg = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), pigeonBodyMat);
    body.scale.set(1.4, 0.85, 0.85);
    const lw = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.22), pigeonWingMat);
    lw.position.set(0, 0.04, 0.14);
    const rw = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.22), pigeonWingMat);
    rw.position.set(0, 0.04, -0.14);
    pg.add(body, lw, rw);
    pigeonFlockGroup.add(pg);
    pigeons.push({ root: pg, leftWing: lw, rightWing: rw, mode: 'circle', baseX: 0, baseZ: 0, phase: idx * 1.05 });
  }
  group.add(pigeonFlockGroup);

  // Temple Macaque Monkeys perched peacefully along eaves, Ghanta Pavilion & Chautara stone edges
  const monkeyMat = new THREE.MeshStandardMaterial({ color: 0x8b6245, roughness: 0.82 });
  const monkeys: Array<{ head: THREE.Mesh; tail: THREE.Mesh; phase: number }> = [];
  const monkeySpots: Array<[number, number, number, number]> = [
    [-25.0, c.courtyardY + 4.02, 16.0, 0.3],
    [-38.0, c.courtyardY + 0.97, 22.0, -0.7],
    [32.0, c.courtyardY + 0.97, 36.2, -1.8],
    [32.0, c.courtyardY + 0.97, -36.2, 2.2],
  ];
  monkeySpots.forEach(([mx, my, mz, mRot], idx) => {
    const mk = new THREE.Group();
    mk.userData.noMerge = true;
    mk.userData.nonCollidable = true;
    mk.position.set(mx, my, mz);
    mk.rotation.y = mRot;
    const torsoM = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), monkeyMat);
    torsoM.scale.set(0.85, 1.25, 0.85);
    torsoM.position.y = 0.22;
    const headM = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), monkeyMat);
    headM.position.set(0, 0.52, 0.06);
    const tailM = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.58, 6), monkeyMat);
    tailM.position.set(0, 0.25, -0.25);
    tailM.rotation.x = -0.65;
    mk.add(torsoM, headM, tailM);
    group.add(mk);
    monkeys.push({ head: headM, tail: tailM, phase: idx * 1.7 });
  });

  // Animator Driver for Courtyard (flames flicker, Trishul crimson ribbons, pigeons, monkeys)
  const animController = new THREE.Object3D();
  animController.userData.noMerge = true;
  animController.userData.onEnvironmentUpdate = (env: { elapsed: number; windSpeed?: number }) => {
    const t = env.elapsed;
    const wind = Math.max(0.3, env.windSpeed ?? 0.6);

    for (let i = 0; i < trishulRibbons.length; i++) {
      trishulRibbons[i].rotation.z = Math.sin(t * 2.8 + i) * 0.14 * wind;
      trishulRibbons[i].rotation.x = Math.cos(t * 2.1 + i) * 0.1 * wind;
    }

    for (const st of rackStates) {
      if (!st.lit) continue;
      for (let i = 0; i < st.flames.length; i++) {
        const s = 0.88 + 0.18 * Math.sin(t * 9.2 + i * 1.3);
        st.flames[i].scale.set(1, s, 1);
        st.halos[i].scale.setScalar(0.92 + 0.14 * Math.cos(t * 7.4 + i));
      }
    }

    for (const pg of pigeons) {
      if (pg.mode === 'peck') {
        const hop = Math.max(0, Math.sin(t * 3.8 + pg.phase));
        pg.root.position.set(
          pg.baseX + Math.sin(t * 0.6 + pg.phase) * 0.32,
          c.courtyardY + 0.08 + hop * 0.04,
          pg.baseZ + Math.cos(t * 0.5 + pg.phase) * 0.28,
        );
        pg.root.rotation.y = Math.sin(t * 0.8 + pg.phase) * 1.4;
        pg.root.rotation.z = Math.sin(t * 6.5 + pg.phase) > 0.5 ? -0.32 : 0;
      } else {
        const ang = t * 0.48 + pg.phase;
        const rad = 18.5 + Math.sin(t * 0.3 + pg.phase) * 2.5;
        pg.root.position.set(
          Math.cos(ang) * rad,
          15.5 + Math.sin(t * 0.9 + pg.phase) * 1.2,
          Math.sin(ang) * rad,
        );
        pg.root.rotation.y = -ang + Math.PI * 0.5;
        const flap = Math.sin(t * 14.0 + pg.phase) * 0.65;
        pg.leftWing.rotation.x = flap;
        pg.rightWing.rotation.x = -flap;
      }
    }

    for (const mk of monkeys) {
      mk.head.rotation.y = Math.sin(t * 1.3 + mk.phase) * 0.45;
      mk.tail.rotation.z = Math.sin(t * 2.0 + mk.phase) * 0.22;
    }
  };
  group.add(animController);
  animatedNodes.push(animController);

  mergeStaticMeshesByMaterial(group, { preserveCustomShaderMaterials: true });

  return {
    group,
    beaconLights,
    animatedNodes,
    templeBells,
    nandiHitTarget,
    gheeLampHitTargets,
    toggleGheeLampRack,
  };
}

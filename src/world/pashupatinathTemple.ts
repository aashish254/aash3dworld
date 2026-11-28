import * as THREE from 'three';
import { mergeStaticMeshesByMaterial } from './meshOptimization';
import { PASHUPATI_COMPLEX } from './pashupatinathData';
import { PashupatinathPbrMaterials } from './pashupatinathTextures';

export interface PashupatinathTempleBuild {
  group: THREE.Group;
  beaconLights: THREE.PointLight[];
  animatedNodes: THREE.Object3D[];
  cameraOccluders: THREE.Object3D[];
  templeBells: THREE.Group[];
  lingamHitTarget: THREE.Mesh;
  triggerLingamOffering: () => void;
}

/**
 * Generates a square concave-flared Nepali pagoda roof geometry with raised radial ribs
 * and upturned Kuna corner eaves.
 */
function createConcavePagodaRoofGeometry(
  outerHalf: number,
  innerHalf: number,
  height: number,
  cornerLift: number,
  radialSegs = 24,
): THREE.BufferGeometry {
  const segsPerEdge = radialSegs;
  const ringSegs = 8;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Build 4 triangular/trapezoidal quadrants (N, E, S, W) so ribs & UVs align radially
  for (let side = 0; side < 4; side++) {
    const angle = (side * Math.PI) / 2;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const baseVertOffset = positions.length / 3;

    for (let r = 0; r <= ringSegs; r++) {
      const v = r / ringSegs; // 0 = top ridge, 1 = outer eave
      const halfSpan = THREE.MathUtils.lerp(innerHalf, outerHalf, v);
      // Concave bell-curve sag characteristic of Newari tiered roofs
      const bellY = height * (1 - Math.pow(v, 0.72));

      for (let s = 0; s <= segsPerEdge; s++) {
        const u = (s / segsPerEdge) * 2 - 1; // -1 .. +1 across edge
        const lx = u * halfSpan;
        const lz = halfSpan;
        const wx = lx * cosA - lz * sinA;
        const wz = lx * sinA + lz * cosA;

        // Upturned Kuna corner flare near eaves
        const cornerFactor = Math.pow(Math.abs(u), 2.4) * Math.pow(v, 1.8);
        // Subtle vertical standing-seam rib modulation
        const ribWave = Math.sin((s / segsPerEdge) * Math.PI * 12) * 0.028 * v;
        const wy = bellY + cornerFactor * cornerLift + ribWave;

        positions.push(wx, wy, wz);
        uvs.push(s / segsPerEdge, v);
      }
    }

    const rowStride = segsPerEdge + 1;
    for (let r = 0; r < ringSegs; r++) {
      for (let s = 0; s < segsPerEdge; s++) {
        const a = baseVertOffset + r * rowStride + s;
        const b = a + 1;
        const c = a + rowStride;
        const d = c + 1;
        indices.push(a, c, b);
        indices.push(b, c, d);
      }
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
 * Builds an ornate multi-tier carved silver/gilded Torana tympanum crowned by Chepu & Makaras.
 */
function createToranaGroup(
  width: number,
  toranaMat: THREE.Material,
  silverMat: THREE.Material,
  goldMat: THREE.Material,
): THREE.Group {
  const torana = new THREE.Group();
  const baseBeam = new THREE.Mesh(new THREE.BoxGeometry(width, 0.24, 0.24), silverMat);
  torana.add(baseBeam);

  // Semicircular repoussé tympanum arch
  const arch = new THREE.Mesh(
    new THREE.CylinderGeometry(width * 0.45, width * 0.48, 0.16, 18, 1, false, 0, Math.PI),
    toranaMat,
  );
  arch.rotation.z = Math.PI * 0.5;
  arch.rotation.y = Math.PI * 0.5;
  arch.position.y = 0.12;
  torana.add(arch);

  // Chepu (Kirtimukha) guardian crest at apex
  const chepu = new THREE.Mesh(new THREE.DodecahedronGeometry(width * 0.14, 0), goldMat);
  chepu.scale.set(1.25, 0.95, 0.65);
  chepu.position.set(0, width * 0.45, 0.08);
  torana.add(chepu);

  // Flanking Makara finials
  for (const sx of [-1, 1]) {
    const makara = new THREE.Mesh(new THREE.ConeGeometry(width * 0.085, width * 0.24, 6), goldMat);
    makara.rotation.z = sx * -0.85;
    makara.position.set(sx * width * 0.48, 0.22, 0.08);
    torana.add(makara);
  }
  return torana;
}

/**
 * Builds the 24m x 24m x 26m Monumental Main Pashupatinath Pagoda Temple
 * with 3-tier Peti plinth, 4 open cardinal silver portals, 48 carved 45-deg Tudal struts,
 * 88 instanced bronze Kinkini wind bells, 3 shimmering Pataka banners, crowning triple Gajur & Trishul,
 * walkable interior Pradakshina gallery, 16 octagonal Sal-wood pillars, and central Chaturmukha Shiva Lingam.
 */
export function buildPashupatinathMainPagoda(
  mats: PashupatinathPbrMaterials,
): PashupatinathTempleBuild {
  const c = PASHUPATI_COMPLEX;
  const group = new THREE.Group();
  group.name = 'PashupatinathMainPagoda';

  const beaconLights: THREE.PointLight[] = [];
  const animatedNodes: THREE.Object3D[] = [];
  const cameraOccluders: THREE.Object3D[] = [];
  const templeBells: THREE.Group[] = [];

  const diyoFlameMat = new THREE.MeshStandardMaterial({
    color: 0xffe4a0,
    emissive: 0xf59e0b,
    emissiveIntensity: 3.1,
    roughness: 0.2,
  });

  // =========================================================================
  // 1. THREE-TIER STEPPED GRANITE PLINTH (PETI) — 24m x 24m, +1.80m above courtyard
  // =========================================================================
  const tiers = [
    { half: 12.0, yBot: c.courtyardY, h: 0.60 },
    { half: 11.1, yBot: c.courtyardY + 0.60, h: 0.60 },
    { half: 10.2, yBot: c.courtyardY + 1.20, h: 0.60 },
  ];
  for (const t of tiers) {
    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(t.half * 2, t.h, t.half * 2),
      mats.granitePlinthMat,
    );
    slab.position.y = t.yBot + t.h * 0.5;
    slab.receiveShadow = true;
    slab.castShadow = true;
    group.add(slab);

    // Carved stone cornice molding rim
    const molding = new THREE.Mesh(
      new THREE.BoxGeometry(t.half * 2 + 0.14, 0.11, t.half * 2 + 0.14),
      mats.sandstoneCopingMat,
    );
    molding.position.y = t.yBot + t.h - 0.04;
    group.add(molding);
  }

  // Polished stone sanctum & Pradakshina floor inlay (y = 2.15m)
  const sanctumDeck = new THREE.Mesh(
    new THREE.BoxGeometry(19.6, 0.06, 19.6),
    mats.sanctumFloorMat,
  );
  sanctumDeck.position.y = c.plinthDeckY - 0.01;
  sanctumDeck.receiveShadow = true;
  group.add(sanctumDeck);

  // Concentric inlaid brass mandala strips on interior floor
  for (const r of [3.25, 5.4, 7.1]) {
    const brassRing = new THREE.Mesh(
      new THREE.RingGeometry(r - 0.06, r + 0.06, 48),
      mats.gildedTrimMat,
    );
    brassRing.rotation.x = -Math.PI * 0.5;
    brassRing.position.y = c.plinthDeckY + 0.025;
    group.add(brassRing);
  }

  // Four Wide Cardinal Ceremonial Granite Stairways (|u| <= 2.3m) + Cheek Walls
  const stairSteps = 9;
  for (let side = 0; side < 4; side++) {
    const dirAngle = (side * Math.PI) / 2;
    const stairGroup = new THREE.Group();
    stairGroup.rotation.y = dirAngle;

    for (let s = 0; s < stairSteps; s++) {
      const t = (s + 0.5) / stairSteps;
      const stepY = c.courtyardY + t * (c.plinthDeckY - c.courtyardY);
      const stepZ = 12.9 - t * 2.7;
      const stepMesh = new THREE.Mesh(
        new THREE.BoxGeometry(4.6, stepY - c.courtyardY + 0.08, 0.36),
        mats.graniteFlagstoneMat,
      );
      stepMesh.position.set(0, c.courtyardY + (stepY - c.courtyardY) * 0.5, stepZ);
      stepMesh.receiveShadow = true;
      stepMesh.castShadow = true;
      stairGroup.add(stepMesh);
    }

    // Sloped stone cheek balustrades
    for (const sx of [-2.68, 2.68]) {
      const cheek = new THREE.Mesh(
        new THREE.BoxGeometry(0.66, 1.15, 2.95),
        mats.granitePlinthMat,
      );
      cheek.position.set(sx, c.courtyardY + 0.85, 11.55);
      cheek.rotation.x = 0.54;
      cheek.castShadow = true;
      stairGroup.add(cheek);

      const post = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.1, 0.72), mats.granitePlinthMat);
      post.position.set(sx, c.courtyardY + 0.55, 13.05);
      const lionOrUrn = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), mats.gildedTrimMat);
      lionOrUrn.position.set(sx, c.courtyardY + 1.24, 13.05);
      stairGroup.add(post, lionOrUrn);
    }
    group.add(stairGroup);
  }

  // Corner Stone Guardian Elephants at (±10.6, ±10.6)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const elephant = new THREE.Group();
      elephant.position.set(sx * 10.65, c.courtyardY + 1.2, sz * 10.65);
      elephant.rotation.y = Math.atan2(sx, sz);

      const ped = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.52, 1.3), mats.granitePlinthMat);
      ped.position.y = 0.26;
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.68, 1.05), mats.granitePlinthMat);
      body.position.y = 0.86;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), mats.granitePlinthMat);
      head.position.set(0, 1.04, 0.52);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.55, 8), mats.granitePlinthMat);
      trunk.position.set(0, 0.78, 0.78);
      trunk.rotation.x = 0.35;
      const caparison = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.24, 0.68), mats.crimsonTrimMat);
      caparison.position.set(0, 1.08, 0.02);
      elephant.add(ped, body, head, trunk, caparison);
      group.add(elephant);
    }
  }

  // =========================================================================
  // 2. LOWER SANCTUM WALLS (15.6m x 15.6m) + 4 OPEN SILVER PORTALS + WOODWORK
  // =========================================================================
  const wallBaseY = c.plinthDeckY;
  const wallH = 7.25; // up to y = 9.40m
  const doorW = c.sanctumDoorHalf * 2; // 3.5m clear open portal
  const doorH = 4.15;
  const wallSideHalf = c.sanctumOuterHalf; // 7.8m
  const wallMidR = c.sanctumOuterHalf - c.sanctumWallThick * 0.5; // 7.34m

  const wallOccludersGroup = new THREE.Group();
  wallOccludersGroup.name = 'PashupatiSanctumWalls';
  group.add(wallOccludersGroup);
  cameraOccluders.push(wallOccludersGroup);

  for (let side = 0; side < 4; side++) {
    const face = new THREE.Group();
    face.rotation.y = (side * Math.PI) / 2;

    // Left & Right solid Dachi Appa brick wall piers framing the open 3.5m doorway
    const pierLen = wallSideHalf - c.sanctumDoorHalf; // 6.05m
    const pierCenterU = c.sanctumDoorHalf + pierLen * 0.5; // 4.775m
    for (const sx of [-1, 1]) {
      const pier = new THREE.Mesh(
        new THREE.BoxGeometry(pierLen, wallH, c.sanctumWallThick),
        mats.dachiAppaBrickMat,
      );
      pier.position.set(sx * pierCenterU, wallBaseY + wallH * 0.5, wallMidR);
      pier.castShadow = true;
      pier.receiveShadow = true;
      face.add(pier);

      // Carved Sal-wood corner pilaster
      const cornerPost = new THREE.Mesh(
        new THREE.BoxGeometry(0.68, wallH + 0.12, 0.98),
        mats.carvedSalWoodMat,
      );
      cornerPost.position.set(sx * (wallSideHalf - 0.16), wallBaseY + wallH * 0.5, wallMidR);
      face.add(cornerPost);

      // Blind carved Ankhi Jhya / Tikijhya wooden lattice window centered on pier
      const winFrame = new THREE.Mesh(
        new THREE.BoxGeometry(1.75, 1.95, 0.22),
        mats.carvedSalWoodMat,
      );
      winFrame.position.set(sx * 4.95, wallBaseY + 2.85, wallSideHalf + 0.05);
      const lattice = new THREE.Mesh(
        new THREE.BoxGeometry(1.35, 1.48, 0.14),
        mats.salLatticeMat,
      );
      lattice.position.set(sx * 4.95, wallBaseY + 2.85, wallSideHalf + 0.14);
      face.add(winFrame, lattice);

      // Recessed Gwakhap wall niche with flickering brass Diyo oil lamp
      const nicheFrame = new THREE.Mesh(
        new THREE.BoxGeometry(0.86, 1.05, 0.18),
        mats.carvedSalWoodMat,
      );
      nicheFrame.position.set(sx * 3.05, wallBaseY + 1.45, wallSideHalf + 0.04);
      const diyoBowl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.1, 0.12, 10),
        mats.gildedTrimMat,
      );
      diyoBowl.position.set(sx * 3.05, wallBaseY + 1.18, wallSideHalf + 0.16);
      const diyoFlame = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), diyoFlameMat);
      diyoFlame.scale.set(0.8, 1.45, 0.8);
      diyoFlame.position.set(sx * 3.05, wallBaseY + 1.32, wallSideHalf + 0.16);
      face.add(nicheFrame, diyoBowl, diyoFlame);
    }

    // Upper Dachi Appa masonry header above doorway (y: doorH .. wallH)
    const headerH = wallH - doorH;
    const header = new THREE.Mesh(
      new THREE.BoxGeometry(doorW + 0.2, headerH, c.sanctumWallThick),
      mats.dachiAppaSootMat,
    );
    header.position.set(0, wallBaseY + doorH + headerH * 0.5, wallMidR);
    header.castShadow = true;
    face.add(header);

    // Multi-level horizontal carved Sal-wood cornices
    for (const cy of [wallBaseY + 4.25, wallBaseY + 6.95]) {
      const cornice = new THREE.Mesh(
        new THREE.BoxGeometry(wallSideHalf * 2 + 0.42, 0.28, 0.34),
        mats.carvedSalWoodMat,
      );
      cornice.position.set(0, cy, wallSideHalf + 0.1);
      face.add(cornice);
    }

    // Repoussé Silver Portal Frame + Open Swinging Silver Double Doors + Knockers + Torana
    const silverPortalTop = new THREE.Mesh(
      new THREE.BoxGeometry(doorW + 0.95, 0.46, c.sanctumWallThick + 0.22),
      mats.repousseSilverMat,
    );
    silverPortalTop.position.set(0, wallBaseY + doorH - 0.12, wallMidR);
    face.add(silverPortalTop);

    for (const sx of [-1, 1]) {
      const jamb = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, doorH, c.sanctumWallThick + 0.22),
        mats.repousseSilverMat,
      );
      jamb.position.set(sx * (c.sanctumDoorHalf + 0.2), wallBaseY + doorH * 0.5, wallMidR);
      face.add(jamb);

      // Open swung silver double-leaf door pinned outward against jambs so pathway stays 100% clear
      const leaf = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, doorH - 0.35, 1.45),
        mats.repousseSilverMat,
      );
      leaf.position.set(sx * (c.sanctumDoorHalf + 0.04), wallBaseY + (doorH - 0.35) * 0.5, wallMidR + 0.85);
      leaf.rotation.y = sx * -0.18;
      face.add(leaf);

      // Brass circular lion-ring door knocker
      const knocker = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.032, 8, 14), mats.gildedTrimMat);
      knocker.rotation.y = Math.PI * 0.5;
      knocker.position.set(sx * (c.sanctumDoorHalf - 0.06), wallBaseY + 1.85, wallMidR + 1.05);
      face.add(knocker);

      // Life-size Silver-and-Brass Dvarapala Door Guardian beside portal
      const guard = new THREE.Group();
      guard.position.set(sx * 2.45, wallBaseY, wallSideHalf + 0.52);
      const gPed = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.35, 0.75), mats.granitePlinthMat);
      gPed.position.y = 0.175;
      const gTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 1.25, 10), mats.repousseSilverMat);
      gTorso.position.y = 0.98;
      const gHead = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), mats.gildedTrimMat);
      gHead.position.y = 1.78;
      const gCrown = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.36, 8), mats.gildedTrimMat);
      gCrown.position.y = 2.08;
      const gMace = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, 1.45, 8), mats.gildedTrimMat);
      gMace.position.set(sx * -0.32, 1.05, 0.15);
      guard.add(gPed, gTorso, gHead, gCrown, gMace);
      face.add(guard);
    }

    const torana = createToranaGroup(
      doorW + 0.8,
      mats.toranaGildedMat,
      mats.repousseSilverMat,
      mats.gildedTrimMat,
    );
    torana.position.set(0, wallBaseY + doorH + 0.12, wallSideHalf + 0.18);
    face.add(torana);

    // Interior wall-mounted glowing brass Diyos flanking inside portal
    for (const sx of [-1, 1]) {
      const inDiyo = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.08, 0.1, 8), mats.gildedTrimMat);
      inDiyo.position.set(sx * 2.55, wallBaseY + 1.85, wallMidR - 0.62);
      const inFlame = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), diyoFlameMat);
      inFlame.scale.set(0.8, 1.5, 0.8);
      inFlame.position.set(sx * 2.55, wallBaseY + 1.98, wallMidR - 0.62);
      face.add(inDiyo, inFlame);
    }

    wallOccludersGroup.add(face);
  }

  // =========================================================================
  // 3. DOUBLE-TIER GILDED COPPER ROOFS (22.4m & 14.4m), 48 TUDAL STRUTS & BELLS
  // =========================================================================
  const roofSection = new THREE.Group();
  group.add(roofSection);
  cameraOccluders.push(roofSection);

  // Lower Pagoda Roof (y: 9.25 .. 13.85m, 22.4m eaves span -> half=11.2m)
  const lowerRoofY = 9.25;
  const lowerRoof = new THREE.Mesh(
    createConcavePagodaRoofGeometry(11.2, 5.2, 4.6, 0.72, 24),
    mats.gildedCopperRoofMat,
  );
  lowerRoof.position.y = lowerRoofY;
  lowerRoof.castShadow = true;
  lowerRoof.receiveShadow = true;
  roofSection.add(lowerRoof);

  // Under-eave timber cornice ring
  const lowerEaveBeam = new THREE.Mesh(
    new THREE.BoxGeometry(22.1, 0.24, 22.1),
    mats.carvedSalWoodMat,
  );
  lowerEaveBeam.position.y = lowerRoofY - 0.05;
  roofSection.add(lowerEaveBeam);

  // Corner phoenix finials on lower roof eaves
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const bird = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.85, 8), mats.gildedTrimMat);
      bird.position.set(sx * 11.15, lowerRoofY + 0.95, sz * 11.15);
      bird.rotation.z = sx * -0.45;
      bird.rotation.x = sz * 0.45;
      roofSection.add(bird);
    }
  }

  // Upper Clerestory (10.2m x 10.2m, y: 13.7..16.75m)
  const upperStory = new THREE.Mesh(
    new THREE.BoxGeometry(10.0, 3.05, 10.0),
    mats.dachiAppaSootMat,
  );
  upperStory.position.y = 15.22;
  upperStory.castShadow = true;
  roofSection.add(upperStory);

  const upperLattice = new THREE.Mesh(
    new THREE.BoxGeometry(10.35, 1.85, 10.35),
    mats.salLatticeMat,
  );
  upperLattice.position.y = 15.1;
  roofSection.add(upperLattice);

  // Upper Pagoda Roof (y: 16.6 .. 20.6m, 14.4m eaves span -> half=7.2m)
  const upperRoofY = 16.6;
  const upperRoof = new THREE.Mesh(
    createConcavePagodaRoofGeometry(7.2, 2.2, 4.0, 0.56, 20),
    mats.gildedCopperRoofMat,
  );
  upperRoof.position.y = upperRoofY;
  upperRoof.castShadow = true;
  roofSection.add(upperRoof);

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const bird = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.65, 8), mats.gildedTrimMat);
      bird.position.set(sx * 7.15, upperRoofY + 0.72, sz * 7.15);
      bird.rotation.z = sx * -0.45;
      bird.rotation.x = sz * 0.45;
      roofSection.add(bird);
    }
  }

  // 48 Carved 45-deg Sal-Wood Tudal Struts (32 lower roof + 16 upper roof)
  for (let side = 0; side < 4; side++) {
    const face = new THREE.Group();
    face.rotation.y = (side * Math.PI) / 2;
    // 8 lower struts per face = 32
    for (let i = 0; i < 8; i++) {
      const u = -6.8 + (i / 7) * 13.6;
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.24, 3.35, 0.28), mats.carvedSalWoodMat);
      strut.position.set(u, 8.15, 8.95);
      strut.rotation.x = 0.72;
      const motif = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), mats.gildedTrimMat);
      motif.scale.set(0.75, 1.35, 0.75);
      motif.position.set(u, 8.15, 9.15);
      face.add(strut, motif);
    }
    // 4 upper struts per face = 16 -> Total = 48 Tudal struts!
    for (let i = 0; i < 4; i++) {
      const u = -3.4 + (i / 3) * 6.8;
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.35, 0.24), mats.carvedSalWoodMat);
      strut.position.set(u, 15.8, 5.95);
      strut.rotation.x = 0.72;
      face.add(strut);
    }
    roofSection.add(face);
  }

  // Perimeter Swaying Bronze Wind Bells (Kinkini) along both eaves — Single InstancedMesh (88 bells)
  const bellPositions: Array<{ x: number; y: number; z: number; phase: number }> = [];
  for (let side = 0; side < 4; side++) {
    const ang = (side * Math.PI) / 2;
    const cosA = Math.cos(ang);
    const sinA = Math.sin(ang);
    // 14 bells per lower edge = 56
    for (let i = 0; i < 14; i++) {
      const u = -10.5 + (i / 13) * 21.0;
      const wx = u * cosA - 11.15 * sinA;
      const wz = u * sinA + 11.15 * cosA;
      bellPositions.push({ x: wx, y: lowerRoofY - 0.22, z: wz, phase: i * 0.43 + side });
    }
    // 8 bells per upper edge = 32 -> Total = 88 bells
    for (let i = 0; i < 8; i++) {
      const u = -6.5 + (i / 7) * 13.0;
      const wx = u * cosA - 7.12 * sinA;
      const wz = u * sinA + 7.12 * cosA;
      bellPositions.push({ x: wx, y: upperRoofY - 0.2, z: wz, phase: i * 0.57 + side });
    }
  }
  const kinkiniGeo = new THREE.ConeGeometry(0.14, 0.34, 8);
  const kinkiniInst = new THREE.InstancedMesh(kinkiniGeo, mats.agedBronzeMat, bellPositions.length);
  kinkiniInst.name = 'PashupatiKinkiniBells';
  kinkiniInst.userData.noMerge = true;
  kinkiniInst.userData.noSpin = true;
  const kDummy = new THREE.Object3D();
  for (let i = 0; i < bellPositions.length; i++) {
    kDummy.position.set(bellPositions[i].x, bellPositions[i].y, bellPositions[i].z);
    kDummy.rotation.set(0, 0, 0);
    kDummy.updateMatrix();
    kinkiniInst.setMatrixAt(i, kDummy.matrix);
  }
  kinkiniInst.instanceMatrix.needsUpdate = true;
  kinkiniInst.userData.onEnvironmentUpdate = (env: { elapsed: number; windSpeed: number }) => {
    const amp = 0.08 + Math.min(0.18, env.windSpeed * 0.09);
    for (let i = 0; i < bellPositions.length; i++) {
      const bp = bellPositions[i];
      kDummy.position.set(bp.x, bp.y, bp.z);
      kDummy.rotation.set(
        Math.sin(env.elapsed * 2.8 + bp.phase) * amp,
        0,
        Math.cos(env.elapsed * 2.3 + bp.phase) * amp * 0.65,
      );
      kDummy.updateMatrix();
      kinkiniInst.setMatrixAt(i, kDummy.matrix);
    }
    kinkiniInst.instanceMatrix.needsUpdate = true;
  };
  roofSection.add(kinkiniInst);
  animatedNodes.push(kinkiniInst);

  // 3 Shimmering Vertical Gilded Pataka Banners draping flush down the West (front) roof slope
  const patakaGroup = new THREE.Group();
  patakaGroup.userData.noMerge = true;
  patakaGroup.userData.noSpin = true;
  const patakaStrips: THREE.Mesh[] = [];
  for (const pz of [-1.2, 0, 1.2]) {
    const strip = new THREE.Mesh(
      new THREE.PlaneGeometry(0.56, 7.3, 2, 8),
      mats.gildedTrimMat,
    );
    strip.position.set(-7.95, 11.72, pz);
    strip.rotation.order = 'YXZ';
    strip.rotation.y = -Math.PI * 0.5;
    strip.rotation.x = -0.88;
    patakaGroup.add(strip);
    patakaStrips.push(strip);
  }
  patakaGroup.userData.onEnvironmentUpdate = (env: { elapsed: number }) => {
    for (let i = 0; i < patakaStrips.length; i++) {
      patakaStrips[i].rotation.x = -0.88 + Math.sin(env.elapsed * 2.1 + i * 0.9) * 0.025;
    }
  };
  roofSection.add(patakaGroup);
  animatedNodes.push(patakaGroup);

  // Crowning Triple Golden Gajur + Tall Golden Trishul wrapped in fluttering crimson cloth (up to 26.2m)
  const summitBaseY = upperRoofY + 3.95; // 20.55m
  const summitPlinth = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 0.62, 4.4),
    mats.gildedTrimMat,
  );
  summitPlinth.position.y = summitBaseY;
  roofSection.add(summitPlinth);

  const gajurPts = [
    new THREE.Vector2(0.01, 0),
    new THREE.Vector2(1.05, 0.35),
    new THREE.Vector2(0.55, 1.15),
    new THREE.Vector2(0.82, 1.85),
    new THREE.Vector2(0.32, 2.75),
    new THREE.Vector2(0.42, 3.25),
    new THREE.Vector2(0.06, 4.45),
    new THREE.Vector2(0, 4.85),
  ];
  const mainGajur = new THREE.Mesh(new THREE.LatheGeometry(gajurPts, 20), mats.gildedTrimMat);
  mainGajur.position.y = summitBaseY + 0.3;
  mainGajur.castShadow = true;
  roofSection.add(mainGajur);

  for (const sz of [-1.45, 1.45]) {
    const sideGajur = new THREE.Mesh(new THREE.LatheGeometry(gajurPts, 14), mats.gildedTrimMat);
    sideGajur.scale.setScalar(0.54);
    sideGajur.position.set(0, summitBaseY + 0.3, sz);
    roofSection.add(sideGajur);
  }

  // Tall Golden Trishul behind central Gajur + fluttering crimson cloth
  const trishulStaff = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 5.4, 10),
    mats.gildedTrimMat,
  );
  trishulStaff.position.set(0.85, summitBaseY + 2.85, 0);
  const trishulArc = new THREE.Mesh(
    new THREE.TorusGeometry(0.52, 0.075, 8, 16, Math.PI),
    mats.gildedTrimMat,
  );
  trishulArc.rotation.y = Math.PI * 0.5;
  trishulArc.rotation.z = Math.PI;
  trishulArc.position.set(0.85, summitBaseY + 5.05, 0);
  const trishulCenterTip = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.85, 8), mats.gildedTrimMat);
  trishulCenterTip.position.set(0.85, summitBaseY + 5.65, 0);
  roofSection.add(trishulStaff, trishulArc, trishulCenterTip);

  const roofCloth = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 2.1, 2, 4), mats.crimsonClothMat);
  roofCloth.position.set(0.85, summitBaseY + 3.65, 0.25);
  roofCloth.userData.noMerge = true;
  roofCloth.userData.noSpin = true;
  roofCloth.userData.onEnvironmentUpdate = (env: { elapsed: number }) => {
    roofCloth.rotation.z = Math.sin(env.elapsed * 3.4) * 0.18;
    roofCloth.rotation.y = Math.cos(env.elapsed * 2.1) * 0.22;
  };
  roofSection.add(roofCloth);
  animatedNodes.push(roofCloth);

  // =========================================================================
  // 4. WALKABLE INTERIOR SANCTUM (PRADAKSHINA GALLERY & GARBHAGRIHA)
  // =========================================================================
  // 16 Carved Octagonal Sal-Wood Pillars on Stone Lotus Bases
  for (const px of [-5.25, -2.55, 2.55, 5.25]) {
    for (const pz of [-5.25, -2.55, 2.55, 5.25]) {
      if (Math.abs(px) < 3.0 && Math.abs(pz) < 3.0) continue; // keep center Garbhagriha clear
      const pillar = new THREE.Group();
      pillar.position.set(px, wallBaseY, pz);
      const lotusBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.34, 0.42, 0.36, 8),
        mats.granitePlinthMat,
      );
      lotusBase.position.y = 0.18;
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.27, 5.85, 8),
        mats.carvedSalWoodMat,
      );
      shaft.position.y = 3.25;
      const capital = new THREE.Mesh(
        new THREE.BoxGeometry(0.74, 0.28, 0.74),
        mats.carvedSalWoodMat,
      );
      capital.position.y = 6.28;
      pillar.add(lotusBase, shaft, capital);
      group.add(pillar);
    }
  }

  // Coffered Dark-Timber Interior Ceiling (y = 8.45m) with recessed central skylight mandala
  for (const [cx, cz, sx, sz] of [
    [0, -5.2, 14.0, 3.6],
    [0, 5.2, 14.0, 3.6],
    [-5.2, 0, 3.6, 6.8],
    [5.2, 0, 3.6, 6.8],
  ] as Array<[number, number, number, number]>) {
    const coffer = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.24, sz), mats.carvedSalWoodMat);
    coffer.position.set(cx, wallBaseY + 6.3, cz);
    roofSection.add(coffer);
  }

  // 4 Interior Hanging Bronze Sanctuary Bells in Pradakshina corners
  for (const [bx, bz] of [
    [-4.35, -4.35],
    [4.35, -4.35],
    [-4.35, 4.35],
    [4.35, 4.35],
  ] as Array<[number, number]>) {
    const bellGroup = new THREE.Group();
    bellGroup.position.set(bx, wallBaseY + 4.8, bz);
    bellGroup.userData.noMerge = true;
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.45, 6), mats.gildedTrimMat);
    chain.position.y = 0.72;
    bellGroup.add(chain);
    const swingPivot = new THREE.Group();
    const bellDome = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.34, 0.48, 12), mats.agedBronzeMat);
    bellDome.position.y = -0.24;
    const clapperPivot = new THREE.Group();
    clapperPivot.position.y = -0.38;
    const clapper = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), mats.gildedTrimMat);
    clapper.position.y = -0.14;
    clapperPivot.add(clapper);
    swingPivot.add(bellDome, clapperPivot);
    bellGroup.add(swingPivot);
    bellGroup.userData.bellSwingPivot = swingPivot;
    bellGroup.userData.bellClapperPivot = clapperPivot;
    group.add(bellGroup);
    templeBells.push(bellGroup);
  }

  // Waist-high Carved Brass-and-Timber Garbhagriha Railing (5.6m x 5.6m) preserving open sightlines
  const railR = c.railingHalf;
  for (let side = 0; side < 4; side++) {
    const rFace = new THREE.Group();
    rFace.rotation.y = (side * Math.PI) / 2;
    const lowCurb = new THREE.Mesh(new THREE.BoxGeometry(railR * 2, 0.22, 0.2), mats.carvedSalWoodMat);
    lowCurb.position.set(0, wallBaseY + 0.11, railR);
    const topRail = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, railR * 2, 10), mats.gildedTrimMat);
    topRail.rotation.z = Math.PI * 0.5;
    topRail.position.set(0, wallBaseY + 1.02, railR);
    const midRail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, railR * 2, 8), mats.gildedTrimMat);
    midRail.rotation.z = Math.PI * 0.5;
    midRail.position.set(0, wallBaseY + 0.62, railR);
    rFace.add(lowCurb, topRail, midRail);

    for (let p = -2; p <= 2; p++) {
      const baluster = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.065, 0.85, 8),
        mats.gildedTrimMat,
      );
      baluster.position.set(p * 1.35, wallBaseY + 0.58, railR);
      rFace.add(baluster);
    }
    group.add(rFace);
  }

  // =========================================================================
  // 5. CHATURMUKHA SHIVA LINGAM, YONI-PEETH, VASUKI HOOD & ABHISHEKA KALASH
  // =========================================================================
  const sanctumGroup = new THREE.Group();
  sanctumGroup.position.set(0, wallBaseY, 0);
  group.add(sanctumGroup);

  // Tiered Silver & Copper Yoni-Peeth Pedestal
  const peethBase = new THREE.Mesh(
    new THREE.CylinderGeometry(1.55, 1.78, 0.36, 16),
    mats.repousseSilverMat,
  );
  peethBase.position.y = 0.18;
  const peethRim = new THREE.Mesh(
    new THREE.TorusGeometry(1.42, 0.14, 10, 24),
    mats.gildedTrimMat,
  );
  peethRim.rotation.x = Math.PI * 0.5;
  peethRim.position.y = 0.42;
  const peethTop = new THREE.Mesh(
    new THREE.CylinderGeometry(1.18, 1.35, 0.28, 16),
    mats.repousseSilverMat,
  );
  peethTop.position.y = 0.56;
  // North-pointing Yoni spout (Jaladhari)
  const spout = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.18, 0.95), mats.repousseSilverMat);
  spout.position.set(0, 0.48, -1.65);
  sanctumGroup.add(peethBase, peethRim, peethTop, spout);

  // Sacred Black Shaligram Chaturmukha Shiva Lingam (4 Cardinal Sculpted Faces + Ishana Apex)
  const lingamShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.56, 0.62, 1.65, 24),
    mats.blackBasaltMat,
  );
  lingamShaft.position.y = 1.48;
  const lingamApex = new THREE.Mesh(
    new THREE.SphereGeometry(0.56, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
    mats.blackBasaltMat,
  );
  lingamApex.position.y = 2.3;
  sanctumGroup.add(lingamShaft, lingamApex);

  // 4 Cardinal Serene Carved Faces (Sadyojata W, Vamadeva N, Aghora S, Tatpurusha E)
  const triPundraMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    emissive: 0xf1f5f9,
    emissiveIntensity: 0.25,
    roughness: 0.5,
  });
  for (let side = 0; side < 4; side++) {
    const face = new THREE.Group();
    face.rotation.y = (side * Math.PI) / 2;
    face.position.y = 1.62;

    const headOval = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 12), mats.blackBasaltMat);
    headOval.scale.set(0.95, 1.15, 0.55);
    headOval.position.z = 0.52;

    // Gold/silver Mukuta crown band & earrings
    const crownBand = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.035, 8, 14, Math.PI), mats.gildedTrimMat);
    crownBand.position.set(0, 0.22, 0.58);

    // 3 white Tripundra ash bands + glowing crimson Bindu third eye
    for (let t = 0; t < 3; t++) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.022, 0.04), triPundraMat);
      line.position.set(0, 0.11 + t * 0.035, 0.67);
      face.add(line);
    }
    const thirdEye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), mats.sindoorMat);
    thirdEye.position.set(0, 0.14, 0.69);

    // Serene nose ridge
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.12, 0.06), mats.blackBasaltMat);
    nose.position.set(0, 0.02, 0.68);

    face.add(headOval, crownBand, thirdEye, nose);
    sanctumGroup.add(face);
  }

  // Fresh Marigold (Sayapatri) Garlands & Green Bel Leaves adorning the Lingam
  for (const [gy, tiltX, tiltZ] of [
    [2.28, 0.06, -0.05],
    [1.15, -0.04, 0.04],
    [0.74, 0, 0],
  ] as Array<[number, number, number]>) {
    const garland = new THREE.Mesh(
      new THREE.TorusGeometry(gy < 0.9 ? 1.15 : 0.62, 0.11, 10, 24),
      mats.marigoldMat,
    );
    garland.rotation.x = Math.PI * 0.5 + tiltX;
    garland.rotation.y = tiltZ;
    garland.position.y = gy;
    sanctumGroup.add(garland);
  }

  for (let b = 0; b < 12; b++) {
    const a = (b / 12) * Math.PI * 2;
    const leaf = new THREE.Mesh(new THREE.CircleGeometry(0.11, 7), mats.belLeafMat);
    leaf.rotation.x = -Math.PI * 0.42;
    leaf.rotation.z = a;
    leaf.position.set(Math.cos(a) * 0.52, 2.34 + (b % 2) * 0.04, Math.sin(a) * 0.52);
    sanctumGroup.add(leaf);
  }

  // Coiled Silver Vasuki Cobra Hood arching gracefully over the Lingam from the East
  const cobraCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.75, 0.72, 0),
    new THREE.Vector3(0.95, 1.55, 0.1),
    new THREE.Vector3(0.72, 2.55, 0),
    new THREE.Vector3(0.22, 3.05, 0),
  ]);
  const cobraNeck = new THREE.Mesh(
    new THREE.TubeGeometry(cobraCurve, 18, 0.085, 10, false),
    mats.repousseSilverMat,
  );
  const cobraHood = new THREE.Mesh(
    new THREE.SphereGeometry(0.38, 14, 12),
    mats.repousseSilverMat,
  );
  cobraHood.scale.set(0.32, 1.1, 1.35);
  cobraHood.position.set(0.18, 3.08, 0);
  cobraHood.rotation.z = 0.42;
  sanctumGroup.add(cobraNeck, cobraHood);

  // Suspended Silver Abhisheka Kalash dripping sacred water onto Lingam apex
  const kalashY = 4.65;
  const kalashVessel = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 14, 12),
    mats.repousseSilverMat,
  );
  kalashVessel.position.y = kalashY;
  const kalashTip = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.25, 10), mats.gildedTrimMat);
  kalashTip.rotation.x = Math.PI;
  kalashTip.position.y = kalashY - 0.36;
  sanctumGroup.add(kalashVessel, kalashTip);

  for (const a of [0.78, 2.35, 3.92, 5.49]) {
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.65, 6), mats.gildedTrimMat);
    chain.position.set(Math.cos(a) * 0.42, kalashY + 0.85, Math.sin(a) * 0.42);
    chain.rotation.z = Math.cos(a) * -0.22;
    chain.rotation.x = Math.sin(a) * 0.22;
    sanctumGroup.add(chain);
  }

  // Animated dripping Abhisheka water droplet
  const droplet = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.85 }),
  );
  droplet.position.y = kalashY - 0.48;
  droplet.userData.noMerge = true;
  droplet.userData.noSpin = true;
  sanctumGroup.add(droplet);

  // Soft Edge-Faded Volumetric Golden Light Beam over Chaturmukha Lingam
  const beamMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uPulse: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewPos;
      void main() {
        vUv = uv;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vViewPos = -mvPos.xyz;
        vNormalView = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uPulse;
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewPos;
      void main() {
        vec3 n = normalize(vNormalView);
        vec3 v = normalize(vViewPos);
        float fresnel = pow(abs(dot(n, v)), 1.75);
        float verticalFade = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.15, vUv.y);
        float shimmer = 0.88 + 0.12 * sin(uTime * 1.4 + vUv.y * 6.28);
        float alpha = fresnel * verticalFade * (0.13 + uPulse * 0.16) * shimmer;
        gl_FragColor = vec4(1.0, 0.78, 0.34, alpha);
      }
    `,
  });
  const lightBeam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 2.55, 5.4, 24, 1, true),
    beamMat,
  );
  lightBeam.position.y = 3.1;
  lightBeam.userData.noMerge = true;
  lightBeam.userData.noSpin = true;
  sanctumGroup.add(lightBeam);

  // Drifting Sanctum Incense Wisps & Golden Dust Motes
  const moteCount = 64;
  const motePos = new Float32Array(moteCount * 3);
  const moteSeeds = new Float32Array(moteCount);
  for (let i = 0; i < moteCount; i++) {
    const a = (i * 2.3999) % (Math.PI * 2);
    const r = 0.45 + ((i * 19) % 100) / 52;
    motePos[i * 3] = Math.cos(a) * r;
    motePos[i * 3 + 1] = 0.7 + ((i * 31) % 100) / 24;
    motePos[i * 3 + 2] = Math.sin(a) * r;
    moteSeeds[i] = i * 0.71;
  }
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
  moteGeo.setAttribute('aSeed', new THREE.BufferAttribute(moteSeeds, 1));
  const moteMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uBoost: { value: 0 } },
    vertexShader: `
      attribute float aSeed;
      uniform float uTime;
      uniform float uBoost;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        p.y = 0.65 + mod(p.y + uTime * 0.32 + aSeed, 4.4);
        p.x += sin(uTime * 0.9 + aSeed * 3.1) * 0.24;
        p.z += cos(uTime * 0.8 + aSeed * 2.7) * 0.24;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = clamp((38.0 + uBoost * 22.0) / max(1.0, -mv.z), 2.0, 12.0);
        vAlpha = smoothstep(0.65, 1.4, p.y) * smoothstep(5.05, 3.6, p.y) * (0.45 + uBoost * 0.4);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float glow = pow(1.0 - d * 2.0, 2.0);
        gl_FragColor = vec4(1.0, 0.84, 0.45, glow * vAlpha);
      }
    `,
  });
  const motes = new THREE.Points(moteGeo, moteMat);
  motes.userData.noMerge = true;
  motes.userData.noSpin = true;
  sanctumGroup.add(motes);

  let offeringBoost = 0;
  const triggerLingamOffering = () => {
    offeringBoost = 1.0;
  };
  droplet.userData.onEnvironmentUpdate = (env: { elapsed: number }) => {
    offeringBoost = Math.max(0, offeringBoost - 0.015);
    beamMat.uniforms.uTime.value = env.elapsed;
    beamMat.uniforms.uPulse.value = offeringBoost;
    moteMat.uniforms.uTime.value = env.elapsed;
    moteMat.uniforms.uBoost.value = offeringBoost;

    const dropPhase = (env.elapsed * 0.62) % 1;
    droplet.position.y = THREE.MathUtils.lerp(kalashY - 0.48, 2.86, dropPhase * dropPhase);
    droplet.scale.setScalar(dropPhase > 0.92 ? 1.45 : 1.0);
  };
  animatedNodes.push(droplet);

  // Sanctum warm interior light + golden roof spotlight (managed by WorldEngine dynamic 8-light pool!)
  const sanctumLight = new THREE.PointLight(0xffb44c, 3.2, 18, 1.4);
  sanctumLight.position.set(0, wallBaseY + 4.4, 0);
  sanctumLight.userData.interiorSanctum = true;
  sanctumLight.userData.warmFlicker = true;
  sanctumLight.userData.flickerAmp = 0.08;
  sanctumLight.userData.intensityScale = 2.4;
  group.add(sanctumLight);
  beaconLights.push(sanctumLight);

  const westRoofLight = new THREE.PointLight(0xffcb6e, 2.0, 28, 1.5);
  westRoofLight.position.set(-10.5, 11.2, 0);
  westRoofLight.userData.intensityScale = 1.3;
  group.add(westRoofLight);
  beaconLights.push(westRoofLight);

  // Invisible Layer-2 Hit Sphere for clicking directly on Chaturmukha Shiva Lingam
  const lingamHitTarget = new THREE.Mesh(
    new THREE.SphereGeometry(2.3, 10, 10),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  lingamHitTarget.position.set(0, wallBaseY + 1.8, 0);
  lingamHitTarget.userData.noMerge = true;
  group.add(lingamHitTarget);

  mergeStaticMeshesByMaterial(group, { preserveCustomShaderMaterials: true });

  return {
    group,
    beaconLights,
    animatedNodes,
    cameraOccluders,
    templeBells,
    lingamHitTarget,
    triggerLingamOffering,
  };
}

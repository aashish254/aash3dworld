import * as THREE from 'three';
import {
  createDetailedBrassSukundaDiyo,
  createDetailedGajurSpire,
  createDetailedTempleBell,
  createRectangularHipRoofGeometry,
  createSacredFlameGroup,
} from './janakiMandirCraft';
import {
  BuddhaMaterials,
  createMonumentalSeatedBuddha,
  createNativitySiddharthaStatue,
  createStandingBlessingBuddha,
} from './lumbiniBuddhaSculpt';
import { createLumbiniTextures } from './lumbiniTextures';
import { LandmarkBuildResult } from './proceduralModels';
import { ProceduralTextureSet } from './proceduralTextures';
import { applyRealisticWaterShader } from './waterShader';

const _m4 = new THREE.Matrix4();
const _v3 = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _e = new THREE.Euler();
const _colorTmp = new THREE.Color();

/**
 * Builds a carved Maurya terracotta-brick & white stucco Votive Stupa for the Lumbini grounds.
 */
function buildVotiveStupa(
  brickMat: THREE.Material,
  stuccoMat: THREE.Material,
  goldMat: THREE.Material,
  scale = 1.0,
): THREE.Group {
  const g = new THREE.Group();

  const plinth1 = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.24, 1.45), brickMat);
  plinth1.position.y = 0.12;
  plinth1.castShadow = true;
  plinth1.receiveShadow = true;

  const plinth2 = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.22, 1.16), brickMat);
  plinth2.position.y = 0.35;
  plinth2.castShadow = true;

  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.52, 0.32, 20), stuccoMat);
  drum.position.y = 0.62;
  drum.castShadow = true;

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.48, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.54),
    stuccoMat,
  );
  dome.position.y = 0.76;
  dome.castShadow = true;

  const harmika = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.32), goldMat);
  harmika.position.y = 1.28;
  harmika.castShadow = true;

  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.48, 14), goldMat);
  spire.position.y = 1.60;
  spire.castShadow = true;

  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), goldMat);
  finial.position.y = 1.88;

  g.add(plinth1, plinth2, drum, dome, harmika, spire, finial);
  g.scale.setScalar(scale);
  return g;
}

/**
 * Builds a carved Chunar sandstone Lumbini Peace Garden lantern pedestal.
 */
function buildPeaceLantern(
  stoneMat: THREE.Material,
  bronzeMat: THREE.Material,
  glowMat: THREE.Material,
): THREE.Group {
  const g = new THREE.Group();

  const foot = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.18, 0.66), stoneMat);
  foot.position.y = 0.09;
  foot.castShadow = true;
  foot.receiveShadow = true;

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.22, 0.50), stoneMat);
  plinth.position.y = 0.29;
  plinth.castShadow = true;

  const shaftPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.16, 0.0),
    new THREE.Vector2(0.11, 0.18),
    new THREE.Vector2(0.10, 0.86),
    new THREE.Vector2(0.15, 0.98),
    new THREE.Vector2(0.0, 0.98),
  ];
  const shaft = new THREE.Mesh(new THREE.LatheGeometry(shaftPts, 16), stoneMat);
  shaft.position.y = 0.40;
  shaft.castShadow = true;

  const sill = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.09, 0.44), stoneMat);
  sill.position.y = 1.425;

  const glassCore = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.34, 8), glowMat);
  glassCore.position.y = 1.64;

  // 4 bronze corner mullions around lantern chamber
  for (const sx of [-0.15, 0.15]) {
    for (const sz of [-0.15, 0.15]) {
      const mullion = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.36, 6), bronzeMat);
      mullion.position.set(sx, 1.64, sz);
      g.add(mullion);
    }
  }

  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.26, 4), stoneMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 1.94;
  roof.castShadow = true;

  const kalash = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 8), bronzeMat);
  kalash.position.y = 2.11;

  g.add(foot, plinth, shaft, sill, glassCore, roof, kalash);
  return g;
}

/**
 * Builds a carved Chunar sandstone Dharmachakra Torana ceremonial entrance archway.
 */
function buildToranaGate(
  stoneMat: THREE.Material,
  brickMat: THREE.Material,
  goldMat: THREE.Material,
  bronzeMat: THREE.Material,
): THREE.Group {
  const g = new THREE.Group();

  // Wide central opening: inner clearance [-2.85, +2.85], arch lintel bottom y = 3.85
  for (const side of [-1, 1]) {
    const px = side * 3.55;
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.44, 1.18), brickMat);
    base.position.set(px, 0.22, 0);
    base.castShadow = true;
    base.receiveShadow = true;

    const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.36, 0.96), stoneMat);
    plinth.position.set(px, 0.62, 0);
    plinth.castShadow = true;

    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.68, 3.15, 0.68), stoneMat);
    pillar.position.set(px, 2.375, 0);
    pillar.castShadow = true;
    pillar.receiveShadow = true;

    const capital = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.28, 0.96), stoneMat);
    capital.position.set(px, 4.09, 0);
    capital.castShadow = true;

    // Lion/lotus crest atop side pillars
    const lotusCap = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.24, 16), goldMat);
    lotusCap.position.set(px, 4.35, 0);
    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), goldMat);
    finial.position.set(px, 4.56, 0);

    g.add(base, plinth, pillar, capital, lotusCap, finial);
  }

  // Carved double cross-beam Torana architraves with upturned Sanchi-style volute ends
  for (const [by, bw, bh] of [
    [4.05, 8.2, 0.34],
    [4.62, 8.7, 0.30],
  ] as Array<[number, number, number]>) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.64), stoneMat);
    beam.position.set(0, by, 0);
    beam.castShadow = true;
    beam.receiveShadow = true;
    g.add(beam);

    for (const side of [-1, 1]) {
      const volute = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.065, 8, 16), goldMat);
      volute.position.set(side * (bw * 0.5 + 0.04), by + 0.06, 0);
      g.add(volute);
    }
  }

  // Three spacer uprights between beams
  for (const sx of [-1.85, 0, 1.85]) {
    const spacer = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.44), bronzeMat);
    spacer.position.set(sx, 4.34, 0);
    g.add(spacer);
  }

  // Crowning Central Golden Dharmachakra (8-spoked Wheel of Dharma)
  const wheelOuter = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.06, 10, 32), goldMat);
  wheelOuter.position.set(0, 5.42, 0);
  wheelOuter.castShadow = true;
  const wheelHub = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.14, 16), goldMat);
  wheelHub.rotation.x = Math.PI / 2;
  wheelHub.position.set(0, 5.42, 0);
  const wheelStand = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.26, 0.36), stoneMat);
  wheelStand.position.set(0, 4.86, 0);
  g.add(wheelOuter, wheelHub, wheelStand);

  const spokeGeo = new THREE.CylinderGeometry(0.022, 0.022, 1.06, 8);
  for (let i = 0; i < 4; i++) {
    const spoke = new THREE.Mesh(spokeGeo, goldMat);
    spoke.position.set(0, 5.42, 0);
    spoke.rotation.z = (i / 4) * Math.PI;
    g.add(spoke);
  }

  return g;
}

/**
 * Builds the historic Ashoka Pillar of Lumbini (249 BCE) with polished Chunar sandstone shaft,
 * Brahmi edict plaque, Persepolitan bell-lotus capital, Ashokan lion & wheel crest, and iron fencing.
 */
function buildAshokaPillar(
  stoneMat: THREE.Material,
  brickMat: THREE.Material,
  ironMat: THREE.Material,
  goldMat: THREE.Material,
  edictMap: THREE.Texture,
  edictNormal: THREE.Texture,
): THREE.Group {
  const g = new THREE.Group();

  // Stepped brick & sandstone fenced enclosure (3.8m x 3.8m)
  const brickBase = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.28, 3.8), brickMat);
  brickBase.position.y = 0.14;
  brickBase.castShadow = true;
  brickBase.receiveShadow = true;

  const stoneDeck = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.18, 3.2), stoneMat);
  stoneDeck.position.y = 0.37;
  stoneDeck.castShadow = true;
  stoneDeck.receiveShadow = true;
  g.add(brickBase, stoneDeck);

  // Ornamental wrought-iron perimeter fence posts & rails (InstancedMesh balusters)
  for (const sx of [-1.68, 1.68]) {
    for (const sz of [-1.68, 1.68]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.88, 0.16), stoneMat);
      post.position.set(sx, 0.72, sz);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), goldMat);
      cap.position.set(sx, 1.20, sz);
      g.add(post, cap);
    }
  }
  const railGeoLongX = new THREE.BoxGeometry(3.36, 0.05, 0.05);
  const railGeoLongZ = new THREE.BoxGeometry(0.05, 0.05, 3.36);
  for (const ry of [0.56, 1.04]) {
    for (const side of [-1.68, 1.68]) {
      const rx = new THREE.Mesh(railGeoLongX, ironMat);
      rx.position.set(0, ry, side);
      const rz = new THREE.Mesh(railGeoLongZ, ironMat);
      rz.position.set(side, ry, 0);
      g.add(rx, rz);
    }
  }
  // Baluster pickets
  const picketCoords: Array<[number, number]> = [];
  for (let i = -3; i <= 3; i++) {
    picketCoords.push([i * 0.42, -1.68], [i * 0.42, 1.68], [-1.68, i * 0.42], [1.68, i * 0.42]);
  }
  const picketGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.56, 6);
  const pickets = new THREE.InstancedMesh(picketGeo, ironMat, picketCoords.length);
  picketCoords.forEach(([px, pz], idx) => {
    _v3.set(px, 0.80, pz);
    _q.identity();
    _s.setScalar(1);
    _m4.compose(_v3, _q, _s);
    pickets.setMatrixAt(idx, _m4);
  });
  pickets.instanceMatrix.needsUpdate = true;
  g.add(pickets);

  // Pillar Pedestal & Monolithic Tapered Chunar Sandstone Shaft (7.2m tall)
  const pedSquare = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.48, 1.56), stoneMat);
  pedSquare.position.y = 0.70;
  pedSquare.castShadow = true;

  // Recessed ancient Brahmi inscription plaque on East (+X) and South (+Z) plinth faces
  const edictMat = new THREE.MeshStandardMaterial({
    map: edictMap,
    normalMap: edictNormal,
    normalScale: new THREE.Vector2(1.0, 1.0),
    roughness: 0.72,
  });
  const edictEast = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.36, 0.72), edictMat);
  edictEast.position.set(0.79, 0.70, 0);
  const edictSouth = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.36, 0.06), edictMat);
  edictSouth.position.set(0, 0.70, 0.79);
  g.add(pedSquare, edictEast, edictSouth);

  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.48, 6.4, 24), stoneMat);
  shaft.position.y = 4.14;
  shaft.castShadow = true;
  shaft.receiveShadow = true;
  g.add(shaft);

  // Historic bronze structural reinforcement bands (authentic detail of Lumbini's Ashoka Pillar)
  for (const cy of [3.25, 5.15, 6.75]) {
    const rad = THREE.MathUtils.lerp(0.48, 0.36, (cy - 0.94) / 6.4) + 0.015;
    const band = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.032, 8, 24), ironMat);
    band.rotation.x = Math.PI / 2;
    band.position.y = cy;
    g.add(band);
  }

  // Persepolitan Inverted-Lotus Bell Capital + Abacus + Dharmachakra Lion Crest
  const bellPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.38, 0.0),
    new THREE.Vector2(0.56, 0.24),
    new THREE.Vector2(0.58, 0.48),
    new THREE.Vector2(0.44, 0.68),
    new THREE.Vector2(0.38, 0.76),
  ];
  const bellCap = new THREE.Mesh(new THREE.LatheGeometry(bellPts, 24), stoneMat);
  bellCap.position.y = 7.34;
  bellCap.castShadow = true;

  const neckBead = new THREE.Mesh(new THREE.TorusGeometry(0.40, 0.045, 8, 24), goldMat);
  neckBead.rotation.x = Math.PI / 2;
  neckBead.position.y = 8.10;

  const abacus = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.22, 16), stoneMat);
  abacus.position.y = 8.24;
  abacus.castShadow = true;

  // Sculpted quad-lion & golden Dharma-chakra finial
  const crestBase = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.42, 0.46, 8), stoneMat);
  crestBase.position.y = 8.58;
  crestBase.castShadow = true;
  const topWheel = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.045, 8, 24), goldMat);
  topWheel.position.y = 9.16;
  topWheel.castShadow = true;

  g.add(bellCap, neckBead, abacus, crestBase, topWheel);
  return g;
}

/**
 * Builds an ornate open-air 4-pillar sandstone Mandapa shrine pavilion housing companion Buddha statues.
 */
function buildMandapaCanopy(
  stoneMat: THREE.Material,
  brickMat: THREE.Material,
  terracottaMat: THREE.Material,
  goldMat: THREE.Material,
  bronzeMat: THREE.Material,
): THREE.Group {
  const g = new THREE.Group();

  // Floor slab (5.2m x 5.2m, top y = 0.26)
  const base = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.26, 5.2), brickMat);
  base.position.y = 0.13;
  base.receiveShadow = true;
  base.castShadow = true;
  g.add(base);

  const pilPts = [
    new THREE.Vector2(0.19, 0.0),
    new THREE.Vector2(0.19, 0.24),
    new THREE.Vector2(0.135, 0.38),
    new THREE.Vector2(0.12, 4.10),
    new THREE.Vector2(0.165, 4.28),
    new THREE.Vector2(0.21, 4.44),
  ];
  const pilGeo = new THREE.LatheGeometry(pilPts, 16);
  for (const sx of [-2.22, 2.22]) {
    for (const sz of [-2.22, 2.22]) {
      const pil = new THREE.Mesh(pilGeo, stoneMat);
      pil.position.set(sx, 0.26, sz);
      pil.castShadow = true;
      pil.receiveShadow = true;
      g.add(pil);
    }
  }

  // Entablature cornice beam framing open interior (y = 4.70..5.04)
  const beam = new THREE.Mesh(new THREE.BoxGeometry(5.15, 0.34, 5.15), stoneMat);
  beam.position.y = 4.87;
  beam.castShadow = true;
  g.add(beam);

  // Correctly ordered (width, height, depth, ridgeInsetScale) hipped terracotta roofs seated flush on beam top (y = 5.04)
  const roofLowerH = 1.05;
  const roofLower = new THREE.Mesh(
    createRectangularHipRoofGeometry(5.95, roofLowerH, 5.95, 0.44),
    terracottaMat,
  );
  roofLower.position.y = 5.04 + roofLowerH * 0.5;
  roofLower.castShadow = true;
  roofLower.receiveShadow = true;

  const roofUpperH = 0.72;
  const roofUpper = new THREE.Mesh(
    createRectangularHipRoofGeometry(3.05, roofUpperH, 3.05, 0.34),
    terracottaMat,
  );
  roofUpper.position.y = 5.04 + roofLowerH + roofUpperH * 0.5 - 0.04;
  roofUpper.castShadow = true;

  const spire = createDetailedGajurSpire(goldMat, bronzeMat, 0.84);
  spire.position.set(0, 5.04 + roofLowerH + roofUpperH - 0.04, 0);

  g.add(roofLower, roofUpper, spire);
  return g;
}

/**
 * Master Monumental Lumbini Maya Devi Temple & Sacred Peace Garden Complex
 * Replaces the legacy tiny shrine at (-8, 120) with a realistic 36m x 36m UNESCO-inspired sanctuary:
 *  - Stepped Maurya terracotta-brick & white stucco Maya Devi Temple with Harmika Wisdom Eyes,
 *    13-tier golden Chakravali spire, and walkable arched portal into the Nativity Marker Stone sanctum
 *  - Monumental Hero Gilded Shakyamuni Buddha (Bhumisparsha Mudra) on double-lotus Vajrasana throne
 *  - West Pavilion: Carved Basalt Dhyana Buddha beneath 7-Headed Muchalinda Naga Serpent Canopy
 *  - East Pavilion: Monumental Standing Abhaya Blessing Buddha
 *  - Historic Ashoka Pillar (with Brahmi inscription & Lion/Wheel capital)
 *  - Sacred Pushkarini Bathing Pool (stepped brick ghat basin with animated water & floating lotuses)
 *  - Sacred Bodhi Tree Chautara, Eternal Peace Flame, Votive Stupas, Spinning Prayer Wheels & Shilalekh
 */
export function createLumbiniBuddha(textures: ProceduralTextureSet): LandmarkBuildResult {
  const group = new THREE.Group();
  const beaconLights: THREE.PointLight[] = [];
  const animatedNodes: THREE.Object3D[] = [];
  const cameraOccluders: THREE.Object3D[] = [];
  const templeBells: THREE.Group[] = [];

  const lTex = createLumbiniTextures();
  const jTex = textures.janaki;
  group.userData.disposeExtraTextures = () => {
    lTex.dispose();
  };

  // --- Shared PBR Materials ---
  const brickMat = new THREE.MeshStandardMaterial({
    map: lTex.mauryaBrickMap,
    normalMap: lTex.mauryaBrickNormal,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughnessMap: lTex.mauryaBrickRough,
    aoMap: lTex.mauryaBrickAo,
    aoMapIntensity: 0.88,
    color: 0xffffff,
    roughness: 1.0,
    metalness: 0.02,
  });
  const brickFloorMat = new THREE.MeshStandardMaterial({
    map: jTex.brickPlazaMap,
    normalMap: jTex.brickPlazaNormal,
    normalScale: new THREE.Vector2(0.75, 0.75),
    roughnessMap: jTex.brickPlazaRough,
    aoMap: jTex.brickPlazaAo,
    aoMapIntensity: 0.86,
    color: 0xdfb8a2,
    roughness: 1.0,
  });
  const whiteStuccoMat = new THREE.MeshStandardMaterial({
    map: lTex.stuccoWhiteMap,
    normalMap: lTex.stuccoWhiteNormal,
    normalScale: new THREE.Vector2(0.62, 0.62),
    roughnessMap: lTex.stuccoWhiteRough,
    aoMap: lTex.stuccoWhiteAo,
    aoMapIntensity: 0.84,
    color: 0xffffff,
    roughness: 0.88,
    metalness: 0.02,
  });
  const chunarStoneMat = new THREE.MeshStandardMaterial({
    map: lTex.chunarStoneMap,
    normalMap: lTex.chunarStoneNormal,
    normalScale: new THREE.Vector2(0.72, 0.72),
    roughnessMap: lTex.chunarStoneRough,
    aoMap: lTex.chunarStoneAo,
    aoMapIntensity: 0.84,
    color: 0xffffff,
    roughness: 0.92,
    metalness: 0.03,
  });
  const marbleWalkMat = new THREE.MeshPhysicalMaterial({
    map: textures.marbleWalkMap,
    normalMap: textures.marbleWalkNormal,
    normalScale: new THREE.Vector2(0.52, 0.52),
    roughnessMap: textures.marbleWalkRough,
    aoMap: textures.marbleWalkAo,
    aoMapIntensity: 0.85,
    color: 0xf7f2e8,
    roughness: 0.86,
    metalness: 0.03,
    clearcoat: 0.16,
    clearcoatRoughness: 0.42,
    ior: 1.48,
  });
  const terracottaMat = new THREE.MeshStandardMaterial({
    map: lTex.mauryaBrickMap,
    normalMap: lTex.mauryaBrickNormal,
    normalScale: new THREE.Vector2(0.7, 0.7),
    color: 0xc25438,
    roughness: 0.78,
  });
  const giltGoldMat = new THREE.MeshStandardMaterial({
    map: lTex.giltBronzeMap,
    normalMap: lTex.giltBronzeNormal,
    normalScale: new THREE.Vector2(0.65, 0.65),
    roughnessMap: lTex.giltBronzeRough,
    color: 0xffdf80,
    roughness: 0.24,
    metalness: 0.88,
    emissive: 0x452b05,
    emissiveIntensity: 0.12,
  });
  const warmBronzeMat = new THREE.MeshStandardMaterial({
    map: textures.agedBronzeMap,
    normalMap: textures.agedBronzeNormal,
    normalScale: new THREE.Vector2(0.78, 0.78),
    roughnessMap: textures.agedBronzeRough,
    color: 0xd09a45,
    roughness: 0.34,
    metalness: 0.85,
  });
  const buddhaDarkBasaltMat = new THREE.MeshStandardMaterial({
    map: textures.basaltCarvedMap,
    normalMap: textures.basaltCarvedNormal,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughnessMap: textures.basaltCarvedRough,
    aoMap: textures.basaltCarvedAo,
    aoMapIntensity: 0.76,
    color: 0x99a2b0,
    roughness: 0.52,
    metalness: 0.14,
  });
  const crimsonLacquerMat = new THREE.MeshStandardMaterial({
    map: textures.basaltCarvedMap,
    normalMap: textures.basaltCarvedNormal,
    color: 0x862820,
    roughness: 0.54,
    metalness: 0.08,
  });
  const wroughtIronMat = new THREE.MeshStandardMaterial({
    color: 0x262a2e,
    roughness: 0.55,
    metalness: 0.72,
  });
  const flameGlowMat = new THREE.MeshStandardMaterial({
    color: 0xfff0b8,
    emissive: 0xff921c,
    emissiveIntensity: 2.6,
    roughness: 0.2,
  });
  const timberMat = new THREE.MeshStandardMaterial({
    map: textures.woodMap,
    normalMap: textures.woodNormal,
    color: 0x5c3c24,
    roughness: 0.84,
  });

  // =========================================================================
  // 1. MONUMENTAL 36m x 36m TERRACED PRECINCT COURTYARD (with pond cutout)
  // =========================================================================
  // Precinct bounds: x in [-18, +18], z in [-16, +20]; pond cutout: x in [7.2, 16.0], z in [-9.6, +0.4]
  // Deep 1.30m retaining slabs so outer edges never float above sloped valley riverbanks
  const plazaSlabs: Array<[number, number, number, number]> = [
    [-5.4, 2.0, 25.2, 36.0], // West main slab
    [17.0, 2.0, 2.0, 36.0],  // East pond promenade margin
    [11.6, -12.8, 8.8, 6.4], // North of Pushkarini pond
    [11.6, 10.2, 8.8, 19.6], // South of Pushkarini pond
  ];
  for (const [cx, cz, w, d] of plazaSlabs) {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(w, 1.30, d), brickFloorMat);
    slab.position.set(cx, -0.55, cz); // top surface strictly at y = +0.10, bottom deeply buried at -1.20
    slab.receiveShadow = true;
    group.add(slab);
  }

  // Carved Chunar sandstone outer retaining foundation skirt framing all 4 borders deeply into earth
  const retainingSkirts: Array<[number, number, number, number]> = [
    [0, 20.05, 36.5, 0.45],   // South border skirt
    [0, -16.05, 36.5, 0.45],  // North border skirt
    [-18.05, 2.0, 0.45, 36.5], // West border skirt
    [18.05, 2.0, 0.45, 36.5],  // East border skirt
  ];
  for (const [sx, sz, sw, sd] of retainingSkirts) {
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(sw, 1.15, sd), chunarStoneMat);
    skirt.position.set(sx, -0.46, sz); // top +0.115, bottom -1.035
    skirt.receiveShadow = true;
    skirt.castShadow = true;
    group.add(skirt);
  }

  // South & North threshold stone entry aprons bridging courtyard cleanly into axial boulevard
  const southApron = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.95, 2.1), chunarStoneMat);
  southApron.position.set(0, -0.37, 20.9);
  southApron.receiveShadow = true;
  const northApron = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.95, 2.1), chunarStoneMat);
  northApron.position.set(0, -0.37, -16.9);
  northApron.receiveShadow = true;
  group.add(southApron, northApron);

  // Carved Chunar sandstone outer precinct curbing + perimeter low brick balustrade (open at gates!)
  const perimeterSegments: Array<[number, number, number, number]> = [
    [-11.2, 19.7, 13.6, 0.55], // South-West balustrade
    [11.2, 19.7, 13.6, 0.55],  // South-East balustrade
    [-11.0, -15.7, 14.0, 0.55], // North-West balustrade
    [11.0, -15.7, 14.0, 0.55],  // North-East balustrade
    [-17.7, -4.5, 0.55, 23.0],  // West wall North half
    [-17.7, 14.8, 0.55, 10.4],  // West wall South half (leaves opening at z = 7..9.6)
    [17.7, -4.5, 0.55, 23.0],   // East wall North half
    [17.7, 14.8, 0.55, 10.4],   // East wall South half
  ];
  for (const [bx, bz, bw, bd] of perimeterSegments) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.62, bd), brickMat);
    wall.position.set(bx, 0.41, bz);
    wall.castShadow = true;
    wall.receiveShadow = true;
    const coping = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.08, 0.12, bd + 0.08), chunarStoneMat);
    coping.position.set(bx, 0.78, bz);
    coping.castShadow = true;
    group.add(wall, coping);
  }

  // Veined Marble Axial Ceremonial Walkways (y top = 0.135, cleanly +0.035m above brick plaza)
  const southWalk = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.07, 19.8), marbleWalkMat);
  southWalk.position.set(0, 0.10, 10.4);
  southWalk.receiveShadow = true;

  const northWalk = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.07, 6.0), marbleWalkMat);
  northWalk.position.set(0, 0.10, -13.2);
  northWalk.receiveShadow = true;

  const crossWalk = new THREE.Mesh(new THREE.BoxGeometry(27.0, 0.06, 3.8), marbleWalkMat);
  crossWalk.position.set(0, 0.095, 4.2);
  crossWalk.receiveShadow = true;

  group.add(southWalk, northWalk, crossWalk);

  // =========================================================================
  // 2. SOUTH & NORTH CEREMONIAL DHARMACHAKRA TORANA ENTRY GATES
  // =========================================================================
  const southGate = buildToranaGate(chunarStoneMat, brickMat, giltGoldMat, warmBronzeMat);
  southGate.position.set(0, 0.10, 18.2);
  const northGate = buildToranaGate(chunarStoneMat, brickMat, giltGoldMat, warmBronzeMat);
  northGate.position.set(0, 0.10, -14.8);
  group.add(southGate, northGate);

  // =========================================================================
  // 3. AUTHENTIC MAYA DEVI TEMPLE SANCTUARY (lx = 0, lz = -5.6, ~14.4m tall)
  // =========================================================================
  const mayaDevi = new THREE.Group();
  mayaDevi.position.set(0, 0.10, -5.6); // base sits cleanly on brick floor y = 0.10

  // A. Ancient Maurya Terracotta Brick Sub-Plinth (14.4m x 10.4m)
  const subPlinth = new THREE.Mesh(new THREE.BoxGeometry(14.4, 0.62, 10.4), brickMat);
  subPlinth.position.y = 0.31;
  subPlinth.castShadow = true;
  subPlinth.receiveShadow = true;

  const upperTerrace = new THREE.Mesh(new THREE.BoxGeometry(13.2, 0.40, 9.2), brickMat);
  upperTerrace.position.y = 0.82;
  upperTerrace.castShadow = true;
  upperTerrace.receiveShadow = true;

  const terraceMarbleCoping = new THREE.Mesh(new THREE.BoxGeometry(13.42, 0.08, 9.42), marbleWalkMat);
  terraceMarbleCoping.position.y = 1.06;
  terraceMarbleCoping.receiveShadow = true;
  mayaDevi.add(subPlinth, upperTerrace, terraceMarbleCoping);

  // Decorative brick buttresses & miniature recessed votive niches around outer Maurya plinth
  for (let i = -2; i <= 2; i++) {
    for (const sideZ of [-5.25, 5.25]) {
      if (sideZ > 0 && Math.abs(i) <= 1) continue; // keep front stairs open
      const butt = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.72, 0.24), brickMat);
      butt.position.set(i * 2.8, 0.36, sideZ);
      butt.castShadow = true;
      mayaDevi.add(butt);
    }
  }
  for (const sideX of [-7.25, 7.25]) {
    for (let j = -1; j <= 1; j++) {
      const butt = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.72, 0.55), brickMat);
      butt.position.set(sideX, 0.36, j * 3.0);
      butt.castShadow = true;
      mayaDevi.add(butt);
    }
  }

  // Front Ceremonial Staircase rising from courtyard (+Z: 5.2 -> 7.0) to temple terrace (y = 0 -> 1.10)
  const stairCount = 5;
  for (let s = 0; s < stairCount; s++) {
    const stepH = 0.22;
    const stepD = 0.44;
    const step = new THREE.Mesh(new THREE.BoxGeometry(4.6, stepH, stepD), marbleWalkMat);
    step.position.set(0, stepH * 0.5 + s * stepH, 6.85 - s * stepD);
    step.castShadow = true;
    step.receiveShadow = true;
    mayaDevi.add(step);
  }
  for (const sx of [-2.55, 2.55]) {
    const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.48, 1.16, 2.2), chunarStoneMat);
    cheek.position.set(sx, 0.58, 6.0);
    cheek.castShadow = true;
    const cheekCap = new THREE.Mesh(new THREE.SphereGeometry(0.20, 12, 10), giltGoldMat);
    cheekCap.position.set(sx, 1.22, 6.92);
    mayaDevi.add(cheek, cheekCap);
  }

  // B. Whitewashed Stucco Main Sanctuary Walls (11.6m W x 7.8m D, y: 1.10 -> 5.20)
  const wallBaseY = 1.10;
  const wallH = 4.10;
  // North back wall
  const northWall = new THREE.Mesh(new THREE.BoxGeometry(11.6, wallH, 0.75), whiteStuccoMat);
  northWall.position.set(0, wallBaseY + wallH * 0.5, -3.52);
  northWall.castShadow = true;
  northWall.receiveShadow = true;
  // West & East walls
  for (const side of [-1, 1]) {
    const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.75, wallH, 7.8), whiteStuccoMat);
    sideWall.position.set(side * 5.42, wallBaseY + wallH * 0.5, 0);
    sideWall.castShadow = true;
    sideWall.receiveShadow = true;
    mayaDevi.add(sideWall);
  }
  // South front facade with 3.4m wide central open Sanctuary Portal (x in [-1.7, +1.7])
  for (const side of [-1, 1]) {
    const frontWing = new THREE.Mesh(new THREE.BoxGeometry(4.1, wallH, 0.75), whiteStuccoMat);
    frontWing.position.set(side * 3.75, wallBaseY + wallH * 0.5, 3.52);
    frontWing.castShadow = true;
    frontWing.receiveShadow = true;
    mayaDevi.add(frontWing);
  }
  const frontLintel = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.85, 0.75), whiteStuccoMat);
  frontLintel.position.set(0, wallBaseY + wallH - 0.425, 3.52);
  frontLintel.castShadow = true;

  // Sanctuary floor inside Maya Devi Temple (y top = 1.12)
  const sanctumFloor = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.12, 6.6), marbleWalkMat);
  sanctumFloor.position.set(0, 1.06, 0);
  sanctumFloor.receiveShadow = true;
  mayaDevi.add(northWall, frontLintel, sanctumFloor);

  // Exterior Pilasters, Terracotta Frieze & Arched Sanctuary Entrance Portico
  for (const side of [-1, 1]) {
    const doorPier = new THREE.Mesh(new THREE.BoxGeometry(0.48, 3.35, 1.25), chunarStoneMat);
    doorPier.position.set(side * 1.82, wallBaseY + 1.675, 3.92);
    doorPier.castShadow = true;
    mayaDevi.add(doorPier);
  }
  // Carved Gilded Torana Tympanum above Sanctuary Doorway (correctly ordered width, height, depth)
  const doorArch = new THREE.Mesh(new THREE.BoxGeometry(4.15, 0.34, 1.35), terracottaMat);
  doorArch.position.set(0, wallBaseY + 3.42, 3.92);
  doorArch.castShadow = true;
  const porchRoofH = 0.88;
  const porchRoof = new THREE.Mesh(
    createRectangularHipRoofGeometry(4.95, porchRoofH, 1.85, 0.56),
    terracottaMat,
  );
  porchRoof.position.set(0, wallBaseY + 3.59 + porchRoofH * 0.5, 4.15);
  porchRoof.castShadow = true;
  const porchWheel = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.04, 8, 24), giltGoldMat);
  porchWheel.position.set(0, wallBaseY + 4.38, 4.65);
  mayaDevi.add(doorArch, porchRoof, porchWheel);

  // Hanging Interactive Bronze Temple Bell anchored cleanly to Sanctuary Arch Lintel
  const thresholdBell = createDetailedTempleBell(giltGoldMat, warmBronzeMat, 0.34, 0.88);
  thresholdBell.position.set(-1.12, wallBaseY + 3.25, 4.15);
  mayaDevi.add(thresholdBell);
  templeBells.push(thresholdBell);

  // Exterior wall pilasters, blind Chaitya niches & terracotta frieze banding around all 4 Maya Devi walls
  const bandLower = new THREE.Mesh(new THREE.BoxGeometry(11.88, 0.24, 8.08), terracottaMat);
  bandLower.position.set(0, wallBaseY + 0.14, 0);
  const bandUpper = new THREE.Mesh(new THREE.BoxGeometry(11.96, 0.26, 8.16), terracottaMat);
  bandUpper.position.set(0, wallBaseY + wallH - 0.16, 0);
  mayaDevi.add(bandLower, bandUpper);

  for (const px of [-5.65, -2.85, 2.85, 5.65]) {
    for (const pz of [-3.92, 3.92]) {
      const pil = new THREE.Mesh(new THREE.BoxGeometry(0.42, wallH, 0.26), whiteStuccoMat);
      pil.position.set(px, wallBaseY + wallH * 0.5, pz);
      mayaDevi.add(pil);
    }
  }
  for (const nx of [-4.25, 4.25]) {
    for (const sideZ of [-3.92, 3.92]) {
      const nicheFrame = new THREE.Mesh(new THREE.BoxGeometry(1.45, 2.15, 0.16), terracottaMat);
      nicheFrame.position.set(nx, wallBaseY + 2.05, sideZ);
      const med = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.12, 16), giltGoldMat);
      med.rotation.x = Math.PI / 2;
      med.position.set(nx, wallBaseY + 2.18, sideZ + (sideZ > 0 ? 0.06 : -0.06));
      mayaDevi.add(nicheFrame, med);
    }
  }
  for (const pz of [-3.6, -1.2, 1.2, 3.6]) {
    for (const px of [-5.82, 5.82]) {
      const pil = new THREE.Mesh(new THREE.BoxGeometry(0.26, wallH, 0.42), whiteStuccoMat);
      pil.position.set(px, wallBaseY + wallH * 0.5, pz);
      mayaDevi.add(pil);
    }
  }
  for (const nz of [-2.4, 0, 2.4]) {
    for (const sideX of [-5.82, 5.82]) {
      const nicheFrame = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.15, 1.35), terracottaMat);
      nicheFrame.position.set(sideX, wallBaseY + 2.05, nz);
      const med = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.12, 16), giltGoldMat);
      med.rotation.z = Math.PI / 2;
      med.position.set(sideX + (sideX > 0 ? 0.06 : -0.06), wallBaseY + 2.18, nz);
      mayaDevi.add(nicheFrame, med);
    }
  }

  // C. Illuminated Inner Nativity Sanctum: Marker Stone + Golden Baby Siddhartha + Bas-Relief Mural
  const reliefMat = new THREE.MeshStandardMaterial({
    map: lTex.nativityReliefMap,
    roughness: 0.36,
    metalness: 0.45,
    emissive: 0x3b2406,
    emissiveIntensity: 0.35,
  });
  const nativityPanel = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.4, 0.18), reliefMat);
  nativityPanel.position.set(0, wallBaseY + 1.95, -2.88);
  const nativityFrame = new THREE.Mesh(new THREE.BoxGeometry(2.88, 2.68, 0.14), giltGoldMat);
  nativityFrame.position.set(0, wallBaseY + 1.95, -2.96);
  mayaDevi.add(nativityFrame, nativityPanel);

  const babySiddhartha = createNativitySiddharthaStatue(giltGoldMat, chunarStoneMat);
  babySiddhartha.position.set(0, wallBaseY + 0.02, -1.75);
  mayaDevi.add(babySiddhartha);

  // Flanking sanctuary Sukunda oil lamps
  for (const lx of [-1.25, 1.25]) {
    const diyo = createDetailedBrassSukundaDiyo(giltGoldMat, warmBronzeMat, flameGlowMat, 0.85, true);
    diyo.position.set(lx, wallBaseY + 0.02, -1.45);
    mayaDevi.add(diyo);
  }

  // Inner Sanctum Warm Golden Light (Beacon Light 1)
  const sanctumLight = new THREE.PointLight(0xffd27a, 2.4, 14, 1.5);
  sanctumLight.position.set(0, wallBaseY + 2.85, -1.2);
  mayaDevi.add(sanctumLight);
  beaconLights.push(sanctumLight);

  // D. Multi-Tiered Stepped White Maya Devi Roof, Wisdom-Eyes Harmika & 13-Tier Golden Spire (y: 5.20 -> 14.35)
  const roofEave1 = new THREE.Mesh(new THREE.BoxGeometry(12.6, 0.32, 8.8), terracottaMat);
  roofEave1.position.y = 5.36;
  roofEave1.castShadow = true;

  const stepRoof1 = new THREE.Mesh(new THREE.BoxGeometry(9.8, 1.05, 6.4), whiteStuccoMat);
  stepRoof1.position.y = 6.045;
  stepRoof1.castShadow = true;
  stepRoof1.receiveShadow = true;

  const roofTrim1 = new THREE.Mesh(new THREE.BoxGeometry(10.1, 0.20, 6.7), terracottaMat);
  roofTrim1.position.y = 6.67;
  roofTrim1.castShadow = true;

  const stepRoof2 = new THREE.Mesh(new THREE.BoxGeometry(7.2, 1.02, 4.8), whiteStuccoMat);
  stepRoof2.position.y = 7.28;
  stepRoof2.castShadow = true;
  stepRoof2.receiveShadow = true;

  const roofTrim2 = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.18, 5.1), giltGoldMat);
  roofTrim2.position.y = 7.88;
  roofTrim2.castShadow = true;

  const stepRoof3 = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.85, 3.6), whiteStuccoMat);
  stepRoof3.position.y = 8.395;
  stepRoof3.castShadow = true;

  mayaDevi.add(roofEave1, stepRoof1, roofTrim1, stepRoof2, roofTrim2, stepRoof3);

  // 4 Corner miniature white-and-gold stupa finials on roof terrace corners
  for (const sx of [-4.2, 4.2]) {
    for (const sz of [-2.55, 2.55]) {
      const miniStupa = buildVotiveStupa(terracottaMat, whiteStuccoMat, giltGoldMat, 0.72);
      miniStupa.position.set(sx, 6.77, sz);
      mayaDevi.add(miniStupa);
    }
  }

  // Central Square Harmika Box with All-Seeing Buddha Wisdom Eyes on all 4 cardinal faces
  const harmikaMat = new THREE.MeshStandardMaterial({
    map: lTex.harmikaEyesMap,
    roughness: 0.48,
    metalness: 0.08,
  });
  const harmikaBox = new THREE.Mesh(
    new THREE.BoxGeometry(2.35, 1.18, 2.35),
    [harmikaMat, harmikaMat, giltGoldMat, giltGoldMat, harmikaMat, harmikaMat],
  );
  harmikaBox.position.y = 9.41;
  harmikaBox.castShadow = true;

  const harmikaCornice = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.22, 2.65), giltGoldMat);
  harmikaCornice.position.y = 10.11;
  harmikaCornice.castShadow = true;
  mayaDevi.add(harmikaBox, harmikaCornice);

  // 13-Ring Gilded Copper Chakravali Spire + Golden Chattra Parasol + Kalash Gajur
  for (let r = 0; r < 13; r++) {
    const t = r / 12;
    const rad = THREE.MathUtils.lerp(0.92, 0.22, t);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.92, rad, 0.19, 20), giltGoldMat);
    ring.position.y = 10.32 + r * 0.20;
    ring.castShadow = true;
    mayaDevi.add(ring);
  }
  const chattraCanopy = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.78, 0.24, 24), giltGoldMat);
  chattraCanopy.position.y = 13.02;
  chattraCanopy.castShadow = true;
  const topGajur = createDetailedGajurSpire(giltGoldMat, warmBronzeMat, 1.05);
  topGajur.position.y = 13.14;
  mayaDevi.add(chattraCanopy, topGajur);

  // Sculpted Lungta Prayer-Flag Strands radiating from Harmika to the 4 corner roof stupas
  const lungtaHex = [0x2563eb, 0xf8fafc, 0xdc2626, 0x16a34a, 0xeab308];
  const lungtaMats = lungtaHex.map(
    (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.78, side: THREE.DoubleSide }),
  );
  const lungtaFlagGeo = new THREE.PlaneGeometry(0.24, 0.20);
  for (const [cx, cz] of [
    [-4.2, -2.55],
    [4.2, -2.55],
    [-4.2, 2.55],
    [4.2, 2.55],
  ] as Array<[number, number]>) {
    const startPt = new THREE.Vector3(Math.sign(cx) * 1.12, 9.96, Math.sign(cz) * 1.12);
    const endPt = new THREE.Vector3(cx, 8.22, cz);
    const midPt = startPt.clone().lerp(endPt, 0.5);
    midPt.y -= 0.45;
    const strand = new THREE.CatmullRomCurve3([startPt, midPt, endPt]);
    const cordMesh = new THREE.Mesh(new THREE.TubeGeometry(strand, 10, 0.015, 5, false), timberMat);
    cordMesh.userData.nonCollidable = true;
    mayaDevi.add(cordMesh);
    for (let f = 1; f <= 7; f++) {
      const t = f / 8;
      const pt = strand.getPoint(t);
      const tangent = strand.getTangent(t);
      const fl = new THREE.Mesh(lungtaFlagGeo, lungtaMats[f % lungtaMats.length]);
      fl.position.set(pt.x, pt.y - 0.10, pt.z);
      fl.rotation.y = Math.atan2(tangent.x, tangent.z) + Math.PI / 2;
      fl.userData.nonCollidable = true;
      mayaDevi.add(fl);
    }
  }

  cameraOccluders.push(northWall, roofEave1, stepRoof1, stepRoof2);
  group.add(mayaDevi);

  // =========================================================================
  // 4. HERO MONUMENTAL GREAT SHAKYAMUNI BUDDHA (lx = 0, lz = +7.2, ~7.2m tall!)
  // =========================================================================
  const heroSkinMat = new THREE.MeshStandardMaterial({
    map: lTex.giltBronzeMap,
    normalMap: lTex.giltBronzeNormal,
    normalScale: new THREE.Vector2(0.55, 0.55),
    roughnessMap: lTex.giltBronzeRough,
    color: 0xffd970,
    roughness: 0.26,
    metalness: 0.82,
    emissive: 0x3b2404,
    emissiveIntensity: 0.14,
  });
  const heroRobeMat = new THREE.MeshStandardMaterial({
    map: lTex.giltBronzeMap,
    normalMap: lTex.giltBronzeNormal,
    normalScale: new THREE.Vector2(0.75, 0.75),
    roughnessMap: lTex.giltBronzeRough,
    color: 0xd99b2e,
    roughness: 0.42,
    metalness: 0.74,
  });
  const heroHairMat = new THREE.MeshStandardMaterial({
    color: 0x1d2532,
    roughness: 0.72,
    metalness: 0.18,
  });
  const heroMats: BuddhaMaterials = {
    skinMat: heroSkinMat,
    robeMat: heroRobeMat,
    hairMat: heroHairMat,
    goldMat: giltGoldMat,
    bronzeMat: warmBronzeMat,
    stonePlinthMat: chunarStoneMat,
    crimsonLacquerMat,
    flameMat: flameGlowMat,
  };
  const heroBuddha = createMonumentalSeatedBuddha(heroMats, {
    scale: 1.18,
    pose: 'bhumisparsha',
    withNagaCanopy: false,
    withOfferingLamps: true,
  });
  heroBuddha.position.set(0, 0.135, 7.2);
  group.add(heroBuddha);

  // Hero Buddha Forecourt Light (Beacon Light 2)
  const heroLight = new THREE.PointLight(0xffdfa3, 2.2, 24, 1.4);
  heroLight.position.set(0, 5.8, 9.6);
  group.add(heroLight);
  beaconLights.push(heroLight);

  // =========================================================================
  // 5. HISTORIC ASHOKA PILLAR (lx = -11.4, lz = -5.0, ~9.2m tall!)
  // =========================================================================
  const ashokaPillar = buildAshokaPillar(
    chunarStoneMat,
    brickMat,
    wroughtIronMat,
    giltGoldMat,
    lTex.brahmiEdictMap,
    lTex.brahmiEdictNormal,
  );
  ashokaPillar.position.set(-11.4, 0.10, -5.0);
  group.add(ashokaPillar);

  // =========================================================================
  // 6. SACRED PUSHKARINI BATHING POOL (lx = +11.6, lz = -4.6, stepped brick ghat)
  // =========================================================================
  const pond = new THREE.Group();
  pond.position.set(11.6, 0.0, -4.6);

  // Outer carved Chunar sandstone coping border (9.6m W x 10.8m D)
  const rimThickness = 0.72;
  const rimH = 0.36;
  const pondW = 9.6;
  const pondD = 10.8;
  const rimBars: Array<[number, number, number, number]> = [
    [0, -pondD * 0.5 + rimThickness * 0.5, pondW, rimThickness],
    [0, pondD * 0.5 - rimThickness * 0.5, pondW, rimThickness],
    [-pondW * 0.5 + rimThickness * 0.5, 0, rimThickness, pondD - rimThickness * 2],
    [pondW * 0.5 - rimThickness * 0.5, 0, rimThickness, pondD - rimThickness * 2],
  ];
  for (const [rx, rz, rw, rd] of rimBars) {
    const rim = new THREE.Mesh(new THREE.BoxGeometry(rw, rimH, rd), chunarStoneMat);
    rim.position.set(rx, rimH * 0.5, rz);
    rim.castShadow = true;
    rim.receiveShadow = true;
    pond.add(rim);
  }

  // 4 Stepped Maurya Brick Ghat Tiers descending cleanly down to pond floor y = -0.58
  const ghatTiers: Array<[number, number, number, number]> = [
    [8.2, 9.4, 0.18, 0.16],
    [7.4, 8.6, 0.18, -0.02],
    [6.6, 7.8, 0.18, -0.20],
    [5.8, 7.0, 0.18, -0.38],
  ];
  for (const [tw, td, th, ty] of ghatTiers) {
    const bw = 0.44;
    const stepBars: Array<[number, number, number, number]> = [
      [0, -td * 0.5 + bw * 0.5, tw, bw],
      [0, td * 0.5 - bw * 0.5, tw, bw],
      [-tw * 0.5 + bw * 0.5, 0, bw, td - bw * 2],
      [tw * 0.5 - bw * 0.5, 0, bw, td - bw * 2],
    ];
    for (const [sx, sz, sw, sd] of stepBars) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(sw, th, sd), brickMat);
      step.position.set(sx, ty, sz);
      step.receiveShadow = true;
      pond.add(step);
    }
  }

  // Dark carved slate pond floor
  const pondFloor = new THREE.Mesh(
    new THREE.BoxGeometry(7.2, 0.12, 8.4),
    new THREE.MeshStandardMaterial({ color: 0x1e2c2e, roughness: 0.9 }),
  );
  pondFloor.position.set(0, -0.56, 0);
  pondFloor.receiveShadow = true;
  pond.add(pondFloor);

  // Animated Realistic Pond Water Surface (y = -0.08)
  const pondWaterUTime = { value: 0 };
  const pondWaterMat = new THREE.MeshStandardMaterial({
    color: 0x1b6d72,
    normalMap: textures.waterNormal,
    normalScale: new THREE.Vector2(0.38, 0.38),
    roughness: 0.08,
    metalness: 0.44,
    transparent: true,
    opacity: 0.88,
  });
  applyRealisticWaterShader(pondWaterMat, pondWaterUTime, {
    mode: 'pond',
    maxRadius: 4.5,
    flowSpeed: 0.85,
    deepTint: 0x0a393f,
    shallowTint: 0x267577,
  });
  const pondWaterMesh = new THREE.Mesh(new THREE.PlaneGeometry(8.1, 9.3, 16, 16), pondWaterMat);
  pondWaterMesh.rotation.x = -Math.PI / 2;
  pondWaterMesh.position.set(0, -0.08, 0);
  pondWaterMesh.receiveShadow = true;
  pondWaterMesh.userData.nonCollidable = true;
  pond.add(pondWaterMesh);

  const pondController = new THREE.Object3D();
  pondController.userData.noMerge = true;
  pondController.userData.onFlickerUpdate = (elapsed: number) => {
    pondWaterUTime.value = elapsed;
  };
  animatedNodes.push(pondController);

  // Blooming Pink & White Sacred Lotus Flowers & Lily Pads floating on Pushkarini water
  const lilyMat = new THREE.MeshStandardMaterial({ color: 0x35743b, roughness: 0.65, side: THREE.DoubleSide });
  const lotusPinkMat = new THREE.MeshStandardMaterial({ color: 0xf498b8, roughness: 0.45, side: THREE.DoubleSide });
  const lotusWhiteMat = new THREE.MeshStandardMaterial({ color: 0xfff3f6, roughness: 0.42, side: THREE.DoubleSide });
  const lilyGeo = new THREE.CircleGeometry(0.26, 14, 0.25, Math.PI * 1.8);
  lilyGeo.rotateX(-Math.PI / 2);
  const lotusPetalGeo = new THREE.ConeGeometry(0.065, 0.17, 6);

  const lotusSpots: Array<[number, number, boolean]> = [
    [-1.4, -1.8, true], [1.6, -2.1, false], [-1.8, 0.4, false], [1.2, 0.9, true],
    [0.2, -0.6, true], [-0.9, 2.2, true], [1.9, 2.4, false], [-2.1, -0.9, false],
  ];
  const lilyInst = new THREE.InstancedMesh(lilyGeo, lilyMat, lotusSpots.length);
  lilyInst.userData.nonCollidable = true;
  lotusSpots.forEach(([lx, lz, isPink], idx) => {
    _v3.set(lx, -0.065, lz);
    _q.setFromEuler(_e.set(0, idx * 1.3, 0));
    _s.setScalar(0.85 + (idx % 3) * 0.2);
    _m4.compose(_v3, _q, _s);
    lilyInst.setMatrixAt(idx, _m4);

    // Multi-petal lotus blossom on pad
    const flower = new THREE.Group();
    flower.position.set(lx, -0.055, lz);
    flower.userData.nonCollidable = true;
    const pMat = isPink ? lotusPinkMat : lotusWhiteMat;
    for (let p = 0; p < 6; p++) {
      const a = (p / 6) * Math.PI * 2;
      const pet = new THREE.Mesh(lotusPetalGeo, pMat);
      pet.position.set(Math.sin(a) * 0.055, 0.04, Math.cos(a) * 0.055);
      pet.rotation.y = a;
      pet.rotation.x = 0.65;
      flower.add(pet);
    }
    pond.add(flower);
  });
  lilyInst.instanceMatrix.needsUpdate = true;
  pond.add(lilyInst);

  // 4 Corner Stone Diya Bollards around Pushkarini Pond
  for (const sx of [-4.45, 4.45]) {
    for (const sz of [-5.05, 5.05]) {
      const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.56, 8), chunarStoneMat);
      bollard.position.set(sx, 0.52, sz);
      bollard.castShadow = true;
      const diyo = createDetailedBrassSukundaDiyo(giltGoldMat, warmBronzeMat, flameGlowMat, 0.72, true);
      diyo.position.set(sx, 0.80, sz);
      pond.add(bollard, diyo);
    }
  }
  group.add(pond);

  // =========================================================================
  // 7. COMPANION PAVILION BUDDHA STATUES (WEST & EAST COURT PAVILIONS)
  // =========================================================================
  // West Pavilion: Carved Dark-Basalt Dhyana Buddha with 7-Headed Muchalinda Naga Canopy
  const westPavilion = new THREE.Group();
  westPavilion.position.set(-11.8, 0.10, 4.2);
  westPavilion.rotation.y = 0.42;
  const westMandapa = buildMandapaCanopy(chunarStoneMat, brickMat, terracottaMat, giltGoldMat, warmBronzeMat);
  const basaltBuddhaMats: BuddhaMaterials = {
    skinMat: buddhaDarkBasaltMat,
    robeMat: buddhaDarkBasaltMat,
    hairMat: heroHairMat,
    goldMat: giltGoldMat,
    bronzeMat: warmBronzeMat,
    stonePlinthMat: chunarStoneMat,
    crimsonLacquerMat,
    flameMat: flameGlowMat,
  };
  const nagaBuddha = createMonumentalSeatedBuddha(basaltBuddhaMats, {
    scale: 0.74,
    pose: 'dhyana',
    withNagaCanopy: true,
    withOfferingLamps: false,
  });
  nagaBuddha.position.set(0, 0.26, -0.05);
  const westPavilionLight = new THREE.PointLight(0xffdfb0, 1.6, 11, 1.4);
  westPavilionLight.position.set(0, 4.15, 0.75);
  beaconLights.push(westPavilionLight);
  westPavilion.add(westMandapa, nagaBuddha, westPavilionLight);
  group.add(westPavilion);

  // East Pavilion: Monumental Standing Abhaya Mudra (Peace Blessing) Buddha
  const eastPavilion = new THREE.Group();
  eastPavilion.position.set(11.8, 0.10, 4.2);
  eastPavilion.rotation.y = -0.42;
  const eastMandapa = buildMandapaCanopy(chunarStoneMat, brickMat, terracottaMat, giltGoldMat, warmBronzeMat);
  const standingBuddha = createStandingBlessingBuddha(heroMats, 0.94);
  standingBuddha.position.set(0, 0.26, 0);
  const eastPavilionLight = new THREE.PointLight(0xffdfb0, 1.6, 11, 1.4);
  eastPavilionLight.position.set(0, 4.15, 0.75);
  beaconLights.push(eastPavilionLight);
  eastPavilion.add(eastMandapa, standingBuddha, eastPavilionLight);
  group.add(eastPavilion);

  // =========================================================================
  // 8. SACRED BODHI TREE CHAUTARA (SW: -12.4, +12.6) & ETERNAL PEACE FLAME (SE: +12.0, +12.6)
  // =========================================================================
  // SW Sacred Bodhi Tree Chautara
  const bodhi = new THREE.Group();
  bodhi.position.set(-12.4, 0.10, 12.6);
  const bodhiTier1 = new THREE.Mesh(new THREE.CylinderGeometry(2.65, 2.82, 0.34, 8), brickMat);
  bodhiTier1.position.y = 0.17;
  bodhiTier1.receiveShadow = true;
  bodhiTier1.castShadow = true;
  const bodhiTier2 = new THREE.Mesh(new THREE.CylinderGeometry(2.12, 2.24, 0.36, 8), whiteStuccoMat);
  bodhiTier2.position.y = 0.52;
  bodhiTier2.receiveShadow = true;
  bodhiTier2.castShadow = true;
  const bodhiSoil = new THREE.Mesh(
    new THREE.CylinderGeometry(1.84, 1.90, 0.12, 16),
    new THREE.MeshStandardMaterial({ color: 0x4b3828, roughness: 0.95 }),
  );
  bodhiSoil.position.y = 0.68;
  bodhi.add(bodhiTier1, bodhiTier2, bodhiSoil);

  // Fluted Bodhi Pipal Buttress Roots, Sweeping Multi-Bough Trunk & Prayer Scarf
  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.68, 0),
    new THREE.Vector3(0.10, 1.85, 0.06),
    new THREE.Vector3(-0.06, 3.05, -0.04),
    new THREE.Vector3(0.04, 4.15, 0.04),
  ]);
  const bodhiTrunk = new THREE.Mesh(new THREE.TubeGeometry(trunkCurve, 14, 0.30, 10, false), timberMat);
  bodhiTrunk.castShadow = true;
  bodhi.add(bodhiTrunk);

  const saffronScarfMat = new THREE.MeshStandardMaterial({ color: 0xdf7b1c, roughness: 0.72 });
  const prayerScarf = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.055, 8, 20), saffronScarfMat);
  prayerScarf.rotation.x = Math.PI / 2;
  prayerScarf.position.set(0.05, 1.68, 0.03);
  bodhi.add(prayerScarf);

  const bodhiDiyo = createDetailedBrassSukundaDiyo(giltGoldMat, warmBronzeMat, flameGlowMat, 0.72, true);
  bodhiDiyo.position.set(0.95, 0.70, 1.65);
  bodhi.add(bodhiDiyo);

  for (let r = 0; r < 6; r++) {
    const a = (r / 6) * Math.PI * 2 + 0.25;
    const rootCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(a) * 0.22, 1.48, Math.sin(a) * 0.22),
      new THREE.Vector3(Math.cos(a) * 0.56, 0.96, Math.sin(a) * 0.56),
      new THREE.Vector3(Math.cos(a) * 1.15, 0.71, Math.sin(a) * 1.15),
    ]);
    const rootMesh = new THREE.Mesh(new THREE.TubeGeometry(rootCurve, 8, 0.11, 8, false), timberMat);
    rootMesh.castShadow = true;
    bodhi.add(rootMesh);
  }

  const branchEndpoints: THREE.Vector3[] = [];
  for (let b = 0; b < 5; b++) {
    const a = (b / 5) * Math.PI * 2 + 0.35;
    const reach = 2.05 + (b % 2) * 0.42;
    const topY = 4.95 + (b % 3) * 0.45;
    const bCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.03, 3.25 + (b % 2) * 0.25, 0.02),
      new THREE.Vector3(Math.cos(a) * reach * 0.52, 4.15, Math.sin(a) * reach * 0.52),
      new THREE.Vector3(Math.cos(a) * reach, topY, Math.sin(a) * reach),
    ]);
    const bMesh = new THREE.Mesh(new THREE.TubeGeometry(bCurve, 10, 0.11, 8, false), timberMat);
    bMesh.castShadow = true;
    bodhi.add(bMesh);
    branchEndpoints.push(bCurve.getPoint(0.65), bCurve.getPoint(1.0));
  }
  branchEndpoints.push(new THREE.Vector3(0, 5.55, 0), new THREE.Vector3(0.2, 5.85, -0.15));

  // Dense multi-tone Botanical Bodhi Leaf Sprigs (InstancedMesh replacing toy poly spheres)
  const sprigGeo = new THREE.ConeGeometry(0.32, 0.44, 5);
  sprigGeo.scale(1.25, 0.52, 0.95);
  const sprigMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.72 });
  const leafPalette = [0x3d6e31, 0x4b7f3a, 0x2f5a26, 0x5c8f43, 0x679948];
  const leafCount = 680;
  const leafInst = new THREE.InstancedMesh(sprigGeo, sprigMat, leafCount);
  leafInst.castShadow = true;
  leafInst.receiveShadow = true;
  leafInst.userData.nonCollidable = true;
  for (let i = 0; i < leafCount; i++) {
    const center = branchEndpoints[i % branchEndpoints.length];
    const ga = i * 2.39996323;
    const rad = Math.sqrt(((i * 19) % 100) / 100) * 1.38;
    const hVar = (((i * 37) % 100) / 100 - 0.35) * 1.15;
    _v3.set(
      center.x + Math.cos(ga) * rad,
      Math.max(3.65, center.y + hVar),
      center.z + Math.sin(ga) * rad,
    );
    _q.setFromEuler(_e.set(((i * 7) % 10) * 0.08 - 0.4, ga, ((i * 11) % 10) * 0.06 - 0.3));
    _s.setScalar(0.75 + ((i * 13) % 10) * 0.06);
    _m4.compose(_v3, _q, _s);
    leafInst.setMatrixAt(i, _m4);
    _colorTmp.setHex(leafPalette[i % leafPalette.length]);
    leafInst.setColorAt(i, _colorTmp);
  }
  leafInst.instanceMatrix.needsUpdate = true;
  if (leafInst.instanceColor) leafInst.instanceColor.needsUpdate = true;
  bodhi.add(leafInst);
  group.add(bodhi);

  // SE Eternal Peace Flame Monument (carved lotus brazier + sculpted dual-layer flame + PointLight)
  const peaceFlame = new THREE.Group();
  peaceFlame.position.set(12.0, 0.10, 12.6);
  const pfBase1 = new THREE.Mesh(new THREE.CylinderGeometry(1.62, 1.80, 0.28, 8), chunarStoneMat);
  pfBase1.position.y = 0.14;
  pfBase1.castShadow = true;
  pfBase1.receiveShadow = true;
  const pfBase2 = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.30, 0.40, 8), marbleWalkMat);
  pfBase2.position.y = 0.48;
  pfBase2.castShadow = true;
  const pfPedestalPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.58, 0.0),
    new THREE.Vector2(0.46, 0.22),
    new THREE.Vector2(0.34, 0.48),
    new THREE.Vector2(0.44, 0.72),
    new THREE.Vector2(0.38, 0.84),
  ];
  const pfPedestal = new THREE.Mesh(new THREE.LatheGeometry(pfPedestalPts, 20), warmBronzeMat);
  pfPedestal.position.y = 0.68;
  pfPedestal.castShadow = true;
  const pfBowlPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.38, 0.02),
    new THREE.Vector2(0.78, 0.20),
    new THREE.Vector2(0.84, 0.34),
    new THREE.Vector2(0.74, 0.36),
    new THREE.Vector2(0.0, 0.18),
  ];
  const pfBowl = new THREE.Mesh(new THREE.LatheGeometry(pfBowlPts, 24), giltGoldMat);
  pfBowl.position.y = 1.50;
  pfBowl.castShadow = true;
  const pfEmber = new THREE.Mesh(
    new THREE.SphereGeometry(0.46, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
    new THREE.MeshStandardMaterial({
      color: 0x7c2008,
      emissive: 0xff5a18,
      emissiveIntensity: 2.1,
      roughness: 0.65,
    }),
  );
  pfEmber.position.y = 1.66;

  const pfFlameCore = createSacredFlameGroup(flameGlowMat, 3.8);
  pfFlameCore.position.y = 1.78;
  pfFlameCore.userData.nonCollidable = true;
  pfFlameCore.userData.noMerge = true;
  pfFlameCore.userData.onFlickerUpdate = (elapsed: number) => {
    const pulse = 1 + Math.sin(elapsed * 7.2) * 0.12 + Math.cos(elapsed * 11.4) * 0.06;
    pfFlameCore.scale.set(1 + Math.sin(elapsed * 5.3) * 0.07, pulse, 1 + Math.cos(elapsed * 6.1) * 0.07);
  };
  animatedNodes.push(pfFlameCore);

  const pfLight = new THREE.PointLight(0xffa43c, 2.2, 16, 1.5);
  pfLight.position.set(0, 2.55, 0);
  beaconLights.push(pfLight);

  peaceFlame.add(pfBase1, pfBase2, pfPedestal, pfBowl, pfEmber, pfFlameCore, pfLight);
  group.add(peaceFlame);

  // =========================================================================
  // 9. VOTIVE STUPAS, SPINNING MANI PRAYER WHEELS, PEACE LANTERNS & SHILALEKH
  // =========================================================================
  // 6 Mauryan Votive Stupas flanking the ceremonial court
  for (const [vx, vz] of [
    [-5.6, -1.6], [5.6, -1.6],
    [-5.6, 8.8], [5.6, 8.8],
    [-5.6, -12.2], [5.6, -12.2],
  ] as Array<[number, number]>) {
    const stupa = buildVotiveStupa(brickMat, whiteStuccoMat, giltGoldMat, 1.02);
    stupa.position.set(vx, 0.10, vz);
    group.add(stupa);
  }

  // 2 Spinning Mani Brass Prayer-Wheel Racks flanking South Approach (lx = +-5.4, lz = +12.6)
  const prayerWheelMat = new THREE.MeshStandardMaterial({
    map: jTex.prayerWheelMap,
    normalMap: jTex.prayerWheelNormal,
    roughnessMap: jTex.prayerWheelRough,
    color: 0xffd670,
    roughness: 0.34,
    metalness: 0.85,
  });
  for (const side of [-1, 1]) {
    const rack = new THREE.Group();
    rack.position.set(side * 5.6, 0.10, 12.6);
    const rBase = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.24, 2.8), brickMat);
    rBase.position.y = 0.12;
    rBase.castShadow = true;
    for (const pz of [-1.18, 1.18]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.42, 0.22), timberMat);
      post.position.set(0, 0.95, pz);
      rack.add(post);
    }
    const rRoof = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.18, 2.86), terracottaMat);
    rRoof.position.y = 1.72;
    rRoof.castShadow = true;
    rack.add(rBase, rRoof);

    for (const wz of [-0.72, 0, 0.72]) {
      const spinner = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.42, 16), prayerWheelMat);
      spinner.position.set(0, 1.05, wz);
      spinner.castShadow = true;
      rack.add(spinner);
      animatedNodes.push(spinner);
    }
    group.add(rack);
  }

  // 10 Carved Peace Garden Stone Lanterns along ceremonial walks & gates
  for (const [lx, lz] of [
    [-3.7, 15.2], [3.7, 15.2],
    [-3.7, 10.6], [3.7, 10.6],
    [-3.7, 2.4], [3.7, 2.4],
    [-3.7, -11.4], [3.7, -11.4],
    [-8.4, 7.6], [8.4, 7.6],
  ] as Array<[number, number]>) {
    const lantern = buildPeaceLantern(chunarStoneMat, warmBronzeMat, flameGlowMat);
    lantern.position.set(lx, 0.10, lz);
    group.add(lantern);
  }

  // Carved Heritage Shilalekh Monument Stele at South-East Forecourt (lx = +6.6, lz = +16.4)
  const shilalekh = new THREE.Group();
  shilalekh.position.set(6.6, 0.10, 16.4);
  shilalekh.rotation.y = -0.26;
  const sBase = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.34, 0.92), chunarStoneMat);
  sBase.position.y = 0.17;
  sBase.castShadow = true;
  for (const px of [-1.25, 1.25]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 2.28, 12), chunarStoneMat);
    col.position.set(px, 1.48, 0);
    col.castShadow = true;
    shilalekh.add(col);
  }
  const sPanelMat = new THREE.MeshStandardMaterial({
    map: lTex.shilalekhSignMap,
    roughness: 0.42,
    metalness: 0.16,
  });
  const sBoard = new THREE.Mesh(new THREE.BoxGeometry(2.38, 1.18, 0.16), [
    chunarStoneMat,
    chunarStoneMat,
    chunarStoneMat,
    chunarStoneMat,
    sPanelMat,
    sPanelMat,
  ]);
  sBoard.position.set(0, 1.44, 0);
  sBoard.castShadow = true;
  const sBeam = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.14, 0.48), chunarStoneMat);
  sBeam.position.set(0, 2.61, 0);
  const sCanopyH = 0.52;
  const sCanopy = new THREE.Mesh(
    createRectangularHipRoofGeometry(3.35, sCanopyH, 1.22, 0.54),
    terracottaMat,
  );
  sCanopy.position.set(0, 2.68 + sCanopyH * 0.5, 0);
  sCanopy.castShadow = true;
  const sGajur = createDetailedGajurSpire(giltGoldMat, warmBronzeMat, 0.46);
  sGajur.position.set(0, 2.68 + sCanopyH, 0);
  shilalekh.add(sBase, sBoard, sBeam, sCanopy, sGajur);
  group.add(shilalekh);

  // Register interactive temple bell metadata
  group.userData.templeBells = templeBells;

  // Hit target encompassing entire Lumbini sacred complex (36m x 14.5m x 36m)
  const hitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(36.0, 14.5, 36.0),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  hitMesh.position.set(0, 7.25, 2.0);
  hitMesh.layers.set(1);
  group.add(hitMesh);

  return { group, hitMesh, beaconLights, animatedNodes, cameraOccluders };
}

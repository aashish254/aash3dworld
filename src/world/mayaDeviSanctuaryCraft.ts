import * as THREE from 'three';
import { createSacredFlameGroup } from './janakiMandirCraft';
import { LumbiniTextureSet } from './lumbiniTextures';
import { applySanctumWeatheringShader } from './mayaDeviAtmosphere';
import {
  createAnatomicalHeadGeometry,
  createCarvedLotusPetalGeometry,
  createSculptedDhotiGeometry,
  createSculptedTorsoGeometry,
  createTaperedLimbGeometry,
} from './mayaDeviSculptureGeo';

const _m4 = new THREE.Matrix4();
const _v3 = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _e = new THREE.Euler();

export interface MayaDeviCraftMaterials {
  chunarStoneMat: THREE.Material;
  giltGoldMat: THREE.Material;
  warmBronzeMat: THREE.Material;
  darkMetalMat: THREE.Material;
  timberMat: THREE.Material;
  brickMat: THREE.Material;
  flameGlowMat: THREE.Material;
}

/**
 * Generates a smooth flat woven silk ribbon geometry along a 3D CatmullRomCurve3
 * so ceremonial Khata scarves drape naturally against the stone without looking like tubes.
 */
function buildFlatRibbonGeometry(
  curve: THREE.CatmullRomCurve3,
  segments: number,
  width: number,
  thickness: number,
  facingNormal: THREE.Vector3,
): THREE.BufferGeometry {
  const pts = curve.getPoints(segments);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const tangent = new THREE.Vector3();
  const side = new THREE.Vector3();
  const normal = new THREE.Vector3();

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    curve.getTangent(t, tangent).normalize();
    side.crossVectors(tangent, facingNormal);
    if (side.lengthSq() < 1e-4) {
      side.set(1, 0, 0);
    } else {
      side.normalize();
    }
    normal.crossVectors(side, tangent).normalize();

    const p = pts[i];
    const halfW = width * 0.5;
    const halfT = thickness * 0.5;

    // 4 vertices per ring: top-left, top-right, bottom-right, bottom-left
    const offsets: Array<[number, number]> = [
      [-halfW, halfT],
      [halfW, halfT],
      [halfW, -halfT],
      [-halfW, -halfT],
    ];
    for (let k = 0; k < 4; k++) {
      const [sw, st] = offsets[k];
      positions.push(
        p.x + side.x * sw + normal.x * st,
        p.y + side.y * sw + normal.y * st,
        p.z + side.z * sw + normal.z * st,
      );
      const u = k === 0 || k === 3 ? 0 : 1;
      uvs.push(u, t * 2.0);
    }

    if (i < segments) {
      const base = i * 4;
      const next = (i + 1) * 4;
      for (let f = 0; f < 4; f++) {
        const fNext = (f + 1) % 4;
        const a = base + f;
        const b = base + fNext;
        const c = next + fNext;
        const d = next + f;
        indices.push(a, b, c, a, c, d);
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
 * Sculpted serene Gupta-style human/deity head using analytical facial anatomy
 * (eye sockets, eyelids, arched brows, nose bridge & nostrils, cheeks, lips, chin, ears,
 * kundala rings, and ornate jatamukuta crown or Buddha ushnisha curls).
 */
function buildSculptedFigureHead(
  mainMat: THREE.Material,
  accentMat: THREE.Material,
  _darkLineMat: THREE.Material,
  scale = 1.0,
  isChild = false,
): THREE.Group {
  const hg = new THREE.Group();

  const headMesh = new THREE.Mesh(createAnatomicalHeadGeometry(isChild), mainMat);
  headMesh.castShadow = true;
  headMesh.receiveShadow = true;
  hg.add(headMesh);

  // Sculpted helix ears + elongated earlobes + ornate Kundala ear pendants (carved in stone/gold, never dark ink bands)
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.013, 0.048, 6, 10), mainMat);
    ear.scale.set(0.75, 1.0, 1.15);
    ear.rotation.z = side * -0.10;
    ear.position.set(side * 0.106, -0.008, -0.004);

    const earLobe = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), mainMat);
    earLobe.scale.set(0.8, 1.35, 0.85);
    earLobe.position.set(side * 0.107, -0.042, -0.002);

    const kundala = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.0045, 8, 16), accentMat);
    kundala.rotation.y = Math.PI * 0.5;
    kundala.position.set(side * 0.112, -0.060, 0.004);
    hg.add(ear, earLobe, kundala);
  }

  // Subtle carved auspicious forehead Urna tilak
  const urna = new THREE.Mesh(new THREE.SphereGeometry(0.0042, 8, 8), accentMat);
  urna.position.set(0, 0.048, 0.116);
  hg.add(urna);

  if (isChild) {
    // Noble Child Buddha Ushnisha + 4 tiers of sculpted spiral curls (InstancedMesh)
    const ushnisha = new THREE.Mesh(new THREE.SphereGeometry(0.050, 16, 14), mainMat);
    ushnisha.scale.set(1.0, 0.84, 1.0);
    ushnisha.position.set(0, 0.168, -0.006);
    const fillet = new THREE.Mesh(new THREE.TorusGeometry(0.060, 0.0055, 8, 22), accentMat);
    fillet.rotation.x = Math.PI * 0.5;
    fillet.position.set(0, 0.144, -0.005);
    hg.add(ushnisha, fillet);

    const curlGeo = new THREE.SphereGeometry(0.014, 7, 6);
    const curlPts: Array<[number, number, number]> = [];
    const curlRows: Array<[number, number, number]> = [
      [18, 0.106, 0.095],
      [15, 0.094, 0.122],
      [12, 0.070, 0.148],
      [8, 0.044, 0.182],
    ];
    curlRows.forEach(([cnt, rr, ry], rIdx) => {
      for (let i = 0; i < cnt; i++) {
        const a = (i / cnt) * Math.PI * 2 + rIdx * 0.3;
        if (rIdx === 0 && Math.cos(a) > 0.30) continue;
        curlPts.push([Math.sin(a) * rr * 0.94, ry, Math.cos(a) * rr * 0.96 - 0.006]);
      }
    });
    const curlInst = new THREE.InstancedMesh(curlGeo, mainMat, curlPts.length);
    curlPts.forEach(([cx, cy, cz], idx) => {
      _v3.set(cx, cy, cz);
      _q.identity();
      _s.setScalar(1);
      _m4.compose(_v3, _q, _s);
      curlInst.setMatrixAt(idx, _m4);
    });
    curlInst.instanceMatrix.needsUpdate = true;
    curlInst.computeBoundingSphere();
    hg.add(curlInst);
  } else {
    // Sculpted wavy hair parting + braided Jatamukuta chignon + raised Gupta diadem cleanly at hairline
    const hairCrown = new THREE.Mesh(new THREE.SphereGeometry(0.102, 20, 16), mainMat);
    hairCrown.scale.set(0.96, 0.68, 1.0);
    hairCrown.position.set(0, 0.108, -0.014);

    const chignon = new THREE.Mesh(new THREE.SphereGeometry(0.076, 16, 14), mainMat);
    chignon.scale.set(0.95, 0.88, 0.92);
    chignon.position.set(0, 0.178, -0.024);

    const chignonBand = new THREE.Mesh(new THREE.TorusGeometry(0.066, 0.0075, 8, 22), accentMat);
    chignonBand.rotation.x = Math.PI * 0.5;
    chignonBand.position.set(0, 0.152, -0.020);

    // Gupta jeweled diadem seated cleanly above the forehead hairline (never clipping eyes/brows)
    const diadem = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.0095, 8, 28), accentMat);
    diadem.rotation.x = Math.PI * 0.47;
    diadem.position.set(0, 0.114, -0.002);

    const frontMedallion = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.030, 0.016, 12), accentMat);
    frontMedallion.rotation.x = Math.PI * 0.44;
    frontMedallion.position.set(0, 0.136, 0.090);
    const crestTip = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.044, 8), accentMat);
    crestTip.position.set(0, 0.168, 0.082);
    crestTip.rotation.x = 0.16;
    hg.add(hairCrown, chignon, chignonBand, diadem, frontMedallion, crestTip);

    for (const side of [-1, 1]) {
      const sideRosette = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.012, 10), accentMat);
      sideRosette.rotation.z = side * -Math.PI * 0.42;
      sideRosette.rotation.y = side * 0.35;
      sideRosette.position.set(side * 0.074, 0.124, 0.056);
      hg.add(sideRosette);
    }
  }

  hg.scale.setScalar(scale);
  return hg;
}

/**
 * Sculpted anatomical hand with palm, thumb, and 4 articulated fingers.
 * Modes: 'open' (graceful open/hip), 'grasp' (curled around Sal branch), 'pointUp' (Siddhartha birth gesture).
 */
function buildHand(
  mat: THREE.Material,
  mirror = 1,
  pose: 'open' | 'grasp' | 'pointUp' = 'open',
): THREE.Group {
  const h = new THREE.Group();
  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 10), mat);
  palm.scale.set(0.95, 1.15, 0.50);
  h.add(palm);

  for (let i = 0; i < 4; i++) {
    const fLen = 0.026 - Math.abs(i - 1.2) * 0.004;
    const isIndex = (mirror === 1 && i === 0) || (mirror === -1 && i === 3);
    const fGroup = new THREE.Group();
    fGroup.position.set((-0.014 + i * 0.0095) * mirror, 0.020, 0.002);

    const prox = new THREE.Mesh(new THREE.CapsuleGeometry(0.0044, fLen * 0.58, 4, 8), mat);
    prox.position.y = fLen * 0.32;
    const dist = new THREE.Mesh(new THREE.CapsuleGeometry(0.0036, fLen * 0.45, 4, 8), mat);
    dist.position.set(0, fLen * 0.80, pose === 'open' ? 0.002 : 0.008);
    if (pose === 'grasp') {
      fGroup.rotation.x = 0.72 + i * 0.06;
      dist.rotation.x = 0.78;
    } else if (pose === 'pointUp') {
      if (isIndex) {
        prox.scale.set(1.0, 1.25, 1.0);
        fGroup.rotation.x = -0.05;
      } else {
        fGroup.rotation.x = 1.25;
        dist.rotation.x = 0.95;
      }
    } else {
      fGroup.rotation.x = 0.14 + i * 0.04;
      dist.rotation.x = 0.16;
    }
    fGroup.add(prox, dist);
    h.add(fGroup);
  }

  const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.0046, 0.020, 4, 8), mat);
  thumb.rotation.z = mirror * (pose === 'grasp' ? 0.72 : 0.48);
  thumb.rotation.x = pose === 'grasp' ? 0.45 : 0.15;
  thumb.position.set(mirror * -0.022, 0.008, 0.010);
  h.add(thumb);
  return h;
}

/**
 * Sculpted bare foot with contoured instep, heel, and 5 articulated toes.
 */
function buildSculptedFoot(mat: THREE.Material, accentMat: THREE.Material, mirror = 1, scale = 1.0): THREE.Group {
  const fg = new THREE.Group();
  const sole = new THREE.Mesh(new THREE.CapsuleGeometry(0.021, 0.062, 6, 10), mat);
  sole.rotation.x = Math.PI * 0.5;
  sole.scale.set(1.05, 1.0, 0.58);
  sole.position.set(0, 0.012, 0.020);
  fg.add(sole);

  for (let t = 0; t < 5; t++) {
    const toe = new THREE.Mesh(new THREE.SphereGeometry(0.0056 - t * 0.0005, 6, 6), mat);
    toe.scale.set(0.85, 0.78, 1.35);
    toe.position.set(mirror * (-0.014 + t * 0.0072), 0.009, 0.064 - t * 0.0025);
    fg.add(toe);
  }

  const anklet = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.006, 8, 16), accentMat);
  anklet.rotation.x = Math.PI * 0.5;
  anklet.position.set(0, 0.032, -0.004);
  fg.add(anklet);

  fg.scale.setScalar(scale);
  return fg;
}

/**
 * Builds an authentic double-tier Padmasana Lotus Pedestal with 16 downturned lower petals,
 * 16 upturned upper petals, beaded pearl collar, and contoured seedpod top.
 */
function buildCarvedLotusPedestal(
  mainMat: THREE.Material,
  accentMat: THREE.Material,
  radius: number,
  height: number,
  petalCount = 16,
): THREE.Group {
  const lg = new THREE.Group();
  const corePts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(radius * 1.04, 0.0),
    new THREE.Vector2(radius * 0.94, height * 0.25),
    new THREE.Vector2(radius * 0.72, height * 0.48),
    new THREE.Vector2(radius * 0.92, height * 0.78),
    new THREE.Vector2(radius * 0.88, height * 0.96),
    new THREE.Vector2(radius * 0.80, height),
    new THREE.Vector2(0.0, height),
  ];
  const core = new THREE.Mesh(new THREE.LatheGeometry(corePts, 32), mainMat);
  core.castShadow = true;
  core.receiveShadow = true;
  lg.add(core);

  const waistRing = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.74, height * 0.08, 8, 28), accentMat);
  waistRing.rotation.x = Math.PI * 0.5;
  waistRing.position.y = height * 0.48;
  const topRim = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.87, height * 0.06, 8, 28), accentMat);
  topRim.rotation.x = Math.PI * 0.5;
  topRim.position.y = height * 0.94;
  lg.add(waistRing, topRim);

  // Carved 3D Lotus Petals (lower downturned & upper upturned tiers via InstancedMesh)
  const petalGeo = createCarvedLotusPetalGeometry(
    (Math.PI * 2 * radius * 0.95) / petalCount * 1.15,
    height * 0.46,
    radius * 0.09,
  );
  const petalInst = new THREE.InstancedMesh(petalGeo, accentMat, petalCount * 2);
  let idx = 0;
  for (let i = 0; i < petalCount; i++) {
    const a = (i / petalCount) * Math.PI * 2;
    // Lower downturned petal ring
    _v3.set(Math.sin(a) * radius * 0.78, height * 0.44, Math.cos(a) * radius * 0.78);
    _q.setFromEuler(_e.set(Math.PI - 0.38, a, 0, 'YXZ'));
    _s.set(1.0, 1.0, 1.0);
    _m4.compose(_v3, _q, _s);
    petalInst.setMatrixAt(idx++, _m4);

    // Upper upturned petal ring (staggered half-petal)
    const a2 = a + Math.PI / petalCount;
    _v3.set(Math.sin(a2) * radius * 0.76, height * 0.52, Math.cos(a2) * radius * 0.76);
    _q.setFromEuler(_e.set(0.32, a2, 0, 'YXZ'));
    _s.set(0.96, 0.96, 1.0);
    _m4.compose(_v3, _q, _s);
    petalInst.setMatrixAt(idx++, _m4);
  }
  petalInst.instanceMatrix.needsUpdate = true;
  petalInst.computeBoundingSphere();
  petalInst.castShadow = true;
  lg.add(petalInst);

  return lg;
}

/**
 * 1. Museum-Grade Carved 4th-Century Gupta Chunar Sandstone Nativity Stele & Sculpted Ensemble:
 *    - Stepped sandstone sanctuary plinth with recessed niches
 *    - Fluted Torana temple pilasters + carved stepped arched niche + Dharmachakra apex
 *    - Tapered gnarled Sal tree (Shorea robusta) trunk, boughs, cupped leaves & Sal blossoms
 *    - Sculpted 3D Queen Maya Devi in Gupta tribhanga pose with anatomical face/hands, draped folds, jewelry & carved lotus halo
 *    - Sister Mahaprajapati Gautami (left, sculpted both-arms companion), Standing Golden Baby Prince Siddhartha (right, pointing skyward)
 *    - Flanking Brahma & Indra carved low-relief attendants + flat woven ivory-gold Khata silk scarves
 */
export function buildDetailedNativitySteleEnsemble(
  lTex: LumbiniTextureSet,
  mats: MayaDeviCraftMaterials,
): THREE.Group {
  const root = new THREE.Group();

  // Weathered warm buff-ochre Chunar sandstone (rich midtone sculptural shadows without white blowout)
  const carvedStoneMat = new THREE.MeshStandardMaterial({
    map: lTex.carvedSandstoneMap,
    normalMap: lTex.carvedSandstoneNormal,
    normalScale: new THREE.Vector2(1.9, 1.9),
    roughnessMap: lTex.carvedSandstoneRough,
    color: 0xc29e74,
    roughness: 0.80,
    metalness: 0.03,
  });
  const darkStoneMat = new THREE.MeshStandardMaterial({
    map: lTex.carvedSandstoneMap,
    normalMap: lTex.carvedSandstoneNormal,
    normalScale: new THREE.Vector2(1.5, 1.5),
    color: 0x765c40,
    roughness: 0.88,
    metalness: 0.02,
  });
  const giltStatueMat = new THREE.MeshStandardMaterial({
    map: lTex.giltBronzeMap,
    normalMap: lTex.giltBronzeNormal,
    roughnessMap: lTex.giltBronzeRough,
    color: 0xe6b54b,
    roughness: 0.30,
    metalness: 0.86,
    emissive: 0x261402,
    emissiveIntensity: 0.06,
  });
  const salStoneLeafMat = new THREE.MeshStandardMaterial({
    map: lTex.carvedSandstoneMap,
    normalMap: lTex.carvedSandstoneNormal,
    color: 0xa2835a,
    roughness: 0.78,
    metalness: 0.03,
  });

  // Apply subtle height-aware shader weathering & ancient moss patina near altar plinth & lotus bases
  const carvedWeather = applySanctumWeatheringShader(carvedStoneMat, {
    cacheKey: 'maya-devi-carved-sandstone-weather-v1',
    minRelY: -0.25,
    maxRelY: 0.38,
    mossStrength: 0.34,
    dampDarken: 0.74,
    noiseScale: 5.8,
    initialAnchorY: 0.93,
  });
  const darkWeather = applySanctumWeatheringShader(darkStoneMat, {
    cacheKey: 'maya-devi-dark-sandstone-weather-v1',
    minRelY: -0.28,
    maxRelY: 0.42,
    mossStrength: 0.38,
    dampDarken: 0.70,
    noiseScale: 4.8,
    initialAnchorY: 0.93,
  });
  const giltWeather = applySanctumWeatheringShader(giltStatueMat, {
    cacheKey: 'maya-devi-gilt-statue-weather-v1',
    minRelY: 0.06,
    maxRelY: 0.34,
    mossStrength: 0.22,
    dampDarken: 0.82,
    noiseScale: 7.2,
    initialAnchorY: 0.93,
  });

  // A. Multi-stepped brick & carved Chunar sandstone sanctuary altar pedestal
  const brickBase = new THREE.Mesh(new THREE.BoxGeometry(3.25, 1.24, 1.56), mats.brickMat);
  brickBase.position.y = 0.06;
  brickBase.receiveShadow = true;

  const lowerMolding = new THREE.Mesh(new THREE.BoxGeometry(3.38, 0.14, 1.66), darkStoneMat);
  lowerMolding.position.y = 0.68;
  lowerMolding.receiveShadow = true;

  const altarStoneDeck = new THREE.Mesh(new THREE.BoxGeometry(3.26, 0.14, 1.54), carvedStoneMat);
  altarStoneDeck.position.y = 0.80;
  altarStoneDeck.receiveShadow = true;
  altarStoneDeck.castShadow = true;

  const syncAltarWeatherAnchor = () => {
    const wy = altarStoneDeck.matrixWorld.elements[13];
    carvedWeather.uniforms.uWeatherAnchorY.value = wy;
    darkWeather.uniforms.uWeatherAnchorY.value = wy;
    giltWeather.uniforms.uWeatherAnchorY.value = wy;
  };
  lowerMolding.onBeforeRender = syncAltarWeatherAnchor;
  altarStoneDeck.onBeforeRender = syncAltarWeatherAnchor;

  for (const fx of [-1.25, -0.75, -0.25, 0.25, 0.75, 1.25]) {
    const pil = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.26, 0.08), carvedStoneMat);
    pil.position.set(fx, 0.74, 0.78);
    root.add(pil);
  }
  root.add(brickBase, lowerMolding, altarStoneDeck);

  // B. Fluted Sandstone Torana Pilasters + Molded Stepped Stele Arch + Dharmachakra Crown
  const steleZ = -0.24;
  const toranaGroup = new THREE.Group();
  toranaGroup.position.set(0, 0.87, steleZ);

  const backSlab = new THREE.Mesh(new THREE.BoxGeometry(2.08, 1.62, 0.22), darkStoneMat);
  backSlab.position.set(0, 0.81, -0.06);
  backSlab.castShadow = true;
  backSlab.receiveShadow = true;
  const backArch = new THREE.Mesh(
    new THREE.CylinderGeometry(1.04, 1.04, 0.22, 32, 1, false, 0, Math.PI),
    darkStoneMat,
  );
  backArch.rotation.z = Math.PI * 0.5;
  backArch.rotation.y = Math.PI * 0.5;
  backArch.position.set(0, 1.62, -0.06);
  backArch.castShadow = true;

  const reliefFaceMat = new THREE.MeshStandardMaterial({
    map: lTex.nativityReliefMap,
    normalMap: lTex.nativityReliefNormal,
    normalScale: new THREE.Vector2(1.85, 1.85),
    color: 0x9c7c56,
    roughness: 0.82,
    metalness: 0.03,
  });
  const reliefPanel = new THREE.Mesh(new THREE.PlaneGeometry(1.68, 2.02), reliefFaceMat);
  reliefPanel.position.set(0, 1.04, 0.056);

  toranaGroup.add(backSlab, backArch, reliefPanel);

  // Twin fluted sandstone Torana columns flanking the niche
  for (const side of [-1, 1]) {
    const colX = side * 0.94;
    const colBase1 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.28), carvedStoneMat);
    colBase1.position.set(colX, 0.07, 0.04);
    const colBase2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.10, 14), carvedStoneMat);
    colBase2.position.set(colX, 0.19, 0.04);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.105, 1.24, 16), carvedStoneMat);
    shaft.position.set(colX, 0.86, 0.04);
    shaft.castShadow = true;
    const neckRing = new THREE.Mesh(new THREE.TorusGeometry(0.102, 0.022, 8, 18), carvedStoneMat);
    neckRing.rotation.x = Math.PI * 0.5;
    neckRing.position.set(colX, 1.46, 0.04);
    const amalaka = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.115, 0.11, 16), carvedStoneMat);
    amalaka.position.set(colX, 1.54, 0.04);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.10, 0.28), carvedStoneMat);
    cap.position.set(colX, 1.64, 0.04);
    toranaGroup.add(colBase1, colBase2, shaft, neckRing, amalaka, cap);
  }

  for (const [r, tube] of [[0.94, 0.068], [1.06, 0.052]] as Array<[number, number]>) {
    const archRib = new THREE.Mesh(
      new THREE.TorusGeometry(r, tube, 12, 36, Math.PI),
      carvedStoneMat,
    );
    archRib.position.set(0, 1.62, 0.06);
    archRib.castShadow = true;
    toranaGroup.add(archRib);
  }
  const archBossGeo = createCarvedLotusPetalGeometry(0.065, 0.085, 0.022);
  const archBossInst = new THREE.InstancedMesh(archBossGeo, carvedStoneMat, 17);
  for (let i = 0; i < 17; i++) {
    const a = (i / 16) * Math.PI;
    _v3.set(Math.cos(a) * 1.00, 1.62 + Math.sin(a) * 1.00, 0.11);
    _q.setFromEuler(_e.set(0.25, 0, a - Math.PI * 0.5));
    _s.set(1.0, 1.0, 1.0);
    _m4.compose(_v3, _q, _s);
    archBossInst.setMatrixAt(i, _m4);
  }
  archBossInst.instanceMatrix.needsUpdate = true;
  archBossInst.computeBoundingSphere();
  toranaGroup.add(archBossInst);

  // Flanking Carved Indra & Brahma Low-Relief Attendants inside lower corners of stele
  for (const side of [-1, 1]) {
    const att = new THREE.Group();
    att.position.set(side * 0.74, 0.04, 0.07);
    const attBase = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.12, 0.07, 12), carvedStoneMat);
    attBase.position.y = 0.035;
    const attBody = new THREE.Mesh(
      createSculptedTorsoGeometry({
        height: 0.34,
        waistRadius: 0.050,
        hipRadius: 0.066,
        chestRadius: 0.068,
        shoulderRadius: 0.076,
        neckRadius: 0.024,
        bustProjection: 0.008,
        tribhangaSway: side * -0.012,
      }),
      carvedStoneMat,
    );
    attBody.position.y = 0.07;
    const attHead = buildSculptedFigureHead(carvedStoneMat, giltStatueMat, darkStoneMat, 0.44, false);
    attHead.position.set(0, 0.45, 0.01);
    attHead.rotation.y = side * -0.45;
    att.add(attBase, attBody, attHead);
    toranaGroup.add(att);
  }

  // Gilded Dharmachakra apex finial crowning the stele arch
  const apexPlinth = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.22), carvedStoneMat);
  apexPlinth.position.set(0, 2.70, 0.02);
  const apexChakra = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.022, 10, 28), giltStatueMat);
  apexChakra.position.set(0, 2.88, 0.05);
  const apexHub = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 14), giltStatueMat);
  apexHub.rotation.x = Math.PI * 0.5;
  apexHub.position.set(0, 2.88, 0.05);
  toranaGroup.add(apexPlinth, apexChakra, apexHub);
  root.add(toranaGroup);

  // C. Tapered Gnarled Sal Tree (Shorea robusta) + Sculpted Cupped Leaves & Blossoms
  const treeOriginZ = steleZ + 0.15;
  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.76, 0.88, treeOriginZ),
    new THREE.Vector3(-0.72, 1.54, treeOriginZ + 0.05),
    new THREE.Vector3(-0.56, 2.18, treeOriginZ + 0.08),
    new THREE.Vector3(-0.18, 2.58, treeOriginZ + 0.11),
    new THREE.Vector3(0.28, 2.66, treeOriginZ + 0.12),
    new THREE.Vector3(0.68, 2.46, treeOriginZ + 0.06),
  ]);
  const mainBough = new THREE.Mesh(
    createTaperedLimbGeometry(trunkCurve, (t) => 0.062 * (1.0 - 0.55 * t) + 0.008 * Math.sin(t * 22), 34, 12),
    carvedStoneMat,
  );
  mainBough.castShadow = true;

  const branch1Curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.42, 2.38, treeOriginZ + 0.09),
    new THREE.Vector3(-0.08, 2.74, treeOriginZ + 0.10),
    new THREE.Vector3(0.24, 2.80, treeOriginZ + 0.08),
  ]);
  const secondaryBranch1 = new THREE.Mesh(
    createTaperedLimbGeometry(branch1Curve, (t) => 0.034 * (1 - 0.5 * t), 16, 10),
    carvedStoneMat,
  );
  const branch2Curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.22, 2.65, treeOriginZ + 0.11),
    new THREE.Vector3(0.46, 2.76, treeOriginZ + 0.08),
    new THREE.Vector3(0.66, 2.66, treeOriginZ + 0.04),
  ]);
  const secondaryBranch2 = new THREE.Mesh(
    createTaperedLimbGeometry(branch2Curve, (t) => 0.028 * (1 - 0.45 * t), 14, 10),
    carvedStoneMat,
  );
  root.add(mainBough, secondaryBranch1, secondaryBranch2);

  // Cupped Lanceolate Sal Leaves (using curved petal geometry so leaves never look like flat tags)
  const leafGeo = createCarvedLotusPetalGeometry(0.068, 0.155, 0.020);
  const leafClusters: Array<[number, number, number]> = [
    [-0.58, 2.34, 0.08],
    [-0.42, 2.52, 0.10],
    [-0.24, 2.68, 0.12],
    [-0.04, 2.76, 0.12],
    [0.14, 2.78, 0.12],
    [0.32, 2.72, 0.12],
    [0.50, 2.64, 0.10],
    [0.64, 2.50, 0.07],
  ];
  const leavesPerCluster = 8;
  const leafInst = new THREE.InstancedMesh(
    leafGeo,
    salStoneLeafMat,
    leafClusters.length * leavesPerCluster,
  );
  let lIdx = 0;
  for (let c = 0; c < leafClusters.length; c++) {
    const [cx, cy, cz] = leafClusters[c];
    for (let k = 0; k < leavesPerCluster; k++) {
      const a = (k / leavesPerCluster) * Math.PI * 2 + c * 0.45;
      _v3.set(cx + Math.cos(a) * 0.028, cy + Math.sin(a) * 0.022, treeOriginZ + cz + 0.02);
      _q.setFromEuler(_e.set(0.32 + (k % 2) * 0.20, (k - 3.5) * 0.16, a));
      _s.setScalar(0.88 + (k % 3) * 0.12);
      _m4.compose(_v3, _q, _s);
      leafInst.setMatrixAt(lIdx++, _m4);
    }
  }
  leafInst.instanceMatrix.needsUpdate = true;
  leafInst.computeBoundingSphere();
  root.add(leafInst);

  const blossomGeo = new THREE.DodecahedronGeometry(0.020, 1);
  const blossomInst = new THREE.InstancedMesh(blossomGeo, giltStatueMat, 14);
  for (let i = 0; i < 14; i++) {
    const t = i / 13;
    const bx = THREE.MathUtils.lerp(-0.50, 0.58, t);
    const by = 2.48 + Math.sin(t * Math.PI) * 0.24 + (i % 2 === 0 ? 0.05 : -0.04);
    _v3.set(bx, by, treeOriginZ + 0.14);
    _q.setFromEuler(_e.set(i * 0.4, i * 0.7, 0));
    _s.setScalar(0.95);
    _m4.compose(_v3, _q, _s);
    blossomInst.setMatrixAt(i, _m4);
  }
  blossomInst.instanceMatrix.needsUpdate = true;
  blossomInst.computeBoundingSphere();
  root.add(blossomInst);

  // =========================================================================
  // D. SCULPTED 3D QUEEN MAYA DEVI IN CLASSICAL GUPTA TRIBHANGA POSTURE
  // =========================================================================
  const maya = new THREE.Group();
  maya.position.set(-0.08, 0.87, -0.02);

  // Carved 16-Petal Padmasana Lotus Pedestal
  const mayaLotus = buildCarvedLotusPedestal(carvedStoneMat, giltStatueMat, 0.30, 0.145, 16);
  maya.add(mayaLotus);

  // Sculpted Bare Feet & Toes with Beaded Anklets
  for (const side of [-1, 1]) {
    const foot = buildSculptedFoot(carvedStoneMat, giltStatueMat, side, 1.05);
    foot.position.set(side * 0.058, 0.145, 0.008);
    foot.rotation.y = side * 0.12;
    maya.add(foot);
  }

  // Sculpted Clinging Gupta Paridhana Dhoti (thigh separation + catenary folds + center sash)
  const mayaDhoti = new THREE.Mesh(
    createSculptedDhotiGeometry({
      height: 0.74,
      ankleRadius: 0.132,
      hipRadius: 0.172,
      waistRadius: 0.118,
      pleatCount: 5,
      hipShiftX: 0.026,
      thighSeparation: 0.024,
    }),
    carvedStoneMat,
  );
  mayaDhoti.position.set(0.0, 0.155, 0.0);
  mayaDhoti.castShadow = true;
  mayaDhoti.receiveShadow = true;
  maya.add(mayaDhoti);

  // Flowing Central Carved Pleated Dhoti Sash & Side Drapery Tails
  const centerSashCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.024, 0.86, 0.105),
    new THREE.Vector3(0.020, 0.64, 0.125),
    new THREE.Vector3(0.014, 0.42, 0.112),
    new THREE.Vector3(0.008, 0.19, 0.105),
  ]);
  const centerSash = new THREE.Mesh(
    createTaperedLimbGeometry(centerSashCurve, (t) => 0.022 * (0.85 + 0.45 * Math.sin(t * Math.PI)), 16, 8),
    carvedStoneMat,
  );
  centerSash.scale.set(1.35, 1.0, 0.45);
  maya.add(centerSash);

  // Ornate Mekhala Jeweled Waist Girdle hugging cleanly into the dhoti/torso junction
  const mekhala = new THREE.Mesh(new THREE.TorusGeometry(0.118, 0.012, 10, 28), giltStatueMat);
  mekhala.rotation.x = Math.PI * 0.5;
  mekhala.scale.set(1.0, 0.74, 1);
  mekhala.position.set(0.022, 0.885, 0);
  const sashLoop = new THREE.Mesh(
    new THREE.TorusGeometry(0.064, 0.0085, 8, 18, Math.PI),
    giltStatueMat,
  );
  sashLoop.rotation.z = Math.PI;
  sashLoop.position.set(0.022, 0.865, 0.088);
  const waistClasp = new THREE.Mesh(new THREE.OctahedronGeometry(0.017, 1), giltStatueMat);
  waistClasp.position.set(0.022, 0.885, 0.094);
  maya.add(mekhala, sashLoop, waistClasp);

  // Sculpted Female Upper Torso in S-Curve Tribhanga + Bust + Diagonal Uttariya Sash
  const mayaTorso = new THREE.Mesh(
    createSculptedTorsoGeometry({
      height: 0.62,
      waistRadius: 0.096,
      hipRadius: 0.114,
      chestRadius: 0.135,
      shoulderRadius: 0.152,
      neckRadius: 0.044,
      bustProjection: 0.032,
      tribhangaSway: -0.020,
      isChild: false,
    }),
    carvedStoneMat,
  );
  mayaTorso.position.set(0.022, 0.87, 0.0);
  mayaTorso.castShadow = true;
  mayaTorso.receiveShadow = true;
  maya.add(mayaTorso);

  // Sculpted deltoid shoulder caps so upper arms join torso seamlessly with zero pinch
  for (const [sx, sy] of [[-0.128, 1.335], [0.128, 1.345]] as Array<[number, number]>) {
    const deltoid = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), carvedStoneMat);
    deltoid.scale.set(1.05, 1.15, 0.88);
    deltoid.position.set(sx, sy, 0.0);
    maya.add(deltoid);
  }

  // Diagonal carved Uttariya scarf draped from left shoulder across waist
  const uttariyaCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.088, 1.38, 0.035),
    new THREE.Vector3(-0.025, 1.24, 0.098),
    new THREE.Vector3(0.065, 1.05, 0.092),
    new THREE.Vector3(0.118, 0.89, 0.030),
  ]);
  const uttariya = new THREE.Mesh(
    createTaperedLimbGeometry(uttariyaCurve, () => 0.014, 16, 8),
    carvedStoneMat,
  );
  uttariya.scale.set(1.0, 1.0, 0.55);
  maya.add(uttariya);

  // Multi-strand Beaded Hara Necklace + Chest Pendant
  const hara = new THREE.Mesh(new THREE.TorusGeometry(0.084, 0.009, 8, 24, Math.PI * 1.12), giltStatueMat);
  hara.rotation.x = Math.PI * 0.42;
  hara.rotation.z = Math.PI;
  hara.position.set(0.012, 1.33, 0.054);
  const chestPendant = new THREE.Mesh(new THREE.OctahedronGeometry(0.017, 1), giltStatueMat);
  chestPendant.position.set(0.014, 1.24, 0.104);
  maya.add(hara, chestPendant);

  // Tapered Anatomical Left Arm (Katyavalambita pose resting smoothly on hip)
  const leftArmCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.122, 1.34, 0.0),
    new THREE.Vector3(-0.205, 1.18, 0.018),
    new THREE.Vector3(-0.202, 1.04, 0.042),
    new THREE.Vector3(-0.145, 0.90, 0.068),
  ]);
  const leftArm = new THREE.Mesh(
    createTaperedLimbGeometry(
      leftArmCurve,
      (t) => {
        if (t < 0.25) return THREE.MathUtils.lerp(0.044, 0.034, t / 0.25);
        if (t < 0.55) return THREE.MathUtils.lerp(0.034, 0.030, (t - 0.25) / 0.30);
        return THREE.MathUtils.lerp(0.030, 0.020, (t - 0.55) / 0.45);
      },
      20,
      14,
    ),
    carvedStoneMat,
  );
  leftArm.castShadow = true;
  const leftArmlet = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.007, 8, 16), giltStatueMat);
  leftArmlet.position.set(-0.185, 1.22, 0.015);
  leftArmlet.rotation.x = Math.PI * 0.45;
  leftArmlet.rotation.y = 0.25;
  const leftBangle = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.006, 6, 14), giltStatueMat);
  leftBangle.position.set(-0.160, 0.94, 0.060);
  leftBangle.rotation.x = Math.PI * 0.42;
  const leftHand = buildHand(carvedStoneMat, -1, 'open');
  leftHand.position.set(-0.136, 0.885, 0.072);
  leftHand.rotation.z = 0.62;
  maya.add(leftArm, leftArmlet, leftBangle, leftHand);

  // Tapered Anatomical Right Arm reaching upward to grasp the Sal tree bough
  const rightArmCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.125, 1.35, 0.0),
    new THREE.Vector3(0.228, 1.49, 0.028),
    new THREE.Vector3(0.308, 1.66, 0.022),
    new THREE.Vector3(0.342, 1.77, -0.012),
  ]);
  const rightArm = new THREE.Mesh(
    createTaperedLimbGeometry(
      rightArmCurve,
      (t) => {
        if (t < 0.25) return THREE.MathUtils.lerp(0.043, 0.033, t / 0.25);
        if (t < 0.55) return THREE.MathUtils.lerp(0.033, 0.029, (t - 0.25) / 0.30);
        return THREE.MathUtils.lerp(0.029, 0.019, (t - 0.55) / 0.45);
      },
      22,
      14,
    ),
    carvedStoneMat,
  );
  rightArm.castShadow = true;
  const rightArmlet = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.007, 8, 16), giltStatueMat);
  rightArmlet.position.set(0.208, 1.46, 0.020);
  rightArmlet.rotation.x = Math.PI * 0.45;
  rightArmlet.rotation.y = -0.55;
  const rightBangles = new THREE.Mesh(new THREE.TorusGeometry(0.023, 0.007, 8, 16), giltStatueMat);
  rightBangles.position.set(0.326, 1.70, 0.008);
  rightBangles.rotation.x = Math.PI * 0.42;
  const rightHand = buildHand(carvedStoneMat, 1, 'grasp');
  rightHand.position.set(0.344, 1.79, -0.015);
  rightHand.rotation.x = 0.40;
  maya.add(rightArm, rightArmlet, rightBangles, rightHand);

  // Serene Anatomically Sculpted Queen Maya Devi Head + Crown
  const mayaHead = buildSculptedFigureHead(carvedStoneMat, giltStatueMat, darkStoneMat, 0.98, false);
  mayaHead.position.set(0.012, 1.565, 0.012);
  mayaHead.rotation.z = 0.04;
  maya.add(mayaHead);

  // Carved Gupta Sandstone & Gilt Lotus Prabhamandala Halo behind Maya Devi
  const haloCenterY = 1.57;
  const haloZ = -0.085;
  const haloRimOuter = new THREE.Mesh(new THREE.TorusGeometry(0.275, 0.015, 10, 36), giltStatueMat);
  haloRimOuter.position.set(0.012, haloCenterY, haloZ);
  const haloRimInner = new THREE.Mesh(new THREE.TorusGeometry(0.195, 0.011, 8, 28), carvedStoneMat);
  haloRimInner.position.set(0.012, haloCenterY, haloZ + 0.005);
  const haloPetalGeo = createCarvedLotusPetalGeometry(0.055, 0.088, 0.016);
  const haloPetals = new THREE.InstancedMesh(haloPetalGeo, carvedStoneMat, 20);
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    _v3.set(
      0.012 + Math.cos(a) * 0.195,
      haloCenterY + Math.sin(a) * 0.195,
      haloZ + 0.004,
    );
    _q.setFromEuler(_e.set(0, 0, a - Math.PI * 0.5));
    _s.set(1, 1, 1);
    _m4.compose(_v3, _q, _s);
    haloPetals.setMatrixAt(i, _m4);
  }
  haloPetals.instanceMatrix.needsUpdate = true;
  haloPetals.computeBoundingSphere();
  maya.add(haloRimOuter, haloRimInner, haloPetals);
  root.add(maya);

  // =========================================================================
  // E. SISTER MAHAPRAJAPATI GAUTAMI (SCULPTED BOTH-ARMS COMPANION, LEFT)
  // =========================================================================
  const gautami = new THREE.Group();
  gautami.position.set(-0.56, 0.87, -0.04);

  const gLotus = buildCarvedLotusPedestal(carvedStoneMat, mats.warmBronzeMat, 0.175, 0.105, 12);
  gautami.add(gLotus);

  for (const side of [-1, 1]) {
    const gFoot = buildSculptedFoot(carvedStoneMat, mats.warmBronzeMat, side, 0.78);
    gFoot.position.set(side * 0.042, 0.105, 0.006);
    gautami.add(gFoot);
  }

  const gDhoti = new THREE.Mesh(
    createSculptedDhotiGeometry({
      height: 0.55,
      ankleRadius: 0.096,
      hipRadius: 0.125,
      waistRadius: 0.086,
      pleatCount: 4,
      hipShiftX: -0.012,
      thighSeparation: 0.016,
    }),
    carvedStoneMat,
  );
  gDhoti.position.set(0, 0.112, 0);
  gDhoti.castShadow = true;
  gDhoti.receiveShadow = true;

  const gTorso = new THREE.Mesh(
    createSculptedTorsoGeometry({
      height: 0.45,
      waistRadius: 0.072,
      hipRadius: 0.086,
      chestRadius: 0.098,
      shoulderRadius: 0.108,
      neckRadius: 0.032,
      bustProjection: 0.022,
      tribhangaSway: 0.018,
    }),
    carvedStoneMat,
  );
  gTorso.position.set(0, 0.64, 0);
  gTorso.castShadow = true;

  const gBelt = new THREE.Mesh(new THREE.TorusGeometry(0.096, 0.010, 8, 22), mats.warmBronzeMat);
  gBelt.rotation.x = Math.PI * 0.5;
  gBelt.scale.set(1.02, 0.76, 1);
  gBelt.position.set(0, 0.655, 0);

  const gHara = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.008, 6, 18, Math.PI * 1.1), mats.warmBronzeMat);
  gHara.rotation.x = Math.PI * 0.42;
  gHara.rotation.z = Math.PI;
  gHara.position.set(0.010, 0.98, 0.042);

  // Right Arm reaching gracefully across to cradle/support Queen Maya Devi's waist
  const gRightArmCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.096, 0.98, 0.01),
    new THREE.Vector3(0.185, 0.91, 0.045),
    new THREE.Vector3(0.285, 0.94, 0.045),
  ]);
  const gRightArm = new THREE.Mesh(
    createTaperedLimbGeometry(gRightArmCurve, (t) => THREE.MathUtils.lerp(0.031, 0.016, t), 16, 10),
    carvedStoneMat,
  );
  const gRightHand = buildHand(carvedStoneMat, 1, 'open');
  gRightHand.scale.setScalar(0.76);
  gRightHand.position.set(0.295, 0.945, 0.045);
  gRightHand.rotation.z = -1.25;

  // Left Arm gently curved along side holding ceremonial water vessel (Kamandalu)
  const gLeftArmCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.092, 0.98, 0.0),
    new THREE.Vector3(-0.135, 0.83, 0.02),
    new THREE.Vector3(-0.112, 0.69, 0.052),
  ]);
  const gLeftArm = new THREE.Mesh(
    createTaperedLimbGeometry(gLeftArmCurve, (t) => THREE.MathUtils.lerp(0.030, 0.016, t), 16, 10),
    carvedStoneMat,
  );
  const gLeftHand = buildHand(carvedStoneMat, -1, 'grasp');
  gLeftHand.scale.setScalar(0.75);
  gLeftHand.position.set(-0.110, 0.675, 0.056);
  const kamandalu = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 10), mats.warmBronzeMat);
  kamandalu.scale.set(1.0, 1.25, 1.0);
  kamandalu.position.set(-0.115, 0.635, 0.068);

  const gHead = buildSculptedFigureHead(carvedStoneMat, giltStatueMat, darkStoneMat, 0.72, false);
  gHead.position.set(0.015, 1.165, 0.01);
  gHead.rotation.y = 0.30;

  // Deltoid shoulder joins for Sister Mahaprajapati
  for (const sx of [-0.092, 0.095]) {
    const gShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), carvedStoneMat);
    gShoulder.position.set(sx, 0.98, 0.005);
    gautami.add(gShoulder);
  }

  gautami.add(gDhoti, gTorso, gBelt, gHara, gRightArm, gRightHand, gLeftArm, gLeftHand, kamandalu, gHead);
  root.add(gautami);

  // =========================================================================
  // F. SCULPTED STANDING GOLDEN BABY PRINCE SIDDHARTHA ON DOUBLE-TIER LOTUS
  // =========================================================================
  const baby = new THREE.Group();
  baby.position.set(0.47, 0.87, 0.10);

  // Ornate Double-Tier 16-Petal Padmasana Lotus Pedestal
  const bLotus = buildCarvedLotusPedestal(giltStatueMat, mats.warmBronzeMat, 0.23, 0.21, 16);
  baby.add(bLotus);

  // Sculpted Bare Child Feet & Toes
  for (const side of [-1, 1]) {
    const foot = buildSculptedFoot(giltStatueMat, mats.warmBronzeMat, side, 0.74);
    foot.position.set(side * 0.044, 0.21, 0.008);
    baby.add(foot);
  }

  // Sculpted Softly Pleated Child Dhoti + Gilded Waist Sash + Central Pleated Lappet
  const bDhoti = new THREE.Mesh(
    createSculptedDhotiGeometry({
      height: 0.32,
      ankleRadius: 0.076,
      hipRadius: 0.098,
      waistRadius: 0.082,
      pleatCount: 4,
      hipShiftX: 0.0,
      thighSeparation: 0.016,
    }),
    giltStatueMat,
  );
  bDhoti.position.set(0, 0.218, 0);
  bDhoti.castShadow = true;

  const bBelt = new THREE.Mesh(new THREE.TorusGeometry(0.086, 0.011, 8, 22), mats.warmBronzeMat);
  bBelt.rotation.x = Math.PI * 0.5;
  bBelt.scale.set(1.04, 0.80, 1);
  bBelt.position.y = 0.53;

  // Noble Child Upper Torso (rounded child belly + sculpted chest + Kanthi neck torque)
  const bTorso = new THREE.Mesh(
    createSculptedTorsoGeometry({
      height: 0.34,
      waistRadius: 0.078,
      hipRadius: 0.084,
      chestRadius: 0.095,
      shoulderRadius: 0.104,
      neckRadius: 0.036,
      bustProjection: 0.012,
      tribhangaSway: 0.0,
      isChild: true,
    }),
    giltStatueMat,
  );
  bTorso.position.set(0, 0.52, 0);
  bTorso.castShadow = true;

  const bKanthi = new THREE.Mesh(new THREE.TorusGeometry(0.056, 0.0085, 8, 20, Math.PI * 1.1), mats.warmBronzeMat);
  bKanthi.rotation.x = Math.PI * 0.42;
  bKanthi.rotation.z = Math.PI;
  bKanthi.position.set(0, 0.795, 0.038);

  // Raised Skyward Right Arm ("Earth and Heaven Witness" Simhanada Gesture)
  const bRArmCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.092, 0.77, 0.0),
    new THREE.Vector3(0.138, 0.84, 0.018),
    new THREE.Vector3(0.128, 0.96, 0.022),
    new THREE.Vector3(0.114, 1.04, 0.022),
  ]);
  const bRArm = new THREE.Mesh(
    createTaperedLimbGeometry(bRArmCurve, (t) => THREE.MathUtils.lerp(0.030, 0.016, t), 16, 10),
    giltStatueMat,
  );
  bRArm.castShadow = true;
  const bRBangle = new THREE.Mesh(new THREE.TorusGeometry(0.019, 0.005, 6, 14), mats.warmBronzeMat);
  bRBangle.rotation.x = Math.PI * 0.5;
  bRBangle.position.set(0.118, 1.01, 0.022);
  const bRHand = buildHand(giltStatueMat, 1, 'pointUp');
  bRHand.scale.setScalar(0.76);
  bRHand.position.set(0.114, 1.055, 0.022);

  // Lowered Left Arm (Varada Earth-Witness Gesture)
  const bLArmCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.092, 0.77, 0.0),
    new THREE.Vector3(-0.124, 0.64, 0.016),
    new THREE.Vector3(-0.112, 0.50, 0.028),
  ]);
  const bLArm = new THREE.Mesh(
    createTaperedLimbGeometry(bLArmCurve, (t) => THREE.MathUtils.lerp(0.029, 0.015, t), 16, 10),
    giltStatueMat,
  );
  bLArm.castShadow = true;
  const bLHand = buildHand(giltStatueMat, -1, 'open');
  bLHand.scale.setScalar(0.74);
  bLHand.rotation.z = Math.PI;
  bLHand.position.set(-0.112, 0.485, 0.030);

  // Serene Child Buddha Head with Spiral Ushnisha Curls
  const bHead = buildSculptedFigureHead(giltStatueMat, mats.warmBronzeMat, mats.warmBronzeMat, 0.76, true);
  bHead.position.set(0, 0.915, 0.01);

  // Ornate Carved Prabhavali Lotus-and-Flame Aureole behind Prince Siddhartha
  const bHaloY = 0.80;
  const bHaloZ = -0.10;
  const bHaloRing = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.014, 8, 32), giltStatueMat);
  bHaloRing.position.set(0, bHaloY, bHaloZ);
  const bHaloInner = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.009, 8, 24), mats.warmBronzeMat);
  bHaloInner.position.set(0, bHaloY, bHaloZ + 0.004);
  const bHaloSpokeGeo = new THREE.CylinderGeometry(0.0048, 0.0048, 0.54, 6);
  const bHaloSpokes = new THREE.InstancedMesh(bHaloSpokeGeo, giltStatueMat, 8);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    _v3.set(0, bHaloY, bHaloZ);
    _q.setFromEuler(_e.set(0, 0, a));
    _s.setScalar(1);
    _m4.compose(_v3, _q, _s);
    bHaloSpokes.setMatrixAt(i, _m4);
  }
  bHaloSpokes.instanceMatrix.needsUpdate = true;
  bHaloSpokes.computeBoundingSphere();
  const bFlameGeo = createCarvedLotusPetalGeometry(0.052, 0.075, 0.015);
  const bFlameRim = new THREE.InstancedMesh(bFlameGeo, giltStatueMat, 18);
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    _v3.set(Math.cos(a) * 0.28, bHaloY + Math.sin(a) * 0.28, bHaloZ);
    _q.setFromEuler(_e.set(0, 0, a - Math.PI * 0.5));
    _s.set(1, 1, 1);
    _m4.compose(_v3, _q, _s);
    bFlameRim.setMatrixAt(i, _m4);
  }
  bFlameRim.instanceMatrix.needsUpdate = true;
  bFlameRim.computeBoundingSphere();

  baby.add(
    bDhoti,
    bBelt,
    bTorso,
    bKanthi,
    bRArm,
    bRBangle,
    bRHand,
    bLArm,
    bLHand,
    bHead,
    bHaloRing,
    bHaloInner,
    bHaloSpokes,
    bFlameRim,
  );
  root.add(baby);

  // G. Flat Woven Ivory-Gold Ceremonial Khata Silk Scarves draped snugly over Torana shoulders
  const khataMat = new THREE.MeshStandardMaterial({
    map: lTex.khataSilkMap,
    color: 0xd9c6a4,
    roughness: 0.74,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });
  for (const side of [-1, 1]) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.74, 2.74, steleZ + 0.14),
      new THREE.Vector3(side * 0.94, 2.38, steleZ + 0.16),
      new THREE.Vector3(side * 0.96, 1.66, steleZ + 0.17),
      new THREE.Vector3(side * 0.92, 1.04, steleZ + 0.22),
      new THREE.Vector3(side * 0.88, 0.88, 0.42),
      new THREE.Vector3(side * 0.85, 0.74, 0.76),
    ]);
    const ribbonGeo = buildFlatRibbonGeometry(curve, 24, 0.125, 0.014, new THREE.Vector3(0, 0.25, 1).normalize());
    const ribbon = new THREE.Mesh(ribbonGeo, khataMat);
    ribbon.castShadow = true;
    const tasselBar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.045, 0.022), giltStatueMat);
    tasselBar.position.set(side * 0.85, 0.71, 0.76);
    root.add(ribbon, tasselBar);
  }

  return root;
}

/**
 * 2. Detailed Himalayan Buddhist Meditation Stations along West Gallery:
 *    - 4 Beveled Quilted Tibetan Brocade Zabuton Mats with 4 silk tassels each
 *    - 4 Pleated Radial LatheGeometry Zafu Cushions with embroidered Dharma ring & carry strap
 *    - 2 Low Carved Tibetan Choktse Tables holding hammered Brass Singing Bowls, Strikers, Mala Beads & Sutras
 */
export function buildMeditationGalleryEnsemble(
  lTex: LumbiniTextureSet,
  mats: MayaDeviCraftMaterials,
  walkY: number,
): THREE.Group {
  const gallery = new THREE.Group();
  gallery.userData.nonCollidable = true;

  const brocadeMat = new THREE.MeshStandardMaterial({
    map: lTex.cushionFabricMap,
    normalMap: lTex.cushionFabricNormal,
    normalScale: new THREE.Vector2(1.2, 1.2),
    color: 0xffffff,
    roughness: 0.88,
    metalness: 0.04,
  });
  const saffronVelvetMat = new THREE.MeshStandardMaterial({
    color: 0xb75b16,
    roughness: 0.84,
    metalness: 0.04,
  });
  const crimsonSilkMat = new THREE.MeshStandardMaterial({
    color: 0x7a1922,
    roughness: 0.78,
    metalness: 0.06,
  });
  const sandalwoodMat = new THREE.MeshStandardMaterial({
    color: 0x5c341d,
    roughness: 0.56,
    metalness: 0.06,
  });

  // Shared Rounded-Rect Zabuton Mat Geometry (0.86m x 0.94m x 0.068m loft)
  const mw = 0.86;
  const md = 0.94;
  const r = 0.09;
  const zabutonShape = new THREE.Shape();
  zabutonShape.moveTo(-mw * 0.5 + r, -md * 0.5);
  zabutonShape.lineTo(mw * 0.5 - r, -md * 0.5);
  zabutonShape.quadraticCurveTo(mw * 0.5, -md * 0.5, mw * 0.5, -md * 0.5 + r);
  zabutonShape.lineTo(mw * 0.5, md * 0.5 - r);
  zabutonShape.quadraticCurveTo(mw * 0.5, md * 0.5, mw * 0.5 - r, md * 0.5);
  zabutonShape.lineTo(-mw * 0.5 + r, md * 0.5);
  zabutonShape.quadraticCurveTo(-mw * 0.5, md * 0.5, -mw * 0.5, md * 0.5 - r);
  zabutonShape.lineTo(-mw * 0.5, -md * 0.5 + r);
  zabutonShape.quadraticCurveTo(-mw * 0.5, -md * 0.5, -mw * 0.5 + r, -md * 0.5);
  const zabutonGeo = new THREE.ExtrudeGeometry(zabutonShape, {
    depth: 0.042,
    bevelEnabled: true,
    bevelThickness: 0.016,
    bevelSize: 0.018,
    bevelSegments: 3,
    curveSegments: 8,
  });
  zabutonGeo.rotateX(-Math.PI * 0.5);
  // Normalize Planar UVs cleanly to [0..1] for the Endless-Knot border texture
  const zUv = zabutonGeo.attributes.uv;
  const zPos = zabutonGeo.attributes.position;
  for (let i = 0; i < zPos.count; i++) {
    zUv.setXY(i, (zPos.getX(i) + mw * 0.52) / (mw * 1.04), (zPos.getZ(i) + md * 0.52) / (md * 1.04));
  }
  zUv.needsUpdate = true;
  zabutonGeo.computeVertexNormals();

  // Shared 18-Pleat Plump Radial Zafu Cushion Geometry (custom pleated Lathe)
  const zafuPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.20, 0.0),
    new THREE.Vector2(0.245, 0.025),
    new THREE.Vector2(0.258, 0.068),
    new THREE.Vector2(0.238, 0.112),
    new THREE.Vector2(0.175, 0.132),
    new THREE.Vector2(0.085, 0.128),
    new THREE.Vector2(0.0, 0.118), // Depressed center tuft dimple
  ];
  const zafuGeo = new THREE.LatheGeometry(zafuPts, 54);
  const zPosAttr = zafuGeo.attributes.position;
  for (let i = 0; i < zPosAttr.count; i++) {
    const px = zPosAttr.getX(i);
    const py = zPosAttr.getY(i);
    const pz = zPosAttr.getZ(i);
    const rad = Math.hypot(px, pz);
    if (rad > 0.11 && py > 0.012 && py < 0.122) {
      const ang = Math.atan2(pz, px);
      const pleat = Math.sin(ang * 18) * 0.0085 * Math.sin(((py - 0.01) / 0.11) * Math.PI);
      const scale = (rad + pleat) / rad;
      zPosAttr.setX(i, px * scale);
      zPosAttr.setZ(i, pz * scale);
    }
  }
  zPosAttr.needsUpdate = true;
  zafuGeo.computeVertexNormals();

  const baseX = -11.35;
  for (const cz of [-3.4, -1.2, 1.2, 3.4]) {
    const station = new THREE.Group();
    station.position.set(baseX, walkY, cz);

    // Zabuton mat grounded flush (bottom bevel rests at y = 0)
    const matMesh = new THREE.Mesh(zabutonGeo, brocadeMat);
    matMesh.position.y = 0.016;
    matMesh.castShadow = true;
    matMesh.receiveShadow = true;
    station.add(matMesh);

    // 4 Corner Silk Tassels resting cleanly on deck
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const tasselCap = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), mats.giltGoldMat);
        tasselCap.position.set(sx * (mw * 0.49), 0.022, sz * (md * 0.49));
        const tasselDrop = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.048, 8), saffronVelvetMat);
        tasselDrop.rotation.z = sx * -0.95;
        tasselDrop.rotation.x = sz * 0.95;
        tasselDrop.position.set(sx * (mw * 0.525), 0.014, sz * (md * 0.525));
        station.add(tasselCap, tasselDrop);
      }
    }

    // Plump pleated Zafu sitting slightly toward rear (-X) facing East toward sanctum
    const zafuX = -0.11;
    const zafuY = 0.068;
    const zafuMesh = new THREE.Mesh(zafuGeo, brocadeMat);
    zafuMesh.position.set(zafuX, zafuY, 0);
    zafuMesh.castShadow = true;
    zafuMesh.receiveShadow = true;

    const topPiping = new THREE.Mesh(new THREE.TorusGeometry(0.215, 0.008, 6, 28), mats.giltGoldMat);
    topPiping.rotation.x = Math.PI * 0.5;
    topPiping.position.set(zafuX, zafuY + 0.122, 0);

    const tuftButton = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.020, 0.014, 12), mats.giltGoldMat);
    tuftButton.position.set(zafuX, zafuY + 0.120, 0);

    // Side stitched carry handle
    const handleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(zafuX - 0.24, zafuY + 0.068, -0.055),
      new THREE.Vector3(zafuX - 0.275, zafuY + 0.068, 0),
      new THREE.Vector3(zafuX - 0.24, zafuY + 0.068, 0.055),
    ]);
    const handle = new THREE.Mesh(new THREE.TubeGeometry(handleCurve, 10, 0.009, 6, false), crimsonSilkMat);
    station.add(zafuMesh, topPiping, tuftButton, handle);
    gallery.add(station);
  }

  // 2 Low Carved Tibetan Choktse Side Tables placed neatly between the pairs (-2.3 and +2.3)
  const singingBowlPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.058, 0.0),
    new THREE.Vector2(0.088, 0.030),
    new THREE.Vector2(0.102, 0.075),
    new THREE.Vector2(0.095, 0.086),
    new THREE.Vector2(0.086, 0.074),
    new THREE.Vector2(0.072, 0.032),
    new THREE.Vector2(0.0, 0.014),
  ];
  const singingBowlGeo = new THREE.LatheGeometry(singingBowlPts, 24);

  for (const tz of [-2.3, 2.3]) {
    const table = new THREE.Group();
    table.position.set(baseX - 0.08, walkY, tz);

    // Carved flared legs + lower apron + stepped top tray (height 0.28m)
    const tableW = 0.48;
    const tableD = 0.62;
    const tableH = 0.27;
    for (const lx of [-tableW * 0.42, tableW * 0.42]) {
      for (const lz of [-tableD * 0.42, tableD * 0.42]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.017, tableH, 8), mats.timberMat);
        leg.position.set(lx, tableH * 0.5, lz);
        const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.021, 0.035, 8), mats.giltGoldMat);
        ferrule.position.set(lx, 0.018, lz);
        table.add(leg, ferrule);
      }
    }
    const apron = new THREE.Mesh(new THREE.BoxGeometry(tableW * 0.82, 0.07, tableD * 0.82), crimsonSilkMat);
    apron.position.y = tableH - 0.055;
    const goldBorder = new THREE.Mesh(new THREE.BoxGeometry(tableW * 0.86, 0.018, tableD * 0.86), mats.giltGoldMat);
    goldBorder.position.y = tableH - 0.092;
    const topDeck = new THREE.Mesh(new THREE.BoxGeometry(tableW, 0.036, tableD), mats.timberMat);
    topDeck.position.y = tableH;
    topDeck.castShadow = true;
    topDeck.receiveShadow = true;
    table.add(apron, goldBorder, topDeck);

    // Hammered Brass Singing Bowl resting on a silk ring cushion + wooden striker
    const ringPad = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.014, 8, 18), crimsonSilkMat);
    ringPad.rotation.x = Math.PI * 0.5;
    ringPad.position.set(0.04, tableH + 0.024, -0.12);
    const bowl = new THREE.Mesh(singingBowlGeo, mats.giltGoldMat);
    bowl.position.set(0.04, tableH + 0.026, -0.12);
    bowl.castShadow = true;
    const striker = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.010, 0.16, 8), sandalwoodMat);
    striker.rotation.z = Math.PI * 0.5;
    striker.rotation.y = 0.42;
    striker.position.set(0.06, tableH + 0.028, 0.03);

    // Coiled Sandalwood Mala Prayer Beads (18 beads ring)
    const malaGroup = new THREE.Group();
    malaGroup.position.set(-0.08, tableH + 0.025, 0.16);
    const beadGeo = new THREE.SphereGeometry(0.0085, 6, 5);
    const beadInst = new THREE.InstancedMesh(beadGeo, sandalwoodMat, 18);
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      _v3.set(Math.cos(a) * 0.048, 0, Math.sin(a) * 0.048);
      _q.identity();
      _s.setScalar(1);
      _m4.compose(_v3, _q, _s);
      beadInst.setMatrixAt(i, _m4);
    }
    beadInst.instanceMatrix.needsUpdate = true;
    beadInst.computeBoundingSphere();
    const guruBead = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), mats.giltGoldMat);
    guruBead.position.set(0.054, 0, 0);
    malaGroup.add(beadInst, guruBead);

    // Saffron-wrapped Tibetan Pecha Scripture Bundle
    const pecha = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.044, 0.24), saffronVelvetMat);
    pecha.position.set(0.08, tableH + 0.040, 0.15);
    pecha.rotation.y = -0.16;
    const pechaRibbon = new THREE.Mesh(new THREE.BoxGeometry(0.145, 0.048, 0.022), mats.giltGoldMat);
    pechaRibbon.position.copy(pecha.position);
    pechaRibbon.rotation.y = pecha.rotation.y;

    table.add(ringPad, bowl, striker, malaGroup, pecha, pechaRibbon);
    gallery.add(table);
  }

  return gallery;
}

/**
 * 3. Museum-Grade Carved Bronze Nepalese/Tibetan Dhupauro Incense Burner:
 *    - Carved octagonal rosewood stand with 4 cabriole legs & pierced apron
 *    - Sculpted LatheGeometry hammered bronze censer belly with lotus petal frieze & twin drop-ring handles
 *    - Ash bowl with glowing embers & 3 angled sandalwood incense sticks
 *    - Pierced openwork lattice filigree dome lid topped with brass Vajra/lotus finial
 */
export function buildDetailedDhupauroIncenseBurner(mats: MayaDeviCraftMaterials): THREE.Group {
  const root = new THREE.Group();
  root.userData.nonCollidable = true;

  // A. Carved Octagonal Dark Rosewood Stand (y: 0 -> 0.56m)
  const standBase = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.35, 0.07, 8), mats.timberMat);
  standBase.position.y = 0.035;
  standBase.castShadow = true;
  standBase.receiveShadow = true;
  root.add(standBase);

  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
    const lx = Math.cos(a) * 0.22;
    const lz = Math.sin(a) * 0.22;
    const legCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(lx * 1.15, 0.06, lz * 1.15),
      new THREE.Vector3(lx * 1.24, 0.24, lz * 1.24),
      new THREE.Vector3(lx * 0.94, 0.44, lz * 0.94),
      new THREE.Vector3(lx * 0.96, 0.52, lz * 0.96),
    ]);
    const leg = new THREE.Mesh(new THREE.TubeGeometry(legCurve, 12, 0.028, 8, false), mats.timberMat);
    leg.castShadow = true;
    const brassFoot = new THREE.Mesh(new THREE.SphereGeometry(0.030, 8, 6), mats.giltGoldMat);
    brassFoot.position.set(lx * 1.15, 0.07, lz * 1.15);
    root.add(leg, brassFoot);
  }
  const standStretcher = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.20, 0.04, 8), mats.timberMat);
  standStretcher.position.y = 0.20;
  const standApron = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.10, 8), mats.timberMat);
  standApron.position.y = 0.46;
  const standTop = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.27, 0.055, 8), mats.timberMat);
  standTop.position.y = 0.535;
  standTop.castShadow = true;
  const topBrassInlay = new THREE.Mesh(new THREE.TorusGeometry(0.255, 0.012, 8, 24), mats.giltGoldMat);
  topBrassInlay.rotation.x = Math.PI * 0.5;
  topBrassInlay.position.y = 0.562;
  root.add(standStretcher, standApron, standTop, topBrassInlay);

  // B. Sculpted LatheGeometry Hammered Bronze Censer Belly (y: 0.56 -> 0.88m)
  const censerBaseY = 0.562;
  const censerPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.145, 0.0),
    new THREE.Vector2(0.128, 0.028),
    new THREE.Vector2(0.078, 0.065),
    new THREE.Vector2(0.066, 0.105),
    new THREE.Vector2(0.135, 0.140),
    new THREE.Vector2(0.225, 0.205),
    new THREE.Vector2(0.238, 0.255),
    new THREE.Vector2(0.195, 0.305),
    new THREE.Vector2(0.212, 0.330),
    new THREE.Vector2(0.175, 0.328),
    new THREE.Vector2(0.165, 0.270),
    new THREE.Vector2(0.0, 0.240),
  ];
  const censerBody = new THREE.Mesh(new THREE.LatheGeometry(censerPts, 28), mats.warmBronzeMat);
  censerBody.position.y = censerBaseY;
  censerBody.castShadow = true;
  censerBody.receiveShadow = true;
  root.add(censerBody);

  // Golden Lotus-Petal Collar Ring around the belly equator
  const bellyBand = new THREE.Mesh(new THREE.TorusGeometry(0.236, 0.012, 8, 28), mats.giltGoldMat);
  bellyBand.rotation.x = Math.PI * 0.5;
  bellyBand.position.y = censerBaseY + 0.235;
  const rimCollar = new THREE.Mesh(new THREE.TorusGeometry(0.202, 0.011, 8, 28), mats.giltGoldMat);
  rimCollar.rotation.x = Math.PI * 0.5;
  rimCollar.position.y = censerBaseY + 0.326;
  root.add(bellyBand, rimCollar);

  // Twin curved Makara handles with hanging brass drop rings
  for (const side of [-1, 1]) {
    const lug = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), mats.giltGoldMat);
    lug.position.set(side * 0.238, censerBaseY + 0.238, 0);
    const earLoop = new THREE.Mesh(new THREE.TorusGeometry(0.044, 0.010, 8, 16), mats.giltGoldMat);
    earLoop.rotation.y = Math.PI * 0.5;
    earLoop.rotation.x = side * 0.16;
    earLoop.position.set(side * 0.268, censerBaseY + 0.195, 0);
    root.add(lug, earLoop);
  }

  // C. Incense Ash Bed, Glowing Embers & 3 Burning Sandalwood Incense Sticks
  const ashMat = new THREE.MeshStandardMaterial({ color: 0x6c6862, roughness: 0.98 });
  const ashDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.155, 0.025, 18), ashMat);
  ashDisc.position.y = censerBaseY + 0.265;
  const emberMat = new THREE.MeshStandardMaterial({
    color: 0xff5a1f,
    emissive: 0xff4500,
    emissiveIntensity: 2.2,
    roughness: 0.7,
  });
  const stickMat = new THREE.MeshStandardMaterial({ color: 0x7a4b2a, roughness: 0.88 });
  root.add(ashDisc);

  for (let e = 0; e < 5; e++) {
    const a = (e / 5) * Math.PI * 2 + 0.4;
    const ember = new THREE.Mesh(new THREE.DodecahedronGeometry(0.016, 0), emberMat);
    ember.position.set(Math.cos(a) * 0.055, censerBaseY + 0.280, Math.sin(a) * 0.055);
    root.add(ember);
  }
  for (const [ang, tilt] of [[0.2, 0.14], [2.3, 0.16], [4.4, 0.12]] as Array<[number, number]>) {
    const stickPivot = new THREE.Group();
    stickPivot.position.set(Math.cos(ang) * 0.025, censerBaseY + 0.275, Math.sin(ang) * 0.025);
    stickPivot.rotation.set(Math.sin(ang) * tilt, 0, Math.cos(ang) * tilt);
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.16, 6), stickMat);
    stick.position.y = 0.08;
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.0055, 6, 6), emberMat);
    tip.position.y = 0.162;
    stickPivot.add(stick, tip);
    root.add(stickPivot);
  }

  // D. Pierced Openwork Filigree Dome Lid (`Jali` Dome) + Brass Vajra / Lotus Finial
  const lidBaseY = censerBaseY + 0.332;
  const lidBaseRing = new THREE.Mesh(new THREE.TorusGeometry(0.184, 0.013, 8, 28), mats.giltGoldMat);
  lidBaseRing.rotation.x = Math.PI * 0.5;
  lidBaseRing.position.y = lidBaseY;
  const lidMidRing = new THREE.Mesh(new THREE.TorusGeometry(0.142, 0.009, 8, 24), mats.warmBronzeMat);
  lidMidRing.rotation.x = Math.PI * 0.5;
  lidMidRing.position.y = lidBaseY + 0.095;
  const lidCrownRing = new THREE.Mesh(new THREE.TorusGeometry(0.054, 0.010, 8, 18), mats.giltGoldMat);
  lidCrownRing.rotation.x = Math.PI * 0.5;
  lidCrownRing.position.y = lidBaseY + 0.185;
  root.add(lidBaseRing, lidMidRing, lidCrownRing);

  // 8 Curved Filigree Openwork Dome Ribs so dark chamber & burning incense shine inside
  for (let r = 0; r < 8; r++) {
    const a = (r / 8) * Math.PI * 2;
    const ribCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(a) * 0.184, lidBaseY, Math.sin(a) * 0.184),
      new THREE.Vector3(Math.cos(a) * 0.160, lidBaseY + 0.095, Math.sin(a) * 0.160),
      new THREE.Vector3(Math.cos(a) * 0.092, lidBaseY + 0.160, Math.sin(a) * 0.092),
      new THREE.Vector3(Math.cos(a) * 0.052, lidBaseY + 0.186, Math.sin(a) * 0.052),
    ]);
    const rib = new THREE.Mesh(new THREE.TubeGeometry(ribCurve, 12, 0.0095, 6, false), mats.giltGoldMat);
    rib.castShadow = true;
    root.add(rib);
  }

  // Sculpted Lotus-Bud & Brass Vajra Apex Finial
  const finialPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.054, 0.0),
    new THREE.Vector2(0.032, 0.025),
    new THREE.Vector2(0.044, 0.055),
    new THREE.Vector2(0.024, 0.092),
    new THREE.Vector2(0.0, 0.125),
  ];
  const finial = new THREE.Mesh(new THREE.LatheGeometry(finialPts, 16), mats.giltGoldMat);
  finial.position.y = lidBaseY + 0.185;
  root.add(finial);

  return root;
}

/**
 * 4. Museum-Grade Carved Nepali/Tibetan Choe-sham Butter Lamp Offering Altar (NE Gallery):
 *    - Carved dark rosewood frame with turned baluster legs, brass ferrules, stretchers & scroll brackets
 *    - Pleated crimson-and-gold Tibetan silk brocade altar cloth skirt (`altarBrocadeMap` + `altarBrocadeNormal`)
 *    - Molded two-tier cornice tabletop + hammered brass tray + 9 sculpted LatheGeometry butter lamps
 *      (each with pedestal foot, knopped stem, chalice bowl, golden molten ghee pool, brass wick pin & flame)
 *    - 3 brass water-offering bowls (`Ting`), copper Bumpa pitcher, brass Ghanta bell & warm local PointLight
 */
export function buildDetailedButterLampAltar(
  lTex: LumbiniTextureSet,
  mats: MayaDeviCraftMaterials,
  cornerLamps: THREE.Object3D[],
  beaconLights: THREE.PointLight[],
): THREE.Group {
  const root = new THREE.Group();
  root.userData.nonCollidable = true;

  const brocadeSkirtMat = new THREE.MeshStandardMaterial({
    map: lTex.altarBrocadeMap,
    normalMap: lTex.altarBrocadeNormal,
    normalScale: new THREE.Vector2(1.35, 1.35),
    color: 0xffffff,
    roughness: 0.78,
    metalness: 0.08,
  });
  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xb95f36,
    roughness: 0.30,
    metalness: 0.85,
  });
  const gheePoolMat = new THREE.MeshStandardMaterial({
    color: 0xf7b933,
    emissive: 0x8a4b00,
    emissiveIntensity: 0.35,
    roughness: 0.16,
    metalness: 0.12,
  });
  const waterDiscMat = new THREE.MeshStandardMaterial({
    color: 0x3b6e8c,
    roughness: 0.08,
    metalness: 0.25,
  });

  // A. Carved Rosewood Frame, Turned Baluster Legs with Brass Ferrules & Stretchers
  const legPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.044, 0.0),
    new THREE.Vector2(0.046, 0.06),
    new THREE.Vector2(0.032, 0.12),
    new THREE.Vector2(0.048, 0.24),
    new THREE.Vector2(0.036, 0.38),
    new THREE.Vector2(0.050, 0.50),
    new THREE.Vector2(0.044, 0.62),
  ];
  const legGeo = new THREE.LatheGeometry(legPts, 14);
  for (const lx of [-0.82, 0.82]) {
    for (const lz of [-0.27, 0.27]) {
      const leg = new THREE.Mesh(legGeo, mats.timberMat);
      leg.position.set(lx, 0, lz);
      leg.castShadow = true;
      const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.048, 0.075, 14), mats.giltGoldMat);
      ferrule.position.set(lx, 0.038, lz);
      root.add(leg, ferrule);
    }
  }
  // Lower H-stretcher rails
  const longStretcher = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.042, 0.055), mats.timberMat);
  longStretcher.position.set(0, 0.14, 0);
  for (const sx of [-0.82, 0.82]) {
    const sideStr = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.042, 0.54), mats.timberMat);
    sideStr.position.set(sx, 0.14, 0);
    root.add(sideStr);
  }
  root.add(longStretcher);

  // Carved Cloud-Scroll Corner Knee Brackets flanking legs
  const bracketShape = new THREE.Shape();
  bracketShape.moveTo(0, 0);
  bracketShape.lineTo(0.16, 0);
  bracketShape.quadraticCurveTo(0.09, -0.05, 0.06, -0.10);
  bracketShape.quadraticCurveTo(0.02, -0.14, 0, -0.19);
  bracketShape.closePath();
  const bracketGeo = new THREE.ExtrudeGeometry(bracketShape, {
    depth: 0.028,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.006,
    bevelSegments: 1,
  });
  bracketGeo.translate(0, 0, -0.014);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const br = new THREE.Mesh(bracketGeo, mats.giltGoldMat);
      br.position.set(sx * 0.78, 0.60, sz * 0.27);
      if (sx === 1) br.scale.x = -1;
      root.add(br);
    }
  }

  // B. Pleated Crimson-and-Gold Tibetan Silk Brocade Skirt Valance
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(1.70, 0.34, 0.58), brocadeSkirtMat);
  skirt.position.y = 0.44;
  skirt.castShadow = true;
  skirt.receiveShadow = true;
  root.add(skirt);

  // Molded multi-stepped carved cornice tabletop (1.92m x 0.78m)
  const friezeTrim = new THREE.Mesh(new THREE.BoxGeometry(1.80, 0.045, 0.68), mats.giltGoldMat);
  friezeTrim.position.y = 0.61;
  const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.072, 0.78), mats.timberMat);
  tableTop.position.y = 0.665;
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  root.add(friezeTrim, tableTop);

  // C. Two-Tiered Hammered Brass Offering Tray + Upper Rosewood Riser
  const trayBaseY = 0.701;
  const lowerTray = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.032, 0.64), mats.warmBronzeMat);
  lowerTray.position.y = trayBaseY + 0.016;
  lowerTray.receiveShadow = true;
  root.add(lowerTray);
  // Rolled brass tray perimeter rim bars
  for (const [rx, rz, rsx, rsz] of [
    [0, -0.32, 1.76, 0.025],
    [0, 0.32, 1.76, 0.025],
    [-0.87, 0, 0.025, 0.64],
    [0.87, 0, 0.025, 0.64],
  ] as Array<[number, number, number, number]>) {
    const rim = new THREE.Mesh(new THREE.BoxGeometry(rsx, 0.045, rsz), mats.giltGoldMat);
    rim.position.set(rx, trayBaseY + 0.024, rz);
    root.add(rim);
  }

  // Raised Upper Tier Altar Step (back half of tray)
  const upperTierStep = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.095, 0.24), mats.timberMat);
  upperTierStep.position.set(0, trayBaseY + 0.068, -0.15);
  const upperTierBrass = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.020, 0.21), mats.giltGoldMat);
  upperTierBrass.position.set(0, trayBaseY + 0.122, -0.15);
  root.add(upperTierStep, upperTierBrass);

  // D. 9 Sculpted LatheGeometry Butter Lamps (`Karchung`) with Molten Ghee Pools & Wick Pins
  const lampPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.042, 0.0),
    new THREE.Vector2(0.036, 0.014),
    new THREE.Vector2(0.014, 0.032),
    new THREE.Vector2(0.022, 0.048),
    new THREE.Vector2(0.013, 0.064),
    new THREE.Vector2(0.056, 0.092),
    new THREE.Vector2(0.068, 0.122),
    new THREE.Vector2(0.060, 0.124),
    new THREE.Vector2(0.048, 0.094),
    new THREE.Vector2(0.0, 0.075),
  ];
  const lampGeo = new THREE.LatheGeometry(lampPts, 18);

  const addButterLamp = (lx: number, ly: number, lz: number, scale = 1.0) => {
    const chalice = new THREE.Mesh(lampGeo, mats.giltGoldMat);
    chalice.scale.setScalar(scale);
    chalice.position.set(lx, ly, lz);
    chalice.castShadow = true;

    const ghee = new THREE.Mesh(new THREE.CylinderGeometry(0.050 * scale, 0.045 * scale, 0.014, 14), gheePoolMat);
    ghee.position.set(lx, ly + 0.104 * scale, lz);

    const wickPin = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.006, 0.028 * scale, 6), mats.warmBronzeMat);
    wickPin.position.set(lx, ly + 0.114 * scale, lz);

    const flame = createSacredFlameGroup(mats.flameGlowMat, 0.44 * scale);
    flame.position.set(lx, ly + 0.128 * scale, lz);
    root.add(chalice, ghee, wickPin, flame);
    cornerLamps.push(flame);
  };

  // Front lower row: 5 larger lamps
  for (let i = 0; i < 5; i++) {
    addButterLamp(-0.46 + i * 0.23, trayBaseY + 0.032, 0.14, 1.05);
  }
  // Back upper tier: 4 lamps
  for (let i = 0; i < 4; i++) {
    addButterLamp(-0.36 + i * 0.24, trayBaseY + 0.132, -0.15, 0.94);
  }

  // E. Ritual Altar Accoutrements: 3 Water Offering Bowls (`Ting`), Copper Bumpa Pitcher & Brass Ghanta Bell
  const tingPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.026, 0.0),
    new THREE.Vector2(0.046, 0.025),
    new THREE.Vector2(0.052, 0.042),
    new THREE.Vector2(0.046, 0.042),
    new THREE.Vector2(0.038, 0.022),
    new THREE.Vector2(0.0, 0.010),
  ];
  const tingGeo = new THREE.LatheGeometry(tingPts, 16);
  for (const [wx, wz] of [[-0.72, 0.15], [0.72, 0.15], [0.72, -0.02]] as Array<[number, number]>) {
    const bowl = new THREE.Mesh(tingGeo, mats.giltGoldMat);
    bowl.position.set(wx, trayBaseY + 0.032, wz);
    const water = new THREE.Mesh(new THREE.CircleGeometry(0.044, 14), waterDiscMat);
    water.rotation.x = -Math.PI * 0.5;
    water.position.set(wx, trayBaseY + 0.066, wz);
    root.add(bowl, water);
  }

  // Sculpted Copper & Brass Bumpa Sacred Water Vase on left rear wing
  const bumpaPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.048, 0.0),
    new THREE.Vector2(0.038, 0.022),
    new THREE.Vector2(0.088, 0.075),
    new THREE.Vector2(0.092, 0.125),
    new THREE.Vector2(0.032, 0.165),
    new THREE.Vector2(0.054, 0.195),
    new THREE.Vector2(0.022, 0.215),
    new THREE.Vector2(0.0, 0.255),
  ];
  const bumpa = new THREE.Mesh(new THREE.LatheGeometry(bumpaPts, 20), copperMat);
  bumpa.position.set(-0.73, trayBaseY + 0.032, -0.15);
  bumpa.castShadow = true;
  const bumpaCollar = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.008, 6, 16), mats.giltGoldMat);
  bumpaCollar.rotation.x = Math.PI * 0.5;
  bumpaCollar.position.set(-0.73, trayBaseY + 0.195, -0.15);
  const bumpaSpout = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.66, trayBaseY + 0.13, -0.15),
        new THREE.Vector3(-0.62, trayBaseY + 0.17, -0.15),
        new THREE.Vector3(-0.61, trayBaseY + 0.22, -0.15),
      ]),
      8,
      0.010,
      6,
      false,
    ),
    mats.giltGoldMat,
  );
  root.add(bumpa, bumpaCollar, bumpaSpout);

  // Brass Ghanta Ritual Handbell on right rear wing
  const bellSkirt = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.048, 0.078, 14), mats.giltGoldMat);
  bellSkirt.position.set(0.73, trayBaseY + 0.072, -0.17);
  const bellHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.013, 0.075, 10), mats.warmBronzeMat);
  bellHandle.position.set(0.73, trayBaseY + 0.145, -0.17);
  const bellFinial = new THREE.Mesh(new THREE.OctahedronGeometry(0.015, 0), mats.giltGoldMat);
  bellFinial.position.set(0.73, trayBaseY + 0.19, -0.17);
  root.add(bellSkirt, bellHandle, bellFinial);

  // Warm Local Altar Flicker Light illuminating the brocade skirt and brass tray
  const altarLight = new THREE.PointLight(0xffb44d, 1.45, 9.5, 1.4);
  altarLight.position.set(0, trayBaseY + 0.52, 0.08);
  altarLight.userData.flickerPhase = 2.4;
  altarLight.userData.flickerAmp = 0.16;
  altarLight.userData.intensityScale = 1.45;
  altarLight.userData.warmFlicker = true;
  altarLight.userData.interiorSanctum = true;
  beaconLights.push(altarLight);
  root.add(altarLight);

  return root;
}

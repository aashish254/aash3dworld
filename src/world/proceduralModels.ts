import * as THREE from 'three';
import { ProceduralTextureSet } from './proceduralTextures';
import { BRIDGE_BOUNDS, getSurfaceHeightAt, groundHeightAt } from './worldLogic';
import { createWavingPrayerFlagGarland, getLungtaDrapeMaterials } from './prayerFlags';

export interface ExplorerCharacterRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  headGroup: THREE.Group;
  companionLantern: THREE.Group;
  shadowDisc: THREE.Mesh;
}

export interface LandmarkBuildResult {
  group: THREE.Group;
  hitMesh: THREE.Mesh;
  beaconLights: THREE.PointLight[];
  animatedNodes: THREE.Object3D[];
  cameraOccluders?: THREE.Object3D[];
}

export type PropKind = 'crate' | 'pot' | 'case' | 'cairn' | 'block' | 'barrel' | 'ball';
export type PropShape = 'box' | 'cylinder' | 'sphere';

export interface InteractiveProp {
  mesh: THREE.Group;
  visualGroup: THREE.Group;
  hitMeshes: THREE.Object3D[];
  kind: PropKind;
  shape: PropShape;
  mass: number;
  restitution: number;
  friction: number;
  buoyancy: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  quat: THREE.Quaternion;
  angVel: THREE.Vector3;
  rotX: number;
  rotZ: number;
  rotVelX: number;
  rotVelZ: number;
  radius: number;
  halfExtentX: number;
  halfHeight: number;
  halfExtentZ: number;
  halfWidth: number;
  stackLayer: number;
  baseOffsetY: number;
  inWater: boolean;
  splashCooldown: number;
}

function makeShadowDisc(radius: number, shadowTex: THREE.Texture): THREE.Mesh {
  const geo = new THREE.CircleGeometry(radius, 24);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.52,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0.025;
  mesh.userData.nonCollidable = true;
  return mesh;
}

function createSignpost(
  title: string,
  subtitle: string,
  accent: string,
  textures: ProceduralTextureSet,
): THREE.Group {
  const sign = new THREE.Group();
  const postMat = new THREE.MeshStandardMaterial({
    map: textures.woodMap,
    normalMap: textures.woodNormal,
    color: 0xffffff,
    roughness: 0.82,
  });
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x262b33,
    roughness: 0.42,
    metalness: 0.78,
  });

  const pL = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 1.74, 10), postMat);
  pL.position.set(-0.92, 0.63, 0);
  pL.castShadow = true;
  const pR = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 1.74, 10), postMat);
  pR.position.set(0.92, 0.63, 0);
  pR.castShadow = true;

  const board = new THREE.Mesh(new THREE.BoxGeometry(2.34, 0.9, 0.12), metalMat);
  board.position.set(0, 1.25, 0);
  board.castShadow = true;

  const faceTex = textures.createSignTexture(title, subtitle, accent);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(2.18, 0.78),
    new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.48, metalness: 0.2 }),
  );
  face.position.set(0, 1.25, 0.065);

  sign.add(pL, pR, board, face);
  return sign;
}

/**
 * Realistic Carved Stone & Cast-Bronze Gateway Monument Wall at the Spawn Courtyard
 * reading "AASHISH KUMAR MAHATO · SYSTEMS ENGINEER · KATHMANDU VALLEY TO VELLORE".
 */
export function create3DNameSign(textures: ProceduralTextureSet): THREE.Group {
  const group = new THREE.Group();

  const stoneMat = new THREE.MeshStandardMaterial({
    map: textures.cobbleMap,
    normalMap: textures.cobbleNormal,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughnessMap: textures.cobbleRough,
    color: 0xaba69d,
    roughness: 0.88,
  });
  const capMat = new THREE.MeshStandardMaterial({
    map: textures.sandstoneMap,
    normalMap: textures.sandstoneNormal,
    color: 0xbcb3a4,
    roughness: 0.82,
  });
  const bronzeMat = new THREE.MeshStandardMaterial({
    color: 0x7c5a2b,
    roughness: 0.34,
    metalness: 0.84,
  });
  const plaqueMat = new THREE.MeshStandardMaterial({
    map: textures.monumentPlaqueTex,
    roughness: 0.32,
    metalness: 0.72,
  });

  // Stepped masonry foundation apron extended below grade so corners never overhang slopes
  const base = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.56, 1.15), stoneMat);
  base.position.y = -0.04;
  base.receiveShadow = true;
  base.castShadow = true;
  group.add(base);

  // Main dressed stone stele wall
  const wall = new THREE.Mesh(new THREE.BoxGeometry(4.95, 1.48, 0.68), stoneMat);
  wall.position.y = 0.98;
  wall.castShadow = true;
  wall.receiveShadow = true;
  group.add(wall);

  // Chamfered sandstone cornice coping cap
  const coping = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.16, 0.84), capMat);
  coping.position.y = 1.8;
  coping.castShadow = true;
  group.add(coping);

  // Flanking carved stone end piers with bronze finials
  for (const px of [-2.45, 2.45]) {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.82, 0.88), stoneMat);
    pier.position.set(px, 1.12, 0);
    pier.castShadow = true;
    const pierCap = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.16, 0.98), capMat);
    pierCap.position.set(px, 2.08, 0);
    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), bronzeMat);
    finial.position.set(px, 2.26, 0);
    group.add(pier, pierCap, finial);
  }

  // Front & back cast-bronze plaques recessed inside bronze frame
  for (const zDir of [-1, 1]) {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(3.86, 1.12, 0.08), bronzeMat);
    frame.position.set(0, 1.05, zDir * 0.35);
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(3.68, 0.98), plaqueMat);
    plaque.position.set(0, 1.05, zDir * 0.395);
    if (zDir < 0) plaque.rotation.y = Math.PI;
    group.add(frame, plaque);
  }

  group.add(makeShadowDisc(3.1, textures.contactShadowMap));
  return group;
}

/**
 * Traditional Weathered Timber & Terracotta-Shingle Valley Information Pavilion.
 */
export function createNoticeBoardKiosk(textures: ProceduralTextureSet): THREE.Group {
  const kiosk = new THREE.Group();
  const timberMat = new THREE.MeshStandardMaterial({
    map: textures.woodMap,
    normalMap: textures.woodNormal,
    color: 0xffffff,
    roughness: 0.78,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    map: textures.roofTileMap,
    normalMap: textures.roofTileNormal,
    color: 0xffffff,
    roughness: 0.72,
  });
  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x22262d,
    roughness: 0.42,
    metalness: 0.82,
  });
  const lanternGlowMat = new THREE.MeshStandardMaterial({
    color: 0xffebba,
    emissive: 0xe69832,
    emissiveIntensity: 1.55,
    roughness: 0.25,
  });

  const pad = new THREE.Mesh(
    new THREE.BoxGeometry(2.9, 0.44, 0.95),
    new THREE.MeshStandardMaterial({
      map: textures.cobbleMap,
      normalMap: textures.cobbleNormal,
      color: 0xa6a298,
      roughness: 0.88,
    }),
  );
  pad.position.y = -0.06;
  pad.receiveShadow = true;
  kiosk.add(pad);

  for (const px of [-1.15, 1.15]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.35, 0.16), timberMat);
    post.position.set(px, 1.25, 0);
    post.castShadow = true;
    kiosk.add(post);

    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.28, 6), ironMat);
    chain.position.set(px * 1.18, 2.15, 0.22);
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.24, 0.18), lanternGlowMat);
    bulb.position.set(px * 1.18, 1.94, 0.22);
    const lCap = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.11, 4), ironMat);
    lCap.rotation.y = Math.PI / 4;
    lCap.position.set(px * 1.18, 2.09, 0.22);
    kiosk.add(chain, bulb, lCap);
  }

  const backing = new THREE.Mesh(new THREE.BoxGeometry(2.15, 1.38, 0.14), timberMat);
  backing.position.set(0, 1.52, 0);
  backing.castShadow = true;
  const mapFace = new THREE.Mesh(
    new THREE.PlaneGeometry(1.94, 1.2),
    new THREE.MeshStandardMaterial({ map: textures.valleyMapBoardTex, roughness: 0.72 }),
  );
  mapFace.position.set(0, 1.52, 0.075);
  kiosk.add(backing, mapFace);

  for (const side of [-1, 1]) {
    const slope = new THREE.Mesh(new THREE.BoxGeometry(3.05, 0.1, 0.88), roofMat);
    slope.position.set(0, 2.48, side * 0.34);
    slope.rotation.x = side * 0.48;
    slope.castShadow = true;
    kiosk.add(slope);
  }
  const ridgeBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 3.12, 8), timberMat);
  ridgeBeam.rotation.z = Math.PI / 2;
  ridgeBeam.position.set(0, 2.66, 0);
  kiosk.add(ridgeBeam);

  kiosk.add(makeShadowDisc(2.1, textures.contactShadowMap));
  return kiosk;
}

/**
 * Naturalistic Proportioned Trekker / Engineer Explorer Character
 * (olive/slate alpine jacket, khaki trousers, leather boots, woven daypack, Dhaka Topi, brass astrolabe).
 */
export function createExplorerCharacter(
  textures: ProceduralTextureSet,
): ExplorerCharacterRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const shadowDisc = makeShadowDisc(0.95, textures.contactShadowMap);
  root.add(shadowDisc);

  const jacketMat = new THREE.MeshStandardMaterial({
    color: 0x354b45,
    roughness: 0.78,
    metalness: 0.04,
  });
  const collarMat = new THREE.MeshStandardMaterial({
    color: 0x8f4a28,
    roughness: 0.72,
    metalness: 0.04,
  });
  const pantsMat = new THREE.MeshStandardMaterial({
    color: 0x564e41,
    roughness: 0.86,
    metalness: 0.02,
  });
  const bootMat = new THREE.MeshStandardMaterial({
    color: 0x332216,
    roughness: 0.62,
    metalness: 0.08,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xc58c64,
    roughness: 0.68,
    metalness: 0.02,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x16171a,
    roughness: 0.82,
  });
  const packMat = new THREE.MeshStandardMaterial({
    color: 0x4b3f31,
    roughness: 0.84,
    metalness: 0.04,
  });
  const topiMat = new THREE.MeshStandardMaterial({
    map: textures.dhakaMap,
    color: 0xffffff,
    roughness: 0.74,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xb3893b,
    roughness: 0.28,
    metalness: 0.86,
  });

  const makeLeg = (xOffset: number): THREE.Group => {
    const leg = new THREE.Group();
    leg.position.set(xOffset, 0.76, 0);
    const legMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.115, 0.42, 6, 10), pantsMat);
    legMesh.position.y = -0.3;
    legMesh.castShadow = true;
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.16, 0.31), bootMat);
    boot.position.set(0, -0.66, 0.05);
    boot.castShadow = true;
    const sole = new THREE.Mesh(
      new THREE.BoxGeometry(0.21, 0.045, 0.33),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.9 }),
    );
    sole.position.set(0, -0.74, 0.05);
    leg.add(legMesh, boot, sole);
    return leg;
  };
  const leftLeg = makeLeg(-0.16);
  const rightLeg = makeLeg(0.16);
  bodyGroup.add(leftLeg, rightLeg);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.29, 0.76, 14), jacketMat);
  torso.position.y = 1.16;
  torso.scale.set(1.18, 1, 0.82);
  torso.castShadow = true;
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.065, 8, 18), collarMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 1.54;
  bodyGroup.add(torso, collar);

  // Canvas trekking backpack with leather bedroll
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.62, 0.26), packMat);
  pack.position.set(0, 1.18, -0.28);
  pack.castShadow = true;
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.5, 12), collarMat);
  roll.rotation.z = Math.PI / 2;
  roll.position.set(0, 1.54, -0.3);
  bodyGroup.add(pack, roll);

  const makeArm = (xOffset: number): THREE.Group => {
    const arm = new THREE.Group();
    arm.position.set(xOffset, 1.46, 0);
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.38, 5, 10), jacketMat);
    sleeve.position.y = -0.24;
    sleeve.castShadow = true;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), skinMat);
    hand.position.y = -0.5;
    arm.add(sleeve, hand);
    return arm;
  };
  const leftArm = makeArm(-0.37);
  const rightArm = makeArm(0.37);
  bodyGroup.add(leftArm, rightArm);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.66, 0);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.14, 10), skinMat);
  neck.position.y = 0.02;
  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 14), skinMat);
  cranium.position.y = 0.22;
  cranium.scale.set(0.92, 1.06, 0.96);
  cranium.castShadow = true;
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.23, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.54),
    hairMat,
  );
  hair.position.y = 0.25;
  hair.scale.set(0.93, 1.04, 0.97);
  const topi = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.235, 0.21, 14), topiMat);
  topi.position.set(0, 0.43, -0.02);
  topi.rotation.x = -0.14;
  const glasses = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.08, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x16191f, roughness: 0.22, metalness: 0.85 }),
  );
  glasses.position.set(0, 0.23, 0.2);
  headGroup.add(neck, cranium, hair, topi, glasses);
  bodyGroup.add(headGroup);

  // Compact brass surveyor lantern/astrolabe companion
  const companionLantern = new THREE.Group();
  companionLantern.position.set(0.88, 2.05, -0.2);
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.02, 8, 20), brassMat);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.016, 8, 16), brassMat);
  ring2.rotation.x = Math.PI / 2;
  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.075, 0),
    new THREE.MeshStandardMaterial({
      color: 0xffedc2,
      emissive: 0xe69832,
      emissiveIntensity: 2.4,
      roughness: 0.2,
    }),
  );
  companionLantern.add(ring1, ring2, core);
  root.add(companionLantern);

  return {
    root,
    bodyGroup,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    headGroup,
    companionLantern,
    shadowDisc,
  };
}

/**
 * Generates an authentic concave flared Nepalese pagoda roof with curved hip ridges
 * and embossed radial standing seams matching Pashupatinath & Bhaktapur temples.
 */
function createCurvedPagodaRoofGeometry(
  baseWidth: number,
  topWidth: number,
  height: number,
  curveDepth = 0.28,
): THREE.BufferGeometry {
  const segR = 8;
  const sideSegs = 6;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const ringPoint = (s: number, tRing: number): [number, number] => {
    const half = THREE.MathUtils.lerp(baseWidth * 0.5, topWidth * 0.5, Math.pow(tRing, 0.85));
    // Slight concave flare outward at the 4 diagonal hip corners
    const cornerFlare = 1 + (1 - tRing) * 0.06;
    const perim = s * 4;
    let x = 0;
    let z = 0;
    if (perim < 1) {
      x = THREE.MathUtils.lerp(-half, half, perim);
      z = half;
    } else if (perim < 2) {
      x = half;
      z = THREE.MathUtils.lerp(half, -half, perim - 1);
    } else if (perim < 3) {
      x = THREE.MathUtils.lerp(half, -half, perim - 2);
      z = -half;
    } else {
      x = -half;
      z = THREE.MathUtils.lerp(-half, half, perim - 3);
    }
    const edgeFactor = Math.max(Math.abs(x), Math.abs(z)) / Math.max(0.001, half);
    const cornerDist = Math.hypot(x, z) / Math.max(0.001, half * Math.SQRT2);
    const flare = 1 + (cornerDist - 0.72) * (1 - tRing) * 0.14 * cornerFlare;
    // Standing seam ridges across each slope
    const seamU = ((perim * 4) % 1);
    const ribBump = Math.exp(-Math.pow((seamU - 0.5) * 8, 2)) * 0.03 * edgeFactor;
    return [x * flare, z * flare + ribBump * 0.0];
  };

  const totalPerimPts = sideSegs * 4;
  for (let r = 0; r <= segR; r++) {
    const t = r / segR;
    // Concave downward sweep toward eaves + subtle tip kick at very edge
    const y = Math.pow(t, 1.38) * height + Math.pow(1 - t, 3) * curveDepth * 0.28;
    for (let p = 0; p <= totalPerimPts; p++) {
      const s = p / totalPerimPts;
      const [rx, rz] = ringPoint(s, t);
      const seamWave = Math.pow(Math.abs(Math.sin(s * Math.PI * 24)), 8) * 0.028 * (1 - t * 0.7);
      positions.push(rx, y + seamWave, rz);
      uvs.push(s * 4, t);
    }
  }

  const stride = totalPerimPts + 1;
  for (let r = 0; r < segR; r++) {
    for (let p = 0; p < totalPerimPts; p++) {
      const a = r * stride + p;
      const b = a + 1;
      const c = (r + 1) * stride + p;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
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
 * 1. Pashupatinath & Kathmandu Durbar Pagoda Courtyard:
 *    - 2-tier concave flared golden-copper pagoda sanctuary + carved Tundal struts + Ankhi Jhyal clerestory
 *    - Crenellated white-and-terracotta Bagmati compound wall + stepped ghat stairs
 *    - Polychrome Pashupatinath entrance gatehouse with Shiva mural, Om gable & golden Nandi bull
 *    - Side Jhingati-roofed Patan Mandap pavilion + spinning Mani prayer wheels + Diyo sanctuary lamps
 */
export function createKathmanduPagoda(textures: ProceduralTextureSet): LandmarkBuildResult {
  const group = new THREE.Group();
  const beaconLights: THREE.PointLight[] = [];
  const animatedNodes: THREE.Object3D[] = [];

  const stoneMat = new THREE.MeshStandardMaterial({
    map: textures.cobbleMap,
    normalMap: textures.cobbleNormal,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughnessMap: textures.cobbleRough,
    aoMap: textures.cobbleAo,
    aoMapIntensity: 0.88,
    color: 0xc2bdb2,
    roughness: 1.0,
  });
  const brickMat = new THREE.MeshStandardMaterial({
    map: textures.brickMap,
    normalMap: textures.brickNormal,
    normalScale: new THREE.Vector2(0.95, 0.95),
    roughnessMap: textures.brickRough,
    aoMap: textures.brickAo,
    aoMapIntensity: 0.84,
    color: 0xd8cec6,
    roughness: 1.0,
  });
  const timberMat = new THREE.MeshStandardMaterial({
    map: textures.woodMap,
    normalMap: textures.woodNormal,
    color: 0xd8c8b6,
    roughness: 0.76,
  });
  const clayRoofMat = new THREE.MeshStandardMaterial({
    map: textures.roofTileMap,
    normalMap: textures.roofTileNormal,
    normalScale: new THREE.Vector2(0.9, 0.9),
    color: 0xc2b2a4,
    roughness: 0.72,
    metalness: 0.06,
    side: THREE.DoubleSide,
  });
  const copperGoldRoofMat = new THREE.MeshStandardMaterial({
    color: 0xb98524,
    roughness: 0.36,
    metalness: 0.78,
    side: THREE.DoubleSide,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xc79228,
    roughness: 0.28,
    metalness: 0.86,
  });
  const stuccoMat = new THREE.MeshStandardMaterial({
    normalMap: textures.sandstoneNormal,
    normalScale: new THREE.Vector2(0.4, 0.4),
    roughnessMap: textures.sandstoneRough,
    aoMap: textures.sandstoneAo,
    aoMapIntensity: 0.72,
    color: 0xd8d1c5,
    roughness: 1.0,
    metalness: 0.0,
  });
  const terracottaCapMat = new THREE.MeshStandardMaterial({
    color: 0x8c3526,
    roughness: 0.84,
  });

  // Main Bagmati courtyard terrace apron
  const baseApron = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.42, 8.8), stoneMat);
  baseApron.position.y = 0.21;
  baseApron.receiveShadow = true;
  baseApron.castShadow = true;
  group.add(baseApron);

  // Crenellated Bagmati perimeter compound wall + terracotta merlons (left/right & back)
  for (const wallSide of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.96, 8.2), stuccoMat);
    wall.position.set(wallSide * 4.55, 0.9, 0);
    wall.castShadow = true;
    wall.receiveShadow = true;
    group.add(wall);
    for (let mz = -3.8; mz <= 3.8; mz += 0.95) {
      const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.46), terracottaCapMat);
      merlon.position.set(wallSide * 4.55, 1.5, mz);
      group.add(merlon);
    }
  }
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(9.4, 1.15, 0.36), stuccoMat);
  backWall.position.set(0, 0.98, -4.15);
  backWall.castShadow = true;
  group.add(backWall);

  // Front stepped Bagmati Ghat staircase leading up to Pashupatinath Gatehouse
  for (let s = 0; s < 6; s++) {
    const stair = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.12, 0.34), stoneMat);
    stair.position.set(0.45, 0.06 + s * 0.075, 4.45 - s * 0.25);
    stair.receiveShadow = true;
    stair.castShadow = true;
    group.add(stair);
  }

  // Main Pashupatinath Gatehouse on front-right courtyard edge (inspired by image_7a41578f)
  const gate = new THREE.Group();
  gate.position.set(0.45, 0.42, 2.95);
  for (const px of [-1.05, 1.05]) {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(0.68, 2.3, 0.72), stuccoMat);
    pier.position.set(px, 1.15, 0);
    pier.castShadow = true;
    const pilaster = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 2.25, 10), stoneMat);
    pilaster.position.set(px * 0.86, 1.15, 0.36);
    gate.add(pier, pilaster);
  }
  const gateLintel = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.42, 0.76), stuccoMat);
  gateLintel.position.set(0, 2.18, 0);
  gateLintel.castShadow = true;
  const gateUpperWall = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.15, 0.68), stuccoMat);
  gateUpperWall.position.set(0, 2.94, 0);
  gateUpperWall.castShadow = true;
  const gateFrame = new THREE.Mesh(new THREE.BoxGeometry(1.56, 1.24, 0.08), timberMat);
  gateFrame.position.set(0, 2.86, 0.35);
  const gateBanner = new THREE.Mesh(
    new THREE.PlaneGeometry(1.42, 1.1),
    new THREE.MeshStandardMaterial({ map: textures.pashupatiGateMap, roughness: 0.76 }),
  );
  gateBanner.position.set(0, 2.86, 0.4);
  const gateGable = new THREE.Mesh(new THREE.ConeGeometry(1.75, 0.78, 4), copperGoldRoofMat);
  gateGable.rotation.y = Math.PI / 4;
  gateGable.position.set(0, 3.82, 0);
  const gateFinial = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.14, 0.52, 10), goldMat);
  gateFinial.position.set(0, 4.34, 0);
  // Dark sanctuary opening + golden Nandi bull clearly visible at threshold
  const portalVoid = new THREE.Mesh(
    new THREE.BoxGeometry(1.22, 1.98, 0.42),
    new THREE.MeshStandardMaterial({ color: 0x15110d, roughness: 0.95 }),
  );
  portalVoid.position.set(0, 0.99, -0.2);
  const nandiBase = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.24, 0.84), stoneMat);
  nandiBase.position.set(0, 0.12, 0.08);
  const nandiBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.44, 6, 12), goldMat);
  nandiBody.rotation.x = Math.PI / 2;
  nandiBody.position.set(0, 0.42, 0.08);
  const nandiHead = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 10), goldMat);
  nandiHead.position.set(0, 0.58, -0.2);
  const nandiHornL = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.16, 6), goldMat);
  nandiHornL.position.set(-0.1, 0.72, -0.2);
  nandiHornL.rotation.z = 0.45;
  const nandiHornR = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.16, 6), goldMat);
  nandiHornR.position.set(0.1, 0.72, -0.2);
  nandiHornR.rotation.z = -0.45;
  gate.add(
    gateLintel,
    gateUpperWall,
    gateFrame,
    gateBanner,
    gateGable,
    gateFinial,
    portalVoid,
    nandiBase,
    nandiBody,
    nandiHead,
    nandiHornL,
    nandiHornR,
  );
  group.add(gate);

  // Main Two-Tier Concave Golden-Copper Pashupatinath Sanctuary
  const temple = new THREE.Group();
  temple.position.set(0.45, 0.42, -0.85);

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.68, 4.6), stoneMat);
  plinth.position.y = 0.34;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  temple.add(plinth);

  const sanctumY = 0.68;
  const sanctum = new THREE.Mesh(new THREE.BoxGeometry(3.25, 2.25, 3.25), brickMat);
  sanctum.position.y = sanctumY + 1.12;
  sanctum.castShadow = true;
  temple.add(sanctum);

  // Carved Sal wood perimeter pillars + horizontal tie beams + lattice windows
  for (const cx of [-1.72, -0.68, 0.68, 1.72]) {
    for (const cz of [-1.72, 1.72]) {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.28, 0.16), timberMat);
      col.position.set(cx, sanctumY + 1.14, cz);
      col.castShadow = true;
      temple.add(col);
    }
  }
  const darkRecessMat = new THREE.MeshStandardMaterial({ color: 0x16120e, roughness: 0.92 });
  for (const rotY of [0, Math.PI / 2, -Math.PI / 2, Math.PI]) {
    const face = new THREE.Group();
    face.rotation.y = rotY;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.05, 0.18), timberMat);
    frame.position.set(0, sanctumY + 1.24, 1.64);
    const backing = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.76), darkRecessMat);
    backing.position.set(0, sanctumY + 1.24, 1.74);
    face.add(frame, backing);
    for (let bar = -2; bar <= 2; bar++) {
      const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.78, 0.05), timberMat);
      vBar.position.set(bar * 0.16, sanctumY + 1.24, 1.74);
      face.add(vBar);
    }
    temple.add(face);
  }

  // Tier 1 Lower Concave Flared Golden-Copper Roof + Carved Tundal Struts
  const tier1Y = sanctumY + 2.26;
  const roof1 = new THREE.Mesh(
    createCurvedPagodaRoofGeometry(5.6, 2.75, 1.42, 0.34),
    copperGoldRoofMat,
  );
  roof1.position.y = tier1Y;
  roof1.castShadow = true;
  temple.add(roof1);

  const eave1 = new THREE.Mesh(new THREE.BoxGeometry(5.35, 0.09, 5.35), timberMat);
  eave1.position.y = tier1Y - 0.02;
  temple.add(eave1);

  for (const sx of [-1.35, 0, 1.35]) {
    for (const szSide of [-1, 1]) {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.92, 0.11), timberMat);
      strut.position.set(sx, tier1Y - 0.38, szSide * 1.92);
      strut.rotation.x = szSide * 0.52;
      temple.add(strut);
    }
  }
  for (const cx of [-2.65, 2.65]) {
    for (const cz of [-2.65, 2.65]) {
      const bell = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 8), goldMat);
      bell.position.set(cx, tier1Y - 0.15, cz);
      temple.add(bell);
    }
  }

  // Carved Sal-wood lattice Clerestory (second story)
  const tier2WallY = tier1Y + 1.38;
  const upperCore = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.92, 2.5), brickMat);
  upperCore.position.y = tier2WallY + 0.38;
  upperCore.castShadow = true;
  temple.add(upperCore);
  const latticeBand = new THREE.Mesh(new THREE.BoxGeometry(2.62, 0.52, 2.62), timberMat);
  latticeBand.position.y = tier2WallY + 0.52;
  temple.add(latticeBand);

  // Tier 2 Upper Concave Flared Golden-Copper Roof
  const tier2RoofY = tier2WallY + 0.82;
  const roof2 = new THREE.Mesh(
    createCurvedPagodaRoofGeometry(3.95, 1.12, 1.12, 0.28),
    copperGoldRoofMat,
  );
  roof2.position.y = tier2RoofY;
  roof2.castShadow = true;
  temple.add(roof2);

  // Triple-finial Pashupatinath Crest (Central Tall Gajur + Flanking Finials + Tall Golden Trishul)
  const topCap = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.22, 1.18), goldMat);
  topCap.position.y = tier2RoofY + 1.12;
  temple.add(topCap);

  const spirePts = [
    new THREE.Vector2(0.01, 0),
    new THREE.Vector2(0.32, 0.16),
    new THREE.Vector2(0.16, 0.54),
    new THREE.Vector2(0.22, 0.8),
    new THREE.Vector2(0.03, 1.54),
    new THREE.Vector2(0, 1.66),
  ];
  const mainGajur = new THREE.Mesh(new THREE.LatheGeometry(spirePts, 16), goldMat);
  mainGajur.position.y = tier2RoofY + 1.22;
  temple.add(mainGajur);
  for (const fx of [-0.42, 0.42]) {
    const sideGajur = new THREE.Mesh(new THREE.LatheGeometry(spirePts, 12), goldMat);
    sideGajur.scale.setScalar(0.58);
    sideGajur.position.set(fx, tier2RoofY + 1.22, 0);
    temple.add(sideGajur);
  }
  // Golden Trishul rising behind central Gajur (just like photo image_b82e286f)
  const trishulStaff = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.45, 8), goldMat);
  trishulStaff.position.set(0.32, tier2RoofY + 2.0, -0.25);
  const trishulArc = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.025, 6, 14, Math.PI),
    goldMat,
  );
  trishulArc.rotation.z = Math.PI;
  trishulArc.position.set(0.32, tier2RoofY + 2.55, -0.25);
  temple.add(trishulStaff, trishulArc);

  // Warm sanctuary Diyo oil lamps (HDR emissive > bloomThreshold at dusk/night)
  const diyoFlameMat = new THREE.MeshStandardMaterial({
    color: 0xffdf99,
    emissive: 0xe88c1e,
    emissiveIntensity: 2.6,
    roughness: 0.2,
  });
  for (const lx of [-1.25, 1.25]) {
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.14, 10), goldMat);
    bowl.position.set(lx, sanctumY + 0.16, 2.02);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), diyoFlameMat);
    flame.position.set(lx, sanctumY + 0.28, 2.02);
    temple.add(bowl, flame);
  }
  group.add(temple);

  // Left Courtyard Side Mandap Pavilion (dark Jhingati clay tile curved roof, image_9068cb85)
  const mandap = new THREE.Group();
  mandap.position.set(-2.95, 0.42, 0.75);
  const mBase = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.46, 2.3), brickMat);
  mBase.position.y = 0.23;
  mBase.castShadow = true;
  mandap.add(mBase);
  for (const mx of [-0.88, 0.88]) {
    for (const mz of [-0.88, 0.88]) {
      const mCol = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.38, 0.14), timberMat);
      mCol.position.set(mx, 1.15, mz);
      mCol.castShadow = true;
      mandap.add(mCol);
    }
  }
  const mRoof = new THREE.Mesh(
    createCurvedPagodaRoofGeometry(2.85, 0.55, 0.88, 0.18),
    clayRoofMat,
  );
  mRoof.position.y = 1.82;
  mRoof.castShadow = true;
  const mFinial = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.42, 10), goldMat);
  mFinial.position.y = 2.86;
  mandap.add(mRoof, mFinial);
  group.add(mandap);

  // Brass Prayer Wheel Gallery (Mani Khor) along front-left terrace edge
  const railBase = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.12, 0.26), stoneMat);
  railBase.position.set(-2.65, 0.48, 3.25);
  const railTopBeam = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.1, 0.22), timberMat);
  railTopBeam.position.set(-2.65, 1.22, 3.25);
  group.add(railBase, railTopBeam);
  for (const px of [-4.05, -1.25]) {
    const rPost = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.8, 0.16), timberMat);
    rPost.position.set(px, 0.88, 3.25);
    group.add(rPost);
  }
  for (let i = -2; i <= 2; i++) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.34, 14), goldMat);
    wheel.position.set(-2.65 + i * 0.54, 0.92, 3.25);
    const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.56, 6), goldMat);
    axle.position.set(-2.65 + i * 0.54, 0.92, 3.25);
    group.add(wheel, axle);
    animatedNodes.push(wheel);
  }

  const sign = createSignpost('PASHUPATINATH', 'Kathmandu Courtyard & Ghats', '#d97706', textures);
  sign.position.set(3.45, 0, 4.15);
  sign.rotation.y = -0.32;
  group.add(sign);

  const warmLight = new THREE.PointLight(0xffb347, 2.2, 18, 1.7);
  warmLight.position.set(0.45, 3.4, 2.9);
  group.add(warmLight);
  beaconLights.push(warmLight);

  group.add(makeShadowDisc(5.9, textures.contactShadowMap));

  const hitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(9.6, 8.8, 9.0),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  hitMesh.position.y = 4.2;
  hitMesh.layers.set(1);
  group.add(hitMesh);

  return { group, hitMesh, beaconLights, animatedNodes };
}

/**
 * 1b. Boudhanath & Swayambhunath Great Stupa (image_d7864ebe, image_a47c338e, image_455ff28b)
 *     - 3-tier whitewashed Mandala plinth with butter-lamp & chorten recesses
 *     - Broad matte limewashed hemisphere with painted saffron lotus garlands (stupaDomeMap)
 *     - 4 gilded cardinal shrines + Harmika Wisdom Eyes + 13-step golden spire + Chhatra parasol
 *     - Radial 5-color prayer flag ropes draping to perimeter shrines
 */
export function createBoudhanathStupa(textures: ProceduralTextureSet): LandmarkBuildResult {
  const group = new THREE.Group();
  const beaconLights: THREE.PointLight[] = [];
  const animatedNodes: THREE.Object3D[] = [];

  const plasterMat = new THREE.MeshStandardMaterial({
    normalMap: textures.sandstoneNormal,
    normalScale: new THREE.Vector2(0.38, 0.38),
    roughnessMap: textures.sandstoneRough,
    aoMap: textures.sandstoneAo,
    aoMapIntensity: 0.72,
    color: 0xdcd6c9,
    roughness: 1.0,
    metalness: 0.0,
  });
  const domeMat = new THREE.MeshStandardMaterial({
    map: textures.stupaDomeMap,
    normalMap: textures.sandstoneNormal,
    normalScale: new THREE.Vector2(0.34, 0.34),
    roughnessMap: textures.sandstoneRough,
    aoMap: textures.sandstoneAo,
    aoMapIntensity: 0.74,
    color: 0xffffff,
    roughness: 1.0,
    metalness: 0.0,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xc9942a,
    roughness: 0.28,
    metalness: 0.86,
  });
  const stoneMat = new THREE.MeshStandardMaterial({
    map: textures.cobbleMap,
    normalMap: textures.cobbleNormal,
    normalScale: new THREE.Vector2(0.82, 0.82),
    roughnessMap: textures.cobbleRough,
    aoMap: textures.cobbleAo,
    aoMapIntensity: 0.86,
    color: 0xb6b2a8,
    roughness: 1.0,
  });
  const saffronMat = new THREE.MeshStandardMaterial({
    color: 0xb3641e,
    roughness: 0.82,
  });

  // Ground circumambulation kora apron
  const apron = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 5.9, 0.26, 32), stoneMat);
  apron.position.y = 0.13;
  apron.receiveShadow = true;
  group.add(apron);

  // 3 Stepped Mandala Plinth Terraces
  const mandalaSizes = [
    { w: 7.4, h: 0.56, y: 0.26 },
    { w: 6.2, h: 0.48, y: 0.82 },
    { w: 5.1, h: 0.44, y: 1.3 },
  ];
  for (const tier of mandalaSizes) {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(tier.w, tier.h, tier.w), plasterMat);
    slab.position.y = tier.y + tier.h * 0.5;
    slab.castShadow = true;
    slab.receiveShadow = true;
    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(tier.w + 0.1, 0.08, tier.w + 0.1),
      saffronMat,
    );
    trim.position.y = tier.y + tier.h;
    group.add(slab, trim);

    // Corner wing projections characteristic of Boudhanath Mandala corners
    const cw = tier.w * 0.24;
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(cw, tier.h * 0.9, cw), plasterMat);
        wing.position.set(sx * (tier.w * 0.48), tier.y + tier.h * 0.45, sz * (tier.w * 0.48));
        wing.castShadow = true;
        group.add(wing);
      }
    }
  }

  // Front auspicious staircase climbing Mandala terraces
  for (let s = 0; s < 6; s++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.22, 0.34), plasterMat);
    step.position.set(0, 0.36 + s * 0.23, 3.85 - s * 0.28);
    step.castShadow = true;
    group.add(step);
  }

  // Broad Whitewashed Dome (Anda) with painted saffron lotus garlands
  const domeBaseY = 1.72;
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(2.45, 36, 20, 0, Math.PI * 2, 0, Math.PI * 0.53),
    domeMat,
  );
  dome.position.y = domeBaseY;
  dome.castShadow = true;
  dome.receiveShadow = true;
  group.add(dome);

  // 4 Gilded Cardinal Dhyani Buddha Niche Shrines at base of dome
  for (let c = 0; c < 4; c++) {
    const a = (c / 4) * Math.PI * 2;
    const shrine = new THREE.Group();
    shrine.position.set(Math.sin(a) * 2.38, domeBaseY + 0.46, Math.cos(a) * 2.38);
    shrine.rotation.y = a;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.88, 0.36), goldMat);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.56, 0.42, 4), goldMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 0.64;
    const finial = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.32, 8), goldMat);
    finial.position.y = 0.96;
    shrine.add(frame, roof, finial);
    group.add(shrine);
  }

  // Swayambhu/Boudha Harmika with Wisdom Eyes
  const harmikaY = domeBaseY + 2.52;
  const harmikaMat = new THREE.MeshStandardMaterial({
    map: textures.stupaEyesMap,
    roughness: 0.38,
    metalness: 0.45,
  });
  const harmika = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.74, 1.18), [
    harmikaMat,
    harmikaMat,
    goldMat,
    goldMat,
    harmikaMat,
    harmikaMat,
  ]);
  harmika.position.y = harmikaY;
  harmika.castShadow = true;
  group.add(harmika);

  // Golden triangular Torana pediment plaques above Harmika eyes
  for (let c = 0; c < 4; c++) {
    const a = (c / 4) * Math.PI * 2;
    const torana = new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.48, 3), goldMat);
    torana.position.set(Math.sin(a) * 0.61, harmikaY + 0.56, Math.cos(a) * 0.61);
    torana.rotation.y = a;
    group.add(torana);
  }

  // 13-Step Conical Golden Spire (Bhumis) + Chhatra Parasol
  const spireStart = harmikaY + 0.46;
  for (let r = 0; r < 13; r++) {
    const t = r / 12;
    const rad = THREE.MathUtils.lerp(0.62, 0.16, t);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.9, rad, 0.13, 20), goldMat);
    ring.position.y = spireStart + r * 0.145;
    ring.castShadow = true;
    group.add(ring);
  }
  const chhatraY = spireStart + 13 * 0.145 + 0.1;
  const chhatra = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.52, 0.12, 20), goldMat);
  chhatra.position.y = chhatraY;
  const gajur = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.55, 12), goldMat);
  gajur.position.y = chhatraY + 0.34;
  group.add(chhatra, gajur);

  // 8 Sweeping Radial Prayer Flag Ropes from spire canopy down to Mandala plinth corners
  const prayerColors = [0x2c5c8f, 0xd8d3c8, 0x992c27, 0x2d6b3c, 0xb88c28];
  for (let l = 0; l < 8; l++) {
    const ang = (l / 8) * Math.PI * 2 + Math.PI / 8;
    const topP = new THREE.Vector3(0, chhatraY - 0.12, 0);
    const endP = new THREE.Vector3(Math.cos(ang) * 4.5, 0.92, Math.sin(ang) * 4.5);
    const midP = topP.clone().lerp(endP, 0.52);
    midP.y -= 0.72;
    const rCurve = new THREE.CatmullRomCurve3([topP, midP, endP]);
    group.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(rCurve, 12, 0.015, 4, false),
        new THREE.MeshStandardMaterial({ color: 0xbcb5a8, roughness: 0.9 }),
      ),
    );
    for (let f = 1; f <= 8; f++) {
      const fp = rCurve.getPoint(f / 9);
      const fl = new THREE.Mesh(
        new THREE.PlaneGeometry(0.24, 0.28),
        new THREE.MeshStandardMaterial({
          color: prayerColors[(l + f) % prayerColors.length],
          roughness: 0.88,
          side: THREE.DoubleSide,
        }),
      );
      fl.position.set(fp.x, fp.y - 0.12, fp.z);
      fl.rotation.y = ang + Math.PI / 2;
      group.add(fl);
    }
  }

  // Spinning brass prayer wheels along front kora wall + warm butter-lamp glow
  const lampGlowMat = new THREE.MeshStandardMaterial({
    color: 0xffe4a0,
    emissive: 0xe68c1e,
    emissiveIntensity: 2.5,
  });
  for (let w = -2; w <= 2; w++) {
    if (w === 0) continue;
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.34, 14), goldMat);
    wheel.position.set(w * 0.92, 0.62, 3.85);
    group.add(wheel);
    animatedNodes.push(wheel);
    const butterLamp = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), lampGlowMat);
    butterLamp.position.set(w * 0.92, 1.05, 3.76);
    group.add(butterLamp);
  }

  const sign = createSignpost('BOUDHANATH STUPA', 'Wisdom Eyes & Prayer Flags', '#eab308', textures);
  sign.position.set(3.85, 0, 4.4);
  sign.rotation.y = -0.35;
  group.add(sign);

  const warmLight = new THREE.PointLight(0xffb84d, 2.1, 20, 1.6);
  warmLight.position.set(0, 3.2, 4.1);
  group.add(warmLight);
  beaconLights.push(warmLight);

  group.add(makeShadowDisc(5.9, textures.contactShadowMap));

  const hitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(8.8, 8.6, 8.8),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  hitMesh.position.y = 4.0;
  hitMesh.layers.set(1);
  group.add(hitMesh);

  return { group, hitMesh, beaconLights, animatedNodes };
}

/**
 * 1c. Pumdikot Mahadev & Lake Overlook (image_5c07c568, image_592a4b0f, image_857117a3)
 *     - Circular stone overlook terrace ringed by warm-lit amber perimeter balustrade lamps
 *     - Ribbed white stupa-dome pedestal with recessed portals & skylight alcoves
 *     - Tiger-skin throne crowning monumental seated blue Lord Shiva with crescent moon & golden Trishul
 */
export function createPumdikotShiva(textures: ProceduralTextureSet): LandmarkBuildResult {
  const group = new THREE.Group();
  const beaconLights: THREE.PointLight[] = [];
  const animatedNodes: THREE.Object3D[] = [];

  const stoneMat = new THREE.MeshStandardMaterial({
    map: textures.cobbleMap,
    normalMap: textures.cobbleNormal,
    normalScale: new THREE.Vector2(0.82, 0.82),
    roughnessMap: textures.cobbleRough,
    aoMap: textures.cobbleAo,
    aoMapIntensity: 0.86,
    color: 0xb5b1a7,
    roughness: 1.0,
  });
  const domePlasterMat = new THREE.MeshStandardMaterial({
    normalMap: textures.sandstoneNormal,
    normalScale: new THREE.Vector2(0.35, 0.35),
    roughnessMap: textures.sandstoneRough,
    aoMap: textures.sandstoneAo,
    aoMapIntensity: 0.72,
    color: 0xdad4c8,
    roughness: 1.0,
  });
  const tigerMat = new THREE.MeshStandardMaterial({
    map: textures.tigerPeltMap,
    normalMap: textures.basaltCarvedNormal,
    normalScale: new THREE.Vector2(0.35, 0.35),
    roughness: 0.84,
  });
  // Photogrammetry-grade sculpted blue-slate stone/patinated bronze deity finish
  const shivaSkinMat = new THREE.MeshStandardMaterial({
    map: textures.basaltCarvedMap,
    normalMap: textures.basaltCarvedNormal,
    normalScale: new THREE.Vector2(0.75, 0.75),
    roughnessMap: textures.basaltCarvedRough,
    aoMap: textures.basaltCarvedAo,
    aoMapIntensity: 0.8,
    color: 0x5c89b4,
    roughness: 0.48,
    metalness: 0.16,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    map: textures.basaltCarvedMap,
    normalMap: textures.basaltCarvedNormal,
    normalScale: new THREE.Vector2(1.0, 1.0),
    color: 0x262932,
    roughness: 0.72,
    metalness: 0.08,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    map: textures.agedBronzeMap,
    normalMap: textures.agedBronzeNormal,
    normalScale: new THREE.Vector2(0.65, 0.65),
    roughnessMap: textures.agedBronzeRough,
    color: 0xe2b14a,
    roughness: 0.28,
    metalness: 0.88,
  });
  const balustradeLampMat = new THREE.MeshStandardMaterial({
    color: 0xffdf99,
    emissive: 0xe68c1e,
    emissiveIntensity: 2.6,
    roughness: 0.25,
  });

  // Circular hillside promenade deck + perimeter parapet + warm twilight lamps
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(4.9, 5.3, 0.42, 32), stoneMat);
  deck.position.y = 0.21;
  deck.receiveShadow = true;
  deck.castShadow = true;
  group.add(deck);

  const parapet = new THREE.Mesh(new THREE.TorusGeometry(4.78, 0.18, 8, 36), stoneMat);
  parapet.rotation.x = Math.PI / 2;
  parapet.position.y = 0.72;
  group.add(parapet);

  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    if (Math.abs(Math.sin(a)) < 0.28 && Math.cos(a) > 0) continue; // front walkway entry gap
    const px = Math.sin(a) * 4.78;
    const pz = Math.cos(a) * 4.78;
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.72, 0.22), stoneMat);
    post.position.set(px, 0.78, pz);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), balustradeLampMat);
    bulb.position.set(px, 1.22, pz);
    group.add(post, bulb);
  }

  // Ribbed white dome sanctuary base
  const shrineDome = new THREE.Mesh(
    new THREE.SphereGeometry(2.75, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.48),
    domePlasterMat,
  );
  shrineDome.position.y = 0.42;
  shrineDome.scale.set(1, 0.76, 1);
  shrineDome.castShadow = true;
  shrineDome.receiveShadow = true;
  group.add(shrineDome);

  // Base cylindrical plinth band + clean meridian ribs + cardinal lamp niches
  const domeSkirt = new THREE.Mesh(new THREE.CylinderGeometry(2.74, 2.82, 0.24, 32), stoneMat);
  domeSkirt.position.y = 0.52;
  domeSkirt.receiveShadow = true;
  group.add(domeSkirt);

  const domeCrownRing = new THREE.Mesh(new THREE.TorusGeometry(1.74, 0.07, 10, 32), goldMat);
  domeCrownRing.rotation.x = Math.PI / 2;
  domeCrownRing.position.y = 2.12;
  group.add(domeCrownRing);

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const ribArc = new THREE.Mesh(
      new THREE.TorusGeometry(2.77, 0.032, 6, 18, Math.PI * 0.42),
      domePlasterMat,
    );
    ribArc.position.y = 0.42;
    ribArc.scale.set(1, 0.76, 1);
    ribArc.rotation.y = a - Math.PI / 2;
    group.add(ribArc);

    if (i % 2 === 0) {
      const shrine = new THREE.Group();
      shrine.position.set(Math.sin(a) * 2.74, 0.42, Math.cos(a) * 2.74);
      shrine.rotation.y = a;
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.78, 0.28), stoneMat);
      frame.position.y = 0.39;
      frame.castShadow = true;
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.1, 0.34), goldMat);
      lintel.position.y = 0.81;
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.54), balustradeLampMat);
      glass.position.set(0, 0.38, 0.145);
      shrine.add(frame, lintel, glass);
      group.add(shrine);
    }
  }

  // Carved bronze & tiger-skin cushion pedestal crowning the dome
  const lotusBand = new THREE.Mesh(new THREE.CylinderGeometry(1.72, 1.84, 0.14, 24), goldMat);
  lotusBand.position.y = 2.26;
  lotusBand.castShadow = true;
  const peltPlinth = new THREE.Mesh(new THREE.CylinderGeometry(1.52, 1.68, 0.34, 24), tigerMat);
  peltPlinth.position.y = 2.48;
  peltPlinth.castShadow = true;
  group.add(lotusBand, peltPlinth);

  // High-Fidelity Photogrammetry-Grade Seated Lord Shiva Monument
  const shiva = new THREE.Group();
  shiva.position.set(0, 2.65, 0);

  // Sculpted Padmasana crossed legs & tiger-skin dhoti folds
  for (const side of [-1, 1]) {
    const legCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.32, 0.24, -0.05),
      new THREE.Vector3(side * 0.88, 0.16, 0.14),
      new THREE.Vector3(side * 0.56, 0.13, 0.46),
      new THREE.Vector3(-side * 0.18, 0.20, 0.42),
    ]);
    const legMesh = new THREE.Mesh(new THREE.TubeGeometry(legCurve, 22, 0.175, 16, false), shivaSkinMat);
    legMesh.castShadow = true;
    const kneeCap = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 12), shivaSkinMat);
    kneeCap.scale.set(1.05, 0.85, 1.05);
    kneeCap.position.set(side * 0.84, 0.17, 0.18);
    const footSole = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.16, 8, 12), shivaSkinMat);
    footSole.rotation.z = side * 1.15;
    footSole.rotation.x = Math.PI / 2;
    footSole.position.set(-side * 0.24, 0.22, 0.40);
    // Bronze ankle kada rings
    const anklet = new THREE.Mesh(new THREE.TorusGeometry(0.10, 0.02, 8, 16), goldMat);
    anklet.position.set(-side * 0.12, 0.21, 0.41);
    anklet.rotation.y = Math.PI / 2;
    shiva.add(legMesh, kneeCap, footSole, anklet);
  }
  const dhotiPts: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.08),
    new THREE.Vector2(0.76, 0.12),
    new THREE.Vector2(0.68, 0.30),
    new THREE.Vector2(0.48, 0.48),
    new THREE.Vector2(0.36, 0.56),
  ];
  const dhoti = new THREE.Mesh(new THREE.LatheGeometry(dhotiPts, 28), tigerMat);
  dhoti.scale.set(1.12, 1.0, 0.88);
  dhoti.castShadow = true;
  const waistband = new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.032, 8, 24), goldMat);
  waistband.rotation.x = Math.PI / 2;
  waistband.scale.set(1.12, 0.88, 1.0);
  waistband.position.y = 0.54;
  shiva.add(dhoti, waistband);

  // Contoured broad athletic Shiva torso + Trivali neck rings + pectoral relief
  const torsoPts: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.46),
    new THREE.Vector2(0.35, 0.52),
    new THREE.Vector2(0.33, 0.72),
    new THREE.Vector2(0.42, 0.98),
    new THREE.Vector2(0.53, 1.28),
    new THREE.Vector2(0.50, 1.48),
    new THREE.Vector2(0.24, 1.58),
    new THREE.Vector2(0.16, 1.74),
  ];
  const torso = new THREE.Mesh(new THREE.LatheGeometry(torsoPts, 30), shivaSkinMat);
  torso.scale.set(1.16, 1.0, 0.72);
  torso.castShadow = true;
  shiva.add(torso);

  // Sacred thread (Yajnopavita) draping left shoulder across chest
  const threadCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.34, 1.52, 0.14),
    new THREE.Vector3(-0.08, 1.18, 0.34),
    new THREE.Vector3(0.28, 0.82, 0.25),
    new THREE.Vector3(0.36, 0.62, -0.05),
    new THREE.Vector3(-0.02, 1.06, -0.29),
    new THREE.Vector3(-0.34, 1.52, 0.14),
  ]);
  const sacredThread = new THREE.Mesh(
    new THREE.TubeGeometry(threadCurve, 28, 0.016, 8, true),
    goldMat,
  );
  shiva.add(sacredThread);

  // Sculpted Vasuki serpent coiled gracefully around neck with hood & individual Rudraksha mala beads
  const snakePts: THREE.Vector3[] = [];
  for (let i = 0; i <= 28; i++) {
    const t = i / 28;
    const a = t * Math.PI * 2.2 - 0.5;
    snakePts.push(
      new THREE.Vector3(
        Math.sin(a) * (0.28 + (1 - t) * 0.08),
        1.52 + t * 0.24 + Math.sin(t * Math.PI * 2) * 0.03,
        Math.cos(a) * (0.24 + (1 - t) * 0.06),
      ),
    );
  }
  const vasukiBody = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(snakePts), 32, 0.044, 12, false),
    goldMat,
  );
  const vasukiHood = new THREE.Mesh(new THREE.SphereGeometry(0.088, 14, 12), goldMat);
  vasukiHood.scale.set(1.18, 1.38, 0.52);
  const tailEnd = snakePts[snakePts.length - 1];
  vasukiHood.position.set(tailEnd.x, tailEnd.y + 0.07, tailEnd.z + 0.02);
  shiva.add(vasukiBody, vasukiHood);

  const rudrakshaGeo = new THREE.SphereGeometry(0.026, 8, 8);
  for (let b = 0; b < 22; b++) {
    const ba = (b / 22) * Math.PI * 2;
    const bead = new THREE.Mesh(rudrakshaGeo, goldMat);
    bead.position.set(
      Math.sin(ba) * 0.29,
      1.36 + Math.cos(ba) * -0.14,
      0.12 + Math.cos(ba) * 0.24,
    );
    shiva.add(bead);
  }

  // Sculpted anatomical head: cheekbones, brow arches, serene half-closed eyelids, nose bridge, lips & tiered Jata
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.31, 26, 24), shivaSkinMat);
  head.scale.set(0.91, 1.07, 0.96);
  head.position.set(0, 1.93, 0.02);
  head.castShadow = true;
  const jawChin = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 12), shivaSkinMat);
  jawChin.scale.set(0.95, 0.85, 0.95);
  jawChin.position.set(0, 1.74, 0.16);
  const noseBridge = new THREE.Mesh(new THREE.CapsuleGeometry(0.024, 0.085, 6, 10), shivaSkinMat);
  noseBridge.rotation.x = -0.22;
  noseBridge.position.set(0, 1.92, 0.30);
  const lips = new THREE.Mesh(new THREE.CapsuleGeometry(0.016, 0.056, 4, 8), shivaSkinMat);
  lips.rotation.z = Math.PI / 2;
  lips.position.set(0, 1.81, 0.285);
  const tilak = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.06, 4, 8), goldMat);
  tilak.position.set(0, 2.02, 0.305);

  for (const side of [-1, 1]) {
    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.013, 0.075, 4, 8), shivaSkinMat);
    brow.rotation.z = Math.PI / 2 - side * 0.12;
    brow.position.set(side * 0.088, 1.99, 0.285);
    const eyelid = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.048, 4, 8), shivaSkinMat);
    eyelid.rotation.z = Math.PI / 2;
    eyelid.position.set(side * 0.085, 1.955, 0.288);
    const earCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.28, 1.97, 0.0),
      new THREE.Vector3(side * 0.31, 1.84, 0.01),
      new THREE.Vector3(side * 0.29, 1.72, 0.02),
    ]);
    const ear = new THREE.Mesh(new THREE.TubeGeometry(earCurve, 12, 0.034, 10, false), shivaSkinMat);
    const kundala = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.012, 6, 14), goldMat);
    kundala.position.set(side * 0.295, 1.70, 0.025);
    kundala.rotation.y = Math.PI / 2;
    shiva.add(brow, eyelid, ear, kundala);
  }
  const jataPts: THREE.Vector2[] = [
    new THREE.Vector2(0.28, 0.0),
    new THREE.Vector2(0.26, 0.14),
    new THREE.Vector2(0.19, 0.28),
    new THREE.Vector2(0.23, 0.36),
    new THREE.Vector2(0.14, 0.48),
    new THREE.Vector2(0.04, 0.56),
  ];
  const hairBun = new THREE.Mesh(new THREE.LatheGeometry(jataPts, 24), hairMat);
  hairBun.position.set(0, 2.12, -0.02);
  const crescent = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.024, 8, 18, Math.PI * 1.25), goldMat);
  crescent.position.set(-0.14, 2.34, 0.16);
  crescent.rotation.z = 0.5;
  shiva.add(head, jawChin, noseBridge, lips, tilak, hairBun, crescent);

  // Sculpted Right Blessing Arm (Abhaya Mudra with bronze armlet + wrist bracelet + articulated palm & 5 fingers)
  const rightArmCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.54, 1.46, 0.04),
    new THREE.Vector3(-0.74, 1.16, 0.16),
    new THREE.Vector3(-0.72, 1.46, 0.42),
  ]);
  const rightArm = new THREE.Mesh(new THREE.TubeGeometry(rightArmCurve, 20, 0.108, 14, false), shivaSkinMat);
  rightArm.castShadow = true;
  const handGroup = new THREE.Group();
  handGroup.position.set(-0.72, 1.56, 0.45);
  handGroup.rotation.x = -0.15;
  const palmBase = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 12), shivaSkinMat);
  palmBase.scale.set(0.95, 1.15, 0.48);
  handGroup.add(palmBase);
  for (let f = 0; f < 4; f++) {
    const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.015, 0.095 - Math.abs(f - 1.5) * 0.012, 4, 8), shivaSkinMat);
    finger.position.set(-0.045 + f * 0.03, 0.115, 0.01);
    handGroup.add(finger);
  }
  const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.016, 0.065, 4, 8), shivaSkinMat);
  thumb.position.set(0.075, 0.025, 0.02);
  thumb.rotation.z = -0.58;
  handGroup.add(thumb);
  shiva.add(rightArm, handGroup);

  // Sculpted Left Arm curving cleanly to grip Aged-Bronze Trishul + Damaru
  const leftArmCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.54, 1.46, 0.04),
    new THREE.Vector3(0.76, 1.18, 0.12),
    new THREE.Vector3(0.76, 1.48, 0.32),
  ]);
  const leftArm = new THREE.Mesh(new THREE.TubeGeometry(leftArmCurve, 20, 0.108, 14, false), shivaSkinMat);
  leftArm.castShadow = true;
  const leftGrip = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 12), shivaSkinMat);
  leftGrip.position.set(0.76, 1.50, 0.33);

  const trishulShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.042, 3.65, 16), goldMat);
  trishulShaft.position.set(0.76, 1.88, 0.32);
  trishulShaft.castShadow = true;
  const trishulCollar = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.026, 8, 18), goldMat);
  trishulCollar.rotation.x = Math.PI / 2;
  trishulCollar.position.set(0.76, 3.16, 0.32);
  const trishulProng = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.036, 10, 24, Math.PI), goldMat);
  trishulProng.rotation.z = Math.PI;
  trishulProng.position.set(0.76, 3.45, 0.32);
  const centerSpear = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.56, 14), goldMat);
  centerSpear.position.set(0.76, 3.84, 0.32);
  const damaru1 = new THREE.Mesh(new THREE.ConeGeometry(0.115, 0.16, 16), goldMat);
  damaru1.position.set(0.92, 2.95, 0.32);
  damaru1.rotation.z = Math.PI / 2;
  const damaru2 = new THREE.Mesh(new THREE.ConeGeometry(0.115, 0.16, 16), goldMat);
  damaru2.position.set(0.6, 2.95, 0.32);
  damaru2.rotation.z = -Math.PI / 2;
  shiva.add(leftArm, leftGrip, trishulShaft, trishulCollar, trishulProng, centerSpear, damaru1, damaru2);
  group.add(shiva);

  const sign = createSignpost('PUMDIKOT SHIVA', 'Pokhara Lake Overlook', '#38bdf8', textures);
  sign.position.set(-3.4, 0, 4.9);
  sign.rotation.y = 0.28;
  group.add(sign);

  const warmLight = new THREE.PointLight(0xffb85c, 2.1, 20, 1.6);
  warmLight.position.set(0, 3.6, 3.6);
  group.add(warmLight);
  beaconLights.push(warmLight);

  group.add(makeShadowDisc(5.8, textures.contactShadowMap));

  const hitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(9.6, 7.6, 9.6),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  hitMesh.position.y = 3.6;
  hitMesh.layers.set(1);
  group.add(hitMesh);

  return { group, hitMesh, beaconLights, animatedNodes };
}

export { createJanakiMandir } from './janakiMandir';
export { createLumbiniBuddha } from './lumbiniTemple';

/**
 * 2. VIT Vellore Clock Tower: Authentic Indo-Saracenic Red-Brick & Chunar Sandstone
 *    with Glazed Arched Colonnade Windows, Sandstone Quoins, Louvered Belfry,
 *    Roman Numeral Clock Dials, Corner Chhatris & Oxidized Copper Dome.
 */
export function createVitClockTower(textures: ProceduralTextureSet): LandmarkBuildResult {
  const group = new THREE.Group();
  const beaconLights: THREE.PointLight[] = [];
  const animatedNodes: THREE.Object3D[] = [];

  const sandstoneMat = new THREE.MeshStandardMaterial({
    map: textures.sandstoneMap,
    normalMap: textures.sandstoneNormal,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughnessMap: textures.sandstoneRough,
    aoMap: textures.sandstoneAo,
    aoMapIntensity: 0.85,
    color: 0xffffff,
    roughness: 1.0,
  });
  const brickMat = new THREE.MeshStandardMaterial({
    map: textures.brickMap,
    normalMap: textures.brickNormal,
    normalScale: new THREE.Vector2(0.95, 0.95),
    roughnessMap: textures.brickRough,
    aoMap: textures.brickAo,
    aoMapIntensity: 0.82,
    color: 0xffffff,
    roughness: 1.0,
  });
  // Oxidized patinated copper-verdigris dome + warm terracotta copper trim
  const domeMat = new THREE.MeshStandardMaterial({
    color: 0x4c7366,
    roughness: 0.48,
    metalness: 0.36,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xb88b32,
    roughness: 0.24,
    metalness: 0.88,
  });
  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x1e2228,
    roughness: 0.38,
    metalness: 0.82,
  });
  const glassBayMat = new THREE.MeshStandardMaterial({
    map: textures.windowGlassMap,
    roughness: 0.14,
    metalness: 0.65,
  });

  // Stepped sandstone base plinth
  const base = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.55, 7.0), sandstoneMat);
  base.position.y = 0.275;
  base.receiveShadow = true;
  base.castShadow = true;
  group.add(base);

  // Recessed glazed academic portico core behind the colonnade so arches aren't floating around empty air
  const innerCore = new THREE.Mesh(new THREE.BoxGeometry(4.4, 3.15, 4.0), brickMat);
  innerCore.position.y = 2.12;
  innerCore.castShadow = true;
  group.add(innerCore);

  // Glazed arched window panels recessed inside portico walls
  for (const [wx, wz, ry] of [
    [-1.1, 2.02, 0],
    [1.1, 2.02, 0],
    [-1.1, -2.02, Math.PI],
    [1.1, -2.02, Math.PI],
    [-2.22, 0.9, -Math.PI / 2],
    [-2.22, -0.9, -Math.PI / 2],
    [2.22, 0.9, Math.PI / 2],
    [2.22, -0.9, Math.PI / 2],
  ] as Array<[number, number, number]>) {
    const winPane = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 2.05), glassBayMat);
    winPane.position.set(wx, 2.0, wz);
    winPane.rotation.y = ry;
    group.add(winPane);
  }

  // Portico Perimeter Sandstone Columns + Semicircular Arches
  const colPositions: Array<[number, number]> = [
    [-2.5, 2.3], [0, 2.3], [2.5, 2.3],
    [-2.5, -2.3], [0, -2.3], [2.5, -2.3],
    [-2.5, 0], [2.5, 0],
  ];
  for (const [cx, cz] of colPositions) {
    const ped = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.42, 0.62), sandstoneMat);
    ped.position.set(cx, 0.76, cz);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.27, 2.75, 14), sandstoneMat);
    col.position.set(cx, 2.3, cz);
    col.castShadow = true;
    group.add(ped, col);
  }

  const makeArchBay = (x: number, z: number, ry: number) => {
    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(0.95, 0.16, 8, 18, Math.PI),
      sandstoneMat,
    );
    arch.position.set(x, 2.85, z);
    arch.rotation.y = ry;
    arch.castShadow = true;
    group.add(arch);
  };
  makeArchBay(-1.25, 2.3, 0);
  makeArchBay(1.25, 2.3, 0);
  makeArchBay(-1.25, -2.3, 0);
  makeArchBay(1.25, -2.3, 0);
  makeArchBay(-2.5, 1.15, Math.PI / 2);
  makeArchBay(-2.5, -1.15, Math.PI / 2);
  makeArchBay(2.5, 1.15, Math.PI / 2);
  makeArchBay(2.5, -1.15, Math.PI / 2);

  // Portico cornice terrace + 4 Corner Sandstone Chhatri Cupolas
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(5.85, 0.46, 5.45), sandstoneMat);
  cornice.position.y = 3.85;
  cornice.castShadow = true;
  group.add(cornice);

  for (const cx of [-2.35, 2.35]) {
    for (const cz of [-2.15, 2.15]) {
      const miniBase = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.22, 0.88), sandstoneMat);
      miniBase.position.set(cx, 4.18, cz);
      const miniDome = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.56),
        domeMat,
      );
      miniDome.position.set(cx, 4.78, cz);
      const miniFinial = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.34, 8), brassMat);
      miniFinial.position.set(cx, 5.34, cz);
      for (const px of [-0.28, 0.28]) {
        for (const pz of [-0.28, 0.28]) {
          const pCol = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.56, 8), sandstoneMat);
          pCol.position.set(cx + px, 4.5, cz + pz);
          group.add(pCol);
        }
      }
      group.add(miniBase, miniDome, miniFinial);
    }
  }

  const rail = new THREE.Mesh(new THREE.TorusGeometry(2.58, 0.045, 6, 4), ironMat);
  rail.rotation.x = Math.PI / 2;
  rail.rotation.z = Math.PI / 4;
  rail.position.y = 4.24;
  group.add(rail);

  // Central red-brick tower shaft with vertical sandstone pilasters & recessed louvered lancet windows
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(2.85, 4.35, 2.85), brickMat);
  shaft.position.y = 5.95;
  shaft.castShadow = true;
  group.add(shaft);

  for (const qx of [-1.42, 1.42]) {
    for (const qz of [-1.42, 1.42]) {
      const pilaster = new THREE.Mesh(new THREE.BoxGeometry(0.24, 4.38, 0.24), sandstoneMat);
      pilaster.position.set(qx, 5.95, qz);
      group.add(pilaster);
    }
  }

  // Tall louvered shaft windows on all 4 sides of brick tower
  for (const [wx, wz, ry] of [
    [0, 1.44, 0],
    [0, -1.44, Math.PI],
    [-1.44, 0, -Math.PI / 2],
    [1.44, 0, Math.PI / 2],
  ] as Array<[number, number, number]>) {
    const lancetFrame = new THREE.Mesh(new THREE.BoxGeometry(0.95, 2.1, 0.08), sandstoneMat);
    lancetFrame.position.set(wx, 6.05, wz);
    lancetFrame.rotation.y = ry;
    const lancetGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 1.8), glassBayMat);
    lancetGlass.position.set(
      wx + Math.sin(ry) * 0.046,
      6.05,
      wz + Math.cos(ry) * 0.046,
    );
    lancetGlass.rotation.y = ry;
    group.add(lancetFrame, lancetGlass);
  }

  // Sandstone clock housing + 4 Antique Ivory/Brass Roman Numeral Clock Dials
  const crown = new THREE.Mesh(new THREE.BoxGeometry(3.32, 1.92, 3.32), sandstoneMat);
  crown.position.y = 8.6;
  crown.castShadow = true;
  group.add(crown);

  const dialMat = new THREE.MeshStandardMaterial({
    map: textures.clockFaceMap,
    emissive: 0xffe4b3,
    emissiveIntensity: 0.24,
    roughness: 0.28,
  });
  const dialOffsets: Array<{ x: number; z: number; ry: number }> = [
    { x: 0, z: 1.68, ry: 0 },
    { x: 0, z: -1.68, ry: Math.PI },
    { x: -1.68, z: 0, ry: -Math.PI / 2 },
    { x: 1.68, z: 0, ry: Math.PI / 2 },
  ];
  for (const d of dialOffsets) {
    const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.73, 0.06, 8, 24), brassMat);
    bezel.position.set(d.x, 8.62, d.z);
    bezel.rotation.y = d.ry;
    const dial = new THREE.Mesh(new THREE.CircleGeometry(0.7, 24), dialMat);
    dial.position.set(d.x, 8.62, d.z);
    dial.rotation.y = d.ry;
    group.add(bezel, dial);
  }

  // Octagonal sandstone drum + Oxidized Copper Central Cupola + Brass Finial
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(1.36, 1.48, 0.65, 16), sandstoneMat);
  drum.position.y = 9.88;
  const cupola = new THREE.Mesh(
    new THREE.SphereGeometry(1.42, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.56),
    domeMat,
  );
  cupola.position.y = 10.12;
  const finial = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.15, 12), brassMat);
  finial.position.y = 11.95;
  group.add(drum, cupola, finial);

  // Subtle brass weathervane / astronomical armillary sphere mounted inside portico court
  const emblem = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.38, 0.075, 48, 8),
    brassMat,
  );
  emblem.position.set(0, 2.15, 2.55);
  group.add(emblem);
  animatedNodes.push(emblem);

  const sign = createSignpost('VIT VELLORE · INDIA', 'B.Tech CSE · Campus Tower', '#b84b39', textures);
  sign.position.set(-3.3, 0, 3.85);
  sign.rotation.y = 0.35;
  group.add(sign);

  const light = new THREE.PointLight(0xffb36b, 1.9, 18, 1.7);
  light.position.set(0, 2.8, 2.6);
  group.add(light);
  beaconLights.push(light);

  group.add(makeShadowDisc(5.4, textures.contactShadowMap));

  const hitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(7.6, 12.2, 7.2),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  hitMesh.position.y = 6.0;
  hitMesh.layers.set(1);
  group.add(hitMesh);

  return { group, hitMesh, beaconLights, animatedNodes };
}

/**
 * 3. AniFlow AI Studio Pavilion — Brushed Anodized Steel & Glass Engineering Bay
 */
export function createAniFlowStudio(textures: ProceduralTextureSet): LandmarkBuildResult {
  const group = new THREE.Group();
  const beaconLights: THREE.PointLight[] = [];
  const animatedNodes: THREE.Object3D[] = [];

  const concreteMat = new THREE.MeshStandardMaterial({
    map: textures.cobbleMap,
    normalMap: textures.cobbleNormal,
    color: 0x62676f,
    roughness: 0.85,
    metalness: 0.08,
  });
  const slateMat = new THREE.MeshStandardMaterial({
    color: 0x1d232b,
    roughness: 0.44,
    metalness: 0.56,
  });
  const aluminumMat = new THREE.MeshStandardMaterial({
    color: 0xaab4c0,
    roughness: 0.28,
    metalness: 0.85,
  });
  const cyanEmissive = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 1.15,
    roughness: 0.25,
  });

  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(4.1, 4.45, 0.44, 16), concreteMat);
  plinth.position.y = 0.22;
  plinth.receiveShadow = true;
  group.add(plinth);

  const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(0.36, 4.15, 0.48), aluminumMat);
  leftPillar.position.set(-2.38, 2.3, -0.45);
  leftPillar.castShadow = true;
  const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(0.36, 4.15, 0.48), aluminumMat);
  rightPillar.position.set(2.38, 2.3, -0.45);
  rightPillar.castShadow = true;
  const topBeam = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.32, 0.62), aluminumMat);
  topBeam.position.set(0, 4.42, -0.45);
  group.add(leftPillar, rightPillar, topBeam);

  const bezel = new THREE.Mesh(new THREE.BoxGeometry(4.75, 3.05, 0.24), slateMat);
  bezel.position.set(0, 2.75, -0.35);
  bezel.castShadow = true;
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(4.38, 2.7),
    new THREE.MeshBasicMaterial({ map: textures.aniflowScreenMap }),
  );
  screen.position.set(0, 2.75, -0.22);
  group.add(bezel, screen);

  for (let i = 0; i < 3; i++) {
    const panelCard = new THREE.Mesh(new THREE.BoxGeometry(0.82, 1.05, 0.07), aluminumMat);
    panelCard.position.set(-2.45, 1.45 + i * 0.22, 1.15 - i * 0.35);
    panelCard.rotation.y = 0.42;
    panelCard.castShadow = true;
    const border = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.06, 0.09), cyanEmissive);
    border.position.set(-2.45, 1.98 + i * 0.22, 1.15 - i * 0.35);
    border.rotation.y = 0.42;
    group.add(panelCard, border);
  }

  // Architectural cantilevered louvered roof canopy + rooftop telemetry radar dish (replaces cartoon torus eyes)
  const canopyDeck = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.14, 2.2), slateMat);
  canopyDeck.position.set(0, 4.72, 0.15);
  canopyDeck.castShadow = true;
  group.add(canopyDeck);
  for (let f = -4; f <= 4; f++) {
    const louver = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 2.24), aluminumMat);
    louver.position.set(f * 0.58, 4.82, 0.15);
    group.add(louver);
  }
  const mastGroup = new THREE.Group();
  mastGroup.position.set(1.75, 5.15, -0.35);
  const mastPole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.75, 8), aluminumMat);
  mastPole.position.y = -0.15;
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.12, 0.18, 16), aluminumMat);
  dish.position.y = 0.28;
  dish.rotation.x = Math.PI / 3;
  mastGroup.add(mastPole, dish);
  group.add(mastGroup);
  animatedNodes.push(mastGroup);

  // Local workstation compute rack with cooling louvers
  const tower = new THREE.Mesh(new THREE.BoxGeometry(1.18, 2.1, 1.18), slateMat);
  tower.position.set(2.5, 1.32, 1.25);
  tower.castShadow = true;
  const strip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.65, 0.08), cyanEmissive);
  strip.position.set(2.5, 1.32, 1.85);
  group.add(tower, strip);

  const sign = createSignpost('ANIFLOW STUDIO', 'YOLOv8 · OCR · Ollama · TTS', '#38bdf8', textures);
  sign.position.set(-2.9, 0, 3.3);
  sign.rotation.y = 0.28;
  group.add(sign);

  const light = new THREE.PointLight(0x38bdf8, 1.4, 15, 1.7);
  light.position.set(0, 3.1, 2.0);
  group.add(light);
  beaconLights.push(light);

  group.add(makeShadowDisc(4.6, textures.contactShadowMap));

  const hitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(6.8, 6.2, 5.8),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  hitMesh.position.y = 3.1;
  hitMesh.layers.set(1);
  group.add(hitMesh);

  return { group, hitMesh, beaconLights, animatedNodes };
}

/**
 * 4. Local-First Agent Citadel & Open-Source Server Monolith
 */
export function createAgentCitadel(textures: ProceduralTextureSet): LandmarkBuildResult {
  const group = new THREE.Group();
  const beaconLights: THREE.PointLight[] = [];
  const animatedNodes: THREE.Object3D[] = [];

  const basaltMat = new THREE.MeshStandardMaterial({
    map: textures.cobbleMap,
    normalMap: textures.cobbleNormal,
    color: 0x3b4048,
    roughness: 0.72,
    metalness: 0.16,
  });
  const obsidianMat = new THREE.MeshStandardMaterial({
    color: 0x1a2028,
    roughness: 0.42,
    metalness: 0.56,
  });
  const emeraldMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x059669,
    emissiveIntensity: 1.25,
    roughness: 0.24,
  });
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xb6c0cc,
    roughness: 0.24,
    metalness: 0.88,
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(4.25, 4.65, 0.5, 8), basaltMat);
  base.position.y = 0.25;
  base.receiveShadow = true;
  group.add(base);

  const pillars = [
    { x: -1.85, z: -0.95, h: 5.2 },
    { x: 0, z: -1.75, h: 6.85 },
    { x: 1.85, z: -0.95, h: 4.8 },
  ];
  pillars.forEach((p) => {
    const col = new THREE.Mesh(new THREE.BoxGeometry(1.22, p.h, 1.22), obsidianMat);
    col.position.set(p.x, p.h / 2 + 0.45, p.z);
    col.castShadow = true;
    const collar1 = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.14, 1.28), emeraldMat);
    collar1.position.set(p.x, p.h * 0.78, p.z);
    const collar2 = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.12, 1.28), steelMat);
    collar2.position.set(p.x, p.h * 0.42, p.z);
    group.add(col, collar1, collar2);
  });

  const shield = new THREE.Mesh(new THREE.OctahedronGeometry(0.88, 0), steelMat);
  shield.position.set(0, 4.7, 0.45);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(1.36, 0.055, 8, 28), emeraldMat);
  halo.position.set(0, 4.7, 0.45);
  halo.rotation.x = Math.PI / 3;
  group.add(shield, halo);
  animatedNodes.push(shield, halo);

  const lectern = new THREE.Mesh(new THREE.BoxGeometry(2.9, 1.78, 0.24), obsidianMat);
  lectern.position.set(0, 1.55, 1.85);
  lectern.rotation.x = -0.25;
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(2.58, 1.54),
    new THREE.MeshBasicMaterial({ map: textures.agentScreenMap }),
  );
  screen.position.set(0, 1.58, 1.98);
  screen.rotation.x = -0.25;
  group.add(lectern, screen);

  const sign = createSignpost('SYSTEMS CITADEL', 'Burn · Laya · Open-Source OSS', '#10b981', textures);
  sign.position.set(3.2, 0, 3.2);
  sign.rotation.y = -0.25;
  group.add(sign);

  const light = new THREE.PointLight(0x10b981, 1.45, 16, 1.7);
  light.position.set(0, 3.8, 2.3);
  group.add(light);
  beaconLights.push(light);

  group.add(makeShadowDisc(5.0, textures.contactShadowMap));

  const hitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(6.8, 7.3, 6.4),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  hitMesh.position.y = 3.6;
  hitMesh.layers.set(1);
  group.add(hitMesh);

  return { group, hitMesh, beaconLights, animatedNodes };
}

/**
 * 5. Breath Sensor Bio-Observatory (Patent IN202641010439 A1)
 */
export function createBreathSensorLab(
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean,
): LandmarkBuildResult {
  const group = new THREE.Group();
  const beaconLights: THREE.PointLight[] = [];
  const animatedNodes: THREE.Object3D[] = [];

  const ceramicMat = new THREE.MeshStandardMaterial({
    map: textures.sandstoneMap,
    normalMap: textures.sandstoneNormal,
    color: 0xc8ccd4,
    roughness: 0.65,
    metalness: 0.08,
  });
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x7a8594,
    roughness: 0.26,
    metalness: 0.88,
  });
  const violetMat = new THREE.MeshStandardMaterial({
    color: 0x8b5cf6,
    emissive: 0x6d28d9,
    emissiveIntensity: 1.2,
    roughness: 0.25,
  });

  const pad = new THREE.Mesh(new THREE.CylinderGeometry(3.65, 4.05, 0.48, 24), ceramicMat);
  pad.position.y = 0.24;
  pad.receiveShadow = true;
  group.add(pad);

  const ringBase = new THREE.Mesh(new THREE.TorusGeometry(2.58, 0.2, 10, 32), metalMat);
  ringBase.rotation.x = Math.PI / 2;
  ringBase.position.y = 0.56;
  group.add(ringBase);

  const glassDome = new THREE.Mesh(
    new THREE.SphereGeometry(2.25, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55),
    new THREE.MeshPhysicalMaterial({
      color: 0xdce4ee,
      roughness: 0.14,
      metalness: 0.08,
      transmission: isSoftwareGl ? 0 : 0.72,
      transparent: true,
      opacity: isSoftwareGl ? 0.34 : 0.9,
      depthWrite: false,
    }),
  );
  glassDome.position.y = 0.56;
  glassDome.renderOrder = 2;

  const domeWire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.28, 1),
    new THREE.MeshStandardMaterial({
      color: 0x525d6b,
      wireframe: true,
      roughness: 0.35,
      metalness: 0.82,
    }),
  );
  domeWire.position.y = 1.65;
  group.add(glassDome, domeWire);

  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.72, 1), violetMat);
  core.position.y = 2.0;
  group.add(core);
  animatedNodes.push(core);

  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const probe = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 1.45, 10), metalMat);
    probe.position.set(Math.cos(a) * 1.45, 1.25, Math.sin(a) * 1.45);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), violetMat);
    tip.position.set(Math.cos(a) * 1.45, 2.02, Math.sin(a) * 1.45);
    group.add(probe, tip);
  }

  const sign = createSignpost('BREATH SENSOR LAB', 'Patent IN202641010439 A1', '#8b5cf6', textures);
  sign.position.set(-2.8, 0, 3.4);
  sign.rotation.y = 0.3;
  group.add(sign);

  const light = new THREE.PointLight(0x8b5cf6, 1.4, 15, 1.7);
  light.position.set(0, 2.6, 2.3);
  group.add(light);
  beaconLights.push(light);

  group.add(makeShadowDisc(4.4, textures.contactShadowMap));

  const hitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(6.0, 4.8, 6.0),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  hitMesh.position.y = 2.4;
  hitMesh.layers.set(1);
  group.add(hitMesh);

  return { group, hitMesh, beaconLights, animatedNodes };
}

/**
 * 6. Himalayan Signal Stone Tower & Royal Brass/Crimson Recruiter Postbox
 */
export function createRecruiterBeacon(textures: ProceduralTextureSet): LandmarkBuildResult {
  const group = new THREE.Group();
  const beaconLights: THREE.PointLight[] = [];
  const animatedNodes: THREE.Object3D[] = [];

  const stoneMat = new THREE.MeshStandardMaterial({
    map: textures.cobbleMap,
    normalMap: textures.cobbleNormal,
    normalScale: new THREE.Vector2(0.82, 0.82),
    roughnessMap: textures.cobbleRough,
    aoMap: textures.cobbleAo,
    aoMapIntensity: 0.86,
    color: 0xffffff,
    roughness: 1.0,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xb3872e,
    roughness: 0.26,
    metalness: 0.88,
  });
  const emberMat = new THREE.MeshStandardMaterial({
    color: 0xffe4ad,
    emissive: 0xe08d26,
    emissiveIntensity: 1.65,
    roughness: 0.2,
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.95, 3.45, 0.65, 12), stoneMat);
  base.position.y = 0.325;
  base.receiveShadow = true;
  group.add(base);

  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 1.18, 3.8, 12), stoneMat);
  column.position.y = 2.45;
  column.castShadow = true;
  group.add(column);

  const gallery = new THREE.Mesh(new THREE.CylinderGeometry(1.32, 0.98, 0.45, 12), brassMat);
  gallery.position.y = 4.45;
  group.add(gallery);

  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.76, 0), emberMat);
  crystal.position.y = 5.65;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.24, 0.055, 8, 24), brassMat);
  ring.position.y = 5.65;
  ring.rotation.x = Math.PI / 3;
  group.add(crystal, ring);
  animatedNodes.push(crystal, ring);

  // Heritage cast-iron / crimson royal mail postbox
  const postStand = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 1.25, 10), brassMat);
  postStand.position.set(0, 0.98, 2.05);
  const postBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 0.62, 0.66),
    new THREE.MeshStandardMaterial({ color: 0x8f1d1d, roughness: 0.42, metalness: 0.24 }),
  );
  postBox.position.set(0, 1.72, 2.05);
  postBox.castShadow = true;
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.09, 0.08), brassMat);
  slot.position.set(0, 1.85, 2.39);
  group.add(postStand, postBox, slot);

  const sign = createSignpost('SIGNAL BEACON', 'Hire & Contact Aashish', '#d97706', textures);
  sign.position.set(2.75, 0, -2.1);
  sign.rotation.y = 0.65;
  group.add(sign);

  const light = new THREE.PointLight(0xf59e0b, 1.9, 18, 1.6);
  light.position.set(0, 5.6, 0.8);
  group.add(light);
  beaconLights.push(light);

  group.add(makeShadowDisc(4.2, textures.contactShadowMap));

  const hitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(5.6, 7.0, 5.6),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  hitMesh.position.y = 3.5;
  hitMesh.layers.set(1);
  group.add(hitMesh);

  return { group, hitMesh, beaconLights, animatedNodes };
}

/**
 * Authentic Nepali Jhulunge Pul Suspension Bridge:
 * stone masonry cliff anchorages, galvanized steel truss pylons,
 * twin steel wire-rope catenary cables, hanger rods, safety wire rails, & timber planks.
 */
export function createSuspensionBridge(textures: ProceduralTextureSet): THREE.Group {
  const bridge = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({
    map: textures.cobbleMap,
    normalMap: textures.cobbleNormal,
    normalScale: new THREE.Vector2(0.82, 0.82),
    roughnessMap: textures.cobbleRough,
    aoMap: textures.cobbleAo,
    aoMapIntensity: 0.86,
    color: 0xffffff,
    roughness: 1.0,
  });
  const woodMat = new THREE.MeshStandardMaterial({
    map: textures.woodMap,
    normalMap: textures.woodNormal,
    color: 0xbca68c,
    roughness: 0.84,
  });
  const trussSteelMat = new THREE.MeshStandardMaterial({
    color: 0x4b535e,
    roughness: 0.42,
    metalness: 0.78,
  });
  const cableMat = new THREE.MeshStandardMaterial({
    color: 0x9aa3ad,
    roughness: 0.3,
    metalness: 0.88,
  });
  const flagColors = [0x2c5c8f, 0xd8d3c8, 0x992c27, 0x2d6b3c, 0xb88c28];

  const { minX, maxX, centerZ, halfWidth, deckY } = BRIDGE_BOUNDS;
  const span = maxX - minX;

  for (const bx of [minX - 0.35, maxX + 0.35]) {
    const anchorSign = bx < (minX + maxX) / 2 ? -1 : 1;
    const anchorBlock = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.85, halfWidth * 2 + 1.1), stoneMat);
    anchorBlock.position.set(bx + anchorSign * 0.55, -0.03, centerZ);
    anchorBlock.receiveShadow = true;
    anchorBlock.castShadow = true;
    bridge.add(anchorBlock);

    for (const bz of [centerZ - halfWidth, centerZ + halfWidth]) {
      for (const legOff of [-0.18, 0.18]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.11, 3.65, 0.11), trussSteelMat);
        leg.position.set(bx + legOff, deckY + 1.55, bz);
        leg.castShadow = true;
        bridge.add(leg);
      }
      for (let b = 0; b < 3; b++) {
        const brace = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.08, 0.14), trussSteelMat);
        brace.position.set(bx, deckY + 0.72 + b * 0.95, bz);
        brace.rotation.z = b % 2 === 0 ? 0.65 : -0.65;
        bridge.add(brace);
      }
      const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.2, 0.34), trussSteelMat);
      saddle.position.set(bx, deckY + 3.42, bz);
      bridge.add(saddle);
    }

    const portalBeam = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.24, halfWidth * 2 + 0.3),
      trussSteelMat,
    );
    portalBeam.position.set(bx, deckY + 3.25, centerZ);
    portalBeam.castShadow = true;
    bridge.add(portalBeam);
  }

  const plankCount = 32;
  for (let i = 0; i <= plankCount; i++) {
    const t = i / plankCount;
    const px = minX + t * span;
    const py = deckY + Math.sin(t * Math.PI) * 0.42;
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(span / plankCount - 0.035, 0.14, halfWidth * 2),
      woodMat,
    );
    plank.position.set(px, py - 0.07, centerZ);
    plank.rotation.z = ((i % 3) - 1) * 0.012;
    plank.receiveShadow = true;
    plank.castShadow = true;
    bridge.add(plank);
  }

  for (const side of [-1, 1]) {
    const bz = centerZ + side * halfWidth;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const cx = minX - 0.35 + t * (span + 0.7);
      const sag = Math.sin(t * Math.PI) * -1.18;
      const cy = deckY + 3.45 + sag;
      pts.push(new THREE.Vector3(cx, cy, bz));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const cable = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.055, 6, false), cableMat);
    cable.castShadow = true;
    bridge.add(cable);

    const railPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const rx = minX + t * span;
      const ry = deckY + Math.sin(t * Math.PI) * 0.42 + 0.84;
      railPts.push(new THREE.Vector3(rx, ry, bz));
    }
    const railCurve = new THREE.CatmullRomCurve3(railPts);
    bridge.add(
      new THREE.Mesh(new THREE.TubeGeometry(railCurve, 18, 0.03, 6, false), trussSteelMat),
    );

    for (let h = 1; h < 11; h++) {
      const ht = h / 11;
      const topPt = curve.getPointAt(ht);
      const deckH = deckY + Math.sin(ht * Math.PI) * 0.42;
      const rodH = Math.max(0.4, topPt.y - deckH);
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, rodH, 5), cableMat);
      rod.position.set(topPt.x, deckH + rodH / 2, bz);
      bridge.add(rod);
    }

    const bridgeFlagGeo = new THREE.PlaneGeometry(0.3, 0.4, 4, 6);
    bridgeFlagGeo.translate(0, -0.2, 0);
    const bridgeDrapeMats = getLungtaDrapeMaterials();
    for (let f = 1; f < 13; f++) {
      const pt = curve.getPointAt(f / 13);
      const flag = new THREE.Mesh(
        bridgeFlagGeo,
        bridgeDrapeMats[f % bridgeDrapeMats.length],
      );
      flag.position.set(pt.x, pt.y - 0.02, pt.z);
      flag.userData.nonCollidable = true;
      flag.userData.noSpin = true;
      bridge.add(flag);
    }
  }

  return bridge;
}

export function createPrayerFlagLine(
  start: THREE.Vector3,
  end: THREE.Vector3,
  flagCount = 10,
): { group: THREE.Group; flags: THREE.Mesh[] } {
  return createWavingPrayerFlagGarland(start, end, {
    flagCount,
    flagWidth: 0.36,
    flagHeight: 0.46,
    sag: 0.75,
    includePoles: true,
    poleBaseGroundY: groundHeightAt,
  });
}

export function createCustomWaypointFlag(colorHex: string): THREE.Group {
  const g = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.45, 0.16, 12),
    new THREE.MeshStandardMaterial({ color: 0x3b4048, roughness: 0.78 }),
  );
  base.position.y = 0.08;
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.055, 2.2, 8),
    new THREE.MeshStandardMaterial({ color: 0xb6c0cc, roughness: 0.34, metalness: 0.82 }),
  );
  pole.position.y = 1.15;
  const banner = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.46, 0.05),
    new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.32,
      roughness: 0.55,
    }),
  );
  banner.position.set(0.45, 1.95, 0);
  const finial = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xb3872e, roughness: 0.28, metalness: 0.88 }),
  );
  finial.position.y = 2.3;
  g.add(base, pole, banner, finial);
  return g;
}

/**
 * Interactive real-world expedition & playground props:
 * Weathered stenciled timber shipping crates, terracotta Gagri water vessels,
 * anodized aluminum lab cases, stacked stone trail cairns, stacked architectural blocks,
 * buoyant banded river barrels, and high-bounce expedition balls.
 */
export function createInteractiveProps(textures: ProceduralTextureSet): InteractiveProp[] {
  const props: InteractiveProp[] = [];
  const crateMat = new THREE.MeshStandardMaterial({
    map: textures.crateFaceMap,
    normalMap: textures.crateNormal,
    color: 0xffffff,
    roughness: 0.84,
  });
  const potMat = new THREE.MeshStandardMaterial({
    normalMap: textures.brickNormal,
    normalScale: new THREE.Vector2(0.45, 0.45),
    color: 0x8c4a30,
    roughness: 0.84,
    metalness: 0.03,
  });
  const caseMat = new THREE.MeshStandardMaterial({
    color: 0x2b3440,
    roughness: 0.36,
    metalness: 0.68,
  });
  const cairnMat = new THREE.MeshStandardMaterial({
    map: textures.sandstoneMap,
    normalMap: textures.sandstoneNormal,
    normalScale: new THREE.Vector2(0.75, 0.75),
    roughnessMap: textures.sandstoneRough,
    aoMap: textures.sandstoneAo,
    aoMapIntensity: 0.84,
    color: 0x9b9589,
    roughness: 1.0,
  });
  const blockLightMat = new THREE.MeshStandardMaterial({
    color: 0xf4ede2,
    normalMap: textures.sandstoneNormal,
    normalScale: new THREE.Vector2(0.28, 0.28),
    roughness: 0.66,
    metalness: 0.04,
  });
  const blockWarmMat = new THREE.MeshStandardMaterial({
    color: 0xe6886c,
    normalMap: textures.sandstoneNormal,
    normalScale: new THREE.Vector2(0.28, 0.28),
    roughness: 0.64,
    metalness: 0.04,
  });
  const barrelWoodMat = new THREE.MeshStandardMaterial({
    map: textures.woodMap,
    normalMap: textures.woodNormal,
    color: 0xa67346,
    roughness: 0.8,
  });
  const barrelBandMat = new THREE.MeshStandardMaterial({
    color: 0x2b3038,
    roughness: 0.42,
    metalness: 0.78,
  });
  const ballMainMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.38,
    metalness: 0.05,
  });
  const ballStripeMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    roughness: 0.42,
    metalness: 0.05,
  });

  interface PropPlacement {
    x: number;
    z: number;
    kind: PropKind;
    stackLayer?: number;
    baseOffsetY?: number;
    yaw?: number;
    variant?: number;
  }

  const blockH = 0.56;
  const crateH = 0.7;

  const placements: PropPlacement[] = [
    // Spawn meadow crate stack & expedition toys
    { x: -4.2, z: 4.0, kind: 'crate', stackLayer: 0 },
    { x: -3.45, z: 3.1, kind: 'crate', stackLayer: 0 },
    { x: -4.85, z: 3.15, kind: 'crate', stackLayer: 0 },
    { x: -4.15, z: 3.55, kind: 'crate', stackLayer: 1, baseOffsetY: crateH },
    { x: -6.4, z: 7.4, kind: 'block', stackLayer: 0, yaw: 0.22, variant: 0 },
    { x: -7.35, z: 7.6, kind: 'block', stackLayer: 0, yaw: 0.22, variant: 1 },
    { x: -6.88, z: 7.5, kind: 'block', stackLayer: 1, baseOffsetY: blockH, yaw: 0.22, variant: 0 },
    { x: 4.8, z: 7.8, kind: 'ball' },
    { x: -2.4, z: 9.2, kind: 'ball' },
    { x: 3.4, z: 4.5, kind: 'pot' },
    { x: 4.1, z: 3.7, kind: 'pot' },
    { x: 2.3, z: 2.8, kind: 'cairn' },

    // Riverbank Bruno-Simon-style stacked architectural blocks & buoyant river barrels
    { x: 20.6, z: -13.6, kind: 'block', stackLayer: 0, yaw: -0.35, variant: 0 },
    { x: 21.55, z: -13.95, kind: 'block', stackLayer: 0, yaw: -0.35, variant: 1 },
    { x: 21.08, z: -14.62, kind: 'block', stackLayer: 0, yaw: -0.35, variant: 0 },
    { x: 21.05, z: -13.78, kind: 'block', stackLayer: 1, baseOffsetY: blockH, yaw: -0.2, variant: 1 },
    { x: 21.3, z: -14.32, kind: 'block', stackLayer: 1, baseOffsetY: blockH, yaw: -0.45, variant: 0 },
    { x: 21.18, z: -14.05, kind: 'block', stackLayer: 2, baseOffsetY: blockH * 2, yaw: -0.1, variant: 0 },
    { x: 19.6, z: -20.2, kind: 'barrel' },
    { x: 20.4, z: -19.5, kind: 'barrel' },
    { x: 21.8, z: -18.8, kind: 'ball' },
    { x: 40.4, z: -20.8, kind: 'barrel' },
    { x: 41.2, z: -20.1, kind: 'crate' },

    // Temple & valley outposts
    { x: -53.5, z: -18.5, kind: 'pot' },
    { x: -54.2, z: -17.8, kind: 'pot' },
    { x: -50.5, z: 132.5, kind: 'pot' },
    { x: -51.4, z: 133.2, kind: 'pot' },
    { x: -86.8, z: 154.6, kind: 'pot' },
    { x: -97.2, z: 154.6, kind: 'pot' },
    { x: 71.5, z: -22.5, kind: 'crate' },
    { x: 72.3, z: -23.3, kind: 'crate' },
    { x: -59.5, z: -87.5, kind: 'case' },
    { x: -60.2, z: -88.2, kind: 'case' },
    { x: 5.5, z: -102.5, kind: 'case' },
    { x: 6.4, z: -103.1, kind: 'case' },
    { x: 88.5, z: -90.5, kind: 'case' },
    { x: -112.5, z: 10.5, kind: 'cairn' },
  ];

  // Center ALL lathe geometries around (0, 0, 0) for accurate 3D rigid-body tumbling
  const potPts = [
    new THREE.Vector2(0.01, -0.31),
    new THREE.Vector2(0.24, -0.26),
    new THREE.Vector2(0.32, -0.03),
    new THREE.Vector2(0.18, 0.21),
    new THREE.Vector2(0.24, 0.31),
  ];
  const potGeo = new THREE.LatheGeometry(potPts, 16);
  const crateGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
  const caseGeo = new THREE.BoxGeometry(0.62, 0.42, 0.46);
  const blockGeo = new THREE.BoxGeometry(0.88, 0.56, 0.62);
  const cairnGeo = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.01, -0.325),
      new THREE.Vector2(0.32, -0.245),
      new THREE.Vector2(0.24, -0.085),
      new THREE.Vector2(0.22, 0.015),
      new THREE.Vector2(0.15, 0.155),
      new THREE.Vector2(0.06, 0.295),
      new THREE.Vector2(0, 0.325),
    ],
    12,
  );
  const barrelBodyGeo = new THREE.CylinderGeometry(0.31, 0.31, 0.78, 14);
  const barrelHoopGeo = new THREE.TorusGeometry(0.316, 0.02, 6, 16);
  barrelHoopGeo.rotateX(Math.PI / 2);
  const ballGeo = new THREE.SphereGeometry(0.34, 18, 14);
  const ballBandGeo = new THREE.TorusGeometry(0.338, 0.022, 6, 22);

  placements.forEach((pl, idx) => {
    const g = new THREE.Group();
    const visualGroup = new THREE.Group();
    const hitMeshes: THREE.Object3D[] = [];

    let shape: PropShape = 'box';
    let halfExtentX = 0.35;
    let halfHeight = 0.35;
    let halfExtentZ = 0.35;
    let halfWidth = 0.35;
    let radius = 0.5;
    let mass = 1.0;
    let restitution = 0.35;
    let friction = 0.75;
    let buoyancy = 0;

    if (pl.kind === 'crate') {
      const mesh = new THREE.Mesh(crateGeo, crateMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      visualGroup.add(mesh);
      shape = 'box';
      halfExtentX = 0.35;
      halfHeight = 0.35;
      halfExtentZ = 0.35;
      halfWidth = 0.35;
      radius = 0.49;
      mass = 1.0;
      restitution = 0.32;
      friction = 0.76;
      buoyancy = 1.18;
    } else if (pl.kind === 'block') {
      const mesh = new THREE.Mesh(blockGeo, pl.variant === 1 ? blockWarmMat : blockLightMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      visualGroup.add(mesh);
      shape = 'box';
      halfExtentX = 0.44;
      halfHeight = 0.28;
      halfExtentZ = 0.31;
      halfWidth = 0.44;
      radius = 0.52;
      mass = 1.35;
      restitution = 0.28;
      friction = 0.82;
      buoyancy = 0;
    } else if (pl.kind === 'pot') {
      const mesh = new THREE.Mesh(potGeo, potMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      visualGroup.add(mesh);
      shape = 'cylinder';
      halfExtentX = 0.32;
      halfHeight = 0.31;
      halfExtentZ = 0.32;
      halfWidth = 0.32;
      radius = 0.38;
      mass = 0.85;
      restitution = 0.26;
      friction = 0.78;
      buoyancy = 0;
    } else if (pl.kind === 'cairn') {
      const mesh = new THREE.Mesh(cairnGeo, cairnMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      visualGroup.add(mesh);
      shape = 'cylinder';
      halfExtentX = 0.32;
      halfHeight = 0.325;
      halfExtentZ = 0.32;
      halfWidth = 0.32;
      radius = 0.38;
      mass = 1.6;
      restitution = 0.22;
      friction = 0.88;
      buoyancy = 0;
    } else if (pl.kind === 'barrel') {
      const body = new THREE.Mesh(barrelBodyGeo, barrelWoodMat);
      body.castShadow = true;
      body.receiveShadow = true;
      const hoopTop = new THREE.Mesh(barrelHoopGeo, barrelBandMat);
      hoopTop.position.y = 0.24;
      const hoopBot = new THREE.Mesh(barrelHoopGeo, barrelBandMat);
      hoopBot.position.y = -0.24;
      visualGroup.add(body, hoopTop, hoopBot);
      shape = 'cylinder';
      halfExtentX = 0.32;
      halfHeight = 0.39;
      halfExtentZ = 0.32;
      halfWidth = 0.32;
      radius = 0.4;
      mass = 1.1;
      restitution = 0.42;
      friction = 0.62;
      buoyancy = 1.35;
    } else if (pl.kind === 'ball') {
      const sphere = new THREE.Mesh(ballGeo, ballMainMat);
      sphere.castShadow = true;
      sphere.receiveShadow = true;
      const stripeA = new THREE.Mesh(ballBandGeo, ballStripeMat);
      const stripeB = new THREE.Mesh(ballBandGeo, ballStripeMat);
      stripeB.rotation.y = Math.PI / 2;
      visualGroup.add(sphere, stripeA, stripeB);
      shape = 'sphere';
      halfExtentX = 0.34;
      halfHeight = 0.34;
      halfExtentZ = 0.34;
      halfWidth = 0.34;
      radius = 0.36;
      mass = 0.55;
      restitution = 0.78;
      friction = 0.45;
      buoyancy = 1.6;
    } else {
      const mesh = new THREE.Mesh(caseGeo, caseMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      visualGroup.add(mesh);
      shape = 'box';
      halfExtentX = 0.31;
      halfHeight = 0.21;
      halfExtentZ = 0.23;
      halfWidth = 0.31;
      radius = 0.4;
      mass = 0.95;
      restitution = 0.38;
      friction = 0.72;
      buoyancy = 0.9;
    }

    const quat = new THREE.Quaternion();
    if (typeof pl.yaw === 'number') {
      quat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), pl.yaw);
      visualGroup.quaternion.copy(quat);
    }

    visualGroup.position.y = halfHeight;
    visualGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.layers.enable(3);
        child.userData.propIndex = idx;
        hitMeshes.push(child);
      }
    });

    const contact = makeShadowDisc(Math.max(0.54, radius * 1.15), textures.contactShadowMap);
    g.add(visualGroup, contact);
    g.userData.isInteractiveProp = true;
    const stackLayer = pl.stackLayer ?? 0;
    const baseOffsetY = pl.baseOffsetY ?? 0;
    if (stackLayer === 0) {
      g.userData.snapCategory = 'pot';
    }

    const y = getSurfaceHeightAt(pl.x, pl.z) + baseOffsetY;
    g.position.set(pl.x, y, pl.z);

    props.push({
      mesh: g,
      visualGroup,
      hitMeshes,
      kind: pl.kind,
      shape,
      mass,
      restitution,
      friction,
      buoyancy,
      x: pl.x,
      y,
      z: pl.z,
      vx: 0,
      vy: 0,
      vz: 0,
      quat,
      angVel: new THREE.Vector3(),
      rotX: 0,
      rotZ: 0,
      rotVelX: 0,
      rotVelZ: 0,
      radius,
      halfExtentX,
      halfHeight,
      halfExtentZ,
      halfWidth,
      stackLayer,
      baseOffsetY,
      inWater: false,
      splashCooldown: 0,
    });
  });

  return props;
}

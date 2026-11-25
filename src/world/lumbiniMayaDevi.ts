import * as THREE from 'three';
import { createDetailedBrassSukundaDiyo, createDetailedGajurSpire } from './janakiMandirCraft';
import { BuddhaMaterials, createNativitySiddharthaStatue } from './lumbiniBuddhaSculpt';
import { LumbiniTextureSet } from './lumbiniTextures';
import { createWavingPoleBanner, createWavingPrayerFlagGarland } from './prayerFlags';

const _m4 = new THREE.Matrix4();
const _v3 = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _e = new THREE.Euler();

export interface MayaDeviBuildResult {
  group: THREE.Group;
  beaconLights: THREE.PointLight[];
  animatedNodes: THREE.Object3D[];
  cameraOccluders: THREE.Object3D[];
}

/**
 * Builds the true-to-life 2003 Maya Devi Temple sanctuary (36.0m x 24.0m) matching UNESCO Lumbini:
 * - White-painted brick outer masonry shell with solid lower walls & continuous 12x8 multi-pane clerestory band
 * - Flat white roof terrace with terracotta-red capped perimeter parapet piers, steel railings & Buddhist flags
 * - Central white skylight pavilion tower, hemispherical white dome & 13-ringed golden Chaitya spire (~15.6m tall)
 * - Sloped white South entrance ramp (8.0m) with golden Dharmachakra medallion railings
 * - Walkable interior timber-and-steel viewing boardwalk overlooking the 21-chamber Mauryan brick ruins,
 *   the bulletproof-glass-enclosed Marker Stone, and the illuminated 4th-c. Gupta Nativity Bas-Relief.
 */
export function buildMayaDeviTemple(
  lTex: LumbiniTextureSet,
  mats: {
    whiteBrickMat: THREE.Material;
    stuccoWhiteMat: THREE.Material;
    brickMat: THREE.Material;
    terracottaCapMat: THREE.Material;
    chunarStoneMat: THREE.Material;
    giltGoldMat: THREE.Material;
    warmBronzeMat: THREE.Material;
    darkMetalMat: THREE.Material;
    timberMat: THREE.Material;
    glassTintMat: THREE.Material;
    flameGlowMat: THREE.Material;
    heroMats: BuddhaMaterials;
  },
): MayaDeviBuildResult {
  const group = new THREE.Group();
  const beaconLights: THREE.PointLight[] = [];
  const animatedNodes: THREE.Object3D[] = [];
  const cameraOccluders: THREE.Object3D[] = [];

  const W = 36.0; // X span [-18.0, +18.0]
  const D = 24.0; // Z span [-12.0, +12.0]
  const wallT = 0.80;
  const wallH = 6.45; // Roof deck top
  const parapetH = 1.00; // Piers reach 7.45m
  const doorHalfW = 1.90; // 3.80m clear doorway
  const doorH = 3.85;

  // =========================================================================
  // 1. BRICK FOUNDATION APRON & SOLID WHITE-PAINTED BRICK OUTER WALLS
  // =========================================================================
  // Perimeter brick skirting apron (leaves sunken central pit clear)
  const skirtN = new THREE.Mesh(new THREE.BoxGeometry(W + 1.2, 0.44, 2.2), mats.brickMat);
  skirtN.position.set(0, 0.16, -D * 0.5 + 0.55);
  skirtN.receiveShadow = true;
  const skirtS = new THREE.Mesh(new THREE.BoxGeometry(W + 1.2, 0.44, 2.2), mats.brickMat);
  skirtS.position.set(0, 0.16, D * 0.5 - 0.55);
  skirtS.receiveShadow = true;
  const skirtW = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.44, D - 1.2), mats.brickMat);
  skirtW.position.set(-W * 0.5 + 0.55, 0.16, 0);
  skirtW.receiveShadow = true;
  const skirtE = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.44, D - 1.2), mats.brickMat);
  skirtE.position.set(W * 0.5 - 0.55, 0.16, 0);
  skirtE.receiveShadow = true;
  group.add(skirtN, skirtS, skirtW, skirtE);

  const addWall = (cx: number, cy: number, cz: number, sx: number, sy: number, sz: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mats.whiteBrickMat);
    m.position.set(cx, cy, cz);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    cameraOccluders.push(m);
    return m;
  };

  // Lower solid brick walls (y: 0.0 -> 4.25)
  const lowerH = 4.25;
  // North lower wall (full span)
  addWall(0, lowerH * 0.5, -D * 0.5 + wallT * 0.5, W, lowerH, wallT);
  // West & East lower walls (full span between N & S)
  addWall(-W * 0.5 + wallT * 0.5, lowerH * 0.5, 0, wallT, lowerH, D - wallT * 2);
  addWall(W * 0.5 - wallT * 0.5, lowerH * 0.5, 0, wallT, lowerH, D - wallT * 2);
  // South lower wall left & right of central entrance doorway + lintel header
  const sideSouthW = W * 0.5 - doorHalfW;
  addWall(-(doorHalfW + sideSouthW * 0.5), lowerH * 0.5, D * 0.5 - wallT * 0.5, sideSouthW, lowerH, wallT);
  addWall(doorHalfW + sideSouthW * 0.5, lowerH * 0.5, D * 0.5 - wallT * 0.5, sideSouthW, lowerH, wallT);
  // Upper lintel strip above doorway (y: doorH -> lowerH)
  addWall(0, (doorH + lowerH) * 0.5, D * 0.5 - wallT * 0.5, doorHalfW * 2, lowerH - doorH, wallT);

  // Dark charcoal steel entrance door frame & folded-open gates (real-life single dark rectangle opening)
  const frameDepth = wallT + 0.14;
  for (const side of [-1, 1]) {
    const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.16, doorH, frameDepth), mats.darkMetalMat);
    jamb.position.set(side * (doorHalfW - 0.05), doorH * 0.5, D * 0.5 - wallT * 0.5);
    group.add(jamb);
    // Open sliding grille/teak gate leaves tucked against inner jambs
    const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.12, doorH - 0.18, 1.35), mats.darkMetalMat);
    doorLeaf.position.set(side * (doorHalfW - 0.16), (doorH - 0.18) * 0.5 + 0.09, D * 0.5 - wallT - 0.72);
    group.add(doorLeaf);
  }
  const headFrame = new THREE.Mesh(new THREE.BoxGeometry(doorHalfW * 2 + 0.18, 0.18, frameDepth), mats.darkMetalMat);
  headFrame.position.set(0, doorH - 0.07, D * 0.5 - wallT * 0.5);
  group.add(headFrame);

  // Upper solid header beam above clerestory band (y: 5.65 -> 6.45)
  const headerBotY = 5.65;
  const headerH = wallH - headerBotY;
  addWall(0, headerBotY + headerH * 0.5, -D * 0.5 + wallT * 0.5, W, headerH, wallT);
  addWall(0, headerBotY + headerH * 0.5, D * 0.5 - wallT * 0.5, W, headerH, wallT);
  addWall(-W * 0.5 + wallT * 0.5, headerBotY + headerH * 0.5, 0, wallT, headerH, D - wallT * 2);
  addWall(W * 0.5 - wallT * 0.5, headerBotY + headerH * 0.5, 0, wallT, headerH, D - wallT * 2);

  // =========================================================================
  // 2. CONTINUOUS MULTI-PANE CLERESTORY WINDOW BAND (y: 4.25 -> 5.65)
  // =========================================================================
  // 12 window bays across South & North walls, 8 bays across West & East walls
  const winMidY = (lowerH + headerBotY) * 0.5;
  const winH = headerBotY - lowerH; // 1.40m
  const cornerW = 1.85;

  // 4 solid white-brick corner piers spanning the clerestory band
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addWall(
        sx * (W * 0.5 - cornerW * 0.5),
        winMidY,
        sz * (D * 0.5 - cornerW * 0.5),
        cornerW,
        winH,
        wallT,
      );
      if (wallT < cornerW) {
        addWall(
          sx * (W * 0.5 - wallT * 0.5),
          winMidY,
          sz * (D * 0.5 - cornerW * 0.5),
          wallT,
          winH,
          cornerW,
        );
      }
    }
  }

  // Build piers between window bays + recessed dark reflective glass + grey metal multi-pane mullions
  const windowGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x1c2733,
    roughness: 0.14,
    metalness: 0.25,
    clearcoat: 0.9,
    clearcoatRoughness: 0.08,
    side: THREE.DoubleSide,
  });
  const mullionTransforms: THREE.Matrix4[] = [];

  const buildClerestorySide = (
    axis: 'x' | 'z',
    coordFixed: number,
    spanTotal: number,
    bays: number,
  ) => {
    const innerSpan = spanTotal - cornerW * 2;
    const bayStep = innerSpan / bays;
    const pierW = 0.42;
    const winW = bayStep - pierW;

    // Continuous dark glass strip recessed inside the wall opening
    const glassLen = innerSpan;
    const glassGeo =
      axis === 'z'
        ? new THREE.BoxGeometry(glassLen, winH - 0.08, 0.08)
        : new THREE.BoxGeometry(0.08, winH - 0.08, glassLen);
    const glassMesh = new THREE.Mesh(glassGeo, windowGlassMat);
    glassMesh.position.set(axis === 'x' ? coordFixed : 0, winMidY, axis === 'z' ? coordFixed : 0);
    glassMesh.userData.nonCollidable = true;
    group.add(glassMesh);

    for (let b = 0; b <= bays; b++) {
      const along = -innerSpan * 0.5 + b * bayStep;
      if (b > 0 && b < bays) {
        if (axis === 'z') {
          addWall(along, winMidY, coordFixed, pierW, winH, wallT);
        } else {
          addWall(coordFixed, winMidY, along, wallT, winH, pierW);
        }
      }
      if (b < bays) {
        const winCenter = along + bayStep * 0.5;
        const outward = Math.sign(coordFixed) * (wallT * 0.5 - 0.10);
        // Outer metallic frame (top/bottom rails + 2 inner vertical mullions + 1 horizontal transom = 6 panes!)
        for (const hOff of [-winH * 0.44, 0, winH * 0.44]) {
          _v3.set(
            axis === 'z' ? winCenter : coordFixed + outward,
            winMidY + hOff,
            axis === 'z' ? coordFixed + outward : winCenter,
          );
          _q.setFromEuler(_e.set(0, axis === 'z' ? 0 : Math.PI * 0.5, 0));
          _s.set(winW, 0.065, 0.14);
          mullionTransforms.push(new THREE.Matrix4().compose(_v3, _q, _s));
        }
        for (const vOff of [-winW * 0.47, -winW * 0.16, winW * 0.16, winW * 0.47]) {
          _v3.set(
            axis === 'z' ? winCenter + vOff : coordFixed + outward,
            winMidY,
            axis === 'z' ? coordFixed + outward : winCenter + vOff,
          );
          _q.setFromEuler(_e.set(0, axis === 'z' ? 0 : Math.PI * 0.5, 0));
          _s.set(0.055, winH - 0.04, 0.14);
          mullionTransforms.push(new THREE.Matrix4().compose(_v3, _q, _s));
        }
      }
    }
  };

  buildClerestorySide('z', D * 0.5 - wallT * 0.5, W, 12);
  buildClerestorySide('z', -D * 0.5 + wallT * 0.5, W, 12);
  buildClerestorySide('x', -W * 0.5 + wallT * 0.5, D, 8);
  buildClerestorySide('x', W * 0.5 - wallT * 0.5, D, 8);

  const unitBoxGeo = new THREE.BoxGeometry(1, 1, 1);
  const mullionInst = new THREE.InstancedMesh(unitBoxGeo, mats.darkMetalMat, mullionTransforms.length);
  mullionTransforms.forEach((m, idx) => mullionInst.setMatrixAt(idx, m));
  mullionInst.instanceMatrix.needsUpdate = true;
  mullionInst.computeBoundingSphere();
  mullionInst.userData.nonCollidable = true;
  group.add(mullionInst);

  // =========================================================================
  // 3. FLAT ROOF DECK WITH CENTRAL SKYLIGHT WELL & TERRACOTTA-CAPPED PARAPETS
  // =========================================================================
  const skyHoleW = 9.0;
  const skyHoleD = 7.0;
  const roofThickness = 0.38;
  const roofY = wallH - roofThickness * 0.5;
  const addRoofSlab = (cx: number, cz: number, sx: number, sz: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, roofThickness, sz), mats.stuccoWhiteMat);
    m.position.set(cx, roofY, cz);
    m.castShadow = true;
    m.receiveShadow = true;
    m.userData.nonCollidable = true;
    group.add(m);
    cameraOccluders.push(m);
  };
  // 4 roof slabs framing central skylight opening
  const sideRoofX = (W - skyHoleW) * 0.5;
  const sideRoofZ = (D - skyHoleD) * 0.5;
  addRoofSlab(0, -(skyHoleD * 0.5 + sideRoofZ * 0.5), W, sideRoofZ);
  addRoofSlab(0, skyHoleD * 0.5 + sideRoofZ * 0.5, W, sideRoofZ);
  addRoofSlab(-(skyHoleW * 0.5 + sideRoofX * 0.5), 0, sideRoofX, skyHoleD);
  addRoofSlab(skyHoleW * 0.5 + sideRoofX * 0.5, 0, sideRoofX, skyHoleD);

  // Low continuous perimeter parapet curb + evenly spaced piers with signature terracotta-red caps
  const curbH = 0.24;
  const pierTransforms: THREE.Matrix4[] = [];
  const capTransforms: THREE.Matrix4[] = [];
  const railTransforms: THREE.Matrix4[] = [];

  const addParapetEdge = (axis: 'x' | 'z', fixedCoord: number, length: number, divisions: number) => {
    const curb = new THREE.Mesh(
      axis === 'z'
        ? new THREE.BoxGeometry(length, curbH, wallT * 0.85)
        : new THREE.BoxGeometry(wallT * 0.85, curbH, length),
      mats.whiteBrickMat,
    );
    curb.position.set(axis === 'x' ? fixedCoord : 0, wallH + curbH * 0.5, axis === 'z' ? fixedCoord : 0);
    curb.userData.nonCollidable = true;
    group.add(curb);

    // 2 slim horizontal steel guardrails between piers
    for (const ry of [wallH + 0.44, wallH + 0.68]) {
      _v3.set(axis === 'x' ? fixedCoord : 0, ry, axis === 'z' ? fixedCoord : 0);
      _q.setFromEuler(_e.set(0, axis === 'z' ? 0 : Math.PI * 0.5, 0));
      _s.set(length - 0.4, 0.036, 0.036);
      railTransforms.push(new THREE.Matrix4().compose(_v3, _q, _s));
    }

    for (let i = 0; i <= divisions; i++) {
      // Skip corners on X-edges so corners aren't duplicated
      if (axis === 'x' && (i === 0 || i === divisions)) continue;
      const along = -length * 0.5 + 0.36 + (i / divisions) * (length - 0.72);
      const px = axis === 'z' ? along : fixedCoord;
      const pz = axis === 'z' ? fixedCoord : along;
      const isCorner = axis === 'z' && (i === 0 || i === divisions);
      const pw = isCorner ? 0.92 : 0.62;
      const ph = isCorner ? parapetH + 0.14 : parapetH;

      _v3.set(px, wallH + ph * 0.5, pz);
      _q.identity();
      _s.set(pw, ph, pw);
      pierTransforms.push(new THREE.Matrix4().compose(_v3, _q, _s));

      _v3.set(px, wallH + ph + 0.055, pz);
      _s.set(pw + 0.08, 0.11, pw + 0.08);
      capTransforms.push(new THREE.Matrix4().compose(_v3, _q, _s));
    }
  };

  addParapetEdge('z', D * 0.5 - wallT * 0.5, W, 12);
  addParapetEdge('z', -D * 0.5 + wallT * 0.5, W, 12);
  addParapetEdge('x', -W * 0.5 + wallT * 0.5, D, 8);
  addParapetEdge('x', W * 0.5 - wallT * 0.5, D, 8);

  const piersInst = new THREE.InstancedMesh(unitBoxGeo, mats.whiteBrickMat, pierTransforms.length);
  pierTransforms.forEach((m, idx) => piersInst.setMatrixAt(idx, m));
  piersInst.instanceMatrix.needsUpdate = true;
  piersInst.computeBoundingSphere();
  piersInst.castShadow = true;
  piersInst.userData.nonCollidable = true;

  const capsInst = new THREE.InstancedMesh(unitBoxGeo, mats.terracottaCapMat, capTransforms.length);
  capTransforms.forEach((m, idx) => capsInst.setMatrixAt(idx, m));
  capsInst.instanceMatrix.needsUpdate = true;
  capsInst.computeBoundingSphere();
  capsInst.userData.nonCollidable = true;

  const railsInst = new THREE.InstancedMesh(unitBoxGeo, mats.darkMetalMat, railTransforms.length);
  railTransforms.forEach((m, idx) => railsInst.setMatrixAt(idx, m));
  railsInst.instanceMatrix.needsUpdate = true;
  railsInst.computeBoundingSphere();
  railsInst.userData.nonCollidable = true;
  group.add(piersInst, capsInst, railsInst);

  // Corner Tall Poles flying 5-color billowing Buddhist Lungta Flags (wind-reactive cloth, zero spin!)
  const cornerMasts: Array<[number, number, number]> = [
    [-W * 0.5 + 0.45, D * 0.5 - 0.45, 0.25],
    [W * 0.5 - 0.45, D * 0.5 - 0.45, -0.35],
    [-W * 0.5 + 0.45, -D * 0.5 + 0.45, 0.45],
    [W * 0.5 - 0.45, -D * 0.5 + 0.45, -0.22],
  ];
  for (const [fx, fz, rot] of cornerMasts) {
    const banner = createWavingPoleBanner({
      height: 2.38,
      bannerWidth: 0.88,
      bannerHeight: 0.60,
      baseYaw: rot,
      poleMaterial: mats.darkMetalMat,
      finialMaterial: mats.giltGoldMat,
    });
    banner.group.position.set(fx, wallH + parapetH + 0.14, fz);
    group.add(banner.group);
    animatedNodes.push(banner.clothMesh);
  }

  // =========================================================================
  // 4. CENTRAL ROOFTOP CLERESTORY PAVILION, WHITE DOME & GOLDEN CHAITYA SPIRE
  // =========================================================================
  const pavGroup = new THREE.Group();
  pavGroup.position.set(0, wallH, 0);
  pavGroup.userData.nonCollidable = true;
  const pW = 10.4;
  const pD = 8.4;
  const pH = 3.25;

  // Vertical corner & intermediate white stucco pilasters + terracotta roof cornice + skylight clerestory
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.68, pH, 0.68), mats.stuccoWhiteMat);
      col.position.set(sx * (pW * 0.5 - 0.34), pH * 0.5, sz * (pD * 0.5 - 0.34));
      col.castShadow = true;
      pavGroup.add(col);
    }
  }
  for (const sz of [-1, 1]) {
    const zCoord = sz * (pD * 0.5 - 0.28);
    const baseWall = new THREE.Mesh(new THREE.BoxGeometry(pW - 0.4, 0.88, 0.42), mats.stuccoWhiteMat);
    baseWall.position.set(0, 0.44, zCoord);
    const topLintel = new THREE.Mesh(new THREE.BoxGeometry(pW + 0.22, 0.46, 0.52), mats.stuccoWhiteMat);
    topLintel.position.set(0, pH - 0.23, zCoord);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(pW - 1.3, pH - 1.35, 0.08), windowGlassMat);
    glass.position.set(0, 0.88 + (pH - 1.35) * 0.5, zCoord);
    pavGroup.add(baseWall, topLintel, glass);
    for (const px of [-1.85, 1.85]) {
      const pil = new THREE.Mesh(new THREE.BoxGeometry(0.42, pH - 0.4, 0.48), mats.stuccoWhiteMat);
      pil.position.set(px, pH * 0.5, zCoord);
      pavGroup.add(pil);
    }
  }
  for (const sx of [-1, 1]) {
    const xCoord = sx * (pW * 0.5 - 0.28);
    const baseWall = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.88, pD - 0.4), mats.stuccoWhiteMat);
    baseWall.position.set(xCoord, 0.44, 0);
    const topLintel = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.46, pD + 0.22), mats.stuccoWhiteMat);
    topLintel.position.set(xCoord, pH - 0.23, 0);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.08, pH - 1.35, pD - 1.3), windowGlassMat);
    glass.position.set(xCoord, 0.88 + (pH - 1.35) * 0.5, 0);
    pavGroup.add(baseWall, topLintel, glass);
    for (const pz of [-1.45, 1.45]) {
      const pil = new THREE.Mesh(new THREE.BoxGeometry(0.48, pH - 0.4, 0.42), mats.stuccoWhiteMat);
      pil.position.set(xCoord, pH * 0.5, pz);
      pavGroup.add(pil);
    }
  }

  // Pavilion roof cap + terracotta fascia trim + hemispherical white dome + golden Nepali Gajur Chaitya spire
  const pavCap = new THREE.Mesh(new THREE.BoxGeometry(pW + 0.54, 0.28, pD + 0.54), mats.stuccoWhiteMat);
  pavCap.position.y = pH + 0.14;
  pavCap.castShadow = true;
  const pavTrim = new THREE.Mesh(new THREE.BoxGeometry(pW + 0.58, 0.12, pD + 0.58), mats.terracottaCapMat);
  pavTrim.position.y = pH + 0.30;
  const domeBase = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 2.55, 0.40, 28), mats.stuccoWhiteMat);
  domeBase.position.y = pH + 0.54;
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(2.26, 32, 18, 0, Math.PI * 2, 0, Math.PI * 0.54),
    mats.stuccoWhiteMat,
  );
  dome.position.y = pH + 0.62;
  dome.castShadow = true;

  // Square golden Harmika plinth + stepped 13-ring Chaitya Gajur spire (~15.6m peak!)
  const harmika = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.56, 1.48), mats.giltGoldMat);
  harmika.position.y = pH + 2.98;
  harmika.castShadow = true;
  const spire = createDetailedGajurSpire(mats.giltGoldMat, mats.warmBronzeMat, 2.25);
  spire.position.y = pH + 3.26;
  pavGroup.add(pavCap, pavTrim, domeBase, dome, harmika, spire);
  group.add(pavGroup);

  // Diagonal 5-color Lungta prayer-flag garlands radiating from Chaitya pavilion corners to roof masts
  for (const [fx, fz] of cornerMasts) {
    const sx = Math.sign(fx);
    const sz = Math.sign(fz);
    const startPt = new THREE.Vector3(
      sx * (pW * 0.5 - 0.34),
      wallH + pH - 0.12,
      sz * (pD * 0.5 - 0.34),
    );
    const endPt = new THREE.Vector3(fx, wallH + parapetH + 2.25, fz);
    const roofGarland = createWavingPrayerFlagGarland(startPt, endPt, {
      flagCount: 8,
      flagWidth: 0.34,
      flagHeight: 0.44,
      sag: 0.55,
      includePoles: false,
    });
    roofGarland.group.userData.nonCollidable = true;
    group.add(roofGarland.group);
  }

  // =========================================================================
  // 5. SLOPED WHITE SOUTH ENTRANCE RAMP (8.0m) & GOLDEN DHARMACHAKRA RAILINGS
  // =========================================================================
  // Rises from tz = +20.0 (local y = 0.10 flush with outer brick promenade) up to tz = +12.0 (y = 1.00 doorway deck)
  const rampZStart = D * 0.5 + 8.0; // +20.0 (garden ldz = -2.0)
  const rampZEnd = D * 0.5; // +12.0 (garden ldz = -10.0)
  const rampSpanZ = rampZStart - rampZEnd; // 8.0m
  const rampYStart = 0.10;
  const rampYEnd = 1.00;
  const rampShape = new THREE.Shape();
  rampShape.moveTo(-rampZStart, -0.10);
  rampShape.lineTo(-rampZEnd, -0.10);
  rampShape.lineTo(-rampZEnd, rampYEnd);
  rampShape.lineTo(-rampZStart, rampYStart);
  rampShape.closePath();

  const rampGeo = new THREE.ExtrudeGeometry(rampShape, {
    depth: doorHalfW * 2 + 0.48,
    bevelEnabled: false,
  });
  rampGeo.translate(0, 0, -(doorHalfW + 0.24));
  rampGeo.rotateY(-Math.PI * 0.5);
  rampGeo.computeVertexNormals();
  const rampMesh = new THREE.Mesh(rampGeo, mats.stuccoWhiteMat);
  rampMesh.castShadow = true;
  rampMesh.receiveShadow = true;
  group.add(rampMesh);

  // Signature sloped white railings with 7 golden Dharmachakra Wheel medallions on each side of ramp
  const rampAngle = Math.atan2(rampYEnd - rampYStart, rampSpanZ);
  const rampHyp = Math.hypot(rampSpanZ, rampYEnd - rampYStart);
  for (const side of [-1, 1]) {
    const rx = side * (doorHalfW + 0.16);
    for (let p = 0; p <= 7; p++) {
      const t = p / 7;
      const pz = THREE.MathUtils.lerp(rampZStart, rampZEnd, t);
      const py = THREE.MathUtils.lerp(rampYStart, rampYEnd, t);
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.96, 0.12), mats.stuccoWhiteMat);
      post.position.set(rx, py + 0.48, pz);
      post.castShadow = true;
      group.add(post);
      if (p < 7) {
        const midZ = THREE.MathUtils.lerp(rampZStart, rampZEnd, (p + 0.5) / 7);
        const midY = THREE.MathUtils.lerp(rampYStart, rampYEnd, (p + 0.5) / 7);
        const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.036, 8, 18), mats.giltGoldMat);
        wheel.rotation.y = Math.PI * 0.5;
        wheel.position.set(rx, midY + 0.48, midZ);
        group.add(wheel);
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.065, 12), mats.giltGoldMat);
        hub.rotation.z = Math.PI * 0.5;
        hub.position.set(rx, midY + 0.48, midZ);
        group.add(hub);
      }
    }
    const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.09, rampHyp + 0.16), mats.stuccoWhiteMat);
    topRail.position.set(rx, (rampYStart + rampYEnd) * 0.5 + 0.94, (rampZStart + rampZEnd) * 0.5);
    topRail.rotation.x = rampAngle;
    group.add(topRail);
  }

  // =========================================================================
  // 6. WALKABLE INTERIOR ARCHAEOLOGICAL GALLERY & SUNKEN MAURYAN RUINS
  // =========================================================================
  // Sunken excavation pit floor slab (y = -0.35 -> world -0.10m)
  const pitFloor = new THREE.Mesh(
    new THREE.BoxGeometry(W - wallT * 2, 0.16, D - wallT * 2),
    mats.brickMat,
  );
  pitFloor.position.set(0, -0.43, 0);
  pitFloor.receiveShadow = true;
  group.add(pitFloor);

  // Suspended Planked Timber & Steel Boardwalk Loop at y = 1.00m (clear inner pit: |x|<=9.0, |z|<=5.6)
  const pitHalfW = 9.0;
  const pitHalfD = 5.6;
  const walkY = 1.00;
  const deckMat = new THREE.MeshStandardMaterial({
    color: 0x6f4a2e,
    roughness: 0.78,
    metalness: 0.05,
  });
  const addBoardwalkSlab = (cx: number, cz: number, sx: number, sz: number) => {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.18, sz), deckMat);
    slab.position.set(cx, walkY - 0.09, cz);
    slab.receiveShadow = true;
    slab.castShadow = true;
    group.add(slab);
    const beam = new THREE.Mesh(new THREE.BoxGeometry(sx - 0.1, 0.14, sz - 0.1), mats.darkMetalMat);
    beam.position.set(cx, walkY - 0.25, cz);
    group.add(beam);
  };
  const innerSpanW = W - wallT * 2;
  const innerSpanD = D - wallT * 2;
  const aisleX = innerSpanW * 0.5 - pitHalfW; // 8.20m wide east & west galleries
  const aisleZ = innerSpanD * 0.5 - pitHalfD; // 5.60m wide north & south galleries
  addBoardwalkSlab(0, -(pitHalfD + aisleZ * 0.5), innerSpanW, aisleZ);
  addBoardwalkSlab(0, pitHalfD + aisleZ * 0.5, innerSpanW, aisleZ);
  addBoardwalkSlab(-(pitHalfW + aisleX * 0.5), 0, aisleX, pitHalfD * 2);
  addBoardwalkSlab(pitHalfW + aisleX * 0.5, 0, aisleX, pitHalfD * 2);

  // Steel support piers beneath boardwalk + interior viewing balustrade around sunken pit
  for (const px of [-pitHalfW, 0, pitHalfW]) {
    for (const pz of [-pitHalfD, 0, pitHalfD]) {
      if (px === 0 && pz === 0) continue;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.35, 10), mats.darkMetalMat);
      col.position.set(px, 0.30, pz);
      group.add(col);
    }
  }
  const railHeight = 0.88;
  for (const [cx, cz, sx, sz] of [
    [0, -pitHalfD, pitHalfW * 2, 0.12],
    [0, pitHalfD, pitHalfW * 2, 0.12],
    [-pitHalfW, 0, 0.12, pitHalfD * 2],
    [pitHalfW, 0, 0.12, pitHalfD * 2],
  ] as Array<[number, number, number, number]>) {
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.08, sz), mats.warmBronzeMat);
    topBar.position.set(cx, walkY + railHeight, cz);
    const glassPanel = new THREE.Mesh(
      new THREE.BoxGeometry(sx > 0.5 ? sx : 0.04, railHeight - 0.12, sz > 0.5 ? sz : 0.04),
      windowGlassMat,
    );
    glassPanel.position.set(cx, walkY + railHeight * 0.5, cz);
    glassPanel.userData.nonCollidable = true;
    group.add(topBar, glassPanel);
  }

  // Sunken 21-Chamber Mauryan / Ashokan Brick Ruins inside the pit (y: -0.35 -> +0.58)
  const ruinWalls: THREE.Matrix4[] = [];
  for (let gx = -7.2; gx <= 7.21; gx += 2.4) {
    _v3.set(gx, 0.06, 0);
    _q.identity();
    _s.set(0.42, 0.86, 9.6);
    ruinWalls.push(new THREE.Matrix4().compose(_v3, _q, _s));
  }
  for (let gz = -4.2; gz <= 4.21; gz += 2.1) {
    _v3.set(0, 0.02, gz);
    _q.identity();
    _s.set(15.2, 0.78, 0.42);
    ruinWalls.push(new THREE.Matrix4().compose(_v3, _q, _s));
  }
  const ruinInst = new THREE.InstancedMesh(unitBoxGeo, mats.brickMat, ruinWalls.length);
  ruinWalls.forEach((m, idx) => ruinInst.setMatrixAt(idx, m));
  ruinInst.instanceMatrix.needsUpdate = true;
  ruinInst.computeBoundingSphere();
  ruinInst.castShadow = true;
  ruinInst.receiveShadow = true;
  group.add(ruinInst);

  // Sacred Marker Stone (conglomerate stone slab under bulletproof glass shrine in pit center!)
  const markerPlinth = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.52, 2.2), mats.brickMat);
  markerPlinth.position.set(0, -0.09, 0);
  const markerStone = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.16, 0.64), mats.chunarStoneMat);
  markerStone.position.set(0, 0.24, 0);
  const caseGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0xd9f2ff,
    transparent: true,
    opacity: 0.34,
    roughness: 0.08,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });
  const glassCase = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.96, 1.55), caseGlassMat);
  glassCase.position.set(0, 0.62, 0);
  glassCase.userData.nonCollidable = true;
  const caseFrame = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.09, 1.64), mats.giltGoldMat);
  caseFrame.position.set(0, 1.10, 0);
  caseFrame.userData.nonCollidable = true;
  group.add(markerPlinth, markerStone, glassCase, caseFrame);

  // 4th-c. Gupta Nativity Bas-Relief Shrine Stele & Baby Siddhartha + Brass Butter Lamps on North Sanctum Edge
  const reliefAltar = new THREE.Group();
  reliefAltar.position.set(0, 0.05, -3.8);
  reliefAltar.scale.setScalar(1.18);
  const altarPlinth = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.65, 1.2), mats.brickMat);
  altarPlinth.position.y = 0.22;
  const reliefBacking = new THREE.Mesh(new THREE.BoxGeometry(1.85, 2.25, 0.24), mats.chunarStoneMat);
  reliefBacking.position.set(0, 1.66, -0.22);
  const reliefFaceMat = new THREE.MeshStandardMaterial({
    map: lTex.nativityReliefMap,
    normalMap: lTex.nativityReliefNormal,
    normalScale: new THREE.Vector2(1.4, 1.4),
    roughness: 0.72,
  });
  const reliefPanel = new THREE.Mesh(new THREE.PlaneGeometry(1.58, 1.98), reliefFaceMat);
  reliefPanel.position.set(0, 1.66, -0.09);

  const innerSiddhartha = createNativitySiddharthaStatue(mats.giltGoldMat, mats.chunarStoneMat);
  innerSiddhartha.position.set(0, 0.55, 0.28);
  innerSiddhartha.scale.setScalar(0.84);

  const diyoL = createDetailedBrassSukundaDiyo(mats.giltGoldMat, mats.warmBronzeMat, mats.flameGlowMat, 0.65, true);
  diyoL.position.set(-1.12, 0.55, 0.26);
  const diyoR = createDetailedBrassSukundaDiyo(mats.giltGoldMat, mats.warmBronzeMat, mats.flameGlowMat, 0.65, true);
  diyoR.position.set(1.12, 0.55, 0.26);
  reliefAltar.add(altarPlinth, reliefBacking, reliefPanel, innerSiddhartha, diyoL, diyoR);
  group.add(reliefAltar);

  // Warm Architectural Sanctuary Spotlight illuminating the Marker Stone & sunken Mauryan ruins
  const sanctumLight = new THREE.PointLight(0xffcf87, 3.8, 24, 1.2);
  sanctumLight.position.set(0, 5.4, -0.6);
  beaconLights.push(sanctumLight);
  group.add(sanctumLight);

  return { group, beaconLights, animatedNodes, cameraOccluders };
}

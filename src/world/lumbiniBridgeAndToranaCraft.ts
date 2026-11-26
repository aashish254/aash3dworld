import * as THREE from 'three';
import {
  getLumbiniGardenCraftMaterials,
  makeWorldUvBoxGeo,
} from './lumbiniGardenCraft';
import { createCarvedLotusPetalGeometry, createTaperedLimbGeometry } from './mayaDeviSculptureGeo';
import { LUMBINI_SACRED_POND } from './worldLogic';

/**
 * Creates a solid beveled spiral volute scroll geometry (Sanchi/Lumbini Torana architrave terminal)
 * instead of a hollow floating torus ring.
 */
function createSpiralVoluteGeo(outerR: number, depth: number, signX: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const turns = 1.65;
  const steps = 36;
  const outerPts: Array<[number, number]> = [];
  const innerPts: Array<[number, number]> = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const ang = t * Math.PI * 2 * turns;
    const rOut = outerR * (1 - t * 0.72);
    const thick = outerR * (0.28 - t * 0.14);
    const rIn = Math.max(0.02, rOut - thick);
    const cx = Math.cos(ang) * signX;
    const cy = Math.sin(ang);
    outerPts.push([cx * rOut, cy * rOut]);
    innerPts.push([cx * rIn, cy * rIn]);
  }

  shape.moveTo(outerPts[0][0], outerPts[0][1]);
  for (let i = 1; i < outerPts.length; i++) {
    shape.lineTo(outerPts[i][0], outerPts[i][1]);
  }
  for (let i = innerPts.length - 1; i >= 0; i--) {
    shape.lineTo(innerPts[i][0], innerPts[i][1]);
  }
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.014,
    bevelSize: 0.012,
    bevelSegments: 2,
    curveSegments: 10,
  });
  geo.translate(0, 0, -depth * 0.5);
  return geo;
}

/**
 * Creates a chamfered architectural pier shaft cross-section (square with 45-deg corners & slight entasis taper).
 */
function createChamferedPierGeo(width: number, height: number, chamfer: number): THREE.BufferGeometry {
  const hw = width * 0.5;
  const c = Math.min(chamfer, hw * 0.45);
  const s = new THREE.Shape();
  s.moveTo(-hw + c, -hw);
  s.lineTo(hw - c, -hw);
  s.lineTo(hw, -hw + c);
  s.lineTo(hw, hw - c);
  s.lineTo(hw - c, hw);
  s.lineTo(-hw + c, hw);
  s.lineTo(-hw, hw - c);
  s.lineTo(-hw, -hw + c);
  s.closePath();

  const geo = new THREE.ExtrudeGeometry(s, {
    depth: height,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.014,
    bevelSegments: 2,
  });
  geo.rotateX(-Math.PI / 2);
  // Assign clean world-scale UVs so stone masonry grain stays crisp
  const pos = geo.getAttribute('position');
  const norm = geo.getAttribute('normal');
  const uv = geo.getAttribute('uv');
  if (uv && norm) {
    for (let i = 0; i < pos.count; i++) {
      const nx = Math.abs(norm.getX(i));
      const ny = Math.abs(norm.getY(i));
      if (ny > 0.6) {
        uv.setXY(i, pos.getX(i) * 0.45, pos.getZ(i) * 0.45);
      } else if (nx > 0.5) {
        uv.setXY(i, pos.getZ(i) * 0.45, pos.getY(i) * 0.35);
      } else {
        uv.setXY(i, pos.getX(i) * 0.45, pos.getY(i) * 0.35);
      }
    }
    uv.needsUpdate = true;
  }
  return geo;
}

/**
 * Creates a scrolled S-bracket stone corbel tucked underneath Torana capitals (zero protruding sticks).
 */
function createScrolledCorbelGeo(reach: number, drop: number, thickness: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(reach, 0);
  shape.lineTo(reach, -0.08);
  shape.bezierCurveTo(reach * 0.72, -0.10, reach * 0.55, -drop * 0.45, reach * 0.42, -drop * 0.58);
  shape.bezierCurveTo(reach * 0.24, -drop * 0.75, 0.14, -drop * 0.85, 0.08, -drop);
  shape.lineTo(0, -drop);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.014,
    bevelSegments: 2,
    curveSegments: 10,
  });
  geo.translate(0, 0, -thickness * 0.5);
  return geo;
}

/**
 * Creates a gently cambered (bowed) Sanchi-style stone architrave lintel spanning [-halfW, +halfW].
 */
function createCamberedArchitraveGeo(
  width: number,
  height: number,
  depth: number,
  camber: number,
  segs = 20,
): THREE.BufferGeometry {
  const hw = width * 0.5;
  const hh = height * 0.5;
  const shape = new THREE.Shape();

  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const x = THREE.MathUtils.lerp(-hw, hw, t);
    const archY = Math.sin(t * Math.PI) * camber + hh;
    if (i === 0) shape.moveTo(x, archY);
    else shape.lineTo(x, archY);
  }
  for (let i = segs; i >= 0; i--) {
    const t = i / segs;
    const x = THREE.MathUtils.lerp(-hw, hw, t);
    const archY = Math.sin(t * Math.PI) * camber - hh;
    shape.lineTo(x, archY);
  }
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.016,
    bevelSize: 0.014,
    bevelSegments: 2,
    curveSegments: 8,
  });
  geo.translate(0, 0, -depth * 0.5);
  return geo;
}

/**
 * Builds an anatomically sculpted kneeling deer (Mrigadava) facing inward (-side * X).
 */
function createSculptedKneelingDeer(
  side: number,
  stoneMat: THREE.Material,
  bronzeMat: THREE.Material,
  brassMat: THREE.Material,
): THREE.Group {
  const deer = new THREE.Group();
  // Stepped carved lotus plinth
  const plinth = new THREE.Mesh(makeWorldUvBoxGeo(0.56, 0.09, 0.34, 1.4, 1.4), stoneMat);
  plinth.position.y = 0.045;
  plinth.castShadow = true;
  const trim = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.035, 0.28), bronzeMat);
  trim.position.y = 0.105;
  deer.add(plinth, trim);

  // Sculpted torso silhouette (chest + arched back + tucked rump)
  const torsoCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(side * 0.16, 0.21, 0),
    new THREE.Vector3(side * 0.04, 0.24, 0),
    new THREE.Vector3(-side * 0.12, 0.25, 0),
  ]);
  const torso = new THREE.Mesh(
    createTaperedLimbGeometry(torsoCurve, (t) => 0.072 + Math.sin(t * Math.PI) * 0.022, 10, 12),
    brassMat,
  );
  torso.castShadow = true;

  // Folded hind haunch & tucked foreleg resting cleanly on plinth
  const hindLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.038, 0.12, 5, 8), brassMat);
  hindLeg.rotation.z = Math.PI * 0.44;
  hindLeg.position.set(side * 0.10, 0.15, 0.055);
  const hindLegBack = hindLeg.clone();
  hindLegBack.position.z = -0.055;

  const foreLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.024, 0.13, 5, 8), brassMat);
  foreLeg.rotation.z = side * 1.35;
  foreLeg.position.set(-side * 0.14, 0.145, 0.045);
  const foreLegBack = foreLeg.clone();
  foreLegBack.position.z = -0.045;

  // Graceful arched neck & sculpted head/snout gazing toward Dharmachakra
  const neckCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-side * 0.11, 0.25, 0),
    new THREE.Vector3(-side * 0.15, 0.35, 0),
    new THREE.Vector3(-side * 0.17, 0.44, 0),
  ]);
  const neck = new THREE.Mesh(
    createTaperedLimbGeometry(neckCurve, (t) => 0.052 - t * 0.018, 8, 10),
    brassMat,
  );
  neck.castShadow = true;

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 8), brassMat);
  skull.scale.set(1.25, 0.92, 0.85);
  skull.position.set(-side * 0.19, 0.46, 0);

  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.085, 8), brassMat);
  snout.rotation.z = side * Math.PI * 0.55;
  snout.position.set(-side * 0.245, 0.448, 0);

  // Swept ears & curved bronze antlers
  for (const ez of [-0.032, 0.032]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.065, 6), brassMat);
    ear.position.set(-side * 0.165, 0.50, ez * 1.1);
    ear.rotation.z = side * 0.45;
    ear.rotation.x = ez > 0 ? 0.35 : -0.35;

    const antlerCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-side * 0.175, 0.495, ez * 0.7),
      new THREE.Vector3(-side * 0.13, 0.565, ez * 1.1),
      new THREE.Vector3(-side * 0.155, 0.625, ez * 1.25),
    ]);
    const antler = new THREE.Mesh(
      createTaperedLimbGeometry(antlerCurve, (t) => 0.009 * (1 - t * 0.55), 8, 6),
      bronzeMat,
    );
    const tine = new THREE.Mesh(new THREE.ConeGeometry(0.007, 0.05, 5), bronzeMat);
    tine.position.set(-side * 0.17, 0.575, ez * 1.12);
    tine.rotation.z = side * 0.35;
    deer.add(ear, antler, tine);
  }

  deer.add(torso, hindLeg, hindLegBack, foreLeg, foreLegBack, neck, skull, snout);
  return deer;
}

/**
 * Builds an authentic, museum-grade carved Chunar sandstone & weathered bronze
 * Sanchi/Lumbini Dharmachakra Torana ceremonial archway:
 * - Zero protruding cylinder "stems"
 * - Chamfered multi-tiered piers with carved lotus medallions & recessed relief bands
 * - Fluted Mauryan bell-lotus capitals & tucked scrolled stone console corbels
 * - Triple gently cambered sculpted architraves with carved spiral volute terminals & bronze bells
 * - 24-spoke carved bronze/brass Dharmachakra with lotus hub & sculpted kneeling deer
 */
export function buildMuseumToranaGate(
  stoneMat: THREE.Material,
  brickMat: THREE.Material,
  _goldMat: THREE.Material,
  bronzeMat: THREE.Material,
): THREE.Group {
  const g = new THREE.Group();
  const craftMats = getLumbiniGardenCraftMaterials();
  const basaltMat = craftMats.basaltMat;
  const weatheredMat = craftMats.weatheredSandstoneMat;
  // Satin antiqued brass (warm metallic glint without blinding bloom washout)
  const antiqueBrassMat = craftMats.giltBrassMat;

  const carvedPetalGeo = createCarvedLotusPetalGeometry(0.095, 0.16, 0.028);
  const finialGeo = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.14, 0.0),
      new THREE.Vector2(0.11, 0.045),
      new THREE.Vector2(0.165, 0.11),
      new THREE.Vector2(0.155, 0.175),
      new THREE.Vector2(0.082, 0.24),
      new THREE.Vector2(0.11, 0.285),
      new THREE.Vector2(0.052, 0.35),
      new THREE.Vector2(0.022, 0.44),
      new THREE.Vector2(0.0, 0.50),
    ],
    16,
  );
  const bellCapGeo = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.32, 0.0),
      new THREE.Vector2(0.41, 0.07),
      new THREE.Vector2(0.36, 0.16),
      new THREE.Vector2(0.29, 0.24),
      new THREE.Vector2(0.33, 0.28),
      new THREE.Vector2(0.0, 0.28),
    ],
    16,
  );

  const innerCorbelGeo = createScrolledCorbelGeo(0.95, 0.62, 0.28);
  const outerCorbelGeo = createScrolledCorbelGeo(0.44, 0.38, 0.26);

  // 1. Twin Monumental Chamfered Pier Columns (px = +-3.55 -> wide 6.1m clear pilgrim span)
  for (const side of [-1, 1]) {
    const px = side * 3.55;

    // Stepped Mauryan brick & dark basalt podium foundation
    const baseBrick = new THREE.Mesh(makeWorldUvBoxGeo(1.44, 0.26, 1.44, 3.2, 1.6), brickMat);
    baseBrick.position.set(px, 0.13, 0);
    baseBrick.castShadow = true;
    baseBrick.receiveShadow = true;

    const basaltStep = new THREE.Mesh(makeWorldUvBoxGeo(1.26, 0.16, 1.26, 2.0, 1.0), basaltMat);
    basaltStep.position.set(px, 0.34, 0);
    basaltStep.castShadow = true;
    basaltStep.receiveShadow = true;

    const kumbhaPlinth = new THREE.Mesh(makeWorldUvBoxGeo(1.08, 0.22, 1.08, 2.4, 1.2), stoneMat);
    kumbhaPlinth.position.set(px, 0.53, 0);
    kumbhaPlinth.castShadow = true;

    const dadoBlock = new THREE.Mesh(makeWorldUvBoxGeo(0.90, 0.34, 0.90, 2.2, 1.2), weatheredMat);
    dadoBlock.position.set(px, 0.81, 0);
    dadoBlock.castShadow = true;

    // Recessed dado stone niche panels on front & back faces
    for (const fz of [-0.46, 0.46]) {
      const dadoNiche = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.22, 0.03), basaltMat);
      dadoNiche.position.set(px, 0.81, fz);
      const dadoBoss = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.04, 12), antiqueBrassMat);
      dadoBoss.rotation.x = Math.PI / 2;
      dadoBoss.position.set(px, 0.81, fz + Math.sign(fz) * 0.015);
      g.add(dadoNiche, dadoBoss);
    }

    // Chamfered main pier shaft (y = 0.98 .. 4.32)
    const shaft = new THREE.Mesh(createChamferedPierGeo(0.68, 3.34, 0.11), stoneMat);
    shaft.position.set(px, 0.98, 0);
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    g.add(baseBrick, basaltStep, kumbhaPlinth, dadoBlock, shaft);

    // 4 Corner Vertical Colonnette Ribs for crisp architectural edge shadow lines
    for (const cx of [-0.28, 0.28]) {
      for (const cz of [-0.28, 0.28]) {
        const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.036, 3.24, 8), weatheredMat);
        rib.position.set(px + cx, 2.62, cz);
        rib.castShadow = true;
        g.add(rib);
      }
    }

    // 3 Carved Narrative Stone Relief Collar Bands + Sculpted 8-Petal Medallions
    for (const fy of [1.62, 2.66, 3.70]) {
      const collar = new THREE.Mesh(makeWorldUvBoxGeo(0.78, 0.14, 0.78, 2.0, 0.8), weatheredMat);
      collar.position.set(px, fy, 0);
      collar.castShadow = true;
      const bronzeTrim = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.036, 0.80), bronzeMat);
      bronzeTrim.position.set(px, fy, 0);
      g.add(collar, bronzeTrim);

      // Carved stone panel & 8-petal lotus medallion above each collar
      for (const fz of [-0.36, 0.36]) {
        const panelFrame = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.03), basaltMat);
        panelFrame.position.set(px, fy + 0.50, fz);
        const bossCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.045, 12), antiqueBrassMat);
        bossCenter.rotation.x = Math.PI / 2;
        bossCenter.position.set(px, fy + 0.50, fz + Math.sign(fz) * 0.018);
        g.add(panelFrame, bossCenter);

        for (let p = 0; p < 8; p++) {
          const ang = (p / 8) * Math.PI * 2;
          const petal = new THREE.Mesh(carvedPetalGeo, weatheredMat);
          petal.scale.set(0.42, 0.52, 0.45);
          petal.position.set(
            px + Math.cos(ang) * 0.06,
            fy + 0.50 + Math.sin(ang) * 0.06,
            fz + Math.sign(fz) * 0.018,
          );
          petal.rotation.z = ang - Math.PI * 0.5;
          petal.rotation.x = Math.sign(fz) * 0.25;
          g.add(petal);
        }
      }
    }

    // Mauryan Fluted Bell-Lotus Capital + Stepped Abacus Platform (y = 4.32 .. 4.86)
    const neckRing = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.038, 8, 20), bronzeMat);
    neckRing.rotation.x = Math.PI / 2;
    neckRing.position.set(px, 4.34, 0);

    const bellCap = new THREE.Mesh(bellCapGeo, weatheredMat);
    bellCap.position.set(px, 4.36, 0);
    bellCap.castShadow = true;

    const abacus1 = new THREE.Mesh(makeWorldUvBoxGeo(0.92, 0.12, 0.92, 2.2, 0.8), stoneMat);
    abacus1.position.set(px, 4.68, 0);
    abacus1.castShadow = true;

    const abacus2 = new THREE.Mesh(makeWorldUvBoxGeo(1.12, 0.14, 1.12, 2.4, 0.8), weatheredMat);
    abacus2.position.set(px, 4.81, 0);
    abacus2.castShadow = true;

    g.add(neckRing, bellCap, abacus1, abacus2);

    // Tucked Scrolled Stone Console Corbel Brackets seated cleanly under the lower architrave
    // (Flush against abacus/beam junction — NO diagonal sticks poking outward!)
    const innerCorbel = new THREE.Mesh(innerCorbelGeo, weatheredMat);
    innerCorbel.position.set(px - side * 0.34, 4.78, 0);
    if (side === 1) innerCorbel.rotation.y = Math.PI;
    innerCorbel.castShadow = true;

    const outerCorbel = new THREE.Mesh(outerCorbelGeo, weatheredMat);
    outerCorbel.position.set(px + side * 0.34, 4.78, 0);
    if (side === -1) outerCorbel.rotation.y = Math.PI;
    outerCorbel.castShadow = true;
    g.add(innerCorbel, outerCorbel);

    // Outer Pier Crown Kalasha Urn Finials atop the 3rd architrave
    const finialPlinth = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.12, 16), weatheredMat);
    finialPlinth.position.set(px, 6.14, 0);
    const finialNeck = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 8, 16), bronzeMat);
    finialNeck.rotation.x = Math.PI / 2;
    finialNeck.position.set(px, 6.20, 0);
    const finial = new THREE.Mesh(finialGeo, antiqueBrassMat);
    finial.position.set(px, 6.20, 0);
    finial.castShadow = true;
    g.add(finialPlinth, finialNeck, finial);
  }

  // 2. Triple Gently Cambered Stone Architraves with Carved Relief Bands & Spiral Volute Ends
  const architraveSpecs: Array<{ y: number; w: number; h: number; d: number; camber: number; volR: number }> = [
    { y: 4.98, w: 8.15, h: 0.32, d: 0.66, camber: 0.08, volR: 0.24 },
    { y: 5.52, w: 8.65, h: 0.28, d: 0.62, camber: 0.09, volR: 0.22 },
    { y: 6.02, w: 9.15, h: 0.26, d: 0.58, camber: 0.10, volR: 0.20 },
  ];

  for (const spec of architraveSpecs) {
    const beam = new THREE.Mesh(
      createCamberedArchitraveGeo(spec.w, spec.h, spec.d, spec.camber, 22),
      stoneMat,
    );
    beam.position.set(0, spec.y, 0);
    beam.castShadow = true;
    beam.receiveShadow = true;

    // Molded upper drip cornice cap
    const cornice = new THREE.Mesh(
      createCamberedArchitraveGeo(spec.w + 0.14, 0.075, spec.d + 0.12, spec.camber, 22),
      weatheredMat,
    );
    cornice.position.set(0, spec.y + spec.h * 0.5 + 0.03, 0);

    // Recessed bronze narrative frieze inlay strip along front/back faces
    const friezeStrip = new THREE.Mesh(
      createCamberedArchitraveGeo(spec.w - 0.36, 0.065, spec.d + 0.04, spec.camber, 20),
      bronzeMat,
    );
    friezeStrip.position.set(0, spec.y, 0);
    g.add(beam, cornice, friezeStrip);

    // Repeating carved stone dentil blocks beneath beam soffit
    const dentilCount = 13;
    for (let d = 0; d < dentilCount; d++) {
      const t = (d + 0.5) / dentilCount;
      const dx = THREE.MathUtils.lerp(-spec.w * 0.44, spec.w * 0.44, t);
      const lift = Math.sin(t * Math.PI) * spec.camber;
      const dentil = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.055, spec.d + 0.04), weatheredMat);
      dentil.position.set(dx, spec.y - spec.h * 0.5 - 0.02, 0);
      dentil.position.y += lift;
      g.add(dentil);
    }

    // Authentic solid carved spiral volute stone & bronze scrolls at beam tips
    for (const side of [-1, 1]) {
      const volute = new THREE.Mesh(createSpiralVoluteGeo(spec.volR, spec.d * 0.82, side), weatheredMat);
      volute.position.set(side * (spec.w * 0.5 + spec.volR * 0.38), spec.y + 0.02, 0);
      volute.castShadow = true;

      const boss = new THREE.Mesh(
        new THREE.CylinderGeometry(spec.volR * 0.24, spec.volR * 0.28, spec.d * 0.88, 12),
        antiqueBrassMat,
      );
      boss.rotation.x = Math.PI / 2;
      boss.position.set(side * (spec.w * 0.5 + spec.volR * 0.38), spec.y + 0.02, 0);
      g.add(volute, boss);
    }
  }

  // 3. Carved Vertical Stambhika Spacers & Chaitya Niche Panels Between Triple Architraves
  for (const [yLow, yHigh] of [
    [5.14, 5.38],
    [5.66, 5.89],
  ] as Array<[number, number]>) {
    const midY = (yLow + yHigh) * 0.5;
    const spH = yHigh - yLow;
    for (const sx of [-2.35, -0.95, 0, 0.95, 2.35]) {
      const archLift = Math.sin(((sx + 4.2) / 8.4) * Math.PI) * 0.085;
      const isMain = sx === 0 || Math.abs(sx) > 2.0;
      const colW = isMain ? 0.34 : 0.20;
      const spacerBase = new THREE.Mesh(
        new THREE.BoxGeometry(colW + 0.08, 0.05, 0.48),
        weatheredMat,
      );
      spacerBase.position.set(sx, yLow + archLift + 0.025, 0);
      const spacerCore = new THREE.Mesh(
        new THREE.CylinderGeometry(colW * 0.42, colW * 0.48, spH, isMain ? 8 : 10),
        isMain ? stoneMat : bronzeMat,
      );
      spacerCore.position.set(sx, midY + archLift, 0);
      const spacerCap = new THREE.Mesh(
        new THREE.BoxGeometry(colW + 0.08, 0.05, 0.48),
        weatheredMat,
      );
      spacerCap.position.set(sx, yHigh + archLift - 0.025, 0);
      g.add(spacerBase, spacerCore, spacerCap);
    }
  }

  // 4. Four Hanging Miniature Cast-Bronze Temple Bells Under Lower Architrave Soffit
  for (const bx of [-2.45, -1.35, 1.35, 2.45]) {
    const soffitY = 4.98 - 0.16 + Math.sin(((bx + 4.0) / 8.0) * Math.PI) * 0.08;
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.008, 6, 12), bronzeMat);
    hook.position.set(bx, soffitY - 0.04, 0);
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.12, 6), bronzeMat);
    chain.position.set(bx, soffitY - 0.11, 0);
    const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.075, 0.13, 12), antiqueBrassMat);
    bell.position.set(bx, soffitY - 0.22, 0);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.074, 0.011, 6, 12), bronzeMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(bx, soffitY - 0.285, 0);
    g.add(hook, chain, bell, rim);
  }

  // 5. Crown Ensemble: Padma-Pitha Lotus Throne, 24-Spoke Carved Dharmachakra & Kneeling Deer
  const crownBaseY = 6.22;
  const wheelThrone = new THREE.Mesh(makeWorldUvBoxGeo(0.86, 0.14, 0.48, 1.8, 0.8), weatheredMat);
  wheelThrone.position.set(0, crownBaseY + 0.07, 0);
  const wheelPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.30, 0.16, 16), bronzeMat);
  wheelPedestal.position.set(0, crownBaseY + 0.20, 0);
  g.add(wheelThrone, wheelPedestal);

  // Carved Lotus Petals around wheel pedestal
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const lp = new THREE.Mesh(carvedPetalGeo, antiqueBrassMat);
    lp.scale.set(0.45, 0.55, 0.50);
    lp.position.set(Math.sin(a) * 0.22, crownBaseY + 0.17, Math.cos(a) * 0.22);
    lp.rotation.y = a;
    lp.rotation.x = -0.52;
    g.add(lp);
  }

  // 24-Spoke Dharmachakra (double concentric rim, 24 slender spokes, carved bronze/stone lotus hub — NO glowing orb!)
  const wheelCenterY = crownBaseY + 0.90;
  const wheelOuter = new THREE.Mesh(new THREE.TorusGeometry(0.60, 0.052, 12, 36), bronzeMat);
  wheelOuter.position.set(0, wheelCenterY, 0);
  wheelOuter.castShadow = true;

  const wheelRimTrim = new THREE.Mesh(new THREE.TorusGeometry(0.54, 0.022, 8, 36), antiqueBrassMat);
  wheelRimTrim.position.set(0, wheelCenterY, 0);

  const wheelInner = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.022, 8, 32), bronzeMat);
  wheelInner.position.set(0, wheelCenterY, 0);

  const hubCore = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.13, 18), bronzeMat);
  hubCore.rotation.x = Math.PI / 2;
  hubCore.position.set(0, wheelCenterY, 0);

  const hubBoss = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.095, 0.16, 14), antiqueBrassMat);
  hubBoss.rotation.x = Math.PI / 2;
  hubBoss.position.set(0, wheelCenterY, 0);
  g.add(wheelOuter, wheelRimTrim, wheelInner, hubCore, hubBoss);

  // 24 Slender Tapered Radial Spokes
  const spokeGeo = new THREE.CylinderGeometry(0.011, 0.014, 0.94, 6);
  for (let i = 0; i < 12; i++) {
    const spoke = new THREE.Mesh(spokeGeo, antiqueBrassMat);
    spoke.position.set(0, wheelCenterY, 0);
    spoke.rotation.z = (i / 12) * Math.PI;
    g.add(spoke);
  }

  // 16 Outer Rim Lotus Bud Finials around the Dharmachakra circumference
  const rimBudGeo = new THREE.ConeGeometry(0.024, 0.065, 6);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const bud = new THREE.Mesh(rimBudGeo, antiqueBrassMat);
    bud.position.set(Math.cos(a) * 0.665, wheelCenterY + Math.sin(a) * 0.665, 0);
    bud.rotation.z = a - Math.PI * 0.5;
    g.add(bud);
  }

  // Sculpted Kneeling Deer Pair (Mrigadava)
  for (const side of [-1, 1]) {
    const deer = createSculptedKneelingDeer(side, weatheredMat, bronzeMat, antiqueBrassMat);
    deer.position.set(side * 1.15, crownBaseY - 0.02, 0);
    g.add(deer);
  }

  carvedPetalGeo.dispose();
  return g;
}

/**
 * Helper to generate a clean non-overlapping curved ribbon mesh following y(t) along `axis`.
 */
function buildCurvedStripGeo(
  axis: 'z' | 'x',
  spanLen: number,
  vMin: number,
  vMax: number,
  yTopFn: (t: number) => number,
  yBotFn: (t: number) => number,
  segs = 28,
  uvScale = 0.45,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // 4 vertices per cross-section loop: [vMin, top], [vMax, top], [vMax, bot], [vMin, bot]
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const u = (t - 0.5) * spanLen;
    const yt = yTopFn(t);
    const yb = yBotFn(t);
    const pts: Array<[number, number]> = [
      [vMin, yt],
      [vMax, yt],
      [vMax, yb],
      [vMin, yb],
    ];
    for (let k = 0; k < 4; k++) {
      const [vv, yy] = pts[k];
      if (axis === 'z') positions.push(vv, yy, u);
      else positions.push(u, yy, vv);
      uvs.push((k === 0 || k === 3 ? 0 : (vMax - vMin) * uvScale), t * spanLen * uvScale);
    }
    if (i < segs) {
      const a = i * 4;
      const b = a + 4;
      // Outward-facing winding for Top (+Y), Right (+v), Bottom (-Y), Left (-v)
      if (axis === 'z') {
        indices.push(a + 0, b + 0, b + 1, a + 0, b + 1, a + 1);
        indices.push(a + 1, b + 1, b + 2, a + 1, b + 2, a + 2);
        indices.push(a + 2, b + 2, b + 3, a + 2, b + 3, a + 3);
        indices.push(a + 3, b + 3, b + 0, a + 3, b + 0, a + 0);
      } else {
        indices.push(a + 0, b + 1, b + 0, a + 0, a + 1, b + 1);
        indices.push(a + 1, b + 2, b + 1, a + 1, a + 2, b + 2);
        indices.push(a + 2, b + 3, b + 2, a + 2, a + 3, b + 3);
        indices.push(a + 3, b + 0, b + 3, a + 3, a + 0, b + 0);
      }
    }
  }

  // End caps at i=0 and i=segs
  const last = segs * 4;
  if (axis === 'z') {
    indices.push(0, 1, 2, 0, 2, 3);
    indices.push(last + 0, last + 3, last + 2, last + 0, last + 2, last + 1);
  } else {
    indices.push(0, 2, 1, 0, 3, 2);
    indices.push(last + 0, last + 2, last + 3, last + 0, last + 1, last + 2);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  const nonIdx = geo.toNonIndexed();
  geo.dispose();
  nonIdx.computeVertexNormals();
  return nonIdx;
}

/**
 * Builds an authentic, highly complex, real-life-looking Heritage Nepalese Stone & Terracotta
 * Arched Ceremonial Causeway Bridge across Lumbini's Surrounding Sacred Pond:
 * - True curved barrel-vault stone arch & extruded spandrel walls with recessed ashlar niches
 * - 19 radial beveled stone voussoirs + projecting central keystone with carved lotus boss
 * - Stepped brick & stone pointed cutwater piers at the water line
 * - Continuous, zero-Z-fighting multi-band inlaid deck (terracotta brick + basalt runners + Chunar walks + central Dharma compass)
 * - Lathe-turned classical stone balusters, swept molded coping handrail & carved newel piers with weathered stone/bronze finials (NO neon yellow cones!)
 */
export function buildMuseumCausewayBridge(
  axis: 'z' | 'x',
  cx: number,
  cz: number,
  spanLen: number,
  width: number,
  mats: {
    terracottaMat: THREE.Material;
    brickMat: THREE.Material;
    chunarMat: THREE.Material;
    bronzeMat: THREE.Material;
  },
): THREE.Group {
  const { terracottaMat, brickMat, chunarMat, bronzeMat } = mats;
  const craftMats = getLumbiniGardenCraftMaterials();
  const basaltMat = craftMats.basaltMat;
  const weatheredMat = craftMats.weatheredSandstoneMat;

  const bg = new THREE.Group();
  bg.position.set(cx, 0, cz);

  const baseDeckY = LUMBINI_SACRED_POND.bridgeBaseY - 0.25; // +0.10 local (+0.35 world)
  const archLift = LUMBINI_SACRED_POND.bridgeArchLift; // +0.26
  const deckYFn = (t: number) => baseDeckY + Math.sin(t * Math.PI) * archLift;

  // Vault arch curve rising gracefully from abutment springline (-0.56) to crown (+0.03)
  const archVaultYFn = (t: number) => {
    const s = Math.sin(t * Math.PI);
    return -0.56 + Math.pow(s, 0.78) * 0.59;
  };

  const halfW = width * 0.5;
  const railEdge = halfW - 0.18;
  const curbIn = halfW - 0.34;
  const walkIn = halfW - 0.72;
  const basaltIn = halfW - 0.86;

  // 1. Disjoint Zero-Z-Fighting Continuous Deck Bands + Barrel Vault Arch Underside
  // Central terracotta herringbone deck (strictly inside basalt runners)
  const centerDeck = new THREE.Mesh(
    buildCurvedStripGeo(axis, spanLen, -basaltIn, basaltIn, deckYFn, archVaultYFn, 28, 0.42),
    terracottaMat,
  );
  centerDeck.receiveShadow = true;
  centerDeck.castShadow = true;
  bg.add(centerDeck);

  // Flanking dark basalt border runners, Chunar stone outer walks & balustrade curb plinths
  for (const side of [-1, 1]) {
    const bMin = side === 1 ? basaltIn : -walkIn;
    const bMax = side === 1 ? walkIn : -basaltIn;
    const basaltStrip = new THREE.Mesh(
      buildCurvedStripGeo(axis, spanLen, bMin, bMax, (t) => deckYFn(t) + 0.008, archVaultYFn, 28, 0.5),
      basaltMat,
    );
    basaltStrip.receiveShadow = true;

    const wMin = side === 1 ? walkIn : -curbIn;
    const wMax = side === 1 ? curbIn : -walkIn;
    const stoneWalk = new THREE.Mesh(
      buildCurvedStripGeo(axis, spanLen, wMin, wMax, (t) => deckYFn(t) + 0.004, archVaultYFn, 28, 0.45),
      chunarMat,
    );
    stoneWalk.receiveShadow = true;

    // Stepped balustrade base plinth curb (rises cleanly 11cm above stone walk)
    const cMin = side === 1 ? curbIn : -(halfW - 0.04);
    const cMax = side === 1 ? (halfW - 0.04) : -curbIn;
    const curbPlinth = new THREE.Mesh(
      buildCurvedStripGeo(axis, spanLen, cMin, cMax, (t) => deckYFn(t) + 0.11, archVaultYFn, 28, 0.45),
      chunarMat,
    );
    curbPlinth.castShadow = true;
    curbPlinth.receiveShadow = true;

    // Projecting overhanging molded stone drip cornice along outer spandrel face
    const corMin = side === 1 ? (halfW - 0.04) : -(halfW + 0.08);
    const corMax = side === 1 ? (halfW + 0.08) : -(halfW - 0.04);
    const spandrelCornice = new THREE.Mesh(
      buildCurvedStripGeo(
        axis,
        spanLen,
        corMin,
        corMax,
        (t) => deckYFn(t) + 0.035,
        (t) => deckYFn(t) - 0.075,
        28,
        0.5,
      ),
      weatheredMat,
    );
    spandrelCornice.castShadow = true;
    spandrelCornice.receiveShadow = true;

    // Continuous outer arched stone spandrel fascia wall down to arch vault
    const spMin = side === 1 ? (halfW - 0.12) : -(halfW + 0.02);
    const spMax = side === 1 ? (halfW + 0.02) : -(halfW - 0.12);
    const spandrelWall = new THREE.Mesh(
      buildCurvedStripGeo(axis, spanLen, spMin, spMax, (t) => deckYFn(t) - 0.07, archVaultYFn, 28, 0.45),
      weatheredMat,
    );
    spandrelWall.castShadow = true;
    spandrelWall.receiveShadow = true;

    bg.add(basaltStrip, stoneWalk, curbPlinth, spandrelCornice, spandrelWall);
  }

  // 2. Transverse Chunar Stone Joint Ribs & Drainage Scuppers on Outer Walks
  for (let i = 1; i <= 9; i++) {
    const t = i / 10;
    const u = (t - 0.5) * spanLen;
    const dy = deckYFn(t);
    const slope = Math.cos(t * Math.PI) * (Math.PI / spanLen) * archLift;
    for (const side of [-1, 1]) {
      const midV = side * (walkIn + curbIn) * 0.5;
      const rib = new THREE.Mesh(
        new THREE.BoxGeometry(axis === 'z' ? 0.34 : 0.05, 0.012, axis === 'z' ? 0.05 : 0.34),
        weatheredMat,
      );
      rib.position.set(axis === 'x' ? u : midV, dy + 0.008, axis === 'z' ? u : midV);
      if (axis === 'z') rib.rotation.x = -slope;
      else rib.rotation.z = slope;
      rib.userData.nonCollidable = true;
      bg.add(rib);

      // Cast bronze water-gargoyle scupper spout protruding gently through outer spandrel cornice
      if (i % 2 === 0) {
        const spout = new THREE.Mesh(
          new THREE.BoxGeometry(axis === 'z' ? 0.16 : 0.08, 0.05, axis === 'z' ? 0.08 : 0.16),
          bronzeMat,
        );
        spout.position.set(
          axis === 'x' ? u : side * (halfW + 0.07),
          dy - 0.04,
          axis === 'z' ? u : side * (halfW + 0.07),
        );
        spout.userData.nonCollidable = true;
        bg.add(spout);
      }
    }
  }

  // 3. Central Bridge Crown Dharmachakra & Stone Compass Inlay (zero Z-fighting)
  const apexY = deckYFn(0.5);
  const compBase = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.90, 0.016, 24), chunarMat);
  compBase.position.set(0, apexY + 0.008, 0);
  compBase.receiveShadow = true;
  compBase.userData.nonCollidable = true;
  const compRing = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.022, 8, 24), bronzeMat);
  compRing.rotation.x = Math.PI / 2;
  compRing.position.set(0, apexY + 0.020, 0);
  compRing.userData.nonCollidable = true;
  const compHub = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.24, 0.022, 16), bronzeMat);
  compHub.position.set(0, apexY + 0.015, 0);
  compHub.userData.nonCollidable = true;
  bg.add(compBase, compRing, compHub);
  for (let k = 0; k < 4; k++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.014, 0.045), bronzeMat);
    spoke.position.set(0, apexY + 0.016, 0);
    spoke.rotation.y = (k * Math.PI) / 4;
    spoke.userData.nonCollidable = true;
    bg.add(spoke);
  }

  // 4. Radial Carved Stone Arch Voussoirs & Projecting Central Keystone on Both Pond Elevations
  const voussoirCount = 19;
  const vArcSpan = spanLen * 0.72;
  for (let i = 0; i < voussoirCount; i++) {
    const t = (i + 0.5) / voussoirCount;
    const u = (t - 0.5) * vArcSpan;
    const tGlobal = 0.5 + u / spanLen;
    const vy = archVaultYFn(tGlobal) + 0.08;
    const archSlope = Math.cos(tGlobal * Math.PI) * (Math.PI / spanLen) * 0.55;
    const isKey = i === Math.floor(voussoirCount / 2);

    for (const side of [-1, 1]) {
      const faceV = side * (halfW + 0.01);
      const vW = isKey ? 0.34 : 0.26;
      const vH = isKey ? 0.36 : 0.26;
      const vD = isKey ? 0.16 : 0.11;
      const voussoir = new THREE.Mesh(
        makeWorldUvBoxGeo(axis === 'z' ? vD : vW, vH, axis === 'z' ? vW : vD, 1.2, 1.2),
        isKey ? chunarMat : weatheredMat,
      );
      voussoir.position.set(axis === 'x' ? u : faceV, vy, axis === 'z' ? u : faceV);
      if (axis === 'z') voussoir.rotation.x = -archSlope;
      else voussoir.rotation.z = archSlope;
      voussoir.castShadow = true;
      bg.add(voussoir);

      if (isKey) {
        const keyBoss = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.095, 0.04, 12), bronzeMat);
        if (axis === 'z') keyBoss.rotation.z = Math.PI / 2;
        else keyBoss.rotation.x = Math.PI / 2;
        keyBoss.position.set(
          axis === 'x' ? u : side * (halfW + 0.09),
          vy + 0.02,
          axis === 'z' ? u : side * (halfW + 0.09),
        );
        bg.add(keyBoss);
      }
    }
  }

  // 5. Recessed Carved Spandrel Medallions & Stepped Pointed Cutwater Piers
  for (const uPier of [-spanLen * 0.30, spanLen * 0.30]) {
    // Pointed hexagonal cutwater masonry pier supporting arch springlines
    const cutShape = new THREE.Shape();
    const cw = halfW + 0.26;
    const pt = 0.44;
    cutShape.moveTo(-0.34, -cw + pt);
    cutShape.lineTo(0.34, -cw + pt);
    cutShape.lineTo(0.34, cw - pt);
    cutShape.lineTo(0, cw + 0.16);
    cutShape.lineTo(-0.34, cw - pt);
    cutShape.lineTo(-0.34, -cw + pt);
    cutShape.lineTo(0, -cw - 0.16);
    cutShape.closePath();

    const cutGeo = new THREE.ExtrudeGeometry(cutShape, {
      depth: 0.92,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 2,
    });
    cutGeo.rotateX(-Math.PI / 2);
    if (axis === 'z') cutGeo.rotateY(Math.PI / 2);
    const cutPier = new THREE.Mesh(cutGeo, brickMat);
    cutPier.position.set(axis === 'x' ? uPier : 0, -1.02, axis === 'z' ? uPier : 0);
    cutPier.castShadow = true;
    cutPier.receiveShadow = true;

    const cutCap = new THREE.Mesh(
      makeWorldUvBoxGeo(axis === 'z' ? width + 0.54 : 0.78, 0.12, axis === 'z' ? 0.78 : width + 0.54, 2.2, 1.0),
      chunarMat,
    );
    cutCap.position.set(axis === 'x' ? uPier : 0, -0.04, axis === 'z' ? uPier : 0);
    cutCap.castShadow = true;
    bg.add(cutPier, cutCap);

    // Carved stone lotus medallion on outer spandrel flank above cutwater
    for (const side of [-1, 1]) {
      const tP = 0.5 + uPier / spanLen;
      const py = deckYFn(tP) - 0.22;
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(axis === 'z' ? 0.05 : 0.46, 0.34, axis === 'z' ? 0.46 : 0.05),
        basaltMat,
      );
      frame.position.set(axis === 'x' ? uPier : side * (halfW + 0.02), py, axis === 'z' ? uPier : side * (halfW + 0.02));
      const ros = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.11, 0.05, 14), bronzeMat);
      if (axis === 'z') ros.rotation.z = Math.PI / 2;
      else ros.rotation.x = Math.PI / 2;
      ros.position.set(axis === 'x' ? uPier : side * (halfW + 0.045), py, axis === 'z' ? uPier : side * (halfW + 0.045));
      bg.add(frame, ros);
    }
  }

  // 6. Sculpted Newel Piers, Classical Turned Balusters, Swept Handrail & Natural Stone/Bronze Finials
  const balusterGeo = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.095, 0.0),
      new THREE.Vector2(0.095, 0.05),
      new THREE.Vector2(0.068, 0.09),
      new THREE.Vector2(0.045, 0.16),
      new THREE.Vector2(0.086, 0.28),
      new THREE.Vector2(0.084, 0.36),
      new THREE.Vector2(0.042, 0.48),
      new THREE.Vector2(0.072, 0.57),
      new THREE.Vector2(0.092, 0.62),
      new THREE.Vector2(0.092, 0.66),
      new THREE.Vector2(0.0, 0.66),
    ],
    14,
  );

  // Sculpted stone & bronze lotus-bud Kalasha finial (warm weathered stone + bronze collar — zero bright bloom!)
  const stoneFinialGeo = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.135, 0.0),
      new THREE.Vector2(0.105, 0.04),
      new THREE.Vector2(0.145, 0.11),
      new THREE.Vector2(0.135, 0.17),
      new THREE.Vector2(0.065, 0.23),
      new THREE.Vector2(0.082, 0.27),
      new THREE.Vector2(0.025, 0.36),
      new THREE.Vector2(0.0, 0.40),
    ],
    14,
  );

  const postCount = 5;
  for (const side of [-1, 1]) {
    // Continuous molded arched coping handrail sweeping smoothly over the balusters
    const railCap = new THREE.Mesh(
      buildCurvedStripGeo(
        axis,
        spanLen - 0.56,
        side * railEdge - 0.145,
        side * railEdge + 0.145,
        (t) => deckYFn(t * ((spanLen - 0.56) / spanLen) + 0.28 / spanLen) + 0.84,
        (t) => deckYFn(t * ((spanLen - 0.56) / spanLen) + 0.28 / spanLen) + 0.77,
        24,
        0.5,
      ),
      chunarMat,
    );
    railCap.castShadow = true;
    railCap.receiveShadow = true;

    const railLip = new THREE.Mesh(
      buildCurvedStripGeo(
        axis,
        spanLen - 0.56,
        side * railEdge - 0.175,
        side * railEdge + 0.175,
        (t) => deckYFn(t * ((spanLen - 0.56) / spanLen) + 0.28 / spanLen) + 0.895,
        (t) => deckYFn(t * ((spanLen - 0.56) / spanLen) + 0.28 / spanLen) + 0.84,
        24,
        0.5,
      ),
      weatheredMat,
    );
    railLip.castShadow = true;
    bg.add(railCap, railLip);

    // 5 Carved Newel Piers with basalt collar, recessed stone relief & stone/bronze lotus finials
    for (let p = 0; p < postCount; p++) {
      const t = p / (postCount - 1);
      const u = (t - 0.5) * (spanLen - 0.64);
      const tGlobal = 0.5 + u / spanLen;
      const py = deckYFn(tGlobal);
      const isEnd = p === 0 || p === postCount - 1;
      const postW = isEnd ? 0.44 : 0.30;
      const postH = isEnd ? 1.00 : 0.86;

      const basaltFoot = new THREE.Mesh(
        makeWorldUvBoxGeo(postW + 0.08, 0.10, postW + 0.08, 1.4, 0.8),
        basaltMat,
      );
      basaltFoot.position.set(axis === 'x' ? u : side * railEdge, py + 0.14, axis === 'z' ? u : side * railEdge);

      const post = new THREE.Mesh(
        makeWorldUvBoxGeo(postW, postH, postW, 1.8, 1.2),
        chunarMat,
      );
      post.position.set(axis === 'x' ? u : side * railEdge, py + 0.10 + postH * 0.5, axis === 'z' ? u : side * railEdge);
      post.castShadow = true;

      // Recessed stone panel & carved bronze rosette on outer & inner pier faces
      for (const fSide of [-1, 1]) {
        const panel = new THREE.Mesh(
          new THREE.BoxGeometry(
            axis === 'z' ? 0.03 : postW * 0.62,
            postH * 0.52,
            axis === 'z' ? postW * 0.62 : 0.03,
          ),
          basaltMat,
        );
        panel.position.set(
          axis === 'x' ? u : side * railEdge + fSide * (postW * 0.5 + 0.005),
          py + 0.10 + postH * 0.52,
          axis === 'z' ? u : side * railEdge + fSide * (postW * 0.5 + 0.005),
        );
        const boss = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.03, 12), bronzeMat);
        if (axis === 'z') boss.rotation.z = Math.PI / 2;
        else boss.rotation.x = Math.PI / 2;
        boss.position.set(
          axis === 'x' ? u : side * railEdge + fSide * (postW * 0.5 + 0.018),
          py + 0.10 + postH * 0.52,
          axis === 'z' ? u : side * railEdge + fSide * (postW * 0.5 + 0.018),
        );
        bg.add(panel, boss);
      }

      const capPlate = new THREE.Mesh(
        makeWorldUvBoxGeo(postW + 0.10, 0.09, postW + 0.10, 1.4, 0.8),
        weatheredMat,
      );
      capPlate.position.set(axis === 'x' ? u : side * railEdge, py + 0.10 + postH + 0.03, axis === 'z' ? u : side * railEdge);

      const bronzeCollar = new THREE.Mesh(
        new THREE.TorusGeometry(isEnd ? 0.14 : 0.10, 0.016, 8, 16),
        bronzeMat,
      );
      bronzeCollar.rotation.x = Math.PI / 2;
      bronzeCollar.position.set(axis === 'x' ? u : side * railEdge, py + 0.10 + postH + 0.08, axis === 'z' ? u : side * railEdge);

      const finial = new THREE.Mesh(stoneFinialGeo, isEnd ? weatheredMat : chunarMat);
      finial.scale.setScalar(isEnd ? 1.0 : 0.70);
      finial.position.set(axis === 'x' ? u : side * railEdge, py + 0.10 + postH + 0.08, axis === 'z' ? u : side * railEdge);
      finial.castShadow = true;

      bg.add(basaltFoot, post, capPlate, bronzeCollar, finial);

      // Flared approach wing-wall cheek piers at both bridge entrances (t=0, t=1)
      if (isEnd) {
        const endSign = p === 0 ? -1 : 1;
        const wingU = u + endSign * 0.34;
        const wingV = side * (railEdge + 0.22);
        const wingBlock = new THREE.Mesh(
          makeWorldUvBoxGeo(axis === 'z' ? 0.32 : 0.42, 0.62, axis === 'z' ? 0.42 : 0.32, 1.6, 1.0),
          weatheredMat,
        );
        wingBlock.position.set(axis === 'x' ? wingU : wingV, baseDeckY + 0.26, axis === 'z' ? wingU : wingV);
        wingBlock.castShadow = true;
        const wingCap = new THREE.Mesh(
          makeWorldUvBoxGeo(axis === 'z' ? 0.38 : 0.48, 0.08, axis === 'z' ? 0.48 : 0.38, 1.6, 0.6),
          chunarMat,
        );
        wingCap.position.set(axis === 'x' ? wingU : wingV, baseDeckY + 0.60, axis === 'z' ? wingU : wingV);
        bg.add(wingBlock, wingCap);
      }
    }

    // 16 Classical Turned Stone Vase Balusters per Side
    for (let b = 0; b < 16; b++) {
      const u = ((b + 0.5) / 16 - 0.5) * (spanLen - 0.72);
      const tGlobal = 0.5 + u / spanLen;
      // Skip spots occupied by newel piers
      if (
        Math.abs(tGlobal - 0.04) < 0.045 ||
        Math.abs(tGlobal - 0.27) < 0.036 ||
        Math.abs(tGlobal - 0.50) < 0.036 ||
        Math.abs(tGlobal - 0.73) < 0.036 ||
        Math.abs(tGlobal - 0.96) < 0.045
      ) {
        continue;
      }
      const py = deckYFn(tGlobal);
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.18), weatheredMat);
      plinth.position.set(axis === 'x' ? u : side * railEdge, py + 0.125, axis === 'z' ? u : side * railEdge);
      const baluster = new THREE.Mesh(balusterGeo, chunarMat);
      baluster.position.set(axis === 'x' ? u : side * railEdge, py + 0.14, axis === 'z' ? u : side * railEdge);
      baluster.castShadow = true;
      bg.add(plinth, baluster);
    }
  }

  return bg;
}

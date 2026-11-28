import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { LANDMARKS } from '../data/portfolioData';
import {
  PUMDIKOT_COMPLEX,
  PUMDIKOT_INTERACTIVE_SPOTS,
  getPumdikot108LingamPlacements,
  getPumdikotSeparationMetrics,
  getPumdikotSurfaceY,
  isInPumdikotInnerSanctum,
  isInPumdikotPrecinct,
  isPumdikotWalkable,
} from './pumdikotData';
import { createPumdikotComplex } from './pumdikotComplex';
import {
  ROAD_LANTERN_COORDS,
  ROAD_PATHS,
  clampToWalkable,
  computeContextualWorldAction,
  getFootstepSurfaceKind,
  getLandmarkApproachPoint,
  getRiverCenterX,
  getSurfaceHeightAt,
  groundHeightAt,
  isWalkablePosition,
} from './worldLogic';

test('River separation keeps all 5 Nepal heritage complexes West and all 4 project/academic landmarks East', () => {
  const westHeritageIds = [
    'kathmandu-stupa',
    'boudhanath-stupa',
    'pumdikot-shiva',
    'janaki-mandir',
    'lumbini-buddha',
  ];
  const eastAcademicProjectIds = [
    'vit-vellore-tower',
    'breath-sensor-lab',
    'aniflow-studio',
    'agent-infra-monolith',
  ];

  for (const id of westHeritageIds) {
    const lm = LANDMARKS.find((l) => l.id === id);
    assert.ok(lm, `Missing heritage landmark ${id}`);
    const riverX = getRiverCenterX(lm.position.z);
    assert.ok(
      lm.position.x < riverX - 20,
      `Heritage complex ${id} (x=${lm.position.x}) must sit strictly West of river (riverX=${riverX.toFixed(1)})`,
    );
  }

  for (const id of eastAcademicProjectIds) {
    const lm = LANDMARKS.find((l) => l.id === id);
    assert.ok(lm, `Missing academic/project landmark ${id}`);
    const riverX = getRiverCenterX(lm.position.z);
    assert.ok(
      lm.position.x > riverX + 20,
      `Project/academic landmark ${id} (x=${lm.position.x}) must sit strictly East of river (riverX=${riverX.toFixed(1)})`,
    );
  }
});

test('Pumdikot Mahadev precinct anchors at y=0, clears all existing monuments by >= 175m, and connects cleanly at South Gate', () => {
  const pumdikot = LANDMARKS.find((l) => l.id === 'pumdikot-shiva')!;
  assert.ok(pumdikot);
  assert.equal(pumdikot.position.x, -50);
  assert.equal(pumdikot.position.z, -88);

  const metrics = getPumdikotSeparationMetrics(LANDMARKS);
  assert.ok(
    metrics.minMonumentDist >= 175,
    `Pumdikot must stay >= 175m from every other heritage monument, got ${metrics.minMonumentDist.toFixed(1)}m`,
  );

  // Main ground plane outside perimeter sits flat near y = 0.0
  assert.ok(Math.abs(groundHeightAt(-50, -24)) < 0.04, 'South Gate road apron should sit on main ground y=0');
  assert.ok(Math.abs(groundHeightAt(-50, -88)) < 0.02, 'Ground plane beneath Pumdikot plaza should sit level at y=0');

  // Atlas teleport approach point sits cleanly just outside the Crimson South Gate facing North
  const approach = getLandmarkApproachPoint(pumdikot);
  assert.equal(approach.x, -50);
  assert.equal(approach.z, -22);
  assert.equal(isWalkablePosition(approach.x, approach.z), true);
  assert.equal(getFootstepSurfaceKind(approach.x, approach.z), 'stone');

  // Verify no stray road lanterns or segments overlap inside Pumdikot plaza walls
  for (const [lx, lz] of ROAD_LANTERN_COORDS) {
    assert.equal(
      isInPumdikotPrecinct(lx, lz, -1.0),
      false,
      `Road lantern at (${lx}, ${lz}) must not sit inside Pumdikot precinct`,
    );
  }
  assert.ok(
    ROAD_PATHS.some((seg) => seg.some(([rx, rz]) => Math.hypot(rx - -50, rz - -24) < 6)),
    'Road network must connect smoothly to the Pumdikot South Gate approach',
  );
});

test('108 Shiva Lingam ring populates all 108 placements without clipping stair mouths', () => {
  const lingams = getPumdikot108LingamPlacements();
  assert.equal(lingams.length, 108);

  const c = PUMDIKOT_COMPLEX;
  for (const l of lingams) {
    const ax = Math.abs(l.localX);
    const inLeftOrRightStairMouth =
      ax >= 5.2 && ax <= 14.5 && l.localZ >= c.stairUpperMinZ - 0.5 && l.localZ <= c.stairUpperMaxZ + 0.5;
    assert.equal(
      inLeftOrRightStairMouth,
      false,
      `Lingam #${l.index} at (${l.localX.toFixed(2)}, ${l.localZ.toFixed(2)}) overlaps upper stair arrival mouth`,
    );
  }
});

test('Pumdikot multi-level walkability covers South Gate, Diamond Plaza, Shivakunda rail, Nandi, Garbhagriha, Twin Stairs, and Upper 108-Lingam Terrace', () => {
  const c = PUMDIKOT_COMPLEX;

  // Walk through Crimson South Gate onto diamond plaza (0.28m)
  assert.equal(isPumdikotWalkable(-50, -28, 0.1), true);
  assert.equal(isWalkablePosition(-50, -34, 0.28), true);
  assert.ok(Math.abs((getPumdikotSurfaceY(-50, -34, 0.28) ?? 0) - 0.28) < 0.01);
  assert.equal(getFootstepSurfaceKind(-50, -34), 'stone');

  // Outer perimeter walls & side fences block pass-through
  assert.equal(isWalkablePosition(-98, -88, 0.28), false);
  assert.equal(isWalkablePosition(-2, -88, 0.28), false);
  assert.equal(isWalkablePosition(-70, -28, 0.28), false);

  // Sunken Turquoise Shivakunda pond + stainless safety rail block walking into water
  assert.equal(
    isWalkablePosition(PUMDIKOT_INTERACTIVE_SPOTS.shivakundaCenter.x, PUMDIKOT_INTERACTIVE_SPOTS.shivakundaCenter.z, 0.28),
    false,
  );
  // Brass Nandi plinth & Ceremonial Trishul block walking through
  assert.equal(
    isWalkablePosition(PUMDIKOT_INTERACTIVE_SPOTS.nandiCenter.x, PUMDIKOT_INTERACTIVE_SPOTS.nandiCenter.z, 0.28),
    false,
  );
  assert.equal(
    isWalkablePosition(c.centerX + c.trishulLocalX, c.centerZ + c.trishulLocalZ, 0.28),
    false,
  );

  // Walk through Emerald Portico into Garbhagriha perimeter walkway (y = 0.48m), while central Sphatik Lingam altar blocks pass-through
  const innerWalkSpotZ = c.centerZ + c.rotundaCenterLocalZ + 5.2;
  assert.equal(isInPumdikotInnerSanctum(-50, innerWalkSpotZ, 0.48), true);
  assert.equal(isWalkablePosition(-50, innerWalkSpotZ, 0.48), true);
  assert.ok(Math.abs(getSurfaceHeightAt(-50, innerWalkSpotZ, 0.48) - c.garbhagrihaY) < 0.02);
  assert.equal(
    isWalkablePosition(PUMDIKOT_INTERACTIVE_SPOTS.innerLingamCenter.x, PUMDIKOT_INTERACTIVE_SPOTS.innerLingamCenter.z, 0.48),
    false,
    'Central Garbhagriha Sphatik Lingam altar must block walking directly through center',
  );

  // Twin symmetrical curved staircases climb cleanly: 0.28 -> 2.45 -> 6.25
  const rightStairX = c.centerX + 16.2;
  const lowerStartH = getSurfaceHeightAt(rightStairX, c.centerZ - 1.8, 0.3);
  const lowerMidH = getSurfaceHeightAt(rightStairX, c.centerZ - 4.2, 1.4);
  const midLandingH = getSurfaceHeightAt(rightStairX, c.centerZ - 8.8, 2.45);
  const upperFlightH = getSurfaceHeightAt(c.centerX + 9.8, c.centerZ - 8.7, 4.35);
  assert.ok(lowerStartH < lowerMidH && lowerMidH < midLandingH && midLandingH < upperFlightH);
  assert.ok(Math.abs(midLandingH - c.stairMidY) < 0.05);

  // Upper 108-Lingam Pradakshina terrace (refY = 6.25) is walkable all around the dome while dome core blocks pass-through
  const upperEastX = c.centerX + 12.0;
  const upperNorthZ = c.centerZ + c.rotundaCenterLocalZ - 12.0;
  assert.equal(isWalkablePosition(upperEastX, c.centerZ + c.rotundaCenterLocalZ, 6.25), true);
  assert.equal(isWalkablePosition(c.centerX, upperNorthZ, 6.25), true);
  assert.ok(Math.abs(getSurfaceHeightAt(c.centerX, upperNorthZ, 6.25) - c.upperTerraceY) < 0.02);
  assert.equal(
    isWalkablePosition(c.centerX, c.centerZ + c.rotundaCenterLocalZ, 6.25),
    false,
    'White ribbed dome core on upper deck must block pass-through',
  );

  // clampToWalkable preserves upper deck elevation when refY is on terrace
  const clampedUpper = clampToWalkable(c.centerX, c.centerZ + c.rotundaCenterLocalZ, upperEastX, c.centerZ + c.rotundaCenterLocalZ, 6.25);
  assert.ok(isWalkablePosition(clampedUpper.x, clampedUpper.z, 6.25));
});

test('Pumdikot contextual world actions trigger correctly across Shivakunda, Portico, Garbhagriha, and Upper Terrace', () => {
  const shivaPondSpot = {
    x: PUMDIKOT_INTERACTIVE_SPOTS.shivakundaCenter.x,
    z: PUMDIKOT_INTERACTIVE_SPOTS.shivakundaCenter.z + 6.9,
  };
  const pondAct = computeContextualWorldAction(shivaPondSpot.x, shivaPondSpot.z, null, [], [], [], [], [], {}, 0.28);
  assert.equal(pondAct?.kind, 'sprinkle-pumdikot-water');

  const porticoSpot = PUMDIKOT_INTERACTIVE_SPOTS.porticoEntrance;
  const porticoAct = computeContextualWorldAction(porticoSpot.x, porticoSpot.z, null, [], [], [], [], [], {}, 0.35);
  assert.equal(porticoAct?.kind, 'enter-pumdikot-sanctum');

  const innerSpot = {
    x: PUMDIKOT_INTERACTIVE_SPOTS.innerLingamCenter.x,
    z: PUMDIKOT_INTERACTIVE_SPOTS.innerLingamCenter.z + 3.2,
  };
  const innerAct = computeContextualWorldAction(innerSpot.x, innerSpot.z, null, [], [], [], [], [], {}, 0.48);
  assert.equal(innerAct?.kind, 'offer-pumdikot-bel-diya');

  const upperAct = computeContextualWorldAction(
    PUMDIKOT_INTERACTIVE_SPOTS.upperTerracePlaque.x,
    PUMDIKOT_INTERACTIVE_SPOTS.upperTerracePlaque.z,
    null,
    [],
    [],
    [],
    [],
    [],
    {},
    6.25,
  );
  assert.equal(upperAct?.kind, 'inspect-pumdikot-shiva');
});

test('createPumdikotComplex constructs monumental 96m x 120m complex with Layer-2 hit targets, bell, and 108-ft Shiva', () => {
  const tex = new THREE.Texture();
  const mockTextures = new Proxy(
    { plazaStoneMap: tex, stoneNormal: tex, roofTileMap: tex },
    { get: (target, prop) => (prop in target ? (target as Record<string | symbol, unknown>)[prop] : tex) },
  ) as unknown as import('./proceduralTextures').ProceduralTextureSet;

  const result = createPumdikotComplex(mockTextures);
  assert.ok(result.group);
  assert.equal(result.group.name, 'PumdikotMahadevComplex');
  const bells = result.group.userData.templeBells as THREE.Group[] | undefined;
  assert.ok(bells && bells.length >= 1, 'Expected hanging bronze temple bell');
  assert.ok(result.group.userData.shivakundaHitTarget);
  assert.ok(result.group.userData.nandiBellHitTarget);
  assert.ok(result.group.userData.porticoHitTarget);
  assert.ok(result.group.userData.innerLingamHitTarget);
  assert.ok(result.group.userData.domeShivaHitTarget);
  assert.equal(typeof result.group.userData.triggerInnerOffering, 'function');

  const box = new THREE.Box3().setFromObject(result.group);
  const size = new THREE.Vector3();
  box.getSize(size);
  assert.ok(size.x >= 95 && size.x <= 99, `Expected ~96m width, got ${size.x.toFixed(2)}m`);
  assert.ok(size.z >= 119 && size.z <= 127, `Expected ~120m precinct + south gate ramp (~125.8m), got ${size.z.toFixed(2)}m`);
  assert.ok(size.y >= 32, `Expected monumental >=32m total height including 108-ft Shiva Trishul, got ${size.y.toFixed(2)}m`);

  // Verify every hanging temple bell has both outward exterior normals and inward interior cavity normals
  for (const bellGroup of bells) {
    let bellBodyMesh: THREE.Mesh | null = null;
    bellGroup.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh && (obj as THREE.Mesh).geometry instanceof THREE.LatheGeometry) {
        bellBodyMesh = obj as THREE.Mesh;
      }
    });
    assert.ok(bellBodyMesh, 'Bell group must contain LatheGeometry body');
    const pos = (bellBodyMesh as THREE.Mesh).geometry.attributes.position;
    const norm = (bellBodyMesh as THREE.Mesh).geometry.attributes.normal;
    let outwardCount = 0;
    let inwardCount = 0;
    for (let i = 0; i < pos.count; i++) {
      const r = Math.hypot(pos.getX(i), pos.getZ(i));
      if (r < 0.05) continue;
      const radialDot = pos.getX(i) * norm.getX(i) + pos.getZ(i) * norm.getZ(i);
      if (radialDot > 0.01) outwardCount++;
      if (radialDot < -0.01) inwardCount++;
    }
    assert.ok(outwardCount > 10, `Bell must have outward exterior normals (got ${outwardCount})`);
    assert.ok(inwardCount > 10, `Bell must have inward interior cavity normals (got ${inwardCount})`);
  }
});

test('Interactive terracotta Gagri pots have closed inner cavities with outward exterior and inward interior normals', async () => {
  const { createInteractiveProps } = await import('./proceduralModels');
  const tex = new THREE.Texture();
  const mockTextures = new Proxy(
    { crateFaceMap: tex, crateNormal: tex, brickNormal: tex },
    { get: (target, prop) => (prop in target ? (target as Record<string | symbol, unknown>)[prop] : tex) },
  ) as unknown as import('./proceduralTextures').ProceduralTextureSet;

  const props = createInteractiveProps(mockTextures);
  const pots = props.filter((p) => p.kind === 'pot');
  assert.ok(pots.length >= 4);

  let potMesh: THREE.Mesh | null = null;
  pots[0].mesh.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh && (obj as THREE.Mesh).geometry instanceof THREE.LatheGeometry) {
      potMesh = obj as THREE.Mesh;
    }
  });
  assert.ok(potMesh, 'Pot prop must contain LatheGeometry mesh');
  const pos = (potMesh as THREE.Mesh).geometry.attributes.position;
  const norm = (potMesh as THREE.Mesh).geometry.attributes.normal;
  let outwardCount = 0;
  let inwardCount = 0;
  let hasClosedInnerBase = false;
  for (let i = 0; i < pos.count; i++) {
    const r = Math.hypot(pos.getX(i), pos.getZ(i));
    if (r < 0.01 && pos.getY(i) > -0.28 && pos.getY(i) < -0.20) {
      hasClosedInnerBase = true;
    }
    if (r < 0.05) continue;
    const radialDot = pos.getX(i) * norm.getX(i) + pos.getZ(i) * norm.getZ(i);
    if (radialDot > 0.01) outwardCount++;
    if (radialDot < -0.01) inwardCount++;
  }
  assert.equal(hasClosedInnerBase, true, 'Terracotta pot must close at an inner base so bottom is not transparent');
  assert.ok(outwardCount > 10, `Pot must have outward exterior normals (got ${outwardCount})`);
  assert.ok(inwardCount > 10, `Pot must have inward interior cavity normals (got ${inwardCount})`);
});


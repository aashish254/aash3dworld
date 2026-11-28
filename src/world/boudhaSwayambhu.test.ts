import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { LANDMARKS } from '../data/portfolioData';
import { HERITAGE_GROUP_IDS } from '../data/achievementsData';
import {
  BOUDHA_COMPLEX,
  BOUDHA_INTERACTIVE_SPOTS,
  getBoudha108PrayerWheelPlacements,
  getBoudhaSeparationMetrics,
  getBoudhanathSurfaceY,
  isBoudhanathWalkable,
  isInsideBoudhaMandalaTier,
} from './boudhanathData';
import {
  WORLD_RADIUS,
  computeContextualWorldAction,
  getFootstepSurfaceKind,
  getLandmarkApproachPoint,
  getSurfaceHeightAt,
  groundHeightAt,
  isWalkablePosition,
} from './worldLogic';
import { createBoudhanathComplex } from './boudhanathComplex';
import { ProceduralTextureSet } from './proceduralTextures';

function makeMockTextureSet(): ProceduralTextureSet {
  const dummyTex = new THREE.Texture();
  const janakiProxy = new Proxy({}, { get: () => dummyTex });
  return new Proxy(
    { janaki: janakiProxy },
    {
      get(target, prop) {
        if (prop === 'janaki') return target.janaki;
        return dummyTex;
      },
    },
  ) as unknown as ProceduralTextureSet;
}

test('Only Boudhanath Stupa & Kora Plaza exists among stupa landmarks, separated >= 170m, and former Monkey Temple terrain is restored to flat natural valley ground', () => {
  const boudha = LANDMARKS.find((l) => l.id === 'boudhanath-stupa')!;
  const swayambhu = LANDMARKS.find((l) => l.id === 'swayambhunath-stupa');
  assert.ok(boudha, 'Boudhanath Stupa & Kora Plaza must exist in LANDMARKS');
  assert.equal(swayambhu, undefined, 'Swayambhunath Monkey Hilltop Temple must be removed');
  assert.ok(HERITAGE_GROUP_IDS.includes('boudhanath-stupa'));
  assert.equal(HERITAGE_GROUP_IDS.includes('swayambhunath-stupa'), false);

  const bMetrics = getBoudhaSeparationMetrics(LANDMARKS);
  assert.ok(bMetrics.toLumbiniMeters >= 190, `Boudha->Lumbini ${bMetrics.toLumbiniMeters}m < 190m`);
  assert.ok(bMetrics.toPashupatiMeters >= 260, `Boudha->Pashupati ${bMetrics.toPashupatiMeters}m < 260m`);
  assert.ok(bMetrics.toJanakiMeters >= 260, `Boudha->Janaki ${bMetrics.toJanakiMeters}m < 260m`);
  assert.ok(Math.hypot(boudha.position.x, boudha.position.z) < WORLD_RADIUS - 65);

  const bApproach = getLandmarkApproachPoint(boudha);
  assert.equal(isWalkablePosition(bApproach.x, bApproach.z), true, 'Boudhanath South Gate approach walkable');

  // Verify land around former Swayambhunath location (236, 120) is restored to natural low valley terrain (no 20m hill, no spur road)
  for (const [tx, tz] of [
    [236, 120],
    [270, 120],
    [304, 120],
    [220, 108],
    [252, 134],
  ]) {
    const h = groundHeightAt(tx, tz);
    const s = getSurfaceHeightAt(tx, tz);
    assert.ok(h > -2.0 && h < 3.0, `Restored terrain height at (${tx}, ${tz}) should be gentle natural ground, got ${h}`);
    assert.ok(Math.abs(s - h) < 0.05, `Surface height at (${tx}, ${tz}) should match natural terrain, got s=${s}, h=${h}`);
    assert.equal(getFootstepSurfaceKind(tx, tz), 'grass', `Surface at (${tx}, ${tz}) restored to natural grass`);
    assert.equal(isWalkablePosition(tx, tz), true, `Restored valley terrain at (${tx}, ${tz}) freely walkable`);
  }
});

test('Boudhanath 3-tier climbable Mandala, 4 cardinal stairs, 108 Kora wheels, and walkable Gompa work accurately', () => {
  const cx = BOUDHA_COMPLEX.centerX;
  const cz = BOUDHA_COMPLEX.centerZ;

  // Perimeter fence blocks outside gates, while South/East/North gates allow passage
  assert.equal(isBoudhanathWalkable(cx, cz + BOUDHA_COMPLEX.halfSize), true, 'South Kora Dwar open');
  assert.equal(isBoudhanathWalkable(cx + BOUDHA_COMPLEX.halfSize, cz), true, 'East Kora Gate open');
  assert.equal(isBoudhanathWalkable(cx, cz - BOUDHA_COMPLEX.halfSize), true, 'North Gate open');
  assert.equal(isBoudhanathWalkable(cx + 22, cz + BOUDHA_COMPLEX.halfSize), false, 'South fence solid');
  assert.equal(isBoudhanathWalkable(cx - BOUDHA_COMPLEX.halfSize, cz + 14), false, 'West fence solid');

  // Plaza sits cleanly at 0.35m and South cardinal stairs climb smoothly up Tiers 1 -> 2 -> 3
  assert.ok(Math.abs((getBoudhanathSurfaceY(cx, cz + 35) ?? 0) - BOUDHA_COMPLEX.plazaY) < 0.01);
  const yMid1 = getBoudhanathSurfaceY(cx, cz + 23.9)!;
  const yTier1 = getBoudhanathSurfaceY(cx, cz + 21.6)!;
  const yTier2 = getBoudhanathSurfaceY(cx, cz + 18.45)!;
  const yTier3 = getBoudhanathSurfaceY(cx, cz + 15.1)!;
  assert.ok(yMid1 > BOUDHA_COMPLEX.plazaY && yMid1 < BOUDHA_COMPLEX.tier1Y);
  assert.ok(Math.abs(yTier1 - BOUDHA_COMPLEX.tier1Y) < 0.05);
  assert.ok(Math.abs(yTier2 - BOUDHA_COMPLEX.tier2Y) < 0.05);
  assert.ok(Math.abs(yTier3 - BOUDHA_COMPLEX.tier3Y) < 0.05);
  assert.equal(isBoudhanathWalkable(cx, cz + 23.9), true);
  assert.equal(isBoudhanathWalkable(cx + 8, cz + 20.5), true, 'Upper Tier 1 terrace walkable');
  assert.equal(isBoudhanathWalkable(cx + 6, cz + 17.2), true, 'Upper Tier 2 terrace walkable');
  assert.equal(isBoudhanathWalkable(cx, cz + 15.1), true, 'Tier 3 circumambulation deck walkable');
  assert.equal(isInsideBoudhaMandalaTier(0, 15.1, BOUDHA_COMPLEX.tier3Radius), true);

  // Monumental Anda dome blocks pass-through at center
  assert.equal(isBoudhanathWalkable(cx, cz), false, 'Dome interior solid');
  assert.equal(isBoudhanathWalkable(cx + 5, cz + 5), false, 'Dome slope solid');

  // 108 spinning brass Kora prayer wheels exact count
  const koraWheels = getBoudha108PrayerWheelPlacements();
  assert.equal(koraWheels.length, 108);

  // Walkable Northern Gompa doorway & interior vs solid brick walls
  assert.equal(isBoudhanathWalkable(cx, cz + BOUDHA_COMPLEX.gompaMaxZ), true, 'Gompa South doorway open');
  assert.equal(isBoudhanathWalkable(cx, cz + BOUDHA_COMPLEX.gompaCenterZ + 1.5), true, 'Gompa hall interior walkable');
  assert.equal(isBoudhanathWalkable(cx + 8.0, cz + BOUDHA_COMPLEX.gompaMaxZ), false, 'Gompa facade wall solid');
  assert.ok(Math.abs(getSurfaceHeightAt(cx, cz + BOUDHA_COMPLEX.gompaCenterZ + 1.5) - BOUDHA_COMPLEX.gompaFloorY) < 0.01);
});

test('Contextual [E] actions trigger cleanly around Boudhanath Kora Plaza', () => {
  const boudhaWheels = getBoudha108PrayerWheelPlacements();
  const koraAction = computeContextualWorldAction(
    boudhaWheels[0].worldX,
    boudhaWheels[0].worldZ,
    null,
    [],
    [],
    [],
    [],
    [],
  );
  assert.equal(koraAction?.kind, 'spin-boudha-kora-wheels');

  const bowlAction = computeContextualWorldAction(
    BOUDHA_INTERACTIVE_SPOTS.gompaBowl.x,
    BOUDHA_INTERACTIVE_SPOTS.gompaBowl.z,
    null,
    [],
    [],
    [],
    [],
    [],
  );
  assert.equal(bowlAction?.kind, 'ring-boudha-singing-bowl');
});

test('3D builder createBoudhanathComplex assembles full geometry & interactive hooks cleanly', () => {
  const tex = makeMockTextureSet();
  const boudhaRes = createBoudhanathComplex(tex);

  boudhaRes.group.updateMatrixWorld(true);

  const bBox = new THREE.Box3().setFromObject(boudhaRes.group);
  assert.ok(bBox.max.y > 37.5, `Boudhanath pinnacle should reach ~38m, got ${bBox.max.y}`);

  assert.ok(boudhaRes.group.userData.boudhaKoraBrassInst instanceof THREE.InstancedMesh);
  assert.equal(boudhaRes.group.userData.boudhaKoraBrassInst.count, 108);
  assert.equal(typeof boudhaRes.group.userData.triggerBoudhaKoraWave, 'function');
  assert.equal(typeof boudhaRes.group.userData.triggerGompaBlessing, 'function');
});

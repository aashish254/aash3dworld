import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  DiscreteHudState,
  ShadowUpdateCheckInput,
  formatClockHour,
  hasDiscreteHudChanged,
  isWithinSleepDistanceSq,
  raySegmentHitsSphere,
  selectClosestIndicesZeroAlloc,
  shouldUpdateShadowMap,
  writeDirtyDatasetAttr,
} from './perfLogic';
import {
  getCachedMaterial,
  mergeStaticMeshesByMaterial,
} from './meshOptimization';

test('shouldUpdateShadowMap caches static frames and triggers on movement, sun shift, prop motion, or forceDirty', () => {
  const base: ShadowUpdateCheckInput = {
    targetX: 10,
    targetZ: 20,
    sunDirX: 0.4,
    sunDirY: 0.8,
    sunDirZ: 0.4472136,
  };
  assert.equal(shouldUpdateShadowMap(null, base, false, 0), true);
  assert.equal(shouldUpdateShadowMap(base, { ...base }, true, 0), true);
  assert.equal(shouldUpdateShadowMap(base, { ...base, targetX: 10.8, targetZ: 20.8 }, false, 0), false);
  assert.equal(shouldUpdateShadowMap(base, { ...base, targetX: 11.7, targetZ: 20 }, false, 0), true);
  assert.equal(shouldUpdateShadowMap(base, { ...base }, false, 0.2), true);
  assert.equal(
    shouldUpdateShadowMap(
      base,
      { targetX: 10, targetZ: 20, sunDirX: 0.45, sunDirY: 0.78, sunDirZ: 0.435 },
      false,
      0,
    ),
    true,
  );
});

test('isWithinSleepDistanceSq compares squared XZ distance without sqrt', () => {
  assert.equal(isWithinSleepDistanceSq(0, 0, 90, 0, 8100), true);
  assert.equal(isWithinSleepDistanceSq(0, 0, 91, 0, 8100), false);
  assert.equal(isWithinSleepDistanceSq(-210, 74, -150, 120, 8100), true);
});

test('selectClosestIndicesZeroAlloc picks K closest eligible lights in sorted distance order', () => {
  const posX = new Float64Array([100, 10, 30, 5, 50, 2]);
  const posZ = new Float64Array([0, 0, 0, 0, 0, 0]);
  const eligible = new Uint8Array([1, 1, 1, 0, 1, 1]); // index 3 (dist 5) ineligible
  const outIdx = new Int32Array(3);
  const outDistSq = new Float64Array(3);

  const count = selectClosestIndicesZeroAlloc(
    posX,
    posZ,
    eligible,
    posX.length,
    0,
    0,
    outIdx,
    outDistSq,
    3,
  );

  assert.equal(count, 3);
  assert.deepEqual(Array.from(outIdx), [5, 1, 2]);
  assert.deepEqual(Array.from(outDistSq), [4, 100, 900]);
});

test('hasDiscreteHudChanged ignores continuous coords/distance and fires on zone, landmark, action, meditation, or lumbini presets', () => {
  const base: DiscreteHudState = {
    zoneName: 'Kathmandu Valley',
    nearestLandmarkId: null,
    actionKind: null,
    actionIndex: null,
    actionLabel: null,
    isMeditating: false,
    showLumbiniPresets: false,
  };
  assert.equal(hasDiscreteHudChanged(null, base), true);
  assert.equal(hasDiscreteHudChanged(base, { ...base }), false);
  assert.equal(hasDiscreteHudChanged(base, { ...base, zoneName: 'Lumbini Sacred Garden' }), true);
  assert.equal(hasDiscreteHudChanged(base, { ...base, nearestLandmarkId: 'janaki-mandir' }), true);
  assert.equal(
    hasDiscreteHudChanged(base, {
      ...base,
      actionKind: 'spin-prayer-wheel',
      actionIndex: 2,
      actionLabel: 'Spin Prayer Wheel',
    }),
    true,
  );
  assert.equal(hasDiscreteHudChanged(base, { ...base, isMeditating: true }), true);
  assert.equal(hasDiscreteHudChanged(base, { ...base, showLumbiniPresets: true }), true);
});

test('formatClockHour and writeDirtyDatasetAttr behave cleanly', () => {
  assert.equal(formatClockHour(0.25), '12:15 AM');
  assert.equal(formatClockHour(13.5), '1:30 PM');

  const ds: Record<string, string | undefined> = {};
  const cache: Record<string, string> = {};
  assert.equal(writeDirtyDatasetAttr(ds, cache, 'weather', 'clear'), true);
  assert.equal(writeDirtyDatasetAttr(ds, cache, 'weather', 'clear'), false);
  assert.equal(ds.weather, 'clear');
  assert.equal(writeDirtyDatasetAttr(ds, cache, 'weather', 'mist'), true);
  assert.equal(ds.weather, 'mist');
});

test('raySegmentHitsSphere culls distant occluder spheres and catches intersecting ones', () => {
  // Segment from (0,2,0) -> (0,2,10) along +Z
  assert.equal(raySegmentHitsSphere(0, 2, 0, 0, 0, 1, 10, 0, 2, 5, 1.0, 0.5), true);
  assert.equal(raySegmentHitsSphere(0, 2, 0, 0, 0, 1, 10, 25, 2, 5, 2.0, 0.5), false);
  assert.equal(raySegmentHitsSphere(0, 2, 0, 0, 0, 1, 10, 0, 2, 18, 1.0, 0.5), false);
});

test('getCachedMaterial and mergeStaticMeshesByMaterial reduce draw calls while preserving noMerge and occluders', () => {
  const scope = {};
  const m1 = getCachedMaterial(scope, 'stone', () => new THREE.MeshStandardMaterial({ color: 0xccbbaa }));
  const m2 = getCachedMaterial(scope, 'stone', () => new THREE.MeshStandardMaterial({ color: 0x111111 }));
  assert.strictEqual(m1, m2);

  const root = new THREE.Group();
  const occSet = new Set<THREE.Object3D>();
  for (let i = 0; i < 6; i++) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), m1);
    wall.position.set(i * 2, 1, 0);
    wall.castShadow = true;
    wall.receiveShadow = true;
    occSet.add(wall);
    root.add(wall);
  }

  const interactiveSubtree = new THREE.Group();
  interactiveSubtree.userData.noMerge = true;
  const spinner = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 8), m1);
  interactiveSubtree.add(spinner);
  root.add(interactiveSubtree);

  const cameraOccludersOut: THREE.Object3D[] = [];
  const merged = mergeStaticMeshesByMaterial(root, {
    occluderSet: occSet,
    cameraOccludersOut,
  });

  assert.equal(merged.length, 1);
  assert.equal(cameraOccludersOut.length, 1);
  assert.equal(cameraOccludersOut[0].userData.isOccluder, true);
  assert.equal(spinner.parent, interactiveSubtree, 'noMerge subtree must remain intact');

  let meshCount = 0;
  root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) meshCount++;
  });
  assert.equal(meshCount, 2, '6 static walls merged to 1 + 1 interactive spinner = 2 meshes');
});

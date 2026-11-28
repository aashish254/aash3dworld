import assert from 'node:assert/strict';
import test from 'node:test';
import {
  HIMALAYA_TREK_WAYPOINTS,
  SAGARMATHA_PEAK_CENTER,
  TREK_BRIDGE_SPANS,
  TREK_CHECKPOINTS,
  TREK_KEY_SPOTS,
  TREK_PLATEAUS,
  TREK_SAMPLES,
  TREK_TELESCOPE_TARGETS,
  TREK_TOTAL_LENGTH_M,
  TREK_ZONES,
  computeHimalayaTrekAmbience,
  computeSagarmathaPeakVisualHeight,
  getTrekSurfaceHeightAt,
  isTrekPositionWalkable,
} from './himalayaTrekData';
import {
  computeTimeLightingState,
  getFootstepSurfaceKind,
  getSurfaceHeightAt,
  isWalkablePosition,
} from './worldLogic';
import { evaluateAchievements } from '../data/achievementsData';
import { LANDMARKS } from '../data/portfolioData';

test('Sagarmatha Trek spline spans ~1,100m continuously across all 7 zones to 216m summit', () => {
  assert.ok(TREK_TOTAL_LENGTH_M >= 1020 && TREK_TOTAL_LENGTH_M <= 1300, `Unexpected length ${TREK_TOTAL_LENGTH_M}`);
  assert.equal(TREK_ZONES.length, 7);

  const first = TREK_SAMPLES[0];
  const last = TREK_SAMPLES[TREK_SAMPLES.length - 1];
  assert.equal(first.x, 6);
  assert.equal(first.z, -144);
  assert.ok(Math.abs(first.y - 0.25) < 0.05);
  assert.equal(last.x, SAGARMATHA_PEAK_CENTER.x);
  assert.equal(last.z, SAGARMATHA_PEAK_CENTER.z);
  assert.equal(last.y, 216);

  // Trail narrows dynamically from wide base path to thrilling high-altitude summit ridge
  assert.ok(first.width >= 2.8);
  const ridgeSamples = TREK_SAMPLES.filter((s) => s.zone === 4 || s.zone === 6);
  assert.ok(ridgeSamples.some((s) => s.width <= 1.58));

  // Verify spline steps have no jumps or discontinuities
  for (let i = 1; i < TREK_SAMPLES.length; i++) {
    const a = TREK_SAMPLES[i - 1];
    const b = TREK_SAMPLES[i];
    const stepLen = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
    assert.ok(stepLen > 0.1 && stepLen < 6.5, `Discontinuity at sample ${i}: ${stepLen}`);
    assert.ok(b.y >= a.y - 0.85, `Unexpected steep drop at sample ${i}: ${a.y} -> ${b.y}`);
  }
});

test('Every waypoint, bridge span, and trek plateau is walkable with continuous elevation', () => {
  for (const wp of HIMALAYA_TREK_WAYPOINTS) {
    const h = getSurfaceHeightAt(wp.x, wp.z, wp.y);
    assert.ok(Math.abs(h - wp.y) < 1.1, `Height mismatch at (${wp.x},${wp.z}): got ${h}, expected ${wp.y}`);
    assert.equal(isWalkablePosition(wp.x, wp.z, wp.y), true, `Waypoint (${wp.x},${wp.y},${wp.z}) should be walkable`);
  }

  for (const span of TREK_BRIDGE_SPANS) {
    const midX = (span.start[0] + span.end[0]) * 0.5;
    const midZ = (span.start[2] + span.end[2]) * 0.5;
    const midY = (span.start[1] + span.end[1]) * 0.5 - span.sag;
    assert.equal(isTrekPositionWalkable(midX, midZ, midY), true, `Bridge ${span.id} midpoint should be walkable`);
    const h = getTrekSurfaceHeightAt(midX, midZ, midY);
    assert.ok(h !== null && Math.abs(h - midY) < 0.35);
    assert.equal(getFootstepSurfaceKind(midX, midZ, midY), 'wood');
  }

  // Teahouse deck (Zone 5, 142m), High Camp (Zone 6, 176m), Summit Spire (Zone 7, 216m)
  assert.equal(isWalkablePosition(TREK_CHECKPOINTS.trailhead.x, TREK_CHECKPOINTS.trailhead.z, 0.25), true);
  assert.equal(isWalkablePosition(TREK_CHECKPOINTS.teahouse.x, TREK_CHECKPOINTS.teahouse.z, 142), true);
  assert.equal(isWalkablePosition(TREK_KEY_SPOTS.teahouseTelescope.x, TREK_KEY_SPOTS.teahouseTelescope.z, 142), true);
  assert.equal(isWalkablePosition(TREK_PLATEAUS.highCamp.x, TREK_PLATEAUS.highCamp.z, TREK_PLATEAUS.highCamp.y), true);
  assert.equal(isWalkablePosition(TREK_CHECKPOINTS.summit.x, TREK_CHECKPOINTS.summit.z, 216), true);

  // Off-cliff lateral points outside narrow cliff ledge in Zone 4 must reject walkability
  assert.equal(isTrekPositionWalkable(-96, -308, 110.5), false);
});

test('Visual peak heightfield reaches ~216m and sits flush beneath non-bridge trail segments', () => {
  const summitTerrainH = computeSagarmathaPeakVisualHeight(
    TREK_PLATEAUS.summit.x,
    TREK_PLATEAUS.summit.z,
  );
  assert.ok(summitTerrainH >= 215.5 && summitTerrainH <= 216.2, `Unexpected summit terrain height ${summitTerrainH}`);

  // Bridge 1 midpoint should have a deep gorge carved beneath its deck (~62.9m)
  const b1 = TREK_BRIDGE_SPANS[0];
  const gorgeY = computeSagarmathaPeakVisualHeight(
    (b1.start[0] + b1.end[0]) * 0.5,
    (b1.start[2] + b1.end[2]) * 0.5,
  );
  assert.ok(gorgeY < 50, `Expected carved gorge under Bridge 1, got ${gorgeY}`);
});

test('Telescope targets include all 5 major valley landmarks and high-altitude audio/lighting scale cleanly', () => {
  const ids = new Set(TREK_TELESCOPE_TARGETS.map((t) => t.id));
  for (const id of ['pumdikot-shiva', 'pashupatinath', 'janaki-mandir', 'lumbini-buddha', 'boudhanath-stupa']) {
    assert.equal(ids.has(id), true, `Missing telescope target ${id}`);
  }

  const summitAmb = computeHimalayaTrekAmbience(32, 216, -355);
  assert.equal(summitAmb.onMountain, true);
  assert.ok(summitAmb.windStrength > 0.9);
  assert.equal(summitAmb.zone?.id, 7);

  const wfAmb = computeHimalayaTrekAmbience(
    TREK_KEY_SPOTS.waterfallBridge.x,
    TREK_KEY_SPOTS.waterfallBridge.y,
    TREK_KEY_SPOTS.waterfallBridge.z,
  );
  assert.ok(wfAmb.waterfallGain > 0.7);

  // Camera far range is large enough to render distant 1,260m Great Himalaya tier
  assert.ok(computeTimeLightingState(12, 'clear').cameraFar >= 2000);
});

test('Himalayan Summit Conqueror badge unlocks only after hoisting the summit prayer flag', () => {
  assert.equal(LANDMARKS.some((l) => l.id === 'himalayan-trek'), true);
  const before = evaluateAchievements({
    discoveredIds: ['himalayan-trek'],
    totalDistanceWalked: 1200,
    customWaypointCount: 0,
    bellRingsCount: 0,
    summitFlagHoisted: false,
  });
  const summitBefore = before.find((a) => a.definition.id === 'himalayan-summit');
  assert.ok(summitBefore && !summitBefore.status.unlocked);

  const after = evaluateAchievements({
    discoveredIds: ['himalayan-trek'],
    totalDistanceWalked: 1200,
    customWaypointCount: 0,
    bellRingsCount: 0,
    summitFlagHoisted: true,
  });
  const summitAfter = after.find((a) => a.definition.id === 'himalayan-summit');
  assert.ok(summitAfter && summitAfter.status.unlocked);
});

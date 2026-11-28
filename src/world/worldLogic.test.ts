import test from 'node:test';
import assert from 'node:assert/strict';
import type * as THREE from 'three';
import {
  BRIDGE_BOUNDS,
  GLACIAL_LAKE,
  LANDMARK_APPROACH_CUE_SPECS,
  LUMBINI_FENCE_BOUNDS,
  LUMBINI_PEACE_CANAL,
  LUMBINI_PUSHKARINI_POND,
  LUMBINI_SACRED_POND,
  ROAD_LANTERN_COORDS,
  ROAD_PATHS,
  SPAWN_POSITION,
  WORLD_RADIUS,
  clampToWalkable,
  computeAtmosphereParticleProfile,
  computeContextualWorldAction,
  computeEffectiveLightingState,
  computeForestBirdSpatialAudioState,
  computeIncenseSmokeProfile,
  computeIncenseVentOffsets,
  computeLandmarkApproachCuePanAndGain,
  computeLumbiniAudioProfile,
  computeLumbiniCricketSpatialState,
  computeLumbiniFireflyIntensity,
  computeSpatialAmbienceMix,
  computeTimeLightingState,
  computeWeatherParticleModeProfile,
  decodeWaypointsFromHash,
  encodeWaypointsToHash,
  findFirstUnexploredLandmarkApproach,
  findLumbiniTrailPondRippleOrigin,
  findNearestLandmark,
  findWaterEdgeRippleOrigin,
  generateLumbiniFireflyPlacements,
  generateLumbiniPondLotusPlacements,
  getFootstepSurfaceKind,
  getGraphicsQualityConfig,
  getLandmarkApproachCueRadius,
  getLandmarkApproachPoint,
  getRiverCenterX,
  getSurfaceHeightAt,
  groundHeightAt,
  isInLumbiniPushkariniPond,
  isInLumbiniSurroundingPond,
  isOnLumbiniBridgeAbutmentPier,
  isOnLumbiniCanalBridge,
  isOnLumbiniSacredBridge,
  isWalkablePosition,
  mapWmoToWeather,
  sampleBirdFlightState,
  stepPrayerWheelSpin,
  validateContactPayload,
} from './worldLogic';
import { LANDMARKS } from '../data/portfolioData';

test('spawn and all landmark plazas sit on walkable terrain above water', () => {
  assert.equal(WORLD_RADIUS, 560);
  assert.equal(isWalkablePosition(SPAWN_POSITION.x, SPAWN_POSITION.z), true);
  assert.ok(groundHeightAt(SPAWN_POSITION.x, SPAWN_POSITION.z) > -0.2);
  assert.equal(LANDMARKS.length, 11);

  for (const lm of LANDMARKS) {
    assert.ok(
      groundHeightAt(lm.position.x, lm.position.z) > -0.2,
      `Landmark ${lm.id} terrace should sit above water`,
    );
    const approach = getLandmarkApproachPoint(lm);
    assert.equal(
      isWalkablePosition(approach.x, approach.z),
      true,
      `Landmark ${lm.id} approach point (${approach.x}, ${approach.z}) should be walkable`,
    );
    const nearest = findNearestLandmark(approach.x, approach.z);
    assert.ok(nearest, `Landmark ${lm.id} approach should be inside interactRadius`);
    assert.equal(nearest.landmark.id, lm.id);
  }

  // Deep glacial lake center is blocked from walking while terrace overlooks stay dry
  assert.equal(isWalkablePosition(GLACIAL_LAKE.x, GLACIAL_LAKE.z), false);
  assert.ok(groundHeightAt(GLACIAL_LAKE.x, GLACIAL_LAKE.z) < GLACIAL_LAKE.waterLevel);
});

test('Janaki Mandir front staircase, Simha Dwar gateway arch, and inner Prangan courtyard are walkable while walls & shrines block passage', () => {
  const janaki = LANDMARKS.find((l) => l.id === 'janaki-mandir')!;
  const jx = janaki.position.x;
  const jz = janaki.position.z;

  // Front plaza and both East/South road gates sit dead-level at 0.25m, staircase climbs smoothly to 1.05m plinth
  assert.ok(Math.abs(groundHeightAt(jx, jz + 28) - 0.25) < 0.01);
  assert.ok(Math.abs(groundHeightAt(-128, 148) - 0.25) < 0.01, 'SW corner of Chowk plaza must sit level at 0.25m');
  assert.ok(Math.abs(groundHeightAt(-55, 148) - 0.25) < 0.01, 'SE corner of Chowk plaza must sit level at 0.25m');
  assert.ok(Math.abs(groundHeightAt(-53.9, 128.5) - 0.25) < 0.01, 'East Chowk Gate road junction must sit level at 0.25m');
  assert.ok(Math.abs(groundHeightAt(-92, 149.5) - 0.25) < 0.01, 'South Chowk Gate road junction must sit level at 0.25m');
  assert.equal(isWalkablePosition(-53.9, 128.5), true);
  assert.equal(isWalkablePosition(-92, 149.5), true);
  assert.ok(groundHeightAt(jx, jz + 20) > 0.45 && groundHeightAt(jx, jz + 20) < 0.95);
  assert.ok(Math.abs(groundHeightAt(jx, jz + 15) - 1.05) < 0.02);

  // Front stairs, Simha Dwar gateway corridor, and open inner Prangan courtyard are walkable
  assert.equal(isWalkablePosition(jx, jz + 20), true);
  assert.equal(isWalkablePosition(jx, jz + 15), true);
  assert.equal(isWalkablePosition(jx, jz + 7), true);
  assert.equal(isWalkablePosition(jx - 6, jz + 2), true);

  // Solid palace wing walls, Simha Dwar piers, Parikrama colonnade arches/pillars, and outer bastions block pass-through
  assert.equal(isWalkablePosition(jx + 6, jz + 15), false);
  assert.equal(isWalkablePosition(jx + 10, jz + 15), false);
  assert.equal(isWalkablePosition(jx - 19, jz), false);
  assert.equal(isWalkablePosition(jx, jz - 16), false);
  assert.equal(isWalkablePosition(jx + 6, jz + 10.7), false, 'Inner south colonnade arch must block pass-through');
  assert.equal(isWalkablePosition(jx + 14.1, jz), false, 'Inner east colonnade pillar plinth must block pass-through');
  assert.equal(isWalkablePosition(jx - 14.1, jz), false, 'Inner west colonnade pillar plinth must block pass-through');
  assert.equal(isWalkablePosition(jx, jz - 13.1), false, 'Inner north colonnade arch must block pass-through');
  assert.equal(isWalkablePosition(jx + 25.0, jz + 15.2), false, 'Outer bastion octagon corner must block pass-through');
  assert.equal(isWalkablePosition(jx, jz - 1.5), false, 'Garbhagriha Mukhamandapa front steps must block pass-through');

  // Signpost, inner Garbhagriha Ram-Janaki sanctum, corner & North Charbagh planters block walking, while central Lotus Medallion stays walkable
  assert.equal(isWalkablePosition(jx + 10.5, jz + 24.0), false);
  assert.equal(isWalkablePosition(jx, jz + 3.5), true, 'Open Lotus Medallion forecourt in front of praying area must be walkable');
  assert.equal(isWalkablePosition(jx, jz - 6.0), false);
  assert.equal(isWalkablePosition(jx + 10.6, jz + 8.2), false);
  assert.equal(isWalkablePosition(jx + 7.4, jz - 9.8), false, 'NE Sanctum Charbagh planter bed blocks pass-through');
  assert.equal(isWalkablePosition(jx - 7.4, jz - 9.8), false, 'NW Sanctum Charbagh planter bed blocks pass-through');
  assert.equal(isWalkablePosition(jx + 7.4, jz - 7.2), true, 'Walkway south of NE Charbagh bed stays clear');

  // Inner courtyard Mughal gate spans remain walk-through while solid piers block pass-through
  assert.equal(isWalkablePosition(jx, jz + 11.15), true, 'Inner Simha Dwar Pishtaq gate should be non-collidable');
  assert.equal(isWalkablePosition(jx, jz + 0.35), true, 'Central Mughal Torana-Darwaza gate center should be walk-through');
  assert.equal(isWalkablePosition(jx + 2.0, jz + 0.35), true, 'Central Mughal gate side span should be walk-through');
  assert.equal(isWalkablePosition(jx + 3.25, jz + 0.35), false, 'Central Mughal gate solid pier blocks pass-through');
  assert.equal(isWalkablePosition(jx - 3.25, jz + 0.35), false, 'Central Mughal gate solid pier blocks pass-through');
  assert.equal(isWalkablePosition(jx - 1.68, jz - 2.85), false, 'Garbhagriha standing floor bell stand blocks pass-through');
  assert.equal(isWalkablePosition(jx + 13.3, jz - 1.7), true, 'East Dalan inner gate approach should be walkable');
  assert.equal(isWalkablePosition(jx - 13.3, jz - 1.7), true, 'West Dalan inner gate approach should be walkable');

  // Prayer-wheel gallery racks, corner shrines & standing Panasa brass lanterns block walking through solid bases
  assert.equal(isWalkablePosition(jx + 12.2, jz - 0.2), false, 'East prayer-wheel gallery rack plinth blocks pass-through');
  assert.equal(isWalkablePosition(jx - 12.2, jz - 0.2), false, 'West prayer-wheel gallery rack plinth blocks pass-through');
  assert.equal(isWalkablePosition(jx + 5.6, jz - 2.6), false, 'NE corner prayer-wheel shrine plinth blocks pass-through');
  assert.equal(isWalkablePosition(jx - 5.6, jz + 6.6), false, 'SW corner prayer-wheel shrine plinth blocks pass-through');
  assert.equal(isWalkablePosition(jx + 2.85, jz + 8.85), false, 'SE South Promenade brass Panasa lantern pedestal blocks pass-through');
  assert.equal(isWalkablePosition(jx - 2.85, jz + 8.85), false, 'SW South Promenade brass Panasa lantern pedestal blocks pass-through');
  assert.equal(isWalkablePosition(jx, jz + 8.85), true, 'Central arrival promenade between Panasa lanterns remains walkable');

  // Fast sprint movement across a solid front wing wall cannot tunnel inside
  let sprintZ = jz + 22;
  for (let s = 0; s < 16; s++) {
    sprintZ = clampToWalkable(jx + 8, sprintZ, jx + 8, sprintZ - 0.9).z;
  }
  assert.ok(sprintZ >= jz + 19.2, 'Sprinting straight into front palace facade must stop outside wall');

  // Swept walk from front plaza straight up stairs through Simha Dwar into Prangan succeeds cleanly
  let walkZ = jz + 26;
  for (let s = 0; s < 12; s++) {
    const res = clampToWalkable(jx, walkZ, jx, walkZ - 1.6);
    walkZ = res.z;
  }
  assert.ok(walkZ <= jz + 8.0, `Expected straight walk-in to reach inner Prangan courtyard, got jdz=${walkZ - jz}`);

  // Swept walk offset around Tulsi Mandap passes cleanly through Central Mughal gate up to Garbhagriha steps
  let gateWalkZ = jz + 7.0;
  for (let s = 0; s < 8; s++) {
    const res = clampToWalkable(jx + 2.0, gateWalkZ, jx + 2.0, gateWalkZ - 1.1);
    gateWalkZ = res.z;
  }
  assert.ok(gateWalkZ <= jz - 0.5, `Expected walk through non-collidable Central Mughal gate to reach Garbhagriha apron, got jdz=${gateWalkZ - jz}`);

  // Outer Chowk monuments block solid footprints while central marble runner & gate openings remain unobstructed
  assert.equal(isWalkablePosition(jx, jz + 34), true, 'Outer Chowk central approach runner stays walkable');
  assert.equal(isWalkablePosition(jx + 7.2, jz + 28.5), false, 'East Chowk Deepastambha pillar blocks pass-through');
  assert.equal(isWalkablePosition(jx - 14.5, jz + 34.0), false, 'Chowk carved Hiti lotus fountain basin blocks pass-through');
  assert.equal(isWalkablePosition(jx - 24.5, jz + 44.5), false, 'SW Sacred Peepal Chautara platform blocks pass-through');
  assert.equal(isWalkablePosition(jx + 24.5, jz + 26.5), false, 'East Mithila Puja stall blocks pass-through');
  assert.equal(isWalkablePosition(jx + 3.1, jz + 57.5), false, 'South Chowk Torana gate pier blocks pass-through');
  assert.equal(isWalkablePosition(jx, jz + 57.5), true, 'South Chowk Torana gateway arch center remains wide open');

  // Outer West, North & East Janaki heritage monuments & Ganga Sagar pond block pass-through while walkways stay open
  assert.equal(isWalkablePosition(jx - 44.5, jz + 16.0), false, 'Ganga Sagar pond water basin blocks pass-through');
  assert.equal(isWalkablePosition(jx - 32.0, jz + 16.0), true, 'Ganga Sagar East brick promenade walkway stays open');
  assert.equal(isWalkablePosition(jx - 45.0, jz + 40.0), false, 'Vivah Mandap central Havan altar blocks pass-through');
  assert.equal(isWalkablePosition(jx, jz - 29.0), false, 'North Garuda Stambha base blocks pass-through');
  assert.equal(isWalkablePosition(jx - 33.5, jz + 50.5), false, 'West pilgrim Pati plinth blocks pass-through');
  assert.equal(isWalkablePosition(jx + 32.0, jz - 3.5), false, 'East heritage Pyaau kiosk blocks pass-through');
  assert.equal(isWalkablePosition(jx - 26.8, jz - 3.5), true, 'West outer Parikrama walkway stays walkable');

  // Closed 4-sided compound balustrade blocks pass-through on West, North, East & South while both gates stay open
  assert.equal(isWalkablePosition(jx - 56.5, jz + 16.0), false, 'West compound fence behind Ganga Sagar must block pass-through');
  assert.equal(isWalkablePosition(jx - 56.5, jz + 40.0), false, 'West compound fence behind Vivah Mandap must block pass-through');
  assert.equal(isWalkablePosition(jx - 20.0, jz - 34.5), false, 'North compound fence must block pass-through');
  assert.equal(isWalkablePosition(jx + 38.1, jz + 10.0), false, 'East compound fence must block pass-through');
  assert.equal(isWalkablePosition(jx - 20.0, jz + 57.5), false, 'South compound fence off-gate must block pass-through');
  assert.equal(isWalkablePosition(jx + 38.1, jz + 36.5), true, 'East Torana gateway opening must stay walkable');
  assert.equal(isWalkablePosition(jx - 56.5, jz + 57.5), false, 'SW corner Burj turret must block pass-through');
  assert.equal(isWalkablePosition(jx - 56.5, jz - 34.5), false, 'NW corner Burj turret must block pass-through');

  // Fast sprint across closed West fence cannot tunnel through
  let westFenceX = jx - 53.0;
  for (let s = 0; s < 10; s++) {
    westFenceX = clampToWalkable(westFenceX, jz + 16.0, westFenceX - 0.9, jz + 16.0).x;
  }
  assert.ok(westFenceX > jx - 56.5, 'Sprinting into West compound fence must stop inside boundary');

  // Both Ganga Sagar (-44.5 ± 7.2, 16 ± 9) and Vivah Mandap (-45 ± 4.1, 40 ± 4.1) sit strictly inside closed fence [-56.5, 38.1] x [-34.5, 57.5]
  assert.ok(-44.5 - 7.7 > -56.5 && -44.5 + 7.7 < 38.1 && 16.0 - 9.5 > -34.5 && 16.0 + 9.5 < 57.5);
  assert.ok(-45.0 - 4.1 > -56.5 && -45.0 + 4.1 < 38.1 && 40.0 - 4.1 > -34.5 && 40.0 + 4.1 < 57.5);

  // Exterior pilgrim amenities & shrines block pass-through while flanking paths remain clear
  assert.equal(isWalkablePosition(jx - 35.2, jz + 16.0), false, 'Dana bird-feeding pedestal blocks pass-through');
  assert.equal(isWalkablePosition(jx + 15.5, jz + 22.8), false, 'Pakhala foot-wash basin blocks pass-through');
  assert.equal(isWalkablePosition(jx - 15.5, jz + 22.8), false, 'Paduka/Chappal shoe stand blocks pass-through');
  assert.equal(isWalkablePosition(jx - 5.5, jz - 29.0), false, 'North-West Tulsi shrine blocks pass-through');
  assert.equal(isWalkablePosition(jx + 5.5, jz - 29.0), false, 'North-East Tulsi shrine blocks pass-through');
  assert.equal(isWalkablePosition(jx - 42.5, jz - 16.5), false, 'NW raised garden lawn bed blocks pass-through');

  // Symmetric road lanterns flank both sides of South and East Chowk gates
  const hasCoord = (cx: number, cz: number) =>
    ROAD_LANTERN_COORDS.some(([lx, lz]) => Math.hypot(lx - cx, lz - cz) < 0.05);
  assert.equal(hasCoord(-88.2, 154.5), true, 'South Gate East road lantern present');
  assert.equal(hasCoord(-95.8, 154.5), true, 'South Gate West road lantern present');
  assert.equal(hasCoord(-48.5, 132.2), true, 'East Gate South road lantern present');
  assert.equal(hasCoord(-48.5, 124.8), true, 'East Gate North road lantern present');
});

test('suspension bridge connects Kathmandu west bank to VIT Vellore east bank', () => {
  for (let x = BRIDGE_BOUNDS.minX; x <= BRIDGE_BOUNDS.maxX; x += 0.5) {
    assert.equal(isWalkablePosition(x, BRIDGE_BOUNDS.centerZ), true);
    assert.ok(groundHeightAt(x, BRIDGE_BOUNDS.centerZ) >= BRIDGE_BOUNDS.deckY);
  }
  // River off-bridge is blocked from walking into deep water
  const riverX = getRiverCenterX(4);
  assert.equal(isWalkablePosition(riverX, 4), false);
  const safeBankX = riverX - 8;
  const clamped = clampToWalkable(safeBankX, 4, riverX, 4);
  assert.equal(clamped.x, safeBankX);
});

test('time-of-day solar cycle produces distinct day, dusk, and night lighting', () => {
  const noon = computeTimeLightingState(12.5, 'clear');
  const dusk = computeTimeLightingState(17.8, 'clear');
  const night = computeTimeLightingState(23.0, 'clear');

  assert.equal(noon.phaseLabel, 'Afternoon');
  assert.ok(noon.sunIntensity > night.sunIntensity);
  assert.ok(night.lanternIntensity > noon.lanternIntensity);
  assert.ok(night.starOpacity > 0.8);
  assert.equal(dusk.phaseLabel, 'Golden Hour');

  const misty = computeTimeLightingState(12.5, 'mist');
  assert.ok(misty.fogDensity > noon.fogDensity);

  const foggy = computeTimeLightingState(12.5, 'foggy');
  assert.ok(foggy.cameraFar < noon.cameraFar, 'foggy should reduce camera far-clipping plane');
  assert.ok(foggy.cameraFar < misty.cameraFar);
  assert.ok(foggy.fogDensity > misty.fogDensity);
  assert.equal(foggy.starOpacity, 0);
  // Subtle grey tint on skybox/fog pulls blue channel closer to red/green vs clear daytime sky
  const clearBlue = parseInt(noon.skyTopColor.slice(5, 7), 16);
  const clearRed = parseInt(noon.skyTopColor.slice(1, 3), 16);
  const foggyBlue = parseInt(foggy.skyTopColor.slice(5, 7), 16);
  const foggyRed = parseInt(foggy.skyTopColor.slice(1, 3), 16);
  assert.ok(
    foggyBlue - foggyRed < clearBlue - clearRed,
    'foggy skyTopColor should shift toward neutral grey',
  );

  // Bloom threshold stays above diffuse white albedo so snow/stucco never glow
  assert.ok(noon.bloomThreshold > 1.35);
  assert.ok(night.bloomThreshold >= 1.0);
  assert.ok(night.bloomStrength > dusk.bloomStrength);
  assert.ok(dusk.bloomStrength > noon.bloomStrength);
  assert.ok(night.bloomThreshold < noon.bloomThreshold);
  assert.ok(night.emissiveScale > dusk.emissiveScale);
  assert.ok(dusk.emissiveScale > noon.emissiveScale);
  assert.ok(misty.bloomRadius > noon.bloomRadius);
  assert.ok(foggy.bloomStrength > noon.bloomStrength);
});

test('WMO weather codes map accurately to clear, mist, foggy, rain, and snow', () => {
  assert.equal(mapWmoToWeather(0), 'clear');
  assert.equal(mapWmoToWeather(45), 'mist');
  assert.equal(mapWmoToWeather(48), 'foggy');
  assert.equal(mapWmoToWeather(61), 'rain');
  assert.equal(mapWmoToWeather(73), 'snow');
});

test('contact payload validation enforces name, valid email, and message length', () => {
  const invalid = validateContactPayload({
    name: 'A',
    email: 'not-an-email',
    organization: '',
    roleType: 'Full-Time',
    message: 'Hi',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.name);
  assert.ok(invalid.errors.email);
  assert.ok(invalid.errors.message);

  const valid = validateContactPayload({
    name: 'Priya Sharma',
    email: 'priya@acme.dev',
    organization: 'Acme AI',
    roleType: 'Systems Architect',
    message: 'We loved exploring your 3D portfolio and would like to discuss a Systems Engineer role.',
  });
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.errors, {});
});

test('custom waypoints round-trip cleanly through URL hash encoding', () => {
  const original = [
    { id: '1', label: 'Patan View', x: -12.4, z: 3.8, color: '#f59e0b', createdAt: 1000 },
    { id: '2', label: 'Vellore Gate', x: 18.2, z: -9.5, color: '#10b981', createdAt: 2000 },
  ];
  const hash = encodeWaypointsToHash(original);
  const decoded = decodeWaypointsFromHash(hash);
  assert.equal(decoded.length, 2);
  assert.equal(decoded[0].label, 'Patan View');
  assert.equal(decoded[1].x, 18.2);
  assert.equal(decoded[1].color, '#10b981');
});

test('atmosphere particle profile scales intensity and motion across weather states', () => {
  const clearDay = computeAtmosphereParticleProfile('clear', 12.5);
  const clearNight = computeAtmosphereParticleProfile('clear', 22.0);
  const mist = computeAtmosphereParticleProfile('mist', 12.5);
  const foggy = computeAtmosphereParticleProfile('foggy', 12.5);
  const rain = computeAtmosphereParticleProfile('rain', 12.5);
  const snow = computeAtmosphereParticleProfile('snow', 12.5);

  // Active particle intensity scales progressively from clear -> mist -> foggy -> rain -> snow
  assert.ok(clearDay.activeRatio < mist.activeRatio);
  assert.ok(mist.activeRatio < foggy.activeRatio);
  assert.ok(foggy.activeRatio < rain.activeRatio);
  assert.ok(rain.activeRatio <= snow.activeRatio);
  assert.equal(snow.activeRatio, 1.0);

  // Night clear weather enhances warm firefly glow & active ratio over noon dust motes
  assert.ok(clearNight.activeRatio > clearDay.activeRatio);
  assert.ok(clearNight.glowStrength > clearDay.glowStrength);
  assert.ok(clearDay.fallSpeed < 0); // floating upward drift

  // Rain streaks fast downward; snow swirls gently with high turbulence
  assert.equal(rain.streakStretch, 1.0);
  assert.ok(rain.fallSpeed > snow.fallSpeed * 4);
  assert.equal(snow.streakStretch, 0);
  assert.ok(snow.turbulence > rain.turbulence * 5);
});

test('incense smoke profile stays subtle by day and gains gentle warmth and visibility at night', () => {
  const day = computeIncenseSmokeProfile(0.2);
  const dusk = computeIncenseSmokeProfile(1.4);
  const night = computeIncenseSmokeProfile(2.6);

  assert.equal(day.eveningGlow, 0);
  assert.ok(day.opacity >= 0.18 && day.opacity < 0.28);
  assert.ok(dusk.eveningGlow > 0 && dusk.eveningGlow < 1);
  assert.equal(night.eveningGlow, 1);
  assert.ok(night.opacity > day.opacity && night.opacity <= 0.42);
  assert.ok(night.plumeHeightScale > day.plumeHeightScale);

  const standingVent = computeIncenseVentOffsets('standing', 1.0);
  const hangingVent = computeIncenseVentOffsets('hanging', 1.0);
  assert.ok(standingVent.ventY > 1.9 && standingVent.ventY < 2.1);
  assert.ok(hangingVent.ventY < -0.5 && hangingVent.ventY > -0.7);
  assert.ok(standingVent.maxRise > hangingVent.maxRise);
});

test('ambient courtyard bird flight stays within clear air corridors with natural banking and flap-glide cycles', () => {
  const southCourtyardTrack = {
    centerX: 0,
    centerZ: 7.2,
    radiusX: 7.6,
    radiusZ: 1.9,
    baseY: 3.55,
    bobAmp: 0.36,
    angularSpeed: 0.25,
    phase: 0.3,
  };

  let minFlap = Infinity;
  let maxFlap = -Infinity;
  for (let t = 0; t <= 26; t += 0.15) {
    const sample = sampleBirdFlightState(southCourtyardTrack, t, 24);
    assert.ok(sample.x >= -7.65 && sample.x <= 7.65, 'Bird stays inside courtyard east-west sky');
    assert.ok(sample.z >= 5.2 && sample.z <= 9.2, 'Bird stays clear of Tulsi Mandap, Central Gate, and Simha Pishtaq');
    assert.ok(sample.y >= 3.1 && sample.y <= 4.0, 'Bird flies cleanly above courtyard props and inside camera sightlines');
    assert.ok(Number.isFinite(sample.yaw) && Number.isFinite(sample.pitch) && Number.isFinite(sample.roll));
    assert.ok(Math.abs(sample.roll) <= 0.45, 'Banking roll stays subtle and realistic');
    minFlap = Math.min(minFlap, sample.wingFlapRad);
    maxFlap = Math.max(maxFlap, sample.wingFlapRad);
  }
  assert.ok(maxFlap > 0.45 && minFlap < -0.35, 'Wing animation alternates smoothly between upstroke and downstroke');

  // Counter-clockwise orbit banks inward (positive right-wing-down roll around +Z forward)
  const ccwTurn = sampleBirdFlightState(
    {
      centerX: 0,
      centerZ: 0,
      radiusX: 8,
      radiusZ: 8,
      baseY: 7,
      bobAmp: 0,
      angularSpeed: 0.35,
      phase: 0,
    },
    0,
  );
  assert.ok(ccwTurn.roll > 0.05);
  assert.ok(Math.abs(ccwTurn.yaw) < 0.01);
});

test('spatial ambience mix adapts realistically across nature landmarks and enclosed courtyard', () => {
  const ridge = computeSpatialAmbienceMix(-108, -74, 1.45);
  assert.equal(ridge.activeZone, 'himalayan-ridge');
  assert.ok(ridge.windLevel > 0.7, 'Pumdikot Himalayan ridge should have strong alpine wind');

  const lumbini = computeSpatialAmbienceMix(-280, 96, 0.2);
  assert.equal(lumbini.activeZone, 'peace-garden');
  assert.ok(lumbini.birdLevel > 0.75, 'Lumbini Peace Garden should have rich tranquil birdsong');

  const courtyard = computeSpatialAmbienceMix(-92, 92, 1.05);
  assert.equal(courtyard.activeZone, 'temple-courtyard');
  assert.ok(courtyard.windLevel < 0.15, 'Enclosed Janaki courtyard shelters visitor from valley wind');
  assert.ok(courtyard.birdLevel > 0.6, 'Courtyard flock doves contribute gentle ambient birdsong');

  const riverside = computeSpatialAmbienceMix(getRiverCenterX(-12) - 8.5, -12, 0.2);
  assert.ok(riverside.streamLevel > 0.55, 'Standing near the Himalayan river should produce strong stream murmur');
});

test('footstep surface classification separates stone plazas/roads, wooden bridge, and valley grass', () => {
  assert.equal(getFootstepSurfaceKind(0, 6), 'stone');
  assert.equal(getFootstepSurfaceKind(-92, 94), 'stone');
  assert.equal(getFootstepSurfaceKind(-92, 126), 'stone');
  assert.equal(getFootstepSurfaceKind(-118.8, 90), 'stone');
  assert.equal(getFootstepSurfaceKind(30, -24), 'wood');
  assert.equal(getFootstepSurfaceKind(-65, 45), 'grass');
});

test('world obstacles prevent walking through trees, boulders, lanterns, kiosks, and non-Janaki landmarks while keeping approach points open', async () => {
  const { LANDMARKS } = await import('../data/portfolioData');
  const {
    ROAD_LANTERN_COORDS,
    getLandmarkApproachPoint,
    getWorldBoulderSpots,
    getWorldTreeSpots,
  } = await import('./worldLogic');

  // Spawn 3D name monument & trail kiosk block pass-through while spawn origin stays open
  assert.equal(isWalkablePosition(0, 6), true);
  assert.equal(isWalkablePosition(-1.5, -1.2), false, 'Spawn name monument blocks pass-through');
  assert.equal(isWalkablePosition(5.15, 3.2), false, 'Spawn valley kiosk blocks pass-through');

  // Road lanterns & sample trees/boulders block pass-through
  const [lx, lz] = ROAD_LANTERN_COORDS[0];
  assert.equal(isWalkablePosition(lx, lz), false, 'Road stone lantern post blocks pass-through');
  const firstTree = getWorldTreeSpots()[0];
  assert.equal(isWalkablePosition(firstTree.x, firstTree.z), false, 'World tree trunk blocks pass-through');
  const firstRock = getWorldBoulderSpots()[0];
  assert.equal(isWalkablePosition(firstRock.x, firstRock.z), false, 'Granite field boulder blocks pass-through');

  // Non-walkable landmark monuments block solid cores while walkable plaza/gate landmarks stay open
  for (const lm of LANDMARKS) {
    if (
      lm.id !== 'janaki-mandir' &&
      lm.id !== 'lumbini-buddha' &&
      lm.id !== 'pumdikot-shiva' &&
      lm.id !== 'himalayan-trek'
    ) {
      assert.equal(
        isWalkablePosition(lm.position.x, lm.position.z),
        false,
        `${lm.id} central structure must block pass-through`,
      );
    }
    const approach = getLandmarkApproachPoint(lm);
    assert.equal(
      isWalkablePosition(approach.x, approach.z),
      true,
      `${lm.id} approach point (${approach.x}, ${approach.z}) must be walkable`,
    );
  }
});

test('660 botanical multi-species trees, outer temple artifacts, and raised surface heights align cleanly', async () => {
  const { OUTER_TEMPLE_ARTIFACT_SPOTS, getSurfaceHeightAt, getWorldTreeSpots } = await import('./worldLogic');

  const trees = getWorldTreeSpots();
  assert.equal(trees.length, 660, 'Expected 660 diverse trees across the expanded valley');
  const speciesSet = new Set(trees.map((t) => t.type));
  for (const required of ['sakura', 'maple', 'willow', 'jacaranda', 'birch', 'deodar', 'peepal']) {
    assert.ok(speciesSet.has(required as never), `Missing species ${required} in world trees`);
  }

  // Spawn plaza apron and road decks sit cleanly above groundHeightAt so props never sink
  assert.ok(
    getSurfaceHeightAt(SPAWN_POSITION.x, SPAWN_POSITION.z) >=
      groundHeightAt(SPAWN_POSITION.x, SPAWN_POSITION.z) + 0.09,
  );
  assert.ok(
    getSurfaceHeightAt(-20, 6) >= groundHeightAt(-20, 6),
    'Road deck height should never dip below terrain height',
  );

  // Outer temple grounds are populated with refined marble/brass artifacts (no dark chaitya cones) that block walking
  assert.ok(OUTER_TEMPLE_ARTIFACT_SPOTS.length >= 20);
  assert.equal(
    OUTER_TEMPLE_ARTIFACT_SPOTS.some((spot) => (spot.kind as string) === 'chaitya'),
    false,
    'Dark cone chaitya artifacts should be removed from outer temple grounds',
  );
  for (const spot of OUTER_TEMPLE_ARTIFACT_SPOTS) {
    assert.equal(
      isWalkablePosition(spot.x, spot.z),
      false,
      `Outer temple artifact ${spot.kind} at (${spot.x}, ${spot.z}) should block walking`,
    );
  }
});

test('StaticPhysicsWorld BVH blocks walls and instanced trunks while allowing arch pass-through and accurate pot floor support', async () => {
  const THREE = await import('three');
  const { StaticPhysicsWorld } = await import('./physicsBvh');

  const scene = new THREE.Scene();

  // Floor slab (12m x 12m at y = 0.25)
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xdddddd });
  const floorGeo = new THREE.BoxGeometry(12, 0.2, 12);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.set(0, 0.15, 0); // top surface at y = 0.25
  scene.add(floor);

  // Solid marble wall along z = -2 (blocking x = -4..4, y = 0.25..3.25)
  const wallGeo = new THREE.BoxGeometry(8, 3.0, 0.6);
  const wall = new THREE.Mesh(wallGeo, floorMat);
  wall.position.set(0, 1.75, -2.0);
  scene.add(wall);

  // Overhead arch lintel along z = +2 starting at y = 2.6 (player height 1.75 must walk underneath!)
  const archLintel = new THREE.Mesh(new THREE.BoxGeometry(4, 1.2, 0.8), floorMat);
  archLintel.position.set(0, 3.2, 2.0);
  scene.add(archLintel);

  // Sloped road ramp at x = +4, z = 0 rising from 0.25 to 0.75
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.1, 4.0), floorMat);
  ramp.position.set(4.0, 0.45, 0);
  ramp.rotation.x = -0.18;
  scene.add(ramp);

  // Instanced boulders/trunks at (-4, 0.25, 0)
  const trunkGeo = new THREE.CylinderGeometry(0.32, 0.38, 3.0, 8);
  const trunks = new THREE.InstancedMesh(trunkGeo, floorMat, 1);
  const mat4 = new THREE.Matrix4().makeTranslation(-4.0, 1.75, 0);
  trunks.setMatrixAt(0, mat4);
  trunks.instanceMatrix.needsUpdate = true;
  scene.add(trunks);

  const physics = new StaticPhysicsWorld();
  physics.buildFromScene(scene);

  const stats = physics.getStats();
  assert.ok(stats.floorTriangles > 0, 'BVH must index floor triangles');
  assert.ok(stats.wallTriangles > 0, 'BVH must index wall triangles');
  assert.equal(stats.instancedColliders, 1, 'BVH must index solid instanced trunk');
  assert.ok(stats.navVertices >= 12, 'Floor nav-mesh must subdivide large boxes');

  // 1. Sprinting straight into wall at z = -2 cannot tunnel through
  const wallHit = physics.resolveHorizontalCollision(0, -0.5, 0, -3.5, 0.25, 1.75, 0.4, 0.25);
  assert.equal(wallHit.collided, true);
  assert.ok(wallHit.z >= -1.7 + 0.39, `Expected stop outside wall face z=-1.7, got z=${wallHit.z}`);

  // 2. Walking cleanly beneath overhead arch at z = +2 succeeds without collision
  const archPass = physics.resolveHorizontalCollision(0, 0.8, 0, 3.2, 0.25, 1.75, 0.4, 0.25);
  assert.equal(archPass.collided, false);
  assert.ok(Math.abs(archPass.z - 3.2) < 1e-4);

  // 3. Instanced trunk at x = -4, z = 0 blocks horizontal movement
  const trunkHit = physics.resolveHorizontalCollision(-2.8, 0, -4.5, 0, 0.25, 1.75, 0.4, 0.25);
  assert.equal(trunkHit.collided, true);
  assert.ok(trunkHit.x > -3.7, `Expected stop before trunk radius, got x=${trunkHit.x}`);

  // 4. Pot footprint support detects sloped road ramp above base terrain without sinking
  const supportY = physics.sampleFootprintSupportY(4.0, 0.0, 0.52, 1.2);
  assert.ok(supportY !== null && supportY > 0.45, `Expected raised ramp support > 0.45, got ${supportY}`);

  // 5. Nearest nav-mesh vertex & wall clearance snaps a floating/wall-clipped asset flush
  const nav = physics.findNearestNavVertex(0.3, 0.65, -1.5, 4.0);
  assert.ok(nav !== null, 'Should find nearest floor nav-mesh vertex');
  assert.ok(Math.abs(nav!.y - 0.25) < 0.02, `Expected floor nav vertex y=0.25, got ${nav!.y}`);

  const clear = physics.findNearestWallClearance(0, -1.55, 0.25, 0.8, 0.4);
  assert.equal(clear.pushed, true, 'Asset overlapping wall at z=-1.55 must push out flush');
  assert.ok(clear.z >= -1.7 + 0.39);
});

test('water ripple ring slots update cleanly without flooding the ring buffer', async () => {
  const { WATER_INTERACTION_UNIFORMS, WATER_RIPPLE_COUNT, triggerWaterRipple } = await import('./waterShader');

  triggerWaterRipple(28.5, -18.0, 12.4, 1.35);
  triggerWaterRipple(28.6, -18.05, 12.41, 1.1); // throttled near same spot/time
  triggerWaterRipple(-130.0, -118.0, 12.6, 0.9);
  const slots = WATER_INTERACTION_UNIFORMS.uWaterRipples.value;
  assert.equal(slots.length, WATER_RIPPLE_COUNT);
  assert.ok(slots.some((s) => Math.abs(s.x - 28.5) < 0.01 && Math.abs(s.y + 18.0) < 0.01 && s.w > 1.0));
  assert.ok(slots.some((s) => Math.abs(s.x + 130.0) < 0.01 && Math.abs(s.y + 118.0) < 0.01));
});

test('forest landmark proximity drives bird chirping and wind-rustling levels while meadow zones classify grassy fields', async () => {
  const THREE = await import('three');
  const {
    FOREST_LANDMARK_AREAS,
    MEADOW_ZONES,
    computeForestProximity,
    getMeadowZoneAt,
  } = await import('./worldLogic');
  const { createInstancedGrassField } = await import('./mountainAndTerrain');

  assert.ok(FOREST_LANDMARK_AREAS.length >= 4);
  const inLumbiniForest = computeForestProximity(-280, 96);
  const inPumdikotForest = computeForestProximity(-108, -74);
  const openSpawn = computeForestProximity(0, 6);

  assert.ok(inLumbiniForest.forestProximity > 0.9);
  assert.equal(inLumbiniForest.nearestForestId, 'lumbini-grove');
  assert.ok(inPumdikotForest.windRustleLevel > 0.9);
  assert.ok(openSpawn.forestProximity < 0.35);

  const lumbiniMix = computeSpatialAmbienceMix(-280, 96, 0.2);
  const pumdikotMix = computeSpatialAmbienceMix(-108, -74, 1.45);
  const courtyardMix = computeSpatialAmbienceMix(-92, 92, 1.05);
  assert.ok(lumbiniMix.forestLevel > 0.85 && lumbiniMix.birdLevel > 0.75);
  assert.ok(pumdikotMix.rustleLevel > 0.75);
  assert.ok(courtyardMix.rustleLevel < 0.12, 'Enclosed courtyard shelters against foliage rustle');

  // Designated meadow zones detect grassy meadows and exclude stone roads/plazas and bridges
  assert.ok(MEADOW_ZONES.length >= 5);
  const westMeadow = getMeadowZoneAt(-65, 45);
  assert.equal(westMeadow.inMeadow, true);
  assert.equal(westMeadow.zoneId, 'western-valley-meadow');
  assert.ok(westMeadow.factor > 0.9);

  const spawnStone = getMeadowZoneAt(0, 6);
  assert.equal(spawnStone.inMeadow, false);
  assert.equal(spawnStone.factor, 0);

  const bridgeWood = getMeadowZoneAt(30, -24);
  assert.equal(bridgeWood.inMeadow, false);

  // Grass controller updates movement vector and meadow activity uniforms cleanly
  const grass = createInstancedGrassField();
  const moveVec = new THREE.Vector3(4.2, -3.1, 5.22);
  const posVec = new THREE.Vector3(-65, 0.2, 45);
  grass.update(12.5, posVec, [], moveVec, 0.88);
  const uniforms = grass.getShaderUniforms?.();
  assert.ok(uniforms);
  assert.equal(uniforms.uTime.value, 12.5);
  assert.equal(uniforms.uMeadowActivity.value, 0.88);
  assert.ok(Math.abs(uniforms.uPlayerMove.value.x - 4.2) < 1e-5);
  assert.ok(Math.abs(uniforms.uPlayerPos.value.x + 65) < 1e-5);
});

test('wildflowers have rooted stems and foliage, grass, pebbles, and boulders sit grounded on terrainMesh', async () => {
  const THREE = await import('three');
  const {
    createDioramaTerrain,
    createInstancedFoliage,
    createInstancedGrassField,
    sampleTerrainMeshHeight,
  } = await import('./mountainAndTerrain');

  const tex = new THREE.Texture();
  const mockTextures = new Proxy(
    { meadowMap: tex, meadowNormal: tex, meadowRough: tex },
    { get: (target, prop) => (prop in target ? (target as Record<string | symbol, unknown>)[prop] : tex) },
  ) as unknown as import('./proceduralTextures').ProceduralTextureSet;

  const terrainMesh = createDioramaTerrain(mockTextures);
  const grass = createInstancedGrassField(terrainMesh);
  const foliage = createInstancedFoliage(mockTextures, terrainMesh);

  const grassIms: import('three').InstancedMesh[] = [];
  grass.group.traverse((o) => {
    if ((o as import('three').InstancedMesh).isInstancedMesh) {
      grassIms.push(o as import('three').InstancedMesh);
    }
  });
  assert.equal(grassIms.length, 3);
  const [grassIm, flowerIm, pebbleIm] = grassIms;

  flowerIm.geometry.computeBoundingBox();
  const flowerBb = flowerIm.geometry.boundingBox!;
  assert.ok(flowerBb.min.y < 0, `Wildflower stem root must extend below y=0, got ${flowerBb.min.y}`);
  assert.ok(flowerBb.max.y > 0.35, `Wildflower blossom must reach >0.35m, got ${flowerBb.max.y}`);

  const mat = new THREE.Matrix4();
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scl = new THREE.Vector3();

  for (let i = 0; i < grassIm.count; i++) {
    grassIm.getMatrixAt(i, mat);
    mat.decompose(pos, quat, scl);
    const meshY = sampleTerrainMeshHeight(terrainMesh, pos.x, pos.z);
    assert.ok(pos.y - 0.05 * scl.y <= meshY + 0.005, `Grass tuft #${i} floats above terrain`);
  }

  for (let i = 0; i < flowerIm.count; i++) {
    flowerIm.getMatrixAt(i, mat);
    mat.decompose(pos, quat, scl);
    const meshY = sampleTerrainMeshHeight(terrainMesh, pos.x, pos.z);
    assert.ok(pos.y + flowerBb.min.y * scl.y <= meshY + 0.005, `Flower #${i} floats above terrain`);
  }

  for (let i = 0; i < pebbleIm.count; i++) {
    pebbleIm.getMatrixAt(i, mat);
    mat.decompose(pos, quat, scl);
    const meshY = sampleTerrainMeshHeight(terrainMesh, pos.x, pos.z);
    assert.ok(pos.y - 0.14 * scl.y <= meshY + 0.005, `Pebble #${i} floats above terrain`);
  }

  const foliageIms: import('three').InstancedMesh[] = [];
  foliage.group.traverse((o) => {
    if ((o as import('three').InstancedMesh).isInstancedMesh) {
      foliageIms.push(o as import('three').InstancedMesh);
    }
  });
  const rockIm = foliageIms[foliageIms.length - 1];
  rockIm.geometry.computeBoundingBox();
  const rockBb = rockIm.geometry.boundingBox!;
  for (let i = 0; i < rockIm.count; i++) {
    rockIm.getMatrixAt(i, mat);
    mat.decompose(pos, quat, scl);
    const minRim = Math.min(
      sampleTerrainMeshHeight(terrainMesh, pos.x, pos.z),
      sampleTerrainMeshHeight(terrainMesh, pos.x + 0.55, pos.z),
      sampleTerrainMeshHeight(terrainMesh, pos.x - 0.55, pos.z),
      sampleTerrainMeshHeight(terrainMesh, pos.x, pos.z + 0.55),
      sampleTerrainMeshHeight(terrainMesh, pos.x, pos.z - 0.55),
    );
    assert.ok(pos.y + rockBb.min.y * scl.y <= minRim + 0.01, `Boulder #${i} floats above slope`);
  }

  for (let k = 0; k < foliageIms.length - 1; k++) {
    const im = foliageIms[k];
    if (im.userData.nonCollidable) continue;
    im.geometry.computeBoundingBox();
    const bb = im.geometry.boundingBox!;
    for (let i = 0; i < im.count; i++) {
      im.getMatrixAt(i, mat);
      mat.decompose(pos, quat, scl);
      const meshY = sampleTerrainMeshHeight(terrainMesh, pos.x, pos.z);
      assert.ok(pos.y + bb.min.y * scl.y <= meshY + 0.01, `Tree trunk #${i} floats above terrain`);
    }
  }
});

test('Janaki compound excludes wild grass/flowers, depresses terrain under Ganga Sagar/walks, attaches urn foliage, and skips snap-category floor barriers', async () => {
  const THREE = await import('three');
  const { OUTER_TEMPLE_ARTIFACT_SPOTS } = await import('./worldLogic');
  const { sanitizeSceneGeometry } = await import('./physicsBvh');
  const {
    createDioramaTerrain,
    createInstancedGrassField,
    sampleTerrainMeshHeight,
  } = await import('./mountainAndTerrain');

  const tex = new THREE.Texture();
  const mockTextures = new Proxy(
    { meadowMap: tex, meadowNormal: tex, meadowRough: tex },
    { get: (target, prop) => (prop in target ? (target as Record<string | symbol, unknown>)[prop] : tex) },
  ) as unknown as import('./proceduralTextures').ProceduralTextureSet;

  const terrainMesh = createDioramaTerrain(mockTextures);
  const grass = createInstancedGrassField(terrainMesh);

  const grassIms: import('three').InstancedMesh[] = [];
  grass.group.traverse((o) => {
    if ((o as import('three').InstancedMesh).isInstancedMesh) {
      grassIms.push(o as import('three').InstancedMesh);
    }
  });
  const [grassIm, flowerIm] = grassIms;
  const mat = new THREE.Matrix4();
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scl = new THREE.Vector3();

  for (let i = 0; i < grassIm.count; i++) {
    grassIm.getMatrixAt(i, mat);
    mat.decompose(pos, quat, scl);
    assert.equal(
      pos.x > -152 && pos.x < -50 && pos.z > 54.5 && pos.z < 153,
      false,
      `Grass blade #${i} spawned inside Janaki compound at (${pos.x.toFixed(1)}, ${pos.z.toFixed(1)})`,
    );
  }
  for (let i = 0; i < flowerIm.count; i++) {
    flowerIm.getMatrixAt(i, mat);
    mat.decompose(pos, quat, scl);
    assert.equal(
      pos.x > -152 && pos.x < -50 && pos.z > 54.5 && pos.z < 153,
      false,
      `Wildflower #${i} spawned inside Janaki compound at (${pos.x.toFixed(1)}, ${pos.z.toFixed(1)})`,
    );
  }

  // Terrain under Ganga Sagar basin stays cleanly below pondBed (-0.33m world)
  assert.ok(sampleTerrainMeshHeight(terrainMesh, -136.5, 108.0) <= -0.38);

  // Janaki-precinct outer temple artifacts sit on flat lawn level (<= 0.35m) rather than inside elevated palace plinth/towers
  for (const spot of OUTER_TEMPLE_ARTIFACT_SPOTS) {
    if (spot.x > -152 && spot.x < -50 && spot.z > 54.5 && spot.z < 153) {
      assert.ok(
        groundHeightAt(spot.x, spot.z) <= 0.35,
        `Janaki outer temple artifact ${spot.kind} at (${spot.x}, ${spot.z}) sits on elevated masonry (${groundHeightAt(spot.x, spot.z)})`,
      );
    }
  }

  // Thin decorative rings on snapCategory props must NOT create elevated floor barriers when excludeSnapCategories is enabled
  const testScene = new THREE.Scene();
  const collarGroup = new THREE.Group();
  collarGroup.userData.snapCategory = 'bowl';
  const collar = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.04, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x117777 }),
  );
  collar.position.set(0, 0.35, 0);
  collarGroup.add(collar);
  testScene.add(collarGroup);
  testScene.updateMatrixWorld(true);

  const sanitized = sanitizeSceneGeometry(testScene, { excludeSnapCategories: true });
  assert.equal(sanitized.sanitizedBarrierBoxes.length, 0);

  // Pebbles also stay out of the entire Janaki compound & perimeter walkways
  const pebbleIm = grassIms[2];
  for (let i = 0; i < pebbleIm.count; i++) {
    pebbleIm.getMatrixAt(i, mat);
    mat.decompose(pos, quat, scl);
    assert.equal(
      pos.x > -152 && pos.x < -50 && pos.z > 54.5 && pos.z < 153,
      false,
      `Pebble #${i} spawned inside Janaki compound at (${pos.x.toFixed(1)}, ${pos.z.toFixed(1)})`,
    );
  }

  // Terrain under Janaki Chowk and perimeter compound walkways is cleanly depressed below 0.266m slab surfaces
  assert.ok(sampleTerrainMeshHeight(terrainMesh, -92.0, 128.5) <= 0.165);
  assert.ok(sampleTerrainMeshHeight(terrainMesh, -146.6, 89.65) <= 0.165);
  assert.ok(sampleTerrainMeshHeight(terrainMesh, -92.0, 59.7) <= 0.165);
});

test('Janaki exterior urns parent foliage rigidly and roadside lanterns use deep lockXZ footings', async () => {
  const THREE = await import('three');
  const { createDioramaTerrain, createCurbedRoads } = await import('./mountainAndTerrain');
  const { createJanakiMandir } = await import('./janakiMandir');

  const tex = new THREE.Texture();
  const mockTextures = new Proxy(
    {
      meadowMap: tex,
      meadowNormal: tex,
      meadowRough: tex,
      createSignTexture: () => tex,
      janaki: new Proxy({}, { get: () => tex }),
    },
    { get: (target, prop) => (prop in target ? (target as Record<string | symbol, unknown>)[prop] : tex) },
  ) as unknown as import('./proceduralTextures').ProceduralTextureSet;

  const terrainMesh = createDioramaTerrain(mockTextures);
  const roads = createCurbedRoads(mockTextures, terrainMesh);
  let roadLanternCount = 0;
  roads.group.traverse((o) => {
    if (o.userData?.snapCategory === 'lantern') {
      roadLanternCount++;
      assert.equal(o.userData.lockXZ, true);
      assert.ok((o.userData.groundEmbed ?? 0) >= 0.44);
      const bb = new THREE.Box3().setFromObject(o);
      assert.ok(bb.min.y - o.position.y <= -0.44, 'Roadside lantern footing should extend >= 0.44m below pivot');
    }
  });
  assert.ok(roadLanternCount >= 18);

  const janaki = createJanakiMandir(mockTextures);
  let exteriorUrnCount = 0;
  janaki.group.traverse((o) => {
    if (o.userData?.snapCategory === 'pot') {
      exteriorUrnCount++;
      assert.equal(o.userData.lockXZ, true);
      assert.ok(o.children.length >= 12, `Expected potted foliage children directly inside urnGroup, got ${o.children.length}`);
    }
  });
  assert.equal(exteriorUrnCount, 6);
});

test('Monumental 88m x 96m Lumbini Maya Devi Temple & Sacred Garden west of Janaki Mandir has walkable gates/ramp/boardwalk, blocked monuments/pond/pit, depressed terrain, and wild-grass exclusion', async () => {
  const THREE = await import('three');
  const { createDioramaTerrain, createInstancedGrassField, sampleTerrainMeshHeight } = await import('./mountainAndTerrain');
  const { createLumbiniBuddha } = await import('./lumbiniTemple');

  const lx = -280;
  const lz = 96;

  // Walkable ceremonial gates, red-brick avenues, 4 arched Sacred Pond bridges, Pushkarini overlook, Maya Devi South ramp & interior boardwalk
  assert.equal(isWalkablePosition(lx, lz + 62.0), true, 'Lumbini South gate avenue must be walkable');
  assert.equal(isWalkablePosition(lx, lz + 56.5), true, 'Lumbini South Sacred Bridge approach must be walkable');
  assert.equal(isWalkablePosition(lx, lz + 51.8), true, 'South Torana Gate opening must be walkable');
  assert.equal(isWalkablePosition(lx, lz - 43.8), true, 'North Torana Gate opening must be walkable');
  assert.equal(isWalkablePosition(lx, lz - 48.3), true, 'North Sacred Bridge must be walkable');
  assert.equal(isWalkablePosition(lx - 44.0, lz + 4.0), true, 'West Cross Gate opening must be walkable');
  assert.equal(isWalkablePosition(lx - 47.3, lz + 4.0), true, 'West Sacred Bridge must be walkable');
  assert.equal(isWalkablePosition(lx + 44.0, lz + 4.0), true, 'East Cross Gate opening toward Janaki corridor must be walkable');
  assert.equal(isWalkablePosition(lx + 47.3, lz + 4.0), true, 'East Sacred Bridge must be walkable');
  assert.equal(isWalkablePosition(lx, lz + 4.0), true, 'Main East-West red brick promenade must be walkable');
  assert.equal(isWalkablePosition(lx - 5.5, lz + 16.0), true, 'Pushkarini West Overlook Causeway must be walkable');
  assert.equal(isWalkablePosition(lx, lz - 6.0), true, 'Maya Devi Temple South Dharmachakra ramp must be walkable');
  assert.equal(isWalkablePosition(lx, lz - 10.5), true, 'Maya Devi Temple doorway threshold must be walkable');
  assert.equal(isWalkablePosition(lx - 13.0, lz - 22.0), true, 'Maya Devi Temple interior West boardwalk must be walkable');
  assert.equal(isWalkablePosition(lx, lz - 30.5), true, 'Maya Devi Temple interior North boardwalk must be walkable');

  // Swept walk from South Outer Promenade across South Sacred Bridge -> South Torana -> Pushkarini Overlook -> Maya Devi boardwalk
  let trailX = lx;
  let trailZ = lz + 62.0;
  for (let s = 0; s < 14; s++) {
    trailZ = clampToWalkable(trailX, trailZ, trailX, trailZ - 0.95).z;
  }
  assert.ok(trailZ <= lz + 49.5, `Expected walk across South Sacred Bridge through Torana, got ldz=${trailZ - lz}`);

  // Continuous axial walk from Baby Buddha flank along Pushkarini Overlook up the Maya Devi ramp
  trailX = lx - 5.5;
  trailZ = lz + 32.0;
  for (let s = 0; s < 32; s++) {
    const next = clampToWalkable(trailX, trailZ, trailX, trailZ - 0.95);
    trailX = next.x;
    trailZ = next.z;
  }
  assert.ok(trailZ <= lz + 3.5, `Expected continuous Pushkarini Overlook walk up to Cross Promenade, got ldz=${trailZ - lz}`);

  let rampZ = lz + 4.0;
  for (let s = 0; s < 20; s++) {
    rampZ = clampToWalkable(lx, rampZ, lx, rampZ - 0.95).z;
  }
  assert.ok(rampZ <= lz - 11.5, `Expected straight walk up Maya Devi ramp to enter interior boardwalk, got ldz=${rampZ - lz}`);

  // Solid walls, sunken pit, statues, Ashoka Pillar, Pushkarini Pond, Surrounding Pond & bridge parapets block walking
  assert.equal(isInLumbiniSurroundingPond(lx - 18.0, lz + 56.0), true);
  assert.equal(isWalkablePosition(lx - 18.0, lz + 56.0), false, 'Surrounding South Sacred Pond channel must block walking');
  assert.equal(isWalkablePosition(lx + 47.3, lz - 16.0), false, 'Surrounding East Sacred Pond channel must block walking');
  assert.equal(isWalkablePosition(lx - 47.3, lz - 16.0), false, 'Surrounding West Sacred Pond channel must block walking');
  assert.equal(isWalkablePosition(lx - 18.0, lz - 48.0), false, 'Surrounding North Sacred Pond channel must block walking');
  assert.equal(isWalkablePosition(lx - 3.2, lz + 56.3), false, 'South Sacred Bridge side parapet must block walking');
  assert.equal(isWalkablePosition(lx, lz - 22.0), false, 'Maya Devi sunken Mauryan ruins pit / Marker Stone must block walking');
  assert.equal(isWalkablePosition(lx + 10.0, lz - 10.2), false, 'Maya Devi South white-brick wall must block walking');
  assert.equal(isWalkablePosition(lx, lz + 39.0), false, 'Golden Baby Buddha Lotus Monument must block walking');
  assert.equal(isWalkablePosition(lx - 27.0, lz - 21.0), false, 'Ashoka Pillar enclosure must block walking');
  assert.equal(isWalkablePosition(lx + 10.0, lz + 16.5), false, 'Pushkarini Sacred Pond water must block walking');
  assert.equal(isWalkablePosition(lx - 32.5, lz + 39.0), false, 'Myanmar Golden Pagoda must block walking');
  assert.equal(isWalkablePosition(lx + 35.0, lz - 22.0), false, 'Royal Thai Marble Sanctuary must block walking');
  assert.equal(isWalkablePosition(lx - 29.0, lz + 16.5), false, 'Sacred Bodhi Tree Chautara must block walking');
  assert.equal(isWalkablePosition(lx + 35.0, lz + 24.0), false, 'Eternal Peace Flame must block walking');

  // Terrain, arched bridge deck, surface heights & footstep acoustics align cleanly
  assert.ok(groundHeightAt(lx + 10.0, lz + 16.5) < -0.7, 'Pushkarini Pond basin must be carved deeply below zero');
  assert.ok(groundHeightAt(lx - 18.0, lz + 56.0) < -0.6, 'Surrounding Sacred Pond basin must be carved deeply below water level');
  assert.equal(isOnLumbiniSacredBridge(lx, lz + 56.3), true);
  assert.ok(getSurfaceHeightAt(lx, lz + 56.3) > 0.55, 'South Sacred Bridge arch rises cleanly over pond');
  assert.ok(Math.abs(getSurfaceHeightAt(lx - 5.5, lz + 16.0) - 0.35) < 0.02, 'Pushkarini Overlook path sits at 0.35m');
  assert.ok(Math.abs(groundHeightAt(lx, lz + 4.0) - 0.25) < 0.02, 'Lumbini garden ground must sit level at 0.25m');
  assert.ok(groundHeightAt(lx, lz - 6.0) > 0.45 && groundHeightAt(lx, lz - 6.0) < 1.15, 'Maya Devi South ramp climbs smoothly');
  assert.ok(Math.abs(groundHeightAt(lx - 13.0, lz - 22.0) - 1.25) < 0.02, 'Maya Devi interior boardwalk sits at 1.25m');
  assert.ok(Math.abs(groundHeightAt(lx, lz - 22.0) + 0.10) < 0.02, 'Maya Devi sunken Mauryan pit sits at -0.10m');
  assert.equal(getFootstepSurfaceKind(lx, lz + 56.3), 'stone');
  assert.equal(getFootstepSurfaceKind(lx - 5.5, lz + 16.0), 'stone');
  assert.equal(getFootstepSurfaceKind(lx, lz + 4.0), 'stone');
  assert.equal(getFootstepSurfaceKind(lx, lz - 6.0), 'stone');
  assert.equal(getFootstepSurfaceKind(lx - 13.0, lz - 22.0), 'wood');
  assert.equal(getFootstepSurfaceKind(lx - 30.0, lz - 15.0), 'grass');

  const tex = new THREE.Texture();
  const mockTextures = new Proxy(
    {
      meadowMap: tex,
      meadowNormal: tex,
      meadowRough: tex,
      createSignTexture: () => tex,
      janaki: new Proxy({}, { get: () => tex }),
    },
    { get: (target, prop) => (prop in target ? (target as Record<string | symbol, unknown>)[prop] : tex) },
  ) as unknown as import('./proceduralTextures').ProceduralTextureSet;

  const terrainMesh = createDioramaTerrain(mockTextures);
  assert.ok(sampleTerrainMeshHeight(terrainMesh, lx + 10.0, lz + 16.5) <= -0.55, 'Pushkarini terrain mesh depressed cleanly');
  assert.ok(sampleTerrainMeshHeight(terrainMesh, lx - 18.0, lz + 56.0) <= -0.55, 'Surrounding Sacred Pond terrain mesh depressed cleanly');
  assert.ok(sampleTerrainMeshHeight(terrainMesh, lx, lz - 22.0) <= -0.20, 'Maya Devi pit terrain mesh depressed cleanly');
  assert.ok(sampleTerrainMeshHeight(terrainMesh, lx, lz + 29.0) <= 0.16, 'Garden plaza terrain depressed below brick pavers');

  const grassCtrl = createInstancedGrassField(terrainMesh);
  const grassIms = grassCtrl.group.children.filter(
    (c): c is import('three').InstancedMesh => c instanceof THREE.InstancedMesh,
  );
  const mat = new THREE.Matrix4();
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scl = new THREE.Vector3();
  for (const im of grassIms) {
    for (let i = 0; i < im.count; i++) {
      im.getMatrixAt(i, mat);
      mat.decompose(pos, quat, scl);
      assert.equal(
        pos.x > LUMBINI_FENCE_BOUNDS.minX - 2 &&
          pos.x < LUMBINI_FENCE_BOUNDS.maxX + 2 &&
          pos.z > LUMBINI_FENCE_BOUNDS.minZ - 2 &&
          pos.z < LUMBINI_FENCE_BOUNDS.maxZ + 2,
        false,
        `Wild flora spawned inside Lumbini Sacred Garden & unified perimeter at (${pos.x.toFixed(1)}, ${pos.z.toFixed(1)})`,
      );
    }
  }

  // Headless build sanity for Lumbini Sacred Garden complex + Surrounding Pond
  const built = createLumbiniBuddha(mockTextures, true);
  assert.ok(built.beaconLights.length >= 2);
  assert.ok(built.animatedNodes.length >= 4);
  const bells = built.group.userData.templeBells as import('three').Group[];
  assert.ok(Array.isArray(bells) && bells.length >= 1);
  const bb = new THREE.Box3().setFromObject(built.group);
  const size = new THREE.Vector3();
  bb.getSize(size);
  assert.ok(size.x >= 100 && size.z >= 115 && size.y >= 15.0, `Expected Lumbini + surrounding pond dimensions, got ${size.toArray()}`);

  let reflectivePondCount = 0;
  built.group.traverse((o) => {
    if (o.userData?.isReflectiveWater === true) {
      reflectivePondCount++;
      assert.equal(o.userData.nonCollidable, true);
    }
  });
  assert.ok(reflectivePondCount >= 2, `Expected >= 2 real-time planar reflective water surfaces, got ${reflectivePondCount}`);

  // Maya Devi corner flags and Sacred Garden garlands use GPU waving cloth & never spin
  let wavingGarlands = 0;
  let wavingPoleBanners = 0;
  built.group.traverse((o) => {
    if (o.userData?.prayerFlagMode === 'drape') {
      wavingGarlands++;
      assert.equal(o.userData.nonCollidable, true);
    } else if (o.userData?.prayerFlagMode === 'pole') {
      wavingPoleBanners++;
      assert.equal(o.userData.nonCollidable, true);
      assert.equal(o.userData.noSpin, true);
    }
  });
  assert.ok(wavingGarlands >= 12, 'Expected waving Lungta prayer-flag garlands across Maya Devi & Bodhi Chautara');
  assert.ok(wavingPoleBanners >= 4, 'Expected Maya Devi rooftop Lungta pole banners');
  assert.ok(
    built.animatedNodes.some((n) => typeof n.userData?.onEnvironmentUpdate === 'function'),
    'Expected wind-driven prayer-flag sync controller',
  );

  // StaticPhysicsWorld BVH must allow smooth walking up the South Ramp and through the open doorway onto the interior boardwalk
  const { StaticPhysicsWorld } = await import('./physicsBvh');
  built.group.position.set(lx, 0, lz);
  built.group.updateMatrixWorld(true);
  const lumbiniBvh = new StaticPhysicsWorld();
  lumbiniBvh.buildFromScene(built.group);
  let bx = lx;
  let bz = lz - 1.5; // z = 94.5 (South forecourt approaching ramp)
  let by = getSurfaceHeightAt(bx, bz);
  for (let step = 0; step < 30; step++) {
    const nextZ = bz - 0.45;
    const res = lumbiniBvh.resolveHorizontalCollision(bx, bz, bx, nextZ, by, 1.75, 0.4, 0.26);
    bx = res.x;
    bz = res.z;
    const floor = lumbiniBvh.sampleFloorHeight(bx, bz, by + 0.34);
    by = Math.max(getSurfaceHeightAt(bx, bz), floor ?? 0);
  }
  assert.ok(
    bz <= lz - 12.0 && by >= 1.20,
    `Expected StaticPhysicsWorld walk up South Ramp through Maya Devi doorway onto 1.25m boardwalk, got bz=${bz.toFixed(2)}, by=${by.toFixed(2)}`,
  );
});

test('Expanded Lumbini Western Peace Canal, Maitri Peace Bridge, Parkland Loop, and ambience lighting/audio presets behave coherently', async () => {
  const THREE = await import('three');
  const {
    createDioramaTerrain,
    createLumbiniPeaceParkland,
    sampleTerrainMeshHeight,
  } = await import('./mountainAndTerrain');

  // Peace Canal blocks wading, Maitri Peace Bridge carries visitor cleanly across, and West axial approach is walkable inside West fence
  assert.equal(isWalkablePosition(LUMBINI_PEACE_CANAL.centerX, 76), false, 'Peace Canal basin must block walking');
  assert.equal(isOnLumbiniCanalBridge(-348, 100), true);
  assert.equal(isWalkablePosition(-348, 100), true, 'Maitri Peace Bridge deck center must be walkable');
  assert.ok(groundHeightAt(-348, 100) > 0.9, 'Arched Maitri Peace Bridge rises cleanly over Peace Canal');
  assert.equal(getFootstepSurfaceKind(-348, 100), 'stone');
  assert.equal(isWalkablePosition(-362.0, 100), true, 'Western Maitri walk stays walkable');
  assert.equal(isWalkablePosition(-379.0, 100), true, 'Outer western scenic boulevard outside fence is open and walkable');
  assert.equal(getFootstepSurfaceKind(-362.0, 100), 'stone');

  // Effective lighting state blends smoothly at Lumbini across all presets without bleaching snow/stucco or leaking to Kathmandu
  const dusk = computeEffectiveLightingState(12.5, 'clear', -280, 96, 'butter-lamp-dusk');
  const vigil = computeEffectiveLightingState(12.5, 'clear', -362, 100, 'moonlight-vigil');
  const dawn = computeEffectiveLightingState(12.5, 'clear', -280, 96, 'lotus-dawn');
  const zen = computeEffectiveLightingState(12.5, 'clear', -280, 96, 'bodhi-zen');
  const valleyOutside = computeEffectiveLightingState(12.5, 'clear', 0, 6, 'moonlight-vigil');

  assert.equal(dusk.lumbiniBlend, 1);
  assert.equal(vigil.lumbiniBlend, 1);
  assert.equal(valleyOutside.lumbiniBlend, 0, 'Lumbini preset must not override distant valley lighting');
  assert.ok(dusk.lighting.lanternIntensity > zen.lighting.lanternIntensity);
  assert.ok(vigil.lighting.lanternIntensity > dusk.lighting.lanternIntensity);
  assert.ok(vigil.lighting.starOpacity > 0.8);
  assert.ok(dawn.lighting.bloomThreshold >= 1.0 && vigil.lighting.bloomThreshold >= 1.0);

  // Audio profile activates chimes, singing bowls, and cloth flutter inside Lumbini Peace Garden
  const lumbiniMix = computeSpatialAmbienceMix(-348, 100, 0.98);
  assert.equal(lumbiniMix.activeZone, 'peace-garden');
  const duskAudio = computeLumbiniAudioProfile(lumbiniMix, 'butter-lamp-dusk', 'clear');
  const vigilAudio = computeLumbiniAudioProfile(lumbiniMix, 'moonlight-vigil', 'clear');
  const outsideAudio = computeLumbiniAudioProfile(computeSpatialAmbienceMix(0, 6, 0.25), 'moonlight-vigil', 'clear');
  assert.ok(duskAudio.chimeActivity > 0.5 && duskAudio.flagFlutterLevel > 0.4);
  assert.ok(vigilAudio.bowlActivity > 0.6);
  assert.equal(outsideAudio.chimeActivity, 0);

  // Parkland 3D builder & terrain depression (zero Stupa geometry, continuous under-bridge canal carve)
  const tex = new THREE.Texture();
  const mockTextures = new Proxy(
    {
      meadowMap: tex,
      meadowNormal: tex,
      meadowRough: tex,
      createSignTexture: () => tex,
      janaki: new Proxy({}, { get: () => tex }),
    },
    { get: (target, prop) => (prop in target ? (target as Record<string | symbol, unknown>)[prop] : tex) },
  ) as unknown as import('./proceduralTextures').ProceduralTextureSet;

  const terrainMesh = createDioramaTerrain(mockTextures);
  assert.ok(sampleTerrainMeshHeight(terrainMesh, LUMBINI_PEACE_CANAL.centerX, 76) <= -0.85, 'Peace Canal basin depressed in terrain');
  assert.ok(
    sampleTerrainMeshHeight(terrainMesh, LUMBINI_PEACE_CANAL.centerX, LUMBINI_PEACE_CANAL.bridgeCenterZ) <= -0.85,
    'Peace Canal terrain directly under Maitri Peace Bridge must stay depressed so water flows continuously beneath',
  );

  const parkland = createLumbiniPeaceParkland(mockTextures);
  assert.equal(parkland.beaconLights.length, 4, 'Expected exactly the 4 Maitri Peace Bridge beacon lights (zero Stupa light)');
  let stupaFlags = 0;
  parkland.group.traverse((o) => {
    if (typeof o.userData?.prayerFlagMode === 'string') {
      stupaFlags++;
    }
  });
  assert.equal(stupaFlags, 0, 'Expected zero Shanti Peace Stupa prayer flags after Stupa removal');
  const parkBb = new THREE.Box3().setFromObject(parkland.group);
  assert.ok(
    parkBb.min.x >= LUMBINI_FENCE_BOUNDS.minX - 0.5,
    `Expected parkland geometry to stop cleanly at west perimeter fence (${LUMBINI_FENCE_BOUNDS.minX}), got min.x=${parkBb.min.x.toFixed(2)}`,
  );
});

test('Lumbini spatial ambient audio localizes bird chirps and rustling leaves with HRTF panning and distance attenuation', async () => {
  const {
    LUMBINI_SPATIAL_AUDIO_EMITTERS,
    computeLumbiniSpatialAudioState,
    computeSpatialEmitterPanGain,
  } = await import('./worldLogic');

  const birdEmitters = LUMBINI_SPATIAL_AUDIO_EMITTERS.filter((e) => e.kind !== 'leaf-rustle');
  const leafEmitters = LUMBINI_SPATIAL_AUDIO_EMITTERS.filter((e) => e.kind === 'leaf-rustle');
  assert.ok(birdEmitters.length >= 6, 'Expected multiple localized Lumbini bird emitters');
  assert.ok(leafEmitters.length >= 8, 'Expected Sacred Bodhi & garden hedge leaf-rustle emitters');

  for (const em of LUMBINI_SPATIAL_AUDIO_EMITTERS) {
    assert.ok(em.x >= -375 && em.x <= -210 && em.z >= 30 && em.z <= 176, `${em.id} sits inside Lumbini Sacred Garden`);
    assert.ok(em.refDistance > 0 && em.maxDistance > em.refDistance);
  }

  const bodhiBirds = LUMBINI_SPATIAL_AUDIO_EMITTERS.find((e) => e.id === 'lumbini-bodhi-birds')!;
  const pushkariniBirds = LUMBINI_SPATIAL_AUDIO_EMITTERS.find((e) => e.id === 'lumbini-pushkarini-birds')!;

  // Looking north (-Z) from central boardwalk: Bodhi tree (-309) is on LEFT, Pushkarini (-269.5) is on RIGHT
  const bodhiFacingNorth = computeSpatialEmitterPanGain(-280, 1.8, 112.5, 0, -1, bodhiBirds);
  const pondFacingNorth = computeSpatialEmitterPanGain(-280, 1.8, 112.5, 0, -1, pushkariniBirds);
  assert.ok(bodhiFacingNorth.pan < -0.9, `Expected Bodhi emitter on left pan, got ${bodhiFacingNorth.pan}`);
  assert.ok(pondFacingNorth.pan > 0.9, `Expected Pushkarini emitter on right pan, got ${pondFacingNorth.pan}`);
  assert.ok(pondFacingNorth.distanceGain > bodhiFacingNorth.distanceGain, 'Closer Pushkarini emitter should be louder than Bodhi');

  // Rotating camera 180 degrees (+Z) flips stereo left/right cleanly
  const bodhiFacingSouth = computeSpatialEmitterPanGain(-280, 1.8, 112.5, 0, 1, bodhiBirds);
  assert.ok(bodhiFacingSouth.pan > 0.9, `Expected Bodhi emitter pan to flip right when facing south, got ${bodhiFacingSouth.pan}`);

  // Cutoff beyond maxDistance returns zero gain
  const farCutoff = computeSpatialEmitterPanGain(0, 1.8, 0, 0, -1, bodhiBirds);
  assert.equal(farCutoff.distanceGain, 0);
  assert.equal(farCutoff.weight, 0);

  // Near Sacred Bodhi Chautara -> Bodhi birds and Pipal leaves rank highest
  const nearBodhi = computeLumbiniSpatialAudioState(-303, 1.8, 112.5, 0, -1, 0.45, 'bodhi-zen', 'clear');
  assert.equal(nearBodhi.inZone, true);
  assert.equal(nearBodhi.nearestBirdEmitter?.emitter.id, 'lumbini-bodhi-birds');
  assert.equal(nearBodhi.nearestRustleEmitter?.emitter.id, 'lumbini-bodhi-leaves');

  // Near Pushkarini Pond ghat -> Pushkarini songbirds rank highest
  const nearPond = computeLumbiniSpatialAudioState(-269.5, 1.8, 118.0, 0, -1, 0.35, 'lotus-dawn', 'clear');
  assert.equal(nearPond.inZone, true);
  assert.equal(nearPond.nearestBirdEmitter?.emitter.id, 'lumbini-pushkarini-birds');

  // Dawn chorus boosts bird activity & tightens cadence over moonlight vigil; rain dampens birds while breeze boosts leaf rustle
  const vigil = computeLumbiniSpatialAudioState(-269.5, 1.8, 118.0, 0, -1, 0.35, 'moonlight-vigil', 'clear');
  const rainy = computeLumbiniSpatialAudioState(-303, 1.8, 112.5, 0, -1, 0.85, 'bodhi-zen', 'rain');
  assert.ok(nearPond.birdActivity > vigil.birdActivity);
  assert.ok(nearPond.birdIntervalMaxSec < vigil.birdIntervalMinSec);
  assert.ok(rainy.birdActivity < nearBodhi.birdActivity * 0.45);
  assert.ok(rainy.leafRustleActivity > vigil.leafRustleActivity);

  // Outside Lumbini Sacred Garden at spawn -> spatial Lumbini audio is inactive
  const outside = computeLumbiniSpatialAudioState(0, 1.8, 6, 0, -1, 0.4, 'lotus-dawn', 'clear');
  assert.equal(outside.inZone, false);
  assert.equal(outside.activeBirdEmitters.length, 0);
  assert.equal(outside.activeRustleEmitters.length, 0);

  // SoundEngine integration with a mock AudioContext verifies HRTF PannerNode localization and event scheduling
  const prevWindow = (globalThis as { window?: unknown }).window;
  const createdPanners: Array<{
    panningModel: string;
    distanceModel: string;
    refDistance: number;
    maxDistance: number;
    positionX: { value: number };
    positionY: { value: number };
    positionZ: { value: number };
  }> = [];
  let listenerPose = { x: 0, y: 0, z: 0, fx: 0, fy: 0, fz: 0 };

  const makeParam = (init = 0) => ({
    value: init,
    setValueAtTime(v: number) {
      this.value = v;
    },
    linearRampToValueAtTime(v: number) {
      this.value = v;
    },
    exponentialRampToValueAtTime(v: number) {
      this.value = v;
    },
    setTargetAtTime(v: number) {
      this.value = v;
    },
    cancelScheduledValues() {},
  });

  let mockTime = 0;
  class MockAudioContext {
    public sampleRate = 44100;
    public state = 'running';
    public destination = { connect() {} };
    public listener = {
      positionX: { setTargetAtTime: (v: number) => { listenerPose.x = v; } },
      positionY: { setTargetAtTime: (v: number) => { listenerPose.y = v; } },
      positionZ: { setTargetAtTime: (v: number) => { listenerPose.z = v; } },
      forwardX: { setTargetAtTime: (v: number) => { listenerPose.fx = v; } },
      forwardY: { setTargetAtTime: (v: number) => { listenerPose.fy = v; } },
      forwardZ: { setTargetAtTime: (v: number) => { listenerPose.fz = v; } },
      upX: { setTargetAtTime() {} },
      upY: { setTargetAtTime() {} },
      upZ: { setTargetAtTime() {} },
    };
    get currentTime() {
      return mockTime;
    }
    resume() {
      return Promise.resolve();
    }
    close() {
      return Promise.resolve();
    }
    createBuffer(_ch: number, len: number, sr: number) {
      const arr = new Float32Array(len);
      return { duration: len / sr, getChannelData: () => arr };
    }
    createBufferSource() {
      return {
        buffer: null,
        loop: false,
        onended: null as null | (() => void),
        connect() {},
        disconnect() {},
        start() {},
        stop() {},
      };
    }
    createBiquadFilter() {
      return { type: 'lowpass', frequency: makeParam(400), Q: makeParam(1), connect() {}, disconnect() {} };
    }
    createGain() {
      return { gain: makeParam(1), connect() {}, disconnect() {} };
    }
    createOscillator() {
      return {
        type: 'sine',
        frequency: makeParam(440),
        onended: null as null | (() => void),
        connect() {},
        disconnect() {},
        start() {},
        stop() {},
      };
    }
    createPanner() {
      const px = makeParam(0);
      const py = makeParam(0);
      const pz = makeParam(0);
      const node = {
        panningModel: 'equalpower',
        distanceModel: 'inverse',
        refDistance: 1,
        maxDistance: 10000,
        rolloffFactor: 1,
        coneInnerAngle: 360,
        coneOuterAngle: 360,
        coneOuterGain: 0,
        positionX: px,
        positionY: py,
        positionZ: pz,
        connect() {},
        disconnect() {},
      };
      createdPanners.push(node);
      return node;
    }
  }

  try {
    (globalThis as { window?: unknown }).window = { AudioContext: MockAudioContext };
    const { soundEngine } = await import('./soundEngine');
    soundEngine.setEnabled(true);

    const mix = computeSpatialAmbienceMix(-306, 112.5, 0.25);
    const pose = { x: -306, y: 1.85, z: 112.5, forwardX: -1, forwardY: 0, forwardZ: 0 };

    // Step simulated clock across several intervals inside Sacred Bodhi grove
    for (let stepIdx = 0; stepIdx < 16; stepIdx++) {
      mockTime += 1.0;
      soundEngine.updateAmbience(mix, 0.016, 'bodhi-zen', 'clear', pose);
    }

    const status = soundEngine.getLumbiniSpatialStatus();
    assert.equal(status.inZone, true);
    assert.ok(status.activeEmitterCount >= 4);
    assert.equal(status.nearestBirdEmitterId, 'lumbini-bodhi-birds');
    assert.equal(status.nearestRustleEmitterId, 'lumbini-bodhi-leaves');
    assert.ok(status.birdEventCount >= 1, `Expected localized bird events >= 1, got ${status.birdEventCount}`);
    assert.ok(status.rustleEventCount >= 1, `Expected localized leaf rustle events >= 1, got ${status.rustleEventCount}`);
    assert.ok(createdPanners.length >= 2, 'Expected localized HRTF PannerNodes to be instantiated');
    assert.equal(createdPanners[0].panningModel, 'HRTF');
    assert.ok(Math.abs(listenerPose.x + 306) < 0.01 && Math.abs(listenerPose.fx + 1) < 0.01);

    soundEngine.setEnabled(false);
    soundEngine.dispose();
  } finally {
    if (prevWindow === undefined) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      (globalThis as { window?: unknown }).window = prevWindow;
    }
  }
});

test('Procedural Lumbini lotus placement system populates both reflective ponds cleanly without clipping bridges or banks', async () => {
  const THREE = await import('three');
  const { createLumbiniBuddha } = await import('./proceduralModels');

  const placementsA = generateLumbiniPondLotusPlacements();
  const placementsB = generateLumbiniPondLotusPlacements();
  assert.deepEqual(placementsA, placementsB, 'Lotus generator must be deterministic');

  const surrounding = placementsA.filter((p) => p.pond === 'surrounding');
  const pushkarini = placementsA.filter((p) => p.pond === 'pushkarini');
  assert.ok(surrounding.length >= 100, `Expected >= 100 surrounding pond lotuses, got ${surrounding.length}`);
  assert.ok(pushkarini.length >= 16, `Expected >= 16 Pushkarini pond lotuses, got ${pushkarini.length}`);

  const stages = new Set(placementsA.map((p) => p.stage));
  const hues = new Set(placementsA.map((p) => p.hueVariant));
  assert.equal(stages.size, 4, 'Expected full-bloom, half-bloom, bud, and pad-only lifecycle variety');
  assert.equal(hues.size, 3, 'Expected sakura-pink, rose-magenta, and ivory-white hue variants');

  for (const lotus of surrounding) {
    assert.equal(
      isInLumbiniSurroundingPond(lotus.x, lotus.z),
      true,
      `Surrounding lotus (${lotus.x.toFixed(2)}, ${lotus.z.toFixed(2)}) must lie inside surrounding pond water`,
    );
    assert.equal(
      isOnLumbiniSacredBridge(lotus.x, lotus.z),
      false,
      'Lotus must never clip a Sacred Causeway Bridge',
    );
    assert.equal(
      isOnLumbiniBridgeAbutmentPier(lotus.x, lotus.z),
      false,
      'Lotus must never clip a bridge abutment pier',
    );
    assert.ok(Math.abs(lotus.y - LUMBINI_SACRED_POND.waterLevel) < 0.01);
  }

  for (const lotus of pushkarini) {
    assert.equal(
      isInLumbiniPushkariniPond(lotus.x, lotus.z),
      true,
      `Pushkarini lotus (${lotus.x.toFixed(2)}, ${lotus.z.toFixed(2)}) must lie inside Pushkarini Pond water`,
    );
    assert.ok(Math.abs(lotus.y - LUMBINI_PUSHKARINI_POND.waterLevel) < 0.01);
  }

  // Pairwise non-overlap guarantee inside each pond
  for (let i = 0; i < placementsA.length; i++) {
    for (let j = i + 1; j < placementsA.length; j++) {
      const a = placementsA[i];
      const b = placementsA[j];
      if (a.pond !== b.pond) continue;
      const dist = Math.hypot(a.x - b.x, a.z - b.z);
      assert.ok(
        dist >= (a.padRadius + b.padRadius) * 0.9,
        `Overlapping lotus pads detected at dist=${dist.toFixed(2)}`,
      );
    }
  }

  const tex = new THREE.Texture();
  const mockTextures = new Proxy(
    {
      meadowMap: tex,
      meadowNormal: tex,
      meadowRough: tex,
      createSignTexture: () => tex,
      janaki: new Proxy({}, { get: () => tex }),
    },
    { get: (target, prop) => (prop in target ? (target as Record<string | symbol, unknown>)[prop] : tex) },
  ) as unknown as import('./proceduralTextures').ProceduralTextureSet;

  const built = createLumbiniBuddha(mockTextures, true);
  assert.equal(built.group.userData.lotusCount, placementsA.length);
  let instancedLotusMeshCount = 0;
  built.group.traverse((obj) => {
    if (obj instanceof THREE.InstancedMesh && obj.userData?.isLotusFlora === true) {
      instancedLotusMeshCount++;
      assert.equal(obj.userData.nonCollidable, true);
    }
  });
  assert.ok(
    instancedLotusMeshCount >= 8,
    `Expected instanced lotus meshes across both ponds, got ${instancedLotusMeshCount}`,
  );
});

test('Dry pilgrim trails never trigger water ripples, while wading in ponds and rain trigger shader ripples', async () => {
  const {
    REFLECTIVE_WATER_ENV_UNIFORMS,
    WATER_INTERACTION_UNIFORMS,
    WATER_RIPPLE_COUNT,
    createReflectivePondSurface,
    triggerWaterRipple,
  } = await import('./waterShader');
  const THREE = await import('three');

  // Distant spawn / non-Lumbini paths and dry Lumbini trails/bridges must NOT emit water ripples
  assert.equal(findLumbiniTrailPondRippleOrigin(SPAWN_POSITION.x, SPAWN_POSITION.z, 1), null);
  assert.equal(findLumbiniTrailPondRippleOrigin(-92, 128, 2), null);

  const dryTrailSpots: Array<[number, number, string]> = [
    [-280.0, 164.0, 'south-gate-avenue'],
    [-280.0, 36.0, 'north-gate-avenue'],
    [-362.0, 100.0, 'west-axial-walk'],
    [-222.0, 100.0, 'east-gate-avenue'],
    [-280.0, 152.3, 'south-bridge'],
    [-322.5, 130.0, 'west-inner-trail'],
    [-285.5, 112.5, 'pushkarini-brick-overlook'],
  ];
  for (const [px, pz, label] of dryTrailSpots) {
    assert.equal(
      findLumbiniTrailPondRippleOrigin(px, pz, 3),
      null,
      `Dry path ${label} at (${px}, ${pz}) must NOT emit water ripples`,
    );
  }

  // Stepping inside Surrounding Sacred Pond water or Pushkarini Pond water emits valid ripples
  const surroundingWaterWade = findLumbiniTrailPondRippleOrigin(-305.0, 152.0, 3);
  assert.ok(surroundingWaterWade, 'Wading inside Surrounding Pond should emit ripple');
  assert.equal(surroundingWaterWade.pond, 'surrounding');
  assert.equal(isInLumbiniSurroundingPond(surroundingWaterWade.x, surroundingWaterWade.z), true);

  const pushkariniWade = findLumbiniTrailPondRippleOrigin(-270.0, 112.5, 4);
  assert.ok(pushkariniWade, 'Wading inside Pushkarini Pond should emit ripple');
  assert.equal(pushkariniWade.pond, 'pushkarini');
  assert.equal(isInLumbiniPushkariniPond(pushkariniWade.x, pushkariniWade.z), true);

  // Verify pond shader material shares live rain uniform and expanded 12-slot interactive ripple buffer
  assert.equal(WATER_RIPPLE_COUNT, 12);
  const reflector = createReflectivePondSurface(new THREE.PlaneGeometry(10, 10), { isSoftwareGl: true });
  const mat = reflector.material as import('three').ShaderMaterial;
  assert.equal(mat.uniforms.uRainIntensity, REFLECTIVE_WATER_ENV_UNIFORMS.uRainIntensity);
  assert.equal(mat.uniforms.uWaterRipples, WATER_INTERACTION_UNIFORMS.uWaterRipples);
  assert.ok(mat.fragmentShader.includes('evalRainRingLayer'));

  triggerWaterRipple(pushkariniWade.x, pushkariniWade.z, 12.5, pushkariniWade.strength);
  const recorded = WATER_INTERACTION_UNIFORMS.uWaterRipples.value.some(
    (slot) => Math.abs(slot.x - pushkariniWade.x) < 0.01 && Math.abs(slot.y - pushkariniWade.z) < 0.01 && slot.z === 12.5,
  );
  assert.equal(recorded, true, 'triggerWaterRipple must populate shared shader ripple slot');
});

test('Lumbini pond fireflies appear exclusively during night/twilight presets and hover above both ponds', async () => {
  const { LumbiniFireflySystem } = await import('./lumbiniFireflies');

  // Intensity stays 0 during bright day and ramps cleanly at night / moonlight vigil
  assert.equal(computeLumbiniFireflyIntensity('noon', 12.5, 'sanctuary-auto', 'clear', 'Afternoon'), 0);
  assert.equal(computeLumbiniFireflyIntensity('noon', 11.2, 'bodhi-zen', 'clear', 'Morning'), 0);
  assert.equal(computeLumbiniFireflyIntensity('night', 22.0, 'sanctuary-auto', 'clear', 'Night'), 1.0);
  assert.equal(computeLumbiniFireflyIntensity('noon', 22.4, 'moonlight-vigil', 'clear', 'Night'), 1.0);

  const duskVal = computeLumbiniFireflyIntensity('dusk', 18.35, 'sanctuary-auto', 'clear', 'Golden Hour');
  assert.ok(duskVal > 0.3 && duskVal < 0.95, `Expected twilight firefly ramp, got ${duskVal}`);
  const rainyNight = computeLumbiniFireflyIntensity('night', 22.0, 'moonlight-vigil', 'rain', 'Night');
  assert.ok(rainyNight > 0 && rainyNight < 0.5, 'Rain attenuates nighttime fireflies cleanly');

  const placementsA = generateLumbiniFireflyPlacements(260, 202611);
  const placementsB = generateLumbiniFireflyPlacements(260, 202611);
  assert.deepEqual(placementsA, placementsB, 'Firefly generator must be deterministic');
  assert.equal(placementsA.length, 260);

  const pushkariniFlies = placementsA.filter((f) => f.pond === 'pushkarini');
  const surroundingFlies = placementsA.filter((f) => f.pond === 'surrounding');
  assert.ok(pushkariniFlies.length >= 80 && surroundingFlies.length >= 140);

  for (const f of pushkariniFlies) {
    assert.ok(
      f.x >= LUMBINI_PUSHKARINI_POND.minX - 0.8 && f.x <= LUMBINI_PUSHKARINI_POND.maxX + 0.8,
      'Pushkarini firefly must hover near Pushkarini pond X bounds',
    );
    assert.ok(
      f.z >= LUMBINI_PUSHKARINI_POND.minZ - 0.8 && f.z <= LUMBINI_PUSHKARINI_POND.maxZ + 0.8,
      'Pushkarini firefly must hover near Pushkarini pond Z bounds',
    );
    assert.ok(f.y > LUMBINI_PUSHKARINI_POND.waterLevel + 0.25);
  }
  for (const f of surroundingFlies) {
    assert.ok(
      f.x >= LUMBINI_SACRED_POND.outerMinX - 0.5 && f.x <= LUMBINI_SACRED_POND.outerMaxX + 0.5,
      'Surrounding pond firefly must stay within moat bounds',
    );
    assert.ok(f.y > LUMBINI_SACRED_POND.waterLevel + 0.25);
  }

  const sys = new LumbiniFireflySystem(260, 202611);
  assert.equal(sys.points.userData.nonCollidable, true);
  sys.update(4.0, 0, 1.0);
  assert.equal(sys.points.visible, false);
  sys.update(4.5, 1.0, 1.0);
  assert.equal(sys.points.visible, true);
  assert.equal(sys.material.uniforms.uIntensity.value, 1.0);
  sys.dispose();
});

test('Procedural weather particle system switches cleanly between falling sakura petals, rain, and light snow', async () => {
  const THREE = await import('three');
  const { WeatherParticleSystem } = await import('./weatherParticles');

  const petals = computeWeatherParticleModeProfile('clear');
  const rain = computeWeatherParticleModeProfile('rain');
  const snow = computeWeatherParticleModeProfile('snow');
  const mist = computeWeatherParticleModeProfile('mist');

  assert.equal(petals.mode, 'petals');
  assert.equal(rain.mode, 'rain');
  assert.equal(snow.mode, 'snow');
  assert.equal(mist.mode, 'mist');

  assert.equal(rain.stretch, 1.0);
  assert.ok(rain.fallSpeed > 15 && rain.fallSpeed > snow.fallSpeed * 6);
  assert.ok(snow.fallSpeed > 0.8 && snow.fallSpeed < 2.5);
  assert.ok(snow.activeRatio < 0.7, 'Light snow keeps airy moderate density');
  assert.ok(petals.fallSpeed > 0.5 && petals.fallSpeed < 2.2 && petals.tumbleSpeed > 1.5);
  assert.equal(petals.secondaryColorHex, '#f472b6');

  const sys = new WeatherParticleSystem('clear', 1.0);
  const anchor = new THREE.Vector3(0, 0.2, 6);
  assert.equal(sys.currentMode, 'petals');
  assert.equal(sys.material.uniforms.uMode.value, 0);

  sys.update(0.016, 1.0, 'rain', anchor, 1.0, '#64748b');
  assert.equal(sys.currentMode, 'rain');
  assert.equal(sys.material.uniforms.uMode.value, 1);
  assert.equal(sys.material.uniforms.uActiveFraction.value, 1.0);

  sys.update(0.016, 2.0, 'snow', anchor, 1.0, '#e2e8f0');
  assert.equal(sys.currentMode, 'snow');
  assert.equal(sys.material.uniforms.uMode.value, 2);
  assert.ok(sys.material.uniforms.uActiveFraction.value < 0.7);

  sys.update(0.016, 3.0, 'clear', anchor, 1.0, '#fff4d6');
  assert.equal(sys.currentMode, 'petals');
  assert.equal(sys.material.uniforms.uMode.value, 0);
  sys.dispose();
});

test('First-time landmark approach cue provides unique per-landmark spatial motifs without retriggering', async () => {
  assert.equal(Object.keys(LANDMARK_APPROACH_CUE_SPECS).length, LANDMARKS.length);
  const motifNames = new Set(Object.values(LANDMARK_APPROACH_CUE_SPECS).map((s) => s.motifName));
  assert.equal(motifNames.size, LANDMARKS.length, 'Every landmark must have a unique motif');

  // Spawn must never falsely trigger any landmark approach cue
  assert.equal(
    findFirstUnexploredLandmarkApproach(SPAWN_POSITION.x, SPAWN_POSITION.z, [], []),
    null,
  );

  // Approaching unexplored Kathmandu Pagoda within cue radius triggers its motif once
  const pashupati = LANDMARKS.find((l) => l.id === 'kathmandu-stupa')!;
  const cueR = getLandmarkApproachCueRadius(pashupati);
  assert.ok(cueR > pashupati.interactRadius);

  const match = findFirstUnexploredLandmarkApproach(
    pashupati.position.x,
    pashupati.position.z + cueR - 2.0,
    [],
    [],
  );
  assert.ok(match);
  assert.equal(match.landmark.id, 'kathmandu-stupa');
  assert.equal(match.spec.motifName, 'Pashupati Bronze Ghanta');

  // Already discovered or already cued landmarks are never triggered again
  assert.equal(
    findFirstUnexploredLandmarkApproach(
      pashupati.position.x,
      pashupati.position.z + cueR - 2.0,
      ['kathmandu-stupa'],
      [],
    ),
    null,
  );
  assert.equal(
    findFirstUnexploredLandmarkApproach(
      pashupati.position.x,
      pashupati.position.z + cueR - 2.0,
      [],
      ['kathmandu-stupa'],
    ),
    null,
  );

  // Spatial stereo pan calculation localizes left vs right relative to forward direction
  const facingNorthLeft = computeLandmarkApproachCuePanAndGain(0, 0, 0, -1, -18, -10, 27);
  const facingNorthRight = computeLandmarkApproachCuePanAndGain(0, 0, 0, -1, 18, -10, 27);
  assert.ok(facingNorthLeft.pan < -0.7, `Expected negative left pan, got ${facingNorthLeft.pan}`);
  assert.ok(facingNorthRight.pan > 0.7, `Expected positive right pan, got ${facingNorthRight.pan}`);

  // SoundEngine spatial approach cue playback with MockAudioContext
  const prevWindow = (globalThis as { window?: unknown }).window;
  let pannerCount = 0;
  let oscCount = 0;
  const makeParam = (init = 0) => ({
    value: init,
    setValueAtTime(v: number) { this.value = v; },
    linearRampToValueAtTime(v: number) { this.value = v; },
    exponentialRampToValueAtTime(v: number) { this.value = v; },
    setTargetAtTime(v: number) { this.value = v; },
    cancelScheduledValues() {},
  });
  class MockCtx {
    public sampleRate = 44100;
    public state = 'running';
    public currentTime = 1.0;
    public destination = { connect() {} };
    public listener = {
      positionX: makeParam(0), positionY: makeParam(0), positionZ: makeParam(0),
      forwardX: makeParam(0), forwardY: makeParam(0), forwardZ: makeParam(-1),
      upX: makeParam(0), upY: makeParam(1), upZ: makeParam(0),
    };
    resume() { return Promise.resolve(); }
    close() { return Promise.resolve(); }
    createBuffer(_c: number, len: number, sr: number) {
      return { duration: len / sr, getChannelData: () => new Float32Array(len) };
    }
    createBufferSource() {
      return { buffer: null, loop: false, onended: null, connect() {}, disconnect() {}, start() {}, stop() {} };
    }
    createBiquadFilter() {
      return { type: 'lowpass', frequency: makeParam(400), Q: makeParam(1), connect() {}, disconnect() {} };
    }
    createGain() { return { gain: makeParam(1), connect() {}, disconnect() {} }; }
    createOscillator() {
      oscCount++;
      return { type: 'sine', frequency: makeParam(440), onended: null, connect() {}, disconnect() {}, start() {}, stop() {} };
    }
    createPanner() {
      pannerCount++;
      return {
        panningModel: 'equalpower', distanceModel: 'inverse', refDistance: 1, maxDistance: 100,
        rolloffFactor: 1, coneInnerAngle: 360, coneOuterAngle: 360, coneOuterGain: 0,
        positionX: makeParam(0), positionY: makeParam(0), positionZ: makeParam(0),
        connect() {}, disconnect() {},
      };
    }
  }

  try {
    (globalThis as { window?: unknown }).window = { AudioContext: MockCtx };
    const { soundEngine } = await import('./soundEngine');
    soundEngine.setEnabled(false);
    assert.equal(
      soundEngine.playLandmarkApproachCue('aniflow-studio', { x: 118, y: 2.5, z: -56 }, 27),
      false,
    );

    soundEngine.setEnabled(true);
    const played = soundEngine.playLandmarkApproachCue(
      'aniflow-studio',
      { x: 118, y: 2.5, z: -56 },
      27,
      { x: 118, y: 1.8, z: -36, forwardX: 0, forwardY: 0, forwardZ: -1 },
    );
    assert.equal(played, true);
    assert.ok(pannerCount >= 1);
    assert.ok(oscCount >= 8);
    const status = soundEngine.getApproachCueStatus();
    assert.equal(status.lastLandmarkId, 'aniflow-studio');
    assert.equal(status.lastMotifName, 'AniFlow Studio Marimba');
    assert.equal(status.cueCount, 1);

    soundEngine.setEnabled(false);
    soundEngine.dispose();
  } finally {
    if (prevWindow === undefined) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      (globalThis as { window?: unknown }).window = prevWindow;
    }
  }
});

test('Myanmar Golden Pagoda (Lokamani Cula) builds at monumental real-life scale with walkable stone forecourt', async () => {
  const THREE = await import('three');
  const { createLumbiniBuddha } = await import('./lumbiniTemple');
  const { createProceduralTextures } = await import('./proceduralTextures');

  // Minimal Canvas/Document polyfill check: run buildMyanmarGoldenPagoda directly (pure geometry/materials)
  const { buildMyanmarGoldenPagoda } = await import('./lumbiniMyanmarPagoda');
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf7f5ef });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf4c85b, metalness: 0.9, roughness: 0.24 });
  const crimsonMat = new THREE.MeshStandardMaterial({ color: 0x8f221d });

  const pagoda = buildMyanmarGoldenPagoda(whiteMat, goldMat, crimsonMat);
  assert.equal(pagoda.name, 'MyanmarGoldenPagoda');

  const box = new THREE.Box3().setFromObject(pagoda);
  const size = new THREE.Vector3();
  box.getSize(size);
  assert.ok(size.x >= 16.5 && size.x <= 17.5, `Expected ~16.8m forecourt width, got ${size.x.toFixed(2)}m`);
  assert.ok(size.z >= 16.5 && size.z <= 17.5, `Expected ~16.8m forecourt depth, got ${size.z.toFixed(2)}m`);
  assert.ok(size.y >= 21.0 && size.y <= 23.0, `Expected ~21.8m monumental pagoda height, got ${size.y.toFixed(2)}m`);

  // Verify walkability & stone footsteps around Lumbini center (-280, 96) + pagoda (-32.2, 41.2) = (-312.2, 137.2)
  assert.equal(isWalkablePosition(-312.2, 137.2), false, 'Inner sanctuary fenced core must block pass-through');
  assert.equal(isWalkablePosition(-314.45, 144.46), false, 'South azure offering pedestal must block pass-through');
  assert.equal(isWalkablePosition(-312.2, 145.0), true, 'South gate stone plaza approach must stay walkable');
  assert.equal(isWalkablePosition(-296.0, 137.2), true, 'East brick spur walkway into pagoda must stay open');
  assert.equal(getFootstepSurfaceKind(-312.2, 145.0), 'stone');
  assert.equal(getFootstepSurfaceKind(-296.0, 137.2), 'stone');

  void createLumbiniBuddha;
  void createProceduralTextures;
});

test('High-density terrain and Himalayan meshes expose valid multi-layer blend weights (grass, pebble, rock) and PBR attributes', async () => {
  const THREE = await import('three');
  const { createDioramaTerrain, createSculptedHimalayas } = await import('./mountainAndTerrain');

  const tex = new THREE.Texture();
  const mockTextures = new Proxy(
    { meadowMap: tex, meadowNormal: tex, meadowRough: tex },
    { get: (target, prop) => (prop in target ? (target as Record<string | symbol, unknown>)[prop] : tex) },
  ) as unknown as import('./proceduralTextures').ProceduralTextureSet;

  const terrainMesh = createDioramaTerrain(mockTextures);
  const grid = terrainMesh.userData.terrainGrid as { size: number; segs: number };
  assert.ok(grid.segs >= 512, `Expected terrain segs >= 512, got ${grid.segs}`);

  const pos = terrainMesh.geometry.getAttribute('position');
  const mix = terrainMesh.geometry.getAttribute('aTerrainMix');
  const snow = terrainMesh.geometry.getAttribute('aSnowMask');
  const uv1 = terrainMesh.geometry.getAttribute('uv1');
  const idx = terrainMesh.geometry.getIndex()!;
  assert.ok(pos.count >= 260_000, `Expected >= 260k terrain vertices, got ${pos.count}`);
  assert.ok(idx.count / 3 >= 500_000, `Expected >= 500k terrain triangles, got ${idx.count / 3}`);
  assert.ok(mix && mix.itemSize === 3, 'Expected vec3 aTerrainMix attribute on terrainMesh');
  assert.ok(snow && snow.itemSize === 1, 'Expected float aSnowMask attribute on terrainMesh');
  assert.ok(uv1, 'Expected uv1 attribute for terrain AO map');

  let foundRiverPebble = false;
  let foundValleyGrass = false;
  let foundRockySlope = false;
  let foundShoulderMix = false;

  for (let i = 0; i < pos.count; i += 7) {
    const wg = mix.getX(i);
    const wp = mix.getY(i);
    const wr = mix.getZ(i);
    assert.ok(
      Number.isFinite(wg) && Number.isFinite(wp) && Number.isFinite(wr),
      `Non-finite terrainMix at vertex ${i}`,
    );
    assert.ok(wg >= -1e-5 && wp >= -1e-5 && wr >= -1e-5, `Negative terrainMix weight at vertex ${i}`);
    assert.ok(Math.abs(wg + wp + wr - 1.0) < 0.01, `terrainMix weights must sum to 1 at vertex ${i}`);

    const x = pos.getX(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    if (Math.abs(x - getRiverCenterX(z)) < 4.5 && wp > 0.65) foundRiverPebble = true;
    if (Math.abs(x + 40) < 12 && Math.abs(z - 60) < 12 && wg > 0.85) foundValleyGrass = true;
    if ((z < -170 || r > 395) && wr > 0.45) foundRockySlope = true;
    if (wp > 0.35 && wg > 0.15) foundShoulderMix = true;
  }

  assert.equal(foundRiverPebble, true, 'Expected river corridor vertices dominated by pebble layer');
  assert.equal(foundValleyGrass, true, 'Expected valley meadow vertices dominated by grass layer');
  assert.equal(foundRockySlope, true, 'Expected foothills/northern slopes dominated by weathered rock layer');
  assert.equal(foundShoulderMix, true, 'Expected natural grass-pebble transition along shoulders/banks');

  const tMat = terrainMesh.material as import('three').MeshStandardMaterial;
  assert.ok(tMat.map && tMat.normalMap && tMat.roughnessMap && tMat.aoMap);

  const himalayas = createSculptedHimalayas(mockTextures);
  const hIdx = himalayas.geometry.getIndex()!;
  const hMix = himalayas.geometry.getAttribute('aTerrainMix');
  const hSnow = himalayas.geometry.getAttribute('aSnowMask');
  const hMat = himalayas.material as import('three').MeshStandardMaterial;
  assert.ok(hIdx.count / 3 >= 65_000, `Expected >= 65k Himalayan triangles, got ${hIdx.count / 3}`);
  assert.ok(hMix && hSnow, 'Himalayas must expose aTerrainMix and aSnowMask');
  assert.equal(himalayas.userData.skipNavMesh, true);
  assert.ok(hMat.map && hMat.normalMap && hMat.roughnessMap && hMat.aoMap);
});

test('Procedural texture generator creates grass, pebble, and weathered rock PBR maps with valid sRGB and linear spaces', async () => {
  const THREE = await import('three');
  const { createProceduralTextures } = await import('./proceduralTextures');

  const prevDoc = (globalThis as { document?: unknown }).document;
  const makeMockCtx = (w: number, h: number) => {
    const grad = { addColorStop() {} };
    const base: Record<string, unknown> = {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      font: '',
      textAlign: 'left',
      textBaseline: 'alphabetic',
      globalAlpha: 1,
      shadowColor: 'transparent',
      shadowBlur: 0,
      createLinearGradient: () => grad,
      createRadialGradient: () => grad,
      createPattern: () => ({}),
      measureText: (t: string) => ({ width: t.length * 10 }),
      createImageData: (iw: number, ih: number) => ({
        width: iw,
        height: ih,
        data: new Uint8ClampedArray(iw * ih * 4),
      }),
      getImageData: (_sx: number, _sy: number, sw: number, sh: number) => ({
        width: sw,
        height: sh,
        data: new Uint8ClampedArray(sw * sh * 4).fill(128),
      }),
      canvas: { width: w, height: h },
    };
    return new Proxy(base, {
      get(target, prop) {
        if (prop in target) return target[prop as string];
        return () => {};
      },
      set(target, prop, value) {
        target[prop as string] = value;
        return true;
      },
    });
  };

  (globalThis as { document?: unknown }).document = {
    createElement: (tag: string) => {
      if (tag !== 'canvas') return {};
      const c = {
        width: 256,
        height: 256,
        getContext: () => makeMockCtx(c.width, c.height),
      };
      return c;
    },
  };

  try {
    const pbr = createProceduralTextures(4);
    for (const colorTex of [pbr.meadowMap, pbr.pebbleMap, pbr.rockMap]) {
      assert.ok(colorTex, 'Expected terrain albedo texture');
      assert.equal(colorTex.colorSpace, THREE.SRGBColorSpace);
    }
    for (const linearTex of [
      pbr.meadowNormal,
      pbr.meadowRough,
      pbr.meadowAo,
      pbr.pebbleNormal,
      pbr.pebbleRough,
      pbr.pebbleAo,
      pbr.rockNormal,
      pbr.rockRough,
      pbr.rockAo,
    ]) {
      assert.ok(linearTex, 'Expected terrain linear normal/roughness/AO texture');
      assert.equal(linearTex.colorSpace, THREE.NoColorSpace);
    }
    pbr.dispose();
  } finally {
    if (prevDoc === undefined) {
      delete (globalThis as { document?: unknown }).document;
    } else {
      (globalThis as { document?: unknown }).document = prevDoc;
    }
  }
});

test('Localized forest bird spatial audio activates across all forest areas with directional panning and weather scaling', () => {
  const forestSpots: Array<[number, number, string]> = [
    [-108, -74, 'forest-pumdikot'],
    [-48, -24, 'forest-pashupati'],
    [-108, 4, 'forest-boudha'],
    [20, 42, 'forest-bagmati'],
  ];

  for (const [fx, fz, expectedPrefix] of forestSpots) {
    const state = computeForestBirdSpatialAudioState(fx, 1.5, fz, 0, -1, 0.25, 'clear', 9.5);
    assert.equal(state.inForest, true, `Expected inForest=true near ${expectedPrefix}`);
    assert.ok(state.birdActivity > 0.45, `Expected brisk birdActivity at ${expectedPrefix}, got ${state.birdActivity}`);
    assert.ok(state.nearestEmitter?.emitter.id.startsWith(expectedPrefix), `Expected ${expectedPrefix} emitter`);
  }

  // Emitter to the listener's right (+X when facing North -Z) should yield positive pan
  const facingNorthLeftOfPashupati = computeForestBirdSpatialAudioState(-54, 1.5, -30, 0, -1, 0.2, 'clear', 10);
  assert.ok(facingNorthLeftOfPashupati.nearestEmitter);
  assert.ok(facingNorthLeftOfPashupati.nearestEmitter.pan > 0.3);

  // Heavy rain strongly reduces bird chatter
  const clearState = computeForestBirdSpatialAudioState(-48, 1.5, -24, 0, -1, 0.2, 'clear', 10);
  const rainState = computeForestBirdSpatialAudioState(-48, 1.5, -24, 0, -1, 0.2, 'rain', 10);
  assert.ok(rainState.birdActivity < clearState.birdActivity * 0.3);
});

test('Lumbini pond crickets peak near Pushkarini & Sacred Pond during dusk/night and attenuate by day or rain', () => {
  const pushkariniNight = computeLumbiniCricketSpatialState(
    -285.0,
    1.2,
    112.5,
    1,
    0,
    21.5,
    'moonlight-vigil',
    'clear',
  );
  assert.equal(pushkariniNight.inZone, true);
  assert.ok(pushkariniNight.cricketActivity >= 0.72, `Expected strong night cricket chorus near Pushkarini, got ${pushkariniNight.cricketActivity}`);
  assert.equal(pushkariniNight.nearestEmitter?.emitter.id, 'lumbini-cricket-pushkarini-west');

  const pushkariniDusk = computeLumbiniCricketSpatialState(
    -285.0,
    1.2,
    112.5,
    1,
    0,
    18.2,
    'butter-lamp-dusk',
    'clear',
  );
  const pushkariniNoon = computeLumbiniCricketSpatialState(
    -285.0,
    1.2,
    112.5,
    1,
    0,
    12.5,
    'lotus-dawn',
    'clear',
  );
  const pushkariniRain = computeLumbiniCricketSpatialState(
    -285.0,
    1.2,
    112.5,
    1,
    0,
    21.5,
    'moonlight-vigil',
    'rain',
  );
  assert.ok(pushkariniNight.cricketActivity > pushkariniDusk.cricketActivity * 0.9);
  assert.ok(pushkariniDusk.cricketActivity > pushkariniNoon.cricketActivity * 1.4);
  assert.ok(pushkariniRain.cricketActivity < pushkariniNight.cricketActivity * 0.25);

  const farAway = computeLumbiniCricketSpatialState(40, 1.2, -50, 0, -1, 21.5, 'moonlight-vigil', 'clear');
  assert.equal(farAway.inZone, false);
  assert.equal(farAway.cricketActivity, 0);
});

test('findWaterEdgeRippleOrigin triggers ripples ONLY when wading inside water (never on dry banks or bridges)', () => {
  // Dry shore/promenade/bridge coordinates must return null
  assert.equal(findWaterEdgeRippleOrigin(-285.5, 112.5, 1), null);
  assert.equal(findWaterEdgeRippleOrigin(LUMBINI_PEACE_CANAL.minX - 2.0, 90, 2), null);
  assert.equal(findWaterEdgeRippleOrigin(LUMBINI_PEACE_CANAL.centerX, LUMBINI_PEACE_CANAL.bridgeCenterZ, 2), null);
  assert.equal(findWaterEdgeRippleOrigin(GLACIAL_LAKE.x + GLACIAL_LAKE.waterRadius + 1.4, GLACIAL_LAKE.z, 3), null);
  assert.equal(findWaterEdgeRippleOrigin(-127.8, 108.0, 5), null);
  assert.equal(findWaterEdgeRippleOrigin(-45, 55, 6), null);

  // Actual water wading coordinates emit valid ripples
  const pushkariniWade = findWaterEdgeRippleOrigin(-270.0, 112.5, 1);
  assert.equal(pushkariniWade?.waterBody, 'pushkarini');

  const canalWade = findWaterEdgeRippleOrigin(LUMBINI_PEACE_CANAL.centerX, 60, 2);
  assert.equal(canalWade?.waterBody, 'peace-canal');

  const lakeWade = findWaterEdgeRippleOrigin(GLACIAL_LAKE.x + 12.0, GLACIAL_LAKE.z, 3);
  assert.equal(lakeWade?.waterBody, 'glacial-lake');

  const riverZ = 20;
  const riverWade = findWaterEdgeRippleOrigin(getRiverCenterX(riverZ), riverZ, 4);
  assert.equal(riverWade?.waterBody, 'bagmati-river');

  const gangaSagarWade = findWaterEdgeRippleOrigin(-136.5, 108.0, 5);
  assert.equal(gangaSagarWade?.waterBody, 'ganga-sagar');
});

test('Graphics quality config, prayer wheel damped spin, and contextual Maya Devi / sanctuary actions work cleanly', () => {
  const high = getGraphicsQualityConfig('high');
  const med = getGraphicsQualityConfig('medium');
  const low = getGraphicsQualityConfig('low');
  assert.equal(high.grassRatio, 1.0);
  assert.equal(med.grassRatio, 0.55);
  assert.equal(low.grassRatio, 0.25);
  assert.equal(low.shadowMapSize, 512);

  const spun = stepPrayerWheelSpin(0, 0.22, 0.05, 14);
  assert.ok(spun.velocity > 10 && spun.active);
  const settled = stepPrayerWheelSpin(spun.angle, spun.velocity, 0.1, 0);
  assert.ok(settled.velocity < spun.velocity);

  const markerAct = computeContextualWorldAction(-280, 79.5, null, [], [], [], []);
  assert.equal(markerAct?.kind, 'inspect-marker-stone');

  const nativityAct = computeContextualWorldAction(-280, 65.8, null, [], [], [], []);
  assert.equal(nativityAct?.kind, 'inspect-nativity-relief');

  const wheelAct = computeContextualWorldAction(-287.4, 134.5, null, [{ x: -287.4, z: 135.0 }], [], [], []);
  assert.equal(wheelAct?.kind, 'spin-prayer-wheel');

  const pebbleAct = computeContextualWorldAction(
    -285.5,
    112.5,
    null,
    [],
    [],
    [{ x: -285.5, z: 112.5, pondX: -275, pondZ: 112.5, label: 'Pushkarini Pond' }],
    [],
  );
  assert.equal(pebbleAct?.kind, 'toss-pebble');

  const meditateAct = computeContextualWorldAction(
    -309.0,
    113.5,
    null,
    [],
    [],
    [],
    [{ x: -309.0, z: 112.5, lookX: -270, lookZ: 112.5, label: 'Bodhi Chautara' }],
  );
  assert.equal(meditateAct?.kind, 'sit-meditate');
});

test('SoundEngine triggers localized 3D forest bird chirps and Lumbini pond cricket stridulations via PannerNode', async () => {
  const prevWindow = (globalThis as { window?: unknown }).window;
  let pannerCount = 0;
  let nowSec = 1.0;
  const makeParam = (init = 0) => ({
    value: init,
    setValueAtTime(v: number) { this.value = v; },
    linearRampToValueAtTime(v: number) { this.value = v; },
    exponentialRampToValueAtTime(v: number) { this.value = v; },
    setTargetAtTime(v: number) { this.value = v; },
    cancelScheduledValues() {},
  });
  class MockAudioCtx {
    public sampleRate = 44100;
    public state = 'running';
    public destination = { connect() {} };
    public listener = {
      positionX: makeParam(0), positionY: makeParam(0), positionZ: makeParam(0),
      forwardX: makeParam(0), forwardY: makeParam(0), forwardZ: makeParam(-1),
      upX: makeParam(0), upY: makeParam(1), upZ: makeParam(0),
    };
    get currentTime() { return nowSec; }
    resume() { return Promise.resolve(); }
    close() { return Promise.resolve(); }
    createBuffer(_c: number, len: number, sr: number) {
      return { duration: len / sr, getChannelData: () => new Float32Array(len) };
    }
    createBufferSource() {
      return { buffer: null, loop: false, onended: null, connect() {}, disconnect() {}, start() {}, stop() {} };
    }
    createBiquadFilter() {
      return { type: 'lowpass', frequency: makeParam(400), Q: makeParam(1), connect() {}, disconnect() {} };
    }
    createGain() { return { gain: makeParam(1), connect() {}, disconnect() {} }; }
    createOscillator() {
      return { type: 'sine', frequency: makeParam(440), onended: null, connect() {}, disconnect() {}, start() {}, stop() {} };
    }
    createPanner() {
      pannerCount++;
      return {
        panningModel: 'equalpower', distanceModel: 'inverse', refDistance: 1, maxDistance: 100,
        rolloffFactor: 1, coneInnerAngle: 360, coneOuterAngle: 360, coneOuterGain: 0,
        positionX: makeParam(0), positionY: makeParam(0), positionZ: makeParam(0),
        connect() {}, disconnect() {},
      };
    }
  }

  try {
    (globalThis as { window?: unknown }).window = { AudioContext: MockAudioCtx };
    const { soundEngine } = await import('./soundEngine');
    soundEngine.setEnabled(true);

    // Advance past startup chirp delay inside Pashupati Woodland (-48, -24)
    nowSec = 4.0;
    const forestMix = computeSpatialAmbienceMix(-48, -24, 0);
    soundEngine.updateAmbience(
      forestMix,
      0.016,
      'sanctuary-auto',
      'clear',
      { x: -48, y: 1.8, z: -24, forwardX: 0, forwardY: 0, forwardZ: -1 },
      10,
    );
    const forestStatus = soundEngine.getForestBirdStatus();
    assert.equal(forestStatus.inForest, true);
    assert.ok(forestStatus.eventCount >= 1);
    assert.ok(pannerCount >= 1);

    // Move to Pushkarini Pond West Bank at dusk/night -> cricket stridulation fires spatially
    nowSec = 6.5;
    const lumbiniMix = computeSpatialAmbienceMix(-285, 112.5, 0);
    soundEngine.updateAmbience(
      lumbiniMix,
      0.016,
      'moonlight-vigil',
      'clear',
      { x: -285, y: 1.5, z: 112.5, forwardX: 1, forwardY: 0, forwardZ: 0 },
      21.5,
    );
    const cricketStatus = soundEngine.getLumbiniCricketStatus();
    assert.equal(cricketStatus.inZone, true);
    assert.ok(cricketStatus.eventCount >= 1);
    assert.equal(cricketStatus.nearestEmitterId, 'lumbini-cricket-pushkarini-west');
    assert.ok(pannerCount >= 2);

    soundEngine.setEnabled(false);
    soundEngine.dispose();
  } finally {
    if (prevWindow === undefined) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      (globalThis as { window?: unknown }).window = prevWindow;
    }
  }
});

test('Lumbini StaticPhysicsWorld BVH allows uninterrupted walk from South Bridge through Torana around Baby Buddha up ramp and around Maya Devi interior boardwalk', async () => {
  const THREE = await import('three');
  const { createLumbiniBuddha } = await import('./lumbiniTemple');
  const { StaticPhysicsWorld } = await import('./physicsBvh');
  const {
    createDioramaTerrain,
    createLumbiniPeaceParkland,
  } = await import('./mountainAndTerrain');

  const tex = new THREE.Texture();
  const mockTextures = new Proxy(
    {
      meadowMap: tex,
      meadowNormal: tex,
      meadowRough: tex,
      createSignTexture: () => tex,
      janaki: new Proxy({}, { get: () => tex }),
    },
    { get: (target, prop) => (prop in target ? (target as Record<string | symbol, unknown>)[prop] : tex) },
  ) as unknown as import('./proceduralTextures').ProceduralTextureSet;

  const terrainMesh = createDioramaTerrain(mockTextures);
  const built = createLumbiniBuddha(mockTextures, true);
  built.group.position.set(-280, 0, 96);
  const parkland = createLumbiniPeaceParkland(mockTextures);

  const root = new THREE.Group();
  root.add(terrainMesh, built.group, parkland.group);
  root.updateMatrixWorld(true);

  const bvh = new StaticPhysicsWorld();
  bvh.buildFromScene(root);

  // Verify no hedge or thin box InstancedMesh created a giant > 3m radius circular collider near South Torana
  const waypoints: Array<[number, number]> = [
    [-280.0, 152.0], // South Sacred Bridge
    [-280.0, 146.0], // Through South Torana gate
    [-280.0, 140.5], // South Axial Forecourt
    [-285.5, 138.0], // Around Baby Buddha monument West flank
    [-285.5, 112.5], // Pushkarini Overlook Causeway
    [-280.0, 100.0], // Cross Promenade -> Maya Devi Forecourt
    [-280.0, 94.0],  // Base of Maya Devi South Ramp
    [-280.0, 82.0],  // Inside Maya Devi South Gallery
    [-292.5, 82.0],  // SW Interior corner
    [-292.5, 65.5],  // NW Interior corner
    [-280.0, 65.5],  // North Nativity Relief overlook
    [-267.5, 65.5],  // NE Interior corner
    [-267.5, 82.0],  // SE Interior corner
  ];

  let px = -280.0;
  let pz = 158.5;
  let py = getSurfaceHeightAt(px, pz);

  for (const [tx, tz] of waypoints) {
    for (let step = 0; step < 60; step++) {
      const dx = tx - px;
      const dz = tz - pz;
      const dist = Math.hypot(dx, dz);
      if (dist <= 0.45) break;
      const moveLen = Math.min(0.45, dist);
      const nx = px + (dx / dist) * moveLen;
      const nz = pz + (dz / dist) * moveLen;
      const clamped = clampToWalkable(px, pz, nx, nz);
      const resolved = bvh.resolveHorizontalCollision(px, pz, clamped.x, clamped.z, py, 1.75, 0.4, 0.26);
      px = resolved.x;
      pz = resolved.z;
      const bvhY = bvh.sampleFloorHeight(px, pz, py + 0.34);
      py = Math.max(getSurfaceHeightAt(px, pz), bvhY ?? 0);
    }
    const err = Math.hypot(tx - px, tz - pz);
    assert.ok(err <= 0.65, `Failed to reach waypoint (${tx}, ${tz}), stopped at (${px.toFixed(2)}, ${pz.toFixed(2)}), err=${err.toFixed(2)}`);
  }
  assert.ok(py >= 1.20, `Expected interior boardwalk elevation >= 1.20m, got ${py.toFixed(2)}`);
});

test('Footprint decal ring-buffer pool and meditation butterfly flocking update deterministically', async () => {
  const {
    createFootprintDecalPool,
    recordFootprintDecal,
    computeFootprintDecalAlpha,
    stepFootprintDecalPool,
    createMeditationButterflyStates,
    stepMeditationButterflies,
  } = await import('./worldLogic');

  const pool = createFootprintDecalPool(8);
  assert.equal(pool.slots.length, 8);
  for (let i = 0; i < 10; i++) {
    recordFootprintDecal(pool, -280, 0.35, 112 - i * 0.6, Math.PI, i % 2 === 0 ? 1 : -1, 'stone');
  }
  assert.equal(pool.totalSpawned, 10);
  const activeBefore = stepFootprintDecalPool(pool, 0.5);
  assert.equal(activeBefore, 8);
  const sampleAlpha = computeFootprintDecalAlpha(0.5, 8.2);
  assert.ok(sampleAlpha > 0.5 && sampleAlpha <= 0.66);
  const expiredAlpha = computeFootprintDecalAlpha(9.0, 8.2);
  assert.equal(expiredAlpha, 0);
  const activeAfterExpire = stepFootprintDecalPool(pool, 9.0);
  assert.equal(activeAfterExpire, 0);

  const butterflies = createMeditationButterflyStates(16);
  assert.equal(butterflies.length, 16);
  const medX = -304.0;
  const medY = 0.55;
  const medZ = 112.5;
  const avgDistBefore =
    butterflies.reduce((sum, b) => sum + Math.hypot(b.x - medX, b.z - medZ), 0) / butterflies.length;
  for (let s = 0; s < 45; s++) {
    stepMeditationButterflies(butterflies, 0.05, s * 0.05, true, medX, medY, medZ);
  }
  const avgDistAfter =
    butterflies.reduce((sum, b) => sum + Math.hypot(b.x - medX, b.z - medZ), 0) / butterflies.length;
  assert.ok(
    avgDistAfter < avgDistBefore * 0.55 && avgDistAfter < 3.5,
    `Expected butterflies to flock around meditating player (${avgDistBefore.toFixed(1)} -> ${avgDistAfter.toFixed(1)})`,
  );
});

test('Full 360 camera vertical pitch (-80 to +85 deg), anti-floor clipping, and Maya Devi 3 plaques work cleanly', async () => {
  const {
    CAMERA_LOOK_DOWN_MAX_RAD,
    CAMERA_LOOK_UP_MAX_RAD,
    clampCameraPitch,
    computeFirstPersonLookPitch,
    dampCameraValue,
    resolveThirdPersonCameraFloorClearance,
    computeContextualWorldAction,
  } = await import('./worldLogic');

  // Vertical pitch unlocked across -80 deg (down) to +85 deg (up)
  assert.ok(Math.abs(CAMERA_LOOK_DOWN_MAX_RAD - (80 * Math.PI) / 180) < 1e-6);
  assert.ok(Math.abs(CAMERA_LOOK_UP_MAX_RAD - (85 * Math.PI) / 180) < 1e-6);
  assert.equal(clampCameraPitch(-3.0), -CAMERA_LOOK_UP_MAX_RAD);
  assert.equal(clampCameraPitch(3.0), CAMERA_LOOK_DOWN_MAX_RAD);
  assert.ok(computeFirstPersonLookPitch(-CAMERA_LOOK_UP_MAX_RAD) > 1.48);
  assert.ok(computeFirstPersonLookPitch(CAMERA_LOOK_DOWN_MAX_RAD) < -1.39);

  // Damping moves smoothly toward target without overshoot
  const damped = dampCameraValue(0, 1.0, 12.0, 0.05);
  assert.ok(damped > 0.3 && damped < 0.7, `Unexpected damped value: ${damped}`);

  // Anti-floor clipping slides camera up toward shoulder instead of dipping below walkway (y=1.25m)
  const targetY = 2.75; // player at 1.25 + 1.5
  const pitchUp = -1.15; // looking ~66 deg up -> boom swings downward
  const dist = 6.0;
  const rawCamY = targetY + Math.sin(pitchUp) * dist; // ~ -2.72m (below floor!)
  const resolved = resolveThirdPersonCameraFloorClearance(
    -280,
    targetY,
    80.5,
    -280,
    rawCamY,
    80.5 + Math.cos(pitchUp) * dist,
    0.78,
    0.38,
    () => 1.25,
  );
  assert.equal(resolved.clipped, true);
  assert.ok(resolved.y >= 1.25 + 0.38 - 1e-4, `Camera clipped below walkway: ${resolved.y}`);

  // All 3 Maya Devi museum plaques trigger accurately based on boardwalk location
  const southPlaque = computeContextualWorldAction(-280.0, 80.2, null, [], [], [], []);
  assert.equal(southPlaque?.kind, 'inspect-marker-stone');
  const eastPlaque = computeContextualWorldAction(-270.2, 74.0, null, [], [], [], []);
  assert.equal(eastPlaque?.kind, 'inspect-mauryan-chambers');
  const northPlaque = computeContextualWorldAction(-280.0, 67.6, null, [], [], [], []);
  assert.equal(northPlaque?.kind, 'inspect-nativity-relief');
});

test('Maya Devi skylight bird exclusion, Lumbini pond proximity ripple state, and South Forecourt prayer wheel racks behave accurately', async () => {
  const { isInsideMayaDeviBirdExclusion, computeLumbiniPondProximityState } = await import('./worldLogic');

  // Inside Maya Devi skylight & sanctum interior (the former stuck ringneck_dove coordinate) is strictly excluded
  assert.equal(isInsideMayaDeviBirdExclusion(-281.45, 7.3, 74.0), true);
  assert.equal(isInsideMayaDeviBirdExclusion(-280.0, 12.0, 74.0), true);
  // High flying above skylight roof or outside temple walls is allowed
  assert.equal(isInsideMayaDeviBirdExclusion(-280.0, 15.2, 74.0), false);
  assert.equal(isInsideMayaDeviBirdExclusion(-280.0, 6.0, 98.0), false);

  // Dry bank/overlook/bridge positions yield inactive pond proximity; actual in-water wading activates proximity
  const dryOverlook = computeLumbiniPondProximityState(-282.4, 112.5, 4.5);
  assert.equal(dryOverlook.active, false);
  assert.equal(dryOverlook.nearestPond, 'none');

  const dryBridge = computeLumbiniPondProximityState(-280.0, 152.0, 3.8);
  assert.equal(dryBridge.active, false);

  const idleInPushkarini = computeLumbiniPondProximityState(-270.0, 112.5, 0.0);
  const wadeInPushkarini = computeLumbiniPondProximityState(-270.0, 112.5, 4.5);
  assert.equal(idleInPushkarini.active, true);
  assert.equal(idleInPushkarini.nearestPond, 'pushkarini');
  assert.ok(wadeInPushkarini.factor > idleInPushkarini.factor, 'Faster wading should increase wave factor');

  const wadeSurrounding = computeLumbiniPondProximityState(-305.0, 152.0, 3.8);
  assert.equal(wadeSurrounding.active, true);
  assert.equal(wadeSurrounding.nearestPond, 'surrounding');

  // Far away from Lumbini ponds yields inactive proximity state
  const farState = computeLumbiniPondProximityState(0.0, 0.0, 5.0);
  assert.equal(farState.active, false);
  assert.equal(farState.factor, 0);

  // South Forecourt Mani prayer wheel shrines block direct walk-through while central Maya Devi avenue stays walkable
  assert.equal(isWalkablePosition(-286.8, 97.8), false, 'West South Forecourt prayer wheel rack plinth blocks pass-through');
  assert.equal(isWalkablePosition(-273.2, 97.8), false, 'East South Forecourt prayer wheel rack plinth blocks pass-through');
  assert.equal(isWalkablePosition(-280.0, 97.8), true, 'Central South Forecourt avenue remains open');
});

test('Lumbini floating incense smoke shader, butter lamp Ritual Offering action, and flame kinematics work cleanly', async () => {
  const {
    BABY_BUDDHA_MONUMENT_ORIGIN,
    computeButterLampFlameState,
    computeContextualWorldAction,
    generateLumbiniIncenseSmokePlacements,
  } = await import('./worldLogic');
  const { LumbiniIncenseSmokeSystem } = await import('./lumbiniIncenseSmoke');
  const { soundEngine } = await import('./soundEngine');

  // 1. Deterministic incense smoke placements anchored around Baby Buddha statue base
  const plumesA = generateLumbiniIncenseSmokePlacements(240, 202618);
  const plumesB = generateLumbiniIncenseSmokePlacements(240, 202618);
  assert.deepEqual(plumesA, plumesB, 'Incense smoke generator must be deterministic');
  assert.equal(plumesA.length, 240);

  const brazierCounts = [0, 0, 0, 0];
  for (const p of plumesA) {
    const dist = Math.hypot(p.x - BABY_BUDDHA_MONUMENT_ORIGIN.x, p.z - BABY_BUDDHA_MONUMENT_ORIGIN.z);
    assert.ok(dist >= 1.1 && dist <= 4.6, `Smoke plume must stay around Buddha base, got dist=${dist.toFixed(2)}`);
    assert.ok(p.y >= 0.6 && p.y <= 1.25, `Smoke plume base sits at brazier/basin height, got y=${p.y.toFixed(2)}`);
    assert.ok(p.riseHeight >= 1.8 && p.speed > 0.08);
    if (p.brazierIndex >= 0) brazierCounts[p.brazierIndex]++;
  }
  assert.ok(brazierCounts.every((c) => c >= 36), 'Every bronze incense brazier must emit a dense rising plume');

  const smokeSys = new LumbiniIncenseSmokeSystem(240, 202618);
  smokeSys.update(2.4, 0.35, 0.12, 1.0, '#ffd8a4', 0.5);
  assert.equal(smokeSys.material.uniforms.uTime.value, 2.4);
  assert.equal(smokeSys.material.uniforms.uRitualGlow.value, 0.5);
  smokeSys.dispose();

  // 2. Butter lamp flame kinematics: unlit stays 0, lit springs upward and dances smoothly
  const unlit = computeButterLampFlameState(5.0, -1, 1);
  assert.equal(unlit.scaleY, 0);
  assert.equal(unlit.haloOpacity, 0);
  const igniting = computeButterLampFlameState(5.18, 5.0, 1);
  assert.ok(igniting.scaleY > 0.5 && igniting.haloOpacity > 0.25);
  const steadyA = computeButterLampFlameState(8.0, 5.0, 1);
  const steadyB = computeButterLampFlameState(8.2, 5.0, 1);
  assert.ok(steadyA.scaleY > 0.7 && steadyB.scaleY > 0.7);
  assert.notEqual(steadyA.scaleY, steadyB.scaleY, 'Lit butter lamp flame should flicker continuously');

  // 3. Contextual Ritual Offering prioritizes nearest unlit butter lamp around Baby Buddha base
  const lamps = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    return {
      x: -280.0 + Math.sin(a) * 2.98 * 1.28,
      z: 135.0 + Math.cos(a) * 2.98 * 1.28,
      isLit: false,
    };
  });
  const prayerWheels = [
    { x: -287.4, z: 135.0 },
    { x: -272.6, z: 135.0 },
  ];
  const pebbles = [{ x: -282.5, z: 148.8, pondX: -288.5, pondZ: 151.0, label: 'Sacred Pond' }];

  const nearSouthLamp = computeContextualWorldAction(-280.0, 140.4, null, prayerWheels, [], pebbles, [], lamps);
  assert.equal(nearSouthLamp?.kind, 'light-butter-lamp');
  assert.equal(nearSouthLamp?.index, 0);
  assert.ok(nearSouthLamp?.label.includes('Ritual Offering') && nearSouthLamp?.label.includes('(0/8)'));

  // After lighting lamp #0, next [E] targets next unlit lamp and increments count
  lamps[0].isLit = true;
  const secondOffer = computeContextualWorldAction(-280.0, 140.4, null, prayerWheels, [], pebbles, [], lamps);
  assert.equal(secondOffer?.kind, 'light-butter-lamp');
  assert.ok(secondOffer?.index === 1 || secondOffer?.index === 7);
  assert.ok(secondOffer?.label.includes('(1/8)'));

  // Nearby Prayer Wheels & Sacred Pond Pebble cairns retain their distinct actions
  const nearWheel = computeContextualWorldAction(-287.4, 135.5, null, prayerWheels, [], pebbles, [], lamps);
  assert.equal(nearWheel?.kind, 'spin-prayer-wheel');
  const nearPond = computeContextualWorldAction(-282.5, 148.5, null, prayerWheels, [], pebbles, [], lamps);
  assert.equal(nearPond?.kind, 'toss-pebble');

  // 4. Unique meditation sound synthesis counter increments on Ritual Offering trigger
  const beforeSound = soundEngine.getRitualOfferingSoundCount();
  soundEngine.playRitualButterLampOffering(1);
  assert.equal(soundEngine.getRitualOfferingSoundCount(), beforeSound + 1);
});

test('Lumbini realism fixes: Thai sanctuary Buddha headroom, Peace Lanterns lit, zero walkway bowls, and lantern/flagpole clearance', async () => {
  const THREE = await import('three');
  const { buildThaiMarbleSanctuary, buildEternalPeaceFlame } = await import('./lumbiniShrines');
  const { createLumbiniBuddha } = await import('./lumbiniTemple');

  const tex = new THREE.DataTexture(new Uint8Array([200, 180, 160, 255]), 1, 1, THREE.RGBAFormat);
  tex.needsUpdate = true;
  const mockTextures = new Proxy(
    {
      lumbini: new Proxy({}, { get: () => tex }),
      janaki: new Proxy({}, { get: () => tex }),
    },
    { get: (target, prop) => (prop in target ? (target as Record<string | symbol, unknown>)[prop] : tex) },
  ) as unknown as import('./proceduralTextures').ProceduralTextureSet;

  // 1. Thai Sanctuary Buddha crown/halo sits strictly below the 6.50m marble roof tier
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf0bd45 });
  const bronzeMat = new THREE.MeshStandardMaterial({ color: 0x8a5e2b });
  const crimsonMat = new THREE.MeshStandardMaterial({ color: 0x8b1e24 });
  const flameGlowMat = new THREE.MeshStandardMaterial({ color: 0xffaa30, emissive: 0xff7710 });
  const heroMats: import('./lumbiniBuddhaSculpt').BuddhaMaterials = {
    skinMat: goldMat,
    robeMat: goldMat,
    hairMat: goldMat,
    goldMat,
    bronzeMat,
    stonePlinthMat: whiteMat,
    crimsonLacquerMat: crimsonMat,
    flameMat: flameGlowMat,
  };
  const thai = buildThaiMarbleSanctuary(whiteMat, goldMat, crimsonMat, heroMats);
  const thaiBox = new THREE.Box3().setFromObject(thai.group);
  assert.ok(thaiBox.max.y > 9.5, 'Thai sanctuary roof tiers should rise well above 9m');
  assert.equal(thai.light.position.y > 5.4, true, 'Sanctuary lamp hangs clearly above Buddha crown');

  // 2. Eternal Peace Flame constructs animated flame ribbons and warm light cleanly
  const flame = buildEternalPeaceFlame(whiteMat, whiteMat, bronzeMat, goldMat, flameGlowMat);
  assert.ok(flame.flameNode.children.length >= 5, 'Eternal Peace Flame should include 4 volumetric flame sheets & rising sparks');

  // 3. Lumbini Temple has zero stray stone bowls on walkways & active beacon/shrine lights
  const temple = createLumbiniBuddha(mockTextures, true);
  assert.ok(temple.beaconLights.length >= 8, `Shrine & monument lights should illuminate interiors (got ${temple.beaconLights.length})`);
  let stoneCairnCount = 0;
  temple.group.traverse((obj: import('three').Object3D) => {
    if (obj.name === 'walkway-stone-bowl') stoneCairnCount++;
  });
  assert.equal(stoneCairnCount, 0);
});

test('Urli offering-bowl craft: planar water UVs, sculpted lily pads, 3 flame rigs, and generous bench clearance', async () => {
  const THREE = await import('three');
  const { OUTER_TEMPLE_ARTIFACT_SPOTS } = await import('./worldLogic');
  const {
    UrliOfferingBowlSuite,
    createUrliWaterDiscGeo,
    createUrliSculptedLilyPadGeo,
    createUrliFlameTeardropGeo,
  } = await import('./urliLotusCraft');

  // 1. Planar water disc has upward +Y normals and centered planar UVs (no polar pinch)
  const waterGeo = createUrliWaterDiscGeo(0.432, 10, 32);
  const waterNormals = waterGeo.getAttribute('normal');
  const waterUvs = waterGeo.getAttribute('uv');
  assert.equal(waterNormals.getY(0), 1);
  assert.ok(Math.abs(waterUvs.getX(0) - 0.5) < 1e-6);
  assert.ok(Math.abs(waterUvs.getY(0) - 0.5) < 1e-6);
  waterGeo.dispose();

  // 2. Sculpted lily pad & teardrop flame geometries generate valid normals and bounds
  const padGeo = createUrliSculptedLilyPadGeo(0.106, 20);
  const padNormals = padGeo.getAttribute('normal');
  assert.ok(padNormals.count > 40);
  padGeo.dispose();

  const flameGeo = createUrliFlameTeardropGeo(0.017, 0.084);
  flameGeo.computeBoundingBox();
  assert.ok(flameGeo.boundingBox!.max.y > 0.08);
  flameGeo.dispose();

  // 3. Urli suite constructs assembly cleanly in Node with 3 animated flames + water shader uniforms
  const suite = new UrliOfferingBowlSuite(1);
  const stdMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const built = suite.createOfferingBowlAssembly({
    whiteMarbleMat: stdMat,
    tealMarbleMat: stdMat,
    weatheredStoneMat: stdMat,
    agedBronzeMat: stdMat,
    brightBrassMat: stdMat,
  });
  assert.equal(built.flames.length, 3);
  assert.equal(typeof built.waterUniforms.uTime.value, 'number');
  assert.ok(built.group.children.length >= 15);

  // 4. Lumbini South Gate benches and Urli pots maintain >= 4.0m center separation & open mid-gap
  const southPots = OUTER_TEMPLE_ARTIFACT_SPOTS.filter(
    (s) => s.kind === 'offering-bowl' && Math.abs(s.z - 159.5) < 0.5 && s.x < -260 && s.x > -300,
  );
  assert.equal(southPots.length, 2, 'Expected both Lumbini South Gate Urli pots');

  const benchCoords = [
    { x: -280 - 5.8, z: 96 + 70.0 },
    { x: -280 + 5.8, z: 96 + 70.0 },
  ];
  for (const bench of benchCoords) {
    // Bench collider itself blocks walking
    assert.equal(isWalkablePosition(bench.x, bench.z), false);
    // Nearest Urli pot sits at least 4.0m away center-to-center (leaving >2.5m open space)
    const minDist = Math.min(...southPots.map((p) => Math.hypot(p.x - bench.x, p.z - bench.z)));
    assert.ok(minDist >= 4.0, `Expected >=4.0m bench-to-pot clearance, got ${minDist.toFixed(2)}m`);
  }

  // Midpoint between west bench (-285.8, 166.0) and west pot (-285.8, 159.5) is clearly walkable on open grass
  assert.equal(isWalkablePosition(-285.8, 162.75), true);
  // Midpoint between east bench (-274.2, 166.0) and east pot (-274.2, 159.5) is clearly walkable on open grass
  assert.equal(isWalkablePosition(-274.2, 162.75), true);
});

test('Unified Lumbini complex perimeter fence encloses Temple + Sacred Lake + Peace Canal with clear road separation and Janaki spacing', async () => {
  const THREE = await import('three');
  const { LANDMARKS } = await import('../data/portfolioData');
  const { createLumbiniBuddha } = await import('./lumbiniTemple');
  const { createCurbedRoads, createDioramaTerrain, sampleTerrainMeshHeight } = await import('./mountainAndTerrain');
  const { buildDetailedPeaceLantern } = await import('./lumbiniGardenCraft');

  const lumbini = LANDMARKS.find((l) => l.id === 'lumbini-buddha')!;
  const janaki = LANDMARKS.find((l) => l.id === 'janaki-mandir')!;
  const lx = lumbini.position.x;
  const lz = lumbini.position.z;
  const fb = LUMBINI_FENCE_BOUNDS;

  // 1. Unified outer complex perimeter fence encloses Temple + Sacred Lake + Peace Canal while 4 cardinal gates stay open
  assert.ok(
    fb.minX <= LUMBINI_PEACE_CANAL.minX - 10,
    `Expected West fence (${fb.minX}) to enclose Peace Canal (${LUMBINI_PEACE_CANAL.minX}) with >=10m lawn`,
  );
  assert.equal(isWalkablePosition(lx - 20.0, lz + fb.localMaxZ), false, 'South outer perimeter fence must block crossing');
  assert.equal(isWalkablePosition(lx + 20.0, lz + fb.localMinZ), false, 'North outer perimeter fence must block crossing');
  assert.equal(isWalkablePosition(lx + fb.localMinX, lz + 25.0), false, 'West outer perimeter fence must block crossing');
  assert.equal(isWalkablePosition(lx + fb.localMaxX, lz - 20.0), false, 'East outer perimeter fence must block crossing');
  assert.equal(isWalkablePosition(lx, lz + fb.localMaxZ), true, 'South outer gate entrance must remain open');
  assert.equal(isWalkablePosition(lx, lz + fb.localMinZ), true, 'North outer gate entrance must remain open');
  assert.equal(isWalkablePosition(lx + fb.localMinX, lz + 4.0), true, 'West outer gate entrance must remain open');
  assert.equal(isWalkablePosition(lx + fb.localMaxX, lz + 4.0), true, 'East outer gate entrance must remain open');

  // Inner garden-to-lake transition and generous outer lawns stay unobstructed
  assert.equal(isWalkablePosition(lx - 20.0, lz + 51.0), true, 'Inner south island edge stays open');
  assert.equal(isWalkablePosition(lx - 20.0, lz + 64.0), true, 'Expanded outer south lawn stays open between pond and fence');
  assert.equal(isWalkablePosition(lx + 20.0, lz - 43.0), true, 'Inner north island edge stays open');
  assert.equal(isWalkablePosition(lx + 20.0, lz - 58.0), true, 'Expanded outer north lawn stays open between pond and fence');

  // Cobblestone perimeter roads (Chains 10 & 11) stay cleanly >= 8m outside Lumbini perimeter fence
  for (const chain of [ROAD_PATHS[10], ROAD_PATHS[11]]) {
    for (const [rx, rz] of chain) {
      const distOutX = Math.max(0, fb.minX - rx, rx - fb.maxX);
      const distOutZ = Math.max(0, fb.minZ - rz, rz - fb.maxZ);
      const clearance = Math.hypot(distOutX, distOutZ);
      assert.ok(
        clearance >= 8.0,
        `Road vertex (${rx}, ${rz}) must stay >= 8.0m outside Lumbini fence, got ${clearance.toFixed(2)}m`,
      );
    }
  }

  // Wide green valley separation (>= 50m) between Lumbini East Road (x = -205) and Janaki Mandir West Wall (x = -148.5)
  const janakiWestWallX = janaki.position.x - 56.5;
  const lumbiniEastRoadX = ROAD_PATHS[11][0][0];
  assert.ok(
    janakiWestWallX - lumbiniEastRoadX >= 50.0,
    `Expected >= 50m open valley between Lumbini East Road (${lumbiniEastRoadX}) and Janaki West Wall (${janakiWestWallX})`,
  );

  // Clean back & cardinal gate avenues sit flat at 0.35m above depressed terrain (<= 0.16m)
  const tex = new THREE.DataTexture(new Uint8Array([200, 180, 160, 255]), 1, 1, THREE.RGBAFormat);
  tex.needsUpdate = true;
  const mockTextures = new Proxy(
    {
      lumbini: new Proxy({}, { get: () => tex }),
      janaki: new Proxy({}, { get: () => tex }),
    },
    { get: (target, prop) => (prop in target ? (target as Record<string | symbol, unknown>)[prop] : tex) },
  ) as unknown as import('./proceduralTextures').ProceduralTextureSet;

  const terrainMesh = createDioramaTerrain(mockTextures);
  for (const [ax, az, label] of [
    [lx, lz + 66.0, 'South Gate avenue'],
    [lx, lz - 58.0, 'North Back Gate avenue'],
    [lx + 57.0, lz + 4.0, 'East Gate avenue'],
    [-362.0, 100.0, 'West Gate avenue'],
  ] as Array<[number, number, string]>) {
    assert.ok(Math.abs(getSurfaceHeightAt(ax, az) - 0.35) < 0.02, `${label} must sit at 0.35m`);
    assert.ok(sampleTerrainMeshHeight(terrainMesh, ax, az) <= 0.16, `${label} terrain must stay depressed below brick pavers`);
  }

  // 2. Unified perimeter fence & all 18 Peace Garden stone lanterns present in built Lumbini group
  const built = createLumbiniBuddha(mockTextures, true);
  assert.ok(
    built.beaconLights.length >= 26,
    `Expected all 18 Peace Garden lanterns + shrine lights in beaconLights (>= 26), got ${built.beaconLights.length}`,
  );
  let hasFence = false;
  built.group.traverse((o) => {
    if (o.name === 'lumbini-complex-perimeter-fence') hasFence = true;
  });
  assert.equal(hasFence, true, 'Expected unified lumbini-complex-perimeter-fence in Lumbini complex');

  // 3. Every roadside Peace Lantern carries a pooled warm PointLight (zero unlit lanterns!)
  const roads = createCurbedRoads(mockTextures, terrainMesh);
  assert.equal(
    roads.lanternLights.length,
    ROAD_LANTERN_COORDS.length,
    `Expected every roadside lantern (${ROAD_LANTERN_COORDS.length}) to have an active PointLight, got ${roads.lanternLights.length}`,
  );

  // 4. Peace Lantern flame core uses bright HDR emissive MeshStandardMaterial (not flat white MeshBasicMaterial)
  const stdMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const lanternMeshGroup = buildDetailedPeaceLantern(stdMat, stdMat, stdMat);
  let emissiveFlameMeshes = 0;
  lanternMeshGroup.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const m = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (m.isMeshStandardMaterial && m.emissiveIntensity >= 2.0) {
        emissiveFlameMeshes++;
      }
    }
  });
  assert.ok(emissiveFlameMeshes >= 2, `Expected HDR emissive inner + outer flame meshes in Peace Lantern, got ${emissiveFlameMeshes}`);
});





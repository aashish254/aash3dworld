import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BRIDGE_BOUNDS,
  GLACIAL_LAKE,
  LUMBINI_PEACE_CANAL,
  ROAD_LANTERN_COORDS,
  SPAWN_POSITION,
  WORLD_RADIUS,
  clampToWalkable,
  computeAtmosphereParticleProfile,
  computeEffectiveLightingState,
  computeIncenseSmokeProfile,
  computeIncenseVentOffsets,
  computeLumbiniAudioProfile,
  computeSpatialAmbienceMix,
  computeTimeLightingState,
  decodeWaypointsFromHash,
  encodeWaypointsToHash,
  findNearestLandmark,
  getFootstepSurfaceKind,
  getLandmarkApproachPoint,
  getRiverCenterX,
  groundHeightAt,
  isOnLumbiniCanalBridge,
  isWalkablePosition,
  mapWmoToWeather,
  sampleBirdFlightState,
  validateContactPayload,
} from './worldLogic';
import { LANDMARKS } from '../data/portfolioData';

test('spawn and all landmark plazas sit on walkable terrain above water', () => {
  assert.equal(WORLD_RADIUS, 410);
  assert.equal(isWalkablePosition(SPAWN_POSITION.x, SPAWN_POSITION.z), true);
  assert.ok(groundHeightAt(SPAWN_POSITION.x, SPAWN_POSITION.z) > -0.2);
  assert.equal(LANDMARKS.length, 10);

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

  const lumbini = computeSpatialAmbienceMix(-210, 96, 0.2);
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

  // Non-Janaki/Lumbini landmark monuments block solid cores while EVERY landmark approach point stays walkable
  for (const lm of LANDMARKS) {
    if (lm.id !== 'janaki-mandir' && lm.id !== 'lumbini-buddha') {
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
  const inLumbiniForest = computeForestProximity(-210, 96);
  const inPumdikotForest = computeForestProximity(-108, -74);
  const openSpawn = computeForestProximity(0, 6);

  assert.ok(inLumbiniForest.forestProximity > 0.9);
  assert.equal(inLumbiniForest.nearestForestId, 'lumbini-grove');
  assert.ok(inPumdikotForest.windRustleLevel > 0.9);
  assert.ok(openSpawn.forestProximity < 0.35);

  const lumbiniMix = computeSpatialAmbienceMix(-210, 96, 0.2);
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

  const lx = -210;
  const lz = 96;

  // Walkable ceremonial gates, red-brick promenades, Maya Devi South Dharmachakra ramp & interior timber boardwalk
  assert.equal(isWalkablePosition(lx, lz + 56.5), true, 'Lumbini South approach must be walkable');
  assert.equal(isWalkablePosition(lx, lz + 51.8), true, 'South Torana Gate opening must be walkable');
  assert.equal(isWalkablePosition(lx, lz - 43.8), true, 'North Torana Gate opening must be walkable');
  assert.equal(isWalkablePosition(lx - 44.0, lz + 4.0), true, 'West Cross Gate opening must be walkable');
  assert.equal(isWalkablePosition(lx + 44.0, lz + 4.0), true, 'East Cross Gate opening toward Janaki corridor must be walkable');
  assert.equal(isWalkablePosition(lx, lz + 4.0), true, 'Main East-West red brick promenade must be walkable');
  assert.equal(isWalkablePosition(lx, lz - 6.0), true, 'Maya Devi Temple South Dharmachakra ramp must be walkable');
  assert.equal(isWalkablePosition(lx, lz - 10.5), true, 'Maya Devi Temple doorway threshold must be walkable');
  assert.equal(isWalkablePosition(lx - 13.0, lz - 22.0), true, 'Maya Devi Temple interior West boardwalk must be walkable');
  assert.equal(isWalkablePosition(lx, lz - 30.5), true, 'Maya Devi Temple interior North boardwalk must be walkable');

  // Swept walk from South cross-promenade straight up the Dharmachakra ramp into the Maya Devi boardwalk
  let rampZ = lz + 4.0;
  for (let s = 0; s < 20; s++) {
    rampZ = clampToWalkable(lx, rampZ, lx, rampZ - 0.95).z;
  }
  assert.ok(rampZ <= lz - 11.5, `Expected straight walk up Maya Devi ramp to enter interior boardwalk, got ldz=${rampZ - lz}`);

  // Solid walls, sunken pit, statues, Ashoka Pillar, Pushkarini Pond & Sacred Garden shrines block walking
  assert.equal(isWalkablePosition(lx, lz - 22.0), false, 'Maya Devi sunken Mauryan ruins pit / Marker Stone must block walking');
  assert.equal(isWalkablePosition(lx + 10.0, lz - 10.2), false, 'Maya Devi South white-brick wall must block walking');
  assert.equal(isWalkablePosition(lx, lz + 39.0), false, 'Golden Baby Buddha Lotus Monument must block walking');
  assert.equal(isWalkablePosition(lx - 27.0, lz - 21.0), false, 'Ashoka Pillar enclosure must block walking');
  assert.equal(isWalkablePosition(lx + 10.0, lz + 16.5), false, 'Pushkarini Sacred Pond water must block walking');
  assert.equal(isWalkablePosition(lx - 32.5, lz + 39.0), false, 'Myanmar Golden Pagoda must block walking');
  assert.equal(isWalkablePosition(lx + 35.0, lz - 22.0), false, 'Royal Thai Marble Sanctuary must block walking');
  assert.equal(isWalkablePosition(lx - 29.0, lz + 16.5), false, 'Sacred Bodhi Tree Chautara must block walking');
  assert.equal(isWalkablePosition(lx + 35.0, lz + 24.0), false, 'Eternal Peace Flame must block walking');

  // Terrain, surface heights & footstep acoustics align cleanly
  assert.ok(groundHeightAt(lx + 10.0, lz + 16.5) < -0.7, 'Pushkarini Pond basin must be carved deeply below zero');
  assert.ok(Math.abs(groundHeightAt(lx, lz + 4.0) - 0.25) < 0.02, 'Lumbini garden ground must sit level at 0.25m');
  assert.ok(groundHeightAt(lx, lz - 6.0) > 0.45 && groundHeightAt(lx, lz - 6.0) < 1.15, 'Maya Devi South ramp climbs smoothly');
  assert.ok(Math.abs(groundHeightAt(lx - 13.0, lz - 22.0) - 1.25) < 0.02, 'Maya Devi interior boardwalk sits at 1.25m');
  assert.ok(Math.abs(groundHeightAt(lx, lz - 22.0) + 0.10) < 0.02, 'Maya Devi sunken Mauryan pit sits at -0.10m');
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
        pos.x > -260 && pos.x < -160 && pos.z > 46 && pos.z < 152,
        false,
        `Wild flora spawned inside 88m x 96m Lumbini Sacred Garden at (${pos.x.toFixed(1)}, ${pos.z.toFixed(1)})`,
      );
    }
  }

  // Headless build sanity for 88m x 96m Lumbini Sacred Garden complex
  const built = createLumbiniBuddha(mockTextures);
  assert.ok(built.beaconLights.length >= 2);
  assert.ok(built.animatedNodes.length >= 4);
  const bells = built.group.userData.templeBells as import('three').Group[];
  assert.ok(Array.isArray(bells) && bells.length >= 1);
  const bb = new THREE.Box3().setFromObject(built.group);
  const size = new THREE.Vector3();
  bb.getSize(size);
  assert.ok(size.x >= 86 && size.z >= 94 && size.y >= 15.0, `Expected 88m x 96m Lumbini dimensions, got ${size.toArray()}`);

  // Maya Devi corner flags and Sacred Garden garlands use GPU waving cloth & never spin
  let wavingGarlands = 0;
  let wavingPoleBanners = 0;
  built.group.traverse((o) => {
    if (o.userData?.prayerFlagMode === 'garland') {
      wavingGarlands++;
      assert.equal(o.userData.nonCollidable, true);
    } else if (o.userData?.prayerFlagMode === 'pole-banner') {
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
});

test('Expanded Lumbini Western Peace Canal, Maitri Peace Bridge, Shanti Peace Stupa, and ambience lighting/audio presets behave coherently', async () => {
  const THREE = await import('three');
  const {
    createDioramaTerrain,
    createInstancedGrassField,
    createLumbiniPeaceParkland,
    sampleTerrainMeshHeight,
  } = await import('./mountainAndTerrain');

  // Peace Canal blocks wading, Maitri Peace Bridge carries visitor cleanly across, and Western Stupa plaza stays open around core
  assert.equal(isWalkablePosition(LUMBINI_PEACE_CANAL.centerX, 76), false, 'Peace Canal basin must block walking');
  assert.equal(isOnLumbiniCanalBridge(-272, 100), true);
  assert.equal(isWalkablePosition(-272, 100), true, 'Maitri Peace Bridge deck center must be walkable');
  assert.ok(groundHeightAt(-272, 100) > 0.9, 'Arched Maitri Peace Bridge rises cleanly over Peace Canal');
  assert.equal(getFootstepSurfaceKind(-272, 100), 'stone');
  assert.equal(isWalkablePosition(-298.5, 100), true, 'Western Shanti Peace Stupa Overlook plaza stays walkable');
  assert.equal(isWalkablePosition(LUMBINI_PEACE_CANAL.stupaCenterX, LUMBINI_PEACE_CANAL.stupaCenterZ), false, 'Shanti Peace Stupa masonry blocks pass-through');
  assert.equal(getFootstepSurfaceKind(-298.5, 100), 'stone');

  // Effective lighting state blends smoothly at Lumbini across all presets without bleaching snow/stucco or leaking to Kathmandu
  const dusk = computeEffectiveLightingState(12.5, 'clear', -210, 96, 'butter-lamp-dusk');
  const vigil = computeEffectiveLightingState(12.5, 'clear', -304, 100, 'moonlight-vigil');
  const dawn = computeEffectiveLightingState(12.5, 'clear', -210, 96, 'lotus-dawn');
  const zen = computeEffectiveLightingState(12.5, 'clear', -210, 96, 'bodhi-zen');
  const valleyOutside = computeEffectiveLightingState(12.5, 'clear', 0, 6, 'moonlight-vigil');

  assert.equal(dusk.lumbiniBlend, 1);
  assert.equal(vigil.lumbiniBlend, 1);
  assert.equal(valleyOutside.lumbiniBlend, 0, 'Lumbini preset must not override distant valley lighting');
  assert.ok(dusk.lighting.lanternIntensity > zen.lighting.lanternIntensity);
  assert.ok(vigil.lighting.lanternIntensity > dusk.lighting.lanternIntensity);
  assert.ok(vigil.lighting.starOpacity > 0.8);
  assert.ok(dawn.lighting.bloomThreshold >= 1.0 && vigil.lighting.bloomThreshold >= 1.0);

  // Audio profile activates chimes, singing bowls, and cloth flutter inside Lumbini Peace Garden
  const lumbiniMix = computeSpatialAmbienceMix(-272, 100, 0.98);
  assert.equal(lumbiniMix.activeZone, 'peace-garden');
  const duskAudio = computeLumbiniAudioProfile(lumbiniMix, 'butter-lamp-dusk', 'clear');
  const vigilAudio = computeLumbiniAudioProfile(lumbiniMix, 'moonlight-vigil', 'clear');
  const outsideAudio = computeLumbiniAudioProfile(computeSpatialAmbienceMix(0, 6, 0.25), 'moonlight-vigil', 'clear');
  assert.ok(duskAudio.chimeActivity > 0.5 && duskAudio.flagFlutterLevel > 0.4);
  assert.ok(vigilAudio.bowlActivity > 0.6);
  assert.equal(outsideAudio.chimeActivity, 0);

  // Parkland 3D builder & terrain depression + wild flora exclusion
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
  assert.ok(sampleTerrainMeshHeight(terrainMesh, -298.5, 100) <= 0.16, 'Western Peace Stupa plaza depressed below paving');

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
        Math.hypot(pos.x - LUMBINI_PEACE_CANAL.stupaCenterX, pos.z - LUMBINI_PEACE_CANAL.stupaCenterZ) <=
          LUMBINI_PEACE_CANAL.stupaPlazaRadius + 1.0,
        false,
        `Wild flora spawned inside Western Peace Stupa plaza at (${pos.x.toFixed(1)}, ${pos.z.toFixed(1)})`,
      );
    }
  }

  const parkland = createLumbiniPeaceParkland(mockTextures);
  assert.ok(parkland.beaconLights.length >= 5, 'Expected Maitri bridge & Shanti Stupa beacon lights');
  let stupaFlags = 0;
  parkland.group.traverse((o) => {
    if (typeof o.userData?.prayerFlagMode === 'string') {
      stupaFlags++;
      assert.equal(o.userData.nonCollidable, true);
    }
  });
  assert.ok(stupaFlags >= 8, 'Expected waving Lungta flags around Western Shanti Peace Stupa');
});






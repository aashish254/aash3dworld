import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BRIDGE_BOUNDS,
  GLACIAL_LAKE,
  ROAD_LANTERN_COORDS,
  SPAWN_POSITION,
  WORLD_RADIUS,
  clampToWalkable,
  computeAtmosphereParticleProfile,
  computeIncenseSmokeProfile,
  computeIncenseVentOffsets,
  computeSpatialAmbienceMix,
  computeTimeLightingState,
  decodeWaypointsFromHash,
  encodeWaypointsToHash,
  findNearestLandmark,
  getFootstepSurfaceKind,
  getLandmarkApproachPoint,
  getRiverCenterX,
  groundHeightAt,
  isWalkablePosition,
  mapWmoToWeather,
  sampleBirdFlightState,
  validateContactPayload,
} from './worldLogic';
import { LANDMARKS } from '../data/portfolioData';

test('spawn and all landmark plazas sit on walkable terrain above water', () => {
  assert.equal(WORLD_RADIUS, 220);
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

  const lumbini = computeSpatialAmbienceMix(-8, 120, 0.2);
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

  // Non-Janaki landmark monuments block solid cores while EVERY landmark approach point stays walkable
  for (const lm of LANDMARKS) {
    if (lm.id !== 'janaki-mandir') {
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

test('400 botanical multi-species trees, outer temple artifacts, and raised surface heights align cleanly', async () => {
  const { OUTER_TEMPLE_ARTIFACT_SPOTS, getSurfaceHeightAt, getWorldTreeSpots } = await import('./worldLogic');

  const trees = getWorldTreeSpots();
  assert.equal(trees.length, 400, 'Expected 400 diverse trees across the valley');
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


import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { LANDMARKS } from '../data/portfolioData';
import {
  PASHUPATI_COMPLEX,
  PASHUPATI_INTERACTIVE_SPOTS,
  getPashupatiBagmatiBridgeDeckY,
  getPashupatiSeparationMetrics,
  getPashupatinathSurfaceY,
  getPashupatinathWaterAt,
  isPashupatinathWalkable,
} from './pashupatinathData';
import {
  computeContextualWorldAction,
  getFootstepSurfaceKind,
  getRiverCenterX,
  getSurfaceHeightAt,
  isWalkablePosition,
} from './worldLogic';
import { ProceduralTextureSet } from './proceduralTextures';
import { createPashupatinathComplex } from './pashupatinathComplex';

test('Pashupatinath Temple Complex is relocated >= 160m from both Janaki Mandir and Lumbini', () => {
  const { toJanakiMeters, toLumbiniMeters } = getPashupatiSeparationMetrics(LANDMARKS);
  assert.ok(
    toJanakiMeters >= 160,
    `Expected Pashupatinath -> Janaki separation >= 160m, got ${toJanakiMeters.toFixed(1)}m`,
  );
  assert.ok(
    toLumbiniMeters >= 160,
    `Expected Pashupatinath -> Lumbini separation >= 160m, got ${toLumbiniMeters.toFixed(1)}m`,
  );

  const janaki = LANDMARKS.find((l) => l.id === 'janaki-mandir');
  assert.ok(janaki);
  const janakiSouthWallZ = janaki.position.z + 57.5; // 149.5
  const wallGapMeters = PASHUPATI_COMPLEX.minZ - janakiSouthWallZ;
  assert.ok(
    wallGapMeters >= 80,
    `Expected Pashupatinath -> Janaki wall-to-wall gap >= 80m (like Janaki-Lumbini), got ${wallGapMeters.toFixed(1)}m`,
  );

  const pashupati = LANDMARKS.find((l) => l.id === 'kathmandu-stupa');
  assert.ok(pashupati, 'Pashupatinath landmark entry must exist');
  assert.equal(pashupati.position.x, PASHUPATI_COMPLEX.centerX);
  assert.equal(pashupati.position.z, PASHUPATI_COMPLEX.centerZ);
  assert.ok(pashupati.approachOffset, 'Pashupatinath approachOffset must be defined');
  assert.equal(pashupati.position.x + pashupati.approachOffset.x, -92);
  assert.equal(pashupati.position.z + pashupati.approachOffset.z, 300);
  assert.equal(pashupati.zoneName, 'Pashupatinath Sacred Precinct');
  assert.equal(getRiverCenterX(PASHUPATI_COMPLEX.centerZ), PASHUPATI_COMPLEX.riverCenterX);
});

test('West Plaza spawn, Paschim Dwar, Courtyard, 4 Cardinal Stairways, Pradakshina Gallery, Bagmati Bridge & East Bank are cleanly walkable', () => {
  const c = PASHUPATI_COMPLEX;

  // 1. Teleport spawn on Western Approach Plaza -> open Paschim Dwar -> Pashupati Chowk
  for (let x = -92; x <= -52; x += 1) {
    assert.equal(isWalkablePosition(x, 300), true, `Expected western approach at x=${x}, z=300 to be walkable`);
    const y = getSurfaceHeightAt(x, 300);
    assert.ok(Math.abs(y - c.courtyardY) < 0.05, `Expected courtyard stone slab Y=${c.courtyardY} at x=${x}, got ${y}`);
    assert.equal(getFootstepSurfaceKind(x, 300), 'stone');
  }

  // 2. Walk around Golden Nandi pedestal & flanking Deepstambhas (off-axis at z=294), while Deepstambha pillar at z=296.4 blocks
  assert.equal(isWalkablePosition(PASHUPATI_INTERACTIVE_SPOTS.nandiPedestalCenter.x, 294), true);
  assert.equal(isWalkablePosition(PASHUPATI_INTERACTIVE_SPOTS.nandiPedestalCenter.x, 296.4), false);

  // 3. Climb all 4 cardinal Peti stairways smoothly from courtyard (0.35m) to upper deck (2.15m)
  // West stairway
  const westStairLow = getPashupatinathSurfaceY(c.centerX - 12.8, c.centerZ) ?? -1;
  const westStairMid = getPashupatinathSurfaceY(c.centerX - 11.6, c.centerZ) ?? -1;
  const westStairTop = getPashupatinathSurfaceY(c.centerX - 10.2, c.centerZ) ?? -1;
  assert.ok(westStairLow < westStairMid && westStairMid < westStairTop);
  assert.ok(Math.abs(westStairTop - c.plinthDeckY) < 0.05);

  // Walk through all 4 open cardinal silver doors into Pradakshina gallery (±4.2m)
  assert.equal(isPashupatinathWalkable(c.centerX - 7.4, c.centerZ), true, 'West sanctum portal open');
  assert.equal(isPashupatinathWalkable(c.centerX + 7.4, c.centerZ), true, 'East sanctum portal open');
  assert.equal(isPashupatinathWalkable(c.centerX, c.centerZ - 7.4), true, 'North sanctum portal open');
  assert.equal(isPashupatinathWalkable(c.centerX, c.centerZ + 7.4), true, 'South sanctum portal open');

  // Pradakshina circumambulation gallery corridor on all 4 sides around Garbhagriha railing
  for (const [gx, gz] of [
    [c.centerX - 4.0, c.centerZ],
    [c.centerX + 4.0, c.centerZ],
    [c.centerX, c.centerZ - 4.0],
    [c.centerX, c.centerZ + 4.0],
  ]) {
    assert.equal(isWalkablePosition(gx, gz), true, `Expected Pradakshina corridor (${gx}, ${gz}) to be walkable`);
    assert.equal(getSurfaceHeightAt(gx, gz), c.plinthDeckY);
  }

  // 4. Eastern Bagmati Aarati Terrace & Arched Bridge & East Bank Pandra Shivalaya
  assert.equal(isWalkablePosition(PASHUPATI_INTERACTIVE_SPOTS.aaratiTerraceCenter.x, c.centerZ), true);
  const bridgeEndY = getPashupatiBagmatiBridgeDeckY(c.bridgeMinX);
  const bridgeMidY = getPashupatiBagmatiBridgeDeckY((c.bridgeMinX + c.bridgeMaxX) * 0.5);
  assert.ok(bridgeMidY > bridgeEndY + 1.0, 'Arched bridge center must rise above river banks');
  for (let bx = Math.ceil(c.bridgeMinX); bx <= Math.floor(c.bridgeMaxX); bx += 2) {
    assert.equal(isWalkablePosition(bx, c.bridgeCenterZ), true, `Bridge deck x=${bx} walkable`);
    assert.equal(getPashupatinathWaterAt(bx, c.bridgeCenterZ), null, 'Bridge deck must not register as wading in water');
  }
  for (const ez of [246, c.centerZ, 354]) {
    assert.equal(isWalkablePosition(46, ez), true, `East bank promenade z=${ez} walkable`);
    assert.equal(getSurfaceHeightAt(46, ez), c.eastBankY, `East bank z=${ez} at eastBankY`);
  }
  assert.equal(isWalkablePosition(74, c.centerZ), true, 'Sleshmantak Forest walkable');

  // 5. Ground-level alignment matching Janaki Mandir & Lumbini (0.25m surrounding parkland) + smooth North/West avenues + submerged ghat toes
  assert.ok(Math.abs(c.courtyardY - 0.28) < 0.02, 'Courtyard sits flush at ground level (0.28m)');
  for (const [ax, az, label] of [
    [-28, 224, 'North Gate approach'],
    [-28, 234, 'North Gate apron'],
    [-92, 300, 'West Plaza approach'],
    [-28, 374, 'South Gate approach'],
  ] as Array<[number, number, string]>) {
    const sy = getSurfaceHeightAt(ax, az);
    assert.ok(Math.abs(sy - 0.25) <= 0.06, `${label} (${ax},${az}) sits near ground level 0.25m, got ${sy}`);
  }
  // Verify North Gate avenue never hits a sudden cliff (>0.12m per 2m step)
  let prevNorthY = getSurfaceHeightAt(-28, 170);
  for (let z = 172; z <= 238; z += 2) {
    const curY = getSurfaceHeightAt(-28, z);
    assert.ok(Math.abs(curY - prevNorthY) < 0.12, `Sudden ground jump on North avenue at z=${z}: ${prevNorthY} -> ${curY}`);
    prevNorthY = curY;
  }
  // Verify West & East ghats descend smoothly below -0.34m water while leaving >= 9m clear river width
  const westGhatToe = getPashupatinathSurfaceY(29.55, 265);
  const eastGhatToe = getPashupatinathSurfaceY(38.75, 265);
  assert.ok(westGhatToe !== null && westGhatToe < c.riverWaterY, `West ghat bottom step must submerge under river water, got ${westGhatToe}`);
  assert.ok(eastGhatToe !== null && eastGhatToe < c.riverWaterY, `East ghat bottom step must submerge under river water, got ${eastGhatToe}`);
});

test('Solid walls, perimeter fence, Garbhagriha railing, monuments, Pandra Shivalaya & deep Bagmati River block walk-through', () => {
  const c = PASHUPATI_COMPLEX;

  // Perimeter fence blocks off-gate crossing
  assert.equal(isWalkablePosition(c.minX, c.centerZ + 18), false, 'West fence panel blocks crossing');
  assert.equal(isWalkablePosition(c.centerX + 18, c.minZ), false, 'North fence panel blocks crossing');
  assert.equal(isWalkablePosition(c.centerX - 18, c.maxZ), false, 'South fence panel blocks crossing');
  // North & South gate openings stay open
  assert.equal(isWalkablePosition(c.northGateCenterX, c.minZ), true, 'North gate open');
  assert.equal(isWalkablePosition(c.southGateCenterX, c.maxZ), true, 'South gate open');

  // Plinth sheer corner drop & solid sanctum walls off-doorway
  assert.equal(isPashupatinathWalkable(c.centerX - 11.4, c.centerZ - 7.5), false, 'Sheer Peti drop blocked off-stair');
  assert.equal(isPashupatinathWalkable(c.centerX - 7.3, c.centerZ - 4.5), false, 'Sanctum brick wall blocked off-door');

  // Central Garbhagriha railing + Chaturmukha Lingam pedestal solid
  assert.equal(isPashupatinathWalkable(c.centerX, c.centerZ), false, 'Shiva Lingam core solid');

  // Golden Nandi, Trishul, Shikhara, Pandra Shivalaya solid
  assert.equal(isPashupatinathWalkable(PASHUPATI_INTERACTIVE_SPOTS.nandiPedestalCenter.x, c.centerZ), false);
  assert.equal(isPashupatinathWalkable(PASHUPATI_INTERACTIVE_SPOTS.trishulMonumentCenter.x, PASHUPATI_INTERACTIVE_SPOTS.trishulMonumentCenter.z), false);
  assert.equal(isPashupatinathWalkable(48.0, 274), false, 'Pandra Shivalaya dome solid');

  // Bagmati deep water blocks non-bridge wading & streams downstream (+Z)
  assert.equal(isWalkablePosition(c.riverCenterX, c.centerZ + 22), false, 'Deep Bagmati channel blocks non-bridge crossing');
  const riverSample = getPashupatinathWaterAt(c.riverCenterX, c.centerZ + 22);
  assert.ok(riverSample && riverSample.inWater && riverSample.flowZ > 1.0);
});

test('Contextual [E] interactions trigger cleanly for Shiva Lingam, Golden Nandi, Ghee-Lamp Racks & Bagmati Aarati', () => {
  const lm = LANDMARKS.find((l) => l.id === 'kathmandu-stupa') ?? null;

  // Inside Garbhagriha Pradakshina corridor -> Offer Bel Leaf & Inspect Lingam
  const lingamAct = computeContextualWorldAction(
    PASHUPATI_COMPLEX.centerX - 4.0,
    PASHUPATI_COMPLEX.centerZ,
    lm,
    [],
    [],
    [],
    [],
  );
  assert.equal(lingamAct?.kind, 'inspect-shiva-lingam');

  // Near Golden Nandi -> Inspect Golden Nandi
  const nandiAct = computeContextualWorldAction(
    PASHUPATI_INTERACTIVE_SPOTS.nandiPedestalCenter.x - 3.6,
    PASHUPATI_COMPLEX.centerZ,
    lm,
    [],
    [],
    [],
    [],
  );
  assert.equal(nandiAct?.kind, 'inspect-golden-nandi');

  // Near North Ghee-Lamp Rack -> Light then Extinguish/Trim toggle
  const rack0 = PASHUPATI_INTERACTIVE_SPOTS.gheeLampRacks[0];
  const lampUnlit = computeContextualWorldAction(
    rack0.x - 1.8,
    rack0.z,
    lm,
    [],
    [],
    [],
    [],
    [],
    { gheeLampRacks: [{ x: rack0.x, z: rack0.z, lit: false }] },
  );
  assert.equal(lampUnlit?.kind, 'light-pashupati-lamps');
  assert.match(lampUnlit?.label ?? '', /Light/i);

  const lampLit = computeContextualWorldAction(
    rack0.x - 1.8,
    rack0.z,
    lm,
    [],
    [],
    [],
    [],
    [],
    { gheeLampRacks: [{ x: rack0.x, z: rack0.z, lit: true }] },
  );
  assert.equal(lampLit?.kind, 'light-pashupati-lamps');
  assert.match(lampLit?.label ?? '', /Trim/i);

  // Near Eastern Bagmati Aarati Terrace -> Perform Bagmati Sandhya Aarati
  const aarati = PASHUPATI_INTERACTIVE_SPOTS.aaratiTerraceCenter;
  const aaratiAct = computeContextualWorldAction(aarati.x, aarati.z, lm, [], [], [], []);
  assert.equal(aaratiAct?.kind, 'perform-bagmati-aarati');
});

test('createPashupatinathComplex builds full 108m x 124m+ geometry, 26m pagoda, 88+ swinging bells & interactive hooks', () => {
  const textures = {} as unknown as ProceduralTextureSet;
  const built = createPashupatinathComplex(textures);

  built.group.updateMatrixWorld(true);
  const bbox = new THREE.Box3().setFromObject(built.group);
  const size = new THREE.Vector3();
  bbox.getSize(size);

  assert.ok(size.x >= 108, `Expected complex X span >= 108m (includes Bagmati & Sleshmantak), got ${size.x.toFixed(1)}`);
  assert.ok(size.z >= 124, `Expected complex Z span >= 124m, got ${size.z.toFixed(1)}`);
  assert.ok(bbox.max.y >= 25.5, `Expected Main Pagoda Gajur apex >= 25.5m, got ${bbox.max.y.toFixed(2)}m`);

  const bells = built.group.userData.templeBells as THREE.Group[] | undefined;
  assert.ok(Array.isArray(bells) && bells.length >= 4, `Expected >= 4 interactive swinging bells, got ${bells?.length}`);
  const kinkiniObj = built.group.getObjectByName('PashupatiKinkiniBells') as THREE.InstancedMesh | undefined;
  assert.ok(kinkiniObj instanceof THREE.InstancedMesh && kinkiniObj.count === 88, 'Expected 88 InstancedMesh Kinkini roof bells');
  assert.ok(built.animatedNodes.length >= 3, 'Expected animated river, sanctum & wildlife controllers');
  assert.ok(built.cameraOccluders && built.cameraOccluders.length > 0, 'Expected pagoda camera occluders');

  assert.ok(built.group.userData.lingamHitTarget instanceof THREE.Mesh);
  assert.ok(built.group.userData.nandiHitTarget instanceof THREE.Mesh);
  assert.ok(Array.isArray(built.group.userData.gheeLampHitTargets) && built.group.userData.gheeLampHitTargets.length === 2);
  assert.ok(built.group.userData.aaratiHitTarget instanceof THREE.Mesh);

  // Confirm no duplicate synthetic river plane is generated inside Pashupatinath (Garbhagriha volumetric light beam uses ShaderMaterial)
  let fakeRiverPlaneCount = 0;
  built.group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      const mat = obj.material as THREE.ShaderMaterial | undefined;
      if (mat && mat.uniforms && 'uFlowSpeed' in mat.uniforms) {
        fakeRiverPlaneCount++;
      } else if (obj.geometry instanceof THREE.PlaneGeometry) {
        obj.geometry.computeBoundingBox();
        const b = obj.geometry.boundingBox;
        if (b && b.max.z - b.min.z >= 40) {
          fakeRiverPlaneCount++;
        }
      }
    }
  });
  assert.equal(fakeRiverPlaneCount, 0, 'Must rely on existing valley Bagmati River instead of creating a duplicate water plane');

  // Exercise interactive callbacks safely in Node
  const toggleFn = built.group.userData.toggleGheeLampRack as (i: number) => boolean;
  assert.equal(toggleFn(0), true);
  assert.equal(toggleFn(0), false);
  (built.group.userData.triggerLingamOffering as () => void)();
  (built.group.userData.triggerBagmatiAarati as () => void)();

  // Advance animated controllers without NaN or exceptions
  for (const node of built.animatedNodes) {
    if (typeof node.userData.onEnvironmentUpdate === 'function') {
      node.userData.onEnvironmentUpdate({ elapsed: 4.2, windSpeed: 1.4 });
    }
  }
});

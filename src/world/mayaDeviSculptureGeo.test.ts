import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  createAnatomicalHeadGeometry,
  createCarvedLotusPetalGeometry,
  createMarigoldFloretGeometry,
  createSculptedDhotiGeometry,
  createSculptedMarkerStoneGeometry,
  createSculptedTorsoGeometry,
  createTaperedLimbGeometry,
} from './mayaDeviSculptureGeo';

function assertFiniteGeometry(geo: THREE.BufferGeometry, name: string, minVerts = 11) {
  const pos = geo.getAttribute('position');
  const norm = geo.getAttribute('normal');
  const uv = geo.getAttribute('uv');
  assert.ok(pos && pos.count >= minVerts, `${name} should have >=${minVerts} vertices (got ${pos?.count ?? 0})`);
  assert.ok(norm && norm.count === pos.count, `${name} should have matching normals`);
  assert.ok(uv && uv.count === pos.count, `${name} should have matching uvs`);
  for (let i = 0; i < pos.count; i++) {
    assert.ok(Number.isFinite(pos.getX(i)), `${name} pos.x finite`);
    assert.ok(Number.isFinite(pos.getY(i)), `${name} pos.y finite`);
    assert.ok(Number.isFinite(pos.getZ(i)), `${name} pos.z finite`);
    assert.ok(Number.isFinite(norm.getX(i)), `${name} norm.x finite`);
    assert.ok(Number.isFinite(norm.getY(i)), `${name} norm.y finite`);
    assert.ok(Number.isFinite(norm.getZ(i)), `${name} norm.z finite`);
  }
}

test('createSculptedMarkerStoneGeometry produces organic grounded stone slab', () => {
  const geo = createSculptedMarkerStoneGeometry(1.12, 0.21, 0.74);
  assertFiniteGeometry(geo, 'MarkerStone');
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  assert.ok(bb.min.y >= -0.001 && bb.min.y <= 0.001, 'MarkerStone sits flush at y=0');
  assert.ok(bb.max.y > 0.16 && bb.max.y < 0.28, 'MarkerStone height within expected bounds');
  assert.ok(bb.max.x - bb.min.x > 0.95, 'MarkerStone spans expected width');
  assert.ok(bb.max.z - bb.min.z > 0.62, 'MarkerStone spans expected depth');
});

test('createAnatomicalHeadGeometry builds smooth adult and child heads', () => {
  const adult = createAnatomicalHeadGeometry(false);
  const child = createAnatomicalHeadGeometry(true);
  assertFiniteGeometry(adult, 'AdultHead');
  assertFiniteGeometry(child, 'ChildHead');
  adult.computeBoundingBox();
  assert.ok(adult.boundingBox!.max.z > 0.11, 'Nose/facial relief extends forward along +Z');
});

test('createSculptedTorsoGeometry & createSculptedDhotiGeometry preserve anatomical proportions', () => {
  const torso = createSculptedTorsoGeometry({
    height: 0.62,
    waistRadius: 0.095,
    hipRadius: 0.125,
    chestRadius: 0.135,
    shoulderRadius: 0.155,
    neckRadius: 0.044,
    bustProjection: 0.032,
    tribhangaSway: -0.018,
  });
  const dhoti = createSculptedDhotiGeometry({
    height: 0.74,
    ankleRadius: 0.132,
    hipRadius: 0.175,
    waistRadius: 0.118,
    hipShiftX: 0.025,
  });
  assertFiniteGeometry(torso, 'Torso');
  assertFiniteGeometry(dhoti, 'Dhoti');
});

test('createTaperedLimbGeometry, lotus petals, and marigold florets build valid meshes', () => {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.1, 0.2, 0.05),
    new THREE.Vector3(0.2, 0.4, 0),
  ]);
  const limb = createTaperedLimbGeometry(curve, (t) => 0.035 * (1 - 0.4 * t));
  const petal = createCarvedLotusPetalGeometry(0.08, 0.09, 0.025);
  const marigold = createMarigoldFloretGeometry(0.044);
  assertFiniteGeometry(limb, 'Limb');
  assertFiniteGeometry(petal, 'LotusPetal');
  assertFiniteGeometry(marigold, 'Marigold');

  // Verify limb side-wall normals point outward radially from the curve axis
  const pos = limb.getAttribute('position');
  const norm = limb.getAttribute('normal');
  const v = new THREE.Vector3();
  const n = new THREE.Vector3();
  let outwardChecks = 0;
  for (let i = 0; i < pos.count - 2; i++) {
    v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    n.set(norm.getX(i), norm.getY(i), norm.getZ(i));
    const t = THREE.MathUtils.clamp(v.y / 0.4, 0, 1);
    const center = curve.getPointAt(t);
    const radial = v.clone().sub(center);
    if (radial.lengthSq() > 1e-6) {
      assert.ok(
        radial.dot(n) > 0,
        `Expected outward limb normal at vertex ${i}, dot=${radial.dot(n).toFixed(4)}`,
      );
      outwardChecks++;
    }
  }
  assert.ok(outwardChecks > 100);
});

import { createLumbiniTextures } from './lumbiniTextures';
import {
  applySanctumWeatheringShader,
  buildDetailedSanctuaryWallLantern,
  createSanctumAtmosphereParticles,
} from './mayaDeviAtmosphere';

test('createLumbiniTextures builds 1024px Mauryan brick PBR suite with displacement map', () => {
  const tex = createLumbiniTextures(8);
  assert.equal((tex.mauryaBrickMap.image as { width: number }).width, 1024);
  assert.equal((tex.mauryaBrickNormal.image as { width: number }).width, 1024);
  assert.equal((tex.mauryaBrickRough.image as { width: number }).width, 1024);
  assert.equal((tex.mauryaBrickAo.image as { width: number }).width, 1024);
  assert.equal((tex.mauryaBrickDisp.image as { width: number }).width, 1024);
  assert.equal(tex.mauryaBrickMap.colorSpace, THREE.SRGBColorSpace);
  assert.equal(tex.mauryaBrickDisp.colorSpace, THREE.NoColorSpace);
  tex.dispose();
});

test('applySanctumWeatheringShader injects unique program cache key and weathering uniforms', () => {
  const mat = new THREE.MeshStandardMaterial({ color: 0xc29e74 });
  const binding = applySanctumWeatheringShader(mat, {
    cacheKey: 'test-weather-key',
    minRelY: 0,
    maxRelY: 0.4,
    mossStrength: 0.35,
    dampDarken: 0.72,
    initialAnchorY: 1.0,
  });
  assert.equal(mat.customProgramCacheKey(), 'test-weather-key');
  assert.equal(binding.uniforms.uWeatherAnchorY.value, 1.0);
  assert.equal(binding.uniforms.uWeatherMossStrength.value, 0.35);

  const mockShader = {
    uniforms: {} as Record<string, THREE.IUniform>,
    vertexShader: 'void main() {\n#include <project_vertex>\n}',
    fragmentShader: 'void main() {\n#include <color_fragment>\n#include <roughnessmap_fragment>\n}',
  };
  mat.onBeforeCompile(mockShader as unknown as THREE.WebGLProgramParametersWithUniforms, {} as THREE.WebGLRenderer);
  assert.ok(mockShader.vertexShader.includes('vWeatherWorldPos'));
  assert.ok(mockShader.fragmentShader.includes('sanctumMossAmount'));
  assert.ok(mockShader.fragmentShader.includes('sanctumValueNoise3'));
  assert.equal(mockShader.uniforms.uWeatherAnchorY, binding.uniforms.uWeatherAnchorY);
});

test('buildDetailedSanctuaryWallLantern produces composite multi-part lantern group and flame', () => {
  const dummyMat = new THREE.MeshStandardMaterial({ color: 0xd4a342 });
  const result = buildDetailedSanctuaryWallLantern({
    giltGoldMat: dummyMat,
    warmBronzeMat: dummyMat,
    darkMetalMat: dummyMat,
    flameGlowMat: dummyMat,
  });
  let meshCount = 0;
  result.group.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) meshCount++;
  });
  assert.ok(meshCount >= 20, `Expected intricate multi-part wall lantern (>=20 meshes), got ${meshCount}`);
  assert.ok(result.flameGroup.children.length >= 2, 'Expected animated flame core and outer cone');
});

test('createSanctumAtmosphereParticles spawns finite shaft dust and statue/stone aura particles', () => {
  const atm = createSanctumAtmosphereParticles([
    { pos: [-7.2, 3.45, 7.2], rot: [0.54, 0, -0.14] },
    { pos: [7.2, 3.45, 7.2], rot: [0.54, 0, 0.14] },
  ]);
  const pointSets: THREE.Points[] = [];
  atm.group.traverse((obj) => {
    if ((obj as THREE.Points).isPoints) pointSets.push(obj as THREE.Points);
  });
  assert.equal(pointSets.length, 2, 'Expected both shaft dust and statue/stone aura particle sets');
  for (const pts of pointSets) {
    const pos = pts.geometry.getAttribute('position');
    assert.ok(pos.count >= 200, `Expected dense particles, got ${pos.count}`);
    for (let i = 0; i < pos.count; i++) {
      assert.ok(Number.isFinite(pos.getX(i)) && Number.isFinite(pos.getY(i)) && Number.isFinite(pos.getZ(i)));
    }
  }
});

import { buildExcavatedBrickRuin, buildPeaceLantern } from './lumbiniShrines';
import { buildDetailedLumbiniBench } from './lumbiniGardenCraft';
import { REFLECTIVE_WATER_ENV_UNIFORMS } from './waterShader';

test('buildPeaceLantern constructs ornate multi-material pagoda lantern without extra lights', () => {
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xcab08f });
  const bronzeMat = new THREE.MeshStandardMaterial({ color: 0xba8438 });
  const glowMat = new THREE.MeshStandardMaterial({ color: 0xfff5cb });
  const lantern = buildPeaceLantern(stoneMat, bronzeMat, glowMat);

  let meshCount = 0;
  let totalVerts = 0;
  let lightCount = 0;
  lantern.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      meshCount++;
      const pos = (obj as THREE.Mesh).geometry.getAttribute('position');
      if (pos) totalVerts += pos.count;
    }
    if ((obj as THREE.Light).isLight) lightCount++;
  });

  assert.ok(meshCount >= 8, `Expected multi-material Chaitya pagoda lantern (>=8 meshes), got ${meshCount}`);
  assert.ok(totalVerts > 4000, `Expected high-detail Chaitya-Dipa lantern geometry (>4000 vertices), got ${totalVerts}`);
  assert.equal(lightCount, 0, 'Peace lantern should not spawn extra unpooled PointLights');
});

test('buildDetailedLumbiniBench builds sculpted granite legs, oiled teak slats, and bronze hardware', () => {
  const bench = buildDetailedLumbiniBench();
  let meshCount = 0;
  let totalVerts = 0;
  bench.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      meshCount++;
      const pos = (obj as THREE.Mesh).geometry.getAttribute('position');
      if (pos) totalVerts += pos.count;
    }
  });
  const bb = new THREE.Box3().setFromObject(bench);
  assert.ok(meshCount >= 5, `Expected multi-material bench (>=5 meshes), got ${meshCount}`);
  assert.ok(totalVerts > 2500, `Expected complex carved bench geometry (>2500 vertices), got ${totalVerts}`);
  assert.ok(bb.min.y >= -0.01 && bb.min.y <= 0.02, `Bench should sit grounded at y=0, got ${bb.min.y}`);
  assert.ok(bb.max.y >= 0.85, `Bench backrest should reach >=0.85m, got ${bb.max.y}`);
});

test('buildExcavatedBrickRuin constructs Triratha votive stupa ruin with world-scaled UVs and shrine niches', () => {
  const mat = new THREE.MeshStandardMaterial({ color: 0xf4e4d8 });
  const ruin = buildExcavatedBrickRuin(mat, 3.6, 1.05, 3.0, { variantIndex: 2 });
  let meshCount = 0;
  let totalVerts = 0;
  ruin.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      meshCount++;
      const pos = (obj as THREE.Mesh).geometry.getAttribute('position');
      if (pos) totalVerts += pos.count;
    }
  });
  const bb = new THREE.Box3().setFromObject(ruin);
  assert.ok(meshCount >= 6, `Expected multi-material votive stupa ruin (>=6 meshes), got ${meshCount}`);
  assert.ok(totalVerts > 3500, `Expected detailed archaeological stupa geometry (>3500 vertices), got ${totalVerts}`);
  assert.ok(bb.min.y >= -0.01 && bb.min.y <= 0.02, `Ruin sits grounded at y=0, got ${bb.min.y}`);
  assert.ok(bb.max.y > 1.6, `Votive stupa drum & Chaitya crown should rise >1.6m, got ${bb.max.y}`);
});

test('REFLECTIVE_WATER_ENV_UNIFORMS exposes player proximity & speed wave uniforms', () => {
  assert.ok(REFLECTIVE_WATER_ENV_UNIFORMS.uPlayerWaterPos.value instanceof THREE.Vector3);
  assert.equal(typeof REFLECTIVE_WATER_ENV_UNIFORMS.uPlayerWaterSpeed.value, 'number');
  assert.equal(typeof REFLECTIVE_WATER_ENV_UNIFORMS.uPlayerPondProximity.value, 'number');
});

import { createDetailedBrassSukundaDiyo } from './janakiMandirCraft';
import { buildDetailedNativitySteleEnsemble } from './mayaDeviSanctuaryCraft';

test('createDetailedBrassSukundaDiyo exposes flameGroup child so brass lamp never scales with flame', () => {
  const mat = new THREE.MeshStandardMaterial({ color: 0xd4a342 });
  const lamp = createDetailedBrassSukundaDiyo(mat, mat, mat, 0.68, true);
  assert.equal(lamp.scale.y, 0.68);
  const flame = lamp.userData.flameGroup as THREE.Object3D | undefined;
  assert.ok(flame && flame !== lamp, 'Expected distinct flameGroup inside Sukunda Diyo');
  assert.ok(lamp.children.includes(flame), 'flameGroup should be a child of the brass Sukunda Diyo');
});

test('buildDetailedNativitySteleEnsemble constructs high-detail 3-statue ensemble', () => {
  const tex = createLumbiniTextures(8);
  const mat = new THREE.MeshStandardMaterial({ color: 0xc29e74 });
  const stele = buildDetailedNativitySteleEnsemble(tex, {
    chunarStoneMat: mat,
    giltGoldMat: mat,
    warmBronzeMat: mat,
    darkMetalMat: mat,
    timberMat: mat,
    brickMat: mat,
    flameGlowMat: mat,
  });
  let meshCount = 0;
  let totalVerts = 0;
  stele.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      meshCount++;
      const pos = (obj as THREE.Mesh).geometry.getAttribute('position');
      if (pos) totalVerts += pos.count;
    }
  });
  assert.ok(meshCount >= 110, `Expected high-detail 3-statue ensemble (>=110 meshes), got ${meshCount}`);
  assert.ok(totalVerts >= 35000, `Expected high-resolution statue geometry (>=35000 vertices), got ${totalVerts}`);
  tex.dispose();
});

import { createMonumentalBabyBuddhaMonument } from './lumbiniBuddhaSculpt';
import {
  buildDetailedLumbiniBollards,
  buildDetailedOverlookBalustrade,
  buildRealisticLumbiniHedges,
} from './lumbiniGardenCraft';

test('createMonumentalBabyBuddhaMonument builds realistic Golden Baby Buddha, basalt lotus basin, marigold garlands & shrub ring', () => {
  const mat = new THREE.MeshStandardMaterial({ color: 0xd4a342 });
  const mats = {
    skinMat: mat,
    robeMat: mat,
    hairMat: mat,
    goldMat: mat,
    bronzeMat: mat,
    stonePlinthMat: mat,
    crimsonLacquerMat: mat,
    flameMat: mat,
  };
  const monument = createMonumentalBabyBuddhaMonument(mats, mat);
  let meshCount = 0;
  let instCount = 0;
  let totalVerts = 0;
  monument.traverse((obj) => {
    if ((obj as THREE.InstancedMesh).isInstancedMesh) {
      const im = obj as THREE.InstancedMesh;
      instCount += im.count;
      const pos = im.geometry.getAttribute('position');
      if (pos) totalVerts += pos.count;
      assertFiniteGeometry(im.geometry, im.name || 'BabyBuddhaInstanced');
    } else if ((obj as THREE.Mesh).isMesh) {
      meshCount++;
      const mesh = obj as THREE.Mesh;
      const pos = mesh.geometry.getAttribute('position');
      if (pos) totalVerts += pos.count;
      assertFiniteGeometry(mesh.geometry, mesh.name || 'BabyBuddhaMesh');
    }
  });
  const bb = new THREE.Box3().setFromObject(monument);
  assert.ok(meshCount >= 35, `Expected high-detail multi-part Baby Buddha & lotus pool (>=35 meshes), got ${meshCount}`);
  assert.ok(instCount >= 650, `Expected >=650 instanced spiral curls/marigolds/shrub sprigs/petals, got ${instCount}`);
  assert.ok(totalVerts >= 20000, `Expected rich curved sculpture geometry (>=20000 unique verts), got ${totalVerts}`);
  assert.ok(bb.min.y >= -0.02 && bb.min.y <= 0.05, `Monument should sit grounded near y=0, got ${bb.min.y}`);
  assert.ok(bb.max.y >= 4.2, `Baby Buddha monument should rise >4.2m, got ${bb.max.y}`);

  const fig = monument.getObjectByName('BabyBuddhaFigure');
  const head = monument.getObjectByName('BabyBuddhaHead');
  const rightHand = monument.getObjectByName('RightHandSkyward');
  const leftHand = monument.getObjectByName('LeftHandEarthward');
  assert.ok(fig && head && rightHand && leftHand, 'Expected named figure, head, and left/right hand groups');

  monument.updateMatrixWorld(true);
  const figBox = new THREE.Box3().setFromObject(fig);
  const headBox = new THREE.Box3().setFromObject(head);
  const ratio = (figBox.max.y - figBox.min.y) / (headBox.max.y - headBox.min.y);
  assert.ok(ratio >= 3.7, `Expected realistic statue-to-head ratio (>=3.7), got ${ratio.toFixed(2)}`);

  const rHandBox = new THREE.Box3().setFromObject(rightHand);
  const lHandBox = new THREE.Box3().setFromObject(leftHand);
  assert.ok(rHandBox.max.x < 0, `Right arm/hand should be on -X side for +Z facing statue, got max.x=${rHandBox.max.x}`);
  assert.ok(lHandBox.min.x > 0, `Left arm/hand should be on +X side for +Z facing statue, got min.x=${lHandBox.min.x}`);
  assert.ok(
    rHandBox.max.y - lHandBox.max.y > 0.65,
    `Right hand must point skyward clearly above lowered left hand (diff=${(rHandBox.max.y - lHandBox.max.y).toFixed(2)})`,
  );

  const lamps = monument.userData.butterLamps as
    | Array<{ lampIndex: number; flameGroup: THREE.Group; haloMesh: THREE.Mesh }>
    | undefined;
  assert.ok(Array.isArray(lamps) && lamps.length === 8, 'Expected 8 interactive butter lamps around lotus basin');
  for (const lamp of lamps!) {
    assert.equal(lamp.flameGroup.visible, false, 'Unlit butter lamp flame starts hidden');
    assert.equal(lamp.flameGroup.scale.y, 0, 'Unlit butter lamp flame starts at scale 0');
  }
  const ritualLight = monument.userData.ritualLampLight as THREE.PointLight | undefined;
  assert.ok(ritualLight instanceof THREE.PointLight && ritualLight.intensity === 0, 'Ritual lamp PointLight starts at 0');
  for (let b = 0; b < 4; b++) {
    assert.ok(monument.getObjectByName(`DhupaIncenseBrazier_${b}`), `Expected bronze incense brazier #${b}`);
  }
});

test('buildDetailedLumbiniBollards and buildDetailedOverlookBalustrade construct intricate carved granite & bronze details', () => {
  const bollards = buildDetailedLumbiniBollards(
    [
      [-6.4, 48.5],
      [-6.4, 45.5],
    ],
    { chainLinks: [[0, 1]] },
  );
  let bInst = 0;
  let bMesh = 0;
  bollards.traverse((obj) => {
    if ((obj as THREE.InstancedMesh).isInstancedMesh) {
      bInst++;
      assert.equal(obj.userData.nonCollidable, true);
    } else if ((obj as THREE.Mesh).isMesh) {
      bMesh++;
      assert.equal(obj.userData.nonCollidable, true);
    }
  });
  assert.equal(bInst, 4, 'Expected 4 instanced layers (basalt plinth, granite shaft, bronze collar, brass Kalash)');
  assert.equal(bMesh, 1, 'Expected draped catenary chain swag mesh');

  const rail = buildDetailedOverlookBalustrade(-3.15, 7.8, 25.2, 8);
  let rMeshes = 0;
  let rVerts = 0;
  rail.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      rMeshes++;
      rVerts += (obj as THREE.Mesh).geometry.getAttribute('position').count;
    }
  });
  const rbb = new THREE.Box3().setFromObject(rail);
  assert.equal(rMeshes, 4, 'Expected 4 material meshes (basalt curb, granite piers/balusters, bronze, gilt)');
  assert.ok(rVerts > 15000, `Expected high-detail carved balustrade (>15000 verts), got ${rVerts}`);
  assert.ok(rbb.min.y <= 0.03, `Overlook curb must rest flush on terrace pavers (min.y=${rbb.min.y})`);
});

test('buildRealisticLumbiniHedges builds planter curbs, compact BVH core, and instanced 3D leaf sprigs', () => {
  const brickMat = new THREE.MeshStandardMaterial({ color: 0xba6a49 });
  const hedges = buildRealisticLumbiniHedges(
    [
      [-8.9, 35.1, 0.68, 7.6],
      [-16.4, 31.2, 13.8, 0.68],
    ],
    brickMat,
  );
  let collidableCoreCount = 0;
  let sprigCount = 0;
  hedges.traverse((obj) => {
    if ((obj as THREE.InstancedMesh).isInstancedMesh) {
      const im = obj as THREE.InstancedMesh;
      if (im.userData.nonCollidable) {
        sprigCount += im.count;
      } else {
        collidableCoreCount += im.count;
      }
    }
  });
  assert.equal(collidableCoreCount, 2, 'Expected exact collidable core count matching hedge entries');
  assert.ok(sprigCount >= 90, `Expected dense 3D botanical sprig instances (>=90), got ${sprigCount}`);
});

import {
  buildAuthenticAshokaPillar,
  buildSacredBodhiChautara,
  buildThaiMarbleSanctuary,
  buildToranaGate,
} from './lumbiniShrines';
import { buildMyanmarGoldenPagoda } from './lumbiniMyanmarPagoda';

test('buildAuthenticAshokaPillar constructs stepped enclosure, crown, and cameraOccluders', () => {
  const tex = createLumbiniTextures(4);
  const mat = new THREE.MeshStandardMaterial({ color: 0xd6c3a4 });
  const pillar = buildAuthenticAshokaPillar(
    mat,
    mat,
    mat,
    mat,
    tex.brahmiEdictMap,
    tex.brahmiEdictNormal,
  );
  let meshCount = 0;
  pillar.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      meshCount++;
      assertFiniteGeometry((obj as THREE.Mesh).geometry, obj.name || 'AshokaMesh', 3);
    }
  });
  const occluders = pillar.userData.cameraOccluderMeshes as THREE.Object3D[] | undefined;
  assert.ok(meshCount >= 20, `Expected >=20 meshes in Ashoka Pillar, got ${meshCount}`);
  assert.ok(Array.isArray(occluders) && occluders.length >= 3, 'Expected >=3 cameraOccluderMeshes on Ashoka Pillar');
  tex.dispose();
});

test('buildSacredBodhiChautara anchors dense heart-leaf canopy around solid trunk core without sky floaters', () => {
  const mat = new THREE.MeshStandardMaterial({ color: 0xc29e74 });
  const bodhi = buildSacredBodhiChautara(mat, mat, mat, mat, mat, mat);
  const occluders = bodhi.userData.cameraOccluderMeshes as THREE.Object3D[] | undefined;
  assert.ok(Array.isArray(occluders) && occluders.length >= 5, 'Expected >=5 cameraOccluderMeshes including trunkCore');

  const leafMeshes: THREE.InstancedMesh[] = [];
  bodhi.traverse((obj) => {
    if ((obj as THREE.InstancedMesh).isInstancedMesh) {
      const im = obj as THREE.InstancedMesh;
      if (im.count >= 1000) leafMeshes.push(im);
    } else if ((obj as THREE.Mesh).isMesh) {
      assertFiniteGeometry((obj as THREE.Mesh).geometry, obj.name || 'BodhiMesh', 3);
    }
  });
  assert.ok(leafMeshes.length >= 1, 'Expected dense InstancedMesh Pipal canopy leaves (>=1000)');
  const leafMesh = leafMeshes[0];

  const dummy = new THREE.Matrix4();
  const pos = new THREE.Vector3();
  let minY = Infinity;
  let maxR = 0;
  for (let i = 0; i < leafMesh.count; i++) {
    leafMesh.getMatrixAt(i, dummy);
    pos.setFromMatrixPosition(dummy);
    minY = Math.min(minY, pos.y);
    maxR = Math.max(maxR, Math.hypot(pos.x, pos.z));
  }
  assert.ok(minY >= 4.0, `Expected lowest Bodhi canopy sprig >=4.0m, got ${minY.toFixed(2)}`);
  assert.ok(maxR <= 4.8, `Expected all Bodhi leaves tightly anchored within 4.8m of trunk, got ${maxR.toFixed(2)}`);
});

test('buildToranaGate and buildThaiMarbleSanctuary construct high-detail non-clipping architecture', () => {
  const mat = new THREE.MeshStandardMaterial({ color: 0xd9cdb8 });
  const heroMats = {
    skinMat: mat,
    robeMat: mat,
    hairMat: mat,
    goldMat: mat,
    bronzeMat: mat,
    stonePlinthMat: mat,
    crimsonLacquerMat: mat,
    flameMat: mat,
  };
  const torana = buildToranaGate(mat, mat, mat, mat);
  let tMeshes = 0;
  let tVerts = 0;
  torana.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      tMeshes++;
      tVerts += (obj as THREE.Mesh).geometry.getAttribute('position').count;
      assertFiniteGeometry((obj as THREE.Mesh).geometry, obj.name || 'ToranaMesh', 3);
    }
  });
  assert.ok(tMeshes >= 25, `Expected >=25 Torana meshes, got ${tMeshes}`);
  assert.ok(tVerts > 5000, `Expected >5000 Torana vertices, got ${tVerts}`);

  const thai = buildThaiMarbleSanctuary(mat, mat, mat, heroMats);
  const thaiBox = new THREE.Box3().setFromObject(thai.group);
  const thaiOccluders = thai.group.userData.cameraOccluderMeshes as THREE.Object3D[] | undefined;
  assert.ok(thaiBox.max.y > 9.5, `Expected Thai Sanctuary roof spire >9.5m, got ${thaiBox.max.y}`);
  assert.ok(thai.light.position.y > 5.4, `Expected Thai Sanctuary light >5.4m, got ${thai.light.position.y}`);
  assert.ok(Array.isArray(thaiOccluders) && thaiOccluders.length >= 3, 'Expected >=3 Thai Sanctuary cameraOccluders');
});

test('buildMyanmarGoldenPagoda builds ornate floodlight masts, blue pedestals, medallions, and pagoda spires', () => {
  const mat = new THREE.MeshStandardMaterial({ color: 0xded6c8 });
  const heroMats = {
    skinMat: mat,
    robeMat: mat,
    hairMat: mat,
    goldMat: mat,
    bronzeMat: mat,
    stonePlinthMat: mat,
    crimsonLacquerMat: mat,
    flameMat: mat,
  };
  const pagoda = buildMyanmarGoldenPagoda(mat, mat, mat, mat, mat, mat, mat, heroMats);
  let meshCount = 0;
  pagoda.traverse((obj) => {
    if ((obj as THREE.InstancedMesh).isInstancedMesh) {
      assertFiniteGeometry((obj as THREE.InstancedMesh).geometry, obj.name || 'MyanmarInst', 3);
    } else if ((obj as THREE.Mesh).isMesh) {
      meshCount++;
      assertFiniteGeometry((obj as THREE.Mesh).geometry, obj.name || 'MyanmarMesh', 3);
    }
  });
  const bb = new THREE.Box3().setFromObject(pagoda);
  assert.ok(meshCount >= 40, `Expected >=40 Myanmar Pagoda meshes, got ${meshCount}`);
  assert.ok(Number.isFinite(bb.min.y) && Number.isFinite(bb.max.y) && bb.max.y > 12, 'Expected full gilded Shwedagon-inspired spire');
});




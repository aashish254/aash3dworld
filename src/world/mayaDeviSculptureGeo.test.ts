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

function assertFiniteGeometry(geo: THREE.BufferGeometry, name: string) {
  const pos = geo.getAttribute('position');
  const norm = geo.getAttribute('normal');
  const uv = geo.getAttribute('uv');
  assert.ok(pos && pos.count > 10, `${name} should have >10 vertices`);
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
    } else if ((obj as THREE.Mesh).isMesh) {
      meshCount++;
      const pos = (obj as THREE.Mesh).geometry.getAttribute('position');
      if (pos) totalVerts += pos.count;
    }
  });
  const bb = new THREE.Box3().setFromObject(monument);
  assert.ok(meshCount >= 40, `Expected high-detail multi-part Baby Buddha & lotus pool (>=40 meshes), got ${meshCount}`);
  assert.ok(instCount >= 550, `Expected >=550 instanced curls/marigolds/shrub sprigs/petals, got ${instCount}`);
  assert.ok(totalVerts >= 15000, `Expected rich curved sculpture geometry (>=15000 unique verts), got ${totalVerts}`);
  assert.ok(bb.min.y >= -0.02 && bb.min.y <= 0.05, `Monument should sit grounded near y=0, got ${bb.min.y}`);
  assert.ok(bb.max.y >= 4.2, `Baby Buddha monument should rise >4.2m, got ${bb.max.y}`);
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



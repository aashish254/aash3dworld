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

import { buildPeaceLantern } from './lumbiniShrines';
import { REFLECTIVE_WATER_ENV_UNIFORMS } from './waterShader';

test('buildPeaceLantern constructs ornate multi-part pagoda lantern without extra lights', () => {
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

  assert.ok(meshCount >= 5, `Expected multi-part pagoda lantern (stone, bronze, amber glass, chimney, flame), got ${meshCount}`);
  assert.ok(totalVerts > 1200, `Expected high-detail Chaitya-Dipa lantern geometry (>1200 vertices), got ${totalVerts}`);
  assert.equal(lightCount, 0, 'Peace lantern should not spawn extra unpooled PointLights');
});

test('REFLECTIVE_WATER_ENV_UNIFORMS exposes player proximity & speed wave uniforms', () => {
  assert.ok(REFLECTIVE_WATER_ENV_UNIFORMS.uPlayerWaterPos.value instanceof THREE.Vector3);
  assert.equal(typeof REFLECTIVE_WATER_ENV_UNIFORMS.uPlayerWaterSpeed.value, 'number');
  assert.equal(typeof REFLECTIVE_WATER_ENV_UNIFORMS.uPlayerPondProximity.value, 'number');
});


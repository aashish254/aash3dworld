import * as THREE from 'three';
import { ProceduralTextureSet } from './proceduralTextures';
import { applyHimalayanTerrainShader } from './himalayaAmphitheater';
import { createWavingPrayerFlagGarland, createWavingPoleBanner } from './prayerFlags';
import { getCachedMaterial, getCachedTexture } from './meshOptimization';
import { WeatherKind } from './worldLogic';
import {
  SAGARMATHA_PEAK_CENTER,
  TREK_BRIDGE_SPANS,
  TREK_KEY_SPOTS,
  TREK_PLATEAUS,
  TREK_SAMPLES,
  computeSagarmathaPeakVisualHeight,
} from './himalayaTrekData';

export interface SagarmathaTrekController {
  group: THREE.Group;
  hitMesh: THREE.Mesh;
  summitHitMesh: THREE.Mesh;
  mountainOccludeMesh: THREE.Mesh;
  beaconLights: THREE.PointLight[];
  prayerFlags: THREE.Mesh[];
  hoistSummitFlag: () => void;
  isSummitFlagHoisted: () => boolean;
  triggerButterTeaWarmth: () => void;
  update: (
    elapsed: number,
    dt: number,
    playerPos: THREE.Vector3,
    weather: WeatherKind,
    onBridgeSwayAudio?: () => void,
  ) => void;
}

const _m4 = new THREE.Matrix4();
const _v3 = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _e = new THREE.Euler();
const _c = new THREE.Color();

function paintTrailMapTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 384;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 0, 384);
  grad.addColorStop(0, '#0f2338');
  grad.addColorStop(0.55, '#19324b');
  grad.addColorStop(1, '#203b31');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 384);

  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, 492, 364);

  // Stylized Himalayan peak silhouette in background
  ctx.fillStyle = 'rgba(226, 236, 248, 0.16)';
  ctx.beginPath();
  ctx.moveTo(40, 290);
  ctx.lineTo(150, 130);
  ctx.lineTo(256, 72);
  ctx.lineTo(368, 125);
  ctx.lineTo(472, 290);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SAGARMATHA TREK PEAK · 216M', 256, 46);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('7-Zone Alpine Switchback Route (~1,120m Trail)', 256, 70);

  // Switchback schematic trail line
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 4;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  const routePts: Array<[number, number]> = [
    [130, 336],
    [220, 314],
    [338, 282],
    [352, 240],
    [186, 222],
    [152, 192],
    [286, 166],
    [274, 136],
    [216, 114],
    [256, 94],
  ];
  routePts.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
  ctx.stroke();
  ctx.setLineDash([]);

  const labels: Array<[number, number, string]> = [
    [118, 352, 'Z1 Trailhead 0m'],
    [360, 296, 'Z2 Waterfall 48m'],
    [146, 234, 'Z3 Hillary Bridges'],
    [148, 182, 'Z4 Iron Chains'],
    [340, 168, 'Z5 Sherpa Teahouse 142m'],
    [318, 132, 'Z6 High Camp 176m'],
    [256, 86, 'Z7 Summit Spire 216m'],
  ];
  ctx.font = 'bold 12px system-ui, sans-serif';
  for (const [lx, ly, txt] of labels) {
    ctx.fillStyle = '#fef3c7';
    ctx.fillText(txt, lx, ly);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function paintSignboardTexture(title: string, subtitle: string, bg: string, fg: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 160;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 160);
  ctx.strokeStyle = fg;
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, 496, 144);
  ctx.fillStyle = fg;
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 256, 72);
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText(subtitle, 256, 116);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function paintManiStoneTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#6f7378';
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = '#3f4348';
  ctx.lineWidth = 5;
  ctx.strokeRect(6, 6, 244, 116);
  ctx.fillStyle = '#fef3c7';
  ctx.font = 'bold 24px serif';
  ctx.textAlign = 'center';
  ctx.fillText('ॐ मणि पद्मे हूँ', 128, 56);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('OM MANI PADME HUM · PASS CLOCKWISE', 128, 94);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Builds the 216m climbable flagship Himalayan mountain ("Sagarmatha Trek Peak")
 * with its ~1,120m winding 7-zone trekking route, interactive Sherpa Teahouse,
 * twin suspension bridges, waterfall, High Camp, seracs, crevasse ladder, and Summit Spire.
 */
export function createSagarmathaTrekPeak(
  textures: ProceduralTextureSet,
  isSoftwareGl = false,
): SagarmathaTrekController {
  const group = new THREE.Group();
  const beaconLights: THREE.PointLight[] = [];
  const prayerFlags: THREE.Mesh[] = [];

  // ---------------------------------------------------------------------------
  // 1. Sculpted Visual Mountain Mesh (216m tall) with Tri-Planar Slope & Snow Shader
  // ---------------------------------------------------------------------------
  const mountainGeo = new THREE.PlaneGeometry(312, 412, isSoftwareGl ? 105 : 156, isSoftwareGl ? 130 : 196);
  mountainGeo.rotateX(-Math.PI / 2);
  if (mountainGeo.attributes.uv) {
    mountainGeo.setAttribute('uv1', mountainGeo.attributes.uv.clone());
  }
  const mPos = mountainGeo.attributes.position;
  for (let i = 0; i < mPos.count; i++) {
    const wx = mPos.getX(i) + SAGARMATHA_PEAK_CENTER.x;
    const wz = mPos.getZ(i) + SAGARMATHA_PEAK_CENTER.z;
    const wy = computeSagarmathaPeakVisualHeight(wx, wz);
    mPos.setXYZ(i, wx, wy - 0.08, wz);
  }
  mountainGeo.computeVertexNormals();
  const mNorm = mountainGeo.attributes.normal;
  const mColors = new Float32Array(mPos.count * 3);
  const mSnowAttr = new Float32Array(mPos.count);
  for (let i = 0; i < mPos.count; i++) {
    const y = mPos.getY(i);
    const ny = Math.max(0, Math.min(1, mNorm.getY(i)));
    const cliff = 1 - THREE.MathUtils.smoothstep(ny, 0.56, 0.84);
    const snowH = THREE.MathUtils.smoothstep(y, 82, 138);
    mSnowAttr[i] = snowH * (1 - cliff);
    let r = 0.82;
    let g = 0.86;
    let b = 0.80;
    if (y > 25 && y < 86) {
      r = 0.72;
      g = 0.76;
      b = 0.72;
    }
    if (cliff > 0.25) {
      r = THREE.MathUtils.lerp(r, 0.74, cliff * 0.65);
      g = THREE.MathUtils.lerp(g, 0.70, cliff * 0.65);
      b = THREE.MathUtils.lerp(b, 0.66, cliff * 0.65);
    }
    if (snowH > 0.05 && cliff < 0.7) {
      const sf = snowH * (1 - cliff);
      r = THREE.MathUtils.lerp(r, 0.96, sf);
      g = THREE.MathUtils.lerp(g, 0.98, sf);
      b = THREE.MathUtils.lerp(b, 1.0, sf);
    }
    mColors[i * 3] = r;
    mColors[i * 3 + 1] = g;
    mColors[i * 3 + 2] = b;
  }
  mountainGeo.setAttribute('color', new THREE.BufferAttribute(mColors, 3));
  mountainGeo.setAttribute('aSnowMask', new THREE.BufferAttribute(mSnowAttr, 1));

  const mountainMat = new THREE.MeshStandardMaterial({
    map: textures.rockMap ?? textures.meadowMap,
    normalMap: textures.rockNormal,
    normalScale: new THREE.Vector2(1.05, 1.05),
    roughnessMap: textures.rockRough ?? textures.meadowRough,
    aoMap: textures.rockAo,
    aoMapIntensity: 0.75,
    vertexColors: true,
    roughness: 0.9,
    metalness: 0.03,
  });
  applyHimalayanTerrainShader(mountainMat, textures, { isAmphitheater: false });

  const mountainOccludeMesh = new THREE.Mesh(mountainGeo, mountainMat);
  mountainOccludeMesh.receiveShadow = true;
  mountainOccludeMesh.castShadow = !isSoftwareGl;
  mountainOccludeMesh.userData.skipNavMesh = true;
  mountainOccludeMesh.userData.nonCollidable = true;
  group.add(mountainOccludeMesh);

  // ---------------------------------------------------------------------------
  // 2. Gap-Free Invisible Ribbon Floor & Cliff Guard Colliders + Visible Trail Deck
  // ---------------------------------------------------------------------------
  const invisibleColliderMat = new THREE.MeshBasicMaterial({ visible: false });
  const sampleCount = TREK_SAMPLES.length;
  const ribVerts = new Float32Array(sampleCount * 2 * 3);
  const ribIndices: number[] = [];
  for (let i = 0; i < sampleCount; i++) {
    const s = TREK_SAMPLES[i];
    const hw = s.width * 0.56 + 0.28;
    const i6 = i * 6;
    ribVerts[i6] = s.x - s.nx * hw;
    ribVerts[i6 + 1] = s.y - 0.04;
    ribVerts[i6 + 2] = s.z - s.nz * hw;
    ribVerts[i6 + 3] = s.x + s.nx * hw;
    ribVerts[i6 + 4] = s.y - 0.04;
    ribVerts[i6 + 5] = s.z + s.nz * hw;
    if (i < sampleCount - 1) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      ribIndices.push(a, c, b, b, c, d);
    }
  }
  const ribGeo = new THREE.BufferGeometry();
  ribGeo.setAttribute('position', new THREE.BufferAttribute(ribVerts, 3));
  ribGeo.setIndex(ribIndices);
  ribGeo.computeVertexNormals();
  const ribbonFloorMesh = new THREE.Mesh(ribGeo, invisibleColliderMat);
  ribbonFloorMesh.userData.forceCollidable = true;
  group.add(ribbonFloorMesh);

  // Plateau floor colliders (Trailhead, Waterfall Overlook, Teahouse + Deck, High Camp, Summit)
  const addPlateauCollider = (x: number, y: number, z: number, r: number) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.35, 20), invisibleColliderMat);
    p.position.set(x, y - 0.18, z);
    p.userData.forceCollidable = true;
    group.add(p);
  };
  addPlateauCollider(TREK_PLATEAUS.trailhead.x, TREK_PLATEAUS.trailhead.y, TREK_PLATEAUS.trailhead.z, TREK_PLATEAUS.trailhead.radius);
  addPlateauCollider(TREK_PLATEAUS.waterfallOverlook.x, TREK_PLATEAUS.waterfallOverlook.y, TREK_PLATEAUS.waterfallOverlook.z, TREK_PLATEAUS.waterfallOverlook.radius);
  addPlateauCollider(TREK_PLATEAUS.teahouse.x, TREK_PLATEAUS.teahouse.y, TREK_PLATEAUS.teahouse.z, TREK_PLATEAUS.teahouse.radius);
  addPlateauCollider(TREK_PLATEAUS.highCamp.x, TREK_PLATEAUS.highCamp.y, TREK_PLATEAUS.highCamp.z, TREK_PLATEAUS.highCamp.radius);
  addPlateauCollider(TREK_PLATEAUS.summit.x, TREK_PLATEAUS.summit.y, TREK_PLATEAUS.summit.z, TREK_PLATEAUS.summit.radius);

  const deckCollider = new THREE.Mesh(new THREE.BoxGeometry(15.2, 0.4, 7.2), invisibleColliderMat);
  deckCollider.position.set(48, 141.8, -268);
  deckCollider.userData.forceCollidable = true;
  group.add(deckCollider);

  // Guard walls along bridge rails & Zone 4 exposed cliffside outer edges
  const addGuardSegment = (
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number,
    height = 1.4,
  ) => {
    const len = Math.hypot(x2 - x1, y2 - y1, z2 - z1);
    if (len < 0.2) return;
    const gMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, height, len), invisibleColliderMat);
    gMesh.position.set((x1 + x2) * 0.5, (y1 + y2) * 0.5 + height * 0.45, (z1 + z2) * 0.5);
    gMesh.lookAt(x2, y2 + height * 0.45, z2);
    gMesh.userData.forceCollidable = true;
    group.add(gMesh);
  };
  for (const span of TREK_BRIDGE_SPANS) {
    const dx = span.end[0] - span.start[0];
    const dz = span.end[2] - span.start[2];
    const l = Math.hypot(dx, dz) || 1;
    const nx = -dz / l;
    const nz = dx / l;
    const hw = span.width * 0.54;
    addGuardSegment(
      span.start[0] + nx * hw,
      span.start[1],
      span.start[2] + nz * hw,
      span.end[0] + nx * hw,
      span.end[1],
      span.end[2] + nz * hw,
    );
    addGuardSegment(
      span.start[0] - nx * hw,
      span.start[1],
      span.start[2] - nz * hw,
      span.end[0] - nx * hw,
      span.end[1],
      span.end[2] - nz * hw,
    );
  }

  // Visible sculpted trail slabs & Ulleri granite steps along non-bridge route
  const stoneStepMat = getCachedMaterial(null, 'trek-granite-step-mat', () =>
    new THREE.MeshStandardMaterial({
      color: 0x9ca0a4,
      map: textures.rockMap ?? textures.meadowMap,
      roughness: 0.88,
      metalness: 0.04,
    }),
  );
  const snowStepMat = getCachedMaterial(null, 'trek-snow-step-mat', () =>
    new THREE.MeshStandardMaterial({
      color: 0xeaf2fb,
      roughness: 0.72,
      metalness: 0.02,
    }),
  );

  const stoneSteps: Array<{ x: number; y: number; z: number; yaw: number; w: number; h: number }> = [];
  const snowSteps: Array<{ x: number; y: number; z: number; yaw: number; w: number }> = [];
  for (let i = 0; i < TREK_SAMPLES.length; i += 2) {
    const s = TREK_SAMPLES[i];
    if (s.isBridge) continue;
    const yaw = Math.atan2(s.tx, s.tz);
    if (s.surface === 'snow' || s.surface === 'ice') {
      snowSteps.push({ x: s.x, y: s.y, z: s.z, yaw, w: s.width });
    } else {
      stoneSteps.push({
        x: s.x,
        y: s.y,
        z: s.z,
        yaw,
        w: s.width,
        h: s.zone === 2 ? 0.95 : 0.78,
      });
    }
  }

  if (stoneSteps.length > 0) {
    const stepGeo = new THREE.BoxGeometry(1, 1, 1.55);
    const stepInst = new THREE.InstancedMesh(stepGeo, stoneStepMat, stoneSteps.length);
    stepInst.receiveShadow = true;
    stepInst.userData.nonCollidable = true;
    stoneSteps.forEach((st, idx) => {
      _v3.set(st.x, st.y - st.h * 0.5 + 0.02, st.z);
      _q.setFromEuler(_e.set(0, st.yaw, 0));
      _s.set(st.w * 0.92, st.h, 1.0);
      _m4.compose(_v3, _q, _s);
      stepInst.setMatrixAt(idx, _m4);
      const shade = 0.76 + (idx % 5) * 0.05;
      _c.setRGB(shade, shade * 0.98, shade * 0.96);
      stepInst.setColorAt(idx, _c);
    });
    stepInst.instanceMatrix.needsUpdate = true;
    if (stepInst.instanceColor) stepInst.instanceColor.needsUpdate = true;
    stepInst.computeBoundingSphere();
    group.add(stepInst);
  }

  if (snowSteps.length > 0) {
    const sGeo = new THREE.BoxGeometry(1, 0.55, 1.55);
    const sInst = new THREE.InstancedMesh(sGeo, snowStepMat, snowSteps.length);
    sInst.receiveShadow = true;
    sInst.userData.nonCollidable = true;
    snowSteps.forEach((st, idx) => {
      _v3.set(st.x, st.y - 0.255, st.z);
      _q.setFromEuler(_e.set(0, st.yaw, 0));
      _s.set(st.w * 0.92, 1.0, 1.0);
      _m4.compose(_v3, _q, _s);
      sInst.setMatrixAt(idx, _m4);
    });
    sInst.instanceMatrix.needsUpdate = true;
    sInst.computeBoundingSphere();
    group.add(sInst);
  }

  // Shared materials
  const timberMat = getCachedMaterial(null, 'trek-timber-mat', () =>
    new THREE.MeshStandardMaterial({ color: 0x6b4628, roughness: 0.86 }),
  );
  const darkMetalMat = getCachedMaterial(null, 'trek-iron-mat', () =>
    new THREE.MeshStandardMaterial({ color: 0x2e353d, roughness: 0.42, metalness: 0.78 }),
  );
  const steelMat = getCachedMaterial(null, 'trek-steel-mat', () =>
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.34, metalness: 0.82 }),
  );
  const brassMat = getCachedMaterial(null, 'trek-brass-mat', () =>
    new THREE.MeshStandardMaterial({ color: 0xd9a438, roughness: 0.24, metalness: 0.9 }),
  );
  const crimsonMat = getCachedMaterial(null, 'trek-crimson-mat', () =>
    new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.68 }),
  );
  const masonryMat = getCachedMaterial(null, 'trek-masonry-mat', () =>
    new THREE.MeshStandardMaterial({
      color: 0x828486,
      map: textures.rockMap ?? textures.meadowMap,
      roughness: 0.92,
    }),
  );

  // ---------------------------------------------------------------------------
  // 3. ZONE 1 (0–20m): Trailhead Archway, Map Board, Bamboo Poles, Mani Wall, Chautara
  // ---------------------------------------------------------------------------
  const z1Group = new THREE.Group();
  const th = TREK_PLATEAUS.trailhead;

  // Sherpa Timber Archway framing trail entrance at (6, 0.25, -144)
  const archGroup = new THREE.Group();
  archGroup.position.set(th.x, th.y, th.z);
  for (const sx of [-2.4, 2.4]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 4.4, 10), timberMat);
    col.position.set(sx, 2.2, 0);
    col.castShadow = true;
    archGroup.add(col);
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.6, 0.75), masonryMat);
    plinth.position.set(sx, 0.3, 0);
    archGroup.add(plinth);
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.42, 0.48), timberMat);
  lintel.position.set(0, 4.35, 0);
  lintel.castShadow = true;
  archGroup.add(lintel);

  const archRoof = new THREE.Mesh(
    new THREE.ConeGeometry(3.8, 1.15, 4),
    getCachedMaterial(null, 'trek-arch-slate-mat', () =>
      new THREE.MeshStandardMaterial({ color: 0x3f4752, roughness: 0.8 }),
    ),
  );
  archRoof.rotation.y = Math.PI / 4;
  archRoof.scale.set(1.2, 0.75, 0.42);
  archRoof.position.set(0, 4.95, 0);
  archGroup.add(archRoof);

  const archSignTex = getCachedTexture('trek-arch-sign-tex', () =>
    paintSignboardTexture('SAGARMATHA TREK', 'Gateway to the Nepal Himalayas · 216m Peak', '#182436', '#fbbf24'),
  );
  const archSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 0.9),
    new THREE.MeshStandardMaterial({ map: archSignTex, roughness: 0.6 }),
  );
  archSign.position.set(0, 3.82, 0.26);
  archSign.userData.nonCollidable = true;
  const archSignBack = archSign.clone();
  archSignBack.position.set(0, 3.82, -0.26);
  archSignBack.rotation.y = Math.PI;
  archGroup.add(archSign, archSignBack);
  z1Group.add(archGroup);

  const archFlags = createWavingPrayerFlagGarland(
    new THREE.Vector3(th.x - 2.4, th.y + 4.35, th.z + 0.1),
    new THREE.Vector3(th.x + 2.4, th.y + 4.35, th.z + 0.1),
    { flagCount: 9, flagWidth: 0.32, flagHeight: 0.4, sag: 0.36 },
  );
  z1Group.add(archFlags.group);
  prayerFlags.push(...archFlags.flags);

  // Trail Map Information Kiosk
  const mapSpot = TREK_KEY_SPOTS.trailMapBoard;
  const mapGroup = new THREE.Group();
  mapGroup.position.set(mapSpot.x, mapSpot.y, mapSpot.z);
  mapGroup.rotation.y = 0.42;
  for (const px of [-1.1, 1.1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.4, 8), timberMat);
    post.position.set(px, 1.2, 0);
    mapGroup.add(post);
  }
  const mapTex = getCachedTexture('trek-trail-map-tex', paintTrailMapTexture);
  const mapBoard = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 1.75, 0.14),
    [
      timberMat,
      timberMat,
      timberMat,
      timberMat,
      new THREE.MeshStandardMaterial({ map: mapTex, roughness: 0.55 }),
      timberMat,
    ],
  );
  mapBoard.position.set(0, 1.65, 0);
  mapGroup.add(mapBoard);
  z1Group.add(mapGroup);

  // Bamboo Trekking Pole Rack
  const rackGroup = new THREE.Group();
  rackGroup.position.set(th.x + 3.4, th.y, th.z - 1.2);
  rackGroup.rotation.y = -0.35;
  const bambooMat = getCachedMaterial(null, 'trek-bamboo-mat', () =>
    new THREE.MeshStandardMaterial({ color: 0xb7995c, roughness: 0.72 }),
  );
  for (const rx of [-0.65, 0.65]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.35, 8), timberMat);
    p.position.set(rx, 0.68, 0);
    rackGroup.add(p);
  }
  const rBar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.45, 8), timberMat);
  rBar.rotation.z = Math.PI / 2;
  rBar.position.set(0, 1.12, 0);
  rackGroup.add(rBar);
  for (let p = 0; p < 6; p++) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.018, 1.42, 6), bambooMat);
    pole.position.set(-0.48 + p * 0.19, 0.71, 0.08);
    pole.rotation.x = -0.18;
    pole.userData.nonCollidable = true;
    rackGroup.add(pole);
  }
  z1Group.add(rackGroup);

  // Mani Stone Wall + Inscribed Mantra Tablets + Stone Cairns
  const maniTex = getCachedTexture('trek-mani-stone-tex', paintManiStoneTexture);
  const maniMat = new THREE.MeshStandardMaterial({ map: maniTex, roughness: 0.84 });
  const maniGroup = new THREE.Group();
  maniGroup.position.set(TREK_KEY_SPOTS.maniWallStart.x, TREK_KEY_SPOTS.maniWallStart.y, TREK_KEY_SPOTS.maniWallStart.z);
  maniGroup.rotation.y = -0.22;
  const maniWallBase = new THREE.Mesh(new THREE.BoxGeometry(5.6, 1.18, 0.92), masonryMat);
  maniWallBase.position.set(0, 0.59, 0);
  maniWallBase.castShadow = true;
  maniGroup.add(maniWallBase);
  for (let i = 0; i < 5; i++) {
    const tablet = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.56, 0.16), maniMat);
    tablet.position.set(-2.0 + i * 1.0, 0.72, 0.45);
    tablet.userData.nonCollidable = true;
    maniGroup.add(tablet);
  }
  z1Group.add(maniGroup);

  // Chautara Stone Resting Platform + Spreading Pipal Tree + Bamboo Doko Baskets
  const chautaraSpot = TREK_KEY_SPOTS.chautaraTree;
  const chautara = new THREE.Group();
  chautara.position.set(chautaraSpot.x, chautaraSpot.y, chautaraSpot.z);
  const cTier1 = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.8, 0.65, 12), masonryMat);
  cTier1.position.y = 0.32;
  const cTier2 = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.9, 0.55, 12), masonryMat);
  cTier2.position.y = 0.9;
  const cTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.48, 3.8, 10), timberMat);
  cTrunk.position.y = 2.8;
  const canopyMat = getCachedMaterial(null, 'trek-pipal-leaf-mat', () =>
    new THREE.MeshStandardMaterial({ color: 0x2e6b37, roughness: 0.82 }),
  );
  for (const [cx, cy, cz, cr] of [
    [0, 5.2, 0, 2.3],
    [-1.4, 4.7, 0.8, 1.6],
    [1.3, 4.6, -0.7, 1.7],
  ]) {
    const leaf = new THREE.Mesh(new THREE.DodecahedronGeometry(cr, 1), canopyMat);
    leaf.position.set(cx, cy, cz);
    leaf.userData.nonCollidable = true;
    chautara.add(leaf);
  }
  // Woven Doko porter baskets resting on Chautara ledge
  for (const [bx, bz] of [
    [-1.65, 1.15],
    [-1.15, 1.48],
  ]) {
    const doko = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.16, 0.62, 10, 1, true), bambooMat);
    doko.position.set(bx, 0.96, bz);
    doko.userData.nonCollidable = true;
    chautara.add(doko);
  }
  chautara.add(cTier1, cTier2, cTrunk);
  z1Group.add(chautara);
  group.add(z1Group);

  // ---------------------------------------------------------------------------
  // 4. ZONE 2 (20–60m): Pines, Scarlet Lali Gurans Rhododendrons, Waterfall & Pool
  // ---------------------------------------------------------------------------
  const z2Group = new THREE.Group();
  const pineTrunkGeo = new THREE.CylinderGeometry(0.14, 0.24, 3.2, 7);
  const pineConeGeo = new THREE.ConeGeometry(1.45, 3.8, 7);
  const rhodoBloomGeo = new THREE.DodecahedronGeometry(0.75, 1);

  const pineLeafMat = getCachedMaterial(null, 'trek-pine-leaf-mat', () =>
    new THREE.MeshStandardMaterial({ color: 0x1e4a31, roughness: 0.86 }),
  );
  const rhodoMat = getCachedMaterial(null, 'trek-rhodo-mat', () =>
    new THREE.MeshStandardMaterial({ color: 0xc82337, roughness: 0.72 }),
  );

  const treeCoords: Array<{ x: number; y: number; z: number; s: number; isRhodo: boolean }> = [];
  for (let i = 14; i < 190; i += 5) {
    const s = TREK_SAMPLES[i];
    if (!s || s.y > 68) break;
    const side = i % 2 === 0 ? 1 : -1;
    const offset = s.width * 0.8 + 2.8 + (i % 3) * 1.4;
    const tx = s.x + s.nx * offset * side;
    const tz = s.z + s.nz * offset * side;
    const ty = computeSagarmathaPeakVisualHeight(tx, tz);
    treeCoords.push({
      x: tx,
      y: ty,
      z: tz,
      s: 0.8 + (i % 4) * 0.22,
      isRhodo: i % 10 === 4,
    });
  }

  const pineList = treeCoords.filter((t) => !t.isRhodo);
  const rhodoList = treeCoords.filter((t) => t.isRhodo);
  if (pineList.length > 0) {
    const pTrunkInst = new THREE.InstancedMesh(pineTrunkGeo, timberMat, pineList.length);
    const pCrownInst = new THREE.InstancedMesh(pineConeGeo, pineLeafMat, pineList.length * 2);
    pTrunkInst.userData.nonCollidable = true;
    pCrownInst.userData.nonCollidable = true;
    pineList.forEach((p, idx) => {
      _v3.set(p.x, p.y + 1.5 * p.s, p.z);
      _q.identity();
      _s.setScalar(p.s);
      _m4.compose(_v3, _q, _s);
      pTrunkInst.setMatrixAt(idx, _m4);

      _v3.set(p.x, p.y + 3.6 * p.s, p.z);
      _s.set(p.s * 1.05, p.s * 1.1, p.s * 1.05);
      _m4.compose(_v3, _q, _s);
      pCrownInst.setMatrixAt(idx * 2, _m4);

      _v3.set(p.x, p.y + 5.2 * p.s, p.z);
      _s.set(p.s * 0.78, p.s * 0.9, p.s * 0.78);
      _m4.compose(_v3, _q, _s);
      pCrownInst.setMatrixAt(idx * 2 + 1, _m4);
    });
    pTrunkInst.instanceMatrix.needsUpdate = true;
    pCrownInst.instanceMatrix.needsUpdate = true;
    pTrunkInst.computeBoundingSphere();
    pCrownInst.computeBoundingSphere();
    z2Group.add(pTrunkInst, pCrownInst);
  }
  if (rhodoList.length > 0) {
    const rTrunkInst = new THREE.InstancedMesh(pineTrunkGeo, timberMat, rhodoList.length);
    const rBloomInst = new THREE.InstancedMesh(rhodoBloomGeo, rhodoMat, rhodoList.length * 3);
    rTrunkInst.userData.nonCollidable = true;
    rBloomInst.userData.nonCollidable = true;
    rhodoList.forEach((p, idx) => {
      _v3.set(p.x, p.y + 1.0 * p.s, p.z);
      _q.identity();
      _s.set(p.s * 0.85, p.s * 0.72, p.s * 0.85);
      _m4.compose(_v3, _q, _s);
      rTrunkInst.setMatrixAt(idx, _m4);

      for (let b = 0; b < 3; b++) {
        _v3.set(p.x + Math.cos(b * 2.1) * 0.65 * p.s, p.y + (2.0 + b * 0.35) * p.s, p.z + Math.sin(b * 2.1) * 0.65 * p.s);
        _s.setScalar(p.s * (0.95 - b * 0.1));
        _m4.compose(_v3, _q, _s);
        rBloomInst.setMatrixAt(idx * 3 + b, _m4);
      }
    });
    rTrunkInst.instanceMatrix.needsUpdate = true;
    rBloomInst.instanceMatrix.needsUpdate = true;
    rTrunkInst.computeBoundingSphere();
    rBloomInst.computeBoundingSphere();
    z2Group.add(rTrunkInst, rBloomInst);
  }

  // Animated Cascading Glacial Waterfall + Plunge Pool + Mist Spray
  const wf = TREK_KEY_SPOTS.waterfallCenter;
  const wfMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        float flow = fract(vUv.y * 2.6 + uTime * 1.45);
        float streak1 = sin(vUv.x * 26.0 + uTime * 2.2) * 0.5 + 0.5;
        float streak2 = cos(vUv.x * 42.0 - flow * 12.0) * 0.5 + 0.5;
        float foam = smoothstep(0.32, 0.92, streak1 * 0.55 + streak2 * 0.45);
        float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
        vec3 col = mix(vec3(0.42, 0.78, 0.92), vec3(0.92, 0.98, 1.0), foam);
        float alpha = edge * (0.62 + foam * 0.34);
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });
  const wfRibbon = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 24, 6, 16), wfMat);
  wfRibbon.position.set(wf.x, wf.y + 4.8, wf.z);
  wfRibbon.rotation.y = -0.95;
  wfRibbon.rotation.x = 0.28;
  wfRibbon.userData.nonCollidable = true;
  z2Group.add(wfRibbon);

  const plungePool = new THREE.Mesh(
    new THREE.CircleGeometry(4.4, 24),
    new THREE.MeshStandardMaterial({
      color: 0x1a7f96,
      roughness: 0.14,
      metalness: 0.18,
      transparent: true,
      opacity: 0.86,
    }),
  );
  plungePool.rotation.x = -Math.PI / 2;
  plungePool.position.set(wf.x - 3.6, wf.y - 4.4, wf.z - 1.2);
  plungePool.userData.nonCollidable = true;
  z2Group.add(plungePool);

  // Waterfall mist spray particles
  const sprayCount = 48;
  const sprayPos = new Float32Array(sprayCount * 3);
  for (let i = 0; i < sprayCount; i++) {
    sprayPos[i * 3] = wf.x - 3.6 + (Math.random() - 0.5) * 4.5;
    sprayPos[i * 3 + 1] = wf.y - 4.0 + Math.random() * 5.0;
    sprayPos[i * 3 + 2] = wf.z - 1.2 + (Math.random() - 0.5) * 4.5;
  }
  const sprayGeo = new THREE.BufferGeometry();
  sprayGeo.setAttribute('position', new THREE.BufferAttribute(sprayPos, 3));
  const sprayPoints = new THREE.Points(
    sprayGeo,
    new THREE.PointsMaterial({ color: 0xe6f7ff, size: 0.65, transparent: true, opacity: 0.56, depthWrite: false }),
  );
  sprayPoints.userData.nonCollidable = true;
  z2Group.add(sprayPoints);

  // Timber footbridge over waterfall outlet
  const wfBr = TREK_KEY_SPOTS.waterfallBridge;
  const wfDeck = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.22, 6.2), timberMat);
  wfDeck.position.set(wfBr.x, wfBr.y - 0.12, wfBr.z);
  wfDeck.rotation.y = -0.3;
  wfDeck.userData.nonCollidable = true;
  z2Group.add(wfDeck);
  group.add(z2Group);

  // ---------------------------------------------------------------------------
  // 5. ZONE 3 (60–95m): Twin Hillary Suspension Bridges with Gentle Deck Sway
  // ---------------------------------------------------------------------------
  const z3Group = new THREE.Group();
  const bridgeGroups: Array<{ group: THREE.Group; baseY: number; span: (typeof TREK_BRIDGE_SPANS)[number] }> = [];
  for (const span of TREK_BRIDGE_SPANS) {
    if (span.id === 'crevasse-ladder') continue;
    const isHillary = span.id === 'bridge-1' || span.id === 'bridge-2';
    const bGroup = new THREE.Group();
    const sVec = new THREE.Vector3(...span.start);
    const eVec = new THREE.Vector3(...span.end);
    const mid = sVec.clone().lerp(eVec, 0.5);
    const len = sVec.distanceTo(eVec);
    const yaw = Math.atan2(eVec.x - sVec.x, eVec.z - sVec.z);

    // Towers & stone abutments (fixed to mountain)
    if (isHillary) {
      for (const anchor of [sVec, eVec]) {
        const abutment = new THREE.Mesh(new THREE.BoxGeometry(span.width + 1.1, 1.8, 1.4), masonryMat);
        abutment.position.set(anchor.x, anchor.y - 0.9, anchor.z);
        abutment.rotation.y = yaw;
        z3Group.add(abutment);

        for (const side of [-1, 1]) {
          const lx = anchor.x + Math.cos(yaw) * side * (span.width * 0.55);
          const lz = anchor.z - Math.sin(yaw) * side * (span.width * 0.55);
          const towerLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 3.6, 8), steelMat);
          towerLeg.position.set(lx, anchor.y + 1.8, lz);
          towerLeg.castShadow = true;
          z3Group.add(towerLeg);
        }
        const topCross = new THREE.Mesh(new THREE.BoxGeometry(span.width * 1.2, 0.16, 0.16), steelMat);
        topCross.position.set(anchor.x, anchor.y + 3.55, anchor.z);
        topCross.rotation.y = yaw;
        z3Group.add(topCross);
      }

      // Main catenary cables & prayer flag drape along cables
      for (const side of [-1, 1]) {
        const offX = Math.cos(yaw) * side * (span.width * 0.55);
        const offZ = -Math.sin(yaw) * side * (span.width * 0.55);
        const cStart = new THREE.Vector3(sVec.x + offX, sVec.y + 3.5, sVec.z + offZ);
        const cMid = new THREE.Vector3(mid.x + offX, mid.y + 1.25, mid.z + offZ);
        const cEnd = new THREE.Vector3(eVec.x + offX, eVec.y + 3.5, eVec.z + offZ);
        const cable = new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.CatmullRomCurve3([cStart, cMid, cEnd]), 20, 0.035, 6, false),
          steelMat,
        );
        cable.userData.nonCollidable = true;
        z3Group.add(cable);
      }

      const bFlags = createWavingPrayerFlagGarland(
        new THREE.Vector3(sVec.x, sVec.y + 3.4, sVec.z),
        new THREE.Vector3(eVec.x, eVec.y + 3.4, eVec.z),
        { flagCount: 16, flagWidth: 0.34, flagHeight: 0.44, sag: 1.9 },
      );
      z3Group.add(bFlags.group);
      prayerFlags.push(...bFlags.flags);
    }

    // Swaying Deck Planks & Safety Handrails
    const deckPivot = new THREE.Group();
    deckPivot.position.set(mid.x, mid.y, mid.z);
    const plankCount = Math.max(10, Math.floor(len / 0.62));
    const plankGeo = new THREE.BoxGeometry(span.width, 0.1, 0.42);
    const plankInst = new THREE.InstancedMesh(plankGeo, timberMat, plankCount);
    plankInst.castShadow = true;
    plankInst.receiveShadow = true;
    plankInst.userData.nonCollidable = true;
    for (let k = 0; k < plankCount; k++) {
      const t = k / (plankCount - 1);
      const localPos = sVec.clone().lerp(eVec, t).sub(mid);
      localPos.y -= Math.sin(t * Math.PI) * span.sag + 0.06;
      _q.setFromEuler(_e.set(0, yaw, 0));
      _s.setScalar(1);
      _m4.compose(localPos, _q, _s);
      plankInst.setMatrixAt(k, _m4);
    }
    plankInst.instanceMatrix.needsUpdate = true;
    plankInst.computeBoundingSphere();
    deckPivot.add(plankInst);

    // Safety handrail cords
    for (const side of [-1, 1]) {
      const offX = Math.cos(yaw) * side * (span.width * 0.5);
      const offZ = -Math.sin(yaw) * side * (span.width * 0.5);
      const rStart = sVec.clone().sub(mid).add(new THREE.Vector3(offX, 1.05, offZ));
      const rMid = new THREE.Vector3(offX, 1.05 - span.sag, offZ);
      const rEnd = eVec.clone().sub(mid).add(new THREE.Vector3(offX, 1.05, offZ));
      const rail = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3([rStart, rMid, rEnd]), 16, 0.025, 6, false),
        steelMat,
      );
      rail.userData.nonCollidable = true;
      deckPivot.add(rail);
    }

    bGroup.add(deckPivot);
    z3Group.add(bGroup);
    if (isHillary) {
      bridgeGroups.push({ group: deckPivot, baseY: mid.y, span });
    }
  }
  group.add(z3Group);

  // ---------------------------------------------------------------------------
  // 6. ZONE 4 (95–130m): Iron Safety Chains, Red Trail Blazes & Himalayan Monal Birds
  // ---------------------------------------------------------------------------
  const z4Group = new THREE.Group();
  const z4Samples = TREK_SAMPLES.filter((s) => s.zone === 4);
  for (let i = 0; i < z4Samples.length - 6; i += 8) {
    const a = z4Samples[i];
    const b = z4Samples[i + 6];
    const pitonA = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.95, 6), darkMetalMat);
    pitonA.position.set(a.x - a.nx * (a.width * 0.5 + 0.1), a.y + 0.45, a.z - a.nz * (a.width * 0.5 + 0.1));
    z4Group.add(pitonA);

    const pA = new THREE.Vector3(a.x - a.nx * (a.width * 0.5 + 0.1), a.y + 0.88, a.z - a.nz * (a.width * 0.5 + 0.1));
    const pB = new THREE.Vector3(b.x - b.nx * (b.width * 0.5 + 0.1), b.y + 0.88, b.z - b.nz * (b.width * 0.5 + 0.1));
    const midChain = pA.clone().lerp(pB, 0.5);
    midChain.y -= 0.16;
    const chain = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3([pA, midChain, pB]), 8, 0.022, 5, false),
      darkMetalMat,
    );
    chain.userData.nonCollidable = true;
    z4Group.add(chain);

    // Red painted trail blaze marker on inner cliff boulder
    const blaze = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.24, 0.18), crimsonMat);
    blaze.position.set(a.x + a.nx * (a.width * 0.65), a.y + 0.65, a.z + a.nz * (a.width * 0.65));
    blaze.userData.nonCollidable = true;
    z4Group.add(blaze);
  }

  // Animated Iridescent Himalayan Monal (Danphe) Birds perched on Zone 4 Crag
  const monalBirds: Array<{
    root: THREE.Group;
    leftWing: THREE.Mesh;
    rightWing: THREE.Mesh;
    home: THREE.Vector3;
    flightPhase: number;
    gliding: boolean;
  }> = [];
  const monalBlueMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.35, metalness: 0.55 });
  const monalTealMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.3, metalness: 0.6 });
  const monalTailMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 });

  const mp = TREK_KEY_SPOTS.monalPerch;
  for (let b = 0; b < 3; b++) {
    const bird = new THREE.Group();
    const home = new THREE.Vector3(mp.x + b * 1.4, mp.y + (b % 2) * 0.4, mp.z - b * 1.2);
    bird.position.copy(home);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), monalBlueMat);
    body.scale.set(0.9, 0.85, 1.45);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), monalTealMat);
    head.position.set(0, 0.15, 0.22);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 6), monalTailMat);
    tail.rotation.x = -Math.PI / 2.3;
    tail.position.set(0, 0.06, -0.28);
    const wingGeo = new THREE.BoxGeometry(0.32, 0.03, 0.18);
    wingGeo.translate(0.16, 0, 0);
    const leftWing = new THREE.Mesh(wingGeo, monalBlueMat);
    leftWing.position.set(0.06, 0.06, 0.04);
    const rightWing = new THREE.Mesh(wingGeo, monalBlueMat);
    rightWing.scale.x = -1;
    rightWing.position.set(-0.06, 0.06, 0.04);
    bird.add(body, head, tail, leftWing, rightWing);
    bird.userData.nonCollidable = true;
    z4Group.add(bird);
    monalBirds.push({ root: bird, leftWing, rightWing, home, flightPhase: b * 1.8, gliding: false });
  }
  group.add(z4Group);

  // ---------------------------------------------------------------------------
  // 7. ZONE 5 (130–155m): Sherpa Teahouse ("Sagarmatha View Lodge") & Brass Telescope
  // ---------------------------------------------------------------------------
  const z5Group = new THREE.Group();
  const thPos = TREK_PLATEAUS.teahouse;
  const lodge = new THREE.Group();
  lodge.position.set(49.0, thPos.y, -280.0);

  const lodgeWalls = new THREE.Mesh(new THREE.BoxGeometry(9.2, 4.1, 6.2), masonryMat);
  lodgeWalls.position.y = 2.05;
  lodgeWalls.castShadow = true;
  lodgeWalls.receiveShadow = true;
  lodge.add(lodgeWalls);

  const roofBlueMat = getCachedMaterial(null, 'trek-teahouse-roof-mat', () =>
    new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.48, metalness: 0.25 }),
  );
  const roofMesh = new THREE.Mesh(new THREE.ConeGeometry(6.8, 2.1, 4), roofBlueMat);
  roofMesh.rotation.y = Math.PI / 4;
  roofMesh.scale.set(1.15, 0.72, 0.85);
  roofMesh.position.y = 4.95;
  lodge.add(roofMesh);

  // Warm glowing windows on southern wall facing viewing terrace
  const glowWinMat = new THREE.MeshStandardMaterial({
    color: 0xffd28a,
    emissive: 0xff9a2e,
    emissiveIntensity: 1.6,
    roughness: 0.2,
  });
  for (const wx of [-2.7, 0.0, 2.7]) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.15, 0.14), glowWinMat);
    win.position.set(wx, 2.15, 3.12);
    lodge.add(win);
  }
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.25, 2.1, 0.16), timberMat);
  door.position.set(-1.3, 1.05, 3.14);
  lodge.add(door);

  const lodgeSignTex = getCachedTexture('trek-teahouse-sign-tex', () =>
    paintSignboardTexture('SAGARMATHA VIEW LODGE', 'Altitude 142m · Hot Yak Butter Tea & Dal Bhat', '#1e3a8a', '#fef08a'),
  );
  const lodgeSign = new THREE.Mesh(
    new THREE.PlaneGeometry(4.8, 1.1),
    new THREE.MeshStandardMaterial({ map: lodgeSignTex, roughness: 0.55 }),
  );
  lodgeSign.position.set(0, 3.55, 3.16);
  lodge.add(lodgeSign);

  // Solar panel on roof + firewood & yak-dung stack beside lodge
  const solarMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.22, metalness: 0.72 });
  const solar = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.08, 1.4), solarMat);
  solar.position.set(2.4, 4.95, 1.4);
  solar.rotation.x = 0.42;
  lodge.add(solar);

  const firewoodStack = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 0.9), timberMat);
  firewoodStack.position.set(-5.5, 0.55, 1.2);
  lodge.add(firewoodStack);

  const teahouseLight = new THREE.PointLight(0xffad42, 2.6, 22, 1.5);
  teahouseLight.position.set(48, thPos.y + 3.0, -273);
  teahouseLight.userData = { warmFlicker: true, intensityScale: 1.0 };
  beaconLights.push(teahouseLight);
  z5Group.add(lodge, teahouseLight);

  // Cantilevered Wooden Viewing Terrace & Copper Kettle + Butter Tea Table + Steam
  const deckGroup = new THREE.Group();
  deckGroup.position.set(48, thPos.y, -268);
  const deckFloor = new THREE.Mesh(new THREE.BoxGeometry(15.0, 0.28, 7.0), timberMat);
  deckFloor.position.y = -0.14;
  deckFloor.receiveShadow = true;
  deckGroup.add(deckFloor);

  // Support stilts bracing cliff below deck
  for (const sx of [-6.4, 0, 6.4]) {
    const stilt = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 7.2, 8), timberMat);
    stilt.position.set(sx, -3.6, 3.1);
    deckGroup.add(stilt);
  }
  // Wooden railing along south terrace edge
  const railTop = new THREE.Mesh(new THREE.BoxGeometry(15.0, 0.12, 0.14), timberMat);
  railTop.position.set(0, 1.02, 3.4);
  deckGroup.add(railTop);
  for (let rx = -7.0; rx <= 7.0; rx += 1.75) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.05, 0.12), timberMat);
    post.position.set(rx, 0.52, 3.4);
    deckGroup.add(post);
  }

  // Tea table with copper kettle & butter tea mugs
  const kt = TREK_KEY_SPOTS.teahouseKettle;
  const teaTable = new THREE.Group();
  teaTable.position.set(kt.x - 48, 0, kt.z + 268);
  const tTop = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.1, 1.1), timberMat);
  tTop.position.y = 0.78;
  const tBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.75, 0.75), timberMat);
  tBase.position.y = 0.37;
  const copperMat = new THREE.MeshStandardMaterial({ color: 0xc26938, roughness: 0.28, metalness: 0.85 });
  const kettle = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), copperMat);
  kettle.position.set(-0.22, 1.0, 0);
  const mug1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.16, 8), brassMat);
  mug1.position.set(0.28, 0.91, 0.14);
  const mug2 = mug1.clone();
  mug2.position.set(0.36, 0.91, -0.18);
  teaTable.add(tTop, tBase, kettle, mug1, mug2);
  deckGroup.add(teaTable);

  // Rising steam wisps above copper kettle
  const steamGeo = new THREE.BufferGeometry();
  const steamCount = 24;
  const steamPos = new Float32Array(steamCount * 3);
  for (let i = 0; i < steamCount; i++) {
    steamPos[i * 3] = kt.x - 0.2 + (Math.random() - 0.5) * 0.3;
    steamPos[i * 3 + 1] = kt.y + 1.15 + Math.random() * 1.4;
    steamPos[i * 3 + 2] = kt.z + (Math.random() - 0.5) * 0.3;
  }
  steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPos, 3));
  const steamPoints = new THREE.Points(
    steamGeo,
    new THREE.PointsMaterial({ color: 0xf8fafc, size: 0.26, transparent: true, opacity: 0.52, depthWrite: false }),
  );
  steamPoints.userData.nonCollidable = true;
  z5Group.add(steamPoints);

  // Brass Scenic Telescope on Tripod looking south over valley
  const telSpot = TREK_KEY_SPOTS.teahouseTelescope;
  const telescopeGroup = new THREE.Group();
  telescopeGroup.position.set(telSpot.x - 48, 0, telSpot.z + 268);
  for (let l = 0; l < 3; l++) {
    const ang = (l / 3) * Math.PI * 2;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.025, 1.35, 6), darkMetalMat);
    leg.position.set(Math.cos(ang) * 0.26, 0.64, Math.sin(ang) * 0.26);
    leg.rotation.z = Math.cos(ang) * 0.24;
    leg.rotation.x = -Math.sin(ang) * 0.24;
    telescopeGroup.add(leg);
  }
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.92, 12), brassMat);
  barrel.rotation.x = Math.PI / 2 - 0.24;
  barrel.position.set(0, 1.34, 0.08);
  telescopeGroup.add(barrel);
  deckGroup.add(telescopeGroup);

  z5Group.add(deckGroup);
  group.add(z5Group);

  // ---------------------------------------------------------------------------
  // 8. ZONE 6 (155–215m): Seracs, High Camp Tents, Fixed Ropes & Crevasse Ladder
  // ---------------------------------------------------------------------------
  const z6Group = new THREE.Group();
  const iceMat = getCachedMaterial(null, 'trek-serac-ice-mat', () =>
    new THREE.MeshStandardMaterial({
      color: 0x99d9f5,
      emissive: 0x164e63,
      emissiveIntensity: 0.35,
      roughness: 0.2,
      metalness: 0.08,
      transparent: true,
      opacity: 0.86,
    }),
  );
  const seracCoords: Array<[number, number, number, number, number]> = [
    [16, 168, -365, 3.8, 8.2],
    [58, 171, -366, 3.2, 6.8],
    [4, 184, -372, 4.2, 9.4],
    [-12, 194, -370, 3.5, 7.6],
    [10, 206, -342, 3.4, 6.6],
  ];
  for (const [sx, sy, sz, sr, sh] of seracCoords) {
    const serac = new THREE.Mesh(new THREE.ConeGeometry(sr, sh, 5), iceMat);
    serac.position.set(sx, sy + sh * 0.35, sz);
    serac.rotation.set(0.12, sx * 0.3, -0.09);
    serac.userData.nonCollidable = true;
    z6Group.add(serac);
  }

  // High Camp (176m): Expedition Dome Tents, Stone Windbreak Wall, Solar Mat & Gear
  const hc = TREK_PLATEAUS.highCamp;
  const hcGroup = new THREE.Group();
  hcGroup.position.set(hc.x, hc.y, hc.z);
  const yellowTentMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.52 });
  const orangeTentMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.52 });
  for (const [tx, tz, rad, mat] of [
    [2.5, -2.5, 1.95, yellowTentMat],
    [-2.8, -1.8, 1.55, orangeTentMat],
  ] as const) {
    const tent = new THREE.Mesh(new THREE.SphereGeometry(rad, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.52), mat);
    tent.position.set(tx, 0, tz);
    tent.scale.set(1.2, 0.85, 1.05);
    tent.castShadow = true;
    hcGroup.add(tent);
  }
  const windWall = new THREE.Mesh(new THREE.BoxGeometry(5.6, 1.25, 0.65), masonryMat);
  windWall.position.set(0, 0.6, -4.8);
  hcGroup.add(windWall);
  const o2Mat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35, metalness: 0.6 });
  const o2Tank = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.72, 8), o2Mat);
  o2Tank.position.set(0.6, 0.36, -1.4);
  hcGroup.add(o2Tank);

  const hcLight = new THREE.PointLight(0xffb74d, 2.2, 18, 1.5);
  hcLight.position.set(hc.x, hc.y + 1.8, hc.z);
  hcLight.userData = { warmFlicker: true, intensityScale: 1.0 };
  beaconLights.push(hcLight);
  z6Group.add(hcGroup, hcLight);

  // Aluminum Crevasse Ladder spanning glowing blue glacial crevasse (196.75m)
  const ladSpan = TREK_BRIDGE_SPANS.find((s) => s.id === 'crevasse-ladder')!;
  const lsVec = new THREE.Vector3(...ladSpan.start);
  const leVec = new THREE.Vector3(...ladSpan.end);
  const ladMid = lsVec.clone().lerp(leVec, 0.5);
  const ladLen = lsVec.distanceTo(leVec);
  const ladYaw = Math.atan2(leVec.x - lsVec.x, leVec.z - lsVec.z);

  const ladderGroup = new THREE.Group();
  ladderGroup.position.copy(ladMid);
  ladderGroup.rotation.y = ladYaw;
  for (const rx of [-0.54, 0.54]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, ladLen), steelMat);
    rail.position.set(rx, -0.02, 0);
    ladderGroup.add(rail);
  }
  const rungCount = Math.floor(ladLen / 0.45);
  for (let r = 0; r < rungCount; r++) {
    const rz = -ladLen * 0.46 + (r / (rungCount - 1)) * ladLen * 0.92;
    const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.08, 6), steelMat);
    rung.rotation.z = Math.PI / 2;
    rung.position.set(0, -0.02, rz);
    ladderGroup.add(rung);
  }
  // Glowing deep blue crevasse void beneath ladder
  const crevasseGlow = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 6.0, ladLen * 0.85),
    new THREE.MeshBasicMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.48 }),
  );
  crevasseGlow.position.set(0, -4.5, 0);
  crevasseGlow.userData.nonCollidable = true;
  ladderGroup.add(crevasseGlow);
  z6Group.add(ladderGroup);

  // Fixed ropes & aluminum snow stakes along Zone 6 snow switchbacks
  const z6Samples = TREK_SAMPLES.filter((s) => s.zone === 6 && !s.isBridge);
  for (let i = 4; i < z6Samples.length - 8; i += 10) {
    const s = z6Samples[i];
    const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.022, 1.05, 6), crimsonMat);
    stake.position.set(s.x + s.nx * (s.width * 0.52), s.y + 0.48, s.z + s.nz * (s.width * 0.52));
    stake.userData.nonCollidable = true;
    z6Group.add(stake);
  }
  group.add(z6Group);

  // ---------------------------------------------------------------------------
  // 9. ZONE 7 (216m): Summit Spire, Whitewashed Chorten, Golden Trishul, Plaque & Flag Hoist
  // ---------------------------------------------------------------------------
  const z7Group = new THREE.Group();
  const sum = TREK_PLATEAUS.summit;
  const chPos = TREK_KEY_SPOTS.summitChorten;

  const chorten = new THREE.Group();
  chorten.position.set(chPos.x, sum.y, chPos.z);
  const whiteStupaMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.65 });
  const cBase = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 2.4), masonryMat);
  cBase.position.y = 0.45;
  const cDome = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.02, 1.35, 12), whiteStupaMat);
  cDome.position.y = 1.55;
  const cHarmika = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.52, 0.82), brassMat);
  cHarmika.position.y = 2.48;
  const cSpire = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.5, 10), brassMat);
  cSpire.position.y = 3.45;
  const trishulShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.05, 6), brassMat);
  trishulShaft.position.y = 4.45;
  chorten.add(cBase, cDome, cHarmika, cSpire, trishulShaft);
  z7Group.add(chorten);

  // Radiating Lungta Prayer Flags around Summit Chorten
  const summitCornerOffsets: Array<[number, number]> = [
    [-4.2, -3.4],
    [4.2, -3.4],
    [-4.6, 2.8],
    [4.6, 2.8],
  ];
  for (const [ox, oz] of summitCornerOffsets) {
    const corner = new THREE.Vector3(sum.x + ox, sum.y + 1.9, sum.z + oz);
    const garland = createWavingPrayerFlagGarland(
      new THREE.Vector3(chPos.x, sum.y + 3.6, chPos.z),
      corner,
      { flagCount: 8, flagWidth: 0.3, flagHeight: 0.38, sag: 0.32, includePoles: false },
    );
    z7Group.add(garland.group);
    prayerFlags.push(...garland.flags);
  }

  // Brass Elevation Plaque & Flag Hoist Pole
  const plaquePos = TREK_KEY_SPOTS.summitPlaque;
  const plaquePedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 1.15, 8), masonryMat);
  plaquePedestal.position.set(plaquePos.x, sum.y + 0.58, plaquePos.z);
  const plaqueTex = getCachedTexture('trek-summit-plaque-tex', () =>
    paintSignboardTexture('SAGARMATHA PEAK · 216M', 'Nepal Himalaya Expedition Summit', '#78350f', '#fde68a'),
  );
  const plaquePlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 0.58, 0.08),
    [
      brassMat,
      brassMat,
      brassMat,
      brassMat,
      new THREE.MeshStandardMaterial({ map: plaqueTex, roughness: 0.35, metalness: 0.45 }),
      brassMat,
    ],
  );
  plaquePlate.position.set(plaquePos.x, sum.y + 1.24, plaquePos.z);
  plaquePlate.rotation.x = -0.52;
  z7Group.add(plaquePedestal, plaquePlate);

  // Stowable Summit Celebration Prayer-Flag Banner (hoists on "[E] Hoist Prayer Flag")
  const summitBanner = createWavingPoleBanner({ height: 5.4, bannerWidth: 1.35, bannerHeight: 0.85 });
  summitBanner.group.position.set(sum.x + 1.65, sum.y, sum.z - 0.8);
  summitBanner.clothMesh.position.y = 1.15;
  let summitHoisted = false;
  let hoistProgress = 0;
  z7Group.add(summitBanner.group);
  prayerFlags.push(summitBanner.clothMesh);

  const summitLight = new THREE.PointLight(0xffd073, 3.0, 26, 1.4);
  summitLight.position.set(sum.x, sum.y + 4.4, sum.z);
  summitLight.userData = { warmFlicker: true, intensityScale: 1.0 };
  beaconLights.push(summitLight);
  z7Group.add(summitLight);
  group.add(z7Group);

  // Click hit targets for 'himalayan-trek' landmark (Trailhead Archway + Summit Chorten)
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitMesh = new THREE.Mesh(new THREE.BoxGeometry(6.5, 6.0, 4.5), hitMat);
  hitMesh.position.set(th.x, th.y + 2.8, th.z);
  hitMesh.layers.set(1);
  hitMesh.userData.nonCollidable = true;
  group.add(hitMesh);

  const summitHitMesh = new THREE.Mesh(new THREE.SphereGeometry(5.8, 10, 10), hitMat);
  summitHitMesh.position.set(sum.x, sum.y + 2.5, sum.z);
  summitHitMesh.layers.set(1);
  summitHitMesh.userData.nonCollidable = true;
  group.add(summitHitMesh);

  let warmButterTeaPulseUntil = -10;
  let lastBridgeCreakAt = -10;

  return {
    group,
    hitMesh,
    summitHitMesh,
    mountainOccludeMesh,
    beaconLights,
    prayerFlags,
    hoistSummitFlag: () => {
      summitHoisted = true;
    },
    isSummitFlagHoisted: () => summitHoisted,
    triggerButterTeaWarmth: () => {
      warmButterTeaPulseUntil = performance.now() * 0.001 + 6.0;
    },
    update: (elapsed, dt, playerPos, weather, onBridgeSwayAudio) => {
      wfMat.uniforms.uTime.value = elapsed;

      // Animate waterfall mist spray rising
      const spAttr = sprayGeo.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < sprayCount; i++) {
        const yOff = ((elapsed * 1.8 + i * 0.37) % 5.2);
        spAttr.setY(i, wf.y - 4.2 + yOff);
      }
      spAttr.needsUpdate = true;

      // Animate teahouse copper kettle steam wisps
      const stAttr = steamGeo.getAttribute('position') as THREE.BufferAttribute;
      const boost = performance.now() * 0.001 < warmButterTeaPulseUntil ? 1.8 : 1.0;
      for (let i = 0; i < steamCount; i++) {
        const cyc = (elapsed * 0.85 * boost + i * 0.19) % 1;
        stAttr.setY(i, kt.y + 1.12 + cyc * 1.45);
        stAttr.setX(i, kt.x - 0.22 + Math.sin(elapsed * 2.2 + i) * 0.14 * cyc);
      }
      stAttr.needsUpdate = true;

      // Suspension bridge subtle wind sway + heavy footsteps sway when player crosses span
      const windMul = weather === 'snow' || weather === 'rain' ? 1.55 : 1.0;
      for (const b of bridgeGroups) {
        const midX = (b.span.start[0] + b.span.end[0]) * 0.5;
        const midZ = (b.span.start[2] + b.span.end[2]) * 0.5;
        const nearBridge =
          Math.abs(playerPos.y - b.baseY) < 4.5 &&
          Math.hypot(playerPos.x - midX, playerPos.z - midZ) < 28;
        const stepAmp = nearBridge ? 0.045 : 0.015;
        b.group.rotation.z = Math.sin(elapsed * 2.6 * windMul) * stepAmp;
        b.group.position.y = b.baseY + Math.sin(elapsed * 3.8) * (nearBridge ? 0.05 : 0.012);
        if (nearBridge && onBridgeSwayAudio && elapsed - lastBridgeCreakAt > 2.6) {
          lastBridgeCreakAt = elapsed;
          onBridgeSwayAudio();
        }
      }

      // Iridescent Himalayan Monal birds flap and glide when player approaches Zone 4
      const monalApproachDist = Math.hypot(playerPos.x - mp.x, playerPos.z - mp.z);
      for (const mb of monalBirds) {
        if (monalApproachDist < 12.5 && Math.abs(playerPos.y - mp.y) < 6.0) {
          mb.gliding = true;
        }
        if (mb.gliding) {
          mb.flightPhase += dt * 0.72;
          const t = mb.flightPhase;
          mb.root.position.set(
            mb.home.x + Math.sin(t) * 14.0,
            mb.home.y + 3.2 + Math.sin(t * 1.6) * 1.6,
            mb.home.z + Math.cos(t * 0.85) * 11.0,
          );
          mb.root.rotation.y = Math.atan2(Math.cos(t) * 14.0, -Math.sin(t * 0.85) * 11.0);
          const flap = Math.sin(elapsed * 14.0 + mb.flightPhase) * 0.78;
          mb.leftWing.rotation.z = flap;
          mb.rightWing.rotation.z = -flap;
          if (monalApproachDist > 28) {
            mb.gliding = false;
            mb.root.position.copy(mb.home);
          }
        } else {
          const idleBob = Math.sin(elapsed * 2.4 + mb.flightPhase) * 0.06;
          mb.root.position.y = mb.home.y + idleBob;
          mb.leftWing.rotation.z = 0.08;
          mb.rightWing.rotation.z = -0.08;
        }
      }

      // Smoothly hoist Summit Lungta Banner to mast peak once triggered
      if (summitHoisted && hoistProgress < 1) {
        hoistProgress = Math.min(1, hoistProgress + Math.max(dt, 0.05) * 1.65);
        const eased = 1 - Math.pow(1 - hoistProgress, 3);
        summitBanner.clothMesh.position.y = THREE.MathUtils.lerp(1.15, 4.72, eased);
      }
    },
  };
}

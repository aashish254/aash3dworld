import * as THREE from 'three';
import {
  createDetailedBrassSukundaDiyo,
  createDetailedGajurSpire,
} from './janakiMandirCraft';
import { BuddhaMaterials } from './lumbiniBuddhaSculpt';
import { LumbiniTextureSet } from './lumbiniTextures';
import {
  buildDetailedButterLampAltar,
  buildDetailedDhupauroIncenseBurner,
  buildDetailedNativitySteleEnsemble,
  buildMeditationGalleryEnsemble,
} from './mayaDeviSanctuaryCraft';
import {
  applySanctumWeatheringShader,
  buildDetailedSanctuaryWallLantern,
  createSanctumAtmosphereParticles,
} from './mayaDeviAtmosphere';
import {
  createCarvedLotusPetalGeometry,
  createMarigoldFloretGeometry,
  createSculptedMarkerStoneGeometry,
} from './mayaDeviSculptureGeo';
import { createWavingPoleBanner, createWavingPrayerFlagGarland } from './prayerFlags';
import { buildMayaDeviStaircase } from './mayaDeviStaircase';

const _m4 = new THREE.Matrix4();
const _v3 = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _e = new THREE.Euler();

export interface MayaDeviHighlightInfo {
  title: string;
  subtitle: string;
  description: string;
  localPos: [number, number, number];
}

export interface MayaDeviPlaqueHitTarget {
  mesh: THREE.Mesh;
  highlightKey: 'markerStone' | 'mauryanChambers' | 'nativityRelief';
}

export interface MayaDeviBuildResult {
  group: THREE.Group;
  beaconLights: THREE.PointLight[];
  animatedNodes: THREE.Object3D[];
  cameraOccluders: THREE.Object3D[];
  plaqueHitTargets: MayaDeviPlaqueHitTarget[];
}

function createVolumetricGodRayMaterial(
  colorHex: number,
  baseOpacity: number,
  edgePower = 2.4,
): {
  material: THREE.ShaderMaterial;
  uniforms: { uTime: { value: number }; uColor: { value: THREE.Color }; uOpacity: { value: number } };
} {
  const uniforms = {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(colorHex) },
    uOpacity: { value: baseOpacity },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float ndotv = abs(dot(normalize(vWorldNormal), viewDir));
        float edgeFade = pow(clamp(ndotv, 0.0, 1.0), ${edgePower.toFixed(2)});
        float verticalFade = smoothstep(0.0, 0.24, vUv.y) * smoothstep(1.0, 0.72, vUv.y);
        float topStrength = mix(0.36, 1.0, vUv.y);
        float streaks = 0.76
          + 0.13 * sin(vUv.x * 37.699 + uTime * 0.22)
          + 0.08 * cos(vUv.x * 62.831 - uTime * 0.17 + vUv.y * 2.5)
          + 0.06 * sin(vUv.y * 14.0 - uTime * 0.31 + vUv.x * 18.849);
        float shimmer = 0.92 + 0.08 * sin(uTime * 0.65 + vWorldPos.x * 0.45 + vWorldPos.y * 0.75);
        float alpha = uOpacity * edgeFade * verticalFade * topStrength * streaks * shimmer;
        if (alpha < 0.0015) discard;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
  });
  return { material, uniforms };
}

/**
 * Builds the true-to-life 2003 Maya Devi Temple sanctuary (36.0m x 24.0m) matching UNESCO Lumbini:
 * - White-painted brick outer masonry shell with solid lower walls & continuous 12x8 multi-pane clerestory band
 * - Flat white roof terrace with terracotta-red capped perimeter parapet piers, steel railings & Buddhist flags
 * - Central white skylight pavilion tower, hemispherical white dome & 13-ringed golden Chaitya spire (~15.6m tall)
 * - Sloped white South entrance ramp (8.0m) with golden Dharmachakra medallion railings
 * - Walkable interior timber-and-steel viewing boardwalk overlooking the 21-chamber Mauryan brick ruins,
 *   the bulletproof-glass-enclosed Marker Stone, and the illuminated 4th-c. Gupta Nativity Bas-Relief.
 */
export function buildMayaDeviTemple(
  lTex: LumbiniTextureSet,
  mats: {
    whiteBrickMat: THREE.Material;
    stuccoWhiteMat: THREE.Material;
    brickMat: THREE.Material;
    terracottaCapMat: THREE.Material;
    chunarStoneMat: THREE.Material;
    giltGoldMat: THREE.Material;
    warmBronzeMat: THREE.Material;
    darkMetalMat: THREE.Material;
    timberMat: THREE.Material;
    glassTintMat: THREE.Material;
    flameGlowMat: THREE.Material;
    heroMats: BuddhaMaterials;
  },
): MayaDeviBuildResult {
  const group = new THREE.Group();
  const beaconLights: THREE.PointLight[] = [];
  const animatedNodes: THREE.Object3D[] = [];
  const cameraOccluders: THREE.Object3D[] = [];
  const extraLampFlames: THREE.Object3D[] = [];

  const W = 36.0; // X span [-18.0, +18.0]
  const D = 24.0; // Z span [-12.0, +12.0]
  const wallT = 0.80;
  const wallH = 6.45; // Roof deck top
  const parapetH = 1.00; // Piers reach 7.45m
  const doorHalfW = 1.90; // 3.80m clear doorway
  const doorH = 3.85;

  // =========================================================================
  // 1. BRICK FOUNDATION APRON & SOLID WHITE-PAINTED BRICK OUTER WALLS
  // =========================================================================
  // Perimeter brick skirting apron (disjoint corners, leaves sunken central pit clear)
  const skirtN = new THREE.Mesh(new THREE.BoxGeometry(W + 1.2, 0.44, 2.2), mats.brickMat);
  skirtN.position.set(0, 0.16, -D * 0.5 + 0.55);
  skirtN.receiveShadow = true;
  const skirtS = new THREE.Mesh(new THREE.BoxGeometry(W + 1.2, 0.44, 2.2), mats.brickMat);
  skirtS.position.set(0, 0.16, D * 0.5 - 0.55);
  skirtS.receiveShadow = true;
  const skirtSideLen = D - 3.31;
  const skirtW = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.44, skirtSideLen), mats.brickMat);
  skirtW.position.set(-W * 0.5 + 0.55, 0.16, 0);
  skirtW.receiveShadow = true;
  const skirtE = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.44, skirtSideLen), mats.brickMat);
  skirtE.position.set(W * 0.5 - 0.55, 0.16, 0);
  skirtE.receiveShadow = true;
  group.add(skirtN, skirtS, skirtW, skirtE);

  const addWall = (cx: number, cy: number, cz: number, sx: number, sy: number, sz: number) => {
    const geo = new THREE.BoxGeometry(sx, sy, sz);
    // Scale UVs proportionally to world meters so brick size stays uniform across walls, piers & headers
    const posAttr = geo.attributes.position;
    const normAttr = geo.attributes.normal;
    const uvAttr = geo.attributes.uv;
    if (posAttr && normAttr && uvAttr) {
      const tileW = 10.8;
      const tileH = 3.52;
      for (let i = 0; i < uvAttr.count; i++) {
        const lx = posAttr.getX(i);
        const ly = posAttr.getY(i);
        const lz = posAttr.getZ(i);
        const nx = Math.abs(normAttr.getX(i));
        const ny = Math.abs(normAttr.getY(i));
        const wy = cy + ly;
        if (ny > 0.5) {
          uvAttr.setXY(i, (cx + lx) / tileW, (cz + lz) / tileW);
        } else if (nx > 0.5) {
          uvAttr.setXY(i, (cz + lz) / tileW, wy / tileH);
        } else {
          uvAttr.setXY(i, (cx + lx) / tileW, wy / tileH);
        }
      }
      uvAttr.needsUpdate = true;
    }
    const m = new THREE.Mesh(geo, mats.whiteBrickMat);
    m.position.set(cx, cy, cz);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    cameraOccluders.push(m);
    return m;
  };

  // Lower solid brick walls (y: 0.0 -> 4.25)
  const lowerH = 4.25;
  // North lower wall (full span)
  addWall(0, lowerH * 0.5, -D * 0.5 + wallT * 0.5, W, lowerH, wallT);
  // West & East lower walls (full span between N & S)
  addWall(-W * 0.5 + wallT * 0.5, lowerH * 0.5, 0, wallT, lowerH, D - wallT * 2);
  addWall(W * 0.5 - wallT * 0.5, lowerH * 0.5, 0, wallT, lowerH, D - wallT * 2);
  // South lower wall left & right of central entrance doorway + lintel header
  const sideSouthW = W * 0.5 - doorHalfW;
  addWall(-(doorHalfW + sideSouthW * 0.5), lowerH * 0.5, D * 0.5 - wallT * 0.5, sideSouthW, lowerH, wallT);
  addWall(doorHalfW + sideSouthW * 0.5, lowerH * 0.5, D * 0.5 - wallT * 0.5, sideSouthW, lowerH, wallT);
  // Upper lintel strip above doorway (y: doorH -> lowerH)
  addWall(0, (doorH + lowerH) * 0.5, D * 0.5 - wallT * 0.5, doorHalfW * 2, lowerH - doorH, wallT);

  // Carved Newari Sal-Wood & Gilded-Brass Sanctuary Portal (folded cleanly open inside reveals so doorway path stays 100% clear)
  const salDoorMat = new THREE.MeshStandardMaterial({
    map: lTex.cofferTimberMap,
    normalMap: lTex.cofferTimberNormal,
    normalScale: new THREE.Vector2(1.45, 1.45),
    roughnessMap: lTex.cofferTimberRough,
    color: 0x6c3e20,
    roughness: 0.56,
    metalness: 0.06,
  });
  const doorPortalGroup = new THREE.Group();
  const portalCenterZ = D * 0.5 - wallT * 0.5;
  const frameDepth = wallT + 0.18;

  // Stepped Carved Sal-Wood Jambs (Sakha), Lotus Plinths, Brass Beaded Borders & Dwar-Torana Lintel
  for (const side of [-1, 1]) {
    const jx = side * (doorHalfW - 0.04);
    const outerJamb = new THREE.Mesh(new THREE.BoxGeometry(0.16, doorH, frameDepth), salDoorMat);
    outerJamb.position.set(jx, doorH * 0.5, portalCenterZ);
    outerJamb.castShadow = true;
    outerJamb.receiveShadow = true;
    doorPortalGroup.add(outerJamb);

    const innerCasing = new THREE.Mesh(new THREE.BoxGeometry(0.08, doorH - 0.14, frameDepth + 0.04), mats.warmBronzeMat);
    innerCasing.position.set(side * (doorHalfW - 0.12), (doorH - 0.14) * 0.5, portalCenterZ);
    innerCasing.userData.nonCollidable = true;

    const jambPlinth = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.34, frameDepth + 0.08), mats.chunarStoneMat);
    jambPlinth.position.set(side * (doorHalfW - 0.02), 1.17, portalCenterZ);
    jambPlinth.userData.nonCollidable = true;

    // Twin exterior fluted Sal pilasters flanking doorway entrance
    const extPilaster = new THREE.Mesh(new THREE.BoxGeometry(0.18, doorH - 1.18, 0.10), salDoorMat);
    extPilaster.position.set(side * (doorHalfW + 0.06), 1.00 + (doorH - 1.18) * 0.5, D * 0.5 + 0.05);
    extPilaster.userData.nonCollidable = true;
    const extBrassTrim = new THREE.Mesh(new THREE.BoxGeometry(0.05, doorH - 1.24, 0.115), mats.giltGoldMat);
    extBrassTrim.position.set(side * (doorHalfW - 0.03), 1.00 + (doorH - 1.24) * 0.5, D * 0.5 + 0.052);
    extBrassTrim.userData.nonCollidable = true;
    doorPortalGroup.add(innerCasing, jambPlinth, extPilaster, extBrassTrim);
  }

  // Multi-tiered Carved Dwar-Torana Architrave Header with Golden Dharmachakra & Lotus Rosettes
  const toranaLintel = new THREE.Mesh(new THREE.BoxGeometry(doorHalfW * 2 + 0.36, 0.24, frameDepth + 0.08), salDoorMat);
  toranaLintel.position.set(0, doorH - 0.12, portalCenterZ);
  toranaLintel.castShadow = true;
  const toranaCorniceBrass = new THREE.Mesh(new THREE.BoxGeometry(doorHalfW * 2 + 0.44, 0.055, frameDepth + 0.12), mats.giltGoldMat);
  toranaCorniceBrass.position.set(0, doorH - 0.23, portalCenterZ);
  toranaCorniceBrass.userData.nonCollidable = true;
  doorPortalGroup.add(toranaLintel, toranaCorniceBrass);

  // Sculpted Torana Arch Crest on both Exterior (+Z) and Interior (-Z) lintel faces
  for (const faceDir of [-1, 1]) {
    const faceZ = portalCenterZ + faceDir * (frameDepth * 0.5 + 0.06);
    const wheelRing = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.022, 8, 24), mats.giltGoldMat);
    wheelRing.position.set(0, doorH - 0.02, faceZ);
    wheelRing.userData.nonCollidable = true;
    const wheelHub = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.04, 12), mats.giltGoldMat);
    wheelHub.rotation.x = Math.PI * 0.5;
    wheelHub.position.set(0, doorH - 0.02, faceZ);
    wheelHub.userData.nonCollidable = true;
    doorPortalGroup.add(wheelRing, wheelHub);
    for (let sp = 0; sp < 4; sp++) {
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.010, 0.30, 6), mats.giltGoldMat);
      spoke.rotation.z = (sp / 4) * Math.PI;
      spoke.position.set(0, doorH - 0.02, faceZ);
      spoke.userData.nonCollidable = true;
      doorPortalGroup.add(spoke);
    }
    for (const side of [-1, 1]) {
      for (const rx of [0.58, 1.18]) {
        const rosette = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.095, 0.035, 12), mats.giltGoldMat);
        rosette.rotation.x = Math.PI * 0.5;
        rosette.position.set(side * rx, doorH - 0.10, faceZ);
        rosette.userData.nonCollidable = true;
        const boss = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 6), mats.warmBronzeMat);
        boss.position.set(side * rx, doorH - 0.10, faceZ + faceDir * 0.018);
        boss.userData.nonCollidable = true;
        doorPortalGroup.add(rosette, boss);
      }
    }
  }

  // Double Carved Temple Door Leaves (1.38m wide x 2.77m tall above 1.00m floor) folded neatly open along inner reveal
  const leafW = 1.38;
  const leafH = doorH - 1.08; // 2.77m (y: 1.00 .. 3.77)
  const leafThick = 0.088;
  const panelBeadGeo = createCarvedLotusPetalGeometry(0.032, 0.052, 0.010);

  for (const side of [-1, 1]) {
    const leafPivot = new THREE.Group();
    // Hinged just inside the inner reveal and folded ~82 deg open so ornate coffered faces gleam clearly as you walk through!
    leafPivot.position.set(side * (doorHalfW - 0.14), 1.01, portalCenterZ - wallT * 0.32);
    leafPivot.rotation.y = side * -1.44;
    leafPivot.userData.nonCollidable = true;

    const leafBody = new THREE.Group();
    // Shift so hinge edge sits at local x=0 and leaf spans inward toward center (+side * leafW) -> rotated into reveal
    leafBody.position.set(-side * (leafW * 0.5), leafH * 0.5, 0);

    // Solid carved Sal-wood door core + surrounding mitered brass perimeter frame
    const core = new THREE.Mesh(new THREE.BoxGeometry(leafW, leafH, leafThick), salDoorMat);
    core.castShadow = true;
    core.receiveShadow = true;
    core.userData.nonCollidable = true;
    leafBody.add(core);

    const outerBrassV = new THREE.BoxGeometry(0.052, leafH, leafThick + 0.014);
    const outerBrassH = new THREE.BoxGeometry(leafW, 0.055, leafThick + 0.014);
    for (const bx of [-leafW * 0.5 + 0.026, leafW * 0.5 - 0.026]) {
      const m = new THREE.Mesh(outerBrassV, mats.warmBronzeMat);
      m.position.x = bx;
      m.userData.nonCollidable = true;
      leafBody.add(m);
    }
    for (const by of [-leafH * 0.5 + 0.028, 0.34, leafH * 0.5 - 0.028]) {
      const m = new THREE.Mesh(outerBrassH, mats.warmBronzeMat);
      m.position.y = by;
      m.userData.nonCollidable = true;
      leafBody.add(m);
    }

    // 3x2 Recessed Carved Coffered Panels in Lower Two-Thirds (with beveled brass frames + 8-petal golden lotus medallions)
    const rows = [-0.94, -0.34, 0.22];
    const cols = [-0.30, 0.30];
    for (const py of rows) {
      for (const px of cols) {
        const pw = 0.44;
        const ph = 0.46;
        // Raised brass coffer border
        const topRim = new THREE.Mesh(new THREE.BoxGeometry(pw, 0.032, leafThick + 0.024), mats.giltGoldMat);
        topRim.position.set(px, py + ph * 0.5, 0);
        const botRim = new THREE.Mesh(new THREE.BoxGeometry(pw, 0.032, leafThick + 0.024), mats.giltGoldMat);
        botRim.position.set(px, py - ph * 0.5, 0);
        const leftRim = new THREE.Mesh(new THREE.BoxGeometry(0.032, ph, leafThick + 0.024), mats.giltGoldMat);
        leftRim.position.set(px - pw * 0.5, py, 0);
        const rightRim = new THREE.Mesh(new THREE.BoxGeometry(0.032, ph, leafThick + 0.024), mats.giltGoldMat);
        rightRim.position.set(px + pw * 0.5, py, 0);
        // Inner carved wood panel + center brass lotus medallion on BOTH faces
        for (const fz of [-1, 1]) {
          const medRing = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.012, 8, 20), mats.giltGoldMat);
          medRing.position.set(px, py, fz * (leafThick * 0.5 + 0.008));
          const medHub = new THREE.Mesh(new THREE.SphereGeometry(0.034, 10, 8), mats.giltGoldMat);
          medHub.scale.set(1, 1, 0.55);
          medHub.position.set(px, py, fz * (leafThick * 0.5 + 0.014));
          medRing.userData.nonCollidable = true;
          medHub.userData.nonCollidable = true;
          leafBody.add(medRing, medHub);

          for (let pet = 0; pet < 8; pet++) {
            const ang = (pet / 8) * Math.PI * 2;
            const pMesh = new THREE.Mesh(panelBeadGeo, mats.giltGoldMat);
            pMesh.position.set(
              px + Math.cos(ang) * 0.042,
              py + Math.sin(ang) * 0.042,
              fz * (leafThick * 0.5 + 0.010),
            );
            pMesh.rotation.set(fz > 0 ? 0.15 : -0.15, fz > 0 ? 0 : Math.PI, ang - Math.PI * 0.5);
            pMesh.userData.nonCollidable = true;
            leafBody.add(pMesh);
          }
        }
        topRim.userData.nonCollidable = true;
        botRim.userData.nonCollidable = true;
        leftRim.userData.nonCollidable = true;
        rightRim.userData.nonCollidable = true;
        leafBody.add(topRim, botRim, leftRim, rightRim);
      }
    }

    // Upper Carved Open-Work Brass Jali Lattice Grille Section (y_local: 0.55 .. 1.24)
    const jaliY = 0.88;
    const jaliH = 0.68;
    const jaliW = leafW - 0.24;
    const jaliBox = new THREE.Mesh(new THREE.BoxGeometry(jaliW, jaliH, leafThick * 0.35), mats.darkMetalMat);
    jaliBox.position.set(0, jaliY, 0);
    jaliBox.userData.nonCollidable = true;
    leafBody.add(jaliBox);
    for (let jx = -0.44; jx <= 0.441; jx += 0.11) {
      const vBar = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, jaliH, 6), mats.giltGoldMat);
      vBar.position.set(jx, jaliY, 0);
      vBar.userData.nonCollidable = true;
      leafBody.add(vBar);
    }
    for (let jy = jaliY - 0.24; jy <= jaliY + 0.241; jy += 0.12) {
      const hBar = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, jaliW, 6), mats.giltGoldMat);
      hBar.rotation.z = Math.PI * 0.5;
      hBar.position.set(0, jy, 0);
      hBar.userData.nonCollidable = true;
      leafBody.add(hBar);
    }

    // 4 Forged Brass Strap Hinges + Rivet Studs (Kila) across center stile & rails
    for (const hy of [-1.18, -0.64, 0.0, 0.52]) {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(leafW * 0.52, 0.044, leafThick + 0.028), mats.warmBronzeMat);
      strap.position.set(side * (leafW * 0.23), hy, 0);
      strap.userData.nonCollidable = true;
      leafBody.add(strap);
    }
    for (const sy of [-1.22, -0.94, -0.64, -0.34, 0.0, 0.22, 0.50, 1.28]) {
      for (const fz of [-1, 1]) {
        const stud = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 6), mats.giltGoldMat);
        stud.position.set(0, sy, fz * (leafThick * 0.5 + 0.016));
        stud.userData.nonCollidable = true;
        leafBody.add(stud);
      }
    }

    // Sculpted Brass Door Knocker Escutcheon & Hanging Ring on both faces
    for (const fz of [-1, 1]) {
      const escutcheon = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.080, 0.022, 12), mats.giltGoldMat);
      escutcheon.rotation.x = Math.PI * 0.5;
      escutcheon.position.set(-side * 0.44, -0.10, fz * (leafThick * 0.5 + 0.014));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.012, 8, 18), mats.giltGoldMat);
      ring.position.set(-side * 0.44, -0.17, fz * (leafThick * 0.5 + 0.028));
      escutcheon.userData.nonCollidable = true;
      ring.userData.nonCollidable = true;
      leafBody.add(escutcheon, ring);
    }

    leafPivot.add(leafBody);
    doorPortalGroup.add(leafPivot);
  }
  group.add(doorPortalGroup);

  // Upper solid header beam above clerestory band (y: 5.65 -> 6.45)
  const headerBotY = 5.65;
  const headerH = wallH - headerBotY;
  addWall(0, headerBotY + headerH * 0.5, -D * 0.5 + wallT * 0.5, W, headerH, wallT);
  addWall(0, headerBotY + headerH * 0.5, D * 0.5 - wallT * 0.5, W, headerH, wallT);
  addWall(-W * 0.5 + wallT * 0.5, headerBotY + headerH * 0.5, 0, wallT, headerH, D - wallT * 2);
  addWall(W * 0.5 - wallT * 0.5, headerBotY + headerH * 0.5, 0, wallT, headerH, D - wallT * 2);

  // =========================================================================
  // 2. CONTINUOUS MULTI-PANE CLERESTORY WINDOW BAND (y: 4.25 -> 5.65)
  // =========================================================================
  // 12 window bays across South & North walls, 8 bays across West & East walls
  const winMidY = (lowerH + headerBotY) * 0.5;
  const winH = headerBotY - lowerH; // 1.40m
  const cornerW = 1.85;

  // 4 solid white-brick corner piers spanning the clerestory band (butted cleanly with ZERO overlap)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addWall(
        sx * (W * 0.5 - cornerW * 0.5),
        winMidY,
        sz * (D * 0.5 - wallT * 0.5),
        cornerW,
        winH,
        wallT,
      );
      if (wallT < cornerW) {
        const legLen = cornerW - wallT;
        addWall(
          sx * (W * 0.5 - wallT * 0.5),
          winMidY,
          sz * (D * 0.5 - wallT - legLen * 0.5),
          wallT,
          winH,
          legLen,
        );
      }
    }
  }

  // Build piers between window bays + per-bay framed recessed glass (no pier penetration or coplanar Z-fighting)
  const windowGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x203242,
    roughness: 0.08,
    metalness: 0.14,
    transparent: true,
    opacity: 0.34,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    depthWrite: false,
    side: THREE.FrontSide,
  });
  const mullionTransforms: THREE.Matrix4[] = [];
  const glassTransforms: THREE.Matrix4[] = [];

  const buildClerestorySide = (
    axis: 'x' | 'z',
    coordFixed: number,
    spanTotal: number,
    bays: number,
  ) => {
    const innerSpan = spanTotal - cornerW * 2;
    const pierW = 0.42;
    const winW = (innerSpan - (bays - 1) * pierW) / bays;
    const bayStep = winW + pierW;
    const frameDepthOffset = Math.sign(coordFixed) * (wallT * 0.5 - 0.18);

    // Intermediate brick piers positioned cleanly between bays
    for (let p = 1; p < bays; p++) {
      const pierCenter = -innerSpan * 0.5 + p * bayStep - pierW * 0.5;
      if (axis === 'z') {
        addWall(pierCenter, winMidY, coordFixed, pierW, winH, wallT);
      } else {
        addWall(coordFixed, winMidY, pierCenter, wallT, winH, pierW);
      }
    }

    // Individual framed 6-pane window assemblies strictly inside each opening
    for (let b = 0; b < bays; b++) {
      const winCenter = -innerSpan * 0.5 + b * bayStep + winW * 0.5;
      const frameZ = coordFixed + frameDepthOffset;

      // Single bay glass pane co-centered inside its metal frame (no wall/pier overlap!)
      _v3.set(
        axis === 'z' ? winCenter : frameZ,
        winMidY,
        axis === 'z' ? frameZ : winCenter,
      );
      _q.setFromEuler(_e.set(0, axis === 'z' ? 0 : Math.PI * 0.5, 0));
      _s.set(winW - 0.06, winH - 0.08, 0.036);
      glassTransforms.push(new THREE.Matrix4().compose(_v3, _q, _s));

      // Horizontal perimeter rails (bottom sill, mid transom, top head rail)
      for (const hOff of [-winH * 0.5 + 0.032, 0, winH * 0.5 - 0.032]) {
        _v3.set(
          axis === 'z' ? winCenter : frameZ,
          winMidY + hOff,
          axis === 'z' ? frameZ : winCenter,
        );
        _q.setFromEuler(_e.set(0, axis === 'z' ? 0 : Math.PI * 0.5, 0));
        _s.set(winW, hOff === 0 ? 0.048 : 0.064, 0.11);
        mullionTransforms.push(new THREE.Matrix4().compose(_v3, _q, _s));
      }

      // Outer jamb stiles + 2 inner vertical mullions (3x2 = 6 panes per bay)
      for (const vFrac of [-0.5, -0.165, 0.165, 0.5]) {
        const isEdge = Math.abs(vFrac) > 0.4;
        const vOff = isEdge ? Math.sign(vFrac) * (winW * 0.5 - 0.028) : vFrac * winW;
        _v3.set(
          axis === 'z' ? winCenter + vOff : frameZ,
          winMidY,
          axis === 'z' ? frameZ : winCenter + vOff,
        );
        _q.setFromEuler(_e.set(0, axis === 'z' ? 0 : Math.PI * 0.5, 0));
        _s.set(isEdge ? 0.056 : 0.044, winH - 0.02, 0.11);
        mullionTransforms.push(new THREE.Matrix4().compose(_v3, _q, _s));
      }
    }
  };

  buildClerestorySide('z', D * 0.5 - wallT * 0.5, W, 12);
  buildClerestorySide('z', -D * 0.5 + wallT * 0.5, W, 12);
  buildClerestorySide('x', -W * 0.5 + wallT * 0.5, D, 8);
  buildClerestorySide('x', W * 0.5 - wallT * 0.5, D, 8);

  const unitBoxGeo = new THREE.BoxGeometry(1, 1, 1);
  const mullionInst = new THREE.InstancedMesh(unitBoxGeo, mats.darkMetalMat, mullionTransforms.length);
  mullionTransforms.forEach((m, idx) => mullionInst.setMatrixAt(idx, m));
  mullionInst.instanceMatrix.needsUpdate = true;
  mullionInst.computeBoundingSphere();
  mullionInst.userData.nonCollidable = true;

  const clerestoryGlassInst = new THREE.InstancedMesh(unitBoxGeo, windowGlassMat, glassTransforms.length);
  glassTransforms.forEach((m, idx) => clerestoryGlassInst.setMatrixAt(idx, m));
  clerestoryGlassInst.instanceMatrix.needsUpdate = true;
  clerestoryGlassInst.computeBoundingSphere();
  clerestoryGlassInst.renderOrder = 2;
  clerestoryGlassInst.userData.nonCollidable = true;

  group.add(mullionInst, clerestoryGlassInst);

  // =========================================================================
  // 3. FLAT ROOF DECK WITH CENTRAL SKYLIGHT WELL & TERRACOTTA-CAPPED PARAPETS
  // =========================================================================
  const skyHoleW = 9.0;
  const skyHoleD = 7.0;
  const roofThickness = 0.36;
  const roofY = wallH - roofThickness * 0.5 - 0.018;
  const addRoofSlab = (cx: number, cz: number, sx: number, sz: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, roofThickness, sz), mats.stuccoWhiteMat);
    m.position.set(cx, roofY, cz);
    m.castShadow = true;
    m.receiveShadow = true;
    m.userData.nonCollidable = true;
    group.add(m);
    cameraOccluders.push(m);
  };
  // 4 roof slabs strictly inside outer masonry walls (ZERO coplanar overlap with exterior header walls!)
  const innerRoofW = W - wallT * 2.02;
  const innerRoofD = D - wallT * 2.02;
  const sideRoofX = (innerRoofW - skyHoleW) * 0.5;
  const sideRoofZ = (innerRoofD - skyHoleD) * 0.5;
  addRoofSlab(0, -(skyHoleD * 0.5 + sideRoofZ * 0.5), innerRoofW, sideRoofZ);
  addRoofSlab(0, skyHoleD * 0.5 + sideRoofZ * 0.5, innerRoofW, sideRoofZ);
  addRoofSlab(-(skyHoleW * 0.5 + sideRoofX * 0.5), 0, sideRoofX, skyHoleD);
  addRoofSlab(skyHoleW * 0.5 + sideRoofX * 0.5, 0, sideRoofX, skyHoleD);

  // Low continuous perimeter parapet curb + evenly spaced piers with signature terracotta-red caps
  const curbH = 0.24;
  const curbW = 0.46; // Narrower than 0.62m piers so pier faces stand proud without coplanar Z-fighting
  const pierTransforms: THREE.Matrix4[] = [];
  const capTransforms: THREE.Matrix4[] = [];
  const railTransforms: THREE.Matrix4[] = [];

  const addParapetEdge = (axis: 'x' | 'z', fixedCoord: number, length: number, divisions: number) => {
    const curbLen = axis === 'z' ? length - 0.2 : length - wallT * 2.02;
    const curb = new THREE.Mesh(
      axis === 'z'
        ? new THREE.BoxGeometry(curbLen, curbH, curbW)
        : new THREE.BoxGeometry(curbW, curbH, curbLen),
      mats.whiteBrickMat,
    );
    curb.position.set(
      axis === 'x' ? fixedCoord : 0,
      wallH + curbH * 0.5 + 0.004,
      axis === 'z' ? fixedCoord : 0,
    );
    curb.userData.nonCollidable = true;
    group.add(curb);

    // 2 slim horizontal steel guardrails between piers
    for (const ry of [wallH + 0.44, wallH + 0.68]) {
      _v3.set(axis === 'x' ? fixedCoord : 0, ry, axis === 'z' ? fixedCoord : 0);
      _q.setFromEuler(_e.set(0, axis === 'z' ? 0 : Math.PI * 0.5, 0));
      _s.set(length - 0.8, 0.036, 0.036);
      railTransforms.push(new THREE.Matrix4().compose(_v3, _q, _s));
    }

    for (let i = 0; i <= divisions; i++) {
      // Skip corners on X-edges so corners aren't duplicated
      if (axis === 'x' && (i === 0 || i === divisions)) continue;
      const along = -length * 0.5 + 0.46 + (i / divisions) * (length - 0.92);
      const px = axis === 'z' ? along : fixedCoord;
      const pz = axis === 'z' ? fixedCoord : along;
      const isCorner = axis === 'z' && (i === 0 || i === divisions);
      const pw = isCorner ? 0.90 : 0.62;
      const ph = isCorner ? parapetH + 0.14 : parapetH;

      _v3.set(px, wallH + ph * 0.5 + 0.002, pz);
      _q.identity();
      _s.set(pw, ph, pw);
      pierTransforms.push(new THREE.Matrix4().compose(_v3, _q, _s));

      _v3.set(px, wallH + ph + 0.058, pz);
      _s.set(pw + 0.08, 0.11, pw + 0.08);
      capTransforms.push(new THREE.Matrix4().compose(_v3, _q, _s));
    }
  };

  addParapetEdge('z', D * 0.5 - wallT * 0.5, W, 12);
  addParapetEdge('z', -D * 0.5 + wallT * 0.5, W, 12);
  addParapetEdge('x', -W * 0.5 + wallT * 0.5, D, 8);
  addParapetEdge('x', W * 0.5 - wallT * 0.5, D, 8);

  const piersInst = new THREE.InstancedMesh(unitBoxGeo, mats.whiteBrickMat, pierTransforms.length);
  pierTransforms.forEach((m, idx) => piersInst.setMatrixAt(idx, m));
  piersInst.instanceMatrix.needsUpdate = true;
  piersInst.computeBoundingSphere();
  piersInst.castShadow = true;
  piersInst.userData.nonCollidable = true;

  const capsInst = new THREE.InstancedMesh(unitBoxGeo, mats.terracottaCapMat, capTransforms.length);
  capTransforms.forEach((m, idx) => capsInst.setMatrixAt(idx, m));
  capsInst.instanceMatrix.needsUpdate = true;
  capsInst.computeBoundingSphere();
  capsInst.userData.nonCollidable = true;

  const railsInst = new THREE.InstancedMesh(unitBoxGeo, mats.darkMetalMat, railTransforms.length);
  railTransforms.forEach((m, idx) => railsInst.setMatrixAt(idx, m));
  railsInst.instanceMatrix.needsUpdate = true;
  railsInst.computeBoundingSphere();
  railsInst.userData.nonCollidable = true;
  group.add(piersInst, capsInst, railsInst);

  // Corner Tall Poles flying 5-color billowing Buddhist Lungta Flags (wind-reactive cloth, zero spin!)
  const cornerMasts: Array<[number, number, number]> = [
    [-W * 0.5 + 0.45, D * 0.5 - 0.45, 0.25],
    [W * 0.5 - 0.45, D * 0.5 - 0.45, -0.35],
    [-W * 0.5 + 0.45, -D * 0.5 + 0.45, 0.45],
    [W * 0.5 - 0.45, -D * 0.5 + 0.45, -0.22],
  ];
  for (const [fx, fz, rot] of cornerMasts) {
    const banner = createWavingPoleBanner({
      height: 2.38,
      bannerWidth: 0.88,
      bannerHeight: 0.60,
      baseYaw: rot,
      poleMaterial: mats.darkMetalMat,
      finialMaterial: mats.giltGoldMat,
    });
    banner.group.position.set(fx, wallH + parapetH + 0.14, fz);
    group.add(banner.group);
    animatedNodes.push(banner.clothMesh);
  }

  // =========================================================================
  // 4. CENTRAL ROOFTOP CLERESTORY PAVILION, WHITE DOME & GOLDEN CHAITYA SPIRE
  // =========================================================================
  const pavGroup = new THREE.Group();
  pavGroup.position.set(0, wallH, 0);
  pavGroup.userData.nonCollidable = true;
  const pW = 10.4;
  const pD = 8.4;
  const pH = 3.25;

  // Vertical corner & intermediate white stucco pilasters + terracotta roof cornice + skylight clerestory
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.68, pH, 0.68), mats.stuccoWhiteMat);
      col.position.set(sx * (pW * 0.5 - 0.34), pH * 0.5, sz * (pD * 0.5 - 0.34));
      col.castShadow = true;
      pavGroup.add(col);
    }
  }
  const pavGlassH = pH - 1.34;
  const pavGlassY = 0.88 + pavGlassH * 0.5;
  for (const sz of [-1, 1]) {
    const zCoord = sz * (pD * 0.5 - 0.28);
    const baseWall = new THREE.Mesh(new THREE.BoxGeometry(pW - 1.38, 0.88, 0.42), mats.stuccoWhiteMat);
    baseWall.position.set(0, 0.44, zCoord);
    const topLintel = new THREE.Mesh(new THREE.BoxGeometry(pW + 0.22, 0.46, 0.52), mats.stuccoWhiteMat);
    topLintel.position.set(0, pH - 0.23, zCoord);
    pavGroup.add(baseWall, topLintel);
    for (const px of [-1.85, 1.85]) {
      const pil = new THREE.Mesh(new THREE.BoxGeometry(0.42, pavGlassH, 0.46), mats.stuccoWhiteMat);
      pil.position.set(px, pavGlassY, zCoord);
      pavGroup.add(pil);
    }
    // 3 cleanly separated framed window bays between pilasters & corner columns
    for (const [bx, bw] of [
      [-3.29, 2.42],
      [0, 3.24],
      [3.29, 2.42],
    ] as Array<[number, number]>) {
      const bayGlass = new THREE.Mesh(new THREE.BoxGeometry(bw - 0.08, pavGlassH - 0.06, 0.036), windowGlassMat);
      bayGlass.position.set(bx, pavGlassY, zCoord);
      bayGlass.renderOrder = 2;
      const midMullion = new THREE.Mesh(new THREE.BoxGeometry(0.055, pavGlassH, 0.09), mats.darkMetalMat);
      midMullion.position.set(bx, pavGlassY, zCoord);
      const midTransom = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.055, 0.09), mats.darkMetalMat);
      midTransom.position.set(bx, pavGlassY, zCoord);
      pavGroup.add(bayGlass, midMullion, midTransom);
    }
  }
  for (const sx of [-1, 1]) {
    const xCoord = sx * (pW * 0.5 - 0.28);
    const baseWall = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.88, pD - 1.38), mats.stuccoWhiteMat);
    baseWall.position.set(xCoord, 0.44, 0);
    const topLintel = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.46, pD - 0.84), mats.stuccoWhiteMat);
    topLintel.position.set(xCoord, pH - 0.23, 0);
    pavGroup.add(baseWall, topLintel);
    for (const pz of [-1.45, 1.45]) {
      const pil = new THREE.Mesh(new THREE.BoxGeometry(0.46, pavGlassH, 0.42), mats.stuccoWhiteMat);
      pil.position.set(xCoord, pavGlassY, pz);
      pavGroup.add(pil);
    }
    // 3 cleanly separated framed window bays between pilasters & corner columns
    for (const [bz, bd] of [
      [-2.59, 1.82],
      [0, 2.44],
      [2.59, 1.82],
    ] as Array<[number, number]>) {
      const bayGlass = new THREE.Mesh(new THREE.BoxGeometry(0.036, pavGlassH - 0.06, bd - 0.08), windowGlassMat);
      bayGlass.position.set(xCoord, pavGlassY, bz);
      bayGlass.renderOrder = 2;
      const midMullion = new THREE.Mesh(new THREE.BoxGeometry(0.09, pavGlassH, 0.055), mats.darkMetalMat);
      midMullion.position.set(xCoord, pavGlassY, bz);
      const midTransom = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.055, bd), mats.darkMetalMat);
      midTransom.position.set(xCoord, pavGlassY, bz);
      pavGroup.add(bayGlass, midMullion, midTransom);
    }
  }

  // Pavilion roof cap + terracotta fascia trim + hemispherical white dome + golden Nepali Gajur Chaitya spire
  const pavCap = new THREE.Mesh(new THREE.BoxGeometry(pW + 0.54, 0.28, pD + 0.54), mats.stuccoWhiteMat);
  pavCap.position.y = pH + 0.14;
  pavCap.castShadow = true;
  const pavTrim = new THREE.Mesh(new THREE.BoxGeometry(pW + 0.58, 0.12, pD + 0.58), mats.terracottaCapMat);
  pavTrim.position.y = pH + 0.30;
  const domeBase = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 2.55, 0.40, 28), mats.stuccoWhiteMat);
  domeBase.position.y = pH + 0.54;
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(2.26, 32, 18, 0, Math.PI * 2, 0, Math.PI * 0.54),
    mats.stuccoWhiteMat,
  );
  dome.position.y = pH + 0.62;
  dome.castShadow = true;

  // Square golden Harmika plinth + stepped 13-ring Chaitya Gajur spire (~15.6m peak!)
  const harmika = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.56, 1.48), mats.giltGoldMat);
  harmika.position.y = pH + 2.98;
  harmika.castShadow = true;
  const spire = createDetailedGajurSpire(mats.giltGoldMat, mats.warmBronzeMat, 2.25);
  spire.position.y = pH + 3.26;
  pavGroup.add(pavCap, pavTrim, domeBase, dome, harmika, spire);
  group.add(pavGroup);

  // Diagonal 5-color Lungta prayer-flag garlands radiating from Chaitya pavilion corners to roof masts
  for (const [fx, fz] of cornerMasts) {
    const sx = Math.sign(fx);
    const sz = Math.sign(fz);
    const startPt = new THREE.Vector3(
      sx * (pW * 0.5 - 0.34),
      wallH + pH - 0.12,
      sz * (pD * 0.5 - 0.34),
    );
    const endPt = new THREE.Vector3(fx, wallH + parapetH + 2.25, fz);
    const roofGarland = createWavingPrayerFlagGarland(startPt, endPt, {
      flagCount: 8,
      flagWidth: 0.34,
      flagHeight: 0.44,
      sag: 0.55,
      includePoles: false,
    });
    roofGarland.group.userData.nonCollidable = true;
    group.add(roofGarland.group);
  }

  // =========================================================================
  // 5. CARVED CEREMONIAL STONE STAIRWAY, CHANDRASILA APRON & ANCHORED DHARMACHAKRA BALUSTRADES
  // =========================================================================
  const staircaseRes = buildMayaDeviStaircase(
    lTex,
    {
      chunarStoneMat: mats.chunarStoneMat,
      giltGoldMat: mats.giltGoldMat,
      warmBronzeMat: mats.warmBronzeMat,
      darkMetalMat: mats.darkMetalMat,
      timberMat: mats.timberMat,
      flameGlowMat: mats.flameGlowMat,
    },
    {
      doorHalfW,
      doorH,
      wallT,
      rampZStart: D * 0.5 + 8.0,
      rampZEnd: D * 0.5,
      rampYStart: 0.10,
      rampYEnd: 1.00,
    },
  );
  group.add(staircaseRes.group);
  extraLampFlames.push(...staircaseRes.lampFlames);

  const plaqueHitTargets: MayaDeviPlaqueHitTarget[] = [];

  // =========================================================================
  // 6. MULTI-TIERED ARCHAEOLOGICAL EXCAVATION RUINS (MAURYAN / SUNGA / KUSHAN)
  // =========================================================================
  // Deep excavated sandy-earth trench floor (-1.60m below walkY = 1.00m -> local y = -0.60m)
  const trenchFloorY = -0.60;
  const earthTrenchMat = new THREE.MeshStandardMaterial({
    map: lTex.trenchEarthMap,
    normalMap: lTex.trenchEarthNormal,
    normalScale: new THREE.Vector2(1.25, 1.25),
    roughnessMap: lTex.trenchEarthRough,
    color: 0x9b7e5e,
    roughness: 0.96,
    metalness: 0.01,
  });
  const pitFloor = new THREE.Mesh(
    new THREE.BoxGeometry(W - wallT * 2, 0.16, D - wallT * 2),
    earthTrenchMat,
  );
  pitFloor.position.set(0, trenchFloorY - 0.08, 0);
  pitFloor.receiveShadow = true;
  group.add(pitFloor);

  // Sub-trench recessed earth sump pits between brick chamber corridors (depth contrast with crisp stone curbs)
  const sumpMat = new THREE.MeshStandardMaterial({
    map: lTex.trenchEarthMap,
    normalMap: lTex.trenchEarthNormal,
    color: 0x624c36,
    roughness: 0.98,
  });
  const pitHalfW = 9.0;
  const pitHalfD = 5.6;
  const walkY = 1.00;
  for (const [sx, sz, sw, sd] of [
    [-5.4, 0, 2.2, 6.4],
    [5.4, 0, 2.2, 6.4],
    [-3.1, 2.8, 1.7, 2.6],
    [3.1, 2.8, 1.7, 2.6],
    [-7.6, -2.1, 1.4, 3.8],
    [7.6, -2.1, 1.4, 3.8],
  ] as Array<[number, number, number, number]>) {
    const sump = new THREE.Mesh(new THREE.BoxGeometry(sw, 0.06, sd), sumpMat);
    sump.position.set(sx, trenchFloorY + 0.025, sz);
    sump.receiveShadow = true;
    sump.userData.nonCollidable = true;
    group.add(sump);
  }

  // Stepped brick chamber foundations (high-res PBR normal + roughness + AO + physical mortar displacement)
  const deepBrickMat = new THREE.MeshStandardMaterial({
    map: lTex.mauryaBrickMap,
    normalMap: lTex.mauryaBrickNormal,
    normalScale: new THREE.Vector2(1.55, 1.55),
    roughnessMap: lTex.mauryaBrickRough,
    aoMap: lTex.mauryaBrickAo,
    aoMapIntensity: 0.94,
    displacementMap: lTex.mauryaBrickDisp,
    displacementScale: 0.022,
    displacementBias: -0.011,
    color: 0x864935,
    roughness: 0.90,
    metalness: 0.03,
  });
  const chamberBrickMat = new THREE.MeshStandardMaterial({
    map: lTex.mauryaBrickMap,
    normalMap: lTex.mauryaBrickNormal,
    normalScale: new THREE.Vector2(1.45, 1.45),
    roughnessMap: lTex.mauryaBrickRough,
    aoMap: lTex.mauryaBrickAo,
    aoMapIntensity: 0.90,
    displacementMap: lTex.mauryaBrickDisp,
    displacementScale: 0.020,
    displacementBias: -0.010,
    color: 0xc27654,
    roughness: 0.90,
    metalness: 0.03,
  });
  const deepBrickWeather = applySanctumWeatheringShader(deepBrickMat, {
    cacheKey: 'maya-devi-deep-brick-weather-v1',
    minRelY: 0.0,
    maxRelY: 0.34,
    mossStrength: 0.36,
    dampDarken: 0.68,
    noiseScale: 4.5,
    initialAnchorY: trenchFloorY,
  });
  const chamberBrickWeather = applySanctumWeatheringShader(chamberBrickMat, {
    cacheKey: 'maya-devi-chamber-brick-weather-v1',
    minRelY: 0.12,
    maxRelY: 0.62,
    mossStrength: 0.28,
    dampDarken: 0.74,
    noiseScale: 4.2,
    initialAnchorY: trenchFloorY,
  });
  pitFloor.onBeforeRender = () => {
    const ty = pitFloor.matrixWorld.elements[13] + 0.08;
    deepBrickWeather.uniforms.uWeatherAnchorY.value = ty;
    chamberBrickWeather.uniforms.uWeatherAnchorY.value = ty;
  };
  const ruinFootings: THREE.Matrix4[] = [];
  const ruinWalls: THREE.Matrix4[] = [];
  const ruinCaps: THREE.Matrix4[] = [];
  const addBrickSegment = (cx: number, cz: number, w: number, h: number, d: number, rotY = 0) => {
    // Wide lower Mauryan footing step resting on trenchFloorY (-0.60m -> -0.34m)
    _q.setFromEuler(_e.set(0, rotY, 0));
    _v3.set(cx, trenchFloorY + 0.14, cz);
    _s.set(w + 0.22, 0.28, d + 0.22);
    _m4.compose(_v3, _q, _s);
    ruinFootings.push(_m4.clone());

    // Main weathered terracotta brick wall rising from footing (-0.34m -> -0.34 + h)
    _v3.set(cx, trenchFloorY + 0.26 + h * 0.5, cz);
    _s.set(w, h, d);
    _m4.compose(_v3, _q, _s);
    ruinWalls.push(_m4.clone());

    // Eroded stepped upper brick course on taller chambers
    if (h >= 0.72) {
      const capFactor = Math.abs(Math.sin(cx * 3.1 + cz * 1.7)) * 0.35 + 0.45;
      _v3.set(cx + (w > d ? (cx > 0 ? -0.15 : 0.15) : 0), trenchFloorY + 0.26 + h + 0.08, cz);
      _s.set(w > d ? w * capFactor : w * 0.88, 0.16, d > w ? d * capFactor : d * 0.88);
      _m4.compose(_v3, _q, _s);
      ruinCaps.push(_m4.clone());
    }
  };

  // Intersecting N-S and E-W Kushan / Sunga / Mauryan chamber walls (-0.4m to -1.6m below boardwalk)
  const nsWallSegs: Array<[number, number, number, number, number]> = [
    [-7.9, -2.5, 0.46, 0.86, 4.4],
    [-7.9, 2.7, 0.46, 0.68, 3.8],
    [-5.8, -1.8, 0.44, 0.94, 5.0],
    [-5.8, 3.0, 0.44, 0.64, 3.4],
    [-3.7, -2.8, 0.44, 0.88, 3.8],
    [-3.7, 2.4, 0.44, 0.76, 4.2],
    [-1.95, -2.3, 0.42, 0.92, 3.2],
    [-1.95, 2.7, 0.42, 0.78, 3.8],
    [1.95, -2.3, 0.42, 0.94, 3.2],
    [1.95, 2.7, 0.42, 0.80, 3.8],
    [3.7, -2.8, 0.44, 0.90, 3.8],
    [3.7, 2.4, 0.44, 0.76, 4.2],
    [5.8, -1.8, 0.44, 0.92, 5.0],
    [5.8, 3.0, 0.44, 0.66, 3.4],
    [7.9, -2.5, 0.46, 0.84, 4.4],
    [7.9, 2.7, 0.46, 0.70, 3.8],
  ];
  for (const [rx, rz, rw, rh, rd] of nsWallSegs) {
    addBrickSegment(rx, rz, rw, rh, rd);
  }
  const ewWallSegs: Array<[number, number, number, number, number]> = [
    [-5.8, -4.4, 4.2, 0.84, 0.46],
    [5.8, -4.4, 4.2, 0.86, 0.46],
    [-5.8, -1.4, 4.0, 0.90, 0.44],
    [5.8, -1.4, 4.0, 0.92, 0.44],
    [-5.8, 1.5, 4.0, 0.74, 0.44],
    [5.8, 1.5, 4.0, 0.78, 0.44],
    [-5.2, 4.3, 5.2, 0.66, 0.46],
    [5.2, 4.3, 5.2, 0.70, 0.46],
    [0.0, 3.2, 4.1, 0.68, 0.44],
    [-2.85, -0.1, 1.8, 0.78, 0.42],
    [2.85, -0.1, 1.8, 0.78, 0.42],
  ];
  for (const [rx, rz, rw, rh, rd] of ewWallSegs) {
    addBrickSegment(rx, rz, rw, rh, rd);
  }

  // Recessed Apsidal Brick Chambers (authentic 3rd-c. BCE Mauryan apsidal caitya plan on West & East wings)
  for (const side of [-1, 1]) {
    const apseCx = side * 6.85;
    const apseCz = 0.05;
    const apseR = 1.65;
    const arcCount = 9;
    for (let i = 0; i < arcCount; i++) {
      const ang = -Math.PI * 0.46 + (i / (arcCount - 1)) * Math.PI * 0.92;
      const rx = apseCx + side * Math.cos(ang) * apseR;
      const rz = apseCz + Math.sin(ang) * apseR;
      const segH = 0.74 + Math.sin((i / (arcCount - 1)) * Math.PI) * 0.24;
      addBrickSegment(rx, rz, 0.42, segH, 0.68, side * ang);
    }
  }

  const brickBoxGeo = new THREE.BoxGeometry(1, 1, 1, 10, 8, 10);
  const footingInst = new THREE.InstancedMesh(brickBoxGeo, deepBrickMat, ruinFootings.length);
  ruinFootings.forEach((m, idx) => footingInst.setMatrixAt(idx, m));
  footingInst.instanceMatrix.needsUpdate = true;
  footingInst.computeBoundingSphere();
  footingInst.receiveShadow = true;
  footingInst.userData.nonCollidable = true;

  const ruinInst = new THREE.InstancedMesh(brickBoxGeo, chamberBrickMat, ruinWalls.length);
  ruinWalls.forEach((m, idx) => ruinInst.setMatrixAt(idx, m));
  ruinInst.instanceMatrix.needsUpdate = true;
  ruinInst.computeBoundingSphere();
  ruinInst.castShadow = true;
  ruinInst.receiveShadow = true;
  ruinInst.userData.nonCollidable = true;

  const ruinCapInst = new THREE.InstancedMesh(brickBoxGeo, chamberBrickMat, ruinCaps.length);
  ruinCaps.forEach((m, idx) => ruinCapInst.setMatrixAt(idx, m));
  ruinCapInst.instanceMatrix.needsUpdate = true;
  ruinCapInst.computeBoundingSphere();
  ruinCapInst.castShadow = true;
  ruinCapInst.receiveShadow = true;
  ruinCapInst.userData.nonCollidable = true;
  group.add(footingInst, ruinInst, ruinCapInst);

  // 12 Square Carved Chunar Sandstone Pillar Plinth Bases seated inside the excavated trench grid
  const pillarBasePositions: Array<[number, number]> = [
    [-6.9, -3.0], [-4.8, -3.0], [-2.85, -3.0], [2.85, -3.0], [4.8, -3.0], [6.9, -3.0],
    [-6.9, 3.0], [-4.8, 3.0], [-2.85, 3.0], [2.85, 3.0], [4.8, 3.0], [6.9, 3.0],
  ];
  const pillarBaseLowInst = new THREE.InstancedMesh(unitBoxGeo, mats.chunarStoneMat, pillarBasePositions.length);
  const pillarBaseTopInst = new THREE.InstancedMesh(unitBoxGeo, mats.chunarStoneMat, pillarBasePositions.length);
  pillarBasePositions.forEach(([px, pz], idx) => {
    _q.identity();
    _v3.set(px, trenchFloorY + 0.12, pz);
    _s.set(0.68, 0.24, 0.68);
    _m4.compose(_v3, _q, _s);
    pillarBaseLowInst.setMatrixAt(idx, _m4);

    _v3.set(px, trenchFloorY + 0.30, pz);
    _s.set(0.46, 0.14, 0.46);
    _m4.compose(_v3, _q, _s);
    pillarBaseTopInst.setMatrixAt(idx, _m4);
  });
  pillarBaseLowInst.instanceMatrix.needsUpdate = true;
  pillarBaseTopInst.instanceMatrix.needsUpdate = true;
  pillarBaseLowInst.computeBoundingSphere();
  pillarBaseTopInst.computeBoundingSphere();
  pillarBaseLowInst.castShadow = true;
  pillarBaseLowInst.receiveShadow = true;
  pillarBaseLowInst.userData.nonCollidable = true;
  pillarBaseTopInst.userData.nonCollidable = true;
  group.add(pillarBaseLowInst, pillarBaseTopInst);

  // Excavated brick fragment scatter on trench beds
  const rubbleCount = 36;
  const rubbleInst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1, 3, 2, 2), deepBrickMat, rubbleCount);
  for (let i = 0; i < rubbleCount; i++) {
    const h1 = Math.sin(i * 19.7 + 1.3) * 43758.5453;
    const r1 = h1 - Math.floor(h1);
    const h2 = Math.sin(i * 53.1 + 7.9) * 43758.5453;
    const r2 = h2 - Math.floor(h2);
    const rx = (r1 - 0.5) * 15.2;
    const rz = (r2 - 0.5) * 9.2;
    if (Math.abs(rx) < 2.2 && Math.abs(rz) < 2.5) {
      _v3.set(5.4 + (r1 - 0.5) * 1.4, trenchFloorY + 0.04, rz);
    } else {
      _v3.set(rx, trenchFloorY + 0.04, rz);
    }
    _q.setFromEuler(_e.set(0, r1 * Math.PI, (r2 - 0.5) * 0.15));
    _s.set(0.24 + r1 * 0.16, 0.08, 0.14 + r2 * 0.08);
    _m4.compose(_v3, _q, _s);
    rubbleInst.setMatrixAt(i, _m4);
  }
  rubbleInst.instanceMatrix.needsUpdate = true;
  rubbleInst.computeBoundingSphere();
  rubbleInst.userData.nonCollidable = true;
  group.add(rubbleInst);

  // =========================================================================
  // 7. DUAL-FOCUS CENTRAL SANCTUM: RECESSED MARKER STONE + 3D NATIVITY STELE
  // =========================================================================
  // 7A. Sunken Sacred Marker Stone (x = 0, z = +0.65) in Ancient Brick Chamber Floor + Museum Glass Enclosure
  const markerSanctum = new THREE.Group();
  markerSanctum.position.set(0, 0, 0.65);

  const markerOuterChamber = new THREE.Mesh(new THREE.BoxGeometry(3.36, 0.62, 2.76, 18, 6, 16), deepBrickMat);
  markerOuterChamber.position.set(0, trenchFloorY + 0.31, 0);
  markerOuterChamber.receiveShadow = true;
  const markerBrickRim = new THREE.Mesh(new THREE.BoxGeometry(2.78, 0.34, 2.22, 16, 4, 14), chamberBrickMat);
  markerBrickRim.position.set(0, 0.10, 0);
  markerBrickRim.receiveShadow = true;
  const markerSunkenWell = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.10, 1.44), sumpMat);
  markerSunkenWell.position.set(0, 0.23, 0);
  markerSunkenWell.receiveShadow = true;

  // Stepped 3D Mauryan/Kushan Terracotta Brick Header Courses lining the inner sanctum rim
  const brickCourseMatrices: THREE.Matrix4[] = [];
  const brickCourseColors: THREE.Color[] = [];
  const courseSpecs = [
    { halfX: 1.06, halfZ: 0.80, y: 0.295, bw: 0.21, bh: 0.055, bd: 0.11 },
    { halfX: 1.24, halfZ: 0.96, y: 0.265, bw: 0.22, bh: 0.052, bd: 0.11 },
  ];
  for (let cIdx = 0; cIdx < courseSpecs.length; cIdx++) {
    const cs = courseSpecs[cIdx];
    const nx = Math.floor((cs.halfX * 2) / (cs.bw + 0.018));
    for (let i = 0; i < nx; i++) {
      const bx = -cs.halfX + ((i + 0.5) / nx) * cs.halfX * 2;
      for (const sz of [-1, 1]) {
        const jitterY = ((i * 7 + cIdx * 3) % 5 - 2) * 0.0025;
        _v3.set(bx, cs.y + jitterY, sz * cs.halfZ);
        _q.setFromEuler(_e.set(0, ((i % 3) - 1) * 0.015, 0));
        _s.set(cs.bw, cs.bh, cs.bd);
        _m4.compose(_v3, _q, _s);
        brickCourseMatrices.push(_m4.clone());
        const tone = 0.84 + ((i * 11 + sz + cIdx) % 7) * 0.032;
        brickCourseColors.push(new THREE.Color(tone, tone * 0.92, tone * 0.86));
      }
    }
    const nz = Math.floor((cs.halfZ * 2 - 0.22) / (cs.bw + 0.018));
    for (let i = 0; i < nz; i++) {
      const bz = -(cs.halfZ - 0.11) + ((i + 0.5) / nz) * (cs.halfZ - 0.11) * 2;
      for (const sx of [-1, 1]) {
        const jitterY = ((i * 5 + cIdx * 2) % 5 - 2) * 0.0025;
        _v3.set(sx * cs.halfX, cs.y + jitterY, bz);
        _q.setFromEuler(_e.set(0, Math.PI * 0.5 + ((i % 3) - 1) * 0.015, 0));
        _s.set(cs.bw, cs.bh, cs.bd);
        _m4.compose(_v3, _q, _s);
        brickCourseMatrices.push(_m4.clone());
        const tone = 0.84 + ((i * 13 + sx + cIdx) % 7) * 0.032;
        brickCourseColors.push(new THREE.Color(tone, tone * 0.92, tone * 0.86));
      }
    }
  }
  const sanctumBrickGeo = new THREE.BoxGeometry(1, 1, 1, 4, 2, 3);
  const sanctumBrickInst = new THREE.InstancedMesh(sanctumBrickGeo, chamberBrickMat, brickCourseMatrices.length);
  for (let i = 0; i < brickCourseMatrices.length; i++) {
    sanctumBrickInst.setMatrixAt(i, brickCourseMatrices[i]);
    sanctumBrickInst.setColorAt(i, brickCourseColors[i]);
  }
  sanctumBrickInst.instanceMatrix.needsUpdate = true;
  if (sanctumBrickInst.instanceColor) sanctumBrickInst.instanceColor.needsUpdate = true;
  sanctumBrickInst.castShadow = true;
  sanctumBrickInst.receiveShadow = true;
  sanctumBrickInst.userData.nonCollidable = true;

  // Sculpted Chunar Sandstone Plinth + Beaded Gilt-Brass Cradle Collar under the Marker Stone
  const markerBaseStoneMat = (mats.chunarStoneMat as THREE.MeshStandardMaterial).clone();
  const markerBaseWeather = applySanctumWeatheringShader(markerBaseStoneMat, {
    cacheKey: 'maya-devi-marker-plinth-weather-v1',
    minRelY: -0.06,
    maxRelY: 0.06,
    mossStrength: 0.36,
    dampDarken: 0.70,
    noiseScale: 6.4,
    initialAnchorY: 0.35,
  });
  const markerStoneBaseSlab = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.045, 1.02), markerBaseStoneMat);
  markerStoneBaseSlab.position.set(0, 0.302, 0);
  markerStoneBaseSlab.receiveShadow = true;

  const markerGoldBorder = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.036, 0.88), mats.giltGoldMat);
  markerGoldBorder.position.set(0, 0.342, 0);
  markerGoldBorder.receiveShadow = true;

  const bezelBeadGeo = new THREE.SphereGeometry(0.018, 8, 6);
  const bezelBeads: THREE.Matrix4[] = [];
  for (let i = 0; i < 11; i++) {
    const bx = THREE.MathUtils.lerp(-0.56, 0.56, i / 10);
    for (const sz of [-1, 1]) {
      _v3.set(bx, 0.362, sz * 0.41);
      _q.identity();
      _s.set(1.1, 0.65, 1.1);
      _m4.compose(_v3, _q, _s);
      bezelBeads.push(_m4.clone());
    }
  }
  for (let i = 1; i < 7; i++) {
    const bz = THREE.MathUtils.lerp(-0.41, 0.41, i / 7);
    for (const sx of [-1, 1]) {
      _v3.set(sx * 0.595, 0.362, bz);
      _q.identity();
      _s.set(1.1, 0.65, 1.1);
      _m4.compose(_v3, _q, _s);
      bezelBeads.push(_m4.clone());
    }
  }
  const bezelBeadInst = new THREE.InstancedMesh(bezelBeadGeo, mats.giltGoldMat, bezelBeads.length);
  bezelBeads.forEach((m, idx) => bezelBeadInst.setMatrixAt(idx, m));
  bezelBeadInst.instanceMatrix.needsUpdate = true;
  bezelBeadInst.userData.nonCollidable = true;

  // Authentic Sculpted River-Cobble Conglomerate Sacred Marker Stone (bound to dedicated 1024px markerStone PBR maps)
  const markerStoneMat = new THREE.MeshStandardMaterial({
    map: lTex.markerStoneMap,
    normalMap: lTex.markerStoneNormal,
    normalScale: new THREE.Vector2(2.1, 2.1),
    roughnessMap: lTex.markerStoneRough,
    color: 0xffffff,
    roughness: 0.84,
    metalness: 0.04,
  });
  const markerStoneWeather = applySanctumWeatheringShader(markerStoneMat, {
    cacheKey: 'maya-devi-marker-stone-weather-v1',
    minRelY: 0.0,
    maxRelY: 0.135,
    mossStrength: 0.32,
    dampDarken: 0.72,
    noiseScale: 7.4,
    initialAnchorY: 0.35,
  });
  const stoneW = 1.16;
  const stoneH = 0.23;
  const stoneD = 0.78;
  const stoneBaseY = 0.35;
  const markerStone = new THREE.Mesh(
    createSculptedMarkerStoneGeometry(stoneW, stoneH, stoneD, 52, 16),
    markerStoneMat,
  );
  markerStone.position.set(0, stoneBaseY, 0);
  markerStone.castShadow = true;
  markerStone.receiveShadow = true;
  const syncMarkerWeatherAnchor = () => {
    const wy = markerStone.matrixWorld.elements[13];
    markerBaseWeather.uniforms.uWeatherAnchorY.value = wy;
    markerStoneWeather.uniforms.uWeatherAnchorY.value = wy;
  };
  markerStoneBaseSlab.onBeforeRender = syncMarkerWeatherAnchor;
  markerStone.onBeforeRender = syncMarkerWeatherAnchor;

  // 64 Real 3D Embedded River-Pebble Clasts protruding organically from the Conglomerate Stone
  const pebbleGeo = new THREE.IcosahedronGeometry(1, 2);
  const pebbleMat = new THREE.MeshStandardMaterial({
    normalMap: lTex.markerStoneNormal,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughness: 0.74,
    metalness: 0.05,
  });
  const pebblePalette = [
    new THREE.Color(0xe6dccb), // milky river quartz
    new THREE.Color(0xc29362), // warm ochre quartzite
    new THREE.Color(0x9a543a), // brick-red jasper
    new THREE.Color(0x524c45), // smooth dark basalt
    new THREE.Color(0xb6a48b), // weathered sandstone clast
    new THREE.Color(0x7c7163), // grey river chert
  ];
  const pebbleCount = 64;
  const pebbleInst = new THREE.InstancedMesh(pebbleGeo, pebbleMat, pebbleCount);
  for (let i = 0; i < pebbleCount; i++) {
    // Golden-angle spiral distribution across top plateau & sloped shoulder
    const u = (i + 0.5) / pebbleCount;
    const radial = Math.sqrt(u) * 0.90;
    const ang = i * 2.3999632 + 0.42;
    const ux = Math.cos(ang) * radial;
    const uz = Math.sin(ang) * radial;
    const px = ux * stoneW * 0.45;
    const pz = uz * stoneD * 0.45;
    // Match createSculptedMarkerStoneGeometry dome profile
    const edgeFall = Math.max(0, 1 - radial * radial * 0.65);
    const py = stoneBaseY + stoneH * (0.58 + 0.38 * edgeFall);
    const pr = 0.020 + ((i * 17) % 11) * 0.0024;
    _v3.set(px, py, pz);
    _q.setFromEuler(
      _e.set(
        (Math.sin(i * 3.1) * 0.35),
        ang + i * 0.7,
        (Math.cos(i * 2.7) * 0.35),
      ),
    );
    _s.set(pr * 1.25, pr * 0.52, pr * 0.98);
    _m4.compose(_v3, _q, _s);
    pebbleInst.setMatrixAt(i, _m4);
    pebbleInst.setColorAt(i, pebblePalette[(i * 5 + 2) % pebblePalette.length]);
  }
  pebbleInst.instanceMatrix.needsUpdate = true;
  if (pebbleInst.instanceColor) pebbleInst.instanceColor.needsUpdate = true;
  pebbleInst.castShadow = true;
  pebbleInst.receiveShadow = true;
  pebbleInst.userData.nonCollidable = true;

  // Ritual Offerings Resting on Top of the Marker Stone: Gold-Leaf Foil (Varq), Kumkum Tilak & Loose Petals
  const goldFoilMat = new THREE.MeshStandardMaterial({
    color: 0xffd262,
    emissive: 0x3b2202,
    emissiveIntensity: 0.25,
    roughness: 0.22,
    metalness: 0.92,
  });
  const foilPatches: Array<[number, number, number, number, number]> = [
    [-0.08, 0.566, 0.02, 0.11, 0.075],
    [0.06, 0.568, -0.04, 0.085, 0.068],
    [0.01, 0.565, 0.09, 0.07, 0.055],
    [-0.19, 0.556, -0.05, 0.055, 0.045],
    [0.18, 0.558, 0.06, 0.06, 0.048],
  ];
  for (let i = 0; i < foilPatches.length; i++) {
    const [fx, fy, fz, fw, fd] = foilPatches[i];
    const foil = new THREE.Mesh(new THREE.CylinderGeometry(fw, fw * 0.9, 0.004, 7), goldFoilMat);
    foil.position.set(fx, fy, fz);
    foil.rotation.y = i * 0.85;
    foil.scale.set(1.0, 1.0, fd / fw);
    foil.userData.nonCollidable = true;
    markerSanctum.add(foil);
  }
  const kumkumMat = new THREE.MeshStandardMaterial({ color: 0xc93b1a, roughness: 0.92, metalness: 0.02 });
  for (const [kx, ky, kz, kr] of [
    [-0.02, 0.568, 0.01, 0.036],
    [0.12, 0.562, 0.03, 0.024],
    [-0.14, 0.560, 0.05, 0.022],
  ] as Array<[number, number, number, number]>) {
    const kum = new THREE.Mesh(new THREE.CylinderGeometry(kr, kr * 1.15, 0.005, 10), kumkumMat);
    kum.position.set(kx, ky, kz);
    kum.userData.nonCollidable = true;
    markerSanctum.add(kum);
  }

  // 4 Sculpted Hammered Brass Kalash Offering Vessels at the Corners (with Dark Water & Floating Blossom)
  const kalashProfile = [
    new THREE.Vector2(0.001, 0.0),
    new THREE.Vector2(0.048, 0.0),
    new THREE.Vector2(0.054, 0.012),
    new THREE.Vector2(0.040, 0.024),
    new THREE.Vector2(0.076, 0.052),
    new THREE.Vector2(0.088, 0.082),
    new THREE.Vector2(0.066, 0.110),
    new THREE.Vector2(0.056, 0.125),
    new THREE.Vector2(0.082, 0.145),
    new THREE.Vector2(0.078, 0.150),
    new THREE.Vector2(0.052, 0.128),
  ];
  const kalashGeo = new THREE.LatheGeometry(kalashProfile, 22);
  kalashGeo.computeVertexNormals();
  const offeringWaterMat = new THREE.MeshStandardMaterial({
    color: 0x2a1c11,
    roughness: 0.12,
    metalness: 0.18,
  });
  const offeringPetalMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.58 });
  for (const [ox, oz] of [[-0.75, 0.50], [0.75, 0.50], [-0.75, -0.50], [0.75, -0.50]] as Array<[number, number]>) {
    const vessel = new THREE.Mesh(kalashGeo, mats.giltGoldMat);
    vessel.position.set(ox, 0.30, oz);
    vessel.castShadow = true;
    vessel.receiveShadow = true;
    const waterDisc = new THREE.Mesh(new THREE.CircleGeometry(0.064, 14), offeringWaterMat);
    waterDisc.rotation.x = -Math.PI * 0.5;
    waterDisc.position.set(ox, 0.432, oz);
    const floatFlower = new THREE.Mesh(createMarigoldFloretGeometry(0.028), offeringPetalMat);
    floatFlower.position.set(ox, 0.440, oz);
    markerSanctum.add(vessel, waterDisc, floatFlower);
  }

  // Lush Braided Garland of 128 Ruffled Marigolds, Jasmine Buds & 4 Sculpted Lotus Blossoms
  const marigoldGeo = createMarigoldFloretGeometry(0.048);
  const marigoldMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.62, metalness: 0.02 });
  const marigoldTints = [
    new THREE.Color(0xf97316), // rich marigold orange
    new THREE.Color(0xfacc15), // golden yellow
    new THREE.Color(0xfb923c), // warm saffron
    new THREE.Color(0xea580c), // deep tangerine
  ];
  const marigoldCount = 128;
  const marigoldInst = new THREE.InstancedMesh(marigoldGeo, marigoldMat, marigoldCount);
  for (let i = 0; i < marigoldCount; i++) {
    const ringLayer = i % 2;
    const t = (i / marigoldCount) * Math.PI * 2;
    const radialJitter = (ringLayer === 0 ? -0.022 : 0.026) + Math.sin(t * 9) * 0.008;
    const gx = Math.cos(t) * (0.72 + radialJitter);
    const gz = Math.sin(t) * (0.50 + radialJitter * 0.85);
    const gy = 0.368 + (ringLayer === 0 ? 0.016 : 0.002) + Math.abs(Math.sin(t * 7)) * 0.014;
    _v3.set(gx, gy, gz);
    _q.setFromEuler(_e.set(Math.sin(t * 3) * 0.25, t, Math.cos(t * 4) * 0.22));
    const sc = 0.88 + ((i * 7) % 5) * 0.07;
    _s.set(sc, sc * 0.82, sc);
    _m4.compose(_v3, _q, _s);
    marigoldInst.setMatrixAt(i, _m4);
    marigoldInst.setColorAt(i, marigoldTints[i % marigoldTints.length]);
  }
  marigoldInst.instanceMatrix.needsUpdate = true;
  if (marigoldInst.instanceColor) marigoldInst.instanceColor.needsUpdate = true;
  marigoldInst.castShadow = true;
  marigoldInst.userData.nonCollidable = true;

  // Fresh White Jasmine Buds & Scattered Loose Petals on Stone Shoulder
  const jasmineGeo = new THREE.OctahedronGeometry(0.017, 1);
  const jasmineMat = new THREE.MeshStandardMaterial({ color: 0xfef8ea, roughness: 0.55 });
  const jasmineCount = 32;
  const jasmineInst = new THREE.InstancedMesh(jasmineGeo, jasmineMat, jasmineCount);
  for (let i = 0; i < jasmineCount; i++) {
    const t = (i / jasmineCount) * Math.PI * 2 + 0.08;
    _v3.set(Math.cos(t) * 0.70, 0.388 + (i % 2) * 0.01, Math.sin(t) * 0.48);
    _q.setFromEuler(_e.set(i * 0.5, t, 0));
    _s.set(1.0, 1.35, 1.0);
    _m4.compose(_v3, _q, _s);
    jasmineInst.setMatrixAt(i, _m4);
  }
  jasmineInst.instanceMatrix.needsUpdate = true;
  jasmineInst.userData.nonCollidable = true;

  // 4 Sculpted Sacred Multi-Petal Lotus Offerings at Cardinal N/S/E/W
  const lotusOfferPetalGeo = createCarvedLotusPetalGeometry(0.036, 0.068, 0.016);
  const lotusPinkMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.48 });
  const lotusCenterMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.45 });
  for (const [lx, lz] of [[0, 0.49], [0, -0.49], [0.71, 0], [-0.71, 0]] as Array<[number, number]>) {
    const lotusGroup = new THREE.Group();
    lotusGroup.position.set(lx, 0.376, lz);
    const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.012, 0.018, 10), lotusCenterMat);
    pod.position.y = 0.012;
    lotusGroup.add(pod);
    for (let ring = 0; ring < 2; ring++) {
      const petals = ring === 0 ? 8 : 6;
      const tilt = ring === 0 ? 1.05 : 0.62;
      const rad = ring === 0 ? 0.022 : 0.015;
      for (let p = 0; p < petals; p++) {
        const a = (p / petals) * Math.PI * 2 + ring * 0.4;
        const petal = new THREE.Mesh(lotusOfferPetalGeo, lotusPinkMat);
        petal.position.set(Math.cos(a) * rad, 0.008, Math.sin(a) * rad);
        petal.rotation.order = 'YXZ';
        petal.rotation.y = -a + Math.PI * 0.5;
        petal.rotation.x = tilt;
        lotusGroup.add(petal);
      }
    }
    markerSanctum.add(lotusGroup);
  }

  // Crystal-Clear Museum Protective Tempered-Glass Enclosure + Stepped Brass Posts & Glass Clamps
  const barrierW = 2.46;
  const barrierD = 1.94;
  const barrierH = 1.12;
  const barrierY = 0.27 + barrierH * 0.5;
  const temperedGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0xf4fbff,
    transparent: true,
    opacity: 0.09,
    roughness: 0.04,
    metalness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    side: THREE.FrontSide,
    depthWrite: false,
  });
  for (const [px, pz, pw, pd] of [
    [0, -barrierD * 0.5, barrierW - 0.08, 0.022],
    [0, barrierD * 0.5, barrierW - 0.08, 0.022],
    [-barrierW * 0.5, 0, 0.022, barrierD - 0.08],
    [barrierW * 0.5, 0, 0.022, barrierD - 0.08],
  ] as Array<[number, number, number, number]>) {
    const pane = new THREE.Mesh(new THREE.BoxGeometry(pw, barrierH, pd), temperedGlassMat);
    pane.position.set(px, barrierY, pz);
    pane.renderOrder = 3;
    pane.userData.nonCollidable = true;
    const baseChannel = new THREE.Mesh(
      new THREE.BoxGeometry(pw > pd ? pw : 0.046, 0.042, pd > pw ? pd : 0.046),
      mats.warmBronzeMat,
    );
    baseChannel.position.set(px, 0.29, pz);
    markerSanctum.add(pane, baseChannel);
  }
  // Turned stepped brass corner posts, machined glass clamps, lotus finials & 4 corner pin-spot heads
  const postProfile = [
    new THREE.Vector2(0.001, 0.0),
    new THREE.Vector2(0.056, 0.0),
    new THREE.Vector2(0.056, 0.04),
    new THREE.Vector2(0.040, 0.07),
    new THREE.Vector2(0.032, 0.12),
    new THREE.Vector2(0.030, barrierH + 0.04),
    new THREE.Vector2(0.044, barrierH + 0.07),
    new THREE.Vector2(0.026, barrierH + 0.10),
    new THREE.Vector2(0.042, barrierH + 0.14),
    new THREE.Vector2(0.016, barrierH + 0.19),
    new THREE.Vector2(0.001, barrierH + 0.22),
  ];
  const turnedPostGeo = new THREE.LatheGeometry(postProfile, 16);
  const spotHousingMat = new THREE.MeshStandardMaterial({ color: 0x2c241d, roughness: 0.35, metalness: 0.82 });
  const spotLensMat = new THREE.MeshStandardMaterial({
    color: 0xfff0c8,
    emissive: 0xffc668,
    emissiveIntensity: 1.9,
    roughness: 0.2,
  });
  const _spotDummy = new THREE.Object3D();
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const px = sx * barrierW * 0.5;
      const pz = sz * barrierD * 0.5;
      const post = new THREE.Mesh(turnedPostGeo, mats.giltGoldMat);
      post.position.set(px, 0.27, pz);
      post.castShadow = true;
      markerSanctum.add(post);

      // Upper & lower machined brass glass-clamp brackets
      for (const cy of [0.50, 1.24]) {
        const clampX = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.045, 0.046), mats.warmBronzeMat);
        clampX.position.set(px - sx * 0.04, cy, pz);
        const clampZ = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.045, 0.09), mats.warmBronzeMat);
        clampZ.position.set(px, cy, pz - sz * 0.04);
        markerSanctum.add(clampX, clampZ);
      }

      // Miniature angled corner museum pin-spot fixture aimed directly at the Marker Stone
      const pinSpot = new THREE.Group();
      pinSpot.position.set(px - sx * 0.07, 0.27 + barrierH + 0.02, pz - sz * 0.07);
      _spotDummy.position.copy(pinSpot.position);
      _spotDummy.lookAt(0, 0.48, 0);
      pinSpot.quaternion.copy(_spotDummy.quaternion);
      const can = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.075, 10), spotHousingMat);
      can.rotation.x = Math.PI * 0.5;
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.020, 10), spotLensMat);
      lens.position.z = 0.039;
      pinSpot.add(can, lens);
      markerSanctum.add(pinSpot);
    }
  }
  // Soft recessed warm-amber interior case cove strips tucked cleanly inward beneath bronze baffle (zero white line under glass)
  const caseDisplayLedMat = new THREE.MeshStandardMaterial({
    color: 0xffa838,
    emissive: 0xff8c1a,
    emissiveIntensity: 0.72,
    roughness: 0.35,
  });
  for (const [lx, lz, lsx, lsz] of [
    [0, -barrierD * 0.5 + 0.105, barrierW - 0.30, 0.020],
    [0, barrierD * 0.5 - 0.105, barrierW - 0.30, 0.020],
  ] as Array<[number, number, number, number]>) {
    const ledStrip = new THREE.Mesh(new THREE.BoxGeometry(lsx, 0.014, lsz), caseDisplayLedMat);
    ledStrip.position.set(lx, 0.276, lz);
    markerSanctum.add(ledStrip);
  }
  markerSanctum.add(
    markerOuterChamber,
    markerBrickRim,
    markerSunkenWell,
    sanctumBrickInst,
    markerStoneBaseSlab,
    markerGoldBorder,
    bezelBeadInst,
    markerStone,
    pebbleInst,
    marigoldInst,
    jasmineInst,
  );
  group.add(markerSanctum);

  // 7B. Museum-Grade Carved 3D Nativity Stele Ensemble (x = 0, z = -3.45)
  const craftMats = {
    chunarStoneMat: mats.chunarStoneMat,
    giltGoldMat: mats.giltGoldMat,
    warmBronzeMat: mats.warmBronzeMat,
    darkMetalMat: mats.darkMetalMat,
    timberMat: mats.timberMat,
    brickMat: mats.brickMat,
    flameGlowMat: mats.flameGlowMat,
  };
  const reliefAltar = buildDetailedNativitySteleEnsemble(lTex, craftMats);
  reliefAltar.position.set(0, 0.0, -3.45);
  reliefAltar.scale.setScalar(1.16);
  const diyoL = createDetailedBrassSukundaDiyo(mats.giltGoldMat, mats.warmBronzeMat, mats.flameGlowMat, 0.68, true);
  diyoL.position.set(-1.26, 0.87, 0.34);
  const diyoR = createDetailedBrassSukundaDiyo(mats.giltGoldMat, mats.warmBronzeMat, mats.flameGlowMat, 0.68, true);
  diyoR.position.set(1.26, 0.87, 0.34);
  reliefAltar.add(diyoL, diyoR);
  group.add(reliefAltar);

  // =========================================================================
  // 8. DETAILED WOODEN OBSERVATION BOARDWALK, PILINGS, RAILINGS & 3 PLAQUES
  // =========================================================================
  const deckMat = new THREE.MeshStandardMaterial({
    map: lTex.salWoodMap,
    normalMap: lTex.salWoodNormal,
    normalScale: new THREE.Vector2(1.15, 1.15),
    roughnessMap: lTex.salWoodRough,
    roughness: 0.68,
    metalness: 0.06,
  });
  const salBeamMat = new THREE.MeshStandardMaterial({
    map: lTex.cofferTimberMap,
    normalMap: lTex.cofferTimberNormal,
    normalScale: new THREE.Vector2(1.2, 1.2),
    roughnessMap: lTex.cofferTimberRough,
    color: 0x5c3c24,
    roughness: 0.68,
    metalness: 0.05,
  });

  const addBoardwalkSlab = (cx: number, cz: number, sx: number, sz: number) => {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.18, sz), deckMat);
    slab.position.set(cx, walkY - 0.09, cz);
    slab.receiveShadow = true;
    slab.castShadow = true;
    group.add(slab);
    cameraOccluders.push(slab);
    const beam = new THREE.Mesh(new THREE.BoxGeometry(sx - 0.12, 0.16, sz - 0.12), salBeamMat);
    beam.position.set(cx, walkY - 0.26, cz);
    beam.userData.nonCollidable = true;
    group.add(beam);
  };
  const innerSpanW = W - wallT * 2;
  const innerSpanD = D - wallT * 2;
  const aisleX = innerSpanW * 0.5 - pitHalfW;
  const aisleZ = innerSpanD * 0.5 - pitHalfD;
  addBoardwalkSlab(0, -(pitHalfD + aisleZ * 0.5), innerSpanW, aisleZ);
  addBoardwalkSlab(0, pitHalfD + aisleZ * 0.5, innerSpanW, aisleZ);
  addBoardwalkSlab(-(pitHalfW + aisleX * 0.5), 0, aisleX, pitHalfD * 2);
  addBoardwalkSlab(pitHalfW + aisleX * 0.5, 0, aisleX, pitHalfD * 2);

  // Heavy Timber Support Pilings + Sandstone Footings descending from boardwalk to trenchFloorY (-0.60m)
  const pilingPositions: Array<[number, number]> = [
    [-pitHalfW, -pitHalfD],
    [-4.5, -pitHalfD],
    [0, -pitHalfD],
    [4.5, -pitHalfD],
    [pitHalfW, -pitHalfD],
    [-pitHalfW, pitHalfD],
    [-4.5, pitHalfD],
    [0, pitHalfD],
    [4.5, pitHalfD],
    [pitHalfW, pitHalfD],
    [-pitHalfW, 0],
    [pitHalfW, 0],
  ];
  const pilingH = walkY - 0.18 - trenchFloorY;
  const pilingGeo = new THREE.BoxGeometry(0.24, pilingH, 0.24);
  const footingGeo = new THREE.BoxGeometry(0.42, 0.18, 0.42);
  const pilingInst = new THREE.InstancedMesh(pilingGeo, salBeamMat, pilingPositions.length);
  const pilingFootInst = new THREE.InstancedMesh(footingGeo, mats.chunarStoneMat, pilingPositions.length);
  pilingPositions.forEach(([px, pz], idx) => {
    _q.identity();
    _s.setScalar(1);
    _v3.set(px, trenchFloorY + pilingH * 0.5, pz);
    _m4.compose(_v3, _q, _s);
    pilingInst.setMatrixAt(idx, _m4);

    _v3.set(px, trenchFloorY + 0.09, pz);
    _m4.compose(_v3, _q, _s);
    pilingFootInst.setMatrixAt(idx, _m4);
  });
  pilingInst.instanceMatrix.needsUpdate = true;
  pilingFootInst.instanceMatrix.needsUpdate = true;
  pilingInst.castShadow = true;
  pilingInst.userData.nonCollidable = true;
  pilingFootInst.userData.nonCollidable = true;
  group.add(pilingInst, pilingFootInst);

  // Beveled boardwalk edge bronze fascia + recessed under-slab cove LEDs (prevents white Z-fighting line under glass)
  const underRailLedMat = new THREE.MeshStandardMaterial({
    color: 0xffa63b,
    emissive: 0xff8c1a,
    emissiveIntensity: 0.45,
    roughness: 0.42,
  });
  const railHeight = 0.90;
  for (const [cx, cz, sx, sz] of [
    [0, -pitHalfD, pitHalfW * 2, 0.12],
    [0, pitHalfD, pitHalfW * 2, 0.12],
    [-pitHalfW, 0, 0.12, pitHalfD * 2 - 0.16],
    [pitHalfW, 0, 0.12, pitHalfD * 2 - 0.16],
  ] as Array<[number, number, number, number]>) {
    const isNS = sx > sz;
    const spanLen = isNS ? sx : sz;
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.075, sz), mats.warmBronzeMat);
    topBar.position.set(cx, walkY + railHeight, cz);
    const botTrim = new THREE.Mesh(
      new THREE.BoxGeometry(isNS ? spanLen - 0.04 : 0.14, 0.07, isNS ? 0.14 : spanLen - 0.04),
      salBeamMat,
    );
    botTrim.position.set(cx, walkY + 0.035, cz);

    const glassH = railHeight - 0.11;
    // Segment glass panels cleanly between stanchions so glass never cuts through brass posts
    const segCenters = isNS
      ? [-7.5, -4.5, -1.5, 1.5, 4.5, 7.5]
      : [-4.2, -1.4, 1.4, 4.2];
    const segLen = isNS ? 2.92 : 2.72;
    for (const segOff of segCenters) {
      const glassPanel = new THREE.Mesh(
        new THREE.BoxGeometry(isNS ? segLen : 0.028, glassH, isNS ? 0.028 : segLen),
        temperedGlassMat,
      );
      glassPanel.position.set(isNS ? segOff : cx, walkY + 0.068 + glassH * 0.5, isNS ? cz : segOff);
      glassPanel.renderOrder = 3;
      glassPanel.userData.nonCollidable = true;
      group.add(glassPanel);
    }

    // Opaque bronze rim fascia cleanly capping the boardwalk slab edge (y: 0.818 .. 1.002)
    const rimSign = isNS ? -Math.sign(cz) : -Math.sign(cx);
    const fascia = new THREE.Mesh(
      new THREE.BoxGeometry(isNS ? spanLen - 0.08 : 0.042, 0.184, isNS ? 0.042 : spanLen - 0.08),
      mats.warmBronzeMat,
    );
    fascia.position.set(
      isNS ? cx : cx - rimSign * 0.022,
      walkY - 0.09,
      isNS ? cz - rimSign * 0.022 : cz,
    );
    fascia.userData.nonCollidable = true;

    // Warm downward-facing amber cove strip tucked cleanly underneath slab overhang (behind fascia edge)
    const ledUnder = new THREE.Mesh(
      new THREE.BoxGeometry(isNS ? spanLen - 0.44 : 0.034, 0.016, isNS ? 0.034 : spanLen - 0.44),
      underRailLedMat,
    );
    ledUnder.position.set(
      isNS ? cx : cx - rimSign * 0.045,
      walkY - 0.195,
      isNS ? cz - rimSign * 0.045 : cz,
    );
    ledUnder.userData.nonCollidable = true;
    group.add(topBar, botTrim, fascia, ledUnder);
  }
  // Railing brass stanchions
  for (const [px, pz] of [
    ...[-9, -6, -3, 0, 3, 6, 9].map((x): [number, number] => [x, -pitHalfD]),
    ...[-9, -6, -3, 0, 3, 6, 9].map((x): [number, number] => [x, pitHalfD]),
    ...[-2.8, 0, 2.8].map((z): [number, number] => [-pitHalfW, z]),
    ...[-2.8, 0, 2.8].map((z): [number, number] => [pitHalfW, z]),
  ]) {
    const stanchion = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.034, railHeight, 8), mats.warmBronzeMat);
    stanchion.position.set(px, walkY + railHeight * 0.5, pz);
    stanchion.userData.nonCollidable = true;
    group.add(stanchion);
  }

  // Interior Gallery Wall Articulation: warm sanctuary cream plaster above wood dado + pilasters + wall sconces
  const wallInnerX = W * 0.5 - wallT;
  const wallInnerZ = D * 0.5 - wallT;
  const warmPlasterMat = new THREE.MeshStandardMaterial({
    map: lTex.stuccoWhiteMap,
    normalMap: lTex.stuccoWhiteNormal,
    normalScale: new THREE.Vector2(0.45, 0.45),
    color: 0xeadbc4,
    roughness: 0.90,
    metalness: 0.01,
  });
  const dadoH = 1.38;
  const plasterH = lowerH - (walkY + dadoH); // 1.87m — stops cleanly at clerestory sill (lowerH = 4.25m)
  for (const [dx, dz, dsx, dsz] of [
    [0, -wallInnerZ + 0.04, innerSpanW, 0.08],
    [-(doorHalfW + (innerSpanW * 0.5 - doorHalfW) * 0.5), wallInnerZ - 0.04, innerSpanW * 0.5 - doorHalfW, 0.08],
    [doorHalfW + (innerSpanW * 0.5 - doorHalfW) * 0.5, wallInnerZ - 0.04, innerSpanW * 0.5 - doorHalfW, 0.08],
    [-wallInnerX + 0.04, 0, 0.08, innerSpanD - 0.162],
    [wallInnerX - 0.04, 0, 0.08, innerSpanD - 0.162],
  ] as Array<[number, number, number, number]>) {
    const dado = new THREE.Mesh(new THREE.BoxGeometry(dsx, dadoH, dsz), salBeamMat);
    dado.position.set(dx, walkY + dadoH * 0.5, dz);
    dado.receiveShadow = true;
    dado.userData.nonCollidable = true;

    const plaster = new THREE.Mesh(
      new THREE.BoxGeometry(
        dsx > dsz ? dsx : 0.04,
        plasterH,
        dsz > dsx ? dsz : 0.04,
      ),
      warmPlasterMat,
    );
    plaster.position.set(
      dx === -wallInnerX + 0.04 ? -wallInnerX + 0.032 : dx === wallInnerX - 0.04 ? wallInnerX - 0.032 : dx,
      walkY + dadoH + plasterH * 0.5,
      dz === -wallInnerZ + 0.04 ? -wallInnerZ + 0.032 : dz === wallInnerZ - 0.04 ? wallInnerZ - 0.032 : dz,
    );
    plaster.receiveShadow = true;
    plaster.userData.nonCollidable = true;
    group.add(dado, plaster);
  }
  const wallLanternFlames: THREE.Object3D[] = [];
  const pilH = lowerH - walkY - 0.12;
  for (const px of [-12.0, -6.0, 0, 6.0, 12.0]) {
    const pil = new THREE.Mesh(new THREE.BoxGeometry(0.36, pilH, 0.16), mats.stuccoWhiteMat);
    pil.position.set(px, walkY + pilH * 0.5, -wallInnerZ + 0.06);
    pil.userData.nonCollidable = true;
    const pilBase = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.20, 0.22), mats.stuccoWhiteMat);
    pilBase.position.set(px, walkY + 0.10, -wallInnerZ + 0.08);
    pilBase.userData.nonCollidable = true;
    const pilCap = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.16, 0.24), mats.stuccoWhiteMat);
    pilCap.position.set(px, lowerH - 0.09, -wallInnerZ + 0.09);
    pilCap.userData.nonCollidable = true;

    const wallLantern = buildDetailedSanctuaryWallLantern({
      giltGoldMat: mats.giltGoldMat,
      warmBronzeMat: mats.warmBronzeMat,
      darkMetalMat: mats.darkMetalMat,
      flameGlowMat: mats.flameGlowMat,
    });
    wallLantern.group.position.set(px, walkY + 2.24, -wallInnerZ + 0.14);
    wallLanternFlames.push(wallLantern.flameGroup);
    group.add(pil, pilBase, pilCap, wallLantern.group);
  }
  for (const side of [-1, 1]) {
    const innerSalTrim = new THREE.Mesh(new THREE.BoxGeometry(0.18, doorH - 1.08, 0.14), salDoorMat);
    innerSalTrim.position.set(side * (doorHalfW + 0.06), 1.01 + (doorH - 1.08) * 0.5, D * 0.5 - wallT - 0.07);
    innerSalTrim.userData.nonCollidable = true;
    group.add(innerSalTrim);
  }

  // 3 Interactive Museum History Plaques along the Observation Railing
  const createMuseumPlaquePedestal = (
    lx: number,
    lz: number,
    rotY: number,
    plaqueTex: THREE.CanvasTexture,
    highlightKey: 'markerStone' | 'mauryanChambers' | 'nativityRelief',
  ) => {
    const pGroup = new THREE.Group();
    pGroup.position.set(lx, walkY, lz);
    pGroup.rotation.y = rotY;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.055, 0.96, 10), mats.warmBronzeMat);
    post.position.y = 0.48;
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.06, 12), mats.warmBronzeMat);
    collar.position.y = 0.03;

    const frameGroup = new THREE.Group();
    frameGroup.position.set(0, 1.00, 0);
    frameGroup.rotation.x = -0.58;
    const backing = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.56, 0.05), mats.giltGoldMat);
    const faceMat = new THREE.MeshStandardMaterial({
      map: plaqueTex,
      roughness: 0.36,
      metalness: 0.18,
      emissive: 0x1e1608,
      emissiveIntensity: 0.32,
    });
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.49), faceMat);
    face.position.z = 0.028;

    const hitTarget = new THREE.Mesh(
      new THREE.BoxGeometry(0.98, 0.72, 0.32),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    hitTarget.layers.set(2);
    hitTarget.userData.mayaDeviPlaqueKey = highlightKey;
    hitTarget.userData.nonCollidable = true;
    plaqueHitTargets.push({ mesh: hitTarget, highlightKey });

    frameGroup.add(backing, face, hitTarget);
    pGroup.add(post, collar, frameGroup);
    group.add(pGroup);
  };
  createMuseumPlaquePedestal(0.0, pitHalfD + 0.08, 0, lTex.plaqueMarkerMap, 'markerStone');
  createMuseumPlaquePedestal(pitHalfW + 0.08, 0.0, Math.PI * 0.5, lTex.plaqueChambersMap, 'mauryanChambers');
  createMuseumPlaquePedestal(0.0, -pitHalfD - 0.08, Math.PI, lTex.plaqueNativityMap, 'nativityRelief');

  // =========================================================================
  // 9. COZY RITUAL PROPS: BUTTER LAMPS, INCENSE BURNER SMOKE & PRAYER CUSHIONS
  // =========================================================================
  const cornerLampRig = new THREE.Group();
  cornerLampRig.userData.noMerge = true;
  cornerLampRig.userData.nonCollidable = true;
  const cornerLamps: THREE.Object3D[] = [...extraLampFlames];
  for (const diyo of [diyoL, diyoR]) {
    const dFlame = diyo.userData.flameGroup as THREE.Object3D | undefined;
    if (dFlame) {
      dFlame.userData.baseScale = dFlame.scale.x || 1.0;
      cornerLamps.push(dFlame);
    }
  }
  const cornerSpecs: Array<[number, number]> = [
    [-8.4, -4.9],
    [8.4, -4.9],
    [-8.4, 4.9],
    [8.4, 4.9],
  ];
  cornerSpecs.forEach(([lx, lz], idx) => {
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.42, 12), mats.warmBronzeMat);
    ped.position.set(lx, walkY + 0.21, lz);
    const lamp = createDetailedBrassSukundaDiyo(mats.giltGoldMat, mats.warmBronzeMat, mats.flameGlowMat, 0.68, true);
    lamp.position.set(lx, walkY + 0.42, lz);
    lamp.userData.nonCollidable = true;
    cornerLampRig.add(ped, lamp);
    const flame = lamp.userData.flameGroup as THREE.Object3D | undefined;
    if (flame) {
      flame.userData.baseScale = flame.scale.x || 1.0;
      cornerLamps.push(flame);
    }

    const lgt = new THREE.PointLight(0xffb454, 1.55, 13.0, 1.4);
    lgt.position.set(lx, walkY + 0.85, lz);
    lgt.userData.flickerPhase = idx * 1.65;
    lgt.userData.flickerAmp = 0.20;
    lgt.userData.intensityScale = 1.55;
    lgt.userData.warmFlicker = true;
    lgt.userData.interiorSanctum = true;
    beaconLights.push(lgt);
    cornerLampRig.add(lgt);
  });

  // Ornate Tiered Nepali/Tibetan Choe-sham Butter Lamp Offering Altar on NE Gallery
  const butterTrayGroup = buildDetailedButterLampAltar(lTex, craftMats, cornerLamps, beaconLights);
  butterTrayGroup.position.set(6.2, walkY, -6.65);
  cornerLampRig.add(butterTrayGroup);

  // Carved Bronze Incense Burner (Dhupauro) on NW Gallery + Custom GLSL Rising Smoke Wisps
  const incenseGroup = buildDetailedDhupauroIncenseBurner(craftMats);
  incenseGroup.position.set(-6.4, walkY, -6.55);
  cornerLampRig.add(incenseGroup);

  const smokeCount = 26;
  const smokePos = new Float32Array(smokeCount * 3);
  const smokeSeed = new Float32Array(smokeCount);
  for (let i = 0; i < smokeCount; i++) {
    smokePos[i * 3] = -6.4;
    smokePos[i * 3 + 1] = walkY + 1.12 + (i / smokeCount) * 2.2;
    smokePos[i * 3 + 2] = -6.55;
    smokeSeed[i] = i * 0.47;
  }
  const smokeGeo = new THREE.BufferGeometry();
  smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePos, 3));
  smokeGeo.setAttribute('aSeed', new THREE.BufferAttribute(smokeSeed, 1));
  const smokeUniforms = { uTime: { value: 0 } };
  const smokeMat = new THREE.ShaderMaterial({
    uniforms: smokeUniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: `
      attribute float aSeed;
      uniform float uTime;
      varying float vAlpha;
      varying float vLife;
      varying float vRot;
      void main() {
        float life = fract(aSeed * 0.19 + uTime * 0.18);
        vLife = life;
        vRot = aSeed + life * 1.9;
        vec3 p = position;
        p.y = ${(walkY + 1.12).toFixed(2)} + pow(life, 0.88) * 2.25;
        float swirlT = uTime * 1.2 + aSeed + life * 5.0;
        float spread = 0.02 + pow(life, 1.1) * 0.22;
        p.x += (sin(swirlT) + 0.42 * sin(swirlT * 1.85)) * spread;
        p.z += (cos(swirlT * 0.92) + 0.42 * cos(swirlT * 1.7)) * spread;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = clamp((38.0 + pow(life, 0.78) * 86.0) / max(1.0, -mv.z), 4.0, 34.0);
        vAlpha = smoothstep(0.0, 0.14, life) * pow(1.0 - smoothstep(0.22, 1.0, life), 1.32) * 0.28;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      varying float vLife;
      varying float vRot;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float c = cos(vRot);
        float s = sin(vRot);
        vec2 rotUv = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);
        vec2 q = vec2(rotUv.x * 1.35, rotUv.y * 0.84);
        q += 0.095 * vec2(sin(q.y * 8.5 + vLife * 6.0), cos(q.x * 7.5 - vLife * 5.0));
        float dist = length(q) * 2.0;
        if (dist > 0.95) discard;
        float radial = pow(smoothstep(0.94, 0.06, dist), 1.4);
        float filament = 0.65 + 0.35 * sin(q.x * 10.5 + q.y * 7.0 + vLife * 5.2) * cos(q.y * 9.0 - q.x * 5.5 - vLife * 4.1);
        vec3 col = mix(vec3(0.76, 0.81, 0.87), vec3(0.98, 0.88, 0.68), (1.0 - smoothstep(0.0, 0.5, vLife)) * 0.65);
        float alpha = radial * filament * vAlpha;
        if (alpha < 0.005) discard;
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });
  const incenseSmoke = new THREE.Points(smokeGeo, smokeMat);
  incenseSmoke.frustumCulled = false;
  incenseSmoke.userData.noMerge = true;
  incenseSmoke.userData.nonCollidable = true;
  group.add(incenseSmoke);

  // Quilted Himalayan Prayer Cushion Meditation Stations & Choktse Side Tables along West Gallery
  const meditationGallery = buildMeditationGalleryEnsemble(lTex, craftMats, walkY);
  group.add(meditationGallery);

  // =========================================================================
  // 10. COFFERED TIMBER CEILING, TRACK SPOTLIGHTS & VOLUMETRIC GOD RAYS
  // =========================================================================
  // Note: Roof slab bottom sits at y = 6.07. Place coffered soffit panels cleanly BELOW at y = 6.01!
  const ceilingGroup = new THREE.Group();
  ceilingGroup.userData.nonCollidable = true;
  const acousticMat = new THREE.MeshStandardMaterial({
    map: lTex.cofferTimberMap,
    normalMap: lTex.cofferTimberNormal,
    roughnessMap: lTex.cofferTimberRough,
    color: 0x563925,
    roughness: 0.86,
    metalness: 0.02,
  });

  const addCeilingSoffit = (cx: number, cz: number, sx: number, sz: number) => {
    const soffit = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.08, sz), acousticMat);
    soffit.position.set(cx, 6.01, cz);
    soffit.receiveShadow = true;
    ceilingGroup.add(soffit);
    cameraOccluders.push(soffit);
  };
  addCeilingSoffit(0, -(skyHoleD * 0.5 + sideRoofZ * 0.5), innerSpanW, sideRoofZ - wallT);
  addCeilingSoffit(0, skyHoleD * 0.5 + sideRoofZ * 0.5, innerSpanW, sideRoofZ - wallT);
  addCeilingSoffit(-(skyHoleW * 0.5 + sideRoofX * 0.5), 0, sideRoofX - wallT, skyHoleD);
  addCeilingSoffit(skyHoleW * 0.5 + sideRoofX * 0.5, 0, sideRoofX - wallT, skyHoleD);

  // Coffered heavy primary crossbeams (N-S and E-W)
  for (const bx of [-13.5, -9.2, -4.6, 4.6, 9.2, 13.5]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.34, innerSpanD - 0.3), salBeamMat);
    beam.position.set(bx, 5.84, 0);
    beam.castShadow = true;
    ceilingGroup.add(beam);
  }
  for (const bz of [-8.8, -3.55, 3.55, 8.8]) {
    const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(innerSpanW - 0.3, 0.30, 0.32), salBeamMat);
    crossBeam.position.set(0, 5.86, bz);
    ceilingGroup.add(crossBeam);
  }
  // Secondary coffer rafters framing acoustic ceiling bays
  for (const bx of [-11.35, -6.9, 6.9, 11.35]) {
    const rafter = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, innerSpanD - 0.4), salBeamMat);
    rafter.position.set(bx, 5.93, 0);
    ceilingGroup.add(rafter);
  }
  for (const bz of [-6.15, 0, 6.15]) {
    for (const side of [-1, 1]) {
      const rafter = new THREE.Mesh(new THREE.BoxGeometry(sideRoofX - 0.9, 0.16, 0.14), salBeamMat);
      rafter.position.set(side * (skyHoleW * 0.5 + sideRoofX * 0.5 - 0.2), 5.93, bz);
      ceilingGroup.add(rafter);
    }
  }
  // Decorative coffered skylight well fascia collar
  for (const [fx, fz, sx, sz] of [
    [0, -skyHoleD * 0.5, skyHoleW + 0.32, 0.28],
    [0, skyHoleD * 0.5, skyHoleW + 0.32, 0.28],
    [-skyHoleW * 0.5, 0, 0.28, skyHoleD],
    [skyHoleW * 0.5, 0, 0.28, skyHoleD],
  ] as Array<[number, number, number, number]>) {
    const collar = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.50, sz), salBeamMat);
    collar.position.set(fx, 5.98, fz);
    ceilingGroup.add(collar);
  }

  // Suspended Black Museum Track-Spotlights aimed at Marker Stone, Nativity Stele & Mauryan Ruins
  const trackHalfW = 6.2;
  const trackHalfD = 4.6;
  const trackY = 5.62;
  for (const [tx, tz, sx, sz] of [
    [0, -trackHalfD, trackHalfW * 2, 0.08],
    [0, trackHalfD, trackHalfW * 2, 0.08],
    [-trackHalfW, 0, 0.08, trackHalfD * 2],
    [trackHalfW, 0, 0.08, trackHalfD * 2],
  ] as Array<[number, number, number, number]>) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.06, sz), mats.darkMetalMat);
    rail.position.set(tx, trackY, tz);
    ceilingGroup.add(rail);
  }
  const trackLensMat = new THREE.MeshStandardMaterial({
    color: 0xfff2cc,
    emissive: 0xffc66e,
    emissiveIntensity: 1.9,
    roughness: 0.2,
  });
  const spotSpecs: Array<{ pos: [number, number, number]; target: [number, number, number] }> = [
    { pos: [-4.2, trackY, trackHalfD], target: [0, 0.1, 0.65] },
    { pos: [0, trackY, trackHalfD], target: [0, 0.1, 0.65] },
    { pos: [4.2, trackY, trackHalfD], target: [0, 0.1, 0.65] },
    { pos: [-3.8, trackY, -trackHalfD], target: [0, 1.5, -3.45] },
    { pos: [0, trackY, -trackHalfD], target: [0, 1.7, -3.45] },
    { pos: [3.8, trackY, -trackHalfD], target: [0, 1.5, -3.45] },
    { pos: [-trackHalfW, trackY, -2.5], target: [-4.5, 0.1, -2.0] },
    { pos: [-trackHalfW, trackY, 0.5], target: [-4.5, 0.1, 0.8] },
    { pos: [-trackHalfW, trackY, 3.0], target: [-3.5, 0.1, 2.5] },
    { pos: [trackHalfW, trackY, -2.5], target: [4.5, 0.1, -2.0] },
    { pos: [trackHalfW, trackY, 0.5], target: [4.5, 0.1, 0.8] },
    { pos: [trackHalfW, trackY, 3.0], target: [3.5, 0.1, 2.5] },
  ];
  const _lookDummy = new THREE.Object3D();
  for (const sp of spotSpecs) {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.24, 6), mats.darkMetalMat);
    stem.position.set(sp.pos[0], sp.pos[1] - 0.10, sp.pos[2]);
    ceilingGroup.add(stem);

    const fixture = new THREE.Group();
    fixture.position.set(sp.pos[0], sp.pos[1] - 0.22, sp.pos[2]);
    _lookDummy.position.copy(fixture.position);
    _lookDummy.lookAt(sp.target[0], sp.target[1], sp.target[2]);
    fixture.quaternion.copy(_lookDummy.quaternion);

    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.082, 0.24, 12), mats.darkMetalMat);
    can.rotation.x = Math.PI * 0.5;
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.068, 12), trackLensMat);
    lens.position.z = 0.122;
    fixture.add(can, lens);
    ceilingGroup.add(fixture);
  }
  group.add(ceilingGroup);

  // Soft Custom GLSL Fresnel-Faded Volumetric God Rays (ZERO hard geometric edges!)
  const rayOuter = createVolumetricGodRayMaterial(0xffe2a4, 0.165, 2.25);
  const rayInner = createVolumetricGodRayMaterial(0xffebc2, 0.145, 2.65);
  const rayClerestory = createVolumetricGodRayMaterial(0xffe7ba, 0.095, 2.45);

  const outerShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(2.35, 4.45, 6.7, 32, 1, true),
    rayOuter.material,
  );
  outerShaft.position.set(0, 3.25, -0.25);
  outerShaft.renderOrder = 5;
  outerShaft.userData.nonCollidable = true;

  const innerShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(1.35, 2.55, 6.6, 28, 1, true),
    rayInner.material,
  );
  innerShaft.position.set(0, 3.22, -0.35);
  innerShaft.renderOrder = 6;
  innerShaft.userData.nonCollidable = true;
  group.add(outerShaft, innerShaft);

  // Soft angled daylight/moonlight rays entering through high clerestory windows
  const clerestoryBeamGeo = new THREE.CylinderGeometry(0.65, 1.75, 7.6, 20, 1, true);
  const clerestoryBeamSpecs: Array<{ pos: [number, number, number]; rot: [number, number, number] }> = [
    { pos: [-7.2, 3.45, 7.2], rot: [0.54, 0, -0.14] },
    { pos: [7.2, 3.45, 7.2], rot: [0.54, 0, 0.14] },
    { pos: [-12.6, 3.35, 0.0], rot: [0, 0, -0.58] },
    { pos: [12.6, 3.35, 0.0], rot: [0, 0, 0.58] },
  ];
  for (const cb of clerestoryBeamSpecs) {
    const shaft = new THREE.Mesh(clerestoryBeamGeo, rayClerestory.material);
    shaft.position.set(cb.pos[0], cb.pos[1], cb.pos[2]);
    shaft.rotation.set(cb.rot[0], cb.rot[1], cb.rot[2]);
    shaft.renderOrder = 5;
    shaft.userData.nonCollidable = true;
    group.add(shaft);
  }

  // Dual Atmospheric Particle Systems:
  // 1) Golden dust motes drifting specifically within the volumetric light shafts
  // 2) Fine floating dust / sacred pollen motes swirling around the 3 Nativity Statues & Marker Stone
  const atmosphereParticles = createSanctumAtmosphereParticles(clerestoryBeamSpecs);
  group.add(atmosphereParticles.group);

  for (let i = 0; i < cornerLamps.length; i++) {
    cornerLamps[i].userData.noMerge = true;
  }
  for (let i = 0; i < wallLanternFlames.length; i++) {
    wallLanternFlames[i].userData.noMerge = true;
  }

  cornerLampRig.userData.onFlickerUpdate = (t: number) => {
    for (let i = 0; i < cornerLamps.length; i++) {
      const flame = cornerLamps[i];
      const base = (flame.userData.baseScale as number) || 1.0;
      const sy = base * (1.0 + Math.sin(t * 8.4 + i * 1.9) * 0.055 + Math.sin(t * 14.3 + i) * 0.025);
      const sxz = base * (1.0 + Math.cos(t * 7.1 + i * 1.5) * 0.030);
      flame.scale.set(sxz, sy, sxz);
    }
    for (let i = 0; i < wallLanternFlames.length; i++) {
      const sy = 1.0 + Math.sin(t * 9.6 + i * 2.1) * 0.09 + Math.sin(t * 15.8 + i) * 0.04;
      const sxz = 1.0 + Math.cos(t * 7.8 + i * 1.4) * 0.05;
      wallLanternFlames[i].scale.set(sxz, sy, sxz);
    }
    atmosphereParticles.uniforms.uTime.value = t;
    smokeUniforms.uTime.value = t;
    rayOuter.uniforms.uTime.value = t;
    rayInner.uniforms.uTime.value = t;
    rayClerestory.uniforms.uTime.value = t;
  };
  group.add(cornerLampRig);
  animatedNodes.push(cornerLampRig);

  // =========================================================================
  // 11. BALANCED WARM SANCTUM KEY + WARM BOUNCE FILL LIGHTING (6-LIGHT POOL)
  // =========================================================================
  const sanctumLight = new THREE.PointLight(0xffcf87, 3.8, 28, 1.15);
  sanctumLight.position.set(0, 5.25, -0.45);
  sanctumLight.userData.intensityScale = 2.15;
  sanctumLight.userData.flickerAmp = 0.04;
  sanctumLight.userData.warmFlicker = true;
  sanctumLight.userData.interiorSanctum = true;
  beaconLights.push(sanctumLight);
  group.add(sanctumLight);

  const bounceFillLight = new THREE.PointLight(0xffb470, 2.35, 32, 1.05);
  bounceFillLight.position.set(0, 2.15, 0.75);
  bounceFillLight.userData.intensityScale = 1.65;
  bounceFillLight.userData.flickerAmp = 0.03;
  bounceFillLight.userData.warmFlicker = false;
  bounceFillLight.userData.interiorSanctum = true;
  beaconLights.push(bounceFillLight);
  group.add(bounceFillLight);

  const mayaDeviHighlights: Record<'markerStone' | 'mauryanChambers' | 'nativityRelief', MayaDeviHighlightInfo> = {
    markerStone: {
      title: 'The Sacred Marker Stone',
      subtitle: 'Birthplace Sanctum · UNESCO World Heritage Core',
      description:
        'Discovered during 1992–1996 excavations beneath the Maya Devi sanctum, this sunken conglomerate stone slab marks the exact birthplace of Siddhartha Gautama, framed by offerings and ancient brick chambers.',
      localPos: [0, 0.33, 0.65],
    },
    mauryanChambers: {
      title: 'Mauryan Brick Chambers (3rd Century BCE)',
      subtitle: 'Stratified Archaeological Excavation',
      description:
        'Stepped fired-brick walls descending 1.6 meters below the boardwalk reveal structural phases from the 3rd-century BCE Mauryan apsidal timber-and-brick shrine through Sunga and Kushan temple reconstructions.',
      localPos: [5.8, 0.0, 0.0],
    },
    nativityRelief: {
      title: 'The Nativity Sculpture',
      subtitle: 'Queen Maya Devi Grasping the Sal Tree Branch',
      description:
        'Carved sandstone stele depicting Queen Maya Devi grasping a blossoming Sal tree branch at Lumbini Garden while newborn Prince Siddhartha stands upon sacred lotus pedestals, adorned with ceremonial silk khata scarves.',
      localPos: [0, 1.6, -3.45],
    },
  };
  group.userData.mayaDeviHighlights = mayaDeviHighlights;
  group.userData.mayaDeviPlaqueHitTargets = plaqueHitTargets;

  return { group, beaconLights, animatedNodes, cameraOccluders, plaqueHitTargets };
}


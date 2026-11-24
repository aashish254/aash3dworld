import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { JanakiMandirTextures } from './janakiMandirTextures';
import {
  computeIncenseSmokeProfile,
  computeIncenseVentOffsets,
} from './worldLogic';

export interface JanakiCourtyardLanternParams {
  group: THREE.Group;
  textures: JanakiMandirTextures;
  plinthStoneMat: THREE.Material;
  goldMat: THREE.Material;
  beaconLights: THREE.PointLight[];
  animatedNodes: THREE.Object3D[];
  onAssetLoaded?: () => void;
}

const LANTERN_GLB_URL = '/assets/models/nepali_brass_lanterns.glb';
let cachedGltfPromise: Promise<GLTF> | null = null;

function loadNepaliLanternGltf(): Promise<GLTF> {
  if (!cachedGltfPromise) {
    const loader = new GLTFLoader();
    cachedGltfPromise = loader.loadAsync(LANTERN_GLB_URL).catch((err) => {
      cachedGltfPromise = null;
      throw err;
    });
  }
  return cachedGltfPromise;
}

function organicCandleFlicker(elapsed: number, phase: number, amp = 0.14): number {
  const wave =
    0.55 * Math.sin(elapsed * 6.4 + phase) +
    0.3 * Math.sin(elapsed * 13.1 + phase * 1.73) +
    0.15 * Math.cos(elapsed * 21.7 + phase * 0.61);
  return 1 + wave * amp;
}

interface LanternAnchorSpec {
  kind: 'standing' | 'hanging';
  x: number;
  y: number;
  z: number;
  rotY: number;
  scale: number;
  phaseIdx: number;
  hasPointLight: boolean;
  lightDistance?: number;
}

function seededUnit(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function createCourtyardIncenseSmoke(anchors: LanternAnchorSpec[]): {
  points: THREE.Points;
  material: THREE.ShaderMaterial;
} {
  const PARTICLES_PER_LANTERN = 36;
  const total = anchors.length * PARTICLES_PER_LANTERN;

  const positions = new Float32Array(total * 3);
  const seeds = new Float32Array(total * 4);
  const kinematics = new Float32Array(total * 3);

  let idx = 0;
  for (let l = 0; l < anchors.length; l++) {
    const spec = anchors[l];
    const vent = computeIncenseVentOffsets(spec.kind, spec.scale);
    const lanternPhaseOffset = (l * 0.381966) % 1;

    for (let p = 0; p < PARTICLES_PER_LANTERN; p++) {
      const i3 = idx * 3;
      const i4 = idx * 4;

      const angle =
        (p / PARTICLES_PER_LANTERN) * Math.PI * 2 +
        spec.rotY +
        (seededUnit(idx, 1.1) - 0.5) * 0.4;
      const radial = vent.ringRadius * (0.8 + seededUnit(idx, 2.3) * 0.34);

      positions[i3] = spec.x + Math.cos(angle) * radial;
      positions[i3 + 1] = spec.y + vent.ventY + (seededUnit(idx, 3.7) - 0.5) * 0.03;
      positions[i3 + 2] = spec.z + Math.sin(angle) * radial;

      // x: staggered lifecycle [0..1), y: swirl phase [0..2PI), z: size scale, w: rise speed scale
      seeds[i4] = (p / PARTICLES_PER_LANTERN + lanternPhaseOffset + seededUnit(idx, 4.9) * 0.025) % 1;
      seeds[i4 + 1] = seededUnit(idx, 6.1) * Math.PI * 2;
      seeds[i4 + 2] = 0.85 + seededUnit(idx, 7.3) * 0.45;
      seeds[i4 + 3] = 0.86 + seededUnit(idx, 8.5) * 0.3;

      // x: max rise height, y/z: outward radial curl direction from pagoda eaves
      kinematics[i3] = vent.maxRise * (0.9 + seededUnit(idx, 9.7) * 0.22);
      kinematics[i3 + 1] = Math.cos(angle) * vent.lateralScale;
      kinematics[i3 + 2] = Math.sin(angle) * vent.lateralScale;

      idx++;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
  geo.setAttribute('aKinematics', new THREE.BufferAttribute(kinematics, 3));

  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  const viewH = typeof window !== 'undefined' ? Math.max(1, window.innerHeight || 900) : 900;
  const pixelScale = dpr * Math.max(0.7, viewH / 900);

  const initialSmoke = computeIncenseSmokeProfile(0.35);

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    uniforms: {
      uTime: { value: 0 },
      uPixelScale: { value: pixelScale },
      uOpacity: { value: initialSmoke.opacity },
      uEveningGlow: { value: initialSmoke.eveningGlow },
      uHeightScale: { value: initialSmoke.plumeHeightScale },
    },
    vertexShader: `
      attribute vec4 aSeed;
      attribute vec3 aKinematics;

      uniform float uTime;
      uniform float uPixelScale;
      uniform float uEveningGlow;
      uniform float uHeightScale;

      varying float vAlpha;
      varying float vLife;
      varying float vRot;
      varying float vWarmth;

      void main() {
        float life = fract(uTime * 0.22 * aSeed.w + aSeed.x);
        float rise = pow(life, 0.86) * aKinematics.x * uHeightScale;

        float spread = 0.03 + pow(life, 1.15) * 0.3;
        float swirlT = uTime * 1.25 + aSeed.y + life * 5.2;
        vec2 curl = vec2(
          sin(swirlT) + 0.44 * sin(swirlT * 1.9 + aSeed.x * 6.2831),
          cos(swirlT * 0.92 + 0.7) + 0.44 * cos(swirlT * 1.7 - aSeed.x * 4.1)
        ) * spread * 0.58;

        // Gentle radial bloom out from under the pagoda eaves + soft NE courtyard breeze
        vec2 eavesExpand = aKinematics.yz * (0.04 + pow(life, 0.9) * 0.16);
        vec2 breeze = vec2(0.28, 0.13) * pow(life, 1.32);

        vec3 localPos = position + vec3(
          curl.x + eavesExpand.x + breeze.x,
          rise,
          curl.y + eavesExpand.y + breeze.y
        );

        vec4 mvPosition = modelViewMatrix * vec4(localPos, 1.0);
        float camDist = -mvPosition.z;

        float fadeIn = smoothstep(0.0, 0.12, life);
        float fadeOut = pow(1.0 - smoothstep(0.18, 1.0, life), 1.32);
        float nearFade = smoothstep(0.8, 2.1, camDist);
        float farFade = 1.0 - smoothstep(24.0, 42.0, camDist);

        vAlpha = fadeIn * fadeOut * nearFade * farFade;
        vLife = life;
        vRot = aSeed.y + life * 1.85;
        vWarmth = (1.0 - smoothstep(0.0, 0.5, life)) * uEveningGlow;

        float worldPx = mix(160.0, 480.0, pow(life, 0.76)) * aSeed.z * uPixelScale;
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = clamp(worldPx / max(camDist, 1.0), 3.0, 120.0 * uPixelScale);
      }
    `,
    fragmentShader: `
      uniform float uOpacity;

      varying float vAlpha;
      varying float vLife;
      varying float vRot;
      varying float vWarmth;

      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float c = cos(vRot);
        float s = sin(vRot);
        vec2 rotUv = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);

        // Gently elongated ribbon aspect with subtle domain warp for organic smoke tendrils
        vec2 q = vec2(rotUv.x * 1.32, rotUv.y * 0.84);
        q += 0.095 * vec2(
          sin(q.y * 8.5 + vLife * 6.0),
          cos(q.x * 7.5 - vLife * 5.0)
        );

        float dist = length(q) * 2.0;
        float radial = pow(smoothstep(0.94, 0.06, dist), 1.35);
        float filament = 0.66 + 0.34 * sin(q.x * 10.5 + q.y * 7.0 + vLife * 5.2) * cos(q.y * 9.0 - q.x * 5.5 - vLife * 4.1);

        // Cool blue-silver sandalwood incense haze higher up, warm candlelit ivory-amber near the brass roof
        vec3 coolWisp = vec3(0.76, 0.81, 0.87);
        vec3 warmWisp = vec3(1.0, 0.86, 0.64);
        vec3 color = mix(coolWisp, warmWisp, vWarmth * 0.78);

        float alpha = radial * filament * vAlpha * uOpacity;
        if (alpha < 0.005) discard;
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });

  const points = new THREE.Points(geo, material);
  points.name = 'JanakiCourtyardIncenseSmoke';
  points.frustumCulled = false;
  points.renderOrder = 3;
  return { points, material };
}

/**
 * Mounts authentic, sculpted glTF 2.0 (.glb) traditional Nepali brass Panasa standing lanterns
 * and Hanging Akashdeep archway lanterns throughout Janaki Mandir's inner courtyard with
 * staggered multi-harmonic flickering flames, warm frosted-glass radiance, rising incense smoke,
 * and dynamic PointLights.
 */
export function createJanakiCourtyardLanterns({
  group,
  textures: jTex,
  plinthStoneMat,
  goldMat,
  beaconLights,
  animatedNodes,
  onAssetLoaded,
}: JanakiCourtyardLanternParams): void {
  const lanternsRoot = new THREE.Group();
  lanternsRoot.name = 'JanakiCourtyardBrassLanterns';
  lanternsRoot.userData.noMerge = true;
  group.add(lanternsRoot);

  // Hammered antique Nepali brass PBR material + burnished gold trim
  const antiqueBrassMat = new THREE.MeshStandardMaterial({
    map: jTex.antiqueBrassMap,
    normalMap: jTex.antiqueBrassNormal,
    normalScale: new THREE.Vector2(0.7, 0.7),
    roughnessMap: jTex.antiqueBrassRough,
    color: 0xffffff,
    roughness: 1.0,
    metalness: 0.78,
  });

  // 4 staggered-phase emissive & halo material channels so lanterns breathe organically out-of-sync
  const PHASE_COUNT = 4;
  const phaseChannels = Array.from({ length: PHASE_COUNT }, (_, idx) => {
    const flameMat = new THREE.MeshStandardMaterial({
      color: 0xfff2c2,
      emissive: new THREE.Color(0xffa62b),
      emissiveIntensity: 2.2,
      roughness: 0.16,
      metalness: 0.0,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xffd58a,
      emissive: new THREE.Color(0xff9426),
      emissiveIntensity: 0.45,
      roughness: 0.28,
      metalness: 0.04,
      transparent: true,
      opacity: 0.84,
      depthWrite: true,
    });
    const haloMat = new THREE.SpriteMaterial({
      map: jTex.lanternHaloMap,
      color: 0xffb854,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return {
      phaseOffset: idx * 1.57 + 0.4,
      flameMat,
      glassMat,
      haloMat,
      flameMeshes: [] as THREE.Object3D[],
    };
  });

  // 18 balanced courtyard brass lanterns (8 Standing Panasa + 10 Hanging Akashdeep)
  const anchors: LanternAnchorSpec[] = [
    // 4 Standing Panasa lanterns beside the 4 Corner Charbagh beds (inside existing bed bounds)
    { kind: 'standing', x: -9.22, y: 0, z: -6.82, rotY: Math.PI * 0.25, scale: 1.0, phaseIdx: 0, hasPointLight: true, lightDistance: 17 },
    { kind: 'standing', x: 9.22, y: 0, z: -6.82, rotY: -Math.PI * 0.25, scale: 1.0, phaseIdx: 1, hasPointLight: true, lightDistance: 17 },
    { kind: 'standing', x: -9.22, y: 0, z: 6.82, rotY: Math.PI * 0.75, scale: 1.0, phaseIdx: 2, hasPointLight: true, lightDistance: 17 },
    { kind: 'standing', x: 9.22, y: 0, z: 6.82, rotY: -Math.PI * 0.75, scale: 1.0, phaseIdx: 3, hasPointLight: true, lightDistance: 17 },

    // 2 Standing Panasa lanterns flanking Garbhagriha steps (inside Sanctum plinth margin)
    { kind: 'standing', x: -3.85, y: 0, z: -1.55, rotY: 0, scale: 1.06, phaseIdx: 1, hasPointLight: true, lightDistance: 16 },
    { kind: 'standing', x: 3.85, y: 0, z: -1.55, rotY: 0, scale: 1.06, phaseIdx: 2, hasPointLight: true, lightDistance: 16 },

    // 2 Standing Panasa lanterns framing South Simha Dwar arrival promenade
    { kind: 'standing', x: -2.85, y: 0, z: 8.85, rotY: 0, scale: 1.02, phaseIdx: 3, hasPointLight: true, lightDistance: 15 },
    { kind: 'standing', x: 2.85, y: 0, z: 8.85, rotY: 0, scale: 1.02, phaseIdx: 0, hasPointLight: true, lightDistance: 15 },

    // 2 Hanging Akashdeep lanterns under Central Mughal Gate cusped arch shoulders (5.4m clear span -> ±1.22m clears arch tips)
    { kind: 'hanging', x: -1.22, y: 4.80, z: 0.35, rotY: 0, scale: 0.76, phaseIdx: 0, hasPointLight: false },
    { kind: 'hanging', x: 1.22, y: 4.80, z: 0.35, rotY: 0, scale: 0.76, phaseIdx: 2, hasPointLight: false },

    // 2 Hanging Akashdeep lanterns under Inner Simha Dwar Pishtaq arch (4.0m clear span -> ±1.02m clears vault haunches)
    { kind: 'hanging', x: -1.02, y: 4.56, z: 11.15, rotY: 0, scale: 0.78, phaseIdx: 1, hasPointLight: false },
    { kind: 'hanging', x: 1.02, y: 4.56, z: 11.15, rotY: 0, scale: 0.78, phaseIdx: 3, hasPointLight: false },

    // 2 Hanging Akashdeep lanterns in Mukhamandapa Sanctum side porch arches (clear of ±0.95m & ±2.4m columns)
    { kind: 'hanging', x: -1.42, y: 4.42, z: -2.35, rotY: 0, scale: 0.74, phaseIdx: 2, hasPointLight: false },
    { kind: 'hanging', x: 1.42, y: 4.42, z: -2.35, rotY: 0, scale: 0.74, phaseIdx: 0, hasPointLight: false },

    // 4 Hanging Akashdeep lanterns centered cleanly under East & West Parikrama veranda canopy soffits (±15.48m clears ±14.4m colonnade arches)
    { kind: 'hanging', x: -15.48, y: 4.35, z: -5.1, rotY: Math.PI / 2, scale: 0.8, phaseIdx: 1, hasPointLight: true, lightDistance: 14 },
    { kind: 'hanging', x: -15.48, y: 4.35, z: 1.7, rotY: Math.PI / 2, scale: 0.8, phaseIdx: 3, hasPointLight: false },
    { kind: 'hanging', x: 15.48, y: 4.35, z: -5.1, rotY: -Math.PI / 2, scale: 0.8, phaseIdx: 0, hasPointLight: true, lightDistance: 14 },
    { kind: 'hanging', x: 15.48, y: 4.35, z: 1.7, rotY: -Math.PI / 2, scale: 0.8, phaseIdx: 2, hasPointLight: false },
  ];

  // Register synchronous flickering PointLights + anchor groups immediately so Frame 0 pool picks them up
  const anchorGroups = anchors.map((spec, idx) => {
    const anchor = new THREE.Group();
    anchor.position.set(spec.x, spec.y, spec.z);
    anchor.rotation.y = spec.rotY;
    anchor.scale.setScalar(spec.scale);
    anchor.userData.noMerge = true;
    if (spec.kind === 'standing') {
      anchor.userData.snapCategory = 'lantern';
    }
    lanternsRoot.add(anchor);

    const flameLocalY = spec.kind === 'standing' ? 1.8 : -0.8;
    const ch = phaseChannels[spec.phaseIdx];

    // Soft warm evening candlelight halo sprite around the lantern cage
    const halo = new THREE.Sprite(ch.haloMat);
    halo.position.set(0, flameLocalY, 0);
    halo.scale.set(1.55, 1.55, 1.55);
    halo.userData.nonCollidable = true;
    anchor.add(halo);

    if (spec.hasPointLight) {
      const pLight = new THREE.PointLight(0xff9b38, 1.8, spec.lightDistance ?? 13.5, 1.85);
      pLight.position.set(0, flameLocalY, 0);
      pLight.userData.flickerPhase = ch.phaseOffset + idx * 0.43;
      pLight.userData.flickerAmp = 0.18;
      pLight.userData.intensityScale = 0.65;
      pLight.userData.warmFlicker = true;
      anchor.add(pLight);
      beaconLights.push(pLight);
    }

    return { anchor, spec, ch };
  });

  // Subtle, particle-based incense smoke rising from the pagoda eaves of every courtyard brass lantern
  const incenseSmoke = createCourtyardIncenseSmoke(anchors);
  incenseSmoke.points.userData.nonCollidable = true;
  lanternsRoot.add(incenseSmoke.points);

  // Register flicker animation controller node into animatedNodes (WorldEngine invokes onFlickerUpdate each tick)
  const flickerController = new THREE.Object3D();
  flickerController.name = 'JanakiLanternFlickerController';
  flickerController.userData.noMerge = true;
  flickerController.userData.onFlickerUpdate = (
    elapsed: number,
    lanternIntensity: number,
    emissiveScale: number,
  ) => {
    const smokeProfile = computeIncenseSmokeProfile(lanternIntensity);
    const eveningFactor = smokeProfile.eveningGlow;
    incenseSmoke.material.uniforms.uTime.value = elapsed;
    incenseSmoke.material.uniforms.uOpacity.value = smokeProfile.opacity;
    incenseSmoke.material.uniforms.uEveningGlow.value = eveningFactor;
    incenseSmoke.material.uniforms.uHeightScale.value = smokeProfile.plumeHeightScale;

    for (let c = 0; c < phaseChannels.length; c++) {
      const ch = phaseChannels[c];
      const f = organicCandleFlicker(elapsed, ch.phaseOffset, 0.14);

      // Soft warm candlelight breathing on glass & teardrop flame core
      ch.flameMat.emissiveIntensity =
        (0.42 + eveningFactor * (2.5 + emissiveScale * 0.45)) * f;
      ch.glassMat.emissiveIntensity =
        (0.08 + eveningFactor * 0.88) * (0.94 + (f - 1) * 0.8);
      ch.haloMat.opacity = eveningFactor * 0.48 * (0.9 + (f - 1) * 0.95);

      for (let m = 0; m < ch.flameMeshes.length; m++) {
        const flame = ch.flameMeshes[m];
        const localF = organicCandleFlicker(elapsed, ch.phaseOffset + m * 0.91, 0.16);
        const sx = 1 + (localF - 1) * 0.45;
        const sy = 1 + (localF - 1) * 1.35;
        flame.scale.set(sx, sy, sx);
        flame.rotation.z = Math.sin(elapsed * 4.8 + ch.phaseOffset + m) * 0.075;
        flame.rotation.x = Math.cos(elapsed * 4.1 + ch.phaseOffset + m * 1.3) * 0.065;
      }
    }
  };
  lanternsRoot.add(flickerController);
  animatedNodes.push(flickerController);

  // Load non-procedural glTF 2.0 (.glb) traditional Nepali brass lantern asset asynchronously
  loadNepaliLanternGltf()
    .then((gltf) => {
      const standingTemplate = gltf.scene.getObjectByName('StandingPanasaLantern');
      const hangingTemplate = gltf.scene.getObjectByName('HangingAkashdeepLantern');
      if (!standingTemplate || !hangingTemplate) return;

      for (const { anchor, spec, ch } of anchorGroups) {
        const template = spec.kind === 'standing' ? standingTemplate : hangingTemplate;
        const instance = template.clone(true);

        instance.traverse((node) => {
          if (!(node as THREE.Mesh).isMesh) return;
          const mesh = node as THREE.Mesh;
          const origMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
          const matName = origMat?.name ?? '';

          if (matName === 'NewariStonePlinth') {
            mesh.material = plinthStoneMat;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
          } else if (matName === 'PolishedGajurGold') {
            mesh.material = goldMat;
            mesh.castShadow = true;
          } else if (matName === 'AmberMicaGlass') {
            mesh.material = ch.glassMat;
            mesh.castShadow = false;
          } else if (matName === 'DiyoFlameCore' || mesh.name === 'LanternFlame') {
            mesh.material = ch.flameMat;
            mesh.castShadow = false;
            ch.flameMeshes.push(mesh);
          } else {
            mesh.material = antiqueBrassMat;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
          }
        });

        anchor.add(instance);
      }

      lanternsRoot.userData.loaded = true;
      onAssetLoaded?.();
    })
    .catch((err) => {
      console.error('Failed to load Nepali brass lantern glTF model:', err);
    });
}

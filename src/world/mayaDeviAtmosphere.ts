import * as THREE from 'three';
import { createTaperedLimbGeometry } from './mayaDeviSculptureGeo';

const _m4 = new THREE.Matrix4();
const _v3 = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _e = new THREE.Euler();

export interface SanctumWeatheringOptions {
  cacheKey: string;
  minRelY: number;
  maxRelY: number;
  mossStrength: number;
  dampDarken: number;
  noiseScale?: number;
  initialAnchorY?: number;
}

export interface SanctumWeatheringBinding {
  uniforms: {
    uWeatherAnchorY: { value: number };
    uWeatherMinY: { value: number };
    uWeatherMaxY: { value: number };
    uWeatherMossStrength: { value: number };
    uWeatherDampDarken: { value: number };
    uWeatherNoiseScale: { value: number };
  };
}

/**
 * Injects height-aware GLSL shader weathering into a MeshStandardMaterial via `onBeforeCompile`:
 * - Moisture darkening near floor / plinth / stone-bed contact
 * - Multi-octave 3D organic value-noise patina & subtle green-olive moss/lichen speckles
 *   weighted toward upward-facing ledges and base crevices (leaving upper faces clean).
 */
export function applySanctumWeatheringShader(
  material: THREE.MeshStandardMaterial,
  opts: SanctumWeatheringOptions,
): SanctumWeatheringBinding {
  const uniforms = {
    uWeatherAnchorY: { value: opts.initialAnchorY ?? 0 },
    uWeatherMinY: { value: opts.minRelY },
    uWeatherMaxY: { value: opts.maxRelY },
    uWeatherMossStrength: { value: opts.mossStrength },
    uWeatherDampDarken: { value: opts.dampDarken },
    uWeatherNoiseScale: { value: opts.noiseScale ?? 5.6 },
  };

  material.customProgramCacheKey = () => opts.cacheKey;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);

    shader.vertexShader =
      `varying vec3 vWeatherWorldPos;\nvarying vec3 vWeatherWorldNormal;\n` +
      shader.vertexShader.replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        vec4 sanctumWPos = vec4( transformed, 1.0 );
        vec3 sanctumWNorm = objectNormal;
        #ifdef USE_INSTANCING
          sanctumWPos = instanceMatrix * sanctumWPos;
          sanctumWNorm = ( instanceMatrix * vec4( sanctumWNorm, 0.0 ) ).xyz;
        #endif
        sanctumWPos = modelMatrix * sanctumWPos;
        vWeatherWorldPos = sanctumWPos.xyz;
        vWeatherWorldNormal = normalize( ( modelMatrix * vec4( sanctumWNorm, 0.0 ) ).xyz );
        `,
      );

    shader.fragmentShader =
      `
      uniform float uWeatherAnchorY;
      uniform float uWeatherMinY;
      uniform float uWeatherMaxY;
      uniform float uWeatherMossStrength;
      uniform float uWeatherDampDarken;
      uniform float uWeatherNoiseScale;
      varying vec3 vWeatherWorldPos;
      varying vec3 vWeatherWorldNormal;

      float sanctumHash31(vec3 p) {
        p = fract(p * 0.3183099 + vec3(0.11, 0.17, 0.23));
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }

      float sanctumValueNoise3(vec3 x) {
        vec3 i = floor(x);
        vec3 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(
            mix(sanctumHash31(i + vec3(0.0, 0.0, 0.0)), sanctumHash31(i + vec3(1.0, 0.0, 0.0)), f.x),
            mix(sanctumHash31(i + vec3(0.0, 1.0, 0.0)), sanctumHash31(i + vec3(1.0, 1.0, 0.0)), f.x),
            f.y
          ),
          mix(
            mix(sanctumHash31(i + vec3(0.0, 0.0, 1.0)), sanctumHash31(i + vec3(1.0, 0.0, 1.0)), f.x),
            mix(sanctumHash31(i + vec3(0.0, 1.0, 1.0)), sanctumHash31(i + vec3(1.0, 1.0, 1.0)), f.x),
            f.y
          ),
          f.z
        );
      }
      ` +
      shader.fragmentShader
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
          float sanctumRelY = vWeatherWorldPos.y - uWeatherAnchorY;
          float sanctumHMask = 1.0 - smoothstep(uWeatherMinY, uWeatherMaxY, sanctumRelY);
          float sanctumN1 = sanctumValueNoise3(vWeatherWorldPos * uWeatherNoiseScale);
          float sanctumN2 = sanctumValueNoise3(vWeatherWorldPos * (uWeatherNoiseScale * 2.85 + 1.17));
          float sanctumOrganic = clamp(sanctumN1 * 0.66 + sanctumN2 * 0.34, 0.0, 1.0);
          float sanctumDampMask = clamp(sanctumHMask * (0.50 + 0.65 * sanctumOrganic), 0.0, 1.0);
          diffuseColor.rgb *= mix(1.0, uWeatherDampDarken, sanctumDampMask * 0.56);

          float sanctumUpBias = smoothstep(-0.34, 0.68, vWeatherWorldNormal.y);
          float sanctumMossPatch = smoothstep(0.42, 0.78, sanctumOrganic + sanctumHMask * 0.28);
          float sanctumMossAmount = clamp(
            sanctumHMask * sanctumMossPatch * mix(0.46, 1.0, sanctumUpBias) * uWeatherMossStrength,
            0.0,
            0.52
          );
          vec3 sanctumMossCol = mix(vec3(0.16, 0.23, 0.09), vec3(0.28, 0.35, 0.15), sanctumN2);
          vec3 sanctumPatinaCol = vec3(0.32, 0.25, 0.16);
          float sanctumPatinaMask = clamp(
            (sanctumOrganic * 0.5 + 0.5) * (0.16 + 0.44 * sanctumHMask) * uWeatherMossStrength * 0.58,
            0.0,
            0.24
          );
          diffuseColor.rgb = mix(diffuseColor.rgb, sanctumPatinaCol, sanctumPatinaMask);
          diffuseColor.rgb = mix(diffuseColor.rgb, sanctumMossCol, sanctumMossAmount);
          `,
        )
        .replace(
          '#include <roughnessmap_fragment>',
          `#include <roughnessmap_fragment>
          roughnessFactor = clamp(roughnessFactor + sanctumMossAmount * 0.24, 0.06, 1.0);
          `,
        );
  };
  material.needsUpdate = true;

  return { uniforms };
}

export interface SanctuaryWallLanternResult {
  group: THREE.Group;
  flameGroup: THREE.Group;
}

/**
 * Museum-Grade Hand-Wrought Nepali/Newari Brass & Filigree Temple Wall Lantern Sconce:
 * - Stepped Lathed Wall Rosette Medallion + 12-petal Sunburst Rim + 4 Domed Brass Rivets
 * - Tapered S-Scroll Cantilever Gooseneck Arm + Forged Lower Spiral Volute Brace + Shackle
 * - Inverted Lotus Bud Pendant Drop + Stepped Hexagonal Gallery Basin
 * - 6 Turned Corner Mullion Pillars + Frosted Warm-Amber Stained Glass Panes
 * - Outer Crossed Geometric Filigree Jali Lattice Cage (`InstancedMesh`)
 * - Internal Brass Oil Diyo Burner + Hurricane Glass Chimney + Flickering Sacred Flame
 * - Tiered Flared Hexagonal Pagoda Roof Canopy with 6 Hanging Brass Bells & Kalash Crown
 */
export function buildDetailedSanctuaryWallLantern(mats: {
  giltGoldMat: THREE.Material;
  warmBronzeMat: THREE.Material;
  darkMetalMat: THREE.Material;
  flameGlowMat: THREE.Material;
}): SanctuaryWallLanternResult {
  const root = new THREE.Group();
  root.userData.nonCollidable = true;

  const amberGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffd592,
    emissive: 0xff9328,
    emissiveIntensity: 0.56,
    roughness: 0.14,
    metalness: 0.04,
    transparent: true,
    opacity: 0.38,
    clearcoat: 0.9,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const chimneyGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0xfff7e2,
    emissive: 0xffba5c,
    emissiveIntensity: 0.25,
    roughness: 0.08,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
  });

  const flameCoreMat = new THREE.MeshBasicMaterial({ color: 0xfff8de });

  // A. Carved Brass & Bronze Wall Medallion Backplate (mounted flush at z = 0)
  const backplatePts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.155, 0.0),
    new THREE.Vector2(0.148, 0.016),
    new THREE.Vector2(0.125, 0.022),
    new THREE.Vector2(0.118, 0.032),
    new THREE.Vector2(0.068, 0.036),
    new THREE.Vector2(0.052, 0.048),
    new THREE.Vector2(0.0, 0.050),
  ];
  const backplate = new THREE.Mesh(new THREE.LatheGeometry(backplatePts, 24), mats.warmBronzeMat);
  backplate.rotation.x = Math.PI * 0.5;
  backplate.castShadow = true;
  root.add(backplate);

  const outerBead = new THREE.Mesh(new THREE.TorusGeometry(0.136, 0.0085, 8, 24), mats.giltGoldMat);
  outerBead.position.z = 0.018;
  root.add(outerBead);

  // 12 Scalloped Sunburst Rosette Flanges & 4 Corner Brass Rivets
  const petalGeo = new THREE.SphereGeometry(0.018, 8, 6);
  const petalInst = new THREE.InstancedMesh(petalGeo, mats.giltGoldMat, 12);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    _v3.set(Math.cos(a) * 0.145, Math.sin(a) * 0.145, 0.012);
    _q.setFromEuler(_e.set(0, 0, a));
    _s.set(1.25, 0.65, 0.55);
    _m4.compose(_v3, _q, _s);
    petalInst.setMatrixAt(i, _m4);
  }
  petalInst.instanceMatrix.needsUpdate = true;
  petalInst.computeBoundingSphere();
  root.add(petalInst);

  for (const [rx, ry] of [
    [-0.085, 0.085],
    [0.085, 0.085],
    [-0.085, -0.085],
    [0.085, -0.085],
  ] as Array<[number, number]>) {
    const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 6), mats.giltGoldMat);
    rivet.position.set(rx, ry, 0.025);
    root.add(rivet);
  }

  // B. S-Scroll Cantilever Gooseneck Arm + Lower Tension Scroll Strut (extending to lantern at z = 0.38)
  const lanternZ = 0.38;
  const bracketCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.025, 0.036),
    new THREE.Vector3(0, 0.16, 0.10),
    new THREE.Vector3(0, 0.35, 0.21),
    new THREE.Vector3(0, 0.43, 0.31),
    new THREE.Vector3(0, 0.37, lanternZ),
    new THREE.Vector3(0, 0.30, lanternZ),
  ]);
  const mainArm = new THREE.Mesh(
    createTaperedLimbGeometry(bracketCurve, (t) => THREE.MathUtils.lerp(0.020, 0.011, t), 24, 10),
    mats.warmBronzeMat,
  );
  mainArm.castShadow = true;

  const armCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.04, 12), mats.giltGoldMat);
  armCollar.rotation.x = Math.PI * 0.5;
  armCollar.position.set(0, 0.025, 0.045);

  const lowerBraceCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.09, 0.030),
    new THREE.Vector3(0, 0.06, 0.135),
    new THREE.Vector3(0, 0.23, 0.195),
  ]);
  const lowerBrace = new THREE.Mesh(
    createTaperedLimbGeometry(lowerBraceCurve, (t) => THREE.MathUtils.lerp(0.014, 0.010, t), 14, 8),
    mats.darkMetalMat,
  );

  // Decorative Curled Scroll Volutes tucked under gooseneck & backplate
  const upperVolute = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.0085, 8, 18, Math.PI * 1.45), mats.giltGoldMat);
  upperVolute.rotation.y = Math.PI * 0.5;
  upperVolute.rotation.x = 0.45;
  upperVolute.position.set(0, 0.27, 0.24);

  const lowerVolute = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.0075, 8, 16, Math.PI * 1.55), mats.warmBronzeMat);
  lowerVolute.rotation.y = Math.PI * 0.5;
  lowerVolute.rotation.x = -0.6;
  lowerVolute.position.set(0, -0.045, 0.088);

  const hookRing = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.0055, 8, 16), mats.giltGoldMat);
  hookRing.position.set(0, 0.295, lanternZ);

  root.add(mainArm, armCollar, lowerBrace, upperVolute, lowerVolute, hookRing);

  // C. Suspended Hexagonal Newari Temple Lantern Basket & Pagoda Hood
  const cage = new THREE.Group();
  cage.position.set(0, 0.01, lanternZ);

  // 1. Turned Inverted Lotus Drop Pendant Finial (y: -0.34 -> -0.17)
  const dropPts = [
    new THREE.Vector2(0.001, -0.16),
    new THREE.Vector2(0.024, -0.135),
    new THREE.Vector2(0.014, -0.112),
    new THREE.Vector2(0.036, -0.085),
    new THREE.Vector2(0.022, -0.048),
    new THREE.Vector2(0.052, -0.018),
    new THREE.Vector2(0.044, 0.0),
    new THREE.Vector2(0.0, 0.0),
  ];
  const dropFinial = new THREE.Mesh(new THREE.LatheGeometry(dropPts, 18), mats.giltGoldMat);
  dropFinial.position.y = -0.185;
  cage.add(dropFinial);

  // 2. Stepped Hexagonal Base Saucer & Molded Gallery Collar (y: -0.185 -> -0.12)
  const basePlate = new THREE.Mesh(new THREE.CylinderGeometry(0.118, 0.092, 0.045, 6), mats.warmBronzeMat);
  basePlate.position.y = -0.160;
  basePlate.castShadow = true;
  const baseTrim = new THREE.Mesh(new THREE.CylinderGeometry(0.126, 0.120, 0.022, 6), mats.giltGoldMat);
  baseTrim.position.y = -0.132;
  cage.add(basePlate, baseTrim);

  // 3. 6 Tapered Turned Brass Corner Mullions + Mid Knobs (y: -0.125 -> +0.125)
  const topR = 0.140;
  const botR = 0.106;
  const glassTopY = 0.122;
  const glassBotY = -0.122;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const tx = Math.cos(a) * topR;
    const tz = Math.sin(a) * topR;
    const bx = Math.cos(a) * botR;
    const bz = Math.sin(a) * botR;

    const strutCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(bx, glassBotY, bz),
      new THREE.Vector3((bx + tx) * 0.5, 0, (bz + tz) * 0.5),
      new THREE.Vector3(tx, glassTopY, tz),
    ]);
    const strut = new THREE.Mesh(
      createTaperedLimbGeometry(strutCurve, () => 0.0085, 8, 8),
      mats.giltGoldMat,
    );
    const midKnop = new THREE.Mesh(new THREE.SphereGeometry(0.013, 8, 6), mats.warmBronzeMat);
    midKnop.position.set((bx + tx) * 0.5, 0.0, (bz + tz) * 0.5);
    cage.add(strut, midKnop);
  }

  // 4. Frosted Warm-Amber Hexagonal Glass Core Panes
  const amberShell = new THREE.Mesh(
    new THREE.CylinderGeometry(topR * 0.94, botR * 0.94, glassTopY - glassBotY - 0.01, 6, 1, true),
    amberGlassMat,
  );
  amberShell.renderOrder = 4;
  cage.add(amberShell);

  // 5. Crisp Geometric Outer X-Filigree Jali Lattice Bars on All 6 Faces (`InstancedMesh`)
  const latticeTransforms: THREE.Matrix4[] = [];
  const barUnitGeo = new THREE.BoxGeometry(1, 1, 1);
  const midY = (glassTopY + glassBotY) * 0.5;
  const faceHeight = glassTopY - glassBotY;

  for (let i = 0; i < 6; i++) {
    const a0 = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const a1 = ((i + 1) / 6) * Math.PI * 2 + Math.PI / 6;
    const aMid = (a0 + a1) * 0.5;

    const pBL = new THREE.Vector3(Math.cos(a0) * botR, glassBotY, Math.sin(a0) * botR);
    const pBR = new THREE.Vector3(Math.cos(a1) * botR, glassBotY, Math.sin(a1) * botR);
    const pTL = new THREE.Vector3(Math.cos(a0) * topR, glassTopY, Math.sin(a0) * topR);
    const pTR = new THREE.Vector3(Math.cos(a1) * topR, glassTopY, Math.sin(a1) * topR);

    // 2 crossed diagonal lattice bars per face
    for (const [pa, pb] of [[pBL, pTR], [pBR, pTL]] as Array<[THREE.Vector3, THREE.Vector3]>) {
      const center = pa.clone().add(pb).multiplyScalar(0.5);
      const dir = pb.clone().sub(pa);
      const len = dir.length();
      dir.normalize();
      _q.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir);
      _s.set(len, 0.0065, 0.0065);
      _m4.compose(center, _q, _s);
      latticeTransforms.push(_m4.clone());
    }

    // Center horizontal filigree transom bar at mid-height + vertical finial pin
    const midR = (botR + topR) * 0.5;
    const faceW = 2 * midR * Math.sin(Math.PI / 6);
    _v3.set(Math.cos(aMid) * midR * 0.88, midY, Math.sin(aMid) * midR * 0.88);
    _q.setFromEuler(_e.set(0, -aMid + Math.PI * 0.5, 0));
    _s.set(faceW, 0.007, 0.007);
    _m4.compose(_v3, _q, _s);
    latticeTransforms.push(_m4.clone());

    _v3.set(Math.cos(aMid) * midR * 0.89, midY, Math.sin(aMid) * midR * 0.89);
    _s.set(0.0065, faceHeight * 0.94, 0.0065);
    _m4.compose(_v3, _q, _s);
    latticeTransforms.push(_m4.clone());
  }
  const latticeInst = new THREE.InstancedMesh(barUnitGeo, mats.darkMetalMat, latticeTransforms.length);
  latticeTransforms.forEach((m, idx) => latticeInst.setMatrixAt(idx, m));
  latticeInst.instanceMatrix.needsUpdate = true;
  latticeInst.computeBoundingSphere();
  cage.add(latticeInst);

  // 6. Internal Diyo Oil Cup + Hurricane Glass Chimney + Flickering Sacred Flame
  const diyoCupPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.034, 0.0),
    new THREE.Vector2(0.022, 0.016),
    new THREE.Vector2(0.048, 0.040),
    new THREE.Vector2(0.044, 0.048),
    new THREE.Vector2(0.0, 0.036),
  ];
  const diyoCup = new THREE.Mesh(new THREE.LatheGeometry(diyoCupPts, 16), mats.giltGoldMat);
  diyoCup.position.y = -0.118;
  const hurricane = new THREE.Mesh(
    new THREE.CylinderGeometry(0.038, 0.044, 0.145, 16, 1, true),
    chimneyGlassMat,
  );
  hurricane.position.y = -0.025;
  hurricane.renderOrder = 3;
  cage.add(diyoCup, hurricane);

  const flameGroup = new THREE.Group();
  flameGroup.position.set(0, -0.068, 0);
  const flameOuter = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.068, 10), mats.flameGlowMat);
  flameOuter.position.y = 0.034;
  const flameCore = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), flameCoreMat);
  flameCore.scale.set(0.85, 1.4, 0.85);
  flameCore.position.y = 0.020;
  flameGroup.add(flameOuter, flameCore);
  cage.add(flameGroup);

  // 7. Tiered Flared Hexagonal Pagoda Canopy Roof + 6 Hanging Corner Bells + Gajur Suspension Ring
  const upperCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.144, 0.032, 6), mats.giltGoldMat);
  upperCollar.position.y = 0.132;
  const lowerEave = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.212, 0.068, 6), mats.warmBronzeMat);
  lowerEave.position.y = 0.168;
  lowerEave.castShadow = true;
  const pagodaCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.132, 0.072, 6), mats.giltGoldMat);
  pagodaCrown.position.y = 0.215;

  // Top Kalash Cap & Suspension Eye Loop joining hookRing
  const kalashCap = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 10), mats.giltGoldMat);
  kalashCap.scale.set(1.0, 1.2, 1.0);
  kalashCap.position.y = 0.258;
  const topEye = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.005, 8, 14), mats.giltGoldMat);
  topEye.rotation.y = Math.PI * 0.5;
  topEye.position.y = 0.285;
  cage.add(upperCollar, lowerEave, pagodaCrown, kalashCap, topEye);

  // 6 Miniature Hanging Temple Bells (Ghanti) suspended at eave corners
  const bellGeo = new THREE.ConeGeometry(0.013, 0.028, 8);
  const bellInst = new THREE.InstancedMesh(bellGeo, mats.giltGoldMat, 6);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    _v3.set(Math.cos(a) * 0.192, 0.122, Math.sin(a) * 0.192);
    _q.identity();
    _s.setScalar(1);
    _m4.compose(_v3, _q, _s);
    bellInst.setMatrixAt(i, _m4);
  }
  bellInst.instanceMatrix.needsUpdate = true;
  bellInst.computeBoundingSphere();
  cage.add(bellInst);

  root.add(cage);

  return { group: root, flameGroup };
}

export interface ClerestoryShaftSpec {
  pos: [number, number, number];
  rot: [number, number, number];
}

export interface SanctumAtmosphereResult {
  group: THREE.Group;
  uniforms: { uTime: { value: number } };
}

/**
 * Dual custom GLSL atmospheric golden dust & sacred aura particle systems:
 * 1) `shaftDustPoints`: Slowly drifting, Tyndall-lit golden dust motes spawned specifically inside the
 *    central skylight cone and all 4 angled clerestory volumetric light shafts.
 * 2) `monumentAuraPoints`: Softly swirling floating dust & golden incense/pollen particles encircling
 *    the 3 Nativity Statues (Queen Maya Devi, Gautami, Prince Siddhartha) and the Sacred Marker Stone.
 */
export function createSanctumAtmosphereParticles(
  clerestorySpecs: ClerestoryShaftSpec[],
): SanctumAtmosphereResult {
  const group = new THREE.Group();
  group.userData.noMerge = true;
  group.userData.nonCollidable = true;

  const sharedTime = { value: 0 };

  const hash = (i: number, salt: number) => {
    const v = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453123;
    return v - Math.floor(v);
  };

  // =========================================================================
  // 1. VOLUMETRIC LIGHT SHAFT GOLDEN DUST MOTES
  // =========================================================================
  const centralCount = 190;
  const beamPerClerestory = 28;
  const shaftCount = centralCount + clerestorySpecs.length * beamPerClerestory;

  const sPos = new Float32Array(shaftCount * 3);
  const sSeed = new Float32Array(shaftCount);
  const sSize = new Float32Array(shaftCount);
  const sGlow = new Float32Array(shaftCount);

  // Central skylight volumetric cone: y ∈ [0.45, 6.35], radius interpolates 4.1 -> 2.15 around (0, y, -0.30)
  for (let i = 0; i < centralCount; i++) {
    const u = hash(i, 1.3);
    const rFrac = Math.sqrt(hash(i, 4.7)) * 0.92;
    const ang = hash(i, 8.9) * Math.PI * 2;
    const py = 0.45 + u * 5.90;
    const coneR = THREE.MathUtils.lerp(4.10, 2.15, u) * rFrac;
    sPos[i * 3] = Math.cos(ang) * coneR;
    sPos[i * 3 + 1] = py;
    sPos[i * 3 + 2] = -0.30 + Math.sin(ang) * coneR * 0.86;
    sSeed[i] = hash(i, 13.1) * 6.28318;
    sSize[i] = 0.72 + hash(i, 19.7) * 0.85;
    // Brighter when catching the core of the vertical god ray
    sGlow[i] = 1.0 - rFrac * 0.45;
  }

  // Angled Clerestory volumetric rays
  const _beamMat = new THREE.Matrix4();
  const _beamEuler = new THREE.Euler();
  const _beamPos = new THREE.Vector3();
  let cursor = centralCount;
  clerestorySpecs.forEach((cb, bIdx) => {
    _beamEuler.set(cb.rot[0], cb.rot[1], cb.rot[2]);
    _beamMat.makeRotationFromEuler(_beamEuler);
    for (let k = 0; k < beamPerClerestory; k++) {
      const idx = cursor++;
      const u = hash(idx + bIdx * 31, 2.7);
      const rFrac = Math.sqrt(hash(idx, 5.9)) * 0.85;
      const ang = hash(idx, 11.3) * Math.PI * 2;
      const localY = (u - 0.5) * 6.6;
      const beamR = THREE.MathUtils.lerp(1.55, 0.58, u) * rFrac;
      _beamPos.set(Math.cos(ang) * beamR, localY, Math.sin(ang) * beamR).applyMatrix4(_beamMat);
      sPos[idx * 3] = cb.pos[0] + _beamPos.x;
      sPos[idx * 3 + 1] = Math.max(0.45, cb.pos[1] + _beamPos.y);
      sPos[idx * 3 + 2] = cb.pos[2] + _beamPos.z;
      sSeed[idx] = hash(idx, 17.5) * 6.28318;
      sSize[idx] = 0.65 + hash(idx, 23.1) * 0.75;
      sGlow[idx] = 0.92 - rFrac * 0.42;
    }
  });

  const shaftGeo = new THREE.BufferGeometry();
  shaftGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  shaftGeo.setAttribute('aSeed', new THREE.BufferAttribute(sSeed, 1));
  shaftGeo.setAttribute('aSize', new THREE.BufferAttribute(sSize, 1));
  shaftGeo.setAttribute('aGlow', new THREE.BufferAttribute(sGlow, 1));

  const shaftMat = new THREE.ShaderMaterial({
    uniforms: { uTime: sharedTime },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float aSeed;
      attribute float aSize;
      attribute float aGlow;
      uniform float uTime;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        // Slow convective golden dust drift inside volumetric light shafts
        p.x += sin(uTime * 0.24 + aSeed * 1.7 + p.y * 0.38) * 0.28;
        p.z += cos(uTime * 0.21 + aSeed * 2.1 + p.y * 0.34) * 0.25;
        float driftY = mod((p.y - 0.40) + uTime * 0.085 + aSeed * 0.9, 6.0) + 0.40;
        p.y = driftY;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = clamp((30.0 * aSize) / max(1.0, -mv.z), 2.2, 10.5);
        float yMask = smoothstep(0.42, 1.25, p.y) * (1.0 - smoothstep(5.55, 6.45, p.y));
        float glint = 0.50 + 0.50 * sin(uTime * 1.45 + aSeed * 3.1 + p.x * 0.9);
        vAlpha = yMask * aGlow * (0.42 + 0.58 * glint);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float r2 = dot(c, c);
        if (r2 > 0.25) discard;
        float soft = exp(-r2 * 13.5);
        float core = exp(-r2 * 38.0);
        vec3 col = mix(vec3(1.0, 0.80, 0.40), vec3(1.0, 0.95, 0.80), core);
        gl_FragColor = vec4(col, (soft * 0.72 + core * 0.35) * vAlpha);
      }
    `,
  });

  const shaftPoints = new THREE.Points(shaftGeo, shaftMat);
  shaftPoints.name = 'MayaDeviVolumetricShaftDust';
  shaftPoints.renderOrder = 7;
  shaftPoints.frustumCulled = false;
  shaftPoints.userData.noMerge = true;
  shaftPoints.userData.nonCollidable = true;
  group.add(shaftPoints);

  // =========================================================================
  // 2. MONUMENT SANCTUARY DUST & GOLDEN POLLEN AURA (STATUES + MARKER STONE)
  // =========================================================================
  const statueCount = 130;
  const stoneCount = 100;
  const auraCount = statueCount + stoneCount;

  const aPos = new Float32Array(auraCount * 3);
  const aCenter = new Float32Array(auraCount * 3);
  const aSeed = new Float32Array(auraCount);
  const aSpeed = new Float32Array(auraCount);

  // Encircling the 3 Nativity Statues (Queen Maya Devi, Gautami, Baby Siddhartha at z = -3.45)
  for (let i = 0; i < statueCount; i++) {
    const ang = hash(i, 3.1) * Math.PI * 2;
    const rad = 0.42 + Math.sqrt(hash(i, 7.3)) * 1.18;
    const py = 0.98 + hash(i, 11.7) * 2.22;
    aCenter[i * 3] = 0.0;
    aCenter[i * 3 + 1] = py;
    aCenter[i * 3 + 2] = -3.38;

    aPos[i * 3] = Math.cos(ang) * rad * 1.15;
    aPos[i * 3 + 1] = py;
    aPos[i * 3 + 2] = -3.38 + Math.sin(ang) * rad * 0.78;
    aSeed[i] = hash(i, 19.3) * 6.28318;
    aSpeed[i] = 0.16 + hash(i, 29.1) * 0.22;
  }

  // Hovering above & around the Sacred Marker Stone (x = 0, z = +0.65)
  for (let k = 0; k < stoneCount; k++) {
    const idx = statueCount + k;
    const ang = hash(idx, 5.1) * Math.PI * 2;
    const rad = 0.24 + Math.sqrt(hash(idx, 9.7)) * 0.98;
    const py = 0.44 + hash(idx, 14.3) * 1.05;
    aCenter[idx * 3] = 0.0;
    aCenter[idx * 3 + 1] = py;
    aCenter[idx * 3 + 2] = 0.65;

    aPos[idx * 3] = Math.cos(ang) * rad * 1.12;
    aPos[idx * 3 + 1] = py;
    aPos[idx * 3 + 2] = 0.65 + Math.sin(ang) * rad * 0.86;
    aSeed[idx] = hash(idx, 21.7) * 6.28318;
    aSpeed[idx] = 0.18 + hash(idx, 31.3) * 0.24;
  }

  const auraGeo = new THREE.BufferGeometry();
  auraGeo.setAttribute('position', new THREE.BufferAttribute(aPos, 3));
  auraGeo.setAttribute('aCenter', new THREE.BufferAttribute(aCenter, 3));
  auraGeo.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1));
  auraGeo.setAttribute('aSpeed', new THREE.BufferAttribute(aSpeed, 1));

  const auraMat = new THREE.ShaderMaterial({
    uniforms: { uTime: sharedTime },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute vec3 aCenter;
      attribute float aSeed;
      attribute float aSpeed;
      uniform float uTime;
      varying float vAlpha;
      void main() {
        vec2 rel = position.xz - aCenter.xz;
        float theta = uTime * aSpeed * 0.42 + sin(uTime * 0.22 + aSeed) * 0.28;
        float c = cos(theta);
        float s = sin(theta);
        vec2 rotRel = vec2(rel.x * c - rel.y * s, rel.x * s + rel.y * c);
        vec3 p = position;
        p.x = aCenter.x + rotRel.x + sin(uTime * 0.55 + aSeed) * 0.10;
        p.z = aCenter.z + rotRel.y + cos(uTime * 0.48 + aSeed * 1.4) * 0.09;
        p.y += sin(uTime * 0.65 + aSeed * 1.9) * 0.14;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = clamp(24.0 / max(0.8, -mv.z), 2.0, 9.0);
        float pulse = 0.45 + 0.55 * sin(uTime * 1.7 + aSeed * 2.5);
        vAlpha = 0.34 + 0.56 * pulse;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float r2 = dot(c, c);
        if (r2 > 0.25) discard;
        float soft = exp(-r2 * 14.0);
        float core = exp(-r2 * 40.0);
        vec3 col = mix(vec3(1.0, 0.84, 0.46), vec3(1.0, 0.96, 0.84), core);
        gl_FragColor = vec4(col, (soft * 0.68 + core * 0.38) * vAlpha);
      }
    `,
  });

  const auraPoints = new THREE.Points(auraGeo, auraMat);
  auraPoints.name = 'MayaDeviMonumentAuraDust';
  auraPoints.renderOrder = 8;
  auraPoints.frustumCulled = false;
  auraPoints.userData.noMerge = true;
  auraPoints.userData.nonCollidable = true;
  group.add(auraPoints);

  return { group, uniforms: { uTime: sharedTime } };
}

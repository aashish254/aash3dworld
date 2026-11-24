import * as THREE from 'three';
import {
  BirdFlightTrackSpec,
  getWorldTreeSpots,
  groundHeightAt,
  sampleBirdFlightState,
} from './worldLogic';

export type BirdSpeciesKind =
  | 'white_dove'
  | 'blue_rock_pigeon'
  | 'ringneck_dove'
  | 'parakeet_green'
  | 'himalayan_bulbul'
  | 'himalayan_eagle'
  | 'bar_headed_goose';

export interface BirdEnvironmentState {
  elapsed: number;
  windX: number;
  windZ: number;
  windSpeed: number;
  sunColorHex: string;
  skyColorHex: string;
  lanternIntensity: number;
  weather: string;
}

const _envSunColor = new THREE.Color();
const _envSkyColor = new THREE.Color();
const _defaultBirdEnv: BirdEnvironmentState = {
  elapsed: 0,
  windX: 0.45,
  windZ: 0.25,
  windSpeed: 0.52,
  sunColorHex: '#fff4d6',
  skyColorHex: '#93c5fd',
  lanternIntensity: 0.2,
  weather: 'clear',
};

export interface JanakiCourtyardBirdsParams {
  group: THREE.Group;
  animatedNodes: THREE.Object3D[];
}

interface BirdInstanceController {
  root: THREE.Group;
  headPivot: THREE.Group;
  leftWingPivot: THREE.Group;
  rightWingPivot: THREE.Group;
  tailMesh: THREE.Mesh;
  species: BirdSpeciesKind;
  scale: number;
  mode: 'flying' | 'perched';
  track?: BirdFlightTrackSpec;
  flapFreq: number;
  baseYaw: number;
  phase: number;
}

interface BirdPlumageMaterials {
  body: THREE.MeshStandardMaterial;
  wing: THREE.MeshStandardMaterial;
  accent: THREE.MeshStandardMaterial;
  beak: THREE.MeshStandardMaterial;
  feet: THREE.MeshStandardMaterial;
}

function createWingAirfoilGeometry(side: 1 | -1, span: number, chord: number): THREE.ExtrudeGeometry {
  // Planform in XY (X = span outward from shoulder, Y = chord forward/aft; rotated into XZ plane)
  const s = new THREE.Shape();
  s.moveTo(0, chord * 0.42);
  s.quadraticCurveTo(side * span * 0.36, chord * 0.54, side * span * 0.78, chord * 0.22);
  s.quadraticCurveTo(side * span * 1.02, chord * 0.04, side * span, -chord * 0.16);
  s.quadraticCurveTo(side * span * 0.82, -chord * 0.34, side * span * 0.52, -chord * 0.42);
  s.quadraticCurveTo(side * span * 0.24, -chord * 0.50, 0, -chord * 0.38);
  s.closePath();

  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.011,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.005,
    bevelSegments: 2,
    curveSegments: 10,
  });
  // Map Shape X -> +X/-X span, Shape Y -> +Z/-Z chord, Extrude Z -> +Y thickness
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -0.004, 0);
  geo.computeVertexNormals();
  return geo;
}

function createTailFanGeometry(): THREE.ExtrudeGeometry {
  const s = new THREE.Shape();
  s.moveTo(-0.020, 0);
  s.lineTo(0.020, 0);
  s.quadraticCurveTo(0.058, -0.075, 0.056, -0.142);
  s.quadraticCurveTo(0, -0.162, -0.056, -0.142);
  s.quadraticCurveTo(-0.058, -0.075, -0.020, 0);
  s.closePath();

  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.009,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 2,
    curveSegments: 8,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -0.003, 0);
  geo.computeVertexNormals();
  return geo;
}

function createBirdTorsoGeometry(): THREE.LatheGeometry {
  // Axis along +Y in Lathe, rotated so nose faces +Z and tail root faces -Z
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(0.002, -0.132),
    new THREE.Vector2(0.022, -0.112),
    new THREE.Vector2(0.046, -0.068),
    new THREE.Vector2(0.064, -0.012),
    new THREE.Vector2(0.068, 0.042),
    new THREE.Vector2(0.052, 0.088),
    new THREE.Vector2(0.026, 0.114),
    new THREE.Vector2(0.002, 0.122),
  ];
  const geo = new THREE.LatheGeometry(pts, 14);
  geo.rotateX(Math.PI / 2);
  geo.scale(0.92, 0.96, 1.0);
  return geo;
}

/**
 * Populates Janaki Mandir's inner Prangan courtyard and temple skyline with peaceful,
 * sculpted 3D white doves and rock pigeons — circling gracefully overhead in clear air
 * corridors and perched serenely along prayer-wheel eaves and Mughal cornices.
 */
export function createJanakiCourtyardBirds({
  group,
  animatedNodes,
}: JanakiCourtyardBirdsParams): void {
  const birdsRoot = new THREE.Group();
  birdsRoot.name = 'JanakiCourtyardAmbientBirds';
  birdsRoot.userData.noMerge = true;
  birdsRoot.userData.nonCollidable = true;
  group.add(birdsRoot);

  // Shared sculpted avian geometries
  const torsoGeo = createBirdTorsoGeometry();
  const neckGeo = new THREE.CylinderGeometry(0.027, 0.042, 0.068, 12);
  const headGeo = new THREE.SphereGeometry(0.036, 12, 10);
  headGeo.scale(0.9, 0.96, 1.14);
  const beakGeo = new THREE.ConeGeometry(0.010, 0.038, 8);
  beakGeo.rotateX(Math.PI / 2);
  const eyeGeo = new THREE.SphereGeometry(0.0058, 6, 6);
  const tailGeo = createTailFanGeometry();
  const leftWingGeo = createWingAirfoilGeometry(1, 0.255, 0.12);
  const rightWingGeo = createWingAirfoilGeometry(-1, 0.255, 0.12);
  const leftCovertGeo = createWingAirfoilGeometry(1, 0.145, 0.075);
  const rightCovertGeo = createWingAirfoilGeometry(-1, 0.145, 0.075);
  const legGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.042, 6);
  const footBarGeo = new THREE.BoxGeometry(0.018, 0.006, 0.028);

  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x16181d,
    roughness: 0.2,
    metalness: 0.1,
  });

  const palette: Record<BirdSpeciesKind, BirdPlumageMaterials> = {
    white_dove: {
      body: new THREE.MeshStandardMaterial({
        color: 0xf4f0e8,
        roughness: 0.72,
        metalness: 0.02,
      }),
      wing: new THREE.MeshStandardMaterial({
        color: 0xeae5da,
        roughness: 0.74,
        metalness: 0.02,
      }),
      accent: new THREE.MeshStandardMaterial({
        color: 0xd4cdc0,
        roughness: 0.76,
        metalness: 0.02,
      }),
      beak: new THREE.MeshStandardMaterial({
        color: 0xc98074,
        roughness: 0.5,
        metalness: 0.04,
      }),
      feet: new THREE.MeshStandardMaterial({
        color: 0xc17469,
        roughness: 0.56,
        metalness: 0.02,
      }),
    },
    blue_rock_pigeon: {
      body: new THREE.MeshStandardMaterial({
        color: 0x87919e,
        roughness: 0.7,
        metalness: 0.05,
      }),
      wing: new THREE.MeshStandardMaterial({
        color: 0x707b88,
        roughness: 0.72,
        metalness: 0.04,
      }),
      accent: new THREE.MeshStandardMaterial({
        color: 0x3b484f,
        roughness: 0.55,
        metalness: 0.16,
      }),
      beak: new THREE.MeshStandardMaterial({
        color: 0x383b42,
        roughness: 0.45,
        metalness: 0.06,
      }),
      feet: new THREE.MeshStandardMaterial({
        color: 0xb96a60,
        roughness: 0.58,
        metalness: 0.02,
      }),
    },
    ringneck_dove: {
      body: new THREE.MeshStandardMaterial({
        color: 0xe0d3bf,
        roughness: 0.74,
        metalness: 0.02,
      }),
      wing: new THREE.MeshStandardMaterial({
        color: 0xcbbba4,
        roughness: 0.75,
        metalness: 0.02,
      }),
      accent: new THREE.MeshStandardMaterial({
        color: 0x5c4d41,
        roughness: 0.68,
        metalness: 0.04,
      }),
      beak: new THREE.MeshStandardMaterial({
        color: 0x514742,
        roughness: 0.48,
        metalness: 0.04,
      }),
      feet: new THREE.MeshStandardMaterial({
        color: 0xc0776d,
        roughness: 0.56,
        metalness: 0.02,
      }),
    },
    parakeet_green: {
      body: new THREE.MeshStandardMaterial({
        color: 0x4b933b,
        roughness: 0.66,
        metalness: 0.03,
      }),
      wing: new THREE.MeshStandardMaterial({
        color: 0x3b7b30,
        roughness: 0.68,
        metalness: 0.03,
      }),
      accent: new THREE.MeshStandardMaterial({
        color: 0x265a2a,
        roughness: 0.64,
        metalness: 0.04,
      }),
      beak: new THREE.MeshStandardMaterial({
        color: 0xd14d35,
        roughness: 0.42,
        metalness: 0.05,
      }),
      feet: new THREE.MeshStandardMaterial({
        color: 0x8d8375,
        roughness: 0.56,
        metalness: 0.02,
      }),
    },
    himalayan_bulbul: {
      body: new THREE.MeshStandardMaterial({
        color: 0x625344,
        roughness: 0.72,
        metalness: 0.02,
      }),
      wing: new THREE.MeshStandardMaterial({
        color: 0x4f4338,
        roughness: 0.74,
        metalness: 0.02,
      }),
      accent: new THREE.MeshStandardMaterial({
        color: 0x2a2523,
        roughness: 0.62,
        metalness: 0.04,
      }),
      beak: new THREE.MeshStandardMaterial({
        color: 0x262424,
        roughness: 0.45,
        metalness: 0.04,
      }),
      feet: new THREE.MeshStandardMaterial({
        color: 0x463d39,
        roughness: 0.56,
        metalness: 0.02,
      }),
    },
    himalayan_eagle: {
      body: new THREE.MeshStandardMaterial({
        color: 0x4e3928,
        roughness: 0.72,
        metalness: 0.04,
      }),
      wing: new THREE.MeshStandardMaterial({
        color: 0x35251a,
        roughness: 0.74,
        metalness: 0.04,
      }),
      accent: new THREE.MeshStandardMaterial({
        color: 0xc29b58,
        roughness: 0.64,
        metalness: 0.06,
      }),
      beak: new THREE.MeshStandardMaterial({
        color: 0xdba832,
        roughness: 0.42,
        metalness: 0.08,
      }),
      feet: new THREE.MeshStandardMaterial({
        color: 0xd6a43c,
        roughness: 0.52,
        metalness: 0.04,
      }),
    },
    bar_headed_goose: {
      body: new THREE.MeshStandardMaterial({
        color: 0xd4dce4,
        roughness: 0.7,
        metalness: 0.03,
      }),
      wing: new THREE.MeshStandardMaterial({
        color: 0x9aa6b4,
        roughness: 0.72,
        metalness: 0.04,
      }),
      accent: new THREE.MeshStandardMaterial({
        color: 0x22262d,
        roughness: 0.66,
        metalness: 0.04,
      }),
      beak: new THREE.MeshStandardMaterial({
        color: 0xe38f34,
        roughness: 0.45,
        metalness: 0.05,
      }),
      feet: new THREE.MeshStandardMaterial({
        color: 0xdf8235,
        roughness: 0.52,
        metalness: 0.03,
      }),
    },
  };

  function buildBirdMesh(
    species: BirdSpeciesKind,
    scale: number,
    showLegs: boolean,
  ): Omit<BirdInstanceController, 'mode' | 'track' | 'flapFreq' | 'baseYaw' | 'phase'> {
    const mats = palette[species];
    const root = new THREE.Group();
    root.scale.setScalar(scale);

    const torso = new THREE.Mesh(torsoGeo, mats.body);
    torso.castShadow = false;
    torso.receiveShadow = false;
    root.add(torso);

    // Head & neck pivot for natural perched look-around & bobbing
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 0.036, 0.088);

    const neck = new THREE.Mesh(neckGeo, species === 'white_dove' ? mats.body : mats.accent);
    neck.position.set(0, 0.018, 0.008);
    neck.rotation.x = 0.28;
    headPivot.add(neck);

    const head = new THREE.Mesh(headGeo, mats.body);
    head.position.set(0, 0.048, 0.024);
    headPivot.add(head);

    const beak = new THREE.Mesh(beakGeo, mats.beak);
    beak.position.set(0, 0.043, 0.072);
    beak.rotation.x = 0.14;
    headPivot.add(beak);

    for (const ex of [-0.028, 0.028]) {
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(ex, 0.056, 0.038);
      headPivot.add(eye);
    }
    root.add(headPivot);

    // Fanned tail
    const tailMesh = new THREE.Mesh(tailGeo, mats.accent);
    tailMesh.position.set(0, 0.014, -0.102);
    tailMesh.rotation.x = 0.08;
    root.add(tailMesh);

    // Articulated left & right shoulder wing pivots
    const leftWingPivot = new THREE.Group();
    leftWingPivot.position.set(0.044, 0.026, 0.018);
    const lMain = new THREE.Mesh(leftWingGeo, mats.wing);
    const lCov = new THREE.Mesh(leftCovertGeo, mats.accent);
    lCov.position.set(0.004, 0.009, 0.006);
    leftWingPivot.add(lMain, lCov);

    const rightWingPivot = new THREE.Group();
    rightWingPivot.position.set(-0.044, 0.026, 0.018);
    const rMain = new THREE.Mesh(rightWingGeo, mats.wing);
    const rCov = new THREE.Mesh(rightCovertGeo, mats.accent);
    rCov.position.set(-0.004, 0.009, 0.006);
    rightWingPivot.add(rMain, rCov);

    root.add(leftWingPivot, rightWingPivot);

    if (showLegs) {
      for (const lx of [-0.024, 0.024]) {
        const leg = new THREE.Mesh(legGeo, mats.feet);
        leg.position.set(lx, -0.068, 0.008);
        const foot = new THREE.Mesh(footBarGeo, mats.feet);
        foot.position.set(lx, -0.088, 0.014);
        root.add(leg, foot);
      }
    }

    birdsRoot.add(root);
    return {
      root,
      headPivot,
      leftWingPivot,
      rightWingPivot,
      tailMesh,
      species,
      scale,
    };
  }

  const controllers: BirdInstanceController[] = [];

  // -------------------------------------------------------------------------
  // 1. OPEN-AIR COURTYARD FLYING FLOCK (11 sculpted doves & pigeons)
  // -------------------------------------------------------------------------
  const flightSpecs: Array<{
    species: BirdSpeciesKind;
    scale: number;
    flapFreq: number;
    track: BirdFlightTrackSpec;
  }> = [
    // South Open Courtyard Sky Oval (4 birds visibly gliding across the central Prangan vista at 3.2-4.7m)
    {
      species: 'white_dove',
      scale: 1.24,
      flapFreq: 24,
      track: { centerX: 0, centerZ: 7.2, radiusX: 7.6, radiusZ: 1.9, baseY: 3.55, bobAmp: 0.36, angularSpeed: 0.25, phase: 0.3 },
    },
    {
      species: 'blue_rock_pigeon',
      scale: 1.2,
      flapFreq: 26,
      track: { centerX: 0, centerZ: 7.2, radiusX: 7.9, radiusZ: 2.0, baseY: 4.05, bobAmp: 0.38, angularSpeed: 0.25, phase: 1.15 },
    },
    {
      species: 'white_dove',
      scale: 1.16,
      flapFreq: 25,
      track: { centerX: 0, centerZ: 7.1, radiusX: 7.1, radiusZ: 1.85, baseY: 4.45, bobAmp: 0.36, angularSpeed: -0.23, phase: 3.4 },
    },
    {
      species: 'ringneck_dove',
      scale: 1.15,
      flapFreq: 27,
      track: { centerX: 0, centerZ: 7.3, radiusX: 8.1, radiusZ: 1.95, baseY: 3.35, bobAmp: 0.34, angularSpeed: 0.22, phase: 4.55 },
    },

    // East Prangan Courtyard Loop (2 birds soaring above East Charbagh & Prayer-Wheel gallery)
    {
      species: 'blue_rock_pigeon',
      scale: 1.22,
      flapFreq: 25,
      track: { centerX: 8.2, centerZ: -1.1, radiusX: 3.0, radiusZ: 5.9, baseY: 3.7, bobAmp: 0.42, angularSpeed: 0.27, phase: 0.8, figureEight: 0.16 },
    },
    {
      species: 'white_dove',
      scale: 1.18,
      flapFreq: 24,
      track: { centerX: 8.2, centerZ: -1.1, radiusX: 3.2, radiusZ: 6.0, baseY: 4.35, bobAmp: 0.4, angularSpeed: 0.27, phase: 1.7, figureEight: 0.16 },
    },

    // West Prangan Courtyard Loop (2 birds soaring above West Charbagh & Prayer-Wheel gallery)
    {
      species: 'white_dove',
      scale: 1.2,
      flapFreq: 25,
      track: { centerX: -8.2, centerZ: -1.1, radiusX: 3.0, radiusZ: 5.9, baseY: 3.85, bobAmp: 0.42, angularSpeed: -0.26, phase: 2.2, figureEight: 0.16 },
    },
    {
      species: 'ringneck_dove',
      scale: 1.14,
      flapFreq: 26,
      track: { centerX: -8.2, centerZ: -1.1, radiusX: 3.15, radiusZ: 5.8, baseY: 4.45, bobAmp: 0.38, angularSpeed: -0.26, phase: 3.05, figureEight: 0.16 },
    },

    // High Temple Skyline Thermal Soar (3 birds gracefully circling well above all domes)
    {
      species: 'white_dove',
      scale: 1.28,
      flapFreq: 22,
      track: { centerX: 0, centerZ: 0.6, radiusX: 14.5, radiusZ: 11.2, baseY: 14.8, bobAmp: 0.85, angularSpeed: 0.16, phase: 0.4 },
    },
    {
      species: 'blue_rock_pigeon',
      scale: 1.25,
      flapFreq: 23,
      track: { centerX: 0, centerZ: 0.6, radiusX: 15.0, radiusZ: 11.6, baseY: 15.5, bobAmp: 0.9, angularSpeed: 0.16, phase: 1.15 },
    },
    {
      species: 'white_dove',
      scale: 1.22,
      flapFreq: 22,
      track: { centerX: 0, centerZ: 0.6, radiusX: 13.8, radiusZ: 10.8, baseY: 16.2, bobAmp: 0.8, angularSpeed: 0.16, phase: 4.1 },
    },
  ];

  for (const spec of flightSpecs) {
    const parts = buildBirdMesh(spec.species, spec.scale, false);
    controllers.push({
      ...parts,
      mode: 'flying',
      track: spec.track,
      flapFreq: spec.flapFreq,
      baseYaw: 0,
      phase: spec.track.phase,
    });
  }

  // -------------------------------------------------------------------------
  // 2. SERENE PERCHED COURTYARD DOVES & PIGEONS (5 birds on elevated eaves)
  // -------------------------------------------------------------------------
  const perchedSpecs: Array<{
    species: BirdSpeciesKind;
    scale: number;
    x: number;
    y: number;
    z: number;
    yaw: number;
    phase: number;
  }> = [
    // East & West Prayer-Wheel gallery rack flat teal eaves (roof top at y = 2.285m)
    { species: 'white_dove', scale: 1.15, x: 12.18, y: 2.285, z: -1.35, yaw: -Math.PI * 0.56, phase: 0.7 },
    { species: 'blue_rock_pigeon', scale: 1.18, x: 12.22, y: 2.285, z: 1.28, yaw: -Math.PI * 0.42, phase: 2.3 },
    { species: 'ringneck_dove', scale: 1.12, x: -12.18, y: 2.285, z: 0.95, yaw: Math.PI * 0.48, phase: 4.1 },
    // Central Mughal Gate & Inner Simha Pishtaq cornice ledges (clear between kumbhas)
    { species: 'white_dove', scale: 1.18, x: -1.92, y: 5.63, z: 0.44, yaw: 0.25, phase: 1.5 },
    { species: 'blue_rock_pigeon', scale: 1.15, x: 1.35, y: 5.68, z: 11.05, yaw: Math.PI - 0.3, phase: 3.6 },
  ];

  for (const spec of perchedSpecs) {
    const parts = buildBirdMesh(spec.species, spec.scale, true);
    // Sit feet cleanly on ledge surface (foot bottom = -0.091 * scale)
    parts.root.position.set(spec.x, spec.y + 0.091 * spec.scale, spec.z);
    parts.root.rotation.order = 'YXZ';
    parts.root.rotation.set(0.08, spec.yaw, 0);
    // Tuck wings neatly along sides of body
    parts.leftWingPivot.rotation.set(0.18, 1.18, -0.22);
    parts.rightWingPivot.rotation.set(0.18, -1.18, 0.22);
    parts.tailMesh.rotation.x = -0.22;

    controllers.push({
      ...parts,
      mode: 'perched',
      flapFreq: 18,
      baseYaw: spec.yaw,
      phase: spec.phase,
    });
  }

  // Register animation controller inside animatedNodes (invoked every tick + syncLighting)
  const birdController = new THREE.Object3D();
  birdController.name = 'JanakiCourtyardBirdsController';
  birdController.userData.noMerge = true;
  birdController.userData.onFlickerUpdate = (elapsed: number) => {
    for (let i = 0; i < controllers.length; i++) {
      const bird = controllers[i];
      if (bird.mode === 'flying' && bird.track) {
        const s = sampleBirdFlightState(bird.track, elapsed, bird.flapFreq);
        bird.root.position.set(s.x, s.y, s.z);
        bird.root.rotation.order = 'YXZ';
        bird.root.rotation.set(s.pitch, s.yaw, s.roll);

        bird.leftWingPivot.rotation.set(0, 0, s.wingFlapRad);
        bird.rightWingPivot.rotation.set(0, 0, -s.wingFlapRad);
        bird.headPivot.rotation.set(-s.pitch * 0.55, 0, 0);
        bird.tailMesh.rotation.x = 0.08 + s.wingFlapRad * 0.12;
      } else {
        // Gentle perched head-look, pigeon bobbing, and occasional soft wing preen/flutter
        const lookPhase = elapsed * 0.9 + bird.phase;
        const headYaw = Math.sin(lookPhase) * 0.34 + Math.sin(lookPhase * 2.3) * 0.14;
        const headPitch = 0.06 + Math.max(0, Math.sin(elapsed * 2.1 + bird.phase * 1.7)) * 0.14;
        bird.headPivot.rotation.set(headPitch, headYaw, 0);

        const bodyTurn = Math.sin(elapsed * 0.28 + bird.phase) * 0.12;
        bird.root.rotation.y = bird.baseYaw + bodyTurn;

        // Subtle occasional wing shuffle every ~9s
        const flutterCycle = ((elapsed * 0.11 + bird.phase * 0.43) % 1 + 1) % 1;
        const flutter =
          flutterCycle > 0.88
            ? Math.sin((flutterCycle - 0.88) * 110) * 0.22
            : 0;
        bird.leftWingPivot.rotation.set(0.18, 1.18 - Math.abs(flutter) * 0.4, -0.22 + flutter);
        bird.rightWingPivot.rotation.set(0.18, -1.18 + Math.abs(flutter) * 0.4, 0.22 - flutter);
      }
    }
  };

  // Initialize Frame 0 pose immediately
  birdController.userData.onFlickerUpdate(0);
  birdsRoot.add(birdController);
  animatedNodes.push(birdController);
}

/**
 * Spawns procedural animated flocks & tree-perched birds across the wider Nepal Valley:
 * Janaki exterior Chautara peepal trees & Ganga Sagar, Lumbini Peace Garden,
 * Pumdikot & Glacial Lake shores, Pashupatinath groves, and valley Deodar/Rhododendron canopies.
 */
export function createAmbientWorldBirds(): {
  group: THREE.Group;
  controller: THREE.Object3D;
} {
  const worldBirdsGroup = new THREE.Group();
  worldBirdsGroup.name = 'WorldAmbientBirds';
  worldBirdsGroup.userData.noMerge = true;
  worldBirdsGroup.userData.nonCollidable = true;

  const torsoGeo = createBirdTorsoGeometry();
  const neckGeo = new THREE.CylinderGeometry(0.026, 0.04, 0.064, 10);
  const headGeo = new THREE.SphereGeometry(0.034, 10, 8);
  headGeo.scale(0.9, 0.96, 1.12);
  const beakGeo = new THREE.ConeGeometry(0.0095, 0.036, 7);
  beakGeo.rotateX(Math.PI / 2);
  const tailGeo = createTailFanGeometry();
  const leftWingGeo = createWingAirfoilGeometry(1, 0.25, 0.115);
  const rightWingGeo = createWingAirfoilGeometry(-1, 0.25, 0.115);
  const leftSoarWingGeo = createWingAirfoilGeometry(1, 0.36, 0.135);
  const rightSoarWingGeo = createWingAirfoilGeometry(-1, 0.36, 0.135);

  const speciesMats: Record<
    BirdSpeciesKind,
    { body: THREE.MeshStandardMaterial; wing: THREE.MeshStandardMaterial; beak: THREE.MeshStandardMaterial }
  > = {
    white_dove: {
      body: new THREE.MeshStandardMaterial({ color: 0xf4f0e8, roughness: 0.72 }),
      wing: new THREE.MeshStandardMaterial({ color: 0xe6dfd3, roughness: 0.74 }),
      beak: new THREE.MeshStandardMaterial({ color: 0xc87f73, roughness: 0.5 }),
    },
    blue_rock_pigeon: {
      body: new THREE.MeshStandardMaterial({ color: 0x7e8a98, roughness: 0.7 }),
      wing: new THREE.MeshStandardMaterial({ color: 0x5c6878, roughness: 0.72 }),
      beak: new THREE.MeshStandardMaterial({ color: 0x3b3e45, roughness: 0.48 }),
    },
    ringneck_dove: {
      body: new THREE.MeshStandardMaterial({ color: 0xded1bc, roughness: 0.74 }),
      wing: new THREE.MeshStandardMaterial({ color: 0xbda991, roughness: 0.74 }),
      beak: new THREE.MeshStandardMaterial({ color: 0x524843, roughness: 0.48 }),
    },
    parakeet_green: {
      body: new THREE.MeshStandardMaterial({ color: 0x4b933b, roughness: 0.68 }),
      wing: new THREE.MeshStandardMaterial({ color: 0x316f2a, roughness: 0.7 }),
      beak: new THREE.MeshStandardMaterial({ color: 0xd14d35, roughness: 0.42 }),
    },
    himalayan_bulbul: {
      body: new THREE.MeshStandardMaterial({ color: 0x625344, roughness: 0.74 }),
      wing: new THREE.MeshStandardMaterial({ color: 0x3f3630, roughness: 0.74 }),
      beak: new THREE.MeshStandardMaterial({ color: 0x2a2726, roughness: 0.45 }),
    },
    himalayan_eagle: {
      body: new THREE.MeshStandardMaterial({ color: 0x523c29, roughness: 0.72 }),
      wing: new THREE.MeshStandardMaterial({ color: 0x35251a, roughness: 0.74 }),
      beak: new THREE.MeshStandardMaterial({ color: 0xdead37, roughness: 0.44 }),
    },
    bar_headed_goose: {
      body: new THREE.MeshStandardMaterial({ color: 0xd9e1e8, roughness: 0.7 }),
      wing: new THREE.MeshStandardMaterial({ color: 0x8e9ba8, roughness: 0.72 }),
      beak: new THREE.MeshStandardMaterial({ color: 0xe38f34, roughness: 0.46 }),
    },
  };

  // Store canonical base colors so environmental sun/sky bounce tinting allocates zero objects per frame
  const plumageEntries: Array<{ mat: THREE.MeshStandardMaterial; baseColor: THREE.Color }> = [];
  for (const key of Object.keys(speciesMats) as BirdSpeciesKind[]) {
    const entry = speciesMats[key];
    plumageEntries.push(
      { mat: entry.body, baseColor: entry.body.color.clone() },
      { mat: entry.wing, baseColor: entry.wing.color.clone() },
    );
  }

  interface WorldBirdNode {
    root: THREE.Group;
    headPivot: THREE.Group;
    leftWing: THREE.Group;
    rightWing: THREE.Group;
    tailMesh: THREE.Mesh;
    mode: 'flying' | 'perched';
    isHighSky: boolean;
    soaringRatio: number;
    track?: BirdFlightTrackSpec;
    flapFreq: number;
    baseYaw: number;
    phase: number;
    windSensitivity: number;
    formationSideOffset: number;
    formationBackOffset: number;
  }

  const birds: WorldBirdNode[] = [];
  const spawnBird = (
    species: BirdSpeciesKind,
    scale: number,
    mode: 'flying' | 'perched',
    opts: {
      track?: BirdFlightTrackSpec;
      flapFreq: number;
      x?: number;
      y?: number;
      z?: number;
      yaw?: number;
      phase: number;
      isHighSky?: boolean;
      soaringRatio?: number;
      windSensitivity?: number;
      formationSideOffset?: number;
      formationBackOffset?: number;
    },
  ) => {
    const mats = speciesMats[species];
    const root = new THREE.Group();
    root.scale.setScalar(scale);

    const torso = new THREE.Mesh(torsoGeo, mats.body);
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 0.034, 0.084);
    const neck = new THREE.Mesh(neckGeo, mats.body);
    neck.position.set(0, 0.016, 0.008);
    neck.rotation.x = 0.26;
    const head = new THREE.Mesh(headGeo, mats.body);
    head.position.set(0, 0.045, 0.022);
    const beak = new THREE.Mesh(beakGeo, mats.beak);
    beak.position.set(0, 0.04, 0.068);
    beak.rotation.x = 0.14;
    headPivot.add(neck, head, beak);

    const tailMesh = new THREE.Mesh(tailGeo, mats.wing);
    tailMesh.position.set(0, 0.014, -0.098);
    tailMesh.rotation.x = 0.08;

    const useSoarWings = species === 'himalayan_eagle' || species === 'bar_headed_goose';
    const leftWing = new THREE.Group();
    leftWing.position.set(0.042, 0.025, 0.016);
    leftWing.add(new THREE.Mesh(useSoarWings ? leftSoarWingGeo : leftWingGeo, mats.wing));

    const rightWing = new THREE.Group();
    rightWing.position.set(-0.042, 0.025, 0.016);
    rightWing.add(new THREE.Mesh(useSoarWings ? rightSoarWingGeo : rightWingGeo, mats.wing));

    root.add(torso, headPivot, tailMesh, leftWing, rightWing);
    if (mode === 'perched') {
      root.position.set(opts.x ?? 0, opts.y ?? 2, opts.z ?? 0);
      root.rotation.order = 'YXZ';
      root.rotation.set(0.08, opts.yaw ?? 0, 0);
      leftWing.rotation.set(0.18, 1.18, -0.22);
      rightWing.rotation.set(0.18, -1.18, 0.22);
    }
    worldBirdsGroup.add(root);
    birds.push({
      root,
      headPivot,
      leftWing,
      rightWing,
      tailMesh,
      mode,
      isHighSky: opts.isHighSky ?? false,
      soaringRatio: opts.soaringRatio ?? 0,
      track: opts.track,
      flapFreq: opts.flapFreq,
      baseYaw: opts.yaw ?? 0,
      phase: opts.phase,
      windSensitivity: opts.windSensitivity ?? (opts.isHighSky ? 1.35 : 0.75),
      formationSideOffset: opts.formationSideOffset ?? 0,
      formationBackOffset: opts.formationBackOffset ?? 0,
    });
  };

  // 1. Flying flocks circling Janaki exterior Ganga Sagar pond, Lumbini Peace Garden,
  //    Pumdikot / Glacial Lake shores, Pashupatinath courtyard & central valley
  const worldFlightTracks: Array<{
    species: BirdSpeciesKind;
    scale: number;
    flapFreq: number;
    isHighSky?: boolean;
    soaringRatio?: number;
    windSensitivity?: number;
    formationSideOffset?: number;
    formationBackOffset?: number;
    track: BirdFlightTrackSpec;
  }> = [
    // Ganga Sagar & West Janaki Vivah Mandap thermal loops (-136.5, 110)
    {
      species: 'white_dove',
      scale: 1.25,
      flapFreq: 22,
      track: { centerX: -136.5, centerZ: 112.0, radiusX: 11.5, radiusZ: 9.2, baseY: groundHeightAt(-136.5, 112.0) + 6.4, bobAmp: 0.75, angularSpeed: 0.24, phase: 0.3, figureEight: 0.22 },
    },
    {
      species: 'parakeet_green',
      scale: 1.15,
      flapFreq: 28,
      track: { centerX: -136.5, centerZ: 112.0, radiusX: 10.2, radiusZ: 8.6, baseY: groundHeightAt(-136.5, 112.0) + 5.3, bobAmp: 0.65, angularSpeed: 0.29, phase: 1.4 },
    },
    // Janaki North & East exterior gardens
    {
      species: 'parakeet_green',
      scale: 1.14,
      flapFreq: 27,
      track: { centerX: -92.0, centerZ: 64.0, radiusX: 15.0, radiusZ: 6.2, baseY: groundHeightAt(-92, 64) + 7.2, bobAmp: 0.55, angularSpeed: -0.22, phase: 2.1 },
    },
    // Lumbini Peace Garden (-8, 120)
    {
      species: 'white_dove',
      scale: 1.22,
      flapFreq: 23,
      track: { centerX: -8, centerZ: 120, radiusX: 11.2, radiusZ: 9.8, baseY: groundHeightAt(-8, 120) + 6.8, bobAmp: 0.7, angularSpeed: 0.21, phase: 0.9 },
    },
    {
      species: 'ringneck_dove',
      scale: 1.18,
      flapFreq: 24,
      track: { centerX: -8, centerZ: 120, radiusX: 10.4, radiusZ: 10.6, baseY: groundHeightAt(-8, 120) + 7.6, bobAmp: 0.65, angularSpeed: 0.21, phase: 1.9 },
    },
    // Pashupatinath courtyard (-48, -24)
    {
      species: 'blue_rock_pigeon',
      scale: 1.2,
      flapFreq: 25,
      track: { centerX: -48, centerZ: -24, radiusX: 12.0, radiusZ: 10.5, baseY: groundHeightAt(-48, -24) + 7.5, bobAmp: 0.75, angularSpeed: -0.22, phase: 2.8 },
    },
    {
      species: 'himalayan_bulbul',
      scale: 1.12,
      flapFreq: 29,
      track: { centerX: -48, centerZ: -24, radiusX: 11.4, radiusZ: 10.0, baseY: groundHeightAt(-48, -24) + 6.4, bobAmp: 0.58, angularSpeed: -0.24, phase: 3.6 },
    },
    // Pumdikot Shiva & Glacial Lake shores (-116, -96)
    {
      species: 'white_dove',
      scale: 1.28,
      flapFreq: 21,
      track: { centerX: -120, centerZ: -102, radiusX: 18.0, radiusZ: 14.5, baseY: groundHeightAt(-118, -98) + 8.8, bobAmp: 0.95, angularSpeed: 0.17, phase: 0.5, figureEight: 0.18 },
    },
    {
      species: 'himalayan_bulbul',
      scale: 1.15,
      flapFreq: 27,
      track: { centerX: -108, centerZ: -74, radiusX: 9.8, radiusZ: 9.2, baseY: groundHeightAt(-108, -74) + 8.4, bobAmp: 0.6, angularSpeed: 0.24, phase: 4.1 },
    },
    // Swayambhunath & Boudhanath Stupa high circles
    {
      species: 'white_dove',
      scale: 1.24,
      flapFreq: 22,
      track: { centerX: -54, centerZ: -92, radiusX: 12.5, radiusZ: 12.5, baseY: groundHeightAt(-54, -92) + 9.2, bobAmp: 0.7, angularSpeed: 0.2, phase: 1.7 },
    },
  ];

  // 1b. Procedurally spawned high-sky Himalayan Eagles, Migratory Geese V-formation & Alpine Swifts
  const eagleThermals: Array<[number, number, number, number, number, number]> = [
    [-82, -138, 42, 28, 36.0, 0.095],
    [18, -142, 48, 30, 38.5, -0.085],
    [-112, -55, 34, 26, 29.0, 0.11],
    [48, -16, 38, 30, 27.5, -0.105],
    [-46, 36, 44, 34, 26.0, 0.1],
    [-95, 86, 36, 26, 31.0, -0.09],
  ];
  eagleThermals.forEach(([cx, cz, rx, rz, alt, angSpd], idx) => {
    worldFlightTracks.push({
      species: 'himalayan_eagle',
      scale: 1.85 + (idx % 3) * 0.14,
      flapFreq: 13.5,
      isHighSky: true,
      soaringRatio: 0.72,
      windSensitivity: 1.45,
      track: {
        centerX: cx,
        centerZ: cz,
        radiusX: rx,
        radiusZ: rz,
        baseY: alt,
        bobAmp: 1.45,
        angularSpeed: angSpd,
        phase: idx * 1.17,
        figureEight: idx % 2 === 0 ? 0.24 : 0,
      },
    });
  });

  // Cohesive V-formation of 5 migratory Bar-headed Geese crossing the sky
  const gooseVOffsets: Array<[number, number]> = [
    [0, 0],
    [-2.4, -2.6],
    [2.4, -2.6],
    [-4.8, -5.2],
    [4.8, -5.2],
  ];
  gooseVOffsets.forEach(([sideOff, backOff], idx) => {
    worldFlightTracks.push({
      species: 'bar_headed_goose',
      scale: 1.46,
      flapFreq: 17.5,
      isHighSky: true,
      soaringRatio: 0.25,
      windSensitivity: 1.25,
      formationSideOffset: sideOff,
      formationBackOffset: backOff,
      track: {
        centerX: -22,
        centerZ: -8,
        radiusX: 92,
        radiusZ: 68,
        baseY: 28.5 + idx * 0.35,
        bobAmp: 0.65,
        angularSpeed: 0.068,
        phase: 0.85,
      },
    });
  });

  // High alpine swift & dove pairs wheeling across central & eastern valley sky
  for (let sIdx = 0; sIdx < 5; sIdx++) {
    const a = (sIdx / 5) * Math.PI * 2;
    worldFlightTracks.push({
      species: sIdx % 2 === 0 ? 'white_dove' : 'blue_rock_pigeon',
      scale: 1.32,
      flapFreq: 21 + (sIdx % 3) * 2,
      isHighSky: true,
      soaringRatio: 0.32,
      windSensitivity: 1.15,
      track: {
        centerX: Math.cos(a) * 34 - 16,
        centerZ: Math.sin(a) * 32 + 12,
        radiusX: 22 + (sIdx % 3) * 5,
        radiusZ: 18 + (sIdx % 2) * 6,
        baseY: 16.5 + (sIdx % 3) * 2.4,
        bobAmp: 0.85,
        angularSpeed: (sIdx % 2 === 0 ? 1 : -1) * (0.16 + sIdx * 0.015),
        phase: sIdx * 1.4,
      },
    });
  }

  for (const spec of worldFlightTracks) {
    spawnBird(spec.species, spec.scale, 'flying', {
      track: spec.track,
      flapFreq: spec.flapFreq,
      phase: spec.track.phase,
      isHighSky: spec.isHighSky,
      soaringRatio: spec.soaringRatio,
      windSensitivity: spec.windSensitivity,
      formationSideOffset: spec.formationSideOffset,
      formationBackOffset: spec.formationBackOffset,
    });
  }

  // 2. Tree-perched animated birds along Janaki exterior Chautara peepal crowns + valley trees
  const janakiChautaraTrees: Array<[number, number, BirdSpeciesKind]> = [
    [-92 + 13.5, 94 - 28.5, 'parakeet_green'],
    [-92 - 13.5, 94 - 28.5, 'himalayan_bulbul'],
    [-92 - 32.5, 94 - 10.0, 'white_dove'],
    [-92 + 32.5, 94 - 17.5, 'ringneck_dove'],
  ];
  janakiChautaraTrees.forEach(([tx, tz, sp], idx) => {
    const gy = groundHeightAt(tx, tz);
    spawnBird(sp, 1.18, 'perched', {
      x: tx + (idx % 2 === 0 ? 0.85 : -0.78),
      y: gy + 4.95,
      z: tz + 0.42,
      yaw: idx * 1.4,
      flapFreq: 18,
      phase: idx * 1.3,
    });
  });

  // Valley tree-crown perches sampled deterministically from canonical getWorldTreeSpots()
  const treeSpots = getWorldTreeSpots();
  const speciesOrder: BirdSpeciesKind[] = [
    'himalayan_bulbul',
    'parakeet_green',
    'ringneck_dove',
    'blue_rock_pigeon',
    'white_dove',
  ];
  const step = Math.max(1, Math.floor(treeSpots.length / 10));
  for (let i = 0, pIdx = 0; i < treeSpots.length && pIdx < 10; i += step, pIdx++) {
    const tr = treeSpots[i];
    const gy = groundHeightAt(tr.x, tr.z);
    const perchY =
      gy + (tr.type === 'rhodo' ? 3.05 : tr.type === 'palm' ? 4.45 : 4.25) * tr.scale;
    const radial = tr.type === 'rhodo' ? 0.52 : 0.72;
    const angle = pIdx * 1.85;
    spawnBird(speciesOrder[pIdx % speciesOrder.length], 1.15, 'perched', {
      x: tr.x + Math.cos(angle) * radial,
      y: perchY,
      z: tr.z + Math.sin(angle) * radial,
      yaw: angle + Math.PI * 0.5,
      flapFreq: 19,
      phase: pIdx * 0.95,
    });
  }

  const controller = new THREE.Object3D();
  controller.name = 'WorldAmbientBirdsController';
  controller.userData.noMerge = true;

  const updateBirdsWithEnv = (env: BirdEnvironmentState) => {
    const { elapsed, windX, windZ, windSpeed, sunColorHex, skyColorHex, lanternIntensity, weather } = env;
    _envSunColor.set(sunColorHex);
    _envSkyColor.set(skyColorHex);

    const nightFactor = Math.max(0, Math.min(1, (lanternIntensity - 1.2) / 1.4));
    const isRain = weather === 'rain';
    const isHeavyMist = weather === 'foggy';
    const sunInfluence = (1 - nightFactor * 0.7) * (isRain || isHeavyMist ? 0.08 : 0.22);
    const skyInfluence = 0.14 + nightFactor * 0.18 + (isRain ? 0.14 : 0);

    for (let i = 0; i < plumageEntries.length; i++) {
      const p = plumageEntries[i];
      p.mat.color
        .copy(p.baseColor)
        .lerp(_envSunColor, sunInfluence)
        .lerp(_envSkyColor, skyInfluence);
    }

    const windNorm = Math.max(0.001, windSpeed);
    const windDirX = windX / windNorm;
    const windDirZ = windZ / windNorm;
    const windYaw = Math.atan2(windX, windZ);
    const gustPulse = Math.sin(elapsed * 0.62) * 0.35 + Math.cos(elapsed * 1.18) * 0.18;

    for (let i = 0; i < birds.length; i++) {
      const b = birds[i];
      if (b.mode === 'flying' && b.track) {
        // Low courtyard birds settle quietly at deep night or heavy rain while high-sky birds adjust soaring height
        const hideLowFlock = !b.isHighSky && (isRain || nightFactor > 0.85);
        b.root.visible = !hideLowFlock;
        if (!b.root.visible) continue;

        const baseSample = sampleBirdFlightState(b.track, elapsed, b.flapFreq);
        const fwdX = Math.sin(baseSample.yaw);
        const fwdZ = Math.cos(baseSample.yaw);
        const rightX = fwdZ;
        const rightZ = -fwdX;

        // Headwind increases wingbeat cadence; tailwind invites wide thermal glides
        const headwind = -(fwdX * windX + fwdZ * windZ);
        const crosswind = rightX * windX + rightZ * windZ;
        const effectiveFreq = b.flapFreq * Math.max(0.75, Math.min(1.45, 1 + headwind * 0.12));
        const s = sampleBirdFlightState(b.track, elapsed, effectiveFreq);

        // Eagles & soaring sky birds hold steady wide glides for most of their thermal loop
        const soarBlend =
          b.soaringRatio > 0
            ? Math.max(
                0,
                Math.min(
                  1,
                  b.soaringRatio +
                    (headwind < 0 ? 0.15 : -0.1) +
                    0.22 * Math.sin(elapsed * 0.45 + b.phase),
                ),
              )
            : 0;
        const flapAngle =
          s.wingFlapRad * (1 - soarBlend) +
          (0.08 + Math.sin(elapsed * 1.3 + b.phase) * 0.04) * soarBlend;

        // Lateral wind drift + V-formation cohesion offsets
        const gustWave = Math.sin(elapsed * 0.72 + b.phase * 1.4) + gustPulse * 0.5;
        const driftScale = b.windSensitivity * (0.45 + 0.25 * gustWave);
        const altShift = isRain ? -2.2 : isHeavyMist ? -1.4 : Math.max(0, windSpeed - 0.6) * 0.75;

        const posX =
          s.x +
          windX * driftScale +
          rightX * b.formationSideOffset +
          fwdX * b.formationBackOffset;
        const posZ =
          s.z +
          windZ * driftScale +
          rightZ * b.formationSideOffset +
          fwdZ * b.formationBackOffset;
        const posY = Math.max(
          groundHeightAt(posX, posZ) + 2.8,
          s.y + altShift + Math.sin(elapsed * 1.2 + b.phase) * windSpeed * 0.12,
        );

        b.root.position.set(posX, posY, posZ);
        b.root.rotation.order = 'YXZ';
        b.root.rotation.set(
          s.pitch - Math.max(-0.1, Math.min(0.1, headwind * 0.025)),
          s.yaw + crosswind * 0.045,
          s.roll + crosswind * 0.075,
        );
        b.leftWing.rotation.set(0, 0, flapAngle);
        b.rightWing.rotation.set(0, 0, -flapAngle);
        b.headPivot.rotation.set(-s.pitch * 0.5, 0, 0);
        b.tailMesh.rotation.x = 0.08 + flapAngle * 0.12;
      } else {
        // Perched birds face softly into strong breeze and ruffle feathers more frequently
        b.root.visible = !isRain;
        if (!b.root.visible) continue;

        const windAgitation = 1 + Math.min(1.2, windSpeed * 0.45);
        const lookPhase = elapsed * 1.05 * windAgitation + b.phase;
        b.headPivot.rotation.set(
          0.06 + Math.max(0, Math.sin(elapsed * 2.2 + b.phase)) * 0.16,
          Math.sin(lookPhase) * 0.42 + (windDirX * 0.08 - windDirZ * 0.06),
          0,
        );
        const windLean = Math.min(0.35, windSpeed * 0.14);
        b.root.rotation.y =
          b.baseYaw * (1 - windLean) +
          (windYaw + Math.PI) * windLean +
          Math.sin(elapsed * 0.34 + b.phase) * 0.14;
        const flutterCycle = ((elapsed * 0.14 * windAgitation + b.phase * 0.51) % 1 + 1) % 1;
        const flutter = flutterCycle > 0.86 ? Math.sin((flutterCycle - 0.86) * 105) * 0.28 : 0;
        b.leftWing.rotation.set(0.18, 1.18 - Math.abs(flutter) * 0.45, -0.22 + flutter);
        b.rightWing.rotation.set(0.18, -1.18 + Math.abs(flutter) * 0.45, 0.22 - flutter);
      }
    }
  };

  controller.userData.onEnvironmentUpdate = updateBirdsWithEnv;
  controller.userData.onFlickerUpdate = (elapsed: number) => {
    _defaultBirdEnv.elapsed = elapsed;
    updateBirdsWithEnv(_defaultBirdEnv);
  };
  updateBirdsWithEnv(_defaultBirdEnv);

  return { group: worldBirdsGroup, controller };
}

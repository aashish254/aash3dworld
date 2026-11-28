import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { LANDMARKS, LandmarkData } from '../data/portfolioData';
import {
  CameraViewMode,
  ContextualWorldAction,
  CustomWaypoint,
  FootstepSurfaceKind,
  FootprintDecalPoolState,
  GLACIAL_LAKE,
  GraphicsQualityPreset,
  LUMBINI_PEACE_CANAL,
  LUMBINI_SACRED_POND,
  LumbiniAmbiencePreset,
  MeditationButterflyState,
  OUTER_TEMPLE_ARTIFACT_SPOTS,
  OuterTempleArtifactSpot,
  SPAWN_POSITION,
  TimeLightingState,
  TimePreset,
  TreeSpecies,
  WORLD_RADIUS,
  WeatherKind,
  clampCameraPitch,
  clampToWalkable,
  computeAtmosphereParticleProfile,
  computeContextualWorldAction,
  computeEffectiveLightingState,
  computeFirstPersonLookPitch,
  computeFootprintDecalAlpha,
  computeLumbiniAudioProfile,
  computeLumbiniFireflyIntensity,
  computeLumbiniPondProximityState,
  computeSpatialAmbienceMix,
  computeTimeLightingState,
  computeButterLampFlameState,
  createFootprintDecalPool,
  createMeditationButterflyStates,
  dampCameraValue,
  findFirstUnexploredLandmarkApproach,
  findNearestLandmark,
  findWaterEdgeRippleOrigin,
  getFootstepSurfaceKind,
  getGraphicsQualityConfig,
  getMeadowZoneAt,
  getPresetHour,
  getRiverCenterX,
  getSurfaceHeightAt,
  getWorldTreeSpots,
  groundHeightAt,
  isInLumbiniSurroundingPond,
  isOnBridgeDeck,
  isOnLumbiniCanalBridge,
  isOnLumbiniSacredBridge,
  recordFootprintDecal,
  resolveThirdPersonCameraFloorClearance,
  stepFootprintDecalPool,
  stepMeditationButterflies,
  stepPrayerWheelSpin,
} from './worldLogic';
import { LumbiniFireflySystem } from './lumbiniFireflies';
import { LumbiniIncenseSmokeSystem } from './lumbiniIncenseSmoke';
import { UrliOfferingBowlSuite } from './urliLotusCraft';
import { getLungtaDrapeMaterials } from './prayerFlags';
import { WeatherParticleSystem } from './weatherParticles';
import { ProceduralTextureSet, createProceduralTextures } from './proceduralTextures';
import {
  AnimatedFoliageController,
  AnimatedGrassController,
  AnimatedWaterController,
  GrassInteractor,
  MountainCloudController,
  WORLD_HAZE_UNIFORMS,
  createAnimatedRiver,
  createCurbedRoads,
  createDioramaTerrain,
  createGlacialLakeAndWaterfall,
  createHimalayanGompaAndLodge,
  createInstancedFoliage,
  createInstancedGrassField,
  createLumbiniPeaceParkland,
  createMountainClouds,
  createSculptedHimalayas,
  sampleTerrainMeshHeight,
} from './mountainAndTerrain';
import { REFLECTIVE_WATER_ENV_UNIFORMS, triggerWaterRipple } from './waterShader';
import { createPashupatinathComplex } from './pashupatinathComplex';
import {
  PASHUPATI_COMPLEX,
  PASHUPATI_HIGHLIGHTS,
  PASHUPATI_INTERACTIVE_SPOTS,
  getPashupatinathSurfaceY,
  getPashupatinathWaterAt,
} from './pashupatinathData';
import {
  ExplorerCharacterRig,
  InteractiveProp,
  create3DNameSign,
  createAgentCitadel,
  createAniFlowStudio,
  createBoudhanathStupa,
  createBreathSensorLab,
  createCustomWaypointFlag,
  createExplorerCharacter,
  createInteractiveProps,
  createJanakiMandir,
  createLumbiniBuddha,
  createNoticeBoardKiosk,
  createPrayerFlagLine,
  createPumdikotShiva,
  createRecruiterBeacon,
  createSuspensionBridge,
  createVitClockTower,
} from './proceduralModels';
import { soundEngine } from './soundEngine';
import { BirdEnvironmentState, createAmbientWorldBirds } from './janakiMandirBirds';
import {
  GeometrySanitizeReport,
  PhysicsWorldStats,
  StaticPhysicsWorld,
  sanitizeSceneGeometry,
} from './physicsBvh';
import {
  getCachedMaterial,
  getCachedTexture,
  mergeStaticMeshesByMaterial,
} from './meshOptimization';
import {
  BoundingSphereEntry,
  DiscreteHudState,
  ShadowUpdateCheckInput,
  formatClockHour,
  hasDiscreteHudChanged,
  isWithinSleepDistanceSq,
  raySegmentHitsSphere,
  selectClosestIndicesZeroAlloc,
  shouldUpdateShadowMap,
  writeDirtyDatasetAttr,
} from './perfLogic';

const _snapBox = new THREE.Box3();
const _snapWorldPos = new THREE.Vector3();
const _snapSize = new THREE.Vector3();

export type WorldGameState = 'title' | 'playing' | 'paused';

export interface MayaDeviHighlightInfo {
  title: string;
  subtitle: string;
  description: string;
  localPos?: [number, number, number];
}

export interface WorldHudSnapshot {
  zoneName: string;
  nearestLandmark: LandmarkData | null;
  distanceWalked: number;
  timeState: TimeLightingState;
  coords: { x: number; z: number };
  contextualAction: ContextualWorldAction | null;
  isMeditating: boolean;
}

export interface WorldHudContinuousSnapshot {
  distanceWalked: number;
  formattedHour: string;
  phaseLabel: string;
  coordsX: number;
  coordsZ: number;
}

export interface WorldPerfMetrics {
  fps: number;
  drawCalls: number;
  triangles: number;
}

export interface WorldEngineCallbacks {
  onSelectLandmark: (landmark: LandmarkData) => void;
  onHudUpdate?: (snapshot: WorldHudSnapshot) => void;
  onHudTick?: (snapshot: WorldHudContinuousSnapshot) => void;
  onHudDiscreteChange?: (snapshot: WorldHudSnapshot) => void;
  onPerfUpdate?: (metrics: WorldPerfMetrics) => void;
  onPlaceWaypointRequest: (x: number, z: number) => void;
  onInspectHighlight?: (highlight: { title: string; subtitle: string; description: string }) => void;
  onBellRing?: () => void;
  onWebglError?: (message: string) => void;
}

const _vec3 = new THREE.Vector3();
const _camTargetPos = new THREE.Vector3();
const _camLookTarget = new THREE.Vector3();
const _camRayDir = new THREE.Vector3();
const _camForward = new THREE.Vector3();
const _targetColor = new THREE.Color();
const _pointer = new THREE.Vector2();
const _deltaQuat = new THREE.Quaternion();
const _axisVec = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _upVec = new THREE.Vector3(0, 1, 0);
const _localAxis = new THREE.Vector3();
const _bestLocalAxis = new THREE.Vector3();
const _snapAxis = new THREE.Vector3();
const _snapQuat = new THREE.Quaternion();
const _eulerTmp = new THREE.Euler();
const ATMOSPHERE_PARTICLE_COUNT = 900;
const ATMOSPHERE_BOX_SIZE = new THREE.Vector3(36, 18, 36);
const FOOTSTEP_PARTICLE_COUNT = 128;
const WORLD_BURST_COUNT = 240;

interface TempleBellEntry {
  bellGroup: THREE.Object3D;
  swingPivot: THREE.Object3D;
  clapperPivot: THREE.Object3D | null;
  worldPos: THREE.Vector3;
  pitchScale: number;
  ringStart: number;
  ringDuration: number;
  amplitude: number;
  cooldownUntil: number;
}

interface PrayerWheelEntry {
  mesh: THREE.Object3D;
  worldPos: THREE.Vector3;
  angle: number;
  velocity: number;
  cooldownUntil: number;
}

interface ButterLampEntry {
  lampIndex: number;
  flameGroup: THREE.Group;
  haloMesh: THREE.Mesh;
  worldPos: THREE.Vector3;
  isLit: boolean;
  litAtElapsed: number;
}

interface TossedPebbleEntry {
  mesh: THREE.Mesh;
  startPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  progress: number;
  duration: number;
  pondY: number;
}

export class WorldEngine {
  private container: HTMLElement;
  private callbacks: WorldEngineCallbacks;
  private renderer!: THREE.WebGLRenderer;
  private composer: EffectComposer | null = null;
  private bloomPass: UnrealBloomPass | null = null;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private textures!: ProceduralTextureSet;
  private isSoftwareGl = false;
  private renderFrameCount = 0;
  private emissiveRegistry: Array<{ mat: THREE.MeshStandardMaterial; baseIntensity: number }> = [];

  private outerGroundsGroup: THREE.Group | null = null;
  private curbedRoadsLanternGroup: THREE.Group | null = null;
  private staticGroundsMerged = false;
  private shadowPrevState: ShadowUpdateCheckInput | null = null;
  private shadowForceDirty = true;
  private maxMovingPropSpeed = 0;
  private lastHudTickAt = -10;
  private lastDiscreteHud: DiscreteHudState | null = null;
  private lastSyncDatasetFlushAt = -10;
  private lastSimDatasetFlushAt = -10;
  private datasetCache: Record<string, string> = {};
  private perfDiagnosticsEnabled = false;
  private perfInitialized = false;
  private perfFramesAccum = 0;
  private perfWindowStartMs = performance.now();
  private currentPerfMetrics: WorldPerfMetrics = { fps: 60, drawCalls: 0, triangles: 0 };
  private occluderSpheres: BoundingSphereEntry[] = [];
  private filteredOccludersScratch: THREE.Object3D[] = [];
  private occluderTmpBox = new THREE.Box3();
  private occluderTmpSphere = new THREE.Sphere();
  private animatedNodeAnchors: Array<{ isGlobal: boolean; x: number; z: number }> = [];
  private wheelSpotsScratch: Array<{ x: number; z: number }> = [];
  private bellSpotsScratch: Array<{ x: number; z: number }> = [];
  private lampSpotsScratch: Array<{ x: number; z: number; isLit: boolean }> = [];
  private listenerPoseScratch = { x: 0, y: 0, z: 0, forwardX: 0, forwardY: 0, forwardZ: -1 };
  private beaconPosX = new Float64Array(0);
  private beaconPosZ = new Float64Array(0);
  private beaconEligible = new Uint8Array(0);
  private beaconSelectedIdx = new Int32Array(6);
  private beaconSelectedDistSq = new Float64Array(6);

  private sunLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private skyDomeMat!: THREE.ShaderMaterial;
  private skyDomeMesh!: THREE.Mesh;
  private starsPoints!: THREE.Points;
  private milkyWayPoints!: THREE.Points;
  private atmospherePoints!: THREE.Points;
  private atmosphereMat!: THREE.ShaderMaterial;
  private weatherParticles!: WeatherParticleSystem;
  private lumbiniFireflies!: LumbiniFireflySystem;
  private lumbiniIncenseSmoke!: LumbiniIncenseSmokeSystem;
  private sakuraPetalsMat: THREE.ShaderMaterial | null = null;
  private sakuraPetalsPoints: THREE.Points | null = null;
  private riverController!: AnimatedWaterController;
  private glacialLakeController!: AnimatedWaterController;
  private peaceParklandController?: AnimatedWaterController;
  private grassController!: AnimatedGrassController;
  private foliageController!: AnimatedFoliageController;
  private cloudController!: MountainCloudController;
  private treeSpots = getWorldTreeSpots();
  private treeBumpPos = new THREE.Vector3(0, -999, 0);
  private treeBumpStrength = 0;
  private lastTreeShakeAt = -10;
  private lastPlayerRippleAt = -10;
  private beaconLights: THREE.PointLight[] = [];
  private beaconPoolDescs: Array<{
    pos: THREE.Vector3;
    color: THREE.Color;
    distance: number;
    decay: number;
    flickerPhase: number;
    flickerAmp: number;
    intensityScale: number;
    warmFlicker: boolean;
    interiorSanctum: boolean;
    sourceUserData?: Record<string, unknown>;
  }> = [];
  private pooledPointLights: THREE.PointLight[] = [];
  private animatedLandmarkNodes: THREE.Object3D[] = [];
  private templeBellEntries: TempleBellEntry[] = [];
  private bellRingsCount = 0;
  private prayerWheelEntries: PrayerWheelEntry[] = [];
  private prayerWheelHitTargets: THREE.Mesh[] = [];
  private prayerWheelSpinsCount = 0;
  private prayerWheelParticleBursts = 0;
  private butterLampEntries: ButterLampEntry[] = [];
  private butterLampHitTargets: THREE.Mesh[] = [];
  private babyRitualLampLight: THREE.PointLight | null = null;
  private ritualOfferingsCount = 0;
  private ritualEmberAccum = 0;
  private pebbleSpots: Array<{ x: number; z: number; pondX: number; pondZ: number; label: string }> = [];
  private meditationSpots: Array<{ x: number; z: number; lookX: number; lookZ: number; label: string }> = [];
  private mayaDeviHighlights: {
    markerStone?: MayaDeviHighlightInfo;
    mauryanChambers?: MayaDeviHighlightInfo;
    nativityRelief?: MayaDeviHighlightInfo;
  } | null = null;
  private mayaDeviPlaqueHitTargets: THREE.Mesh[] = [];
  private pashupatiLingamHitTarget: THREE.Mesh | null = null;
  private pashupatiNandiHitTarget: THREE.Mesh | null = null;
  private pashupatiGheeLampHitTargets: THREE.Mesh[] = [];
  private pashupatiGheeRackLit: [boolean, boolean] = [false, false];
  private pashupatiAaratiHitTarget: THREE.Mesh | null = null;
  private pashupatiLingamOfferingFn: (() => void) | null = null;
  private pashupatiToggleRackFn: ((idx: number) => boolean) | null = null;
  private pashupatiTriggerAaratiFn: (() => void) | null = null;
  private pashupatiOfferingsCount = 0;
  private bagmatiAaratiCount = 0;
  private activeTossedPebbles: TossedPebbleEntry[] = [];
  private tossedPebbleGeo: THREE.BufferGeometry | null = null;
  private tossedPebbleMat: THREE.MeshStandardMaterial | null = null;
  private pebbleTossesCount = 0;
  private isMeditating = false;
  private meditationTarget: { x: number; z: number; lookX: number; lookZ: number; label: string } | null = null;
  private lastContextualAction: ContextualWorldAction | null = null;
  private prayerFlags: THREE.Mesh[] = [];
  private landmarkRings = new Map<string, THREE.Mesh>();
  private landmarkHitTargets: THREE.Mesh[] = [];
  private bellHitTargets: THREE.Mesh[] = [];
  private propHitTargets: THREE.Object3D[] = [];
  private cameraOccluders: THREE.Object3D[] = [];
  private terrainMesh!: THREE.Mesh;
  private interactiveProps: InteractiveProp[] = [];
  private propSoundCooldowns: number[] = [];
  private grassInteractors: GrassInteractor[] = Array.from({ length: 6 }, () => ({
    x: 0,
    y: -999,
    z: 0,
    r: 0,
  }));
  private physicsWorld = new StaticPhysicsWorld();
  private snappedAssetsCount = 0;
  private lastSanitizeReport: GeometrySanitizeReport | null = null;

  private footstepPoints!: THREE.Points;
  private footstepGeo!: THREE.BufferGeometry;
  private footstepMat!: THREE.ShaderMaterial;
  private fsPositions = new Float32Array(FOOTSTEP_PARTICLE_COUNT * 3);
  private fsVel = new Float32Array(FOOTSTEP_PARTICLE_COUNT * 3);
  private fsColors = new Float32Array(FOOTSTEP_PARTICLE_COUNT * 3);
  private fsSizes = new Float32Array(FOOTSTEP_PARTICLE_COUNT);
  private fsAlphas = new Float32Array(FOOTSTEP_PARTICLE_COUNT);
  private fsAges = new Float32Array(FOOTSTEP_PARTICLE_COUNT);
  private fsLifetimes = new Float32Array(FOOTSTEP_PARTICLE_COUNT);
  private fsKinds = new Uint8Array(FOOTSTEP_PARTICLE_COUNT);
  private fsCursor = 0;
  private fsActive = false;
  private footstepBurstCount = 0;
  private lastFootstepStrideIdx = -1;

  private footprintPool: FootprintDecalPoolState = createFootprintDecalPool(48);
  private footprintInst!: THREE.InstancedMesh;
  private footprintGeo!: THREE.PlaneGeometry;
  private footprintMat!: THREE.MeshBasicMaterial;
  private footprintTex!: THREE.CanvasTexture;
  private footprintDummy = new THREE.Object3D();
  private footprintColorTmp = new THREE.Color();

  private butterflyStates: MeditationButterflyState[] = createMeditationButterflyStates(28);
  private butterflyWingInst!: THREE.InstancedMesh;
  private butterflyWingGeo!: THREE.BufferGeometry;
  private butterflyWingMat!: THREE.MeshStandardMaterial;
  private butterflyWingTex!: THREE.CanvasTexture;
  private butterflyBodyInst!: THREE.InstancedMesh;
  private butterflyBodyGeo!: THREE.BufferGeometry;
  private butterflyBodyMat!: THREE.MeshStandardMaterial;
  private butterflyRootDummy = new THREE.Object3D();
  private butterflyWingDummy = new THREE.Object3D();
  private butterflyMat4Tmp = new THREE.Matrix4();

  private worldBurstPoints!: THREE.Points;
  private worldBurstGeo!: THREE.BufferGeometry;
  private worldBurstMat!: THREE.ShaderMaterial;
  private wbPositions = new Float32Array(WORLD_BURST_COUNT * 3);
  private wbVel = new Float32Array(WORLD_BURST_COUNT * 3);
  private wbColors = new Float32Array(WORLD_BURST_COUNT * 3);
  private wbSizes = new Float32Array(WORLD_BURST_COUNT);
  private wbAlphas = new Float32Array(WORLD_BURST_COUNT);
  private wbAges = new Float32Array(WORLD_BURST_COUNT);
  private wbLifetimes = new Float32Array(WORLD_BURST_COUNT);
  private wbKinds = new Float32Array(WORLD_BURST_COUNT);
  private wbCursor = 0;
  private wbActive = false;

  private character!: ExplorerCharacterRig;
  private playerPos = new THREE.Vector3(SPAWN_POSITION.x, 0, SPAWN_POSITION.z);
  private playerVx = 0;
  private playerVz = 0;
  private playerMoveUniformVec = new THREE.Vector3(0, 0, 0);
  private meadowDisplacementStrength = 0;
  private playerYaw = Math.PI;
  private playerVelY = 0;
  private isGrounded = true;
  private walkCycle = 0;
  private squashScaleY = 1;
  private distanceWalked = 0;
  private walkTarget: THREE.Vector3 | null = null;
  private walkMarkerMesh!: THREE.Mesh;

  // Miniature 3/4 diorama camera framing (balanced so tall landmarks + courtyard fit cleanly)
  private cameraMode: CameraViewMode = 'third-person';
  private graphicsQuality: GraphicsQualityPreset = 'high';
  private cameraYaw = 0;
  private cameraPitch = 0.45;
  private cameraDistance = 13.8;
  private targetCameraYaw = 0;
  private targetCameraPitch = 0.45;
  private targetCameraDistance = 13.8;
  private currentCamPos = new THREE.Vector3(0, 7.5, 16.5);
  private currentLookAt = new THREE.Vector3(0, 1.8, 0);

  private keysPressed = new Set<string>();
  private joystickVec = { x: 0, y: 0 };
  private isDraggingCamera = false;
  private activePointerButton = 0;
  private pointerDownPos = { x: 0, y: 0 };
  private lastPointerPos = { x: 0, y: 0 };
  private hasPointerMoved = false;

  private gameState: WorldGameState = 'title';
  private timePreset: TimePreset = 'live';
  private weather: WeatherKind = 'clear';
  private lumbiniPreset: LumbiniAmbiencePreset = 'sanctuary-auto';
  private placementMode = false;
  private focusedLandmark: LandmarkData | null = null;

  private customWaypointGroup = new THREE.Group();
  private atmosphereDrift = new THREE.Vector3();
  private currentParticleState = {
    activeRatio: 0.22,
    opacity: 0.5,
    particleSize: 16,
    fallSpeed: -0.22,
    windDriftX: 0.45,
    windDriftZ: 0.25,
    turbulence: 0.68,
    streakStretch: 0,
    glowStrength: 0.45,
  };
  private birdEnvState: BirdEnvironmentState = {
    elapsed: 0,
    windX: 0.45,
    windZ: 0.25,
    windSpeed: 0.52,
    sunColorHex: '#fff4d6',
    skyColorHex: '#93c5fd',
    lanternIntensity: 0.2,
    weather: 'clear',
  };

  private raycaster = new THREE.Raycaster();
  private startTimeMs = performance.now();
  private lastFrameMs = performance.now();
  private frameId = 0;
  private isTimeoutFrame = false;
  private disposed = false;
  private lastHudEmit = 0;
  private titleOrbitAngle = 0.35;
  private resizeObserver: ResizeObserver | null = null;
  private justTeleported = false;
  private renderQueued = false;
  private lumbiniLotusCount = 0;
  private pondRainIntensity = 0;
  private pondTrailRippleCount = 0;
  private waterEdgeRippleCount = 0;
  private lastWaterRippleBody = 'none';
  private lastTrailRippleAt = -10;
  private discoveredLandmarkIds = new Set<string>();
  private cuedLandmarkIds = new Set<string>();
  private lastApproachCueLandmarkId: string | null = null;
  private approachCueCount = 0;

  constructor(container: HTMLElement, callbacks: WorldEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    this.initRendererAndScene();
    this.buildSkyAndEnvironment();
    this.buildTerrainAndRiver();
    this.buildLandmarks();
    this.populateOuterTempleGrounds();
    this.buildSakuraPetals();
    this.buildInteractiveProps();
    this.buildAtmosphereParticles();
    this.weatherParticles = new WeatherParticleSystem(this.weather, this.getPixelScale());
    this.scene.add(this.weatherParticles.points);
    this.lumbiniFireflies = new LumbiniFireflySystem();
    this.scene.add(this.lumbiniFireflies.points);
    this.lumbiniIncenseSmoke = new LumbiniIncenseSmokeSystem();
    this.scene.add(this.lumbiniIncenseSmoke.points);
    this.buildFootstepParticles();
    this.buildFootprintDecals();
    this.buildMeditationButterflies();
    this.buildWorldBurstParticles();
    this.buildCharacter();
    this.buildPhysicsBvhAndSnapAssets();
    this.poolBeaconPointLights();
    this.collectEmissiveMaterials();
    this.bindEvents();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.syncLighting(0);
    this.emitHud(true);
    if (!this.isSoftwareGl) {
      this.renderScene();
    }
    this.startLoop();
  }

  private poolBeaconPointLights(): void {
    this.scene.updateMatrixWorld(true);
    for (const light of this.beaconLights) {
      const worldPos = new THREE.Vector3();
      light.getWorldPosition(worldPos);
      this.beaconPoolDescs.push({
        pos: worldPos,
        color: light.color.clone(),
        distance: light.distance || 20,
        decay: light.decay ?? 1.6,
        flickerPhase: typeof light.userData.flickerPhase === 'number' ? light.userData.flickerPhase : 0,
        flickerAmp: typeof light.userData.flickerAmp === 'number' ? light.userData.flickerAmp : 0,
        intensityScale: typeof light.userData.intensityScale === 'number' ? light.userData.intensityScale : 1,
        warmFlicker: Boolean(light.userData.warmFlicker),
        interiorSanctum: Boolean(light.userData.interiorSanctum),
        sourceUserData: light.userData,
      });
      light.parent?.remove(light);
      light.dispose();
    }
    this.beaconLights = [];

    const count = this.beaconPoolDescs.length;
    this.beaconPosX = new Float64Array(count);
    this.beaconPosZ = new Float64Array(count);
    this.beaconEligible = new Uint8Array(count);
    for (let i = 0; i < count; i++) {
      this.beaconPosX[i] = this.beaconPoolDescs[i].pos.x;
      this.beaconPosZ[i] = this.beaconPoolDescs[i].pos.z;
    }

    const poolSize = 8;
    this.beaconSelectedIdx = new Int32Array(poolSize);
    this.beaconSelectedDistSq = new Float64Array(poolSize);
    for (let i = 0; i < poolSize; i++) {
      const pLight = new THREE.PointLight(0xffb85c, 0, 24, 1.6);
      this.scene.add(pLight);
      this.pooledPointLights.push(pLight);
    }
  }

  private writeDataset(key: string, value: string): void {
    if (!this.renderer?.domElement) return;
    writeDirtyDatasetAttr(this.renderer.domElement.dataset, this.datasetCache, key, value);
  }

  public setPerfDiagnosticsEnabled(enabled: boolean): void {
    this.perfDiagnosticsEnabled = enabled;
    if (enabled) {
      this.callbacks.onPerfUpdate?.(this.currentPerfMetrics);
    }
  }

  public getPerfMetrics(): WorldPerfMetrics {
    return this.currentPerfMetrics;
  }

  private collectEmissiveMaterials(): void {
    const seen = new Set<THREE.Material>();
    this.scene.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return;
      const matField = (obj as THREE.Mesh).material;
      const mats = Array.isArray(matField) ? matField : [matField];
      for (const mat of mats) {
        if (!mat || seen.has(mat)) continue;
        seen.add(mat);
        const std = mat as THREE.MeshStandardMaterial;
        if (
          std.isMeshStandardMaterial &&
          std.emissiveIntensity >= 0.2 &&
          (std.emissive.r > 0 || std.emissive.g > 0 || std.emissive.b > 0)
        ) {
          this.emissiveRegistry.push({
            mat: std,
            baseIntensity: std.emissiveIntensity,
          });
        }
      }
    });
  }

  private renderScene(): void {
    if (this.disposed) return;
    if (this.skyDomeMesh) {
      this.skyDomeMesh.position.copy(this.camera.position);
    }
    this.renderer.info.autoReset = false;
    this.renderer.info.reset();
    if (!this.isSoftwareGl && this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
    this.renderFrameCount++;
    this.writeDataset('renderFrame', String(this.renderFrameCount));

    const drawCalls = this.renderer.info.render.calls;
    const triangles = this.renderer.info.render.triangles;
    this.currentPerfMetrics.drawCalls = drawCalls;
    this.currentPerfMetrics.triangles = triangles;

    const nowMs = performance.now();
    if (!this.perfInitialized) {
      this.perfInitialized = true;
      this.perfWindowStartMs = nowMs;
      this.perfFramesAccum = 0;
      this.currentPerfMetrics.fps = this.isSoftwareGl ? 1 : 60;
      if (this.perfDiagnosticsEnabled) {
        this.callbacks.onPerfUpdate?.(this.currentPerfMetrics);
      }
      return;
    }

    this.perfFramesAccum++;
    const winMs = nowMs - this.perfWindowStartMs;
    if (winMs >= 250 && this.perfFramesAccum > 0) {
      this.currentPerfMetrics.fps = Math.max(
        1,
        Math.min(240, Math.round((this.perfFramesAccum * 1000) / winMs)),
      );
      this.perfFramesAccum = 0;
      this.perfWindowStartMs = nowMs;
      if (this.perfDiagnosticsEnabled) {
        this.callbacks.onPerfUpdate?.(this.currentPerfMetrics);
      }
    }
  }

  private scheduleImmediateRender(): void {
    if (this.isSoftwareGl || this.renderQueued || this.disposed) return;
    this.renderQueued = true;
    queueMicrotask(() => {
      this.renderQueued = false;
      if (this.disposed) return;
      this.syncLighting((performance.now() - this.startTimeMs) / 1000);
      this.renderScene();
    });
  }

  private detectSoftwareGl(): boolean {
    try {
      const probe = document.createElement('canvas');
      const gl = probe.getContext('webgl2') || probe.getContext('webgl');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      return true;
    }
  }

  private initRendererAndScene(): void {
    this.isSoftwareGl = this.detectSoftwareGl();

    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: !this.isSoftwareGl,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: this.isSoftwareGl,
      });
    } catch (err) {
      this.callbacks.onWebglError?.(
        err instanceof Error ? err.message : 'WebGL initialization failed',
      );
      return;
    }

    const width = Math.max(1, this.container.clientWidth || window.innerWidth);
    const height = Math.max(1, this.container.clientHeight || window.innerHeight);

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 0.75 : Math.min(window.devicePixelRatio, 2),
    );
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.92;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;

    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.touchAction = 'none';
    this.renderer.domElement.dataset.cameraMode = this.cameraMode;
    this.renderer.domElement.setAttribute('data-testid', 'world-canvas');
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xc9dfef);
    this.scene.fog = new THREE.FogExp2(0xc9dfef, 0.0054);

    // 42 deg FOV on desktop; widened smoothly on narrow portrait viewports so full courtyard stays visible
    const aspect = width / height;
    const fov = aspect < 1 ? Math.min(62, 42 / Math.pow(aspect, 0.42)) : 42;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.22, 680);
    this.camera.position.copy(this.currentCamPos);
    this.camera.lookAt(this.currentLookAt);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.textures = createProceduralTextures(
      this.renderer.capabilities.getMaxAnisotropy(),
    );

    if (!this.isSoftwareGl) {
      const pr = this.renderer.getPixelRatio();
      const rtW = Math.max(1, Math.floor(width * pr));
      const rtH = Math.max(1, Math.floor(height * pr));
      const gl = this.renderer.getContext();
      const isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
      const composerRt = new THREE.WebGLRenderTarget(rtW, rtH, {
        type: THREE.HalfFloatType,
        samples: isWebGL2 ? 4 : 0,
      });

      this.composer = new EffectComposer(this.renderer, composerRt);
      this.composer.setPixelRatio(pr);
      this.composer.setSize(width, height);
      this.composer.addPass(new RenderPass(this.scene, this.camera));

      const initialBloom = computeTimeLightingState(
        getPresetHour(this.timePreset),
        this.weather,
      );
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        initialBloom.bloomStrength,
        initialBloom.bloomRadius,
        initialBloom.bloomThreshold,
      );
      this.composer.addPass(this.bloomPass);
      this.composer.addPass(new OutputPass());
    }
  }

  private buildSkyAndEnvironment(): void {
    this.hemiLight = new THREE.HemisphereLight(0xb0ceff, 0x3d3363, 0.9);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffd29d, 2.2);
    this.sunLight.position.set(48, 72, 44);
    this.sunLight.castShadow = !this.isSoftwareGl;
    const shadowRes = this.isSoftwareGl ? 512 : 2048;
    this.sunLight.shadow.mapSize.set(shadowRes, shadowRes);
    const d = 68;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.camera.near = 4;
    this.sunLight.shadow.camera.far = 260;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.028;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // Subtle cool alpine sky bounce fill from north-west
    const rimLight = new THREE.DirectionalLight(0x9ab8db, 0.44);
    rimLight.position.set(-120, 65, -135);
    this.scene.add(rimLight);

    this.skyDomeMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        topColor: { value: new THREE.Color('#2c6eb8') },
        horizonColor: { value: new THREE.Color('#c9dfef') },
        sunDir: { value: new THREE.Vector3(0.5, 0.6, 0.4).normalize() },
        sunColor: { value: new THREE.Color('#fff6e6') },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vWorldPos = position;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 horizonColor;
        uniform vec3 sunDir;
        uniform vec3 sunColor;
        varying vec3 vWorldPos;
        void main() {
          vec3 dir = normalize(vWorldPos);
          float h = dir.y;
          float t = pow(max(h, 0.0), 0.58);
          vec3 sky = mix(horizonColor, topColor, t);
          float sunDot = max(dot(dir, normalize(sunDir)), 0.0);
          float halo = pow(sunDot, 12.0) * 0.22 + pow(sunDot, 160.0) * 0.55;
          sky += sunColor * halo;
          // High-altitude atmospheric cirrus wisps
          float wisp = sin(dir.x * 7.5 + dir.z * 3.8) * cos(dir.z * 6.2 - dir.x * 2.4);
          float cloudBand = smoothstep(0.08, 0.45, h) * (1.0 - smoothstep(0.45, 0.85, h));
          sky = mix(sky, mix(horizonColor, vec3(0.84, 0.87, 0.91), 0.55), smoothstep(0.28, 0.82, wisp) * cloudBand * 0.12);
          gl_FragColor = vec4(sky, 1.0);
        }
      `,
    });
    this.skyDomeMesh = new THREE.Mesh(new THREE.SphereGeometry(210, 32, 20), this.skyDomeMat);
    this.skyDomeMesh.renderOrder = -100;
    this.skyDomeMesh.frustumCulled = false;
    this.skyDomeMesh.userData.nonCollidable = true;
    this.scene.add(this.skyDomeMesh);

    // Rich Himalayan Starry Sky + Sweeping Milky Way Galactic Core Band (image_a52de83d)
    const starCount = 720;
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = ((i * 2.399963) % (Math.PI * 2));
      const phi = Math.acos(0.12 + ((i * 0.618034) % 1) * 0.88);
      const r = 740;
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.cos(phi);
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const huePick = i % 5;
      if (huePick === 0) {
        starColors[i * 3] = 0.78;
        starColors[i * 3 + 1] = 0.88;
        starColors[i * 3 + 2] = 1.0;
      } else if (huePick === 1) {
        starColors[i * 3] = 1.0;
        starColors[i * 3 + 1] = 0.9;
        starColors[i * 3 + 2] = 0.76;
      } else {
        starColors[i * 3] = 0.92;
        starColors[i * 3 + 1] = 0.94;
        starColors[i * 3 + 2] = 0.98;
      }
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    this.starsPoints = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({
        vertexColors: true,
        size: 2.8,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    this.scene.add(this.starsPoints);

    // Milky Way diagonal galactic dust & micro-star cluster arcing over the northern peaks
    const mwCount = 1200;
    const mwPos = new Float32Array(mwCount * 3);
    const mwCols = new Float32Array(mwCount * 3);
    for (let i = 0; i < mwCount; i++) {
      const u = (i / mwCount) * 2 - 1; // along arc -1..1
      const spread = (Math.sin(i * 19.37) * 0.5 + Math.cos(i * 41.17) * 0.5) * 0.16;
      const spreadZ = Math.cos(i * 13.71) * 0.12;
      const lon = -Math.PI * 0.5 + u * 1.15 + spread;
      const lat = 0.22 + (u + 1) * 0.34 + spreadZ;
      const r = 720;
      mwPos[i * 3] = r * Math.cos(lat) * Math.cos(lon);
      mwPos[i * 3 + 1] = Math.max(45, r * Math.sin(lat));
      mwPos[i * 3 + 2] = r * Math.cos(lat) * Math.sin(lon);

      const coreGlow = Math.exp(-spread * spread * 48);
      mwCols[i * 3] = THREE.MathUtils.lerp(0.42, 0.72, coreGlow);
      mwCols[i * 3 + 1] = THREE.MathUtils.lerp(0.56, 0.80, coreGlow);
      mwCols[i * 3 + 2] = THREE.MathUtils.lerp(0.76, 0.96, coreGlow);
    }
    const mwGeo = new THREE.BufferGeometry();
    mwGeo.setAttribute('position', new THREE.BufferAttribute(mwPos, 3));
    mwGeo.setAttribute('color', new THREE.BufferAttribute(mwCols, 3));
    this.milkyWayPoints = new THREE.Points(
      mwGeo,
      new THREE.PointsMaterial({
        vertexColors: true,
        size: 4.5,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.scene.add(this.milkyWayPoints);

    // Sculpted Real-World Himalayan Range + Cliffside Gompa / Sherpa Lodge + Drifting Clouds
    this.scene.add(createSculptedHimalayas(this.textures));
    this.scene.add(createHimalayanGompaAndLodge(this.textures));
    this.cloudController = createMountainClouds();
    this.scene.add(this.cloudController.group);
  }

  private buildTerrainAndRiver(): void {
    this.terrainMesh = createDioramaTerrain(this.textures);
    this.scene.add(this.terrainMesh);

    this.riverController = createAnimatedRiver(this.textures);
    this.scene.add(this.riverController.group);

    this.glacialLakeController = createGlacialLakeAndWaterfall(this.textures);
    this.scene.add(this.glacialLakeController.group);

    const peaceParkland = createLumbiniPeaceParkland(this.textures);
    this.peaceParklandController = peaceParkland;
    this.scene.add(peaceParkland.group);
    this.beaconLights.push(...peaceParkland.beaconLights);

    const roadsResult = createCurbedRoads(this.textures, this.terrainMesh);
    this.curbedRoadsLanternGroup = roadsResult.lanternGroup;
    this.scene.add(roadsResult.group);
    this.beaconLights.push(...roadsResult.lanternLights);

    this.grassController = createInstancedGrassField(this.terrainMesh);
    this.scene.add(this.grassController.group);

    this.scene.add(createSuspensionBridge(this.textures));
    this.foliageController = createInstancedFoliage(this.textures, this.terrainMesh);
    this.scene.add(this.foliageController.group);

    const worldBirds = createAmbientWorldBirds();
    worldBirds.controller.userData.isGlobalAnimation = true;
    this.scene.add(worldBirds.group);
    this.animatedLandmarkNodes.push(worldBirds.controller);
    this.animatedNodeAnchors.push({ isGlobal: true, x: 0, z: 0 });

    // Spawn Vista Landmarks: Carved Stone & Cast-Bronze Monument + Valley Trail Kiosk
    const nameSign = create3DNameSign(this.textures);
    nameSign.position.set(-1.5, sampleTerrainMeshHeight(this.terrainMesh, -1.5, -1.2), -1.2);
    nameSign.rotation.y = 0.14;
    this.scene.add(nameSign);

    const kiosk = createNoticeBoardKiosk(this.textures);
    kiosk.position.set(5.15, sampleTerrainMeshHeight(this.terrainMesh, 5.15, 3.2), 3.2);
    kiosk.rotation.y = -0.58;
    this.scene.add(kiosk);

    // Prayer flag lines across Pashupatinath Western Approach Plaza, Spawn vista, and Boudhanath mandala
    const line1 = createPrayerFlagLine(
      new THREE.Vector3(-96, getSurfaceHeightAt(-96, 284) + 3.2, 284),
      new THREE.Vector3(-84, getSurfaceHeightAt(-84, 287) + 3.2, 287),
      10,
    );
    const line2 = createPrayerFlagLine(
      new THREE.Vector3(-6.2, sampleTerrainMeshHeight(this.terrainMesh, -6.2, 0.5) + 4.0, 0.5),
      new THREE.Vector3(4.2, sampleTerrainMeshHeight(this.terrainMesh, 4.2, -4.5) + 4.0, -4.5),
      10,
    );
    const line3 = createPrayerFlagLine(
      new THREE.Vector3(-114, sampleTerrainMeshHeight(this.terrainMesh, -114, 1) + 4.5, 1),
      new THREE.Vector3(-101, sampleTerrainMeshHeight(this.terrainMesh, -101, 9) + 4.5, 9),
      12,
    );
    this.scene.add(line1.group, line2.group, line3.group);
    this.prayerFlags.push(...line1.flags, ...line2.flags, ...line3.flags);

    const walkRingGeo = new THREE.RingGeometry(0.42, 0.64, 24);
    walkRingGeo.rotateX(-Math.PI / 2);
    this.walkMarkerMesh = new THREE.Mesh(
      walkRingGeo,
      new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
      }),
    );
    this.walkMarkerMesh.visible = false;
    this.scene.add(this.walkMarkerMesh);
    this.scene.add(this.customWaypointGroup);
  }

  private buildLandmarks(): void {
    const builders: Record<string, () => ReturnType<typeof createPashupatinathComplex>> = {
      'kathmandu-stupa': () => createPashupatinathComplex(this.textures),
      'boudhanath-stupa': () => createBoudhanathStupa(this.textures),
      'pumdikot-shiva': () => createPumdikotShiva(this.textures),
      'janaki-mandir': () =>
        createJanakiMandir(this.textures, () => {
          if (this.disposed) return;
          this.shadowForceDirty = true;
          this.buildPhysicsBvhAndSnapAssets();
          this.writeDataset('lanternsLoaded', 'true');
          if (!this.isSoftwareGl) {
            this.renderer.compileAsync?.(this.scene, this.camera).catch(() => undefined);
          }
          this.scheduleImmediateRender();
        }),
      'lumbini-buddha': () => createLumbiniBuddha(this.textures, this.isSoftwareGl),
      'vit-vellore-tower': () => createVitClockTower(this.textures),
      'aniflow-studio': () => createAniFlowStudio(this.textures),
      'agent-infra-monolith': () => createAgentCitadel(this.textures),
      'breath-sensor-lab': () => createBreathSensorLab(this.textures, this.isSoftwareGl),
      'recruiter-beacon': () => createRecruiterBeacon(this.textures),
    };

    for (const lm of LANDMARKS) {
      const builder = builders[lm.id];
      if (!builder) continue;

      const built = builder();
      const y = lm.id === 'kathmandu-stupa' ? 0 : groundHeightAt(lm.position.x, lm.position.z);
      built.group.position.set(lm.position.x, y, lm.position.z);
      built.hitMesh.userData.landmarkId = lm.id;
      this.scene.add(built.group);

      this.landmarkHitTargets.push(built.hitMesh);
      this.beaconLights.push(...built.beaconLights);
      if (built.animatedNodes.length > 0) {
        built.group.updateMatrixWorld(true);
        for (const node of built.animatedNodes) {
          this.animatedLandmarkNodes.push(node);
          const isGlobal = Boolean(node.userData?.isGlobalAnimation);
          if (node.parent) {
            node.getWorldPosition(_vec3);
            this.animatedNodeAnchors.push({ isGlobal, x: _vec3.x, z: _vec3.z });
          } else {
            this.animatedNodeAnchors.push({ isGlobal, x: lm.position.x, z: lm.position.z });
          }
        }
      }
      if (lm.id === 'lumbini-buddha') {
        if (typeof built.group.userData.lotusCount === 'number') {
          this.lumbiniLotusCount = built.group.userData.lotusCount;
        }
        const rawWheels = built.group.userData.prayerWheelSpinners as THREE.Object3D[] | undefined;
        if (rawWheels && rawWheels.length > 0) {
          built.group.updateMatrixWorld(true);
          const wheelHitGeo = new THREE.SphereGeometry(0.62, 8, 8);
          const wheelHitMat = new THREE.MeshBasicMaterial({ visible: false });
          for (const wheel of rawWheels) {
            const worldPos = new THREE.Vector3();
            wheel.getWorldPosition(worldPos);
            const wheelIdx = this.prayerWheelEntries.length;
            const pwState = wheel.userData.prayerWheel as { angle?: number; velocity?: number } | undefined;
            this.prayerWheelEntries.push({
              mesh: wheel,
              worldPos,
              angle: pwState?.angle ?? 0,
              velocity: pwState?.velocity ?? 0.22,
              cooldownUntil: 0,
            });
            const hitSphere = new THREE.Mesh(wheelHitGeo, wheelHitMat);
            hitSphere.position.copy(worldPos);
            hitSphere.userData.prayerWheelIndex = wheelIdx;
            hitSphere.layers.set(2);
            this.scene.add(hitSphere);
            this.prayerWheelHitTargets.push(hitSphere);
          }
        }
        if (Array.isArray(built.group.userData.pebbleSpots)) {
          this.pebbleSpots = built.group.userData.pebbleSpots;
        }
        if (Array.isArray(built.group.userData.meditationSpots)) {
          this.meditationSpots = built.group.userData.meditationSpots;
        }
        const rawButterLamps = built.group.userData.babyButterLamps as
          | Array<{ lampIndex: number; flameGroup: THREE.Group; haloMesh: THREE.Mesh }>
          | undefined;
        if (rawButterLamps && rawButterLamps.length > 0) {
          built.group.updateMatrixWorld(true);
          const lampHitGeo = new THREE.SphereGeometry(0.68, 8, 8);
          const lampHitMat = new THREE.MeshBasicMaterial({ visible: false });
          for (const lamp of rawButterLamps) {
            const worldPos = new THREE.Vector3();
            lamp.flameGroup.getWorldPosition(worldPos);
            const idx = this.butterLampEntries.length;
            this.butterLampEntries.push({
              lampIndex: lamp.lampIndex,
              flameGroup: lamp.flameGroup,
              haloMesh: lamp.haloMesh,
              worldPos,
              isLit: false,
              litAtElapsed: -1,
            });
            const hitSphere = new THREE.Mesh(lampHitGeo, lampHitMat);
            hitSphere.position.copy(worldPos);
            hitSphere.userData.butterLampIndex = idx;
            hitSphere.layers.set(2);
            this.scene.add(hitSphere);
            this.butterLampHitTargets.push(hitSphere);
          }
        }
        if (built.group.userData.babyRitualLampLight instanceof THREE.PointLight) {
          this.babyRitualLampLight = built.group.userData.babyRitualLampLight;
        }
        if (built.group.userData.mayaDeviHighlights) {
          this.mayaDeviHighlights = built.group.userData.mayaDeviHighlights;
        }
        const rawPlaques = built.group.userData.mayaDeviPlaqueHitTargets as
          | Array<{ mesh: THREE.Mesh; highlightKey: 'markerStone' | 'mauryanChambers' | 'nativityRelief' }>
          | undefined;
        if (Array.isArray(rawPlaques)) {
          for (const item of rawPlaques) {
            item.mesh.layers.set(2);
            item.mesh.userData.mayaDeviPlaqueKey = item.highlightKey;
            this.mayaDeviPlaqueHitTargets.push(item.mesh);
          }
        }
      }
      if (lm.id === 'kathmandu-stupa') {
        const lingamHit = built.group.userData.lingamHitTarget as THREE.Mesh | undefined;
        if (lingamHit) {
          lingamHit.layers.set(2);
          lingamHit.userData.nonCollidable = true;
          lingamHit.userData.pashupatiAction = 'inspect-shiva-lingam';
          this.pashupatiLingamHitTarget = lingamHit;
        }
        const nandiHit = built.group.userData.nandiHitTarget as THREE.Mesh | undefined;
        if (nandiHit) {
          nandiHit.layers.set(2);
          nandiHit.userData.nonCollidable = true;
          nandiHit.userData.pashupatiAction = 'inspect-golden-nandi';
          this.pashupatiNandiHitTarget = nandiHit;
        }
        const rackHits = built.group.userData.gheeLampHitTargets as THREE.Mesh[] | undefined;
        if (Array.isArray(rackHits)) {
          rackHits.forEach((mesh, rIdx) => {
            mesh.layers.set(2);
            mesh.userData.nonCollidable = true;
            mesh.userData.pashupatiRackIndex = rIdx;
            this.pashupatiGheeLampHitTargets.push(mesh);
          });
        }
        const aaratiHit = built.group.userData.aaratiHitTarget as THREE.Mesh | undefined;
        if (aaratiHit) {
          aaratiHit.layers.set(2);
          aaratiHit.userData.nonCollidable = true;
          aaratiHit.userData.pashupatiAction = 'perform-bagmati-aarati';
          this.pashupatiAaratiHitTarget = aaratiHit;
        }
        if (typeof built.group.userData.triggerLingamOffering === 'function') {
          this.pashupatiLingamOfferingFn = built.group.userData.triggerLingamOffering as () => void;
        }
        if (typeof built.group.userData.toggleGheeLampRack === 'function') {
          this.pashupatiToggleRackFn = built.group.userData.toggleGheeLampRack as (idx: number) => boolean;
        }
        if (typeof built.group.userData.triggerBagmatiAarati === 'function') {
          this.pashupatiTriggerAaratiFn = built.group.userData.triggerBagmatiAarati as () => void;
        }
      }
      if (built.cameraOccluders && built.cameraOccluders.length > 0) {
        this.cameraOccluders.push(...built.cameraOccluders);
      }

      const rawBells = built.group.userData.templeBells as THREE.Group[] | undefined;
      if (rawBells && rawBells.length > 0) {
        built.group.updateMatrixWorld(true);
        const bellHitGeo = new THREE.SphereGeometry(0.95, 8, 8);
        const bellHitMat = new THREE.MeshBasicMaterial({ visible: false });
        for (const bellGroup of rawBells) {
          const swingPivot = (bellGroup.userData.bellSwingPivot as THREE.Object3D | undefined) ?? bellGroup;
          const clapperPivot = (bellGroup.userData.bellClapperPivot as THREE.Object3D | undefined) ?? null;
          const worldPos = new THREE.Vector3();
          bellGroup.getWorldPosition(worldPos);
          const scaleY = bellGroup.scale.y || 1;
          const bellIndex = this.templeBellEntries.length;
          this.templeBellEntries.push({
            bellGroup,
            swingPivot,
            clapperPivot,
            worldPos,
            pitchScale: Math.max(0.76, Math.min(1.22, 1.15 - scaleY * 0.22)),
            ringStart: -10,
            ringDuration: 0,
            amplitude: 0,
            cooldownUntil: 0,
          });
          const hitSphere = new THREE.Mesh(bellHitGeo, bellHitMat);
          hitSphere.position.set(worldPos.x, worldPos.y - 0.38 * scaleY, worldPos.z);
          hitSphere.userData.bellIndex = bellIndex;
          hitSphere.layers.set(2);
          this.scene.add(hitSphere);
          this.bellHitTargets.push(hitSphere);
        }
      }

      // Proximity inspection prompts are surfaced cleanly in the HUD without floating ground circles.
    }
  }

  private populateOuterTempleGrounds(): void {
    const outerGroup = new THREE.Group();
    outerGroup.userData.snapCategory = 'outer-root';
    this.outerGroundsGroup = outerGroup;

    const whiteMarbleMat = getCachedMaterial(
      this.textures,
      'outer-white-marble',
      () =>
        new THREE.MeshPhysicalMaterial({
          map: this.textures.janaki.marbleAshlarMap,
          normalMap: this.textures.janaki.marbleAshlarNormal,
          normalScale: new THREE.Vector2(0.55, 0.55),
          roughnessMap: this.textures.janaki.marbleAshlarRough,
          aoMap: this.textures.janaki.marbleAshlarAo,
          aoMapIntensity: 0.85,
          color: 0xf4efe6,
          roughness: 1.0,
          metalness: 0.03,
          clearcoat: 0.16,
          clearcoatRoughness: 0.44,
          ior: 1.48,
        }),
    );
    const tealMarbleMat = getCachedMaterial(
      this.textures,
      'outer-teal-marble',
      () =>
        new THREE.MeshStandardMaterial({
          map: this.textures.janaki.marbleTrimMap,
          normalMap: this.textures.janaki.marbleTrimNormal,
          normalScale: new THREE.Vector2(0.48, 0.48),
          roughnessMap: this.textures.janaki.marbleTrimRough,
          aoMap: this.textures.janaki.marbleTrimAo,
          aoMapIntensity: 0.8,
          color: 0x1d5f66,
          roughness: 1.0,
          metalness: 0.05,
        }),
    );
    const weatheredStoneMat = getCachedMaterial(
      this.textures,
      'outer-weathered-stone',
      () =>
        new THREE.MeshStandardMaterial({
          map: this.textures.sandstoneMap,
          normalMap: this.textures.sandstoneNormal,
          normalScale: new THREE.Vector2(0.75, 0.75),
          roughnessMap: this.textures.sandstoneRough,
          aoMap: this.textures.sandstoneAo,
          aoMapIntensity: 0.84,
          color: 0xc8bfb0,
          roughness: 1.0,
        }),
    );
    const agedBronzeMat = getCachedMaterial(
      this.textures,
      'outer-aged-bronze',
      () =>
        new THREE.MeshStandardMaterial({
          map: this.textures.agedBronzeMap,
          normalMap: this.textures.agedBronzeNormal,
          normalScale: new THREE.Vector2(0.85, 0.85),
          roughnessMap: this.textures.agedBronzeRough,
          color: 0xc2924c,
          roughness: 0.32,
          metalness: 0.86,
        }),
    );
    const brightBrassMat = getCachedMaterial(
      this.textures,
      'outer-bright-brass',
      () =>
        new THREE.MeshStandardMaterial({
          color: 0xe7bc5e,
          roughness: 0.24,
          metalness: 0.9,
          emissive: 0x5c3b07,
          emissiveIntensity: 0.2,
        }),
    );
    const timberMat = getCachedMaterial(
      this.textures,
      'outer-timber',
      () =>
        new THREE.MeshStandardMaterial({
          map: this.textures.woodMap,
          normalMap: this.textures.woodNormal,
          color: 0x7b5a3d,
          roughness: 0.86,
        }),
    );
    const emberMat = getCachedMaterial(
      this.textures,
      'outer-ember',
      () =>
        new THREE.MeshStandardMaterial({
          color: 0x6b2210,
          emissive: 0xff5a1f,
          emissiveIntensity: 2.05,
          roughness: 0.65,
        }),
    );
    const flagColors = [0x2563eb, 0xf8fafc, 0xdc2626, 0x16a34a, 0xeab308];
    const flagMats = flagColors.map((hex, i) =>
      getCachedMaterial(
        this.textures,
        `outer-flag-mat-${i}`,
        () =>
          new THREE.MeshStandardMaterial({
            color: hex,
            roughness: 0.86,
            side: THREE.DoubleSide,
          }),
      ),
    );

    const lungtaDrapeMats = getLungtaDrapeMaterials();
    const outerFlagMats = lungtaDrapeMats.length >= 5 ? lungtaDrapeMats : flagMats;

    const urliSuite = new UrliOfferingBowlSuite(
      Math.max(4, this.textures.meadowMap?.anisotropy || 4),
    );
    let offeringBowlIdx = 0;

    // Makrana Marble Pedestal + Cast-Bronze Newari Tripod Dhupauro Censer geometries (smooth 24-seg pedestals!)
    const censerFootingGeo = new THREE.CylinderGeometry(0.44, 0.52, 0.82, 24);
    const censerBase1Geo = new THREE.CylinderGeometry(0.38, 0.43, 0.12, 24);
    const censerBase2Geo = new THREE.CylinderGeometry(0.29, 0.34, 0.14, 24);
    const censerTealRingGeo = new THREE.CylinderGeometry(0.26, 0.28, 0.06, 24);
    const censerLegGeo = new THREE.CylinderGeometry(0.026, 0.02, 0.36, 10);
    const censerBowlPts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.16, 0.02),
      new THREE.Vector2(0.27, 0.12),
      new THREE.Vector2(0.31, 0.22),
      new THREE.Vector2(0.34, 0.26),
      new THREE.Vector2(0.29, 0.27),
      new THREE.Vector2(0.23, 0.22),
      new THREE.Vector2(0.0, 0.14),
    ];
    const censerBowlGeo = new THREE.LatheGeometry(censerBowlPts, 24);
    const censerRimRingGeo = new THREE.TorusGeometry(0.305, 0.012, 8, 24);
    censerRimRingGeo.rotateX(Math.PI / 2);
    const emberBedGeo = new THREE.SphereGeometry(0.19, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const stickGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.28, 6);
    const stickTipGeo = new THREE.SphereGeometry(0.012, 6, 6);

    const bambooPoleMat = new THREE.MeshStandardMaterial({ color: 0x9b7142, roughness: 0.72, metalness: 0.08 });
    const flagPoleGeo = new THREE.CylinderGeometry(0.036, 0.054, 3.15, 12);
    const flagAnchorGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.92, 8);
    const flagCollarGeo = new THREE.CylinderGeometry(0.17, 0.21, 0.14, 8);
    const flagFinialGeo = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.0, 0.0),
        new THREE.Vector2(0.055, 0.0),
        new THREE.Vector2(0.068, 0.045),
        new THREE.Vector2(0.032, 0.09),
        new THREE.Vector2(0.048, 0.135),
        new THREE.Vector2(0.012, 0.21),
        new THREE.Vector2(0.0, 0.24),
      ],
      12,
    );
    const flagRockGeo = new THREE.IcosahedronGeometry(0.18, 1);
    const flagClothGeo = new THREE.PlaneGeometry(0.28, 0.30, 5, 4);
    const cordMat = new THREE.MeshStandardMaterial({ color: 0xd6cfc2, roughness: 0.9 });

    for (const spot of OUTER_TEMPLE_ARTIFACT_SPOTS) {
      const artifact = new THREE.Group();
      const terrY = sampleTerrainMeshHeight(this.terrainMesh, spot.x, spot.z);
      const baseY =
        spot.kind === 'prayer-flags' && getPashupatinathSurfaceY(spot.x, spot.z) === null
          ? terrY
          : Math.max(getSurfaceHeightAt(spot.x, spot.z), terrY);
      artifact.position.set(spot.x, baseY, spot.z);
      artifact.rotation.y = spot.rotY;
      artifact.scale.setScalar(spot.scale);

      if (spot.kind === 'offering-bowl') {
        const builtBowl = urliSuite.createOfferingBowlAssembly(
          {
            whiteMarbleMat,
            tealMarbleMat,
            weatheredStoneMat,
            agedBronzeMat,
            brightBrassMat,
          },
          offeringBowlIdx * 1.37,
        );
        offeringBowlIdx++;
        artifact.add(builtBowl.group);
        artifact.userData.noSpin = true;
        artifact.userData.onEnvironmentUpdate = (env: {
          elapsed: number;
          skyColorHex: string;
          lanternIntensity: number;
        }) => {
          const t = env.elapsed;
          const flameLevel = THREE.MathUtils.clamp(
            0.72 + (env.lanternIntensity ?? 1.0) * 0.34,
            0.70,
            1.35,
          );
          builtBowl.waterUniforms.uTime.value = t;
          builtBowl.waterUniforms.uSkyColor.value.set(env.skyColorHex);
          builtBowl.waterUniforms.uFlameIntensity.value = flameLevel;
          for (let fi = 0; fi < builtBowl.flames.length; fi++) {
            const fl = builtBowl.flames[fi];
            fl.mantleUniforms.uTime.value = t;
            fl.mantleUniforms.uIntensity.value = flameLevel;
            fl.haloUniforms.uTime.value = t;
            fl.haloUniforms.uIntensity.value = flameLevel;
            const pulseY = 1 + Math.sin(t * 7.6 + fl.phase) * 0.055 + Math.cos(t * 11.4 + fl.phase) * 0.025;
            const sway = Math.sin(t * 5.2 + fl.phase) * 0.045;
            fl.rig.scale.set(fl.baseScale, fl.baseScale * pulseY, fl.baseScale);
            fl.rig.rotation.z = sway;
          }
        };
        this.animatedLandmarkNodes.push(artifact);
        this.animatedNodeAnchors.push({ isGlobal: false, x: spot.x, z: spot.z });
      } else if (spot.kind === 'incense-stand') {
        const footing = new THREE.Mesh(censerFootingGeo, weatheredStoneMat);
        footing.position.y = -0.39;
        footing.receiveShadow = true;
        const b1 = new THREE.Mesh(censerBase1Geo, whiteMarbleMat);
        b1.position.y = 0.06;
        b1.castShadow = true;
        b1.receiveShadow = true;
        const b2 = new THREE.Mesh(censerBase2Geo, whiteMarbleMat);
        b2.position.y = 0.19;
        b2.castShadow = true;
        const ring = new THREE.Mesh(censerTealRingGeo, tealMarbleMat);
        ring.position.y = 0.29;
        artifact.add(footing, b1, b2, ring);

        for (let legIdx = 0; legIdx < 3; legIdx++) {
          const ang = (legIdx / 3) * Math.PI * 2;
          const leg = new THREE.Mesh(censerLegGeo, agedBronzeMat);
          leg.position.set(Math.cos(ang) * 0.17, 0.48, Math.sin(ang) * 0.17);
          leg.rotation.z = Math.cos(ang) * 0.16;
          leg.rotation.x = -Math.sin(ang) * 0.16;
          leg.castShadow = true;
          artifact.add(leg);
        }

        const bowl = new THREE.Mesh(censerBowlGeo, agedBronzeMat);
        bowl.position.y = 0.62;
        bowl.castShadow = true;
        const rimRing = new THREE.Mesh(censerRimRingGeo, brightBrassMat);
        rimRing.position.y = 0.85;
        const ember = new THREE.Mesh(emberBedGeo, emberMat);
        ember.position.y = 0.84;
        artifact.add(bowl, rimRing, ember);

        for (let s = 0; s < 5; s++) {
          const ang = (s / 5) * Math.PI * 2 + 0.4;
          const stick = new THREE.Mesh(stickGeo, timberMat);
          stick.position.set(Math.cos(ang) * 0.055, 0.99, Math.sin(ang) * 0.055);
          stick.rotation.z = -Math.cos(ang) * 0.18;
          stick.rotation.x = Math.sin(ang) * 0.18;
          const tip = new THREE.Mesh(stickTipGeo, emberMat);
          tip.position.set(Math.cos(ang) * 0.078, 1.125, Math.sin(ang) * 0.078);
          artifact.add(stick, tip);
        }
      } else if (spot.kind === 'prayer-flags') {
        const a2WorldX = spot.x + Math.cos(spot.rotY) * 1.4 * spot.scale;
        const a2WorldZ = spot.z - Math.sin(spot.rotY) * 1.4 * spot.scale;
        const a2TerrY = sampleTerrainMeshHeight(this.terrainMesh, a2WorldX, a2WorldZ);
        const a2LocalOffset = (a2TerrY - baseY) / Math.max(spot.scale, 0.5);
        const a2LocalDrop = Math.max(0, -a2LocalOffset);

        const anchor1 = new THREE.Mesh(flagAnchorGeo, whiteMarbleMat);
        anchor1.position.y = -0.34;
        anchor1.castShadow = true;
        anchor1.receiveShadow = true;
        const collar1 = new THREE.Mesh(flagCollarGeo, weatheredStoneMat);
        collar1.position.y = 0.16;
        const anchor2 = new THREE.Mesh(flagAnchorGeo, whiteMarbleMat);
        anchor2.position.set(1.4, -0.34 + a2LocalOffset, 0);
        anchor2.scale.set(0.88, 1 + a2LocalDrop * 1.4, 0.88);
        anchor2.castShadow = true;
        anchor2.receiveShadow = true;
        const collar2 = new THREE.Mesh(flagCollarGeo, weatheredStoneMat);
        collar2.position.set(1.4, 0.14 + a2LocalOffset, 0);
        artifact.add(anchor1, collar1, anchor2, collar2);

        const pole = new THREE.Mesh(flagPoleGeo, bambooPoleMat);
        pole.position.y = 1.325;
        pole.castShadow = true;
        const finial1 = new THREE.Mesh(flagFinialGeo, brightBrassMat);
        finial1.position.y = 2.88;
        artifact.add(pole, finial1);

        const pole2 = new THREE.Mesh(flagPoleGeo, bambooPoleMat);
        pole2.position.set(1.4, 1.195 + a2LocalOffset * 0.5, 0);
        pole2.scale.set(0.85, 0.9 + Math.abs(a2LocalOffset) * 0.45, 0.85);
        pole2.castShadow = true;
        const finial2 = new THREE.Mesh(flagFinialGeo, brightBrassMat);
        finial2.scale.setScalar(0.86);
        finial2.position.set(1.4, 2.60 + a2LocalOffset * 0.35, 0);
        artifact.add(pole2, finial2);

        for (let r = 0; r < 6; r++) {
          const ang = (r / 6) * Math.PI * 2;
          const rock = new THREE.Mesh(flagRockGeo, weatheredStoneMat);
          rock.position.set(Math.cos(ang) * 0.24, 0.02, Math.sin(ang) * 0.24);
          rock.scale.set(1.05, 0.58, 0.9);
          rock.castShadow = true;
          artifact.add(rock);
        }

        const rightTopY = 2.42 + a2LocalOffset * 0.35;
        const spanDy = rightTopY - 2.62;
        const cordLen = Math.hypot(1.4, spanDy);
        const cordGeo = new THREE.CylinderGeometry(0.009, 0.009, cordLen, 6);
        cordGeo.rotateZ(Math.PI / 2);
        const cord = new THREE.Mesh(cordGeo, cordMat);
        cord.position.set(0.7, (2.62 + rightTopY) * 0.5, 0);
        cord.rotation.z = Math.atan2(spanDy, 1.4);
        cord.userData.nonCollidable = true;
        artifact.add(cord);

        for (let f = 0; f < 5; f++) {
          const t = (f + 0.5) / 5;
          const flag = new THREE.Mesh(flagClothGeo, outerFlagMats[f % outerFlagMats.length]);
          flag.position.set(t * 1.4, 2.47 + spanDy * t, 0);
          flag.userData.nonCollidable = true;
          flag.userData.noMerge = true;
          artifact.add(flag);
        }
      }

      if (spot.kind === 'offering-bowl' || spot.kind === 'incense-stand') {
        artifact.userData.snapCategory = 'pot';
        artifact.userData.groundEmbed = 0.78 * spot.scale;
        artifact.userData.lockXZ = true;
      } else if (spot.kind === 'prayer-flags') {
        artifact.userData.prayerFlagSpot = spot;
      }
      outerGroup.add(artifact);
    }

    this.scene.add(outerGroup);
  }

  private buildSakuraPetals(): void {
    const sakuraSpots = getWorldTreeSpots().filter((s) => s.type === 'sakura');
    if (sakuraSpots.length === 0) return;

    const petalsPerTree = 24;
    const count = Math.min(1100, sakuraSpots.length * petalsPerTree);
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const tree = sakuraSpots[i % sakuraSpots.length];
      const ang = (i * 2.399963) % (Math.PI * 2);
      const rad = 0.45 + ((i * 19) % 100) / 28;
      const baseY = groundHeightAt(tree.x, tree.z);
      positions[i * 3] = tree.x + Math.cos(ang) * rad;
      positions[i * 3 + 1] = baseY + 1.6 + ((i * 37) % 100) / 24;
      positions[i * 3 + 2] = tree.z + Math.sin(ang) * rad;

      seeds[i * 3] = 0.62 + ((i * 13) % 100) / 105; // fall speed
      seeds[i * 3 + 1] = ((i * 71) % 628) / 100; // phase
      seeds[i * 3 + 2] = 0.85 + ((i * 29) % 100) / 120; // size
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3));

    const initialHeight = Math.max(1, this.container.clientHeight || window.innerHeight);
    const initialPixelScale =
      this.renderer.getPixelRatio() * Math.max(0.65, initialHeight / 900);

    this.sakuraPetalsMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uPixelScale: { value: initialPixelScale },
        uWind: { value: new THREE.Vector2(0.45, 0.25) },
        uLightTint: { value: new THREE.Color('#ffe8f1') },
      },
      vertexShader: `
        attribute vec3 aSeed;
        uniform float uTime;
        uniform float uPixelScale;
        uniform vec2 uWind;
        varying float vAlpha;
        varying float vRot;
        void main() {
          float fallCycle = fract(uTime * 0.13 * aSeed.x + aSeed.y * 0.159);
          float yOffset = (0.55 - fallCycle) * 4.4;
          vec2 swirl = vec2(
            sin(uTime * 1.25 + aSeed.y) * 1.25,
            cos(uTime * 1.05 + aSeed.y * 1.3) * 1.25
          );
          vec2 windSweep = uWind * (fallCycle * 2.2);
          vec3 p = position + vec3(
            swirl.x + windSweep.x,
            yOffset,
            swirl.y + windSweep.y
          );
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          float camDist = -mvPosition.z;
          float farFade = 1.0 - smoothstep(46.0, 108.0, camDist);
          float cycleFade = smoothstep(0.0, 0.12, fallCycle) * (1.0 - smoothstep(0.84, 1.0, fallCycle));
          vAlpha = farFade * cycleFade * 0.92;
          vRot = uTime * 2.3 + aSeed.y;
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = clamp((16.5 * aSeed.z * uPixelScale) / max(camDist, 1.0), 1.8, 18.0 * uPixelScale);
        }
      `,
      fragmentShader: `
        uniform vec3 uLightTint;
        varying float vAlpha;
        varying float vRot;
        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float c = cos(vRot);
          float s = sin(vRot);
          vec2 p = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);
          // Delicate notched cherry blossom petal silhouette
          float notch = smoothstep(0.0, 0.18, p.y) * 0.12 * exp(-p.x * p.x * 40.0);
          float d = length(vec2(p.x * 1.15, (p.y + notch) * 1.78)) * 2.0;
          float a = smoothstep(1.0, 0.22, d) * vAlpha;
          if (a < 0.02) discard;
          vec3 basePetal = mix(vec3(1.0, 0.86, 0.92), vec3(0.97, 0.62, 0.77), clamp(d, 0.0, 1.0));
          gl_FragColor = vec4(basePetal * uLightTint, a);
        }
      `,
    });

    const pts = new THREE.Points(geo, this.sakuraPetalsMat);
    pts.frustumCulled = false;
    pts.renderOrder = 2;
    this.sakuraPetalsPoints = pts;
    this.scene.add(pts);
  }

  private buildInteractiveProps(): void {
    this.interactiveProps = createInteractiveProps(this.textures);
    this.propHitTargets = [];
    this.propSoundCooldowns = new Array(this.interactiveProps.length).fill(0);
    for (const p of this.interactiveProps) {
      this.scene.add(p.mesh);
      this.propHitTargets.push(...p.hitMeshes);
    }
  }

  private buildAtmosphereParticles(): void {
    const count = ATMOSPHERE_PARTICLE_COUNT;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 3);
    const normIndices = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = Math.random() * ATMOSPHERE_BOX_SIZE.x;
      positions[i * 3 + 1] = Math.random() * ATMOSPHERE_BOX_SIZE.y;
      positions[i * 3 + 2] = Math.random() * ATMOSPHERE_BOX_SIZE.z;

      seeds[i * 3] = 0.72 + Math.random() * 0.65; // individual speed variance
      seeds[i * 3 + 1] = Math.random() * Math.PI * 2; // turbulence phase
      seeds[i * 3 + 2] = 0.65 + Math.random() * 0.8; // individual scale variance
      normIndices[i] = count > 1 ? i / (count - 1) : 0;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3));
    geo.setAttribute('aNormIndex', new THREE.BufferAttribute(normIndices, 1));

    const initial = computeAtmosphereParticleProfile(
      this.weather,
      getPresetHour(this.timePreset),
    );
    this.currentParticleState = {
      activeRatio: initial.activeRatio,
      opacity: initial.opacity,
      particleSize: initial.particleSize,
      fallSpeed: initial.fallSpeed,
      windDriftX: initial.windDriftX,
      windDriftZ: initial.windDriftZ,
      turbulence: initial.turbulence,
      streakStretch: initial.streakStretch,
      glowStrength: initial.glowStrength,
    };

    const initialHeight = Math.max(1, this.container.clientHeight || window.innerHeight);
    const initialPixelScale =
      this.renderer.getPixelRatio() * Math.max(0.65, initialHeight / 900);

    this.atmosphereMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uCenter: { value: new THREE.Vector3(SPAWN_POSITION.x, 0, SPAWN_POSITION.z) },
        uDrift: { value: new THREE.Vector3() },
        uBoxSize: { value: ATMOSPHERE_BOX_SIZE.clone() },
        uActiveFraction: { value: initial.activeRatio },
        uTurbulence: { value: initial.turbulence },
        uBaseSize: { value: initial.particleSize },
        uPixelScale: { value: initialPixelScale },
        uOpacity: { value: initial.opacity },
        uColor: { value: new THREE.Color(initial.colorHex) },
        uStreak: { value: initial.streakStretch },
        uGlow: { value: initial.glowStrength },
      },
      vertexShader: `
        attribute vec3 aSeed;
        attribute float aNormIndex;

        uniform float uTime;
        uniform vec3 uCenter;
        uniform vec3 uDrift;
        uniform vec3 uBoxSize;
        uniform float uActiveFraction;
        uniform float uTurbulence;
        uniform float uBaseSize;
        uniform float uPixelScale;

        varying float vAlpha;

        void main() {
          if (aNormIndex > uActiveFraction) {
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
            gl_PointSize = 0.0;
            vAlpha = 0.0;
            return;
          }

          vec3 halfBox = uBoxSize * 0.5;
          vec3 flutter = vec3(
            sin(uTime * 0.9 + aSeed.y) * uTurbulence,
            cos(uTime * 0.72 + aSeed.y * 1.37) * (uTurbulence * 0.35),
            cos(uTime * 0.81 + aSeed.y * 0.89) * uTurbulence
          );
          vec3 motion = vec3(uDrift.x * aSeed.x, uDrift.y * aSeed.x, uDrift.z * aSeed.x) + flutter;
          vec3 baseAnchor = vec3(uCenter.x, uCenter.y - 1.5, uCenter.z);
          vec3 rel = mod(position + motion - baseAnchor + vec3(halfBox.x, 0.0, halfBox.z), uBoxSize) - vec3(halfBox.x, 0.0, halfBox.z);
          vec3 worldPos = vec3(uCenter.x + rel.x, (uCenter.y - 1.5) + rel.y, uCenter.z + rel.z);

          vec4 mvPosition = modelViewMatrix * vec4(worldPos, 1.0);
          float camDist = -mvPosition.z;

          float heightFade = smoothstep(0.0, 1.8, rel.y) * (1.0 - smoothstep(uBoxSize.y - 3.6, uBoxSize.y, rel.y));
          float nearFade = smoothstep(1.2, 4.0, camDist);
          float farFade = 1.0 - smoothstep(26.0, 46.0, camDist);
          float poolFade = smoothstep(uActiveFraction, max(0.0, uActiveFraction - 0.06), aNormIndex);

          vAlpha = heightFade * nearFade * farFade * poolFade;
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = clamp((uBaseSize * aSeed.z * uPixelScale) / max(camDist, 1.0), 1.5, 42.0 * uPixelScale);
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        uniform vec3 uColor;
        uniform float uStreak;
        uniform float uGlow;

        varying float vAlpha;

        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          // Slight wind-angled tilt when rendering raindrop streaks
          float c = 0.985;
          float s = 0.17;
          vec2 tilted = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);
          vec2 p = mix(uv, tilted, uStreak);

          float xScale = mix(1.0, 4.4, uStreak);
          float yScale = mix(1.0, 0.92, uStreak);
          float d = length(vec2(p.x * xScale, p.y * yScale)) * 2.0;

          float radial = smoothstep(1.0, 0.1, d);
          float shape = mix(pow(radial, 1.25), pow(radial, 0.95), uStreak);
          float core = smoothstep(0.42, 0.0, d) * uGlow;
          vec3 color = uColor + vec3(core * 0.35);

          float alpha = shape * vAlpha * uOpacity;
          if (alpha < 0.008) discard;
          gl_FragColor = vec4(color, alpha);
        }
      `,
    });

    this.atmospherePoints = new THREE.Points(geo, this.atmosphereMat);
    this.atmospherePoints.frustumCulled = false;
    this.atmospherePoints.renderOrder = 2;
    this.scene.add(this.atmospherePoints);
  }

  private buildFootstepParticles(): void {
    for (let i = 0; i < FOOTSTEP_PARTICLE_COUNT; i++) {
      this.fsPositions[i * 3 + 1] = -999;
      this.fsAlphas[i] = 0;
      this.fsAges[i] = 1;
      this.fsLifetimes[i] = 1;
    }

    const geo = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(this.fsPositions, 3);
    const colAttr = new THREE.BufferAttribute(this.fsColors, 3);
    const sizeAttr = new THREE.BufferAttribute(this.fsSizes, 1);
    const alphaAttr = new THREE.BufferAttribute(this.fsAlphas, 1);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    colAttr.setUsage(THREE.DynamicDrawUsage);
    sizeAttr.setUsage(THREE.DynamicDrawUsage);
    alphaAttr.setUsage(THREE.DynamicDrawUsage);

    geo.setAttribute('position', posAttr);
    geo.setAttribute('aColor', colAttr);
    geo.setAttribute('aSize', sizeAttr);
    geo.setAttribute('aAlpha', alphaAttr);
    this.footstepGeo = geo;

    const initialHeight = Math.max(1, this.container.clientHeight || window.innerHeight);
    const initialPixelScale =
      this.renderer.getPixelRatio() * Math.max(0.65, initialHeight / 900);

    this.footstepMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uPixelScale: { value: initialPixelScale },
      },
      vertexShader: `
        attribute vec3 aColor;
        attribute float aSize;
        attribute float aAlpha;
        uniform float uPixelScale;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = aColor;
          vAlpha = aAlpha;
          if (aAlpha <= 0.005) {
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
            gl_PointSize = 0.0;
            return;
          }
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float camDist = max(-mvPosition.z, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = clamp((aSize * uPixelScale) / camDist, 1.5, 34.0 * uPixelScale);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float r = length(uv) * 2.0;
          float a = smoothstep(1.0, 0.14, r) * vAlpha;
          if (a < 0.01) discard;
          gl_FragColor = vec4(vColor, a);
        }
      `,
    });

    this.footstepPoints = new THREE.Points(geo, this.footstepMat);
    this.footstepPoints.frustumCulled = false;
    this.footstepPoints.renderOrder = 3;
    this.scene.add(this.footstepPoints);
  }

  private spawnFootstepBurst(
    surface: FootstepSurfaceKind,
    isLanding: boolean,
    stepSide: number,
  ): void {
    const count = isLanding ? 14 : 7;
    const cosY = Math.cos(this.playerYaw);
    const sinY = Math.sin(this.playerYaw);
    const footX = this.playerPos.x + cosY * stepSide * 0.18;
    const footZ = this.playerPos.z - sinY * stepSide * 0.18;
    const footY = this.playerPos.y + 0.05;

    for (let k = 0; k < count; k++) {
      const idx = this.fsCursor;
      this.fsCursor = (this.fsCursor + 1) % FOOTSTEP_PARTICLE_COUNT;
      const angle = Math.random() * Math.PI * 2;
      const speed = (isLanding ? 1.25 : 0.72) * (0.45 + Math.random() * 0.75);
      const i3 = idx * 3;

      this.fsPositions[i3] = footX + (Math.random() - 0.5) * 0.22;
      this.fsPositions[i3 + 1] = footY + Math.random() * 0.06;
      this.fsPositions[i3 + 2] = footZ + (Math.random() - 0.5) * 0.22;

      this.fsVel[i3] = Math.cos(angle) * speed;
      this.fsVel[i3 + 2] = Math.sin(angle) * speed;

      if (surface === 'grass') {
        const isBlade = k % 2 === 0;
        this.fsKinds[idx] = isBlade ? 1 : 0;
        this.fsVel[i3 + 1] = isBlade
          ? (isLanding ? 1.75 : 1.15) + Math.random() * 0.65
          : 0.4 + Math.random() * 0.42;
        if (isBlade) {
          this.fsColors[i3] = 0.34 + Math.random() * 0.08;
          this.fsColors[i3 + 1] = 0.52 + Math.random() * 0.12;
          this.fsColors[i3 + 2] = 0.22 + Math.random() * 0.06;
          this.fsSizes[idx] = isLanding ? 30 : 22;
          this.fsLifetimes[idx] = 0.48 + Math.random() * 0.18;
        } else {
          this.fsColors[i3] = 0.60 + Math.random() * 0.08;
          this.fsColors[i3 + 1] = 0.53 + Math.random() * 0.07;
          this.fsColors[i3 + 2] = 0.39 + Math.random() * 0.06;
          this.fsSizes[idx] = isLanding ? 36 : 26;
          this.fsLifetimes[idx] = 0.52 + Math.random() * 0.18;
        }
      } else if (surface === 'wood') {
        this.fsKinds[idx] = 0;
        this.fsVel[i3 + 1] = 0.32 + Math.random() * 0.34;
        this.fsColors[i3] = 0.74 + Math.random() * 0.06;
        this.fsColors[i3 + 1] = 0.62 + Math.random() * 0.06;
        this.fsColors[i3 + 2] = 0.46 + Math.random() * 0.05;
        this.fsSizes[idx] = isLanding ? 32 : 24;
        this.fsLifetimes[idx] = 0.48 + Math.random() * 0.16;
      } else {
        this.fsKinds[idx] = 0;
        this.fsVel[i3 + 1] = (isLanding ? 0.56 : 0.32) + Math.random() * 0.32;
        this.fsColors[i3] = 0.88 + Math.random() * 0.06;
        this.fsColors[i3 + 1] = 0.82 + Math.random() * 0.06;
        this.fsColors[i3 + 2] = 0.74 + Math.random() * 0.05;
        this.fsSizes[idx] = isLanding ? 38 : 28;
        this.fsLifetimes[idx] = 0.54 + Math.random() * 0.18;
      }
      this.fsAges[idx] = 0;
      this.fsAlphas[idx] = isLanding ? 0.78 : 0.62;
    }
    this.fsActive = true;
    this.footstepBurstCount += 1;
    recordFootprintDecal(
      this.footprintPool,
      this.playerPos.x,
      this.playerPos.y,
      this.playerPos.z,
      this.playerYaw,
      stepSide === 0 ? 1 : (stepSide > 0 ? 1 : -1),
      surface,
    );
    this.writeDataset('footstepCount', String(this.footstepBurstCount));
    this.writeDataset('footstepActive', 'true');
    this.writeDataset('footprintDecals', String(this.footprintPool.totalSpawned));
  }

  private buildFootprintDecals(): void {
    this.footprintTex = getCachedTexture('footprint-decal-tex', () => {
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 128;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 64, 128);
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        // Soft sole oval + heel oval silhouette
        ctx.beginPath();
        ctx.ellipse(32, 42, 16, 26, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(32, 92, 12.5, 16, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    });
    this.footprintGeo = new THREE.PlaneGeometry(0.18, 0.34);
    this.footprintGeo.rotateX(-Math.PI / 2);
    this.footprintMat = new THREE.MeshBasicMaterial({
      map: this.footprintTex,
      color: 0xffffff,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const cap = this.footprintPool.slots.length;
    this.footprintInst = new THREE.InstancedMesh(this.footprintGeo, this.footprintMat, cap);
    this.footprintInst.frustumCulled = false;
    this.footprintInst.renderOrder = 1;
    this.footprintInst.userData.nonCollidable = true;
    const hideScale = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < cap; i++) {
      this.footprintInst.setMatrixAt(i, hideScale);
      this.footprintInst.setColorAt(i, this.footprintColorTmp.setHex(0x6e5a44));
    }
    this.footprintInst.instanceMatrix.needsUpdate = true;
    if (this.footprintInst.instanceColor) this.footprintInst.instanceColor.needsUpdate = true;
    this.scene.add(this.footprintInst);
  }

  private updateFootprintDecals(dt: number): void {
    if (!this.footprintInst) return;
    const activeCount = stepFootprintDecalPool(this.footprintPool, dt);
    const slots = this.footprintPool.slots;
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      if (!s.active) {
        this.footprintDummy.position.set(0, -999, 0);
        this.footprintDummy.scale.setScalar(0);
        this.footprintDummy.updateMatrix();
        this.footprintInst.setMatrixAt(i, this.footprintDummy.matrix);
        continue;
      }
      const fade = computeFootprintDecalAlpha(s.age, s.maxAge);
      this.footprintDummy.position.set(s.x, s.y, s.z);
      this.footprintDummy.rotation.set(0, s.yaw, 0);
      const scaleMul = 0.78 + fade * 0.35;
      this.footprintDummy.scale.set(scaleMul * s.side, 1, scaleMul);
      this.footprintDummy.updateMatrix();
      this.footprintInst.setMatrixAt(i, this.footprintDummy.matrix);

      // Tint subtly darker on stone/wood and earthy olive-brown on grass/dirt
      const baseShade =
        s.surfaceKind === 'grass' ? 0x3b4926 : s.surfaceKind === 'wood' ? 0x422a18 : 0x5c4b39;
      this.footprintColorTmp.setHex(baseShade).multiplyScalar(0.55 + fade * 0.65);
      this.footprintInst.setColorAt(i, this.footprintColorTmp);
    }
    this.footprintInst.instanceMatrix.needsUpdate = true;
    if (this.footprintInst.instanceColor) this.footprintInst.instanceColor.needsUpdate = true;
    this.writeDataset('activeFootprints', String(activeCount));
  }

  private buildMeditationButterflies(): void {
    this.butterflyWingTex = getCachedTexture('butterfly-wing-tex', () => {
      // Paint a detailed scalloped monarch/swallowtail wing alpha+vein CanvasTexture
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, 256, 256);

      // Forewing outer silhouette (hinge at x=0, tip toward x=244, y=34)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(4, 112);
      ctx.bezierCurveTo(58, 44, 168, 12, 238, 30);
      ctx.bezierCurveTo(250, 48, 240, 96, 210, 128);
      ctx.bezierCurveTo(174, 146, 84, 138, 4, 128);
      ctx.closePath();

      // Hindwing scalloped silhouette (y=124..242)
      ctx.moveTo(4, 124);
      ctx.bezierCurveTo(86, 126, 178, 138, 198, 174);
      ctx.bezierCurveTo(206, 200, 178, 232, 138, 240);
      ctx.bezierCurveTo(122, 244, 112, 234, 96, 242);
      ctx.bezierCurveTo(60, 234, 22, 196, 4, 142);
      ctx.closePath();

      const grad = ctx.createRadialGradient(34, 124, 12, 140, 124, 210);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.55, '#f4f4f4');
      grad.addColorStop(0.84, '#d8d8d8');
      grad.addColorStop(1, '#262120');
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.clip();

      // Dark scalloped wing margin & delicate cream marginal spots
      ctx.strokeStyle = '#1c1816';
      ctx.lineWidth = 22;
      ctx.stroke();

      ctx.fillStyle = '#fff9eb';
      const spots: Array<[number, number, number]> = [
        [226, 42, 4.5],
        [228, 66, 4.0],
        [218, 92, 4.0],
        [204, 115, 3.8],
        [186, 166, 3.6],
        [176, 194, 4.0],
        [154, 218, 4.2],
        [126, 228, 3.8],
        [94, 226, 3.6],
      ];
      for (const [sx, sy, sr] of spots) {
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }

      // Crisp organic wing veins radiating from thorax hinge
      ctx.strokeStyle = 'rgba(26, 20, 18, 0.85)';
      ctx.lineCap = 'round';
      const foreVeins: Array<[number, number, number, number, number, number]> = [
        [8, 116, 86, 82, 226, 38],
        [8, 118, 96, 94, 222, 68],
        [8, 120, 102, 108, 210, 98],
        [8, 122, 92, 122, 192, 124],
      ];
      ctx.lineWidth = 3.2;
      for (const [x0, y0, cx1, cy1, x1, y1] of foreVeins) {
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo(cx1, cy1, x1, y1);
        ctx.stroke();
      }
      const hindVeins: Array<[number, number, number, number, number, number]> = [
        [8, 130, 88, 148, 188, 168],
        [8, 133, 82, 166, 166, 204],
        [8, 136, 62, 184, 128, 228],
        [8, 140, 38, 188, 76, 224],
      ];
      ctx.lineWidth = 2.8;
      for (const [x0, y0, cx1, cy1, x1, y1] of hindVeins) {
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo(cx1, cy1, x1, y1);
        ctx.stroke();
      }
      ctx.restore();

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      return tex;
    });

    // Slightly cambered multi-quad wing mesh hinged at x=0 (positive +X wing; mirrored for left wing)
    const wingPos = new Float32Array([
      // Inner forewing + hindwing strip (x: 0 -> 0.085)
      0.0, 0.0, 0.095,
      0.085, 0.012, 0.125,
      0.0, 0.0, -0.095,
      0.085, 0.012, 0.125,
      0.085, 0.008, -0.115,
      0.0, 0.0, -0.095,
      // Outer wing tip strip (x: 0.085 -> 0.175)
      0.085, 0.012, 0.125,
      0.175, 0.005, 0.145,
      0.085, 0.008, -0.115,
      0.175, 0.005, 0.145,
      0.175, -0.002, -0.125,
      0.085, 0.008, -0.115,
    ]);
    const wingUv = new Float32Array([
      0.0, 1.0, 0.49, 1.0, 0.0, 0.0,
      0.49, 1.0, 0.49, 0.0, 0.0, 0.0,
      0.49, 1.0, 1.0, 1.0, 0.49, 0.0,
      1.0, 1.0, 1.0, 0.0, 0.49, 0.0,
    ]);
    this.butterflyWingGeo = new THREE.BufferGeometry();
    this.butterflyWingGeo.setAttribute('position', new THREE.BufferAttribute(wingPos, 3));
    this.butterflyWingGeo.setAttribute('uv', new THREE.BufferAttribute(wingUv, 2));
    this.butterflyWingGeo.computeVertexNormals();

    this.butterflyWingMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: this.butterflyWingTex,
      alphaTest: 0.36,
      transparent: false,
      roughness: 0.48,
      metalness: 0.06,
      emissive: 0x1c1208,
      emissiveIntensity: 0.16,
      side: THREE.DoubleSide,
    });

    const wingCount = this.butterflyStates.length * 2;
    this.butterflyWingInst = new THREE.InstancedMesh(
      this.butterflyWingGeo,
      this.butterflyWingMat,
      wingCount,
    );
    this.butterflyWingInst.frustumCulled = false;
    this.butterflyWingInst.userData.nonCollidable = true;

    // Slender body (thorax + tapered abdomen)
    this.butterflyBodyGeo = new THREE.CapsuleGeometry(0.008, 0.082, 4, 6);
    this.butterflyBodyGeo.rotateX(Math.PI / 2);
    this.butterflyBodyMat = new THREE.MeshStandardMaterial({
      color: 0x201a16,
      roughness: 0.65,
      metalness: 0.05,
    });
    this.butterflyBodyInst = new THREE.InstancedMesh(
      this.butterflyBodyGeo,
      this.butterflyBodyMat,
      this.butterflyStates.length,
    );
    this.butterflyBodyInst.frustumCulled = false;
    this.butterflyBodyInst.userData.nonCollidable = true;

    const palette = [0xf59e28, 0x38bdf8, 0xfacc15, 0xf472b6, 0x6ee7b7];
    const tmpCol = new THREE.Color();
    for (let i = 0; i < this.butterflyStates.length; i++) {
      tmpCol.setHex(palette[this.butterflyStates[i].colorIndex % palette.length]);
      this.butterflyWingInst.setColorAt(i * 2, tmpCol);
      this.butterflyWingInst.setColorAt(i * 2 + 1, tmpCol);
    }
    if (this.butterflyWingInst.instanceColor) {
      this.butterflyWingInst.instanceColor.needsUpdate = true;
    }
    this.scene.add(this.butterflyWingInst);
    this.scene.add(this.butterflyBodyInst);
    this.updateMeditationButterflies(0.016, 0);
  }

  private updateMeditationButterflies(dt: number, elapsed: number): void {
    if (!this.butterflyWingInst) return;
    stepMeditationButterflies(
      this.butterflyStates,
      dt,
      elapsed,
      this.isMeditating,
      this.playerPos.x,
      this.playerPos.y,
      this.playerPos.z,
    );

    for (let i = 0; i < this.butterflyStates.length; i++) {
      const b = this.butterflyStates[i];
      const flap = Math.sin(b.flapPhase) * 0.88 + 0.16;
      const bodyBob = -Math.sin(b.flapPhase) * 0.014;
      this.butterflyRootDummy.position.set(b.x, b.y + bodyBob, b.z);
      this.butterflyRootDummy.rotation.set(0.12, b.yaw, 0);
      this.butterflyRootDummy.scale.setScalar(1);
      this.butterflyRootDummy.updateMatrix();
      this.butterflyBodyInst?.setMatrixAt(i, this.butterflyRootDummy.matrix);

      // Right wing (+X)
      this.butterflyWingDummy.position.set(0.004, 0, 0);
      this.butterflyWingDummy.rotation.set(0, 0, flap);
      this.butterflyWingDummy.scale.set(1, 1, 1);
      this.butterflyWingDummy.updateMatrix();
      this.butterflyMat4Tmp.multiplyMatrices(
        this.butterflyRootDummy.matrix,
        this.butterflyWingDummy.matrix,
      );
      this.butterflyWingInst.setMatrixAt(i * 2, this.butterflyMat4Tmp);

      // Left wing (-X mirrored)
      this.butterflyWingDummy.position.set(-0.004, 0, 0);
      this.butterflyWingDummy.rotation.set(0, 0, -flap);
      this.butterflyWingDummy.scale.set(-1, 1, 1);
      this.butterflyWingDummy.updateMatrix();
      this.butterflyMat4Tmp.multiplyMatrices(
        this.butterflyRootDummy.matrix,
        this.butterflyWingDummy.matrix,
      );
      this.butterflyWingInst.setMatrixAt(i * 2 + 1, this.butterflyMat4Tmp);
    }
    this.butterflyWingInst.instanceMatrix.needsUpdate = true;
    if (this.butterflyBodyInst) {
      this.butterflyBodyInst.instanceMatrix.needsUpdate = true;
    }
    this.writeDataset('butterflyCount', String(this.butterflyStates.length));
    this.writeDataset('butterflyFlockActive', this.isMeditating ? 'true' : 'false');
  }

  private updateFootstepParticles(dt: number): void {
    if (!this.fsActive) {
      this.writeDataset('footstepActive', 'false');
      return;
    }
    let anyAlive = false;
    const damp = Math.exp(-3.4 * dt);

    for (let i = 0; i < FOOTSTEP_PARTICLE_COUNT; i++) {
      const life = this.fsLifetimes[i];
      if (this.fsAges[i] >= life) {
        this.fsAlphas[i] = 0;
        continue;
      }
      this.fsAges[i] += dt;
      const t = this.fsAges[i] / life;
      if (t >= 1) {
        this.fsAlphas[i] = 0;
        this.fsPositions[i * 3 + 1] = -999;
        continue;
      }
      anyAlive = true;
      const i3 = i * 3;
      this.fsVel[i3] *= damp;
      this.fsVel[i3 + 2] *= damp;
      if (this.fsKinds[i] === 1) {
        this.fsVel[i3 + 1] -= 4.8 * dt;
      } else {
        this.fsVel[i3 + 1] += 0.24 * dt;
        this.fsVel[i3 + 1] *= damp;
      }
      this.fsPositions[i3] += this.fsVel[i3] * dt;
      this.fsPositions[i3 + 1] += this.fsVel[i3 + 1] * dt;
      this.fsPositions[i3 + 2] += this.fsVel[i3 + 2] * dt;
      this.fsAlphas[i] = (1 - t) * (1 - t) * 0.68;
      if (this.fsKinds[i] === 0) {
        this.fsSizes[i] += 20 * dt;
      }
    }

    this.fsActive = anyAlive;
    this.writeDataset('footstepActive', anyAlive ? 'true' : 'false');
    (this.footstepGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.footstepGeo.attributes.aColor as THREE.BufferAttribute).needsUpdate = true;
    (this.footstepGeo.attributes.aSize as THREE.BufferAttribute).needsUpdate = true;
    (this.footstepGeo.attributes.aAlpha as THREE.BufferAttribute).needsUpdate = true;
  }

  private buildWorldBurstParticles(): void {
    for (let i = 0; i < WORLD_BURST_COUNT; i++) {
      this.wbPositions[i * 3 + 1] = -999;
      this.wbAlphas[i] = 0;
      this.wbAges[i] = 1;
      this.wbLifetimes[i] = 1;
    }
    const geo = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(this.wbPositions, 3);
    const colAttr = new THREE.BufferAttribute(this.wbColors, 3);
    const sizeAttr = new THREE.BufferAttribute(this.wbSizes, 1);
    const alphaAttr = new THREE.BufferAttribute(this.wbAlphas, 1);
    const kindAttr = new THREE.BufferAttribute(this.wbKinds, 1);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    colAttr.setUsage(THREE.DynamicDrawUsage);
    sizeAttr.setUsage(THREE.DynamicDrawUsage);
    alphaAttr.setUsage(THREE.DynamicDrawUsage);
    kindAttr.setUsage(THREE.DynamicDrawUsage);

    geo.setAttribute('position', posAttr);
    geo.setAttribute('aColor', colAttr);
    geo.setAttribute('aSize', sizeAttr);
    geo.setAttribute('aAlpha', alphaAttr);
    geo.setAttribute('aKind', kindAttr);
    this.worldBurstGeo = geo;

    const initialHeight = Math.max(1, this.container.clientHeight || window.innerHeight);
    const initialPixelScale =
      this.renderer.getPixelRatio() * Math.max(0.65, initialHeight / 900);

    this.worldBurstMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uPixelScale: { value: initialPixelScale },
      },
      vertexShader: `
        attribute vec3 aColor;
        attribute float aSize;
        attribute float aAlpha;
        attribute float aKind;
        uniform float uPixelScale;
        varying vec3 vColor;
        varying float vAlpha;
        varying float vKind;
        varying float vSpin;
        void main() {
          vColor = aColor;
          vAlpha = aAlpha;
          vKind = aKind;
          vSpin = position.x * 2.7 + position.y * 4.1 + position.z * 1.9;
          if (aAlpha <= 0.005) {
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
            gl_PointSize = 0.0;
            return;
          }
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float camDist = max(-mvPosition.z, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = clamp((aSize * uPixelScale) / camDist, 1.8, 36.0 * uPixelScale);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        varying float vKind;
        varying float vSpin;
        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          if (vKind > 1.5) {
            // Leaf silhouette
            float c = cos(vSpin);
            float s = sin(vSpin);
            vec2 p = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);
            float d = length(vec2(p.x * 1.35, p.y * 2.15)) * 2.0;
            float a = smoothstep(1.0, 0.35, d) * vAlpha;
            if (a < 0.01) discard;
            gl_FragColor = vec4(vColor, a);
          } else if (vKind > 0.5) {
            // Crisp water droplet
            float r = length(uv) * 2.0;
            float a = smoothstep(1.0, 0.25, r) * vAlpha;
            if (a < 0.01) discard;
            vec3 tint = mix(vColor, vec3(0.96, 0.99, 1.0), smoothstep(0.6, 0.0, r) * 0.55);
            gl_FragColor = vec4(tint, a);
          } else {
            // Soft impact dust puff
            float r = length(uv) * 2.0;
            float a = smoothstep(1.0, 0.12, r) * vAlpha;
            if (a < 0.01) discard;
            gl_FragColor = vec4(vColor, a);
          }
        }
      `,
    });

    this.worldBurstPoints = new THREE.Points(geo, this.worldBurstMat);
    this.worldBurstPoints.frustumCulled = false;
    this.worldBurstPoints.renderOrder = 3;
    this.scene.add(this.worldBurstPoints);
  }

  private pushBurstParticle(
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number,
    r: number,
    g: number,
    b: number,
    size: number,
    life: number,
    kind: number,
  ): void {
    const idx = this.wbCursor;
    this.wbCursor = (this.wbCursor + 1) % WORLD_BURST_COUNT;
    const i3 = idx * 3;
    this.wbPositions[i3] = x;
    this.wbPositions[i3 + 1] = y;
    this.wbPositions[i3 + 2] = z;
    this.wbVel[i3] = vx;
    this.wbVel[i3 + 1] = vy;
    this.wbVel[i3 + 2] = vz;
    this.wbColors[i3] = r;
    this.wbColors[i3 + 1] = g;
    this.wbColors[i3 + 2] = b;
    this.wbSizes[idx] = size;
    this.wbLifetimes[idx] = life;
    this.wbAges[idx] = 0;
    this.wbAlphas[idx] = 0.92;
    this.wbKinds[idx] = kind;
    this.wbActive = true;
  }

  private spawnWaterSplash(x: number, y: number, z: number, intensity = 1.0): void {
    const count = Math.round(10 + 10 * Math.min(1.5, intensity));
    for (let k = 0; k < count; k++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = (1.1 + Math.random() * 2.3) * Math.min(1.4, intensity);
      const up = (2.4 + Math.random() * 2.8) * Math.min(1.35, 0.7 + intensity * 0.45);
      this.pushBurstParticle(
        x + (Math.random() - 0.5) * 0.35,
        y + 0.04,
        z + (Math.random() - 0.5) * 0.35,
        Math.cos(ang) * spd,
        up,
        Math.sin(ang) * spd,
        0.78 + Math.random() * 0.16,
        0.92 + Math.random() * 0.06,
        0.98,
        24 + Math.random() * 14,
        0.48 + Math.random() * 0.24,
        1,
      );
    }
  }

  private spawnPrayerWheelParticles(x: number, y: number, z: number, intensity = 1.0): void {
    const count = Math.round(14 + 10 * Math.min(1.5, intensity));
    for (let k = 0; k < count; k++) {
      const ang = (k / count) * Math.PI * 2 + Math.random() * 0.4;
      const rad = 0.22 + Math.random() * 0.28;
      // Tangential swirl velocity + gentle upward lift mimicking sacred mantra ember spirals
      const tangentX = -Math.sin(ang);
      const tangentZ = Math.cos(ang);
      const radialOut = 0.32 + Math.random() * 0.55;
      const swirl = (0.75 + Math.random() * 0.65) * Math.min(1.4, intensity);
      const isLotusTint = k % 5 === 0;
      this.pushBurstParticle(
        x + Math.cos(ang) * rad,
        y + (Math.random() - 0.5) * 0.42,
        z + Math.sin(ang) * rad,
        Math.cos(ang) * radialOut + tangentX * swirl,
        0.65 + Math.random() * 0.95,
        Math.sin(ang) * radialOut + tangentZ * swirl,
        isLotusTint ? 0.98 : 0.98 + Math.random() * 0.02,
        isLotusTint ? 0.72 : 0.78 + Math.random() * 0.16,
        isLotusTint ? 0.86 : 0.28 + Math.random() * 0.18,
        24 + Math.random() * 16,
        0.78 + Math.random() * 0.46,
        1,
      );
    }
    this.prayerWheelParticleBursts += 1;
    if (this.renderer?.domElement) {
      this.renderer.domElement.dataset.prayerWheelParticles = String(this.prayerWheelParticleBursts);
    }
  }

  private spawnButterLampOfferingParticles(x: number, y: number, z: number): void {
    const count = 34;
    for (let k = 0; k < count; k++) {
      const ang = (k / count) * Math.PI * 2 + Math.random() * 0.35;
      const rad = 0.06 + Math.random() * 0.24;
      const swirl = 0.68 + Math.random() * 0.55;
      const radialOut = 0.22 + Math.random() * 0.42;
      const isWarmWhiteCore = k % 4 === 0;
      const isLotusPetalSpark = k % 7 === 0;
      this.pushBurstParticle(
        x + Math.cos(ang) * rad,
        y + Math.random() * 0.14,
        z + Math.sin(ang) * rad,
        Math.cos(ang) * radialOut - Math.sin(ang) * swirl,
        0.95 + Math.random() * 1.45,
        Math.sin(ang) * radialOut + Math.cos(ang) * swirl,
        isWarmWhiteCore ? 1.0 : isLotusPetalSpark ? 0.99 : 0.99,
        isWarmWhiteCore ? 0.95 : isLotusPetalSpark ? 0.62 : 0.76 + Math.random() * 0.14,
        isWarmWhiteCore ? 0.72 : isLotusPetalSpark ? 0.74 : 0.22 + Math.random() * 0.14,
        isWarmWhiteCore ? 26 + Math.random() * 14 : 20 + Math.random() * 14,
        1.05 + Math.random() * 0.65,
        1,
      );
    }
  }

  private spawnImpactDust(x: number, y: number, z: number, intensity = 1.0): void {
    const count = Math.round(6 + 5 * Math.min(1.3, intensity));
    for (let k = 0; k < count; k++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = (0.7 + Math.random() * 1.4) * Math.min(1.4, intensity);
      this.pushBurstParticle(
        x + (Math.random() - 0.5) * 0.28,
        y + 0.08,
        z + (Math.random() - 0.5) * 0.28,
        Math.cos(ang) * spd,
        0.45 + Math.random() * 0.8,
        Math.sin(ang) * spd,
        0.86 + Math.random() * 0.08,
        0.79 + Math.random() * 0.08,
        0.67 + Math.random() * 0.07,
        28 + Math.random() * 16,
        0.42 + Math.random() * 0.22,
        0,
      );
    }
  }

  private spawnLeafBurst(x: number, y: number, z: number, species: TreeSpecies): void {
    let r = 0.45;
    let g = 0.68;
    let b = 0.32;
    if (species === 'sakura') {
      r = 0.98;
      g = 0.72;
      b = 0.84;
    } else if (species === 'maple' || species === 'gulmohar') {
      r = 0.92;
      g = 0.38;
      b = 0.18;
    } else if (species === 'jacaranda') {
      r = 0.62;
      g = 0.48;
      b = 0.94;
    } else if (species === 'rhodo') {
      r = 0.82;
      g = 0.2;
      b = 0.34;
    } else if (species === 'birch') {
      r = 0.86;
      g = 0.82;
      b = 0.34;
    } else if (species === 'deodar' || species === 'cypress') {
      r = 0.28;
      g = 0.46;
      b = 0.3;
    }

    for (let k = 0; k < 14; k++) {
      const ang = Math.random() * Math.PI * 2;
      const rad = 0.4 + Math.random() * 1.45;
      const spd = 0.8 + Math.random() * 1.4;
      this.pushBurstParticle(
        x + Math.cos(ang) * rad,
        y + (Math.random() - 0.3) * 1.2,
        z + Math.sin(ang) * rad,
        Math.cos(ang) * spd,
        0.6 + Math.random() * 1.1,
        Math.sin(ang) * spd,
        Math.min(1, r + (Math.random() - 0.5) * 0.08),
        Math.min(1, g + (Math.random() - 0.5) * 0.08),
        Math.min(1, b + (Math.random() - 0.5) * 0.08),
        26 + Math.random() * 12,
        1.15 + Math.random() * 0.65,
        2,
      );
    }
  }

  private updateWorldBurstParticles(dt: number): void {
    if (!this.wbActive) return;
    let anyAlive = false;
    const airDamp = Math.exp(-2.8 * dt);

    for (let i = 0; i < WORLD_BURST_COUNT; i++) {
      const life = this.wbLifetimes[i];
      if (this.wbAges[i] >= life) {
        this.wbAlphas[i] = 0;
        continue;
      }
      this.wbAges[i] += dt;
      const t = this.wbAges[i] / life;
      if (t >= 1) {
        this.wbAlphas[i] = 0;
        this.wbPositions[i * 3 + 1] = -999;
        continue;
      }
      anyAlive = true;
      const i3 = i * 3;
      const kind = this.wbKinds[i];
      if (kind > 1.5) {
        // Fluttering leaves
        this.wbVel[i3] = this.wbVel[i3] * Math.exp(-1.5 * dt) + Math.sin(this.wbAges[i] * 7 + i) * 0.9 * dt;
        this.wbVel[i3 + 2] = this.wbVel[i3 + 2] * Math.exp(-1.5 * dt) + Math.cos(this.wbAges[i] * 6.2 + i) * 0.9 * dt;
        this.wbVel[i3 + 1] = Math.max(-1.45, this.wbVel[i3 + 1] - 2.6 * dt);
        this.wbAlphas[i] = (1 - t * t) * 0.95;
      } else if (kind > 0.5) {
        // Water droplets with gravity
        this.wbVel[i3] *= Math.exp(-1.2 * dt);
        this.wbVel[i3 + 2] *= Math.exp(-1.2 * dt);
        this.wbVel[i3 + 1] -= 11.5 * dt;
        this.wbAlphas[i] = (1 - t) * 0.88;
      } else {
        // Expanding soft dust
        this.wbVel[i3] *= airDamp;
        this.wbVel[i3 + 2] *= airDamp;
        this.wbVel[i3 + 1] *= airDamp;
        this.wbSizes[i] += 22 * dt;
        this.wbAlphas[i] = (1 - t) * (1 - t) * 0.65;
      }
      this.wbPositions[i3] += this.wbVel[i3] * dt;
      this.wbPositions[i3 + 1] += this.wbVel[i3 + 1] * dt;
      this.wbPositions[i3 + 2] += this.wbVel[i3 + 2] * dt;
    }

    this.wbActive = anyAlive;
    (this.worldBurstGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.worldBurstGeo.attributes.aColor as THREE.BufferAttribute).needsUpdate = true;
    (this.worldBurstGeo.attributes.aSize as THREE.BufferAttribute).needsUpdate = true;
    (this.worldBurstGeo.attributes.aAlpha as THREE.BufferAttribute).needsUpdate = true;
  }

  private getWaterSurfaceAt(
    x: number,
    z: number,
  ): { inWater: boolean; surfaceY: number; bedY: number; flowX: number; flowZ: number } {
    if (isOnBridgeDeck(x, z)) {
      return { inWater: false, surfaceY: -999, bedY: 0, flowX: 0, flowZ: 0 };
    }
    const rx = getRiverCenterX(z);
    if (Math.abs(x - rx) < 6.4) {
      return {
        inWater: true,
        surfaceY: -0.34,
        bedY: groundHeightAt(x, z),
        flowX: Math.cos(z * 0.028) * 6.5 * 0.028 * 1.45,
        flowZ: 1.45,
      };
    }
    if (Math.hypot(x - GLACIAL_LAKE.x, z - GLACIAL_LAKE.z) < GLACIAL_LAKE.waterRadius - 0.3) {
      return {
        inWater: true,
        surfaceY: GLACIAL_LAKE.waterLevel,
        bedY: groundHeightAt(x, z),
        flowX: 0,
        flowZ: 0,
      };
    }
    const jdx = x + 92;
    const jdz = z - 118;
    if (jdx >= -50.8 && jdx <= -38.2 && jdz >= 8.0 && jdz <= 24.0) {
      return {
        inWater: true,
        surfaceY: 0.02,
        bedY: groundHeightAt(x, z),
        flowX: 0,
        flowZ: 0,
      };
    }
    const ldx = x - LUMBINI_SACRED_POND.centerX;
    const ldz = z - LUMBINI_SACRED_POND.centerZ;
    if (ldx >= -1.0 && ldx <= 21.0 && ldz >= 9.8 && ldz <= 23.2) {
      return {
        inWater: true,
        surfaceY: 0.21,
        bedY: groundHeightAt(x, z),
        flowX: 0,
        flowZ: 0,
      };
    }
    if (isOnLumbiniSacredBridge(x, z)) {
      return { inWater: false, surfaceY: -999, bedY: 0, flowX: 0, flowZ: 0 };
    }
    if (isInLumbiniSurroundingPond(x, z)) {
      return {
        inWater: true,
        surfaceY: LUMBINI_SACRED_POND.waterLevel,
        bedY: groundHeightAt(x, z),
        flowX: 0,
        flowZ: 0,
      };
    }
    if (isOnLumbiniCanalBridge(x, z)) {
      return { inWater: false, surfaceY: -999, bedY: 0, flowX: 0, flowZ: 0 };
    }
    if (
      x >= LUMBINI_PEACE_CANAL.minX &&
      x <= LUMBINI_PEACE_CANAL.maxX &&
      z >= LUMBINI_PEACE_CANAL.minZ &&
      z <= LUMBINI_PEACE_CANAL.maxZ
    ) {
      return {
        inWater: true,
        surfaceY: LUMBINI_PEACE_CANAL.waterLevel,
        bedY: groundHeightAt(x, z),
        flowX: 0,
        flowZ: 0.35,
      };
    }
    const pashupatiWater = getPashupatinathWaterAt(x, z);
    if (pashupatiWater) {
      return {
        inWater: true,
        surfaceY: pashupatiWater.surfaceY,
        bedY: groundHeightAt(x, z),
        flowX: pashupatiWater.flowX,
        flowZ: pashupatiWater.flowZ,
      };
    }
    return { inWater: false, surfaceY: -999, bedY: 0, flowX: 0, flowZ: 0 };
  }

  private shakeTreeAt(
    tx: number,
    ty: number,
    tz: number,
    species: TreeSpecies,
    elapsed: number,
  ): void {
    this.treeBumpPos.set(tx, ty, tz);
    this.treeBumpStrength = 1.0;
    this.lastTreeShakeAt = elapsed;
    this.spawnLeafBurst(tx, ty + 3.1, tz, species);
    soundEngine.playFoliageRustle();
  }

  private kickProp(propIdx: number, dirX: number, dirZ: number, strength = 1.0): void {
    const prop = this.interactiveProps[propIdx];
    if (!prop) return;
    const len = Math.hypot(dirX, dirZ) || 1;
    const nx = dirX / len;
    const nz = dirZ / len;
    const impulse = (8.8 * strength) / Math.sqrt(prop.mass);
    prop.vx += nx * impulse;
    prop.vz += nz * impulse;
    prop.vy = Math.max(prop.vy, (prop.kind === 'ball' ? 6.4 : 3.6) * strength / Math.sqrt(prop.mass));
    prop.angVel.x += nz * impulse * 3.0;
    prop.angVel.z -= nx * impulse * 3.0;
    prop.angVel.y += (Math.random() - 0.5) * 4.5;
    this.spawnImpactDust(prop.x, prop.y, prop.z, 0.9 * strength);
    const sKind =
      prop.kind === 'barrel' ? 'crate' : prop.kind;
    soundEngine.playPropImpact(sKind, Math.min(1, 0.72 * strength));
  }

  private triggerTempleBell(entry: TempleBellEntry, elapsed: number, intensity = 1, dist = 1): void {
    entry.ringStart = elapsed;
    entry.ringDuration = 4.2;
    entry.amplitude = Math.min(0.46, 0.24 + 0.18 * intensity);
    entry.cooldownUntil = elapsed + 2.4;
    const atten = Math.max(0.28, 1 - dist / 14);
    soundEngine.playTempleBell(atten * intensity, entry.pitchScale);
    this.bellRingsCount += 1;
    this.writeDataset('bellRings', String(this.bellRingsCount));
    this.callbacks.onBellRing?.();
  }

  private buildCharacter(): void {
    this.character = createExplorerCharacter(this.textures);
    const spawnY = getSurfaceHeightAt(this.playerPos.x, this.playerPos.z);
    this.playerPos.y = spawnY;
    this.character.root.position.copy(this.playerPos);
    this.character.root.rotation.y = this.playerYaw;
    this.scene.add(this.character.root);
  }

  private collectPhysicsExcludeRoots(): Set<THREE.Object3D> {
    const exclude = new Set<THREE.Object3D>();
    if (this.character?.root) exclude.add(this.character.root);
    if (this.walkMarkerMesh) exclude.add(this.walkMarkerMesh);
    if (this.atmospherePoints) exclude.add(this.atmospherePoints);
    if (this.weatherParticles?.points) exclude.add(this.weatherParticles.points);
    if (this.lumbiniFireflies?.points) exclude.add(this.lumbiniFireflies.points);
    if (this.lumbiniIncenseSmoke?.points) exclude.add(this.lumbiniIncenseSmoke.points);
    if (this.sakuraPetalsPoints) exclude.add(this.sakuraPetalsPoints);
    if (this.footstepPoints) exclude.add(this.footstepPoints);
    if (this.worldBurstPoints) exclude.add(this.worldBurstPoints);
    if (this.starsPoints) exclude.add(this.starsPoints);
    if (this.milkyWayPoints) exclude.add(this.milkyWayPoints);
    if (this.customWaypointGroup) exclude.add(this.customWaypointGroup);
    for (const hit of this.landmarkHitTargets) exclude.add(hit);
    for (const hit of this.bellHitTargets) exclude.add(hit);
    for (const hit of this.prayerWheelHitTargets) exclude.add(hit);
    for (const hit of this.butterLampHitTargets) exclude.add(hit);
    for (const hit of this.mayaDeviPlaqueHitTargets) exclude.add(hit);
    if (this.pashupatiLingamHitTarget) exclude.add(this.pashupatiLingamHitTarget);
    if (this.pashupatiNandiHitTarget) exclude.add(this.pashupatiNandiHitTarget);
    if (this.pashupatiAaratiHitTarget) exclude.add(this.pashupatiAaratiHitTarget);
    for (const hit of this.pashupatiGheeLampHitTargets) exclude.add(hit);
    for (const prop of this.interactiveProps) exclude.add(prop.mesh);
    return exclude;
  }

  /**
   * World Geometry Sanitizer:
   * Scans static scene geometry (and any reported clipping/pass-through targets),
   * repairs degenerate/NaN geometry, computes missing normals, populates `uv1` for AO maps,
   * and rebuilds solid watertight collision barriers inside the static BVH.
   */
  public sanitizeWorldGeometry(
    reportedTargets?: Array<string | THREE.Object3D>,
    rebuildPhysics = true,
    excludeSnapCategories = false,
  ): GeometrySanitizeReport {
    const exclude = this.collectPhysicsExcludeRoots();
    const report = sanitizeSceneGeometry(this.scene, {
      excludeRoots: exclude,
      excludeSnapCategories,
      reportedTargets,
    });
    this.lastSanitizeReport = report;
    this.physicsWorld.setSanitizedBarriers(report.sanitizedBarrierBoxes);

    if (rebuildPhysics) {
      this.physicsWorld.buildFromScene(this.scene, exclude, {
        excludeSnapCategories: true,
      });
      const staticSnappedRoots: THREE.Object3D[] = [];
      this.scene.traverse((obj) => {
        if (obj.userData?.snapCategory && !obj.userData?.isInteractiveProp) {
          let ancestorHasSnap = false;
          let p = obj.parent;
          while (p) {
            if (p.userData?.snapCategory) {
              ancestorHasSnap = true;
              break;
            }
            p = p.parent;
          }
          if (!ancestorHasSnap) {
            staticSnappedRoots.push(obj);
          }
        }
      });
      if (staticSnappedRoots.length > 0) {
        this.physicsWorld.appendStaticObjects(staticSnappedRoots, exclude);
      }
      const stats = this.physicsWorld.getStats();
      this.writeDataset('physicsWallTris', String(stats.wallTriangles));
      this.writeDataset('physicsFloorTris', String(stats.floorTriangles));
      this.writeDataset('physicsNavVerts', String(stats.navVertices));
      this.writeDataset('sanitizedBarriers', String(report.sanitizedBarriers));
      this.writeDataset('repairedGeometries', String(report.repairedGeometries));
      this.writeDataset('addedUv1', String(report.addedUv1Count));
    }

    return report;
  }

  public getLastSanitizeReport(): GeometrySanitizeReport | null {
    return this.lastSanitizeReport;
  }

  private refreshOccluderSpheres(): void {
    this.occluderSpheres.length = 0;
    this.scene.updateMatrixWorld(true);
    for (let i = 0; i < this.cameraOccluders.length; i++) {
      const obj = this.cameraOccluders[i];
      this.occluderTmpBox.setFromObject(obj);
      if (this.occluderTmpBox.isEmpty()) continue;
      this.occluderTmpBox.getBoundingSphere(this.occluderTmpSphere);
      this.occluderSpheres.push({
        objIndex: i,
        cx: this.occluderTmpSphere.center.x,
        cy: this.occluderTmpSphere.center.y,
        cz: this.occluderTmpSphere.center.z,
        radius: this.occluderTmpSphere.radius,
      });
    }
  }

  private buildPhysicsBvhAndSnapAssets(): void {
    const exclude = this.collectPhysicsExcludeRoots();
    const report = this.sanitizeWorldGeometry(undefined, false, true);
    this.physicsWorld.buildFromScene(this.scene, exclude, {
      excludeSnapCategories: true,
    });
    this.snappedAssetsCount = this.snapInteractiveAssetsToFloor();

    if (!this.staticGroundsMerged) {
      if (this.outerGroundsGroup) {
        mergeStaticMeshesByMaterial(this.outerGroundsGroup, {
          preserveCustomShaderMaterials: true,
        });
        // Static footings/bowls inside outerGroundsGroup are now merged; clear snap metadata so
        // subsequent deferred buildPhysicsBvhAndSnapAssets() calls never re-snap remaining noMerge
        // children (Urli water/flames, prayer flag cloths) using a missing footing bounding box.
        this.outerGroundsGroup.traverse((obj) => {
          if (obj.userData) {
            delete obj.userData.snapCategory;
            delete obj.userData.groundEmbed;
            delete obj.userData.prayerFlagSpot;
          }
        });
      }
      if (this.curbedRoadsLanternGroup) {
        mergeStaticMeshesByMaterial(this.curbedRoadsLanternGroup, {
          preserveCustomShaderMaterials: true,
        });
      }
      this.staticGroundsMerged = true;
    }
    this.refreshOccluderSpheres();

    const staticSnappedRoots: THREE.Object3D[] = [];
    this.scene.traverse((obj) => {
      if (obj.userData?.snapCategory && !obj.userData?.isInteractiveProp) {
        let ancestorHasSnap = false;
        let p = obj.parent;
        while (p) {
          if (p.userData?.snapCategory) {
            ancestorHasSnap = true;
            break;
          }
          p = p.parent;
        }
        if (!ancestorHasSnap) {
          staticSnappedRoots.push(obj);
        }
      }
    });
    if (staticSnappedRoots.length > 0) {
      this.physicsWorld.appendStaticObjects(staticSnappedRoots, exclude);
    }

    const stats = this.physicsWorld.getStats();
    this.writeDataset('physicsWallTris', String(stats.wallTriangles));
    this.writeDataset('physicsFloorTris', String(stats.floorTriangles));
    this.writeDataset('physicsNavVerts', String(stats.navVertices));
    this.writeDataset('snappedAssets', String(this.snappedAssetsCount));
    this.writeDataset('sanitizedBarriers', String(report.sanitizedBarriers));
    this.writeDataset('repairedGeometries', String(report.repairedGeometries));
    this.writeDataset('addedUv1', String(report.addedUv1Count));
  }

  /**
   * Snaps an interactive or architectural asset (lantern, pot, or sitting area) to the
   * nearest floor navigation mesh vertex and resolves horizontal wall clearance so it sits
   * flush with ground and wall surfaces without floating, tilting, or clipping.
   */
  public snapObjectToFloorAndWalls(
    obj: THREE.Object3D,
    category: 'lantern' | 'pot' | 'sitting',
  ): boolean {
    if (category === 'sitting') {
      obj.rotation.x = 0;
      obj.rotation.z = 0;
    }

    obj.updateMatrixWorld(true);
    _snapBox.setFromObject(obj);
    if (_snapBox.isEmpty()) return false;

    const isInteractive = Boolean(obj.userData?.isInteractiveProp);
    const groundEmbed = typeof obj.userData?.groundEmbed === 'number' ? obj.userData.groundEmbed : 0;
    const visualMinY = _snapBox.min.y + groundEmbed;

    _snapBox.getSize(_snapSize);
    const cx = (_snapBox.min.x + _snapBox.max.x) * 0.5;
    const cz = (_snapBox.min.z + _snapBox.max.z) * 0.5;
    const height = Math.max(0.25, _snapSize.y);
    const maxSpanXZ = Math.max(_snapSize.x, _snapSize.z);
    const radius = Math.max(0.18, Math.min(1.4, Math.hypot(_snapSize.x, _snapSize.z) * 0.34));

    const lockXZ = Boolean(obj.userData?.lockXZ);
    const navRadius = lockXZ && !isInteractive ? 0.9 : 2.4;
    const maxUpJump = lockXZ && !isInteractive ? 0.18 : 0.75;
    const initialNav = this.physicsWorld.findNearestNavVertex(cx, visualMinY, cz, navRadius);
    const refFloorY =
      initialNav && initialNav.y - visualMinY <= maxUpJump && visualMinY - initialNav.y <= 0.75
        ? initialNav.y
        : visualMinY;

    let targetX = cx;
    let targetZ = cz;
    if (!lockXZ && maxSpanXZ < 3.0) {
      const clearance = this.physicsWorld.findNearestWallClearance(
        cx,
        cz,
        refFloorY,
        height,
        radius,
      );
      if (clearance.pushed) {
        targetX = clearance.x;
        targetZ = clearance.z;
      }
    }

    const navV = this.physicsWorld.findNearestNavVertex(targetX, refFloorY, targetZ, navRadius);
    const baseRefY =
      navV && navV.y - refFloorY <= maxUpJump && refFloorY - navV.y <= 0.75 ? navV.y : refFloorY;
    const ceilingY = lockXZ && !isInteractive ? Math.min(baseRefY, visualMinY + 0.22) + 0.28 : baseRefY + 0.55;
    const sampledFloor = this.physicsWorld.sampleFloorHeight(targetX, targetZ, ceilingY);

    let targetFloorY = sampledFloor !== null ? sampledFloor : getSurfaceHeightAt(targetX, targetZ);

    // For static sloped-ground pedestals with buried stone footings, lower to cover downhill slope drop
    if (!isInteractive && groundEmbed > 0.02) {
      const hx = Math.min(0.75, Math.max(0.32, _snapSize.x * 0.45));
      const hz = Math.min(0.75, Math.max(0.32, _snapSize.z * 0.45));
      let minRimFloor = targetFloorY;
      const rimOffsets: Array<[number, number]> = [
        [hx, 0],
        [-hx, 0],
        [0, hz],
        [0, -hz],
      ];
      for (const [ox, oz] of rimOffsets) {
        const rimPhysics = this.physicsWorld.sampleFloorHeight(targetX + ox, targetZ + oz, ceilingY);
        const rimTerrain = sampleTerrainMeshHeight(this.terrainMesh, targetX + ox, targetZ + oz);
        const rimY = rimPhysics !== null ? Math.min(rimPhysics, rimTerrain + 0.25) : rimTerrain;
        if (rimY < minRimFloor && targetFloorY - rimY <= groundEmbed * 1.1) {
          minRimFloor = rimY;
        }
      }
      if (minRimFloor < targetFloorY) {
        targetFloorY = Math.max(
          minRimFloor,
          targetFloorY - Math.min(groundEmbed * 0.94, targetFloorY - minRimFloor),
        );
      }
    }

    const dx = targetX - cx;
    const dy = (targetFloorY - groundEmbed) - _snapBox.min.y;
    const dz = targetZ - cz;

    if (Math.abs(dx) > 1e-4 || Math.abs(dy) > 1e-4 || Math.abs(dz) > 1e-4) {
      obj.getWorldPosition(_snapWorldPos);
      _snapWorldPos.x += dx;
      _snapWorldPos.y += dy;
      _snapWorldPos.z += dz;
      if (obj.parent) {
        obj.parent.worldToLocal(_snapWorldPos);
      }
      obj.position.copy(_snapWorldPos);
      obj.updateMatrixWorld(true);
    }

    obj.userData.snappedNavVertex = navV
      ? { x: navV.x, y: navV.y, z: navV.z, distance: navV.distance }
      : null;
    obj.userData.snappedFloorY = targetFloorY;
    return true;
  }

  /**
   * Snaps all tagged lanterns, pots, and sitting areas across the scene to the nearest
   * floor navigation mesh vertex and wall clearance surface.
   */
  public snapInteractiveAssetsToFloor(): number {
    this.scene.updateMatrixWorld(true);
    const targets: Array<{ obj: THREE.Object3D; category: 'lantern' | 'pot' | 'sitting' }> = [];
    this.scene.traverse((obj) => {
      const spot = obj.userData?.prayerFlagSpot as OuterTempleArtifactSpot | undefined;
      if (spot) {
        const a1TerrY = sampleTerrainMeshHeight(this.terrainMesh, spot.x, spot.z);
        const a1Bvh = this.physicsWorld.sampleFloorHeight(spot.x, spot.z, a1TerrY + 0.65);
        const a1Y = a1Bvh !== null ? a1Bvh : a1TerrY;
        const a2WorldX = spot.x + Math.cos(spot.rotY) * 1.4 * spot.scale;
        const a2WorldZ = spot.z - Math.sin(spot.rotY) * 1.4 * spot.scale;
        const a2TerrY = sampleTerrainMeshHeight(this.terrainMesh, a2WorldX, a2WorldZ);
        const a2Bvh = this.physicsWorld.sampleFloorHeight(a2WorldX, a2WorldZ, a2TerrY + 0.65);
        const a2Y = a2Bvh !== null ? a2Bvh : a2TerrY;
        obj.position.y = a1Y;
        const a2LocalOffset = (a2Y - a1Y) / Math.max(spot.scale, 0.5);
        const anchor2 = obj.children[1] as THREE.Mesh | undefined;
        const pole2 = obj.children[3] as THREE.Mesh | undefined;
        if (anchor2) {
          anchor2.position.y = -0.34 + a2LocalOffset;
          anchor2.scale.set(0.88, 1 + Math.max(0, -a2LocalOffset) * 1.4, 0.88);
        }
        if (pole2) {
          pole2.position.y = 1.195 + a2LocalOffset * 0.5;
          pole2.scale.set(0.85, 0.9 + Math.abs(a2LocalOffset) * 0.45, 0.85);
        }
        obj.updateMatrixWorld(true);
      }
      const cat = obj.userData?.snapCategory as 'lantern' | 'pot' | 'sitting' | undefined;
      if (cat === 'lantern' || cat === 'pot' || cat === 'sitting') {
        targets.push({ obj, category: cat });
      }
    });

    let count = 0;
    for (const item of targets) {
      if (this.snapObjectToFloorAndWalls(item.obj, item.category)) {
        count++;
      }
    }

    for (const prop of this.interactiveProps) {
      if (prop.stackLayer === 0) {
        prop.x = prop.mesh.position.x;
        prop.y = prop.mesh.position.y;
        prop.z = prop.mesh.position.z;
      } else {
        const baseFloor =
          this.physicsWorld.sampleFloorHeight(prop.x, prop.z, prop.y + 0.55) ??
          getSurfaceHeightAt(prop.x, prop.z);
        let supportY = baseFloor;
        for (const base of this.interactiveProps) {
          if (base.stackLayer < prop.stackLayer) {
            const d = Math.hypot(prop.x - base.x, prop.z - base.z);
            if (d < prop.radius + base.radius) {
              supportY = Math.max(supportY, base.y + base.halfHeight * 2);
            }
          }
        }
        prop.y = Math.max(supportY, baseFloor + prop.baseOffsetY);
        prop.mesh.position.set(prop.x, prop.y, prop.z);
      }
      prop.rotX = 0;
      prop.rotZ = 0;
      prop.angVel.set(0, 0, 0);
      prop.visualGroup.quaternion.copy(prop.quat);
      prop.visualGroup.position.y = prop.halfHeight;
    }

    return count;
  }

  public getPhysicsStats(): PhysicsWorldStats {
    return this.physicsWorld.getStats();
  }

  private bindEvents(): void {
    const canvas = this.renderer.domElement;

    const onKeyDown = (e: KeyboardEvent) => {
      if (this.isTypingInInput(e)) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      this.keysPressed.add(e.code);

      if (e.code === 'Space' && this.gameState === 'playing' && this.isGrounded) {
        this.playerVelY = 7.4;
        this.isGrounded = false;
        this.squashScaleY = 1.2;
        soundEngine.playJump();
      }
      if (e.code === 'KeyB' && this.gameState === 'playing') {
        const elapsed = (performance.now() - this.startTimeMs) / 1000;
        let closestBell: TempleBellEntry | null = null;
        let closestDist = 9.0;
        for (const entry of this.templeBellEntries) {
          const d = Math.hypot(entry.worldPos.x - this.playerPos.x, entry.worldPos.z - this.playerPos.z);
          if (d < closestDist) {
            closestDist = d;
            closestBell = entry;
          }
        }
        if (closestBell) {
          this.triggerTempleBell(closestBell, elapsed, 1.0, closestDist);
        }
      }
      if (e.code === 'KeyF' && this.gameState === 'playing') {
        const elapsed = (performance.now() - this.startTimeMs) / 1000;
        let bestPropIdx = -1;
        let bestPropDist = 3.2;
        for (let i = 0; i < this.interactiveProps.length; i++) {
          const p = this.interactiveProps[i];
          const d = Math.hypot(p.x - this.playerPos.x, p.z - this.playerPos.z);
          if (d < bestPropDist) {
            bestPropDist = d;
            bestPropIdx = i;
          }
        }
        if (bestPropIdx >= 0) {
          const p = this.interactiveProps[bestPropIdx];
          let dx = p.x - this.playerPos.x;
          let dz = p.z - this.playerPos.z;
          if (Math.hypot(dx, dz) < 0.05) {
            dx = Math.sin(this.playerYaw);
            dz = Math.cos(this.playerYaw);
          }
          this.kickProp(bestPropIdx, dx, dz, 1.15);
        } else {
          let bestTree: (typeof this.treeSpots)[number] | null = null;
          let bestTreeDist = 4.2;
          for (let i = 0; i < this.treeSpots.length; i++) {
            const tr = this.treeSpots[i];
            const d = Math.hypot(tr.x - this.playerPos.x, tr.z - this.playerPos.z);
            if (d < bestTreeDist) {
              bestTreeDist = d;
              bestTree = tr;
            }
          }
          if (bestTree) {
            this.shakeTreeAt(bestTree.x, groundHeightAt(bestTree.x, bestTree.z), bestTree.z, bestTree.type, elapsed);
          }
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      this.keysPressed.delete(e.code);
    };

    const onBlur = () => {
      this.keysPressed.clear();
      this.joystickVec.x = 0;
      this.joystickVec.y = 0;
      this.isDraggingCamera = false;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (this.gameState !== 'playing') return;
      if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 2) return;
      this.isDraggingCamera = true;
      this.activePointerButton = e.button;
      this.hasPointerMoved = false;
      this.pointerDownPos = { x: e.clientX, y: e.clientY };
      this.lastPointerPos = { x: e.clientX, y: e.clientY };
      try {
        canvas.setPointerCapture?.(e.pointerId);
      } catch {
        // Ignore synthetic pointer events without active pointer IDs
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!this.isDraggingCamera || this.gameState !== 'playing') return;
      const dx = e.clientX - this.lastPointerPos.x;
      const dy = e.clientY - this.lastPointerPos.y;
      if (Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y) > 5) {
        this.hasPointerMoved = true;
      }
      const yawSpeed = this.cameraMode === 'first-person' ? 0.0046 : 0.0055;
      const pitchSpeed = this.cameraMode === 'first-person' ? 0.0042 : 0.0048;
      this.targetCameraYaw -= dx * yawSpeed;
      this.targetCameraPitch = clampCameraPitch(this.targetCameraPitch + dy * pitchSpeed);
      this.lastPointerPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!this.isDraggingCamera) return;
      const wasRightClick = this.activePointerButton === 2;
      this.isDraggingCamera = false;
      try {
        if (canvas.hasPointerCapture?.(e.pointerId)) {
          canvas.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignore capture release errors
      }
      if (!this.hasPointerMoved && !wasRightClick && e.type !== 'pointercancel' && this.gameState === 'playing') {
        this.handleCanvasTap(e.clientX, e.clientY);
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const onWheel = (e: WheelEvent) => {
      if (this.gameState !== 'playing') return;
      e.preventDefault();
      // Pinch zoom (ctrlKey) or coarse vertical scroll-wheel adjusts zoom; two-finger trackpad pan rotates free-look
      const isPinchZoom = e.ctrlKey;
      const isMouseWheelZoom =
        !isPinchZoom && Math.abs(e.deltaX) < 1.2 && (e.deltaMode !== 0 || Math.abs(e.deltaY) >= 60);
      if (isPinchZoom || isMouseWheelZoom) {
        const zoomStep = isPinchZoom ? e.deltaY * 0.045 : e.deltaY * 0.015;
        this.targetCameraDistance = Math.max(4.6, Math.min(68, this.targetCameraDistance + zoomStep));
      } else {
        this.targetCameraYaw -= e.deltaX * 0.0042;
        this.targetCameraPitch = clampCameraPitch(this.targetCameraPitch - e.deltaY * 0.0038);
      }
    };

    const onResize = () => {
      if (this.disposed) return;
      const w = Math.max(1, this.container.clientWidth || window.innerWidth);
      const h = Math.max(1, this.container.clientHeight || window.innerHeight);
      const aspect = w / h;
      this.camera.aspect = aspect;
      this.camera.fov = aspect < 1 ? Math.min(62, 42 / Math.pow(aspect, 0.42)) : 42;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      if (this.composer) {
        this.composer.setPixelRatio(this.renderer.getPixelRatio());
        this.composer.setSize(w, h);
      }
      if (this.bloomPass) {
        this.bloomPass.resolution.set(w, h);
      }
      if (this.atmosphereMat) {
        this.atmosphereMat.uniforms.uPixelScale.value =
          this.renderer.getPixelRatio() * Math.max(0.65, h / 900);
      }
      if (this.footstepMat) {
        this.footstepMat.uniforms.uPixelScale.value =
          this.renderer.getPixelRatio() * Math.max(0.65, h / 900);
      }
      if (this.worldBurstMat) {
        this.worldBurstMat.uniforms.uPixelScale.value =
          this.renderer.getPixelRatio() * Math.max(0.65, h / 900);
      }
      if (this.sakuraPetalsMat) {
        this.sakuraPetalsMat.uniforms.uPixelScale.value = this.getPixelScale();
      }
      if (this.weatherParticles) {
        this.weatherParticles.material.uniforms.uPixelScale.value = this.getPixelScale();
      }
      if (this.lumbiniFireflies) {
        this.lumbiniFireflies.material.uniforms.uPixelScale.value = this.getPixelScale();
      }
      if (this.lumbiniIncenseSmoke) {
        this.lumbiniIncenseSmoke.material.uniforms.uPixelScale.value = this.getPixelScale();
      }
      this.renderScene();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('resize', onResize);

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(onResize);
      this.resizeObserver.observe(this.container);
    }

    this.cleanupListeners = () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      this.resizeObserver?.disconnect();
    };
  }

  private cleanupListeners: () => void = () => undefined;

  private isTypingInInput(e: KeyboardEvent): boolean {
    const tag = (e.target as HTMLElement | null)?.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  }

  private handleCanvasTap(clientX: number, clientY: number): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    _pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    _pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    if (
      this.bellHitTargets.length > 0 ||
      this.prayerWheelHitTargets.length > 0 ||
      this.butterLampHitTargets.length > 0 ||
      this.mayaDeviPlaqueHitTargets.length > 0 ||
      this.pashupatiLingamHitTarget !== null ||
      this.pashupatiNandiHitTarget !== null ||
      this.pashupatiGheeLampHitTargets.length > 0 ||
      this.pashupatiAaratiHitTarget !== null
    ) {
      this.raycaster.layers.set(2);
      this.raycaster.setFromCamera(_pointer, this.camera);
      if (this.pashupatiLingamHitTarget) {
        if (this.raycaster.intersectObject(this.pashupatiLingamHitTarget, false).length > 0) {
          this.triggerPashupatiLingamOffering();
          return;
        }
      }
      if (this.pashupatiNandiHitTarget) {
        if (this.raycaster.intersectObject(this.pashupatiNandiHitTarget, false).length > 0) {
          this.inspectPashupatiNandi();
          return;
        }
      }
      if (this.pashupatiGheeLampHitTargets.length > 0) {
        const rackHits = this.raycaster.intersectObjects(this.pashupatiGheeLampHitTargets, false);
        if (rackHits.length > 0) {
          const rIdx = rackHits[0].object.userData.pashupatiRackIndex as number | undefined;
          if (typeof rIdx === 'number') {
            this.togglePashupatiGheeRack(rIdx);
            return;
          }
        }
      }
      if (this.pashupatiAaratiHitTarget) {
        if (this.raycaster.intersectObject(this.pashupatiAaratiHitTarget, false).length > 0) {
          this.performPashupatiBagmatiAarati();
          return;
        }
      }
      if (this.butterLampHitTargets.length > 0) {
        const lampHits = this.raycaster.intersectObjects(this.butterLampHitTargets, false);
        if (lampHits.length > 0) {
          const lampIndex = lampHits[0].object.userData.butterLampIndex as number | undefined;
          if (typeof lampIndex === 'number') {
            this.lightButterLamp(lampIndex);
            return;
          }
        }
      }
      if (this.mayaDeviPlaqueHitTargets.length > 0) {
        const plaqueHits = this.raycaster.intersectObjects(this.mayaDeviPlaqueHitTargets, false);
        if (plaqueHits.length > 0) {
          const key = plaqueHits[0].object.userData.mayaDeviPlaqueKey as
            | 'markerStone'
            | 'mauryanChambers'
            | 'nativityRelief'
            | undefined;
          const info = key ? this.mayaDeviHighlights?.[key] : undefined;
          if (info) {
            soundEngine.playBellChime();
            this.callbacks.onInspectHighlight?.(info);
            return;
          }
        }
      }
      if (this.bellHitTargets.length > 0) {
        const bellHits = this.raycaster.intersectObjects(this.bellHitTargets, false);
        if (bellHits.length > 0) {
          const bellIndex = bellHits[0].object.userData.bellIndex as number | undefined;
          const entry = typeof bellIndex === 'number' ? this.templeBellEntries[bellIndex] : undefined;
          if (entry) {
            const elapsed = (performance.now() - this.startTimeMs) / 1000;
            const dist = Math.hypot(
              entry.worldPos.x - this.playerPos.x,
              entry.worldPos.z - this.playerPos.z,
            );
            this.triggerTempleBell(entry, elapsed, 1.0, Math.min(dist, 4.0));
            return;
          }
        }
      }
      if (this.prayerWheelHitTargets.length > 0) {
        const wheelHits = this.raycaster.intersectObjects(this.prayerWheelHitTargets, false);
        if (wheelHits.length > 0) {
          const wheelIndex = wheelHits[0].object.userData.prayerWheelIndex as number | undefined;
          if (typeof wheelIndex === 'number') {
            this.spinPrayerWheel(wheelIndex, 16.5);
            return;
          }
        }
      }
    }

    if (this.propHitTargets.length > 0) {
      this.raycaster.layers.set(3);
      this.raycaster.setFromCamera(_pointer, this.camera);
      const propHits = this.raycaster.intersectObjects(this.propHitTargets, false);
      if (propHits.length > 0) {
        const propIdx = propHits[0].object.userData.propIndex as number | undefined;
        if (typeof propIdx === 'number' && this.interactiveProps[propIdx]) {
          const p = this.interactiveProps[propIdx];
          let dx = p.x - this.playerPos.x;
          let dz = p.z - this.playerPos.z;
          const playerDist = Math.hypot(dx, dz);
          if (playerDist > 16 || playerDist < 0.05) {
            dx = p.x - this.camera.position.x;
            dz = p.z - this.camera.position.z;
          }
          this.kickProp(propIdx, dx, dz, 1.15);
          return;
        }
      }
    }

    this.raycaster.layers.set(1);
    this.raycaster.setFromCamera(_pointer, this.camera);
    const landmarkHits = this.raycaster.intersectObjects(this.landmarkHitTargets, false);
    if (landmarkHits.length > 0) {
      const id = landmarkHits[0].object.userData.landmarkId as string | undefined;
      const lm = LANDMARKS.find((item) => item.id === id);
      if (lm) {
        soundEngine.playClick();
        this.callbacks.onSelectLandmark(lm);
        return;
      }
    }

    this.raycaster.layers.set(0);
    this.raycaster.setFromCamera(_pointer, this.camera);
    const groundHits = this.raycaster.intersectObject(this.terrainMesh, false);
    if (groundHits.length > 0) {
      const pt = groundHits[0].point;
      if (Math.hypot(pt.x, pt.z) > WORLD_RADIUS - 3) return;
      if (this.placementMode) {
        this.placementMode = false;
        this.callbacks.onPlaceWaypointRequest(pt.x, pt.z);
        return;
      }
      const walkY = getSurfaceHeightAt(pt.x, pt.z);
      this.walkTarget = new THREE.Vector3(pt.x, walkY, pt.z);
      this.walkMarkerMesh.position.set(pt.x, walkY + 0.08, pt.z);
      this.walkMarkerMesh.visible = true;
    }
  }

  public setGameState(next: WorldGameState): void {
    this.gameState = next;
    if (next !== 'playing') {
      this.keysPressed.clear();
      this.walkTarget = null;
      this.walkMarkerMesh.visible = false;
    }
  }

  public setTimePreset(preset: TimePreset): void {
    this.timePreset = preset;
    this.shadowForceDirty = true;
    this.syncLighting((performance.now() - this.startTimeMs) / 1000);
    this.emitHud(true);
    this.scheduleImmediateRender();
  }

  private getPixelScale(): number {
    const h = Math.max(1, this.container.clientHeight || window.innerHeight);
    return this.renderer.getPixelRatio() * Math.max(0.65, h / 900);
  }

  public syncDiscoveredLandmarks(ids: string[]): void {
    this.discoveredLandmarkIds = new Set(ids);
  }

  public markLandmarkDiscovered(id: string): void {
    this.discoveredLandmarkIds.add(id);
  }

  public setWeather(weather: WeatherKind): void {
    this.weather = weather;
    this.shadowForceDirty = true;
    this.pondRainIntensity = weather === 'rain' ? 1.0 : weather === 'mist' ? 0.14 : 0.0;
    REFLECTIVE_WATER_ENV_UNIFORMS.uRainIntensity.value = this.pondRainIntensity;
    this.weatherParticles?.syncWeatherImmediate(weather, this.getPixelScale());
    if (this.sakuraPetalsPoints) {
      this.sakuraPetalsPoints.visible = weather === 'clear' || weather === 'mist';
    }
    this.syncLighting((performance.now() - this.startTimeMs) / 1000);
    this.emitHud(true);
    this.scheduleImmediateRender();
  }

  public setLumbiniPreset(preset: LumbiniAmbiencePreset): void {
    this.lumbiniPreset = preset;
    this.shadowForceDirty = true;
    this.syncLighting((performance.now() - this.startTimeMs) / 1000);
    this.emitHud(true);
    this.scheduleImmediateRender();
  }

  public setCameraMode(mode: CameraViewMode): void {
    this.cameraMode = mode;
    if (this.character?.root) {
      this.character.root.visible = Boolean(this.focusedLandmark) || mode !== 'first-person';
    }
    this.writeDataset('cameraMode', mode);
    this.emitHud(true);
    this.scheduleImmediateRender();
  }

  public toggleCameraMode(): CameraViewMode {
    const next: CameraViewMode =
      this.cameraMode === 'third-person' ? 'first-person' : 'third-person';
    this.setCameraMode(next);
    return next;
  }

  public setGraphicsQuality(preset: GraphicsQualityPreset): void {
    this.graphicsQuality = preset;
    this.shadowForceDirty = true;
    const cfg = getGraphicsQualityConfig(preset);
    this.grassController?.setQuality?.(preset);
    if (this.renderer) {
      const targetRatio = this.isSoftwareGl
        ? Math.min(0.75, cfg.maxPixelRatio)
        : Math.min(window.devicePixelRatio || 1, cfg.maxPixelRatio);
      this.renderer.setPixelRatio(targetRatio);
      this.composer?.setPixelRatio(targetRatio);
      const shadowRes = this.isSoftwareGl ? Math.min(512, cfg.shadowMapSize) : cfg.shadowMapSize;
      if (this.sunLight && this.sunLight.shadow.mapSize.x !== shadowRes) {
        this.sunLight.shadow.mapSize.set(shadowRes, shadowRes);
        this.sunLight.shadow.map?.dispose();
        this.sunLight.shadow.map = null;
      }
      this.writeDataset('graphicsQuality', preset);
    }
    this.syncLighting((performance.now() - this.startTimeMs) / 1000);
    this.scheduleImmediateRender();
  }

  public spinPrayerWheel(index: number, impulse = 16.0): void {
    const entry = this.prayerWheelEntries[index];
    if (!entry) return;
    const elapsed = (performance.now() - this.startTimeMs) / 1000;
    entry.velocity = Math.min(28, entry.velocity + impulse);
    entry.cooldownUntil = elapsed + 0.9;
    this.prayerWheelSpinsCount += 1;
    this.writeDataset('prayerWheelSpins', String(this.prayerWheelSpinsCount));
    this.spawnPrayerWheelParticles(entry.worldPos.x, entry.worldPos.y + 0.15, entry.worldPos.z, impulse / 14);
    soundEngine.playPrayerWheelSpin();
  }

  public tossPebble(spotIndex: number): void {
    const spot = this.pebbleSpots[spotIndex];
    if (!spot) return;
    if (!this.tossedPebbleGeo) {
      this.tossedPebbleGeo = new THREE.DodecahedronGeometry(0.11, 0);
      this.tossedPebbleMat = new THREE.MeshStandardMaterial({ color: 0x6f747a, roughness: 0.8 });
    }
    const mesh = new THREE.Mesh(this.tossedPebbleGeo, this.tossedPebbleMat!);
    mesh.scale.set(1.2, 0.72, 1.0);
    mesh.userData.nonCollidable = true;
    const startPos = new THREE.Vector3(this.playerPos.x, this.playerPos.y + 1.15, this.playerPos.z);
    const jitterX = (Math.random() - 0.5) * 2.2;
    const jitterZ = (Math.random() - 0.5) * 2.2;
    const targetPos = new THREE.Vector3(spot.pondX + jitterX, 0.16, spot.pondZ + jitterZ);
    mesh.position.copy(startPos);
    this.scene.add(mesh);
    this.activeTossedPebbles.push({
      mesh,
      startPos,
      targetPos,
      progress: 0,
      duration: 0.56,
      pondY: 0.16,
    });
    this.pebbleTossesCount += 1;
    this.writeDataset('pebbleTosses', String(this.pebbleTossesCount));
    soundEngine.playClick();
  }

  public toggleMeditation(spotIndex?: number): void {
    if (this.isMeditating) {
      this.isMeditating = false;
      this.meditationTarget = null;
      this.emitHud(true);
      return;
    }
    const spot =
      typeof spotIndex === 'number'
        ? this.meditationSpots[spotIndex]
        : this.meditationSpots[0];
    if (!spot) return;
    this.isMeditating = true;
    this.meditationTarget = spot;
    this.walkTarget = null;
    this.walkMarkerMesh.visible = false;
    this.playerPos.x = spot.x;
    this.playerPos.z = spot.z;
    this.playerPos.y = getSurfaceHeightAt(spot.x, spot.z);
    this.playerYaw = Math.atan2(spot.lookX - spot.x, spot.lookZ - spot.z);
    soundEngine.playBellChime();
    this.emitHud(true);
  }

  public lightButterLamp(index?: number): void {
    if (this.butterLampEntries.length === 0) return;
    const elapsed = (performance.now() - this.startTimeMs) / 1000;
    const chosen =
      typeof index === 'number' && this.butterLampEntries[index]
        ? this.butterLampEntries[index]
        : this.butterLampEntries.find((l) => !l.isLit) ?? this.butterLampEntries[0];
    if (!chosen) return;

    chosen.isLit = true;
    chosen.litAtElapsed = elapsed;
    chosen.flameGroup.visible = true;
    chosen.flameGroup.scale.setScalar(0.32);

    this.ritualOfferingsCount += 1;
    let litCount = 0;
    for (const lamp of this.butterLampEntries) {
      if (lamp.isLit) litCount++;
    }

    this.spawnButterLampOfferingParticles(
      chosen.worldPos.x,
      chosen.worldPos.y + 0.05,
      chosen.worldPos.z,
    );
    soundEngine.playRitualButterLampOffering(litCount);

    this.writeDataset('butterLampsLit', String(litCount));
    this.writeDataset('ritualOfferings', String(this.ritualOfferingsCount));
    this.writeDataset('ritualOfferingSounds', String(soundEngine.getRitualOfferingSoundCount()));
    this.lastContextualAction = this.getContextualAction();
    this.emitHud(true);
    this.scheduleImmediateRender();
  }

  public triggerPashupatiLingamOffering(): void {
    this.pashupatiLingamOfferingFn?.();
    this.pashupatiOfferingsCount += 1;
    this.ritualOfferingsCount += 1;
    soundEngine.playPashupatiShankhaBlessing();
    const lc = PASHUPATI_INTERACTIVE_SPOTS.shivaLingamCenter;
    this.spawnButterLampOfferingParticles(lc.x, PASHUPATI_COMPLEX.plinthDeckY + 1.45, lc.z);
    this.writeDataset('pashupatiOfferings', String(this.pashupatiOfferingsCount));
    this.writeDataset('ritualOfferings', String(this.ritualOfferingsCount));
    this.callbacks.onInspectHighlight?.(PASHUPATI_HIGHLIGHTS.shivaLingam);
    this.lastContextualAction = this.getContextualAction();
    this.emitHud(true);
    this.scheduleImmediateRender();
  }

  public inspectPashupatiNandi(): void {
    soundEngine.playBellChime();
    this.callbacks.onInspectHighlight?.(PASHUPATI_HIGHLIGHTS.goldenNandi);
  }

  public togglePashupatiGheeRack(index: number): void {
    const rack = PASHUPATI_INTERACTIVE_SPOTS.gheeLampRacks[index];
    if (!rack || !this.pashupatiToggleRackFn) return;
    const isNowLit = this.pashupatiToggleRackFn(index);
    if (index === 0 || index === 1) {
      this.pashupatiGheeRackLit[index] = isNowLit;
    }
    this.ritualOfferingsCount += 1;
    this.spawnButterLampOfferingParticles(rack.x, PASHUPATI_COMPLEX.courtyardY + 1.05, rack.z);
    const litTotal = (this.pashupatiGheeRackLit[0] ? 1 : 0) + (this.pashupatiGheeRackLit[1] ? 1 : 0);
    soundEngine.playRitualButterLampOffering(Math.max(1, litTotal));
    this.writeDataset('pashupatiGheeRacksLit', String(litTotal));
    this.writeDataset('ritualOfferings', String(this.ritualOfferingsCount));
    this.syncLighting((performance.now() - this.startTimeMs) / 1000);
    this.lastContextualAction = this.getContextualAction();
    this.emitHud(true);
    this.scheduleImmediateRender();
  }

  public performPashupatiBagmatiAarati(): void {
    this.pashupatiTriggerAaratiFn?.();
    this.bagmatiAaratiCount += 1;
    this.ritualOfferingsCount += 1;
    soundEngine.playBagmatiAaratiRitual();
    for (const st of PASHUPATI_INTERACTIVE_SPOTS.aaratiStands) {
      this.spawnButterLampOfferingParticles(st.x, 1.85, st.z);
    }
    this.writeDataset('bagmatiAaratiCount', String(this.bagmatiAaratiCount));
    this.writeDataset('ritualOfferings', String(this.ritualOfferingsCount));
    this.callbacks.onInspectHighlight?.(PASHUPATI_HIGHLIGHTS.bagmatiAarati);
    this.syncLighting((performance.now() - this.startTimeMs) / 1000);
    this.lastContextualAction = this.getContextualAction();
    this.emitHud(true);
    this.scheduleImmediateRender();
  }

  private getContextualAction(): ContextualWorldAction | null {
    const nearest = findNearestLandmark(this.playerPos.x, this.playerPos.z);

    const wLen = this.prayerWheelEntries.length;
    this.wheelSpotsScratch.length = wLen;
    for (let i = 0; i < wLen; i++) {
      const wp = this.prayerWheelEntries[i].worldPos;
      let slot = this.wheelSpotsScratch[i];
      if (!slot) {
        slot = { x: wp.x, z: wp.z };
        this.wheelSpotsScratch[i] = slot;
      } else {
        slot.x = wp.x;
        slot.z = wp.z;
      }
    }

    const bLen = this.templeBellEntries.length;
    this.bellSpotsScratch.length = bLen;
    for (let i = 0; i < bLen; i++) {
      const wp = this.templeBellEntries[i].worldPos;
      let slot = this.bellSpotsScratch[i];
      if (!slot) {
        slot = { x: wp.x, z: wp.z };
        this.bellSpotsScratch[i] = slot;
      } else {
        slot.x = wp.x;
        slot.z = wp.z;
      }
    }

    const lLen = this.butterLampEntries.length;
    this.lampSpotsScratch.length = lLen;
    for (let i = 0; i < lLen; i++) {
      const entry = this.butterLampEntries[i];
      let slot = this.lampSpotsScratch[i];
      if (!slot) {
        slot = { x: entry.worldPos.x, z: entry.worldPos.z, isLit: entry.isLit };
        this.lampSpotsScratch[i] = slot;
      } else {
        slot.x = entry.worldPos.x;
        slot.z = entry.worldPos.z;
        slot.isLit = entry.isLit;
      }
    }

    return computeContextualWorldAction(
      this.playerPos.x,
      this.playerPos.z,
      nearest?.landmark ?? null,
      this.wheelSpotsScratch,
      this.bellSpotsScratch,
      this.pebbleSpots,
      this.meditationSpots,
      this.lampSpotsScratch,
      {
        gheeLampRacks: PASHUPATI_INTERACTIVE_SPOTS.gheeLampRacks.map((r, idx) => ({
          x: r.x,
          z: r.z,
          lit: Boolean(this.pashupatiGheeRackLit[idx]),
        })),
        aaratiTerrace: PASHUPATI_INTERACTIVE_SPOTS.aaratiTerraceCenter,
      },
    );
  }

  public triggerContextualAction(): void {
    if (this.gameState !== 'playing') return;
    if (this.isMeditating) {
      this.toggleMeditation();
      return;
    }
    const action = this.getContextualAction();
    if (!action) return;

    if (action.kind === 'inspect-shiva-lingam') {
      this.triggerPashupatiLingamOffering();
      return;
    }
    if (action.kind === 'inspect-golden-nandi') {
      this.inspectPashupatiNandi();
      return;
    }
    if (action.kind === 'light-pashupati-lamps' && typeof action.index === 'number') {
      this.togglePashupatiGheeRack(action.index);
      return;
    }
    if (action.kind === 'perform-bagmati-aarati') {
      this.performPashupatiBagmatiAarati();
      return;
    }
    if (action.kind === 'inspect-marker-stone' && this.mayaDeviHighlights?.markerStone) {
      soundEngine.playBellChime();
      this.callbacks.onInspectHighlight?.(this.mayaDeviHighlights.markerStone);
      return;
    }
    if (action.kind === 'inspect-mauryan-chambers' && this.mayaDeviHighlights?.mauryanChambers) {
      soundEngine.playBellChime();
      this.callbacks.onInspectHighlight?.(this.mayaDeviHighlights.mauryanChambers);
      return;
    }
    if (action.kind === 'inspect-nativity-relief' && this.mayaDeviHighlights?.nativityRelief) {
      soundEngine.playBellChime();
      this.callbacks.onInspectHighlight?.(this.mayaDeviHighlights.nativityRelief);
      return;
    }
    if (action.kind === 'light-butter-lamp') {
      this.lightButterLamp(action.index);
      return;
    }
    if (action.kind === 'spin-prayer-wheel' && typeof action.index === 'number') {
      this.spinPrayerWheel(action.index, 17.5);
      // Spin adjacent wheels in the rack gently for tactile wave effect
      if (this.prayerWheelEntries[action.index - 1]) this.spinPrayerWheel(action.index - 1, 9.5);
      if (this.prayerWheelEntries[action.index + 1]) this.spinPrayerWheel(action.index + 1, 9.5);
      return;
    }
    if (action.kind === 'ring-temple-bell' && typeof action.index === 'number') {
      const bell = this.templeBellEntries[action.index];
      if (bell) {
        const elapsed = (performance.now() - this.startTimeMs) / 1000;
        const dist = Math.hypot(bell.worldPos.x - this.playerPos.x, bell.worldPos.z - this.playerPos.z);
        this.triggerTempleBell(bell, elapsed, 1.0, dist);
      }
      return;
    }
    if (action.kind === 'toss-pebble' && typeof action.index === 'number') {
      this.tossPebble(action.index);
      return;
    }
    if (action.kind === 'sit-meditate' && typeof action.index === 'number') {
      this.toggleMeditation(action.index);
      return;
    }
    if (action.kind === 'landmark' && action.landmark) {
      soundEngine.playClick();
      this.callbacks.onSelectLandmark(action.landmark);
    }
  }

  public setPlacementMode(active: boolean): void {
    this.placementMode = active;
    this.renderer.domElement.style.cursor = active ? 'crosshair' : 'grab';
  }

  private computeFocusedCameraTargets(
    lm: LandmarkData,
    lookOut: THREE.Vector3,
    camOut: THREE.Vector3,
  ): void {
    const ly = groundHeightAt(lm.position.x, lm.position.z);
    const id = lm.id;
    const isTallTower = id === 'vit-vellore-tower';
    const isPagoda = id === 'kathmandu-stupa';
    const isBoudha = id === 'boudhanath-stupa';
    const isJanaki = id === 'janaki-mandir';
    const isPumdikot = id === 'pumdikot-shiva';
    const isLumbini = id === 'lumbini-buddha';
    const lookYOffset = isJanaki
      ? 8.4
      : isLumbini
        ? 8.2
        : isPagoda
          ? 10.5
          : isTallTower
            ? 5.0
            : isBoudha
              ? 3.9
              : isPumdikot
                ? 3.6
                : 2.8;
    const focusDist = isJanaki
      ? 60
      : isLumbini
        ? 68.0
        : isPagoda
          ? 72.0
          : isTallTower
            ? 16.5
            : isBoudha
              ? 16.5
              : isPumdikot
                ? 15.2
                : 13.0;
    const camYOffset = isJanaki
      ? 8.5
      : isLumbini
        ? 10.5
        : isPagoda
          ? 14.5
          : isTallTower
            ? 5.2
            : isBoudha || isPumdikot
              ? 4.8
              : 4.5;
    const azimuthOffset = isJanaki ? 0.2 : isLumbini ? 0.34 : isPagoda ? -0.52 : 0.32;
    lookOut.set(lm.position.x, ly + lookYOffset, lm.position.z);
    camOut.set(
      lookOut.x + Math.sin(this.cameraYaw + azimuthOffset) * focusDist,
      lookOut.y + camYOffset,
      lookOut.z + Math.cos(this.cameraYaw + azimuthOffset) * focusDist,
    );
  }

  public setFocusedLandmark(lm: LandmarkData | null): void {
    this.focusedLandmark = lm;
    if (this.character?.root) {
      this.character.root.visible = Boolean(lm) || this.cameraMode !== 'first-person';
    }
    if (lm && this.justTeleported) {
      this.justTeleported = false;
      this.computeFocusedCameraTargets(lm, this.currentLookAt, this.currentCamPos);
      this.camera.position.copy(this.currentCamPos);
      this.camera.lookAt(this.currentLookAt);
      this.scheduleImmediateRender();
    } else if (!lm) {
      if (this.cameraMode === 'first-person') {
        const fpPitch = computeFirstPersonLookPitch(this.cameraPitch);
        const eyeY = this.playerPos.y + 1.56;
        this.currentCamPos.set(this.playerPos.x, eyeY, this.playerPos.z);
        this.currentLookAt.set(
          this.playerPos.x - Math.sin(this.cameraYaw) * Math.cos(fpPitch) * 12,
          eyeY + Math.sin(fpPitch) * 12,
          this.playerPos.z - Math.cos(this.cameraYaw) * Math.cos(fpPitch) * 12,
        );
      } else {
        const horiz = Math.cos(this.cameraPitch) * this.cameraDistance;
        const vert = Math.sin(this.cameraPitch) * this.cameraDistance;
        this.currentLookAt.set(this.playerPos.x, this.playerPos.y + 1.5, this.playerPos.z);
        this.currentCamPos.set(
          this.playerPos.x + Math.sin(this.cameraYaw) * horiz,
          this.playerPos.y + vert + 1.5,
          this.playerPos.z + Math.cos(this.cameraYaw) * horiz,
        );
        this.applyCameraOcclusion(this.currentLookAt, this.currentCamPos);
      }
      this.camera.position.copy(this.currentCamPos);
      this.camera.lookAt(this.currentLookAt);
      this.scheduleImmediateRender();
    }
  }

  private sampleCameraFloorHeight(x: number, z: number, refY: number): number {
    const surfaceY = getSurfaceHeightAt(x, z);
    const bvhY = this.physicsWorld.sampleFloorHeight(x, z, refY);
    return bvhY !== null ? Math.max(surfaceY, bvhY) : surfaceY;
  }

  private applyCameraOcclusion(lookAt: THREE.Vector3, camPos: THREE.Vector3): void {
    if (this.cameraOccluders.length > 0) {
      _camRayDir.subVectors(camPos, lookAt);
      const desiredDist = _camRayDir.length();
      if (desiredDist > 0.1) {
        _camRayDir.divideScalar(desiredDist);
        this.filteredOccludersScratch.length = 0;
        for (let i = 0; i < this.occluderSpheres.length; i++) {
          const s = this.occluderSpheres[i];
          if (
            raySegmentHitsSphere(
              lookAt.x,
              lookAt.y,
              lookAt.z,
              _camRayDir.x,
              _camRayDir.y,
              _camRayDir.z,
              desiredDist,
              s.cx,
              s.cy,
              s.cz,
              s.radius,
              0.75,
            )
          ) {
            this.filteredOccludersScratch.push(this.cameraOccluders[s.objIndex]);
          }
        }
        if (this.filteredOccludersScratch.length > 0) {
          this.raycaster.layers.set(0);
          this.raycaster.near = 0.22;
          this.raycaster.far = desiredDist;
          this.raycaster.set(lookAt, _camRayDir);
          const hits = this.raycaster.intersectObjects(this.filteredOccludersScratch, false);
          this.raycaster.near = 0;
          this.raycaster.far = Infinity;
          if (hits.length > 0) {
            const safeDist = Math.max(0.75, hits[0].distance - 0.35);
            camPos.copy(lookAt).addScaledVector(_camRayDir, safeDist);
          }
        }
      }
    }

    // Enforce solid Bodhi trunk radial clearance so third-person camera never enters trunk or saffron cloth
    const bodhiDx = camPos.x - -239.0;
    const bodhiDz = camPos.z - 112.5;
    const bodhiR = Math.hypot(bodhiDx, bodhiDz);
    if (bodhiR < 1.38 && camPos.y >= 0.45 && camPos.y <= 5.4) {
      const pushScale = 1.38 / Math.max(0.05, bodhiR);
      camPos.x = -239.0 + bodhiDx * pushScale;
      camPos.z = 112.5 + bodhiDz * pushScale;
    }

    const cleared = resolveThirdPersonCameraFloorClearance(
      lookAt.x,
      lookAt.y,
      lookAt.z,
      camPos.x,
      camPos.y,
      camPos.z,
      0.65,
      0.24,
      (sx, sz) => this.sampleCameraFloorHeight(sx, sz, lookAt.y + 0.6),
    );
    camPos.set(cleared.x, cleared.y, cleared.z);

    // When looking steeply upward in third-person, slide slightly over the shoulder so backpack does not block ceiling view
    const finalDist = camPos.distanceTo(lookAt);
    if (this.cameraPitch < -0.22 && finalDist < 2.6) {
      const shoulderWeight =
        Math.min(1, (-0.22 - this.cameraPitch) / 0.75) *
        Math.min(1, (2.6 - finalDist) / 1.4);
      const rightX = Math.cos(this.cameraYaw);
      const rightZ = -Math.sin(this.cameraYaw);
      const rightOffset = 0.72 * shoulderWeight;
      const liftOffset = 0.22 * shoulderWeight;
      lookAt.x += rightX * rightOffset;
      lookAt.z += rightZ * rightOffset;
      lookAt.y += liftOffset;
      camPos.x += rightX * rightOffset;
      camPos.z += rightZ * rightOffset;
      camPos.y += liftOffset;
    }
  }

  public setJoystickInput(x: number, y: number): void {
    this.joystickVec.x = x;
    this.joystickVec.y = y;
  }

  public triggerJump(): void {
    if (this.gameState === 'playing' && this.isGrounded) {
      this.isMeditating = false;
      this.meditationTarget = null;
      this.playerVelY = 7.4;
      this.isGrounded = false;
      this.squashScaleY = 1.2;
      soundEngine.playJump();
    }
  }

  public teleportTo(x: number, z: number): void {
    const prevX = this.playerPos.x;
    const prevZ = this.playerPos.z;
    const safe = clampToWalkable(this.playerPos.x, this.playerPos.z, x, z);
    this.playerPos.x = safe.x;
    this.playerPos.z = safe.z;
    this.shadowForceDirty = true;
    this.playerPos.y = getSurfaceHeightAt(safe.x, safe.z);
    this.playerVelY = 0;
    this.isGrounded = true;
    this.walkTarget = null;
    this.walkMarkerMesh.visible = false;
    this.character.root.position.copy(this.playerPos);
    if (Math.hypot(safe.x - prevX, safe.z - prevZ) > 8) {
      this.justTeleported = true;
      const atPashupatiWestPlaza =
        Math.abs(safe.x - (PASHUPATI_COMPLEX.minX - 10.0)) <= 10.0 &&
        Math.abs(safe.z - PASHUPATI_COMPLEX.centerZ) <= 12.0;
      const inPashupatiSanctum =
        Math.abs(safe.x - PASHUPATI_COMPLEX.centerX) <= 8.2 &&
        Math.abs(safe.z - PASHUPATI_COMPLEX.centerZ) <= 8.2;
      if (atPashupatiWestPlaza) {
        // Face East directly toward the grand Pashupatinath Paschim Dwar Torana Gate
        this.playerYaw = Math.PI * 0.5;
        this.cameraYaw = -Math.PI * 0.5;
        this.targetCameraYaw = -Math.PI * 0.5;
        this.cameraPitch = 0.24;
        this.targetCameraPitch = 0.24;
      } else if (inPashupatiSanctum) {
        const toCenterX = PASHUPATI_COMPLEX.centerX - safe.x;
        const toCenterZ = PASHUPATI_COMPLEX.centerZ - safe.z;
        const aimAngle = Math.hypot(toCenterX, toCenterZ) > 0.2 ? Math.atan2(toCenterX, toCenterZ) : Math.PI * 0.5;
        this.playerYaw = aimAngle;
        this.cameraYaw = aimAngle + Math.PI;
        this.targetCameraYaw = aimAngle + Math.PI;
        this.cameraPitch = 0.14;
        this.targetCameraPitch = 0.14;
      } else {
        this.playerYaw = Math.PI;
        this.cameraYaw = 0;
        this.targetCameraYaw = 0;
        this.cameraPitch = 0.45;
        this.targetCameraPitch = 0.45;
      }
      this.character.root.rotation.y = this.playerYaw;
      const inCourtyard =
        inPashupatiSanctum ||
        (Math.abs(safe.x + 92) <= 13.8 && safe.z >= 79.0 && safe.z <= 102.6) ||
        (Math.abs(safe.x - LUMBINI_SACRED_POND.centerX) <= 17.2 &&
          safe.z >= LUMBINI_SACRED_POND.centerZ - 33.2 &&
          safe.z <= LUMBINI_SACRED_POND.centerZ - 10.8);
      this.currentLookAt.set(safe.x, this.playerPos.y + (inCourtyard ? 1.5 : 1.8), safe.z);
      if (atPashupatiWestPlaza) {
        this.currentCamPos.set(safe.x - 14.5, this.playerPos.y + 6.5, safe.z + 2.5);
      } else if (inPashupatiSanctum) {
        this.currentCamPos.set(
          safe.x + Math.sin(this.cameraYaw) * 3.2,
          this.playerPos.y + 2.0,
          safe.z + Math.cos(this.cameraYaw) * 3.2,
        );
      } else if (inCourtyard) {
        this.currentCamPos.set(safe.x, this.playerPos.y + 4.4, safe.z + 6.5);
      } else {
        this.currentCamPos.set(safe.x + 7.5, this.playerPos.y + 9.2, safe.z + 20.5);
      }
      this.camera.position.copy(this.currentCamPos);
      this.camera.lookAt(this.currentLookAt);
      this.scheduleImmediateRender();
    }
    const ambienceMix = computeSpatialAmbienceMix(
      this.playerPos.x,
      this.playerPos.z,
      this.playerPos.y,
    );
    this.camera.getWorldDirection(_camForward);
    this.listenerPoseScratch.x = this.playerPos.x;
    this.listenerPoseScratch.y = this.playerPos.y + 1.6;
    this.listenerPoseScratch.z = this.playerPos.z;
    this.listenerPoseScratch.forwardX = _camForward.x;
    this.listenerPoseScratch.forwardY = _camForward.y;
    this.listenerPoseScratch.forwardZ = _camForward.z;
    soundEngine.updateAmbience(
      ambienceMix,
      0.016,
      this.lumbiniPreset,
      this.weather,
      this.listenerPoseScratch,
      getPresetHour(this.timePreset),
    );
    const lumbiniSpatial = soundEngine.getLumbiniSpatialStatus();
    const forestBirdStatus = soundEngine.getForestBirdStatus();
    const cricketStatus = soundEngine.getLumbiniCricketStatus();
    this.writeDataset('ambienceZone', ambienceMix.activeZone);
    this.writeDataset('lumbiniSpatialAudio', lumbiniSpatial.inZone ? 'true' : 'false');
    this.writeDataset('forestBirdInZone', forestBirdStatus.inForest ? 'true' : 'false');
    this.writeDataset(
      'lastForestBirdEmitter',
      forestBirdStatus.lastEmitterId ?? forestBirdStatus.nearestEmitterId ?? 'none',
    );
    this.writeDataset('cricketInZone', cricketStatus.inZone ? 'true' : 'false');
    this.writeDataset(
      'lastCricketEmitter',
      cricketStatus.lastEmitterId ?? cricketStatus.nearestEmitterId ?? 'none',
    );
    this.writeDataset(
      'insideMayaDevi',
      Math.abs(this.playerPos.x - LUMBINI_SACRED_POND.centerX) <= 17.2 &&
        this.playerPos.z >= LUMBINI_SACRED_POND.centerZ - 33.2 &&
        this.playerPos.z <= LUMBINI_SACRED_POND.centerZ - 10.8
        ? 'true'
        : 'false',
    );
    this.lastSyncDatasetFlushAt = -10;
    this.lastSimDatasetFlushAt = -10;
    this.emitHud(true);
  }

  public resetToSpawn(): void {
    this.teleportTo(SPAWN_POSITION.x, SPAWN_POSITION.z);
    this.playerYaw = Math.PI;
    this.cameraYaw = 0;
    this.targetCameraYaw = 0;
    this.cameraPitch = 0.45;
    this.targetCameraPitch = 0.45;
  }

  public setInitialDistanceWalked(meters: number): void {
    this.distanceWalked = Math.max(0, meters);
    this.emitHud(true);
  }

  public syncCustomWaypoints(waypoints: CustomWaypoint[]): void {
    while (this.customWaypointGroup.children.length > 0) {
      const child = this.customWaypointGroup.children[0];
      this.customWaypointGroup.remove(child);
    }
    for (const wp of waypoints) {
      const flag = createCustomWaypointFlag(wp.color);
      const y = getSurfaceHeightAt(wp.x, wp.z);
      flag.position.set(wp.x, y, wp.z);
      this.customWaypointGroup.add(flag);
    }
  }

  private syncLighting(elapsed: number): void {
    const hour = getPresetHour(this.timePreset);
    const lightingAnchor = this.gameState === 'title' ? this.currentLookAt : this.playerPos;
    const { lighting: state, lumbiniBlend } = computeEffectiveLightingState(
      hour,
      this.weather,
      lightingAnchor.x,
      lightingAnchor.z,
      this.lumbiniPreset,
      this.focusedLandmark?.id,
    );

    this.sunLight.color.set(state.sunColor);
    this.sunLight.intensity = state.sunIntensity;
    const sunOffX = Math.sin(state.sunAzimuth + 0.55) * 95;
    const sunOffY = Math.max(28, Math.sin(state.sunElevation) * 105);
    const sunOffZ = Math.cos(state.sunAzimuth + 0.55) * 80;
    const lx = this.currentLookAt.x;
    const lz = this.currentLookAt.z;
    this.sunLight.target.position.set(lx, 0, lz);
    this.sunLight.target.updateMatrixWorld();
    this.sunLight.position.set(lx + sunOffX, sunOffY, lz + sunOffZ);

    const sunDirLen = Math.hypot(sunOffX, sunOffY, sunOffZ) || 1;
    const sunDirX = sunOffX / sunDirLen;
    const sunDirY = sunOffY / sunDirLen;
    const sunDirZ = sunOffZ / sunDirLen;
    if (!this.isSoftwareGl && this.renderer?.shadowMap.enabled) {
      const nextShadowState: ShadowUpdateCheckInput = {
        targetX: lx,
        targetZ: lz,
        sunDirX,
        sunDirY,
        sunDirZ,
      };
      if (
        shouldUpdateShadowMap(
          this.shadowPrevState,
          nextShadowState,
          this.shadowForceDirty,
          this.maxMovingPropSpeed,
        )
      ) {
        this.renderer.shadowMap.needsUpdate = true;
        if (!this.shadowPrevState) {
          this.shadowPrevState = nextShadowState;
        } else {
          this.shadowPrevState.targetX = lx;
          this.shadowPrevState.targetZ = lz;
          this.shadowPrevState.sunDirX = sunDirX;
          this.shadowPrevState.sunDirY = sunDirY;
          this.shadowPrevState.sunDirZ = sunDirZ;
        }
        this.shadowForceDirty = false;
      }
    }

    const inMayaDeviSanctum =
      Math.abs(lightingAnchor.x - LUMBINI_SACRED_POND.centerX) <= 17.8 &&
      lightingAnchor.z >= LUMBINI_SACRED_POND.centerZ - 33.8 &&
      lightingAnchor.z <= LUMBINI_SACRED_POND.centerZ - 10.2;
    const inPashupatiSanctum =
      Math.abs(lightingAnchor.x - PASHUPATI_COMPLEX.centerX) <= 8.2 &&
      Math.abs(lightingAnchor.z - PASHUPATI_COMPLEX.centerZ) <= 8.2;
    if (inMayaDeviSanctum || inPashupatiSanctum) {
      this.hemiLight.color.set(state.hemiSkyColor).lerp(_targetColor.set(0xffebd0), 0.72);
      this.hemiLight.groundColor.set(state.hemiGroundColor).lerp(_targetColor.set(0x7d4c2c), 0.78);
      this.hemiLight.intensity = Math.max(state.hemiIntensity, 1.05);
    } else {
      this.hemiLight.color.set(state.hemiSkyColor);
      this.hemiLight.groundColor.set(state.hemiGroundColor);
      this.hemiLight.intensity = state.hemiIntensity;
    }

    this.skyDomeMat.uniforms.topColor.value.set(state.skyTopColor);
    this.skyDomeMat.uniforms.horizonColor.value.set(state.skyHorizonColor);
    this.skyDomeMat.uniforms.sunDir.value.set(sunDirX, sunDirY, sunDirZ);
    this.skyDomeMat.uniforms.sunColor.value.set(state.sunColor);
    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.set(state.fogColor);
    }
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.set(state.fogColor);
      this.scene.fog.density = state.fogDensity * 0.85;
    }
    REFLECTIVE_WATER_ENV_UNIFORMS.uWaterTime.value = elapsed;
    const targetRain = this.weather === 'rain' ? 1.0 : this.weather === 'mist' ? 0.14 : 0.0;
    if (Math.abs(this.pondRainIntensity - targetRain) < 0.005) {
      this.pondRainIntensity = targetRain;
    }
    REFLECTIVE_WATER_ENV_UNIFORMS.uRainIntensity.value = this.pondRainIntensity;
    REFLECTIVE_WATER_ENV_UNIFORMS.uSkyColor.value
      .set(state.skyHorizonColor)
      .lerp(_targetColor.set(state.skyTopColor), 0.35);
    REFLECTIVE_WATER_ENV_UNIFORMS.uSunDir.value.set(sunDirX, sunDirY, sunDirZ);
    REFLECTIVE_WATER_ENV_UNIFORMS.uSunColor.value.set(state.sunColor);
    REFLECTIVE_WATER_ENV_UNIFORMS.uFogColor.value.set(state.fogColor);
    REFLECTIVE_WATER_ENV_UNIFORMS.uFogDensity.value = state.fogDensity * 0.85;
    WORLD_HAZE_UNIFORMS.uHazeColor.value.set(state.fogColor);
    WORLD_HAZE_UNIFORMS.uSunDir.value.set(sunDirX, sunDirY, sunDirZ);
    WORLD_HAZE_UNIFORMS.uSunColor.value.set(state.sunColor);
    WORLD_HAZE_UNIFORMS.uHazeDensity.value = Math.max(0.0022, state.fogDensity * 1.15);
    WORLD_HAZE_UNIFORMS.uMaxHaze.value =
      this.weather === 'foggy' ? 0.94 : this.weather === 'mist' ? 0.88 : 0.78;
    if (this.camera && Math.abs(this.camera.far - state.cameraFar) > 0.1) {
      this.camera.far = state.cameraFar;
      this.camera.updateProjectionMatrix();
    }

    this.scene.environmentIntensity = state.envIntensity;

    (this.starsPoints.material as THREE.PointsMaterial).opacity = state.starOpacity;
    this.starsPoints.rotation.y = elapsed * 0.004;
    if (this.milkyWayPoints) {
      (this.milkyWayPoints.material as THREE.PointsMaterial).opacity = state.starOpacity * 0.64;
      this.milkyWayPoints.rotation.y = elapsed * 0.0025;
    }

    if (this.beaconPoolDescs.length === 0) {
      for (let i = 0; i < this.pooledPointLights.length; i++) {
        this.pooledPointLights[i].intensity = 0;
      }
    } else {
      const descCount = this.beaconPoolDescs.length;
      for (let i = 0; i < descCount; i++) {
        const desc = this.beaconPoolDescs[i];
        const dynScale =
          typeof desc.sourceUserData?.intensityScale === 'number'
            ? desc.sourceUserData.intensityScale
            : desc.intensityScale;
        this.beaconEligible[i] =
          dynScale <= 0.01 || (state.lanternIntensity <= 0.02 && !desc.interiorSanctum) ? 0 : 1;
      }
      const selectedCount = selectClosestIndicesZeroAlloc(
        this.beaconPosX,
        this.beaconPosZ,
        this.beaconEligible,
        descCount,
        lx,
        lz,
        this.beaconSelectedIdx,
        this.beaconSelectedDistSq,
        this.pooledPointLights.length,
      );
      for (let i = 0; i < this.pooledPointLights.length; i++) {
        const pl = this.pooledPointLights[i];
        if (i >= selectedCount) {
          pl.intensity = 0;
          continue;
        }
        const desc = this.beaconPoolDescs[this.beaconSelectedIdx[i]];
        pl.position.copy(desc.pos);
        pl.distance = desc.distance;
        pl.decay = desc.decay;
        const dynScale =
          typeof desc.sourceUserData?.intensityScale === 'number'
            ? desc.sourceUserData.intensityScale
            : desc.intensityScale;
        const effectiveLantern = desc.interiorSanctum
          ? Math.max(0.75, state.lanternIntensity)
          : dynScale > 1.8
            ? Math.max(0.85, state.lanternIntensity)
            : state.lanternIntensity;
        const baseInt = effectiveLantern * dynScale;
        if (desc.flickerAmp > 0) {
          const wave =
            0.55 * Math.sin(elapsed * 6.4 + desc.flickerPhase) +
            0.3 * Math.sin(elapsed * 13.1 + desc.flickerPhase * 1.73) +
            0.15 * Math.cos(elapsed * 21.7 + desc.flickerPhase * 0.61);
          const flicker = 1 + wave * desc.flickerAmp;
          pl.intensity = baseInt * flicker;
          if (desc.warmFlicker) {
            const warmth = Math.max(0, Math.min(1, 0.5 + wave * 0.5));
            pl.color.copy(desc.color).offsetHSL(-0.014 + warmth * 0.026, 0, -0.02 + warmth * 0.04);
          } else {
            pl.color.copy(desc.color);
          }
        } else {
          pl.color.copy(desc.color);
          pl.intensity = baseInt;
        }
      }
    }

    const profile = computeAtmosphereParticleProfile(this.weather, hour);
    const gust = 1 + 0.25 * Math.sin(elapsed * 0.34);
    this.birdEnvState.elapsed = elapsed;
    this.birdEnvState.windX = profile.windDriftX * gust;
    this.birdEnvState.windZ = profile.windDriftZ * gust;
    this.birdEnvState.windSpeed = Math.hypot(this.birdEnvState.windX, this.birdEnvState.windZ);
    this.birdEnvState.sunColorHex = state.sunColor;
    this.birdEnvState.skyColorHex = state.skyHorizonColor;
    this.birdEnvState.lanternIntensity = state.lanternIntensity;
    this.birdEnvState.weather = this.weather;

    if (this.sakuraPetalsMat) {
      (this.sakuraPetalsMat.uniforms.uWind.value as THREE.Vector2).set(
        this.birdEnvState.windX,
        this.birdEnvState.windZ,
      );
      _targetColor.set(state.sunColor);
      (this.sakuraPetalsMat.uniforms.uLightTint.value as THREE.Color)
        .set('#fff3f8')
        .lerp(_targetColor, 0.22);
    }

    for (let i = 0; i < this.animatedLandmarkNodes.length; i++) {
      const anchor = this.animatedNodeAnchors[i];
      if (
        anchor &&
        !anchor.isGlobal &&
        !isWithinSleepDistanceSq(anchor.x, anchor.z, lx, lz, 8100)
      ) {
        continue;
      }
      const node = this.animatedLandmarkNodes[i];
      if (typeof node.userData.onEnvironmentUpdate === 'function') {
        node.userData.onEnvironmentUpdate(this.birdEnvState);
      } else if (typeof node.userData.onFlickerUpdate === 'function') {
        node.userData.onFlickerUpdate(elapsed, state.lanternIntensity, state.emissiveScale);
      }
    }

    if (this.bloomPass) {
      this.bloomPass.strength = state.bloomStrength;
      this.bloomPass.radius = state.bloomRadius;
      this.bloomPass.threshold = state.bloomThreshold;
    }
    for (let i = 0; i < this.emissiveRegistry.length; i++) {
      const entry = this.emissiveRegistry[i];
      entry.mat.emissiveIntensity = entry.baseIntensity * state.emissiveScale;
    }

    const fireflyIntensity = computeLumbiniFireflyIntensity(
      this.timePreset,
      state.hour,
      this.lumbiniPreset,
      this.weather,
      state.phaseLabel,
    );
    const pixelScale = this.getPixelScale();
    if (this.lumbiniFireflies) {
      const nearFireflies = isWithinSleepDistanceSq(
        lx,
        lz,
        LUMBINI_SACRED_POND.centerX,
        LUMBINI_SACRED_POND.centerZ - 8,
        14400,
      );
      this.lumbiniFireflies.points.visible = nearFireflies && fireflyIntensity > 0.01;
      if (nearFireflies) {
        this.lumbiniFireflies.update(elapsed, fireflyIntensity, pixelScale);
      }
    }
    let litLampCount = 0;
    for (let i = 0; i < this.butterLampEntries.length; i++) {
      if (this.butterLampEntries[i].isLit) litLampCount++;
    }
    const ritualGlow =
      this.butterLampEntries.length > 0 ? litLampCount / this.butterLampEntries.length : 0;
    if (this.lumbiniIncenseSmoke) {
      const nearSmoke = isWithinSleepDistanceSq(
        lx,
        lz,
        LUMBINI_SACRED_POND.centerX,
        LUMBINI_SACRED_POND.centerZ - 22,
        8100,
      );
      this.lumbiniIncenseSmoke.points.visible = nearSmoke;
      if (nearSmoke) {
        this.lumbiniIncenseSmoke.update(
          elapsed,
          this.birdEnvState.windX,
          this.birdEnvState.windZ,
          pixelScale,
          state.sunColor,
          ritualGlow,
        );
      }
    }
    if (this.atmospherePoints) {
      this.atmospherePoints.visible = this.weather === 'mist' || this.weather === 'foggy';
    }
    if (this.sakuraPetalsPoints) {
      this.sakuraPetalsPoints.visible = this.weather === 'clear' || this.weather === 'mist';
    }

    if (
      this.renderer?.domElement &&
      (this.lastSyncDatasetFlushAt < 0 || elapsed - this.lastSyncDatasetFlushAt >= 0.25)
    ) {
      this.lastSyncDatasetFlushAt = elapsed;
      this.writeDataset('weather', this.weather);
      this.writeDataset('lumbiniPreset', this.lumbiniPreset);
      this.writeDataset('lumbiniBlend', lumbiniBlend.toFixed(2));
      this.writeDataset('particleIntensity', profile.activeRatio.toFixed(2));
      this.writeDataset('weatherParticleMode', this.weatherParticles?.currentMode ?? 'petals');
      this.writeDataset('weatherParticleCount', String(this.weatherParticles?.count ?? 0));
      this.writeDataset('lumbiniFireflyIntensity', fireflyIntensity.toFixed(2));
      this.writeDataset('lumbiniFireflyCount', String(this.lumbiniFireflies?.count ?? 0));
      this.writeDataset('incenseSmokeCount', String(this.lumbiniIncenseSmoke?.count ?? 0));
      this.writeDataset('butterLampsLit', String(litLampCount));
      this.writeDataset('butterLampsTotal', String(this.butterLampEntries.length));
      this.writeDataset('ritualOfferings', String(this.ritualOfferingsCount));
      this.writeDataset('ritualOfferingSounds', String(soundEngine.getRitualOfferingSoundCount()));
      this.writeDataset('lastApproachCueLandmark', this.lastApproachCueLandmarkId ?? 'none');
      this.writeDataset('approachCueCount', String(this.approachCueCount));
      this.writeDataset('cameraFar', String(Math.round(this.camera.far)));
      this.writeDataset('bloomStrength', state.bloomStrength.toFixed(2));
      this.writeDataset('bloomThreshold', state.bloomThreshold.toFixed(2));
      this.writeDataset('postprocessing', this.composer ? 'bloom' : 'direct');
      this.writeDataset('lotusCount', String(this.lumbiniLotusCount));
      this.writeDataset('pondRainRipple', REFLECTIVE_WATER_ENV_UNIFORMS.uRainIntensity.value.toFixed(2));
      this.writeDataset('pondProximityRipple', REFLECTIVE_WATER_ENV_UNIFORMS.uPlayerPondProximity.value.toFixed(2));
      this.writeDataset('pondTrailRipples', String(this.pondTrailRippleCount));
      this.writeDataset('prayerWheelParticles', String(this.prayerWheelParticleBursts));
      this.writeDataset('playerX', this.playerPos.x.toFixed(1));
      this.writeDataset('playerZ', this.playerPos.z.toFixed(1));
      this.writeDataset('distanceWalked', String(Math.round(this.distanceWalked)));
      this.writeDataset('cameraMode', this.cameraMode);
    }
  }

  private startLoop(): void {
    const tick = () => {
      if (this.disposed) return;
      if (this.isSoftwareGl && this.gameState === 'paused') {
        this.isTimeoutFrame = true;
        this.frameId = window.setTimeout(tick, 240);
        return;
      }
      const now = performance.now();
      const rawDt = (now - this.lastFrameMs) / 1000;
      this.lastFrameMs = now;
      const elapsed = (now - this.startTimeMs) / 1000;

      if (this.isSoftwareGl) {
        const clamped = Math.min(Math.max(rawDt, 0.016), 0.2);
        const subSteps = Math.max(1, Math.min(4, Math.ceil(clamped / 0.05)));
        const subDt = clamped / subSteps;
        for (let s = 0; s < subSteps; s++) {
          this.updateSimulation(subDt, elapsed);
        }
      } else {
        const dt = Math.min(Math.max(rawDt, 0.001), 0.05);
        this.updateSimulation(dt, elapsed);
      }
      this.renderScene();

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.isTimeoutFrame = false;
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.isTimeoutFrame = true;
      this.frameId = window.setTimeout(tick, 900);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.isTimeoutFrame = true;
      this.frameId = window.setTimeout(cb, 320);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.isTimeoutFrame = true;
        this.frameId = window.setTimeout(poll, 16);
      } else {
        if (sync) gl.deleteSync(sync);
        this.isTimeoutFrame = true;
        this.frameId = window.setTimeout(cb, 320);
      }
    };
    this.isTimeoutFrame = true;
    this.frameId = window.setTimeout(poll, 16);
  }

  private updateAtmosphereParticles(dt: number, elapsed: number): void {
    const hour = getPresetHour(this.timePreset);
    const target = computeAtmosphereParticleProfile(this.weather, hour);
    const blend = 1 - Math.exp(-8.0 * dt);
    const cur = this.currentParticleState;

    cur.activeRatio += (target.activeRatio - cur.activeRatio) * blend;
    cur.opacity += (target.opacity - cur.opacity) * blend;
    cur.particleSize += (target.particleSize - cur.particleSize) * blend;
    cur.fallSpeed += (target.fallSpeed - cur.fallSpeed) * blend;
    cur.windDriftX += (target.windDriftX - cur.windDriftX) * blend;
    cur.windDriftZ += (target.windDriftZ - cur.windDriftZ) * blend;
    cur.turbulence += (target.turbulence - cur.turbulence) * blend;
    cur.streakStretch += (target.streakStretch - cur.streakStretch) * blend;
    cur.glowStrength += (target.glowStrength - cur.glowStrength) * blend;

    const wrap = (val: number, max: number) => ((val % max) + max) % max;
    this.atmosphereDrift.x = wrap(this.atmosphereDrift.x + cur.windDriftX * dt, ATMOSPHERE_BOX_SIZE.x);
    this.atmosphereDrift.y = wrap(this.atmosphereDrift.y - cur.fallSpeed * dt, ATMOSPHERE_BOX_SIZE.y);
    this.atmosphereDrift.z = wrap(this.atmosphereDrift.z + cur.windDriftZ * dt, ATMOSPHERE_BOX_SIZE.z);

    const anchor = this.gameState === 'title' ? this.currentLookAt : this.playerPos;
    const u = this.atmosphereMat.uniforms;
    u.uTime.value = elapsed;
    u.uCenter.value.copy(anchor);
    u.uDrift.value.copy(this.atmosphereDrift);
    u.uActiveFraction.value = cur.activeRatio;
    u.uTurbulence.value = cur.turbulence;
    u.uBaseSize.value = cur.particleSize;
    u.uOpacity.value = cur.opacity;
    u.uStreak.value = cur.streakStretch;
    u.uGlow.value = cur.glowStrength;
    _targetColor.set(target.colorHex);
    (u.uColor.value as THREE.Color).lerp(_targetColor, blend);
  }

  private updateSimulation(dt: number, elapsed: number): void {
    const targetRainIntensity = this.weather === 'rain' ? 1.0 : this.weather === 'mist' ? 0.14 : 0.0;
    this.pondRainIntensity += (targetRainIntensity - this.pondRainIntensity) * (1 - Math.exp(-4.0 * dt));
    this.syncLighting(elapsed);

    const simAnchor = this.gameState === 'title' ? this.currentLookAt : this.playerPos;
    const simX = simAnchor.x;
    const simZ = simAnchor.z;

    this.riverController.update(elapsed);
    if (isWithinSleepDistanceSq(simX, simZ, GLACIAL_LAKE.x, GLACIAL_LAKE.z, 10000)) {
      this.glacialLakeController?.update(elapsed);
    }
    if (isWithinSleepDistanceSq(simX, simZ, -268, 100, 14400)) {
      this.peaceParklandController?.update(elapsed);
    }
    this.treeBumpStrength *= Math.exp(-5.5 * dt);
    this.foliageController.update(elapsed, this.treeBumpPos, this.treeBumpStrength);

    // Pick up to 6 closest/active props to bend grass blades dynamically
    let interactorCount = 0;
    for (let i = 0; i < this.interactiveProps.length && interactorCount < 6; i++) {
      const p = this.interactiveProps[i];
      const dx = p.x - this.playerPos.x;
      const dz = p.z - this.playerPos.z;
      if (dx * dx + dz * dz < 900) {
        this.grassInteractors[interactorCount].x = p.x;
        this.grassInteractors[interactorCount].y = p.y;
        this.grassInteractors[interactorCount].z = p.z;
        this.grassInteractors[interactorCount].r = p.radius * 1.45;
        interactorCount++;
      }
    }
    for (let k = interactorCount; k < 6; k++) {
      this.grassInteractors[k].r = 0;
    }

    const activePlayerSpeed = Math.hypot(this.playerVx, this.playerVz);
    const meadowInfo = getMeadowZoneAt(this.playerPos.x, this.playerPos.z);
    const targetMeadowDisp =
      this.gameState === 'playing' && meadowInfo.inMeadow && this.isGrounded
        ? meadowInfo.factor * Math.min(1.25, activePlayerSpeed / 7.2)
        : 0;
    const meadowDamp =
      targetMeadowDisp > this.meadowDisplacementStrength
        ? 1 - Math.exp(-9.0 * dt)
        : 1 - Math.exp(-3.2 * dt);
    this.meadowDisplacementStrength +=
      (targetMeadowDisp - this.meadowDisplacementStrength) * meadowDamp;
    this.playerMoveUniformVec.set(this.playerVx, this.playerVz, activePlayerSpeed);

    this.grassController.update(
      elapsed,
      this.playerPos,
      this.grassInteractors,
      this.playerMoveUniformVec,
      this.meadowDisplacementStrength,
    );
    this.cloudController.update(elapsed);

    const weatherAnchor = this.gameState === 'title' ? this.currentLookAt : this.playerPos;
    this.weatherParticles?.update(
      dt,
      elapsed,
      this.weather,
      weatherAnchor,
      this.getPixelScale(),
      this.birdEnvState.sunColorHex,
    );
    this.updateAtmosphereParticles(dt, elapsed);
    this.updateFootstepParticles(dt);
    this.updateFootprintDecals(dt);
    this.updateMeditationButterflies(dt, elapsed);
    this.updateWorldBurstParticles(dt);
    if (this.sakuraPetalsMat) {
      this.sakuraPetalsMat.uniforms.uTime.value = elapsed;
    }

    const ambienceMix = computeSpatialAmbienceMix(
      this.playerPos.x,
      this.playerPos.z,
      this.playerPos.y,
    );
    this.camera.getWorldDirection(_camForward);
    this.listenerPoseScratch.x = this.playerPos.x;
    this.listenerPoseScratch.y = this.playerPos.y + 1.6;
    this.listenerPoseScratch.z = this.playerPos.z;
    this.listenerPoseScratch.forwardX = _camForward.x;
    this.listenerPoseScratch.forwardY = _camForward.y;
    this.listenerPoseScratch.forwardZ = _camForward.z;
    soundEngine.updateAmbience(
      ambienceMix,
      dt,
      this.lumbiniPreset,
      this.weather,
      this.listenerPoseScratch,
      getPresetHour(this.timePreset),
    );

    if (this.gameState === 'playing' && !this.focusedLandmark) {
      const approachMatch = findFirstUnexploredLandmarkApproach(
        this.playerPos.x,
        this.playerPos.z,
        this.discoveredLandmarkIds,
        this.cuedLandmarkIds,
      );
      if (approachMatch && soundEngine.isEnabled()) {
        const lm = approachMatch.landmark;
        const played = soundEngine.playLandmarkApproachCue(
          lm.id,
          {
            x: lm.position.x,
            y: groundHeightAt(lm.position.x, lm.position.z) + 2.4,
            z: lm.position.z,
          },
          approachMatch.cueRadius,
          this.listenerPoseScratch,
        );
        if (played) {
          this.cuedLandmarkIds.add(lm.id);
          this.lastApproachCueLandmarkId = lm.id;
          this.approachCueCount++;
          this.writeDataset('lastApproachCueLandmark', lm.id);
          this.writeDataset('approachCueCount', String(this.approachCueCount));
        }
      }
    }
    const leafBurst = soundEngine.consumeTriggeredLeafBurst();
    if (
      leafBurst &&
      Math.hypot(leafBurst.x - this.playerPos.x, leafBurst.z - this.playerPos.z) < 28
    ) {
      for (let k = 0; k < 3; k++) {
        const ang = Math.random() * Math.PI * 2;
        const rad = 0.6 + Math.random() * 1.9;
        this.pushBurstParticle(
          leafBurst.x + Math.cos(ang) * rad,
          leafBurst.y - 0.5 + (Math.random() - 0.5) * 0.8,
          leafBurst.z + Math.sin(ang) * rad,
          (Math.random() - 0.5) * 0.55,
          -0.25 - Math.random() * 0.25,
          (Math.random() - 0.5) * 0.55,
          0.32 + Math.random() * 0.14,
          0.62 + Math.random() * 0.14,
          0.26 + Math.random() * 0.08,
          24 + Math.random() * 10,
          1.45 + Math.random() * 0.7,
          2,
        );
      }
    }
    const surfaceKind = getFootstepSurfaceKind(this.playerPos.x, this.playerPos.z);
    if (
      this.renderer?.domElement &&
      (this.lastSimDatasetFlushAt < 0 || elapsed - this.lastSimDatasetFlushAt >= 0.25)
    ) {
      this.lastSimDatasetFlushAt = elapsed;
      const lumbiniSpatial = soundEngine.getLumbiniSpatialStatus();
      const forestBirdStatus = soundEngine.getForestBirdStatus();
      const cricketStatus = soundEngine.getLumbiniCricketStatus();
      const lumbiniAudio = computeLumbiniAudioProfile(ambienceMix, this.lumbiniPreset, this.weather);
      this.writeDataset('ambienceZone', ambienceMix.activeZone);
      this.writeDataset('surfaceKind', surfaceKind);
      this.writeDataset('forestLevel', ambienceMix.forestLevel.toFixed(2));
      this.writeDataset('rustleLevel', ambienceMix.rustleLevel.toFixed(2));
      this.writeDataset('chimeActivity', lumbiniAudio.chimeActivity.toFixed(2));
      this.writeDataset('bowlActivity', lumbiniAudio.bowlActivity.toFixed(2));
      this.writeDataset('flagFlutter', lumbiniAudio.flagFlutterLevel.toFixed(2));
      this.writeDataset('lumbiniSpatialAudio', lumbiniSpatial.inZone ? 'true' : 'false');
      this.writeDataset(
        'lumbiniBirdEmitter',
        lumbiniSpatial.lastBirdEmitterId ?? lumbiniSpatial.nearestBirdEmitterId ?? 'none',
      );
      this.writeDataset(
        'lumbiniRustleEmitter',
        lumbiniSpatial.lastRustleEmitterId ?? lumbiniSpatial.nearestRustleEmitterId ?? 'none',
      );
      this.writeDataset('lumbiniBirdEvents', String(lumbiniSpatial.birdEventCount));
      this.writeDataset('lumbiniRustleEvents', String(lumbiniSpatial.rustleEventCount));
      this.writeDataset('forestBirdInZone', forestBirdStatus.inForest ? 'true' : 'false');
      this.writeDataset('forestBirdEvents', String(forestBirdStatus.eventCount));
      this.writeDataset(
        'lastForestBirdEmitter',
        forestBirdStatus.lastEmitterId ?? forestBirdStatus.nearestEmitterId ?? 'none',
      );
      this.writeDataset('cricketInZone', cricketStatus.inZone ? 'true' : 'false');
      this.writeDataset('cricketActivity', cricketStatus.cricketActivity.toFixed(2));
      this.writeDataset('cricketEvents', String(cricketStatus.eventCount));
      this.writeDataset(
        'lastCricketEmitter',
        cricketStatus.lastEmitterId ?? cricketStatus.nearestEmitterId ?? 'none',
      );
      this.writeDataset('inMeadow', meadowInfo.inMeadow ? 'true' : 'false');
      this.writeDataset('meadowZone', meadowInfo.zoneId ?? 'none');
      this.writeDataset('meadowDisp', this.meadowDisplacementStrength.toFixed(2));
      this.writeDataset('waterEdgeRipples', String(this.waterEdgeRippleCount));
      this.writeDataset('lastWaterRippleBody', this.lastWaterRippleBody);
      this.writeDataset(
        'pondProximityRipple',
        REFLECTIVE_WATER_ENV_UNIFORMS.uPlayerPondProximity.value.toFixed(2),
      );
      this.writeDataset('prayerWheelSpins', String(this.prayerWheelSpinsCount));
      this.writeDataset('prayerWheelParticles', String(this.prayerWheelParticleBursts));
      this.writeDataset('pebbleTosses', String(this.pebbleTossesCount));
      this.writeDataset('cameraMode', this.cameraMode);
      this.writeDataset('graphicsQuality', this.graphicsQuality);
      this.writeDataset('meditating', this.isMeditating ? 'true' : 'false');
    }

    const horizSpeed = Math.hypot(this.playerVx, this.playerVz);
    const curWater = this.getWaterSurfaceAt(this.playerPos.x, this.playerPos.z);
    const playerInWaterNow = curWater.inWater && this.playerPos.y < curWater.surfaceY + 0.45;
    const pondProximity = playerInWaterNow
      ? computeLumbiniPondProximityState(this.playerPos.x, this.playerPos.z, horizSpeed)
      : { active: false, factor: 0, anchorX: this.playerPos.x, anchorZ: this.playerPos.z, nearestPond: 'none' as const };
    const proxBlend = 1 - Math.exp(-8 * dt);
    REFLECTIVE_WATER_ENV_UNIFORMS.uPlayerPondProximity.value = THREE.MathUtils.lerp(
      REFLECTIVE_WATER_ENV_UNIFORMS.uPlayerPondProximity.value,
      pondProximity.factor,
      proxBlend,
    );
    REFLECTIVE_WATER_ENV_UNIFORMS.uPlayerWaterSpeed.value = THREE.MathUtils.lerp(
      REFLECTIVE_WATER_ENV_UNIFORMS.uPlayerWaterSpeed.value,
      playerInWaterNow ? horizSpeed : 0,
      proxBlend,
    );
    if (pondProximity.active) {
      REFLECTIVE_WATER_ENV_UNIFORMS.uPlayerWaterPos.value.set(
        THREE.MathUtils.lerp(REFLECTIVE_WATER_ENV_UNIFORMS.uPlayerWaterPos.value.x, pondProximity.anchorX, 0.38),
        0.14,
        THREE.MathUtils.lerp(REFLECTIVE_WATER_ENV_UNIFORMS.uPlayerWaterPos.value.z, pondProximity.anchorZ, 0.38),
      );
    }

    for (let i = 0; i < this.animatedLandmarkNodes.length; i++) {
      const anchor = this.animatedNodeAnchors[i];
      if (
        anchor &&
        !anchor.isGlobal &&
        !isWithinSleepDistanceSq(anchor.x, anchor.z, simX, simZ, 8100)
      ) {
        continue;
      }
      const node = this.animatedLandmarkNodes[i];
      if (
        typeof node.userData.onFlickerUpdate !== 'function' &&
        typeof node.userData.onEnvironmentUpdate !== 'function' &&
        !node.userData.noSpin
      ) {
        node.rotation.y += dt * (0.7 + (i % 3) * 0.2);
      }
    }

    for (let i = 0; i < this.prayerWheelEntries.length; i++) {
      const wheel = this.prayerWheelEntries[i];
      const nearWheel = isWithinSleepDistanceSq(
        wheel.worldPos.x,
        wheel.worldPos.z,
        simX,
        simZ,
        8100,
      );
      if (!nearWheel && wheel.velocity <= 0.25) {
        wheel.velocity = 0;
        continue;
      }
      let impulse = 0;
      if (this.gameState === 'playing' && elapsed >= wheel.cooldownUntil && nearWheel) {
        const d = Math.hypot(wheel.worldPos.x - this.playerPos.x, wheel.worldPos.z - this.playerPos.z);
        if (d < 2.15 && horizSpeed > 0.35) {
          impulse = 14.5;
          wheel.cooldownUntil = elapsed + 1.1;
          this.prayerWheelSpinsCount += 1;
          this.spawnPrayerWheelParticles(wheel.worldPos.x, wheel.worldPos.y + 0.15, wheel.worldPos.z, 0.95);
          soundEngine.playPrayerWheelSpin();
        }
      }
      const nextSpin = stepPrayerWheelSpin(wheel.angle, wheel.velocity, dt, impulse);
      wheel.angle = nextSpin.angle;
      wheel.velocity = nextSpin.velocity;
      wheel.mesh.rotation.y = wheel.angle;
      if (wheel.velocity > 3.6 && Math.random() < dt * 7.5) {
        const ang = Math.random() * Math.PI * 2;
        const rad = 0.26 + Math.random() * 0.18;
        this.pushBurstParticle(
          wheel.worldPos.x + Math.cos(ang) * rad,
          wheel.worldPos.y + (Math.random() - 0.5) * 0.36,
          wheel.worldPos.z + Math.sin(ang) * rad,
          -Math.sin(ang) * 0.42,
          0.45 + Math.random() * 0.55,
          Math.cos(ang) * 0.42,
          0.98,
          0.84,
          0.36,
          20 + Math.random() * 12,
          0.62 + Math.random() * 0.35,
          1,
        );
      }
    }

    let litLightSum = 0;
    let litCountForEmber = 0;
    for (let i = 0; i < this.butterLampEntries.length; i++) {
      const lamp = this.butterLampEntries[i];
      if (!lamp.isLit) continue;
      litCountForEmber++;
      const fState = computeButterLampFlameState(elapsed, lamp.litAtElapsed, lamp.lampIndex + 1.37);
      lamp.flameGroup.visible = fState.scaleY > 0.01;
      lamp.flameGroup.scale.set(fState.scaleX, fState.scaleY, fState.scaleX);
      const haloMat = lamp.haloMesh.material as THREE.MeshBasicMaterial;
      haloMat.opacity = fState.haloOpacity;
      lamp.haloMesh.scale.setScalar(fState.haloScale);
      litLightSum += fState.lightIntensity;
    }
    if (this.babyRitualLampLight) {
      this.babyRitualLampLight.intensity = litCountForEmber > 0 ? Math.min(3.6, litLightSum * 0.55) : 0;
    }
    if (litCountForEmber > 0) {
      this.ritualEmberAccum += dt * Math.min(8.5, 1.8 + litCountForEmber * 0.75);
      while (this.ritualEmberAccum >= 1) {
        this.ritualEmberAccum -= 1;
        const targetIdx = Math.floor(Math.random() * litCountForEmber);
        let seenLit = 0;
        let chosen: ButterLampEntry | undefined;
        for (let k = 0; k < this.butterLampEntries.length; k++) {
          const cand = this.butterLampEntries[k];
          if (cand.isLit) {
            if (seenLit === targetIdx) {
              chosen = cand;
              break;
            }
            seenLit++;
          }
        }
        if (chosen) {
          const ang = Math.random() * Math.PI * 2;
          this.pushBurstParticle(
            chosen.worldPos.x + Math.cos(ang) * 0.04,
            chosen.worldPos.y + 0.06,
            chosen.worldPos.z + Math.sin(ang) * 0.04,
            Math.cos(ang) * 0.14 + this.birdEnvState.windX * 0.25,
            0.55 + Math.random() * 0.55,
            Math.sin(ang) * 0.14 + this.birdEnvState.windZ * 0.25,
            1.0,
            0.82,
            0.34,
            15 + Math.random() * 10,
            0.78 + Math.random() * 0.45,
            1,
          );
        }
      }
    }

    for (let i = this.activeTossedPebbles.length - 1; i >= 0; i--) {
      const p = this.activeTossedPebbles[i];
      p.progress += dt / p.duration;
      if (p.progress >= 1) {
        triggerWaterRipple(p.targetPos.x, p.targetPos.z, elapsed, 1.48);
        this.spawnWaterSplash(p.targetPos.x, p.pondY + 0.04, p.targetPos.z, 1.15);
        soundEngine.playWaterSplash(0.9);
        this.waterEdgeRippleCount += 1;
        this.lastWaterRippleBody = 'pebble-toss';
        this.scene.remove(p.mesh);
        this.activeTossedPebbles.splice(i, 1);
      } else {
        const t = p.progress;
        p.mesh.position.lerpVectors(p.startPos, p.targetPos, t);
        p.mesh.position.y += Math.sin(t * Math.PI) * 2.15;
        p.mesh.rotation.x += dt * 9.0;
        p.mesh.rotation.z += dt * 7.5;
      }
    }
    for (let i = 0; i < this.templeBellEntries.length; i++) {
      const entry = this.templeBellEntries[i];
      const age = elapsed - entry.ringStart;
      const ringing = age >= 0 && age < entry.ringDuration;
      const nearBell = isWithinSleepDistanceSq(
        entry.worldPos.x,
        entry.worldPos.z,
        simX,
        simZ,
        8100,
      );
      if (!ringing && !nearBell) continue;
      if (
        nearBell &&
        this.gameState === 'playing' &&
        elapsed >= entry.cooldownUntil &&
        Math.abs(entry.worldPos.y - this.playerPos.y) < 5.2
      ) {
        const bellDist = Math.hypot(
          entry.worldPos.x - this.playerPos.x,
          entry.worldPos.z - this.playerPos.z,
        );
        if (bellDist < 2.65) {
          this.triggerTempleBell(entry, elapsed, 0.92, bellDist);
        }
      }
      if (ringing) {
        const decay = Math.exp(-1.35 * age);
        const theta = entry.amplitude * decay * Math.sin(8.8 * age);
        entry.swingPivot.rotation.x = theta;
        if (entry.clapperPivot) {
          entry.clapperPivot.rotation.x =
            -theta * 0.45 + 0.14 * decay * Math.sin(8.8 * age - 0.65);
        }
      } else {
        entry.swingPivot.rotation.x = 0;
        if (entry.clapperPivot) entry.clapperPivot.rotation.x = 0;
      }
    }
    for (let i = 0; i < this.prayerFlags.length; i++) {
      const f = this.prayerFlags[i];
      if (typeof f.userData.prayerFlagMode !== 'string') {
        f.rotation.x = Math.sin(elapsed * 3.1 + i * 0.7) * 0.22;
      }
    }

    this.character.companionLantern.position.set(
      Math.cos(elapsed * 1.4) * 0.95,
      2.15 + Math.sin(elapsed * 2.3) * 0.16,
      Math.sin(elapsed * 1.4) * 0.85,
    );
    this.character.companionLantern.rotation.y = elapsed * 1.6;

    // Step 3D rigid-body-feel interactive props: player impulses, prop stacking,
    // quaternion tumbling, tree collisions, water buoyancy & ripple splashes.
    let playerPropSupportY = -999;
    this.maxMovingPropSpeed = 0;
    const playerSpeed = Math.hypot(this.playerVx, this.playerVz);

    for (let i = 0; i < this.interactiveProps.length; i++) {
      const prop = this.interactiveProps[i];
      if (prop.splashCooldown > 0) prop.splashCooldown = Math.max(0, prop.splashCooldown - dt);
      if (this.propSoundCooldowns[i] > 0) {
        this.propSoundCooldowns[i] = Math.max(0, this.propSoundCooldowns[i] - dt);
      }

      const dx = prop.x - this.playerPos.x;
      const dz = prop.z - this.playerPos.z;
      const dist = Math.hypot(dx, dz);
      const propTop = prop.y + prop.halfHeight * 2;

      if (this.gameState === 'playing') {
        if (
          dist < prop.radius + 0.36 &&
          this.playerPos.y >= prop.y + prop.halfHeight * 1.1 &&
          this.playerPos.y <= propTop + 0.35 &&
          this.playerVelY <= 0.6
        ) {
          // Player lands or steps onto prop top
          if (prop.kind === 'ball') {
            this.playerVelY = 6.4;
            this.isGrounded = false;
            this.squashScaleY = 1.24;
            prop.vy = Math.min(prop.vy, -1.8);
            if (this.propSoundCooldowns[i] <= 0) {
              soundEngine.playPropImpact('ball', 0.95);
              this.propSoundCooldowns[i] = 0.22;
            }
          } else {
            playerPropSupportY = Math.max(playerPropSupportY, propTop);
          }
        } else if (
          dist < prop.radius + 0.54 &&
          dist > 0.001 &&
          this.playerPos.y < propTop - 0.08 &&
          this.playerPos.y + 1.65 > prop.y
        ) {
          // Sideways momentum transfer + torque kick
          const nx = dx / dist;
          const nz = dz / dist;
          const pushSpeed = Math.max(5.2, playerSpeed * 0.88) / Math.sqrt(prop.mass);
          prop.vx = nx * pushSpeed + this.playerVx * 0.28;
          prop.vz = nz * pushSpeed + this.playerVz * 0.28;
          prop.vy = Math.max(prop.vy, (prop.kind === 'ball' ? 4.5 : 2.35) / Math.sqrt(prop.mass));
          prop.angVel.x += nz * pushSpeed * 2.1;
          prop.angVel.z -= nx * pushSpeed * 2.1;
          prop.angVel.y += (Math.random() - 0.5) * 3.5;

          const overlapPush = prop.radius + 0.54 - dist;
          prop.x += nx * overlapPush * 0.65;
          prop.z += nz * overlapPush * 0.65;

          if (this.propSoundCooldowns[i] <= 0) {
            const sKind = prop.kind === 'barrel' ? 'crate' : prop.kind;
            soundEngine.playPropImpact(sKind, Math.min(1, 0.5 + playerSpeed * 0.05));
            this.spawnImpactDust(prop.x, prop.y, prop.z, 0.75);
            this.propSoundCooldowns[i] = 0.2;
          }
        }
      }

      // 3D Prop-to-prop collisions & stack support
      for (let j = i + 1; j < this.interactiveProps.length; j++) {
        const other = this.interactiveProps[j];
        const pdx = other.x - prop.x;
        const pdz = other.z - prop.z;
        const pdist = Math.hypot(pdx, pdz);
        const minSep = (prop.radius + other.radius) * 0.88;
        if (pdist >= minSep) continue;

        const pTop = prop.y + prop.halfHeight * 2;
        const oTop = other.y + other.halfHeight * 2;

        // Vertical stack resting check
        if (pdist < minSep * 0.92 && Math.abs(other.y - pTop) < 0.14 && other.vy <= 0.35) {
          other.y = pTop;
          other.vy = Math.max(0, other.vy);
          continue;
        }
        if (pdist < minSep * 0.92 && Math.abs(prop.y - oTop) < 0.14 && prop.vy <= 0.35) {
          prop.y = oTop;
          prop.vy = Math.max(0, prop.vy);
          continue;
        }

        // Overlapping vertically as well -> 3D impulse resolution
        if (prop.y < oTop - 0.05 && pTop > other.y + 0.05 && pdist > 0.001) {
          const nx = pdx / pdist;
          const nz = pdz / pdist;
          const overlap = minSep - pdist;
          const totalMass = prop.mass + other.mass;
          const w1 = other.mass / totalMass;
          const w2 = prop.mass / totalMass;

          prop.x -= nx * overlap * w1;
          prop.z -= nz * overlap * w1;
          other.x += nx * overlap * w2;
          other.z += nz * overlap * w2;

          const rvx = other.vx - prop.vx;
          const rvz = other.vz - prop.vz;
          const vn = rvx * nx + rvz * nz;
          if (vn < 0) {
            const e = Math.max(prop.restitution, other.restitution);
            const jImp = (-(1 + e) * vn) / (1 / prop.mass + 1 / other.mass);
            prop.vx -= (jImp / prop.mass) * nx;
            prop.vz -= (jImp / prop.mass) * nz;
            other.vx += (jImp / other.mass) * nx;
            other.vz += (jImp / other.mass) * nz;

            const impactSpeed = Math.abs(vn);
            if (impactSpeed > 1.2) {
              other.vy = Math.max(other.vy, Math.min(3.5, impactSpeed * 0.38));
              prop.vy = Math.max(prop.vy, Math.min(2.6, impactSpeed * 0.25));
              other.angVel.x += nz * impactSpeed * 1.8;
              other.angVel.z -= nx * impactSpeed * 1.8;
              prop.angVel.x -= nz * impactSpeed * 1.3;
              prop.angVel.z += nx * impactSpeed * 1.3;
              if (this.propSoundCooldowns[i] <= 0) {
                const sKind = other.kind === 'barrel' ? 'crate' : other.kind;
                soundEngine.playPropImpact(sKind, Math.min(1, impactSpeed * 0.16));
                this.spawnImpactDust((prop.x + other.x) * 0.5, (prop.y + other.y) * 0.5, (prop.z + other.z) * 0.5, 0.55);
                this.propSoundCooldowns[i] = 0.2;
              }
            }
          }
        }
      }

      // Compute exact center floor support (BVH terrain/plinth + lower stacked props) so props never hover on slopes
      const bvhCenterFloor = this.physicsWorld.sampleFloorHeight(
        prop.x,
        prop.z,
        prop.y + 0.45,
      );
      let surfaceFloor =
        bvhCenterFloor !== null ? bvhCenterFloor : getSurfaceHeightAt(prop.x, prop.z);

      for (let j = 0; j < this.interactiveProps.length; j++) {
        if (i === j) continue;
        const lower = this.interactiveProps[j];
        const lowerTop = lower.y + lower.halfHeight * 2;
        if (lowerTop <= prop.y + 0.14) {
          const d = Math.hypot(prop.x - lower.x, prop.z - lower.z);
          if (d < (prop.radius + lower.radius) * 0.74) {
            surfaceFloor = Math.max(surfaceFloor, lowerTop);
          }
        }
      }

      const water = this.getWaterSurfaceAt(prop.x, prop.z);
      const isSubmerged = water.inWater && prop.y < water.surfaceY + 0.25;
      const angSpeedSq = prop.angVel.lengthSq();
      const isMoving =
        Math.abs(prop.vx) > 0.02 ||
        Math.abs(prop.vz) > 0.02 ||
        Math.abs(prop.vy) > 0.02 ||
        Math.abs(prop.y - surfaceFloor) > 0.015 ||
        angSpeedSq > 0.002 ||
        isSubmerged;

      if (isMoving) {
        const nextX = prop.x + prop.vx * dt;
        const nextZ = prop.z + prop.vz * dt;
        const propSpeed = Math.hypot(prop.vx, prop.vz);
        this.maxMovingPropSpeed = Math.max(this.maxMovingPropSpeed, propSpeed, Math.abs(prop.vy));

        // Allow buoyant props to slide/roll smoothly into river & lake basins instead of bouncing off walkable shore boundary
        const nextWater = this.getWaterSurfaceAt(nextX, nextZ);
        if (nextWater.inWater || water.inWater) {
          prop.x = nextX;
          prop.z = nextZ;
        } else {
          const clampedProp = clampToWalkable(prop.x, prop.z, nextX, nextZ);
          const bvhProp = this.physicsWorld.resolveHorizontalCollision(
            prop.x,
            prop.z,
            clampedProp.x,
            clampedProp.z,
            prop.y,
            prop.halfHeight * 2,
            prop.radius,
            0.16,
          );
          if (bvhProp.collided) {
            const vn = prop.vx * bvhProp.hitNormalX + prop.vz * bvhProp.hitNormalZ;
            if (vn < 0) {
              prop.vx = (prop.vx - (1 + prop.restitution) * vn * bvhProp.hitNormalX) * 0.8;
              prop.vz = (prop.vz - (1 + prop.restitution) * vn * bvhProp.hitNormalZ) * 0.8;
            } else {
              prop.vx *= -0.45;
              prop.vz *= -0.45;
            }
          } else {
            if (Math.abs(clampedProp.x - nextX) > 0.002) prop.vx *= -0.5;
            if (Math.abs(clampedProp.z - nextZ) > 0.002) prop.vz *= -0.5;
          }
          prop.x = bvhProp.x;
          prop.z = bvhProp.z;
        }

        // Prop-vs-tree trunk bounce & foliage shake
        if (propSpeed > 0.25) {
          for (let tIdx = 0; tIdx < this.treeSpots.length; tIdx++) {
            const tr = this.treeSpots[tIdx];
            const tdx = prop.x - tr.x;
            const tdz = prop.z - tr.z;
            const minTr = prop.radius + 0.56 * tr.scale;
            if (tdx * tdx + tdz * tdz < minTr * minTr) {
              const td = Math.hypot(tdx, tdz) || 0.001;
              const tnx = tdx / td;
              const tnz = tdz / td;
              prop.x = tr.x + tnx * minTr;
              prop.z = tr.z + tnz * minTr;
              const vn = prop.vx * tnx + prop.vz * tnz;
              if (vn < 0) {
                prop.vx -= (1 + prop.restitution) * vn * tnx;
                prop.vz -= (1 + prop.restitution) * vn * tnz;
              }
              if (propSpeed > 1.7 && elapsed - this.lastTreeShakeAt > 0.35) {
                this.shakeTreeAt(tr.x, groundHeightAt(tr.x, tr.z), tr.z, tr.type, elapsed);
              }
              break;
            }
          }
        }

        // Water buoyancy, ripples, splashes & river current
        if (water.inWater && prop.y < water.surfaceY + 0.25) {
          if (!prop.inWater) {
            prop.inWater = true;
            const splashStr = Math.min(1.8, 0.65 + Math.hypot(prop.vx, prop.vy, prop.vz) * 0.14);
            triggerWaterRipple(prop.x, prop.z, elapsed, splashStr);
            this.spawnWaterSplash(prop.x, water.surfaceY + 0.04, prop.z, splashStr);
            soundEngine.playWaterSplash(Math.min(1.0, 0.45 + splashStr * 0.28));
            prop.splashCooldown = 0.45;
          } else if (prop.splashCooldown <= 0 && Math.hypot(prop.vx, prop.vz) > 0.55) {
            triggerWaterRipple(prop.x, prop.z, elapsed, 0.72);
            prop.splashCooldown = 0.52;
          }

          if (prop.buoyancy > 0) {
            const floatTargetY =
              water.surfaceY -
              prop.halfHeight * (1.05 - Math.min(0.6, prop.buoyancy * 0.35)) +
              Math.sin(elapsed * 2.5 + i * 1.3) * 0.045;
            const subDepth = floatTargetY - prop.y;
            prop.vy += (subDepth * 26.0 - prop.vy * 4.2) * dt;
            prop.vx += (water.flowX - prop.vx) * (1.8 * dt);
            prop.vz += (water.flowZ - prop.vz) * (1.8 * dt);
            prop.angVel.multiplyScalar(Math.exp(-2.2 * dt));
            prop.angVel.x += Math.sin(elapsed * 2.1 + i) * 0.45 * dt;
            prop.angVel.z += Math.cos(elapsed * 1.9 + i) * 0.45 * dt;
          } else {
            prop.vx *= Math.exp(-5.4 * dt);
            prop.vz *= Math.exp(-5.4 * dt);
            prop.vy -= 12 * dt;
          }
          prop.y += prop.vy * dt;
        } else {
          if (prop.inWater && prop.y > water.surfaceY + 0.45) {
            prop.inWater = false;
          }
          const drag = prop.shape === 'sphere' ? 1.45 : prop.kind === 'barrel' ? 2.4 : 4.1;
          prop.vx *= Math.exp(-drag * dt);
          prop.vz *= Math.exp(-drag * dt);
          prop.vy -= 18 * dt;
          prop.y += prop.vy * dt;
        }

        // Floor bounce & rolling / upright settling
        if (prop.y <= surfaceFloor) {
          prop.y = surfaceFloor;
          if (prop.vy < -1.25) {
            prop.vy = -prop.vy * prop.restitution;
            if (this.propSoundCooldowns[i] <= 0 && Math.abs(prop.vy) > 1.1) {
              const sKind = prop.kind === 'barrel' ? 'crate' : prop.kind;
              soundEngine.playPropImpact(sKind, Math.min(0.9, Math.abs(prop.vy) * 0.2));
              this.propSoundCooldowns[i] = 0.16;
            }
          } else {
            prop.vy = 0;
          }

          if (prop.shape === 'sphere') {
            prop.angVel.x = prop.vz / prop.halfHeight;
            prop.angVel.z = -prop.vx / prop.halfHeight;
            prop.angVel.y *= Math.exp(-3.0 * dt);
          } else {
            prop.angVel.multiplyScalar(Math.exp(-5.5 * dt));
          }
        }

        // Integrate 3D quaternion orientation
        const omega = prop.angVel.length();
        if (omega > 0.0005) {
          _axisVec.copy(prop.angVel).divideScalar(omega);
          _deltaQuat.setFromAxisAngle(_axisVec, omega * dt);
          prop.quat.premultiply(_deltaQuat).normalize();
        }

        // Gently settle box / upright cylinder faces flush when grounded and nearly stopped
        if (
          prop.y <= surfaceFloor + 0.02 &&
          !prop.inWater &&
          prop.shape !== 'sphere' &&
          omega < 2.2
        ) {
          _mat4.makeRotationFromQuaternion(prop.quat);
          const me = _mat4.elements;
          if (prop.kind === 'pot' || prop.kind === 'cairn') {
            // Keep vessels/cairns upright
            _localAxis.set(me[4], me[5], me[6]).normalize();
            _snapAxis.crossVectors(_localAxis, _upVec);
            const sinA = _snapAxis.length();
            if (sinA > 0.002) {
              _snapAxis.divideScalar(sinA);
              const ang = Math.asin(Math.min(1, sinA));
              _snapQuat.setFromAxisAngle(_snapAxis, ang * Math.min(1, 9.5 * dt));
              prop.quat.premultiply(_snapQuat).normalize();
            }
          } else {
            // Snap nearest cube/barrel/block face axis to world up without array allocation
            let bestDot = me[1];
            _bestLocalAxis.set(me[0], me[1], me[2]);
            if (-me[1] > bestDot) {
              bestDot = -me[1];
              _bestLocalAxis.set(-me[0], -me[1], -me[2]);
            }
            if (me[5] > bestDot) {
              bestDot = me[5];
              _bestLocalAxis.set(me[4], me[5], me[6]);
            }
            if (-me[5] > bestDot) {
              bestDot = -me[5];
              _bestLocalAxis.set(-me[4], -me[5], -me[6]);
            }
            if (me[9] > bestDot) {
              bestDot = me[9];
              _bestLocalAxis.set(me[8], me[9], me[10]);
            }
            if (-me[9] > bestDot) {
              _bestLocalAxis.set(-me[8], -me[9], -me[10]);
            }
            _bestLocalAxis.normalize();
            _snapAxis.crossVectors(_bestLocalAxis, _upVec);
            const sinA = _snapAxis.length();
            if (sinA > 0.002) {
              _snapAxis.divideScalar(sinA);
              const ang = Math.asin(Math.min(1, sinA));
              _snapQuat.setFromAxisAngle(_snapAxis, ang * Math.min(1, 7.5 * dt));
              prop.quat.premultiply(_snapQuat).normalize();
            }
          }
        }

        // Compute exact lowest-point clearance offset from rotated quaternion
        _mat4.makeRotationFromQuaternion(prop.quat);
        const me = _mat4.elements;
        let supportOffset = prop.halfHeight;
        if (prop.shape === 'box') {
          supportOffset =
            Math.abs(me[1]) * prop.halfExtentX +
            Math.abs(me[5]) * prop.halfHeight +
            Math.abs(me[9]) * prop.halfExtentZ;
        } else if (prop.shape === 'cylinder') {
          supportOffset =
            Math.abs(me[5]) * prop.halfHeight +
            Math.hypot(me[1], me[9]) * prop.halfWidth;
        }

        prop.mesh.position.set(prop.x, prop.y, prop.z);
        prop.visualGroup.quaternion.copy(prop.quat);
        prop.visualGroup.position.y = supportOffset;
        _eulerTmp.setFromQuaternion(prop.quat);
        prop.rotX = _eulerTmp.x;
        prop.rotZ = _eulerTmp.z;
      }
    }

    if (this.gameState === 'title') {
      this.titleOrbitAngle += dt * 0.065;
      _camTargetPos.set(
        Math.sin(this.titleOrbitAngle) * 84,
        34 + Math.sin(elapsed * 0.35) * 2.2,
        Math.cos(this.titleOrbitAngle) * 72 - 18,
      );
      _camLookTarget.set(-24, 6, -30);
      const damp = 1 - Math.exp(-3.2 * dt);
      this.currentCamPos.lerp(_camTargetPos, damp);
      this.currentLookAt.lerp(_camLookTarget, damp);
      this.camera.position.copy(this.currentCamPos);
      this.camera.lookAt(this.currentLookAt);
      return;
    }

    if (this.gameState === 'paused') {
      return;
    }

    let moveX = this.joystickVec.x;
    let moveZ = this.joystickVec.y;
    if (this.keysPressed.has('KeyW') || this.keysPressed.has('ArrowUp')) moveZ -= 1;
    if (this.keysPressed.has('KeyS') || this.keysPressed.has('ArrowDown')) moveZ += 1;
    if (this.keysPressed.has('KeyA') || this.keysPressed.has('ArrowLeft')) moveX -= 1;
    if (this.keysPressed.has('KeyD') || this.keysPressed.has('ArrowRight')) moveX += 1;

    const hasManualInput = Math.abs(moveX) > 0.05 || Math.abs(moveZ) > 0.05;
    if (hasManualInput) {
      this.walkTarget = null;
      this.walkMarkerMesh.visible = false;
      if (this.isMeditating) {
        this.isMeditating = false;
        this.meditationTarget = null;
      }
    }

    const isSprinting =
      this.keysPressed.has('ShiftLeft') || this.keysPressed.has('ShiftRight');
    const moveSpeed = isSprinting ? 18.5 : 9.4;

    let stepDx = 0;
    let stepDz = 0;

    if (hasManualInput) {
      _vec3.set(moveX, 0, moveZ).normalize();
      const sinY = Math.sin(this.cameraYaw);
      const cosY = Math.cos(this.cameraYaw);
      const worldX = _vec3.x * cosY + _vec3.z * sinY;
      const worldZ = -_vec3.x * sinY + _vec3.z * cosY;
      stepDx = worldX * moveSpeed * dt;
      stepDz = worldZ * moveSpeed * dt;
    } else if (this.walkTarget) {
      const dx = this.walkTarget.x - this.playerPos.x;
      const dz = this.walkTarget.z - this.playerPos.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.65) {
        this.walkTarget = null;
        this.walkMarkerMesh.visible = false;
      } else {
        stepDx = (dx / dist) * moveSpeed * dt;
        stepDz = (dz / dist) * moveSpeed * dt;
      }
    }

    const movedDist = Math.hypot(stepDx, stepDz);
    const prevPlayerX = this.playerPos.x;
    const prevPlayerZ = this.playerPos.z;
    if (movedDist > 0.0001) {
      const clamped = clampToWalkable(
        this.playerPos.x,
        this.playerPos.z,
        this.playerPos.x + stepDx,
        this.playerPos.z + stepDz,
      );
      const bvhResolved = this.physicsWorld.resolveHorizontalCollision(
        this.playerPos.x,
        this.playerPos.z,
        clamped.x,
        clamped.z,
        this.playerPos.y,
        1.75,
        0.4,
        0.26,
      );
      const actualMove = Math.hypot(
        bvhResolved.x - this.playerPos.x,
        bvhResolved.z - this.playerPos.z,
      );
      this.playerPos.x = bvhResolved.x;
      this.playerPos.z = bvhResolved.z;
      this.distanceWalked += actualMove;

      if (actualMove > 0.001) {
        const targetYaw = Math.atan2(stepDx, stepDz);
        const yawDiff = Math.atan2(
          Math.sin(targetYaw - this.playerYaw),
          Math.cos(targetYaw - this.playerYaw),
        );
        this.playerYaw += yawDiff * (1 - Math.exp(-12 * dt));
        this.walkCycle += actualMove * 2.6;
        if (this.isGrounded) {
          soundEngine.playFootstep(surfaceKind);
          const strideIdx = Math.floor(this.walkCycle / Math.PI);
          if (strideIdx !== this.lastFootstepStrideIdx) {
            this.lastFootstepStrideIdx = strideIdx;
            this.spawnFootstepBurst(surfaceKind, false, strideIdx % 2 === 0 ? 1 : -1);
            const edgeRipple = findWaterEdgeRippleOrigin(
              this.playerPos.x,
              this.playerPos.z,
              strideIdx,
            );
            if (edgeRipple && elapsed - this.lastTrailRippleAt >= 0.18) {
              triggerWaterRipple(edgeRipple.x, edgeRipple.z, elapsed, edgeRipple.strength);
              this.lastTrailRippleAt = elapsed;
              this.waterEdgeRippleCount++;
              this.lastWaterRippleBody = edgeRipple.waterBody;
              if (edgeRipple.waterBody === 'pushkarini' || edgeRipple.waterBody === 'surrounding') {
                this.pondTrailRippleCount++;
              }
              this.writeDataset('pondTrailRipples', String(this.pondTrailRippleCount));
              this.writeDataset('waterEdgeRipples', String(this.waterEdgeRippleCount));
              this.writeDataset('lastWaterRippleBody', edgeRipple.waterBody);
            }
          }
        }
      }
    }
    this.playerVx = (this.playerPos.x - prevPlayerX) / dt;
    this.playerVz = (this.playerPos.z - prevPlayerZ) / dt;

    // Bump nearest tree trunk if player walks/sprints right up against it
    if (movedDist > 0.002 && elapsed - this.lastTreeShakeAt > 0.42) {
      for (let tIdx = 0; tIdx < this.treeSpots.length; tIdx++) {
        const tr = this.treeSpots[tIdx];
        const hitR = 0.85 * tr.scale + 0.34;
        const tdx = this.playerPos.x - tr.x;
        const tdz = this.playerPos.z - tr.z;
        if (tdx * tdx + tdz * tdz < hitR * hitR) {
          this.shakeTreeAt(tr.x, groundHeightAt(tr.x, tr.z), tr.z, tr.type, elapsed);
          break;
        }
      }
    }

    const baseSurfaceY = getSurfaceHeightAt(this.playerPos.x, this.playerPos.z);
    const bvhFloor = this.physicsWorld.sampleFloorHeight(
      this.playerPos.x,
      this.playerPos.z,
      this.playerPos.y + 0.34,
    );
    const floorY = Math.max(
      playerPropSupportY,
      bvhFloor !== null ? Math.max(baseSurfaceY, bvhFloor) : baseSurfaceY,
    );
    if (!this.isGrounded || this.playerPos.y > floorY + 0.02) {
      this.playerVelY -= 20 * dt;
      this.playerPos.y += this.playerVelY * dt;
      if (this.playerPos.y <= floorY) {
        this.playerPos.y = floorY;
        this.playerVelY = 0;
        this.isGrounded = true;
        this.squashScaleY = 0.82;
        this.spawnFootstepBurst(surfaceKind, true, 0);
        soundEngine.playFootstep(surfaceKind);
        const pWater = this.getWaterSurfaceAt(this.playerPos.x, this.playerPos.z);
        if (pWater.inWater && this.playerPos.y < pWater.surfaceY + 0.45) {
          triggerWaterRipple(this.playerPos.x, this.playerPos.z, elapsed, 1.25);
          this.spawnWaterSplash(this.playerPos.x, pWater.surfaceY + 0.04, this.playerPos.z, 1.0);
          soundEngine.playWaterSplash(0.75);
        }
      }
    } else {
      this.playerPos.y = floorY;
      // Gentle shoreline water ripples when wading along water edges
      if (movedDist > 0.01 && elapsed - this.lastPlayerRippleAt > 0.28) {
        const pWater = this.getWaterSurfaceAt(this.playerPos.x, this.playerPos.z);
        if (pWater.inWater && this.playerPos.y < pWater.surfaceY + 0.45) {
          triggerWaterRipple(this.playerPos.x, this.playerPos.z, elapsed, 0.72);
          this.lastPlayerRippleAt = elapsed;
        }
      }
    }

    this.squashScaleY += (1 - this.squashScaleY) * (1 - Math.exp(-14 * dt));
    const xzStretch = 1 / Math.sqrt(Math.max(0.5, this.squashScaleY));
    this.character.bodyGroup.scale.set(xzStretch, this.squashScaleY, xzStretch);

    const stride = movedDist > 0.001 ? Math.sin(this.walkCycle) * 0.55 : 0;
    this.character.leftLeg.rotation.x = stride;
    this.character.rightLeg.rotation.x = -stride;
    this.character.leftArm.rotation.x = -stride * 0.75;
    this.character.rightArm.rotation.x = stride * 0.75;
    this.character.bodyGroup.position.y =
      movedDist > 0.001 && this.isGrounded ? Math.abs(Math.sin(this.walkCycle)) * 0.08 : 0;

    this.character.root.position.copy(this.playerPos);
    this.character.root.rotation.y = this.playerYaw;

    const nearest = findNearestLandmark(this.playerPos.x, this.playerPos.z);
    for (const [id, ring] of this.landmarkRings.entries()) {
      const mat = ring.material as THREE.MeshBasicMaterial;
      const active = nearest?.landmark.id === id;
      mat.opacity = active ? 0.45 : 0.14;
      ring.scale.setScalar(active ? 1.04 + Math.sin(elapsed * 4) * 0.025 : 1);
    }

    const inMayaDeviInterior =
      Math.abs(this.playerPos.x - LUMBINI_SACRED_POND.centerX) <= 17.2 &&
      this.playerPos.z >= LUMBINI_SACRED_POND.centerZ - 33.2 &&
      this.playerPos.z <= LUMBINI_SACRED_POND.centerZ - 10.8;
    const inPashupatiSanctum =
      Math.abs(this.playerPos.x - PASHUPATI_COMPLEX.centerX) <= 8.2 &&
      Math.abs(this.playerPos.z - PASHUPATI_COMPLEX.centerZ) <= 8.2;

    const lookLambda = this.cameraMode === 'first-person' ? 18.0 : 12.0;
    this.cameraYaw = dampCameraValue(this.cameraYaw, this.targetCameraYaw, lookLambda, dt);
    this.cameraPitch = clampCameraPitch(
      dampCameraValue(this.cameraPitch, this.targetCameraPitch, lookLambda, dt),
    );
    this.cameraDistance = dampCameraValue(this.cameraDistance, this.targetCameraDistance, 10.0, dt);

    if (this.renderer?.domElement) {
      this.writeDataset('insideMayaDevi', inMayaDeviInterior ? 'true' : 'false');
      this.writeDataset('insidePashupatiSanctum', inPashupatiSanctum ? 'true' : 'false');
      this.writeDataset('cameraMode', this.cameraMode);
      if (elapsed - this.lastSimDatasetFlushAt < 0.02 || this.lastSimDatasetFlushAt < 0) {
        this.writeDataset('cameraPitchDeg', String(Math.round((-this.cameraPitch * 180) / Math.PI)));
        this.writeDataset('cameraYawDeg', String(Math.round(((this.cameraYaw * 180) / Math.PI) % 360)));
      }
    }

    if (this.focusedLandmark) {
      this.character.root.visible = true;
      this.computeFocusedCameraTargets(this.focusedLandmark, _camLookTarget, _camTargetPos);
    } else if (this.isMeditating && this.meditationTarget) {
      this.character.root.visible = this.cameraMode !== 'first-person';
      const med = this.meditationTarget;
      const sway = Math.sin(elapsed * 0.45) * 0.35;
      if (this.cameraMode === 'first-person') {
        _camTargetPos.set(med.x, this.playerPos.y + 1.05, med.z);
        _camLookTarget.set(med.lookX + sway, this.playerPos.y + 1.25, med.lookZ);
      } else {
        const dx = med.x - med.lookX;
        const dz = med.z - med.lookZ;
        const dLen = Math.hypot(dx, dz) || 1;
        _camTargetPos.set(
          med.x + (dx / dLen) * 4.4 + sway * 0.6,
          this.playerPos.y + 2.45,
          med.z + (dz / dLen) * 4.4,
        );
        _camLookTarget.set(med.lookX, this.playerPos.y + 1.2, med.lookZ);
      }
    } else if (this.cameraMode === 'first-person') {
      this.character.root.visible = false;
      const fpPitch = computeFirstPersonLookPitch(this.cameraPitch);
      const bob = movedDist > 0.001 && this.isGrounded ? Math.sin(this.walkCycle * 2.0) * 0.04 : 0;
      const eyeY = this.playerPos.y + 1.56 + bob;
      _camTargetPos.set(this.playerPos.x, eyeY, this.playerPos.z);
      _camLookTarget.set(
        this.playerPos.x - Math.sin(this.cameraYaw) * Math.cos(fpPitch) * 12,
        eyeY + Math.sin(fpPitch) * 12,
        this.playerPos.z - Math.cos(this.cameraYaw) * Math.cos(fpPitch) * 12,
      );
    } else {
      this.character.root.visible = true;
      const inJanakiCourtyard =
        Math.abs(this.playerPos.x + 92) <= 13.8 &&
        this.playerPos.z >= 79.0 &&
        this.playerPos.z <= 102.6;
      const activeCamDist = inPashupatiSanctum
        ? Math.min(this.cameraDistance, 3.8)
        : inMayaDeviInterior
          ? Math.min(this.cameraDistance, 6.2)
          : inJanakiCourtyard
            ? Math.min(this.cameraDistance, 8.2)
            : this.cameraDistance;
      const horiz = Math.cos(this.cameraPitch) * activeCamDist;
      const vert = Math.sin(this.cameraPitch) * activeCamDist;
      _camLookTarget.set(this.playerPos.x, this.playerPos.y + 1.5, this.playerPos.z);
      _camTargetPos.set(
        this.playerPos.x + Math.sin(this.cameraYaw) * horiz,
        this.playerPos.y + vert + 1.5,
        this.playerPos.z + Math.cos(this.cameraYaw) * horiz,
      );
      this.applyCameraOcclusion(_camLookTarget, _camTargetPos);
    }

    const camDamp = 1 - Math.exp(-(this.cameraMode === 'first-person' ? 18.0 : 10.5) * dt);
    this.currentCamPos.lerp(_camTargetPos, camDamp);
    this.currentLookAt.lerp(_camLookTarget, camDamp);
    this.camera.position.copy(this.currentCamPos);
    this.camera.lookAt(this.currentLookAt);

    this.lastContextualAction = this.getContextualAction();
    this.emitHud(false);
  }

  private emitHud(force: boolean): void {
    const elapsed = (performance.now() - this.startTimeMs) / 1000;
    const tickDue = force || this.lastHudTickAt < 0 || elapsed - this.lastHudTickAt >= 0.25;

    const nearest = findNearestLandmark(this.playerPos.x, this.playerPos.z);
    const zoneName = nearest
      ? nearest.landmark.zoneName
      : this.playerPos.x > getRiverCenterX(this.playerPos.z)
        ? 'Vellore Foothills'
        : 'Kathmandu Valley';

    const action = this.lastContextualAction ?? this.getContextualAction();
    const showLumbiniPresets =
      zoneName === 'Lumbini Sacred Garden' ||
      this.focusedLandmark?.id === 'lumbini-buddha' ||
      (this.playerPos.x <= -195 && this.playerPos.z >= 15 && this.playerPos.z <= 192);

    const nextDiscrete: DiscreteHudState = {
      zoneName,
      nearestLandmarkId: nearest?.landmark.id ?? null,
      actionKind: action?.kind ?? null,
      actionIndex: typeof action?.index === 'number' ? action.index : null,
      actionLabel: action?.label ?? null,
      isMeditating: this.isMeditating,
      showLumbiniPresets,
    };

    const discreteChanged = force || hasDiscreteHudChanged(this.lastDiscreteHud, nextDiscrete);
    if (!tickDue && !discreteChanged) return;

    const effectiveLighting = computeEffectiveLightingState(
      getPresetHour(this.timePreset),
      this.weather,
      this.playerPos.x,
      this.playerPos.z,
      this.lumbiniPreset,
      this.focusedLandmark?.id,
    );

    if (tickDue) {
      this.lastHudTickAt = elapsed;
      this.lastHudEmit = elapsed;
      this.callbacks.onHudTick?.({
        distanceWalked: this.distanceWalked,
        formattedHour: formatClockHour(effectiveLighting.lighting.hour),
        phaseLabel: effectiveLighting.lighting.phaseLabel,
        coordsX: Math.round(this.playerPos.x),
        coordsZ: Math.round(this.playerPos.z),
      });
    }

    if (discreteChanged) {
      this.lastDiscreteHud = nextDiscrete;
      const snap: WorldHudSnapshot = {
        zoneName,
        nearestLandmark: nearest?.landmark ?? null,
        distanceWalked: this.distanceWalked,
        timeState: effectiveLighting.lighting,
        coords: {
          x: Math.round(this.playerPos.x),
          z: Math.round(this.playerPos.z),
        },
        contextualAction: action,
        isMeditating: this.isMeditating,
      };
      this.callbacks.onHudDiscreteChange?.(snap);
      this.callbacks.onHudUpdate?.(snap);
    }
  }

  public dispose(): void {
    this.disposed = true;
    soundEngine.dispose();
    if (this.isTimeoutFrame) {
      clearTimeout(this.frameId);
    } else {
      cancelAnimationFrame(this.frameId);
    }
    this.cleanupListeners();

    this.scene?.traverse((obj) => {
      if ((obj as { isReflector?: boolean; dispose?: () => void }).isReflector) {
        (obj as { dispose: () => void }).dispose();
      }
      if ((obj as THREE.Mesh).isMesh || (obj as THREE.Points).isPoints) {
        const renderable = obj as THREE.Mesh | THREE.Points;
        renderable.geometry?.dispose();
        if (Array.isArray(renderable.material)) {
          renderable.material.forEach((m) => {
            if (!m.userData?.__cachedSingleton) m.dispose();
          });
        } else if (renderable.material && !renderable.material.userData?.__cachedSingleton) {
          renderable.material.dispose();
        }
      }
    });
    if (this.footprintTex && !this.footprintTex.userData?.__cachedSingleton) {
      this.footprintTex.dispose();
    }
    if (this.butterflyWingTex && !this.butterflyWingTex.userData?.__cachedSingleton) {
      this.butterflyWingTex.dispose();
    }
    this.tossedPebbleGeo?.dispose();
    this.tossedPebbleMat?.dispose();
    this.weatherParticles?.dispose();
    this.lumbiniFireflies?.dispose();
    this.lumbiniIncenseSmoke?.dispose();
    this.textures?.dispose();
    this.composer?.dispose();
    this.renderer?.dispose();
    if (this.renderer?.domElement?.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

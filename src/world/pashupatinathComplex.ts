import * as THREE from 'three';
import { LandmarkBuildResult } from './proceduralModels';
import { ProceduralTextureSet } from './proceduralTextures';
import { getPashupatinathMaterials } from './pashupatinathTextures';
import { buildPashupatinathMainPagoda } from './pashupatinathTemple';
import { buildPashupatinathGatesAndFence } from './pashupatinathGatesAndFence';
import { buildPashupatinathCourtyard } from './pashupatinathCourtyard';
import { buildPashupatinathBagmati } from './pashupatinathBagmati';

/**
 * Assembles the complete monumental 108m x 124m Pashupatinath Temple Complex,
 * Perimeter Fence & Torana Gates, Main 2-Tier Golden Pagoda & Walkable Sanctum,
 * Pashupati Chowk Courtyard Monuments, and Eastern Bagmati River Ghats + Pandra Shivalaya.
 */
export function createPashupatinathComplex(textures: ProceduralTextureSet): LandmarkBuildResult {
  const group = new THREE.Group();
  const mats = getPashupatinathMaterials(textures);

  const mainPagoda = buildPashupatinathMainPagoda(mats);
  const gatesAndFence = buildPashupatinathGatesAndFence(mats);
  const courtyard = buildPashupatinathCourtyard(mats);
  const bagmati = buildPashupatinathBagmati(mats);

  group.add(
    mainPagoda.group,
    gatesAndFence.group,
    courtyard.group,
    bagmati.group,
  );

  // Invisible Layer-1 landmark bounding volume for clicking Pashupatinath on world vista
  const hitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(108.0, 27.0, 124.0),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  hitMesh.position.set(0, 13.5, 0);
  hitMesh.layers.set(1);
  hitMesh.userData.noMerge = true;
  hitMesh.userData.nonCollidable = true;
  group.add(hitMesh);

  const beaconLights: THREE.PointLight[] = [
    ...mainPagoda.beaconLights,
    ...gatesAndFence.beaconLights,
    ...courtyard.beaconLights,
    ...bagmati.beaconLights,
  ];
  const animatedNodes: THREE.Object3D[] = [
    ...mainPagoda.animatedNodes,
    ...courtyard.animatedNodes,
    ...bagmati.animatedNodes,
  ];
  const cameraOccluders: THREE.Object3D[] = [...mainPagoda.cameraOccluders];

  group.userData.templeBells = [
    ...mainPagoda.templeBells,
    ...gatesAndFence.templeBells,
    ...courtyard.templeBells,
  ];
  group.userData.lingamHitTarget = mainPagoda.lingamHitTarget;
  group.userData.nandiHitTarget = courtyard.nandiHitTarget;
  group.userData.gheeLampHitTargets = courtyard.gheeLampHitTargets;
  group.userData.aaratiHitTarget = bagmati.aaratiHitTarget;
  group.userData.triggerLingamOffering = mainPagoda.triggerLingamOffering;
  group.userData.toggleGheeLampRack = courtyard.toggleGheeLampRack;
  group.userData.triggerBagmatiAarati = bagmati.triggerBagmatiAarati;

  return {
    group,
    hitMesh,
    beaconLights,
    animatedNodes,
    cameraOccluders,
  };
}

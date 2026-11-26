export interface ShadowUpdateCheckInput {
  targetX: number;
  targetZ: number;
  sunDirX: number;
  sunDirY: number;
  sunDirZ: number;
}

export interface DiscreteHudState {
  zoneName: string;
  nearestLandmarkId: string | null;
  actionKind: string | null;
  actionIndex: number | null;
  actionLabel: string | null;
  isMeditating: boolean;
  showLumbiniPresets: boolean;
}

export function shouldUpdateShadowMap(
  prev: ShadowUpdateCheckInput | null,
  next: ShadowUpdateCheckInput,
  forceDirty: boolean,
  maxPropSpeed: number,
  targetMoveThreshold = 1.5,
  sunDirDotThreshold = 0.999985,
): boolean {
  if (forceDirty || !prev) return true;
  if (maxPropSpeed > 0.05) return true;

  const dx = next.targetX - prev.targetX;
  const dz = next.targetZ - prev.targetZ;
  if (dx * dx + dz * dz > targetMoveThreshold * targetMoveThreshold) {
    return true;
  }

  const dot =
    prev.sunDirX * next.sunDirX +
    prev.sunDirY * next.sunDirY +
    prev.sunDirZ * next.sunDirZ;
  if (dot < sunDirDotThreshold) {
    return true;
  }

  return false;
}

export function isWithinSleepDistanceSq(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  maxDistSq: number,
): boolean {
  const dx = ax - bx;
  const dz = az - bz;
  return dx * dx + dz * dz <= maxDistSq;
}

/**
 * Selects up to `maxSelect` smallest-distance eligible indices into pre-allocated
 * typed buffers without allocating temporary arrays or sort comparator objects.
 * Returns the number of selected indices written into `outIndices`.
 */
export function selectClosestIndicesZeroAlloc(
  posX: Float64Array,
  posZ: Float64Array,
  eligible: Uint8Array,
  count: number,
  refX: number,
  refZ: number,
  outIndices: Int32Array,
  outDistSq: Float64Array,
  maxSelect: number,
): number {
  let selected = 0;
  const limit = Math.min(maxSelect, outIndices.length, outDistSq.length);
  if (limit <= 0 || count <= 0) return 0;

  for (let i = 0; i < count; i++) {
    if (eligible[i] === 0) continue;
    const dx = posX[i] - refX;
    const dz = posZ[i] - refZ;
    const dSq = dx * dx + dz * dz;

    if (selected < limit) {
      let ins = selected;
      while (ins > 0 && outDistSq[ins - 1] > dSq) {
        outDistSq[ins] = outDistSq[ins - 1];
        outIndices[ins] = outIndices[ins - 1];
        ins--;
      }
      outDistSq[ins] = dSq;
      outIndices[ins] = i;
      selected++;
    } else if (dSq < outDistSq[limit - 1]) {
      let ins = limit - 1;
      while (ins > 0 && outDistSq[ins - 1] > dSq) {
        outDistSq[ins] = outDistSq[ins - 1];
        outIndices[ins] = outIndices[ins - 1];
        ins--;
      }
      outDistSq[ins] = dSq;
      outIndices[ins] = i;
    }
  }

  return selected;
}

export function hasDiscreteHudChanged(
  prev: DiscreteHudState | null,
  next: DiscreteHudState,
): boolean {
  if (!prev) return true;
  return (
    prev.zoneName !== next.zoneName ||
    prev.nearestLandmarkId !== next.nearestLandmarkId ||
    prev.actionKind !== next.actionKind ||
    prev.actionIndex !== next.actionIndex ||
    prev.actionLabel !== next.actionLabel ||
    prev.isMeditating !== next.isMeditating ||
    prev.showLumbiniPresets !== next.showLumbiniPresets
  );
}

export function formatClockHour(hour: number): string {
  const h24 = Math.floor(hour) % 24;
  const m = Math.floor((hour - Math.floor(hour)) * 60);
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function writeDirtyDatasetAttr(
  dataset: Record<string, string | undefined>,
  cache: Record<string, string>,
  key: string,
  value: string,
): boolean {
  if (cache[key] === value) return false;
  cache[key] = value;
  dataset[key] = value;
  return true;
}

export interface BoundingSphereEntry {
  objIndex: number;
  cx: number;
  cy: number;
  cz: number;
  radius: number;
}

/**
 * Tests whether a ray segment from (ox, oy, oz) along unit direction (dx, dy, dz)
 * of length `maxDist` comes within `sphere.radius + pad` of the bounding sphere.
 */
export function raySegmentHitsSphere(
  ox: number,
  oy: number,
  oz: number,
  dx: number,
  dy: number,
  dz: number,
  maxDist: number,
  cx: number,
  cy: number,
  cz: number,
  radius: number,
  pad = 0.5,
): boolean {
  const rx = cx - ox;
  const ry = cy - oy;
  const rz = cz - oz;
  const rPad = radius + pad;

  const proj = rx * dx + ry * dy + rz * dz;
  if (proj < -rPad || proj > maxDist + rPad) return false;

  const clampedProj = proj < 0 ? 0 : proj > maxDist ? maxDist : proj;
  const px = ox + dx * clampedProj - cx;
  const py = oy + dy * clampedProj - cy;
  const pz = oz + dz * clampedProj - cz;
  return px * px + py * py + pz * pz <= rPad * rPad;
}

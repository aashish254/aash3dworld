import { LANDMARKS } from './portfolioData';

export interface VisitHistoryEntry {
  id: string;
  visitedAt: number;
}

export interface AchievementProgressInput {
  discoveredIds: string[];
  totalDistanceWalked: number;
  customWaypointCount: number;
  bellRingsCount: number;
  summitFlagHoisted?: boolean;
}

export interface AchievementEvaluation {
  unlocked: boolean;
  current: number;
  target: number;
  ratio: number;
  progressLabel: string;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  category: 'exploration' | 'heritage' | 'engineering' | 'distance';
  requiredLandmarkIds?: string[];
  evaluate: (input: AchievementProgressInput) => AchievementEvaluation;
}

export const HERITAGE_GROUP_IDS = [
  'kathmandu-stupa',
  'boudhanath-stupa',
  'pumdikot-shiva',
  'janaki-mandir',
  'lumbini-buddha',
];

export const ENGINEERING_GROUP_IDS = [
  'vit-vellore-tower',
  'aniflow-studio',
  'agent-infra-monolith',
  'breath-sensor-lab',
];

function evaluateLandmarkGroup(
  discoveredIds: string[],
  requiredIds: string[],
): AchievementEvaluation {
  const discoveredSet = new Set(discoveredIds);
  const current = requiredIds.filter((id) => discoveredSet.has(id)).length;
  const target = requiredIds.length;
  const ratio = target > 0 ? Math.min(1, current / target) : 1;
  return {
    unlocked: current >= target,
    current,
    target,
    ratio,
    progressLabel: `${current}/${target} sites`,
  };
}

function evaluateDistance(distanceWalked: number, targetMeters: number): AchievementEvaluation {
  const clamped = Math.max(0, Math.round(distanceWalked));
  const ratio = Math.min(1, clamped / targetMeters);
  const formatDist = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`);
  return {
    unlocked: distanceWalked >= targetMeters,
    current: Math.min(clamped, targetMeters),
    target: targetMeters,
    ratio,
    progressLabel: `${formatDist(Math.min(clamped, targetMeters))} / ${formatDist(targetMeters)}`,
  };
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first-step',
    title: 'First Footsteps',
    description: 'Inspect your first portfolio landmark.',
    category: 'exploration',
    evaluate: ({ discoveredIds }) => {
      const current = Math.min(1, discoveredIds.length);
      return {
        unlocked: discoveredIds.length >= 1,
        current,
        target: 1,
        ratio: current,
        progressLabel: `${current}/1 site`,
      };
    },
  },
  {
    id: 'nepal-pilgrim',
    title: 'Nepal Heritage Pilgrim',
    description: 'Visit Pashupatinath, Boudhanath, Pumdikot, Janaki Mandir & Lumbini.',
    category: 'heritage',
    requiredLandmarkIds: HERITAGE_GROUP_IDS,
    evaluate: ({ discoveredIds }) => evaluateLandmarkGroup(discoveredIds, HERITAGE_GROUP_IDS),
  },
  {
    id: 'builder-circuit',
    title: 'Systems & Research Trail',
    description: 'Explore VIT Vellore, AniFlow AI, Local-First OSS & Breath Sensor Lab.',
    category: 'engineering',
    requiredLandmarkIds: ENGINEERING_GROUP_IDS,
    evaluate: ({ discoveredIds }) => evaluateLandmarkGroup(discoveredIds, ENGINEERING_GROUP_IDS),
  },
  {
    id: 'world-explorer',
    title: 'Visited all landmarks',
    description: `Discover all ${LANDMARKS.length} landmarks across the Kathmandu-to-Vellore world & Himalayas.`,
    category: 'exploration',
    requiredLandmarkIds: LANDMARKS.map((l) => l.id),
    evaluate: ({ discoveredIds }) =>
      evaluateLandmarkGroup(
        discoveredIds,
        LANDMARKS.map((l) => l.id),
      ),
  },
  {
    id: 'trailblazer-1km',
    title: '1km Valley Trailblazer',
    description: 'Walk 1,000 meters across valley roads, river bridge & temple grounds.',
    category: 'distance',
    evaluate: ({ totalDistanceWalked }) => evaluateDistance(totalDistanceWalked, 1000),
  },
  {
    id: 'himalayan-trekker-5km',
    title: '5km Himalayan Trekker',
    description: 'Cover 5,000 meters exploring Nepal shrines and Vellore foothills.',
    category: 'distance',
    evaluate: ({ totalDistanceWalked }) => evaluateDistance(totalDistanceWalked, 5000),
  },
  {
    id: 'marathon-10km',
    title: 'Traveled 10km',
    description: 'Walk 10,000 meters (10 km) through the entire open-world portfolio.',
    category: 'distance',
    evaluate: ({ totalDistanceWalked }) => evaluateDistance(totalDistanceWalked, 10000),
  },
  {
    id: 'temple-bell-ringer',
    title: 'Sacred Bell Ringer',
    description: 'Ring a brass temple bell inside a sanctuary courtyard.',
    category: 'heritage',
    evaluate: ({ bellRingsCount }) => {
      const current = Math.min(1, bellRingsCount);
      return {
        unlocked: bellRingsCount >= 1,
        current,
        target: 1,
        ratio: current,
        progressLabel: `${current}/1 chime`,
      };
    },
  },
  {
    id: 'wayfinder-markers',
    title: 'Trail Cartographer',
    description: 'Pin a custom trail marker onto the terrain map.',
    category: 'exploration',
    evaluate: ({ customWaypointCount }) => {
      const current = Math.min(1, customWaypointCount);
      return {
        unlocked: customWaypointCount >= 1,
        current,
        target: 1,
        ratio: current,
        progressLabel: `${current}/1 marker`,
      };
    },
  },
  {
    id: 'himalayan-summit',
    title: 'Himalayan Summit Conqueror',
    description: 'Climb Sagarmatha Trek Peak (216m) and hoist a prayer flag at the Summit Spire.',
    category: 'exploration',
    evaluate: ({ summitFlagHoisted }) => {
      const done = Boolean(summitFlagHoisted);
      return {
        unlocked: done,
        current: done ? 1 : 0,
        target: 1,
        ratio: done ? 1 : 0,
        progressLabel: done ? '216m Summit Reached' : '0/216m Summit',
      };
    },
  },
];

export function evaluateAchievements(input: AchievementProgressInput) {
  return ACHIEVEMENTS.map((def) => ({
    definition: def,
    status: def.evaluate(input),
  }));
}

export function recordVisitHistory(
  history: VisitHistoryEntry[],
  landmarkId: string,
  visitedAt = Date.now(),
  maxStored = 40,
): VisitHistoryEntry[] {
  const last = history[history.length - 1];
  if (last && last.id === landmarkId) {
    return [...history.slice(0, -1), { id: landmarkId, visitedAt }];
  }
  const next = [...history, { id: landmarkId, visitedAt }];
  return next.length > maxStored ? next.slice(next.length - maxStored) : next;
}

export function getRecentVisitHistory(
  history: VisitHistoryEntry[],
  limit = 5,
): VisitHistoryEntry[] {
  if (history.length <= limit) return history;
  return history.slice(history.length - limit);
}

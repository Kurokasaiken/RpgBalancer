import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

const titleCase = (value: string): string =>
  value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

export function formatResidentLabel(resident: ResidentState): string {
  if (resident.displayName && resident.displayName.trim().length > 0) {
    return resident.displayName;
  }

  const snapshot = resident.statSnapshot as { displayName?: string } | undefined;
  if (snapshot?.displayName && snapshot.displayName.trim().length > 0) {
    return snapshot.displayName;
  }

  if (resident.id.startsWith('founder-')) {
    return titleCase(resident.id.replace('founder-', ''));
  }

  return titleCase(resident.id);
}

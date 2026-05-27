/**
 * jobCardKit — frozen re-export of {@link JobCard}.
 *
 * Contract subtree: `[data-testid="job-card"]` (added 2026-05-21 to JobCard
 * wrapper via `dataTestId="job-card"` passthrough to ActionCardBase).
 */

export { JobCard } from '@/ui/idleVillage/map/actionCards/wrappers/JobCard';

export function useJobCardKitData() {
  return {
    label: 'Gather Wood',
    icon: '🪓',
    subtitle: 'Daily activity',
    helperText: 'Assign a resident to gather wood',
    assignees: [],
  };
}

export * from './jobCardKit.contract';

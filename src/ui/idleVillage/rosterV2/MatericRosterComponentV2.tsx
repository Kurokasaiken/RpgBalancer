import { RosterDraggableV2 } from './RosterDraggableV2';
import { MatericSkinProvider } from '@/ui/wanderlust-surface/MatericSkinProvider';

export type MatericRosterComponentV2Props = Omit<Parameters<typeof RosterDraggableV2>[0], 'useWanderlustSkin'>;

/** Roster V2 inside the Materic skin provider; same contract as `MatericRosterComponent`. */
export function MatericRosterComponentV2({ componentId = 'materic-roster-v2', ...props }: MatericRosterComponentV2Props) {
  return (
    <MatericSkinProvider>
      <RosterDraggableV2 {...props} componentId={componentId} useWanderlustSkin />
    </MatericSkinProvider>
  );
}

export default MatericRosterComponentV2;

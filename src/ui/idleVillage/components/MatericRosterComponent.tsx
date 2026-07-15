import { RosterDraggable } from '@/ui/idleVillage/frozen/kits/rosterKit';
import { MatericSkinProvider } from '@/ui/wanderlust-surface/MatericSkinProvider';

/**
 * Props for {@link MatericRosterComponent}.
 *
 * Mirrors {@link RosterDraggable} but removes `useWanderlustSkin` because
 * the component always renders with the Wanderlust + Materic skin pipeline.
 */
export type MatericRosterComponentProps = Omit<
  Parameters<typeof RosterDraggable>[0],
  'useWanderlustSkin'
>;

/**
 * Pre-configured roster surface wrapped in the Materic skin provider.
 *
 * Encapsulates {@link RosterDraggable} inside {@link MatericSkinProvider} and
 * forces `useWanderlustSkin` so the stone/bronze “Pulsazione Materica” aesthetic
 * is active for all descendants. Drag & drop, sorting and the canonical data
 * binder are preserved unchanged.
 *
 * @example
 * ```tsx
 * <MatericRosterComponent
 *   componentId="minimal-roster-materic"
 *   defaultFatigue={0}
 * />
 * ```
 */
export function MatericRosterComponent({
  componentId = 'materic-roster',
  ...props
}: MatericRosterComponentProps) {
  return (
    <MatericSkinProvider>
      <RosterDraggable
        {...props}
        componentId={componentId}
        useWanderlustSkin
      />
    </MatericSkinProvider>
  );
}

export default MatericRosterComponent;

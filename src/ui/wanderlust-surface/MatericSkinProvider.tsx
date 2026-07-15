import { useMemo, type ReactNode } from 'react';
import { MatericSkinContext, type MatericSkinContextValue } from './MatericSkinContext';

/**
 * Activates the "Materic" (Pulsazione Materica) skin variant for all descendants.
 *
 * Wrap the roster (or any other component that reads {@link useMatericSkin}) with
 * this provider to render the rough, engraved stone/bronze aesthetic: sharp
 * non-rounded stat bars, a sap-like HP fill, a golden-sand stamina fill, and a
 * grain overlay on the roster background.
 *
 * @example
 * ```tsx
 * <MatericSkinProvider>
 *   <RosterDraggable useWanderlustSkin componentId="materic-roster" />
 * </MatericSkinProvider>
 * ```
 */
export function MatericSkinProvider({ children }: { children: ReactNode }) {
  const value = useMemo<MatericSkinContextValue>(() => ({ isMateric: true }), []);
  return <MatericSkinContext.Provider value={value}>{children}</MatericSkinContext.Provider>;
}

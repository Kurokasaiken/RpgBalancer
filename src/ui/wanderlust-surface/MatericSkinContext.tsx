import { createContext, useContext } from 'react';

/**
 * Context that toggles the "Materic" (Pulsazione Materica) skin variant.
 *
 * When a component tree is wrapped in {@link MatericSkinProvider}, the roster
 * and stat bars render a rough, engraved, stone/bronze aesthetic: sharp
 * non-rounded bars, sap-like HP fill, golden sand stamina, and a grain overlay.
 *
 * @example
 * ```tsx
 * import { MatericSkinProvider } from './MatericSkinProvider';
 * import { useMatericSkin } from './MatericSkinContext';
 *
 * <MatericSkinProvider>
 *   <RosterDraggable useWanderlustSkin componentId="materic-roster" />
 * </MatericSkinProvider>
 * ```
 */
export interface MatericSkinContextValue {
  /** Whether the Materic skin variant is active for this subtree. */
  isMateric: boolean;
}

/**
 * React context that stores whether the Materic skin variant is active.
 */
export const MatericSkinContext = createContext<MatericSkinContextValue>({ isMateric: false });

/**
 * Returns `true` if the current React tree is wrapped in a {@link MatericSkinProvider}.
 */
export function useMatericSkin(): boolean {
  return useContext(MatericSkinContext).isMateric;
}

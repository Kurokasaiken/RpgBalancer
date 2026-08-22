/**
 * destinyAstrolabeV9Kit
 *
 * Frozen re-export of the reduced-noise DestinyAstrolabeV9 plus its smart
 * shell. Used for the V9 test page while V1 remains the POI Quest canonical.
 *
 * One-line transplant anywhere in the app:
 *
 *   import { DestinyAstrolabeV9Standalone } from '@/ui/idleVillage/frozen/kits/destinyAstrolabeV9Kit';
 */

import type { ComponentProps } from 'react';
import { DestinyAstrolabeV9 } from '@/ui/idleVillage/components/destinyAstrolabeV9/DestinyAstrolabeV9';
import type { DestinyAstrolabeV9Handle } from '@/ui/idleVillage/components/destinyAstrolabeV9/DestinyAstrolabeV9';
import { createKitShell, withKitShell, type KitProviderName } from '../_infra/KitShell';

// Canonical V7 component — re-exported, not re-implemented.
export { DestinyAstrolabeV9 } from '@/ui/idleVillage/components/destinyAstrolabeV9/DestinyAstrolabeV9';
export type {
  AstrolabeResult,
  AstrolabeSkill,
  DestinyAstrolabeV9Handle,
} from '@/ui/idleVillage/components/destinyAstrolabeV9/DestinyAstrolabeV9';

export const DESTINY_ASTROLABE_V9_PROVIDER_CHAIN: KitProviderName[] = ['SkinSystemProvider'];

/** Smart shell: mounts SkinSystemProvider only when absent above. */
export const DestinyAstrolabeV9KitShell = createKitShell(
  DESTINY_ASTROLABE_V9_PROVIDER_CHAIN,
  'DestinyAstrolabeV9KitShell',
);

/**
 * Drop-in variant: the reduced-noise astrolabe pre-wrapped in its smart shell.
 * Supports the imperative ref handle (`ref.current.roll()`).
 */
export const DestinyAstrolabeV9Standalone = withKitShell<
  ComponentProps<typeof DestinyAstrolabeV9>,
  DestinyAstrolabeV9Handle
>(DestinyAstrolabeV9, DESTINY_ASTROLABE_V9_PROVIDER_CHAIN, 'DestinyAstrolabeV9Standalone');

/**
 * destinyAstrolabeV10Kit
 *
 * Frozen re-export of the reduced-noise DestinyAstrolabeV10 plus its smart
 * shell. Used for the V7 test page while V1 remains the POI Quest canonical.
 *
 * One-line transplant anywhere in the app:
 *
 *   import { DestinyAstrolabeV10Standalone } from '@/ui/idleVillage/frozen/kits/destinyAstrolabeV10Kit';
 */

import type { ComponentProps } from 'react';
import { DestinyAstrolabeV10 } from '@/ui/idleVillage/components/destinyAstrolabeV10/DestinyAstrolabeV10';
import type { DestinyAstrolabeV10Handle } from '@/ui/idleVillage/components/destinyAstrolabeV10/DestinyAstrolabeV10';
import { createKitShell, withKitShell, type KitProviderName } from '../_infra/KitShell';

// Canonical V7 component — re-exported, not re-implemented.
export { DestinyAstrolabeV10 } from '@/ui/idleVillage/components/destinyAstrolabeV10/DestinyAstrolabeV10';
export type {
  AstrolabeResult,
  AstrolabeSkill,
  DestinyAstrolabeV10Handle,
} from '@/ui/idleVillage/components/destinyAstrolabeV10/DestinyAstrolabeV10';

export const DESTINY_ASTROLABE_V10_PROVIDER_CHAIN: KitProviderName[] = ['SkinSystemProvider'];

/** Smart shell: mounts SkinSystemProvider only when absent above. */
export const DestinyAstrolabeV10KitShell = createKitShell(
  DESTINY_ASTROLABE_V10_PROVIDER_CHAIN,
  'DestinyAstrolabeV10KitShell',
);

/**
 * Drop-in variant: the reduced-noise astrolabe pre-wrapped in its smart shell.
 * Supports the imperative ref handle (`ref.current.roll()`).
 */
export const DestinyAstrolabeV10Standalone = withKitShell<
  ComponentProps<typeof DestinyAstrolabeV10>,
  DestinyAstrolabeV10Handle
>(DestinyAstrolabeV10, DESTINY_ASTROLABE_V10_PROVIDER_CHAIN, 'DestinyAstrolabeV10Standalone');

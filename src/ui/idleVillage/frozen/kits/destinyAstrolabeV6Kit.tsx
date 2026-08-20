/**
 * destinyAstrolabeV6Kit
 *
 * Frozen re-export of the reduced-noise DestinyAstrolabeV6 plus its smart
 * shell. Used for the V6 test page while V1 remains the POI Quest canonical.
 *
 * One-line transplant anywhere in the app:
 *
 *   import { DestinyAstrolabeV6Standalone } from '@/ui/idleVillage/frozen/kits/destinyAstrolabeV6Kit';
 */

import type { ComponentProps } from 'react';
import { DestinyAstrolabeV6 } from '@/ui/idleVillage/components/destinyAstrolabeV6/DestinyAstrolabeV6';
import type { DestinyAstrolabeV6Handle } from '@/ui/idleVillage/components/destinyAstrolabeV6/DestinyAstrolabeV6';
import { createKitShell, withKitShell, type KitProviderName } from '../_infra/KitShell';

// Canonical V6 component — re-exported, not re-implemented.
export { DestinyAstrolabeV6 } from '@/ui/idleVillage/components/destinyAstrolabeV6/DestinyAstrolabeV6';
export type {
  AstrolabeResult,
  AstrolabeSkill,
  DestinyAstrolabeV6Handle,
} from '@/ui/idleVillage/components/destinyAstrolabeV6/DestinyAstrolabeV6';

export const DESTINY_ASTROLABE_V6_PROVIDER_CHAIN: KitProviderName[] = ['SkinSystemProvider'];

/** Smart shell: mounts SkinSystemProvider only when absent above. */
export const DestinyAstrolabeV6KitShell = createKitShell(
  DESTINY_ASTROLABE_V6_PROVIDER_CHAIN,
  'DestinyAstrolabeV6KitShell',
);

/**
 * Drop-in variant: the reduced-noise astrolabe pre-wrapped in its smart shell.
 * Supports the imperative ref handle (`ref.current.roll()`).
 */
export const DestinyAstrolabeV6Standalone = withKitShell<
  ComponentProps<typeof DestinyAstrolabeV6>,
  DestinyAstrolabeV6Handle
>(DestinyAstrolabeV6, DESTINY_ASTROLABE_V6_PROVIDER_CHAIN, 'DestinyAstrolabeV6Standalone');

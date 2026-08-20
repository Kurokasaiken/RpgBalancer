/**
 * destinyAstrolabeV7Kit
 *
 * Frozen re-export of the reduced-noise DestinyAstrolabeV7 plus its smart
 * shell. Used for the V7 test page while V1 remains the POI Quest canonical.
 *
 * One-line transplant anywhere in the app:
 *
 *   import { DestinyAstrolabeV7Standalone } from '@/ui/idleVillage/frozen/kits/destinyAstrolabeV7Kit';
 */

import type { ComponentProps } from 'react';
import { DestinyAstrolabeV7 } from '@/ui/idleVillage/components/destinyAstrolabeV7/DestinyAstrolabeV7';
import type { DestinyAstrolabeV7Handle } from '@/ui/idleVillage/components/destinyAstrolabeV7/DestinyAstrolabeV7';
import { createKitShell, withKitShell, type KitProviderName } from '../_infra/KitShell';

// Canonical V7 component — re-exported, not re-implemented.
export { DestinyAstrolabeV7 } from '@/ui/idleVillage/components/destinyAstrolabeV7/DestinyAstrolabeV7';
export type {
  AstrolabeResult,
  AstrolabeSkill,
  DestinyAstrolabeV7Handle,
} from '@/ui/idleVillage/components/destinyAstrolabeV7/DestinyAstrolabeV7';

export const DESTINY_ASTROLABE_V7_PROVIDER_CHAIN: KitProviderName[] = ['SkinSystemProvider'];

/** Smart shell: mounts SkinSystemProvider only when absent above. */
export const DestinyAstrolabeV7KitShell = createKitShell(
  DESTINY_ASTROLABE_V7_PROVIDER_CHAIN,
  'DestinyAstrolabeV7KitShell',
);

/**
 * Drop-in variant: the reduced-noise astrolabe pre-wrapped in its smart shell.
 * Supports the imperative ref handle (`ref.current.roll()`).
 */
export const DestinyAstrolabeV7Standalone = withKitShell<
  ComponentProps<typeof DestinyAstrolabeV7>,
  DestinyAstrolabeV7Handle
>(DestinyAstrolabeV7, DESTINY_ASTROLABE_V7_PROVIDER_CHAIN, 'DestinyAstrolabeV7Standalone');

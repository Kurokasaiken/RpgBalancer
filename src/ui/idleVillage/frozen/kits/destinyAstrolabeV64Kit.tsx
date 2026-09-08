/**
 * destinyAstrolabeV64Kit
 *
 * Re-export of DestinyAstrolabeV64 — the V6.4 semantic/cinematic clone of the
 * V6.3 tar-goo astrolabe (R-067). Owns its own engine, config and copy so it
 * can diverge without touching V6.3. Used by the V6.4 test page while V1
 * remains the POI Quest canonical.
 *
 * One-line transplant anywhere in the app:
 *
 *   import { DestinyAstrolabeV64Standalone } from '@/ui/idleVillage/frozen/kits/destinyAstrolabeV64Kit';
 */

import type { ComponentProps } from 'react';
import { DestinyAstrolabeV64 } from '@/ui/idleVillage/components/destinyAstrolabeV64/DestinyAstrolabeV64';
import type { DestinyAstrolabeV64Handle } from '@/ui/idleVillage/components/destinyAstrolabeV64/DestinyAstrolabeV64';
import { createKitShell, withKitShell, type KitProviderName } from '../_infra/KitShell';

// Canonical V6.4 component — re-exported, not re-implemented.
export { DestinyAstrolabeV64 } from '@/ui/idleVillage/components/destinyAstrolabeV64/DestinyAstrolabeV64';
export type {
  AstrolabeResult,
  AstrolabeSkill,
  DestinyAstrolabeV64Handle,
} from '@/ui/idleVillage/components/destinyAstrolabeV64/DestinyAstrolabeV64';

export const DESTINY_ASTROLABE_V64_PROVIDER_CHAIN: KitProviderName[] = ['SkinSystemProvider'];

/** Smart shell: mounts SkinSystemProvider only when absent above. */
export const DestinyAstrolabeV64KitShell = createKitShell(
  DESTINY_ASTROLABE_V64_PROVIDER_CHAIN,
  'DestinyAstrolabeV64KitShell',
);

/**
 * Drop-in variant: the tar-goo astrolabe pre-wrapped in its smart shell.
 * Supports the imperative ref handle (`ref.current.roll()`).
 */
export const DestinyAstrolabeV64Standalone = withKitShell<
  ComponentProps<typeof DestinyAstrolabeV64>,
  DestinyAstrolabeV64Handle
>(DestinyAstrolabeV64, DESTINY_ASTROLABE_V64_PROVIDER_CHAIN, 'DestinyAstrolabeV64Standalone');

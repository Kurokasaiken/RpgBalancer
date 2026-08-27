/**
 * destinyAstrolabeV62Kit
 *
 * Frozen re-export of DestinyAstrolabeV62 (V6 + viscous tar challenge
 * surface, R-032) plus its smart shell. Used for the V6.2 test page while
 * V1 remains the POI Quest canonical.
 *
 * One-line transplant anywhere in the app:
 *
 *   import { DestinyAstrolabeV62Standalone } from '@/ui/idleVillage/frozen/kits/destinyAstrolabeV62Kit';
 */

import type { ComponentProps } from 'react';
import { DestinyAstrolabeV62 } from '@/ui/idleVillage/components/destinyAstrolabeV62/DestinyAstrolabeV62';
import type { DestinyAstrolabeV62Handle } from '@/ui/idleVillage/components/destinyAstrolabeV62/DestinyAstrolabeV62';
import { createKitShell, withKitShell, type KitProviderName } from '../_infra/KitShell';

// Canonical V6.2 component — re-exported, not re-implemented.
export { DestinyAstrolabeV62 } from '@/ui/idleVillage/components/destinyAstrolabeV62/DestinyAstrolabeV62';
export type {
  AstrolabeResult,
  AstrolabeSkill,
  DestinyAstrolabeV62Handle,
} from '@/ui/idleVillage/components/destinyAstrolabeV62/DestinyAstrolabeV62';

export const DESTINY_ASTROLABE_V62_PROVIDER_CHAIN: KitProviderName[] = ['SkinSystemProvider'];

/** Smart shell: mounts SkinSystemProvider only when absent above. */
export const DestinyAstrolabeV62KitShell = createKitShell(
  DESTINY_ASTROLABE_V62_PROVIDER_CHAIN,
  'DestinyAstrolabeV62KitShell',
);

/**
 * Drop-in variant: the tar-goo astrolabe pre-wrapped in its smart shell.
 * Supports the imperative ref handle (`ref.current.roll()`).
 */
export const DestinyAstrolabeV62Standalone = withKitShell<
  ComponentProps<typeof DestinyAstrolabeV62>,
  DestinyAstrolabeV62Handle
>(DestinyAstrolabeV62, DESTINY_ASTROLABE_V62_PROVIDER_CHAIN, 'DestinyAstrolabeV62Standalone');

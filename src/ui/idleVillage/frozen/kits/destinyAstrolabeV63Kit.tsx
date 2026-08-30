/**
 * destinyAstrolabeV63Kit
 *
 * Frozen re-export of DestinyAstrolabeV63 (V6 + viscous tar challenge
 * surface, R-032) plus its smart shell. Used for the V6.3 test page while
 * V1 remains the POI Quest canonical.
 *
 * One-line transplant anywhere in the app:
 *
 *   import { DestinyAstrolabeV63Standalone } from '@/ui/idleVillage/frozen/kits/destinyAstrolabeV63Kit';
 */

import type { ComponentProps } from 'react';
import { DestinyAstrolabeV63 } from '@/ui/idleVillage/components/destinyAstrolabeV63/DestinyAstrolabeV63';
import type { DestinyAstrolabeV63Handle } from '@/ui/idleVillage/components/destinyAstrolabeV63/DestinyAstrolabeV63';
import { createKitShell, withKitShell, type KitProviderName } from '../_infra/KitShell';

// Canonical V6.3 component — re-exported, not re-implemented.
export { DestinyAstrolabeV63 } from '@/ui/idleVillage/components/destinyAstrolabeV63/DestinyAstrolabeV63';
export type {
  AstrolabeResult,
  AstrolabeSkill,
  DestinyAstrolabeV63Handle,
} from '@/ui/idleVillage/components/destinyAstrolabeV63/DestinyAstrolabeV63';

export const DESTINY_ASTROLABE_V63_PROVIDER_CHAIN: KitProviderName[] = ['SkinSystemProvider'];

/** Smart shell: mounts SkinSystemProvider only when absent above. */
export const DestinyAstrolabeV63KitShell = createKitShell(
  DESTINY_ASTROLABE_V63_PROVIDER_CHAIN,
  'DestinyAstrolabeV63KitShell',
);

/**
 * Drop-in variant: the tar-goo astrolabe pre-wrapped in its smart shell.
 * Supports the imperative ref handle (`ref.current.roll()`).
 */
export const DestinyAstrolabeV63Standalone = withKitShell<
  ComponentProps<typeof DestinyAstrolabeV63>,
  DestinyAstrolabeV63Handle
>(DestinyAstrolabeV63, DESTINY_ASTROLABE_V63_PROVIDER_CHAIN, 'DestinyAstrolabeV63Standalone');

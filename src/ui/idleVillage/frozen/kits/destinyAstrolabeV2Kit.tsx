/**
 * destinyAstrolabeV2Kit
 *
 * Frozen re-export of the canonical {@link DestinyAstrolabeV2} plus its smart
 * shell. Like V1, the astrolabe only needs the skin system, so the chain is
 * minimal — the shell mounts SkinSystemProvider only when absent above.
 *
 * One-line transplant anywhere in the app:
 *
 *   import { DestinyAstrolabeV2Standalone } from '@/ui/idleVillage/frozen/kits/destinyAstrolabeV2Kit';
 *
 * Reference: src/pages/minimal-destiny-astrolabe-v2.tsx (route /minimal-destiny-astrolabe-v2)
 */

import type { ComponentProps } from 'react';
import { DestinyAstrolabeV2 } from '@/ui/idleVillage/components/destinyAstrolabeV2/DestinyAstrolabeV2';
import type { DestinyAstrolabeV2Handle } from '@/ui/idleVillage/components/destinyAstrolabeV2/DestinyAstrolabeV2';
import { createKitShell, withKitShell, type KitProviderName } from '../_infra/KitShell';

// Canonical component — re-exported, not re-implemented.
export { DestinyAstrolabeV2 } from '@/ui/idleVillage/components/destinyAstrolabeV2/DestinyAstrolabeV2';
export type {
  AstrolabeResult,
  AstrolabeSkill,
  DestinyAstrolabeV2Handle,
} from '@/ui/idleVillage/components/destinyAstrolabeV2/DestinyAstrolabeV2';

export const DESTINY_ASTROLABE_V2_PROVIDER_CHAIN: KitProviderName[] = ['SkinSystemProvider'];

/** Smart shell: mounts SkinSystemProvider only when absent above. */
export const DestinyAstrolabeV2KitShell = createKitShell(
  DESTINY_ASTROLABE_V2_PROVIDER_CHAIN,
  'DestinyAstrolabeV2KitShell',
);

/**
 * Drop-in variant: the canonical V2 astrolabe pre-wrapped in its smart shell.
 * Supports the imperative ref handle (`ref.current.roll()`).
 */
export const DestinyAstrolabeV2Standalone = withKitShell<
  ComponentProps<typeof DestinyAstrolabeV2>,
  DestinyAstrolabeV2Handle
>(DestinyAstrolabeV2, DESTINY_ASTROLABE_V2_PROVIDER_CHAIN, 'DestinyAstrolabeV2Standalone');

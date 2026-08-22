/**
 * destinyAstrolabeV8Kit
 *
 * Frozen re-export of the reduced-noise DestinyAstrolabeV8 plus its smart
 * shell. Used for the V8 test page while V1 remains the POI Quest canonical.
 *
 * One-line transplant anywhere in the app:
 *
 *   import { DestinyAstrolabeV8Standalone } from '@/ui/idleVillage/frozen/kits/destinyAstrolabeV8Kit';
 */

import type { ComponentProps } from 'react';
import { DestinyAstrolabeV8 } from '@/ui/idleVillage/components/destinyAstrolabeV8/DestinyAstrolabeV8';
import type { DestinyAstrolabeV8Handle } from '@/ui/idleVillage/components/destinyAstrolabeV8/DestinyAstrolabeV8';
import { createKitShell, withKitShell, type KitProviderName } from '../_infra/KitShell';

// Canonical V7 component — re-exported, not re-implemented.
export { DestinyAstrolabeV8 } from '@/ui/idleVillage/components/destinyAstrolabeV8/DestinyAstrolabeV8';
export type {
  AstrolabeResult,
  AstrolabeSkill,
  DestinyAstrolabeV8Handle,
} from '@/ui/idleVillage/components/destinyAstrolabeV8/DestinyAstrolabeV8';

export const DESTINY_ASTROLABE_V8_PROVIDER_CHAIN: KitProviderName[] = ['SkinSystemProvider'];

/** Smart shell: mounts SkinSystemProvider only when absent above. */
export const DestinyAstrolabeV8KitShell = createKitShell(
  DESTINY_ASTROLABE_V8_PROVIDER_CHAIN,
  'DestinyAstrolabeV8KitShell',
);

/**
 * Drop-in variant: the reduced-noise astrolabe pre-wrapped in its smart shell.
 * Supports the imperative ref handle (`ref.current.roll()`).
 */
export const DestinyAstrolabeV8Standalone = withKitShell<
  ComponentProps<typeof DestinyAstrolabeV8>,
  DestinyAstrolabeV8Handle
>(DestinyAstrolabeV8, DESTINY_ASTROLABE_V8_PROVIDER_CHAIN, 'DestinyAstrolabeV8Standalone');

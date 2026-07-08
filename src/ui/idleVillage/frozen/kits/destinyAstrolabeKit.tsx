/**
 * destinyAstrolabeKit
 *
 * Frozen re-export of the canonical {@link DestinyAstrolabe} plus its smart
 * shell. The astrolabe only needs the skin system, so the chain is minimal.
 *
 * One-line transplant anywhere in the app:
 *
 *   import { DestinyAstrolabeStandalone } from '@/ui/idleVillage/frozen/kits/destinyAstrolabeKit';
 *
 * Reference: src/pages/minimal-destiny-astrolabe.tsx (route /minimal-destiny-astrolabe)
 */

import type { ComponentProps } from 'react';
import { DestinyAstrolabe } from '@/ui/idleVillage/components/destinyAstrolabe/DestinyAstrolabe';
import type { DestinyAstrolabeHandle } from '@/ui/idleVillage/components/destinyAstrolabe/DestinyAstrolabe';
import { createKitShell, withKitShell, type KitProviderName } from '../_infra/KitShell';

// Canonical component — re-exported, not re-implemented.
export { DestinyAstrolabe } from '@/ui/idleVillage/components/destinyAstrolabe/DestinyAstrolabe';
export type {
  AstrolabeResult,
  AstrolabeSkill,
  DestinyAstrolabeHandle,
} from '@/ui/idleVillage/components/destinyAstrolabe/DestinyAstrolabe';

export const DESTINY_ASTROLABE_PROVIDER_CHAIN: KitProviderName[] = ['SkinSystemProvider'];

/** Smart shell: mounts SkinSystemProvider only when absent above. */
export const DestinyAstrolabeKitShell = createKitShell(
  DESTINY_ASTROLABE_PROVIDER_CHAIN,
  'DestinyAstrolabeKitShell'
);

/**
 * Drop-in variant: the canonical astrolabe pre-wrapped in its smart shell.
 * Supports the imperative ref handle (`ref.current.roll()`).
 */
export const DestinyAstrolabeStandalone = withKitShell<
  ComponentProps<typeof DestinyAstrolabe>,
  DestinyAstrolabeHandle
>(DestinyAstrolabe, DESTINY_ASTROLABE_PROVIDER_CHAIN, 'DestinyAstrolabeStandalone');

/**
 * marketKit — placeholder.
 *
 * The canonical `MarketActionCard` component is a TODO stub
 * (`src/ui/idleVillage/map/actionCards/MarketActionCard.tsx` contains only
 * `export {};`). This kit cannot be wired to a canonical component yet; the
 * `/minimal-market` page remains on its legacy surface until the canonical is
 * implemented.
 *
 * Action: implement `MarketActionCard` upstream, then revise this kit.
 */

import { createKitShell, FULL_PROVIDER_CHAIN } from '../_infra/KitShell';

/**
 * Smart shell reserved for the future canonical MarketActionCard. Chain is the
 * full canonical one (no minimal page mounts providers to infer from yet).
 */
export const MarketKitShell = createKitShell(FULL_PROVIDER_CHAIN, 'MarketKitShell');

export * from './marketKit.contract';

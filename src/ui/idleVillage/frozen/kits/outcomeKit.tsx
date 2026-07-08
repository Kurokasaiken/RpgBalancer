/**
 * outcomeKit — placeholder.
 *
 * No canonical `OutcomeModal` component exists in the codebase. The
 * `/minimal-outcome` page renders custom HTML. This kit is reserved for the
 * day a canonical OutcomeModal is implemented.
 */

import { createKitShell, FULL_PROVIDER_CHAIN } from '../_infra/KitShell';

/**
 * Smart shell reserved for the future canonical OutcomeModal. Chain is the
 * full canonical one (no minimal page mounts providers to infer from yet).
 */
export const OutcomeKitShell = createKitShell(FULL_PROVIDER_CHAIN, 'OutcomeKitShell');

export * from './outcomeKit.contract';

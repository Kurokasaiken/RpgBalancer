/**
 * Public surface of the frozen component kits.
 *
 * Consumers (`minimal-*` pages) import from here. Direct imports of internal
 * `_infra/` modules are discouraged outside the frozen subtree itself.
 *
 * Part of the Component Freezing & Certification system (see
 * src/docs/docs/plans/component_freezing_certification_plan_v2.md).
 */

export { IsolatedShowcase, type IsolatedShowcaseProps } from './_infra/IsolatedShowcase';
export * from './_infra/CanonicalDataBridge';
export {
  KitShell,
  createKitShell,
  withKitShell,
  FULL_PROVIDER_CHAIN,
  type KitProviderName,
  type KitShellProps,
} from './_infra/KitShell';
export {
  KIT_REGISTRY,
  getKitEntry,
  getContractEnforcedKits,
  type KitRegistryEntry,
  type KitStatus,
  type KitHubMeta,
} from './registry';

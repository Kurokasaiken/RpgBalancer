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
export { KIT_REGISTRY, getKitEntry, type KitRegistryEntry } from './registry';

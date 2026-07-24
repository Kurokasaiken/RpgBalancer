/**
 * worldSurfaceKit.contract
 *
 * Frozen TypeScript contract for the World Surface kit. Changes to this file
 * (props, version, defaults, subtree selector) REQUIRE a version bump and
 * re-certification.
 */

import type { ContractConfig } from '../_infra/contract';

/**
 * Frozen contract for the World Surface kit, version 1.0.0.
 */
export interface WorldSurfaceKitContract {
  /**
   * Semantic version of this contract.
   */
  version: '1.0.0';

  /** Unique kit identifier. */
  kitId: 'worldSurfaceKit';

  /**
   * The canonical reference route that renders the real component.
   * For World Surface the test harness and the public page share the same
   * route (`/world-surface`).
   */
  referenceRoute: '/world-surface';

  /**
   * Isolated route used for contract tests. World Surface has no separate
   * `/minimal-*` page, so the reference route is also the isolated route.
   */
  minimalRoute: '/world-surface';

  /**
   * Subtree selector used by contract tests to extract the world renderer.
   */
  subtreeSelector: '[data-testid="world-surface-renderer"]';
}

export const WORLD_SURFACE_KIT_VERSION: WorldSurfaceKitContract['version'] = '1.0.0';

export const WORLD_SURFACE_KIT_SUBTREE_SELECTOR: WorldSurfaceKitContract['subtreeSelector'] =
  '[data-testid="world-surface-renderer"]';

export const worldSurfaceKitContract: ContractConfig = {
  kitId: 'worldSurfaceKit',
  referenceRoute: '/world-surface',
  minimalRoute: '/world-surface',
  subtreeSelector: WORLD_SURFACE_KIT_SUBTREE_SELECTOR,
};

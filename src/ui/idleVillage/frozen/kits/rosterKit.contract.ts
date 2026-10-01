/**
 * rosterKit.contract
 *
 * Frozen TypeScript contract for the Roster kit. Changes to this file (props,
 * version, defaults) REQUIRE a version bump and re-certification.
 *
 * The contract intentionally narrows {@link VillageRosterSectionProps} to the
 * shape exercised by the `/minimal-roster` page: the canonical component
 * supports many more props, but the kit's frozen surface is the subset that
 * minimal-* depends on. Keeping the contract narrow reduces the blast radius
 * of upstream changes.
 */

import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

/**
 * Frozen contract for the Roster kit, version 1.1.0.
 *
 * 1.1.0 adds the optional `density` prop. Omitted (or `'default'`) it renders the
 * exact 1.0.0 subtree — verified byte-identical after normalization on both
 * /test and /minimal-roster. `'compact'` renders one-line resident strips for HUD
 * use (e.g. /game-frame) and is outside the /test ↔ /minimal-roster comparison.
 */
export interface RosterKitContract {
  /**
   * Props the `/minimal-roster` page passes to the canonical component.
   */
  props: {
    residents: ResidentState[];
    /**
     * Optional componentId used by the canonical component to enable sortable
     * drag. Defaults to `'minimal-roster-component'` in the page.
     */
    componentId?: string;
    /** `'compact'` = one-line resident strips (HUD). Default keeps the 1.0.0 layout. */
    density?: 'default' | 'compact';
  };

  /**
   * Subtree selector used by contract tests to compare /test ↔ /minimal-roster.
   */
  subtreeSelector: '[data-testid="village-roster-section"]';

  /** Semantic version of this contract. */
  version: '1.1.0';
}

export const ROSTER_KIT_VERSION: RosterKitContract['version'] = '1.1.0';
export const ROSTER_KIT_SUBTREE_SELECTOR: RosterKitContract['subtreeSelector'] =
  '[data-testid="village-roster-section"]';

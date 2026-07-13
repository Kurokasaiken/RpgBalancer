/**
 * Lore Drop config types
 *
 * Defines the shape of lore drops that can be assigned to in-game entities
 * and discovered by the player. Keeps flavor text config-first and separate
 * from mechanical descriptions.
 */

export type LoreDropAssignableTo = 'quest' | 'location' | 'building' | 'character' | 'item';

export type LoreDropCategory =
  | 'history'
  | 'faction'
  | 'location'
  | 'character'
  | 'item'
  | 'curio';

export interface LoreDrop {
  id: string;
  /** i18n key (e.g. `lore:history.ashesOath.title`) used to resolve the title. */
  titleKey: string;
  /** i18n key (e.g. `lore:history.ashesOath.body`) used to resolve the body. */
  bodyKey: string;
  /** @deprecated legacy title; prefer `titleKey` + `t()`. */
  title?: string;
  /** @deprecated legacy body; prefer `bodyKey` + `t()`. */
  body?: string;
  category: LoreDropCategory;
  /** Which entity types this drop can be attached to. */
  assignableTo: LoreDropAssignableTo[];
  /** Tags used to match the drop with an entity (e.g. ['combat'], ['forest']). */
  tags?: string[];
  /** Relative weight used when randomly picking among matching candidates. */
  weight?: number;
}

export interface LoreDropAssignment {
  loreDropId: string;
  entityId: string;
  entityType: LoreDropAssignableTo;
  assignedAt: number;
  discovered: boolean;
  discoveredAt?: number;
}

export interface LoreDropState {
  /** Assigned drops keyed by entity id. */
  assigned: Record<string, LoreDropAssignment>;
  /** Ordered list of discovered lore drop ids. */
  discoveredIds: string[];
  /** Whether the persisted state has been loaded. */
  loaded: boolean;
}

export const DEFAULT_LORE_DROP_STATE: LoreDropState = {
  assigned: {},
  discoveredIds: [],
  loaded: false,
};

export interface LoreDropEntity {
  id: string;
  type: LoreDropAssignableTo;
  tags?: string[];
}

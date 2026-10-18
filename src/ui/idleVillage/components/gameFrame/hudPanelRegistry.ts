/**
 * Every floating panel that can be closed and reopened lives here, and the "Panels" menu is generated
 * from this list: add a panel by adding one row (plus its `gameFrame.panels.names.<id>` string in both locales;
 * a guard test fails when one is missing). `devOnly` panels are test instruments: the menu only offers them
 * in dev builds. `unlisted` panels are real panels driven by code (the quest window by its POI, the hero sheet by
 * the roster rail) but have no menu entry and no key: Director 2026-10-16, «nn dovrebbero esistere» (PLAN-043 T1.3).
 */
export const HUD_PANELS = [
  // Nothing opens with the map: the player summons every panel by key or menu.
  { id: 'roster', shortcut: 'r', defaultVisible: false },
  { id: 'events', shortcut: 'e', defaultVisible: false },
  { id: 'quest', shortcut: 'q', defaultVisible: false, unlisted: true },
  // PLAN-043 WS-2: the quest planner is a stage-managed centerStage occupant —
  // opened by a POI click (unlisted, no key), closed by its X or the regime flip.
  { id: 'questDetail', shortcut: 'o', defaultVisible: false, unlisted: true },
  // PLAN-032 SP-1: the hero sheet — the Panels menu/shortcut path is its `sticky` source.
  { id: 'heroSheet', shortcut: 'p', defaultVisible: false, unlisted: true },
  // PLAN-032 SP-2: the village stash mock — menu/shortcut toggle; its map marker only opens/focuses.
  { id: 'villageStash', shortcut: 'v', defaultVisible: false },
  // PLAN-032 SP-3: the merchant mock — same open/focus convention as the stash marker.
  { id: 'merchant', shortcut: 'm', defaultVisible: false },
  { id: 'director', shortcut: 'd', defaultVisible: false, devOnly: true },
  { id: 'tuning', shortcut: 't', defaultVisible: false, devOnly: true },
] as const;

export type HudPanelId = (typeof HUD_PANELS)[number]['id'];

export const HUD_PANEL_SHORTCUTS = Object.fromEntries(HUD_PANELS.map((p) => [p.id, p.shortcut])) as Record<HudPanelId, string>;
export const HUD_PANEL_DEFAULTS = Object.fromEntries(HUD_PANELS.map((p) => [p.id, p.defaultVisible])) as Record<HudPanelId, boolean>;
export const HUD_PANEL_DEV_ONLY = new Set<HudPanelId>(HUD_PANELS.filter((p) => 'devOnly' in p && p.devOnly).map((p) => p.id));

/** Panels without a menu entry or a key (see the registry note). */
export const HUD_PANEL_UNLISTED = new Set<HudPanelId>(HUD_PANELS.filter((p) => 'unlisted' in p && p.unlisted).map((p) => p.id));
/** Panels the player can summon: the menus list exactly these. */
export const isHudPanelListed = (id: HudPanelId) => !HUD_PANEL_UNLISTED.has(id);
/** Key → panel, for listed panels only. */
export const HUD_PANEL_KEY_TO_ID: Readonly<Record<string, HudPanelId>> = Object.fromEntries(
  HUD_PANELS.filter((p) => !('unlisted' in p && p.unlisted)).map((p) => [p.shortcut, p.id]),
);

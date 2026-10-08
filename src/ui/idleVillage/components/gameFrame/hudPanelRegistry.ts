/**
 * Every floating panel that can be closed and reopened lives here, and the "Panels" menu is generated
 * from this list: add a panel by adding one row (plus its `gameFrame.panels.names.<id>` string in both locales;
 * a guard test fails when one is missing). `devOnly` panels are test instruments: the menu only offers them
 * in dev builds.
 */
export const HUD_PANELS = [
  { id: 'roster', shortcut: 'r', defaultVisible: true },
  { id: 'events', shortcut: 'e', defaultVisible: true },
  { id: 'director', shortcut: 'd', defaultVisible: true, devOnly: true },
  { id: 'tuning', shortcut: 't', defaultVisible: false, devOnly: true },
] as const;

export type HudPanelId = (typeof HUD_PANELS)[number]['id'];

export const HUD_PANEL_SHORTCUTS = Object.fromEntries(HUD_PANELS.map((p) => [p.id, p.shortcut])) as Record<HudPanelId, string>;
export const HUD_PANEL_DEFAULTS = Object.fromEntries(HUD_PANELS.map((p) => [p.id, p.defaultVisible])) as Record<HudPanelId, boolean>;
export const HUD_PANEL_DEV_ONLY = new Set<HudPanelId>(HUD_PANELS.filter((p) => 'devOnly' in p && p.devOnly).map((p) => p.id));

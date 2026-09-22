/**
 * GameFrame — structural configuration.
 *
 * `GameFrame` (`src/ui/idleVillage/components/gameFrame/GameFrame.tsx`) is the
 * persistent game shell: topbar, left roster rail, center viewport (the map
 * lives here as a child, not as the frame itself), right activity rail, and a
 * bottom status bar. This module owns every structural number the shell
 * reads — nothing is hardcoded in the component.
 *
 * The three-region layout (map center / roster left / HUD+clock top) is
 * `DESIGN_PILLARS.md` §3.1 R1.1, already approved direction, not a new
 * decision. The concrete pixel values below are read out of the reference
 * mockup `public/wanderlust-mockup.html` ("Wanderlust — Game Layout") as
 * defaults, not frozen constants — tune here, never in the component.
 */

import { z } from 'zod';

const gameFrameLayoutSchema = z.object({
  /** Topbar height (logo, nav, resources, clock). */
  topBarHeightPx: z.number().positive(),
  /** Bottom status bar height. */
  statusBarHeightPx: z.number().positive(),
  /** Left roster rail width. */
  rosterRailWidthPx: z.number().positive(),
  /** Right activity/quest rail width. */
  questRailWidthPx: z.number().positive(),
  /** Center viewport header height (location title band). */
  centerHeaderHeightPx: z.number().positive(),
});

const gameFrameNavItemSchema = z.object({
  id: z.string(),
  /** i18n key resolved by the caller — GameFrame renders whatever string it is given. */
  labelKey: z.string(),
  icon: z.string(),
  /** Not yet a real destination — rendered dim and inert (DESIGN_PILLARS §4 R4.2 diegetic gating). */
  locked: z.boolean(),
});

const gameFrameConfigSchema = z.object({
  layout: gameFrameLayoutSchema,
  /** Default nav rail. Only unlocked ids are expected to have working content. */
  navItems: z.array(gameFrameNavItemSchema),
});

export type GameFrameLayoutConfig = z.infer<typeof gameFrameLayoutSchema>;
export type GameFrameNavItemConfig = z.infer<typeof gameFrameNavItemSchema>;
export type GameFrameConfig = z.infer<typeof gameFrameConfigSchema>;

const RAW_DEFAULT_GAME_FRAME_CONFIG: GameFrameConfig = {
  layout: {
    topBarHeightPx: 44,
    statusBarHeightPx: 38,
    rosterRailWidthPx: 280,
    questRailWidthPx: 260,
    centerHeaderHeightPx: 52,
  },
  navItems: [
    { id: 'village', labelKey: 'gameFrame.nav.village', icon: '🏘', locked: false },
    { id: 'map', labelKey: 'gameFrame.nav.map', icon: '🗺', locked: false },
    { id: 'workshop', labelKey: 'gameFrame.nav.workshop', icon: '⚒', locked: true },
    { id: 'tavern', labelKey: 'gameFrame.nav.tavern', icon: '🍺', locked: true },
  ],
};

/** Validated, safe-default structural config for `GameFrame`. */
export const DEFAULT_GAME_FRAME_CONFIG: GameFrameConfig = gameFrameConfigSchema.parse(
  RAW_DEFAULT_GAME_FRAME_CONFIG,
);

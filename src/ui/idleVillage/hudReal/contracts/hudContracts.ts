/**
 * HUD content contracts (PLAN-112 F2): what each blueprint slot is given, which states it can show and how it behaves.
 * Types and constants only, no components. Real data sources are named in the docs of each contract
 * (`.mw/specs/hud-real/CONTENT-CONTRACTS.md`); mechanics are never changed from here.
 */
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { ResourceReadoutItem } from '@/ui/idleVillage/components/gameFrame/ResourceReadout';
import type { GameFrameNavItemConfig } from '@/balancing/config/idleVillage/gameFrameConfig';
import type { HudPanelId } from '@/ui/idleVillage/components/gameFrame/hudPanelRegistry';
import type { HudTone } from '@/ui/idleVillage/components/gameFrame/hudTones';

/** The blueprint slots (layout/hudLayoutB.ts `SLOTS_B[].id`). */
export type HudSlotId = 'crest' | 'roster' | 'rosterOpen' | 'time' | 'resources' | 'panel' | 'nav' | 'commands' | 'voce' | 'toast';

/** Interaction state every interactive HUD element can show; derived from one image/shape, never from separate art. */
export type HudInteractionState = 'rest' | 'hover' | 'focus' | 'active' | 'pressed' | 'disabled' | 'locked';

// ---- roster (slot `roster`): data = ResidentState[] from useRosterKitData; state via zanaraRosterState ---------------
export interface RosterMedallionView {
  residentId: string;
  /** Always set: it is also the accessible name and the plaque title. */
  name: string;
  level: number | null;
  /** 0..1, from currentHp/maxHp. Drawn as an arc on the medallion. */
  hp: number;
  /** 0..1, from 1 - fatigue/100. Shown in the plaque only. */
  stamina: number;
  /** From `zanaraRosterState`: lit / dim / iron gem, portrait treatment, interactive flag. */
  state: 'available' | 'away' | 'exhausted' | 'injured' | 'dead' | 'locked';
  /** The resident of the open run/selection: shown by halo + arc, not by the plaque (D5: no plaque open by default). */
  selected: boolean;
  /** Text spoken by screen readers: name, level, state label. */
  ariaLabel: string;
}
export interface RosterContract {
  residents: ResidentState[];
  selectedResidentId: string | null;
  lockedResidentIds: string[];
  onSelect: (residentId: string) => void;
  /** Rows visible before scrolling; the resolved slot height decides (layout `resolveSlots`). */
  maxRows: number;
}

// ---- resources (slot `resources`): data = buildResourceReadoutItems(selectResourceOutlook(state, config), t) ----------
export interface ResourcesContract {
  items: ResourceReadoutItem[];
  /** Transient "+N" chip shown inside a tile for ~2600 ms after a settlement grant (`hud.resourceDelta`). */
  delta?: { itemId: string; text: string };
}

// ---- time (slot `time`): data = WhenWhereClusterProps (currentDay, isPaused, speed) ----------------------------------
export interface TimeContract {
  /** 1-based day number already formatted by i18n ("Giorno 3"). */
  dayLabel: string;
  isDayPhase: boolean;
  /** 0..1 progress through the current phase (drives the medallion halo). */
  cycleProgress: number;
  isPaused: boolean;
  /** `timeInputLocked` of the game page: the clock cannot be changed now (quest window, menus...): controls are shown disabled. */
  locked: boolean;
  speed: { multiplier: number; available: number[]; onChange: (speed: number) => void; onTogglePause: () => void };
}

// ---- nav (slot `nav`): data = gameFrameConfig.navItems -------------------------------------------------------------
export interface NavContract {
  items: GameFrameNavItemConfig[];
  activeId: string;
  onSelect: (id: string) => void;
  /** The astrolabe: the map re-centre control (the only compass-rose motif left in the HUD). */
  onRecenter: () => void;
}

// ---- commands (slot `commands`): data = HUD panel registry + game menu ---------------------------------------------
export interface CommandsContract {
  onOpenMenu: () => void;
  onTogglePanelsMenu: () => void;
  hudHidden: boolean;
  onToggleHide: () => void;
  /** Panels listed in the "Panels" menu (isHudPanelListed), with their shortcut. */
  panels: Array<{ id: HudPanelId; shortcut: string; visible: boolean }>;
}

// ---- panel (slot `panel`): contextual, one occupant at a time ---------------------------------------------------------
export interface PanelRewardRow { kind: 'gold' | 'food' | 'wood' | 'item'; amount: number; label: string }
export interface PanelRequirementRow { icon: 'party' | 'level' | 'item' | 'time'; label: string; met: boolean }
export interface PanelContract {
  kicker?: string;
  title: string;
  body?: string;
  /** Image for the arched window; absent = the window is not drawn (never an empty glass window). */
  illustrationUrl?: string;
  rewards?: PanelRewardRow[];
  requirements?: PanelRequirementRow[];
  /** Success chance 0..100 and its mark row (victory + danger only; skulls ok; no drop %). Shown only for expedition panels. */
  seal?: { value: number; marks: Array<'win' | 'danger' | 'off'> };
  action?: { label: string; onClick: () => void; disabled?: boolean; disabledReason?: string };
}

// ---- notifications (slot `voce`): temporary --------------------------------------------------------------------------------
export interface NotificationContract {
  id: string;
  kind: 'narrative' | 'outcome' | 'alert';
  title?: string;
  text: string;
  /** Lower number = more urgent (see NOTIFICATION_PRIORITY). */
  priority: number;
  expandable: boolean;
  /** Close after this many ms; held open by hover, focus or expansion. `0`/undefined = until dismissed. */
  autoCloseMs?: number;
  onDismiss: () => void;
  tone?: HudTone;
}

/** Collision priority of transient content, most urgent first (E-15). */
export const NOTIFICATION_PRIORITY = { alert: 1, outcome: 2, narrative: 3 } as const;
/** At most this many transient items are visible together; the others wait in order of priority, then arrival. */
export const MAX_VISIBLE_NOTIFICATIONS = 2;

/** Panels that share the single contextual slot on the right (one at a time; opening another replaces the open one). */
export const SLOT_PANELS: HudPanelId[] = ['events', 'heroSheet', 'merchant', 'villageStash'];
/** Panels that live on the centre stage; they replace the side panel when they do not fit beside it (layout `fitPanel`). */
export const STAGE_PANELS: HudPanelId[] = ['quest', 'questDetail'];

/** Which interaction states each slot's elements can show (all derive from one shape; focus ring is drawn outside the art). */
export const STATE_MATRIX: Record<HudSlotId, HudInteractionState[]> = {
  crest: ['rest', 'hover', 'focus'],
  roster: ['rest', 'hover', 'focus', 'active', 'disabled', 'locked'],
  rosterOpen: ['rest', 'hover', 'focus', 'pressed', 'disabled'],
  time: ['rest', 'hover', 'focus', 'active', 'pressed'],
  resources: ['rest', 'hover', 'focus'],
  panel: ['rest', 'hover', 'focus', 'pressed', 'disabled'],
  nav: ['rest', 'hover', 'focus', 'active', 'pressed', 'locked'],
  commands: ['rest', 'hover', 'focus', 'active', 'pressed'],
  voce: ['rest', 'hover', 'focus', 'pressed'],
  toast: ['rest', 'hover', 'focus', 'pressed'],
};

/** Mode of each slot (mirrors layout SLOTS_B; a test keeps the two in step). */
export const SLOT_MODE: Record<HudSlotId, 'persistent' | 'contextual' | 'temporary'> = {
  crest: 'persistent', roster: 'persistent', rosterOpen: 'contextual', time: 'persistent', resources: 'persistent', nav: 'persistent', commands: 'persistent', panel: 'contextual', voce: 'temporary', toast: 'temporary',
};

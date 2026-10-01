/**
 * HUD signal colours, shared by every cluster that needs to say "good / careful /
 * danger". Skin tokens first, V9 values as fallbacks — same pattern as `HudRibbon`.
 */
export type HudTone = 'danger' | 'warning' | 'neutral' | 'good';

export const HUD_TONE_COLOR: Record<HudTone, string> = {
  danger: 'var(--skin-event-danger, #e07a5f)',
  warning: 'var(--skin-event-warning, #e3b04b)',
  good: 'var(--skin-event-good, #9cc38a)',
  neutral: 'var(--skin-icon-color, #dfb857)',
};

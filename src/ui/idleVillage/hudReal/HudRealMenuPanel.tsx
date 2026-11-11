/**
 * HudRealMenuPanel — the game menu's dropdown dressed in Zanara (Director 2026-11-11: «Sì, rivestilo»).
 * Surface = the signed carved plaque of the cassetto (`zanaraOrn`: thick gold frame, emerald corner clusters, deep field);
 * the menu's own rows (skin-agnostic <button>s of HudGameMenu) get enamel bands with a gold hairline, the active language
 * an emerald enamel. A view only: role, label and anchoring come from HudGameMenu's `panelProps`.
 * Sizes from `gameFrameConfig.gamePage.menu`; colours from the signed Zanara palette `Z`.
 */
import type { CSSProperties, ReactNode } from 'react';
import { DEFAULT_GAME_FRAME_CONFIG, type GameFrameConfig } from '@/balancing/config/idleVillage/gameFrameConfig';
import { OrnCorner, Z } from './zanaraOrn';

type MenuConfig = GameFrameConfig['gamePage']['menu'];

const css = (m: MenuConfig) => `
[data-hudreal-menu] { font-family: "EB Garamond", serif; }
[data-hudreal-menu] > span, [data-hudreal-menu] [role="radiogroup"] ~ span {
  font: 600 ${m.labelFontPx}px Cinzel, "EB Garamond", serif; letter-spacing: 0.22em; text-transform: uppercase;
  color: ${Z.goldHi}; text-shadow: 0 1px 2px rgba(0,0,0,.75); margin-top: 4px;
}
[data-hudreal-menu] button {
  display: flex; align-items: center; justify-content: center; gap: 12px; min-height: ${m.rowHeightPx}px; padding: 0 14px;
  font: 600 ${m.rowFontPx}px Cinzel, "EB Garamond", serif; letter-spacing: 0.1em; text-transform: uppercase; color: ${Z.ink};
  background: linear-gradient(180deg, #12302f 0%, ${Z.fieldDark} 100%);
  border: 1px solid ${Z.goldDark}; border-radius: ${m.rowRadiusPx}px; cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(240, 214, 138, .18), inset 0 -2px 6px rgba(0,0,0,.45), 0 1px 2px rgba(0,0,0,.4);
  transition: border-color 120ms, color 120ms, filter 120ms;
}
[data-hudreal-menu] button:not(:disabled):hover { border-color: ${Z.goldHi}; color: #fff3cf; filter: brightness(1.15); }
[data-hudreal-menu] button:focus { outline: none; }
[data-hudreal-menu] button:focus-visible { outline: 2px solid ${Z.goldHi}; outline-offset: 2px; }
[data-hudreal-menu] button:disabled { opacity: .45; cursor: default; }
[data-hudreal-menu] button[aria-checked="true"] {
  background: linear-gradient(180deg, ${Z.emerald} 0%, ${Z.emeraldDark} 100%); border-color: ${Z.goldHi}; color: #f4fff8;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.3), 0 0 8px rgba(47, 212, 163, .35);
}
[data-hudreal-menu] [role="radiogroup"] { display: flex; gap: 6px; }
[data-hudreal-menu] [role="radiogroup"] button { flex: 1 1 0; }
[data-hudreal-menu] > div[aria-hidden="true"] { height: 1px !important; margin: 8px 6px !important;
  background: linear-gradient(90deg, transparent, ${Z.gold}, transparent) !important; }
@media (prefers-reduced-motion: reduce) { [data-hudreal-menu] button { transition: none; } }
`;

export interface HudRealMenuPanelProps {
  children: ReactNode;
  panelProps: { role: 'menu'; 'aria-label': string; style: CSSProperties };
  menu?: MenuConfig;
}

export function HudRealMenuPanel({ children, panelProps, menu: m = DEFAULT_GAME_FRAME_CONFIG.gamePage.menu }: HudRealMenuPanelProps) {
  const { style, ...aria } = panelProps;
  return (
    <div {...aria} data-hudreal-menu="" style={{
      ...style, bottom: `calc(100% + ${m.liftPx}px)`, gap: m.gapPx, padding: `${m.padY}px ${m.padX}px`, minWidth: m.minWidthPx,
      border: `2.5px solid ${Z.gold}`, borderRadius: m.radius,
      background: `linear-gradient(180deg, ${Z.fieldHi} 0%, ${Z.field} 34%, ${Z.fieldDark} 100%)`,
      boxShadow: `inset 0 0 0 1.5px ${Z.goldDeep}, inset 0 0 26px rgba(0,0,0,.62), ${Z.shadow}`, color: Z.ink,
    }}>
      <style>{css(m)}</style>
      {(['tl', 'tr', 'bl', 'br'] as const).map((c) => <OrnCorner key={c} corner={c} />)}
      {children}
    </div>
  );
}

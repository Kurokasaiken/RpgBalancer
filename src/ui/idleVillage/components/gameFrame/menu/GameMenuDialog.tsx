/**
 * GameMenuDialog — the shell shared by the menu's screens (Load, Settings, the
 * quit / new-game confirmations). A centred `HudPlaque panel` over a veil
 * (LOAD-1 A, SET-1 A): portaled into `#game-modal-root` (T-16), Escape closes
 * only the topmost screen, and the title row carries the single Close control.
 * Buttons are the neutral HUD pills (`data-hud-controls`) — no CTA plaque while BTN-1 is open.
 */
import { createContext, useContext, useEffect, useId, useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { HudPlaque, SkinScope } from '@/ui/idleVillage/skins/primitives';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { ensureGameModalRoot } from '../questOverlays';
import { useOverlayEscape } from '../overlayStack';
import { OrnCorner, Z } from '@/ui/idleVillage/hudReal/zanaraOrn';

export interface GameMenuDialogProps {
  title: string;
  onClose: () => void;
  /** Plaque width, px. */
  width?: number;
  /** Hide the Close pill (confirmations close through their own actions). */
  hideClose?: boolean;
  children: ReactNode;
  'data-testid'?: string;
}

/**
 * Layer of the menu dialogs. In game they sit on `questCheck`; the title screen (on `boot`, above everything) provides
 * `boot + 1`, otherwise its Load / Settings / New-game screens drew UNDER the title, invisible (found 2026-11-10).
 */
export const MenuDialogLayer = createContext<number>(DEFAULT_GAME_FRAME_CONFIG.zLayers.questCheck);

/**
 * Dress of the menu screens. `skin` = the HudPlaque of the skin system (old pages, title screen); `zanara` = the signed
 * Zanara plaque of /game (Director 2026-11-11: «Sì, rivestile»). The screens' own controls are re-themed by overriding the
 * skin tokens inside the dialog, so Load, Settings, Memorial and the confirmations change together without being edited.
 */
export const MenuDialogDress = createContext<'skin' | 'zanara'>('skin');

const ZANARA_TOKENS = {
  '--skin-surface-border': Z.gold,
  '--skin-surface-base': '#12302f',
  '--skin-title-color': Z.goldHi,
  '--skin-label-primary': Z.ink,
  '--skin-text-primary': Z.ink,
  '--skin-text-secondary': Z.muted,
  '--skin-icon-accent': Z.emerald,
  '--skin-hud-lacquer-base': Z.field,
  '--skin-hud-lacquer-deep': Z.fieldDark,
  '--skin-hud-brass-hi': Z.goldHi,
  '--skin-font-display': 'Cinzel, "EB Garamond", serif',
  '--skin-font-serif': '"EB Garamond", serif',
} as Record<string, string>;

const zanaraCss = (d: (typeof DEFAULT_GAME_FRAME_CONFIG)['gamePage']['dialog']) => `
.skin-scope [data-hudreal-dialog][data-hudreal-dialog] button:not([data-skin="cta"]) {
  border-radius: ${d.controlRadiusPx}px; height: auto; min-height: ${d.controlHeightPx}px; padding: 0 14px;
  border: 1px solid ${Z.goldDark}; color: ${Z.ink};
  background: linear-gradient(180deg, #12302f 0%, ${Z.fieldDark} 100%);
  box-shadow: inset 0 1px 0 rgba(240, 214, 138, .18), inset 0 -2px 6px rgba(0,0,0,.45), 0 1px 2px rgba(0,0,0,.4);
  font-family: Cinzel, "EB Garamond", serif; text-shadow: 0 1px 2px rgba(0,0,0,.6);
}
.skin-scope [data-hudreal-dialog][data-hudreal-dialog] button:not([data-skin="cta"])::before { display: none; }
.skin-scope [data-hudreal-dialog][data-hudreal-dialog] button:not([data-skin="cta"]):hover:not(:disabled) { border-color: ${Z.goldHi}; color: #fff3cf; filter: brightness(1.15); }
.skin-scope [data-hudreal-dialog][data-hudreal-dialog] button[aria-pressed="true"],
.skin-scope [data-hudreal-dialog][data-hudreal-dialog] button[aria-checked="true"] {
  background: linear-gradient(180deg, ${Z.emerald} 0%, ${Z.emeraldDark} 100%); border-color: ${Z.goldHi}; color: #f4fff8;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.3), 0 0 8px rgba(47, 212, 163, .35);
}
.skin-scope [data-hudreal-dialog] input[type="range"] { accent-color: ${Z.emerald}; }
`;

const VEIL_STYLE: CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  background: 'color-mix(in srgb, var(--skin-hud-lacquer-deep) 72%, transparent)',
};

export function GameMenuDialog({ title, onClose, width = 700, hideClose = false, children, 'data-testid': testId }: GameMenuDialogProps) {
  const { t } = useTranslation('idleVillage');
  const id = useId();
  const focusRef = useRef<HTMLDivElement>(null);
  useOverlayEscape(`game-menu-${id}`, onClose);

  /* Focus contract: the dialog takes focus on open, the previous element gets it back on close. */
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    focusRef.current?.focus({ preventScroll: true });
    return () => previous?.focus?.({ preventScroll: true });
  }, []);

  const layer = useContext(MenuDialogLayer);
  const dress = useContext(MenuDialogDress);
  const root = ensureGameModalRoot();
  if (!root) return null;
  const closeButton = !hideClose && (
    <span data-hud-controls="" style={{ display: 'inline-flex' }}>
      <button type="button" onClick={onClose}>
        <span>{t('gameFrame.menu.close')}</span>
      </button>
    </span>
  );
  if (dress === 'zanara') {
    const d = DEFAULT_GAME_FRAME_CONFIG.gamePage.dialog;
    return createPortal(
      <SkinScope>
        <style>{zanaraCss(d)}</style>
        <div style={{ ...VEIL_STYLE, zIndex: layer, background: `color-mix(in srgb, ${Z.fieldDark} ${Math.round(d.veilAlpha * 100)}%, transparent)` }} data-testid="game-menu-veil">
          <div ref={focusRef} tabIndex={-1} style={{ outline: 'none', display: 'flex', maxHeight: 'calc(100vh - 48px)' }}>
            <section role="dialog" aria-modal="true" aria-label={title} data-testid={testId} data-hudreal-dialog=""
              style={{
                ...ZANARA_TOKENS, position: 'relative', width, maxWidth: 'calc(100vw - 48px)', maxHeight: 'calc(100vh - 48px)',
                display: 'flex', flexDirection: 'column', gap: 12, padding: `${d.padY}px ${d.padX}px`,
                border: `2.5px solid ${Z.gold}`, borderRadius: d.radius,
                background: `linear-gradient(180deg, ${Z.fieldHi} 0%, ${Z.field} 34%, ${Z.fieldDark} 100%)`,
                boxShadow: `inset 0 0 0 1.5px ${Z.goldDeep}, inset 0 0 26px rgba(0,0,0,.62), ${Z.shadow}`,
                color: Z.ink, fontFamily: '"EB Garamond", serif',
              }}>
              {(['tl', 'tr', 'bl', 'br'] as const).map((c) => <OrnCorner key={c} corner={c} />)}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <h2 style={{ flex: 1, margin: 0, font: `600 ${d.titlePx}px Cinzel, "EB Garamond", serif`, letterSpacing: '0.2em', textTransform: 'uppercase', color: Z.goldHi, textShadow: '0 1px 3px rgba(0,0,0,.75)' }}>{title}</h2>
                {closeButton}
              </div>
              <div aria-hidden="true" style={{ height: 1, background: `linear-gradient(90deg, transparent, ${Z.gold}, transparent)`, flexShrink: 0 }} />
              {children}
            </section>
          </div>
        </div>
      </SkinScope>,
      root,
    );
  }
  return createPortal(
    <SkinScope>
      <div style={{ ...VEIL_STYLE, zIndex: layer }} data-testid="game-menu-veil">
        {/* The focus target is a wrapper: HudPlaque owns its own ref (it measures itself to draw the frame). */}
        <div ref={focusRef} tabIndex={-1} style={{ outline: 'none', display: 'flex', maxHeight: 'calc(100vh - 48px)' }}>
        <HudPlaque
          shape="panel"
          as="section"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          data-testid={testId}
          style={{ width, maxWidth: 'calc(100vw - 48px)', maxHeight: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column', gap: 10, padding: '18px 20px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <h2 style={{ flex: 1, margin: 0, font: '600 16px var(--skin-font-display)', letterSpacing: '0.08em', color: 'var(--skin-title-color)' }}>{title}</h2>
            {closeButton}
          </div>
          <div aria-hidden="true" style={{ height: 1, background: 'var(--skin-surface-border)', flexShrink: 0 }} />
          {children}
        </HudPlaque>
        </div>
      </div>
    </SkinScope>,
    root,
  );
}

export default GameMenuDialog;

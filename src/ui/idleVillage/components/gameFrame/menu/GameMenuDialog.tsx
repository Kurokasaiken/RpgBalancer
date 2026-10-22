/**
 * GameMenuDialog — the shell shared by the menu's screens (Load, Settings, the
 * quit / new-game confirmations). A centred `HudPlaque panel` over a veil
 * (LOAD-1 A, SET-1 A): portaled into `#game-modal-root` (T-16), Escape closes
 * only the topmost screen, and the title row carries the single Close control.
 * Buttons are the neutral HUD pills (`data-hud-controls`) — no CTA plaque while BTN-1 is open.
 */
import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { HudPlaque, SkinScope } from '@/ui/idleVillage/skins/primitives';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { ensureGameModalRoot } from '../questOverlays';
import { useOverlayEscape } from '../overlayStack';

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

const VEIL_STYLE: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: DEFAULT_GAME_FRAME_CONFIG.zLayers.questCheck,
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

  const root = ensureGameModalRoot();
  if (!root) return null;
  return createPortal(
    <SkinScope>
      <div style={VEIL_STYLE} data-testid="game-menu-veil">
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
            {!hideClose && (
              <span data-hud-controls="" style={{ display: 'inline-flex' }}>
                <button type="button" onClick={onClose}>
                  <span>{t('gameFrame.menu.close')}</span>
                </button>
              </span>
            )}
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

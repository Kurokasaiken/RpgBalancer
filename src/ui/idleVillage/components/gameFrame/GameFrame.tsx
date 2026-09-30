import React, { type CSSProperties, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { MatericBadge, MatericButton } from '@/ui/designSystem/primitives';
import { SkinScope, SkinTitle } from '@/ui/idleVillage/skins/primitives';
import { HudRibbon } from './HudRibbon';
import { HudGlyph } from './hudIcons';
import {
  DEFAULT_GAME_FRAME_CONFIG,
  type GameFrameConfig,
  type GameFrameNavItemConfig,
} from '@/balancing/config/idleVillage/gameFrameConfig';

/**
 * GameFrame — the game's persistent shell, v3.
 *
 * v1 boxed the map in a bronze grid; v2 unboxed it but dressed every cluster
 * in uniform-radius rounded rectangles, which is the clearest "web page" tell
 * there is. v3 takes the composition of the Director's own reference mockup:
 * shaped ribbons cut at their corners, an object hung from a cord, the world
 * full-bleed underneath, and the map's *own* painted frame switched off so
 * this shell is the only frame on screen (`worldDressing.hiddenLayerIds`).
 *
 * Four clusters, one job each:
 *   top-left     — identity (who this game is)
 *   top-centre   — when and where (day, place)
 *   top-right    — what I have (resources)
 *   right edge   — what is coming (the hung tag)
 *   bottom-centre— where I can go (nav)
 *
 * The roster is deliberately NOT here. Director, 2026-09-22: "in basso a
 * sinistra ci sono i pg, non vanno bene, deve essere una cosa a parte,
 * esterna." It is not chrome and it is not a corner of the map.
 *
 * Mechanics are ours only: the reference mockup shows weather, a notification
 * bell and crystal/stone resources, none of which exist in this game — per
 * the Director, the mockup supplies composition, not mechanics.
 */
export interface GameFrameProps {
  /** Game title, already i18n-resolved by the caller. */
  title: string;
  /** Small tracked line under the title. */
  subtitle?: string;
  navItems: GameFrameNavItemConfig[];
  activeNavId: string;
  onNavSelect?: (id: string) => void;
  /** Top-centre ribbon content — day, place. */
  whenWhereSlot: ReactNode;
  /** Top-right ribbon content — the resource readout. */
  resourcesSlot: ReactNode;
  /** Right edge — the hung tag (what is coming). */
  hangingSlot?: ReactNode;
  /** Bottom-right — utility controls (speed). The corner the mockup reserves for them. */
  utilitySlot?: ReactNode;
  /** The world map (or any other view). Fills the entire frame, edge to edge. */
  children: ReactNode;
  /**
   * Optional dressing that floats directly over the map (orb, compass...),
   * between the map and the ribbons. `pointerEvents: none` is the caller's
   * responsibility — see `FloatingWorldOrnaments`.
   */
  floatingSlot?: ReactNode;
  config?: GameFrameConfig;
  className?: string;
  style?: CSSProperties;
  /**
   * `atlas` (default) is the thin, minimal-line ribbon this shell shipped
   * with. `cartographer` adds the carved-bevel weight the R-075 review asked
   * to see compared side by side ("prendere da Cartographer's Desk la
   * materialità degli oggetti"). Same structure, same slots, same config —
   * only the ribbon's own material changes, so this is a rendering choice,
   * not a second shell to maintain.
   */
  variant?: 'atlas' | 'cartographer';
}

export const GameFrame: React.FC<GameFrameProps> = ({
  title,
  subtitle,
  navItems,
  activeNavId,
  onNavSelect,
  whenWhereSlot,
  resourcesSlot,
  hangingSlot,
  utilitySlot,
  children,
  floatingSlot,
  config = DEFAULT_GAME_FRAME_CONFIG,
  className,
  style,
  variant = 'atlas',
}) => {
  const { t } = useTranslation('idleVillage');
  const inset = config.insets.edgeInsetPx;
  const bevel = variant === 'cartographer';

  return (
    <SkinScope
      className={['game-frame', className].filter(Boolean).join(' ')}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', ...style }}
    >
      {/* The world. Full-bleed, edge to edge — and the only frame on screen is this shell. */}
      <div style={{ position: 'absolute', inset: 0 }}>{children}</div>

      {/* ── Floating dressing: sits over the map, under the ribbons ── */}
      {floatingSlot != null && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 8 }}>{floatingSlot}</div>
      )}

      {/* ── Top-left: identity ──────────────────────────────────── */}
      <HudRibbon
        bevel={bevel}
        anchor="top"
        cutPx={22}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 10,
          flexDirection: 'column',
          alignItems: 'flex-start',
          padding: '8px 40px 12px 22px',
        }}
      >
        <SkinTitle level="subtitle" style={{ margin: 0, fontSize: 15, letterSpacing: '0.1em' }}>
          {title}
        </SkinTitle>
        {subtitle != null && (
          <span
            style={{
              fontFamily: 'var(--skin-font-display)',
              fontSize: 11,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: 'var(--skin-label-tertiary, #9a8246)',
              marginTop: 2,
            }}
          >
            {subtitle}
          </span>
        )}
      </HudRibbon>

      {/* ── Top-centre: when and where ──────────────────────────── */}
      <HudRibbon
        bevel={bevel}
        anchor="top"
        ornament
        style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}
      >
        {whenWhereSlot}
      </HudRibbon>

      {/* ── Top-right: what I have ──────────────────────────────── */}
      <HudRibbon
        bevel={bevel}
        anchor="top"
        cutPx={22}
        style={{ position: 'absolute', top: 0, right: 0, zIndex: 10, padding: '8px 22px 12px 40px' }}
      >
        {resourcesSlot}
      </HudRibbon>

      {/* ── Right edge: what is coming, hung from the top ribbon ── */}
      {hangingSlot != null && (
        <div style={{ position: 'absolute', top: 52, right: inset + 8, zIndex: 9 }}>{hangingSlot}</div>
      )}


      {/* ── Bottom-right: utility controls ──────────────────────── */}
      {utilitySlot != null && (
        <div style={{ position: 'absolute', bottom: inset + 8, right: inset + 8, zIndex: 10 }}>
          {utilitySlot}
        </div>
      )}

      {/* ── Bottom-centre: where I can go ───────────────────────── */}
      <HudRibbon
        bevel={bevel}
        anchor="bottom"
        cutPx={26}
        ornament
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          gap: 2,
          padding: '10px 30px 8px',
        }}
      >
        <nav aria-label={t('gameFrame.nav.ariaLabel')} style={{ display: 'flex', alignItems: 'stretch', gap: 2 }}>
          {navItems.map((item) => {
            const isActive = item.id === activeNavId;
            return (
              <MatericButton
                key={item.id}
                variant="secondary"
                disabled={item.locked}
                onClick={item.locked ? undefined : () => onNavSelect?.(item.id)}
                aria-pressed={isActive}
                title={t(item.labelKey)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  padding: '6px 18px',
                  minWidth: 40,
                  minHeight: 40,
                  fontSize: 11,
                  background: isActive ? 'rgba(28,120,132,0.28)' : 'transparent',
                  border: 'none',
                  boxShadow: isActive ? 'inset 0 -1px 0 var(--skin-title-color, #f0cf6a)' : 'none',
                  color: isActive ? 'var(--skin-title-color, #f0cf6a)' : undefined,
                }}
              >
                <HudGlyph
                  iconId={item.icon}
                  label={t(item.labelKey)}
                  size={17}
                  style={{ color: isActive ? 'var(--skin-title-color, #f0cf6a)' : 'var(--skin-icon-color, #dfb857)' }}
                />
                {t(item.labelKey)}
                {item.locked && (
                  <MatericBadge style={{ fontSize: 9, padding: '0 4px' }}>
                    {t('gameFrame.nav.locked')}
                  </MatericBadge>
                )}
              </MatericButton>
            );
          })}
        </nav>
      </HudRibbon>
    </SkinScope>
  );
};

export default GameFrame;

import React, { type CSSProperties, type ReactNode } from 'react';
import { MatericFrame, MatericGrain, MatericSurface } from '@/ui/designSystem/primitives';
import { SkinScope } from '@/ui/idleVillage/skins/primitives';
import { GameFrameTopBar, type GameFrameNavItem, type GameFrameResourceItem } from './GameFrameTopBar';
import { GameFrameStatusBar, type GameFrameStatusItem } from './GameFrameStatusBar';
import {
  DEFAULT_GAME_FRAME_CONFIG,
  type GameFrameConfig,
} from '@/balancing/config/idleVillage/gameFrameConfig';

/**
 * GameFrame — the persistent game shell.
 *
 * This is not a HUD placed *over* the map: it is the frame the game lives
 * inside, and the map is one of its children (the center viewport). Reference:
 * `public/wanderlust-mockup.html` ("Wanderlust — Game Layout") for the
 * structural register — topbar / roster rail / center viewport / activity
 * rail / status bar — reimplemented here on the project's real material
 * primitives (`MatericSurface`, `MatericFrame`) and `--skin-*` tokens instead
 * of the mockup's throwaway CSS variables.
 *
 * Three-region layout is `DESIGN_PILLARS.md` §3.1 R1.1 (already-approved
 * direction, not a new decision): map center, roster left, HUD+clock top.
 * This component is the first production implementation of that raffinamento,
 * and gives `WorldPresenceRail` (R-071) the real frame-anchored home its own
 * docblock says it has been waiting for.
 *
 * Purely presentational: every region is a slot. Callers wire live data
 * (resources, clock, roster, quests, presences) from the canonical stores —
 * see `src/pages/game-frame.tsx` for the reference wiring.
 */
export interface GameFrameProps {
  /** Logo / game title, already i18n-resolved by the caller. */
  title: string;
  /** Nav rail entries (village / map / …). Locked entries render inert. */
  navItems: GameFrameNavItem[];
  activeNavId: string;
  onNavSelect?: (id: string) => void;
  /** Topbar resource readout (gold / food / wood / …), already formatted by the caller. */
  resources: GameFrameResourceItem[];
  /** Day/night clock, typically `<DayNightTimeEngineStrip compact />`. */
  clockSlot?: ReactNode;
  /** Left rail content — the roster. */
  rosterSlot: ReactNode;
  /** Right rail content — active quests / activities. */
  questSlot: ReactNode;
  /** Center viewport contextual header (location name). */
  centerTitle?: ReactNode;
  centerSubtitle?: ReactNode;
  /**
   * Docked screen-space content over the center viewport's top edge — the
   * `WorldPresenceRail`'s intended home. Never inside the map's world box:
   * this sits in the same stacking context as the center header, so it is
   * never transformed by pan/zoom.
   */
  presenceSlot?: ReactNode;
  /** Bottom status bar entries (village level, free heroes, day, …). */
  statusItems: GameFrameStatusItem[];
  /** The center viewport content — the map (or any other view) lives here. */
  children: ReactNode;
  /** Structural sizing overrides. Defaults to `DEFAULT_GAME_FRAME_CONFIG`. */
  config?: GameFrameConfig;
  className?: string;
  style?: CSSProperties;
}

export const GameFrame: React.FC<GameFrameProps> = ({
  title,
  navItems,
  activeNavId,
  onNavSelect,
  resources,
  clockSlot,
  rosterSlot,
  questSlot,
  centerTitle,
  centerSubtitle,
  presenceSlot,
  statusItems,
  children,
  config = DEFAULT_GAME_FRAME_CONFIG,
  className,
  style,
}) => {
  const { layout } = config;

  return (
    <SkinScope
      className={['game-frame', className].filter(Boolean).join(' ')}
      style={{ position: 'relative', width: '100%', height: '100%', ...style }}
    >
      {/*
        The molding is a purely decorative overlay, a SIBLING of the real
        layout rather than its parent: `MatericFrame`'s `.mp-content` wrapper
        is a plain block box with no intrinsic height, so a flex column
        nested *inside* it cannot stretch to fill (the flex-item main-axis
        stays content-sized). Painting the frame as an absolutely-positioned,
        pointer-events-none sibling sidesteps that instead of fighting it.
      */}
      <div
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}
      >
        <MatericFrame variant="molding" style={{ width: '100%', height: '100%' }} />
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 8,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--skin-surface-base, #060f16)',
        }}
      >
        <GameFrameTopBar
          title={title}
          navItems={navItems}
          activeNavId={activeNavId}
          onNavSelect={onNavSelect}
          resources={resources}
          clockSlot={clockSlot}
          heightPx={layout.topBarHeightPx}
        />

        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: `${layout.rosterRailWidthPx}px 1fr ${layout.questRailWidthPx}px`,
            minHeight: 0,
          }}
        >
          {/* ── Left rail — Roster ─────────────────────────────────── */}
          <MatericSurface
            shape="panel"
            material="bronze"
            style={{ minHeight: 0, display: 'flex' }}
          >
            <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex' }}>
              <MatericGrain />
              <div
                data-testid="game-frame-roster-rail"
                style={{ position: 'relative', flex: 1, minHeight: 0, overflowY: 'auto' }}
              >
                {rosterSlot}
              </div>
            </div>
          </MatericSurface>

          {/* ── Center — the map (or any view) lives here ─────────── */}
          <div style={{ position: 'relative', minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
            {centerTitle != null && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  zIndex: 10,
                  pointerEvents: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: layout.centerHeaderHeightPx,
                  padding: '10px 20px 9px',
                  background: 'linear-gradient(180deg, rgba(6,15,22,0.85) 0%, transparent 100%)',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--skin-font-display)',
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '0.4em',
                    textTransform: 'uppercase',
                    color: 'var(--skin-title-color, #f0cf6a)',
                    textShadow: '0 0 20px rgba(240,207,106,0.35), 0 1px 4px rgba(0,0,0,0.9)',
                  }}
                >
                  {centerTitle}
                </div>
                {centerSubtitle != null && (
                  <div
                    style={{
                      fontSize: 11,
                      fontStyle: 'italic',
                      color: 'var(--skin-text-muted, rgba(245,242,232,0.5))',
                      marginTop: 2,
                    }}
                  >
                    {centerSubtitle}
                  </div>
                )}
              </div>
            )}

            <div
              data-testid="game-frame-center-viewport"
              style={{ position: 'absolute', inset: 0 }}
            >
              {children}
            </div>

            {presenceSlot != null && (
              <div
                data-testid="game-frame-presence-dock"
                style={{ position: 'absolute', top: 14, right: 14, zIndex: 20 }}
              >
                {presenceSlot}
              </div>
            )}
          </div>

          {/* ── Right rail — Active quests / activities ───────────── */}
          <MatericSurface
            shape="panel"
            material="bronze"
            style={{ minHeight: 0, display: 'flex' }}
          >
            <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex' }}>
              <MatericGrain />
              <div
                data-testid="game-frame-quest-rail"
                style={{ position: 'relative', flex: 1, minHeight: 0, overflowY: 'auto' }}
              >
                {questSlot}
              </div>
            </div>
          </MatericSurface>
        </div>

        <GameFrameStatusBar items={statusItems} heightPx={layout.statusBarHeightPx} />
      </div>
    </SkinScope>
  );
};

export default GameFrame;

import React, { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { MatericBadge, MatericPlaque } from '@/ui/designSystem/primitives';

export interface GameFrameNavItem {
  id: string;
  /** Already i18n-resolved label. */
  label: string;
  icon: string;
  /**
   * Not yet a real destination. Rendered dim and inert instead of clickable —
   * `DESIGN_PILLARS.md` §4 R4.2, the diegetic-gating pattern already used for
   * "solo certe cose sono cliccabili" ("Tutorial invisibile via gating"),
   * applied here instead of inventing a working screen that does not exist.
   */
  locked?: boolean;
}

export interface GameFrameResourceItem {
  id: string;
  icon: ReactNode;
  /** Accessible label, e.g. "Gold". Not rendered — the icon carries the read. */
  label: string;
  value: string | number;
}

export interface GameFrameTopBarProps {
  title: string;
  navItems: GameFrameNavItem[];
  activeNavId: string;
  onNavSelect?: (id: string) => void;
  resources: GameFrameResourceItem[];
  clockSlot?: ReactNode;
  heightPx: number;
}

export const GameFrameTopBar: React.FC<GameFrameTopBarProps> = ({
  title,
  navItems,
  activeNavId,
  onNavSelect,
  resources,
  clockSlot,
  heightPx,
}) => {
  const { t } = useTranslation('idleVillage');

  return (
    <header
      data-testid="game-frame-topbar"
      style={{
        position: 'relative',
        flexShrink: 0,
        height: heightPx,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '0 16px',
        background: 'var(--skin-footer-bg, rgba(0,0,0,0.35))',
        borderBottom: '1px solid var(--skin-separator, rgba(216,177,62,0.2))',
        boxShadow: 'inset 0 1px 0 rgba(240,207,106,0.08)',
      }}
    >
      {/* Gold hairline along the very top edge. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background:
            'linear-gradient(90deg, transparent 0%, rgba(159,110,32,0.4) 10%, var(--skin-title-color,#f0cf6a) 50%, rgba(159,110,32,0.4) 90%, transparent 100%)',
        }}
      />

      <span
        style={{
          fontFamily: 'var(--skin-font-display)',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          background: 'var(--skin-title-gradient)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'var(--skin-title-shadow)',
          paddingRight: 24,
          borderRight: '1px solid var(--skin-separator, rgba(216,177,62,0.2))',
        }}
      >
        {title}
      </span>

      <nav style={{ display: 'flex', height: '100%' }} aria-label={t('gameFrame.nav.ariaLabel')}>
        {navItems.map((item) => {
          const isActive = item.id === activeNavId;
          return (
            <button
              key={item.id}
              type="button"
              disabled={item.locked}
              onClick={item.locked ? undefined : () => onNavSelect?.(item.id)}
              aria-pressed={isActive}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                height: '100%',
                padding: '0 18px',
                background: isActive ? 'rgba(255,255,255,0.025)' : 'transparent',
                border: 'none',
                borderRight: '1px solid rgba(255,255,255,0.04)',
                fontFamily: 'var(--skin-font-display)',
                fontSize: 8,
                letterSpacing: '0.26em',
                textTransform: 'uppercase',
                color: item.locked
                  ? 'var(--skin-text-muted, rgba(245,242,232,0.35))'
                  : isActive
                    ? 'var(--skin-title-color, #f0cf6a)'
                    : 'var(--skin-label-tertiary, #9a8246)',
                cursor: item.locked ? 'not-allowed' : 'pointer',
                position: 'relative',
              }}
            >
              <span aria-hidden="true" style={{ fontSize: 13, lineHeight: 1 }}>
                {item.icon}
              </span>
              {item.label}
              {item.locked && (
                <MatericBadge style={{ fontSize: 6, padding: '1px 5px' }}>
                  {t('gameFrame.nav.locked')}
                </MatericBadge>
              )}
              {isActive && !item.locked && (
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: '15%',
                    right: '15%',
                    height: 1,
                    background:
                      'linear-gradient(90deg, transparent, var(--skin-title-color,#f0cf6a), transparent)',
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        {resources.map((res) => (
          <MatericPlaque
            key={res.id}
            role="status"
            aria-label={res.label}
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9 }}
          >
            <span aria-hidden="true" style={{ fontSize: 13 }}>
              {res.icon}
            </span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{res.value}</span>
          </MatericPlaque>
        ))}

        {clockSlot != null && (
          <div
            style={{
              paddingLeft: 12,
              borderLeft: '1px solid var(--skin-separator, rgba(216,177,62,0.2))',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {clockSlot}
          </div>
        )}
      </div>
    </header>
  );
};

export default GameFrameTopBar;

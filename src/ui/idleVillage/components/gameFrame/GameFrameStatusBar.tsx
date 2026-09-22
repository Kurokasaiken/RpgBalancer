import React, { type ReactNode } from 'react';

export interface GameFrameStatusItem {
  id: string;
  icon?: ReactNode;
  /** Pre-formatted content, e.g. `<>{t('gameFrame.status.day')} <b>{currentDay}</b></>`. */
  content: ReactNode;
  /** Pushes this item (and everything after it) to the right edge. */
  alignEnd?: boolean;
}

export interface GameFrameStatusBarProps {
  items: GameFrameStatusItem[];
  heightPx: number;
}

/**
 * Bottom status ticker — village level, free heroes, current day, next
 * presence, etc. Read-only, low-emphasis: precision that supplements what the
 * world/topbar already communicate, never the primary read.
 */
export const GameFrameStatusBar: React.FC<GameFrameStatusBarProps> = ({ items, heightPx }) => {
  const firstEndIndex = items.findIndex((item) => item.alignEnd);

  return (
    <footer
      data-testid="game-frame-statusbar"
      style={{
        position: 'relative',
        flexShrink: 0,
        height: heightPx,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 16,
        background: 'var(--skin-footer-bg, rgba(0,0,0,0.35))',
        borderTop: '1px solid var(--skin-separator, rgba(216,177,62,0.15))',
        boxShadow: '0 -2px 20px rgba(0,0,0,0.5)',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 1,
          background:
            'linear-gradient(90deg, transparent, rgba(159,110,32,0.5), var(--skin-title-color,#f0cf6a), rgba(159,110,32,0.5), transparent)',
        }}
      />

      {items.map((item, i) => (
        <React.Fragment key={item.id}>
          {i === firstEndIndex && <div style={{ marginLeft: 'auto' }} />}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontFamily: 'var(--skin-font-display)',
              fontSize: 7,
              letterSpacing: '0.12em',
              color: 'var(--skin-label-tertiary, #9a8246)',
              whiteSpace: 'nowrap',
            }}
          >
            {item.icon != null && (
              <span aria-hidden="true" style={{ fontSize: 12 }}>
                {item.icon}
              </span>
            )}
            {item.content}
          </div>
          {i < items.length - 1 && i !== firstEndIndex - 1 && (
            <div
              aria-hidden="true"
              style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.06)' }}
            />
          )}
        </React.Fragment>
      ))}
    </footer>
  );
};

export default GameFrameStatusBar;

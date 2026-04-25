import { useId, useMemo, useState } from 'react';
import type { JSX } from 'react';

export interface GameplayFooterProps {
  isPaused: boolean;
  speedMultiplier: number;
  onPauseToggle: () => void;
  onSpeedChange: (multiplier: number) => void;
  onReset: () => void;
  speedOptions?: number[];
}

interface ControlButtonProps {
  label: string;
  helper?: string;
  active?: boolean;
  intent?: 'primary' | 'accent' | 'critical';
  onClick: () => void;
  ariaPressed?: boolean;
  children?: JSX.Element | string;
  ariaLabel?: string;
}

const intentStyles: Record<NonNullable<ControlButtonProps['intent']>, { background: string; color: string; border: string }> = {
  primary: {
    background: 'var(--panel-surface, rgba(8,10,15,0.75))',
    color: 'var(--text-primary, #f7f2d8)',
    border: 'var(--panel-border, rgba(255,255,255,0.2))',
  },
  accent: {
    background: 'var(--accent-color, #f59e0b)',
    color: '#050509',
    border: 'var(--accent-color, #f59e0b)',
  },
  critical: {
    background: 'rgba(239, 68, 68, 0.15)',
    color: 'var(--color-crimson, #ef4444)',
    border: 'var(--color-crimson, #ef4444)',
  },
};

function ControlButton({ label, helper, active, intent = 'primary', onClick, ariaPressed, children, ariaLabel }: ControlButtonProps) {
  const palette = intentStyles[intent];
  const background = active ? palette.background : 'rgba(255,255,255,0.04)';
  const borderColor = active ? palette.border : 'var(--panel-border, rgba(255,255,255,0.12))';
  const textColor = active ? palette.color : 'var(--text-primary, #f7f2d8)';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ariaPressed}
      aria-label={ariaLabel}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '12px 16px',
        borderRadius: 18,
        border: `1px solid ${borderColor}`,
        background,
        color: textColor,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontWeight: 600,
        fontSize: 12,
        cursor: 'pointer',
        minWidth: 120,
        boxShadow: active ? '0 20px 35px rgba(0,0,0,0.35)' : 'none',
        transition: 'transform 160ms ease, border-color 160ms ease',
      }}
      onFocus={(e) => {
        e.currentTarget.style.outline = `2px solid var(--halo-color, rgba(255,255,255,0.35))`;
        e.currentTarget.style.outlineOffset = '2px';
      }}
      onBlur={(e) => {
        e.currentTarget.style.outline = 'none';
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <span>{label}</span>
      {helper && <span style={{ fontSize: 10, letterSpacing: '0.2em', opacity: 0.7 }}>{helper}</span>}
      {children && <div style={{ fontSize: 20 }}>{children}</div>}
    </button>
  );
}

function ResetDialog({ isOpen, onConfirm, onCancel, descriptionId }: { isOpen: boolean; onConfirm: () => void; onCancel: () => void; descriptionId: string }) {
  if (!isOpen) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-describedby={descriptionId}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(2,4,9,0.85)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 50,
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        style={{
          width: 'min(420px, 90vw)',
          borderRadius: 24,
          border: '1px solid var(--color-crimson, #ef4444)',
          padding: '24px 28px',
          background: 'rgba(5,6,9,0.92)',
          boxShadow: '0 30px 60px rgba(0,0,0,0.55)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary, #f7f2d8)' }}>Reset Simulation?</p>
        <p id={descriptionId} style={{ margin: 0, fontSize: 14, color: 'var(--text-muted, rgba(226,232,240,0.7))' }}>
          This will revert the village to the latest persisted snapshot. All unsaved progress will be lost.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              color: 'var(--text-primary, #f7f2d8)',
              border: '1px solid var(--panel-border, rgba(255,255,255,0.25))',
              borderRadius: 12,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '10px 18px',
              background: 'var(--color-crimson, #ef4444)',
              color: '#050509',
              border: '1px solid var(--color-crimson, #ef4444)',
              borderRadius: 12,
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

export function GameplayFooter({
  isPaused,
  speedMultiplier,
  onPauseToggle,
  onSpeedChange,
  onReset,
  speedOptions = [1, 2, 5],
}: GameplayFooterProps): JSX.Element {
  const [showResetDialog, setShowResetDialog] = useState(false);
  const confirmDescriptionId = useId();

  const orderedSpeedOptions = useMemo(
    () => [...speedOptions].sort((a, b) => a - b),
    [speedOptions]
  );

  return (
    <footer
      aria-label="Gameplay controls"
      style={{
        padding: '18px 24px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '1px solid var(--panel-border, rgba(255,255,255,0.12))',
      }}
    >
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <ControlButton
          label={isPaused ? 'Resume' : 'Pause'}
          helper={isPaused ? 'Resume Simulation' : 'Freeze Time'}
          intent="accent"
          active
          onClick={onPauseToggle}
          ariaLabel={isPaused ? 'Resume gameplay' : 'Pause gameplay'}
        >
          {isPaused ? '▶' : '⏸'}
        </ControlButton>

        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
          role="group"
          aria-label="Speed controls"
        >
          {orderedSpeedOptions.map((speed) => (
            <ControlButton
              key={speed}
              label={`${speed}x`}
              helper={speed === 1 ? 'Normal' : speed > 1 ? 'Boost' : 'Slow'}
              active={speedMultiplier === speed}
              onClick={() => onSpeedChange(speed)}
              ariaPressed={speedMultiplier === speed}
              ariaLabel={`Set speed to ${speed}x`}
            />
          ))}
        </div>
      </div>

      <ControlButton
        label="Reset"
        helper="Restore snapshot"
        intent="critical"
        onClick={() => setShowResetDialog(true)}
        ariaLabel="Reset simulation"
      >
        {'⟲'}
      </ControlButton>

      <ResetDialog
        isOpen={showResetDialog}
        descriptionId={confirmDescriptionId}
        onConfirm={() => {
          setShowResetDialog(false);
          onReset();
        }}
        onCancel={() => setShowResetDialog(false)}
      />

      <span
        aria-live="polite"
        style={{
          width: '100%',
          textAlign: 'right',
          fontSize: 11,
          letterSpacing: '0.3em',
          color: 'var(--slot-helper-color, rgba(255,255,255,0.45))',
        }}
      >
        Space • Pause | R • Reset
      </span>
    </footer>
  );
}

export default GameplayFooter;

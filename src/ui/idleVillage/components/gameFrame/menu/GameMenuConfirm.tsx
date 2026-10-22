/**
 * GameMenuConfirm — the small confirmation plaque for the menu's irreversible
 * steps: leaving to the title with unsaved progress (QUIT-1 B) and starting a
 * new game over an existing one. It always says what would be lost; the
 * primary action is the safe one (save) where there is one.
 */
import type { ReactNode } from 'react';
import { GameMenuDialog } from './GameMenuDialog';

export interface GameMenuConfirmAction {
  label: string;
  onClick: () => void;
  /** The action the player most likely wants (a marker only: BTN-1, the primary-button form, is still open, so it draws like the others). */
  primary?: boolean;
  disabled?: boolean;
}

export interface GameMenuConfirmProps {
  title: string;
  onCancel: () => void;
  /** What is being decided and what would be lost. */
  children: ReactNode;
  /** Actions after Cancel, left to right. */
  actions: GameMenuConfirmAction[];
  cancelLabel: string;
  'data-testid'?: string;
}

export function GameMenuConfirm({ title, onCancel, children, actions, cancelLabel, 'data-testid': testId }: GameMenuConfirmProps) {
  return (
    <GameMenuDialog title={title} onClose={onCancel} width={500} hideClose data-testid={testId}>
      <div style={{ color: 'var(--skin-text-primary)', font: '400 15.5px/1.45 var(--skin-font-serif)', display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
      <div data-hud-controls="" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
        <button type="button" onClick={onCancel}>
          <span>{cancelLabel}</span>
        </button>
        <span style={{ flex: 1 }} />
        {actions.map((action) => (
          <button key={action.label} type="button" data-primary={action.primary ? '' : undefined} disabled={action.disabled} onClick={action.onClick}>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </GameMenuDialog>
  );
}

export default GameMenuConfirm;

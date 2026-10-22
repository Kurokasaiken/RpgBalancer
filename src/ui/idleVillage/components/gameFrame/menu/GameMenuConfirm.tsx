/**
 * GameMenuConfirm — the small confirmation plaque for the menu's irreversible
 * steps: leaving to the title with unsaved progress (QUIT-1 B) and starting a
 * new game over an existing one. It always says what would be lost; the
 * primary action is the safe one (save) where there is one.
 */
import type { ReactNode } from 'react';
import { GameMenuDialog } from './GameMenuDialog';
import { SkinButton } from '@/ui/idleVillage/skins/primitives';

export interface GameMenuConfirmAction {
  label: string;
  onClick: () => void;
  /** The one primary action (BTN-1 = A, the family plate). At most one per screen. */
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
        {actions.map((action) =>
          action.primary ? (
            <SkinButton key={action.label} variant="cta" disabled={action.disabled} onClick={action.onClick}>
              {action.label}
            </SkinButton>
          ) : (
            <button key={action.label} type="button" disabled={action.disabled} onClick={action.onClick}>
              <span>{action.label}</span>
            </button>
          ),
        )}
      </div>
    </GameMenuDialog>
  );
}

export default GameMenuConfirm;

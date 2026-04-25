import React from 'react';
import { GlassCard } from '../../atoms/GlassCard';
import { GlassButton } from '../../atoms/GlassButton';

interface ActionsBarProps {
  onReset: () => void;
  onSave: () => void;
  onSaveDefault: () => void;
  balance: number;
}

export const ActionsBar: React.FC<ActionsBarProps> = ({ onReset, onSave, onSaveDefault, balance }) => {
  const isBalanced = Math.abs(balance) <= 1;

  return (
    <GlassCard className="flex justify-between items-center">
      <div className="flex gap-4">
        <GlassButton
          variant="ghost"
          onClick={onReset}
        >
          Reset
        </GlassButton>
        <GlassButton
          variant="secondary"
          onClick={onSaveDefault}
          title="Save current configuration as default for new spells"
        >
          Save Default
        </GlassButton>
      </div>

      <GlassButton
        variant={isBalanced ? 'primary' : 'danger'}
        onClick={onSave}
        disabled={!isBalanced}
        size="lg"
        className={isBalanced ? '!bg-emerald-600 hover:!bg-emerald-500' : ''}
      >
        {isBalanced ? 'Save Spell' : `Balance Required (${balance.toFixed(2)})`}
      </GlassButton>
    </GlassCard>
  );
};

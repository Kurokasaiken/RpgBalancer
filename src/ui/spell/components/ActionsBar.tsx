import React from 'react';

interface ActionsBarProps {
  onReset: () => void;
  onSave: () => void;
  onSaveDefault: () => void;
  balance: number;
}

export const ActionsBar: React.FC<ActionsBarProps> = ({ onReset, onSave, onSaveDefault, balance }) => (
  <div className="flex justify-between items-center backdrop-blur-md bg-white/5 border border-white/10 rounded-lg p-6 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
    <div className="flex gap-4">
      <button
        onClick={onReset}
        className="px-6 py-2 bg-white/10 border border-white/20 hover:bg-white/15 hover:shadow-[0_0_12px_rgba(255,255,255,0.3)] text-white rounded transition-all"
      >
        Reset
      </button>
      <button
        onClick={onSaveDefault}
        className="px-6 py-2 bg-blue-500/20 border border-blue-400/30 hover:bg-blue-500/30 hover:shadow-[0_0_12px_rgba(59,130,246,0.3)] text-blue-200 rounded transition-all"
        title="Save current configuration as default for new spells"
      >
        Save Default
      </button>
    </div>
    <button
      onClick={onSave}
      disabled={Math.abs(balance) > 1}
      className={`px-8 py-3 rounded font-bold text-lg transition-all ${Math.abs(balance) > 1
        ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/10'
        : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_0_16px_rgba(52,211,153,0.6)] hover:shadow-[0_0_24px_rgba(52,211,153,0.8)]'
        }`}
    >
      {Math.abs(balance) > 1 ? `Balance Required (${balance.toFixed(2)} ≠ 0)` : 'Save Spell'}
    </button>
  </div>
);

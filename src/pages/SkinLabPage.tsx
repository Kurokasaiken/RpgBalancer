import React, { useState } from 'react';
import { Slot } from '@/ui/idleVillage/components/Slot';
import { V9TooltipProvider } from '@/ui/v9-skin/V9Tooltip';

const SLOT_STATES = ['empty', 'occupied', 'locking'] as const;

const SkinLabPage: React.FC = () => {
  const [letter, setLetter] = useState('A');
  const [slotStateIndex, setSlotStateIndex] = useState(1);

  const handleLetterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value.toUpperCase().slice(0, 1);
    setLetter(next || 'A');
  };

  const handleStateChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSlotStateIndex(Number(event.target.value));
  };

  return (
    <V9TooltipProvider>
      <div className="skin-lab" data-testid="skin-lab-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap');
        .skin-lab {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 40px;
          background: radial-gradient(circle at 50% 20%, #1a1a1d, #050506 75%);
          color: #f5e6c6;
          padding: 48px;
        }
        .skin-lab__controls {
          display: flex;
          gap: 24px;
          align-items: center;
          background: rgba(12, 12, 18, 0.85);
          padding: 16px 28px;
          border-radius: 999px;
          border: 1px solid rgba(255, 208, 120, 0.25);
          box-shadow: 0 18px 32px rgba(0,0,0,0.55);
        }
        .skin-lab__controls label {
          display: flex;
          flex-direction: column;
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(245, 230, 198, 0.72);
          gap: 6px;
        }
        .skin-lab__controls input,
        .skin-lab__controls select {
          background: rgba(6, 6, 12, 0.9);
          color: #ffe3af;
          border: 1px solid rgba(255, 208, 120, 0.3);
          border-radius: 999px;
          padding: 8px 16px;
          font-size: 16px;
          text-align: center;
        }
      `}</style>
      <div className="skin-lab__controls">
        <label>
          Slot Letter
          <input
            value={letter}
            maxLength={1}
            onChange={handleLetterChange}
            aria-label="Slot letter"
          />
        </label>
        <label>
          State
          <select value={slotStateIndex} onChange={handleStateChange} aria-label="Slot state">
            {SLOT_STATES.map((slotState, index) => (
              <option key={slotState} value={index}>
                {slotState}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Slot
        tooltip={`Slot: ${SLOT_STATES[slotStateIndex]}`}
        slotProps={{
          className: 'skin-lab__slot',
          letter,
          state: SLOT_STATES[slotStateIndex],
        }}
      />
    </div>
    </V9TooltipProvider>
  );
};

export default SkinLabPage;

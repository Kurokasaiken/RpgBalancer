/**
 * Physics Lab App
 *
 * Main React component for the Physics Lab micro-app.
 * Migrates physics-lab.html behavior into React with Style Lab tokens.
 */

import React, { useState } from 'react';
import { usePhysicsLabSync } from './hooks/usePhysicsLabSync';
import { type PhysicsPreset } from '@/ui/styleLab/config/physicsPresets';
import { TactileCard } from './components/TactileCard';
import { SunkenSlot } from './components/SunkenSlot';
import { GoldButton } from './components/GoldButton';
import { LabControlsSidebar } from './components/LabControlsSidebar';
import { FloatText } from './components/FloatText';

// Canvas component using extracted components
const PhysicsCanvas: React.FC<{ config: PhysicsPreset }> = ({ config }) => {
  const [floatTexts, setFloatTexts] = useState<Array<{ id: string; text: string; x: number; y: number }>>([]);

  const handleCardDragStart = () => {
    const id = Date.now().toString();
    setFloatTexts(prev => [...prev, { id, text: 'Lifting...', x: 80, y: 100 }]);
    setTimeout(() => {
      setFloatTexts(prev => prev.filter(t => t.id !== id));
    }, 1000);
  };

  const handleCardDrop = () => {
    const id = Date.now().toString();
    setFloatTexts(prev => [...prev, { id, text: 'Dropped!', x: 200, y: 100 }]);
    setTimeout(() => {
      setFloatTexts(prev => prev.filter(t => t.id !== id));
    }, 1000);
  };

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '32px',
      padding: '32px',
      minHeight: '400px',
      backgroundColor: '#04060a',
      borderRight: '1px solid rgba(100,80,0,0.15)',
    }}>
      <div style={{
        fontFamily: '"Cinzel", serif',
        fontSize: '7.5px',
        letterSpacing: '0.45em',
        textTransform: 'uppercase',
        color: '#3c2c20',
        textAlign: 'center',
      }}>
        Physics Lab Canvas
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '40px' }}>
        <TactileCard
          config={config}
          onDragStart={handleCardDragStart}
          onDragEnd={handleCardDrop}
        />

        <SunkenSlot
          config={config}
          label="Weapon Slot"
          onDrop={handleCardDrop}
        />
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <GoldButton config={config} icon="⚔">
          Begin Expedition
        </GoldButton>
        <GoldButton config={config} variant="secondary" icon="↩">
          Return
        </GoldButton>
      </div>

      {/* Float Text Overlays */}
      {floatTexts.map(text => (
        <FloatText
          key={text.id}
          text={text.text}
          x={text.x}
          y={text.y}
          color="#faeaaa"
          fontSize="14px"
        />
      ))}
    </div>
  );
};

/**
 * Main Physics Lab application component.
 */
export const PhysicsLabApp: React.FC = () => {
  const {
    preset: config,
    applyPreset,
    updatePreset,
  } = usePhysicsLabSync();

  const availablePresets = ['minimalFrontier', 'obsidianVault', 'blizzardRift'];

  const handleUpdateConfig = (updates: Partial<PhysicsPreset>) => {
    updatePreset(updates);
  };

  const handleApplyPreset = (presetId: string) => {
    applyPreset(presetId as 'minimalFrontier' | 'obsidianVault' | 'blizzardRift');
  };

  return (
    <div className="physics-lab-app" style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: '#04060a',
    }}>
      <div className="canvas-area" style={{ flex: 1 }}>
        <PhysicsCanvas config={config} />
      </div>
      
      <LabControlsSidebar
        config={config}
        onUpdateConfig={handleUpdateConfig}
        availablePresets={availablePresets}
        onApplyPreset={handleApplyPreset}
      />
    </div>
  );
};

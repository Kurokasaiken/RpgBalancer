import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SlotV12Renderer } from '/src/ui/idleVillage/components/SlotV12Renderer';
import { WanderlustMedalOverlay } from '/src/ui/idleVillage/components/WanderlustMedalOverlay';
import { slotV12SkinData } from '/src/ui/idleVillage/skins/converted/slotWildernessBronzeConfig';
const g: any = (slotV12SkinData as any).geometry;
const q = new URLSearchParams(location.search);
for (const [k, v] of q.entries()) if (k in g) g[k] = Number(v);
const medal = Number(q.get('medal') || 44);
const scale = Number(q.get('scale') || 3);
const keepMedal = q.get('keepMedal') === '1';
const portrait = q.get('p') || '/src/assets/portraits/giggiolillo.png';
function Slot() {
  const [state, setState] = useState<'empty' | 'occupied'>((q.get('state') as any) || 'empty');
  const [prog, setProg] = useState(0);
  useEffect(() => { (window as any).lab = { setState, setProg }; }, []);
  const showMedal = state === 'occupied';
  const extracting = prog > 0;
  return (
    <div id="slot" style={{ position: 'relative', width: 64, height: 64, transform: `scale(${scale})`, transformOrigin: '0 0' }}>
      <SlotV12Renderer variant="hud64" state={state as any} palette="hud-gold" bezelPreset="b" role="leader" pgTokenVisible={showMedal} extractionProgress={prog} />
      {showMedal && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div style={{ width: medal, height: medal, transition: 'all 560ms ease-out', opacity: extracting && !keepMedal ? 0 : 1, transform: extracting ? (keepMedal ? `scale(${1 + Math.min(prog, 1) * 0.06})` : 'scale(.75)') : 'scale(1)' }}>
            <WanderlustMedalOverlay portraitUrl={portrait} isDragging={false} sizePx={medal} gemPendant={false} />
          </div>
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById('root')!).render(<div style={{ padding: 20 }}><Slot /></div>);

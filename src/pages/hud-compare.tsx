import { RosterSpike } from './hud-lab/spikes/RosterSpike';
import { PanelFrameSpike } from './hud-lab/spikes/PanelFrameSpike';

/** Side-by-side comparison: chosen mockup pieces (original source regions)
 *  vs the current reconstruction spikes. Verdict page for the Director. */

function ComparePane({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{
        fontFamily: 'ui-monospace, monospace', fontSize: 11, letterSpacing: 1.2,
        color: '#9fd4e8', textTransform: 'uppercase',
        background: 'rgba(3,14,24,0.8)', border: '1px solid rgba(125,180,220,0.3)',
        borderRadius: 5, padding: '4px 10px', width: 'max-content',
      }}>{title}</div>
      <div style={{
        background: 'rgba(5,22,36,0.55)', border: '1px solid rgba(125,180,220,0.15)',
        borderRadius: 8, padding: 10, width: 'max-content',
      }}>{children}</div>
    </div>
  );
}

export default function HudComparePage() {
  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(180deg, #071a2a, #041018)',
      padding: 24, display: 'flex', gap: 40, alignItems: 'flex-start', color: '#e8f4ff',
    }}>
      <ComparePane title="Mockup — roster zanara-v2 (originale)">
        <img src="/mockups/hud-lab/attach/roster-full-src.png" alt="roster zanara-v2 originale"
          style={{ display: 'block', width: 300, height: 'auto' }} />
      </ComparePane>
      <ComparePane title="Reconstruction — spike v7 (asset generati)">
        <RosterSpike />
      </ComparePane>
      <ComparePane title="Mockup — pannello zanara-v3 (originale)">
        <img src="/mockups/hud-lab/crops/panel/zanara-v3.webp" alt="pannello zanara-v3 originale"
          style={{ display: 'block', width: 300, height: 'auto' }} />
      </ComparePane>
      <ComparePane title="Reconstruction — panel spike v1 (CSS)">
        <PanelFrameSpike />
      </ComparePane>
    </div>
  );
}

import { RosterSpike } from './hud-lab/spikes/RosterSpike';

/** Side-by-side verdict page: every selected mockup region (original source)
 *  vs the generated reconstruction asset / spike. Director eye-check page. */

const GOLD = '#d4af37';
const LABEL: React.CSSProperties = {
  fontFamily: 'ui-monospace, monospace', fontSize: 11, letterSpacing: 1.2,
  color: '#9fd4e8', textTransform: 'uppercase',
  background: 'rgba(3,14,24,0.8)', border: '1px solid rgba(125,180,220,0.3)',
  borderRadius: 5, padding: '4px 10px', width: 'max-content',
};

function Pane({ title, w, children }: { title: string; w?: number; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={LABEL}>{title}</div>
      <div style={{
        background: 'rgba(5,22,36,0.55)', border: '1px solid rgba(125,180,220,0.15)',
        borderRadius: 8, padding: 10, width: w ? w + 20 : 'max-content',
        display: 'flex', justifyContent: 'center',
      }}>{children}</div>
    </div>
  );
}

function Pair({ name, left, right }: { name: string; left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
      <div style={{
        position: 'absolute', marginTop: -22, marginLeft: 4, fontFamily: 'ui-monospace, monospace',
        fontSize: 12, letterSpacing: 2, color: GOLD, textTransform: 'uppercase',
      }}>{name}</div>
      {left}
      {right}
    </div>
  );
}

const img = (src: string, w: number, alt: string) => (
  <img src={src} alt={alt} draggable={false} style={{ display: 'block', width: w, height: 'auto' }} />
);

export default function HudComparePage() {
  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(180deg, #071a2a, #041018)',
      padding: '48px 24px 24px', display: 'flex', flexDirection: 'column', gap: 56, color: '#e8f4ff',
    }}>
      <Pair name="Composizione intera — mockup zanara vs ricostruzione live"
        left={<Pane title="mockup originale (zanara-v2)" w={700}>
          <img src="/mockups/hud-lab/sources/zanara-v2.png" alt="mockup zanara-v2 intero" draggable={false}
            style={{ display: 'block', width: 700, height: 'auto' }} />
        </Pane>}
        right={<Pane title="/hud-compose live (scaled 0.44)" w={700}>
          <iframe src="/hud-compose" title="hud-compose live" scrolling="no"
            style={{ width: 1600, height: 900, border: 0, transform: 'scale(0.4375)', transformOrigin: 'top left', pointerEvents: 'none' }} />
        </Pane>} />

      <Pair name="Roster — zanara-v2"
        left={<Pane title="originale" w={300}>{img('/mockups/hud-lab/attach/roster-full-src.png', 300, 'roster originale')}</Pane>}
        right={<Pane title="spike v7 (asset generati + montati)"><RosterSpike /></Pane>} />

      <Pair name="Pannello contestuale — zanara-v3"
        left={<Pane title="originale" w={300}>{img('/mockups/hud-lab/crops/panel/zanara-v3.webp', 300, 'pannello originale')}</Pane>}
        right={<Pane title="asset generato (frame alabastro)" w={340}>{img('/mockups/hud-lab/attach/panel-alabastro-alpha.png', 340, 'frame alabastro generato')}</Pane>} />

      <Pair name="Nav bar — zanara-v1"
        left={<Pane title="originale" w={360}>{img('/mockups/hud-lab/crops/nav/zanara-v1.webp', 360, 'nav originale')}</Pane>}
        right={<Pane title="asset generato (plinth + astrolabio + socket)" w={520}>{img('/mockups/hud-lab/attach/nav-plinth-alpha.png', 520, 'nav plinth generato')}</Pane>} />

      <Pair name="Barra risorse — zanara-v3"
        left={<Pane title="originale" w={360}>{img('/mockups/hud-lab/crops/resources/zanara-v3.webp', 360, 'risorse originale')}</Pane>}
        right={<Pane title="asset generato" w={520}>{img('/mockups/hud-lab/attach/resources-bar-alpha.png', 520, 'resources bar generato')}</Pane>} />

      <Pair name="Angolo basso-sx — zanara-v1"
        left={<Pane title="originale" w={240}>{img('/mockups/hud-lab/crops/cornerBL/zanara-v1.webp', 240, 'corner BL originale')}</Pane>}
        right={<Pane title="asset generato (sestante + placca coordinate)" w={240}>{img('/mockups/hud-lab/attach/corner-bl-alpha.png', 240, 'corner BL generato')}</Pane>} />

      <Pair name="Angolo basso-dx — board-breakdown"
        left={<Pane title="originale" w={280}>{img('/mockups/hud-lab/crops/cornerBR/board-breakdown.webp', 280, 'corner BR originale')}</Pane>}
        right={<Pane title="asset generato (cluster roundels)" w={280}>{img('/mockups/hud-lab/attach/corner-br-alpha.png', 280, 'corner BR generato')}</Pane>} />

      <Pair name="Sigillo vittoria — mockup1-classic"
        left={<Pane title="originale" w={260}>{img('/mockups/hud-lab/crops/seal/mockup1-classic.webp', 260, 'seal originale')}</Pane>}
        right={<Pane title="asset generato (repair smeraldi)" w={260}>{img('/mockups/hud-lab/attach/seal-alpha.png', 260, 'seal generato')}</Pane>} />
    </div>
  );
}

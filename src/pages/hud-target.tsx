import { useEffect, useState } from 'react';
import { PixiWorldMap } from '@/ui/idleVillage/pixiSpike/PixiWorldMap';

/**
 * HUD Zanara target board. The REAL /game slots (boxes measured by
 * scripts/measure-hud-slots.mjs at 1600x900, plus the slots fixed by rulings
 * that are not built yet) with the Director-selected mockup crop placed in
 * each one as REFERENCE ONLY. Shows coverage, gaps and ruling conflicts.
 */

const MAP_MANIFEST = '/assets/world/mappa2/base/manifest.json';
const CROPS = '/mockups/hud-lab/crops/';
const DESIGN_W = 1600;
const DESIGN_H = 900;

type Coverage = 'copre' | 'parziale' | 'manca';
type Scene = 'riposo' | 'aperti';

type Slot = {
  id: string;
  title: string;
  scene: Scene;
  box: [number, number, number, number];
  /** real = measured on /game; ruling = position fixed by a ruling, component not built yet */
  origin: 'real' | 'ruling';
  ref?: string;
  coverage: Coverage;
  content: string;
  conflicts: string[];
};

const SLOTS: Slot[] = [
  {
    id: 'time', title: 'Emblema + tempo (ala sinistra)', scene: 'riposo', box: [20, 0, 294, 73], origin: 'real',
    ref: 'brand/board-palette.webp', coverage: 'parziale',
    content: 'Emblema (D-1, solo emblema) · GIORNO n · regolo velocità pausa/×1/×2/×4 a tacche con perla',
    conflicts: ['Il mockup ha una placca WANDERLUST: D-1 la vieta in HUD', 'Nessun mockup mostra il regolo velocità (hud-tabs-3)'],
  },
  {
    id: 'next-event', title: 'Cartiglio evento (centro)', scene: 'riposo', box: [640, 0, 320, 88], origin: 'ruling',
    coverage: 'manca',
    content: 'Prossimo evento, sempre presente, stato vuoto (topbar-1, hud-tabs-4)',
    conflicts: ['Nessun riferimento nei mockup: va progettato dalle regole di famiglia'],
  },
  {
    id: 'resources', title: 'Risorse (ala destra)', scene: 'riposo', box: [1220, 0, 360, 73], origin: 'real',
    ref: 'resources/busts-voce.webp', coverage: 'parziale',
    content: 'ORO · CIBO n/max, tasso/giorno, stato critico («Carestia») · LEGNA — chip a larghezza fissa',
    conflicts: ['Anatomia da busts-voce: icona + valore + etichetta sotto', 'Mockup: 4 risorse generiche (pietra, essenza) — noi oro/cibo/legna', 'Manca lo stato critico multicanale'],
  },
  {
    id: 'roster-closed', title: 'Roster chiuso (colonna medaglioni)', scene: 'riposo', box: [16, 96, 214, 366], origin: 'ruling',
    ref: 'roster/zanara-v2.webp', coverage: 'copre',
    content: 'Ritratto · nome · LV · barra · stato del residente (villaggio/quest/ferito/morto/a riposo) · scroll · espandi',
    conflicts: ['Banda senza edera (zanara-Z2)', 'Stati reali sono 5 + bloccato, il mockup ne mostra 1 → mappa in kit/KIT-ROSTER.md', 'Costruito: ZanaraRoster 214×366 (passo 62, anello Ø56, placca h50), /hud-zanara-roster'],
  },
  {
    id: 'nav', title: 'Barra di navigazione', scene: 'riposo', box: [534, 822, 532, 78], origin: 'real',
    ref: 'nav/zanara-v1.webp', coverage: 'parziale',
    content: 'VILLAGGIO · MAPPA · OFFICINA (bloccata, «Req · Lv 2») · TAVERNA (bloccata) — 4 slot uguali (nav-1)',
    conflicts: ['Mockup: 7 voci generiche (Ricerca, Gilda, Negozio, Opzioni…)', 'Astrolabio centrale: il recenter è uscito dalla barra (nav-1)', 'Mockup largo ~950 px contro slot 532: chrome ~2× il budget'],
  },
  {
    id: 'voce', title: 'Voce (Amanuense)', scene: 'riposo', box: [16, 744, 320, 140], origin: 'ruling',
    ref: 'voce/busts-voce.webp', coverage: 'copre',
    content: 'Obiettivo corrente · prossimo evento · esiti delle spedizioni · registro — dati che esistono già (zanara-Z11)',
    conflicts: ['A riposo solo busto + medaglione; la placca del messaggio compare quando c\'è una novità (il normale non parla)', 'Niente foglie intorno al busto (Z-2)', 'Il medaglione sotto il busto è il quadrante K14 (Z5): ora del giorno, niente X/Y', 'Narratore: l\'Amanuense, la voce del folio delle quest (confermato)'],
  },
  {
    id: 'bust-left', title: 'Busto sx', scene: 'riposo', box: [0, 0, 64, 100], origin: 'ruling',
    ref: 'bust-left/busts-voce.webp', coverage: 'copre',
    content: 'Terminale scolpito dell\'ala sinistra (zanara-Z9)',
    conflicts: ['Nel mockup è bronzo con foglie: va in avorio-alabastro e oro, senza foglie'],
  },
  {
    id: 'bust-right', title: 'Busto dx', scene: 'riposo', box: [1536, 0, 64, 100], origin: 'ruling',
    ref: 'bust-right/busts-voce.webp', coverage: 'copre',
    content: 'Terminale scolpito dell\'ala destra (zanara-Z9)',
    conflicts: ['Come il busto sinistro: avorio-alabastro e oro, senza foglie'],
  },
  {
    id: 'dock', title: 'Dock comandi (angolo destro)', scene: 'riposo', box: [1438, 834, 136, 40], origin: 'real',
    ref: 'cornerBR/board-breakdown.webp', coverage: 'parziale',
    content: 'Recenter · menu · pannelli (badge) · nascondi — 4 comandi con tasti rapidi (corner-1)',
    conflicts: ['Il ritaglio mostra un forziere decorativo: «niente oggettini» e no chrome morto', '«Roundel con simbolo dentro» vs guida §6b (niente cerchi-con-simbolo)'],
  },
  {
    id: 'roster-open', title: 'Roster aperto (pannello)', scene: 'aperti', box: [72, 92, 400, 268], origin: 'real',
    ref: 'roster-open/busts-voce.webp', coverage: 'copre',
    content: 'Testata con filtri · righe: scudo LV, nome, HP, stamina, valori · stati velati',
    conflicts: ['Bersaglio diretto: stessi dati di produzione (busts-voce)', 'Filtri della testata: icone incise, non cerchi-con-simbolo'],
  },
  {
    id: 'quest-detail', title: 'Dettaglio spedizione', scene: 'aperti', box: [546, 92, 680, 587], origin: 'real',
    ref: 'panel/zanara-v3.webp', coverage: 'parziale',
    content: 'Titolo · illustrazione · testo · ordine di marcia (4 ruoli) · sacca 0/3 · coperture · INVIA SPEDIZIONE / TORNA ALLA MAPPA',
    conflicts: ['Mockup verticale 425×580 per contenuto da 680×587', 'zanara-Z3: niente INIZIA a placca CTA → lastra F1 maggiore con gemma accesa', 'Mancano ordine di marcia e sacca: il mockup è un pannello informativo, il nostro è un pianificatore'],
  },
  {
    id: 'quest-side', title: 'Previsione / pericolo / intel', scene: 'aperti', box: [1236, 100, 338, 380], origin: 'real',
    ref: 'poi-panel/desk-poi.webp', coverage: 'parziale',
    content: 'PERICOLO · RICOMPENSA · DURATA · previsione · statistiche chiave · intel',
    conflicts: ['desk-poi: ricompense in fila, rischio a 5 teschi (skull-1), tempo con clessidra', 'Mancano statistiche chiave e intel: vanno sotto, nel foglio'],
  },
  {
    id: 'seal', title: 'Sigillo del verdetto', scene: 'aperti', box: [1160, 52, 120, 110], origin: 'ruling',
    ref: 'seal/mockup1-classic.webp', coverage: 'copre',
    content: 'Probabilità di successo + 5 teschi di pericolo (skull-1), sporge dal pannello (seal-1)',
    conflicts: ['zanara-Z6: è il verdetto della spedizione; il lascito si decide a parte'],
  },
];

const COVERAGE_COLOR: Record<Coverage, string> = { copre: '#5ec79a', parziale: '#e2c46a', manca: '#e07a5f' };
const LABEL: React.CSSProperties = {
  fontFamily: 'ui-monospace, monospace', fontSize: 11, letterSpacing: 1, color: '#cfe6f0',
  background: 'rgba(3,14,24,0.85)', borderRadius: 4, padding: '3px 8px',
};

type Mode = 'riferimenti' | 'slot' | 'produzione';

export default function HudTargetPage() {
  const [scene, setScene] = useState<Scene>('riposo');
  const [mode, setMode] = useState<Mode>('riferimenti');
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () => setScale(Math.min((window.innerWidth - 24) / DESIGN_W, 1));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  // open roster replaces the closed column
  const visible = SLOTS.filter((s) => s.scene === scene || (scene === 'aperti' && s.scene === 'riposo' && s.id !== 'roster-closed'));
  const area = (s: Slot) => s.box[2] * s.box[3];
  const restPct = (SLOTS.filter((s) => s.scene === 'riposo').reduce((a, s) => a + area(s), 0) / (DESIGN_W * DESIGN_H)) * 100;

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'auto', background: '#07131c', color: '#dfe9ee' }}>
      <div style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ ...LABEL, fontSize: 13, color: '#f1dfa8' }}>TAVOLA BERSAGLIO · HUD Zanara su slot reali /game (1600×900)</span>
        {(['riposo', 'aperti'] as Scene[]).map((s) => (
          <button key={s} type="button" onClick={() => setScene(s)}
            style={{ ...LABEL, cursor: 'pointer', border: s === scene ? '1px solid #d4af37' : '1px solid transparent' }}>{s === 'riposo' ? 'HUD a riposo' : 'pannelli aperti'}</button>
        ))}
        {(['riferimenti', 'slot', 'produzione'] as Mode[]).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)}
            style={{ ...LABEL, cursor: 'pointer', border: m === mode ? '1px solid #d4af37' : '1px solid transparent' }}>{m}</button>
        ))}
        <span style={LABEL}>slot a riposo: {restPct.toFixed(1)}% dello schermo (budget 18%)</span>
      </div>

      <div style={{ width: DESIGN_W * scale, height: DESIGN_H * scale, margin: '0 12px', position: 'relative', overflow: 'hidden', borderRadius: 6 }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: DESIGN_W, height: DESIGN_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          {mode === 'produzione' ? (
            <img src={`/hud-target/game-${scene === 'riposo' ? 'base' : 'detail'}.png`} alt="/game oggi" style={{ width: DESIGN_W, height: DESIGN_H, display: 'block' }} />
          ) : (
            <div style={{ position: 'absolute', inset: 0 }}><PixiWorldMap manifestPath={MAP_MANIFEST} stageColor="#1675ad" /></div>
          )}
          {mode !== 'produzione' && visible.map((s) => {
            const [x, y, w, h] = s.box;
            return (
              <div key={s.id} data-slot={s.id} style={{ position: 'absolute', left: x, top: y, width: w, height: h, zIndex: s.id === 'seal' ? 3 : 2 }}>
                {mode === 'riferimenti' && s.ref && (
                  <img src={CROPS + s.ref} alt="" draggable={false} style={{
                    width: '100%', height: '100%', objectFit: 'contain', display: 'block',
                    WebkitMaskImage: 'radial-gradient(ellipse 72% 72% at 50% 50%, #000 62%, transparent 100%)',
                    maskImage: 'radial-gradient(ellipse 72% 72% at 50% 50%, #000 62%, transparent 100%)',
                  }} />
                )}
                {(mode === 'slot' || !s.ref) && (
                  <div style={{
                    position: 'absolute', inset: 0, border: `2px dashed ${COVERAGE_COLOR[s.coverage]}`, borderRadius: 6,
                    background: s.ref ? 'rgba(4,20,30,0.35)' : 'rgba(80,20,10,0.35)',
                  }} />
                )}
                <div style={{ position: 'absolute', left: 4, top: 4, ...LABEL, fontSize: 10, color: COVERAGE_COLOR[s.coverage], whiteSpace: 'nowrap' }}>
                  {s.title}{s.origin === 'ruling' ? ' · da ruling' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 10, padding: 12 }}>
        {SLOTS.map((s) => (
          <section key={s.id} style={{ background: 'rgba(10,30,42,0.8)', border: '1px solid rgba(160,200,220,0.15)', borderLeft: `4px solid ${COVERAGE_COLOR[s.coverage]}`, borderRadius: 6, padding: '10px 12px', fontSize: 13, lineHeight: 1.45 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <strong style={{ color: '#f1dfa8' }}>{s.title}</strong>
              <span style={{ color: COVERAGE_COLOR[s.coverage], fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>{s.coverage.toUpperCase()}</span>
            </div>
            <div style={{ color: '#9fb8c4', fontSize: 11, margin: '2px 0 6px' }}>
              {s.origin === 'real' ? 'misurato su /game' : 'posizione da ruling, non ancora costruito'} · {s.box.join(', ')}{s.ref ? ` · rif. ${s.ref.replace('.webp', '')}` : ' · nessun riferimento'}
            </div>
            <div><span style={{ color: '#9fb8c4' }}>Contenuto reale:</span> {s.content}</div>
            <ul style={{ margin: '6px 0 0', paddingLeft: 18, color: '#f0c9b8' }}>
              {s.conflicts.map((c) => <li key={c}>{c}</li>)}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

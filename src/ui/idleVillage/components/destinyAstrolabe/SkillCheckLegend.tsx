import React, { useEffect, useRef } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
}

/* ── Swatch helpers ─────────────────────────────────────────────── */
const Dot = ({ color, glow }: { color: string; glow?: string }) => (
  <span
    className="da-legend-swatch"
    style={{
      background: color,
      boxShadow: glow ? `0 0 6px 2px ${glow}` : undefined,
    }}
  />
);

const Row = ({ children }: { children: React.ReactNode }) => (
  <li className="da-legend-row">{children}</li>
);

export function SkillCheckLegend({ open, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  return (
    <div
      ref={ref}
      className={`da-legend wanderlust-artifact wa--quiet${open ? ' da-legend--open' : ''}`}
      role="dialog"
      aria-label="Legenda Astrolabio"
      aria-hidden={!open}
      style={{ pointerEvents: open ? 'auto' : 'none' }}
    >
      <div className="da-legend-header">
        <span className="da-legend-title">Legenda Astrolabio</span>
        <button className="da-legend-close" onClick={onClose} aria-label="Chiudi legenda">✕</button>
      </div>

      {/* ── PILASTRI ──────────────────────────────────────────────── */}
      <section className="da-legend-section">
        <h3 className="da-legend-heading">Pilastri</h3>
        <ul className="da-legend-list">
          <Row>
            <span className="da-legend-swatch da-legend-swatch--pillar da-legend-swatch--white" />
            <span className="da-legend-label">
              <strong>Bianco</strong> — Stat del PG. Più alta = stella più grande = zona vittoria più ampia.
            </span>
          </Row>
          <Row>
            <span className="da-legend-swatch da-legend-swatch--pillar da-legend-swatch--black" />
            <span className="da-legend-label">
              <strong>Nero</strong> — Difficoltà della sfida. Più alta = area di fallimento più grande.
            </span>
          </Row>
        </ul>
      </section>

      {/* ── SUPERFICI (dal centro verso l'esterno) ─────────────────── */}
      <section className="da-legend-section">
        <h3 className="da-legend-heading">Zone (dal centro verso l'esterno)</h3>
        <ul className="da-legend-list">
          <Row>
            <Dot color="radial-gradient(circle, #f7e1ad, #cf9d4a)" glow="rgba(255,220,100,0.6)" />
            <span className="da-legend-label">
              <strong>Nucleo dorato</strong> — <em className="da-legend-verdict da-legend-verdict--bigwin">TRIONFO</em>.
              Il centro. Colpo critico.
            </span>
          </Row>
          <Row>
            <Dot color="radial-gradient(circle, #fffef0, #ecd49a)" glow="rgba(255,230,150,0.4)" />
            <span className="da-legend-label">
              <strong>Stella avorio</strong> — <em className="da-legend-verdict da-legend-verdict--win">VITTORIA</em>.
              Il fiore bianco. Proporzionale alla Stat del PG.
            </span>
          </Row>
          <Row>
            <Dot color="#7d4a10" />
            <span className="da-legend-label">
              <strong>Bordo bronzeo</strong> — <em className="da-legend-verdict da-legend-verdict--almost">QUASI</em>.
              La fascia sottile attorno alla stella. A un soffio.
            </span>
          </Row>
          <Row>
            <Dot color="radial-gradient(circle, #1c2a3a, #060d14)" glow="rgba(0,229,255,0.25)" />
            <span className="da-legend-label">
              <strong>Pentagono obsidiana</strong> — Superficie Sfida. Il confine della difficoltà. I suoi due toni
              (oro/azzurro) sono illuminazione a faccette, non zone distinte. Tutta quest'area è zona FALLIMENTO.
            </span>
          </Row>
          <Row>
            <Dot color="radial-gradient(circle, #000000, #120030)" glow="rgba(120,0,200,0.5)" />
            <span className="da-legend-label">
              <strong>Voragini viola</strong> — <em className="da-legend-verdict da-legend-verdict--dead">MORTE</em> (5%).
              Macchie scure nei crepacci tra i lobi, vicino alla stella. Caduta letale.
            </span>
          </Row>
          <Row>
            <Dot color="rgba(220,50,80,0.7)" glow="rgba(210,30,60,0.5)" />
            <span className="da-legend-label">
              <strong>Spine cremisi</strong> — <em className="da-legend-verdict da-legend-verdict--wound">FERITA</em> (10%).
              Corona di spine al perimetro esterno dell'area sfida. Impatto pesante.
            </span>
          </Row>
          <Row>
            <Dot color="rgba(190,22,52,0.8)" glow="rgba(255,40,90,0.4)" />
            <span className="da-legend-label">
              <strong>Banda rossa esterna</strong> — <em className="da-legend-verdict da-legend-verdict--epic">ROVINA</em>.
              Il bordo estremo. Fallimento catastrofico critico.
            </span>
          </Row>
        </ul>
      </section>

      {/* ── MECCANICA ─────────────────────────────────────────────── */}
      <section className="da-legend-section">
        <h3 className="da-legend-heading">Come funziona</h3>
        <ul className="da-legend-list">
          <Row>
            <span className="da-legend-swatch da-legend-swatch--ball" />
            <span className="da-legend-label">
              La palla è fisica. Il verdetto è determinato dalla <strong>posizione finale</strong> nello spazio 2D,
              non da un dado. Se atterra nella stella → vittoria. Nel bordo → quasi. Fuori → sconfitta.
            </span>
          </Row>
          <Row>
            <Dot color="rgba(120,0,200,0.4)" />
            <span className="da-legend-label">
              Ferita e Morte si attivano solo in caso di <strong>Sconfitta</strong>. Non esiste vittoria+ferita
              nel sistema spaziale: chi atterra nella stella è salvo.
            </span>
          </Row>
        </ul>
      </section>
    </div>
  );
}

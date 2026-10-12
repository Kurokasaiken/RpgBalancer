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
      aria-label="Astrolabe Legend"
      aria-hidden={!open}
      style={{ pointerEvents: open ? 'auto' : 'none' }}
    >
      <div className="da-legend-header">
        <span className="da-legend-title">Astrolabe Legend</span>
        <button className="da-legend-close" onClick={onClose} aria-label="Close legend">✕</button>
      </div>

      {/* ── PILASTRI ──────────────────────────────────────────────── */}
      <section className="da-legend-section">
        <h3 className="da-legend-heading">Pillars</h3>
        <ul className="da-legend-list">
          <Row>
            <span className="da-legend-swatch da-legend-swatch--pillar da-legend-swatch--white" />
            <span className="da-legend-label">
              <strong>White</strong> — Hero stat. Higher = bigger star = wider victory zone.
            </span>
          </Row>
          <Row>
            <span className="da-legend-swatch da-legend-swatch--pillar da-legend-swatch--black" />
            <span className="da-legend-label">
              <strong>Black</strong> — Challenge difficulty. Higher = larger failure area.
            </span>
          </Row>
        </ul>
      </section>

      {/* ── SUPERFICI (dal centro verso l'esterno) ─────────────────── */}
      <section className="da-legend-section">
        <h3 className="da-legend-heading">Zones (from the centre outwards)</h3>
        <ul className="da-legend-list">
          <Row>
            <Dot color="radial-gradient(circle, #f7e1ad, #cf9d4a)" glow="rgba(255,220,100,0.6)" />
            <span className="da-legend-label">
              <strong>Golden core</strong> — <em className="da-legend-verdict da-legend-verdict--bigwin">TRIUMPH</em>.
              The centre. Critical hit.
            </span>
          </Row>
          <Row>
            <Dot color="radial-gradient(circle, #fffef0, #ecd49a)" glow="rgba(255,230,150,0.4)" />
            <span className="da-legend-label">
              <strong>Ivory star</strong> — <em className="da-legend-verdict da-legend-verdict--win">VICTORY</em>.
              The white flower. Proportional to the hero's stat.
            </span>
          </Row>
          <Row>
            <Dot color="#7d4a10" />
            <span className="da-legend-label">
              <strong>Bronze edge</strong> — <em className="da-legend-verdict da-legend-verdict--almost">ALMOST</em>.
              The thin band around the star. By a hair.
            </span>
          </Row>
          <Row>
            <Dot color="radial-gradient(circle, #1c2a3a, #060d14)" glow="rgba(0,229,255,0.25)" />
            <span className="da-legend-label">
              <strong>Obsidian pentagon</strong> — Challenge surface. The difficulty boundary. Its two tones
              (gold/blue) are faceted lighting, not distinct zones. This whole area is the FAILURE zone.
            </span>
          </Row>
          <Row>
            <Dot color="radial-gradient(circle, #000000, #120030)" glow="rgba(120,0,200,0.5)" />
            <span className="da-legend-label">
              <strong>Purple chasms</strong> — <em className="da-legend-verdict da-legend-verdict--dead">DEATH</em> (5%).
              Dark blotches in the crevices between lobes, near the star. A lethal fall.
            </span>
          </Row>
          <Row>
            <Dot color="rgba(220,50,80,0.7)" glow="rgba(210,30,60,0.5)" />
            <span className="da-legend-label">
              <strong>Crimson thorns</strong> — <em className="da-legend-verdict da-legend-verdict--wound">WOUND</em> (10%).
              A crown of thorns on the outer rim of the challenge area. A heavy hit.
            </span>
          </Row>
          <Row>
            <Dot color="rgba(190,22,52,0.8)" glow="rgba(255,40,90,0.4)" />
            <span className="da-legend-label">
              <strong>Outer red band</strong> — <em className="da-legend-verdict da-legend-verdict--epic">RUIN</em>.
              The extreme edge. Critical catastrophic failure.
            </span>
          </Row>
        </ul>
      </section>

      {/* ── MECCANICA ─────────────────────────────────────────────── */}
      <section className="da-legend-section">
        <h3 className="da-legend-heading">How it works</h3>
        <ul className="da-legend-list">
          <Row>
            <span className="da-legend-swatch da-legend-swatch--ball" />
            <span className="da-legend-label">
              The ball is physical. The verdict is set by its <strong>final position</strong> in 2D space,
              not by a die. Land in the star → victory. On the edge → almost. Outside → defeat.
            </span>
          </Row>
          <Row>
            <Dot color="rgba(120,0,200,0.4)" />
            <span className="da-legend-label">
              Wound and Death only trigger on a <strong>Defeat</strong>. There is no victory+wound
              in the spatial system: whoever lands in the star is safe.
            </span>
          </Row>
        </ul>
      </section>
    </div>
  );
}

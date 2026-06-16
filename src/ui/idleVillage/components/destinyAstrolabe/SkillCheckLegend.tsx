import React, { useEffect, useRef } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SkillCheckLegend({ open, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
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
      aria-label="Skill Check Legend"
      aria-hidden={!open}
    >
      <div className="da-legend-grid">
        {/* Colors */}
        <section className="da-legend-section">
          <h3 className="da-legend-heading">Color Language</h3>
          <ul className="da-legend-list">
            <li>
              <span className="da-legend-swatch" style={{ background: 'var(--da-color-success, #d4af37)' }}>
                <svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="currentColor" opacity=".9"/></svg>
              </span>
              <span className="da-legend-label"><strong>Gold</strong> — Critical hit / Buff zone. The core ring.</span>
            </li>
            <li>
              <span className="da-legend-swatch" style={{ background: 'var(--da-color-almost, #8b5cf6)' }}>
                <svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="currentColor" opacity=".9"/></svg>
              </span>
              <span className="da-legend-label"><strong>Purple</strong> — Standard success threshold.</span>
            </li>
            <li>
              <span className="da-legend-swatch" style={{ background: 'var(--da-color-failure, #dc2626)' }}>
                <svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="currentColor" opacity=".9"/></svg>
              </span>
              <span className="da-legend-label"><strong>Red</strong> — Risk / High danger sectors.</span>
            </li>
          </ul>
        </section>

        {/* Pillars */}
        <section className="da-legend-section">
          <h3 className="da-legend-heading">Pillars</h3>
          <ul className="da-legend-list">
            <li>
              <span className="da-legend-swatch da-legend-swatch--icon">
                <svg viewBox="0 0 16 24" width="16" height="24">
                  <rect x="4" y="2" width="8" height="20" rx="1" fill="#f5f0e8" opacity=".9"/>
                  <rect x="5" y="2" width="2" height="20" rx="0.5" fill="white" opacity=".5"/>
                </svg>
              </span>
              <span className="da-legend-label"><strong>White Pillar</strong> — Your stat (the higher, the better).</span>
            </li>
            <li>
              <span className="da-legend-swatch da-legend-swatch--icon">
                <svg viewBox="0 0 16 24" width="16" height="24">
                  <rect x="4" y="2" width="8" height="20" rx="1" fill="#1a1a2e" opacity=".95"/>
                  <rect x="5" y="2" width="2" height="20" rx="0.5" fill="#334" opacity=".6"/>
                </svg>
              </span>
              <span className="da-legend-label"><strong>Black Pillar</strong> — Difficulty modifier. Pushes success threshold down.</span>
            </li>
          </ul>
        </section>

        {/* Magnetic Snap */}
        <section className="da-legend-section da-legend-section--full">
          <h3 className="da-legend-heading">Precision Threshold</h3>
          <ul className="da-legend-list">
            <li>
              <span className="da-legend-swatch da-legend-swatch--icon">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <circle cx="12" cy="12" r="9" fill="none" stroke="#d4af37" strokeWidth="1.5" opacity=".7"/>
                  <circle cx="12" cy="12" r="5" fill="none" stroke="#d4af37" strokeWidth="1" opacity=".9"
                    strokeDasharray="4 2"/>
                  <circle cx="12" cy="12" r="2" fill="#d4af37" opacity=".95"/>
                </svg>
              </span>
              <span className="da-legend-label">
                <strong>Magnetic Snap</strong> — When the ball locks on a zone, the result is sealed.
                The ball always hits the pre-calculated target; spin time affects suspense only.
              </span>
            </li>
            <li>
              <span className="da-legend-swatch da-legend-swatch--icon">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path d="M12 3 A9 9 0 0 1 21 12" fill="none" stroke="#10b981" strokeWidth="2.5"
                    strokeLinecap="round" opacity=".9"/>
                  <path d="M12 3 A9 9 0 1 0 21 12" fill="none" stroke="#3b3340" strokeWidth="2.5"
                    strokeLinecap="round" opacity=".5"/>
                </svg>
              </span>
              <span className="da-legend-label">
                <strong>Sweet Spot Arc</strong> — Gold/green arc visible during the spin.
                Represents your current success probability.
              </span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

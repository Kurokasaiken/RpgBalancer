import React from 'react';
import './fidelity-header.css';
import ForgottenObservatory from './ForgottenObservatory';
import NewObservatory from './NewObservatory';
import PlateQuad from './PlateQuad';

/**
 * Visual Fidelity Lab — /visual-fidelity-lab
 *
 * The single question: "Can the EXISTING grammar generate a second screen that
 * belongs to the same game?"
 *
 * Blind protocol (order matters):
 *   1. You see ONLY the rebuild first. Ask: "If this were a Steam screenshot with
 *      no context, would I think it's Wanderlust?" (not "is it good?", not "is it
 *      like the reference?")
 *   2. THEN open the frozen reference (link below). Ask: "Are these clearly the
 *      same family?"
 *
 * Success = SAME VISUAL FAMILY, not identical. If it fails, we do NOT fix the
 * rebuild — we document where the bible is not yet codified and build the
 * minimum missing brick. See fidelity-notes.md.
 */
export const VisualFidelityLabPage: React.FC = () => (
  <div
    className="vfl-scope"
    style={{ minHeight: '100vh', position: 'relative', padding: '40px 24px 96px' }}
  >
    {/* Same environment as the reference: the animated village background. */}
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        backgroundImage: 'url(/assets/ui/bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    />

    {/* ── The four physical hypotheses of the content well, judged by eye ── */}
    <figure style={{ width: 760, maxWidth: '100%', margin: '0 auto 56px' }} data-testid="plate-quad">
      <figcaption
        style={{
          fontFamily: 'var(--skin-font-display)',
          fontSize: 12,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--skin-title-color)',
          textAlign: 'center',
          margin: '0 0 14px',
        }}
      >
        Content well — four physical hypotheses
      </figcaption>
      <PlateQuad />
    </figure>

    {/* ── The rebuild, alone (blind step 1) ── */}
    <div style={{ display: 'flex', gap: '40px', justifyContent: 'center', flexWrap: 'wrap' }}>
      <figure style={{ width: 640, maxWidth: '100%' }} data-testid="rebuild-column">
        <figcaption
          style={{
            fontFamily: 'var(--skin-font-display)',
            fontSize: 12,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--skin-title-color)',
            textAlign: 'center',
            margin: '0 0 14px',
          }}
        >
          The Forgotten Observatory
        </figcaption>
        <ForgottenObservatory />
      </figure>

      <figure style={{ width: 640, maxWidth: '100%' }} data-testid="prototype-column">
        <figcaption
          style={{
            fontFamily: 'var(--skin-font-display)',
            fontSize: 12,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--skin-title-color)',
            textAlign: 'center',
            margin: '0 0 14px',
          }}
        >
          The New Observatory (Prototype)
        </figcaption>
        <NewObservatory />
      </figure>
    </div>

    {/* ── Reference is deliberately BELOW the fold: view the rebuild first. ── */}
    <div
      style={{
        maxWidth: 640,
        margin: '72px auto 0',
        padding: '18px 20px',
        borderTop: '1px solid rgba(223,184,87,0.25)',
        textAlign: 'center',
      }}
    >
      <p style={{ fontFamily: 'var(--skin-font-serif)', color: 'var(--skin-text-secondary)', fontSize: 14, margin: '0 0 10px' }}>
        Blind step 1 done? Only now open the frozen reference and ask whether the two are the same family.
      </p>
      <a
        href="/v9-skin-sandbox"
        target="_blank"
        rel="noreferrer"
        style={{
          fontFamily: 'var(--skin-font-display)',
          fontSize: 12,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--skin-title-color)',
          textDecoration: 'none',
          borderBottom: '1px solid rgba(223,184,87,0.5)',
          paddingBottom: 2,
        }}
      >
        Open frozen reference · /v9-skin-sandbox ↗
      </a>
    </div>
  </div>
);

export default VisualFidelityLabPage;

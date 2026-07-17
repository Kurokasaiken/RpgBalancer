import React from 'react';
import ReferenceQuestDetail from './ReferenceQuestDetail';
import RebuiltQuestDetail from './RebuiltQuestDetail';

/**
 * Visual Grammar Validation Spike — isolated proof page (/visual-grammar-validation).
 *
 * LEFT  = golden reference (immutable).
 * RIGHT = rebuild from the shared grammar, different content.
 *
 * Human gate (primary): "If I saw these two without knowing the process, would
 * I think they belong to the same game?"  Metrics (Delta E, masked chrome diff)
 * are supporting evidence only. See validation-notes.md.
 */
const captionStyle: React.CSSProperties = {
  fontFamily: 'var(--skin-font-display)',
  fontSize: 12,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--skin-subtitle-color)',
  marginBottom: 12,
  textAlign: 'center',
};

export const VisualGrammarValidationPage: React.FC = () => (
  <div className="vgv-page" style={{ minHeight: '100vh', position: 'relative', padding: 32 }}>
    {/*
      FINDING: WanderlustSurface's default `.ws-content` z-index (0) renders
      content BEHIND its own frame SVG (z-index 1). The golden reference only
      shows content because the sandbox overrides it locally
      (v9-skin-sandbox.tsx: `.ws-content { z-index: 2 }`). We replicate that
      same override here. In the extracted system this belongs in the component.
    */}
    <style>{`.vgv-page .ws-content { z-index: 2; }`}</style>

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

    <header style={{ maxWidth: 1300, margin: '0 auto 28px' }}>
      <h1
        style={{
          fontFamily: 'var(--skin-font-display)',
          fontSize: 26,
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: 'var(--skin-title-color)',
          textShadow: '0 2px 4px rgba(0,0,0,0.85)',
          margin: 0,
        }}
      >
        Visual Grammar Validation Spike
      </h1>
      <p style={{ fontFamily: 'var(--skin-font-serif)', color: 'var(--skin-text-secondary)', marginTop: 8, maxWidth: 760 }}>
        Domanda del gate umano: «Se vedessi queste due schermate senza sapere il processo produttivo,
        penserei che appartengono allo stesso gioco?» Il Rebuild (B) è composto solo dalla grammatica
        condivisa (WanderlustSurface + primitivi di layout) con contenuto diverso — nessun import del
        componente di reference.
      </p>
    </header>

    <div
      style={{
        display: 'flex',
        gap: 48,
        alignItems: 'flex-start',
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}
    >
      <figure style={{ width: 600, maxWidth: '100%', margin: 0 }} data-testid="reference-column">
        <figcaption style={captionStyle}>A — Reference (golden · immutabile)</figcaption>
        <ReferenceQuestDetail />
      </figure>

      <figure style={{ width: 600, maxWidth: '100%', margin: 0 }} data-testid="rebuilt-column">
        <figcaption style={captionStyle}>B — Rebuilt (stessa grammatica · dati diversi)</figcaption>
        <RebuiltQuestDetail />
      </figure>
    </div>
  </div>
);

export default VisualGrammarValidationPage;

import React from 'react';
import { useTranslation } from 'react-i18next';
import { COMPONENT_CATALOG, type CatalogEntry } from './componentCatalog';

/**
 * InteractionPatterns — le composizioni approvate come COMPORTAMENTO.
 *
 * Registrato come sistema cross-cutting in
 * `.windsurf/rules/50-interaction-patterns.md`. I dati vivono nel catalog
 * (campi pattern-only: flow, emotionalGoal, playerExpectation,
 * referenceIntent); questa sezione li rende leggibili come sequenze.
 *
 * Il punto: componenti giusti possono comunque comporre una UI sbagliata.
 * Qui si norma la composizione e il flusso, non il mattone.
 */

function PatternCard({ entry }: { entry: CatalogEntry }) {
  const { t } = useTranslation('common');
  return (
    <div
      style={{
        border: '1px solid var(--skin-separator)',
        borderRadius: 'var(--skin-inset-radius)',
        padding: '14px 16px',
        background: 'var(--skin-footer-bg)',
      }}
      data-testid={`interaction-pattern-${entry.id}`}
    >
      <strong>{entry.title}</strong>
      {entry.referenceIntent && (
        <p className="skin-text-secondary" style={{ margin: '4px 0 0', fontStyle: 'italic', fontSize: '13px' }}>
          {entry.referenceIntent}
        </p>
      )}
      {entry.flow && (
        <p style={{ margin: '10px 0 0', fontSize: '14px' }}>
          {entry.flow.map((step, i) => (
            <React.Fragment key={step}>
              {i > 0 && <span style={{ color: 'var(--skin-titlesep-diamond-color)' }}> → </span>}
              <span data-skin="badge" style={{ fontSize: '11px' }}>{step}</span>
            </React.Fragment>
          ))}
        </p>
      )}
      <div style={{ marginTop: '10px', fontSize: '12px' }}>
        {entry.emotionalGoal && (
          <p style={{ margin: 0 }}>
            <span data-skin="section" style={{ fontSize: '9px' }}>
              {t('designSystem.patterns.emotionalGoal', 'Emotional goal')}
            </span>{' '}
            {entry.emotionalGoal}
          </p>
        )}
        {entry.playerExpectation && (
          <p className="skin-text-muted" style={{ margin: '4px 0 0' }}>
            {t('designSystem.patterns.playerExpectation', 'Player expectation')}: “{entry.playerExpectation}”
          </p>
        )}
      </div>
    </div>
  );
}

export function InteractionPatterns() {
  const { t } = useTranslation('common');
  const patterns = COMPONENT_CATALOG.filter((e) => e.flow && e.flow.length > 0);

  return (
    <div data-testid="interaction-patterns-content">
      <p className="skin-text-secondary" style={{ marginTop: 0 }}>
        {t(
          'designSystem.patterns.note',
          'Stessa struttura non significa stesso pattern: conta l’intento. Ogni nuova schermata deve riferirsi a uno di questi flussi o proporne uno nuovo nel catalog.'
        )}
      </p>
      <div style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {patterns.map((entry) => (
          <PatternCard key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}

export default InteractionPatterns;

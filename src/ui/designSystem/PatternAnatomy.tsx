import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SkinButton } from '@/ui/idleVillage/skins/primitives';
import { getCatalogEntry, type CatalogEntry } from './componentCatalog';

/**
 * PatternAnatomy — il Component Extraction Mode di un pattern.
 *
 * Toggle [Inspect Pattern] → breakdown `composedOf` con la visual
 * responsibility di ogni pezzo; ogni pezzo è un anchor cliccabile verso la
 * sua scheda (`#catalog-<id>`). Mostra anche flow / emotionalGoal /
 * playerExpectation quando il pattern li dichiara.
 *
 * È il ponte "reference → costruzione": la schermata dice cosa vogliamo
 * ottenere, il breakdown dice con quali mattoni ricrearla.
 */
export interface PatternAnatomyProps {
  entry: CatalogEntry;
}

export function PatternAnatomy({ entry }: PatternAnatomyProps) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);

  if (!entry.composedOf?.length && !entry.flow?.length) return null;

  return (
    <div data-testid={`anatomy-${entry.id}`} style={{ marginTop: '10px' }}>
      <SkinButton
        variant="secondary"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        data-testid={`anatomy-toggle-${entry.id}`}
      >
        {open
          ? t('designSystem.anatomy.hide', 'Hide anatomy')
          : t('designSystem.anatomy.inspect', 'Inspect pattern')}
      </SkinButton>

      {open && (
        <div
          style={{
            marginTop: '10px',
            padding: '12px 14px',
            border: '1px dashed var(--skin-separator)',
            borderRadius: 'var(--skin-inset-radius)',
          }}
          data-testid={`anatomy-panel-${entry.id}`}
        >
          {entry.composedOf && entry.composedOf.length > 0 && (
            <>
              <div data-skin="section" style={{ fontSize: '10px' }}>
                {t('designSystem.anatomy.builtFrom', 'Built from')}
              </div>
              <ul style={{ margin: '6px 0 0', paddingLeft: '18px' }}>
                {entry.composedOf.map((id) => {
                  const piece = getCatalogEntry(id);
                  const responsibility = entry.responsibilities?.[id];
                  return (
                    <li key={id} style={{ fontSize: '13px', marginBottom: '4px' }}>
                      <a href={`#catalog-${id}`} data-testid={`anatomy-link-${entry.id}-${id}`}>
                        {piece?.title ?? id}
                      </a>
                      {responsibility && (
                        <span className="skin-text-muted"> — {responsibility}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {entry.flow && entry.flow.length > 0 && (
            <p style={{ margin: '10px 0 0', fontSize: '13px' }}>
              <span data-skin="section" style={{ fontSize: '10px', display: 'block' }}>
                {t('designSystem.anatomy.flow', 'Flow')}
              </span>
              {entry.flow.join(' → ')}
            </p>
          )}

          {entry.emotionalGoal && (
            <p className="skin-text-secondary" style={{ margin: '8px 0 0', fontSize: '13px' }}>
              <em>{t('designSystem.anatomy.emotionalGoal', 'Emotional goal')}: {entry.emotionalGoal}</em>
            </p>
          )}
          {entry.playerExpectation && (
            <p className="skin-text-muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
              {t('designSystem.anatomy.playerExpectation', 'Player expectation')}: “{entry.playerExpectation}”
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default PatternAnatomy;

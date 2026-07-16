import React from 'react';
import { useTranslation } from 'react-i18next';
import { SkinBadge, SkinButton } from '@/ui/idleVillage/skins/primitives';

/**
 * VisualRulesSection — il carattere della UI, come guardrail (mai prigioni).
 *
 * Ogni regola è mostrata con un esempio ✔/✖ RENDERIZZATO (non descritto):
 * l'esempio giusto usa solo ruoli skin, quello sbagliato mostra l'anti-pattern
 * dal vivo. È la sezione che impedisce il degrado: density, hierarchy,
 * decoration budget, Contrast of Complexity, Attention Budget.
 */

function RuleBlock({
  title,
  principle,
  children,
}: {
  title: string;
  principle: string;
  children?: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: '26px' }} data-testid={`visual-rule-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <h3 style={{ marginBottom: '2px' }}>{title}</h3>
      <p className="skin-text-secondary" style={{ margin: '0 0 10px', fontStyle: 'italic' }}>
        {principle}
      </p>
      {children}
    </div>
  );
}

function DoDont({ doNode, dontNode, doLabel, dontLabel }: {
  doNode: React.ReactNode;
  dontNode: React.ReactNode;
  doLabel: string;
  dontLabel: string;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
      <div
        style={{
          border: '1px solid var(--skin-status-met)',
          borderRadius: 'var(--skin-inset-radius)',
          padding: '12px',
        }}
      >
        <div style={{ color: 'var(--skin-status-met)', fontSize: '11px', marginBottom: '8px' }}>✔ {doLabel}</div>
        {doNode}
      </div>
      <div
        style={{
          border: '1px solid var(--skin-status-unmet)',
          borderRadius: 'var(--skin-inset-radius)',
          padding: '12px',
        }}
      >
        <div style={{ color: 'var(--skin-status-unmet)', fontSize: '11px', marginBottom: '8px' }}>✖ {dontLabel}</div>
        {dontNode}
      </div>
    </div>
  );
}

export function VisualRulesSection() {
  const { t } = useTranslation('common');

  return (
    <div data-testid="visual-rules-content">
      <RuleBlock
        title={t('designSystem.rules.hierarchy.title', 'Hierarchy of Color')}
        principle={t(
          'designSystem.rules.hierarchy.principle',
          'Gold = importanza/azione · White = informazione · Grey = secondario · Red = pericolo. L’oro perde significato se è ovunque.'
        )}
      >
        <DoDont
          doLabel={t('designSystem.rules.do', 'Do')}
          dontLabel={t('designSystem.rules.dont', "Don't")}
          doNode={
            <div>
              <div data-skin="title" style={{ fontSize: '16px' }}>Quest Reward</div>
              <p style={{ fontSize: '13px', margin: '4px 0' }}>
                50 gold, 2 hides.{' '}
                <span className="skin-text-muted">Expires at dusk.</span>
              </p>
              <SkinButton variant="cta" ornaments={false}>Claim</SkinButton>
            </div>
          }
          dontNode={
            <div>
              <div style={{ color: 'var(--skin-title-color)', fontSize: '16px' }}>Quest Reward</div>
              <p style={{ color: 'var(--skin-title-color)', fontSize: '13px', margin: '4px 0' }}>
                50 gold, 2 hides. Expires at dusk.
              </p>
              <p style={{ color: 'var(--skin-title-color)', fontSize: '11px', margin: 0 }}>
                (tutto oro: niente sembra importante)
              </p>
            </div>
          }
        />
      </RuleBlock>

      <RuleBlock
        title={t('designSystem.rules.density.title', 'Density')}
        principle={t(
          'designSystem.rules.density.principle',
          'Spacing su scala 8/16/24. Esplorazione = rada e atmosferica; gestione = densa ma respirabile. Mai 5/13/27.'
        )}
      >
        <DoDont
          doLabel={t('designSystem.rules.do', 'Do')}
          dontLabel={t('designSystem.rules.dont', "Don't")}
          doNode={
            <div style={{ display: 'grid', gap: '8px' }}>
              <SkinBadge>ready</SkinBadge>
              <SkinBadge>rare</SkinBadge>
            </div>
          }
          dontNode={
            <div style={{ display: 'grid', gap: '2px' }}>
              <SkinBadge>ready</SkinBadge>
              <SkinBadge>rare</SkinBadge>
              <span className="skin-text-muted" style={{ fontSize: '11px' }}>(gap arbitrario, elementi soffocati)</span>
            </div>
          }
        />
      </RuleBlock>

      <RuleBlock
        title={t('designSystem.rules.decoration.title', 'Decoration Budget')}
        principle={t(
          'designSystem.rules.decoration.principle',
          'Default: 1 elemento decorativo dominante per pannello. 2+ solo se il contesto lo motiva (es. schermata boss). Guardrail, non prigione.'
        )}
      />

      <RuleBlock
        title={t('designSystem.rules.complexity.title', 'Contrast of Complexity')}
        principle={t(
          'designSystem.rules.complexity.principle',
          'Informazione importante = complessità visiva alta (cornice, icona, colore). Informazione secondaria = semplice e neutra. L’alternativa è il pannello Excel.'
        )}
      >
        <DoDont
          doLabel={t('designSystem.rules.do', 'Do')}
          dontLabel={t('designSystem.rules.dont', "Don't")}
          doNode={
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span data-skin="plaque">QUEST</span>
                <span data-skin="title" style={{ fontSize: '15px' }}>Dangerous Hunt</span>
              </div>
              <p className="skin-text-muted" style={{ fontSize: '12px', margin: '6px 0 0' }}>
                wood 12 · stone 4 · hides 2
              </p>
            </div>
          }
          dontNode={
            <div>
              <p style={{ fontSize: '13px', margin: 0 }}>Dangerous Hunt</p>
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                <SkinBadge>wood 12</SkinBadge>
                <SkinBadge>stone 4</SkinBadge>
                <SkinBadge>hides 2</SkinBadge>
              </div>
              <span className="skin-text-muted" style={{ fontSize: '11px' }}>
                (titolo piatto, risorse che urlano)
              </span>
            </div>
          }
        />
      </RuleBlock>

      <RuleBlock
        title={t('designSystem.rules.attention.title', 'Attention Budget')}
        principle={t(
          'designSystem.rules.attention.principle',
          'Per schermata: dichiarare primary / secondary / tertiary / background. Non più di UN elemento deve urlare contemporaneamente.'
        )}
      >
        <div
          style={{
            border: '1px dashed var(--skin-separator)',
            borderRadius: 'var(--skin-inset-radius)',
            padding: '12px',
            fontSize: '12px',
          }}
        >
          <p style={{ margin: 0 }}>
            <strong>Quest panel</strong>: title = <span style={{ color: 'var(--skin-title-color)' }}>primary</span>{' '}
            · reward = <span className="skin-text-secondary">secondary</span>{' '}
            · description = <span className="skin-text-muted">tertiary</span>{' '}
            · decoration = background
          </p>
        </div>
      </RuleBlock>

      <RuleBlock
        title={t('designSystem.rules.material.title', 'Material Language')}
        principle={t(
          'designSystem.rules.material.principle',
          'Obsidian (superfici) · bronzo battuto (azioni) · oro inciso (importanza) · azure (informazione viva). Un materiale nuovo è una decisione di direzione artistica, non di CSS.'
        )}
      />
    </div>
  );
}

export default VisualRulesSection;

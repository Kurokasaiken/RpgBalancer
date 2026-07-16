import React, { Suspense, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DndContext } from '@dnd-kit/core';
import { TokenSwatchGrid } from '@/ui/designSystem/TokenSwatch';
import { V9PanelShell } from '@/ui/designSystem/V9PanelShell';
import { usePanelsStore, selectVisiblePanels } from '@/ui/designSystem/store/usePanelsStore';
import { useLiveSkinTokens } from '@/ui/designSystem/useLiveSkinTokens';
import { getCatalogCounts, getCatalogEntry } from '@/ui/designSystem/componentCatalog';
import { ComponentTechSheet } from '@/ui/designSystem/ComponentTechSheet';
import { ErrorBoundary } from '@/ui/organisms/ErrorBoundary';
import { useSkinPreferences } from '@/ui/idleVillage/hooks/useSkinPreferences';
import {
  SkinScope,
  SkinTitle,
  SkinButton,
  SkinBadge,
  SkinCloseButton,
} from '@/ui/idleVillage/skins/primitives';

// Embed dei kit reali: lazy per non gravare sul first paint della Review Room.
const CurrentProductionSection = React.lazy(() =>
  import('@/ui/designSystem/GamePatternEmbeds').then((m) => ({ default: m.CurrentProductionSection }))
);
const GamePatternsSection = React.lazy(() =>
  import('@/ui/designSystem/GamePatternEmbeds').then((m) => ({ default: m.GamePatternsSection }))
);
const HeroShowcase = React.lazy(() => import('@/ui/designSystem/HeroShowcase'));
const SkinPreviewMatrix = React.lazy(() => import('@/ui/designSystem/SkinPreviewMatrix'));
const VisualRulesSection = React.lazy(() => import('@/ui/designSystem/VisualRulesSection'));
const InteractionPatterns = React.lazy(() => import('@/ui/designSystem/InteractionPatterns'));
const UIHealthReport = React.lazy(() => import('@/ui/designSystem/UIHealthReport'));

/**
 * /design-system — UI Review Room del gioco.
 *
 * Non è una documentazione tecnica né una libreria di componenti: è il luogo
 * dove ogni schermata viene confrontata con il linguaggio visivo approvato,
 * e dove ogni nuovo componente nasce da pattern reali già validati.
 *
 * Due superfici:
 *  - Review Room (quotidiana): Hero, Matrix, Current Production, Patterns,
 *    Visual Rules, Interaction Patterns, Components
 *  - Advanced Lab (strumentazione): Tokens live, Panels, Store, Shell,
 *    Integration
 *
 * Regola non negoziabile: zero valori visivi duplicati — ogni colore arriva
 * da getComputedStyle (useLiveSkinTokens) o da un componente reale.
 */

type Surface = 'review' | 'lab';

/** Sezioni tematiche dei token: mappa gruppi derivati dal prefisso --skin-<group>-… */
const TOKEN_SECTIONS: Array<{ label: string; groups: string[] }> = [
  { label: 'Surface & Depth', groups: ['surface', 'glow', 'inset', 'footer', 'separator'] },
  { label: 'Typography', groups: ['font', 'title', 'subtitle', 'body', 'text', 'label', 'incision'] },
  { label: 'Actions', groups: ['btn', 'btn2', 'cta', 'close', 'icon'] },
  { label: 'Signals', groups: ['badge', 'plaque', 'titlesep', 'status'] },
  { label: 'Stat Bars', groups: ['statbar'] },
  { label: 'Motion & Drag', groups: ['drag', 'snap', 'parallax'] },
  { label: 'Structures', groups: ['medallion', 'modal', 'clip'] },
];

const REVIEW_SECTIONS: Array<{ id: string; label: string }> = [
  { id: 'section-hero', label: 'Hero' },
  { id: 'section-matrix', label: 'Preview Matrix' },
  { id: 'section-production', label: 'Current Production' },
  { id: 'section-patterns', label: 'Game Patterns' },
  { id: 'section-visual-rules', label: 'Visual Rules' },
  { id: 'section-interaction-patterns', label: 'Interaction Patterns' },
  { id: 'section-components', label: 'Components' },
];

const LAB_SECTIONS: Array<{ id: string; label: string }> = [
  { id: 'section-health', label: 'UI Health' },
  { id: 'section-tokens', label: 'Tokens' },
  { id: 'section-panels', label: 'Panels' },
  { id: 'section-store', label: 'Store' },
  { id: 'section-shell', label: 'Shell' },
  { id: 'section-integration', label: 'Integration' },
];

function SectionPlaceholder({ note }: { note: string }) {
  return (
    <p className="skin-text-muted" style={{ fontStyle: 'italic' }}>
      {note}
    </p>
  );
}

export default function DesignSystemPage() {
  const { t } = useTranslation('common');
  const [surface, setSurface] = useState<Surface>('review');

  // Skin system — setPreset re-applies the CSS vars globally: the whole page
  // (and the rest of the app) re-themes live, no logical refresh.
  const { presetId, availablePresets, setPreset, isLoading: skinLoading } = useSkinPreferences();
  const tokenGroups = useLiveSkinTokens(presetId);

  // Panel store state
  const panels = usePanelsStore((state) => state.panels);
  const activePanelId = usePanelsStore((state) => state.activePanelId);
  const layoutMode = usePanelsStore((state) => state.layoutMode);
  const setLayoutMode = usePanelsStore((state) => state.setLayoutMode);
  const setActivePanel = usePanelsStore((state) => state.setActivePanel);
  const removePanel = usePanelsStore((state) => state.removePanel);
  const saveState = usePanelsStore((state) => state.saveState);
  const loadState = usePanelsStore((state) => state.loadState);
  const clearState = usePanelsStore((state) => state.clearState);

  const visiblePanels = selectVisiblePanels(usePanelsStore.getState());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadState().then(() => setIsLoaded(true));
  }, [loadState]);

  const handleLayoutToggle = () => {
    setLayoutMode(layoutMode === 'full' ? 'strip' : 'full');
  };

  const sections = surface === 'review' ? REVIEW_SECTIONS : LAB_SECTIONS;

  return (
    <SkinScope className="ds-page min-h-screen" data-testid="design-system-page">
      <style>{`
        .ds-page { background: var(--skin-surface-base); min-height: 100vh; }
        .ds-shell { max-width: 1180px; margin: 0 auto; padding: 40px 32px 80px; }
        .ds-manifesto {
          border-left: 2px solid var(--skin-surface-border);
          padding: 10px 16px;
          margin: 18px 0 0;
          color: var(--skin-text-secondary);
          font-family: var(--skin-font-serif);
          font-size: 14px;
          font-style: italic;
        }
        .ds-toolbar {
          position: sticky; top: 0; z-index: 40;
          display: flex; flex-wrap: wrap; align-items: center; gap: 12px;
          padding: 12px 16px; margin: 24px -16px;
          background: var(--skin-surface-bg);
          border: 1px solid var(--skin-surface-border);
          border-radius: var(--skin-inset-radius);
          box-shadow: 0 8px 24px rgba(0,0,0,0.45);
        }
        .ds-toolbar-label {
          font-family: var(--skin-font-display);
          font-size: 10px; letter-spacing: var(--skin-label-tracking);
          text-transform: uppercase; color: var(--skin-label-tertiary);
        }
        .ds-nav { display: flex; flex-wrap: wrap; gap: 8px 16px; margin: 0 0 28px; padding: 0; list-style: none; }
        .ds-nav a {
          font-family: var(--skin-font-display);
          font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
          text-decoration: none;
        }
        .ds-section { margin-bottom: 28px; padding: 22px 24px; }
        .ds-row { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; }
        .ds-group-title { margin-top: 22px; }
      `}</style>

      <div className="ds-shell">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <header style={{ marginBottom: '12px' }}>
          <div data-skin="subtitle">{t('designSystem.kicker', 'UI Review Room')}</div>
          <SkinTitle data-testid="page-title">
            {t('designSystem.title', 'Design System Reference')}
          </SkinTitle>
          <div data-skin="titlesep" aria-hidden />
          <p className="ds-manifesto" data-testid="manifesto">
            {t(
              'designSystem.manifesto',
              '/design-system non documenta la UI del gioco: la definisce. Ogni elemento visivo prodotto deve poter essere confrontato qui con il linguaggio visivo approvato.'
            )}
          </p>
          <div className="ds-row" style={{ marginTop: '12px' }} data-testid="inventory-counter">
            {Object.entries(getCatalogCounts()).map(([status, count]) =>
              count > 0 ? (
                <SkinBadge key={status} data-testid={`inventory-${status}`}>
                  {count} {status}
                </SkinBadge>
              ) : null
            )}
          </div>
        </header>

        {/* ── Toolbar: preset switcher + surface tabs ─────────────────── */}
        <div className="ds-toolbar" data-testid="ds-toolbar">
          <span className="ds-toolbar-label">{t('designSystem.preset', 'Skin preset')}</span>
          {availablePresets.map((preset) => (
            <SkinButton
              key={preset.id}
              variant={preset.id === presetId ? 'utility' : 'secondary'}
              aria-pressed={preset.id === presetId}
              disabled={skinLoading}
              onClick={() => setPreset(preset.id)}
              data-testid={`preset-${preset.id}`}
            >
              {preset.label}
            </SkinButton>
          ))}
          <span style={{ flex: 1 }} />
          <span className="ds-toolbar-label">{t('designSystem.surface', 'Surface')}</span>
          <SkinButton
            variant={surface === 'review' ? 'utility' : 'secondary'}
            aria-pressed={surface === 'review'}
            onClick={() => setSurface('review')}
            data-testid="surface-review"
          >
            {t('designSystem.reviewRoom', 'Review Room')}
          </SkinButton>
          <SkinButton
            variant={surface === 'lab' ? 'utility' : 'secondary'}
            aria-pressed={surface === 'lab'}
            onClick={() => setSurface('lab')}
            data-testid="surface-lab"
          >
            {t('designSystem.lab', 'Advanced Lab')}
          </SkinButton>
        </div>

        {/* ── Anchor nav ──────────────────────────────────────────────── */}
        <ul className="ds-nav" data-testid="ds-nav">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`}>{s.label}</a>
            </li>
          ))}
        </ul>

        {/* ═══ REVIEW ROOM ═══════════════════════════════════════════ */}
        <div hidden={surface !== 'review'} data-testid="surface-review-content">
          <section id="section-hero" className="ds-section" data-skin="panel">
            <h2 data-testid="section-hero">{t('designSystem.sections.hero', 'Hero Showcase')}</h2>
            <ErrorBoundary>
              <Suspense fallback={<SectionPlaceholder note="Loading hero…" />}>
                {surface === 'review' && <HeroShowcase />}
              </Suspense>
            </ErrorBoundary>
          </section>

          <section id="section-matrix" className="ds-section" data-skin="panel">
            <h2 data-testid="section-matrix">{t('designSystem.sections.matrix', 'Preview Matrix')}</h2>
            <ErrorBoundary>
              <Suspense fallback={<SectionPlaceholder note="Loading matrix…" />}>
                {surface === 'review' && <SkinPreviewMatrix />}
              </Suspense>
            </ErrorBoundary>
          </section>

          <section id="section-production" className="ds-section" data-skin="panel">
            <h2 data-testid="section-production">{t('designSystem.sections.production', 'Current Production')}</h2>
            <ErrorBoundary>
              <Suspense fallback={<SectionPlaceholder note="Loading production kits…" />}>
                {surface === 'review' && <CurrentProductionSection />}
              </Suspense>
            </ErrorBoundary>
          </section>

          <section id="section-patterns" className="ds-section" data-skin="panel">
            <h2 data-testid="section-patterns">{t('designSystem.sections.patterns', 'Game Patterns')}</h2>
            <ErrorBoundary>
              <Suspense fallback={<SectionPlaceholder note="Loading game patterns…" />}>
                {surface === 'review' && <GamePatternsSection />}
              </Suspense>
            </ErrorBoundary>
          </section>

          <section id="section-visual-rules" className="ds-section" data-skin="panel">
            <h2 data-testid="section-visual-rules">{t('designSystem.sections.visualRules', 'Visual Rules')}</h2>
            <ErrorBoundary>
              <Suspense fallback={<SectionPlaceholder note="Loading rules…" />}>
                {surface === 'review' && <VisualRulesSection />}
              </Suspense>
            </ErrorBoundary>
          </section>

          <section id="section-interaction-patterns" className="ds-section" data-skin="panel">
            <h2 data-testid="section-interaction-patterns">
              {t('designSystem.sections.interactionPatterns', 'Interaction Patterns')}
            </h2>
            <ErrorBoundary>
              <Suspense fallback={<SectionPlaceholder note="Loading patterns…" />}>
                {surface === 'review' && <InteractionPatterns />}
              </Suspense>
            </ErrorBoundary>
          </section>

          {/* Components — primitivi skin reali, nessun valore duplicato */}
          <section id="section-components" className="ds-section" data-skin="panel">
            <h2 data-testid="section-components">{t('designSystem.sections.components', 'Components')}</h2>

            <h3 className="ds-group-title">{t('designSystem.components.buttons', 'Buttons')}</h3>
            <div className="ds-row" data-testid="components-buttons">
              <SkinButton>{t('designSystem.components.utility', 'Utility')}</SkinButton>
              <SkinButton variant="secondary">{t('designSystem.components.secondary', 'Secondary')}</SkinButton>
              <SkinButton variant="cta">{t('designSystem.components.cta', 'Avvia')}</SkinButton>
              <SkinButton disabled>{t('designSystem.components.disabled', 'Disabled')}</SkinButton>
            </div>

            <h3 className="ds-group-title">{t('designSystem.components.signals', 'Badges & Close')}</h3>
            <div className="ds-row" data-testid="components-signals">
              <SkinBadge>{t('designSystem.components.badge', 'Azure Badge')}</SkinBadge>
              <SkinCloseButton aria-label={t('designSystem.components.close', 'Close')} />
            </div>

            <h3 className="ds-group-title">{t('designSystem.components.typography', 'Typography roles')}</h3>
            <div data-testid="components-typography">
              <div data-skin="subtitle">Subtitle · tracked caption</div>
              <h3>Section heading (h3)</h3>
              <p>
                Body text — <strong>strong emphasis</strong>, <span className="skin-text-secondary">secondary</span>,{' '}
                <span className="skin-text-muted">muted</span>, <a href="#section-components">link accent</a>.
              </p>
            </div>

            <h3 className="ds-group-title">{t('designSystem.components.sheets', 'Tech sheets')}</h3>
            <div style={{ display: 'grid', gap: '14px' }} data-testid="components-sheets">
              {['skin-button', 'skin-badge'].map((id) => {
                const entry = getCatalogEntry(id);
                return entry ? <ComponentTechSheet key={id} entry={entry} /> : null;
              })}
            </div>
          </section>
        </div>

        {/* ═══ ADVANCED LAB ═══════════════════════════════════════════ */}
        <div hidden={surface !== 'lab'} data-testid="surface-lab-content">
          {/* UI Health Report — com'è messo il sistema, a colpo d'occhio */}
          <section id="section-health" className="ds-section" data-skin="panel">
            <h2 data-testid="section-health">{t('designSystem.sections.health', 'UI Health Report')}</h2>
            <ErrorBoundary>
              <Suspense fallback={<SectionPlaceholder note="Loading health…" />}>
                {surface === 'lab' && <UIHealthReport />}
              </Suspense>
            </ErrorBoundary>
          </section>

          {/* Tokens — letti LIVE da getComputedStyle, mai duplicati */}
          <section id="section-tokens" className="ds-section" data-skin="panel">
            <h2 data-testid="section-tokens">{t('designSystem.sections.tokens.title', 'Tokens')}</h2>
            <p className="skin-text-secondary">
              {t(
                'designSystem.sections.tokens.note',
                'Valori letti live dal documento (getComputedStyle): cambiando preset, cambiano. Nessun valore copiato a mano.'
              )}
            </p>
            {TOKEN_SECTIONS.map(({ label, groups }) => {
              const tokens = groups.flatMap((g) => tokenGroups[g] ?? []);
              if (tokens.length === 0) return null;
              return (
                <div key={label} style={{ marginBottom: '26px' }}>
                  <h3 className="ds-group-title">{label}</h3>
                  <TokenSwatchGrid
                    tokens={tokens.map((tk) => ({
                      name: tk.name,
                      value: tk.value,
                      source: tk.source,
                    }))}
                  />
                </div>
              );
            })}
          </section>

          {/* Panels */}
          <section id="section-panels" className="ds-section" data-skin="panel">
            <h2 data-testid="section-panels">{t('designSystem.sections.panels.title', 'Panels')}</h2>

            <div className="ds-row" style={{ marginBottom: '16px' }}>
              <SkinButton onClick={handleLayoutToggle} data-testid="layout-toggle">
                {t('designSystem.sections.panels.toggleLayout', `Layout: ${layoutMode}`)}
              </SkinButton>
              <SkinButton variant="secondary" onClick={() => void saveState()} data-testid="save-state">
                {t('designSystem.sections.panels.saveState', 'Save State')}
              </SkinButton>
              <SkinButton variant="secondary" onClick={() => void loadState()} data-testid="load-state">
                {t('designSystem.sections.panels.loadState', 'Load State')}
              </SkinButton>
              <SkinButton variant="secondary" onClick={() => void clearState()} data-testid="clear-state">
                {t('designSystem.sections.panels.clearState', 'Clear State')}
              </SkinButton>
            </div>

            <div
              className="relative min-h-[500px]"
              style={{
                background: 'var(--skin-inset-bg)',
                border: '1px solid var(--skin-inset-border)',
                borderRadius: 'var(--skin-inset-radius)',
              }}
              data-testid="panels-demo"
            >
              {isLoaded && (
                <DndContext>
                  {visiblePanels.map((panel) => (
                    <V9PanelShell
                      key={panel.id}
                      panel={panel}
                      onClose={() => removePanel(panel.id)}
                      isActive={activePanelId === panel.id}
                      onClick={() => setActivePanel(panel.id)}
                    >
                      <div>
                        <p>{t('designSystem.sections.panels.panelContent', 'Panel Content')}</p>
                        <p className="skin-text-muted text-sm">
                          {t('designSystem.sections.panels.panelPosition', `Position: ${panel.position.x}, ${panel.position.y}`)}
                        </p>
                        <p className="skin-text-muted text-sm">
                          {t('designSystem.sections.panels.panelSize', `Size: ${panel.size.width}x${panel.size.height}`)}
                        </p>
                      </div>
                    </V9PanelShell>
                  ))}
                </DndContext>
              )}
            </div>
          </section>

          {/* Store */}
          <section id="section-store" className="ds-section" data-skin="panel">
            <h2 data-testid="section-store">{t('designSystem.sections.store.title', 'Store')}</h2>
            <div className="space-y-3" data-testid="store-debug">
              <p>
                <span className="skin-text-secondary">{t('designSystem.sections.store.layoutMode', 'Layout Mode')}: </span>
                {layoutMode}
              </p>
              <p>
                <span className="skin-text-secondary">{t('designSystem.sections.store.activePanel', 'Active Panel')}: </span>
                {activePanelId || 'None'}
              </p>
              <p>
                <span className="skin-text-secondary">{t('designSystem.sections.store.panelCount', 'Panel Count')}: </span>
                {Object.keys(panels).length}
              </p>
              <p>
                <span className="skin-text-secondary">{t('designSystem.sections.store.visiblePanels', 'Visible Panels')}: </span>
                {visiblePanels.length}
              </p>
              <ul className="list-disc list-inside">
                {Object.keys(panels).map((id) => (
                  <li key={id}>{id}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* Shell */}
          <section id="section-shell" className="ds-section" data-skin="panel">
            <h2 data-testid="section-shell">{t('designSystem.sections.shell.title', 'Shell')}</h2>
            <p className="skin-text-muted" data-testid="section-shell-content">
              {t('designSystem.sections.shell.placeholder', 'Work in progress')}
            </p>
          </section>

          {/* Integration */}
          <section id="section-integration" className="ds-section" data-skin="panel">
            <h2 data-testid="section-integration">{t('designSystem.sections.integration.title', 'Integration')}</h2>
            <div className="space-y-4" data-testid="integration-guide">
              <div>
                <h3>{t('designSystem.sections.integration.step1', 'Step 1: Wrap in SkinScope')}</h3>
                <pre
                  className="p-4 rounded text-sm overflow-x-auto"
                  style={{
                    background: 'var(--skin-inset-bg)',
                    border: '1px solid var(--skin-separator)',
                    color: 'var(--skin-text-secondary)',
                  }}
                >
                  {`import { SkinScope, SkinButton, SkinTitle } from '@/ui/idleVillage/skins/primitives';

<SkinScope>
  <SkinTitle>Titolo</SkinTitle>
  <SkinButton variant="cta">Avvia</SkinButton>
</SkinScope>`}
                </pre>
              </div>
              <div>
                <h3>{t('designSystem.sections.integration.step2', 'Step 2: Style with --skin-* only')}</h3>
                <pre
                  className="p-4 rounded text-sm overflow-x-auto"
                  style={{
                    background: 'var(--skin-inset-bg)',
                    border: '1px solid var(--skin-separator)',
                    color: 'var(--skin-text-secondary)',
                  }}
                >
                  {`/* ✔ Do */
background: var(--skin-surface-bg);

/* ✖ Don't — mai valori hardcoded, mai token legacy */
background: #060f16;
background: var(--panel-bg);`}
                </pre>
              </div>
              <div>
                <h3>{t('designSystem.sections.integration.step3', 'Step 3: Panels (drag + store)')}</h3>
                <pre
                  className="p-4 rounded text-sm overflow-x-auto"
                  style={{
                    background: 'var(--skin-inset-bg)',
                    border: '1px solid var(--skin-separator)',
                    color: 'var(--skin-text-secondary)',
                  }}
                >
                  {`import { V9PanelShell } from '@/ui/designSystem/V9PanelShell';
import { usePanelsStore } from '@/ui/designSystem/store/usePanelsStore';
import { DndContext } from '@dnd-kit/core';

<DndContext>
  {visiblePanels.map((panel) => (
    <V9PanelShell key={panel.id} panel={panel} …>{content}</V9PanelShell>
  ))}
</DndContext>`}
                </pre>
              </div>
            </div>
          </section>
        </div>
      </div>
    </SkinScope>
  );
}

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DndContext } from '@dnd-kit/core';
import { TokenSwatchGrid } from '@/ui/designSystem/TokenSwatch';
import { V9PanelShell } from '@/ui/designSystem/V9PanelShell';
import { usePanelsStore, selectVisiblePanels } from '@/ui/designSystem/store/usePanelsStore';

/**
 * Design System Page
 * 
 * Pagina di riferimento per il sistema di design con sezioni per:
 * - Tokens: Visualizzazione swatch dei token wanderlustTokens.css
 * - Panels: Demo del sistema di pannelli draggabili
 * - Store: Stato Zustand per pannelli
 * - Shell: Componenti headless per pannelli
 * - Integration: Esempi di integrazione
 */
export default function DesignSystemPage() {
  const { t } = useTranslation('common');
  
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

  // Load panel state on mount
  useEffect(() => {
    loadState().then(() => setIsLoaded(true));
  }, [loadState]);

  // Handle panel close
  const handleClosePanel = (panelId: string) => {
    removePanel(panelId);
  };

  // Handle panel click
  const handlePanelClick = (panelId: string) => {
    setActivePanel(panelId);
  };

  // Handle layout mode toggle
  const handleLayoutToggle = () => {
    const newMode = layoutMode === 'full' ? 'strip' : 'full';
    setLayoutMode(newMode);
  };

  // Handle save state
  const handleSaveState = async () => {
    await saveState();
  };

  // Handle load state
  const handleLoadState = async () => {
    await loadState();
  };

  // Handle clear state
  const handleClearState = async () => {
    await clearState();
  };

  // Token da wanderlustTokens.css
  const depthTokens = [
    { name: '--void', value: '#000000', label: 'Void' },
    { name: '--abyss', value: '#060604', label: 'Abyss' },
    { name: '--deep', value: '#0a0906', label: 'Deep' },
    { name: '--base', value: '#0e0c08', label: 'Base' },
    { name: '--surface', value: '#131008', label: 'Surface' },
  ];

  const ironTokens = [
    { name: '--iron-dk', value: '#0c0a06', label: 'Iron Dark' },
    { name: '--iron-md', value: '#1a1610', label: 'Iron Medium' },
    { name: '--iron-rim', value: '#282018', label: 'Iron Rim' },
    { name: '--iron-lg', value: '#342c1e', label: 'Iron Light' },
  ];

  const accentTokens = [
    { name: '--acc-primary', value: '#c07028', label: 'Primary' },
    { name: '--acc-primary-light', value: '#d89040', label: 'Primary Light' },
    { name: '--acc-primary-dark', value: '#6a3c10', label: 'Primary Dark' },
  ];

  const glowTokens = [
    { name: '--glow-amber', value: 'rgba(216,144,64,.45)', label: 'Glow Amber' },
    { name: '--glow-emerald', value: 'rgba(44,116,66,.42)', label: 'Glow Emerald' },
    { name: '--glow-rose', value: 'rgba(138,56,56,.40)', label: 'Glow Rose' },
    { name: '--glow-blue', value: 'rgba(44,80,116,.38)', label: 'Glow Blue' },
  ];

  const textTokens = [
    { name: '--t0', value: '#060604', label: 'Text 0' },
    { name: '--t1', value: '#f0e8d5', label: 'Text 1' },
    { name: '--t2', value: '#c0a878', label: 'Text 2' },
    { name: '--t3', value: '#6e5838', label: 'Text 3' },
    { name: '--t4', value: '#faf0dc', label: 'Text 4' },
  ];

  return (
    <div className="observatory-page min-h-screen">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <header className="mb-12">
          <p className="observatory-kicker text-sm uppercase tracking-wider mb-2">
            {t('designSystem.kicker', 'Design System')}
          </p>
          <h1 className="observatory-title text-4xl font-bold mb-4">
            {t('designSystem.title', 'Design System Reference')}
          </h1>
          <p className="observatory-subcopy text-lg text-slate-400">
            {t('designSystem.subtitle', 'Component library, tokens, and integration patterns')}
          </p>
        </header>

        {/* Sections Grid */}
        <div className="space-y-8">
          {/* Tokens Section */}
          <section className="default-card p-6 rounded-lg border border-slate-700 bg-slate-800/50">
            <h2 className="text-2xl font-semibold mb-4" data-testid="section-tokens">
              {t('designSystem.sections.tokens.title', 'Tokens')}
            </h2>
            
            {/* Depth & Surface Tokens */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-3 text-slate-300">
                {t('designSystem.sections.tokens.depth', 'Depth & Surface')}
              </h3>
              <TokenSwatchGrid tokens={depthTokens} />
            </div>

            {/* Iron Tokens */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-3 text-slate-300">
                {t('designSystem.sections.tokens.iron', 'Iron (Warm)')}
              </h3>
              <TokenSwatchGrid tokens={ironTokens} />
            </div>

            {/* Accent Tokens */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-3 text-slate-300">
                {t('designSystem.sections.tokens.accent', 'Accent & Glow')}
              </h3>
              <TokenSwatchGrid tokens={accentTokens} />
            </div>

            {/* Glow Tokens */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-3 text-slate-300">
                {t('designSystem.sections.tokens.glow', 'Glow Effects')}
              </h3>
              <TokenSwatchGrid tokens={glowTokens} />
            </div>

            {/* Text Tokens */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-3 text-slate-300">
                {t('designSystem.sections.tokens.text', 'Typography')}
              </h3>
              <TokenSwatchGrid tokens={textTokens} />
            </div>
          </section>

          {/* Panels Section */}
          <section className="default-card p-6 rounded-lg border border-slate-700 bg-slate-800/50">
            <h2 className="text-2xl font-semibold mb-4" data-testid="section-panels">
              {t('designSystem.sections.panels.title', 'Panels')}
            </h2>
            
            {/* Layout Mode Toggle */}
            <div className="mb-4 flex items-center gap-4">
              <button
                onClick={handleLayoutToggle}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
                data-testid="layout-toggle"
              >
                {t('designSystem.sections.panels.toggleLayout', `Layout: ${layoutMode}`)}
              </button>
              <button
                onClick={handleSaveState}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
                data-testid="save-state"
              >
                {t('designSystem.sections.panels.saveState', 'Save State')}
              </button>
              <button
                onClick={handleLoadState}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
                data-testid="load-state"
              >
                {t('designSystem.sections.panels.loadState', 'Load State')}
              </button>
              <button
                onClick={handleClearState}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
                data-testid="clear-state"
              >
                {t('designSystem.sections.panels.clearState', 'Clear State')}
              </button>
            </div>

            {/* Panels Demo */}
            <div 
              className="relative min-h-[500px] bg-slate-900/50 rounded border border-slate-700"
              data-testid="panels-demo"
            >
              {isLoaded && (
                <DndContext>
                  {visiblePanels.map((panel) => (
                    <V9PanelShell
                      key={panel.id}
                      panel={panel}
                      onClose={() => handleClosePanel(panel.id)}
                      isActive={activePanelId === panel.id}
                      onClick={() => handlePanelClick(panel.id)}
                    >
                      <div>
                        <p className="text-slate-300 mb-2">
                          {t('designSystem.sections.panels.panelContent', 'Panel Content')}
                        </p>
                        <p className="text-slate-400 text-sm">
                          {t('designSystem.sections.panels.panelPosition', `Position: ${panel.position.x}, ${panel.position.y}`)}
                        </p>
                        <p className="text-slate-400 text-sm">
                          {t('designSystem.sections.panels.panelSize', `Size: ${panel.size.width}x${panel.size.height}`)}
                        </p>
                      </div>
                    </V9PanelShell>
                  ))}
                </DndContext>
              )}
            </div>
          </section>

          {/* Store Section */}
          <section className="default-card p-6 rounded-lg border border-slate-700 bg-slate-800/50">
            <h2 className="text-2xl font-semibold mb-4" data-testid="section-store">
              {t('designSystem.sections.store.title', 'Store')}
            </h2>
            
            {/* Store Debug View */}
            <div className="space-y-4" data-testid="store-debug">
              <div>
                <h3 className="text-lg font-medium mb-2 text-slate-300">
                  {t('designSystem.sections.store.layoutMode', 'Layout Mode')}
                </h3>
                <p className="text-slate-400">{layoutMode}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2 text-slate-300">
                  {t('designSystem.sections.store.activePanel', 'Active Panel')}
                </h3>
                <p className="text-slate-400">{activePanelId || 'None'}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2 text-slate-300">
                  {t('designSystem.sections.store.panelCount', 'Panel Count')}
                </h3>
                <p className="text-slate-400">{Object.keys(panels).length}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2 text-slate-300">
                  {t('designSystem.sections.store.visiblePanels', 'Visible Panels')}
                </h3>
                <p className="text-slate-400">{visiblePanels.length}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2 text-slate-300">
                  {t('designSystem.sections.store.panelIds', 'Panel IDs')}
                </h3>
                <ul className="text-slate-400 list-disc list-inside">
                  {Object.keys(panels).map((id) => (
                    <li key={id}>{id}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Shell Section */}
          <section className="default-card p-6 rounded-lg border border-slate-700 bg-slate-800/50">
            <h2 className="text-2xl font-semibold mb-4" data-testid="section-shell">
              {t('designSystem.sections.shell.title', 'Shell')}
            </h2>
            <p className="text-slate-400" data-testid="section-shell-content">
              {t('designSystem.sections.shell.placeholder', 'Work in progress')}
            </p>
          </section>

          {/* Integration Section */}
          <section className="default-card p-6 rounded-lg border border-slate-700 bg-slate-800/50">
            <h2 className="text-2xl font-semibold mb-4" data-testid="section-integration">
              {t('designSystem.sections.integration.title', 'Integration')}
            </h2>
            
            {/* Integration Guide */}
            <div className="space-y-4" data-testid="integration-guide">
              <div>
                <h3 className="text-lg font-medium mb-2 text-slate-300">
                  {t('designSystem.sections.integration.step1', 'Step 1: Import Components')}
                </h3>
                <pre className="bg-slate-900 p-4 rounded text-sm text-slate-300 overflow-x-auto">
                  {`import { V9PanelShell } from '@/ui/designSystem/V9PanelShell';
import { usePanelsStore } from '@/ui/designSystem/store/usePanelsStore';
import { DndContext } from '@dnd-kit/core';`}
                </pre>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2 text-slate-300">
                  {t('designSystem.sections.integration.step2', 'Step 2: Use Store')}
                </h3>
                <pre className="bg-slate-900 p-4 rounded text-sm text-slate-300 overflow-x-auto">
                  {`const panels = usePanelsStore((state) => state.panels);
const activePanelId = usePanelsStore((state) => state.activePanelId);
const setActivePanel = usePanelsStore((state) => state.setActivePanel);
const removePanel = usePanelsStore((state) => state.removePanel);`}
                </pre>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2 text-slate-300">
                  {t('designSystem.sections.integration.step3', 'Step 3: Render Panels')}
                </h3>
                <pre className="bg-slate-900 p-4 rounded text-sm text-slate-300 overflow-x-auto">
                  {`<DndContext>
  {visiblePanels.map((panel) => (
    <V9PanelShell
      key={panel.id}
      panel={panel}
      onClose={() => removePanel(panel.id)}
      isActive={activePanelId === panel.id}
      onClick={() => setActivePanel(panel.id)}
    >
      {/* Panel Content */}
    </V9PanelShell>
  ))}
</DndContext>`}
                </pre>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2 text-slate-300">
                  {t('designSystem.sections.integration.step4', 'Step 4: Persistence (Optional)')}
                </h3>
                <pre className="bg-slate-900 p-4 rounded text-sm text-slate-300 overflow-x-auto">
                  {`// Load state on mount
useEffect(() => {
  loadState();
}, [loadState]);

// Save state on unmount
useEffect(() => {
  return () => {
    saveState();
  };
}, [saveState]);`}
                </pre>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

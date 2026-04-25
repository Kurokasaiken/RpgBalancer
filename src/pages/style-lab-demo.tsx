import React from 'react';
import { StyleLaboratoryPanel } from '@/ui/styleLab/StyleLaboratoryPanel';
import { StyleLabDemo } from '@/ui/styleLab/StyleLabDemo';
import { useThemeSwitcher } from '@/hooks/useThemeSwitcher';

/**
 * Style Laboratory Demo Page
 * 
 * Pagina dimostrativa completa del Style Laboratory con:
 * - Pannello di controllo temi esistente
 * - Nuovo demo con componenti live e controlli parametri
 * - Layout split per visualizzare entrambi
 */
export default function StyleLabDemoPage() {
  const { activePreset, presets, isRandomized, randomizeTheme, resetRandomization, setPreset } = useThemeSwitcher();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Style Laboratory Panel */}
      <div className="px-8 py-4">
        <StyleLaboratoryPanel
          activePreset={activePreset}
          presets={presets}
          isRandomized={isRandomized}
          onSelectPreset={setPreset}
          onRandomize={randomizeTheme}
          onResetRandomization={resetRandomization}
          className="mb-4"
          kickerLabel="Style Laboratory"
          headerLabel="Theme Controls"
        />
      </div>

      {/* Interactive Demo Section */}
      <div className="px-8 pb-8">
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          {/* StyleLabDemo Component */}
          <div className="rounded-lg overflow-hidden border border-slate-600" style={{ height: '600px' }}>
            <StyleLabDemo />
          </div>
        </div>
      </div>
    </div>
  );
}

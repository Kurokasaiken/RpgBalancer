/**
 * Entry for Idle Village Config tab.
 * Simple tabs to switch between Buildings and Activities config.
 */

import { useCallback, useState } from 'react';
import IdleVillageBuildingsTab from '@/ui/idleVillage/IdleVillageBuildingsTab';
import IdleVillageActivitiesTab from '@/ui/idleVillage/IdleVillageActivitiesTab';
import IdleVillageGlobalRulesTab from '@/ui/idleVillage/IdleVillageGlobalRulesTab';
import IdleVillageResourcesTab from '@/ui/idleVillage/IdleVillageResourcesTab';
import IdleVillagePassiveEffectsTab from '@/ui/idleVillage/IdleVillagePassiveEffectsTab';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import { ToastContainer, useToast } from '@/ui/balancing/Toast';
import { createVillageStateFromConfig } from '@/engine/game/idleVillage/TimeEngine';
import { VillageStateStore } from '@/engine/game/idleVillage/VillageStateStore';
import { loadResidentsFromCharacterManager } from '@/engine/game/idleVillage/characterImport';

export default function IdleVillageConfigRoute() {
  const [activeTab, setActiveTab] = useState<'buildings' | 'activities' | 'resources' | 'passive' | 'rules'>('buildings');
  const [isInitializingVillage, setIsInitializingVillage] = useState(false);
  const { config, saveConfig } = useIdleVillageConfig();
  const { showToast, toasts, removeToast } = useToast();

  const handleInitializeTestVillage = useCallback(() => {
    if (isInitializingVillage) return;
    setIsInitializingVillage(true);
    try {
      const snapshot = JSON.parse(JSON.stringify(config));
      const result = saveConfig(snapshot, 'Snapshot before test village init');
      if (!result.success) {
        throw new Error(result.error ?? 'Salvataggio configurazione fallito');
      }
      const initialResidents = loadResidentsFromCharacterManager({ config });
      if (initialResidents.length === 0) {
        showToast('Nessun personaggio salvato – crea personaggi nel Character Manager.', 'error');
        return;
      }
      const seededState = createVillageStateFromConfig({ config, initialResidents });
      VillageStateStore.reset(() => seededState, 'Inizializza villaggio di test');
      showToast('Villaggio di test inizializzato con 3 residenti full HP', 'success');
    } catch (error) {
      showToast(`Errore inizializzazione villaggio: ${(error as Error).message}`, 'error');
    } finally {
      setIsInitializingVillage(false);
    }
  }, [config, isInitializingVillage, saveConfig, showToast]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#020617_0,#020617_55%,#000000_100%)] text-ivory px-4 py-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-cinzel tracking-[0.32em] uppercase text-ivory">
              Idle Village Config
            </h1>
            <p className="mt-1 text-[10px] uppercase tracking-[0.26em] text-slate-400">
              Buildings · Activities · Resources · Passive Effects · Global Rules
            </p>
          </div>
          <button
            type="button"
            onClick={handleInitializeTestVillage}
            disabled={isInitializingVillage}
            className="inline-flex items-center justify-center rounded-full border border-gold px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors disabled:opacity-60 disabled:cursor-not-allowed bg-gold text-obsidian hover:bg-gold/90"
          >
            {isInitializingVillage ? 'Inizializzo…' : 'Inizializza Villaggio di Test'}
          </button>
        </header>

        <div className="rounded-xl border border-slate bg-obsidian/80 shadow-[0_0_40px_rgba(15,23,42,0.9)] overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-700 bg-slate-900/70 px-3 py-2">
            <button
              type="button"
              onClick={() => setActiveTab('buildings')}
              className={
                'px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase transition-colors ' +
                (activeTab === 'buildings'
                  ? 'bg-gold text-obsidian shadow-[0_0_12px_rgba(250,204,21,0.55)]'
                  : 'text-slate-300 hover:text-ivory hover:bg-slate-700/50')
              }
            >
              Buildings
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('activities')}
              className={
                'px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase transition-colors ' +
                (activeTab === 'activities'
                  ? 'bg-gold text-obsidian shadow-[0_0_12px_rgba(250,204,21,0.55)]'
                  : 'text-slate-300 hover:text-ivory hover:bg-slate-700/50')
              }
            >
              Activities
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('resources')}
              className={
                'px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase transition-colors ' +
                (activeTab === 'resources'
                  ? 'bg-gold text-obsidian shadow-[0_0_12px_rgba(250,204,21,0.55)]'
                  : 'text-slate-300 hover:text-ivory hover:bg-slate-700/50')
              }
            >
              Resources
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('passive')}
              className={
                'px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase transition-colors ' +
                (activeTab === 'passive'
                  ? 'bg-gold text-obsidian shadow-[0_0_12px_rgba(250,204,21,0.55)]'
                  : 'text-slate-300 hover:text-ivory hover:bg-slate-700/50')
              }
            >
              Passive Effects
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className={
                'px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase transition-colors ' +
                (activeTab === 'rules'
                  ? 'bg-gold text-obsidian shadow-[0_0_12px_rgba(250,204,21,0.55)]'
                  : 'text-slate-300 hover:text-ivory hover:bg-slate-700/50')
              }
            >
              Global Rules
            </button>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === 'buildings' && <IdleVillageBuildingsTab />}
            {activeTab === 'activities' && <IdleVillageActivitiesTab />}
            {activeTab === 'resources' && (
              <div className="p-4">
                <IdleVillageResourcesTab />
              </div>
            )}
            {activeTab === 'passive' && (
              <div className="p-4">
                <IdleVillagePassiveEffectsTab />
              </div>
            )}
            {activeTab === 'rules' && <IdleVillageGlobalRulesTab />}
          </div>
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

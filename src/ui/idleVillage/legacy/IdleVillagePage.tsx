/**
 * Minimal Idle Village Game UI (Cultist Simulator-style lanes + drag&drop)
 * This is a barebones prototype to allow testing the time+activity+job+quest engines.
 * Uses the Gilded Observatory theme and follows config-first principles.
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { Pause, Play } from 'lucide-react';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import { useToast } from '@/ui/balancing/ToastContext';
import { ToastContainer } from '@/ui/balancing/Toast';
import { createVillageStateFromConfig } from '@/engine/game/idleVillage/TimeEngine';
import type {
  ResidentState,
} from '@/engine/game/idleVillage/TimeEngine';
import { loadResidentsFromCharacterManager } from '@/engine/game/idleVillage/characterImport';
import { useVillageStateStore } from '@/ui/idleVillage/useVillageStateStore';

const IdleVillagePage: React.FC = () => {
  const { config } = useIdleVillageConfig();
  const initialResidents = useMemo(() => loadResidentsFromCharacterManager({ config }), [config]);
  const { state: villageState, exportState, importState } = useVillageStateStore(() =>
    createVillageStateFromConfig({ config, initialResidents })
  );

  const { showToast, toasts, removeToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleImportChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        importState(json, 'Imported village state');
        showToast('Village state imported successfully', 'success');
      } catch (error) {
        showToast(`Import error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      }
    };
    reader.onerror = () => {
      showToast('Failed to read file', 'error');
    };
    reader.readAsText(file);
  }, [importState, showToast]);

  const handleExport = useCallback(() => {
    try {
      const json = exportState();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;

      a.download = `idle-village-state-${timestamp}.json`;
      a.click();
      showToast('Village state exported successfully', 'success');
    } catch (error) {
      showToast(`Export error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  }, [exportState, showToast]);

  return (
    <DndContext>
      <div className="h-screen w-full bg-obsidian text-ivory overflow-hidden">
        <div className="h-full flex flex-col">
          <header className="p-4 border-b border-slate-800 bg-black/50">
            <h1 className="text-xl font-cinzel tracking-wider">Idle Village</h1>
          </header>
          <main className="flex-1 overflow-auto p-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/70 rounded-lg p-4 border border-slate-800">
                  <h2 className="text-lg font-semibold mb-2">Residents</h2>
                  <div className="space-y-2">
                    {Object.values(villageState.residents).map((resident: ResidentState) => (
                      <div key={resident.id} className="p-2 bg-slate-800/50 rounded border border-slate-700">
                        <h3 className="font-medium">{resident.displayName}</h3>
                        <p className="text-sm text-slate-400">{resident.statProfileId}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2 space-y-4">
                  <div className="bg-slate-900/70 rounded-lg p-4 border border-slate-800">
                    <h2 className="text-lg font-semibold mb-2">Activities</h2>
                    <div className="space-y-2">
                      {/* Activity list will go here */}
                      <p className="text-slate-400 text-sm">No activities scheduled</p>
                    </div>
                  </div>
                  <div className="bg-slate-900/70 rounded-lg p-4 border border-slate-800">
                    <h2 className="text-lg font-semibold mb-2">Resources</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {Object.entries(villageState.resources).map(([key, value]) => (
                        <div key={key} className="p-2 bg-slate-800/50 rounded border border-slate-700">
                          <p className="text-sm font-medium">{key}</p>
                          <p className="text-amber-300">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
          <footer className="p-2 border-t border-slate-800 bg-black/50 flex justify-between items-center">
            <div className="flex space-x-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-full bg-slate-800 hover:bg-slate-700"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button
                onClick={handleExport}
                className="px-3 py-1 text-sm rounded bg-blue-600 hover:bg-blue-700"
              >
                Export
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1 text-sm rounded bg-green-600 hover:bg-green-700"
              >
                Import
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={handleImportChange}
              />
            </div>
          </footer>
        </div>
      </div>
      <DragOverlay>
        {/* Drag overlay for residents will be added when needed */}
      </DragOverlay>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </DndContext>
  );
};

export default IdleVillagePage;

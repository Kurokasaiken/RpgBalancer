import React, { useRef } from 'react';
import { useBalancerConfig } from '../../balancing/hooks/useBalancerConfig';
import { ToastContainer, useToast } from './Toast';

export const ConfigToolbar: React.FC = () => {
  const {
    undo,
    canUndo,
    resetToInitialConfig,
    exportConfig,
    importConfig,
  } = useBalancerConfig();

  const { showToast, toasts, removeToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExport = () => {
    try {
      const json = exportConfig();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;

      a.download = `rpg-balancer-config-${timestamp}.json`;
      a.click();
      showToast('Configurazione esportata con successo', 'success');
    } catch (e) {
      showToast(`Errore durante export: ${(e as Error).message}`, 'error');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const result = importConfig(text);
        if (!result.success) {
          showToast(`Errore import: ${result.error}`, 'error');
        } else {
          showToast('Configurazione importata con successo', 'success');
        }
      } catch (err) {
        showToast(`Errore durante import: ${(err as Error).message}`, 'error');
      }
    };
    reader.onerror = () => {
      showToast('Errore durante lettura file', 'error');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-4 px-3 py-2 rounded-lg border border-slate-700 bg-slate-900/70 text-xs">
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          className={`px-2 py-1 rounded border ${
            canUndo
              ? 'border-amber-400 text-amber-200 hover:bg-amber-500/10'
              : 'border-slate-600 text-slate-500 cursor-not-allowed'
          }`}
        >
          ↺ Undo
        </button>
        <button
          type="button"
          onClick={resetToInitialConfig}
          className="px-2 py-1 rounded border border-red-500/60 text-red-200 hover:bg-red-500/10"
        >
          Reset Defaults
        </button>
        <span className="mx-2 h-4 w-px bg-slate-700" />
        <button
          type="button"
          onClick={handleExport}
          className="px-2 py-1 rounded border border-emerald-500/60 text-emerald-200 hover:bg-emerald-500/10"
        >
          ⭳ Export
        </button>
        <button
          type="button"
          onClick={handleImportClick}
          className="px-2 py-1 rounded border border-cyan-500/60 text-cyan-200 hover:bg-cyan-500/10"
        >
          ⭱ Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleImportChange}
        />
        <span className="ml-auto text-[10px] text-slate-400 uppercase tracking-[0.2em]">
          Config-Driven Balancer · Editor
        </span>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
};

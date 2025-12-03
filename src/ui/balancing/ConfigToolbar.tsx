import React, { useRef } from 'react';
import { useBalancerConfig } from '../../balancing/hooks/useBalancerConfig';
import { ToastContainer, useToast } from './Toast';

export const ConfigToolbar: React.FC = () => {
  const {
    undo,
    canUndo,
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
      <div className="mb-4 rounded-2xl border border-[#384444] bg-gradient-to-r from-[#0b181b]/85 via-[#081013]/90 to-[#0b181b]/85 px-3 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.6)] text-[10px] flex flex-wrap items-center gap-2">
        {/* Left label */}
        <span className="text-[9px] text-[#808a83] uppercase tracking-[0.22em]">
          Config-Driven Balancer · Editor
        </span>

        {/* Right group: undo / export / import */}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border transition-colors ${
              canUndo
                ? 'border-amber-400/70 text-amber-200 hover:bg-amber-500/15'
                : 'border-[#2b3434] text-[#4b5555] cursor-not-allowed'
            }`}
          >
            <span aria-hidden className="text-xs">↺</span>
            <span className="tracking-[0.18em] uppercase">Undo</span>
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-emerald-500/70 text-emerald-200 hover:bg-emerald-500/15 transition-colors"
          >
            <span aria-hidden className="text-xs">⭳</span>
            <span className="tracking-[0.18em] uppercase">Export</span>
          </button>
          <button
            type="button"
            onClick={handleImportClick}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-cyan-500/70 text-cyan-200 hover:bg-cyan-500/15 transition-colors"
          >
            <span aria-hidden className="text-xs">⭱</span>
            <span className="tracking-[0.18em] uppercase">Import</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImportChange}
          />
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
;

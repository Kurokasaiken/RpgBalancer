import React, { useRef } from 'react';
import { useBalancerConfig } from '../../balancing/hooks/useBalancerConfig';
import { ToastContainer, useToast } from './Toast';

const SIM_VALUES_KEY = 'balancer_sim_values';

/**
 * Toolbar component for configuration management with import/export and undo functionality.
 */
export const ConfigToolbar: React.FC = () => {
  const {
    undo,
    canUndo,
    exportConfig,
    importConfig,
    resetToInitialConfig,
  } = useBalancerConfig();

  const { showToast, toasts, removeToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExport = async () => {
    try {
      // Export both config and simValues
      const configJson = await exportConfig();
      const config = JSON.parse(configJson);
      const simValues = localStorage.getItem(SIM_VALUES_KEY);
      const exportData = {
        ...config,
        _simValues: simValues ? JSON.parse(simValues) : {},
      };
      const json = JSON.stringify(exportData, null, 2);

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

  const handleImportChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const text = reader.result as string;
        const parsed = JSON.parse(text);

        // Extract simValues if present
        const { _simValues, ...configData } = parsed;

        // Import config (without _simValues)
        const result = await importConfig(JSON.stringify(configData));
        if (!result.success) {
          showToast(`Errore import: ${result.error}`, 'error');
          return;
        }

        // Handle simValues:
        // If present in file, use them.
        // If NOT present, CLEAR the local storage so Balancer resets to config defaults.
        // This is crucial to prevent stale values from overriding new formulas or defaults.
        if (_simValues && typeof _simValues === 'object') {
          localStorage.setItem(SIM_VALUES_KEY, JSON.stringify(_simValues));
        } else {
          localStorage.removeItem(SIM_VALUES_KEY);
        }

        showToast('Configurazione importata con successo', 'success');

        // Force page reload to ensure simValues are picked up correctly
        // (Balancer initializes state from localStorage on mount)
        window.location.reload();
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

  const [resetConfirmPending, setResetConfirmPending] = React.useState(false);

  const handleResetAll = async () => {
    if (!resetConfirmPending) {
      setResetConfirmPending(true);
      showToast('Clicca di nuovo per confermare reset completo', 'info');
      // Small window to confirm reset without blocking UI
      setTimeout(() => {
        setResetConfirmPending(false);
      }, 3000);
      return;
    }

    setResetConfirmPending(false);
    try {
      // Clear simValues so that the next config snapshot repopulates them from defaults
      localStorage.removeItem(SIM_VALUES_KEY);
      // Reset config to the initial snapshot stored by useBalancerConfig
      await resetToInitialConfig();
      showToast('Configurazione resettata ai valori iniziali', 'success');
    } catch (e) {
      showToast(`Errore durante reset: ${(e as Error).message}`, 'error');
    }
  };

  return (
    <>
      <div className="mb-4 rounded-2xl border border-[#384444] bg-linear-to-r from-[#0b181b]/85 via-[#081013]/90 to-[#0b181b]/85 px-3 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.6)] text-[10px] flex flex-wrap items-center gap-2">
        {/* Left label */}
        <span className="text-[9px] text-[#808a83] uppercase tracking-[0.22em]">
          Config-Driven Balancer · Editor
        </span>

        {/* Right group: undo / reset / export / import */}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border transition-colors ${canUndo
                ? 'border-amber-400/70 text-amber-200 hover:bg-amber-500/15'
                : 'border-[#2b3434] text-[#4b5555] cursor-not-allowed'
              }`}
          >
            <span aria-hidden className="text-xs">↺</span>
            <span className="tracking-[0.18em] uppercase">Undo</span>
          </button>
          <button
            type="button"
            onClick={handleResetAll}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border transition-colors ${resetConfirmPending
                ? 'border-red-500/70 text-red-200 bg-red-500/10 animate-pulse'
                : 'border-rose-500/70 text-rose-200 hover:bg-rose-500/15'
              }`}
          >
            <span aria-hidden className="text-xs">⚠</span>
            <span className="tracking-[0.18em] uppercase">{resetConfirmPending ? 'Conferma' : 'Reset'}</span>
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

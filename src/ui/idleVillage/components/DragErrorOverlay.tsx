import React, { useCallback } from 'react';
import { X, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import type { DragErrorRemediationAction, DragErrorSeverity } from '@/ui/idleVillage/config/dragErrorRecoveryConfig';
import type { ActiveDragError, DragErrorRecoveryActionContext } from '@/ui/idleVillage/hooks/useDragErrorRecovery';

interface DragErrorOverlayProps {
  error: ActiveDragError;
  onDismiss: () => void;
  onAction: (ctx: DragErrorRecoveryActionContext) => void;
  autoOpen: boolean;
}

const severityStyles: Record<DragErrorSeverity, { bg: string; border: string; icon: React.ReactNode }> = {
  info: {
    bg: 'bg-blue-900/90',
    border: 'border-blue-400',
    icon: <Info className="w-5 h-5 text-blue-300" />,
  },
  warning: {
    bg: 'bg-amber-900/90',
    border: 'border-amber-400',
    icon: <AlertTriangle className="w-5 h-5 text-amber-300" />,
  },
  error: {
    bg: 'bg-red-900/90',
    border: 'border-red-400',
    icon: <AlertTriangle className="w-5 h-5 text-red-300" />,
  },
};

export function DragErrorOverlay({ error, onDismiss, onAction, autoOpen }: DragErrorOverlayProps) {
  const handleAction = useCallback(
    (action: DragErrorRemediationAction) => {
      onAction({ action, error });
      if (action.action === 'acknowledge') {
        onDismiss();
      }
    },
    [error, onAction, onDismiss],
  );

  const style = severityStyles[error.definition.severity];

  if (!autoOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pointer-events-none"
      role="alertdialog"
      aria-labelledby="drag-error-title"
      aria-describedby="drag-error-description"
    >
      <div
        className={`${style.bg} backdrop-blur-sm border ${style.border} rounded-lg shadow-2xl max-w-md w-full p-4 pointer-events-auto transform transition-all duration-300 ease-out`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {style.icon}
            <h3 id="drag-error-title" className="text-sm font-semibold text-white">
              {error.definition.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="text-white/60 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
            aria-label="Chiudi errore drag"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <p id="drag-error-description" className="text-xs text-white/80 mb-4 leading-relaxed">
          {error.definition.description}
        </p>

        {/* Custom message if present */}
        {error.message && error.message !== error.definition.description && (
          <div className="bg-white/5 rounded p-2 mb-4">
            <p className="text-xs text-white/70">{error.message}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {error.definition.remediation.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => handleAction(action)}
              className="flex items-center justify-between w-full text-left px-3 py-2 rounded bg-white/10 hover:bg-white/20 transition-colors group"
            >
              <span className="text-xs font-medium text-white group-hover:text-white/90">
                {action.label}
              </span>
              {action.action === 'retry' && <CheckCircle className="w-4 h-4 text-green-300" />}
              {action.action === 'open_diagnostics' && <Info className="w-4 h-4 text-blue-300" />}
              {action.action === 'open_docs' && <AlertTriangle className="w-4 h-4 text-amber-300" />}
            </button>
          ))}
        </div>

        {/* Footer metadata */}
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between text-xs text-white/50">
            <span>
              {error.residentId && `Residente: ${error.residentId}`}
              {error.activityId && ` • Attività: ${error.activityId}`}
            </span>
            <span>{new Date(error.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

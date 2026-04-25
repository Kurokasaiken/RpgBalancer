import type { DragEvent as ReactDragEvent, ReactNode } from 'react';
import JobActionCard from '@/ui/idleVillage/map/actionCards/JobActionCard';
import { RESIDENT_DRAG_MIME } from '@/ui/idleVillage/constants';

/**
 * Props required by {@link ActionDetailHarness}.
 */
export type ActionDetailHarnessProps = {
  /** Title rendered above the harness card. */
  title: string;
  /** Target slot identifier associated with the harness. */
  slotId: string | null;
  /** Optional friendly label for the currently assigned resident. */
  assignedResidentName?: string | null;
  /** Optional helper text sourced from the activity definition. */
  helperText?: string;
  /** Icon rendered inside the harness action card. */
  icon?: ReactNode;
  /** Current drop compatibility state derived from the drag controller. */
  dropState: 'idle' | 'valid' | 'invalid';
  /** Whether the underlying activity is actively running. */
  isPlaying: boolean;
  /** Progress fraction (0-1) exposed by the scheduler. */
  progressFraction: number;
  /** Elapsed seconds reported by the scheduler. */
  elapsedSeconds: number;
  /** Total duration in seconds for the slot activity. */
  totalDurationSeconds: number;
  /** Formatted elapsed label (e.g. `1:23`). */
  elapsedLabel: string;
  /** Formatted remaining label mirroring elapsed formatting. */
  remainingLabel: string;
  /** Optional handler invoked when the inspector button is pressed. */
  onInspect?: () => void;
  /** Optional handler invoked when the Start button is pressed. */
  onStart?: () => void;
  /** Callback executed when a resident is dropped on the harness. */
  onJobDrop: (residentId: string) => void;
  /** Drag-over handler to keep drop feedback in sync with other slots. */
  onJobDragOver: (event: ReactDragEvent<HTMLDivElement>) => void;
  /** Whether the harness should render bloom (only honored for valid drops). */
  showBloom: boolean;
};

/**
 * Visual harness replicating the Activity Detail dropzone so we can test drag/drop + timers
 * alongside the roster without opening the full detail panel/UI overlay.
 */
const ActionDetailHarness: React.FC<ActionDetailHarnessProps> = ({
  title,
  slotId,
  assignedResidentName,
  helperText,
  icon,
  dropState,
  isPlaying,
  progressFraction,
  elapsedSeconds,
  totalDurationSeconds,
  elapsedLabel,
  remainingLabel,
  onInspect,
  onStart,
  onJobDrop,
  onJobDragOver,
  showBloom,
}) => {
  const shouldShowBloom = showBloom && dropState === 'valid';

  return (
    <div className="default-card rounded-2xl border border-white/10 bg-black/50 p-4 space-y-3" data-testid="action-detail-harness">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">Action Detail Harness</p>
          <p className="text-sm text-slate-200">{title}</p>
        </div>
        {onInspect && (
          <button
            type="button"
            onClick={onInspect}
            className="rounded-full border border-white/15 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-slate-200 hover:border-amber-200/60 hover:text-amber-100"
            data-testid="action-detail-harness-inspect"
          >
            Dettaglio
          </button>
        )}
      </header>

      <div
        className={`w-full flex items-center justify-center p-2 relative ${dropState === 'invalid' ? 'opacity-50 pointer-events-none' : ''}`}
        data-testid="action-detail-harness-dropzone"
        aria-disabled={dropState === 'invalid'}
        onDrop={(event) => {
          event.preventDefault();
          if (dropState === 'invalid') {
            return;
          }
          const residentId = event.dataTransfer.getData(RESIDENT_DRAG_MIME) ||
            event.dataTransfer.getData('text/plain');

          if (residentId) {
            onJobDrop(residentId);
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          onJobDragOver(event);
        }}
      >
        {slotId ? (
          <JobActionCard
            label={title}
            icon={icon ?? <span aria-hidden>⚒️</span>}
            progressFraction={progressFraction}
            elapsedSeconds={elapsedSeconds}
            totalDurationSeconds={Math.max(1, totalDurationSeconds)}
            isPlaying={isPlaying}
            dropState={dropState}
            helperText={helperText}
            dataTestId="action-detail-harness-card"
            onMedallionClick={onInspect}
          />
        ) : (
          <div className="text-[11px] text-slate-500">Nessuna attività configurata.</div>
        )}
        {shouldShowBloom && (
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl blur-xl transition-all duration-300 bg-linear-to-br from-emerald-400/25 via-transparent to-cyan-400/20"
            style={{ opacity: 0.7 }}
            data-testid="action-detail-harness-bloom"
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-[11px] uppercase tracking-[0.25em] text-slate-400">
        <div>
          <p className="text-slate-500">Assegnato</p>
          <p className="text-amber-200 text-sm">
            {assignedResidentName ?? (slotId ? 'Nessuno' : '—')}
          </p>
        </div>
        <div>
          <p className="text-slate-500">Slot ID</p>
          <p className="text-slate-200 text-sm">{slotId ?? 'N/A'}</p>
        </div>
        <div>
          <p className="text-slate-500">Elapsed</p>
          <p className="text-slate-200 text-sm">{elapsedLabel}</p>
        </div>
        <div>
          <p className="text-slate-500">Remaining</p>
          <p className="text-slate-200 text-sm">{remainingLabel}</p>
        </div>
      </div>

      {onStart && (
        <button
          type="button"
          className="w-full rounded-xl border border-emerald-300/60 px-4 py-2 text-[11px] uppercase tracking-[0.35em] text-emerald-200 hover:border-emerald-200 disabled:opacity-40"
          disabled={!slotId}
          onClick={onStart}
          data-testid="action-detail-harness-start"
        >
          Avvia Slot
        </button>
      )}
    </div>
  );
};

export default ActionDetailHarness;

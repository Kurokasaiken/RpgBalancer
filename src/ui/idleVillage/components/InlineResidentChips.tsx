import React, { useMemo } from 'react';
import type { SlotCompatibilityDiagnosticsEntry } from '@/ui/idleVillage/types/compatibility';

/**
 * Metadata describing the slot that triggered the assignment picker.
 */
export interface ResidentPickerSlotMeta {
  /** Slot identifier used for telemetry/logging. */
  slotId: string;
  /** Human-readable label surfaced to designers. */
  label: string;
  /** Optional activity label (different from slot label) to display context. */
  activityLabel?: string;
  /** Observatory icon token for the slot. */
  iconName?: string;
  /** Additional descriptive copy coming from config. */
  description?: string;
}

/**
 * View model for every resident rendered inside the picker.
 */
export interface ResidentAssignmentCandidate {
  /** Resident identifier (must match scheduler ids). */
  id: string;
  /** Display name shown in the UI. */
  displayName: string;
  /** Observatory status label (e.g., Available, Exhausted). */
  statusLabel: string;
  /** Current fatigue value so designers can judge readiness. */
  fatigue: number;
  /** Optional portrait URL for richer visuals. */
  portraitUrl?: string | null;
  /** Compatibility diagnostics coming from the drag controller. */
  compatibility: SlotCompatibilityDiagnosticsEntry;
}

/**
 * Props accepted by {@link ResidentAssignmentPicker}.
 */
export interface ResidentAssignmentPickerProps {
  /** Controls visibility of the picker overlay. */
  isOpen: boolean;
  /** Slot metadata describing the current assignment context. */
  slotMeta: ResidentPickerSlotMeta | null;
  /** Candidate residents with compatibility diagnostics. */
  residents: ResidentAssignmentCandidate[];
  /** Callback fired when the user confirms an assignment. */
  onAssign: (residentId: string) => void;
  /** Dismiss handler invoked by close button, Escape, or overlay click. */
  onClose: () => void;
  /** Optional inspector for resident detail cards. */
  onInspectResident?: (residentId: string) => void;
}

const InlineResidentChips: React.FC<ResidentAssignmentPickerProps> = ({
  isOpen,
  slotMeta: _slotMeta,
  residents,
  onAssign,
  onClose: _onClose,
  onInspectResident,
}) => {
  const sortedResidents = useMemo(() => {
    return [...residents].sort((a, b) => {
      if (b.compatibility.score !== a.compatibility.score) {
        return b.compatibility.score - a.compatibility.score;
      }
      return a.displayName.localeCompare(b.displayName);
    });
  }, [residents]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {sortedResidents.length === 0 ? (
        <p className="text-sm text-slate-400">Nessun residente compatibile.</p>
      ) : (
        sortedResidents.map((resident) => {
          const isValid = resident.compatibility.reason === 'valid';
          const scorePercent = Math.round(resident.compatibility.score * 100);

          return (
            <div
              key={resident.id}
              className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm"
            >
              {resident.portraitUrl ? (
                <img
                  src={resident.portraitUrl}
                  alt=""
                  className="h-6 w-6 rounded-full border border-white/20 object-cover"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20 text-xs">
                  🛡️
                </div>
              )}
              <span className="text-slate-100">{resident.displayName}</span>
              <span className="text-xs text-slate-400">({scorePercent}%)</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="rounded px-2 py-1 text-xs uppercase tracking-wide text-slate-200 transition hover:text-amber-100"
                  onClick={() => onInspectResident?.(resident.id)}
                >
                  Dettagli
                </button>
                <button
                  type="button"
                  disabled={!isValid}
                  className={`rounded px-2 py-1 text-xs uppercase tracking-wide transition ${
                    isValid
                      ? 'text-emerald-100 hover:text-emerald-200'
                      : 'text-slate-500 cursor-not-allowed'
                  }`}
                  onClick={() => onAssign(resident.id)}
                >
                  Assegna
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default InlineResidentChips;

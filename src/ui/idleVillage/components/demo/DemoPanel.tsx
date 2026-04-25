import type { DemoPanelState, ResidentSlotViewModel } from '@/ui/idleVillage/hooks/useSandboxDemoPanel';

/**
 * Props for the DemoPanel component.
 */
interface DemoPanelProps {
  demoPanelState: DemoPanelState;
  demoPanelHandlers: {
    setRequirement: (requirement: 'none' | 'hp200') => void;
    onStart: () => void;
  };
}

/**
 * DemoPanel component for Village Sandbox, providing demo activity controls.
 * Displays requirement selection, slot assignments, and start demo functionality.
 */
export function DemoPanel({ demoPanelState, demoPanelHandlers }: DemoPanelProps) {
  const { requirement, requirementDescription, slotViewModels, hasAssignments } = demoPanelState;
  const { setRequirement, onStart } = demoPanelHandlers;

  return (
    <div
      className="observatory-card bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-sm"
      data-testid="demo-panel"
    >
      <h3 className="text-lg font-semibold text-amber-900 mb-3">Demo Panel</h3>

      {/* Requirement Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-amber-800 mb-2">Requisito Slot</label>
        <div className="flex gap-2">
          <button
            onClick={() => setRequirement('none')}
            data-testid="demo-requirement-none"
            aria-pressed={requirement === 'none'}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              requirement === 'none'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            }`}
          >
            Nessuno
          </button>
          <button
            onClick={() => setRequirement('hp200')}
            data-testid="demo-requirement-hp200"
            aria-pressed={requirement === 'hp200'}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              requirement === 'hp200'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            }`}
          >
            200 HP
          </button>
        </div>
        <p className="text-xs text-amber-600 mt-1" data-testid="demo-requirement-description">
          {requirementDescription}
        </p>
      </div>

      {/* Slot Display */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-amber-800 mb-2">Slot Assegnati</label>
        <div className="flex gap-2 flex-wrap" data-testid="demo-slot-group">
          {slotViewModels.map((slot) => (
            <SlotView key={slot.id} slot={slot} />
          ))}
        </div>
      </div>

      {/* Start Demo Button */}
      <button
        onClick={onStart}
        disabled={!hasAssignments}
        data-testid="demo-start-button"
        className={`w-full px-4 py-2 rounded font-medium transition-colors ${
          hasAssignments
            ? 'bg-amber-600 text-white hover:bg-amber-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        Start Demo
      </button>
    </div>
  );
}

/**
 * Component to render a single demo slot.
 */
function SlotView({ slot }: { slot: ResidentSlotViewModel }) {
  const baseClasses = "flex items-center justify-center w-12 h-12 rounded border-2 text-sm font-medium";

  if (slot.isPlusButton) {
    return (
      <div
        className={`${baseClasses} bg-amber-200 border-amber-400 text-amber-800`}
        data-testid="demo-slot-plus"
        aria-label="Aggiungi nuovo slot demo"
        data-slot-kind="plus"
      >
        +
      </div>
    );
  }

  const assigned = slot.assignedResident;
  const hasAssignment = Boolean(assigned);
  const assignedName = assigned?.displayName?.trim() || assigned?.id;

  return (
    <div
      data-testid={`demo-slot-${slot.id}`}
      data-slot-kind="assignment"
      aria-label={
        hasAssignment
          ? `Slot ${slot.label} occupato da ${assignedName ?? 'residente sconosciuto'}`
          : `Slot ${slot.label} vuoto`
      }
      className={`${baseClasses} ${
        hasAssignment
          ? 'bg-amber-300 border-amber-500 text-amber-900'
          : 'bg-amber-100 border-amber-300 text-amber-700'
      }`}
    >
      {hasAssignment ? (assigned?.displayName?.charAt(0).toUpperCase() || assigned?.id?.charAt(0).toUpperCase() || '?') : slot.label}
    </div>
  );
}

export default DemoPanel;

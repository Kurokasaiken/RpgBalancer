import { memo, useMemo } from 'react';
import type {
  ModifierScope,
  ModifierStatusPalette,
} from '../tokens/defaultStyleLabPreset';
import { useStyleLabTokens } from '../hooks/useStyleLabTokens';
import type {
  LifetimeType,
  ModifierOperation,
  OwnerType,
} from '@/balancing/types/gameplayModifierTypes';

/** Lifecycle rendering state derived from GM-ENG timing. */
export type ModifierLifecycleStatus = 'active' | 'expired' | 'upcoming';

/** Metadata about how long a modifier persists. */
export interface StatModifierEntryLifetime {
  type: LifetimeType;
  /** Formatted label supplied by GM-ENG or registry (e.g. "45s"). */
  label?: string;
  remainingTicks?: number;
}

/** View-model for a single modifier entry displayed in StatModifierDisplay. */
export interface StatModifierEntry {
  id: string;
  label: string;
  statId: string;
  scope: ModifierScope;
  valueLabel: string;
  operation: ModifierOperation;
  owner?: {
    id: string;
    label: string;
    type: OwnerType;
  };
  stackCount?: number;
  maxStacks?: number;
  lifetime?: StatModifierEntryLifetime;
  status?: ModifierLifecycleStatus;
  description?: string;
  sourceConfigId?: string;
}

export interface StatModifierDisplayProps {
  modifierEntries?: StatModifierEntry[];
  isLoading?: boolean;
  maxVisible?: number;
  emptyLabel?: string;
  testId?: string;
  showHeader?: boolean;
}

const defaultEmptyLabel = 'Nessun modificatore registrato';

const operationSymbols: Record<ModifierOperation, string> = {
  ADD: '+',
  MULT: '×',
  SET: '=',
};

const statusLabels: Record<ModifierLifecycleStatus, string> = {
  active: 'Attivo',
  expired: 'Scaduto',
  upcoming: 'In arrivo',
};

const SkeletonRow = () => (
  <li className="animate-pulse rounded-2xl border border-white/5 bg-white/5/50 p-3">
    <div className="h-4 w-28 rounded bg-white/10" />
    <div className="mt-3 flex gap-2">
      <div className="h-3 w-20 rounded bg-white/10" />
      <div className="h-3 w-16 rounded bg-white/10" />
    </div>
  </li>
);

const formatLifetimeLabel = (lifetime?: StatModifierEntryLifetime) => {
  if (!lifetime) return null;
  if (lifetime.label) return lifetime.label;
  if (typeof lifetime.remainingTicks === 'number') {
    return `${lifetime.remainingTicks}t`;
  }
  return lifetime.type.toLowerCase();
};

const getStatusPalette = (
  status: ModifierLifecycleStatus | undefined,
  modifierStatus: StatModifierDisplayState['modifierStatus'],
): ModifierStatusPalette | null => {
  if (!status) return null;
  return modifierStatus[status] ?? null;
};

interface StatModifierDisplayState {
  modifierStatus: {
    active: ModifierStatusPalette;
    expired: ModifierStatusPalette;
    upcoming: ModifierStatusPalette;
  };
  modifierScopes: ReturnType<typeof useStyleLabTokens>['modifierScopes'];
}

/**
 * Visualizes registry-driven stat modifiers using Style Lab scope/status tokens.
 * Pure presentational component consuming already-resolved modifier view models.
 */
const StatModifierDisplayComponent = ({
  modifierEntries,
  isLoading = false,
  maxVisible = 5,
  emptyLabel = defaultEmptyLabel,
  testId,
  showHeader = true,
}: StatModifierDisplayProps) => {
  const { modifierScopes, modifierStatus } = useStyleLabTokens();

  const entries = useMemo(() => {
    if (!modifierEntries) return [];
    return modifierEntries.slice(0, maxVisible);
  }, [modifierEntries, maxVisible]);

  const showEmptyState = !isLoading && entries.length === 0;

  const renderScopeBadge = (scope: ModifierScope) => {
    const palette = modifierScopes[scope];
    return (
      <span
        className="inline-flex items-center rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.25em]"
        style={{
          background: palette.background,
          border: `1px solid ${palette.border}`,
          color: palette.foreground,
          boxShadow: `0 0 14px ${palette.glow}`,
        }}
      >
        {scope}
      </span>
    );
  };

  const renderStackPill = (entry: StatModifierEntry) => {
    if (!entry.maxStacks || entry.maxStacks <= 1) return null;
    const stackLabel = `${entry.stackCount ?? 1}/${entry.maxStacks}`;
    return (
      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-slate-200">
        Stack {stackLabel}
      </span>
    );
  };

  const renderStatusPill = (entry: StatModifierEntry) => {
    const palette = getStatusPalette(entry.status, modifierStatus);
    if (!palette || !entry.status) return null;
    return (
      <span
        className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.2em]"
        style={{
          background: palette.background,
          border: `1px solid ${palette.border}`,
          color: palette.foreground,
        }}
      >
        {statusLabels[entry.status]}
      </span>
    );
  };

  const renderLifetimePill = (entry: StatModifierEntry) => {
    const label = formatLifetimeLabel(entry.lifetime);
    if (!label) return null;
    return (
      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-slate-200">
        {label}
      </span>
    );
  };

  const renderValue = (entry: StatModifierEntry) => (
    <span className="font-semibold text-emerald-200">
      {operationSymbols[entry.operation]}
      {entry.valueLabel}
    </span>
  );

  return (
    <section
      data-testid={testId ?? 'stat-modifier-display'}
      className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5/20 p-4"
      style={{ fontFamily: 'var(--stylelab-body-font)' }}
    >
      {showHeader && (
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Registry</p>
            <h3 className="text-lg font-semibold tracking-wide text-white">Modifier status</h3>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
            <span>Scope palette</span>
          </div>
        </header>
      )}

      {isLoading && (
        <ul className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonRow key={`modifier-skeleton-${index}`} />
          ))}
        </ul>
      )}

      {showEmptyState && (
        <div className="rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center text-sm text-slate-400">
          {emptyLabel}
        </div>
      )}

      {!showEmptyState && !isLoading && (
        <ul className="flex flex-col gap-3">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="rounded-2xl border border-white/10 bg-black/35 p-4 shadow-[0_15px_45px_rgba(3,6,23,0.7)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{entry.statId}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-white">{entry.label}</span>
                    {renderValue(entry)}
                  </div>
                </div>
                {renderScopeBadge(entry.scope)}
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-300">
                {entry.description && <span>{entry.description}</span>}
                {entry.owner && <span>• {entry.owner.label}</span>}
                {entry.sourceConfigId && <span>• {entry.sourceConfigId}</span>}
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-[10px]">
                {renderStackPill(entry)}
                {renderLifetimePill(entry)}
                {renderStatusPill(entry)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export const StatModifierDisplay = memo(StatModifierDisplayComponent);
StatModifierDisplay.displayName = 'StatModifierDisplay';

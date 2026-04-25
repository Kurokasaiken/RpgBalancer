import { useCallback, useEffect, useMemo, useState } from 'react';
import { nanoid } from 'nanoid';
import { loadData, saveData } from '@/shared/persistence/PersistenceService';
import { createSandboxDiagnostics } from '@/ui/idleVillage/utils/sandboxDiagnostics';
import {
  getDragErrorRecoveryConfig,
  type DragErrorDefinition,
  type DragErrorRecoveryConfig,
  type DragErrorRemediationAction,
} from '@/ui/idleVillage/config/dragErrorRecoveryConfig';
import { dragErrorRecoveryAnalytics } from '@/analytics/idleVillageDragErrorRecovery';

export type DragDropErrorCode = keyof DragErrorRecoveryConfig['errors'] | 'unknown' | 'validation_failed';

export type DragErrorSource = 'validation' | 'scheduler' | 'location' | 'unknown';

export interface DragErrorEvent {
  source: DragErrorSource;
  residentId?: string;
  activityId?: string;
  validationRule?: string;
  code?: DragDropErrorCode;
  message?: string;
  context?: Record<string, unknown>;
}

export interface ActiveDragError {
  id: string;
  definition: DragErrorDefinition;
  residentId?: string;
  activityId?: string;
  message?: string;
  timestamp: number;
  source: DragErrorSource;
  context?: Record<string, unknown>;
}

export interface DragErrorRecoveryState {
  autoOpen: boolean;
  activeError?: ActiveDragError;
  history: ActiveDragError[];
}

export interface DragErrorRecoveryActionContext {
  action: DragErrorRemediationAction;
  error: ActiveDragError;
}

export interface UseDragErrorRecoveryHook {
  state: DragErrorRecoveryState;
  reportError: (event: DragErrorEvent) => void;
  dismissError: () => void;
  setAutoOpen: (next: boolean) => Promise<void>;
  trackAction: (ctx: DragErrorRecoveryActionContext) => void;
}

const diagnostics = createSandboxDiagnostics('drag-error-recovery', 'drag');

const usePersistentBoolean = (key: string, fallback: boolean): [boolean, (value: boolean) => Promise<void>] => {
  const [value, setValue] = useState(fallback);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const persisted = await loadData<boolean>(key, fallback);
        if (typeof persisted === 'boolean' && isMounted) {
          setValue(persisted);
        }
      } catch (error) {
        diagnostics.warn('auto_open_load_failed', { error, key });
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [fallback, key]);

  const persist = useCallback(
    async (next: boolean) => {
      setValue(next);
      try {
        await saveData(key, next);
      } catch (error) {
        diagnostics.warn('auto_open_save_failed', { error, key, next });
      }
    },
    [key],
  );

  return [value, persist];
};

const resolveErrorDefinition = (
  config: DragErrorRecoveryConfig,
  event: DragErrorEvent,
): DragErrorDefinition => {
  const mappedCode = event.code ?? config.validationRuleMap[event.validationRule ?? ''] ?? 'unknown';
  return config.errors[mappedCode] ?? config.fallbackError;
};

export function useDragErrorRecovery(): UseDragErrorRecoveryHook {
  const config = useMemo(() => getDragErrorRecoveryConfig(), []);
  const [autoOpen, persistAutoOpen] = usePersistentBoolean(config.persistenceKey, config.autoOpenByDefault);
  const [activeError, setActiveError] = useState<ActiveDragError | undefined>(undefined);
  const [history, setHistory] = useState<ActiveDragError[]>([]);

  const reportError = useCallback(
    (event: DragErrorEvent) => {
      if (config.devOnly && typeof window !== 'undefined' && window.location.pathname.includes('/prod')) {
        return;
      }

      const definition = resolveErrorDefinition(config, event);
      const entry: ActiveDragError = {
        id: nanoid(),
        definition,
        message: event.message ?? definition.defaultMessage,
        residentId: event.residentId,
        activityId: event.activityId,
        timestamp: Date.now(),
        source: event.source,
        context: event.context,
      };

      diagnostics.info('drag_error_reported', {
        code: definition.code,
        source: event.source,
        residentId: event.residentId,
        activityId: event.activityId,
      });

      dragErrorRecoveryAnalytics.recordEvent({
        type: 'overlay_shown',
        errorCode: definition.code,
        residentId: event.residentId,
        metadata: event.context,
      });

      setActiveError(entry);
      setHistory((prev) => [entry, ...prev].slice(0, 20));
    },
    [config],
  );

  const dismissError = useCallback(() => {
    if (!activeError) return;
    diagnostics.info('drag_error_dismissed', { errorId: activeError.id, code: activeError.definition.code });
    dragErrorRecoveryAnalytics.recordEvent({
      type: 'overlay_dismissed',
      errorCode: activeError.definition.code,
      residentId: activeError.residentId,
    });
    setActiveError(undefined);
  }, [activeError]);

  const setAutoOpen = useCallback(
    async (next: boolean) => {
      await persistAutoOpen(next);
      diagnostics.info('drag_error_auto_open_changed', { next });
      dragErrorRecoveryAnalytics.recordEvent({ type: 'auto_open_changed', metadata: { next } });
    },
    [persistAutoOpen],
  );

  const trackAction = useCallback(
    ({ action, error }: DragErrorRecoveryActionContext) => {
      diagnostics.info('drag_error_action', {
        actionId: action.id,
        actionType: action.action,
        telemetryTag: action.telemetryTag,
        errorCode: error.definition.code,
        residentId: error.residentId,
      });
      dragErrorRecoveryAnalytics.recordEvent({
        type: 'action_performed',
        actionId: action.id,
        actionType: action.action,
        errorCode: error.definition.code,
        residentId: error.residentId,
      });
    },
    [],
  );

  return {
    state: {
      autoOpen,
      activeError,
      history,
    },
    reportError,
    dismissError,
    setAutoOpen,
    trackAction,
  };
}

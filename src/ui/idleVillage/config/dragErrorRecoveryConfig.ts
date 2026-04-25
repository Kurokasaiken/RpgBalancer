export type DragErrorSeverity = 'info' | 'warning' | 'error';

export type DragDropErrorCode =
  | 'validation_failed'
  | 'fatigue_threshold'
  | 'crew_capacity'
  | 'slot_locked'
  | 'scheduler_rejection'
  | 'location_no_target'
  | 'resident_unavailable'
  | 'resident_not_found'
  | 'unknown';

export type DragErrorRemediationActionType =
  | 'retry'
  | 'open_docs'
  | 'open_diagnostics'
  | 'contact_ai_tutor'
  | 'acknowledge';

export interface DragErrorRemediationAction {
  /** Unique identifier for analytics */
  id: string;
  /** Short label rendered inside the overlay */
  label: string;
  /** Longer description to help designers understand the fix */
  description: string;
  /** Action semantic used by the overlay */
  action: DragErrorRemediationActionType;
  /** Optional resource link */
  href?: string;
  /** Optional telemetry tag */
  telemetryTag?: string;
}

export interface DragErrorDefinition {
  code: DragDropErrorCode;
  title: string;
  description: string;
  severity: DragErrorSeverity;
  icon?: string;
  defaultMessage?: string;
  remediation: DragErrorRemediationAction[];
}

export interface DragErrorRecoveryTelemetryConfig {
  channel: 'drag_error_overlay';
  maxEvents: number;
}

export interface DragErrorRecoveryConfig {
  devOnly: boolean;
  autoOpenByDefault: boolean;
  persistenceKey: string;
  telemetry: DragErrorRecoveryTelemetryConfig;
  /** Primary error catalog */
  errors: Record<DragDropErrorCode, DragErrorDefinition>;
  /** Default definition when no mapping exists */
  fallbackError: DragErrorDefinition;
  /** Maps validation rules (fatigue_threshold, etc.) to error codes */
  validationRuleMap: Record<string, DragDropErrorCode>;
}

const DEFAULT_DRAG_ERROR_RECOVERY_CONFIG: DragErrorRecoveryConfig = {
  devOnly: false,
  autoOpenByDefault: true,
  persistenceKey: 'idleVillage.dragErrorRecovery.autoOpen',
  telemetry: {
    channel: 'drag_error_overlay',
    maxEvents: 50,
  },
  errors: {
    validation_failed: {
      code: 'validation_failed',
      title: 'Assegnamento non valido',
      description:
        'Il residente non soddisfa i requisiti della slot oppure la validazione ha restituito un errore generico.',
      severity: 'warning',
      icon: '⚠️',
      remediation: [
        {
          id: 'open_diagnostics',
          label: 'Apri Diagnostics',
          description: 'Analizza i log del validator per capire quale regola è fallita.',
          action: 'open_diagnostics',
          telemetryTag: 'diagnostics',
        },
        {
          id: 'view_docs',
          label: 'Consulta guida drop rules',
          description: 'Apri la documentazione Phase E per verificare le regole di assegnamento.',
          action: 'open_docs',
          href: '/docs/plans/idle_village_scenario_planner_phase_e.html',
          telemetryTag: 'docs',
        },
      ],
    },
    fatigue_threshold: {
      code: 'fatigue_threshold',
      title: 'Residente troppo stanco',
      description: 'La fatica ha superato la soglia configurata per questa attività.',
      severity: 'warning',
      icon: '😴',
      remediation: [
        {
          id: 'rest_resident',
          label: 'Invia a riposo',
          description: 'Sposta il residente in una slot di riposo o attendi il recupero.',
          action: 'acknowledge',
          telemetryTag: 'rest',
        },
        {
          id: 'ai_tutor_fatigue',
          label: 'Chiedi all’AI Tutor',
          description: 'Ottieni suggerimenti su come ridurre la fatica tramite il tutor.',
          action: 'contact_ai_tutor',
          telemetryTag: 'ai_tutor',
        },
      ],
    },
    crew_capacity: {
      code: 'crew_capacity',
      title: 'Attività piena',
      description: 'Non ci sono slot liberi per questa attività.',
      severity: 'info',
      icon: '👥',
      remediation: [
        {
          id: 'open_activity_panel',
          label: 'Apri Activity HUD',
          description: 'Verifica chi è assegnato e libera un posto.',
          action: 'open_diagnostics',
          telemetryTag: 'hud',
        },
      ],
    },
    resident_unavailable: {
      code: 'resident_unavailable',
      title: 'Residente non disponibile',
      description: 'Il residente è impegnato o disabilitato in questa fase.',
      severity: 'warning',
      icon: '🚫',
      remediation: [
        {
          id: 'inspect_status',
          label: 'Controlla stato residente',
          description: 'Apri il roster per verificare disponibilità e infortuni.',
          action: 'open_diagnostics',
          telemetryTag: 'roster',
        },
      ],
    },
    resident_not_found: {
      code: 'resident_not_found',
      title: 'Residente non trovato',
      description: 'L’ID trascinato non corrisponde a nessun residente attivo.',
      severity: 'error',
      icon: '❓',
      remediation: [
        {
          id: 'reload_roster',
          label: 'Ricarica roster',
          description: 'Esegui un reset sandbox o ricarica i residenti.',
          action: 'retry',
          telemetryTag: 'roster_reload',
        },
      ],
    },
    slot_locked: {
      code: 'slot_locked',
      title: 'Slot bloccata',
      description: 'La slot non accetta nuove assegnazioni in questa fase.',
      severity: 'warning',
      icon: '🔒',
      remediation: [
        {
          id: 'review_phase_rules',
          label: 'Rivedi regole di fase',
          description: 'Controlla le constraints configurate nella fase corrente.',
          action: 'open_docs',
          telemetryTag: 'phase_rules',
        },
      ],
    },
    scheduler_rejection: {
      code: 'scheduler_rejection',
      title: 'Scheduler ha rifiutato l’azione',
      description: 'Il timer o le dipendenze correnti non permettono di avviare l’attività.',
      severity: 'warning',
      icon: '⏰',
      remediation: [
        {
          id: 'retry_assignment',
          label: 'Riprova assegnamento',
          description: 'Tenta di riavviare l’attività dopo aver verificato i prerequisiti.',
          action: 'retry',
          telemetryTag: 'retry',
        },
        {
          id: 'open_diagnostics_scheduler',
          label: 'Apri Diagnostics scheduler',
          description: 'Analizza il log generato da useSandboxDragController.',
          action: 'open_diagnostics',
          telemetryTag: 'scheduler_diag',
        },
      ],
    },
    location_no_target: {
      code: 'location_no_target',
      title: 'Nessuna attività compatibile trovata',
      description: 'Il drop su questa location non ha trovato attività adatte.',
      severity: 'info',
      icon: '📍',
      remediation: [
        {
          id: 'inspect_location',
          label: 'Ispeziona location',
          description: 'Apri il pannello location per capire quali attività sono presenti.',
          action: 'open_diagnostics',
          telemetryTag: 'location',
        },
      ],
    },
    unknown: {
      code: 'unknown',
      title: 'Errore drag non classificato',
      description: 'Non sono disponibili dettagli aggiuntivi.',
      severity: 'error',
      icon: '❗',
      remediation: [
        {
          id: 'acknowledge',
          label: 'OK',
          description: 'Chiudi l’overlay e riprova.',
          action: 'acknowledge',
          telemetryTag: 'ack',
        },
      ],
    },
  },
  fallbackError: {
    code: 'unknown',
    title: 'Errore drag',
    description: 'Si è verificato un errore non previsto durante il drag & drop.',
    severity: 'error',
    icon: '🛠️',
    remediation: [
      {
        id: 'open_diagnostics_generic',
        label: 'Apri Diagnostics',
        description: 'Controlla i log per ulteriori dettagli.',
        action: 'open_diagnostics',
      },
    ],
  },
  validationRuleMap: {
    stat_requirement_allOf: 'validation_failed',
    stat_requirement_anyOf: 'validation_failed',
    stat_requirement_noneOf: 'validation_failed',
    fatigue_threshold: 'fatigue_threshold',
    crew_capacity: 'crew_capacity',
    resident_availability: 'resident_unavailable',
    resident_not_found: 'resident_not_found',
    slot_locked: 'slot_locked',
    scheduler_rejection: 'scheduler_rejection',
  },
};

let overrideConfig: DragErrorRecoveryConfig | null = null;

export const getDragErrorRecoveryConfig = (): DragErrorRecoveryConfig =>
  overrideConfig ?? DEFAULT_DRAG_ERROR_RECOVERY_CONFIG;

export const overrideDragErrorRecoveryConfig = (config: Partial<DragErrorRecoveryConfig>): void => {
  overrideConfig = { ...DEFAULT_DRAG_ERROR_RECOVERY_CONFIG, ...config };
};

export const resetDragErrorRecoveryConfig = (): void => {
  overrideConfig = null;
};

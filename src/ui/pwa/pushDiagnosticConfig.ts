import type { CSSProperties } from 'react';

/**
 * Supported badge tones for diagnostic callouts.
 */
export type DiagnosticTone = 'neutral' | 'success' | 'warning' | 'danger';

export interface PushPermissionStatusConfig {
  label: string;
  description: string;
  tone: DiagnosticTone;
}

export interface PushSubscriptionStatusConfig {
  label: string;
  helper: string;
  tone: DiagnosticTone;
}

export interface PushFallbackChannelConfig {
  id: string;
  label: string;
  description: string;
  transport: 'push' | 'email' | 'sms' | 'in-app';
}

export interface PushRetryStrategyConfig {
  id: string;
  label: string;
  backoffMs: number[];
  maxAttempts: number;
}

export interface PushDiagnosticTheme {
  background: string;
  panel: string;
  border: string;
  text: string;
  mutedText: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  shadow: string;
}

export interface PushDiagnosticConfig {
  overlayTitle: string;
  overlaySubtitle: string;
  telemetryEventPrefix: string;
  defaultVisible: boolean;
  persistStateKey: string;
  pollIntervalMs: number;
  layout: {
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    width: number;
    zIndex: number;
    cardGap: number;
  };
  permission: {
    requestCtaLabel: string;
    rationale: string;
    statusMap: Record<'default' | 'granted' | 'denied' | 'unsupported', PushPermissionStatusConfig>;
  };
  subscription: {
    refreshCtaLabel: string;
    resubscribeCtaLabel: string;
    vapidPublicKeyHint?: string;
    statusMap: Record<'unknown' | 'active' | 'missing' | 'error', PushSubscriptionStatusConfig>;
  };
  fallback: {
    triggerCtaLabel: string;
    statusLabel: string;
    messageType: string;
    retryStrategies: PushRetryStrategyConfig[];
    channels: PushFallbackChannelConfig[];
  };
  serviceWorker: {
    scopeHint: string;
    versionLabel: string;
    channelLabel: string;
  };
  theme: PushDiagnosticTheme;
  badgeStyles: Record<DiagnosticTone, CSSProperties>;
}

const cardShadow = '0 25px 55px rgba(5, 8, 20, 0.55)';

const defaultTheme: PushDiagnosticTheme = {
  background: 'linear-gradient(135deg, #050816 0%, #0f172a 60%, #1e293b 100%)',
  panel: 'rgba(12, 18, 36, 0.86)',
  border: 'rgba(94, 234, 212, 0.35)',
  text: '#f8fafc',
  mutedText: 'rgba(248, 250, 252, 0.65)',
  accent: '#7dd3fc',
  success: '#34d399',
  warning: '#facc15',
  danger: '#fb7185',
  shadow: cardShadow,
};

const defaultBadgeStyles: Record<DiagnosticTone, CSSProperties> = {
  neutral: {
    background: 'rgba(148, 163, 184, 0.15)',
    border: '1px solid rgba(148, 163, 184, 0.35)',
    color: '#cbd5f5',
  },
  success: {
    background: 'rgba(52, 211, 153, 0.15)',
    border: '1px solid rgba(52, 211, 153, 0.4)',
    color: '#34d399',
  },
  warning: {
    background: 'rgba(250, 204, 21, 0.15)',
    border: '1px solid rgba(250, 204, 21, 0.4)',
    color: '#facc15',
  },
  danger: {
    background: 'rgba(251, 113, 133, 0.15)',
    border: '1px solid rgba(251, 113, 133, 0.4)',
    color: '#fb7185',
  },
};

/**
 * Baseline configuration for the Push Diagnostic Overlay.
 */
export const DEFAULT_PUSH_DIAGNOSTIC_CONFIG: PushDiagnosticConfig = {
  overlayTitle: 'Push Diagnostic Overlay',
  overlaySubtitle: 'Permessi, subscription e fallback realtime',
  telemetryEventPrefix: 'push_diag',
  defaultVisible: true,
  persistStateKey: 'pwa_push_diagnostic_overlay_state',
  pollIntervalMs: 45000,
  layout: {
    position: 'top-right',
    width: 420,
    zIndex: 4200,
    cardGap: 14,
  },
  permission: {
    requestCtaLabel: 'Richiedi permesso',
    rationale: 'Punch Club utilizza le notifiche push per consegnare training e promemoria energetici.',
    statusMap: {
      default: {
        label: 'Non richiesto',
        description: 'Il browser non ha ancora mostrato il prompt.',
        tone: 'warning',
      },
      granted: {
        label: 'Concesso',
        description: 'Le notifiche push possono essere inviate.',
        tone: 'success',
      },
      denied: {
        label: 'Negato',
        description: 'L’utente ha disattivato le notifiche.',
        tone: 'danger',
      },
      unsupported: {
        label: 'Non supportato',
        description: 'L’ambiente corrente non espone Notification API.',
        tone: 'danger',
      },
    },
  },
  subscription: {
    refreshCtaLabel: 'Aggiorna stato subscription',
    resubscribeCtaLabel: 'Forza nuova subscription',
    vapidPublicKeyHint: undefined,
    statusMap: {
      unknown: {
        label: 'In raccolta',
        helper: 'In attesa di Service Worker ready.',
        tone: 'neutral',
      },
      active: {
        label: 'Attiva',
        helper: 'Subscription presente con endpoint valido.',
        tone: 'success',
      },
      missing: {
        label: 'Assente',
        helper: 'Nessuna subscription trovata su questo device.',
        tone: 'warning',
      },
      error: {
        label: 'Errore',
        helper: 'Impossibile recuperare lo stato della subscription.',
        tone: 'danger',
      },
    },
  },
  fallback: {
    triggerCtaLabel: 'Invia fallback',
    statusLabel: 'Ultimo fallback',
    messageType: 'PWA_TRIGGER_PUSH_FALLBACK',
    retryStrategies: [
      {
        id: 'aggressive',
        label: 'Aggressive 3x',
        backoffMs: [15000, 30000, 60000],
        maxAttempts: 3,
      },
      {
        id: 'balanced',
        label: 'Balanced 5x',
        backoffMs: [30000, 60000, 120000, 240000, 480000],
        maxAttempts: 5,
      },
    ],
    channels: [
      {
        id: 'push-primary',
        label: 'Push primary',
        description: 'Notifiche VAPID inviate dal service worker Punch Club.',
        transport: 'push',
      },
      {
        id: 'email-fallback',
        label: 'Email fallback',
        description: 'Email transazionale inviata quando il push fallisce.',
        transport: 'email',
      },
      {
        id: 'in-app-alert',
        label: 'In-app alert',
        description: 'Banner in-app che replica il contenuto della notifica.',
        transport: 'in-app',
      },
    ],
  },
  serviceWorker: {
    scopeHint: '/pwa',
    versionLabel: 'SW Version',
    channelLabel: 'Message channel',
  },
  theme: defaultTheme,
  badgeStyles: defaultBadgeStyles,
};

/**
 * Deep merge helper to keep overrides config-first.
 */
export function mergePushDiagnosticConfig(overrides?: Partial<PushDiagnosticConfig>): PushDiagnosticConfig {
  if (!overrides) {
    return DEFAULT_PUSH_DIAGNOSTIC_CONFIG;
  }

  return {
    ...DEFAULT_PUSH_DIAGNOSTIC_CONFIG,
    ...overrides,
    layout: {
      ...DEFAULT_PUSH_DIAGNOSTIC_CONFIG.layout,
      ...overrides.layout,
    },
    permission: {
      ...DEFAULT_PUSH_DIAGNOSTIC_CONFIG.permission,
      ...overrides.permission,
      statusMap: {
        ...DEFAULT_PUSH_DIAGNOSTIC_CONFIG.permission.statusMap,
        ...overrides.permission?.statusMap,
      },
    },
    subscription: {
      ...DEFAULT_PUSH_DIAGNOSTIC_CONFIG.subscription,
      ...overrides.subscription,
      statusMap: {
        ...DEFAULT_PUSH_DIAGNOSTIC_CONFIG.subscription.statusMap,
        ...overrides.subscription?.statusMap,
      },
    },
    fallback: {
      ...DEFAULT_PUSH_DIAGNOSTIC_CONFIG.fallback,
      ...overrides.fallback,
      retryStrategies: overrides.fallback?.retryStrategies ?? DEFAULT_PUSH_DIAGNOSTIC_CONFIG.fallback.retryStrategies,
      channels: overrides.fallback?.channels ?? DEFAULT_PUSH_DIAGNOSTIC_CONFIG.fallback.channels,
    },
    serviceWorker: {
      ...DEFAULT_PUSH_DIAGNOSTIC_CONFIG.serviceWorker,
      ...overrides.serviceWorker,
    },
    theme: {
      ...DEFAULT_PUSH_DIAGNOSTIC_CONFIG.theme,
      ...overrides.theme,
    },
    badgeStyles: {
      ...DEFAULT_PUSH_DIAGNOSTIC_CONFIG.badgeStyles,
      ...overrides.badgeStyles,
    },
  };
}


import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { loadData, saveData } from '@/shared/persistence/PersistenceService';
import { useSWVersionManager } from '@/ui/pwa/hooks/useSWVersionManager';
import { isServiceWorkerRuntimeEnabled } from '@/ui/pwa/SWVersionManager';
import {
  mergePushDiagnosticConfig,
  type PushDiagnosticConfig,
  type PushRetryStrategyConfig,
} from '@/ui/pwa/pushDiagnosticConfig';

export interface PushDiagnosticOverlayProps {
  configOverride?: Partial<PushDiagnosticConfig>;
  vapidPublicKey?: string;
}

interface PersistedOverlayState {
  visible: boolean;
  pinnedStrategyId: string | null;
}

type PermissionStateKey = 'default' | 'granted' | 'denied' | 'unsupported';
type SubscriptionStateKey = 'unknown' | 'active' | 'missing' | 'error';

interface SubscriptionDetails {
  endpoint?: string;
  expirationTime?: number | null;
}

interface FallbackTrace {
  strategyId: string;
  channelId: string;
  timestamp: number;
}

const isBrowser = typeof window !== 'undefined';

const truncateEndpoint = (endpoint?: string): string => {
  if (!endpoint) {
    return '—';
  }
  if (endpoint.length <= 48) {
    return endpoint;
  }
  return `${endpoint.slice(0, 28)}…${endpoint.slice(-12)}`;
};

const formatTimestamp = (value?: number | null): string => {
  if (!value) {
    return '—';
  }
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
};

const base64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
};

export function PushDiagnosticOverlay({ configOverride, vapidPublicKey }: PushDiagnosticOverlayProps): JSX.Element | null {
  const swRuntimeEnabled = isServiceWorkerRuntimeEnabled();
  const config = useMemo(() => mergePushDiagnosticConfig(configOverride), [configOverride]);
  const defaultPersistentState = useMemo<PersistedOverlayState>(
    () => ({
      visible: config.defaultVisible,
      pinnedStrategyId: config.fallback.retryStrategies[0]?.id ?? null,
    }),
    [config.defaultVisible, config.fallback.retryStrategies],
  );
  const [persistedState, setPersistedState] = useState<PersistedOverlayState>(defaultPersistentState);
  const [persistenceReady, setPersistenceReady] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStateKey>('default');
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStateKey>('unknown');
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails>({});
  const [lastFallback, setLastFallback] = useState<FallbackTrace | null>(null);
  const [lastFallbackError, setLastFallbackError] = useState<string | null>(null);
  const swVersionManager = useSWVersionManager();
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const persistenceKey = config.persistStateKey;

  useEffect(() => {
    if (!isBrowser) {
      return undefined;
    }
    let canceled = false;
    setPersistenceReady(false);
    setPersistedState(defaultPersistentState);
    (async () => {
      try {
        const stored = await loadData<PersistedOverlayState>(persistenceKey, defaultPersistentState);
        if (!canceled && stored) {
          setPersistedState(stored);
        }
      } finally {
        if (!canceled) {
          setPersistenceReady(true);
        }
      }
    })();
    return () => {
      canceled = true;
    };
  }, [defaultPersistentState, persistenceKey]);

  useEffect(() => {
    if (!persistenceReady || !isBrowser) {
      return;
    }
    void saveData(persistenceKey, persistedState);
  }, [persistenceReady, persistenceKey, persistedState]);

  const refreshPermissionStatus = useCallback(() => {
    if (!isBrowser || typeof Notification === 'undefined') {
      setPermissionStatus('unsupported');
      return;
    }
    setPermissionStatus(Notification.permission as PermissionStateKey);
  }, []);

  const refreshSubscription = useCallback(async () => {
    if (!isBrowser || !('serviceWorker' in navigator)) {
      setSubscriptionStatus('missing');
      setSubscriptionDetails({ endpoint: undefined, expirationTime: null });
      return;
    }
    try {
      setSubscriptionStatus('unknown');
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        setSubscriptionStatus('missing');
        setSubscriptionDetails({ endpoint: undefined, expirationTime: null });
        return;
      }
      setSubscriptionStatus('active');
      setSubscriptionDetails({ endpoint: subscription.endpoint, expirationTime: subscription.expirationTime });
    } catch (error) {
      console.warn('[PushDiagnosticOverlay] Failed to refresh subscription', error);
      setSubscriptionStatus('error');
      setSubscriptionDetails({ endpoint: undefined, expirationTime: null });
    }
  }, []);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollTimerRef.current || !isBrowser) {
      return;
    }
    pollTimerRef.current = setInterval(() => {
      refreshPermissionStatus();
      void refreshSubscription();
    }, config.pollIntervalMs);
  }, [config.pollIntervalMs, refreshPermissionStatus, refreshSubscription]);

  useEffect(() => {
    if (!isBrowser) {
      return undefined;
    }
    refreshPermissionStatus();
    void refreshSubscription();
    startPolling();
    return () => {
      stopPolling();
    };
  }, [refreshPermissionStatus, refreshSubscription, startPolling, stopPolling]);

  const requestPermission = useCallback(async () => {
    if (!isBrowser || typeof Notification === 'undefined') {
      setPermissionStatus('unsupported');
      return;
    }
    try {
      const result = await Notification.requestPermission();
      trackTelemetryEvent(`${config.telemetryEventPrefix}_permission_request`, { result });
      setPermissionStatus(result as PermissionStateKey);
    } catch (error) {
      console.warn('[PushDiagnosticOverlay] Permission request failed', error);
      setPermissionStatus('unsupported');
    }
  }, [config.telemetryEventPrefix]);

  const refreshSubscriptionAction = useCallback(async () => {
    await refreshSubscription();
    trackTelemetryEvent(`${config.telemetryEventPrefix}_subscription_refresh`, {
      status: subscriptionStatus,
    });
  }, [config.telemetryEventPrefix, refreshSubscription, subscriptionStatus]);

  const resubscribe = useCallback(async () => {
    if (!isBrowser || !('serviceWorker' in navigator)) {
      setSubscriptionStatus('missing');
      return;
    }
    const vapidKey = vapidPublicKey ?? config.subscription.vapidPublicKeyHint;
    if (!vapidKey) {
      setSubscriptionStatus('error');
      setLastFallbackError('VAPID key non configurata.');
      return;
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        await existing.unsubscribe();
      }
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToUint8Array(vapidKey),
      });
      setSubscriptionStatus('active');
      setSubscriptionDetails({ endpoint: newSubscription.endpoint, expirationTime: newSubscription.expirationTime });
      trackTelemetryEvent(`${config.telemetryEventPrefix}_subscription_resubscribe`, {
        endpoint: newSubscription.endpoint,
      });
    } catch (error) {
      console.warn('[PushDiagnosticOverlay] Resubscribe failed', error);
      setSubscriptionStatus('error');
      setLastFallbackError(error instanceof Error ? error.message : String(error));
    }
  }, [config.subscription.vapidPublicKeyHint, config.telemetryEventPrefix, vapidPublicKey]);

  const triggerFallback = useCallback(
    async (strategy: PushRetryStrategyConfig, channelId: string) => {
      if (!isBrowser || !('serviceWorker' in navigator)) {
        setLastFallbackError('Service Worker non disponibile.');
        return;
      }
      try {
        const payload = {
          strategyId: strategy.id,
          backoffMs: strategy.backoffMs,
          maxAttempts: strategy.maxAttempts,
          channelId,
        };
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: config.fallback.messageType, payload });
        } else {
          const registration = await navigator.serviceWorker.ready;
          registration.active?.postMessage({ type: config.fallback.messageType, payload });
        }
        const trace: FallbackTrace = {
          strategyId: strategy.id,
          channelId,
          timestamp: Date.now(),
        };
        setLastFallback(trace);
        setLastFallbackError(null);
        trackTelemetryEvent(`${config.telemetryEventPrefix}_fallback_triggered`, trace);
      } catch (error) {
        console.warn('[PushDiagnosticOverlay] Fallback trigger failed', error);
        setLastFallbackError(error instanceof Error ? error.message : String(error));
      }
    },
    [config.fallback.messageType, config.telemetryEventPrefix],
  );

  const toggleVisibility = () => {
    setPersistedState(prev => ({ ...prev, visible: !prev.visible }));
  };

  const handleStrategyChange = (strategyId: string) => {
    setPersistedState(prev => ({ ...prev, pinnedStrategyId: strategyId }));
  };

  if (!isBrowser || !swRuntimeEnabled) {
    return null;
  }

  const { badgeStyles, theme } = config;
  const permissionConfig = config.permission.statusMap[permissionStatus];
  const subscriptionConfig = config.subscription.statusMap[subscriptionStatus];
  const pinnedStrategy = config.fallback.retryStrategies.find(strategy => strategy.id === persistedState.pinnedStrategyId)
    ?? config.fallback.retryStrategies[0];

  const fallbackStatusDescription = lastFallback
    ? `${getChannelLabel(config, lastFallback.channelId)} · ${formatTimestamp(lastFallback.timestamp)}`
    : 'Nessun fallback inviato';

  const handleSWUpdateCheck = () => {
    trackTelemetryEvent(`${config.telemetryEventPrefix}_sw_update_check`, {
      updateAvailable: swVersionManager.updateStatus?.updateAvailable ?? false,
    });
    void swVersionManager.checkForUpdates();
  };

  const swStatusTone: keyof typeof badgeStyles = swVersionManager.updateStatus?.updateAvailable ? 'warning' : 'success';
  const swStatusLabel = swVersionManager.updateStatus?.updateAvailable ? 'Update disponibile' : 'Allineato';

  const renderBadge = (tone: keyof typeof badgeStyles, label: string) => (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '4px 8px',
        borderRadius: 999,
        ...badgeStyles[tone],
      }}
    >
      {label}
    </span>
  );

  const renderChannelCard = (channelId: string) => {
    const channel = config.fallback.channels.find(item => item.id === channelId);
    if (!channel) {
      return null;
    }
    return (
      <div
        key={channel.id}
        style={{
          border: `1px solid ${theme.border}`,
          borderRadius: 12,
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          background: 'rgba(15,23,42,0.55)',
        }}
      >
        <strong style={{ color: theme.text }}>{channel.label}</strong>
        <p style={{ color: theme.mutedText, fontSize: 13, margin: 0 }}>{channel.description}</p>
        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.accent }}>
          {channel.transport}
        </span>
        <button
          type="button"
          onClick={() => pinnedStrategy && triggerFallback(pinnedStrategy, channel.id)}
          style={{
            marginTop: 8,
            borderRadius: 999,
            border: `1px solid ${theme.border}`,
            background: 'transparent',
            color: theme.text,
            padding: '6px 10px',
            cursor: 'pointer',
          }}
        >
          {config.fallback.triggerCtaLabel}
        </button>
      </div>
    );
  };

  const overlayStyles: CSSProperties = {
    position: 'fixed',
    top: config.layout.position.includes('top') ? 24 : undefined,
    bottom: config.layout.position.includes('bottom') ? 24 : undefined,
    left: config.layout.position.includes('left') ? 24 : undefined,
    right: config.layout.position.includes('right') ? 24 : undefined,
    width: config.layout.width,
    zIndex: config.layout.zIndex,
    background: theme.panel,
    border: `1px solid ${theme.border}`,
    boxShadow: theme.shadow,
    borderRadius: 18,
    padding: 20,
    color: theme.text,
    fontFamily: '"IBM Plex Sans", sans-serif',
  };

  if (!persistedState.visible) {
    return (
      <button
        type="button"
        onClick={toggleVisibility}
        style={{
          position: 'fixed',
          top: overlayStyles.top ?? 24,
          right: overlayStyles.right ?? 24,
          borderRadius: 999,
          border: `1px solid ${theme.border}`,
          background: theme.panel,
          color: theme.text,
          padding: '6px 16px',
          zIndex: config.layout.zIndex,
          cursor: 'pointer',
        }}
      >
        Mostra Push Overlay
      </button>
    );
  }

  return (
    <section style={overlayStyles} aria-live="polite" data-testid="push-diagnostic-overlay">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: theme.mutedText }}>
            {config.overlaySubtitle}
          </p>
          <h2 style={{ margin: 0, fontSize: 20 }}>{config.overlayTitle}</h2>
        </div>
        <button
          type="button"
          onClick={toggleVisibility}
          style={{
            borderRadius: 999,
            border: `1px solid ${theme.border}`,
            background: 'transparent',
            color: theme.text,
            padding: '6px 12px',
            cursor: 'pointer',
          }}
        >
          Nascondi
        </button>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: config.layout.cardGap }}>
        <section style={{ borderRadius: 12, border: `1px solid ${theme.border}`, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0 }}>Permessi</h3>
              <p style={{ margin: '4px 0', color: theme.mutedText }}>{config.permission.rationale}</p>
            </div>
            {renderBadge(permissionConfig.tone, permissionConfig.label)}
          </div>
          <p style={{ margin: '12px 0 0', color: theme.text }}>{permissionConfig.description}</p>
          <button
            type="button"
            onClick={requestPermission}
            style={{
              marginTop: 12,
              borderRadius: 8,
              border: 'none',
              background: theme.accent,
              color: '#04111f',
              padding: '8px 16px',
              cursor: 'pointer',
            }}
          >
            {config.permission.requestCtaLabel}
          </button>
        </section>

        <section style={{ borderRadius: 12, border: `1px solid ${theme.border}`, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0 }}>Subscription</h3>
              <p style={{ margin: '4px 0', color: theme.mutedText }}>{subscriptionConfig.helper}</p>
            </div>
            {renderBadge(subscriptionConfig.tone, subscriptionConfig.label)}
          </div>
          <dl style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 6, columnGap: 12, margin: '12px 0 0', fontSize: 13 }}>
            <dt style={{ color: theme.mutedText }}>Endpoint</dt>
            <dd style={{ margin: 0 }}>{truncateEndpoint(subscriptionDetails.endpoint)}</dd>
            <dt style={{ color: theme.mutedText }}>Scadenza</dt>
            <dd style={{ margin: 0 }}>{formatTimestamp(subscriptionDetails.expirationTime)}</dd>
          </dl>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button
              type="button"
              onClick={refreshSubscriptionAction}
              style={{
                flex: 1,
                borderRadius: 8,
                border: `1px solid ${theme.border}`,
                background: 'transparent',
                color: theme.text,
                padding: '8px 12px',
                cursor: 'pointer',
              }}
            >
              {config.subscription.refreshCtaLabel}
            </button>
            <button
              type="button"
              onClick={resubscribe}
              style={{
                flex: 1,
                borderRadius: 8,
                border: 'none',
                background: theme.warning,
                color: '#1f1300',
                padding: '8px 12px',
                cursor: 'pointer',
              }}
            >
              {config.subscription.resubscribeCtaLabel}
            </button>
          </div>
        </section>

        <section style={{ borderRadius: 12, border: `1px solid ${theme.border}`, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0 }}>Fallback & Retry</h3>
              <p style={{ margin: '4px 0', color: theme.mutedText }}>Strategy {pinnedStrategy?.label ?? '—'}</p>
            </div>
            <select
              value={pinnedStrategy?.id}
              onChange={event => handleStrategyChange(event.target.value)}
              style={{
                borderRadius: 8,
                border: `1px solid ${theme.border}`,
                background: 'transparent',
                color: theme.text,
                padding: '4px 8px',
              }}
            >
              {config.fallback.retryStrategies.map(strategy => (
                <option key={strategy.id} value={strategy.id} style={{ color: '#000' }}>
                  {strategy.label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            {config.fallback.channels.map(channel => renderChannelCard(channel.id))}
          </div>
          <div style={{ marginTop: 12, fontSize: 13 }}>
            <strong>{config.fallback.statusLabel}: </strong>
            {fallbackStatusDescription}
            {lastFallbackError ? <p style={{ color: theme.danger, marginTop: 6 }}>{lastFallbackError}</p> : null}
          </div>
        </section>

        <section style={{ borderRadius: 12, border: `1px solid ${theme.border}`, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0 }}>Service Worker</h3>
              <p style={{ margin: '6px 0', color: theme.mutedText }}>{config.serviceWorker.scopeHint}</p>
            </div>
            {renderBadge(swStatusTone, swStatusLabel)}
          </div>
          <dl style={{ display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: 6, columnGap: 12, margin: '12px 0 0', fontSize: 13 }}>
            <dt style={{ color: theme.mutedText }}>{config.serviceWorker.versionLabel}</dt>
            <dd style={{ margin: 0 }}>{updateStatus?.currentVersion ?? '—'}</dd>
            <dt style={{ color: theme.mutedText }}>Build target</dt>
            <dd style={{ margin: 0 }}>{updateStatus?.availableVersion ?? '—'}</dd>
            <dt style={{ color: theme.mutedText }}>Ultimo check</dt>
            <dd style={{ margin: 0 }}>{formatTimestamp(updateStatus?.lastChecked ?? null)}</dd>
            <dt style={{ color: theme.mutedText }}>{config.serviceWorker.channelLabel}</dt>
            <dd style={{ margin: 0 }}>{config.fallback.messageType}</dd>
          </dl>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button
              type="button"
              onClick={handleSWUpdateCheck}
              style={{
                flex: 1,
                borderRadius: 8,
                border: `1px solid ${theme.border}`,
                background: 'transparent',
                color: theme.text,
                padding: '8px 12px',
                cursor: 'pointer',
              }}
            >
              Controlla aggiornamenti
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}

function getChannelLabel(config: PushDiagnosticConfig, channelId: string): string {
  const channel = config.fallback.channels.find(item => item.id === channelId);
  return channel?.label ?? channelId;
}

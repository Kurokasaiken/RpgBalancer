# Push Diagnostic Overlay (NP-277)

Diagnostic heads-up display for monitoring push notification readiness directly inside the Punch Club PWA. The overlay is fully config-first (see `src/ui/pwa/pushDiagnosticConfig.ts`) and mirrors the manual checks documented in the [Push Audit Playbook](./push_audit_playbook.md).

## Feature Overview

| Section | Purpose | Key Signals |
| --- | --- | --- |
| **Permissions** | Surface `Notification.permission` and provide a one-tap request action | Status badge, rationale text, CTA label from config |
| **Subscription** | Show endpoint + expiration, refresh state, resubscribe with VAPID hints | Endpoint truncation helper, timestamp formatting, telemetry on actions |
| **Fallback & Retry** | Pin a retry strategy, fire fallback channels via SW message | Configured channels/cards, max attempts/backoff preview, last fallback trace |
| **Service Worker** | Read status from `useSWVersionManager`, trigger update check | Version/build, channel label, last check timestamp, badge tone |

The overlay persists visibility + pinned strategy through `PersistenceService` (key taken from config) and polls permission/subscription state at `config.pollIntervalMs`.

## Usage

```tsx
import { PushDiagnosticOverlay } from '@/ui/pwa/PushDiagnosticOverlay';

export function PunchClubShell() {
  return (
    <>
      {/* other layout */}
      <PushDiagnosticOverlay />
    </>
  );
}
```

### Optional overrides

Pass a partial config or override the VAPID key if you need to test staging credentials:

```tsx
<PushDiagnosticOverlay
  vapidPublicKey={env.VITE_PUSH_VAPID_KEY}
  configOverride={{
    telemetryEventPrefix: 'push_diag_staging',
    layout: { position: 'bottom-left' },
    subscription: {
      vapidPublicKeyHint: 'BKyf…stagingKey…',
    },
  }}
/>;
```

All values (labels, badge tones, backoff arrays, theme colors) are defined in `DEFAULT_PUSH_DIAGNOSTIC_CONFIG` and deep-merged via `mergePushDiagnosticConfig`.

## Telemetry

| Event | Payload |
| --- | --- |
| `${prefix}_permission_request` | `{ result }` from `Notification.requestPermission()` |
| `${prefix}_subscription_refresh` | `{ status }` status before refresh |
| `${prefix}_subscription_resubscribe` | `{ endpoint }` for new subscription |
| `${prefix}_fallback_triggered` | `{ strategyId, channelId, timestamp }` |
| `${prefix}_sw_update_check` | `{ updateAvailable }` snapshot |

`prefix` defaults to `push_diag` but can be overridden to segment environments.

## Service Worker integration

`triggerFallback` posts `{ type: config.fallback.messageType, payload }` to the active Service Worker. Ensure `service-worker.ts` listens for that message and routes to your offline notification logic. SW version data comes from `useSWVersionManager`, so keep the manager initialized in any PWA entrypoint before rendering the overlay.

## Testing & Safeguards

- Unit tests live in `tests/unit/pwa/PushDiagnosticOverlay.test.tsx` (mock `Notification`, `ServiceWorkerRegistration`, and `PersistenceService`).
- Safeguard suite: `npm run lint -- src/ui/pwa service-worker`, `npm run test -- tests/unit/pwa/PushDiagnosticOverlay.test.tsx`, `npm run build:check`, `npm run kanban:lint`.
- Evidence log: `test-results/np-277-push-diagnostic-overlay.log` must capture every run with timestamps + verdicts.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Permission badge stuck on “Non richiesto” | Check browser Notification API availability; config status map expects `'default'` string, not `'prompt'`. |
| Subscription section shows `—` endpoint | Ensure Service Worker is ready before rendering overlay; polyfill `navigator.serviceWorker` in tests. |
| Fallback button no-ops | Verify `config.fallback.messageType` matches SW `postMessage` handler, and that retry strategy IDs map to defined `channels`. |
| SW card always green | Initialize `SWVersionManager` early so `updateStatus.updateAvailable` toggles; check `sw-update-available` custom event. |

## References

- `src/ui/pwa/PushDiagnosticOverlay.tsx`
- `src/ui/pwa/pushDiagnosticConfig.ts`
- `src/ui/pwa/hooks/useSWVersionManager.ts`
- `src/docs/docs/pwa/push_audit_playbook.md`

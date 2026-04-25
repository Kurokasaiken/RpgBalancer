import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { createSandboxDiagnostics, type PickerDiagnosticsPayload } from '@/ui/idleVillage/utils/sandboxDiagnostics';
import type {
  ResidentAssignmentCandidate,
  ResidentPickerSlotMeta,
} from '@/ui/idleVillage/components/InlineResidentChips';
import type { InteractionSource } from '@/ui/idleVillage/hooks/useSandboxInteractionMode';
import {
  recordWorkerPickerEvent,
  trackAssignmentLatencySample,
  trackPickerCloseSample,
  accumulateTapSamples,
  recordAssignmentInteractionEvent,
  type WorkerPickerTelemetryEvent,
} from '@/ui/idleVillage/utils/workerPickerTelemetry';
import ResidentPickerAvatar from '@/ui/idleVillage/components/ResidentPickerAvatar';

export type { WorkerPickerTelemetryEvent };

export interface WorkerPickerSheetProps {
  /** Controls the visibility of the sheet. */
  isOpen: boolean;
  /** Metadata for the slot that triggered the picker. */
  slotMeta: ResidentPickerSlotMeta | null;
  /** List of compatible residents with diagnostics. */
  residents: ResidentAssignmentCandidate[];
  /** Invoked when the user assigns a resident. */
  onAssign: (residentId: string) => void | Promise<void>;
  /** Dismiss handler (close button, overlay click, Escape). */
  onClose: () => void;
  /** Optional inspector callback for resident details. */
  onInspectResident?: (residentId: string) => void;
  /** Source that opened the picker (used for diagnostics/aria copy). */
  trigger?: InteractionSource;
  /** Optional telemetry emitter for aggregation upstream. */
  onTelemetry?: (event: WorkerPickerTelemetryEvent) => void;
}

const SHEET_PORTAL_ID = 'worker-picker-sheet-root';
const CLOSE_THRESHOLD_MS = 1000;

/**
 * Floating bottom sheet used on mobile/touch devices to assign workers via tap.
 * Mirrors the configurability of the legacy ResidentAssignmentPicker while
 * adopting the Gilded Observatory visual language.
 */
const focusableSelectors =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

const WorkerPickerSheet: React.FC<WorkerPickerSheetProps> = ({
  isOpen,
  slotMeta,
  residents,
  onAssign,
  onClose,
  onInspectResident,
  trigger = null,
  onTelemetry,
}) => {
  const diagnostics = useMemo(
    () => createSandboxDiagnostics<PickerDiagnosticsPayload>('WorkerPickerSheet', 'picker'),
    [],
  );
  const sheetRef = useRef<HTMLElement | null>(null);
  const firstActionRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const lastSlotMetaRef = useRef<ResidentPickerSlotMeta | null>(null);
  const openTimestampRef = useRef<number | null>(null);
  const assignStartRef = useRef<number | null>(null);
  const assignCompletedAtRef = useRef<number | null>(null);
  const awaitingCloseRef = useRef(false);
  const prevIsOpenRef = useRef(false);
  const closeTimeoutRef = useRef<number | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const tapCountRef = useRef(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false);
  const decorativeOrbId = useId();
  const titleId = useId();
  const descriptionId = useId();

  const emitTelemetry = useCallback(
    (event: WorkerPickerTelemetryEvent) => {
      diagnostics.debug('telemetry', event);
      recordWorkerPickerEvent(event);
      onTelemetry?.(event);
    },
    [diagnostics, onTelemetry],
  );

  const focusPrimaryAction = useCallback(() => {
    if (firstActionRef.current && !firstActionRef.current.disabled) {
      firstActionRef.current.focus();
      return;
    }
    closeButtonRef.current?.focus();
  }, []);

  const getFocusableElements = useCallback(() => {
    if (!sheetRef.current) {
      return [];
    }
    return Array.from(
      sheetRef.current.querySelectorAll<HTMLElement>(focusableSelectors),
    ).filter(
      (element) =>
        !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true',
    );
  }, []);

  const focusFirstElement = useCallback(() => {
    const [first] = getFocusableElements();
    if (first) {
      first.focus();
    }
  }, [getFocusableElements]);

  const focusLastElement = useCallback(() => {
    const focusable = getFocusableElements();
    const last = focusable[focusable.length - 1];
    if (last) {
      last.focus();
    }
  }, [getFocusableElements]);

  useEffect(() => {
    if (slotMeta) {
      lastSlotMetaRef.current = slotMeta;
    }
  }, [slotMeta]);

  const portalTarget = useMemo(() => {
    if (typeof document === 'undefined') {
      return null;
    }
    let container = document.getElementById(SHEET_PORTAL_ID);
    if (!container) {
      container = document.createElement('div');
      container.setAttribute('id', SHEET_PORTAL_ID);
      document.body.appendChild(container);
    }
    return container;
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    if (isOpen) {
      restoreFocusRef.current = document.activeElement as HTMLElement | null;
      tapCountRef.current = 0;
    } else if (restoreFocusRef.current) {
      restoreFocusRef.current.focus();
      restoreFocusRef.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handle = () => setPrefersReducedMotion(media.matches);
    handle();
    media.addEventListener('change', handle);
    return () => media.removeEventListener('change', handle);
  }, []);

  useEffect(() => {
    let rafEntrance: number | null = null;
    let rafSettled: number | null = null;

    rafEntrance = window.requestAnimationFrame(() => {
      if (!isOpen || prefersReducedMotion) {
        setHasAnimatedIn(true);
        return;
      }

      setHasAnimatedIn(false);
      rafSettled = window.requestAnimationFrame(() => setHasAnimatedIn(true));
    });

    return () => {
      if (rafEntrance !== null) {
        window.cancelAnimationFrame(rafEntrance);
      }
      if (rafSettled !== null) {
        window.cancelAnimationFrame(rafSettled);
      }
    };
  }, [isOpen, prefersReducedMotion]);

  const handleEscapeKey = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        diagnostics.debug('esc-close', { slotId: slotMeta?.slotId ?? null });
        emitTelemetry({ type: 'assignment_cancel', slotId: slotMeta?.slotId ?? null, reason: 'esc' });
        onClose();
      }
    },
    [diagnostics, emitTelemetry, isOpen, onClose, slotMeta?.slotId],
  );

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    if (isOpen) {
      openTimestampRef.current = performance.now();
      emitTelemetry({
        type: 'open',
        slotId: slotMeta?.slotId ?? null,
        candidateCount: residents.length,
      });
      emitTelemetry({
        type: 'candidate_count',
        slotId: slotMeta?.slotId ?? null,
        candidateCount: residents.length,
      });
      diagnostics.debug('sheet-open', {
        slotId: slotMeta?.slotId ?? null,
        residents: residents.length,
        trigger,
      });
      document.addEventListener('keydown', handleEscapeKey);
      document.body.classList.add('overflow-hidden');
      const focusTimer = window.setTimeout(() => {
        focusPrimaryAction();
      }, 0);
      return () => {
        window.clearTimeout(focusTimer);
        document.removeEventListener('keydown', handleEscapeKey);
        document.body.classList.remove('overflow-hidden');
      };
    }
    return undefined;
  }, [
    diagnostics,
    emitTelemetry,
    focusPrimaryAction,
    handleEscapeKey,
    isOpen,
    residents.length,
    slotMeta?.slotId,
    trigger,
  ]);

  useEffect(() => {
    const wasOpen = prevIsOpenRef.current;
    prevIsOpenRef.current = isOpen;
    if (wasOpen && !isOpen) {
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      const closeDurationMs =
        openTimestampRef.current !== null ? performance.now() - openTimestampRef.current : undefined;
      const closedWithinThreshold =
        awaitingCloseRef.current && assignCompletedAtRef.current !== null
          ? performance.now() - assignCompletedAtRef.current <= CLOSE_THRESHOLD_MS
          : false;
      awaitingCloseRef.current = false;
      emitTelemetry({
        type: 'close',
        slotId: lastSlotMetaRef.current?.slotId ?? null,
        closeDurationMs,
        closedWithinThreshold,
      });
      trackPickerCloseSample(Boolean(closedWithinThreshold), {
        closeDurationMs,
      });
      tapCountRef.current = 0;
    }
  }, [emitTelemetry, isOpen]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    };
  }, []);

  const scheduleCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = window.setTimeout(() => {
      awaitingCloseRef.current = false;
      emitTelemetry({ type: 'close_timeout', slotId: lastSlotMetaRef.current?.slotId ?? null });
      tapCountRef.current = 0;
    }, CLOSE_THRESHOLD_MS);
  }, [emitTelemetry]);

  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === overlayRef.current) {
        emitTelemetry({ type: 'assignment_cancel', slotId: slotMeta?.slotId ?? null, reason: 'backdrop' });
        onClose();
        tapCountRef.current = 0;
      }
    },
    [emitTelemetry, onClose, slotMeta?.slotId],
  );

  const handleCloseButton = useCallback(() => {
    emitTelemetry({ type: 'assignment_cancel', slotId: slotMeta?.slotId ?? null, reason: 'close_button' });
    onClose();
    tapCountRef.current = 0;
  }, [emitTelemetry, onClose, slotMeta?.slotId]);

  const handleAssignResident = useCallback(
    async (residentId: string) => {
      const resident = residents.find(r => r.id === residentId);
      const compatibilityScore = resident?.compatibility.score ?? 0;
      diagnostics.debug('assign', { residentId, slotId: slotMeta?.slotId });
      tapCountRef.current += 1;
      const tapsThisAssignment = tapCountRef.current;
      emitTelemetry({
        type: 'assignment_attempt',
        slotId: slotMeta?.slotId ?? null,
        residentId,
        compatibilityScore,
        tapCount: tapsThisAssignment,
      });
      assignStartRef.current = performance.now();
      await Promise.resolve(onAssign(residentId));
      const latencyMs =
        assignStartRef.current !== null ? performance.now() - assignStartRef.current : undefined;
      assignCompletedAtRef.current = performance.now();
      awaitingCloseRef.current = true;
      scheduleCloseTimeout();
      emitTelemetry({
        type: 'assignment_success',
        slotId: slotMeta?.slotId ?? null,
        residentId,
        latencyMs,
        compatibilityScore,
        tapCount: tapsThisAssignment,
      });
      recordAssignmentInteractionEvent({
        method: 'tap',
        slotId: slotMeta?.slotId ?? null,
        residentId,
        timestamp: Date.now(),
      });
      if (typeof latencyMs === 'number' && Number.isFinite(latencyMs)) {
        trackAssignmentLatencySample(latencyMs);
      }
      accumulateTapSamples(tapsThisAssignment);
      tapCountRef.current = 0;
    },
    [diagnostics, emitTelemetry, onAssign, scheduleCloseTimeout, slotMeta?.slotId, residents],
  );

  const handleInspectResident = useCallback(
    (residentId: string) => {
      diagnostics.debug('inspect', { residentId, slotId: slotMeta?.slotId });
      onInspectResident?.(residentId);
    },
    [diagnostics, onInspectResident, slotMeta?.slotId],
  );

  const handleFocusTrap = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key !== 'Tab') {
        return;
      }
      const focusable = getFocusableElements();
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
        return;
      }
      if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [getFocusableElements],
  );

  const headerCopy =
    trigger === 'keyboard'
      ? 'Selezione tastiera'
      : slotMeta?.description ?? 'Selezione slot';

  const overlayStyle = useMemo(
    () => ({
      background: 'var(--body-bg-overlay, rgba(0, 0, 0, 0.78))',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      opacity: hasAnimatedIn ? 1 : 0,
      transition: prefersReducedMotion ? 'none' : 'opacity 220ms ease',
    }),
    [hasAnimatedIn, prefersReducedMotion],
  );

  const sheetStyle = useMemo(
    () => ({
      background: 'var(--panel-surface, rgba(5, 6, 9, 0.95))',
      borderColor: 'var(--panel-border, rgba(255, 255, 255, 0.08))',
      boxShadow:
        '0 -35px 80px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
      transform: hasAnimatedIn ? 'translateY(0)' : 'translateY(100%)',
      transition: prefersReducedMotion ? 'none' : 'transform 360ms cubic-bezier(0.18, 0.9, 0.32, 1.15)',
    }),
    [hasAnimatedIn, prefersReducedMotion],
  );

  const headerStyle = useMemo(
    () => ({
      background:
        'linear-gradient(135deg, rgba(8, 12, 20, 0.95), rgba(3, 5, 10, 0.9))',
      borderColor: 'var(--panel-border, rgba(255, 255, 255, 0.12))',
      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.55)',
    }),
    [],
  );

  if (!portalTarget || !isOpen) {
    return null;
  }

  const sheetContent = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end"
      onClick={handleOverlayClick}
      role="presentation"
      data-testid="worker-picker-overlay"
      data-sandbox-interaction-picker="open"
      style={overlayStyle}
    >
      <section
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={clsx('relative w-full rounded-t-4xl border p-0')}
        onKeyDown={handleFocusTrap}
        data-sandbox-worker-picker="open"
        style={sheetStyle}
      >
        <span
          tabIndex={0}
          aria-hidden="true"
          className="absolute h-0 w-0 opacity-0"
          onFocus={focusLastElement}
        />
        <div
          className="sticky top-0 z-10 border-b px-5 py-4 backdrop-blur"
          style={headerStyle}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p
                id={descriptionId}
                className="text-[11px] uppercase tracking-[0.35em] text-slate-400"
              >
                {headerCopy}
              </p>
              <h2 id={titleId} className="text-lg font-semibold text-(--text-primary,#fefce8)">
                {slotMeta?.label ?? 'Seleziona slot'}
              </h2>
              {slotMeta?.activityLabel && (
                <p className="text-xs text-slate-400">{slotMeta.activityLabel}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div
                className="hidden h-6 w-6 rounded-full border border-white/10 sm:block"
                aria-hidden="true"
                id={decorativeOrbId}
              />
              <button
                type="button"
                onClick={handleCloseButton}
                className="rounded-full border border-white/15 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-slate-200 transition hover:border-white/40 hover:text-white"
                aria-label="Chiudi selezione lavoratore"
                data-sandbox-worker-picker-close
                ref={closeButtonRef}
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>

        <div className="max-h-[60vh] space-y-3 overflow-y-auto px-5 py-4">
          {residents.length === 0 ? (
            <p className="text-sm text-slate-400">
              Nessun residente compatibile per questo slot in questo momento.
            </p>
          ) : (
            residents.map((resident, index) => {
              const scorePercent = Math.round(resident.compatibility.score * 100);
              const isValid = resident.compatibility.reason === 'valid';
              return (
                <article
                  key={resident.id}
                  className={clsx(
                    'flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-[0_10px_20px_rgba(0,0,0,0.35)]',
                    !isValid && 'opacity-70',
                  )}
                  data-sandbox-worker-id={resident.id}
                >
                  <div className="flex items-center gap-3">
                    <ResidentPickerAvatar
                      name={resident.displayName}
                      portraitUrl={resident.portraitUrl}
                      size="lg"
                    />
                    <div>
                      <p className="text-sm font-semibold text-white">{resident.displayName}</p>
                      <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">{resident.statusLabel}</p>
                      <div className="mt-1 inline-flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="rounded-full border border-emerald-400/40 px-2 py-0.5 text-emerald-200">
                          {scorePercent}% compatibilità
                        </span>
                        <span>Fatica {resident.fatigue}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      className="min-h-12 rounded-xl border border-white/15 px-4 text-[11px] uppercase tracking-[0.3em] text-slate-100 transition hover:border-white/40 hover:text-white"
                      onClick={() => handleInspectResident(resident.id)}
                    >
                      Dettagli
                    </button>
                    <button
                      type="button"
                      ref={index === 0 ? firstActionRef : undefined}
                      disabled={!isValid}
                      className={clsx(
                        'min-h-12 rounded-xl px-4 text-[11px] uppercase tracking-[0.3em] transition focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-amber-200',
                        isValid
                          ? 'border border-emerald-400/60 text-emerald-100 hover:border-emerald-300 hover:text-emerald-50'
                          : 'border border-slate-600 text-slate-500 cursor-not-allowed',
                      )}
                      onClick={() => handleAssignResident(resident.id)}
                    >
                      Assegna
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
        <span
          tabIndex={0}
          aria-hidden="true"
          className="absolute h-0 w-0 opacity-0"
          onFocus={focusFirstElement}
        />
      </section>
    </div>
  );

  return createPortal(sheetContent, portalTarget);
};

export default WorkerPickerSheet;

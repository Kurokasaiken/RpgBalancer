const DRAG_OVERRIDE_EVENT = '__idleVillageTestDragOverrideEvent';

/**
 * Applies the current drag override so the sandbox drag controller can react to synthetic drags.
 * Dispatches {@link DRAG_OVERRIDE_EVENT} so listeners refresh their derived state.
 */
export const applyDragOverride = (residentId: string | null) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.__idleVillageTestDragOverride = residentId ?? null;
  window.dispatchEvent(new CustomEvent(DRAG_OVERRIDE_EVENT));
};

/**
 * Clears any lingering drag override during teardown to keep the sandbox state neutral between tests.
 */
export const clearDragOverrideOnUnmount = () => {
  if (typeof window === 'undefined') {
    return;
  }
  if (!Object.prototype.hasOwnProperty.call(window, '__idleVillageTestDragOverride')) {
    return;
  }
  delete window.__idleVillageTestDragOverride;
  window.dispatchEvent(new CustomEvent(DRAG_OVERRIDE_EVENT));
};

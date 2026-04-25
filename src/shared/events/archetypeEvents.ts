/**
 * Custom events used to coordinate archetype deep-links between views.
 */

/** Event name dispatched when an archetype detail panel should open. */
export const OPEN_ARCHETYPE_DETAIL_EVENT = 'open-archetype-detail';

/** Payload describing which archetype should open. */
export interface OpenArchetypeDetailEventDetail {
  archetypeId: string;
}

/** Dispatches the global event requesting an ArchetypeDetail view. */
export function dispatchOpenArchetypeDetailEvent(archetypeId: string): void {
  if (typeof window === 'undefined') return;
  const detail: OpenArchetypeDetailEventDetail = { archetypeId };
  window.dispatchEvent(new CustomEvent<OpenArchetypeDetailEventDetail>(OPEN_ARCHETYPE_DETAIL_EVENT, { detail }));
}

export type OpenArchetypeDetailEventHandler = (archetypeId: string) => void;

/**
 * Registers a listener for archetype detail events.
 * Returns the cleanup function to remove the listener.
 */
export function addOpenArchetypeDetailListener(handler: OpenArchetypeDetailEventHandler): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const wrappedListener = (event: Event) => {
    const customEvent = event as CustomEvent<OpenArchetypeDetailEventDetail>;
    if (customEvent.detail?.archetypeId) {
      handler(customEvent.detail.archetypeId);
    }
  };

  window.addEventListener(OPEN_ARCHETYPE_DETAIL_EVENT, wrappedListener);
  return () => window.removeEventListener(OPEN_ARCHETYPE_DETAIL_EVENT, wrappedListener);
}

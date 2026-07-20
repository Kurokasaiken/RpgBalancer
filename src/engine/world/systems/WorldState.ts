import { create } from 'zustand';
import type { RuntimeObject } from '../model/RuntimeObject';
import type { WorldEvent } from '../model/WorldEvent';

export interface WorldSurfaceState {
  objects: RuntimeObject[];
  events: WorldEvent[];
  addObject: (object: RuntimeObject) => void;
  removeObject: (objectId: string) => void;
  moveObject: (objectId: string, regionId: string) => void;
  addEvent: (event: WorldEvent) => void;
  removeEvent: (eventId: string) => void;
  tick: (now?: number) => void;
  getObjectsByRegion: (regionId: string) => RuntimeObject[];
  getActiveEvents: () => WorldEvent[];
  getActiveVisualStateId: () => string | undefined;
  getActiveRegionTints: () => Record<string, string>;
}

const WORLD_EVENT_REGION_KEY = 'regionId';

export const useWorldState = create<WorldSurfaceState>()((set, get) => ({
  objects: [],
  events: [],
  addObject: (object) => set((state) => ({ objects: [...state.objects, object] })),
  removeObject: (objectId) =>
    set((state) => ({ objects: state.objects.filter((obj) => obj.id !== objectId) })),
  moveObject: (objectId, regionId) =>
    set((state) => ({
      objects: state.objects.map((obj) =>
        obj.id === objectId ? { ...obj, data: { ...obj.data, [WORLD_EVENT_REGION_KEY]: regionId } } : obj,
      ),
    })),
  addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
  removeEvent: (eventId) =>
    set((state) => ({ events: state.events.filter((evt) => evt.id !== eventId) })),
  tick: (now = Date.now()) =>
    set((state) => {
      const activeEvents: WorldEvent[] = [];
      const expired: string[] = [];
      for (const evt of state.events) {
        const lifecycle = evt.lifecycle;
        if (lifecycle.state === 'pending' && lifecycle.startAt !== undefined && now >= lifecycle.startAt) {
          lifecycle.state = 'active';
        }
        if (lifecycle.state === 'active') {
          if (lifecycle.endAt !== undefined && now >= lifecycle.endAt) {
            expired.push(evt.id);
          } else {
            activeEvents.push(evt);
          }
        } else if (lifecycle.state !== 'expired') {
          activeEvents.push(evt);
        }
      }
      return {
        events: state.events
          .map((evt) => (expired.includes(evt.id) ? { ...evt, lifecycle: { ...evt.lifecycle, state: 'expired' as const } } : evt))
          .filter((evt) => evt.lifecycle.state !== 'expired'),
      };
    }),
  getObjectsByRegion: (regionId) =>
    get().objects.filter((obj) => (obj.data?.[WORLD_EVENT_REGION_KEY] as string | undefined) === regionId),
  getActiveEvents: () => get().events.filter((evt) => evt.lifecycle.state === 'active'),
  getActiveVisualStateId: () => {
    for (const evt of get().getActiveEvents()) {
      for (const effect of evt.effects) {
        if (effect.type === 'apply_visual_state') {
          return effect.stateId;
        }
      }
    }
    return undefined;
  },
  getActiveRegionTints: () => {
    const tints: Record<string, string> = {};
    for (const evt of get().getActiveEvents()) {
      for (const effect of evt.effects) {
        if (effect.type === 'tint_region') {
          tints[effect.regionId] = effect.tint;
        }
      }
    }
    return tints;
  },
}));

export default useWorldState;

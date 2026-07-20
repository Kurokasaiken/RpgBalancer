import useWorldState from '@/engine/world/systems/WorldState';
import { createWorldEventFromTemplate } from '@/engine/world/config/worldEventRegistry';
import type { RuntimeObject } from '@/engine/world/model/RuntimeObject';

describe('WorldState', () => {
  beforeEach(() => {
    const store = useWorldState.getState();
    store.objects = [];
    store.events = [];
  });

  function makeObject(id: string, regionId?: string): RuntimeObject {
    return {
      id,
      location: { mode: 'dynamic', x: 0, y: 0 },
      type: 'marker',
      state: 'idle',
      visual: { renderLayer: 'world', renderMode: 'sprite', scale: 1, glow: false },
      animation: { mode: 'idle', speed: 1, direction: 'both' },
      data: regionId ? { regionId } : {},
    };
  }

  it('adds and removes objects', () => {
    const store = useWorldState.getState();
    const object = makeObject('obj-1', 'reg-1');
    store.addObject(object);
    expect(store.getObjectsByRegion('reg-1')).toContain(object);
    store.removeObject('obj-1');
    expect(store.getObjectsByRegion('reg-1')).toHaveLength(0);
  });

  it('moves objects between regions', () => {
    const store = useWorldState.getState();
    const object = makeObject('obj-1', 'reg-1');
    store.addObject(object);
    store.moveObject('obj-1', 'reg-2');
    expect(store.getObjectsByRegion('reg-2').map((o) => o.id)).toContain('obj-1');
    expect(store.getObjectsByRegion('reg-1')).toHaveLength(0);
  });

  it('activates and expires events via tick', () => {
    const store = useWorldState.getState();
    const event = createWorldEventFromTemplate('weather', { startAt: 10, endAt: 50 });
    store.addEvent(event);
    expect(store.getActiveEvents()).toHaveLength(0);
    store.tick(5);
    expect(store.getActiveEvents()).toHaveLength(0);
    store.tick(15);
    expect(store.getActiveEvents()).toHaveLength(1);
    store.tick(60);
    expect(store.getActiveEvents()).toHaveLength(0);
  });

  it('computes active visual state override from active events', () => {
    const store = useWorldState.getState();
    const event = createWorldEventFromTemplate('weather');
    event.lifecycle.state = 'active';
    store.addEvent(event);
    expect(store.getActiveVisualStateId()).toBe('weather');
  });

  it('computes active region tints from active events', () => {
    const store = useWorldState.getState();
    const event = createWorldEventFromTemplate('threat');
    event.lifecycle.state = 'active';
    store.addEvent(event);
    expect(store.getActiveRegionTints()['world']).toBeDefined();
  });
});

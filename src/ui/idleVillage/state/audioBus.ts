/**
 * audioBus — one master volume for every sound in the game (PLAN-076 T-4, O-3).
 *
 * /game has no single AudioContext: the quest theatre, the astrolabe, the
 * level-up cue, the invasion thud and the slot sounds each create their own,
 * lazily and on a gesture (T-10). Rather than edit every source, the bus makes
 * `window.AudioContext` a subclass whose `destination` is a per-context master
 * gain wired to the real destination: whoever connects "to the destination"
 * goes through the player's levels, and no extra context is ever created.
 *
 * Every /game sound is an effect (there is no music yet), so the bus level is
 * master × effects.
 */
import { getGameSettings, subscribeGameSettings } from './gameSettings';

/** The level the bus plays at. */
export const effectsBusGain = (): number => {
  const { master, effects } = getGameSettings();
  return master * effects;
};

const INSTALLED = Symbol.for('wanderlust.audioBus');
type CtxLike = { currentTime?: number; createGain: () => GainNode };
const liveBuses = new Map<GainNode, CtxLike>();
let unsubscribe: (() => void) | null = null;

function pushLevel(): void {
  const level = effectsBusGain();
  liveBuses.forEach((ctx, bus) => bus.gain.setTargetAtTime(level, ctx.currentTime ?? 0, 0.015));
}

/** Idempotent. Call before any context is created (module load of the /game entry). */
export function installAudioBus(win: Window & typeof globalThis = window): void {
  const holder = win as unknown as { AudioContext?: new () => object; webkitAudioContext?: new () => object };
  const Base = holder.AudioContext ?? holder.webkitAudioContext;
  if (!Base || (Base as unknown as Record<symbol, unknown>)[INSTALLED]) return;

  const buses = new WeakMap<object, GainNode>();
  class BusAudioContext extends (Base as new () => object) {
    get destination(): AudioDestinationNode {
      let bus = buses.get(this);
      if (!bus) {
        const ctx = this as unknown as CtxLike;
        bus = ctx.createGain();
        bus.gain.value = effectsBusGain();
        bus.connect(Reflect.get(Base.prototype, 'destination', this) as AudioNode);
        buses.set(this, bus);
        liveBuses.set(bus, ctx);
      }
      return bus as unknown as AudioDestinationNode;
    }
  }
  (BusAudioContext as unknown as Record<symbol, unknown>)[INSTALLED] = true;
  holder.AudioContext = BusAudioContext as never;
  if (holder.webkitAudioContext) holder.webkitAudioContext = BusAudioContext as never;
  unsubscribe ??= subscribeGameSettings(pushLevel);
}

/** Test-only. */
export const __resetAudioBusForTest = (): void => {
  unsubscribe?.();
  unsubscribe = null;
  liveBuses.clear();
};

import { describe, it, expect } from 'vitest';
import { getBloomStyle } from '@/ui/idleVillage/interaction/bloomEffect';
import { SLOT_HUD_GOLD_TOKENS } from '@/ui/idleVillage/components/SlotV12Renderer';

describe('bloom — look «ottone» degli slot dei planner (PLAN-043)', () => {
  it('di default il bloom resta quello condiviso (POI e demo non cambiano)', () => {
    const style = getBloomStyle('valid', 83);
    expect(style.animation).toContain('aaa-bloom-pulse');
    expect(String(style.filter)).toContain('oklch');
  });

  it('con look ottone: respiro lento, colori dai token ottone del HUD, nessun nucleo bianco né onde', () => {
    const style = getBloomStyle('valid', 83, 'brass');
    expect(style.animation).toContain('brass-bloom-breathe');
    expect(String(style.animation)).toContain('2.8s');
    expect(String(style.filter)).toContain('--skin-hud-brass-hi');
    expect(String(style.filter)).not.toContain('oklch');
    expect((String(style.filter).match(/drop-shadow/g) ?? []).length).toBe(2); // bordo + alone, niente onde
  });

  it('idle e invalid non dipendono dal look', () => {
    expect(getBloomStyle('idle', 83, 'brass')).toEqual(getBloomStyle('idle', 83));
    expect(getBloomStyle('invalid', 83, 'brass')).toEqual(getBloomStyle('invalid', 83));
  });
});

describe('palette hud-gold dello slot', () => {
  it('sostituisce solo token di colore già esistenti (argento, artigli, bevel, fondazione, arcano)', () => {
    expect(Object.keys(SLOT_HUD_GOLD_TOKENS).sort()).toEqual(
      ['arcane.color', 'arcane.rgb', 'bevel.stop0', 'bevel.stop1', 'bevel.stop2', 'bevel.stop3', 'bezel.foundation', 'claw.stop0', 'claw.stop1', 'claw.stop2', 'silver.stop0', 'silver.stop1', 'silver.stop2', 'silver.stop3', 'silver.stop4', 'tip.glow'],
    );
  });
});

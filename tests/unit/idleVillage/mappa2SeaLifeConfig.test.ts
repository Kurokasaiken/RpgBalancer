import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Mappa2SeaLifeSchema } from '../../../src/ui/idleVillage/config/mappa2SeaLifeConfig';

const real = () => JSON.parse(readFileSync('public/assets/world/mappa2/base/sea-life.json', 'utf8'));

describe('Mappa2SeaLifeSchema (PLAN-094 leaf)', () => {
  it('accepts the shipped sea-life.json', () => {
    const parsed = Mappa2SeaLifeSchema.parse(real());
    expect(Object.keys(parsed.animals)).toEqual(expect.arrayContaining(['pesce', 'pescione', 'delfino', 'tartaruga', 'manta', 'martello']));
  });

  it('rejects an animal without a body', () => {
    const payload = real();
    payload.animals.pesce.parts = payload.animals.pesce.parts.filter((p: { role: string }) => p.role !== 'body');
    expect(() => Mappa2SeaLifeSchema.parse(payload)).toThrow(/exactly one body/);
  });

  it('rejects a hinged part without pivot', () => {
    const payload = real();
    delete payload.animals.pesce.parts[1].pivot;
    expect(() => Mappa2SeaLifeSchema.parse(payload)).toThrow(/pivot and attach/);
  });

  it('rejects files outside fx/sea-life and unknown keys', () => {
    const a = real();
    a.animals.pesce.parts[0].file = '../secret.png';
    expect(() => Mappa2SeaLifeSchema.parse(a)).toThrow();
    const b = real();
    b.extra = 1;
    expect(() => Mappa2SeaLifeSchema.parse(b)).toThrow();
  });
});

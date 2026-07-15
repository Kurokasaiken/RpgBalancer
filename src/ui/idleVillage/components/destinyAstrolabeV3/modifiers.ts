/**
 * modifiers.ts — placeholder API spesa oggetti (piano §7, D3).
 * SOLO tipi + eventi + applicazione pura sull'input geometrico.
 * Nessuna UI inventario: l'inventario futuro mappa item → AstrolabeModifier
 * e chiama previewModifier/applyModifier sull'handle dell'engine.
 */
import {
  astrolabeV3Config,
  type AstrolabeV3Config,
} from '@/balancing/config/idleVillage/destinyAstrolabeV3/astrolabeV3Config';
import type { GeometryInput } from './geometry';

export interface AstrolabeModifier {
  id: string;
  target: 'stat' | 'difficulty' | 'crit' | 'wound' | 'death';
  /** indice asse (solo per target='stat') */
  axisIndex?: number;
  /** es. -5 wound, +30 stat */
  delta: number;
  source: { kind: 'item' | 'buff' | 'blessing'; refId: string };
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Applica una lista di modifier a un GeometryInput (pura, con clamp Zod §7). */
export function applyModifiersToInput(
  input: GeometryInput,
  modifiers: AstrolabeModifier[],
  config: AstrolabeV3Config = astrolabeV3Config,
): GeometryInput {
  const next: GeometryInput = {
    ...input,
    stats: input.stats.map((s) => ({ ...s })),
  };
  for (const m of modifiers) {
    switch (m.target) {
      case 'stat': {
        const idx = clamp(m.axisIndex ?? 0, 0, next.stats.length - 1);
        next.stats[idx].stat = clamp(
          next.stats[idx].stat + m.delta,
          config.statClampMin,
          config.statClampMax,
        );
        break;
      }
      case 'difficulty':
        next.difficulty = clamp(next.difficulty + m.delta, 1, 99);
        break;
      case 'crit':
        next.critPct = clamp(next.critPct + m.delta, 0, config.riskPctMax);
        break;
      case 'wound':
        next.woundPct = clamp(next.woundPct + m.delta, 0, config.riskPctMax);
        break;
      case 'death':
        next.deathPct = clamp(next.deathPct + m.delta, 0, config.riskPctMax);
        break;
    }
  }
  return next;
}

export type ModifiersChangedListener = (active: AstrolabeModifier[]) => void;

/** Contratto che l'handle dell'engine V3 espone all'inventario futuro (§7). */
export interface AstrolabeModifierApi {
  /** morph GHOST: nuova geometria in outline tratteggiato sopra l'attuale */
  previewModifier(m: AstrolabeModifier): void;
  /** annulla il ghost senza applicare */
  clearPreview(): void;
  /** morph reale (tMorphMs) + aggiornamento label */
  applyModifier(m: AstrolabeModifier): void;
  revokeModifier(id: string): void;
  onModifiersChanged(cb: ModifiersChangedListener): () => void;
}

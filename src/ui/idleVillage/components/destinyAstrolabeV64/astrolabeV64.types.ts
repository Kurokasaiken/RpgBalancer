/**
 * Shared public types for Destiny Astrolabe V6.3.
 *
 * The runtime engine contract lives in `./engine.ts`; this barrel re-exports it
 * and adds presentation-only types consumed by the React wrapper and config.
 */

export type {
  AstrolabeSkill,
  AstrolabeConfig,
  AstrolabeResult,
  AstrolabeEngineOpts,
  AstrolabeEngineHandle,
} from './engine';

/** Engine state-machine states exposed to the React host. */
export type AstrolabePhase =
  | 'idle'
  | 'ring-lock'
  | 'threat-slam'
  | 'goo-expand'
  | 'axis-read'
  | 'agency-burst'
  | 'risk-pour'
  | 'action-trigger'
  | 'the-spin'
  | 'magnetic-snap'
  | 'resolution';

/** i18n copy bundle passed from the React host into the engine. */
export interface AstrolabeV64Copy {
  mathFmt: string;
  chips: { wounded: string; dead: string };
  verdicts: Record<string, { title: string; sub: string }>;
  narrativeFlavors: Record<string, Record<string, string>>;
}

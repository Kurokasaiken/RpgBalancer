/**
 * Shared command and macro types for the STS numeric simulator.
 */

/**
 * Metadata describing a terminal binding exposed to the UI.
 */
export interface STSCommandBinding {
  /** Unique command identifier */
  command: string;
  /** Human readable label used in hints */
  label: string;
  /** Optional keyboard shortcut */
  hotkey?: string;
  /** When true, command requires an argument (typically card index) */
  requiresArgument?: boolean;
  /** Optional engine action the binding maps to */
  sourceAction?: string;
}

/**
 * Canonical parser token kinds.
 */
export type STSCommandTokenType = 'play_card' | 'system';

/**
 * Structured token produced by the STS command parser.
 */
export interface STSCommandToken {
  type: STSCommandTokenType;
  cardIndex?: number;
  commandId?: string;
  source: 'input' | 'macro';
  macroId?: string;
}

/**
 * Macro definition sourced from config.
 */
export interface STSMacroDefinition {
  id: string;
  label: string;
  description?: string;
  hotkey?: string;
  sample?: string;
  steps: Array<{ type: STSCommandTokenType; value: number | string }>;
}

/**
 * Parser success payload returned to the UI layer.
 */
export interface STSCommandParseSuccess {
  raw: string;
  tokens: STSCommandToken[];
  macro?: STSMacroDefinition | null;
}

/**
 * Parser error payload for diagnostics and UX.
 */
export interface STSCommandParserError {
  code: 'EMPTY' | 'INVALID_CARD' | 'UNKNOWN_COMMAND' | 'MACRO_NOT_FOUND';
  message: string;
  raw: string;
}

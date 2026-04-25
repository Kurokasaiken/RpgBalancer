/**
 * Centralized regex configuration for assignment feedback hooks coming from Idle Village.
 * Tests can import these patterns to keep expectations aligned with the UI/domain copy.
 */
export const rosterFeedbackPatterns = {
  /** Messages that should be treated as successful roster updates. */
  success: [/assegnato/i, /in corso/i, /pronto per/i],
  /**
   * Messages that should immediately fail a wait. Includes localized copies and
   * sanity keywords raised by the diagnostics hook.
   */
  error: [/impossibile/i, /errore/i, /invalid/i, /non disponibile/i, /nessuna/i],
} as const;

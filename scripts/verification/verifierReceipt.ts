/**
 * verifierReceipt — receipt meccanico del verificatore (PLAN-044 T-005 / S3).
 *
 * `verifier.json` non è più un file scritto a mano o da un LLM: è un receipt
 * GENERATO da questo modulo dopo la valutazione meccanica delle obbligazioni.
 * Per ogni obbligazione registra: verdetto meccanico, hash del criterio, hash
 * degli artefatti reali e l'exit code del comando — più `generated_by` e un
 * `tree_sha256` calcolato sull'albero finale sorgente+test (file changed non
 * exempt) al momento della produzione.
 *
 * Il giudizio LLM è demosso a advisory: vive nel decision report, non nel
 * gate (v32 pt. 7). Un receipt editato a mano lascia delta rilevabili: il
 * gate richiede `generated_by`, ricontrolla i criteria hash e confronta gli
 * evidence hash con i file reali (checkVerifier / validateBundleFile).
 */
import path from 'node:path';
import {
  CommandResult,
  Manifest,
  ObligationEvaluation,
  ObligationResult,
  VerifierEvaluation,
  VerifierFile,
  canonicalFileHash,
  criteriaHash,
  sha256Text,
} from './gateCore';
import { isExemptFile } from './contractsCheck';

export const GENERATED_BY = 'scripts/verification/produceBundle.ts (receipt meccanico)';

export interface ReceiptEvaluation extends VerifierEvaluation {
  /** Exit code del comando dell'obbligazione (null se non eseguito). */
  exit_code?: number | null;
  /** Nota meccanica (es. deroga Director). */
  note?: string;
}

export interface VerifierReceipt extends VerifierFile {
  generated_by: string;
  /** Hash dell'albero sorgente+test al momento del receipt. */
  tree_sha256?: string;
  tree_files?: number;
}

/** sha256 sull'insieme {file: canonical-hash} dei changed non-exempt. */
export function sourceTreeHash(
  repoRoot: string,
  changedFiles: string[],
): { sha256: string; files: number } {
  const scoped = changedFiles.filter((f) => !isExemptFile(f));
  const lines = scoped
    .map((f) => `${f}:${canonicalFileHash(path.join(repoRoot, f)) ?? 'missing'}`)
    .sort();
  return { sha256: sha256Text(lines.join('\n')), files: scoped.length };
}

function verdictOf(result: ObligationResult): VerifierEvaluation['verdict'] {
  if (result === 'PASS') return 'CONFIRMED';
  if (result === 'FAIL' || result === 'INVALID_ENV') return 'CONTESTED';
  return 'UNVERIFIABLE';
}

/**
 * Genera il receipt `verifier.json`. Le `evaluations` devono essere quelle
 * prodotte dalla stessa valutazione meccanica che va nel bundle: il receipt
 * è la trascrizione firmata di quel calcolo, non un secondo giudizio.
 */
export function generateVerifierReceipt(opts: {
  manifest: Manifest;
  evaluations: ObligationEvaluation[];
  commandResults: Record<string, CommandResult | null>;
  repoRoot: string;
  changedFiles?: string[];
}): VerifierReceipt {
  const { manifest, evaluations, commandResults, repoRoot, changedFiles } = opts;
  const receiptEvals: ReceiptEvaluation[] = evaluations.map((ev) => {
    const obl = manifest.obligations.find((o) => o.id === ev.id);
    const cmd = commandResults[ev.id] ?? null;
    const entry: ReceiptEvaluation = {
      id: ev.id,
      verdict: verdictOf(ev.result),
      criteria_sha256: criteriaHash(obl?.requirement ?? '', obl?.source ?? ''),
      evidence_sha256: ev.artifacts
        .map((a) => a.sha256)
        .filter((h): h is string => typeof h === 'string')
        .sort(),
      exit_code: cmd?.exit_code ?? null,
    };
    if (ev.result === 'WAIVED_DIRECTOR') entry.note = 'deroga Director';
    return entry;
  });
  const tree = changedFiles ? sourceTreeHash(repoRoot, changedFiles) : undefined;
  return {
    verifier: 'mechanical-receipt',
    generated_by: GENERATED_BY,
    evaluated_at: new Date().toISOString(),
    tree_sha256: tree?.sha256,
    tree_files: tree?.files,
    evaluations: receiptEvals,
  };
}

/**
 * narrationPrompt — the compact per-node prompt (PLAN-026 T4 / P3).
 * Budget contract: groq rifiuta payload ~40KB+ → brief compatti per
 * nodo (~2–3KB). Output = JSON puro, la forma `outputShape` del brief.
 * Niente contesto di sistema globale nel prompt — ogni chiamata è
 * autonoma e la scena porta i suoi vincoli.
 */

import type { SceneBrief } from './sceneBrief';
import type { DomainVocab } from '../domainVocabs';

export interface NarrationRequest {
  brief: SceneBrief;
  prompt: string;
}

/** Build the provider prompt for one node — compact, self-contained.
 *  `canonicalNames` maps stub-kit nouns (which leak into the mechanical
 *  facts via takeLoot/etc.) to the names the meta call chose for THIS
 *  domain — the model must use the canonical names, never the stub's. */
export function promptForNode(
  brief: SceneBrief,
  vocab: DomainVocab,
  meta: { gimmick: string; mood: string },
  canonicalNames?: Record<string, string>,
): NarrationRequest {
  const lines: string[] = [
    `Sei uno scrittore di quest per un RPG dark-fantasy in italiano. Scrivi il testo di UNA scena.`,
    ``,
    `MONDO (${vocab.label}): ${vocab.contractPitch}`,
    `GIMMICK STRUTTURALE: ${meta.gimmick}`,
    `TONO: ${meta.mood}`,
    ``,
    `SCENA: '${brief.nodeKey}' (ruolo: ${brief.kind}, beat ${brief.beat})`,
    `FATTI MECCANICI (non contraddire):`,
    ...brief.facts.map((f) => `- ${f}`),
    ``,
    `DEVE COMUNICARE:`,
    ...brief.mustConvey.map((m) => `- ${m}`),
    ``,
    `PUOI INVENTARE solo da questa whitelist:`,
    ...brief.mayInvent.slice(0, 24).map((m) => `- ${m}`),
    ``,
    `VIETATO (un solo termine boccia il testo):`,
    ...brief.forbidden.map((f) => `- ${f}`),
    ...(canonicalNames && Object.keys(canonicalNames).length
      ? [
          ``,
          `NOMINALI CANONICI — per oggetti/luoghi/personaggi usa SOLO questi nomi:`,
          ...Object.entries(canonicalNames).map(([stub, canon]) => `- «${canon}» (nei fatti: '${stub}')`),
        ]
      : []),
    ``,
    `REGOLE:`,
    `- Italiano, narratore esterno sobrio e concreto — niente retorica alta.`,
    `- Numeri vietati nel testo (i numeri li mostra l'UI): MAI cifre arabe né simboli + − = — scrivi "un passo avanti" non "+1", "un rischio" non "35%".`,
    `- Niente nomi propri inventati fuori dalla whitelist.`,
    `- MAI citare id tecnici (es. 'fv-x', 'CHECK:', nomi di opzione/nodo) né la parola "check": scrivi in prosa immersiva, le meccaniche restano dietro le quinte.`,
    `- Rispondi SOLO con JSON valido, niente markdown:`,
    `{ "title": "≤60 car", "body": "2-4 frasi ≤400 car"${brief.outputShape.includes('failHint') ? ', "failHint": "≤80 car — il pericolo prima del lancio"' : ''}${brief.outputShape.includes('option{label,detail}') ? ', "option": {"label": "≤40 car", "detail": "≤140 car — stat + costo in parole"}' : ''}${brief.outputShape.some((s) => s.startsWith('transit')) ? ', "transit": "≤140 car"' : ''}${brief.outputShape.some((s) => s.startsWith('verdictFlavor')) ? ', "verdictFlavor": {"win": "≤120", "fail": "≤120", "epicfail": "≤120"}' : ''}${brief.outputShape.some((s) => s.startsWith('outcomeLog')) ? ', "outcomeLog": {"win": "≤140", "bigwin": "≤140"}' : ''} }`,
  ];
  return { brief, prompt: lines.join('\n') };
}

/** Build the meta-level prompt for the kit's envelope fields (title,
 *  flavour, objective + the named entities the skeleton references) —
 *  one call per narration run. `extraFields` describes the JSON keys the
 *  kit needs beyond the shared envelope (e.g. loot names or rival/prize). */
export function promptForKitMeta(
  vocab: DomainVocab,
  meta: { gimmick: string; mood: string; extraFields: string[] },
): string {
  return [
    `Sei uno scrittore di quest per un RPG dark-fantasy in italiano.`,
    `MONDO (${vocab.label}): ${vocab.contractPitch}`,
    `GIMMICK STRUTTURALE: ${meta.gimmick}`,
    `TONO: ${meta.mood}`,
    ``,
    `Scrivi l'involucro della quest — il manifesto che il giocatore legge in offerta.`,
    `PUOI INVENTARE solo da: ${[...vocab.luoghi, ...vocab.props, ...vocab.pericoliAmbientali].slice(0, 20).join(', ')}`,
    `VIETATO: ${vocab.vietati.join(', ')}`,
    ``,
    `Rispondi SOLO con JSON valido:`,
    `{ "title": "titolo quest ≤40 car", "flavour": "una riga ≤120 car", "objective": "obiettivo dichiarato ≤140 car", "intelId": "id-kebab dell'informazione nascosta ≤24 car"${meta.extraFields.length ? `, ${meta.extraFields.join(', ')}` : ''} }`,
  ].join('\n');
}

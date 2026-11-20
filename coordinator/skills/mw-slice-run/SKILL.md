---
name: mw-slice-run
description: >
  MANDATORY per eseguire la pipeline slice-kit su una superficie
  (mockup/golden → componente scalabile): workflow obbligato Passo 1→7 dove
  ogni passo produce una ricevuta nel record e `npm run slice:audit` deve
  essere verde prima del passo successivo. NON è il documento del metodo —
  è l'esecuzione. Metodo: SLICEKIT.md + profilo mockup-pipeline.
---

Inizia sempre la risposta con `mw-slice-run:`

Carica prima di procedere: `context/shared/SLICEKIT.md` (Passi + Passo 7bis
schema ricevute) e `context/mockup-pipeline-profile.md` (`[P8]` path,
`[P9]` matrice). Se i symlink `context/shared/` sono rotti, STOP: il
metodo canonico non è leggibile.

# mw-slice-run

## Quando invocare

- SEMPRE per convertire una superficie da mockup/golden a componente
  slice-kit (Passi 1→7 di SLICEKIT).
- MAI per giudizio/adattamento estetico (quello è PLAN-128, altro contratto)
  o per superfici senza cornice slice-kit.

## La regola unica

**Un passo senza la sua ricevuta non è fatto.** Il record
`test-results/slicekit/<surface>.json` e il journal
`<surface>.journal.jsonl` sono gli unici conti che valgono. Dopo OGNI
passo lancia `npm run slice:audit -- <surface>` — se non è verde, il
passo successivo NON inizia (transition gate, PLAN-127 OB-12).

## Workflow obbligato

| # | Passo | Comando / azione | Ricevuta attesa | STOP se |
|---|---|---|---|---|
| 1 | Golden | golden approvato; registra `golden{path,sha256}` nel record | `golden` | riferimento ambiguo → **2 opzioni esplicite e STOP per il Director** (T-31, human-only) |
| 2 | Slop gate (1bis) | check meccanici (OCR, lighting, simmetria, fused edges) + VLM advisory | `slop_gate_1bis` (declared+`evidence`) | golden sporco → rigenera ORA, non dopo |
| 3 | Affettabilità (1ter) | `npm run slice:gate -- <spec> --record test-results/slicekit/<surface>.json` | `sliceability_1ter` | **warning → decidi a monte** (inset autoriali / segmenti fissi / rigenera bordi puliti) — NON montare e scoprirlo dopo |
| 4 | Spec + slice | scrivi spec data-only in `scripts/hud-real/specs/`; `.mw/venv/bin/python scripts/hud-real/slice-frame.py --spec <spec>` | manifest `source.sha256` + journal `slice` | tool rifiuta (T-32 ≥3 patch) → `--regenerate` solo se il golden è davvero stato rigenerato |
| 5 | Seam/oracle | `python scripts/hud-real/compare-to-oracle.py ... --record` | `seam_gate` o `checks[]`+`verdict` | seam_rejections → aggiusta spec (1 patch), non i pezzi a mano |
| 6 | Probe V1/V2/V3 | probe headless matrice [P9]; registra `matrix_coverage` | `V1`,`V2`,`V3` + `matrix_coverage` | sotto il minimo `matrixMin` → la probe non conta |
| 7 | Montaggio + verdetto | monta su superficie reale, board candidati, cattura headless | `director_verdict` declared+`evidence` | MAI chiudere su metriche o codice (T-30) — serve verdetto umano che ha visto |

Dopo OGNI riga: `npm run slice:audit -- <surface>` verde, altrimenti STOP.

## Condizioni STOP (sempre, non negoziabili)

- **Warning del gate 1ter** → decisione a monte, mai post-montaggio.
- **Riferimento del Director ambiguo** → due opzioni esplicite + STOP (T-31 —
  nessun tool lo forza, è condotta).
- **3 patch senza rigenerazione** → il tool rifiuta da solo (tripwire
  journal); non cercare scappatoie, rigenera la cornice (T-32).
- **Metriche aggregate come prova** → vietato (T-30): mediana/ΔE/media non
  certificano materiali dipinti; servono distribuzioni + verdetto umano.
- **Audit rosso** → non procedere al passo successivo, non dichiarare
  «fatto con asterisco»: correggi o riporta il FAIL al Director.

## Anti-pattern che questa skill previene

- Protocollo scritto saltato sotto pressione (pilota Roster/Stash:
  5,5h, 6 respingimenti sugli angoli — il gate 1ter non era mai stato
  lanciato a monte).
- Ricevute vecchie riusate dopo un golden/spec/tool cambiato: l'audit le
  invalida per hash — niente falsi verdi.
- Patch loop «un'altra piccola modifica»: il journal conta, a 3 si ferma.
- Verdetto dichiarato senza che nessuno abbia guardato il montato (T-04).

## Boundary dichiarato

Le ricevute fermano gli skip, non il sabotaggio: un flusso che edita i
file fuori dai tool o falsifica le evidenze è fuori dal confine di
fiducia del progetto (residuo dichiarato in PLAN-127 r004).

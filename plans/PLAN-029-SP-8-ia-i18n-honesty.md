---
title: 'PLAN-029 SP-8 — IA / i18n / status-honesty pass'
status: candidate
created: 2026-10-12
parent: PLAN-029
debate: mw-web-debate `20261012-quest-gen-lab-sp8-ia-i18n-polish` — artifact
  r003 converged 3/3 eligible (deepseek ACCEPT; gemini ACCEPT; chatgpt
  ACCEPT dopo 2 OBJECT assorbiti; grok provider_dead ×6)
artifact_sha256: 2ead84d9ece6e93e698c61aa9c2202596947235375a0a1846927571e4439a34d
depends_on: PLAN-029 SP-1…SP-7 — ultimo subplan v1 (W10), chiude il piano
---

# SP-8 — IA / i18n / status-honesty pass — artifact r003

3 revisioni. r003 assorbe il tightening chatgpt su §4 (evidence per-entry
nominata nella honesty matrix; audit manuale nello stesso PR del flip di
status; file-existence mai prova sufficiente). r002 aveva assorbito: 2 note
deepseek (assertion su i18n-key + `data-status-kind`, `files` field già
esistente → nessuno schema carve-out) + 2 OBJECT chatgpt (file-existence ≠
implementazione; tassonomia stati §5). Tutte le stance READY erano già
convergenti su: IA map unica, sub-namespaces i18n, honesty matrix +
assertion eseguibili, truthfulness eseguibile del registry.

## 0. Scope

W10 di PLAN-029 — l'ultimo miglio: architettura dell'informazione, copy e
linguaggio degli status onesti e completi. NON possiede: redesign delle
superfici pinnate SP-1…SP-7, nuovo comportamento funzionale, audit i18n
globale dell'app.

## 1. IA map (sorgente unica; Author = modalità, non silo)

| Superficie | Sezione ospite |
|---|---|
| picker + candidate card | Generated catalog |
| gates panel | detail column (pin SP-3) |
| kit drawer | inventory ingredienti/kit |
| tuning + what-if drawer | dettaglio candidato nello scenario explorer |
| banner persistence + import/export | status strip in page-header (page-scoped) |

Un placement che contraddice un pin SP-2…SP-7 perde contro il pin;
l'override è registrato.

## 2. Tassonomia i18n

Sub-namespace per superficie `questGenLab.{picker,generate,candidate,
gates,drawers,persistence}.*` + condivisi `questGenLab.status.*` (etichette
enum, mapping unico referenziato dalle superfici) e `questGenLab.common.*`
(verbi/label riusati). Copy sotto le superfici; le stringhe enum non sono
mai duplicate. Copertura en + it-IT + pseudo.

## 3. Status-honesty

UNA honesty matrix doc (claim → superficie → test id → owner) + assertion
eseguibili per claim:

- le assertion legano a chiavi i18n + attributi `data-status-kind`
  (`pass` | `runtime-auth`), MAI a identità di nodo DOM o classi CSS — un
  refactor di layout non deve fallire un test di onestà;
- claim coperti: STALE assente dai payload persistiti; badge mc mostra
  "diagnostic/provisional" finché non calibrato; badge PASS ≠ badge
  autorizzazione runtime; label provenance narrated-kit renderizzata
  quando il flag è settato.

Doc sola drifta; test soli perdono la vista di audit — entrambi.

## 4. Registry truthfulness (eseguibile, non checklist)

- Path dichiarati dal campo `files` già esistente — nessuna modifica di
  schema.
- `implemented` → ogni file dichiarato esiste E una capability assertion
  NOMINATA passa (entry point importabile / usage cablato nel page tree).
  Ogni entry implemented identifica la sua capability assertion + sorgente
  di evidenza nella honesty matrix. Dove l'automazione non basta → audit
  manuale nominata nello STESSO PR del cambio status. File-existence da
  sola MAI prova di implementazione.
- `partial` → file esistono + gap marker documentato.
- `missing` → `files: []` + openIssue corrispondente o record not-applicable;
  ogni status missing/partial/gated ha copertura issue accurata e actionable.
- openIssues resta manuale + DoD: un SP che chiude una issue la elimina
  nello stesso PR; test: nessuna openIssue referenzia un subsystem
  `implemented`.

## 5. Contratto copy stati vuoti (tassonomia per superficie)

`NOT_ATTEMPTED / ATTEMPTED_NO_RESULT / FAILED / BLOCKED / RECEIPT_BACKED` —
una riga i18n-keyed per superficie × stato.

- La regola no-past-tense / no-checkmark si applica SOLO agli stati
  NOT_ATTEMPTED — mai ai fallimenti: uno stato FAILED dichiara fattualmente
  cosa è fallito (present tense) e mostra un'azione di recovery SOLO dove
  supportata.
- Linguaggio "done"/receipt riservato a RECEIPT_BACKED.
- Stati enumerati: pre-first-generate, zero candidates, gates-never-run,
  gates-ran-no-signal, import-never-attempted, import-failed,
  persistence-unsaved, blocked-override.

## 6. Defer espliciti

Nessun redesign delle superfici pinnate SP-1…SP-7; nessun comportamento
funzionale nuovo; nessuna riscrittura del copy observer ratificato;
nessuna modifica di schema al registry (`files` esiste già); nessun test
di correttezza funzionale di SP-2…SP-7 (solo honesty); pseudo-locale
resta scopato alle sezioni lab (SP-7).

## 7. Tasks

| T | Task | Test |
|---|------|------|
| T-1 | IA map + header status strip | placement conforme ai pin |
| T-2 | tassonomia i18n + tutte le chiavi en/it-IT/pseudo | nessuna chiave mancante sulle nuove superfici |
| T-3 | honesty matrix doc + assertion eseguibili | binding key/data-status-kind |
| T-4 | test registry truthfulness + audit openIssues | file+capability per implemented; issue coverage |
| T-5 | contratto copy stati vuoti + tassonomia | una riga per stato; regola tenses |

## 8. Rulings

- R-1: la honesty matrix possiede le definizioni di evidenza per
  sottosistema — zero inflazione dello schema registry.
- R-2: uno status non si sposta senza evidenza che atterra nello stesso PR.
- R-3: "done" è un claim receipt-backed; tutto il resto descrive cosa non è
  ancora successo o cosa è fallito.

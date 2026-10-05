# Documentation Impact Contract (R-085)

Ogni piano in `plans/` e ogni task esecutivo che modifica conoscenza di progetto
dichiara un campo **Documentation Impact**. Un piano con impact `REQUIRED`
non è completo finché i documenti indicati non sono aggiornati.

## Vocabolario

- `NONE` — nessuna conoscenza cambiata (bugfix interno, refactor meccanico).
  Richiede una riga di motivazione nel piano.
- `OPTIONAL` — il piano può aggiornare documenti di supporto se emerge nuova
  conoscenza durante l'esecuzione.
- `REQUIRED` — il piano modifica regole, decisioni, stato o terminologia:
  deve elencare i **target documentali** prima del battesimo.

## Routing degli update (§23 del refactor)

| Cosa cambia | Documento da aggiornare |
|---|---|
| Regola quest vigente | `QUEST_RULES.md` (vedi `.windsurf/rules/80-quest-rules-maintenance.md`) |
| Regola gameplay generale | `GAMEPLAY_DESIGN.md` (visione) — verificare se il dominio ha un doc canonico più specifico in `CANON.md` |
| Decisione nuova/cambiata | `context/DECISION_LOG.md` + doc canonico del dominio |
| Domanda irrisolta | `context/OPEN.md` |
| Approccio rifiutato | `context/REJECTED.md` |
| Termine importante | `GLOSSARY.md` |
| Architettura | `src/docs/docs/architecture_state.md` (router) + doc canonico del dominio |
| Stato runtime | `CURRENT_STATE.md` + `SESSION_HANDOFF.md` (regola `70-state-docs-sync.md`) |
| Nuovo doc canonico | `CANON.md` (mappa autorità — richiede avallo Director) + `context/INDEX.md` |
| Ingestione conversazione | `context/ingestions/` + riga in `context/INDEX.md` |
| Nuovo piano / cambio stato piano | `plans/INDEX.md` |

## Vincoli

- Non duplicare la stessa regola in più documenti canonici: un'unica fonte +
  riferimenti (vedi `CANON.md` mappa delle autorità).
- Documentation impact `NONE` con motivazione assente = piano incompleto.
- Aggiornamenti meccanici (link, banner di stato) non richiedono questo campo.

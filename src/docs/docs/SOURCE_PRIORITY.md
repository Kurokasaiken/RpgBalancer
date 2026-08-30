# Source Priority (candidate)

Quando informazioni confliggono, usa questa gerarchia:

| Precedenza | Fonte | Ruolo |
|---|---|---|
| 1 | Explicit Director approval | Autorità decisionale massima |
| 2 | Accepted ADR | Decisioni approvate e tracciate |
| 3 | Canonical /docs | Contratti design e comportamento atteso |
| 4 | Validated /game-data | Parametri e dati validati |
| 5 | Code + tests | Evidenza del comportamento implementato |
| 6 | AGENTS.md / .windsurf/rules | Enforcement operativo |
| 7 | RICHIESTE.md | Richieste/intenti aperti |
| 8 | context/ | Contesto storico/transitorio |
| 9 | .mw/ deliberations | Proposte ed evidenza |
| 10 | AI conversations | Materiale sorgente, non canonico |

## Regole

- Se un'ADR e il codice sono in conflitto, **registra il conflitto** e chiedi una decisione esplicita: non aggiornare silenziosamente.
- Una proposta non merged non è verità canonica.
- Non trattare una conversazione con un LLM come fonte di verità.

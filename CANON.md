# Project Canon — Mappa delle autorità

**Versione:** 1
**Data:** 2026-08-31
**Stato:** canonical
**Autorizzato da:** Fausto (via "Procedi" in sessione)

Questo documento non sostituisce i documenti che elenca: indica solo **quale documento ha autorità su quale tipo di decisione**.

## Gerarchia delle fonti

Per ogni domanda, il documento di riferimento è:

- **Gameplay reale e regole** → `GAMEPLAY_DESIGN.md`
- **Direzione visiva e design pillars** → `DESIGN_PILLARS.md`
- **Intenti congelati / vincoli approvati** → `.mw/desiderata.md` (versione `FROZEN` più alta)
- **Decisioni prese e perché** → `context/DECISION_LOG.md`
- **Richieste attive del Director** → `RICHIESTE.md`
- **Piano operativo della vertical slice** → `VERTICAL_SLICE_ROADMAP.md`
- **Stato attuale del runtime, blocker, pezzi completati** → `CURRENT_STATE.md`
- **Regole tecniche e invarianti** → `DEVELOPMENT_GUIDELINES.md`, `.windsurf/rules/00-project-invariants.md`, `.windsurf/rules/40-documentation-governance.md`
- **Catalogo documenti caldi e tracciamento** → `context/INDEX.md`
- **Glossario dei termini** → `GLOSSARY.md`
- **Governance per agenti AI** → `AGENTS.md`

## Stati della conoscenza

Ogni affermazione su progetto, codice o design deve essere classificata così:

- **FACT** — è verificabile nel repository (codice, test, config, dati).
- **DECISION** — è registrata in `.mw/desiderata.md` FROZEN, `context/DECISION_LOG.md` o `CANON.md`.
- **PROPOSAL** — è una proposta non ancora accettata.
- **OBSOLETE** — era vera, ma è stata superata da una decisione successiva.

## Cosa un agente non può fare

Un agente non può, senza esplicito avallo del Director:

- ridefinire gameplay, progressione, monetizzazione, art direction o scope;
- sovrascrivere una `desiderata` con status `FROZEN`;
- riscrivere componenti `trusted`/`frozen` senza aggiornare il loro contratto e i test;
- introdurre valori hardcoded di gameplay o UI;
- cambiare direzione artistica in silenzio;
- trattare `DECISION_LOG.md` come se fosse `CURRENT_STATE.md`.

## Note

- `DECISION_LOG.md` è **storia**, non stato corrente.
- `DESIGN_PILLARS.md` è **direzione**, non specifica.
- `GAMEPLAY_DESIGN.md` è **game design**, non implementazione.
- `VERTICAL_SLICE_ROADMAP.md` è **piano**, non realtà.
- `CURRENT_STATE.md` è la **fotografia** del runtime oggi.

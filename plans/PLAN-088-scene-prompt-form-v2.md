# PLAN-088 — Scene Prompt Form v2 (4-job split + parallax contract)

**Status:** draft
**Source:** R-285 + multi-AI web critique 2026-10-24 (`form-critique-r001`, canary-verified 4/5)
**Scope:** `src/docs/docs/art-direction/scene_prompt_form.md` revision + exemplar library

## Il problema che il form v1 non risolve

Il Director ha chiesto un form di compilazione obbligatoria. v1 (F1-F13) esiste e ha il campo giusto, ma la critica 4-AI (Claude, Gemini, DeepSeek, ChatGPT — Grok failed-adapter) converge sullo stesso difetto strutturale: il form **confonde 4 lavori diversi**.

## La riscrittura: 4 job separati

ChatGPT ha centrato il punto — il form oggi mescola:

| Job | Cosa controlla | Campi |
|---|---|---|
| **Content authority** | cosa esiste, cosa non esiste, cosa il generatore non inventa | F2 SUBJECT+BEAT, F10/F11 bans → **CLOSED INVENTORY** (solo gli elementi elencati, conteggi esatti) |
| **Visual hierarchy** | cosa si legge prima, cosa sopravvive a thumbnail, dove sta l'hook | F3 SIGNATURE HOOK (→ subset di F2, test ridisegnabile-a-64px), **VALUE PLAN** (3 valori dichiarati: dominante/secondario/accento) |
| **Rendering & color** | impasto, murk, palette, ombre | F7 TECHNIQUE, F9 PALETTE → **BROWN-GUARD** (tabella materiale→resa satura, nessun materiale senza traduzione), GROUND & SHADOW ANCHOR |
| **Integration geometry** | crop, parallax, occluder, reveal | **CANVAS_GEOMETRY**, **OCCLUDER_ZONE**, **REVEAL_ZONE**, **HIDDEN_SUBJECTS**, **CROP_CONTRACT**, **CONTINUITY_CONTRACT**, **PARALLAX_DEPTH** |

## Merge consigliati dalle AI

- **F1+F7**: medium-first detto due volte diluisce — F1 = solo identità/title, F7 = tutta la tecnica
- **F10+F11**: inline bans e kill list separati disperdono attenzione — unificati in un exclusion system
- **F6 MOOD**: convergenza sul convertirlo da emozione astratta a **Visual Mood Modifiers** (posta, rim-light, contrasto concreti)

## Nuovi campi (agreed dalle 4)

- `CLOSED INVENTORY` — kill degli invented subjects: solo ciò elencato
- `LOOT SPECIFICITY` — ogni oggetto porta attributo non-generico (chipped/rune-scored/wax-sealed) + banned-generic-nouns ("potion", "gold coins")
- `VALUE PLAN` — 3 valori dichiarati
- `BROWN-GUARD` — tabella obbligatoria materiale→resa satura
- `DEPTH LAYER` / `OCCLUDER_ZONE` — piani fisici + zona occluder per parallax
- `HIDDEN_SUBJECTS` — entità camuffate, posizioni, grado di occlusione
- `CROP_CONTRACT` — cosa ogni crop deve contenere/escludere
- `CONTINUITY_CONTRACT` — prospettiva+luce+materia coerenti sulla tela unica
- `PARALLAX_DEPTH` — assegnazioni FG/MG/BG e cosa si muove

## Exemplar library — 10, non 8

ChatGPT: 10 gold-standard prompt+output pairs (non solo testo), uno per failure-mode. Copertura attuale 8 categorie; le mancanti: interior, artifact/loot-distinctive, parallax-occluder, rendering stress-test.

## Tasks

| # | Cosa |
|---|---|
| T-001 | Riscrivere `scene_prompt_form.md` con la struttura 4-job + merge + nuovi campi |
| T-002 | Aggiungere il blocco PARALLAX COMPOSITION — HARD REQUIREMENTS (clausola ChatGPT pronta) |
| T-003 | Registrare i canary falliti: ChatGPT ✅ recuperato (reset conversation URL), Grok adapter bug — riprova quando fixato |
| T-004 | Eye-check Director della form v2 prima di usarla per la prossima generazione |

## Fuori scope

Il lint (`lint-scene-prompts.py`) non è in questo plan — viene dopo, quando la forma v2 è congelata (T-004).

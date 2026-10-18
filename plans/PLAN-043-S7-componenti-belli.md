---
title: "PLAN-043-S7 — Valorizzare i componenti belli: skill check, inventario, arte, asset"
parent: PLAN-043
status: completed
created: 2026-10-17 (scorporato dal master PLAN-043; lavoro del 2026-10-16)
source_request: R-207
documentation_impact: OPTIONAL
doc_targets:
  - public/assets/scene-library/CATALOG.md (quando arrivano le scene delle rovine)
---

# PLAN-043-S7 — Valorizzare i componenti belli: skill check, inventario, arte, asset

Master: [PLAN-043](PLAN-043-game-quest-surface-pass.md) · stato operativo in [INDEX](INDEX.md).

## Richiesta (verbatim)

> *"Dobbiamo valorizzare meglio i componenti belli cm lo skill check"* (2026-10-16) · *"d6: si, e anche altri asset che possiamo generare, sn mlto convinto delle scelte artistiche del mio piano"* (2026-10-16) · *"procedi con F3"* · *"sì, procedi con F3"* (2026-10-16)

## Task ed esiti

- **T3.1 Inventario del bello (Opus):** dalle catture, l'elenco dei pezzi che reggono già un livello premium e oggi sono sprecati. Proposta di partenza da confermare (**D6**): lo **skill check (astrolabio)**, l'**arte delle quest** (cover e scene del theatre), la **vista Villaggio**, i **glifi dipinti** dei POI e delle risorse.
- **T3.2 Skill check messo in scena:** oggi ≈ 1/8 della finestra a 1920. Dimensione e rapporto della board a 1280/1920/2560, cornice, posizione (sopra la finestra, non dentro una placca piccola), entrata e uscita, legame con l'esito. Il board V62 non si tocca (v11–v20).
- **T3.4 Nuovi asset (D6):** dalla bibbia artistica e dal kit dei prompt, un elenco di asset da generare per la superficie (scene delle quest, arte per esiti e ricompense, icone mancanti, elementi del villaggio), con prompt pronti; il Director genera e sceglie, la pipeline di ritaglio e montaggio è quella delle ancore (PLAN-058 F2–F3).
- **T3.3 Arte della quest:** quanto spazio prende l'immagine, rapporto, come si fonde con il testo (si collega a F5).
- *Accettazione:* catture prima/dopo per ogni componente valorizzato; nessun pannello modale (v4).
- **Esito F3 (2026-10-16) — dettagli e misure in `test-results/plan-043/f3/F3-inventario-e-asset.md`:** **T3.1** inventario del bello e di dove la qualità cade (le 8 scene delle rovine sono foto di pubblico dominio, la copertina è una foto di piramidi con la sfinge). **T3.2 fatto:** la board dello skill check era 240×240 a ogni schermo e tagliata su tre lati perché la larghezza non era impostata; ora cresce con lo schermo (360 / 480 / 576 px a 1280 / 1920 / 2560), con velo scuro non bloccante dietro e entrata di 240 ms; il kit V62 non è toccato; valori in `skillCheck.boardVh|boardMaxPx`. **T3.3** misure (theatre 2,4 contro immagini 2,357: nessun taglio; il limite è la finestra fissa a 820 px) e proposta, da chiudere in F5. **T3.4** prompt pronti per le 8 scene delle rovine (`.mw/specs/quest-rovine-scenes/`), il «ritorno» ha già il suo prompt; gli asset di esiti, sagome dei nemici e punti del villaggio dipendono da D2/D3/F6 e non sono scritti. *Non verificato:* l'uscita animata dell'overlay, il check dentro `/game`, i18n con testi lunghi; i prompt non sono stati ancora generati.
- **Gate F3:** ✅ **sì del Director (2026-10-16: «sì, procedi con F3»).**
- **Ricerca D2/D3 (Director 2026-10-16: «fa una ricerca x D2 e D3»):** `test-results/plan-043/f5/D2-D3-ricerca-e-proposte.md` — tre direzioni per ciascuna, con fonti (informali) e raccomandazione: **D2 = C «la finestra che respira» come base + B «scena a tutto schermo» come tag opzionale su 2–3 beat; D3 = A «esito dentro lo skill check» durante la run + B «carta che si gira» a fine run.** In attesa della scelta del Director.

**Resta al Director:** generare le 8 scene delle rovine e il «ritorno» (prompt in `.mw/specs/quest-rovine-scenes/` e `.mw/specs/quest-goblin-scenes/scenes/f8-ritorno/`).

## Contratto di chiusura

- `test-results/plan-043/f3/F3-inventario-e-asset.md`, `f3/check-shot.spec.ts` (board 360/480/576).
- Gate: sì del Director (2026-10-16).
- Chiuso dal gate del Director; nessun bundle.

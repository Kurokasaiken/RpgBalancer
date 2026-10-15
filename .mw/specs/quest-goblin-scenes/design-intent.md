# Quest «Sterminio dei goblin» — Scene Art — Design Intent

## Purpose

Replace the 8 public-domain paintings in `public/assets/quest-goblin/` with
AI-generated scene art aligned to the Wanderlust art bible. One image per
*distinct scene* (granularity B, R-172): every narrative beat and every player
choice gets its own painting; sibling nodes showing the same place reuse it.

## Sources

- Quest bible (single source of truth for subjects):
  `src/docs/docs/idle_village/quest_sterminio_goblin_spec.md`
- Executable scenario (node ids): `src/balancing/config/idleVillage/quests/scenarios/goblin.ts`
- Scene prompt rules: `src/docs/docs/art-direction/scene_prompt_authoring_guide.md`
  (guida operativa — le vincoli sotto la implementano per questa quest)
- Art bible (style, kill list, prompt rules):
  `src/docs/docs/plans/art_direction_plan.md` (v0.13, §10.7 → guida scene)
- Creature sheet: `src/docs/docs/art-direction/creatures/creatures/goblin/` v0.1.0
- Runtime mapping to update after generation:
  `src/ui/idleVillage/questS1Lab/questArt.ts` (`NODE_ART`)

## Director constraints (2026-10-12, v4)

1. **Il party del giocatore non è mai disegnato.** Niente eroi, mani,
   stivali o sagome alleate del gruppo del giocatore — resta immaginazione.
   Party *esterni*, NPC e persone generiche invece sono ammessi dove servono
   (es. il mercante, viandanti, guardie del villaggio).
2. **Immagine = beat pre-scelta / pre-check, mai esito.** Nessun reveal:
   l'albero si vede da sotto (non dall'alto), la palizzata è integra (pre-
   impatto), i campanelli del bigwin non appaiono in F1.
3. **Goblin = archetipi temporanei, con scheda visiva.** Compaiono dove
   obbligatori (`f4-combattimento`, `f5-incalzare`, `f7-agguato`,
   `f7-ultimo-scontro`) come massa/sagome — identità dalla scheda
   `src/docs/docs/art-direction/creatures/creatures/goblin/` v0.1.0
   candidate: verde classico, piccoli e scattanti, cuoio+legno+war-paint
   ocra/cremisi, sciame feroce. Mai primi piani, volti o individui.
4. **Luce libera, palette e luminosità di bibbia.** Nessun Solar Triumph
   forzato — la luce è quella naturale del beat (alba, tramonto, fuoco).
   Restano però pigmenti Wanderlust (ultramarine, verde Veronese, cinabro,
   ambra; ombre colorate, mai grigio/marrone/fango) e la **luminosità**: il
   quadro resta ad alta cromia, la luce vince, anche il buio è colore saturo
   mai nero murk. Non sono vincoli UI/HUD, sono il DNA. Vietato solo
   inventare vincoli cromatici dalla UI.
5. **Scelta = immagine diversa.** I nodi check dopo una scelta mostrano la via
   scelta (`gob-stealth` ≠ `gob-assalto`, `gob-tracce-per` ≠ `gob-tracce-perfor`).
6. **Sollievo → shock tra F7 e F8.** `agguato.png` e `ritorno.png` DEVONO
   essere immagini diverse: il contrasto è authored.
7. **Titoli fase (Director):** F0 Viaggio · F1 Esplorazione ·
   F2 Il bottino · F3 L'accampamento · F4 Combattimento (titolo da confermare)
   · F5 Incalzare · F6 Spoglie di guerra · F7 L'agguato · F8 Ritorno.
   Trappola F3-stealth ratificata: **«Intrusi»**.
8. **Design B (da ratificare):** masso eliminato; F2 diventa il terzo carro
   mercantile mai tornato (callback F0). Delta al manoscritto in `scenes.md`.

## Style rules from the Bible (v0.12)

- Thick oil impasto, broad palette-knife brushstrokes (Jaime Jones matter);
  split-rendering pulito SOLO sul punto focale, se presente.
- LIGHTING: libera per scena (alba, mezzogiorno, tramonto cinabro, fuoco di
  notte) — nessun Solar Triumph forzato.
- PALETTE: bibbia — ultramarine, verde Veronese, cinabro, ambra; ombre
  colorate, NO grey, NO brown, NO mud.
- KILL LIST (non cromatica): no grim, no gore, no symmetry, no flat digital
  surfaces, no sci-fi.
- Pilastro Wilderness: Dolomiti, foresta antica, timber/pietra alpina/golden
  thatch — rude bellezza, non miseria. La violenza è «costo materico», mai gore.
- Le scene sono beat ambientali → si applica il master ambientale V1 (§5) più
  la kill list; i campi V2 (§10) restano per umani/creature e non si applicano.

## Generation pipeline

- **Primaria (Director 2026-10-12): generazione ESTERNA** — Gemini / Grok /
  GPT-image. I prompt lunghi sono nel primo blocco ```text di ogni
  `scenes/<slug>/prompt.md`, tutti aggregati in `prompts-external.md` per
  copy-paste. Il negative prompt è inline (clausola «Avoid»). Aspect:
  **21:9 cinematic scope** per le scene (detto da `StageBand`/`TransitView`,
  fascia ultra-wide del quest theatre), 3:4 per la card.
- **Fallback interno (opzionale):** `python scripts/rpg-gen-mockup.py
  --spec-dir <scene-dir>` — lo script legge il primo blocco ```text (= full
  prompt, avviserà >77 token); per la pipeline SDXL usare il blocco
  «Compact prompt — fallback SDXL» copiandolo in testa al file, e il blocco
  «Negative prompt» via `--negative`. Params di riferimento: SDXL MPS,
  cfg 7.5, steps 30, 1344×768.

## Output

- Destinazione: `public/assets/quest-goblin/<nome>.png` (nomi in `scenes.md`).
- Dopo la generazione: `provenance.md` per scena (modello, seed scelto,
  checksum) seguendo `.mw/specs/goblin-event-modal/assets/V002-hero/provenance.md`,
  aggiornare `public/assets/quest-goblin/SOURCES.md` e il mapping in
  `questArt.ts`. I dipinti public domain restano in repo finché i sostituti non
  passano review.

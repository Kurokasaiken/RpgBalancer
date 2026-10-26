# Digest critiche — legacy-reliquary-panel (round 1, 2/3 image-grounded)

Provider: chatgpt, claude, deepseek — run `20261025-critique-legacy-reliquary-panel`,
turn T-001 (+retry T-002 per chatgpt), prompt verbatim R-282, 3 shot
allegati (ctx-a, ctx-b, iso-0).

**Provider failure dichiarati:**
- chatgpt — 4ª image-perception failure del giorno: `ATTACH_FAILED` ×2
  (T-001 e retry T-002), «no upload affordance found». Causa nota dal
  probe delle ~06:38Z: quota upload free-tier, «attendi 11 ore». Vedi
  `chatgpt.md`.
- claude [RECUPERATO v. merge] — quota messaggi free-tier esaurita: DOM verbatim «Hai esaurito
  i messaggi gratuiti fino alle 12:20». `ATTACH_FAILED` dopo 180s; nessun
  retry perché il blocco è temporizzato e account-wide, non transitorio.
  Vedi `claude.md`. (Stesso account che alle 06:39Z aveva prodotto la
  critica grounded di village-slot-overlay.)

Convergenza = 1/1 provider image-grounded (solo deepseek). Nessuna
convergenza multi-provider possibile: i punti sotto sono tutti
single-source, da pesare di conseguenza nel visual fork.

## Punti della critica (deepseek, verbatim-sourced)

1. **Pannello inerte, non "cuore della progressione".** Tre colonne
   (Items, Heroes, Blueprints) con lo stesso peso visivo; nessuna
   gerarchia, nessun feedback, nessun senso di ricompensa: «un mockup
   generico di un form HTML degli anni 2000» sopra una mappa «con un
   potenziale visivo enorme».
2. **Affordance ambigua.** I numeri "1"/"2" sotto Items sono in box che
   «sembrano bottoni cliccabili senza alcuna affordance (non hanno hover
   state)» — vero sul mock: sono slot `legacy-slot-<cat>-<i>` selezionabili
   ma senza stati visivi.
3. **Empty state passivo.** «No building yet» (copy reale
   `gameFrame.legacy.noSlots`) «non guida il giocatore su cosa fare per
   sbloccare quella sezione» → suggerisce silhouette + progress bar +
   tooltip di sblocco, o CTA («Construct a Tavern… Go to Tavern»).
4. **Chiusura solo via X.** «contro le linee guida di usabilità per le
   modali» → Cancel/Close esplicito, click-outside, overlay scuro
   (rgba(0,0,0,.7)) + blur per separare la modale dalla mappa.
5. **Incoerenza stilistica.** Sfondo blu piatto + bordi oro sottili
   «sembra provenire da un altro gioco» rispetto all'estetica painterly;
   niente icone/texture che leghino il pannello al tema "retaggio".
6. **Manca il "perché".** Solo il titolo LEGACY, nessun sottotitolo o
   contesto → propone subtitle («The echoes of your civilization») e
   contatori di progresso (es. "0/3 Blueprints").

## Soluzioni proposte (deepseek)

- Tabs al posto delle 3 colonne statiche (o lista espandibile); slot
  come icone reali con bordo-rarità; stati vuoti con CTA diegetiche.
- Overlay + backdrop-blur, footer con azione primaria Close.
- Codice React+Tailwind completo (LegacyModal con `lucide-react`,
  dialog accessibile, empty-state con CTA) — stack coerente col progetto.

## Note di grounding

- Fatti osservati corretti: titolo LEGACY, 3 categorie Items/Heroes/
  Blueprints, empty-state «No building yet» (i18n `gameFrame.legacy.*`),
  slot numerati, pannello sopra la mappa painterly, X di chiusura.
- Misread lieve: descrive la X come «unico modo per chiudere» — nel markup
  esiste anche un bottone Cancel (`gameFrame.menu.cancel`) nell'header;
  la critica alla sola icona-X resta valida a livello percettivo.
- Limite strutturale: 1 solo provider grounded → i punti non sono
  cross-validati; utile soprattutto come checklist P0, non come verdetto.


## Merge claude (refill T-003, post-reset quota 22:20)

claude GROUNDED (~14.7k chars, verbatim in `claude.md`, run 20261025-critique-legacy-reliquary-panel dopo evento reseed).

**Verdetto claude:** «wireframe con la pelle da gioco fantasy — la cornice dorata promette un momento solenne ma dentro c'è un pannello di debug: due bottoni numerati, due messaggi identici e un Cancel senza un Confirm».

**Convergenza con deepseek**: la schermata legacy come momento decisionale (cosa sopravvive) è vuota di significato; manca gerarchia e contesto.

**Punti solo claude**: bottoni numerati opachi; messaggi duplicati identici; 'Cancel' senza 'Confirm' (la scelta più grave); assenza di rischio/spiegazione per una decisione irreversibile.

# Digest critiche — pixi-world-map (round 1, 3/3 transport, 2/3 in-scope)

Provider: chatgpt, claude, deepseek — prompt verbatim Director.
NOTA SCOPE: il componente è la mappa PixiJS (oceano, regioni, pin),
ma gli shot ctx includono la HUD — alcuni provider hanno divagato
sulla HUD (documentato come misread, non propagato ai componenti HUD).

## In-scope (mappa)

- **deepseek** (grounded): region overlay "Whispering Woods" come
  debug-draw piatto blu spesso sopra la mappa dipinta; pin senza
  label/stato/distanza; nessun marker sul villaggio; troppo oceano
  decorativo vs spazio interattivo; nuvole mozzate dietro l'HUD.
  Soluzioni: bordo tratteggiato "inchiostro" con displacement SVG,
  label `paint-order:stroke`, pin con badge, marker casa.
- **chatgpt** (grounded, scope misto): HUD operativa vs decorativa,
  contrasto leggibilità mappa↔UI, navigazione inferiore.
- **claude** ⚠ MISREAD: ha criticato il pannello Village Stash
  (visibile nel ctx) — contenuto salvato e valido come input per
  `village-stash-panel`, ma non conta nel grounding di questo
  componente. Flagged, non propagato.

## Convergenza (2/2 in-scope)

1. L'overlay regione è un "debug draw" su mappa dipinta — due
   linguaggi visivi in conflitto (contorno poligonale piatto).
2. Pin/marker senza gerarchia né label — il villaggio stesso non è
   segnalato.
3. Composizione: oceano decorativo occupa troppo schermo vs le aree
   interattive.

## Note

- Misread documentato, non propagato (onestà digest).
- Critica HUD nelle risposte miste trasferita ai digest dei
  componenti HUD pertinenti.

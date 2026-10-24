# Forense prompt — successi vs fallimenti (2026-10-24)

Domanda: perché le generazioni "v2" degradano mentre le prime e i moodboard
riescono? Coppie reali di prompt, output osservati.

## SUCCESSI (immagini accettate e wired)

- **bivacco** (Grok): "CAMPSITE AT DUSK" — eroe unico (fuoco), ogni elemento
  ha superficie+luce, kill-list runtime-owned, palette ad alta cromia →
  risultato spettacolare, tutto lo stack FX attaccabile.
- **agguato2** (Gemini): "AGGUATO" — una strada vuota assolata + massa
  muschiata sx + sagome in treeline. Un'azione-chiave chiara, luce dura.
- **intrusi** (Gemini): stesso formato — massa dx + sagome in fila.
- **sentiero-tracce** (Gemini): sentiero + impronte + luci ambrate lontane.
- **moodboard library** (Drago ecc.): formato corto, colori legati a
  superfici ("vivid turquoise sky, lime-green leaves").

## FALLIMENTI (rigenerati o rifiutati)

- **hidden-cache v2**: "bundle under tarp + kettle + rope + sack" →
  forziere con lucchetto centrato, eye-level, murky.
- **hidden-cache v3 (occlusion-first)**: → teiera, pacco, corda, sacco
  sparsi a terra, niente di nascosto.
- **f4/f5/f6 v1-2** (mai generati): beat inventati, tutti dusk/teal —
  pattern "dark triste" già nel prompt prima ancora dell'output.

## Ipotesi strutturali (da validare)

1. **Enumerazione = soggetto.** Ogni oggetto nominato diventa saliente;
   "hidden" non è token visivo. I fallimenti nominano oggetti; i successi
   nominano relazioni/luce/massa.
2. **Sottigliezza non si genera.** "subtly wrong", "too-tidy" sono
   richieste di giudizio, non di pittura — il modello le ignora o le
   risolve disegnando gli oggetti comunque.
3. **Luce dominante assente = murk.** Successi: mezzogiorno duro o
   fuoco eroe. Fallimenti: dusk/shade senza sorgente dipinta dominante.
4. **POV inusuali degradano.** "from above, no horizon" produce risultati
   piatti — il prior del modello è eye-level epico.
5. **Beat inventati ≠ fiction.** I brief f4/f5/f6 sono stati scritti
   prima di leggere il testo dei nodi — direzione attori ambigua (f4),
   scena inesistente (f6, nessun nodo gob-spoglie).

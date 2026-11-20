# Kit conversazione ChatGPT web — POI far-LOD su /game

## Da allegare (2 immagini, in questa cartella)

1. `card/game-poi-light.png` — screenshot HUD intera /game (1600×1000)
2. `card/game-poi-light-crop.png` — crop di un POI quest (320×320)

Path assoluti:
- /Users/faustoboni/progetti_personali/RPG/.mw/specs/poi-map-icon/card/game-poi-light.png
- /Users/faustoboni/progetti_personali/RPG/.mw/specs/poi-map-icon/card/game-poi-light-crop.png

## Prompt da incollare

```
Sei un art director. Queste due immagini sono screenshot live di un idle game dark-fantasy
(/game): HUD "Gilded Observatory" — ottone/sole, nero ossidiana, avorio, accenti teal.

Immagine 1 = HUD completa: mappa del mondo dipinta + cornice HUD in ottone + 7 marker POI
(quest = banda anello blu, job = banda verde). Ogni marker = pezzo bussola ottone
semplificato + banda halo luminosa del colore di famiglia. È la NUOVA versione "light"
per lo zoom lontano: stesso footprint del marker dettagliato, dettaglio appiattito.
Zoomando, il marker transiziona nella versione battesimata completa (incisioni, rune,
icona dipinta) — non voglio un object-swap, deve sembrare lo stesso oggetto che mette a fuoco.

Immagine 2 = crop di un POI quest: banda halo blu luminosa spessa attorno a un frame
ottone con cupola blu e iconcina dipinta dentro.

Obiettivo: rendere i POI PIÙ VISIBILI e PIÙ BELLI a questa distanza, restando coerenti
col linguaggio pittorico della mappa. Domande concrete:

1. La banda blu spessa funziona o sembra un anello UI neon incollato sul dipinto?
   Meglio più sottile? Altro colore? (ma quest=blu / job=verde deve restare distinguibile)
2. Il centro del marker si legge? L'iconcina è troppo piccola?
3. La "coda" a sud del marker (pin) fa il suo lavoro o serve rinforzarla?
4. Servirebbe un glow morbido / outline / altro trattamento più della banda piatta?
5. Come miglioreresti la transizione far→near (zoom = lo stesso oggetto che guadagna dettaglio)?

Dammi proposte concrete e ranked che un implementatore possa eseguire.
Se generi immagini, puoi anche mostrarmi varianti mockup direttamente.
```

## Note

- Critique già ottenuto via API (gpt-5.6-terra, one-shot): `gpt-hud-critique.md`
  — 5 punti: banda −25% e meno satura, bloom morbido non pulse, icona +20-30% avorio,
  coda sud più decisa, gerarchia per stato. Puoi incollarlo come secondo messaggio
  per discuterlo/ribattere.
- Brief precedenti: `gemini-light-answer-v2.md` (regole LOD light di Gemini).
- Il componente far-LOD è già montato live su /game (CSS `data-poi-zoom='far'`):
  `src/ui/idleVillage/components/poi/PoiZanara.tsx`, asset `poi-quest-light.webp`.

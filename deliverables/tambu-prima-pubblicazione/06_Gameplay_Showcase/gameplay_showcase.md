# Gameplay Showcase — scaletta video commentato + materiali aggiuntivi

## A. Video di gameplay commentato `[DA PRODURRE — max 500 MB, link non in elenco]`

**Durata consigliata:** 3–5 minuti. Registrazione dalla build pubblica `/game` con voiceover o sottotitoli IT. Registrare in 1440p o 1080p, landscape.

### Scaletta (storyboard)

| # | Scena | Cosa mostrare | Voce/testo |
|---|---|---|---|
| 1 | Boot → mappa | Schermata titolo, caricamento, reveal del continente dipinto | «Wanderlust: Triumph — un roguelite strategico-gestionale fantasy» |
| 2 | Mappa viva | Pan, zoom hi-res, ciclo giorno/notte, vita ambientale | «La mappa è dipinta a mano e viva: tempo reale, zoom, giorno e notte» |
| 3 | HUD e tempo | Controlli ×1/×2/×4, pausa, risorse, navigazione | «Il giocatore controlla il flusso del tempo e legge lo stato del mondo» |
| 4 | Villaggio | Vista insediamento dipinto, edifici, magazzino | «L'insediamento si sviluppa: edifici, magazzino, produzione» |
| 5 | Roster | Eroi, livelli, statistiche, vita/fatica | «Gli abitanti diventano eroi: attributi, livelli, ferite» |
| 6 | Quest POI | Drawer quest: requisiti, party slot, viaggio, rischi/ricompense | «Ogni missione dichiara requisiti e rischi prima dell'impegno» |
| 7 | Spedizione | Composizione party, bisaccia, conferma | «La spedizione è una scommessa calcolata» |
| 8 | Risoluzione | Finestra quest: fasi narrative, scelte, skill check, rapporto | «Le quest sono storie a nodi: scelte e conseguenze permanenti» |
| 9 | Eredità | Memoriale, reliquiario, menu salvataggi | «La morte è design: ogni caduto resta nella storia del mondo» |
| 10 | Chiusura | Mappa notte + logo/titolo | «Prepare. Endure. Triumph.» |

**Da dichiarare nel video:** cosa è già giocabile (tutto quanto sopra) vs cosa è in prototipazione (economia reale degli edifici, ondate di minacce complete, loop run→eredità end-to-end). Non presentare elementi mock come implementati.

## B. Build dimostrativa

- Link build web giocabile: `https://rpg-balancer.vercel.app/game` `[DA CONFERMARE: verificare build pubblica aggiornata prima dell'invio]`
- Il campo del form chiede «prototipo giocabile su PC Windows»: una build web è utilizzabile su qualsiasi PC con browser; valutare eseguibile Windows via Tauri come plus `[DA VALUTARE]`.

## C. Cartella «Altri materiali» (link)

Contenuto proposto della cartella cloud da linkare:

```
additional-materials/
├── screenshots/            (le 6 immagini di 07_Screenshots + extra)
├── gdd-summary.pdf
├── gameplay-video.mp4      (o link YouTube non in elenco)
└── README.txt              (link build, contatti, indice materiali)
```

## D. Screenshot selezionati (in `07_Screenshots/`)

| File | Rappresenta | Fonte | Note |
|---|---|---|---|
| 01-mappa-mondo.jpg | Mappa del mondo + HUD (giorno) | screenshot reale `/game` | pulito |
| 02-villaggio.jpg | Vista insediamento + HUD | screenshot reale `/game` | ⚠ pannello dev «DIRECTOR» visibile a destra → **ricatturare** prima dell'invio |
| 03-spedizione-planner.jpg | Planner quest: roster, party slot, rischi | screenshot reale `/game` | ⚠ barra staging «SUPERFICI» in basso a sx → **ricatturare** |
| 04-quest-rapporto.jpg | Quest + rapporto spedizione (vittoria) | screenshot reale `/game` | ⚠ tab «SELECT A TEST MARKER» sul bordo → **ricatturare** |
| 05-mappa-notte.jpg | Mappa di notte con illuminazione | screenshot reale `/game` | pulito |
| 06-menu-sessione.jpg | Menu sessione + lingua EN/IT | screenshot reale `/game` | pulito |

> I tre screenshot con elementi dev-only andrebbero ricatturati dalla build di produzione (gli overlay di staging non esistono in prod) o con staging nascosto. Nessuno è un mockup: sono tutti runtime reali.

---

## DECISIONE (2026-11-16)

Il video gameplay lo registra il **Director** quando sarà soddisfatto del risultato —
niente footage automatizzato. La scaletta sopra resta la traccia di montaggio.
Una bozza tecnica di registrazione automatizzata (`scripts/_tmp-video-walkthrough.mjs`)
esiste come riferimento di cosa è mostrabile, ma non va pubblicata.

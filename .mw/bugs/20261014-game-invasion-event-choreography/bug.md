# BUG — /game: la coreografia dell'evento Invasione Goblin non regge (5 difetti)

**Data:** 2026-10-14
**Prova:** registrazione schermo del Director, `~/Desktop/Registrazione schermo 2026-10-14 alle 09.11.35.mov` (11 s, 2856×1388).
**Segnalazione (verbatim Director):**

> 1) all'apertura ci sono i goblin sulla mappa (stiker), nn devono esserci (lo sticker)
> 2) quando premo l'evento nn c'è la transizione x cui i gobin nell'immagine diventano la versione "sticker" con una transizone adeguata
> 3) la mappa e il resto si muovono stranamento dp che premo il pulsante dell'evento
> 4) nn appare in alto il componente del registro degli eventi
> 5) il componente evento (che conteneva il goblin, ecc) nn si trasforma i una delle righe del componente del registro eventi e va "la dentro"

Precedente (stessa sessione): «l'evento che abbiamo in /game è completamente sbagliato … c'è un goblin enorme e uno piccolo» e, sul punto, «teca adesivo e quando si staccano e vanno in direzioni differenti».

## Cosa mostra il video (frame per frame)

Click su «Prepara le difese» → in ~0,5 s: le tende si aprono, il goblin della teca passa di colpo alla versione con bordo bianco, il registro compare in alto a destra, la mappa si ridimensiona due volte; poi la card svanisce, il goblin atterra sul bosco e dopo ~1 s il registro si richiude.

## Cause individuate (da codice, non ancora da fix)

| # | Causa | Dove |
|---|---|---|
| 2 | `goblinHidden={stickerDetached}` spegne le due immagini della teca nello stesso istante in cui monta l'adesivo: il distacco (`clip-path` 0,9 s) esiste ma non si vede mai. Il «pop» è il comportamento documentato (`context/GAME_INVASION_SEQUENCE.md` §3: «un solo goblin visibile in ogni fotogramma»). | `WorldSurfaceEventCard.tsx`, `GoblinInvasionWindow.tsx` |
| 3 | `safeFit` riserva il 60% della larghezza del registro quando `panels.visible.events` è vero. Il peek apre il registro (mappa si ri-inquadra) e lo richiude dopo 1 s (si ri-inquadra di nuovo). Anche l'ancora della card usa gli stessi inset. Il bersaglio dell'atterraggio si muove con la camera (misurato: marker 286→403 px in 8 s). | `game-frame-pixi.tsx:260`, `LEDGER_PEEK_MS` |
| 4 | Il registro è un «peek» da 1 s, per design (`GAME_INVASION_SEQUENCE.md` §5), non una destinazione della scena. | `game-frame-pixi.tsx` onComplete |
| 5 | Nessun legame card→riga: la card svanisce in dissolvenza (`showReminder={false}`) e il registro compare per conto suo. | `WorldSurfaceEventCard.tsx` |
| 1 | **Ambiguo, da confermare col Director.** Candidati: (a) `invasion_v1` salvato → il marker compare a ogni apertura anche senza evento; (b) lo sticker (bordo bianco) è già visibile quando le tende si aprono. | `game-frame-pixi.tsx:177-186` |

## Vincoli / storia

- Desiderata v2 (FROZEN): cinematica piena riservata agli eventi che minacciano il run (Invasione Goblin).
- PLAN-033; contratto `CTR-game-002` (freeze del clock durante il teatro); `context/GAME_INVASION_SEQUENCE.md`.
- `src/docs/docs/design/hud_component_guide.md:432`: il registro porta il conto alla rovescia, il promemoria in alto a destra è spento.

## Stato (2026-10-14) — tutti e 5 i punti chiusi

| # | Esito | Evidenza |
|---|---|---|
| 2 | **Corretto.** Il distacco della teca si vede (0,9 s); lo sticker prende il posto del goblin della teca alla fine, nella posizione/scala misurate. | Playwright headless, frame 150 ms: sticker a 717,446 contro goblin della teca 720,447; contact sheet in sessione. |
| 3 | **Corretto.** Il registro aperto dall'evento non entra più in `safeFit` (`ledgerFitIgnored`). | Marker fermo entro 4 px nello stesso giorno di gioco; spec `gameInvasionScene`. |
| 4 | **Corretto.** Il registro resta aperto (niente peek da 1 s). | BV-5 aggiornato + spec scena (riga visibile e ancora visibile dopo 2,5 s). |
| 5 | **Corretto (scelta A, FLIP con schiacciamento).** La card si ripiega sulla riga (276×43) e la riga prende il suo posto. | Frame: card 345×377 → 276×43 → riga visibile. |
| «goblin enorme + piccolo» | **Corretto** (13 ott.), ora con consegna card→marker. | Un solo goblin per frame in tutti i campioni. |
| 1 | **Corretto** (risposta del Director: «all'apertura della pagina vedo lo sticker goblin» → era il goblin ripristinato da `invasion_v1`). All'apertura non c'è nessun goblin: l'invasione non si ripristina e lo stato salvato viene cancellato. | Spec BV-4 «a reload opens a clean map»: dopo reload, 0 marker e `getInvasion()` nullo. |

Limiti dichiarati: la spec nuova passa con il codice nuovo, ma **non ho dimostrato che fallisca sul vecchio**. Il BV-5 vecchio sì, perché codificava il peek. Verifica visiva su un solo viewport (1440×900). Non ho visto il volo in tempo reale, solo frame a ~150 ms.

Test: `gameInvasionScene` (nuovo) + `gameInvasionMarch` 5/5 verdi; la run precedente delle altre 3 spec (Sequence, Freeze) era verde (12 test: 10 passati + i 2 aggiornati ora verdi).

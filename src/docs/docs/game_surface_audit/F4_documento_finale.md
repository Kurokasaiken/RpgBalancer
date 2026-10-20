# /game visto dal giocatore: audit, problemi di cattura, proposta con mockup, codice

**Data:** 2026-10-20 · **Autore:** audit Mind Weaver (explorer). Fasi F0–F2 in Sonnet, F1c–F4 in Opus. · **Stato:** documento, nessun codice di gioco modificato.

> **Come leggerlo.** Tre parti come richiesto: (1) problemi con gli screenshot, (2) come proporre i cambiamenti con mockup, (3) esempi di codice. Prima una sintesi di quello che abbiamo trovato. Ogni affermazione rimanda a una scheda con l'evidenza (screenshot, misura, riga di codice).
>
> **Legenda.** **FATTO** = visto o misurato · **FLAG** = gusto, decide il Director · **NON VERIFICATO** = detto esplicitamente.

> **Aggiornamento 2026-10-20 (R-234).** Ruling ricevuti: SC-1 A, SC-2 A (forma da rifare), QW-1 B (+ icone fuori stile), PL-3 A, HUD-1 A → `rulings/`. Nuovi: [mockup v2](mockups/fork-mockups-v2.html) (SC-2 A1/A2, icone barra I1/I2, lastre in alto H1/H2), [ri-audit HUD in alto](F3_scheda_hud_fissa.md#12-ri-audit-dopo-la-tua-segnalazione-r-234-2026-10-20) (nuova misura C5c: 9 controlli sotto i 22 px di respiro dalla cornice), [quest cinematica](F3_scheda_quest_cinematica.md), [Hero sheet / Mercante / Village](F3_scheda_herosheet_mercante_village.md), [inventario completo](INVENTARIO_elementi_giocatore.md). Nuovi difetti di correttezza: titoli sovrapposti nel Registro; BUY del Mercante illeggibile; Hero sheet sans/tricolore con 10 righe a zero; MENU con 11 px di respiro.

## Materiale

| File | Cosa contiene |
|---|---|
| [F0_inventario_e_stato.md](F0_inventario_e_stato.md) | Inventario, stato dei piani, ricerche web, criteri AAA approvati (§7.1) |
| [F1a_harness_e_misura.md](F1a_harness_e_misura.md) · [F1b_stato_armato_clock_contrasto.md](F1b_stato_armato_clock_contrasto.md) | Harness di cattura e strumento di misura |
| [F1c_lettura_visiva_skillcheck.md](F1c_lettura_visiva_skillcheck.md) · [F2_scheda_skill_check.md](F2_scheda_skill_check.md) | Skill check (scheda pilota) |
| [F3_scheda_questrunwindow.md](F3_scheda_questrunwindow.md) | Finestra della quest e barra in basso |
| [F3_scheda_poi_planner_roster_slot.md](F3_scheda_poi_planner_roster_slot.md) | POI, planner, roster, slot |
| [F3_scheda_village_stash.md](F3_scheda_village_stash.md) | Magazzino del villaggio |
| [F3_scheda_hud_fissa.md](F3_scheda_hud_fissa.md) | HUD fissa |
| [mockups/fork-mockups.html](mockups/fork-mockups.html) | 5 fork visivi A/B su baseline reali |
| `harness/*.txt` · `shots/` | Codice dell'harness e tutte le catture (1440×900, 1280×800, reduced-motion) |

---

## 0. Sintesi: cosa vede oggi il giocatore

### Difetti di correttezza (FATTO, non serve gusto per decidere)

| # | Dove | Difetto | Evidenza |
|---|---|---|---|
| 1 | Barra della quest | Piena al 100% in **fase 4 di 7** (run lenta), oppure **torna indietro 4 volte e chiude al 95%** (run veloce). 6 tacche a sesti uguali per 7 fasi. Il tuo punto 4 di R-231 non è risolto. | F3 QuestRunWindow §4, `series.json` |
| 2 | Cronologia fasi | «**−600 HP**», «−210 HP» con un eroe da 93 HP. Ipotesi: `recordAction` ri-somma i danni a ogni azione. | F3 QuestRunWindow §6.2 |
| 3 | Skill check | Quadrante **tagliato su 4 lati** a ogni viewport e stato | F1c §1, F2 §5 |
| 4 | Carta dell'esito | Riga **duplicata in 7 carte su 7**; verdetto mostrato due volte (finestra + carta) | F1c §8, F2 §4 |
| 5 | Planner | «OPEN WAREHOUSE» **trabocca** sul testo della bisaccia (bottone 26×26 px) | F3 POI/planner §6.1 |
| 6 | Swap degli slot | Il fantasma in volo mostra l'**ID interno** «slot-token:poi-goblin:…» | F3 POI/planner §6.2 |
| 7 | Roster | Badge «LV» copre i nomi; a 1280 **i nomi spariscono** nelle schede assegnate e i controlli della testata si sovrappongono | F3 POI/planner §10 |
| 8 | Stash | Capienza 12 nel pannello, 24 nell'edificio; a 1280 il pannello **esce di 17 px** dallo schermo | F3 Stash §5, §9 |
| 9 | HUD | **Cartiglio obiettivo mai visibile** su `/game`; badge Pannelli che conta i pannelli **chiusi**; focus ring e tooltip **di sistema**; Tab non visivo | F3 HUD §5 |
| 10 | Mappa | **La mappa del mondo spariva** dopo un check (errore Pixi `reading 'ids'`). Causa trovata dalla sessione dedicata: `DepthScene` chiude con `app.destroy(true)`, che in Pixi 8.22 libera il pool condiviso con la mappa. Fix + test sul branch `claude/eloquent-goodall-4d2bf1`, **non committati, non verificati da questo audit**. | F3 QuestRunWindow §7 |

### Le tue sei segnalazioni sullo skill check

| Segnalazione | Esito |
|---|---|
| «non abbastanza cinematografico» | **FLAG.** Il tiro sta in una colonna laterale da 340 px. La scena accanto non reagisce (1,5% di pixel cambiati durante lo spin). La sconfitta non ha messa in scena. In combattimento lo stesso rito si ripete 5 volte (≥ 40 s). |
| «sembra tagliato» | **FATTO**: sì, su 4 lati. |
| «si blocca al risultato» | **FATTO + tensione con un tuo ruling.** Nessun «Continua» per tua decisione (PLAN-043-S9 r003: «niente Continua da nessuna parte»). L'unico invito è una riga grigia da 12 px. Il blocco percepito viene da lì e dal congelamento. |
| «non ha il pulsante per lanciare» | **FATTO, sfumato.** Il pulsante c'è: è la stella al centro, senza etichetta, e appare dopo **4,1 s** di intro senza istruzioni. |
| barra in basso | **FATTO**: vedi difetto 1. |
| idle finale congelato | **FATTO, voluto**: gate BV-04 `settledIdle` di WS-4. **0 pixel cambiati in 3 s** nel quadrante, raggi fermi a metà spazzata, accanto a una scena viva. |

### Decisioni che spettano a te (tensioni registrate, nessuna risolta dall'agente)

1. «Niente Continua» (r003) contro «si blocca al risultato».
2. Gate BV-04 (0 ridisegni da parcheggiato) contro idle vivo. Fork SC-2.
3. Il Sigillo POI (PLAN-058) contro la regola 6b «niente cerchi con simbolo». Più il reveal dei POI già chiesto da te (S11, fork mai preparato).
4. Stash mock con quantità che non si muovono. Fork F-ST-1: registro vero o mock dichiarato.
5. Tema «Lacquer Atlas» ancora selezionabile dal menu, dopo la bocciatura del 2026-10-16.
6. Fame dal giorno 1 in tutte le run: pressione voluta o allarme da ignorare?
7. In combattimento il danno subito è **−12 per turno qualunque sia l'esito** (DEFEAT, VICTORY, TRIUMPH). È voluto?
8. PLAN-043-S11 è il «plan dei POI non finito»: fermo sulle tue decisioni D9.

---

## Parte 1 — Problemi con gli screenshot

Gli screenshot di questo progetto possono mentire in modi diversi. Qui ci sono quelli **incontrati davvero** in questo audit, con la soluzione adottata nell'harness.

### 1.1 Il renderer non è quello del giocatore

| # | Problema | Evidenza | Soluzione | Costo |
|---|---|---|---|---|
| S-1 | **Chromium headless di default non ha WebGL.** Pixi ripiega su `CanvasRenderer`: mappa, filtri e scene di profondità sono disegnati in un altro modo. Ogni screenshot fatto così (compresi quelli di `testing/quest_full_flow/`) può non essere ciò che vede il giocatore. | `getContext('webgl2') → false`; stack Pixi con `CanvasRenderer.render` | `--use-angle=metal` (WebGL su GPU reale, headless). Swiftshader sulle macchine senza GPU, **dichiarato** nel manifest. | basso |
| S-2 | **Frame rate headless basso** (5 fps con Canvas, 14–20 con Metal sul dev server). I tempi in frame non sono quelli di gioco. | contatore `data-astro-frames` | misurare in ms; per i frame usare il clock controllato (S-6) | — |

### 1.2 L'app cambia sotto la cattura

| # | Problema | Evidenza | Soluzione | Costo |
|---|---|---|---|---|
| S-3 | **Vite ricarica la pagina** quando un'altra sessione modifica `RICHIESTE.md`, `plans/*.md` o `*.jsonl`, perché `assetsInclude: ['**/*.md']` li rende moduli. | 5 `page reload` nel log in pochi secondi; `Execution context was destroyed` a metà run | `vite.audit.config.ts` con `watch.ignored` su md/jsonl/plans/context/.mw. Alternativa più forte: build + preview. | basso |
| S-4 | **Collisione di porta tra sessioni** (T-13). La sessione del bug mappa ha preso la 5191 del mio harness e le mie run hanno colpito il **suo** worktree. | `lsof` → vite di `.claude/worktrees/eloquent-goodall-…` | porta per sessione (`HARNESS_URL`, default 5197) e verifica del `cwd` del server prima di catturare | basso |
| S-5 | **Worktree vivo con ~480 file non committati.** La sessione dedicata non riproduceva il bug mappa nel suo worktree pulito, perché il bug stava nel codice non committato del checkout principale. | report della sessione «Mappa /game sparisce» | scrivere nel manifest il commit e lo stato del worktree; catturare la stessa revisione su cui si giudica | medio |

### 1.3 Il tempo

| # | Problema | Evidenza | Soluzione |
|---|---|---|---|
| S-6 | `animations: 'disabled'` di Playwright **non** ferma rAF né canvas. | ricerca web + prova | `page.clock` |
| S-7 | **`page.clock.install()` prima del boot rompe Pixi** (texture non caricate quando il tempo salta). | `TypeError … reading 'ids'` al primo `runFor` | install **tardivo** dopo che lo stato è raggiunto, poi `pauseAt` e `runFor`: 80→80 frame da fermo, +62–63 frame per secondo finto |
| S-8 | **Una sola immagine non prova né il movimento né l'immobilità** (T-04). | — | sequenze di frame + contatori dell'app + differenza di pixel tra frame (il congelamento è stato provato con `astroFrames` fermo **e** 0 px cambiati) |

### 1.4 Raggiungere lo stato giusto

| # | Problema | Evidenza | Soluzione |
|---|---|---|---|
| S-9 | **Premere Enter durante l'intro salta lo skill check.** Lo smoke F1a ha fotografato un check già risolto credendolo «armato». | timeline a 40 ms | driver che aspetta dopo ogni Enter e **rifiuta** di chiamare «armato» uno stato con verdetto |
| S-10 | **Stati che richiedono una run intera** (sconfitta, combattimento, rapporto): seed non controllabile (`Date.now() ^ Math.random()`). | `useQuestExpeditionSession.tsx:671` | giocare la run intera e registrare cosa è uscito; manca un seed di test |
| S-11 | **«Input reali» che non lo sono**: l'helper `dragResidentPointer` della suite R-183 imposta prima un hook. | `tests/utils/dragResident.ts:500-502` | drag **solo mouse** nell'harness: 4/4 riusciti, swap riuscito |
| S-12 | **Il velo di boot copre il primo frame** («Ready»). | `00-window-open.png` | attendere la scomparsa di `game-boot-screen` |

### 1.5 Quello che lo screenshot non vede

| # | Problema | Soluzione |
|---|---|---|
| S-13 | **Tooltip `title` nativi** invisibili in headless: avevo scritto «nessun tooltip» e ho dovuto correggermi | leggere gli attributi, non solo i pixel |
| S-14 | **Contenuto nel canvas** (POI, mappa, quadrante) non misurabile via DOM | solo pixel |
| S-15 | **Portal** (fantasma del token, tooltip) fuori dal box del componente | catturare la pagina con clip, non l'elemento |

### 1.6 Lo strumento di misura sbaglia

| # | Falso positivo | Correzione applicata |
|---|---|---|
| S-16 | C1 contava bottoni con icona **e** testo | solo icon-only |
| S-17 | C4 includeva SVG decorativi da 1293 px | solo ≤ 64 px |
| S-18 | C6 misurava lettere nascoste (opacità cumulata 0) | opacità degli antenati, ritaglio, copertura |
| S-19 | C1 leggeva icona + indicatore come fuori centro | classe `icon+indicator` separata |
| S-20 | Mio errore di copia: il PNG 1440 sovrascritto dal 1280 | cartelle per viewport |

### 1.7 Il caso che dimostra perché serve tutto questo

La mappa che spariva sembrava un artefatto di cattura: appariva solo a 1440 e solo in headless. Correlando console ed evidenze (4 run su 4 con l'errore = mappa sparita; 0 su 2 senza) è risultato un **bug reale del gioco**, e la sessione dedicata ne ha trovato la causa. Anche i miei giudizi «solo a 1440» e «nessun tooltip» erano sbagliati, e li ha corretti la stessa disciplina. **Ogni cattura deve portare con sé come è stata fatta**, altrimenti non si distingue il bug dal metodo.

### 1.8 Pipeline proposta (già implementata nell'harness)

1. Server dell'audit **isolato**: porta propria, config che non ricarica su doc e piani, `cwd` verificato.
2. Browser headless con **WebGL reale**. Backend scritto nel manifest.
3. Stato raggiunto con **segnali dell'app**, mai con attese fisse. Ogni scorciatoia via hook è dichiarata `hook-assisted`.
4. Per il moto: **clock tardivo** + sequenze + contatori + differenza di pixel.
5. **Misura C1–C9** dal DOM e dai pixel, con le classi di falso positivo note.
6. **Lettura visiva** da un modello forte (Opus) su ritagli ingranditi, separando FATTO da FLAG.
7. **Manifest per ogni PNG**: viewport, dpr, GL, reduced-motion, come è stato raggiunto lo stato, limite.

---

## Parte 2 — Come proporre i cambiamenti con i mockup

### 2.1 Il metodo (Visual fork gate v35, PLAN-047, applicato)

1. **Separare fatti e gusto.** Correttezza e regole già scritte (taglio, duplicati, contrasto, 6b, target) **non hanno bisogno di mockup**: si correggono e si verificano con l'harness prima/dopo. Il mockup serve solo dove ci sono ≥ 2 rappresentazioni materialmente diverse.
2. **Una card per decisione**, con:
   - la **baseline reale** (ritaglio dall'harness, non un ricordo);
   - **due opzioni** con la loro provenienza, nessuna raccomandata;
   - una **matrice di assi** in cui ogni opzione vince almeno un asse.
3. **Preview sui token veri**: harness HTML fuori dal codice di gioco (superficie #2), aperto in locale.
4. **Ruling** (`selected: A|B|null` + i tuoi vincoli verbatim) → **baseline congelata** (sha256) → implementazione → **stessa cattura dell'harness** sul selezionato. Il risultato si confronta con l'opzione scelta, non con la memoria.

### 2.2 Il mockup preparato

[`mockups/fork-mockups.html`](mockups/fork-mockups.html) (verificato a 1440 e 390 px: 0 errori JS, 0 scroll orizzontale) contiene 5 fork con baseline reale e opzioni A/B:

| Fork | Domanda | A | B |
|---|---|---|---|
| **SC-1** | Come si chiede il lancio | stella con etichetta incisa «LANCIA» + anello che respira + probabilità | l'intro finisce con una frase narrativa |
| **SC-2** | Dopo il verdetto | idle vivo e leggero (trasformazione CSS, nessun ridisegno del canvas; tocca BV-04) | il quadrante si sigilla con un gesto e poi resta fermo di proposito (compatibile con BV-04) |
| **QW-1** | Cosa vuol dire «barra piena» | barra di fasi: 7 segmenti, mai indietro | tempo reale con la scala che si allunga e lo sforo segnato a brace (fedele al tuo «2 min → 2 min») |
| **PL-3** | Pulsante del magazzino | icona + tooltip (come l'abbandono R-231) | pulsante a tutta riga sotto gli slot |
| **HUD-1** | Allarme cibo | brace sulla tessera scura | corallo con testo inchiostro |

### 2.3 Fork raccolti ma non ancora in mockup

| Da | Fork |
|---|---|
| F2 | F-1 dove vive il tiro (centro scena / colonna); F-3 combattimento (un tiro aggregato / tiri rapidi dopo il primo) |
| F3 QuestRunWindow | messa in scena del rapporto finale |
| F3 POI | F-POI-1 reveal del POI (già chiesto da te); F-POI-2 rischio nel planner (ritratti / riga aggregata) |
| F3 Stash | F-ST-1 natura (registro / mock dichiarato); F-ST-2 forma (scaffale / lista); F-ST-3 ciano `--skin-icon-accent` |
| F3 HUD | F-HUD-2 badge (via / eventi non letti); F-HUD-3 obiettivo (cartiglio / dentro la lastra del tempo) |

### 2.4 Ordine proposto (solo proposta)

1. **Correttezza senza fork** (nessun tuo ruling serve, salvo dove indicato): difetti 1–9 della sintesi, a partire da quelli che il giocatore vede in ogni run (barra, duplicato, quadrante, HP impossibili).
2. **Merge del fix mappa** dopo la sua verifica (sessione dedicata).
3. **Seduta di ruling** sui 5 fork del mockup + le tensioni 1–8.
4. Poi i fork rimanenti.

---

## Parte 3 — Esempi di codice

> Gli esempi della sezione 3.2 sono **schizzi ancorati al codice letto**, non patch provate: ognuno indica cosa verificare prima di applicarlo.

### 3.1 Harness di cattura (già funzionante, `harness/harness.mjs.txt`)

**Browser con WebGL reale, stato raggiunto da segnali dell'app**

```js
const gl = process.env.HARNESS_GL ?? 'metal';            // S-1
const browser = await chromium.launch({ headless: true, args: [`--use-angle=${gl}`] });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto(`${process.env.HARNESS_URL ?? 'http://localhost:5197'}/game`);   // S-4
await page.waitForFunction((pid) => Boolean(window.__idleVillageTestHooks?.expedition?.[pid]), 'poi-goblin');
```

**Clock tardivo: frame deterministici senza rompere Pixi (S-6, S-7)**

```js
await driveToArmedCheck(ctx);                          // in tempo reale fino al pulsante «Throw»
await page.locator('.da-tira').waitFor({ state: 'visible' });
await page.clock.install();                            // DOPO il boot: le texture ci sono già
await page.clock.pauseAt(new Date(Date.now() + 1e7));  // congela rAF, timer, Date
await page.clock.runFor(1000);                         // +62/63 frame, sempre gli stessi
```

**Provare un congelamento con due testimoni (S-8)**

```js
const a = await page.screenshot({ clip: board }); await page.waitForTimeout(3000);
const b = await page.screenshot({ clip: board });
// testimone 1: contatore dell'app      testimone 2: pixel cambiati
const frames = await page.evaluate(() => document.querySelector('[data-astro-frames]')?.dataset.astroFrames);
```

**Contrasto da pixel che ignora ciò che il giocatore non vede (S-18)**

```js
let op = 1, clipped = false;
for (let a = el; a && a !== document.documentElement; a = a.parentElement) {
  const s = getComputedStyle(a);
  op *= Number(s.opacity);
  if (s.visibility === 'hidden' || s.display === 'none') op = 0;
  // …centro dell'elemento fuori da un antenato con overflow ≠ visible → clipped
}
if (op < 0.15 || clipped) return;                                  // non visibile: non si misura
const hit = document.elementFromPoint(cx, cy);
if (hit && hit !== el && !el.contains(hit) && !hit.contains(el)) return;   // coperto
```

**Drag solo mouse, nessun hook (S-11)**

```js
await page.mouse.move(from.x, from.y); await page.mouse.down();
await page.mouse.move(from.x + 12, from.y + 6, { steps: 3 });     // supera la soglia di attivazione
for (let i = 1; i <= 14; i++) await page.mouse.move(from.x + (to.x - from.x) * i / 14, from.y + (to.y - from.y) * i / 14, { steps: 2 });
await page.mouse.move(to.x + 1, to.y); await page.mouse.move(to.x, to.y);   // l'ultimo tick di collisione vede il target
await page.mouse.up();
```

### 3.2 Schizzi di fix per i difetti di correttezza

**Difetto 4 — riga duplicata nella carta (`QuestSkillCheckColumn.tsx:278-287`)**

La carta stampa `outcomeText` (che contiene già la frase e l'HP in prosa) **e** `authoredText`. La guida quest §4 vieta l'HP in prosa.

```tsx
const showOutcome = check.outcomeText && !(check.authoredText && check.outcomeText.includes(check.authoredText));
{showOutcome && <p …>{check.outcomeText}</p>}
{check.authoredText && <p …>{check.authoredText}</p>}
```

*Meglio ancora, alla fonte:* l'engine espone `harmLines` separate (`ResolvedCheck`, guida §2). La carta mostra `flavor` + `authoredText`, e l'HP va solo sul canale visivo. Verificare con `questRunWindow.test.tsx` + harness `run-fullrun`.

**Difetto 3 — quadrante tagliato (kit `destinyAstrolabeV6/astrolabe.css`)**

Il CSS del kit è un layout **a pagina intera**: `.scene-col{flex:0 0 65%}`, media query sulla larghezza del **viewport** (`max-width:1100px` → `min-height:90vh`). Montato in una colonna da 340 px, la scena esce dal riquadro (`scene-col` 402×411 in 340×340). Il kit è congelato, quindi l'override va nel contenitore ospite:

```css
/* QuestSkillCheckColumn: il kit si adatta al contenitore, non al viewport */
[data-testid="quest-check-board"] { container-type: size; }
[data-testid="quest-check-board"] .destiny-astrolabe .suite { flex-direction: column; height: 100%; }
[data-testid="quest-check-board"] .destiny-astrolabe .scene-col { flex: 1 1 auto; min-height: 0; width: 100%; }
[data-testid="quest-check-board"] .destiny-astrolabe .arena { inset: 0; width: 100cqmin; height: 100cqmin; margin: auto; }
```

Da verificare: che la palla e l'arco restino coerenti (`honestTargetPos`) con il canvas ridimensionato, a 1440/1280/720 di altezza.

**Difetto 1 — barra della quest (`QuestRunWindow.tsx:1549` `TimeBar`)**

Il fix dipende dal fork **QW-1**. Entrambe le opzioni garantiscono «mai piena prima della fine, mai indietro».

```ts
// Opzione A — progresso di fasi (monotono per costruzione)
const phaseProgress = (completed: number, total: number, fracInCurrent: number) =>
  Math.min(1, (completed + Math.min(1, Math.max(0, fracInCurrent))) / total);

// Opzione B — tempo reale con scala che si allunga (mai > 1 prima della fine)
const timeProgress = (elapsed: number, declared: number, remainingEstimate: number, ended: boolean) =>
  ended ? 1 : elapsed / Math.max(declared, elapsed + Math.max(1, remainingEstimate));

// In entrambi i casi, nel componente: non scendere mai sotto il valore già mostrato
const shown = useRef(0);
shown.current = Math.max(shown.current, progress);
```

Le tacche: una per fase reale (7 per il goblin), posizione dal boundary di fase (`questPhaseCheckpoints` con `readyAt`, come chiede PLAN-062 C3), non `i / 6`.

**Difetto 2 — HP impossibili (`questS1Lab/questPhaseRecord.ts:66-82`)**

`recordAction` aggiunge a ogni azione **tutti** i `checkQueue[].harms` e i `recentHarms` dello stato corrente, senza confrontarli con lo snapshot `before` (a differenza di `log` e `loot`).

```ts
// RunSnapshot: aggiungere le chiavi dei danni già contati
export const snapshotRun = (run: QuestRunState): RunSnapshot => ({
  logLength: run.log.length, loot: [...run.loot], flags: [...run.flags],
  harmKeys: new Set(currentHarms(run).map(harmKey)),
});
const harmKey = (h: HarmEvent) => `${h.memberId}:${h.hpBefore}:${h.hpAfter}:${h.kind}`;
// recordAction: solo i danni nuovi
const freshHarms = currentHarms(after).filter((h) => !before.harmKeys.has(harmKey(h)));
harms: [...phase.harms, ...freshHarms],
```

*Prima di tutto un test rosso* (red-first): un combattimento di 5 turni da −12 deve dare `hpLostByMember` = 60, non 600. Verificare che `HarmEvent` non abbia già un id stabile (meglio di una chiave composta).

**Difetto 5 — «OPEN WAREHOUSE» (`QuestExpeditionDetail.tsx:~905`)**: fork **PL-3**. Con l'opzione A:

```tsx
<Tooltip.Root delayDuration={180}>
  <Tooltip.Trigger asChild>
    <button type="button" data-testid="quest-open-stash" aria-label={t('gameFrame.village.openStash')}
      style={{ width: 'var(--skin-hud-control-lg, 36px)', height: 'var(--skin-hud-control-lg, 36px)' }}>
      <EngravedIcon id="ico-warehouse" size={18} />
    </button>
  </Tooltip.Trigger>
  <Tooltip.Portal><Tooltip.Content side="top">{t('gameFrame.village.openStash')} · V</Tooltip.Content></Tooltip.Portal>
</Tooltip.Root>
```

(`--skin-hud-control-lg` e `ico-warehouse` sono **nomi proposti**: verificare i token e i glifi esistenti in `skinCssVariables.ts` / `engravedIcons.tsx` prima di usarli.)

**Difetto 6 — ID grezzo nel fantasma dello swap**: il testo coincide con `slotTokenDragId` (`ResidentSlotRack.tsx:294`). Il componente che lo dipinge **non è stato localizzato**. Primo passo: cercare chi rende `active.id` durante un drag `slot-token:*` (overlay dnd-kit o cursore di gioco). Il fallback giusto è già nel ghost (`initials`).

**Difetto 9 — focus ring di sistema**: una regola nello scope HUD (sui token, nessun letterale):

```css
.skin-scope :where(button, [role="button"], [role="radio"], a):focus-visible {
  outline: none;
  box-shadow: 0 0 0 1.25px var(--skin-hud-seat), 0 0 0 3px var(--skin-title-color);
}
```

**Difetto 9 — badge Pannelli (`HudPanelsMenu.tsx:21`)**: oggi `hiddenCount`. Fork F-HUD-2: toglierlo, oppure contare ciò che chiede attenzione (eventi non letti).

**Difetto 10 — mappa che sparisce**: già fixato dalla sessione dedicata sul branch `claude/eloquent-goodall-4d2bf1`. Il principio: chi distrugge un'applicazione Pixi secondaria non deve liberare le risorse globali condivise con la mappa (in Pixi 8 `destroy(true)` le include). Leggere il diff di quella sessione prima di applicare qualunque variante qui.

---

## 4. Revisione `objective_critic` di questo documento

1. **BIAS** — tutte le run usano la quest goblin, il party del `demoLaunch` (eroe singolo) o 4 residenti, e una partita nuova. Nessuna quest «rovine», nessun villaggio avviato, nessuna morte.
2. **UNSUPPORTED** — gli schizzi 3.2 non sono stati eseguiti. Il CSS del quadrante in particolare può rompere la coerenza palla/verdetto.
3. **RISK** — il worktree cambia sotto l'audit (S-5). Le schede valgono per lo stato del 2026-10-20 e vanno ricatturate dopo l'atterraggio delle sessioni parallele (PLAN-053, 062–064).
4. **ASSUMPTION** — «il giocatore percepisce X» (fame, stash, blocco) è inferenza: è scritta come FLAG, non come fatto. Un playtest vero la confermerebbe o la smentirebbe.
5. **CONTRADICTION evitata, ma da tenere d'occhio** — le schede dichiarano «correttezza» alcuni punti che toccano decisioni registrate (BV-04, r003, Sigillo). Sono stati spostati nelle tensioni (§0), dove decide il Director.

## 5. Non verificato (globale)

- Build di produzione e Tauri.
- Audio.
- Tastiera completa e screen reader (oltre all'ordine di Tab).
- it-IT.
- 1920 e 2560 px.
- Steam Deck reale.
- Quest diverse dal goblin.
- Stati POI diversi da *available*.
- Percorso overlay dello skill check.
- Morte di un membro.
- Il fix della mappa (sessione dedicata, non verificato qui).
- L'esecuzione degli schizzi di codice.

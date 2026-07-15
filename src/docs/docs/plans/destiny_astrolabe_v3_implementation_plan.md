# Destiny Astrolabe V3 — Implementation Plan

> Skill check spaziale 2D (radar-chart gameplay) — sostituisce il banale D100 a barra.
> Stato: **IMPLEMENTATO (slice verticale F0→F4) — 2026-07-15.**
> Riscrittura completa da zero (gli stub generati dagli agent il 2026-07-14 non erano funzionanti).
> Verificato: 25 test unitari (Monte Carlo aree, near-miss 5%, landing∩zone, determinismo) + run end-to-end in browser (roll 13 → zona star → VICTORY).
> Resta per iterazioni successive: audio reale (hook già presenti), dev-overlay % aree, perf pass formale con performance.mark.
> Owner: Fausto · Redatto con analisi UI/UX AAA + ricerca di settore (fonti in fondo).

---

## 0. Decisioni vincolanti (concordate)

| # | Decisione |
|---|-----------|
| D1 | **Risoluzione = D100 pre-calcolato sotto il cofano** (modello "1A"). La pallina è messa in scena: la traiettoria viene *sintetizzata* per atterrare nella zona coerente col risultato. La messa in scena deve essere credibile al punto da essere indistinguibile da fisica reale. |
| D2 | **Ferita e Morte restano tiri separati**, ma diventano **zone spaziali visibili** con dimensione ∝ probabilità. Se l'esito è "successo + ferito", la pallina DEVE fermarsi in un punto che è contemporaneamente dentro la stella E dentro la corona ferita (le zone si intersecano). Il punto di atterraggio è sempre la prova visiva dell'esito completo. |
| D3 | **Spesa oggetti: solo placeholder API** in questa iterazione. Progettare l'interfaccia (tipi, eventi, punti di aggancio) ma NON costruire l'inventario. Vedi §7. |
| D4 | **Si crea una V3** (`destinyAstrolabeV3/`). Engine TypeScript hand-authored (niente pipeline HTML→gen-engine). L'estetica è l'**evoluzione della V1** (ghiera bronzo, obelischi, stella d'avorio, materia pittorica) — NON lo stile minimal della V2. Dalla V2 si recupera solo: architettura engine pulita, palette da skin token, starfield parallattico. |
| D5 | **Massimo 5 assi.** La logica di riempimento esistente NON si tocca: 1 stat → tutti e 5 gli assi = quella stat; 2 stat → 3 assi = stat1, 2 assi = stat2; ecc. |
| D6 | **La decelerazione della pallina è il cuore del gioco.** Suspense-first: vedi §6 (tre atti, slow-motion a soglia, near-miss, hit-stop). |
| D7 | **Near miss = fallimento entro il 5% della soglia.** Se la probabilità di successo è 50% e il roll cade tra 51 e 55, l’esito è un near miss (§6). In geometria V3 corrisponde a una banda di confine di 5% normalizzato attorno alla zona di successo. Niente ratio arbitrario: la frequenza emerge naturalmente dalla probabilità. |
| D8 | **Gli obelischi si rifanno da zero.** Non più monoliti neri rettangolari: diventano cristalli di ossidiana affilati, asimmetrici, con rim bronzo/azurro e label ancorate su placche laterali (§3). |

---

## 1. Diagnosi della V1 attuale (cosa si corregge)

1. **Flashbang d'avorio**: la stella brucia 3 stop di gamma; gli obelischi neri spariscono dentro di essa. → Cap di luminanza, glow interno non bloom.
2. **Proporzioni statiche**: stat identiche nel TestHub → stella sempre simmetrica → il giocatore non può scoprire che la forma è data-driven. → Geometria = funzione pura + TestHub con default asimmetrici.
3. **Ferita/Morte come testo**: percentuali in legenda = D100 travestito. → Zone geometriche con area ∝ probabilità.
4. **Quattro rossi in competizione** (bordo blob, corona, legenda, THROW). → Palette a canali semantici esclusivi (§4).
5. **Pallina invisibile e spin troppo corto**: il momento di massima tensione dura meno del tempo di reazione umano. → §6.
6. **RESOLUTION copre la prova**: la fog dorata nasconde il punto di atterraggio nel momento esatto in cui serve. → Camera focus sulla pallina, banner che non copre l'arena.
7. **Sfondo piatto** (gradiente liscio). → Materia pittorica: `public/assets/ui/bg.png` (olio) + velatura teal + starfield parallattico.
8. **Obelischi anonimi** (rettangoli neri uguali). → Forme affilate e asimmetriche, material pittorico, label su placche laterali, animazione di calata in stagger.

---

## 2. Architettura dei moduli

```
src/ui/idleVillage/components/destinyAstrolabeV3/
├── engineV3.ts          # orchestratore canvas: timeline, draw loop, state machine
├── geometry.ts          # FUNZIONI PURE: input valori → poligoni/zone. Nessun side effect.
├── zones.ts             # classificazione punto→zona, calcolo aree, validazione proporzioni
├── simulation.ts        # sintesi traiettoria pallina (esito pre-rollato → percorso credibile)
├── timelineV3.ts        # fasi, durate, easing (config-driven, Zod)
├── palette.ts           # lettura --skin-* token (riuso pattern readPalette V2)
├── modifiers.ts         # placeholder API spesa oggetti (§7) — SOLO interfacce + eventi
├── DestinyAstrolabeV3.tsx  # host React: overlay, THROW, label, tooltips, risultato
└── astrolabe-v3.css     # stili overlay (skin-token driven)

src/pages/minimal-destiny-astrolabe-v3.tsx   # route TestHub
tests/unit/destinyAstrolabeV3/               # geometry, zones, simulation (deterministici)
```

**Regole architetturali (dalle Windsurf rules, non negoziabili):**
- Config-first: durate, percentuali, soglie, copy → moduli config validati Zod. Zero magic numbers nel draw loop.
- Colori SOLO da `--skin-*` token via `applySkinCssVariables` (mai hex hardcoded nei componenti React; l'engine legge i token a runtime come fa `readPalette` in V2).
- i18n: ogni stringa via `useTranslation`, namespace `idleVillage`.
- Un canvas solo, l'engine lo possiede; testo nitido (verdetti, label, numeri) nel layer React.

### 2.1 `geometry.ts` — il contratto centrale

```
GeometryInput = {
  stats: AstrolabeSkill[]      // 1..5, espansi a 5 assi con la logica esistente (D5)
  difficulty: number
  critPct: number              // fallimento critico
  woundPct: number
  deathPct: number
}

GeometrySnapshot = f(GeometryInput)  // PURA, deterministica
  ├── challengePolygon: Path        // perimetro sfida (contenimento pallina)
  ├── playerStar: Path              // stella avorio, vertice i ∝ stat asse i
  ├── woundCrown: Band              // corona cremisi, spessore ∝ woundPct
  ├── deathVoids: Disc[]            // voragini viola nei valli, area totale ∝ deathPct
  ├── critBand: Band                // bordo rovina, spessore ∝ critPct
  ├── nearMissBand: Band            // banda di confine 5% per atterraggi dramatici
  └── zoneMap                       // partizione completa per point-lookup
```

- **Interpolabile**: `lerpGeometry(A, B, t)` per il morph animato quando un valore cambia (oggetti spesi, preview). Tween ~300ms ease-out-cubic.
- **Proporzionalità onesta**: doppio critPct → banda spessa il doppio. Con **clamp minimo di leggibilità** (una zona al 2% non può essere invisibile: min 3px visivi, e in dev-mode un overlay mostra la % reale calcolata dall'area per audit).
- **Near-miss band**: `nearMissBand` è una banda metrica di spessore 5% della distanza normalizzata dal centro al confine della stella. Serve a `simulation.ts` per decidere se dramatizzare il percorso e a `zones.ts` per classificare `near-miss` come sottoclasse del fallimento.
- Vincolo: la stella non può eccedere il perimetro sfida; difficoltà alta comprime tutto verso il centro (il pentagono nero "schiaccia" la stella).

### 2.2 `zones.ts`

- `classify(point) → 'star' | 'near-miss' | 'crown' | 'void' | 'ruin' | 'crit'` — point-in-polygon (ray casting) + test banda/disco. `near-miss` è un sottocaso del fallimento: punto fuori dalla stella ma dentro la `nearMissBand`.
- `zoneAreas(snapshot)` — campionamento montecarlo in dev/test per verificare che area visiva ≈ probabilità dichiarata (test unitario con tolleranza). Includere un test specifico che la frequenza di `near-miss` campionata sia coerente con il 5% teorico entro ±1.5%.
- Usato sia dalla simulazione (scegliere il punto di atterraggio) sia dalla RESOLUTION (illuminare la zona che ha catturato la pallina).

### 2.3 `simulation.ts` — messa in scena onesta del D100 (D1)

Pipeline per ogni lancio:
1. Il gioco rolla D100 + tiri ferita/morte → esito completo (es. "fallito + ferito").
2. `pickLandingPoint(esito, zoneMap, rng)`: scegli un punto DENTRO l'intersezione di zone coerente con l'esito (es. rovina ∩ corona ferita). Distribuzione uniforme nella zona. Se l'esito è un fallimento e la zona interseca la `nearMissBand`, punteggia i punti in base alla distanza dal confine della stella e ne sceglie uno il più vicino possibile al bordo (senza attraversarlo) per rendere credibile il near miss. Se invece l'esito è pulito, scegli un punto interno alla zona, lontano dai confini per evitare ambiguità.
3. `synthesizeTrajectory(landingPoint, rng)`: genera il percorso all'indietro/in avanti — lancio veloce, 2-4 rimbalzi sul perimetro sfida (riflessione + attrito), spirale decelerante, homing finale invisibile solo negli ultimi N px. Seed RNG per determinismo nei test.
4. Il draw loop riproduce la traiettoria; la fisica percepita è reale perché i rimbalzi rispettano davvero le normali del poligono.

**Anti-smascheramento**: velocità iniziale e direzione variano a ogni lancio; il homing non corregge mai in modo visibile (correzione distribuita su tutta la spirale, non sull'ultimo frame); nessun percorso identico ripetuto.

---

## 3. Composizione visiva (evoluzione V1, non V2)

Layer (dal fondo):
1. **Materia**: `bg.png` (pittura a olio) clippata nel disco + velatura teal scuro in `multiply` + grana `oil-grain.png` leggera. La base NON è un gradiente liscio.
2. **Starfield parallattico** (dalla V2): 3 layer di profondità, tilt col puntatore, stelle oro+ciano twinkle.
3. **Light-leak** azzurro da alto-sinistra (firma V9) + vignettatura da lente sul bordo interno ghiera.
4. **Superficie Sfida**: ossidiana opaca, bordo NON rosso — inciso bronzo scuro con normali visibili (è un muro, non un neon). Nasce dal centro (§5).
5. **Stella d'avorio**: luminanza cappata (mai sopra il 70% del bianco pieno), gradiente interno caldo, bordo definito. I lobi DEVONO essere visibilmente diseguali con stat diseguali.
6. **Corona ferita** (cremisi/sangue): banda lungo il perimetro della stella, spessore ∝ woundPct. Unico rosso in scena.
7. **Voragini morte** (viola spettrale): dischi nei valli tra le punte; *assorbono* luce (lente scura + nucleo violaceo), non la emettono.
8. **Banda rovina critica**: bordo esterno della sfida, grigio-fumo denso ∝ critPct. La rovina semplice è l'ossidiana stessa: il vuoto non brilla.
9. **Obelischi** — cristalli di ossidiana affilati, uno per asse, posizionati sul perimetro sfida. Forma asimmetrica e inclinata leggermente verso il centro; non rettangoli, ma facce sfaccettate con bordi taglienti. **Rim bronzo scuro + azurro** (`--skin-icon-accent`) lungo gli spigoli, con riflesso che cambia con la luce. **Label** `ATLETICA — 65` su una placca metallica laterale o su una base circolare, mai galleggiante sopra l'obelisco. **Animazione**: calano in `threat-slam` in stagger leggero da diverse altezze, non compaiono istantaneamente. Ombre morbide sotto la base per ancorarli al terreno.
10. **Pallina**: scintilla energetica GRANDE (≥ 2.5× l'attuale), nucleo bianco-oro, coda cometa con motion trail persistente (fade ~400ms), sempre sopra ogni layer.
11. **THROW**: unico attore oro caldo. Gerarchia colore finale: **oro = azione tua · avorio = tua forza · cremisi = carne · viola = morte · ossidiana = rovina · teal = mondo**.

---

## 4. Palette semantica (skin token)

| Semantica | Token (fallback) | Regola esclusiva |
|---|---|---|
| Azione giocatore | `--skin-icon-color` oro | Solo THROW + pallina |
| Forza giocatore | `--skin-text-primary` avorio | Solo stella |
| Ferita | nuovo token `--skin-status-wound` (cremisi) | Solo corona |
| Morte | nuovo token `--skin-status-death` (viola) | Solo voragini |
| Rovina | `--skin-surface-base` ossidiana | Sfida + banda crit (fumo) |
| Mondo | teal + `--skin-icon-accent` azure | Sfondo, stelle, rim obelischi |

Nuovi token registrati nello `skinConfigRegistry` (regola: mai colori fuori dal sistema skin).

---

## 5. Timeline & animazioni (config-driven)

| Fase | Durata target | Cosa succede |
|---|---|---|
| `ring-lock` | 0.6s | Arena vuota, solo materia+stelle. Le superfici NON esistono (scala 0). |
| `threat-slam` | 0.9s | La Sfida nasce da un punto e si espande **ease-out-back** fino ai raggi di difficoltà; ripple nella materia pittorica all'impatto; obelischi calano in stagger. |
| `agency-burst` | 1.1s | La stella nasce dal centro; i lobi si estendono **in stagger, i dominanti per primi** (il giocatore vede la propria forza allungarsi verso gli assi giusti), ease-out-back con overshoot leggero. |
| `risk-pour` | 0.8s | Corona e voragini si materializzano con dimensioni ∝ probabilità (la corona "sanguina" lungo il bordo, le voragini si aprono come gorghi). |
| `action-trigger` | gated | THROW pulsa. Fase di preparazione: qui il giocatore (futuro) spende oggetti e VEDE il morph §7. |
| `the-spin` | 3.5–4.5s | Tre atti, vedi §6. |
| `magnetic-snap` | 0.25s | Hit-stop: freeze 80–120ms + micro-shake + la zona che cattura la pallina lampeggia del proprio colore. |
| `resolution` | — | **Niente fog sopra l'arena.** Zoom/focus camera sulla pallina inchiodata; la zona catturante resta illuminata; banner verdetto in fascia alta o bassa, arena sempre visibile. Testo esito coerente con la zona (i18n). |

**Onboarding contestuale** (prime N=3 aperture, poi mai più; persistito via PersistenceService): micro-tooltip sincronizzati con la nascita di ogni elemento — "La tua forza: più alta la statistica, più il lobo si allunga" / "Corona cremisi: se la scintilla si ferma qui, resti ferito" / "Voragini: caduta letale". Niente muri di testo.

`SKIP` e `prefers-reduced-motion` onorati (salto diretto a snap+resolution).

---

## 6. The-Spin: ingegneria della suspense (D6 — sintesi ricerca)

Struttura a **tre atti** (totale 3.5–4.5s, mai identico):

1. **Lancio (0.8–1.2s)** — velocità alta, 2–4 rimbalzi reali sul perimetro sfida, energia caotica. Suono: whoosh + tick metallici sui rimbalzi. Velocità iniziale randomizzata a ogni lancio (pattern roulette: mai due spin uguali).
2. **Caccia (1.2–1.8s)** — decelerazione per attrito, la spirale si stringe; la camera fa un push-in del 5–8%; **il suono si spegne progressivamente** (lezione BG3: la suspense è silenzio, non crescendo). Il trail della pallina si allunga.
3. **Verdetto (0.8–1.2s)** — **slow-motion a soglia** (pattern del brevetto roulette: entro distanza X dalla destinazione il tempo scala a 0.4–0.5×); la pallina *flirta* con il confine sbagliato prima di scivolare in quello vero:
   - **near miss** (fallimento entro 5% della soglia per D7, cioè roll ∈ ]soglia, soglia+5]) → sfiora la punta della stella, la tocca quasi, scivola fuori nel buio. La traiettoria punta a terminare nella `nearMissBand`, il più vicino possibile al bordo della stella senza attraversarlo visibilmente;
   - esito successo netto → lambisce la corona cremisi, il cuore si ferma, poi rotola dentro l'avorio (near-win liberatorio);
   - esito successo ampio → la pallina entra nella stella con decisione, nessun flirting;
   - esito morte → traiettoria che sembra salvarsi e viene *risucchiata* dal gorgo viola (le voragini possono avere un leggero pull visivo negli ultimi px).

   **Regola anti-assuefazione**: il near-miss **non è un ratio arbitrario** — è la conseguenza naturale della `nearMissBand` 5% (D7). La ricerca (Kassinove & Schare 2001; Côté et al. 2003) indica che ~25–30% di near-miss sui non-win è lo sweet spot; una banda del 5% in un D100 produce tipicamente un 2–5% di near-miss totali, ben al di sotto del limite e quindi non riconoscibile come pattern. Se playtest mostra che è troppo raro, si amplia la banda configurabile, non si forza un ratio.
4. **Hit-stop** al contatto finale (freeze 80–120ms, micro-shake 2–3px, flash della zona) — poi resolution.

Fondamento: il picco di dopamina è nell'**anticipazione**, e il near-miss è più motivante della vittoria stessa — per questo il tempo va speso nella decelerazione, non nell'esplosione finale.

---

## 7. Placeholder API spesa oggetti (D3 — spec, NON costruire)

Contratto che l'inventario futuro aggancerà:

```
// modifiers.ts — SOLO tipi + eventi, zero UI inventario
AstrolabeModifier = {
  id: string
  target: 'stat' | 'difficulty' | 'crit' | 'wound' | 'death'
  axisIndex?: number          // se target='stat'
  delta: number               // es. -5 wound, +30 stat
  source: { kind: 'item' | 'buff' | 'blessing', refId: string }  // aggancio inventario
}

AstrolabeV3Handle (aggiunte):
  previewModifier(m)   → morph GHOST: nuova geometria in outline tratteggiato sopra l'attuale (il giocatore vede il delta PRIMA di confermare)
  applyModifier(m)     → morph reale 300ms (lerpGeometry) + aggiornamento label/percentuali
  revokeModifier(id)   → morph inverso
  onModifiersChanged(cb)
```

- Nel TestHub V3: pannello dev con slider/bottoni fake-item che chiamano questa API (dimostra il morph senza inventario).
- Config Zod per i limiti (clamp stat 1..99, percentuali 0..60, ecc.).
- Quando l'inventario nascerà, dovrà solo mappare item → `AstrolabeModifier` e chiamare `previewModifier`/`applyModifier` (drag di un item sullo slot = preview; drop = apply). Nessun'altra superficie da toccare.

---

## 8. Performance & ottimizzazione (budget <16ms/frame)

- **Layer caching**: materia+velatura+vignetta → renderizzate UNA volta su offscreen canvas e blittate; ridisegno per-frame solo di starfield (cheap), superfici (solo se in morph), pallina+trail.
- **Path2D cache**: i poligoni si ricostruiscono SOLO quando la geometria cambia (morph/resize), mai per frame.
- **Vietato nel hot path**: `ctx.filter` (SVG filter = killer di frame — era il problema del `fluidWobble` V1), `shadowBlur` per-frame su path complessi (i glow si pre-cuociono in gradienti o sprite), allocazioni nel draw loop (array riusati).
- DPR-aware con cap a 2×; resize via ResizeObserver debounced.
- `performance.mark` in dev per fase; budget per layer documentato nel codice.
- Determinismo: RNG seedato iniettabile → snapshot test delle traiettorie.

---

## 9. Fasi di lavoro (per gli agent Windsurf) + acceptance criteria

| Fase | Contenuto | Acceptance |
|---|---|---|
| **F0 — Fondamenta** | Scaffold dir/route/page; `geometry.ts` + `zones.ts` puri con test unitari (proporzionalità aree, clamp leggibilità, lerp, logica 5-assi D5 riusata) | `npm test` verde; test montecarlo area≈probabilità entro tolleranza; zero UI ancora |
| **F1 — Materia** | Backdrop (bg.png+velatura+starfield+leak+vignetta) con layer caching; superfici sfida+stella con nascita animata e morph | 60fps stabile (perf mark); screenshot con stat asimmetriche mostra stella asimmetrica |
| **F2 — Rischio leggibile** | Corona, voragini, banda crit ∝ probabilità; palette semantica + nuovi skin token; **obelischi rifatti** (forma affilata, placche label, rim bronzo/azurro); onboarding tooltip; dev-overlay % | Cambiando wound/death/crit nel TestHub il disegno cambia visibilmente in <300ms; obelischi riconoscibili e non invadono la stella; niente testo-percentuale in legenda |
| **F3 — La pallina** | `simulation.ts` (landing point, traiettoria, **near-miss 5%**), tre atti, slow-mo a soglia, hit-stop, sound hook a stadi | Roll 52 su soglia 50 → pallina ferma nella `nearMissBand` esterna alla stella, verificato da test; esito "successo+ferito" → pallina in stella∩corona; spin mai identico (seed diversi) |
| **F4 — Resolution & polish** | Camera focus, zona illuminata, banner non coprente, i18n completa, SKIP/reduced-motion, placeholder modifiers API + pannello dev, perf pass finale | Safeguards (lint, test, build:check) + evidence log in `test-results/`; run completo verificato in browser |

Ogni fase = PR indipendente, ordine obbligato F0→F4.

---

## 10. Rischi & mitigazioni

| Rischio | Mitigazione |
|---|---|
| Homing smascherabile (D1) | Correzione distribuita sulla spirale; rimbalzi con normali vere; near-miss come banda 5% naturale, mai ratio forzato; mai ultimo-frame-snap |
| Zona piccola illeggibile vs onestà proporzioni | Clamp minimo visivo + dev-overlay con % reale; sotto soglia, la zona pulsa per farsi notare |
| Morph geometria costoso | Path2D rebuild solo su cambio input; lerp su array di vertici pre-allocati |
| Regressione estetica "V2 minimal" | Ogni PR include screenshot confrontati con V1; la ghiera/obelischi/materia V1 sono il canone |
| Stat identiche nel TestHub nascondono le feature | Default TestHub ASIMMETRICI (es. 80/65/50/35/20) |

---

## A. Parametri di default e vincoli scelti

Tutti i valori sono **configurabili** via Zod e dovrebbero essere esposti nel TestHub V3 per iterare senza ricompilare.

| Parametro | Default scelto | Rationale |
|---|---|---|
| `nearMissBand` | 5% della distanza normalizzata centro–stella | L’utente ha richiesto: fallimento entro 5% della soglia (es. soglia 50, roll 52). Produce ~2–5% di near-miss totali, ben al di sotto del 25–30% sweet spot della ricerca, quindi non riconoscibile. |
| `the-spin` | 3.5–4.5s (variabile ±0.5s per seed) | UK Gambling Commission suggerisce 2.5–5s come game-cycle minimo per slot; studi su bet-to-outcome mostrano 3–5s come range tipico. Roulette live: 22–24s ball-landing, ma include betting. 3.5–4.5s è sufficiente per 3 atti di suspense senza logorare il ritmo. |
| `slowMoScale` | 0.45× | Pattern brevetto roulette: entro distanza X dalla destinazione il tempo scala a 0.4–0.5×. Valore medio sicuro. |
| `slowMoDistance` | 15% del raggio arena | Soglia per entrare in slow-mo: abbastanza presto per percepirlo, non così presto da appesantire. |
| `hitStopFreeze` | 100ms | Compromesso tra “sentito” e “non bloccante”; regolabile 80–120ms. |
| `cameraPushIn` | 6% | Push-in 2D (canvas scale/translate) durante la caccia; 5–8% è la fascia proposta, 6% è il centro. |
| `TestHub stats` | 80 / 65 / 50 / 35 / 20 | Default asimmetrici per mostrare la stella data-driven; nessun check rimane invisibile. |
| `DPR cap` | 2× | Bilancia nitidezza e fill-rate su retina/mobile; ResizeObserver debounced. |

**Nota sul tempo totale**: `the-spin` è solo la fase di rotazione della pallina. Il round completo (ring-lock → resolution) sarà più lungo, ma `SKIP` e `prefers-reduced-motion` lo riducono a snap+resolution.

---

## Fonti ricerca

- Near-miss & frequenza ottimale: [Kassinove & Schare 2001 — 30% near-miss sweet spot](https://www.researchgate.net/publication/11921597_Effects_of_the_Near_Miss_and_the_Big_Win_on_persistence_at_slot_machine_gambling) · [Côté et al. 2003 — 27% near-miss persistence](https://pmc.ncbi.nlm.nih.gov/articles/PMC7214505/) · [Daly et al. — 25% vs 50% non-win near-miss](https://repository.stcloudstate.edu/cgi/viewcontent.cgi?article=1135&context=agb) · [Wikipedia — Near-miss effect](https://en.wikipedia.org/wiki/Near-miss_effect)
- Arousal da near-miss: [Dixon et al. 2011 — Psychophysiological arousal signatures](https://uwaterloo.ca/reasoning-decision-making-lab/sites/default/files/uploads/files/DixHarJarFugShe_2011.pdf)
- Spin speed & responsible design: [UK Gambling Commission — minimum 2.5s game cycle](https://www.gamblingcommission.gov.uk/manual/online-games-design-and-reverse-withdrawals/summary-of-responses-introducing-speed-of-play-limits) · [Slot Spin Cycle Time Explained](https://www.topgamb.com/slot-spin-cycle-time-explained/) · [Tempo in EGMs — 400ms/1700ms/3000ms BOI study](https://akjournals.com/downloadpdf/view/journals/2006/1/3/article-p135.pdf)
- Roulette deceleration/timing: [Roulette Physics — ball deceleration & time-of-fall](https://www.dewtronics.com/projects/roulette/documents/roulette[1].pdf) · [Roulette Nest — Speed Roulette round timing](https://www.roulettenest.com/live-speed-roulette) · [Baravla — roulette animation](https://baravla.com/en/animation-of-a-spinning-roulette-wheel/) · [USPTO 9582958](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/9582958)
- BG3 dice feel: [DualShockers](https://www.dualshockers.com/baldurs-gate-3-bg3-d20-dice-rolls/) · [PC Gamer](https://www.pcgamer.com/i-love-that-baldurs-gate-3-makes-you-roll-a-die-for-big-decisions/)
- UI readability: [Justinmind](https://www.justinmind.com/ui-design/game) · [Wayline](https://www.wayline.io/blog/game-ui-ux-design-best-practices-and-examples) · [Pixune](https://pixune.com/blog/game-ui-design/)
- Radar chart per stat: [Code Monkey](https://unitycodemonkey.com/video.php?v=twjMW7CxIKk) · [Data School — caveat leggibilità](https://www.thedataschool.co.uk/harvey-joyce/radar-charts-101/)

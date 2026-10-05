---
title: World Surface — Reactive Artifact Plan (no full-canvas parallax)
status: Draft
owner: Strategy-Lead
created: 2026-08-17
desiderata: .mw/desiderata.md v2 — World Surface: mappa viva da esplorare con gli occhi
---

# World Surface — Piano del manufatto reattivo

## 0. Verdetto in una riga

La critica di ChatGPT conferma e rafforza la contro-proposta di `world_surface_v3_critique_and_counterplan.md`: **la mappa non deve muoversi — deve rispondere**. Il linguaggio vincente non è il parallasse, ma una *illustrazione statica che prende vita solo quando il giocatore la interroga*. Il piano seguente traduce i 12 punti della critica in 6 fette verticali eseguibili, ancorate allo stato reale del repo.

---

## 1. Cosa dice la ricerca online

Precedenti AAA e giochi da tavolo digitale confermano la direzione:

- **Hearthstone boards** (Blizzard, GDC 2015 / blog ufficiali): le tavole da gioco sono pitture statiche con micro-aree interattive, easter egg e reazioni a click; l'animazione è rara e localizzata. Questo è il riferimento stilistico più vicino al progetto.
- **Dynamic Dungeons / Battlemaps.games**: mappe per tabletop con loop video e token. Dimostrano che *token fisici su mappa statica* comunicano profondità senza parallasse, ma richiedono asset costosi. Non replicabile 1:1 in uno slice, ma il pattern "token che attraversa la carta" è valido.
- **PortalInk (UIST 2024)**: parallasse vettoriale 2.5D funziona solo con SVG e layer separabili, non con texture PNG full-canvas di 4240 px — conferma empirica del fallimento CSS.
- **Mapimator / EnGarde**: mappe tattiche animate usano frecce disegnate, fasi temporali e marker che si muovono. Confermano che l'*informazione strategica* può essere disegnata sulla mappa in stile cartografico.

Conclusione della ricerca: **niente parallasse, tutto reattivo**. La mappa di World Surface funziona meglio come *manufatto magico sul tavolo* che come finestra immersiva.

---

## 2. Valutazione dei 12 punti di ChatGPT

### 2.1 Allineamento con il progetto

| Punto della critica | Allineamento | Nota |
|---|---|---|
| 1. Mare reveal / fondale | 🟢 forte | Sostituisce l'acqua ondulata e il ripple UV. Compatibile con DisplacementFilter Pixi o con overlay SVG mascherato. |
| 2. Profondità illustrata (desat/foschia) | 🟢 forte | Non richiede asset nuovi, solo shader/colore su regione selezionata. |
| 3. Regioni che respirano | 🟢 forte | Coerente con Pillar 1 "respiro globale" e 80/15/5. |
| 4. Vita del mondo (uccelli, fumo, bandiere) | 🟡 da filtrare | Troppo tutto insieme crea rumore. Va inserito nel catalogo biomi/POI, non globale. |
| 5. Strade come informazione | 🟢 forte | Core del gameplay idle / strategia. Token / route drawing è il vero sostituto del parallasse. |
| 6. Token come parallasse | 🟢 forte | Trasforma la mappa in strumento. Richiede che il drag & assign esistente generi un token. |
| 7. Ombre dinamiche | 🟢 forte | Molto economico. Nuvola → ombra scolorita = 1 overlay. |
| 8. Discovery drawn-on | 🟢 forte | Perfetto per roguelite / esplorazione. Richiede pipeline ink/SVG disegnato. |
| 9. Tempo rappresentato sulla mappa | 🟡 attenzione | `DayNightPOI` esiste. Non filtrare fullscreen, ma tingeri i biomi. |
| 10. Inchiostro vivo | 🟢 forte | Tratta UI come parte dell'illustrazione. Condivide linguaggio con il cerchio magico del POI quest. |
| 11. Focus mode | 🟢 forte | Sostituto del pan/zoom: gerarchia visiva senza muovere camera. |
| 12. 4 categorie + 6 priorità | 🟢 forte | Fornisce ordine di priorità e budgeting percettivo. |

### 2.2 Punti di forza della critica

- La metafora **"manufatto sul tavolo"** è più forte del parallasse per il target estetico di *Prismatic Wanderlust*.
- La divisione **Ambient / Strategic / Discovery / Event** dà un modello mentale chiaro per i tier di presentazione.
- I **6 effetti prioritari** sono scelti in base al rapporto impatto/costo; nessuno richiede asset dipinti separabili per layer.
- **"Staticità → evento → breve vita → ritorno alla staticità"** è esattamente la curva di attenzione che il Pillar 1 chiede.

### 2.3 Tensioni da risolvere

1. **Pillar 1 usa la parola "parallasse"**. Il piano precedente ha già dimostrato che il parallasse CSS non funziona. La critica propone di sostituirlo con *reactive depth*. Va chiesta esplicita riscrittura del Pillar o si tratta il parallasse come *"parallasse semantico dei token / luci / ombre"*.
2. **"Sopra il mondo, non dentro il mondo"**. La desiderata v2 dice *"mondo da esplorare con gli occhi"*. Questo piano mantiene l'esplorazione con gli occhi, ma da una posizione di *stratega sopra la mappa*. Non è in contraddizione, ma è un reframe che il Director deve avallare.
3. **"Inchiostro vivo" richiede paintover / asset nuovi**. La desiderata v6 FROZEN consente paintover. Va confermato che gli asset di inchiostro (pennellate, glifi, frecce) possono essere generati via paintover o SVG/CSS, e non con immagini bake.
4. **Discovery reveal disegnato**. Questo introduce un nuovo tipo di transizione animata. Va inserito nello skin system o creato come nuovo frozen kit.

---

## 3. Il nuovo modello: Mappa come manufatto magico

### 3.1 Principio direttivo

> La mappa rimane fisicamente ferma. La pittura reagisce quando il giocatore la osserva o la tocca.

### 3.2 Quattro categorie di animazione

| Categoria | Quando | Cosa fa | Budget percettivo |
|---|---|---|---|
| **Ambient** | Sempre, rarissimo | Acqua, nuvole, ombre, fumo lento, uccelli occasionali | 90% calma |
| **Strategic** | Interazione | Highlight regione, route, token, focus mode, pericoli | 8% attenzione |
| **Discovery** | Mondo cambia | Nuova regione, rovine, risorse, informazioni rivelate | 1.5% sorpresa |
| **Event** | Evento grosso | Invasione, villaggio attaccato, catastrofe | 0.5% impatto |

### 3.3 Le sei priorità (P0)

| # | Effetto | Tecnica probabile | Perché |
|---|---|---|---|
| 🥇 | **Acqua con reveal del fondale** | Pixi `DisplacementFilter` + maschera per zona di hover/esplorazione | Dà profondità senza muovere la camera. |
| 🥈 | **Token / spedizioni sulla mappa** | SVG/CSS animato: icona + ombra + bandierina lungo path | Trasforma la mappa in strumento strategico. |
| 🥉 | **Nuvole / ombre che passano sul terreno** | Overlay gradiente o sprite con maschera, 1-2s | Vita senza rumore. |
| 4 | **Fiumi con micro-riflessi animati** | Piccole strisce bianche/azzurre che scorrono sul percorso | Quasi gratis, grande effetto. |
| 5 | **Discovery drawn-on** | SVG `stroke-dashoffset` o Pixi `Graphics` tratto per tratto | Perfetto per esplorazione. |
| 6 | **Regione selezionata che "si risveglia"** | Saturazione/luminosità/contorno pittorico + particelle locali | Legge l'interazione. |

### 3.4 Cosa NON fare (P0)

- Tilt 3D CSS / parallasse per layer full-canvas baked (già falsificato). Micro-parallasse di overlay atmosferici e sprite separabili ammessa in autonomia/lab.
- Acqua ondulata continua con UV ripple non profilato.
- Particelle ovunque / glitter generici.
- Animazioni continue su alberi, case, bandiere, fuochi (rumore).
- Filtro fullscreen day/night.

---

## 4. Fette verticali

Ogni fetta finisce con qualcosa che si guarda (contro-proposta `Slice 0–5`).

### Fette 0 — Verità a terra (prerequisito)

Risolve gli artefatti che rendono impossibile il resto. Non è design, è igiene.

- Rimuovere `layers.backup-predilation/` e `source/` da `public/` (~51 MB).
- Pipeline PNG → AVIF/WebP con dimensione max lato < 4096 px.
- Pinnare `preference: 'webgl'` in Pixi.
- Strumentare HUD frame-time p50/p95, DPR, conteggio texture, memoria.
- Cancellare o redirezionare `/world-surface-v3`; `/world-surface` è la mappa.

**Uscita:** un numero misurato che fissa il budget di ogni fetta successiva.

### Fette 1 — Acqua + fiumi (Effetto #1 e #4)

- `WorldSurfaceSeaReveal`: overlay acqua con maschera circolare/irregolare che si chiarisce al dwell del puntatore (no click).
- `WorldSurfaceRiverGlint`: 2-3 strisce bianche/azzurre animate lungo i tracciati dei fiumi, ciclo 4-6s.
- Entrambi in Pixi, sopra l'`<img>` statico, con fail-safe DOM.

**Uscita:** il Director guarda e vede acqua viva senza cuciture e senza muovere layer.

### Fette 2 — Token / route (Effetto #2 e #5-in-parte)

- Quando una spedizione parte, disegnare una linea cartografica (SVG `path`) da villaggio a destinazione.
- Piccolo token con icona + ombra + bandierina si muove lungo la linea.
- All'arrivo: `puff` + alone + icona si stabilizza.
- Token disegnato a mano, stile pezzo da tavolo.

**Uscita:** una spedizione visibile sulla mappa come informazione strategica.

### Fette 3 — Ombre + nuvole (Effetto #3)

- Sprite nuvola che attraversa la viewport o una regione.
- Ombra proiettata sotto: regione leggermente più scura e meno satura per 1-2s.
- Campione su montagne, foreste, villaggi.

**Uscita:** volume e tempo atmosferico senza animare il terreno.

### Fette 4 — Region focus + breathe (Effetto #6)

- Al click/hover intenzionale di una regione: saturazione +3%, luminosità +2%, bordo più definito, piccola ombra sotto il label, particelle locali rare (farfalle/uccelli).
- Altre regioni: -5% luminosità (focus mode).
- Durata 600-900ms, non continuo.

**Uscita:** gerarchia visiva e "quella parte della mappa è importante".

### Fette 5 — Discovery drawn-on (Effetto #5)

- Quando una spedizione arriva, i nuovi dettagli compaiono come se qualcuno li disegnasse sulla carta.
- SVG `stroke-dashoffset` per tratto → tratto → dettaglio completo.
- Applicabile a rovine, tane, villaggi abbandonati, risorse.

**Uscita:** il giocatore vede la mappa aggiornarsi, non un pannello a scomparsa.

### Fette 6 — Living ink per eventi (ponte con Tier Event)

- Invasione: linea rossa disegnata sulla mappa, poi icona ⚔ appare.
- Evento run-threatening: pennellata più marcata, ma sempre cartografica.
- Riutilizzare il linguaggio del cerchio magico del POI quest (iscrizioni che si scrivono).

**Uscita:** la UI diventa parte dell'illustrazione.

---

## 5. Decisioni richieste al Director

1. **Avallo del reframe**: la mappa è un *manufatto sul tavolo*, non una *finestra immersiva*? Se sì, si riscrive Pillar 1 §22 sostituendo "parallasse" con "reactive ink/depth".
2. **Le sei priorità diventano P0?** Se sì, le fette 1-6 sono lo scope iniziale.
3. **Asset per inchiostro**: si generano con paintover (desiderata v6 FROZEN) o con SVG/CSS puro? Per le fette 1-4 si può fare in CSS/SVG; fette 5-6 probabilmente richiedono pennellate generate.
4. **Token = miniatura medaglia del resident?** Il drag del roster già esiste. Si riusa il medaglione come token sulla mappa, o si fa un token stilizzato separato?

---

## 6. Vincoli e salvaguardie

- **Config-first:** tutte le costanti di durata, opacità, colore, soglia hover vivono in `IdleVillageConfig` / nuovo `WorldSurfaceReactiveConfig` Zod.
- **i18n:** nessuna stringa hardcoded; namespace `idleVillage`.
- **Skin system:** nessun `.css` standalone; preset in `skinConfigRegistry`.
- **Performance:** ogni fetta misurata con HUD frame-time; niente nuova fetta prima che la precedente sia sotto budget.
- **Safeguards per fetta:** `npm run lint`, `npm run build:check`, `npm run test -- idleVillage`, `npm run kanban:lint`.
- **Documentazione:** ogni fetta produce o aggiorna un doc in `src/docs/docs/plans/`, entry in `COMPONENT_MASTER_INDEX` se tocca un frozen kit.

---

## 7. Riferimenti

- `.mw/desiderata.md` v2 — World Surface: mappa viva.
- `DESIGN_PILLARS.md` §Pillar 1.
- `world_surface_v3_critique_and_counterplan.md` — contro-proposta e fette verticali.
- `world_surface_v3_tactical_plan.md` v2.2 — piano precedente (da consultare per catalogo tier eventi e biomi).
- `src/ui/idleVillage/worldSurface/` — scaffold V3 (da redirezionare o cancellare).
- `src/ui/idleVillage/pages/WorldSurfacePage.tsx` — mappa reale (`/world-surface`).
- `src/ui/idleVillage/components/WorldSurfaceSeaRipple.tsx` — precedente displacement (da sostituire con reveal).

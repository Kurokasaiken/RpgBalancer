# “Il Drago” – Documento di Direzione Artistica

**Status:** Draft v0.2  
**Ambito:** Linee guida di art direction per il progetto “Il Drago”, focalizzate sullo stile **Realismo Eroico Classico (Noble Heroic Realism)** e allineate con i principi config-first del RPG Balancer.

---

## 0. Missione Creativa – “Libertà, Gloria e Trionfo Solare”

- **Manifesto:** antitesi del Dark Fantasy; luce tropicale, cromie sature e materiali nobili che raccontano la vittoria.
- **Direzione per le razze:**
  - **Umani (Eroi/Bruiser)** – anatomia monumentale nello stile *Huang Guangjian*, proporzioni atletiche autentiche.
  - **Razze Superiori (Elfi, Angeli, Androidi)** – resa iridescente e luminosa stile *Ruan Jia*, quasi “creature di luce”.
  - **Natura e Mostri** – energia narrativa à la *Justin Gerard / Jesper Ejsing*: giungle dense, creature vive e serie.
- **Rendering:** pennellate stratificate stile *Jaime Jones*. Ombre sature di turchese/smeraldo, highlights solari. La “Sorgente di Verità” rimane il prompt originale del Drago.
- **Stack creativo di riferimento:** React + Vite + Tailwind CSS v4, SVG per i token, Framer Motion per animazioni “pesanti”, LaTeX unicamente per formule tecniche.

---

## 1. Filosofia Visiva – “Il Tavolo del Comando”

| Principio | Linee Guida |
| --------- | ----------- |
| **Strumenti Fisici di Precisione** | L’interfaccia deve sembrare un set di strumenti nobili e tattili sopra il tavolo di un sovrano o di un generale. Niente HUD digitali o overlay translucent: ogni elemento è un oggetto fisico con peso visivo. |
| **Ordine sopra il Caos** | Evitare dark fantasy sporco o elementi deteriorati. Tutto comunica disciplina, manutenzione perfetta e controllo strategico. |
| **Precisione Geometrica** | Prediligere forme simmetriche, architetture classiche, cerchi astronomici, stelle polari. Evitare silhouette organiche o asimmetriche non giustificate. |
| **Gerarchia Tattica** | Layout centrato su assi rigidi (verticale/orizzontale), con colonne e medaglioni che riflettono la catena di comando. |

---

## 2. Palette Materica – I Quattro Pilastri

| Materiale | Utilizzo | Note di resa |
| --------- | -------- | ------------ |
| **Oro Zecchino & Satinato** | Cornici, rilievi, indicatori di successo. | Resa metallica con bevel e specchiature morbide; usare gradienti radiali per simulare riflessi fisici. |
| **Avorio Levigato** | Campi testuali, superfici leggibili, cuori dei medaglioni. | Rimpiazza il bianco piatto. Texture leggerissima tipo marmo lucidato. |
| **Acciaio Brunito / Argento** | Aghi, puntatori, indicatori meccanici. | Contrasto freddo rispetto all’oro; usare micro-incisioni lineari per suggerire precisione. |
| **Ossidiana & Basalto** | Fondali profondi, basi delle console. | Non nero piatto: gradienti sottili e highlight vitrei per richiamare pietra lucidissima o catrame ribollente. |

**Regole operative:**

1. Nessun colore “puro” senza riferimento al materiale (es. niente #FFFF00 piatto).
2. Gli highlight vanno sempre coerenti con una singola fonte di luce incontrastata.
3. Gli stati (hover/active) modificano la lucentezza del materiale, non il suo colore base.

---

## 3. Elementi Iconici della UI

### 3.1 HeroMarker (Bruiser umano) – Nuovo componente base

- **Forma:** medaglione ellittico (5:3) in bronzo brunito con doppio bevel; stiletto centrale in acciaio lucido che perfora la mappa e proietta ombra obliqua.
- **Iconografia:** bassorilievo del Bruiser (stile Huang Guangjian) con incisioni radiali; background in avorio satinato con pattern geometrici.
- **Materiali:** bronzo (#8f5a2c→#d6a35f), acciaio (#cdd6df), avorio (#f2ebdb) e gemma smeraldo per lo stato eroico.
- **Animazioni:** Framer Motion per pulsazione dell’anello luminoso, micro-oscillazione verticale dello stiletto, drop shadow dinamica.
- **API prevista (`HeroMarker`):**

  ```ts
  type HeroMarkerProps = {
    label: string;
    state: 'idle' | 'engaged' | 'exhausted';
    orientation?: 'north' | 'south' | 'east' | 'west';
    glowIntensity?: number;
  };
  ```

- **Config-first:** palette e proporzioni derivano da `themeTokens.ilDrago.heroMarker`; silhouette vettoriali caricate via asset config.

### 3.2 Map Markers (Skyrim Map-style Tactical Pins)

Dettagli principali:

- **Forma:** Medaglioni dell’ordine, stelle a otto punte, bussole astronomiche.
- **Anatomia:** Testa tridimensionale + stiletto con ombra proiettata; sembra perforare pergamena o carta cerata.
- **Materiali:** Oro satinato per i pin principali, argento/brunito per pin secondari; base in avorio con incisioni.
- **Interazione:** Lo stato selezionato accende un alone ambrato (energia solare) e amplia l’ombra per simulare pressione verso il basso.

### 3.3 VerbCards / VerbTokens

Dettagli principali:

- **Design:** Cerchi metallici pesanti con anelli di luce ambrata che indicano progresso o cooldown.
- **Scalabilità:** La micro versione funziona come gettone sulla mappa; la versione espansa mantiene la stessa gerarchia (anello esterno = stato, nucleo = icona tattica).
- **Stati:** Idle (acciaio brunito), attivo (oro vivo + luce pulsante), blocco/fatica (ossidiana con incisioni rosse sottili).

### 3.4 Ciclo Giorno/Notte (Astrolabio)

Dettagli principali:

- **Concetto:** Strumento meccanico in oro e ossidiana; il tempo ruota tramite dischi interconnessi, non tramite barre digitali.
- **Indicatori:** Lancette in argento lucido, finestrelle che mostrano percorso solare/lunare.
- **Animazione:** Rotazione lenta e continua con scatti impercettibili che ricordano un orologio astronomico reale.

---

## 4. Tipografia e Rigore Visivo

| Uso | Font | Indicazioni |
| --- | ---- | ----------- |
| **Titoli / Display** | Cinzel (all caps, tracking +8/+12) | Devono sembrare incisi: usare letter-spacing ampio, ombre interne minime e rilievi oro/avorio. |
| **Body / Copy** | Crimson Text | Serif classico leggibile, ideale per descrizioni tattiche e log. |
| **UI Microcopy** | Lato o alternativa geometrica sobria | Usata solo per tooltips o label tecnici a dimensioni ridotte. |

**Allineamento:**  

- Layout basato su assi perfettamente centrati; colonne speculari dove possibile.  
- I blocchi principali devono poter essere inscritti in figure geometriche semplici (cerchi, rettangoli aurei).  
- Nessun bordo arrotondato stile mobile moderno: usare angoli netti con smussi micro (<4px) solo per simulare tagli di pietra.

---

## 5. Prompt Base per Generazione Asset (AI)

### 5.1 Oggetti / Icone

> *“Top-down view of a [OGGETTO], crafted in polished ivory and framed in beveled gold. High fantasy heroic realism, medieval noble style, clean surfaces, sharp edges, studio lighting on black background, 8k resolution, photorealistic materials, ancient but perfectly maintained.”*

### 5.2 Texture

> *“Seamless texture of dark liquid obsidian, viscous like tar, with sharp specular highlights, no purple, deep black tones, noble and ominous, professional game asset style.”*

**Pipeline raccomandata:**

1. Prompt → generazione referencia fotorealistica.
2. Annotare materiali, incisioni e fonti di luce.
3. Reinterpretare in vector o pittorico controllato per mantenere coerenza interna.

### 5.3 Key Art / Panorami Cinematici

> *“A majestic ancient dragon perched on an overgrown marble ruin in a lush tropical jungle. The dragon has iridescent emerald and gold scales, inspired by the realism of Jeff Easley (AD&D). The lighting is bright tropical sunlight with deep, rich shadows. Style: Hand-painted digital art, oil painting brushstrokes, heroic realism. Color palette: vivid turquoise, lime green, bright orange flowers, polished bronze. High detail, epic scale, serious adventurous tone.”*

Utilizzare questo prompt come riferimento principale per hero splash, illustrazioni narrative e fondali panoramici (Theater View, loading screen, sezioni editoriali).

---

## 6. Cosa Evitare

- ❌ Gothic/Horror: niente teschi, sangue, ossa fratturate.
- ❌ Barocco sovraccarico: evitare decorazioni eccessive che confondono la gerarchia.
- ❌ Moderno/Flat: no angoli arrotondati stile app mobile, niente gradienti neon o glassmorphism.
- ❌ Fantasy generico economico: niente legni rovinati, ferro arrugginito, icone stock.
- ❌ Saturazioni violente: mantenere tutto su scala di materiali reali, mai colori “digitali” puri.

---

## 7. Applicazione Practica & Governance

1. **UI Toolkit:**  
   - Introdurre token dedicati (`goldBevel`, `ivoryPlate`, `obsidianGlass`) in `src/styles/color-palette.css`.  
   - Creare componenti condivisi (es. `CommandMedallion`, `AstrolabeClock`) in `src/ui/components/heroicRealism/`.

2. **Config-First Binding:**  
   - Le palette e i marker devono leggere configurazioni da `src/balancing/config/themeTokens.ts` (nuovo file) per mantenere il principio “zero hardcoding”.

3. **Deliverable iniziali (Fase 0.1):**
   - Moodboard con esempi materiali e riferimenti storici.
   - Kit di icone principali (map marker, verb token, indicatori tempo) esportati sia come SVG vettoriali sia come reference 3D/shaded.
   - Aggiornamento di `docs/MASTER_PLAN.md` con riferimento a questo documento.

4. **Hand-off / QA:**
   - Ogni nuova schermata deve passare un check contro la checklist “Tavolo del Comando” (peso materico, simmetria, materiali corretti).
   - I test visivi (Storybook/Chromatic) devono verificare la resa dei materiali con light/dark backdrop.

---

## 8. Collegamenti
- **Master Plan:** aggiungere sezione dedicata all’art direction “Il Drago”.
- **Documenti correlati:** `idle_village_plan.md`, `idle_village_art_style_plan.md` (per compatibilità con Gilded Observatory) e `GILDed_OBSERVATORY_STYLE.md` (sezione tema base).

---

## 9. Prossimi Step Proposti

1. **Fase 1 – Moodboard & Token Set (1 giorno):** raccogli referenze, crea token materiali.
2. **Fase 2 – Component Library (2 giorni):** implementare marker, verb token, astrolabio con props configurabili.
3. **Fase 3 – Applicazione UI (ongoing):** integrare i nuovi componenti nelle schermate target (mappe, roster, pannelli strategici).
4. **Fase 4 – QA & Documentazione:** snapshot visivi, aggiornamento guida colori/tipografia.

Il completamento di queste fasi garantirà coerenza visiva e manutenzione semplificata per tutte le feature “Il Drago”.

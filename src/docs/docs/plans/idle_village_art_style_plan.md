# Idle Incremental RPG – Art Style & Visual Direction

**Status:** Draft v0.1  
**Scope:** Linee guida di art direction per l'*Idle Incremental RPG* (village meta + idle autobattler) coerenti con il tema UI **Gilded Observatory** e con i vincoli da solo dev.

---

## 1. Obiettivi di Art Direction

- **Chiarezza prima di tutto:** il giocatore deve distinguere a colpo d’occhio:
  - founder vs worker normali,
  - personaggi sani vs feriti vs morti,
  - building critici (cibo, housing, difesa, meta),
  - slot jobs/quest disponibili vs occupati.
- **Mood "grim cozy":** villaggio sotto pressione ma abitabile.
  - Non cartoon iper-saturo; non grimdark realistico.
  - Un “boardgame cupo ma leggibile” più che un RPG anime.
- **Coerenza con Gilded Observatory:**
  - Palette e linee devono funzionare bene accanto alla UI esistente (card, pannelli, typography) senza sembrare un altro gioco.
- **Pipeline sostenibile da solo dev:**
  - 2D vector art semplice, riusabile, facciata coerente tra mobile e desktop.
  - AI usata solo per concept/moodboard, non come asset finali misti.

---

## 2. Camera, Composizione e Scala

### 2.1 Vista del Villaggio

- **Vista scelta (v0.1):** top-down leggermente stilizzata.
  - Edifici visti dall’alto con proiezione semplice (no vera prospettiva isometrica).
  - Personaggi visibili come “pedine” animate che si muovono tra slot/edifici.
- **Motivazioni:**
  - Allinea bene con l’idea di *mappa di boardgame*.
  - È leggibile anche su schermi piccoli (PWA mobile) senza eccessivo dettaglio.

### 2.2 Scala e Densità

- **Personaggi:**
  - Devono restare riconoscibili a ~32–48 px su mobile.
  - 3–4 silhouettes base distinte (founder, worker generico, ferito, eventuale eroe raro).
- **Edifici:**
  - Forme semplici + icona chiara per funzione (es. ruota per mulino, insegna per taverna, arma/scudo per training).
  - Evitare dettagli inutili che “si impastano” a bassa risoluzione.

---

## 3. Palette, Luce e Coerenza con Gilded Observatory

### 3.1 Palette di Riferimento

- La UI usa già:
  - **Obsidian backgrounds:** neri/blu molto scuri.
  - **Slate borders:** grigi freddi.
  - **Ivory text:** testi chiari caldi.
  - **Teal accents / Gold highlights:** accenti principali.
- **Regole per la mappa di gioco:**
  - **Terra / Strade:** toni marrone/terra leggermente desaturati.
  - **Vegetazione:** 2–3 toni di verde non troppo saturi.
  - **Edifici base:** legno + pietra su scala neutra (grigi/marroni) con piccoli accenti teal/oro per gli edifici meta/importanti.
  - **UI in-world (icone, badge sopra token):** usare gli stessi teal/oro della UI Gilded Observatory.

### 3.2 Luce e Ombre

- **Luce direzionale semplificata:**
  - fonte luce fissa (es. alto-sinistra) per tutte le ombre.
  - ombra corta e soft per edifici/personaggi, per dare un minimo di profondità.
- **No shading realistico:**
  - niente highlight complessi o rendering volumetrico,
  - solo gradienti leggeri e drop shadow coerente.

---

## 4. Personaggi: Silhouette, Stati e Animazioni

### 4.1 Silhouette & Stati

- **Founder:**
  - silhouette più alta/slanciata,
  - elemento distintivo (mantello, staff, colore accentuato),
  - icona o badge sopra la testa (es. contorno oro) per riconoscibilità immediata.
- **Worker generici:**
  - forme più compatte/quadrate,
  - palette più spenta rispetto al founder.
- **Feriti:**
  - postura leggermente incurvata,
  - elementi visivi chiari (fasce, braccio al collo) anche a bassa risoluzione,
  - colori leggermente desaturati/“sporchi” per enfatizzare lo stato.
- **Morti:**
  - token vuoto/croce/marker cimitero sullo slot,
  - evitare gore; focus su impatto sistemico, non splatter.

### 4.2 Animazioni Minime

- **Loop base per worker:**
  - idle (piccolo dondolio/cambio di peso),
  - lavorare (movimento braccia/attrezzo),
  - camminare (2–4 frame ripetuti).
- **Loop base per founder:**
  - idle più marcato (mantello, respiro),
  - spirali/spark leggeri su quest per enfatizzare il ruolo eroico.

---

## 5. Edifici, Slot e Codifica Visiva

### 5.1 Edifici

- Ogni building ha:
  - **forma primaria** (rettangolo, torre, cupola, ecc.),
  - **icona centrale** che comunica la funzione (cibo, training, difesa, mercato),
  - **accent color** coerente con il tipo:
    - food/economia: verdi/marroni caldi,
    - difesa/quest: toni più freddi o accenti rossi leggeri,
    - meta/charter: accenti oro/teal.

### 5.2 Slot lavoro/quest

- Slot devono essere chiaramente visibili come “socket”:
  - contorno evidente,
  - stato **libero** vs **occupato** distinto da riempimento/colore.
- Per quest ad alto rischio:
  - icona di pericolo (triangolo, teschio stilizzato) + colore d’accento rosso/ambra,
  - leggibile anche su miniature.

---

## 6. Uso dell’AI nella Pipeline Visiva

### 6.1 Casi d’Uso Consigliati

- **Concept art & moodboard:**
  - generare varianti di layout villaggio, stili di edifici, atmosfera (“village under siege”, “grim cozy”).
- **Esplorazione di forme:**
  - studiare rapidamente sagome di personaggi/edifici da poi ridisegnare in vector.

### 6.2 Casi d’Uso da Evitare

- Non usare direttamente output AI eterogenei come asset finali.
  - Evitare mix di stili (pittorico, fotorealistico, cartoon) nello stesso schermo.
- Non mischiare grafica fotorealistica con il vector stilizzato deciso per l'Idle Incremental RPG.

### 6.3 Pipeline Raccomandata

1. **Prompt → AI** per generare concept (scenari villaggio, edifici, atmosfere).
2. Selezionare 2–3 immagini che centrano mood e struttura.
3. **Ridisegnare in vector**:
   - semplificare le forme,
   - restringere la palette ai colori di progetto,
   - uniformare peso delle linee e ombre.
4. Riutilizzare gli stessi pattern di forme e colori per tutti gli asset successivi.

---

## 7. Roadmap Visiva per le Diverse Fasi

### 7.1 Vertical Slice / Demo (Itch.io + Next Fest)

- **Goal:** "Art coerente e pulita, anche se non definitiva".
- Requisiti minimi:
  - tutti gli elementi di gioco principali (personaggi, edifici chiave, slot) usano lo **stesso** stile vector/line weight,
  - nessun placeholder fotorealistico o icona di stock fuori palette,
  - animazioni minime ma presenti per lavorare/camminare.
- È accettabile:
  - fondali relativamente semplici,
  - variazione limitata tra worker (pochi archetipi visuali).

### 7.2 Lancio 1.0 / Mobile

- Migliorare su:
  - **variazioni di edifici** (upgrade visibili, decorazioni extra),
  - **effetti leggeri** per eventi chiave (ondate, collasso, meta-upgrade),
  - resa di **day/night o condizioni meteo** se coerente con carico di lavoro.

---

## 8. Integrazione con Gli Altri Documenti

- Questo piano si appoggia a:
  - `GAME_VISION_IDLE_INCREMENTAL.md` (vision di prodotto e tono generale),
  - `idle_village_plan.md` (sistemi e loop di gioco),
  - `idle_village_ftue_plan.md` (primi 30–60 minuti di esperienza).
- L’art style qui descritto deve sempre:
  - servire il loop "Manage, Suffer, Rebuild",
  - restare compatibile con il tema visivo **Gilded Observatory** e con una pipeline sostenibile per un solo dev.

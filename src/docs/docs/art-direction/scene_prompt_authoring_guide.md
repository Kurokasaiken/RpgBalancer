# Scene Prompt Authoring Guide — immagini ambientali per quest/eventi

Guida operativa per agenti che authorano prompt di scena (quadri ambientali,
non ritratti). Distillata dalla sessione quest «Sterminio dei goblin»
(`.mw/specs/quest-goblin-scenes/`, R-172) — i problemi incontrati lì sono
diventati regole qui. Per umani/creature vale invece la Prompt Engineering V2
(`art_direction_plan.md` §10); per le creature il lifecycle è §6.

## R0 — La fonte è il testo authored

Il soggetto viene dalla spec/manoscritto della quest, non dall'immaginazione.
Se il testo non regge come immagine (es. un reveal non credibile), **prima si
sistema il testo col Director, poi si scrive il prompt** — non si aggiusta il
prompt attorno a un testo sbagliato.

## R1 — Solo il beat pre-scelta / pre-check

L'immagine mostra la situazione *prima* della decisione o dello skill check,
mai l'esito. Errori già visti e da evitare:

- mostrare ciò che il check rivela (il campo visto dall'alto, i campanelli
  scoperti col bigwin);
- mostrare l'esito riuscito (il palo che cade, la palizzata rotta, il bottino
  aperto);
- mostrare la minaccia già esplosa quando il beat è il presentimento.

Regola pratica: se la frase del prompt descrive qualcosa che il testo mette
*dopo* un check o una scelta, è un esito — tagliarla. L'immagine è il fermo
immagine un istante prima.

## R2 — Il party del giocatore non si disegna mai

Niente eroi del giocatore: né figure intere, né mani, stivali, armi impugnate,
né sagome/ombre alleate. Il gruppo resta immaginazione — l'immagine dà il mood.
**Party esterni, NPC e persone generiche invece sono ammessi** quando servono
la scena (un mercante al bivio, viandanti lontani, guardie del villaggio).

## R3 — Le creature vengono dal registry

Se la creatura ha una scheda in `src/docs/docs/art-direction/creatures/
creatures/<nome>/`, il prompt usa il suo blocco descrittore. Se non ce l'ha:

- si tengono massa/sagome indistinte, oppure
- si authora prima la scheda (workflow §6, status `candidate`), poi si
  referenzia.

Mai inventare un look creatura dentro un prompt di scena — diventerebbe un
design nascosto non versionato.

## R4 — Luce libera, palette di bibbia

La distinzione corretta (errore corretto in sessione 2026-10-13):

- **LUCE: libera per scena.** Niente Solar Triumph forzato — la luce è
  quella naturale del beat (alba, mezzogiorno, tramonto cinabro, fuoco di
  notte).
- **PALETTE: resta quella della bibbia.** I pigmenti Wanderlust valgono
  anche per le scene: **ultramarine, verde Veronese, cinabro, ambra**;
  **colore delle ombre = deep teal / smeraldo / turchese** (§2 bibbia),
  mai grigie, marroni o fangose; **cielo Wilderness = azure vibrante**
  (§1A) dove il cielo è visibile. Questo NON è un vincolo UI/HUD — è il
  DNA del gioco.
- **LUMINOSITÀ: è un vincolo di bibbia, sempre attivo.** La bibbia non vieta
  scene notturne o al crepuscolo, ma vieta la *tonalità scura*: ogni quadro
  deve restare luminoso e ad alta cromia — la luce vince, anche l'ombra più
  profonda è colore saturo, mai nero/fango. I generatori tendono al dark
  quando il testo contiene "night/dusk/shadow/dark": serve sempre la
  clausola positiva («The frame stays luminous and high-chroma — light wins
  over darkness, even the deepest shadow is saturated color, never black
  murk.») e, dove la narrativa lo permette, una sorgente di luce forte.
- **Vietato:** inventare vincoli cromatici derivati dalla UI/HUD (token skin,
  colori del componente) o da regole pensate per altri soggetti.

Restano fissi:

- **stile:** thick oil impasto, pennellate larghe visibili (tradizione
  Jaime Jones / Jeff Easley); split-rendering pulito solo sul punto focale;
- **kill list non cromatica:** no grim, no gore, no symmetry, no flat digital
  surfaces, no sci-fi, no text/UI/frames/watermarks/**signatures/logos**.

## R5 — Struttura del prompt esterno (Gemini / Grok / GPT)

**Formato canonico = moodboard library** (`public/docs/prompts/prompt_library.md`
è la collezione dei prompt già riusciti: copiare densità e stile da lì,
non inventare un formato più snello).

Prosa unica ~200–260 parole, aperta con il titolo della scena
(`NOME — ...`), con **ancore in CAPS** embeddate nel flusso
(`SUBJECT:`, `COMPOSITION:`, `LIGHTING:`, `PALETTE:`, `TECHNIQUE:`,
`MOOD:`) e negazioni capsule inline (`NO BROWN`, `NO TRAVELERS`) oltre
alla kill list finale. I blocchi **in quest'ordine fisso**:

1. **Subject + beat authored** — cosa si vede e perché conta, preso dal
   testo. Enumerazione materiale fitta: ogni elemento porta materia +
   comportamento della luce, non solo il nome.
2. **Composition** — POV, focal point, asimmetria (mai centrato statico).
3. **Mood** — due emozioni specifiche («X + Y»), mai "epic/dark/mysterious".
4. **Technique/Style** — il blocco impasto/split-rendering (bibbia §2);
   contrasto di tecnica dichiarato ("dirty impasto X, clean polish Y").
   **Lo stile domina anche l'apertura del prompt**: il medium va dichiarato
   prima del soggetto («A masterful cinematic oil painting in heavy textured
   impasto: …») e il vocabolario resta aggressivo («thick, violent
   brushstrokes, visible layers of paint adding physical depth»), mai
   attenuato («in the … tradition» diluisce il token). I nomi degli artisti
   restano come ancora di stile (Jones, Easley, Sparth, Gerard, Ruan Jia);
   se un generatore li ammorbidisce (policy "no living artists") il fallback
   è tenere il blocco tecnico descrittivo e togliere i nomi.
   Wide shot con scala monumentale → "Sparth-like monumental scale" (§3).
   Scene con creature → "Justin Gerard whimsy — grotesque but vibrant,
   never horror" (§3: le creature Wanderlust sono grottesche *e* vibranti,
   mai horror). Chiudere SEMPRE con la dichiarazione di rude bellezza:
   «the world rendered as rude beauty — weathered and tactile, never
   squalid» — il mondo resta bello anche quando il beat è pericoloso.
5. **Lighting** — la luce propria della scena (libera), ma descrivere sempre
   una sorgente forte dove la narrativa lo permette.
6. **Palette** — blocco dedicato, **obbligatorio**: pigmenti di bibbia
   declinati sulla scena + `deep teal-emerald shadows` (§2) +
   `NO grey, NO brown, NO mud` + `vibrant azure sky` se il cielo è
   visibile (§1A). Chiudere SEMPRE con la clausola di luminosità:
   «The frame stays luminous and high-chroma — light wins over darkness,
   even the deepest shadow is saturated color, never black murk.»
7. **Kill list finale** — integrale e in CAPS (NO grim, NO gore, NO decay,
   NO mud, NO symmetry, NO flat digital, NO airbrushed smoothness,
   NO sci-fi, NO text/UI/watermarks/frames/signatures/logos) + ban specifici
   di scena — `NO signature` è obbligatorio: i generatori tendono ad apporre
   firme fake d'autore («JONES») quando il prompt cita nomi di artisti;
   inoltre i divieti cardine vanno ripetuti inline in CAPS nel Subject
   (`NO TRAVELERS`, `NO BLADE HAS MET YET`) dove contano di più.
8. **Aspect** — **dettato dal componente di destinazione**, mai scelto a
   sentimento. Misura il container prima di scrivere il prompt. Per il
   quest theatre (`StageBand` + `TransitView`, fascia ultra-wide) e per la
   cover card del picker (`QuestSelectScreen`, banda `h-44` `object-cover`):
   **21:9 cinematic scope**. Attenzione: «card» non significa verticale —
   la cover card è una banda wide, una 3:4 verrebbe croppata a striscia.

**Vocabolario materico (bibbia §1/§4):** mai termini generici — usare i
materiali del mondo: *golden thatch* (non "thatch"), *timber*, *alpine
stone*, *Sun-Bronze*, *Dolomites peaks*, *crystal-clear river*, *prismatic
dust motes*.

## R6 — Una pittura per fase distinta

La fase ha UNA immagine; i check sono pulsanti sulla stessa schermata e
riusano l'immagine di fase. I nodi gemelli della stessa scena riusano il
file — la mappa è in `scenes.md` / `NODE_ART`.

## R7 — Ogni scena è taggata per il riuso cross-quest

Le immagini di fase sono asset del gioco, non solo della quest che le ha
commissionate. Regole:

- ogni `prompt.md` porta una riga `**Tags riuso:**` sotto il blocco prompt:
  tag su **setting, soggetto, figure presenti/assenti, ora del giorno,
  presenza creature** — mai tag narrativi legati alla singola quest;
- lo `scenes.md` della quest riporta la tabella tag completa (SSoT del set);
- un asset senza elementi quest-specifici nel soggetto è riusabile ovunque
  i tag coincidano → **non introdurre nel prompt elementi unici della
  quest se non narrativamente necessari** (un nome proprio, un artefatto
  chiave): quel che rende l'immagine irripetibile la rende anche
  inutilizzabile altrove;
- convenzione di tag: `goblin-swarm/goblin-hidden/goblin-distant` marca le
  scene con creature (riusabili in altre quest goblin); `no-goblins` +
  `generic` = wilderness pulita riusabile ovunque; `people-allowed` marca
  le scene con NPC visibili.

## R8 — Gate di qualità: il livello "battezzato"

Un prompt è *battezzato* quando regge il confronto con la libreria dei
prompt già riusciti (`public/docs/prompts/prompt_library.md` — Villaggio,
Armatura Imperiale, Verso Mordor, Architettura Impero del Sole, Drago…).
Il livello non si valuta a occhio: **ogni prompt DEVE passare il lint
meccanico** prima di entrare in un aggregato di generazione.

```bash
python scripts/lint-scene-prompts.py .mw/specs/<spec>/scenes/
```

### Criteri verificati dal lint (bloccanti)

| # | Criterio | Verifica meccanica |
|---|----------|--------------------|
| Q1 | Densità | ≥ 200 parole nel blocco `text` |
| Q2 | Titolo | apre con `NOME —` (maiuscolo, come la library) |
| Q3 | Ancore | `SUBJECT`, `COMPOSITION`, `LIGHTING`, `PALETTE`, `TECHNIQUE`, `MOOD` tutte presenti |
| Q4 | Pigmenti | ≥ 2 tra `ultramarine`/`Veronese`/`cinnabar`/`amber`/`azure` |
| Q5 | Ombre | `deep teal` (o teal-emerald) + `NO grey` + `NO brown` + `NO mud` |
| Q6 | Luminosità | clausola "luminous"/"light wins" + `never black murk` |
| Q7 | Rendering | `impasto` + `Jaime Jones` o `Jeff Easley` + `rude beauty` |
| Q8 | Creature | se la scena ha goblin/creature → `Justin Gerard` presente |
| Q9 | Negazioni inline | ≥ 1 divieto cardine in CAPS *dentro* il flusso (es. `NO TRAVELERS`), non solo in coda |
| Q10 | Kill list | ≥ 8 voci `NO …` nel blocco finale |
| Q11 | Aspect | `21:9` (scene) o `3:4` (card) dichiarato |
| Q12 | Tags | riga `**Tags riuso:**` sotto il blocco (scene attive) |

### Gate umano (non meccanizzabile, checklist di review)

- [ ] Mostra solo il beat pre-scelta/pre-check? Nessun esito/reveal? (R1)
- [ ] Zero party del giocatore (niente mani/stivali/sagome alleate)? (R2)
- [ ] Creature solo da scheda registry, massa/sagome se non canonizzate? (R3)
- [ ] Mood = due emozioni specifiche, non "epic"?
- [ ] Ogni elemento del Subject porta materia + luce, non solo il nome?
- [ ] Nessun elemento quest-specifico non necessario (riuso, R7)?

### Anti-pattern osservati (fallimenti reali → regola)

| Fallimento visto | Causa | Regola |
|---|---|---|
| Immagini troppo scure | "night/dusk/shadow/dark" senza clausola positiva | Q6 sempre, luce forte dove possibile |
| Ombre blu-notte | "ultramarine shadow" invece di teal | Q5 |
| Prosa "sottile" | elementi nominati senza materia/luce | Q1 + gate umano |
| Goblin horror | mancava Gerard | Q8 |
| Party disegnato | ban non inline | Q9: `NO TRAVELERS` nel Subject |
| Impasto diluito / stile piatto | stile in coda o hedged («in the … tradition»), prompt lungo di logistica pipeline (parallasse, cutout, ancore FX) | lo stile apre il prompt («A masterful cinematic oil painting in heavy textured impasto» prima del soggetto) + «thick, violent … brushstrokes, visible layers … physical depth»; la logistica di pipeline vive in header/generation notes del file, MAI nel prompt — rif. §«Viaggio» in prompt_library (R-263) |
| Firma fake in frame («JONES») | nomi di artisti senza ban firme | `NO signature, NO watermark, NO logo` nella kill list (R-267/R-263) |
| Spoils = cianfrusaglia | descritti oggetti domestici (pettine, paiolo) | il premio deve leggere come **valore** a colpo d'occhio: monete, metallo prezioso, gemme/ambra — mai inventario casalingo |
| Spoils già tutte visibili | tutto il valore esposto → niente da cercare | scena "keep looting" = **saggio + promessa + costo**: refurtiva visibile (il saggio), nascondigli non perquisiti (la promessa), trappole/pericolo visibile (il costo) |

## Salvataggio dei prompt vincenti

Sì — i prompt che producono asset approvati vanno conservati:

- per ogni asset approvato, un `provenance.md` accanto al file (modello,
  parametri, seed, prompt esatto usato, checksum) — convenzione
  `.mw/specs/goblin-event-modal/assets/V002-hero/provenance.md`;
- il `prompt.md` di scena resta la **fonte**; la provenance registra la
  variante vincente (se il prompt è stato ritoccato in sessione, si salva
  il testo finale, non l'originale);
- in `SOURCES.md` della directory asset si registra file → provenienza.

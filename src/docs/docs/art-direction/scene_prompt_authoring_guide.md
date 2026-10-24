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

- mostrare ciò che il check rivela (il campo visto dall'alto, il filo d'allarme
  scoperto col bigwin);
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
| Q13 | Medium-first (R9) | token medium nella prima frase + zero token camera prima |
| Q14 | Register ban (R9) | sub-codici `REG-CAM`/`REG-NUM` nel blocco |
| Q15 | Floor stile (R9) | ≥3 token stile post-filtro hedge/negazioni |
| Q16 | Negation bulk (R9) | warn: parole in run `NO/DO NOT/NEVER` vs totale |
| Q17 | Placeholder (R9) | nessun `<!-- AUTHOR:` residuo nel blocco |

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
| Prompt in registro fotografico (dusk-v1, R-272) | apertura `24mm wide-angle, deep depth of field`, ~30% parole in 3 blocchi di negazione, percentuali/coordinate di layout | kernel pittorico obbligatorio (R9): medium-first, register ban Q14, floor stile Q15, bulk negazioni Q16-warn |

## R9 — Kernel pittorico (regole hard del registro, R-272/PLAN-080)

Il blocco prompt (il fenced `text` di `prompt.md`, §7 dei brief PLAN-052)
è **un dipinto descritto**, mai un brief tecnico. Le sezioni ingegneristiche
di un brief (depth planes, ancore FX, calm zone, coordinate, percentuali)
vivono FUORI dal blocco prompt — nei campi §1–6 del brief e nelle
generation notes. Nel prompt ogni vincolo tecnico è **tradotto in termini
visivi**:

| Vincolo engineering | Traduzione pittorica nel prompt |
|---|---|
| edge occluder | «a broad saturated mass in `<pigmento bibbia>` anchored at the frame edge» (MAI `dark mass`/`black mass` — collide con Q5/Q6) |
| calm zone | «a low-frequency painted area» con pigmento di scena |
| ancora FX (embers/smoke/glow) | la **sorgente** dipinta («paint only the light SOURCE») — le particelle sono overlay runtime, mai dipinte |
| depth planes near/focal/far | masse pittoriche in prosa («near mass», «focal clearing», «far wall of treeline») — niente `x0.4`/percentuali |

Regole meccaniche (verificate da `lint-scene-prompts.py` Q13–Q17):

1. **Medium-first (Q13)**: la prima frase dichiara il medium
   (`oil painting`/`impasto`/`oil`) e nessun token fotografico lo precede.
   Il token medium conta come token stile.
2. **Register ban (Q14)**: nel blocco prompt sono vietati vocabolario
   fotografico (`24mm`, `depth of field`, `establishing shot`, `f/…`,
   `bokeh`, `telephoto`, `dslr`, `lens flare`, `shallow focus` → codice
   `REG-CAM`) e layout numerico (percentuali, `x0.4`/`y0.6`, coppie di
   coordinate → `REG-NUM`). Leciti da corpus: `cinematic`, `wide-angle`,
   `golden hour`, `rim light`.
3. **Floor di stile (Q15)**: ≥3 occorrenze di vocabolario stile
   (`impasto`, `brushstroke`, `palette-knife`, `painterly`, `oil painting`,
   `visible layers of paint`) — conteggio dopo aver rimosso clausole negate
   e hedge (`in the … tradition`, `in the style of`, `reminiscent of` non
   contano).
4. **Explicit-negation bulk (Q16, warn)**: parole dentro run espliciti
   `NO/DO NOT/NEVER` vs totale — stampa il valore col range del corpus;
   non blocca. Le negazioni in prosa naturale («without», «devoid of»)
   non contano: la metrica misura il volume delle kill list.
5. **Placeholder (Q17)**: un marker `<!-- AUTHOR:` residuo nel blocco è
   failure — scaffold non compilato non può andare al generatore.

**Severità e corpus-invariance**: un check hard resta hard solo finché il
100% del corpus approvato lo supera (snapshot pre-migrazione, file+commit
hash nel report di calibrazione). Fallimento → triage: check difettoso →
fix; violazione reale → migrazione/eccezione motivata; demotion a warn solo
con accettazione Director. Un warn diventa hard solo dopo pilota con
eye-check Director su scena rigenerata.

## Salvataggio dei prompt vincenti

Sì — i prompt che producono asset approvati vanno conservati:

- per ogni asset approvato, un `provenance.md` accanto al file (modello,
  parametri, seed, prompt esatto usato, checksum) — convenzione
  `.mw/specs/goblin-event-modal/assets/V002-hero/provenance.md`;
- il `prompt.md` di scena resta la **fonte**; la provenance registra la
  variante vincente (se il prompt è stato ritoccato in sessione, si salva
  il testo finale, non l'originale);
- in `SOURCES.md` della directory asset si registra file → provenienza.

## Correlazione a 4 assi (v2, 2026-10-24 — PLAN-052 item 12, PLAN-084)

Ogni brief di scena dichiara QUATTRO decisioni correlate in un'unica
sezione — mai scelte indipendenti:

1. **`archetype`** — id dalla tassonomia in `composition_archetypes.md`
   (COULISSE/SHOULDER/VISTA/CANOPY/ARCH/MONOLITH/CASCADE/ISLAND/VOID/
   CHOKE/GRID/TABLEAUX). Dice dove stanno gli occluder near e cosa resta
   libero. Si sceglie col decision flow del catalogo + le 8 regole di
   sequenza (mai adiacenti uguali, ritmo chiuso/aperto, rotazione
   bordo/orizzonte/mossa/focale, escalation far-zone).
2. **Shot grammar** — `camera`/`entrance`/`pose`/focale narrativo: la
   composizione deve servire la mossa (creep su SHOULDER esige texture
   interna alla massa; push-in su ARCH esige separazione depth al varco).
3. **Ambient plan** — quali FX runtime convivono col dipinto e quali
   zone restano calme (fog → terreno basso libero; shaft → cielo; sprite
   kit → MAI sopra occluder near, v. regola occlusione in
   `ambient-layer.md`; painted = source, runtime = effetto).
4. **Interaction hooks** — dal catalogo
   `scene_interaction_affordances.md`: cosa il player può scoprire/
   cliccare/toccare, il flag che ne deriva (`revealedAmbush`,
   `lootUntouched`, `sawEscape`), e cosa il prompt DEVE dipingere per
   supportarlo — il segreto va dipinto leggibile-ma-camuffato, l'oggetto
   con un lume/colore che lo distingue, l'elemento fragile con segnali
   di fragilità.

Per le quest GENERATE (pipeline `questRefine`/`domainVocabs`): la stessa
correlazione vale — la spec di scena deve portare archetype + hooks come
campi dati, così il prompt generator li riceve in input e non li inventa.
L'assegnazione dell'archetipo per sequenza segue la coverage matrix della
spec (`scenes.md`), non la scelta puntuale del singolo prompt.

# Composition Archetypes — taxonomy & selection system (v1, 2026-10-24)

Fonte: `context/research/2026-10-24-composition-archetypes/` (broadcast
multi-provider + synthesis). Scopo: evitare il "Default Framing Trap" —
la convergenza spontanea di ogni scena verso COULISSE.

**Principio cardine — la correlazione:** archetipo, shot grammar e piano
ambient sono UNA decisione, non tre campi. L'archetipo dice dove stanno gli
occluder; lo shot dice come la camera sfrutta quella geometria; il piano
ambient dice cosa il dipinto deve lasciare libero (fog → terreno calmo,
shaft → cielo, glint → superfici dure). Il prompt pittorico deve chiedere
tutto questo insieme — vedi colonna "prompt deve chiedere" in ogni scheda.

## Schede archetipo (12)

### COULISSE — tunnel/coulisse pair
- **Provenienza**: Lorrain, Ruysdael; wing flats teatrali.
- **Geometria**: masse scure a ENTRAMBI i bordi, sfalsate in depth; lead
  diagonale verso focale lontano.
- **Mood**: arrivo, scoperta, mondo chiuso.
- **Knobs**: rapporto asimmetria 70/30 vs 50/50; materiale (roccia/albero/
  rovina); curvatura del lead (dritta vs serpentina); altezza orizzonte.
- **Shot**: push-in (focale tra le masse), creep.
- **Prompt deve chiedere**: silhouette nette sulle masse; lead leggibile;
  focale lontano luminoso; NO simmetria.
- **Ambient**: fog sul suolo; shaft dal varco alto; anchors sul focale.
- **Rischi**: è il default — usarla solo con razionale; rami nudi = smear.

### SHOULDER — dirty foreground / repoussoir singolo
- **Provenienza**: cinema (Ipcress, Wyler), Claude.
- **Geometria**: UNA massa near 30–40% di UN lato (spesso angolo basso);
  i restanti due terzi aperti sul focale lontano.
- **Mood**: intimo, voyerismo, osservare da copertura.
- **Knobs**: altezza spalla (bassa = roccia, media = tronco, alta = ramo
  solido); lato; cutout negativo che inquadra un sub-focale.
- **Shot**: creep (cambia il rapporto spalla/aperto — la massa deve avere
  texture interna o il creep non produce moto).
- **Prompt deve chiedere**: massa near a silhouette pulita CON gradini
  interni (rocce accatastate, radici stratificate — non parete liscia);
  focale nel varco aperto.
- **Ambient**: glint/moths sulla massa; fog dietro il varco; lucciole
  nella fascia scura.
- **Rischi**: massa morbida/scura su mid-tone misbaka (basso contrasto).

### VISTA — open frame
- **Provenienza**: Hudson River, western anamorfico.
- **Geometria**: zero occluder near; step mid (creste, terrezzi, treeline)
  verso focale lontano luminoso; orizzonte = decisione primaria.
- **Mood**: respiro, vastità, arrivo finale.
- **Knobs**: altezza orizzonte (molto basso = cielo, alto = terreno);
  numero step (2–4); dettaglio minimo sul bordo basso per scala.
- **Shot**: pan-lateral (scansione); creep se gli step hanno separazione.
- **Prompt deve chiedere**: step mid con silhouette distinte (MAI solo
  una treeline sottile); orizzonte dichiarato; cielo low-frequency.
- **Ambient**: fog leggero, cloud-sky (cielo pulito!), birds-far.
- **Rischi**: senza near il warp è sottile → usare come punteggiatura
  (max 2–3 per atto), non default.

### CANOPY — overhang
- **Provenienza**: Constable, romantici.
- **Geometria**: massa scura dal bordo ALTO (chioma, volta, trave, arco);
  sotto libero verso il focale.
- **Mood**: soglia, riparo, sacralità o oppressione.
- **Knobs**: profondità dell'overhang; materiale; gap nella silhouette
  che lascia passare luce.
- **Shot**: hold (peso statico), push-in (entrare sotto).
- **Prompt deve chiedere**: canopy a massa SOLIDA (impasto grosso, non
  fogliame filigranato); contrasto sotto/sopra = dial del mood.
- **Ambient**: shaft dal gap; dust; glow sotto l'arco.
- **Rischi**: chioma con rami nudi = smear certo se la camera si muove.

### ARCH — frame-within-frame / keyhole
- **Provenienza**: proscenio, noir, threshold shots.
- **Geometria**: cornice interna (arco, varco, bocca di grotta) nel
  mid-ground; focale visibile attraverso; bordi esterni aperti o soft.
- **Mood**: transizione, rivelazione, mondo dentro mondo.
- **Knobs**: forma apertura; dimensione vs frame; distanza cornice
  (near = dirty frame, far = destinazione); lit vs silhouette.
- **Shot**: push-in signature (attraverso il varco); hold forte.
- **Prompt deve chiedere**: apertura con bordo netto e spesso; separazione
  depth chiara tra cornice e focale interno (o il warp taglia l'apertura).
- **Ambient**: glow nel varco; nebbia oltre; glint sulla soglia.
- **Rischi**: bordi sottili/irregolari = smear; arco in pietra ok, arco
  di rami spezzati no.

### MONOLITH — hero landmark
- **Provenienza**: key art, Struzan, Elden Ring vistas.
- **Geometria**: struttura gigante al centro o terzo (torre, albero,
  fortezza); foreground basso o assente.
- **Mood**: confronto, destino, scala.
- **Knobs**: riflessi/specchio d'acqua sotto; luce laterale vs controluce;
  rottura simmetria.
- **Shot**: push-in (il centro gonfia — la depth sul monolite deve
  essere liscia o "bolla").
- **Prompt deve chiedere**: monolite a volume semplice e superficie
  continua; scala via elementi piccoli intorno.
- **Ambient**: glow sul monolite; birds-far intorno; cloud-shadow.
- **Rischi**: superficie spezzata sul centro = warp a bolla.

### CASCADE — diagonale scalare (Bibiena)
- **Provenienza**: vue sur l'angle Bibiena, barocco.
- **Geometria**: lead entra da un angolo basso ed esce verso il mid-alto
  opposto; masse scalate LUNGO la diagonale (non ai bordi); nessuna coppia
  simmetrica.
- **Mood**: viaggio, caccia, ascensione/discesa — la direzione è il soggetto.
- **Knobs**: pendenza (dolce = viaggio laterale, ripida = ascesa); lato
  entrata (ruotare tra scene); numero gradini (3–5); termine in focale o
  fuori frame.
- **Shot**: creep lungo la diagonale (signature); pan se dolce.
- **Prompt deve chiedere**: gradini a silhouette solida (mai ringhiere);
  near-end della diagonale = massa pulita al bordo.
- **Ambient**: dust sul percorso; fog nei bassi; glow al termine.
- **Rischi**: scale con ringhiere sottili = smear; near-end smussato = tear.

### ISLAND — detail island
- **Provenienza**: Hudson River detail islands (Gifford, Kensett).
- **Geometria**: cluster scuro compatto e iper-dettagliato nel terzo
  basso, NON a contatto coi bordi; aria/acqua su almeno 3 lati; focale
  lontano sopra e oltre.
- **Mood**: indizio, contemplazione — l'occhio atterra lì poi viaggia.
- **Knobs**: posizione (basso-sx/dx/centro); materiale (rocce/fagotto/
  macerie); forza aerial perspective dietro.
- **Shot**: hold (ancora il fermo); push-in dal cluster = reveal naturale.
- **Prompt deve chiedere**: cluster a massa SOLIDA con gradini interni
  (rocce impilate, non rametti); luce radente sul dettaglio.
- **Ambient**: glint sul cluster; fog intorno (pool sulla radura);
  fireflies nei bordi scuri.
- **Rischi**: cluster ramoso = smear; isola troppo piccola = depth piatto.

### VOID — silhouette-void
- **Provenienza**: poster/Struzan, negative space key art.
- **Geometria**: silhouette piccola-media off-center su campo luminoso
  vasto e uniforme (cielo, nebbia, acqua, neve); zero occluder near.
- **Mood**: mitico, isolamento, pausa di capitolo.
- **Knobs**: scala silhouette; posizione sui terzi; texture campo;
  seconda silhouette per relazione.
- **Shot**: SOLO hold — mossa = azzardo; creep solo se il campo ha bande
  atmosferiche parallasse.
- **Prompt deve chiedere**: silhouette SPESSA e semplice; campo a
  gradiente pulito con bande atmosferiche.
- **Ambient**: minimo — il vuoto è il contenuto; fog lontano al massimo.
- **Rischi**: silhouette sottile = stretch ai bordi; carta più potente e
  più fragile — usare come cesura narrativa, non stapia.

### CHOKE — diagonal choke (Cullen)
- **Provenienza**: serial vision Gordon Cullen — la curva della strada.
- **Geometria**: muro/cresta solida taglia diagonalmente ~60% del frame,
  bloccando un lato e forzando l'occhio attraverso un varco stretto
  sull'altro.
- **Mood**: soglia, tensione, l'ignoto dietro l'angolo.
- **Knobs**: angolo del muro; luce che esce dal varco; direzione varco
  (ruotare tra scene).
- **Shot**: pan-lateral verso il reveal; creep d'avvicinamento.
- **Prompt deve chiedere**: muro a bordo VERTICALE e netto; il varco
  come unica zona luminosa = focale.
- **Ambient**: glow/glint nel varco; fog oltre il muro; nulla sul muro.
- **Rischi**: bordo muro diagonale = distorsione max sul pan; tenerlo
  verticale.

### GRID — lattice
- **Provenienza**: Cullen, colonnati, viali, grate.
- **Geometria**: elemento strutturale ripetuto (colonne, tronchi in viale)
  in ritmo sul frame; focale visibile tra le maglie.
- **Mood**: rituale, processionale, urbano.
- **Knobs**: spaziatura; angolo (frontale/obliquo); rotura di un elemento
  per irregolarità; near vs mid.
- **Shot**: pan (ritmo occludi/rivela); push-in se colonnato.
- **Prompt deve chiedere**: membri SPESSI (colonne pietra, tronchi
  massicci) — MAI maglie sottili.
- **Ambient**: dust nelle maglie; shaft obliquo; glow a fondo viale.
- **Rischi**: IL RISCHIO PIÙ ALTO DEL SET — maglie sottili = smear
  catastrofico; flaggato risk-high al brief per default.

### TABLEAUX — high-horizon / vista dall'alto
- **Provenienza**: paraventi giapponesi, manga establishing, high-angle.
- **Geometria**: orizzonte nel 10% alto o fuori frame; camera guarda
  giù su terreno a terrazze/multi-tier; foreground sul bordo basso che
  sale verso l'alto.
- **Mood**: sorveglianza, lettura tattica, il disegno del luogo.
- **Knobs**: densità terrazzamenti; posizione focale sull'asse verticale;
  angolo di vista.
- **Shot**: tilt/push-in verso il basso; hold.
- **Prompt deve chiedere**: gradiente z LINEARE basso→alto (gradini
  leggibili, non superficie continua — la depth model legge i piani
  orizzontali male); il dettaglio narrativo nel tier giusto.
- **Ambient**: fog nei bassi tier; smoke da sorgenti sui gradini;
  cloud-shadow che viaggia sui tier.
- **Rischi**: terreno "piatto visto dall'alto" misbaka come parete —
  servono terrazze esplicite.

## Sistema di scelta (decision flow)

Per ogni scena, in quest'ordine:

1. **Leggi il beat** — cosa fa il player? (arriva, spia, legge, carica,
   trova, respira) → shortlist 2–3 archetipi dalla riga Mood.
2. **Leggi la fiction** — cosa il manoscritto impone? (vista dall'alto,
   copertura, soglia) → vincolo duro sull'archetipo.
3. **Scegli lo shot primario** (dal vocabolario camera authored) →
   filtra gli archetipi su "shot servito".
4. **Verifica il rischio parallax** — la scena contiene elementi sottili?
   Se sì: o li elimini dalla composizione, o flagghi risk-high + hold-only.
5. **Controlla la sequenza** — le 8 regole sotto. Se violi, ruota knobs
   o cambia archetipo.
6. **Scrivi la correlazione nel brief**: archetipo + shot + piano ambient
   in un'unica sezione, poi il prompt pittorico che la implementa.

## Le 8 regole di sequenza (anti-monotonia)

1. **Mai adiacenti uguali** — ritorno solo dopo ≥3 scene e con ≥2 knobs
   cambiati.
2. **Ritmo chiuso/aperto** — chiusi (COULISSE/SHOULDER/CANOPY/ARCH/GRID/
   CHOKE/MONOLITH) vs aperti (VISTA/VOID) vs ibridi (ISLAND/CASCADE/
   TABLEAUX): mai 3 chiusi di fila; aperti max 2–3 per atto, dopo i più
   claustrofobici.
3. **Rotazione bordo occluder** — sx → alto → dx → basso/isola → nessuno.
4. **Rotazione orizzonte** — ≤2 consecutive nella stessa banda
   (basso <33%, medio, alto >66%).
5. **Rotazione mossa** — coerente con l'archetipo, mai la stessa mossa
   due scene di fila se serve la stessa funzione.
6. **Turno distanza focale** — near → far → mid tra consecutive.
7. **Escalation far-zone** — il focale lontano cresce in chiarezza lungo
   l'atto (atmosfera → landmark → destinazione luminosa).
8. **Flag lattice al brief** — membri sottili dichiarati prima del
   prompt: o diventano solidi, o la scena va in hold-only.

## Coverage matrix (obbligatoria in scenes.md)

Per ogni scena della quest: `archetype | closed/open | bordo occluder |
orizzonte | shot | focale`. La matrice si aggiorna a ogni brief e si
controlla PRIMA di scegliere l'archetipo successivo.

## Collegato

- `scene_interaction_affordances.md` — il catalogo degli hook
  cliccabili/discovery che il brief dichiara insieme ad archetipo/shot/
  ambient (correlazione completa: forma + mossa + vita + interazione).

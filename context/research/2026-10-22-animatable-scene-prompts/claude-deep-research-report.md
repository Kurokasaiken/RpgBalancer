Prompting per scene 2.5D dipinte: report operativo
Ottobre 2026. Ricerca web mirata (circa 15 ricerche: guide ufficiali dei generatori, paper e benchmark, letteratura di animazione e game art).
Legenda. [V] verificato su fonte ufficiale o primaria. [P] misurato in paper o benchmark. [A] aneddotico, community o fonte terza. [H] ipotesi mia, da validare con A/B test (protocollo al §8).
Limite dichiarato. Non ho trovato test pubblici e misurati delle singole clausole (occluder d’angolo, bande vuote) su pipeline di parallasse da depth map. Le clausole sono costruite su evidenze indirette e restano [H] finché non passano il §8. Per Midjourney non ho letto la documentazione ufficiale: uso fonti terze [A].
0. Verdetti in breve
Ipotesi “i modelli obbediscono meglio al posizionamento nominato che alla profondità astratta”: supportata in parte. Le guide ufficiali mostrano posizionamento per angolo o bordo con un oggetto concreto [V]. Non esiste evidenza misurata che richieste astratte di “depth” funzionino, né che falliscano [H]. Conviene costruire la profondità con oggetti nominati e cues di valore/saturazione.
Ipotesi “obbediscono alla negazione spaziale”: non supportata, anzi contraddetta. La negazione è rara nei caption di training e i modelli tendono a generare l’elemento negato [P]. Google raccomanda di descrivere il vuoto in positivo [V]. Midjourney vuole `--no`, non “without” nel testo [A].
Il rischio principale è sui bordi, non sul prompt. Depth Anything V2 sbaglia vicino a strutture sottili e bordi [P], e il warping senza inpainting produce buchi o stiramenti ai disocclusion [P]. La vostra deformazione in-place stira: servono pochi salti di profondità, grandi e morbidi.
Per i modelli aperti (SDXL/Flux) la posizione è debole a parole [P]: meglio un layout greybox come depth control e usare il testo solo per materia e stile [H].
1. Evidenze per obiettivo
(a) Cosa dicono le guide dei generatori
Generatore
Fatto
Tag
Gemini 2.5 Flash Image
Prompt narrativi battono liste di keyword; il linguaggio fotografico (grandangolo, angolo basso, lenti) guida la composizione; template “negative space” con soggetto posizionato in un angolo e fondo vuoto; “semantic negative prompts” (descrivere una strada deserta invece di scrivere no cars); 21:9 supportato; se il rapporto non viene rispettato, fornire un’immagine di riferimento con le dimensioni giuste
[V]
GPT Image 2.5
Specificare composizione e vincoli di posizione; struttura scena, soggetto, dettagli, vincoli; i termini di fotocamera sono cues di aspetto, non simulazione fisica; usare left, right, foreground, background; esclusioni esplicite per testo, logo, watermark
[V]
GPT Image, formato
Lati multipli di 16, massimo 3840, rapporto massimo 3:1; oltre 3.686.400 pixel è sperimentale. 3168×1320 (4,18 MP, 1320 non multiplo di 16) esce dalle specifiche: usare 2560×1088 e fare upscale, oppure 3168×1328 sapendo che è sperimentale. gpt-image-1 chiude il 23 ott 2026, gpt-image-1.5 il 1 dic 2026
[V]
Imagen (Vertex)
Parametro `negative_prompt` dedicato; rapporti elencati 1:1, 3:4, 4:3, 16:9, 9:16, quindi niente 21:9 nativo: generare 16:9 e ritagliare, ricalcolando le bande
[V]
Midjourney V7
`--no` per esclusioni; “don’t/without” nel testo spesso ignorato o invertito; prompt corti; `--ar 21:9`
[A]
Flux.1-dev
Guidance-distilled: niente negative prompt reale, riformulare in positivo. Esistono Flux.1-Depth-dev e ControlNet Union Pro 2.0 (depth: scala 0.8, fine guidance 0.8 nel model card)
[A] / [V]
SDXL
Negative prompt efficace
[A]
(b) Lezioni di animazione e 2.5D → clausole
Lezione
Tag
Clausola derivata
Multiplane: piani dipinti, parti lasciate trasparenti, il vicino scorre di più
[V]
L’occluder è una massa separabile con vuoto attorno
Prospettiva atmosferica: lontano meno contrasto, saturazione, dettaglio; vicino più scuro
[A]
Valori e saturazione dichiarati per piano
Forme a blob leggono come alberi a distanza; il dettaglio solo davanti
[A]
Pochi tronchi spessi, masse grandi
Limited animation: sfondo dipinto fisso, si anima solo ciò che serve; la forza è nel dipinto
[V] generico
Dipingere la sorgente, non la vita
Warp ingenuo: buchi o stiramento ai disocclusion; i metodi seri riempiono con inpainting
[P]
Pochi salti di profondità, morbidi
Depth model: errori alti su strutture sottili e bordi (incluso DA V2)
[P]
Nessun sottile verticale a cavallo di due piani
Casi di fallimento DA V3 raccolti da un utente: pali, cavi, neve, nebbia
[A]
Niente nebbia o neve dipinte sulla scena
Sopravvivono al parallasse: grandi masse, silhouette compatte, bordi morbidi, rampe di valore, terreno che arretra in modo continuo. Falliscono: staccionate, graticci di fogliame, pali e alberi sottili che attraversano il salto di profondità, bordi duri a cavallo di grandi salti, nebbia dipinta che confonde la depth map [H, coerente con le fonti sopra].
(c) Fallimenti spaziali dei modelli
- Sinistra/destra: encoder in stile CLIP vicini al caso (49–52%) [P]. Nei caption solo lo 0,72% usa parole spaziali esplicite, il 64% di queste è left/right, e il flip orizzontale nel training le rende ambigue [P]. Mitigazione: per voi lo specchio è gratis, quindi generate e poi flippate in post se l’occluder cade dal lato sbagliato [H].
- Negazione e relazioni figura/sfondo: FineGRAIN le elenca tra le categorie di errore [P]. Un lavoro AAAI 2026 trova collasso quando si combinano negazione, conteggio e relazioni spaziali nello stesso prompt [P]. Mitigazione: un vincolo di posizione per frase, pochi vincoli in totale.
- Posizione nei modelli aperti: GenEval position circa 0,22 per FLUX.1-dev e 0,34 per SD3.5 Large contro 0,75 per GPT Image 1 High (riportato da un terzo paper) [P, di seconda mano]. I modelli chiusi recenti gestiscono bene posizioni semplici; gli aperti vanno guidati con layout.
- A cosa rispondono: linguaggio fotografico [V], descrizioni narrative [V], oggetti nominati con posizione [V]. Scala (es. “rocce grandi come un’auto”) è plausibile ma non misurata [H].
(d) Cosa non dipingere
- Nuvole e nebbia nelle bande riservate [H]: forme statiche sotto sprite scorrevoli creano doppio moto e parallasse sbagliata; la depth map assegna alla nebbia dipinta una profondità intermedia.
- Bande non “incompiute” [H]: sono calme, non vuote. Gradiente graduato con texture dry-brush, bagliore all’orizzonte, ritmo di valore. Evitare solo forme riconoscibili (nuvole, uccelli, disco solare).
- Foschia atmosferica sì, ma come valore [H]: schiarire e raffreddare i piani lontani va bene; dipingere strati di nebbia con bordi no.
2. Template di brief (slot compilabili)
BEAT: [momento in una riga]
FOCAL SUBJECT: [una grande massa leggibile, piano medio]
NEAR PLANE: [2-3 masse semplici, le più scure e sature]
FOCAL PLANE: [soggetto + terreno, dettaglio pieno, valori medi]
FAR PLANE: [cresta/linea di alberi, pallida, poco contrasto, poco dettaglio]
EDGE OCCLUDER: [oggetto] da [angolo/bordo], max [15]% del frame,
   massa spessa, bordo morbido, niente rami o elementi sottili
FX ANCHORS: [sorgente 1: oggetto, posizione indicativa, dimensione]; [sorgente 2]
RESERVED BANDS: CIELO alto [28]% gradiente calmo; TERRENO basso [12]% nudo
MOOD / LUCE: [ora, direzione luce, meteo senza nebbia visibile]
PALETTE: [3-4 colori + 1 accento caldo per le sorgenti]
STYLE LOCK: [vedi libreria A1]
EXCLUSIONS: [forma positiva + lista corta di backup]
Dopo la scelta del candidato, misurate le coordinate reali (x, y in frazioni) delle sorgenti: la posizione richiesta nel prompt è solo approssimativa.
3. Libreria di clausole per scopo
Base = prompt narrativo per Gemini e GPT Image. Per Gemini aggiungere `aspect_ratio 21:9` via API; per GPT impostare size a parte.
A. Formato e stile
- A1 Style lock (base): `A heavy oil-impasto painting with thick visible palette-knife and bristle strokes, rich matte pigment, ultra-wide 21:9 cinematic landscape of an uninhabited scene.`
- MJ: `oil impasto painting, thick palette-knife strokes, uninhabited --ar 21:9 --style raw`
- SDXL/Flux: stessa frase, dimensioni vicine a 2,33:1 (es. 1536×640 per SDXL [A]) e upscale.
B. Tre piani
- B1 (base): `Composition in three clear planes. Near plane: [two or three large dark simple masses]. Focal plane: [subject] on a [ground] that recedes smoothly. Far plane: [ridge] as a few big soft hazy masses in pale cool tones with low contrast and little detail.`
- B2 Prospettiva atmosferica: `Nearest forms are darkest and most saturated, the far plane is palest and least saturated.`
- B3 Piano medio libero: `The middle distance is kept clear of clutter, so the eye reads one calm path.` Positiva: il piano è calmo perché il resto è semplice.
- MJ: `dark foreground masses, clear middle ground, pale hazy distant ridge, atmospheric perspective`
- SDXL/Flux: come MJ + depth control da greybox (§0.4).
C. Occluder di bordo
- C1 (base): `In the [top-left] corner a single massive [gnarled oak bough] sweeps in and frames the view. It is a thick, nearly black silhouette made of a few large leaf clumps with soft painterly edges, covering no more than one sixth of the frame and leaving the center open.`
- C2 Per occluder da ritagliare a mano: `a solid dark mass with a simple outline, separated from what lies behind it by a clear value step`
- C3 Varianti d’oggetto: `open timber gate leaf of heavy planks`, `low rock ledge`, `broad leaf-laden branch`. Mai cancelli a sbarre, rami sottili o graticci.
- MJ: `huge dark oak bough framing top-left corner` (corto, nome oggetto + angolo).
- SDXL/Flux: greybox con una macchia scura nell’angolo come depth/control image.
D. Sorgenti per gli FX
- D1 Luce (base): `A small iron lantern with a bright warm flame hangs from a short stake; it is the only warm light in the scene, a small isolated glow against dark ground.`
- D2 Camino: `a squat stone chimney with a clearly painted open flue, dark against paler trees, set below the sky band so smoke can rise into clear sky`
- D3 Fuoco: `a small ring of stones holding a low red-orange glow of embers`
- Regola: ogni sorgente su sfondo di valore medio-scuro, mai davanti al cielo riservato, una per FX.
E. Bande riservate
- E1 Cielo: `The upper quarter of the frame is a calm sky, a smooth gradient of [pale color] with faint dry-brush texture and a soft glow at the horizon, an empty clear sky with no cloud shapes, no birds and no sun disc.`
- E2 Terreno: `The bottom strip of the frame is plain [bare earth / mossy ground], uncluttered, with no mist and no objects.`
- MJ: `calm empty gradient sky in top quarter, plain bare ground at bottom --no clouds, fog, birds`
F. Sopravvivenza al parallasse
- F1 (base): `All trunks and poles are thick and few; the scene is built from large shapes, not fine lattices. No tall thin element crosses from the near ground into the sky; tall elements stand fully in the far plane, pale and soft.`
- F2 Bordi: `Edges between planes are soft and painterly, separated by value steps rather than hard outlines.`
G. Esclusioni
- G1 Positiva (preferita): `An uninhabited, silent scene.`
- G2 Backup (Gemini/GPT): `No people, no figures, no text, no signature, no watermark.` Può innescare l’elemento negato [P]: verificare ogni candidato.
- G3 MJ: `--no people, text, signature, watermark, clouds, fog, birds, fence`
- G4 SDXL: negative `people, figures, text, watermark, clouds, fog, mist, fence, twigs, lattice, birds`. Flux: niente negative, usare G1.
- G5 Imagen: `negative_prompt` = `people, text, watermark, clouds, fog, fence`
4. Fallimenti → causa → rimedio
Fallimento
Causa probabile
Rimedio
Occluder assente o a metà immagine
Posizione astratta o a bordo non nominato
C1 con angolo, oggetto e limite di ingombro; re-roll; flip in post
Occluder sul lato sbagliato
Left/right quasi casuale [P]
Flip orizzontale in post
Occluder pieno di rametti
Fogliame = attrattore di dettaglio
C3: massa spessa, niente rami sottili
Nuvole o nebbia dipinte nella banda
Negazione ignorata [P]
E1 in positivo, `--no` o negative dove esiste, scartare il candidato
Cielo piatto e “incompiuto”
Banda descritta come “vuota”
Gradiente con dry-brush e bagliore all’orizzonte
Troppe luci calde
Mood generico invita luci ovunque
D1 “only warm light”, una sorgente per FX
Sorgente senza fonte (fumo senza camino)
FX non dipinta
D2/D3 nel prompt, controllo in checklist
Piano medio ingombrato
Modello riempie lo spazio
B3 + meno oggetti nel prompt
Strappi nel parallasse su pali e rami
Strutture sottili a cavallo di piani [P]
F1, scartare candidati con verticali sottili lunghe
Profondità “piatta”
Nessun cue di valore
B2, scala esplicita, occluder scuro
Persone o testo compaiono
Esclusione negata
G1 + G2, scarto
21:9 non rispettato
Rapporto non nativo
Gemini 21:9 via API; GPT 2560×1088; Imagen 16:9 + crop
5. Checklist pre-generazione (12 voci, sì/no)
#
Voce
Buono
Cattivo
1
Occluder di bordo presente e nominato
`a massive oak bough enters from the top-left corner`
`some branches in front`
2
Occluder ≤ 15–18% e senza elementi sottili
`thick silhouette, a few large leaf clumps`
`delicate hanging twigs and vines`
3
Tre piani con valori diversi
`nearest darkest, far palest`
`deep layered depth`
4
Piano medio libero
`middle distance kept clear`
`a busy market in the middle`
5
Una sorgente luce per FX, isolata
`one small lantern, only warm light`
`glowing lights everywhere`
6
Sorgente fumo dipinta
`stone chimney with open flue`
`a house in the distance`
7
Banda cielo riservata in positivo
`calm gradient sky, no cloud shapes`
`lots of empty space up top`
8
Banda terreno riservata
`plain bare earth strip at the bottom`
`ground with some mist`
9
Nessun sottile verticale tra piani
`few thick trunks, tall elements only far and pale`
`a forest of slender birches, a tall fence`
10
Bordi morbidi, salti di profondità pochi
`soft edges, value steps`
`sharp outlines on everything`
11
Niente nebbia o neve dipinte
`clear air, low haze only as pale tone`
`thick drifting fog everywhere`
12
Una sola costrizione di posizione per frase, formato 21:9 impostato
`Near plane: ... Focal plane: ...` in frasi separate
un’unica frase con sei posizioni
Punteggio: 11–12 genera; 9–10 correggi il brief; sotto 9 riscrivi.
6. Tre brief completi
Ogni brief: prompt narrativo (Gemini / GPT Image), variante Midjourney, note SDXL/Flux.
6.1 Sito d’imboscata nel bosco
Slot. Beat: strada che curva, quiete prima di un’imboscata. Soggetto: quercia abbattuta di traverso sulla strada. Near: ramo di quercia dall’angolo alto-sinistra, due massi muschiosi in basso a destra. Focal: strada incassata. Far: cresta di conifere pallida. FX: lanterna su paletto (bagliore, braci); capanna con camino (fumo). Bande: cielo 25%, terreno 12%. Luce: pomeriggio coperto. Palette: verde muschio, terra d’ombra, grigio ardesia, accento ambra.
Prompt (Gemini / GPT Image).
`A heavy oil-impasto painting with thick visible palette-knife and bristle strokes and rich matte pigment, an ultra-wide 21:9 cinematic landscape of an uninhabited forest road bending through dark conifers, late afternoon under an overcast sky. Composition in three clear planes. Near plane: in the top-left corner a single massive gnarled oak bough sweeps in and frames the view; it is a thick, nearly black-green silhouette made of a few large leaf clumps with soft painterly edges, covering no more than one sixth of the frame and leaving the center open. Two large mossy boulders sit low in the bottom-right corner, dark and simple. Focal plane: a sunken dirt road bends away through a middle distance kept clear of clutter, so the eye reads one calm path; a huge toppled oak lies across the road a little right of center, a solid barricade with a clean readable silhouette. A small iron lantern with a bright warm flame hangs from a short wooden stake beside the fallen tree, the only warm light in the scene, a small isolated glow against dark ground. Far plane: a dense ridge of conifers drawn as a few big soft hazy masses in cool grey-green with low contrast and little detail; in a small clearing on the ridge stands a tiny charcoal burner’s hut with a squat stone chimney whose open flue is painted dark against the paler trees. The upper quarter of the frame is a calm overcast sky, a smooth gradient of pale grey-green with faint dry-brush texture and a soft glow at the horizon, an empty clear sky with no cloud shapes, no birds and no sun. The bottom strip of the frame is plain dark road mud and leaf litter, uncluttered, with no mist. Nearest forms are darkest and most saturated, the far ridge palest and least saturated. Trunks are few and thick; the forest is built from large shapes, not fine lattices. An uninhabited, silent scene. No people, no figures, no text, no signature, no watermark. Wide-angle, eye-level camera, deep focus.`
Midjourney. `uninhabited forest road at a bend, oil impasto painting, thick palette-knife strokes, huge dark oak bough framing top-left corner, mossy boulders bottom-right, toppled oak across the road, small lantern on a stake, hazy conifer ridge with tiny hut and stone chimney, calm empty pale overcast gradient sky in top quarter, plain muddy road at bottom, atmospheric perspective --ar 21:9 --no people, text, signature, watermark, clouds, fog, birds, fence`
SDXL/Flux. Stessa narrativa per Flux (senza negative); SDXL in tag + negative G4. Greybox: macchia scura nell’angolo alto-sinistra, striscia chiara in alto, striscia piatta in basso, depth ControlNet.
6.2 Soglia di partenza all’alba
Slot. Beat: ultima soglia prima di lasciare il villaggio, speranza e inquietudine. Soggetto: arco di pietra del cancello con la strada che esce verso la valle. Near: anta di cancello in assi pesanti dal bordo destro (≤18% di larghezza). Focal: arco e strada in terra battuta. Far: valle e montagne viola-azzurre. FX: lanterna ancora accesa sul pilastro, camino dell’ultima casa. Bande: cielo 30%, terreno basso 12%. Luce: sole basso, ombre azzurre. Palette: pesca, lavanda, blu ardesia, accento ambra.
Prompt (Gemini / GPT Image).
`A heavy oil-impasto painting with thick visible palette-knife and bristle strokes and rich matte pigment, an ultra-wide 21:9 cinematic landscape at dawn of an uninhabited village threshold. Composition in three clear planes. Near plane: from the right edge a single open timber gate leaf of heavy planks hangs on thick iron hinges, a dark simple mass with soft painterly edges, covering no more than one fifth of the frame and leaving the center open. Focal plane: a weathered stone gatehouse arch stands at the edge of the village, a large clean silhouette, and a packed-earth road runs through it and recedes smoothly into the valley, with the middle distance kept clear of clutter. A small iron lantern on the gatepost still burns with a warm flame, the only warm light in the scene, a small isolated glow. Beyond the arch, at the far edge of the village, a squat stone chimney with a clearly painted open flue rises from the last cottage roof, dark against the pale valley. Far plane: a wide valley and distant mountains as a few big soft masses in pale violet-blue with low contrast and little detail. The upper 30 percent of the frame is a calm dawn sky, a smooth gradient from pale gold at the horizon to soft rose-lavender above, with faint dry-brush texture, an empty clear sky with no cloud shapes, no birds and no sun disc. The bottom strip of the frame is plain bare road verge and short dry grass, uncluttered, with no mist. Low sun, long cool blue shadows, palette of peach, lavender, slate blue and one warm amber accent. Nearest forms are darkest and most saturated, the far mountains palest. Tall elements stand only in the far plane and are thick and soft; no fences, no thin poles. An uninhabited, silent scene. No people, no figures, no text, no signature, no watermark. Wide-angle, eye-level camera, deep focus.`
Midjourney. `uninhabited village gate at dawn, oil impasto painting, thick palette-knife strokes, heavy open timber gate leaf from right edge, stone gatehouse arch with lit lantern on the post, earth road into a pale violet valley, tiny cottage with stone chimney, calm empty gold-to-rose gradient sky in top third, plain verge at bottom, atmospheric perspective --ar 21:9 --no people, text, signature, watermark, clouds, fog, birds, fence`
SDXL/Flux. Come 6.1; greybox con macchia scura sul bordo destro.
6.3 Accampamento in rovina, dopo
Slot. Beat: calma dopo l’attacco, un campo abbandonato che fuma ancora. Soggetto: tenda di tela crollata e carro rovesciato. Near: cornice di roccia dall’angolo basso-sinistra. Focal: tenda, carro, casse sparse a terra. Far: linea di alberi bruciacchiati nella foschia del crepuscolo. FX: cerchio di pietre con braci (bagliore, braci, colonna di fumo che sale nel cielo), lanterna sul carro. Bande: cielo 28%, terreno battuto 12%. Palette: carbone, grigio cenere, terra bruciata, accento arancio brace, indaco.
Prompt (Gemini / GPT Image).
`A heavy oil-impasto painting with thick visible palette-knife and bristle strokes and rich matte pigment, an ultra-wide 21:9 cinematic landscape at dusk of an abandoned, ruined camp after a raid. Composition in three clear planes. Near plane: in the bottom-left corner a low broad rock ledge rises as a solid nearly black silhouette with soft painterly edges, covering no more than one sixth of the frame and leaving the center open. Focal plane: a collapsed canvas tent and an overturned supply cart lie on trampled bare earth, big simple shapes with clean silhouettes, crates and broken planks scattered flat on the ground; nothing stands upright and thin, no poles, no banners, no spears. A small ring of stones holds a low red-orange glow of smoldering embers, an isolated warm source against dark ground, and a single small iron lantern lies on the cart bed with a weak flame, the only other warm light. Middle distance kept clear of clutter. Far plane: a scorched line of trees as a few big soft masses in pale ashen indigo haze, low contrast, little detail. The upper 28 percent of the frame is a calm dusk sky, a smooth gradient from deep indigo above to dim ember-orange at the horizon with faint dry-brush texture, an empty clear sky with no cloud shapes, no smoke, no birds. The bottom strip of the frame is plain trampled earth, uncluttered, with no mist. Nearest forms darkest and most saturated, the far trees palest. An uninhabited, silent scene. No people, no figures, no bodies, no text, no signature, no watermark. Wide-angle, eye-level camera, deep focus.`
Midjourney. `abandoned ruined camp at dusk, oil impasto painting, thick palette-knife strokes, dark rock ledge in bottom-left corner, collapsed canvas tent, overturned cart, small ring of stones with smoldering embers, lantern on cart, ashen tree line in haze, calm empty indigo-to-orange gradient sky in top quarter, bare trampled earth at bottom --ar 21:9 --no people, bodies, text, signature, watermark, clouds, smoke, fog, birds`
SDXL/Flux. Come 6.1; greybox con macchia scura nell’angolo basso-sinistra.
7. Le dieci regole a più alto impatto
Dipingi la sorgente, non la vita: ogni FX ha un oggetto piccolo, isolato, a contrasto (lanterna, camino, cerchio di braci).
Oggetti nominati a bordi nominati battono “depth” astratta [V per il posizionamento, H per il confronto].
Il vuoto si descrive in positivo (“calm gradient sky”); le esclusioni sono solo backup e si verificano a vista [P].
I tre piani li fanno valore, saturazione e dettaglio: vicino scurissimo, lontano pallido e povero di dettaglio.
Un solo occluder, ≤ 15–18% del frame, massa spessa, bordo morbido, mai rami sottili o cancelli a sbarre.
Salti di profondità solo dove li volete (bordo dell’occluder, silhouette focale); il terreno arretra in continuo; nessun sottile verticale a cavallo di due piani [P].
Bande riservate calme, non vuote: cielo ~25–30%, terreno ~10–15%, gradiente con dry-brush, niente forme di nuvole, uccelli o nebbia [H].
Per i modelli aperti usate un layout (greybox come depth control) e lasciate al testo materia e stile [H]; per i chiusi una clausola di layout breve.
Un vincolo di posizione per frase, prompt narrativo, style lock all’inizio, pochi vincoli totali [P].
Scegliete con la checklist e misurate dopo: 4–8 candidati, flip in post se serve, coordinate reali delle sorgenti prese dall’immagine scelta, non dal prompt.
8. Protocollo A/B e fonti
Protocollo (per convalidare le [H]). Per ogni brief generate 6 candidati per braccio e punteggiate con la checklist del §5. Bracci: (1) piani astratti vs oggetti nominati; (2) esclusione negata vs vuoto positivo; (3) solo testo vs layout di riferimento (immagine con dimensioni 21:9 per Gemini, depth control per Flux/SDXL). Metrica di parallasse dalla depth map baked: quota di pixel con gradiente di profondità alto che coincidono con strutture strette (larghezza < 1% del frame), da minimizzare. Registrate il tasso di successo per voce di checklist per generatore: avrete le prime misure vostre.
Fonti principali.
- Google, guida al prompting di Gemini 2.5 Flash Image: https://developers.googleblog.com/how-to-prompt-gemini-2-5-flash-image-generation-for-the-best-results/
- Google, nuovi aspect ratio (21:9): https://developers.googleblog.com/zh-hans/gemini-2-5-flash-image-now-ready-for-production-with-new-aspect-ratios/
- Vertex AI, scheda Gemini 2.5 Flash Image: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-5-flash-image?authuser=9
- Vertex AI, negative prompt per Imagen: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/image/omit-content-using-a-negative-prompt
- OpenAI, guida GPT Image 2.5: https://developers.openai.com/api/docs/guides/image-prompting.md
- OpenAI Academy, creare immagini: https://openai.com/academy/image-generation
- Hoehing et al., left/right nei modelli visione-linguaggio: https://arxiv.org/pdf/2311.11477
- SR4G, relazioni spaziali nei caption: https://arxiv.org/html/2403.00587v1
- Vatsa et al., Right Looks, Wrong Reasons (AAAI 2026): https://ojs.aaai.org/index.php/AAAI/article/view/41337
- FineGRAIN, categorie di errore: https://arxiv.org/pdf/2512.02161
- Nucleus-Image, tabella GenEval: https://arxiv.org/pdf/2604.12163
- VisTa3D, strutture sottili e DA V2: https://arxiv.org/pdf/2608.20740
- Shih et al., 3D Photography con layered depth inpainting: https://arxiv.org/pdf/2004.04727
- Niklaus et al., 3D Ken Burns: https://arxiv.org/pdf/1909.05483
- Multiplane camera: https://en.wikipedia.org/wiki/Multiplane_camera
- Limited animation: https://pixune.com/blog/what-is-limited-animation/
- Prospettiva atmosferica per sfondi 2D [A]: https://www.sprite-ai.art/blog/pixel-art-backgrounds
- Model card FLUX.1-dev ControlNet Union Pro 2.0: https://huggingface.co/Runware/FLUX.1-dev-ControlNet-Union-Pro-2.0/blob/main/README.md
- Midjourney V7, guida di terzi [A]: https://claudeskills.info/skills/mike-coulbourn/claude-vibes/midjourney-prompting/
- Flux senza negative prompt [A]: https://github.com/DavidDragonsage/FooocusPlus/wiki/Prompting
- Casi di fallimento DA V3 [A]: https://huggingface.co/datasets/pilot4532/DepthAnything_v3_test/blob/main/README.md

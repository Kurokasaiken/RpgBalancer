/**
 * goblin-accepted-r008 — the converged Italian manuscript for
 * «Sterminio Goblin» (mw-web-debate run 20261018-narration-v3,
 * artifact-r008 sha256 eb25ec30…).
 *
 * Fixture contract (r008 §A.4): this kit MUST produce 0 hard issues
 * under validateNodeCopyR8 with the epistemic contract
 * (.mw/specs/quest-goblin-narration/contract-v1.json), and its only
 * soft flags must be the ones listed in `reviewedSoftFlags`. The test
 * runs the real validator — the claim is verified, never asserted.
 *
 * Every verdict/attack line that asserts a concrete physical event
 * carries its `effectBindings` sidecar (assertion → canonical effectId
 * of the SAME band).
 */

import type { NarratedNodeCopyR8 } from '@/balancing/config/idleVillage/quests/generation/narrative/validateCopy';

export const GOBLIN_ACCEPTED_R008: Record<string, NarratedNodeCopyR8> = {
  /* ---- F1 — Esplorazione ---- */
  'esplora': {
    title: 'Esplorazione',
    transit: 'Gli alberi chiudono la luce alle vostre spalle. Tra le felci umide l’aria è ferma e sa di muschio bagnato e legna marcia.',
    body: 'Il sottobosco stringe il passo in una parete di tronchi caduti. Il folto tace da ogni lato, e non dice nulla di chi lo abita.',
  },
  'tracce-per': {
    title: 'Esamina il terreno',
    body: 'Vi piegate dove il muschio cede alla terra scura, cercando tra le foglie bagnate un segno.',
    option: { label: 'Esamina il terreno' },
    verdictFlavor: {
      bigwin: {
        text: 'Sotto le foglie marce affiorano impronte leggere e, più avanti nell’erba alta, il riflesso sottile di un filo teso a mezza gamba, che corre verso il campo.',
        effectBindings: [
          { assertion: 'affiorano impronte leggere', effectId: 'impronte-affiorano' },
          { assertion: 'il riflesso sottile di un filo teso', effectId: 'filo-avvistato' },
        ],
      },
      win: {
        text: 'Talloni nudi nella terra umida e rami spezzati bassi disegnano una traccia obliqua che punta verso l’interno del bosco.',
        effectBindings: [
          { assertion: 'disegnano una traccia obliqua che punta', effectId: 'traccia-disegnata' },
        ],
      },
      almost: {
        text: 'Impronte sovrapposte e confuse nella terra molle: qualcuno è passato, ma il verso si perde tra le radici.',
        effectBindings: [
          { assertion: 'il verso si perde tra le radici', effectId: 'verso-perso' },
        ],
      },
      fail: 'Solo radici scoperte e terra smossa dalla pioggia. Il suolo non vi concede nulla.',
      epicfail: {
        text: 'Il piede cede sul muschio fradicio e uno schianto di rami secchi rimbalza nel silenzio del bosco.',
        effectBindings: [
          { assertion: 'Il piede cede sul muschio fradicio', effectId: 'piede-cede' },
          { assertion: 'uno schianto di rami secchi rimbalza nel silenzio', effectId: 'schianto-rimbalza' },
        ],
      },
    },
  },
  'tracce-perfor': {
    title: 'Esamina dall’alto',
    body: 'Il tronco della quercia è umido e ruvido sotto i palmi; più in alto la cupola di foglie chiude la vista su tutto ciò che sta oltre.',
    option: { label: 'Esamina dall’alto' },
    verdictFlavor: {
      bigwin: {
        text: 'Dall’alto il bosco cambia volto: un filo di fumo sale dritto sopra la radura dell’accampamento, il calpestio gira a spirale attorno ai fuochi e, lontano dalle tende, un lembo di sottobosco appare rimesso a posto con troppa cura, come una ferita ricucita.',
        effectBindings: [
          { assertion: 'un filo di fumo sale dritto sopra la radura', effectId: 'fumo-sulla-radura' },
          { assertion: 'il calpestio gira a spirale attorno ai fuochi', effectId: 'calpestio-spirale' },
          { assertion: 'un lembo di sottobosco appare rimesso a posto', effectId: 'lembo-ricomposto' },
        ],
      },
      win: {
        text: 'Tra i rami alti scorgete il fumo grigio dell’accampamento e, lontano dai fuochi, un lembo di sottobosco rimesso a posto con troppa cura, come una ferita ricucita.',
        effectBindings: [
          { assertion: 'scorgete il fumo grigio dell’accampamento', effectId: 'fumo-tra-i-rami' },
          { assertion: 'un lembo di sottobosco rimesso a posto con troppa', effectId: 'lembo-ricomposto' },
        ],
      },
      almost: {
        text: 'Il vento apre le fronde per un istante: scorgete un filo di fumo grigio tra le cime, prima che le foglie richiudano la vista.',
        effectBindings: [
          { assertion: 'scorgete un filo di fumo grigio tra le cime', effectId: 'fumo-spiraglio' },
        ],
      },
      fail: 'La chioma è un muro verde e le braccia bruciano per la salita: scendete con la corteccia sotto le unghie senza aver visto oltre gli alberi.',
      epicfail: {
        text: 'Il ramo marcio cede di schianto sotto il peso: precipitate tra i rami bassi e battete duro la spalla a terra.',
        effectBindings: [
          { assertion: 'Il ramo marcio cede di schianto', effectId: 'ramo-cede' },
          { assertion: 'battete duro la spalla a terra', effectId: 'caduta-spalla' },
        ],
      },
    },
  },

  /* ---- F2 — Bottino (recupero diretto) ---- */
  'bottino': {
    title: 'Ciò che era nascosto',
    transit: 'Il lembo di sottobosco rimesso a posto con troppa cura è ancora là, in disparte dai fuochi.',
    body: 'Le foglie vengono via in una sola manata. Sotto, in una buca foderata di pelli, giace ciò che i goblin avevano sepolto di nascosto: allungate le mani e lo tirate fuori.',
  },

  /* ---- F3 — Regole d'ingaggio ---- */
  'accampamento': {
    title: 'Regole d’ingaggio',
    transit: 'Oltre l’ultima cortina di felci l’odore acre di grasso rancido vi investe nella penombra.',
    body: 'Le braci basse ardono al centro della radura. Tra le tende storte si muovono sagome corte: resta solo da scegliere come entrare.',
  },
  'stealth': {
    title: 'Muoviti nell’ombra',
    body: 'Avanzate piegati dove la penombra del sottobosco tocca il margine della radura, misurando ogni appoggio.',
    option: { label: 'Muoviti nell’ombra' },
    verdictFlavor: {
      bigwin: {
        text: 'Scivolate oltre un filo teso senza muovere un soffio: siete già alle loro spalle mentre fissano ancora il fuoco.',
        effectBindings: [
          { assertion: 'Scivolate oltre un filo teso', effectId: 'filo-superato' },
        ],
      },
      win: {
        text: 'Un passo, una pausa, un altro passo nell’ombra. Superate il perimetro esterno senza che una sola foglia parli.',
        effectBindings: [
          { assertion: 'Superate il perimetro esterno', effectId: 'perimetro-superato' },
        ],
      },
      almost: {
        text: 'Sfiorate il filo e qualcosa tintinna accanto alla postazione: vicino al fuoco una testa si volta, poi esita.',
        effectBindings: [
          { assertion: 'Sfiorate il filo e qualcosa tintinna accanto alla postazione', effectId: 'filo-tintinna' },
          { assertion: 'una testa si volta, poi esita', effectId: 'testa-si-volta' },
        ],
      },
      fail: {
        text: 'Un filo vi morde lo stivale e un tonfo rimbomba accanto alla sentinella: le sagome attorno al fuoco scattano in piedi.',
        effectBindings: [
          { assertion: 'Un filo vi morde lo stivale', effectId: 'filo-morde' },
          { assertion: 'le sagome attorno al fuoco scattano in piedi', effectId: 'sagome-scattano' },
        ],
      },
      epicfail: {
        text: 'Inciampate in pieno nel filo teso e il carico della postazione precipita in un fracasso: il campo intero si rovescia contro di voi.',
        effectBindings: [
          { assertion: 'Inciampate in pieno nel filo teso', effectId: 'inciampo-filo' },
          { assertion: 'il campo intero si rovescia contro di voi', effectId: 'campo-rovescia' },
        ],
      },
    },
  },
  'assalto': {
    title: 'Carica a ferro scoperto',
    body: 'Stringete le impugnature e vi lanciate fuori dalla macchia, puntando dritto verso il cerchio del fuoco.',
    option: { label: 'Carica a ferro scoperto' },
    verdictFlavor: {
      bigwin: {
        text: 'Travolgete la barricata all’ingresso di puro slancio: siete già sopra i fuochi prima ancora che il primo grido prenda forma.',
        effectBindings: [
          { assertion: 'Travolgete la barricata all’ingresso', effectId: 'breccia-pre-reazione' },
          { assertion: 'siete già sopra i fuochi prima', effectId: 'sopra-i-fuochi' },
        ],
      },
      win: {
        text: 'Sfondate il margine del campo a spallate, portando le lame dentro il cerchio di luce.',
        effectBindings: [
          { assertion: 'Sfondate il margine del campo a spallate', effectId: 'margine-sfondato' },
        ],
      },
      almost: {
        text: 'La terra molle frena gli stivali all’ultimo passo: entrate nella radura mentre le prime guardie già si alzano.',
        effectBindings: [
          { assertion: 'La terra molle frena gli stivali', effectId: 'terra-frena' },
          { assertion: 'le prime guardie già si alzano', effectId: 'guardie-alzate' },
        ],
      },
      fail: {
        text: 'Il fango sotto i piedi spezza lo slancio della corsa; davanti ai fuochi il muro di punte è già serrato.',
        effectBindings: [
          { assertion: 'spezza lo slancio della corsa', effectId: 'slancio-spezzato' },
          { assertion: 'il muro di punte è già serrato', effectId: 'muro-serrato' },
        ],
      },
      epicfail: {
        text: 'Il piede scivola nella melma in piena corsa: cadete in avanti contro la barricata con la guardia aperta.',
        effectBindings: [
          { assertion: 'Il piede scivola nella melma', effectId: 'piede-melma' },
          { assertion: 'cadete in avanti contro la barricata', effectId: 'caduta-barricata' },
        ],
      },
    },
  },

  /* ---- F4 — Combattimento ---- */
  'combattimento': {
    title: 'Ferro e cenere',
    transit: 'Il respiro si chiude in gola. Poi resta solo il rumore del ferro.',
    body: 'Tizzoni calpestati, urla rauche che rimbalzano tra i tronchi e il sapore caldo del rame sulla lingua. Ogni sagoma intorno alle braci ha denti e lama.',
    attackLines: {
      bigwin: {
        text: 'Tutto il peso del corpo scende nel fendente e sfonda la guardia davanti a voi.',
        effectBindings: [{ assertion: 'sfonda la guardia davanti a voi', effectId: 'colpo-supera-guardia' }],
      },
      win: {
        text: 'L’urto secco dell’acciaio spezza il legno degli scudi, e il rumore resta nelle orecchie.',
        effectBindings: [{ assertion: 'spezza il legno degli scudi', effectId: 'impatto-legno-scudi' }],
      },
      almost: {
        text: 'Il fuoco fa di ogni lama un lampo storto: il taglio morde, ma di striscio.',
        effectBindings: [{ assertion: 'il taglio morde, ma di striscio', effectId: 'taglio-di-striscio' }],
      },
      fail: {
        text: 'Il colpo muore sul cuoio unto e sul legno storto, lasciando il polso vibrare a vuoto.',
        effectBindings: [{ assertion: 'Il colpo muore sul cuoio unto e sul legno', effectId: 'colpo-arrestato' }],
      },
      epicfail: {
        text: 'La cenere scivolosa tradisce il tallone e un urto da un fianco vi riversa il fiato in gola.',
        effectBindings: [
          { assertion: 'La cenere scivolosa tradisce il tallone', effectId: 'appoggio-perso' },
          { assertion: 'un urto da un fianco vi riversa il fiato', effectId: 'contraccolpo' },
        ],
      },
    },
  },

  /* ---- F5 — Incalzare ---- */
  'incalzare': {
    title: 'Inseguimento',
    transit: 'Le ultime braci fumano sulla terra calpestata. Verso l’interno del bosco si sente il fruscio convulso di chi scappa nella notte.',
    body: 'Chi è rimasto in piedi si butta tra gli alberi senza voltarsi, inghiottito a pezzi dall’oscurità: una schiena, un ansimo, un ramo che oscilla.',
  },
  'incalza-check': {
    title: 'Incalza i fuggiaschi',
    body: 'Vi lanciate sotto le fronde basse dietro il rumore dei passi in fuga, dove il terreno scende ripido tra pietre umide e radici.',
    option: { label: 'Incalza i fuggiaschi' },
    verdictFlavor: {
      bigwin: {
        text: 'Li raggiungete dove la forra stringe il passo, e il bosco si fa muto di colpo.',
        effectBindings: [
          { assertion: 'Li raggiungete dove la forra stringe il passo', effectId: 'raggiunti-forra' },
          { assertion: 'il bosco si fa muto di colpo', effectId: 'bosco-muto' },
        ],
      },
      win: {
        text: 'Il vostro passo è più lungo del loro sulla salita di pietra: il fruscio davanti a voi si spegne sotto i colpi.',
        effectBindings: [
          { assertion: 'il fruscio davanti a voi si spegne sotto i colpi', effectId: 'fruscio-si-spegne' },
        ],
      },
      almost: {
        text: 'La gola brucia ad ogni respiro; li urtate laggiù in fondo alla forra, ma la macchia si richiude sulle schiene più rapide.',
        effectBindings: [
          { assertion: 'li urtate laggiù in fondo alla forra', effectId: 'urtati-in-fondo' },
          { assertion: 'la macchia si richiude sulle schiene più rapide', effectId: 'macchia-richiude' },
        ],
      },
      fail: {
        text: 'Le pietre bagnate vi tradiscono il passo e la macchia se li riprende prima che le lame arrivino.',
        effectBindings: [
          { assertion: 'Le pietre bagnate vi tradiscono il passo', effectId: 'pietre-tradiscono' },
          { assertion: 'la macchia se li riprende prima', effectId: 'macchia-riprende' },
        ],
      },
      epicfail: {
        text: 'Scivolate lungo la scarpata battendo duro contro la roccia viva, mentre i passi in fuga si perdono.',
        effectBindings: [
          { assertion: 'Scivolate lungo la scarpata', effectId: 'scivolata-scarpata' },
          { assertion: 'battendo duro contro la roccia viva', effectId: 'battuta-roccia' },
        ],
      },
    },
  },

  /* ---- F6 — Razzia ---- */
  'esplora-extra': {
    title: 'Tra le ceneri',
    transit: 'Il silenzio ricade sulla radura devastata, rotto solo dallo scricchiolio dei legni anneriti dal fuoco.',
    body: 'Attorno ai tizzoni spenti restano teli squarciati e cumuli di strame fumante che la fiamma non ha ancora consumato del tutto.',
  },
  'cerca': {
    title: 'Fruga tra le braci',
    body: 'Sollevate i teli anneriti col piatto della lama, cercando a tentoni nel tepore acre che sale dai resti del campo.',
    option: { label: 'Fruga tra le braci' },
    verdictFlavor: {
      bigwin: {
        text: 'Sotto lo strato più fondo le dita incontrano il cuoio pesante di una cassa risparmiata dalle fiamme.',
        effectBindings: [
          { assertion: 'le dita incontrano il cuoio pesante di una cassa', effectId: 'cassa-sotto-lo-strato' },
        ],
      },
      win: {
        text: 'Tra i resti anneriti tirate fuori ciò che il fuoco non è riuscito a divorare.',
        effectBindings: [
          { assertion: 'tirate fuori ciò che il fuoco non è riuscito', effectId: 'resti-tirati-fuori' },
        ],
      },
      almost: {
        text: 'Una presa corta nel fumo, mentre un sostegno bruciato cede a un soffio dalla spalla.',
        effectBindings: [
          { assertion: 'Una presa corta nel fumo', effectId: 'presa-corta' },
          { assertion: 'un sostegno bruciato cede a un soffio', effectId: 'sostegno-cede' },
        ],
      },
      fail: {
        text: 'Solo cenere calda che vi si attacca ai palmi attraverso i guanti.',
        effectBindings: [
          { assertion: 'cenere calda che vi si attacca ai palmi', effectId: 'cenere-ai-palmi' },
        ],
      },
      epicfail: {
        text: 'La trave annerita della tenda cede di schianto, rovesciandovi addosso una pioggia di braci ardenti e legno spaccato.',
        effectBindings: [
          { assertion: 'La trave annerita della tenda cede di schianto', effectId: 'trave-cede' },
          { assertion: 'una pioggia di braci ardenti e legno spaccato', effectId: 'pioggia-braci' },
        ],
      },
    },
  },

  /* ---- F7 — Ritorno e agguato ---- */
  'ritorno': {
    title: 'Il ritorno',
    body: 'L’aria si fa più fredda sotto le chiome alte. Qualcuno allenta la presa sull’elsa — poi un ramo schiocca dove il vento non soffia.',
  },
  'agguato': {
    title: 'Quelli che erano rimasti',
    body: 'I goblin superstiti vi stavano aspettando. Portano ancora addosso il fumo del loro campo: vi hanno seguito fin qui, e ora escono dalle fronde senza un grido, con i denti già scoperti.',
  },
  'agguato-scelta': {
    title: 'Accerchiati',
    transit: 'Le frecce vibrano ancora nei tronchi attorno a voi.',
    body: 'Lame basse chiudono il passo tra gli alberi, e il ringhio sale da ogni lato.',
  },
  'ultimo-scontro': {
    title: 'L’ultimo assalto',
    transit: 'Le spalle si toccano. L’urto arriva da ogni lato.',
    body: 'Si gettano sugli scudi senza badare al ferro; dalle loro gole non esce più nessuna parola, solo un respiro lungo e basso, a denti stretti.',
    attackLines: {
      bigwin: {
        text: 'Tutta la furia della mischia si rovescia in un solo fendente, e il cerchio si apre.',
        effectBindings: [{ assertion: 'il cerchio si apre', effectId: 'fendente-apre' }],
      },
      win: {
        text: 'L’acciaio risponde all’acciaio con un suono corto che taglia il ringhio.',
        effectBindings: [{ assertion: 'L’acciaio risponde all’acciaio', effectId: 'acciaio-su-acciaio' }],
      },
      almost: {
        text: 'Le lame si cercano nella penombra e si trovano solo a metà.',
        effectBindings: [{ assertion: 'si trovano solo a metà', effectId: 'lame-a-meta' }],
      },
      fail: {
        text: 'I denti stridono sullo scudo mentre la linea tiene per un soffio.',
        effectBindings: [{ assertion: 'la linea tiene per un soffio', effectId: 'linea-tiene' }],
      },
      epicfail: {
        text: 'Un contraccolpo dal buio vi toglie il terreno da sotto i piedi per un istante lunghissimo.',
        effectBindings: [{ assertion: 'vi toglie il terreno da sotto i piedi', effectId: 'contraccolpo-appoggio' }],
      },
    },
  },

  /* ---- Conclusione ---- */
  'fine': {
    title: 'Cenere fredda',
    transit: 'Gli alberi si diradano nel grigio dell’alba; l’odore di fumo e ferro vi resta cucito addosso.',
    body: 'Sulle mani resta il segno della notte, mentre l’ombra degli alberi si richiude alle vostre spalle.',
    closingLine: 'Nel folto il fumo sale ancora dritto, ma ormai non chiama più nessuno.',
  },
};

/** Soft flags the kit legitimately raises — each must be justified by a
 *  human reviewer; an UNLISTED flag fails the test (r008 fixture
 *  contract). */
export const GOBLIN_R008_REVIEWED_SOFT_FLAGS: { code: string; stem: string; reason: string }[] = [
  {
    code: 'PROP_PROPAGATION',
    stem: 'post',
    reason: "'postazione/posto' ricorre — il filo d'allarme corre alla postazione della sentinella (ruling Director 2026-10-23: campanelli rimossi, l'allarme è visivo/acustico alla base): prop canonico del nuovo meccanismo, non inventato",
  },
  {
    code: 'PROP_PROPAGATION',
    stem: 'pied',
    reason: "'piede/piedi' ricorre — anatomia condivisa dei fail fisici (piede che cede, scivola, perde appoggio): dispersione tematica, non prop inventato",
  },
  { code: 'LEXICAL_REPETITION', stem: 'pied', reason: 'idem — ricorrenza tematica tra nodi a esito fisico' },
  {
    code: 'PROP_PROPAGATION',
    stem: 'lat',
    reason: "«da ogni lato» ricorre — filler tematico (non un prop inventato); segnalato per revisione manuale in IT",
  },
  {
    code: 'PROP_PROPAGATION',
    stem: 'chiud',
    reason: "'chiudere/chiude' — verbo tematico della caccia (chiudere i fuggiaschi, la linea si chiude): lessico condiviso",
  },
  {
    code: 'PROP_PROPAGATION',
    stem: 'richiud',
    reason: "'si richiude' — eco voluta di 'chiudere' tra caccia ed epilogo (la linea si richiude → la foresta si richiude)",
  },
  {
    code: 'PROP_PROPAGATION',
    stem: 'umid',
    reason: "«terra umida» — texture canonica del bosco (contratto.world.texture.touch): motivo intenzionale",
  },
  {
    code: 'PROP_PROPAGATION',
    stem: 'bagn',
    reason: "'bagnato/bagnarsi' — stessa texture umida del bosco (pioggia/fango): motivo coerente col mondo chiuso",
  },
  {
    code: 'PROP_PROPAGATION',
    stem: 'ced',
    reason: "'cede/cedere' — verbo canonico dei fallimenti fisici (ramo/terreno/presa che cede): lessico dei verdictFacts.fail",
  },
  {
    code: 'PROP_PROPAGATION',
    stem: 'cerc',
    reason: "'cerca/cercare' — verbo dell'esplorazione (cercare tracce/frugare): azione canonica del kit",
  },
  {
    code: 'PROP_PROPAGATION',
    stem: 'spezz',
    reason: "'spezza/spezzare' — texture d'impatto del combattimento (attackLines/verdicts): lessico canonico F4",
  },
  {
    code: 'PROP_PROPAGATION',
    stem: 'scopert',
    reason: "'scoperto/scoperta' — motivo del rischio in F3 (a ferro scoperto) e dell'agguato (scoperti): coerente col tema stealth/assalto",
  },
  {
    code: 'PROP_PROPAGATION',
    stem: 'schiant',
    reason: "'schianto' — texture acustica degli epicfail fisici (caduta dalla quercia, legno che cede): canale sound canonico",
  },
  {
    code: 'PROP_PROPAGATION',
    stem: 'sal',
    reason: "'sale/salire' — verbo dell'arrampicata (tracce-perfor) e delle fughe in salita: azione canonica",
  },
  {
    code: 'PROP_PROPAGATION',
    stem: 'bruci',
    reason: "'brucia/bruciato' — texture del campo espugnato (cenere, tende bruciate): canale smell/light canonico",
  },
  {
    code: 'PROP_PROPAGATION',
    stem: 'rest',
    reason: "'resta/restare' — verbo di rimanenza («ciò che resta», «restano a guardia»): lessico della coda della quest",
  },
  { code: 'LEXICAL_REPETITION', stem: 'rest', reason: 'idem — alta frequenza ma semanticamente corretta' },
  {
    code: 'PROP_PROPAGATION',
    stem: 'scivol',
    reason: "'scivola/scivolare' — pericolo ambientale canonico del vocab (rocce scivolose, scivolare nel fango): prop ammesso",
  },
  {
    code: 'PROP_PROPAGATION',
    stem: 'soffi',
    reason: "'soffio' — texture leggera (soffio di vento/fiato): canale touch/sound canonico",
  },
  {
    code: 'PROP_PROPAGATION',
    stem: 'camp',
    reason: "'campo/filo d'allarme' — l'accampamento goblin e il filo d'allarme sono luogo/prop canonici del vocab e del contratto",
  },
  {
    code: 'PROP_PROPAGATION',
    stem: 'gol',
    reason: "'gola' — texture fisica (grido strozzato in gola) nei nodi di caccia/assalto: anatomia condivisa, non prop",
  },
  {
    code: 'PROP_PROPAGATION',
    stem: 'urt',
    reason: "'urto/urtare' — texture d'impatto condivisa tra caccia e ultimo scontro: lessico fisico canonico",
  },
];

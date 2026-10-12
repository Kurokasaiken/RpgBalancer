/**
 * impr002Miniera.it — Italian locale overlay for `gen-impr002-miniera`
 * (R-168: facts-locked peer render, NOT a literal translation).
 *
 * The English scenario is canonical; this overlay carries the same
 * presentation in native Italian — concrete, terse, per the writing
 * contract (QUEST_IMPRINTS §Contratto-di-scrittura). `lockedFacts` pins
 * the terms that must survive: the nine trapped miners, the foreman, the
 * register, the drag marks. The parity test enforces them.
 *
 * Regenerable by design: a future narrate Pass-5 run can emit this exact
 * shape and replace the hand-authored render.
 */

import type { ImprintLocaleOverlay } from './imprintLocale';

export const IMPR002_MINIERA_IT: ImprintLocaleOverlay = {
  scenarioId: 'gen-impr002-miniera',
  locale: 'it',
  lockedFacts: {
    'mi-partenza': ['nove minatori', 'caposquadra'],
    'mi-scarico': ['puntelli', 'roccia'],
    'mi-registro': ['registro', 'galleria', 'sigillata'],
    'mi-schieramento': ['nove', 'vena'],
    'mi-vena': ['trascinamento', 'nove'],
    'mi-consegna': ['registro', 'nove'],
    'mi-ritorno': ['nove famiglie'],
    'mi-fine': ['presi'],
  },
  title: 'La squadra del caposquadra',
  flavour: 'I suoi uomini sanno dove camminare — perché camminano su una vena non mappata da mesi.',
  objective: 'Raggiungi i minatori intrappolati nella galleria crollata — o rispondi di chi li ha messi sotto.',
  beats: [
    'Il turno ancora dentro',
    'La gabbia scende',
    'Piccole cose sbagliate',
    'La galleria bassa',
    'Dentro la sua galleria',
    'Dove era il turno',
    'La risalita',
  ],
  intelLabels: {
    'equipaggio-suo': 'la sua squadra lavora sul suo fischietto, non sulla campana del turno — e il loro distanziamento ti tiene dove vuole lui',
    'turni-ombra': 'la sua squadra scava una galleria sigillata da mesi — il registro lo nasconde, e nasconderlo è il reato',
    'traccia-morso': 'i minatori intrappolati sono stati presi, non sepolti — segni di trascinamento verso la galleria profonda; la cosa sotto è vera, ed è recente',
  },
  epilogue: {
    titles: [{ flag: 'a-consegnato', label: 'Spezzatore dei turni ombra' }],
    lore: [
      {
        flag: 'a-fuggito',
        label: 'È scivolato di nuovo nelle sue gallerie — l’uomo che ha sepolto nove minatori per una vena è ancora laggiù. Sentirai di nuovo il suo fischietto.',
      },
      {
        flag: 'a-padrone',
        label: 'Il registro risponde ancora alla sua mano — e nove famiglie aspettano una risposta che lui ha già.',
      },
      {
        flag: 'a-sgamato',
        label: 'Il registro che hai portato alla luce ha detto al fattore due cose in una volta — chi scavava la vena, e chi ha pagato il tetto che ha indebolito. Nessuno dei due conti è chiuso.',
      },
      {
        flag: 'soci-traditi',
        label: 'Soci in una vena pagata in uomini sepolti — ti ha pagato con un sorriso.',
      },
      {
        flag: 'posta-mossa',
        label: 'Il turno intrappolato non era sotto la roccia — i segni di trascinamento vanno verso la galleria profonda, e qualcosa laggiù tiene ancora le loro ore.',
      },
      {
        flag: 'galleria-crollata',
        label: 'Hai discusso con la montagna stessa — e la montagna ha vinto la battaglia per te.',
      },
      {
        flag: 'soci-onorati',
        label: 'Ha onorato la lettera del patto — e ti ha detto verso cosa andavano i presi.',
      },
    ],
  },
  nodes: {
    'mi-partenza': {
      title: 'Il turno ancora dentro',
      body: 'Il crollo ha sigillato la galleria bassa con un turno intero dentro — nove minatori su aria viziata, e le famiglie già al pozzo a chiedere risposte che nessuno ha. Per arrivarci in tempo serve una squadra che sa quale roccia si può toccare, e l’unica è quella del caposquadra anziano: «i miei uomini sanno dove camminare — e io so dove». Li offre gratis, per il bene del campo.',
      transit: 'Il castello del pozzo cigola sopra una fila di facce in attesa.',
      options: {
        'mi-accetta': {
          label: 'Prendi la squadra del caposquadra',
          detail: 'I suoi minatori, i suoi segnali, il suo registro — ma loro conoscono la discesa. Accettare vuol dire portare la sua squadra dentro il tuo salvataggio.',
        },
        'mi-rifiuta': {
          label: 'Scendi dalla galleria di scarico',
          detail: 'Costituzione + Intelletto. Il vecchio cunicolo potrebbe aggirare del tutto le sue squadre — puntelli marci, aria viziata, e ogni inciampo echeggia laggiù.',
        },
      },
    },
    'mi-discesa': {
      title: 'La gabbia scende',
      body: 'La gabbia scende oltre la luce delle lampade, nel buio di lavoro. I suoi minatori ci si muovono dentro come sulle scale di casa — perché lo sono. Ogni ordine viaggia sul suo fischietto, non sulla voce del tuo capo — e nemmeno verso i nove, se il fischietto non lo dice. La discesa è facile. È proprio questo il problema.',
      transit: 'I minatori ti rispondono con cortesia — dopo il fischio.',
    },
    'mi-scarico': {
      title: 'La galleria di scarico',
      body: 'Il cunicolo abbandonato: puntelli molli come pane vecchio, un’aria che ti siede in petto come lana bagnata. Laggiù non ci sono testimoni — ma la roccia porta il suono per un quarto di miglio, e una pietra smossa nella galleria sbagliata ha un nome.',
      failHint: 'la roccia porta un inciampo più lontano di un grido.',
      verdictFlavor: {
        bigwin: 'Leggi la puntellatura come un registro — dove tiene e dove mente — e attraversi il cunicolo senza svegliare un solo puntello.',
        win: 'Una discesa lenta, dura — ma la galleria tiene il tuo segreto.',
        almost: 'Un puntello geme e regge. Polvere sui denti, nessun nome scambiato.',
        fail: 'Una lastra cede alle tue spalle — il tonfo rotola per le gallerie come una campana.',
        epicfail: 'Il cunicolo risponde al tuo peso con un pezzo di tetto — strisci fuori sanguinando, e annunciato.',
      },
    },
    'mi-segnali': {
      title: 'Piccole cose sbagliate',
      body: 'Niente di cui potresti giurare — e diverse cose che non tornano. I minatori lavorano sul suo fischietto, non sulla campana del turno. La sua squadra delle lampade è passata davanti a una galleria che la tua mappa dà per sigillata — senza rallentare. Ogni crepa ha una lettura innocente. Puoi raccoglierle, o lasciarle andare — il tempo dei nove non aspetta in entrambi i casi.',
      transit: 'Il genere di nulla che tiene sveglia una mente prudente.',
      options: {
        'mi-osserva': {
          label: 'Leggi il fischietto',
          detail: 'Percezione. La sua squadra lavora su segnali che nessun estraneo ha mai imparato — un ascolto attento è tutto ciò che un ascolto attento ti dà.',
        },
        'mi-registro': {
          label: 'Leggi il registro dei turni',
          detail: 'Intelletto. Il registro decide chi era dove — e i registri si possono far mentire in modi molto specifici.',
        },
        'mi-fiuto': {
          label: 'Il fiuto del prudente',
          detail: 'Percezione. Qualcuno nel gruppo l’ha annusato giorni fa — lascia che ti mostri cosa.',
        },
        'mi-lascia': {
          label: 'Lascia correre — le lampade sono accese',
          detail: 'Arrivi alla galleria bassa come sei: fiducioso, o cieco.',
        },
      },
    },
    'mi-osserva': {
      title: 'Il fischietto',
      body: 'Nel buio gli ordini viaggiano come suono: due brevi, un lungo, un trillo che significa qualcosa che la campana del turno non dice mai. I minatori rispondono al suo codice come un secondo sistema nervoso.',
      verdictFlavor: {
        bigwin: 'Il codice si legge tutto: segnali di distanziamento che allontanano il TUO gruppo, un richiamo provato troppo a lungo per essere nuovo — questa squadra l’ha già fatto.',
        win: 'Prendono ordini dal suo fischietto. La spedizione è un carico — loro no.',
        almost: 'Qualcosa in come i richiami di distanziamento ti separano. Un presentimento, non una prova.',
        fail: 'Canti di lavoro e segnali. Niente a cui un giudice onesto potrebbe obiettare.',
        epicfail: 'Uno di loro ti scopre a contare i richiami — e fischia qualcosa di nuovo.',
      },
    },
    'mi-registro': {
      title: 'Il registro dei turni',
      body: 'Nella stanza delle lampade il registro dice chi era dove: turni, squadre, gallerie. Tre pagine dentro, le voci smettono di combaciare con le mappe — i suoi uomini registrano una galleria che le mappe danno per sigillata, da mesi.',
      verdictFlavor: {
        bigwin: 'Mesi di voci, un solo disegno: la sua squadra in una galleria che le mappe sigillano — e il legname e le candele prelevate per quella addebitate ad altre squadre. Non è un errore. È una miniera nascosta.',
        win: 'Turni ombra: la sua squadra lavora una galleria che le mappe sigillano.',
        almost: 'Una squadra segnata dove nessuna squadra dovrebbe essere — la mano è del suo scrivano, la spiegazione manca.',
        fail: 'Nomi, conteggi di lampade, gallerie. Niente a cui un giudice onesto potrebbe obiettare.',
        epicfail: 'Il ragazzo delle lampade nota la tua lettura e la racconta dove conviene raccontarla.',
      },
    },
    'mi-fiuto': {
      title: 'Cosa ha annusato il prudente',
      body: 'Il membro più prudente del gruppo ha tenuto i suoi dubbi per sé — fino a ora. Fammi vedere cosa hai visto, gli dici. Lui lo fa.',
      verdictFlavor: {
        bigwin: 'Un catalogo: le candele extra tirate «per la galleria bassa», i picconi contati all’uscita e mai al ritorno, la polvere di vena fresca su stivali che dovrebbero vedere solo il pozzo.',
        win: 'La sua squadra lampade porta più picconi e più candele di quante ne servano a una scorta.',
        almost: 'Una lista di piccole cose che sommate fanno un atteggiamento, non una prova.',
        fail: 'Anche il prudente ha solo un odore — ma l’odore è vero.',
        epicfail: 'Lo racconta abbastanza forte da farsi sentire dalla squadra lampade più vicina.',
      },
    },
    'mi-avviso': {
      title: 'L’avviso del ragazzo delle gabbie',
      body: 'A metà discesa il ragazzo delle gabbie ti affianca sulla corda per un tratto di buio — abbastanza per sussurrare: «la galleria bassa non è caduta da sola. I suoi uomini scavavano a fianco da mesi». Poi la corda lo tira su e via. Troppo tardi per cambiare la discesa; abbastanza presto per contare.',
      transit: 'Le prove arrivano sempre dopo la discesa — è quello che le rende prove.',
    },
    'mi-schieramento': {
      title: 'La galleria bassa',
      body: 'La galleria crollata si apre davanti — e i suoi uomini sono già schierati: non a scavare verso i nove, ma a tenere la linea di una vena laterale non dichiarata. La SUA vena, tagliata a filo della vena che è caduta. La forma si legge in un colpo solo: i suoi scavi nascosti hanno indebolito il tetto che ha sepolto nove uomini, e il tuo salvataggio è la copertura legale per tirare via l’ultimo carico prima che la compagnia se ne accorga. Sei stato il testimone della tua imboscata — e del suo crimine.',
      verdictFlavor: {
        bigwin: 'Leggi la forma intera prima che il primo piccone si alzi — ogni uomo, ogni puntello, ogni bocca di buio che crede sua.',
        win: 'La vedi: le distanze, i picconi già pronti, i sacchi di vena già in fila dietro di lui.',
        almost: 'Cogli la forma in ritardo — abbastanza per sapere che è una forma.',
        fail: 'Ti serve un respiro di troppo per capire cosa ti sta mostrando la luce delle lampade.',
        epicfail: 'Stai ancora contando gli uomini quando il primo piccone si alza.',
      },
    },
    'mi-disposti': {
      title: 'Sei arrivato inosservato',
      body: 'Dal buio oltre la loro linea delle lampade guardi la sua squadra prendere posizioni pensate per un gruppo che non avrebbe dovuto vederle. Lui ha preparato una trappola per dei passeggeri — e voi non siete passeggeri. Il buio è suo. La prima mossa è tua.',
      transit: 'Conti i suoi uomini mentre loro contano una trappola che non c’è.',
    },
    'mi-lettura': {
      title: 'I pezzi si compongono',
      body: 'Ogni crepa che hai raccolto atterra in una volta: il fischietto, i turni ombra, le candele mai tornate. Non sei sorpreso — ma sapere e agire sono due tiri diversi.',
      verdictFlavor: {
        bigwin: 'Ti muovi prima che il suo fischietto finisca il richiamo — le crepe sono valse ogni minuto.',
        win: 'Sei pronto quando scatta. Le crepe hanno pagato.',
        almost: 'La cogli con un respiro di ritardo — abbastanza tardi da perdere la prima parola, non la prima mossa.',
        fail: 'Avevi ogni indizio e resti comunque fermo — il significato arriva coi picconi.',
        epicfail: 'Gli indizi c’erano. Li hai composti un battito troppo tardi.',
      },
    },
    'mi-trappola': {
      title: 'Ti cade addosso',
      body: 'I picconi si alzano tutti insieme — una squadra di lavoro, non una di soccorso. «Attento a dove cammini», chiama il caposquadra da dietro la linea delle lampade, piacevole come una porta di gabbia che si chiude. «I puntelli non tengono per tutti». Ci entri a occhi aperti, adesso — ma sono occhi aperti sotto i picconi.',
      failHint: 'il cordone si chiude per primo — la sorpresa era sua, non tua.',
    },
    'mi-imboscata': {
      title: 'Sapeva che sapevi',
      body: 'Le tue domande l’hanno raggiunto prima che tu raggiungessi la galleria — o la tua discesa si è annunciata attraverso la roccia. La squadra è già schierata e guarda il varco da cui si aspetta te. «Occhio ai puntelli», chiama, amichevole. «Sono schizzinosi su chi gli cammina sotto».',
      failHint: 'preparato esattamente per te — il pedaggio è più pesante.',
    },
    'mi-scelta': {
      title: 'Dentro la sua galleria',
      body: 'La vena lavorata, la linea dei picconi, e nove uomini da qualche parte sotto il suo legname marcio. La forza vuol dire i suoi numeri nel suo buio. La risalita vuol dire lasciarli a lui. I puntelli marci sopra la testa reggono più montagna di quanta ne regga una squadra — e il suo sorriso offre ancora un patto al prezzo del silenzio su chi li ha messi sotto.',
      transit: 'Il genere di posizione da cui esci solo pagando.',
      options: {
        'mi-primo-colpo': {
          label: 'Colpisci per primo — l’avevi visto arrivare',
          detail: 'Uno scontro di due turni al tuo tempo, non al suo. La sorpresa è tua: finisce in fretta, da una parte o dall’altra.',
        },
        'mi-via-forza': {
          label: 'Affronta la linea dei picconi',
          detail: 'Uno scontro di quattro turni — i suoi numeri, il suo buio, il suo terreno. Costa sangue che funzioni o no.',
        },
        'mi-via-puntelli': {
          label: 'Taglia i puntelli — butta giù il tetto',
          detail: 'Agilità. La puntellatura sopra la loro posizione è marcia — tagliala e lascia discutere la roccia. Alla roccia non importa da che parte stare.',
        },
        'mi-via-fuga': {
          label: 'Prendi la lunga risalita',
          detail: 'Forza + Costituzione. Su per il pozzo contro la campana del turno — fuori dalla sua portata, se le braccia tengono.',
        },
        'mi-via-recita': {
          label: 'Fai il socio di vena',
          detail: 'Carisma. Sorridi, chiedi una quota della vena, diventa socio. Se ti legge il bluff, non potrai offrirti una seconda volta.',
        },
      },
    },
    'mi-puntelli': {
      title: 'L’argomento del legname marcio',
      body: 'Li hai visti all’ingresso: i puntelli sopra la loro posizione sono molli come pane vecchio, e il carico sopra di loro vale una galleria di montagna. Tre tagli, messi bene, e la miniera combatte al posto tuo. Il trucco è essere altrove quando risponde.',
      failHint: 'alla roccia non importa da che parte stare.',
      verdictFlavor: {
        bigwin: 'Tre tagli e un respiro trattenuto — la galleria si chiude sulla sua squadra come una mano, e la polvere si posa sul silenzio.',
        win: 'I puntelli cedono — il tetto scende in un boato che chiude la discussione.',
        almost: 'Crollo parziale — metà della sua linea è giù o a tentoni, e gli altri si voltano e ti trovano già in movimento.',
        fail: 'I puntelli tengono — per un pelo — e adesso la sua squadra sa esattamente dove sei e cosa hai tentato.',
        epicfail: 'La roccia scende su tutti — ti disseppellisci mentre la sua squadra si prepara a combattere.',
      },
    },
    'mi-scontro-sorpresa': {
      title: 'La tua imboscata',
      body: 'Sei stato il testimone della tua imboscata — quindi fai scattare prima la tua.',
      transit: 'Il momento è scelto. La sua linea dei picconi si volta verso il buio sbagliato.',
      previewHint: 'Uno scontro breve e brutale ai tuoi termini — il turno di sorpresa che ti sei guadagnato.',
      combat: {
        enemyName: 'Squadra di vena',
        attackLines: {
          bigwin: 'Colpisci la linea dei picconi dove le sue lampade puntavano dalla parte sbagliata.',
          win: 'Il primo sangue è tuo — la trappola scatta al contrario.',
          almost: 'Un colpo sfilacciato nel buio — vacillano, ma rispondono.',
          fail: 'La tua sorpresa incontra minatori che combattono al buio per mestiere — gli fa meno male di quanto dovrebbe.',
          epicfail: 'Il colpo si sfascia nel buio — adesso sanno tutto.',
        },
        clearedText: 'La linea dei picconi si spezza. La sua galleria, il tuo campo — il caposquadra è in ginocchio.',
        survivorsText: 'La sorpresa ti ha comprato un momento, non la galleria — la sua squadra si richiude intorno.',
        holdingText: 'Turno {turn} chiuso — la sua squadra di vena tiene ancora la galleria ({left} in piedi).',
      },
    },
    'mi-scontro': {
      title: 'La linea dei picconi',
      body: 'Picconi contro acciaio, nel buio in cui sono nati. Sei dentro la sua disposizione — l’unica via d’uscita è attraverso.',
      transit: 'La galleria si chiude intorno allo scontro come un secondo avversario.',
      previewHint: 'Uno scontro lungo ai suoi termini — loro sanno dove camminare e tu no.',
      combat: {
        enemyName: 'Squadra di vena',
        attackLines: {
          bigwin: 'Un varco nella linea dei picconi — ci spingi dentro tutto il gruppo.',
          win: 'Spezzi un’estremità della sua linea prima che si chiuda.',
          almost: 'Scambi colpi con uomini che menano picconi per vivere.',
          fail: 'I picconi trovano la misura — i suoi uomini conoscono questo buio meglio di quanto il tuo acciaio lo conosca.',
          epicfail: 'La linea dei picconi si stringe intorno a te come una gabbia che scende.',
        },
        clearedText: 'La linea dei picconi si spezza sul suo stesso terreno. Il caposquadra resta solo.',
        survivorsText: 'La linea dei picconi tiene — per un pelo, ma tiene. I suoi uomini sono ancora tra te e tutto il resto.',
        holdingText: 'Turno {turn} chiuso — la linea dei picconi è ancora in piedi ({left} picconi alzati).',
      },
    },
    'mi-risalita': {
      title: 'La lunga risalita',
      body: 'Scappi verso il pozzo — corda, scale, e la campana del turno che già chiama giù la squadra dopo di te. Uscire vuol dire scavalcare uomini che possiedono ogni livello.',
      failHint: 'tengono i livelli sopra di te — la salita funziona comunque, a un prezzo.',
      verdictFlavor: {
        bigwin: 'Sei oltre il secondo livello prima che il suo fischietto ti raggiunga.',
        win: 'Braccia in fiamme, campana che suona — la linea dei picconi ti perde nel pozzo.',
        almost: 'Emergi con le mani a brandelli e i suoi fischi che svaniscono sotto.',
        fail: 'Tagliano la linea della scala sopra di te — fuori è fuori, ma costa.',
        epicfail: 'Un piccone trova la corda a metà salita — emergi sanguinando, ma emergi.',
      },
    },
    'mi-farsa': {
      title: 'La recita',
      body: 'Continui a fare la squadra di salvataggio che lui ha scortato: gentile, utile, cieca. La domanda è chi recita per chi — offri una società nella vena come se sotto il patto non ci fossero nove uomini.',
      verdictFlavor: {
        bigwin: 'Ride — quello vero, quello che rispetta un giocatore. «Soci, allora».',
        win: 'Ti pesa, sorride, e fa cenno ai picconi di abbassarsi. Un patto è un patto — nella sua galleria.',
        almost: 'Ti sta dietro al gioco guardandoti fisso — una società con una mano sul piccone.',
        fail: 'Il suo sorriso non cambia, ma la sua squadra stringe la presa. Ti ha letto.',
        epicfail: 'Applaude la recita — poi nomina ad alta voce quello che stavi facendo, davanti alla sua squadra.',
      },
    },
    'mi-in-piedi': {
      title: 'Il caposquadra, in ginocchio',
      body: 'La sua squadra è sepolta, rotta o fuggita — la sua stessa aritmetica, stavolta. Inginocchiato nella polvere della galleria che ha messo sotto nove uomini per il suo registro — calmo anche adesso, già a prezzare quanto vale il silenzio del tuo gruppo. Conosce ogni livello, ogni vena, ogni nome che il registro abbia mai firmato.',
      transit: 'La polvere si posa. Perfino la roccia sembra aspettare la tua mossa.',
      options: {
        'mi-lega': {
          label: 'Legalo — risponde alla compagnia',
          detail: 'L’uomo che possedeva il registro, consegnato. Per il villaggio vale più di quanto il carico avrebbe mai valutato — se lo porti in superficie.',
        },
        'mi-sgama': {
          label: 'Tieni lui E il registro — i turni sono prova',
          detail: 'I turni ombra nella sua stessa mano, e l’uomo che li ha scritti. Il fattore li vorrà entrambi — e i nove sotto rendono la domanda impossibile da ignorare.',
        },
        'mi-lascialo': {
          label: 'Lascialo correre nel profondo',
          detail: 'Sparirà in gallerie che nessun registro mappa. Il profondo si tiene il suo caposquadra — e tu ti tieni le mani pulite di una battaglia che hai già vinto.',
        },
      },
    },
    'mi-soci': {
      title: 'La sua mano, tesa',
      body: 'Soci nella vena, allora — il suo sorriso dice che rispetta la giocata, e i suoi occhi che la prezza. Il fronte è avanti; la spartizione è qui. Stringi, o allontanati dall’unica offerta che c’è sottoterra.',
      options: {
        'mi-stretta': {
          label: 'Prendi il patto — dividi la vena',
          detail: 'Soci. Paga una quota per il silenzio, e una quota di quello che il fronte tiene ancora.',
        },
        'mi-niente-accordo': {
          label: 'Niente patto — tirati indietro',
          detail: 'Non stringi una mano che un minuto fa teneva un piccone. Lui tiene le sue gallerie; tu tieni le tue opzioni.',
        },
      },
    },
    'mi-respinti': {
      title: 'Il buio è ancora suo',
      body: 'La linea dei picconi tiene — per un pelo, ma tiene, e sanguinare nel suo buio è una scommessa che peggiora a ogni respiro. Ti ritiri verso il pozzo mentre la sua squadra ti guarda andare.',
      options: {
        'mi-indietro': {
          label: 'Ritirati e osserva dal livello',
          detail: 'Tieni la distanza e le vite — e guardi cosa è venuto a prendere.',
        },
      },
    },
    'mi-vena': {
      title: 'Dove era il turno',
      body: 'Oltre la vena rotta, dove i nove dovrebbero essere — e il buio risponde sbagliato. Niente uomini, niente corpi. Attrezzi posati a metà lavoro, lampade ancora accese, e segni di trascinamento — pesanti, dai piedi sbagliati — che tirano via dal crollo verso la galleria profonda. I nove non sono morti sotto la roccia. Qualcosa ci è passato attraverso e li ha presi.',
      verdictFlavor: {
        bigwin: 'I segni di trascinamento si leggono: qualcosa è passato per la vena rotta e ha preso i vivi, non i morti — verso la galleria profonda, e i segni sono freschi.',
        win: 'Niente corpi dove i corpi dovrebbero essere — il turno è stato preso, non sepolto.',
        almost: 'Vuoto. La domanda non è più dove sono — è cosa li ha raggiunti prima.',
        fail: 'Vuoto. Qualunque risposta avesse il buio, ti scivola dalle mani.',
        epicfail: 'Vuoto, e per giunta un puntello cede su una spalla.',
      },
    },
    'mi-vena-lontana': {
      title: 'Dove era il turno — dal livello',
      body: 'Guardi la sua squadra arrivare dove i nove dovrebbero essere — e guardi la lanterna del caposquadra fermarsi di colpo. Niente uomini, niente corpi; qualunque cosa li abbia presi ha portato via anche il valore del suo segreto. La bestemmia che sputa nel buio è la risposta per cui avresti pagato sangue: vuoto. Anche per lui.',
      verdictFlavor: {
        bigwin: 'Cogli perfino quello che la sua squadra non vuole guardare — segni di trascinamento verso la galleria profonda, attrezzi a metà lavoro. La roccia non fa così. Qualcosa laggiù è arrivato prima.',
        win: 'Vuoto — per lui come per te. I presi si sono portati via la risposta di tutti.',
        almost: 'I suoi uomini se ne vanno a mani vuote. Leggi la sconfitta nelle loro spalle.',
        fail: 'Troppo lontano per leggere più della forma di una delusione.',
        epicfail: 'Un piccone schiocca contro la roccia troppo vicino — ti premi più in basso del suono.',
      },
    },
    'mi-convoglio': {
      title: 'Il convoglio di risalita',
      body: 'Legato e quieto, sale la tua corda attraverso livelli che i suoi uomini conoscono — un uomo che ha mandato nove minatori sotto un legname marcio per la sua vena, portato verso la luce. Ogni ombra che segue a distanza gli appartiene. Portarlo in superficie è tutto il lavoro, ora — il profondo non restituisce il suo caposquadra facilmente.',
      failHint: 'le sue squadre pedinano la risalita — nel buio, giù per una galleria laterale, è sparito.',
      verdictFlavor: {
        bigwin: 'Lo consegni al castello del pozzo prima che i suoi uomini finiscano di pianificare il salvataggio — e sotto giuramento, ti dice cosa ha davvero raggiunto i nove per primo.',
        win: 'Il convoglio tiene. Scende alla luce in tua custodia — e il profondo perde il suo guardiano del registro.',
        almost: 'Una colluttazione in una derivazione laterale, un piccone troppo vicino — ma arriva legato.',
        fail: 'Una lampada lampeggia in una galleria laterale; una zuffa le risponde. Al livello dopo, il profondo se l’è ripreso.',
        epicfail: 'I suoi uomini prendono il livello come se gli fosse dovuto — il convoglio si spezza, e lui sparisce nel suo elemento.',
      },
    },
    'mi-consegna': {
      title: 'La risalita delle prove',
      body: 'Legato, e legato in carta: il registro viaggia in una busta sigillata al suo fianco — squadre in una galleria sigillata, legname addebitato ad altri nomi, mesi così, e nove uomini sotto il tetto che ha comprato. Il fattore lo leggerà per quello che è: la causa del crollo, nella mano del suo stesso scrivano.',
      verdictFlavor: {
        bigwin: 'Il fattore legge i turni ombra due volte — poi chiede, piano, su cosa erano davvero sepolti i nove. Due domande cominciano a rispondersi a vicenda nello stesso registro.',
        win: 'Arriva in superficie col registro. Il fattore ha l’uomo e il movente — e una seconda domanda da inseguire.',
        almost: 'La consegna tiene, per un pelo — la carta sopravvive dove l’uomo è andato vicino a non farcela.',
        fail: 'Da qualche parte tra il terzo livello e la luce, un contabile è pagato e una corda è allentata. Il registro resta; l’uomo va.',
        epicfail: 'Il convoglio arriva col registro intatto e una corda vuota — i suoi soldi hanno scalato più in fretta delle tue prove.',
      },
    },
    'mi-patto': {
      title: 'La lettera del patto',
      body: 'Soci in una vena il cui prezzo vero erano nove uomini. Ora lo tieni alla lettera: una quota dell’operazione — e una risposta. Lui sa esattamente cosa si muove nella galleria profonda. Gli serve solo una ragione per dirlo.',
      verdictFlavor: {
        bigwin: 'Paga la quota — e ti dà la verità come un uomo che salda due debiti con una moneta. La cosa sotto ha una storia, e adesso ce l’hai anche tu.',
        win: 'Una quota magra, ma vera — e una parola sui segni di trascinamento sussurrata come se gli costasse.',
        almost: 'Un pagamento simbolico e una promessa sulla galleria profonda. Mezzo patto è pur sempre un patto.',
        fail: 'Ti paga in sorrisi — la lettera del patto dice che non ti deve proprio niente.',
        epicfail: 'Il patto si dissolve come la luce di una lampada nel buio profondo. Non ti deve niente, e adesso sa che tu pensi il contrario.',
      },
    },
    'mi-ritorno': {
      title: 'I livelli ti restituiscono',
      body: 'Le gallerie si chiudono alle spalle senza commenti. Qualunque cosa sia successa alla vena, nove famiglie aspettano ancora alla gabbia — e il profondo tiene la sua risposta su dove sono andati i loro uomini.',
      transit: 'Un modo quieto di salire, pagato in un modo o nell’altro.',
    },
    'mi-fine': {
      title: 'Ritorno al villaggio',
      body: 'La spedizione è finita. Il villaggio riceve la sua risposta sul crollo — e una domanda peggiore su dove sono andati i presi.',
    },
  },
};

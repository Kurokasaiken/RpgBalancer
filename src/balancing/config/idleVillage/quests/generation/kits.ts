/**
 * Domain kits for the race gimmick (PLAN-026): the dressing layer.
 *
 * Each `RaceDomainKit` provides the full per-scene copy a generated
 * scenario needs — names, places, threat, prize, and every title/body/
 * option/log the skeleton consumes. Vocabulary sources: the compiled
 * kits in `context/QUEST_IMPRINTS.md` (passo-montano authored here,
 * palude from the «Domain kit compilato — palude» block: passarelle,
 * chiuse, nebbia, fango, pontile, canali — «chi possiede le chiuse
 * possiede la terra»).
 */

import type { RaceDomainKit } from './raceGimmick';

/* ------------------------------------------------------------------ */
/* passo-montano — the v0 kit (La Corsa al Passo).                     */
/* ------------------------------------------------------------------ */

export const PASSO_MONTANO_KIT: RaceDomainKit = {
  id: 'passo-montano',
  prefix: 'rp',
  title: 'La corsa al Passo del Corvo',
  flavour: 'Il carico del passo: lo prende chi arriva primo.',
  names: {
    place: 'il Passo del Corvo',
    rival: 'i predoni della Val Nera',
    prize: 'il carico del passo',
  },
  intelId: 'tagliata',
  objective: 'Raggiungere il Passo del Corvo prima dei predoni della Val Nera e mettere il carico del passo al sicuro.',
  copy: {
    partenza: {
      title: 'Assegnazione — la corsa al Passo del Corvo',
      body: 'Un mercante ha lasciato il carico del passo incustodito oltre il Passo del Corvo: lo recupera chi arriva primo. Ma i predoni della Val Nera sono già in marcia — e corrono.',
    },
    viaA: {
      title: 'La crepa nel ghiaccio',
      body: 'La pista muore su una lastra di ghiaccio sospesa sul vuoto. Di sotto, il niente.',
      failHint: 'I predoni guadagnano terreno — e qualcuno può farsi male.',
      option: { label: 'Il valico diretto', detail: 'Agilità. La via più breve — se il ghiaccio tiene.' },
      verdictFlavor: {
        epicfail: 'La lastra cede sotto il peso di due. Per un momento il vuoto è tutto ciò che esiste.',
        fail: 'Il ghiaccio scricchiola a ogni passo. La traversata costa tempo che non avete.',
        win: 'Passate leggeri come se la montagna vi lasciasse correre.',
        bigwin: 'Volteggiate sulla lastra. Dalla cresta, la via è tutta vostra.',
      },
      outcomeLog: {
        epicfail: 'Il rumore della lastra che cede rimbalza nella valle — qualcuno vi ha sentito.',
      },
    },
    viaB: {
      title: 'Le vecchie orme',
      body: 'Un contrabbandiere morto anni fa ha lasciato segni che ancora raccontano la montagna.',
      failHint: 'La lettura costa tempo: i predoni avanzano.',
      option: { label: 'Seguire le vecchie orme', detail: 'Percezione. Più lenta, ma rivela ciò che la montagna nasconde.' },
      outcomeLog: {
        win: 'Le orme mostrano una tagliata tra le rocce — una via che i predoni non conoscono.',
      },
    },
    tappa: {
      title: 'La tappa intermedia',
      body: 'Da qui si vede il profilo del Passo del Corvo. Da qui si sente anche il passo dei predoni della Val Nera, da qualche parte sotto di voi.',
      transit: 'Fiato bianco e gambe che bruciano. La montagna non premia chi si ferma a pensare.',
    },
    sprint: {
      title: 'Lo sprint sul falsopiano',
      body: 'I polmoni gridano. La vetta no — è già più vicina.',
      failHint: 'Chi forza e cade perde il vantaggio — e le gambe.',
      option: { label: 'Forzare il passo', detail: 'Forza. Bruciare le gambe per bruciare la distanza.' },
      outcomeLog: {
        epicfail: 'Lo strappo finisce nella ghiaia. Il vostro rumore ha fatto da guida.',
      },
    },
    passo: {
      title: 'Il passo regolare',
      body: 'Un piede davanti all’altro. La montagna si scala a fiato, non a furia.',
      option: { label: 'Tenere il ritmo', detail: 'Costituzione. Misura contro fretta — la via regolare.' },
    },
    taglio: {
      title: 'La tagliata',
      body: 'Una fessura tra due pareti che nessuna mappa segna. Stretta — praticabile.',
      failHint: 'La tagliata era meno segreta di quanto sembrasse.',
      option: { label: 'La tagliata tra le rocce', detail: 'Agilità. La via che le orme hanno rivelato.' },
    },
    balzo: {
      title: 'Il balzo dell’avido',
      body: 'Da questo cornicione alla cresta mancano tre metri di niente. Tre metri che valgono la corsa intera.',
      failHint: 'Il vuoto non perdona — e i predoni ringraziano.',
      option: { label: 'Il balzo dell’avido', detail: 'Agilità. Uno strappo impossibile — solo chi non sa frenare lo tenta.' },
      verdictFlavor: {
        epicfail: 'Le mani trovano aria. La montagna decide di tenervi un pezzo.',
        win: 'Il salto si chiude con un rotolo sulla cresta. Nessuno ha visto — tutti hanno sentito il cuore.',
      },
    },
    imboscata: {
      title: 'L’imboscata dei predoni',
      body: 'I predoni della Val Nera vi hanno letto la rotta meglio di quanto credevate. Escono dalle rocce tutti insieme — non per il carico: per voi.',
      failHint: 'Chi perde lo scontro perde la corsa — e forse più.',
      verdictFlavor: {
        epicfail: 'Non era un’imboscata: era una trappola. Il primo colpo vi spezza la fila.',
        win: 'Li prendete di sorpresa sul loro stesso agguato. La valle torna a essere solo vento.',
      },
      outcomeLog: {
        win: 'Restano indietro a raccogliere i denti. La corsa riprende — ora sono loro ad aver paura.',
      },
    },
    vetta: {
      title: 'La vetta',
      body: 'Ci arrivate primi. Il carico del passo è lì, intatto. Ma da sotto sale il rumore dei predoni della Val Nera — non sono lontani.',
      transit: 'L’ultimo tratto è solo verticale e fiato. Poi il profilo del passo si apre — e il carico è davvero lì.',
    },
    sicuro: {
      title: 'La discesa col carico',
      body: 'Il carico pesa il doppio in discesa. E la discesa non aspetta.',
      option: { label: 'Prendere il carico e scendere', detail: 'Costituzione. Caricarlo in fretta prima che arrivino.' },
      outcomeLog: {
        epicfail: 'Il carico arriva — insieme a un fianco pieno di lividi e un debito di fortuna.',
        win: 'Il carico scende facile. Dietro, il passo si chiude sul silenzio.',
        bigwin: 'Il carico scende facile — e sotto la tela c’è più di quanto promesso.',
      },
    },
    varco: {
      title: 'Il varco tenuto',
      body: 'Da quassù i predoni della Val Nera devono salire uno alla volta. L’altezza è la vostra armatura.',
      failHint: 'Se il varco cede, cedete voi — con il carico ancora da caricare.',
      option: { label: 'Aspettarli al varco', detail: 'Forza. Finirla qui, col vantaggio dell’altezza.' },
      outcomeLog: {
        win: 'Il varco tiene. Lasciano il campo — e lasciano anche la borsa.',
      },
    },
    sconfitta: {
      title: 'Il passo vuoto',
      body: 'Quando arrivate in vetta, del carico del passo resta solo la sagoma nella neve. I predoni della Val Nera sono già oltre la cresta, e la cresta non perdona due volte.',
    },
    fine: {
      title: 'Il ritorno',
      body: 'La strada del ritorno sembra più corta — la montagna vi ha già preso quello che doveva.',
    },
  },
};

/* ------------------------------------------------------------------ */
/* palude — second kit (vocabulary from QUEST_IMPRINTS palude kit).    */
/* Story: una chiatta del sensale si è arenata alle Chiuse Vecchie      */
/* col carico — la banda del traghettatore la vuole per sé.             */
/* ------------------------------------------------------------------ */

export const PALUDE_KIT: RaceDomainKit = {
  id: 'palude',
  prefix: 'rm',
  title: 'La corsa alle Chiuse Vecchie',
  flavour: 'La cassa della chiatta: la prende chi arriva prima dell’acqua.',
  names: {
    place: 'le Chiuse Vecchie',
    rival: 'la banda del traghettatore',
    prize: 'la cassa della chiatta',
  },
  intelId: 'canale-morto',
  objective: 'Raggiungere le Chiuse Vecchie prima della banda del traghettatore e mettere la cassa della chiatta al sicuro.',
  copy: {
    partenza: {
      title: 'Assegnazione — la corsa alle Chiuse Vecchie',
      body: 'La chiatta del sensale si è arenata alle Chiuse Vecchie con la cassa ancora a bordo: la svuota chi arriva primo. Ma la banda del traghettatore ha già l’acqua a favore — e remano.',
    },
    viaA: {
      title: 'Le passarelle marce',
      body: 'Il camminamento di tavole corre dritto sul canale — dove il legno non è marcito, dove le viti tengono.',
      failHint: 'La banda del traghettatore guadagna acqua — e qualcuno può finire a mollo.',
      option: { label: 'Le passarelle', detail: 'Agilità. La via più corta — dove il legno tiene.' },
      verdictFlavor: {
        epicfail: 'La tavola si apre come una bocca. Il canale è freddo, scuro e profondo un piede di troppo.',
        fail: 'Ogni tavola scricchiola una parola diversa. La traversata costa tempo che non avete.',
        win: 'Correte leggeri di tavola in tavola — la palude sembra scansarvi.',
        bigwin: 'Volate sulle passarelle. Il pontile è una linea dritta verso le chiuse.',
      },
      outcomeLog: {
        epicfail: 'Il tonfo nel canale porta lontano nella nebbia — qualcuno, da qualche parte, ha smesso di remare per ascoltare.',
      },
    },
    viaB: {
      title: 'Le orme nel fango',
      body: 'Il limo racconta tutto quello che è passato stanotte: barche, piedi, e qualcosa che non era nessuno dei due.',
      failHint: 'La lettura costa tempo: la banda avanza sull’acqua.',
      option: { label: 'Leggere il fango', detail: 'Percezione. Più lenta, ma il fango non mente.' },
      outcomeLog: {
        win: 'Il fango mostra un canale morto, coperto dai canneti — acqua che la banda non conosce.',
      },
    },
    tappa: {
      title: 'Il poggio asciutto',
      body: 'L’unico palmo di terra ferma fino alle Chiuse. Da qui si sente lo sciacquio dei remi della banda del traghettatore, da qualche parte nella nebbia.',
      transit: 'Nebbia che toglie suono e vista insieme. La palude non premia chi si ferma a pensare.',
    },
    sprint: {
      title: 'La remata forzata',
      body: 'La barca del canale fila se la spingi. Le spalle gridano. Le chiuse no — sono già più vicine.',
      failHint: 'Chi forza e impana perde il vantaggio — e la barca.',
      option: { label: 'Remare a strappo', detail: 'Forza. Bruciare le braccia per bruciare l’acqua.' },
      outcomeLog: {
        epicfail: 'Il remo si pianta nel fango e la barca si ferma di colpo. Il tonfo fa da segnale nella nebbia.',
      },
    },
    passo: {
      title: 'Il remo regolare',
      body: 'Una voga dopo l’altra. La palude si attraversa a fiato, non a furia.',
      option: { label: 'Tenere la voga', detail: 'Costituzione. Misura contro fretta — la via regolare.' },
    },
    taglio: {
      title: 'Il canale morto',
      body: 'Un filo d’acqua dimenticato dai registri delle chiuse, coperto dai canneti. Stretto — navigabile.',
      failHint: 'Il canale morto era meno dimenticato di quanto sembrasse.',
      option: { label: 'Il canale morto', detail: 'Agilità. La via che il fango ha rivelato.' },
    },
    balzo: {
      title: 'Il salto sulla chiusa',
      body: 'Da qui al ponte della chiusa mancano due braccia d’acqua nera. Due braccia che valgono la corsa intera.',
      failHint: 'L’acqua nera non perdona — e la banda ringrazia.',
      option: { label: 'Il salto sulla chiusa', detail: 'Agilità. Uno strappo impossibile — solo chi non sa frenare lo tenta.' },
      verdictFlavor: {
        epicfail: 'Le mani trovano nebbia. La chiusa decide di tenervi un pezzo — il fango il resto.',
        win: 'Il salto si chiude con una rullata sulle tavole della chiusa. Nessuno ha visto — tutti hanno sentito il cuore.',
      },
    },
    imboscata: {
      title: 'L’agguato al pontile',
      body: 'La banda del traghettatore vi ha letto la rotta meglio di quanto credevate. Salgono dal canale tutti insieme — non per la cassa: per voi.',
      failHint: 'Chi perde lo scontro perde la corsa — e forse più.',
      verdictFlavor: {
        epicfail: 'Non era un agguato: era una trappola d’acqua. Il primo remo vi spezza la fila.',
        win: 'Li prendete di sorpresa sul loro stesso agguato. La nebbia torna a essere solo nebbia.',
      },
      outcomeLog: {
        win: 'Restano indietro a raccogliere i remi. La corsa riprende — ora sono loro ad aver paura.',
      },
    },
    vetta: {
      title: 'Il pontile delle chiuse',
      body: 'Ci arrivate primi. La cassa della chiatta è lì, intatta. Ma da sotto il ponte sale lo sciacquio della banda del traghettatore — non sono lontani.',
      transit: 'L’ultimo tratto è solo acqua e fiato. Poi il pontile si apre — e la cassa è davvero lì.',
    },
    sicuro: {
      title: 'La fuga sulla passerella',
      body: 'La cassa pesa il doppio sulle tavole marce. E le tavole non aspettano.',
      option: { label: 'Prendere la cassa e correre', detail: 'Costituzione. Portarla via prima che arrivino.' },
      outcomeLog: {
        epicfail: 'La cassa arriva — insieme a un fianco pieno di schegge e un debito di fortuna.',
        win: 'La cassa fila leggera sulle passarelle. Dietro, la nebbia si chiude sul silenzio.',
        bigwin: 'La cassa fila leggera — e sotto il catrame c’è più di quanto promesso.',
      },
    },
    varco: {
      title: 'Il pontile tenuto',
      body: 'Da quassù la banda del traghettatore deve salire una alla volta dalle barche. Il pontile è la vostra armatura.',
      failHint: 'Se il pontile cede, finite in acqua voi — con la cassa ancora da caricare.',
      option: { label: 'Tenerli al pontile', detail: 'Forza. Finirla qui, col vantaggio dell’altezza.' },
      outcomeLog: {
        win: 'Il pontile tiene. Tornano alle barche — e lasciano anche la borsa.',
      },
    },
    sconfitta: {
      title: 'Le chiuse vuote',
      body: 'Quando arrivate al pontile, della cassa della chiatta resta solo la sagoma nel fango. La banda del traghettatore è già oltre la nebbia, e la nebbia non perdona due volte.',
    },
    fine: {
      title: 'Il ritorno tra i canneti',
      body: 'La via del ritorno sembra più corta — la palude vi ha già preso quello che doveva.',
    },
  },
};

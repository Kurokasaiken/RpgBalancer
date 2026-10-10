/**
 * GENERATED ARTIFACT — questNarrate (PLAN-026 T4 / P3). Do not hand-edit:
 * regenerate via `scripts/questNarrate.mts`. Provenance:
 * {
 *   "generatedAt": "2026-10-10T14:14:52.629Z",
 *   "scenarioId": "gen-race-passo-montano",
 *   "scenarioVersion": "gen-race-passo-montano-6-50",
 *   "domain": "miniera",
 *   "gimmick": "race",
 *   "attempts": [
 *     {
 *       "provider": "groq",
 *       "model": "openai/gpt-oss-120b",
 *       "ok": true
 *     },
 *     {
 *       "provider": "groq",
 *       "model": "openai/gpt-oss-120b",
 *       "ok": true
 *     },
 *     {
 *       "provider": "groq",
 *       "model": "openai/gpt-oss-120b",
 *       "ok": true
 *     },
 *     {
 *       "provider": "groq",
 *       "model": "openai/gpt-oss-120b",
 *       "ok": true
 *     },
 *     {
 *       "provider": "groq",
 *       "model": "openai/gpt-oss-120b",
 *       "ok": true
 *     },
 *     {
 *       "provider": "groq",
 *       "model": "openai/gpt-oss-120b",
 *       "ok": true
 *     },
 *     {
 *       "provider": "groq",
 *       "model": "openai/gpt-oss-120b",
 *       "ok": true
 *     },
 *     {
 *       "provider": "groq",
 *       "model": "openai/gpt-oss-120b",
 *       "ok": true
 *     },
 *     {
 *       "provider": "groq",
 *       "model": "openai/gpt-oss-120b",
 *       "ok": true
 *     },
 *     {
 *       "provider": "groq",
 *       "model": "openai/gpt-oss-120b",
 *       "ok": true
 *     },
 *     {
 *       "provider": "groq",
 *       "model": "openai/gpt-oss-120b",
 *       "ok": true
 *     },
 *     {
 *       "provider": "groq",
 *       "model": "openai/gpt-oss-120b",
 *       "ok": true
 *     },
 *     {
 *       "provider": "groq",
 *       "model": "openai/gpt-oss-120b",
 *       "ok": true
 *     },
 *     {
 *       "provider": "groq",
 *       "model": "openai/gpt-oss-120b",
 *       "ok": true
 *     },
 *     {
 *       "provider": "groq",
 *       "model": "openai/gpt-oss-120b",
 *       "ok": true
 *     }
 *   ]
 * }
 */

import type { RaceDomainKit } from '../raceGimmick';

export const MINIERA_RACE_KIT: RaceDomainKit = {
  "id": "miniera",
  "prefix": "rn",
  "title": "Corsa nella Galleria Bassa",
  "flavour": "Il registro dei turni è sigillato nella galleria bassa; tu e Mordo l'Esploratore dovete correre prima che il soffitto ceda.",
  "names": {
    "place": "Galleria Bassa Sigillata",
    "rival": "Mordo l'Esploratore",
    "prize": "Chiave d'Acciaio per la Cassa"
  },
  "intelId": "registro-ombra-01",
  "objective": "Raggiungi la galleria bassa sigillata, recupera il registro dei turni e consegnalo al fattore prima che il puntellamento ceda.",
  "copy": {
    "partenza": {
      "title": "Partenza della Corsa nella Galleria Bassa",
      "body": "Il registro dei turni segna l’avvio della sfida contro il rivale, con la «Corsa nella Galleria Bassa» pronta a partire. Scegliere la via maestra, consigliata dal caposquadra anziano, è sicuro ma consuma più tempo, mentre la bestia di galleria rimane in distanza. Prendere la scorciatoia nella «Galleria Bassa Sigillata» riduce la distanza, ma espone a crolli improvvisi e all’attacco di uno scavatore impazzito nel buio. La tua decisione determinerà chi raggiungerà per primo il magazzino viveri."
    },
    "viaA": {
      "title": "Corsa nella Galleria Bassa – Scelta della Scorciatoia",
      "body": "Mordo l'Esploratore ha segnato il percorso sul registro dei turni, ma il tuo rivale ha già preso il vantaggio sulla via maestra. Decidi di scivolare tra le rovine della Galleria Bassa Sigillata, dove la vena pulsa e il buio inghiotte ogni errore. Il rischio è alto, ma la ricompensa è una posizione di vantaggio. Il tuo passo risuona tra i resti di una bestia di galleria.",
      "failHint": "Il sentiero è crollato: una caduta improvvisa può ferirti gravemente o peggio.",
      "option": {
        "label": "Scorciatoia pericolosa",
        "detail": "Agilità, ma ogni passo è un rischio di ferita, con la possibilità di una morte improvvisa."
      },
      "verdictFlavor": {
        "epicfail": "Una frattura ti colpisce gravemente, subisci danni pesanti, il rivale avanza e può lanciarsi all'inseguimento.",
        "fail": "Scivoli su una roccia tagliente, subisci danni e il rivale guadagna terreno.",
        "win": "Riesci a superare il pericolo, guadagni un passo avanti e metti pressione sul rivale."
      },
      "outcomeLog": {
        "win": "Hai evitato il crollo, il rivale resta indietro di un passo.",
        "bigwin": "Sfrutti la rottura a tuo vantaggio, guadagni più passi e il rivale è costretto a seguirti."
      }
    },
    "viaB": {
      "title": "Corsa nella Galleria Bassa – Via B",
      "body": "Il registro dei turni indica che la via B è l’ultima tappa della corsa nella Galleria Bassa. Davanti a te si apre una stretta scalinata di legno, dove un blocco di roccia si è incrinato; un passo falso può provocare una ferita o peggio un crollo. Mordo l'Esploratore, in testa alla tua corsa, sta valutando la stessa scorciatoia rischiosa, mentre il caposquadra anziano osserva dall’ombra. Decidi se proseguire sulla via maestra o rischiare la rottura del tronco per guadagnare terreno.",
      "failHint": "Un masso instabile minaccia di cadere dal soffitto, pronto a frantumare la scala",
      "option": {
        "label": "Scorciatoia rischiosa",
        "detail": "Avanzi di un passo, ma aumenti il rischio di ferita o di una caduta improvvisa"
      },
      "outcomeLog": {
        "win": "Superi la trappola, ottieni un passo avanti e scopri una via tagliata che conduce al magazzino viveri",
        "bigwin": "Sfondi la rottura, ottieni due passi avanti, la via tagliata si apre verso il registro dei turni"
      }
    },
    "balzo": {
      "title": "Balzo nella Galleria Bassa",
      "body": "Mordo l'Esploratore e il rivale si trovano davanti a una spaccatura nella Galleria Bassa Sigillata, il suono della vena pulsa nella pietra. Il percorso più sicuro è una stretta rampa di legno, ma la scorciatoia passa sopra il vuoto, un salto rischioso che potrebbe spezzare le ossa. Se riesci a superare l'ostacolo, guadagnerai terreno; in caso contrario, il rivale avrà il vantaggio e la bestia di galleria potrebbe avvicinarsi.",
      "failHint": "Un salto incerto sul vuoto potrebbe spezzarti la gamba o farti perire",
      "option": {
        "label": "Tentare il salto",
        "detail": "Agilità, scelta rischiosa, possibile ferita grave o morte"
      },
      "verdictFlavor": {
        "epicfail": "Il salto ti lancia contro la roccia, subisci un colpo devastante e il rivale guadagna tre passi",
        "fail": "Scivoli, subisci una ferita e il rivale avanza di un passo",
        "win": "Atterri saldo, guadagni due passi avanti e il rivale indietreggia"
      }
    },
    "passo": {
      "title": "Corsa nella Galleria Bassa",
      "body": "Nella Galleria Bassa Sigillata, il rumore dei picconi è sparito; tu e Mordo l'Esploratore vi lanciate verso la catasta del puntellame, alternando il corridoio principale a una stretta scarpata di roccia scheggiata. Un canto di pietra stenta a reggere il soffitto, e il tuo passo rischia di scivolare su un masso instabile. Il rivalista prende la scorciatoia, ma un improvviso crollo devia il percorso verso il registro dei turni.",
      "failHint": "Un masso instabile può spezzare il passo e provocare una ferita grave",
      "option": {
        "label": "Spingi avanti",
        "detail": "Usa la tua agilità per guadagnare un passo avanti, spendendo un'azione"
      }
    },
    "sprint": {
      "title": "Sprint nella Galleria Bassa",
      "body": "Il suono dei picconi si spegne mentre tu e il rivale vi lanciati nella corsa contro il tempo. La via principale è sicura ma lenta, la scorciata tra i monoli traballanti promette guadagnare un passo. Un improvviso rombo della vena spinge una massa di roccia a cadere, devi scegliere in un attimo. Il registro dei turni segna il punto di partenza, ma il buio inghiotte il resto.",
      "failHint": "Il cigolio dei monoli tradisce la minaccia di una frattura improvvisa.",
      "option": {
        "label": "Usare la scorciatoia",
        "detail": "Destrezza rapida, la via è instabile, nessun costo immediato."
      },
      "outcomeLog": {
        "win": "Raggiungi un vantaggio, il rivale inciampa e tu guadagni un passo avanti.",
        "bigwin": "Sferri il colpo decisivo, la massa di roccia devia il percorso del rivale, lasciandoti al comando della corsa."
      }
    },
    "taglio": {
      "title": "Corsa nella Galleria Bassa – Il bivio",
      "body": "Il registro dei turni segna la tua posizione e quella di Mordo l'Esploratore, il tuo rivale. Nella Galleria Bassa Sigillata, il suono di una bestia di galleria si ode lontano mentre il buio avvolge il cammino. Decidi se rischiare una scorciatoia traballante o mantenere la via maestra, ma un improvviso tremore devia il sentiero.",
      "failHint": "Un masso sgretolato può staccarsi dal soffitto, rischi di essere colpito.",
      "option": {
        "label": "Scorciatoia pericolosa",
        "detail": "Agilità più un rischio di ferita; guadagni avanzamento extra"
      }
    },
    "tappa": {
      "title": "Tappa – Corsa nella Galleria Bassa",
      "body": "Il ruggito della vena riecheggia tra le pareti di carbone, mentre il registro dei turni indica che il traguardo è a pochi passi. Puoi correre a tutta velocità, accettando l'affaticamento; proseguire a passo misurato, risparmiando energia; prendere la scorciatoia tagliata, se conosci il segnale, rischiando una caduta; oppure, se sei avido, balzare sopra il pozzo, con la possibilità di fratturarti al contatto.",
      "transit": "Il tuo prossimo passo deciderà se la vena ti inghiotte o ti concede un attimo di tregua."
    },
    "imboscata": {
      "title": "Imboscata nella Galleria Bassa",
      "body": "Mentre la Corsa nella Galleria Bassa si fa più veloce, la tua via si incrocia con la scorciatoia che conduce alla Galleria Bassa Sigillata. Un grido stridulo di un scavatore impazzito risuona tra le pareti, pronto a scattare. Il tuo rivale, Mordo l'Esploratore, ti osserva da dietro un cumulo di legname. Hai solo un attimo per decidere se rischiare il percorso più breve o restare sulla via sicura.",
      "failHint": "Un'ombra vibra dietro un masso, pronta a colpirti con una lama improvvisa.",
      "option": {
        "label": "Avanzare nella scorciatoia",
        "detail": "Forza e Agilità, scelta apertamente pericolosa, potresti subire una ferita grave."
      },
      "verdictFlavor": {
        "epicfail": "Una fendente ti colpisce al petto, il dolore ti spezza, il rivale avanza decisamente.",
        "fail": "Un colpo ti ferisce, la ferita ti rallenta e Mordo guadagna un passo.",
        "win": "Scivoli tra le ombre, la lama ti sfiora, ma mantieni il ritmo e guadagni terreno sul rivale."
      },
      "outcomeLog": {
        "win": "Superi l'imboscata, il sangue si ferma e la tua corsa riprende con un vantaggio sul rivale.",
        "bigwin": "Schivi il colpo, lanci un grido che intimorisce il nemico e guadagni due passi sul rivale."
      }
    },
    "vetta": {
      "title": "Vetta della Corsa nella Galleria Bassa",
      "body": "Il registro dei turni ti mostra al bivio della Galleria Bassa Sigillata, dove la vena stessa vibra minacciosa. Una scorciatoia, difesa da una bestia di galleria e da un possibile cedimento del puntellame, garantisce un avanzamento rapido ma comporta un serio rischio di ferite e di perdita del contatore viveri. La via maestra, sorvegliata da un caposquadra anziano, è sicura ma richiede un’attesa che prosciuga le forze e potrebbe farti perdere il turno.",
      "transit": "Scelta la scorciatoia, affronterai la bestia e il pericolo di crollo; attendendo, mantieni la sicurezza ma sacrifica tempo prezioso."
    },
    "fine": {
      "title": "Fine della Corsa nella Galleria Bassa",
      "body": "Il caposquadra anziano, con il registro dei turni in mano, annota l’arrivo di Mordo l'Esploratore e del rivale, entrambi coperti di polvere e ferite. Il prezzo della corsa è stato la perdita di un scavatore impazzito, il ferimento di una persona trasformata dalla vena e il danno alla catasta del puntellame, segnati nel bilancio di metallo spezzato. Il bottino consiste in un carico di ferro grezzo estratto dalla vena, custodito nella galleria di scarico, pronto per la consegna al fattore."
    },
    "sconfitta": {
      "title": "Fine della Corsa nella Galleria Bassa",
      "body": "Il registro dei turni segna l'ultimo passo di Mordo l'Esploratore nella Galleria Bassa Sigillata, mentre il tuo ritmo si spezza contro la bestia di galleria e lo scavatore impazzito. Hai perso una mano e una scorta di viveri, ma hai strappato un frammento di vena di metallo lucente dalla roccia. Il fattore della compagnia raccoglie il bottino e il prezzo, senza gloria."
    },
    "sicuro": {
      "title": "Corsa nella Galleria Bassa: la Chiave d'Acciaio",
      "body": "Il registro dei turni indica che il turno di Mordo l'Esploratore è appena iniziato, e la sua figura si staglia all’ingresso della Galleria Bassa Sigillata. Tu e il tuo rivale vi lanciate nella Corsa nella Galleria Bassa, scegliendo tra la via maestra sicura o una stretta scorciatoia che serpeggia tra i segni della vena stessa. Un improvviso tremolio della vena devia il percorso, costringendovi a una decisione rapida.",
      "failHint": "Un passo falso può ferirti, un errore fatale può costare la vita.",
      "option": {
        "label": "Scorciatoia pericolosa",
        "detail": "Attraversi il passaggio stretto, rischi ferita grave ma guadagni tempo."
      },
      "outcomeLog": {
        "win": "Raggiungi la Chiave d'Acciaio per la Cassa, la Corsa nella Galleria Bassa si chiude.",
        "bigwin": "Raggiungi la Chiave d'Acciaio per la Cassa e trovi un piccolo bottino d'oro."
      }
    },
    "varco": {
      "title": "Varco nella Corsa nella Galleria Bassa",
      "body": "Mordo l'Esploratore si ferma davanti al varco che segna la fine della Corsa nella Galleria Bassa. Il registro dei turni indica l'ordine dei turni, ma l'oscurità avvolge il percorso. Una scorciatoia si apre, ma il soffitto è incrinato e il ruggito di una bestia di galleria si avvicina. Il rischio è evidente: una caduta può frantumare le ossa o spezzare il cuore.",
      "failHint": "Il soffitto incrinato minaccia di crollare sotto i tuoi passi",
      "option": {
        "label": "Scorciatoia rischiosa",
        "detail": "Prendi il sentiero più breve, ma il tetto è fragile; una caduta può infliggere una ferita grave o la morte."
      },
      "outcomeLog": {
        "win": "Raggiungi il varco, recuperi la Chiave d'Acciaio per la Cassa e guadagni un bottino di oro.",
        "bigwin": "Superi il varco, sconfiggi una creatura trasformata dalla vena, ottieni la Chiave d'Acciaio per la Cassa e un tesoro d'oro notevole."
      }
    }
  }
};

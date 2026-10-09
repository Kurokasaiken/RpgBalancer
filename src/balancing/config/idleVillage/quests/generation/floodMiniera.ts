/**
 * floodMiniera — catalog imprint «La Vena che Allaga» (gimmick
 * volta-che-allaga × kit miniera, PLAN-026 T-3).
 *
 * Kit dressing dal «Domain kit compilato — miniera» di QUEST_IMPRINTS:
 * gabbia del pozzo, vena, puntellame, catasta, buio, campana del turno.
 * Il bottino qui sono pezzi di vena, casse e lingotti — TAKEN in galleria,
 * SECURED solo se si risale in tempo.
 */

import { generateFloodVault, type FloodDomainKit, type FloodTuning } from './floodVault';
import type { QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';

/** The miniera dressing for the flooding-vault skeleton. */
export const MINIERA_FLOOD_KIT: FloodDomainKit = {
  id: 'miniera',
  prefix: 'fv',
  title: 'La vena che allaga',
  flavour: 'La galleria bassa si riempie: ogni pezzo di vena costa fiato.',
  objective: 'Svuotare la galleria bassa della vena prima che l’acqua la chiuda — e risalire col carico.',
  intelId: 'camera-occulta',
  loot: {
    pezzo: 'pezzo di vena',
    cassa: 'cassa della camera occulta',
    madre: 'cassa della madre',
    lingotto: 'lingotto del diaframma',
  },
  copy: {
    ingresso: {
      title: 'Assegnazione — la galleria bassa',
      body: 'Il fattore paga per svuotare la galleria bassa prima che l’acqua di falda la chiuda. La vena laggiù è ricca. Anche l’acqua è ricca.',
    },
    gabbia: {
      title: 'La gabbia del pozzo',
      body: 'La gabbia cigola sulle guide mentre il buio sale a coprire il cielo. L’aria laggiù non promette bene.',
      failHint: 'La discesa costa tempo — e l’acqua non aspetta nessuno.',
      option: { label: 'Scendere con la gabbia', detail: 'Costituzione. La via dritta, la più lenta.' },
    },
    cunicolo: {
      title: 'Il cunicolo dei contrabbandieri',
      body: 'Un foro nel puntellame che il registro dei turni non segna. Ci passò chi la vena la portava fuori, non giù.',
      failHint: 'Il cunicolo costa tempo — e il tempo qui è acqua.',
      option: { label: 'Infilarsi nel cunicolo', detail: 'Percezione. Più veloce, e i muri raccontano cose.' },
      outcomeLog: {
        win: 'Nel puntellame c’è una seconda porta segnata col gesso: una camera che la compagnia non ha mai registrato.',
      },
    },
    crocevia: {
      title: 'Il crocevia della galleria bassa',
      body: 'La lanterna mostra la vena che corre a destra e il pozzo che torna su a sinistra. Sotto i piedi, il pavimento respira acqua.',
      transit: 'Il rumore dell’acqua cambia di stanza in stanza. Qui si decide cosa vale di più: il metallo o la salita.',
    },
    vena: {
      title: 'La vena a cielo aperto',
      body: 'La vena corre lungo la parete come una cicatrice lucida. Basta il piccone — basta volerlo.',
      failHint: 'Ogni colpo di piccone fa scendere l’acqua di un dito.',
      option: { label: 'Saccheggiare la vena', detail: 'Percezione. Un pezzo in più, un dito d’acqua in più.' },
      verdictFlavor: {
        fail: 'Il piccone rimbalza. La parete no — ha sentito.',
        win: 'Il pezzo si stacca pulito. La parete perde sangue, voi guadagnate peso.',
      },
      outcomeLog: {
        win: 'Dietro il pezzo staccato, il riflesso di una parete più ricca: la madre della vena è da qualche parte qui sotto.',
      },
    },
    punta: {
      title: 'La punta verso il pozzo',
      body: 'Tra qui e la gabbia: tre gallerie basse e una rampa di fango. Chi corre, esce.',
      failHint: 'Ogni passo costa — e la parete sente i passi.',
      option: { label: 'Puntare al pozzo', detail: 'Agilità. Avanti verso l’uscita, l’acqua dietro.' },
    },
    camera: {
      title: 'La camera occulta',
      body: 'La porta di gesso cede con una spallata. Dentro: la cassa che il contrabbandiere non è mai tornato a prendere.',
      failHint: 'La camera era sigillata per un motivo — aprirla apre anche l’acqua.',
      option: { label: 'La camera occulta', detail: 'Forza. La cassa del contrabbandiere — e il rumore del gesso che cede.' },
    },
    puntella: {
      title: 'Puntellare la falla',
      body: 'La catasta è ancora a mezza galleria. Un puntello nel punto giusto e l’acqua torna a scendere — per un po’.',
      failHint: 'Un puntello messo male è peggio di nessun puntello.',
      option: { label: 'Puntellare la falla', detail: 'Intelligenza. Comprare tempo — la sola merce che qui non costa oro.' },
      outcomeLog: {
        win: 'Il puntello scricchiola e tiene. Il livello scende di un palmo: tempo comprato, non regalato.',
      },
    },
    madre: {
      title: 'La cassa della madre',
      body: 'La parete madre: tutta la vena della galleria converte qui. Una cassa naturale di metallo che il buio ha tenuto per sé.',
      failHint: 'La madre non si lascia spogliare — e il soffitto sopra di lei sente tutto.',
      option: { label: 'La cassa della madre', detail: 'Forza. Il premio più grosso della galleria — e il più pesante da portare via.' },
      verdictFlavor: {
        epicfail: 'La parete madre si apre dall’altra parte. Quello che esce non è oro.',
        win: 'La madre si stacca dal muro come un dente. Pesa come una promessa.',
      },
      outcomeLog: {
        win: 'La madre della vena è vostra. Il rumore del distacco corre per tutta la galleria.',
      },
    },
    piena: {
      title: 'La piena',
      body: 'La parete non ha retto: l’acqua entra in galleria come una bestia. Le lampade si spengono una a una. Il sacco pesa il doppio già ora.',
      transit: 'Il rumore non è acqua che scorre — è acqua che mangia.',
    },
    nuoto: {
      title: 'Nuotare senza il sacco',
      body: 'Il sacco va mollato — oro e tutto. In superficie si respira; in fondo, no.',
      option: { label: 'Mollare il sacco e risalire', detail: 'Agilità. La vita per il bottino — la scelta facile, dicono.' },
    },
    sacca: {
      title: 'Tenere il sacco',
      body: 'Il sacco è tutto quello per cui siete scesi. L’acqua è tutto quello che vi vuole portare via. Si tiene, si nuota — o si affonda insieme.',
      failHint: 'Chi tiene il sacco scommette la gola, non solo il fiato.',
      option: { label: 'Tenere il sacco', detail: 'Costituzione. Il bottino o il respiro — scommessa aperta.' },
      verdictFlavor: {
        fail: 'Il sacco tira giù come una mano. Lo lasciate — o non risalite.',
        win: 'Risalite col sacco fradicio e intero. Sul bordo, nessuno fiata per un minuto.',
      },
      outcomeLog: {
        win: 'Il sacco è arrivato su intero. Ogni pezzo è ancora dentro — bagnato, ma vostro.',
      },
    },
    sbarramento: {
      title: 'Lo sbarramento del pozzo',
      body: 'Il diaframma di legname è l’ultima porta tra voi e la gabbia. L’acqua è alle ginocchia — e non si ferma.',
      transit: 'La gabbia cigola da qualche parte sopra. Resta solo sfondare.',
    },
    diaframma: {
      title: 'Sfondare il diaframma',
      body: 'Il legname marcio tiene più di quanto dovrebbe. Si sfonda o si resta.',
      failHint: 'Il diaframma cede male: un sacco può restare sotto.',
      option: { label: 'Sfondare il diaframma', detail: 'Costituzione. L’ultimo ostacolo prima dell’aria.' },
      outcomeLog: {
        win: 'Il diaframma va in schegge. La gabbia vi aspetta col suo cigolio.',
      },
    },
    ultimo: {
      title: 'L’ultimo pezzo',
      body: 'Un lingotto è rimasto incastrato nel diaframma stesso. Lo prendi mentre sfondi — o resta.',
      failHint: 'Un lingotto in più, due dita d’acqua in più.',
      option: { label: 'Un ultimo pezzo prima di uscire', detail: 'Percezione. L’avidità fa l’ultima prova.' },
    },
    fine: {
      title: 'La bocca del pozzo',
      body: 'L’aria di superficie sa di niente — e non è mai stata così buona. Dietro, la galleria si chiude col suo segreto.',
    },
  },
};

/**
 * Emit the miniera flood scenario under a tuning override —
 * returns the parsed, schema-validated scenario.
 */
export function generateFloodMiniera(tuning?: Partial<FloodTuning>): QuestScenario {
  return generateFloodVault(MINIERA_FLOOD_KIT, tuning);
}

/** Parsed + validated v0 catalog scenario — the «Vena che Allaga» imprint. */
export const FLOOD_MINIERA_SCENARIO: QuestScenario = generateFloodMiniera();

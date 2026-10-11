/**
 * GENERATED ARTIFACT — questNarrate (PLAN-027 r001, bilingual EN draft →
 * facts-locked IT re-render). Do not hand-edit: regenerate via
 * `scripts/questNarrate.mts`. Provenance + arc contract:
 * {
 *   "generatedAt": "2026-10-11T13:07:40.228Z",
 *   "scenarioId": "gen-race-passo-montano",
 *   "scenarioVersion": "gen-race-passo-montano-6-50",
 *   "domain": "miniera",
 *   "gimmick": "race",
 *   "pipeline": "r001",
 *   "arcContract": {
 *     "arcSummary": "Una corsa nella Miniera decide chi ottiene l’assegnazione della Galleria Bassa: licenza di estrazione e razioni collegate. Tu e Mara Vezzi inseguite lo stesso fronte prima della campana; scorciatoie, segni materiali e un tratto del rivale possono cambiare il percorso.",
 *     "competition": "Tu contro Mara Vezzi per raggiungere e sigillare per primi il fronte della Galleria Bassa; vincere significa ottenere l’assegnazione registrabile della sua licenza di estrazione e delle scorte di turno.",
 *     "opposition": {
 *       "name": "Mara Vezzi",
 *       "role": "Caposquadra rivale, ha orecchio preciso per la campana e memoria dei sostegni: usa i suoi segnali per deviare verso tagli rischiosi e arrivare prima."
 *     },
 *     "phases": [
 *       {
 *         "nodes": [
 *           "partenza"
 *         ],
 *         "role": "Fissare la posta concreta, la corsa diretta e il registro come unica autorità su presenze e assegnazioni."
 *       },
 *       {
 *         "nodes": [
 *           "viaA",
 *           "viaB"
 *         ],
 *         "role": "Contrapporre via maestra controllabile e scorciatoia instabile, con prove ricavate da rumori, lampade e materiali."
 *       },
 *       {
 *         "nodes": [
 *           "balzo",
 *           "passo",
 *           "sprint",
 *           "taglio",
 *           "tappa"
 *         ],
 *         "role": "Far pagare il ritmo della gara: avanzare, preservare fiato e scegliere una tappa mentre il tratto di Mara apre o chiude un percorso."
 *       },
 *       {
 *         "nodes": [
 *           "imboscata",
 *           "vetta"
 *         ],
 *         "role": "Rivelare che il pericolo era già sotto o nel campo: una sacca di cattiva aria e sostegni manomessi, dimostrabili solo da tracce e suoni; decidere come affrontare Mara al fronte."
 *       },
 *       {
 *         "nodes": [
 *           "fine",
 *           "sconfitta",
 *           "sicuro",
 *           "varco"
 *         ],
 *         "role": "Risolvere l’assegnazione con un esito verificabile: mettere in sicurezza il fronte o attraversare il varco, poi fissare vittoria o sconfitta nel registro."
 *       }
 *     ],
 *     "propGlossary": [
 *       {
 *         "term": "registro dei turni",
 *         "meaning": "Libro firmato che indica squadra, orario e galleria assegnata; serve a convalidare chi può reclamare il fronte."
 *       },
 *       {
 *         "term": "sigilli e legname d’assegnazione",
 *         "meaning": "Piombi marcati e tavole numerate poste ai sostegni; mostrano quale squadra ha aperto, chiuso o manomesso un tratto."
 *       },
 *       {
 *         "term": "campana del turno",
 *         "meaning": "Campana di superficie con rintocchi codificati per cambio, richiamo e chiusura; il suono guida Mara nei cunicoli."
 *       },
 *       {
 *         "term": "lampade a olio",
 *         "meaning": "Lampade portatili: la fiamma bassa segnala aria cattiva e l’olio rimasto limita le deviazioni possibili."
 *       },
 *       {
 *         "term": "canarino in gabbia",
 *         "meaning": "Animale da miniera che reagisce ai gas prima dei minatori; il suo silenzio o agitazione è una prova sonora del pericolo."
 *       }
 *     ],
 *     "endingFacts": {
 *       "win": [
 *         "Hai raggiunto il fronte prima di Mara o hai reso verificabile il suo ritardo con sigilli, tavole e registro.",
 *         "La Galleria Bassa viene assegnata alla tua squadra con la relativa licenza e le razioni di turno.",
 *         "Il varco o il tratto sicuro è stato identificato tramite sostegni, lampade, canarino e rumori della miniera."
 *       ],
 *       "lose": [
 *         "Mara ottiene l’assegnazione registrabile della Galleria Bassa, con la licenza e le razioni di turno.",
 *         "La tua squadra conserva la vita e torna con prove materiali o sonore del tratto pericoloso.",
 *         "Il registro resta fermo contro la squadra perdente: ciò che è firmato è firmato."
 *       ]
 *     },
 *     "lockedFacts": [
 *       "La corsa si svolge interamente nella Miniera e il pericolo proviene da sacche, cedimenti o manomissioni già presenti sotto terra o nel campo.",
 *       "La posta è l’assegnazione della Galleria Bassa: licenza di estrazione e razioni di turno.",
 *       "Mara Vezzi è il rivale diretto.",
 *       "Il registro dei turni controlla l’attribuzione formale di chi era dove.",
 *       "Nel buio nessun esito può dipendere da un testimone oculare: valgono solo prove fisiche o sonore.",
 *       "Mara possiede un orecchio allenato per la campana del turno, tratto che può deviare la corsa verso un taglio laterale."
 *     ],
 *     "nodeContracts": [
 *       {
 *         "node": "partenza",
 *         "narrativeDelta": "La gara e la posta sono dichiarate: entrambe le squadre partono insieme verso lo stesso fronte — da qui in poi ogni scena è corsa, mai presentazione.",
 *         "rivalAction": "Mara parte allo stesso segnale del giocatore: pari merito, nessun vantaggio visibile ancora.",
 *         "motifFunction": "Il registro fissa la posta; lampade e olio stabiliscono il budget di luce e fiato.",
 *         "mechanicalClaims": [
 *           "l’opzione scelta decide solo la prima diramazione del percorso"
 *         ],
 *         "endingClaimsAllowed": []
 *       },
 *       {
 *         "node": "viaA",
 *         "narrativeDelta": "Prima esposizione al METODO di Mara — un taglio guidato dalla campana — e alle sue prove materiali (puntello tagliato, canarino muto): la scena deve reggere da qualsiasi ingresso perché qui i motivi nascono.",
 *         "rivalAction": "Mara ha già svoltato nel taglio laterale: la sua scelta è un fatto compiuto che il giocatore può seguire o no, non il suo metodo rispiegato.",
 *         "motifFunction": "Prima esposizione: lampada bassa e canarino muto introducono l’aria cattiva come novità; il puntello tagliato introduce la manomissione.",
 *         "mechanicalClaims": [
 *           "il check decide il costo fisico del taglio — terreno guadagnato, ritardo o ferita"
 *         ],
 *         "endingClaimsAllowed": []
 *       },
 *       {
 *         "node": "viaB",
 *         "narrativeDelta": "Chi resta sulla via maestra legge le prove (piombi, tavole numerate) che Mara ha saltato: informazione contro velocità.",
 *         "rivalAction": "Mara è fuori vista nel taglio: si sente solo il colpo secco del suo lavoro oltre la roccia.",
 *         "motifFunction": "Tavole numerate e piombi sono il registro materiale delle manomissioni; lampada e canarino confermano ciò che l’altra via introduce.",
 *         "mechanicalClaims": [
 *           "l’esame rivela il passaggio laterale manomesso — nessun costo fisico diretto"
 *         ],
 *         "endingClaimsAllowed": []
 *       },
 *       {
 *         "node": "balzo",
 *         "narrativeDelta": "Il giocatore può pagare rischio fisico per tenere il ritmo: un varco tra le tavole accorcia ma può cedere.",
 *         "rivalAction": "Mara imbocca un taglio parallelo: i suoi passi si spengono più avanti o tornano verso il percorso del giocatore.",
 *         "motifFunction": "Lampada bassa e canarino muto sono ormai segnali RICONOSCIUTI, non novità: il giocatore li legge per decidere.",
 *         "mechanicalClaims": [
 *           "il salto paga terreno immediato a costo di possibile caduta letale"
 *         ],
 *         "endingClaimsAllowed": []
 *       },
 *       {
 *         "node": "passo",
 *         "narrativeDelta": "La via puntellata costa fiato ma dà legname leggibile: scelta lenta e sicura contro il taglio di Mara.",
 *         "rivalAction": "Mara prende un altro taglio: il suo ritmo si misura contro il passo cautelativo del giocatore.",
 *         "motifFunction": "La fiamma corta e il canarino muto pesano qui sulla decisione ritmo-contro-sicurezza, non come monito generico.",
 *         "mechanicalClaims": [
 *           "nessun check: il costo è il terreno ceduto"
 *         ],
 *         "endingClaimsAllowed": []
 *       },
 *       {
 *         "node": "sprint",
 *         "narrativeDelta": "Il puntello incurvato è un preavviso fisico: forzare subito o leggere i segni prima di esporsi.",
 *         "rivalAction": "Mara si ferma ad ascoltare la campana: per la prima volta il giocatore la vede ESITARE — il suo metodo ha un costo sfruttabile.",
 *         "motifFunction": "La campana che guida Mara produce qui una pausa sfruttabile; lampada e canarino confermano il puntello pericoloso.",
 *         "mechanicalClaims": [
 *           "il check forza il passaggio sotto il puntello: il costo è solo fisico"
 *         ],
 *         "endingClaimsAllowed": []
 *       },
 *       {
 *         "node": "taglio",
 *         "narrativeDelta": "Un piano spezzato resta praticabile: avanzare leggeri sotto il puntello che si muove per restare davanti a Mara.",
 *         "rivalAction": "Il taglio di Mara può riportarla davanti: la corsa si stringe verso il fronte.",
 *         "motifFunction": "Il pietrisco che cola dal puntello traduce il pericolo in tempistica — quanto tempo resta per passare.",
 *         "mechanicalClaims": [
 *           "check fisico: un passo perso lascia Mara in testa"
 *         ],
 *         "endingClaimsAllowed": []
 *       },
 *       {
 *         "node": "tappa",
 *         "narrativeDelta": "Bilancio della gara a metà: spingere consuma fiato, procedere con misura cede terreno ma lascia prove dimostrabili.",
 *         "rivalAction": "Mara ha mutato corsa dietro la campana: la sua posizione è stimata, non certa.",
 *         "motifFunction": "Tavole e sigilli sono ciò che il giocatore può ancora dimostrare al fronte — la posta documentale resta aperta.",
 *         "mechanicalClaims": [
 *           "hub di transito: nessun costo meccanico proprio"
 *         ],
 *         "endingClaimsAllowed": []
 *       },
 *       {
 *         "node": "imboscata",
 *         "narrativeDelta": "Rivelazione: il danno ai sostegni è PRECEDENTE all’arrivo delle squadre — il pericolo non nasce dalla gara, e la prova materiale diventa una posta secondaria. Deve reggere da qualsiasi ingresso.",
 *         "rivalAction": "Mara tende l’orecchio oltre il passaggio: anche lei sta leggendo lo stesso pericolo — la gara si ferma per un attimo.",
 *         "motifFunction": "Canarino IMMOBILE (non solo muto) alza la scala del pericolo; i segni d’attrezzo freschi trasformano lampada e sostegni in prove di sabotaggio — i motivi cambiano funzione.",
 *         "mechanicalClaims": [
 *           "scostare il puntello può ferire o seppellire; conservare le prove vale al fronte"
 *         ],
 *         "endingClaimsAllowed": []
 *       },
 *       {
 *         "node": "vetta",
 *         "narrativeDelta": "Ultimo hub prima del fronte: convergono gara, prove e compromesso — passare nel rischio o cedere il passo con le prove in mano.",
 *         "rivalAction": "Mara avanza verso il fronte: il suo vantaggio si decide qui, non si ripete il suo metodo.",
 *         "motifFunction": "Tutti i motivi convergono — lampada bassa, canarino muto, tagli freschi: la lettura è completa e la scelta finale la chiude.",
 *         "mechanicalClaims": [
 *           "hub di transito: la scelta instrada verso sicuro o varco"
 *         ],
 *         "endingClaimsAllowed": []
 *       },
 *       {
 *         "node": "sicuro",
 *         "narrativeDelta": "Il fronte è raggiunto: piantare il legname chiude la gara — il premio è deciso dalla corsa, il check paga solo il corpo.",
 *         "rivalAction": "",
 *         "motifFunction": "La lampada ridotta a goccia è la verifica finale dell’aria morta — il motivo conclude la sua funzione di allarme.",
 *         "mechanicalClaims": [
 *           "la licenza è garantita su OGNI verdetto: il check determina solo costo fisico e paga straordinaria",
 *           "MAI presentare la licenza come condizionale al check"
 *         ],
 *         "endingClaimsAllowed": [
 *           "la licenza della Galleria Bassa entra a registro"
 *         ]
 *       },
 *       {
 *         "node": "varco",
 *         "narrativeDelta": "Ultimo ostacolo fisico prima del fronte: forzare il varco rischia il crollo, e il premio resta comunque deciso dalla gara.",
 *         "rivalAction": "I passi di Mara battono oltre la roccia: pressione temporale, non una nuova azione.",
 *         "motifFunction": "La campana scandisce la chiusura del turno: la scadenza è sonora, non un segnale da seguire.",
 *         "mechanicalClaims": [
 *           "il premio è garantito su OGNI verdetto: il check paga solo il corpo",
 *           "MAI presentare il premio come condizionale al check"
 *         ],
 *         "endingClaimsAllowed": [
 *           "la licenza della Galleria Bassa entra a registro"
 *         ]
 *       },
 *       {
 *         "node": "fine",
 *         "narrativeDelta": "Bilancio di vittoria: premio preso, fronte chiuso, costo pagato — chiusura, non celebrazione.",
 *         "rivalAction": "Mara arriva seconda: il fatto entra a registro.",
 *         "motifFunction": "Lampada ferma e canarino che batte le ali verificano il vuoto sano — i motivi concludono la loro funzione di rilevatori.",
 *         "mechanicalClaims": [],
 *         "endingClaimsAllowed": [
 *           "licenza e razioni assegnate alla squadra",
 *           "il registro convalida il reclamo",
 *           "Mara arriva seconda"
 *         ]
 *       },
 *       {
 *         "node": "sconfitta",
 *         "narrativeDelta": "Bilancio di sconfitta: il premio va a Mara, la squadra torna viva con le prove — nessuna promessa di rivincita o contestazione.",
 *         "rivalAction": "Mara ha vinto: il suo metodo ha pagato — fatto registrato, non da riaprire.",
 *         "motifFunction": "Canarino muto e legname spaccato restano come prove del tratto pericoloso, non del verdetto.",
 *         "mechanicalClaims": [],
 *         "endingClaimsAllowed": [
 *           "Mara ottiene licenza e razioni",
 *           "la squadra conserva vita e prove",
 *           "il registro resta fermo contro la squadra"
 *         ]
 *       }
 *     ]
 *   },
 *   "attempts": [
 *     {
 *       "provider": "groq",
 *       "model": "openai/gpt-oss-120b",
 *       "pass": "draft-en:vetta",
 *       "ok": true
 *     },
 *     {
 *       "provider": "groq",
 *       "model": "openai/gpt-oss-120b",
 *       "pass": "critic:vetta",
 *       "ok": true
 *     },
 *     {
 *       "provider": "groq",
 *       "model": "openai/gpt-oss-120b",
 *       "pass": "revise:vetta",
 *       "ok": true
 *     },
 *     {
 *       "provider": "groq",
 *       "model": "openai/gpt-oss-120b",
 *       "pass": "render-it:vetta",
 *       "ok": true
 *     },
 *     {
 *       "provider": "groq",
 *       "model": "openai/gpt-oss-120b",
 *       "pass": "render-it:vetta",
 *       "ok": true
 *     }
 *   ]
 * }
 */

import type { LocalizedRaceDomainKit } from '../raceGimmick';

export const MINIERA_RACE_KIT: LocalizedRaceDomainKit = {
  "en": {
    "id": "miniera",
    "prefix": "rp",
    "title": "Before the Turn Bell",
    "flavour": "You race Mara Vezzi through the mine to seal the Galleria Bassa; the turn bell settles the allocation.",
    "names": {
      "place": "Galleria Bassa",
      "rival": "Mara Vezzi",
      "prize": "Licenza della Galleria Bassa"
    },
    "intelId": "corsa-galleria-bassa",
    "objective": "Reach and seal the Galleria Bassa before Mara Vezzi to claim the Licenza della Galleria Bassa and its rations.",
    "copy": {
      "partenza": {
        "title": "Before the Turn Bell",
        "body": "The factor opens the registro dei turni: its signatures alone decide who may claim the Galleria Bassa. You and Mara Vezzi leave the bocca del pozzo for the same front; whoever marks it first earns the Licenza della Galleria Bassa and the turn rations. Lamp oil is scarce, so every detour spends light and breath; the record will make the claim stand."
      },
      "viaB": {
        "title": "The Main Way",
        "body": "The main way runs past marked lead plugs and numbered boards, each showing which crew opened, closed, or handled the supports. The side cut gives a thin knock from within; your oil lamps burn low there, and the canary is silent. Mara Vezzi follows the turn bell through the stone while you study the evidence.",
        "failHint": "The side cut carries bad air, and one support is working loose.",
        "option": {
          "label": "Trace the marked boards",
          "detail": "Compare the lamp flames, the silent canary, and the numbered boards before choosing a route."
        },
        "outcomeLog": {
          "win": "A fresh cut in a numbered board identifies the altered side passage. You move a step ahead of Mara Vezzi.",
          "bigwin": "Lead plugs and numbered boards identify the altered side passage and its safe approach. Mara Vezzi loses time on the wrong route."
        }
      },
      "balzo": {
        "title": "The Narrow Boards",
        "body": "Two numbered boards have split between the supports, leaving a gap in the route. Your lamp flame flattens; the canary in its cage is silent. Mara Vezzi hears the turn bell through the stone and takes a cut beside the damaged boards. Cross before her route meets yours, and the next stretch is yours to claim.",
        "failHint": "The boards can give way beneath you; the fall may kill.",
        "option": {
          "label": "Jump the numbered boards",
          "detail": "Cross the gap at once, spending breath and risking a fall before Mara Vezzi’s cut rejoins the route."
        },
        "verdictFlavor": {
          "epicfail": "The boards break under your weight. You strike the support below, lose time, and Mara Vezzi’s steps fade ahead.",
          "fail": "A board shifts under you. You keep your footing, but the effort costs breath and Mara Vezzi draws ahead.",
          "win": "You reach the far support cleanly and keep moving while Mara Vezzi’s cut must turn back toward your route."
        }
      },
      "passo": {
        "title": "Where the Supports Hold",
        "body": "The lamp flame shortens, and the canary in its cage has fallen quiet. Mara Vezzi catches the Turn Bell through the stone and takes a lateral cut beside trembling boards. The supported route costs breath, but its timbers give you something solid to read.",
        "failHint": "The boards tremble above bad air; a slip can break bone.",
        "option": {
          "label": "Hold the supported pace",
          "detail": "Read the lamp flame and the canary’s hush; keep close to the supports at the cost of breath."
        }
      },
      "sprint": {
        "title": "The Brace Gives Warning",
        "body": "Mara Vezzi pauses where the side cut meets the main way, listening for the Turn Bell through the rock. When its echo changes, she takes the cut, leaving you before a bowed brace; the lamp flames shrink and the canary has fallen silent. Numbered boards at the supports show which crew last handled them, if the brace holds long enough.",
        "failHint": "The brace is already cracking; a fall can break bone or push you into bad air.",
        "option": {
          "label": "Shoulder past the failing brace",
          "detail": "The brace creaks under its own weight. Force through now, with no room to recover if it gives."
        },
        "outcomeLog": {
          "win": "You clear the brace and gain ground while Mara Vezzi follows the bell-guided cut.",
          "bigwin": "You pass cleanly and find a firm support beyond, leaving the marked boards intact behind you."
        }
      },
      "taglio": {
        "title": "A Low Cut",
        "body": "Mara Vezzi pauses, head tilted, then takes the side cut where the bell carries through rock. The lamp flame shortens; the canary rattles its cage as grit runs from the brace above. The footing is broken, but the cut can still put you ahead before the Galleria Bassa.",
        "failHint": "Grit falls from the brace, and the footing shifts under each step.",
        "option": {
          "label": "Thread the broken footing",
          "detail": "Move lightly beneath the shifting brace; a lost step gives Mara Vezzi the lead."
        }
      },
      "tappa": {
        "title": "The Cost of the Next Stage",
        "body": "At the junction, Mara Vezzi has followed the Turn Bell through the rock and changed the race. Pressing forward spends breath where the braces are uncertain; a steadier pace gives up ground but leaves time to read the numbered boards and marked plugs. You must reach and secure the Galleria Bassa before her, with enough material proof for the registro dei turni.",
        "transit": "The route opens ahead, and its cost will remain in your breath or in the marks you can prove."
      },
      "fine": {
        "title": "Claimed in the Deep",
        "body": "You reach the Galleria Bassa ahead of Mara Vezzi, driving numbered boards and lead stamps into the rock supports. The steady lamp flame and the fluttering canary prove the gap sound. The registro dei turni awards your squad the Licenza della Galleria Bassa and the contatore viveri—a rich cut won by split palms and sour air."
      },
      "sconfitta": {
        "title": "The Recorded Claim",
        "body": "Mara Vezzi claims the Galleria Bassa, taking the extraction license and the shift rations. You bring your crew back with their breath in them, carrying cracked timber and a quiet cage as proof of the foul air along the cut. The shift register stands against you: what is signed is signed."
      },
      "sicuro": {
        "title": "The Last Timber",
        "body": "The breach opens into the Galleria Bassa where rock split from the ceiling braces. Stagnant air starves the lamp flame down to a dying bead, pressing against your ribs like flat slate. Driving the assignment timbers home seals your claim on the vein; the true risk is the dead weight hanging over every stroke.",
        "failHint": "Foul air and buckling timber threaten broken bones or sudden suffocation.",
        "option": {
          "label": "Drive the assignment timber",
          "detail": "Constitution. Endure the poisoned air to hammer the marked wood into place."
        },
        "outcomeLog": {
          "win": "You drive the marked lead into the timber, securing the Licenza della Galleria Bassa in the shift register.",
          "bigwin": "The rock is secured cleanly, securing the Licenza della Galleria Bassa and surplus pay from the factor."
        }
      },
      "varco": {
        "title": "The Split at the Face",
        "body": "Loose slate blocks the breach into the Galleria Bassa, sagging hard against the final post. Beyond the stone, Mara Vezzi’s boots strike flint while the turn bell marks the closing hour above. If the timber buckles under the shoulder, the ceiling comes down on flesh and marrow.",
        "failHint": "A slip under the hanging stone brings crushing injury or a fatal cave-in.",
        "option": {
          "label": "Wedge through the choked breach",
          "detail": "Strength. Force past the crushed upright ahead of Mara Vezzi, facing fractured ribs or a deadly cave-in."
        },
        "outcomeLog": {
          "win": "You reach the Galleria Bassa first, securing the extraction license and shift rations before Mara Vezzi.",
          "bigwin": "You clear the breach first, taking the extraction license and shift rations before Mara Vezzi arrives."
        }
      },
      "viaA": {
        "title": "The Sawn Timber",
        "body": "Mara Vezzi has already turned into the side crawl, guided by the turn bell above. At the breach, a severed prop dangles from the rock, and the caged canary sits mute beside a dwindling lamp. The passage cuts half the distance to Galleria Bassa, if the compromised ceiling does not crush what enters.",
        "failHint": "Failing timber and dead air threaten broken bones or worse in the dark.",
        "option": {
          "label": "Vault past the sawn prop",
          "detail": "Agility. Squeezing past the weakened post risks a cave-in and torn flesh."
        },
        "verdictFlavor": {
          "epicfail": "The timber gives way overhead, crushing flesh and leaving you trapped in dust.",
          "fail": "The crossbeam scrapes your shoulder, costing blood and precious paces.",
          "win": "You slip past the hanging beam, gaining hard ground behind Mara Vezzi."
        },
        "outcomeLog": {
          "win": "You cleared the unstable crawl and took ground on Mara Vezzi’s lead.",
          "bigwin": "You slipped past the sawn brace clean, cutting deep into Mara Vezzi’s lead."
        }
      },
      "imboscata": {
        "title": "The Sawn Upright",
        "body": "The canary sits motionless on its perch, neither singing nor fluttering against the wire. Across the drift, Mara Vezzi freezes with her hand flat against the rock, listening past the dead air while your oil lamp reveals deep saw-marks cut into the timber long before either crew entered. Shifting the brace risks a sudden cave-in, but the severed grain proves an older sabotage.",
        "failHint": "Dislodging the scored prop risks a falling header and burial under shale.",
        "option": {
          "label": "Heave clear of the notched upright",
          "detail": "Strength and Agility. Forcing the narrow gap risks crushing injury or death to slip past ahead."
        },
        "verdictFlavor": {
          "epicfail": "The frame buckles completely, crushing bone beneath dead shale while Mara breaks past into the dark.",
          "fail": "The header slips and showers stone over your back, stalling your advance while Mara finds her gap.",
          "win": "The timber groans but holds while you slip through, pocketing a severed lead mark as Mara halts."
        },
        "outcomeLog": {
          "win": "You slip past the rigged timber with physical evidence of prior sabotage, taking a step ahead toward the seam.",
          "bigwin": "You clear the collapse cleanly and secure the damaged wood, gaining two paces on Mara before the turn bell."
        }
      },
      "vetta": {
        "title": "The Junction Before the Low Gallery",
        "body": "Mara Vezzi is past the fork, her oil lamp on a fresh fissure where the vein has pried a support loose. Your lamp flickers, the canary is silent, stale air pools around the marked timber. Two ways remain to the front: the braced path under the split vault, or the narrow gap between the slabs. Both ask the body; the proof of the tampering travels with you to the register.",
        "transit": "The braced path asks a steady stroke under the vault; the gap asks narrow breath between the slabs. The choice is which danger to pay."
      }
    }
  },
  "it": {
    "id": "miniera",
    "prefix": "rp",
    "title": "Prima della campana del cambio",
    "flavour": "Corri contro Mara Vezzi nelle viscere della miniera: chi sigilla per primo la Galleria Bassa si prende l’assegnazione al cambio turno.",
    "names": {
      "place": "Galleria Bassa",
      "rival": "Mara Vezzi",
      "prize": "Licenza della Galleria Bassa"
    },
    "intelId": "corsa-galleria-bassa",
    "objective": "Raggiungi e sigilla la Galleria Bassa prima di Mara Vezzi per ottenere la Licenza della Galleria Bassa e le sue razioni.",
    "copy": {
      "partenza": {
        "title": "Prima della campana del turno",
        "body": "Il fattore apre il registro dei turni: solo le firme stabiliscono chi può reclamare la Galleria Bassa. Voi e Mara Vezzi lasciate l’imboccatura del pozzo diretti allo stesso fronte; chi lo contrassegna per primo ottiene la licenza di estrazione della Galleria Bassa e le razioni di turno. L’olio delle lampade basta a poco, e ogni deviazione consuma luce e fiato; il registro renderà valido il reclamo."
      },
      "viaB": {
        "title": "La via principale",
        "body": "La via principale passa accanto a piombi marcati e tavole numerate: indicano quale squadra ha aperto, chiuso o manomesso i sostegni. Dal taglio laterale arriva un colpo secco, sottile; lì le lampade a olio bruciano basse e il canarino tace. Mara Vezzi segue nella pietra i rintocchi della campana del turno, mentre voi esaminate le prove.",
        "failHint": "Nel taglio laterale l’aria è cattiva e un sostegno sta cedendo.",
        "option": {
          "label": "Seguite le tavole marcate",
          "detail": "Confrontate le fiamme delle lampade, il silenzio del canarino e le tavole numerate prima di scegliere la via."
        },
        "outcomeLog": {
          "win": "Un taglio fresco su una tavola numerata rivela il passaggio laterale manomesso. Vi portate avanti di un passo su Mara Vezzi.",
          "bigwin": "Piombi marcati e tavole numerate rivelano il passaggio laterale manomesso e l’accesso sicuro. Mara Vezzi perde tempo sulla via sbagliata."
        }
      },
      "balzo": {
        "title": "Le tavole strette",
        "body": "Due tavole numerate si sono spaccate tra i sostegni e hanno aperto un varco nel passaggio. La fiamma della vostra lampada si abbassa; il canarino nella gabbia tace. Mara Vezzi riconosce la campana del turno attraverso la pietra e imbocca un taglio accanto alle tavole danneggiate. Passate prima che il suo taglio torni sul vostro percorso, e il tratto successivo sarà vostro da reclamare.",
        "failHint": "Le tavole possono cedere sotto di voi; la caduta potrebbe uccidervi.",
        "option": {
          "label": "Saltate il varco tra le tavole",
          "detail": "Superate subito il varco, consumando fiato e rischiando la caduta prima che il taglio di Mara Vezzi torni sul percorso."
        },
        "verdictFlavor": {
          "epicfail": "Le tavole cedono sotto il vostro peso. Urtate il sostegno più in basso, perdete tempo e i passi di Mara Vezzi si spengono più avanti.",
          "fail": "Una tavola si muove sotto di voi. Restate in piedi, ma lo sforzo vi costa fiato e Mara Vezzi guadagna terreno.",
          "win": "Raggiungete senza inciampi il sostegno opposto e proseguite, mentre il taglio di Mara Vezzi deve tornare verso il vostro percorso."
        }
      },
      "passo": {
        "title": "Dove tengono i sostegni",
        "body": "La fiamma della lampada si accorcia e il canarino nella gabbia tace. Mara Vezzi coglie la campana del turno attraverso la pietra e imbocca un taglio laterale accanto alle tavole che tremano. La via puntellata vi prende fiato, ma il suo legname vi dà qualcosa di saldo da leggere.",
        "failHint": "Le tavole tremano sopra aria guasta; un passo falso può spezzare un osso.",
        "option": {
          "label": "Tenete la via puntellata",
          "detail": "Leggete la fiamma della lampada e il silenzio del canarino; restate presso i sostegni, pagando il passaggio col fiato."
        }
      },
      "sprint": {
        "title": "Il puntello avverte",
        "body": "Mara Vezzi si ferma dove il taglio laterale incontra la via principale e tende l’orecchio alla campana del turno oltre la roccia. Quando l’eco cambia, imbocca il taglio e vi lascia davanti a un puntello incurvato; le lampade a olio abbassano la fiamma e il canarino in gabbia non dà più segno. Le tavole numerate sui sostegni dicono quale squadra le ha toccate per ultima, se il puntello regge abbastanza da farvelo leggere.",
        "failHint": "Il puntello sta già cedendo; una frana può spezzare un osso o sospingervi nell’aria cattiva.",
        "option": {
          "label": "Forzate il passaggio sotto il puntello",
          "detail": "Il legname scricchiola sotto il proprio peso. Passate ora, senza spazio per rimediare se cede."
        },
        "outcomeLog": {
          "win": "Superate il puntello e guadagnate terreno, mentre Mara Vezzi segue il taglio guidata dalla campana del turno.",
          "bigwin": "Passate senza urtarlo e trovate un sostegno saldo oltre il varco, lasciandovi alle spalle le tavole marcate intatte."
        }
      },
      "taglio": {
        "title": "Un taglio basso",
        "body": "Mara Vezzi si ferma, inclina il capo e imbocca il taglio laterale dove la campana del turno attraversa la roccia. La fiamma della lampada si accorcia; il canarino scuote la gabbia mentre dal puntello sopra di voi cola pietrisco. Il piano è spezzato, ma quel taglio può ancora portarvi davanti a Mara Vezzi prima della Galleria Bassa.",
        "failHint": "Dal puntello cade pietrisco e il terreno cede sotto ogni passo.",
        "option": {
          "label": "Passate sul pietrisco instabile",
          "detail": "Avanzate leggeri sotto il puntello che si muove; un passo perso lascia Mara Vezzi in testa."
        }
      },
      "tappa": {
        "title": "Il prezzo della prossima tappa",
        "body": "Al bivio, Mara Vezzi ha seguito la campana del turno attraverso la roccia e ha mutato la corsa. Spingere avanti consuma fiato dove i puntelli non danno certezza; procedere con misura cede terreno, ma lascia il tempo di leggere le tavole numerate e i sigilli marcati. Dovete raggiungere e assicurare la Galleria Bassa prima di lei, ottenendo licenza di estrazione e razioni di turno con prove materiali valide per il registro dei turni.",
        "transit": "La via si apre davanti a voi: il suo prezzo resterà nel fiato che avete speso o nei segni che saprete dimostrare."
      },
      "fine": {
        "title": "Rivendicazione nel fondo",
        "body": "Raggiungete la Galleria Bassa prima di Mara Vezzi, piantando i sigilli e il legname d’assegnazione nei puntelli di roccia. La fiamma ferma delle lampade a olio e il battito d'ali del canarino in gabbia confermano che il vuoto regge e l'aria tiene. Il registro dei turni assegna alla vostra squadra la licenza di scavo insieme al contatore viveri, garantendo un taglio ricco pagato con i palmi spaccati e il respiro guasto."
      },
      "sconfitta": {
        "title": "Il reclamo a verbale",
        "body": "Mara Vezzi reclama la Galleria Bassa, portando via la licenza di estrazione e le razioni di turno. Riportate indietro la squadra con il fiato ancora in corpo, trascinando legname d'assegnazione spaccato e un canarino in gabbia ormai muto a riprova dell'aria guasta lungo il taglio. Il registro dei turni resta fermo contro di voi: ciò che è firmato è firmato."
      },
      "sicuro": {
        "title": "L'ultima trave",
        "body": "Lo squarcio dà direttamente nella Galleria Bassa, dove la volta si è spaccata e grava storta sui sostegni. L'aria morta strozza la fiamma delle lampade a olio fino a ridurla a una goccia nera, premendo sulle costole come una lastra di scisto. Battere a fondo il legname d'assegnazione serra il reclamo della vena; il vero rischio è il carico del soffitto che pende su ogni colpo.",
        "failHint": "Il gas pesante e l'armo che flette minacciano ossa rotte o asfissia improvvisa.",
        "option": {
          "label": "Piantate il legname d'assegnazione",
          "detail": "Trattenere il fiato contro l'aria marcia per battere il legno numerato fin dentro la roccia."
        },
        "outcomeLog": {
          "win": "Avete serrato il piombo marcato nel legname, convalidando la licenza della Galleria Bassa nel registro dei turni.",
          "bigwin": "La roccia viene fermata senza sbavature: la licenza della Galleria Bassa entra a registro insieme alla paga straordinaria del fattore."
        }
      },
      "varco": {
        "title": "La fenditura al fronte",
        "body": "Lastre di scisto franate sbarrano il varco verso la Galleria Bassa, gravando sull'ultimo montante. Oltre la roccia, i passi ferrati di Mara Vezzi battono sulla selce mentre la campana del turno scandisce l'ora di chiusura. Se il legname cede sotto la spalla, la volta si abbatte su carne e midollo.",
        "failHint": "Uno scivolone sotto la roccia sospesa porta a lesioni da schiacciamento o a un crollo mortale.",
        "option": {
          "label": "Infilatevi nel varco ostruito",
          "detail": "Forza. Superate a spinta il montante incurvato prima di Mara Vezzi, rischiando costole incrinate o un crollo mortale."
        },
        "outcomeLog": {
          "win": "Raggiungete per primi la Galleria Bassa, assicurandovi licenza di estrazione e razioni di turno prima di Mara Vezzi.",
          "bigwin": "Superate per primi il varco, prendendo licenza di estrazione e razioni di turno prima dell'arrivo di Mara Vezzi."
        }
      },
      "viaA": {
        "title": "Il legname reciso",
        "body": "Mara Vezzi ha già piegato nello stretto cunicolo laterale, guidata dai rintocchi della campana del turno che filtrano dalla superficie. All'imbocco dello squarcio un puntello segato penzola dalla roccia nuda, e il canarino in gabbia siede muto accanto a una lampada a olio dalla fiamma ormai corta. Quel taglio dimezza il cammino verso la Galleria Bassa, purché la volta manomessa non schiacci chi tenta il passo.",
        "failHint": "Legname cedevole e aria guasta minacciano ossa rotte o la fine di ogni respiro nel buio.",
        "option": {
          "label": "Superate d'un balzo il puntello reciso",
          "detail": "Destrezza. Scivolare oltre il montante indebolito rischia di tirarsi addosso la frana e strappare la carne."
        },
        "verdictFlavor": {
          "epicfail": "La travatura cede dall'alto con uno schianto secco, maciulla la carne e vi lascia intrappolati nella polvere.",
          "fail": "La trave scheggiata vi scortica la spalla nel passaggio, pretendendo sangue e passi preziosi.",
          "win": "Scivolate sotto il legno sospeso senza toccarlo, guadagnando pietra solida dietro a Mara Vezzi."
        },
        "outcomeLog": {
          "win": "Avete superato la strettoia instabile, accorciando il distacco da Mara Vezzi.",
          "bigwin": "Siete passati oltre l'armatura segata senza un'esitazione, mangiando quasi tutto il vantaggio di Mara Vezzi."
        }
      },
      "imboscata": {
        "title": "Il montante intagliato",
        "body": "Il canarino in gabbia resta immobile sul posatoio, senza cantare né sbattere le ali contro il ferro. Dall'altro lato della galleria, Mara Vezzi si arresta con il palmo piatto sulla roccia, tendendo l'orecchio nell'aria morta, mentre le vostre lampade a olio rivelano profondi intagli di sega incisi nel legno ben prima dell'ingresso delle squadre. Smottare il puntello rischia di chiamare la frana, ma la fibra recisa resta la prova tangibile di una manomissione precedente.",
        "failHint": "Smuovere il legno intaccato rischia di far crollare l'architrave e seppellirvi sotto lo scisto.",
        "option": {
          "label": "Gettatevi oltre il sostegno intagliato",
          "detail": "Forza e agilità. Forzare il passaggio stretto rischia lo schiacciamento o la morte pur di scivolare avanti per primi."
        },
        "verdictFlavor": {
          "epicfail": "L'armatura cede di schianto, spezzando le ossa sotto la caduta dello scisto mentre Mara scatta avanti nel buio.",
          "fail": "L'architrave scivola e scarica pietre sulle vostre schiene, bloccando l'avanzata mentre Mara trova il suo varco.",
          "win": "Il legname geme ma regge mentre scivolate oltre, strappando un piombo tagliato dai sigilli e legname d'assegnazione mentre Mara esita."
        },
        "outcomeLog": {
          "win": "Superate il legname manomesso portando con voi la prova materiale dell'antico sabotaggio, guadagnando un passo verso la vena.",
          "bigwin": "Oltrepassate il punto critico in piena sicurezza e recuperate la prova del taglio, staccando Mara di due lunghezze prima dei rintocchi della campana del turno."
        }
      },
      "vetta": {
        "title": "L’incrocio davanti alla Galleria Bassa",
        "body": "Mara Vezzi è oltre il bivio, la sua lampada a olio su una spaccatura fresca dove la vena ha allentato un sostegno. La vostra lampada vacilla, il canarino tace, l'aria viziata si raccoglie sul legno segnato. Restano due vie al fronte: la puntellata sotto la volta spaccata o il varco stretto tra le lastre. Entrambe chiedono il corpo; la prova della manomissione viaggia con voi fino al registro.",
        "transit": "La via puntellata chiede un colpo deciso sotto la volta; il varco chiede il fiato stretto tra le lastre. La scelta è quale pericolo pagare."
      }
    }
  }
};

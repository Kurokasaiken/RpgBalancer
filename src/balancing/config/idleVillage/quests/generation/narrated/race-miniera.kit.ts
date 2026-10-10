/**
 * GENERATED ARTIFACT — questNarrate (PLAN-027 r001, bilingual EN draft →
 * facts-locked IT re-render). Do not hand-edit: regenerate via
 * `scripts/questNarrate.mts`. Provenance + arc contract:
 * {
 *   "generatedAt": "2026-10-10T17:54:41.425Z",
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
 *         "term": "contatore viveri",
 *         "meaning": "Tacca metallica della dispensa di turno; determina quante razioni spettano alla squadra che ottiene l’assegnazione."
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
 *         "Il registro resta una fonte contestabile solo attraverso firme, sigilli, tavole e tempi della campana."
 *       ]
 *     },
 *     "lockedFacts": [
 *       "La corsa si svolge interamente nella Miniera e il pericolo proviene da sacche, cedimenti o manomissioni già presenti sotto terra o nel campo.",
 *       "La posta è l’assegnazione della Galleria Bassa: licenza di estrazione e razioni di turno.",
 *       "Mara Vezzi è il rivale diretto.",
 *       "Il registro dei turni controlla l’attribuzione formale di chi era dove.",
 *       "Nel buio nessun esito può dipendere da un testimone oculare: valgono solo prove fisiche o sonore.",
 *       "Mara possiede un orecchio allenato per la campana del turno, tratto che può deviare la corsa verso un taglio laterale."
 *     ]
 *   },
 *   "attempts": []
 * }
 */

import type { LocalizedRaceDomainKit } from '../raceGimmick';

export const MINIERA_RACE_KIT: LocalizedRaceDomainKit = {
  "en": {
    "id": "miniera",
    "prefix": "rn",
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
        "body": "The factor opens the shift register: its signatures alone decide who may claim the Galleria Bassa. You and Mara Vezzi leave the pit mouth for the same front; whoever marks it first earns the Licenza della Galleria Bassa and the turn rations. Lamp oil is scarce, so every detour spends light and breath; the record will make the claim stand."
      },
      "viaA": {
        "title": "The Side Cut",
        "body": "The main way to the Galleria Bassa keeps its assignment seals and timber in order, but Mara Vezzi has turned into a side cut after catching the turn bell through the stone. Your oil lamps shrink in stale air; the caged canary has stopped calling beside a support with a fresh cut. Take the side cut, and you may gain ground before the route closes.",
        "failHint": "The cut support may give way, and the quiet canary warns of bad air.",
        "option": {
          "label": "Take Mara Vezzi’s side cut",
          "detail": "Agility. Follow the bell through loose footing; a fall or bad air may cost more than time."
        },
        "verdictFlavor": {
          "epicfail": "The support drops. You drag clear with the lamp low, and Mara Vezzi hears the turn before you can move.",
          "fail": "The footing breaks under you. You regain the route hurt, with Mara Vezzi already beyond the cut.",
          "win": "You pass the altered support and keep the cage steady; Mara Vezzi’s bell-guided turn has cost her ground."
        },
        "outcomeLog": {
          "win": "The altered support and the silent canary mark the unsafe cut; you reach the Galleria Bassa a step ahead.",
          "bigwin": "You keep the lamp flame steady and find the sound route; Mara Vezzi’s diversion leaves physical marks behind."
        }
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
        "body": "At the junction, Mara Vezzi has followed the Turn Bell through the rock and changed the race. Pressing forward spends breath where the braces are uncertain; a steadier pace gives up ground but leaves time to read the numbered boards and marked plugs. You must reach and secure the Galleria Bassa before her, with enough material proof for the shift register.",
        "transit": "The route opens ahead, and its cost will remain in your breath or in the marks you can prove."
      },
      "imboscata": {
        "title": "The Cut Beneath the Supports",
        "body": "The lamp flame lowers at a support cut near its foot, and the canary in its cage has gone still. Bad air lies beyond the numbered boards; fresh tool marks show the damage was made before either crew arrived. Mara Vezzi listens toward the Turn Bell from the side passage, leaving you to decide what proof reaches the front.",
        "failHint": "Bad air waits beyond the cut support, and the boards may give beneath you.",
        "option": {
          "label": "Set the cut support aside",
          "detail": "Make room past the damaged support before Mara Vezzi reaches the front; the work may leave you hurt or buried."
        },
        "verdictFlavor": {
          "epicfail": "The support drops across the boards. You pull clear injured, while Mara Vezzi reaches farther into the passage.",
          "fail": "The boards sink under the shifted weight. You pass through hurt as Mara Vezzi takes the better line.",
          "win": "You clear the support and preserve the cut marks, boards, and silent canary as proof of the dangerous stretch."
        },
        "outcomeLog": {
          "win": "The cut support, numbered boards, lamp, and silent canary identify the unsafe route before the front.",
          "bigwin": "You leave the damaged support and its marks in place, making the danger and the interference easy to verify at the front."
        }
      },
      "vetta": {
        "title": "The Pocket Under the Supports",
        "body": "At the junction, the lamp burns low and the canary is silent. Fresh cuts beneath a numbered board show a weakened support beside foul air; both crews race to reach and close the face for the recorded Licenza della Galleria Bassa and its shift rations. Push through and risk the air and timber, or hold at the opening while Mara Vezzi advances.",
        "transit": "Marked plugs and numbered boards show which crew handled the support; the lamp and the canary’s silence fix the danger."
      },
      "fine": {
        "title": "Claimed in the Deep",
        "body": "You reach the Galleria Bassa ahead of Mara Vezzi, driving numbered boards and lead stamps into the rock supports. The steady lamp flame and the fluttering canary prove the gap sound. The shift register awards your squad the Licenza della Galleria Bassa and the shift rations; whoever signs the register signs the cut."
      },
      "sconfitta": {
        "title": "The Recorded Claim",
        "body": "Mara Vezzi claims the Galleria Bassa, taking the extraction license and the shift rations. You bring your crew back with their breath in them, carrying cracked timber and a quiet cage as proof of the foul air along the cut. The shift register stands against you, contestable only through fresh stamps, recovered boards, and the measured strokes of the turn bell."
      },
      "sicuro": {
        "title": "The Last Timber",
        "body": "The breach opens into the Galleria Bassa where rock split from the ceiling braces. Stagnant air starves the lamp flame down to a dying bead, pressing against your ribs like flat slate. Driving the assignment timbers home now will claim the vein or bring down the dead weight above.",
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
      }
    }
  },
  "it": {
    "id": "miniera",
    "prefix": "rn",
    "title": "Prima della campana del turno",
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
      "viaA": {
        "title": "Il taglio laterale",
        "body": "La via principale verso la Galleria Bassa conserva in ordine i sigilli e il legname d’assegnazione, ma Mara Vezzi ha preso un taglio laterale dopo aver udito la campana del turno attraverso la roccia. La fiamma delle vostre lampade a olio si abbassa nell’aria stantia; il canarino in gabbia ha smesso di cantare accanto a un puntello appena tagliato. Se prendete il taglio laterale, potete guadagnare terreno prima che il passaggio si chiuda.",
        "failHint": "Il puntello tagliato può cedere, e il silenzio del canarino avverte dell’aria cattiva.",
        "option": {
          "label": "Seguite il taglio laterale di Mara Vezzi",
          "detail": "Seguite la campana su un fondo instabile; una caduta o l’aria cattiva possono costare più del ritardo."
        },
        "verdictFlavor": {
          "epicfail": "Il puntello cede. Vi trascinate fuori con la lampada bassa, e Mara Vezzi sente il vostro cambio di direzione prima che possiate riprendere il passo.",
          "fail": "Il fondo vi manca sotto i piedi. Raggiungete di nuovo il percorso feriti, con Mara Vezzi già oltre il taglio.",
          "win": "Superate il puntello manomesso e tenete ferma la gabbia; la svolta guidata dalla campana è costata terreno a Mara Vezzi."
        },
        "outcomeLog": {
          "win": "Il puntello manomesso e il canarino silenzioso segnano il taglio pericoloso; raggiungete la Galleria Bassa con un passo di vantaggio.",
          "bigwin": "Tenete ferma la fiamma della lampada e trovate la via del suono; la deviazione di Mara Vezzi lascia tracce materiali alle sue spalle."
        }
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
      "imboscata": {
        "title": "Il taglio sotto i puntelli",
        "body": "La fiamma della lampada si abbassa accanto a un puntello intaccato alla base, e il canarino nella gabbia è immobile. Oltre le tavole numerate ristagna aria cattiva; i segni freschi degli attrezzi mostrano che il danno era stato fatto prima dell’arrivo di entrambe le squadre. Dal passaggio laterale, Mara Vezzi tende l’orecchio verso la campana del turno. Sta a voi decidere quale prova raggiungerà il fronte.",
        "failHint": "Oltre il puntello intaccato c’è aria cattiva, e le tavole possono cedere sotto di voi.",
        "option": {
          "label": "Scostate il puntello intaccato",
          "detail": "Fate spazio oltre il puntello danneggiato prima che Mara Vezzi raggiunga il fronte; il lavoro può lasciarvi feriti o sepolti."
        },
        "verdictFlavor": {
          "epicfail": "Il puntello crolla sulle tavole. Vi tirate fuori feriti, mentre Mara Vezzi avanza più a fondo nel cunicolo.",
          "fail": "Le tavole sprofondano sotto il peso spostato. Passate feriti mentre Mara Vezzi si assicura il tratto migliore.",
          "win": "Liberate il puntello e conservate i segni del taglio, le tavole e il silenzio del canarino come prova del tratto pericoloso."
        },
        "outcomeLog": {
          "win": "Il puntello intaccato, le tavole numerate, la lampada e il canarino silenzioso indicano quale via non è sicura prima del fronte.",
          "bigwin": "Lasciate al loro posto il puntello danneggiato e i suoi segni: al fronte, il pericolo e la manomissione si possono verificare senza dubbi."
        }
      },
      "vetta": {
        "title": "La sacca sotto i puntelli",
        "body": "Al bivio, la lampada arde bassa e il canarino tace. Tagli recenti sotto una tavola numerata mostrano un puntello indebolito accanto a un’aria cattiva; entrambe le squadre corrono a raggiungere e chiudere il fronte, per la Licenza della Galleria Bassa registrata e le razioni di turno. Potete passare rischiando aria e legname, oppure trattenervi all’imbocco mentre Mara Vezzi avanza.",
        "transit": "I piombi marcati e le tavole numerate indicano quale squadra ha toccato il puntello; la lampada e il silenzio del canarino fissano il pericolo."
      },
      "fine": {
        "title": "Rivendicazione nel fondo",
        "body": "Raggiungete la Galleria Bassa prima di Mara Vezzi, piantando i sigilli e il legname d’assegnazione nei puntelli di roccia. La fiamma ferma delle lampade a olio e il battito d'ali del canarino in gabbia confermano che il vuoto regge e l'aria tiene. Il registro dei turni assegna alla vostra squadra la licenza di scavo e le razioni di turno: chi firma il registro, firma il taglio."
      },
      "sconfitta": {
        "title": "Il reclamo a verbale",
        "body": "Mara Vezzi reclama la Galleria Bassa, portando via la licenza di estrazione e le razioni di turno. Riportate indietro la squadra con il fiato ancora in corpo, trascinando legname d'assegnazione spaccato e un canarino in gabbia ormai muto a riprova dell'aria guasta lungo il taglio. Il registro dei turni resta fermo contro di voi, contestabile soltanto con nuovi sigilli, tavole recuperate e i rintocchi misurati della campana del turno."
      },
      "sicuro": {
        "title": "L'ultima trave",
        "body": "Lo squarcio dà direttamente nella Galleria Bassa, dove la volta si è spaccata e grava storta sui sostegni. L'aria morta strozza la fiamma delle lampade a olio fino a ridurla a una goccia nera, premendo sulle costole come una lastra di scisto. Battere a fondo il legname d'assegnazione significa reclamare la vena, oppure tirarsi addosso il carico del soffitto.",
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
      }
    }
  }
};

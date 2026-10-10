/**
 * GENERATED ARTIFACT — questNarrate (PLAN-026 T4 / P3). Do not hand-edit:
 * regenerate via `scripts/questNarrate.mts`. Provenance:
 * {
 *   "generatedAt": "2026-10-10T13:18:16.192Z",
 *   "scenarioId": "gen-flood-miniera",
 *   "scenarioVersion": "gen-flood-miniera-8-50",
 *   "domain": "mare",
 *   "gimmick": "flood",
 *   "attempts": []
 * }
 */

import type { FloodDomainKit } from '../floodVault';

export const MARE_FLOOD_KIT: FloodDomainKit = {
  "id": "mare",
  "prefix": "fv",
  "title": "Riscopri il Relitto del Mare Oscuro",
  "flavour": "Le acque salgono; ogni bottino deve essere estratto prima che la marea cancelli il ricordo.",
  "objective": "Raccogli i tre carichi di legno, rame e stoffe dal magazzino dei recuperi e porta tutto al molo prima che l’acqua travolga il cantiere.",
  "intelId": "coda-rossa-7b2",
  "loot": {
    "pezzo": "Manico di spada arrugginita",
    "cassa": "Cassa di velluto impregnato",
    "madre": "Sigillo di rame inciso",
    "lingotto": "Lingotto di carbone fuso"
  },
  "copy": {
    "ingresso": {
      "title": "Ingresso al molo",
      "body": "Il molo è avvolto dall’ombra della marea che riempie le crepe, il rumore delle reti strappate echeggia mentre l’acqua avanza. Prendere la via della gabbia implica una stretta corsia dove la pressione sale in fretta; una bestia di profondità potrebbe afferrare chi resta indietro, costando un passo avanti verso la perdita del bottino. Avventurarsi nel cunicolo offre un percorso più lungo ma protetto; lì un annegato rianimato può afferrare la mano, costringendo a lasciar cadere il carico e a sacrificare tempo."
    },
    "crocevia": {
      "title": "Crocevia sul molo sommerso",
      "body": "Il molo è sommerso: reti strappate, relitto in vendita e la marea che avanza, ogni tua azione spinge l’acqua più in alto. Punta il gancio al relitto, rischi una scossa che farà perdere bottino ma guadagni un passo avanti; saccheggia il magazzino dei recuperi, attirando l’ira del maestro dei recuperi e possibile perdita di carico; cerca la camera occulta indicata dalla vedova dei naufragati, dove la strega del mare può comparire ma potresti trovare un oggetto raro. Se sei prudente, puntella la struttura, rallentando l’acqua ma sacrificando tempo e il rischio di non tornare in salvo; se la cassa madre è presente, apri la Cassa di velluto impregnato, rischiando di essere schiacciato dalla pressione dell’acqua.",
      "transit": "Scegli e affronta la marea che avanza."
    },
    "cunicolo": {
      "title": "Cunicolo sommerso",
      "body": "Il passaggio è stretto, le pareti scivolano di alghe e scaglie. L’acqua sale lentamente mentre ti avventuri, e ogni movimento porta con sé il peso del bottino. Un suono sordo di gorgoglii avverte la presenza di qualcosa che non dovrebbe essere vivo. La luce filtra a fatica, rivelando un’apertura più ampia più avanti.",
      "failHint": "Il rischio di ferita è alto e la morte è possibile, la marea non aspetta.",
      "option": {
        "label": "Avanza nel cunicolo",
        "detail": "Prova di perc, costo: un’azione, rischio: ferita o morte"
      },
      "outcomeLog": {
        "win": "Esci un passo avanti, l’acqua sale di un passo; scopri una camera occulta col segreto del mare.",
        "bigwin": "Esci due passi avanti, l’acqua sale di un passo; la camera occulta rivela tesori sommersi."
      }
    },
    "gabbia": {
      "title": "La gabbia sommersa",
      "body": "Sotto la marea, una gabbia arrugginita affiora tra le reti strappate. Dentro, un annegato rianimato si dimena, pronto a mordere chi osa avvicinarsi. Il rumore dell’acqua che sale si mescola al cigolio del metallo, segno che il tempo stringe. Recuperare il bottino richiede un gesto preciso.",
      "failHint": "Un morso improvviso può lacerarti, la morte è una minaccia reale.",
      "option": {
        "label": "Aprire la gabbia",
        "detail": "Forza e destrezza, usa un’azione per tentare l’apertura; l’acqua sale mentre agisci."
      }
    },
    "punta": {
      "title": "Punta sul molo al crepuscolo",
      "body": "Il molo si allaga, le reti strappate galleggiano tra l’acqua crescente. Il maestro dei recuperi urla di afferrare il bottino prima che la marea lo porti via. Ogni passo verso la punta spinge l’onda più in alto, ma la ricompensa è grande.",
      "failHint": "Un annegato rianimato afferra le caviglie, la corrente ti trascina verso il fondo.",
      "option": {
        "label": "Scatta verso la rete",
        "detail": "Agi test. Rischio di ferita lieve o morte rara. Fallire aggiunge acqua e riduce l’uscita; riuscire guadagna uscita e rallenta l’acqua."
      }
    },
    "vena": {
      "title": "Scavo nella Conca del Mare",
      "body": "Sul molo la marea si alza, inghiottendo reti strappate e i resti di un relitto in vendita. Il maestro dei recuperi ti indica un punto dove la sabbia si apre come una ferita. Ogni azione in quel luogo fa crescere l’acqua, ma il bottino resta lì, pronto per chi osa prenderlo. Il rischio è evidente, ma l’avidità spinge avanti.",
      "failHint": "Un’onda gelida può spezzare gambe o portare via la vita",
      "option": {
        "label": "Proseguire",
        "detail": "Check su percezione, rischio di ferita e di morte, ogni fallimento alza l’acqua di un passo"
      },
      "verdictFlavor": {
        "epicfail": "Una mano gelida ti strappa, il dolore ti pervade mentre l’acqua monta furiosa",
        "fail": "Scivoli su una rete strappata, la marea ti avvolge in fredda pressione",
        "win": "Il manico si impiglia nella tua mano mentre la schiuma ti lambisce il volto"
      },
      "outcomeLog": {
        "win": "Ottieni il «Manico di spada arrugginita»; l’acqua guadagna un passo; potresti attivare la «Cassa di velluto impregnato»",
        "bigwin": "Ottieni il «Manico di spada arrugginita»; l’acqua guadagna un passo; la «Cassa di velluto impregnato» si apre, rivelando il «Sigillo di rame inciso»"
      }
    },
    "camera": {
      "title": "Scavo nella secca: prova di forza",
      "body": "Nel magazzino dei recuperi il maestro dei recuperi ti indica una Cassa di velluto impregnato, sepolta sotto una massa di reti strappate e legno marcito. L’acqua del mare avanza lentamente, ogni movimento spinge il livello più in alto. Una persona-di-mare ti osserva, pronta a intervenire se la struttura cede. Devi afferrare la cassa e tirarla fuori prima che l’acqua ti travolga.",
      "failHint": "Il legno scricchiola: la trave può cedere, ferendoti gravemente o, più raro, uccidendoti.",
      "option": {
        "label": "Sollevare la cassa",
        "detail": "Forza: tiro di verifica. Un fallimento aggiunge due livelli d’acqua; un successo ti consente di portare fuori la cassa, più dieci monete d’oro."
      }
    },
    "madre": {
      "title": "Controllo di Forza al magazzino dei recuperi",
      "body": "Nel magazzino dei recuperi, l’acqua si alza lentamente mentre la squadra tenta di estrarre il Sigillo di rame inciso da un relitto affiorato. Una creatura di mare, un annegato rianimato, striscia tra le reti strappate, pronta a difendere il bottino. Il maestro dei recuperi ordina di agire, ma avverte il rischio di una ferita mortale. Il test è un controllo di Forza, marcato RISKY.",
      "failHint": "L’acqua impetuosa può schiacciarti: ferita grave o morte.",
      "option": {
        "label": "Recupera il Sigillo",
        "detail": "Forza richiesta alta – rischio di ferita grave o morte, l’acqua sale."
      },
      "verdictFlavor": {
        "epicfail": "Il colpo ti spezza; subisci danni gravissimi e l’acqua aumenta di tre livelli.",
        "fail": "Soffri una ferita seria; l’acqua monta di tre livelli.",
        "win": "Il Sigillo di rame inciso è tuo; l’acqua si alza poco, ma il pericolo persiste."
      },
      "outcomeLog": {
        "win": "Hai afferrato il Sigillo, l’acqua avanza di due livelli mentre fuggite verso il molo.",
        "bigwin": "Il Sigillo è tuo e l’acqua sale di un solo livello; la ricompensa supera il rischio."
      }
    },
    "puntella": {
      "title": "Puntellata sul molo di recupero",
      "body": "Sul molo, le reti strappate pendono da una struttura di legno che sta per cedere. Il maestro dei recuperi ti indica l’unica via per salvare il bottino: puntellare il supporto. L’acqua avanza minacciosa, ogni gesto alzandola di poco; una puntellata sbagliata può frantumare il legno e ferirti gravemente. Decidi se rischiare o ritirarti.",
      "failHint": "Un’asta indebolita può spezzarsi, colpendo la gamba e trascinandoti in acqua.",
      "option": {
        "label": "Puntellare l’asta",
        "detail": "Intelligenza, richiede un attimo di concentrazione; se fallisci rischi ferita o morte, l’acqua salirà."
      },
      "outcomeLog": {
        "win": "L’asta regge, l’acqua si ritira di poco e il bottino resta asciutto.",
        "bigwin": "Con maestria, l’asta resta saldo, l’acqua cala notevolmente e il relitto è ancora più accessibile."
      }
    },
    "nuoto": {
      "title": "Nuoto tra i resti",
      "body": "L’acqua si alza rapidamente mentre il gruppo si spinge verso il relitto in vendita. Le reti strappate strisciano intorno alle gambe, e una figura di persona-di-mare emerge dalla foschia. Ogni bracciata fa crescere la marea, costringendo a recuperare il bottino prima che travolga.",
      "failHint": "L’acqua può stringerti, provocare una ferita o annegare",
      "option": {
        "label": "Nuota verso il relitto",
        "detail": "Test Agi, costo: perde quattro oggetti, rischi ferita o morte"
      }
    },
    "piena": {
      "title": "Scelta al culmine della piena",
      "body": "Il molo è ormai sommerso, le reti strappate e il relitto in vendita galleggiano mentre la marea restituisce ciò che ha strappato al porto. Puoi lasciar cadere il bottino e tentare di nuotare verso la battigia, ma l’acqua fredda ti sottrae un passo avanti di respiro e ti espone al rischio di un annegato rianimato che striscia tra le onde. Oppure puoi trattenere il bottino, caricandolo nella Cassa di velluto impregnato, ma il peso rallenta la tua fuga e attira l’attenzione di una bestia di profondità che guizza tra le ombre liquide.",
      "transit": "Mollare ti costringe a nuotare verso la riva, Tenere ti lega al bottino ma attira la bestia di profondità."
    },
    "sacca": {
      "title": "Sacca nella marea",
      "body": "Il mare si alza, il suono dei flutti porta con sé relitti e reti strappate, e il tuo compito è riempire il sacco prima che l’acqua ti sommerga. Ogni pezzo di bottino che afferri aggiunge un centimetro al livello dell’acqua, così la tensione cresce a ogni gesto. Intorno a te il molo è avvolto da una bestia di profondità che osserva, pronta a colpire chi si ferma troppo a lungo.",
      "failHint": "Se l’acqua ti travolge, rischi una ferita grave e la morte.",
      "option": {
        "label": "Riempire il sacco",
        "detail": "Constitutione media, rischio alto, costo: una ferita potenziale e la possibilità di morire."
      },
      "verdictFlavor": {
        "epicfail": "Il sacco si rompe sotto il peso, il bottino affonda, subisci una ferita grave e perdi quattro oggetti.",
        "fail": "L’acqua ti travolge, perdi quattro oggetti e subisci una ferita.",
        "win": "Il sacco si chiude col bottino, il peso è sostenibile e torni al molo vivo."
      },
      "outcomeLog": {
        "win": "Hai recuperato la Cassa di velluto impregnato e il Sigillo di rame inciso, il mare restituisce il bottino.",
        "bigwin": "Il sacco è colmo di Lingotto di carbone fuso e del Manico di spada arrugginita, il maestro dei recuperi ti premia."
      }
    },
    "diaframma": {
      "title": "Il diaframma si chiude",
      "body": "Le onde si gonfiano sopra il molo, il relitto in vendita scivola verso la superficie. Il maestro dei recuperi ti ordina di afferrare la «Cassa di velluto impregnato» prima che l’acqua la sommerga. Devi trattenere il respiro mentre l’acqua sale, sapendo che un passo falso può ferirti gravemente o portarti alla morte.",
      "failHint": "Un passo falso ti farà affondare, con il rischio di ferita mortale o di annegamento.",
      "option": {
        "label": "Afferri il bottino",
        "detail": "Con check, costa un’azione; l’acqua sale più in fretta con ogni oggetto preso."
      },
      "outcomeLog": {
        "win": "Tratteni il respiro, esci dal molo con la «Cassa di velluto impregnato» intatta.",
        "bigwin": "Con la tua forza estrai la «Cassa di velluto impregnato» e il «Sigillo di rame inciso», guadagnando una decina di monete d’oro."
      }
    },
    "fine": {
      "title": "Fine della marea, bilancio dei recuperi",
      "body": "L’acqua ha lasciato sul molo la carne dei personaggi di mare, le reti strappate e il corpo dell’annegato rianimato, mentre il maestro dei recuperi ha caricato la Cassa di velluto impregnato nel magazzino dei recuperi. Il consiglio dei padroni di barca ha annotato la perdita di una bestia di profondità, ma il sensale del pescato ha registrato il bottino di bronzo e di Sigillo di rame inciso, pronto a essere venduto al contrabbandiere delle secche. Il bilancio è chiaro: ogni passo avanti nella marea ha richiesto una vita, ma ha restituito una cassa di velluto e un sigillo, il che chiude il giro di recupero."
    },
    "sbarramento": {
      "title": "Sbarramento al Molo",
      "body": "Sul molo l’acqua ha eretto un ostacolo di reti strappate e legno marcito, custodito da una persona‑di‑mare che esige bottino per avanzare. Puoi sfondare il varco, sacrificando una rete strappata e affrontando un annegato rianimato mentre l’acqua sale di un passo, oppure afferrare l’ultimo pezzo di carico, pagando una rete strappata e sfidando la bestia di profondità che difende il bottino.",
      "transit": "Scegli se sfondare o prendere l’ultimo pezzo, sapendo che il prezzo è una rete strappata e il pericolo è un annegato rianimato o una bestia di profondità."
    },
    "ultimo": {
      "title": "Ultima corsa al relitto del mare",
      "body": "Sali sul molo, l’acqua avanza inesorabile. Tra le reti strappate intravedi il luccichio di un Lingotto di carbone fuso. Un annegato rianimato si staglia nell’oscurità, pronto a strappare chiunque si avvicini. Devi fare un check su percezione per afferrare il bottino prima che l’acqua ti sommerga.",
      "failHint": "Un annegato rianimato potrebbe afferrarti e trascinarti sotto.",
      "option": {
        "label": "Afferra il Lingotto",
        "detail": "Percezione; Un’azione; Se fallisci l’acqua sale di poco, se riesci il bottino è tuo."
      }
    }
  }
};

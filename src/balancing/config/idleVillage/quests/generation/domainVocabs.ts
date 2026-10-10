/**
 * domainVocabs — typed domain vocabularies for the narration pipeline
 * (PLAN-026 T4 / P3). Trascritti dal «Domain kit compilato» di
 * context/QUEST_IMPRINTS.md — stessa sostanza, forma dati.
 *
 * Ruolo nella pipeline: un `DomainVocab` è l'input semantico del
 * NarrativeBrief — dice AL modello cosa può abitare il mondo (mayInvent)
 * e cosa è vietato (forbidden, derivato dalle regole di coerenza).
 * NON contiene copy: la copy la scrive il provider, il validatore la
 * verifica contro queste liste.
 */

/** A domain vocabulary — what exists in this world, and what breaks it. */
export interface DomainVocab {
  id: string;
  label: string;
  /** A one-line contract pitch for this domain — seeds the scenario meta. */
  contractPitch: string;
  creatureAmmissibili: string[];
  /** EN rendering of `creatureAmmissibili` — same whitelist, per-locale. */
  creatureAmmissibiliEn?: string[];
  ruoli: {
    autoritaContratto: string[];
    stakeholderEconomico: string[];
    testimoneComune: string[];
  };
  luoghi: string[];
  props: string[];
  cicli: string[];
  pericoliAmbientali: string[];
  tracceAmmissibili: string[];
  /** Hard coherence rules (verbatim from QUEST_IMPRINTS). */
  coerenza: string[];
  /**
   * Banned imagery keywords the deterministic validator scans for
   * (lowercase, word-stem match). Derived from `coerenza` + the kit's own
   * VIETATO notes — a hit is a narration failure, not a soft warning.
   */
  vietati: string[];
  /** EN rendering of `vietati` — the gate checks the draft's own locale. */
  vietatiEn?: string[];
}

export const PASSO_MONTANO_VOCAB: DomainVocab = {
  id: 'passo-montano',
  label: 'Passo montano',
  contractPitch: 'Una gara su un valico alpino: chi arriva prima prende il premio, chi sbaglia passo paga in caduta.',
  creatureAmmissibili: ['branco di predoni di valico', 'bestia di cresta', 'contrabbandiere del valico'],
  creatureAmmissibiliEn: ['band of pass brigands', 'ridge beast', 'pass smuggler'],
  ruoli: {
    autoritaContratto: ['capo della guida alpina', 'ufficiale del pedaggio'],
    stakeholderEconomico: ['predoni che vendono il passo', 'oste del rifugio'],
    testimoneComune: ['mulattiere', 'guardiano del rifugio', 'vecchia guida'],
  },
  luoghi: ['crepa del ghiacciaio', 'rifugio', 'cresta', 'sentiero dei muli', 'varco di cresta'],
  props: ['piccozza', 'corda da ghiaccio', 'insegna del rifugio', 'campana di vetta'],
  cicli: ['finestra di bel tempo', 'valanga primaverile', 'stagione dei muli'],
  pericoliAmbientali: ['ghiacco vivo', 'caduta', 'vento di cresta', 'crepaccio nascosto'],
  tracceAmmissibili: ['funi tagliate', 'orme sulla neve che spariscono', 'bandierine spostate'],
  coerenza: [
    'la gara è verticale: niente pianura, niente acqua',
    'il freddo uccide prima del mostro',
    'chi controlla il varco controlla il passo',
  ],
  vietati: ['mare', 'onda', 'marea', 'fango', 'palude', 'galleria', 'miniera', 'deserto', 'duna'],
  vietatiEn: ['sea', 'wave', 'tide', 'mud', 'swamp', 'gallery', 'mine', 'desert', 'dune'],
};

export const PALUDE_VOCAB: DomainVocab = {
  id: 'palude',
  label: 'Palude',
  contractPitch: 'Acqua bassa e stagnante, fango che affonda, nebbia che isola: chi possiede le chiuse possiede la terra.',
  creatureAmmissibili: ['fuoco fatuo', 'annegato rianimato', 'bestia da fango', 'persona trasformata'],
  creatureAmmissibiliEn: ['will-o-wisp', 'drowned revenant', 'mud beast', 'transformed person'],
  ruoli: {
    autoritaContratto: ['capo delle chiuse', 'concistoro dei torbei', 'curato itinerante'],
    stakeholderEconomico: ['guardiano delle chiuse', 'sensale della torba', 'mugnaio', 'compagnia dei dissodamenti'],
    testimoneComune: ['pescatore di anguille', 'raccoglitrice di erbe', 'traghettatore', 'guardiano del pontile'],
  },
  luoghi: ['mulino su canale', 'pontile', 'torbaia', 'cappella del poggio asciutto', 'passarelle', 'chiuse'],
  props: ['reti da anguille', 'falce', 'ceste di torba', 'lanterna da nebbia', 'registro dei livelli', 'barca da canale'],
  cicli: ['nebbia dell’alba', 'apertura stagionale delle chiuse', 'corsa delle anguille', 'luna'],
  pericoliAmbientali: ['acqua bassa e stagnante', 'fango che affonda', 'nebbia', 'passerelle che cedono'],
  tracceAmmissibili: ['orme nel fango che partono da un luogo', 'reti aperte dall’interno', 'lanterna spenta in un piede d’acqua'],
  coerenza: [
    'niente onde/maree/profondità — l’acqua è bassa e stagnante',
    'i corpi spariscono nel limo, non riemergono',
    'di notte la nebbia isola: niente testimoni oculari a distanza',
    'spostamenti solo in barca o passerella: niente cavalli',
    'il potere è il livello dell’acqua, non il denaro',
  ],
  vietati: ['marea', 'onda', 'onda anomala', 'mare aperto', 'relitto affondato', 'cavallo', 'galoppo', 'montagna', 'vetta', 'ghiacciaio', 'deserto', 'duna', 'galleria', 'miniera'],
  vietatiEn: ['tide', 'wave', 'freak wave', 'open sea', 'sunken wreck', 'horse', 'gallop', 'mountain', 'summit', 'glacier', 'desert', 'dune', 'gallery', 'mine'],
};

export const MARE_VOCAB: DomainVocab = {
  id: 'mare',
  label: 'Mare',
  contractPitch: 'La marea restituisce ciò che prende: corpi, reti, relitti. Il potere qui è sui diritti di recupero, non sul denaro.',
  creatureAmmissibili: ['persona-di-mare', 'annegato rianimato', 'bestia di profondità', 'strega del mare'],
  creatureAmmissibiliEn: ['sea-person', 'drowned revenant', 'deep beast', 'sea witch'],
  ruoli: {
    autoritaContratto: ['capitaneria del porto', 'consiglio dei padroni di barca', 'parroco marinaro'],
    stakeholderEconomico: ['maestro dei recuperi', 'armatore-assicuratore', 'sensale del pescato', 'contrabbandiere delle secche'],
    testimoneComune: ['pescatore da riva', 'guardiano del faro', 'vedova dei naufragati', 'oste del porto'],
  },
  luoghi: ['molo', 'cantiere di riparazione', 'magazzino dei recuperi', 'secca', 'locanda del porto', 'faro', 'battigia'],
  props: ['reti strappate', 'relitto in vendita', 'registro dei recuperi', 'pece e sigilli', 'lampada a olio', 'lenze', 'campana del porto'],
  cicli: ['maree', 'luna nuova', 'stagione delle tempeste', 'rientro delle flotte'],
  pericoliAmbientali: ['risacca', 'buio sull’acqua', 'scogli affioranti', 'freddo'],
  tracceAmmissibili: ['corpi restituiti dalla marea', 'barca intatta senza equipaggio', 'reti tagliate dal basso', 'oggetti del naufragio già rivenduti'],
  coerenza: [
    'le vittime in mare lasciano prove nel mare: corpi, reti, relitti',
    'il potere è sui diritti (recuperi, dazi, approdo), non sul denaro',
    'di notte sull’acqua niente testimoni oculari a distanza',
    'la direzione nativa: «viene dal profondo» vs «torna a riva»',
  ],
  vietati: ['fango', 'torba', 'chiuse', 'galleria', 'miniera', 'piccone', 'vena', 'montagna', 'vetta', 'ghiacciaio', 'deserto', 'duna', 'cavallo', 'galoppo'],
  vietatiEn: ['mud', 'peat', 'sluice', 'gallery', 'mine', 'pickaxe', 'vein', 'mountain', 'summit', 'glacier', 'desert', 'dune', 'horse', 'gallop'],
};

export const MINIERA_VOCAB: DomainVocab = {
  id: 'miniera',
  label: 'Miniera',
  contractPitch: 'La vena paga in metallo e prende in fiato: il registro dei turni decide chi era dove, il buio il resto.',
  creatureAmmissibili: ['persona trasformata dalla vena', 'scavatore impazzito nel buio', 'la vena stessa', 'cane da galleria cieco'],
  creatureAmmissibiliEn: ['vein-transformed person', 'digger gone mad in the dark', 'the vein itself', 'blind gallery dog'],
  ruoli: {
    autoritaContratto: ['fattore della compagnia', 'caposquadra anziano', 'sindaco del campo'],
    stakeholderEconomico: ['fattore', 'proprietario del campo', 'venditore di viveri a prezzi di monopolio'],
    testimoneComune: ['minatore di turno', 'ragazzo delle gabbie', 'medico del campo', 'vedova del campo'],
  },
  luoghi: ['galleria bassa sigillata', 'bocca del pozzo', 'dormitorio', 'magazzino viveri', 'galleria di scarico', 'ufficio del fattore', 'catasta del puntellame'],
  props: ['registro dei turni', 'sigilli e legname d’assegnazione', 'contatore viveri', 'campana del turno', 'lampade a olio', 'canarino in gabbia'],
  cicli: ['campana del turno', 'paga quindicinale', 'spedizione del carico', 'chiusura stagionale'],
  pericoliAmbientali: ['buio totale', 'aria cattiva', 'puntellamento che cede', 'dislivelli', 'galleria che si restringe'],
  tracceAmmissibili: ['ferite «umane» sui corpi risaliti', 'ruberie di viveri nel dormitorio', 'turni firmati da chi era morto', 'attrezzi morsicati', 'voci nel buio'],
  coerenza: [
    'il buio non ammette testimoni oculari: prove fisiche o sonore',
    'la cosa non può «venire da fuori»: o è sotto, o era già nel campo',
    'il potere è la licenza di estrazione e le scorte, non il denaro',
    'chi controlla il registro dei turni controlla chi era dove',
  ],
  vietati: ['mare', 'onda', 'marea', 'fango', 'palude', 'torba', 'cavallo', 'galoppo', 'deserto', 'duna', 'cielo aperto'],
  vietatiEn: ['sea', 'wave', 'tide', 'mud', 'swamp', 'peat', 'horse', 'gallop', 'desert', 'dune', 'open sky'],
};

export const DOMAIN_VOCABS: Readonly<Record<string, DomainVocab>> = {
  [PASSO_MONTANO_VOCAB.id]: PASSO_MONTANO_VOCAB,
  [PALUDE_VOCAB.id]: PALUDE_VOCAB,
  [MARE_VOCAB.id]: MARE_VOCAB,
  [MINIERA_VOCAB.id]: MINIERA_VOCAB,
};

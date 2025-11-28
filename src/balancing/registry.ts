export interface ParameterDefinition {
    id: string;
    name: string;
    description: string;
    defaultValue: number;
    formulas: string[]; // IDs of formulas where this param is used
}

export interface ConstantDefinition {
    value: number;
    name: string;
    description: string;
}

export const CONSTANTS = {
    BASE_HIT_CHANCE: {
        value: 50,
        name: "Probabilità Base",
        description: "La probabilità di colpire di base prima di applicare TxC ed Evasione."
    },
};

export const PARAM_DEFINITIONS: Record<string, ParameterDefinition> = {
    // CORE
    hp: {
        id: 'hp',
        name: "Punti Ferita (HP)",
        description: "La quantità di danno che un'entità può subire prima di andare KO.",
        defaultValue: 100,
        formulas: ["HTK", "AttacchiPerKO"]
    },
    damage: {
        id: 'damage',
        name: "Danno Base",
        description: "Il danno inflitto da un singolo colpo andato a segno (prima dei critici).",
        defaultValue: 25,
        formulas: ["HTK", "AttacchiPerKO"]
    },
    htk: {
        id: 'htk',
        name: "HTK (Puro)",
        description: "Hits To Kill: Numero di colpi necessari per uccidere, assumendo che tutti colpiscano e facciano danno base.",
        defaultValue: 4,
        formulas: ["AttacchiPerKO"]
    },

    // HIT CHANCE
    txc: {
        id: 'txc',
        name: "Tiro x Colpire (TxC)",
        description: "Valore che rappresenta la precisione dell'attaccante.",
        defaultValue: 25,
        formulas: ["HitChance", "AttacchiPerKO"]
    },
    evasion: {
        id: 'evasion',
        name: "Evasione",
        description: "Valore che rappresenta la capacità del difensore di evitare i colpi.",
        defaultValue: 0,
        formulas: ["HitChance", "AttacchiPerKO"]
    },
    hitChance: {
        id: 'hitChance',
        name: "Probabilità di Colpire",
        description: "La % finale di mettere a segno un colpo.",
        defaultValue: 75,
        formulas: ["AttacchiPerKO"]
    },
    attacksPerKo: {
        id: 'attacksPerKo',
        name: "Attacchi Per KO",
        description: "Numero medio di attacchi da tirare per sconfiggere l'avversario, considerando la % di colpire e i critici.",
        defaultValue: 5.33,
        formulas: []
    },

    // CRITICAL
    critChance: {
        id: 'critChance',
        name: "Chance Critico",
        description: "Probabilità % di effettuare un Colpo Critico.",
        defaultValue: 5,
        formulas: ["AttacchiPerKO"]
    },
    critMult: {
        id: 'critMult',
        name: "Moltiplicatore Critico",
        description: "Moltiplicatore del danno quando avviene un critico (es. 2.0 = doppio danno).",
        defaultValue: 2.0,
        formulas: ["AttacchiPerKO"]
    },
    critTxCBonus: {
        id: 'critTxCBonus',
        name: "Bonus TxC Critico",
        description: "Bonus aggiunto al TxC quando si tenta di confermare un critico.",
        defaultValue: 20,
        formulas: ["HitChance (Critico)"]
    },
    failChance: {
        id: 'failChance',
        name: "Chance Fallimento",
        description: "Probabilità % di effettuare un Fallimento Critico.",
        defaultValue: 5,
        formulas: ["AttacchiPerKO"]
    },
    failMult: {
        id: 'failMult',
        name: "Moltiplicatore Fallimento",
        description: "Moltiplicatore del danno quando avviene un fallimento (es. 0.0 = nessun danno).",
        defaultValue: 0.0,
        formulas: ["AttacchiPerKO"]
    },
    failTxCMalus: {
        id: 'failTxCMalus',
        name: "Malus TxC Fallimento",
        description: "Malus sottratto al TxC quando si rischia un fallimento.",
        defaultValue: 20,
        formulas: ["HitChance (Fallimento)"]
    },

    // MITIGATION
    armor: {
        id: 'armor',
        name: "Armatura (%)",
        description: "Riduzione percentuale del danno (Formula: Armor / (Armor + 50)).",
        defaultValue: 0,
        formulas: ["Danno Effettivo", "EDPT"]
    },
    ward: {
        id: 'ward',
        name: "Armatura (Flat)",
        description: "Riduzione fissa del danno subito (applicata dopo la % mitigation).",
        defaultValue: 0,
        formulas: ["Danno Effettivo", "EDPT"]
    },
    resistance: {
        id: 'resistance',
        name: "Resistenza (%)",
        description: "Riduzione percentuale del danno (Legacy/Secondaria).",
        defaultValue: 0,
        formulas: ["Danno Effettivo"]
    },
    armorPen: {
        id: 'armorPen',
        name: "Penetrazione (Flat)",
        description: "Ignora una quantità fissa di armatura avversaria.",
        defaultValue: 0,
        formulas: ["Danno Effettivo"]
    },
    penPercent: {
        id: 'penPercent',
        name: "Penetrazione (%)",
        description: "Ignora una percentuale della resistenza avversaria.",
        defaultValue: 0,
        formulas: ["Danno Effettivo"]
    },
    effectiveDamage: {
        id: 'effectiveDamage',
        name: "Danno Effettivo",
        description: "Il danno finale dopo aver applicato mitigazione (armatura e resistenza).",
        defaultValue: 25,
        formulas: ["AttacchiPerKO"]
    },

    // SUSTAIN
    lifesteal: {
        id: 'lifesteal',
        name: "Rubavita (%)",
        description: "Percentuale del danno inflitto recuperata come HP.",
        defaultValue: 0,
        formulas: ["Sustain", "TTK"]
    },
    regen: {
        id: 'regen',
        name: "Rigenerazione",
        description: "HP recuperati per turno.",
        defaultValue: 0,
        formulas: ["Sustain", "TTK"]
    },

    // COMBAT METRICS (Self vs Self)
    ttk: {
        id: 'ttk',
        name: "Time To Kill (TTK)",
        description: "Turni medi necessari per sconfiggere l'avversario (HP / EDPT).",
        defaultValue: 0,
        formulas: ["HP / EDPT"]
    },
    edpt: {
        id: 'edpt',
        name: "Effective Dmg/Turn",
        description: "Danno medio inflitto per turno, considerando Hit%, Crit%, Mitigation e Sustain avversario.",
        defaultValue: 0,
        formulas: ["Danno * Hit% * Crit% * (1-Mit%)"]
    },
    earlyImpact: {
        id: 'earlyImpact',
        name: "Early Impact",
        description: "Danno totale inflitto nei primi 3 turni (Burst).",
        defaultValue: 0,
        formulas: ["EDPT * 3"]
    },

    // TIMING/SPEED (NOT YET BALANCED)
    cooldownReduction: {
        id: 'cooldownReduction',
        name: "Riduzione Ricarica (%)",
        description: "⚠️ NON BILANCIATO. Riduce i tempi di ricarica delle abilità. Formula: ?",
        defaultValue: 0,
        formulas: ["Cooldown Effettivo"]
    },
    castSpeed: {
        id: 'castSpeed',
        name: "Velocità Lancio (%)",
        description: "⚠️ NON BILANCIATO. Aumenta la velocità di lancio degli incantesimi. Formula: ?",
        defaultValue: 0,
        formulas: ["Tempo Lancio"]
    },
    movementSpeed: {
        id: 'movementSpeed',
        name: "Velocità Movimento (%)",
        description: "⚠️ NON BILANCIATO (PvE only). Velocità di movimento. Formula: ?",
        defaultValue: 100,
        formulas: ["Kiting Factor"]
    },
};

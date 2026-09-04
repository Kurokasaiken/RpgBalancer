# RPG BALANCER — MASTER CONTEXT / HANDOFF

**Status:** `DRAFT`  
**Scope:** Sistema matematico di bilanciamento per il combattimento del gioco, Spell Creator ed Equipment Creator.  
**Source:** discussioni di design + sorgente locale `src/balancing/` + `balance_model_v1.md` + `RICHIESTE.md` R-064.  
**Last updated:** 2026-09-04  

Questo documento è il **vero dump del contesto di lavoro**, non un riassunto tecnico. Per ogni informazione indica esplicitamente il suo status: `CANONICA`, `DESIGN INTENT`, `IMPLEMENTAZIONE ATTUALE`, `TEST SPERIMENTALE`, `DA DECIDERE`, `INCONSISTENTE`.

---

## 00 — Scopo di questo documento

- Preservare **perché** stiamo costruendo il Balancer, non solo **cosa** fa il codice.
- Separare in modo esplicito: *feeling di design* → *parametri* → *formule canoniche* → *valori derivati*.
- Tracciare cosa è stato deciso dal Director, cosa è attualmente implementato, cosa sono solo esperimenti e cosa è ancora aperto.
- Fornire a chiunque riprenda il lavoro (umano o agente) una mappa che impedisca di confondere “esiste nel codice” con “è stato deciso”.
- Non promuovere automaticamente valori sperimentali a regole canoniche.

---

## 01 — Visione generale del gioco

`[DESIGN INTENT]` Il progetto è un **Village / incremental management RPG** con un loop strategico (ispirato a Lords of Waterdeep) e combattimento gestito come skill-check deterministico/stat-based, non come combat system action. La superficie canonica di runtime è `/minimal-gameplay` (vedi `CURRENT_STATE.md`).

`[CANONICA]` Il sistema di bilanciamento non è un modulo accessorio: deve governare il **combattimento del gioco** e alimentare tutti i creator di contenuti (spell, equipaggiamento, archetipi, scenari).

---

## 02 — Problema che stiamo cercando di risolvere

`[DESIGN INTENT]` Non vogliamo bilanciare a mano ogni stat, incantesimo, oggetto e incontro. Vogliamo un **regolamento matematico** nel quale:

1. Il designer esprime il *feeling* desiderato (es. “un combattimento standard dura circa N round” oppure “un nemico standard richiede circa M colpi a segno”).
2. Questi feeling diventano **parametri configurabili** nel Balancer.
3. Le **formule** sono stabili e propagano automaticamente le conseguenze di ogni cambio di parametro.
4. I creator di contenuti (Spell Creator, Equipment Creator, ecc.) **consumano** il modello del Balancer invece di re-inventare la matematica.

---

## 03 — Filosofia di design

`[CANONICA]`

- **Formule stabili, parametri configurabili.** Le formule non cambiano ogni volta che cambia il feeling. Cambiano i valori in input.
- **Balancer = source of truth.** Baseline, pesi, curve e formule vivono nel Balancer. Spell Creator ed Equipment Creator leggono questi valori.
- **Non forzare tutte le build allo stesso potere.** I personaggi partono neutri; identità e potere emergono da skill, equip, passivi, sinergie.
- **La sinergia è voluta.** Valore isolato di una stat ≠ valore della combinazione. Il sistema deve misurare il valore marginale in contesto, non azzerare le differenze.
- **Scenari come contesti, non come override di formule.** Uno scenario modifica i parametri che le formule ricevono, non riscrive le formule.
- **Niente valori hardcoded nei componenti.** Config-first: stats, pesi, formule, preset e skin vengono da moduli di configurazione, non da codice UI o `.css`.

---

## 04 — Feeling del combattimento

`[DESIGN TARGET — DA CONFERMARE/REGOLARE]`

Questi sono **input di feeling**, non verità matematiche:

- Un combattimento standard dovrebbe durare circa **6 round** (target citato nelle discussioni).
- Un avversario standard dovrebbe richiedere circa **4 colpi a segno** per essere sconfitto (landed hits, non round).
- La baseline neutra (due entità identiche, simmetriche) deve produrre un win-rate circa **50/50**.
- I round non sono un obiettivo universale: sono un riferimento di feeling che può essere aggiustato tramite parametri, non una legge della fisica del gioco.

`[DESIGN INTENT]` Il designer deve poter dire “oggi voglio combattimenti più lunghi” e il sistema deve ricalcolare tutto cambiando i parametri di input, non riscrivendo le formule.

---

## 05 — Modello concettuale

`[CANONICA]` La catena è:

```
Design Intent / Feeling
        ↓
Parametri configurabili (es. HP, Damage, baseHitChance, targetTurns)
        ↓
Formule canoniche stabili (es. HTK = HP / Damage)
        ↓
Valori derivati (es. attacksPerKo, TTK, EDPT)
```

- **Design intent:** cosa vuole sentire il giocatore. Non è matematico.
- **Parametri:** numeri che il designer può modificare per ottenere quel feeling.
- **Formule:** relazioni matematiche che restano stabili.
- **Valori derivati:** output prodotti dalle formule; possono essere “bloccati” nel Balancer e fatti risolvere al contrario.

`[CANONICA]` Un valore derivato non deve essere modificato a mano per forzare il risultato: si aggiusta il parametro in input e la formula lo propaga.

---

## 06 — Balancer: inventario delle grandezze

Stati usati:

- `CANONICA` — decisa e stabile.
- `DESIGN INTENT` — direzione concordata, può essere resa parametro.
- `IMPLEMENTAZIONE ATTUALE` — cosa c’è nel codice oggi.
- `TEST SPERIMENTALE` — risultato di simulazioni/discussioni, **non** una regola.
- `DA DECIDERE` — aperta, non dev’essere inventata.
- `INCONSISTENTE` — lo stesso concetto è definito in modi diversi.

| Stat | Significato | Formula / ruolo | Baseline candidate | Status | Note / Source |
|------|-------------|-------------------|----------------------|--------|---------------|
| `hp` | Punti ferita | Input base | 100 (`baseline.ts`) / 150 (`defaultConfig`) | `INCONSISTENTE` | unità di riferimento del peso |
| `damage` | Danno base per colpo a segno | Input base | 25 / 35.7 | `INCONSISTENTE` | vedi pesi §09 |
| `htk` | Hits to Kill (puro) | `hp / damage` | 4 / 4.2 | `INCONSISTENTE` | dipende dalla baseline scelta |
| `txc` | Tiro x Colpire / accuracy | Input base | 25 | `CANONICA` (come parametro) | +1 TxC → +1% hit nella formula semplice |
| `evasion` | Evasione | Input base | 0 | `CANONICA` (come parametro) | simmetrica a TxC |
| `baseHitChance` | Hit % quando TxC = Evasion | Input base | 50 | `CANONICA` (come parametro) | tuning globale dell’accuracy |
| `hitChance` | Probabilità finale di colpire | `txc - evasion + baseHitChance` (UI/config) oppure media pesata di normal/crit/fail (engine) | 75% | `INCONSISTENTE` | formula UI semplice vs engine completa |
| `critChance` | % crit | Input base | 5 | `CANONICA` (come parametro) | |
| `critMult` | Moltiplicatore crit | Input base | 2 | `CANONICA` (come parametro) | |
| `critTxCBonus` | Bonus TxC sul tentativo crit | Input base | 20 | `CANONICA` (come parametro) | |
| `failChance` | % failure | Input base | 0 (config) / 5 (baseline) | `INCONSISTENTE` | |
| `failMult` | Moltiplicatore failure | Input base | 0 | `CANONICA` (come parametro) | |
| `failTxCMalus` | Malus TxC sul tentativo fail | Input base | 20 | `CANONICA` (come parametro) | |
| `ward` | Scudo flat | Input base | 0 | `INCONSISTENTE` | usato da UI/`CombatMetrics`, ignorato da `MitigationModule` |
| `armor` | Mitigazione fisica | `armor / (armor + 10 * damage)` (engine) vs `armor/(armor+50)` (altri) vs `armor%` lineare (UI) | 0 | `INCONSISTENTE` | vedi §07 |
| `resistance` | Mitigazione magica / secondaria | `%` lineare in engine: `(resistance - penPercent) / 100` | 0 | `CANONICA` (come parametro); pesi in discussione | |
| `armorPen` | Penetrazione flat armor | Input base | 0 | `CANONICA` (come parametro) | |
| `penPercent` | Penetrazione % resistance | Input base | 0 | `CANONICA` (come parametro) | |
| `effectiveDamage` | Danno dopo mitigazione | formula config vs engine molto diverse | 25 / 35.7 | `INCONSISTENTE` | §07 |
| `lifesteal` | % danno restituito come HP | Input base | 0 | `INCONSISTENTE` | pesi molto discordanti; trattamento diverso nei motori |
| `regen` | HP recuperati per turno | Input base | 0 | `INCONSISTENTE` | pesi molto discordanti |
| `ttk` | Turni per sconfiggere | `hp / edpt` | variabile | `INCONSISTENTE` | semplificato in UI, engine più completo |
| `edpt` | Danno effettivo per turno | `effectiveDamage * hitChance/100` (UI) vs engine | 18.75 / 37.5 | `INCONSISTENTE` | §07 |
| `earlyImpact` | Danno primi 3 turni | `edpt * 3` | 56.25 / 112.5 | `INCONSISTENTE` | dipende da `edpt` |
| `attacksPerKo` | Numero medio attacchi per KO | almeno 4 formule diverse | 5.33 / 5.3 | `INCONSISTENTE` | §07 |

Per i dettagli tecnici completi vedi `src/docs/docs/balancer/balance_model_v1.md`.

---

## 07 — Formule

`[DESIGN INTENT]` Il sistema deve avere **una sola formula canonica per concetto**. Se due moduli calcolano la stessa cosa in modo diverso, è un’anomalia da risolvere.

| Concetto | Formula / implementazione | Dove | Status |
|----------|---------------------------|------|--------|
| HTK | `hp / damage` | `CoreModule.calculateHTK`, `defaultConfig.ts` | `CANONICA` come struttura; valori in discussione |
| Hit chance semplice | `txc - evasion + baseHitChance` | `defaultConfig.ts`, `hitchance.ts` | `IMPLEMENTAZIONE ATTUALE` (UI/config) |
| Hit chance completa | media pesata delle probabilità di hit per normal/crit/fail | `CriticalModule` | `IMPLEMENTAZIONE ATTUALE` (engine) |
| Attacchi per KO | `htk / (hitChance / 100)` | `HitChanceModule` | `INCONSISTENTE` |
| Attacchi per KO | `htkPure / (effectiveHitChance/100 * avgDmgMult)` | `CriticalModule` | `INCONSISTENTE` |
| Attacchi per KO | `hp / (effectiveChance/100 * avgEffectiveDamage)` | `solver.ts` | `INCONSISTENTE` |
| Attacchi per KO | `htk / hitChance` | `defaultConfig.ts` (sballato dimensionalmente) | `INCONSISTENTE` / BUG |
| Effective damage (config/UI) | `damage * (1 - armor/100) - ward` | `defaultConfig.ts` | `INCONSISTENTE` |
| Effective damage (engine) | `damage * (1 - armorReduction) * (1 - resistance%)`, con `armorReduction = armor / (armor + 10 * damage)` capped 90% | `MitigationModule` | `IMPLEMENTAZIONE ATTUALE` (engine) |
| Effective damage (`CombatMetrics`) | `damage * (1 - armor/(armor+50)) - ward` | `CombatMetrics` | `INCONSISTENTE` |
| Armor desc. (`registry.ts`) | `armor / (armor + 50)` | `registry.ts` | `INCONSISTENTE` (stale) |
| EDPT (config) | `effectiveDamage * hitChance / 100` | `defaultConfig.ts` | `INCONSISTENTE` |
| EDPT (engine `MathEngine`) | `expectedDamagePerHit * expectedHitsPerTurn` → mitigato → `- regen` | `mathEngine.ts` | `IMPLEMENTAZIONE ATTUALE` (engine) |
| EDPT (`CombatMetrics`) | formula diversa con base hit 90%, `armor/(armor+50)`, `ward` flat, `lifesteal` come sustain | `metrics/CombatMetrics.ts` | `INCONSISTENTE` |
| EDPT (`CombatPredictor`) | `dmgPerHit * (hitChance/100)`, con crit approssimato `1 + critChance*(critMult-1)` | `combatPredictor.ts` | `INCONSISTENTE` |
| TTK | `hp / edpt` | vari | `CANONICA` come struttura; dipende da quale `edpt` |
| Early impact | `edpt * 3` | vari | `CANONICA` come struttura; dipende da quale `edpt` |
| DoT total value | `abs(amountPerTurn) * duration * stacks` | `DotModule` | `IMPLEMENTAZIONE ATTUALE`; curva globale desiderata §11 |
| AoE multiplier | hard-coded step: `0.8` (2-3 target), `0.6` (4-5), `0.5` (6+) | `SpellCostModule` | `INCONSISTENTE` / `DA DECIDERE` |
| Spell power | somma di componenti × AoE × `dangerous` factor | `SpellCostModule` | `IMPLEMENTAZIONE ATTUALE`; `dangerous` da chiarire |
| Mana cost | `(totalPower / 2.0) * typeEff * cooldownFactor * castTimePenalty` | `SpellCostModule` | `IMPLEMENTAZIONE ATTUALE` (esperimento) |

`[DA DECIDERE]` Quale motore diventa il canonical engine per il combat math. I candidati sono `MitigationModule`/`CriticalModule`/`MathEngine`/`solver.ts`/`CombatMetrics`/`CombatPredictor`.

---

## 08 — Baseline

`[DA DECIDERE]` Quale baseline è quella canonica.

| Source | HP | Damage | HTK | Hit chance | Note | Status |
|--------|----|--------|-----|------------|------|--------|
| `baseline.ts` (`BASELINE_STATS`) | 100 | 25 | 4 | 75% | Validata con 10.000 simulazioni Monte Carlo (50.05%/49.95%, ~4.47 turni medi) | `TEST SPERIMENTALE VALIDATO` — candidato forte |
| `types.ts` (`DEFAULT_STATS`) | 150 | 25 | 0 (derivato) | 0 (derivato) | Default runtime stat block | `IMPLEMENTAZIONE ATTUALE` |
| `defaultConfig.ts` | 150 | 35.7 | 4.2 | 75% | UI / shipping default; `150 / 35.7 ≈ 4.2017` | `IMPLEMENTAZIONE ATTUALE` |
| `balancer-default-config.json` | 150 | 35.7 | 4.2 | 75% | Config serializzata dello store | `IMPLEMENTAZIONE ATTUALE` |
| `balancingConfig.ts` legacy | 100 | 25 | 4 | — | Legacy constants | `IMPLEMENTAZIONE ATTUALE` / legacy |

`[DESIGN INTENT]` La baseline neutra deve rappresentare un combattimento simmetrico ~50/50 in condizioni identiche e deve essere espressa come parametri nel Balancer, non come verità assoluta. La scelta tra 100/25/4 e 150/35.7/4.2 è tua.

---

## 09 — Weights

`[INCONSISTENTE]` Esistono almeno tre fonti attive:

1. **`CORE_STAT_WEIGHTS`** (`src/balancing/statWeights.ts`) — pesi empirici/Monte Carlo, espressi in “HP equivalent per 1 punto di stat”.
2. **`NORMALIZED_WEIGHTS`** (`src/balancing/statWeights.ts`) — pesi normalizzati con `hp = 1.0`.
3. **`DEFAULT_CONFIG.stats.<stat>.weight`** (`defaultConfig.ts`, `balancer-default-config.json`) — pesi della UI/store.

Conflitti chiave:

| Stat | `CORE_STAT_WEIGHTS` | `NORMALIZED_WEIGHTS` / `DEFAULT_CONFIG` | Note |
|------|---------------------|-----------------------------------------|------|
| damage | 1.0 | 5.0 | `getStatWeight()` guarda prima `CORE_STAT_WEIGHTS` |
| armor | 2.8 | 5.0 | |
| resistance | 100.0 | 5.0 | 20× di differenza |
| lifesteal | 800.0 | 100.0 | 8× |
| regen | 2000.0 | 20.0 | 100× |

`[INCONSISTENTE]` `getStatWeight()` cerca in `CORE_STAT_WEIGHTS` per primo. Quindi `calculateItemPower` e altri consumer usano `damage = 1.0`, ignorando i pesi 5.0 di `DEFAULT_CONFIG`/`NORMALIZED_WEIGHTS`.

`[DA DECIDERE]` Quale tabella è canonica: quella empirica (`CORE_STAT_WEIGHTS`) o quella di gameplay target (`NORMALIZED_WEIGHTS`)? La risposta determina tutto il resto.

---

## 10 — Simulazione

`[DESIGN INTENT]` La simulazione è uno strumento per **validare** che un peso/proposta corrisponda all’impatto osservato in combattimento, non per decidere a caso. Monte Carlo su incontri 1v1 simmetrici resta il test di riferimento.

`[INCONSISTENTE]` Oggi ci sono più motori di simulazione che non concordano:

- **`CriticalModule`** — calcola hit chance media pesata e moltiplicatore medio danno in modo rigoroso per-outcome.
- **`MitigationModule`** — applica formula PoE per armor e mitigazione lineare per resistance.
- **`MathEngine`** — moltiplica `damage * avgMult` e poi `* expectedHits`, applica `MitigationModule`, sottrae `regen`.
- **`CombatMetrics`** — usa `baseHit = 0.9`, `armor/(armor+50)`, `ward` flat, `lifesteal` come sustain sul danno in uscita.
- **`CombatPredictor`** — usa `baseHit` da `BALANCING_CONFIG` (50), ignora `failChance`/`failMult`, crit approssimato, `lifesteal` su danno in arrivo.
- **`solver.ts`** — combina `CriticalModule` + `MitigationModule.calculateAverageEffectiveDamage` (per-outcome) e calcola `attacksPerKo` in modo proprio.

`[DA DECIDERE]` Scegliere un unico motore canonico e far convergere tutti gli altri, oppure definire quale motore serve a quale scopo (es. UI approssimativa vs simulazione rigorosa) e documentare le approssimazioni.

`[BUG POTENZIALE]` In `MathEngine` l’aspettazione del danno è calcolata come `E[damage] = damage * E[mult] * E[hit]`. Questo non è uguale a `E[damage] = damage * Σ_outcome p(outcome) * mult(outcome) * hitChance(outcome)` perché i crit hanno probabilità di hit diversa e quindi sono sovrappresentati tra i colpi andati a segno.

---

## 11 — Curve

`[DESIGN INTENT]` Le curve globali devono essere configurabili nel Balancer. Non devono essere hard-coded nei creator.

| Curva | Stato attuale | Note |
|-------|---------------|------|
| **Asymptotic caps** (`asymptoticCaps.ts`) | `IMPLEMENTAZIONE ATTUALE` | cap × (1 − exp(−value/scale)), hard stop a cap×3. Serve decidere quali stats sono sottoposte e con quali parametri. |
| **AoE efficiency** | `INCONSISTENTE` / `DA DECIDERE` | Hard-coded in `SpellCostModule` con step fissi. Utente vuole curva globale configurabile. |
| **DoT realized value** | `INCONSISTENTE` / `DA DECIDERE` | `DotModule` calcola valore totale grezzo; servirebbe curva che tenga conto di durata, tempo di realizzo, overheal, interruzione. |
| **Healing efficiency** | `DA DECIDERE` | Direct healing trattata linearmente; servirebbe parametro globale di efficienza rispetto al danno. |
| **CC valuation** | `DA DECIDERE` | Attualmente `SpellCostModule` dà `damage weight × 3.0`; va formalizzato. |
| **Mana model** | `TEST SPERIMENTALE` | `baseDamagePerMana = 2.0`, type efficiency table, cooldown factor, cast time penalty, target ratio 2.0. Tutto candidato a diventare parametro globale. |

---

## 12 — Synergy

`[CANONICA]`

- Il Balancer misura **valore isolato** di una stat/incantesimo/modifica.
- Non deve pretendere che ogni combinazione abbia esattamente lo stesso valore.
- **Synergy(A,B) = Value(A+B) − Value(A) − Value(B)** è uno strumento concettuale di analisi, non un obbligo di codificare ogni coppia.
- Esempi di interazioni significative da preservare: hit × damage, crit × damage, DoT × duration, DoT × slow/control, healing × max HP, armor × mitigation-sensitive damage profiles.
- Il sistema deve permettere l’emergere di archetipi; la meta-differenziazione è desiderabile.

---

## 13 — Scenari

`[DESIGN INTENT]` Gli scenari non riscrivono le formule. Modificano i parametri del contesto (numero di nemici, HP medi, durata attesa, multiplier su specifiche stats, ecc.).

`[IMPLEMENTAZIONE ATTUALE]` `DEFAULT_CONFIG.targetTurns` e `scenarioBudget` esistono:

| Scenario | `targetTurns` | `hpEq` / `damageEq` |
|----------|---------------|---------------------|
| 1v1 | 8 | 150 / 35.7 |
| boss | 11 | 220 / 45.0 |
| group | 9 | 180 / 40.0 |
| swarm | 7 | 120 / 30.0 |

`[INCONSISTENTE]` Lo scenario runner al momento usa `expectedTurns` come turn limit ma **non costruisce veri incontri multi-nemico** da `enemyCount` e `enemyAvgHP`.

`[DA DEFINIRE DAL DIRECTOR — NON INVENTARE]`

- **A/E**
- **Post**
- **Big Post**
- Altri encounter particolari

Per ciascuno bisognerà definire: purpose, quali parametri cambia, cosa NON cambia.

---

## 14 — Spell Creator

`[DESIGN INTENT]`

- Lo Spell Creator **non deve diventare un secondo Balancer**.
- Consuma dal Balancer: valore base del danno, valore HP, valore hit chance, pesi relativi, curve globali, efficacia delle categorie.
- Costruisce spell usando il modello matematico del Balancer.

`[IMPLEMENTAZIONE ATTUALE]`

- `src/balancing/spellTypes.ts` + `spellStatDefinitions.ts` — modello spell con `effect`, `eco`, `dangerous`, `scale`, `precision`, `aoe`, `cooldown`, `range`, `priority`, `manaCost`.
- `src/spells/config/types.ts` — modello D&D-style alternativo (`school`, `level`, `components`, `duration`, `baseDamage`, `scaling`, `areaOfEffect`, `saveDC`).
- `SpellBuilder.ts` — validazione e generazione procedurale.
- `SpellCostModule` — calcolo potere/mana/livello/tier.

`[INCONSISTENTE]` Duplicazione tra i due modelli di spell. `SpellBuilder.validateTemplate` e `createEmptySpell` hanno default in conflitto (`effect` 0 vs min 10, `aoe` 0 vs min 1, `range` 0 vs min 1, `eco` 0 vs min 1). `SpellCostModule` calcola potere usando `NORMALIZED_WEIGHTS.damage` (5.0) mentre `getStatWeight()` restituisce 1.0.

---

## 15 — Spell Budget

`[CANONICA]`

- Il termine corretto è **budget**, non “spell budget”, “danger budget”, “power cost”, “rarity”.
- `budget = 0` = costruzione standard / riferimento medio.
- Budget positivo = costruzione sopra il riferimento.
- Budget negativo = costruzione sotto il riferimento.
- Misura la **deviazione da una costruzione standard**, non il livello del personaggio o la rarità.

`[INCONSISTENTE]` Oggi esistono almeno due meccanismi:

1. `SpellCostModule.calculateSpellPower` / `calculateManaCost` — calcolano potere e costo mana.
2. Stile `calculateBalance() = calculateCost() - targetBudget` presente in alcune UI (`SpellBuilder`, `SpellCreatorNew`).

`[DA DECIDERE]` Separare o unificare i concetti di: **budget**, **power**, **mana**, **tier**, **quality**. Devono avere nomi e semantica chiari.

---

## 16 — DoT / Healing / AoE / CC

`[DESIGN INTENT]`

- **DoT:** il valore deve riflettere il *valore realizzato* in combattimento, non solo il totale teorico. Durata corta (3-5 turni) è sottovalutata se non completata; durata media (8-12) più rappresentativa; durata molto lunga (20+) può essere sovravalutata.
- **Healing:** non è equivalente 1:1 al danno. Fattori: max HP, danno in ingresso, overheal, timing, durata, cooldown, target count, interruzione, opportunity cost.
- **AoE:** curva globale di efficienza configurabile (non fissa).
- **CC:** va formalizzato con parametro globale, non hard-coded ×3.

`[IMPLEMENTAZIONE ATTUALE]`

- `DotModule.calculateTotalValue`: `abs(amountPerTurn) * duration * stacks`.
- `SpellCostModule.calculateAoeMultiplier`: step hard-coded.
- `SpellCostModule` per CC: `(effect/100) * damageWeight * 3.0`.
- `SpellCostModule` per healing: linearo su `hpWeight`; nessuna efficienza globale rispetto al danno.

`[DA DECIDERE]` Definire le curve globali per queste categorie.

---

## 17 — Equipment Creator

`[DESIGN INTENT]`

- Deve **nascere dai valori ereditati dal Balancer**: baseline, pesi, curve, formule, stats e range.
- Non deve re-introdurre tabelle di peso o formule parallele.
- È la priorità attuale per direttiva Director (2026-09-04), ma deve rimanere allineato al modello canonico del Balancer.

`[IMPLEMENTAZIONE ATTUALE]` Cartella `src/balancing/equipment/` esiste e contiene: `equipmentTypes.ts`, `equipmentBalancingConfig.ts`, `equipmentTemplates.ts`, `EquipmentCostModule.ts`, `equipmentBalancing.ts`, `equipmentStorage.ts`, `*.unit.test.ts`.

`[INCONSISTENTE]`

- I pesi derivano da `getStatWeight(stat)`, che a sua volta è in conflitto con `CORE_STAT_WEIGHTS`/`NORMALIZED_WEIGHTS`.
- `EquipmentType`, `EquipmentRarity`, `EquipmentItem` sono definiti sia in `equipmentTypes.ts` (Zod) sia in `equipmentTemplates.ts` (interface).
- `EquipmentCostModule` calcola `power` e `cost` con la stessa identica formula (somma `(value - baseline) × weight`), rendendoli ridondanti.
- La `baseline` usata nel costo è letta da `getEquipmentTypeConfig(...).baseline` (vuota `{}` in `equipmentBalancingConfig.ts`), mentre i `baseStats` dei template (`equipmentTemplates.ts`) non vengono usati come baseline.
- `equipmentBalancing.ts` (`EQUIPMENT_BASE_BUDGET = 10`, `EQUIPMENT_POWER_TO_POINT_RATIO = 0.2`) è stale: `EquipmentCostModule` usa `getEquipmentBaseBudget()` (10) e i pesi della config.
- `EQUIPMENT_RARITY_EXTRA_POINTS` in `equipmentTemplates.ts` duplica la tabella `rarities` di `equipmentBalancingConfig.ts`.
- `EQUIPMENT_RARITIES` in `equipmentTemplates.ts` (5 voci) differisce da `EquipmentRaritySchema` in `equipmentTypes.ts` (7 voci: include `poor` e `masterpiece`).

---

## 18 — Test ed esperimenti

`[TEST SPERIMENTALE — NON CANONICO]`

Tutti i seguenti valori sono stati usati in discussioni o test e **non devono** diventare regole solo perché sono apparsi:

- HP 100 / Damage 25 / 4 hits
- 75% hit chance (armed baseline proposto)
- 50% hit chance (unarmed baseline proposto)
- +5 Damage ≈ +20 HP (semplice equivalenza a 4 colpi)
- Curve AoE di esempio (1.00, 0.60, 0.45, ecc.)
- Step di budget +1/-1
- Category multipliers di esempio
- Stat equivalences non validate dal modello canonico attuale

`[TEST SPERIMENTALE VALIDATO]`

- `baseline.ts` — 10.000 simulazioni Monte Carlo su 100 HP / 25 damage / 4 HTK / 75% hit / failChance 5 / critChance 5 / critMult 2 → win-rate 50.05% / 49.95%, ~4.47 turni medi.

---

## 19 — Decisioni confermate

`[CANONICA]`

1. Il Balancer è la **source of truth** per baseline, pesi e formule.
2. Le formule devono essere **stabili**; il tuning avviene sui **parametri**.
3. Spell Creator ed Equipment Creator **consumano** il Balancer, non re-creano un sistema parallelo.
4. I personaggi partono **neutri**; identità e potere emergono da skill, equip, passivi e sinergie.
5. **Non** tutte le build devono essere uguali; la sinergia e la meta-differenziazione sono desiderabili.
6. Gli scenari modificano **parametri/contesto**, non riscrivono le formule.
7. La terminologia corretta è **“budget”** (non “spell budget”).
8. I valori illustrativi/esperimenti non sono canonici finché non promossi esplicitamente.

---

## 20 — Decisioni ancora aperte

`[DA DECIDERE]`

1. Quale baseline è canonica (100/25/4 validato o 150/35.7/4.2 UI)?
2. Quale tabella di pesi è canonica (`CORE_STAT_WEIGHTS` empirici o `NORMALIZED_WEIGHTS` gameplay target)?
3. Quale motore di combat math diventa il canonical engine?
4. Come trattare `ward`? Scudo flat separato oppure parte di `MitigationModule`?
5. Come combinare correttamente crit, fail e hit chance? (prodotto di medie vs aspettazione per-outcome)
6. Curve globali per AoE, DoT, healing, CC.
7. Semantica di `dangerous` nelle spell.
8. Separazione tra budget, power, mana, tier, quality per le spell.
9. Definizioni precise degli scenari (A/E, Post, Big Post, ecc.).
10. Quale EDPT/TTK mostrare in UI vs quale usare per simulazioni rigorose?

---

## 21 — Incoerenze del codice

`[INCONSISTENTE]` (estratto anche da `balance_model_v1.md`)

- Tre baseline incompatibili.
- `attacksPerKo` definito in 4 modi diversi.
- `effectiveDamage` definito in modi diversi tra UI, `registry.ts`, `CombatMetrics`, `MitigationModule`.
- `ward` usato in UI/`CombatMetrics`, ignorato dal vero engine.
- Pesi discordanti tra `CORE_STAT_WEIGHTS`, `NORMALIZED_WEIGHTS`, `DEFAULT_CONFIG`.
- `getStatWeight()` preferisce `CORE_STAT_WEIGHTS`, causando mismatch con `DEFAULT_CONFIG`.
- `CombatMetrics`, `MathEngine`, `CombatPredictor`, `solver.ts` calcolano EDPT/TTK in modo diverso.
- `MathEngine` moltiplica aspettazione del moltiplicatore per aspettazione della hit chance (non rigoroso per-outcome).
- `SpellCostModule` AoE hard-coded.
- `dangerous` usato come reliability multiplier invece che come rischio/precisione.
- Due modelli di spell (`spellTypes.ts` vs `spells/config/types.ts`).
- `SpellBuilder` valida range incompatibili con `createEmptySpell`.
- Gli scenari sono moltiplicatori contestuali, non veri encounter.

---

## 22 — Cose che NON devono essere cambiate

`[CANONICA]`

- L’**architettura config-first** e il principio di non hardcodare valori di gameplay.
- Il sistema a **grafi di dipendenza** (`ConfigSolver`) e il ricalcolo topologico dei derivati.
- La capacità di **lock** e **reverse-solve** (bloccare un derivato e far risolvere il sistema all’indietro).
- Il concetto di **preset** come set di pesi/tuning esplorabili.
- La **separazione** tra Balancer (modello) e Creator (consumatori).
- Il principio che **synergy e meta-differenziazione** devono sopravvivere, non essere appiattite.
- Il principio che gli **scenari modificano parametri, non formule**.
- Il termine **“budget”** per le spell.

---

## 23 — Roadmap

`[CANONICA]`

1. **Chiudere l’audit** (questo documento + `balance_model_v1.md`) identificando il modello matematico canonico.
2. **Scegliere baseline canonica**, tabella pesi canonica e canonical engine.
3. **Allineare** `defaultConfig.ts`, `MathEngine`/`CombatPredictor`/`CombatMetrics`/`solver.ts` sulle stesse formule.
4. **Decidere** `ward`, curva AoE, DoT, healing, CC, semantica `dangerous`.
5. **Stabilire** come Spell Creator consuma il Balancer (un solo modello di spell).
6. **Definire** gli scenari (A/E, Post, Big Post, ecc.) come configurazioni di parametri.
7. **Ricalibrare** Equipment Creator affinché erediti i valori finali del Balancer (priorità attuale per direttiva Director 2026-09-04).
8. **Validare** con simulazioni Monte Carlo e test config-driven a ogni passo.

---

## Appendice — Documenti collegati

- `src/docs/docs/balancer/balance_model_v1.md` — audit tecnico dettagliato (formule, file, status stat-per-stat).
- `src/balancing/baseline.ts` — baseline validata.
- `src/balancing/config/defaultConfig.ts` — UI/shipping defaults.
- `src/balancing/types.ts` — `StatBlock` / `DEFAULT_STATS`.
- `src/balancing/balancingConfig.ts` — legacy constants.
- `src/balancing/registry.ts` — parameter registry.
- `src/balancing/statWeights.ts` — pesi in conflitto.
- `src/balancing/modules/critical.ts`, `mitigation.ts`, `hitchance.ts`, `dot.ts`, `buffs.ts`, `spellcost.ts` — motori.
- `src/balancing/1v1/mathEngine.ts`, `modules/combatPredictor.ts`, `metrics/CombatMetrics.ts`, `solver.ts` — altri motori.
- `src/balancing/spellTypes.ts`, `spellStatDefinitions.ts`, `spell/SpellBuilder.ts` — modello spell attuale.
- `src/spells/config/types.ts`, `defaultSpellConfig.ts` — modello spell D&D-style.

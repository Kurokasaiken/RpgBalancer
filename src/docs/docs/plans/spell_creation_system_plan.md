# Spell Creation System – Implementation Plan

## 1. Scopo e principi
- **Obiettivo**: completare l'integrazione delle feature mancanti del sistema di Spell Creation (Special, Modality, DualEffect, Conditional, Trigger, Summon) mantenendo il modello deterministico basato su TTK/TTD.
- **Vincoli**:
  - Tutti i parametri devono provenire da config JSON/sorgenti condivise (no hardcode in UI o logica).
  - Ogni modifica deve riflettere variazioni rispetto al baseline “Attacco Base” (costo 0).
  - Output richiesto: SpellPower → EffectiveDPS/HPS → TTK/TTD → AverageCombatTurns.
  - Persistenza tramite `SpellConfigStore`/`useSpellConfig` e `PersistenceService`.

## 2. Stato attuale (doc @src/docs/docs/SPELL_CREATION_SPEC.md, test @src/balancing/__tests__/SpellCreationTests.test.ts)
| Feature               | Stato | Note |
|-----------------------|-------|------|
| Effect numerici (Damage/Heal, DoT/HoT) | ✅ | Slider/tick con pesi da `spellBalancingConfig`.
| Targeting (AoE)       | ✅ | `aoe` → fattore lineare, no curve custom.
| Precision/Dangerous   | ✅ | HitChance media, `dangerous` per on-miss.
| Cooldown / Mana / Priority | ✅ | Fattori di penalità base.
| Status (Stun)         | ✅ | Singolo esempio.
| Special: Modality, DualEffect, Trigger, Conditional | ❌ | Solo documentati.
| Summon, Reflect esteso, Buff/Debuff avanzati        | ⚠️ | Parziali / non standardizzati.
| Meta metriche (Early Impact, SpellPower esteso)     | ⚠️ | Calcolo base disponibile, manca integrazione con special.

## 3. Deliverable principali
1. **Config esteso** per effect types, special mechanics, status, summon.
2. **Motore di calcolo** aggiornato (SpellCostModule/preview) per nuove formule.
3. **UI/UX**: editor Special + timeline dual/modal + config targeting avanzato (inclusi placeholder disabilitati per range/spazio/summon).
4. **Persistenza & migrazione**: schema Zod + upgrade automatico config legacy.
5. **Testing & docs**: suite unit/RL + aggiornamento doc tecnica/balancer.

## 4. Workstreams
### 4.1 Config & Tipi
- Aggiornare `src/spells/config/types.ts` e `schemas.ts`:
  - `effectTypes: EffectTypeId[]` (min 1) – elencate in JSON.
  - `special: SpecialDefinition | null` con union (`modality`, `dual`, `conditional`, `trigger`, `passive`).
  - `statusEffects: StatusEffectId[]` + parametri (durata, intensità).
  - `summonProfile?: SummonDefinition` (statistiche minion, durata, costo manutenzione).
  - `turnImpact?: TurnImpactOverrides` (early impact, priority custom).
- Nuove sezioni in `defaultSpellConfig` e `spellBalancingConfig.json`:
  - `effectTypeWeights`, `specialWeights`, `statusWeights`, `summonWeights` con `weight`, `ttkImpact`, `ttdImpact`.
- Helper in `spellBalancingConfig.ts`: `getEffectTypeWeight`, `getSpecialFactor`, `getStatusImpact`.

### 4.2 Motore matematico (SpellCost & Preview)
- In `SpellCostModule`:
  1. Calcolare `baseEffect` usando formula doc (§4.2), includendo `dangerous` e `eco`.
  2. Applicare `aoeMultiplier` configurabile (lineare, decrescente) leggendo curva da config plugin.
  3. Applicare fattori `cooldownFactor`, `manaFactor`, `priorityFactor` come da §7-9 (rendere i parametri configurabili via JSON per tuning futuro).
  4. Special:
     - **Modality**: valutare A/B o A+B con `modalSplitFactor`/`dualSplitFactor` dal config, generare due profili e combinarli.
     - **DualEffect**: duplicare la spell in timeline (Step1, Step2) con offset turni, sommare pesi e aggiornare preview.
     - **Conditional**: moltiplicare per `probability(conditionId)` da config (nessun RNG runtime).
     - **Trigger**: usare `expectedTriggersPerFight` (config) per scalare l’effetto.
     - **Trigger On-Miss**: sfruttare `dangerous` già previsto.
  5. Summon: convertire stats minion in equivalente HP/DPS (usare helper `SummonCalculator` con parametri turn-based).
  6. Aggregare meta metriche: SpellPower, EarlyImpact (media primi 3 turni), TTK/TTD contributions.
- Aggiornare `getSpellPreview` per mostrare timeline (Dual/Modality) e breakdown TTK/TTD.

### 4.3 UI/UX (SpellCreatorNew e componenti modulari)
- Nuovo pannello **Effect Types** (multi-select con tooltip) alimentato da config.
- **Special Designer**:
  - Modality editor (tab A/B, slider split).
  - DualEffect configuratore (link a “sub spell” clonata + override parametri).
  - Conditional builder (dropdown condizioni, probabilità mostra valori da config).
  - Trigger config (evento, expectedTrigger, cooldown interno).
  - Passive toggle (es. Lifesteal flat) e stacking parameters.
- **Status Drawer**: pill + campi numerici (durata, intensità) per stun/silence/root ecc.
- **Summon Editor**: placeholder disabilitato (grigiato) finché la feature non viene implementata; mostra tooltips che spiegano le future configurazioni (HP, DPS, durata). 
- **Range / Movement**: slider/griglia mostrati in UI ma disabilitati (grigiati) finché i moduli “spazio” non saranno attivi; leggono comunque config per mantenere consistenza visiva.
- UI Timeline: rappresentare Steps (A/B, Dual) con progress bars e highlight EarlyImpact.
- Garantire moduli riutilizzabili, componenti <200-250 righe come da preferenze.

### 4.4 Persistenza & migrazione
- Aggiornare `SpellConfigStore` per includere i nuovi campi nello snapshot e nell’history (checksum invariato).
- Migrazione: caricando config legacy → `effectTypes = [type]`, `special = null`, `statusEffects = []`.
- `useSpellConfig` deve esporre API per modificare special/summon.
- Import/export JSON aggiornati per salvare i nuovi blocchi (verificare StorageTestFramework se serve scenario dedicato).

### 4.5 Testing & QA
- **Unit**:
  - `SpellCostModule` per ogni special (modality, dual, conditional, trigger, passive, summon).
  - `SummonCalculator` equivalenze TTK/TTD.
  - Schema Zod (effectTypes min 1, param obbligatori per special).
- **RTL**: multi-select effect types, special designer interactions, timeline preview.
- **Golden Master**: set di spell comparativi (blend tra features vecchie e nuove) con snapshot TTK/TTD.
- Safeguard obbligatori: `npm run lint`, `npm run build:check`, `npm run test -- spell-creator`, `npm run kanban:lint` + evidence log.

## 5. Timeline proposta
| Fase | Contenuto | ETA |
|------|-----------|-----|
| 1 | Estensione tipi + schema + migrazione base | 1.5 gg |
| 2 | Config pesi + SpellCostModule aggiornato | 2 gg |
| 3 | UI Effect Types & Special designer (senza Summon) | 2 gg |
| 4 | Summon editor + timeline preview | 1.5 gg |
| 5 | Testing (unit/RTL), documentazione, evidence | 1 gg |

## 6. Documentazione da aggiornare
- `docs/docs/SPELL_CREATION_SPEC.md`: sezione Effect/Special aggiornata, aggiungere esempi.
- `docs/BALANCING_SYSTEM.md`: formule TTK/TTD con special (modalità, conditional, trigger, summon).
- Nuovo file "spell_creation_system_plan.md" (questo documento) + link in `docs/docs/IMPLEMENTATION_PLANS_INDEX.md`.
- Appendice per conversione Summon in HP_eq.

## 7. Domande aperte / Clarificazioni richieste
1. **Curve AoE**: preferenza per modello (lineare vs custom) e dove vive la tabella? (Proposta: config JSON `aoeProfiles`).
2. **Summon stacking**: limite simultaneo? È parte dei pesi o gestito come status (es. buff)?
3. **Trigger catalogo eventi**: elenco definitivo (on hit, on crit, low HP, ally death, ecc.)? Necessario file config dedicato.
4. **Probability dataset** per conditional: derivi da plan/analytics o definito manualmente su config? Serve guida.
5. **Status già implementati** oltre Stun? (silence/root ecc.) – definire mapping numerico → TTK/TTD.

## 8. Metriche di accettazione
- Spell con special (Modality, Dual, Trigger) produce SpellPower coerente (±1%) rispetto a calcoli di riferimento.
- UI consente di salvare/richiamare config con special/summon senza corruzioni.
- Golden master: TTK/TTD per set baseline invariato rispetto ai valori di doc.
- Documentazione aggiornata con esempi e formule.

---
**Owner proposto**: Cascade-Spell (da assegnare su Kanban con prompt dedicato).

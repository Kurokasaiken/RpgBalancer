# Idle Village — Hero Sheet: statistiche dinamiche dal Balancer (Sub-Plan A2)

**Status:** Draft (in attesa di battesimo del Director)
**Scope:** far sì che la scheda dettaglio del PG mostri dinamicamente tutte le stat reali che arrivano dal Balancer + identità/progressione/skill, invece del dump flat attuale.
**Umbrella plan:** `idle_village_hero_components_placeholder_plan.md` — questo documento è **Sub-Plan A2** (il piano ombrello rimandava a A2: *"livello/XP/skill equip … saranno gestiti in Sub-Plan A2 o fase di integrazione"*).
**Richiesta:** `RICHIESTE.md` R-073.
**Desiderata FROZEN:** `.mw/desiderata.md` v10 (placeholder funzionali e skin-wired). Il lavoro resta placeholder: contratto dati corretto, estetica demandata a Golden UI (v8).
**Created:** 2026-09-16

---

## 1. Goal

`PgDetailCard` (componente canonico scelto dal Director — direzione A) deve renderizzare le statistiche del PG **guidate dai dati e dalla config del Balancer**, non da chiavi hardcoded: se domani il Balancer aggiunge o rinomina una stat, la card la mostra con label, formato e gruppo corretti senza toccare il componente.

## 2. Decisioni del Director (sessione 2026-09-16)

| # | Decisione |
|---|-----------|
| D1 | Direzione **A**: evolvere `PgDetailCard`. `SchedaPergamena` non è il componente canonico. |
| D2 | Stat marcate `isHidden`/`isDerived` nel BalancerConfig → **omettere del tutto**. |
| D3 | `magic` non esiste come stat: è dominio delle skill → la card mostra le **skill equipaggiate** e, siccome gli equip sono mostrati, anche le **skill concesse dall'equip** (`grantedSkills`). |
| D4 | `level`/`XP` → **mock via config** finché non esiste progressione reale. |

## 3. Fonti dati (FACT)

- `ResidentState.statSnapshot: Partial<StatBlock>` — popolato da `savedCharacterToResident` con lo `statBlock` completo (`characterImport.ts:119-122`), arricchito da `useResidentHeroState` con `equipment`, `inventory`, `skills` (`useResidentHeroState.ts:208-220`).
- Registry di display canonico: `BalancerConfig.stats` (`StatDefinition`: label, description, `type: 'number'|'percentage'`, `min`/`max`, `isCore`, `isDerived`, `isHidden`, `isPenalty`, `formula`) e `BalancerConfig.cards` (6 gruppi ordinati con `statIds`). Caricamento: `BalancerConfigStore.load()` (async, cached) con fallback `balancer-default-config.json`.
- Glifi: `statGlyphMap` in `src/ui/shared/statIconUtils.ts` (copre 21 statId; mancano agility/block/energyShield/thorns/timing — fallback `◆` già previsto).
- Skill metadata: `skills` da `src/balancing/config/idleVillage/heroItems.ts` (`id`, `name`, `initial`, `effect`).
- Chiavi `StatBlock` non presenti nel registry (`agility`, `block`, `energyShield`, `thorns`, `cooldownReduction`, `castSpeed`, `movementSpeed`): gestite dalla policy `showUnregisteredStats` (vedi §5, open decision OD-1).

## 4. Bug esistenti che questo piano risolve

- `SchedaPergamena` legge `snapshot.attack`/`snapshot.defense`/`resident.level` — chiavi inesistenti → sempre 0 (`SchedaPergamena.tsx:56-64,272`). Risolto in T-06 riusando il view-model.
- `PgDetailCard` mostra il dump flat `key → toFixed(2)` senza label/gruppi (`PgDetailCard.tsx:242-253`).

## 5. Design

### 5.1 Config di display — `src/balancing/config/idleVillage/heroSheetConfig.ts` (Zod)

```ts
heroSheetConfig = {
  mockProgression: { enabled: true, level: 1, xp: 0, xpSegments: 3 }, // D4 — placeholder fino a progressione reale
  showHiddenStats: false,        // D2
  showUnregisteredStats: true,   // OD-1: chiavi numeriche non nel registry → sezione fallback
  unregisteredSectionId: 'other',
  valueMaxFractionDigits: 1,
}
```

### 5.2 View-model builder — `src/ui/idleVillage/heroSheet/heroSheetModel.ts` (puro)

```ts
buildHeroSheetModel(resident, balancerConfig, displayConfig, t): HeroSheetModel
```

Output:

```ts
interface HeroSheetStatRow { statId: string; label: string; value: number; formatted: string; normalizedPct: number | null; description?: string; icon: string; }
interface HeroSheetSection { id: string; title: string; icon?: string; rows: HeroSheetStatRow[]; }
interface HeroSheetModel {
  progression: { level: number; xp: number; xpSegments: number } | null;
  vitals: { hp: { current: number; max: number }; stamina: { current: number; max: number } };
  sections: HeroSheetSection[];              // ordine = cards order; stat order = card.statIds
  equippedSkills: { id: string; name: string; initial: string; effect: string; source: 'loadout' | 'granted' }[];
}
```

Regole del builder:

1. Sezioni = `balancerConfig.cards` ordinate per `order`; per ogni `statId` in `card.statIds`: salta se `stats[statId].isHidden === true` (D2) o `showHiddenStats === false`; salta se il valore non è numerico finito nello snapshot.
2. Chiavi numeriche dello snapshot non coperte da nessuna card e non nel registry → sezione fallback `other` se `showUnregisteredStats`, altrimenti omesse.
3. Escluse sempre le chiavi payload non-stat: `equipment`, `inventory`, `skills`, `portraitUrl`, `fullFigureUrl` (+ qualsiasi valore non numerico, che copre i flag booleani).
4. Formato: `type === 'percentage'` → `"{v}%"`; `number` → max `valueMaxFractionDigits` decimali; `normalizedPct` = `(v - min) / (max - min)` quando `min`/`max` esistono (alimenta eventuali mini-barre).
5. Label: `t('pgDetailCard.stats.<statId>', { defaultValue: stats[statId].label })` → i18n first, registry EN come fallback.
6. `equippedSkills`: `statSnapshot.skills` (loadout iniettato da `useResidentHeroState`) **+ `statSnapshot.grantedSkills`** (skill concesse dagli item equipaggiati — D3 emendata) risolti via `skills` di `heroItems.ts` e via `equipment` items (`grantedSkillIds`); `source` distingue loadout vs granted; id sconosciuti → badge con l'id (graceful).

### 5.3 Hook — `src/ui/idleVillage/heroSheet/useHeroSheetModel.ts`

`useHeroSheetModel(resident): { model: HeroSheetModel | null }` — carica `BalancerConfigStore.load()` una volta (store già cached), costruisce il modello memoizzato su `[resident, config]`.

### 5.4 `PgDetailCard` — modifiche

- Sostituisce il blocco "Statistics" (dump flat) con una `MatericFrame` per sezione del modello: titolo sezione (`MatericPlaque`), righe `MatericRecordList` a 3 colonne [icona+label | value | mini-bar opzionale].
- Header: accanto al nome, "Lv {level}" + pips XP da `progression` (D4, mock config).
- Nuova sezione "Skills" (`MatericFrame`): badge delle skill equipaggiate dal modello (D3). Vuota → chiave `skills.empty`.
- Vitals, Equipment, Inventory invariati.

## 6. Task list

| Task | Contenuto | Dipende da |
|------|-----------|------------|
| T-01 | `heroSheetConfig.ts` + schema Zod + export | — |
| T-02 | `heroSheetModel.ts` builder puro + test unitari dedicati | T-01 |
| T-03 | `useHeroSheetModel` hook | T-02 |
| T-03b | `useResidentHeroState`: iniettare `grantedSkills` nello snapshot sintetico accanto a `skills` (una riga — il valore è già calcolato, `useResidentHeroState.ts:194-206`) | — |
| T-04 | `PgDetailCard`: sezioni dinamiche, Lv/XP mock, skills (loadout + granted, badge distinti per `source`), equip già presente | T-03, T-03b |
| T-05 | i18n: chiavi `pgDetailCard.sections.*`, `pgDetailCard.stats.*`, `pgDetailCard.skills.*`, `pgDetailCard.level`/`xp` in `en` + `it-IT` (`fallbackLng: 'en'` copre ar/de/pseudo); aggiornare `i18n.types.ts` | T-04 |
| T-06 | `SchedaPergamena`: **sospeso** — vedi §7 OD-3: la pagina che la ospita non è routed; il fix è condizionato alla decisione sul suo destino | T-02 |
| T-07 | Trailer scena 3 (`TrailerPreparation`): `trailerConfig.preparation.hero` ottiene `statSnapshot` con chiavi reali; le 3 barre diventano `damage`/`armor` + riga skill badge al posto di `magic`; Lv/XP da config trailer. `@trailer-only`, nessuna pretesa i18n | T-02 |
| T-08 | Estendere `PgDetailCard.test.tsx` (sezioni renderizzate, hidden omesse, label/formattazione, skills, Lv/XP) + test `heroSheetModel` (ordine, hidden, orfani, formato, payload non-stat esclusi) | T-04 |
| T-09 | Safeguards + smoke `/hero-components-lab` + evidence log `test-results/hero-sheet-dynamic-stats-2026-09-16.md`; aggiornare umbrella plan §5.1 e `context/INDEX.md` | tutti |

## 7. Open decisions

- **OD-1 — `showUnregisteredStats` default `true`** (sezione fallback "Other"): così stat reali dello `StatBlock` assenti dal registry (agility, thorns, timing…) non spariscono in silenzio. Alternativa: `false` = mostro solo ciò che il registry conosce.
- **OD-2 — RISOLTA dal Director (2026-09-16):** equip e granted skills vanno mostrati → `useResidentHeroState` inietta `grantedSkills` nello snapshot (T-03b), il model le marca `source: 'granted'`.
- **OD-3** — `SchedaPergamena` è **dormant**: vive in `MapPage` (hover sul PgCard del roster, `MapPage.tsx:808-817,1079-1089`) e in `StyleLabMapPage` (legacy), ma **nessuna delle due pagine è routed in `App.tsx`**. Opzioni: (a) fix minimo via view-model (toglie gli zeri), (b) lasciarla com'è finché la pagina resta morta, (c) deprecarla e ricablare l'hover del roster su `PgDetailCard` quando la superficie tornerà viva.
  - **Update 2026-09-16:** il Director l'ha voluta visibile in `/primitives` (tab "PG Cards", `PgCardsTab` in `src/pages/primitives.tsx`) insieme a `SlottedMedal`, `PgCard`, `WorkerCard`, `WanderlustRosterCard`, `PgDetailCard`. Fix minimo applicato per renderla: `playSound` → `playCue` (API stale, crashava all'apertura). I bug dati (attack/defense/level) restano — sono l'oggetto di questa OD.
  - **Scoperta correlata:** `PgCardTS002.tsx` è **sintatticamente rotto** (`memo<Props>({...}) =>` a riga 93 — parse error babel, mai compilato) e chiama API stale (`playSound`, `setDraggedItem` assente da `DragContextState`). Escluso dalla gallery; va deprecato o riparato con decisione a parte.

## 8. Success criteria

1. `PgDetailCard` rendera tutte le stat non-hidden dello snapshot, raggruppate per card del Balancer, con label i18n e formato corretto.
2. Una stat aggiunta al `BalancerConfig` compare nella card senza modifiche al componente.
3. `npm run lint -- <scope>`, `npm run test -- <scope>`, `npm run build:check`, `npm run kanban:lint` verdi.
4. Smoke test runtime su `/hero-components-lab` senza errori console.
5. Evidence log in `test-results/`.

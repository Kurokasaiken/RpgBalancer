---
title: 'PLAN-028 — Gimmick Channels v0: prototipo canali alternativi sulla quest goblin'
status: draft
created: 2026-10-11
request: Director delega 2026-10-11 («fai cm reputi meglio», R-134) a valle della ricerca R-128
parent: PLAN-019 (quest macro plan); related: PLAN-026 (generation, contratti), PLAN-022 (goblin quest)
research: context/QUEST_GIMMICK_CHANNELS_RESEARCH.md
rule: QUEST_RULES.md §7 (vigente, reversibile al playtest)
---

# PLAN-028 — Gimmick Channels v0

## 0. Scopo e decisione di fondo

Validare sul campo il **modello di binding adottato** per i canali
alternativi alla core gimmick (OPEN-017 risolta, R-134):

- **Lock di approccio a run-level**, capability-gated dal party;
- **eccezioni a consumo** (~1/run, exception budget stretto);
- roll per **membro nominato** (mai best-of-party);
- canali come **varianti sullo stesso nodo check** (nessuno split del
  grafo), solo sui check che scrivono la var core;
- **profili di fallimento divergenti** per canale (obbligatorio);
- preview con risk tag + canali bloccati greyed «Requires: …».

Il prototipo risponde a una sola domanda: **il lock produce ownership o
regret?** (metrica playtest definita dalla ricerca T2/T5.)

## 1. Testbed

Quest «Sterminio dei goblin» (PLAN-022): infiltrazione con allarme reale
(`campoAllertato`/`campoSveglio`, `alarm` bool) e scelta di approccio
già esistente in F3 — il punto d'innesto naturale. Il grafo esistente
NON viene ristrutturato: i canali vivono come varianti sui nodi check che
scrivono l'allarme.

## 2. Scope v0 (contenuto)

| Elemento | v0 | Note |
|---|---|---|
| Approcci | 3: Furtivo (AGI) / Arcano (INT, gated) / Sociale (CHA, gated) | presentati come fiction, non stat |
| Check core | i nodi F3→F5 che muovono `alarm` | marcati `coreCheck` nel config |
| Pivot vs routine | menu multi-canale solo dove il party ha ≥2 canali eleggibili E il check è pivot | altrimenti canale del lock |
| Gate | Arcano: skill/membri con capacità arcanica o item scroll; Sociale: membro con CHA ≥ soglia config | mappatura esatta su skill v12 da decidere in T-002 |
| Fallimento per canale | Furtivo: alarm+1 · Arcano: alarm+1 + caster rivelato (esposizione wound) · Sociale: alarm+1 + lockout sociale sul checkpoint | transition table per canale |
| Eccezione | 1 item a consumo che sblocca un singolo check fuori-lock | scroll di invisibilità authored |
| Preview | odds esatte (frozen R-108) + risk tag semantico + costo; locked greyed «Requires: …» | nessun cambio alla regola preview |
| Coverage | mini-panel membri×canali nel party-select/approach screen | v0 semplificato: badge sui membri |
| Testo | tier T1 (channel-verb nel verdict) sui check core; T2 solo sul pivot/failure iconico | channelOverrides nel brief authored |

## 3. Non-scope v0

- Generazione scenari (resta orbita PLAN-026/S5 — i canali entrano nel
  contract come sketch §11.9, implementazione dopo validazione v0);
- narrativa per-canale completa (tier T2+ solo dove serve);
- coverage matrix completa stile XCOM (v0 = badge);
- nuove quest: solo retrofit goblin;
- rebalance delle stat del balancer.

## 4. Task draft

- **T-001** Config `gimmickChannels` sulla quest goblin: marcatura
  `coreCheck` sui nodi che scrivono `alarm`, def `CheckChannel` per i 3
  approcci (stat, eligibility, costo, oddsProfile, failureProfile,
  failureTells, label i18n). Zod schema nuovo modulo config.
- **T-002** Gate capability → mappatura concreta su skill/equip/stats del
  roster reale (decisione progettuale da appuntare nel plan: skill v12
  vs item vs soglia CHA; verificare cosa esiste già nel dominio).
- **T-003** Run state: `approachLock` + `exceptionBudget`; UI scelta
  approccio all'avvio (estende F3 esistente) con coverage badge sui
  membri.
- **T-004** Motore: risoluzione check su canale del lock (o eccezione
  consumata), roll per membro designato, applicazione failureProfile
  per-canale su `alarm` + side-effect (rivelato/lockout).
- **T-005** Preview check core: odds + risk tag + costo per canale
  disponibile; locked greyed con `requiresLabel` i18n.
- **T-006** Testo: `channelOverrides` authored sui check core goblin
  (T1 default, T2 sul pivot); validator minimo `mustNotImply` /
  `failureTells` sui contenuti authored (no LLM in v0 — testo authored).
- **T-007** MC/simulazione: policy always-X / party-locked /
  adaptive-pick-best sul grafo goblin; report degeneracy/usage/win-rate.
- **T-008** Playtest Director con metrica: ownership vs regret sul lock;
  domanda attribuzione («sai spiegare perché hai perso X?»);
  osservazione espressivo-vs-strumentale (OPEN-018).

## 5. Acceptance

- Le 3 run (una per approccio, con party adatti) completano la quest con
  esperienza percepibilmente diversa sui check core.
- MC: nessun canale degenere (>70-80% usage adaptive) né morto
  (mai scelto) sulle comp realistiche.
- Preview rispetta R-108 (odds+costo esatti) e i locked sono leggibili
  con requisito.
- Playtest Director: verdetto ownership-vs-regret registrato; se regret
  domina → la regola §7 torna `proposta` e si rivede il binding
  (reversibilità dichiarata).
- Safeguard standard: lint/test/build:check/kanban:lint sullo scope.

## 6. Rischi noti (dalla ricerca)

- **Alarm = failure counter dissociativo** (lezione 4e): se i 3 canali
  alimentano lo stesso contatore con lo stesso effetto, la varietà è
  cosmetica → i failureProfile devono divergere davvero (T-004).
- **Reskin collapse**: se i canali differiscono solo nella stat, collassa
  a «stat più alta» → ≥2 assi di differenziazione enforced in review
  T-001.
- **Channel FOMO sul lock**: mitigare con coverage panel + eccezione.
- **Expressività vs numeri esatti** → OPEN-018, misurata in T-008.

## 7. Aperto da decidere in sede di plan review

1. Gate arcano: skill equip (v12) vs item vs soglia INT — dipende dallo
   stato reale delle skill nel dominio (T-002 lo verifica).
2. Il canale sociale della quest goblin ha senso narrativo? (camuffarsi
   da goblin vs corrompere una guida — serve check fiction con il
   Director in authoring).
3. Nome UX dell'«approccio» — evitare collisione col concetto di
   approccio di scena (§3.1 architettura): candidati `piano`,
   `strategia`, `via`.

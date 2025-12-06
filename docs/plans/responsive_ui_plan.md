# Responsive UI (Mobile + Desktop) - Implementation Plan

> **Obiettivo:** Allineare tutte le pagine dell'app (a partire da BalancerNew) a un'unica strategia responsive mobile+desktop, ottimizzata per il tema **Gilded Observatory**, alta densità informativa e buone performance su device mobili.

**Creato:** 2025-12-06  
**Stato:** 📋 Planned (Phase R0)  
**Priorità:** Alta  
**Effort stimato:** 2–3 giorni per foundation + rollout sulle pagine core

---

## 1. Contesto & Problema

- Il progetto è pensato sia per **desktop** che per **mobile** (PWA / Tauri mobile).
- La UI attuale è principalmente ragionata per desktop, con una resa mobile ancora **troppo grande / poco densa** in alcune schermate (es. BalancerNew).
- Esistono già linee guida mobile (`MOBILE_GUIDELINES.md`), ma servono:
  - un **piano operativo** per gestire *insieme* mobile e desktop;
  - un **workflow ripetibile** per ogni nuova pagina/component;
  - regole esplicite per come l'AI/agents devono progettare e testare la UI.

**Decisione chiave:** passare a un approccio **mobile-first + desktop-enhanced**, con:
- tipografia fluida ma controllata,
- densità più alta su mobile (tool di lavoro, non app consumer),
- layout a singola colonna su schermi piccoli e layout a più colonne su desktop.

---

## 2. Principi di Design Mobile+Desktop

### 2.1 Mobile-First + Progressive Enhancement

1. **Mobile come baseline**
   - Ogni nuova pagina nasce prima come layout mobile (≤ 640px):
     - 1 colonna,
     - testo compatto,
     - controlli essenziali visibili senza scroll eccessivi.
2. **Desktop come enhancement**
   - Aggiungere solo su breakpoint `sm:`/`md:`/`lg:`:
     - più colonne,
     - pannelli affiancati (grafici + tabelle),
     - spazio extra e micro-dettagli.
3. **Responsive, non duplicato**
   - Preferire una **sola** UI responsive; usare UI totalmente separate (mobile vs desktop) solo se inevitabile.

### 2.2 Tipografia & Densità

1. **Scala tipografica compatta** (tool di analisi, non blog):
   - Body / testo lungo: 16px (1rem) raccomandato.
   - UI densa (etichette, valori, chip): 13–14px accettati se contrasto alto.
   - Mai scendere sotto 12px per testo leggibile.
2. **Tipografia fluida (clamp)**
   - Definire pochi token globali (es. `text-ui-xs`, `text-ui-sm`, `text-ui-md`) basati su `clamp()` nel `tailwind.config.js`.
   - Ogni pagina usa questi token, non valori ad-hoc.
3. **Densità per device**
   - Mobile: modalità **compact** di default (padding piccoli, gap ridotti, font leggermente più piccoli).
   - Desktop: più aria e leggibilità, ma sempre coerente con un tool professionale (no spacing esagerato).

### 2.3 Layout & Componenti

1. **Layout a colonna singola su mobile**
   - Stack verticale per card, pannelli, tabelle.
   - Evitare scroll orizzontale; se necessario, usare wrapper scrollabile con hint visivo.
2. **Layout multi-colonna su desktop**
   - 2–3 colonne per affiancare:
     - controlli (slider / input),
     - risultati (numeri chiave),
     - grafici / breakdown.
3. **Componenti riusabili**
   - Continuare a usare componenti Gilded Observatory (card, button, input, slider) con props per:
     - densità (`compact` / `comfortable`),
     - variante (`mobile` / `desktop` se necessario).

---

## 3. Workflow Obbligatorio per Nuove Pagine

Ogni **nuova pagina** o refactor UI deve seguire questo flusso:

1. **Definizione layout mobile (wireframe mentale o sketch veloce)**
   - Quali blocchi principali? (es. toolbar, lista card, dettagli, grafici).
   - Ordine di importanza su schermo piccolo.

2. **Implementazione mobile-first (Tailwind)**
   - Classi senza breakpoint = comportamento mobile.
   - Esempi (concettuali):
     - testo: `text-[10px]`–`text-xs` per label tecniche, `text-sm` per contenuto principale;
     - padding: `px-2 py-1` per controlli;
     - layout: `flex flex-col gap-2`, `grid grid-cols-1 gap-2`.

3. **Estensione per desktop**
   - Aggiungere solo ciò che serve sui breakpoint:
     - `sm:` per tablet,
     - `md:` per tablet landscape,
     - `lg:` per desktop.
   - Esempi (concettuali):
     - `flex-col md:flex-row` per split layout;
     - `text-xs sm:text-sm md:text-base` per font che crescono leggermente.

4. **QA estetico cross-device (obbligatorio)**
   - Verificare sempre la pagina su almeno:
     - 📱 iPhone 14 Pro (393×852) o simile,
     - 💻 Desktop ~1440×900.
   - Controllare:
     - dimensione font,
     - densità (quanto contenuto visibile `above the fold`),
     - leggibilità e tap targets.

5. **Refine & snapshot**
   - Dopo gli aggiustamenti, fare uno snapshot mentale (o screenshot) della UI mobile+desktop che diventa nuovo riferimento.

Questo workflow è valido anche per l'AI: ogni volta che viene creata o modificata una pagina UI, deve essere pensata **esplicitamente** in versione mobile e desktop, non solo “responsive in teoria”.

---

## 4. Testing & Metriche

### 4.1 Testing manuale

- **DevTools**
  - Chrome/Safari device toolbar:
    - iPhone 14 Pro,
    - Pixel 7,
    - iPad Air,
    - Desktop 1440–1600px.
- **Checklist visiva rapida**
  - [ ] Nessun overflow orizzontale su mobile.
  - [ ] Font leggibili senza zoom manuale.
  - [ ] Touch targets ≥ 44×44px dove si interagisce spesso.
  - [ ] Niente interazioni solo hover.

### 4.2 Testing automatico (estendibile)

- Estendere gradualmente i test Playwright esistenti per:
  - screenshot regression principali per BalancerNew (mobile + desktop);
  - basic layout assertions (elementi fondamentali visibili / non tagliati).
- In futuro: snapshot visuali per pagine core.

### 4.3 Metriche di successo

- **Usabilità mobile**
  - Nessuna pagina core richiede zoom manuale per l'uso normale.
  - Nessun testo “esageratamente grande” che riduca troppo la densità informativa.
- **Coerenza**
  - Stessa gerarchia visiva (titoli, sottotitoli, label) tra pagine core.
- **Performance**
  - Nessun lag evidente anche su device medi, con focus su BalancerNew.

---

## 5. Rollout Plan

### 5.1 Phase R0 – Foundation (tokens & linee guida)

- **Obiettivi**
  - Definire set minimo di token tipografici e di spacing per mobile+desktop.
  - Aggiornare `MOBILE_GUIDELINES.md` con il nuovo workflow mobile+desktop.
  - Aggiornare `MASTER_PLAN.md` per collegare questo documento alla sezione "UI Optimization Page-by-Page".

- **Deliverables**
  - Questo file `responsive_ui_plan.md`.
  - Riferimenti incrociati da:
    - `MASTER_PLAN.md`,
    - `MOBILE_GUIDELINES.md`.

### 5.2 Phase R1 – Core Pages (Tier 1)

Pagine prioritarie:
1. **BalancerNew** (questa è la *prima pagina* su cui applicare le nuove regole):
   - Revisione completa di:
     - layout mobile (stack card, toolbar, editors),
     - tipografia (font troppo grandi su mobile → scala più compatta),
     - densità (più informazioni visibili senza scroll infinito).
2. **Spell Creator (nuovo)**
   - Applicare lo stesso set di regole al nuovo creator config-driven.

Deliverables R1:
- BalancerNew ottimizzato per mobile+desktop secondo queste linee guida.
- Eventuali aggiustamenti ai componenti condivisi (toolbar, card, editor) per supportare meglio la modalità compact.

### 5.3 Phase R2 – Altre pagine core

- Archetype Balancer dashboard.
- Scenario UI (quando attiva).
- Altre viste di analisi/statistiche.

Obiettivi:
- Evitare UI frammentata: tutte le pagine chiave devono "sentirsi" parte della stessa suite Gilded Observatory sia su mobile che su desktop.

---

## 6. Implicazioni per lo Sviluppo (umano + AI)

1. **Ogni modifica UI è anche una modifica mobile**
   - Non è accettabile introdurre una nuova view solo pensata per desktop.
   - L'AI deve sempre proporre classi Tailwind e layout adatti anche a mobile.

2. **Review estetica esplicita**
   - Quando si chiude una task UI, bisogna dichiarare che la pagina è stata verificata su mobile+desktop (anche solo manualmente) e indicare eventuali limiti noti.

3. **Documentazione sempre aggiornata**
   - Ogni volta che emergono nuovi pattern (es. tipografia, componenti densi, nuovi breakpoints), vanno integrati qui o in `MOBILE_GUIDELINES.md`, non duplicati in mille commenti di codice.

---

## 7. Collegamenti

- `MOBILE_GUIDELINES.md` – Regole dettagliate mobile-first e testing mobile.
- `docs/MASTER_PLAN.md` – Sezione "UI Optimization Page-by-Page (Core First)".
- `src/hooks/useMediaQuery.ts` – Hook per breakpoints e touch detection (da usare per eventuali differenze di comportamento mobile/desktop).

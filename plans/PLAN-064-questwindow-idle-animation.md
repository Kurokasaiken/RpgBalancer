# PLAN-064: QuestRunWindow — animazione idle post-entry immagine (R-231 Plan D2)

**Status:** `in corso` — 2026-10-20: implementazione consolidata (postSettle, teatro vivo 23–26% px/s nella scena 1, reduced-motion statico — audit F3 §10); scene 2–3 quasi ferme da ricatturare dopo il fix Pixi (PLAN-067 T-000). Resta separato da PLAN-067; chiusura: eye-check Director.
**Richiesta:** `R-231` (#9 — «la parte + importante» del Director)
**Parent/Relazioni:** dibattito `20261019-r231-questwindow` (`artifact-r003.md`
sha `c7236b291f62…`); sequenza PLAN-049: … → PLAN-063 → **PLAN-064** (ultimo).
Dipendenza: #9 si integra sull'esito di PLAN-061 (#8) — ma la preview può usare
un'immagine 2.4 rappresentativa/placeholder, quindi il ruling del linguaggio non
aspetta l'asset finale.

---

## 0. Fatto verificato

`KenBurnsDolly`/`cinematicEntryForSrc` esistono e animano l'**ingresso**; dopo
l'entry cue **non esiste animazione idle/ambient** — è assente *by design*, non
un bug. Quindi #9 = definire un nuovo linguaggio di animazione post-entry
→ visual-fork con preview su `/theater-lab` (la superficie esiste per questo).

## 1. Scope

1. Definire il linguaggio di animazione idle post-entry (es. respirazione
   lenta, drift impercettibile, parallasse interna, reveal progressivo di
   dettaglio — da prototipare in preview).
2. L'animazione inizia dopo che l'entry cue completa — senza re-innescarlo.
3. `prefers-reduced-motion` rispettato (ruling + BV).
4. Integrazione sull'asset finale 2.4 (da PLAN-061); parametri in config Zod.

## 2. Task

- **T-001** — Preview `/theater-lab` con ≥2 linguaggi candidati su placeholder
  2.4 (parte anche prima che D1 chiuda).
- **T-002** — Ruling Director sul linguaggio (può condividere sessione con la
  review di PLAN-063 — entrambe fork-review).
- **T-003** — Implementazione su asset finale (post PLAN-061), parametri in
  config Zod.
- **T-004** — Doc componente + doc integrazione.

## 3. Acceptance / BV

- D2-1: rAF frame-sampling (precedente `gameInvasionHandover`): dopo la fine
  dell'entry cue l'immagine continua a muoversi (pixel/posizioni campionate
  cambiano frame-to-frame) — prova eseguibile di "animazione dopo l'entrata".
- D2-2: l'idle non ri-innesca l'entry cue (nessun salto/replay).
- D2-3: con `prefers-reduced-motion` attivo l'idle è soppressa/ridotta.
- D2-4: parametri in config Zod, nessun hardcode; stringhe via i18n.
- T-04: testimone visivo — catture/video headless a più `t` su `/theater-lab`.

## 4. Stop-condition

Ruling linguaggio registrato + bundle PASS + testimone visivo. È l'ultimo
piano della sequenza R-231 — alla sua chiusura il ciclo dei 9 difetti è chiuso.

## 5. File chiave (trigage)

- `QuestRunWindow.tsx` (theatre stage, `KenBurnsDolly`, `cinematicEntryForSrc`)
- `src/ui/idleVillage/skins/primitives/cinemaFx.tsx` (primitive cinematiche)
- `questAtmosphereFx.ts` / config cinematiche (pattern authoring kit)
- `/theater-lab` (preview surface)

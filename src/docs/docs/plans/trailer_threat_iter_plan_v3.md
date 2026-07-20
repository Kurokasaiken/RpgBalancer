# TrailerThreatIter Plan v3 — World Presence Teaser

> **Task ID:** TRAILER-THREAT-ITER-V3  
> **Scope:** Trailer-only marketing asset (`/trailer-threat-iter`)  
> **Status:** draft  
> **Owner:** Strategist → Coordinator → Execution Agent  
> **Plan Reference:** `trailer_vertical_slice_plan.md`, `trailer_vertical_slice_implementation_plan.md`, `trailer_threat_iter_rework_plan.md` (v2 historical)  
> **Visual References:** `/visual-fidelity-lab`, `/minimal-poi`, `/poi-detail-verification`

---

## 1. Purpose

`ThreatPresence` rende sempre visibile la principale pressione sistemica di Wanderlust.

Il giocatore non costruisce "in generale": costruisce, assegna ed esplora sapendo che una minaccia concreta sta maturando. `ThreatPresence` mantiene questa pressione viva durante tutta la partita, anche quando è compressa.

---

## 2. Promise to the player

> Se `ThreatPresence` è visibile, esiste una minaccia concreta che il giocatore può ancora influenzare.

Questa promessa separa `ThreatPresence` da una notifica. Non annuncia un evento: rappresenta una conseguenza reale nel mondo.

---

## 3. Identity — One entity, variable density

`ThreatPresence` è **un'unica entità** che cambia la quantità di informazione mostrata, non la sua identità.

- **Expanded** — crest, faction, title, location, time-left, optional details/rewards.
- **Compact** — crest, time-left.
- **Minimal** — crest, urgency signal.

The same object. The same icon. The same threat. Only the information density changes.

Principle:
> `ThreatPresence` compresses information, it does not become a different component.

---

## 4. Lifecycle — states of the world, not of the widget

States describe what the threat is doing in the world, not how the UI animates.

1. **Not Present** — the world lives, the threat does not exist yet.
2. **Manifesting** — the threat enters the world (silhouette, sound, sign, motion from the edge).
3. **Occupying** — the threat has claimed a place; it is now a real presence on the map.
4. **Persistent** — the threat remains, compressed but recoverable, as long as it matters.

No state called "docking". Docking is a transition, not a state.

---

## 5. World Bond — always a real presence

`ThreatPresence` rappresenta una presenza fisica del mondo. Per questo mantiene sempre una relazione visiva con la sua origine.

This is a principle, not a rule. Concrete interactions (hover highlights POI, click zooms, pin to corner, minimap badge, etc.) are decided during prototyping. The north star is: the player must never feel that the widget exists independently from the map.

---

## 6. Recoverability, not "always on screen"

The real constraint is not that the component must be visible every second, but that the player must be able to recover the threat state in less than one second.

It can be:

- visible,
- compact in a corner,
- minimized to a pin,
- hidden behind a single tap/hover,
- represented by a map pulse.

The only forbidden state is: **the player forgets that the threat exists**.

---

## 7. Timer — one principle only

> Lo stato del timer deve essere leggibile anche senza leggere il numero.

The visual shape of urgency (flames, cracks, runes, color, pulse) will be designed later, after the static frames pass the Trailer Pause Test.

---

## 8. First 3 seconds

The first 3 seconds of the animation show **only the living map**.

No UI. No threat. No title. No vignette overlay. No dust cloud. Nothing except the world breathing.

The exact duration is an editorial decision and will be tuned during video editing.

---

## 9. Acceptance Tests

These tests are the first section of the document because they are the filter for every decision.

### 9.1 Trailer Pause Test

Pause the trailer on any frame. A viewer who has never seen the game must answer immediately:

1. **Cosa sta succedendo?**
2. **Perché è importante?**
3. **Cosa dovrà fare il giocatore?**

If any answer is missing, the frame fails.

### 9.2 Mute Test

Play the first 5 seconds muted. The viewer must still understand genre, threat, and stakes.

### 9.3 Failure Test

Remove `ThreatPresence` entirely from the trailer. If the viewer still understands that the game revolves around a time pressure, `ThreatPresence` is redundant. If not, `ThreatPresence` is doing its job.

### 9.4 Same-Entity Test

Pause during the transition from `Occupying` to `Persistent`. The viewer must recognize that the compact element is the same object as the expanded element, only compressed.

### 9.5 Recoverability Test

At any moment after the threat has appeared, the player must be able to recover the threat state in less than one second without reading text.

---

## 10. Prototype Roadmap

### Phase 1 — Static frames

Produce 4 static frames (no animation):

1. **Not Present** — living map.
2. **Manifesting** — threat entering the world.
3. **Occupying** — `ThreatPresence` expanded, tied to the POI.
4. **Persistent** — `ThreatPresence` compressed, still tied to the map.

Run the Trailer Pause Test and Failure Test on each frame. Iterate until all pass.

### Phase 2 — Static-to-static transition

Connect the frames with the simplest possible transition. The only question is:

> Does it look like the same entity changing density?

If not, fix the identity before adding polish.

### Phase 3 — Polish

Only after Phase 2 passes:

- timer visual urgency,
- easing and motion,
- audio,
- map reactions,
- particles (if needed).

---

## 11. Config skeleton

Only stable, high-level values. No implementation details.

```typescript
trailerConfig.threat.presence = {
  states: ['notPresent', 'manifesting', 'occupying', 'persistent'],
  principle: {
    identity: 'same entity, variable density',
    worldBond: 'always visually connected to origin',
    recoverability: '< 1s to recover threat state',
    timer: 'readable without reading the number',
  },
  firstSeconds: {
    content: 'living map only',
    duration: 'editorial, editable',
  },
  acceptanceTests: [
    'trailerPauseTest',
    'muteTest',
    'failureTest',
    'sameEntityTest',
    'recoverabilityTest',
  ],
};
```

---

## 12. Handoff to Coordinator

Coordinator converts this plan into an execution prompt for an agent with `idle-village-task` skill and `@trailer-only` exemption.

The agent must:

1. Produce the 4 static frames in `/trailer-threat-iter` (or in a temporary test page).
2. Run the Acceptance Tests without animation.
3. Only after the tests pass, implement the simplest `Expanded → Compact` transition.
4. Avoid any timer visual design, particles, or audio until Phase 2 is approved.

Required safeguards: `npm run lint -- src/ui/idleVillage/trailer/`, `npm run build:check`, `npm run kanban:lint`.

Evidence log: `test-results/TRAILER-THREAT-ITER-V3-<YYYY-MM-DD>.log`.

# poi-zanara — fork visivo POI (PLAN-117 T1.1/T1.2)

- Run gen: `mind-weaver/.mw/runs/poi-zanara-gen` — conversazione gemini
  `https://gemini.google.com/app/d1487b108c6e4273` (2026-11-11).
- `prompts/` — 3 direzioni (A smalto smeraldo / B oro inciso / C gem heart).
  Sagoma fissata = quest (tondo+coda); icona segnaposto montagna+bandierina.
- `gen/<dir>/raw-*.png` — fetch via canvas readback (blob same-origin,
  niente UI cotta dentro). `gen-*.png` = fallback screenshot di hud-gen-fetch (contaminato UI, non usare).
- `refs/current-sigillo-quest.png` — Sigillo attuale da /gameOld.
- `card/` — compositi `compose-card.py`: keyed dal navy (#0a1622), sui crop
  F0 villaggio-zmid + canyons-zfloor, taglie 32/44/55/69, colore+grigio.

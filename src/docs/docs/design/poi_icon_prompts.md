# Icone dei POI — prompt (quest, job, event)

> **⛔ SUPERATO dal 2026-10-13 (PLAN-058 T2.6).** Non usare questi prompt. Smentiti dalle misure di R-177
> (la famiglia letta dal colore del bordo fallisce sui biomi), glifi di azione invece che di luogo (contro D1), oro lucido (contro bibbia §11.3).
> Al loro posto: bibbia §11 (`src/docs/docs/plans/art_direction_plan.md`), registro e kit in
> `src/docs/docs/art-direction/icons/`, prompt generati in `.mw/specs/icons/<id>/prompt.md`
> (`python scripts/gen-icon-prompts.py`, lint `python scripts/lint-icon-prompts.py`).
> Conservato solo come memoria storica.

Dove vanno: `public/assets/ui/poi/icon_quest.webp`, `icon_job.webp`, `icon_event.webp` (512×512, sfondo trasparente). Il medaglione le carica da solo
(`usePoiTypeIcon`); finché il file manca resta la croce. Sulla mappa il glifo è ~24 px: una sola sagoma, grossa, leggibile da lontano.

**Regole comuni (da incollare in ogni prompt):**
> Single centered emblem for a game map medallion, front view, perfectly symmetrical composition, one bold simple silhouette, no text, no border, no frame, no background (fully transparent). Embossed antique gold (#f0cf6a highlight, #b8861f midtone, #3a2606 deepest edge), soft top-left light, crisp engraved edge, slightly worn metal, sculptural and clean — no brush strokes, no leaves, no ornamental flourishes, no extra small objects. Must stay readable when shrunk to 24 px. 512x512, transparent PNG.

## Quest — "chiamata all'impresa"
> [regole comuni] The emblem is a single upright sword, blade pointing up, short broad crossguard, simple pommel; the blade is thick and slightly tapered so it reads as a strong vertical bar. Nothing else.

## Job — "lavoro"
> [regole comuni] The emblem is a single smith's hammer tilted 45 degrees, heavy rectangular head, short thick handle, shown as one solid silhouette with a few engraved facet lines. Nothing else.

## Event — "evento / presagio"
> [regole comuni] The emblem is an eight-pointed star burst: four long points (up, down, left, right) and four short diagonal points around a small solid round center, perfectly symmetrical. Nothing else.

Perché questi tre: spada = impresa, martello = lavoro, stella = qualcosa che sta per accadere. Il colore della famiglia lo dà già il bordo del medaglione (quest oro, job verde acqua, event corallo): il glifo resta oro per tutte e tre, così la famiglia si legge dal bordo e il tipo dalla sagoma (ridondanza forma + colore).
